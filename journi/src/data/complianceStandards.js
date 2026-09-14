// D-Config: Compliance & Security Standards catalog, mirroring Section 9 of
// the DynamicJourni Technical & Solution Offer. Each standard can be
// activated/deactivated per Organization from the Configuration Management
// module; activating one filters which Controls (see processGovernanceSeed.js,
// COSO-tagged) are treated as "in scope" on the Process Registry's Governance
// tab, so the Controls list a Change Manager sees always matches what the
// tenant has actually paid to have live.
export const COMPLIANCE_STANDARDS = [
  {
    key: 'gdpr',
    name: 'GDPR',
    fullName: 'EU General Data Protection Regulation',
    focus: 'Data subject rights, consent, and cross-border transfer controls.',
    priced: true,
  },
  {
    key: 'iso27001',
    name: 'ISO/IEC 27001',
    fullName: 'Information Security Management',
    focus: 'Information security management system (ISMS) controls.',
    priced: true,
  },
  {
    key: 'iso27701',
    name: 'ISO/IEC 27701',
    fullName: 'Privacy Information Management',
    focus: 'Privacy information management, extending ISO/IEC 27001.',
    priced: false,
  },
  {
    key: 'soc2',
    name: 'SOC 2 Type II',
    fullName: 'Service Organization Control 2, Type II',
    focus: 'Security, availability, and confidentiality of vendor-hosted environments.',
    priced: true,
  },
  {
    key: 'hipaa',
    name: 'HIPAA',
    fullName: 'Health Insurance Portability and Accountability Act',
    focus: 'U.S. protected health information, for Health-sector Organizations.',
    priced: true,
  },
  {
    key: 'fips140_2',
    name: 'FIPS 140-2',
    fullName: 'Cryptographic Module Validation',
    focus: 'Applicable to the Sovereign & Air-Gapped Deployment Suite.',
    priced: false,
  },
  {
    key: 'iso9001',
    name: 'ISO 9001',
    fullName: 'Quality Management',
    focus: "Applicable to the delivery and support organization's own QMS.",
    priced: false,
  },
]

export const DEFAULT_ACTIVE_STANDARDS = { gdpr: true, iso27001: true, iso27701: false, soc2: false, hipaa: false, fips140_2: false, iso9001: false }
