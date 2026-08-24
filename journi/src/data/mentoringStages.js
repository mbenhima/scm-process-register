// Module 19 — Mentoring Progression Model (D31c): the detailed 3-stage
// Execution model behind CHTR-07's Diagnosis -> Training Plan Elaboration ->
// Execution -> Closure lifecycle. A regression at any Autonomous-stage
// spot-audit routes back to Observer, not back to Trainee — the model
// degrades gracefully rather than restarting from zero.
const mentoringStages = [
  {
    id: 'MENT-01',
    name: 'Trainee',
    order: 1,
    description:
      'The mentee learns the process under direct instruction, in a risk-free sandbox environment; errors are expected and used as teaching moments.',
    entryCriteria: 'Completed role-based curriculum (Module 9); assigned to a named Mentor',
    exitCriteria: 'Consistent, accurate task completion in the sandbox across a defined number of repetitions, confirmed by the Mentor',
    typicalDuration: '1-2 weeks, cohort-dependent',
    setting: 'Sandbox / practice environment (Module 9)',
    mentorInvolvement: 'Continuous — Mentor actively instructs and corrects in real time',
    linkedCharterActionId: 'CHTRACT-0703',
    linkedRuleId: 'RULE-006',
    competencyEvidenceRequired: 'Sandbox completion log with Mentor sign-off',
    regressionPath: 'Below-threshold performance triggers remedial training before Trainee stage can be re-attempted.',
  },
  {
    id: 'MENT-02',
    name: 'Observer',
    order: 2,
    description:
      'The mentee performs the live process while the Mentor observes without intervening unless a critical error is imminent; builds real-condition confidence.',
    entryCriteria: 'Mentor confirms consistent sandbox performance (Trainee exit criteria met)',
    exitCriteria: 'A defined number of live-environment repetitions performed correctly with zero critical-error interventions from the Mentor',
    typicalDuration: '1-2 weeks, cohort-dependent',
    setting: 'Live production environment, Mentor physically or virtually present',
    mentorInvolvement: 'Passive — Mentor observes and logs, intervenes only on critical error',
    linkedCharterActionId: 'CHTRACT-0704',
    linkedRuleId: '',
    competencyEvidenceRequired: 'Observation log per repetition, Mentor-signed',
    regressionPath: 'Repeated critical-error interventions return the mentee to Trainee stage (MENT-01) rather than advancing to Autonomous.',
  },
  {
    id: 'MENT-03',
    name: 'Autonomous',
    order: 3,
    description:
      "The mentee performs the live process unsupervised; Mentor involvement shifts from direct oversight to periodic spot-audit, matching Module 9's 'trained vs. capable' distinction.",
    entryCriteria: 'Mentor confirms zero critical-error live repetitions (Observer exit criteria met); Functional Process Owner co-signs competency',
    exitCriteria: 'Formal Autonomous sign-off recorded (CHTRACT-0706); handed off from Mentor to the mentee\'s regular People Manager',
    typicalDuration: 'Ongoing, from transition date',
    setting: 'Live production environment, unsupervised',
    mentorInvolvement: 'Minimal — periodic spot-audit only, per Module 12 reinforcement cadence',
    linkedCharterActionId: 'CHTRACT-0705, CHTRACT-0706',
    linkedRuleId: 'RULE-006',
    competencyEvidenceRequired: 'FPO-countersigned competency record; feeds Training Completion Rate KPI',
    regressionPath:
      'A spot-audit failure or a Module 12 regression flag can return the individual to Observer stage (MENT-02) for targeted re-coaching rather than restarting the full mentoring cycle.',
  },
]

export default mentoringStages
