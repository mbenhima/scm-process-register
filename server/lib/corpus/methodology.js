// journi's methodology reference corpus — the grounding documents the AI
// Use Case Library's RAG pipeline retrieves against before generating any
// output. Every one of these snippets is the same definition this project's
// own frameworks guide and SRS use — retrieval here is what keeps a
// generated ADKAR narrative, sentiment classification, or divergence read
// anchored to journi's actual stage vocabulary instead of the model's own
// generic (and sometimes different) idea of what "Desire" or "Neutral Zone"
// means.

const METHODOLOGY = [
  { id: 'lewin-unfreeze', text: 'Lewin Unfreeze: the organization acknowledges the current way of working can no longer hold. The business driver is named and the case for change is made. Nothing has changed yet.' },
  { id: 'lewin-change', text: 'Lewin Change: the actual transition is underway — new processes, systems, structures, or values are being built, piloted, and rolled out. The longest of Lewin\'s three stages in every journi archetype.' },
  { id: 'lewin-refreeze', text: 'Lewin Refreeze: the new way of working is locked in as the new normal, confirmed by real evidence (a sustainment checkpoint, a clean monitoring cycle) — never called from the calendar date alone.' },
  { id: 'adkar-awareness', text: 'ADKAR Awareness: does this cohort understand why the change is happening at all. Scored 1-5. The floor every other ADKAR block builds on.' },
  { id: 'adkar-desire', text: 'ADKAR Desire: does this cohort actually want to make the change personally, not just understand it intellectually. Scored 1-5. Most exposed to a specific, nameable fear (e.g. job security).' },
  { id: 'adkar-knowledge', text: 'ADKAR Knowledge: does this cohort know how to do the new thing — the specific steps. Scored 1-5. The block training is built to move first.' },
  { id: 'adkar-ability', text: 'ADKAR Ability: can this cohort actually perform the new behavior under real conditions, not just describe it. Scored 1-5. Knowledge tested against reality.' },
  { id: 'adkar-reinforcement', text: 'ADKAR Reinforcement: does the new behavior hold once active support stops. Scored 1-5. The slowest-moving, most decay-prone block, and the true test of whether a program actually finished.' },
  { id: 'adkar-barrier-rule', text: 'Any ADKAR block score of 2 or below requires a mandatory barrier-reason note and auto-escalates in journi — a low score is never allowed to pass silently into the Composite Readiness Index.' },
  { id: 'bridges-ending', text: 'Bridges Ending: the cohort has not yet let go of the old way of working, psychologically, even if they can describe the new one. About loss, not information.' },
  { id: 'bridges-neutral', text: 'Bridges Neutral Zone: the old way is gone, the new way is not yet fully trusted or habitual. A genuinely uncomfortable, necessary in-between state, not a problem to rush past.' },
  { id: 'bridges-new-beginning', text: 'Bridges New Beginning: the cohort has genuinely adopted the new identity, not just the new process. The emotional counterpart to Lewin\'s Refreeze.' },
  { id: 'kubler-denial', text: 'Kübler-Ross Denial: the cohort does not believe the change is really happening, or that it applies to them. A sentiment state, distinct from ADKAR Awareness (understanding vs. belief).' },
  { id: 'kubler-resistance', text: 'Kübler-Ross Resistance/Anger: the cohort actively pushes back — verbally, in behavior, or by working around the new way. Tracked as real, trackable data in the Resistance Log, not suppressed.' },
  { id: 'kubler-exploration', text: 'Kübler-Ross Exploration: the cohort starts testing the new way of working tentatively — trying it out rather than fighting it, but not yet fully committed.' },
  { id: 'kubler-commitment', text: 'Kübler-Ross Commitment: the cohort genuinely embraces the new way of working and would choose it again. The sentiment counterpart to Bridges New Beginning and Lewin Refreeze.' },
  { id: 'divergence-pattern', text: 'Divergence Pattern Detected (ALT-001): Knowledge >= 4 AND Ability >= 4 on the ADKAR Engine, while Bridges reads exactly "Ending", for the same cohort — a trained-but-not-yet-accepted signal, computed live from ADKAR and the Emotional & Transition Layer together, not a single-module trigger.' },
  { id: 'cri-formula', text: 'Composite Readiness Index (CRI): ADKAR% x 0.50 + Kubler-Ross sentiment% x 0.25 + Training completion% x 0.25, recalculated live as any of its three inputs change. The number a Steering Committee reviews at every phase gate.' },
  { id: 'resistance-log-rule', text: 'Resistance Escalation Threshold Breached (ALT-004): three or more open (non-closed) entries in the Resistance Log within journi\'s rolling window. Each entry carries a type — role, skill, will, or systemic — and a closure record once resolved.' },
  { id: 'regression-risk-rule', text: 'Regression Risk Score Critical (ALT-002): a sustainment checkpoint is marked complete with regression risk logged as High — the signal that a population has reverted to old behavior under real operating pressure after appearing to adopt the new one.' },
  { id: 'sponsor-coverage-rule', text: 'Sponsor Coverage Gap (ALT-003): Sponsor visibility on the Sponsor & Coalition module is logged as "weak" — an invisible Sponsor damages Bridges and Kübler-Ross evidence fastest of any single gap.' },
  { id: 'coalition-gap-rule', text: 'Guiding Coalition Gap (ALT-010): the Sponsor & Coalition record names fewer than two coalition members — a single-sponsor structural risk, distinct from a Sponsor visibility problem.' },
  { id: 'individual-visibility-rule', text: 'Only Super Admin, Group Admin, Organization Admin, Change Manager, and People Manager roles may see individual-level ADKAR or sentiment data in journi; every other role sees an aggregated, cohort-level view only.' },
  { id: 'rbac-scope-rule', text: 'journi\'s RBAC scope is hierarchical: platform (Super Admin), group, organization, or project. A user scoped to a project never sees data from a different project, organization, or group, regardless of role.' },
  { id: 'human-checkpoint-rule', text: 'Every AI Use Case in journi is Assistive or Augmented, never autonomous: its output is a draft or suggestion only, and a named human role must explicitly accept, edit, or reject it before it becomes part of the record — logged either way to the AI usage audit log.' },
]

export function methodologyCorpusDocs() {
  return METHODOLOGY.map((m) => ({ id: m.id, text: m.text }))
}

export default METHODOLOGY
