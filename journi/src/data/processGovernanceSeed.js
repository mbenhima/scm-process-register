// D-Config item 6: per-process governance — Alerts, Business Rules, Controls
// (COSO-tagged), KPIs, Reports, and Risks & Opportunities, attached to each
// Macro Process in the M4 Process Registry catalog (macroProcesses.js).
// This is a *runtime* collection (lives in data.processGovernance, fully
// CRUD-able from the Process Registry's Governance tab, RBAC-gated by
// canManageProcessGovernance) — distinct from the static macro-process
// catalog itself, the same way data.racsiGrid is a runtime layer on top of
// the static macroProcessCatalog import.
//
// COSO components (2013 Internal Control – Integrated Framework), used to
// tag each Control: control_environment, risk_assessment, control_activities,
// information_communication, monitoring_activities.
export const GOVERNANCE_KINDS = ['alerts', 'businessRules', 'controls', 'kpis', 'reports', 'risksOpportunities']

export const ALERT_SEVERITIES = ['low', 'medium', 'high', 'critical']
export const ALERT_CHANNELS = ['in_app', 'email', 'teams']
export const CONTROL_TYPES = ['preventive', 'detective', 'corrective']
export const CONTROL_FREQUENCIES = ['continuous', 'daily', 'weekly', 'monthly', 'quarterly']
export const CONTROL_STATUSES = ['effective', 'needs_review', 'ineffective']
export const RO_TYPES = ['risk', 'opportunity']
export const RO_STATUSES = ['open', 'mitigating', 'capturing', 'closed']

let seq = 1
function gid(prefix) {
  return `${prefix}-${String(seq++).padStart(3, '0')}`
}

function entry(mpId, { alert, rule, control, kpi, report, ro }) {
  return {
    mpId,
    alerts: alert ? [{ id: gid('ALG'), active: true, channel: 'in_app', severity: 'medium', ...alert }] : [],
    businessRules: rule ? [{ id: gid('BRL'), active: true, ...rule }] : [],
    controls: control ? [{ id: gid('CTL'), controlType: 'detective', frequency: 'monthly', status: 'effective', complianceStandards: ['iso27001'], ...control }] : [],
    kpis: kpi ? [{ id: gid('KPI'), frequency: 'monthly', ...kpi }] : [],
    reports: report ? [{ id: gid('RPT'), format: 'dashboard', frequency: 'monthly', ...report }] : [],
    risksOpportunities: ro ? [{ id: gid('RSK'), type: 'risk', likelihood: 3, impact: 3, status: 'open', ...ro }] : [],
  }
}

const SEED = [
  entry('MP-01', {
    alert: { name: 'Unmapped high-impact stakeholder group', condition: 'A stakeholder group scored impact ≥ 4 with no assigned owner after 5 business days.', severity: 'high', recipientRoles: ['change_manager', 'org_admin'] },
    rule: { name: 'Impact score requires justification', description: 'Any stakeholder impact score of 4 or 5 must carry a written justification before it can be saved.', trigger: 'Impact score set to 4 or 5', action: 'Block save until justification field is non-empty', owner: 'change_manager' },
    control: { name: 'Stakeholder map completeness review', description: 'Change Manager confirms every business unit in scope has at least one mapped stakeholder group before phase gate P2.', cosoComponent: 'risk_assessment', controlType: 'detective', owner: 'change_manager', complianceStandards: ['iso27001'] },
    kpi: { name: '% Stakeholders Mapped', description: 'Share of the target population covered by a stakeholder-group entry.', target: '100%', unit: 'percent', owner: 'change_manager' },
    report: { name: 'Stakeholder Impact Heatmap', description: 'Cross-tab of stakeholder group × impact dimension, exported for sponsor review.', audience: ['sponsor', 'change_manager'], format: 'dashboard' },
    ro: { type: 'risk', description: 'A key stakeholder group is under-represented in the assessment, understating true resistance exposure.', owner: 'change_manager' },
  }),
  entry('MP-02', {
    alert: { name: 'Sponsor silence', condition: 'No sponsor coalition action logged for 21 consecutive days on an active project.', severity: 'high', recipientRoles: ['change_manager', 'org_admin', 'sponsor'] },
    rule: { name: 'Escalation requires sponsor sign-off', description: 'A governance escalation action cannot close without a recorded sponsor decision.', trigger: 'Escalation action marked closed', action: 'Require sponsor decision field before allowing closure', owner: 'change_manager' },
    control: { name: 'Governance cadence adherence', description: 'Confirms the sponsor coalition cadence (steering committee, 1:1 sponsor check-ins) occurred as scheduled.', cosoComponent: 'monitoring_activities', controlType: 'detective', frequency: 'monthly', owner: 'org_admin', complianceStandards: ['iso9001'] },
    kpi: { name: 'Sponsor Engagement Score', description: 'Composite of cadence adherence and visible-support ratings logged in the Coalition module.', target: '≥ 80', unit: 'score/100', owner: 'change_manager' },
    report: { name: 'Executive Sponsorship Brief', description: 'One-page rollup of sponsor coalition health for steering committee packs.', audience: ['executive', 'sponsor'], format: 'pdf', frequency: 'quarterly' },
    ro: { type: 'opportunity', description: 'A newly engaged sponsor with strong visible support could be leveraged to accelerate a stalled workstream.', owner: 'change_manager', likelihood: 3, impact: 4 },
  }),
  entry('MP-03', {
    alert: { name: 'Communication cadence gap', condition: 'No communication logged to a target cohort for 2 consecutive planned cycles.', severity: 'medium', recipientRoles: ['change_manager'] },
    rule: { name: 'AI-drafted communications require review', description: 'Any communication drafted by the Augmented AI tier must be marked reviewed before it can be marked sent.', trigger: 'Communication source = AI-generated', action: 'Block "sent" status until reviewedBy is set', owner: 'change_manager' },
    control: { name: 'Message accuracy sign-off', description: 'A named reviewer approves every mass communication before distribution, evidenced by a sign-off record.', cosoComponent: 'control_activities', controlType: 'preventive', frequency: 'continuous', owner: 'change_manager', complianceStandards: ['gdpr'] },
    kpi: { name: 'Awareness Block Movement', description: 'Change in average ADKAR Awareness score attributable to the communications cadence.', target: '+15 pts / phase', unit: 'ADKAR points', owner: 'change_manager' },
    report: { name: 'Communications Effectiveness Report', description: 'Cadence-vs-plan and awareness-lift summary by cohort.', audience: ['change_manager', 'sponsor'], format: 'export', frequency: 'monthly' },
    ro: { type: 'risk', description: 'Message fatigue from an overly dense cadence could suppress open/read rates.', owner: 'change_manager', likelihood: 2, impact: 3 },
  }),
  entry('MP-04', {
    alert: { name: 'Resistance pattern spike', condition: 'Three or more resistance log entries of the same type within 10 days on one project.', severity: 'critical', recipientRoles: ['change_manager', 'people_manager'] },
    rule: { name: 'Systemic resistance requires root-cause tag', description: 'A resistance entry typed "systemic" cannot be closed without a linked root-cause classification.', trigger: 'Resistance type = systemic, status → closed', action: 'Require rootCause field', owner: 'change_manager' },
    control: { name: 'Mitigation action follow-through', description: 'Confirms every open resistance entry has an assigned mitigation action with a due date.', cosoComponent: 'control_activities', controlType: 'corrective', owner: 'change_manager', complianceStandards: ['iso27001'] },
    kpi: { name: 'Resistance Resolution Rate', description: 'Share of logged resistance entries reaching "resolved" within SLA.', target: '≥ 75%', unit: 'percent', owner: 'change_manager' },
    report: { name: 'Resistance Pattern Analysis', description: 'Breakdown by type (role/skill/will/systemic) with trend vs. prior phase.', audience: ['change_manager', 'org_admin'], format: 'dashboard' },
    ro: { type: 'risk', description: 'A cluster of "will"-type resistance in one department signals a sponsorship gap rather than a training gap.', owner: 'change_manager', likelihood: 3, impact: 4 },
  }),
  entry('MP-05', {
    alert: { name: 'Training completion lagging', condition: 'Cohort completion rate is more than 20 points behind the plan at the midpoint checkpoint.', severity: 'high', recipientRoles: ['change_manager', 'people_manager'] },
    rule: { name: 'Certification gates go-live readiness', description: 'A user cannot be marked "go-live ready" without a completed required-curriculum record.', trigger: 'Readiness flag set on a user', action: 'Verify training completion before allowing the flag', owner: 'people_manager' },
    control: { name: 'Curriculum-to-role mapping review', description: 'Confirms every role in scope has an assigned curriculum before training kicks off.', cosoComponent: 'control_environment', controlType: 'preventive', frequency: 'quarterly', owner: 'change_manager', complianceStandards: ['iso9001'] },
    kpi: { name: 'Knowledge & Ability Block Lift', description: 'Change in average ADKAR Knowledge/Ability scores post-training.', target: '+20 pts', unit: 'ADKAR points', owner: 'change_manager' },
    report: { name: 'Training Completion Dashboard', description: 'Cohort-level completion, pass rate, and time-to-complete.', audience: ['change_manager', 'people_manager'], format: 'dashboard' },
    ro: { type: 'opportunity', description: 'A cohort finishing early could pilot floor-coaching for a slower cohort.', owner: 'people_manager', likelihood: 3, impact: 3 },
  }),
  entry('MP-06', {
    alert: { name: 'Champion network under-strength', condition: "Fewer than 1 champion per 25 employees in a business unit's scope.", severity: 'medium', recipientRoles: ['change_manager'] },
    rule: { name: 'Champion signal requires triage', description: 'A signal raised by a champion must be triaged (accepted/rejected) within 5 business days.', trigger: 'Champion signal logged', action: 'Flag as overdue after 5 business days without triage', owner: 'change_manager' },
    control: { name: 'Champion coverage audit', description: 'Confirms champion-to-headcount ratio meets the target per business unit.', cosoComponent: 'monitoring_activities', controlType: 'detective', frequency: 'quarterly', owner: 'change_manager', complianceStandards: ['iso9001'] },
    kpi: { name: 'Champion Coverage Ratio', description: 'Champions per 25 employees, by business unit.', target: '≥ 1 : 25', unit: 'ratio', owner: 'change_manager' },
    report: { name: 'Champion Network Health Report', description: 'Coverage, signal volume, and triage SLA adherence.', audience: ['change_manager'], format: 'export', frequency: 'monthly' },
    ro: { type: 'opportunity', description: 'A highly active champion could be formalized into a permanent floor-coaching role for sustainment.', owner: 'change_manager', likelihood: 2, impact: 3 },
  }),
  entry('MP-07', {
    alert: { name: 'Composite Readiness Index below threshold', condition: 'CRI falls below the phase-appropriate benchmark band for two consecutive checkpoints.', severity: 'critical', recipientRoles: ['change_manager', 'sponsor', 'org_admin'] },
    rule: { name: 'Go/no-go requires joint sign-off', description: 'A phase gate cannot record a "go" decision without both PM and CM inputs present.', trigger: 'Phase gate joint decision saved', action: 'Require both pmInput and cmInput before allowing "go"', owner: 'change_manager' },
    control: { name: 'Readiness scoring evidence trail', description: 'Every ADKAR/sentiment score change is stage-then-justify and appended to an immutable change log.', cosoComponent: 'information_communication', controlType: 'preventive', frequency: 'continuous', owner: 'change_manager', complianceStandards: ['iso27001', 'soc2'] },
    kpi: { name: 'Composite Readiness Index (CRI)', description: 'Blended ADKAR + sentiment + risk signal, benchmarked against the Lewin-phase reference band.', target: 'In-line or ahead of band', unit: 'index (0-100)', owner: 'change_manager' },
    report: { name: 'Readiness Benchmarking Report', description: 'Project CRI vs. phase-appropriate reference band, cross-project rollup.', audience: ['org_admin', 'executive'], format: 'dashboard' },
    ro: { type: 'risk', description: 'A CRI plateau despite continued investment may indicate a measurement blind spot, not true readiness.', owner: 'change_manager', likelihood: 2, impact: 4 },
  }),
  entry('MP-08', {
    alert: { name: 'Schedule-adoption divergence', condition: 'WBS percent-complete is on track while ADKAR/adoption signals are declining on the same phase.', severity: 'high', recipientRoles: ['change_manager', 'org_admin'] },
    rule: { name: 'High-severity risk requires an action plan', description: 'A risk scored severity "high" or above cannot remain open without at least one linked mitigation action.', trigger: 'Risk severity ≥ high', action: 'Require ≥1 action before allowing status = open to persist past 5 days', owner: 'change_manager' },
    control: { name: 'Divergence pattern review', description: 'Reviews plan-vs-reality signals (schedule, adoption, saturation) at each steering checkpoint.', cosoComponent: 'risk_assessment', controlType: 'detective', frequency: 'monthly', owner: 'change_manager', complianceStandards: ['iso27001'] },
    kpi: { name: 'Risk Burn-down Rate', description: 'Share of logged risks moved from open to mitigating/closed per period.', target: '≥ 60% / quarter', unit: 'percent', owner: 'change_manager' },
    report: { name: 'Risk & Divergence Register Export', description: 'Full risk register with severity, owner, and action status.', audience: ['change_manager', 'org_admin'], format: 'export' },
    ro: { type: 'risk', description: 'Change saturation across concurrently running projects in the same business unit may compound adoption risk beyond any single project\'s register.', owner: 'org_admin', likelihood: 3, impact: 4 },
  }),
  entry('MP-09', {
    alert: { name: 'Hypercare ticket backlog', condition: 'Open floor-coaching / hypercare tickets exceed 15 for more than 3 business days post go-live.', severity: 'high', recipientRoles: ['practitioner', 'change_manager'] },
    rule: { name: 'Hypercare exit requires coaching-note closure', description: 'The hypercare period cannot be marked closed while coaching notes remain open on the project.', trigger: 'Hypercare status → closed', action: 'Block unless all coaching notes are resolved', owner: 'change_manager' },
    control: { name: 'Floor-coaching quality spot-check', description: "Samples a percentage of manager-as-coach conversations against the coaching-conversation quality rubric.", cosoComponent: 'monitoring_activities', controlType: 'detective', frequency: 'weekly', owner: 'people_manager', complianceStandards: ['iso9001'] },
    kpi: { name: 'Time-to-Resolution (Hypercare)', description: 'Median time from ticket raised to closed during the hypercare window.', target: '≤ 24h', unit: 'hours', owner: 'practitioner' },
    report: { name: 'Hypercare Daily Standup Report', description: 'Rolling ticket volume, backlog, and top recurring issues.', audience: ['change_manager', 'practitioner'], format: 'dashboard', frequency: 'weekly' },
    ro: { type: 'opportunity', description: 'Recurring hypercare questions could be converted into a self-service FAQ, cutting future ticket volume.', owner: 'practitioner', likelihood: 4, impact: 2 },
  }),
  entry('MP-10', {
    alert: { name: 'Sustainment checkpoint missed', condition: 'A scheduled post-go-live sustainment checkpoint (30/60/90-day) was not logged within 5 days of its due date.', severity: 'medium', recipientRoles: ['change_manager', 'org_admin'] },
    rule: { name: 'Lessons-learned required at project close', description: 'A CM Project cannot move to "closed" status without at least one field note tagged "lesson learned".', trigger: 'Project status → closed', action: 'Require ≥1 lesson-learned field note', owner: 'change_manager' },
    control: { name: 'Benefit realization tracking', description: 'Confirms quick-win and long-term benefit metrics are tracked past project close, not just at go-live.', cosoComponent: 'monitoring_activities', controlType: 'detective', frequency: 'quarterly', owner: 'org_admin', complianceStandards: ['iso9001'] },
    kpi: { name: 'Sustainment Retention', description: 'Adoption rate measured at 90 days vs. the go-live adoption rate.', target: '≥ 95% retained', unit: 'percent', owner: 'change_manager' },
    report: { name: 'Lessons Learned Digest', description: 'Cross-project rollup of field notes tagged lesson-learned, for the next initiative\'s Business Analysis.', audience: ['org_admin', 'executive'], format: 'export', frequency: 'quarterly' },
    ro: { type: 'opportunity', description: 'A strong sustainment result on this project is reusable as a reference case in the next Business Analysis workshop.', owner: 'org_admin', likelihood: 3, impact: 3 },
  }),
]

export function buildProcessGovernanceSeed() {
  const byId = {}
  for (const e of SEED) {
    byId[e.mpId] = {
      alerts: e.alerts,
      businessRules: e.businessRules,
      controls: e.controls,
      kpis: e.kpis,
      reports: e.reports,
      risksOpportunities: e.risksOpportunities,
    }
  }
  return byId
}
