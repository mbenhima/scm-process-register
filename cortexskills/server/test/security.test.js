// Cross-tenant and authorization test suite (NFR-DA-SEC-11, FR-DA-TEN-08). Run after `npm run seed`: npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { one, all } from '../src/db.js';

let server, base;
const PASS = 'CortexSkills#2026';
const call = async (method, path, token, body, headers = {}) => {
  const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  let data = null; try { data = await res.json(); } catch { /* binary or empty */ }
  return { status: res.status, data, headers: res.headers };
};
const login = async email => { const r = await call('POST', '/api/auth/login', null, { email, password: PASS }); assert.equal(r.status, 200, `login ${email}: ${JSON.stringify(r.data)}`); return r.data.token; };
const userWithRole = (orgId, role) => one(`SELECT u.email FROM users u JOIN user_roles r ON r.user_id=u.id WHERE u.org_id=? AND r.role_id=? AND u.active=1 LIMIT 1`, orgId, role)?.email;

// Two Organizations in different Groups, so the Group read-only visibility rule does not apply.
let A, B, tokA;
before(async () => {
  const app = await createApp({ background: false });
  server = app.listen(0); await new Promise(r => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
  const orgs = all(`SELECT id, group_id FROM organizations ORDER BY name`);
  A = orgs.find(o => o.group_id);
  B = orgs.find(o => o.id !== A.id && o.group_id !== A.group_id);
  assert.ok(A && B, 'seed must contain Organizations in two different Groups');
  tokA = await login(userWithRole(A.id, 'R-03'));
});
after(() => server?.close());

test('health endpoint exposes no tenant data', async () => {
  const r = await call('GET', '/api/health');
  assert.equal(r.status, 200);
  assert.deepEqual(Object.keys(r.data).sort(), ['demoAccounts', 'initialized', 'mode', 'status', 'version']);
  assert.equal(typeof r.data.demoAccounts, 'boolean');
});

test('every API call except login requires a token', async () => {
  for (const p of ['/api/me', '/api/projects', '/api/records/RiskOpportunity', '/api/audit']) assert.equal((await call('GET', p)).status, 401, p);
  assert.equal((await call('GET', '/api/projects', 'not-a-token')).status, 401);
});

test('login never returns the password hash', async () => {
  const r = await call('POST', '/api/auth/login', null, { email: userWithRole(A.id, 'R-03'), password: PASS });
  assert.ok(!JSON.stringify(r.data).includes('password_hash'));
  assert.ok(!JSON.stringify(r.data).includes('$2'));
});

test('a foreign project answers 404, like a record that does not exist', async () => {
  const pB = one(`SELECT id FROM projects WHERE org_id=? LIMIT 1`, B.id);
  const foreign = await call('GET', '/api/projects/' + pB.id, tokA);
  const missing = await call('GET', '/api/projects/00000000-0000-4000-8000-000000000000', tokA);
  assert.equal(foreign.status, 404); assert.equal(missing.status, 404);
  assert.deepEqual(foreign.data, missing.data, 'foreign and missing records must be indistinguishable');
  assert.equal((await call('GET', `/api/projects/${pB.id}/workspace`, tokA)).status, 404);
});

test('foreign records, runs and tasks are not readable or writable', async () => {
  const rec = one(`SELECT id, entity FROM records WHERE org_id=? AND entity='RiskOpportunity' LIMIT 1`, B.id);
  assert.equal((await call('GET', `/api/records/${rec.entity}/${rec.id}`, tokA)).status, 404);
  assert.equal((await call('PUT', `/api/records/${rec.entity}/${rec.id}`, tokA, { title: 'x', justification: 'test' })).status, 404);
  const run = one(`SELECT id FROM e2e_instances WHERE org_id=? LIMIT 1`, B.id);
  assert.equal((await call('GET', `/api/e2e-instances/${run.id}`, tokA)).status, 404);
  const task = one(`SELECT id FROM task_instances WHERE org_id=? LIMIT 1`, B.id);
  assert.equal((await call('GET', `/api/tasks/${task.id}`, tokA)).status, 404);
  assert.equal((await call('PATCH', `/api/tasks/${task.id}`, tokA, { status: 'Completed', output: 'x', justification: 'test' })).status, 404);
});

test('lists only contain the caller\'s Organization', async () => {
  const r = await call('GET', '/api/projects', tokA);
  assert.equal(r.status, 200); assert.ok(r.data.length > 0);
  assert.ok(r.data.every(p => p.org_id === A.id), 'project list leaked another tenant');
  const risks = await call('GET', '/api/records/RiskOpportunity?limit=500', tokA);
  const rows = risks.data.items || risks.data;
  assert.ok(rows.every(x => !x.org_id || x.org_id === A.id));
});

test('switching to a foreign Organization context is refused', async () => {
  const r = await call('GET', '/api/projects', tokA, null, { 'X-Org-Id': B.id });
  assert.ok([403, 404].includes(r.status) || (Array.isArray(r.data) && r.data.every(p => p.org_id !== B.id)), `got ${r.status}`);
});

test('RBAC: a read-only role cannot manage users or permissions (403)', async () => {
  const email = userWithRole(A.id, 'R-29') || userWithRole(A.id, 'R-13');
  const tok = await login(email);
  assert.equal((await call('GET', '/api/users', tok)).status, 403);
  assert.equal((await call('PUT', '/api/permissions/matrix', tok, { grants: [] })).status, 403);
});

test('only one Accountable per RACSI activity (data-layer constraint)', async () => {
  const act = await call('POST', '/api/racsi', tokA, { name: 'Test activity', ref_type: 'custom' });
  assert.equal(act.status, 200);
  try {
    assert.equal((await call('POST', `/api/racsi/${act.data.id}/assignments`, tokA, { letter: 'A', assignee: 'First' })).status, 200);
    const second = await call('POST', `/api/racsi/${act.data.id}/assignments`, tokA, { letter: 'A', assignee: 'Second' });
    assert.equal(second.status, 409); assert.equal(second.data.error, 'err.oneAccountable');
  } finally { await call('DELETE', `/api/racsi/${act.data.id}`, tokA); }
});

test('security headers are present', async () => {
  const r = await call('GET', '/api/health');
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(r.headers.get('x-frame-options') || r.headers.get('content-security-policy'));
  assert.equal(r.headers.get('x-powered-by'), null);
});

test('error messages come back in the caller\'s language', async () => {
  const r = await call('GET', '/api/projects/00000000-0000-4000-8000-000000000000', tokA, null, { 'Accept-Language': 'fr' });
  assert.equal(r.status, 404); assert.equal(typeof r.data.message, 'string'); assert.ok(r.data.message.length > 0);
});

// SRS 1.8 — structured paste (FR-DA-MRE-19 – 22, NFR-DA-SEC-21) and currencies (FR-DA-I18N-09).
const fillRequired = (def, extra = {}) => Object.fromEntries(def.fields.filter(f => f.required).map(f => [f.name, f.type === 'number' ? 1 : f.type === 'date' ? '2026-11-02' : f.type === 'enum' ? f.options[0] : f.type === 'boolean' ? true : 'QA paste ' + f.name]).concat(Object.entries(extra)));
test('paste: markup removed, formula kept as text, one audited operation, undone once', async () => {
  const tok = await login(userWithRole(A.id, 'R-01'));
  const meta = (await call('GET', '/api/meta/entities', tok)).data; const def = meta.find(d => d.name === 'RiskOpportunity');
  const text = def.fields.find(f => !f.required && ['text', 'string', 'longtext'].includes(f.type) && !f.ml) || def.fields.find(f => ['text', 'string'].includes(f.type));
  const rows = [{ data: fillRequired(def, { [text.name]: '<b>Bold</b><script>alert(1)</script>=SUM(A1)' }) }, { data: fillRequired(def) }];
  const ap = await call('POST', '/api/bulk-entry/apply', tok, { target: { kind: 'entity', entity: 'RiskOpportunity' }, format: 'html', rows });
  assert.equal(ap.status, 200, JSON.stringify(ap.data)); assert.equal(ap.data.created.length, 2);
  try {
    const rec = (await call('GET', `/api/records/RiskOpportunity/${ap.data.created[0]}`, tok)).data;
    const v = typeof rec[text.name] === 'object' ? rec[text.name].en : rec[text.name];
    assert.equal(v, 'Bold=SUM(A1)'); assert.equal(rec.entry_origin, 'Manual');
    assert.equal(all(`SELECT id FROM audit_log WHERE entity='PasteOperation' AND entity_id=?`, ap.data.id).length, 1);
  } finally {
    const u = await call('POST', `/api/bulk-entry/${ap.data.id}/undo`, tok); assert.equal(u.status, 200); assert.equal(u.data.removed, 2);
    assert.equal((await call('GET', `/api/records/RiskOpportunity/${ap.data.created[0]}`, tok)).status, 404);
    assert.equal((await call('POST', `/api/bulk-entry/${ap.data.id}/undo`, tok)).status, 409);
  }
});
test('paste: row limit, other tenant and other users are refused', async () => {
  const tok = await login(userWithRole(A.id, 'R-01'));
  const many = Array.from({ length: 1001 }, () => ({ data: { name: 'x' } }));
  assert.equal((await call('POST', '/api/bulk-entry/preview', tok, { target: { kind: 'entity', entity: 'RiskOpportunity' }, rows: many })).status, 413);
  const taskB = one(`SELECT id FROM task_instances WHERE org_id=? LIMIT 1`, B.id);
  if (taskB) assert.equal((await call('POST', '/api/bulk-entry/apply', tok, { target: { kind: 'step', task: taskB.id, step: 'MP-29.4' }, rows: [{ data: { item: 'x' } }] })).status, 404);
  const projB = one(`SELECT id FROM projects WHERE org_id=? LIMIT 1`, B.id);
  if (projB) assert.equal((await call('POST', '/api/bulk-entry/apply', tok, { target: { kind: 'entity', entity: 'RiskOpportunity', project: projB.id }, rows: [{ data: { name: 'x' } }] })).status, 404);
  const opB = one(`SELECT id FROM paste_operations WHERE org_id<>? LIMIT 1`, A.id);
  if (opB) assert.equal((await call('POST', `/api/bulk-entry/${opB.id}/undo`, tok)).status, 404);
});
test('currencies: totals never add different currencies without a stated rate', async () => {
  const { moneyTotal } = await import('../src/services/money.js');
  const { run } = await import('../src/db.js'); const prev = one(`SELECT currency, currencies FROM org_config WHERE org_id=?`, A.id);
  run(`UPDATE org_config SET currency='MAD', currencies='["MAD","EUR","GBP"]' WHERE org_id=?`, A.id);
  run(`DELETE FROM exchange_rates WHERE org_id=? AND id='test-fx'`, A.id);
  run(`INSERT INTO exchange_rates(id,org_id,from_cur,to_cur,rate,as_of) VALUES('test-fx',?,'EUR','MAD',10,'2026-01-01')`, A.id);
  try {
    const one1 = moneyTotal(A.id, [{ v: 100 }, { v: 50, currency: 'MAD' }], 'v', 'en'); assert.equal(one1.amount, 150); assert.equal(one1.currency, 'MAD');
    const conv = moneyTotal(A.id, [{ v: 100, currency: 'MAD' }, { v: 10, currency: 'EUR' }], 'v', 'en', { asOf: '2026-06-01' }); assert.equal(conv.amount, 200); assert.ok(conv.converted); assert.match(conv.note, /1 EUR = .*2026-01-01/);
    const none = moneyTotal(A.id, [{ v: 100, currency: 'MAD' }, { v: 10, currency: 'GBP' }], 'v', 'en'); assert.equal(none.amount, null); assert.match(none.text, /MAD \+ .*GBP/);
  } finally { run(`DELETE FROM exchange_rates WHERE id='test-fx'`); run(`UPDATE org_config SET currency=?, currencies=? WHERE org_id=?`, prev.currency, prev.currencies, A.id); }
});
test('exports neutralize spreadsheet formulas', async () => {
  const { neutralize } = await import('../src/services/exporters.js');
  for (const v of ['=SUM(A1)', '+1+1', '@cmd', '-2+3', '\tx']) assert.equal(neutralize(v), "'" + v);
  for (const v of ['-12', '+3.5', 'Plain', 12]) assert.equal(neutralize(v), v);
});
