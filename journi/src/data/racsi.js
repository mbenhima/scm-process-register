// Module 18 — RACSI Grid default seed (R = Responsible, A = Accountable,
// C = Consulted, S = Sign-off, I = Informed). One row per macro process,
// one column per role. Editable at runtime by roles with the manageHierarchy
// capability, mirroring how the Permission Matrix (M2) seeds DEFAULT_ROLE_PERMISSIONS
// and lets a Super Admin edit it from there.
export const RACSI_ROLES = ['sponsor', 'change_manager', 'people_manager', 'practitioner', 'employee', 'executive']
export const RACSI_VALUES = ['', 'R', 'A', 'C', 'S', 'I']

const defaultRacsiGrid = {
  'MP-01': { sponsor: 'A', change_manager: 'R', people_manager: 'I', practitioner: 'C', employee: 'I', executive: '' },
  'MP-02': { sponsor: 'A', change_manager: 'R', people_manager: 'I', practitioner: '', employee: 'I', executive: 'C' },
  'MP-03': { sponsor: 'A', change_manager: 'R', people_manager: 'C', practitioner: '', employee: 'I', executive: '' },
  'MP-04': { sponsor: 'A', change_manager: 'R', people_manager: 'C', practitioner: '', employee: 'I', executive: '' },
  'MP-05': { sponsor: '', change_manager: 'A', people_manager: 'C', practitioner: 'R', employee: 'I', executive: '' },
  'MP-06': { sponsor: 'A', change_manager: 'R', people_manager: 'C', practitioner: '', employee: 'I', executive: '' },
  'MP-07': { sponsor: 'A', change_manager: 'R', people_manager: '', practitioner: 'C', employee: 'I', executive: 'I' },
  'MP-08': { sponsor: 'A', change_manager: 'R', people_manager: 'I', practitioner: '', employee: '', executive: 'C' },
  'MP-09': { sponsor: '', change_manager: 'A', people_manager: 'R', practitioner: '', employee: 'C', executive: '' },
  'MP-10': { sponsor: 'S', change_manager: 'A', people_manager: 'C', practitioner: '', employee: 'I', executive: 'I' },
}

export default defaultRacsiGrid
