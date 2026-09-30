// Detailed records behind the IMS documents: measuring equipment, competence and training,
// communication plan and log, changes, compliance obligations, control plan, supplier
// evaluations, customer requirement reviews, releases, nonconforming output dispositions
// and 8D corrective action reports. Trilingual and fictional; generated per project run.
import { S, fill } from './text.js';

const EQUIPMENT = [
  { t: S('Torque wrench 5–60 N·m', 'Clé dynamométrique 5–60 N·m', 'مفتاح عزم 5–60 نيوتن·م'), cat: 'Mechanical', mfr: 'Norbar', model: 'TTi 60', range: '5–60 N·m', res: '0.1 N·m', tol: '± 4 %', method: 'External', months: 12 },
  { t: S('Digital caliper 0–150 mm', 'Pied à coulisse numérique 0–150 mm', 'قدمة رقمية 0–150 مم'), cat: 'Dimensional', mfr: 'Mitutoyo', model: 'CD-15APX', range: '0–150 mm', res: '0.01 mm', tol: '± 0.02 mm', method: 'Internal', months: 12 },
  { t: S('Outside micrometer 0–25 mm', 'Micromètre d\'extérieur 0–25 mm', 'ميكرومتر خارجي 0–25 مم'), cat: 'Dimensional', mfr: 'Mitutoyo', model: '293-240', range: '0–25 mm', res: '0.001 mm', tol: '± 0.002 mm', method: 'External', months: 12 },
  { t: S('Temperature data logger', 'Enregistreur de température', 'مسجّل بيانات درجة الحرارة'), cat: 'Thermal', mfr: 'Testo', model: '184 T3', range: '−35 to +70 °C', res: '0.1 °C', tol: '± 0.5 °C', method: 'External', months: 12 },
  { t: S('Pressure gauge 0–16 bar', 'Manomètre 0–16 bar', 'مقياس ضغط 0–16 بار'), cat: 'Pressure', mfr: 'WIKA', model: '232.50', range: '0–16 bar', res: '0.2 bar', tol: '± 1 % FS', method: 'External', months: 12 },
  { t: S('Digital multimeter', 'Multimètre numérique', 'متعدد القياس الرقمي'), cat: 'Electrical', mfr: 'Fluke', model: '87V', range: '0–1000 V', res: '0.1 mV', tol: '± 0.05 %', method: 'External', months: 12 },
  { t: S('Precision balance 0–2 kg', 'Balance de précision 0–2 kg', 'ميزان دقيق 0–2 كغ'), cat: 'Mass', mfr: 'Sartorius', model: 'Entris II', range: '0–2 200 g', res: '0.01 g', tol: '± 0.03 g', method: 'External', months: 12 },
  { t: S('Reference test weights (F1 set)', 'Masses étalons (jeu F1)', 'أوزان مرجعية (مجموعة F1)'), cat: 'Mass', mfr: 'Kern', model: '317-03', range: '1 mg–1 kg', res: '—', tol: 'OIML F1', method: 'External', months: 24 },
];
const EQUIPMENT_HSE = [
  { t: S('Sound level meter (class 1)', 'Sonomètre (classe 1)', 'مقياس مستوى الصوت (الفئة 1)'), cat: 'Acoustic', mfr: 'Brüel & Kjær', model: '2250', range: '20–140 dB(A)', res: '0.1 dB', tol: '± 0.7 dB', method: 'External', months: 12 },
  { t: S('Portable 4-gas detector', 'Détecteur 4 gaz portable', 'كاشف غازات محمول رباعي'), cat: 'Gas', mfr: 'Dräger', model: 'X-am 2500', range: 'O₂ / LEL / CO / H₂S', res: '1 ppm', tol: '± 5 %', method: 'Internal', months: 6 },
];
const CAT = {
  Mechanical: S('Mechanical', 'Mécanique', 'ميكانيكي'), Dimensional: S('Dimensional', 'Dimensionnel', 'أبعاد'), Thermal: S('Thermal', 'Thermique', 'حراري'), Pressure: S('Pressure', 'Pression', 'ضغط'),
  Electrical: S('Electrical', 'Électrique', 'كهربائي'), Mass: S('Mass', 'Masse', 'كتلة'), Acoustic: S('Acoustic', 'Acoustique', 'صوتي'), Gas: S('Gas detection', 'Détection de gaz', 'كشف الغاز'),
};
const METHOD = {
  External: S('External — ISO/IEC 17025 accredited laboratory', 'Externe — laboratoire accrédité ISO/IEC 17025', 'خارجي — مختبر معتمد وفق ISO/IEC 17025'),
  Internal: S('Internal — against reference standard, procedure CAL-01', 'Interne — par rapport à un étalon de référence, procédure CAL-01', 'داخلي — مقارنة بمعيار مرجعي، الإجراء CAL-01'),
};
const TRACE = S('Traceable to national standards (SI) through the accredited laboratory certificate', 'Raccordé aux étalons nationaux (SI) via le certificat du laboratoire accrédité', 'قابل للتتبع إلى المعايير الوطنية (SI) عبر شهادة المختبر المعتمد');
const OOT = S('Out of tolerance at last calibration (+6 %). Impact assessment: 37 jobs measured since the previous calibration reviewed; 2 re-checked, no nonconforming output released. Equipment adjusted and re-verified.',
  'Hors tolérance au dernier étalonnage (+6 %). Évaluation de l\'impact : 37 interventions mesurées depuis l\'étalonnage précédent revues ; 2 recontrôlées, aucune sortie non conforme libérée. Équipement ajusté et revérifié.',
  'خارج التفاوت في آخر معايرة (+6 %). تقييم الأثر: مراجعة 37 عملية قياس منذ المعايرة السابقة؛ إعادة فحص اثنتين دون الإفراج عن أي مخرج غير مطابق. تم ضبط المعدة وإعادة التحقق منها.');

const COMPETENCE_REQ = [
  // [competence, role, required level 1-4, criticality, acquired by]
  [S('Internal auditing (ISO 19011)', 'Audit interne (ISO 19011)', 'التدقيق الداخلي (ISO 19011)'), 'audit_manager', 4, 'High', 'Training'],
  [S('Root cause analysis (5 Whys, Ishikawa, 8D)', 'Analyse des causes racines (5 pourquoi, Ishikawa, 8D)', 'تحليل السبب الجذري (لماذا الخمسة، إيشيكاوا، 8D)'), 'quality_manager', 4, 'High', 'Training'],
  [S('Risk assessment (ISO 31000)', 'Évaluation des risques (ISO 31000)', 'تقييم المخاطر (ISO 31000)'), 'risk_manager', 3, 'High', 'Training'],
  [S('Document and record control', 'Maîtrise des documents et enregistrements', 'ضبط الوثائق والسجلات'), 'document_controller', 3, 'Medium', 'On-the-job'],
  [S('KPI analysis and statistical process control', 'Analyse des KPI et maîtrise statistique des procédés', 'تحليل المؤشرات والضبط الإحصائي للعمليات'), 'performance_manager', 3, 'Medium', 'E-learning'],
  [S('Process mapping and BPMN modeling', 'Cartographie des processus et modélisation BPMN', 'رسم خرائط العمليات ونمذجة BPMN'), 'process_excellence_manager', 3, 'Medium', 'Training'],
  [S('Customer requirements review and contract', 'Revue des exigences client et contrat', 'مراجعة متطلبات العملاء والعقود'), 'operations_manager', 3, 'High', 'On-the-job'],
  [S('Measuring equipment handling', 'Utilisation des équipements de mesure', 'استخدام معدات القياس'), 'employee', 2, 'High', 'On-the-job'],
];
const COMPETENCE_HSE = [
  [S('Hazard identification and risk assessment', 'Identification des dangers et évaluation des risques', 'تحديد المخاطر وتقييمها'), 'hse_manager', 4, 'High', 'Training'],
  [S('Emergency response and first aid', 'Intervention d\'urgence et premiers secours', 'الاستجابة للطوارئ والإسعافات الأولية'), 'operations_manager', 3, 'High', 'Training'],
  [S('Environmental aspects evaluation', 'Évaluation des aspects environnementaux', 'تقييم الجوانب البيئية'), 'hse_manager', 3, 'Medium', 'Training'],
];
const ACQUIRED = { Training: S('Formal training', 'Formation formelle', 'تدريب رسمي'), 'On-the-job': S('On-the-job coaching', 'Tutorat au poste', 'تدريب أثناء العمل'), 'E-learning': S('E-learning', 'E-learning', 'تعلم إلكتروني') };
const CRIT = { High: S('High', 'Élevée', 'عالية'), Medium: S('Medium', 'Moyenne', 'متوسطة'), Low: S('Low', 'Faible', 'منخفضة') };

const COURSES = [
  [S('ISO 9001:2015 awareness', 'Sensibilisation ISO 9001:2015', 'التوعية بمعيار ISO 9001:2015'), 'Internal', 3, S('Quiz (10 questions)', 'Quiz (10 questions)', 'اختبار قصير (10 أسئلة)')],
  [S('Internal auditor ISO 19011', 'Auditeur interne ISO 19011', 'مدقق داخلي ISO 19011'), 'External', 21, S('Written exam and witnessed audit', 'Examen écrit et audit observé', 'اختبار كتابي وتدقيق تحت الملاحظة')],
  [S('8D problem solving workshop', 'Atelier de résolution de problèmes 8D', 'ورشة حل المشكلات 8D'), 'Internal', 7, S('Case study graded', 'Étude de cas notée', 'دراسة حالة مقيّمة')],
  [S('Document control in DynamicMS', 'Maîtrise documentaire dans DynamicMS', 'ضبط الوثائق في DynamicMS'), 'E-learning', 2, S('Practical exercise', 'Exercice pratique', 'تمرين تطبيقي')],
  [S('Measuring equipment handling and care', 'Utilisation et entretien des équipements de mesure', 'استخدام معدات القياس والعناية بها'), 'On-the-job', 4, S('Observation at the workstation', 'Observation au poste', 'الملاحظة في موقع العمل')],
];
const COURSES_HSE = [
  [S('First aid at work (SST)', 'Sauveteur secouriste du travail (SST)', 'الإسعافات الأولية في العمل'), 'External', 14, S('Practical certification', 'Certification pratique', 'شهادة عملية')],
  [S('Fire evacuation and extinguisher use', 'Évacuation incendie et manipulation des extincteurs', 'الإخلاء عند الحريق واستخدام الطفايات'), 'Internal', 3, S('Drill observation', 'Observation de l\'exercice', 'ملاحظة التمرين')],
];
const TYPE = { Internal: S('Internal', 'Interne', 'داخلي'), External: S('External', 'Externe', 'خارجي'), 'E-learning': S('E-learning', 'E-learning', 'تعلم إلكتروني'), 'On-the-job': S('On-the-job', 'Au poste', 'أثناء العمل') };

const COMM_PLAN = [
  // topic, purpose, audience, direction, sender role, channel, frequency, record
  [S('Management system policy', 'Politique du système de management', 'سياسة نظام الإدارة'), S('Make the policy known and understood', 'Faire connaître et comprendre la politique', 'التعريف بالسياسة وفهمها'), S('All staff; interested parties on request', 'Tout le personnel ; parties intéressées sur demande', 'جميع العاملين؛ الأطراف المعنية عند الطلب'), 'Internal', 'top_management', S('Display, induction, website', 'Affichage, accueil, site web', 'الملصقات، الاستقبال، الموقع الإلكتروني'), S('At issue and each revision', 'À l\'émission et à chaque révision', 'عند الإصدار وكل مراجعة'), S('Signed attendance list; web page', 'Liste de présence signée ; page web', 'قائمة حضور موقعة؛ صفحة الويب')],
  [S('Objectives and KPI results', 'Objectifs et résultats des KPI', 'الأهداف ونتائج المؤشرات'), S('Share performance and actions', 'Partager la performance et les actions', 'مشاركة الأداء والإجراءات'), S('Managers and teams', 'Encadrement et équipes', 'المديرون والفرق'), 'Internal', 'performance_manager', S('Visual board, team meeting', 'Tableau visuel, réunion d\'équipe', 'لوحة مرئية، اجتماع الفريق'), S('Monthly', 'Mensuelle', 'شهري'), S('Meeting minutes', 'Comptes rendus de réunion', 'محاضر الاجتماعات')],
  [S('Customer complaints and satisfaction', 'Réclamations et satisfaction clients', 'شكاوى العملاء ورضاهم'), S('Respond and keep customers informed', 'Répondre et informer les clients', 'الرد على العملاء وإعلامهم'), S('Customers', 'Clients', 'العملاء'), 'External', 'operations_manager', S('E-mail, phone, survey', 'E-mail, téléphone, enquête', 'البريد الإلكتروني، الهاتف، الاستبيان'), S('Per event; survey twice a year', 'À chaque événement ; enquête semestrielle', 'عند كل حدث؛ استبيان مرتين سنويًا'), S('Complaint file; survey report', 'Dossier de réclamation ; rapport d\'enquête', 'ملف الشكوى؛ تقرير الاستبيان')],
  [S('Internal audit programme and results', 'Programme et résultats d\'audit interne', 'برنامج التدقيق الداخلي ونتائجه'), S('Prepare auditees; share findings', 'Préparer les audités ; partager les constats', 'تحضير الجهات المدققة ومشاركة الملاحظات'), S('Process owners', 'Pilotes de processus', 'مالكو العمليات'), 'Internal', 'audit_manager', S('E-mail and closing meeting', 'E-mail et réunion de clôture', 'البريد الإلكتروني واجتماع الختام'), S('Per audit', 'À chaque audit', 'لكل تدقيق'), S('Audit plan and report', 'Plan et rapport d\'audit', 'خطة التدقيق وتقريره')],
  [S('Supplier requirements and performance', 'Exigences et performance fournisseurs', 'متطلبات الموردين وأداؤهم'), S('Communicate requirements (ISO 9001 §8.4.3) and scorecards', 'Communiquer les exigences (ISO 9001 §8.4.3) et les évaluations', 'إبلاغ المتطلبات (ISO 9001 §8.4.3) وبطاقات الأداء'), S('External providers', 'Prestataires externes', 'مقدمو الخدمات الخارجيون'), 'External', 'quality_manager', S('Purchase order, scorecard e-mail', 'Bon de commande, e-mail d\'évaluation', 'أمر الشراء، بريد بطاقة الأداء'), S('Each order; quarterly scorecard', 'Chaque commande ; évaluation trimestrielle', 'كل طلب؛ بطاقة أداء ربع سنوية'), S('Purchase orders; scorecards', 'Bons de commande ; évaluations', 'أوامر الشراء؛ بطاقات الأداء')],
  [S('Changes to processes and documents', 'Modifications des processus et documents', 'تغييرات العمليات والوثائق'), S('Inform users before a change takes effect', 'Informer les utilisateurs avant l\'entrée en vigueur', 'إعلام المستخدمين قبل سريان التغيير'), S('Users of the document', 'Utilisateurs du document', 'مستخدمو الوثيقة'), 'Internal', 'document_controller', S('Notification in the application', 'Notification dans l\'application', 'إشعار في التطبيق'), S('Per change', 'À chaque modification', 'لكل تغيير'), S('Read receipts', 'Accusés de lecture', 'إشعارات القراءة')],
  [S('Management review outputs', 'Éléments de sortie de la revue de direction', 'مخرجات مراجعة الإدارة'), S('Share decisions and resources', 'Partager décisions et ressources', 'مشاركة القرارات والموارد'), S('Managers', 'Encadrement', 'المديرون'), 'Internal', 'ims_manager', S('Minutes and briefing', 'Compte rendu et briefing', 'المحضر والإحاطة'), S('Twice a year', 'Semestrielle', 'مرتين سنويًا'), S('Signed minutes', 'Compte rendu signé', 'محضر موقع')],
];
const COMM_PLAN_HSE = [
  [S('Hazards, incidents and safety alerts', 'Dangers, incidents et alertes sécurité', 'المخاطر والحوادث وتنبيهات السلامة'), S('Consult and inform workers (ISO 45001 §5.4)', 'Consulter et informer les travailleurs (ISO 45001 §5.4)', 'استشارة العاملين وإعلامهم (ISO 45001 §5.4)'), S('Workers and representatives', 'Travailleurs et représentants', 'العاملون وممثلوهم'), 'Internal', 'hse_manager', S('Toolbox talk, OH&S committee', 'Quart d\'heure sécurité, comité SST', 'حديث السلامة، لجنة الصحة والسلامة'), S('Weekly; committee quarterly', 'Hebdomadaire ; comité trimestriel', 'أسبوعي؛ اللجنة كل ربع سنة'), S('Attendance sheets; minutes', 'Feuilles de présence ; comptes rendus', 'أوراق الحضور؛ المحاضر')],
  [S('Environmental reporting to authorities', 'Déclarations environnementales aux autorités', 'التقارير البيئية للسلطات'), S('Fulfil reporting obligations', 'Respecter les obligations déclaratives', 'الوفاء بالتزامات الإبلاغ'), S('Environmental authority', 'Autorité environnementale', 'السلطة البيئية'), 'External', 'hse_manager', S('Official portal', 'Portail officiel', 'البوابة الرسمية'), S('Annual', 'Annuelle', 'سنوي'), S('Submission receipt', 'Accusé de dépôt', 'إيصال الإيداع')],
];
const DIR = { Internal: S('Internal', 'Interne', 'داخلي'), External: S('External', 'Externe', 'خارجي') };

const CHANGES = [
  // title, type, reason, impacted, L, I, resources
  [S('New quotation template with second check', 'Nouveau modèle de devis avec double contrôle', 'نموذج عرض أسعار جديد مع مراجعة ثانية'), 'Process', S('Quote errors found in two customer complaints', 'Erreurs de devis relevées dans deux réclamations clients', 'أخطاء في عروض الأسعار ظهرت في شكويين من العملاء'), S('Sales and quotation process; form FRM-SAL-02', 'Processus commercial et devis ; formulaire FRM-SAL-02', 'عملية المبيعات وعروض الأسعار؛ النموذج FRM-SAL-02'), 2, 3, S('4 h training for 3 sales staff', '4 h de formation pour 3 commerciaux', '4 ساعات تدريب لثلاثة موظفي مبيعات')],
  [S('Replace the job sheet with a tablet form', 'Remplacer la fiche d\'intervention par un formulaire sur tablette', 'استبدال بطاقة العمل بنموذج على الجهاز اللوحي'), 'IT / system', S('Unsigned job sheets (nonconformity) and late invoicing', 'Fiches non signées (non-conformité) et facturation tardive', 'بطاقات غير موقعة (عدم مطابقة) وتأخر الفوترة'), S('{0}; invoicing; records control', '{0} ; facturation ; maîtrise des enregistrements', '{0}؛ الفوترة؛ ضبط السجلات'), 3, 3, S('6 tablets; 2 days of configuration', '6 tablettes ; 2 jours de paramétrage', '6 أجهزة لوحية؛ يومان من الإعداد')],
  [S('Change of the calibration laboratory', 'Changement de laboratoire d\'étalonnage', 'تغيير مختبر المعايرة'), 'Supplier', S('Previous laboratory lost its ISO/IEC 17025 scope for torque', 'L\'ancien laboratoire a perdu sa portée ISO/IEC 17025 en couple', 'فقد المختبر السابق نطاق اعتماده ISO/IEC 17025 للعزم'), S('Measuring equipment register; supplier list', 'Registre des équipements de mesure ; liste fournisseurs', 'سجل معدات القياس؛ قائمة الموردين'), 2, 4, S('Supplier evaluation; new contract', 'Évaluation fournisseur ; nouveau contrat', 'تقييم المورد؛ عقد جديد')],
  [S('New organization chart: quality and HSE merged', 'Nouvel organigramme : fusion qualité et HSE', 'هيكل تنظيمي جديد: دمج الجودة والصحة والسلامة والبيئة'), 'Organizational', S('Integrated management system and SME resources', 'Système de management intégré et ressources de PME', 'نظام الإدارة المتكامل وموارد المؤسسة الصغيرة'), S('Roles and responsibilities; RACSI; job descriptions', 'Rôles et responsabilités ; RACSI ; fiches de poste', 'الأدوار والمسؤوليات؛ RACSI؛ الأوصاف الوظيفية'), 2, 4, S('Updated job descriptions; communication', 'Fiches de poste mises à jour ; communication', 'تحديث الأوصاف الوظيفية؛ التواصل')],
  [S('Update of the procedure for handling complaints', 'Mise à jour de la procédure de traitement des réclamations', 'تحديث إجراء معالجة الشكاوى'), 'Document', S('Response time target changed to 48 h', 'Délai de réponse cible passé à 48 h', 'تغيير هدف زمن الاستجابة إلى 48 ساعة'), S('Customer communication; KPI Q-KPI-01', 'Communication client ; KPI Q-KPI-01', 'التواصل مع العملاء؛ المؤشر Q-KPI-01'), 1, 3, S('Revision of the procedure; briefing', 'Révision de la procédure ; briefing', 'مراجعة الإجراء؛ إحاطة')],
  [S('New customer contract clause on warranty', 'Nouvelle clause contractuelle client sur la garantie', 'بند تعاقدي جديد للعميل بشأن الضمان'), 'Product / service', S('Key customer request', 'Demande d\'un client clé', 'طلب عميل رئيسي'), S('Requirements review; after-sales service', 'Revue des exigences ; service après-vente', 'مراجعة المتطلبات؛ خدمة ما بعد البيع'), 3, 2, S('Legal review', 'Revue juridique', 'مراجعة قانونية')],
];
const CHANGE_TYPE = { Process: S('Process', 'Processus', 'عملية'), 'IT / system': S('IT / system', 'SI / système', 'نظم المعلومات'), Supplier: S('Supplier', 'Fournisseur', 'مورد'), Organizational: S('Organizational', 'Organisationnel', 'تنظيمي'), Document: S('Document', 'Document', 'وثيقة'), 'Product / service': S('Product / service', 'Produit / service', 'منتج / خدمة') };
const CHANGE_VERIF = S('Effectiveness checked 30 days after implementation: no recurrence; KPI stable or improved.', 'Efficacité vérifiée 30 jours après la mise en œuvre : pas de récurrence ; KPI stable ou amélioré.', 'تم التحقق من الفعالية بعد 30 يومًا من التنفيذ: لا تكرار؛ المؤشر مستقر أو تحسّن.');

const OBLIGATIONS = [
  // title, type, authority, reference, applicability, requirement, how complied, owner, frequency (months)
  [S('Consumer protection law', 'Loi sur la protection du consommateur', 'قانون حماية المستهلك'), 'Law', S('Ministry of Trade', 'Ministère du Commerce', 'وزارة التجارة'), S('Law 31-08, art. 3–10', 'Loi 31-08, art. 3–10', 'القانون 31-08، المواد 3–10'), S('Quotes, invoices, warranty', 'Devis, factures, garantie', 'عروض الأسعار والفواتير والضمان'), S('Clear pre-contract information, price display, legal warranty', 'Information précontractuelle claire, affichage des prix, garantie légale', 'معلومات واضحة قبل التعاقد، إعلان الأسعار، الضمان القانوني'), S('Quotation template and general terms reviewed by legal counsel', 'Modèle de devis et CGV revus par le conseil juridique', 'نموذج العروض والشروط العامة مراجعة من المستشار القانوني'), 'compliance_officer', 12],
  [S('Personal data protection law', 'Loi sur la protection des données personnelles', 'قانون حماية المعطيات الشخصية'), 'Law', S('Data protection authority', 'Autorité de protection des données', 'هيئة حماية المعطيات'), S('Law 09-08; GDPR where EU customers', 'Loi 09-08 ; RGPD pour les clients UE', 'القانون 09-08؛ اللائحة الأوروبية للعملاء الأوروبيين'), S('Customer and employee data', 'Données clients et salariés', 'بيانات العملاء والعاملين'), S('Declared processing, consent, security, retention limits', 'Traitements déclarés, consentement, sécurité, durées de conservation', 'تصريح بالمعالجات، الموافقة، الأمن، حدود الاحتفاظ'), S('Processing register; access rights reviewed twice a year', 'Registre des traitements ; droits d\'accès revus semestriellement', 'سجل المعالجات؛ مراجعة صلاحيات الوصول مرتين سنويًا'), 'it_manager', 12],
  [S('Labour code — working time and contracts', 'Code du travail — durée du travail et contrats', 'مدونة الشغل — مدة العمل والعقود'), 'Law', S('Labour inspection', 'Inspection du travail', 'مفتشية الشغل'), S('Labour code, book II', 'Code du travail, livre II', 'مدونة الشغل، الكتاب الثاني'), S('All employees', 'Tous les salariés', 'جميع العاملين'), S('Written contracts, working hours, overtime records', 'Contrats écrits, horaires, registre des heures supplémentaires', 'عقود مكتوبة، ساعات العمل، سجل الساعات الإضافية'), S('HR files audited annually', 'Dossiers RH audités annuellement', 'تدقيق ملفات الموارد البشرية سنويًا'), 'hr_manager', 12],
  [S('Fire safety regulation for workplaces', 'Réglementation incendie des lieux de travail', 'تنظيم السلامة من الحريق في أماكن العمل'), 'Regulation', S('Civil protection', 'Protection civile', 'الوقاية المدنية'), S('Decree on fire prevention in public buildings', 'Décret relatif à la prévention incendie', 'مرسوم الوقاية من الحريق'), S('Offices and workshop', 'Bureaux et atelier', 'المكاتب والورشة'), S('Extinguishers inspected yearly, exits marked, evacuation drill', 'Extincteurs vérifiés annuellement, issues balisées, exercice d\'évacuation', 'فحص الطفايات سنويًا، تعليم المخارج، تمرين الإخلاء'), S('Maintenance contract; drill report', 'Contrat de maintenance ; rapport d\'exercice', 'عقد الصيانة؛ تقرير التمرين'), 'operations_manager', 12],
  [S('Key customer contract — quality clauses', 'Contrat client clé — clauses qualité', 'عقد العميل الرئيسي — بنود الجودة'), 'Contract', S('Key customer', 'Client clé', 'العميل الرئيسي'), S('Framework agreement, annex Q', 'Accord-cadre, annexe Q', 'الاتفاقية الإطارية، الملحق Q'), S('Services delivered to the customer', 'Services fournis au client', 'الخدمات المقدمة للعميل'), S('Response within 48 h, monthly quality report, 12-month warranty', 'Réponse sous 48 h, rapport qualité mensuel, garantie 12 mois', 'الرد خلال 48 ساعة، تقرير جودة شهري، ضمان 12 شهرًا'), S('KPI dashboard and monthly report', 'Tableau de bord KPI et rapport mensuel', 'لوحة المؤشرات والتقرير الشهري'), 'operations_manager', 6],
  [S('Professional liability insurance', 'Assurance responsabilité civile professionnelle', 'تأمين المسؤولية المهنية'), 'Other', S('Insurer', 'Assureur', 'شركة التأمين'), S('Policy RC-PRO', 'Police RC-PRO', 'بوليصة المسؤولية المهنية'), S('All services', 'Tous les services', 'جميع الخدمات'), S('Valid certificate; declared activities up to date', 'Attestation valide ; activités déclarées à jour', 'شهادة سارية؛ الأنشطة المصرح بها محدثة'), S('Annual renewal checked by finance', 'Renouvellement annuel vérifié par la finance', 'تجديد سنوي تتحقق منه المالية'), 'finance_manager', 12],
];
const OBLIGATIONS_HSE = [
  [S('Labour code — occupational health and safety', 'Code du travail — santé et sécurité au travail', 'مدونة الشغل — الصحة والسلامة المهنية'), 'Law', S('Labour inspection', 'Inspection du travail', 'مفتشية الشغل'), S('Labour code, book II, title IV', 'Code du travail, livre II, titre IV', 'مدونة الشغل، الكتاب الثاني، الباب الرابع'), S('All activities', 'Toutes les activités', 'جميع الأنشطة'), S('Risk assessment, PPE, OH&S committee, occupational physician', 'Évaluation des risques, EPI, comité SST, médecin du travail', 'تقييم المخاطر، معدات الوقاية، لجنة السلامة، طبيب الشغل'), S('HIRA; committee minutes; medical visits', 'DUER ; comptes rendus du comité ; visites médicales', 'تقييم المخاطر؛ محاضر اللجنة؛ الزيارات الطبية'), 'hse_manager', 6],
  [S('Environmental permit — emissions and wastewater', 'Autorisation environnementale — émissions et rejets', 'الترخيص البيئي — الانبعاثات والمياه العادمة'), 'Permit', S('Environmental authority', 'Autorité environnementale', 'السلطة البيئية'), S('Permit n° ENV-2024-117, art. 5–9', 'Autorisation n° ENV-2024-117, art. 5–9', 'الترخيص رقم ENV-2024-117، المواد 5–9'), S('Site', 'Site', 'الموقع'), S('Limit values, twice-yearly measurements, annual report', 'Valeurs limites, mesures semestrielles, rapport annuel', 'القيم الحدية، قياسات نصف سنوية، تقرير سنوي'), S('Accredited laboratory measurements', 'Mesures par laboratoire accrédité', 'قياسات من مختبر معتمد'), 'hse_manager', 6],
  [S('Hazardous waste regulation', 'Réglementation des déchets dangereux', 'تنظيم النفايات الخطرة'), 'Regulation', S('Environmental authority', 'Autorité environnementale', 'السلطة البيئية'), S('Law 28-00 and decrees', 'Loi 28-00 et décrets', 'القانون 28-00 والمراسيم'), S('Oils, solvents, batteries', 'Huiles, solvants, batteries', 'الزيوت والمذيبات والبطاريات'), S('Licensed carrier, waste tracking notes, storage on retention', 'Transporteur agréé, bordereaux de suivi, stockage sur rétention', 'ناقل مرخص، وثائق تتبع، تخزين مع حاجز احتواء'), S('Waste register and tracking notes', 'Registre des déchets et bordereaux', 'سجل النفايات ووثائق التتبع'), 'hse_manager', 6],
];
const OBL_TYPE = { Law: S('Law', 'Loi', 'قانون'), Regulation: S('Regulation', 'Règlement', 'تنظيم'), Contract: S('Contract', 'Contrat', 'عقد'), Other: S('Other requirement', 'Autre exigence', 'متطلب آخر'), Permit: S('Permit', 'Autorisation', 'ترخيص'), Standard: S('Standard', 'Norme', 'معيار') };
const EVAL = { C: S('Compliant', 'Conforme', 'مطابق'), P: S('Partially compliant', 'Partiellement conforme', 'مطابق جزئيًا'), N: S('Non-compliant', 'Non conforme', 'غير مطابق') };

const CONTROL_PLAN = [
  // operation, characteristic, product|process, class, spec, method, sample, frequency, control, record, reaction
  [S('Customer request intake', 'Réception de la demande client', 'استلام طلب العميل'), S('Request completeness', 'Complétude de la demande', 'اكتمال الطلب'), 'Process', 'Major', S('All mandatory fields filled', 'Tous les champs obligatoires renseignés', 'تعبئة جميع الحقول الإلزامية'), S('Checklist in the application', 'Liste de contrôle dans l\'application', 'قائمة تحقق في التطبيق'), '100 %', S('Each request', 'Chaque demande', 'كل طلب'), S('Mandatory fields block', 'Blocage des champs obligatoires', 'منع الحفظ دون الحقول الإلزامية'), S('Request record', 'Enregistrement de la demande', 'سجل الطلب'), S('Call the customer back within 24 h', 'Rappeler le client sous 24 h', 'معاودة الاتصال بالعميل خلال 24 ساعة')],
  [S('Quotation', 'Devis', 'عرض السعر'), S('Price and scope accuracy', 'Exactitude du prix et du périmètre', 'دقة السعر والنطاق'), 'Process', 'Critical', S('Second check by a peer before sending', 'Double contrôle par un pair avant envoi', 'مراجعة ثانية من زميل قبل الإرسال'), S('Peer review against price list', 'Revue par un pair selon la grille tarifaire', 'مراجعة الزميل مقابل قائمة الأسعار'), '100 %', S('Each quote', 'Chaque devis', 'كل عرض'), S('Four-eyes approval', 'Validation à quatre yeux', 'اعتماد مزدوج'), S('Quote with approver', 'Devis avec approbateur', 'العرض مع المعتمد'), S('Correct and resend; log quote error', 'Corriger et renvoyer ; tracer l\'erreur', 'التصحيح وإعادة الإرسال؛ تسجيل الخطأ')],
  [S('Material and parts reception', 'Réception des matériels et pièces', 'استلام المواد والقطع'), S('Conformity to order', 'Conformité à la commande', 'المطابقة لأمر الشراء'), 'Product', 'Major', S('Reference, quantity, no visible damage, certificate', 'Référence, quantité, aucun dommage visible, certificat', 'المرجع والكمية وعدم وجود تلف ظاهر والشهادة'), S('Visual and document check', 'Contrôle visuel et documentaire', 'فحص بصري ووثائقي'), S('Each delivery', 'Chaque livraison', 'كل توريد'), S('Each delivery', 'Chaque livraison', 'كل توريد'), S('Reception checklist', 'Liste de contrôle de réception', 'قائمة فحص الاستلام'), S('Delivery note signed', 'Bon de livraison signé', 'إيصال التسليم موقع'), S('Quarantine; supplier claim', 'Quarantaine ; réclamation fournisseur', 'العزل؛ مطالبة المورد')],
  [S('{0} — execution', '{0} — exécution', '{0} — التنفيذ'), S('Critical parameter within tolerance', 'Paramètre critique dans la tolérance', 'المعامل الحرج ضمن التفاوت'), 'Process', 'Critical', S('As per technical specification', 'Selon la spécification technique', 'وفق المواصفة الفنية'), S('Calibrated measuring equipment', 'Équipement de mesure étalonné', 'معدات قياس معايرة'), S('1 per job', '1 par intervention', 'واحد لكل عملية'), S('Each job', 'Chaque intervention', 'كل عملية'), S('Measurement recorded on the job form', 'Mesure enregistrée sur la fiche', 'تسجيل القياس في بطاقة العمل'), S('Job form', 'Fiche d\'intervention', 'بطاقة العمل'), S('Stop, adjust, re-measure; open a nonconformity', 'Arrêter, ajuster, remesurer ; ouvrir une non-conformité', 'التوقف والضبط وإعادة القياس؛ فتح حالة عدم مطابقة')],
  [S('{0} — final test', '{0} — essai final', '{0} — الاختبار النهائي'), S('Function and safety', 'Fonctionnement et sécurité', 'الوظيفة والسلامة'), 'Product', 'Critical', S('Test protocol passed; no safety defect', 'Protocole d\'essai réussi ; aucun défaut de sécurité', 'نجاح بروتوكول الاختبار؛ لا عيب في السلامة'), S('Functional test with the customer', 'Essai fonctionnel avec le client', 'اختبار وظيفي مع العميل'), '100 %', S('Each job', 'Chaque intervention', 'كل عملية'), S('Release by an authorized person (§8.6)', 'Libération par une personne autorisée (§8.6)', 'الإفراج من شخص مخول (§8.6)'), S('Signed job sheet', 'Fiche signée', 'بطاقة عمل موقعة'), S('Do not release; rework and re-test', 'Ne pas libérer ; reprendre et réessayer', 'عدم الإفراج؛ إعادة العمل والاختبار')],
  [S('Invoicing', 'Facturation', 'الفوترة'), S('Invoice matches the accepted quote', 'Facture conforme au devis accepté', 'مطابقة الفاتورة للعرض المقبول'), 'Process', 'Minor', S('No difference', 'Aucun écart', 'لا فرق'), S('Automatic comparison in the ERP', 'Comparaison automatique dans l\'ERP', 'مقارنة آلية في نظام تخطيط الموارد'), '100 %', S('Each invoice', 'Chaque facture', 'كل فاتورة'), S('Blocking rule', 'Règle bloquante', 'قاعدة مانعة'), S('Invoice', 'Facture', 'الفاتورة'), S('Credit note and root cause', 'Avoir et cause racine', 'إشعار دائن وتحليل السبب')],
  [S('Customer feedback', 'Retour client', 'ملاحظات العميل'), S('Satisfaction score', 'Note de satisfaction', 'درجة الرضا'), 'Process', 'Major', S('≥ 4.3 / 5', '≥ 4,3 / 5', '≥ 4.3 / 5'), S('Survey', 'Enquête', 'استبيان'), S('All customers', 'Tous les clients', 'جميع العملاء'), S('Semi-annual', 'Semestrielle', 'نصف سنوي'), S('KPI Q-KPI-01 alert', 'Alerte KPI Q-KPI-01', 'تنبيه المؤشر Q-KPI-01'), S('Survey report', 'Rapport d\'enquête', 'تقرير الاستبيان'), S('Action plan reviewed at the management review', 'Plan d\'actions revu en revue de direction', 'خطة عمل تُراجع في مراجعة الإدارة')],
];
const CHAR = { Product: S('Product', 'Produit', 'منتج'), Process: S('Process', 'Processus', 'عملية') };
const CLASS = { Critical: S('Critical (CC)', 'Critique (CC)', 'حرج (CC)'), Major: S('Major (SC)', 'Majeure (SC)', 'رئيسي (SC)'), Minor: S('Minor', 'Mineure', 'ثانوي') };

const SUPPLIER_CAT = [S('Raw materials and parts', 'Matières et pièces', 'المواد والقطع'), S('Raw materials and parts', 'Matières et pièces', 'المواد والقطع'), S('Packaging', 'Emballage', 'التغليف'), S('Transport and logistics', 'Transport et logistique', 'النقل واللوجستيك'), S('Calibration services', 'Services d\'étalonnage', 'خدمات المعايرة')];
const CERTS = ['ISO 9001', 'ISO 9001', '—', 'ISO 9001, ISO 14001', 'ISO/IEC 17025'];

const REQ_REVIEW = [
  [S('Annual maintenance contract', 'Contrat de maintenance annuel', 'عقد صيانة سنوي'), 'Contract'], [S('Quote — installation of equipment', 'Devis — installation d\'équipement', 'عرض — تركيب معدات'), 'Quote'],
  [S('Order — urgent repair', 'Commande — réparation urgente', 'طلب — إصلاح عاجل'), 'Order'], [S('Amendment — additional site', 'Avenant — site supplémentaire', 'ملحق — موقع إضافي'), 'Amendment'],
  [S('Quote — preventive maintenance', 'Devis — maintenance préventive', 'عرض — صيانة وقائية'), 'Quote'],
];
const REQ_TYPE = { Contract: S('Contract', 'Contrat', 'عقد'), Quote: S('Quote', 'Devis', 'عرض سعر'), Order: S('Order', 'Commande', 'طلب'), Amendment: S('Amendment', 'Avenant', 'ملحق') };
const REQ_TEXT = S('Specified: scope, lead time, price. Not stated but necessary: access to site, safety induction. Legal: warranty, consumer information. {0}: {1}.', 'Spécifiées : périmètre, délai, prix. Non formulées mais nécessaires : accès au site, accueil sécurité. Légales : garantie, information du consommateur. {0} : {1}.', 'محددة: النطاق والمدة والسعر. غير مصرح بها لكن ضرورية: الوصول إلى الموقع والتعريف بالسلامة. قانونية: الضمان وإعلام المستهلك. {0}: {1}.');
const DECISION = { Accept: S('Accepted', 'Acceptée', 'مقبول'), Conditional: S('Accepted with conditions', 'Acceptée sous conditions', 'مقبول بشروط'), Decline: S('Declined', 'Refusée', 'مرفوض') };

const CAPA_TEXT = {
  where: S('{0}', '{0}', '{0}'),
  howDetected: S('Detected at final check and confirmed by the customer', 'Détecté au contrôle final et confirmé par le client', 'اكتُشف في الفحص النهائي وأكده العميل'),
  why: S('Requirement not met; risk of customer dissatisfaction and cost of rework', 'Exigence non satisfaite ; risque d\'insatisfaction client et coût de reprise', 'متطلب غير مستوفى؛ خطر عدم رضا العميل وتكلفة إعادة العمل'),
  containment: [
    S('Stop and quarantine the affected outputs; 100 % check of work in progress', 'Arrêter et isoler les sorties concernées ; contrôle à 100 % des en-cours', 'إيقاف وعزل المخرجات المعنية؛ فحص 100 % للأعمال الجارية'),
    S('Inform the customer and agree on the correction', 'Informer le client et convenir de la correction', 'إبلاغ العميل والاتفاق على التصحيح'),
  ],
  ishikawa: {
    man: S('New technician not yet qualified on the task', 'Technicien nouveau non encore qualifié sur la tâche', 'فني جديد غير مؤهل بعد للمهمة'),
    method: S('Instruction did not include the final check', 'L\'instruction n\'incluait pas le contrôle final', 'لم تتضمن التعليمات الفحص النهائي'),
    machine: S('No machine cause found', 'Aucune cause machine identifiée', 'لم يُحدد سبب متعلق بالآلة'),
    material: S('Parts conforming (certificates checked)', 'Pièces conformes (certificats vérifiés)', 'القطع مطابقة (تم التحقق من الشهادات)'),
    measurement: S('Check performed but not recorded', 'Contrôle réalisé mais non enregistré', 'أجري الفحص لكن لم يُسجَّل'),
    environment: S('Time pressure on urgent jobs', 'Pression du temps sur les urgences', 'ضغط الوقت في الأعمال العاجلة'),
  },
  whys: [
    S('Why did the defect reach the customer? The final check was not performed.', 'Pourquoi le défaut est-il arrivé chez le client ? Le contrôle final n\'a pas été réalisé.', 'لماذا وصل العيب إلى العميل؟ لم يُجرَ الفحص النهائي.'),
    S('Why was the final check not performed? It was not in the work instruction.', 'Pourquoi le contrôle final n\'a-t-il pas été réalisé ? Il ne figurait pas dans l\'instruction.', 'لماذا لم يُجرَ الفحص النهائي؟ لم يكن مذكورًا في التعليمات.'),
    S('Why was it not in the instruction? The instruction was written before the new service line.', 'Pourquoi n\'y figurait-il pas ? L\'instruction datait d\'avant la nouvelle offre.', 'لماذا لم يكن مذكورًا؟ كُتبت التعليمات قبل خط الخدمة الجديد.'),
    S('Why was it not updated? Changes to services did not trigger a document review.', 'Pourquoi n\'a-t-elle pas été mise à jour ? Les changements de services ne déclenchaient pas de revue documentaire.', 'لماذا لم تُحدَّث؟ لم تكن تغييرات الخدمات تستدعي مراجعة الوثائق.'),
    S('Why? The change management process did not list documents to update.', 'Pourquoi ? Le processus de gestion des changements ne listait pas les documents à mettre à jour.', 'لماذا؟ لم تتضمن عملية إدارة التغيير قائمة الوثائق الواجب تحديثها.'),
  ],
  root: S('Occurrence: work instruction without final check. Non-detection: change management did not trigger a document review.', 'Apparition : instruction de travail sans contrôle final. Non-détection : la gestion des changements ne déclenchait pas de revue documentaire.', 'الحدوث: تعليمات عمل دون فحص نهائي. عدم الاكتشاف: لم تستدعِ إدارة التغيير مراجعة الوثائق.'),
  corrective: [
    [S('Add the final check with acceptance criteria to the work instruction', 'Ajouter le contrôle final et ses critères d\'acceptation à l\'instruction', 'إضافة الفحص النهائي ومعايير القبول إلى التعليمات'), S('Instruction v2 published; 5 jobs audited', 'Instruction v2 publiée ; 5 interventions auditées', 'نشر الإصدار 2 من التعليمات؛ تدقيق 5 عمليات')],
    [S('Add "documents to update" to the change request form', 'Ajouter « documents à mettre à jour » au formulaire de changement', 'إضافة "الوثائق الواجب تحديثها" إلى نموذج طلب التغيير'), S('Form updated; next 3 changes checked', 'Formulaire mis à jour ; 3 changements suivants vérifiés', 'تحديث النموذج؛ التحقق من التغييرات الثلاثة التالية')],
    [S('Qualify the new technician on the task (supervised jobs)', 'Qualifier le nouveau technicien sur la tâche (interventions supervisées)', 'تأهيل الفني الجديد على المهمة (عمليات تحت الإشراف)'), S('Competence matrix updated to level 3', 'Matrice des compétences mise à jour au niveau 3', 'تحديث مصفوفة الكفاءات إلى المستوى 3')],
  ],
  validation: S('No recurrence over 3 months (0 of 120 jobs); customer confirmed satisfaction.', 'Aucune récurrence sur 3 mois (0 sur 120 interventions) ; satisfaction confirmée par le client.', 'لا تكرار خلال 3 أشهر (0 من 120 عملية)؛ أكد العميل رضاه.'),
  prevention: [
    S('Review the other work instructions for the same gap (horizontal deployment)', 'Revoir les autres instructions pour la même lacune (déploiement horizontal)', 'مراجعة التعليمات الأخرى بحثًا عن الثغرة نفسها (التعميم الأفقي)'),
    S('Update the risk register and the control plan', 'Mettre à jour le registre des risques et le plan de surveillance', 'تحديث سجل المخاطر وخطة الضبط'),
    S('Share the lesson learned in the knowledge base', 'Partager l\'enseignement dans la base de connaissances', 'مشاركة الدرس المستفاد في قاعدة المعرفة'),
  ],
  lessons: S('Every change to a service must list the documents and trainings to update before release.', 'Tout changement de service doit lister les documents et formations à mettre à jour avant mise en œuvre.', 'يجب أن يتضمن كل تغيير في الخدمة قائمة الوثائق والتدريبات الواجب تحديثها قبل التنفيذ.'),
};
const DISPOSITION = { Rework: S('Rework', 'Reprise', 'إعادة العمل'), Repair: S('Repair', 'Réparation', 'إصلاح'), Concession: S('Use as is (concession)', 'Utilisation en l\'état (dérogation)', 'الاستخدام كما هو (تنازل)'), Scrap: S('Scrap', 'Rebut', 'إتلاف'), Return: S('Return to supplier', 'Retour fournisseur', 'إرجاع إلى المورد') };

// Details of audit findings, by clause: requirement, objective evidence and correction.
export const FINDING_DETAIL = {
  '7.5.3': { req: S('Documented information shall be controlled: identification, review and approval, revision status (ISO 9001 §7.5.2, §7.5.3).', 'Les informations documentées doivent être maîtrisées : identification, revue et approbation, statut de révision (ISO 9001 §7.5.2, §7.5.3).', 'يجب ضبط المعلومات الموثقة: التعريف والمراجعة والاعتماد وحالة المراجعة (ISO 9001 §7.5.2، §7.5.3).'), ev: S('Work instruction and inspection form at the workstation printed without version or date; master list shows version 2.', 'Instruction de travail et fiche de contrôle au poste imprimées sans version ni date ; la liste maîtresse indique la version 2.', 'تعليمات العمل ونموذج الفحص في موقع العمل مطبوعان دون إصدار أو تاريخ؛ القائمة الرئيسية تشير إلى الإصدار 2.'), area: S('Operations', 'Opérations', 'العمليات') },
  '8.5.1': { req: S('Production and service provision shall be carried out under controlled conditions, including monitoring at appropriate stages (ISO 9001 §8.5.1).', 'La production et la prestation de service doivent être réalisées dans des conditions maîtrisées, y compris la surveillance aux étapes appropriées (ISO 9001 §8.5.1).', 'يجب تنفيذ الإنتاج وتقديم الخدمة في ظروف مضبوطة تشمل المراقبة في المراحل المناسبة (ISO 9001 §8.5.1).'), ev: S('Control plan revision 1 does not include the new test step added in March; 3 job records without the test result.', 'Le plan de surveillance rév. 1 n\'inclut pas la nouvelle étape d\'essai ajoutée en mars ; 3 fiches sans résultat d\'essai.', 'خطة الضبط (المراجعة 1) لا تتضمن خطوة الاختبار الجديدة المضافة في مارس؛ 3 سجلات دون نتيجة الاختبار.'), area: S('Operations', 'Opérations', 'العمليات') },
  '9.1.3': { req: S('The organization shall analyse and evaluate data from monitoring and measurement (ISO 9001 §9.1.3).', 'L\'organisme doit analyser et évaluer les données issues de la surveillance et de la mesure (ISO 9001 §9.1.3).', 'يجب على المؤسسة تحليل وتقييم بيانات المراقبة والقياس (ISO 9001 §9.1.3).'), ev: S('KPI dashboard values present for June and July but no analysis or comment on the two off-target indicators.', 'Valeurs du tableau de bord présentes pour juin et juillet mais aucune analyse sur les deux indicateurs hors cible.', 'قيم لوحة المؤشرات متوفرة ليونيو ويوليو دون تحليل للمؤشرين خارج المستهدف.'), area: S('Performance', 'Performance', 'الأداء') },
  '7.2': { req: S('Persons doing work under the organization\'s control shall be competent; evidence shall be retained (ISO 9001 §7.2).', 'Les personnes effectuant un travail sous le contrôle de l\'organisme doivent être compétentes ; des preuves doivent être conservées (ISO 9001 §7.2).', 'يجب أن يكون الأشخاص العاملون تحت سيطرة المؤسسة أكفاء مع الاحتفاظ بالأدلة (ISO 9001 §7.2).'), ev: S('One internal auditor listed in the programme has no training certificate or witnessed audit on file.', 'Un auditeur interne du programme n\'a ni certificat de formation ni audit observé au dossier.', 'أحد المدققين الداخليين في البرنامج لا يملك شهادة تدريب أو تدقيقًا تحت الملاحظة في ملفه.'), area: S('Human resources', 'Ressources humaines', 'الموارد البشرية') },
  '10.2': { req: S('The organization shall determine the causes of the nonconformity and take action to eliminate them (ISO 9001 §10.2.1 b, c).', 'L\'organisme doit déterminer les causes de la non-conformité et agir pour les éliminer (ISO 9001 §10.2.1 b, c).', 'يجب على المؤسسة تحديد أسباب عدم المطابقة واتخاذ إجراءات لإزالتها (ISO 9001 §10.2.1 ب، ج).'), ev: S('Two closed nonconformities show a single "why" and a correction only; no corrective action or effectiveness check.', 'Deux non-conformités clôturées montrent un seul « pourquoi » et une simple correction ; ni action corrective ni vérification d\'efficacité.', 'حالتا عدم مطابقة مغلقتان تُظهران "لماذا" واحدة وتصحيحًا فقط دون إجراء تصحيحي أو تحقق من الفعالية.'), area: S('Quality', 'Qualité', 'الجودة') },
  '8.4.1': { req: S('Criteria for evaluation, selection, monitoring of performance and re-evaluation of external providers shall be applied (ISO 9001 §8.4.1).', 'Des critères d\'évaluation, de sélection, de surveillance des performances et de réévaluation des prestataires externes doivent être appliqués (ISO 9001 §8.4.1).', 'يجب تطبيق معايير لتقييم مقدمي الخدمات الخارجيين واختيارهم ومراقبة أدائهم وإعادة تقييمهم (ISO 9001 §8.4.1).'), ev: S('Supplier scorecard for the main supplier rated "delivery" without any delivery data for the period.', 'Évaluation du fournisseur principal notée sur la « livraison » sans données de livraison pour la période.', 'تم تقييم "التسليم" للمورد الرئيسي دون بيانات تسليم للفترة.'), area: S('Purchasing', 'Achats', 'المشتريات') },
  '6.1.2': { req: S('Hazard identification shall be ongoing and proactive, including when changes occur (ISO 45001 §6.1.2.1).', 'L\'identification des dangers doit être continue et proactive, y compris lors de changements (ISO 45001 §6.1.2.1).', 'يجب أن يكون تحديد المخاطر مستمرًا واستباقيًا بما في ذلك عند حدوث تغييرات (ISO 45001 §6.1.2.1).'), ev: S('New equipment installed in May; HIRA last revised in January.', 'Nouvel équipement installé en mai ; DUER révisé en janvier.', 'تركيب معدات جديدة في مايو؛ آخر مراجعة لتقييم المخاطر في يناير.'), area: S('HSE', 'HSE', 'الصحة والسلامة والبيئة') },
  '8.2': { req: S('The organization shall periodically test and exercise its planned response actions and evaluate them (ISO 45001 §8.2; ISO 14001 §8.2).', 'L\'organisme doit tester périodiquement les actions de réponse planifiées et les évaluer (ISO 45001 §8.2 ; ISO 14001 §8.2).', 'يجب على المؤسسة اختبار إجراءات الاستجابة المخططة دوريًا وتقييمها (ISO 45001 §8.2؛ ISO 14001 §8.2).'), ev: S('Evacuation drill of April: report lists 3 weaknesses but no follow-up action.', 'Exercice d\'évacuation d\'avril : le rapport liste 3 faiblesses sans action de suivi.', 'تمرين الإخلاء في أبريل: التقرير يذكر 3 نقاط ضعف دون إجراءات متابعة.'), area: S('HSE', 'HSE', 'الصحة والسلامة والبيئة') },
  '9.1.2': { req: S('The organization shall evaluate fulfilment of its compliance obligations at the planned frequency (ISO 14001 §9.1.2).', 'L\'organisme doit évaluer le respect de ses obligations de conformité à la fréquence prévue (ISO 14001 §9.1.2).', 'يجب على المؤسسة تقييم الوفاء بالتزامات الامتثال بالتكرار المخطط (ISO 14001 §9.1.2).'), ev: S('Air emission measurement planned for March not performed; last result dated 14 months ago.', 'Mesure des rejets atmosphériques prévue en mars non réalisée ; dernier résultat datant de 14 mois.', 'لم يُجرَ قياس الانبعاثات المخطط في مارس؛ آخر نتيجة منذ 14 شهرًا.'), area: S('HSE', 'HSE', 'الصحة والسلامة والبيئة') },
};

export const AUDIT_FREQUENCIES = ['Monthly', 'Quarterly', 'Semi-annual', 'Annual', 'Every 2 years', 'Every 3 years', 'Custom'];

export function seedImsRecords(x) {
  const { r, reg, profile, qhse, uName, TODAY, start, addDays, ncs, standards } = x;
  const pad = (n) => String(n).padStart(2, '0');
  const past = (d) => (d > TODAY ? TODAY : d);

  // Monitoring and measuring equipment (ISO 9001 §7.1.5)
  [...EQUIPMENT, ...(qhse ? EQUIPMENT_HSE : [])].forEach((e, j) => {
    const next = addDays(TODAY, j === 0 ? -4 : j === 3 ? 18 : r.int(30, 300));
    const last = addDays(next, -e.months * 30);
    const status = next < TODAY ? 'Overdue' : next <= addDays(TODAY, 30) ? 'Due soon' : 'Valid';
    const oot = j === 2;
    reg('calibration', `EQ-${pad(j + 1)}`, e.t, {
      category: CAT[e.cat], manufacturer: e.mfr, model: e.model, serial: `SN-${r.int(10000, 99999)}`, location: profile.line, user: uName(j % 2 ? 'operations_manager' : 'quality_manager'),
      range: e.range, resolution: e.res, tolerance: e.tol, method: METHOD[e.method], provider: e.method === 'External' ? S('Calibration laboratory (supplier SUP-05)', 'Laboratoire d\'étalonnage (fournisseur SUP-05)', 'مختبر المعايرة (المورد SUP-05)') : S('Quality department', 'Service qualité', 'قسم الجودة'),
      certificate: `CAL-${last.slice(0, 4)}-${r.int(100, 999)}`, frequencyMonths: e.months, lastCalibration: last, result: oot ? S('Adjusted', 'Ajusté', 'تم الضبط') : S('Pass', 'Conforme', 'مطابق'),
      error: oot ? '+6 % → +0.8 %' : `${Math.round(10 + r.next() * 50)} % MPE`, nextCalibration: next, traceability: TRACE, outOfTolerance: oot ? OOT : null,
      lastCalibrationResult: oot ? 'Adjusted' : 'Pass',
    }, status, 'MP-025');
  });

  // Competence requirements, actual levels and gaps (ISO 9001 §7.2)
  [...COMPETENCE_REQ, ...(qhse ? COMPETENCE_HSE : [])].forEach(([t, role, req, crit, acq], j) => {
    const level = Math.max(1, Math.min(4, req + (j % 4 === 1 ? -1 : j % 5 === 3 ? -2 : 0)));
    const gap = Math.max(0, req - level);
    reg('competence', `CMP-${pad(j + 1)}`, t, {
      role, holder: uName(role), required: req, level, gap, criticality: CRIT[crit], acquiredBy: ACQUIRED[acq],
      evidence: gap ? S('Training planned', 'Formation planifiée', 'تدريب مخطط') : S('Certificate / assessment on file', 'Certificat / évaluation au dossier', 'شهادة / تقييم في الملف'),
      trainedOn: past(addDays(start, 30 + j * 12)), action: gap ? S('Training and coached practice before end of quarter', 'Formation et pratique accompagnée avant la fin du trimestre', 'تدريب وممارسة موجهة قبل نهاية الربع') : null,
    }, gap ? 'Gap' : 'Competent', 'MP-013');
  });

  // Training records and effectiveness
  const staff = ['quality_manager', 'operations_manager', 'document_controller', 'audit_manager', 'employee', 'hse_manager', 'performance_manager'];
  [...COURSES, ...(qhse ? COURSES_HSE : [])].forEach(([t, type, hours, evalm], j) => {
    const date = past(addDays(start, 25 + j * 38));
    const eff = r.int(72, 97);
    const done = date < TODAY;
    reg('training', `TRN-${pad(j + 1)}`, t, {
      type: TYPE[type], provider: type === 'External' ? S('Accredited training body', 'Organisme de formation agréé', 'هيئة تدريب معتمدة') : S('In-house', 'Interne', 'داخلي'),
      trainer: type === 'External' ? S('External trainer', 'Formateur externe', 'مدرب خارجي') : uName(j % 2 ? 'quality_manager' : 'ims_manager'),
      date, durationH: hours, participants: r.sample(staff, r.int(2, 4)).map(uName), competence: COMPETENCE_REQ[j % COMPETENCE_REQ.length][0],
      evaluation: evalm, result: done ? S('Passed', 'Réussi', 'ناجح') : null, effectiveness: done ? eff : null,
      effectivenessMethod: S('Supervisor assessment 3 months after (Kirkpatrick level 3)', 'Évaluation par le responsable 3 mois après (Kirkpatrick niveau 3)', 'تقييم المشرف بعد 3 أشهر (مستوى كيركباتريك 3)'),
      certificate: type === 'External' ? `CERT-${r.int(1000, 9999)}` : null,
    }, done ? 'Completed' : 'Planned', 'MP-013', date);
  });

  // Communication plan (ISO 9001 §7.4) and communication log
  [...COMM_PLAN, ...(qhse ? COMM_PLAN_HSE : [])].forEach(([t, purpose, audience, dir, sender, channel, freq, record], j) => {
    reg('commplan', `COM-${pad(j + 1)}`, t, { purpose, audience, direction: DIR[dir], sender, channel, frequency: freq, language: S('Local language and English', 'Langue locale et anglais', 'اللغة المحلية والإنجليزية'), record, feedback: S('Questions to the process owner; survey', 'Questions au pilote ; enquête', 'أسئلة لمالك العملية؛ استبيان') }, 'Active', 'MP-014');
    for (let k = 0; k < 2; k++) {
      const d = past(addDays(start, 20 + j * 21 + k * 120));
      reg('commlog', `CL-${pad(j + 1)}${k + 1}`, t, { date: d, audience, channel, by: uName(sender), reach: r.int(4, 45), evidence: record, feedback: k ? S('Two questions answered', 'Deux questions traitées', 'تمت الإجابة عن سؤالين') : S('No question', 'Aucune question', 'لا أسئلة') }, 'Done', 'MP-014', d);
    }
  });

  // Control of changes (ISO 9001 §6.3, §8.5.6)
  CHANGES.forEach(([t, type, reason, impacted, L, I, resources], j) => {
    const d = past(addDays(start, 40 + j * 45));
    const planned = addDays(d, 30);
    const done = planned < TODAY;
    const lvl = L * I >= 12 ? 'High' : L * I >= 6 ? 'Medium' : 'Low';
    reg('changes', `CHG-${pad(j + 1)}`, t, {
      date: d, requester: uName(j % 2 ? 'operations_manager' : 'quality_manager'), type: CHANGE_TYPE[type], reason, impacted: fill(impacted, profile.line),
      likelihood: L, impact: I, riskLevel: CRIT[lvl], resources, plannedDate: planned, approvedBy: uName('ims_manager'), approvalDate: addDays(d, 5),
      decision: S('Approved', 'Approuvée', 'معتمد'), implementation: done ? S('Implemented', 'Mise en œuvre', 'منفذ') : S('In progress', 'En cours', 'قيد التنفيذ'),
      verification: done ? CHANGE_VERIF : null, reviewDate: addDays(planned, 30),
      integrity: S('QMS integrity kept: documents, trainings and responsibilities updated before release', 'Intégrité du SMQ préservée : documents, formations et responsabilités mis à jour avant mise en œuvre', 'الحفاظ على سلامة النظام: تحديث الوثائق والتدريبات والمسؤوليات قبل التنفيذ'),
    }, done ? 'Closed' : 'Approved', 'MP-036', d);
  });

  // Compliance obligations (ISO 14001 / 45001 §6.1.3, §9.1.2) — standards and legal requirements
  const obl = [...OBLIGATIONS, ...(qhse ? OBLIGATIONS_HSE : [])];
  standards.forEach((s, j) => reg('obligations', `OB-S${j + 1}`, { en: s, fr: s, ar: s }, {
    type: OBL_TYPE.Standard, authority: S('Certification body', 'Organisme de certification', 'هيئة الاعتماد'), reference: s, applicability: S('Whole management system', 'Tout le système de management', 'نظام الإدارة كاملًا'),
    requirement: S('All requirements of the standard within the scope', 'Toutes les exigences de la norme dans le périmètre', 'جميع متطلبات المعيار ضمن النطاق'), compliance: S('Internal audits and management review', 'Audits internes et revue de direction', 'التدقيقات الداخلية ومراجعة الإدارة'),
    owner: 'ims_manager', frequencyMonths: 12, lastEvaluated: addDays(TODAY, -r.int(20, 120)), evaluation: j < 2 ? EVAL.C : EVAL.P, evidence: S('Audit report', 'Rapport d\'audit', 'تقرير التدقيق'), nextEvaluation: addDays(TODAY, r.int(60, 240)),
  }, 'Active', 'MP-028'));
  obl.forEach(([t, type, authority, ref, appl, reqt, how, owner, months], j) => {
    const last = addDays(TODAY, -r.int(15, 200));
    const ev = j === 3 ? 'P' : 'C';
    reg('obligations', `OB-L${pad(j + 1)}`, t, {
      type: OBL_TYPE[type], authority, reference: ref, applicability: appl, requirement: reqt, compliance: how, owner, frequencyMonths: months, lastEvaluated: last, evaluation: EVAL[ev],
      evidence: how, nextEvaluation: addDays(last, months * 30), action: ev === 'P' ? S('Evacuation drill to be repeated with all staff', 'Exercice d\'évacuation à refaire avec tout le personnel', 'إعادة تمرين الإخلاء بمشاركة جميع العاملين') : null,
    }, 'Active', 'MP-028');
  });

  // Control plan (ISO 9001 §8.5.1)
  CONTROL_PLAN.forEach(([op, ch, kind, cls, spec, method, sample, freq, ctrl, record, reaction], j) => reg('controlplan', `CP-${pad(j + 1)}`, fill(op, profile.line), {
    characteristic: ch, charType: CHAR[kind], classification: CLASS[cls], specification: spec, method, sample, frequency: freq, control: ctrl, responsible: j < 2 ? 'operations_manager' : j === 6 ? 'quality_manager' : 'operations_manager', record, reaction,
  }, 'Active', 'MP-007'));

  // Customer requirements review (ISO 9001 §8.2.3)
  REQ_REVIEW.forEach(([t, type], j) => {
    const d = past(addDays(start, 15 + j * 60));
    const dec = j === 3 ? 'Conditional' : 'Accept';
    reg('reqreview', `REQ-${pad(j + 1)}`, t, {
      customer: fill(S('{0} — customer {1}', '{0} — client {1}', '{0} — العميل {1}'), profile.customer, String.fromCharCode(65 + j)), type: REQ_TYPE[type], date: d,
      requirements: fill(REQ_TEXT, profile.product, t), capability: S('Yes — resources and competence available', 'Oui — ressources et compétences disponibles', 'نعم — الموارد والكفاءات متوفرة'),
      leadTime: `${r.int(3, 20)} d`, legal: S('Checked', 'Vérifié', 'تم التحقق'), decision: DECISION[dec], reviewedBy: uName('operations_manager'), confirmed: addDays(d, 2),
      conditions: dec === 'Conditional' ? S('Site access badge to be provided by the customer', 'Badge d\'accès au site à fournir par le client', 'يوفر العميل شارة الدخول إلى الموقع') : null,
    }, 'Reviewed', 'MP-001', d);
  });

  // Release of products and services (ISO 9001 §8.6)
  for (let j = 0; j < 8; j++) {
    const d = past(addDays(TODAY, -j * 11 - 3));
    const ok = j !== 5;
    reg('releases', `REL-${d.replace(/-/g, '').slice(2)}-${j + 1}`, fill(S('Job {0} — {1}', 'Intervention {0} — {1}', 'العملية {0} — {1}'), `J-${r.int(2000, 2999)}`, profile.product), {
      date: d, criteria: S('Test protocol passed; job sheet signed by the customer', 'Protocole d\'essai réussi ; fiche signée par le client', 'نجاح بروتوكول الاختبار؛ توقيع العميل على بطاقة العمل'),
      result: ok ? S('Conforming', 'Conforme', 'مطابق') : S('Nonconforming — rework before release', 'Non conforme — reprise avant libération', 'غير مطابق — إعادة العمل قبل الإفراج'), conform: ok,
      releasedBy: uName(j % 2 ? 'operations_manager' : 'quality_manager'), evidence: `JS-${r.int(10000, 99999)}`,
    }, ok ? 'Released' : 'On hold', 'MP-007', d);
  }

  // Nonconforming outputs: disposition (ISO 9001 §8.7) and 8D for major / critical NCs (§10.2)
  const disp = ['Rework', 'Repair', 'Concession', 'Scrap', 'Return'];
  ncs.forEach((n, j) => {
    const dsp = disp[j % disp.length];
    reg('nco', `NCO-${pad(j + 1)}`, n.title, {
      ncCode: n.code, date: n.detected, product: profile.product, quantity: r.int(1, 12), detectedAt: j % 2 ? S('Final check', 'Contrôle final', 'الفحص النهائي') : S('Customer', 'Client', 'العميل'),
      disposition: DISPOSITION[dsp], authority: uName(dsp === 'Concession' ? 'top_management' : 'quality_manager'), customerInformed: dsp === 'Concession' || j % 2 === 0,
      concession: dsp === 'Concession' ? `DER-${r.int(100, 999)}` : null, cost: r.int(3, 60) * 100,
    }, n.stage === 'Closed' ? 'Closed' : 'Open', 'MP-018', n.detected);
    if (!['Major', 'Critical'].includes(n.crit)) return;
    const c = CAPA_TEXT;
    const opened = n.detected;
    reg('capa', `8D-${pad(j + 1)}`, n.title, {
      ncCode: n.code, opened, champion: uName('quality_manager'), priority: n.crit === 'Critical' ? CRIT.High : CRIT.Medium,
      team: [['quality_manager', S('Team leader', 'Animateur', 'قائد الفريق')], ['operations_manager', S('Process owner', 'Pilote du processus', 'مالك العملية')], ['employee', S('Operator', 'Opérateur', 'مشغل')], ['document_controller', S('Documentation', 'Documentation', 'التوثيق')]].map(([role, fn]) => ({ name: uName(role), role, fn })),
      what: n.title, where: profile.line, when: opened, who: S('Customer-facing team', 'Équipe en contact client', 'الفريق المتعامل مع العملاء'), howMany: `${r.int(1, 6)}`, howDetected: c.howDetected, why: c.why,
      containment: c.containment.map((a, k) => ({ action: a, owner: uName(k ? 'operations_manager' : 'quality_manager'), date: addDays(opened, k), result: S('Done — no further defect found', 'Fait — aucun autre défaut trouvé', 'تم — لم يُعثر على عيوب أخرى') })),
      ishikawa: c.ishikawa, whys: c.whys, rootCause: c.root,
      corrective: c.corrective.map(([a, v], k) => ({ action: a, owner: uName(['process_excellence_manager', 'document_controller', 'hr_manager'][k]), due: addDays(opened, 20 + k * 10), verification: v })),
      validation: n.stage === 'Closed' ? c.validation : null, prevention: c.prevention, lessons: c.lessons,
      closed: n.closedAt, closedBy: n.closedAt ? uName('audit_manager') : null,
    }, n.stage === 'Closed' ? 'Closed' : 'Open', 'MP-020', opened);
  });
}

// Supplier evaluation details (ISO 9001 §8.4.1), merged into the supplier register.
export function supplierDetail(r, j, score, TODAY, addDays) {
  const sc = () => Math.max(1, Math.min(5, Math.round(score / 20 + (r.next() - 0.5) * 1.4)));
  const q = sc(); const d = sc(); const p = sc(); const s = sc(); const h = sc();
  const overall = Math.round(((q * 0.35 + d * 0.25 + p * 0.15 + s * 0.15 + h * 0.1) / 5) * 100);
  return {
    category: SUPPLIER_CAT[j % SUPPLIER_CAT.length], certification: CERTS[j % CERTS.length], quality: q, delivery: d, price: p, service: s, hse: h, score: overall,
    class: overall >= 80 ? 'A' : overall >= 65 ? 'B' : 'C', otd: `${r.int(86, 99)} %`, ppm: r.int(0, 900), complaints: r.int(0, 3),
    nextEvaluation: addDays(TODAY, r.int(40, 200)),
    action: overall < 65 ? S('Development plan and monthly follow-up', 'Plan de progrès et suivi mensuel', 'خطة تطوير ومتابعة شهرية') : null,
  };
}
