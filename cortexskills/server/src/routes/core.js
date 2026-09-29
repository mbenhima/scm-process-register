import { Router } from 'express';
import { ah, parseMl } from '../lib/http.js';
import { all, one, run } from '../db.js';
import { J, S, HttpError, now } from '../lib/util.js';
import { userPermissions, userRoles } from '../rbac.js';
import { effectiveConfig, entitledModules } from '../entitlements.js';
import { getLicenceProvider } from '../licensing/LicenceProvider.js';
import { NAV, NAV_GROUPS } from '../nav.js';
import { getLanguages } from '../i18n.js';

const r = Router();
const DEFAULT_PREFS = { dock: 'left', pinned: true, favorites: ['/', '/my-tasks', '/projects'], collapsed: [], channels: { alerts: ['inapp', 'email'], tasks: ['inapp'], approvals: ['inapp', 'email'], questionnaires: ['inapp'], system: ['inapp'] } };
const prefsOf = id => ({ ...DEFAULT_PREFS, ...J(one(`SELECT data FROM user_prefs WHERE user_id=?`, id)?.data, {}) });

r.get('/me', ah(req => {
  const perms = [...userPermissions(req.user.id)];
  const org = req.orgId ? parseMl(one(`SELECT * FROM organizations WHERE id=?`, req.orgId)) : null;
  const group = org?.group_id ? parseMl(one(`SELECT * FROM groups_ WHERE id=?`, org.group_id)) : null;
  const eff = req.orgId ? effectiveConfig(req.orgId) : null;
  return {
    user: req.user, lang: req.lang, roles: userRoles(req.user.id), permissions: perms, org, group, foreignReadOnly: req.foreignReadOnly,
    homeOrgId: req.user.org_id, config: eff, licence: req.orgId ? getLicenceProvider(req.orgId).check() : null, prefs: prefsOf(req.user.id),
  };
}));
r.put('/me/language', ah(req => {
  const code = String(req.body?.language || '');
  if (!getLanguages().some(l => l.code === code)) throw new HttpError(422, 'err.invalidOption', { field: 'language', value: code });
  run(`UPDATE users SET language=? WHERE id=?`, code, req.user.id); return { ok: true, language: code };
}));
r.get('/me/prefs', ah(req => prefsOf(req.user.id)));
r.put('/me/prefs', ah(req => {
  const b = req.body || {}; const cur = prefsOf(req.user.id);
  const next = { ...cur };
  if (['left', 'right', 'top', 'bottom'].includes(b.dock)) next.dock = b.dock;
  if (typeof b.pinned === 'boolean') next.pinned = b.pinned;
  if (Array.isArray(b.favorites)) next.favorites = b.favorites.filter(x => typeof x === 'string').slice(0, 30);
  if (Array.isArray(b.collapsed)) next.collapsed = b.collapsed.filter(x => typeof x === 'string');
  if (b.channels && typeof b.channels === 'object') next.channels = b.channels;
  run(`INSERT INTO user_prefs(user_id,data) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data`, req.user.id, S(next));
  return next;
}));
/** Navigation filtered by permission and module entitlement: an item a user cannot open is never shown. */
r.get('/nav', ah(req => {
  const perms = userPermissions(req.user.id); const mods = req.orgId ? entitledModules(req.orgId) : new Set();
  return { groups: NAV_GROUPS, items: NAV.filter(i => perms.has(i.perm) && (!i.module || mods.has(i.module))) };
}));
/** Minimal user directory for assignment (FR-DA-RBAC-05). */
r.get('/directory', ah(req => all(`SELECT u.id, u.name, u.email, u.title, (SELECT group_concat(role_id) FROM user_roles WHERE user_id=u.id) roles FROM users u WHERE u.org_id=? AND u.active=1 ORDER BY u.name`, req.orgId)));
/** Organizations the user may switch to: own, read-only Group siblings, or all for platform administrators. */
r.get('/context/orgs', ah(req => {
  const home = req.user.org_id ? one(`SELECT group_id FROM organizations WHERE id=?`, req.user.org_id) : null;
  const rows = req.user.is_platform ? all(`SELECT o.id, o.name, o.sector, o.segment, o.group_id, g.name group_name FROM organizations o LEFT JOIN groups_ g ON g.id=o.group_id ORDER BY o.segment, o.sector`)
    : all(`SELECT o.id, o.name, o.sector, o.segment, o.group_id, g.name group_name FROM organizations o LEFT JOIN groups_ g ON g.id=o.group_id WHERE o.id=? OR (o.group_id IS NOT NULL AND o.group_id=?)`, req.user.org_id, home?.group_id ?? '__none__');
  return rows.map(o => ({ ...parseMl(o), readOnly: !req.user.is_platform && o.id !== req.user.org_id }));
}));
r.get('/context/projects', ah(req => all(`SELECT id, name, focus, segment, mode, track, status, progress, plan_year FROM projects WHERE org_id=? ORDER BY plan_year DESC, focus`, req.orgId).map(parseMl)));
export default r;
