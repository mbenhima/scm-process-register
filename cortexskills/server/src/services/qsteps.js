// The steps of the scope of work and of the questionnaire campaign work on real data (SRS 1.9, step forms chosen by
// the meaning of the step): the stakeholders typed in MP-53.8 become the Stakeholder records the questionnaire is sent
// to; MP-54.1 creates the project questionnaire from the chosen templates; the RACSI (MP-54.4) and the channels
// (MP-54.5) are written into that questionnaire; the panel steps are complete only when their result exists.
import { all, one, run } from '../db.js';
import { J, S, pick, uuid, now, HttpError } from '../lib/util.js';
import * as cat from '../catalog.js';
import * as Q from './questionnaires.js';
import { insertRecord } from './projects.js';
import { normalizePhone } from './channels.js';
import { sourceList } from './flowcore.js';
import { orgCurrencies } from './money.js';

const today = () => now().slice(0, 10);

/** The questionnaire a project's campaign steps work on: the one created by MP-54.1, else the most recent one. */
export function questionnaireFor(orgId, projectId) {
  if (!projectId) return null;
  const linked = one(`SELECT json_extract(sr.fields,'$.questionnaire_id') q FROM step_records sr WHERE sr.project_id=? AND sr.step_id='MP-54.1' AND json_extract(sr.fields,'$.questionnaire_id') IS NOT NULL ORDER BY sr.updated_at DESC LIMIT 1`, projectId)?.q;
  const id = linked || one(`SELECT id FROM records WHERE entity='Questionnaire' AND org_id=? AND project_id=? AND coalesce(json_extract(data,'$.purpose'),'needs')='needs' ORDER BY created_at DESC LIMIT 1`, orgId, projectId)?.id;
  if (!id) return null;
  try { return Q.getQuestionnaire(orgId, id); } catch { return null; }
}

/** Options of the lists a step field names in `source`, from the Organization's own data. */
export function resolveSources(orgId, fields, { projectId, lang = 'en', user } = {}) {
  const org = one(`SELECT * FROM organizations WHERE id=?`, orgId) || {}; const p = projectId ? one(`SELECT focus, plan_year FROM projects WHERE id=?`, projectId) : null;
  const group = org.group_id ? one(`SELECT name FROM groups_ WHERE id=?`, org.group_id) : null;
  const cache = {};
  const lists = {
    orgs: () => all(`SELECT id, name FROM organizations WHERE id=? OR (group_id IS NOT NULL AND group_id=?) ORDER BY name`, orgId, org.group_id || '-').map(o => ({ value: o.id, label: J(o.name, { en: o.name, fr: o.name, ar: o.name }) })),
    sectors: () => cat.list('verticalSeed').map(v => ({ value: v.id, label: v.name })),
    sites: () => { const s = new Set([org.city].filter(Boolean)); for (const r of all(`SELECT data FROM records WHERE entity='Stakeholder' AND org_id=?`, orgId)) { const x = J(r.data, {}).site; if (x) s.add(String(x)); } return [...s].map(x => ({ value: x, label: { en: x, fr: x, ar: x } })); },
    qtemplates: () => all(`SELECT id, ref, data FROM records WHERE entity='QuestionnaireTemplate' AND (org_id IS NULL OR org_id=?)`, orgId).map(r => ({ id: r.id, ...J(r.data, {}) }))
      .filter(t => t.status !== 'Retired').map(t => ({ value: t.id, label: Object.fromEntries(['en', 'fr', 'ar'].map(l => [l, `${t.code || ''} — ${pick(t.name, l)}`.replace(/^ — /, '')])) })),
    qsections: () => { const q = questionnaireFor(orgId, projectId); const seen = new Map(); for (const fm of q?.forms || []) for (const s of fm.sections || []) if (!seen.has(s.id)) seen.set(s.id, { value: s.id, label: s.title || { en: s.id, fr: s.id, ar: s.id } }); return [...seen.values()]; },
  };
  const subst = v => (typeof v !== 'string' ? v : v === '{today}' ? today() : v === '{me}' ? user?.name || '' : v === '{sector}' ? org.sector || '' : v === '{focus}' ? (p?.focus === 'All' || !p?.focus ? 'All' : p.focus) : v === '{groupName}' ? pick(J(group?.name, group?.name), lang) || '' : v === '{currency}' ? orgCurrencies(orgId).default : v === '{planYear}' ? String(p?.plan_year || new Date().getFullYear() + 1) : v);
  return fields.map(f => {
    const out = { ...f };
    if (f.source && lists[f.source]) out.options = cache[f.source] ||= lists[f.source]();
    // Lists built from the project's records (competencies, positions, sessions, courses, people...).
    else if (f.source) out.options = cache[f.source] ||= sourceList(f.source, orgId, projectId, lang) || [];
    if (f.default != null) out.default = subst(f.default);
    return out;
  });
}

/** Default values of the empty fields of a single form, filled at completion so a shown default is never lost. */
export function withDefaults(fields, values, lang, object) {
  const out = { ...values };
  for (const f of fields) if ((out[f.key] == null || out[f.key] === '') && f.default != null && f.default !== '') out[f.key] = f.default === '{object}' ? pick(object, lang) : f.default;
  return out;
}

/* ------------------------------------------------------------------ MP-53.8 → Stakeholder records */
const POP_OF = { MS: 'Management', MO: 'Management', OP: 'Member' };
/** Every row of the stakeholder step is mirrored in a Stakeholder record of the project (who the questionnaire is sent to). */
export function syncStakeholders(req, t, recId) {
  const rows = all(`SELECT id, data FROM step_rows WHERE step_record_id=?`, recId).map(r => ({ id: r.id, ...J(r.data, {}) }));
  const fns = all(`SELECT id, name FROM obs_nodes WHERE org_id=? AND type='Function'`, req.orgId).map(x => ({ id: x.id, names: Object.values(J(x.name, { en: x.name })).map(v => String(v).toLowerCase()) }));
  const existing = all(`SELECT id, data FROM records WHERE entity='Stakeholder' AND project_id=? AND json_extract(data,'$.source_row_id') IS NOT NULL`, t.project_id).map(r => ({ id: r.id, d: J(r.data, {}) }));
  const keep = new Set();
  for (const r of rows) {
    const name = String(pick(r.item, 'en') || '').trim(); if (!name) continue;
    const fn = fns.find(x => x.names.includes(String(pick(r.function, 'en') || '').toLowerCase()));
    const role = String(pick(r.role, 'en') || '');
    const level = ['MS', 'MO', 'OP'].includes(r.level) ? r.level : String(r.level || '');
    // General management by its title (feminine and masculine), else by decision level (MS and MO: management).
    const population = /direct(eur|rice) génér(al|ale)|general manager|managing director|\bceo\b|\bdg\b|\bpdg\b|المدير العام|المديرة العامة/i.test(role) ? 'DG' : POP_OF[level] || 'Member';
    const data = { name, label: { en: name, fr: name, ar: name }, email: r.email ? String(r.email).trim() : null, phone: r.phone ? String(r.phone).trim() : null, role, role_t: { en: role, fr: role, ar: role },
      function_id: fn?.id || null, function_name: fn ? null : pick(r.function, 'en') || null, decision_level: level, population, site: r.site || null, preferred_channel: r.channel || 'Email', category: r.category || null,
      description: pick(r.description, 'en') || null, owner: pick(r.owner, 'en') || null, source: r.source || null, consent_status: 'Pending', source_row_id: r.id, source_task_id: t.id,
      // Invitations are written in the language the stakeholders were typed in (the user's language), not the platform's.
      language: req.lang || null };
    const ex = existing.find(e => e.d.source_row_id === r.id);
    if (ex) { run(`UPDATE records SET data=?, updated_by=?, updated_at=? WHERE id=?`, S({ ...ex.d, ...data, consent_status: ex.d.consent_status || 'Pending' }), req.user.id, now(), ex.id); keep.add(ex.id); }
    else { const id = uuid(); insertRecord(id, 'Stakeholder', req.orgId, t.project_id, null, data, req.user.id, true); keep.add(id); }
  }
  for (const e of existing) if (!keep.has(e.id) && e.d.source_task_id === t.id && !one(`SELECT 1 x FROM q_invitations WHERE stakeholder_id=?`, e.id)) run(`DELETE FROM records WHERE id=?`, e.id);
  return keep.size;
}

/* ------------------------------------------------------------------ MP-54.1 → the project questionnaire */
export function createQuestionnaire(req, t, fields) {
  const existing = questionnaireFor(req.orgId, t.project_id); if (existing && existing.status !== 'Closed') return existing.id;
  const ids = String(fields.templates || '').split(/\s*[,;|]\s*/).filter(Boolean);
  const templates = ids.map(id => one(`SELECT * FROM records WHERE id=? AND entity='QuestionnaireTemplate' AND (org_id IS NULL OR org_id=?)`, id, req.orgId)).filter(Boolean).map(x => ({ id: x.id, ...J(x.data, {}) }));
  const custom = ids.filter(id => !templates.some(x => x.id === id));
  const forms = templates.length ? Q.formsFromTemplates(templates) : [];
  for (const c of custom) forms.push({ code: 'CUSTOM-' + (forms.length + 1), name: { en: c, fr: c, ar: c }, population: 'Member', sections: [] });
  if (!forms.length) throw new HttpError(422, 'err.required', { field: 'templates' });
  const p = one(`SELECT * FROM projects WHERE id=?`, t.project_id);
  const label = { en: `Questionnaire campaign — ${pick(J(p.name, p.name), 'en')}`, fr: `Campagne de questionnaires — ${pick(J(p.name, p.name), 'fr')}`, ar: `حملة الاستبيانات — ${pick(J(p.name, p.name), 'ar')}` };
  const data = { label, template_id: templates[0]?.id || null, template_ids: templates.map(x => x.id), elaboration_mode: templates.length ? 'Load' : 'Manual', modes: [templates.length ? 'Load' : 'Manual'], ai_generated: false,
    status: 'Draft', due_date: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10), response_count: 0, forms, channel_mode: 'Combination',
    reminders: { Email: { every_days: 3, max: 2 }, WhatsApp: { every_days: 2, max: 2 }, Application: { every_days: 3, max: 1 } }, threshold: 70, owner_id: req.user.id, channels: ['Email', 'WhatsApp', 'Application', 'Face-to-Face'], source_task_id: t.id };
  const id = uuid(); insertRecord(id, 'Questionnaire', req.orgId, p.id, null, data, req.user.id, true);
  Q.event(req.orgId, id, null, 'questionnaire.created', { detail: { templates: templates.map(x => x.code), from: 'MP-54.1' }, userId: req.user.id });
  return id;
}

/* ------------------------------------------------------------------ MP-54.4 / MP-54.5 → the questionnaire */
const LETTERS = ['R', 'A', 'C', 'S', 'I'];
/** RACSI per section from the role rows: each section gets the roles ticked for each letter; exactly one A. */
export function applyRacsi(req, t, rows) {
  const q = questionnaireFor(req.orgId, t.project_id); if (!q) throw new HttpError(409, 'err.noQuestionnaire');
  const sections = [...new Set((q.forms || []).flatMap(f => (f.sections || []).map(s => s.id)))];
  const alloc = sections.map(sid => { const a = { section: sid }; for (const L of LETTERS) a[L] = rows.filter(r => (r[L] === true || r[L] === 'true') && (!String(r.sections || '').trim() || String(r.sections).split(/\s*[,;|]\s*/).includes(sid))).map(r => pick(r.role, 'en')).join(', '); return a; });
  const bad = alloc.filter(a => !a.A || a.A.includes(',')).map(a => a.section);
  if (bad.length) throw new HttpError(422, 'err.racsiOneA', { sections: bad.join(', ') });
  q.racsi_allocation = alloc;
  for (const f of q.forms || []) for (const s of f.sections || []) { const a = alloc.find(x => x.section === s.id); if (a) s.racsi = Object.fromEntries(LETTERS.map(L => [L, a[L]])); }
  Q.saveQuestionnaire(q, req.user.id); return alloc.length;
}
/** Channel rules by decision level: the plan of each respondent (first channel invites, the next ones remind) and the cadence. */
export function applyChannels(req, t, rows) {
  const q = questionnaireFor(req.orgId, t.project_id); if (!q) throw new HttpError(409, 'err.noQuestionnaire');
  q.channel_rules = rows.map(r => ({ level: r.level, population: r.population || null, channels: String(r.channels || '').split(/\s*[,;|]\s*/).filter(ch => Q.CHANNELS.includes(ch)), every: Math.max(1, Number(r.every) || 3), max: Math.max(0, Number(r.max ?? 2)) }));
  for (const rule of q.channel_rules) for (const ch of rule.channels) if (ch !== 'Face-to-Face') q.reminders = { ...(q.reminders || {}), [ch]: { every_days: rule.every, max: rule.max } };
  Q.saveQuestionnaire(q, req.user.id);
  // Respondents already added take the plan of their level.
  for (const inv of Q.listInvitations(req.orgId, q.id).filter(i => i.status === 'Planned')) { const plan = Q.planOf(q, inv.decision_level, inv.population, !!inv.phone); if (plan) run(`UPDATE q_invitations SET channel_plan=?, updated_at=? WHERE id=?`, S(plan), now(), inv.id); }
  return q.channel_rules.length;
}
/* ------------------------------------------------------------------ completion of the panel steps */
/** null when the panel step may be completed, else the error key telling what is still missing. */
export function moduleBlocker(req, t, module, form) {
  if (module === 'document') return one(`SELECT id FROM documents WHERE project_id=? AND doc_type=?`, t.project_id, form.doc) ? null : 'err.stepNeedsDocument';
  const q = questionnaireFor(req.orgId, t.project_id); if (!q) return 'err.noQuestionnaire';
  const items = (q.forms || []).flatMap(f => (f.sections || []).flatMap(s => s.items || []));
  const st = Q.stats(req.orgId, q.id).total;
  switch (module) {
    case 'qdesign': return items.length ? null : 'err.noQuestions';
    case 'qvalidate': return !items.length ? 'err.noQuestions' : items.some(i => i.origin === 'ai' && !i.validated_by) ? 'err.aiUnvalidated' : null;
    case 'qdistribute': return ['Distributed', 'Closed'].includes(q.status) ? null : 'err.notDistributed';
    case 'qremind': return ['Distributed', 'Closed'].includes(q.status) ? null : 'err.notDistributed';
    case 'qresponses': return st.responded > 0 ? null : 'err.noResponses';
    case 'qcomplete': return st.responded > 0 ? null : 'err.noResponses';
    case 'qdataset': return st.included > 0 ? null : 'err.noResponses';
    case 'qfeed': return q.fed_at ? null : 'err.notFed';
    case 'qreport': return one(`SELECT id FROM documents WHERE project_id=? AND doc_type=?`, t.project_id, form.doc) ? null : 'err.stepNeedsDocument';
    default: return null;
  }
}
