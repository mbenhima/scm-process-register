// Generated documents (SRS Sections 4.43 – 4.45): the Training Engineering Report and Training Plan of a project,
// built from the application's records — company description, previous plan, competence needs (strategic
// orientations, by function, individual and collective demands, HR orientations, soft skills, cross-functional
// processes), expected impact, perspectives and the prioritized plan with its detailed trainings. Every section is
// bound to a data source; a section without data prints a notice naming the step that provides it (FR-DA-DGC-03),
// and the document lists its sources and the date of its data (FR-DA-DGC-02).
import { all, one } from '../db.js';
import { J, pick, now } from '../lib/util.js';
import { t } from '../i18n.js';
import * as cat from '../catalog.js';
import { consolidate, getQuestionnaire, formOf } from './questionnaires.js';
import { checkRules } from './training.js';
import { terDetails } from './termore.js';

export const DOC_TYPES = ['TER'];
const recs = (entity, projectId) => all(`SELECT id, data, version, updated_at FROM records WHERE entity=? AND project_id=?`, entity, projectId).map(x => ({ id: x.id, version: x.version, updated_at: x.updated_at, ...J(x.data, {}) }));
const orgRecs = (entity, orgId) => all(`SELECT id, data, version, updated_at FROM records WHERE entity=? AND org_id=? AND project_id IS NULL`, entity, orgId).map(x => ({ id: x.id, version: x.version, updated_at: x.updated_at, ...J(x.data, {}) }));

export function buildTer(orgId, projectId, lang = 'en', meta = {}) {
  const P = x => pick(x, lang); const T = (k, p) => t('ter.' + k, lang, p);
  const org = one(`SELECT * FROM organizations WHERE id=?`, orgId); const p = one(`SELECT * FROM projects WHERE id=? AND org_id=?`, projectId, orgId);
  const vertical = J(one(`SELECT data FROM catalog WHERE kind='verticalSeed' AND id=?`, org.sector)?.data, {});
  const sources = []; const findings = [];
  const src = (name, rows, step) => { sources.push({ source: name, records: Array.isArray(rows) ? rows.length : rows, step, latest: Array.isArray(rows) ? rows.map(r => r.updated_at).filter(Boolean).sort().pop() || null : null }); return rows; };
  const notice = (what, step) => ({ text: T('notice', { what, step }), notice: true });
  const S = []; // sections
  const sec = (heading, body = {}) => S.push({ heading, ...body });

  // Questionnaire dataset of the project (all questionnaires consolidated, FR-DA-QLT-11).
  const qs = all(`SELECT id FROM records WHERE entity='Questionnaire' AND project_id=?`, projectId).map(x => getQuestionnaire(orgId, x.id));
  const sets = qs.map(q => consolidate(orgId, q, lang));
  const merge = k => sets.flatMap(s => s[k] || []);
  const respCount = sets.reduce((n, s) => n + s.responses, 0);
  src(T('srcResponses'), respCount, 'MP-54');
  const strategy = {}; for (const s of sets) for (const [k, v] of Object.entries(s.strategy)) (strategy[k] ||= { label: v.label, values: [] }).values.push(...v.values);
  const swot = { strengths: [], weaknesses: [], opportunities: [], threats: [] }; for (const s of sets) for (const k of Object.keys(swot)) swot[k].push(...(s.swot[k] || []));
  const uniq = a => [...new Set(a.map(x => String(x).trim()).filter(Boolean))];
  const det = terDetails(orgId, projectId, lang, { qs, sets, src });
  const put = (chapter, start, list) => list.forEach((x, i) => sec(`${chapter}.${start + i} ${x.heading}`, { text: x.text, table: x.table }));

  // ---------------------------------------------------------------- identification block (FR-DA-DGC-04)
  const plan = src('TrainingPlan', recs('TrainingPlan', projectId), 'MP-49')[0];
  sec(T('identification'), { table: { columns: [T('field'), T('value')], rows: [
    [T('reference'), meta.reference || `TER-${String(p.plan_year || '')}-${String(p.id).slice(0, 6).toUpperCase()}`], [T('docTitle'), T('title', { org: P(J(org.name, org.name)), year: p.plan_year || '' })],
    [T('version'), String(meta.version || 1)], [T('status'), t('status.' + (meta.status || 'Draft'), lang)], [T('author'), meta.author || '—'], [T('approver'), meta.approver || '—'],
    [T('dataAsOf'), new Date(meta.dataAsOf || now()).toLocaleString(lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-MA' : 'en-GB')], [T('classification'), T('confidential')], [T('project'), P(J(p.name, p.name))]] } });

  // ---------------------------------------------------------------- 1. Company description
  sec('1. ' + T('company'), { text: T('companyIntro', { org: P(J(org.name, org.name)), sector: P(vertical.name), city: org.city || '', employees: org.employees || '—' }) });
  const strat = ['vision', 'mission', 'values', 'context', 'products_existing', 'products_new', 'segments'].map(k => strategy[k]).filter(Boolean);
  sec('1.1 ' + T('vision'), strat.length ? { table: { columns: [T('element'), T('details')], rows: strat.map(x => [x.label, uniq(x.values).join(' · ')]) } } : notice(T('whatStrategy'), T('stepDg')));
  const fns = all(`SELECT id, name FROM obs_nodes WHERE org_id=? AND type='Function'`, orgId).map(f => ({ id: f.id, name: J(f.name, f.name) }));
  const emps = src('Employee', orgRecs('Employee', orgId), 'MP-16');
  sec('1.2 ' + T('orgChart'), fns.length ? { table: { columns: [T('function'), T('headcountSample')], rows: fns.map(f => [P(f.name), String(emps.filter(e => e.obs_node_id === f.id).length)]) } } : notice(T('whatFunctions'), 'OBS'));
  const hist = merge('history');
  sec('1.3 ' + T('history'), hist.length ? { table: { columns: [T('date'), T('event')], rows: hist.map(h => [h.date || '', h.event || '']) } } : notice(T('whatHistory'), T('stepDg')));
  sec('1.4 ' + T('swot'), (swot.strengths.length || swot.weaknesses.length) ? { table: { columns: [T('strengths'), T('weaknesses'), T('opportunities'), T('threats')], rows: [[uniq(swot.strengths).join('\n'), uniq(swot.weaknesses).join('\n'), uniq(swot.opportunities).join('\n'), uniq(swot.threats).join('\n')]] } } : notice('SWOT', T('stepQuestionnaires')));
  const e2e = all(`SELECT e2e_id, phase, status, progress FROM e2e_instances WHERE project_id=? ORDER BY phase, sort`, projectId);
  sec('1.5 ' + T('mission'), { text: T('missionIntro'), table: { columns: [T('phase'), T('processes'), T('progress')], rows: cat.list('phase').filter(ph => ph.no > 0).map(ph => { const it = e2e.filter(x => x.phase === ph.no); return [`${ph.no}. ${P(ph.name)}`, it.map(x => `${x.e2e_id} ${P(cat.get('e2e', x.e2e_id)?.name)}`).join('\n'), it.length ? Math.round(it.reduce((s, x) => s + x.progress, 0) / it.length) + '%' : '—']; }) } });
  const inv = all(`SELECT population, function_name, status FROM q_invitations WHERE project_id=?`, projectId);
  const pops = ['DG', 'Management', 'Member'];
  if (inv.length) {
    const byFn = {}; for (const i of inv) { const k = i.function_name || '—'; (byFn[k] ||= { DG: 0, Management: 0, Member: 0, responded: 0 }); byFn[k][i.population] = (byFn[k][i.population] || 0) + 1; if (i.status === 'Responded') byFn[k].responded++; }
    sec('1.6 ' + T('sample'), { text: T('sampleIntro', { n: inv.length, r: inv.filter(i => i.status === 'Responded').length }), table: { columns: [T('function'), ...pops.map(x => t('pop.' + x, lang)), T('responded')], rows: Object.entries(byFn).map(([k, v]) => [k, ...pops.map(x => String(v[x] || 0)), String(v.responded)]) } });
  } else sec('1.6 ' + T('sample'), notice(T('whatSample'), 'MP-54'));
  put(1, 7, det.c1);

  // ---------------------------------------------------------------- 2. Previous training plan
  const prev = {}; for (const s of sets) for (const [k, v] of Object.entries(s.previousPlan)) (prev[k] ||= { question: v.question, answers: [] }).answers.push(...v.answers);
  const th = merge('trainingHistory');
  sec('2. ' + T('previousPlan'), Object.keys(prev).length ? { table: { columns: [T('question'), T('answers')], rows: Object.values(prev).map(x => [x.question, uniq(x.answers).join('\n')]) } } : notice(T('whatPrevious'), T('stepQuestionnaires')));
  if (th.length) sec('2.1 ' + T('trainingHistory'), { table: { columns: [T('training'), T('monthYear'), T('days'), T('learnings')], rows: th.map(x => [x.title || '', x.month_year || '', x.days || '', x.learnings || '']) } });

  // ---------------------------------------------------------------- 3. Competence needs
  sec('3. ' + T('needs'));
  const sos = src('StrategicObjective', recs('StrategicObjective', projectId), 'MP-01');
  const axes = uniq(strategy.priority_axes?.values || []);
  sec('3.1 ' + T('needsStrategic'), sos.length || axes.length ? { text: axes.length ? T('priorityAxes') + ': ' + axes.join(' · ') : null, table: { columns: [T('id'), T('objective'), T('horizon')], rows: sos.map(o => [o.code, P(o.statement), o.horizon_date || '']) } } : notice(T('whatObjectives'), 'MP-01'));
  const perf = src('PerformanceAssessment', recs('PerformanceAssessment', projectId), 'MP-02');
  const swf = src('FunctionalSwot', recs('FunctionalSwot', projectId), 'MP-29');
  if (perf.length) {
    const fnNames = uniq(perf.map(x => P(x.function_name)));
    sec('3.2 ' + T('needsFunctions'), { text: T('perfIntro'), table: { columns: [T('function'), 'MS', 'MO', 'OP', T('gaps')], rows: fnNames.map(f => { const c = l => perf.find(x => P(x.function_name) === f && x.level === l); return [f, ...['MS', 'MO', 'OP'].map(l => c(l) ? `${c(l).score_pct}% ${t('status.' + c(l).rag, lang)}` : '—'), uniq(['MS', 'MO', 'OP'].map(l => P(c(l)?.gap_comment))).join(' · ')]; }) } });
    for (const sw of swf) sec(`3.2 ${T('functionSwot')} — ${P(sw.function_name)}`, { table: { columns: [T('strengths'), T('weaknesses'), T('opportunities'), T('threats')], rows: [[P(sw.strengths), P(sw.weaknesses), P(sw.opportunities), P(sw.threats)]] } });
  } else sec('3.2 ' + T('needsFunctions'), notice(T('whatPerformance'), 'MP-02'));
  const comps = []; for (const s of sets) comps.push(...s.competences);
  if (comps.length) sec('3.3 ' + T('competencesMentioned'), { text: T('competencesIntro', { n: respCount }), table: { columns: [T('competence'), T('mentions'), T('populations')], rows: comps.sort((a, b) => b.count - a.count).map(c => [c.competence, String(c.count), c.populations.map(x => t('pop.' + x, lang)).join(', ')]) } });
  const dem = src('TrainingDemand', recs('TrainingDemand', projectId), 'MP-27');
  sec('3.4 ' + T('demands'), dem.length ? { table: { columns: [T('theme'), T('type'), T('priority'), T('status')], rows: dem.map(d => [P(d.theme), t('status.' + d.demand_type, lang) === 'status.' + d.demand_type ? d.demand_type : t('status.' + d.demand_type, lang), t('status.' + d.priority, lang), t('status.' + d.status, lang)]) } } : notice(T('whatDemands'), 'MP-27'));
  const hr = merge('hr');
  sec('3.5 ' + T('hrOrientations'), hr.length ? { table: { columns: [T('orientation'), T('respondent')], rows: hr.map(h => [h.answer, h.respondent || '']) } } : notice(T('whatHr'), T('stepMgmt')));
  sec('3.6 ' + T('changeMgmt'), { text: T('changeMgmtText') });
  const soft = []; for (const s of sets) soft.push(...s.softSkills); const lead = []; for (const s of sets) lead.push(...s.leadership);
  sec('3.7 ' + T('softSkills'), soft.length ? { text: T('softIntro'), table: { columns: [T('competence'), T('average'), 'n'], rows: soft.map(x => [x.label, x.average == null ? '—' : String(x.average), String(x.n)]) } } : notice(T('whatSoft'), T('stepQuestionnaires')));
  if (lead.length) sec('3.7 ' + T('leadership'), { table: { columns: [T('level'), T('average'), 'n'], rows: lead.map(x => [x.label, x.average == null ? '—' : x.average + (x.kind === 'pct' ? ' %' : ' /5'), String(x.n)]) } });
  const tp = []; for (const s of sets) tp.push(...s.transverse);
  sec('3.8 ' + T('transverse'), tp.length ? { table: { columns: [T('process'), T('documented'), T('owner'), T('score')], rows: tp.map(x => [`${x.group} — ${x.label}`, x.documented + '%', x.owner + '%', x.score == null ? '—' : String(x.score)]) } } : notice(T('whatTransverse'), T('stepMgmt')));
  const impact = merge('ambitions').filter(a => a.key === 'impact');
  sec('3.9 ' + T('impact'), impact.length ? { table: { columns: [T('expected'), T('population')], rows: impact.map(a => [a.answer, t('pop.' + a.population, lang)]) } } : notice(T('whatImpact'), T('stepQuestionnaires')));
  put(3, 10, det.c3);

  // ---------------------------------------------------------------- 4. Perspectives
  const ax = src('ImprovementAxis', recs('ImprovementAxis', projectId), 'MP-29').sort((a, b) => (a.priority_rank || 9) - (b.priority_rank || 9));
  const ri = recs('RoadmapInitiative', projectId);
  sec('4. ' + T('perspectives'), ax.length ? { text: T('perspectivesIntro'), table: { columns: ['#', T('axis'), T('implementation'), T('wave')], rows: ax.map(a => [String(a.priority_rank), P(a.label), (a.implementation_pct ?? 0) + '%', String(ri.find(x => P(x.label) === P(a.label))?.phase ?? '—')]) } } : notice(T('whatAxes'), 'MP-29'));

  put(4, 1, det.c4);

  // ---------------------------------------------------------------- 5. Prioritized training plan
  const themes = src('TrainingTheme', recs('TrainingTheme', projectId), 'MP-03').sort((a, b) => (a.priority_rank || 99) - (b.priority_rank || 99));
  const budget = src('BudgetLine', recs('BudgetLine', projectId), 'MP-49');
  sec('5. ' + T('plan'), themes.length ? { text: plan ? T('planIntro', { year: plan.plan_year, status: t('status.' + plan.status, lang), budget: Number(plan.total_budget || 0).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US') }) : null,
    table: { columns: ['#', T('theme'), T('daysPerTheme'), T('groupsPerTheme'), T('budget')], rows: themes.map(x => [String(x.priority_rank), P(x.name), String(x.days_per_group ?? ''), String(x.group_count ?? ''), Number(x.budget || 0).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')]) } } : notice(T('whatThemes'), 'MP-03'));
  const programs = src('TrainingProgram', recs('TrainingProgram', projectId), 'MP-49');
  const courses = src('TrainingCourse', recs('TrainingCourse', projectId), 'MP-05');
  const personas = new Map(orgRecs('Persona', orgId).map(x => [x.id, P(x.name)]));
  if (courses.length) {
    sec('5.1 ' + T('trainings'), { table: { columns: [t('tp.program', lang), t('tp.trainingId', lang), t('tp.trainingName', lang), t('tp.level', lang), t('tp.duration', lang), t('tp.prerequisites', lang)],
      rows: courses.map(c => [P(programs.find(x => x.id === c.program_id)?.name), c.training_code, P(c.name), t('level.' + c.level, lang), t('tp.days', lang, { n: c.duration_days }), P(c.prerequisites) || '—']) } });
    for (const c of courses) {
      const rules = checkRules(c);
      if (!rules.ok) findings.push({ code: 'goldenRules', blocking: false, location: c.training_code, n: rules.issues.length });
      sec(`5.2 ${c.training_code} — ${P(c.name)}`, { text: `${t('tp.objectives', lang)}: ${(c.objectives || []).map(o => P(o)).join(' · ')}`,
        table: { columns: [t('tp.halfDay', lang), t('tp.itemType', lang), t('tp.itemTitle', lang), t('tp.minutes', lang)], rows: (c.agenda || []).flatMap(h => (h.items || []).map((x, k) => [k ? '' : P(h.label), t('item.' + x.type, lang), P(x.title), String(x.minutes || '')])) } });
      if ((c.personas || []).length) sec(`5.2 ${c.training_code} — ${t('tp.valueProposition', lang)}`, { table: { columns: [t('tp.persona', lang), t('tp.painPoints', lang), t('tp.hopes', lang), t('tp.fit', lang)], rows: c.personas.map(x => [personas.get(x.persona_id) || '—', P(x.pain_points), P(x.hopes), P(x.fit)]) } });
    }
  } else sec('5.1 ' + T('trainings'), notice(T('whatTrainings'), 'MP-05'));

  put(5, 3, det.c5);
  if (det.c6.length) { sec('6. ' + det.c6[0].heading, { table: det.c6[0].table }); put(6, 1, det.c6.slice(1)); }

  // ---------------------------------------------------------------- 7. Annexes, sources, revision history
  sec('7. ' + T('annexes'), { table: { columns: [T('form'), T('population'), T('sections')], rows: qs.flatMap(q => (q.forms || []).map(f => [`${f.form || f.code} — ${P(f.name)}`, t('pop.' + f.population, lang), String((f.sections || []).length)])) } });
  put(7, 1, det.annex);
  // Consistency checks (FR-DA-DGC-07): totals agree with their rows, mandatory sections filled.
  if (plan && budget.length) { const sum = budget.reduce((s, b) => s + (Number(b.planned_amount) || 0), 0); if (Math.abs(sum - Number(plan.total_budget || 0)) > 1) findings.push({ code: 'budgetTotal', blocking: false, location: '5', planned: sum, total: plan.total_budget }); }
  if (!themes.length) findings.push({ code: 'noThemes', blocking: true, location: '5' });
  for (const s of S) if (s.notice) findings.push({ code: 'missingData', blocking: false, location: s.heading });
  sec(T('sources'), { text: T('sourcesIntro', { date: new Date(meta.dataAsOf || now()).toLocaleString(lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-MA' : 'en-GB') }), table: { columns: [T('source'), T('records'), T('step'), T('latest')], rows: sources.map(x => [x.source, String(x.records), x.step, x.latest ? x.latest.slice(0, 10) : '—']) } });
  if (meta.history?.length) sec(T('revisions'), { table: { columns: [T('version'), T('status'), T('date'), T('author'), T('note')], rows: meta.history.map(h => [String(h.version), t('status.' + h.status, lang), h.date?.slice(0, 10) || '', h.author || '', h.note || '']) } });
  sec(T('approval'), { table: { columns: [T('role'), T('name'), T('date'), T('signature')], rows: [[T('author'), meta.author || '', '', ''], [T('approver'), meta.approver || '', '', '']] } });

  const model = { id: 'TER', cadence: String(p.plan_year || ''), title: T('title', { org: P(J(org.name, org.name)), year: p.plan_year || '' }), subtitle: P(J(p.name, p.name)), audience: T('audience'), generated: now(), lang,
    sections: S.map(s => ({ heading: s.heading, text: s.text || null, table: s.table || null })) };
  return { model, sources, findings, dataAsOf: now() };
}
/** Latest change of the data a document draws on, to show whether a published version is out of date (FR-DA-DGC-09). */
export function latestSourceChange(projectId) {
  return one(`SELECT MAX(updated_at) m FROM records WHERE project_id=? AND entity IN ('QuestionnaireResponse','StrategicObjective','PerformanceAssessment','FunctionalSwot','TrainingDemand','ImprovementAxis','TrainingTheme','BudgetLine','TrainingProgram','TrainingCourse','TrainingPlan')`, projectId)?.m || null;
}
export { formOf };
