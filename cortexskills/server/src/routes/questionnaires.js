// Questionnaire & Survey Management API (Section 4.36) and questionnaire channels (FR-DA-COMM-06..08).
import { Router } from 'express';
import { ah, projectOf } from '../lib/http.js';
import { all, one, run } from '../db.js';
import { uuid, now, J, S, pick, HttpError, addDays } from '../lib/util.js';
import { requirePerm, has } from '../rbac.js';
import { audit } from '../audit.js';
import { t } from '../i18n.js';
import { config } from '../config.js';
import { insertRecord } from '../services/projects.js';
import { logUsage, effectiveActive, useCaseByCode } from '../services/ai.js';
import { exportModel, MIME } from '../services/exporters.js';
import * as Q from '../services/questionnaires.js';
import * as CH from '../services/channels.js';

const r = Router();
const base = req => config.publicUrl || req.get('origin') || `${req.protocol}://${req.get('host')}`;
const lang = req => req.lang || 'en';

// ------------------------------------------------------------------ template library (FR-DA-TPL-06..09, QLT-01)
const tplOut = x => ({ id: x.id, org_id: x.org_id, library: !x.org_id, version: x.version, ...J(x.data, {}) });
r.get('/questionnaire-templates', requirePerm('m54.view'), ah(req => all(`SELECT * FROM records WHERE entity='QuestionnaireTemplate' AND (org_id IS NULL OR org_id=?) ORDER BY org_id IS NOT NULL, created_at`, req.orgId)
  .map(tplOut).map(x => ({ ...x, sections: undefined, sections_count: (x.sections || []).length, questions: (x.sections || []).reduce((n, s) => n + (s.items || s.fields || s.rows || s.boxes || s.columns || []).length, 0) }))));
r.get('/questionnaire-templates/:id', requirePerm('m54.view'), ah(req => {
  const x = one(`SELECT * FROM records WHERE id=? AND entity='QuestionnaireTemplate' AND (org_id IS NULL OR org_id=?)`, req.params.id, req.orgId); if (!x) throw new HttpError(404, 'err.notFound');
  return tplOut(x);
}));
/** Organization-authored template, or a copy of a library template that the Organization adapts (FR-DA-TPL-07). */
r.post('/questionnaire-templates', requirePerm('m54.manage'), ah(req => {
  const b = req.body || {}; let data;
  if (b.copy_of) {
    const src = one(`SELECT * FROM records WHERE id=? AND entity='QuestionnaireTemplate' AND (org_id IS NULL OR org_id=?)`, b.copy_of, req.orgId); if (!src) throw new HttpError(404, 'err.notFound');
    const d = J(src.data, {}); data = { ...d, code: (d.code || 'QT') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(), name: b.name ? { en: b.name, fr: b.name, ar: b.name } : d.name, copied_from: { id: src.id, version: src.version }, version_no: 1 };
  } else {
    if (!String(b.name || '').trim()) throw new HttpError(422, 'err.required', { field: 'name' });
    data = { code: 'QT-' + Math.random().toString(36).slice(2, 8).toUpperCase(), name: { en: b.name, fr: b.name, ar: b.name }, focus: b.focus || 'All', sector: b.sector || null, language: b.language || lang(req), population: b.population || 'Member', version_no: 1, owner_role: 'Head of L&D',
      sections: [{ id: 'identity', type: 'identity', feeds: 'respondent', title: { en: 'Respondent', fr: 'Participant', ar: 'المشارك' }, fields: [{ key: 'full_name', label: { en: 'Full name', fr: 'Nom complet', ar: 'الاسم الكامل' } }, { key: 'position', label: { en: 'Position', fr: 'Position', ar: 'المنصب' } }] }] };
  }
  data.sections_count = (data.sections || []).length;
  const id = uuid(); insertRecord(id, 'QuestionnaireTemplate', req.orgId, null, data.code, data, req.user.id, true);
  audit(req, 'QuestionnaireTemplate', id, 'create', null, { code: data.code, copied_from: data.copied_from || null });
  return tplOut(one(`SELECT * FROM records WHERE id=?`, id));
}));
r.put('/questionnaire-templates/:id', requirePerm('m54.manage'), ah(req => {
  const x = one(`SELECT * FROM records WHERE id=? AND entity='QuestionnaireTemplate' AND org_id=?`, req.params.id, req.orgId); if (!x) throw new HttpError(404, 'err.notFound'); // library entries are copied, not edited
  const d = J(x.data, {}); const b = req.body || {};
  const next = { ...d, ...(b.name ? { name: typeof b.name === 'object' ? b.name : { ...d.name, [lang(req)]: b.name } } : {}), ...(b.sections ? { sections: sanitizeSections(b.sections) } : {}), ...(b.population ? { population: b.population } : {}), ...(b.focus ? { focus: b.focus } : {}), version_no: (d.version_no || 1) + 1 };
  next.sections_count = (next.sections || []).length;
  run(`UPDATE records SET data=?, version=version+1, updated_by=?, updated_at=? WHERE id=?`, S(next), req.user.id, now(), x.id);
  run(`INSERT INTO entity_versions(id,entity,record_id,org_id,version,data,user_id,justification,is_current,created_at) VALUES(?,?,?,?,?,?,?,?,1,?)`, uuid(), 'QuestionnaireTemplate', x.id, req.orgId, x.version + 1, S(next), req.user.id, b._justification || null, now());
  audit(req, 'QuestionnaireTemplate', x.id, 'update', { version_no: d.version_no }, { version_no: next.version_no }, b._justification);
  return tplOut(one(`SELECT * FROM records WHERE id=?`, x.id));
}));
r.delete('/questionnaire-templates/:id', requirePerm('m54.manage'), ah(req => {
  const x = one(`SELECT * FROM records WHERE id=? AND entity='QuestionnaireTemplate' AND org_id=?`, req.params.id, req.orgId); if (!x) throw new HttpError(404, 'err.notFound');
  const used = all(`SELECT data FROM records WHERE entity='Questionnaire' AND org_id=?`, req.orgId).some(q => (J(q.data, {}).forms || []).some(f => f.template_id === x.id));
  if (used) throw new HttpError(409, 'err.templateInUse');
  run(`DELETE FROM records WHERE id=?`, x.id); audit(req, 'QuestionnaireTemplate', x.id, 'delete', J(x.data), null); return { ok: true };
}));
/** Export a template as JSON for re-import (FR-DA-TPL-09). */
r.get('/questionnaire-templates/:id/export', requirePerm('m54.view'), ah((req, res) => {
  const x = one(`SELECT * FROM records WHERE id=? AND entity='QuestionnaireTemplate' AND (org_id IS NULL OR org_id=?)`, req.params.id, req.orgId); if (!x) throw new HttpError(404, 'err.notFound');
  const d = J(x.data, {});
  res.set('Content-Disposition', `attachment; filename="${d.code || 'template'}.json"`).type('application/json').send(JSON.stringify({ format: 'cortexskills.questionnaireTemplate', version: 1, template: d }, null, 2));
}));
r.post('/questionnaire-templates/import', requirePerm('m54.manage'), ah(req => {
  const d = req.body?.template; if (!d || !Array.isArray(d.sections)) throw new HttpError(422, 'err.invalidFile');
  const data = { ...d, sections: sanitizeSections(d.sections), code: (d.code || 'QT') + '-IMP', version_no: 1, sections_count: d.sections.length };
  const id = uuid(); insertRecord(id, 'QuestionnaireTemplate', req.orgId, null, data.code, data, req.user.id, true); audit(req, 'QuestionnaireTemplate', id, 'import', null, { code: data.code });
  return tplOut(one(`SELECT * FROM records WHERE id=?`, id));
}));
const TYPES = ['note', 'identity', 'table', 'grid', 'questions', 'rating', 'swot', 'yesno'];
function sanitizeSections(list) {
  if (!Array.isArray(list)) throw new HttpError(422, 'err.invalidFile');
  const ids = new Set();
  return list.map((s, i) => {
    if (!TYPES.includes(s.type)) throw new HttpError(422, 'err.invalidOption', { field: 'type', value: s.type });
    let id = String(s.id || `s${i + 1}`).replace(/[^a-z0-9_]/gi, '_'); while (ids.has(id)) id += '_'; ids.add(id);
    const keyed = arr => (arr || []).map((x, k) => ({ ...x, key: String(x.key || `k${k + 1}`).replace(/[^a-z0-9_]/gi, '_') }));
    return { ...s, id, fields: s.fields && keyed(s.fields), items: s.items && keyed(s.items), rows: s.rows && keyed(s.rows), columns: s.columns && keyed(s.columns), boxes: s.boxes && keyed(s.boxes) };
  });
}

// ------------------------------------------------------------------ questionnaires of a project
function listFor(req, projectId) {
  return all(`SELECT id, project_id, data, created_at, updated_at FROM records WHERE entity='Questionnaire' AND org_id=? AND project_id=? ORDER BY created_at`, req.orgId, projectId).map(x => {
    const d = J(x.data, {}); const st = Q.stats(req.orgId, x.id);
    return { id: x.id, project_id: x.project_id, label: d.label, status: d.status, due_date: d.due_date, channel_mode: d.channel_mode, forms: (d.forms || []).map(f => ({ code: f.code, name: f.name, population: f.population })), elaboration_mode: d.elaboration_mode, modes: d.modes, stats: st.total, created_at: x.created_at };
  });
}
r.get('/projects/:id/questionnaires', requirePerm('m54.view'), ah(req => listFor(req, projectOf(req, req.params.id).id)));
r.get('/questionnaires', requirePerm('m54.view'), ah(req => {
  const pid = req.query.project || req.projectId;
  if (pid) return listFor(req, projectOf(req, pid).id);
  return all(`SELECT id FROM projects WHERE org_id=?`, req.orgId).flatMap(p => listFor(req, p.id));
}));

/** Elaborate a questionnaire by Load (from templates), AI (tailored questions to validate) or Manual; modes combine. */
r.post('/projects/:id/questionnaires', requirePerm('m54.edit'), ah(async req => {
  const p = projectOf(req, req.params.id); const b = req.body || {};
  const ids = Array.isArray(b.template_ids) ? b.template_ids : [];
  const templates = ids.map(id => one(`SELECT * FROM records WHERE id=? AND entity='QuestionnaireTemplate' AND (org_id IS NULL OR org_id=?)`, id, req.orgId)).filter(Boolean).map(x => ({ id: x.id, ...J(x.data, {}) }));
  if (!templates.length && !b.manual) throw new HttpError(422, 'err.required', { field: 'template_ids' });
  const forms = templates.length ? Q.formsFromTemplates(templates) : [{ code: 'MANUAL', name: { en: b.label || 'Questionnaire', fr: b.label || 'Questionnaire', ar: b.label || 'استبيان' }, population: 'Member', sections: [] }];
  const sow = one(`SELECT id FROM records WHERE entity='ScopeOfWork' AND project_id=?`, p.id);
  const label = b.label ? { en: b.label, fr: b.label, ar: b.label } : { en: `IF-PAC questionnaire campaign ${p.plan_year || ''}`.trim(), fr: `Campagne de questionnaires IF-PAC ${p.plan_year || ''}`.trim(), ar: `حملة استبيانات IF-PAC ${p.plan_year || ''}`.trim() };
  const data = { label, sow_id: sow?.id || null, template_id: templates[0]?.id || null, template_ids: templates.map(x => x.id), elaboration_mode: templates.length ? 'Load' : 'Manual', modes: [templates.length ? 'Load' : 'Manual'], ai_generated: false,
    status: 'Draft', due_date: b.due_date || addDays(now(), 21).slice(0, 10), response_count: 0, forms, channel_mode: Q.MODES.includes(b.channel_mode) ? b.channel_mode : 'Combination',
    reminders: { Email: { every_days: 3, max: 2 }, WhatsApp: { every_days: 2, max: 2 }, Application: { every_days: 3, max: 1 } }, threshold: 70, owner_id: req.user.id, channels: ['Email', 'WhatsApp', 'Application', 'Face-to-Face'] };
  const id = uuid(); insertRecord(id, 'Questionnaire', req.orgId, p.id, null, data, req.user.id, true);
  audit(req, 'Questionnaire', id, 'create', null, { templates: templates.map(x => x.code), mode: data.elaboration_mode });
  Q.event(req.orgId, id, null, 'questionnaire.created', { detail: { templates: templates.map(x => x.code) }, userId: req.user.id });
  if (b.ai) await tailor(req, Q.getQuestionnaire(req.orgId, id));
  return full(req, id);
}));

function full(req, id) {
  const q = Q.getQuestionnaire(req.orgId, id); const inv = Q.listInvitations(req.orgId, id);
  const project = one(`SELECT id, name, focus, plan_year FROM projects WHERE id=?`, q.project_id);
  return { ...q, project: { ...project, name: J(project?.name, project?.name) }, invitations: inv.length, stats: Q.stats(req.orgId, id), issues: Q.distributionIssues(q, inv), channelModes: Q.MODES, channels: Q.CHANNELS,
    channelSettings: CH.getSettings(req.orgId).map(c => ({ channel: c.channel, effective: c.effective })) };
}
r.get('/questionnaires/:id', requirePerm('m54.view'), ah(req => full(req, req.params.id)));

/** Design changes: forms, sections, questions (Manual mode), RACSI per section, deadline, threshold, reminder cadence. */
r.patch('/questionnaires/:id', requirePerm('m54.edit'), ah(req => {
  const q = Q.getQuestionnaire(req.orgId, req.params.id); const b = req.body || {};
  if (['Closed'].includes(q.status)) throw new HttpError(409, 'err.questionnaireClosed');
  const before = { status: q.status, due_date: q.due_date, threshold: q.threshold };
  if (b.label) q.label = typeof b.label === 'object' ? b.label : { ...q.label, [lang(req)]: b.label };
  if (b.due_date) q.due_date = String(b.due_date).slice(0, 10);
  if (b.threshold != null) { const n = Number(b.threshold); if (!(n >= 0 && n <= 100)) throw new HttpError(422, 'err.invalidNumber', { field: 'threshold' }); q.threshold = n; }
  if (b.channel_mode) { if (!Q.MODES.includes(b.channel_mode)) throw new HttpError(422, 'err.invalidOption', { field: 'channel_mode', value: b.channel_mode }); q.channel_mode = b.channel_mode; }
  if (b.reminders) for (const [ch, v] of Object.entries(b.reminders)) { if (!Q.CHANNELS.includes(ch)) continue; q.reminders = { ...(q.reminders || {}), [ch]: { every_days: Math.max(0, Math.round(Number(v.every_days) || 0)), max: Math.max(0, Math.round(Number(v.max) || 0)) } }; }
  if (b.forms) {
    if (q.status === 'Distributed' && !String(b._justification || '').trim()) throw new HttpError(422, 'err.justificationRequired');
    const prev = new Map((q.forms || []).flatMap(f => f.sections.flatMap(s => [[`${f.code}|${s.id}`, s], ...(s.items || []).map(it => [`${f.code}|${s.id}|${it.key}`, it])])));
    q.forms = b.forms.map(f => ({ ...f, sections: sanitizeSections(f.sections || []).map(s => {
      const old = prev.get(`${f.code}|${s.id}`);
      // Origins and validations cannot be forged by the client: new sections and questions are Manual.
      const items = s.items && s.items.map(it => { const o = prev.get(`${f.code}|${s.id}|${it.key}`); return o ? { ...it, origin: o.origin, validated_by: o.validated_by, validated_at: o.validated_at } : { ...it, origin: 'manual', validated_by: undefined, validated_at: undefined }; });
      return { ...s, items, origin: old ? old.origin : 'manual', validated_by: old?.validated_by, validated_at: old?.validated_at };
    }) }));
    if (q.forms.some(f => f.sections.some(s => s.origin === 'manual' || (s.items || []).some(i => i.origin === 'manual')))) q.modes = [...new Set([...(q.modes || []), 'Manual'])];
    q.elaboration_mode = (q.modes || []).length > 1 ? q.modes.join(' + ') : q.elaboration_mode;
  }
  Q.saveQuestionnaire(q, req.user.id);
  audit(req, 'Questionnaire', q.id, 'update', before, { status: q.status, due_date: q.due_date, threshold: q.threshold, forms: !!b.forms }, b._justification);
  return full(req, q.id);
}));

/** AI tailoring (AIUC-36): sector- and focus-specific questions, each labelled AI and blocked until validated (QLT-02/03). */
async function tailor(req, q) {
  const uc = useCaseByCode(req.orgId, 'AIUC-36');
  if (!uc || !effectiveActive(req.orgId, q.project_id, uc.id)) throw new HttpError(403, 'err.aiInactive', { useCase: 'AIUC-36' });
  const p = one(`SELECT * FROM projects WHERE id=?`, q.project_id); const org = one(`SELECT name, sector FROM organizations WHERE id=?`, req.orgId);
  const v = one(`SELECT data FROM records WHERE entity='Vertical' AND ref=?`, org.sector); const vd = J(v?.data, {});
  const themes = all(`SELECT data FROM records WHERE entity='TrainingTheme' AND project_id=?`, p.id).map(x => J(x.data, {})).sort((a, b) => (a.priority_rank || 9) - (b.priority_rank || 9)).map(x => x.name);
  const vc = one(`SELECT data FROM catalog WHERE kind='verticalSeed' AND id=?`, org.sector); const vs = J(vc?.data, {});
  const pool = themes.length ? themes : (p.focus === 'AI' ? vs.themes?.ai : vs.themes?.digital) || [];
  const th = i => pool[i % Math.max(1, pool.length)] || { en: p.focus, fr: p.focus, ar: p.focus };
  const vars = l => ({ theme1: pick(th(0), l), theme2: pick(th(1), l), theme3: pick(th(2), l), core: pick(vs.coreFunction?.name, l) || '', standard: (vd.standards || vs.standards || [])[0] || '', sector: pick(vd.name || vs.name, l), focus: p.focus });
  const q5 = ['q1', 'q2', 'q3', 'q4', 'q5'].map((k, i) => ({ key: 'ai_' + k, label: { en: t('qai.' + k, 'en', vars('en')), fr: t('qai.' + k, 'fr', vars('fr')), ar: t('qai.' + k, 'ar', vars('ar')) }, origin: 'ai', competence: i === 3 }));
  const title = { en: t('qai.section', 'en', vars('en')), fr: t('qai.section', 'fr', vars('fr')), ar: t('qai.section', 'ar', vars('ar')) };
  let n = 0;
  for (const f of q.forms || []) {
    if ((f.sections || []).some(s => s.id === 'ai_sector')) continue;
    const at = Math.max(0, f.sections.findIndex(s => s.id === 'ambitions'));
    f.sections.splice(at, 0, { id: 'ai_sector', type: 'questions', feeds: 'ambitions', title, origin: 'ai', items: q5.map(x => ({ ...x })), racsi: { R: 'L&D Analyst', A: 'Head of L&D', C: 'Consultant PM', S: 'Function head', I: 'HR Director' } });
    n += q5.length;
  }
  q.modes = [...new Set([...(q.modes || []), 'AI'])]; q.ai_generated = true; q.elaboration_mode = q.modes.join(' + ');
  q.tailoring_notes = { en: `${n} AI questions tailored to ${vars('en').sector} and the ${p.focus} focus — to be validated`, fr: `${n} questions IA adaptées au secteur ${vars('fr').sector} et au focus ${p.focus} — à valider`, ar: `${n} أسئلة مولدة بالذكاء الاصطناعي ومكيفة مع ${vars('ar').sector} ومحور ${p.focus} — في انتظار المصادقة` };
  if (q.status === 'Draft' || q.status === 'Validated') q.status = 'Pending Validation';
  Q.saveQuestionnaire(q, req.user.id);
  logUsage({ orgId: req.orgId, projectId: q.project_id, useCaseId: 'AIUC-36', recordRef: 'Questionnaire:' + q.id, userId: req.user.id, outcome: 'Proposed', source: 'built-in', confidence: 0.7, question: `tailor ${n}` });
  Q.event(req.orgId, q.id, null, 'ai.tailored', { detail: { questions: n, engine: 'built-in' }, userId: req.user.id });
  return n;
}
r.post('/questionnaires/:id/ai-tailor', requirePerm('m54.edit', 'ai.run'), ah(async req => { const q = Q.getQuestionnaire(req.orgId, req.params.id); if (q.status === 'Closed') throw new HttpError(409, 'err.questionnaireClosed'); const n = await tailor(req, q); return { added: n, ...full(req, q.id), engine: 'built-in' }; }));

/** Human validation of AI questions, recorded with the validating user and time (FR-DA-QLT-03). */
r.post('/questionnaires/:id/validate', requirePerm('m54.edit'), ah(req => {
  const q = Q.getQuestionnaire(req.orgId, req.params.id); const b = req.body || {}; const tm = now(); let n = 0;
  for (const f of q.forms || []) for (const s of f.sections || []) {
    const pick1 = x => b.all || (b.refs || []).includes(`${f.code}|${s.id}${x ? '|' + x.key : ''}`);
    for (const x of [s, ...(s.items || [])]) if (x.origin === 'ai' && !x.validated_by && pick1(x === s ? null : x)) { x.validated_by = req.user.id; x.validated_at = tm; n++; }
    if (b.reject) { const rej = new Set(b.reject); s.items = (s.items || []).filter(it => !(it.origin === 'ai' && rej.has(`${f.code}|${s.id}|${it.key}`))); }
  }
  if (b.reject?.length) logUsage({ orgId: req.orgId, projectId: q.project_id, useCaseId: 'AIUC-36', recordRef: 'Questionnaire:' + q.id, userId: req.user.id, outcome: 'Rejected', source: 'built-in' });
  if (n) logUsage({ orgId: req.orgId, projectId: q.project_id, useCaseId: 'AIUC-36', recordRef: 'Questionnaire:' + q.id, userId: req.user.id, outcome: 'Accepted', source: 'built-in' });
  const pendingAi = (q.forms || []).some(f => f.sections.some(s => [s, ...(s.items || [])].some(x => x.origin === 'ai' && !x.validated_by)));
  if (!pendingAi && q.status === 'Pending Validation') q.status = 'Validated';
  Q.saveQuestionnaire(q, req.user.id); audit(req, 'Questionnaire', q.id, 'validate', null, { validated: n, rejected: (b.reject || []).length });
  Q.event(req.orgId, q.id, null, 'ai.validated', { detail: { validated: n, rejected: (b.reject || []).length }, userId: req.user.id });
  return full(req, q.id);
}));

// ------------------------------------------------------------------ respondents ("who will respond")
r.get('/questionnaires/:id/invitations', requirePerm('m54.view'), ah(req => { Q.getQuestionnaire(req.orgId, req.params.id); return Q.listInvitations(req.orgId, req.params.id); }));
/** Stakeholders the questionnaire can be sent to, with the population and the form each would receive. */
r.get('/questionnaires/:id/candidates', requirePerm('m54.view'), ah(req => {
  const q = Q.getQuestionnaire(req.orgId, req.params.id);
  const taken = new Set(all(`SELECT stakeholder_id FROM q_invitations WHERE questionnaire_id=?`, q.id).map(x => x.stakeholder_id));
  const fns = new Map(all(`SELECT id, name FROM obs_nodes WHERE org_id=?`, req.orgId).map(f => [f.id, J(f.name, f.name)]));
  return all(`SELECT id, data FROM records WHERE entity='Stakeholder' AND org_id=? AND project_id=?`, req.orgId, q.project_id).map(x => ({ id: x.id, ...J(x.data, {}) }))
    .map(s => ({ id: s.id, name: s.name, role: s.role_t || s.role, email: s.email, phone: s.phone || null, decision_level: s.decision_level, function: fns.get(s.function_id) || null, consent_status: s.consent_status, preferred_channel: s.preferred_channel, population: Q.populationOf(s), invited: taken.has(s.id) }));
}));
r.post('/questionnaires/:id/invitations', requirePerm('m54.edit'), ah(req => {
  const q = Q.getQuestionnaire(req.orgId, req.params.id); const b = req.body || {};
  if (q.status === 'Closed') throw new HttpError(409, 'err.questionnaireClosed');
  let list = all(`SELECT id, data FROM records WHERE entity='Stakeholder' AND org_id=? AND project_id=?`, req.orgId, q.project_id).map(x => ({ id: x.id, ...J(x.data, {}) }));
  if (Array.isArray(b.stakeholder_ids)) list = list.filter(s => b.stakeholder_ids.includes(s.id));
  if (b.filter?.population) list = list.filter(s => Q.populationOf(s) === b.filter.population);
  if (b.filter?.decision_level) list = list.filter(s => s.decision_level === b.filter.decision_level);
  if (b.filter?.function_id) list = list.filter(s => s.function_id === b.filter.function_id);
  if (b.filter?.consentOnly) list = list.filter(s => s.consent_status !== 'Refused' && s.consent_status !== 'Withdrawn');
  const fns = new Map(all(`SELECT id, name FROM obs_nodes WHERE org_id=?`, req.orgId).map(f => [f.id, J(f.name, f.name)]));
  list = list.map(s => ({ ...s, function_name: fns.get(s.function_id) || null }));
  const added = Q.addInvitations(req.orgId, q, list, { population: b.population, templateCode: b.template_code, plan: b.channel_plan, mode: b.channel_mode, lang: b.lang, userId: req.user.id });
  audit(req, 'Questionnaire', q.id, 'respondents', null, { added: added.length });
  return { added: added.length, invitations: Q.listInvitations(req.orgId, q.id) };
}));
/** Change the population, form, channel plan (or its mode), contact details, interview slot or interviewer of respondents. */
r.patch('/invitations', requirePerm('m54.edit'), ah(req => {
  const b = req.body || {}; const ids = Array.isArray(b.ids) ? b.ids : []; let n = 0;
  for (const id of ids) { patchInvitation(req, Q.getInvitation(req.orgId, id), b); n++; }
  return { updated: n };
}));
r.patch('/invitations/:id', requirePerm('m54.edit'), ah(req => { const inv = Q.getInvitation(req.orgId, req.params.id); patchInvitation(req, inv, req.body || {}); return Q.listInvitations(req.orgId, inv.questionnaire_id).find(x => x.id === inv.id); }));
function patchInvitation(req, inv, b) {
  const q = Q.getQuestionnaire(req.orgId, inv.questionnaire_id);
  const set = {};
  if (b.population) { if (!Q.POPULATIONS.includes(b.population)) throw new HttpError(422, 'err.invalidOption', { field: 'population', value: b.population }); set.population = b.population; }
  if (b.template_code) { if (!(q.forms || []).some(f => f.code === b.template_code)) throw new HttpError(422, 'err.invalidOption', { field: 'template_code', value: b.template_code }); if (inv.status === 'Responded') throw new HttpError(409, 'err.alreadyResponded'); set.template_code = b.template_code; }
  if (b.channel_plan) set.channel_plan = S(Q.validatePlan(b.channel_plan));
  else if (b.channel_mode) { if (!Q.MODES.includes(b.channel_mode)) throw new HttpError(422, 'err.invalidOption', { field: 'channel_mode', value: b.channel_mode }); set.channel_plan = S(Q.planForMode(b.channel_mode, set.population || inv.population, { hasPhone: !!inv.phone, hasUser: !!inv.user_id })); }
  if (set.channel_plan && inv.step_index >= 0) set.step_index = Math.min(inv.step_index, J(set.channel_plan).length - 1);
  if (b.email !== undefined) { if (b.email && !CH.validEmail(b.email)) throw new HttpError(422, 'err.invalidEmail'); set.email = b.email || null; }
  if (b.phone !== undefined) { const p = b.phone ? CH.normalizePhone(b.phone) : null; if (b.phone && !p) throw new HttpError(422, 'err.invalidPhone'); set.phone = p; }
  if (b.lang !== undefined) set.lang = ['en', 'fr', 'ar'].includes(b.lang) ? b.lang : null;
  if (b.interview_at !== undefined) { set.interview_at = b.interview_at || null; if (b.interview_at && ['Interview to schedule', 'Planned', 'Invited', 'Opened'].includes(inv.status)) set.status = 'Interview scheduled'; }
  if (b.interviewer_id !== undefined) set.interviewer_id = b.interviewer_id || null;
  if (b.status === 'Declined') set.status = 'Declined';
  const keys = Object.keys(set); if (!keys.length) return;
  run(`UPDATE q_invitations SET ${keys.map(k => `${k}=?`).join(', ')}, updated_at=? WHERE id=?`, ...keys.map(k => set[k]), now(), inv.id);
  Q.event(req.orgId, q.id, inv.id, 'respondent.updated', { detail: Object.fromEntries(keys.map(k => [k, k === 'channel_plan' ? Q.modeOfPlan(J(set[k])) : set[k]])), userId: req.user.id });
  if (set.interview_at && (inv.email || inv.phone)) {
    const plan = J(set.channel_plan || inv.channel_plan, []); const digital = plan.find(s => s.channel !== 'Face-to-Face');
    if (digital) Q.runStep(req.orgId, q, one(`SELECT * FROM q_invitations WHERE id=?`, inv.id), { channel: digital.channel, action: 'interview' }, { userId: req.user.id, base: base(req) }).catch(() => {});
  }
}
r.delete('/invitations/:id', requirePerm('m54.edit'), ah(req => {
  const inv = Q.getInvitation(req.orgId, req.params.id);
  if (inv.status === 'Responded') throw new HttpError(409, 'err.alreadyResponded');
  run(`DELETE FROM q_invitations WHERE id=?`, inv.id); Q.event(req.orgId, inv.questionnaire_id, inv.id, 'respondent.removed', { recipient: inv.name, userId: req.user.id }); return { ok: true };
}));
/** Send now on a chosen channel (or the next step of the plan). */
r.post('/invitations/:id/send', requirePerm('m54.edit'), ah(async req => {
  const inv = Q.getInvitation(req.orgId, req.params.id); const q = Q.getQuestionnaire(req.orgId, inv.questionnaire_id);
  if (q.status !== 'Distributed') throw new HttpError(409, 'err.notDistributed');
  if (inv.opted_out) throw new HttpError(409, 'err.optedOut');
  const plan = J(inv.channel_plan, []); const ch = req.body?.channel;
  if (ch && !Q.CHANNELS.includes(ch)) throw new HttpError(422, 'err.invalidOption', { field: 'channel', value: ch });
  const step = ch ? { channel: ch, action: inv.last_sent_at ? 'remind' : 'invite' } : plan[Math.min(plan.length - 1, inv.step_index + 1)];
  if (!ch && inv.step_index + 1 < plan.length) run(`UPDATE q_invitations SET step_index=step_index+1 WHERE id=?`, inv.id);
  return Q.runStep(req.orgId, { ...q, public_base: q.public_base || base(req) }, one(`SELECT * FROM q_invitations WHERE id=?`, inv.id), step, { userId: req.user.id, base: base(req) });
}));
r.get('/invitations/:id/link', requirePerm('m54.edit'), ah(req => { const inv = Q.getInvitation(req.orgId, req.params.id); audit(req, 'QuestionnaireInvitation', inv.id, 'link', null, null); return { url: Q.linkFor(inv, base(req)) }; }));

// ------------------------------------------------------------------ distribution lifecycle
r.post('/questionnaires/:id/distribute', requirePerm('m54.edit'), ah(async req => {
  const q = Q.getQuestionnaire(req.orgId, req.params.id);
  if (!['Draft', 'Validated', 'Pending Validation'].includes(q.status)) throw new HttpError(409, 'err.invalidTransition', { from: q.status, to: 'Distributed' });
  const inv = Q.listInvitations(req.orgId, q.id); const issues = Q.distributionIssues(q, inv);
  const blocking = issues.filter(i => ['aiUnvalidated', 'noAccountable', 'manyAccountable', 'noRespondents', 'noDueDate'].includes(i.code));
  if (blocking.length) throw new HttpError(409, 'err.distributionBlocked', { reasons: blocking.map(i => t('qissue.' + i.code, lang(req), i)).join(' · ') });
  q.status = 'Distributed'; q.distributed_on = now(); q.public_base = base(req); q.distributed_by = req.user.id;
  Q.saveQuestionnaire(q, req.user.id); audit(req, 'Questionnaire', q.id, 'distribute', { status: 'Validated' }, { status: 'Distributed', respondents: inv.length });
  Q.event(req.orgId, q.id, null, 'questionnaire.distributed', { detail: { respondents: inv.length }, userId: req.user.id });
  const res = await Q.advance(req.orgId, Q.getQuestionnaire(req.orgId, q.id), { base: base(req), userId: req.user.id });
  return { ...full(req, q.id), sent: res };
}));
/** Plays due plan steps and reminders now instead of waiting for the background tick. */
r.post('/questionnaires/:id/advance', requirePerm('m54.edit'), ah(async req => { const q = Q.getQuestionnaire(req.orgId, req.params.id); return Q.advance(req.orgId, q, { base: base(req), userId: req.user.id }); }));
r.post('/questionnaires/:id/close', requirePerm('m54.edit'), ah(req => {
  const q = Q.getQuestionnaire(req.orgId, req.params.id); if (q.status !== 'Distributed') throw new HttpError(409, 'err.invalidTransition', { from: q.status, to: 'Closed' });
  q.status = 'Closed'; q.closed_on = now(); Q.saveQuestionnaire(q, req.user.id);
  const n = run(`UPDATE q_invitations SET status='Expired', updated_at=? WHERE questionnaire_id=? AND status NOT IN ('Responded','Declined')`, now(), q.id).changes;
  audit(req, 'Questionnaire', q.id, 'close', { status: 'Distributed' }, { status: 'Closed' }, req.body?._justification);
  Q.event(req.orgId, q.id, null, 'questionnaire.closed', { detail: { expired: n }, userId: req.user.id });
  return full(req, q.id);
}));

// ------------------------------------------------------------------ capture by staff: face-to-face interview, form returned by email, offline sync
r.get('/invitations/:id/form', requirePerm('m54.view'), ah(req => {
  const inv = Q.getInvitation(req.orgId, req.params.id); const q = Q.getQuestionnaire(req.orgId, inv.questionnaire_id);
  const resp = inv.response_id ? one(`SELECT data FROM records WHERE id=?`, inv.response_id) : null;
  const rd = J(resp?.data, null); const draft = J(inv.draft, null);
  return { invitation: { ...inv, token_enc: undefined, token_hash: undefined, channel_plan: J(inv.channel_plan, []), consent: J(inv.consent) }, questionnaire: { id: q.id, label: q.label, status: q.status, due_date: q.due_date, threshold: q.threshold }, form: Q.formOf(q, inv.template_code),
    answers: rd?.answers_json || draft?.answers || {}, flags: rd?.flags || draft?.flags || {}, completeness: rd?.completeness_pct ?? draft?.pct ?? 0 };
}));
r.post('/invitations/:id/capture', requirePerm('m54.edit'), ah(req => {
  const inv = Q.getInvitation(req.orgId, req.params.id); const q = Q.getQuestionnaire(req.orgId, inv.questionnaire_id); const b = req.body || {};
  if (!['Distributed', 'Validated'].includes(q.status)) throw new HttpError(409, 'err.notDistributed');
  const channel = Q.CHANNELS.includes(b.channel_used) ? b.channel_used : 'Face-to-Face';
  const capturedAt = b.captured_at && !Number.isNaN(Date.parse(b.captured_at)) && Date.parse(b.captured_at) <= Date.now() + 60000 ? new Date(b.captured_at).toISOString() : null;
  const out = Q.storeResponse(req.orgId, q, inv, { answers: b.answers || {}, flags: b.flags || {}, consent: b.consent === true, final: b.final !== false, channel, capturedAt, clientId: b.client_id || null, userId: req.user.id, source: 'staff' });
  audit(req, 'QuestionnaireResponse', out.responseId || inv.id, b.final === false ? 'draft' : 'capture', null, { channel, completeness: out.completeness, offline: !!capturedAt });
  return out;
}));
/** Printable interview pack for the Face-to-Face channel, in the respondent's language (FR-DA-COMM-06). */
r.get('/invitations/:id/pack', requirePerm('m54.view'), ah(async (req, res) => {
  const inv = Q.getInvitation(req.orgId, req.params.id); const q = Q.getQuestionnaire(req.orgId, inv.questionnaire_id);
  const l = ['en', 'fr', 'ar'].includes(req.query.lang) ? req.query.lang : inv.lang || lang(req); const fmt = ['pdf', 'docx'].includes(req.query.format) ? req.query.format : 'docx';
  const model = packModel(req, q, inv, l);
  const buf = await exportModel(model, fmt);
  res.set('Content-Type', MIME[fmt]).set('Content-Disposition', `attachment; filename="${encodeURIComponent((inv.name || 'respondent').replace(/\s+/g, '_'))}_${inv.template_code}.${fmt}"`).send(buf);
}));
r.get('/questionnaires/:id/forms/:code/pack', requirePerm('m54.view'), ah(async (req, res) => {
  const q = Q.getQuestionnaire(req.orgId, req.params.id); const fmt = ['pdf', 'docx'].includes(req.query.format) ? req.query.format : 'docx'; const l = ['en', 'fr', 'ar'].includes(req.query.lang) ? req.query.lang : lang(req);
  const buf = await exportModel(packModel(req, q, { name: '', template_code: req.params.code }, l), fmt);
  res.set('Content-Type', MIME[fmt]).set('Content-Disposition', `attachment; filename="${req.params.code}.${fmt}"`).send(buf);
}));
function packModel(req, q, inv, l) {
  const form = Q.formOf(q, inv.template_code); const org = one(`SELECT name FROM organizations WHERE id=?`, req.orgId);
  const saved = inv.response_id ? J(one(`SELECT data FROM records WHERE id=?`, inv.response_id)?.data, {}).answers_json : J(inv.draft, {})?.answers;
  const A = saved || {}; const P = x => pick(x, l);
  const sections = (form?.sections || []).map(s => {
    const a = A[s.id];
    const blank = (n, w) => Array.from({ length: n }, () => Array(w).fill(''));
    let table = null;
    if (s.type === 'identity') table = { columns: [t('pack.field', l), t('pack.answer', l)], rows: s.fields.map(f => [P(f.label), a?.[f.key] ?? (f.key === 'full_name' ? inv.name || '' : '')]) };
    if (s.type === 'table') { const rows = Array.isArray(a) && a.length ? a.map(x => s.columns.map(c => fmtCell(x[c.key], c, l))) : blank(s.minRows || 3, s.columns.length); table = { columns: s.columns.map(c => P(c.label)), rows }; }
    if (s.type === 'grid') table = { columns: ['', ...s.columns.map(c => P(c.label))], rows: s.rows.map(rw => [P(rw.label) + (rw.hint ? ' — ' + P(rw.hint) : ''), ...s.columns.map(c => fmtCell(a?.[rw.key]?.[c.key], c, l))]) };
    if (s.type === 'questions') table = { columns: [t('pack.question', l), t('pack.answer', l)], rows: s.items.map(i => [P(i.label) + (i.origin === 'ai' ? ' (AI)' : ''), a?.[i.key] || ''] ) };
    if (s.type === 'rating') table = { columns: [t('pack.competence', l), t('pack.rating', l) + (s.scale?.allowNew ? ' (Nv, 1–5)' : ' (1–5)')], rows: s.items.map(i => [P(i.label), a?.[i.key] ?? '']) };
    if (s.type === 'yesno') table = { columns: [t('pack.question', l), t('pack.yesNo', l), t('pack.comment', l)], rows: s.items.map(i => [P(i.label), a?.[i.key]?.value ? t('common.' + String(a[i.key].value).toLowerCase(), l) : '', a?.[i.key]?.comment || '']) };
    if (s.type === 'swot') table = { columns: s.boxes.map(b => P(b.label)), rows: [s.boxes.map(b => a?.[b.key] || '')] };
    return { heading: P(s.title), text: s.instructions ? P(s.instructions) : null, table };
  });
  return { id: form?.form || form?.code || 'F', cadence: t('pack.cadence', l), title: P(form?.name), subtitle: [P(J(org?.name, org?.name)), P(q.label)].join(' · '), audience: inv.name || t('pack.blank', l), generated: now(), lang: l,
    sections: [{ heading: t('pack.consentTitle', l), text: t('pack.consentText', l), table: { columns: [t('pack.field', l), t('pack.answer', l)], rows: [[t('pack.consentGiven', l), '☐ ' + t('common.yes', l) + '   ☐ ' + t('common.no', l)], [t('pack.interviewDate', l), inv.interview_at ? new Date(inv.interview_at).toLocaleString(l === 'fr' ? 'fr-FR' : l === 'ar' ? 'ar-MA' : 'en-GB') : ''], [t('pack.interviewer', l), '']] } }, ...sections] };
}
const fmtCell = (v, c, l) => (v == null ? '' : c.kind === 'check' ? (v ? '✓' : '') : c.kind === 'yesno' ? (v ? t('common.' + String(v).toLowerCase(), l) : '') : c.kind === 'choice' && typeof v === 'object' ? pick(v, l) : String(v));

// ------------------------------------------------------------------ responses, consolidation, reporting
r.get('/questionnaires/:id/responses', requirePerm('m54.view'), ah(req => { Q.getQuestionnaire(req.orgId, req.params.id); return Q.responsesOf(req.orgId, req.params.id).map(x => ({ ...x, answers_json: undefined })); }));
r.get('/responses/:id', requirePerm('m54.view'), ah(req => {
  const x = one(`SELECT id, data FROM records WHERE id=? AND entity='QuestionnaireResponse' AND org_id=?`, req.params.id, req.orgId); if (!x) throw new HttpError(404, 'err.notFound');
  const d = J(x.data, {}); const q = Q.getQuestionnaire(req.orgId, d.questionnaire_id);
  return { id: x.id, ...d, form: Q.formOf(q, d.template_code) };
}));
/** A response below the completeness threshold is excluded unless included with a justification (FR-DA-QLT-09). */
r.post('/responses/:id/include', requirePerm('m54.edit'), ah(req => {
  const x = one(`SELECT id, data FROM records WHERE id=? AND entity='QuestionnaireResponse' AND org_id=?`, req.params.id, req.orgId); if (!x) throw new HttpError(404, 'err.notFound');
  const d = J(x.data, {}); const include = req.body?.include !== false;
  if (!String(req.body?._justification || '').trim()) throw new HttpError(422, 'err.justificationRequired');
  d.included = include; d.inclusion_justification = req.body._justification; d.included_by = req.user.id;
  run(`UPDATE records SET data=?, version=version+1, updated_at=?, updated_by=? WHERE id=?`, S(d), now(), req.user.id, x.id);
  audit(req, 'QuestionnaireResponse', x.id, include ? 'include' : 'exclude', null, { included: include }, req.body._justification);
  Q.event(req.orgId, d.questionnaire_id, d.invitation_id, include ? 'response.included' : 'response.excluded', { status: include ? 'included' : 'excluded', detail: req.body._justification, userId: req.user.id });
  return { id: x.id, included: include };
}));
r.get('/questionnaires/:id/dataset', requirePerm('m54.view'), ah(req => Q.consolidate(req.orgId, Q.getQuestionnaire(req.orgId, req.params.id), lang(req))));
r.get('/questionnaires/:id/stats', requirePerm('m54.view'), ah(req => { Q.getQuestionnaire(req.orgId, req.params.id); return Q.stats(req.orgId, req.params.id); }));
/** Feeds the consolidated dataset to the needs analysis without export or re-keying (FR-DA-QLT-11). */
r.post('/questionnaires/:id/feed', requirePerm('m54.edit'), ah(req => {
  const q = Q.getQuestionnaire(req.orgId, req.params.id); const ds = Q.consolidate(req.orgId, q, lang(req));
  const existing = new Set(all(`SELECT data FROM records WHERE entity='TrainingNeed' AND project_id=?`, q.project_id).map(x => String(pick(J(x.data, {}).title, lang(req))).toLowerCase()));
  let n = 0;
  for (const c of ds.competences.slice(0, Number(req.body?.limit) || 12)) {
    if (existing.has(c.competence.toLowerCase())) continue;
    const title = { en: c.competence, fr: c.competence, ar: c.competence };
    insertRecord(uuid(), 'TrainingNeed', req.orgId, q.project_id, null, { source: 'Questionnaire', title, label: title, theme: title, impact_score: Math.min(5, 2 + Math.round(c.count / 3)), validation_status: 'Draft', questionnaire_id: q.id, evidence: { mentions: c.count, sections: c.sources, populations: c.populations } }, req.user.id, true);
    n++;
  }
  q.fed_at = now(); q.fed_needs = (q.fed_needs || 0) + n; Q.saveQuestionnaire(q, req.user.id);
  audit(req, 'Questionnaire', q.id, 'feed', null, { trainingNeeds: n });
  Q.event(req.orgId, q.id, null, 'dataset.fed', { detail: { trainingNeeds: n, responses: ds.responses }, userId: req.user.id });
  return { created: n, responses: ds.responses };
}));
r.get('/questionnaires/:id/events', requirePerm('m54.view'), ah(req => { Q.getQuestionnaire(req.orgId, req.params.id);
  return all(`SELECT e.*, u.name user_name FROM q_events e LEFT JOIN users u ON u.id=e.user_id WHERE e.questionnaire_id=? AND e.org_id=? ORDER BY e.created_at DESC LIMIT 500`, req.params.id, req.orgId).map(e => ({ ...e, detail: J(e.detail, e.detail) })); }));
r.get('/questionnaires/:id/report', requirePerm('m54.view', 'reports.export'), ah(async (req, res) => {
  const q = Q.getQuestionnaire(req.orgId, req.params.id); const l = lang(req); const st = Q.stats(req.orgId, q.id); const ds = Q.consolidate(req.orgId, q, l);
  const fmt = ['pdf', 'xlsx', 'docx'].includes(req.query.format) ? req.query.format : 'xlsx';
  const org = one(`SELECT name FROM organizations WHERE id=?`, req.orgId);
  const rate = rows => ({ columns: [t('col.segment', l), t('q.invited', l), t('q.responded', l), t('q.responseRate', l), t('q.engagementRate', l), t('q.completeness', l)], rows: rows.map(x => [t('qch.' + x.key, l) === 'qch.' + x.key ? x.key : t('qch.' + x.key, l), x.invited, x.responded, x.responseRate == null ? '—' : x.responseRate + '%', x.engagementRate == null ? '—' : x.engagementRate + '%', x.completeness == null ? '—' : x.completeness + '%']) });
  const model = { id: 'QST', cadence: t('q.reportCadence', l), title: pick(q.label, l), subtitle: pick(J(org.name, org.name), l), audience: t('q.reportAudience', l), generated: now(), lang: l, sections: [
    { heading: t('q.byChannel', l), table: rate(st.byChannel) }, { heading: t('q.byPopulation', l), table: rate(st.byPopulation) }, { heading: t('q.byFunction', l), table: rate(st.byFunction) },
    { heading: t('q.softSkills', l), table: { columns: [t('pack.competence', l), t('q.average', l), 'n'], rows: ds.softSkills.map(x => [x.label, x.average ?? '—', x.n]) } },
    { heading: t('q.competences', l), table: { columns: [t('pack.competence', l), t('q.mentions', l), t('q.populations', l)], rows: ds.competences.map(x => [x.competence, x.count, x.populations.map(p => t('pop.' + p, l)).join(', ')]) } },
    { heading: t('q.performance', l), table: { columns: [t('col.function', l), 'MS', 'MO', 'OP'], rows: ds.performance.map(x => [x.function, x.ms ?? '—', x.mo ?? '—', x.op ?? '—']) } },
    { heading: t('q.transverse', l), table: { columns: [t('col.process', l), t('q.documented', l), t('q.owner', l), t('q.score', l)], rows: ds.transverse.map(x => [x.label, x.documented + '%', x.owner + '%', x.score ?? '—']) } },
  ] };
  const buf = await exportModel(model, fmt);
  res.set('Content-Type', MIME[fmt]).set('Content-Disposition', `attachment; filename="questionnaire_report.${fmt}"`).send(buf);
}));

// ------------------------------------------------------------------ channel settings and outbox (Administration)
r.get('/channels', requirePerm('config.view'), ah(req => CH.getSettings(req.orgId)));
r.put('/channels/:channel', requirePerm('integrations.manage'), ah(req => {
  const out = CH.saveSettings(req.orgId, req.user.id, req.params.channel, req.body || {});
  audit(req, 'ChannelSettings', req.params.channel, 'update', null, { channel: req.params.channel, enabled: out.enabled, mode: out.mode, config: out.config, secretChanged: !!req.body?.secret || !!req.body?.secret2 });
  return out;
}));
r.post('/channels/:channel/test', requirePerm('integrations.manage'), ah(req => CH.testChannel(req.orgId, req.user.id, req.params.channel, req.body?.to)));
r.get('/messages', requirePerm('m54.view'), ah(req => CH.listMessages(req.orgId, { questionnaireId: req.query.questionnaire, channel: req.query.channel, limit: Math.min(500, Number(req.query.limit) || 200) })));
export default r;
