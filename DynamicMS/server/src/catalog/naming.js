// Naming conventions (feedback on User Guide 2): functions and macro processes start with a
// noun; tasks and steps start with a verb and name their object explicitly
// ("Fix quality policy review periodicity", not "Fix review periodicity").
import { MP_OBJECTS, MP_CLAUSES, NAME_OVERRIDES } from './objects.js';

const STOP = new Set(['and', 'the', 'of', 'for', 'with', 'from', 'into', 'to', 'in', 'on', 'by', 'a', 'an', 'as', 'or', 'per']);
const PREP = /^(in|with|on|to|for|from|into|by|against|across|at|via|under)\b/i;
const PEOPLE = /^(top mgmt|top management|management|stakeholders?|owners?|teams?|staff|experts?|suppliers?|customers?|employees?|board|leadership|workers?|users?|auditors?|regulators?|parties|participants|pilots)\b/i;
const FR_MULTI = ['Mettre à jour', 'Mettre en œuvre', 'Mettre hors service', 'Rendre compte', 'Poser des questions', 'Refaire le benchmark', 'Tenir à jour', 'Faire'];

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export function frGen(direct) {
  if (direct.startsWith("l'")) return `de ${direct}`;
  if (direct.startsWith('la ')) return `de ${direct}`;
  if (direct.startsWith('le ')) return `du ${direct.slice(3)}`;
  if (direct.startsWith('les ')) return `des ${direct.slice(4)}`;
  return `de ${direct}`;
}
const arLi = (obj) => (obj.startsWith('ال') ? `لل${obj.slice(2)}` : `ل${obj}`);
const arNoAl = (w) => (w.startsWith('ال') ? w.slice(2) : w);
const content = (s) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !STOP.has(w));

// One-word steps whose verb needs a helper noun to read well.
const ONE_WORD = {
  Report: ['Report on {o} status', 'Rendre compte de l\'état {g}', 'الإبلاغ عن حالة {a}'],
  Train: ['Train staff on {o}', 'Former le personnel sur {d}', 'التدريب على {a}'],
  Celebrate: ['Celebrate {o} achievements', 'Célébrer les réussites {g}', 'الاحتفاء بإنجازات {a}'],
  Recognize: ['Recognize contributors to {o}', 'Reconnaître les contributeurs {g}', 'تكريم المساهمين في {a}'],
  Execute: ['Execute {o} activities', 'Exécuter les activités {g}', 'تنفيذ أنشطة {a}'],
  Close: ['Close the {o} cycle', 'Clôturer le cycle {g}', 'إغلاق دورة {a}'],
  Communicate: ['Communicate {o}', 'Communiquer {d}', 'التواصل بشأن {a}'],
  Participate: ['Participate in {o} activities', 'Participer aux activités {g}', 'المشاركة في أنشطة {a}'],
  Ask: ['Ask questions about {o}', 'Poser des questions sur {d}', 'طرح الأسئلة حول {a}'],
  Collaborate: ['Collaborate on {o}', 'Collaborer sur {d}', 'التعاون بشأن {a}'],
  Interview: ['Interview {o} stakeholders', 'Interviewer les acteurs {g}', 'مقابلة الأطراف المعنية بـ{a}'],
  Learn: ['Learn from {o}', 'Tirer les enseignements {g}', 'التعلم من {a}'],
  Ingest: ['Ingest {o} data', 'Ingérer les données {g}', 'استيعاب بيانات {a}'],
  Document: ['Document {o}', 'Documenter {d}', 'توثيق {a}'],
  Support: ['Support {o} users', 'Accompagner les utilisateurs {g}', 'دعم مستخدمي {a}'],
  Deliver: ['Deliver {o}', 'Dispenser {d}', 'تقديم {a}'],
  Join: ['Join {o}', 'Rejoindre {d}', 'الانضمام إلى {a}'],
  Browse: ['Browse {o}', 'Parcourir {d}', 'تصفح {a}'],
  Download: ['Download {o}', 'Télécharger {d}', 'تنزيل {a}'],
  Transition: ['Transition {o} to steady state', 'Faire passer {d} en régime établi', 'نقل {a} إلى التشغيل المستقر'],
  Launch: ['Launch {o}', 'Lancer {d}', 'إطلاق {a}'],
  Escalate: ['Escalate {o} issues', 'Escalader les problèmes {g}', 'تصعيد مشكلات {a}'],
  Notify: ['Notify owners of {o}', 'Notifier les responsables {g}', 'إشعار مسؤولي {a}'],
};

// Two-word source names that need a specific construction.
const TWO_WORD = {
  'take action': ['Take action on {o} deviations', 'Agir sur les écarts {g}', 'اتخاذ إجراءات بشأن انحرافات {a}'],
  'designate responsible': ['Designate owners of {o}', 'Désigner les responsables {g}', 'تعيين مسؤولي {a}'],
  'set up': ['Set up {o}', 'Mettre en place {d}', 'إعداد {a}'],
  'follow up': ['Follow up {o}', 'Assurer le suivi {g}', 'متابعة {a}'],
  'archive obsolete': ['Archive obsolete {o}', 'Archiver les éléments obsolètes {g}', 'أرشفة المتقادم من {a}'],
  'assign raci': ['Assign RACSI roles for {o}', 'Attribuer les rôles RACSI {g}', 'إسناد أدوار RACSI {l}'],
};
const AR_PREP = { 'التحقق': 'التحقق من', 'المصادقة': 'المصادقة على', 'الموافقة': 'الموافقة على', 'التوصية': 'التوصية بشأن', 'التنبيه': 'التنبيه بشأن', 'المشاركة': 'المشاركة في', 'الانضمام': 'الانضمام إلى', 'التعاون': 'التعاون بشأن', 'الاستشارة': 'الاستشارة بشأن', 'التأكيد': 'التأكيد على', 'الإحالة': 'إحالة' };
const PEOPLE_VERBS = /^(consult|alert|notify|inform|engage|involve|brief|interview|invite|survey|train|coordinate|meet)$/i;
const ADVERB = /^(daily|weekly|monthly|quarterly|annually|periodically|regularly|continuously)$/i;

export function explicitStepName(stepName, mpId) {
  const out = explicitRaw(stepName, mpId);
  return { ...out, en: out.en.replace(/\bmgmt\b/g, 'management').replace(/\bKB\b/g, 'knowledge base') };
}
function explicitRaw(stepName, mpId) {
  const en = stepName.en.trim();
  const o = NAME_OVERRIDES[`${mpId}|${en}`] || NAME_OVERRIDES[en];
  if (o) return { en: o[0], fr: o[1], ar: o[2] };
  const obj = MP_OBJECTS[mpId];
  if (!obj) return stepName;
  const [oEn, oFr, oAr] = obj;
  const words = en.replace(/\bmgmt\b/g, 'management').split(/\s+/);
  const fr = stepName.fr.trim(); const ar = stepName.ar.trim();
  if (words.length >= 4) return stepName;
  // Slash verbs ("Review/improve") become coordinated verbs.
  const verbRaw = words[0];
  const verbs = verbRaw.split('/');
  const verbEn = verbs.length > 1 ? `${verbs.slice(0, -1).join(', ')} and ${verbs[verbs.length - 1].toLowerCase()}` : verbRaw;
  const rest = words.slice(1).join(' ');
  const g = frGen(oFr);
  if (!rest) {
    const t = ONE_WORD[verbRaw];
    if (t) return { en: t[0].replace('{o}', oEn), fr: t[1].replace('{d}', oFr).replace('{g}', g), ar: t[2].replace('{a}', oAr) };
    const frVerb = fr.replace(/\//g, ' et ');
    const arPrep = AR_PREP[ar.split('/')[0]];
    if (arPrep && !ar.includes('/')) return { en: `${cap(verbEn)} ${oEn}`, fr: `${frVerb} ${oFr}`, ar: `${arPrep} ${oAr}` };
    const arVerb = ar.includes(' ') ? null : ar.split('/').map(arNoAl).join(' و');
    if (!arVerb) return { en: `${cap(verbEn)} ${oEn}`, fr: `${frVerb} ${oFr}`, ar: `${ar} ${arLi(oAr)}` };
    return { en: `${cap(verbEn)} ${oEn}`, fr: `${frVerb} ${oFr}`, ar: `${arVerb} ${oAr}` };
  }
  const restL = rest.toLowerCase();
  const tw = TWO_WORD[`${verbRaw.toLowerCase()} ${restL}`];
  if (tw) return { en: tw[0].replace('{o}', oEn), fr: tw[1].replace('{d}', oFr).replace('{g}', g), ar: tw[2].replace('{a}', oAr).replace('{l}', arLi(oAr)) };
  if (ADVERB.test(rest)) {
    const fv = FR_MULTI.find(m => fr.startsWith(m)) || fr.split(/\s+/)[0];
    return { en: `${cap(verbEn)} ${oEn} ${restL}`, fr: `${fv} ${oFr} ${fr.slice(fv.length).trim()}`, ar: `${ar} ${arLi(oAr)}` };
  }
  const objWords = content(oEn);
  const mpWords = new Set([...objWords]);
  // "Draft policy" in the quality policy process -> "Draft quality policy"
  if (oEn.toLowerCase().includes(restL) || (content(rest).length && content(rest).every(w => mpWords.has(w) || mpWords.has(w.replace(/s$/, ''))))) {
    const fv = FR_MULTI.find(m => fr.startsWith(m)) || fr.split(/\s+/)[0];
    return { en: `${cap(verbEn)} ${oEn}`, fr: `${fv} ${oFr}`, ar: `${arNoAl(ar.split(/\s+/)[0])} ${oAr}` };
  }
  // A three-word name that already names a specific object stays as is.
  if (words.length === 3 && !/^(review|scope|periodicity|frequency|data|requirements|results|status|report|reports|changes|records|plan)\b/i.test(rest) && !PREP.test(rest) && !PEOPLE.test(rest)) return stepName;
  if (PEOPLE.test(rest) && PEOPLE_VERBS.test(verbRaw)) return { en: `${cap(verbEn)} ${rest.replace(/\bmgmt\b/, 'management')} on ${oEn}`, fr: `${fr} sur ${oFr}`, ar: `${ar} حول ${oAr}` };
  if (PREP.test(rest)) {
    const fv = FR_MULTI.find(m => fr.startsWith(m)) || fr.split(/\s+/)[0];
    const frRest = fr.slice(fv.length).trim();
    return { en: `${cap(verbEn)} ${oEn} ${rest}`, fr: `${fv} ${oFr} ${frRest}`.trim(), ar: `${ar} ${arLi(oAr)}` };
  }
  return { en: `${cap(verbEn)} ${oEn} ${rest}`, fr: `${fr} ${g}`, ar: `${ar} ${arLi(oAr)}` };
}

// Generic task names ("Plan & Prepare", "Execute", ...) carry the macro process object.
export function explicitTaskName(taskName, mpId) {
  const obj = MP_OBJECTS[mpId];
  if (!obj) return taskName;
  const [oEn, oFr, oAr] = obj;
  switch (taskName.en) {
    case 'Plan & Prepare': return { en: `Plan and prepare ${oEn}`, fr: `Planifier et préparer ${oFr}`, ar: `تخطيط وتحضير ${oAr}` };
    case 'Execute': return { en: `Execute ${oEn} activities`, fr: `Exécuter les activités ${frGen(oFr)}`, ar: `تنفيذ أنشطة ${oAr}` };
    case 'Verify, Record & Close': return { en: `Verify, record and close ${oEn}`, fr: `Vérifier, enregistrer et clôturer ${oFr}`, ar: `التحقق والتسجيل والإغلاق ${arLi(oAr)}` };
    default: return taskName;
  }
}

// Naming rule check for user-created process elements (FR-DA-PCM naming convention).
const VERB_HINT = /^(accept|access|activate|add|address|adjust|aggregate|alert|align|allocate|analy[sz]e|apply|approve|archive|ask|assemble|assess|assign|attach|attend|audit|author|automate|build|calculate|calibrate|capture|cascade|catalog|categorize|celebrate|certify|check|classify|close|collaborate|collect|communicate|compare|compile|complete|conduct|configure|confirm|connect|consolidate|consult|control|coordinate|correct|create|decide|declare|decommission|define|deliver|deploy|design|designate|detect|determine|develop|display|dispose|distribute|document|download|draft|drive|enable|enforce|engage|ensure|enter|escalate|establish|estimate|evaluate|execute|expand|extract|facilitate|feed|file|filter|fix|flag|follow|form|gather|generate|govern|group|guide|handle|hash|hold|identify|implement|import|improve|index|ingest|initiate|inspect|integrate|interpret|interview|inventory|investigate|invite|issue|join|label|launch|learn|link|lock|log|maintain|manage|map|match|measure|model|monitor|move|name|normalize|notify|obtain|operate|optimize|participate|pay|peer-review|perform|personalize|plan|predict|prepare|present|prioritize|process|produce|provide|publish|qualify|quantify|rank|rate|read|reassess|receive|recognize|recommend|reconstruct|record|refine|register|remediate|report|requalify|resolve|respond|retire|retrain|retrieve|revalidate|review|revise|route|run|scan|schedule|score|secure|select|send|set|share|sign|simulate|standardize|store|submit|subscribe|suggest|supersede|support|survey|synchronize|take|test|track|train|transcribe|transfer|transition|translate|transmit|trigger|update|upgrade|upload|use|validate|verify|version|visualize|write)\b/i;
export function checkName(level, name) {
  const s = String(name || '').trim();
  const words = s.split(/\s+/).filter(Boolean);
  if (!s) return { ok: false, rule: 'required' };
  if (level === 'task' || level === 'step') {
    if (!VERB_HINT.test(s)) return { ok: false, rule: 'verb_first' };
    if (words.length < 2) return { ok: false, rule: 'explicit_object' };
  } else if (level === 'function' || level === 'macro_process') {
    if (VERB_HINT.test(s) && !/^(process|control|plan|design|record|report|review|audit|document|model|support|training|risk)\b/i.test(s)) return { ok: false, rule: 'noun_first' };
  }
  return { ok: true };
}

// ---- Step descriptions: brief line + detailed guidance (expand / collapse in the UI)
const L = (en, fr, ar) => ({ en, fr, ar });
export const HOW_TO = {
  standards: L('Select once, here, the standards the management system applies and the scope type (single standard or integrated). Every document, template and requirement list of the project uses this choice.', 'Sélectionnez une seule fois, ici, les normes appliquées et le type de périmètre (norme unique ou intégré). Tous les documents, modèles et listes d\'exigences du projet utilisent ce choix.', 'اختر هنا، مرة واحدة، المعايير التي يطبقها نظام الإدارة ونوع النطاق (معيار واحد أو متكامل). تستخدم جميع وثائق المشروع ونماذجه وقوائم متطلباته هذا الاختيار.'),
  periodicity: L('Set how often this is reviewed, the next due date, who chairs it and which organization units are in scope. The date feeds the planning and the review alerts.', 'Fixez la fréquence de revue, la prochaine échéance, le responsable de la revue et les unités de l\'organisation concernées. La date alimente le planning et les alertes de revue.', 'حدد تكرار المراجعة وموعدها التالي ومن يرأسها ووحدات المؤسسة المشمولة. يغذي التاريخ التخطيط وتنبيهات المراجعة.'),
  list: L('Record one line per item. For each item give its category, a short description, its impact or relevance, and the evidence it comes from (a document, a record, a meeting). Items become entries of the related register.', 'Saisissez une ligne par élément : catégorie, description courte, impact ou pertinence, et la preuve d\'origine (document, enregistrement, réunion). Les éléments alimentent le registre associé.', 'سجّل سطرًا لكل بند: الفئة ووصف موجز والأثر أو الأهمية والدليل الذي يستند إليه (وثيقة أو سجل أو اجتماع). تتحول البنود إلى قيود في السجل المرتبط.'),
  assess: L('Score each criterion of the decision matrix from 1 to 5 using the scale shown, weight the criteria, and justify each score with facts. The weighted result gives the overall score.', 'Notez chaque critère de la matrice de décision de 1 à 5 selon l\'échelle affichée, pondérez les critères et justifiez chaque note par des faits. Le résultat pondéré donne la note globale.', 'قيّم كل معيار في مصفوفة القرار من 1 إلى 5 وفق السلم المعروض، ورجّح المعايير، وبرّر كل درجة بالوقائع. تعطي النتيجة المرجحة الدرجة الإجمالية.'),
  decision: L('Check the criteria listed, then record Go, No-Go or Hold with the accountable approver. A No-Go or Hold needs a comment and the conditions to meet.', 'Vérifiez les critères listés puis enregistrez Go, No-Go ou En attente avec l\'approbateur responsable. Un No-Go ou une mise en attente exige un commentaire et les conditions à remplir.', 'تحقق من المعايير المدرجة ثم سجّل المضي أو عدم المضي أو التعليق مع الموافق المساءل. يتطلب عدم المضي أو التعليق تعليقًا والشروط المطلوبة.'),
  document: L('Choose the document template, then generate the document from the data already recorded in this project. Check the result, set the version and send it for review. The document appears in Documents with its version history.', 'Choisissez le modèle, puis générez le document à partir des données déjà saisies dans ce projet. Vérifiez le résultat, fixez la version et soumettez-le en revue. Le document apparaît dans Documents avec son historique de versions.', 'اختر نموذج الوثيقة ثم ولّدها من البيانات المسجلة في هذا المشروع. راجع النتيجة وحدد الإصدار وأرسلها للمراجعة. تظهر الوثيقة في الوثائق مع سجل إصداراتها.'),
  communicate: L('List each audience with the channel, the date and the key message. Attach the material sent. Each line is kept as a communication record (ISO 9001 §7.4: what, when, with whom, how, who communicates).', 'Listez chaque public avec le canal, la date et le message clé. Joignez le support diffusé. Chaque ligne est conservée comme enregistrement de communication (ISO 9001 §7.4 : quoi, quand, avec qui, comment, qui communique).', 'أدرج كل جمهور مع القناة والتاريخ والرسالة الرئيسية وأرفق المادة المرسلة. يُحفظ كل سطر كسجل تواصل (ISO 9001 §7.4: ماذا ومتى ومع من وكيف ومن يتواصل).'),
  train: L('Record the session, the participants, the date and how effectiveness was evaluated. Effectiveness below 80% opens a follow-up action.', 'Enregistrez la session, les participants, la date et la méthode d\'évaluation de l\'efficacité. Une efficacité inférieure à 80 % ouvre une action de suivi.', 'سجّل الجلسة والمشاركين والتاريخ وطريقة تقييم الفعالية. تفتح فعالية أقل من 80% إجراء متابعة.'),
  monitor: L('Select the KPI(s) that measure this step\'s output from the project KPI list, or create a new one. Explain why the KPI is relevant here, enter the measured value and analyze the gap to target.', 'Sélectionnez dans la liste des KPI du projet le ou les KPI qui mesurent la sortie de cette étape, ou créez-en un. Expliquez pourquoi ce KPI est pertinent ici, saisissez la valeur mesurée et analysez l\'écart à la cible.', 'اختر من قائمة مؤشرات المشروع المؤشر أو المؤشرات التي تقيس مخرج هذه الخطوة أو أنشئ مؤشرًا جديدًا. اشرح سبب ملاءمته هنا وأدخل القيمة المقاسة وحلّل الفجوة عن المستهدف.'),
  review: L('Plan the review: frequency, next date, chair, participants and the inputs to examine. Record the decisions; each decision with an owner and a due date becomes an action in the Action plan.', 'Planifiez la revue : fréquence, prochaine date, président, participants et éléments d\'entrée à examiner. Enregistrez les décisions ; chaque décision avec responsable et échéance devient une action du plan d\'actions.', 'خطط للمراجعة: التكرار والموعد التالي والرئيس والمشاركون والمدخلات المراد فحصها. سجّل القرارات؛ يصبح كل قرار له مسؤول وموعد إجراءً في خطة العمل.'),
  plan: L('List each activity with its owner, start and due dates and expected deliverable. When the step is completed every line becomes an action managed in the Action plan module.', 'Listez chaque activité avec son responsable, ses dates de début et d\'échéance et le livrable attendu. À la clôture de l\'étape, chaque ligne devient une action gérée dans le module Plan d\'actions.', 'أدرج كل نشاط مع مسؤوله وتاريخي البدء والاستحقاق والمخرج المتوقع. عند إكمال الخطوة يصبح كل سطر إجراءً يُدار في وحدة خطة العمل.'),
  objectives: L('Define each objective in SMART form: specific statement, KPI that measures it, target and baseline, owner, deadline and resources. Each line becomes an entry of the objectives register.', 'Définissez chaque objectif au format SMART : énoncé précis, KPI de mesure, cible et valeur de départ, responsable, échéance et ressources. Chaque ligne devient une entrée du registre des objectifs.', 'حدد كل هدف بصيغة SMART: صياغة محددة ومؤشر القياس والمستهدف وخط الأساس والمسؤول والموعد والموارد. يصبح كل سطر قيدًا في سجل الأهداف.'),
  execute: L('Describe what was done and link the records that prove it (documents, register entries, attachments). Give the completion percentage.', 'Décrivez ce qui a été réalisé et liez les enregistrements qui le prouvent (documents, entrées de registre, pièces jointes). Indiquez le pourcentage d\'avancement.', 'صف ما تم إنجازه واربط السجلات التي تثبته (وثائق وقيود سجلات ومرفقات). أدخل نسبة الإنجاز.'),
  assign: L('Pick the role and the person from the organization structure (OBS), then set the RACSI letters (Responsible, Accountable, Consulted, Support, Informed) for this macro process. Only one Accountable is allowed.', 'Choisissez le rôle et la personne dans la structure de l\'organisation (OBS), puis fixez les lettres RACSI (Réalise, Approuve, Consulté, Support, Informé) pour ce macro-processus. Un seul A est permis.', 'اختر الدور والشخص من الهيكل التنظيمي (OBS) ثم حدد أحرف RACSI (المنفذ، المساءل، المستشار، الداعم، المُبلَّغ) لهذه العملية الكلية. يُسمح بمساءل واحد فقط.'),
  configure: L('Record each setting with its value and the reason, then confirm it was tested before use.', 'Enregistrez chaque paramètre avec sa valeur et sa justification, puis confirmez qu\'il a été testé avant usage.', 'سجّل كل إعداد مع قيمته وسببه ثم أكد اختباره قبل الاستخدام.'),
  update: L('Describe the change, the reason, the documents or records affected and the new version created.', 'Décrivez la modification, son motif, les documents ou enregistrements impactés et la nouvelle version créée.', 'صف التغيير وسببه والوثائق أو السجلات المتأثرة والإصدار الجديد الذي أنشئ.'),
  close: L('Record the closure evidence and date. Link the records that prove effectiveness.', 'Enregistrez la preuve et la date de clôture. Liez les enregistrements qui prouvent l\'efficacité.', 'سجّل دليل الإغلاق وتاريخه واربط السجلات التي تثبت الفعالية.'),
  escalate: L('Name who the issue is escalated to and why; the escalation raises an alert to that role.', 'Indiquez à qui le problème est escaladé et pourquoi ; l\'escalade déclenche une alerte vers ce rôle.', 'حدد الجهة التي يُصعَّد إليها الأمر والسبب؛ يرفع التصعيد تنبيهًا إلى ذلك الدور.'),
  ai: L('Give the assistant the context, review its suggestion, then accept, edit or reject it. Only the validated text is kept; the decision is logged.', 'Donnez le contexte à l\'assistant, examinez sa suggestion puis acceptez, modifiez ou rejetez-la. Seul le texte validé est conservé ; la décision est journalisée.', 'قدّم السياق للمساعد وراجع اقتراحه ثم اقبله أو عدّله أو ارفضه. يُحفظ النص المعتمد فقط وتُسجَّل القرار.'),
  service: L('The DynamicMS Engine runs this step. Open the record it produced from the link shown and check it.', 'Le moteur DynamicMS exécute cette étape. Ouvrez l\'enregistrement produit depuis le lien affiché et vérifiez-le.', 'ينفذ محرك DynamicMS هذه الخطوة. افتح السجل الناتج من الرابط المعروض وتحقق منه.'),
};

const T_BRIEF = L('{0} — step {1} of {2} in {3}.', '{0} — étape {1} sur {2} de {3}.', '{0} — الخطوة {1} من {2} في {3}.');
const T_PURPOSE = L('Purpose: {0}', 'Finalité : {0}', 'الغاية: {0}');
const T_INPUTS = L('Inputs to use: {0}.', 'Éléments d\'entrée à utiliser : {0}.', 'المدخلات المستخدمة: {0}.');
const T_OUTPUT = L('Expected result: {0}.', 'Résultat attendu : {0}.', 'النتيجة المتوقعة: {0}.');
const T_REF = L('Reference: {0}.', 'Référence : {0}.', 'المرجع: {0}.');
const T_WHO = L('Performed by: {0}.', 'Réalisée par : {0}.', 'ينفذها: {0}.');
const SEP = { en: ', ', fr: ', ', ar: '، ' };
function fillL(t, ...args) {
  const out = {};
  for (const l of ['en', 'fr', 'ar']) out[l] = t[l].replace(/\{(\d)\}/g, (_, i) => { const a = args[+i]; if (Array.isArray(a)) return a.map(x => x[l] ?? x.en).join(SEP[l]); if (a && typeof a === 'object') return a[l] ?? a.en; return a ?? ''; });
  return out;
}

export function stepDescriptions(step, mp, count, formKind) {
  const brief = fillL(T_BRIEF, step.name, step.seq, count, { en: `${mp.code} ${mp.name.en}`, fr: `${mp.code} ${mp.name.fr}`, ar: `${mp.code} ${mp.name.ar}` });
  const parts = [fillL(T_PURPOSE, mp.goal), HOW_TO[formKind] || HOW_TO.execute, fillL(T_INPUTS, mp.sipoc.I.slice(0, 5)), fillL(T_OUTPUT, mp.sipoc.O.slice(0, 3)), fillL(T_WHO, step.roleName)];
  if (MP_CLAUSES[mp.id]) parts.push(fillL(T_REF, MP_CLAUSES[mp.id]));
  const detail = {};
  for (const l of ['en', 'fr', 'ar']) detail[l] = parts.map(p => p[l]).join('\n');
  return { brief, detail };
}
