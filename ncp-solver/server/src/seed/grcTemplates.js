// Governance/Risk/Compliance seed content: Business Rules, COSO Controls, and
// Risks & Opportunities that govern the NCP Solver process itself (not the
// underlying sector non-conformities, which live in sectorTemplates.js).

export const BUSINESS_RULE_TEMPLATES = [
  {
    code: 'BR-001', title: 'AR and AE Must Differ', rule_type: 'validation', applies_to_module: 'action', severity: 'blocking', ncp_stage: 'S6',
    condition_text: "An Evaluator (AE) is being assigned or recorded on an action's effectiveness review.",
    action_text: 'Block the evaluation if the AE is the same user as the action\'s Action Responsible (AR); objectivity requires an independent reviewer.',
  },
  {
    code: 'BR-002', title: 'REX Required Before Closure', rule_type: 'workflow', applies_to_module: 'fiche', severity: 'blocking', ncp_stage: 'S7',
    condition_text: 'An NCP sheet is being moved to status CLOSED (S7).',
    action_text: 'Require a completed REX entry (lessons learned) before the status change is allowed, unless disabled in Governance Settings.',
  },
  {
    code: 'BR-003', title: 'High-Priority Immediate Alert', rule_type: 'workflow', applies_to_module: 'fiche', severity: 'blocking', ncp_stage: 'S1',
    condition_text: 'A new NCP sheet is created with criticality = High or priority = 1.',
    action_text: 'Immediately notify the CI Pilot and NCP team (Alert A, in-app + email URGENT).',
  },
  {
    code: 'BR-004', title: 'Root Cause Analysis Deadline', rule_type: 'threshold', applies_to_module: 'fiche', severity: 'warning', ncp_stage: 'S4',
    condition_text: '48 hours have elapsed since detection and no root cause has been recorded.',
    action_text: 'Trigger Alert D to the CI Pilot to prompt root cause analysis (S4) to start.',
  },
  {
    code: 'BR-005', title: 'Sheet Numbering Convention', rule_type: 'naming', applies_to_module: 'fiche', severity: 'info', ncp_stage: 'S1',
    condition_text: 'A new NCP sheet is created.',
    action_text: 'Auto-generate a unique number in the format NC-{year}-{4-digit sequence}, unique per tenant.',
  },
  {
    code: 'BR-006', title: 'Mandatory 5W2H Before Containment', rule_type: 'approval', applies_to_module: 'fiche', severity: 'warning', ncp_stage: 'S2',
    condition_text: 'A team attempts to advance a sheet from S1 (Detection) to S3 (Immediate Actions).',
    action_text: 'Require the S2 Problem Understanding (5W2H) section to be completed first, so containment actions are grounded in a clear problem definition.',
  },
];

export const CONTROL_TEMPLATES = [
  {
    code: 'C-001', title: 'Segregation of Duties: Execution vs. Evaluation', coso_component: 'control_activities', control_type: 'preventive', frequency: 'continuous', ncp_stage: 'S6',
    effectiveness: 'effective', evidence_notes: 'Enforced by RBAC and the AR ≠ AE system validation on every action evaluation (BR-001).',
  },
  {
    code: 'C-002', title: 'Tenant Data Isolation Review', coso_component: 'control_environment', control_type: 'preventive', frequency: 'quarterly', ncp_stage: null,
    effectiveness: 'effective', evidence_notes: 'Quarterly review confirming every API query is scoped by tenant_id / organization_id with no cross-tenant leakage path.',
  },
  {
    code: 'C-003', title: 'NCP Risk Assessment Review', coso_component: 'risk_assessment', control_type: 'detective', frequency: 'quarterly', ncp_stage: 'S4',
    effectiveness: 'partially_effective', evidence_notes: 'Quarterly review of the Risks & Opportunities register for new/changed risk items tied to recurring non-conformities.',
  },
  {
    code: 'C-004', title: 'Permission Matrix Periodic Review', coso_component: 'monitoring_activities', control_type: 'detective', frequency: 'quarterly', ncp_stage: null,
    effectiveness: 'effective', evidence_notes: 'Admin reviews the role x permission matrix each quarter to confirm least-privilege is maintained as roles evolve.',
  },
  {
    code: 'C-005', title: 'Audit Trail Completeness Check', coso_component: 'information_communication', control_type: 'detective', frequency: 'monthly', ncp_stage: null,
    effectiveness: 'effective', evidence_notes: 'Automated check that every CREATE/UPDATE/DELETE on a major entity produced a corresponding audit_logs row.',
  },
  {
    code: 'C-006', title: 'KPI Threshold Breach Escalation', coso_component: 'monitoring_activities', control_type: 'detective', frequency: 'monthly', ncp_stage: null,
    effectiveness: 'effective', evidence_notes: 'Alert F fires to Direction + CI Pilot whenever a monthly KPI falls below its configured Governance Settings threshold.',
  },
  {
    code: 'C-007', title: 'REX Capitalization Completeness', coso_component: 'control_activities', control_type: 'corrective', frequency: 'monthly', ncp_stage: 'S7',
    effectiveness: 'partially_effective', evidence_notes: 'Monthly check of the % of closed sheets missing a REX entry, feeding KPI7 (Standardization Rate) and KPI8 (Generalization Rate).',
  },
];

export const RISK_TEMPLATES = [
  {
    code: 'R-001', title: 'Skipping S7 Capitalization', ncp_stage: 'S7', item_type: 'risk', category: 'operational', likelihood: 3, impact: 4,
    description: 'Teams reach S6 (actions effective) and treat the problem as closed without completing S7, so lessons learned are lost and the Capitalization Library / RAG suggestions stay weak.',
    response_strategy: 'reduce', mitigation_plan: 'Enforce BR-002 (REX required before closure) and monitor via control C-007; the REX Generation Agent auto-drafts the narrative to lower the effort barrier.',
    status: 'monitoring', controls: ['C-007'],
  },
  {
    code: 'R-002', title: 'Alert Fatigue Reducing Response Time', ncp_stage: null, item_type: 'risk', category: 'operational', likelihood: 3, impact: 3,
    description: 'A high volume of Alerts A-J across many open sheets can desensitize CI Pilots and Action Owners, delaying response to genuinely urgent items.',
    response_strategy: 'reduce', mitigation_plan: 'Tune alert thresholds and channel routing per role in Governance Settings; monitor via KPI threshold control C-006.',
    status: 'monitoring', controls: ['C-006'],
  },
  {
    code: 'R-003', title: 'Cross-Tenant Data Leakage', ncp_stage: null, item_type: 'risk', category: 'compliance', likelihood: 2, impact: 5,
    description: 'A defect in tenant-scoping logic (RBAC, RAG retrieval, or reporting queries) could expose one organization\'s NCP data to another.',
    response_strategy: 'reduce', mitigation_plan: 'Mandatory tenant_id filter on every query, enforced and reviewed quarterly via control C-002.',
    status: 'mitigating', controls: ['C-002'],
  },
  {
    code: 'R-004', title: 'AI Recommendation Over-Reliance', ncp_stage: null, item_type: 'risk', category: 'strategic', likelihood: 2, impact: 3,
    description: 'Teams could accept AI agent suggestions (classification, root cause, corrective action) without independent validation, propagating a wrong diagnosis.',
    response_strategy: 'reduce', mitigation_plan: '"AI Assists, Humans Decide" principle enforced by design: every suggestion is logged with a confidence score (AIAgentLog) and requires human action to apply.',
    status: 'monitoring', controls: [],
  },
  {
    code: 'O-001', title: 'Generalizing Proven Corrective Actions Group-Wide', ncp_stage: 'S7', item_type: 'opportunity', category: 'strategic', likelihood: 4, impact: 4,
    description: 'Corrective actions proven effective at one site/organization within a Group could be proactively rolled out to sibling organizations before they experience the same problem.',
    response_strategy: 'exploit', mitigation_plan: 'Use Capitalization Library RAG search across the Group\'s closed sheets to identify high-confidence generalization candidates; track via KPI8.',
    status: 'assessing', controls: [],
  },
  {
    code: 'O-002', title: 'Composable Modules Reused in Other Applications', ncp_stage: null, item_type: 'opportunity', category: 'strategic', likelihood: 3, impact: 4,
    description: 'The Action Register, Alert Engine, RBAC layer, and Audit Trail Service are designed to be composable and could be reused by other enterprise applications (Risk Management, Audit Management, Project Management) with zero additional development.',
    response_strategy: 'exploit', mitigation_plan: 'Expose these modules via the existing shared API contract per the composability guide; pilot with one sibling application.',
    status: 'identified', controls: [],
  },
  {
    code: 'R-005', title: 'Mis-Triage at Detection Delays Response', ncp_stage: 'S1', item_type: 'risk', category: 'operational', likelihood: 3, impact: 3,
    description: 'A detector under-rates the criticality of a new NCP sheet at S1, so it does not receive the urgent routing/alerting a genuinely high-criticality issue warrants.',
    response_strategy: 'reduce', mitigation_plan: 'Classification Agent suggests criticality/priority from similar past sheets at S1 creation; CI Pilot spot-checks self-rated Medium/Low sheets weekly.',
    status: 'monitoring', controls: [],
  },
  {
    code: 'R-006', title: 'Incomplete 5W2H Weakens Root Cause Analysis', ncp_stage: 'S2', item_type: 'risk', category: 'operational', likelihood: 3, impact: 3,
    description: 'Teams rush the S2 Problem Understanding (5W2H/QQOQCCP) step to reach containment faster, leaving gaps that make S4 root cause analysis less reliable.',
    response_strategy: 'reduce', mitigation_plan: 'BR-006 requires 5W2H completion before advancing past S2; Problem Structuring Agent proposes a draft from similar past sheets to lower the effort barrier.',
    status: 'monitoring', controls: [],
  },
  {
    code: 'R-007', title: 'Containment Action Masking the Real Problem', ncp_stage: 'S3', item_type: 'risk', category: 'operational', likelihood: 2, impact: 4,
    description: 'An immediate containment action (e.g. quarantine, rework) resolves the symptom effectively enough that momentum toward S4 root cause analysis is lost.',
    response_strategy: 'reduce', mitigation_plan: 'BR-004 triggers Alert D if root cause analysis has not started 48h after detection, regardless of containment status.',
    status: 'monitoring', controls: ['C-003'],
  },
  {
    code: 'O-003', title: 'Recurring Root Cause Patterns Feed Preventive Action', ncp_stage: 'S4', item_type: 'opportunity', category: 'operational', likelihood: 3, impact: 4,
    description: 'Root causes recorded at S4 across many sheets can be mined for recurring 6M categories (e.g. repeated "machine" causes on one asset), surfacing a preventive-maintenance opportunity before further non-conformities occur.',
    response_strategy: 'exploit', mitigation_plan: 'Quarterly Risk Assessment Review (C-003) screens the Root Cause log for repeat categories/assets and raises a new Risk or Control when a pattern emerges.',
    status: 'assessing', controls: ['C-003'],
  },
  {
    code: 'R-008', title: 'Corrective Action Plan Underfunded or Understaffed', ncp_stage: 'S5', item_type: 'risk', category: 'operational', likelihood: 3, impact: 4,
    description: 'A corrective action plan at S5 is approved in principle but not given the budget/cross-functional resources it needs, so it stalls in "to do" status.',
    response_strategy: 'reduce', mitigation_plan: 'Action Plan Monitoring Report flags actions with no movement against their planned completion date; overdue corrective actions trigger Alert B.',
    status: 'monitoring', controls: [],
  },
  {
    code: 'R-009', title: 'Effectiveness Review Rubber-Stamped', ncp_stage: 'S6', item_type: 'risk', category: 'operational', likelihood: 2, impact: 4,
    description: 'An S6 effectiveness evaluation is marked "effective" without genuinely re-testing whether the non-conformity recurs, undermining confidence in the closure decision.',
    response_strategy: 'reduce', mitigation_plan: 'BR-001 enforces AR ≠ AE independence on every evaluation; Evaluation Assistant surfaces the historical effectiveness rate for similar actions as a sanity check.',
    status: 'monitoring', controls: ['C-001'],
  },
];
