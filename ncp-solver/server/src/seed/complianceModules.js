import { randomUUID } from 'node:crypto';
import db from '../db/index.js';
import { COMPLIANCE_MODULES } from './standardsLibrary.js';

// Representative COSO-classified Controls seeded when a Compliance Module is
// first activated for an Organization. This scaffolds the GRC coverage a
// customer would configure during Business Analysis for that framework — it
// documents and supports the framework, it is not itself a certification.
const FRAMEWORK_CONTROLS = {
  gdpr: [
    { code: 'GDPR-01', title: 'Data Subject Access Request (DSAR) Handling', coso: 'control_activities', type: 'detective', freq: 'continuous',
      desc: 'Verifies that a request to access, correct, or erase personal data is logged, actioned, and closed within the regulatory deadline.' },
    { code: 'GDPR-02', title: 'Consent Management & Record of Processing Activities', coso: 'information_communication', type: 'preventive', freq: 'quarterly',
      desc: 'Maintains an up-to-date Record of Processing Activities (RoPA) and verifies consent is captured before personal data is processed.' },
    { code: 'GDPR-03', title: 'Cross-Border Data Transfer Safeguards', coso: 'control_activities', type: 'preventive', freq: 'annual',
      desc: 'Confirms an appropriate transfer mechanism (adequacy decision, SCCs) is in place before personal data leaves the EU/EEA.' },
  ],
  iso27001: [
    { code: 'ISO27001-01', title: 'Information Security Risk Assessment', coso: 'risk_assessment', type: 'preventive', freq: 'annual',
      desc: 'Annual ISMS-scope risk assessment against the ISO/IEC 27001 Annex A control set, with a documented treatment plan.' },
    { code: 'ISO27001-02', title: 'Access Control & Least-Privilege Review', coso: 'control_activities', type: 'detective', freq: 'quarterly',
      desc: 'Reviews user and role access against the RBAC permission matrix, removing access no longer required.' },
    { code: 'ISO27001-03', title: 'Security Incident Response & Logging', coso: 'monitoring_activities', type: 'detective', freq: 'continuous',
      desc: 'Confirms security-relevant events are logged (Audit Trail) and a documented incident-response procedure is followed.' },
  ],
  soc2: [
    { code: 'SOC2-01', title: 'Change Management & Deployment Approval', coso: 'control_activities', type: 'preventive', freq: 'continuous',
      desc: 'Verifies a production change is reviewed and approved before deployment, per the SOC 2 Change Management criterion.' },
    { code: 'SOC2-02', title: 'Vendor & Sub-processor Risk Review', coso: 'risk_assessment', type: 'preventive', freq: 'annual',
      desc: 'Reviews the security posture of vendors and sub-processors handling customer data on the platform\'s behalf.' },
    { code: 'SOC2-03', title: 'Availability & Business Continuity Testing', coso: 'monitoring_activities', type: 'detective', freq: 'annual',
      desc: 'Tests backup restoration and failover procedures against the platform\'s stated uptime SLA.' },
  ],
};

/**
 * Idempotently seeds the Controls scaffold and activates the linked
 * Standard(s) for a Compliance Module the first time it is turned on for an
 * Organization. Safe to call more than once (skips Controls whose code
 * already exists for that Organization).
 */
export function activateComplianceModule(organizationId, framework) {
  const module = COMPLIANCE_MODULES[framework];
  if (!module) return;

  for (const code of module.standardCodes) {
    db.prepare(`
      UPDATE standards SET is_active = 1 WHERE organization_id = ? AND code = ?
    `).run(organizationId, code);
  }

  const controls = FRAMEWORK_CONTROLS[framework] || [];
  const existing = new Set(
    db.prepare('SELECT code FROM controls WHERE organization_id = ?').all(organizationId).map((r) => r.code)
  );
  const insert = db.prepare(`
    INSERT INTO controls (id, organization_id, code, title, description, coso_component, control_type, frequency, effectiveness, evidence_notes, compliance_framework, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'not_tested', ?, ?, 1)
  `);
  for (const c of controls) {
    if (existing.has(c.code)) continue;
    insert.run(randomUUID(), organizationId, c.code, c.title, c.desc, c.coso, c.type, c.freq, c.desc, framework);
  }
}
