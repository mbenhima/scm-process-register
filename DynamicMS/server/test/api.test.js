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
const login = async (email, password = 'Demo@2026') => (await call('POST', '/auth/login', null, { email, password })).body.token;

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
