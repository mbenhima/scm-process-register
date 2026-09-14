// Module 4 — Macro Process Catalog (MP-01 through MP-10, per D01 / CR1 addendum).
// Each macro process is the unit E2E process chains are built from; primaryModules
// links it back to the journi module(s) that actually implement its data capture.
// name/description are {en,fr,ar} — resolved via useI18n()'s tv() at render time.
const macroProcesses = [
  {
    id: 'MP-01',
    name: { en: 'Change Impact & Stakeholder Assessment', fr: 'Évaluation de l’impact du changement et des parties prenantes', ar: 'تقييم أثر التغيير وأصحاب المصلحة' },
    description: {
      en: 'Maps stakeholder groups and scores change impact (process, technology, role, location, identity) to establish the baseline scope of who is affected and how.',
      fr: 'Cartographie les groupes de parties prenantes et note l’impact du changement (processus, technologie, rôle, localisation, identité) pour établir le périmètre de référence de qui est affecté et comment.',
      ar: 'يرسم خريطة لمجموعات أصحاب المصلحة ويقيّم أثر التغيير (العملية، التقنية، الدور، الموقع، الهوية) لتحديد النطاق الأساسي لمن يتأثر وكيف.',
    },
    primaryModules: ['M9'],
  },
  {
    id: 'MP-02',
    name: { en: 'Sponsorship & Governance Management', fr: 'Gestion du sponsoring et de la gouvernance', ar: 'إدارة الرعاية والحوكمة' },
    description: {
      en: 'Builds and tracks the sponsor coalition, escalation actions, and governance cadence that keep executive backing visible and active.',
      fr: 'Construit et suit la coalition des sponsors, les actions d’escalade et le rythme de gouvernance qui maintiennent le soutien exécutif visible et actif.',
      ar: 'يبني ويتابع ائتلاف الرعاة وإجراءات التصعيد ووتيرة الحوكمة التي تحافظ على دعم الإدارة التنفيذية ظاهرًا ونشطًا.',
    },
    primaryModules: ['M7', 'M13'],
  },
  {
    id: 'MP-03',
    name: { en: 'Communication & Awareness Management', fr: 'Gestion de la communication et de la sensibilisation', ar: 'إدارة الاتصال والتوعية' },
    description: {
      en: 'Plans and logs the communications cadence that drives the Awareness block of ADKAR across stakeholder cohorts.',
      fr: 'Planifie et consigne le rythme de communication qui fait avancer le bloc Sensibilisation d’ADKAR au sein des cohortes de parties prenantes.',
      ar: 'يخطط ويسجل وتيرة الاتصالات التي تدفع عنصر الوعي في ADKAR عبر فئات أصحاب المصلحة.',
    },
    primaryModules: ['M14'],
  },
  {
    id: 'MP-04',
    name: { en: 'Resistance & Barrier Management', fr: 'Gestion de la résistance et des freins', ar: 'إدارة المقاومة والعوائق' },
    description: {
      en: 'Logs resistance signals by type (role, skill, will, systemic) and tracks mitigation actions through to resolution.',
      fr: 'Consigne les signaux de résistance par type (rôle, compétence, volonté, systémique) et suit les actions d’atténuation jusqu’à leur résolution.',
      ar: 'يسجل إشارات المقاومة حسب النوع (الدور، المهارة، الإرادة، المنهجية) ويتابع إجراءات التخفيف حتى حلها.',
    },
    primaryModules: ['M16'],
  },
  {
    id: 'MP-05',
    name: { en: 'Training & Capability Enablement', fr: 'Formation et renforcement des compétences', ar: 'التدريب وتمكين القدرات' },
    description: {
      en: 'Delivers the curriculum that builds the Knowledge and Ability ADKAR blocks, tracked by cohort and completion status.',
      fr: 'Déploie le programme qui construit les blocs Connaissance et Capacité d’ADKAR, suivi par cohorte et statut d’achèvement.',
      ar: 'ينفّذ المنهج الذي يبني عنصري المعرفة والقدرة في ADKAR، ويُتابع حسب الفئة وحالة الإنجاز.',
    },
    primaryModules: ['M15'],
  },
  {
    id: 'MP-06',
    name: { en: 'Champion Network Management', fr: 'Gestion du réseau de champions du changement', ar: 'إدارة شبكة سفراء التغيير' },
    description: {
      en: 'Manages the change-champion network — floor-level advocates who surface early signals into the Sponsor Coalition and Resistance Log.',
      fr: 'Gère le réseau de champions du changement — des relais de terrain qui remontent les signaux précoces vers la Coalition des sponsors et le Journal de résistance.',
      ar: 'يدير شبكة سفراء التغيير — دعاة على مستوى الميدان يرفعون الإشارات المبكرة إلى ائتلاف الرعاة وسجل المقاومة.',
    },
    primaryModules: ['M13'],
  },
  {
    id: 'MP-07',
    name: { en: 'Readiness Diagnostics & Signal Capture', fr: 'Diagnostic de préparation et capture des signaux', ar: 'تشخيص الجاهزية والتقاط الإشارات' },
    description: {
      en: 'Aggregates ADKAR scores, sentiment, and other signals into the Composite Readiness Index used to judge go/no-go readiness.',
      fr: 'Agrège les scores ADKAR, le sentiment et d’autres signaux dans l’Indice composite de préparation utilisé pour juger de la décision go/no-go.',
      ar: 'يجمع درجات ADKAR والمزاج وإشارات أخرى في مؤشر الجاهزية المركب المستخدم للحكم على قرار المضي أو التوقف.',
    },
    primaryModules: ['M10', 'M11'],
  },
  {
    id: 'MP-08',
    name: { en: 'Divergence & Risk Detection', fr: 'Détection des écarts et des risques', ar: 'رصد الانحراف والمخاطر' },
    description: {
      en: 'Detects divergence patterns between plan and reality (schedule slips, adoption risk, saturation) and logs them to the Risk Register.',
      fr: 'Détecte les écarts entre le plan et la réalité (retards planning, risque d’adoption, saturation) et les consigne dans le Registre des risques.',
      ar: 'يرصد أنماط الانحراف بين الخطة والواقع (تأخر الجدول، مخاطر التبني، التشبع) ويسجلها في سجل المخاطر.',
    },
    primaryModules: ['M11', 'M12'],
  },
  {
    id: 'MP-09',
    name: { en: 'Hypercare & Floor Coaching Support', fr: 'Support hypercare et coaching de terrain', ar: 'دعم الرعاية المكثفة والتوجيه الميداني' },
    description: {
      en: 'Provides manager-led floor coaching and hypercare support immediately after go-live, while adoption is still fragile.',
      fr: 'Fournit un coaching de terrain mené par les managers et un support hypercare immédiatement après le déploiement, tant que l’adoption est encore fragile.',
      ar: 'يوفر توجيهًا ميدانيًا يقوده المدراء ودعمًا مكثفًا فور الإطلاق، بينما لا يزال التبني هشًا.',
    },
    primaryModules: ['M17', 'M21'],
  },
  {
    id: 'MP-10',
    name: { en: 'Reinforcement & Sustainment Management', fr: 'Gestion du renforcement et de la pérennisation', ar: 'إدارة التعزيز والاستدامة' },
    description: {
      en: 'Locks in the change through checkpoints, quick wins, and lessons learned so gains outlast the project close-out.',
      fr: 'Ancre le changement grâce à des points de contrôle, des victoires rapides et des enseignements tirés, afin que les gains survivent à la clôture du projet.',
      ar: 'يرسّخ التغيير من خلال نقاط تفتيش ومكاسب سريعة ودروس مستفادة بحيث تدوم المكاسب بعد إغلاق المشروع.',
    },
    primaryModules: ['M7', 'M21'],
  },
]

export default macroProcesses
