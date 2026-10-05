// Project templates (full CRUD): a template is the blueprint of the projects created from it —
// end-to-end processes, macro processes, tasks and steps, business rules, controls, risks and
// opportunities, alerts, KPIs and reporting. Library templates are read-only for tenants: they
// copy one to adapt it, and their copy is offered next to the library template.
import { Router } from 'express';
import { all, get, run, uid, now, J, P, tx } from '../db.js';
import { requirePerm, can } from '../auth.js';
import { h, send, bad, notFound, forbidden } from '../http.js';
import { audit, snapshot } from '../services/audit.js';
import { catalog, invalidateCatalog } from '../catalog/store.js';
import { ROLES } from '../permissions.js';
import { blueprintOf, emptyBlueprint, listsOf, structureOf, defaultLists, LISTS, E2E_ORDER } from '../services/blueprint.js';

const r = Router();
const TEXT = new Set(['name', 'goals', 'goal', 'brief', 'condition', 'action', 'description', 'title', 'formula', 'treatment', 'frequency', 'target']);
const i18n = (lang, prev, v) => (v === undefined ? prev : v === null || v === '' ? null : typeof v === 'object' ? v : { ...(prev && typeof prev === 'object' ? prev : prev ? { en: String(prev) } : {}), [lang]: String(v) });

function visible(req, t) {
  return t && (t.org_id === null || t.org_id === req.user.org_id || req.user.is_platform_admin);
}
function editable(req, t) {
  if (!can(req, 'templates.manage')) return false;
  return t.org_id ? (t.org_id === req.user.org_id || req.user.is_platform_admin) : !!req.user.is_platform_admin;
}
function load(req, id) {
  const t = get('SELECT * FROM project_templates WHERE id=?', id);
  if (!visible(req, t)) throw notFound('Template');
  return t;
}
function meta(t) {
  return { id: t.id, code: t.code, name: P(t.name), description: P(t.description), scope: t.scope, vertical: t.vertical, mode: t.mode, track: t.track, msType: t.ms_type, status: t.status, version: t.version, useCount: t.use_count, library: !t.org_id, orgId: t.org_id, updatedAt: t.updated_at || t.created_at, sourceId: t.source_id || null };
}
function counts(st, lists) {
  const e = st.filter(x => x.include);
  const m = e.flatMap(x => x.mps.filter(y => y.include));
  return { e2e: e.length, mps: m.length, steps: m.reduce((a, y) => a + y.steps.filter(s => s.include).length, 0), gates: e.filter(x => x.gate).length, ...Object.fromEntries(LISTS.map(k => [k, lists[k].length])) };
}

// List: library templates and the organization's own templates (all statuses for editors).
r.get('/project-templates', requirePerm('project.create', 'templates.manage', 'process.view'), h((req, res) => {
  const mine = can(req, 'templates.manage');
  const list = all(`SELECT * FROM project_templates WHERE (org_id IS NULL OR org_id=?) ${mine ? "AND status<>'Deleted'" : "AND status='Published'"} ORDER BY org_id IS NULL, code`, req.user.org_id);
  send(req, res, list.map(t => ({ ...meta(t), canEdit: editable(req, t) })));
}));

r.get('/project-templates/:id', requirePerm('project.create', 'templates.manage', 'process.view'), h((req, res) => {
  const t = load(req, req.params.id);
  const st = structureOf(t);
  const lists = listsOf(t);
  const cat = catalog();
  send(req, res, {
    ...meta(t), canEdit: editable(req, t), canCopy: can(req, 'templates.manage'),
    structure: st, lists, counts: counts(st, lists),
    roles: ROLES.filter(x => x.code !== 'platform_admin').map(x => ({ code: x.code, name: x.name })),
    mpOptions: st.flatMap(e => e.mps.map(m => ({ id: m.id, code: m.code, name: m.name }))),
    e2eOptions: st.map(e => ({ id: e.id, name: e.name })),
    stepTypes: ['User Task', 'Service Task', 'Manual Task', 'Business Rule Task', 'Send Task', 'Receive Task'],
    catalogSize: { e2e: cat.e2e.length, mps: cat.macroProcesses.length },
  });
}));

// Create: a blank template (catalog defaults for its system and mode) or a copy of another.
r.post('/project-templates', requirePerm('templates.manage'), h((req, res) => {
  const b = req.body || {};
  const src = b.copyOf ? load(req, b.copyOf) : null;
  if (!src && !String(b.name || '').trim()) throw bad('NAME_REQUIRED', 'The template name is required.');
  const id = uid();
  const n = get('SELECT COUNT(*) n FROM project_templates WHERE org_id=?', req.user.org_id).n + 1;
  const code = b.code || `TPL-${(get('SELECT short_code FROM organizations WHERE id=?', req.user.org_id)?.short_code || 'ORG')}-${String(n).padStart(2, '0')}`;
  const name = b.name ? { [req.lang]: String(b.name) } : { ...(P(src.name) || {}), [req.lang]: `${(P(src.name) || {})[req.lang] || (P(src.name) || {}).en || src.code} (${req.lang === 'fr' ? 'copie' : req.lang === 'ar' ? 'نسخة' : 'copy'})` };
  const base = src || { scope: 'universal', vertical: b.vertical || null, mode: b.mode === 'SME' ? 'SME' : 'FULL', track: null, ms_type: b.msType === 'QHSE' ? 'QHSE' : 'QMS', fields: J({ standards: b.msType === 'QHSE' ? ['ISO 9001', 'ISO 14001', 'ISO 45001'] : ['ISO 9001'] }), phases: J(E2E_ORDER.map(e => ({ e2e: e, gate: `GATE-${e}` }))), roles: J(['ims_manager', 'quality_manager', 'top_management']), milestones: J([]), content: null, description: null };
  // A copy keeps the blueprint and materializes the lists so the copy can be edited freely.
  const content = src ? { ...blueprintOf(src), lists: listsOf(src) } : { ...emptyBlueprint(), lists: defaultLists(base) };
  run(`INSERT INTO project_templates(id,org_id,code,name,description,scope,vertical,mode,track,ms_type,status,version,fields,phases,roles,milestones,use_count,created_at,content,updated_at,updated_by,source_id)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,1,?,?,?,?,0,?,?,?,?,?)`, id, req.user.org_id, code, J(name), base.description ?? (b.description ? J({ [req.lang]: b.description }) : null), base.scope, base.vertical, base.mode, base.track, base.ms_type, 'Draft',
  base.fields, base.phases, base.roles, base.milestones, now(), J(content), now(), req.user.id, src?.id || null);
  invalidateCatalog();
  audit(req, req.user.org_id, 'project_template', id, 'create', null, { code, copyOf: src?.code || null }, null);
  res.status(201).json({ id });
}));

// Update: header fields, the structure (include / gate / owner / role / names) and the lists.
r.put('/project-templates/:id', requirePerm('templates.manage'), h((req, res) => {
  const t = load(req, req.params.id);
  if (!editable(req, t)) throw forbidden('Library templates are read-only: copy the template to adapt it.');
  const b = req.body || {};
  const bp = blueprintOf(t);
  const lang = req.lang;
  const before = { content: P(t.content), name: P(t.name) };
  // Header
  const name = b.name !== undefined ? i18n(lang, P(t.name), b.name) : P(t.name);
  if (!name || !Object.values(name).some(Boolean)) throw bad('NAME_REQUIRED', 'The template name is required.');
  const description = b.description !== undefined ? i18n(lang, P(t.description), b.description) : P(t.description);
  const msType = b.msType ? (b.msType === 'QHSE' ? 'QHSE' : 'QMS') : t.ms_type;
  const mode = b.mode ? (b.mode === 'SME' ? 'SME' : 'FULL') : t.mode;
  // Structure patches: { e2e: {id: {...}}, mp: {...}, step: {...} }; null removes a patch.
  for (const k of ['e2e', 'mp', 'step']) {
    for (const [id, patch] of Object.entries(b[k] || {})) {
      if (patch === null) { delete bp[k][id]; continue; }
      const prev = bp[k][id] || {};
      const next = { ...prev };
      for (const [f, v] of Object.entries(patch)) next[f] = TEXT.has(f) ? i18n(lang, prev[f], v) : v;
      bp[k][id] = next;
    }
  }
  // Custom elements: add / update / delete.
  const cat = catalog();
  for (const k of ['e2e', 'mp', 'step']) {
    const ops = b.custom?.[k];
    if (!ops) continue;
    for (const item of ops.add || []) {
      if (!String(item.name || '').trim()) throw bad('NAME_REQUIRED', 'A name is required.');
      const short = t.id.slice(0, 4).toUpperCase();
      const n = bp.custom[k].length + 1;
      let id; let extra = {};
      if (k === 'e2e') { id = `E2E-T${short}${n}`; extra = { after: item.after || null, goals: i18n(lang, null, item.goals || '') }; }
      if (k === 'mp') {
        if (!item.e2e) throw bad('E2E_REQUIRED', 'Choose the end-to-end process of the macro process.');
        id = `MP-T${short}${String(n).padStart(2, '0')}`; extra = { e2e: item.e2e, code: item.code || `UMS-T${String(n).padStart(2, '0')}`, ownerRoleCode: item.owner || 'ims_manager', goal: i18n(lang, null, item.goal || '') };
      }
      if (k === 'step') {
        if (!item.mp) throw bad('MP_REQUIRED', 'Choose the macro process of the step.');
        const siblings = bp.custom.step.filter(s => s.mp === item.mp).length + 1;
        id = `${item.mp}.T${short}${siblings}`; extra = { mp: item.mp, role: item.role || 'ims_manager', type: item.type || 'User Task', brief: i18n(lang, null, item.brief || ''), seq: 1000 + siblings };
      }
      while (bp.custom[k].some(x => x.id === id) || (k === 'step' ? cat.stepById[id] && !cat.stepById[id].custom : false)) id += 'X';
      bp.custom[k].push({ id, name: i18n(lang, null, item.name), ...extra });
    }
    for (const item of ops.update || []) {
      const i = bp.custom[k].findIndex(x => x.id === item.id);
      if (i < 0) throw notFound('Element');
      const prev = bp.custom[k][i];
      const next = { ...prev };
      for (const [f, v] of Object.entries(item)) if (f !== 'id') next[f] = TEXT.has(f) ? i18n(lang, prev[f], v) : v;
      if (k === 'mp' && item.owner) next.ownerRoleCode = item.owner;
      bp.custom[k][i] = next;
    }
    for (const id of ops.remove || []) {
      bp.custom[k] = bp.custom[k].filter(x => x.id !== id);
      // Deleting a custom phase or macro process deletes what it contains.
      if (k === 'e2e') { const gone = bp.custom.mp.filter(m => m.e2e === id).map(m => m.id); bp.custom.mp = bp.custom.mp.filter(m => m.e2e !== id); bp.custom.step = bp.custom.step.filter(s => !gone.includes(s.mp)); }
      if (k === 'mp') bp.custom.step = bp.custom.step.filter(s => s.mp !== id);
      delete bp[k][id];
    }
  }
  // Lists: full replacement per list (rows keep their trilingual text).
  if (b.lists) {
    const cur = bp.lists || listsOf(t);
    const next = { ...cur };
    for (const k of LISTS) {
      if (!b.lists[k]) continue;
      const prevById = Object.fromEntries((cur[k] || []).map(x => [x.id, x]));
      const seen = new Set();
      next[k] = b.lists[k].map((row, i) => {
        let id = String(row.id || '').trim() || `${k.slice(0, 3).toUpperCase()}-C${String(i + 1).padStart(2, '0')}`;
        while (seen.has(id)) id += 'X';
        seen.add(id);
        const prev = prevById[row._key || row.id] || prevById[id] || {};
        const out = { id };
        for (const [f, v] of Object.entries(row)) if (!['id', '_key'].includes(f)) out[f] = TEXT.has(f) ? i18n(lang, prev[f], v) : v;
        return out;
      });
    }
    bp.lists = next;
  }
  const phases = P(t.phases) || [];
  run('UPDATE project_templates SET name=?, description=?, ms_type=?, mode=?, vertical=?, content=?, version=version+1, updated_at=?, updated_by=?, status=CASE WHEN status=? THEN ? ELSE status END WHERE id=?',
    J(name), description ? J(description) : null, msType, mode, b.vertical !== undefined ? (b.vertical || null) : t.vertical, J(bp), now(), req.user.id, 'Retired', 'Retired', t.id);
  if (b.e2e) run('UPDATE project_templates SET phases=? WHERE id=?', J(phases), t.id);
  invalidateCatalog();
  audit(req, t.org_id || req.user.org_id, 'project_template', t.id, 'update', before, { content: bp, name }, b.note || null);
  snapshot(req, t.org_id || req.user.org_id, 'project_template', t.id, { content: bp, name }, b.note || null);
  res.json({ ok: true, version: t.version + 1 });
}));

// Status: Draft → Published → Retired (and back to Draft to edit again).
r.post('/project-templates/:id/status', requirePerm('templates.manage'), h((req, res) => {
  const t = load(req, req.params.id);
  if (!editable(req, t)) throw forbidden('Library templates are read-only: copy the template to adapt it.');
  const status = req.body?.status;
  if (!['Draft', 'Published', 'Retired'].includes(status)) throw bad('BAD_STATUS', 'Unknown status.');
  if (status === 'Published') {
    const st = structureOf(t);
    if (!st.some(e => e.include && e.mps.some(m => m.include && m.steps.some(s => s.include)))) throw bad('EMPTY_TEMPLATE', 'A published template needs at least one phase with a macro process and a step.');
  }
  run('UPDATE project_templates SET status=?, updated_at=?, updated_by=? WHERE id=?', status, now(), req.user.id, t.id);
  audit(req, t.org_id || req.user.org_id, 'project_template', t.id, 'status', { status: t.status }, { status }, req.body?.justification || null);
  res.json({ ok: true, status });
}));

// Delete: a template no project uses is deleted; otherwise it is retired.
r.delete('/project-templates/:id', requirePerm('templates.manage'), h((req, res) => {
  const t = load(req, req.params.id);
  if (!editable(req, t)) throw forbidden('Library templates are read-only.');
  const used = get('SELECT COUNT(*) n FROM projects WHERE template_id=?', t.id).n;
  tx(() => {
    if (used) run("UPDATE project_templates SET status='Retired', updated_at=? WHERE id=?", now(), t.id);
    else run('DELETE FROM project_templates WHERE id=?', t.id);
  });
  invalidateCatalog();
  audit(req, t.org_id || req.user.org_id, 'project_template', t.id, used ? 'retire' : 'delete', meta(t), null, null);
  res.json({ ok: true, status: used ? 'Retired' : 'Deleted', used });
}));

export default r;
