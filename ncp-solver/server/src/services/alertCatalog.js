// Canonical Alert Type catalog (A-J), shared by the live Monitoring & Alert
// Agent (aiAgents.js), the demo seed data (seed/seed.js), and the frontend's
// display-name lookup for Alerts / Governance Settings > Alert Configuration.
// stage = the alert's primary S1-S7 grounding, so an alert can be surfaced on
// its relevant NCP Sheet stage tab (mirrors business_rules/controls/risks
// .ncp_stage). name is the short English label; the frontend localizes it.
export const ALERT_TYPES = {
  A: { name: 'New Sheet Triage', stage: 'S1' },
  B: { name: 'Action Overdue', stage: 'S5' },
  C: { name: 'Evaluation Pending', stage: 'S6' },
  D: { name: 'Root Cause Analysis Not Started', stage: 'S4' },
  E: { name: 'Containment Evidence Pending', stage: 'S3' },
  F: { name: 'KPI Threshold Breach', stage: null },
  G: { name: 'Immediate Action Due Tomorrow', stage: 'S3' },
  H: { name: 'Corrective Action Due Soon', stage: 'S5' },
  I: { name: 'Evaluation Due Soon', stage: 'S6' },
  J: { name: 'Priority-1 Sheet Inactive', stage: 'S1' },
};

export const ALERT_STAGE_MAP = Object.fromEntries(Object.entries(ALERT_TYPES).map(([code, t]) => [code, t.stage]));
