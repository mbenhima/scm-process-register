// Module — Notification Center (D07 Alerts, proportionate closure): journi has
// no backend to send real email/push/Teams notifications, so this is the
// client-side equivalent — a persistent, dismissible in-app log surfaced from
// the bell icon in the TopBar. 9 of the 16 alerts have a condition directly
// computable from journi's existing client-side data model (see
// utils/alertEngine.js); 6 of the remaining 7 (survey-exception retries, AI
// confidence scoring, import integrity, account lockout, GDPR SLA, AI provider
// fallback) depend on infrastructure journi doesn't have (a real backend, AI
// confidence scores, auth lockout, a request-tracking system) and are shown
// here for traceability but never fire — kept in this list rather than
// silently dropped, so the mapping back to D07 stays complete. The 7th,
// ALT-006 (Champion Coverage Below Target), is excluded for a different
// reason — not a backend gap: journi has no structured champion-tracking
// data model anywhere (sponsor coalition members carry a free-text role
// field, not a governed Champion entity), so there is no genuine signal to
// compute against, only one that could be faked.
const alertDefinitions = [
  { id: 'ALT-001', name: 'Divergence Pattern Detected', severity: 'High', escalationLevel: 'L2 - Change Manager', notificationChannel: 'Dashboard, Email', slaThreshold: 'Acknowledge within 48h', recipientRoles: 'CM' },
  { id: 'ALT-002', name: 'Regression Risk Score Critical', severity: 'Critical', escalationLevel: 'L2 - Change Manager', notificationChannel: 'Dashboard, Email, Push Notification', slaThreshold: 'Acknowledge within 24h', recipientRoles: 'CM, SUP' },
  { id: 'ALT-003', name: 'Sponsor Coverage Gap', severity: 'Medium', escalationLevel: 'L1 - PMO', notificationChannel: 'Dashboard, Email', slaThreshold: 'Acknowledge within 5 business days', recipientRoles: 'PMO, ES' },
  { id: 'ALT-004', name: 'Resistance Escalation Threshold Breached', severity: 'High', escalationLevel: 'L2 - Steering Committee', notificationChannel: 'Dashboard, Email, Teams', slaThreshold: 'Acknowledge within 3 business days', recipientRoles: 'CM, ES' },
  { id: 'ALT-005', name: 'Survey Exception Escalated to Admin', severity: 'Medium', escalationLevel: 'L1 - Admin', notificationChannel: 'Email, Dashboard', slaThreshold: 'Resolve within 1 business day', recipientRoles: 'Admin' },
  { id: 'ALT-006', name: 'Champion Coverage Below Target', severity: 'Low', escalationLevel: 'L1 - Change Manager', notificationChannel: 'Dashboard', slaThreshold: 'Review within 14 days', recipientRoles: 'CM' },
  { id: 'ALT-007', name: 'AI Use Case Confidence Below Threshold', severity: 'Informational', escalationLevel: 'L1 - Change Manager', notificationChannel: 'Dashboard', slaThreshold: 'Review at next session', recipientRoles: 'CM' },
  { id: 'ALT-008', name: 'Change Saturation Threshold Breached', severity: 'Medium', escalationLevel: 'L1 - PMO', notificationChannel: 'Dashboard, Email', slaThreshold: 'Review within 10 business days', recipientRoles: 'PMO' },
  { id: 'ALT-009', name: 'Phase Gate No-Go / Conditional', severity: 'High', escalationLevel: 'L2 - Program/Project Manager', notificationChannel: 'Dashboard, Email', slaThreshold: 'Review within 3 business days', recipientRoles: 'PM, CM, PMO' },
  { id: 'ALT-010', name: 'Guiding Coalition Gap', severity: 'Medium', escalationLevel: 'L1 - PMO', notificationChannel: 'Dashboard, Email', slaThreshold: 'Review within 10 business days', recipientRoles: 'PMO, ES' },
  { id: 'ALT-011', name: 'Communication Overload Detected', severity: 'Low', escalationLevel: 'L1 - Change Manager', notificationChannel: 'Dashboard', slaThreshold: 'Review within 5 business days', recipientRoles: 'CM, PMO' },
  { id: 'ALT-012', name: 'Import Integrity Check Failed', severity: 'Medium', escalationLevel: 'L1 - IT/Technical Lead', notificationChannel: 'Email, Dashboard', slaThreshold: 'Resolve within 1 business day', recipientRoles: 'ITL' },
  { id: 'ALT-013', name: 'Administrative Account Locked', severity: 'High', escalationLevel: 'L1 - Super Admin', notificationChannel: 'Email, Dashboard', slaThreshold: 'Review within 4 business hours', recipientRoles: 'Super Admin' },
  { id: 'ALT-014', name: 'GDPR Request SLA at Risk', severity: 'High', escalationLevel: 'L1 - Super Admin', notificationChannel: 'Email, Dashboard', slaThreshold: 'Review within 5 business days of receipt', recipientRoles: 'Super Admin' },
  { id: 'ALT-015', name: 'Sustainment Sign-Off Blocked', severity: 'Medium', escalationLevel: 'L1 - Change Manager', notificationChannel: 'Dashboard, Email', slaThreshold: 'Review within 5 business days', recipientRoles: 'CM, ES' },
  { id: 'ALT-016', name: 'AI Provider Fallback Triggered', severity: 'Informational', escalationLevel: 'L1 - IT/Technical Lead', notificationChannel: 'Dashboard', slaThreshold: 'Review at next session', recipientRoles: 'ITL' },
]

export default alertDefinitions
