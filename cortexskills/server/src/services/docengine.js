// Generated documents engine (FR-DA-DOC-01 – 11, FR-DA-DGC-01 – 13, FR-DA-DCR-01 – 10, FR-DA-DFP-01 – 08).
// A document is generated from a template and the current data of a project. Every data-bound row carries the
// identifier and version of its source record; the sources, their fingerprints and the data date are kept with the
// version (NFR-DA-REL-08), so the document can be checked for staleness and re-generated identically.
import crypto from 'node:crypto';
import { all, one } from '../db.js';
import { J, pick, now } from '../lib/util.js';
import { t } from '../i18n.js';
import * as cat from '../catalog.js';
import * as D from './design.js';
import { entityRegistry, permFor } from '../entities.js';
import { has } from '../rbac.js';
import { describeStep } from './stepforms.js';
import { buildTer } from './documents.js';
import { checkRules } from './training.js';
import { richSource } from './docrich.js';
import { libraryTemplates, DEFAULT_FORMATTING, ALLOWED, CATEGORIES } from './doctemplates.js';

const LBL = {
  id: { en: 'ID', fr: 'ID', ar: 'المعرف' }, source: { en: 'Source', fr: 'Source', ar: 'المصدر' }, task: { en: 'Task', fr: 'Tâche', ar: 'المهمة' }, supplier: { en: 'Supplier', fr: 'Fournisseur', ar: 'المورد' },
  input: { en: 'Input', fr: 'Entrée', ar: 'المدخل' }, activity: { en: 'Activity', fr: 'Activité', ar: 'النشاط' }, output: { en: 'Output', fr: 'Sortie', ar: 'المخرج' }, customer: { en: 'Customer', fr: 'Client', ar: 'المستفيد' },
  responsible: { en: 'Responsible', fr: 'Responsable', ar: 'المسؤول' }, kpi: { en: 'Indicator', fr: 'Indicateur', ar: 'المؤشر' }, formula: { en: 'Formula', fr: 'Formule', ar: 'الصيغة' }, target: { en: 'Target', fr: 'Cible', ar: 'الهدف' },
  latest: { en: 'Latest value', fr: 'Dernière valeur', ar: 'آخر قيمة' }, status: { en: 'Status', fr: 'Statut', ar: 'الحالة' }, risk: { en: 'Risk', fr: 'Risque', ar: 'الخطر' }, category: { en: 'Category', fr: 'Catégorie', ar: 'الفئة' },
  inherent: { en: 'Inherent', fr: 'Inhérent', ar: 'متأصل' }, residual: { en: 'Residual', fr: 'Résiduel', ar: 'متبقي' }, controls: { en: 'Controls', fr: 'Contrôles', ar: 'الضوابط' }, step: { en: 'Step', fr: 'Étape', ar: 'الخطوة' },
  system: { en: 'System step: performed automatically by the platform.', fr: 'Étape système : réalisée automatiquement par la plateforme.', ar: 'خطوة نظام: تنجزها المنصة آلياً.' },
  noRows: { en: 'No row recorded at this step yet.', fr: 'Aucune ligne enregistrée à cette étape pour le moment.', ar: 'لم يسجل أي صف في هذه الخطوة بعد.' },
  training: { en: 'Training', fr: 'Formation', ar: 'التكوين' }, program: { en: 'Program', fr: 'Programme', ar: 'البرنامج' }, level: { en: 'Level', fr: 'Niveau', ar: 'المستوى' }, duration: { en: 'Duration (days)', fr: 'Durée (jours)', ar: 'المدة (أيام)' },
  objectives: { en: 'Objectives', fr: 'Objectifs', ar: 'الأهداف' }, prerequisites: { en: 'Prerequisites', fr: 'Prérequis', ar: 'المتطلبات القبلية' }, halfDay: { en: 'Half-day', fr: 'Demi-journée', ar: 'نصف اليوم' }, item: { en: 'Item', fr: 'Élément', ar: 'العنصر' },
  type: { en: 'Type', fr: 'Type', ar: 'النوع' }, minutes: { en: 'Minutes', fr: 'Minutes', ar: 'الدقائق' }, persona: { en: 'Persona', fr: 'Persona', ar: 'الشخصية' }, fit: { en: 'Fit (behaviour, pain points, hopes)', fr: 'Adéquation (comportement, irritants, attentes)', ar: 'الملاءمة (السلوك والمشاكل والتطلعات)' },
  reference: { en: 'Reference', fr: 'Référence', ar: 'المرجع' }, title: { en: 'Title', fr: 'Titre', ar: 'العنوان' }, version: { en: 'Version', fr: 'Version', ar: 'الإصدار' }, owner: { en: 'Owner', fr: 'Propriétaire', ar: 'المالك' },
  approved: { en: 'Approval date', fr: 'Date d’approbation', ar: 'تاريخ المصادقة' }, review: { en: 'Review frequency', fr: 'Fréquence de revue', ar: 'وتيرة المراجعة' }, nextReview: { en: 'Next review', fr: 'Prochaine revue', ar: 'المراجعة المقبلة' },
  retention: { en: 'Retention', fr: 'Conservation', ar: 'مدة الحفظ' }, classification: { en: 'Classification', fr: 'Classification', ar: 'التصنيف' }, notAllowed: { en: 'Not shown: your role cannot read these records.', fr: 'Non affiché : votre rôle ne permet pas de lire ces enregistrements.', ar: 'غير معروض: لا يسمح دورك بقراءة هذه السجلات.' },
  noData: { en: 'No data yet. Complete step {step} to fill this section.', fr: 'Pas encore de données. Complétez l’étape {step} pour remplir cette section.', ar: 'لا توجد بيانات بعد. أكمل الخطوة {step} لملء هذا القسم.' },
};
const lb = (k, lang, p = {}) => Object.entries(p).reduce((s, [a, b]) => s.replace(`{${a}}`, b), LBL[k]?.[lang] || LBL[k]?.en || k);
const P = (v, lang) => (v && typeof v === 'object' && !Array.isArray(v) ? pick(v, lang) : v);
const fmtVal = (v, lang) => { const x = P(v, lang); if (x == null) return ''; if (Array.isArray(x)) return x.map(y => P(y, lang)).join(', '); if (typeof x === 'object') return ''; if (typeof x === 'boolean') return x ? '✓' : '—'; return String(x); };
const short = id => String(id || '').length > 12 ? String(id).slice(0, 8) : String(id || '');

/* ----------------------------------------------------------------------------------------- templates */
/** Effective templates of an Organization: its own copies replace the library templates with the same code (FR-DA-DOC-08). */
export function templates(orgId) {
  const rows = all(`SELECT id, org_id, data, version, updated_at FROM records WHERE entity='DocumentTemplate' AND (org_id=? OR org_id IS NULL) ORDER BY json_extract(data,'$.code')`, orgId).map(r => ({ id: r.id, org: !!r.org_id, version: r.version, updated_at: r.updated_at, ...J(r.data, {}) }));
  const byCode = new Map(); for (const r of rows) if (!byCode.has(r.code) || r.org) byCode.set(r.code, r);
  return [...byCode.values()].filter(r => r.status !== 'Retired');
}
export function template(orgId, idOrCode) { return templates(orgId).find(x => x.id === idOrCode || x.code === idOrCode) || null; }
export function seedLibrary() { return libraryTemplates(id => cat.get('e2e', id)); }

/* -------------------------------------------------------------------------------------- data sources */
const recs = (entity, orgId, projectId, orgLevel) => all(`SELECT id, ref, data, version, updated_at FROM records WHERE entity=? AND org_id=? AND ${orgLevel ? 'project_id IS NULL' : 'project_id=?'} ORDER BY created_at`, entity, orgId, ...(orgLevel ? [] : [projectId])).map(x => ({ _id: x.id, _ref: x.ref, _v: x.version, _u: x.updated_at, ...J(x.data, {}) }));
/** Most informative columns of an entity: required and text fields first, at most 6 (fine grain — FR-DA-DGC-05). */
function columnsOf(entity, rows) {
  const def = entityRegistry()[entity]; const fields = def?.fields || [];
  const filled = f => rows.some(r => r[f.name] != null && r[f.name] !== '' && !(Array.isArray(r[f.name]) && !r[f.name].length));
  const pickF = fields.filter(f => !['json'].includes(f.type) && !/_id$/.test(f.name) && filled(f)).sort((a, b) => (b.required ? 1 : 0) - (a.required ? 1 : 0)).slice(0, 6);
  return pickF.length ? pickF.map(f => f.name) : Object.keys(rows[0] || {}).filter(k => !k.startsWith('_') && typeof rows[0][k] !== 'object').slice(0, 6);
}
const fieldLabel = (k, lang) => { const v = t('field.' + k, lang); return v === 'field.' + k ? k.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()) : v; };

/**
 * Resolves a named data source to a section body: { table: { columns, rows, trace } } or { diagram } or { subsections }.
 * `ctx` = { req, orgId, projectId, lang, rel }. Returns { body, fingerprint, step, empty }.
 */
export function resolveSource(source, ctx) {
  const { orgId, projectId, lang, rel } = ctx; const [kind, arg] = String(source || '').split(':');
  const fp = rows => crypto.createHash('sha1').update(rows.map(r => `${r._id || r.id}@${r._v || r.version || 0}`).join('|')).digest('hex').slice(0, 16);
  const e2e = arg && D.get(orgId, 'e2e', arg, { releaseId: rel });
  const ufts = e2e ? (e2e.ufts || []).map(id => D.get(orgId, 'uft', id, { releaseId: rel })).filter(Boolean) : [];
  const stepIds = ufts.flatMap(u => u.steps || []);
  switch (kind) {
    case 'bpmn': {
      if (!e2e) return { body: null, empty: true };
      const roles = [...new Set(ufts.map(u => P(u.racsiT?.R, lang) || u.racsi?.R || '—'))];
      return { body: { diagram: { title: `${e2e.id} — ${P(e2e.name, lang)}`, lanes: roles, start: P(e2e.trigger, lang), end: P(e2e.terminal, lang), nodes: ufts.map(u => ({ id: u.id, label: `${u.id} ${P(u.name, lang)}`, lane: roles.indexOf(P(u.racsiT?.R, lang) || u.racsi?.R || '—') })) } }, fingerprint: fp(ufts.map(u => ({ _id: u.id, _v: u._version || 0 }))), step: ufts[0]?.steps?.[0] };
    }
    case 'sipoc': {
      const rows = ufts.map(u => [u.id + ' ' + P(u.name, lang), P(u.supplier, lang), P(u.input, lang), P(u.description, lang), P(u.output, lang), P(u.beneficiary, lang), P(u.racsiT?.R, lang) || u.racsi?.R]);
      return { body: { table: { columns: [lb('task', lang), lb('supplier', lang), lb('input', lang), lb('activity', lang), lb('output', lang), lb('customer', lang), lb('responsible', lang)], rows, trace: ufts.map(u => ({ type: 'design', id: u.id, version: u._version || 0 })) } }, fingerprint: fp(ufts.map(u => ({ _id: u.id, _v: u._version || 0 }))), empty: !rows.length };
    }
    case 'steps': {
      const subs = []; const traced = [];
      for (const u of ufts) {
        const ti = one(`SELECT id, status, output FROM task_instances WHERE project_id=? AND uft_id=?`, projectId, u.id);
        for (const sid of u.steps || []) {
          const s = D.get(orgId, 'step', sid, { releaseId: rel }); if (!s) continue; const form = describeStep(s, {});
          const head = `${sid} — ${P(s.name, lang)}`;
          if (form.kind === 'system') { subs.push({ heading: head, text: lb('system', lang) }); continue; }
          const rec = ti ? one(`SELECT * FROM step_records WHERE task_instance_id=? AND step_id=?`, ti.id, sid) : null;
          if (form.pattern === 'form') {
            const fv = J(rec?.fields, {}); if (!Object.keys(fv).length) { subs.push({ heading: head, text: lb('noRows', lang), notice: true, step: sid }); continue; }
            subs.push({ heading: head, kv: form.fields.map(f => [P(f.label, lang), fmtVal(fv[f.key], lang)]).filter(x => x[1]) }); traced.push({ _id: rec.id, _v: rec.updated_at });
          } else {
            const rows = rec ? all(`SELECT id, data, updated_at FROM step_rows WHERE step_record_id=? ORDER BY sort`, rec.id) : [];
            if (!rows.length) { subs.push({ heading: head, text: lb('noRows', lang), notice: true, step: sid }); continue; }
            const cols = form.fields.filter(f => rows.some(r => fmtVal(J(r.data, {})[f.key], lang)));
            subs.push({ heading: head, table: { columns: [...cols.map(f => P(f.label, lang)), lb('source', lang)], rows: rows.map(r => { const d = J(r.data, {}); return [...cols.map(f => fmtVal(d[f.key], lang)), `${sid} · ${short(r.id)}`]; }), trace: rows.map(r => ({ type: 'row', id: r.id, version: r.updated_at })) } });
            traced.push(...rows.map(r => ({ _id: r.id, _v: r.updated_at })));
          }
        }
        if (ti?.output) { const o = P(J(ti.output, ti.output), lang); if (o) subs.push({ heading: `${u.id} — ${P(u.name, lang)}`, text: o, small: true }); }
      }
      return { body: { subsections: subs }, fingerprint: fp(traced), empty: !traced.length, step: stepIds[0] };
    }
    case 'records': {
      const [entity, scope] = arg.split('@'); const def = entityRegistry()[entity]; if (!def) return { body: null, empty: true };
      if (ctx.req && !has(ctx.req, permFor(def, false)) && !has(ctx.req, 'reports.export')) return { body: { text: lb('notAllowed', lang), notice: true }, denied: true, title: t('entity.' + entity, lang) };
      const rows = recs(entity, orgId, projectId, scope === 'org').slice(0, 300); const cols = columnsOf(entity, rows);
      const title = t('entity.' + entity, lang) === 'entity.' + entity ? entity.replace(/([a-z])([A-Z])/g, '$1 $2') : t('entity.' + entity, lang);
      const step = (def.mps || []).map(m => D.list(orgId, 'step').find(s => s.mp === m)?.id).find(Boolean);
      if (!rows.length) return { body: { text: lb('noData', lang, { step: step || def.mps?.[0] || '—' }), notice: true }, empty: true, title, fingerprint: 'empty', step };
      return { body: { table: { columns: [lb('id', lang), ...cols.map(c => fieldLabel(c, lang)), lb('version', lang)], rows: rows.map(r => [r._ref || r.code || short(r._id), ...cols.map(c => fmtVal(r[c], lang)), String(r._v || 1)]), trace: rows.map(r => ({ type: 'record', entity, id: r._id, version: r._v })) } }, fingerprint: fp(rows), title, step };
    }
    case 'kpis': {
      const ks = cat.list('kpi').filter(k => (e2e?.mps || []).includes(k.mp)); const vals = Object.fromEntries(all(`SELECT kpi_id, value, target, status, period FROM kpi_values WHERE project_id=? ORDER BY period`, projectId).map(v => [v.kpi_id, v]));
      if (!ks.length) return { body: { text: lb('noData', lang, { step: e2e?.mps?.[0] || '—' }), notice: true }, empty: true };
      return { body: { table: { columns: [lb('id', lang), lb('kpi', lang), lb('formula', lang), lb('target', lang), lb('latest', lang), lb('status', lang)], rows: ks.map(k => [k.id, P(k.name, lang), P(k.formula, lang), P(k.target, lang), vals[k.id] ? `${vals[k.id].value} (${vals[k.id].period})` : '—', vals[k.id]?.status ? t('status.' + vals[k.id].status, lang) : '—']), trace: ks.map(k => ({ type: 'kpi', id: k.id })) } }, fingerprint: fp(ks.map(k => ({ _id: k.id, _v: vals[k.id]?.period || 0 }))) };
    }
    case 'risks': {
      const ctl = cat.list('control').filter(c => String(c.steps || '').split(/[;,]\s*/).some(s => stepIds.includes(s))); const ids = new Set(ctl.map(c => c.id));
      const rs = cat.list('risk').filter(r => String(r.controls || '').split(/[;,]\s*/).some(c => ids.has(c)));
      const rows = [...rs.map(r => [r.id, P(r.name, lang), P(r.category, lang), String(r.inherent), String(r.residual), r.controls]), ...ctl.filter(c => !rs.some(r => String(r.controls).includes(c.id))).map(c => [c.id, P(c.name, lang), c.coso || '', '', '', c.effectiveness || ''])];
      if (!rows.length) return { body: { text: lb('noData', lang, { step: stepIds[0] || '—' }), notice: true }, empty: true };
      return { body: { table: { columns: [lb('id', lang), lb('risk', lang), lb('category', lang), lb('inherent', lang), lb('residual', lang), lb('controls', lang)], rows, trace: [...rs.map(r => ({ type: 'risk', id: r.id })), ...ctl.map(c => ({ type: 'control', id: c.id }))] } }, fingerprint: fp(rows.map(r => ({ _id: r[0] }))) };
    }
    case 'racsi': {
      const rows = ufts.map(u => [u.id + ' ' + P(u.name, lang), ...['R', 'A', 'C', 'S', 'I'].map(k => P(u.racsiT?.[k], lang) || u.racsi?.[k] || '—')]);
      return { body: { table: { columns: [lb('task', lang), 'R', 'A', 'C', 'S', 'I'], rows, trace: ufts.map(u => ({ type: 'design', id: u.id })) } }, fingerprint: fp(ufts.map(u => ({ _id: u.id, _v: u._version || 0 }))), empty: !rows.length };
    }
    case 'trainingPlan': case 'trainingAgenda': case 'trainingPersonas': {
      const courses = recs('TrainingCourse', orgId, projectId); const progs = Object.fromEntries(recs('TrainingProgram', orgId, projectId).map(p => [p._id, p])); const personas = Object.fromEntries(recs('Persona', orgId, null, true).map(p => [p._id, p]));
      if (!courses.length) return { body: { text: lb('noData', lang, { step: 'MP-49' }), notice: true }, empty: true };
      if (kind === 'trainingPlan') return { body: { table: { columns: [lb('program', lang), lb('id', lang), lb('training', lang), lb('level', lang), lb('duration', lang), lb('objectives', lang), lb('prerequisites', lang)], rows: courses.map(c => [fmtVal(progs[c.program_id]?.code, lang), c.training_code, fmtVal(c.name, lang), fmtVal(c.level, lang), String(c.duration_days ?? ''), (c.objectives || []).map(o => fmtVal(o, lang)).join('\n'), fmtVal(c.prerequisites, lang)]), trace: courses.map(c => ({ type: 'record', entity: 'TrainingCourse', id: c._id, version: c._v })) } }, fingerprint: fp(courses) };
      if (kind === 'trainingAgenda') { const rows = []; const trace = []; for (const c of courses) for (const h of c.agenda || []) for (const it of h.items || []) { rows.push([c.training_code, fmtVal(h.label, lang) || String(h.half_day), fmtVal(it.type, lang), fmtVal(it.title, lang), String(it.minutes ?? '')]); trace.push({ type: 'record', entity: 'TrainingCourse', id: c._id, version: c._v }); }
        return { body: { table: { columns: [lb('id', lang), lb('halfDay', lang), lb('type', lang), lb('item', lang), lb('minutes', lang)], rows, trace } }, fingerprint: fp(courses) }; }
      const rows = []; const trace = []; for (const c of courses) for (const pf of c.personas || []) { rows.push([c.training_code, fmtVal(personas[pf.persona_id]?.name || pf.persona || pf.code, lang), [fmtVal(pf.behaviour, lang), fmtVal(pf.pain_points, lang), fmtVal(pf.hopes, lang)].filter(Boolean).join(' · ')]); trace.push({ type: 'record', entity: 'TrainingCourse', id: c._id, version: c._v }); }
      return { body: { table: { columns: [lb('id', lang), lb('persona', lang), lb('fit', lang)], rows, trace } }, fingerprint: fp(courses) };
    }
    case 'masterList': {
      const docs = all(`SELECT d.*, u.name owner_name FROM documents d LEFT JOIN users u ON u.id=coalesce(d.owner_id, d.author_id) WHERE d.org_id=? AND (d.project_id=? OR d.project_id IS NULL) AND d.status IN ('Published','In Review','Draft') ORDER BY d.doc_type, d.version DESC`, orgId, projectId);
      const latest = []; const seen = new Set(); for (const d of docs) if (!seen.has(d.doc_type + d.lang)) { seen.add(d.doc_type + d.lang); latest.push(d); }
      return { body: { table: { columns: [lb('reference', lang), lb('title', lang), lb('version', lang), lb('status', lang), lb('owner', lang), lb('approved', lang), lb('review', lang), lb('nextReview', lang), lb('retention', lang), lb('classification', lang)],
        rows: latest.map(d => [`${d.doc_type}-${String(d.id).slice(0, 4).toUpperCase()}`, d.title, `${d.version}${d.minor ? '.' + d.minor : ''}`, t('status.' + d.status, lang), d.owner_name || '—', d.published_at ? d.published_at.slice(0, 10) : '—', d.review_frequency || '—', d.next_review || '—', d.retention || '—', d.classification || t('ter.confidential', lang)]), trace: latest.map(d => ({ type: 'document', id: d.id, version: d.version })) } }, fingerprint: fp(latest.map(d => ({ _id: d.id, _v: d.version }))) };
    }
    case 'register': {
      const rows = all(`SELECT id, data, version FROM register_entries WHERE org_id=? AND project_id=? AND register=?`, orgId, projectId, arg).map(r => ({ _id: r.id, _v: r.version, ...J(r.data, {}) }));
      if (!rows.length) return { body: { text: lb('noData', lang, { step: '—' }), notice: true }, empty: true };
      const cols = Object.keys(rows[0]).filter(k => !k.startsWith('_')).slice(0, 6);
      return { body: { table: { columns: [...cols.map(c => fieldLabel(c, lang)), lb('version', lang)], rows: rows.map(r => [...cols.map(c => fmtVal(r[c], lang)), String(r._v)]), trace: rows.map(r => ({ type: 'register', id: r._id, version: r._v })) } }, fingerprint: fp(rows) };
    }
    default: return richSource(kind, arg, ctx) || { body: null, empty: true };
  }
}

/* ------------------------------------------------------------------------------------------ generation */
const fill = (s, vars) => String(s || '').replace(/\{\{(\w+)\}\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
export function varsOf(orgId, projectId, lang) {
  const org = one(`SELECT name FROM organizations WHERE id=?`, orgId); const p = projectId ? one(`SELECT name, plan_year, focus FROM projects WHERE id=?`, projectId) : null;
  return { org: P(J(org?.name, org?.name), lang), project: P(J(p?.name, p?.name), lang) || '', year: p?.plan_year || new Date().getFullYear(), focus: p?.focus || '', date: new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-MA' : 'en-GB') };
}
/** Merges formatting: template values over the Organization layout over the defaults; values checked against allowed lists (NFR-DA-SEC-20). */
export function effectiveFormatting(orgId, tpl, own = {}) {
  const layout = J(one(`SELECT data FROM records WHERE entity='DocumentLayout' AND org_id=? ORDER BY updated_at DESC LIMIT 1`, orgId)?.data, {});
  const variant = layout.variants?.[tpl?.category] || {};
  const out = { ...DEFAULT_FORMATTING }; for (const src of [layout, variant, tpl?.formatting || {}, own]) for (const [k, v] of Object.entries(src || {})) if (v !== '' && v != null && k in DEFAULT_FORMATTING) out[k] = v;
  out.logoAsset = own.logoAsset || tpl?.formatting?.logoAsset || layout.logoAsset || null; out.header = own.header || tpl?.formatting?.header || layout.header || ''; out.footer = own.footer || tpl?.formatting?.footer || layout.footer || '';
  return sanitizeFormatting(out);
}
export function sanitizeFormatting(f) {
  const out = { ...f };
  if (!ALLOWED.fonts.includes(out.bodyFont)) out.bodyFont = DEFAULT_FORMATTING.bodyFont; if (!ALLOWED.fonts.includes(out.headingFont)) out.headingFont = DEFAULT_FORMATTING.headingFont;
  for (const k of ['bodySize', 'h1Size', 'h2Size', 'h3Size']) if (!ALLOWED.sizes.includes(Number(out[k]))) out[k] = DEFAULT_FORMATTING[k];
  if (!ALLOWED.align.includes(out.align)) out.align = DEFAULT_FORMATTING.align; if (!ALLOWED.orientation.includes(out.orientation)) out.orientation = 'portrait'; if (!ALLOWED.paper.includes(out.paper)) out.paper = 'A4';
  for (const k of ['headingColor', 'h2Color', 'tableHeader']) if (!ALLOWED.colors.includes(String(out[k]).replace('#', '').toUpperCase())) out[k] = DEFAULT_FORMATTING[k];
  if (!ALLOWED.logo.includes(out.logo)) out.logo = 'organization'; if (!ALLOWED.logoPosition.includes(out.logoPosition)) out.logoPosition = 'top-left';
  if (!ALLOWED.margins.includes(Number(out.margins))) out.margins = DEFAULT_FORMATTING.margins; out.header = String(out.header || '').slice(0, 200); out.footer = String(out.footer || '').slice(0, 200);
  return out;
}
const sectionPerms = { ter: 'reports.view', audit: 'audits.view' };

/**
 * Generates the model of a document from its section definitions (the template's or a draft's own, FR-DA-DFP-07).
 * Manual sections and Section Overrides are kept (FR-DA-DCR-05, -06).
 */
export function generate(ctx, { tpl, sections, overrides = {}, meta = {} }) {
  const { orgId, projectId, lang } = ctx; const vars = varsOf(orgId, projectId, lang);
  const out = []; const sources = []; const findings = [];
  const defs = sections || tpl.sections;
  for (const s of defs) {
    if (s.hidden) continue;
    const title = s.title ? fill(P(s.title, lang), vars) : null; const ov = overrides[s.id] || {};
    const base = { id: s.id, type: s.type, heading: ov.title || title, formatting: s.formatting || {}, source: s.source || null };
    if (s.type === 'text') { out.push({ ...base, text: ov.text ?? fill(P(s.text, lang), vars), overridden: ov.text != null }); continue; }
    if (s.type === 'picture') { out.push({ ...base, picture: s.picture || null }); continue; }
    if (s.type === 'approval') { out.push({ ...base, approval: true }); continue; }
    if (s.type === 'kv') { out.push({ ...base, kv: (s.kv || []).map(([k, v]) => [P(k, lang), fill(P(v, lang), vars)]) }); continue; }
    if (s.type === 'builtin' && s.source === 'ter') {
      const ter = buildTer(orgId, projectId, lang, meta); for (const x of ter.model.sections) out.push({ id: 'ter-' + out.length, type: x.table ? 'table' : 'text', heading: x.heading, text: x.text, table: x.table, builtin: true });
      sources.push(...(ter.sources || []).map(x => ({ name: x.source, records: x.records, latest: x.latest, step: x.step }))); findings.push(...(ter.findings || [])); continue;
    }
    if (s.type === 'builtin' && s.source === 'audit') { const a = auditSections(orgId, projectId, lang); out.push(...a.sections); sources.push(...a.sources); continue; }
    const r = resolveSource(s.source, ctx);
    sources.push({ name: s.source, fingerprint: r.fingerprint || null, records: r.body?.table?.rows?.length ?? r.body?.subsections?.length ?? 0, step: r.step || null });
    const heading = ov.title || title || r.title || s.source;
    if (r.denied) { out.push({ ...base, heading, text: r.body.text, notice: true }); continue; }
    if (!r.body) { out.push({ ...base, heading, text: lb('noData', lang, { step: r.step || '—' }), notice: true }); findings.push({ code: 'missingData', location: heading, blocking: false, step: r.step }); continue; }
    if (r.body.notice) findings.push({ code: 'missingData', location: heading, blocking: false, step: r.step });
    const table = r.body.table ? applyCellOverrides(r.body.table, ov.cells) : null;
    out.push({ ...base, heading, text: ov.text ?? (s.text ? fill(P(s.text, lang), vars) : r.body.text), notice: r.body.notice, table, diagram: r.body.diagram, subsections: r.body.subsections, kv: r.body.kv, overridden: ov.text != null || !!(ov.cells && Object.keys(ov.cells).length) });
  }
  findings.push(...consistency(orgId, projectId, out, lang));
  const fpAll = crypto.createHash('sha1').update(sources.map(s => s.name + ':' + (s.fingerprint || s.records)).join('|')).digest('hex').slice(0, 16);
  return { title: fill(P(tpl.name, lang), vars) + (vars.org ? ` — ${vars.org}` : ''), lang, code: tpl.code, category: tpl.category, sections: out, sources, findings, fingerprint: fpAll, dataAsOf: now(), vars, profile: tpl.profile || {} };
}
function applyCellOverrides(table, cells) {
  if (!cells) return table; const rows = table.rows.map((r, i) => r.map((v, j) => { const k = `${table.trace?.[i]?.id || i}|${j}`; return cells[k] != null ? cells[k] : v; }));
  return { ...table, rows, overridden: Object.keys(cells) };
}
/** Consistency Checks before review and publication (FR-DA-DGC-07, -08). */
export function consistency(orgId, projectId, sections, lang) {
  const out = [];
  for (const s of sections) {
    const tr = s.table?.trace || [];
    for (const x of tr) if (x.type === 'record' && !one(`SELECT id FROM records WHERE id=?`, x.id)) out.push({ code: 'refMissing', location: s.heading, blocking: true, ref: x.id });
    const ids = tr.map(x => x.id).filter(Boolean); const dup = ids.find((v, i) => ids.indexOf(v) !== i && tr[i].type !== 'record' && tr[i].type !== 'design');
    if (dup && !s.source?.startsWith('training')) out.push({ code: 'duplicateId', location: s.heading, blocking: false, ref: dup });
  }
  // Totals agree with their rows: budget lines versus the plan's total budget.
  if (projectId) {
    const plan = one(`SELECT data FROM records WHERE entity='TrainingPlan' AND project_id=?`, projectId); const total = Number(J(plan?.data, {}).total_budget || 0);
    const lines = all(`SELECT data FROM records WHERE entity='BudgetLine' AND project_id=?`, projectId).reduce((s, r) => s + Number(J(r.data, {}).allocated_amount || J(r.data, {}).amount || 0), 0);
    if (total && lines && Math.abs(total - lines) / total > 0.01 && sections.some(s => /BudgetLine|ter/.test(s.source || '') || s.builtin)) out.push({ code: 'budgetTotal', location: 'BudgetLine', blocking: false, total, lines });
    const bad = all(`SELECT data FROM records WHERE entity='TrainingCourse' AND project_id=?`, projectId).map(r => J(r.data, {})).filter(c => !checkRules(c).ok);
    if (bad.length && sections.some(s => /training|ter/i.test(s.source || '') || s.builtin)) out.push({ code: 'goldenRules', location: bad.map(c => c.training_code).join(', '), blocking: true, n: bad.length });
  }
  return out;
}
/** Staleness: which sources changed since the version was generated, and the items behind the change (FR-DA-DGC-09). */
export function staleness(ctx, doc) {
  const model = J(doc.model, {}); const tpl = template(ctx.orgId, doc.template_id || doc.doc_type); if (!tpl) return { stale: false, changed: [] };
  const changed = [];
  for (const s of J(doc.sources, [])) { if (!s.fingerprint || s.name === 'ter') continue; const r = resolveSource(s.name, ctx); if (r.fingerprint && r.fingerprint !== s.fingerprint) changed.push({ source: s.name, before: s.records, after: r.body?.table?.rows?.length ?? r.body?.subsections?.length ?? 0 }); }
  return { stale: changed.length > 0, changed, affectedDocuments: changed.length ? impact(ctx.orgId, model.sections?.flatMap(x => (x.table?.trace || []).map(y => y.id)) || []).filter(d => d.id !== doc.id) : [] };
}
/** Documents that show any of the given items (FR-DA-DGC-10). */
export function impact(orgId, ids) {
  if (!ids.length) return []; const set = new Set(ids.filter(Boolean)); if (!set.size) return [];
  return all(`SELECT id, doc_type, version, status, title, model FROM documents WHERE org_id=? AND status IN ('Draft','In Review','Published')`, orgId)
    .filter(d => (J(d.model, {}).sections || []).some(s => (s.table?.trace || []).some(x => set.has(x.id)))).map(d => ({ id: d.id, doc_type: d.doc_type, version: d.version, status: d.status, title: d.title }));
}
/** Differences between two rendered models, section by section (FR-DA-DCR-02, -06). */
export function diff(a, b) {
  const map = m => Object.fromEntries((m.sections || []).map(s => [s.id + '|' + (s.heading || ''), s]));
  const A = map(a), B = map(b); const keys = [...new Set([...Object.keys(A), ...Object.keys(B)])];
  return keys.map(k => { const x = A[k], y = B[k]; if (!x) return { section: y.heading, change: 'added' }; if (!y) return { section: x.heading, change: 'removed' };
    const ra = (x.table?.rows || []).map(r => r.join('¦')), rb = (y.table?.rows || []).map(r => r.join('¦'));
    const added = rb.filter(r => !ra.includes(r)).length, removed = ra.filter(r => !rb.includes(r)).length; const text = (x.text || '') !== (y.text || '');
    return added || removed || text ? { section: y.heading, change: 'changed', rowsAdded: added, rowsRemoved: removed, textChanged: text } : null; }).filter(Boolean);
}
/** Audit report sections from the audit programme, findings and nonconformities (FR-DA-AFP-05). */
export function auditSections(orgId, projectId, lang) {
  const audits = all(`SELECT id, data, version FROM records WHERE entity='AuditProgram' AND org_id=? AND (project_id=? OR project_id IS NULL)`, orgId, projectId).map(r => ({ _id: r.id, _v: r.version, ...J(r.data, {}) }));
  const findings = all(`SELECT id, data, version FROM records WHERE entity='AuditFinding' AND org_id=? AND (project_id=? OR project_id IS NULL)`, orgId, projectId).map(r => ({ _id: r.id, _v: r.version, ...J(r.data, {}) }));
  const T = k => t('audit.' + k, lang); const s = [];
  if (!audits.length) return { sections: [{ id: 'a0', type: 'text', heading: T('summary'), text: lb('noData', lang, { step: 'MP-18' }), notice: true }], sources: [{ name: 'AuditProgram', records: 0 }] };
  for (const a of audits) {
    const fs = findings.filter(f => f.audit_id === a._id);
    s.push({ id: 'sum' + a._id, type: 'kv', heading: `${T('summary')} — ${fmtVal(a.name, lang)}`, kv: [[T('objectives'), fmtVal(a.objectives, lang)], [T('criteria'), fmtVal(a.criteria, lang)], [T('scope'), fmtVal(a.scope, lang)], [T('processes'), fmtVal(a.processes, lang)], [T('dates'), `${a.planned_date || ''} → ${a.performed_date || ''}${a.next_date ? ' · ' + a.next_date : ''}`], [T('lead'), fmtVal(a.lead_auditor, lang)], [T('team'), (Array.isArray(a.team) ? a.team.map(m => `${m.name}${m.qualification ? ' (' + m.qualification + ')' : ''}`).join(', ') : fmtVal(a.team, lang))], [T('frequency'), a.frequency === 'Custom' ? fmtVal(a.frequency_custom, lang) : t('freq.' + a.frequency, lang)], [T('justification'), fmtVal(a.frequency_justification, lang)]] });
    s.push({ id: 'str' + a._id, type: 'text', heading: T('strengths'), text: fmtVal(a.strengths, lang) || '—' });
    const grades = ['Major', 'Minor', 'Observation', 'Improvement', 'Strength'];
    s.push({ id: 'byg' + a._id, type: 'table', heading: T('byGrade'), table: { columns: [T('grade'), T('count')], rows: grades.map(g => [t('grade.' + g, lang), String(fs.filter(f => f.grade === g).length)]), trace: [] } });
    s.push({ id: 'fnd' + a._id, type: 'table', heading: T('findings'), table: { columns: [lb('id', lang), T('grade'), T('requirement'), T('statement'), T('process')], rows: fs.map(f => [f.code || short(f._id), t('grade.' + f.grade, lang), `${fmtVal(f.requirement, lang)} ${f.clause || ''}`, fmtVal(f.statement, lang), fmtVal(f.process, lang)]), trace: fs.map(f => ({ type: 'record', entity: 'AuditFinding', id: f._id, version: f._v })) } });
    for (const nc of fs.filter(f => f.grade === 'Major' || f.grade === 'Minor')) s.push({ id: 'nc' + nc._id, type: 'kv', heading: `${T('ncSheet')} ${nc.code || ''}`, kv: [[T('requirement'), `${fmtVal(nc.requirement, lang)} ${nc.clause || ''}`], [T('statement'), fmtVal(nc.statement, lang)], [T('evidence'), fmtVal(nc.evidence, lang)], [T('process'), fmtVal(nc.process, lang)], [T('auditee'), fmtVal(nc.auditee, lang)], [T('rootCause'), fmtVal(nc.root_cause, lang)], [T('correction'), fmtVal(nc.correction, lang)], [T('corrective'), fmtVal(nc.corrective_action, lang)], [T('ncOwner'), fmtVal(nc.action_owner, lang)], [T('due'), nc.due || ''], [T('effectiveness'), fmtVal(nc.effectiveness, lang)]] });
    s.push({ id: 'con' + a._id, type: 'text', heading: T('conclusion'), text: fmtVal(a.conclusion, lang) || '—' });
    s.push({ id: 'fol' + a._id, type: 'text', heading: T('followUp'), text: fmtVal(a.follow_up, lang) || '—' });
  }
  return { sections: s, sources: [{ name: 'AuditProgram', records: audits.length }, { name: 'AuditFinding', records: findings.length }] };
}
export { CATEGORIES, ALLOWED, DEFAULT_FORMATTING };
