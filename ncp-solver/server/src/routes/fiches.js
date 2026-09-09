import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';
import { writeAudit } from '../services/audit.js';
import { runClassificationAgent, runRexGenerationAgent } from '../services/aiAgents.js';

const router = Router();

const STAGES = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'];

function nextFicheNumber(orgId) {
  const year = new Date().getFullYear();
  const row = db.prepare(`SELECT COUNT(*) AS c FROM ncp_fiches WHERE organization_id = ? AND fiche_number LIKE ?`)
    .get(orgId, `NC-${year}-%`);
  return `NC-${year}-${String(row.c + 1).padStart(4, '0')}`;
}

function ficheScopeClause(req) {
  // Reporter role only sees fiches they detected; every other permitted role sees all org fiches.
  const roleCodes = req.user.roleCodes;
  const onlyOwn = roleCodes.length && roleCodes.every((c) => c === 'reporter');
  if (onlyOwn) return { clause: 'detector_id = ?', params: [req.user.id] };
  return null;
}

router.get('/', requirePermission('fiche.view'), (req, res) => {
  let sql = 'SELECT * FROM ncp_fiches WHERE organization_id = ?';
  const params = [req.user.organizationId];
  const scope = ficheScopeClause(req);
  if (scope) { sql += ` AND ${scope.clause}`; params.push(...scope.params); }
  if (req.query.status) { sql += ' AND status = ?'; params.push(req.query.status); }
  if (req.query.project_id) { sql += ' AND project_id = ?'; params.push(req.query.project_id); }
  sql += ' ORDER BY created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.get('/:id', requirePermission('fiche.view'), (req, res) => {
  const fiche = db.prepare('SELECT * FROM ncp_fiches WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!fiche) return res.status(404).json({ error: 'not_found' });
  const understanding = db.prepare('SELECT * FROM problem_understanding WHERE fiche_id = ?').get(fiche.id) || null;
  const team = db.prepare(`
    SELECT ta.*, u.first_name, u.last_name, u.email FROM ncp_team_assignments ta
    JOIN users u ON u.id = ta.user_id WHERE ta.fiche_id = ?
  `).all(fiche.id);
  const rootCauses = db.prepare('SELECT * FROM root_causes WHERE fiche_id = ? ORDER BY created_at').all(fiche.id);
  const actions = db.prepare('SELECT * FROM actions WHERE fiche_id = ? ORDER BY created_at').all(fiche.id);
  const rex = db.prepare('SELECT * FROM rex_entries WHERE fiche_id = ?').get(fiche.id) || null;
  const aiLogs = db.prepare('SELECT * FROM ai_agent_logs WHERE fiche_id = ? ORDER BY created_at DESC').all(fiche.id);
  res.json({ ...fiche, understanding, team, rootCauses, actions, rex, aiLogs });
});

router.post('/', requirePermission('fiche.create'), (req, res) => {
  const {
    title, description, detection_date, obs_node_id, criticality, priority,
    frequency, target_objective, project_id, applicable_standards,
  } = req.body || {};
  if (!title || !description) return res.status(400).json({ error: 'title_and_description_required' });
  const id = randomUUID();
  const ficheNumber = nextFicheNumber(req.user.organizationId);
  db.prepare(`
    INSERT INTO ncp_fiches (
      id, organization_id, project_id, fiche_number, title, description, detector_id, detection_date,
      obs_node_id, criticality, priority, frequency, target_objective, applicable_standards, current_stage, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'S1', 'open')
  `).run(
    id, req.user.organizationId, project_id || null, ficheNumber, title, description, req.user.id,
    detection_date || new Date().toISOString().slice(0, 10), obs_node_id || null,
    criticality || 'medium', priority || 3, frequency || 'first_time', target_objective || null,
    applicable_standards || null,
  );
  const row = db.prepare('SELECT * FROM ncp_fiches WHERE id = ?').get(id);
  writeAudit(req, 'CREATE', 'NCPFiche', id, null, row);

  // Classification Agent: suggests criticality/priority + similar past fiches, logged for traceability.
  runClassificationAgent(req, row);

  maybeRaiseAlertA(req, row);
  res.status(201).json(row);
});

router.put('/:id', requirePermission('fiche.edit'), (req, res) => {
  const existing = db.prepare('SELECT * FROM ncp_fiches WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const {
    title, description, criticality, priority, frequency, target_objective,
    obs_node_id, applicable_standards, project_id,
  } = req.body || {};
  db.prepare(`
    UPDATE ncp_fiches SET title = COALESCE(?, title), description = COALESCE(?, description),
      criticality = COALESCE(?, criticality), priority = COALESCE(?, priority),
      frequency = COALESCE(?, frequency), target_objective = COALESCE(?, target_objective),
      obs_node_id = COALESCE(?, obs_node_id), applicable_standards = COALESCE(?, applicable_standards),
      project_id = COALESCE(?, project_id), updated_at = datetime('now')
    WHERE id = ?
  `).run(title, description, criticality, priority, frequency, target_objective, obs_node_id, applicable_standards, project_id, req.params.id);
  const row = db.prepare('SELECT * FROM ncp_fiches WHERE id = ?').get(req.params.id);
  writeAudit(req, 'UPDATE', 'NCPFiche', req.params.id, existing, row);
  res.json(row);
});

router.delete('/:id', requirePermission('fiche.delete'), (req, res) => {
  const existing = db.prepare('SELECT * FROM ncp_fiches WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  db.prepare('DELETE FROM ncp_fiches WHERE id = ?').run(req.params.id);
  writeAudit(req, 'DELETE', 'NCPFiche', req.params.id, existing, null);
  res.status(204).end();
});

// --- Stage transitions (S1 -> S7) ---
router.post('/:id/transition', requirePermission('fiche.validate'), (req, res) => {
  const fiche = db.prepare('SELECT * FROM ncp_fiches WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!fiche) return res.status(404).json({ error: 'not_found' });
  const idx = STAGES.indexOf(fiche.current_stage);
  if (idx === STAGES.length - 1) return res.status(400).json({ error: 'already_at_final_stage' });
  const nextStage = STAGES[idx + 1];
  const status = nextStage === 'S7' && req.body?.close ? fiche.status : (fiche.status === 'open' ? 'in_progress' : fiche.status);
  db.prepare(`UPDATE ncp_fiches SET current_stage = ?, status = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(nextStage, status, fiche.id);
  const row = db.prepare('SELECT * FROM ncp_fiches WHERE id = ?').get(fiche.id);
  writeAudit(req, 'UPDATE', 'NCPFicheStage', fiche.id, { stage: fiche.current_stage }, { stage: nextStage });
  res.json(row);
});

router.post('/:id/close', requirePermission('fiche.close'), (req, res) => {
  const fiche = db.prepare('SELECT * FROM ncp_fiches WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!fiche) return res.status(404).json({ error: 'not_found' });
  const gov = db.prepare('SELECT * FROM governance_settings WHERE organization_id = ?').get(req.user.organizationId);
  const requireRex = gov ? !!gov.require_rex_before_close : true;
  const rex = db.prepare('SELECT * FROM rex_entries WHERE fiche_id = ?').get(fiche.id);
  if (requireRex && !rex) return res.status(400).json({ error: 'rex_required_before_close' });
  db.prepare(`UPDATE ncp_fiches SET status = 'closed', current_stage = 'S7', closure_date = date('now'), updated_at = datetime('now') WHERE id = ?`)
    .run(fiche.id);
  const row = db.prepare('SELECT * FROM ncp_fiches WHERE id = ?').get(fiche.id);
  writeAudit(req, 'UPDATE', 'NCPFicheClose', fiche.id, fiche, row);
  res.json(row);
});

// --- S2: Problem Understanding (5W2H) ---
router.put('/:id/understanding', requirePermission('fiche.edit'), (req, res) => {
  const fiche = db.prepare('SELECT * FROM ncp_fiches WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!fiche) return res.status(404).json({ error: 'not_found' });
  const { what, who_detected, where_, when_, how_detected, why_problem, how_much, frequency_analysis, objectives } = req.body || {};
  const existing = db.prepare('SELECT * FROM problem_understanding WHERE fiche_id = ?').get(fiche.id);
  if (existing) {
    db.prepare(`
      UPDATE problem_understanding SET what=?, who_detected=?, where_=?, when_=?, how_detected=?, why_problem=?,
        how_much=?, frequency_analysis=?, objectives=?, updated_at=datetime('now') WHERE fiche_id=?
    `).run(what, who_detected, where_, when_, how_detected, why_problem, how_much, frequency_analysis, objectives, fiche.id);
  } else {
    db.prepare(`
      INSERT INTO problem_understanding (id, fiche_id, what, who_detected, where_, when_, how_detected, why_problem, how_much, frequency_analysis, objectives)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), fiche.id, what, who_detected, where_, when_, how_detected, why_problem, how_much, frequency_analysis, objectives);
  }
  writeAudit(req, existing ? 'UPDATE' : 'CREATE', 'ProblemUnderstanding', fiche.id, existing, req.body);
  res.json(db.prepare('SELECT * FROM problem_understanding WHERE fiche_id = ?').get(fiche.id));
});

// --- Team assignment ---
router.put('/:id/team', requirePermission('fiche.assignTeam'), (req, res) => {
  const fiche = db.prepare('SELECT * FROM ncp_fiches WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!fiche) return res.status(404).json({ error: 'not_found' });
  const { user_ids = [] } = req.body || {};
  db.prepare('DELETE FROM ncp_team_assignments WHERE fiche_id = ?').run(fiche.id);
  for (const uid of user_ids) {
    db.prepare('INSERT INTO ncp_team_assignments (id, fiche_id, user_id, assigned_by) VALUES (?, ?, ?, ?)')
      .run(randomUUID(), fiche.id, uid, req.user.id);
  }
  writeAudit(req, 'UPDATE', 'NCPTeamAssignment', fiche.id, null, { user_ids });
  res.json({ ok: true });
});

// --- S4: Root causes ---
router.get('/:id/root-causes', requirePermission('rootcause.view'), (req, res) => {
  res.json(db.prepare('SELECT * FROM root_causes WHERE fiche_id = ? ORDER BY created_at').all(req.params.id));
});

router.post('/:id/root-causes', requirePermission('rootcause.create'), (req, res) => {
  const fiche = db.prepare('SELECT * FROM ncp_fiches WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!fiche) return res.status(404).json({ error: 'not_found' });
  const { description, cause_category, rca_method_used, standard_id } = req.body || {};
  if (!description) return res.status(400).json({ error: 'description_required' });
  const id = randomUUID();
  db.prepare(`
    INSERT INTO root_causes (id, fiche_id, description, cause_category, rca_method_used, standard_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, fiche.id, description, cause_category || 'method', rca_method_used || '5_why', standard_id || null);
  writeAudit(req, 'CREATE', 'RootCause', id, null, req.body);
  res.status(201).json(db.prepare('SELECT * FROM root_causes WHERE id = ?').get(id));
});

router.put('/:id/root-causes/:rcId', requirePermission('rootcause.edit'), (req, res) => {
  const existing = db.prepare('SELECT * FROM root_causes WHERE id = ? AND fiche_id = ?').get(req.params.rcId, req.params.id);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const { description, cause_category, rca_method_used, validated_at, validated_by } = req.body || {};
  db.prepare(`
    UPDATE root_causes SET description = COALESCE(?, description), cause_category = COALESCE(?, cause_category),
      rca_method_used = COALESCE(?, rca_method_used), validated_at = COALESCE(?, validated_at), validated_by = COALESCE(?, validated_by)
    WHERE id = ?
  `).run(description, cause_category, rca_method_used, validated_at, validated_by, req.params.rcId);
  writeAudit(req, 'UPDATE', 'RootCause', req.params.rcId, existing, req.body);
  res.json(db.prepare('SELECT * FROM root_causes WHERE id = ?').get(req.params.rcId));
});

router.delete('/:id/root-causes/:rcId', requirePermission('rootcause.delete'), (req, res) => {
  const existing = db.prepare('SELECT * FROM root_causes WHERE id = ? AND fiche_id = ?').get(req.params.rcId, req.params.id);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  db.prepare('DELETE FROM root_causes WHERE id = ?').run(req.params.rcId);
  writeAudit(req, 'DELETE', 'RootCause', req.params.rcId, existing, null);
  res.status(204).end();
});

// --- S7: REX / Capitalization ---
router.put('/:id/rex', requirePermission('rex.edit'), (req, res) => {
  const fiche = db.prepare('SELECT * FROM ncp_fiches WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!fiche) return res.status(404).json({ error: 'not_found' });
  const {
    lessons_learned, root_cause_summary, solution_summary,
    needs_standardization, standardization_details, needs_generalization, generalization_plan, tags,
  } = req.body || {};
  const existing = db.prepare('SELECT * FROM rex_entries WHERE fiche_id = ?').get(fiche.id);
  if (existing) {
    db.prepare(`
      UPDATE rex_entries SET lessons_learned=?, root_cause_summary=?, solution_summary=?, needs_standardization=?,
        standardization_details=?, needs_generalization=?, generalization_plan=?, tags=?, updated_at=datetime('now')
      WHERE fiche_id=?
    `).run(lessons_learned, root_cause_summary, solution_summary, needs_standardization ? 1 : 0,
      standardization_details, needs_generalization ? 1 : 0, generalization_plan, tags, fiche.id);
  } else {
    db.prepare(`
      INSERT INTO rex_entries (id, fiche_id, lessons_learned, root_cause_summary, solution_summary, needs_standardization,
        standardization_details, needs_generalization, generalization_plan, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), fiche.id, lessons_learned, root_cause_summary, solution_summary,
      needs_standardization ? 1 : 0, standardization_details, needs_generalization ? 1 : 0, generalization_plan, tags);
  }
  writeAudit(req, existing ? 'UPDATE' : 'CREATE', 'REXEntry', fiche.id, existing, req.body);
  res.json(db.prepare('SELECT * FROM rex_entries WHERE fiche_id = ?').get(fiche.id));
});

// REX Generation Agent: auto-drafts the lessons-learned narrative from the fiche's own data.
router.post('/:id/rex/generate-draft', requirePermission('rex.create'), (req, res) => {
  const fiche = db.prepare('SELECT * FROM ncp_fiches WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!fiche) return res.status(404).json({ error: 'not_found' });
  const draft = runRexGenerationAgent(req, fiche);
  res.json(draft);
});

function maybeRaiseAlertA(req, fiche) {
  if (fiche.criticality === 'high' || fiche.priority === 1) {
    db.prepare(`
      INSERT INTO notification_alerts (id, organization_id, alert_type, triggering_entity_id, target_user_id, channel, message, status, sent_at)
      VALUES (?, ?, 'A', ?, ?, 'email', ?, 'sent', datetime('now'))
    `).run(randomUUID(), req.user.organizationId, fiche.id, req.user.id,
      `New high-priority problem: ${fiche.fiche_number} - ${fiche.title}`);
  }
}

export default router;
