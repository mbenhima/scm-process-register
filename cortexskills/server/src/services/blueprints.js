// Project Template Blueprints (FR-DA-PTB-01..10, PTC-07/08). A blueprint says, for one project template,
// which phases, end-to-end processes, tasks and steps of the reference process design a project receives, with
// their names, owners and roles; the custom elements it adds; and its rules, controls, risks, alerts, KPIs and
// Reporting Plan. A project records the template code, version and blueprint trace it was created from, so a
// later template version never changes an existing project.
import { all, one, run } from '../db.js';
import { uuid, now, S, J, pick, HttpError } from '../lib/util.js';
import * as cat from '../catalog.js';
import { recordVersion } from '../audit.js';
import { processPlan, insertRecord } from './projects.js';

export const PARTS = ['rules', 'controls', 'risks', 'alerts', 'kpis', 'reporting'];
const ORIGINS = ['library', 'manual', 'ai'];
const FREQ = ['Weekly', 'Monthly', 'Quarterly', 'Semi-annual', 'Annual', 'On demand'];
const FORMATS = ['PDF', 'Excel', 'Word', 'Dashboard'];
const ml = v => (v && typeof v === 'object' ? v : { en: v ?? '', fr: v ?? '', ar: v ?? '' });

/** Template record (library or the Organization's own). */
export function templateOf(orgId, id) {
  const r = one(`SELECT * FROM records WHERE id=? AND entity='ProjectTemplate' AND (org_id IS NULL OR org_id=?)`, id, orgId);
  if (!r) throw new HttpError(404, 'err.notFound');
  return { rec: r, data: J(r.data, {}), own: !!r.org_id };
}

/** Steps of a task with the reference ids used as blueprint keys. */
const stepsOf = uftId => (cat.get('uft', uftId)?.steps || []);

/** The process tree a template covers, before inclusion choices. */
function referenceTree(tpl) {
  const phases = Array.isArray(tpl.phases) && tpl.phases.length ? tpl.phases : processPlan({ mode: tpl.mode || 'Full', track: tpl.track, vertical: tpl.vertical_id });
  return phases.map(p => ({ no: p.no, gate: p.gate ?? cat.list('phase').find(x => x.no === p.no)?.gate ?? null, e2e: (p.e2e || []).filter(id => cat.get('e2e', id)) }));
}

/** Default blueprint derived from the reference design and the platform libraries (origin "library"). */
export function defaultBlueprint(tpl) {
  const tree = referenceTree(tpl);
  const e2es = tree.flatMap(p => p.e2e); const ufts = e2es.flatMap(e => cat.get('e2e', e)?.ufts || []);
  const steps = new Set(ufts.flatMap(stepsOf)); const mps = new Set(e2es.flatMap(e => cat.get('e2e', e)?.mps || []));
  const rules = cat.list('rule').filter(r => steps.has(r.step) || mps.has(String(r.step).split('.')[0]));
  const ruleIds = new Set(rules.map(r => r.id));
  return {
    elements: {}, custom: [],
    rules: rules.map(r => ({ key: r.id, code: r.id, condition: r.condition, severity: r.severity, owner: r.owner, step: r.step, origin: 'library' })),
    controls: cat.list('control').filter(c => String(c.steps || '').split(/[,; ]+/).some(s => steps.has(s) || mps.has(s.split('.')[0]))).map(c => ({ key: c.id, code: c.id, name: c.name, type: c.type, frequency: c.frequency, owner: c.owner, origin: 'library' })),
    risks: cat.list('risk').filter(r => (r.controls || []).length).slice(0, 12).map(r => ({ key: r.id, code: r.id, name: r.name, category: r.category, likelihood: r.likelihood, impact: r.impact, owner: r.owner, origin: 'library' })),
    alerts: cat.list('alertType').filter(a => ruleIds.has(a.rule)).map(a => ({ key: a.id, code: a.id, name: a.name || a.description || { en: a.id }, severity: a.severity, enabled: true, origin: 'library' })),
    kpis: cat.list('kpi').filter(k => mps.has(k.mp)).map(k => ({ key: k.id, code: k.id, name: k.name, target: k.target, formula: k.formula, origin: 'library' })),
    reporting: cat.list('report').slice(0, 10).map(r => ({ key: r.id, code: r.id, name: r.name, audience: r.audience, frequency: freqOf(r.cadence), format: 'PDF', owner: pick(r.owner || { en: 'Head of L&D' }, 'en'), origin: 'library' })),
  };
}
const freqOf = c => { const s = pick(c, 'en') || ''; return FREQ.find(f => s.toLowerCase().includes(f.toLowerCase().replace('-', ''))) || (/(year|annual)/i.test(s) ? 'Annual' : /quarter/i.test(s) ? 'Quarterly' : /month/i.test(s) ? 'Monthly' : /week/i.test(s) ? 'Weekly' : 'On demand'); };

export function blueprintOf(tpl) {
  const b = tpl.blueprint && typeof tpl.blueprint === 'object' ? tpl.blueprint : null;
  const d = b ? null : defaultBlueprint(tpl);
  const out = b ? { ...defaultBlueprint({ ...tpl, blueprint: null }), ...b } : d;
  out.elements = out.elements || {}; out.custom = out.custom || [];
  return out;
}

const inc = (bp, ref) => bp.elements[ref]?.included !== false;

/** Tree shown in the blueprint editor: one node per phase, process, task and step with its inclusion state. */
export function tree(orgId, id, lang = 'en') {
  const { rec, data, own } = templateOf(orgId, id); const bp = blueprintOf(data);
  const node = (kind, ref, name, extra = {}) => { const e = bp.elements[ref] || {}; return { kind, ref, name: e.name ? pick(e.name, lang) : pick(name, lang), referenceName: pick(name, lang), included: e.included !== false, owner: e.owner || extra.owner || null, roles: e.roles || extra.roles || [], renamed: !!e.name, ...extra }; };
  const customFor = parent => bp.custom.filter(c => c.parent === parent).map(c => ({ kind: c.kind, ref: 'custom:' + c.id, id: c.id, name: pick(c.name, lang), included: true, owner: c.owner || null, roles: c.roles || [], custom: true, children: [] }));
  const phases = referenceTree(data).map(p => {
    const ph = cat.list('phase').find(x => x.no === p.no);
    return { ...node('phase', 'phase:' + p.no, ph?.name || { en: 'Phase ' + p.no }, { gate: p.gate }), children: [
      ...p.e2e.map(eid => { const e = cat.get('e2e', eid);
        return { ...node('e2e', 'e2e:' + eid, e.name, { code: eid, mps: e.mps }), children: [
          ...(e.ufts || []).map(uid => { const u = cat.get('uft', uid);
            return { ...node('task', 'task:' + uid, u.name, { code: uid, owner: u.racsi?.R, roles: Object.entries(u.racsi || {}).map(([k, v]) => `${k}: ${v}`) }), children: [
              ...stepsOf(uid).map(sid => { const s = cat.get('step', sid); return node('step', 'step:' + sid, s?.name || { en: sid }, { code: sid }); }),
              ...customFor('task:' + uid)] };
          }), ...customFor('e2e:' + eid)] };
      }), ...customFor('phase:' + p.no)] };
  });
  phases.push(...bp.custom.filter(c => c.kind === 'phase' && !c.parent).map(c => ({ kind: 'phase', ref: 'custom:' + c.id, id: c.id, name: pick(c.name, lang), included: true, custom: true, owner: c.owner || null, roles: c.roles || [], children: customFor('custom:' + c.id) })));
  const count = k => { let n = 0; const walk = xs => xs.forEach(x => { if (x.kind === k && x.included) n++; if (x.included && x.children) walk(x.children); }); walk(phases); return n; };
  return { id: rec.id, own, version: rec.version, status: data.status, code: data.code || rec.ref || rec.id.slice(0, 8), name: data.name, mode: data.mode, vertical_id: data.vertical_id, focus: data.focus,
    tree: phases, counts: { phases: count('phase'), e2e: count('e2e'), tasks: count('task'), steps: count('step') }, parts: Object.fromEntries(PARTS.map(p => [p, bp[p] || []])),
    options: { origins: ORIGINS, frequencies: FREQ, formats: FORMATS } };
}

function save(req, rec, data, note) {
  if (!rec.org_id && !req.user.is_platform) throw new HttpError(409, 'err.copyFirst');
  if (data.status === 'Retired') throw new HttpError(409, 'err.retired');
  const v = rec.version + 1; data.version = v;
  run(`UPDATE records SET data=?, version=?, updated_by=?, updated_at=? WHERE id=?`, S(data), v, req.user.id, now(), rec.id);
  recordVersion('ProjectTemplate', rec.id, rec.org_id, data, req.user.id, note);
  return v;
}

/** Include or exclude an element; set its name, owner and roles (PTB-03). */
export function setElement(req, id, ref, b) {
  const { rec, data } = templateOf(req.orgId, id); const bp = blueprintOf(data);
  if (ref.startsWith('custom:')) { const c = bp.custom.find(x => 'custom:' + x.id === ref); if (!c) throw new HttpError(404, 'err.notFound'); if (b.name) c.name = ml(b.name); if (b.owner !== undefined) c.owner = b.owner; if (b.roles) c.roles = b.roles; }
  else { const e = { ...(bp.elements[ref] || {}) }; if (b.included !== undefined) e.included = !!b.included; if (b.name) e.name = ml(b.name); if (b.owner !== undefined) e.owner = b.owner || null; if (b.roles) e.roles = b.roles; bp.elements[ref] = e; }
  data.blueprint = bp; return { version: save(req, rec, data, `element ${ref}`) };
}

/** Custom Element: a phase, macro process or step that exists only in projects created from this template (PTB-04). */
export function addCustom(req, id, b) {
  const { rec, data } = templateOf(req.orgId, id); const bp = blueprintOf(data);
  if (!['phase', 'mp', 'step'].includes(b.kind)) throw new HttpError(422, 'err.invalidFields', { fields: 'kind' });
  if (!pick(ml(b.name), 'en') && !pick(ml(b.name), 'fr')) throw new HttpError(422, 'err.required', { field: 'name' });
  if (b.kind !== 'phase' && !b.parent) throw new HttpError(422, 'err.noParent');
  const n = bp.custom.length + 1; const c = { id: `CE-${String(n).padStart(3, '0')}`, kind: b.kind, parent: b.parent || null, name: ml(b.name), owner: b.owner || null, roles: b.roles || [], description: ml(b.description || '') };
  while (bp.custom.some(x => x.id === c.id)) c.id = `CE-${String(Number(c.id.slice(3)) + 1).padStart(3, '0')}`;
  bp.custom.push(c); data.blueprint = bp; save(req, rec, data, `custom ${c.id}`); return c;
}
export function removeCustom(req, id, cid) {
  const { rec, data } = templateOf(req.orgId, id); const bp = blueprintOf(data);
  bp.custom = bp.custom.filter(x => x.id !== cid && x.parent !== 'custom:' + cid); data.blueprint = bp; save(req, rec, data, `remove ${cid}`); return { ok: true };
}

/** One part of the blueprint (rules, controls, risks, alerts, KPIs, reporting) — full CRUD on its rows (PTB-02, -07, -08). */
export function saveRow(req, id, part, b) {
  if (!PARTS.includes(part)) throw new HttpError(404, 'err.notFound');
  const { rec, data } = templateOf(req.orgId, id); const bp = blueprintOf(data); const rows = [...(bp[part] || [])];
  const origin = ORIGINS.includes(b.origin) ? b.origin : 'manual';
  if (origin === 'ai' && !b.validated) throw new HttpError(422, 'err.aiNotValidated');
  if (part === 'reporting') { if (!pick(ml(b.name), 'en') && !pick(ml(b.name), 'fr')) throw new HttpError(422, 'err.required', { field: 'name' }); if (b.frequency && !FREQ.includes(b.frequency)) throw new HttpError(422, 'err.invalidFields', { fields: 'frequency' }); if (b.format && !FORMATS.includes(b.format)) throw new HttpError(422, 'err.invalidFields', { fields: 'format' }); }
  const row = { ...b, origin, validated_by: origin === 'ai' ? req.user.id : undefined, validated_at: origin === 'ai' ? now() : undefined };
  for (const k of ['name', 'condition', 'audience', 'formula']) if (row[k] != null) row[k] = ml(row[k]);
  const i = b.key ? rows.findIndex(x => x.key === b.key) : -1;
  if (i >= 0) rows[i] = { ...rows[i], ...row }; else rows.push({ ...row, key: b.key || `${part.slice(0, 3).toUpperCase()}-${uuid().slice(0, 6)}` });
  bp[part] = rows; data.blueprint = bp; save(req, rec, data, `${part} ${row.key || 'new'}`); return bp[part];
}
export function deleteRow(req, id, part, key) {
  if (!PARTS.includes(part)) throw new HttpError(404, 'err.notFound');
  const { rec, data } = templateOf(req.orgId, id); const bp = blueprintOf(data); bp[part] = (bp[part] || []).filter(x => x.key !== key);
  data.blueprint = bp; save(req, rec, data, `${part} delete ${key}`); return bp[part];
}

/** Library rows the user may add to a part (taken from the Organization's own libraries). */
export function library(orgId, part, lang = 'en') {
  const rec = e => all(`SELECT data FROM records WHERE entity=? AND org_id=?`, e, orgId).map(x => J(x.data, {}));
  switch (part) {
    case 'rules': return rec('BusinessRule').map(r => ({ key: r.code, code: r.code, condition: r.condition, severity: r.severity, owner: r.owner, step: r.process_tag }));
    case 'controls': return rec('Control').map(c => ({ key: c.code, code: c.code, name: c.name, type: c.control_type, frequency: c.frequency, owner: c.owner }));
    case 'risks': return rec('RiskOpportunity').map(r => ({ key: r.code, code: r.code, name: r.title, category: r.category, likelihood: r.likelihood, impact: r.impact, owner: r.owner }));
    case 'kpis': return rec('KpiDefinition').map(k => ({ key: k.code, code: k.code, name: k.name, target: k.target, formula: k.formula }));
    case 'alerts': return cat.list('alertType').map(a => ({ key: a.id, code: a.id, name: a.name || { en: a.id }, severity: a.severity, enabled: true }));
    case 'reporting': return cat.list('report').map(r => ({ key: r.id, code: r.id, name: r.name, audience: r.audience, frequency: freqOf(r.cadence), format: 'PDF' }));
    default: throw new HttpError(404, 'err.notFound');
  }
}

/** Status transitions; a template with no included step cannot be published (PTB-05). */
export function setStatus(req, id, status) {
  const { rec, data } = templateOf(req.orgId, id);
  if (!['Draft', 'Published', 'Retired'].includes(status)) throw new HttpError(422, 'err.invalidFields', { fields: 'status' });
  if (status === 'Published' && !tree(req.orgId, id).counts.steps) throw new HttpError(409, 'err.noIncludedStep');
  if (data.status === 'Retired' && status !== 'Draft') throw new HttpError(409, 'err.retired');
  const prev = data.status; data.status = status;
  const v = rec.version + 1; data.version = v;
  run(`UPDATE records SET data=?, version=?, updated_by=?, updated_at=? WHERE id=?`, S(data), v, req.user.id, now(), rec.id);
  recordVersion('ProjectTemplate', rec.id, rec.org_id, data, req.user.id, `${prev} → ${status}`);
  return { status, version: v };
}
export function remove(req, id) {
  const { rec, data } = templateOf(req.orgId, id);
  if (!rec.org_id && !req.user.is_platform) throw new HttpError(409, 'err.copyFirst');
  const used = one(`SELECT COUNT(*) n FROM projects WHERE template_id=?`, rec.id).n;
  if (used) { data.status = 'Retired'; run(`UPDATE records SET data=? WHERE id=?`, S(data), rec.id); return { retired: true, projects: used }; }
  run(`DELETE FROM records WHERE id=?`, rec.id); return { deleted: true };
}
/** Duplicate into the Organization (also how a library template is customized). */
export function duplicate(req, id) {
  const { rec, data } = templateOf(req.orgId, id);
  const copy = { ...data, blueprint: blueprintOf(data), status: 'Draft', use_count: 0, platform: false, version: 1, code: `${data.code || 'TPL'}-C${Date.now().toString(36).slice(-4).toUpperCase()}`,
    name: Object.fromEntries(Object.entries(ml(data.name)).map(([k, v]) => [k, `${v} (${k === 'fr' ? 'copie' : k === 'ar' ? 'نسخة' : 'copy'})`])), copied_from: { id: rec.id, version: rec.version } };
  const nid = uuid(); insertRecord(nid, 'ProjectTemplate', req.orgId, null, copy.code, copy, req.user.id); return { id: nid };
}

/** Compare two versions of a blueprint, element by element and row by row (PTB-10). */
export function compare(orgId, id, a, b) {
  const { rec } = templateOf(orgId, id);
  const ver = v => { const x = one(`SELECT data FROM entity_versions WHERE entity='ProjectTemplate' AND record_id=? AND version=?`, rec.id, Number(v)); if (!x) throw new HttpError(404, 'err.notFound'); return blueprintOf(J(x.data, {})); };
  const A = ver(a), B = ver(b); const changes = [];
  const refs = new Set([...Object.keys(A.elements), ...Object.keys(B.elements)]);
  for (const r of refs) if (S(A.elements[r] || {}) !== S(B.elements[r] || {})) changes.push({ part: 'elements', key: r, before: A.elements[r] || null, after: B.elements[r] || null });
  const cA = new Map(A.custom.map(c => [c.id, c])), cB = new Map(B.custom.map(c => [c.id, c]));
  for (const k of new Set([...cA.keys(), ...cB.keys()])) if (S(cA.get(k) || null) !== S(cB.get(k) || null)) changes.push({ part: 'custom', key: k, before: cA.get(k) || null, after: cB.get(k) || null });
  for (const p of PARTS) { const mA = new Map((A[p] || []).map(x => [x.key, x])), mB = new Map((B[p] || []).map(x => [x.key, x]));
    for (const k of new Set([...mA.keys(), ...mB.keys()])) if (S(mA.get(k) || null) !== S(mB.get(k) || null)) changes.push({ part: p, key: k, change: !mA.has(k) ? 'added' : !mB.has(k) ? 'removed' : 'changed', before: mA.get(k) || null, after: mB.get(k) || null }); }
  return { a: Number(a), b: Number(b), changes };
}
export function versions(orgId, id) {
  const { rec } = templateOf(orgId, id);
  return all(`SELECT version, created_at, justification, (SELECT name FROM users WHERE id=user_id) author FROM entity_versions WHERE entity='ProjectTemplate' AND record_id=? ORDER BY version DESC`, rec.id);
}

/** Model for the Word, PDF and Excel export of a blueprint (PTB-10). */
export function exportModel(orgId, id, lang = 'en') {
  const t = tree(orgId, id, lang); const L = (en, fr, ar) => (lang === 'fr' ? fr : lang === 'ar' ? ar : en);
  const rows = []; const walk = (xs, d) => xs.forEach(x => { rows.push([`${'  '.repeat(d)}${x.code || x.id || ''}`, x.name, L(x.kind, { phase: 'phase', e2e: 'processus', task: 'tâche', step: 'étape', mp: 'macro-processus' }[x.kind] || x.kind, x.kind), x.included ? '✓' : '—', x.owner || '', x.custom ? L('Custom', 'Personnalisé', 'مخصص') : '']); if (x.included && x.children && x.kind !== 'task') walk(x.children, d + 1); });
  walk(t.tree, 0);
  const tab = (p, cols, f) => ({ id: p, type: 'table', heading: { rules: L('Business rules', 'Règles de gestion', 'قواعد العمل'), controls: L('Controls', 'Contrôles', 'الضوابط'), risks: L('Risks and opportunities', 'Risques et opportunités', 'المخاطر والفرص'), alerts: L('Alerts', 'Alertes', 'التنبيهات'), kpis: L('KPIs', 'Indicateurs', 'المؤشرات'), reporting: L('Reporting plan', 'Plan de reporting', 'خطة التقارير') }[p],
    table: { columns: cols, rows: (t.parts[p] || []).map(f) } });
  const o = r => L({ library: 'Library', manual: 'Manual', ai: 'AI (validated)' }[r.origin], { library: 'Bibliothèque', manual: 'Manuel', ai: 'IA (validée)' }[r.origin], { library: 'المكتبة', manual: 'يدوي', ai: 'ذكاء اصطناعي (مصادق)' }[r.origin]) || '';
  return { title: `${L('Project template blueprint', 'Plan type de projet', 'مخطط نموذج المشروع')} — ${pick(t.name, lang)}`, lang, code: t.code, category: 'Design',
    sections: [
      { id: 'ov', type: 'kv', heading: L('Overview', 'Vue d’ensemble', 'نظرة عامة'), kv: [[L('Code', 'Code', 'الرمز'), t.code], [L('Version', 'Version', 'الإصدار'), String(t.version)], [L('Status', 'Statut', 'الحالة'), t.status || ''], [L('Mode', 'Mode', 'النمط'), t.mode || ''], [L('Included', 'Inclus', 'المضمَّن'), `${t.counts.phases} / ${t.counts.e2e} / ${t.counts.tasks} / ${t.counts.steps}`]] },
      { id: 'tree', type: 'table', heading: L('Processes and steps', 'Processus et étapes', 'المسارات والخطوات'), table: { columns: [L('ID', 'ID', 'المعرف'), L('Name', 'Nom', 'الاسم'), L('Level', 'Niveau', 'المستوى'), L('Included', 'Inclus', 'مضمَّن'), L('Owner', 'Responsable', 'المسؤول'), L('Origin', 'Origine', 'الأصل')], rows } },
      tab('rules', ['Code', L('Condition', 'Condition', 'الشرط'), L('Severity', 'Gravité', 'الخطورة'), L('Origin', 'Origine', 'الأصل')], r => [r.code || r.key, pick(r.condition, lang), r.severity || '', o(r)]),
      tab('controls', ['Code', L('Name', 'Nom', 'الاسم'), L('Type', 'Type', 'النوع'), L('Origin', 'Origine', 'الأصل')], r => [r.code || r.key, pick(r.name, lang), r.type || '', o(r)]),
      tab('risks', ['Code', L('Name', 'Nom', 'الاسم'), 'L × I', L('Origin', 'Origine', 'الأصل')], r => [r.code || r.key, pick(r.name, lang), `${r.likelihood || ''} × ${r.impact || ''}`, o(r)]),
      tab('alerts', ['Code', L('Name', 'Nom', 'الاسم'), L('Enabled', 'Active', 'مفعل'), L('Origin', 'Origine', 'الأصل')], r => [r.code || r.key, pick(r.name, lang), r.enabled === false ? '—' : '✓', o(r)]),
      tab('kpis', ['Code', L('Name', 'Nom', 'الاسم'), L('Target', 'Cible', 'الهدف'), L('Origin', 'Origine', 'الأصل')], r => [r.code || r.key, pick(r.name, lang), String(r.target ?? ''), o(r)]),
      tab('reporting', [L('Report', 'Rapport', 'التقرير'), L('Audience', 'Destinataires', 'الجمهور'), L('Frequency', 'Fréquence', 'التواتر'), L('Format', 'Format', 'الصيغة'), L('Owner', 'Responsable', 'المسؤول')], r => [pick(r.name, lang), pick(r.audience, lang), r.frequency || '', r.format || '', r.owner || '']),
    ], sources: [{ name: 'ProjectTemplate', records: 1 }], profile: { identification: false, revisions: false, sources: false, approval: false } };
}

/**
 * Applies a blueprint to a new project (PTB-06, -09): filters the plan to included elements, returns the
 * exclusions for task instantiation, adds missing rules and controls to the Organization, plans the reports and
 * records the trace.
 */
export function applyPlan(tplData, phases) {
  const bp = blueprintOf(tplData);
  const out = phases.filter(p => inc(bp, 'phase:' + p.no)).map(p => ({ ...p, e2e: p.e2e.filter(e => inc(bp, 'e2e:' + e)) }));
  const excludedTasks = new Set(Object.entries(bp.elements).filter(([k, v]) => k.startsWith('task:') && v.included === false).map(([k]) => k.slice(5)));
  const excludedSteps = new Set(Object.entries(bp.elements).filter(([k, v]) => k.startsWith('step:') && v.included === false).map(([k]) => k.slice(5)));
  return { phases: out, excludedTasks, excludedSteps, bp };
}
export function applyAfter(req, project, tplRec, tplData, bp) {
  const t = now(); const trace = { template: tplData.code || tplRec.ref || tplRec.id, version: tplRec.version, applied_at: t, elements: {} };
  // Renamed / owned elements carried into the project instances, with their blueprint reference.
  for (const ti of all(`SELECT id, uft_id, steps FROM task_instances WHERE project_id=?`, project.id)) {
    const e = bp.elements['task:' + ti.uft_id]; trace.elements[ti.id] = 'task:' + ti.uft_id;
    const steps = J(ti.steps, []).filter(s => bp.elements['step:' + s.id]?.included !== false);
    run(`UPDATE task_instances SET steps=?, title=coalesce(?, title) WHERE id=?`, S(steps), e?.name ? S(e.name) : null, ti.id);
  }
  for (const ei of all(`SELECT id, e2e_id FROM e2e_instances WHERE project_id=?`, project.id)) trace.elements[ei.id] = 'e2e:' + ei.e2e_id;
  // Custom elements live only in this project.
  for (const c of bp.custom) { const rid = uuid(); const { id: code, ...rest } = c; insertRecord(rid, 'ProjectCustomElement', project.org_id, project.id, code, { ...rest, code, status: 'Not started', blueprint_ref: 'custom:' + code }, req.user.id); trace.elements[rid] = 'custom:' + c.id; }
  // Rules and controls missing from the Organization are added (origin kept).
  const has = (e, code) => one(`SELECT id FROM records WHERE entity=? AND org_id=? AND json_extract(data,'$.code')=?`, e, project.org_id, code);
  for (const r of bp.rules || []) if (r.code && !has('BusinessRule', r.code)) insertRecord(uuid(), 'BusinessRule', project.org_id, null, r.code, { code: r.code, condition: r.condition, severity: r.severity, owner: r.owner, process_tag: r.step, status: 'Active', origin: r.origin }, req.user.id);
  for (const c of bp.controls || []) if (c.code && !has('Control', c.code)) insertRecord(uuid(), 'Control', project.org_id, null, c.code, { code: c.code, name: c.name, control_type: c.type, frequency: c.frequency, owner: c.owner, origin: c.origin }, req.user.id);
  for (const k of bp.kpis || []) if (k.code && !has('KpiDefinition', k.code)) insertRecord(uuid(), 'KpiDefinition', project.org_id, null, k.code, { code: k.code, name: k.name, target: k.target, formula: k.formula, origin: k.origin }, req.user.id);
  for (const r of bp.risks || []) insertRecord(uuid(), 'RiskOpportunity', project.org_id, project.id, r.code, { code: r.code, title: r.name, kind: 'Risk', category: r.category, likelihood: r.likelihood, impact: r.impact, score: (r.likelihood || 0) * (r.impact || 0), owner: r.owner, status: 'Open', origin: r.origin, blueprint_ref: r.key }, req.user.id);
  // Reporting Plan: each report planned in the project.
  for (const r of bp.reporting || []) insertRecord(uuid(), 'ReportingPlanItem', project.org_id, project.id, r.code || r.key, { name: r.name, audience: r.audience, frequency: r.frequency, format: r.format, owner: r.owner, next_due: nextDue(t, r.frequency), origin: r.origin, blueprint_ref: r.key }, req.user.id);
  const alerts = Object.fromEntries((bp.alerts || []).map(a => [a.code || a.key, a.enabled !== false]));
  run(`UPDATE projects SET template_code=?, template_version=?, blueprint=? WHERE id=?`, trace.template, trace.version, S({ ...trace, alerts }), project.id);
  return trace;
}
const nextDue = (from, f) => { const d = new Date(from); const add = { Weekly: 7, Monthly: 30, Quarterly: 91, 'Semi-annual': 182, Annual: 365 }[f]; if (!add) return null; d.setDate(d.getDate() + add); return d.toISOString().slice(0, 10); };

/** Templates offered at project creation: the Organization's own published templates first, marked (PTC-08). */
export function forCreation(orgId, lang = 'en') {
  return all(`SELECT id, org_id, ref, data, version FROM records WHERE entity='ProjectTemplate' AND (org_id IS NULL OR org_id=?)`, orgId).map(r => ({ r, d: J(r.data, {}) }))
    .filter(x => x.d.status === 'Published')
    .map(({ r, d }) => ({ id: r.id, own: !!r.org_id, code: d.code || r.ref, name: pick(d.name, lang), description: pick(d.description, lang), mode: d.mode, focus: d.focus, vertical_id: d.vertical_id, track: d.track, version: r.version, use_count: d.use_count || 0 }))
    .sort((a, b) => (b.own - a.own) || a.name.localeCompare(b.name));
}
