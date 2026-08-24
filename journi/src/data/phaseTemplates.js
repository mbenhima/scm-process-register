// Module 18 / M17 — Phase Template Library (D32b, CR1 addendum).
// TPL-ERP-8 mirrors journi's original 8-phase ERP baseline (see utils/wbs.js
// generateDefaultWbs). The 7 new templates are type-specific variants of the
// generic "Common Transformation Lifecycle" (Intake & Diagnosis, Case for
// Change & Target-State Design, Build & Development, Validation, Deployment,
// Stabilization & Hypercare, Sustainment & Closure).
const phaseTemplates = [
  {
    id: 'TPL-ERP-8',
    name: 'ERP Implementation — 8 Phase',
    transformationType: 'erp',
    phases: ['Discovery', 'Design', 'Build', 'Test', 'Train', 'Deploy', 'Hypercare', 'Sustain'],
  },
  {
    id: 'TPL-BPR-7',
    name: 'Common Lifecycle — BPR Variant',
    transformationType: 'bpr',
    phases: ['P1 Intake & Diagnosis', 'P2 Clean-Slate Design', 'P3 Build', 'P4 Pilot', 'P5 Rollout', 'P6 Stabilization', 'P7 Sustainment'],
  },
  {
    id: 'TPL-BPA-7',
    name: 'Common Lifecycle — Automation Variant',
    transformationType: 'automation',
    phases: ['P1 Automation-Opportunity Assessment', 'P2 Architecture Design', 'P3 Build', 'P4 UAT & Shadow-Mode', 'P5 Production Go-Live', 'P6 Exception Tuning', 'P7 CoE Handover'],
  },
  {
    id: 'TPL-IMS-7',
    name: 'Common Lifecycle — QMS Variant',
    transformationType: 'qms',
    phases: ['P1 Intake & Diagnosis', 'P2 Design', 'P3 Implementation', 'P4 Mock-up Audit', 'P5 Certifying Audit', 'P6 Surveillance Prep', 'P7 Ongoing Surveillance'],
  },
  {
    id: 'TPL-CULT-7',
    name: 'Common Lifecycle — Culture Variant',
    transformationType: 'cultural',
    phases: ['P1 Diagnosis', 'P2 Target Values Design', 'P3 Leadership Modeling & Reinforcement Build', 'P4 Pilot Cohort', 'P5 Organization-Wide Rollout', 'P6 Reinforcement Through Skepticism', 'P7 Institutionalization'],
  },
  {
    id: 'TPL-OM-7',
    name: 'Common Lifecycle — Operating Model Variant',
    transformationType: 'operating_model',
    phases: ['P1 Current Operating Model Assessment', 'P2 TOM Design', 'P3 Detailed Org Design', 'P4 Pilot Transition', 'P5 Full Transition', 'P6 Governance Adoption Tracking', 'P7 Standing Rhythm Handover'],
  },
  {
    id: 'TPL-COMP-7',
    name: 'Common Lifecycle — Compliance Variant',
    transformationType: 'compliance',
    phases: ['P1 Regulatory Requirement & Gap Analysis', 'P2 Control Design', 'P3 Control Implementation', 'P4 Internal Audit / Independent Testing', 'P5 Controls Go Live', 'P6 First Monitoring Cycle', 'P7 Ongoing Compliance Handover'],
  },
  {
    id: 'TPL-TSD-7',
    name: 'Common Lifecycle — Training & Skills Variant',
    transformationType: 'training_skills',
    phases: ['P1 Skills Gap Diagnosis', 'P2 Curriculum Design', 'P3 Training Delivery', 'P4 Competency Verification', 'P5 Practical Application', 'P6 On-the-Job Coaching', 'P7 Skills Sustainment'],
  },
]

export default phaseTemplates
