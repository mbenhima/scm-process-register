// Training plan (E2E-01): strategic objectives and their link to functions, the priority competencies and the targets
// of the plan read from the gaps, the training needs built from them, the budget envelope, its split by theme and site,
// the expected refunds, the change impact and adoption plan, the steering milestones, the approval (which creates the
// courses of the plan) and the distribution of the approved plan by e-mail or WhatsApp.
import * as C from './flowcore.js';
import { gapStats, relevant } from './flow02.js';
import { orgCurrencies } from './money.js';
import { normalizePhone } from './channels.js';
const { T, ml, str, norm, num, avg, round1, today, dplus, fmtN } = C;

const COST = { MAD: [3000, 7000], EUR: [300, 700], USD: [330, 770], GBP: [260, 600], XOF: [200000, 450000] };
const costDay = (orgId, provider) => { const cur = orgCurrencies(orgId).default; const c = COST[cur] || COST.USD; return { cur, value: provider === 'External' ? c[1] : c[0] }; };
const GROUP = 12;

/* ------------------------------------------------------------------ MP-01.1 objectives, MP-01.2 functions */
function tplObjectives({ req, t, lang }) {
  const p = C.projectOf(t.project_id); const v = C.sectorSeed(C.orgOf(req.orgId).sector); const core = C.pick(v?.coreFunction?.name, lang) || T(lang, 'the core function', 'la fonction cœur', 'الوظيفة الأساسية');
  const focus = p.focus || 'All'; const th = [...(focus !== 'Digital' ? v?.themes?.ai || [] : []), ...(focus !== 'AI' ? v?.themes?.digital || [] : [])].slice(0, 2);
  const rows = th.map((x, i) => ({ code: `OS-${i + 1}`, item: T(lang, `Adopt ${C.pick(x, lang)} in ${core} by the end of ${C.planYear(p)}`, `Adopter ${C.pick(x, lang)} dans ${core} d’ici fin ${C.planYear(p)}`, `اعتماد ${C.pick(x, lang)} في ${core} قبل نهاية ${C.planYear(p)}`),
    indicator: T(lang, 'Share of the staff concerned using it', 'Part du personnel concerné qui l’utilise', 'نسبة المستخدمين'), baseline: '0 %', target: '80 %', deadline: C.yearEnd(p), owner: req.user.name }));
  rows.push({ code: `OS-${rows.length + 1}`, item: T(lang, 'Keep the critical skill gaps under 10 %', 'Ramener les écarts de compétences critiques sous 10 %', 'خفض الفجوات الحرجة إلى أقل من 10%'), indicator: T(lang, 'Critical gap rate (KPI-003)', 'Taux d’écarts critiques (KPI-003)', 'نسبة الفجوات الحرجة'), baseline: '', target: '≤ 10 %', deadline: C.yearEnd(p), owner: req.user.name });
  return rows;
}
function aiObjectives({ req, t, lang }) {
  const p = C.projectOf(t.project_id); const s = gapStats(t, lang);
  const rows = s.byComp.filter(a => a.avgGap > 0).slice(0, 3).map((a, i) => ({ code: `OS-${i + 1}`, item: T(lang, `Raise the average level in ${a.name} from ${fmtN(a.avgLevel, lang)} to ${Math.ceil(a.avgTarget)}`, `Porter le niveau moyen en ${a.name} de ${fmtN(a.avgLevel, lang)} à ${Math.ceil(a.avgTarget)}`, `رفع المستوى المتوسط في ${a.name} من ${fmtN(a.avgLevel, lang)} إلى ${Math.ceil(a.avgTarget)}`),
    indicator: T(lang, `Average validated level ${a.code} (1–4)`, `Niveau moyen validé ${a.code} (1–4)`, `المستوى المتوسط ${a.code}`), baseline: fmtN(a.avgLevel, lang), target: String(Math.ceil(a.avgTarget)), deadline: C.yearEnd(p), owner: req.user.name }));
  const crit = s.g.length ? Math.round((s.crit / s.g.length) * 100) : 0;
  rows.push({ code: `OS-${rows.length + 1}`, item: T(lang, 'Bring the critical skill gaps under 10 %', 'Ramener les écarts de compétences critiques sous 10 %', 'خفض الفجوات الحرجة إلى أقل من 10%'), indicator: T(lang, 'Critical gap rate (KPI-003)', 'Taux d’écarts critiques (KPI-003)', 'نسبة الفجوات الحرجة'), baseline: `${crit} %`, target: '≤ 10 %', deadline: C.yearEnd(p), owner: req.user.name });
  return rows;
}
function completeObjectives({ req, t, rows }) {
  const keep = new Set(); rows.forEach((r, i) => { const code = String(r.code || '').trim() || `OS-${i + 1}`; const k = 'obj|' + norm(code); keep.add(k);
    C.upsert(req, t, 'StrategicObjective', k, { code, statement: ml(str(r.item)), label: ml(code), indicator: str(r.indicator), baseline: str(r.baseline), target: str(r.target), horizon_date: r.deadline || null, owner: str(r.owner), flow_step: 'MP-01.1' }, code); });
  C.prune('StrategicObjective', t.project_id, 'MP-01.1', keep);
}
const scopeFunctions = (t, lang = 'fr') => { const m = new Map(); for (const s of C.stakeholders(t.project_id)) { const f = C.fnOf(s, lang); if (f && !m.has(norm(f))) m.set(norm(f), { fn: f, site: s.site }); } return [...m.values()]; };
function tplObjFunctions({ req, t, lang }) {
  const core = C.pick(C.sectorSeed(C.orgOf(req.orgId).sector)?.coreFunction?.name, lang); const out = [];
  for (const o of C.objectives(t.project_id)) for (const f of scopeFunctions(t, lang)) out.push({ objective: o.code, function: f.fn, site: f.site || '', contribution: norm(f.fn) === norm(core) ? 'Primary' : 'Secondary', description: '', owner: req.user.name });
  return out;
}
function aiObjFunctions({ req, t, lang }) {
  const g = C.gaps(t.project_id); const st = C.stakeholders(t.project_id); const out = [];
  for (const o of C.objectives(t.project_id)) {
    const stmt = norm(str(o.statement, lang)); const comps = C.competencies(t.project_id).filter(c => stmt.includes(norm(C.compName(c, lang)).slice(0, 12)) || stmt.includes(norm(c.code)));
    const people = g.filter(x => x.gap_value > 0 && (!comps.length || comps.some(c => c.code === x.competency_code))).map(x => x.employee);
    const fns = new Map(); for (const n of people) { const s = st.find(y => norm(y.name) === norm(n)); const fname = s ? C.fnOf(s, lang) : ''; if (fname) { const k = norm(fname); const a = fns.get(k) || { fn: fname, site: s.site, n: 0 }; a.n++; fns.set(k, a); } }
    const list = fns.size ? [...fns.values()] : scopeFunctions(t, lang).map(x => ({ ...x, n: 0 }));
    for (const f of list) out.push({ objective: o.code, function: f.fn, site: f.site || '', contribution: f.n >= 2 ? 'Primary' : 'Secondary', description: f.n ? T(lang, `${f.n} person(s) of this function have a gap on the competencies of the objective.`, `${f.n} personne(s) de cette fonction ont un écart sur les compétences de l’objectif.`, `${f.n} أشخاص في فجوة.`) : '', owner: req.user.name });
  }
  return out;
}

/* ------------------------------------------------------------------ UFT-01-03 priorities and plan targets */
function priorities(t, lang, ai) {
  const s = gapStats(t, lang); const objs = C.objectives(t.project_id);
  const scored = s.byComp.filter(a => a.avgGap > 0).map(a => { const obj = objs.find(o => norm(str(o.statement, lang)).includes(norm(a.name).slice(0, 12)) || norm(str(o.indicator)).includes(norm(a.code)));
    const score = ai ? a.avgGap * (1 + a.crit / Math.max(1, a.gaps.length)) * (obj ? 1.5 : 1) : a.avgGap; return { ...a, obj, score: round1(score) }; }).sort((x, y) => y.score - x.score);
  return scored.map((a, i) => ({ competency: a.code, avgGap: a.avgGap, people: a.people, priority: String(i < Math.ceil(scored.length / 3) ? 1 : i < Math.ceil((2 * scored.length) / 3) ? 2 : 3), objective: a.obj?.code || '',
    rationale: ai ? T(lang, `Score ${fmtN(a.score, lang)} = average gap ${fmtN(a.avgGap, lang)} × share of critical gaps${a.obj ? ` × objective ${a.obj.code}` : ''}.`, `Score ${fmtN(a.score, lang)} = écart moyen ${fmtN(a.avgGap, lang)} × part d’écarts critiques${a.obj ? ` × objectif ${a.obj.code}` : ''}.`, `النقطة ${fmtN(a.score, lang)}.`)
      : T(lang, `Ranked by average gap (${fmtN(a.avgGap, lang)}).`, `Classée par écart moyen (${fmtN(a.avgGap, lang)}).`, `مرتبة حسب متوسط الفجوة.`) }));
}
function completePriorities({ req, t, rows }) { for (const r of rows) { const c = C.compByCode(t.project_id, str(r.competency)); if (c) C.patch(c._id, { priority: num(r.priority), priority_objective: str(r.objective) || null, priority_rationale: str(r.rationale) }, req.user.id); } }
function planTargets(t, lang, ai) {
  const p = C.projectOf(t.project_id); const pri = C.competencies(t.project_id).filter(c => c.priority === 1 || c.priority === 2); const out = [];
  for (const c of pri) {
    const byPos = new Map(); for (const g of C.gaps(t.project_id).filter(x => x.competency_code === c.code)) { const a = byPos.get(g.position) || { pos: g.position, lv: [], target: g.target_level, gap: 0 }; a.lv.push(g.validated_level); a.gap += g.gap_value; byPos.set(g.position, a); }
    for (const a of byPos.values()) { if (!a.gap) continue; const cur = avg(a.lv); out.push({ competency: c.code, position: a.pos, current: cur, planTarget: String(ai ? Math.min(a.target, Math.ceil(cur) + 1) : a.target), deadline: C.yearEnd(p), owner: '' }); }
  }
  return out;
}

/* ------------------------------------------------------------------ UFT-01-04 needs */
export function buildNeeds(req, t) {
  const lang = req.lang; const rows = C.rowsOfStep(t.project_id, 'MP-02.2', 'UFT-01-03'); const keep = new Set(); let n = 0;
  for (const r of rows) {
    const c = C.compByCode(t.project_id, str(r.competency)); const pos = str(r.position); if (!c) continue;
    const people = C.gaps(t.project_id).filter(g => g.competency_code === c.code && norm(g.position) === norm(pos) && g.validated_level < Number(r.planTarget)).map(g => g.employee);
    if (!people.length) continue; const k = `need|${norm(c.code)}|${norm(pos)}`; keep.add(k);
    C.upsert(req, t, 'TrainingNeed', k, { source: 'Gap', title: c.name, theme: c.name, label: c.name, competency_code: c.code, position: pos, people: people.length, learners: people, current_level: num(r.current), target_level: Number(r.planTarget), priority: c.priority || 2,
      deadline: r.deadline || null, validation_status: 'Validated', impact_score: c.priority === 1 ? 5 : 4, flow_step: 'UFT-01-04' }); n++;
  }
  C.prune('TrainingNeed', t.project_id, 'UFT-01-04', keep);
  return n;
}
const gapNeeds = t => C.needs(t.project_id).filter(n => n.flow_step === 'UFT-01-04');
function needsPanel({ req, t, lang }) {
  const nd = gapNeeds(t); const fed = C.needs(t.project_id).filter(n => n.source === 'Questionnaire');
  return { notes: [T(lang, 'One need per priority competency and position: the people whose validated level is below the target of the plan.', 'Un besoin par compétence prioritaire et par poste : les personnes dont le niveau validé est sous la cible du plan.', 'حاجة لكل كفاءة ومنصب.')],
    kpis: [{ label: T(lang, 'Needs from the gaps', 'Besoins issus des écarts', 'حاجيات من الفجوات'), value: nd.length }, { label: T(lang, 'Learners', 'Apprenants', 'المتعلمون'), value: new Set(nd.flatMap(n => n.learners || [])).size }, { label: T(lang, 'Needs from the questionnaire', 'Besoins issus du questionnaire', 'حاجيات من الاستبيان'), value: fed.length }],
    tables: [{ title: T(lang, 'Training needs', 'Besoins de formation', 'حاجيات التكوين'), csv: true, columns: [['need', T(lang, 'Need', 'Besoin', 'الحاجة')], ['position', T(lang, 'Position', 'Poste', 'المنصب')], ['people', T(lang, 'People', 'Personnes', 'الأشخاص')], ['levels', T(lang, 'Level → target', 'Niveau → cible', 'المستوى ← الهدف')], ['priority', T(lang, 'Priority', 'Priorité', 'الأولوية')], ['who', T(lang, 'Who', 'Qui', 'من')]],
      rows: nd.map(n => ({ need: `${n.competency_code} — ${str(n.title, lang)}`, position: n.position, people: n.people, levels: `${fmtN(n.current_level, lang)} → ${n.target_level}`, priority: n.priority, who: (n.learners || []).join(', ') })) }],
    actions: [{ key: 'needs', label: T(lang, 'Build the needs', 'Construire les besoins', 'بناء الحاجيات'), icon: 'ListPlus', primary: true }] };
}
const needsFindings = (t, lang) => { const nd = gapNeeds(t); return T(lang, `${nd.length} need(s) built from the priority gaps, ${new Set(nd.flatMap(n => n.learners || [])).size} learner(s).`, `${nd.length} besoin(s) construits à partir des écarts prioritaires, ${new Set(nd.flatMap(n => n.learners || [])).size} apprenant(s).`, `${nd.length} حاجة.`) + '\n' + nd.map(n => `• ${n.competency_code} ${str(n.title, lang)} — ${n.position} : ${n.people} (${(n.learners || []).join(', ')})`).join('\n'); };

/* ------------------------------------------------------------------ MP-01.3 envelope, MP-18 budget and refunds */
function themeRows(req, t, lang, ai) {
  const by = new Map();
  for (const n of gapNeeds(t)) { const a = by.get(n.competency_code) || { code: n.competency_code, name: str(n.title, lang), people: new Set(), positions: new Set(), priority: n.priority }; (n.learners || []).forEach(x => a.people.add(x)); a.positions.add(n.position); a.priority = Math.min(a.priority, n.priority); by.set(n.competency_code, a); }
  const site = C.stakeholders(t.project_id).find(s => s.site)?.site || C.orgOf(req.orgId).city || '';
  return [...by.values()].map(a => { const people = a.people.size; const groups = Math.max(1, Math.ceil(people / GROUP)); const provider = ai && a.priority === 1 ? 'External' : 'Internal'; const days = ai ? (a.priority === 1 ? 2 : 1) : 1; const cd = costDay(req.orgId, provider);
    const mgr = [...a.positions].some(p => /(cadre|chef|responsable|manager|direct)/i.test(p));
    return { theme: a.name, competency: a.code, site, people: String(people), groups: String(groups), days: String(days), costDay: String(cd.value), budget: String(groups * days * cd.value), currency: cd.cur, modality: ai && mgr ? 'Blended' : 'On site', provider, owner: req.user.name }; });
}
function tplEnvelope({ req, t, lang }) { const rows = themeRows(req, t, lang, false); const sum = rows.reduce((s, r) => s + Number(r.budget), 0); const p = C.projectOf(t.project_id);
  return { amount: String(Math.round(sum * 1.1)), currency: orgCurrencies(req.orgId).default, year: String(C.planYear(p)), source: 'Training', contingency: '10', rationale: T(lang, `${rows.length} theme(s), one day per group of ${GROUP} at the internal cost per day, plus 10 % contingency.`, `${rows.length} thème(s), une journée par groupe de ${GROUP} au coût interne par jour, plus 10 % d’aléas.`, `${rows.length} محاور.`) }; }
function aiEnvelope({ req, t, lang }) { const rows = themeRows(req, t, lang, true); const sum = rows.reduce((s, r) => s + Number(r.budget), 0); const p = C.projectOf(t.project_id);
  return { amount: String(Math.round(sum * 1.1)), currency: orgCurrencies(req.orgId).default, year: String(C.planYear(p)), source: 'Training', contingency: '10',
    rationale: T(lang, `Built from the needs: ${rows.map(r => `${r.theme} ${r.groups} group(s) × ${r.days} day(s) ${r.provider === 'External' ? 'external' : 'internal'}`).join('; ')}; total ${fmtN(sum, lang)} ${rows[0]?.currency || ''} + 10 % contingency.`, `Construit à partir des besoins : ${rows.map(r => `${r.theme} ${r.groups} groupe(s) × ${r.days} jour(s) ${r.provider === 'External' ? 'externe' : 'interne'}`).join(' ; ')} ; total ${fmtN(sum, lang)} ${rows[0]?.currency || ''} + 10 % d’aléas.`, `مبني على الحاجيات.`) }; }
function completeEnvelope({ req, t, fields }) {
  const p = C.projectOf(t.project_id);
  C.upsert(req, t, 'TrainingPlan', 'plan', { label: ml(`${T(req.lang, 'Training plan', 'Plan de formation', 'خطة التكوين')} ${fields.year || C.planYear(p)}`), plan_year: Number(fields.year) || C.planYear(p), envelope: num(fields.amount), currency: fields.currency || orgCurrencies(req.orgId).default, contingency: num(fields.contingency), status: 'Draft', flow_step: 'MP-01.3' });
}
const plan = t => C.recs('TrainingPlan', t.project_id).find(x => x.flow_key === 'plan');
function completeBudget({ req, t, rows }) {
  const env = plan(t)?.envelope; const total = rows.reduce((s, r) => s + (num(r.budget) || 0), 0);
  if (env != null && total > env) throw C.err('err.flowBudgetOver', { total: fmtN(total, req.lang), envelope: fmtN(env, req.lang) });
  const keep = new Set(); const bkeep = new Set();
  rows.forEach((r, i) => { const name = str(r.theme).trim(); const k = 'theme|' + norm(name); keep.add(k); const c = C.compByCode(t.project_id, str(r.competency)) || C.competencies(t.project_id).find(x => norm(C.compName(x, 'fr')) === norm(name) || norm(C.compName(x, 'en')) === norm(name));
    const need = gapNeeds(t).filter(n => n.competency_code === (c?.code || ''));
    C.upsert(req, t, 'TrainingTheme', k, { name: ml(name), name_text: name, label: ml(name), competency_code: c?.code || null, site: str(r.site) || null, people: num(r.people), group_count: num(r.groups), days_per_group: num(r.days), cost_per_day: num(r.costDay), budget: num(r.budget), currency: r.currency || null,
      modality: r.modality || 'On site', trainer: r.provider === 'External' ? 'External' : 'Internal', provider: r.provider || 'Internal', priority_rank: Math.min(...need.map(n => n.priority), 9) === 9 ? i + 1 : Math.min(...need.map(n => n.priority)), learners: [...new Set(need.flatMap(n => n.learners || []))], owner: str(r.owner), flow_step: 'MP-18.1' });
    const bk = 'budget|' + norm(name); bkeep.add(bk); C.upsert(req, t, 'BudgetLine', bk, { label: ml(name), theme: name, site: str(r.site) || null, allocated_amount: num(r.budget) || 0, planned_amount: num(r.budget) || 0, committed_amount: 0, actual_amount: 0, currency: r.currency || null, flow_step: 'MP-18.1' }); });
  C.prune('TrainingTheme', t.project_id, 'MP-18.1', keep); C.prune('BudgetLine', t.project_id, 'MP-18.1', bkeep);
  const pl = plan(t); if (pl) C.patch(pl._id, { total_budget: total, total_days: rows.reduce((s, r) => s + (num(r.days) || 0) * (num(r.groups) || 1), 0) }, req.user.id);
}
const RATE = 70; // refund rate set for the Organization; the eligible share of external training
function refunds(t, lang, ai) {
  return C.themes(t.project_id).map(x => { const elig = ai ? x.provider === 'External' : true; const rate = elig ? RATE : 0;
    return { theme: x.name_text, budget: String(x.budget || 0), scheme: elig ? 'CSF' : 'None', rate: String(rate), refund: String(Math.round(((x.budget || 0) * rate) / 100)), filing: dplus(30) }; });
}
function completeRefunds({ req, t, rows }) { for (const r of rows) { const b = C.recs('BudgetLine', t.project_id).find(x => norm(x.theme) === norm(str(r.theme))); if (b) C.patch(b._id, { refund_scheme: r.scheme, refund_rate: num(r.rate), refund_forecast: num(r.refund) || 0, refund_filing: r.filing || null }, req.user.id); } }

/* ------------------------------------------------------------------ MP-19 change impact and adoption, MP-01.4 milestones */
const IMPACT_KEYS = ['Practices', 'Workload', 'Skills', 'Tools', 'Resistance'];
function tplImpact({ t }) { const out = []; for (const pos of [...new Set(C.targets(t.project_id).map(x => x.position))]) for (const k of IMPACT_KEYS) out.push({ population: pos, criterion: k, weight: '20', score: '3', facts: '' }); return out; }
function aiImpact({ t, lang }) {
  const out = [];
  for (const pos of [...new Set(C.targets(t.project_id).map(x => x.position))]) {
    const g = C.gaps(t.project_id).filter(x => norm(x.position) === norm(pos)); const ag = avg(g.map(x => x.gap_value)) || 0; const ai = g.some(x => C.compByCode(t.project_id, x.competency_code)?.family === 'AI');
    const sc = { Practices: ai ? 4 : 3, Workload: 3, Skills: Math.min(5, Math.max(1, Math.round(ag + 2))), Tools: ai ? 4 : 2, Resistance: ag >= 1.5 ? 4 : 2 };
    const facts = { Practices: ai ? T(lang, 'AI suggestions enter the clinical routine.', 'Les suggestions de l’IA entrent dans la routine clinique.', 'تدخل اقتراحات الذكاء الاصطناعي الروتين.') : '', Workload: T(lang, 'Training time to free in the schedule.', 'Temps de formation à libérer dans les plannings.', 'وقت تكوين يجب توفيره.'), Skills: T(lang, `Average gap ${fmtN(ag, lang)} on ${g.length} pair(s).`, `Écart moyen ${fmtN(ag, lang)} sur ${g.length} couple(s).`, `متوسط الفجوة ${fmtN(ag, lang)}.`), Tools: ai ? T(lang, 'New AI tools to learn.', 'Nouveaux outils d’IA à prendre en main.', 'أدوات جديدة.') : '', Resistance: ag >= 1.5 ? T(lang, 'Large gaps: risk of reluctance.', 'Écarts importants : risque de réticence.', 'فجوات كبيرة.') : '' };
    for (const k of IMPACT_KEYS) out.push({ population: pos, criterion: k, weight: '20', score: String(sc[k]), facts: facts[k] });
  }
  return out;
}
function adoption(t, lang, req, ai) {
  const st = C.stakeholders(t.project_id); const sponsor = st.find(s => s.category === 'Sponsor') || st.find(s => s.population === 'DG'); const relay = st.filter(s => s.category === 'Change relay');
  const cadre = st.find(s => s.decision_level === 'MO'); const me = req.user.name; const d0 = today();
  const rows = [
    { item: T(lang, 'Launch message from the sponsor to all staff concerned', 'Message de lancement du sponsor à tout le personnel concerné', 'رسالة إطلاق من الراعي'), owner: sponsor?.name || me, start: dplus(7, d0), end: dplus(7, d0), deliverable: T(lang, 'Message sent', 'Message envoyé', 'رسالة مرسلة') },
    { item: T(lang, 'Name one AI referent per service', 'Désigner un référent IA par service', 'تعيين مرجع لكل مصلحة'), owner: cadre?.name || me, start: dplus(7, d0), end: dplus(21, d0), deliverable: T(lang, 'List of referents', 'Liste des référents', 'لائحة المراجع') },
    { item: T(lang, 'Demonstration workshop of the tools before the sessions', 'Atelier de démonstration des outils avant les sessions', 'ورشة عرض الأدوات'), owner: me, start: dplus(21, d0), end: dplus(28, d0), deliverable: T(lang, 'Workshop held', 'Atelier tenu', 'ورشة منجزة') },
    { item: T(lang, 'Questions and answers channel open to the staff', 'Canal de questions-réponses ouvert au personnel', 'قناة أسئلة وأجوبة'), owner: me, start: dplus(7, d0), end: C.yearEnd(C.projectOf(t.project_id)), deliverable: T(lang, 'FAQ updated', 'FAQ à jour', 'أسئلة شائعة') },
    { item: T(lang, 'Adoption check 30 days after the last session', 'Point d’adoption 30 jours après la dernière session', 'نقطة تبني بعد 30 يوماً'), owner: me, start: dplus(120, d0), end: dplus(120, d0), deliverable: T(lang, 'Adoption note', 'Note d’adoption', 'مذكرة التبني') }];
  if (ai) for (const r of relay) rows.push({ item: T(lang, `${r.name} relays the plan to the ${r.role} team and reports the difficulties`, `${r.name} relaie le plan auprès de l’équipe ${r.role} et remonte les difficultés`, `${r.name} ينقل الخطة إلى الفريق`), owner: r.name, audience: r.role, start: dplus(14, d0), end: dplus(120, d0), deliverable: T(lang, 'Monthly feedback', 'Retour mensuel', 'تقرير شهري') });
  return rows.map(r => ({ audience: '', budget: '0', ...r }));
}
function completeAdoption({ req, t, rows }) { const keep = new Set(); rows.forEach(r => { const k = 'act|' + norm(str(r.item)); keep.add(k); C.upsert(req, t, 'Action', k, { title: ml(str(r.item)), label: ml(str(r.item)), action_type: 'Change', owner: str(r.owner), start_date: r.start || null, due_date: r.end || null, deliverable: str(r.deliverable), status: 'Planned', flow_step: 'MP-19.2' }); }); C.prune('Action', t.project_id, 'MP-19.2', keep); }
function milestones(t, lang, req, ai) {
  const d0 = today(); const p = C.projectOf(t.project_id); const st = C.stakeholders(t.project_id); const chair = st.find(s => s.category === 'Sponsor')?.name || req.user.name;
  const base = [[T(lang, 'Launch of the plan', 'Lancement du plan', 'إطلاق الخطة'), 7, T(lang, 'Plan, budget, calendar, roles', 'Plan, budget, calendrier, rôles', 'الخطة والميزانية')], [T(lang, 'Mid-term review', 'Revue à mi-parcours', 'مراجعة منتصف المدة'), 90, T(lang, 'Sessions held, attendance, satisfaction, budget used', 'Sessions tenues, présence, satisfaction, budget consommé', 'الدورات والحضور')], [T(lang, 'End-of-plan review', 'Bilan de fin de plan', 'حصيلة نهاية الخطة'), null, T(lang, 'Kirkpatrick levels 1 to 3, objectives reached, next plan', 'Kirkpatrick niveaux 1 à 3, objectifs atteints, plan suivant', 'مستويات كيركباتريك')]];
  if (ai) base.splice(1, 0, [T(lang, 'Content validation', 'Validation des contenus', 'المصادقة على المحتويات'), 30, T(lang, 'Expert review of each course', 'Revue experte de chaque formation', 'مراجعة الخبراء')], [T(lang, 'End of the priority-1 sessions', 'Fin des sessions de priorité 1', 'نهاية دورات الأولوية 1'), 75, T(lang, 'Levels 1 and 2 of the first sessions', 'Niveaux 1 et 2 des premières sessions', 'المستويان 1 و2')]);
  return base.map(([item, d, agenda]) => ({ item, owner: chair, start: d == null ? C.yearEnd(p) : dplus(d, d0), agenda, deliverable: T(lang, 'Minutes', 'Compte rendu', 'محضر') }));
}

/* ------------------------------------------------------------------ MP-04.1 upstream, MP-01.6 approval, MP-01.7 distribution */
function upstream(req, t, lang) {
  const doc = C.one(`SELECT version FROM documents WHERE project_id=? AND doc_type='DT-E2E-01' ORDER BY version DESC LIMIT 1`, t.project_id);
  return [[T(lang, 'Competency framework', 'Référentiel de compétences', 'مرجعية الكفاءات'), C.competencies(t.project_id).length], [T(lang, 'Targets per position', 'Cibles par poste', 'أهداف المناصب'), C.targets(t.project_id).length],
    [T(lang, 'Validated inventory', 'Inventaire validé', 'الجرد المعتمد'), C.assessments(t.project_id).filter(a => a.validated_level != null).length], [T(lang, 'Gaps', 'Écarts', 'الفجوات'), C.gaps(t.project_id).length],
    [T(lang, 'Strategic objectives', 'Objectifs stratégiques', 'الأهداف'), C.objectives(t.project_id).length], [T(lang, 'Training needs', 'Besoins de formation', 'الحاجيات'), gapNeeds(t).length],
    [T(lang, 'Budget envelope', 'Enveloppe budgétaire', 'الغلاف'), plan(t)?.envelope ? 1 : 0], [T(lang, 'Budget per theme', 'Budget par thème', 'الميزانية حسب المحور'), C.themes(t.project_id).length],
    [T(lang, 'Adoption plan', 'Plan d’adoption', 'خطة التبني'), C.recs('Action', t.project_id).filter(a => a.flow_step === 'MP-19.2').length], [T(lang, 'Approval file (DT-E2E-01)', 'Dossier d’approbation (DT-E2E-01)', 'ملف المصادقة'), doc ? 1 : 0]];
}
function upstreamPanel({ req, t, lang }) { const u = upstream(req, t, lang); return { notes: [T(lang, 'Each deliverable of the previous steps must exist before the plan goes to the steering committee.', 'Chaque livrable des étapes précédentes doit exister avant que le plan passe en comité de pilotage.', 'يجب توفر كل مخرج قبل اللجنة.')],
  tables: [{ title: T(lang, 'Upstream deliverables', 'Livrables amont', 'المخرجات السابقة'), columns: [['item', T(lang, 'Deliverable', 'Livrable', 'المخرج')], ['n', T(lang, 'Records', 'Enregistrements', 'سجلات')], ['ok', T(lang, 'Ready', 'Prêt', 'جاهز')]], rows: u.map(([item, n]) => ({ item, n, ok: n ? '✓' : '✗' })) }] }; }
function planSummary(t, lang) { const th = C.themes(t.project_id); const pl = plan(t) || {}; const total = th.reduce((s, x) => s + (x.budget || 0), 0);
  return { th, pl, total, text: T(lang, `${th.length} theme(s), ${new Set(th.flatMap(x => x.learners || [])).size} learner(s), ${th.reduce((s, x) => s + (x.group_count || 1) * (x.days_per_group || 1), 0)} training day(s), budget ${fmtN(total, lang)} ${pl.currency || ''} within an envelope of ${fmtN(pl.envelope, lang)}.`, `${th.length} thème(s), ${new Set(th.flatMap(x => x.learners || [])).size} apprenant(s), ${th.reduce((s, x) => s + (x.group_count || 1) * (x.days_per_group || 1), 0)} jour(s) de formation, budget ${fmtN(total, lang)} ${pl.currency || ''} pour une enveloppe de ${fmtN(pl.envelope, lang)}.`, `${th.length} محاور.`) }; }
const tplApprove = ({ t, lang }) => ({ decision: 'Approved', rationale: planSummary(t, lang).text });
function aiApprove({ t, lang }) { const s = planSummary(t, lang); const p1 = s.th.filter(x => x.priority_rank === 1).map(x => x.name_text);
  return { decision: 'Approved', rationale: s.text + ' ' + T(lang, 'The objectives, gaps and budget are consistent.', 'Les objectifs, les écarts et le budget sont cohérents.', 'الأهداف والفجوات والميزانية متناسقة.'), conditions: p1.length ? T(lang, `Start with the priority-1 themes: ${p1.join(', ')}.`, `Commencer par les thèmes de priorité 1 : ${p1.join(', ')}.`, `البدء بمحاور الأولوية 1.`) : '' }; }
function completeApprove({ req, t, fields }) {
  const pl = plan(t); const ok = /^Approved/.test(fields.decision || '');
  if (pl) C.patch(pl._id, { status: ok ? 'Approved' : fields.decision, approved_at: ok ? today() : null, approved_by: fields.decidedBy || req.user.name }, req.user.id);
  if (!ok) return;
  const p = C.projectOf(t.project_id); const prog = C.upsert(req, t, 'TrainingProgram', 'prog', { code: `PRG-${C.planYear(p)}`, name: ml(`${T(req.lang, 'Training plan', 'Plan de formation', 'خطة التكوين')} ${C.planYear(p)}`), axis: ml(T(req.lang, 'Skills of the plan', 'Compétences du plan', 'كفاءات الخطة')), flow_step: 'MP-01.6' }, `PRG-${C.planYear(p)}`);
  const keep = new Set();
  C.themes(t.project_id).sort((a, b) => (a.priority_rank || 9) - (b.priority_rank || 9)).forEach((x, i) => {
    const code = `TR-${String(i + 1).padStart(2, '0')}`; const k = 'course|' + norm(x.name_text); keep.add(k); const c = C.compByCode(t.project_id, x.competency_code); const nd = gapNeeds(t).filter(n => n.competency_code === x.competency_code);
    const tgt = Math.max(...nd.map(n => n.target_level), 2); const lang = req.lang;
    const objectives = [ml(T(lang, `Explain the principles and limits of ${x.name_text}`, `Expliquer les principes et les limites de ${x.name_text}`, `شرح مبادئ وحدود ${x.name_text}`)), ml(T(lang, `Apply ${x.name_text} in the situations of the position, at level ${tgt}`, `Appliquer ${x.name_text} dans les situations du poste, au niveau ${tgt}`, `تطبيق ${x.name_text} في مواقف المنصب`)), ml(T(lang, 'Check the result and record the decision taken', 'Vérifier le résultat et tracer la décision prise', 'التحقق من النتيجة وتوثيق القرار'))];
    const ex = C.courses(t.project_id).find(y => y.flow_key === k);
    C.upsert(req, t, 'TrainingCourse', k, { program_id: prog, training_code: ex?.training_code || code, name: ml(x.name_text), name_text: x.name_text, label: ml(x.name_text), competency_code: x.competency_code, competency_description: str(c?.description), level: tgt >= 3 ? 'Intermediate' : 'Foundation', objectives,
      duration_days: x.days_per_group || 1, hours: (x.days_per_group || 1) * 7, groups: x.group_count || 1, modality: x.modality || 'On site', provider: x.provider || 'Internal', learners: x.learners || [], review_status: ex?.review_status || 'Draft', status: ex?.status || 'Planned', flow_step: 'MP-01.6' }, ex?.training_code || code);
  });
  C.prune('TrainingCourse', t.project_id, 'MP-01.6', keep);
}
function recipients(t) {
  const st = C.stakeholders(t.project_id).filter(s => ['Sponsor', 'Decision maker', 'Change relay'].includes(s.category) || ['MS', 'MO'].includes(s.decision_level));
  const m = new Map(); for (const s of st) m.set(norm(s.name), { name: s.name, email: s.email, phone: s.phone, channel: s.preferred_channel === 'WhatsApp' && s.phone ? 'WhatsApp' : 'Email', role: s.role });
  for (const e of C.employees(t.project_id)) if (e.manager && !m.has(norm(e.manager))) m.set(norm(e.manager), { name: e.manager, email: e.manager_email, phone: e.manager_phone, channel: e.manager_email ? 'Email' : 'WhatsApp', role: 'Manager' });
  return [...m.values()];
}
function diffusePanel({ req, t, lang }) {
  const pl = plan(t); const sent = C.messagesOf(t.project_id, 'plan'); const s = planSummary(t, lang);
  return { notes: [pl?.status === 'Approved' ? s.text : T(lang, 'The plan is not approved yet (step MP-01.6).', 'Le plan n’est pas encore approuvé (étape MP-01.6).', 'الخطة غير معتمدة بعد.')],
    tables: [{ title: T(lang, 'Recipients', 'Destinataires', 'المرسل إليهم'), columns: [['name', T(lang, 'Name', 'Nom', 'الاسم')], ['role', T(lang, 'Role', 'Rôle', 'الدور')], ['channel', T(lang, 'Channel', 'Canal', 'القناة')], ['status', T(lang, 'Message', 'Message', 'الرسالة')]],
      rows: recipients(t).map(r => { const to = r.channel === 'WhatsApp' ? normalizePhone(r.phone) : r.email; const m = sent.filter(x => x.recipient === to).pop(); return { name: r.name, role: r.role, channel: r.channel === 'WhatsApp' ? 'WhatsApp' : 'E-mail', status: m ? m.status : '—' }; }) }],
    actions: pl?.status === 'Approved' ? [{ key: 'diffuse', label: T(lang, 'Lock and distribute the plan', 'Verrouiller et diffuser le plan', 'قفل الخطة ونشرها'), icon: 'Send', primary: true }] : [] };
}
async function diffuse({ req, t }) {
  const lang = req.lang; const pl = plan(t); if (pl?.status !== 'Approved') throw C.err('err.flowPlanNotApproved'); const s = planSummary(t, lang); let n = 0;
  const lines = s.th.map(x => `• ${x.name_text} — ${x.group_count} ${T(lang, 'group(s)', 'groupe(s)', 'مجموعة')} × ${x.days_per_group} ${T(lang, 'day(s)', 'jour(s)', 'يوم')} (${x.modality})`).join('\n');
  for (const r of recipients(t)) { const res = await C.message(req, t, r, T(lang, `Training plan ${pl.plan_year} approved`, `Plan de formation ${pl.plan_year} approuvé`, `خطة التكوين ${pl.plan_year} معتمدة`), T(lang, `Hello ${r.name},\nThe training plan ${pl.plan_year} has been approved by the steering committee.\n${s.text}\n${lines}\nThe invitations to the sessions will follow.`, `Bonjour ${r.name},\nLe plan de formation ${pl.plan_year} a été approuvé par le comité de pilotage.\n${s.text}\n${lines}\nLes convocations aux sessions suivront.`, `مرحبا ${r.name}،\nتمت المصادقة على خطة التكوين.\n${s.text}`), 'plan'); if (res.status !== 'failed') n++; }
  C.patch(pl._id, { status: 'Approved', locked: true, distributed_at: C.now() }, req.user.id); return { sent: n };
}

export const HOOKS = {
  'MP-01.1': { template: tplObjectives, ai: aiObjectives, complete: completeObjectives },
  'MP-01.2': { template: tplObjFunctions, ai: aiObjFunctions, blocker: ({ t }) => (C.objectives(t.project_id).length ? null : 'err.flowNoObjectives') },
  'UFT-01-03:MP-02.1': { template: ({ t, lang }) => priorities(t, lang, false), ai: ({ t, lang }) => priorities(t, lang, true), complete: completePriorities, blocker: ({ t }) => (C.gaps(t.project_id).length ? null : 'err.flowNoGaps') },
  'UFT-01-03:MP-02.2': { template: ({ t, lang }) => planTargets(t, lang, false), ai: ({ t, lang }) => planTargets(t, lang, true) },
  'UFT-01-04:MP-03.1': { panel: needsPanel, actions: { needs: ({ req, t }) => ({ needs: buildNeeds(req, t) }) }, onComplete: ({ req, t }) => buildNeeds(req, t), blocker: ({ t }) => (gapNeeds(t).length ? null : 'err.flowNoNeeds') },
  'UFT-01-04:MP-03.2': { template: ({ t, lang }) => ({ findings: needsFindings(t, lang), conclusion: 'Conforming' }), ai: ({ t, lang }) => { const nd = gapNeeds(t); const big = nd.filter(n => n.people > 12); return { findings: needsFindings(t, lang), conclusion: big.length ? 'Minor corrections' : 'Conforming', followUp: big.length ? T(lang, `Split into several groups: ${big.map(n => n.competency_code).join(', ')}.`, `Prévoir plusieurs groupes : ${big.map(n => n.competency_code).join(', ')}.`, 'تقسيم إلى مجموعات.') : '' }; } },
  'MP-01.3': { template: tplEnvelope, ai: aiEnvelope, complete: completeEnvelope },
  'MP-18.1': { template: ({ req, t, lang }) => themeRows(req, t, lang, false), ai: ({ req, t, lang }) => themeRows(req, t, lang, true), complete: completeBudget },
  'MP-18.2': { template: ({ t, lang }) => refunds(t, lang, false), ai: ({ t, lang }) => refunds(t, lang, true), complete: completeRefunds },
  'MP-19.1': { template: tplImpact, ai: aiImpact },
  'MP-19.2': { template: ({ req, t, lang }) => adoption(t, lang, req, false), ai: ({ req, t, lang }) => adoption(t, lang, req, true), complete: completeAdoption },
  'MP-01.4': { template: ({ req, t, lang }) => milestones(t, lang, req, false), ai: ({ req, t, lang }) => milestones(t, lang, req, true) },
  'MP-04.1': { panel: upstreamPanel, blocker: ({ req, t, lang }) => (upstream(req, t, lang).every(([, n]) => n) ? null : 'err.flowUpstreamMissing') },
  'MP-01.6': { template: tplApprove, ai: aiApprove, complete: completeApprove },
  'MP-01.7': { panel: diffusePanel, actions: { diffuse }, blocker: ({ t }) => (plan(t)?.distributed_at ? null : 'err.flowNotSent') },
};
