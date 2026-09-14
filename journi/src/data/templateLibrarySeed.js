// D-Config item 3: Template Library — reusable authoring templates that sit
// above the per-project logs in M5 Charters (M19/Module19Page), M14
// Communications (Module8Page), and M15 Training (Module9Page). Phase
// Templates (phaseTemplates.js) already cover the project-lifecycle-phase
// case; this seed covers the three template kinds that had no reusable,
// versioned catalog at all: charter templates, communication templates, and
// training curriculum templates. All three share the same runtime shape —
// { id, version, versionHistory, ...kind-specific fields } — so they reuse
// withVersionBump/revertEntityToVersion and <VersionHistoryPanel> exactly
// like Phase Templates and AI Use Cases do.
export const TEMPLATE_LIBRARY_KINDS = ['charterTemplates', 'communicationTemplates', 'trainingTemplates']

export function buildTemplateLibrarySeed() {
  return {
    charterTemplates: [
      {
        id: 'CHT-01',
        name: 'Sponsorship & Leadership Charter — Standard',
        charterType: 'sponsorship_leadership',
        description: 'Baseline charter for establishing an executive sponsor\'s visible-support commitments at project kickoff.',
        sections: [
          { heading: 'Sponsor Commitment', prompt: 'What visible-support actions will the sponsor personally take, and how often?' },
          { heading: 'Escalation Path', prompt: 'Who does the Change Manager escalate to, and within what timeframe?' },
          { heading: 'Review Cadence', prompt: 'How often will sponsor and Change Manager formally check in?' },
        ],
        version: 1,
        versionHistory: [],
      },
      {
        id: 'CHT-02',
        name: 'Communication Charter — Standard',
        charterType: 'communication',
        description: 'Baseline charter for agreeing communication ownership, channels, and review process before the cadence starts.',
        sections: [
          { heading: 'Audience Segmentation', prompt: 'Which cohorts need distinct messaging or channels?' },
          { heading: 'Review & Approval', prompt: 'Who reviews AI-drafted or mass communications before send?' },
          { heading: 'Feedback Loop', prompt: 'How will open/read/feedback signals be captured and acted on?' },
        ],
        version: 1,
        versionHistory: [],
      },
      {
        id: 'CHT-03',
        name: 'Governance Escalation Charter — Standard',
        charterType: 'governance_escalation',
        description: 'Baseline charter defining when and how an issue moves from project team to sponsor coalition to steering committee.',
        sections: [
          { heading: 'Escalation Triggers', prompt: 'What conditions require an automatic escalation (e.g. CRI below band, high-severity risk unmitigated)?' },
          { heading: 'Decision Rights', prompt: 'Who has authority to make the call at each escalation tier?' },
          { heading: 'Closure Criteria', prompt: 'What evidence closes an escalation?' },
        ],
        version: 1,
        versionHistory: [],
      },
    ],
    communicationTemplates: [
      {
        id: 'COMT-01',
        name: 'Go-Live Announcement — All-Hands',
        channel: 'email',
        audience: 'all_employees',
        description: 'Standard go-live announcement covering what changes, when, and where to get help.',
        bodyOutline: 'What is changing → Why it matters to you → What you need to do → Where to get help → Who to contact.',
        version: 1,
        versionHistory: [],
      },
      {
        id: 'COMT-02',
        name: 'Manager Talking Points — Pre-Training',
        channel: 'manager_briefing',
        audience: 'people_managers',
        description: 'Talking points for people managers to use in team huddles before their team starts training.',
        bodyOutline: 'Why this training now → What "good" looks like after training → How manager will support practice time → FAQ redirect.',
        version: 1,
        versionHistory: [],
      },
      {
        id: 'COMT-03',
        name: 'Resistance Response — Individual Follow-Up',
        channel: '1:1',
        audience: 'flagged_individual',
        description: 'Structure for a manager or coach follow-up after a resistance signal is logged against an individual.',
        bodyOutline: 'Acknowledge the concern → Ask an open question about the root cause → Offer a concrete next step → Log the outcome.',
        version: 1,
        versionHistory: [],
      },
    ],
    trainingTemplates: [
      {
        id: 'TRNT-01',
        name: 'Role-Based Curriculum — Frontline Practitioner',
        targetRole: 'practitioner',
        description: 'Standard curriculum shape mapped to the Knowledge and Ability ADKAR blocks for a frontline role.',
        modules: [
          { name: 'Why This Change (Awareness reinforcement)', durationHours: 0.5 },
          { name: 'New Process Walkthrough (Knowledge)', durationHours: 2 },
          { name: 'Hands-On Practice in Sandbox (Ability)', durationHours: 3 },
          { name: 'Certification Check', durationHours: 0.5 },
        ],
        version: 1,
        versionHistory: [],
      },
      {
        id: 'TRNT-02',
        name: 'Manager-as-Coach Enablement',
        targetRole: 'people_manager',
        description: 'Curriculum preparing people managers to run floor-coaching conversations during hypercare.',
        modules: [
          { name: 'Coaching Conversation Framework', durationHours: 1.5 },
          { name: 'Reading Resistance Signals', durationHours: 1 },
          { name: 'Practice Conversations (role-play)', durationHours: 2 },
        ],
        version: 1,
        versionHistory: [],
      },
    ],
  }
}
