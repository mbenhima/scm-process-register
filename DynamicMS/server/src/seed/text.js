// Trilingual text composition for the seeded "full runs": what each user typed into
// each step form (records as rows, decision matrices, KPIs picked from the project list,
// review decisions...), plus names for records. All content is fictional demonstration data.
import { FORM_KINDS, matrixScore } from '../catalog/forms.js';
import { templatesForMp } from '../content/templates.js';
import { addDays } from './rng.js';
import { STEP_CONTENT, fv } from './content.js';

export const S = (en, fr, ar) => ({ en, fr, ar });
const LANGS = ['en', 'fr', 'ar'];
const SEP = { en: '; ', fr: ' ; ', ar: '؛ ' };

export function fill(t, ...args) {
  const out = {};
  for (const l of LANGS) {
    out[l] = t[l].replace(/\{(\d)\}/g, (_, i) => {
      const a = args[+i];
      if (a === null || a === undefined) return '';
      if (Array.isArray(a)) return a.map(x => (x && typeof x === 'object' ? x[l] ?? x.en : x)).join(SEP[l]);
      if (typeof a === 'object') return a[l] ?? a.en;
      return String(a);
    });
  }
  return out;
}

export const joinLines = (items) => {
  const out = {};
  for (const l of LANGS) out[l] = items.map((x, i) => `${i + 1}. ${typeof x === 'object' ? x[l] ?? x.en : x}`).join('\n');
  return out;
};

const FREQ = {
  Annual: S('Annual', 'Annuel', 'سنوي'), 'Semi-annual': S('Semi-annual', 'Semestriel', 'نصف سنوي'),
  Quarterly: S('Quarterly', 'Trimestriel', 'ربع سنوي'), Monthly: S('Monthly', 'Mensuel', 'شهري'), Weekly: S('Weekly', 'Hebdomadaire', 'أسبوعي'),
};
const FREQ_DAYS = { Annual: 365, 'Semi-annual': 182, Quarterly: 91, Monthly: 30, Weekly: 7 };
export const DECISIONS = { Go: S('Go', 'Go', 'المضي'), 'No-Go': S('No-Go', 'No-Go', 'عدم المضي'), Hold: S('Hold', 'En attente', 'تعليق') };
export const OUTCOMES = { Accepted: S('Accepted', 'Acceptée', 'مقبول'), Edited: S('Edited', 'Modifiée', 'معدَّل'), Rejected: S('Rejected', 'Rejetée', 'مرفوض') };
const PRIO = ['High', 'Medium', 'Medium', 'Low', 'Medium', 'High'];

const T = {
  partiesPool: [S('Customers ({0})', 'Clients ({0})', 'العملاء ({0})'), S('Employees and their representatives', 'Salariés et leurs représentants', 'الموظفون وممثلوهم'), S('Regulators and certification body', 'Régulateurs et organisme de certification', 'الجهات التنظيمية وجهة الاعتماد'), S('Suppliers of {1}', 'Fournisseurs de {1}', 'موردو {1}'), S('Shareholders and lenders', 'Actionnaires et bailleurs', 'المساهمون والمموّلون'), S('Local community', 'Communauté locale', 'المجتمع المحلي')],
  oppPool: [S('Digitize {0} records to cut cycle time', 'Numériser les enregistrements de {0} pour réduire les délais', 'رقمنة سجلات {0} لتقليص زمن الدورة'), S('Extend certification to win {0} tenders', 'Étendre la certification pour remporter des appels d\'offres {0}', 'توسيع الاعتماد للفوز بمناقصات {0}'), S('Supplier development programme for {0}', 'Programme de développement fournisseurs pour {0}', 'برنامج تطوير الموردين لـ {0}')],
  causes: [S('Work instruction not updated after change', 'Instruction de travail non mise à jour après modification', 'عدم تحديث تعليمات العمل بعد التغيير'), S('Insufficient training of new operators', 'Formation insuffisante des nouveaux opérateurs', 'تدريب غير كافٍ للمشغلين الجدد'), S('Supplier batch variation not detected', 'Variation du lot fournisseur non détectée', 'عدم اكتشاف تباين دفعة المورد'), S('Measurement equipment out of calibration', 'Équipement de mesure hors étalonnage', 'معدات قياس خارج المعايرة')],
};
const CAT = {
  risk: S('Risk', 'Risque', 'مخاطرة'), party: S('Interested party', 'Partie intéressée', 'طرف معني'), issueI: S('Internal issue', 'Enjeu interne', 'قضية داخلية'), issueE: S('External issue', 'Enjeu externe', 'قضية خارجية'),
  hazard: S('Hazard', 'Danger', 'خطر'), aspect: S('Environmental aspect', 'Aspect environnemental', 'جانب بيئي'), opp: S('Opportunity', 'Opportunité', 'فرصة'), kpi: S('Indicator', 'Indicateur', 'مؤشر'),
  std: S('Requirement', 'Exigence', 'متطلب'), cause: S('Root cause', 'Cause racine', 'سبب جذري'), sup: S('Supplier', 'Fournisseur', 'مورد'), defect: S('Nonconformity', 'Non-conformité', 'عدم مطابقة'), output: S('Output', 'Élément de sortie', 'مخرج'),
};
// Evidence each row comes from: a named record, not a generic "workshop".
const EVIDENCE = [
  S('Management review minutes, {m}', 'Compte rendu de revue de direction, {m}', 'محضر مراجعة الإدارة، {m}'),
  S('Customer complaint log, {m}', 'Journal des réclamations clients, {m}', 'سجل شكاوى العملاء، {m}'),
  S('Internal audit report, {m}', 'Rapport d\'audit interne, {m}', 'تقرير التدقيق الداخلي، {m}'),
  S('Process performance dashboard, {m}', 'Tableau de bord de performance, {m}', 'لوحة أداء العمليات، {m}'),
  S('Interview with the process owner, {m}', 'Entretien avec le pilote du processus, {m}', 'مقابلة مع مالك العملية، {m}'),
  S('Regulatory watch bulletin, {m}', 'Bulletin de veille réglementaire, {m}', 'نشرة الرصد التنظيمي، {m}'),
  S('Supplier evaluation file, {m}', 'Dossier d\'évaluation fournisseurs, {m}', 'ملف تقييم الموردين، {m}'),
];
const MONTHS = { en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'], ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'] };
const monthOf = (d) => { const [y, m] = d.split('-').map(Number); return Object.fromEntries(LANGS.map(l => [l, `${MONTHS[l][m - 1]} ${y}`])); };
const evidence = (i, d, extra) => fv(extra ? S(`{x} — ${EVIDENCE[i % EVIDENCE.length].en}`, `{x} — ${EVIDENCE[i % EVIDENCE.length].fr}`, `{x} — ${EVIDENCE[i % EVIDENCE.length].ar}`) : EVIDENCE[i % EVIDENCE.length], { m: monthOf(addDays(d, -7 - i * 9)), x: extra });

// Picks the item pool that best matches the step's wording: [{item, category}]
function listPool(stepEn, c) {
  const s = stepEn.toLowerCase();
  const P = c.profile;
  const tag = (list, category) => list.map(item => ({ item, category }));
  if (/external issue|scenario|threat|horizon|regulat/.test(s)) return [...tag(c.segRisks.slice(0, 3), CAT.issueE), ...tag([fill(S('Revision of {0}', 'Révision de {0}', 'مراجعة {0}'), c.stdMain)], CAT.std)];
  if (/internal issue|weakness|friction|pain/.test(s)) return tag([...P.defects.slice(0, 2), fill(S('Workload on {0}', 'Charge de travail sur {0}', 'عبء العمل في {0}'), P.line)], CAT.issueI);
  if (/interested part|stakeholder|audience|recipient/.test(s)) return tag(T.partiesPool.slice(0, 4).map(t => fill(t, P.customer, P.supplier)), CAT.party);
  if (/hazard|exposure|safety/.test(s) && c.qhse) return [...tag(P.hazards, CAT.hazard), ...tag(c.segRisks.slice(0, 1), CAT.risk)];
  if (/aspect|environment|emission|waste|water|carbon/.test(s)) return tag([...P.aspects, fill(S('Energy use of {0}', 'Consommation d\'énergie de {0}', 'استهلاك الطاقة في {0}'), P.line)], CAT.aspect);
  if (/opportunit|innovation|idea|improvement/.test(s)) return tag(T.oppPool.map(t => fill(t, P.product)), CAT.opp);
  if (/risk/.test(s)) return [...tag(c.segRisks.slice(0, 3), CAT.risk), ...tag(c.qhse ? [P.hazards[0], P.aspects[0]] : [P.defects[0]], CAT.risk)];
  if (/kpi|indicator|metric/.test(s)) return tag(c.mpKpis(4).map(k => k.name), CAT.kpi);
  if (/standard|requirement|obligation|clause|law|regulation/.test(s)) return tag(c.standards.slice(0, 4).map(x => ({ en: x, fr: x, ar: x })), CAT.std);
  if (/cause|root/.test(s)) return tag(T.causes.slice(0, 3), CAT.cause);
  if (/supplier|third part/.test(s)) return tag([fill(S('{0} supplier A (critical)', 'Fournisseur A de {0} (critique)', 'المورد أ لـ {0} (حرج)'), P.supplier), fill(S('{0} supplier B', 'Fournisseur B de {0}', 'المورد ب لـ {0}'), P.supplier), S('Logistics provider', 'Prestataire logistique', 'مزوّد الخدمات اللوجستية')], CAT.sup);
  if (/defect|problem|nonconform|finding|complaint/.test(s)) return tag(P.defects, CAT.defect);
  return tag(c.mp.sipoc.O.slice(0, 3), CAT.output);
}
const DETAIL = S('Affects {0}; followed by {1}.', 'Impacte {0} ; suivi par {1}.', 'يؤثر في {0}؛ ويتابعه {1}.');

// Criteria of a decision matrix, derived from the macro process outputs and standards.
function matrixFor(c, done, r) {
  const o1 = c.mp.sipoc.O[0]; const o2 = c.mp.sipoc.O[1] || o1;
  const std = c.mp.clauses || c.stdMain;
  const sc = () => r.int(done ? 3 : 2, 5);
  const rows = [
    { criterion: fill(S('{0} complete and up to date', '{0} complet et à jour', '{0} مكتمل ومحدث'), o1), weight: 30, score: sc(), justification: fill(S('{0} reviewed on {1}; 2 gaps corrected.', '{0} revu le {1} ; 2 écarts corrigés.', 'تمت مراجعة {0} في {1}؛ وتصحيح فجوتين.'), o1, addDays(c.due, -5)) },
    { criterion: fill(S('Requirements of {0} met', 'Exigences de {0} satisfaites', 'استيفاء متطلبات {0}'), std), weight: 30, score: sc(), justification: fill(S('Checked against {0} with the checklist of the phase gate.', 'Vérifié au regard de {0} avec la liste de contrôle du jalon.', 'تم التحقق وفق {0} بقائمة تحقق بوابة المرحلة.'), std) },
    { criterion: fill(S('Evidence available for {0}', 'Preuves disponibles pour {0}', 'توفر الأدلة لـ {0}'), o2), weight: 20, score: sc(), justification: fill(S('Records filed in the project: {0}.', 'Enregistrements classés dans le projet : {0}.', 'السجلات محفوظة في المشروع: {0}.'), o2) },
    { criterion: S('Results against target', 'Résultats par rapport à la cible', 'النتائج مقارنة بالمستهدف'), weight: 20, score: sc(), justification: fill(S('KPI {0} used as the measure.', 'KPI {0} utilisé comme mesure.', 'استُخدم المؤشر {0} كمقياس.'), c.mpKpis(1)[0]?.code || '—') },
  ];
  return rows;
}

export function makeCtx(base, mp, due) {
  const c = { ...base, mp, due };
  c.mpKpis = (n) => { const own = base.kpis.filter(k => k.mp === mp.id); return (own.length ? own : base.kpis.filter(k => k.core)).slice(0, n); };
  return c;
}

// Builds the typed form values + a one-line trilingual summary for a step.
export function stepValue(step, base, r, status, dueDate) {
  const kind = step.formKind;
  const c = makeCtx(base, base.mp, dueDate);
  const mp = c.mp;
  const out1 = mp.sipoc.O[0]; const out2 = mp.sipoc.O[1] || out1;
  const done = status === 'Done';
  const owner = mp.ownerRoleCode || 'ims_manager';
  const special = STEP_CONTENT[step.id];
  let f = special ? special(c) : null;
  if (!f) switch (kind) {
    case 'standards': f = { standards: c.standards, scopeType: c.qhse ? 'Integrated' : 'Single-standard', coverage: c.obsAll, rationale: fill(S('Standards required by customers and the sector: {0}.', 'Normes exigées par les clients et le secteur : {0}.', 'المعايير التي يطلبها العملاء والقطاع: {0}.'), c.standards.join(', ')) }; break;
    case 'periodicity': {
      const e = +mp.e2e.slice(4);
      const key = e <= 2 ? 'Annual' : e <= 4 ? 'Semi-annual' : e <= 8 ? 'Quarterly' : 'Monthly';
      f = { frequency: key, nextDate: addDays(dueDate, FREQ_DAYS[key]), chair: owner, scope: c.obsFor(owner),
        notes: fill(S('Inputs for each review: {0}. An early review is triggered by: {1}', 'Éléments d\'entrée de chaque revue : {0}. Une revue anticipée est déclenchée par : {1}', 'مدخلات كل مراجعة: {0}. وتُطلق مراجعة مبكرة عند: {1}'), mp.sipoc.I.slice(0, 3), mp.trigger) };
      break;
    }
    case 'list': {
      const items = listPool(step.sourceName?.en || step.name.en, c).slice(0, 4);
      f = { items: items.map((x, i) => ({ item: x.item, category: x.category, detail: fill(DETAIL, i % 2 ? out2 : out1, c.roleName(owner)), priority: PRIO[i], source: evidence(i + step.seq, dueDate) })) };
      break;
    }
    case 'assess': {
      const matrix = matrixFor(c, done, r);
      const score = matrixScore(matrix);
      f = { matrix, score, rationale: fill(S('Weighted score {0}/5. Main gap: {1}. Action recorded in the action plan.', 'Note pondérée {0}/5. Écart principal : {1}. Action enregistrée dans le plan d\'actions.', 'الدرجة المرجحة {0}/5. الفجوة الرئيسية: {1}. سُجل إجراء في خطة العمل.'), score, r.pick([...c.segRisks.slice(0, 2), c.profile.defects[0]])) };
      break;
    }
    case 'decision': {
      const dec = done ? (r.chance(0.92) ? 'Go' : 'Hold') : 'Hold';
      f = { criteria: [
        { criterion: fill(S('{0} complete', '{0} complet', 'اكتمال {0}'), out1), met: 'Yes', evidence: fill(S('{0} v1.0', '{0} v1.0', '{0} الإصدار 1.0'), out1) },
        { criterion: fill(S('Requirements of {0} met', 'Exigences de {0} satisfaites', 'استيفاء متطلبات {0}'), mp.clauses || c.stdMain), met: dec === 'Go' ? 'Yes' : 'Partly', evidence: S('Checklist of the phase gate', 'Liste de contrôle du jalon', 'قائمة تحقق بوابة المرحلة') },
        { criterion: S('Risks reviewed', 'Risques revus', 'مراجعة المخاطر'), met: 'Yes', evidence: S('Risk register', 'Registre des risques', 'سجل المخاطر') },
      ], decision: dec, approver: owner, comment: dec === 'Go' ? fill(S('{0} approved against {1}; no blocking point.', '{0} approuvé au regard de {1} ; aucun point bloquant.', 'تمت الموافقة على {0} وفق {1}؛ لا توجد نقطة معيقة.'), out1, c.stdMain) : fill(S('Hold until {0} is complete; review in two weeks.', 'En attente jusqu\'à l\'achèvement de {0} ; revue dans deux semaines.', 'تعليق حتى اكتمال {0}؛ مراجعة بعد أسبوعين.'), out2) };
      break;
    }
    case 'document': {
      const t = templatesForMp(mp.id, c.ms)[0];
      f = { template: t ? t.code : (/sheet/i.test(step.name.en) ? 'TPL-PSHEET' : 'TPL-PROC'), docRef: `${c.orgCode}-${c.ms}-${mp.code}-${String(step.seq).padStart(2, '0')}`, version: done ? r.pick(['1.0', '1.1', '2.0']) : '0.9',
        summary: fill(S('{0} for {1}, aligned with {2}; generated from the project data, then completed by the author.', '{0} pour {1}, aligné sur {2} ; généré à partir des données du projet puis complété par l\'auteur.', '{0} لـ {1}، متوافق مع {2}؛ مولَّد من بيانات المشروع ثم استكمله المؤلف.'), out1, c.profile.product, c.stdMain) };
      break;
    }
    case 'communicate': {
      const chs = ['Meeting', 'E-mail', 'Intranet', 'Notice board'];
      f = { messages: mp.sipoc.C.slice(0, 2).map((aud, i) => ({ audience: [{ id: null, name: aud }], channel: chs[(step.seq + i) % chs.length], date: addDays(dueDate, i * 2), message: fill(S('{0}: what changes for you and what to do by {1}.', '{0} : ce qui change pour vous et ce qu\'il faut faire avant le {1}.', '{0}: ما الذي يتغير بالنسبة لكم وما المطلوب قبل {1}.'), i ? out2 : out1, addDays(dueDate, 14)), by: owner })) };
      break;
    }
    case 'train': {
      const n = r.int(6, 28); const eff = r.int(78, 97);
      f = { session: fill(S('{0} — practice session', '{0} — session pratique', '{0} — جلسة تطبيقية'), step.name), date: dueDate, audience: c.obsFor(owner), participants: n, method: r.pick(['Quiz', 'On-the-job observation', 'Practical test']), effectiveness: done ? eff : null };
      break;
    }
    case 'monitor': {
      const ks = c.mpKpis(2);
      f = { kpis: ks.map(k => { const ok = r.chance(0.72); return { kpi: k.id, why: fill(S('{0} measures the result of this macro process ({1}); it is the KPI its owner reviews at each {2} review.', '{0} mesure le résultat de ce macro-processus ({1}) ; c\'est le KPI revu par son pilote à chaque revue {2}.', 'يقيس {0} نتيجة هذه العملية الكلية ({1})؛ وهو المؤشر الذي يراجعه مالكها في كل مراجعة {2}.'), k.name, out1, FREQ[k.freq] || FREQ.Monthly), value: ok ? k.sample : k.sample, target: k.targetText }; }),
        comment: fill(S('Trend over the last three months: {0}. Next analysis at the performance review.', 'Tendance sur les trois derniers mois : {0}. Prochaine analyse en revue de performance.', 'الاتجاه خلال الأشهر الثلاثة الأخيرة: {0}. التحليل القادم في مراجعة الأداء.'), r.chance(0.7) ? S('improving', 'en amélioration', 'في تحسن') : S('stable, below target; action opened', 'stable, sous la cible ; action ouverte', 'مستقر ودون المستهدف؛ تم فتح إجراء')) };
      break;
    }
    case 'review': {
      const e = +mp.e2e.slice(4);
      const key = e <= 2 ? 'Annual' : e <= 6 ? 'Semi-annual' : 'Quarterly';
      f = { frequency: key, date: dueDate, nextDate: addDays(dueDate, FREQ_DAYS[key]), chair: owner, participants: [...new Set([owner, 'ims_manager', 'quality_manager'])].filter(x => x !== owner || true).slice(0, 3),
        inputs: mp.sipoc.I.slice(0, 3).map((inp, i) => ({ input: inp, finding: i === 0 ? fill(S('{0} still valid; minor updates made.', '{0} toujours valable ; mises à jour mineures.', '{0} لا يزال صالحًا؛ مع تحديثات طفيفة.'), inp) : i === 1 ? S('No major change since the last review.', 'Pas de changement majeur depuis la dernière revue.', 'لا تغيير كبير منذ المراجعة الأخيرة.') : fill(S('Gap found on {0}.', 'Écart constaté sur {0}.', 'فجوة في {0}.'), out2) })),
        decisions: [{ decision: fill(S('Update {0}', 'Mettre à jour {0}', 'تحديث {0}'), out2), owner: c.user(owner), due: addDays(dueDate, 30) }] };
      break;
    }
    case 'plan': {
      const next = c.mpSteps.filter(s => s.seq > step.seq).slice(0, 3);
      const acts = next.length ? next.map(s => ({ name: s.name, role: s.roleCode || owner })) : mp.sipoc.P.slice(0, 3).map(p => ({ name: p, role: owner }));
      f = { activities: acts.map((a, i) => ({ activity: a.name, owner: c.user(a.role), start: addDays(dueDate, i * 5), due: addDays(dueDate, 14 + i * 10), deliverable: i % 2 ? out2 : out1 })) };
      break;
    }
    case 'objectives': f = { objectives: c.objectives }; break;
    case 'assign': {
      const role = step.roleCode || owner;
      f = { role, person: c.user(role), scope: c.obsFor(role), racsi: { R: [role], A: [owner === role ? 'ims_manager' : owner], C: [c.qhse ? 'hse_manager' : 'risk_manager'], S: ['document_controller'], I: ['top_management'] } };
      if (f.racsi.A[0] === role) f.racsi.A = ['top_management'];
      break;
    }
    case 'configure': f = { settings: [
      { setting: step.name, value: fill(S('Enabled for {0}', 'Activé pour {0}', 'مفعّل لـ {0}'), c.profile.line), reason: fill(S('Needed to produce {0}', 'Nécessaire pour produire {0}', 'ضروري لإنتاج {0}'), out1) },
      { setting: S('Owner and notification', 'Responsable et notification', 'المسؤول والإشعار'), value: c.roleName(owner), reason: S('Alerts go to the process owner', 'Les alertes vont au pilote du processus', 'تذهب التنبيهات إلى مالك العملية') },
    ], tested: 'Yes' }; break;
    case 'update': {
      const reasons = [S('Finding of the internal audit', 'Constat de l\'audit interne', 'ملاحظة التدقيق الداخلي'), S('Decision of the management review', 'Décision de la revue de direction', 'قرار مراجعة الإدارة'), S('Customer complaint analysis', 'Analyse d\'une réclamation client', 'تحليل شكوى عميل'), S('Change in regulation', 'Évolution réglementaire', 'تغيير في التنظيم')];
      f = { change: fill(S('{0} updated: {1}.', '{0} mis à jour : {1}.', 'تم تحديث {0}: {1}.'), out1, r.pick([...c.segRisks.slice(0, 1), c.profile.defects[1] || c.profile.defects[0]])), reason: reasons[step.seq % reasons.length] };
      break;
    }
    case 'close': f = { evidence: fill(S('{0} closed; effectiveness verified on the KPI and evidence filed.', '{0} clôturé ; efficacité vérifiée sur le KPI et preuves classées.', 'تم إغلاق {0}؛ والتحقق من الفعالية عبر المؤشر وحفظ الأدلة.'), out1), date: dueDate }; break;
    case 'escalate': f = { to: 'top_management', reason: fill(S('{0} is late beyond tolerance; a decision on resources is needed.', '{0} est en retard au-delà de la tolérance ; une décision sur les ressources est nécessaire.', '{0} متأخر بما يتجاوز الحد المسموح؛ ويلزم قرار بشأن الموارد.'), out1) }; break;
    case 'ai': {
      const outcome = done ? r.pick(['Accepted', 'Edited', 'Edited']) : 'Edited';
      f = { context: fill(S('Step: {0}. Inputs: {1}. Standards: {2}. Organization: {3} ({4}).', 'Étape : {0}. Entrées : {1}. Normes : {2}. Organisme : {3} ({4}).', 'الخطوة: {0}. المدخلات: {1}. المعايير: {2}. المؤسسة: {3} ({4}).'), step.name, mp.sipoc.I.slice(0, 3), c.standards.slice(0, 3).join(', '), c.v.org, c.profile.product),
        outcome, final: fill(S('{0} drafted with the assistant and reviewed by {1}: covers {2}.', '{0} rédigé avec l\'assistant et revu par {1} : couvre {2}.', 'صيغ {0} بمساعدة المساعد وراجعه {1}: يغطي {2}.'), out1, c.roleName(owner), c.standards.slice(0, 2).join(', ')) };
      break;
    }
    case 'service': f = { result: fill(S('{0}: done by the DynamicMS Engine; {1} available in the project.', '{0} : réalisé par le moteur DynamicMS ; {1} disponible dans le projet.', '{0}: نفذه محرك DynamicMS؛ و{1} متاح في المشروع.'), step.name, out1) }; break;
    default: {
      const pct = done ? 100 : r.int(30, 80);
      f = { evidence: fill(S('{0} carried out on {1}; {2} updated.', '{0} réalisé sur {1} ; {2} mis à jour.', 'تم تنفيذ {0} في {1}؛ وتحديث {2}.'), step.name, c.profile.line, out1), completion: pct };
    }
  }
  if (kind === 'assess' && Array.isArray(f.matrix)) f.score = matrixScore(f.matrix);
  // Row cells start with a capital letter (profile phrases are lower case for use inside sentences).
  const capT = (v) => (v && typeof v === 'object' && !Array.isArray(v) && (v.en || v.fr) ? Object.fromEntries(Object.entries(v).map(([l, x]) => [l, typeof x === 'string' && l !== 'ar' ? x.charAt(0).toUpperCase() + x.slice(1) : x])) : v);
  for (const [k, v] of Object.entries(f)) if (Array.isArray(v) && v.length && typeof v[0] === 'object' && !('id' in v[0] && 'name' in v[0])) f[k] = v.map(row => Object.fromEntries(Object.entries(row).map(([ck, cv]) => [ck, capT(cv)])));
  if (!done && f.completion === 100) f.completion = r.int(40, 80);
  return { fields: f, summary: summaryOf(kind, f, c) };
}

// One-line trilingual summary for lists (same rules as the live step summary).
export function summaryOf(kind, f, c) {
  const txt = (v, l) => (v === null || v === undefined ? '' : typeof v === 'object' && !Array.isArray(v) ? (v.name ? txt(v.name, l) : v[l] ?? v.en ?? '') : Array.isArray(v) ? v.map(x => txt(x, l)).join(', ') : String(v));
  const def = FORM_KINDS[kind] || FORM_KINDS.execute;
  const rowsField = def.fields.find(x => x.columns && Array.isArray(f[x.key]) && f[x.key].length);
  const out = {};
  for (const l of LANGS) {
    let s;
    if (kind === 'assess') s = `${f.score}/5 — ${txt(f.rationale, l)}`;
    else if (kind === 'decision') s = `${txt(DECISIONS[f.decision] || f.decision, l)} — ${txt(f.comment, l)}`;
    else if (kind === 'monitor' && Array.isArray(f.kpis)) s = f.kpis.map(k => { const kk = c.kpis.find(x => x.id === k.kpi); return `${kk ? txt(kk.name, l) : ''} = ${k.value} (${k.target || ''})`; }).join('; ');
    else if (rowsField) { const first = rowsField.columns[0].key; s = `${f[rowsField.key].length} × ${f[rowsField.key].slice(0, 3).map(x => txt(x[first], l)).join('; ')}`; }
    else if (kind === 'periodicity' || kind === 'review') s = `${txt(FREQ[f.frequency], l)} · ${f.nextDate}`;
    else if (kind === 'standards') s = (f.standards || []).join(', ');
    else s = Object.values(f).map(v => txt(v, l)).find(x => x && x.length) || '';
    out[l] = s.slice(0, 240);
  }
  return out;
}

// "What to type" for the user guides (English): one entry per field; row tables are
// returned as { columns, rows } so the guide can print a real table.
export function guideExample(kind, fields, resolve = {}) {
  const def = FORM_KINDS[kind] || FORM_KINDS.execute;
  const en = (v) => (v === null || v === undefined ? '' : typeof v === 'object' && !Array.isArray(v) ? (v.name ? en(v.name) : v.en ?? '') : Array.isArray(v) ? v.map(en).join(', ') : String(v));
  const cellText = (type, v) => {
    if (type === 'person') return resolve.user ? resolve.user(v) : en(v);
    if (type === 'role') return resolve.role ? resolve.role(v) : en(v);
    if (type === 'kpi') return resolve.kpi ? resolve.kpi(v) : en(v);
    if (type === 'roles') return (v || []).map(x => (resolve.role ? resolve.role(x) : x)).join(', ');
    return en(v);
  };
  return def.fields.map(fd => {
    const v = fields ? fields[fd.key] : '';
    if (fd.columns) return { field: fd.label.en, type: fd.type, columns: fd.columns.map(c => c.label.en), rows: (Array.isArray(v) ? v : []).map(row => fd.columns.map(c => cellText(c.type, row[c.key]))), createsActions: !!fd.createsActions, createsObjectives: !!fd.createsObjectives };
    if (fd.type === 'racsi') return { field: fd.label.en, type: 'racsi', columns: ['R', 'A', 'C', 'S', 'I'], rows: v ? [['R', 'A', 'C', 'S', 'I'].map(L => (v[L] || []).map(x => (resolve.role ? resolve.role(x) : x)).join(', '))] : [] };
    if (fd.type === 'records') return { field: fd.label.en, type: 'records', value: (Array.isArray(v) ? v : []).map(x => `${x.code ? x.code + ' — ' : ''}${en(x.title)}`).join('; ') };
    if (fd.type === 'template') return { field: fd.label.en, type: 'template', value: resolve.template ? resolve.template(v) : en(v) };
    return { field: fd.label.en, type: fd.type, value: cellText(fd.type, v) };
  });
}
