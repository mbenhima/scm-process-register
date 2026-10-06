// Typed step forms (FR-DA-SFM-01 – 03) and step descriptions (FR-DA-NAM-03, -04).
// Every step receives a Step Form Kind from a catalog; the kind decides the fields, their qualified titles
// (FR-DA-DEU-01), the entry pattern (FR-DA-MRE-01), how each field is filled (NFR-DA-UX-12), and the register the
// rows feed when the step is completed (FR-DA-SFM-04, FR-DA-LNK-04).
import { objectOf } from './naming.js';

const L = (en, fr, ar) => ({ en, fr, ar });
export const FORM_KINDS = ['record', 'matrix', 'decision', 'objectives', 'plan', 'communication', 'training', 'monitoring', 'review', 'assignment', 'configuration', 'system'];
export const KIND_LABEL = {
  record: L('Record table', 'Tableau d’enregistrements', 'جدول سجلات'), matrix: L('Assessment matrix', 'Matrice d’évaluation', 'مصفوفة تقييم'), decision: L('Decision', 'Décision', 'قرار'),
  objectives: L('Objectives', 'Objectifs', 'أهداف'), plan: L('Plan', 'Plan', 'خطة'), communication: L('Communication', 'Communication', 'تواصل'), training: L('Training', 'Formation', 'تكوين'),
  monitoring: L('Monitoring', 'Suivi', 'تتبع'), review: L('Review', 'Revue', 'مراجعة'), assignment: L('Assignment', 'Affectation', 'تعيين'), configuration: L('Configuration', 'Configuration', 'إعداد'), system: L('System step', 'Étape système', 'خطوة نظام'),
};
const V = verbs => new Set(verbs.split(' '));
const BY_VERB = [
  ['decision', V('validate approve select confirm agree endorse award shortlist lock decide accept reject sign certify release close')],
  ['matrix', V('assess score rate prioritize evaluate compare benchmark analyze analyse reassess estimate weigh rank screen cluster diagnose size qualify match')],
  ['assignment', V('assign appoint nominate staff')],
  ['training', V('run deliver conduct enroll coach hold train onboard pilot debrief execute peer')],
  ['monitoring', V('track monitor measure compute consolidate aggregate refresh survey feed predict visualize display query forecast')],
  ['review', V('review check verify audit test reconcile correct fix resolve improve update edit maintain adjust revise inspect examine moderate')],
  ['communication', V('publish send issue share invite post distribute notify report submit escalate request launch inform present remind communicate announce push prompt')],
  ['configuration', V('configure enable deactivate disable provision deploy apply enforce seed integrate unlock tune model route trigger activate install connect synchronize reset retire archive export import upload load index')],
  ['plan', V('plan schedule build sequence allocate design draft book organize structure elaborate tailor propose budget arrange prepare develop produce generate compile write author adapt split')],
  ['record', V('list register record identify map link collect capture log tag document add create enter name describe gather extract enrich suggest recommend define set align obtain consume')],
];
const OBJECTIVE_RX = /objective|target|goal|level|kpi|indicator|outcome|criteria|standard/i;
const PEOPLE_RX = /trainer|owner|person|people|staff|resource|role|coach|mentor|facilitator|assessor|evaluator|reviewer/i;

/** Form kind of a step: explicit on the element, otherwise derived from its verb, object and step type. */
export function kindOf(step) {
  if (step.form?.kind && FORM_KINDS.includes(step.form.kind)) return step.form.kind;
  if (step.type === 'Service Task') return 'system';
  const name = step.name?.en || ''; const verb = name.split(/\s+/)[0]?.toLowerCase(); const obj = name.slice(verb.length);
  if (['define', 'set', 'write', 'align'].includes(verb) && OBJECTIVE_RX.test(obj)) return 'objectives';
  if (['record', 'register', 'list'].includes(verb) && /objective|target|goal/i.test(obj)) return 'objectives';
  if (verb === 'allocate' && PEOPLE_RX.test(obj)) return 'assignment';
  if (verb === 'set' && /budget|envelope|date|milestone|calendar/i.test(obj)) return 'plan';
  if (verb === 'set') return 'configuration';
  for (const [k, set] of BY_VERB) if (set.has(verb)) return k;
  return 'record';
}

const CATEGORIES = [
  [/objective|goal|ambition/i, ['Customer', 'Financial', 'Operational', 'People', 'Innovation'], { Customer: L('Customer', 'Client', 'العميل'), Financial: L('Financial', 'Financier', 'مالي'), Operational: L('Operational', 'Opérationnel', 'تشغيلي'), People: L('People', 'Humain', 'بشري'), Innovation: L('Innovation', 'Innovation', 'ابتكار') }],
  [/risk|hazard|threat/i, ['Strategic', 'Operational', 'Compliance', 'Financial', 'Reputational'], { Strategic: L('Strategic', 'Stratégique', 'استراتيجي'), Operational: L('Operational', 'Opérationnel', 'تشغيلي'), Compliance: L('Compliance', 'Conformité', 'مطابقة'), Financial: L('Financial', 'Financier', 'مالي'), Reputational: L('Reputational', 'Image', 'سمعة') }],
  [/need|gap|demand|theme/i, ['Technical', 'Managerial', 'Behavioural', 'Regulatory', 'Digital', 'AI'], { Technical: L('Technical', 'Technique', 'تقني'), Managerial: L('Managerial', 'Managérial', 'تدبيري'), Behavioural: L('Behavioural', 'Comportemental', 'سلوكي'), Regulatory: L('Regulatory', 'Réglementaire', 'تنظيمي'), Digital: L('Digital', 'Numérique', 'رقمي'), AI: L('AI', 'IA', 'ذكاء اصطناعي') }],
  [/competen|skill|proficien/i, ['Technical', 'Behavioural', 'Managerial', 'Digital', 'Regulatory'], { Technical: L('Technical', 'Technique', 'تقني'), Behavioural: L('Behavioural', 'Comportemental', 'سلوكي'), Managerial: L('Managerial', 'Managérial', 'تدبيري'), Digital: L('Digital', 'Numérique', 'رقمي'), Regulatory: L('Regulatory', 'Réglementaire', 'تنظيمي') }],
  [/stakeholder|interested|party|parties|partner|supplier|provider|vendor/i, ['Internal', 'Customer', 'Regulator', 'Supplier', 'Partner'], { Internal: L('Internal', 'Interne', 'داخلي'), Customer: L('Customer', 'Client', 'عميل'), Regulator: L('Regulator', 'Régulateur', 'جهة تنظيمية'), Supplier: L('Supplier', 'Fournisseur', 'مورد'), Partner: L('Partner', 'Partenaire', 'شريك') }],
  [/obligation|requirement|regulat|compliance|clause/i, ['Legal', 'Regulatory', 'Contractual', 'Standard', 'Internal policy'], { Legal: L('Legal', 'Légal', 'قانوني'), Regulatory: L('Regulatory', 'Réglementaire', 'تنظيمي'), Contractual: L('Contractual', 'Contractuel', 'تعاقدي'), Standard: L('Standard', 'Norme', 'معيار'), 'Internal policy': L('Internal policy', 'Politique interne', 'سياسة داخلية') }],
  [/course|module|content|session|program|path|learning/i, ['E-learning', 'Classroom', 'Blended', 'On the job', 'Microlearning'], { 'E-learning': L('E-learning', 'E-learning', 'تعلم إلكتروني'), Classroom: L('Classroom', 'Présentiel', 'حضوري'), Blended: L('Blended', 'Mixte', 'مدمج'), 'On the job': L('On the job', 'En situation de travail', 'أثناء العمل'), Microlearning: L('Microlearning', 'Microlearning', 'تعلم مصغر') }],
];
const DEFAULT_CAT = [['Primary', 'Secondary', 'Supporting'], { Primary: L('Primary', 'Principal', 'رئيسي'), Secondary: L('Secondary', 'Secondaire', 'ثانوي'), Supporting: L('Supporting', 'Support', 'داعم') }];
export function categoriesFor(objEn) { const m = CATEGORIES.find(([rx]) => rx.test(objEn)); const [vals, labels] = m ? [m[1], m[2]] : DEFAULT_CAT; return vals.map(v => ({ value: v, label: labels[v] })); }

const H = { // how to fill each field (NFR-DA-UX-12)
  item: L('One row per item of “{object}”, named as people in the organization name it.', 'Une ligne par élément de « {object} », nommé comme dans l’organisation.', 'صف واحد لكل عنصر من «{object}»، بالتسمية المعتمدة في المؤسسة.'),
  category: L('Choose from the list; use Custom value only when no category fits.', 'Choisissez dans la liste ; utilisez une valeur personnalisée seulement si aucune ne convient.', 'اختر من القائمة؛ استعمل قيمة مخصصة فقط إذا لم تناسب أي فئة.'),
  description: L('One or two sentences: what it is and why it matters here.', 'Une ou deux phrases : de quoi il s’agit et pourquoi c’est important ici.', 'جملة أو جملتان: ما هو ولماذا هو مهم هنا.'),
  owner: L('The person accountable, chosen from the people of the organization.', 'La personne responsable, choisie parmi les personnes de l’organisation.', 'الشخص المسؤول، يختار من أشخاص المؤسسة.'),
  source: L('Where it comes from: a named record, study, interview or date.', 'D’où cela vient : un dossier, une étude, un entretien ou une date.', 'مصدره: سجل أو دراسة أو مقابلة أو تاريخ.'),
  criterion: L('What is scored, for example business impact or urgency.', 'Ce qui est noté, par exemple l’impact métier ou l’urgence.', 'ما يتم تقييمه، مثل الأثر على الأعمال أو الاستعجال.'),
  weight: L('Weight in %; the weights of one item add up to 100.', 'Poids en % ; les poids d’un même élément totalisent 100.', 'الوزن بالنسبة المئوية؛ مجموع أوزان العنصر 100.'),
  score: L('Score from 1 (very low) to 5 (very high).', 'Note de 1 (très faible) à 5 (très élevée).', 'نقطة من 1 (ضعيف جداً) إلى 5 (مرتفع جداً).'),
  facts: L('The facts that justify the score: figures, events, sources.', 'Les faits qui justifient la note : chiffres, événements, sources.', 'الوقائع التي تبرر النقطة: أرقام وأحداث ومصادر.'),
  decision: L('The decision taken.', 'La décision prise.', 'القرار المتخذ.'), rationale: L('Why: the evidence and reasons behind the decision.', 'Pourquoi : les éléments et raisons de la décision.', 'لماذا: الأدلة والأسباب.'),
  conditions: L('Conditions or reservations attached to the decision, if any.', 'Conditions ou réserves attachées à la décision, le cas échéant.', 'الشروط أو التحفظات المرتبطة بالقرار إن وجدت.'), date: L('Date, in the form YYYY-MM-DD.', 'Date, au format AAAA-MM-JJ.', 'التاريخ بصيغة YYYY-MM-DD.'),
  decidedBy: L('Who decided.', 'Qui a décidé.', 'من قرر.'), indicator: L('The indicator that measures it, from the KPI catalog or created here.', 'L’indicateur qui le mesure, du catalogue des KPI ou créé ici.', 'المؤشر الذي يقيسه، من كتالوج المؤشرات أو ينشأ هنا.'),
  baseline: L('The value today.', 'La valeur aujourd’hui.', 'القيمة الحالية.'), target: L('The value to reach.', 'La valeur à atteindre.', 'القيمة المستهدفة.'), deadline: L('When the target must be reached.', 'Échéance de la cible.', 'أجل بلوغ الهدف.'),
  action: L('One action per row, starting with a verb.', 'Une action par ligne, commençant par un verbe.', 'إجراء واحد في كل صف يبدأ بفعل.'), start: L('Start date.', 'Date de début.', 'تاريخ البداية.'), end: L('End date.', 'Date de fin.', 'تاريخ النهاية.'),
  budget: L('Budget in the organization’s currency.', 'Budget dans la devise de l’organisation.', 'الميزانية بعملة المؤسسة.'), deliverable: L('What the action produces.', 'Ce que l’action produit.', 'ما ينتجه الإجراء.'),
  audience: L('Who receives the message.', 'Qui reçoit le message.', 'من يتلقى الرسالة.'), channel: L('E-mail, WhatsApp, application, meeting, intranet or letter.', 'E-mail, WhatsApp, application, réunion, intranet ou courrier.', 'بريد أو واتساب أو تطبيق أو اجتماع أو شبكة داخلية أو رسالة.'),
  message: L('The message, short and factual.', 'Le message, court et factuel.', 'الرسالة، موجزة وواقعية.'), session: L('The session, named as in the plan.', 'La session, nommée comme dans le plan.', 'الجلسة بالاسم الوارد في الخطة.'),
  trainer: L('Trainer or facilitator.', 'Formateur ou animateur.', 'المكون أو الميسر.'), participants: L('Number of participants.', 'Nombre de participants.', 'عدد المشاركين.'), hours: L('Duration in hours.', 'Durée en heures.', 'المدة بالساعات.'),
  modality: L('On site, remote or blended.', 'Présentiel, à distance ou mixte.', 'حضوري أو عن بعد أو مدمج.'), period: L('The period measured, for example 2026-Q2.', 'La période mesurée, par exemple 2026-T2.', 'الفترة المقاسة، مثل 2026-ر2.'),
  value: L('The value measured.', 'La valeur mesurée.', 'القيمة المقاسة.'), status: L('Green on target, Amber at risk, Red off target.', 'Vert sur la cible, Ambre à risque, Rouge hors cible.', 'أخضر على الهدف، كهرماني في خطر، أحمر خارج الهدف.'),
  reason: L('Why this indicator is monitored.', 'Pourquoi cet indicateur est suivi.', 'لماذا يتم تتبع هذا المؤشر.'), scope: L('What was reviewed.', 'Ce qui a été revu.', 'ما تمت مراجعته.'),
  findings: L('What the review found, one finding per line.', 'Ce que la revue a constaté, un constat par ligne.', 'ما وجدته المراجعة، ملاحظة في كل سطر.'), conclusion: L('The overall conclusion.', 'La conclusion d’ensemble.', 'الخلاصة العامة.'),
  followUp: L('The follow-up actions, with owner and date.', 'Les actions de suivi, avec responsable et date.', 'إجراءات المتابعة مع المسؤول والتاريخ.'), role: L('The OBS role, chosen from the organization’s roles.', 'Le rôle OBS, choisi parmi les rôles de l’organisation.', 'الدور التنظيمي من أدوار المؤسسة.'),
  person: L('The person who plays the role.', 'La personne qui tient le rôle.', 'الشخص الذي يؤدي الدور.'), allocation: L('Share of time in %.', 'Part du temps en %.', 'نسبة الوقت بالمائة.'), holderType: L('Holder, deputy or acting.', 'Titulaire, suppléant ou intérimaire.', 'أصيل أو نائب أو بالنيابة.'),
  setting: L('The parameter, named as on the screen that applies it.', 'Le paramètre, nommé comme sur l’écran qui l’applique.', 'المعامل بالاسم الوارد في الشاشة التي تطبقه.'), reference: L('The rule, standard or document that sets this value.', 'La règle, la norme ou le document qui fixe cette valeur.', 'القاعدة أو المعيار أو الوثيقة التي تحدد هذه القيمة.'),
};
const fill = (ml, obj) => Object.fromEntries(Object.entries(ml).map(([k, v]) => [k, v.replace('{object}', (obj[k] || obj.en || '').toLowerCase())]));
const f = (key, label, type, o = {}) => ({ key, label, type, help: o.help || H[key], ...o });
const CHANNELS = ['E-mail', 'WhatsApp', 'Application', 'Meeting', 'Intranet', 'Letter'].map(v => ({ value: v, label: { 'E-mail': L('E-mail', 'E-mail', 'بريد إلكتروني'), WhatsApp: L('WhatsApp', 'WhatsApp', 'واتساب'), Application: L('Application', 'Application', 'التطبيق'), Meeting: L('Meeting', 'Réunion', 'اجتماع'), Intranet: L('Intranet', 'Intranet', 'الشبكة الداخلية'), Letter: L('Letter', 'Courrier', 'رسالة') }[v] }));
const RAG = ['Green', 'Amber', 'Red'].map(v => ({ value: v, label: { Green: L('Green', 'Vert', 'أخضر'), Amber: L('Amber', 'Ambre', 'كهرماني'), Red: L('Red', 'Rouge', 'أحمر') }[v] }));
const SCORE = [1, 2, 3, 4, 5].map(v => ({ value: String(v), label: L(String(v), String(v), String(v)) }));

/** Field definitions of a form kind for a step whose object (multilingual) is `obj`. */
export function fieldsFor(kind, obj) {
  const it = fill(H.item, obj);
  switch (kind) {
    case 'record': return [f('item', obj, 'text', { required: true, help: it }), f('category', L('Category', 'Catégorie', 'الفئة'), 'select', { custom: true, options: categoriesFor(obj.en || ''), carry: true }), f('description', L('Description', 'Description', 'الوصف'), 'textarea'), f('owner', L('Owner', 'Responsable', 'المسؤول'), 'person'), f('source', L('Source', 'Source', 'المصدر'), 'text')];
    case 'matrix': return [f('item', obj, 'text', { required: true, help: it, carry: true }), f('criterion', L('Criterion', 'Critère', 'المعيار'), 'select', { required: true, custom: true, options: ['Business impact', 'Urgency', 'Feasibility', 'Cost', 'Risk'].map(v => ({ value: v, label: { 'Business impact': L('Business impact', 'Impact métier', 'الأثر على الأعمال'), Urgency: L('Urgency', 'Urgence', 'الاستعجال'), Feasibility: L('Feasibility', 'Faisabilité', 'قابلية التنفيذ'), Cost: L('Cost', 'Coût', 'الكلفة'), Risk: L('Risk', 'Risque', 'المخاطر') }[v] })) }),
      f('weight', L('Weight (%)', 'Poids (%)', 'الوزن (%)'), 'number', { required: true, min: 0, max: 100 }), f('score', L('Score (1–5)', 'Note (1–5)', 'النقطة (1–5)'), 'select', { required: true, options: SCORE }), f('facts', L('Facts justifying the score', 'Faits justifiant la note', 'الوقائع المبررة للنقطة'), 'textarea')];
    case 'decision': return [f('decision', L('Decision', 'Décision', 'القرار'), 'select', { required: true, options: ['Approved', 'Approved with conditions', 'Rejected', 'Deferred'].map(v => ({ value: v, label: { Approved: L('Approved', 'Approuvé', 'موافق عليه'), 'Approved with conditions': L('Approved with conditions', 'Approuvé sous conditions', 'موافق عليه بشروط'), Rejected: L('Rejected', 'Rejeté', 'مرفوض'), Deferred: L('Deferred', 'Reporté', 'مؤجل') }[v] })) }),
      f('subject', obj, 'text', { required: true, help: L('What is decided.', 'Ce qui est décidé.', 'موضوع القرار.') }), f('rationale', L('Rationale', 'Justification', 'التعليل'), 'textarea', { required: true }), f('conditions', L('Conditions', 'Conditions', 'الشروط'), 'textarea'), f('date', L('Decision date', 'Date de décision', 'تاريخ القرار'), 'date', { required: true }), f('decidedBy', L('Decided by', 'Décidé par', 'قرره'), 'person')];
    case 'objectives': return [f('item', obj, 'text', { required: true, help: it }), f('indicator', L('Indicator', 'Indicateur', 'المؤشر'), 'kpi', { custom: true }), f('baseline', L('Baseline', 'Valeur de départ', 'القيمة الأساسية'), 'text'), f('target', L('Target', 'Cible', 'الهدف'), 'text', { required: true }), f('deadline', L('Deadline', 'Échéance', 'الأجل'), 'date', { required: true }), f('owner', L('Owner', 'Responsable', 'المسؤول'), 'person')];
    case 'plan': return [f('item', obj, 'text', { required: true, help: fill(H.action, obj) }), f('owner', L('Owner', 'Responsable', 'المسؤول'), 'person'), f('start', L('Start', 'Début', 'البداية'), 'date'), f('end', L('End', 'Fin', 'النهاية'), 'date', { validate: 'afterStart' }), f('budget', L('Budget', 'Budget', 'الميزانية'), 'number', { min: 0 }), f('deliverable', L('Deliverable', 'Livrable', 'المخرج'), 'text')];
    case 'communication': return [f('item', obj, 'text', { required: true, help: L('What the message is about.', 'L’objet du message.', 'موضوع الرسالة.') }), f('audience', L('Audience', 'Destinataires', 'الجمهور'), 'text', { required: true }), f('channel', L('Channel', 'Canal', 'القناة'), 'select', { required: true, options: CHANNELS }), f('message', L('Message', 'Message', 'الرسالة'), 'textarea', { required: true }), f('date', L('Date', 'Date', 'التاريخ'), 'date')];
    case 'training': return [f('session', obj, 'text', { required: true, help: H.session }), f('date', L('Date', 'Date', 'التاريخ'), 'date', { required: true }), f('trainer', L('Trainer', 'Formateur', 'المكون'), 'text'), f('participants', L('Participants', 'Participants', 'المشاركون'), 'number', { min: 0 }), f('hours', L('Hours', 'Heures', 'الساعات'), 'number', { min: 0, max: 200 }),
      f('modality', L('Modality', 'Modalité', 'الصيغة'), 'select', { options: ['On site', 'Remote', 'Blended'].map(v => ({ value: v, label: { 'On site': L('On site', 'Présentiel', 'حضوري'), Remote: L('Remote', 'À distance', 'عن بعد'), Blended: L('Blended', 'Mixte', 'مدمج') }[v] })) })];
    case 'monitoring': return [f('indicator', obj, 'kpi', { required: true, custom: true, help: H.indicator }), f('period', L('Period', 'Période', 'الفترة'), 'text', { required: true, carry: true }), f('value', L('Value', 'Valeur', 'القيمة'), 'number', { required: true }), f('target', L('Target', 'Cible', 'الهدف'), 'number'), f('status', L('Status', 'Statut', 'الحالة'), 'select', { options: RAG }), f('reason', L('Why it is monitored', 'Pourquoi il est suivi', 'سبب التتبع'), 'text')];
    case 'review': return [f('scope', obj, 'text', { required: true, help: H.scope }), f('findings', L('Findings', 'Constats', 'الملاحظات'), 'textarea', { required: true }), f('conclusion', L('Conclusion', 'Conclusion', 'الخلاصة'), 'select', { required: true, options: ['Conforming', 'Minor corrections', 'Major corrections'].map(v => ({ value: v, label: { Conforming: L('Conforming', 'Conforme', 'مطابق'), 'Minor corrections': L('Minor corrections', 'Corrections mineures', 'تصحيحات طفيفة'), 'Major corrections': L('Major corrections', 'Corrections majeures', 'تصحيحات جوهرية') }[v] })) }),
      f('followUp', L('Follow-up actions', 'Actions de suivi', 'إجراءات المتابعة'), 'textarea'), f('date', L('Review date', 'Date de revue', 'تاريخ المراجعة'), 'date', { required: true })];
    case 'assignment': return [f('role', L('Role', 'Rôle', 'الدور'), 'role', { required: true, custom: true, help: H.role }), f('item', obj, 'text', { help: it }), f('person', L('Person', 'Personne', 'الشخص'), 'person', { required: true }), f('allocation', L('Allocation (%)', 'Affectation (%)', 'التخصيص (%)'), 'number', { min: 0, max: 100 }), f('start', L('Start', 'Début', 'البداية'), 'date'),
      f('holderType', L('Holder type', 'Type de titulaire', 'نوع الشغل'), 'select', { options: ['Holder', 'Deputy', 'Acting'].map(v => ({ value: v, label: { Holder: L('Holder', 'Titulaire', 'أصيل'), Deputy: L('Deputy', 'Suppléant', 'نائب'), Acting: L('Acting', 'Intérimaire', 'بالنيابة') }[v] })) })];
    case 'configuration': return [f('setting', obj, 'text', { required: true, help: H.setting }), f('value', L('Value', 'Valeur', 'القيمة'), 'text', { required: true }), f('reference', L('Reference', 'Référence', 'المرجع'), 'text')];
    default: return [];
  }
}
export const SINGLE = new Set(['decision', 'review']);
/** Entry pattern from the number of records and fields (FR-DA-MRE-01). */
export const patternOf = (kind, fields) => (kind === 'system' ? 'system' : SINGLE.has(kind) ? (fields.length > 8 ? 'sectioned' : 'form') : fields.length > 8 ? 'master-detail' : 'inline');
/** Register fed by the rows of a step when it is completed (FR-DA-SFM-04, FR-DA-LNK-04). */
export function registerOf(kind, step, obj) {
  const fixed = { objectives: ['objectives', L('Objectives register', 'Registre des objectifs', 'سجل الأهداف')], plan: ['actions', L('Action plan', 'Plan d’actions', 'خطة العمل')], monitoring: ['kpi-values', L('Indicator values', 'Valeurs des indicateurs', 'قيم المؤشرات')],
    assignment: ['assignments', L('Role assignments', 'Affectations de rôles', 'تعيينات الأدوار')], training: ['sessions', L('Training sessions', 'Sessions de formation', 'جلسات التكوين')], communication: ['communications', L('Communications log', 'Journal des communications', 'سجل التواصل')],
    matrix: ['assessments', L('Assessments', 'Évaluations', 'التقييمات')], configuration: ['settings', L('Settings', 'Paramètres', 'الإعدادات')], decision: ['decisions', L('Decisions log', 'Journal des décisions', 'سجل القرارات')], review: ['reviews', L('Reviews', 'Revues', 'المراجعات')] };
  if (fixed[kind]) return { key: fixed[kind][0], name: fixed[kind][1] };
  if (kind === 'system') return null;
  const key = 'reg-' + String(obj.en || step.id).toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  return { key, name: L(`${obj.en} register`, `Registre : ${obj.fr || obj.en}`, `سجل ${obj.ar || obj.en}`) };
}

const PURPOSE = {
  record: L('Keep a complete, sourced list of {o} so that later steps, registers and documents use the same items.', 'Tenir une liste complète et sourcée ({o}) pour que les étapes suivantes, les registres et les documents utilisent les mêmes éléments.', 'الاحتفاظ بقائمة كاملة وموثقة المصدر ({o}) لتستعمل الخطوات اللاحقة والسجلات والوثائق نفس العناصر.'),
  matrix: L('Score {o} against weighted criteria and keep the facts behind each score.', 'Noter ({o}) selon des critères pondérés et conserver les faits qui justifient chaque note.', 'تقييم ({o}) وفق معايير مرجحة مع الاحتفاظ بالوقائع المبررة لكل نقطة.'),
  decision: L('Record the decision on {o}, its rationale and any condition.', 'Enregistrer la décision ({o}), sa justification et ses éventuelles conditions.', 'تسجيل القرار ({o}) وتعليله وشروطه إن وجدت.'),
  objectives: L('Set measurable objectives for {o}, each with an indicator, a target and a deadline.', 'Fixer des objectifs mesurables ({o}), chacun avec un indicateur, une cible et une échéance.', 'تحديد أهداف قابلة للقياس ({o}) لكل منها مؤشر وهدف وأجل.'),
  plan: L('Plan {o}: actions, owners, dates, budget and deliverables.', 'Planifier ({o}) : actions, responsables, dates, budget et livrables.', 'تخطيط ({o}): الإجراءات والمسؤولون والتواريخ والميزانية والمخرجات.'),
  communication: L('Inform the right audience about {o} through the right channel.', 'Informer le bon public ({o}) par le bon canal.', 'إبلاغ الجمهور المناسب ({o}) عبر القناة المناسبة.'),
  training: L('Organize and record {o}: sessions, trainers, participants and duration.', 'Organiser et enregistrer ({o}) : sessions, formateurs, participants et durée.', 'تنظيم وتسجيل ({o}): الجلسات والمكونون والمشاركون والمدة.'),
  monitoring: L('Measure {o} against its target each period and explain any gap.', 'Mesurer ({o}) par rapport à la cible à chaque période et expliquer tout écart.', 'قياس ({o}) مقارنة بالهدف في كل فترة وتفسير أي فارق.'),
  review: L('Check {o}, record the findings and decide the follow-up.', 'Vérifier ({o}), consigner les constats et décider du suivi.', 'مراجعة ({o}) وتسجيل الملاحظات وتحديد المتابعة.'),
  assignment: L('Name who does what for {o}, with allocation and start date.', 'Désigner qui fait quoi ({o}), avec la part de temps et la date de début.', 'تحديد من يقوم بماذا ({o}) مع نسبة التخصيص وتاريخ البداية.'),
  configuration: L('Set the parameters of {o} so that the platform applies them.', 'Fixer les paramètres ({o}) pour que la plateforme les applique.', 'ضبط معاملات ({o}) لتطبقها المنصة.'),
  system: L('The platform performs this step automatically ({o}); check its result.', 'La plateforme réalise cette étape automatiquement ({o}) ; vérifiez son résultat.', 'تنجز المنصة هذه الخطوة آلياً ({o})؛ تحقق من نتيجتها.'),
};
const RESULT = {
  record: L('{o} recorded, each with category, owner and source; the register is updated when the step is completed.', '{o} enregistré(e)s, chacun(e) avec catégorie, responsable et source ; le registre est mis à jour à la clôture de l’étape.', 'تسجيل {o} مع الفئة والمسؤول والمصدر؛ يحدث السجل عند إتمام الخطوة.'),
  matrix: L('A weighted score per item, on a 1–5 scale, with the facts behind it.', 'Une note pondérée par élément, sur une échelle de 1 à 5, avec ses justifications.', 'نقطة مرجحة لكل عنصر على سلم 1–5 مع مبرراتها.'),
  decision: L('A dated decision with its rationale, entered in the decisions log.', 'Une décision datée et justifiée, inscrite au journal des décisions.', 'قرار مؤرخ ومعلل يدرج في سجل القرارات.'),
  objectives: L('Objectives with indicator, baseline, target, deadline and owner, entered in the objectives register.', 'Des objectifs avec indicateur, valeur de départ, cible, échéance et responsable, inscrits au registre des objectifs.', 'أهداف بمؤشر وقيمة أساسية وهدف وأجل ومسؤول، تدرج في سجل الأهداف.'),
  plan: L('Planned actions that become entries of the action plan.', 'Des actions planifiées qui deviennent des entrées du plan d’actions.', 'إجراءات مخططة تصبح مدخلات في خطة العمل.'),
  communication: L('Messages sent or scheduled, kept in the communications log.', 'Des messages envoyés ou programmés, conservés dans le journal des communications.', 'رسائل مرسلة أو مبرمجة تحفظ في سجل التواصل.'),
  training: L('Sessions with date, trainer, participants and duration.', 'Des sessions avec date, formateur, participants et durée.', 'جلسات بالتاريخ والمكون والمشاركين والمدة.'),
  monitoring: L('Indicator values for the period, each with its status, stored as KPI values.', 'Des valeurs d’indicateurs pour la période, avec leur statut, enregistrées comme valeurs de KPI.', 'قيم المؤشرات للفترة مع حالتها، تحفظ كقيم مؤشرات.'),
  review: L('Findings, a conclusion and follow-up actions.', 'Des constats, une conclusion et des actions de suivi.', 'ملاحظات وخلاصة وإجراءات متابعة.'),
  assignment: L('Role assignments with person, allocation and start date.', 'Des affectations de rôles avec personne, part de temps et date de début.', 'تعيينات أدوار بالشخص والتخصيص وتاريخ البداية.'),
  configuration: L('Parameters applied by the platform, with their reference.', 'Des paramètres appliqués par la plateforme, avec leur référence.', 'معاملات تطبقها المنصة مع مرجعها.'),
  system: L('The system output, shown in the task.', 'Le résultat du système, affiché dans la tâche.', 'مخرج النظام يعرض في المهمة.'),
};
const LBL = { purpose: L('Purpose', 'Objet', 'الغرض'), inputs: L('Inputs', 'Entrées', 'المدخلات'), how: L('How to fill it', 'Comment la remplir', 'طريقة الملء'), result: L('Expected result', 'Résultat attendu', 'النتيجة المنتظرة'), done: L('in', 'dans', 'ضمن') };

/** Complete form definition and descriptions for a step (multilingual). `ctx` = { mpName, inputs }. */
export function describeStep(step, ctx = {}) {
  const obj = { en: objectOf(step.name?.en, 'en'), fr: objectOf(step.name?.fr, 'fr'), ar: objectOf(step.name?.ar, 'ar') };
  const kind = kindOf(step); const fields = step.form?.fields?.length ? step.form.fields : fieldsFor(kind, obj);
  const brief = {}; const details = {};
  for (const l of ['en', 'fr', 'ar']) {
    const o = (obj[l] || obj.en || '').toLowerCase(); const role = step.role?.[l] || step.role?.en || ''; const mp = ctx.mpName?.[l] || ctx.mpName?.en || '';
    brief[l] = step.brief?.[l] || `${step.name?.[l] || step.name?.en} — ${role}${mp ? (l === 'ar' ? `، ${LBL.done.ar} «${mp}»` : l === 'fr' ? `, ${LBL.done.fr} « ${mp} »` : `, ${LBL.done.en} “${mp}”`) : ''}.`;
    const how = fields.map(x => `• ${x.label?.[l] || x.label?.en}${x.required ? ' *' : ''}: ${x.help?.[l] || x.help?.en || ''}`).join('\n');
    details[l] = step.details?.[l] || [`${LBL.purpose[l]}: ${PURPOSE[kind][l].replace('{o}', o)}`, `${LBL.inputs[l]}: ${ctx.inputs?.[l] || ctx.inputs?.en || '—'}`, how ? `${LBL.how[l]}:\n${how}` : null, `${LBL.result[l]}: ${RESULT[kind][l].replace('{o}', obj[l] || obj.en)}`].filter(Boolean).join('\n');
  }
  return { kind, kindLabel: KIND_LABEL[kind], object: obj, fields, pattern: patternOf(kind, fields), register: registerOf(kind, step, obj), brief, details };
}
