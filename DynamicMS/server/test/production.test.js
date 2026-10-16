// Production mode: start-up guards, first start on an empty database, no demonstration accounts,
// password change at first sign-in, setup file, and on-premises licence enforcement.
// Each scenario starts the real server as a child process on its own empty database.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SETUP = path.resolve(ROOT, '..', 'deploy', 'editor', 'setup.example.json');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-prod-'));
const children = [];
after(() => { for (const c of children) c.kill(); fs.rmSync(tmp, { recursive: true, force: true }); });

const ADMIN = { email: 'owner@editor.example', password: 'Initial-Admin-2026' };
const base = (port) => ({
  ...process.env, APP_MODE: 'production', NODE_ENV: 'production', PORT: String(port), JWT_SECRET: crypto.randomBytes(32).toString('hex'),
  ADMIN_EMAIL: ADMIN.email, ADMIN_PASSWORD: ADMIN.password, STORAGE_DIR: path.join(tmp, `st-${port}`), BACKUP_DIR: path.join(tmp, `bk-${port}`), DB_FILE: path.join(tmp, `db-${port}`, 'dynamicms.db'),
});

function start(env, { expectExit = false } = {}) {
  const c = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', 'src/index.js'], { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
  children.push(c);
  let out = '';
  c.stdout.on('data', d => { out += d; }); c.stderr.on('data', d => { out += d; });
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout; output:\n${out}`)), 120000);
    c.on('exit', (code) => { clearTimeout(t); if (expectExit) resolve({ code, out }); else reject(new Error(`exited ${code}:\n${out}`)); });
    if (!expectExit) c.stdout.on('data', () => { if (out.includes('listening on')) { clearTimeout(t); resolve({ child: c, log: () => out }); } });
  });
}

const call = async (port, method, p, token, body) => {
  const r = await fetch(`http://127.0.0.1:${port}/api${p}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};
const login = async (port, email, password) => (await call(port, 'POST', '/auth/login', null, { email, password })).body;

test('production refuses to start without its secrets', async () => {
  const env = base(4101); delete env.ADMIN_PASSWORD;
  const r = await start(env, { expectExit: true });
  assert.equal(r.code, 1); assert.match(r.out, /ADMIN_EMAIL and ADMIN_PASSWORD/);
  const weak = await start({ ...base(4102), ADMIN_PASSWORD: 'short' }, { expectExit: true });
  assert.match(weak.out, /at least 12 characters/);
  const jwt = await start({ ...base(4103), JWT_SECRET: 'too-short' }, { expectExit: true });
  assert.match(jwt.out, /JWT_SECRET/);
});

test('editor side: empty start, no demo accounts, password change first, setup file applied', async () => {
  const port = 4104;
  const s = await start({ ...base(port), DEPLOYMENT_MODE: 'saas', INIT_DATA: 'empty', SETUP_FILE: SETUP });
  const health = (await call(port, 'GET', '/health')).body;
  assert.equal(health.demo, false); assert.equal(health.mode, 'production');
  // No demonstration account exists.
  assert.ok(!(await login(port, 'admin@dynamicms.example', 'Admin@2026')).token);
  assert.ok(!(await login(port, 'quality@horizon-universal.example', 'Demo@2026')).token);
  const first = await login(port, ADMIN.email, ADMIN.password);
  assert.equal(first.mustChangePassword, true);
  assert.equal((await call(port, 'GET', '/tenancy/tree', first.token)).body.error.code, 'PASSWORD_CHANGE_REQUIRED');
  assert.equal((await call(port, 'PUT', '/auth/password', first.token, { current: ADMIN.password, next: 'weak' })).status, 400);
  assert.equal((await call(port, 'PUT', '/auth/password', first.token, { current: ADMIN.password, next: 'Owner-Secret-2026x' })).status, 200);
  // The setup file ran at start-up: group, organization, its users and project.
  let tree;
  for (let i = 0; i < 60; i++) {
    tree = (await call(port, 'GET', '/tenancy/tree', first.token)).body;
    if (tree.groups?.[0]?.orgs?.[0]?.projects?.length) break;
    await new Promise(r => setTimeout(r, 500));
  }
  const org = tree.groups.flatMap(g => g.orgs).find(o => o.code === 'ATUH');
  assert.ok(org, s.log()); assert.equal(org.projects[0].code, 'ATUH-QMS-01');
  const cfg = (await call(port, 'GET', `/admin/orgs/${org.id}/config`, first.token)).body;
  assert.equal(cfg.current?.pack || cfg.pack || cfg.config?.pack, 'DMS-PRO');
  const q = await login(port, 'quality@atlas-hospital.example', 'Change-Me-2026b');
  assert.equal(q.mustChangePassword, true);
  // An account needs an initial password in production.
  assert.equal((await call(port, 'POST', `/orgs/${org.id}/users`, first.token, { email: 'x@atlas-hospital.example', name: 'X', roles: ['employee'] })).body.error.code, 'INITIAL_PASSWORD_REQUIRED');
  // A second start does not create anything twice.
  s.child.kill();
  await new Promise(r => setTimeout(r, 500));
  const again = await start({ ...base(port), DEPLOYMENT_MODE: 'saas', SETUP_FILE: SETUP, ADMIN_PASSWORD: 'Different-Value-2026' });
  await new Promise(r => setTimeout(r, 1500));
  assert.match(again.log(), /0 organizations, 0 users, 0 projects/);
});

test('customer side: locked until a licence is installed, then packs and seats enforced', async () => {
  const port = 4105;
  const keys = crypto.generateKeyPairSync('ed25519');
  const pub = path.join(tmp, 'public.pem');
  fs.writeFileSync(pub, keys.publicKey.export({ type: 'spki', format: 'pem' }));
  await start({ ...base(port), DEPLOYMENT_MODE: 'onprem', INIT_DATA: 'empty', LICENCE_PUBLIC_KEY: pub, LICENCE_FILE: path.join(tmp, 'licence.lic') });
  const t0 = await login(port, ADMIN.email, ADMIN.password);
  assert.equal((await call(port, 'PUT', '/auth/password', t0.token, { current: ADMIN.password, next: 'Customer-Admin-2026' })).status, 200);
  const tk = t0.token;
  // No licence: read-only for everybody, the platform administrator included.
  assert.equal((await call(port, 'POST', '/tenancy/groups', tk, { name: 'G' })).body.error.code, 'LICENCE_INVALID');
  const payload = { customer: 'Atlas Health Group', seats: 2, expires: '2030-12-31', packs: ['DMS-PRO', 'DMS-CERT'], issued: '2026-10-16', deploymentMode: 'DEP-5' };
  const signature = crypto.sign(null, Buffer.from(JSON.stringify(payload)), keys.privateKey).toString('base64');
  const inst = await call(port, 'POST', '/admin/licence', tk, { licence: JSON.stringify({ payload, signature }) });
  assert.equal(inst.body.valid, true, JSON.stringify(inst.body));
  const org = await call(port, 'POST', '/tenancy/orgs', tk, { name: 'Atlas Hospital', sector: 'HCA', size: 'Large', emailDomain: 'atlas.example', adminEmail: 'admin@atlas.example', adminPassword: 'Atlas-Admin-2026a' });
  assert.equal(org.status, 201, JSON.stringify(org.body));
  const cfg = (await call(port, 'GET', `/admin/orgs/${org.body.id}/config`, tk)).body;
  assert.equal(cfg.current?.pack || cfg.pack || cfg.config?.pack, 'DMS-PRO');
  assert.equal((await call(port, 'PUT', `/admin/orgs/${org.body.id}/config`, tk, { capabilityPacks: ['DMS-AI'] })).body.error.code, 'NOT_LICENSED');
  assert.equal((await call(port, 'PUT', `/admin/orgs/${org.body.id}/config`, tk, { capabilityPacks: ['DMS-CERT'] })).status, 200);
  assert.equal((await call(port, 'POST', `/orgs/${org.body.id}/users`, tk, { email: 'q@atlas.example', name: 'Q', roles: ['quality_manager'], password: 'Quality-User-2026' })).status, 201);
  assert.equal((await call(port, 'POST', `/orgs/${org.body.id}/users`, tk, { email: 'r@atlas.example', name: 'R', roles: ['employee'], password: 'Employee-User-2026' })).body.error.code, 'SEATS_EXCEEDED');
});
