// Draft backup of a Multi-Entry in the browser (NFR-DA-REL-10): the rows not yet saved are kept, versioned and
// timestamped, so a refresh, a crash or a lost connection never loses them. On return the draft is restored with
// a notice; a row that changed on the server since the draft was taken is a conflict, resolved by the user.
// Pure functions over a Storage-like object (getItem, setItem, removeItem).

export const DRAFT_VERSION = 1;
const keyOf = id => `cs.draft.${id}`;

/** Saves the pending rows (changed, new, in error) with the server stamp each one was based on. */
export function saveDraft(storage, id, rows, { now = Date.now() } = {}) {
  if (!storage || !id) return null;
  const pending = rows.filter(r => r.status === 'dirty' || r.status === 'error' || r.status === 'queued' || (!r.id && r.status !== 'clean'));
  try {
    if (!pending.length) { storage.removeItem(keyOf(id)); return null; }
    const draft = { v: DRAFT_VERSION, savedAt: now, rows: pending.map(r => ({ _key: r._key, id: r.id || null, data: r.data, base: r.base ?? null, errors: r.errors || {} })) };
    storage.setItem(keyOf(id), JSON.stringify(draft)); return draft;
  } catch { return null; } // storage full or blocked: the rows stay on screen with their pending status
}
export function loadDraft(storage, id) {
  try { const d = JSON.parse(storage?.getItem(keyOf(id)) || 'null'); return d && d.v === DRAFT_VERSION && Array.isArray(d.rows) && d.rows.length ? d : null; } catch { return null; }
}
export function clearDraft(storage, id) { try { storage?.removeItem(keyOf(id)); } catch { /* blocked storage */ } }

/**
 * Merges a draft into the rows loaded from the server. Returns the rows (draft rows marked dirty) and the
 * conflicts: draft rows whose server record changed (other stamp) or disappeared since the draft was taken.
 */
export function mergeDraft(serverRows, draft) {
  if (!draft) return { rows: serverRows, conflicts: [], restored: 0 };
  const byId = new Map(serverRows.filter(r => r.id).map(r => [r.id, r]));
  const conflicts = []; const used = new Set(); let rows = [...serverRows];
  for (const d of draft.rows) {
    if (d.id) {
      const cur = byId.get(d.id);
      if (!cur) { conflicts.push({ key: d._key, id: d.id, kind: 'deleted', mine: d.data, theirs: null }); continue; }
      if (d.base != null && cur.base != null && String(d.base) !== String(cur.base)) conflicts.push({ key: cur._key, id: d.id, kind: 'changed', mine: d.data, theirs: cur.data });
      rows = rows.map(r => (r.id === d.id ? { ...r, data: { ...d.data }, status: 'dirty', errors: d.errors || {}, draftBase: d.base } : r)); used.add(d.id);
    } else rows.push({ _key: d._key, id: null, data: { ...d.data }, status: 'dirty', errors: d.errors || {}, base: null });
  }
  return { rows, conflicts, restored: draft.rows.length };
}
/** Applies the user's choice for one conflict: keep mine (overwrite) or take theirs (server version). */
export function resolveConflict(rows, conflict, choice) {
  if (choice === 'theirs') return conflict.theirs ? rows.map(r => (r._key === conflict.key ? { ...r, data: { ...conflict.theirs }, status: 'clean', errors: {} } : r)) : rows.filter(r => r._key !== conflict.key);
  if (conflict.kind === 'deleted') return [...rows.filter(r => r._key !== conflict.key), { _key: conflict.key, id: null, data: { ...conflict.mine }, status: 'dirty', errors: {}, base: null }];
  return rows.map(r => (r._key === conflict.key ? { ...r, data: { ...conflict.mine }, status: 'dirty', force: true } : r));
}
