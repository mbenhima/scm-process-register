// Seed data for the NCP Sheet Template Library (item 3): pre-filled S1
// starting points by problem type, generic enough to apply across sectors.
// "Start from template" on the New NCP Sheet form pre-fills these fields;
// the Reporter still edits everything before submitting.
export const SHEET_TEMPLATE_SEEDS = [
  {
    title: 'Supplier Non-Conformity',
    problemType: 'Supplier / Incoming Quality',
    description: 'Use when a received batch, component, or service from an external supplier fails an incoming inspection or acceptance criterion.',
    defaultCriticality: 'medium',
    defaultPriority: 2,
    titleTemplate: 'Non-conforming delivery from supplier — [supplier name / batch reference]',
    descriptionTemplate: 'Incoming inspection of [batch/lot reference] from [supplier name] on [date] identified [describe the non-conformity: dimension, quantity, documentation, certificate, contamination, etc.]. Affected quantity: [units]. Lot currently: [quarantined / released / partially used].',
  },
  {
    title: 'Customer Complaint',
    problemType: 'Customer / External Complaint',
    description: 'Use when a customer, client, or end user reports a defect, service failure, or deviation from what was agreed or delivered.',
    defaultCriticality: 'high',
    defaultPriority: 1,
    titleTemplate: 'Customer complaint — [customer/account name] — [product/service]',
    descriptionTemplate: 'Customer [name/account] reported on [date] that [describe the issue: what was expected vs. what was delivered/experienced]. Order/reference: [order number]. Customer impact so far: [none / delay / rework / financial].',
  },
  {
    title: 'Safety / Near-Miss Incident',
    problemType: 'Health, Safety & Environment',
    description: 'Use for a workplace injury, near-miss, or unsafe condition observed on site.',
    defaultCriticality: 'high',
    defaultPriority: 1,
    titleTemplate: 'HSE incident/near-miss — [location] — [short description]',
    descriptionTemplate: 'On [date] at [location/OBS node], [describe what happened, who was involved, and what stopped it from being worse]. Injury: [none / first aid / medical treatment / lost time]. Equipment or process involved: [describe].',
  },
  {
    title: 'Internal Process Deviation',
    problemType: 'Internal Process / Procedure',
    description: 'Use when an internal team detects it deviated from a documented procedure, work instruction, or internal standard.',
    defaultCriticality: 'medium',
    defaultPriority: 3,
    titleTemplate: 'Process deviation — [process/procedure name] — [department]',
    descriptionTemplate: 'During [process/procedure name] on [date], [department/team] identified a deviation from [documented procedure/standard reference]: [describe what was done differently and why it was noticed]. Output affected: [describe].',
  },
  {
    title: 'Equipment / Maintenance Failure',
    problemType: 'Equipment & Maintenance',
    description: 'Use when equipment breakdown, malfunction, or unplanned maintenance disrupts production or service delivery.',
    defaultCriticality: 'medium',
    defaultPriority: 2,
    titleTemplate: 'Equipment failure — [equipment/asset name] — [line/site]',
    descriptionTemplate: '[Equipment/asset name] at [line/site] failed/malfunctioned on [date]: [describe symptom, alarm, or observed failure mode]. Production/service impact: [downtime duration, units affected]. Last scheduled maintenance: [date, if known].',
  },
];
