// Generated documents with versions (FR-DA-DOC-04/05/06/09, FR-DA-DCR-01/02): generate a draft from the current data,
// send it for review after the consistency checks, publish it with a second person's approval, download any version.
import { Router } from 'express';
import { ah, projectOf } from '../lib/http.js';
import { all, one, run } from '../db.js';
import { uuid, now, J, S, HttpError, pick } from '../lib/util.js';
import { requirePerm } from '../rbac.js';
import { audit } from '../audit.js';
import { t } from '../i18n.js';
import { exportModel, MIME } from '../services/exporters.js';
import { buildTer, latestSourceChange, DOC_TYPES } from '../services/documents.js';

const r = Router();
const userName = id => one(`SELECT name FROM users WHERE id=?`, id)?.name || null;
const docOut = (d, withModel = false) => d && ({ id: d.id, project_id: d.project_id, doc_type: d.doc_type, version: d.version, status: d.status, lang: d.lang, title: d.title, data_as_of: d.data_as_of,
  author: userName(d.author_id), author_id: d.author_id, approver: userName(d.approver_id), change_note: d.change_note, created_at: d.created_at, published_at: d.published_at,
  findings: J(d.findings, []), sources: J(d.sources, []), ...(withModel ? { model: liveModel(d) } : {}) });
/** The stored snapshot keeps its content; only the identification rows (status, approver) follow the document's lifecycle. */
function liveModel(d) {
  const model = J(d.model, null); if (!model) return model;
  const set = { [t('ter.status', d.lang)]: t('status.' + d.status, d.lang), [t('ter.approver', d.lang)]: userName(d.approver_id) || '—' };
  for (const s of model.sections || []) for (const row of s.table?.rows || []) if (row.length === 2 && row[0] in set) row[1] = set[row[0]];
  return model;
}
function getDoc(req, id) { const d = one(`SELECT * FROM documents WHERE id=? AND org_id=?`, id, req.orgId); if (!d) throw new HttpError(404, 'err.notFound'); return d; }

r.get('/projects/:id/documents', requirePerm('reports.view'), ah(req => {
  const p = projectOf(req, req.params.id); const changed = latestSourceChange(p.id);
  return all(`SELECT * FROM documents WHERE project_id=? AND org_id=? ORDER BY doc_type, version DESC`, p.id, req.orgId).map(d => ({ ...docOut(d), stale: d.status === 'Published' && changed && changed > d.data_as_of }));
}));
r.post('/projects/:id/documents', requirePerm('reports.export'), ah(req => {
  const p = projectOf(req, req.params.id); const type = req.body?.doc_type || 'TER';
  if (!DOC_TYPES.includes(type)) throw new HttpError(422, 'err.invalidOption', { field: 'doc_type', value: type });
  const lang = ['en', 'fr', 'ar'].includes(req.body?.lang) ? req.body.lang : req.lang;
  const prev = all(`SELECT * FROM documents WHERE project_id=? AND doc_type=? ORDER BY version`, p.id, type);
  const version = (prev.at(-1)?.version || 0) + 1;
  const history = prev.map(d => ({ version: d.version, status: d.status, date: d.published_at || d.created_at, author: userName(d.author_id), note: d.change_note }));
  const built = buildTer(req.orgId, p.id, lang, { version, status: 'Draft', author: req.user.name, history, dataAsOf: now() });
  const id = uuid(); const tm = now();
  run(`INSERT INTO documents(id,org_id,project_id,doc_type,version,status,lang,title,data_as_of,model,sources,findings,author_id,change_note,created_at,updated_at) VALUES(?,?,?,?,?,'Draft',?,?,?,?,?,?,?,?,?,?)`,
    id, req.orgId, p.id, type, version, lang, built.model.title, built.dataAsOf, S(built.model), S(built.sources), S(built.findings), req.user.id, req.body?.change_note || null, tm, tm);
  audit(req, 'Document', id, 'generate', null, { type, version, lang, findings: built.findings.length });
  return docOut(getDoc(req, id), true);
}));
r.get('/documents/:id', requirePerm('reports.view'), ah(req => docOut(getDoc(req, req.params.id), true)));
r.post('/documents/:id/submit', requirePerm('reports.export'), ah(req => {
  const d = getDoc(req, req.params.id); if (d.status !== 'Draft') throw new HttpError(409, 'err.invalidTransition', { from: d.status, to: 'In Review' });
  const blocking = J(d.findings, []).filter(f => f.blocking);
  if (blocking.length) throw new HttpError(409, 'err.documentBlocked', { n: blocking.length });
  run(`UPDATE documents SET status='In Review', updated_at=? WHERE id=?`, now(), d.id); audit(req, 'Document', d.id, 'submit', { status: 'Draft' }, { status: 'In Review' });
  return docOut(getDoc(req, d.id));
}));
/** Publication needs a person other than the author (two-person rule); the previously published version is superseded. */
r.post('/documents/:id/publish', requirePerm('reports.export'), ah(req => {
  const d = getDoc(req, req.params.id); if (d.status !== 'In Review') throw new HttpError(409, 'err.invalidTransition', { from: d.status, to: 'Published' });
  if (d.author_id === req.user.id) throw new HttpError(409, 'err.twoPerson');
  const tm = now();
  run(`UPDATE documents SET status='Superseded', updated_at=? WHERE project_id=? AND doc_type=? AND status='Published'`, tm, d.project_id, d.doc_type);
  const model = J(d.model, {}); for (const s of model.sections || []) if (s.table?.rows) for (const row of s.table.rows) if (row[0] === t('ter.approver', d.lang) && row.length === 2) row[1] = req.user.name;
  run(`UPDATE documents SET status='Published', approver_id=?, published_at=?, model=?, change_note=coalesce(?, change_note), updated_at=? WHERE id=?`, req.user.id, tm, S(model), req.body?._justification || null, tm, d.id);
  audit(req, 'Document', d.id, 'publish', { status: 'In Review' }, { status: 'Published' }, req.body?._justification);
  return docOut(getDoc(req, d.id));
}));
r.post('/documents/:id/retire', requirePerm('reports.export'), ah(req => {
  const d = getDoc(req, req.params.id); if (!String(req.body?._justification || '').trim()) throw new HttpError(422, 'err.justificationRequired');
  run(`UPDATE documents SET status='Retired', updated_at=? WHERE id=?`, now(), d.id); audit(req, 'Document', d.id, 'retire', { status: d.status }, { status: 'Retired' }, req.body._justification);
  return docOut(getDoc(req, d.id));
}));
r.delete('/documents/:id', requirePerm('reports.export'), ah(req => {
  const d = getDoc(req, req.params.id); if (d.status !== 'Draft') throw new HttpError(409, 'err.publishedNoDelete');
  run(`DELETE FROM documents WHERE id=?`, d.id); audit(req, 'Document', d.id, 'delete', { version: d.version }, null); return { ok: true };
}));
r.get('/documents/:id/download', requirePerm('reports.export'), ah(async (req, res) => {
  const d = getDoc(req, req.params.id); const fmt = ['pdf', 'xlsx', 'docx'].includes(req.query.format) ? req.query.format : 'docx';
  const model = liveModel(d) || {}; const buf = await exportModel(model, fmt);
  res.set('Content-Type', MIME[fmt]).set('Content-Disposition', `attachment; filename="${d.doc_type}_v${d.version}_${d.status}.${fmt}"`).send(buf);
}));
export default r;
