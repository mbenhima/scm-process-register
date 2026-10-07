#!/usr/bin/env node
// Provider administration from the server console (production): customer organizations, licences, packs, add-ons,
// users. Usage: npm run admin -- <command> [--option value ...]   (npm run admin -- help)
import { config } from '../src/config.js';
import { migrate, isSeeded, all, one, run, tx } from '../src/db.js';
import { uuid, now, S, J } from '../src/lib/util.js';
import { hashPassword } from '../src/auth.js';
import { provisionOrg, issueSaasLicence } from '../src/services/projects.js';
import * as cat from '../src/catalog.js';
import fs from 'node:fs';
import { OnPremLicenceProvider } from '../src/licensing/LicenceProvider.js';

const [cmd, ...rest] = process.argv.slice(2);
const a = {}; for (let i = 0; i < rest.length; i++) { if (rest[i].startsWith('--')) { const k = rest[i].slice(2); const v = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true; a[k] = v; } }
const fail = m => { console.error('\n  ' + m + '\n'); process.exit(1); };
const strong = pw => pw && pw.length >= 12 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw) && /[^\w]/.test(pw);
const packs = () => cat.list('solutionPack');
const findOrg = key => { if (!key) fail('Give the organization: --org <id or e-mail domain>.'); const o = one(`SELECT * FROM organizations WHERE id=? OR email_domain=?`, key, String(key).toLowerCase()); if (!o) fail(`No organization "${key}". List them with: npm run admin -- org-list`); return o; };
const name = o => { const n = J(o.name, o.name); return typeof n === 'object' ? n.en || n.fr || Object.values(n)[0] : n; };
const audit = (entity, id, action, after) => run(`INSERT INTO audit_log(id,org_id,user_id,entity,entity_id,action,after_val,created_at) VALUES(?,?,?,?,?,?,?,?)`, uuid(), entity === 'Organization' ? id : null, null, entity, id, action, S({ ...after, by: 'server console' }), now());

migrate();
if (!isSeeded()) fail('The database is not initialized. Run first: npm run init');

const HELP = `
  CortexSkills provider console (mode: ${config.deploymentMode})

  npm run admin -- org-create --name "Acme Group" --domain acme.com --pack BND-03 --seats 300 --days 365
                     --admin-email jane.doe@acme.com --admin-name "Jane Doe" --admin-password "Str0ng#Passw0rd"
                     [--segment LARGE|SME] [--sector HCPR] [--employees 1200] [--lang en|fr|ar] [--country Morocco] [--city Casablanca]
  npm run admin -- org-list
  npm run admin -- licence     --org acme.com [--pack BND-05] [--seats 500] [--days 365]      (SaaS: renew, resize, change pack)
  npm run admin -- addon       --org acme.com --id AD-08 --on | --off
  npm run admin -- packs                                                                  (list packs, bundles, add-ons, standards)
  npm run admin -- user-create --org acme.com --email john@acme.com --name "John" --password "..." [--role R-03]
  npm run admin -- password    --email john@acme.com --password "New#Passw0rd2026"
  npm run admin -- platform-admin --email ops@vendor.com --name "Ops" --password "..."
  npm run admin -- licence-request --org acme.com                                        (OnPrem: what to send to the vendor)
  npm run admin -- licence-install --file /path/to/acme.lic                              (OnPrem: install the vendor-signed licence)
`;

switch (cmd) {
  case 'org-create': {
    if (!a.name || !a.domain) fail('org-create needs --name and --domain (the e-mail domain of the customer).');
    const domain = String(a.domain).toLowerCase(); if (one(`SELECT id FROM organizations WHERE email_domain=?`, domain)) fail(`An organization already uses the domain ${domain}.`);
    const seg = String(a.segment || 'LARGE').toUpperCase(); const packId = a.pack || (seg === 'SME' ? 'SME-ESS' : 'PK-01');
    if (!packs().some(p => p.id === packId)) fail(`Unknown pack ${packId}. List them with: npm run admin -- packs`);
    if (a.sector && !cat.get('verticalSeed', a.sector)) fail(`Unknown sector ${a.sector}. Sectors: ${cat.list('verticalSeed').map(v => v.id).join(', ')}`);
    if (!a['admin-email'] || !strong(a['admin-password'])) fail('Give the customer administrator: --admin-email, --admin-name and a strong --admin-password (12+ characters, upper and lower case, digit, symbol).');
    if (one(`SELECT id FROM users WHERE email=?`, String(a['admin-email']).toLowerCase())) fail(`The e-mail ${a['admin-email']} is already used.`);
    const id = uuid(); const lang = ['en', 'fr', 'ar'].includes(a.lang) ? a.lang : 'en'; const n = String(a.name);
    tx(() => {
      run(`INSERT INTO organizations(id,group_id,name,sector,segment,employees,sme_segment,country,city,default_language,email_domain,benchmark_sharing,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,1,?)`,
        id, null, S({ en: n, fr: n, ar: n }), a.sector || null, seg, Number(a.employees) || null, null, a.country || null, a.city || null, lang, domain, now());
      provisionOrg(id, { packId, domain, lang, seats: Number(a.seats || 100), expiryDays: Number(a.days || 365) });
      const uid = uuid();
      run(`INSERT INTO users(id,org_id,email,name,password_hash,language,title,created_at) VALUES(?,?,?,?,?,?,?,?)`, uid, id, String(a['admin-email']).toLowerCase(), a['admin-name'] || 'Administrator', hashPassword(a['admin-password']), lang, { en: 'Organization administrator', fr: "Administrateur de l'organisation", ar: 'مسؤول المؤسسة' }[lang], now());
      run(`INSERT INTO user_roles(user_id,role_id) VALUES(?,?)`, uid, 'R-01');
      audit('Organization', id, 'create', { name: n, domain, pack: packId, seats: Number(a.seats || 100) });
    });
    console.log(`\n  Organization created: ${n}\n  Organization ID: ${id}\n  Pack: ${packId} · seats: ${a.seats || 100} · licence valid ${a.days || 365} days${config.deploymentMode === 'onprem' ? ' (OnPrem: upload the vendor-signed licence to activate it)' : ''}\n  Administrator: ${a['admin-email']} (role R-01, full rights in this organization)\n`);
    break;
  }
  case 'org-list':
    for (const o of all(`SELECT o.id, o.name, o.email_domain, o.segment, c.pack_id, c.seats, c.addons, l.data FROM organizations o LEFT JOIN org_config c ON c.org_id=o.id LEFT JOIN licences l ON l.org_id=o.id ORDER BY o.created_at`)) {
      const l = J(o.data, {}); console.log(`${o.id}  ${name(o).padEnd(32)} ${String(o.email_domain || '').padEnd(24)} ${o.segment}  pack ${o.pack_id}  seats ${o.seats}  users ${one(`SELECT COUNT(*) n FROM users WHERE org_id=? AND active=1`, o.id).n}  add-ons ${J(o.addons, []).join(',') || '—'}  licence until ${String(l.expiryDate || '—').slice(0, 10)}`);
    }
    break;
  case 'licence': {
    const o = findOrg(a.org); const cfg = one(`SELECT * FROM org_config WHERE org_id=?`, o.id); const cur = J(one(`SELECT data FROM licences WHERE org_id=?`, o.id)?.data, {});
    const packId = a.pack || cfg.pack_id; if (!packs().some(p => p.id === packId)) fail(`Unknown pack ${packId}.`);
    const seats = Number(a.seats || cfg.seats); const days = Number(a.days || 365);
    run(`UPDATE org_config SET pack_id=?, seats=?, updated_at=? WHERE org_id=?`, packId, seats, now(), o.id);
    const l = issueSaasLicence(o.id, packId, seats, days); audit('Organization', o.id, 'licence', { before: { plan: cur.plan, maxUsers: cur.maxUsers, expiryDate: cur.expiryDate }, after: { plan: packId, maxUsers: seats, expiryDate: l.expiryDate } });
    console.log(`\n  ${name(o)}: pack ${packId}, ${seats} users, valid until ${l.expiryDate.slice(0, 10)}.${config.deploymentMode === 'onprem' ? '\n  OnPrem mode: this record is informative; the signed licence file decides.' : ''}\n`);
    break;
  }
  case 'addon': {
    const o = findOrg(a.org); if (!cat.get('addOn', a.id)) fail(`Unknown add-on ${a.id}. List them with: npm run admin -- packs`);
    const set = new Set(J(one(`SELECT addons FROM org_config WHERE org_id=?`, o.id).addons, [])); a.off ? set.delete(a.id) : set.add(a.id);
    run(`UPDATE org_config SET addons=?, updated_at=? WHERE org_id=?`, S([...set]), now(), o.id); audit('Organization', o.id, a.off ? 'addon.off' : 'addon.on', { addon: a.id });
    console.log(`\n  ${name(o)}: add-ons ${[...set].join(', ') || 'none'}\n`);
    break;
  }
  case 'packs':
    console.log('\n  Packs, bundles and SME packs:'); for (const p of packs()) console.log(`   ${p.id.padEnd(8)} ${String(p.kind).padEnd(7)} ${(p.name?.en || '').padEnd(36)} contains ${(p.packs || []).join(', ')}\n            ${p.priceRule?.en || p.price}`);
    console.log('\n  Add-ons:'); for (const x of cat.list('addOn')) console.log(`   ${x.id.padEnd(8)} ${x.name?.en || x.name}`);
    console.log('\n  Compliance & security standards (activated by the customer, with the disclosure):'); for (const x of cat.list('complianceStandard')) console.log(`   ${x.id.padEnd(9)} ${x.name?.en || x.name}`);
    console.log('');
    break;
  case 'user-create': {
    const o = findOrg(a.org); if (!a.email || !strong(a.password)) fail('user-create needs --email, --name and a strong --password.');
    if (one(`SELECT id FROM users WHERE email=?`, String(a.email).toLowerCase())) fail(`The e-mail ${a.email} is already used.`);
    const role = a.role || 'R-01'; if (!one(`SELECT id FROM roles WHERE id=?`, role)) fail(`Unknown role ${role}.`);
    const uid = uuid(); run(`INSERT INTO users(id,org_id,email,name,password_hash,language,title,created_at) VALUES(?,?,?,?,?,?,?,?)`, uid, o.id, String(a.email).toLowerCase(), a.name || a.email, hashPassword(a.password), o.default_language || 'en', a.title || null, now());
    run(`INSERT INTO user_roles(user_id,role_id) VALUES(?,?)`, uid, role); audit('Organization', o.id, 'user.create', { email: a.email, role });
    console.log(`\n  User ${a.email} created in ${name(o)} with role ${role}.\n`);
    break;
  }
  case 'password': {
    const u = one(`SELECT id FROM users WHERE email=?`, String(a.email || '').toLowerCase()); if (!u) fail(`No user ${a.email}.`); if (!strong(a.password)) fail('Give a strong --password (12+ characters, upper and lower case, digit, symbol).');
    run(`UPDATE users SET password_hash=?, active=1 WHERE id=?`, hashPassword(a.password), u.id); console.log(`\n  Password changed for ${a.email}.\n`);
    break;
  }
  case 'platform-admin': {
    if (!a.email || !strong(a.password)) fail('platform-admin needs --email, --name and a strong --password.'); if (one(`SELECT id FROM users WHERE email=?`, String(a.email).toLowerCase())) fail(`The e-mail ${a.email} is already used.`);
    run(`INSERT INTO users(id,org_id,email,name,password_hash,language,title,is_platform,created_at) VALUES(?,?,?,?,?,?,?,1,?)`, uuid(), null, String(a.email).toLowerCase(), a.name || a.email, hashPassword(a.password), 'en', 'Platform Administrator', now());
    console.log(`\n  Platform administrator ${a.email} created.\n`);
    break;
  }
  case 'licence-request': {
    const o = findOrg(a.org); const cfg = one(`SELECT * FROM org_config WHERE org_id=?`, o.id);
    console.log(`\n  Send these lines to the vendor to receive the signed licence file:\n\n   Company: ${name(o)}\n   Organization ID: ${o.id}\n   Requested pack: ${cfg.pack_id}\n   Requested users: ${cfg.seats}\n   Add-ons: ${J(cfg.addons, []).join(', ') || 'none'}\n`);
    break;
  }
  case 'licence-install': {
    if (config.deploymentMode !== 'onprem') fail('licence-install is for OnPrem mode (DEPLOYMENT_MODE=onprem). In SaaS mode use: npm run admin -- licence --org ...');
    if (!a.file || !fs.existsSync(a.file)) fail('Give the licence file received from the vendor: --file /path/to/file.lic');
    let lic; try { lic = JSON.parse(fs.readFileSync(a.file, 'utf8')); } catch { fail('The file is not a CortexSkills licence (invalid JSON).'); }
    if (!OnPremLicenceProvider.verify(lic)) fail('The licence signature is not valid: the file was modified or was not signed by the vendor. Ask the vendor for a new file.');
    const o = one(`SELECT * FROM organizations WHERE id=?`, lic.companyId); if (!o) fail(`The licence is for Organization ID ${lic.companyId}, which does not exist in this database. Check the ID sent to the vendor (npm run admin -- org-list).`);
    const existing = fs.existsSync(config.licenceFile) ? J(fs.readFileSync(config.licenceFile, 'utf8'), []) : [];
    const list = (Array.isArray(existing) ? existing : [existing]).filter(l => l && l.companyId !== lic.companyId); list.push(lic);
    fs.writeFileSync(config.licenceFile, JSON.stringify(list, null, 2));
    if (lic.plan && packs().some(p => p.id === lic.plan)) run(`UPDATE org_config SET pack_id=?, seats=?, updated_at=? WHERE org_id=?`, lic.plan, Number(lic.maxUsers) || 100, now(), o.id);
    audit('Organization', o.id, 'licence.install', { plan: lic.plan, maxUsers: lic.maxUsers, expiryDate: lic.expiryDate });
    console.log(`\n  Licence installed for ${name(o)}: pack ${lic.plan}, ${lic.maxUsers} users, valid until ${String(lic.expiryDate).slice(0, 10)}.\n  File: ${config.licenceFile}. The users of this organization can sign in now (no restart needed).\n`);
    break;
  }
  default: console.log(HELP);
}
