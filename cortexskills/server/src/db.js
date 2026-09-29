import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';

export const db = new DatabaseSync(config.dbFile);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');

const stmtCache = new Map();
function prep(sql) {
  let s = stmtCache.get(sql);
  if (!s) { s = db.prepare(sql); stmtCache.set(sql, s); }
  return s;
}
/** All rows. Parameters are always bound, never concatenated (NFR-DA-SEC-04). */
export const all = (sql, ...p) => prep(sql).all(...p);
export const one = (sql, ...p) => prep(sql).get(...p);
export const run = (sql, ...p) => prep(sql).run(...p);
export function tx(fn) {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
}

// Additive schema (FR-DA-OPS-04): tables and columns are only ever added, never dropped.
const TABLES = {
  meta: `key TEXT PRIMARY KEY, value TEXT`,
  catalog: `kind TEXT NOT NULL, id TEXT NOT NULL, sort INTEGER DEFAULT 0, data TEXT NOT NULL, PRIMARY KEY (kind, id)`,
  groups_: `id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, benchmark_sharing INTEGER DEFAULT 1, created_at TEXT`,
  organizations: `id TEXT PRIMARY KEY, group_id TEXT REFERENCES groups_(id) ON DELETE SET NULL, name TEXT NOT NULL, sector TEXT, segment TEXT, employees INTEGER, sme_segment TEXT, country TEXT, city TEXT, default_language TEXT DEFAULT 'en', email_domain TEXT UNIQUE, benchmark_sharing INTEGER DEFAULT 1, created_at TEXT`,
  projects: `id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, focus TEXT, segment TEXT, mode TEXT, track TEXT, vertical_id TEXT, plan_year INTEGER, status TEXT DEFAULT 'Active', template_id TEXT, creation_mode TEXT, complexity REAL, progress REAL DEFAULT 0, start_date TEXT, end_date TEXT, obs_function TEXT, created_by TEXT, created_at TEXT, updated_at TEXT`,
  users: `id TEXT PRIMARY KEY, org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password_hash TEXT NOT NULL, language TEXT, title TEXT, is_platform INTEGER DEFAULT 0, active INTEGER DEFAULT 1, created_at TEXT, last_login TEXT`,
  roles: `id TEXT PRIMARY KEY, name TEXT NOT NULL, baseline TEXT, sort INTEGER`,
  user_roles: `user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, role_id TEXT NOT NULL, PRIMARY KEY (user_id, role_id)`,
  permissions: `code TEXT PRIMARY KEY, module TEXT, label TEXT, sort INTEGER`,
  role_permissions: `role_id TEXT NOT NULL, code TEXT NOT NULL, granted INTEGER NOT NULL, customized INTEGER DEFAULT 0, PRIMARY KEY (role_id, code)`,
  user_prefs: `user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, data TEXT NOT NULL`,
  org_config: `org_id TEXT PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE, pack_id TEXT NOT NULL, addons TEXT DEFAULT '[]', compliance TEXT DEFAULT '[]', deployment TEXT DEFAULT 'SaaS', support_tier TEXT DEFAULT 'Standard', seats INTEGER DEFAULT 100, currency TEXT DEFAULT 'USD', justification_required INTEGER DEFAULT 1, sme_mode INTEGER DEFAULT 0, updated_at TEXT`,
  licences: `org_id TEXT PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE, data TEXT NOT NULL, signature TEXT NOT NULL, updated_at TEXT`,
  obs_nodes: `id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, project_id TEXT REFERENCES projects(id) ON DELETE CASCADE, parent_id TEXT REFERENCES obs_nodes(id) ON DELETE SET NULL, name TEXT NOT NULL, type TEXT, created_at TEXT`,
  obs_members: `id TEXT PRIMARY KEY, node_id TEXT NOT NULL REFERENCES obs_nodes(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, role_id TEXT, node_role TEXT`,
  e2e_instances: `id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE, e2e_id TEXT NOT NULL, phase INTEGER, status TEXT, progress REAL DEFAULT 0, owner_id TEXT, started_at TEXT, completed_at TEXT, due_date TEXT, sort INTEGER`,
  task_instances: `id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE, e2e_instance_id TEXT NOT NULL REFERENCES e2e_instances(id) ON DELETE CASCADE, e2e_id TEXT, uft_id TEXT NOT NULL, sort INTEGER, status TEXT DEFAULT 'Not started', owner_id TEXT, evaluator_id TEXT, due_date TEXT, started_at TEXT, completed_at TEXT, guidance TEXT, output TEXT, steps TEXT, ai_used INTEGER DEFAULT 0, updated_at TEXT`,
  records: `id TEXT PRIMARY KEY, entity TEXT NOT NULL, org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE, project_id TEXT REFERENCES projects(id) ON DELETE CASCADE, ref TEXT, data TEXT NOT NULL, version INTEGER DEFAULT 1, created_by TEXT, created_at TEXT, updated_by TEXT, updated_at TEXT`,
  entity_versions: `id TEXT PRIMARY KEY, entity TEXT NOT NULL, record_id TEXT NOT NULL, org_id TEXT, version INTEGER NOT NULL, data TEXT NOT NULL, user_id TEXT, justification TEXT, is_current INTEGER DEFAULT 0, created_at TEXT`,
  racsi_activities: `id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, project_id TEXT, ref_type TEXT, ref_id TEXT, name TEXT, process_tag TEXT, obs_node_id TEXT, created_at TEXT`,
  racsi_assignments: `id TEXT PRIMARY KEY, activity_id TEXT NOT NULL REFERENCES racsi_activities(id) ON DELETE CASCADE, letter TEXT NOT NULL CHECK (letter IN ('R','A','C','S','I')), assignee TEXT NOT NULL, user_id TEXT`,
  kpi_values: `id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, project_id TEXT REFERENCES projects(id) ON DELETE CASCADE, kpi_id TEXT NOT NULL, period TEXT, value REAL, target REAL, direction TEXT, status TEXT`,
  alerts: `id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, project_id TEXT, type TEXT NOT NULL, entity_type TEXT, entity_id TEXT, severity TEXT, period TEXT, message TEXT, step_id TEXT, created_at TEXT`,
  alert_reads: `alert_id TEXT NOT NULL REFERENCES alerts(id) ON DELETE CASCADE, user_id TEXT NOT NULL, read_at TEXT, dismissed INTEGER DEFAULT 0, PRIMARY KEY (alert_id, user_id)`,
  alert_settings: `org_id TEXT NOT NULL, type TEXT NOT NULL, enabled INTEGER DEFAULT 1, PRIMARY KEY (org_id, type)`,
  dispatches: `id TEXT PRIMARY KEY, org_id TEXT, user_id TEXT, category TEXT, subject TEXT, body TEXT, lang TEXT, created_at TEXT`,
  delivery_status: `id TEXT PRIMARY KEY, dispatch_id TEXT NOT NULL REFERENCES dispatches(id) ON DELETE CASCADE, channel TEXT, status TEXT, attempts INTEGER DEFAULT 0, next_retry TEXT, updated_at TEXT`,
  audit_log: `id TEXT PRIMARY KEY, org_id TEXT, user_id TEXT, entity TEXT, entity_id TEXT, action TEXT, before_val TEXT, after_val TEXT, justification TEXT, created_at TEXT`,
  ai_activation: `org_id TEXT NOT NULL, use_case_id TEXT NOT NULL, active INTEGER NOT NULL, PRIMARY KEY (org_id, use_case_id)`,
  ai_overrides: `project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE, use_case_id TEXT NOT NULL, state TEXT NOT NULL, PRIMARY KEY (project_id, use_case_id)`,
  ai_usage_log: `id TEXT PRIMARY KEY, org_id TEXT, project_id TEXT, use_case_id TEXT, record_ref TEXT, user_id TEXT, outcome TEXT, source TEXT, confidence REAL, question TEXT, created_at TEXT`,
  attachments: `id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, owner_type TEXT, owner_id TEXT, filename TEXT, mime TEXT, size INTEGER, path TEXT, author_id TEXT, created_at TEXT`,
  backups: `id TEXT PRIMARY KEY, file TEXT, size INTEGER, created_at TEXT, expires_at TEXT, kind TEXT`,
  vertical_activation: `org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, vertical_id TEXT NOT NULL, version INTEGER, sort INTEGER, validated INTEGER, activated_at TEXT, PRIMARY KEY (org_id, vertical_id)`,
  integration_log: `id TEXT PRIMARY KEY, org_id TEXT, integration_id TEXT, direction TEXT, record TEXT, result TEXT, created_at TEXT`,
};
const INDEXES = [
  `CREATE INDEX IF NOT EXISTS ix_records ON records(entity, org_id, project_id)`,
  `CREATE INDEX IF NOT EXISTS ix_records_ref ON records(entity, ref)`,
  `CREATE INDEX IF NOT EXISTS ix_tasks_proj ON task_instances(project_id, e2e_instance_id)`,
  `CREATE INDEX IF NOT EXISTS ix_tasks_owner ON task_instances(owner_id, status)`,
  `CREATE INDEX IF NOT EXISTS ix_e2e_proj ON e2e_instances(project_id)`,
  `CREATE INDEX IF NOT EXISTS ix_alerts_org ON alerts(org_id, created_at)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_alert_dedup ON alerts(org_id, type, entity_id, period)`,
  `CREATE INDEX IF NOT EXISTS ix_audit ON audit_log(org_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS ix_versions ON entity_versions(entity, record_id, version)`,
  `CREATE INDEX IF NOT EXISTS ix_kpi ON kpi_values(org_id, project_id, kpi_id)`,
  // NFR-DA-SEC-06: at most one Accountable per RACSI activity, enforced by the data layer.
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_racsi_one_accountable ON racsi_assignments(activity_id) WHERE letter = 'A'`,
  `CREATE INDEX IF NOT EXISTS ix_racsi ON racsi_activities(org_id, ref_type, ref_id)`,
  `CREATE INDEX IF NOT EXISTS ix_projects_org ON projects(org_id)`,
  `CREATE INDEX IF NOT EXISTS ix_usage ON ai_usage_log(org_id, created_at)`,
];
// Columns added by later releases are appended here: [table, column, definition].
const COLUMNS = [
  ['projects', 'phase', 'INTEGER'],
  ['users', 'phone', 'TEXT'],
];

export function migrate() {
  const applied = [];
  for (const [name, cols] of Object.entries(TABLES)) {
    const exists = one(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, name);
    if (!exists) { db.exec(`CREATE TABLE ${name} (${cols})`); applied.push('table ' + name); }
  }
  for (const [t, c, def] of COLUMNS) {
    const cols = db.prepare(`PRAGMA table_info(${t})`).all().map(r => r.name);
    if (!cols.includes(c)) { db.exec(`ALTER TABLE ${t} ADD COLUMN ${c} ${def}`); applied.push(`column ${t}.${c}`); }
  }
  for (const ix of INDEXES) db.exec(ix);
  return applied;
}

export function isSeeded() {
  try { return !!one(`SELECT value FROM meta WHERE key='seeded_at'`); } catch { return false; }
}
