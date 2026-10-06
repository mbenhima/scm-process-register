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
const DEFAULT_PREFS = { dock: 'left', pinned: true, density: 'comfortable', pageSize: 20, panels: { nav: 260, context: 320, contextOpen: false, contextView: 'assistant' }, tables: {}, favorites: ['/', '/my-tasks', '/projects'], collapsed: [], channels: { alerts: ['inapp', 'email'], tasks: ['inapp'], approvals: ['inapp', 'email'], questionnaires: ['inapp'], system: ['inapp'] } };
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
  // Recent global searches, kept as a personal preference (FR-DA-SRCH-05).
  if (Array.isArray(b.recentSearches)) next.recentSearches = b.recentSearches.filter(x => typeof x === 'string').map(x => x.slice(0, 80)).slice(0, 10);
  if (b.channels && typeof b.channels === 'object') next.channels = b.channels;
  // Layout panels (FR-DA-PNL-06): widths clamped to their limits (Table 4.50-1).
  if (b.panels && typeof b.panels === 'object') {
    const clamp = (v, lo, hi, d) => (Number.isFinite(Number(v)) ? Math.min(hi, Math.max(lo, Math.round(Number(v)))) : d);
    next.panels = { nav: clamp(b.panels.nav, 180, 480, 260), context: clamp(b.panels.context, 220, 560, 320), contextOpen: !!b.panels.contextOpen, contextView: typeof b.panels.contextView === 'string' ? b.panels.contextView.slice(0, 24) : 'assistant' };
  }
  // Table density and page size (FR-DA-TBL-01, -04) and per-table view preferences (FR-DA-MRE-11, TableViewPreference).
  if (['comfortable', 'compact'].includes(b.density)) next.density = b.density;
  if ([20, 50, 100, 0].includes(Number(b.pageSize))) next.pageSize = Number(b.pageSize);
  if (b.tables && typeof b.tables === 'object') {
    const tables = { ...(cur.tables || {}) };
    for (const [id, v] of Object.entries(b.tables).slice(0, 200)) {
      if (!/^[\w:.-]{1,80}$/.test(id) || !v || typeof v !== 'object') continue;
      const keys = a => (Array.isArray(a) ? a.filter(x => typeof x === 'string' && x.length <= 60).slice(0, 60) : undefined);
      const widths = {}; if (v.widths && typeof v.widths === 'object') for (const [k, w] of Object.entries(v.widths).slice(0, 60)) if (Number(w) >= 80 && Number(w) <= 1200) widths[k] = Math.round(Number(w));
      tables[id] = { order: keys(v.order), hidden: keys(v.hidden), widths, sort: v.sort && typeof v.sort.key === 'string' && [1, -1].includes(v.sort.dir) ? { key: v.sort.key.slice(0, 60), dir: v.sort.dir } : null, pin: v.pin !== false };
    }
    next.tables = tables;
  }
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
// Pickers drawn from the Organization: people with their title, and functions of the OBS (FR-DA-OBS-08, FR-DA-DEU-04).
r.get('/context/users', ah(req => all(`SELECT id, name, title FROM users WHERE org_id=? AND active=1 ORDER BY name`, req.orgId)));
r.get('/context/functions', ah(req => all(`SELECT id, name FROM obs_nodes WHERE org_id=? AND type='Function' ORDER BY name`, req.orgId).map(f => ({ id: f.id, name: J(f.name, f.name) }))));
r.get('/context/projects', ah(req => all(`SELECT id, name, focus, segment, mode, track, status, progress, plan_year FROM projects WHERE org_id=? ORDER BY plan_year DESC, focus`, req.orgId).map(parseMl)));
export default r;
