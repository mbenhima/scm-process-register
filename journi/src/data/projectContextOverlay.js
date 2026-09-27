// Module 19 — Project Context Overlay (D24): captures exactly what makes each
// of D21's 13 illustrative seed projects (PRJ-001 through PRJ-013) distinct
// from the generic J0-J8 journey template — the specific tension, constraint,
// or exception pattern most likely to fire — without duplicating the shared
// template itself. These PRJ-xxx IDs belong to the D-deliverable framework's
// own illustrative registry, not to journi's own seeded demo projects (Atlas,
// Atlas Tangier, Maghreb, Meridia) — shown here as the source documents'
// worked reference set, the same "not a live project match" posture already
// used for the Cross-Type Matrix's seedProjectExample column (Module 4).
const projectContextOverlay = [
  { projectId: 'PRJ-001', attribute: 'Dominant Tension', value: 'Historical, diffuse skepticism (multi-plant legacy ERP consolidation)', description: "Overlay on the generic J1-J8 template capturing what's specific to this case." },
  { projectId: 'PRJ-001', attribute: 'Exception Pattern Most Likely', value: 'E3 — Two-Clock Problem at Cutover & Go-Live', description: "This is the canonical worked example generalizing to Exception E3." },
  { projectId: 'PRJ-002', attribute: 'Dominant Tension', value: 'Concrete, specific fear of headcount reduction (RPA automation of transaction processing)', description: 'Strong fear of role redundancy is the top ADKAR Desire barrier.' },
  { projectId: 'PRJ-002', attribute: 'Exception Pattern Most Likely', value: 'E1 — Desire Stall During Data Migration & Integration', description: 'ADKAR and Kübler-Ross unstick together once the fear is directly addressed.' },
  { projectId: 'PRJ-003', attribute: 'Dominant Tension', value: "Low — job doesn't fundamentally change, but certification adds external audit pressure", description: 'Clean convergence expected; cohort-specific readings differ by site (Exception E6).' },
  { projectId: 'PRJ-003', attribute: 'Exception Pattern Most Likely', value: 'E6 — Cohort Divergence Across Sites or Departments', description: 'Different cohorts genuinely in different places across all four frameworks simultaneously.' },
  { projectId: 'PRJ-004', attribute: 'Digital Literacy Risk', value: 'High — 24/7 operations, mixed digital-literacy driver and dispatch workforce', description: 'Overlay flagging a Knowledge/Ability barrier distinct from Awareness/Desire.' },
  { projectId: 'PRJ-006', attribute: 'Constraint Type', value: '24/7 shift-based operations complicate synchronized training delivery', description: 'Overlay on J4 Testing & Training — training must be delivered across staggered shifts, not one cohort at a time.' },
  { projectId: 'PRJ-007', attribute: 'Constraint Type', value: 'Patient-safety-critical cutover windows severely constrain go-live timing', description: 'Overlay on J5 Deployment — cutover cannot follow a standard weekend-window pattern.' },
  { projectId: 'PRJ-009', attribute: 'Certification Anchor', value: 'JCI accreditation — external pass/fail gate, not an internal go/no-go call', description: 'Overlay distinguishing QMS-type projects: the final gate is made by an external body.' },
  { projectId: 'PRJ-011', attribute: 'Timeline Risk', value: 'No forcing deadline at all — 18-36 month standalone culture program', description: 'Overlay flagging highest Exception E5 (Reinforcement Gap) risk of the seed set — risk of calling Refreeze too late.' },
  { projectId: 'PRJ-013', attribute: 'Timeline Risk', value: 'Deadline is fixed and non-negotiable — regulatory compliance deadline', description: 'Overlay requiring risk scoring to weight time-to-remediate as heavily as severity.' },
]

export default projectContextOverlay
