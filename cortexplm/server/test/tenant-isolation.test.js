// NFR-DA-SEC-11: automated cross-tenant access tests. Run after "npm run seed": npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/index.js';
import { q } from '../src/db.js';

let server; let base;
const login = async (email, password = 'Demo#2026') => {
  const r = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
  return (await r.json()).token;
};
const get = (token, path, headers = {}) => fetch(`${base}${path}`, { headers: { authorization: `Bearer ${token}`, ...headers } });

before(async () => {
  server = createApp().listen(0);
  base = `http://localhost:${server.address().port}/api`;
});
after(() => server.close());

test('a user cannot read another organization\'s project, task or gate', async () => {
  const pub = await login('pm1@metrocity.example');
  const other = q.get("SELECT p.id pid, t.id tid, g.id gid FROM projects p JOIN run_tasks t ON t.project_id = p.id JOIN gate_reviews g ON g.project_id = p.id JOIN organizations o ON o.id = p.org_id WHERE o.uid = 'ORG-HLT-001' LIMIT 1");
  for (const path of [`/projects/${other.pid}`, `/tasks/${other.tid}`, `/gates/${other.gid}`]) assert.equal((await get(pub, path)).status, 404, path);
});

test('the X-Org-Id header is ignored for non-platform administrators', async () => {
  const pub = await login('admin@metrocity.example');
  const hlt = q.get("SELECT id FROM organizations WHERE uid = 'ORG-HLT-001'").id;
  const res = await (await get(pub, '/projects', { 'x-org-id': String(hlt) })).json();
  assert.ok(res.every((p) => p.code.startsWith('PUB-')));
});

test('lists and search only return the caller\'s tenant records', async () => {
  const hlt = await login('pm1@meridale.example');
  const projects = await (await get(hlt, '/projects')).json();
  assert.ok(projects.length > 0 && projects.every((p) => p.code.startsWith('HLT-')));
  const hits = await (await get(hlt, '/search?q=parking permit building')).json();
  assert.ok(hits.filter((h) => h.kind === 'Project').every((h) => h.ref.startsWith('HLT-')));
  const users = await (await get(hlt, '/directory')).json();
  assert.ok(users.every((u) => u.email.endsWith('@meridale.example')));
});

test('RBAC returns 403 and pack gating returns 403 independently', async () => {
  const supplier = await login('supplier@metrocity.example');
  assert.equal((await get(supplier, '/projects')).status, 403);
  const con = await login('process@cedarline.example'); // BND-03 has no MP-123/124 -> track editing gated
  const cfg = await (await get(con, '/config')).json();
  assert.equal(cfg.features.trackConfig, false);
});

test('unauthenticated requests are rejected', async () => {
  assert.equal((await fetch(`${base}/projects`)).status, 401);
});
