// Knowledge base content. Global articles restate guidance from the source deliverables (Process Design
// Reference v2.0, Packs & Add-Ons Catalog, D30 Licensing Schema, Dynamic Apps Standard SRS).
// Tenant practice notes and REX entries are fictional demo content.
export const GLOBAL_KB = [
  { kind: 'Standard', ref: 'PDR-8.2', title: 'Gate decision outcomes: Go, Kill, Hold, Recycle', tags: 'MP-121', body: 'Every gate uses four outcomes. Go: the project proceeds and the next E2E process starts. Kill: the project stops, resources are released and lessons learned are recorded. Hold: the project pauses, for example pending a market or regulatory event, and a re-review date is set. Recycle: the project returns to named earlier tasks to close evidence gaps, then comes back to the same gate.' },
  { kind: 'Standard', ref: 'PDR-8.3', title: 'Gate roles and segregation of duties', tags: 'MP-121 MP-122 CTL-01', body: 'In every E2E process the checklist task is performed by Quality Assurance (Responsible) and owned by the Product Manager (Accountable). The gate decision is performed by the Executive Sponsor and owned by the Gate Review Board. The person accountable for a project cannot record its gate decision (CTL-01). Contentious decisions are escalated under MP-121 task 13; exceptions and waivers are recorded under MP-121 task 15 and MP-122 task 13.' },
  { kind: 'Standard', ref: 'PDR-7.4', title: 'Track selection scoring model', tags: 'MP-123', body: 'Score seven criteria from 1 to 5: strategic impact, investment level, technical novelty, regulatory and safety exposure, market scope, cross-functional reach and product-service integration. A total of 7-14 recommends the Fast Track, 15-24 the Light Track and 25-35 the Full Track. Fast is not allowed if any criterion scores 5. Light is the minimum when regulatory and safety exposure scores 4 or more. Full is mandatory for any safety-critical product. Every override is recorded with its justification (MP-123 task 12).' },
  { kind: 'Standard', ref: 'PDR-7.1', title: 'Innovation tracks: Full, Light and Fast', tags: 'MP-123', body: 'Full Track: complex innovation, all 69 macro processes, 9 E2E processes, gates T-1 to T6, 30-50 checklist items per gate. Light Track: medium complexity, 21 mandatory macro processes plus selected optional ones, 8 E2E processes (E2E-08 relaunch branch only), gates T-1, T0, T1, T2, T3 and T5, 15-25 items per gate. Fast Track: low complexity, 13 mandatory macro processes, E2E-01, E2E-02 and E2E-05, gates T-1, T0 and T3, 5-10 items per gate.' },
  { kind: 'Standard', ref: 'PDR-3.1', title: 'Chain relationships between E2E processes', tags: 'E2E', body: 'E2E-01 feeds E2E-02. The T0 Go decision opens design (E2E-03), development (E2E-04) and launch (E2E-05). The T3 Go-Live decision opens after-sales (E2E-06), performance review (E2E-07), relaunch or retirement (E2E-08) and campaigns (E2E-09). E2E-08 Branch A loops back to E2E-03, E2E-04 or E2E-05; Branch B retires the product at T6. E2E-09 runs in parallel with all other processes.' },
  { kind: 'Guidance', ref: 'CAT-1.2', title: 'Commercial packaging principles', tags: 'Packs', body: 'Packs are modular (customers buy only what they need), scalable (start small, expand), segment-aligned, integration-ready and value-driven, with a minimum price of USD 40 per user per month. Packs 01 to 10 together cover all 69 macro processes; PACK-11 CortexPLM Enterprise includes all modules, integrations and add-ons.' },
  { kind: 'Guidance', ref: 'CAT-A', title: 'Bundle pricing review notes', tags: 'Bundles', body: 'Recalculated savings show that six bundles (BND-03 to BND-08) state savings that do not match the pack prices. BND-08 Complete Bundle costs USD 799 while PACK-11 at USD 299 already includes everything. Add-ons have no list price in the catalog and are quoted on request.' },
  { kind: 'Guidance', ref: 'D30-2', title: 'Licensing: one interface, SaaS and OnPrem implementations', tags: 'MP-18 D30', body: 'The application uses a single LicenceProvider interface. In SaaS mode the licence record is stored and verified by the server. In OnPrem mode the administrator uploads a vendor-signed .lic file; its Ed25519 signature, expiry date and optional hardware binding are verified. One licence file is issued per customer and its maxUsers field controls how many users can be active. Add-ons are independent toggles: activation is idempotent and compliance add-ons show a non-certification disclosure.' },
  { kind: 'Guidance', ref: 'SRS-4.3', title: 'Compliance & Security Standards are not certifications', tags: 'GDPR ISO27001 SOC2', body: 'Activating a Compliance & Security Standard such as GDPR, ISO/IEC 27001 or SOC 2 seeds a starting set of controls, once, tagged to that framework. It does not constitute a certification, an external audit or a legal attestation of compliance. The organization remains responsible for its compliance programme and any external certification. Deactivating a standard keeps the tagged controls.' },
  { kind: 'Guidance', ref: 'SRS-3.7', title: 'Justification governance (stage then justify)', tags: 'Audit', body: 'Every score or state change to a governed record follows a stage-then-justify pattern: stage the new value, write a justification note, then save. The new value and its justification are appended together to the audit log. A platform-wide setting decides whether the justification is required before Save is enabled.' },
  { kind: 'Guidance', ref: 'SRS-2.2', title: 'AI tiers: Assistive and Augmented, never autonomous', tags: 'AI MP-15', body: 'Every AI use case is Assistive or Augmented. No AI capability takes an irreversible action without a human decision. Each suggestion is labelled as AI-generated, shows its tier, its source and the references it was grounded on, and its outcome (accepted, edited or rejected) is written to an append-only usage log.' },
  { kind: 'Guidance', ref: 'PDR-1.5', title: 'Three levels of steps: UFS, UFT and activity steps', tags: 'E2E', body: 'User-facing steps (30) are the cross-process steps shown to users. User-facing tasks (81) are the tasks inside each E2E process, each with a RACSI assignment. Activity-level steps (210) are BPMN activities within the chains, declared in the chain table and detailed for E2E-01.' },
];

export const TENANT_KB = {
  PUB: [
    ['Digital service accessibility checklist', 'Before T3, test every citizen journey with a screen reader, keyboard-only navigation and a 200% zoom. Record results in the evidence pack. Provide an assisted channel at civic centres for residents who cannot complete the journey online.'],
    ['Working with the national identity platform', 'Book integration test slots at least eight weeks ahead. Keep the identity-verification level of each service documented in the specification and confirmed at T1.'],
    ['Budget cycle and gate timing', 'Plan T0 decisions before the annual budget submission so that approved projects are funded in the next fiscal year.'],
  ],
  MFG: [
    ['Hot-weather curing practice', 'In summer months, schedule pours before 10:00, use curing compounds and monitor core temperature. Log deviations as NCRs linked to the batch.'],
    ['Transport and handling of large elements', 'Check lifting anchor positions against the drawing and the transport frame before release. Damage in transport is the main source of site rework.'],
    ['Embodied carbon declarations', 'Keep the environmental product declaration with the product record and update it when the cement blend changes.'],
  ],
  HLT: [
    ['Clinical evidence planning for connected devices', 'Agree the clinical evaluation plan with the regulatory team before T1. Missing usability or clinical data is the most frequent reason for a Recycle at T3.'],
    ['Patient data minimisation', 'Collect only the vital signs needed for the care pathway. Pseudonymise data used for analytics and document retention periods.'],
    ['Nurse onboarding for home programmes', 'Plan two short training sessions and a quick-reference card per device. Adoption drops when training is longer than 90 minutes.'],
  ],
  DAI: [
    ['Shelf-life study before launch', 'Run real-time and accelerated shelf-life tests at 4 and 8 degrees Celsius. Attach the study report to the T3 checklist.'],
    ['Seasonal milk supply planning', 'Summer raw-milk volumes drop; confirm member-farm volumes with the procurement team before committing launch quantities.'],
    ['Allergen and nutrition labelling review', 'Every label change goes through the regulatory checklist: allergen declaration, nutrition table, claims and language versions.'],
  ],
  TRN: [
    ['Service change consultation', 'Consult passengers and unions at least six weeks before a network change. Record feedback in the customer journey task.'],
    ['Fleet delivery risk', 'Vehicle deliveries slip often. Keep the existing fleet maintenance plan valid until new vehicles pass acceptance tests.'],
    ['Payment security', 'Fare payment changes must keep cardholder data out of CortexPLM records; store only transaction references.'],
  ],
  ENR: [
    ['Hazardous-area certification lead times', 'Equipment for classified areas needs certification before installation. Plan it in the development plan and track it as a mandatory T2 checklist item.'],
    ['Grid connection approvals', 'Submit grid connection studies before T1 for storage and generation projects; approval lead time can exceed six months.'],
    ['Permit conditions tracking', 'Record environmental permit conditions as requirements and link them to acceptance tests.'],
  ],
  RED: [
    ['Escrow evidence at every gate', 'Off-plan projects must show the escrow account balance against the construction milestone plan at T2 and T3; the regulator can ask for it at any time.'],
    ['Permit path before sales launch', 'Do not open off-plan sales before the building permit and the off-plan sales licence are both issued; record both as T3 gate evidence.'],
    ['Handover readiness review', 'Six weeks before handover, run a snagging walk-through with the contractor and the facility team; open defects are tracked in the snagging app.'],
  ],
};

export const REX_LIBRARY = [
  { title: 'Late involvement of the regulatory team', cat: 'Regulatory', mp: 'MP-30', rating: 2, well: 'The team recovered quickly once the gap was found.', wrong: 'Regulatory requirements were confirmed only at T3, causing a Recycle.', cause: 'Regulatory review not planned before T1', rec: 'Make regulatory validation a mandatory T1 checklist item for regulated offers.' },
  { title: 'Clear business case accelerated the T0 decision', cat: 'Governance', mp: 'MP-121', rating: 5, well: 'Scenarios and sensitivities were agreed with finance before the gate.', wrong: 'Nothing significant.', cause: 'Early finance involvement', rec: 'Invite the Finance Controller to the opportunity study kick-off.' },
  { title: 'Supplier delay on a critical component', cat: 'Supplier', mp: 'MP-09', rating: 3, well: 'An alternative supplier was qualified in five weeks.', wrong: 'The launch date slipped by one month.', cause: 'Single-source component without a second supplier', rec: 'Qualify a second source for critical components during E2E-04.' },
  { title: 'Customer journey testing found usability issues early', cat: 'Market', mp: 'MP-17', rating: 4, well: 'Usability sessions with real users in E2E-03 prevented rework after launch.', wrong: 'Sessions were scheduled late in the phase.', cause: 'Usability testing planned too late', rec: 'Schedule journey validation in the first half of E2E-03.' },
  { title: 'Evidence packs incomplete at first submission', cat: 'Governance', mp: 'MP-122', rating: 2, well: 'Checklist owners responded fast to the blocked submission.', wrong: 'Two mandatory items had no evidence, so the gate was blocked (BR-004).', cause: 'Regulatory review not planned before T1', rec: 'Run a pre-gate review one week before submission (MP-122 task 12).' },
  { title: 'Training material reused across regions', cat: 'People', mp: 'MP-38', rating: 4, well: 'One training kit served three regions with local examples.', wrong: 'Translations were late for one language.', cause: 'Localization not planned in the launch plan', rec: 'Add localization tasks to the detailed launch plan.' },
  { title: 'Retirement communication reduced complaints', cat: 'Market', mp: 'MP-34', rating: 5, well: 'Customers received the end-of-life notice six months ahead with a migration offer.', wrong: 'Spare-parts demand was underestimated.', cause: 'Last-time-buy volumes based on outdated data', rec: 'Use installed-base data to size last-time buys.' },
  { title: 'Scope creep during development', cat: 'Technical', mp: 'MP-07', rating: 2, well: 'The change board stopped non-essential changes after T2.', wrong: 'Five change requests were accepted without impact analysis before T2.', cause: 'Change impact analysis skipped for small changes', rec: 'Apply the change board process to every change after T1.' },
];
