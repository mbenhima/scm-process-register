// Reports & data export (FR-DA-REP): every report is one model rendered to PDF,
// Excel, Word or CSV in the requested language.
import { Router } from 'express';
import { all, get, P } from '../db.js';
import { requirePerm } from '../auth.js';
import { h, send, bad, loadProject, langOf, notFound } from '../http.js';
import { catalog, loc } from '../catalog/store.js';
import { toPdf, toXlsx, toDocx, toCsv } from '../services/render.js';
import { ROLES } from '../permissions.js';
import { audit } from '../services/audit.js';
import { label } from '../content/labels.js';

const r = Router();
const W = {
  en: { status: 'Project status report', steps: 'Execution log', kpis: 'KPI report', ncs: 'Nonconformity register', risks: 'Risk register', audits: 'Audit programme', racsi: 'RACSI matrix', documents: 'Master document list', review: 'Management review input', phase: 'Phase', progress: 'Progress', gate: 'Gate', decision: 'Decision', steps_: 'Steps', done: 'Done', code: 'Code', name: 'Name', target: 'Target', last: 'Last value', trend: 'Trend', onTarget: 'On target', yes: 'Yes', no: 'No', title: 'Title', source: 'Source', criticality: 'Criticality', stage: 'Stage', detected: 'Detected', closed: 'Closed', kind: 'Kind', score: 'Score', residual: 'Residual', owner: 'Owner', statusL: 'Status', type: 'Type', standard: 'Standard', planned: 'Planned', findings: 'Findings', version: 'Version', review_: 'Next review', activity: 'Activity', step: 'Step', mp: 'Macro process', value: 'Value entered', completed: 'Completed', by: 'By', org: 'Organization', project: 'Project', mode: 'Mode', standards: 'Standards', generated: 'Generated', page: 'Page', overall: 'Overall progress', openNc: 'Open nonconformities', offKpi: 'KPIs off target', overdue: 'Overdue steps', summary: 'Summary', caption: 'Values are the last measured period; status colours follow the red-to-green scale.', objectives: 'Quality objectives', results: 'Audit results', actions: 'Actions', mr: 'Inputs required by ISO 9001 clause 9.3.2, compiled from the project records.' },
  fr: { status: 'Rapport d\'avancement du projet', steps: 'Journal d\'exécution', kpis: 'Rapport des KPI', ncs: 'Registre des non-conformités', risks: 'Registre des risques', audits: 'Programme d\'audit', racsi: 'Matrice RACSI', documents: 'Liste maîtresse des documents', review: 'Éléments d\'entrée de la revue de direction', phase: 'Phase', progress: 'Avancement', gate: 'Jalon', decision: 'Décision', steps_: 'Étapes', done: 'Terminées', code: 'Code', name: 'Nom', target: 'Cible', last: 'Dernière valeur', trend: 'Tendance', onTarget: 'Dans la cible', yes: 'Oui', no: 'Non', title: 'Titre', source: 'Source', criticality: 'Criticité', stage: 'Étape', detected: 'Détectée', closed: 'Clôturée', kind: 'Nature', score: 'Score', residual: 'Résiduel', owner: 'Propriétaire', statusL: 'Statut', type: 'Type', standard: 'Norme', planned: 'Prévu', findings: 'Constats', version: 'Version', review_: 'Prochaine revue', activity: 'Activité', step: 'Étape', mp: 'Macro-processus', value: 'Valeur saisie', completed: 'Terminée le', by: 'Par', org: 'Organisation', project: 'Projet', mode: 'Mode', standards: 'Normes', generated: 'Généré le', page: 'Page', overall: 'Avancement global', openNc: 'Non-conformités ouvertes', offKpi: 'KPI hors cible', overdue: 'Étapes en retard', summary: 'Synthèse', caption: 'Les valeurs sont celles de la dernière période mesurée ; les couleurs suivent l\'échelle du rouge au vert.', objectives: 'Objectifs qualité', results: 'Résultats d\'audit', actions: 'Actions', mr: 'Éléments d\'entrée exigés par l\'ISO 9001 § 9.3.2, compilés à partir des enregistrements du projet.' },
  ar: { status: 'تقرير حالة المشروع', steps: 'سجل التنفيذ', kpis: 'تقرير مؤشرات الأداء', ncs: 'سجل حالات عدم المطابقة', risks: 'سجل المخاطر', audits: 'برنامج التدقيق', racsi: 'مصفوفة RACSI', documents: 'القائمة الرئيسية للوثائق', review: 'مدخلات مراجعة الإدارة', phase: 'المرحلة', progress: 'التقدم', gate: 'البوابة', decision: 'القرار', steps_: 'الخطوات', done: 'المنجزة', code: 'الرمز', name: 'الاسم', target: 'المستهدف', last: 'آخر قيمة', trend: 'الاتجاه', onTarget: 'ضمن المستهدف', yes: 'نعم', no: 'لا', title: 'العنوان', source: 'المصدر', criticality: 'الحرجية', stage: 'المرحلة', detected: 'تاريخ الكشف', closed: 'تاريخ الإغلاق', kind: 'النوع', score: 'الدرجة', residual: 'المتبقي', owner: 'المالك', statusL: 'الحالة', type: 'النوع', standard: 'المعيار', planned: 'المخطط', findings: 'الملاحظات', version: 'الإصدار', review_: 'المراجعة التالية', activity: 'النشاط', step: 'الخطوة', mp: 'العملية الكلية', value: 'القيمة المدخلة', completed: 'تاريخ الإنجاز', by: 'بواسطة', org: 'المؤسسة', project: 'المشروع', mode: 'النمط', standards: 'المعايير', generated: 'تاريخ الإنشاء', page: 'صفحة', overall: 'التقدم الإجمالي', openNc: 'حالات عدم مطابقة مفتوحة', offKpi: 'مؤشرات خارج المستهدف', overdue: 'خطوات متأخرة', summary: 'الملخص', caption: 'القيم هي قيم آخر فترة مقاسة؛ وتتبع الألوان المقياس من الأحمر إلى الأخضر.', objectives: 'أهداف الجودة', results: 'نتائج التدقيق', actions: 'الإجراءات', mr: 'المدخلات المطلوبة وفق البند 9.3.2 من ISO 9001، مجمّعة من سجلات المشروع.' },
};
export const REPORTS = ['status', 'review', 'kpis', 'ncs', 'risks', 'audits', 'documents', 'racsi', 'steps'];
const roleName = (c, lang) => loc(ROLES.find(x => x.code === c)?.name, lang) || c;

function kpiRows(p, lang) {
  return all('SELECT * FROM kpis WHERE project_id=? ORDER BY source, code', p.id).map(k => {
    const vals = all('SELECT value FROM kpi_values WHERE kpi_id=? ORDER BY period', k.id).map(v => v.value);
    const last = vals[vals.length - 1]; const prev = vals[vals.length - 4];
    const ok = k.target === null || last === undefined ? null : k.direction === 'down' ? last <= k.target : last >= k.target;
    const trend = prev === undefined || last === undefined ? '' : (k.direction === 'down' ? last < prev : last > prev) ? '+' : last === prev ? '=' : '-';
    return { code: k.code, name: loc(P(k.name), lang), target: k.target_text, last: last ?? '', trend, ok: ok === null ? '' : ok ? W[lang].yes : W[lang].no, _status: ok === null ? undefined : ok ? 3 : 0 };
  });
}

export function buildModel(type, p, lang) {
  const c = catalog(); const w = W[lang];
  const T = (v) => loc(typeof v === 'string' ? P(v) : v, lang);
  const org = get('SELECT * FROM organizations WHERE id=?', p.org_id);
  const base = {
    eyebrow: `${p.code} · ${label(p.ms_type, lang)}`, title: w[type] || type, subtitle: `${T(org.name)} — ${T(p.name)}`,
    meta: [[w.org, T(org.name)], [w.project, T(p.name)], [w.mode, `${label(p.mode, lang)}${p.track ? ' · ' + label(p.track, lang) : ''}`], [w.standards, (P(p.standards) || []).join(', ')], [w.generated, new Date().toISOString().slice(0, 16).replace('T', ' ')]],
    footer: 'DynamicMS', pageLabel: w.page, generatedAt: new Date().toISOString().slice(0, 10), summaryLabel: w.summary,
  };
  const cnt = get(`SELECT COUNT(*) n, SUM(status='Done') d, SUM(status<>'Done' AND due_date < date('now')) od FROM step_exec WHERE project_id=?`, p.id);
  const openNc = get(`SELECT COUNT(*) n FROM ncs WHERE project_id=? AND status<>'Closed'`, p.id).n;
  const kr = kpiRows(p, lang);
  const kpis = [{ label: w.overall, value: `${Math.round(100 * cnt.d / Math.max(1, cnt.n))}%` }, { label: w.overdue, value: cnt.od }, { label: w.openNc, value: openNc }, { label: w.offKpi, value: kr.filter(x => x._status === 0).length }];
  const phaseTable = () => ({ columns: [{ key: 'id', label: 'E2E', width: 0.7 }, { key: 'name', label: w.phase, width: 2.6 }, { key: 'status', label: w.statusL, width: 1 }, { key: 'progress', label: w.progress, width: 0.8 }, { key: 'decision', label: w.decision, width: 0.8 }],
    rows: all('SELECT * FROM phases WHERE project_id=? ORDER BY seq', p.id).map(ph => { const s = get(`SELECT COUNT(*) n, SUM(status='Done') d FROM step_exec WHERE project_id=? AND e2e_id=?`, p.id, ph.e2e_id); const pr = Math.round(100 * s.d / Math.max(1, s.n)); return { id: ph.e2e_id, name: T(c.e2eById[ph.e2e_id].name), status: label(ph.status, lang), progress: `${pr}%`, decision: ph.gate_decision ? label(ph.gate_decision, lang) : '', _status: pr === 100 ? 4 : pr >= 60 ? 3 : pr >= 30 ? 2 : pr > 0 ? 1 : 0 }; }), statusKey: 'progress' });
  const ncTable = (openOnly) => ({ columns: [{ key: 'code', label: w.code, width: 1.4 }, { key: 'title', label: w.title, width: 3 }, { key: 'source', label: w.source, width: 1 }, { key: 'crit', label: w.criticality, width: 0.9 }, { key: 'stage', label: w.stage, width: 0.9 }, { key: 'detected', label: w.detected, width: 0.9 }],
    rows: all(`SELECT * FROM ncs WHERE project_id=? ${openOnly ? "AND status<>'Closed'" : ''} ORDER BY detected_at DESC`, p.id).map(n => ({ code: n.code, title: T(n.title), source: label(n.source, lang), crit: label(n.criticality, lang), stage: label(n.stage, lang), detected: n.detected_at, _status: n.criticality === 'Critical' ? 0 : n.criticality === 'Major' ? 1 : 2 })), statusKey: 'crit' });
  const kpiTable = { columns: [{ key: 'code', label: w.code, width: 0.9 }, { key: 'name', label: w.name, width: 3 }, { key: 'target', label: w.target, width: 0.9 }, { key: 'last', label: w.last, width: 0.9 }, { key: 'trend', label: w.trend, width: 0.6 }, { key: 'ok', label: w.onTarget, width: 0.8 }], rows: kr, statusKey: 'ok', caption: w.caption };
  const auditTable = { columns: [{ key: 'code', label: w.code, width: 1.4 }, { key: 'title', label: w.title, width: 3 }, { key: 'std', label: w.standard, width: 1.4 }, { key: 'planned', label: w.planned, width: 0.9 }, { key: 'status', label: w.statusL, width: 0.9 }, { key: 'f', label: w.findings, width: 0.7 }],
    rows: all('SELECT a.*, (SELECT COUNT(*) FROM findings f WHERE f.audit_id=a.id) nf FROM audits a WHERE project_id=? ORDER BY planned_date', p.id).map(a => ({ code: a.code, title: T(a.title), std: a.standard, planned: a.planned_date, status: label(a.status, lang), f: a.nf })) };
  switch (type) {
    case 'status': return { ...base, kpis, sections: [{ heading: w.phase, table: phaseTable() }, { heading: w.kpis, table: { ...kpiTable, rows: kr.filter(x => x._status === 0) } }, { heading: w.openNc, table: ncTable(true) }] };
    case 'review': {
      const obj = all(`SELECT * FROM registers WHERE project_id=? AND register='objectives'`, p.id).map(o => ({ code: o.code, title: T(o.title), status: label(o.status, lang), _status: o.status === 'On track' ? 3 : 1 }));
      return { ...base, kpis, sections: [{ heading: w.review, text: w.mr }, { heading: w.objectives, table: { columns: [{ key: 'code', label: w.code, width: 0.8 }, { key: 'title', label: w.title, width: 4 }, { key: 'status', label: w.statusL, width: 1 }], rows: obj, statusKey: 'status' } }, { heading: w.kpis, table: kpiTable }, { heading: w.results, table: auditTable }, { heading: w.ncs, table: ncTable(false) }, { heading: w.phase, table: phaseTable() }] };
    }
    case 'kpis': return { ...base, kpis, sections: [{ heading: w.kpis, table: kpiTable }] };
    case 'ncs': return { ...base, kpis, sections: [{ heading: w.ncs, table: ncTable(false) }] };
    case 'audits': return { ...base, sections: [{ heading: w.audits, table: auditTable }] };
    case 'risks': return { ...base, sections: [{ heading: w.risks, table: { columns: [{ key: 'code', label: w.code, width: 0.9 }, { key: 'kind', label: w.kind, width: 0.9 }, { key: 'title', label: w.title, width: 3 }, { key: 'score', label: w.score, width: 0.6 }, { key: 'residual', label: w.residual, width: 0.7 }, { key: 'owner', label: w.owner, width: 1.3 }, { key: 'status', label: w.statusL, width: 0.9 }],
      rows: all('SELECT * FROM risks WHERE project_id=? ORDER BY score DESC', p.id).map(x => ({ code: x.code, kind: label(x.kind, lang), title: T(x.title), score: x.score, residual: x.residual ?? '', owner: roleName(x.owner_role, lang), status: label(x.status, lang), _status: x.score >= 16 ? 0 : x.score >= 10 ? 1 : x.score >= 6 ? 2 : 3 })), statusKey: 'score' } }] };
    case 'documents': return { ...base, sections: [{ heading: w.documents, table: { columns: [{ key: 'code', label: w.code, width: 1.6 }, { key: 'title', label: w.title, width: 3 }, { key: 'type', label: w.type, width: 0.9 }, { key: 'v', label: w.version, width: 0.6 }, { key: 'status', label: w.statusL, width: 0.9 }, { key: 'next', label: w.review_, width: 0.9 }],
      rows: all('SELECT * FROM documents WHERE project_id=? ORDER BY doc_type, code', p.id).map(d => ({ code: d.code, title: T(d.title), type: label(d.doc_type, lang), v: d.current_version, status: label(d.status, lang), next: d.next_review || '' })) } }] };
    case 'racsi': {
      const acts = all('SELECT * FROM racsi_activities WHERE project_id=? ORDER BY e2e_id, mp_id', p.id);
      const asg = all('SELECT * FROM racsi_assignments WHERE activity_id IN (SELECT id FROM racsi_activities WHERE project_id=?)', p.id);
      const by = {}; for (const a of asg) (by[a.activity_id] ||= []).push(a);
      const L = (a, l) => (by[a.id] || []).filter(x => x.letter === l).map(x => roleName(x.assignee, lang)).join(', ');
      return { ...base, sections: [{ heading: w.racsi, table: { columns: [{ key: 'e2e', label: 'E2E', width: 0.6 }, { key: 'act', label: w.activity, width: 2.4 }, { key: 'R', label: 'R', width: 1.2 }, { key: 'A', label: 'A', width: 1.2 }, { key: 'C', label: 'C', width: 1 }, { key: 'S', label: 'S', width: 1 }, { key: 'I', label: 'I', width: 1 }],
        rows: acts.map(a => ({ e2e: a.e2e_id, act: T(a.name), R: L(a, 'R'), A: L(a, 'A'), C: L(a, 'C'), S: L(a, 'S'), I: L(a, 'I') })) } }] };
    }
    case 'steps': return { ...base, kpis, sections: [{ heading: w.steps, table: { columns: [{ key: 'step', label: w.step, width: 0.8 }, { key: 'mp', label: w.mp, width: 0.7 }, { key: 'name', label: w.name, width: 1.8 }, { key: 'value', label: w.value, width: 2.6 }, { key: 'status', label: w.statusL, width: 0.8 }, { key: 'completed', label: w.completed, width: 0.9 }, { key: 'by', label: w.by, width: 1.1 }],
      rows: all('SELECT e.*, u.name AS by_name FROM step_exec e LEFT JOIN users u ON u.id=e.completed_by WHERE e.project_id=? ORDER BY e.seq', p.id).map(e => ({ step: e.step_id, mp: c.mpById[e.mp_id]?.code, name: T(c.stepById[e.step_id]?.name), value: T(P(e.value)) || '', status: label(e.status, lang), completed: e.completed_at?.slice(0, 10) || '', by: e.by_name || '' })) } }] };
    default: throw notFound('Report');
  }
}

r.get('/reports', requirePerm('reports.view'), h((req, res) => {
  const lang = langOf(req);
  send(req, res, { project: REPORTS.map(id => ({ id, name: W[lang][id] })), formats: ['pdf', 'xlsx', 'docx', 'csv'], catalog: catalog().reports });
}));
r.get('/projects/:id/reports/:type', requirePerm('reports.export'), h(async (req, res) => {
  const p = loadProject(req, req.params.id);
  const lang = langOf(req);
  if (!REPORTS.includes(req.params.type)) throw notFound('Report');
  const fmt = (req.query.format || 'pdf').toString();
  const model = buildModel(req.params.type, p, lang);
  const name = `${p.code}-${req.params.type}-${lang}`;
  audit(req, p.org_id, 'report', p.id, 'export', null, { type: req.params.type, format: fmt, lang }, null);
  if (fmt === 'json') return res.json(model);
  if (fmt === 'pdf') { res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Content-Disposition', `attachment; filename="${name}.pdf"`); return toPdf(model, lang, res); }
  if (fmt === 'xlsx') { const buf = await toXlsx(model, lang); res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.setHeader('Content-Disposition', `attachment; filename="${name}.xlsx"`); return res.send(Buffer.from(buf)); }
  if (fmt === 'docx') { const buf = await toDocx(model, lang); res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); res.setHeader('Content-Disposition', `attachment; filename="${name}.docx"`); return res.send(buf); }
  if (fmt === 'csv') { res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename="${name}.csv"`); return res.send(toCsv(model)); }
  throw bad('BAD_FORMAT', 'Format must be pdf, xlsx, docx, csv or json.');
}));

export default r;
