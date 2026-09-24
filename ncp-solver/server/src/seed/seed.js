import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { PERMISSIONS, ROLE_TEMPLATES } from './rbacCatalog.js';
import { SECTOR_TEMPLATES, SECTOR_LABELS, PROJECT_TEMPLATES } from './sectorTemplates.js';
import { AI_USE_CASE_TEMPLATES } from './aiUseCaseTemplates.js';
import { BUSINESS_RULE_TEMPLATES, CONTROL_TEMPLATES, RISK_TEMPLATES } from './grcTemplates.js';
import { NCP_PROCESS_BPMN_XML } from './bpmnTemplates.js';
import { ANNEX_A_STANDARDS } from './standardsLibrary.js';
import { SHEET_TEMPLATE_SEEDS } from './sheetTemplates.js';
import { STANDARD_REQUIREMENTS } from './standardRequirements.js';
import { ALERT_STAGE_MAP } from '../services/alertCatalog.js';
import { PACKS } from '../services/packConfig.js';
import { activateComplianceModule } from './complianceModules.js';
import { SHOWCASE_ORG_DEFS } from './sectorShowcaseTemplates.js';

function activateComplianceModuleSafe(orgId, framework) {
  try { activateComplianceModule(orgId, framework); } catch { /* best-effort at seed time */ }
}

function seedSheetTemplatesForOrg(orgId, sector, users) {
  const creator = users.admin || users.cipilot || null;
  for (const t of SHEET_TEMPLATE_SEEDS) {
    db.prepare(`
      INSERT INTO ncp_sheet_templates (id, organization_id, title, description, problem_type, default_criticality, default_priority, title_template, description_template, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), orgId, t.title, t.description, t.problemType, t.defaultCriticality, t.defaultPriority, t.titleTemplate, t.descriptionTemplate, creator);
  }
}

// Populates the Project level of Group -> Organization -> Project (Hierarchy),
// previously an empty table for every seeded Organization.
function seedProjectsForOrg(orgId, sector) {
  const templates = PROJECT_TEMPLATES[sector] || [];
  for (const p of templates) {
    db.prepare(`
      INSERT INTO projects (id, organization_id, name, description, status, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), orgId, p.name, p.description, p.status, daysAgoISO(-p.startOffsetDays), daysAgoISO(-p.endOffsetDays));
  }
}

// Custom KPIs suggested in addition to the 10 built-in system KPIs (Appendix B),
// spanning multiple S1-S7 stages plus a couple of cross-cutting ones.
const CUSTOM_KPI_SUGGESTIONS = [
  { code: 'CK-01', title: 'Time to Containment', description: 'Average elapsed time from detection (S1) to the first immediate action being executed (S3).', formula_desc: 'AVG(date(S3 immediate action start) - date(S1 detection)) in hours', target_value: '<= 24h', ncp_stage: 'S3' },
  { code: 'CK-02', title: 'Time to Root Cause Identification', description: 'Average elapsed time from detection to a validated root cause being recorded.', formula_desc: 'AVG(date(root cause validated_at) - date(S1 detection)) in hours', target_value: '<= 72h', ncp_stage: 'S4' },
  { code: 'CK-03', title: 'Recurring Non-Conformity Rate', description: 'Share of new NCP sheets flagged as recurring rather than first-time occurrences.', formula_desc: '(Sheets with frequency = recurring / Total sheets opened in period) x 100', target_value: '<= 20%', ncp_stage: 'S1' },
  { code: 'CK-04', title: 'Overdue Corrective Action Rate', description: 'Share of open corrective actions that are past their planned completion date.', formula_desc: '(Corrective actions overdue / Corrective actions open) x 100', target_value: '<= 10%', ncp_stage: 'S5' },
  { code: 'CK-05', title: 'AI Suggestion Acceptance Rate', description: 'Share of AI Use Case suggestions that users accept as-is or accept-with-edit, rather than reject, across all agents.', formula_desc: '((Accepted + Edited) / Total AI suggestions logged) x 100', target_value: '>= 70%', ncp_stage: null },
  { code: 'CK-06', title: 'REX Generalization Backlog', description: 'Number of closed sheets flagged as needing generalization whose generalization plan has not yet been executed elsewhere.', formula_desc: 'COUNT(rex_entries WHERE needs_generalization = 1 AND generalization not yet applied)', target_value: '<= 5 open', ncp_stage: 'S7' },
];

function seedCustomKpisForOrg(orgId, users) {
  for (const k of CUSTOM_KPI_SUGGESTIONS) {
    db.prepare(`
      INSERT INTO custom_kpis (id, organization_id, code, title, description, formula_desc, target_value, ncp_stage, owner_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), orgId, k.code, k.title, k.description, k.formula_desc, k.target_value, k.ncp_stage, users.quality);
  }
}

// Simulated historical alerts spanning every type (A-J) and every S1-S7 stage,
// referencing the org's own seeded fiches/actions so they read as realistic
// rather than generic placeholder text.
function seedAlertsForOrg(orgId, users, ficheIds, sector) {
  const templates = SECTOR_TEMPLATES[sector];
  // Indices below assume the original 9-template layout (see planForTemplateCount);
  // skip for larger "showcase" sectors rather than reference the wrong stage's sheet.
  if (templates.length !== 9) return;
  const insert = db.prepare(`
    INSERT INTO notification_alerts (id, organization_id, alert_type, ncp_stage, triggering_entity_id, target_user_id, channel, message, status, sent_at, read_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'in_app', ?, 'sent', ?, ?, ?)
  `);
  const seedAlert = (type, ficheIdx, targetUser, message, daysAgo, read) => {
    const ficheId = ficheIds[ficheIdx] || null;
    const sentAt = daysAgoISO(daysAgo);
    insert.run(randomUUID(), orgId, type, ALERT_STAGE_MAP[type], ficheId, targetUser, message, sentAt, read ? sentAt : null, sentAt);
  };
  // Indices into the 9-template fiches array: 0-2 closed, 3=S6, 4=S5, 5=S4, 6=S3, 7=S2, 8=S1
  seedAlert('A', 8, users.quality, `New high-priority NCP sheet "${templates[8]?.title}" requires immediate triage.`, 0, false);
  seedAlert('J', 8, users.cipilot, `Priority-1 sheet "${templates[8]?.title}" has had no update for 3+ days.`, 1, false);
  seedAlert('G', 6, users.owner1, `Immediate action for "${templates[6]?.title}" is due tomorrow.`, 2, true);
  seedAlert('E', 6, users.cipilot, `Containment evidence still pending upload for "${templates[6]?.title}".`, 3, false);
  seedAlert('D', 5, users.reporter, `Root cause analysis not started for "${templates[5]?.title}" (48h elapsed).`, 5, true);
  seedAlert('H', 4, users.owner2, `Corrective action for "${templates[4]?.title}" is due in 2 days.`, 4, false);
  seedAlert('B', 4, users.owner2, `Corrective action for "${templates[4]?.title}" is overdue.`, 1, false);
  seedAlert('I', 3, users.evaluator, `Effectiveness evaluation due in 2 days for "${templates[3]?.title}".`, 2, true);
  seedAlert('C', 3, users.evaluator, `Effectiveness evaluation pending for "${templates[3]?.title}".`, 6, true);
  seedAlert('F', 2, users.quality, `Monthly KPI7 (Standardization Rate) fell below its configured Governance Settings threshold.`, 10, true);
  seedAlert('J', 2, users.admin, `Priority-1 sheet "${templates[2]?.title}" had no update for 3+ days before closure.`, 40, true);
  seedAlert('A', 7, users.quality, `New NCP sheet "${templates[7]?.title}" requires triage.`, 1, true);
}

export const DEMO_PASSWORD = 'Ncp#2026Demo';

const TABLES_IN_DELETE_ORDER = [
  'audit_logs', 'ai_agent_logs', 'notification_alerts',
  'action_evidence', 'action_evaluations', 'actions',
  'rex_entries', 'root_causes', 'problem_understanding', 'ncp_team_assignments', 'ncp_fiches',
  'ai_use_case_versions', 'ai_use_cases',
  'racsi_assignments', 'racsi_activities', 'bpmn_diagrams',
  'risk_controls', 'risks_opportunities', 'controls', 'business_rules',
  'custom_kpis', 'ncp_sheet_templates',
  'standard_requirements', 'standards',
  'governance_settings', 'licenses',
  'role_permissions', 'user_roles', 'roles', 'users',
  'permissions', 'obs_nodes', 'projects', 'organizations', 'groups',
];

function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function seedPermissions() {
  const insert = db.prepare('INSERT INTO permissions (id, module, action, code, description) VALUES (?, ?, ?, ?, ?)');
  const tx = db.transaction(() => {
    for (const [module, action, code, description] of PERMISSIONS) insert.run(randomUUID(), module, action, code, description);
  });
  tx();
}

function seedRolesForOrg(orgId) {
  const roleIds = {};
  const insertRole = db.prepare(`
    INSERT INTO roles (id, organization_id, code, name, name_fr, name_ar, description, is_system_role)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);
  const insertGrant = db.prepare('INSERT INTO role_permissions (role_id, permission_id) SELECT ?, id FROM permissions WHERE code = ?');
  for (const [code, tpl] of Object.entries(ROLE_TEMPLATES)) {
    const id = randomUUID();
    insertRole.run(id, orgId, code, tpl.name, tpl.name_fr, tpl.name_ar, tpl.description);
    for (const permCode of tpl.permissions) insertGrant.run(id, permCode);
    roleIds[code] = id;
  }
  return roleIds;
}

function createUser(orgId, { username, email, firstName, lastName, language, roleId, obsNodeId }) {
  const id = randomUUID();
  const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  db.prepare(`
    INSERT INTO users (id, organization_id, username, email, password_hash, first_name, last_name, language_preference)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, orgId, username, email, hash, firstName, lastName, language);
  if (roleId) db.prepare('INSERT INTO user_roles (id, user_id, role_id, obs_node_id) VALUES (?, ?, ?, ?)').run(randomUUID(), id, roleId, obsNodeId || null);
  return id;
}

// Picks the OBS node most relevant to quality/compliance/governance for an org,
// falling back to the first department, then the site root.
function governanceObsId(obsByName) {
  const preferred = ['Quality Assurance', 'Quality Control', 'Quality', 'Compliance', 'HSE'];
  for (const name of preferred) if (obsByName[name]) return obsByName[name];
  const values = Object.values(obsByName);
  return values[0] || null;
}

function seedUsersForOrg(orgId, domain, roleIds, language, obsByName) {
  const deptValues = Object.values(obsByName);
  const firstDept = deptValues[0] || null;
  const govDept = governanceObsId(obsByName);
  const specs = [
    // key, first, last, roleId, obsNodeId — mixes site/department/service/team scoping so
    // OBS genuinely carries "roles and names" that RACSI (and other modules) can point back to.
    ['admin', 'Amina', 'Idrissi', roleIds.admin, obsByName.__site],
    ['quality', 'Karim', 'Benali', roleIds.quality_manager, govDept],
    ['cipilot', 'Laila', 'Ouazzani', roleIds.ci_pilot, obsByName.__ciTeam || govDept],
    ['team1', 'Youssef', 'El Amrani', roleIds.ncp_team_member, obsByName.__ciTeam || firstDept],
    ['team2', 'Sara', 'Bouzid', roleIds.ncp_team_member, firstDept],
    ['owner1', 'Hicham', 'Tazi', roleIds.action_owner, firstDept],
    ['owner2', 'Nadia', 'Chraibi', roleIds.action_owner, firstDept],
    ['evaluator', 'Rachid', 'Fassi', roleIds.evaluator, govDept],
    ['depthead', 'Meryem', 'Alaoui', roleIds.department_head, firstDept],
    ['reporter', 'Omar', 'Kabbaj', roleIds.reporter, firstDept],
    ['auditor', 'Zineb', 'Haddad', roleIds.auditor, obsByName.__site],
  ];
  const users = {};
  for (const [key, first, last, roleId, obsNodeId] of specs) {
    users[key] = createUser(orgId, {
      username: `${key}.${domain}`, email: `${key}@${domain}.ncpsolver.demo`,
      firstName: first, lastName: last, language, roleId, obsNodeId,
    });
  }
  return users;
}

// Builds a Site -> Departments -> (Service -> Team) hierarchy. The first department gets one
// extra Service and Team level so OBS demonstrates its full depth, not just a flat department list.
function seedObsForOrg(orgId, departments) {
  const siteId = randomUUID();
  db.prepare(`INSERT INTO obs_nodes (id, organization_id, parent_id, node_type, name, code) VALUES (?, ?, NULL, 'site', 'Main Site', 'SITE-01')`).run(siteId, orgId);
  const byName = { __site: siteId };
  departments.forEach((dep, i) => {
    const id = randomUUID();
    db.prepare(`INSERT INTO obs_nodes (id, organization_id, parent_id, node_type, name) VALUES (?, ?, ?, 'department', ?)`).run(id, orgId, siteId, dep);
    byName[dep] = id;
    if (i === 0) {
      const serviceId = randomUUID();
      db.prepare(`INSERT INTO obs_nodes (id, organization_id, parent_id, node_type, name) VALUES (?, ?, ?, 'service', ?)`).run(serviceId, orgId, id, `${dep} Operations`);
      const teamId = randomUUID();
      db.prepare(`INSERT INTO obs_nodes (id, organization_id, parent_id, node_type, name) VALUES (?, ?, ?, 'team', 'Continuous Improvement Team')`).run(teamId, orgId, serviceId);
      byName.__ciTeam = teamId;
    }
  });
  return byName;
}

function seedStandardsForOrg(orgId, standardTitles, planTier) {
  const ids = {};
  let i = 1;
  for (const title of standardTitles) {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO standards (id, organization_id, code, title, version, is_active, effective_date)
      VALUES (?, ?, ?, ?, '1.0', 1, ?)
    `).run(id, orgId, `STD-${String(i++).padStart(3, '0')}`, title, daysAgoISO(400));
    ids[title] = id;
  }
  // The Technical Offer's illustrative Standards Library (Annex A): seeded in
  // full for every Organization, with only the Pack's allotment (3/5/7)
  // marked active by default — an Administrator can activate any other from
  // the Configuration Management screen, subject to that same allotment.
  const pack = PACKS[planTier] || PACKS.govern;
  ANNEX_A_STANDARDS.forEach((std, idx) => {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO standards (id, organization_id, code, title, domain, version, is_active, stage_tags, effective_date)
      VALUES (?, ?, ?, ?, ?, '1.0', ?, ?, ?)
    `).run(id, orgId, std.code, std.title, std.domain, idx < pack.standardsIncluded ? 1 : 0, std.stageTag, daysAgoISO(400));
    ids[std.title] = id;
    seedRequirementsForStandard(orgId, id, std.code);
  });
  return ids;
}

// Clause-level requirements (with a simulated NC/Problem example each) for the
// Annex A Standards Library — see standardRequirements.js.
function seedRequirementsForStandard(orgId, standardId, code) {
  const reqs = STANDARD_REQUIREMENTS[code];
  if (!reqs) return;
  const insert = db.prepare(`
    INSERT INTO standard_requirements (id, standard_id, organization_id, clause_code, title, requirement_text, example_nonconformity, example_problem, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  reqs.forEach((r, idx) => {
    insert.run(randomUUID(), standardId, orgId, r.clause, r.title, r.text, r.exampleNc, r.exampleProblem, idx);
  });
}

function seedLicenseAndGovernance(orgId, planTier, deploymentModel, options = {}) {
  const deploymentOption = deploymentModel === 'onprem' ? 'sovereign_core' : (options.deploymentOption || 'dedicated_cloud');
  db.prepare(`
    INSERT INTO licenses (
      id, organization_id, plan_tier, deployment_model, deployment_option, seats_total, billing_cycle, renewal_date, status,
      support_tier, addon_capitalization, addon_ai_assistant, addon_bpmn_editing, addon_custom_roles, addon_sovereign_deployment,
      compliance_gdpr, compliance_iso27001, compliance_soc2
    )
    VALUES (?, ?, ?, ?, ?, 30, 'annual', ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(), orgId, planTier, deploymentModel, deploymentOption, daysAgoISO(-300),
    options.supportTier || 'standard',
    options.addonCapitalization ? 1 : 0, options.addonAiAssistant ? 1 : 0, options.addonBpmnEditing ? 1 : 0,
    options.addonCustomRoles ? 1 : 0, options.addonSovereignDeployment ? 1 : 0,
    options.complianceGdpr ? 1 : 0, options.complianceIso27001 ? 1 : 0, options.complianceSoc2 ? 1 : 0,
  );
  db.prepare(`
    INSERT INTO governance_settings (id, organization_id, default_language, kpi_thresholds_json, alert_config_json)
    VALUES (?, ?, 'en', ?, ?)
  `).run(randomUUID(), orgId,
    // Keys must match computeKPIs()'s output (reports.js) so Governance Settings
    // can show a human-readable KPI Name (see kpiCatalog.js) alongside each ID.
    JSON.stringify({
      kpi1_completion_immediate: 100, kpi2_effectiveness_immediate: 85, kpi3_on_time: 80,
      kpi4_completion_corrective: 100, kpi5_effectiveness_corrective: 80, kpi6_evaluations: 100,
      kpi7_standardization: 70, kpi8_generalization: 40, kpi10_closure: 85,
    }),
    JSON.stringify({ A: true, B: true, C: true, D: true, E: true, F: true, G: true, H: true, I: true, J: true }));
}

let ficheCounters = {};
function nextFicheNumber(orgId) {
  ficheCounters[orgId] = (ficheCounters[orgId] || 0) + 1;
  return `NC-${new Date().getFullYear()}-${String(ficheCounters[orgId]).padStart(4, '0')}`;
}
let actionCounters = {};
function nextActionNumber(orgId) {
  actionCounters[orgId] = (actionCounters[orgId] || 0) + 1;
  return `A-${new Date().getFullYear()}-${String(actionCounters[orgId]).padStart(4, '0')}`;
}

function insertFiche(orgId, obsId, users, standardIds, tpl, detectionDaysAgo, plan) {
  const ficheId = randomUUID();
  const detectionDate = daysAgoISO(detectionDaysAgo);
  const status = plan === 'closed' ? 'closed' : (plan === 'S1' ? 'open' : 'in_progress');
  const closureDate = plan === 'closed' ? daysAgoISO(Math.max(1, detectionDaysAgo - 20)) : null;
  const stage = plan === 'closed' ? 'S7' : plan;
  const standardId = tpl.standard ? standardIds[tpl.standard] : null;

  db.prepare(`
    INSERT INTO ncp_fiches (
      id, organization_id, fiche_number, title, description, detector_id, detection_date, obs_node_id,
      criticality, priority, frequency, target_objective, applicable_standards, current_stage, status, closure_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ficheId, orgId, nextFicheNumber(orgId), tpl.title, tpl.description, users.reporter, detectionDate, obsId,
    tpl.criticality, tpl.priority, tpl.frequency, 'Eliminate recurrence and restore full compliance.',
    standardId, stage, status, closureDate,
  );

  db.prepare('INSERT INTO ncp_team_assignments (id, fiche_id, user_id, assigned_by) VALUES (?, ?, ?, ?)')
    .run(randomUUID(), ficheId, users.team1, users.cipilot);
  if (plan !== 'S1') {
    db.prepare('INSERT INTO ncp_team_assignments (id, fiche_id, user_id, assigned_by) VALUES (?, ?, ?, ?)')
      .run(randomUUID(), ficheId, users.cipilot, users.cipilot);
  }

  const stageOrder = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'];
  const reached = (s) => plan === 'closed' || stageOrder.indexOf(plan) >= stageOrder.indexOf(s);

  if (reached('S2')) {
    db.prepare(`
      INSERT INTO problem_understanding (id, fiche_id, what, who_detected, where_, when_, how_detected, why_problem, how_much, frequency_analysis, objectives)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), ficheId, tpl.description, 'Field inspection', tpl.department, detectionDate,
      'Routine quality/HSE inspection', `Deviates from ${tpl.standard || 'applicable internal standard'}`,
      'See fiche description for measured gap', tpl.frequency, 'Restore full compliance and prevent recurrence.');
  }

  let immediateActionId = null;
  if (reached('S3')) {
    immediateActionId = randomUUID();
    const done = reached('S4');
    db.prepare(`
      INSERT INTO actions (id, organization_id, fiche_id, action_number, action_type, description, tasks, required_means,
        responsible_owner_id, planned_completion_date, status, actual_completion_date)
      VALUES (?, ?, ?, ?, 'immediate', ?, ?, ?, ?, ?, ?, ?)
    `).run(immediateActionId, orgId, ficheId, nextActionNumber(orgId), tpl.immediateAction,
      'Execute containment action and verify no further exposure.', 'Site team, PPE/quarantine tags',
      users.owner1, daysAgoISO(Math.max(0, detectionDaysAgo - 2)), done ? 'done' : 'in_progress',
      done ? daysAgoISO(Math.max(0, detectionDaysAgo - 1)) : null);
    if (done) {
      db.prepare(`
        INSERT INTO action_evaluations (id, action_id, evaluator_owner_id, planned_review_date, actual_review_date, efficiency_criteria, review_result, review_comments)
        VALUES (?, ?, ?, ?, ?, ?, 'effective', 'Containment confirmed effective on re-inspection.')
      `).run(randomUUID(), immediateActionId, users.evaluator, daysAgoISO(Math.max(0, detectionDaysAgo - 1)), daysAgoISO(Math.max(0, detectionDaysAgo - 1)), 'No further non-conforming output/exposure observed.');
      db.prepare(`INSERT INTO action_evidence (id, action_id, file_name, file_type, uploaded_by_id, evidence_type) VALUES (?, ?, ?, 'image/jpeg', ?, 'execution_proof')`)
        .run(randomUUID(), immediateActionId, 'containment-evidence.jpg', users.owner1);
    }
  }

  let rootCauseId = null;
  if (reached('S4')) {
    rootCauseId = randomUUID();
    db.prepare(`
      INSERT INTO root_causes (id, fiche_id, description, cause_category, rca_method_used, validated_at, validated_by, standard_id)
      VALUES (?, ?, ?, ?, '5_why', ?, ?, ?)
    `).run(rootCauseId, ficheId, tpl.rootCause, tpl.causeCategory, daysAgoISO(Math.max(0, detectionDaysAgo - 3)), users.cipilot, standardId);
  }

  let correctiveActionId = null;
  if (reached('S5')) {
    correctiveActionId = randomUUID();
    const done = reached('S6');
    db.prepare(`
      INSERT INTO actions (id, organization_id, fiche_id, action_number, action_type, root_cause_id, description, tasks,
        required_means, responsible_owner_id, planned_completion_date, status, actual_completion_date)
      VALUES (?, ?, ?, ?, 'corrective', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(correctiveActionId, orgId, ficheId, nextActionNumber(orgId), rootCauseId, tpl.correctiveAction,
      'Implement permanent fix and update the relevant procedure/checklist.', 'Budget approval, cross-functional team',
      users.owner2, daysAgoISO(Math.max(0, detectionDaysAgo - 10)), done ? 'done' : 'in_progress',
      done ? daysAgoISO(Math.max(0, detectionDaysAgo - 8)) : null);
    if (done) {
      db.prepare(`
        INSERT INTO action_evaluations (id, action_id, evaluator_owner_id, planned_review_date, actual_review_date, efficiency_criteria, review_result, review_comments)
        VALUES (?, ?, ?, ?, ?, ?, 'effective', 'No recurrence observed after 2 monitoring cycles.')
      `).run(randomUUID(), correctiveActionId, users.evaluator, daysAgoISO(Math.max(0, detectionDaysAgo - 8)), daysAgoISO(Math.max(0, detectionDaysAgo - 8)), 'Zero recurrence of the non-conformity over the following monitoring period.');
      db.prepare(`INSERT INTO action_evidence (id, action_id, file_name, file_type, uploaded_by_id, evidence_type) VALUES (?, ?, ?, 'application/pdf', ?, 'evaluation_proof')`)
        .run(randomUUID(), correctiveActionId, 'effectiveness-review.pdf', users.evaluator);
    } else {
      // Leave an evaluation record scheduled-but-pending so alerts C/H/I have real data to trigger on.
      db.prepare(`
        INSERT INTO action_evaluations (id, action_id, evaluator_owner_id, planned_review_date, efficiency_criteria, review_result)
        VALUES (?, ?, ?, ?, ?, 'pending')
      `).run(randomUUID(), correctiveActionId, users.evaluator, daysAgoISO(-2), 'Zero recurrence of the non-conformity for 2 monitoring cycles.');
    }
  }

  if (plan === 'closed') {
    const standardizeIt = tpl.criticality === 'high';
    db.prepare(`
      INSERT INTO rex_entries (id, fiche_id, lessons_learned, root_cause_summary, solution_summary, needs_standardization,
        standardization_details, needs_generalization, generalization_plan, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), ficheId, tpl.lessons, tpl.rootCause, tpl.correctiveAction, standardizeIt ? 1 : 0,
      standardizeIt ? 'Updated the relevant SOP/checklist to embed this control permanently.' : null,
      standardizeIt ? 1 : 0,
      standardizeIt ? 'Roll out the same control to all other sites/lines with an equivalent process.' : null,
      `${tpl.department}, ${tpl.causeCategory}`);
  }

  return ficheId;
}

// Builds a (plan, detectionDaysAgo) pair for every template in a sector. The
// original 4 sectors ship exactly 9 templates (3 closed for rich Capitalization
// Library / REX data, plus one open sheet at each of the other 6 stages) and
// seedAlertsForOrg()'s hardcoded indices depend on that exact layout, so it is
// preserved as-is. Larger "showcase" sectors (25+ templates) get a generic
// distribution: roughly a third closed, the rest cycled S6->S1 so every stage
// tab has several live examples.
function planForTemplateCount(n) {
  if (n === 9) {
    return { plans: ['closed', 'closed', 'closed', 'S6', 'S5', 'S4', 'S3', 'S2', 'S1'], detectionDays: [75, 60, 45, 25, 20, 12, 4, 1, 0] };
  }
  const stages = ['S6', 'S5', 'S4', 'S3', 'S2', 'S1'];
  const closedCount = Math.max(3, Math.round(n * 0.3));
  const plans = new Array(closedCount).fill('closed');
  for (let i = 0; i < n - closedCount; i++) plans.push(stages[i % stages.length]);
  const detectionDays = plans.map((p, i) => {
    if (p === 'closed') return Math.max(30, 95 - i * 5);
    const stageIdx = stages.indexOf(p);
    const cycle = Math.floor((i - closedCount) / stages.length);
    return Math.max(0, (stageIdx + 1) * 5 - cycle * 2 + (i % 3));
  });
  return { plans, detectionDays };
}

function seedFichesForOrg(orgId, sector, obsByName, users, standardIds) {
  const templates = SECTOR_TEMPLATES[sector];
  const { plans, detectionDays } = planForTemplateCount(templates.length);
  const ficheIds = [];
  templates.forEach((tpl, i) => {
    const obsId = obsByName[tpl.department] || governanceObsId(obsByName);
    ficheIds.push(insertFiche(orgId, obsId, users, standardIds, tpl, detectionDays[i], plans[i]));
  });
  return ficheIds;
}

function seedAiUseCasesForOrg(orgId, sector, users, planTier) {
  const templates = AI_USE_CASE_TEMPLATES;
  const pack = PACKS[planTier] || PACKS.govern;
  templates.forEach((t, idx) => {
    const useCaseId = randomUUID();
    const isActive = idx < pack.aiUseCasesIncluded ? 1 : 0;
    db.prepare(`
      INSERT INTO ai_use_cases (id, organization_id, title, description, sector, business_function, ai_technique,
        maturity_stage, status, tier, module_key, trigger_desc, output_desc, human_checkpoint,
        owner_id, expected_impact, estimated_roi, tags, is_active, is_custom)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(useCaseId, orgId, t.title, t.description, sector, t.business_function, t.ai_technique,
      t.maturity_stage, t.status, t.tier, t.module_key, t.trigger_desc, t.output_desc, t.human_checkpoint,
      users.cipilot, t.expected_impact, t.maturity_stage >= 3 ? 'Medium-High' : 'To be assessed', t.module_key, isActive);

    const versionId = randomUUID();
    db.prepare(`
      INSERT INTO ai_use_case_versions (id, use_case_id, version_number, inputs, prompt, expected_output,
        constraints_guardrails, model_technique_notes, change_note, is_current, created_by)
      VALUES (?, ?, 1, ?, ?, ?, ?, ?, 'Initial version', 1, ?)
    `).run(versionId, useCaseId, t.inputs, t.prompt, t.expected_output, t.constraints_guardrails, t.model_technique_notes, users.cipilot);
    db.prepare('UPDATE ai_use_cases SET current_version_id = ? WHERE id = ?').run(versionId, useCaseId);
  });
}

function seedBusinessRulesForOrg(orgId, users, obsNodeId) {
  const ids = {};
  for (const r of BUSINESS_RULE_TEMPLATES) {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO business_rules (id, organization_id, code, title, description, rule_type, applies_to_module,
        condition_text, action_text, severity, owner_id, obs_node_id, ncp_stage, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(id, orgId, r.code, r.title, r.action_text, r.rule_type, r.applies_to_module,
      r.condition_text, r.action_text, r.severity, users.cipilot, obsNodeId, r.ncp_stage || null);
    ids[r.code] = id;
  }
  return ids;
}

function seedControlsForOrg(orgId, users, obsNodeId) {
  const ids = {};
  for (const c of CONTROL_TEMPLATES) {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO controls (id, organization_id, code, title, description, coso_component, control_type, frequency,
        control_owner_id, effectiveness, last_tested_date, next_test_date, evidence_notes, obs_node_id, ncp_stage, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(id, orgId, c.code, c.title, c.evidence_notes, c.coso_component, c.control_type, c.frequency,
      users.quality, c.effectiveness, daysAgoISO(30), daysAgoISO(-60), c.evidence_notes, obsNodeId, c.ncp_stage || null);
    ids[c.code] = id;
  }
  return ids;
}

function seedRisksForOrg(orgId, users, controlIds, obsNodeId) {
  const ids = {};
  for (const r of RISK_TEMPLATES) {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO risks_opportunities (id, organization_id, code, title, description, item_type, category,
        likelihood, impact, response_strategy, mitigation_plan, owner_id, status,
        residual_likelihood, residual_impact, target_date, obs_node_id, ncp_stage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, orgId, r.code, r.title, r.description, r.item_type, r.category, r.likelihood, r.impact,
      r.response_strategy, r.mitigation_plan, users.quality, r.status,
      Math.max(1, r.likelihood - 1), Math.max(1, r.impact - 1), daysAgoISO(-90), obsNodeId, r.ncp_stage || null);
    ids[r.code] = id;
    for (const controlCode of r.controls || []) {
      if (controlIds[controlCode]) db.prepare('INSERT INTO risk_controls (risk_id, control_id) VALUES (?, ?)').run(id, controlIds[controlCode]);
    }
  }
  return ids;
}

// Seeds the RACSI accountability matrix: one activity per NCP process step (S1-S7), plus a
// handful of governance activities linked directly to a Business Rule, a Control and a
// Risk/Opportunity record. Assignees mix ROLES (org-wide accountability) and NAMED people
// (specific users), all drawn from the org's OBS-scoped roles/users. Exactly one Accountable.
function seedRacsiForOrg(orgId, users, roleIds, obsByName, businessRuleIds, controlIds, riskIds) {
  const govObsId = governanceObsId(obsByName);
  const ciTeamObsId = obsByName.__ciTeam || govObsId;

  const insertActivity = db.prepare(`
    INSERT INTO racsi_activities (id, organization_id, code, title, description, module_ref, linked_record_id, ncp_stage, obs_node_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertAssignment = db.prepare(`
    INSERT INTO racsi_assignments (id, activity_id, racsi_type, role_id, user_id) VALUES (?, ?, ?, ?, ?)
  `);

  function activity({ code, title, description, moduleRef, linkedRecordId, ncpStage, obsNodeId, assignments }) {
    const id = randomUUID();
    insertActivity.run(id, orgId, code, title, description, moduleRef, linkedRecordId || null, ncpStage || null, obsNodeId || null);
    for (const a of assignments) {
      insertAssignment.run(randomUUID(), id, a.type, a.roleId || null, a.userId || null);
    }
    return id;
  }
  const role = (code) => ({ roleId: roleIds[code] });
  const user = (id) => ({ userId: id });

  // S1-S7: one activity per NCP Solver process step.
  activity({
    code: 'RACSI-S1', title: 'S1 — Detection & Alert', ncpStage: 'S1', moduleRef: 'ncp_process', obsNodeId: govObsId,
    description: 'Log the non-conformity, capture immediate facts, and trigger the initial alert.',
    assignments: [
      { type: 'A', ...role('quality_manager') },
      { type: 'R', ...role('reporter') }, { type: 'R', ...role('ncp_team_member') },
      { type: 'C', ...role('department_head') },
      { type: 'S', ...role('ci_pilot') },
      { type: 'I', ...role('auditor') },
    ],
  });
  activity({
    code: 'RACSI-S2', title: 'S2 — Problem Understanding (5W2H)', ncpStage: 'S2', moduleRef: 'ncp_process', obsNodeId: ciTeamObsId,
    description: 'Structure the problem statement (What/Who/Where/When/How/How much) before any containment.',
    assignments: [
      { type: 'A', ...role('ci_pilot') },
      { type: 'R', ...role('ncp_team_member') },
      { type: 'C', ...role('quality_manager') },
      { type: 'S', ...role('department_head') },
      { type: 'I', ...role('auditor') },
    ],
  });
  activity({
    code: 'RACSI-S3', title: 'S3 — Immediate / Containment Actions', ncpStage: 'S3', moduleRef: 'ncp_process', obsNodeId: ciTeamObsId,
    description: 'Contain the non-conformity and protect the customer/process from further exposure.',
    assignments: [
      { type: 'A', ...role('quality_manager') },
      { type: 'R', ...role('action_owner') }, { type: 'R', ...role('ncp_team_member') },
      { type: 'C', ...role('ci_pilot') },
      { type: 'S', ...role('department_head') },
      { type: 'I', ...role('auditor') },
    ],
  });
  activity({
    code: 'RACSI-S4', title: 'S4 — Root Cause Analysis', ncpStage: 'S4', moduleRef: 'ncp_process', obsNodeId: ciTeamObsId,
    description: 'Identify and validate the root cause(s) using 5-Why or Ishikawa.',
    assignments: [
      { type: 'A', ...role('ci_pilot') },
      { type: 'R', ...role('ncp_team_member') },
      { type: 'C', ...role('quality_manager') },
      { type: 'S', ...role('department_head') },
      { type: 'I', ...role('auditor') },
    ],
  });
  activity({
    code: 'RACSI-S5', title: 'S5 — Corrective Action Plan', ncpStage: 'S5', moduleRef: 'ncp_process', obsNodeId: ciTeamObsId,
    description: 'Define, resource and implement the permanent corrective action.',
    assignments: [
      { type: 'A', ...role('quality_manager') },
      { type: 'R', ...role('action_owner') },
      { type: 'C', ...role('ci_pilot') },
      { type: 'S', ...role('department_head') },
      { type: 'I', ...role('auditor') },
    ],
  });
  activity({
    code: 'RACSI-S6', title: 'S6 — Effectiveness Evaluation', ncpStage: 'S6', moduleRef: 'ncp_process', obsNodeId: govObsId,
    description: 'Verify, after the monitoring period, that the corrective action actually worked.',
    assignments: [
      { type: 'A', ...user(users.evaluator) },
      { type: 'R', ...user(users.evaluator) },
      { type: 'C', ...role('ci_pilot') },
      { type: 'S', ...role('quality_manager') },
      { type: 'I', ...role('auditor') },
    ],
  });
  activity({
    code: 'RACSI-S7', title: 'S7 — Capitalization (REX)', ncpStage: 'S7', moduleRef: 'ncp_process', obsNodeId: govObsId,
    description: 'Publish lessons learned to the Capitalization Library; decide on standardization/generalization.',
    assignments: [
      { type: 'A', ...role('quality_manager') },
      { type: 'R', ...role('ci_pilot') }, { type: 'R', ...user(users.team1) },
      { type: 'C', ...user(users.depthead) },
      { type: 'S', ...user(users.admin) },
      { type: 'I', ...role('auditor') },
    ],
  });

  // Governance activities linked directly to a Business Rule, a Control and a Risk/Opportunity,
  // so RACSI (item 3/4) is visibly tied into the other GRC modules (item 2), not just the S1-S7 flow.
  if (businessRuleIds['BR-001']) {
    activity({
      code: 'RACSI-BR-001', title: 'Governance: Enforce BR-001 (AR/AE Segregation)', moduleRef: 'business_rule',
      linkedRecordId: businessRuleIds['BR-001'], obsNodeId: govObsId,
      description: 'Own the ongoing enforcement and periodic review of the AR/AE segregation-of-duties business rule.',
      assignments: [
        { type: 'A', ...user(users.quality) },
        { type: 'R', ...role('ci_pilot') },
        { type: 'C', ...role('auditor') },
        { type: 'S', ...user(users.cipilot) },
        { type: 'I', ...role('department_head') },
      ],
    });
  }
  if (controlIds['C-001']) {
    activity({
      code: 'RACSI-C-001', title: 'Governance: Test Control C-001 (Segregation of Duties)', moduleRef: 'control',
      linkedRecordId: controlIds['C-001'], obsNodeId: govObsId,
      description: 'Perform and document the periodic effectiveness test of Control C-001.',
      assignments: [
        { type: 'A', ...user(users.quality) },
        { type: 'R', ...role('auditor') },
        { type: 'C', ...user(users.cipilot) },
        { type: 'S', ...role('department_head') },
        { type: 'I', ...role('admin') },
      ],
    });
  }
  if (riskIds['R-001']) {
    activity({
      code: 'RACSI-R-001', title: 'Governance: Mitigate R-001 (Skipping S7 Capitalization)', moduleRef: 'risk_opportunity',
      linkedRecordId: riskIds['R-001'], obsNodeId: govObsId,
      description: 'Own the mitigation plan and residual-risk monitoring for R-001.',
      assignments: [
        { type: 'A', ...user(users.quality) },
        { type: 'R', ...user(users.cipilot) },
        { type: 'C', ...role('auditor') },
        { type: 'S', ...role('department_head') },
        { type: 'I', ...role('admin') },
      ],
    });
  }
}

function seedBpmnForOrg(orgId, users, obsNodeId) {
  db.prepare(`
    INSERT INTO bpmn_diagrams (id, organization_id, code, title, description, xml, obs_node_id, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(), orgId, 'BPMN-NCP-01', 'NCP Solver Process (S1-S7)',
    'The end-to-end non-conformity resolution process, from detection through capitalization, including the effectiveness-evaluation loop back to the corrective action plan.',
    NCP_PROCESS_BPMN_XML, obsNodeId, users.quality,
  );
}

function seedOrganization({ id, groupId, name, name_fr, name_ar, sector, sectorType, country, planTier, deploymentModel, domain, language, licenseOptions }) {
  db.prepare(`
    INSERT INTO organizations (id, group_id, name, name_fr, name_ar, sector, sector_type, country, logo_color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, '#F8931D')
  `).run(id, groupId || null, name, name_fr || null, name_ar || null, sector, sectorType, country);

  const roleIds = seedRolesForOrg(id);
  const templates = SECTOR_TEMPLATES[sector];
  const departments = [...new Set(templates.map((t) => t.department))];
  const obsByName = seedObsForOrg(id, departments);
  const users = seedUsersForOrg(id, domain, roleIds, language, obsByName);
  const standardTitles = [...new Set(templates.map((t) => t.standard).filter(Boolean))];
  const standardIds = seedStandardsForOrg(id, standardTitles.length ? standardTitles : ['ISO 9001:2015 Quality Management'], planTier);
  seedLicenseAndGovernance(id, planTier, deploymentModel, licenseOptions || {});
  const ficheIds = seedFichesForOrg(id, sector, obsByName, users, standardIds);
  seedAiUseCasesForOrg(id, sector, users, planTier);
  const govObsId = governanceObsId(obsByName);
  const businessRuleIds = seedBusinessRulesForOrg(id, users, govObsId);
  const controlIds = seedControlsForOrg(id, users, govObsId);
  const riskIds = seedRisksForOrg(id, users, controlIds, govObsId);
  seedRacsiForOrg(id, users, roleIds, obsByName, businessRuleIds, controlIds, riskIds);
  seedBpmnForOrg(id, users, govObsId);
  seedSheetTemplatesForOrg(id, sector, users);
  seedProjectsForOrg(id, sector);
  seedCustomKpisForOrg(id, users);
  seedAlertsForOrg(id, users, ficheIds, sector);
  if (licenseOptions?.complianceGdpr) activateComplianceModuleSafe(id, 'gdpr');
  if (licenseOptions?.complianceIso27001) activateComplianceModuleSafe(id, 'iso27001');
  if (licenseOptions?.complianceSoc2) activateComplianceModuleSafe(id, 'soc2');
  return { id, users, roleIds };
}

export function runSeed() {
  console.log('Seeding NCP Solver demo data...');
  const tx = db.transaction(() => {
    for (const t of TABLES_IN_DELETE_ORDER) db.prepare(`DELETE FROM ${t}`).run();
    ficheCounters = {};
    actionCounters = {};

    seedPermissions();

    // --- Independent companies (no group) ---
    seedOrganization({
      id: randomUUID(), name: 'National Infrastructure Authority', name_fr: 'Autorité Nationale des Infrastructures', name_ar: 'الهيئة الوطنية للبنية التحتية',
      sector: 'public_infrastructure', sectorType: 'public', country: 'Morocco', planTier: 'assure', deploymentModel: 'onprem', domain: 'nia', language: 'fr',
      licenseOptions: { supportTier: 'premium', complianceIso27001: true, complianceGdpr: true },
    });
    seedOrganization({
      id: randomUUID(), name: 'Solaris Precision Manufacturing', name_fr: 'Solaris Manufacture de Précision', name_ar: 'سولاريس للتصنيع الدقيق',
      sector: 'manufacturing', sectorType: 'private', country: 'Morocco', planTier: 'govern', deploymentModel: 'saas', domain: 'solaris', language: 'en',
      licenseOptions: { supportTier: 'priority', addonCapitalization: true },
    });
    seedOrganization({
      id: randomUUID(), name: 'GreenValley AgroBusiness Co.', name_fr: 'GreenValley Agro-Industrie', name_ar: 'شركة جرين فالي للأعمال الزراعية',
      sector: 'agro_business', sectorType: 'private', country: 'Morocco', planTier: 'govern', deploymentModel: 'saas', domain: 'greenvalley', language: 'fr',
      licenseOptions: { supportTier: 'standard' },
    });
    seedOrganization({
      id: randomUUID(), name: 'Horizon Real Estate Developers', name_fr: 'Horizon Promotion Immobilière', name_ar: 'هورايزون للتطوير العقاري',
      sector: 'real_estate', sectorType: 'private', country: 'UAE', planTier: 'resolve', deploymentModel: 'saas', domain: 'horizon', language: 'ar',
      licenseOptions: { supportTier: 'standard' },
    });

    // --- Group of companies ---
    const groupId = randomUUID();
    db.prepare(`INSERT INTO groups (id, name, name_fr, name_ar, description, sector) VALUES (?, ?, ?, ?, ?, ?)`).run(
      groupId, 'Meridian Group Holding', 'Groupe Meridian Holding', 'مجموعة ميريديان القابضة',
      'Diversified holding group spanning manufacturing, agro-business and real estate development subsidiaries.',
      'diversified_holding',
    );
    seedOrganization({
      id: randomUUID(), groupId, name: 'Meridian Industrial Manufacturing', name_fr: 'Meridian Manufacture Industrielle', name_ar: 'ميريديان للتصنيع الصناعي',
      sector: 'manufacturing', sectorType: 'private', country: 'Morocco', planTier: 'assure', deploymentModel: 'saas', domain: 'meridian-mfg', language: 'en',
      licenseOptions: { supportTier: 'premium', complianceGdpr: true, complianceIso27001: true, complianceSoc2: true },
    });
    seedOrganization({
      id: randomUUID(), groupId, name: 'Meridian AgroBusiness', name_fr: 'Meridian Agro-Industrie', name_ar: 'ميريديان للأعمال الزراعية',
      sector: 'agro_business', sectorType: 'private', country: 'Morocco', planTier: 'assure', deploymentModel: 'saas', domain: 'meridian-agro', language: 'fr',
      licenseOptions: { supportTier: 'priority' },
    });
    seedOrganization({
      id: randomUUID(), groupId, name: 'Meridian Real Estate Development', name_fr: 'Meridian Promotion Immobilière', name_ar: 'ميريديان للتطوير العقاري',
      sector: 'real_estate', sectorType: 'private', country: 'Morocco', planTier: 'assure', deploymentModel: 'saas', domain: 'meridian-re', language: 'en',
      licenseOptions: { supportTier: 'priority' },
    });

    // --- Sector showcase organizations (25+ NCP sheets each), for demos and
    // cross-industry screenshot capture. See sectorShowcaseTemplates.js. ---
    for (const def of SHOWCASE_ORG_DEFS) {
      seedOrganization({ id: randomUUID(), ...def });
    }
  });
  tx();
  console.log('Seed complete.');
  console.log(`Demo login password for every seeded user: ${DEMO_PASSWORD}`);
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed();
}
