// Project Template Blueprints (FR-DA-PTB-01..10, PTC-07/08), audit programme helpers (FR-DA-AFP-01..05) and the
// questionnaire retention policy (NFR-DA-QLT-02).
import { Router } from 'express';
import { ah } from '../lib/http.js';
import { one } from '../db.js';
import { J, HttpError, pick, now } from '../lib/util.js';
import { t } from '../i18n.js';
import { requirePerm } from '../rbac.js';
import { audit } from '../audit.js';
import * as B from '../services/blueprints.js';
import { effectiveFormatting } from '../services/docengine.js';
import { exportDocument, MIME } from '../services/docexport.js';
import { createRecord, updateRecord, getRecord, AUDIT_FREQ_DAYS } from '../entities.js';
import { purgeResponses } from '../services/questionnaires.js';

const r = Router();
const L = req => req.lang || 'en';

r.get('/project-templates/for-creation', requirePerm('projects.create'), ah(req => B.forCreation(req.orgId, L(req))));
r.get('/project-templates/:id/blueprint', requirePerm('catalog.view'), ah(req => B.tree(req.orgId, req.params.id, L(req))));
r.put('/project-templates/:id/blueprint/elements', requirePerm('blueprints.manage'), ah(req => {
  const b = req.body || {}; if (!b.ref) throw new HttpError(422, 'err.required', { field: 'ref' });
  const out = B.setElement(req, req.params.id, b.ref, b); audit(req, 'ProjectTemplate', req.params.id, 'blueprint.element', null, b); return out;
}));
r.post('/project-templates/:id/blueprint/custom', requirePerm('blueprints.manage'), ah(req => { const c = B.addCustom(req, req.params.id, req.body || {}); audit(req, 'ProjectTemplate', req.params.id, 'blueprint.custom', null, c); return c; }));
r.delete('/project-templates/:id/blueprint/custom/:cid', requirePerm('blueprints.manage'), ah(req => B.removeCustom(req, req.params.id, req.params.cid)));
r.get('/project-templates/:id/blueprint/library/:part', requirePerm('catalog.view'), ah(req => B.library(req.orgId, req.params.part, L(req))));
r.post('/project-templates/:id/blueprint/:part', requirePerm('blueprints.manage'), ah(req => { const rows = B.saveRow(req, req.params.id, req.params.part, req.body || {}); audit(req, 'ProjectTemplate', req.params.id, 'blueprint.' + req.params.part, null, req.body); return rows; }));
r.delete('/project-templates/:id/blueprint/:part/:key', requirePerm('blueprints.manage'), ah(req => B.deleteRow(req, req.params.id, req.params.part, req.params.key)));
r.post('/project-templates/:id/status', requirePerm('blueprints.manage'), ah(req => { const out = B.setStatus(req, req.params.id, req.body?.status); audit(req, 'ProjectTemplate', req.params.id, 'status', null, out, req.body?._justification); return out; }));
r.post('/project-templates/:id/duplicate', requirePerm('blueprints.manage'), ah(req => { const out = B.duplicate(req, req.params.id); audit(req, 'ProjectTemplate', out.id, 'duplicate', null, { from: req.params.id }); return out; }));
r.delete('/project-templates/:id', requirePerm('blueprints.manage'), ah(req => { const out = B.remove(req, req.params.id); audit(req, 'ProjectTemplate', req.params.id, out.retired ? 'retire' : 'delete'); return out; }));
r.get('/project-templates/:id/versions', requirePerm('catalog.view'), ah(req => B.versions(req.orgId, req.params.id)));
r.get('/project-templates/:id/compare', requirePerm('catalog.view'), ah(req => B.compare(req.orgId, req.params.id, req.query.a, req.query.b)));
r.get('/project-templates/:id/export', requirePerm('reports.export'), ah(async (req, res) => {
  const fmt = ['docx', 'pdf', 'xlsx'].includes(req.query.format) ? req.query.format : 'pdf'; const lang = L(req);
  const model = B.exportModel(req.orgId, req.params.id, lang); const org = one(`SELECT name FROM organizations WHERE id=?`, req.orgId);
  const meta = { formatting: effectiveFormatting(req.orgId, null), profile: model.profile, orgName: pick(J(org?.name, org?.name), lang), projectName: '', reference: model.code, versionLabel: '', statusLabel: '', dataAsOf: new Date().toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB'),
    classification: t('ter.confidential', lang), categoryLabel: model.category, logo: null, identification: [], revisions: [], sources: [], approvalRows: [], overrides: [] };
  const buf = await exportDocument(model, meta, fmt);
  res.set('Content-Type', MIME[fmt]).set('Content-Disposition', `attachment; filename="${model.code}-blueprint.${fmt}"`).send(buf);
}));

// ------------------------------------------------------------------ Audits (FR-DA-AFP-01..05)
r.get('/audits/scale', requirePerm('audits.view'), ah(req => ({ grades: ['Major', 'Minor', 'Observation', 'Improvement', 'Strength'].map(g => ({ value: g, label: t('grade.' + g, L(req)) })), rules: t('grade.rules', L(req)),
  frequencies: [...Object.keys(AUDIT_FREQ_DAYS), 'Custom'].map(f => ({ value: f, label: t('freq.' + f, L(req)), days: AUDIT_FREQ_DAYS[f] || null })) })));
/** Raise the corrective action of a nonconformity in the application's action process (FR-DA-AFP-04). */
r.post('/audit-findings/:id/action', requirePerm('audits.manage'), ah(req => {
  const f = getRecord(req, 'AuditFinding', req.params.id); if (f.action_id) throw new HttpError(409, 'err.alreadyLinked');
  const owner = req.body?.owner_user_id || req.user.id;
  const a = createRecord(req, 'Action', { owner_user_id: owner, evaluator_user_id: req.body?.evaluator_user_id || req.user.id, due_date: f.due || req.body?.due_date || now().slice(0, 10), status: 'Open',
    title: f.corrective_action || f.statement, source: 'AuditFinding', source_id: f.id }, { projectId: f.project_id || null });
  updateRecord(req, 'AuditFinding', f.id, { action_id: a.id, status: 'Action planned', _justification: `Corrective action ${a.id.slice(0, 8)} raised` });
  return { action: a.id };
}));

// ------------------------------------------------------------------ Retention (NFR-DA-QLT-02)
r.post('/retention/purge', requirePerm('config.manage'), ah(req => { const out = purgeResponses(req.orgId, { mode: req.body?.mode === 'delete' ? 'delete' : 'anonymize' }); audit(req, 'RetentionPolicy', req.orgId, 'purge', null, out); return out; }));
export default r;
