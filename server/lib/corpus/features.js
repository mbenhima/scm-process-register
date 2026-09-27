// journi's feature/module catalog — the corpus "Query Application Features"
// retrieves against. One entry per routed module, using the same display
// numbering shown in the app's own navigation (src/i18n/translations.js),
// which is independent of the internal route path and i18n key numbering
// (see the comment at the top of Sidebar.jsx) — this file is the single
// place that reconciles the two into one real, user-facing catalog.
//
// `roles`, when present, restricts a module to the same role set the app
// itself enforces (src/App.jsx's <RequireRole> + src/utils/rbac.js) — Query
// Features filters its results against this before they ever reach the
// retrieval step, so a role never sees a feature it cannot actually open.

const FEATURES = [
  { path: '/app/dashboard', number: null, name: 'Portfolio Dashboard', text: 'Portfolio Dashboard: a roll-up view across every Group, Organization, and Change Management Project a user can see, with Composite Readiness Index trends, open alerts, and phase-gate status side by side. The landing screen after login.' },
  { path: '/app/m1', number: 1, name: 'Hierarchy', text: 'Module 1, Hierarchy: create and manage the Group, Organization, Main Project, and Change Management Project tree that every other module scopes against. Super Admin, Group Admin, and Organization Admin only.', roles: ['super_admin', 'group_admin', 'org_admin'] },
  { path: '/app/m2', number: 2, name: 'Identity & RBAC', text: 'Module 2, Identity & RBAC: manage user accounts, their role and scope, and the runtime-editable Permission Matrix that drives every canWrite/canManageX check across the app, plus Governance Settings and the platform License record. Super Admin, Group Admin, and Organization Admin only.', roles: ['super_admin', 'group_admin', 'org_admin'] },
  { path: '/app/m22', number: 3, name: 'OBS', text: 'Module 3, OBS (Organizational Breakdown Structure): the Macro Process catalog and the RACSI responsibility grid (Responsible/Accountable/Consulted/Support/Informed) mapped one row per macro process, platform-wide.' },
  { path: '/app/m18', number: 4, name: 'Process Registry', text: 'Module 4, Process Registry: the End-to-End process catalog (E2E-01 through E2E-08+) and each transformation archetype\'s registered Phase Template — TPL-ERP-8, TPL-BPR-7, TPL-BPA-7, TPL-IMS-7, TPL-CULT-7, TPL-OM-7, TPL-COMP-7, TPL-TSD-7 — the reference library Module 8\'s WBS & Gantt loads from.' },
  { path: '/app/m19', number: 5, name: 'CM Charters', text: 'Module 5, CM Charters: the Change Management Charter Registry (Sponsorship/Leadership, Communication, Organizational Impact, Participative Management, Team Coaching, One-to-One Coaching, Governance Escalation, Pulse/Interview) and their per-project compliance action log.' },
  { path: '/app/m16', number: 6, name: 'AI Use Case Library', text: 'Module 6, AI Use Case Library: the governed catalog of every Assistive/Augmented AI use case journi ships (drafting assistants, classifiers, summarizers — never autonomous), each with its own prompt template, human-checkpoint requirement, and per-Organization/per-Project activation toggle. Also where a user connects their own LLM provider API key.' },
  { path: '/app/m3', number: 7, name: 'Initiative Registry', text: 'Module 7, Initiative Registry: the system of record for a Change Management Project\'s business driver, scope, target population, and its single Lewin macro-state (Unfreeze / Change / Refreeze), with a mandatory justification note on every state change.' },
  { path: '/app/m17', number: 8, name: 'WBS & Gantt', text: 'Module 8, WBS & Gantt: the combined Project Management and Change Management schedule — load a registered Phase Template, track baseline vs. actual dates per task/step, and record each Phase Gate\'s Joint Decision (Go / Conditional / No-Go).' },
  { path: '/app/m4', number: 9, name: 'Stakeholder Mapping', text: 'Module 9, Stakeholder Mapping: cohort-level impact scoring across Process, Technology, Role, Location, and Identity dimensions, with each cohort tagged by site/department — the map every other module\'s cohort-scoped reading (ADKAR, sentiment, training) is filtered against.' },
  { path: '/app/m5', number: 10, name: 'ADKAR Engine', text: 'Module 10, ADKAR Engine: score a cohort across the five ADKAR blocks (Awareness, Desire, Knowledge, Ability, Reinforcement), 1-5 each, with a mandatory barrier-reason note and auto-escalation on any score of 2 or below.' },
  { path: '/app/m6', number: 11, name: 'Emotional & Transition', text: 'Module 11, Emotional & Transition Layer: a cohort\'s Bridges transition position (Ending / Neutral Zone / New Beginning) and Kübler-Ross sentiment (Denial / Resistance-Anger / Exploration / Commitment), cross-referenced live against ADKAR to compute the Divergence Pattern alert.' },
  { path: '/app/m13', number: 12, name: 'Risk Register', text: 'Module 12, Risk Register: adoption, sponsorship, capacity, and saturation risks, each with a likelihood/impact score, owner, and mitigation plan, feeding the Change Saturation alert when a population is targeted by multiple concurrent initiatives.' },
  { path: '/app/m7', number: 13, name: 'Sponsor & Coalition', text: 'Module 13, Sponsor & Coalition: the Sponsor\'s own action roadmap (town halls, go-live messages), visibility rating (weak/moderate/strong), and the guiding coalition\'s named membership — fewer than two named members fires the Guiding Coalition Gap alert.' },
  { path: '/app/m8', number: 14, name: 'Communications', text: 'Module 14, Communications: the message/audience/channel plan for a project, with a sent/queued status per entry — more than three not-yet-sent communications queued for one population across concurrent projects fires the Communication Overload alert.' },
  { path: '/app/m9', number: 15, name: 'Training', text: 'Module 15, Training: the curriculum entry, cohort, and completion tracking behind every training program in this series, distinct from mere attendance — pairs with Competency Verification–style records where an archetype calls for one.' },
  { path: '/app/m10', number: 16, name: 'Resistance', text: 'Module 16, Resistance: the Resistance Log — one entry per open concern, with a type (role/skill/will/systemic) and closure record. Three or more open entries within journi\'s rolling window fires the Resistance Escalation alert.' },
  { path: '/app/m11', number: 17, name: 'Manager as Coach', text: 'Module 17, Manager as Coach: a People Manager\'s own coaching-conversation log per direct report, the team-scoped heatmap it feeds, and the record a sustainment checkpoint\'s Reinforcement evidence draws on.' },
  { path: '/app/m15', number: 18, name: 'Journey Map', text: 'Module 18, Journey Map: a visual, week-by-week timeline of a cohort\'s or project\'s framework readings and key events — the same shape this series\' own archetype guides render as a Part 4 timeline.' },
  { path: '/app/m20', number: 19, name: 'Journeys & Analytics', text: 'Module 19, Journeys & Analytics: cross-project journey comparison and portfolio-level trend views, one level up from a single project\'s own Journey Map (Module 18).' },
  { path: '/app/m14', number: 20, name: 'Analytics', text: 'Module 20, Analytics: the Composite Readiness Index (ADKAR 50% + Kübler-Ross sentiment 25% + training completion 25%), recalculated live, plus the Benchmarking view (In Line / Ahead / Behind) the Steering Committee reviews at every phase gate.' },
  { path: '/app/m12', number: 21, name: 'Sustainment', text: 'Module 21, Sustainment: post-go-live checkpoints (30/60/90-day or archetype-specific cadence) with a regression-risk rating — a High rating fires the Regression Risk alert and blocks Sustainment Sign-Off until a clean checkpoint follows.' },
  { path: '/app/m21', number: 22, name: 'Field Notes', text: 'Module 22, Field Notes: a free-form, categorized log (Decision / Risk / Workshop / Other) for anything that doesn\'t have a dedicated field elsewhere — the module every archetype guide in this series cites for a documented rationale, a consolidated finding, or a milestone note.' },
  { path: '/app/query-data', number: null, name: 'Query Data', text: 'Query Data: ask a plain-language question about this tenant\'s own data — project counts, ADKAR trends, open resistance entries, risk exposure — and get a grounded, sourced answer, filtered to exactly what your role and scope are allowed to see.' },
  { path: '/app/query-features', number: null, name: 'Query Features', text: 'Query Features: ask what journi can do, in plain language, and get pointed straight at the specific module — only the modules your role can actually open are ever suggested.' },
]

export function featureCorpusDocs() {
  return FEATURES.map((f) => ({
    id: f.path,
    text: `${f.number ? `Module ${f.number}` : ''} ${f.name}. ${f.text}`,
    name: f.name,
    number: f.number,
    path: f.path,
    roles: f.roles || null,
  }))
}

export function featuresForRole(role) {
  return FEATURES.filter((f) => !f.roles || f.roles.includes(role))
}

export default FEATURES
