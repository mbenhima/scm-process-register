// Shared state of the Multi-Entries on screen: the Leave Guard registry (FR-DA-MRE-32), the
// table view preferences of each user and table (TableViewPreference: columns, widths, sort,
// density, wrap, view, workspace zoom, last paste mapping) and the Draft Backups (FR-DA-MRE-26).
const registry = new Map();
const listeners = new Set();
const notify = () => listeners.forEach(fn => fn());

/** A Multi-Entry registers how to read its pending rows and how to save or discard them. */
export function registerEntry(id, api) { registry.set(id, api); notify(); return () => { if (registry.get(id) === api) registry.delete(id); notify(); }; }
export function pendingEntries() { return [...registry.values()].map(e => ({ ...e, pending: e.pending(), errors: e.errors() })).filter(e => e.pending > 0); }
export function subscribeEntries(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export const changed = notify;

// ---------------------------------------------------------------- preferences
const PREF = (id) => `dms.table.${id}`;
let serverSync = null; // set by the application: (tables) => Promise
const all = {};
export function setPrefsSync(fn, initial) {
  serverSync = fn;
  if (initial && typeof initial === 'object') for (const [k, v] of Object.entries(initial)) if (!(k in all)) all[k] = v;
}
export function readTablePrefs(id) {
  try { const v = JSON.parse(localStorage.getItem(PREF(id)) || 'null'); if (v) return v; } catch { /* storage blocked */ }
  return all[id] || {};
}
let syncTimer = null;
export function writeTablePrefs(id, patch) {
  const next = { ...readTablePrefs(id), ...patch };
  all[id] = next;
  try { localStorage.setItem(PREF(id), JSON.stringify(next)); } catch { /* storage blocked */ }
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => { serverSync?.({ ...all }); }, 1500);
  return next;
}

// ---------------------------------------------------------------- Draft Backup
const DRAFT = (user, id) => `dms.draft.${user}.${id}`;
export function readDraft(user, id) { try { return JSON.parse(localStorage.getItem(DRAFT(user, id)) || 'null'); } catch { return null; } }
export function writeDraft(user, id, draft) { try { if (draft) localStorage.setItem(DRAFT(user, id), JSON.stringify(draft)); else localStorage.removeItem(DRAFT(user, id)); } catch { /* storage full or blocked: the rows stay pending on screen */ } }
