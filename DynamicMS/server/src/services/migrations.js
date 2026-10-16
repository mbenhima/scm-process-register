// Data migrations of an upgrade (NFR-DA-MAINT-11): run in place at the first start, each
// idempotent, versioned by its identifier, run once and recorded with what it changed. An
// upgrade never requires the data to be reseeded; restart the server after replacing the files.
import crypto from 'node:crypto';
import { all, get, run, tx, now, J, P } from '../db.js';
import { applyE2eRenames } from '../catalog/renames.js';

export const MIGRATIONS = [];
export function defineMigration(id, fn) { MIGRATIONS.push({ id, fn }); }

defineMigration('2026.10.1-e2e-process-names', () => {
  const n = applyE2eRenames();
  return n ? `${n} catalog entries and document titles renamed` : 'names already current';
});

// Row Stamps (FR-DA-MRE-26): every row of a record table, a template list and a register
// carries its stamp so that a save based on an older version is detected.
defineMigration('2026.10.2-row-stamps', () => {
  let steps = 0; let rowsStamped = 0;
  const stamp = (list, at) => list.map(r => { if (!r || typeof r !== 'object' || Array.isArray(r) || (r._rid && r._stamp)) return r; rowsStamped++; return { ...r, _rid: r._rid || crypto.randomUUID(), _stamp: r._stamp || at }; });
  for (const e of all("SELECT id, fields, updated_at FROM step_exec WHERE fields LIKE '%[{%'")) {
    const f = P(e.fields) || {};
    let changed = false;
    for (const [k, v] of Object.entries(f)) {
      if (!Array.isArray(v) || !v.length || typeof v[0] !== 'object' || v[0] === null || k === 'records') continue;
      const before = rowsStamped; f[k] = stamp(v, `0-${(e.updated_at || '').replace(/\D/g, '').slice(0, 14) || '0'}`); if (rowsStamped !== before) changed = true;
    }
    if (changed) { run('UPDATE step_exec SET fields=? WHERE id=?', J(f), e.id); steps++; }
  }
  let lists = 0;
  for (const t of all('SELECT id, content FROM project_templates WHERE content IS NOT NULL')) {
    const c = P(t.content);
    if (!c?.lists) continue;
    let changed = false;
    for (const [k, v] of Object.entries(c.lists)) { if (Array.isArray(v)) { const before = rowsStamped; c.lists[k] = stamp(v, '0'); if (rowsStamped !== before) changed = true; } }
    if (changed) { run('UPDATE project_templates SET content=? WHERE id=?', J(c), t.id); lists++; }
  }
  run('UPDATE registers SET updated_at=created_at WHERE updated_at IS NULL');
  return `${rowsStamped} rows stamped in ${steps} steps and ${lists} templates; register entries dated`;
});

/** Runs the migrations not yet recorded, in order; returns those run now. */
export function runMigrations() {
  const done = new Set(all('SELECT id FROM schema_migrations').map(r => r.id));
  const ran = [];
  let seq = get('SELECT MAX(seq) n FROM schema_migrations')?.n || 0;
  for (const m of MIGRATIONS) {
    if (done.has(m.id)) continue;
    let summary;
    tx(() => {
      summary = String(m.fn() ?? 'done');
      run('INSERT INTO schema_migrations(id, seq, applied_at, summary) VALUES(?,?,?,?)', m.id, ++seq, now(), summary);
    });
    ran.push({ id: m.id, summary });
  }
  return ran;
}
