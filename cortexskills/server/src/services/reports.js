// Standard reports (D08) built as one neutral model, then exported to PDF, Excel or Word (FR-DA-REP-01..03).
// The report model lists the KPIs and the record classes named in each report's Key_Fields_Shown.
import { all, one } from '../db.js';
import { J, pick, HttpError } from '../lib/util.js';
import * as cat from '../catalog.js';
import { t } from '../i18n.js';
import { getLicenceProvider } from '../licensing/LicenceProvider.js';
import { usage, quotas } from '../entitlements.js';

const LABEL_FIELDS = ['name', 'title', 'label', 'theme_name', 'function_name', 'description', 'category'];
function cell(v, lang) {
  if (v == null) return '';
  if (typeof v === 'object' && !Array.isArray(v)) return pick(v, lang);
  if (Array.isArray(v)) return v.map(x => (typeof x === 'object' ? pick(x.name || x.label || x, lang) : x)).join(', ');
  if (typeof v === 'boolean') return v ? '✓' : '—';
  return String(v);
}
const human = s => s.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());

export function reportCatalog() { return cat.list('report'); }

export function buildReport(req, reportId, { projectId } = {}) {
  const lang = req.lang; const rep = cat.get('report', reportId);
  if (!rep) throw new HttpError(404, 'err.notFound');
  const org = one(`SELECT * FROM organizations WHERE id=?`, req.orgId);
  const project = projectId ? one(`SELECT * FROM projects WHERE id=? AND org_id=?`, projectId, req.orgId) : null;
  if (projectId && !project) throw new HttpError(404, 'err.notFound');
  const scope = project ? ['project_id=?', project.id] : ['org_id=?', req.orgId];
  const model = { id: rep.id, title: pick(rep.name, lang), subtitle: [pick(org.name, lang), project ? pick(project.name, lang) : t('report.allProjects', lang)].join(' · '),
    audience: pick(rep.audience, lang), cadence: pick(rep.cadence, lang), generated: new Date().toISOString(), lang, sections: [] };

  // KPI section
  const kpis = (rep.fields.match(/KPI-\d+/g) || []);
  if (kpis.length) {
    const rows = kpis.map(k => {
      const def = cat.get('kpi', k);
      const v = one(`SELECT AVG(value) value, AVG(target) target, MAX(period) period FROM kpi_values WHERE ${scope[0]} AND kpi_id=?`, scope[1], k);
      return [k, pick(def?.name, lang), v?.value == null ? '—' : String(Math.round(v.value * 10) / 10), pick(def?.target, lang) || '—', v?.period || '—'];
    });
    model.sections.push({ heading: t('report.kpis', lang), table: { columns: ['ID', t('col.kpi', lang), t('col.value', lang), t('col.target', lang), t('col.period', lang)], rows }, rag: 2 });
  }
  // Record classes named in the report fields (ATT-xxxx Class.attribute)
  const classes = {};
  for (const m of rep.fields.matchAll(/ATT-\d+ ([A-Za-z]+)\.([a-z_]+)/g)) (classes[m[1]] ||= new Set()).add(m[2]);
  for (const [cls, attrs] of Object.entries(classes)) {
    const recs = all(`SELECT data FROM records WHERE entity=? AND ${scope[0]} LIMIT 200`, cls, scope[1]).map(r => J(r.data, {}));
    if (!recs.length) continue;
    const label = LABEL_FIELDS.find(f => recs.some(r => r[f] != null));
    const cols = [...new Set([label, ...attrs].filter(Boolean))].slice(0, 7);
    model.sections.push({ heading: pick(cat.list('class').find(c => c.name === cls)?.label, lang) || human(cls),
      table: { columns: cols.map(c => t('field.' + c, lang) !== 'field.' + c ? t('field.' + c, lang) : human(c)), rows: recs.map(r => cols.map(c => cell(r[c], lang))) } });
  }
  // Report-specific sections
  if (['RPT-001', 'RPT-019', 'RPT-030', 'RPT-033'].includes(rep.id) || !model.sections.length) {
    const rows = all(`SELECT e.e2e_id, e.status, e.progress, e.phase FROM e2e_instances e WHERE e.${scope[0]} ORDER BY e.sort`, scope[1]);
    const agg = {}; for (const r of rows) { const a = (agg[r.e2e_id] ||= { n: 0, p: 0, st: {} }); a.n++; a.p += r.progress; a.st[r.status] = (a.st[r.status] || 0) + 1; }
    model.sections.push({ heading: t('report.e2eProgress', lang), table: { columns: ['E2E', t('col.name', lang), t('col.progress', lang), t('col.status', lang)],
      rows: Object.entries(agg).map(([id, a]) => [id, pick(cat.get('e2e', id)?.name, lang), Math.round(a.p / a.n) + '%', Object.entries(a.st).map(([k, v]) => `${t('status.' + k, lang)} ${v}`).join(', ')]) } });
  }
  if (rep.id === 'RPT-024') {
    const risks = all(`SELECT data FROM records WHERE entity='RiskOpportunity' AND org_id=?`, req.orgId).map(r => J(r.data));
    model.sections.push({ heading: t('report.heatmap', lang), heatmap: risks.map(r => ({ l: r.likelihood, i: r.impact })),
      table: { columns: [t('col.name', lang), 'L', 'I', t('col.score', lang), t('col.status', lang)], rows: risks.sort((a, b) => b.score - a.score).map(r => [pick(r.title || r.name, lang), r.likelihood, r.impact, r.score, r.status]) } });
  }
  if (rep.id === 'RPT-025') {
    const u = all(`SELECT use_case_id, outcome, COUNT(*) n FROM ai_usage_log WHERE org_id=? GROUP BY use_case_id, outcome ORDER BY use_case_id`, req.orgId);
    model.sections.push({ heading: t('report.aiUsage', lang), table: { columns: [t('col.useCase', lang), t('col.outcome', lang), 'n'], rows: u.map(r => [r.use_case_id, r.outcome, String(r.n)]) } });
  }
  if (rep.id === 'RPT-026') {
    const lic = getLicenceProvider(req.orgId).check(); const u = usage(req.orgId), q = quotas(req.orgId);
    model.sections.push({ heading: t('report.licence', lang), table: { columns: [t('col.dimension', lang), t('col.used', lang), t('col.limit', lang)], rows: Object.keys(u).map(k => [t('quota.' + k, lang), String(u[k]), q[k] == null ? '∞' : String(q[k])]) },
      text: t('report.licenceStatus', lang, { status: lic.status, days: lic.daysLeft }) });
  }
  if (rep.id === 'RPT-032') {
    const c = all(`SELECT data FROM records WHERE entity='Control' AND org_id=?`, req.orgId).map(r => J(r.data));
    const by = {}; for (const x of c) by[x.coso || '—'] = (by[x.coso || '—'] || 0) + 1;
    model.sections.push({ heading: 'COSO', table: { columns: [t('col.component', lang), 'n'], rows: Object.entries(by).map(([k, v]) => [t('coso.' + k, lang) === 'coso.' + k ? k : t('coso.' + k, lang), String(v)]) }, text: t('disclosure.nonCertification', lang) });
  }
  return model;
}
