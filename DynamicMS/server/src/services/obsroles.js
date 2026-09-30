// OBS role model (SRS 3.16, FR-DA-OBS): units hold roles (positions); a role is linked to
// one or more business functions; people play one or more roles through dated assignments.
// OBS roles describe what people do; access rights stay with the RBAC roles.
import { run, all, get, uid, J, P } from '../db.js';
import { catalog } from '../catalog/store.js';
import { ROLES } from '../permissions.js';

// Business functions of each standard position (catalog functions FN-01..FN-14).
export const ROLE_FUNCTIONS = {
  top_management: ['FN-01'], ims_manager: ['FN-01', 'FN-02', 'FN-14'], quality_manager: ['FN-02'], hse_manager: ['FN-03'], risk_manager: ['FN-04'],
  compliance_officer: ['FN-05'], audit_manager: ['FN-06'], auditor: ['FN-06'], hr_manager: ['FN-07'], document_controller: ['FN-08'], it_manager: ['FN-09'],
  operations_manager: ['FN-10'], performance_manager: ['FN-11'], esg_manager: ['FN-12'], transformation_manager: ['FN-13'], process_excellence_manager: ['FN-14'],
  employee: ['FN-10'], ai_governance_officer: ['FN-09', 'FN-13'], finance_manager: ['FN-01'],
};
// Default RBAC role proposed to the holders of a position.
const ACCESS = { top_management: 'owner', ims_manager: 'owner', auditor: 'readonly', employee: 'reporter' };

const L = (en, fr, ar) => ({ en, fr, ar });
export function missionOf(fnIds) {
  const c = catalog();
  const names = fnIds.map(f => c.fnById?.[f]?.name).filter(Boolean);
  const join = (l) => names.map(n => n[l]).join(l === 'ar' ? ' و' : l === 'fr' ? ' et ' : ' and ');
  return L(`Runs the ${join('en')} activities of the unit and answers for their results.`, `Pilote les activités ${join('fr')} de l'unité et répond de leurs résultats.`, `يدير أنشطة ${join('ar')} في الوحدة ويُسأل عن نتائجها.`);
}

// Creates one role per position found in the OBS (obs_members) and assigns its holder.
// In each organization the IMS manager is also deputy of the quality manager position:
// a person can play several roles.
export function seedObsRoles(orgId, created) {
  const members = all('SELECT m.node_id, m.role_in_node, m.user_id FROM obs_members m WHERE m.org_id=?', orgId);
  const byRole = {};
  for (const m of members) {
    if (!m.role_in_node || byRole[m.role_in_node]) continue;
    const fns = ROLE_FUNCTIONS[m.role_in_node] || ['FN-01'];
    const name = ROLES.find(r => r.code === m.role_in_node)?.name || L(m.role_in_node, m.role_in_node, m.role_in_node);
    const id = uid();
    run('INSERT INTO obs_roles(id,org_id,node_id,code,name,mission,responsibilities,competences,functions,access_roles,reports_to,status,version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)',
      id, orgId, m.node_id, m.role_in_node, J(name), J(missionOf(fns)), null, null, J(fns), J([ACCESS[m.role_in_node] || 'contributor']), null, 'Active', created, created);
    byRole[m.role_in_node] = { id, node: m.node_id };
    run('INSERT INTO role_assignments(id,org_id,role_id,user_id,holder_type,allocation,start_date,end_date,created_at) VALUES(?,?,?,?,?,?,?,?,?)', uid(), orgId, id, m.user_id, 'Holder', 100, created.slice(0, 10), null, created);
  }
  const top = byRole.top_management?.id;
  for (const [code, r] of Object.entries(byRole)) if (code !== 'top_management' && top) run('UPDATE obs_roles SET reports_to=? WHERE id=?', code === 'employee' ? byRole.operations_manager?.id || top : top, r.id);
  const ims = members.find(m => m.role_in_node === 'ims_manager');
  if (ims && byRole.quality_manager) run('INSERT INTO role_assignments(id,org_id,role_id,user_id,holder_type,allocation,start_date,end_date,created_at) VALUES(?,?,?,?,?,?,?,?,?)', uid(), orgId, byRole.quality_manager.id, ims.user_id, 'Deputy', 20, created.slice(0, 10), null, created);
  return Object.keys(byRole).length;
}

// The people currently playing an OBS role (resolution of role-based assignments).
export function holdersOf(roleId, on = new Date().toISOString().slice(0, 10)) {
  return all(`SELECT a.*, u.name, u.email FROM role_assignments a JOIN users u ON u.id=a.user_id WHERE a.role_id=? AND (a.start_date IS NULL OR a.start_date<=?) AND (a.end_date IS NULL OR a.end_date>=?) ORDER BY CASE a.holder_type WHEN 'Holder' THEN 0 WHEN 'Acting' THEN 1 ELSE 2 END`, roleId, on, on);
}
export const roleData = (r) => ({ name: P(r.name), mission: P(r.mission), responsibilities: P(r.responsibilities), competences: P(r.competences), functions: P(r.functions), access_roles: P(r.access_roles), node_id: r.node_id, reports_to: r.reports_to, status: r.status });
export const orgOfRole = (id) => get('SELECT org_id FROM obs_roles WHERE id=?', id)?.org_id;
