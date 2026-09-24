// Which organizations a user may look at beyond their own (FR-DA-TEN-08 keeps every other tenant invisible):
// - a platform administrator sees every organization;
// - a user holding portfolio.group sees the other organizations of their own group, read-only;
// - everyone else sees only their own organization.
import { q } from '../db.js';

export function accessibleOrgs(req) {
  const rows = q.all('SELECT o.id, o.uid, o.name, o.industry, o.country, o.group_id, g.name group_name FROM organizations o LEFT JOIN groups_ g ON g.id = o.group_id ORDER BY o.id');
  if (req.user.is_platform_admin) return rows;
  const me = rows.find((o) => o.id === req.orgId);
  if (me?.group_id && req.perms.has('portfolio.group')) return rows.filter((o) => o.group_id === me.group_id);
  return rows.filter((o) => o.id === req.orgId);
}

// Narrow the accessible organizations with optional group / organization filters from the query string.
export function scopedOrgIds(req) {
  let orgs = accessibleOrgs(req);
  const group = String(req.query.group || '');
  if (group === 'none') orgs = orgs.filter((o) => !o.group_id);
  else if (group) orgs = orgs.filter((o) => String(o.group_id) === group);
  const org = String(req.query.org || '').split(',').filter(Boolean);
  if (org.length) orgs = orgs.filter((o) => org.includes(String(o.id)));
  return orgs;
}
