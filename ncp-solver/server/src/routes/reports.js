import { Router } from 'express';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';
import { buildPdf, buildXlsx, buildDocx, shapeReport } from '../services/reportExport.js';

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
function getOperational(orgId) {
  const fiches = db.prepare(`SELECT * FROM ncp_fiches WHERE organization_id = ? AND status != 'closed' ORDER BY priority, detection_date`).all(orgId);
  return fiches.map((f) => {
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
}
router.get('/operational', requirePermission('report.view'), (req, res) => res.json(getOperational(req.user.organizationId)));

// Report 2: Action Plan Monitoring Report (weekly)
function getActionPlan(orgId) {
  const rows = db.prepare(`
    SELECT a.*, f.fiche_number, u.first_name, u.last_name
    FROM actions a JOIN ncp_fiches f ON f.id = a.fiche_id
    LEFT JOIN users u ON u.id = a.responsible_owner_id
    WHERE a.organization_id = ? ORDER BY a.planned_completion_date
  `).all(orgId);
  const today = new Date().toISOString().slice(0, 10);
  const evalStmt = db.prepare('SELECT * FROM action_evaluations WHERE action_id = ?');
  return rows.map((a) => ({
    ...a,
    ownerName: a.first_name ? `${a.first_name} ${a.last_name}` : null,
    overdue: a.status !== 'done' && a.planned_completion_date && a.planned_completion_date < today,
    evaluation: evalStmt.get(a.id) || null,
  }));
}
router.get('/action-plan', requirePermission('report.view'), (req, res) => res.json(getActionPlan(req.user.organizationId)));

// Report 3: Strategic Problem-Solving Scorecard
function getScorecard(orgId) {
  const kpis = computeKPIs(orgId);
  const priorityDist = db.prepare(`SELECT priority, COUNT(*) c FROM ncp_fiches WHERE organization_id = ? GROUP BY priority`).all(orgId);
  const byDept = db.prepare(`
    SELECT COALESCE(o.name, 'Unassigned') AS department, COUNT(*) c
    FROM ncp_fiches f LEFT JOIN obs_nodes o ON o.id = f.obs_node_id
    WHERE f.organization_id = ? GROUP BY department ORDER BY c DESC
  `).all(orgId);
  const criticalityDist = db.prepare(`SELECT criticality, COUNT(*) c FROM ncp_fiches WHERE organization_id = ? GROUP BY criticality`).all(orgId);
  return { kpis, priorityDist, byDepartment: byDept, criticalityDist };
}
router.get('/scorecard', requirePermission('report.view'), (req, res) => res.json(getScorecard(req.user.organizationId)));

// Report 4: Capitalization & Lessons Learned Log
function getCapitalizationLog(orgId) {
  return db.prepare(`
    SELECT f.fiche_number, f.title, f.closure_date, r.lessons_learned, r.needs_standardization, r.needs_generalization, r.tags
    FROM rex_entries r JOIN ncp_fiches f ON f.id = r.fiche_id
    WHERE f.organization_id = ? ORDER BY f.closure_date DESC
  `).all(orgId);
}
router.get('/capitalization', requirePermission('report.view'), (req, res) => res.json(getCapitalizationLog(req.user.organizationId)));

const REPORT_GETTERS = {
  operational: getOperational,
  'action-plan': getActionPlan,
  scorecard: getScorecard,
  capitalization: getCapitalizationLog,
};

// Export any of the 4 standard reports to PDF / Excel / Word.
router.get('/:key/export', requirePermission('report.view'), async (req, res) => {
  const getter = REPORT_GETTERS[req.params.key];
  const format = req.query.format;
  if (!getter) return res.status(404).json({ error: 'unknown_report' });
  if (!['pdf', 'xlsx', 'docx'].includes(format)) return res.status(400).json({ error: 'unsupported_format' });

  const payload = getter(req.user.organizationId);
  const shaped = shapeReport(req.params.key, payload);
  const filenameBase = `ncp-solver-${req.params.key}-${new Date().toISOString().slice(0, 10)}`;

  try {
    if (format === 'pdf') {
      const buf = await buildPdf(shaped);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.pdf"`);
      res.send(buf);
    } else if (format === 'xlsx') {
      const buf = await buildXlsx(shaped);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.xlsx"`);
      res.send(Buffer.from(buf));
    } else {
      const buf = await buildDocx(shaped);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.docx"`);
      res.send(buf);
    }
  } catch (err) {
    console.error('report export failed', err);
    res.status(500).json({ error: 'export_failed', message: err.message });
  }
});

export default router;
