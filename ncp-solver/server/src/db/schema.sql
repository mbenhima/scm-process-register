-- NCP Solver relational schema (SQLite)
-- Naming: snake_case tables/columns. All IDs are TEXT UUIDs.

PRAGMA foreign_keys = ON;

-- =========================================================================
-- HIERARCHY: Group (optional) -> Organization (tenant) -> Project (optional)
-- =========================================================================
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_fr TEXT,
  name_ar TEXT,
  description TEXT,
  sector TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_fr TEXT,
  name_ar TEXT,
  sector TEXT NOT NULL,           -- public_infrastructure | manufacturing | agro_business | real_estate | other
  sector_type TEXT NOT NULL DEFAULT 'private', -- public | private
  country TEXT,
  logo_color TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_fr TEXT,
  name_ar TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active | closed | on_hold
  start_date TEXT,
  end_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- OBS: Organizational Breakdown Structure (sites / departments / services / teams)
CREATE TABLE IF NOT EXISTS obs_nodes (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES obs_nodes(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL, -- site | department | service | team
  name TEXT NOT NULL,
  name_fr TEXT,
  name_ar TEXT,
  code TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =========================================================================
-- IDENTITY & RBAC
-- =========================================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  language_preference TEXT NOT NULL DEFAULT 'en', -- en | fr | ar
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(organization_id, email)
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE, -- NULL = global system role template
  code TEXT NOT NULL, -- admin | quality_manager | ci_pilot | ncp_team_member | action_owner | evaluator | department_head | reporter | auditor
  name TEXT NOT NULL,
  name_fr TEXT,
  name_ar TEXT,
  description TEXT,
  is_system_role INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,   -- e.g. fiche.create, fiche.edit, fiche.close, useCase.delete
  module TEXT NOT NULL,        -- fiche | action | rex | standard | user | role | hierarchy | obs | license | governance | aiUseCase | report | alert
  action TEXT NOT NULL,        -- view | create | edit | delete | validate | close | manage
  description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  obs_node_id TEXT REFERENCES obs_nodes(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =========================================================================
-- LICENSE & PLAN (SaaS / OnPrem)
-- =========================================================================
CREATE TABLE IF NOT EXISTS licenses (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  plan_tier TEXT NOT NULL DEFAULT 'professional', -- starter | professional | enterprise
  deployment_model TEXT NOT NULL DEFAULT 'saas',  -- saas | onprem
  seats_total INTEGER NOT NULL DEFAULT 25,
  seats_used INTEGER NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'annual', -- monthly | annual
  renewal_date TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active | trial | suspended | expired
  onprem_server_region TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =========================================================================
-- GOVERNANCE SETTINGS
-- =========================================================================
CREATE TABLE IF NOT EXISTS governance_settings (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  default_language TEXT NOT NULL DEFAULT 'en',
  supported_languages TEXT NOT NULL DEFAULT 'en,fr,ar',
  rca_default_method TEXT NOT NULL DEFAULT '5_why', -- 5_why | ishikawa
  require_rex_before_close INTEGER NOT NULL DEFAULT 1,
  kpi_thresholds_json TEXT, -- JSON blob: { kpi1: 100, kpi2: 85, ... }
  alert_config_json TEXT,   -- JSON blob: { A: true, B: true, ... }
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =========================================================================
-- NCP DOMAIN
-- =========================================================================
CREATE TABLE IF NOT EXISTS standards (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  version TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  effective_date TEXT,
  document_link TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ncp_fiches (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  fiche_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  detector_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  detection_date TEXT NOT NULL,
  obs_node_id TEXT REFERENCES obs_nodes(id) ON DELETE SET NULL,
  criticality TEXT NOT NULL DEFAULT 'medium', -- high | medium | low
  priority INTEGER NOT NULL DEFAULT 3,        -- 1 urgent | 2 high | 3 standard
  frequency TEXT,                             -- first_time | recurring
  target_objective TEXT,
  applicable_standards TEXT,                  -- comma separated standard ids
  current_stage TEXT NOT NULL DEFAULT 'S1',   -- S1..S7
  status TEXT NOT NULL DEFAULT 'open',        -- open | in_progress | closed | cancelled
  closure_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(organization_id, fiche_number)
);

CREATE TABLE IF NOT EXISTS ncp_team_assignments (
  id TEXT PRIMARY KEY,
  fiche_id TEXT NOT NULL REFERENCES ncp_fiches(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  assigned_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS problem_understanding (
  id TEXT PRIMARY KEY,
  fiche_id TEXT NOT NULL UNIQUE REFERENCES ncp_fiches(id) ON DELETE CASCADE,
  what TEXT, who_detected TEXT, where_ TEXT, when_ TEXT,
  how_detected TEXT, why_problem TEXT, how_much TEXT,
  frequency_analysis TEXT, objectives TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS root_causes (
  id TEXT PRIMARY KEY,
  fiche_id TEXT NOT NULL REFERENCES ncp_fiches(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  cause_category TEXT, -- man | machine | method | material | measurement | milieu
  rca_method_used TEXT DEFAULT '5_why',
  validated_at TEXT,
  validated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  standard_id TEXT REFERENCES standards(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS actions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  fiche_id TEXT NOT NULL REFERENCES ncp_fiches(id) ON DELETE CASCADE,
  action_number TEXT NOT NULL,
  action_type TEXT NOT NULL, -- immediate | corrective
  root_cause_id TEXT REFERENCES root_causes(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  tasks TEXT,
  required_means TEXT,
  responsible_owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  planned_completion_date TEXT,
  status TEXT NOT NULL DEFAULT 'to_do', -- to_do | in_progress | done | cancelled
  actual_completion_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(organization_id, action_number)
);

CREATE TABLE IF NOT EXISTS action_evaluations (
  id TEXT PRIMARY KEY,
  action_id TEXT NOT NULL UNIQUE REFERENCES actions(id) ON DELETE CASCADE,
  evaluator_owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  planned_review_date TEXT,
  actual_review_date TEXT,
  efficiency_criteria TEXT,
  measurement_method TEXT,
  review_result TEXT, -- effective | not_effective | pending
  review_comments TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS action_evidence (
  id TEXT PRIMARY KEY,
  action_id TEXT NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  uploaded_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
  evidence_type TEXT -- execution_proof | evaluation_proof
);

CREATE TABLE IF NOT EXISTS rex_entries (
  id TEXT PRIMARY KEY,
  fiche_id TEXT NOT NULL UNIQUE REFERENCES ncp_fiches(id) ON DELETE CASCADE,
  lessons_learned TEXT,
  root_cause_summary TEXT,
  solution_summary TEXT,
  needs_standardization INTEGER NOT NULL DEFAULT 0,
  standardization_details TEXT,
  needs_generalization INTEGER NOT NULL DEFAULT 0,
  generalization_plan TEXT,
  tags TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notification_alerts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- A..J
  triggering_entity_id TEXT,
  target_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'in_app', -- in_app | email
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent', -- pending | sent | failed
  sent_at TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_agent_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  fiche_id TEXT REFERENCES ncp_fiches(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  prompt TEXT,
  context_json TEXT,
  response TEXT,
  confidence_score REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,       -- CREATE | UPDATE | DELETE
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =========================================================================
-- AI USE CASES LIBRARY (independent module, full CRUD via RBAC)
-- =========================================================================
CREATE TABLE IF NOT EXISTS ai_use_cases (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_fr TEXT,
  title_ar TEXT,
  description TEXT NOT NULL,
  sector TEXT,
  business_function TEXT, -- quality | maintenance | supply_chain | hr | finance | operations | customer_service
  ai_technique TEXT,      -- predictive_analytics | nlp | computer_vision | rag | optimization | anomaly_detection
  maturity_stage INTEGER NOT NULL DEFAULT 1, -- 1..5 (Red..DarkGreen scale)
  status TEXT NOT NULL DEFAULT 'idea', -- idea | pilot | production | retired
  owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  expected_impact TEXT,
  estimated_roi TEXT,
  tags TEXT,
  is_active INTEGER NOT NULL DEFAULT 1, -- toggle: 1 = active, 0 = deactivated (kept for history, hidden from active use)
  current_version_id TEXT, -- FK to ai_use_case_versions(id), set after first version is created
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Versioned, labeled content of an AI use case (definition/spec), independent of the
-- stable metadata above. Every save creates a new immutable version; "revert" duplicates
-- an old version's content into a brand-new version and re-points current_version_id at it,
-- so the full history is always preserved (never edited or deleted in place).
CREATE TABLE IF NOT EXISTS ai_use_case_versions (
  id TEXT PRIMARY KEY,
  use_case_id TEXT NOT NULL REFERENCES ai_use_cases(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  inputs TEXT,                 -- labeled section: data/inputs the use case consumes
  prompt TEXT,                 -- labeled section: prompt / instruction template
  expected_output TEXT,        -- labeled section: expected output / deliverable
  constraints_guardrails TEXT, -- labeled section: constraints, guardrails, human-in-the-loop notes
  model_technique_notes TEXT,  -- labeled section: model/technique implementation notes for this version
  change_note TEXT,            -- what changed vs. the previous version
  is_current INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(use_case_id, version_number)
);

-- =========================================================================
-- BUSINESS RULES (full CRUD via RBAC)
-- =========================================================================
CREATE TABLE IF NOT EXISTS business_rules (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL DEFAULT 'workflow', -- validation | workflow | approval | naming | threshold | escalation
  applies_to_module TEXT NOT NULL DEFAULT 'fiche', -- fiche | action | rootcause | rex | standard | general
  condition_text TEXT, -- "IF" — when the rule applies
  action_text TEXT,    -- "THEN" — what the system/process must do
  severity TEXT NOT NULL DEFAULT 'warning', -- blocking | warning | info
  owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  obs_node_id TEXT REFERENCES obs_nodes(id) ON DELETE SET NULL, -- owning org unit
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =========================================================================
-- CONTROLS (COSO Internal Control - Integrated Framework)
-- =========================================================================
CREATE TABLE IF NOT EXISTS controls (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  coso_component TEXT NOT NULL DEFAULT 'control_activities',
    -- control_environment | risk_assessment | control_activities | information_communication | monitoring_activities
  control_type TEXT NOT NULL DEFAULT 'preventive', -- preventive | detective | corrective
  frequency TEXT NOT NULL DEFAULT 'monthly', -- continuous | daily | weekly | monthly | quarterly | annual
  control_owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  effectiveness TEXT NOT NULL DEFAULT 'not_tested', -- effective | partially_effective | ineffective | not_tested
  last_tested_date TEXT,
  next_test_date TEXT,
  evidence_notes TEXT,
  obs_node_id TEXT REFERENCES obs_nodes(id) ON DELETE SET NULL, -- owning org unit
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =========================================================================
-- RISKS & OPPORTUNITIES
-- =========================================================================
CREATE TABLE IF NOT EXISTS risks_opportunities (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL DEFAULT 'risk', -- risk | opportunity
  category TEXT NOT NULL DEFAULT 'operational', -- strategic | operational | compliance | financial | reputational | technology
  likelihood INTEGER NOT NULL DEFAULT 3, -- 1-5
  impact INTEGER NOT NULL DEFAULT 3,     -- 1-5
  response_strategy TEXT, -- risk: avoid|reduce|transfer|accept — opportunity: exploit|enhance|share|ignore (free text/select)
  mitigation_plan TEXT,
  owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'identified', -- identified | assessing | mitigating | monitoring | closed
  residual_likelihood INTEGER,
  residual_impact INTEGER,
  target_date TEXT,
  related_fiche_id TEXT REFERENCES ncp_fiches(id) ON DELETE SET NULL,
  obs_node_id TEXT REFERENCES obs_nodes(id) ON DELETE SET NULL, -- owning org unit
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS risk_controls (
  risk_id TEXT NOT NULL REFERENCES risks_opportunities(id) ON DELETE CASCADE,
  control_id TEXT NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  PRIMARY KEY (risk_id, control_id)
);

-- =========================================================================
-- RACSI (Responsible / Accountable / Consulted / Support / Informed) matrix
-- Each activity is either a fixed NCP Solver process step (S1-S7) or a
-- governance item linked to a Business Rule, Control or Risk/Opportunity.
-- Assignees are drawn from OBS: either a role (org-wide accountability) or a
-- specific named person (a user). Exactly one Accountable (A) per activity;
-- Responsible/Consulted/Support/Informed accept multiple assignees.
-- =========================================================================
CREATE TABLE IF NOT EXISTS racsi_activities (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  module_ref TEXT NOT NULL DEFAULT 'general', -- ncp_process | business_rule | control | risk_opportunity | general
  linked_record_id TEXT, -- id in business_rules / controls / risks_opportunities, when module_ref points to one
  ncp_stage TEXT,        -- S1..S7, only when module_ref = 'ncp_process'
  obs_node_id TEXT REFERENCES obs_nodes(id) ON DELETE SET NULL, -- owning org unit (OBS)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(organization_id, code)
);

CREATE TABLE IF NOT EXISTS racsi_assignments (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL REFERENCES racsi_activities(id) ON DELETE CASCADE,
  racsi_type TEXT NOT NULL CHECK (racsi_type IN ('R', 'A', 'C', 'S', 'I')),
  role_id TEXT REFERENCES roles(id) ON DELETE CASCADE, -- assignee given by ROLE (from OBS/RBAC roles)
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE, -- assignee given by NAME (a specific person)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK ((role_id IS NOT NULL AND user_id IS NULL) OR (role_id IS NULL AND user_id IS NOT NULL))
);

-- Enforce exactly one Accountable (A) per activity; R/C/S/I may repeat freely.
CREATE UNIQUE INDEX IF NOT EXISTS idx_racsi_one_accountable ON racsi_assignments(activity_id) WHERE racsi_type = 'A';

-- =========================================================================
-- BPMN: process diagrams (BPMN 2.0 XML), full CRUD via RBAC. Seeded with the
-- NCP Solver process itself (S1-S7); editable in-app via a real BPMN modeler.
-- =========================================================================
CREATE TABLE IF NOT EXISTS bpmn_diagrams (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  xml TEXT NOT NULL, -- BPMN 2.0 XML (process + bpmndi diagram layout)
  obs_node_id TEXT REFERENCES obs_nodes(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(organization_id, code)
);

-- =========================================================================
-- LLM PROVIDER CONFIGURATION: which large-language-model backend the AI
-- Assistant / agents should call (one row per Organization). The API key is
-- never returned by the API (see routes/llmConfig.js) — only a redacted
-- last-4 and a boolean "configured" flag are exposed to the client.
-- =========================================================================
CREATE TABLE IF NOT EXISTS llm_configurations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'anthropic',
    -- anthropic | openai | google | azure_openai | aws_bedrock | mistral | cohere | meta_llama | ollama | custom
  model TEXT,               -- e.g. "claude-sonnet-5", "gpt-5", "gemini-2.5-pro" (free text; providers evolve)
  api_key TEXT,              -- stored as-is in this demo (no KMS available); see NFR-SEC in the SRS
  endpoint_url TEXT,         -- required for azure_openai / aws_bedrock / ollama / custom
  is_enabled INTEGER NOT NULL DEFAULT 0,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =========================================================================
-- Indices
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_fiches_org ON ncp_fiches(organization_id);
CREATE INDEX IF NOT EXISTS idx_actions_fiche ON actions(fiche_id);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_obs_org ON obs_nodes(organization_id);
CREATE INDEX IF NOT EXISTS idx_roots_fiche ON root_causes(fiche_id);
CREATE INDEX IF NOT EXISTS idx_alerts_org ON notification_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_usecases_org ON ai_use_cases(organization_id);
CREATE INDEX IF NOT EXISTS idx_usecase_versions_usecase ON ai_use_case_versions(use_case_id);
CREATE INDEX IF NOT EXISTS idx_business_rules_org ON business_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_controls_org ON controls(organization_id);
CREATE INDEX IF NOT EXISTS idx_risks_org ON risks_opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_racsi_activities_org ON racsi_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_racsi_assignments_activity ON racsi_assignments(activity_id);
CREATE INDEX IF NOT EXISTS idx_bpmn_org ON bpmn_diagrams(organization_id);
CREATE INDEX IF NOT EXISTS idx_business_rules_obs ON business_rules(obs_node_id);
CREATE INDEX IF NOT EXISTS idx_controls_obs ON controls(obs_node_id);
CREATE INDEX IF NOT EXISTS idx_risks_obs ON risks_opportunities(obs_node_id);
