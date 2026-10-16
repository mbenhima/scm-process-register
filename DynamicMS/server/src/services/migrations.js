// Data migrations of an upgrade (NFR-DA-MAINT-11): run in place at the first start, each
// idempotent, versioned by its identifier, run once and recorded with what it changed. An
// upgrade never requires the data to be reseeded; restart the server after replacing the files.
import crypto from 'node:crypto';
import { all, get, run, tx, now, J, P } from '../db.js';
import { applyE2eRenames } from '../catalog/renames.js';
import { uid } from '../db.js';
import { seedLibrary, setLinks, deriveFields } from './aiusecases.js';
import { defaultSpec, specOf, specCompleteness } from './aiprompt.js';

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

// AI governance of revision 1.9 (FR-DA-AI-01, -07, -13, -23, -25; FR-DA-AIP-07): the use cases of
// the places, links from the stored step, derived fields stored, complete seeded specifications,
// and the usage log made append-only (Proposed entry + one entry per decided outcome).
defineMigration('2026.10.3-ai-governance', () => {
  let added = 0; let linked = 0; let derived = 0; let specs = 0; let split = 0;
  for (const o of all('SELECT id FROM organizations')) added += seedLibrary(o.id).length;
  for (const u of all('SELECT * FROM ai_usecases')) {
    if (!get('SELECT 1 FROM ai_usecase_links WHERE usecase_id=?', u.id) && (u.linked_step || u.linked_mp)) { setLinks(u.org_id, u.id, u.linked_step ? [{ type: 'step', id: u.linked_step, primary: true }] : [{ type: 'mp', id: u.linked_mp, primary: true }]); linked++; }
    if (u.linked_step && (!u.module || !u.trigger_ || !u.expected_output)) {
      const d = deriveFields(u.linked_step, { module: u.module, trigger: P(u.trigger_), expectedOutput: P(u.expected_output) });
      run('UPDATE ai_usecases SET module=?, trigger_=?, expected_output=? WHERE id=?', d.module, J(d.trigger), J(d.expectedOutput), u.id); derived++;
    }
    if (!u.origin) run('UPDATE ai_usecases SET origin=?, scope=COALESCE(scope,?) WHERE id=?', u.custom ? 'Custom' : 'Seeded', 'Tenant', u.id);
    // A seeded specification is complete (100 %) with Examples built from the step form.
    if (!u.custom) { const fresh = defaultSpec(get('SELECT * FROM ai_usecases WHERE id=?', u.id)); const cur = P(u.prompt_spec); const next = cur ? { ...fresh, ...Object.fromEntries(Object.entries(cur).filter(([k, v]) => k !== 'examples' && v && specCompleteness({ [k]: v }, 'en').filled)) } : fresh; run('UPDATE ai_usecases SET prompt_spec=? WHERE id=?', J(next), u.id); specs++; }
    else if (!u.prompt_spec) { run('UPDATE ai_usecases SET prompt_spec=? WHERE id=?', J(specOf(u)), u.id); specs++; }
  }
  run("UPDATE ai_usage_log SET outcome='Proposed' WHERE outcome='Pending'");
  for (const l of all("SELECT * FROM ai_usage_log WHERE parent_id IS NULL AND outcome IN ('Accepted','Edited','Rejected')")) {
    run("UPDATE ai_usage_log SET outcome='Proposed', items=1, engine=COALESCE(engine, CASE WHEN source LIKE 'llm:%' THEN 'live' ELSE 'builtin' END), spec_version=COALESCE(spec_version,1) WHERE id=?", l.id);
    run('INSERT INTO ai_usage_log(id,org_id,project_id,usecase_id,record_type,record_id,user_id,outcome,confidence,source,created_at,parent_id,item,spec_version,engine,model) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      uid(), l.org_id, l.project_id, l.usecase_id, l.record_type, l.record_id, l.user_id, l.outcome, l.confidence, l.source, l.created_at, l.id, 0, l.spec_version || 1, l.source?.startsWith('llm:') ? 'live' : 'builtin', l.model || null);
    split++;
  }
  // Older project drafts were logged without a use case: attach them to the draft use case.
  for (const l of all("SELECT id, org_id FROM ai_usage_log WHERE usecase_id IS NULL AND record_type='project-draft'")) { const u = get("SELECT id FROM ai_usecases WHERE org_id=? AND code='AIUC-P02'", l.org_id); if (u) run('UPDATE ai_usage_log SET usecase_id=? WHERE id=?', u.id, l.id); }
  return `${added} use cases added, ${linked} linked, ${derived} derived fields stored, ${specs} specifications completed, ${split} log entries split into proposal and outcome`;
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
