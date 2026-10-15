// Step forms chosen by the meaning of the step (SRS 1.9, step forms chosen by the meaning of the step): the steps of
// the scope of work (E2E-32) and of the questionnaire campaign (E2E-33) have their own fields — drop-down lists with a
// Custom value wherever a list exists, multiple choices, e-mail and phone columns — and the questionnaire steps work on
// the real questionnaire of the project (its questions, respondents, messages and responses), not on a free-text table.
// `source` names a list resolved from the Organization's data when the form is served (see resolveSources).
const L = (en, fr, ar) => ({ en, fr, ar });
const f = (key, label, type, o = {}) => ({ key, label, type, ...o });
const opt = (value, label) => ({ value, label });

export const YES_NO = [opt('Yes', L('Yes', 'Oui', 'نعم')), opt('No', L('No', 'Non', 'لا'))];
export const LEVELS = [opt('MS', L('MS — strategic (management system)', 'MS — stratégique (système de management)', 'MS — استراتيجي')), opt('MO', L('MO — middle management', 'MO — management intermédiaire', 'MO — الإدارة الوسطى')), opt('OP', L('OP — operational', 'OP — opérationnel', 'OP — تشغيلي'))];
export const ORIENTATIONS = [opt('All', L('All', 'Tous', 'الكل')), opt('Digital', L('Digital', 'Numérique', 'الرقمي')), opt('AI', L('AI', 'IA', 'الذكاء الاصطناعي')), opt('Custom', L('Custom', 'Personnalisée', 'مخصص'))];
// Channels of the questionnaire module (Q.CHANNELS) and the preferred channel of a stakeholder (Combination = hybrid).
export const Q_CHANNELS = [opt('Email', L('E-mail', 'E-mail', 'البريد الإلكتروني')), opt('WhatsApp', L('WhatsApp', 'WhatsApp', 'واتساب')), opt('Face-to-Face', L('Face to face (on site)', 'Présentiel (sur site)', 'حضوري')), opt('Application', L('In the application', 'Dans l’application', 'داخل التطبيق'))];
export const PREFERRED = [opt('Email', L('E-mail', 'E-mail', 'البريد الإلكتروني')), opt('WhatsApp', L('WhatsApp', 'WhatsApp', 'واتساب')), opt('Face-to-Face', L('On site', 'Présentiel', 'حضوري')), opt('Combination', L('Hybrid', 'Hybride', 'مختلط'))];
export const POPULATIONS = [opt('DG', L('General management', 'Direction générale', 'الإدارة العامة')), opt('Management', L('Management', 'Management', 'الإدارة')), opt('Member', L('Staff member', 'Collaborateur', 'متعاون'))];
const SH_CATEGORY = ['Sponsor', 'Decision maker', 'Respondent', 'Change relay', 'Expert'].map(v => opt(v, { Sponsor: L('Sponsor', 'Sponsor', 'راعٍ'), 'Decision maker': L('Decision maker', 'Décideur', 'صاحب قرار'), Respondent: L('Respondent', 'Répondant', 'مجيب'), 'Change relay': L('Change relay', 'Relais du changement', 'ممثل التغيير'), Expert: L('Subject-matter expert', 'Expert métier', 'خبير') }[v]));
const SH_SOURCE = ['HRIS', 'Org chart', 'Function head', 'Interview'].map(v => opt(v, { HRIS: L('HRIS export', 'Export du SIRH', 'تصدير نظام الموارد البشرية'), 'Org chart': L('Organization chart', 'Organigramme', 'الهيكل التنظيمي'), 'Function head': L('Function head', 'Responsable de fonction', 'رئيس الوظيفة'), Interview: L('Interview', 'Entretien', 'مقابلة') }[v]));
const DECISION = ['Approved', 'Approved with conditions', 'Rejected', 'Deferred'].map(v => opt(v, { Approved: L('Approved', 'Approuvé', 'موافق عليه'), 'Approved with conditions': L('Approved with conditions', 'Approuvé sous conditions', 'موافق عليه بشروط'), Rejected: L('Rejected', 'Rejeté', 'مرفوض'), Deferred: L('Deferred', 'Reporté', 'مؤجل') }[v]));

const rationale = f('rationale', L('Rationale', 'Justification', 'التعليل'), 'textarea', { help: L('Why this choice: the facts and the source.', 'Pourquoi ce choix : les faits et leur source.', 'لماذا هذا الاختيار: الوقائع ومصدرها.') });
const date = f('date', L('Decision date', 'Date de décision', 'تاريخ القرار'), 'date', { required: true, default: '{today}' });
const decidedBy = f('decidedBy', L('Decided by', 'Décidé par', 'قرر من طرف'), 'person', { required: true, default: '{me}' });
const decision = f('decision', L('Decision', 'Décision', 'القرار'), 'select', { required: true, options: DECISION, default: 'Approved' });

/** Typed forms by step id: { kind, fields } for a form or table, or { kind: 'module', module } for a questionnaire or document panel. */
export const STEP_DEFS = {
  'MP-53.1': { kind: 'decision', fields: [
    f('group', L('Group scope', 'Périmètre Groupe', 'نطاق المجموعة'), 'select', { required: true, options: YES_NO, help: L('Yes when the engagement covers several organizations of one group.', 'Oui quand la mission couvre plusieurs organisations d’un même groupe.', 'نعم إذا شملت المهمة عدة مؤسسات من مجموعة واحدة.') }),
    f('groupName', L('Group name', 'Nom du groupe', 'اسم المجموعة'), 'text', { source: 'group', help: L('Only when Group scope is Yes.', 'Seulement si le périmètre Groupe est Oui.', 'فقط إذا كان نطاق المجموعة نعم.') }), rationale, date, decidedBy] },
  'MP-53.2': { kind: 'decision', fields: [
    f('group', L('Group', 'Groupe', 'المجموعة'), 'select', { required: true, options: YES_NO }),
    f('organization', L('Organization', 'Organisation', 'المؤسسة'), 'select', { required: true, custom: true, source: 'orgs', help: L('The organization of the engagement; a Custom value for one not yet registered.', 'L’organisation de la mission ; une valeur personnalisée pour une organisation pas encore enregistrée.', 'مؤسسة المهمة؛ قيمة مخصصة لمؤسسة غير مسجلة بعد.') }), rationale, date, decidedBy] },
  'MP-53.3': { kind: 'decision', fields: [
    f('sector', L('Sector', 'Secteur', 'القطاع'), 'select', { required: true, custom: true, source: 'sectors', default: '{sector}', help: L('The sector of the organization; it selects the sector themes, standards and questionnaire templates.', 'Le secteur de l’organisation ; il détermine les thèmes, normes et modèles de questionnaire du secteur.', 'قطاع المؤسسة؛ يحدد محاور القطاع ومعاييره ونماذج الاستبيان.') }), rationale, date, decidedBy] },
  'MP-53.4': { kind: 'decision', fields: [
    f('levels', L('Decision levels', 'Niveaux de décision', 'مستويات القرار'), 'multi', { required: true, custom: true, options: LEVELS, help: L('Tick every level in scope; add a custom level if needed.', 'Cochez chaque niveau du périmètre ; ajoutez un niveau personnalisé si besoin.', 'حدد كل مستوى ضمن النطاق؛ أضف مستوى مخصصاً عند الحاجة.') }), rationale, date, decidedBy] },
  'MP-53.6': { kind: 'decision', fields: [
    f('orientation', L('Orientation', 'Orientation', 'التوجه'), 'select', { required: true, options: ORIENTATIONS, default: '{focus}' }),
    f('customOrientation', L('Custom orientation (name)', 'Orientation personnalisée (libellé)', 'التوجه المخصص (الاسم)'), 'text', { help: L('Only when the orientation is Custom.', 'Seulement si l’orientation est Personnalisée.', 'فقط إذا كان التوجه مخصصاً.') }), rationale, date, decidedBy] },
  'MP-53.7': { kind: 'record', fields: [
    f('item', L('Custom criterion', 'Critère personnalisé', 'المعيار المخصص'), 'text', { required: true }),
    f('orientation', L('Orientation', 'Orientation', 'التوجه'), 'select', { options: ORIENTATIONS, default: '{focus}', carry: true }),
    f('weight', L('Weight', 'Poids', 'الوزن'), 'number', { min: 0, max: 5, total: false, help: L('From 0 to 5; 1 is the weight of a standard criterion.', 'De 0 à 5 ; 1 est le poids d’un critère standard.', 'من 0 إلى 5؛ 1 هو وزن المعيار العادي.') }),
    f('description', L('Description', 'Description', 'الوصف'), 'textarea'), f('owner', L('Owner', 'Responsable', 'المسؤول'), 'person'),
    f('source', L('Source', 'Source', 'المصدر'), 'select', { custom: true, options: SH_SOURCE })] },
  'MP-53.8': { kind: 'record', stakeholders: true, fields: [
    f('item', L('Stakeholder name', 'Nom de la partie prenante', 'اسم صاحب المصلحة'), 'person', { required: true, help: L('A person of the organization, or a Custom value for someone not yet registered.', 'Une personne de l’organisation, ou une valeur personnalisée pour une personne pas encore enregistrée.', 'شخص من المؤسسة أو قيمة مخصصة لشخص غير مسجل.') }),
    f('email', L('E-mail', 'E-mail', 'البريد الإلكتروني'), 'email', { help: L('Needed to send the questionnaire by e-mail.', 'Nécessaire pour envoyer le questionnaire par e-mail.', 'ضروري لإرسال الاستبيان بالبريد.') }),
    f('phone', L('Phone (WhatsApp)', 'Téléphone (WhatsApp)', 'الهاتف (واتساب)'), 'phone', { help: L('With the country code, for example +212 6 12 34 56 78; needed for WhatsApp.', 'Avec l’indicatif, par exemple +212 6 12 34 56 78 ; nécessaire pour WhatsApp.', 'مع رمز البلد، مثل ‎+212 6 12 34 56 78؛ ضروري لواتساب.') }),
    f('role', L('Role', 'Rôle', 'الدور'), 'role', { required: true }), f('function', L('Function', 'Fonction', 'الوظيفة'), 'function', { required: true }),
    f('level', L('Level', 'Niveau', 'المستوى'), 'select', { required: true, custom: true, options: LEVELS }),
    f('site', L('Site', 'Site', 'الموقع'), 'select', { custom: true, source: 'sites' }),
    f('channel', L('Preferred channel', 'Canal préféré', 'القناة المفضلة'), 'select', { required: true, options: PREFERRED }),
    f('category', L('Category', 'Catégorie', 'الفئة'), 'select', { custom: true, options: SH_CATEGORY, carry: true }),
    f('description', L('Description', 'Description', 'الوصف'), 'textarea'), f('owner', L('Owner', 'Responsable', 'المسؤول'), 'person'),
    f('source', L('Source', 'Source', 'المصدر'), 'select', { custom: true, options: SH_SOURCE, carry: true })] },
  'MP-53.10': { kind: 'module', module: 'document', doc: 'DT-E2E-32', report: 'RPT-033' },
  'MP-54.1': { kind: 'decision', questionnaire: 'create', fields: [decision,
    f('templates', L('Questionnaire templates', 'Modèles de questionnaire', 'نماذج الاستبيان'), 'multi', { required: true, custom: true, source: 'qtemplates', help: L('One template per population (general management, management, staff); a Custom value starts an empty questionnaire.', 'Un modèle par population (direction générale, management, collaborateurs) ; une valeur personnalisée démarre un questionnaire vide.', 'نموذج لكل فئة؛ القيمة المخصصة تبدأ استبياناً فارغاً.') }),
    rationale, date, decidedBy] },
  'MP-54.2': { kind: 'module', module: 'qdesign' },
  'MP-54.3': { kind: 'module', module: 'qvalidate' },
  'MP-54.4': { kind: 'record', questionnaire: 'racsi', fields: [
    f('role', L('Role', 'Rôle', 'الدور'), 'role', { required: true }),
    f('R', L('R — Responsible', 'R — Réalise', 'R — منفذ'), 'boolean'), f('A', L('A — Accountable', 'A — Approuve', 'A — مسؤول'), 'boolean'), f('C', L('C — Consulted', 'C — Consulté', 'C — مستشار'), 'boolean'),
    f('S', L('S — Support', 'S — Soutient', 'S — داعم'), 'boolean'), f('I', L('I — Informed', 'I — Informé', 'I — مُبلَّغ'), 'boolean'),
    f('sections', L('Sections', 'Sections', 'الأقسام'), 'multi', { custom: true, source: 'qsections', help: L('The sections concerned; empty means every section.', 'Les sections concernées ; vide = toutes les sections.', 'الأقسام المعنية؛ الفارغ يعني جميع الأقسام.') }),
    f('note', L('Comment', 'Commentaire', 'تعليق'), 'text')] },
  'MP-54.5': { kind: 'record', questionnaire: 'channels', fields: [
    f('level', L('Decision level', 'Niveau de décision', 'مستوى القرار'), 'select', { required: true, custom: true, options: LEVELS }),
    f('channels', L('Preferred channels', 'Canaux préférés', 'القنوات المفضلة'), 'multi', { required: true, options: Q_CHANNELS, help: L('In the order they are used: the first invites, the next ones remind.', 'Dans l’ordre d’utilisation : le premier invite, les suivants relancent.', 'بترتيب الاستعمال: الأولى للدعوة والتالية للتذكير.') }),
    f('population', L('Population', 'Population', 'الفئة'), 'select', { options: POPULATIONS }),
    f('every', L('Reminder every (days)', 'Relance tous les (jours)', 'التذكير كل (أيام)'), 'number', { min: 1, max: 30, default: '3', total: false }),
    f('max', L('Number of reminders', 'Nombre de relances', 'عدد التذكيرات'), 'number', { min: 0, max: 5, default: '2', total: false }),
    f('note', L('Comment', 'Commentaire', 'تعليق'), 'text')] },
  'MP-54.6': { kind: 'module', module: 'qdistribute' },
  'MP-54.7': { kind: 'module', module: 'qremind' },
  'MP-54.8': { kind: 'module', module: 'qresponses' },
  'MP-54.9': { kind: 'module', module: 'qcomplete' },
  'MP-54.10': { kind: 'module', module: 'qdataset' },
  'MP-54.11': { kind: 'module', module: 'qfeed' },
  'MP-54.12': { kind: 'module', module: 'qreport', doc: 'DT-E2E-33', report: 'RPT-034' },
};
export const MODULE_LABEL = {
  document: L('Generated document', 'Document généré', 'وثيقة مولدة'), qdesign: L('Questionnaire questions', 'Questions du questionnaire', 'أسئلة الاستبيان'), qvalidate: L('Question validation', 'Validation des questions', 'المصادقة على الأسئلة'),
  qdistribute: L('Distribution', 'Diffusion', 'التوزيع'), qremind: L('Reminders', 'Relances', 'التذكيرات'), qresponses: L('Responses', 'Réponses', 'الإجابات'), qcomplete: L('Completeness and consent', 'Complétude et consentement', 'الاكتمال والموافقة'),
  qdataset: L('Consolidated dataset', 'Jeu de données consolidé', 'مجموعة البيانات الموحدة'), qfeed: L('Feed to the analysis', 'Alimentation de l’analyse', 'تغذية التحليل'), qreport: L('Response report', 'Rapport des réponses', 'تقرير الإجابات'),
};
