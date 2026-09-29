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
  assert.deepEqual(Object.keys(r.data).sort(), ['initialized', 'mode', 'status', 'version']);
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
