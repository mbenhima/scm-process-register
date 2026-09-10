// Resolves whether an AI Use Case is effectively active in a given scope
// (FR-M6-03/04/05): Organization-level is_active is the default; a Project-
// level override, when set to something other than "inherit", takes
// precedence for that Project only. Deactivating stops NEW suggestions
// immediately — it never touches content a human already approved earlier.
import db from '../db/index.js';

export function getUseCaseByModuleKey(organizationId, moduleKey) {
  return db.prepare('SELECT * FROM ai_use_cases WHERE organization_id = ? AND module_key = ?').get(organizationId, moduleKey);
}

export function resolveEffectiveActivation(useCase, projectId) {
  if (!useCase) return true; // no catalog entry for this module_key yet - never silently block
  if (projectId) {
    const override = db.prepare(
      'SELECT override FROM ai_use_case_project_overrides WHERE use_case_id = ? AND project_id = ?',
    ).get(useCase.id, projectId);
    if (override && override.override !== 'inherit') return override.override === 'on';
  }
  return !!useCase.is_active;
}

/** Express middleware: blocks the request with 403 if the named use case is deactivated in scope. */
export function requireActiveUseCase(moduleKey) {
  return (req, res, next) => {
    const useCase = getUseCaseByModuleKey(req.user.organizationId, moduleKey);
    const projectId = req.body?.projectId || req.query?.projectId || null;
    if (!resolveEffectiveActivation(useCase, projectId)) {
      return res.status(403).json({ error: 'ai_use_case_deactivated', moduleKey });
    }
    req.aiUseCase = useCase;
    next();
  };
}
