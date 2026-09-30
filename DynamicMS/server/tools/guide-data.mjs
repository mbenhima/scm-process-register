// Exports, for one scenario project, every phase, macro process, task and step with
// the exact values to type (from the seeded full run; steps not yet done get the
// value the run generator would enter). Row tables (items, SMART objectives, decision
// matrices, KPIs, RACSI...) are exported as tables. Output: JSON for the user-guide builder.
// Usage: node tools/guide-data.mjs <projectCode> <out.json>
import fs from 'node:fs';
import { openDb, all, get, P } from '../src/db.js';
import { catalog } from '../src/catalog/store.js';
import { FORM_KINDS } from '../src/catalog/forms.js';
import { stepValue, guideExample } from '../src/seed/text.js';
import { smartObjectives } from '../src/seed/content.js';
import { profileOf } from '../src/services/docdata.js';
import { templateByCode } from '../src/content/templates.js';
import { ROLES } from '../src/permissions.js';
import { rng } from '../src/seed/rng.js';

const [code, out] = process.argv.slice(2);
openDb();
const c = catalog();
const en = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v.en ?? '' : v ?? '');
const p = get('SELECT * FROM projects WHERE code=?', code);
if (!p) { console.error('No project', code); process.exit(1); }
const org = get('SELECT * FROM organizations WHERE id=?', p.org_id);
const group = org.group_id ? get('SELECT * FROM groups_ WHERE id=?', org.group_id) : null;
const users = all('SELECT id, name, email, roles FROM users WHERE org_id=? ORDER BY email', org.id).map(u => ({ ...u, roles: JSON.parse(u.roles) }));
const userOf = (role) => users.find(u => u.roles.includes(role)) || users.find(u => u.roles.includes('ims_manager'));
const roleName = (code2) => (ROLES.find(r => r.code === code2) || ROLES.find(r => r.code === 'ims_manager')).name;
const profile = profileOf(org);
const seg = c.segById[org.sector] || (org.size === 'SME' ? c.segById.SME : null);
const standards = P(p.standards);
const kpis = all('SELECT id, code, name, target_text, mp_id, source, frequency FROM kpis WHERE project_id=? ORDER BY source, code', p.id).map(k => {
  const v = get('SELECT value FROM kpi_values WHERE kpi_id=? ORDER BY period DESC LIMIT 1', k.id)?.value;
  return { id: k.id, code: k.code, name: P(k.name), sample: v, last: v, targetText: k.target_text, mp: k.mp_id, core: k.source === 'core', freq: k.frequency };
});
const obs = all('SELECT id, name, type FROM obs_nodes WHERE org_id=? AND project_id IS NULL ORDER BY created_at', org.id).map(n => ({ id: n.id, name: P(n.name), type: n.type }));
const memberUnit = {};
for (const m of all('SELECT node_id, role_in_node FROM obs_members WHERE org_id=?', org.id)) memberUnit[m.role_in_node] ||= m.node_id;
const obsRef = (n) => ({ id: n.id, name: n.name });
const base = {
  profile, segRisks: seg?.risks?.length ? seg.risks : c.risks.slice(0, 5).map(x => x.name), standards, stdMain: standards[0], qhse: p.ms_type === 'QHSE', ms: p.ms_type, orgCode: org.short_code, start: p.start_date,
  roleName, userName: (rc) => userOf(rc)?.name || '', user: (rc) => userOf(rc)?.id,
  kpis, kpiByCode: Object.fromEntries(kpis.map(k => [k.code, k])),
  obsAll: obs.filter(n => n.type === 'Site').map(obsRef),
  obsFor: (role) => { const n = obs.find(x => x.id === memberUnit[role]); return n ? [obsRef(n)] : obs.filter(x => x.type !== 'Organization').slice(0, 1).map(obsRef); },
  obsName: (e) => obsRef(obs.find(x => x.name.en === e) || obs[1]),
  v: { org: P(org.name), product: profile.product, line: profile.line, city: profile.city, customer: profile.customer, supplier: profile.supplier, d0: profile.defects[0], d1: profile.defects[1] || profile.defects[0], d2: profile.defects[2] || profile.defects[0], std: standards.join(', ') },
};
base.objectives = smartObjectives(base);
const resolve = {
  user: (id) => users.find(u => u.id === id)?.name || '',
  role: (rc) => (rc ? en(roleName(rc)) : ''),
  kpi: (id) => { const k = kpis.find(x => x.id === id); return k ? `${k.code} — ${en(k.name)}` : ''; },
  template: (tc) => (templateByCode[tc] ? `${tc} — ${templateByCode[tc].name.en}` : tc || ''),
};
const execs = all('SELECT * FROM step_exec WHERE project_id=? ORDER BY seq', p.id);
const phases = all('SELECT * FROM phases WHERE project_id=? ORDER BY seq', p.id);
const r = rng(`guide:${code}`);

const phaseOut = phases.map(ph => {
  const e = c.e2eById[ph.e2e_id];
  const mpIds = [...new Set(execs.filter(x => x.e2e_id === ph.e2e_id).map(x => x.mp_id))];
  const gateLists = all('SELECT c.title, c.id FROM checklists c WHERE c.phase_id=?', ph.id).map(cl => ({ title: en(P(cl.title)), items: all('SELECT text, mandatory, evidence_required FROM checklist_items WHERE checklist_id=? ORDER BY seq', cl.id).map(i => ({ text: en(P(i.text)), mandatory: !!i.mandatory, evidence: !!i.evidence_required })) }));
  const gate = gateLists.length ? get('SELECT name, exit_criteria FROM gate_defs WHERE code=?', `GATE-${ph.e2e_id}`) : null;
  return {
    id: ph.e2e_id, name: en(e.name), goals: en(e.goals), trigger: en(e.trigger), terminal: en(e.terminal), status: ph.status, decision: ph.gate_decision,
    gate: gate ? { name: en(P(gate.name)), exit: en(P(gate.exit_criteria)), checklists: gateLists } : null,
    mps: mpIds.map(mpId => {
      const mp = c.mpById[mpId];
      const rows = execs.filter(x => x.mp_id === mpId);
      const docs = all('SELECT code, title, template_id FROM documents WHERE project_id=? AND mp_id=? ORDER BY code', p.id, mpId).map(d => ({ code: d.code, title: en(P(d.title)), template: d.template_id }));
      return {
        id: mp.id, code: mp.code, name: en(mp.name), goal: en(mp.goal), owner: en(mp.ownerRoleName), tier: mp.tier, clauses: mp.clauses, documents: docs,
        tasks: (c.tasksByMp[mpId] || []).map(t => ({ id: t.id, name: en(t.name), steps: rows.filter(x => c.stepById[x.step_id].task === t.id).map(x => {
          const s = c.stepById[x.step_id];
          let fields = P(x.fields);
          if (!fields) fields = stepValue(s, { ...base, mp, mpSteps: c.stepsByMp[mpId] }, r, 'Done', x.due_date).fields;
          const who = x.assignee_role === 'system' ? null : userOf(x.assignee_role);
          const def = FORM_KINDS[s.formKind] || FORM_KINDS.execute;
          return { id: s.id, seq: s.seq, name: en(s.name), sourceName: en(s.sourceName), brief: en(s.brief), detail: en(s.description), type: s.type, role: en(s.roleName), roleCode: x.assignee_role,
            user: who ? `${who.name} (${who.email})` : 'DynamicMS Engine (automatic)', form: en(def.label), kind: s.formKind, status: x.status, due: x.due_date,
            creates: def.fields.filter(f => f.createsActions || f.createsObjectives).map(f => (f.createsActions ? 'actions' : 'objectives')),
            type_: guideExample(s.formKind, fields, resolve, s) };
        }) })).filter(t => t.steps.length),
      };
    }),
  };
});

const pick = (sql, ...a) => all(sql, ...a);
const data = {
  project: { code: p.code, name: en(P(p.name)), ms: p.ms_type, mode: p.mode, track: p.track, standards, start: p.start_date, end: p.end_date, creation: p.creation_mode, progress: p.progress_cache, complexity: P(p.complexity) },
  org: { name: en(P(org.name)), code: org.short_code, sector: org.sector, size: org.size, employees: org.employees, domain: org.email_domain, pack: org.pack, industry: P(org.industry_packs), caps: P(org.capability_packs), addons: P(org.addons), group: group ? en(P(group.name)) : null },
  users: users.map(u => ({ name: u.name, email: u.email, role: en(roleName(u.roles[0])), code: u.roles[0] })),
  template: p.template_id ? (() => { const t = get('SELECT code, name FROM project_templates WHERE id=?', p.template_id); return { code: t.code, name: en(P(t.name)) }; })() : null,
  criteria: P(get('SELECT criteria FROM complexity_scores WHERE project_id=?', p.id)?.criteria),
  score: get('SELECT score, recommended_track, chosen_track FROM complexity_scores WHERE project_id=?', p.id),
  phases: phaseOut,
  records: {
    ncs: pick('SELECT code, title, description, source, criticality, stage, root_cause FROM ncs WHERE project_id=? ORDER BY detected_at LIMIT 3', p.id).map(n => ({ code: n.code, title: en(P(n.title)), description: en(P(n.description)), source: n.source, criticality: n.criticality, stage: n.stage, rootCause: en(P(n.root_cause)) })),
    risks: pick('SELECT code, kind, title, likelihood, impact, treatment FROM risks WHERE project_id=? ORDER BY score DESC LIMIT 5', p.id).map(x => ({ code: x.code, kind: x.kind, title: en(P(x.title)), l: x.likelihood, i: x.impact, treatment: en(P(x.treatment)) })),
    kpis: kpis.slice(0, 6).map(k => ({ code: k.code, name: en(k.name), target: k.targetText, last: k.sample })),
    audits: pick('SELECT code, title, type, standard, planned_date, status FROM audits WHERE project_id=? ORDER BY planned_date', p.id).map(a => ({ ...a, title: en(P(a.title)) })),
    documents: pick('SELECT code, title, doc_type, template_id, current_version, status FROM documents WHERE project_id=? ORDER BY code', p.id).map(d => ({ ...d, title: en(P(d.title)) })),
    registers: pick('SELECT register, code, title, status FROM registers WHERE project_id=? ORDER BY register, code', p.id).map(x => ({ ...x, title: en(P(x.title)) })),
  },
};
fs.writeFileSync(out, JSON.stringify(data, null, 1));
console.log(`${code}: ${phaseOut.length} phases, ${phaseOut.reduce((a, ph) => a + ph.mps.length, 0)} MPs, ${execs.length} steps -> ${out}`);
