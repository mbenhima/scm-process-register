// Module 19 — Macro Process Catalog (MP-01 through MP-10, per D01 / CR1 addendum).
// Each macro process is the unit E2E process chains are built from; primaryModules
// links it back to the journi module(s) that actually implement its data capture.
const macroProcesses = [
  {
    id: 'MP-01',
    name: 'Change Impact & Stakeholder Assessment',
    description: 'Maps stakeholder groups and scores change impact (process, technology, role, location, identity) to establish the baseline scope of who is affected and how.',
    primaryModules: ['M5'],
  },
  {
    id: 'MP-02',
    name: 'Sponsorship & Governance Management',
    description: 'Builds and tracks the sponsor coalition, escalation actions, and governance cadence that keep executive backing visible and active.',
    primaryModules: ['M4', 'M8'],
  },
  {
    id: 'MP-03',
    name: 'Communication & Awareness Management',
    description: 'Plans and logs the communications cadence that drives the Awareness block of ADKAR across stakeholder cohorts.',
    primaryModules: ['M9'],
  },
  {
    id: 'MP-04',
    name: 'Resistance & Barrier Management',
    description: 'Logs resistance signals by type (role, skill, will, systemic) and tracks mitigation actions through to resolution.',
    primaryModules: ['M11'],
  },
  {
    id: 'MP-05',
    name: 'Training & Capability Enablement',
    description: 'Delivers the curriculum that builds the Knowledge and Ability ADKAR blocks, tracked by cohort and completion status.',
    primaryModules: ['M10'],
  },
  {
    id: 'MP-06',
    name: 'Champion Network Management',
    description: 'Manages the change-champion network — floor-level advocates who surface early signals into the Sponsor Coalition and Resistance Log.',
    primaryModules: ['M8'],
  },
  {
    id: 'MP-07',
    name: 'Readiness Diagnostics & Signal Capture',
    description: 'Aggregates ADKAR scores, sentiment, and other signals into the Composite Readiness Index used to judge go/no-go readiness.',
    primaryModules: ['M6', 'M7'],
  },
  {
    id: 'MP-08',
    name: 'Divergence & Risk Detection',
    description: 'Detects divergence patterns between plan and reality (schedule slips, adoption risk, saturation) and logs them to the Risk Register.',
    primaryModules: ['M7', 'M14'],
  },
  {
    id: 'MP-09',
    name: 'Hypercare & Floor Coaching Support',
    description: 'Provides manager-led floor coaching and hypercare support immediately after go-live, while adoption is still fragile.',
    primaryModules: ['M12', 'M13'],
  },
  {
    id: 'MP-10',
    name: 'Reinforcement & Sustainment Management',
    description: 'Locks in the change through checkpoints, quick wins, and lessons learned so gains outlast the project close-out.',
    primaryModules: ['M4', 'M13'],
  },
]

export default macroProcesses
