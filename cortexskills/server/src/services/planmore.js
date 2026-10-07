// Detailed sections of the Training Plan document (DT-PLAN, SRS 4.45): plan overview, programs, one sheet per training
// (identity, objectives, half-day agenda, value per persona, sessions, competences targeted, golden rules), calendar,
// budget, providers and evaluation plan. Every row is read from the project's records.
import crypto from 'node:crypto';
import { all, one } from '../db.js';
import { J, pick } from '../lib/util.js';
import { t } from '../i18n.js';
import { checkRules } from './training.js';

const L = (en, fr, ar) => ({ en, fr, ar });
const X = {
  field: L('Field', 'Champ', 'الحقل'), value: L('Value', 'Valeur', 'القيمة'), year: L('Plan year', 'Année du plan', 'سنة المخطط'), status: L('Status', 'Statut', 'الحالة'), budget: L('Total budget', 'Budget total', 'الميزانية الإجمالية'),
  totalDays: L('Training days (per group)', 'Jours de formation (par groupe)', 'أيام التكوين (لكل مجموعة)'), realization: L('Realization rate', 'Taux de réalisation', 'نسبة الإنجاز'), programs: L('Programs', 'Programmes', 'البرامج'), trainings: L('Trainings', 'Formations', 'التكوينات'),
  groups: L('Groups', 'Groupes', 'المجموعات'), traineeDays: L('Trainee-group days', 'Jours × groupes', 'الأيام × المجموعات'), overviewText: L('The plan {year} holds {p} programs and {c} trainings, {d} days per group in total and {gd} group-days to deliver, for a budget of {b}.', 'Le plan {year} comprend {p} programmes et {c} formations, soit {d} jours par groupe au total et {gd} journées-groupes à réaliser, pour un budget de {b}.', 'يضم مخطط {year} عدد {p} برامج و{c} تكوينات، أي {d} أيام لكل مجموعة إجمالاً و{gd} يوماً-مجموعة للإنجاز، بميزانية قدرها {b}.'),
  code: L('Code', 'Code', 'الرمز'), name: L('Name', 'Nom', 'الاسم'), axis: L('Strategic axis', 'Axe stratégique', 'المحور الاستراتيجي'), description: L('Description', 'Description', 'الوصف'),
  program: L('Program', 'Programme', 'البرنامج'), level: L('Level', 'Niveau', 'المستوى'), duration: L('Duration (days)', 'Durée (jours)', 'المدة (أيام)'), modality: L('Modality', 'Modalité', 'النمط'), prerequisites: L('Prerequisites', 'Prérequis', 'المتطلبات القبلية'),
  objectives: L('Learning objectives', 'Objectifs pédagogiques', 'الأهداف البيداغوجية'), theme: L('Theme', 'Thème', 'المحور'), rank: L('Priority rank', 'Rang de priorité', 'رتبة الأولوية'), impact: L('Impact (1–5)', 'Impact (1–5)', 'الأثر (1–5)'), urgency: L('Urgency (1–5)', 'Urgence (1–5)', 'الاستعجال (1–5)'),
  trainer: L('Trainer', 'Formateur', 'المكوّن'), themeBudget: L('Theme budget', 'Budget du thème', 'ميزانية المحور'), path: L('Learning path', 'Parcours pédagogique', 'المسار البيداغوجي'), modules: L('Modules', 'Modules', 'الوحدات'),
  rules: L('Golden rules check', 'Contrôle des règles d’or', 'التحقق من القواعد الذهبية'), rulesOk: L('All golden rules met', 'Toutes les règles d’or sont respectées', 'جميع القواعد الذهبية محترمة'), sheet: L('Training sheet', 'Fiche formation', 'بطاقة التكوين'),
  agenda: L('Agenda by half-day', 'Programme par demi-journée', 'البرنامج حسب نصف اليوم'), halfDay: L('Half-day', 'Demi-journée', 'نصف اليوم'), itemType: L('Activity', 'Activité', 'النشاط'), item: L('Content', 'Contenu', 'المحتوى'), minutes: L('Minutes', 'Minutes', 'الدقائق'),
  personas: L('Value for each persona', 'Valeur pour chaque persona', 'القيمة لكل شخصية'), persona: L('Persona', 'Persona', 'الشخصية'), behaviour: L('Behaviour', 'Comportement', 'السلوك'), pain: L('Pain points', 'Irritants', 'نقاط الألم'), hopes: L('Hopes', 'Attentes', 'التطلعات'), fit: L('How the training answers', 'Réponse apportée', 'كيف يستجيب التكوين'),
  sessions: L('Sessions', 'Sessions', 'الدورات'), session: L('Session', 'Session', 'الدورة'), date: L('Date', 'Date', 'التاريخ'), capacity: L('Capacity', 'Capacité', 'السعة'), enrolled: L('Enrolled', 'Inscrits', 'المسجلون'), attended: L('Attended', 'Présents', 'الحاضرون'),
  competences: L('Competences targeted', 'Compétences visées', 'الكفاءات المستهدفة'), competency: L('Competency', 'Compétence', 'الكفاءة'), positions: L('Positions concerned', 'Postes concernés', 'المناصب المعنية'), target: L('Target level', 'Niveau cible', 'المستوى المستهدف'), people: L('People with a gap', 'Personnes avec un écart', 'الأشخاص ذوو الفجوة'),
  calendar: L('Calendar of the plan', 'Calendrier du plan', 'الجدول الزمني للمخطط'), month: L('Month', 'Mois', 'الشهر'), budgetDetail: L('Budget by training', 'Budget par formation', 'الميزانية حسب التكوين'), allocated: L('Allocated', 'Alloué', 'المخصص'), committed: L('Committed', 'Engagé', 'الملتزم به'), actual: L('Actual', 'Réalisé', 'الفعلي'), refund: L('Refund forecast', 'Remboursement prévu', 'الاسترداد المتوقع'), total: L('Total', 'Total', 'المجموع'),
  vendors: L('Training providers', 'Prestataires de formation', 'مقدمو خدمات التكوين'), accreditation: L('Accreditation valid until', 'Agrément valable jusqu’au', 'الاعتماد صالح إلى غاية'), score: L('Performance (out of 5)', 'Performance (sur 5)', 'الأداء (من 5)'),
  evaluation: L('Evaluation plan (Kirkpatrick)', 'Plan d’évaluation (Kirkpatrick)', 'خطة التقييم (كيركباتريك)'), kLevel: L('Level', 'Niveau', 'المستوى'), what: L('What is measured', 'Ce qui est mesuré', 'ما يُقاس'), when: L('When', 'Quand', 'متى'), how: L('Instrument', 'Instrument', 'الأداة'), results: L('Results so far', 'Résultats à date', 'النتائج حتى الآن'),
  kp: [L('Reaction', 'Réaction', 'رد الفعل'), L('Learning', 'Apprentissage', 'التعلم'), L('Behaviour', 'Comportement', 'السلوك'), L('Results', 'Résultats', 'النتائج')],
  kWhat: [L('Satisfaction and perceived usefulness', 'Satisfaction et utilité perçue', 'الرضا والفائدة المدركة'), L('Knowledge and skills acquired', 'Connaissances et compétences acquises', 'المعارف والمهارات المكتسبة'), L('Use of the skills at the workstation', 'Mise en œuvre au poste de travail', 'التطبيق في مكان العمل'), L('Effect on the indicators of the function', 'Effet sur les indicateurs de la fonction', 'الأثر على مؤشرات الوظيفة')],
  kWhen: [L('End of each session', 'Fin de chaque session', 'نهاية كل دورة'), L('End of the training', 'Fin de la formation', 'نهاية التكوين'), L('Three months after', 'Trois mois après', 'بعد ثلاثة أشهر'), L('Six to twelve months after', 'Six à douze mois après', 'بعد ستة إلى اثني عشر شهراً')],
  kHow: [L('Satisfaction questionnaire', 'Questionnaire de satisfaction', 'استبيان الرضا'), L('Pre- and post-test, case study', 'Test avant/après, étude de cas', 'اختبار قبلي وبعدي، دراسة حالة'), L('Manager observation grid', 'Grille d’observation du manager', 'شبكة ملاحظة المسؤول'), L('Indicators of the function (KPI)', 'Indicateurs de la fonction (KPI)', 'مؤشرات الوظيفة (KPI)')],
  noSession: L('No session scheduled yet for this training.', 'Aucune session planifiée pour cette formation à ce jour.', 'لا توجد دورة مبرمجة لهذا التكوين حتى الآن.'),
};
const x = (k, lang, p = {}) => { const v = X[k]; const s = v?.[lang] || v?.en || k; return Object.entries(p).reduce((a, [kk, vv]) => a.split(`{${kk}}`).join(String(vv)), s); };

export function planSource(kind, ctx) {
  if (!String(kind).startsWith('plan')) return null;
  const { orgId, projectId, lang } = ctx; const P = v => (v && typeof v === 'object' && !Array.isArray(v) ? pick(v, lang) : v);
  const st = s => { const v = t('status.' + s, lang); return v === 'status.' + s ? s : v; };
  const fmtN = n => Number(n || 0).toLocaleString(lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-MA' : 'en-US');
  const recs = e => all(`SELECT id, data, version, updated_at FROM records WHERE entity=? AND project_id=?`, e, projectId).map(r => ({ _id: r.id, _v: r.version, id: r.id, ...J(r.data, {}) }));
  const orgRecs = e => all(`SELECT id, data, version FROM records WHERE entity=? AND org_id=? AND project_id IS NULL`, e, orgId).map(r => ({ _id: r.id, _v: r.version, id: r.id, ...J(r.data, {}) }));
  const fp = rows => crypto.createHash('sha1').update(rows.map(r => `${r._id}@${r._v || 0}`).join('|')).digest('hex').slice(0, 16);
  const userName = id => (id ? one(`SELECT name FROM users WHERE id=?`, id)?.name : null) || '—';
  const plan = recs('TrainingPlan')[0]; const programs = recs('TrainingProgram'); const courses = recs('TrainingCourse').sort((a, b) => (a.sort || 0) - (b.sort || 0)); const themes = recs('TrainingTheme');
  const notice = () => ({ body: { text: t('ter.notice', lang, { what: x('trainings', lang), step: 'MP-49' }), notice: true }, empty: true });
  if (!courses.length) return notice();
  const tr = c => ({ type: 'record', entity: 'TrainingCourse', id: c._id, version: c._v });
  switch (kind) {
    case 'planOverview': {
      const gd = courses.reduce((s, c) => s + (Number(c.duration_days) || 0) * (Number(c.groups) || 1), 0);
      return { body: { text: x('overviewText', lang, { year: plan?.plan_year || '', p: programs.length, c: courses.length, d: courses.reduce((s, c) => s + (Number(c.duration_days) || 0), 0), gd, b: fmtN(plan?.total_budget) }),
        kv: [[x('year', lang), String(plan?.plan_year || '')], [x('status', lang), st(plan?.status)], [x('budget', lang), fmtN(plan?.total_budget)], [x('totalDays', lang), String(plan?.total_days ?? '')], [x('realization', lang), `${plan?.realization_rate ?? '—'} %`],
          [x('programs', lang), String(programs.length)], [x('trainings', lang), String(courses.length)], [x('traineeDays', lang), String(gd)]] }, fingerprint: fp([plan, ...courses].filter(Boolean)) };
    }
    case 'planPrograms':
      return { body: { table: { columns: [x('code', lang), x('name', lang), x('axis', lang), x('description', lang), x('trainings', lang)], rows: programs.map(p => [p.code, P(p.name), P(p.axis), P(p.description), courses.filter(c => c.program_id === p.id).map(c => c.training_code).join(', ')]), trace: programs.map(p => ({ type: 'record', entity: 'TrainingProgram', id: p._id, version: p._v })) } }, fingerprint: fp(programs) };
    case 'planSheets': {
      const personas = new Map(orgRecs('Persona').map(p => [p.id, p])); const ses = recs('Session'); const enr = recs('Enrollment'); const mods = recs('LearningModule'); const paths = recs('LearningPath');
      const comps = new Map(orgRecs('Competency').map(c => [c.id, c])); const targets = orgRecs('PositionCompetencyTarget'); const positions = new Map(orgRecs('Position').map(p => [p.id, p])); const gaps = recs('SkillGap');
      const subs = [];
      for (const c of courses) {
        const pr = programs.find(p => p.id === c.program_id); const th = themes.find(x2 => x2.id === c.theme_id) || themes.find(x2 => P(x2.name) === P(c.name)); const rules = checkRules(c);
        const path = paths.find(p => p.theme_id === c.theme_id); const pm = path ? mods.filter(m => m.path_id === path.id) : [];
        subs.push({ heading: `${x('sheet', lang)} ${c.training_code} — ${P(c.name)}`, kv: [[x('code', lang), c.training_code], [x('program', lang), pr ? `${pr.code} ${P(pr.name)}` : '—'], [x('axis', lang), P(pr?.axis) || '—'], [x('level', lang), t('level.' + c.level, lang)],
          [x('duration', lang), String(c.duration_days ?? '')], [x('groups', lang), String(c.groups ?? th?.group_count ?? '')], [x('modality', lang), st(c.modality || '—')], [x('status', lang), st(c.status)], [x('prerequisites', lang), P(c.prerequisites) || '—'],
          [x('objectives', lang), (c.objectives || []).map((o, i) => `${i + 1}. ${P(o)}`).join('\n')], [x('theme', lang), P(th?.name) || '—'], [x('rank', lang), String(th?.priority_rank ?? '—')], [x('impact', lang), String(th?.impact_score ?? '—')], [x('urgency', lang), String(th?.urgency ?? '—')],
          [x('trainer', lang), st(th?.trainer || '—')], [x('themeBudget', lang), fmtN(th?.budget)], [x('path', lang), path ? `${P(path.label)} (${t('tp.days', lang, { n: path.total_days })})` : '—'], [x('modules', lang), pm.map(m => `${P(m.label)} — ${st(m.modality)}, ${m.duration_hours} h`).join('\n') || '—'],
          [x('rules', lang), rules.ok ? x('rulesOk', lang) : rules.issues.map(i => t('rule.' + i.code, lang, i)).join('\n')]] });
        subs.push({ heading: `${c.training_code} — ${x('agenda', lang)}`, table: { columns: [x('halfDay', lang), x('itemType', lang), x('item', lang), x('minutes', lang)], rows: (c.agenda || []).flatMap(h => (h.items || []).map((it, k) => [k ? '' : P(h.label), t('item.' + it.type, lang), P(it.title), String(it.minutes || '')])), trace: [tr(c)] } });
        if ((c.personas || []).length) subs.push({ heading: `${c.training_code} — ${x('personas', lang)}`, table: { columns: [x('persona', lang), x('behaviour', lang), x('pain', lang), x('hopes', lang), x('fit', lang)], rows: c.personas.map(pp => [P(personas.get(pp.persona_id)?.name) || '—', P(pp.behaviour), P(pp.pain_points), P(pp.hopes), P(pp.fit)]), trace: [tr(c)] } });
        const cs = ses.filter(s => pm.some(m => m.id === s.module_id) || String(P(s.label)).includes(P(c.name)));
        subs.push({ heading: `${c.training_code} — ${x('sessions', lang)}`, ...(cs.length ? { table: { columns: [x('session', lang), x('date', lang), x('capacity', lang), x('trainer', lang), x('enrolled', lang), x('attended', lang)], rows: cs.map(s => { const e = enr.filter(z => z.session_id === s.id); return [P(s.label), String(s.start_at || '').slice(0, 10), String(s.capacity ?? ''), userName(s.trainer_user_id), String(e.length), String(e.filter(z => z.attendance_status === 'Present').length)]; }) } } : { text: x('noSession', lang), notice: true }) });
        const tg = targets.filter(tt => P(comps.get(tt.competency_id)?.name) && (P(comps.get(tt.competency_id)?.name) === P(c.name) || String(P(th?.name) || '').includes(P(comps.get(tt.competency_id)?.name))));
        const cg = gaps.filter(g => P(g.competency) === P(c.name) || P(g.competency) === P(th?.name));
        if (tg.length || cg.length) subs.push({ heading: `${c.training_code} — ${x('competences', lang)}`, table: { columns: [x('competency', lang), x('positions', lang), x('target', lang), x('people', lang)],
          rows: [...new Set(tg.map(z => z.competency_id))].map(id => [P(comps.get(id)?.name), tg.filter(z => z.competency_id === id).map(z => P(positions.get(z.position_id)?.title)).filter(Boolean).join('\n'), String(Math.max(...tg.filter(z => z.competency_id === id).map(z => z.target_level || 0))), String(cg.length)]) } });
      }
      return { body: { subsections: subs }, fingerprint: fp(courses) };
    }
    case 'planCalendar': {
      const ses = recs('Session'); const wbs = recs('WbsNode').sort((a, b) => (a.sort || 0) - (b.sort || 0));
      const rows = [...wbs.map(w => [String(w.start || '').slice(0, 7), P(w.name), `${w.start || ''} → ${w.end || ''}`, `${w.percent ?? 0} %`]), ...ses.map(s => [String(s.start_at || '').slice(0, 7), P(s.label), String(s.start_at || '').slice(0, 10), st('Planned')])].sort((a, b) => a[0].localeCompare(b[0]));
      return { body: { table: { columns: [x('month', lang), x('item', lang), x('date', lang), x('status', lang)], rows } }, fingerprint: fp([...wbs, ...ses]) };
    }
    case 'planBudget': {
      const bl = recs('BudgetLine'); if (!bl.length) return notice(); const s = k => bl.reduce((a, b) => a + (Number(b[k]) || 0), 0);
      return { body: { table: { columns: [x('trainings', lang), x('allocated', lang), x('committed', lang), x('actual', lang), x('refund', lang)], rows: [...bl.map(b => [P(b.label), fmtN(b.allocated_amount), fmtN(b.committed_amount), fmtN(b.actual_amount), fmtN(b.refund_forecast)]), [x('total', lang), fmtN(s('allocated_amount')), fmtN(s('committed_amount')), fmtN(s('actual_amount')), fmtN(s('refund_forecast'))]], trace: bl.map(b => ({ type: 'record', entity: 'BudgetLine', id: b._id, version: b._v })) } }, fingerprint: fp(bl) };
    }
    case 'planVendors': {
      const v = orgRecs('Vendor'); if (!v.length) return notice();
      return { body: { table: { columns: [x('name', lang), x('accreditation', lang), x('score', lang)], rows: v.map(z => [z.legal_name || P(z.label), z.accreditation_valid_until || '—', String(z.performance_score ?? '—')]) } }, fingerprint: fp(v) };
    }
    case 'planEvaluation': {
      const ev = recs('Evaluation'); const by = {}; for (const e of ev) (by[e.level] ||= []).push(Number(e.score_pct) || 0);
      return { body: { table: { columns: [x('kLevel', lang), x('what', lang), x('when', lang), x('how', lang), x('results', lang)], rows: [0, 1, 2, 3].map(i => [`${i + 1} — ${P(X.kp[i])}`, P(X.kWhat[i]), P(X.kWhen[i]), P(X.kHow[i]), by[i + 1] ? `${by[i + 1].length} × ${Math.round(by[i + 1].reduce((a, b) => a + b, 0) / by[i + 1].length)} %` : '—']) } }, fingerprint: fp(ev) };
    }
    default: return null;
  }
}
