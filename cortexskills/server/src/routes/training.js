// Training plan API: programs, trainings (level, identifier, objectives, duration, prerequisites, half-day agenda,
// value proposition per persona) and personas, with the golden rules checked on every read and before approval.
import { Router } from 'express';
import { ah, projectOf } from '../lib/http.js';
import { all, one, run } from '../db.js';
import { J, S, pick, HttpError, now } from '../lib/util.js';
import { requirePerm } from '../rbac.js';
import { audit } from '../audit.js';
import { t } from '../i18n.js';
import { createRecord, updateRecord, deleteRecord, getRecord } from '../entities.js';
import { logUsage, effectiveActive, useCaseByCode } from '../services/ai.js';
import { exportModel, MIME } from '../services/exporters.js';
import * as TR from '../services/training.js';

const r = Router();
const rows = (entity, where, ...p) => all(`SELECT id, data, version, updated_at FROM records WHERE entity=? AND ${where}`, entity, ...p).map(x => ({ id: x.id, version: x.version, updated_at: x.updated_at, ...J(x.data, {}) }));
const personasOf = orgId => rows('Persona', 'org_id=?', orgId).sort((a, b) => String(a.code).localeCompare(String(b.code)));

/** Facts used to draft an agenda and a value proposition, all taken from the Organization's own records. */
export function varsFor(orgId, project, themeName) {
  const org = one(`SELECT name, sector FROM organizations WHERE id=?`, orgId);
  const v = J(one(`SELECT data FROM catalog WHERE kind='verticalSeed' AND id=?`, org?.sector)?.data, {});
  return { org: J(org?.name, org?.name), sector: v.name || '', core: v.coreFunction?.name || '', standard: (v.standards || [])[0] || '', theme: themeName || '', focus: project?.focus || '' };
}

function planOf(req, p) {
  const programs = rows('TrainingProgram', 'project_id=?', p.id).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  const courses = rows('TrainingCourse', 'project_id=?', p.id).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || String(a.training_code).localeCompare(String(b.training_code)))
    .map(c => ({ ...c, rules: TR.checkRules(c) }));
  const plan = rows('TrainingPlan', 'project_id=?', p.id)[0] || null;
  const themes = rows('TrainingTheme', 'project_id=?', p.id).sort((a, b) => (a.priority_rank || 99) - (b.priority_rank || 99));
  const days = courses.reduce((s, c) => s + (Number(c.duration_days) || 0) * (Number(c.groups) || 1), 0);
  return { project: { id: p.id, name: J(p.name, p.name), focus: p.focus, plan_year: p.plan_year }, plan, programs, courses, personas: personasOf(req.orgId), themes: themes.map(x => ({ id: x.id, name: x.name, priority_rank: x.priority_rank, days_per_group: x.days_per_group, group_count: x.group_count })),
    levels: TR.LEVELS, itemTypes: TR.ITEM_TYPES, summary: { programs: programs.length, trainings: courses.length, compliant: courses.filter(c => c.rules.ok).length, halfDays: courses.reduce((s, c) => s + c.rules.halfDays, 0), trainingDays: days } };
}
r.get('/projects/:id/training-plan', requirePerm('m49.view'), ah(req => planOf(req, projectOf(req, req.params.id))));

// ------------------------------------------------------------------ programs
r.post('/projects/:id/programs', requirePerm('m49.edit'), ah(req => {
  const p = projectOf(req, req.params.id); const b = req.body || {};
  const n = rows('TrainingProgram', 'project_id=?', p.id).length;
  return createRecord(req, 'TrainingProgram', { code: b.code || `PRG-${n + 1}`, name: b.name, description: b.description, axis: b.axis, year: p.plan_year, sort: n }, { projectId: p.id });
}));
r.put('/programs/:id', requirePerm('m49.edit'), ah(req => updateRecord(req, 'TrainingProgram', req.params.id, req.body || {})));
r.delete('/programs/:id', requirePerm('m49.edit'), ah(req => {
  const used = one(`SELECT COUNT(*) n FROM records WHERE entity='TrainingCourse' AND json_extract(data,'$.program_id')=?`, req.params.id).n;
  if (used) throw new HttpError(409, 'err.programInUse', { n: used });
  return deleteRecord(req, 'TrainingProgram', req.params.id);
}));

// ------------------------------------------------------------------ trainings
function normalizeAgenda(agenda) {
  if (agenda == null) return undefined;
  if (!Array.isArray(agenda)) throw new HttpError(422, 'err.invalidOption', { field: 'agenda', value: typeof agenda });
  return agenda.map((h, i) => ({ half_day: i + 1, label: h.label || { en: TR.halfDayLabel(i, 'en'), fr: TR.halfDayLabel(i, 'fr'), ar: TR.halfDayLabel(i, 'ar') },
    items: (h.items || []).map(x => { if (!TR.ITEM_TYPES.includes(x.type)) throw new HttpError(422, 'err.invalidOption', { field: 'type', value: x.type }); return { type: x.type, title: x.title, minutes: Math.max(0, Math.round(Number(x.minutes) || 0)), description: x.description || undefined }; }) }));
}
function courseBody(b) {
  const out = { ...b };
  if (b.agenda !== undefined) out.agenda = normalizeAgenda(b.agenda);
  if (b.duration_days !== undefined) { const d = Number(b.duration_days); if (!(d > 0) || Math.round(d * 2) !== d * 2) throw new HttpError(422, 'err.durationHalfDays'); out.duration_days = d; }
  if (b.personas !== undefined && !Array.isArray(b.personas)) throw new HttpError(422, 'err.invalidOption', { field: 'personas', value: typeof b.personas });
  return out;
}
r.post('/projects/:id/trainings', requirePerm('m49.edit'), ah(req => {
  const p = projectOf(req, req.params.id); const b = req.body || {};
  if (!b.program_id || !one(`SELECT id FROM records WHERE id=? AND entity='TrainingProgram' AND project_id=?`, b.program_id, p.id)) throw new HttpError(422, 'err.required', { field: 'program_id' });
  const n = rows('TrainingCourse', 'project_id=?', p.id).length;
  const code = b.training_code || `TR-${p.focus === 'AI' ? 'AI' : 'DIG'}-${String(n + 1).padStart(2, '0')}`;
  if (rows('TrainingCourse', `project_id=? AND json_extract(data,'$.training_code')=?`, p.id, code).length) throw new HttpError(409, 'err.duplicate');
  const d = Number(b.duration_days) || 1;
  return createRecord(req, 'TrainingCourse', courseBody({ status: 'Draft', level: 'Foundation', objectives: [], agenda: TR.draftAgenda(d, varsFor(req.orgId, p, b.name)), personas: [], sort: n, groups: 1, ...b, training_code: code, duration_days: d }), { projectId: p.id });
}));
r.get('/trainings/:id', requirePerm('m49.view'), ah(req => { const c = getRecord(req, 'TrainingCourse', req.params.id); return { ...c, rules: TR.checkRules(c) }; }));
r.put('/trainings/:id', requirePerm('m49.edit'), ah(req => {
  const b = courseBody(req.body || {});
  if (b.training_code) { const cur = getRecord(req, 'TrainingCourse', req.params.id); if (rows('TrainingCourse', `project_id=? AND json_extract(data,'$.training_code')=? AND id<>?`, cur.project_id, b.training_code, cur.id).length) throw new HttpError(409, 'err.duplicate'); }
  // Approval follows the golden rules: a training that breaks them cannot be approved.
  if (b.status === 'Approved') { const next = { ...getRecord(req, 'TrainingCourse', req.params.id), ...b }; const chk = TR.checkRules(next); if (!chk.ok) throw new HttpError(409, 'err.goldenRules', { n: chk.issues.length, first: t('rule.' + chk.issues[0].code, req.lang, chk.issues[0]) }); }
  // An approved training edited into breaking the rules goes back to Draft instead of staying approved.
  if (!b.status) { const cur = getRecord(req, 'TrainingCourse', req.params.id); if (cur.status === 'Approved' && !TR.checkRules({ ...cur, ...b }).ok) { b.status = 'Draft'; b._justification = req.body?._justification || t('tr.autoDraft', req.lang); } }
  const c = updateRecord(req, 'TrainingCourse', req.params.id, b); return { ...c, rules: TR.checkRules(c) };
}));
r.post('/trainings/:id/duplicate', requirePerm('m49.edit'), ah(req => {
  const c = getRecord(req, 'TrainingCourse', req.params.id); const { id, entity, org_id, project_id, ref, version, created_at, updated_at, created_by, updated_by, ...data } = c;
  const n = rows('TrainingCourse', 'project_id=?', project_id).length;
  return createRecord(req, 'TrainingCourse', { ...data, training_code: `${data.training_code}-C${n + 1}`, status: 'Draft', sort: n }, { projectId: project_id });
}));
r.delete('/trainings/:id', requirePerm('m49.edit'), ah(req => deleteRecord(req, 'TrainingCourse', req.params.id)));

/** AI draft of the agenda, objectives and persona fit (AIUC-04 "Module structure proposal"); nothing is saved until accepted. */
r.post('/trainings/:id/ai-draft', requirePerm('m49.edit', 'ai.run'), ah(req => {
  const c = getRecord(req, 'TrainingCourse', req.params.id); const p = projectOf(req, c.project_id);
  const uc = useCaseByCode(req.orgId, 'AIUC-04');
  if (!uc || !effectiveActive(req.orgId, p.id, uc.id)) throw new HttpError(403, 'err.aiInactive', { useCase: 'AIUC-04' });
  const vars = varsFor(req.orgId, p, c.name);
  const days = Number(req.body?.duration_days) || Number(c.duration_days) || 1;
  const personas = personasOf(req.orgId).filter(x => !(req.body?.personas) || req.body.personas.includes(x.id));
  const draft = { agenda: TR.draftAgenda(days, vars), objectives: TR.draftObjectives(vars), personas: personas.map(x => TR.personaFit(x, vars)), duration_days: days };
  logUsage({ orgId: req.orgId, projectId: p.id, useCaseId: 'AIUC-04', recordRef: 'TrainingCourse:' + c.id, userId: req.user.id, outcome: 'Proposed', source: 'built-in', confidence: 0.72, question: c.training_code });
  return { ...draft, rules: TR.checkRules({ ...c, ...draft }), engine: 'built-in', useCase: 'AIUC-04', checkpoint: uc.checkpoint };
}));
r.post('/trainings/:id/ai-outcome', requirePerm('m49.edit'), ah(req => {
  const c = getRecord(req, 'TrainingCourse', req.params.id); const outcome = ['Accepted', 'Edited', 'Rejected'].includes(req.body?.outcome) ? req.body.outcome : 'Accepted';
  logUsage({ orgId: req.orgId, projectId: c.project_id, useCaseId: 'AIUC-04', recordRef: 'TrainingCourse:' + c.id, userId: req.user.id, outcome, source: 'built-in' }); return { ok: true };
}));

// ------------------------------------------------------------------ personas (Organization level)
r.get('/personas', requirePerm('m49.view'), ah(req => personasOf(req.orgId)));
r.post('/personas', requirePerm('m49.edit'), ah(req => createRecord(req, 'Persona', { code: req.body?.code || `P-${personasOf(req.orgId).length + 1}`, population: 'Custom', ...req.body })));
r.put('/personas/:id', requirePerm('m49.edit'), ah(req => updateRecord(req, 'Persona', req.params.id, req.body || {})));
r.delete('/personas/:id', requirePerm('m49.edit'), ah(req => {
  const used = all(`SELECT data FROM records WHERE entity='TrainingCourse' AND org_id=?`, req.orgId).filter(x => (J(x.data, {}).personas || []).some(p => p.persona_id === req.params.id)).length;
  if (used) throw new HttpError(409, 'err.personaInUse', { n: used });
  return deleteRecord(req, 'Persona', req.params.id);
}));

// ------------------------------------------------------------------ plan approval and export
r.post('/projects/:id/training-plan/submit', requirePerm('m49.edit'), ah(req => {
  const p = projectOf(req, req.params.id); const pl = planOf(req, p);
  const failing = pl.courses.filter(c => !c.rules.ok);
  if (!pl.courses.length) throw new HttpError(409, 'err.planEmpty');
  if (failing.length) throw new HttpError(409, 'err.goldenRulesPlan', { n: failing.length, codes: failing.map(c => c.training_code).join(', ') });
  if (!pl.plan) throw new HttpError(404, 'err.notFound');
  const status = req.body?.status === 'Approved' ? 'Approved' : 'In Review';
  return updateRecord(req, 'TrainingPlan', pl.plan.id, { status, _justification: req.body?._justification });
}));
r.get('/projects/:id/training-plan/export', requirePerm('m49.view', 'reports.export'), ah(async (req, res) => {
  const p = projectOf(req, req.params.id); const pl = planOf(req, p); const l = req.lang; const P = x => pick(x, l);
  const fmt = ['pdf', 'xlsx', 'docx'].includes(req.query.format) ? req.query.format : 'docx';
  const org = one(`SELECT name FROM organizations WHERE id=?`, req.orgId);
  const personaName = new Map(pl.personas.map(x => [x.id, P(x.name)]));
  const sections = [{ heading: t('tp.overview', l), table: { columns: [t('tp.program', l), t('tp.trainingId', l), t('tp.trainingName', l), t('tp.level', l), t('tp.duration', l), t('tp.groups', l), t('tp.prerequisites', l), t('tp.rules', l)],
    rows: pl.courses.map(c => [P(pl.programs.find(x => x.id === c.program_id)?.name), c.training_code, P(c.name), t('level.' + c.level, l) === 'level.' + c.level ? c.level : t('level.' + c.level, l), t('tp.days', l, { n: c.duration_days }), c.groups ?? 1, P(c.prerequisites) || '—', c.rules.ok ? t('tp.rulesOk', l) : t('tp.rulesKo', l, { n: c.rules.issues.length })]) } }];
  for (const prg of pl.programs) {
    sections.push({ heading: `${prg.code} — ${P(prg.name)}`, text: [P(prg.axis), P(prg.description)].filter(Boolean).join(' · ') || null });
    for (const c of pl.courses.filter(x => x.program_id === prg.id)) {
      sections.push({ heading: `${c.training_code} — ${P(c.name)}`, text: `${t('tp.level', l)}: ${t('level.' + c.level, l)} · ${t('tp.duration', l)}: ${t('tp.days', l, { n: c.duration_days })} (${c.rules.halfDays} ${t('tp.halfDays', l)}) · ${t('tp.prerequisites', l)}: ${P(c.prerequisites) || '—'}\n${t('tp.objectives', l)}: ${(c.objectives || []).map(o => '• ' + P(o)).join('  ')}`,
        table: { columns: [t('tp.halfDay', l), t('tp.itemType', l), t('tp.itemTitle', l), t('tp.minutes', l)], rows: (c.agenda || []).flatMap(h => (h.items || []).map((x, k) => [k ? '' : P(h.label), t('item.' + x.type, l), P(x.title), String(x.minutes || '')])) } });
      if ((c.personas || []).length) sections.push({ heading: `${c.training_code} — ${t('tp.valueProposition', l)}`, table: { columns: [t('tp.persona', l), t('tp.behaviour', l), t('tp.painPoints', l), t('tp.hopes', l), t('tp.fit', l)], rows: c.personas.map(x => [personaName.get(x.persona_id) || '—', P(x.behaviour), P(x.pain_points), P(x.hopes), P(x.fit)]) } });
    }
  }
  const model = { id: 'PLAN', cadence: String(p.plan_year || ''), title: t('tp.title', l, { year: p.plan_year || '' }), subtitle: [P(J(org.name, org.name)), P(J(p.name, p.name))].join(' · '), audience: t('tp.audience', l), generated: now(), lang: l, sections };
  const buf = await exportModel(model, fmt);
  audit(req, 'TrainingPlan', pl.plan?.id || p.id, 'export', null, { format: fmt });
  res.set('Content-Type', MIME[fmt]).set('Content-Disposition', `attachment; filename="training_plan_${p.plan_year || ''}.${fmt}"`).send(buf);
}));
export default r;
