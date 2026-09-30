// Healthcare data pack for the healthcare customer presentation, read (read-only) from the seeded database.
// Usage: node --no-warnings extract-health.mjs   → health-data.json
import { DatabaseSync } from 'node:sqlite'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.join(here, '../../server/data/cortexskills.db'), { readOnly: true });
const J = s => { try { return JSON.parse(s); } catch { return s; } };
const all = (q, ...p) => db.prepare(q).all(...p); const one = (q, ...p) => db.prepare(q).get(...p);
const cat = kind => all('SELECT id, data FROM catalog WHERE kind=? ORDER BY sort, id', kind).map(r => ({ id: r.id, ...J(r.data) }));
const ml = o => { for (const k of Object.keys(o)) if (typeof o[k] === 'string' && o[k].startsWith('{"en"')) o[k] = J(o[k]); return o; };
const recs = (orgId, entity, projectId) => all(`SELECT data, project_id FROM records WHERE org_id=? AND entity=? ${projectId === undefined ? '' : projectId === null ? 'AND project_id IS NULL' : 'AND project_id=?'}`, orgId, entity, ...(projectId ? [projectId] : [])).map(r => ({ ...J(r.data), _project: r.project_id }));
const ENT = ['ComplexityScore', 'ScopeOfWork', 'ScopeCriterion', 'Stakeholder', 'Questionnaire', 'QuestionnaireResponse', 'DiagnosticAssessment', 'MaturityAssessment', 'PerformanceAssessment', 'FunctionalSwot', 'ImprovementAxis', 'SkillGap', 'SkillAssessment', 'TrainingNeed', 'TrainingDemand', 'TrainingTheme', 'TrainingEngineeringReport', 'Roadmap', 'RoadmapInitiative', 'TrainingPlan', 'BudgetLine', 'LearningPath', 'LearningModule', 'ContentAsset', 'Session', 'Enrollment', 'Evaluation', 'Certification', 'RexEntry', 'StrategicObjective', 'RegulatorySubmission', 'IntelligenceReport', 'ConsultingEngagement', 'DevelopmentPlan', 'CoachingEngagement', 'OnboardingRecord', 'InternalOpportunity', 'KnowledgeItem', 'PhaseChecklist', 'Action', 'ActionEvaluation', 'WbsNode', 'Vendor', 'PurchaseOrder', 'Invoice', 'Competency', 'Position', 'Employee', 'CareerPath', 'GamificationAward'];
const ORG_ENT = ['RiskOpportunity', 'Control', 'BusinessRule', 'KpiDefinition', 'AIUseCase', 'KbArticle', 'ExternalIntegration', 'CustomKpi', 'OnboardingPlan', 'ChecklistTemplate', 'Webhook', 'BpmnDiagram'];
function org(o) {
  const out = { org: ml({ ...o }), group: o.group_id ? ml(one('SELECT * FROM groups_ WHERE id=?', o.group_id)) : null, projects: {} };
  out.users = one('SELECT COUNT(*) n FROM users WHERE org_id=?', o.id).n;
  out.roles = all('SELECT r.role_id, COUNT(*) n FROM user_roles r JOIN users u ON u.id=r.user_id WHERE u.org_id=? GROUP BY r.role_id', o.id);
  out.obs = all('SELECT type, COUNT(*) n FROM obs_nodes WHERE org_id=? GROUP BY type', o.id);
  out.obsNodes = all('SELECT name, type FROM obs_nodes WHERE org_id=? LIMIT 60', o.id).map(ml);
  out.orgRecords = Object.fromEntries(ORG_ENT.map(e => [e, recs(o.id, e)]));
  out.config = one('SELECT * FROM org_config WHERE org_id=?', o.id);
  out.licence = one('SELECT * FROM licences WHERE org_id=?', o.id);
  out.alerts = all('SELECT type, severity, COUNT(*) n FROM alerts WHERE org_id=? GROUP BY type, severity', o.id);
  out.alertSamples = all('SELECT type, severity, message, created_at FROM alerts WHERE org_id=? ORDER BY created_at DESC LIMIT 8', o.id).map(a => ({ ...a, message: J(a.message) }));
  out.aiUsage = all('SELECT use_case_id, outcome, COUNT(*) n FROM ai_usage_log WHERE org_id=? GROUP BY use_case_id, outcome', o.id);
  out.audit = one('SELECT COUNT(*) n FROM audit_log WHERE org_id=?', o.id).n;
  out.racsi = { activities: one('SELECT COUNT(*) n FROM racsi_activities WHERE org_id=?', o.id).n, assignments: all('SELECT a.letter, COUNT(*) n FROM racsi_assignments a JOIN racsi_activities r ON r.id=a.activity_id WHERE r.org_id=? GROUP BY a.letter', o.id) };
  out.dispatch = all('SELECT d.category, s.channel, s.status, COUNT(*) n FROM dispatches d JOIN delivery_status s ON s.dispatch_id=d.id WHERE d.org_id=? GROUP BY d.category, s.channel, s.status', o.id);
  for (const p of all('SELECT * FROM projects WHERE org_id=?', o.id)) {
    const pr = { project: ml({ ...p }), records: Object.fromEntries(ENT.map(e => [e, recs(o.id, e, p.id)])) };
    pr.e2e = all(`SELECT e.e2e_id, e.phase, e.status, e.progress, (SELECT COUNT(*) FROM task_instances t WHERE t.e2e_instance_id=e.id) tasks, (SELECT COUNT(*) FROM task_instances t WHERE t.e2e_instance_id=e.id AND t.status='Completed') done FROM e2e_instances e WHERE e.project_id=? ORDER BY e.phase, e.sort`, p.id);
    pr.tasks = one(`SELECT COUNT(*) n, SUM(status='Completed') done, SUM(status='In progress') wip, SUM(status='Blocked') blocked, SUM(status!='Completed' AND due_date < ?) overdue FROM task_instances WHERE project_id=?`, new Date().toISOString(), p.id);
    pr.kpis = all('SELECT kpi_id, period, value, target, status FROM kpi_values WHERE project_id=? ORDER BY kpi_id, period', p.id);
    pr.guidance = all('SELECT uft_id, e2e_id, status, guidance FROM task_instances WHERE project_id=? ORDER BY sort', p.id).map(t => ({ ...t, guidance: J(t.guidance) }));
    out.projects[p.focus] = pr;
  }
  return out;
}
const orgs = all('SELECT * FROM organizations');
const pick = (s, seg) => orgs.find(o => o.sector === s && o.segment === seg);
const V = Object.fromEntries(cat('verticalSeed').map(v => [v.id, v]));
const data = {
  generatedAt: new Date().toISOString(),
  verticals: ['HCPR', 'HLS', 'PHAR', 'PHPR'].map(k => V[k]),
  verticalMp: cat('verticalMp').filter(m => ['HCPR', 'HLS', 'PHAR', 'PHPR'].some(k => String(m.id).startsWith(k) || m.vertical === k)),
  verticalE2E: cat('e2e').filter(e => ['HCPR', 'HLS', 'PHAR', 'PHPR'].some(k => String(e.id).startsWith(k))),
  smeTracks: cat('smeTrackSeed'), smeMp: cat('smeMp'), smeE2E: cat('smeE2E'), gates: cat('gateSeed'), phases: cat('phase'),
  compliance: cat('complianceStandard'), packs: cat('packCatalog'), solutionPacks: cat('solutionPack'), addOns: cat('addOn'), bundles: cat('bundle'), integrations: cat('integration'),
  kpiDefs: cat('kpi'), alertTypes: cat('alertType'), reports: cat('report'), aiUseCases: cat('aiUseCase'), roles: cat('role'), e2e: cat('e2e').filter(e => /^E2E-\d+$/.test(e.id)), checklists: cat('checklistSeed').filter(c => ['HCPR', 'HLS', 'PHAR', 'PHPR'].includes(c.vertical) || /HCPR|HLS|PHAR|PHPR/.test(c.id)),
  hospital: org(pick('HCPR', 'LARGE')), clinic: org(pick('HCPR', 'SME')),
  others: ['HLS', 'PHAR', 'PHPR'].flatMap(s => ['LARGE', 'SME'].map(seg => { const o = pick(s, seg); const ps = all('SELECT id, focus, progress, mode, track FROM projects WHERE org_id=?', o.id); return { sector: s, segment: seg, name: J(o.name), employees: o.employees, city: o.city, runs: Object.fromEntries(ps.map(p => [p.focus, { progress: Math.round(p.progress), mode: p.mode, track: p.track, ...one(`SELECT COUNT(*) n, SUM(status='Completed') done FROM task_instances WHERE project_id=?`, p.id) }])) }; })),
};
fs.writeFileSync(path.join(here, 'health-data.json'), JSON.stringify(data));
console.log('health-data.json', Math.round(fs.statSync(path.join(here, 'health-data.json')).size / 1024), 'KB');
