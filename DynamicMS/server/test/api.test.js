// End-to-end API tests on a copy of the seeded database (run "npm run seed" first).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const src = path.resolve(import.meta.dirname, '..', 'data', 'dynamicms.db');
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'dms-')), 'test.db');
fs.copyFileSync(src, tmp);
process.env.DB_FILE = tmp;
process.env.BACKUP_DIR = path.join(path.dirname(tmp), 'backups');
process.env.STORAGE_DIR = path.join(path.dirname(tmp), 'storage');
const { app } = await import('../src/index.js');

let server; let base;
before(() => new Promise(res => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}/api`; res(); }); }));
after(() => server.close());

async function call(method, url, token, body, lang = 'en') {
  const r = await fetch(base + url + (url.includes('?') ? '&' : '?') + `lang=${lang}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const ct = r.headers.get('content-type') || '';
  return { status: r.status, body: ct.includes('json') ? await r.json() : await r.arrayBuffer() };
}
// Tokens are reused across tests: sign-in is rate limited (20 per minute).
const tokens = {};
const login = async (email, password = 'Demo@2026') => {
  if (tokens[`${email}:${password}`]) return tokens[`${email}:${password}`];
  const tk = (await call('POST', '/auth/login', null, { email, password })).body.token;
  if (tk) tokens[`${email}:${password}`] = tk;
  return tk;
};

test('login rejects bad credentials and accepts demo users', async () => {
  assert.equal((await call('POST', '/auth/login', null, { email: 'quality@atlas-sme.example', password: 'nope' })).status, 401);
  assert.ok(await login('quality@atlas-sme.example'));
  assert.equal((await call('GET', '/tenancy/tree')).status, 401);
});

test('full-run project: lifecycle, steps, complete, reopen, gate rules', async () => {
  const t = await login('ims@atlas-sme.example');
  const me = (await call('GET', '/auth/me', t)).body;
  assert.equal(me.org.code, 'AT-UNI');
  const tree = (await call('GET', '/tenancy/tree', t)).body;
  const proj = tree.independent[0].projects.find(p => p.ms_type === 'QMS');
  const life = (await call('GET', `/projects/${proj.id}/lifecycle`, t)).body;
  assert.ok(life.length >= 10);
  assert.equal(life[0].e2e_id, 'E2E-01');
  const mp = life.find(p => p.status === 'Active' || p.status === 'Planned').mps[0];
  const det = (await call('GET', `/projects/${proj.id}/mps/${mp.id}`, t, null, 'fr')).body;
  assert.ok(det.tasks.length > 0);
  const open = (await call('GET', `/projects/${proj.id}/steps?status=Todo&limit=5`, t)).body;
  assert.ok(open.total > 0);
  const stepId = open.items.find(s => s.form_kind === 'execute')?.id || open.items[0].id;
  const step = (await call('GET', `/steps/${stepId}`, t)).body;
  assert.ok(step.step.form.fields.length);
  const bad = await call('POST', `/steps/${stepId}/complete`, t, { fields: {} });
  assert.equal(bad.status, 400);
  const fields = Object.fromEntries(step.step.form.fields.map(f => [f.key, f.type === 'score' ? 4 : f.type === 'number' ? 10 : f.type === 'date' ? '2026-10-01' : f.type === 'select' ? 'Go' : f.type === 'role' ? 'quality_manager' : 'Test value']));
  const ok = await call('POST', `/steps/${stepId}/complete`, t, { fields });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal((await call('POST', `/steps/${stepId}/reopen`, t, {})).status, 400);
  assert.equal((await call('POST', `/steps/${stepId}/reopen`, t, { justification: 'Wrong value entered' })).status, 200);
  const closed = life.find(p => p.gate_decision === 'Go');
  const closedStep = (await call('GET', `/projects/${proj.id}/steps?e2e=${closed.e2e_id}&limit=1`, t)).body.items[0];
  assert.equal((await call('POST', `/steps/${closedStep.id}/reopen`, t, { justification: 'Try after gate' })).status, 409);
});

test('cross-tenant isolation returns 404, group read-only view works', async () => {
  const t = await login('quality@nova-aut.example');
  const other = await login('quality@atlas-sme.example');
  const tree = (await call('GET', '/tenancy/tree', other)).body;
  const pid = tree.independent[0].projects[0].id;
  assert.equal((await call('GET', `/projects/${pid}`, t)).status, 404);
  assert.equal((await call('GET', `/projects/${pid}/ncs`, t)).status, 404);
  const ceo = await login('ceo@horizon-aut.example');
  const gtree = (await call('GET', '/tenancy/tree', ceo)).body;
  assert.ok(gtree.groups[0].orgs.length >= 30);
  const sibling = gtree.groups[0].orgs.find(o => o.code === 'HZ-AER');
  assert.equal(sibling.access, 'read');
  const sp = sibling.projects[0].id;
  assert.equal((await call('GET', `/projects/${sp}`, ceo)).status, 200);
  const tadm = await login('admin@horizon-aut.example');
  assert.equal((await call('PUT', `/projects/${sp}`, tadm, { name: 'x' })).status, 404);
});

test('RBAC: employee cannot manage governance; owner != evaluator enforced', async () => {
  const emp = await login('employee@horizon-aut.example');
  const q = await login('quality@horizon-aut.example');
  const me = (await call('GET', '/auth/me', q)).body;
  const tree = (await call('GET', '/tenancy/tree', q)).body;
  const org = tree.groups[0].orgs.find(o => o.code === 'HZ-AUT');
  const pid = org.projects[0].id;
  assert.equal((await call('POST', `/projects/${pid}/risks`, emp, { title: 'x', likelihood: 3, impact: 3 })).status, 403);
  assert.equal((await call('POST', `/projects/${pid}/ncs`, emp, { title: 'Leak', description: 'Oil leak at press 4', source: 'Process', criticality: 'Minor' })).status, 201);
  const users = (await call('GET', `/orgs/${org.id}/users`, q)).body;
  const same = await call('POST', `/projects/${pid}/actions`, q, { title: 'A', ownerUser: users[0].id, evaluatorUser: users[0].id, dueDate: '2026-12-01' });
  assert.equal(same.status, 400);
  assert.equal(same.body.error.code, 'OWNER_EQUALS_EVALUATOR');
  assert.equal((await call('POST', `/projects/${pid}/actions`, q, { title: 'A', ownerUser: users[0].id, evaluatorUser: users[1].id, dueDate: '2026-12-01' })).status, 201);
  assert.ok(me.permissions.includes('governance.manage'));
});

test('RACSI requires exactly one Accountable', async () => {
  const q = await login('ims@horizon-uni.example'.replace('uni', 'universal'));
  const tree = (await call('GET', '/tenancy/tree', q)).body;
  const pid = tree.groups[0].orgs.find(o => o.code === 'HZ-UNI').projects[0].id;
  const m = (await call('GET', `/projects/${pid}/racsi`, q)).body;
  const act = m.activities[0];
  assert.equal((await call('PUT', `/racsi/${act.id}`, q, { assignments: [{ letter: 'A', assignee: 'ims_manager' }, { letter: 'A', assignee: 'quality_manager' }] })).status, 400);
  assert.equal((await call('PUT', `/racsi/${act.id}`, q, { assignments: [{ letter: 'A', assignee: 'ims_manager' }, { letter: 'R', assignee: 'quality_manager' }] })).status, 200);
});

test('reports export in all formats and languages', async () => {
  const q = await login('quality@nova-aec.example');
  const tree = (await call('GET', '/tenancy/tree', q)).body;
  const pid = tree.groups[0].orgs.find(o => o.code === 'NV-AEC').projects[0].id;
  for (const lang of ['en', 'fr', 'ar']) for (const fmt of ['pdf', 'xlsx', 'docx', 'csv']) {
    const r = await call('GET', `/projects/${pid}/reports/status?format=${fmt}`, q, null, lang);
    assert.equal(r.status, 200, `${fmt} ${lang}`);
    assert.ok(r.body.byteLength > 500, `${fmt} ${lang} size`);
  }
});

test('assistant, AI suggestion with feedback, dashboard, benchmark, portfolio', async () => {
  const q = await login('quality@horizon-aut.example');
  const me = (await call('GET', '/auth/me', q)).body;
  const tree = (await call('GET', '/tenancy/tree', q)).body;
  const org = tree.groups[0].orgs.find(o => o.code === 'HZ-AUT');
  const pid = org.projects[0].id;
  const a1 = (await call('POST', '/assistant/ask', q, { question: 'How do I reopen a completed step?', mode: 'help' })).body;
  assert.ok(a1.sources.length);
  const a2 = (await call('POST', '/assistant/ask', q, { question: 'Quelles étapes sont en retard ?', mode: 'data', projectId: pid }, 'fr')).body;
  assert.equal(a2.intent, 'overdue');
  const ucs = (await call('GET', `/orgs/${org.id}/ai/usecases`, q)).body.items;
  const uc = ucs.find(u => u.code === 'AIUC-C01');
  const ai = (await call('POST', '/ai/suggest', q, { projectId: pid, usecaseId: uc.id, input: 'torque out of tolerance' })).body;
  assert.ok(ai.items.length && ai.logId);
  assert.equal((await call('POST', '/ai/feedback', q, { logId: ai.logId, outcome: 'Accepted' })).status, 200);
  const d = (await call('GET', `/projects/${pid}/dashboard`, q)).body;
  assert.ok(d.phases.length && d.kpis.length);
  const ceo = await login('ceo@horizon-aut.example');
  const g = (await call('GET', '/benchmark/group', ceo)).body;
  assert.ok(g.participating >= 3 && g.metrics.length);
  const pf = (await call('GET', `/portfolio?groupId=${me.org.groupId}`, ceo)).body;
  assert.ok(pf.rows.length >= 58);
});

test('project creation in the three modes with quota and scoring', async () => {
  const t = await login('ims@atlas-sme.example');
  const me = (await call('GET', '/auth/me', t)).body;
  const draft = (await call('POST', `/orgs/${me.org.id}/projects/draft`, t, { description: 'Quick ISO 45001 safety certification for a small company' })).body;
  assert.equal(draft.msType, 'QHSE');
  const tpls = (await call('GET', `/orgs/${me.org.id}/templates`, t)).body;
  const c1 = await call('POST', `/orgs/${me.org.id}/projects`, t, { creationMode: 'catalog', templateId: tpls[0].id, name: 'Catalog project', msType: 'QMS' });
  assert.equal(c1.status, 201, JSON.stringify(c1.body));
  const c2 = await call('POST', `/orgs/${me.org.id}/projects`, t, { creationMode: 'ai', name: 'AI project', msType: draft.msType, levels: draft.levels, aiAccepted: ['msType', 'track'] });
  assert.equal(c2.status, 201);
  const life = (await call('GET', `/projects/${c1.body.id}/lifecycle`, t)).body;
  assert.ok(life.length > 5 && life[0].status === 'Active');
});

test('admin: permission matrix edit, config disclosure, versions, backups', async () => {
  const admin = await login('admin@dynamicms.example', 'Admin@2026');
  const pm = (await call('GET', '/admin/permissions', admin)).body;
  assert.ok(pm.permissions.length > 30 && pm.roles.length >= 19);
  assert.equal((await call('PUT', '/admin/permissions', admin, { role: 'employee', perm: 'reports.export', granted: true })).status, 200);
  const tadmin = await login('admin@atlas-sme.example');
  const me = (await call('GET', '/auth/me', tadmin)).body;
  assert.equal((await call('PUT', `/admin/orgs/${me.org.id}/config`, tadmin, { complianceStandards: ['ISO9001', 'GDPR'] })).status, 400);
  assert.equal((await call('PUT', `/admin/orgs/${me.org.id}/config`, tadmin, { complianceStandards: ['ISO9001', 'GDPR'], acknowledgeDisclosure: true })).status, 200);
  assert.equal((await call('PUT', `/admin/orgs/${me.org.id}/config`, tadmin, { complianceStandards: ['ISO9001', 'GDPR'], acknowledgeDisclosure: true })).status, 200);
  const b = await call('POST', '/admin/backups', admin);
  assert.equal(b.status, 201);
  assert.equal(b.body.integrity, 'ok');
});

test('feedback: structured forms, actions from plans, SMART objectives, KPI from a step', async () => {
  const t = await login('ims@atlas-sme.example');
  const tree = (await call('GET', '/tenancy/tree', t)).body;
  const proj = tree.independent[0].projects.find(p => p.ms_type === 'QMS');
  const pick = (await call('GET', `/projects/${proj.id}/pickers`, t)).body;
  assert.ok(pick.users.length && pick.obs.length && pick.kpis.length && pick.templates.length);
  const todo = (await call('GET', `/projects/${proj.id}/steps?status=Todo&limit=400`, t)).body.items;
  // A plan step: each row becomes an action of the Action plan
  const plan = todo.find(s => s.form_kind === 'plan');
  if (plan) {
    const owner = pick.users.find(u => u.roles.includes('operations_manager')).id;
    const r = await call('POST', `/steps/${plan.id}/complete`, t, { fields: { activities: [{ activity: 'Train the two new technicians on job sheets', owner, due: '2026-12-01' }] } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const acts = (await call('GET', `/projects/${proj.id}/actions?limit=500`, t)).body;
    const list = Array.isArray(acts) ? acts : acts.items;
    assert.ok(list.some(a => JSON.stringify(a.title).includes('Train the two new technicians')));
  }
  // A row table with a missing required column is refused
  const list = todo.find(s => s.form_kind === 'list');
  if (list) assert.equal((await call('POST', `/steps/${list.id}/complete`, t, { fields: { items: [{ category: 'x' }] } })).status, 400);
  // New KPI created from a step
  const mon = todo.find(s => s.form_kind === 'monitor') || todo[0];
  const k = await call('POST', `/steps/${mon.id}/kpis`, t, { name: 'Signed job sheets', target: 95, unit: '%' });
  assert.equal(k.status, 201);
  // Step detail: brief, detailed description, step-linked AI only
  const det = (await call('GET', `/steps/${mon.id}`, t)).body;
  assert.ok(det.step.brief && det.step.description);
  assert.ok(det.aiUseCases.every(a => a.step === det.step_id));
});

test('feedback: IMS document templates, generation, structure, versions, downloads, layout', async () => {
  const t = await login('ims@atlas-sme.example');
  const me = (await call('GET', '/auth/me', t)).body;
  const tree = (await call('GET', '/tenancy/tree', t)).body;
  const proj = tree.independent[0].projects.find(p => p.ms_type === 'QMS');
  const lib = (await call('GET', `/orgs/${me.org.id}/doc-templates?projectId=${proj.id}`, t)).body;
  assert.ok(lib.items.length >= 30);
  const mand = (await call('GET', `/projects/${proj.id}/documents/mandatory`, t)).body;
  assert.ok(mand.items.length >= 10);
  assert.equal(mand.missing, 0);
  const d = await call('POST', `/projects/${proj.id}/documents`, t, { templateCode: 'TPL-CTX' });
  assert.equal(d.status, 201);
  const doc = (await call('GET', `/documents/${d.body.id}`, t)).body;
  const st = (await call('GET', `/document-versions/${doc.versions[0].id}/structure`, t)).body;
  assert.ok(st.structured && st.sections.some(s => (s.blocks || []).some(b => b.kind === 'table' && b.rows.length)));
  for (const f of ['pdf', 'docx', 'xlsx']) {
    const r = await call('GET', `/documents/${d.body.id}/download?format=${f}`, t);
    assert.equal(r.status, 200); assert.ok(r.body.byteLength > 2000);
  }
  // Structure editing on the draft, then delete (never published -> deleted)
  assert.equal((await call('PUT', `/document-versions/${doc.versions[0].id}/sections`, t, { sections: [...st.sections.map(s => ({ key: s.key, title: s.title })), { title: 'Annex', text: 'Free text' }] })).status, 200);
  assert.equal((await call('DELETE', `/documents/${d.body.id}`, t)).body.deleted, true);
  // A published document is retired, with a justification
  const pol = (await call('GET', `/projects/${proj.id}/documents`, t)).body.find(x => x.template_id === 'TPL-POL-Q');
  assert.equal((await call('DELETE', `/documents/${pol.id}`, t)).status, 400);
  // Tenant template: copy of a library template, edited, then retired
  const cp = await call('POST', `/orgs/${me.org.id}/doc-templates`, t, { baseCode: 'TPL-WI' });
  assert.equal(cp.status, 201);
  assert.equal((await call('PUT', `/doc-templates/${cp.body.id}`, t, { sections: [{ key: 'purpose', type: 'text', title: { en: 'Purpose' }, text: { en: 'Do it right' } }] })).status, 200);
  assert.equal((await call('PUT', `/orgs/${me.org.id}/doc-layout`, t, { primaryColor: 'orange' })).status, 400);
  assert.equal((await call('PUT', `/orgs/${me.org.id}/doc-layout`, t, { primaryColor: '#3A6EA5', headerText: 'Controlled copy' })).status, 200);
});

test('feedback: RACSI five columns, readiness checklist, LLM settings, tenancy creation', async () => {
  const t = await login('ims@atlas-sme.example');
  const me = (await call('GET', '/auth/me', t)).body;
  const tree = (await call('GET', '/tenancy/tree', t)).body;
  const proj = tree.independent[0].projects.find(p => p.ms_type === 'QMS');
  assert.equal((await call('PUT', `/projects/${proj.id}/mps/MP-004/racsi`, t, { letters: { A: ['ims_manager', 'top_management'] } })).status, 400);
  assert.equal((await call('PUT', `/projects/${proj.id}/mps/MP-004/racsi`, t, { letters: { R: ['process_excellence_manager'], A: ['ims_manager'], C: ['quality_manager'], S: ['document_controller'], I: ['top_management'] } })).status, 200);
  assert.equal((await call('PUT', `/projects/${proj.id}/mps/MP-004/racsi`, t, { stepId: 'MP-004.3', letters: { R: ['quality_manager'], A: ['process_excellence_manager'] } })).status, 200);
  const rd = (await call('GET', `/projects/${proj.id}/mps/MP-004/readiness`, t)).body;
  assert.ok(rd.items.length >= 4);
  assert.equal((await call('PUT', `/projects/${proj.id}/mps/MP-004/readiness`, t, { itemId: rd.items[0].id, done: true })).status, 200);
  const admin = await login('admin@atlas-sme.example');
  const llm = (await call('GET', `/orgs/${me.org.id}/ai/llm`, admin)).body;
  assert.ok(llm.providers.some(p => p.id === 'anthropic') && llm.providers.some(p => p.id === 'custom'));
  assert.equal((await call('PUT', `/orgs/${me.org.id}/ai/llm`, admin, { provider: 'anthropic', model: 'claude-sonnet-5-5', enabled: true })).status, 400);
  const saved = await call('PUT', `/orgs/${me.org.id}/ai/llm`, admin, { provider: 'anthropic', model: 'claude-sonnet-5-5', apiKey: 'sk-test-1234', enabled: false });
  assert.equal(saved.status, 200); assert.equal(saved.body.keyHint, '••••1234'); assert.equal(saved.body.apiKeyEnc, undefined);
  // Recent Claude models reject `temperature` (400): it is left out for them and kept for older ones.
  const { complete } = await import('../src/services/llm.js');
  const sent = [];
  const stub = async (url, init) => { sent.push(JSON.parse(init.body)); return { ok: true, status: 200, json: async () => ({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'OK' }] }) }; };
  await call('PUT', `/orgs/${me.org.id}/ai/llm`, admin, { provider: 'anthropic', model: 'claude-opus-5-5', enabled: true, temperature: 0.2 });
  assert.equal((await complete(me.org.id, { system: 's', user: 'u' }, stub)).text, 'OK');
  assert.equal(sent[0].temperature, undefined); assert.ok(sent[0].max_tokens >= 16000); assert.equal(sent[0].output_config.effort, 'low');
  await complete(me.org.id, { system: 's', user: 'u', model: 'claude-haiku-4-5-20251001' }, stub);
  assert.equal(sent[1].temperature, 0.2); assert.equal(sent[1].output_config, undefined);
  await call('PUT', `/orgs/${me.org.id}/ai/llm`, admin, { enabled: false });
  const pa = await login('admin@dynamicms.example', 'Admin@2026');
  const g = await call('POST', '/tenancy/groups', pa, { name: 'Test group' });
  assert.equal(g.status, 201);
  const o = await call('POST', '/tenancy/orgs', pa, { name: 'Test Org', sector: 'UNI', size: 'SME', emailDomain: 'test-org.example', groupId: g.body.id, adminEmail: 'admin@test-org.example' });
  assert.equal(o.status, 201);
  const ind = await call('POST', '/tenancy/orgs', pa, { name: 'Solo Org', sector: 'UNI', size: 'SME', emailDomain: 'solo-org.example', adminEmail: 'admin@solo-org.example' });
  assert.equal(ind.status, 201);
});

test('SRS 1.5: global search, process design versions, OBS roles, prompt specification, audit frequency', async () => {
  const t = await login('ims@atlas-sme.example');
  const admin = await login('admin@atlas-sme.example');
  const me = (await call('GET', '/auth/me', t)).body;
  const org = me.org.id;
  const proj = (await call('GET', '/tenancy/tree', t)).body.independent[0].projects.find(p => p.ms_type === 'QMS');
  // Search: rights-aware, codes matched exactly and ranked first
  const s = (await call('GET', `/search?q=MP-001.2&projectId=${proj.id}`, t)).body;
  assert.equal(s.groups[0].type, 'step'); assert.equal(s.groups[0].items[0].code, 'MP-001.2');
  const rep = await login('employee@atlas-sme.example');
  const sr = (await call('GET', `/search?q=policy&projectId=${proj.id}`, rep)).body;
  assert.ok(!sr.groups.some(g => g.type === 'ai' && !g.items.length));
  // Process design: edit creates a version, restore brings the reference back, naming enforced
  assert.equal((await call('PUT', `/orgs/${org}/design/step/MP-002.4`, t, { name: 'Draft' })).status, 400);
  assert.equal((await call('PUT', `/orgs/${org}/design/step/MP-002.4`, t, { name: 'Draft the policy statement with top management' })).status, 200);
  const hist = (await call('GET', `/admin/versions/design/${org}:step:MP-002.4`, t)).body;
  assert.equal(hist.length, 2);
  assert.equal((await call('POST', `/admin/versions/design/${org}:step:MP-002.4/revert`, t, { version: 1, justification: 'Back to reference' })).status, 200);
  const el = (await call('GET', `/orgs/${org}/design/step/MP-002.4`, t)).body;
  assert.notEqual(el.data.name, 'Draft the policy statement with top management');
  const created = await call('POST', `/orgs/${org}/design/task`, t, { name: 'Prepare the supplier review', mp: 'MP-024' });
  assert.equal(created.status, 201);
  assert.equal((await call('DELETE', `/orgs/${org}/design/task/${created.body.id}`, t, { justification: 'test' })).body.status, 'Deleted');
  // OBS roles: one role, several functions; one person, several roles
  const roles = (await call('GET', `/orgs/${org}/obs-roles`, t)).body;
  assert.ok(roles.roles.length >= 10);
  assert.ok(roles.people.some(p => p.roles.length > 1));
  const role = roles.roles.find(r => r.code === 'quality_manager');
  assert.equal((await call('PUT', `/obs-roles/${role.id}`, admin, { functions: [] })).status, 400);
  assert.equal((await call('PUT', `/obs-roles/${role.id}`, admin, { functions: ['FN-02', 'FN-08'] })).status, 200);
  assert.equal((await call('GET', `/admin/versions/obs_role/${role.id}`, admin)).body.length, 2);
  // Prompt specification: 12 separate fields, field versions, completeness blocks activation
  const uc = (await call('GET', `/orgs/${org}/ai/usecases`, admin)).body.items[0];
  const spec = (await call('GET', `/ai/usecases/${uc.id}/spec?raw=1`, admin)).body;
  assert.equal(spec.fields.length, 12); assert.ok(spec.completeness.complete);
  const up = await call('PUT', `/ai/usecases/${uc.id}/spec`, admin, { fields: { constraints: '' } });
  assert.equal(up.status, 200); assert.equal(up.body.completeness.complete, false);
  assert.equal((await call('PUT', `/ai/usecases/${uc.id}`, admin, { active: true })).status, 400);
  assert.equal((await call('POST', `/admin/versions/prompt_field/${uc.id}:constraints/revert`, admin, { version: 1, justification: 'restore' })).status, 200);
  assert.equal((await call('PUT', `/ai/usecases/${uc.id}`, admin, { active: true })).status, 200);
  // Audit frequency: list option or custom with its description
  assert.equal((await call('POST', `/projects/${proj.id}/audits`, t, { title: 'Test audit', type: 'Internal', plannedDate: '2026-12-01', frequency: 'Custom' })).status, 400);
  assert.equal((await call('POST', `/projects/${proj.id}/audits`, t, { title: 'Test audit', type: 'Internal', plannedDate: '2026-12-01', frequency: 'Custom', frequencyCustom: 'After each new service launch' })).status, 201);
});

test('round 3: qualified step forms, needs mapped to parties, registers and documents', async () => {
  const t = await login('ims@atlas-sme.example');
  const me = (await call('GET', '/auth/me', t)).body;
  const tpls = (await call('GET', `/orgs/${me.org.id}/templates`, t)).body;
  const pr = (await call('POST', `/orgs/${me.org.id}/projects`, t, { creationMode: 'catalog', templateId: tpls[0].id, name: 'Round 3 project', msType: 'QMS' })).body;
  const steps = (await call('GET', `/projects/${pr.id}/steps?limit=400`, t)).body.items;
  const sid = (code) => steps.find(x => x.step_id === code)?.id;
  // Qualified columns: "External issue" with a PESTLE list + Custom; interactions pick macro processes.
  const cols = (await call('GET', `/steps/${sid('MP-001.2')}`, t)).body.step.form.fields[0].columns;
  assert.equal(cols[0].label, 'External issue'); assert.equal(cols[1].type, 'combo'); assert.ok(cols[1].options.length >= 8);
  const inter = (await call('GET', `/steps/${sid('MP-001.7')}`, t)).body.step.form.fields[0].columns;
  assert.deepEqual(inter.slice(0, 3).map(c => c.type), ['mp', 'mp', 'combo']);
  assert.equal((await call('PUT', `/steps/${sid('MP-001.7')}`, t, { fields: { items: [{ from: 'MP-013', to: 'Invoicing', category: 'Support service' }] } })).status, 200);
  const saved = (await call('GET', `/steps/${sid('MP-001.7')}`, t)).body.fields.items[0];
  assert.match(saved.item, /UMS006 \(.*\) → Invoicing/);
  // Interested parties: completing the step fills the register and the pickers.
  const done = await call('POST', `/steps/${sid('MP-001.4')}/complete`, t, { fields: { items: [
    { item: 'Customers', category: 'External party', detail: 'On-time delivery', influence: '5', interest: '4', priority: 'High', source: 'Survey 2025' },
    { item: 'Municipality', category: 'External party', priority: 'Medium' }] } });
  assert.equal(done.status, 200, JSON.stringify(done.body));
  const pick = (await call('GET', `/projects/${pr.id}/pickers`, t)).body;
  assert.ok(pick.parties.some(p => p.name === 'Municipality') && pick.mps.length > 10);
  // Needs: library, AI suggestion (built-in engine here) mapped to the parties, completion.
  const needsStep = (await call('GET', `/steps/${sid('MP-001.5')}`, t)).body;
  assert.equal(needsStep.step.form.fields[0].key, 'needs');
  assert.ok((await call('GET', `/steps/${sid('MP-001.5')}/needs-library`, t)).body.items.length >= 15);
  const sug = (await call('POST', `/steps/${sid('MP-001.5')}/needs-suggest`, t, {})).body;
  assert.ok(sug.rows.length >= 4 && sug.rows.every(x => x.parties.length === 1 && x.origin === 'AI'));
  const needs = [...sug.rows, { need: 'Quote within 48 hours', parties: [{ id: null, name: 'Customers' }, { id: null, name: 'Municipality' }], obligation: 'Yes', origin: 'Manual' }];
  const nd = await call('POST', `/steps/${sid('MP-001.5')}/complete`, t, { fields: { needs, rationale: 'Needs of both parties recorded.' } });
  assert.equal(nd.status, 200, JSON.stringify(nd.body));
  // The context analysis shows the parties and their needs typed in the steps.
  const doc = await call('POST', `/projects/${pr.id}/documents`, t, { templateCode: 'TPL-CTX' });
  assert.equal(doc.status, 201, JSON.stringify(doc.body));
  const body = JSON.stringify((await call('GET', `/documents/${doc.body.id}`, t)).body);
  assert.ok(body.includes('Municipality') && body.includes('Quote within 48 hours'));
});

test('project templates: copy, customize (exclude, rename, custom step, lists) and create a project from it', async () => {
  const t = await login('ims@atlas-sme.example');
  const list = (await call('GET', '/project-templates', t)).body;
  const lib = list.find(x => x.library && x.msType === 'QMS' && x.mode === 'SME') || list.find(x => x.library && x.msType === 'QMS');
  assert.ok(lib, 'a library template');
  assert.equal(lib.canEdit, false, 'library templates are read-only for tenants');
  assert.equal((await call('PUT', `/project-templates/${lib.id}`, t, { name: 'x' })).status, 403);
  const copy = (await call('POST', '/project-templates', t, { copyOf: lib.id, name: 'Atlas SME template' })).body;
  assert.ok(copy.id);
  let d = (await call('GET', `/project-templates/${copy.id}`, t)).body;
  assert.equal(d.canEdit, true);
  const e1 = d.structure.find(e => e.include && e.mps.some(m => m.include));
  const [m1, m2] = e1.mps.filter(m => m.include);
  const s1 = m1.steps[0];
  assert.equal((await call('PUT', `/project-templates/${copy.id}`, t, {
    mp: m2 ? { [m2.id]: { include: false } } : {}, step: { [s1.id]: { name: 'Renamed step', role: 'quality_manager' } },
    custom: { step: { add: [{ name: 'Check the supplier list', mp: m1.id, role: 'quality_manager' }] } },
    lists: { kpis: [{ id: 'KPI-T1', name: 'On-time audits', formula: 'Audits on time / audits planned x 100', target: '≥ 95%', unit: '%', frequency: 'Monthly', owner: 'ims_manager', mp: m1.id }], risks: [{ id: 'R-T1', kind: 'Risk', title: 'Key auditor unavailable', likelihood: 3, impact: 4, owner: 'risk_manager' }] },
  })).status, 200);
  d = (await call('GET', `/project-templates/${copy.id}`, t)).body;
  assert.equal(d.counts.kpis, 1);
  assert.equal(d.counts.risks, 1);
  const mm = d.structure.flatMap(e => e.mps).find(m => m.id === m1.id);
  assert.ok(mm.steps.some(s => s.custom && s.name === 'Check the supplier list'));
  assert.equal(mm.steps.find(s => s.id === s1.id).name, 'Renamed step');
  assert.equal((await call('POST', `/project-templates/${copy.id}/status`, t, { status: 'Published' })).body.status, 'Published');
  const me = (await call('GET', '/auth/me', t)).body;
  const p = await call('POST', `/orgs/${me.org.id}/projects`, t, { name: 'From my template', msType: 'QMS', creationMode: 'catalog', templateId: copy.id });
  assert.equal(p.status, 201, JSON.stringify(p.body));
  const life = (await call('GET', `/projects/${p.body.id}/lifecycle`, t)).body;
  const mps = life.flatMap(x => x.mps).map(x => x.id);
  assert.ok(mps.includes(m1.id));
  if (m2) assert.ok(!mps.includes(m2.id), 'excluded macro process is not in the project');
  const det = (await call('GET', `/projects/${p.body.id}/mps/${m1.id}`, t)).body;
  const steps = det.tasks.flatMap(x => x.steps);
  assert.ok(steps.some(s => s.name === 'Renamed step'));
  assert.ok(steps.some(s => s.name === 'Check the supplier list'));
  const kpis = (await call('GET', `/projects/${p.body.id}/kpis`, t)).body;
  const kl = Array.isArray(kpis) ? kpis : kpis.items || [];
  assert.ok(kl.some(k => k.code === 'KPI-T1'));
  assert.equal((await call('DELETE', `/project-templates/${copy.id}`, t)).body.status, 'Retired', 'a template used by a project is retired');
});

test('document templates: formatting, picture sections and rendering', async () => {
  const t = await login('ims@atlas-sme.example');
  const me = (await call('GET', '/auth/me', t)).body;
  const org = me.org.id;
  // A 1x1 PNG picture.
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const fd = new FormData(); fd.append('file', new Blob([png], { type: 'image/png' }), 'pic.png');
  const up = await (await fetch(`${base}/orgs/${org}/doc-images?lang=en`, { method: 'POST', headers: { Authorization: `Bearer ${t}` }, body: fd })).json();
  assert.match(up.file, /doc-images\/.+\.png$/);
  const c = await call('POST', `/orgs/${org}/doc-templates`, t, { code: 'TPL-FMT-T', name: 'Formatted', sections: [{ key: 'a', type: 'text', title: 'Intro', text: 'Hello {org}', style: { align: 'justify', bold: true, background: '#E8F1FB', bad: 1 } }, { key: 'pic', type: 'image', title: 'Site', image: up.file, caption: 'Our site', widthPct: 50 }], format: { bodyFont: 'Times New Roman', bodySize: 11, headingColor: '#1876C6', orientation: 'landscape', logo: 'none', marginCm: 9 } });
  assert.equal(c.status, 201, JSON.stringify(c.body));
  const tpl = (await call('GET', `/orgs/${org}/doc-templates/TPL-FMT-T?raw=1`, t)).body;
  assert.equal(tpl.format.bodyFont, 'Times New Roman');
  assert.equal(tpl.format.marginCm, 3.5, 'margins are clamped');
  assert.deepEqual(tpl.sections[0].style, { align: 'justify', bold: true, background: '#E8F1FB' }, 'unknown style keys are dropped');
  assert.equal((await call('POST', `/orgs/${org}/doc-templates`, t, { code: 'TPL-FMT-X', name: 'Bad', sections: [{ key: 'p', type: 'image', title: 'x', image: '../../etc/passwd' }] })).status, 400);
  const tree = (await call('GET', '/tenancy/tree', t)).body;
  const proj = tree.independent[0].projects.find(p => p.ms_type === 'QMS');
  const doc = (await call('POST', `/projects/${proj.id}/documents`, t, { templateCode: 'TPL-FMT-T' })).body;
  for (const f of ['pdf', 'docx', 'xlsx']) {
    const r = await call('GET', `/documents/${doc.id}/download?format=${f}`, t);
    assert.equal(r.status, 200, f);
    assert.ok(r.body.byteLength > 2000, f);
  }
});
