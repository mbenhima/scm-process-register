// Module 20 — Cross-Type Comparison Matrix (D32i), extended to all 8 CR1 transformation
// types. The first 7 rows are transcribed from D32i (itself sourced verbatim from the
// Transformation Types User Guide §6 and the ERP Implementation User Guide). Training &
// Skills Development has no D32i row in the source set — see the E2E-01–04/type-count
// note in the Gap Analysis (Finding B) — its row below is a proportionate extension
// following the same reasoning pattern as the other rows, not a transcribed source value.
const crossTypeMatrix = [
  {
    transformationType: 'erp',
    typicalDuration: '12 months (illustrative)',
    terminalGate: 'Cutover & Go-Live (Phase 6, Week 37)',
    externalPartyInvolvement: 'Not typically',
    dominantFramework: 'Knowledge / Ability (balanced across both)',
    reversibility: 'Low once live — data migration and cutover are costly to reverse',
    sourceGuide: 'journi ERP Implementation User Guide',
    seedProjectExample: 'PRJ-001, PRJ-004, PRJ-007',
  },
  {
    transformationType: 'bpr',
    typicalDuration: '6-12 months per major process',
    terminalGate: 'Full rollout',
    externalPartyInvolvement: 'Not typically',
    dominantFramework: 'Ability',
    reversibility: 'Moderate',
    sourceGuide: 'journi Transformation Types Guide, §4.1 / §6',
    seedProjectExample: 'PRJ-010',
  },
  {
    transformationType: 'automation',
    typicalDuration: '3-9 months per workflow',
    terminalGate: 'Production go-live',
    externalPartyInvolvement: 'Not typically',
    dominantFramework: 'Ability / Reinforcement',
    reversibility: 'Low once live',
    sourceGuide: 'journi Transformation Types Guide, §4.2 / §6',
    seedProjectExample: 'PRJ-002, PRJ-005, PRJ-008',
  },
  {
    transformationType: 'qms',
    typicalDuration: '6-14 months',
    terminalGate: 'Certifying audit (external)',
    externalPartyInvolvement: 'Yes — certification body',
    dominantFramework: 'Knowledge',
    reversibility: 'Low — the audit is external',
    sourceGuide: 'journi Transformation Types Guide, §4.3 / §6',
    seedProjectExample: 'PRJ-003, PRJ-006, PRJ-009',
  },
  {
    transformationType: 'cultural',
    typicalDuration: '18-36 months',
    terminalGate: 'Org-wide rollout',
    externalPartyInvolvement: 'Not typically',
    dominantFramework: 'Bridges / Kübler-Ross',
    reversibility: 'High — but slow to fix',
    sourceGuide: 'journi Transformation Types Guide, §4.4 / §6',
    seedProjectExample: 'PRJ-011',
  },
  {
    transformationType: 'operating_model',
    typicalDuration: '9-18 months from diagnosis',
    terminalGate: 'Full transition',
    externalPartyInvolvement: 'Not typically',
    dominantFramework: 'Awareness / Ability',
    reversibility: 'Low once transitioned',
    sourceGuide: 'journi Transformation Types Guide, §4.5 / §6',
    seedProjectExample: 'PRJ-012',
  },
  {
    transformationType: 'compliance',
    typicalDuration: 'Driven by the external deadline',
    terminalGate: 'Enforceable date (external)',
    externalPartyInvolvement: 'Often — regulator',
    dominantFramework: 'Awareness / Knowledge',
    reversibility: 'None — fixed deadline',
    sourceGuide: 'journi Transformation Types Guide, §4.6 / §6',
    seedProjectExample: 'PRJ-013',
  },
  {
    transformationType: 'training_skills',
    typicalDuration: '3-6 months per curriculum wave',
    terminalGate: 'Competency verification sign-off',
    externalPartyInvolvement: 'Not typically',
    dominantFramework: 'Knowledge / Ability',
    reversibility: 'High — a skills gap can be re-addressed with further training',
    sourceGuide: 'Not in D32i — extended per CR1 (see Gap Analysis Finding B)',
    seedProjectExample: 'Frontline Digital Skills Certification Program (Atlas Tangier)',
  },
]

export default crossTypeMatrix
