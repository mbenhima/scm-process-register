// Permission catalog (module.action) and the default role grants seeded into the runtime-editable
// Permission Matrix (FR-DA-RBAC-02). Roles R01-R21 come from the D15b role directory; R22 adds the
// Read-Only / Auditor baseline class of the Dynamic Apps Standard SRS.
export const PERMISSIONS = [
  ['dashboard.view', 'Home', 'View dashboards'],
  ['project.view', 'Projects', 'View innovation projects'], ['project.create', 'Projects', 'Create projects'],
  ['project.edit', 'Projects', 'Edit projects and manage their tasks'], ['project.delete', 'Projects', 'Delete projects'],
  ['task.view', 'Tasks', 'View tasks'], ['task.edit', 'Tasks', 'Work on own tasks'], ['task.assign', 'Tasks', 'Assign tasks and evaluators'],
  ['task.evaluate', 'Tasks', 'Evaluate completed tasks'], ['evaluation.view', 'Tasks', 'See individual evaluation verdicts and notes of other people'],
  ['checklist.edit', 'Gates', 'Complete gate checklist items'], ['gate.view', 'Gates', 'View gate reviews'],
  ['gate.submit', 'Gates', 'Submit gates for decision'], ['gate.decide', 'Gates', 'Record gate decisions and approve waivers'],
  ['tailoring.approve', 'Gates', 'Approve tailoring deviations (executive approval)'],
  ['reference.view', 'Process library', 'View macro processes, E2E processes and coverage'],
  ['track.view', 'Tracks', 'View track configuration'], ['track.manage', 'Tracks', 'Edit track configuration'],
  ['governance.view', 'Governance', 'View business rules, controls and risks'], ['governance.manage', 'Governance', 'Manage business rules, controls, risks and governance settings'],
  ['kpi.view', 'KPIs', 'View KPIs'], ['kpi.manage', 'KPIs', 'Manage custom KPIs and measurements'],
  ['racsi.view', 'RACSI', 'View RACSI matrix'], ['racsi.manage', 'RACSI', 'Manage RACSI matrix'],
  ['bpmn.view', 'BPMN', 'View BPMN diagrams'], ['bpmn.edit', 'BPMN', 'Edit BPMN diagrams'],
  ['alert.view', 'Alerts', 'View alerts'], ['alert.manage', 'Alerts', 'Configure alert types and run checks'],
  ['ai.view', 'AI', 'View AI use cases'], ['ai.use', 'AI', 'Request AI suggestions'], ['ai.manage', 'AI', 'Manage AI use cases, activation and versions'],
  ['assistant.use', 'AI', 'Use the AI Assistant'],
  ['kb.view', 'Knowledge', 'View knowledge base'], ['kb.manage', 'Knowledge', 'Manage knowledge articles'],
  ['rex.view', 'REX', 'View lessons learned'], ['rex.manage', 'REX', 'Record and edit lessons learned'],
  ['template.view', 'Templates', 'View templates'], ['template.manage', 'Templates', 'Manage templates'],
  ['wbs.view', 'Planning', 'View WBS and Gantt'], ['wbs.manage', 'Planning', 'Manage WBS and Gantt'],
  ['report.view', 'Reports', 'View reports'], ['report.export', 'Reports', 'Export reports'],
  ['benchmark.view', 'Benchmarking', 'Compare project types and tracks within the organization'],
  ['benchmark.group', 'Benchmarking', 'Compare the organization with the other organizations of its group (aggregates only)'],
  ['benchmark.manage', 'Benchmarking', 'Decide whether the organization shares its aggregates with its group'],
  ['audit.view', 'Audit', 'View the audit trail and version history'],
  ['catalog.view', 'Commercial', 'View packs, integrations and add-ons catalog'],
  ['config.view', 'Configuration', 'View configuration'], ['config.manage', 'Configuration', 'Change subscription, add-ons and compliance standards'],
  ['integration.view', 'Integrations', 'View integrations'], ['integration.manage', 'Integrations', 'Register and configure integrations'],
  ['license.manage', 'Licensing', 'Manage licences'],
  ['hierarchy.manage', 'Administration', 'Manage groups, organizations and OBS'], ['user.manage', 'Administration', 'Manage users'],
  ['permission.manage', 'Administration', 'Edit the Permission Matrix'],
];

export const ROLES = [
  ['R01', 'Executive Sponsor', 'Scoped Viewer / Sponsor'], ['R02', 'Gate Review Board Member', 'Action Owner / Evaluator'],
  ['R03', 'Product Manager', 'Process Owner / Manager'], ['R04', 'Portfolio Manager', 'Process Owner / Manager'],
  ['R05', 'Engineering Lead', 'Team Contributor'], ['R06', 'Manufacturing Engineer', 'Team Contributor'],
  ['R07', 'Quality Manager', 'Process Owner / Manager'], ['R08', 'Regulatory & Compliance Officer', 'Team Contributor'],
  ['R09', 'Legal & IP Counsel', 'Team Contributor'], ['R10', 'Finance Controller', 'Team Contributor'],
  ['R11', 'Procurement & Supplier Manager', 'Team Contributor'], ['R12', 'Marketing & Sales Manager', 'Team Contributor'],
  ['R13', 'Service Manager', 'Team Contributor'], ['R14', 'Field Service Technician', 'Action Owner / Evaluator'],
  ['R15', 'Sustainability Officer', 'Team Contributor'], ['R16', 'Data & AI Specialist', 'Team Contributor'],
  ['R17', 'Process Owner / Track Administrator', 'Process Owner / Manager'], ['R18', 'Platform Administrator', 'Platform / Organization Administrator'],
  ['R19', 'Customer Success & Training Manager', 'Team Contributor'], ['R20', 'Supplier (External Portal)', 'Reporter / Read-Only / Auditor'],
  ['R21', 'Customer (External Portal)', 'Reporter / Read-Only / Auditor'], ['R22', 'Internal Auditor', 'Reporter / Read-Only / Auditor'],
];

const ALL = PERMISSIONS.map((p) => p[0]);
const VIEW = ALL.filter((c) => /\.view$/.test(c) && !['audit.view', 'evaluation.view'].includes(c)); // restricted views are granted explicitly
const CONTRIB = [...VIEW, 'project.create', 'project.edit', 'task.edit', 'task.evaluate', 'checklist.edit', 'gate.submit', 'ai.use', 'assistant.use', 'rex.manage', 'wbs.manage', 'report.export', 'kpi.manage'];
const MANAGER = [...CONTRIB, 'task.assign', 'governance.manage', 'racsi.manage', 'bpmn.edit', 'alert.manage', 'kb.manage', 'template.manage', 'audit.view', 'project.delete', 'benchmark.group', 'evaluation.view'];
const ADMIN_ONLY = ['config.manage', 'integration.manage', 'license.manage', 'hierarchy.manage', 'user.manage', 'permission.manage'];
const without = (list, ...drop) => list.filter((c) => !drop.includes(c));

export function defaultGrants(roleId) { return [...new Set(grants(roleId))]; }

function grants(roleId) {
  switch (roleId) {
    case 'R18': return ALL;
    case 'R17': return [...MANAGER, 'track.manage', 'tailoring.approve', 'ai.manage', 'benchmark.manage'];
    case 'R03': case 'R04': case 'R07': return MANAGER;
    case 'R16': return [...CONTRIB, 'ai.manage', 'kb.manage'];
    case 'R01': return [...VIEW, 'gate.decide', 'tailoring.approve', 'task.evaluate', 'ai.use', 'assistant.use', 'report.export', 'audit.view', 'benchmark.group', 'benchmark.manage', 'rex.manage', 'evaluation.view'];
    case 'R02': return [...VIEW, 'gate.decide', 'task.evaluate', 'checklist.edit', 'ai.use', 'assistant.use', 'report.export', 'rex.manage'];
    case 'R14': return ['dashboard.view', 'task.view', 'task.edit', 'project.view', 'kb.view', 'rex.view', 'rex.manage', 'alert.view', 'report.view', 'assistant.use', 'reference.view'];
    case 'R20': case 'R21': return ['dashboard.view', 'report.view', 'kb.view', 'alert.view', 'reference.view'];
    case 'R22': return [...VIEW, 'audit.view', 'report.export', 'evaluation.view'];
    default: return without(CONTRIB, ...ADMIN_ONLY);
  }
}

// Startup migration: permissions added in a newer version are inserted with their default role grants,
// without touching grants an administrator already edited in the Permission Matrix.
export function ensurePermissions(q) {
  const have = new Set(q.all('SELECT code FROM permissions').map((r) => r.code));
  const added = PERMISSIONS.filter(([code]) => !have.has(code));
  if (!added.length || !q.get('SELECT 1 FROM roles LIMIT 1')) return [];
  for (const [code, module, description] of added) {
    q.insert('permissions', { code, module, description });
    for (const [roleId] of ROLES) if (defaultGrants(roleId).includes(code)) q.run('INSERT OR IGNORE INTO role_permissions (role_id, permission_code) VALUES (?, ?)', roleId, code);
  }
  return added.map((p) => p[0]);
}
