// Step input forms. Every step of every macro process is executed through one of
// these form kinds; the kind is inferred from the step's leading verb and type.
const L = (en, fr, ar) => ({ en, fr, ar });

export const FORM_KINDS = {
  periodicity: {
    label: L('Periodicity', 'Périodicité', 'الدورية'),
    fields: [
      { key: 'frequency', type: 'select', list: 'LST-FREQ', label: L('Frequency', 'Fréquence', 'التكرار'), required: true },
      { key: 'nextDate', type: 'date', label: L('Next due date', 'Prochaine échéance', 'موعد الاستحقاق التالي'), required: true },
      { key: 'notes', type: 'text', label: L('Scope / notes', 'Périmètre / notes', 'النطاق / ملاحظات') },
    ],
  },
  list: {
    label: L('Register items', 'Éléments du registre', 'بنود السجل'),
    fields: [
      { key: 'items', type: 'textarea', label: L('Items identified (one per line)', 'Éléments identifiés (un par ligne)', 'البنود المحددة (بند في كل سطر)'), required: true },
      { key: 'source', type: 'text', label: L('Source / evidence', 'Source / preuve', 'المصدر / الدليل') },
    ],
  },
  assess: {
    label: L('Assessment', 'Évaluation', 'التقييم'),
    fields: [
      { key: 'score', type: 'score', label: L('Score (1–5)', 'Score (1–5)', 'الدرجة (1–5)'), required: true },
      { key: 'rationale', type: 'textarea', label: L('Rationale and facts', 'Justification et faits', 'المبررات والوقائع'), required: true },
    ],
  },
  decision: {
    label: L('Decision', 'Décision', 'القرار'),
    fields: [
      { key: 'decision', type: 'select', options: ['Go', 'No-Go', 'Hold'], label: L('Decision', 'Décision', 'القرار'), required: true },
      { key: 'approver', type: 'role', label: L('Approver (Accountable)', 'Approbateur (Autorité)', 'الموافق (المساءَل)'), required: true },
      { key: 'comment', type: 'textarea', label: L('Decision comment', 'Commentaire de décision', 'تعليق القرار') },
    ],
  },
  document: {
    label: L('Document', 'Document', 'الوثيقة'),
    fields: [
      { key: 'docRef', type: 'text', label: L('Document reference', 'Référence du document', 'مرجع الوثيقة'), required: true },
      { key: 'version', type: 'text', label: L('Version', 'Version', 'الإصدار'), required: true },
      { key: 'summary', type: 'textarea', label: L('Content summary', 'Résumé du contenu', 'ملخص المحتوى') },
    ],
  },
  communicate: {
    label: L('Communication', 'Communication', 'التواصل'),
    fields: [
      { key: 'audience', type: 'text', label: L('Audience', 'Public', 'الجمهور'), required: true },
      { key: 'channel', type: 'select', options: ['Intranet', 'E-mail', 'Meeting', 'Notice board', 'Portal'], label: L('Channel', 'Canal', 'القناة'), required: true },
      { key: 'message', type: 'textarea', label: L('Key message', 'Message clé', 'الرسالة الرئيسية') },
    ],
  },
  train: {
    label: L('Training', 'Formation', 'التدريب'),
    fields: [
      { key: 'session', type: 'text', label: L('Session / module', 'Session / module', 'الجلسة / الوحدة'), required: true },
      { key: 'participants', type: 'number', label: L('Participants', 'Participants', 'المشاركون'), required: true },
      { key: 'effectiveness', type: 'number', label: L('Effectiveness (%)', 'Efficacité (%)', 'الفعالية (%)') },
    ],
  },
  monitor: {
    label: L('Measurement', 'Mesure', 'القياس'),
    fields: [
      { key: 'metric', type: 'text', label: L('Indicator', 'Indicateur', 'المؤشر'), required: true },
      { key: 'value', type: 'number', label: L('Measured value', 'Valeur mesurée', 'القيمة المقاسة'), required: true },
      { key: 'target', type: 'text', label: L('Target', 'Cible', 'المستهدف') },
      { key: 'comment', type: 'textarea', label: L('Analysis', 'Analyse', 'التحليل') },
    ],
  },
  plan: {
    label: L('Plan', 'Plan', 'الخطة'),
    fields: [
      { key: 'items', type: 'textarea', label: L('Planned activities (one per line)', 'Activités planifiées (une par ligne)', 'الأنشطة المخططة (نشاط في كل سطر)'), required: true },
      { key: 'start', type: 'date', label: L('Start', 'Début', 'البداية'), required: true },
      { key: 'end', type: 'date', label: L('End', 'Fin', 'النهاية'), required: true },
    ],
  },
  execute: {
    label: L('Execution', 'Exécution', 'التنفيذ'),
    fields: [
      { key: 'evidence', type: 'textarea', label: L('Evidence of execution', 'Preuve d\'exécution', 'دليل التنفيذ'), required: true },
      { key: 'completion', type: 'number', label: L('Completion (%)', 'Avancement (%)', 'نسبة الإنجاز (%)'), required: true },
    ],
  },
  assign: {
    label: L('Assignment', 'Affectation', 'الإسناد'),
    fields: [
      { key: 'role', type: 'role', label: L('Role', 'Rôle', 'الدور'), required: true },
      { key: 'person', type: 'text', label: L('Person / team', 'Personne / équipe', 'الشخص / الفريق'), required: true },
      { key: 'scope', type: 'text', label: L('Scope of responsibility', 'Périmètre de responsabilité', 'نطاق المسؤولية') },
    ],
  },
  configure: {
    label: L('Configuration', 'Configuration', 'التهيئة'),
    fields: [
      { key: 'setting', type: 'text', label: L('Setting', 'Paramètre', 'الإعداد'), required: true },
      { key: 'value', type: 'text', label: L('Value', 'Valeur', 'القيمة'), required: true },
      { key: 'notes', type: 'text', label: L('Notes', 'Notes', 'ملاحظات') },
    ],
  },
  update: {
    label: L('Change', 'Modification', 'التغيير'),
    fields: [
      { key: 'change', type: 'textarea', label: L('Change made', 'Modification apportée', 'التغيير المُجرى'), required: true },
      { key: 'reason', type: 'text', label: L('Reason', 'Motif', 'السبب'), required: true },
    ],
  },
  close: {
    label: L('Closure', 'Clôture', 'الإغلاق'),
    fields: [
      { key: 'evidence', type: 'textarea', label: L('Closure evidence', 'Preuve de clôture', 'دليل الإغلاق'), required: true },
      { key: 'date', type: 'date', label: L('Closure date', 'Date de clôture', 'تاريخ الإغلاق'), required: true },
    ],
  },
  escalate: {
    label: L('Escalation', 'Escalade', 'التصعيد'),
    fields: [
      { key: 'to', type: 'role', label: L('Escalated to', 'Escaladé à', 'تم التصعيد إلى'), required: true },
      { key: 'reason', type: 'textarea', label: L('Reason', 'Motif', 'السبب'), required: true },
    ],
  },
  ai: {
    label: L('AI-assisted draft', 'Brouillon assisté par IA', 'مسودة بمساعدة الذكاء الاصطناعي'),
    fields: [
      { key: 'context', type: 'textarea', label: L('Context given to the assistant', 'Contexte fourni à l\'assistant', 'السياق المقدم للمساعد'), required: true },
      { key: 'outcome', type: 'select', options: ['Accepted', 'Edited', 'Rejected'], label: L('Suggestion outcome', 'Issue de la suggestion', 'نتيجة الاقتراح'), required: true },
      { key: 'final', type: 'textarea', label: L('Final validated text', 'Texte final validé', 'النص النهائي المعتمد') },
    ],
  },
  service: {
    label: L('Automated service task', 'Tâche de service automatisée', 'مهمة خدمة آلية'),
    fields: [
      { key: 'result', type: 'text', label: L('System result confirmed', 'Résultat système confirmé', 'نتيجة النظام المؤكدة'), required: true },
    ],
  },
};

const RULES = [
  [/^(fix|set|establish) (review )?(periodicity|frequency)|^(set|establish) frequency|periodicity/i, 'periodicity'],
  [/^(approve|obtain approval|validate|confirm|certify|close and obtain|issue certification|accept|go\/no-go|lock for approval|approve startup)/i, 'decision'],
  [/^(assess|evaluate|analy[sz]e|score|calculate|quantify|compute|compare|rank|classify|prioriti[sz]e|determine|review relevance|review effectiveness|test|verify|check)/i, 'assess'],
  [/^(document|draft|publish|issue|record|produce|write|register|file|prepare|compile|generate|author|create procedure|develop instructions|maintain (register|registry|log|records|repository|legal register|trails))/i, 'document'],
  [/^(communicate|notify|distribute|share|report|inform|present|alert|transmit|deliver report|send)/i, 'communicate'],
  [/^(train|deliver formal training|refresher|conduct exercises|deliver)/i, 'train'],
  [/^(monitor|track|measure|review|follow up|observe|re-?benchmark|benchmark|audit|inspect|survey)/i, 'monitor'],
  [/^(plan|schedule|design|define plans|develop plan|establish roadmaps|build portfolio)/i, 'plan'],
  [/^(designate|assign|allocate|appoint|form teams|select pilots|assemble team|match expert|identify candidates)/i, 'assign'],
  [/^(configure|set up|activate|enable|integrate|connect|deploy|install|provide|operate|implement|enforce|apply)/i, 'configure'],
  [/^(update|adjust|correct|remediate|improve|refine|revise|optimi[sz]e|retrain|upgrade|translate|customi[sz]e|standardi[sz]e)/i, 'update'],
  [/^(close|archive|dispose|retire|decommission|complete handover|close account|supersede)/i, 'close'],
  [/^(escalate|confirm or escalate)/i, 'escalate'],
  [/^(identify|define|collect|list|select|capture|map|gather|determine|cascade|consult|integrate commitments|aggregate|ingest|extract|detect|discover)/i, 'list'],
  [/^(execute|conduct|run|perform|carry out|contain|launch|celebrate|recognize|support|move to steady state|execute transition|conduct pilot|take action|join|participate|ask|attend|collaborate|interview|consult)/i, 'execute'],
];

export function formKindOf(stepName, stepType) {
  if (stepType === 'Service Task') return 'service';
  if (stepType === 'AI-Assisted Task') return 'ai';
  const s = (stepName || '').trim();
  for (const [rx, kind] of RULES) if (rx.test(s)) return kind;
  return 'execute';
}
