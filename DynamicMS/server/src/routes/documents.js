// Documented information (FR-DA-DOC): IMS document templates (platform library + tenant
// templates, CRUD), documents generated from project data, their structure (sections),
// versions (draft > review > published), downloads (DOCX, PDF, XLSX) and the tenant's
// document layout (logo, colors, header and footer).
import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { all, get, run, uid, now, J, P, tx } from '../db.js';
import { requirePerm, can } from '../auth.js';
import { h, send, row, rows, bad, notFound, forbidden, requireOrg, loadProject, loadOrgRow, conflict } from '../http.js';
import { audit, snapshot } from '../services/audit.js';
import { DOC_TEMPLATES, TEMPLATE_CATEGORIES, templateByCode } from '../content/templates.js';
import { buildContent, documentModel, diagramSvg, SOURCE_NAMES } from '../services/docdata.js';
import { toPdf, toDocx, toXlsx } from '../services/render.js';
import { materialize } from '../services/diagram.js';
import { addDays } from '../seed/rng.js';
import { config } from '../config.js';
import { catalog } from '../catalog/store.js';

const r = Router();
const tr = (req, v) => (v === undefined || v === null ? null : typeof v === 'object' ? v : { [req.lang]: String(v) });
const REVIEW_DAYS = { Annual: 365, 'Semi-annual': 182, Quarterly: 91, Monthly: 30, 'Per event': 365 };
const manageTemplates = (req) => can(req, 'templates.manage') || can(req, 'records.manage');

// ---------------------------------------------------------------- templates
function tplFromRow(x) {
  const t = row(x);
  return { id: t.id, orgId: t.org_id, code: t.code, name: t.name, description: t.description, category: t.category, docType: t.doc_type, formats: P(t.formats) || [], toc: !!t.toc, ms: P(t.ms) || ['QMS', 'QHSE'],
    mp: t.mp_id, review: t.review, owner: t.owner_role, mandatory: P(t.mandatory) || {}, clauses: P(t.clauses) || {}, sections: P(t.sections) || [], baseCode: t.base_code, version: t.version, status: t.status, custom: true };
}
// Library = platform templates, overridden by the tenant's copy of the same code, plus tenant-only templates.
export function templateLibrary(orgId) {
  const own = orgId ? all('SELECT * FROM doc_templates WHERE org_id=? AND status<>? ORDER BY code', orgId, 'Retired').map(tplFromRow) : [];
  const byCode = Object.fromEntries(own.map(t => [t.code, t]));
  const out = DOC_TEMPLATES.map(t => byCode[t.code] || { ...t, id: t.code, orgId: null, custom: false, version: 1, status: 'Published' });
  for (const t of own) if (!templateByCode[t.code]) out.push(t);
  return out;
}
export function resolveTemplate(orgId, code) { return templateLibrary(orgId).find(t => t.code === code) || null; }

r.get('/orgs/:id/doc-templates', requirePerm('records.view'), h((req, res) => {
  requireOrg(req, req.params.id);
  const lib = templateLibrary(req.params.id);
  let project = null;
  if (req.query.projectId) project = loadProject(req, req.query.projectId);
  const docs = project ? all('SELECT id, template_id, code, status, current_version FROM documents WHERE project_id=?', project.id) : [];
  const stds = project ? P(project.standards) || [] : [];
  send(req, res, { categories: TEMPLATE_CATEGORIES, canManage: manageTemplates(req), items: lib.map(t => ({
    ...t, sectionCount: t.sections.length,
    mandatoryFor: Object.entries(t.mandatory || {}).filter(([s]) => !project || stds.includes(s)).map(([s, k]) => ({ standard: s, kind: k, clause: t.clauses?.[s] })),
    applicable: project ? t.ms.includes(project.ms_type) : true,
    documents: docs.filter(d => d.template_id === t.code),
  })) });
}));
r.get('/orgs/:id/doc-templates/:code', requirePerm('records.view'), h((req, res) => {
  requireOrg(req, req.params.id);
  const t = resolveTemplate(req.params.id, req.params.code);
  if (!t) throw notFound('Template');
  send(req, res, { ...t, canEdit: manageTemplates(req) });
}));
function validateSections(sections) {
  if (!Array.isArray(sections) || !sections.length) throw bad('SECTIONS_REQUIRED', 'A template needs at least one section.');
  const keys = new Set();
  for (const s of sections) {
    if (!s.key || !/^[a-z0-9_-]{1,40}$/i.test(s.key)) throw bad('BAD_SECTION', 'Each section needs a short key (letters, digits, - or _).');
    if (keys.has(s.key)) throw bad('DUPLICATE_SECTION', `Section key "${s.key}" is used twice.`);
    keys.add(s.key);
    if (!['text', 'data', 'signature', 'step'].includes(s.type)) throw bad('BAD_SECTION_TYPE', 'Section type must be text, data, step or signature.');
    if (!s.title || (typeof s.title === 'object' && !Object.values(s.title).some(Boolean))) throw bad('SECTION_TITLE', 'Each section needs a title.');
  }
}
const i18nMerge = (req, prev, v) => (v === undefined ? prev : typeof v === 'object' ? v : { ...(prev || {}), [req.lang]: String(v) });
// Create a tenant template: from scratch, or as an editable copy of a library template (baseCode).
r.post('/orgs/:id/doc-templates', requirePerm('records.view'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  if (!manageTemplates(req)) throw forbidden();
  const b = req.body || {};
  const base = b.baseCode ? resolveTemplate(req.params.id, b.baseCode) : null;
  const code = String(b.code || (base ? base.code : '')).trim().toUpperCase();
  if (!/^[A-Z0-9-]{3,30}$/.test(code)) throw bad('BAD_CODE', 'Code: 3 to 30 capital letters, digits or dashes.');
  if (get('SELECT 1 FROM doc_templates WHERE org_id=? AND code=? AND status<>?', req.params.id, code, 'Retired')) throw conflict('CODE_EXISTS', 'This organization already has a template with this code.');
  if (!base && templateByCode[code]) throw conflict('CODE_RESERVED', 'This code belongs to a library template; copy it instead.');
  const sections = b.sections || base?.sections || [{ key: 'purpose', type: 'text', title: { [req.lang]: 'Purpose and scope' }, text: { [req.lang]: '' } }];
  validateSections(sections);
  const name = b.name ? tr(req, b.name) : base?.name;
  if (!name) throw bad('NAME_REQUIRED', 'Template name is required.');
  const id = uid();
  run(`INSERT INTO doc_templates(id,org_id,code,name,description,category,doc_type,formats,toc,ms,mp_id,review,owner_role,mandatory,clauses,sections,base_code,version,status,created_by,created_at,updated_at)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,'Published',?,?,?)`, id, req.params.id, code, J(name), J(b.description ? tr(req, b.description) : base?.description || null), b.category || base?.category || 'process',
  b.docType || base?.docType || 'Procedure', J(b.formats || base?.formats || ['DOCX', 'PDF']), (b.toc ?? base?.toc ?? true) ? 1 : 0, J(b.ms || base?.ms || ['QMS', 'QHSE']), b.mp || base?.mp || null,
  b.review || base?.review || 'Annual', b.owner || base?.owner || 'document_controller', J(b.mandatory || base?.mandatory || {}), J(b.clauses || base?.clauses || {}), J(sections), base?.code || null, req.user.id, now(), now());
  audit(req, req.params.id, 'doc_template', id, 'create', null, { code, base: base?.code || null }, null);
  res.status(201).json({ id, code });
}));
r.put('/doc-templates/:id', requirePerm('records.view'), h((req, res) => {
  if (!manageTemplates(req)) throw forbidden();
  const t = loadOrgRow(req, 'doc_templates', req.params.id, true, 'Template');
  const b = req.body || {};
  if (b.sections) validateSections(b.sections);
  const before = tplFromRow(t);
  run(`UPDATE doc_templates SET name=?, description=?, category=?, doc_type=?, formats=?, toc=?, ms=?, mp_id=?, review=?, owner_role=?, mandatory=?, clauses=?, sections=?, version=version+1, updated_at=? WHERE id=?`,
    J(i18nMerge(req, before.name, b.name)), J(i18nMerge(req, before.description, b.description)), b.category ?? before.category, b.docType ?? before.docType, J(b.formats ?? before.formats), (b.toc ?? before.toc) ? 1 : 0,
    J(b.ms ?? before.ms), b.mp ?? before.mp, b.review ?? before.review, b.owner ?? before.owner, J(b.mandatory ?? before.mandatory), J(b.clauses ?? before.clauses), J(b.sections ?? before.sections), now(), t.id);
  snapshot(req, t.org_id, 'doc_template', t.id, before, b.justification || null);
  audit(req, t.org_id, 'doc_template', t.id, 'update', { version: before.version }, { version: before.version + 1 }, b.justification || null);
  res.json({ ok: true });
}));
r.delete('/doc-templates/:id', requirePerm('records.view'), h((req, res) => {
  if (!manageTemplates(req)) throw forbidden();
  const t = loadOrgRow(req, 'doc_templates', req.params.id, true, 'Template');
  run('UPDATE doc_templates SET status=?, updated_at=? WHERE id=?', 'Retired', now(), t.id);
  audit(req, t.org_id, 'doc_template', t.id, 'retire', { code: t.code }, null, null);
  res.json({ ok: true });
}));

// ---------------------------------------------------------------- project documents
r.get('/projects/:id/documents', requirePerm('records.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  const lib = Object.fromEntries(templateLibrary(p.org_id).map(t => [t.code, t]));
  send(req, res, rows(all('SELECT * FROM documents WHERE project_id=? ORDER BY doc_type, code', p.id)).map(d => ({ ...d, templateName: lib[d.template_id]?.name || null, formats: lib[d.template_id]?.formats || ['DOCX', 'PDF'] })));
}));
// Documented information required by the project's standards, and whether it exists.
r.get('/projects/:id/documents/mandatory', requirePerm('records.view'), h((req, res) => {
  const p = loadProject(req, req.params.id);
  const stds = P(p.standards) || [];
  const docs = all('SELECT id, template_id, code, status, current_version FROM documents WHERE project_id=?', p.id);
  const out = [];
  for (const t of templateLibrary(p.org_id)) {
    if (!t.ms.includes(p.ms_type)) continue;
    const req2 = Object.entries(t.mandatory || {}).filter(([s]) => stds.includes(s));
    if (!req2.length) continue;
    // An integrated policy covers the stand-alone policies it replaces.
    const alt = t.alternativeTo && docs.find(d => d.template_id === t.alternativeTo);
    const d = docs.find(x => x.template_id === t.code) || alt || null;
    out.push({ code: t.code, name: t.name, category: t.category, formats: t.formats, requirements: req2.map(([s, k]) => ({ standard: s, kind: k, clause: t.clauses?.[s] })), document: d, coveredBy: alt ? t.alternativeTo : null });
  }
  send(req, res, { standards: stds, items: out, missing: out.filter(x => !x.document).length });
}));

function nextCode(p, t, target) {
  const base = `${p.code}-${t.code.replace(/^TPL-/, '')}${target?.mp ? `-${catalog().mpById[target.mp]?.code || target.mp}` : ''}${target?.e2e ? `-${target.e2e.slice(4)}` : ''}`;
  let code = base; let i = 2;
  while (get('SELECT 1 FROM documents WHERE project_id=? AND code=?', p.id, code)) code = `${base}-${i++}`;
  return code;
}
// Creates a document from a template (content generated from the project's data) or a blank one.
export function createDocument(req, p, b) {
  const t = b.templateCode ? resolveTemplate(p.org_id, b.templateCode) : null;
  if (b.templateCode && !t) throw bad('BAD_TEMPLATE', 'Unknown document template.');
  if (!t && !b.title) throw bad('FIELDS_REQUIRED', 'Choose a template or give a title.');
  const target = { mp: b.mpId || (t?.perMp ? t.mp : null) || null, e2e: b.e2e || null };
  if (t?.perMp && !b.mpId) target.mp = t.mp;
  const id = uid();
  const code = b.code || nextCode(p, t || { code: 'DOC' }, t?.perMp || t?.perPhase ? target : null);
  const cat = catalog();
  let title = b.title ? tr(req, b.title) : t.name;
  if (!b.title && t?.perMp && target.mp) title = Object.fromEntries(['en', 'fr', 'ar'].map(l => [l, `${t.name[l] ?? t.name.en} — ${cat.mpById[target.mp].name[l]}`]));
  if (!b.title && t?.perPhase && target.e2e) title = Object.fromEntries(['en', 'fr', 'ar'].map(l => [l, `${t.name[l] ?? t.name.en} — ${cat.e2eById[target.e2e].name[l]}`]));
  const content = t ? buildContent(p.id, t.code, { template: t, docId: id, mpId: target.mp, e2e: target.e2e, target, ownerRole: t.owner, date: now().slice(0, 10) }) : tr(req, b.content || '');
  tx(() => {
    run(`INSERT INTO documents(id,org_id,project_id,code,title,doc_type,template_id,standards,scope_type,current_version,status,owner_role,review_frequency,next_review,mp_id,created_at,target,source_step,updated_at)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, id, p.org_id, p.id, code, J(title), b.docType || t?.docType || 'Procedure', t?.code || null, J(P(p.standards)),
    p.ms_type === 'QHSE' ? 'Integrated' : 'Single-standard', '0.1', 'Draft', b.ownerRole || t?.owner || 'document_controller', b.reviewFrequency || t?.review || 'Annual', null, target.mp || t?.mp || null, now(), J(target), b.stepId || null, now());
    run('INSERT INTO document_versions(id,org_id,document_id,version,status,change_type,summary,content,author,formats,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)', uid(), p.org_id, id, '0.1', 'Draft', 'New',
      J(tr(req, b.summary || (t ? 'Generated from the project data' : 'New document'))), J(content), req.user.id, J(t?.formats || ['DOCX', 'PDF']), now());
    audit(req, p.org_id, 'document', id, 'create', null, { code, template: t?.code || null, step: b.stepId || null }, null);
  });
  return { id, code };
}
r.post('/projects/:id/documents', requirePerm('records.manage'), h((req, res) => {
  const p = loadProject(req, req.params.id, true);
  res.status(201).json(createDocument(req, p, req.body || {}));
}));
r.get('/documents/:id', requirePerm('records.view'), h((req, res) => {
  const d = loadOrgRow(req, 'documents', req.params.id, false, 'Document');
  const t = d.template_id ? resolveTemplate(d.org_id, d.template_id) : null;
  const step = d.source_step ? get('SELECT id, step_id FROM step_exec WHERE id=?', d.source_step) : null;
  send(req, res, { ...d, target: P(d.target), template: t ? { code: t.code, name: t.name, formats: t.formats, toc: t.toc, sections: t.sections.length } : null,
    sourceStep: step ? { id: step.id, stepId: step.step_id, name: catalog().stepById[step.step_id]?.name } : null,
    canManage: can(req, 'records.manage'),
    versions: rows(all('SELECT v.*, a.name AS author_name, ap.name AS approver_name FROM document_versions v LEFT JOIN users a ON a.id=v.author LEFT JOIN users ap ON ap.id=v.approver WHERE v.document_id=? ORDER BY v.created_at DESC', d.id)) });
}));
// Metadata (CRUD: update)
r.put('/documents/:id', requirePerm('records.manage'), h((req, res) => {
  const d = loadOrgRow(req, 'documents', req.params.id, true, 'Document');
  const b = req.body || {};
  if (b.reviewFrequency && !REVIEW_DAYS[b.reviewFrequency]) throw bad('BAD_FREQUENCY', 'Unknown review frequency.');
  const before = row(d);
  run('UPDATE documents SET title=?, owner_role=?, review_frequency=?, updated_at=? WHERE id=?', J(b.title ? { ...(before.title || {}), [req.lang]: String(b.title) } : before.title), b.ownerRole || d.owner_role, b.reviewFrequency || d.review_frequency, now(), d.id);
  audit(req, d.org_id, 'document', d.id, 'update', { title: before.title, owner: d.owner_role, review: d.review_frequency }, b, null);
  res.json({ ok: true });
}));
// Delete: a never-published document is deleted; a published one is retired (kept for traceability).
r.delete('/documents/:id', requirePerm('records.manage'), h((req, res) => {
  const d = loadOrgRow(req, 'documents', req.params.id, true, 'Document');
  const published = get(`SELECT 1 FROM document_versions WHERE document_id=? AND status IN ('Published','Superseded')`, d.id);
  if (published) {
    if (!req.body?.justification && !req.query.justification) throw bad('JUSTIFICATION_REQUIRED', 'A published document is retired, not deleted: give a justification.');
    run(`UPDATE documents SET status='Retired', updated_at=? WHERE id=?`, now(), d.id);
    audit(req, d.org_id, 'document', d.id, 'retire', { status: d.status }, { status: 'Retired' }, req.body?.justification || req.query.justification);
    return res.json({ ok: true, retired: true });
  }
  run('DELETE FROM documents WHERE id=?', d.id);
  audit(req, d.org_id, 'document', d.id, 'delete', { code: d.code }, null, null);
  res.json({ ok: true, deleted: true });
}));
// New version: regenerate from the project's data, or copy the current structure for manual edits.
r.post('/documents/:id/versions', requirePerm('records.manage'), h((req, res) => {
  const d = loadOrgRow(req, 'documents', req.params.id, true, 'Document');
  const b = req.body || {};
  if (get(`SELECT 1 FROM document_versions WHERE document_id=? AND status IN ('Draft','In review')`, d.id)) throw conflict('DRAFT_EXISTS', 'Finish the current draft first.');
  const [maj, min] = String(d.current_version || '0.0').split('.').map(Number);
  const v = b.changeType === 'Major' ? `${maj + 1}.0` : `${maj}.${(min || 0) + 1}`;
  const last = get('SELECT content FROM document_versions WHERE document_id=? ORDER BY created_at DESC LIMIT 1', d.id);
  const target = P(d.target) || {};
  let content;
  if (b.regenerate && d.template_id) content = buildContent(d.project_id, d.template_id, { template: resolveTemplate(d.org_id, d.template_id), docId: d.id, mpId: target.mp, e2e: target.e2e, target, ownerRole: d.owner_role, date: now().slice(0, 10) });
  else if (b.content !== undefined) content = tr(req, b.content);
  else content = P(last?.content);
  run('INSERT INTO document_versions(id,org_id,document_id,version,status,change_type,summary,content,author,formats,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)', uid(), d.org_id, d.id, v, 'Draft', b.changeType || 'Minor', J(tr(req, b.summary || '')), J(content), req.user.id, J(['PDF', 'DOCX']), now());
  run('UPDATE documents SET updated_at=? WHERE id=?', now(), d.id);
  audit(req, d.org_id, 'document', d.id, 'new_version', { version: d.current_version }, { version: v, regenerate: !!b.regenerate }, null);
  res.status(201).json({ version: v });
}));
// Structure of a draft version: add, edit, delete and reorder sections.
r.put('/document-versions/:id/sections', requirePerm('records.manage'), h((req, res) => {
  const v = loadOrgRow(req, 'document_versions', req.params.id, true, 'Version');
  if (v.status !== 'Draft') throw conflict('NOT_DRAFT', 'Only a draft version can be edited. Create a new version first.');
  const c = P(v.content);
  const secs = req.body?.sections;
  if (!Array.isArray(secs)) throw bad('SECTIONS_REQUIRED', 'Send the list of sections.');
  const clean = secs.map((s, i) => {
    if (!s.title) throw bad('SECTION_TITLE', 'Each section needs a title.');
    const prev = (c?.sections || []).find(x => x.key === s.key);
    return { key: s.key || `s${i + 1}-${uid().slice(0, 6)}`, type: prev?.type || 'text', title: typeof s.title === 'object' ? s.title : { ...(prev?.title || {}), [req.lang]: String(s.title) },
      text: s.text === undefined ? prev?.text : (typeof s.text === 'object' ? s.text : { ...(prev?.text || {}), [req.lang]: String(s.text) }), block: prev?.block, source: prev?.source };
  });
  const content = { ...(c && c.format === 'structured' ? c : { format: 'structured', toc: true }), sections: clean, editedAt: now() };
  run('UPDATE document_versions SET content=? WHERE id=?', J(content), v.id);
  audit(req, v.org_id, 'document', v.document_id, 'edit_structure', { sections: (c?.sections || []).length }, { sections: clean.length }, null);
  res.json({ ok: true });
}));
r.post('/document-versions/:id/:action', requirePerm('records.manage'), h((req, res) => {
  const v = loadOrgRow(req, 'document_versions', req.params.id, true, 'Version');
  const d = get('SELECT * FROM documents WHERE id=?', v.document_id);
  const act = req.params.action;
  if (act === 'submit') {
    if (v.status !== 'Draft') throw conflict('BAD_STATE', 'Only drafts can be submitted.');
    run(`UPDATE document_versions SET status='In review' WHERE id=?`, v.id);
  } else if (act === 'approve' || act === 'reject') {
    if (v.status !== 'In review') throw conflict('BAD_STATE', 'Only versions in review can be approved or rejected.');
    if (v.author === req.user.id) throw bad('AUTHOR_CANNOT_APPROVE', 'The author cannot approve their own version.');
    if (act === 'reject') run(`UPDATE document_versions SET status='Draft' WHERE id=?`, v.id);
    else tx(() => {
      run(`UPDATE document_versions SET status='Superseded' WHERE document_id=? AND status='Published'`, d.id);
      run(`UPDATE document_versions SET status='Published', approver=?, approved_at=? WHERE id=?`, req.user.id, now(), v.id);
      run(`UPDATE documents SET current_version=?, status='Published', next_review=?, updated_at=? WHERE id=?`, v.version, addDays(now().slice(0, 10), REVIEW_DAYS[d.review_frequency] || 365), now(), d.id);
    });
  } else throw notFound('Action');
  audit(req, v.org_id, 'document', d.id, act, { status: v.status }, { version: v.version }, req.body?.comment || null);
  res.json({ ok: true });
}));

// ---------------------------------------------------------------- downloads
export function layoutOf(orgId) {
  const s = get('SELECT value FROM settings WHERE org_id=? AND key=?', orgId, 'doc_layout');
  const l = P(s?.value) || {};
  const org = get('SELECT name FROM organizations WHERE id=?', orgId);
  const orgName = P(org?.name);
  const out = { primaryColor: l.primaryColor, accentColor: l.accentColor, titleColor: l.titleColor, headerText: l.headerText, footerText: l.footerText, logoText: l.logoText || (orgName && typeof orgName === 'object' ? orgName.en : orgName) };
  if (l.logoFile) {
    const f = path.join(config.storageDir, l.logoFile);
    if (fs.existsSync(f)) { out.logoFile = f; out.logoBuffer = fs.readFileSync(f); out.logoType = /\.jpe?g$/i.test(f) ? 'jpg' : 'png'; }
  }
  return out;
}
const safeName = (s) => String(s).replace(/[^\p{L}\p{N}._ -]+/gu, '').replace(/\s+/g, '_').slice(0, 80) || 'document';
r.get('/documents/:id/download', requirePerm('records.view'), h(async (req, res) => {
  const d = loadOrgRow(req, 'documents', req.params.id, false, 'Document');
  const v = req.query.version ? get('SELECT * FROM document_versions WHERE id=? AND document_id=?', req.query.version, d.id) : (get(`SELECT * FROM document_versions WHERE document_id=? AND status='Published'`, d.id) || get('SELECT * FROM document_versions WHERE document_id=? ORDER BY created_at DESC LIMIT 1', d.id));
  if (!v) throw notFound('Version');
  const fmt = String(req.query.format || 'pdf').toLowerCase();
  if (!['pdf', 'docx', 'xlsx'].includes(fmt)) throw bad('BAD_FORMAT', 'Format must be pdf, docx or xlsx.');
  // Seeded versions may hold no snapshot: they are rendered from the live project data.
  let ver = v;
  const c = P(v.content);
  if (c && c.format === 'structured' && c.live && d.template_id) {
    const target = P(d.target) || {};
    ver = { ...v, content: J(buildContent(d.project_id, d.template_id, { template: resolveTemplate(d.org_id, d.template_id), docId: d.id, mpId: target.mp, e2e: target.e2e, target, ownerRole: d.owner_role, date: (v.approved_at || v.created_at).slice(0, 10) })) };
  }
  const model = documentModel(d, ver, req.lang, layoutOf(d.org_id));
  if (fmt !== 'xlsx') await materialize(model);
  if (v.status !== 'Published') model.subtitle = `${model.subtitle ? model.subtitle + ' · ' : ''}${{ en: 'UNCONTROLLED DRAFT', fr: 'PROJET NON MAÎTRISÉ', ar: 'مسودة غير خاضعة للضبط' }[req.lang]}`;
  const name = `${safeName(d.code)}_v${v.version}.${fmt}`;
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(name)}"`);
  audit(req, d.org_id, 'document', d.id, 'download', null, { version: v.version, format: fmt }, null);
  if (fmt === 'pdf') { res.setHeader('Content-Type', 'application/pdf'); return toPdf(model, req.lang, res); }
  if (fmt === 'docx') { res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); return res.send(await toDocx(model, req.lang)); }
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return res.send(Buffer.from(await toXlsx(model, req.lang)));
}));
// Names of the data sources a template section can use.
r.get('/doc-sources', requirePerm('records.view'), h((req, res) => res.json(SOURCE_NAMES)));
// Structure (sections) of the version, localized, for the document page.
r.get('/document-versions/:id/structure', requirePerm('records.view'), h((req, res) => {
  const v = loadOrgRow(req, 'document_versions', req.params.id, false, 'Version');
  const d = get('SELECT * FROM documents WHERE id=?', v.document_id);
  let c = P(v.content);
  if (c && c.format === 'structured' && c.live && d.template_id) { const target = P(d.target) || {}; c = buildContent(d.project_id, d.template_id, { template: resolveTemplate(d.org_id, d.template_id), docId: d.id, mpId: target.mp, e2e: target.e2e, target, ownerRole: d.owner_role }); }
  send(req, res, c && c.format === 'structured' ? { structured: true, toc: c.toc, sections: c.sections.map(s => ({ key: s.key, type: s.type, title: s.title, text: s.text, source: s.source, blocks: (s.blocks || (s.block ? [s.block] : [])).map(b => (b.kind === 'diagram' ? { kind: 'diagram', svg: diagramSvg(b, req.lang), caption: b.caption } : b)) })) } : { structured: false, text: c });
}));

// ---------------------------------------------------------------- layout
const logoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1048576, files: 1 }, fileFilter: (_req, f, cb) => cb(null, /^image\/(png|jpe?g)$/.test(f.mimetype)) });
r.get('/orgs/:id/doc-layout', requirePerm('records.view'), h((req, res) => {
  requireOrg(req, req.params.id);
  const l = layoutOf(req.params.id);
  const s = P(get('SELECT value FROM settings WHERE org_id=? AND key=?', req.params.id, 'doc_layout')?.value) || {};
  res.json({ primaryColor: l.primaryColor || '#F8931D', accentColor: l.accentColor || '#E07B00', titleColor: l.titleColor || '#3A3A3C', headerText: l.headerText || '', footerText: l.footerText || '', logoText: l.logoText || '', hasLogo: !!l.logoFile, logoName: s.logoName || null, canEdit: manageTemplates(req) });
}));
r.put('/orgs/:id/doc-layout', requirePerm('records.view'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  if (!manageTemplates(req)) throw forbidden();
  const b = req.body || {};
  const hex = (v, k) => { if (v === undefined || v === null || v === '') return undefined; if (!/^#[0-9a-fA-F]{6}$/.test(v)) throw bad('BAD_COLOR', `${k} must be a color like #F8931D.`); return v; };
  const prev = P(get('SELECT value FROM settings WHERE org_id=? AND key=?', req.params.id, 'doc_layout')?.value) || {};
  const next = { ...prev, primaryColor: hex(b.primaryColor, 'Primary color'), accentColor: hex(b.accentColor, 'Accent color'), titleColor: hex(b.titleColor, 'Title color'), headerText: String(b.headerText ?? prev.headerText ?? '').slice(0, 120), footerText: String(b.footerText ?? prev.footerText ?? '').slice(0, 160), logoText: String(b.logoText ?? prev.logoText ?? '').slice(0, 60) };
  if (b.removeLogo) { delete next.logoFile; delete next.logoName; }
  run(`INSERT INTO settings(org_id,key,value) VALUES(?,?,?) ON CONFLICT(org_id,key) DO UPDATE SET value=excluded.value`, req.params.id, 'doc_layout', J(next));
  audit(req, req.params.id, 'doc_layout', req.params.id, 'update', prev, next, null);
  res.json({ ok: true });
}));
r.post('/orgs/:id/doc-layout/logo', requirePerm('records.view'), logoUpload.single('file'), h((req, res) => {
  requireOrg(req, req.params.id, true);
  if (!manageTemplates(req)) throw forbidden();
  if (!req.file) throw bad('NO_FILE', 'Choose a PNG or JPEG image up to 2 MB.');
  const dir = path.join(config.storageDir, req.params.id);
  fs.mkdirSync(dir, { recursive: true });
  const file = `logo-${uid()}${req.file.mimetype === 'image/png' ? '.png' : '.jpg'}`;
  fs.writeFileSync(path.join(dir, file), req.file.buffer);
  const prev = P(get('SELECT value FROM settings WHERE org_id=? AND key=?', req.params.id, 'doc_layout')?.value) || {};
  const next = { ...prev, logoFile: path.join(req.params.id, file), logoName: req.file.originalname };
  run(`INSERT INTO settings(org_id,key,value) VALUES(?,?,?) ON CONFLICT(org_id,key) DO UPDATE SET value=excluded.value`, req.params.id, 'doc_layout', J(next));
  audit(req, req.params.id, 'doc_layout', req.params.id, 'logo', null, { file: req.file.originalname }, null);
  res.status(201).json({ ok: true });
}));

export default r;
