// Generic AI Use Case catalog, one per NCP process step (S1-S7). Unlike a
// sector-flavored roadmap of hypothetical future AI ideas, these seven
// document the AI Agents that are actually built into every NCP Solver
// deployment (server/src/services/aiAgents.js) — so every organization,
// regardless of sector, is seeded with the same seven, all at maturity
// stage 5 (Production) since they are shipped and running today, not ideas.
//
// Each entry drives one AI Use Case (metadata) plus its version-1 content
// (the labeled sections: inputs, prompt, expected output, constraints/guardrails).

export const AI_USE_CASE_TEMPLATES = [
  {
    title: 'NCP Classification & Similar-Case Assistant', stage: 'S1', business_function: 'quality', ai_technique: 'nlp', maturity_stage: 5, status: 'production',
    description: 'At S1 — Detection & Alert, suggests an initial criticality, priority, and a shortlist of similar past NCP Sheets the moment a new problem is registered, so triage starts from context instead of a blank slate.',
    expected_impact: 'Faster, more consistent initial triage and fewer missed "this happened before" signals right from the point of detection.',
    inputs: 'The new Sheet\'s title and description; the tenant\'s own closed-Sheet history.',
    prompt: 'Given this Sheet\'s title and description, suggest a criticality and priority, and surface the most similar past Sheets in this organization with a confidence score.',
    expected_output: 'A suggested criticality/priority pair plus a ranked shortlist of similar past Sheets; never applied automatically — the Reporter or CI Pilot accepts, adjusts, or ignores it.',
    constraints_guardrails: 'Never auto-sets criticality/priority on the Sheet; scoped strictly to the requesting organization\'s own data; every invocation is logged to the AI Agent Log with a confidence score.',
    model_technique_notes: 'Rule-based severity heuristics plus TF-IDF similarity search over the tenant\'s closed-Sheet corpus (runClassificationAgent); swappable for an LLM/embedding-based classifier behind the same interface.',
  },
  {
    title: '5W2H Problem-Structuring Assistant', stage: 'S2', business_function: 'quality', ai_technique: 'nlp', maturity_stage: 5, status: 'production',
    description: 'At S2 — Problem Understanding, drafts a starting-point 5W2H (What/Where/When/Who/Why/How/How-Much) breakdown from a Sheet\'s title and description, so the team edits a scaffold instead of writing one from scratch.',
    expected_impact: 'Faster, more complete problem framing before any corrective work begins, especially valuable when a case is filed under time pressure.',
    inputs: 'The Sheet\'s title, description, and detection context.',
    prompt: 'Draft a candidate 5W2H breakdown from this Sheet\'s title and description, flagging any dimension it cannot confidently infer.',
    expected_output: 'A draft 5W2H record the NCP Team Member reviews and edits before saving; unresolved dimensions are left blank rather than guessed.',
    constraints_guardrails: 'Draft only — never saved until a human reviews and submits it; no dimension is fabricated when the source text doesn\'t support it.',
    model_technique_notes: 'Rule-based template extraction from the Sheet\'s free text (runProblemStructuringAgent); a future version could substitute an LLM-based extractor behind the same interface.',
  },
  {
    title: 'Immediate Containment Action Advisor', stage: 'S3', business_function: 'operations', ai_technique: 'rag', maturity_stage: 5, status: 'production',
    description: 'At S3 — Immediate/Containment Actions, retrieves containment actions that worked on similar past problems in this organization, so the team isn\'t starting its short-term response from zero.',
    expected_impact: 'Faster, more effective containment, reducing exposure time between detection and a validated fix.',
    inputs: 'The current Sheet\'s description and the tenant\'s closed-Sheet Capitalization Library.',
    prompt: 'Given this Sheet\'s description, retrieve the most similar closed Sheets and summarize the immediate/containment actions that were recorded as effective.',
    expected_output: 'A ranked list of suggested containment actions with their source Sheet number, for the Action Owner (AR) to adapt to the current situation.',
    constraints_guardrails: 'Every suggestion is attributed to its source Sheet; the Action Owner (AR) must still define and execute the actual action — nothing is auto-applied.',
    model_technique_notes: 'TF-IDF/cosine retrieval (RagIndex) over the tenant\'s own closed-Sheet corpus (runContainmentAdvisor); tenant-isolated, never cross-organization.',
  },
  {
    title: 'Root Cause Mining Assistant', stage: 'S4', business_function: 'quality', ai_technique: 'rag', maturity_stage: 5, status: 'production',
    description: 'At S4 — Root Cause Analysis, mines the organization\'s own history of closed Sheets for candidate root causes and 6M categories similar to the current problem.',
    expected_impact: 'Deeper, faster root cause analysis grounded in what has actually caused similar problems before, rather than starting the 5-Why or Ishikawa exercise cold.',
    inputs: 'The current Sheet\'s description and the root causes recorded on similar closed Sheets.',
    prompt: 'Given this Sheet\'s description, retrieve similar closed Sheets and summarize their recorded root causes and 6M categories as candidates for this investigation.',
    expected_output: 'A ranked list of candidate root causes with 6M category and source Sheet number, for the NCP Team to validate or discard.',
    constraints_guardrails: 'Candidates only — the team must still validate the true root cause via 5-Why or Ishikawa; nothing is written to the Sheet automatically.',
    model_technique_notes: 'Same RagIndex TF-IDF engine as the Capitalization Library search (runRootCauseMining), tenant-scoped.',
  },
  {
    title: 'Corrective Action Recommendation Engine', stage: 'S5', business_function: 'quality', ai_technique: 'rag', maturity_stage: 5, status: 'production',
    description: 'At S5 — Corrective Action Plan, recommends proven corrective actions for a given root cause, drawn from this organization\'s own Capitalization Library of resolved problems.',
    expected_impact: 'Higher first-time effectiveness rate on corrective actions by starting from what has already been proven to work.',
    inputs: 'The validated root cause(s) for this Sheet and the tenant\'s closed-Sheet Capitalization Library.',
    prompt: 'Given this root cause, retrieve closed Sheets with a similar root cause and summarize the corrective actions that were recorded as effective.',
    expected_output: 'A ranked list of candidate corrective actions with source Sheet number and, where available, their recorded effectiveness.',
    constraints_guardrails: 'Recommendation only; the Action Owner (AR) and CI Pilot decide the actual corrective action plan for this Sheet.',
    model_technique_notes: 'TF-IDF retrieval over the Capitalization Library (runActionRecommendation), same engine family as the S3/S4/S7 agents.',
  },
  {
    title: 'Corrective Action Effectiveness Evaluation Assistant', stage: 'S6', business_function: 'quality', ai_technique: 'predictive_analytics', maturity_stage: 5, status: 'production',
    description: 'At S6 — Execution & Evaluation, surfaces the specific root cause an Evaluator needs to re-verify for each pending corrective action, plus this organization\'s historical corrective-action effectiveness rate, as context for the effectiveness verdict.',
    expected_impact: 'More consistent, evidence-informed effectiveness verdicts, judged against a visible organizational baseline rather than gut feel.',
    inputs: 'The Sheet\'s root causes and corrective actions, and the organization\'s historical corrective-action evaluation outcomes.',
    prompt: 'For each pending corrective action on this Sheet, state the specific root cause to re-verify and this organization\'s historical corrective-action effectiveness rate.',
    expected_output: 'Per-action evaluation context (root cause to re-check, historical effectiveness %) shown to the Evaluator (AE) before they record Effective / Not Effective.',
    constraints_guardrails: 'Context only — the Evaluator (AE), who must differ from the Action Owner (AR), always makes and records the actual verdict.',
    model_technique_notes: 'Aggregates the tenant\'s own historical action-evaluation outcomes (runEvaluationAssistant); a statistical rate, not a predictive model, at this maturity stage.',
  },
  {
    title: 'REX (Lessons-Learned) Drafting Assistant', stage: 'S7', business_function: 'quality', ai_technique: 'nlp', maturity_stage: 5, status: 'production',
    description: 'At S7 — Capitalization, drafts the REX narrative — lessons learned and standardization/generalization recommendations — from the Sheet\'s full S1-S6 content, for the team to review and finalize.',
    expected_impact: 'Faster, more consistent capitalization, so fewer resolved problems go un-documented for lack of time to write up the REX.',
    inputs: 'The Sheet\'s full S1-S6 content: problem understanding, root causes, immediate and corrective actions, and their evaluation outcomes.',
    prompt: 'Draft a Lessons Learned narrative and a standardization/generalization recommendation from this Sheet\'s full S1-S6 content.',
    expected_output: 'A draft REX (Lessons Learned, Root Cause Summary, Solution Summary, Standardization/Generalization recommendation) for the CI Pilot or Quality Manager to review, edit, and finalize before closing the Sheet.',
    constraints_guardrails: 'Draft only — a human always reviews and finalizes the REX before the Sheet can close; nothing is published to the Capitalization Library un-reviewed.',
    model_technique_notes: 'Rule-based template synthesis from the Sheet\'s structured S1-S6 fields (runRexGenerationAgent); swappable for an LLM-based summarizer behind the same interface, once one is configured via LLM Configuration.',
  },
];
