import { Router } from 'express';
import fs from 'node:fs';
import { ah, parseMl } from '../lib/http.js';
import { all, one, run } from '../db.js';
import { J, S, HttpError, now, uuid, pick } from '../lib/util.js';
import { requirePerm } from '../rbac.js';
import { audit } from '../audit.js';
import { effectiveConfig, solutionPacks, priceOf, orgConfig } from '../entitlements.js';
import { getLicenceProvider, OnPremLicenceProvider } from '../licensing/LicenceProvider.js';
import { issueSaasLicence, insertRecord } from '../services/projects.js';
import { backupNow, listBackups } from '../services/ops.js';
import { config } from '../config.js';
import * as cat from '../catalog.js';

const r = Router();
r.get('/config', requirePerm('config.view'), ah(req => ({ ...effectiveConfig(req.orgId), catalog: { packs: solutionPacks(), addOns: cat.list('addOn'), compliance: cat.list('complianceStandard'), integrations: cat.list('integration'), bundles: cat.list('bundle'), rules: cat.list('packagingRule') }, deploymentMode: config.deploymentMode })));
r.put('/config/pack', requirePerm('config.manage'), ah(req => {
  const sp = solutionPacks().find(p => p.id === req.body.pack_id); if (!sp) throw new HttpError(404, 'err.notFound');
  const cur = orgConfig(req.orgId);
  run(`UPDATE org_config SET pack_id=?, updated_at=? WHERE org_id=?`, sp.id, now(), req.orgId); // upgrade / downgrade keeps all data (FR-DA-PKG-03)
  audit(req, 'Configuration', req.orgId, 'pack', { pack: cur.pack_id }, { pack: sp.id, proration: prorate(cur.pack_id, sp.id) }, req.body._justification);
  return { ok: true, proration: prorate(cur.pack_id, sp.id) };
}));
function prorate(from, to) {
  const a = solutionPacks().find(p => p.id === from)?.price || 0, b = solutionPacks().find(p => p.id === to)?.price || 0;
  const d = new Date(); const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); const left = days - d.getDate() + 1;
  return { daysLeft: left, credit: +((a * left) / days).toFixed(2), charge: +((b * left) / days).toFixed(2), net: +(((b - a) * left) / days).toFixed(2) };
}
r.put('/config/addon', requirePerm('config.manage'), ah(req => {
  const { id, active } = req.body || {}; if (!cat.get('addOn', id)) throw new HttpError(404, 'err.notFound');
  const cfg = orgConfig(req.orgId); const set = new Set(cfg.addons); active ? set.add(id) : set.delete(id);
  run(`UPDATE org_config SET addons=?, updated_at=? WHERE org_id=?`, S([...set]), now(), req.orgId);
  audit(req, 'AddOnActivation', id, active ? 'activate' : 'deactivate'); return { ok: true, addons: [...set] };
}));
/** Compliance & Security Standards: independent toggles, idempotent controls scaffold, mandatory disclosure (CTRL-017, RULE-LIC-004). */
r.put('/config/compliance', requirePerm('config.manage'), ah(req => {
  const { id, active, disclosureAccepted } = req.body || {}; const std = cat.get('complianceStandard', id); if (!std) throw new HttpError(404, 'err.notFound');
  const cfg = orgConfig(req.orgId); const set = new Set(cfg.compliance);
  if (active) {
    if (!disclosureAccepted) throw new HttpError(422, 'err.disclosureRequired');
    let seeded = 0;
    if (!set.has(id)) {
      for (const c of std.controls) {
        const rid = `ctrl-${req.orgId}-${id}-${c.code}`;
        if (!one(`SELECT id FROM records WHERE id=?`, rid)) { insertRecord(rid, 'Control', req.orgId, null, `${id}:${c.code}`, { code: `${id}-${c.code}`, name: c.name, description: c.description, control_type: c.type, coso: c.coso, standard: id, effectiveness: 'Not tested', frequency: 'Quarterly', owner: 'Compliance Officer' }, req.user.id); seeded++; }
      }
    }
    set.add(id); audit(req, 'ComplianceStandardActivation', id, 'activate', null, { seeded });
  } else { set.delete(id); audit(req, 'ComplianceStandardActivation', id, 'deactivate'); } // controls are kept
  run(`UPDATE org_config SET compliance=?, updated_at=? WHERE org_id=?`, S([...set]), now(), req.orgId);
  return { ok: true, compliance: [...set] };
}));
r.get('/pricing/quote', requirePerm('config.view'), ah(req => priceOf(req.query.pack, Number(req.query.users || 0))));

// ------------------------------------------------------------------ Licensing (D30)
r.get('/licence', requirePerm('config.view'), ah(req => { const p = getLicenceProvider(req.orgId); const c = p.check(); return { mode: p.getMode(), ...c, canCreateUser: p.canCreateUser(), activeAddOns: p.getActiveAddOns() }; }));
r.post('/licence/upload', requirePerm('config.manage'), ah(req => {
  const lic = req.body?.licence; if (!lic || typeof lic !== 'object') throw new HttpError(422, 'err.required', { field: 'licence' });
  if (lic.companyId !== req.orgId) throw new HttpError(422, 'err.licenceOrg');   // a licence is issued for one organization
  if (!OnPremLicenceProvider.verify(lic)) throw new HttpError(422, 'err.licenceSignature');     // CTRL-016: only vendor-signed files, in both modes
  if (config.deploymentMode === 'onprem') {
    const existing = fs.existsSync(config.licenceFile) ? J(fs.readFileSync(config.licenceFile, 'utf8'), []) : [];
    const list = (Array.isArray(existing) ? existing : [existing]).filter(l => l.companyId !== lic.companyId); list.push(lic);
    fs.writeFileSync(config.licenceFile, JSON.stringify(list, null, 2));
    if (lic.plan && cat.get('solutionPack', lic.plan)) run(`UPDATE org_config SET pack_id=?, seats=?, updated_at=? WHERE org_id=?`, lic.plan, Number(lic.maxUsers) || 100, now(), req.orgId);
  } else {
    issueSaasLicence(req.orgId, lic.plan || orgConfig(req.orgId).pack_id, Number(lic.maxUsers || 100), Math.max(1, Math.round((new Date(lic.expiryDate) - Date.now()) / 86400000)));
  }
  audit(req, 'License', req.orgId, 'upload', null, { plan: lic.plan, maxUsers: lic.maxUsers, expiryDate: lic.expiryDate });
  return getLicenceProvider(req.orgId).check();
}));

// ------------------------------------------------------------------ External Integration Registry (FR-DA-CFG-10..14)
r.post('/integrations/:id/health', requirePerm('integrations.manage'), ah(req => {
  const rec = one(`SELECT * FROM records WHERE id=? AND entity='ExternalIntegration' AND org_id=?`, req.params.id, req.orgId); if (!rec) throw new HttpError(404, 'err.notFound');
  const d = J(rec.data); const outcome = !d.enabled ? 'disabled' : d.credential_ref ? 'success' : 'authFailure'; // provider detail never exposed
  d.last_health = outcome; d.last_health_at = now();
  run(`UPDATE records SET data=?, updated_at=? WHERE id=?`, S(d), now(), rec.id);
  run(`INSERT INTO integration_log(id,org_id,integration_id,direction,record,result,created_at) VALUES(?,?,?,?,?,?,?)`, uuid(), req.orgId, rec.id, 'health', '-', outcome, now());
  audit(req, 'ExternalIntegration', rec.id, 'health', null, { outcome }); return { outcome, at: d.last_health_at };
}));
r.get('/integrations/log', requirePerm('config.view'), ah(req => all(`SELECT * FROM integration_log WHERE org_id=? ORDER BY created_at DESC LIMIT 200`, req.orgId)));
/** Authenticated inbound webhook endpoint, scoped to the organization that registered the integration (FR-DA-CFG-14). */
r.post('/integrations/:id/inbound', requirePerm('integrations.manage'), ah(req => {
  const rec = one(`SELECT id FROM records WHERE id=? AND entity='ExternalIntegration' AND org_id=?`, req.params.id, req.orgId); if (!rec) throw new HttpError(404, 'err.notFound');
  run(`INSERT INTO integration_log(id,org_id,integration_id,direction,record,result,created_at) VALUES(?,?,?,?,?,?,?)`, uuid(), req.orgId, rec.id, 'inbound', String(req.body?.record || '-').slice(0, 120), 'accepted', now());
  return { ok: true };
}));

// ------------------------------------------------------------------ Onboarding: CSV import with validation (FR-DA-ONB-02)
r.post('/onboarding/import', requirePerm('onboarding.manage'), ah(req => {
  const { entity, csv, commit } = req.body || {}; const lines = String(csv || '').split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new HttpError(422, 'err.required', { field: 'csv' });
  const head = lines[0].split(/[;,]/).map(s => s.trim()); const ok = [], rejected = [];
  lines.slice(1).forEach((l, i) => {
    const cells = l.split(/[;,]/).map(s => s.trim()); const row = Object.fromEntries(head.map((h, k) => [h, cells[k] ?? '']));
    const missing = head.filter(h => h.endsWith('*') && !row[h]); if (missing.length) rejected.push({ line: i + 2, reason: 'missing ' + missing.join(', ') });
    else if (entity === 'Employee' && row.email && !/^[^@\s]+@[^@\s]+$/.test(row.email)) rejected.push({ line: i + 2, reason: 'invalid email' });
    else ok.push(Object.fromEntries(Object.entries(row).map(([k, v]) => [k.replace('*', ''), v])));
  });
  if (commit) for (const x of ok) insertRecord(uuid(), entity || 'Employee', req.orgId, null, null, x, req.user.id, false);
  audit(req, 'Import', entity, commit ? 'commit' : 'validate', null, { accepted: ok.length, rejected: rejected.length });
  return { accepted: ok.length, rejected, committed: !!commit };
}));

// ------------------------------------------------------------------ Audit log (read-only, FR-DA-AUD-03), backups, traceability
r.get('/audit', requirePerm('audit.view'), ah(req => all(`SELECT a.*, u.name user_name FROM audit_log a LEFT JOIN users u ON u.id=a.user_id WHERE a.org_id=? ${req.query.entity ? 'AND a.entity=?' : ''} ORDER BY a.created_at DESC LIMIT 500`, req.orgId, ...(req.query.entity ? [req.query.entity] : []))
  .map(a => ({ ...a, before_val: J(a.before_val), after_val: J(a.after_val) }))));
r.get('/backups', requirePerm('backup.manage'), ah(req => { if (!req.user.is_platform) throw new HttpError(403, 'err.platformOnly'); return { retentionDays: config.backupRetentionDays, items: listBackups() }; }));
r.post('/backups', requirePerm('backup.manage'), ah(req => { if (!req.user.is_platform) throw new HttpError(403, 'err.platformOnly'); const b = backupNow('on-demand'); audit(req, 'Backup', b.file, 'create'); return b; }));
r.get('/traceability', requirePerm('traceability.view'), ah(() => cat.list('trace')));
export default r;
