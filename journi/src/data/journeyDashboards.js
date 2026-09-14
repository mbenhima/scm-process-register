// Module 19 — Journey Analytics Dashboards (D29): the experience-centric
// companion to journi's existing score-centric analytics (M10/M12/M20) —
// showing whether the intended journey actually happened, not just the
// resulting score. Each extends an existing report rather than duplicating
// it. DASH-01 and DASH-02 compute a live metric from a project's
// touchpointLog / charterActionLog (see Module20Page); DASH-03/04/05 are
// shown as descriptive reference cards — this demo doesn't model per-mentee
// or per-case granularity separately from the underlying M5/M12 logs.
const journeyDashboards = [
  {
    id: 'DASH-01',
    name: 'End User Journey Completion Dashboard',
    audience: 'Change Manager, PMO',
    journeyKpis: 'Touchpoint completion rate, average Days_From_Trigger vs. plan, drop-off point',
    pdcaMetrics: 'Plan/Do/Check/Act sub-phase completion %',
    visualisationTypes: 'Funnel, Gantt, Bar',
    refreshFrequency: 'Weekly',
    linkedReport: 'RPT-002 Sponsor & Adoption Report',
    live: 'JRN-01',
    description: 'Tracks JRN-01 touchpoint-by-touchpoint completion, surfacing exactly where employees drop off relative to the intended journey.',
  },
  {
    id: 'DASH-02',
    name: 'Sponsor & Charter Compliance Dashboard',
    audience: 'Sponsor, Steering Committee, PMO',
    journeyKpis: 'Charter action completion rate by PDCA stage, sponsor touchpoint timeliness',
    pdcaMetrics: 'Plan/Do/Check/Act action counts per charter action mapping',
    visualisationTypes: 'KPI Cards, Bar, Radar',
    refreshFrequency: 'Weekly',
    linkedReport: 'RPT-007',
    live: 'charterActions',
    description: 'Rolls up Charter Action Mapping (M5) completion against the charter each action belongs to, cross-referenced with JRN-02 touchpoints.',
  },
  {
    id: 'DASH-03',
    name: 'Mentoring Progression Dashboard',
    audience: 'Training Lead, FPO, Change Manager',
    journeyKpis: 'Time-in-stage (Trainee/Observer/Autonomous), regression-to-Observer rate',
    pdcaMetrics: 'Do-stage progression, Act-stage sign-off rate',
    visualisationTypes: 'Funnel, Bar, KPI Cards',
    refreshFrequency: 'Weekly',
    linkedReport: 'RPT-008',
    live: null,
    description: "Tracks every mentee's progression through the 3-stage mentoring model, flagging cohorts with high regression-to-Observer rates.",
  },
  {
    id: 'DASH-04',
    name: 'Divergence Case Resolution Dashboard',
    audience: 'Change Manager, Steering Committee',
    journeyKpis: 'Case closure time, re-escalation rate, Bridges recovery rate post-closure',
    pdcaMetrics: 'Plan (triage), Do (1:1+closure), Check (Bridges re-check)',
    visualisationTypes: 'Bar, Heatmap, Line',
    refreshFrequency: 'Real-time',
    linkedReport: 'RPT-003',
    live: null,
    description: 'Tracks every JRN-06 Divergence Case Journey from flag to closure, feeding the same cockpit as RPT-003 but at the journey/touchpoint level of detail.',
  },
  {
    id: 'DASH-05',
    name: 'Journey Analytics — Executive Roll-Up',
    audience: 'Executive Viewer, Group Admin',
    journeyKpis: 'Cross-journey completion index, journey-level Readiness correlation',
    pdcaMetrics: 'Aggregate PDCA cadence adherence across all active journeys',
    visualisationTypes: 'Radar, KPI Cards',
    refreshFrequency: 'Monthly',
    linkedReport: 'RPT-001',
    live: null,
    description: "The experience-layer companion to RPT-001's score-layer Executive Readiness Dashboard — shows whether the intended journey actually happened, not just the resulting score.",
  },
]

export default journeyDashboards
