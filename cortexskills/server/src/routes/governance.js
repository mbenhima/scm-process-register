import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { ah, projectOf } from '../lib/http.js';
import { all, one, run } from '../db.js';
import { J, S, HttpError, now, uuid, pick } from '../lib/util.js';
import { requirePerm, userPermissions, has } from '../rbac.js';
import { audit, versions, compare, versionData } from '../audit.js';
import { entityRegistry, entityDef, permFor, listRecords, getRecord, createRecord, updateRecord, deleteRecord, revertRecord } from '../entities.js';
import { entitledModules, checkQuota } from '../entitlements.js';
import { invalidateTenant } from '../services/retrieval.js';
import { config } from '../config.js';
import * as cat from '../catalog.js';

const r = Router();

/** Entity schemas for the generic screens (derived from D09/D10 and the platform entities). */
r.get('/meta/entities', ah(req => {
  const perms = userPermissions(req.user.id); const mods = entitledModules(req.orgId);
  return Object.values(entityRegistry()).map(d => ({ name: d.name, classId: d.classId, description: d.description, module: d.module, versioned: d.versioned, global: !!d.global, fields: d.fields,
    canRead: perms.has(permFor(d, false)), canWrite: perms.has(permFor(d, true)), entitled: d.perm !== 'module' || mods.has(d.module),
    count: one(`SELECT COUNT(*) n FROM records WHERE entity=? AND (org_id=? OR (org_id IS NULL AND ?=1))`, d.name, req.orgId, d.global ? 1 : 0).n }));
}));

function guard(req, entity, write) {
  const def = entityDef(entity);
  if (!has(req, permFor(def, write))) throw new HttpError(403, 'err.forbidden', { permission: permFor(def, write) });
  if (def.perm === 'module' && !entitledModules(req.orgId).has(def.module)) throw new HttpError(403, 'err.notEntitled', { feature: def.module });
  return def;
}
r.get('/records/:entity', ah(req => {
  guard(req, req.params.entity, false);
  const { project, limit, offset, q, ...filter } = req.query;
  return listRecords(req, req.params.entity, { projectId: project || null, filter, limit: Math.min(Number(limit || 500), 2000), offset: Number(offset || 0), q });
}));
r.get('/records/:entity/:id', ah(req => { guard(req, req.params.entity, false); return getRecord(req, req.params.entity, req.params.id); }));
r.post('/records/:entity', ah(req => {
  const def = guard(req, req.params.entity, true);
  if (req.params.entity === 'AIUseCase') { checkQuota(req.orgId, 'aiCustom'); req.body.isCustom = true; req.body.code ||= 'AIUC-C' + Date.now().toString().slice(-4); }
  if (req.params.entity === 'Questionnaire') checkQuota(req.orgId, 'questionnaires');
  const pid = req.body?._project || req.query.project || null; if (pid) projectOf(req, pid);
  const rec = createRecord(req, def.name, req.body, { projectId: pid });
  invalidateTenant(req.orgId); return rec;
}));
r.put('/records/:entity/:id', ah(req => {
  guard(req, req.params.entity, true);
  // A Scope of Work edited after approval returns to Pending Re-validation (RULE-085).
  if (req.params.entity === 'ScopeOfWork') { const cur = getRecord(req, 'ScopeOfWork', req.params.id); if (cur.approval_status === 'Approved' && !req.body.approval_status) req.body.approval_status = 'Pending Re-validation'; if (!req.body._justification && req.body.approval_status === 'Pending Re-validation') req.body._justification = 'RULE-085'; }
  const rec = updateRecord(req, req.params.entity, req.params.id, req.body); invalidateTenant(req.orgId); return rec;
}));
r.delete('/records/:entity/:id', ah(req => {
  guard(req, req.params.entity, true);
  // Seeded AI Use Cases are deactivated, never deleted (FR-DA-AI-14); published gate checklists are retired (CHK-07).
  if (req.params.entity === 'AIUseCase' && !getRecord(req, 'AIUseCase', req.params.id).isCustom) throw new HttpError(409, 'err.seededUseCase');
  if (req.params.entity === 'ChecklistTemplate') {
    const used = all(`SELECT id FROM records WHERE entity='GateDefinition' AND data LIKE ?`, '%' + req.params.id + '%');
    if (used.length) throw new HttpError(409, 'err.checklistInUse', { n: used.length });
  }
  return deleteRecord(req, req.params.entity, req.params.id);
}));
r.post('/records/:entity/:id/duplicate', ah(req => {
  const def = guard(req, req.params.entity, true);
  const { id, entity, org_id, project_id, ref, version, created_at, updated_at, created_by, updated_by, ...data } = getRecord(req, req.params.entity, req.params.id);
  if (data.name && typeof data.name === 'object') data.name = Object.fromEntries(Object.entries(data.name).map(([k, v]) => [k, v + ' (2)']));
  if ('status' in data) data.status = 'Draft'; if ('use_count' in data) data.use_count = 0;
  return createRecord(req, def.name, data, { projectId: project_id });
}));
/** Impact before change or deletion: gates, templates and open phases using a checklist (FR-DA-CHK-07). */
r.get('/records/ChecklistTemplate/:id/usage', requirePerm('catalog.view'), ah(req => ({
  gates: all(`SELECT id, data FROM records WHERE entity='GateDefinition' AND data LIKE ?`, '%' + req.params.id + '%').map(x => ({ id: x.id, name: J(x.data).name })),
  phases: one(`SELECT COUNT(*) n FROM records WHERE entity='PhaseChecklist' AND org_id=? AND json_extract(data,'$.checklist_id')=?`, req.orgId, req.params.id).n,
})));
r.get('/records/:entity/:id/versions', ah(req => { guard(req, req.params.entity, false); getRecord(req, req.params.entity, req.params.id); return versions(req.params.entity, req.params.id); }));
r.get('/records/:entity/:id/compare', ah(req => {
  guard(req, req.params.entity, false); getRecord(req, req.params.entity, req.params.id);
  return compare(versionData(req.params.entity, req.params.id, Number(req.query.a)), versionData(req.params.entity, req.params.id, Number(req.query.b)));
}));
r.post('/records/:entity/:id/revert', ah(req => { guard(req, req.params.entity, true); return revertRecord(req, req.params.entity, req.params.id, req.body?.version); }));

// ------------------------------------------------------------------ RACSI (FR-DA-GOV-06/07, NFR-DA-SEC-06)
r.get('/racsi', requirePerm('governance.view'), ah(req => {
  const acts = all(`SELECT * FROM racsi_activities WHERE org_id=? ${req.query.project ? 'AND project_id=?' : 'AND project_id IS NULL'} ORDER BY ref_id LIMIT 1000`, req.orgId, ...(req.query.project ? [req.query.project] : []));
  const asg = acts.length ? all(`SELECT * FROM racsi_assignments WHERE activity_id IN (${acts.map(() => '?').join(',')})`, ...acts.map(a => a.id)) : [];
  return acts.map(a => ({ ...a, name: J(a.name) || a.name, assignments: asg.filter(x => x.activity_id === a.id) }));
}));
r.post('/racsi', requirePerm('governance.manage'), ah(req => {
  const b = req.body || {}; const id = uuid();
  run(`INSERT INTO racsi_activities(id,org_id,project_id,ref_type,ref_id,name,process_tag,obs_node_id,created_at) VALUES(?,?,?,?,?,?,?,?,?)`, id, req.orgId, b.project_id || null, b.ref_type || 'custom', b.ref_id || null, S(typeof b.name === 'object' ? b.name : { en: b.name, fr: b.name, ar: b.name }), b.process_tag || null, b.obs_node_id || null, now());
  audit(req, 'RacsiActivity', id, 'create', null, b); return { id };
}));
r.delete('/racsi/:id', requirePerm('governance.manage'), ah(req => { run(`DELETE FROM racsi_activities WHERE id=? AND org_id=?`, req.params.id, req.orgId); audit(req, 'RacsiActivity', req.params.id, 'delete'); return { ok: true }; }));
r.post('/racsi/:id/assignments', requirePerm('governance.manage'), ah(req => {
  const a = one(`SELECT id FROM racsi_activities WHERE id=? AND org_id=?`, req.params.id, req.orgId); if (!a) throw new HttpError(404, 'err.notFound');
  const { letter, assignee, user_id } = req.body || {};
  if (!['R', 'A', 'C', 'S', 'I'].includes(letter)) throw new HttpError(422, 'err.invalidOption', { field: 'letter', value: letter });
  const id = uuid(); run(`INSERT INTO racsi_assignments(id,activity_id,letter,assignee,user_id) VALUES(?,?,?,?,?)`, id, a.id, letter, assignee || '', user_id || null); // unique index rejects a second A
  audit(req, 'RacsiAssignment', id, 'create', null, req.body); return { id };
}));
r.delete('/racsi/:id/assignments/:aid', requirePerm('governance.manage'), ah(req => { run(`DELETE FROM racsi_assignments WHERE id=? AND activity_id IN (SELECT id FROM racsi_activities WHERE org_id=?)`, req.params.aid, req.orgId); return { ok: true }; }));

// ------------------------------------------------------------------ Risk heat-map (FR-DA-GOV-04), REX register (FR-DA-REX-05)
r.get('/governance/heatmap', requirePerm('governance.view'), ah(req => {
  const risks = all(`SELECT id, data FROM records WHERE entity='RiskOpportunity' AND org_id=?`, req.orgId).map(x => ({ id: x.id, ...J(x.data) }));
  const grid = Array.from({ length: 5 }, (_, i) => Array.from({ length: 5 }, (_, j) => risks.filter(r => r.likelihood === 5 - i && r.impact === j + 1).map(r => ({ id: r.id, code: r.code, title: r.title, kind: r.kind }))));
  return { grid, risks };
}));
r.get('/governance/rex-register', requirePerm('governance.view'), ah(req => {
  const rex = all(`SELECT id, project_id, created_at, data FROM records WHERE entity='RexEntry' AND org_id=? ORDER BY created_at`, req.orgId).map(x => ({ id: x.id, project_id: x.project_id, created_at: x.created_at, ...J(x.data) }));
  const byCat = {}; for (const x of rex) { const k = pick(x.category, 'en') || '—'; (byCat[k] ||= { category: x.category, n: 0, sum: 0 }); byCat[k].n++; byCat[k].sum += Number(x.rating || 0); }
  const byMonth = {}; for (const x of rex) { const k = x.created_at.slice(0, 7); (byMonth[k] ||= { n: 0, sum: 0 }); byMonth[k].n++; byMonth[k].sum += Number(x.rating || 0); }
  return { entries: rex, byCategory: Object.values(byCat).map(c => ({ ...c, avg: Math.round((c.sum / c.n) * 10) / 10 })), trend: Object.entries(byMonth).sort().map(([m, v]) => ({ month: m, avg: Math.round((v.sum / v.n) * 10) / 10, n: v.n })) };
}));
r.get('/governance/alert-settings', requirePerm('governance.view'), ah(req => all(`SELECT type, enabled FROM alert_settings WHERE org_id=?`, req.orgId)));
r.put('/governance/alert-settings', requirePerm('governance.manage'), ah(req => {
  run(`INSERT INTO alert_settings(org_id,type,enabled) VALUES(?,?,?) ON CONFLICT(org_id,type) DO UPDATE SET enabled=excluded.enabled`, req.orgId, req.body.type, req.body.enabled ? 1 : 0);
  audit(req, 'AlertSetting', req.body.type, 'update', null, { enabled: !!req.body.enabled }); return { ok: true };
}));
r.put('/governance/justification', requirePerm('hierarchy.manage'), ah(req => {
  run(`UPDATE org_config SET justification_required=? WHERE org_id=?`, req.body.required ? 1 : 0, req.orgId);
  audit(req, 'Configuration', req.orgId, 'justificationToggle', null, { required: !!req.body.required }); return { ok: true };
}));

// ------------------------------------------------------------------ Attachments (Section 4.24)
export const ACCEPTED = { documents: ['pdf', 'doc', 'docx', 'odt', 'rtf', 'txt', 'md'], spreadsheets: ['xls', 'xlsx', 'ods', 'csv'], presentations: ['ppt', 'pptx', 'odp'],
  images: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'], drawings: ['dwg', 'dxf', 'vsdx', 'bpmn'], cad: ['step', 'stp', 'iges', 'igs', 'jt', 'stl'], data: ['json', 'xml', 'yaml', 'yml', 'sql'],
  archives: ['zip', '7z'], media: ['mp3', 'wav', 'mp4', 'mov', 'webm'], email: ['eml', 'msg'] };
const EXT = new Set(Object.values(ACCEPTED).flat()); const LIMITS = { size: 25 * 1024 * 1024, count: 10 };
const upload = multer({ storage: multer.diskStorage({ destination: (req, f, cb) => { const d = path.join(config.attachmentDir, req.orgId); fs.mkdirSync(d, { recursive: true }); cb(null, d); }, filename: (req, f, cb) => cb(null, uuid()) }),
  limits: { fileSize: LIMITS.size, files: LIMITS.count },
  fileFilter: (req, f, cb) => { const ext = f.originalname.split('.').pop().toLowerCase(); if (EXT.has(ext)) cb(null, true); else cb(new HttpError(415, 'err.fileType', { file: f.originalname })); } });
r.get('/attachments/accepted', ah(() => ({ formats: ACCEPTED, limits: LIMITS })));
r.post('/attachments/:ownerType/:ownerId', requirePerm('attachments.manage'), upload.array('files', LIMITS.count), ah(req => {
  const { ownerType, ownerId } = req.params;
  if (!OWNER_TYPES.has(ownerType)) throw new HttpError(422, 'err.invalidFields', { fields: 'ownerType' });
  if (ownerType === 'document' && !one(`SELECT id FROM documents WHERE id=? AND org_id=?`, ownerId, req.orgId)) throw new HttpError(404, 'err.notFound');
  if (ownerType === 'task') {
    const t = one(`SELECT project_id, e2e_instance_id FROM task_instances WHERE id=? AND org_id=?`, ownerId, req.orgId); if (!t) throw new HttpError(404, 'err.notFound');
  }
  const out = [];
  for (const f of req.files || []) {
    const id = uuid(); const name = Buffer.from(f.originalname, 'latin1').toString('utf8');
    run(`INSERT INTO attachments(id,org_id,owner_type,owner_id,filename,mime,size,path,author_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`, id, req.orgId, ownerType, ownerId, name, f.mimetype, f.size, f.filename, req.user.id, now());
    audit(req, 'Attachment', id, 'create', null, { filename: name, owner: ownerId }); out.push({ id, filename: name, size: f.size });
  }
  return out;
}));
// Attachments may belong to tasks, steps, documents, registers, actions, checklist items and records (FR-DA-ATT-06).
const OWNER_TYPES = new Set(['task', 'step', 'document', 'register', 'action', 'checklist', 'checklistItem', 'record', 'project', 'e2e']);
r.get('/attachments-of/:ownerType/:ownerId', ah(req => all(`SELECT a.id, a.filename, a.mime, a.size, a.created_at, a.note, coalesce(a.version,1) version, coalesce(a.chain_id,a.id) chain_id, u.name author,
  (SELECT COUNT(*) FROM attachments b WHERE coalesce(b.chain_id,b.id)=coalesce(a.chain_id,a.id)) versions
  FROM attachments a LEFT JOIN users u ON u.id=a.author_id WHERE a.org_id=? AND a.owner_type=? AND a.owner_id=? AND coalesce(a.is_latest,1)=1 ORDER BY a.created_at DESC`, req.orgId, req.params.ownerType, req.params.ownerId)));
/** New version of an attachment with a note; earlier versions stay downloadable (FR-DA-ATT-05). */
r.post('/attachments/:id/versions', requirePerm('attachments.manage'), upload.single('file'), ah(req => {
  const a = one(`SELECT * FROM attachments WHERE id=? AND org_id=?`, req.params.id, req.orgId); if (!a || !req.file) throw new HttpError(404, 'err.notFound');
  const chain = a.chain_id || a.id; const v = (one(`SELECT MAX(coalesce(version,1)) v FROM attachments WHERE coalesce(chain_id,id)=?`, chain).v || 1) + 1;
  const id = uuid(); const name = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  run(`UPDATE attachments SET is_latest=0, chain_id=? WHERE coalesce(chain_id,id)=?`, chain, chain);
  run(`INSERT INTO attachments(id,org_id,owner_type,owner_id,filename,mime,size,path,author_id,created_at,chain_id,version,note,is_latest) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,1)`, id, req.orgId, a.owner_type, a.owner_id, name, req.file.mimetype, req.file.size, req.file.filename, req.user.id, now(), chain, v, String(req.body?.note || '').slice(0, 500) || null);
  audit(req, 'Attachment', id, 'version', null, { chain, version: v, note: req.body?.note || null }); return { id, version: v, filename: name };
}));
r.get('/attachments/:id/versions', ah(req => {
  const a = one(`SELECT * FROM attachments WHERE id=? AND org_id=?`, req.params.id, req.orgId); if (!a) throw new HttpError(404, 'err.notFound');
  return all(`SELECT a.id, a.filename, a.size, coalesce(a.version,1) version, a.note, a.created_at, coalesce(a.is_latest,1) latest, u.name author FROM attachments a LEFT JOIN users u ON u.id=a.author_id WHERE coalesce(a.chain_id,a.id)=? AND a.org_id=? ORDER BY version DESC`, a.chain_id || a.id, req.orgId);
}));
r.get('/attachments/:id/download', ah((req, res) => {
  const a = one(`SELECT * FROM attachments WHERE id=? AND org_id=?`, req.params.id, req.orgId); if (!a) throw new HttpError(404, 'err.notFound');
  const p = path.join(config.attachmentDir, a.org_id, a.path);
  if (!fs.existsSync(p)) { res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(a.filename)}"`).type('text/plain').send(`${a.filename} (demonstration attachment: ${a.size} bytes)`); return; }
  res.download(p, a.filename);
}));
r.delete('/attachments/:id', ah(req => {
  const a = one(`SELECT * FROM attachments WHERE id=? AND org_id=?`, req.params.id, req.orgId); if (!a) throw new HttpError(404, 'err.notFound');
  if (a.author_id !== req.user.id && !has(req, 'projects.manage')) throw new HttpError(403, 'err.forbidden', { permission: 'projects.manage' });
  if (a.owner_type === 'task') { const t = one(`SELECT status FROM task_instances WHERE id=?`, a.owner_id); if (t?.status === 'Completed') throw new HttpError(409, 'err.attachmentLocked'); }
  run(`DELETE FROM attachments WHERE id=?`, a.id); try { fs.unlinkSync(path.join(config.attachmentDir, a.org_id, a.path)); } catch { /* demo file */ }
  audit(req, 'Attachment', a.id, 'delete', { filename: a.filename }); return { ok: true };
}));
export default r;
