// Internal benchmarking: comparisons stay inside the organization or its group, peers are aggregates only.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/index.js';

let server; let base;
const login = async (email) => (await (await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'Demo#2026' }) })).json()).token;
const call = (token, path, method = 'GET', body) => fetch(`${base}${path}`, { method, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });

before(() => { server = createApp().listen(0); base = `http://localhost:${server.address().port}/api`; });
after(() => server.close());

test('within-organization benchmark compares the caller\'s own project types only', async () => {
  const t = await login('pm1@ridgeway.example');
  const d = await (await call(t, '/benchmark/organization?dimension=offer_type')).json();
  assert.deepEqual(d.rows.map((r) => r.segment).sort(), ['Product', 'Product-Service', 'Service']);
  assert.equal(d.rows.reduce((s, r) => s + r.metrics.projects, 0), d.total.projects);
});

test('group benchmark lists only organizations of the same group, as aggregates', async () => {
  const t = await login('exec@ridgeway.example');
  const d = await (await call(t, '/benchmark/group')).json();
  assert.equal(d.group, 'Atlas Infrastructure Holding');
  assert.deepEqual(d.rows.map((r) => r.segment).sort(), ['Cedarline Precast Systems', 'Orvane Transit Group', 'Ridgeway Construction Contractors']);
  for (const r of d.rows) assert.deepEqual(Object.keys(r).sort(), ['comparable', 'industry', 'metrics', 'ranks', 'segment', 'self', 'shared']);
  assert.ok(!JSON.stringify(d).includes('BLD-0') && !JSON.stringify(d).includes('CON-0'), 'no project codes leak');
});

test('an independent organization has no group comparison', async () => {
  const t = await login('exec@meridale.example');
  const d = await (await call(t, '/benchmark/group')).json();
  assert.equal(d.inGroup, false);
  assert.equal(d.rows.length, 0);
});

test('an organization that stops sharing disappears from its peers\' figures', async () => {
  const cedar = await login('exec@cedarline.example');
  assert.equal((await call(cedar, '/benchmark/sharing', 'PUT', { sharing: false })).status, 200);
  const d = await (await call(await login('exec@ridgeway.example'), '/benchmark/group')).json();
  const row = d.rows.find((r) => r.segment === 'Cedarline Precast Systems');
  assert.equal(row.shared, false);
  assert.deepEqual(row.metrics, {});
  await call(cedar, '/benchmark/sharing', 'PUT', { sharing: true });
});

test('benchmark permissions are enforced', async () => {
  assert.equal((await call(await login('supplier@ridgeway.example'), '/benchmark/organization')).status, 403);
  assert.equal((await call(await login('technician@ridgeway.example'), '/benchmark/group')).status, 403);
  assert.equal((await call(await login('pm1@ridgeway.example'), '/benchmark/sharing', 'PUT', { sharing: false })).status, 403);
});

test('the read cache never hides a change: a new project appears at once', async () => {
  const t = await login('pm1@ridgeway.example');
  const before = await (await call(t, '/projects')).json();
  const again = await call(t, '/projects');
  assert.equal(again.headers.get('x-cache'), 'HIT');
  const created = await (await call(t, '/projects', 'POST', { name: 'Cache check project', scores: { strategic: 2, investment: 1, novelty: 2, regulatory: 1, market: 1, reach: 2, integration: 1 } })).json();
  const after = await (await call(t, '/projects')).json();
  assert.equal(after.length, before.length + 1);
  assert.ok(after.some((p) => p.id === created.id));
  const admin = await login('admin@ridgeway.example');
  assert.equal((await call(admin, `/projects/${created.id}`, 'DELETE', { justification: 'test cleanup' })).status, 200);
});
