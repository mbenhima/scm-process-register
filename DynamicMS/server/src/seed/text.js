// Trilingual text composition for the seeded "full runs": what each user typed into
// each step form, plus names for records. All content is fictional demonstration data.
import { FORM_KINDS } from '../catalog/forms.js';
import { addDays } from './rng.js';

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
const CHANNELS = { Intranet: S('Intranet', 'Intranet', 'الشبكة الداخلية'), 'E-mail': S('E-mail', 'E-mail', 'البريد الإلكتروني'), Meeting: S('Meeting', 'Réunion', 'اجتماع'), 'Notice board': S('Notice board', 'Panneau d\'affichage', 'لوحة الإعلانات'), Portal: S('Portal', 'Portail', 'البوابة') };
export const DECISIONS = { Go: S('Go', 'Go', 'المضي'), 'No-Go': S('No-Go', 'No-Go', 'عدم المضي'), Hold: S('Hold', 'En attente', 'تعليق') };
export const OUTCOMES = { Accepted: S('Accepted', 'Acceptée', 'مقبول'), Edited: S('Edited', 'Modifiée', 'معدَّل'), Rejected: S('Rejected', 'Rejetée', 'مرفوض') };

const T = {
  periodNotes: S('Scope: {0} at {1}', 'Périmètre : {0} à {1}', 'النطاق: {0} في {1}'),
  sourceOf: S('Workshop records and {0}', 'Comptes rendus d\'atelier et {0}', 'سجلات ورشة العمل و{0}'),
  assessRationale: S('{0} evidence items reviewed. Main driver: {1}. Linked standard: {2}.', '{0} éléments de preuve revus. Facteur principal : {1}. Norme liée : {2}.', 'تمت مراجعة {0} من عناصر الأدلة. العامل الرئيسي: {1}. المعيار المرتبط: {2}.'),
  decisionComment: S('{0} confirmed against {1}; no blocking issue.', '{0} confirmé au regard de {1} ; aucun point bloquant.', 'تم تأكيد {0} وفق {1}؛ لا توجد مسألة معيقة.'),
  decisionHold: S('Hold until {0} is completed.', 'En attente jusqu\'à l\'achèvement de : {0}.', 'تعليق حتى اكتمال: {0}.'),
  docSummary: S('{0} for {1}, aligned with {2}.', '{0} pour {1}, aligné sur {2}.', '{0} لـ {1}، متوافق مع {2}.'),
  commMessage: S('{0} is published. Please read and acknowledge before {1}.', '{0} est publié. Merci d\'en prendre connaissance avant le {1}.', 'تم نشر {0}. يُرجى الاطلاع والإقرار قبل {1}.'),
  trainSession: S('{0} — awareness and practice session', '{0} — session de sensibilisation et de pratique', '{0} — جلسة توعية وتطبيق'),
  monitorComment: S('Trend {0} versus last period; {1}.', 'Tendance {0} par rapport à la période précédente ; {1}.', 'الاتجاه {0} مقارنة بالفترة السابقة؛ {1}.'),
  up: S('improving', 'en amélioration', 'في تحسن'), down: S('declining', 'en baisse', 'في تراجع'),
  onTarget: S('target met', 'cible atteinte', 'تم بلوغ المستهدف'), offTarget: S('action plan opened', 'plan d\'action ouvert', 'تم فتح خطة عمل'),
  execEvidence: S('{0} completed on {1}; records filed in DynamicMS.', '{0} réalisé sur {1} ; enregistrements archivés dans DynamicMS.', 'تم إنجاز {0} في {1}؛ وحُفظت السجلات في DynamicMS.'),
  execPartial: S('{0} in progress on {1}; remaining items tracked.', '{0} en cours sur {1} ; points restants suivis.', '{0} قيد التنفيذ في {1}؛ ويتم تتبع البنود المتبقية.'),
  assignScope: S('{0} for {1}', '{0} pour {1}', '{0} لـ {1}'),
  configValue: S('Enabled for {0} with {1}', 'Activé pour {0} avec {1}', 'مفعّل لـ {0} مع {1}'),
  configNotes: S('Validated in test before go-live', 'Validé en test avant la mise en production', 'تم التحقق في بيئة الاختبار قبل التشغيل'),
  updateChange: S('{0} updated to reflect {1}.', '{0} mis à jour pour intégrer : {1}.', 'تم تحديث {0} ليعكس: {1}.'),
  updateReason: S('Result of the periodic review', 'Résultat de la revue périodique', 'نتيجة المراجعة الدورية'),
  closeEvidence: S('{0} closed; effectiveness verified and evidence archived.', '{0} clôturé ; efficacité vérifiée et preuves archivées.', 'تم إغلاق {0}؛ وتم التحقق من الفعالية وأرشفة الأدلة.'),
  escalateReason: S('{0} exceeds tolerance; decision needed on resources.', '{0} dépasse la tolérance ; décision requise sur les ressources.', '{0} يتجاوز حد التفاوت؛ ويلزم قرار بشأن الموارد.'),
  aiContext: S('Inputs: {0}. Standards in scope: {1}.', 'Entrées : {0}. Normes du périmètre : {1}.', 'المدخلات: {0}. المعايير ضمن النطاق: {1}.'),
  aiFinal: S('Draft reviewed by {0}: {1} covering {2}.', 'Brouillon revu par {0} : {1} couvrant {2}.', 'مسودة راجعها {0}: {1} تغطي {2}.'),
  serviceResult: S('{0} generated automatically by the DynamicMS Engine', '{0} généré automatiquement par le moteur DynamicMS', 'تم توليد {0} تلقائيًا بواسطة محرك DynamicMS'),
  site: S('{0} site', 'site de {0}', 'موقع {0}'),
  partiesPool: [S('Customers ({0})', 'Clients ({0})', 'العملاء ({0})'), S('Employees and their representatives', 'Salariés et leurs représentants', 'الموظفون وممثلوهم'), S('Regulators and certification body', 'Régulateurs et organisme de certification', 'الجهات التنظيمية وجهة الاعتماد'), S('Suppliers of {0}', 'Fournisseurs de {0}', 'موردو {0}'), S('Shareholders and lenders', 'Actionnaires et bailleurs', 'المساهمون والمموّلون'), S('Local community', 'Communauté locale', 'المجتمع المحلي')],
  oppPool: [S('Digitize {0} records to cut cycle time', 'Numériser les enregistrements de {0} pour réduire les délais', 'رقمنة سجلات {0} لتقليص زمن الدورة'), S('Extend certification to win {0} tenders', 'Étendre la certification pour remporter des appels d\'offres {0}', 'توسيع الاعتماد للفوز بمناقصات {0}'), S('Supplier development programme for {0}', 'Programme de développement fournisseurs pour {0}', 'برنامج تطوير الموردين لـ {0}')],
  causes: [S('Work instruction not updated after change', 'Instruction de travail non mise à jour après modification', 'عدم تحديث تعليمات العمل بعد التغيير'), S('Insufficient training of new operators', 'Formation insuffisante des nouveaux opérateurs', 'تدريب غير كافٍ للمشغلين الجدد'), S('Supplier batch variation not detected', 'Variation du lot fournisseur non détectée', 'عدم اكتشاف تباين دفعة المورد'), S('Measurement equipment out of calibration', 'Équipement de mesure hors étalonnage', 'معدات قياس خارج المعايرة')],
};

// Picks the item pool that best matches the step's wording.
function listPool(stepEn, ctx) {
  const s = stepEn.toLowerCase();
  const P = ctx.profile;
  if (/external issue|scenario|threat|horizon|regulat/.test(s)) return [...ctx.segRisks.slice(0, 3), fill(S('Revision of {0}', 'Révision de {0}', 'مراجعة {0}'), ctx.stdMain)];
  if (/internal issue|weakness|friction|pain/.test(s)) return [...P.defects.slice(0, 2), fill(S('Workload on {0}', 'Charge de travail sur {0}', 'عبء العمل في {0}'), P.line)];
  if (/interested part|stakeholder|audience|recipient/.test(s)) return T.partiesPool.slice(0, 4).map(t => fill(t, P.customer, P.supplier));
  if (/hazard|exposure|safety/.test(s) && ctx.qhse) return [...P.hazards, ...ctx.segRisks.slice(0, 1)];
  if (/aspect|environment|emission|waste|water|carbon/.test(s)) return [...P.aspects, fill(S('Energy use of {0}', 'Consommation d\'énergie de {0}', 'استهلاك الطاقة في {0}'), P.line)];
  if (/opportunit|innovation|idea|improvement/.test(s)) return T.oppPool.map(t => fill(t, P.product));
  if (/risk/.test(s)) return [...ctx.segRisks.slice(0, 3), ...(ctx.qhse ? [P.hazards[0], P.aspects[0]] : [P.defects[0]])];
  if (/kpi|indicator|metric/.test(s)) return ctx.kpiNames.slice(0, 4);
  if (/standard|requirement|obligation|clause|law|regulation/.test(s)) return ctx.standards.slice(0, 4).map(x => ({ en: x, fr: x, ar: x }));
  if (/cause|root/.test(s)) return T.causes.slice(0, 3);
  if (/supplier|third part/.test(s)) return [fill(S('{0} supplier A (critical)', 'Fournisseur A de {0} (critique)', 'المورد أ لـ {0} (حرج)'), P.supplier), fill(S('{0} supplier B', 'Fournisseur B de {0}', 'المورد ب لـ {0}'), P.supplier), S('Logistics provider', 'Prestataire logistique', 'مزوّد الخدمات اللوجستية')];
  if (/defect|problem|nonconform|finding|complaint/.test(s)) return P.defects;
  return ctx.mp.sipoc.O.slice(0, 3);
}

// Builds the typed form values + a one-line trilingual summary for a step.
export function stepValue(step, ctx, r, status, dueDate) {
  const kind = step.formKind;
  const mp = ctx.mp;
  const out1 = mp.sipoc.O[0]; const out2 = mp.sipoc.O[1] || out1;
  const in1 = mp.sipoc.I[0];
  const site = fill(T.site, ctx.profile.city);
  const done = status === 'Done';
  let f = {}; let summary;
  switch (kind) {
    case 'periodicity': {
      const e = +mp.e2e.slice(4);
      const key = e <= 2 ? 'Annual' : e <= 4 ? 'Semi-annual' : e <= 8 ? 'Quarterly' : 'Monthly';
      f = { frequency: key, nextDate: addDays(dueDate, FREQ_DAYS[key]), notes: fill(T.periodNotes, ctx.profile.product, ctx.profile.city) };
      summary = fill(S('{0}; next due {1}', '{0} ; prochaine échéance {1}', '{0}؛ الاستحقاق التالي {1}'), FREQ[key], f.nextDate);
      break;
    }
    case 'list': {
      const items = listPool(step.name.en, ctx).slice(0, 4);
      f = { items: joinLines(items), source: fill(T.sourceOf, in1) };
      summary = fill(S('{0} items: {1}', '{0} éléments : {1}', '{0} بنود: {1}'), items.length, items.slice(0, 2));
      break;
    }
    case 'assess': {
      const score = r.int(done ? 3 : 2, 5);
      f = { score, rationale: fill(T.assessRationale, r.int(6, 24), r.pick([...ctx.segRisks.slice(0, 2), ctx.profile.defects[0]]), ctx.stdMain) };
      summary = fill(S('Score {0}/5', 'Score {0}/5', 'الدرجة {0}/5'), score);
      break;
    }
    case 'decision': {
      const dec = done ? (r.chance(0.92) ? 'Go' : 'Hold') : 'Hold';
      f = { decision: dec, approver: mp.ownerRoleCode || 'top_management', comment: dec === 'Go' ? fill(T.decisionComment, out1, ctx.stdMain) : fill(T.decisionHold, out2) };
      summary = fill(S('{0} — approved by {1}', '{0} — approuvé par {1}', '{0} — اعتمده {1}'), DECISIONS[dec], ctx.roleName(mp.ownerRoleCode));
      break;
    }
    case 'document': {
      const ref = `${ctx.orgCode}-${mp.code}-${String(step.seq).padStart(2, '0')}`;
      const ver = done ? r.pick(['1.0', '1.1', '2.0']) : '0.9';
      f = { docRef: ref, version: ver, summary: fill(T.docSummary, out1, ctx.profile.product, ctx.stdMain) };
      summary = fill(S('{0} v{1} — {2}', '{0} v{1} — {2}', '{0} الإصدار {1} — {2}'), ref, ver, out1);
      break;
    }
    case 'communicate': {
      const ch = r.pick(Object.keys(CHANNELS));
      f = { audience: mp.sipoc.C.slice(0, 2), channel: ch, message: fill(T.commMessage, out1, addDays(dueDate, 14)) };
      summary = fill(S('{0} via {1}', '{0} via {1}', '{0} عبر {1}'), mp.sipoc.C.slice(0, 2), CHANNELS[ch]);
      break;
    }
    case 'train': {
      const n = r.int(8, 45); const eff = r.int(78, 97);
      f = { session: fill(T.trainSession, mp.name), participants: n, effectiveness: done ? eff : null };
      summary = fill(S('{0} participants, {1}% effective', '{0} participants, efficacité {1} %', '{0} مشاركًا، فعالية {1}%'), n, done ? eff : '—');
      break;
    }
    case 'monitor': {
      const k = ctx.kpis.length ? ctx.kpis[r.int(0, ctx.kpis.length - 1)] : null;
      const val = k ? k.sample : r.int(80, 99);
      const ok = r.chance(0.72);
      f = { metric: k ? k.name : out1, value: val, target: k ? k.targetText : '≥ 95', comment: fill(T.monitorComment, ok ? T.up : T.down, ok ? T.onTarget : T.offTarget) };
      summary = fill(S('{0} = {1} (target {2})', '{0} = {1} (cible {2})', '{0} = {1} (المستهدف {2})'), f.metric, val, f.target);
      break;
    }
    case 'plan': {
      const next = ctx.mpSteps.slice(step.seq, step.seq + 3).map(s => s.name);
      const items = next.length ? next : mp.sipoc.P.slice(0, 3);
      f = { items: joinLines(items), start: dueDate, end: addDays(dueDate, r.int(20, 75)) };
      summary = fill(S('{0} activities, {1} → {2}', '{0} activités, {1} → {2}', '{0} أنشطة، {1} ← {2}'), items.length, f.start, f.end);
      break;
    }
    case 'assign': {
      const code = mp.ownerRoleCode || 'ims_manager';
      f = { role: code, person: ctx.userName(code), scope: fill(T.assignScope, mp.name, site) };
      summary = fill(S('{0} ({1})', '{0} ({1})', '{0} ({1})'), ctx.userName(code), ctx.roleName(code));
      break;
    }
    case 'configure': {
      f = { setting: step.name, value: fill(T.configValue, site, out1), notes: T.configNotes };
      summary = f.value;
      break;
    }
    case 'update': {
      f = { change: fill(T.updateChange, out1, r.pick([...ctx.segRisks.slice(0, 1), ctx.profile.defects[1] || ctx.profile.defects[0]])), reason: T.updateReason };
      summary = f.change;
      break;
    }
    case 'close': {
      f = { evidence: fill(T.closeEvidence, out1), date: dueDate };
      summary = fill(S('Closed on {0}', 'Clôturé le {0}', 'أُغلق في {0}'), dueDate);
      break;
    }
    case 'escalate': {
      f = { to: 'top_management', reason: fill(T.escalateReason, out1) };
      summary = fill(S('Escalated to {0}', 'Escaladé à {0}', 'تم التصعيد إلى {0}'), ctx.roleName('top_management'));
      break;
    }
    case 'ai': {
      const outcome = done ? r.pick(['Accepted', 'Edited', 'Edited']) : 'Edited';
      f = { context: fill(T.aiContext, mp.sipoc.I.slice(0, 3), ctx.standards.slice(0, 3).join(', ')), outcome, final: fill(T.aiFinal, ctx.roleName(mp.ownerRoleCode), out1, ctx.standards.slice(0, 2).join(', ')) };
      summary = fill(S('AI suggestion {0}', 'Suggestion IA {0}', 'اقتراح الذكاء الاصطناعي: {0}'), OUTCOMES[outcome]);
      break;
    }
    case 'service': {
      f = { result: fill(T.serviceResult, out1) };
      summary = f.result;
      break;
    }
    default: {
      const pct = done ? 100 : r.int(30, 80);
      f = { evidence: fill(done ? T.execEvidence : T.execPartial, out1, ctx.profile.line), completion: pct };
      summary = fill(S('{0}% — {1}', '{0} % — {1}', '{0}% — {1}'), pct, out1);
    }
  }
  return { fields: f, summary };
}

// Example "what to type" values for the user guides (English), derived from a seeded value.
export function guideExample(kind, fields) {
  const def = FORM_KINDS[kind] || FORM_KINDS.execute;
  return def.fields.map(fd => {
    let v = fields ? fields[fd.key] : '';
    if (v && typeof v === 'object' && !Array.isArray(v)) v = v.en ?? '';
    if (Array.isArray(v)) v = v.map(x => (x && x.en) || x).join('; ');
    return { field: fd.label.en, value: v === null || v === undefined ? '' : String(v) };
  });
}
