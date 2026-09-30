// Administration: configuration and pricing, licence, permission matrix, audit trail,
// versions, attachments, integrations, operations, libraries, imports and traceability.
import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { all, get, run, uid, now, J, P, tx, getDb } from '../db.js';
import { requirePerm, can, assertFeature, invalidateMatrix, loadMatrix } from '../auth.js';
import { h, send, row, rows, bad, notFound, forbidden, requireOrg, loadOrgRow, paginate, HttpError, orgAccess } from '../http.js';
import { audit, snapshot, versions } from '../services/audit.js';
import { orgConfig, computePrice, BASE_PACKS, CAPABILITY_FEATURES, ADDON_FEATURES, COMPLIANCE_STANDARDS, NON_CERT_DISCLOSURE, FEATURES } from '../packs.js';
import { ROLES, PERMISSIONS, BASELINE_CLASSES } from '../permissions.js';
import { backupNow, listBackups, licenceStatus, installLicence } from '../services/ops.js';
import { catalog } from '../catalog/store.js';
import { TRACE, traceOf } from '../services/traceability.js';
import { config } from '../config.js';

const r = Router();

// ---- Configuration: packs, add-ons, compliance standards (FR-DA-CFG)
r.get('/orgs/:id/config', requirePerm('tenancy.view', 'config.manage'), h((req, res) => {
  requireOrg(req, req.params.id);
  const o = get('SELECT * FROM organizations WHERE id=?', req.params.id);
  const c = catalog();
  send(req, res, {
    config: orgConfig(o), price: computePrice(o), annualPrice: computePrice(o, { annual: true }), features: FEATURES,
    basePacks: Object.entries(BASE_PACKS).map(([id, v]) => ({ id, ...v, name: c.packs.find(p => p.id === id)?.name })),
    industryPacks: c.packs.filter(p => p.type === 'Industry Pack' || /Industry/.test(p.type)).map(p => ({ id: p.id, name: p.name })),
    capabilityPacks: Object.keys(CAPABILITY_FEATURES).map(id => ({ id, name: c.packs.find(p => p.id === id)?.name, features: CAPABILITY_FEATURES[id] })),
    addons: c.addons.map(a => ({ ...a, features: ADDON_FEATURES[a.id] })), complianceStandards: COMPLIANCE_STANDARDS.map(s => ({ id: s.id, name: s.name, price: s.price, controls: s.controls.length })),
    deploymentModes: c.deploymentModes, disclosure: NON_CERT_DISCLOSURE,
  });
}));
r.put('/orgs/:id/config', requirePerm('config.manage'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  const o = get('SELECT * FROM organizations WHERE id=?', req.params.id);
  const b = req.body || {};
  const c = catalog();
  if (b.pack && !BASE_PACKS[b.pack]) throw bad('BAD_PACK', 'Unknown Solution Pack.');
  if (b.addons && b.addons.some(a => !ADDON_FEATURES[a])) throw bad('BAD_ADDON', 'Unknown add-on.');
  if (b.capabilityPacks && b.capabilityPacks.some(a => !CAPABILITY_FEATURES[a])) throw bad('BAD_PACK', 'Unknown capability pack.');
  if (b.industryPacks && b.industryPacks.some(a => !c.packs.find(p => p.id === a))) throw bad('BAD_PACK', 'Unknown industry pack.');
  if (b.deploymentMode && !c.deploymentModes.find(d => d.code === b.deploymentMode)) throw bad('BAD_MODE', 'Unknown deployment mode.');
  const cur = P(o.compliance_standards) || [];
  const next = b.complianceStandards || cur;
  const added = next.filter(s => !cur.includes(s));
  if (added.length && !b.acknowledgeDisclosure) throw bad('DISCLOSURE_REQUIRED', 'Acknowledge that a Compliance & Security Standard is not a certification.');
  if (next.some(s => !COMPLIANCE_STANDARDS.find(x => x.id === s))) throw bad('BAD_STANDARD', 'Unknown standard.');
  // Quota ceilings of a downgrade must hold the current usage.
  if (b.pack && b.pack !== o.pack) {
    const q = BASE_PACKS[b.pack].quotas;
    const users = get('SELECT COUNT(*) n FROM users WHERE org_id=?', o.id).n; const projs = get('SELECT COUNT(*) n FROM projects WHERE org_id=?', o.id).n;
    if (users > q.users || projs > q.projects) throw new HttpError(409, 'QUOTA_CONFLICT', `Current usage (${users} users, ${projs} projects) exceeds the ${b.pack} ceilings.`);
  }
  tx(() => {
    run('UPDATE organizations SET pack=COALESCE(?,pack), industry_packs=COALESCE(?,industry_packs), capability_packs=COALESCE(?,capability_packs), addons=COALESCE(?,addons), compliance_standards=?, deployment_mode=COALESCE(?,deployment_mode) WHERE id=?',
      b.pack || null, b.industryPacks ? J(b.industryPacks) : null, b.capabilityPacks ? J(b.capabilityPacks) : null, b.addons ? J(b.addons) : null, J(next), b.deploymentMode || null, o.id);
    // Idempotent scaffold: seed missing controls only; deactivating keeps existing controls.
    for (const sId of added) {
      const cs = COMPLIANCE_STANDARDS.find(x => x.id === sId);
      cs.controls.forEach((ctl, j) => {
        const code = `${sId}-C${j + 1}`;
        if (!get('SELECT 1 FROM controls WHERE org_id=? AND code=?', o.id, code)) run('INSERT INTO controls(id,org_id,code,name,description,type,coso,frequency,owner_role,effectiveness,standard,step_refs,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)', uid(), o.id, code, J(ctl), J(ctl), 'Preventive', 'Control Activities', 'Quarterly', 'compliance_officer', 'Not tested', sId, J([]), now());
      });
    }
    audit(req, o.id, 'configuration', o.id, 'update', { pack: o.pack, addons: P(o.addons), standards: cur }, b, b.justification || null);
    snapshot(req, o.id, 'configuration', o.id, row(get('SELECT pack, industry_packs, capability_packs, addons, compliance_standards, deployment_mode FROM organizations WHERE id=?', o.id)), b.justification || null);
  });
  res.json({ ok: true, config: orgConfig(get('SELECT * FROM organizations WHERE id=?', o.id)) });
}));
r.post('/pricing/quote', requirePerm('config.manage'), h((req, res) => {
  const b = req.body || {};
  res.json(computePrice({ pack: b.pack || 'DMS-SME', industry_packs: J(b.industryPacks || []), capability_packs: J(b.capabilityPacks || []), addons: J(b.addons || []), compliance_standards: J(b.complianceStandards || []), deployment_mode: b.deploymentMode || 'DEP-1' }, { annual: !!b.annual }));
}));

// ---- Licence (SaaS / on-premises)
r.get('/licence', h((req, res) => res.json(licenceStatus())));
r.post('/licence', h((req, res) => {
  if (!req.user.is_platform_admin) throw forbidden();
  try { res.json(installLicence(String(req.body?.licence || ''))); } catch (e) { throw bad('BAD_LICENCE', e.message); }
}));

// ---- Permission matrix (FR-DA-RBAC-02)
r.get('/permissions', requirePerm('permissions.manage', 'users.manage'), h((req, res) => {
  const m = all('SELECT role, perm, granted, customized FROM role_permissions');
  send(req, res, { roles: ROLES.map(x => ({ ...x, className: BASELINE_CLASSES[x.cls] })), permissions: PERMISSIONS.map(([code, label]) => ({ code, label, module: code.split('.')[0] })), grants: m });
}));
r.put('/permissions', requirePerm('permissions.manage'), h((req, res) => {
  const { role, perm, granted } = req.body || {};
  if (!ROLES.find(x => x.code === role) || !PERMISSIONS.find(p => p[0] === perm)) throw bad('BAD_CELL', 'Unknown role or permission.');
  if (role === 'platform_admin') throw bad('LOCKED_ROLE', 'Platform administrator permissions cannot be removed.');
  if (!req.user.is_platform_admin && perm === 'permissions.manage') throw forbidden('LOCKED_PERMISSION', 'Only a platform administrator can change who edits the matrix.');
  const before = get('SELECT granted FROM role_permissions WHERE role=? AND perm=?', role, perm);
  run('INSERT INTO role_permissions(role,perm,granted,customized) VALUES(?,?,?,1) ON CONFLICT(role,perm) DO UPDATE SET granted=excluded.granted, customized=1', role, perm, granted ? 1 : 0);
  invalidateMatrix(); loadMatrix();
  audit(req, req.user.org_id, 'permission', `${role}:${perm}`, 'update', before, { granted: !!granted }, null);
  res.json({ ok: true });
}));

// ---- Audit trail (FR-DA-AUD)
r.get('/audit-log', requirePerm('audit.view'), h((req, res) => {
  const orgId = req.query.orgId || req.user.org_id;
  if (orgId) requireOrg(req, orgId); else if (!req.user.is_platform_admin) throw forbidden();
  const { limit, offset } = paginate(req);
  const where = [orgId ? 'a.org_id=?' : 'a.org_id IS NULL']; const args = orgId ? [orgId] : [];
  if (req.query.entityType) { where.push('a.entity_type=?'); args.push(req.query.entityType); }
  if (req.query.entityId) { where.push('a.entity_id=?'); args.push(req.query.entityId); }
  if (req.query.action) { where.push('a.action=?'); args.push(req.query.action); }
  if (req.query.userId) { where.push('a.user_id=?'); args.push(req.query.userId); }
  const total = get(`SELECT COUNT(*) n FROM audit_log a WHERE ${where.join(' AND ')}`, ...args).n;
  send(req, res, { total, items: rows(all(`SELECT a.*, u.name AS user_name FROM audit_log a LEFT JOIN users u ON u.id=a.user_id WHERE ${where.join(' AND ')} ORDER BY a.at DESC LIMIT ? OFFSET ?`, ...args, limit, offset)) });
}));

// ---- Generic version management (FR-DA-VER)
const VERSIONED = { rule: 'business_rules', control: 'controls', risk: 'risks', kpi: 'kpis', action: 'actions', register: 'registers', nc: 'ncs', ai_usecase: 'ai_usecases', project: 'projects', organization: 'organizations', bpmn: 'bpmn_diagrams', racsi: null, step: null, configuration: null };
const PROTECTED = new Set(['id', 'org_id', 'project_id', 'created_at', 'code']);
r.get('/versions/:type/:id', requirePerm('audit.view', 'governance.view', 'records.view'), h((req, res) => {
  const list = rows(versions(req.params.type, req.params.id));
  if (!list.length) return send(req, res, []);
  requireOrg(req, list[0].org_id);
  const users = Object.fromEntries(all('SELECT id, name FROM users WHERE org_id=?', list[0].org_id).map(u => [u.id, u.name]));
  send(req, res, list.map(v => ({ ...v, user_name: users[v.user_id] || null })));
}));
r.get('/versions/:type/:id/compare', requirePerm('audit.view', 'governance.view', 'records.view'), h((req, res) => {
  const list = rows(versions(req.params.type, req.params.id));
  if (!list.length) throw notFound('Version');
  requireOrg(req, list[0].org_id);
  const a = list.find(v => v.version === +req.query.a); const b = list.find(v => v.version === +req.query.b);
  if (!a || !b) throw bad('VERSIONS_REQUIRED', 'Choose two versions.');
  const keys = [...new Set([...Object.keys(a.data || {}), ...Object.keys(b.data || {})])];
  send(req, res, { a: a.version, b: b.version, fields: keys.map(k => ({ field: k, a: a.data?.[k] ?? null, b: b.data?.[k] ?? null, changed: JSON.stringify(a.data?.[k]) !== JSON.stringify(b.data?.[k]) })) });
}));
r.post('/versions/:type/:id/revert', requirePerm('governance.manage', 'records.manage'), h((req, res) => {
  const table = VERSIONED[req.params.type];
  if (!table) throw bad('NOT_REVERTIBLE', 'This entity type is reverted through its own workflow.');
  const v = get('SELECT * FROM entity_versions WHERE entity_type=? AND entity_id=? AND version=?', req.params.type, req.params.id, +req.body?.version);
  if (!v) throw notFound('Version');
  requireOrg(req, v.org_id, true);
  if (!req.body?.justification) throw bad('JUSTIFICATION_REQUIRED', 'A justification is required to revert.');
  const cols = new Set(getDb().prepare(`PRAGMA table_info(${table})`).all().map(c => c.name));
  const data = P(v.data) || {};
  const set = Object.entries(data).filter(([k]) => cols.has(k) && !PROTECTED.has(k));
  if (!set.length) throw bad('NOTHING_TO_REVERT', 'This version holds no restorable fields.');
  tx(() => {
    run(`UPDATE ${table} SET ${set.map(([k]) => `${k}=?`).join(', ')} WHERE id=?`, ...set.map(([, x]) => (x !== null && typeof x === 'object' ? J(x) : x)), req.params.id);
    const nv = snapshot(req, v.org_id, req.params.type, req.params.id, data, { [req.lang]: `Revert to v${v.version}: ${req.body.justification}` });
    audit(req, v.org_id, req.params.type, req.params.id, 'revert', null, { toVersion: v.version, newVersion: nv }, req.body.justification);
  });
  res.json({ ok: true });
}));

// ---- Attachments (FR-DA-ATT)
const ALLOWED = /^(application\/pdf|image\/(png|jpeg|gif|webp)|text\/(plain|csv)|application\/(vnd\.openxmlformats-officedocument\..+|msword|vnd\.ms-excel|zip|xml)|application\/octet-stream)$/;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1048576, files: 10 }, fileFilter: (_req, f, cb) => cb(null, ALLOWED.test(f.mimetype)) });
const ENTITY_TABLE = { action: 'actions', checklist_item: 'checklist_items', nc: 'ncs', document: 'documents', step: 'step_exec', audit: 'audits' };
r.post('/attachments', requirePerm('records.create', 'execution.perform'), upload.array('files', 10), h((req, res) => {
  const table = ENTITY_TABLE[req.body?.entityType];
  if (!table) throw bad('BAD_ENTITY', 'Unsupported entity type.');
  const ent = loadOrgRow(req, table, req.body.entityId, true, 'Record');
  if (!req.files?.length) throw bad('NO_FILES', 'Choose at least one allowed file (PDF, image, Office, CSV, text).');
  const dir = path.join(config.storageDir, ent.org_id);
  fs.mkdirSync(dir, { recursive: true });
  const ids = [];
  // A new version of an existing file keeps the chain (group_id) and increments the version.
  const prev = req.body?.replaces ? get('SELECT * FROM attachments WHERE id=? AND org_id=? AND entity_type=? AND entity_id=?', req.body.replaces, ent.org_id, req.body.entityType, ent.id) : null;
  if (req.body?.replaces && !prev) throw bad('BAD_REPLACES', 'The file to replace was not found on this record.');
  for (const f of req.files) {
    const id = uid();
    fs.writeFileSync(path.join(dir, id), f.buffer);
    const group = prev ? (prev.group_id || prev.id) : id;
    const version = prev ? (get('SELECT MAX(version) m FROM attachments WHERE group_id=? OR id=?', group, group).m || 1) + 1 : 1;
    run('INSERT INTO attachments(id,org_id,entity_type,entity_id,filename,mime,size,path,author,at,version,group_id,note) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)', id, ent.org_id, req.body.entityType, ent.id, path.basename(f.originalname).slice(0, 200), f.mimetype, f.size, path.join(ent.org_id, id), req.user.id, now(), version, group, req.body?.note ? String(req.body.note).slice(0, 500) : null);
    ids.push(id);
  }
  audit(req, ent.org_id, req.body.entityType, ent.id, prev ? 'attach_version' : 'attach', prev ? { file: prev.filename, version: prev.version || 1 } : null, { files: req.files.map(f => f.originalname), note: req.body?.note || null }, null);
  res.status(201).json({ ids });
}));
r.get('/attachments', requirePerm('records.view', 'execution.view'), h((req, res) => {
  const table = ENTITY_TABLE[req.query.entityType];
  if (!table) throw bad('BAD_ENTITY', 'Unsupported entity type.');
  const ent = loadOrgRow(req, table, req.query.entityId, false, 'Record');
  res.json(all('SELECT a.id, a.filename, a.mime, a.size, a.at, COALESCE(a.version,1) AS version, COALESCE(a.group_id,a.id) AS group_id, a.note, u.name AS author FROM attachments a LEFT JOIN users u ON u.id=a.author WHERE a.entity_type=? AND a.entity_id=? ORDER BY a.at', req.query.entityType, ent.id));
}));
r.get('/attachments/:id/download', requirePerm('records.view', 'execution.view'), h((req, res) => {
  const a = loadOrgRow(req, 'attachments', req.params.id, false, 'Attachment');
  const file = path.join(config.storageDir, a.path);
  if (!fs.existsSync(file)) throw notFound('File');
  res.setHeader('Content-Type', a.mime); res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(a.filename)}"`);
  fs.createReadStream(file).pipe(res);
}));
r.delete('/attachments/:id', requirePerm('records.manage'), h((req, res) => {
  const a = loadOrgRow(req, 'attachments', req.params.id, true, 'Attachment');
  run('DELETE FROM attachments WHERE id=?', a.id);
  try { fs.rmSync(path.join(config.storageDir, a.path)); } catch { /* already removed */ }
  audit(req, a.org_id, a.entity_type, a.entity_id, 'detach', { file: a.filename }, null, null);
  res.json({ ok: true });
}));

// ---- Integrations (FR-DA-VIN)
r.get('/orgs/:id/integrations', requirePerm('integrations.manage', 'tenancy.view'), h((req, res) => {
  requireOrg(req, req.params.id);
  const c = catalog();
  const list = rows(all('SELECT * FROM integrations WHERE org_id=? ORDER BY code', req.params.id));
  send(req, res, list.map(i => ({ ...i, credential_ref: i.credential_ref ? '••••' : null, catalog: c.integrations.find(x => x.id === i.code), log: all('SELECT direction, record, result, at FROM integration_log WHERE integration_id=? ORDER BY at DESC LIMIT 5', i.id) })));
}));
r.put('/integrations/:id', requirePerm('integrations.manage'), h((req, res) => {
  const i = loadOrgRow(req, 'integrations', req.params.id, true, 'Integration');
  assertFeature(i.org_id, 'integrations');
  const b = req.body || {};
  if (b.config?.endpoint && !/^https:\/\/[\w.-]+(:\d+)?(\/[\w./-]*)?$/.test(b.config.endpoint)) throw bad('BAD_ENDPOINT', 'The endpoint must be an https URL.');
  run('UPDATE integrations SET enabled=COALESCE(?,enabled), config=COALESCE(?,config), mapping=COALESCE(?,mapping), credential_ref=COALESCE(?,credential_ref) WHERE id=?', b.enabled === undefined ? null : (b.enabled ? 1 : 0), b.config ? J(b.config) : null, b.mapping ? J(b.mapping) : null, b.secret ? `vault://${i.org_id}/${i.code}` : null, i.id);
  audit(req, i.org_id, 'integration', i.id, 'update', { enabled: i.enabled }, { ...b, secret: b.secret ? '••••' : undefined }, null);
  res.json({ ok: true });
}));
r.post('/integrations/:id/test', requirePerm('integrations.manage'), h((req, res) => {
  const i = loadOrgRow(req, 'integrations', req.params.id, true, 'Integration');
  const ok = !!(i.enabled && i.config?.endpoint && i.credential_ref);
  run('UPDATE integrations SET health=?, checked_at=? WHERE id=?', ok ? 'OK' : 'Failed', now(), i.id);
  run('INSERT INTO integration_log(id,org_id,integration_id,direction,record,result,at) VALUES(?,?,?,?,?,?,?)', uid(), i.org_id, i.id, 'test', 'connection', ok ? 'OK' : 'Missing endpoint or credential', now());
  res.json({ health: ok ? 'OK' : 'Failed' });
}));

// ---- Operations (FR-DA-OPS)
r.get('/backups', requirePerm('ops.manage'), h((req, res) => { if (!req.user.is_platform_admin) throw forbidden(); res.json({ retentionDays: config.backupRetentionDays, items: listBackups() }); }));
r.post('/backups', requirePerm('ops.manage'), h((req, res) => { if (!req.user.is_platform_admin) throw forbidden(); const b = backupNow('manual'); audit(req, null, 'backup', b.file, 'create', null, b, null); res.status(201).json(b); }));

// ---- Libraries: SME tracks, complexity criteria, gates, checklists, project templates
r.get('/libraries/tracks', requirePerm('process.view'), h((req, res) => send(req, res, rows(all('SELECT * FROM sme_tracks ORDER BY min_score')))));
r.put('/libraries/tracks/:id', requirePerm('templates.manage'), h((req, res) => {
  const t = get('SELECT * FROM sme_tracks WHERE id=?', req.params.id);
  if (!t) throw notFound('Track');
  const b = req.body || {};
  if (b.minScore !== undefined && b.maxScore !== undefined && +b.minScore >= +b.maxScore) throw bad('BAD_RANGE', 'The minimum score must be below the maximum.');
  run('UPDATE sme_tracks SET gates=COALESCE(?,gates), items_per_gate=COALESCE(?,items_per_gate), duration_weeks=COALESCE(?,duration_weeks), min_score=COALESCE(?,min_score), max_score=COALESCE(?,max_score), status=COALESCE(?,status), version=version+1 WHERE id=?', b.gates ?? null, b.itemsPerGate ?? null, b.durationWeeks ?? null, b.minScore ?? null, b.maxScore ?? null, b.status || null, t.id);
  audit(req, null, 'track', t.id, 'update', row(t), b, null);
  res.json({ ok: true });
}));
r.get('/libraries/criteria', requirePerm('process.view'), h((req, res) => send(req, res, rows(all('SELECT * FROM complexity_criteria ORDER BY vertical IS NOT NULL, vertical, code')))));
r.put('/libraries/criteria', requirePerm('templates.manage'), h((req, res) => {
  const w = req.body?.weights || {};
  const base = all('SELECT * FROM complexity_criteria WHERE vertical IS NULL');
  const sum = base.reduce((a, c) => a + (w[c.code] !== undefined ? +w[c.code] : c.weight), 0);
  if (Math.round(sum) !== 100) throw bad('WEIGHTS_SUM', `Weights must sum to 100 (now ${sum}).`);
  for (const c of base) if (w[c.code] !== undefined) run('UPDATE complexity_criteria SET weight=?, version=version+1 WHERE id=?', +w[c.code], c.id);
  audit(req, null, 'criteria', 'weights', 'update', null, w, null);
  res.json({ ok: true });
}));
const LIB = { gates: 'gate_defs', checklists: 'checklist_templates', templates: 'project_templates' };
r.get('/libraries/:lib', requirePerm('process.view', 'templates.manage'), h((req, res) => {
  const t = LIB[req.params.lib]; if (!t) throw notFound('Library');
  const list = rows(all(`SELECT * FROM ${t} WHERE org_id IS NULL OR org_id=? ORDER BY code`, req.user.org_id || ''));
  if (req.params.lib === 'gates') for (const g of list) g.checklists = all('SELECT c.id, c.code, c.name, gc.mandatory FROM gate_checklists gc JOIN checklist_templates c ON c.id=gc.checklist_id WHERE gc.gate_id=?', g.id).map(row);
  send(req, res, list);
}));
r.post('/libraries/:lib', requirePerm('templates.manage'), h((req, res) => {
  const t = LIB[req.params.lib]; if (!t) throw notFound('Library');
  const b = req.body || {};
  const id = uid();
  if (b.duplicateOf) {
    const src = get(`SELECT * FROM ${t} WHERE id=?`, b.duplicateOf);
    if (!src) throw notFound('Source');
    const cols = Object.keys(src).filter(k => !['id', 'code', 'org_id', 'version', 'status', 'created_at', 'use_count'].includes(k));
    run(`INSERT INTO ${t}(id,org_id,code,version,status,created_at,${cols.join(',')}) VALUES(?,?,?,1,'Draft',?,${cols.map(() => '?').join(',')})`, id, req.user.org_id, `${src.code}-COPY-${Date.now().toString(36).slice(-4).toUpperCase()}`, now(), ...cols.map(k => src[k]));
  } else {
    if (!b.name) throw bad('NAME_REQUIRED', 'Name is required.');
    const code = b.code || `${req.params.lib.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    if (t === 'gate_defs') run('INSERT INTO gate_defs(id,org_id,code,name,purpose,entry_criteria,exit_criteria,approvers,applicability,enforce,version,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,1,1,?,?)', id, req.user.org_id, code, J({ [req.lang]: b.name }), J({ [req.lang]: b.purpose || '' }), J({ [req.lang]: b.entryCriteria || '' }), J({ [req.lang]: b.exitCriteria || '' }), J(b.approvers || ['top_management']), J(b.applicability || {}), 'Draft', now());
    if (t === 'checklist_templates') run('INSERT INTO checklist_templates(id,org_id,code,name,scope,vertical,mode,track,items,version,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,1,?,?)', id, req.user.org_id, code, J({ [req.lang]: b.name }), b.scope || 'universal', b.vertical || null, b.mode || null, b.track || null, J((b.items || []).map(x => ({ text: { [req.lang]: x.text || x }, mandatory: !!x.mandatory, evidence: !!x.evidence }))), 'Draft', now());
    if (t === 'project_templates') run('INSERT INTO project_templates(id,org_id,code,name,description,scope,vertical,mode,track,ms_type,status,version,fields,phases,roles,milestones,use_count,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,1,?,?,?,?,0,?)', id, req.user.org_id, code, J({ [req.lang]: b.name }), J({ [req.lang]: b.description || '' }), b.vertical ? 'vertical' : 'universal', b.vertical || null, b.mode || 'FULL', b.track || null, b.msType || 'QMS', 'Draft', J(b.fields || {}), J(b.phases || []), J(b.roles || []), J(b.milestones || []), now());
  }
  audit(req, req.user.org_id, req.params.lib, id, b.duplicateOf ? 'duplicate' : 'create', null, b, null);
  res.status(201).json({ id });
}));
r.put('/libraries/:lib/:id', requirePerm('templates.manage'), h((req, res) => {
  const t = LIB[req.params.lib]; if (!t) throw notFound('Library');
  const x = get(`SELECT * FROM ${t} WHERE id=?`, req.params.id);
  if (!x) throw notFound('Item');
  if (!x.org_id && !req.user.is_platform_admin) throw forbidden('PLATFORM_ITEM', 'Platform library items are edited by the platform administrator; duplicate it to customize.');
  if (x.org_id && x.org_id !== req.user.org_id && !req.user.is_platform_admin) throw notFound('Item');
  const b = req.body || {};
  const name = b.name ? J({ ...P(x.name), [req.lang]: b.name }) : x.name;
  if (b.status && !['Draft', 'Published', 'Retired'].includes(b.status)) throw bad('BAD_STATUS', 'Status must be Draft, Published or Retired.');
  run(`UPDATE ${t} SET name=?, status=COALESCE(?,status), version=version+1 WHERE id=?`, name, b.status || null, x.id);
  if (t === 'checklist_templates' && b.items) run('UPDATE checklist_templates SET items=? WHERE id=?', J(b.items), x.id);
  if (t === 'gate_defs' && Array.isArray(b.checklists)) {
    run('DELETE FROM gate_checklists WHERE gate_id=?', x.id);
    b.checklists.forEach((cid, i) => run('INSERT INTO gate_checklists(gate_id,checklist_id,seq,mandatory) VALUES(?,?,?,1)', x.id, cid, i + 1));
  }
  audit(req, x.org_id, req.params.lib, x.id, 'update', { status: x.status, version: x.version }, b, null);
  res.json({ ok: true });
}));
r.delete('/libraries/:lib/:id', requirePerm('templates.manage'), h((req, res) => {
  const t = LIB[req.params.lib]; if (!t) throw notFound('Library');
  const x = get(`SELECT * FROM ${t} WHERE id=?`, req.params.id);
  if (!x) throw notFound('Item');
  if (!x.org_id && !req.user.is_platform_admin) throw forbidden();
  if (t === 'project_templates' && get('SELECT 1 FROM projects WHERE template_id=?', x.id)) throw new HttpError(409, 'IN_USE', 'Projects use this template; retire it instead.');
  if (t === 'checklist_templates' && get('SELECT 1 FROM checklists WHERE template_id=?', x.id)) throw new HttpError(409, 'IN_USE', 'Projects use this checklist; retire it instead.');
  run(`DELETE FROM ${t} WHERE id=?`, x.id);
  audit(req, x.org_id, req.params.lib, x.id, 'delete', row(x), null, null);
  res.json({ ok: true });
}));

// ---- Verticals activation per organization (FR-DA-VCF)
r.get('/orgs/:id/verticals', requirePerm('tenancy.view'), h((req, res) => {
  requireOrg(req, req.params.id);
  send(req, res, rows(all('SELECT * FROM vertical_activations WHERE org_id=?', req.params.id)));
}));
r.post('/orgs/:id/verticals', requirePerm('process.design'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  assertFeature(req.params.id, 'verticals');
  const v = req.body?.vertical;
  if (!catalog().segById[v]) throw bad('BAD_VERTICAL', 'Unknown vertical.');
  if (get('SELECT 1 FROM vertical_activations WHERE org_id=? AND vertical=? AND status=?', req.params.id, v, 'Active')) throw new HttpError(409, 'ALREADY_ACTIVE', 'This vertical is already active.');
  const n = get('SELECT COUNT(*) n FROM vertical_activations WHERE org_id=?', req.params.id).n;
  run('INSERT INTO vertical_activations(id,org_id,vertical,version,validation,activation_order,status,activated_at) VALUES(?,?,?,1,?,?,?,?)', uid(), req.params.id, v, 'Validated', n + 1, 'Active', now());
  audit(req, req.params.id, 'vertical', v, 'activate', null, { vertical: v }, null);
  res.status(201).json({ ok: true });
}));

// ---- Data import with validation before go-live (FR-DA-ONB-02)
function parseCsv(text) {
  const out = []; let row2 = []; let cell = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true; else if (ch === ',' || ch === ';') { row2.push(cell); cell = ''; } else if (ch === '\n') { row2.push(cell); out.push(row2); row2 = []; cell = ''; } else if (ch !== '\r') cell += ch;
  }
  if (cell || row2.length) { row2.push(cell); out.push(row2); }
  return out.filter(r2 => r2.some(c2 => c2.trim()));
}
r.post('/orgs/:id/import', requirePerm('users.manage', 'records.manage'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  const kind = req.body?.kind;
  const commit = !!req.body?.commit;
  const rowsIn = parseCsv(String(req.body?.csv || '').replace(/^﻿/, ''));
  if (rowsIn.length < 2) throw bad('EMPTY_FILE', 'The file needs a header row and at least one record.');
  const head = rowsIn[0].map(x => x.trim().toLowerCase());
  const recs = rowsIn.slice(1).map(r2 => Object.fromEntries(head.map((k, i) => [k, (r2[i] || '').trim()])));
  const accepted = []; const rejected = [];
  if (kind === 'users') {
    const seen = new Set();
    recs.forEach((x, i) => {
      const errs = [];
      if (!x.name) errs.push('name missing');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x.email || '')) errs.push('invalid email');
      else if (seen.has(x.email.toLowerCase()) || get('SELECT 1 FROM users WHERE lower(email)=?', x.email.toLowerCase())) errs.push('duplicate email');
      const roles = (x.roles || '').split('|').map(s => s.trim()).filter(Boolean);
      if (!roles.length || roles.some(r3 => !ROLES.find(y => y.code === r3) || r3 === 'platform_admin')) errs.push('unknown role');
      if (errs.length) rejected.push({ line: i + 2, errors: errs, record: x }); else { seen.add(x.email.toLowerCase()); accepted.push({ ...x, roles }); }
    });
    if (commit && !rejected.length) tx(() => { for (const x of accepted) run('INSERT INTO users(id,org_id,email,name,password_hash,roles,lang,is_platform_admin,status,created_at) VALUES(?,?,?,?,?,?,?,0,?,?)', uid(), req.params.id, x.email.toLowerCase(), x.name, bcrypt.hashSync(config.demoPassword, 10), J(x.roles), ['en', 'fr', 'ar'].includes(x.lang) ? x.lang : 'en', 'Active', now()); });
  } else if (kind === 'suppliers' || kind === 'risks') {
    const p = get('SELECT * FROM projects WHERE id=? AND org_id=?', req.body?.projectId, req.params.id);
    if (!p) throw bad('PROJECT_REQUIRED', 'Choose a project of this organization.');
    recs.forEach((x, i) => {
      const errs = [];
      if (!x.title) errs.push('title missing');
      if (kind === 'suppliers' && x.score && !(+x.score >= 0 && +x.score <= 100)) errs.push('score must be 0–100');
      if (kind === 'risks' && !(+x.likelihood >= 1 && +x.likelihood <= 5 && +x.impact >= 1 && +x.impact <= 5)) errs.push('likelihood and impact must be 1–5');
      if (errs.length) rejected.push({ line: i + 2, errors: errs, record: x }); else accepted.push(x);
    });
    if (commit && !rejected.length) tx(() => {
      accepted.forEach((x, i) => {
        if (kind === 'suppliers') run('INSERT INTO registers(id,org_id,project_id,register,code,title,data,status,mp_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)', uid(), p.org_id, p.id, 'suppliers', `SUP-I${i + 1}`, J({ [req.lang]: x.title }), J({ score: +x.score || null }), x.status || 'Under review', 'MP-024', now());
        else run('INSERT INTO risks(id,org_id,project_id,code,kind,title,category,likelihood,impact,score,owner_role,status,controls,mp_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', uid(), p.org_id, p.id, `R-I${i + 1}`, x.kind || 'Risk', J({ [req.lang]: x.title }), x.category || 'Imported', +x.likelihood, +x.impact, +x.likelihood * +x.impact, 'risk_manager', 'Open', J([]), 'MP-012', now());
      });
    });
  } else throw bad('BAD_KIND', 'Kind must be users, suppliers or risks.');
  audit(req, req.params.id, 'import', kind, commit ? 'import' : 'validate', null, { accepted: accepted.length, rejected: rejected.length }, null);
  res.json({ kind, total: recs.length, accepted: accepted.length, rejected, committed: commit && !rejected.length });
}));

// ---- Requirement traceability
r.get('/traceability', requirePerm('process.view'), h((req, res) => {
  const c = catalog();
  send(req, res, { families: TRACE, items: c.requirements.map(x => ({ ...x, trace: traceOf(x.id) })) });
}));

export default r;
