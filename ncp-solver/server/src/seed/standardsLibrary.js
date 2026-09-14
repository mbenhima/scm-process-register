// The illustrative Standards Library from the Technical & Solution Offer's
// Annex A — 15 cross-sector reference standards a customer selects from
// during Business Analysis, up to their Pack's allowance (3 Resolve / 5
// Govern / 7 Assure). Seeded identically into every Organization; is_active
// reflects that Organization's current Pack allotment (see packConfig.js /
// license routes). stageTag is an illustrative primary S1-S7 grounding tag
// used for per-step RAG retrieval (item 7) — the standard best informs an
// AI agent working at that stage; it does not preclude relevance elsewhere.
export const ANNEX_A_STANDARDS = [
  { code: 'ISO-9001', title: 'ISO 9001 — Quality Management Systems', domain: 'Cross-industry quality', stageTag: 'S2' },
  { code: 'ISO-14001', title: 'ISO 14001 — Environmental Management Systems', domain: 'Cross-industry environmental', stageTag: 'S4' },
  { code: 'ISO-45001', title: 'ISO 45001 — Occupational Health & Safety Management', domain: 'Cross-industry health & safety', stageTag: 'S3' },
  { code: 'IATF-16949', title: 'IATF 16949 — Automotive Quality Management', domain: 'Automotive', stageTag: 'S2' },
  { code: 'ISO-13485', title: 'ISO 13485 — Medical Devices Quality Management', domain: 'Medical devices', stageTag: 'S1' },
  { code: 'AS9100', title: 'AS9100 — Aerospace Quality Management', domain: 'Aerospace & defense', stageTag: 'S1' },
  { code: 'ISO-22000', title: 'ISO 22000 — Food Safety Management Systems', domain: 'Food & beverage', stageTag: 'S1' },
  { code: 'HACCP', title: 'HACCP — Hazard Analysis & Critical Control Points', domain: 'Food & beverage', stageTag: 'S3' },
  { code: 'ISO-27001', title: 'ISO/IEC 27001 — Information Security Management', domain: 'Information technology', stageTag: 'S4' },
  { code: 'ISO-31000', title: 'ISO 31000 — Risk Management Guidelines', domain: 'Cross-industry risk', stageTag: 'S4' },
  { code: 'ISO-50001', title: 'ISO 50001 — Energy Management Systems', domain: 'Energy & utilities', stageTag: 'S4' },
  { code: 'ISO-20000-1', title: 'ISO/IEC 20000-1 — IT Service Management', domain: 'Information technology', stageTag: 'S1' },
  { code: 'VDA-6.3', title: 'VDA 6.3 — Process Audit', domain: 'Automotive', stageTag: 'S6' },
  { code: 'GMP', title: 'GMP — Good Manufacturing Practice', domain: 'Pharmaceuticals & food', stageTag: 'S3' },
  { code: 'SIX-SIGMA', title: 'Six Sigma / Lean (DMAIC) — Process Improvement Methodology', domain: 'Cross-industry continuous improvement', stageTag: 'S5' },
];

// Compliance & Security Standards (Section 10) — the 3 priced, toggleable
// compliance modules. Maps each to the Annex A standard(s) it activates.
export const COMPLIANCE_MODULES = {
  gdpr: {
    label: 'GDPR',
    standardCodes: [], // GDPR itself is not in the Annex A library (it's a regulation, not a management-system standard) — its Controls scaffold stands alone
    description: 'EU General Data Protection Regulation — data subject rights, consent, and cross-border transfer controls.',
  },
  iso27001: {
    label: 'ISO/IEC 27001',
    standardCodes: ['ISO-27001'],
    description: 'Information security management.',
  },
  soc2: {
    label: 'SOC 2 Type II',
    standardCodes: [],
    description: 'Security, availability, and confidentiality of vendor-hosted environments.',
  },
};
