// Setup file (production): creates groups, organizations, their configuration, users and projects
// at start-up, through the application's own API so that every rule applies (packs, licence,
// quotas, password policy). Each organization, user and project is created once: the file can be
// kept and extended, and a later start only adds what is new.
// File format: see deploy/setup.example.json.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { config } from '../config.js';
import { get, run } from '../db.js';
import { sign } from '../auth.js';

// Lets the start-up job call the API while the administrator has not yet changed the initial password.
export const SETUP_SECRET = crypto.randomBytes(24).toString('hex');

export async function applySetupFile(file = config.setupFile) {
  if (!file || !fs.existsSync(file)) { console.log(`[setup] no file at ${file}`); return; }
  const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
  const admin = get('SELECT * FROM users WHERE is_platform_admin=1 AND status=? ORDER BY created_at LIMIT 1', 'Active');
  if (!admin) throw new Error('no platform administrator');
  const token = sign(admin);
  const base = `http://127.0.0.1:${config.port}/api`;
  const call = async (method, path, body) => {
    const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-DMS-Setup': SETUP_SECRET, 'Accept-Language': 'en' }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`${method} ${path}: ${j.error?.message || r.status}`);
    return j;
  };
  const report = { groups: 0, organizations: 0, users: 0, projects: 0, skipped: 0, errors: [] };
  const step = async (label, fn) => { try { await fn(); } catch (e) { report.errors.push(`${label}: ${e.message}`); } };

  const groupIds = {};
  for (const g of spec.groups || []) {
    const found = get("SELECT id FROM groups_ WHERE json_extract(name,'$.en')=? OR json_extract(name,'$.fr')=?", g.name, g.name);
    if (found) { groupIds[g.key || g.name] = found.id; report.skipped++; continue; }
    await step(`group ${g.name}`, async () => { groupIds[g.key || g.name] = (await call('POST', '/tenancy/groups', { name: g.name, description: g.description || '' })).id; report.groups++; });
  }
  for (const o of spec.organizations || []) {
    let orgId = get('SELECT id FROM organizations WHERE email_domain=?', o.emailDomain)?.id;
    if (!orgId) {
      await step(`organization ${o.name}`, async () => {
        orgId = (await call('POST', '/tenancy/orgs', {
          name: o.name, code: o.code, sector: o.sector || 'UNI', size: o.size || 'Large', employees: o.employees, country: o.country, city: o.city, lang: o.lang,
          emailDomain: o.emailDomain, groupId: o.group ? groupIds[o.group] : null, currency: o.currency, currencies: o.currencies,
          adminEmail: o.admin?.email, adminName: o.admin?.name, adminPassword: o.admin?.password,
        })).id;
        report.organizations++;
        if (o.config) await call('PUT', `/admin/orgs/${orgId}/config`, { ...o.config, acknowledgeDisclosure: true });
      });
    } else report.skipped++;
    if (!orgId) continue;
    for (const u of o.users || []) {
      if (get('SELECT 1 FROM users WHERE lower(email)=?', String(u.email || '').toLowerCase())) { report.skipped++; continue; }
      await step(`user ${u.email}`, async () => { await call('POST', `/orgs/${orgId}/users`, { email: u.email, name: u.name, roles: u.roles, password: u.password, lang: u.lang }); report.users++; });
    }
    for (const p of o.projects || []) {
      if (p.code && get('SELECT 1 FROM projects WHERE org_id=? AND code=?', orgId, p.code)) { report.skipped++; continue; }
      if (!p.code && get("SELECT 1 FROM projects WHERE org_id=? AND json_extract(name,'$.en')=?", orgId, p.name)) { report.skipped++; continue; }
      await step(`project ${p.name}`, async () => {
        const tpl = p.template ? get('SELECT id FROM project_templates WHERE code=? AND status=? AND (org_id IS NULL OR org_id=?)', p.template, 'Published', orgId) : null;
        if (p.template && !tpl) throw new Error(`unknown project template ${p.template}`);
        await call('POST', `/orgs/${orgId}/projects`, { name: p.name, code: p.code, description: p.description, msType: p.msType || 'QMS', mode: p.mode, track: p.track, justification: p.justification,
          creationMode: tpl ? 'catalog' : 'manual', templateId: tpl?.id, startDate: p.startDate, endDate: p.endDate, standards: p.standards, levels: p.levels });
        report.projects++;
      });
    }
  }
  run("INSERT INTO meta(key,value) VALUES('setup_applied_at',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", new Date().toISOString());
  console.log(`[setup] created ${report.groups} groups, ${report.organizations} organizations, ${report.users} users, ${report.projects} projects; ${report.skipped} already present.`);
  for (const e of report.errors) console.error(`[setup] ${e}`);
  return report;
}
