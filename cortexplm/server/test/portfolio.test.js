// Portfolio scope, checklist templates and attachments.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/index.js';

let server; let base;
const login = async (email, password = 'Demo#2026') => (await (await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) })).json()).token;
const call = (token, path, method = 'GET', body) => fetch(`${base}${path}`, { method, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });

before(() => { server = createApp().listen(0); base = `http://localhost:${server.address().port}/api`; });
after(() => server.close());

test('a group executive sees the organizations of the group, never another group', async () => {
  const d = await (await call(await login('exec@ridgeway.example'), '/tenancy')).json();
  const names = [...d.groups.flatMap((g) => g.orgs), ...d.independent].map((o) => o.name).sort();
  assert.deepEqual(names, ['Cedarline Precast Systems', 'Orvane Transit Group', 'Ridgeway Real Estate Development']);
  const m = await (await call(await login('exec@ridgeway.example'), '/portfolio/matrix')).json();
  assert.ok(m.rows.every((r) => ['MFG', 'RED', 'TRN'].includes(r.code.slice(0, 3))));
  assert.equal(m.e2e.length, 9);
});

test('a product manager without portfolio.group sees only the own organization', async () => {
  const d = await (await call(await login('pm1@ridgeway.example'), '/portfolio/projects')).json();
  assert.ok(d.length > 0 && d.every((p) => p.code.startsWith('RED-') && p.own));
});

test('the platform administrator sees all seven organizations and 147 projects', async () => {
  const d = await (await call(await login('admin@cortexplm.example', 'Admin#2026'), '/tenancy')).json();
  assert.equal(d.totals.orgs, 7); assert.equal(d.totals.groups, 2); assert.equal(d.totals.projects >= 147, true);
  assert.equal(d.independent.length, 2);
});

test('a checklist template adds its items to an open gate once, not twice', async () => {
  const t = await login('pm1@metrocity.example');
  const gate = (await (await call(t, '/gates?status=Open')).json())[0];
  const tpl = (await (await call(t, '/checklist-templates?gate=' + gate.gate)).json())[0];
  const first = await (await call(t, `/gates/${gate.id}/checklist/from-template`, 'POST', { templateId: tpl.id })).json();
  const again = await (await call(t, `/gates/${gate.id}/checklist/from-template`, 'POST', { templateId: tpl.id })).json();
  assert.equal(again.added, 0);
  assert.ok(first.added + first.skipped === tpl.items.length);
  const manual = await call(t, `/gates/${gate.id}/checklist`, 'POST', { items: [{ text: `Test item typed by hand ${Date.now()}`, mandatory: 1 }] });
  assert.equal((await manual.json()).added, 1);
});

test('attachments refuse unknown file types and accept several files at once', async () => {
  const t = await login('pm1@metrocity.example');
  const task = (await (await call(t, '/tasks/mine')).json())[0];
  const form = new FormData(); form.append('entity_type', 'task'); form.append('entity_id', task.id);
  form.append('files', new Blob(['a,b']), 'data.csv'); form.append('files', new Blob(['%PDF-1.4']), 'report.pdf');
  const ok = await fetch(`${base}/evidence`, { method: 'POST', headers: { authorization: `Bearer ${t}` }, body: form });
  assert.equal((await ok.json()).files.length, 2);
  const bad = new FormData(); bad.append('entity_type', 'task'); bad.append('entity_id', task.id); bad.append('files', new Blob(['x']), 'tool.exe');
  assert.equal((await fetch(`${base}/evidence`, { method: 'POST', headers: { authorization: `Bearer ${t}` }, body: bad })).status, 400);
});

const DOMAIN = `prov-${Date.now()}.example`;
test('a new organization gets the standard content and, on request, its starting team', async () => {
  const t = await login('admin@cortexplm.example', 'Admin#2026');
  const r = await (await call(t, '/organizations', 'POST', { name: 'Test Org Provisioning', industry: 'Healthcare', country: 'France', subscription_id: 'BND-06', starter_team: true, domain: DOMAIN, initial_password: 'Start#2026' })).json();
  assert.equal(r.users, 24);
  const pm = await login(`pm1@${DOMAIN}`, 'Start#2026');
  assert.ok((await (await call(pm, '/ai/use-cases')).json()).length >= 23);
  const tpls = await (await call(pm, '/checklist-templates')).json();
  assert.ok(tpls.some((x) => x.auto_apply) && tpls.some((x) => x.name === 'Medical device regulatory file check'));
  const again = await call(t, '/organizations', 'POST', { name: 'Duplicate', industry: 'Healthcare', subscription_id: 'BND-06', starter_team: true, domain: DOMAIN, initial_password: 'Start#2026' });
  assert.equal(again.status, 409);
});
