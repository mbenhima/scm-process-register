import { Router } from 'express';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

const STAGES = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'];
const pct = (num, den) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0);

function computeKPIs(orgId) {
  const actions = db.prepare('SELECT * FROM actions WHERE organization_id = ?').all(orgId);
  const evaluations = db.prepare(`
    SELECT ae.* FROM action_evaluations ae JOIN actions a ON a.id = ae.action_id WHERE a.organization_id = ?
  `).all(orgId);
  const fiches = db.prepare('SELECT * FROM ncp_fiches WHERE organization_id = ?').all(orgId);
  const rex = db.prepare(`
    SELECT r.* FROM rex_entries r JOIN ncp_fiches f ON f.id = r.fiche_id WHERE f.organization_id = ?
  `).all(orgId);

  const evalByAction = new Map(evaluations.map((e) => [e.action_id, e]));
  const imm = actions.filter((a) => a.action_type === 'immediate');
  const corr = actions.filter((a) => a.action_type === 'corrective');

  const immDone = imm.filter((a) => a.status === 'done');
  const corrDone = corr.filter((a) => a.status === 'done');
  const immEffective = immDone.filter((a) => evalByAction.get(a.id)?.review_result === 'effective');
  const corrEffective = corrDone.filter((a) => evalByAction.get(a.id)?.review_result === 'effective');

  const doneActions = actions.filter((a) => a.status === 'done' && a.actual_completion_date && a.planned_completion_date);
  const onTime = doneActions.filter((a) => a.actual_completion_date <= a.planned_completion_date);

  const evalsDue = evaluations.length;
  const evalsDone = evaluations.filter((e) => e.actual_review_date).length;

  const closedFiches = fiches.filter((f) => f.status === 'closed');
  const stdCount = rex.filter((r) => r.needs_standardization).length;
  const genCount = rex.filter((r) => r.needs_generalization).length;

  return {
    kpi1_completion_immediate: pct(immDone.length, imm.length),
    kpi2_effectiveness_immediate: pct(immEffective.length, immDone.length),
    kpi3_on_time_completion: pct(onTime.length, doneActions.length),
    kpi4_completion_corrective: pct(corrDone.length, corr.length),
    kpi5_effectiveness_corrective: pct(corrEffective.length, corrDone.length),
    kpi6_completion_evaluations: pct(evalsDone, evalsDue),
    kpi7_standardization_rate: pct(stdCount, closedFiches.length),
    kpi8_generalization_rate: pct(genCount, closedFiches.length),
    kpi9_nc_count_total: fiches.length,
    kpi10_closure_rate: pct(closedFiches.length, fiches.length),
    raw: {
      immediateTotal: imm.length, immediateDone: immDone.length, immediateEffective: immEffective.length,
      correctiveTotal: corr.length, correctiveDone: corrDone.length, correctiveEffective: corrEffective.length,
      evalsDue, evalsDone, closedFiches: closedFiches.length, totalFiches: fiches.length,
    },
  };
}

router.get('/kpis', requirePermission('report.view'), (req, res) => {
  res.json(computeKPIs(req.user.organizationId));
});

// Report 1: Operational NCP Dashboard
router.get('/operational', requirePermission('report.view'), (req, res) => {
  const fiches = db.prepare(`SELECT * FROM ncp_fiches WHERE organization_id = ? AND status != 'closed' ORDER BY priority, detection_date`).all(req.user.organizationId);
  const rows = fiches.map((f) => {
    const actions = db.prepare('SELECT * FROM actions WHERE fiche_id = ?').all(f.id);
    const imm = actions.filter((a) => a.action_type === 'immediate');
    const corr = actions.filter((a) => a.action_type === 'corrective');
    const ageDays = Math.floor((Date.now() - new Date(f.detection_date)) / 86400000);
    return {
      id: f.id, fiche_number: f.fiche_number, title: f.title, status: f.status,
      current_stage: f.current_stage, stageIndex: STAGES.indexOf(f.current_stage) + 1, stageTotal: 7,
      ageingDays: ageDays, criticality: f.criticality, priority: f.priority,
      immediateProgress: pct(imm.filter((a) => a.status === 'done').length, imm.length),
      correctiveProgress: pct(corr.filter((a) => a.status === 'done').length, corr.length),
    };
  });
  res.json(rows);
});

// Report 2: Action Plan Monitoring Report (weekly)
router.get('/action-plan', requirePermission('report.view'), (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, f.fiche_number, u.first_name, u.last_name
    FROM actions a JOIN ncp_fiches f ON f.id = a.fiche_id
    LEFT JOIN users u ON u.id = a.responsible_owner_id
    WHERE a.organization_id = ? ORDER BY a.planned_completion_date
  `).all(req.user.organizationId);
  const today = new Date().toISOString().slice(0, 10);
  const evalStmt = db.prepare('SELECT * FROM action_evaluations WHERE action_id = ?');
  res.json(rows.map((a) => ({
    ...a,
    ownerName: a.first_name ? `${a.first_name} ${a.last_name}` : null,
    overdue: a.status !== 'done' && a.planned_completion_date && a.planned_completion_date < today,
    evaluation: evalStmt.get(a.id) || null,
  })));
});

// Report 3: Strategic Problem-Solving Scorecard
router.get('/scorecard', requirePermission('report.view'), (req, res) => {
  const kpis = computeKPIs(req.user.organizationId);
  const priorityDist = db.prepare(`SELECT priority, COUNT(*) c FROM ncp_fiches WHERE organization_id = ? GROUP BY priority`).all(req.user.organizationId);
  const byDept = db.prepare(`
    SELECT COALESCE(o.name, 'Unassigned') AS department, COUNT(*) c
    FROM ncp_fiches f LEFT JOIN obs_nodes o ON o.id = f.obs_node_id
    WHERE f.organization_id = ? GROUP BY department ORDER BY c DESC
  `).all(req.user.organizationId);
  const criticalityDist = db.prepare(`SELECT criticality, COUNT(*) c FROM ncp_fiches WHERE organization_id = ? GROUP BY criticality`).all(req.user.organizationId);
  res.json({ kpis, priorityDist, byDepartment: byDept, criticalityDist });
});

// Report 4: Capitalization & Lessons Learned Log
router.get('/capitalization', requirePermission('report.view'), (req, res) => {
  const rows = db.prepare(`
    SELECT f.fiche_number, f.title, f.closure_date, r.lessons_learned, r.needs_standardization, r.needs_generalization, r.tags
    FROM rex_entries r JOIN ncp_fiches f ON f.id = r.fiche_id
    WHERE f.organization_id = ? ORDER BY f.closure_date DESC
  `).all(req.user.organizationId);
  res.json(rows);
});

export default router;
