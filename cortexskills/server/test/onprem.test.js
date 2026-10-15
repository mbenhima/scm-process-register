// OnPrem customer edition (release 1.15): the plan, the users and the add-ons come only from the vendor-signed licence
// file; no price, quote or pricing screen is exposed (COMMERCIAL_INFO=hidden); a tampered licence is ignored.
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
const LIC = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cs-onprem-')), 'license.lic');
Object.assign(process.env, { DEPLOYMENT_MODE: 'onprem', COMMERCIAL_INFO: 'hidden', LICENSE_PATH: LIC });
const { test, before, after } = await import('node:test');
const assert = (await import('node:assert/strict')).default;
const jwt = (await import('jsonwebtoken')).default;
const { createApp } = await import('../src/app.js');
const { one } = await import('../src/db.js');
const { config } = await import('../src/config.js');
const { signLicence } = await import('../tools/sign-licence.js');
const { orgConfig, quotas } = await import('../src/entitlements.js');

let server, base, token, org;
const call = async (method, p, body) => {
  const res = await fetch(base + '/api' + p, { method, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  let data = null; try { data = await res.json(); } catch { /* empty */ } return { status: res.status, data };
};
const write = list => fs.writeFileSync(LIC, JSON.stringify(list));
before(async () => {
  const u = one(`SELECT u.id, u.org_id FROM users u JOIN user_roles r ON r.user_id=u.id AND r.role_id='R-01' JOIN organizations o ON o.id=u.org_id WHERE o.sector='HCPR' LIMIT 1`);
  assert.ok(u, 'an organization administrator'); org = u.org_id;
  write([signLicence({ company: 'IT OnPrem', companyId: org, expiryDate: '2030-12-31', maxUsers: 42, plan: 'PK-03', features: [], addons: ['AD-02'] })]);
  const app = await createApp({ background: false });
  server = app.listen(0); await new Promise(r => server.once('listening', r)); base = `http://127.0.0.1:${server.address().port}`;
  token = jwt.sign({ sub: u.id }, config.jwtSecret, { expiresIn: '1h' });
});
after(() => { server?.close(); fs.rmSync(path.dirname(LIC), { recursive: true, force: true }); });

test('the plan, users and add-ons are those of the signed licence', () => {
  const c = orgConfig(org);
  assert.equal(c.pack_id, 'PK-03'); assert.equal(c.seats, 42); assert.deepEqual(c.addons, ['AD-02']); assert.equal(quotas(org).users, 42);
});
test('the customer cannot change the plan or the add-ons', async () => {
  assert.equal((await call('PUT', '/config/pack', { pack_id: 'BND-05' })).status, 403);
  assert.equal((await call('PUT', '/config/addon', { id: 'AD-03', active: true })).status, 403);
  assert.equal(orgConfig(org).pack_id, 'PK-03');
});
test('no price is exposed', async () => {
  const cfg = (await call('GET', '/config')).data;
  assert.equal(cfg.commercial, false); assert.equal(cfg.licenceManaged, true);
  assert.ok(!/"(price|priceRule|overage|priceDetail|discount)"/.test(JSON.stringify(cfg)), 'no price field in the configuration');
  assert.equal((await call('GET', '/pricing/quote?pack=PK-01&users=10')).status, 404);
  const nav = (await call('GET', '/nav')).data;
  assert.ok(nav && !nav.items.some(i => i.id === 'pricing'), 'no pricing entry in the menu');
});
test('a tampered licence gives nothing', () => {
  const l = signLicence({ company: 'IT OnPrem', companyId: org, expiryDate: '2030-12-31', maxUsers: 42, plan: 'PK-03', features: [] });
  write([{ ...l, plan: 'BND-05', maxUsers: 9999 }]);
  const c = orgConfig(org); assert.equal(c.seats, 0); assert.deepEqual(c.addons, []);
});
