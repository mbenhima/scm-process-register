import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';
import { writeAudit } from '../services/audit.js';
import { LLM_PROVIDERS } from '../services/aiGeneration.js';

const router = Router();

// canManageAiUseCases: full catalog CRUD + versioning (aiUseCase.create/edit/delete).
const METADATA_FIELDS = [
  'title', 'title_fr', 'title_ar', 'description', 'sector', 'business_function',
  'ai_technique', 'maturity_stage', 'status', 'tier', 'module_key', 'trigger_desc',
  'output_desc', 'human_checkpoint', 'owner_id', 'expected_impact', 'estimated_roi', 'tags',
];
const VERSION_FIELDS = ['inputs', 'prompt', 'expected_output', 'constraints_guardrails', 'model_technique_notes'];

function getUseCase(req) {
  return db.prepare('SELECT * FROM ai_use_cases WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
}

function nextVersionNumber(useCaseId) {
  const row = db.prepare('SELECT MAX(version_number) AS m FROM ai_use_case_versions WHERE use_case_id = ?').get(useCaseId);
  return (row.m || 0) + 1;
}

function createVersion(useCaseId, body, userId, changeNote) {
  const id = randomUUID();
  const versionNumber = nextVersionNumber(useCaseId);
  db.prepare('UPDATE ai_use_case_versions SET is_current = 0 WHERE use_case_id = ?').run(useCaseId);
  db.prepare(`
    INSERT INTO ai_use_case_versions (
      id, use_case_id, version_number, inputs, prompt, expected_output, constraints_guardrails,
      model_technique_notes, change_note, is_current, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    id, useCaseId, versionNumber,
    body.inputs || null, body.prompt || null, body.expected_output || null,
    body.constraints_guardrails || null, body.model_technique_notes || null,
    changeNote || null, userId,
  );
  db.prepare(`UPDATE ai_use_cases SET current_version_id = ?, updated_at = datetime('now') WHERE id = ?`).run(id, useCaseId);
  return db.prepare('SELECT * FROM ai_use_case_versions WHERE id = ?').get(id);
}

// Predefined provider list for the browser-local Real LLM Provider Connection
// panel hosted by this module (FR-M6-08). No server state involved.
router.get('/providers', requirePermission('aiUseCase.view'), (req, res) => {
  res.json(LLM_PROVIDERS);
});

router.get('/', requirePermission('aiUseCase.view'), (req, res) => {
  const rows = db.prepare(`
    SELECT uc.*, v.version_number AS current_version_number, v.change_note AS current_change_note
    FROM ai_use_cases uc LEFT JOIN ai_use_case_versions v ON v.id = uc.current_version_id
    WHERE uc.organization_id = ? ORDER BY uc.created_at DESC
  `).all(req.user.organizationId);
  res.json(rows);
});

router.get('/:id', requirePermission('aiUseCase.view'), (req, res) => {
  const useCase = getUseCase(req);
  if (!useCase) return res.status(404).json({ error: 'not_found' });
  const currentVersion = useCase.current_version_id
    ? db.prepare('SELECT * FROM ai_use_case_versions WHERE id = ?').get(useCase.current_version_id)
    : null;
  const versions = db.prepare(`
    SELECT v.id, v.version_number, v.change_note, v.is_current, v.created_at, v.created_by,
      u.first_name, u.last_name
    FROM ai_use_case_versions v LEFT JOIN users u ON u.id = v.created_by
    WHERE v.use_case_id = ? ORDER BY v.version_number DESC
  `).all(useCase.id);
  const projectOverrides = db.prepare(`
    SELECT o.*, p.name AS project_name FROM ai_use_case_project_overrides o
    JOIN projects p ON p.id = o.project_id WHERE o.use_case_id = ? ORDER BY p.name
  `).all(useCase.id);
  res.json({ ...useCase, currentVersion, versions, projectOverrides });
});

router.post('/', requirePermission('aiUseCase.create'), (req, res) => {
  const body = req.body || {};
  if (!body.title || !body.description) return res.status(400).json({ error: 'title_and_description_required' });
  const id = randomUUID();
  // Only bind fields actually present in the payload, so an omitted field (e.g. tier)
  // falls back to the column's own SQL DEFAULT instead of being overwritten with NULL.
  const providedFields = METADATA_FIELDS.filter((f) => f in body);
  const cols = ['id', 'organization_id', ...providedFields];
  const vals = [id, req.user.organizationId, ...providedFields.map((f) => body[f])];
  db.prepare(`INSERT INTO ai_use_cases (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).run(...vals);
  const version = createVersion(id, body, req.user.id, 'Initial version');
  const row = db.prepare('SELECT * FROM ai_use_cases WHERE id = ?').get(id);
  writeAudit(req, 'CREATE', 'AIUseCase', id, null, { ...row, version });
  res.status(201).json({ ...row, currentVersion: version, versions: [{ ...version, is_current: 1 }] });
});

router.put('/:id', requirePermission('aiUseCase.edit'), (req, res) => {
  const existing = getUseCase(req);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const body = req.body || {};
  // is_active is deliberately excluded here - it has its own dedicated,
  // separately-permissioned endpoint (PUT /:id/activation) because "manage
  // the catalog" and "activate for the Organization" are distinct capabilities.
  const setCols = METADATA_FIELDS.filter((f) => f in body);
  if (setCols.length) {
    const setClause = setCols.map((f) => `${f} = ?`).join(', ');
    db.prepare(`UPDATE ai_use_cases SET ${setClause}, updated_at = datetime('now') WHERE id = ?`)
      .run(...setCols.map((f) => body[f]), req.params.id);
  }
  const row = db.prepare('SELECT * FROM ai_use_cases WHERE id = ?').get(req.params.id);
  writeAudit(req, 'UPDATE', 'AIUseCase', req.params.id, existing, row);
  res.json(row);
});

// canActivateAiForOrg: Organization-level activate/deactivate, independent of
// catalog-editing rights (FR-M6-03). Deactivating stops new suggestions in
// scope immediately; it never touches content already approved by a human
// (FR-M6-05) - that lives on the Sheet/record itself, untouched by this flag.
router.put('/:id/activation', requirePermission('aiUseCase.activate'), (req, res) => {
  const existing = getUseCase(req);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const isActive = req.body?.is_active ? 1 : 0;
  db.prepare(`UPDATE ai_use_cases SET is_active = ?, updated_at = datetime('now') WHERE id = ?`).run(isActive, req.params.id);
  const row = db.prepare('SELECT * FROM ai_use_cases WHERE id = ?').get(req.params.id);
  writeAudit(req, 'UPDATE', 'AIUseCaseActivation', req.params.id, { is_active: existing.is_active }, { is_active: isActive });
  res.json(row);
});

router.delete('/:id', requirePermission('aiUseCase.delete'), (req, res) => {
  const existing = getUseCase(req);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  // ON DELETE CASCADE on ai_use_case_project_overrides and ai_usage_log purges
  // this use case's keys from the organization/project activation maps and
  // usage history in the same statement (FR-M6-02).
  db.prepare('DELETE FROM ai_use_cases WHERE id = ?').run(req.params.id);
  writeAudit(req, 'DELETE', 'AIUseCase', req.params.id, existing, null);
  res.status(204).end();
});

// --- Project-level tri-state override (canRequestProjectAiOverride, FR-M6-04) ---
router.put('/:id/project-override/:projectId', requirePermission('aiUseCase.projectOverride'), (req, res) => {
  const useCase = getUseCase(req);
  if (!useCase) return res.status(404).json({ error: 'not_found' });
  const project = db.prepare('SELECT * FROM projects WHERE id = ? AND organization_id = ?').get(req.params.projectId, req.user.organizationId);
  if (!project) return res.status(404).json({ error: 'project_not_found' });
  const override = ['inherit', 'on', 'off'].includes(req.body?.override) ? req.body.override : 'inherit';
  const existing = db.prepare('SELECT * FROM ai_use_case_project_overrides WHERE use_case_id = ? AND project_id = ?').get(useCase.id, req.params.projectId);
  if (existing) {
    db.prepare(`UPDATE ai_use_case_project_overrides SET override = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(override, req.user.id, existing.id);
  } else {
    db.prepare(`INSERT INTO ai_use_case_project_overrides (id, use_case_id, project_id, override, updated_by) VALUES (?, ?, ?, ?, ?)`)
      .run(randomUUID(), useCase.id, req.params.projectId, override, req.user.id);
  }
  writeAudit(req, 'UPDATE', 'AIUseCaseProjectOverride', useCase.id, existing, { project_id: req.params.projectId, override });
  res.json({ use_case_id: useCase.id, project_id: req.params.projectId, override });
});

// --- Version history ---
router.get('/:id/versions', requirePermission('aiUseCase.view'), (req, res) => {
  const useCase = getUseCase(req);
  if (!useCase) return res.status(404).json({ error: 'not_found' });
  const versions = db.prepare(`
    SELECT v.*, u.first_name, u.last_name
    FROM ai_use_case_versions v LEFT JOIN users u ON u.id = v.created_by
    WHERE v.use_case_id = ? ORDER BY v.version_number DESC
  `).all(useCase.id);
  res.json(versions);
});

router.get('/:id/versions/:versionId', requirePermission('aiUseCase.view'), (req, res) => {
  const useCase = getUseCase(req);
  if (!useCase) return res.status(404).json({ error: 'not_found' });
  const version = db.prepare('SELECT * FROM ai_use_case_versions WHERE id = ? AND use_case_id = ?').get(req.params.versionId, useCase.id);
  if (!version) return res.status(404).json({ error: 'version_not_found' });
  res.json(version);
});

// Save the current draft as a brand-new version (becomes the current/default version).
router.post('/:id/versions', requirePermission('aiUseCase.edit'), (req, res) => {
  const useCase = getUseCase(req);
  if (!useCase) return res.status(404).json({ error: 'not_found' });
  const version = createVersion(useCase.id, req.body || {}, req.user.id, req.body?.change_note || 'Updated version');
  writeAudit(req, 'CREATE', 'AIUseCaseVersion', version.id, null, version);
  res.status(201).json(version);
});

// Revert = duplicate an old version's content into a brand-new version and make it current.
// History is never rewritten in place - this keeps a full, honest audit trail.
router.post('/:id/versions/:versionId/revert', requirePermission('aiUseCase.edit'), (req, res) => {
  const useCase = getUseCase(req);
  if (!useCase) return res.status(404).json({ error: 'not_found' });
  const target = db.prepare('SELECT * FROM ai_use_case_versions WHERE id = ? AND use_case_id = ?').get(req.params.versionId, useCase.id);
  if (!target) return res.status(404).json({ error: 'version_not_found' });
  const version = createVersion(useCase.id, target, req.user.id, `Reverted to version ${target.version_number}`);
  writeAudit(req, 'UPDATE', 'AIUseCaseVersionRevert', version.id, target, version);
  res.status(201).json(version);
});

export default router;
