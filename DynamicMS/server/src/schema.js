// Full schema. Every data-bearing table carries org_id (tenant isolation), except
// platform-wide catalogs (catalog_items, groups_, permission catalog).
// Multilingual text columns hold JSON {"en":..,"fr":..,"ar":..}.
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);

CREATE TABLE IF NOT EXISTS catalog_items (
  kind TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active', updated_at TEXT, PRIMARY KEY (kind, id));

CREATE TABLE IF NOT EXISTS groups_ (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, created_at TEXT);

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY, group_id TEXT REFERENCES groups_(id) ON DELETE SET NULL,
  name TEXT NOT NULL, short_code TEXT, sector TEXT NOT NULL, size TEXT NOT NULL, sme_class TEXT,
  employees INTEGER, country TEXT, city TEXT, default_lang TEXT DEFAULT 'en', email_domain TEXT UNIQUE,
  benchmark_sharing INTEGER DEFAULT 1, deployment_mode TEXT DEFAULT 'DEP-1', pack TEXT,
  industry_packs TEXT, capability_packs TEXT, addons TEXT, compliance_standards TEXT,
  support_tier TEXT, seats INTEGER, currency TEXT DEFAULT 'USD', created_at TEXT);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT, name TEXT NOT NULL, description TEXT, ms_type TEXT NOT NULL, mode TEXT NOT NULL,
  track TEXT, vertical TEXT, standards TEXT, status TEXT DEFAULT 'Active', start_date TEXT, end_date TEXT,
  template_id TEXT, creation_mode TEXT, complexity TEXT, owner_user TEXT, scenario TEXT, created_at TEXT);
CREATE INDEX IF NOT EXISTS ix_projects_org ON projects(org_id);

CREATE TABLE IF NOT EXISTS obs_nodes (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE, parent_id TEXT, name TEXT NOT NULL,
  type TEXT, created_at TEXT);
CREATE INDEX IF NOT EXISTS ix_obs_org ON obs_nodes(org_id);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password_hash TEXT NOT NULL, roles TEXT NOT NULL,
  lang TEXT, is_platform_admin INTEGER DEFAULT 0, status TEXT DEFAULT 'Active', created_at TEXT, last_login TEXT);
CREATE INDEX IF NOT EXISTS ix_users_org ON users(org_id);

CREATE TABLE IF NOT EXISTS obs_members (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, node_id TEXT NOT NULL REFERENCES obs_nodes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, role_in_node TEXT);

CREATE TABLE IF NOT EXISTS user_prefs (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, data TEXT);

CREATE TABLE IF NOT EXISTS role_permissions (
  role TEXT NOT NULL, perm TEXT NOT NULL, granted INTEGER NOT NULL, customized INTEGER DEFAULT 0,
  PRIMARY KEY (role, perm));

CREATE TABLE IF NOT EXISTS settings (org_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT, PRIMARY KEY (org_id, key));

CREATE TABLE IF NOT EXISTS project_mps (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE, org_id TEXT NOT NULL, mp_id TEXT NOT NULL,
  e2e_id TEXT, activation TEXT, status TEXT, owner_role TEXT, progress INTEGER DEFAULT 0,
  started_at TEXT, completed_at TEXT, PRIMARY KEY (project_id, mp_id));

CREATE TABLE IF NOT EXISTS step_exec (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  mp_id TEXT NOT NULL, step_id TEXT NOT NULL, e2e_id TEXT, task_name TEXT, seq INTEGER, status TEXT NOT NULL,
  assignee_role TEXT, assignee_user TEXT, due_date TEXT, completed_at TEXT, completed_by TEXT,
  form_kind TEXT, value TEXT, fields TEXT, notes TEXT, updated_at TEXT);
CREATE INDEX IF NOT EXISTS ix_step_proj ON step_exec(project_id, mp_id);
CREATE INDEX IF NOT EXISTS ix_step_status ON step_exec(project_id, status);
CREATE INDEX IF NOT EXISTS ix_step_user ON step_exec(assignee_user, status);

CREATE TABLE IF NOT EXISTS phases (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  e2e_id TEXT NOT NULL, seq INTEGER, status TEXT, gate_decision TEXT, decided_at TEXT, decided_by TEXT, comment TEXT,
  run_count INTEGER DEFAULT 1);

CREATE TABLE IF NOT EXISTS gate_defs (
  id TEXT PRIMARY KEY, org_id TEXT, code TEXT, name TEXT NOT NULL, purpose TEXT, entry_criteria TEXT,
  exit_criteria TEXT, approvers TEXT, applicability TEXT, enforce INTEGER DEFAULT 1, version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Published', created_at TEXT);

CREATE TABLE IF NOT EXISTS checklist_templates (
  id TEXT PRIMARY KEY, org_id TEXT, code TEXT, name TEXT NOT NULL, scope TEXT, vertical TEXT, mode TEXT,
  track TEXT, items TEXT NOT NULL, version INTEGER DEFAULT 1, status TEXT DEFAULT 'Published', created_at TEXT);

CREATE TABLE IF NOT EXISTS gate_checklists (
  gate_id TEXT NOT NULL REFERENCES gate_defs(id) ON DELETE CASCADE,
  checklist_id TEXT NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  seq INTEGER, mandatory INTEGER DEFAULT 1, track TEXT, PRIMARY KEY (gate_id, checklist_id));

CREATE TABLE IF NOT EXISTS phase_attachments (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, project_id TEXT, template_id TEXT, phase_e2e TEXT,
  gate_id TEXT, checklist_id TEXT, version INTEGER, seq INTEGER);

CREATE TABLE IF NOT EXISTS checklists (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  phase_id TEXT, gate_id TEXT, template_id TEXT, title TEXT, frozen INTEGER DEFAULT 0, signed_off INTEGER DEFAULT 0);

CREATE TABLE IF NOT EXISTS checklist_items (
  id TEXT PRIMARY KEY, checklist_id TEXT NOT NULL REFERENCES checklists(id) ON DELETE CASCADE, org_id TEXT NOT NULL,
  seq INTEGER, text TEXT, mandatory INTEGER DEFAULT 0, evidence_required INTEGER DEFAULT 0, done INTEGER DEFAULT 0,
  done_by TEXT, done_at TEXT);

CREATE TABLE IF NOT EXISTS project_templates (
  id TEXT PRIMARY KEY, org_id TEXT, code TEXT, name TEXT NOT NULL, description TEXT, scope TEXT, vertical TEXT,
  mode TEXT, track TEXT, ms_type TEXT, status TEXT DEFAULT 'Draft', version INTEGER DEFAULT 1, fields TEXT,
  phases TEXT, roles TEXT, milestones TEXT, use_count INTEGER DEFAULT 0, created_at TEXT);

CREATE TABLE IF NOT EXISTS sme_tracks (
  id TEXT PRIMARY KEY, code TEXT, name TEXT, description TEXT, mp_count INTEGER, e2e_count INTEGER,
  gates INTEGER, items_per_gate INTEGER, duration_weeks INTEGER, min_score INTEGER, max_score INTEGER,
  status TEXT DEFAULT 'Active', owner TEXT, version INTEGER DEFAULT 1);

CREATE TABLE IF NOT EXISTS complexity_criteria (
  id TEXT PRIMARY KEY, code TEXT, name TEXT, weight REAL, vertical TEXT, version INTEGER DEFAULT 1, levels TEXT);

CREATE TABLE IF NOT EXISTS complexity_scores (
  project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE, org_id TEXT NOT NULL, criteria TEXT,
  score REAL, recommended_mode TEXT, recommended_track TEXT, chosen_track TEXT, justification TEXT,
  approved_by TEXT, created_at TEXT);

CREATE TABLE IF NOT EXISTS vertical_activations (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, vertical TEXT NOT NULL, version INTEGER, validation TEXT,
  activation_order INTEGER, status TEXT, activated_at TEXT);

CREATE TABLE IF NOT EXISTS business_rules (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, code TEXT, step_ref TEXT, mp_id TEXT, condition TEXT, action_code TEXT,
  action TEXT, rule_type TEXT, severity TEXT, owner_role TEXT, obs_node TEXT, active INTEGER DEFAULT 1, created_at TEXT);

CREATE TABLE IF NOT EXISTS controls (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, code TEXT, name TEXT, description TEXT, type TEXT, coso TEXT,
  frequency TEXT, owner_role TEXT, effectiveness TEXT, standard TEXT, step_refs TEXT, mp_id TEXT, obs_node TEXT, created_at TEXT);

CREATE TABLE IF NOT EXISTS risks (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, project_id TEXT REFERENCES projects(id) ON DELETE CASCADE, code TEXT,
  kind TEXT DEFAULT 'Risk', title TEXT, category TEXT, likelihood INTEGER, impact INTEGER, score INTEGER,
  residual INTEGER, owner_role TEXT, status TEXT, controls TEXT, mp_id TEXT, treatment TEXT, kri TEXT, obs_node TEXT, created_at TEXT);
CREATE INDEX IF NOT EXISTS ix_risks_proj ON risks(project_id);

CREATE TABLE IF NOT EXISTS racsi_activities (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, project_id TEXT, e2e_id TEXT, mp_id TEXT, step_ref TEXT,
  linked_type TEXT, linked_id TEXT, name TEXT, created_at TEXT);

CREATE TABLE IF NOT EXISTS racsi_assignments (
  id TEXT PRIMARY KEY, activity_id TEXT NOT NULL REFERENCES racsi_activities(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL, letter TEXT NOT NULL CHECK (letter IN ('R','A','C','S','I')), assignee TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS ux_racsi_one_accountable ON racsi_assignments(activity_id) WHERE letter = 'A';

CREATE TABLE IF NOT EXISTS kpis (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  code TEXT, name TEXT, formula TEXT, unit TEXT, target REAL, target_text TEXT, direction TEXT,
  frequency TEXT, analysis_frequency TEXT, mp_id TEXT, owner_role TEXT, custom INTEGER DEFAULT 0, racsi TEXT,
  source TEXT, created_at TEXT);
CREATE INDEX IF NOT EXISTS ix_kpis_proj ON kpis(project_id);

CREATE TABLE IF NOT EXISTS kpi_values (
  kpi_id TEXT NOT NULL REFERENCES kpis(id) ON DELETE CASCADE, org_id TEXT NOT NULL, period TEXT NOT NULL,
  value REAL, comment TEXT, PRIMARY KEY (kpi_id, period));

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, project_id TEXT, type TEXT NOT NULL, severity TEXT, title TEXT,
  entity_type TEXT, entity_id TEXT, period TEXT, escalation TEXT, step_ref TEXT, created_at TEXT,
  read_at TEXT, dismissed INTEGER DEFAULT 0);
CREATE UNIQUE INDEX IF NOT EXISTS ux_alert_dedupe ON alerts(org_id, type, entity_id, period);
CREATE INDEX IF NOT EXISTS ix_alerts_org ON alerts(org_id, dismissed);

CREATE TABLE IF NOT EXISTS alert_settings (org_id TEXT NOT NULL, type TEXT NOT NULL, enabled INTEGER DEFAULT 1, PRIMARY KEY (org_id, type));

CREATE TABLE IF NOT EXISTS ncs (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, project_id TEXT REFERENCES projects(id) ON DELETE CASCADE, code TEXT,
  title TEXT, description TEXT, source TEXT, category TEXT, criticality TEXT, status TEXT, stage TEXT,
  detected_at TEXT, due_date TEXT, closed_at TEXT, mp_id TEXT, owner_user TEXT, root_cause TEXT, cost REAL, created_at TEXT);
CREATE INDEX IF NOT EXISTS ix_ncs_proj ON ncs(project_id);

CREATE TABLE IF NOT EXISTS actions (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  source_type TEXT, source_id TEXT, kind TEXT, title TEXT, owner_user TEXT, evaluator_user TEXT, status TEXT,
  start_date TEXT, due_date TEXT, done_at TEXT, pct INTEGER DEFAULT 0, effectiveness TEXT, verdict TEXT,
  predecessors TEXT, created_at TEXT,
  CHECK (owner_user IS NULL OR evaluator_user IS NULL OR owner_user <> evaluator_user));
CREATE INDEX IF NOT EXISTS ix_actions_proj ON actions(project_id);

CREATE TABLE IF NOT EXISTS audits (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, project_id TEXT REFERENCES projects(id) ON DELETE CASCADE, code TEXT,
  title TEXT, type TEXT, standard TEXT, planned_date TEXT, done_date TEXT, status TEXT, lead_user TEXT, scope TEXT, created_at TEXT);

CREATE TABLE IF NOT EXISTS findings (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, audit_id TEXT NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  type TEXT, clause TEXT, text TEXT, status TEXT, action_id TEXT, mp_id TEXT);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, project_id TEXT REFERENCES projects(id) ON DELETE CASCADE, code TEXT,
  title TEXT, doc_type TEXT, template_id TEXT, standards TEXT, scope_type TEXT, current_version TEXT, status TEXT,
  owner_role TEXT, review_frequency TEXT, next_review TEXT, mp_id TEXT, created_at TEXT);

CREATE TABLE IF NOT EXISTS document_versions (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version TEXT, status TEXT, change_type TEXT, summary TEXT, content TEXT, author TEXT, approver TEXT,
  approved_at TEXT, formats TEXT, created_at TEXT);

CREATE TABLE IF NOT EXISTS registers (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  register TEXT NOT NULL, code TEXT, title TEXT, data TEXT, status TEXT, mp_id TEXT, created_at TEXT);
CREATE INDEX IF NOT EXISTS ix_reg_proj ON registers(project_id, register);

CREATE TABLE IF NOT EXISTS rex (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, project_id TEXT, source_type TEXT, source_id TEXT,
  went_well TEXT, not_well TEXT, root_cause TEXT, recommendation TEXT, category TEXT, rating INTEGER,
  mp_id TEXT, obs_node TEXT, created_by TEXT, created_at TEXT, version INTEGER DEFAULT 1);

CREATE TABLE IF NOT EXISTS ai_usecases (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, code TEXT, name TEXT, tier TEXT, module TEXT, trigger_ TEXT,
  expected_output TEXT, checkpoint TEXT, prompt TEXT, task_type TEXT, risk_level TEXT, linked_step TEXT,
  linked_mp TEXT, custom INTEGER DEFAULT 0, active INTEGER DEFAULT 1, approval TEXT, version INTEGER DEFAULT 1, created_at TEXT);

CREATE TABLE IF NOT EXISTS ai_project_overrides (
  usecase_id TEXT NOT NULL REFERENCES ai_usecases(id) ON DELETE CASCADE, project_id TEXT NOT NULL, org_id TEXT NOT NULL,
  state TEXT NOT NULL, PRIMARY KEY (usecase_id, project_id));

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, project_id TEXT, usecase_id TEXT, record_type TEXT, record_id TEXT,
  user_id TEXT, outcome TEXT, confidence REAL, source TEXT, created_at TEXT);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY, org_id TEXT, user_id TEXT, entity_type TEXT, entity_id TEXT, action TEXT,
  before_ TEXT, after_ TEXT, justification TEXT, at TEXT);
CREATE INDEX IF NOT EXISTS ix_audit_org ON audit_log(org_id, at);

CREATE TABLE IF NOT EXISTS entity_versions (
  id TEXT PRIMARY KEY, org_id TEXT, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, version INTEGER NOT NULL,
  data TEXT NOT NULL, user_id TEXT, justification TEXT, at TEXT, is_current INTEGER DEFAULT 0);
CREATE INDEX IF NOT EXISTS ix_ver_entity ON entity_versions(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS dispatches (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, user_id TEXT, alert_id TEXT, category TEXT, subject TEXT,
  channel TEXT, status TEXT, attempts INTEGER DEFAULT 0, at TEXT);

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, entity_type TEXT, entity_id TEXT, filename TEXT, mime TEXT,
  size INTEGER, path TEXT, author TEXT, at TEXT);

CREATE TABLE IF NOT EXISTS wbs_nodes (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  parent_id TEXT, name TEXT, action_ids TEXT, start_date TEXT, end_date TEXT, pct INTEGER, predecessors TEXT, seq INTEGER);

CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, code TEXT NOT NULL, enabled INTEGER DEFAULT 0, config TEXT,
  credential_ref TEXT, health TEXT, checked_at TEXT, mapping TEXT);

CREATE TABLE IF NOT EXISTS integration_log (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, integration_id TEXT, direction TEXT, record TEXT, result TEXT, at TEXT);

CREATE TABLE IF NOT EXISTS onboarding_plans (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, steps TEXT, target_days INTEGER, started_at TEXT, status TEXT, metrics TEXT);
CREATE TABLE IF NOT EXISTS bpmn_diagrams (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, mp_id TEXT NOT NULL, name TEXT, xml TEXT NOT NULL, version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Draft', updated_by TEXT, updated_at TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS ux_bpmn_org_mp ON bpmn_diagrams(org_id, mp_id);

CREATE TABLE IF NOT EXISTS doc_templates (
  id TEXT PRIMARY KEY, org_id TEXT, code TEXT NOT NULL, name TEXT NOT NULL, description TEXT, category TEXT,
  doc_type TEXT, formats TEXT, toc INTEGER DEFAULT 1, ms TEXT, mp_id TEXT, review TEXT, owner_role TEXT,
  mandatory TEXT, clauses TEXT, sections TEXT NOT NULL, base_code TEXT, version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Published', created_by TEXT, created_at TEXT, updated_at TEXT);
CREATE INDEX IF NOT EXISTS ix_doctpl_org ON doc_templates(org_id, code);

CREATE TABLE IF NOT EXISTS mp_readiness (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE, org_id TEXT NOT NULL, mp_id TEXT NOT NULL,
  items TEXT NOT NULL, updated_by TEXT, updated_at TEXT, PRIMARY KEY (project_id, mp_id));
`;

// Columns added after the first release are declared here so existing databases upgrade in place.
export const ADDITIVE_COLUMNS = {
  organizations: { logo_text: 'TEXT' },
  projects: { progress_cache: 'INTEGER' },
  documents: { target: 'TEXT', source_step: 'TEXT', updated_at: 'TEXT' },
  attachments: { version: 'INTEGER DEFAULT 1', group_id: 'TEXT', note: 'TEXT' },
  ai_usecases: { model: 'TEXT' },
  audits: { frequency: 'TEXT', frequency_custom: 'TEXT', criteria: 'TEXT', objectives: 'TEXT', team: 'TEXT', auditees: 'TEXT', method: 'TEXT', duration_h: 'REAL', processes: 'TEXT' },
  findings: { code: 'TEXT', requirement: 'TEXT', evidence: 'TEXT', area: 'TEXT', auditee: 'TEXT', due_date: 'TEXT', correction: 'TEXT', root_cause: 'TEXT', verification: 'TEXT', verified_at: 'TEXT' },
};
