// Documented information: template library, Organization layout, pictures, documents and their versions, sections,
// overrides, edit-through, consistency, staleness, master list (FR-DA-DOC, -DGC, -DCR, -DFP; NFR-DA-SEC-19, -20).
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { ah, projectOf } from '../lib/http.js';
import { all, one, run, tx } from '../db.js';
import { uuid, now, J, S, HttpError, pick } from '../lib/util.js';
import { requirePerm, has } from '../rbac.js';
import { audit } from '../audit.js';
import { t } from '../i18n.js';
import { config } from '../config.js';
import * as E from '../services/docengine.js';
import { exportDocument, MIME, assetBuffer, imageSize } from '../services/docexport.js';
import { STANDARD_REQUIREMENTS } from '../services/doctemplates.js';
import * as D from '../services/design.js';
import { updateRecord, entityRegistry, permFor } from '../entities.js';

const r = Router();
const userName = id => one(`SELECT name FROM users WHERE id=?`, id)?.name || null;
const ALIAS = { TER: 'DT-TER' };
const codeOf = c => ALIAS[c] || c;
function getDoc(req, id) { const d = one(`SELECT * FROM documents WHERE id=? AND org_id=?`, id, req.orgId); if (!d) throw new HttpError(404, 'err.notFound'); return d; }
const ctxOf = (req, projectId, lang) => ({ req, orgId: req.orgId, projectId, lang: lang || req.lang, rel: one(`SELECT design_release_id r FROM projects WHERE id=?`, projectId)?.r || null });
const verLabel = d => `${d.version}${d.minor ? '.' + d.minor : ''}`;
const docOut = (d, withModel = false) => d && ({ id: d.id, project_id: d.project_id, doc_type: codeOf(d.doc_type), template_id: d.template_id, template_version: d.template_version, version: d.version, minor: d.minor || 0, versionLabel: verLabel(d), status: d.status, lang: d.lang, title: d.title, data_as_of: d.data_as_of,
  author: userName(d.author_id), author_id: d.author_id, approver: userName(d.approver_id), owner: userName(d.owner_id || d.author_id), owner_id: d.owner_id, change_note: d.change_note, created_at: d.created_at, published_at: d.published_at,
  review_frequency: d.review_frequency, next_review: d.next_review, retention: d.retention, classification: d.classification, e2e_id: d.e2e_id, step_id: d.step_id,
  findings: J(d.findings, []), sources: J(d.sources, []), overrides: J(d.overrides, {}), formatting: J(d.formatting, {}), ...(withModel ? { model: J(d.model, null) } : {}) });

/* ------------------------------------------------------------------------------------------ templates */
r.get('/document-templates', requirePerm('reports.view'), ah(req => E.templates(req.orgId).map(x => ({ ...x, sectionsCount: x.sections?.length || 0, categoryLabel: E.CATEGORIES[x.category] }))));
r.get('/document-templates/:id', requirePerm('reports.view'), ah(req => { const x = E.template(req.orgId, req.params.id); if (!x) throw new HttpError(404, 'err.notFound');
  return { ...x, versions: all(`SELECT version, created_at, justification, (SELECT name FROM users WHERE id=user_id) author FROM entity_versions WHERE entity='DocumentTemplate' AND record_id=? ORDER BY version DESC`, x.id), drafts: all(`SELECT id, title, version, template_version FROM documents WHERE org_id=? AND template_id=? AND status='Draft' AND coalesce(template_version,0) < ?`, req.orgId, x.id, x.version) }; }));
const tplVersion = (req, id, data, note) => { const v = (one(`SELECT MAX(version) v FROM entity_versions WHERE entity='DocumentTemplate' AND record_id=?`, id)?.v || 0) + 1; run(`UPDATE entity_versions SET is_current=0 WHERE entity='DocumentTemplate' AND record_id=?`, id);
  run(`INSERT INTO entity_versions(id,entity,record_id,org_id,version,data,user_id,justification,is_current,created_at) VALUES(?,?,?,?,?,?,?,?,1,?)`, uuid(), 'DocumentTemplate', id, req.orgId, v, S(data), req.user.id, note || null, now()); return v; };
function validateTemplate(b) {
  if (!b.code || !/^[\w.-]{2,40}$/.test(b.code)) throw new HttpError(422, 'err.required', { field: 'code' });
  if (!b.name || !Object.values(b.name).some(Boolean)) throw new HttpError(422, 'err.required', { field: 'name' });
  const types = ['text', 'table', 'diagram', 'kv', 'approval', 'picture', 'steps', 'builtin'];
  for (const s of b.sections || []) if (!types.includes(s.type)) throw new HttpError(422, 'err.invalidOption', { field: 'section.type', value: s.type });
  return { ...b, formatting: E.sanitizeFormatting({ ...E.DEFAULT_FORMATTING, ...(b.formatting || {}) }), formats: (b.formats || ['docx', 'pdf', 'xlsx']).filter(f => ['docx', 'pdf', 'xlsx'].includes(f)) };
}
r.post('/document-templates', requirePerm('templates.manage'), ah(req => {
  const b = validateTemplate({ status: 'Draft', profile: { identification: true, revisions: true, sources: true, approval: true }, sections: [], ...(req.body || {}) });
  if (E.templates(req.orgId).some(x => x.code === b.code && x.org)) throw new HttpError(409, 'err.duplicate');
  const id = uuid(); run(`INSERT INTO records(id,entity,org_id,project_id,ref,data,version,created_by,created_at,updated_by,updated_at) VALUES(?,?,?,?,?,?,1,?,?,?,?)`, id, 'DocumentTemplate', req.orgId, null, b.code, S(b), req.user.id, now(), req.user.id, now());
  tplVersion(req, id, b, 'create'); audit(req, 'DocumentTemplate', id, 'create', null, { code: b.code }); return E.template(req.orgId, id);
}));
/** Copy of a library template that replaces it within the tenant and keeps the version it came from (FR-DA-DOC-08). */
r.post('/document-templates/:id/copy', requirePerm('templates.manage'), ah(req => {
  const src = E.template(req.orgId, req.params.id); if (!src) throw new HttpError(404, 'err.notFound'); if (src.org) throw new HttpError(409, 'err.alreadyCopied');
  const { id: _i, org: _o, version: _v, updated_at: _u, ...data } = src; const b = { ...data, copied_from: { code: src.code, version: src.version, id: src.id }, status: 'Draft' };
  const id = uuid(); run(`INSERT INTO records(id,entity,org_id,project_id,ref,data,version,created_by,created_at,updated_by,updated_at) VALUES(?,?,?,?,?,?,1,?,?,?,?)`, id, 'DocumentTemplate', req.orgId, null, b.code, S(b), req.user.id, now(), req.user.id, now());
  tplVersion(req, id, b, `Copy of ${src.code} v${src.version}`); audit(req, 'DocumentTemplate', id, 'copy', null, { from: src.code }); return E.template(req.orgId, id);
}));
r.post('/document-templates/:id/duplicate', requirePerm('templates.manage'), ah(req => {
  const src = E.template(req.orgId, req.params.id); if (!src) throw new HttpError(404, 'err.notFound'); const { id: _i, org: _o, version: _v, updated_at: _u, ...data } = src;
  let code = src.code + '-COPY'; let n = 2; while (E.templates(req.orgId).some(x => x.code === code)) code = `${src.code}-COPY${n++}`;
  const b = { ...data, code, status: 'Draft', name: Object.fromEntries(Object.entries(src.name || {}).map(([l, v]) => [l, `${v} (${l === 'fr' ? 'copie' : l === 'ar' ? 'نسخة' : 'copy'})`])) };
  const id = uuid(); run(`INSERT INTO records(id,entity,org_id,project_id,ref,data,version,created_by,created_at,updated_by,updated_at) VALUES(?,?,?,?,?,?,1,?,?,?,?)`, id, 'DocumentTemplate', req.orgId, null, code, S(b), req.user.id, now(), req.user.id, now());
  tplVersion(req, id, b, 'duplicate'); return E.template(req.orgId, id);
}));
r.put('/document-templates/:id', requirePerm('templates.manage'), ah(req => {
  const rec = one(`SELECT * FROM records WHERE id=? AND entity='DocumentTemplate'`, req.params.id); if (!rec) throw new HttpError(404, 'err.notFound');
  if (!rec.org_id && !req.user.is_platform) throw new HttpError(409, 'err.copyFirst'); if (rec.org_id && rec.org_id !== req.orgId) throw new HttpError(404, 'err.notFound');
  const cur = J(rec.data, {}); const b = validateTemplate({ ...cur, ...(req.body || {}), code: cur.code });
  run(`UPDATE records SET data=?, version=version+1, updated_by=?, updated_at=? WHERE id=?`, S(b), req.user.id, now(), rec.id); tplVersion(req, rec.id, b, req.body?._justification || req.body?.note);
  audit(req, 'DocumentTemplate', rec.id, 'update', null, { sections: b.sections?.length }, req.body?._justification); return E.template(req.orgId, rec.id);
}));
r.delete('/document-templates/:id', requirePerm('templates.manage'), ah(req => {
  const rec = one(`SELECT * FROM records WHERE id=? AND entity='DocumentTemplate' AND org_id=?`, req.params.id, req.orgId); if (!rec) throw new HttpError(404, 'err.notFound');
  const used = one(`SELECT COUNT(*) n FROM documents WHERE template_id=?`, rec.id).n; if (used) { const d = J(rec.data, {}); d.status = 'Retired'; run(`UPDATE records SET data=? WHERE id=?`, S(d), rec.id); audit(req, 'DocumentTemplate', rec.id, 'retire'); return { retired: true }; }
  run(`DELETE FROM records WHERE id=?`, rec.id); audit(req, 'DocumentTemplate', rec.id, 'delete'); return { ok: true };
}));
r.get('/document-templates/:id/versions/:v', requirePerm('reports.view'), ah(req => { const x = E.template(req.orgId, req.params.id); const v = one(`SELECT data FROM entity_versions WHERE entity='DocumentTemplate' AND record_id=? AND version=?`, x?.id, Number(req.params.v)); if (!v) throw new HttpError(404, 'err.notFound'); return J(v.data, {}); }));
r.post('/document-templates/:id/restore', requirePerm('templates.manage'), ah(req => {
  const x = E.template(req.orgId, req.params.id); const v = one(`SELECT data FROM entity_versions WHERE entity='DocumentTemplate' AND record_id=? AND version=?`, x?.id, Number(req.body?.version)); if (!v || !x.org) throw new HttpError(404, 'err.notFound');
  const b = J(v.data, {}); run(`UPDATE records SET data=?, version=version+1, updated_by=?, updated_at=? WHERE id=?`, S(b), req.user.id, now(), x.id); tplVersion(req, x.id, b, `Restore of v${req.body.version}`); return E.template(req.orgId, x.id);
}));

/* ------------------------------------------------------------------------------------- layout, pictures */
r.get('/document-layout', requirePerm('reports.view'), ah(req => { const rec = one(`SELECT id, data, version, updated_at FROM records WHERE entity='DocumentLayout' AND org_id=? ORDER BY updated_at DESC LIMIT 1`, req.orgId);
  return { id: rec?.id || null, version: rec?.version || 0, ...J(rec?.data, {}), effective: E.effectiveFormatting(req.orgId, null), allowed: E.ALLOWED, versions: rec ? all(`SELECT version, created_at, (SELECT name FROM users WHERE id=user_id) author FROM entity_versions WHERE entity='DocumentLayout' AND record_id=? ORDER BY version DESC`, rec.id) : [] }; }));
r.put('/document-layout', requirePerm('layout.manage'), ah(req => {
  const b = req.body || {}; const data = { ...E.sanitizeFormatting({ ...E.DEFAULT_FORMATTING, ...b }), logoAsset: b.logoAsset || null, header: String(b.header || '').slice(0, 200), footer: String(b.footer || '').slice(0, 200),
    variants: Object.fromEntries(Object.entries(b.variants || {}).filter(([k]) => k in E.CATEGORIES).map(([k, v]) => [k, E.sanitizeFormatting({ ...E.DEFAULT_FORMATTING, ...v })])) };
  let rec = one(`SELECT id FROM records WHERE entity='DocumentLayout' AND org_id=?`, req.orgId); const tm = now();
  if (rec) run(`UPDATE records SET data=?, version=version+1, updated_by=?, updated_at=? WHERE id=?`, S(data), req.user.id, tm, rec.id);
  else { rec = { id: uuid() }; run(`INSERT INTO records(id,entity,org_id,data,version,created_by,created_at,updated_by,updated_at) VALUES(?,?,?,?,1,?,?,?,?)`, rec.id, 'DocumentLayout', req.orgId, S(data), req.user.id, tm, req.user.id, tm); }
  const v = (one(`SELECT MAX(version) v FROM entity_versions WHERE entity='DocumentLayout' AND record_id=?`, rec.id)?.v || 0) + 1;
  run(`INSERT INTO entity_versions(id,entity,record_id,org_id,version,data,user_id,is_current,created_at) VALUES(?,?,?,?,?,?,?,1,?)`, uuid(), 'DocumentLayout', rec.id, req.orgId, v, S(data), req.user.id, tm);
  audit(req, 'DocumentLayout', rec.id, 'update', null, { version: v }); return { id: rec.id, version: v, ...data };
}));
// Picture uploads: PNG and JPEG only, at most 5 MB, stored under generated per-tenant names on validated paths (NFR-DA-SEC-20).
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
r.post('/document-assets', requirePerm('documents.manage'), upload.single('file'), ah(req => {
  const f = req.file; if (!f) throw new HttpError(422, 'err.required', { field: 'file' });
  const sz = imageSize(f.buffer); if (!sz || !['png', 'jpg'].includes(sz.type)) throw new HttpError(422, 'err.imageType');
  const id = uuid().replace(/-/g, ''); const dir = path.join(config.dataDir, 'assets', String(req.orgId).replace(/[^\w-]/g, ''));
  if (!path.resolve(dir).startsWith(path.resolve(config.dataDir, 'assets'))) throw new HttpError(422, 'err.invalidPath');
  fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, `${id}.${sz.type}`), f.buffer);
  run(`INSERT INTO attachments(id,org_id,owner_type,owner_id,filename,mime,size,path,author_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`, id, req.orgId, 'docasset', req.body?.owner || null, String(f.originalname).slice(0, 120), sz.type === 'png' ? 'image/png' : 'image/jpeg', f.size, `assets/${id}.${sz.type}`, req.user.id, now());
  return { id, width: sz.w, height: sz.h, type: sz.type };
}));
r.get('/document-assets/:id', requirePerm('reports.view'), ah((req, res) => { const b = assetBuffer(req.orgId, req.params.id); if (!b) throw new HttpError(404, 'err.notFound'); res.set('Content-Type', imageSize(b)?.type === 'jpg' ? 'image/jpeg' : 'image/png').set('Cache-Control', 'private, max-age=3600').send(b); }));

/* ------------------------------------------------------------------------------------------- documents */
r.get('/projects/:id/documents', requirePerm('reports.view'), ah(req => {
  const p = projectOf(req, req.params.id);
  return all(`SELECT * FROM documents WHERE project_id=? AND org_id=? ORDER BY doc_type, version DESC, minor DESC`, p.id, req.orgId).map(d => docOut(d)).map(d => ({ ...d, stale: d.status === 'Published' ? null : undefined }));
}));
/** Documents of a step or process, shown on that step (FR-DA-DOC-10). */
r.get('/projects/:id/documents/by-process/:e2e', requirePerm('reports.view'), ah(req => {
  const p = projectOf(req, req.params.id); const codes = E.templates(req.orgId).filter(x => (x.e2e || []).includes(req.params.e2e)).map(x => x.code);
  return all(`SELECT * FROM documents WHERE project_id=? AND org_id=? AND (e2e_id=? OR doc_type IN (${codes.map(() => '?').join(',') || "''"})) ORDER BY version DESC`, p.id, req.orgId, req.params.e2e, ...codes).map(d => docOut(d));
}));
const identification = (d, model, lang, org, project) => [[t('ter.reference', lang), `${codeOf(d.doc_type)}-${String(d.id).slice(0, 4).toUpperCase()}`], [t('ter.docTitle', lang), model.title], [t('ter.version', lang), verLabel(d)], [t('ter.status', lang), t('status.' + d.status, lang)],
  [t('ter.author', lang), userName(d.author_id) || '—'], [t('ter.approver', lang), userName(d.approver_id) || '—'], [t('ter.dataAsOf', lang), new Date(d.data_as_of || now()).toLocaleString(lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-MA' : 'en-GB')],
  [t('ter.classification', lang), d.classification || t('ter.confidential', lang)], [t('ter.project', lang), project], ...lifecycle(d, lang)];
const LC = { owner: { en: 'Owner', fr: 'Propriétaire', ar: 'المالك' }, created: { en: 'Created on', fr: 'Créé le', ar: 'أنشئ بتاريخ' }, published: { en: 'Approved on', fr: 'Approuvé le', ar: 'صودق عليه بتاريخ' },
  review: { en: 'Review frequency / next review', fr: 'Fréquence de revue / prochaine revue', ar: 'وتيرة المراجعة / المراجعة المقبلة' }, retention: { en: 'Retention', fr: 'Conservation', ar: 'مدة الحفظ' }, distribution: { en: 'Distribution', fr: 'Diffusion', ar: 'التوزيع' }, process: { en: 'Process', fr: 'Processus', ar: 'العملية' } };
/** Lifecycle and distribution lines of the identification block (FR-DA-DGC-04): distribution = the roles accountable, consulted and informed in the process. */
function lifecycle(d, lang) {
  const l = k => LC[k][lang] || LC[k].en; const e2e = d.e2e_id ? D.get(d.org_id, 'e2e', d.e2e_id) : null; const roles = new Set();
  for (const id of e2e?.ufts || []) { const u = D.get(d.org_id, 'uft', id); for (const k of ['A', 'C', 'I']) { const v = pick(u?.racsiT?.[k], lang) || u?.racsi?.[k]; if (v) String(v).split(/[,;]\s*/).forEach(r => roles.add(r)); } }
  return [[l('owner'), userName(d.owner_id || d.author_id) || '—'], [l('created'), (d.created_at || '').slice(0, 10)], [l('published'), (d.published_at || '').slice(0, 10) || '—'],
    [l('review'), `${d.review_frequency || '—'} / ${d.next_review || '—'}`], [l('retention'), d.retention || '—'], ...(e2e ? [[l('process'), `${e2e.id} — ${pick(e2e.name, lang)}`]] : []), [l('distribution'), [...roles].join(', ') || '—']];
}
function insertDoc(req, p, tpl, model, { lang, version, minor = 0, note, sections = null, overrides = {}, formatting = {}, meta = {} }) {
  const id = uuid(); const tm = now();
  run(`INSERT INTO documents(id,org_id,project_id,doc_type,version,minor,status,lang,title,data_as_of,model,sources,findings,author_id,owner_id,change_note,template_id,template_version,overrides,formatting,e2e_id,review_frequency,next_review,retention,classification,created_at,updated_at) VALUES(?,?,?,?,?,?,'Draft',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    id, req.orgId, p.id, tpl.code, version, minor, lang, model.title, model.dataAsOf, S({ ...model, defs: sections || tpl.sections }), S(model.sources), S(model.findings), req.user.id, meta.owner_id || req.user.id, note || null, tpl.id, tpl.version, S(overrides), S(formatting), (tpl.e2e || [])[0] || null,
    meta.review_frequency || 'Annual', meta.next_review || null, meta.retention || '5 years', meta.classification || t('ter.confidential', lang), tm, tm);
  audit(req, 'Document', id, 'generate', null, { code: tpl.code, version: `${version}.${minor}`, findings: model.findings.length }); return one(`SELECT * FROM documents WHERE id=?`, id);
}
/** Generate a draft from a template (or a blank document) with the current data of the project (FR-DA-DOC-04, FR-DA-DCR-01). */
r.post('/projects/:id/documents', requirePerm('documents.manage'), ah(req => {
  const p = projectOf(req, req.params.id); const b = req.body || {}; const lang = ['en', 'fr', 'ar'].includes(b.lang) ? b.lang : req.lang;
  const tpl = b.blank ? { id: null, code: 'DT-BLANK-' + Date.now().toString(36).toUpperCase(), name: b.title ? { en: b.title, fr: b.title, ar: b.title } : { en: 'Document', fr: 'Document', ar: 'وثيقة' }, category: b.category || 'Record', sections: [{ id: 's1', type: 'text', title: { en: 'Content', fr: 'Contenu', ar: 'المحتوى' }, text: { en: '', fr: '', ar: '' } }], profile: { identification: true, revisions: true, sources: false, approval: true }, version: 0, e2e: [] }
    : E.template(req.orgId, codeOf(b.doc_type || b.template || 'DT-TER'));
  if (!tpl) throw new HttpError(404, 'err.notFound');
  const prev = all(`SELECT version FROM documents WHERE project_id=? AND (doc_type=? OR doc_type=?) ORDER BY version DESC`, p.id, tpl.code, Object.keys(ALIAS).find(k => ALIAS[k] === tpl.code) || '-')[0];
  const model = E.generate(ctxOf(req, p.id, lang), { tpl, meta: { version: (prev?.version || 0) + 1, status: 'Draft', author: req.user.name } });
  const d = insertDoc(req, p, tpl, model, { lang, version: (prev?.version || 0) + 1, note: b.change_note, meta: b });
  return docOut(d, true);
}));
r.get('/documents/:id', requirePerm('reports.view'), ah(req => {
  const d = getDoc(req, req.params.id); const out = docOut(d, true);
  const versions = all(`SELECT id, version, minor, status, created_at, change_note, author_id FROM documents WHERE project_id=? AND doc_type=? AND org_id=? ORDER BY version DESC, minor DESC`, d.project_id, d.doc_type, req.orgId).map(v => ({ ...v, versionLabel: verLabel(v), author: userName(v.author_id) }));
  const st = d.status === 'Published' || d.status === 'Draft' ? E.staleness(ctxOf(req, d.project_id, d.lang), d) : { stale: false, changed: [] };
  const tpl = E.template(req.orgId, d.template_id || codeOf(d.doc_type));
  return { ...out, versions, staleness: st, template: tpl ? { id: tpl.id, code: tpl.code, version: tpl.version, newer: tpl.version > (d.template_version || 0) } : null, sectionDefs: J(d.model, {}).defs || tpl?.sections || [] };
}));
/** Metadata: title, owner, review frequency, next review, retention, classification (FR-DA-DCR-01, FR-DA-DGC-13). */
r.patch('/documents/:id', requirePerm('documents.manage'), ah(req => {
  const d = getDoc(req, req.params.id); const b = req.body || {}; const sets = []; const vals = [];
  for (const k of ['title', 'owner_id', 'review_frequency', 'next_review', 'retention', 'classification']) if (b[k] !== undefined) { sets.push(`${k}=?`); vals.push(b[k] === '' ? null : String(b[k]).slice(0, 200)); }
  if (b.owner_id && !one(`SELECT id FROM users WHERE id=? AND org_id=?`, b.owner_id, req.orgId)) throw new HttpError(422, 'err.invalidOption', { field: 'owner_id', value: b.owner_id });
  if (sets.length) run(`UPDATE documents SET ${sets.join(', ')}, updated_at=? WHERE id=?`, ...vals, now(), d.id);
  audit(req, 'Document', d.id, 'metadata', null, b); return docOut(getDoc(req, d.id));
}));
/** Regeneration from newer data: preview of what changes, then a new version keeping manual text and overrides (FR-DA-DCR-06). */
r.post('/documents/:id/regenerate', requirePerm('documents.manage'), ah(req => {
  const d = getDoc(req, req.params.id); const tpl = E.template(req.orgId, d.template_id || codeOf(d.doc_type)); if (!tpl) throw new HttpError(404, 'err.notFound');
  const old = J(d.model, {}); const defs = req.body?.applyTemplate ? tpl.sections : old.defs || tpl.sections; const overrides = J(d.overrides, {});
  const model = E.generate(ctxOf(req, d.project_id, d.lang), { tpl, sections: defs, overrides });
  const changes = E.diff(old, model); if (req.body?.preview) return { changes, findings: model.findings };
  const major = req.body?.major !== false && d.status !== 'Draft';
  const version = major ? (one(`SELECT MAX(version) v FROM documents WHERE project_id=? AND doc_type=?`, d.project_id, d.doc_type).v || 0) + 1 : d.version;
  const minor = major ? 0 : (one(`SELECT MAX(minor) m FROM documents WHERE project_id=? AND doc_type=? AND version=?`, d.project_id, d.doc_type, d.version).m || 0) + 1;
  const nd = insertDoc(req, { id: d.project_id }, { ...tpl, version: req.body?.applyTemplate ? tpl.version : d.template_version || tpl.version }, model, { lang: d.lang, version, minor, note: req.body?.change_note || 'Regenerated from newer data', sections: defs, overrides, formatting: J(d.formatting, {}), meta: { owner_id: d.owner_id, review_frequency: d.review_frequency, retention: d.retention, classification: d.classification } });
  return { ...docOut(nd, true), changes };
}));
/** A new version by copy of the current content (FR-DA-DCR-02). */
r.post('/documents/:id/copy-version', requirePerm('documents.manage'), ah(req => {
  const d = getDoc(req, req.params.id); const major = !!req.body?.major;
  const version = major ? (one(`SELECT MAX(version) v FROM documents WHERE project_id=? AND doc_type=?`, d.project_id, d.doc_type).v || 0) + 1 : d.version;
  const minor = major ? 0 : (one(`SELECT MAX(minor) m FROM documents WHERE project_id=? AND doc_type=? AND version=?`, d.project_id, d.doc_type, d.version).m || 0) + 1;
  const id = uuid(); const tm = now();
  run(`INSERT INTO documents(id,org_id,project_id,doc_type,version,minor,status,lang,title,data_as_of,model,sources,findings,author_id,owner_id,change_note,template_id,template_version,overrides,formatting,e2e_id,review_frequency,next_review,retention,classification,created_at,updated_at) SELECT ?,org_id,project_id,doc_type,?,?,'Draft',lang,title,data_as_of,model,sources,findings,?,owner_id,?,template_id,template_version,overrides,formatting,e2e_id,review_frequency,next_review,retention,classification,?,? FROM documents WHERE id=?`,
    id, version, minor, req.user.id, req.body?.change_note || `Copy of ${verLabel(d)}`, tm, tm, d.id);
  audit(req, 'Document', id, 'copy', null, { from: d.id }); return docOut(getDoc(req, id), true);
}));
r.post('/documents/:id/restore', requirePerm('documents.manage'), ah(req => {
  const src = getDoc(req, req.body?.from || req.params.id); const version = (one(`SELECT MAX(version) v FROM documents WHERE project_id=? AND doc_type=?`, src.project_id, src.doc_type).v || 0) + 1; const id = uuid(); const tm = now();
  run(`INSERT INTO documents(id,org_id,project_id,doc_type,version,minor,status,lang,title,data_as_of,model,sources,findings,author_id,owner_id,change_note,template_id,template_version,overrides,formatting,e2e_id,review_frequency,next_review,retention,classification,created_at,updated_at) SELECT ?,org_id,project_id,doc_type,?,0,'Draft',lang,title,data_as_of,model,sources,findings,?,owner_id,?,template_id,template_version,overrides,formatting,e2e_id,review_frequency,next_review,retention,classification,?,? FROM documents WHERE id=?`,
    id, version, req.user.id, `Restore of ${verLabel(src)}`, tm, tm, src.id); audit(req, 'Document', id, 'restore', null, { from: src.id }); return docOut(getDoc(req, id), true);
}));
r.get('/documents/:id/compare', requirePerm('reports.view'), ah(req => { const a = getDoc(req, req.params.id), b = getDoc(req, req.query.with); return { a: verLabel(a), b: verLabel(b), changes: E.diff(J(a.model, {}), J(b.model, {})) }; }));

/* -------------------------------------------------------------------------------- sections of a draft */
const draftOnly = d => { if (d.status !== 'Draft') throw new HttpError(409, 'err.draftOnly'); };
function rerender(req, d, defs, overrides) {
  const tpl = E.template(req.orgId, d.template_id || codeOf(d.doc_type)) || { code: d.doc_type, name: { en: d.title, fr: d.title, ar: d.title }, sections: defs, profile: {} };
  const model = E.generate(ctxOf(req, d.project_id, d.lang), { tpl, sections: defs, overrides });
  run(`UPDATE documents SET model=?, sources=?, findings=?, overrides=?, title=coalesce(title,?), data_as_of=?, updated_at=? WHERE id=?`, S({ ...model, title: d.title || model.title, defs }), S(model.sources), S(model.findings), S(overrides), model.title, model.dataAsOf, now(), d.id);
  return docOut(getDoc(req, d.id), true);
}
/** Add, rename, move, duplicate, hide, format or delete a section of a draft (FR-DA-DCR-03, FR-DA-DFP-03, -07, -08). */
r.put('/documents/:id/sections', requirePerm('documents.manage'), ah(req => {
  const d = getDoc(req, req.params.id); draftOnly(d); const defs = req.body?.sections; if (!Array.isArray(defs)) throw new HttpError(422, 'err.required', { field: 'sections' });
  const types = ['text', 'table', 'diagram', 'kv', 'approval', 'picture', 'steps', 'builtin'];
  const clean = defs.map(s => { if (!types.includes(s.type)) throw new HttpError(422, 'err.invalidOption', { field: 'type', value: s.type });
    const f = s.formatting || {}; return { ...s, id: String(s.id || uuid()).slice(0, 40), formatting: { align: ['left', 'center', 'right', 'justify'].includes(f.align) ? f.align : undefined, size: [9, 10, 11, 12, 14, 16].includes(Number(f.size)) ? Number(f.size) : undefined, color: /^[0-9A-F]{6}$/i.test(f.color || '') && E.ALLOWED.colors.includes(f.color.toUpperCase()) ? f.color.toUpperCase() : undefined, callout: !!f.callout, bold: !!f.bold, italic: !!f.italic, pageBreak: !!f.pageBreak, hideTitle: !!f.hideTitle },
      picture: s.type === 'picture' ? { assetId: String(s.picture?.assetId || '').replace(/[^\w]/g, ''), caption: String(s.picture?.caption || '').slice(0, 200), width: Math.min(100, Math.max(10, Number(s.picture?.width) || 60)), align: ['left', 'center', 'right'].includes(s.picture?.align) ? s.picture.align : 'center' } : undefined }; });
  audit(req, 'Document', d.id, 'sections', null, { n: clean.length }); return rerender(req, d, clean, J(d.overrides, {}));
}));
/** Section Override: text or a value that belongs to this document only, kept on regeneration and listed in it (FR-DA-DCR-05). */
r.put('/documents/:id/overrides/:sectionId', requirePerm('documents.manage'), ah(req => {
  const d = getDoc(req, req.params.id); draftOnly(d); const ov = J(d.overrides, {}); const b = req.body || {};
  if (b.clear) delete ov[req.params.sectionId]; else ov[req.params.sectionId] = { ...(ov[req.params.sectionId] || {}), ...(b.text !== undefined ? { text: String(b.text).slice(0, 20000) } : {}), ...(b.title !== undefined ? { title: String(b.title).slice(0, 200) } : {}), ...(b.cell ? { cells: { ...(ov[req.params.sectionId]?.cells || {}), [b.cell.key]: String(b.cell.value).slice(0, 2000) } } : {}) };
  audit(req, 'Document', d.id, 'override', null, { section: req.params.sectionId }); return rerender(req, d, J(d.model, {}).defs, ov);
}));
/** Edit-through: change the source record of a data-bound row under its own rights and audit, then refresh (FR-DA-DCR-04). */
r.put('/documents/:id/rows', requirePerm('documents.manage'), ah(req => {
  const d = getDoc(req, req.params.id); draftOnly(d); const { type, id, entity, data } = req.body || {}; if (!data || typeof data !== 'object') throw new HttpError(422, 'err.required', { field: 'data' });
  if (type === 'record') { const def = entityRegistry()[entity]; if (!def || !has(req, permFor(def, true))) throw new HttpError(403, 'err.forbidden', { permission: def ? permFor(def, true) : entity }); updateRecord(req, entity, id, { ...data, _justification: req.body._justification || `Edited from document ${d.title}` }); }
  else if (type === 'row') { const row = one(`SELECT * FROM step_rows WHERE id=? AND org_id=?`, id, req.orgId); if (!row) throw new HttpError(404, 'err.notFound'); if (!has(req, 'tasks.execute')) throw new HttpError(403, 'err.forbidden', { permission: 'tasks.execute' });
    run(`UPDATE step_rows SET data=?, updated_by=?, updated_at=? WHERE id=?`, S({ ...J(row.data, {}), ...data }), req.user.id, now(), id); audit(req, 'StepRow', id, 'update', J(row.data, {}), data, req.body._justification); }
  else if (type === 'register') { const e = one(`SELECT * FROM register_entries WHERE id=? AND org_id=?`, id, req.orgId); if (!e) throw new HttpError(404, 'err.notFound'); run(`UPDATE register_entries SET data=?, version=version+1, updated_at=? WHERE id=?`, S({ ...J(e.data, {}), ...data }), now(), id); audit(req, 'RegisterEntry', id, 'update', J(e.data, {}), data, req.body._justification); }
  else throw new HttpError(422, 'err.invalidOption', { field: 'type', value: type });
  return rerender(req, d, J(d.model, {}).defs, J(d.overrides, {}));
}));
r.put('/documents/:id/formatting', requirePerm('documents.manage'), ah(req => { const d = getDoc(req, req.params.id); draftOnly(d); const f = E.sanitizeFormatting({ ...E.effectiveFormatting(req.orgId, null), ...(req.body || {}) }); run(`UPDATE documents SET formatting=?, updated_at=? WHERE id=?`, S({ ...req.body, ...f }), now(), d.id); audit(req, 'Document', d.id, 'formatting'); return docOut(getDoc(req, d.id)); }));

/* ------------------------------------------------------------------------------------------ lifecycle */
r.post('/documents/:id/submit', requirePerm('documents.manage'), ah(req => {
  const d = getDoc(req, req.params.id); draftOnly(d);
  const model = J(d.model, {}); const fresh = E.consistency(req.orgId, d.project_id, model.sections || [], d.lang); const blocking = fresh.filter(f => f.blocking);
  run(`UPDATE documents SET findings=? WHERE id=?`, S([...J(d.findings, []).filter(f => !f.blocking), ...fresh]), d.id);
  if (blocking.length) throw new HttpError(409, 'err.blockingFindings', { n: blocking.length });
  run(`UPDATE documents SET status='In Review', updated_at=? WHERE id=?`, now(), d.id); audit(req, 'Document', d.id, 'submit'); return docOut(getDoc(req, d.id));
}));
r.post('/documents/:id/publish', requirePerm('documents.approve'), ah(req => {
  const d = getDoc(req, req.params.id); if (d.status !== 'In Review') throw new HttpError(409, 'err.lifecycle', { from: d.status, to: 'Published' });
  if (d.author_id === req.user.id) throw new HttpError(409, 'err.selfApprove'); // two-person rule (FR-DA-DOC-05)
  const blocking = E.consistency(req.orgId, d.project_id, J(d.model, {}).sections || [], d.lang).filter(f => f.blocking); if (blocking.length) throw new HttpError(409, 'err.blockingFindings', { n: blocking.length });
  tx(() => { run(`UPDATE documents SET status='Superseded', updated_at=? WHERE project_id=? AND doc_type=? AND lang=? AND status='Published'`, now(), d.project_id, d.doc_type, d.lang);
    run(`UPDATE documents SET status='Published', approver_id=?, published_at=?, change_note=coalesce(?, change_note), next_review=coalesce(next_review, date(?, '+1 year')), updated_at=? WHERE id=?`, req.user.id, now(), req.body?._justification || null, now(), now(), d.id); });
  audit(req, 'Document', d.id, 'publish', null, null, req.body?._justification); return docOut(getDoc(req, d.id));
}));
r.post('/documents/:id/reject', requirePerm('documents.approve'), ah(req => { const d = getDoc(req, req.params.id); if (d.status !== 'In Review') throw new HttpError(409, 'err.lifecycle', { from: d.status, to: 'Draft' }); run(`UPDATE documents SET status='Draft', change_note=? WHERE id=?`, req.body?._justification || null, d.id); audit(req, 'Document', d.id, 'reject', null, null, req.body?._justification); return docOut(getDoc(req, d.id)); }));
r.post('/documents/:id/retire', requirePerm('documents.approve'), ah(req => {
  const d = getDoc(req, req.params.id); if (!['Published', 'In Review'].includes(d.status)) throw new HttpError(409, 'err.lifecycle', { from: d.status, to: 'Retired' });
  if (!String(req.body?._justification || '').trim()) throw new HttpError(422, 'err.justificationRequired');
  run(`UPDATE documents SET status='Retired', change_note=?, updated_at=? WHERE id=?`, req.body._justification, now(), d.id); audit(req, 'Document', d.id, 'retire', null, null, req.body._justification); return docOut(getDoc(req, d.id));
}));
r.delete('/documents/:id', requirePerm('documents.manage'), ah(req => { const d = getDoc(req, req.params.id); if (d.status !== 'Draft') throw new HttpError(409, 'err.publishedNoDelete'); run(`DELETE FROM documents WHERE id=?`, d.id); audit(req, 'Document', d.id, 'delete', { version: verLabel(d) }); return { ok: true }; }));
r.get('/documents/:id/impact', requirePerm('reports.view'), ah(req => { const d = getDoc(req, req.params.id); const ids = (J(d.model, {}).sections || []).flatMap(s => (s.table?.trace || []).map(x => x.id)); return E.impact(req.orgId, ids).filter(x => x.id !== d.id); }));

/* ------------------------------------------------------------------------------------- download */
export function exportMeta(req, d, model) {
  const lang = d.lang; const org = one(`SELECT name FROM organizations WHERE id=?`, d.org_id); const p = one(`SELECT name FROM projects WHERE id=?`, d.project_id);
  const tpl = E.template(d.org_id, d.template_id || codeOf(d.doc_type)); const fmt = E.effectiveFormatting(d.org_id, tpl, J(d.formatting, {}));
  const versions = all(`SELECT version, minor, status, created_at, published_at, change_note, author_id FROM documents WHERE project_id=? AND doc_type=? AND org_id=? AND lang=? ORDER BY version, minor`, d.project_id, d.doc_type, d.org_id, lang);
  const ov = J(d.overrides, {}); const secById = Object.fromEntries((model.sections || []).map(s => [s.id, s.heading]));
  const sections = (model.sections || []).map(s => (s.type === 'picture' && s.picture?.assetId ? { ...s, picture: { ...s.picture, buffer: assetBuffer(d.org_id, s.picture.assetId) } } : s));
  return { model: { ...model, sections, lang }, meta: { formatting: fmt, profile: tpl?.profile || model.profile || {}, orgName: pick(J(org?.name, org?.name), lang), projectName: pick(J(p?.name, p?.name), lang), reference: `${codeOf(d.doc_type)}-${String(d.id).slice(0, 4).toUpperCase()}`, versionLabel: verLabel(d), statusLabel: t('status.' + d.status, lang),
    dataAsOf: new Date(d.data_as_of || now()).toLocaleString(lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-MA' : 'en-GB'), classification: d.classification || t('ter.confidential', lang), categoryLabel: pick(E.CATEGORIES[tpl?.category || model.category] || { en: '' }, lang),
    owner: userName(d.owner_id || d.author_id) || '', approver: userName(d.approver_id) || '',
    logo: fmt.logo === 'none' ? null : assetBuffer(d.org_id, fmt.logoAsset), identification: identification(d, model, lang, org, pick(J(p?.name, p?.name), lang)),
    revisions: versions.map(v => [`${v.version}${v.minor ? '.' + v.minor : ''}`, t('status.' + v.status, lang), (v.published_at || v.created_at || '').slice(0, 10), userName(v.author_id) || '', v.change_note || '']),
    sources: (model.sources || []).map(s => [String(s.name), String(s.records ?? ''), s.step || '—']),
    approvalRows: [[t('ter.author', lang), userName(d.author_id) || '', (d.created_at || '').slice(0, 10), ''], [t('ter.approver', lang), userName(d.approver_id) || '', (d.published_at || '').slice(0, 10), '']],
    overrides: Object.entries(ov).map(([k, v]) => [secById[k] || k, [v.title, v.text ? String(v.text).slice(0, 200) : null, v.cells ? Object.keys(v.cells).length + ' cell(s)' : null].filter(Boolean).join(' · ')]) } };
}
r.get('/documents/:id/download', requirePerm('reports.export'), ah(async (req, res) => {
  const d = getDoc(req, req.params.id); const fmt = ['pdf', 'xlsx', 'docx'].includes(req.query.format) ? req.query.format : 'docx';
  const { model, meta } = exportMeta(req, d, J(d.model, {})); const buf = await exportDocument(model, meta, fmt);
  const name = `${codeOf(d.doc_type)}_v${verLabel(d)}_${d.status}_${d.lang}.${fmt}`.replace(/[^\w.-]/g, '_');
  res.set('Content-Type', MIME[fmt]).set('Content-Disposition', `attachment; filename="${name}"`).send(buf);
}));
/** Preview of a template or layout's formatting on a short sample (FR-DA-DFP-06, FR-DA-DCR-08). */
r.post('/document-preview', requirePerm('reports.view'), ah(async (req, res) => {
  const b = req.body || {}; const lang = req.lang; const fmt = E.sanitizeFormatting({ ...E.effectiveFormatting(req.orgId, null), ...(b.formatting || {}) });
  const model = { title: b.title || 'Preview', lang, sections: [{ id: 'p1', type: 'text', heading: t('doc.previewHeading', lang), text: t('doc.previewText', lang) }, { id: 'p2', type: 'table', heading: t('doc.previewTable', lang), table: { columns: ['ID', t('ter.docTitle', lang), t('ter.status', lang)], rows: [['A-01', 'Lorem ipsum', 'Green'], ['A-02', 'Dolor sit amet', 'Amber']] } }] };
  const meta = { formatting: fmt, profile: { identification: false, revisions: false, sources: false, approval: false }, orgName: '', projectName: '', reference: 'PREVIEW', versionLabel: '1', statusLabel: t('status.Draft', lang), dataAsOf: '', classification: t('ter.confidential', lang), categoryLabel: '', logo: fmt.logo === 'none' ? null : assetBuffer(req.orgId, fmt.logoAsset), identification: [], revisions: [], sources: [], approvalRows: [], overrides: [] };
  res.set('Content-Type', MIME.pdf).send(await exportDocument(model, meta, 'pdf'));
}));

/* ------------------------------------------------------------------------------- master list, standards */
r.get('/projects/:id/master-list', requirePerm('reports.view'), ah(req => { const p = projectOf(req, req.params.id); const x = E.resolveSource('masterList', ctxOf(req, p.id, req.lang)); return { columns: x.body.table.columns, rows: x.body.table.rows, ids: x.body.table.trace.map(t => t.id) }; }));
/** Documented information each standard in scope requires, with the template and document that answer it (FR-DA-DOC-03). */
r.get('/projects/:id/documented-information', requirePerm('reports.view'), ah(req => {
  const p = projectOf(req, req.params.id); const cfg = one(`SELECT compliance FROM org_config WHERE org_id=?`, req.orgId); const active = J(cfg?.compliance, []);
  const vstd = one(`SELECT vertical_id v FROM projects WHERE id=?`, p.id)?.v; const vert = J(one(`SELECT data FROM catalog WHERE kind='verticalSeed' AND id=?`, vstd)?.data, {});
  const inScope = [...new Set(['ISO 9001', 'ISO 21001', 'ISO 10015', ...active, ...(vert.standards || []).filter(s => STANDARD_REQUIREMENTS[s])])].filter(s => STANDARD_REQUIREMENTS[s]);
  return inScope.map(std => ({ standard: std, items: STANDARD_REQUIREMENTS[std].map(([clause, kind, title, code]) => { const d = one(`SELECT id, version, status FROM documents WHERE project_id=? AND (doc_type=? OR doc_type=?) ORDER BY CASE status WHEN 'Published' THEN 0 ELSE 1 END, version DESC LIMIT 1`, p.id, code, code === 'DT-TER' ? 'TER' : '-');
    return { clause, kind, title: pick(title, req.lang), template: code, document: d ? { id: d.id, version: d.version, status: d.status } : null }; }) }));
}));
export default r;
