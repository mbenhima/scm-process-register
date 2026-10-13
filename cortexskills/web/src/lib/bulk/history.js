// Undo and redo of a Multi-Entry (Table 4.49-1: Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z). Pure: a history holds entries, and
// applyEntry(rows, entry, direction) returns the rows after undoing (-1) or redoing (+1) one entry.
//
// Entries: { kind: 'set', key, col, before, after } — a cell changed;
//          { kind: 'add', rows: [{ row, index }] } — rows added (paste, duplicate, insert, fill);
//          { kind: 'delete', rows: [{ row, index }] } — rows deleted;
//          { kind: 'batch', entries: [...] } — several changes as one step (bulk set, fill down, paste).

export function createHistory(limit = 200) {
  let past = [], future = [];
  return {
    push(entry) { if (!entry) return; past.push(entry); if (past.length > limit) past = past.slice(-limit); future = []; },
    undo() { const e = past.pop(); if (e) future.push(e); return e || null; },
    redo() { const e = future.pop(); if (e) past.push(e); return e || null; },
    canUndo: () => past.length > 0, canRedo: () => future.length > 0,
    clear() { past = []; future = []; },
    get size() { return { past: past.length, future: future.length }; },
  };
}

const setCell = (rows, key, col, value) => rows.map(r => (r._key === key ? { ...r, data: { ...r.data, [col]: value }, status: r.status === 'saving' ? r.status : 'dirty' } : r));
const insertAt = (rows, list) => { const n = [...rows]; for (const { row, index } of [...list].sort((a, b) => a.index - b.index)) n.splice(Math.min(index, n.length), 0, row); return n; };
const removeKeys = (rows, list) => { const ks = new Set(list.map(x => x.row._key)); return rows.filter(r => !ks.has(r._key)); };

/** Rows after undoing (dir = -1) or redoing (dir = +1) an entry. */
export function applyEntry(rows, entry, dir) {
  switch (entry?.kind) {
    case 'set': return setCell(rows, entry.key, entry.col, dir < 0 ? entry.before : entry.after);
    case 'add': return dir < 0 ? removeKeys(rows, entry.rows) : insertAt(rows, entry.rows);
    case 'delete': return dir < 0 ? insertAt(rows, entry.rows) : removeKeys(rows, entry.rows);
    case 'batch': { let r = rows; const list = dir < 0 ? [...entry.entries].reverse() : entry.entries; for (const e of list) r = applyEntry(r, e, dir); return r; }
    default: return rows;
  }
}
/** The row keys an entry touches (to save them again, or to announce the change). */
export function keysOf(entry) {
  if (!entry) return [];
  if (entry.kind === 'set') return [entry.key];
  if (entry.kind === 'batch') return [...new Set(entry.entries.flatMap(keysOf))];
  return entry.rows.map(x => x.row._key);
}
