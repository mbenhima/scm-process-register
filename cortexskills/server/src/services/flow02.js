// Skills diagnosis (E2E-02): the competency framework, the target levels per position, the assessment campaign sent to
// the staff and their managers (self-assessment and manager assessment by e-mail or WhatsApp), the consolidation of the
// answers, the proposed and validated levels, the gap matrix computed from them and the gap forecast.
import * as C from './flowcore.js';
const { T, L, ml, str, norm, num, avg, round1, today, dplus, fmtN } = C;

const LEVEL_LABEL = lang => ({ 1: T(lang, 'Notions', 'Notions', 'مبادئ'), 2: T(lang, 'Practice with support', 'Pratique accompagnée', 'ممارسة بمرافقة'), 3: T(lang, 'Autonomous', 'Autonome', 'مستقل'), 4: T(lang, 'Expert', 'Expert', 'خبير') });
const familyOf = s => { const x = norm(s); return /\b(ia|ai|intelligence|algorithm|predict)/.test(x) ? 'AI' : /(numerique|digital|dossier|logiciel|donnees|data|telemed|informat)/.test(x) ? 'Digital' : /(manag|pilot|encadr|leader)/.test(x) ? 'Managerial' : /(norme|iso|reglement|conformite|ethique|rgpd|protection)/.test(x) ? 'Regulatory' : /(communic|equipe|relation|ecoute|esprit critique)/.test(x) ? 'Behavioural' : 'Technical'; };
// Which competencies matter to which job: words of the competency found in the role, function or site of the position.
const RELEVANCE = [[/triage|urgence|decision clinique|aide a la decision/, /urgen|infirm|soins|medic|clinique/], [/imag|radio/, /radio|imag|medic/], [/dossier|dpi|ehr|informatis/, /infirm|soins|qualit|medic|cadre/],
  [/planif|lits|effectifs|capacit/, /cadre|direct|soins|qualit/], [/telemed|teleconsult/, /medic|direct/], [/rendez|factur/, /accueil|admin|factur/]];
export const relevant = (compName, roleText) => { const c = norm(compName); const r = norm(roleText); const rule = RELEVANCE.find(([a]) => a.test(c)); return rule ? rule[1].test(r) : true; };
const levelOfRole = (projectId, position) => { const st = C.stakeholders(projectId).find(s => norm(s.role) === norm(position)); return st?.decision_level || (/(direct|chef|cadre|responsable|manager|head)/i.test(position) ? 'MO' : 'OP'); };

/* ------------------------------------------------------------------ MP-02.1 competency framework */
function generalComps(lang) {
  return [{ item: T(lang, 'Ethics and protection of health data when using AI', 'Éthique et protection des données de santé dans l’usage de l’IA', 'الأخلاقيات وحماية البيانات الصحية عند استعمال الذكاء الاصطناعي'), family: 'Regulatory' },
    { item: T(lang, 'Critical thinking about AI results', 'Esprit critique face aux résultats de l’IA', 'التفكير النقدي في نتائج الذكاء الاصطناعي'), family: 'Behavioural' }];
}
const compDescription = (name, family, lang) => ({
  AI: T(lang, `Uses ${name} in daily work, checks each suggestion against clinical judgement and records the decision.`, `Utilise ${name} au quotidien, confronte chaque suggestion à son jugement clinique et trace la décision prise.`, `يستعمل ${name} في العمل اليومي ويقارن كل اقتراح بحكمه المهني ويوثق القرار.`),
  Digital: T(lang, `Uses ${name} correctly and completely, without double entry.`, `Utilise ${name} correctement et complètement, sans double saisie.`, `يستعمل ${name} بشكل صحيح وكامل دون إدخال مزدوج.`),
  Regulatory: T(lang, `Applies the rules of ${name} and knows when to alert.`, `Applique les règles de ${name} et sait quand alerter.`, `يطبق قواعد ${name} ويعرف متى ينبه.`),
  Behavioural: T(lang, `Shows ${name} in practice and explains the reasons of a decision.`, `Fait preuve de ${name} en pratique et explique les raisons d’une décision.`, `يظهر ${name} عملياً ويشرح أسباب القرار.`),
}[family] || T(lang, `Masters ${name} in the situations of the position.`, `Maîtrise ${name} dans les situations du poste.`, `يتقن ${name} في مواقف المنصب.`));
function tplCompetencies({ req, t, lang }) {
  const org = C.orgOf(req.orgId); const v = C.sectorSeed(org.sector); const focus = C.projectOf(t.project_id).focus || 'All';
  const list = [...(focus !== 'Digital' ? (v?.themes?.ai || []).map(x => ({ item: C.pick(x, lang), family: 'AI' })) : []), ...(focus !== 'AI' ? (v?.themes?.digital || []).map(x => ({ item: C.pick(x, lang), family: 'Digital' })) : []), ...generalComps(lang)];
  return list.map((x, i) => ({ code: `C-${String(i + 1).padStart(2, '0')}`, item: x.item, family: x.family, description: compDescription(x.item, x.family, lang), levels: '1-4', owner: req.user.name, source: 'Library' }));
}
function aiCompetencies({ req, t, lang }) {
  // The needs of the questionnaire campaign (fed at MP-54.11), the most mentioned first, then the sector themes not yet named.
  const fed = C.needs(t.project_id).filter(n => n.source === 'Questionnaire').sort((a, b) => (b.evidence?.mentions || 0) - (a.evidence?.mentions || 0));
  const rows = fed.slice(0, 8).map(n => { const name = str(n.title, lang); const fam = familyOf(name); const pops = (n.evidence?.populations || []).join(', ');
    return { item: name, family: fam, description: `${compDescription(name, fam, lang)} ${T(lang, `Cited ${n.evidence?.mentions || 1} time(s) in the needs questionnaire${pops ? ` (${pops})` : ''}.`, `Cité ${n.evidence?.mentions || 1} fois dans le questionnaire des besoins${pops ? ` (${pops})` : ''}.`, `ذكر ${n.evidence?.mentions || 1} مرة في استبيان الحاجيات.`)}`, levels: '1-4', owner: req.user.name, source: 'Needs' }; });
  for (const x of tplCompetencies({ req, t, lang }).filter(x => ['AI', 'Regulatory', 'Behavioural'].includes(x.family))) if (!rows.some(r => norm(r.item) === norm(x.item))) rows.push({ ...x, source: 'Library' });
  return rows.slice(0, 8).map((r, i) => ({ code: `C-${String(i + 1).padStart(2, '0')}`, ...r }));
}
function completeCompetencies({ req, t, rows }) {
  const keep = new Set(); let i = 0;
  for (const r of rows) {
    i++; const name = str(r.item); const code = String(r.code || '').trim() || `C-${String(i).padStart(2, '0')}`; const key = 'comp|' + norm(code);
    C.upsert(req, t, 'Competency', key, { code, name: ml(name), name_text: name, label: ml(name), family: r.family || 'Technical', description: str(r.description), level_scale: r.levels || '1-4', owner: str(r.owner), source: r.source || null, flow_step: 'MP-02.1', source_row_id: r._id }, code);
    keep.add(key);
  }
  C.prune('Competency', t.project_id, 'MP-02.1', keep);
}

/* ------------------------------------------------------------------ MP-02.2 targets per position */
function positionsInScope(t) {
  const m = new Map();
  for (const s of C.stakeholders(t.project_id)) if (s.role && ['OP', 'MO'].includes(s.decision_level)) { const k = norm(s.role); const x = m.get(k) || { position: s.role, level: s.decision_level, n: 0, fn: C.fnOf(s, 'fr') + ' ' + C.fnOf(s, 'en'), site: s.site }; x.n++; m.set(k, x); }
  return [...m.values()];
}
function tplTargets({ req, t, lang }) {
  const p = C.projectOf(t.project_id); const comps = C.competencies(t.project_id); const out = [];
  for (const pos of positionsInScope(t)) for (const c of comps) out.push({ position: pos.position, competency: c.code, target: pos.level === 'OP' ? '2' : '3', criticality: 'Important', headcount: String(pos.n), deadline: C.yearEnd(p), owner: req.user.name });
  return out;
}
function aiTargets({ req, t, lang }) {
  const p = C.projectOf(t.project_id); const comps = C.competencies(t.project_id); const fed = C.needs(t.project_id); const out = [];
  for (const pos of positionsInScope(t)) for (const c of comps) {
    const name = C.compName(c, lang); if (!relevant(name, `${pos.position} ${str(pos.fn)} ${pos.site || ''}`)) continue;
    const cited = fed.find(n => norm(str(n.title, lang)) === norm(name))?.evidence?.mentions || 0;
    const crit = c.family === 'AI' && relevant(name, pos.position) && RELEVANCE.some(([a, b]) => a.test(norm(name)) && b.test(norm(pos.position))) ? 'Critical' : cited >= 3 ? 'Critical' : c.family === 'Regulatory' ? 'Important' : 'Useful';
    out.push({ position: pos.position, competency: c.code, target: pos.level === 'OP' ? (crit === 'Critical' ? '3' : '2') : '3', criticality: crit, headcount: String(pos.n), deadline: C.yearEnd(p), owner: req.user.name });
  }
  return out;
}
function completeTargets({ req, t, rows, lang }) {
  const keep = new Set(); const pkeep = new Set();
  for (const r of rows) {
    const pos = str(r.position).trim(); const c = C.compByCode(t.project_id, str(r.competency)); const code = c?.code || str(r.competency);
    const pk = 'pos|' + norm(pos); C.upsert(req, t, 'Position', pk, { title: ml(pos), label: ml(pos), status: 'Published', flow_step: 'MP-02.2' }); pkeep.add(pk);
    const key = `pct|${norm(pos)}|${norm(code)}`; keep.add(key);
    C.upsert(req, t, 'PositionCompetencyTarget', key, { position: pos, competency_code: code, competency_id: c?._id || null, competency: c?.name || ml(code), target_level: Number(r.target) || 2, criticality: r.criticality || null, headcount: num(r.headcount), deadline: r.deadline || null, label: ml(`${pos} · ${code}`), flow_step: 'MP-02.2' });
  }
  C.prune('PositionCompetencyTarget', t.project_id, 'MP-02.2', keep); C.prune('Position', t.project_id, 'MP-02.2', pkeep);
}

/* ------------------------------------------------------------------ MP-02.3 assessed population and the campaign */
function managerOf(t, st) {
  const all = C.stakeholders(t.project_id); const up = { OP: ['MO', 'MS'], MO: ['MS'] }[st.decision_level] || ['MS'];
  for (const lv of up) { const m = all.find(s => s.decision_level === lv && C.fnKey(s) && C.fnKey(s) === C.fnKey(st) && s.name !== st.name) || null; if (m) return m; }
  return all.find(s => up.includes(s.decision_level) && s.name !== st.name && !/direct(eur|rice) g[eé]n[eé]ral/i.test(String(s.role))) || all.find(s => up.includes(s.decision_level) && s.name !== st.name) || null;
}
function population(t, { strict }) {
  const pos = C.targets(t.project_id).map(x => norm(x.position)); const out = [];
  for (const st of C.stakeholders(t.project_id)) {
    if (!['OP', 'MO'].includes(st.decision_level)) continue; if (strict && pos.length && !pos.includes(norm(st.role))) continue;
    const m = managerOf(t, st); const ch = st.preferred_channel === 'WhatsApp' && st.phone ? 'WhatsApp' : 'Email';
    out.push({ item: st.name, email: st.email || '', phone: st.phone || '', position: pos.includes(norm(st.role)) || !pos.length ? st.role : C.targets(t.project_id)[0]?.position || st.role,
      manager: m?.name || '', managerEmail: m?.email || '', managerPhone: m?.phone || '', channel: ch, site: st.site || '' });
  }
  return out;
}
const tplPopulation = ({ t }) => population(t, { strict: false });
const aiPopulation = ({ t }) => population(t, { strict: true });
function ratingSection(comps, lang, title, instr) {
  const lbl = LEVEL_LABEL(lang);
  return { id: 'levels', type: 'rating', title: ml(title), instructions: ml(instr), scale: { max: 4, labels: lbl }, items: comps.map(c => ({ key: c.code, label: ml(`${c.code} — ${C.compName(c, lang)}`), hint: ml(str(c.description)) })) };
}
export async function launchAssessment(req, t, rows) {
  const lang = req.lang; const comps = C.competencies(t.project_id); const tg = C.targets(t.project_id);
  const errs = rows.filter(r => (r.channel === 'Email' && !r.email) || (r.channel === 'WhatsApp' && !r.phone) || (!r.managerEmail && !r.managerPhone)).map(r => str(r.item));
  if (errs.length) throw C.err('err.flowMissingAddress', { names: errs.join(', ') });
  const emp = []; const keep = new Set();
  for (const r of rows) {
    const name = str(r.item).trim(); const key = 'emp|' + norm(name); keep.add(key);
    const id = C.upsert(req, t, 'Employee', key, { name, label: ml(name), email: r.email || null, phone: r.phone || null, position: str(r.position), manager: str(r.manager), manager_email: r.managerEmail || null, manager_phone: r.managerPhone || null, channel: r.channel, site: str(r.site) || null, flow_step: 'MP-02.3', source_row_id: r._id });
    emp.push({ id, name, ...r, position: str(r.position) });
  }
  C.prune('Employee', t.project_id, 'MP-02.3', keep);
  const compsOf = pos => { const codes = tg.filter(x => norm(x.position) === norm(pos)).map(x => norm(x.competency_code)); return codes.length ? comps.filter(c => codes.includes(norm(c.code))) : comps; };
  const positions = [...new Set(emp.map(e => e.position))];
  const forms = positions.map((p, i) => ({ code: `SELF-${i + 1}`, name: ml(T(lang, `Self-assessment — ${p}`, `Auto-évaluation — ${p}`, `التقييم الذاتي — ${p}`)), population: 'Member', position: p,
    sections: [{ id: 'intro', type: 'note', title: ml(T(lang, 'How to answer', 'Comment répondre', 'طريقة الإجابة')), instructions: ml(T(lang, 'For each competency, choose the level that describes what you do today: 1 Notions · 2 Practice with support · 3 Autonomous · 4 Expert. There is no wrong answer; your manager also gives a level and both are discussed.', 'Pour chaque compétence, choisissez le niveau qui décrit ce que vous faites aujourd’hui : 1 Notions · 2 Pratique accompagnée · 3 Autonome · 4 Expert. Il n’y a pas de mauvaise réponse ; votre manager donne aussi un niveau et les deux sont rapprochés.', 'اختر لكل كفاءة المستوى الذي يصف ما تقوم به اليوم: 1 مبادئ · 2 ممارسة بمرافقة · 3 مستقل · 4 خبير.')) },
      ratingSection(compsOf(p), lang, T(lang, 'My level today', 'Mon niveau aujourd’hui', 'مستواي اليوم'), ''),
      { id: 'evidence', type: 'questions', title: ml(T(lang, 'Examples', 'Exemples', 'أمثلة')), items: [{ key: 'evidence', label: ml(T(lang, 'Give one or two concrete examples that support your levels.', 'Donnez un ou deux exemples concrets qui justifient vos niveaux.', 'قدم مثالاً أو مثالين ملموسين يدعمان مستوياتك.')) }] }] }));
  const subjects = {};
  emp.forEach((e, i) => { subjects[`MGR-${i + 1}`] = e.id;
    forms.push({ code: `MGR-${i + 1}`, name: ml(T(lang, `Assessment of ${e.name} (${e.position})`, `Évaluation de ${e.name} (${e.position})`, `تقييم ${e.name} (${e.position})`)), population: 'Management', position: e.position,
      sections: [{ id: 'intro', type: 'note', title: ml(T(lang, 'How to answer', 'Comment répondre', 'طريقة الإجابة')), instructions: ml(T(lang, `Give the level ${e.name} shows at work today, from what you have observed: 1 Notions · 2 Practice with support · 3 Autonomous · 4 Expert.`, `Indiquez le niveau que ${e.name} démontre aujourd’hui au travail, d’après ce que vous avez observé : 1 Notions · 2 Pratique accompagnée · 3 Autonome · 4 Expert.`, `حدد المستوى الذي يظهره ${e.name} في العمل اليوم.`)) },
        ratingSection(compsOf(e.position), lang, T(lang, `Level observed for ${e.name}`, `Niveau observé pour ${e.name}`, `المستوى الملاحظ لـ ${e.name}`), ''),
        { id: 'evidence', type: 'questions', title: ml(T(lang, 'Facts observed', 'Faits observés', 'وقائع ملاحظة')), items: [{ key: 'evidence', label: ml(T(lang, 'Which facts support these levels?', 'Quels faits justifient ces niveaux ?', 'ما الوقائع التي تبرر هذه المستويات؟')) }] }] }); });
  const p = C.projectOf(t.project_id);
  const q = C.campaign(req, t, 'assessment', ml(T(lang, `Skills assessment — ${str(C.J(p.name, p.name), lang)}`, `Évaluation des compétences — ${str(C.J(p.name, p.name), lang)}`, `تقييم الكفاءات — ${str(C.J(p.name, p.name), lang)}`)), forms, { data: { subjects } });
  const people = [];
  emp.forEach((e, i) => {
    const fcode = forms.find(f => f.code.startsWith('SELF-') && f.position === e.position).code;
    people.push({ key: e.id, name: e.name, email: e.email, phone: e.phone, channel: e.channel, form: fcode, population: 'Member', fn: e.position, lang });
    const mc = e.managerEmail ? (e.channel === 'WhatsApp' && e.managerPhone ? 'WhatsApp' : 'Email') : 'WhatsApp';
    people.push({ key: `${e.id}:mgr`, name: str(e.manager), email: e.managerEmail, phone: e.managerPhone, channel: mc, form: `MGR-${i + 1}`, population: 'Management', fn: e.position, lang });
  });
  return C.invite(req, q, people);
}
function campaignPanel({ req, t, lang }, purpose = 'assessment') {
  const q = C.campaignOf(req.orgId, t.project_id, purpose); if (!q) return { notes: [T(lang, 'The campaign starts when this step is completed: each person receives a link to the self-assessment and each manager a link per person to assess.', 'La campagne démarre à la clôture de cette étape : chaque personne reçoit un lien vers son auto-évaluation et chaque manager un lien par personne à évaluer.', 'تنطلق الحملة عند إتمام هذه الخطوة.')] };
  const inv = C.invitationsOf(req.orgId, q); const subj = q.subjects || {};
  const rows = inv.map(i => ({ name: i.name, kind: i.template_code?.startsWith('MGR-') ? T(lang, 'Manager', 'Manager', 'المدير') + ' → ' + (C.employees(t.project_id).find(e => e._id === subj[i.template_code])?.name || '') : T(lang, 'Self-assessment', 'Auto-évaluation', 'تقييم ذاتي'),
    channel: i.channel_plan[0]?.channel === 'WhatsApp' ? 'WhatsApp' : 'E-mail', status: C.statusLabel(i.status, lang), sent: i.last_sent_at ? C.fmtD(i.last_sent_at, lang) : '—', answered: i.responded_at ? C.fmtD(i.responded_at, lang) : '—' }));
  const resp = inv.filter(i => i.status === 'Responded').length;
  return { kpis: [{ label: T(lang, 'Links sent', 'Liens envoyés', 'روابط مرسلة'), value: inv.filter(i => i.last_sent_at).length }, { label: T(lang, 'Answers', 'Réponses', 'إجابات'), value: `${resp} / ${inv.length}` }, { label: T(lang, 'Deadline', 'Échéance', 'الأجل'), value: C.fmtD(q.due_date, lang) }],
    tables: [{ title: T(lang, 'Who answers what', 'Qui répond à quoi', 'من يجيب عن ماذا'), columns: [['name', T(lang, 'Person', 'Personne', 'الشخص')], ['kind', T(lang, 'Form', 'Formulaire', 'الاستمارة')], ['channel', T(lang, 'Channel', 'Canal', 'القناة')], ['status', T(lang, 'Status', 'Statut', 'الحالة')], ['sent', T(lang, 'Last message', 'Dernier envoi', 'آخر إرسال')], ['answered', T(lang, 'Answered on', 'Répondu le', 'أجاب في')]], rows }],
    actions: inv.some(i => i.status !== 'Responded') ? [{ key: 'remind', label: T(lang, 'Remind those who have not answered', 'Relancer ceux qui n’ont pas répondu', 'تذكير من لم يجب'), icon: 'BellRing' }] : [],
    links: [{ label: T(lang, 'Open the campaign questionnaire', 'Ouvrir le questionnaire de la campagne', 'فتح استبيان الحملة'), to: `/questionnaires/${q.id}` }] };
}

/* ------------------------------------------------------------------ MP-02.5 consolidation */
export function consolidate(req, t) {
  const q = C.campaignOf(req.orgId, t.project_id, 'assessment'); if (!q) return 0;
  const emps = C.employees(t.project_id); const by = new Map(); let n = 0;
  for (const i of C.invitationsOf(req.orgId, q).filter(x => x.answers)) {
    const mgr = i.template_code?.startsWith('MGR-'); const empId = mgr ? q.subjects?.[i.template_code] : i.stakeholder_id; const e = emps.find(x => x._id === empId); if (!e) continue;
    const lv = i.answers.levels || {}; const ev = i.answers.evidence?.evidence || '';
    for (const [code, v] of Object.entries(lv)) { const x = num(v); if (x == null) continue; const k = `${e._id}|${code}`; const a = by.get(k) || { e, code }; a[mgr ? 'manager' : 'self'] = x; a[mgr ? 'evManager' : 'evSelf'] = ev; by.set(k, a); }
  }
  for (const a of by.values()) {
    const c = C.compByCode(t.project_id, a.code);
    C.upsert(req, t, 'SkillAssessment', `sa|${norm(a.e.name)}|${norm(a.code)}`, { employee_id: a.e._id, employee: a.e.name, position: a.e.position, site: a.e.site || null, competency_code: a.code, competency_id: c?._id || null, competency: c?.name || ml(a.code),
      self_level: a.self ?? null, manager_level: a.manager ?? null, evidence_self: a.evSelf || null, evidence_manager: a.evManager || null, campaign_id: q.id, label: ml(`${a.e.name} · ${a.code}`), flow_step: 'MP-02.5' }); n++;
  }
  return n;
}
function consolidatePanel({ req, t, lang }) {
  const sa = C.assessments(t.project_id);
  return { notes: [T(lang, 'The answers of the people and of their managers are joined here, one line per person and competency.', 'Les réponses des personnes et de leurs managers sont rapprochées ici, une ligne par personne et par compétence.', 'تجمع هنا أجوبة الأشخاص ومديريهم.')],
    kpis: [{ label: T(lang, 'People assessed', 'Personnes évaluées', 'أشخاص مقيمون'), value: new Set(sa.map(x => x.employee)).size }, { label: T(lang, 'Lines', 'Lignes', 'سطور'), value: sa.length }, { label: T(lang, 'Average self / manager', 'Moyenne auto / manager', 'متوسط ذاتي / مدير'), value: `${fmtN(avg(sa.map(x => x.self_level)), lang)} / ${fmtN(avg(sa.map(x => x.manager_level)), lang)}` }],
    tables: [{ title: T(lang, 'Consolidated assessments', 'Évaluations consolidées', 'التقييمات الموحدة'), csv: true, columns: [['employee', T(lang, 'Person', 'Personne', 'الشخص')], ['position', T(lang, 'Position', 'Poste', 'المنصب')], ['competency', T(lang, 'Competency', 'Compétence', 'الكفاءة')], ['self', T(lang, 'Self', 'Auto', 'ذاتي')], ['manager', T(lang, 'Manager', 'Manager', 'المدير')]],
      rows: sa.map(x => ({ employee: x.employee, position: x.position, competency: `${x.competency_code} — ${str(x.competency, lang)}`, self: x.self_level ?? '—', manager: x.manager_level ?? '—' })) }],
    actions: [{ key: 'consolidate', label: T(lang, 'Consolidate the answers received', 'Consolider les réponses reçues', 'توحيد الأجوبة المستلمة'), icon: 'RefreshCw', primary: true }] };
}

/* ------------------------------------------------------------------ MP-02.6 proposed level, MP-02.7 validation */
function tplProposed({ t, lang }) {
  return C.assessments(t.project_id).map(a => ({ employee: a.employee, competency: a.competency_code, self: a.self_level ?? '', manager: a.manager_level ?? '', proposed: String(a.manager_level ?? a.self_level ?? ''),
    evidence: [a.evidence_manager, a.evidence_self].filter(Boolean).join(' · '), source: a.manager_level != null ? 'Manager' : 'Self' }));
}
function aiProposed({ t, lang }) {
  return C.assessments(t.project_id).map(a => {
    const s = a.self_level, m = a.manager_level; const p = m == null ? s : s == null ? m : Math.round((s + 2 * m) / 3);
    const why = s != null && m != null ? Math.abs(s - m) >= 2 ? T(lang, `Self ${s}, manager ${m}: two levels apart, ${p} kept (manager counts double); to confirm by an observation.`, `Auto ${s}, manager ${m} : deux niveaux d’écart, ${p} retenu (le manager compte double) ; à confirmer par une observation.`, `ذاتي ${s}، مدير ${m}: فرق مستويين، اعتمد ${p}.`)
      : T(lang, `Self ${s}, manager ${m}: ${p} kept (manager counts double).`, `Auto ${s}, manager ${m} : ${p} retenu (le manager compte double).`, `ذاتي ${s}، مدير ${m}: اعتمد ${p}.`) : T(lang, 'Only one assessment received.', 'Une seule évaluation reçue.', 'تقييم واحد فقط.');
    return { employee: a.employee, competency: a.competency_code, self: s ?? '', manager: m ?? '', proposed: p != null ? String(p) : '', evidence: [why, a.evidence_manager].filter(Boolean).join(' '), source: m != null ? 'Manager' : 'Self' };
  });
}
function completeProposed({ req, t, rows }) {
  for (const r of rows) { const a = C.assessments(t.project_id).find(x => norm(x.employee) === norm(str(r.employee)) && norm(x.competency_code) === norm(str(r.competency))); if (a) C.patch(a._id, { proposed_level: num(r.proposed), proposal_evidence: str(r.evidence), proposal_source: r.source || null }, req.user.id); }
}
function inventoryStats(t) { const sa = C.assessments(t.project_id); const both = sa.filter(x => x.self_level != null && x.manager_level != null); return { n: sa.length, people: new Set(sa.map(x => x.employee)).size, comps: new Set(sa.map(x => x.competency_code)).size, both: both.length, far: both.filter(x => Math.abs(x.self_level - x.manager_level) >= 2).length, proposed: sa.filter(x => x.proposed_level != null).length, avg: avg(sa.map(x => x.proposed_level)) }; }
function tplValidate({ t, lang }) { const s = inventoryStats(t); return { decision: 'Approved', subject: T(lang, `Skills inventory: ${s.people} people, ${s.comps} competencies`, `Inventaire des compétences : ${s.people} personnes, ${s.comps} compétences`, `جرد الكفاءات: ${s.people} أشخاص، ${s.comps} كفاءات`), rationale: T(lang, `${s.proposed} levels proposed from the self and manager assessments.`, `${s.proposed} niveaux proposés à partir des auto-évaluations et des évaluations managers.`, `${s.proposed} مستوى مقترح.`) }; }
function aiValidate({ t, lang }) {
  const s = inventoryStats(t); const cover = s.n ? Math.round((s.both / s.n) * 100) : 0;
  return { decision: s.far > s.n / 4 ? 'Approved with conditions' : 'Approved', subject: tplValidate({ t, lang }).subject,
    rationale: T(lang, `${s.n} lines, ${cover} % with both assessments; average proposed level ${fmtN(s.avg, lang)}; ${s.far} line(s) with two levels or more between self and manager.`, `${s.n} lignes, ${cover} % avec les deux évaluations ; niveau proposé moyen ${fmtN(s.avg, lang)} ; ${s.far} ligne(s) avec deux niveaux d’écart ou plus entre auto-évaluation et manager.`, `${s.n} سطر، ${cover}% بالتقييمين.`),
    conditions: s.far ? T(lang, `Confirm the ${s.far} diverging line(s) by an observation at work before the plan is approved.`, `Confirmer la ou les ${s.far} ligne(s) divergente(s) par une observation en situation avant l’approbation du plan.`, `تأكيد السطور المتباينة بملاحظة في العمل.`) : '' };
}
function completeValidate({ req, t, fields }) {
  if (!/^Approved/.test(fields.decision || '')) return;
  for (const a of C.assessments(t.project_id)) C.patch(a._id, { validated_level: a.proposed_level ?? a.manager_level ?? a.self_level, validated_at: today(), validated_by: req.user.name }, req.user.id);
}

/* ------------------------------------------------------------------ MP-03.1 gaps, MP-03.2 review, MP-28 forecast and dataset */
export function computeGaps(req, t) {
  const tg = C.targets(t.project_id); const keep = new Set(); let n = 0;
  for (const a of C.assessments(t.project_id)) {
    const v = a.validated_level; if (v == null) continue;
    const target = tg.find(x => norm(x.position) === norm(a.position) && norm(x.competency_code) === norm(a.competency_code)); if (!target) continue;
    const gap = Math.max(0, target.target_level - v); const key = `gap|${norm(a.employee)}|${norm(a.competency_code)}`; keep.add(key);
    C.upsert(req, t, 'SkillGap', key, { employee_id: a.employee_id, employee: a.employee, position: a.position, site: a.site, competency_code: a.competency_code, competency_id: a.competency_id, competency: a.competency,
      target_level: target.target_level, validated_level: v, gap_value: gap, criticality: target.criticality || null, is_critical: gap >= 2 || (target.criticality === 'Critical' && gap >= 1), label: a.competency, flow_step: 'MP-03.1' }); n++;
  }
  C.prune('SkillGap', t.project_id, 'MP-03.1', keep);
  const g = C.gaps(t.project_id); if (g.length) { C.kpiValue(req, t, 'KPI-003', Math.round((g.filter(x => x.is_critical).length / g.length) * 100)); }
  return n;
}
export function gapStats(t, lang) {
  const g = C.gaps(t.project_id); const by = new Map();
  for (const x of g) { const k = x.competency_code; const a = by.get(k) || { code: k, name: str(x.competency, lang), gaps: [], crit: 0, people: 0, levels: [], targets: [] }; a.gaps.push(x.gap_value); a.levels.push(x.validated_level); a.targets.push(x.target_level); if (x.is_critical) a.crit++; if (x.gap_value > 0) a.people++; by.set(k, a); }
  return { g, byComp: [...by.values()].map(a => ({ ...a, avgGap: avg(a.gaps), avgLevel: avg(a.levels), avgTarget: avg(a.targets) })).sort((a, b) => b.avgGap - a.avgGap), avgGap: avg(g.map(x => x.gap_value)), crit: g.filter(x => x.is_critical).length, people: new Set(g.filter(x => x.gap_value > 0).map(x => x.employee)).size };
}
function gapsPanel({ req, t, lang }) {
  const s = gapStats(t, lang); const comps = [...new Set(s.g.map(x => x.competency_code))]; const people = [...new Set(s.g.map(x => x.employee))];
  const matrix = people.map(p => { const r = { employee: p, position: s.g.find(x => x.employee === p)?.position || '' }; for (const c of comps) { const x = s.g.find(y => y.employee === p && y.competency_code === c); r[c] = x ? `${x.gap_value}${x.is_critical ? ' !' : ''}` : '—'; } return r; });
  return { notes: [T(lang, 'Gap = target level of the position − validated level. “!” marks a critical gap (two levels or more, or one level on a critical competency).', 'Écart = niveau cible du poste − niveau validé. « ! » signale un écart critique (deux niveaux ou plus, ou un niveau sur une compétence critique).', 'الفجوة = المستوى المستهدف − المستوى المعتمد.')],
    kpis: [{ label: T(lang, 'Average gap', 'Écart moyen', 'متوسط الفجوة'), value: fmtN(s.avgGap, lang) }, { label: T(lang, 'Critical gaps', 'Écarts critiques', 'فجوات حرجة'), value: `${s.crit} / ${s.g.length}` }, { label: T(lang, 'People with a gap', 'Personnes en écart', 'أشخاص في فجوة'), value: s.people }],
    tables: [{ title: T(lang, 'Gap matrix (person × competency)', 'Matrice des écarts (personne × compétence)', 'مصفوفة الفجوات'), csv: true, columns: [['employee', T(lang, 'Person', 'Personne', 'الشخص')], ['position', T(lang, 'Position', 'Poste', 'المنصب')], ...comps.map(c => [c, c])], rows: matrix },
      { title: T(lang, 'By competency', 'Par compétence', 'حسب الكفاءة'), csv: true, columns: [['name', T(lang, 'Competency', 'Compétence', 'الكفاءة')], ['avgLevel', T(lang, 'Average level', 'Niveau moyen', 'المستوى المتوسط')], ['avgTarget', T(lang, 'Average target', 'Cible moyenne', 'الهدف المتوسط')], ['avgGap', T(lang, 'Average gap', 'Écart moyen', 'متوسط الفجوة')], ['crit', T(lang, 'Critical', 'Critiques', 'حرجة')]],
        rows: s.byComp.map(a => ({ name: `${a.code} — ${a.name}`, avgLevel: fmtN(a.avgLevel, lang), avgTarget: fmtN(a.avgTarget, lang), avgGap: fmtN(a.avgGap, lang), crit: a.crit })) }],
    actions: [{ key: 'gaps', label: T(lang, 'Compute the gaps', 'Calculer les écarts', 'حساب الفجوات'), icon: 'Calculator', primary: true }] };
}
function gapFindings(t, lang) {
  const s = gapStats(t, lang); const top = s.byComp.slice(0, 3);
  const bySite = new Map(); for (const x of s.g) { const k = x.site || '—'; const a = bySite.get(k) || []; a.push(x.gap_value); bySite.set(k, a); }
  return T(lang, `Average gap ${fmtN(s.avgGap, lang)} on ${s.g.length} person-competency pairs; ${s.crit} critical gap(s); ${s.people} people concerned.`, `Écart moyen ${fmtN(s.avgGap, lang)} sur ${s.g.length} couples personne-compétence ; ${s.crit} écart(s) critique(s) ; ${s.people} personnes concernées.`, `متوسط الفجوة ${fmtN(s.avgGap, lang)}.`) + '\n' +
    top.map(a => `• ${a.code} ${a.name}: ${T(lang, 'average gap', 'écart moyen', 'متوسط الفجوة')} ${fmtN(a.avgGap, lang)}, ${a.crit} ${T(lang, 'critical', 'critique(s)', 'حرجة')}`).join('\n') + '\n' +
    [...bySite.entries()].map(([k, v]) => `• ${T(lang, 'Site', 'Site', 'الموقع')} ${k}: ${fmtN(avg(v), lang)}`).join('\n');
}
const tplReview = ({ t, lang }) => ({ findings: gapFindings(t, lang), conclusion: 'Conforming', followUp: '' });
function aiReview({ t, lang }) {
  const s = gapStats(t, lang); const top = s.byComp.filter(a => a.avgGap >= 1);
  return { findings: gapFindings(t, lang), conclusion: s.crit ? 'Minor corrections' : 'Conforming',
    followUp: top.length ? top.map(a => T(lang, `Treat ${a.code} ${a.name} first in the plan (average gap ${fmtN(a.avgGap, lang)}).`, `Traiter en priorité ${a.code} ${a.name} dans le plan (écart moyen ${fmtN(a.avgGap, lang)}).`, `معالجة ${a.code} أولاً.`)).join('\n') : T(lang, 'No competency above one level of gap.', 'Aucune compétence au-delà d’un niveau d’écart.', 'لا فجوة تتجاوز مستوى واحداً.') };
}
const rag = g => (g >= 1.5 ? 'Red' : g >= 0.75 ? 'Amber' : 'Green');
const tplForecast = ({ t, lang }) => gapStats(t, lang).byComp.map(a => ({ competency: a.code, current: a.avgGap, forecast6: a.avgGap, forecast12: a.avgGap, assumption: T(lang, 'Without training, the gap stays as it is.', 'Sans formation, l’écart reste le même.', 'دون تكوين تبقى الفجوة كما هي.'), status: rag(a.avgGap) }));
const aiForecast = ({ t, lang }) => gapStats(t, lang).byComp.map(a => { const f6 = round1(Math.max(0, a.avgGap - 0.5)); const f12 = round1(Math.max(0, a.avgGap - 1));
  return { competency: a.code, current: a.avgGap, forecast6: f6, forecast12: f12, assumption: T(lang, `If the plan trains the ${a.people} people concerned: one level gained within 12 months, half of it in 6 months.`, `Si le plan forme les ${a.people} personnes concernées : un niveau gagné en 12 mois, la moitié en 6 mois.`, `إذا كونت الخطة الأشخاص المعنيين.`), status: rag(f12) }; });
function datasetPanel({ t, lang }) {
  const s = gapStats(t, lang); const sites = new Map(); for (const x of s.g) { const a = sites.get(x.site || '—') || { site: x.site || '—', n: 0, gaps: [], crit: 0 }; a.n++; a.gaps.push(x.gap_value); if (x.is_critical) a.crit++; sites.set(a.site, a); }
  return { notes: [T(lang, 'The dataset joins the targets, validated levels and gaps; download it as CSV for any further analysis.', 'Le jeu de données réunit cibles, niveaux validés et écarts ; téléchargez-le en CSV pour toute analyse complémentaire.', 'تجمع مجموعة البيانات الأهداف والمستويات والفجوات.')],
    tables: [{ title: T(lang, 'Dataset', 'Jeu de données', 'مجموعة البيانات'), csv: true, columns: [['employee', T(lang, 'Person', 'Personne', 'الشخص')], ['position', T(lang, 'Position', 'Poste', 'المنصب')], ['site', T(lang, 'Site', 'Site', 'الموقع')], ['competency', T(lang, 'Competency', 'Compétence', 'الكفاءة')], ['target', T(lang, 'Target', 'Cible', 'الهدف')], ['level', T(lang, 'Validated', 'Validé', 'معتمد')], ['gap', T(lang, 'Gap', 'Écart', 'الفجوة')]],
      rows: s.g.map(x => ({ employee: x.employee, position: x.position, site: x.site || '—', competency: x.competency_code, target: x.target_level, level: x.validated_level, gap: x.gap_value })) },
      { title: T(lang, 'By site', 'Par site', 'حسب الموقع'), columns: [['site', T(lang, 'Site', 'Site', 'الموقع')], ['n', T(lang, 'Pairs', 'Couples', 'أزواج')], ['avg', T(lang, 'Average gap', 'Écart moyen', 'متوسط الفجوة')], ['crit', T(lang, 'Critical', 'Critiques', 'حرجة')]], rows: [...sites.values()].map(a => ({ site: a.site, n: a.n, avg: fmtN(avg(a.gaps), lang), crit: a.crit })) }] };
}

export const HOOKS = {
  'MP-02.1': { template: tplCompetencies, ai: aiCompetencies, complete: completeCompetencies },
  'MP-02.2': { template: tplTargets, ai: aiTargets, complete: completeTargets, blocker: ({ t }) => (C.competencies(t.project_id).length ? null : 'err.flowNoCompetencies') },
  'MP-02.3': { template: tplPopulation, ai: aiPopulation, completeAsync: ({ req, t, rows }) => launchAssessment(req, t, rows), panel: ctx => campaignPanel(ctx), actions: { remind: async ({ req, t }) => ({ sent: await C.remindNow(req, C.campaignOf(req.orgId, t.project_id, 'assessment')) }) },
    blocker: ({ t }) => (C.targets(t.project_id).length ? null : 'err.flowNoTargets') },
  'MP-02.4': { panel: ctx => campaignPanel(ctx), actions: { remind: async ({ req, t }) => ({ sent: await C.remindNow(req, C.campaignOf(req.orgId, t.project_id, 'assessment')) }) },
    blocker: ({ req, t }) => { const q = C.campaignOf(req.orgId, t.project_id, 'assessment'); return !q ? 'err.flowNoCampaign' : C.invitationsOf(req.orgId, q).some(i => i.status === 'Responded') ? null : 'err.noResponses'; } },
  'MP-02.5': { panel: consolidatePanel, actions: { consolidate: ({ req, t }) => ({ lines: consolidate(req, t) }) }, onComplete: ({ req, t }) => consolidate(req, t), blocker: ({ t }) => (C.assessments(t.project_id).length ? null : 'err.noResponses') },
  'MP-02.6': { template: tplProposed, ai: aiProposed, complete: completeProposed },
  'MP-02.7': { template: tplValidate, ai: aiValidate, complete: completeValidate },
  'MP-03.1': { panel: gapsPanel, actions: { gaps: ({ req, t }) => ({ lines: computeGaps(req, t) }) }, onComplete: ({ req, t }) => computeGaps(req, t), blocker: ({ t }) => (C.gaps(t.project_id).length ? null : 'err.flowNoGaps') },
  'MP-03.2': { template: tplReview, ai: aiReview },
  'MP-28.3': { template: tplForecast, ai: aiForecast },
  'MP-28.1': { panel: datasetPanel, blocker: ({ t }) => (C.gaps(t.project_id).length ? null : 'err.flowNoGaps') },
};
export { L };
