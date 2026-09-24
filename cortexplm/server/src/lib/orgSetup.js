// Standard content every organization starts with (FR-DA-AI-02 and the seeded governance catalog), shared by
// the demonstration seed and by "Add organization": OBS departments, business rules, COSO controls, risks,
// custom KPIs, RACSI, one BPMN diagram per E2E process, the AI use case library, the checklist template library
// per gate and track, project templates, and optionally a starting team with one person per standard role.
import bcrypt from 'bcryptjs';
import { q } from '../db.js';
import { DLV, E2E, E2E_IDS, D01, STEP, MP, GATE, GATE_OF_E2E, TRACKS } from './ref.js';
import { checklistTemplate } from './lifecycle.js';
import { snapshot } from './audit.js';
import { bpmnFor } from '../seed/bpmn.js';

export const PEOPLE = [
  ['exec', 'Executive Sponsor', ['R01']], ['board1', 'Gate Review Board Member', ['R02']], ['board2', 'Gate Review Board Member', ['R02']],
  ['pm1', 'Product Manager', ['R03']], ['pm2', 'Product Manager', ['R03']], ['portfolio', 'Portfolio Manager', ['R04']],
  ['engineering', 'Engineering Lead', ['R05']], ['operations', 'Manufacturing / Operations Engineer', ['R06']], ['quality', 'Quality Manager', ['R07']],
  ['compliance', 'Regulatory & Compliance Officer', ['R08']], ['legal', 'Legal & IP Counsel', ['R09']], ['finance', 'Finance Controller', ['R10']],
  ['procurement', 'Procurement & Supplier Manager', ['R11']], ['marketing', 'Marketing & Sales Manager', ['R12']], ['service', 'Service Manager', ['R13']],
  ['technician', 'Field Service Technician', ['R14']], ['sustainability', 'Sustainability Officer', ['R15']], ['data', 'Data & AI Specialist', ['R16']],
  ['process', 'Process Owner / Track Administrator', ['R17']], ['admin', 'Platform Administrator', ['R18']], ['training', 'Customer Success & Training Manager', ['R19']],
  ['supplier', 'Supplier (External Portal)', ['R20']], ['customer', 'Customer (External Portal)', ['R21']], ['auditor', 'Internal Auditor', ['R22']],
];
export const DEPT_OF = { exec: 'Portfolio Office', board1: 'Portfolio Office', board2: 'Portfolio Office', pm1: 'Portfolio Office', pm2: 'Portfolio Office', portfolio: 'Portfolio Office', engineering: 'Engineering', operations: 'Operations', quality: 'Quality', compliance: 'Quality', legal: 'Portfolio Office', finance: 'Finance', procurement: 'Operations', marketing: 'Marketing & Sales', service: 'Service', technician: 'Service', sustainability: 'Operations', data: 'IT & Data', process: 'Portfolio Office', admin: 'IT & Data', training: 'Service', supplier: null, customer: null, auditor: 'Finance' };
export const DEPARTMENTS = ['Portfolio Office', 'Engineering', 'Operations', 'Quality', 'Finance', 'Marketing & Sales', 'Service', 'IT & Data'];
const FIRST = ['Amina', 'Youssef', 'Claire', 'Omar', 'Sofia', 'Karim', 'Leila', 'Thomas', 'Nadia', 'Hassan', 'Julie', 'Rachid', 'Emma', 'Samir', 'Ines', 'Daniel', 'Salma', 'Marc', 'Hiba', 'Anas', 'Laura', 'Mehdi', 'Sara', 'Paul', 'Fatima', 'Adam', 'Chloe', 'Tariq', 'Maya', 'Ilyas'];
const LAST = ['Benali', 'Martin', 'El Idrissi', 'Dubois', 'Haddad', 'Lambert', 'Alaoui', 'Moreau', 'Tazi', 'Roche', 'Chraibi', 'Girard', 'Mansouri', 'Fontaine', 'Berrada', 'Nguyen', 'Kettani', 'Leroy', 'Amrani', 'Perrin', 'Saidi', 'Fournier', 'Ouazzani', 'Blanc', 'Zahiri', 'Mercier', 'Lahlou', 'Carpentier', 'Bennani', 'Garnier'];
export const personName = (orgIdx, i) => `${FIRST[(i * 7 + orgIdx * 5) % FIRST.length]} ${LAST[(i * 11 + orgIdx * 3) % LAST.length]}`;

export function createObsSkeleton(orgId, orgName) {
  const site = q.insert('obs_nodes', { org_id: orgId, name: `${orgName} - Headquarters`, type: 'Site' });
  const obs = { Site: site };
  for (const d of DEPARTMENTS) obs[d] = q.insert('obs_nodes', { org_id: orgId, parent_id: site, name: d, type: 'Department' });
  q.insert('obs_nodes', { org_id: orgId, parent_id: obs.Engineering, name: 'Design & Development Team', type: 'Team' });
  q.insert('obs_nodes', { org_id: orgId, parent_id: obs.Quality, name: 'Regulatory Affairs Team', type: 'Team' });
  return obs;
}

const COSO_OF = (c) => {
  const t = `${c.Control_Name} ${c.Description}`.toLowerCase();
  if (/segregation|policy|training|role|privileg|access right|awareness|ownership/.test(t)) return 'Control Environment';
  if (/risk|fmea|assessment|impact analysis|scoring/.test(t)) return 'Risk Assessment';
  if (/notif|report|communicat|disclos|label|publish|inform/.test(t)) return 'Information & Communication';
  if (c.Type === 'Detective') return 'Monitoring Activities';
  return 'Control Activities';
};
const LI = { 25: [5, 5], 20: [4, 5], 16: [4, 4], 15: [3, 5], 12: [3, 4], 10: [2, 5], 9: [3, 3], 8: [2, 4], 6: [2, 3] };
const ownerOfStep = (step) => D01[String(step).split('.')[0].split(',')[0].trim()]?.Owner_Role || 'Process Owner / Track Administrator';

export function seedGovernance(orgId, obs, between = (x, y) => Math.round(x + Math.random() * (y - x))) {
  const gov = obs.Quality; const eng = obs.Engineering; const pmo = obs['Portfolio Office'];
  const live = new Set(['BR-001', 'BR-002', 'BR-004', 'BR-005', 'BR-006', 'BR-007', 'BR-008', 'BR-009', 'BR-010', 'BR-011', 'BR-030']);
  const actions = Object.fromEntries(DLV['D03a Actions Registry'].map((a) => [a.Action_ID, a.Action_Name]));
  const sevOf = Object.fromEntries(DLV['D07 Alerts'].map((a) => [a.Rule_Condition, a.Severity]));
  for (const b of DLV['D03 Business Rules']) {
    const mp = b.Triggering_Step_ID.split('.')[0];
    q.insert('business_rules', { org_id: orgId, code: b.Rule_ID, triggering_step: b.Triggering_Step_ID, condition: b.Condition, action_id: b.Action_ID, action: actions[b.Action_ID], rule_type: b.Rule_Type,
      severity: sevOf[b.Rule_ID] || (b.Rule_Type === 'Escalation' ? 'High' : b.Rule_Type === 'Validation' ? 'Medium' : 'Low'), owner: ownerOfStep(b.Triggering_Step_ID), process_tag: mp,
      obs_node_id: ['MP-121', 'MP-122', 'MP-123', 'MP-124', 'MP-01'].includes(mp) ? pmo : ['MP-08', 'MP-30'].includes(mp) ? gov : eng, evaluation: live.has(b.Rule_ID) ? 'Live (engine)' : 'Catalog', active: 1 });
  }
  // D30 licensing rules
  [['RULE-LIC-001', 'MP-18', 'Licence signature does not verify', 'Reject the licence and block activation'],
    ['RULE-LIC-002', 'MP-18', 'Licence expiry date has passed', 'Block sign-in for the organization; warn 30 days ahead'],
    ['RULE-LIC-003', 'MP-18', 'Active users would exceed maxUsers', 'Refuse the new user (HTTP 409)'],
    ['RULE-LIC-004', 'MP-19', 'Add-on already active, or compliance add-on activated', 'No duplicate scaffold; show the non-certification disclosure']].forEach(([code, mp, cond, act]) =>
    q.insert('business_rules', { org_id: orgId, code, triggering_step: mp, condition: cond, action: act, rule_type: 'Validation', severity: 'High', owner: 'Platform Administrator', process_tag: mp, evaluation: 'Live (engine)', active: 1 }));
  const eff = ['Effective', 'Effective', 'Effective', 'Partially effective', 'Effective', 'Not tested'];
  DLV['D04 Controls'].forEach((c, i) => {
    q.insert('controls', { org_id: orgId, code: c.Control_ID, name: c.Control_Name, control_type: c.Type, coso_component: COSO_OF(c), testing_frequency: c.Type === 'Preventive' ? 'Quarterly' : 'Monthly',
      owner: ownerOfStep(c.Linked_Step_IDs), effectiveness: i === 13 ? 'Not effective' : eff[i % eff.length], linked_steps: c.Linked_Step_IDs, description: c.Description, process_tag: c.Linked_Step_IDs.split('.')[0], obs_node_id: gov });
  });
  [['CTRL-003', 'Licence expiry prevention', 'Preventive', 'Information & Communication', 'Warn administrators 30 days before licence expiry and raise alert SYS-02.'],
    ['CTRL-016', 'Licence file integrity check (Ed25519)', 'Preventive', 'Control Activities', 'Verify the Ed25519 signature of every OnPrem licence file; SaaS records are HMAC-signed by the server.'],
    ['CTRL-017', 'Add-on activation integrity check', 'Preventive', 'Control Activities', 'Add-on activation is idempotent and compliance add-ons require acknowledgement of the non-certification disclosure.']]
    .forEach(([code, name, type, coso, d]) => q.insert('controls', { org_id: orgId, code, name, control_type: type, coso_component: coso, testing_frequency: 'Continuous', owner: 'Platform Administrator', effectiveness: 'Effective', description: d, process_tag: 'MP-18' }));
  for (const r of DLV['D05 Risks']) {
    const [l, im] = LI[Number(r.Inherent_Score)] || [3, 4];
    q.insert('risks', { org_id: orgId, code: r.Risk_ID, name: r.Risk_Name, kind: 'Risk', category: r.Category, likelihood: l, impact: im, residual_score: Number(r.Residual_Score), mitigating_controls: r.Mitigating_Control_IDs, kri_formula: r.KRI_Formula,
      owner: r.Category.includes('AI') ? 'Data & AI Specialist' : r.Category.includes('Security') || r.Category === 'Technology' ? 'Platform Administrator' : r.Category.includes('Regul') || r.Category.includes('Compliance') ? 'Regulatory & Compliance Officer' : 'Quality Manager',
      status: Number(r.Residual_Score) <= 5 ? 'Mitigated' : 'Open', process_tag: 'MP-12', obs_node_id: gov });
  }
  q.insert('risks', { org_id: orgId, code: 'RISK-004', name: 'Licence expiry', kind: 'Risk', category: 'Commercial', likelihood: 2, impact: 5, residual_score: 4, mitigating_controls: 'CTRL-003', kri_formula: 'Days until licence expiry', owner: 'Platform Administrator', status: 'Open', process_tag: 'MP-18' });
  [['OPP-01', 'Reuse of approved design modules across product lines', 'Engineering', 3, 4], ['OPP-02', 'Bundling services with products for recurring revenue', 'Commercial', 3, 5], ['OPP-03', 'Faster gate reviews with complete evidence packs', 'Governance', 4, 3]]
    .forEach(([code, name, cat, l, im]) => q.insert('risks', { org_id: orgId, code, name, kind: 'Opportunity', category: cat, likelihood: l, impact: im, owner: 'Portfolio Manager', status: 'Open', process_tag: 'MP-01' }));
  for (const [name, formula, target, unit, owner, tag] of [
    ['Licence compliance %', 'Active users within licensed seats ÷ active users × 100 (KPI-006, D30)', '100%', '%', 'Platform Administrator', 'MP-18'],
    ['API availability', 'Minutes the API answered health checks ÷ minutes in period × 100 (KPI-011, D30)', '≥ 99.9%', '%', 'Platform Administrator', 'MP-28'],
    ['Evidence completeness at first submission', 'Gates submitted with all mandatory evidence ÷ gates submitted × 100', '≥ 95%', '%', 'Quality Manager', 'MP-122'],
  ]) q.insert('custom_kpis', { org_id: orgId, name, formula, target, unit, current_value: unit === '%' ? between(93, 100) : null, owner, process_tag: tag });
  // RACSI from the 81 user-facing tasks (exactly one Accountable each)
  for (const e of E2E_IDS) for (const t of E2E[e].tasks) {
    const id = q.insert('racsi_activities', { org_id: orgId, name: `${t.id} ${t.name}`, process_tag: e, linked_type: 'UFT', linked_id: t.id, obs_node_id: pmo });
    for (const letter of ['R', 'A', 'C', 'S', 'I']) q.insert('racsi_assignments', { activity_id: id, letter, assignee_type: 'role', assignee: t[letter] });
  }
  for (const e of E2E_IDS) q.insert('bpmn_diagrams', { org_id: orgId, title: `${e} ${E2E[e].name}`, description: `Core process model: ${E2E[e].goal}`, xml: bpmnFor(e), e2e_id: e, obs_node_id: pmo });
}

export function seedAiUseCases(orgId) {
  const ctx = { orgId, user: { id: null, name: 'System' } };
  for (const a of DLV['D15 AI Use Cases']) {
    const step = STEP[a.Linked_Step_ID];
    const mp = MP[step?.Parent_Macro_Process_ID];
    const id = q.insert('ai_use_cases', {
      org_id: orgId, code: a.AIUC_ID, name: a.Use_Case_Name, linked_step: a.Linked_Step_ID, model_task_type: a.Model_Task_Type,
      tier: a.Risk_Level === 'High' ? 'Augmented' : 'Assistive', risk_level: a.Risk_Level, human_checkpoint: a.Human_in_the_Loop_Checkpoint, activation_scope: a.Activation_Scope,
      is_custom: a.Is_Custom === 'True' ? 1 : 0, based_on: a.Based_On_AI_Use_Case_ID === '—' ? null : a.Based_On_AI_Use_Case_ID, approval_status: a.Approval_Status,
      module: mp ? `${mp.id} ${mp.name}` : '', trigger_text: step ? `When step ${step.Step_ID} "${step.Step_Name}" runs` : 'On request',
      expected_output: `${a.Model_Task_Type} result presented for human review`,
      prompt_template: `Assist with "${step?.Step_Name || a.Use_Case_Name}". Use only the record data and the retrieved references. Human checkpoint: ${a.Human_in_the_Loop_Checkpoint} (starter template; final template reference pending D19c).`,
      active: a.Approval_Status === 'Pending Approval' ? 0 : 1,
    });
    snapshot(ctx, 'ai_use_case', id, q.get('SELECT * FROM ai_use_cases WHERE id = ?', id), 'Version 1 (seeded catalog, D15).');
    if (['AIUC-12', 'AIUC-08'].includes(a.AIUC_ID)) {
      q.run('UPDATE ai_use_cases SET human_checkpoint = ? WHERE id = ?', `${a.Human_in_the_Loop_Checkpoint} Reviewer name and decision are recorded in the gate pack.`, id);
      snapshot(ctx, 'ai_use_case', id, q.get('SELECT * FROM ai_use_cases WHERE id = ?', id), 'Clarified the human checkpoint wording.');
    }
  }
}


// Checklist template library: one standard template per gate and track, linked to its gate.
export function seedStandardChecklists(orgId, userId) {
  const ctx = { orgId, user: { id: userId, name: 'Process Owner' } };
  for (const track of ['Full', 'Light', 'Fast']) {
    for (const gate of TRACKS[track].gates) {
      const e2e = Object.keys(GATE_OF_E2E).find((e) => GATE_OF_E2E[e] === gate);
      const items = checklistTemplate(e2e, gate, track).map(({ text, source, mandatory }) => ({ text, source, mandatory, evidence_required: mandatory }));
      const id = q.insert('checklist_templates', { org_id: orgId, created_by: userId, name: `${gate} ${track} Track standard checklist`, track, gate, items, auto_apply: 1,
        description: `Linked to gate ${gate} (${GATE[gate].closes}): copied into the checklist when the gate opens on the ${track} Track. Minimum gate evidence plus evidence of the steps run before the gate.` });
      snapshot(ctx, 'checklist_template', id, q.get('SELECT * FROM checklist_templates WHERE id = ?', id), 'Version 1.');
    }
  }
}

// Sector checklist templates added on demand from a gate (not linked automatically). "(mandatory)" marks mandatory items.
export const SECTOR_CHECKLISTS = { // keyed by sector
  'Public Sector': [
    ['T3', ['Full', 'Light'], 'Public service accessibility and procurement pack', ['WCAG 2.1 AA audit report of the citizen-facing screens (mandatory)', 'Data protection impact assessment signed by the data protection officer (mandatory)', 'Public procurement award decision and contract reference', 'Service-level agreement with the operating department', 'Citizen communication plan approved by the communications office']],
    ['T5', ['Full', 'Light'], 'Public service launch readiness', ['Counter staff trained on the new service (mandatory)', 'Help-desk scripts published', 'Open data publication checked for personal data']],
  ],
  'Manufacturing': [
    ['T2', ['Full', 'Light'], 'Precast product design verification pack', ['Structural calculation checked by an independent engineer (mandatory)', 'Mould design and cycle-time study', 'Fire-resistance classification test plan', 'Raw material supplier qualification records']],
    ['T4', ['Full'], 'Factory industrialisation readiness', ['First-article inspection report (mandatory)', 'Curing procedure validated for summer temperatures (mandatory)', 'Lifting and handling risk assessment', 'Operator work instructions released in the MES']],
  ],
  'Healthcare': [
    ['T3', ['Full', 'Light'], 'Medical device regulatory file check', ['Clinical evaluation report (mandatory)', 'Usability engineering file (mandatory)', 'Risk management file per ISO 14971 (mandatory)', 'Cybersecurity assessment of connected functions', 'Post-market surveillance plan']],
    ['T5', ['Full', 'Light'], 'Clinical service go-live pack', ['Clinical staff competence records (mandatory)', 'Patient information leaflet approved', 'Adverse event reporting route tested']],
  ],
  'Agro-Business - Dairy Products': [
    ['T3', ['Full', 'Light', 'Fast'], 'Food safety and labelling pack', ['HACCP plan updated for the new product (mandatory)', 'Shelf-life study results (mandatory)', 'Label reviewed against the food labelling regulation (mandatory)', 'Allergen cross-contact assessment', 'Cold-chain distribution trial report']],
    ['T4', ['Full'], 'Dairy line trial readiness', ['Line trial with three consecutive good batches (mandatory)', 'Cleaning-in-place validation', 'Milk supply volume confirmed with the cooperative']],
  ],
  'Transportation': [
    ['T3', ['Full', 'Light'], 'Transit safety case pack', ['Safety case accepted by the transport safety authority (mandatory)', 'Accessibility review for passengers with reduced mobility', 'Interoperability test report with the fare systems', 'Operator training plan']],
    ['T5', ['Full', 'Light'], 'Transit service launch readiness', ['Timetable published and communicated (mandatory)', 'Incident management procedure updated', 'Spare parts stock confirmed']],
  ],
  'Oil, Gas & Energy': [
    ['T2', ['Full', 'Light'], 'Process safety design review', ['HAZOP study closed out (mandatory)', 'SIL assessment of the safety functions (mandatory)', 'Environmental impact screening', 'Pressure equipment design verification']],
    ['T5', ['Full'], 'Energy asset commissioning pack', ['Pre-start-up safety review signed (mandatory)', 'Permit-to-work procedure updated', 'Emergency response drill completed']],
  ],
  'Real Estate Development': [
    ['T2', ['Full', 'Light'], 'Off-plan launch readiness (escrow and permits)', ['Building permit issued (mandatory)', 'Off-plan sales licence issued (mandatory)', 'Escrow account opened with the bank (mandatory)', 'Sales price list approved by the finance committee', 'Master plan zoning approval']],
    ['T5', ['Full', 'Light'], 'Handover readiness pack', ['Snagging walk-through completed with the contractor (mandatory)', 'Occupancy certificate issued (mandatory)', 'Facility management contract signed', 'Owners association set up']],
  ],
};

export function seedSectorChecklists(orgId, industry, userId) {
  const ctx = { orgId, user: { id: userId, name: 'Process Owner' } };
  for (const [gate, tracks, name, list] of SECTOR_CHECKLISTS[industry] || []) {
    for (const track of tracks) {
      if (!TRACKS[track].gates.includes(gate)) continue;
      const items = list.map((x) => { const mandatory = /\(mandatory\)$/.test(x) ? 1 : 0; return { text: x.replace(/\s*\(mandatory\)$/, ''), mandatory, evidence_required: mandatory, source: `${industry} practice` }; });
      const id = q.insert('checklist_templates', { org_id: orgId, created_by: userId, name, track, gate, items, auto_apply: 0, description: `${industry} items added from the gate when the project needs them.` });
      snapshot(ctx, 'checklist_template', id, q.get('SELECT * FROM checklist_templates WHERE id = ?', id), 'Version 1.');
    }
  }
}

// Project templates (FR-DA-TPL, Rule R4 recommended optional sets).
export function seedProjectTemplates(orgId, userId) {
  const tpl = [
    ['Regional variant (Rule R4)', 'Light Track starting point for a regional variant; adds MP-30, MP-39 and MP-22.', { offer_type: 'Product', scores: { strategic: 3, investment: 3, novelty: 2, regulatory: 3, market: 4, reach: 3, integration: 2 }, optional_mps: ['MP-30', 'MP-39', 'MP-22'], description: 'Regional variant of an existing offer.' }],
    ['Service upgrade', 'Light Track starting point for service upgrades; adds service catalog, incident and quality processes.', { offer_type: 'Service', scores: { strategic: 3, investment: 2, novelty: 3, regulatory: 2, market: 3, reach: 4, integration: 3 }, optional_mps: ['MP-18', 'MP-23', 'MP-25'], description: 'Upgrade of an existing service.' }],
    ['Minor change (Fast Track)', 'Fast Track starting point for cosmetic, packaging or documentation changes.', { offer_type: 'Product', scores: { strategic: 2, investment: 1, novelty: 1, regulatory: 2, market: 2, reach: 2, integration: 1 }, optional_mps: ['MP-20'], description: 'Minor change to an existing product.' }],
  ];
  for (const [name, description, payload] of tpl) {
    const id = q.insert('templates', { org_id: orgId, kind: 'Project', name, description, payload });
    snapshot({ orgId, user: { id: userId, name: 'Process Owner' } }, 'template', id, q.get('SELECT * FROM templates WHERE id = ?', id), 'Version 1.');
  }
}

// One account per standard role, e-mail <alias>@<domain>, placed in its department with its role.
export function createStarterTeam(orgId, obs, domain, password, orgIdx = 0, { languageOf = () => null, createdAt } = {}) {
  const hash = bcrypt.hashSync(password, 10);
  const people = {};
  PEOPLE.forEach(([alias, title, roles], i) => {
    const email = `${alias}@${domain}`;
    if (q.get('SELECT id FROM users WHERE email = ?', email)) throw Object.assign(new Error(`The e-mail ${email} is already used. Choose another domain.`), { status: 409 });
    const id = q.insert('users', { org_id: orgId, name: personName(orgIdx, i), email, password_hash: hash, language: languageOf(alias), title, obs_node_id: DEPT_OF[alias] ? obs[DEPT_OF[alias]] : null, ...(createdAt ? { created_at: createdAt } : {}) });
    for (const r of roles) q.insert('user_roles', { user_id: id, role_id: r });
    if (DEPT_OF[alias]) q.insert('obs_members', { org_id: orgId, obs_node_id: obs[DEPT_OF[alias]], user_id: id, role_id: roles[0], project_role: title });
    people[alias] = id;
  });
  return people;
}

// Everything a new organization needs to run projects on day one.
export function provisionOrganization(orgId, orgName, { domain, password, orgIdx, industry } = {}) {
  q.run("INSERT OR IGNORE INTO governance_settings (org_id, key, value) VALUES (?, 'justification_required', '1')", orgId);
  q.run("INSERT OR IGNORE INTO governance_settings (org_id, key, value) VALUES (?, 'light_observation_days', '182')", orgId);
  const obs = createObsSkeleton(orgId, orgName);
  const people = domain ? createStarterTeam(orgId, obs, domain, password, orgIdx ?? orgId) : {};
  seedGovernance(orgId, obs);
  seedAiUseCases(orgId);
  seedStandardChecklists(orgId, people.process || null);
  seedSectorChecklists(orgId, industry, people.process || null);
  seedProjectTemplates(orgId, people.process || null);
  return { obs, people };
}
