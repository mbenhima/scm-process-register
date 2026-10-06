// Process design management (FR-DA-PDM-01 – 11, FR-DA-VER-07 – 09).
// The reference design is shared read-only by every Organization (the `catalog`); an Organization customizes it by
// copy-on-write rows in `design_elements` that keep the reference version they came from (FR-DA-PDM-09). Every save
// is a new version (entity_versions, entity 'DesignElement') with author, date, note and justification; composite
// elements carry a snapshot of their children so that restoring them restores children and order (FR-DA-PDM-04).
// Design Releases freeze a set of element versions; projects are bound to the release current when they start
// (FR-DA-PDM-05, -06), and a later release applies to new projects or to projects migrated after an impact preview.
import { all, one, run, tx } from '../db.js';
import { J, S, HttpError, now, uuid } from '../lib/util.js';
import * as cat from '../catalog.js';
import { checkNames } from './naming.js';
import { describeStep } from './stepforms.js';

export const KINDS = ['phase', 'e2e', 'uft', 'mp', 'task', 'step'];
const REF = '__ref__';
const EDITABLE = ['name', 'description', 'brief', 'details', 'role', 'owner', 'objective', 'goal', 'trigger', 'terminal', 'input', 'output', 'supplier', 'beneficiary', 'form', 'type', 'racsi', 'racsiT', 'standards', 'clauses', 'inputs', 'outputs', 'gate'];
const keyOf = (kind, id) => `${kind}|${id}`;
const vkey = (org, kind, id) => `${org || REF}|${kind}|${id}`;

/* ------------------------------------------------------------------------------------------- reading */
const cache = new Map();
export function invalidate(orgId) { for (const k of [...cache.keys()]) if (!orgId || k.startsWith((orgId || REF) + '|') || k.startsWith(REF + '|')) cache.delete(k); }
const overlayRows = (org, kind) => all(`SELECT * FROM design_elements WHERE org_id=? AND kind=?`, org, kind);
function merge(base, rows) {
  const map = new Map(base.map(x => [x.id, { ...x }]));
  for (const r of rows) { const d = J(r.data, {}); map.set(r.element_id, { ...d, id: r.element_id, _status: r.status, _custom: !!r.custom, _version: r.version, _source: r.source_version, _org: r.org_id !== REF }); }
  return [...map.values()];
}
/** Effective list of a kind for an Organization: reference, platform changes, Organization changes (current versions). */
export function list(orgId, kind, { includeRetired = true, releaseId = null } = {}) {
  if (releaseId) return listAt(orgId, kind, releaseId, includeRetired);
  const ck = `${orgId || REF}|current|${kind}`;
  if (!cache.has(ck)) {
    let items = merge(baseList(kind), overlayRows(REF, kind));
    if (orgId) items = merge(items, overlayRows(orgId, kind));
    items = items.filter(x => x._status !== 'Deleted');
    items.sort((a, b) => (a.sort ?? a.order ?? 0) - (b.sort ?? b.order ?? 0) || 0);
    cache.set(ck, items);
  }
  const items = cache.get(ck);
  return includeRetired ? items : items.filter(x => x._status !== 'Retired');
}
export function get(orgId, kind, id, opts = {}) { return list(orgId, kind, opts).find(x => x.id === id) || null; }
/** The design as frozen by a release: element versions of the release, the reference for every other element. */
function listAt(orgId, kind, releaseId, includeRetired) {
  const ck = `${orgId}|rel:${releaseId}|${kind}`;
  if (!cache.has(ck)) {
    const rel = one(`SELECT items FROM design_releases WHERE id=? AND org_id=?`, releaseId, orgId);
    const items = J(rel?.items, {}); const rows = [];
    for (const [k, ver] of Object.entries(items)) {
      const [kk, id] = k.split('|'); if (kk !== kind) continue;
      const v = one(`SELECT data FROM entity_versions WHERE entity='DesignElement' AND record_id=? AND version=?`, vkey(orgId, kind, id), ver);
      if (v) { const d = J(v.data, {}); rows.push({ element_id: id, data: S(d.element), status: d.status || 'Active', custom: d.custom ? 1 : 0, version: ver, source_version: d.source_version, org_id: orgId }); }
    }
    let list = merge(merge(baseList(kind), overlayRows(REF, kind)), rows).filter(x => x._status !== 'Deleted');
    list.sort((a, b) => (a.sort ?? a.order ?? 0) - (b.sort ?? b.order ?? 0));
    cache.set(ck, list);
  }
  const list = cache.get(ck); return includeRetired ? list : list.filter(x => x._status !== 'Retired');
}
/** Reference elements of a kind; macro processes include the SME and vertical macro processes. */
const baseList = kind => (kind === 'mp' ? [...cat.list('mp'), ...cat.list('smeMp'), ...cat.list('verticalMp')] : cat.list(kind));
const refVersion = (kind, id) => one(`SELECT version FROM design_elements WHERE org_id=? AND kind=? AND element_id=?`, REF, kind, id)?.version || 0;

/* ------------------------------------------------------------------------------------- relationships */
export function parentOf(orgId, kind, el) {
  if (kind === 'e2e') { const ph = list(orgId, 'phase').find(p => (p.e2e || []).includes(el.id)); return ph ? ['phase', ph.id] : null; }
  if (kind === 'uft') return el.e2e ? ['e2e', el.e2e] : null;
  if (kind === 'task') return el.mp ? ['mp', el.mp] : null;
  if (kind === 'step') return el.task ? ['task', el.task] : el.mp ? ['mp', el.mp] : null;
  return null;
}
export function childrenOf(orgId, kind, el, opts = {}) {
  const L = k => list(orgId, k, opts);
  if (kind === 'phase') return (el.e2e || []).map(id => L('e2e').find(x => x.id === id)).filter(Boolean).map(x => ['e2e', x]);
  if (kind === 'e2e') return (el.ufts || []).map(id => L('uft').find(x => x.id === id)).filter(Boolean).map(x => ['uft', x]);
  if (kind === 'uft') return (el.steps || []).map(id => L('step').find(x => x.id === id)).filter(Boolean).map(x => ['step', x]);
  if (kind === 'mp') return [...L('task').filter(t => t.mp === el.id).map(x => ['task', x]), ...L('step').filter(s => s.mp === el.id && !s.task).map(x => ['step', x])];
  if (kind === 'task') return L('step').filter(s => s.task === el.id).map(x => ['step', x]);
  return [];
}
function siblingsOf(orgId, kind, el) {
  const p = parentOf(orgId, kind, el); if (!p) return list(orgId, kind).filter(x => x.id !== el.id);
  const parent = get(orgId, p[0], p[1]); return parent ? childrenOf(orgId, p[0], parent).filter(([k, x]) => k === kind && x.id !== el.id).map(([, x]) => x) : [];
}
const clean = el => Object.fromEntries(Object.entries(el).filter(([k]) => !k.startsWith('_')));

/* ------------------------------------------------------------------------------------------- writing */
function snapshotChildren(orgId, kind, el) {
  if (!['phase', 'e2e', 'uft', 'mp', 'task'].includes(kind)) return null;
  return childrenOf(orgId, kind, el).map(([k, x], i) => ({ kind: k, id: x.id, sort: i, element: clean(x), children: k === 'task' || k === 'uft' ? snapshotChildren(orgId, k, x) : null }));
}
function writeVersion(orgId, kind, id, element, { status = 'Active', custom = false, source_version = 0, note = '', justification = null, userId = null, children = null }) {
  const row = one(`SELECT version FROM design_elements WHERE org_id=? AND kind=? AND element_id=?`, orgId, kind, id);
  const version = (row?.version || 0) + 1; const tm = now();
  run(`INSERT INTO design_elements(org_id,kind,element_id,parent_id,sort,data,status,custom,source_version,version,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(org_id,kind,element_id) DO UPDATE SET data=excluded.data, status=excluded.status, sort=excluded.sort, version=excluded.version, updated_by=excluded.updated_by, updated_at=excluded.updated_at`,
    orgId, kind, id, null, element.sort ?? element.order ?? null, S(clean(element)), status, custom ? 1 : 0, source_version, version, userId, tm);
  run(`UPDATE entity_versions SET is_current=0 WHERE entity='DesignElement' AND record_id=?`, vkey(orgId, kind, id));
  run(`INSERT INTO entity_versions(id,entity,record_id,org_id,version,data,user_id,justification,is_current,created_at) VALUES(?,?,?,?,?,?,?,?,1,?)`,
    uuid(), 'DesignElement', vkey(orgId, kind, id), orgId === REF ? null : orgId, version, S({ element: clean(element), status, custom, source_version, note, children }), userId, justification, tm);
  return version;
}
function ownerOrg(req) { return req.user.is_platform && req.query.scope === 'reference' ? REF : req.orgId; }
function auditRow(req, action, key, before, after, justification) {
  run(`INSERT INTO audit_log(id,org_id,user_id,entity,entity_id,action,before_val,after_val,justification,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`, uuid(), req.orgId, req.user.id, 'DesignElement', key, action, before ? S(before) : null, after ? S(after) : null, justification || null, now());
}

/** Naming check of an element against its siblings (FR-DA-NAM-01, -02). */
export function namingWarnings(orgId, kind, el) {
  return checkNames(el.name, { siblings: siblingsOf(orgId, kind, el).map(x => x.name), verb: ['uft', 'step', 'task'].includes(kind) });
}

/** Update of an element: copy-on-write into the Organization's design, a new version every time. */
export function save(req, kind, id, patch, { note = '', justification = null, acceptWarnings = false } = {}) {
  if (!KINDS.includes(kind)) throw new HttpError(404, 'err.notFound');
  const org = ownerOrg(req); const cur = get(org === REF ? null : org, kind, id); if (!cur) throw new HttpError(404, 'err.notFound');
  if (cur._status === 'Retired' && !patch._restoreStatus) throw new HttpError(409, 'err.retired');
  const next = { ...clean(cur) }; for (const k of EDITABLE) if (patch[k] !== undefined) next[k] = patch[k];
  if (patch.name && typeof patch.name === 'object') next.name = { ...cur.name, ...patch.name };
  const warnings = patch.name ? namingWarnings(org === REF ? null : org, kind, { ...next, id }) : [];
  if (warnings.length && !acceptWarnings) throw new HttpError(409, 'err.namingWarnings', { warnings });
  const version = tx(() => {
    const v = writeVersion(org, kind, id, next, { status: cur._status === 'Retired' ? 'Active' : cur._status || 'Active', custom: !!cur._custom, source_version: cur._org ? cur._source : refVersion(kind, id), note, justification, userId: req.user.id, children: snapshotChildren(org === REF ? null : org, kind, cur) });
    auditRow(req, 'update', keyOf(kind, id), pickFields(cur), pickFields(next), justification || note); return v;
  });
  invalidate(org === REF ? null : org); return { ...get(org === REF ? null : org, kind, id), _version: version, warnings };
}
const pickFields = el => Object.fromEntries(EDITABLE.filter(k => el[k] !== undefined).map(k => [k, el[k]]));

function nextId(org, kind) {
  const k = `design.seq.${org}`; const n = (Number(one(`SELECT value FROM meta WHERE key=?`, k)?.value) || 0) + 1;
  run(`INSERT INTO meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`, k, String(n));
  return `C-${kind.toUpperCase()}-${String(n).padStart(4, '0')}`; // identifiers are stable and never reused (FR-DA-PDM-08)
}
/** Creation of a Custom Element under a parent (FR-DA-PDM-01, FR-DA-PTB-04 when made from a template). */
export function create(req, kind, { parentKind, parentId, data, note = '', acceptWarnings = false }) {
  const org = ownerOrg(req); const o = org === REF ? null : org;
  if (!KINDS.includes(kind)) throw new HttpError(404, 'err.notFound');
  const parent = parentKind ? get(o, parentKind, parentId) : null; if (parentKind && !parent) throw new HttpError(404, 'err.notFound');
  const id = nextId(org, kind);
  const el = { id, name: data.name || { en: '', fr: '', ar: '' }, description: data.description || data.name, ...Object.fromEntries(EDITABLE.filter(k => data[k] !== undefined).map(k => [k, data[k]])) };
  if (kind === 'uft') { el.e2e = parentId; el.steps = []; el.racsi = data.racsi || { R: 'Head of L&D', A: 'HR Director', C: 'Consultant PM', S: 'L&D Analyst', I: 'Employees' }; el.order = (parent.ufts || []).length + 1; }
  if (kind === 'step') { el.task = parentKind === 'task' ? parentId : null; el.mp = parentKind === 'task' ? parent.mp : parentKind === 'mp' ? parentId : parent?.mp; el.type = data.type || 'User Task'; el.role = data.role || { en: 'L&D Analyst', fr: 'Analyste formation', ar: 'محلل التكوين' }; }
  if (kind === 'task') el.mp = parentId;
  if (kind === 'e2e') { el.ufts = []; el.mps = []; }
  if (kind === 'phase') el.e2e = [];
  const warnings = namingWarnings(o, kind, el); if (warnings.length && !acceptWarnings) throw new HttpError(409, 'err.namingWarnings', { warnings });
  tx(() => {
    writeVersion(org, kind, id, el, { custom: true, note, userId: req.user.id });
    if (parent && ['phase', 'e2e', 'uft'].includes(parentKind)) { // the parent's ordered list of children is part of the parent
      const field = parentKind === 'phase' ? 'e2e' : parentKind === 'e2e' ? 'ufts' : 'steps';
      writeVersion(org, parentKind, parentId, { ...clean(parent), [field]: [...(parent[field] || []), id] }, { custom: !!parent._custom, source_version: parent._source || refVersion(parentKind, parentId), note: `Add ${kind} ${id}`, userId: req.user.id });
    }
    auditRow(req, 'create', keyOf(kind, id), null, el, note);
  });
  invalidate(o); return { ...get(o, kind, id), warnings };
}
/** Duplicate an element (and its children for composites) as Custom Elements (FR-DA-PDM-01). */
export function duplicate(req, kind, id) {
  const org = ownerOrg(req); const o = org === REF ? null : org; const src = get(o, kind, id); if (!src) throw new HttpError(404, 'err.notFound');
  const p = parentOf(o, kind, src); const name = Object.fromEntries(Object.entries(src.name || {}).map(([l, v]) => [l, `${v} (${l === 'fr' ? 'copie' : l === 'ar' ? 'نسخة' : 'copy'})`]));
  const copy = create(req, kind, { parentKind: p?.[0], parentId: p?.[1], data: { ...pickFields(src), name }, acceptWarnings: true, note: `Duplicate of ${id}` });
  if (kind === 'uft' || kind === 'task') for (const [ck, c] of childrenOf(o, kind, src)) create(req, ck, { parentKind: kind, parentId: copy.id, data: { ...pickFields(c) }, acceptWarnings: true, note: `Duplicate of ${c.id}` });
  return get(o, kind, copy.id);
}
/** Reorder within the parent or move to another parent, with referential checks (FR-DA-PDM-08, FR-DA-TEN-05). */
export function move(req, kind, id, { toParentId, index }) {
  const org = ownerOrg(req); const o = org === REF ? null : org; const el = get(o, kind, id); if (!el) throw new HttpError(404, 'err.notFound');
  const p = parentOf(o, kind, el); if (!p) throw new HttpError(422, 'err.noParent');
  const pk = p[0]; const target = toParentId ? get(o, pk, toParentId) : get(o, pk, p[1]); if (!target) throw new HttpError(404, 'err.notFound');
  tx(() => {
    if (['phase', 'e2e', 'uft'].includes(pk)) {
      const field = pk === 'phase' ? 'e2e' : pk === 'e2e' ? 'ufts' : 'steps';
      if (target.id !== p[1]) { const old = get(o, pk, p[1]); writeVersion(org, pk, old.id, { ...clean(old), [field]: (old[field] || []).filter(x => x !== id) }, { custom: !!old._custom, source_version: old._source || refVersion(pk, old.id), note: `Move ${id} out`, userId: req.user.id }); }
      const lst = (target[field] || []).filter(x => x !== id); lst.splice(Math.max(0, Math.min(index ?? lst.length, lst.length)), 0, id);
      writeVersion(org, pk, target.id, { ...clean(target), [field]: lst }, { custom: !!target._custom, source_version: target._source || refVersion(pk, target.id), note: `Move ${id}`, userId: req.user.id });
      if (kind === 'uft' && target.id !== p[1]) writeVersion(org, kind, id, { ...clean(el), e2e: target.id }, { custom: !!el._custom, source_version: el._source || refVersion(kind, id), note: `Moved to ${target.id}`, userId: req.user.id });
    } else {
      const field = kind === 'task' ? 'mp' : 'task';
      const sibs = childrenOf(o, pk, target).filter(([k, x]) => k === kind && x.id !== id).map(([, x]) => x); sibs.splice(Math.max(0, Math.min(index ?? sibs.length, sibs.length)), 0, el);
      sibs.forEach((x, i) => { if (x.id === id || (x.sort ?? -1) !== i) writeVersion(org, kind, x.id, { ...clean(x), sort: i, ...(x.id === id ? { [field]: target.id, ...(kind === 'step' ? { mp: target.mp || el.mp } : {}) } : {}) }, { custom: !!x._custom, source_version: x._source || refVersion(kind, x.id), note: x.id === id ? `Move to ${target.id}` : 'Reorder', userId: req.user.id }); });
    }
    auditRow(req, 'move', keyOf(kind, id), { parent: p[1] }, { parent: target.id, index });
  });
  invalidate(o); return get(o, kind, id);
}

/* --------------------------------------------------------------------------- versions, compare, restore */
export function versions(orgId, kind, id) {
  const ref = baseList(kind).find(x => x.id === id);
  const rows = all(`SELECT v.version, v.data, v.justification, v.created_at, v.is_current, u.name author FROM entity_versions v LEFT JOIN users u ON u.id=v.user_id WHERE v.entity='DesignElement' AND v.record_id=? ORDER BY v.version DESC`, vkey(orgId, kind, id))
    .map(v => { const d = J(v.data, {}); return { version: v.version, author: v.author, date: v.created_at, note: d.note || '', justification: v.justification, current: !!v.is_current, status: d.status, label: d.label || null, element: d.element, children: d.children }; });
  if (ref) rows.push({ version: 0, author: null, date: null, note: 'Reference design', reference: true, current: !rows.length, element: ref });
  return rows;
}
const flat = (o, p = '') => Object.entries(o || {}).reduce((m, [k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? { ...m, ...flat(v, p + k + '.') } : { ...m, [p + k]: Array.isArray(v) ? v.map(x => (typeof x === 'object' ? JSON.stringify(x) : x)).join(', ') : v }), {});
/** Field-by-field comparison of two versions (FR-DA-VER-06, FR-DA-PDM-03). */
export function compare(orgId, kind, id, a, b) {
  const vs = versions(orgId, kind, id); const A = vs.find(v => v.version === Number(a)), B = vs.find(v => v.version === Number(b)); if (!A || !B) throw new HttpError(404, 'err.notFound');
  const fa = flat(A.element), fb = flat(B.element); const keys = [...new Set([...Object.keys(fa), ...Object.keys(fb)])].filter(k => !['id'].includes(k)).sort();
  const fields = keys.map(k => ({ field: k, a: fa[k] ?? null, b: fb[k] ?? null, changed: String(fa[k] ?? '') !== String(fb[k] ?? '') }));
  const ca = (A.children || []).map(c => c.id).join(','), cb = (B.children || []).map(c => c.id).join(',');
  return { a: A.version, b: B.version, fields, changed: fields.filter(f => f.changed).length, childrenChanged: ca !== cb, childrenA: A.children?.map(c => c.id) || [], childrenB: B.children?.map(c => c.id) || [] };
}
/** Restore any version as the new Current Version; a composite restores its children, their order and links (FR-DA-PDM-04). */
export function restore(req, kind, id, version, justification) {
  const org = ownerOrg(req); const o = org === REF ? null : org; const v = versions(o === null ? REF : o, kind, id).find(x => x.version === Number(version)); if (!v) throw new HttpError(404, 'err.notFound');
  const cur = get(o, kind, id);
  tx(() => {
    writeVersion(org, kind, id, v.element, { status: 'Active', custom: !!cur?._custom, source_version: cur?._source || refVersion(kind, id), note: `Restore of version ${version}`, justification, userId: req.user.id, children: v.children });
    const restoreChildren = (kids) => { for (const c of kids || []) { const now_ = get(o, c.kind, c.id); writeVersion(org, c.kind, c.id, { ...c.element, sort: c.sort }, { status: 'Active', custom: !!now_?._custom, source_version: now_?._source || refVersion(c.kind, c.id), note: `Restore with ${kind} ${id} v${version}`, userId: req.user.id }); restoreChildren(c.children); } };
    restoreChildren(v.children);
    auditRow(req, 'restore', keyOf(kind, id), { version: cur?._version }, { version }, justification);
  });
  invalidate(o); return get(o, kind, id);
}

/* ----------------------------------------------------------------------------- usage, retire, delete */
/** What uses an element before it is changed, retired or deleted (FR-DA-PDM-07). */
export function usage(orgId, kind, id) {
  const el = get(orgId, kind, id); if (!el) throw new HttpError(404, 'err.notFound');
  const children = childrenOf(orgId, kind, el).map(([k, x]) => ({ kind: k, id: x.id, name: x.name }));
  const releases = all(`SELECT id, code, name, status FROM design_releases WHERE org_id=? AND items LIKE ?`, orgId, `%"${kind}|${id}"%`);
  const templates = all(`SELECT id, json_extract(data,'$.name') name, json_extract(data,'$.code') code FROM records WHERE entity='ProjectTemplate' AND (org_id=? OR org_id IS NULL) AND data LIKE ?`, orgId, `%"${id}"%`).map(x => ({ ...x, name: J(x.name, x.name) }));
  let running = 0, projects = [];
  const q = (sql, ...p) => { const rows = all(sql, ...p); running += rows.reduce((s, r) => s + r.n, 0); projects = [...new Set([...projects, ...rows.map(r => r.project_id)])]; };
  if (kind === 'e2e') q(`SELECT project_id, COUNT(*) n FROM e2e_instances WHERE org_id=? AND e2e_id=? AND status!='Completed' GROUP BY project_id`, orgId, id);
  if (kind === 'uft') q(`SELECT project_id, COUNT(*) n FROM task_instances WHERE org_id=? AND uft_id=? AND status!='Completed' GROUP BY project_id`, orgId, id);
  if (kind === 'step') q(`SELECT project_id, COUNT(*) n FROM task_instances WHERE org_id=? AND steps LIKE ? AND status!='Completed' GROUP BY project_id`, orgId, `%"id":"${id}"%`);
  if (kind === 'phase') q(`SELECT project_id, COUNT(*) n FROM e2e_instances WHERE org_id=? AND phase=? AND status!='Completed' GROUP BY project_id`, orgId, el.no);
  if (kind === 'mp' || kind === 'task') { const steps = list(orgId, 'step').filter(s => (kind === 'mp' ? s.mp : s.task) === id).map(s => s.id); for (const s of steps.slice(0, 40)) q(`SELECT project_id, COUNT(*) n FROM task_instances WHERE org_id=? AND steps LIKE ? AND status!='Completed' GROUP BY project_id`, orgId, `%"id":"${s}"%`); }
  const published = releases.filter(r => r.status === 'Published').length;
  return { element: { kind, id, name: el.name }, children, releases, templates, running, projects: projects.length, canDelete: !!el._custom && !published && !running && !templates.length, mustRetire: !!published || !!running || !el._custom };
}
export function retire(req, kind, id, justification) {
  const org = ownerOrg(req); const o = org === REF ? null : org; const el = get(o, kind, id); if (!el) throw new HttpError(404, 'err.notFound');
  if (!String(justification || '').trim()) throw new HttpError(422, 'err.justificationRequired');
  tx(() => { writeVersion(org, kind, id, clean(el), { status: 'Retired', custom: !!el._custom, source_version: el._source || refVersion(kind, id), note: 'Retired', justification, userId: req.user.id }); auditRow(req, 'retire', keyOf(kind, id), null, null, justification); });
  invalidate(o); return get(o, kind, id);
}
export function reactivate(req, kind, id, justification) {
  const org = ownerOrg(req); const o = org === REF ? null : org; const el = get(o, kind, id); if (!el) throw new HttpError(404, 'err.notFound');
  tx(() => { writeVersion(org, kind, id, clean(el), { status: 'Active', custom: !!el._custom, source_version: el._source || refVersion(kind, id), note: 'Reactivated', justification, userId: req.user.id }); auditRow(req, 'reactivate', keyOf(kind, id), null, null, justification); });
  invalidate(o); return get(o, kind, id);
}
export function remove(req, kind, id, justification) {
  const org = ownerOrg(req); const o = org === REF ? null : org; const u = usage(o, kind, id);
  if (!u.canDelete) throw new HttpError(409, 'err.mustRetire', { running: u.running, releases: u.releases.length });
  const el = get(o, kind, id); const p = parentOf(o, kind, el);
  tx(() => {
    run(`UPDATE design_elements SET status='Deleted', updated_by=?, updated_at=? WHERE org_id=? AND kind=? AND element_id=?`, req.user.id, now(), org, kind, id);
    if (p && ['phase', 'e2e', 'uft'].includes(p[0])) { const parent = get(o, p[0], p[1]); const field = p[0] === 'phase' ? 'e2e' : p[0] === 'e2e' ? 'ufts' : 'steps'; writeVersion(org, p[0], p[1], { ...clean(parent), [field]: (parent[field] || []).filter(x => x !== id) }, { custom: !!parent._custom, source_version: parent._source || refVersion(p[0], p[1]), note: `Delete ${id}`, userId: req.user.id }); }
    auditRow(req, 'delete', keyOf(kind, id), clean(el), null, justification);
  });
  invalidate(o); return { ok: true };
}

/* ---------------------------------------------------------------------------------- reference changes */
/** Elements whose reference changed since the Organization copied them: offered to the Organization (FR-DA-PDM-09). */
export function referenceChanges(orgId) {
  return all(`SELECT kind, element_id, source_version FROM design_elements WHERE org_id=? AND custom=0`, orgId).map(r => ({ ...r, refVersion: refVersion(r.kind, r.element_id) })).filter(r => r.refVersion > (r.source_version || 0));
}

/* -------------------------------------------------------------------------------------------- tree */
export function tree(orgId, { releaseId = null } = {}) {
  const o = { releaseId }; const L = k => list(orgId, k, o);
  const meta = x => ({ status: x._status || 'Active', custom: !!x._custom, modified: !!x._org && !x._custom, version: x._version || 0 });
  const phases = L('phase').map(ph => ({ kind: 'phase', id: ph.id, no: ph.no, name: ph.name, ...meta(ph),
    children: (ph.e2e || []).map(id => L('e2e').find(e => e.id === id)).filter(Boolean).map(e => ({ kind: 'e2e', id: e.id, name: e.name, ...meta(e),
      children: (e.ufts || []).map(u => L('uft').find(x => x.id === u)).filter(Boolean).map(u => ({ kind: 'uft', id: u.id, name: u.name, ...meta(u),
        children: (u.steps || []).map(s => L('step').find(x => x.id === s)).filter(Boolean).map(s => ({ kind: 'step', id: s.id, name: s.name, type: s.type, ...meta(s) })) })) })) }));
  const mps = L('mp').map(m => ({ kind: 'mp', id: m.id, name: m.name, family: m.family, ...meta(m),
    children: L('task').filter(t => t.mp === m.id).map(t => ({ kind: 'task', id: t.id, name: t.name, ...meta(t), children: L('step').filter(s => s.task === t.id).map(s => ({ kind: 'step', id: s.id, name: s.name, type: s.type, ...meta(s) })) })) }));
  return { phases, mps };
}

/** Full detail of an element: effective data, form and descriptions for steps, naming warnings, parent, children. */
export function detail(orgId, kind, id, { releaseId = null } = {}) {
  const el = get(orgId, kind, id, { releaseId }); if (!el) throw new HttpError(404, 'err.notFound');
  const p = parentOf(orgId, kind, el);
  const out = { kind, id, element: clean(el), status: el._status || 'Active', custom: !!el._custom, modified: !!el._org && !el._custom, version: el._version || 0, sourceVersion: el._source || 0,
    referenceVersion: refVersion(kind, id), parent: p ? { kind: p[0], id: p[1], name: get(orgId, p[0], p[1])?.name } : null,
    children: childrenOf(orgId, kind, el, { releaseId }).map(([k, x]) => ({ kind: k, id: x.id, name: x.name, status: x._status || 'Active' })), warnings: namingWarnings(orgId, kind, el) };
  if (kind === 'step') { const mp = get(orgId, 'mp', el.mp); const u = list(orgId, 'uft').find(x => (x.steps || []).includes(el.id)); out.form = describeStep(el, { mpName: mp?.name, inputs: u?.input || mp?.sipoc?.input || mp?.sipoc?.inputs || null }); out.uft = u ? { id: u.id, name: u.name, e2e: u.e2e } : null; }
  return out;
}

/* ------------------------------------------------------------------------------------------ releases */
export function releases(orgId) { return all(`SELECT r.*, a.name author, p.name approver FROM design_releases r LEFT JOIN users a ON a.id=r.created_by LEFT JOIN users p ON p.id=r.approved_by WHERE r.org_id=? ORDER BY r.created_at DESC`, orgId).map(r => ({ ...r, items: J(r.items, {}), count: Object.keys(J(r.items, {})).length })); }
const currentItems = orgId => Object.fromEntries(all(`SELECT kind, element_id, version FROM design_elements WHERE org_id=? AND status!='Deleted'`, orgId).map(r => [`${r.kind}|${r.element_id}`, r.version]));
export function createRelease(req, { name, note }) {
  const n = (one(`SELECT COUNT(*) n FROM design_releases WHERE org_id=?`, req.orgId).n || 0) + 1; const id = uuid(); const tm = now();
  run(`INSERT INTO design_releases(id,org_id,code,name,status,version,items,note,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`, id, req.orgId, `DR-${String(n).padStart(3, '0')}`, name || `Design release ${n}`, 'Draft', 1, S(currentItems(req.orgId)), note || null, req.user.id, tm);
  auditRow(req, 'release.create', id, null, { name }); return one(`SELECT * FROM design_releases WHERE id=?`, id);
}
export function transitionRelease(req, id, action, justification) {
  const r = one(`SELECT * FROM design_releases WHERE id=? AND org_id=?`, id, req.orgId); if (!r) throw new HttpError(404, 'err.notFound');
  const tm = now();
  if (action === 'refresh') { if (r.status !== 'Draft') throw new HttpError(409, 'err.releaseFrozen'); run(`UPDATE design_releases SET items=?, version=version+1 WHERE id=?`, S(currentItems(req.orgId)), id); }
  else if (action === 'submit') { if (r.status !== 'Draft') throw new HttpError(409, 'err.lifecycle', { from: r.status, to: 'In review' }); run(`UPDATE design_releases SET status='In review', submitted_by=?, submitted_at=? WHERE id=?`, req.user.id, tm, id); }
  else if (action === 'publish') {
    if (r.status !== 'In review') throw new HttpError(409, 'err.lifecycle', { from: r.status, to: 'Published' });
    if ((r.submitted_by || r.created_by) === req.user.id || r.created_by === req.user.id) throw new HttpError(409, 'err.twoPerson'); // approval by another person
    run(`UPDATE design_releases SET status='Published', approved_by=?, published_at=? WHERE id=?`, req.user.id, tm, id);
  } else if (action === 'reject') { if (r.status !== 'In review') throw new HttpError(409, 'err.lifecycle', { from: r.status, to: 'Draft' }); run(`UPDATE design_releases SET status='Draft' WHERE id=?`, id); }
  else if (action === 'retire') { if (!String(justification || '').trim()) throw new HttpError(422, 'err.justificationRequired'); if (one(`SELECT COUNT(*) n FROM projects WHERE design_release_id=? AND status='Active'`, id).n) throw new HttpError(409, 'err.releaseInUse'); run(`UPDATE design_releases SET status='Retired', retired_at=?, justification=? WHERE id=?`, tm, justification, id); }
  else throw new HttpError(422, 'err.invalidOption', { field: 'action', value: action });
  auditRow(req, 'release.' + action, id, { status: r.status }, null, justification); invalidate(req.orgId);
  return releases(req.orgId).find(x => x.id === id);
}
/** Differences between two releases, or between a release and the current design (FR-DA-VER-09). */
export function compareReleases(orgId, a, b) {
  const items = id => (id === 'current' ? currentItems(orgId) : id === 'reference' ? {} : J(one(`SELECT items FROM design_releases WHERE id=? AND org_id=?`, id, orgId)?.items, {}));
  const A = items(a), B = items(b); const keys = [...new Set([...Object.keys(A), ...Object.keys(B)])].sort();
  return keys.filter(k => A[k] !== B[k]).map(k => { const [kind, id] = k.split('|'); const el = get(orgId, kind, id); return { kind, id, name: el?.name, a: A[k] ?? 0, b: B[k] ?? 0, change: !A[k] ? 'added' : !B[k] ? 'removed' : 'changed' }; });
}
/** Restore a release as one unit: every element back to its version in the release (FR-DA-VER-09). */
export function restoreRelease(req, id, justification) {
  const r = one(`SELECT * FROM design_releases WHERE id=? AND org_id=?`, id, req.orgId); if (!r) throw new HttpError(404, 'err.notFound');
  const items = J(r.items, {}); let n = 0;
  tx(() => { for (const [k, ver] of Object.entries(items)) { const [kind, eid] = k.split('|'); const cur = one(`SELECT version FROM design_elements WHERE org_id=? AND kind=? AND element_id=?`, req.orgId, kind, eid); if (cur?.version === ver) continue;
    const v = one(`SELECT data FROM entity_versions WHERE entity='DesignElement' AND record_id=? AND version=?`, vkey(req.orgId, kind, eid), ver); if (!v) continue; const d = J(v.data, {});
    writeVersion(req.orgId, kind, eid, d.element, { status: d.status || 'Active', custom: !!d.custom, source_version: d.source_version, note: `Restore of release ${r.code}`, justification, userId: req.user.id }); n++; }
    auditRow(req, 'release.restore', id, null, { restored: n }, justification); });
  invalidate(req.orgId); return { restored: n };
}
/** Impact preview and migration of a running project to another release (FR-DA-PDM-06). */
export function migrationPreview(orgId, projectId, toRelease) {
  const p = one(`SELECT id, design_release_id FROM projects WHERE id=? AND org_id=?`, projectId, orgId); if (!p) throw new HttpError(404, 'err.notFound');
  const diff = compareReleases(orgId, p.design_release_id || 'reference', toRelease);
  const affected = diff.filter(d => d.kind === 'uft' || d.kind === 'step' || d.kind === 'e2e').map(d => ({ ...d, open: d.kind === 'uft' ? one(`SELECT COUNT(*) n FROM task_instances WHERE project_id=? AND uft_id=? AND status!='Completed'`, projectId, d.id).n : d.kind === 'e2e' ? one(`SELECT COUNT(*) n FROM e2e_instances WHERE project_id=? AND e2e_id=? AND status!='Completed'`, projectId, d.id).n : one(`SELECT COUNT(*) n FROM task_instances WHERE project_id=? AND steps LIKE ? AND status!='Completed'`, projectId, `%"id":"${d.id}"%`).n }));
  return { from: p.design_release_id, to: toRelease, changes: diff, affected, openRecords: affected.reduce((s, x) => s + x.open, 0) };
}
export function migrate(req, projectId, toRelease, justification) {
  const rel = one(`SELECT * FROM design_releases WHERE id=? AND org_id=? AND status='Published'`, toRelease, req.orgId); if (!rel) throw new HttpError(409, 'err.releaseNotPublished');
  if (!String(justification || '').trim()) throw new HttpError(422, 'err.justificationRequired');
  const pre = migrationPreview(req.orgId, projectId, toRelease);
  run(`UPDATE projects SET design_release_id=?, updated_at=? WHERE id=?`, toRelease, now(), projectId);
  auditRow(req, 'project.migrate', projectId, { release: pre.from }, { release: toRelease, changes: pre.changes.length }, justification); return pre;
}
export function latestPublished(orgId) { return one(`SELECT id FROM design_releases WHERE org_id=? AND status='Published' ORDER BY published_at DESC LIMIT 1`, orgId)?.id || null; }

/* ------------------------------------------------------------------------------------- export, import */
export function exportDesign(orgId) {
  const elements = KINDS.flatMap(k => list(orgId, k).map(x => ({ kind: k, id: x.id, status: x._status || 'Active', custom: !!x._custom, modified: !!x._org && !x._custom, version: x._version || 0, data: clean(x) })));
  return { format: 'cortexskills-design', version: 1, exported_at: now(), org_id: orgId, elements };
}
/** Import as new versions — history is never overwritten (FR-DA-PDM-10). */
export function importDesign(req, payload) {
  if (payload?.format !== 'cortexskills-design' || !Array.isArray(payload.elements)) throw new HttpError(422, 'err.importFormat');
  let updated = 0, created = 0, skipped = 0;
  tx(() => { for (const e of payload.elements) {
    if (!KINDS.includes(e.kind) || !e.id || !e.data) { skipped++; continue; }
    const cur = get(req.orgId, e.kind, e.id);
    const same = cur && JSON.stringify(pickFields(clean(cur))) === JSON.stringify(pickFields(e.data)) && (cur._status || 'Active') === (e.status || 'Active');
    if (same) { skipped++; continue; }
    writeVersion(req.orgId, e.kind, e.id, { ...(cur ? clean(cur) : {}), ...e.data, id: e.id }, { status: e.status === 'Retired' ? 'Retired' : 'Active', custom: cur ? !!cur._custom : true, source_version: cur?._source || refVersion(e.kind, e.id), note: 'Import', userId: req.user.id });
    cur ? updated++ : created++;
  } auditRow(req, 'import', 'design', null, { updated, created, skipped }); });
  invalidate(req.orgId); return { updated, created, skipped };
}
/** BPMN 2.0 of an end-to-end process with one lane per Responsible role (FR-DA-PDM-10, FR-DA-DGC-06). */
export function bpmnXml(orgId, e2eId, lang = 'en', { releaseId = null } = {}) {
  const e = get(orgId, 'e2e', e2eId, { releaseId }); if (!e) throw new HttpError(404, 'err.notFound');
  const ufts = (e.ufts || []).map(id => get(orgId, 'uft', id, { releaseId })).filter(Boolean);
  const esc = s => String(s ?? '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  const T = v => (v && typeof v === 'object' ? v[lang] || v.en : v) || '';
  const roles = [...new Set(ufts.map(u => T(u.racsiT?.R) || u.racsi?.R || 'Owner'))];
  const laneH = 140, taskW = 140, gap = 60, x0 = 160; const W = x0 + (ufts.length + 1) * (taskW + gap) + 120;
  const pos = ufts.map((u, i) => ({ id: `Task_${i}`, u, lane: roles.indexOf(T(u.racsiT?.R) || u.racsi?.R || 'Owner'), x: x0 + (i + 1) * (taskW + gap) }));
  const shapes = [], flows = [], edges = [];
  const y = lane => lane * laneH + 30;
  const first = pos[0], last = pos[pos.length - 1];
  const geo = { Start: { x: x0 + 40, y: y(first?.lane || 0) + 32, w: 36, h: 36 } };
  pos.forEach(p => { geo[p.id] = { x: p.x, y: y(p.lane) + 10, w: taskW, h: 80 }; });
  geo.End = { x: (last?.x || x0) + taskW + gap, y: y(last?.lane || 0) + 32, w: 36, h: 36 };
  shapes.push(`<bpmndi:BPMNShape id="Start_di" bpmnElement="Start"><dc:Bounds x="${geo.Start.x}" y="${geo.Start.y}" width="36" height="36"/></bpmndi:BPMNShape>`);
  pos.forEach(p => shapes.push(`<bpmndi:BPMNShape id="${p.id}_di" bpmnElement="${p.id}"><dc:Bounds x="${geo[p.id].x}" y="${geo[p.id].y}" width="${taskW}" height="80"/></bpmndi:BPMNShape>`));
  shapes.push(`<bpmndi:BPMNShape id="End_di" bpmnElement="End"><dc:Bounds x="${geo.End.x}" y="${geo.End.y}" width="36" height="36"/></bpmndi:BPMNShape>`);
  const nodes = ['Start', ...pos.map(p => p.id), 'End'];
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = geo[nodes[i]], b = geo[nodes[i + 1]]; const ay = a.y + a.h / 2, by = b.y + b.h / 2, ax = a.x + a.w, bx = b.x; const mx = Math.round((ax + bx) / 2);
    const pts = ay === by ? [[ax, ay], [bx, by]] : [[ax, ay], [mx, ay], [mx, by], [bx, by]];
    flows.push(`<bpmn:sequenceFlow id="Flow_${i}" sourceRef="${nodes[i]}" targetRef="${nodes[i + 1]}"/>`);
    edges.push(`<bpmndi:BPMNEdge id="Flow_${i}_di" bpmnElement="Flow_${i}">${pts.map(([px, py]) => `<di:waypoint x="${px}" y="${py}"/>`).join('')}</bpmndi:BPMNEdge>`);
  }
  const lanes = roles.map((r, i) => `<bpmn:lane id="Lane_${i}" name="${esc(r)}">${pos.filter(p => p.lane === i).map(p => `<bpmn:flowNodeRef>${p.id}</bpmn:flowNodeRef>`).join('')}${i === (pos[0]?.lane || 0) ? '<bpmn:flowNodeRef>Start</bpmn:flowNodeRef>' : ''}${i === (last?.lane || 0) ? '<bpmn:flowNodeRef>End</bpmn:flowNodeRef>' : ''}</bpmn:lane>`).join('');
  const laneShapes = roles.map((r, i) => `<bpmndi:BPMNShape id="Lane_${i}_di" bpmnElement="Lane_${i}" isHorizontal="true"><dc:Bounds x="${x0 - 30}" y="${y(i) - 20}" width="${W - x0}" height="${laneH}"/></bpmndi:BPMNShape>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Defs_${esc(e2eId)}" targetNamespace="https://cortexskills.app/bpmn">
<bpmn:collaboration id="Collab"><bpmn:participant id="Pool" name="${esc(e2eId + ' — ' + T(e.name))}" processRef="Process_${esc(e2eId)}"/></bpmn:collaboration>
<bpmn:process id="Process_${esc(e2eId)}" isExecutable="false"><bpmn:laneSet id="Lanes">${lanes}</bpmn:laneSet>
<bpmn:startEvent id="Start" name="${esc(T(e.trigger))}"/>${pos.map(p => `<bpmn:userTask id="${p.id}" name="${esc(p.u.id + ' ' + T(p.u.name))}"/>`).join('')}<bpmn:endEvent id="End" name="${esc(T(e.terminal))}"/>${flows.join('')}</bpmn:process>
<bpmndi:BPMNDiagram id="Diagram"><bpmndi:BPMNPlane id="Plane" bpmnElement="Collab"><bpmndi:BPMNShape id="Pool_di" bpmnElement="Pool" isHorizontal="true"><dc:Bounds x="${x0 - 60}" y="10" width="${W - x0 + 30}" height="${roles.length * laneH}"/></bpmndi:BPMNShape>${laneShapes}${shapes.join('')}${edges.join('')}</bpmndi:BPMNPlane></bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}
