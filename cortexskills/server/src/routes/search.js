// Global search (SRS Section 4.37, FR-DA-SRCH-01..07). Searches the current Organization within the user's rights:
// projects, business and governance records, questionnaires, trainings, process elements, AI use cases, reports,
// people, OBS units and help topics. Codes match exactly and rank first; words match ignoring case and accents in
// every language. The search reads the live tables, so a change is findable as soon as it is saved (SRCH-07).
import { Router } from 'express';
import { ah } from '../lib/http.js';
import { all } from '../db.js';
import { J, pick } from '../lib/util.js';
import { requirePerm, has } from '../rbac.js';
import * as cat from '../catalog.js';
import { entityRegistry, permFor } from '../entities.js';

const r = Router();
export const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ًͯ-ْ]/g, '').toLowerCase();
const LABELS = ['name', 'title', 'label', 'statement', 'code', 'training_code', 'competency', 'function_name', 'description'];
const STATUS = ['status', 'approval_status', 'state', 'lifecycle', 'validation_status', 'design_status', 'rag'];
const ROUTE = {
  BusinessRule: '/gov/rules', Control: '/gov/controls', RiskOpportunity: '/gov/risks', KpiDefinition: '/gov/kpis', RexEntry: '/gov/rex', AIUseCase: '/ai/use-cases', KbArticle: '/ai/kb', BpmnDiagram: '/process/bpmn',
  ChecklistTemplate: '/process/checklists', ProjectTemplate: '/process/templates', GateDefinition: '/process/gates', Vertical: '/process/verticals', QuestionnaireTemplate: '/questionnaires/templates',
};
function score(q, code, texts) {
  const c = norm(code);
  if (c && c === q) return 100;
  if (c && c.startsWith(q)) return 80;
  const words = q.split(/\s+/).filter(Boolean);
  const hay = texts.map(norm).join(' ');
  if (!words.every(w => hay.includes(w))) return 0;
  return hay.includes(q) ? 50 : 30;
}
const textsOf = v => (v && typeof v === 'object' && !Array.isArray(v) ? Object.values(v).filter(x => typeof x === 'string') : [String(v ?? '')]);

r.get('/search', requirePerm('dashboard.view'), ah(req => {
  const raw = String(req.query.q || '').trim(); const lang = req.lang;
  if (raw.length < 2) return { q: raw, total: 0, groups: [] };
  const q = norm(raw); const types = req.query.types ? String(req.query.types).split(',') : null; const projectId = req.query.project || null;
  const want = ty => !types || types.includes(ty);
  const out = [];
  const add = (type, o, s) => { if (s > 0) out.push({ type, score: s, ...o }); };
  const projects = new Map(all(`SELECT id, name, status, focus FROM projects WHERE org_id=?`, req.orgId).map(p => [p.id, { ...p, name: J(p.name, p.name) }]));

  if (want('project') && has(req, 'projects.view')) for (const p of projects.values()) add('project', { id: p.id, code: p.focus, title: pick(p.name, lang), status: p.status, route: `/projects/${p.id}` }, score(q, '', textsOf(p.name)));

  // Records: every entity the user may read; questionnaire and training records open on their own screens.
  const reg = entityRegistry(); const allowed = Object.values(reg).filter(d => has(req, permFor(d, false))).map(d => d.name);
  if (allowed.length && (want('record') || want('governance') || want('questionnaire') || want('training'))) {
    const ph = allowed.map(() => '?').join(',');
    const rows = all(`SELECT id, entity, project_id, ref, data FROM records WHERE (org_id=? OR (org_id IS NULL AND entity IN ('QuestionnaireTemplate','ChecklistTemplate','ProjectTemplate','GateDefinition','Vertical'))) AND entity IN (${ph}) ${projectId ? 'AND (project_id=? OR project_id IS NULL)' : ''} LIMIT 60000`, req.orgId, ...allowed, ...(projectId ? [projectId] : []));
    for (const x of rows) {
      if (!norm(x.data).includes(q.split(/\s+/)[0])) continue;
      const d = J(x.data, {}); const code = d.code || d.training_code || x.ref || '';
      const labelField = LABELS.find(f => d[f] != null && typeof d[f] !== 'boolean');
      const s = score(q, code, LABELS.flatMap(f => textsOf(d[f])));
      const gov = ['BusinessRule', 'Control', 'RiskOpportunity', 'KpiDefinition', 'Action', 'RexEntry'].includes(x.entity);
      const type = x.entity === 'Questionnaire' || x.entity === 'QuestionnaireTemplate' ? 'questionnaire' : ['TrainingCourse', 'TrainingProgram', 'Persona'].includes(x.entity) ? 'training' : gov ? 'governance' : 'record';
      if (!want(type)) continue;
      const route = x.entity === 'Questionnaire' ? `/questionnaires/${x.id}` : type === 'training' ? `/training-plan${x.project_id ? '?project=' + x.project_id : ''}` : ROUTE[x.entity] || `/records/${x.entity}?id=${x.id}`;
      add(type, { id: x.id, entity: x.entity, code, title: pick(d[labelField], lang) || code || x.entity, location: x.project_id ? pick(projects.get(x.project_id)?.name, lang) : null, status: STATUS.map(f => d[f]).find(Boolean) || null, route }, s);
    }
  }
  // Process elements (FR-DA-SRCH-02): macro processes, E2E processes, tasks, steps, phases, gates, KPIs, AI use cases, reports.
  if (has(req, 'catalog.view') && want('process')) {
    for (const [kind, route] of [['mp', x => `/process/mp/${x.id}`], ['e2e', x => `/process/e2e/${x.id}`], ['uft', x => `/process/e2e/${x.e2e}`], ['step', x => `/process/mp/${x.mp}`], ['phase', () => '/process/e2e'], ['gateSeed', () => '/process/gates']])
      for (const x of cat.list(kind)) add('process', { id: x.id, entity: kind, code: x.id, title: pick(x.name, lang), location: kind === 'uft' ? x.e2e : kind === 'step' ? x.mp : null, route: route(x) }, score(q, x.id, [...textsOf(x.name), ...textsOf(x.description)]));
  }
  if (want('governance') && has(req, 'governance.view')) for (const x of cat.list('kpi')) add('governance', { id: x.id, entity: 'kpi', code: x.id, title: pick(x.name, lang), route: '/gov/kpis' }, score(q, x.id, textsOf(x.name)));
  if (want('ai') && has(req, 'ai.view')) for (const x of cat.list('aiUseCase')) add('ai', { id: x.id, entity: 'aiUseCase', code: x.id, title: pick(x.name, lang), route: '/ai/use-cases' }, score(q, x.id, textsOf(x.name)));
  if (want('report') && has(req, 'reports.view')) for (const x of cat.list('report')) add('report', { id: x.id, entity: 'report', code: x.id, title: pick(x.name, lang), route: `/reports?report=${x.id}` }, score(q, x.id, textsOf(x.name)));
  // People and OBS units: names only, for anyone who can see projects (pickers draw from the same list).
  if (want('people') && has(req, 'projects.view')) {
    for (const u of all(`SELECT id, name, email, title FROM users WHERE org_id=? AND active=1`, req.orgId)) add('people', { id: u.id, code: u.email, title: u.name, location: u.title, route: has(req, 'users.manage') ? `/admin/users?id=${u.id}` : '/tenancy' }, score(q, u.email, [u.name, u.title || '']));
    for (const n of all(`SELECT id, name, type FROM obs_nodes WHERE org_id=?`, req.orgId)) add('people', { id: n.id, code: n.type, title: pick(J(n.name, n.name), lang), route: '/tenancy' }, score(q, '', textsOf(J(n.name, n.name))));
  }
  if (want('help') && has(req, 'help.view')) for (const h of cat.list('help')) add('help', { id: h.id, code: h.id, title: pick(h.title || h.name, lang), route: `/help?topic=${h.id}` }, score(q, h.id, [...textsOf(h.title || h.name), ...textsOf(h.body)]));

  out.sort((a, b) => b.score - a.score || String(a.title).localeCompare(String(b.title)));
  const limit = Math.min(200, Number(req.query.limit) || 60); const top = out.slice(0, limit);
  const order = ['project', 'questionnaire', 'training', 'record', 'governance', 'process', 'ai', 'report', 'people', 'help'];
  const groups = order.map(type => ({ type, items: top.filter(x => x.type === type) })).filter(g => g.items.length);
  return { q: raw, total: out.length, counts: Object.fromEntries(order.map(ty => [ty, out.filter(x => x.type === ty).length])), groups };
}));
export default r;
