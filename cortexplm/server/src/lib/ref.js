// Read-only reference catalog loaded from the source deliverables:
//  - process_reference.json : Process Design Reference v2.0 (MPs, E2Es, UFTs, gates, tracks, findings)
//  - deliverables.json      : Deliverables workbook D01-D10, D15, D15b, D26
//  - catalog.json           : Packs, Integrations & Add-Ons Catalog
import fs from 'node:fs';
import path from 'node:path';
import { dataDir } from '../config.js';

const load = (f) => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'));

export const PROC = load('process_reference.json');
export const DLV = load('deliverables.json');
export const CAT = load('catalog.json');
export const SRS = load('srs_requirements.json');

export const MP = Object.fromEntries(PROC.macroProcesses.map((m) => [m.id, m]));
export const D01 = Object.fromEntries(DLV['D01 Macro Processes'].map((m) => [m.Macro_Process_ID, m]));
export const STEPS = DLV['D02 Tasks & Steps'];
export const STEP = Object.fromEntries(STEPS.map((s) => [s.Step_ID, s]));
export const PACK = Object.fromEntries(CAT.packs.map((p) => [p.id, p]));
export const BUNDLE = Object.fromEntries(CAT.bundles.map((b) => [b.id, b]));
export const INTEGRATION = Object.fromEntries(CAT.integrations.map((i) => [i.id, i]));
export const ADDON = Object.fromEntries(CAT.addons.map((a) => [a.id, a]));
export const D26 = Object.fromEntries(DLV['D26 Modules & Tiers'].map((m) => [m.Module_ID, m]));

export const E2E_IDS = ['E2E-01', 'E2E-02', 'E2E-03', 'E2E-04', 'E2E-05', 'E2E-06', 'E2E-07', 'E2E-08', 'E2E-09'];
export const E2E = Object.fromEntries(PROC.e2e.map((e) => [e.E2E, { id: e.E2E, type: e.Type, name: e.Name, goal: e.Goal, exitGate: e['Exit gate'], related: e['Related macro processes'], taskCount: Number(e.Tasks), ...PROC.e2eDetail[e.E2E] }]));
export const GATES = ['T-1', 'T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
export const GATE = Object.fromEntries(PROC.gates.map((g) => [g.Gate, { id: g.Gate, closes: g.Closes, question: g['Decision question'], evidence: g['Minimum evidence'], tracks: g.Tracks.split(', ') }]));
export const GATE_OF_E2E = { 'E2E-01': 'T-1', 'E2E-02': 'T0', 'E2E-03': 'T1', 'E2E-04': 'T2', 'E2E-05': 'T3', 'E2E-06': 'T4', 'E2E-07': 'T5', 'E2E-08': 'T6', 'E2E-09': null };

export const TRACKS = {
  Full: { e2e: E2E_IDS, gates: GATES, checklistItems: 30, range: '30–50' },
  Light: { e2e: ['E2E-01', 'E2E-02', 'E2E-03', 'E2E-04', 'E2E-05', 'E2E-07', 'E2E-08', 'E2E-09'], gates: ['T-1', 'T0', 'T1', 'T2', 'T3', 'T5'], checklistItems: 15, range: '15–25' },
  Fast: { e2e: ['E2E-01', 'E2E-02', 'E2E-05'], gates: ['T-1', 'T0', 'T3'], checklistItems: 6, range: '5–10' },
};

// Track x macro process activation matrix (Part 7.2) keyed by MP id.
export const TRACK_MATRIX = Object.fromEntries(PROC.trackMatrix.map((r) => [r.MP, { Full: r['Full Track'], Light: r['Light Track'], Fast: r['Fast Track'] }]));

// Rule R2 - Fast Track tasks relying on non-activated macro processes are skippable.
export const R2_TASKS = PROC.trackRules.find((r) => r.id === 'R2').tasks;

// Industry-conditional macro processes (Part 7.2 "If ..." cells).
export const CONDITIONAL = { 'MP-41': 'Life Sciences', 'MP-45': 'A&D', 'MP-46': 'Automotive', 'MP-96': 'MedTech' };

export const TASKS_OF = (e2eId) => E2E[e2eId].tasks;
export const UFT = Object.fromEntries(Object.values(PROC.e2eDetail).flatMap((d) => d.tasks).map((t) => [t.id, t]));

export const mpIdsIn = (text = '') => [...new Set((text.match(/MP-\d+/g) || []))];

// Compliance & Security Standards (independently toggled, priced on quotation). Scaffold controls are
// seeded idempotently on activation. Activation is never a certification (FR-DA-CFG-09).
export const COMPLIANCE_STANDARDS = [
  { id: 'GDPR', name: 'GDPR', description: 'EU General Data Protection Regulation privacy scaffolding.', controls: [
    ['Records of processing activities maintained', 'Control Environment', 'Preventive', 'Annual'],
    ['Data subject request handling within statutory deadline', 'Control Activities', 'Preventive', 'Quarterly'],
    ['Personal data breach notification procedure tested', 'Information & Communication', 'Detective', 'Annual'],
    ['Data protection impact assessment for high-risk processing', 'Risk Assessment', 'Preventive', 'Per change'] ] },
  { id: 'ISO27001', name: 'ISO/IEC 27001', description: 'Information security management system scaffolding.', controls: [
    ['Information security policy approved and communicated', 'Control Environment', 'Preventive', 'Annual'],
    ['Information security risk assessment performed', 'Risk Assessment', 'Preventive', 'Annual'],
    ['Access rights reviewed for all privileged accounts', 'Control Activities', 'Detective', 'Quarterly'],
    ['Internal ISMS audit and management review', 'Monitoring Activities', 'Detective', 'Annual'] ] },
  { id: 'SOC2', name: 'SOC 2', description: 'Trust services criteria scaffolding (security, availability, confidentiality).', controls: [
    ['Change management approvals recorded for production changes', 'Control Activities', 'Preventive', 'Continuous'],
    ['Availability monitoring and incident response runbook', 'Monitoring Activities', 'Detective', 'Monthly'],
    ['Vendor risk reviews for critical sub-processors', 'Risk Assessment', 'Detective', 'Annual'] ] },
  { id: 'ISO27701', name: 'ISO/IEC 27701', description: 'Privacy information management extension scaffolding.', controls: [
    ['PII controller and processor roles documented', 'Control Environment', 'Preventive', 'Annual'],
    ['PII retention and disposal schedule enforced', 'Control Activities', 'Preventive', 'Quarterly'] ] },
  { id: 'HIPAA', name: 'HIPAA', description: 'US health information privacy and security scaffolding.', controls: [
    ['Protected health information access logging reviewed', 'Monitoring Activities', 'Detective', 'Monthly'],
    ['Business associate agreements on file', 'Control Environment', 'Preventive', 'Annual'] ] },
  { id: 'ISO9001', name: 'ISO 9001', description: 'Quality management system scaffolding.', controls: [
    ['Quality objectives set and reviewed by management', 'Control Environment', 'Preventive', 'Annual'],
    ['Nonconformity and corrective action process operated', 'Control Activities', 'Detective', 'Monthly'],
    ['Internal quality audit programme executed', 'Monitoring Activities', 'Detective', 'Annual'] ] },
];
export const NON_CERT_DISCLOSURE = 'Activating a Compliance & Security Standard adds starting controls and tracking only. It is not a certification, an external audit, or a legal attestation of compliance. Your organization remains responsible for its compliance programme and any external certification.';

export const COSO = ['Control Environment', 'Risk Assessment', 'Control Activities', 'Information & Communication', 'Monitoring Activities'];
