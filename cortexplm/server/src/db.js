// Persistence layer: Node's built-in SQLite (no native build toolchain, no external DB server).
// Every statement is parameterised; no query is built by concatenating untrusted input.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

let db;

export function openDb(file = config.dbPath) {
  if (db) return db;
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  migrate(db);
  upgrade(db);
  return db;
}

export function closeDb() {
  if (db) { db.close(); db = undefined; }
}

export const q = {
  all: (sql, ...p) => openDb().prepare(sql).all(...p),
  get: (sql, ...p) => openDb().prepare(sql).get(...p),
  run: (sql, ...p) => openDb().prepare(sql).run(...p),
  insert: (table, obj) => {
    const keys = Object.keys(obj);
    const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`;
    return Number(openDb().prepare(sql).run(...keys.map((k) => norm(obj[k]))).lastInsertRowid);
  },
  update: (table, id, obj, idCol = 'id') => {
    const keys = Object.keys(obj);
    if (!keys.length) return;
    const sql = `UPDATE ${table} SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE ${idCol} = ?`;
    openDb().prepare(sql).run(...keys.map((k) => norm(obj[k])), id);
  },
  tx: (fn) => {
    const d = openDb();
    d.exec('BEGIN');
    try { const r = fn(); d.exec('COMMIT'); return r; } catch (e) { d.exec('ROLLBACK'); throw e; }
  },
};

function norm(v) {
  if (v === undefined) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v !== null && typeof v === 'object') return JSON.stringify(v);
  return v;
}

export const json = (s, fallback = null) => { try { return s ? JSON.parse(s) : fallback; } catch { return fallback; } };

// Additive upgrades for databases created by an earlier version.
function upgrade(d) {
  const cols = (t) => d.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
  if (!cols('obs_nodes').includes('project_id')) d.exec('ALTER TABLE obs_nodes ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE'); // FR-DA-TEN-04 per-project OBS
}

function migrate(d) {
  d.exec(`
  CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);

  -- Tenancy & hierarchy -----------------------------------------------------
  CREATE TABLE IF NOT EXISTS groups_ (id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY, uid TEXT UNIQUE NOT NULL, group_id INTEGER REFERENCES groups_(id) ON DELETE SET NULL,
    name TEXT NOT NULL, industry TEXT NOT NULL, country TEXT, default_language TEXT DEFAULT 'en',
    profile TEXT, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS obs_nodes (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES obs_nodes(id) ON DELETE SET NULL, name TEXT NOT NULL, type TEXT DEFAULT 'Department');

  -- People placed in an OBS node with the role they play there (project teams, departments).
  CREATE TABLE IF NOT EXISTS obs_members (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    obs_node_id INTEGER NOT NULL REFERENCES obs_nodes(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id TEXT, project_role TEXT, UNIQUE(obs_node_id, user_id));

  -- Identity & RBAC -----------------------------------------------------------
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY, org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL, email TEXT UNIQUE NOT NULL COLLATE NOCASE, password_hash TEXT NOT NULL,
    language TEXT, is_platform_admin INTEGER DEFAULT 0, obs_node_id INTEGER REFERENCES obs_nodes(id) ON DELETE SET NULL,
    title TEXT, active INTEGER DEFAULT 1, prefs TEXT, created_at TEXT DEFAULT (datetime('now')), last_login TEXT);
  CREATE TABLE IF NOT EXISTS roles (id TEXT PRIMARY KEY, name TEXT NOT NULL, baseline_class TEXT NOT NULL, description TEXT);
  CREATE TABLE IF NOT EXISTS user_roles (user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, role_id TEXT REFERENCES roles(id), PRIMARY KEY(user_id, role_id));
  CREATE TABLE IF NOT EXISTS permissions (code TEXT PRIMARY KEY, module TEXT NOT NULL, description TEXT);
  CREATE TABLE IF NOT EXISTS role_permissions (role_id TEXT REFERENCES roles(id) ON DELETE CASCADE, permission_code TEXT REFERENCES permissions(code) ON DELETE CASCADE, PRIMARY KEY(role_id, permission_code));

  -- Configuration management / licensing ---------------------------------------
  CREATE TABLE IF NOT EXISTS org_config (
    org_id INTEGER PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id TEXT NOT NULL, deployment_option TEXT DEFAULT 'SaaS (shared)', support_tier TEXT DEFAULT 'Standard',
    seats INTEGER DEFAULT 25, billing_cycle TEXT DEFAULT 'Monthly', expiry_date TEXT, issue_date TEXT,
    signature TEXT, updated_at TEXT);
  CREATE TABLE IF NOT EXISTS org_addons (org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE, addon_id TEXT, activated_at TEXT DEFAULT (datetime('now')), PRIMARY KEY(org_id, addon_id));
  CREATE TABLE IF NOT EXISTS org_compliance (org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE, standard_id TEXT, activated_at TEXT DEFAULT (datetime('now')), disclosure_ack_by INTEGER, PRIMARY KEY(org_id, standard_id));
  CREATE TABLE IF NOT EXISTS governance_settings (org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE, key TEXT, value TEXT, PRIMARY KEY(org_id, key));

  -- Innovation projects (principal record) ---------------------------------------
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL, name TEXT NOT NULL, description TEXT, offer_type TEXT DEFAULT 'Product',
    track TEXT NOT NULL, recommended_track TEXT, scores TEXT, score_total INTEGER, safety_critical INTEGER DEFAULT 0,
    track_override_reason TEXT, status TEXT NOT NULL DEFAULT 'Active', current_gate TEXT, current_e2e TEXT,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL, sponsor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    obs_node_id INTEGER REFERENCES obs_nodes(id) ON DELETE SET NULL, template_id INTEGER,
    planned_launch_date TEXT, actual_launch_date TEXT, budget REAL, npv REAL, roi REAL, payback_years REAL,
    strategic_fit INTEGER, region TEXT, parent_product TEXT,
    created_at TEXT DEFAULT (datetime('now')), closed_at TEXT, hold_until TEXT,
    UNIQUE(org_id, code));
  CREATE TABLE IF NOT EXISTS project_mps (
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE, mp_id TEXT, state TEXT NOT NULL,
    justification TEXT, approved_by INTEGER, PRIMARY KEY(project_id, mp_id));
  CREATE TABLE IF NOT EXISTS e2e_runs (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE, e2e_id TEXT NOT NULL, run_no INTEGER DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'In progress', branch TEXT, trigger_note TEXT, scheduled_start TEXT,
    started_at TEXT, completed_at TEXT);
  CREATE TABLE IF NOT EXISTS run_tasks (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    run_id INTEGER NOT NULL REFERENCES e2e_runs(id) ON DELETE CASCADE, project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    uft_id TEXT NOT NULL, seq INTEGER, name TEXT NOT NULL, kind TEXT DEFAULT 'work',
    status TEXT NOT NULL DEFAULT 'To do', owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    evaluator_id INTEGER REFERENCES users(id) ON DELETE SET NULL, planned_start TEXT, due_date TEXT,
    started_at TEXT, completed_at TEXT, pct INTEGER DEFAULT 0, data TEXT, output TEXT, skip_reason TEXT,
    evaluation TEXT, evaluated_at TEXT, light_form INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS gate_reviews (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    run_id INTEGER NOT NULL REFERENCES e2e_runs(id) ON DELETE CASCADE, project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    gate TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Open', submitted_at TEXT, submitted_by INTEGER,
    decided_at TEXT, decided_by INTEGER, decision TEXT, rationale TEXT, hold_until TEXT, recycle_tasks TEXT,
    next_path TEXT, votes TEXT, cycle INTEGER DEFAULT 1);
  CREATE TABLE IF NOT EXISTS checklist_items (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    gate_review_id INTEGER NOT NULL REFERENCES gate_reviews(id) ON DELETE CASCADE, seq INTEGER, text TEXT NOT NULL,
    source TEXT, mandatory INTEGER DEFAULT 1, evidence_required INTEGER DEFAULT 1, status TEXT NOT NULL DEFAULT 'Open',
    evidence TEXT, waiver_reason TEXT, waiver_approved_by INTEGER, completed_by INTEGER, completed_at TEXT);
  -- Checklist template library: one or more templates per gate and track. A template "linked" to its gate
  -- (auto_apply = 1) is copied into the gate checklist when the gate opens; others are added on demand.
  CREATE TABLE IF NOT EXISTS checklist_templates (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL, track TEXT NOT NULL, gate TEXT NOT NULL, description TEXT, items TEXT NOT NULL,
    auto_apply INTEGER DEFAULT 0, created_by INTEGER, updated_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS evidence_files (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type TEXT, entity_id INTEGER, filename TEXT, stored_name TEXT, mime TEXT, size INTEGER,
    uploaded_by INTEGER, uploaded_at TEXT DEFAULT (datetime('now')));

  -- Governance registers -------------------------------------------------------
  CREATE TABLE IF NOT EXISTS business_rules (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code TEXT, triggering_step TEXT, condition TEXT NOT NULL, action_id TEXT, action TEXT, rule_type TEXT,
    severity TEXT DEFAULT 'Medium', owner TEXT, obs_node_id INTEGER REFERENCES obs_nodes(id) ON DELETE SET NULL,
    process_tag TEXT, evaluation TEXT DEFAULT 'Catalog', active INTEGER DEFAULT 1);
  CREATE TABLE IF NOT EXISTS controls (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code TEXT, name TEXT NOT NULL, control_type TEXT, coso_component TEXT NOT NULL, testing_frequency TEXT,
    owner TEXT, effectiveness TEXT DEFAULT 'Effective', linked_steps TEXT, description TEXT, standard_tag TEXT,
    obs_node_id INTEGER REFERENCES obs_nodes(id) ON DELETE SET NULL, process_tag TEXT);
  CREATE TABLE IF NOT EXISTS risks (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code TEXT, name TEXT NOT NULL, kind TEXT DEFAULT 'Risk', category TEXT, likelihood INTEGER NOT NULL, impact INTEGER NOT NULL,
    residual_score INTEGER, mitigating_controls TEXT, kri_formula TEXT, owner TEXT, status TEXT DEFAULT 'Open',
    obs_node_id INTEGER REFERENCES obs_nodes(id) ON DELETE SET NULL, process_tag TEXT, project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS kpi_values (id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, kpi_id TEXT, period TEXT, value REAL);
  CREATE TABLE IF NOT EXISTS custom_kpis (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL, formula TEXT, target TEXT, unit TEXT, current_value REAL, owner TEXT, process_tag TEXT);
  CREATE TABLE IF NOT EXISTS racsi_activities (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL, process_tag TEXT, linked_type TEXT, linked_id TEXT, obs_node_id INTEGER REFERENCES obs_nodes(id) ON DELETE SET NULL);
  CREATE TABLE IF NOT EXISTS racsi_assignments (
    id INTEGER PRIMARY KEY, activity_id INTEGER NOT NULL REFERENCES racsi_activities(id) ON DELETE CASCADE,
    letter TEXT NOT NULL CHECK (letter IN ('R','A','C','S','I')), assignee_type TEXT DEFAULT 'role', assignee TEXT NOT NULL);
  CREATE UNIQUE INDEX IF NOT EXISTS one_accountable ON racsi_assignments(activity_id) WHERE letter = 'A';
  CREATE TABLE IF NOT EXISTS bpmn_diagrams (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL, description TEXT, xml TEXT NOT NULL, e2e_id TEXT, obs_node_id INTEGER REFERENCES obs_nodes(id) ON DELETE SET NULL,
    updated_by INTEGER, updated_at TEXT DEFAULT (datetime('now')));

  -- Alerts & communication -----------------------------------------------------
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL, severity TEXT, entity_type TEXT, entity_id INTEGER, project_id INTEGER,
    message TEXT, period_key TEXT, created_at TEXT DEFAULT (datetime('now')), resolved_at TEXT,
    UNIQUE(org_id, type, entity_type, entity_id, period_key));
  CREATE TABLE IF NOT EXISTS alert_reads (alert_id INTEGER REFERENCES alerts(id) ON DELETE CASCADE, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, read_at TEXT, dismissed INTEGER DEFAULT 0, PRIMARY KEY(alert_id, user_id));
  CREATE TABLE IF NOT EXISTS alert_settings (org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE, alert_type TEXT, enabled INTEGER DEFAULT 1, PRIMARY KEY(org_id, alert_type));
  CREATE TABLE IF NOT EXISTS notification_prefs (user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, category TEXT, channel TEXT, enabled INTEGER, PRIMARY KEY(user_id, category, channel));
  CREATE TABLE IF NOT EXISTS dispatches (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, category TEXT, subject TEXT, body TEXT, lang TEXT,
    entity_type TEXT, entity_id INTEGER, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY, dispatch_id INTEGER NOT NULL REFERENCES dispatches(id) ON DELETE CASCADE, channel TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued', attempts INTEGER DEFAULT 0, last_error TEXT, next_attempt_at TEXT, updated_at TEXT DEFAULT (datetime('now')), read_at TEXT);
  CREATE TABLE IF NOT EXISTS webhook_endpoints (id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, user_id INTEGER, url TEXT NOT NULL, secret_enc TEXT, active INTEGER DEFAULT 1);

  -- Audit, versions ------------------------------------------------------------
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY, org_id INTEGER, user_id INTEGER, user_name TEXT, entity_type TEXT, entity_id TEXT,
    action TEXT, field TEXT, before_value TEXT, after_value TEXT, justification TEXT, created_at TEXT DEFAULT (datetime('now')));
  CREATE INDEX IF NOT EXISTS audit_org ON audit_log(org_id, created_at);
  CREATE TABLE IF NOT EXISTS entity_versions (
    id INTEGER PRIMARY KEY, org_id INTEGER, entity_type TEXT NOT NULL, entity_id INTEGER NOT NULL, version INTEGER NOT NULL,
    data TEXT NOT NULL, user_id INTEGER, user_name TEXT, justification TEXT, is_current INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')), UNIQUE(entity_type, entity_id, version));

  -- AI governance, knowledge, REX ------------------------------------------------
  CREATE TABLE IF NOT EXISTS ai_use_cases (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL, name TEXT NOT NULL, linked_step TEXT, model_task_type TEXT, tier TEXT NOT NULL,
    risk_level TEXT, human_checkpoint TEXT, activation_scope TEXT, is_custom INTEGER DEFAULT 0, based_on TEXT,
    approval_status TEXT, module TEXT, trigger_text TEXT, expected_output TEXT, prompt_template TEXT,
    active INTEGER DEFAULT 1, UNIQUE(org_id, code));
  CREATE TABLE IF NOT EXISTS ai_project_overrides (project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE, use_case_id INTEGER REFERENCES ai_use_cases(id) ON DELETE CASCADE, state TEXT NOT NULL, PRIMARY KEY(project_id, use_case_id));
  CREATE TABLE IF NOT EXISTS ai_suggestions (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    use_case_id INTEGER, project_id INTEGER, record_type TEXT, record_id INTEGER, output TEXT, refs TEXT,
    source TEXT, confidence REAL, user_id INTEGER, created_at TEXT DEFAULT (datetime('now')), approved INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS ai_usage_log (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL, suggestion_id INTEGER, use_case_code TEXT, project_id INTEGER,
    record_type TEXT, record_id INTEGER, user_id INTEGER, outcome TEXT NOT NULL, source TEXT, confidence REAL,
    created_at TEXT DEFAULT (datetime('now')));
  CREATE TRIGGER IF NOT EXISTS ai_usage_log_no_update BEFORE UPDATE ON ai_usage_log BEGIN SELECT RAISE(ABORT, 'AI usage log is append-only'); END;
  CREATE TRIGGER IF NOT EXISTS ai_usage_log_no_delete BEFORE DELETE ON ai_usage_log WHEN (SELECT value FROM meta WHERE key='allow_log_purge') IS NULL BEGIN SELECT RAISE(ABORT, 'AI usage log is append-only'); END;
  CREATE TABLE IF NOT EXISTS knowledge_docs (
    id INTEGER PRIMARY KEY, org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    kind TEXT NOT NULL, ref TEXT, title TEXT NOT NULL, body TEXT NOT NULL, lang TEXT DEFAULT 'en', tags TEXT);
  CREATE TABLE IF NOT EXISTS rex_entries (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL, task_id INTEGER REFERENCES run_tasks(id) ON DELETE SET NULL,
    title TEXT, went_well TEXT, went_wrong TEXT, root_cause TEXT, recommendation TEXT, category TEXT, rating INTEGER,
    obs_node_id INTEGER REFERENCES obs_nodes(id) ON DELETE SET NULL, process_tag TEXT, created_by INTEGER, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    kind TEXT DEFAULT 'Project', name TEXT NOT NULL, description TEXT, payload TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now')));

  -- Planning -------------------------------------------------------------------
  CREATE TABLE IF NOT EXISTS wbs (id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL, created_by INTEGER, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS wbs_nodes (
    id INTEGER PRIMARY KEY, wbs_id INTEGER NOT NULL REFERENCES wbs(id) ON DELETE CASCADE, parent_id INTEGER REFERENCES wbs_nodes(id) ON DELETE CASCADE,
    seq INTEGER DEFAULT 0, name TEXT NOT NULL, task_id INTEGER REFERENCES run_tasks(id) ON DELETE SET NULL,
    planned_start TEXT, planned_end TEXT, pct INTEGER, predecessors TEXT);

  -- External integrations ------------------------------------------------------
  CREATE TABLE IF NOT EXISTS integrations (
    id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    catalog_id TEXT NOT NULL, name TEXT NOT NULL, endpoint TEXT, enabled INTEGER DEFAULT 0, credentials_enc TEXT,
    inbound_secret_enc TEXT, health_status TEXT DEFAULT 'Not checked', health_checked_at TEXT, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS integration_mappings (id INTEGER PRIMARY KEY, integration_id INTEGER NOT NULL REFERENCES integrations(id) ON DELETE CASCADE, external_field TEXT, internal_entity TEXT, internal_field TEXT);
  CREATE TABLE IF NOT EXISTS integration_log (id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL, integration_id INTEGER REFERENCES integrations(id) ON DELETE CASCADE, direction TEXT, record TEXT, result TEXT, created_at TEXT DEFAULT (datetime('now')));
  `);
}
