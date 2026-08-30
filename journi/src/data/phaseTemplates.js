// Module 18 / M17 — Phase Template Library (D32b, CR1 addendum).
// TPL-ERP-8 mirrors journi's original 8-phase ERP baseline (see utils/wbs.js
// generateDefaultWbs). The 7 new templates are type-specific variants of the
// generic "Common Transformation Lifecycle" (Intake & Diagnosis, Case for
// Change & Target-State Design, Build & Development, Validation, Deployment,
// Stabilization & Hypercare, Sustainment & Closure).
//
// Each phase carries three editable entries alongside its name (full CRUD
// via M17's Manage Templates > Edit, versioned like the rest of the
// template): cmTrack (the Change Management actions expected during this
// phase, distinct from the PM-side build/test work), checklist (concrete
// exit criteria a Change Manager checks off before calling the phase done),
// and gate (the small set of Phase Gate questions a Program/Project Manager
// reviews before approving advancement to the next phase). TPL-ERP-8 ships
// fully populated as the flagship, reference example; the seven Common
// Lifecycle variants ship with the structure in place and empty arrays,
// ready to be filled in per engagement via the same editor.
const phaseTemplates = [
  {
    id: 'TPL-ERP-8',
    name: 'ERP Implementation — 8 Phase',
    transformationType: 'erp',
    phases: [
      {
        name: 'Discovery',
        cmTrack: [
          'Build and get Steering Committee approval for the change management business case',
          'Populate the Stakeholder Map (M4) with every affected cohort and an initial impact/severity rating',
          'Name the Executive Sponsor and confirm at least one visible sponsorship action (M7)',
        ],
        checklist: [
          'Business case approved, not just drafted',
          'Stakeholder Map covers every affected cohort, not only the most visible ones',
          'Executive Sponsor named and has taken a visible action',
        ],
        gate: [
          'Is the business case approved by the Steering Committee?',
          'Is the Stakeholder Map complete for all affected cohorts?',
          'Is there a named, active Executive Sponsor?',
        ],
      },
      {
        name: 'Design',
        cmTrack: [
          'Run kickoff communications and capture baseline Awareness scores per cohort (M5)',
          'Recruit and brief the Champion network (M4/M7)',
          'Log design decisions against the design principles they satisfy (M17)',
        ],
        checklist: [
          'Design principles signed off, not just drafted',
          'Baseline Awareness score exists for at least the highest-severity cohorts',
          'Champion network named with a confirmed observation-logging path',
        ],
        gate: [
          'Are design principles formally approved?',
          'Is there a baseline Awareness reading for high-severity cohorts?',
          'Is the champion network active?',
        ],
      },
      {
        name: 'Build',
        cmTrack: [
          'Track ADKAR Desire trend for every cohort; open a recovery response for any stalled block',
          'Run the first wave of persona/channel communications (M8)',
          'Log any resistance surfaced during build against a root-cause type (M10)',
        ],
        checklist: [
          'No cohort remains below the stall threshold on Desire without a logged recovery response',
          'No open High/Critical technical defect without an accepted mitigation',
          'Configuration/build decisions traceable to the signed-off design principles',
        ],
        gate: [
          'Is ADKAR Desire trending upward across all cohorts?',
          'Are there any unmitigated High/Critical defects?',
          'Is every major build decision traceable to a design principle?',
        ],
      },
      {
        name: 'Test',
        cmTrack: [
          'Re-score ADKAR Knowledge/Ability for cohorts participating in UAT (M5)',
          'Watch for the Divergence Pattern (high capability, unmoved Bridges) and respond with a loss-focused conversation, not more training (M6)',
          'Confirm training curricula are mapped to the Knowledge/Ability gaps observed in testing (M9)',
        ],
        checklist: [
          'UAT participant ADKAR scores re-measured, not assumed from Build',
          'No open Divergence Pattern flag without a logged response',
          'Training curriculum mapped to gaps actually observed, not just planned generically',
        ],
        gate: [
          'Has UAT capability been re-measured, not assumed?',
          'Are open Divergence Pattern flags being actively worked?',
          'Is training content mapped to real, observed gaps?',
        ],
      },
      {
        name: 'Train',
        cmTrack: [
          'Deliver training waves and track completion percentage per curriculum (M9)',
          'Coach people managers on team-level barriers surfaced by training (M11)',
          'Re-pulse Bridges/Kübler-Ross for cohorts that have completed training (M6)',
        ],
        checklist: [
          'Training completion tracked per curriculum, not assumed complete',
          'Manager coaching actions logged for any flagged team barrier',
          'Post-training Bridges/sentiment re-pulse scheduled',
        ],
        gate: [
          'Is training completion tracked and above the target threshold?',
          'Have flagged team barriers received a coaching response?',
          'Is a post-training emotional re-pulse scheduled?',
        ],
      },
      {
        name: 'Deploy',
        cmTrack: [
          'Mark Lewin as "Change, provisional toward Refreeze" at cutover — not Refreeze on the go-live date alone',
          'Run go-live communications and open a heightened-support channel',
          'Log the cutover itself as a justified change with the specific evidence behind the provisional call',
        ],
        checklist: [
          'Lewin reading reflects the provisional state honestly, not a premature Refreeze',
          'Go-live communications sent to every affected cohort',
          'Heightened-support channel open and staffed',
        ],
        gate: [
          'Is the Lewin reading honest about what is confirmed versus still pending?',
          'Has go-live communication reached every affected cohort?',
          'Is elevated support in place for cutover?',
        ],
      },
      {
        name: 'Hypercare',
        cmTrack: [
          'Re-pulse Bridges and Kübler-Ross at the two-week and four-week marks post-go-live (M6)',
          'Track defect-linked sentiment regressions as contained, explainable dips, not general program failure (M12)',
          'Confirm Composite Readiness Index trend by cohort (M14)',
        ],
        checklist: [
          'Two-week and four-week re-pulses completed for all affected cohorts',
          'Any sentiment regression traced to a specific, named incident',
          'Readiness Index trend reviewed, not just the current snapshot',
        ],
        gate: [
          'Have the scheduled re-pulses been completed?',
          'Is every sentiment regression explained by a specific cause?',
          'Is the Readiness Index trend healthy, not just the point-in-time value?',
        ],
      },
      {
        name: 'Sustain',
        cmTrack: [
          'Confirm Bridges/Kübler-Ross reads New Beginning/Commitment across all affected cohorts before calling Refreeze (M6)',
          'Verify reinforcement mechanisms are actually running, not just designed (M12)',
          'Run 30/60/90-day sustainment checkpoints and close out lessons learned (M12)',
        ],
        checklist: [
          'Refreeze called on emotional/behavioral evidence, not the go-live date',
          'Reinforcement mechanisms confirmed running via a verifiable record, not assumed',
          'All scheduled sustainment checkpoints completed and healthy',
        ],
        gate: [
          'Is Refreeze backed by confirmed Bridges/Kübler-Ross evidence across all cohorts?',
          'Are reinforcement mechanisms verified running, not just designed?',
          'Have all sustainment checkpoints been completed?',
        ],
      },
    ],
  },
  {
    id: 'TPL-BPR-7',
    name: 'Common Lifecycle — BPR Variant',
    transformationType: 'bpr',
    phases: [
      { name: 'P1 Intake & Diagnosis', cmTrack: [], checklist: [], gate: [] },
      { name: 'P2 Clean-Slate Design', cmTrack: [], checklist: [], gate: [] },
      { name: 'P3 Build', cmTrack: [], checklist: [], gate: [] },
      { name: 'P4 Pilot', cmTrack: [], checklist: [], gate: [] },
      { name: 'P5 Rollout', cmTrack: [], checklist: [], gate: [] },
      { name: 'P6 Stabilization', cmTrack: [], checklist: [], gate: [] },
      { name: 'P7 Sustainment', cmTrack: [], checklist: [], gate: [] },
    ],
  },
  {
    id: 'TPL-BPA-7',
    name: 'Common Lifecycle — Automation Variant',
    transformationType: 'automation',
    phases: [
      { name: 'P1 Automation-Opportunity Assessment', cmTrack: [], checklist: [], gate: [] },
      { name: 'P2 Architecture Design', cmTrack: [], checklist: [], gate: [] },
      { name: 'P3 Build', cmTrack: [], checklist: [], gate: [] },
      { name: 'P4 UAT & Shadow-Mode', cmTrack: [], checklist: [], gate: [] },
      { name: 'P5 Production Go-Live', cmTrack: [], checklist: [], gate: [] },
      { name: 'P6 Exception Tuning', cmTrack: [], checklist: [], gate: [] },
      { name: 'P7 CoE Handover', cmTrack: [], checklist: [], gate: [] },
    ],
  },
  {
    id: 'TPL-IMS-7',
    name: 'Common Lifecycle — QMS Variant',
    transformationType: 'qms',
    phases: [
      { name: 'P1 Intake & Diagnosis', cmTrack: [], checklist: [], gate: [] },
      { name: 'P2 Design', cmTrack: [], checklist: [], gate: [] },
      { name: 'P3 Implementation', cmTrack: [], checklist: [], gate: [] },
      { name: 'P4 Mock-up Audit', cmTrack: [], checklist: [], gate: [] },
      { name: 'P5 Certifying Audit', cmTrack: [], checklist: [], gate: [] },
      { name: 'P6 Surveillance Prep', cmTrack: [], checklist: [], gate: [] },
      { name: 'P7 Ongoing Surveillance', cmTrack: [], checklist: [], gate: [] },
    ],
  },
  {
    id: 'TPL-CULT-7',
    name: 'Common Lifecycle — Culture Variant',
    transformationType: 'cultural',
    phases: [
      { name: 'P1 Diagnosis', cmTrack: [], checklist: [], gate: [] },
      { name: 'P2 Target Values Design', cmTrack: [], checklist: [], gate: [] },
      { name: 'P3 Leadership Modeling & Reinforcement Build', cmTrack: [], checklist: [], gate: [] },
      { name: 'P4 Pilot Cohort', cmTrack: [], checklist: [], gate: [] },
      { name: 'P5 Organization-Wide Rollout', cmTrack: [], checklist: [], gate: [] },
      { name: 'P6 Reinforcement Through Skepticism', cmTrack: [], checklist: [], gate: [] },
      { name: 'P7 Institutionalization', cmTrack: [], checklist: [], gate: [] },
    ],
  },
  {
    id: 'TPL-OM-7',
    name: 'Common Lifecycle — Operating Model Variant',
    transformationType: 'operating_model',
    phases: [
      { name: 'P1 Current Operating Model Assessment', cmTrack: [], checklist: [], gate: [] },
      { name: 'P2 TOM Design', cmTrack: [], checklist: [], gate: [] },
      { name: 'P3 Detailed Org Design', cmTrack: [], checklist: [], gate: [] },
      { name: 'P4 Pilot Transition', cmTrack: [], checklist: [], gate: [] },
      { name: 'P5 Full Transition', cmTrack: [], checklist: [], gate: [] },
      { name: 'P6 Governance Adoption Tracking', cmTrack: [], checklist: [], gate: [] },
      { name: 'P7 Standing Rhythm Handover', cmTrack: [], checklist: [], gate: [] },
    ],
  },
  {
    id: 'TPL-COMP-7',
    name: 'Common Lifecycle — Compliance Variant',
    transformationType: 'compliance',
    phases: [
      { name: 'P1 Regulatory Requirement & Gap Analysis', cmTrack: [], checklist: [], gate: [] },
      { name: 'P2 Control Design', cmTrack: [], checklist: [], gate: [] },
      { name: 'P3 Control Implementation', cmTrack: [], checklist: [], gate: [] },
      { name: 'P4 Internal Audit / Independent Testing', cmTrack: [], checklist: [], gate: [] },
      { name: 'P5 Controls Go Live', cmTrack: [], checklist: [], gate: [] },
      { name: 'P6 First Monitoring Cycle', cmTrack: [], checklist: [], gate: [] },
      { name: 'P7 Ongoing Compliance Handover', cmTrack: [], checklist: [], gate: [] },
    ],
  },
  {
    id: 'TPL-TSD-7',
    name: 'Common Lifecycle — Training & Skills Variant',
    transformationType: 'training_skills',
    phases: [
      { name: 'P1 Skills Gap Diagnosis', cmTrack: [], checklist: [], gate: [] },
      { name: 'P2 Curriculum Design', cmTrack: [], checklist: [], gate: [] },
      { name: 'P3 Training Delivery', cmTrack: [], checklist: [], gate: [] },
      { name: 'P4 Competency Verification', cmTrack: [], checklist: [], gate: [] },
      { name: 'P5 Practical Application', cmTrack: [], checklist: [], gate: [] },
      { name: 'P6 On-the-Job Coaching', cmTrack: [], checklist: [], gate: [] },
      { name: 'P7 Skills Sustainment', cmTrack: [], checklist: [], gate: [] },
    ],
  },
]

export default phaseTemplates
