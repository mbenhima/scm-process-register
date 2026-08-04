// journi — translation dictionary (English / French / Arabic)
// Flat key -> { en, fr, ar }. Use t('key') via useI18n().

const dict = {
  // ---------- App shell ----------
  appName: { en: 'journi', fr: 'journi', ar: 'journi' },
  appTagline: { en: 'the human side of change, mapped as a journey', fr: 'le côté humain du changement, cartographié comme un parcours', ar: 'الجانب الإنساني للتغيير، بشكل رحلة مرسومة' },
  poweredBy: { en: 'Human Change Management Platform', fr: 'Plateforme de gestion humaine du changement', ar: 'منصة إدارة التغيير البشري' },
  search: { en: 'Search', fr: 'Rechercher', ar: 'بحث' },
  logout: { en: 'Sign out', fr: 'Déconnexion', ar: 'تسجيل الخروج' },
  language: { en: 'Language', fr: 'Langue', ar: 'اللغة' },
  role: { en: 'Role', fr: 'Rôle', ar: 'الدور' },
  scope: { en: 'Scope', fr: 'Périmètre', ar: 'النطاق' },
  save: { en: 'Save', fr: 'Enregistrer', ar: 'حفظ' },
  cancel: { en: 'Cancel', fr: 'Annuler', ar: 'إلغاء' },
  add: { en: 'Add', fr: 'Ajouter', ar: 'إضافة' },
  edit: { en: 'Edit', fr: 'Modifier', ar: 'تعديل' },
  delete: { en: 'Delete', fr: 'Supprimer', ar: 'حذف' },
  close: { en: 'Close', fr: 'Fermer', ar: 'إغلاق' },
  confirm: { en: 'Confirm', fr: 'Confirmer', ar: 'تأكيد' },
  actions: { en: 'Actions', fr: 'Actions', ar: 'إجراءات' },
  status: { en: 'Status', fr: 'Statut', ar: 'الحالة' },
  owner: { en: 'Owner', fr: 'Responsable', ar: 'المسؤول' },
  date: { en: 'Date', fr: 'Date', ar: 'التاريخ' },
  notes: { en: 'Notes', fr: 'Notes', ar: 'ملاحظات' },
  name: { en: 'Name', fr: 'Nom', ar: 'الاسم' },
  description: { en: 'Description', fr: 'Description', ar: 'الوصف' },
  type: { en: 'Type', fr: 'Type', ar: 'النوع' },
  loading: { en: 'Loading…', fr: 'Chargement…', ar: 'جارٍ التحميل…' },
  noData: { en: 'No records yet.', fr: 'Aucune donnée pour le moment.', ar: 'لا توجد بيانات بعد.' },
  all: { en: 'All', fr: 'Tous', ar: 'الكل' },
  back: { en: 'Back', fr: 'Retour', ar: 'رجوع' },
  export: { en: 'Export', fr: 'Exporter', ar: 'تصدير' },
  aiGenerated: { en: 'AI-generated — review required', fr: 'Généré par IA — vérification requise', ar: 'مُولَّد بالذكاء الاصطناعي — يتطلب مراجعة' },
  accept: { en: 'Accept', fr: 'Accepter', ar: 'قبول' },
  reject: { en: 'Reject', fr: 'Rejeter', ar: 'رفض' },
  generate: { en: 'Generate', fr: 'Générer', ar: 'توليد' },

  // ---------- Scope switcher ----------
  group: { en: 'Group', fr: 'Groupe', ar: 'المجموعة' },
  organization: { en: 'Organization', fr: 'Organisation', ar: 'المؤسسة' },
  project: { en: 'Project', fr: 'Projet', ar: 'المشروع' },
  mainProject: { en: 'Main Project', fr: 'Projet principal', ar: 'المشروع الرئيسي' },
  cmProject: { en: 'Change Management Project', fr: 'Projet de gestion du changement', ar: 'مشروع إدارة التغيير' },
  noGroup: { en: 'No Group (standalone)', fr: 'Sans groupe (autonome)', ar: 'بدون مجموعة (مستقلة)' },
  selectOrg: { en: 'Select organization…', fr: 'Choisir une organisation…', ar: 'اختر مؤسسة…' },
  selectProject: { en: 'Select project…', fr: 'Choisir un projet…', ar: 'اختر مشروعًا…' },

  // ---------- Nav / Modules ----------
  navPortfolio: { en: 'Portfolio Dashboard', fr: 'Tableau de bord du portefeuille', ar: 'لوحة المحفظة' },
  navM1: { en: 'M1 · Hierarchy', fr: 'M1 · Hiérarchie', ar: 'م1 · الهيكل التنظيمي' },
  navM2: { en: 'M2 · Identity & RBAC', fr: 'M2 · Identité et RBAC', ar: 'م2 · الهوية والصلاحيات' },
  navM4: { en: 'M4 · Initiative Registry', fr: 'M4 · Registre des initiatives', ar: 'م4 · سجل المبادرات' },
  navM5: { en: 'M5 · Stakeholder Mapping', fr: 'M5 · Cartographie des parties prenantes', ar: 'م5 · خريطة أصحاب المصلحة' },
  navM6: { en: 'M6 · ADKAR Engine', fr: 'M6 · Moteur ADKAR', ar: 'م6 · محرك ADKAR' },
  navM7: { en: 'M7 · Emotional & Transition', fr: 'M7 · Transition émotionnelle', ar: 'م7 · الانتقال العاطفي' },
  navM8: { en: 'M8 · Sponsor & Coalition', fr: 'M8 · Sponsor et coalition', ar: 'م8 · الراعي والتحالف' },
  navM9: { en: 'M9 · Communications', fr: 'M9 · Communications', ar: 'م9 · الاتصالات' },
  navM10: { en: 'M10 · Training', fr: 'M10 · Formation', ar: 'م10 · التدريب' },
  navM11: { en: 'M11 · Resistance', fr: 'M11 · Résistance', ar: 'م11 · المقاومة' },
  navM12: { en: 'M12 · Manager as Coach', fr: 'M12 · Manager-coach', ar: 'م12 · المدير كموجه' },
  navM13: { en: 'M13 · Sustainment', fr: 'M13 · Pérennisation', ar: 'م13 · الاستدامة' },
  navM14: { en: 'M14 · Risk Register', fr: 'M14 · Registre des risques', ar: 'م14 · سجل المخاطر' },
  navM15: { en: 'M15 · Analytics', fr: 'M15 · Analytique', ar: 'م15 · التحليلات' },
  navM16: { en: 'M16 · Journey Map', fr: 'M16 · Carte du parcours', ar: 'م16 · خريطة الرحلة' },
  navM17: { en: 'M17 · AI Use Case Library', fr: 'M17 · Bibliothèque de cas d’usage IA', ar: 'م17 · مكتبة حالات استخدام الذكاء الاصطناعي' },
  sectionPlatform: { en: 'Platform', fr: 'Plateforme', ar: 'المنصة' },
  sectionCore: { en: 'Change Management Modules', fr: 'Modules de gestion du changement', ar: 'وحدات إدارة التغيير' },
  sectionAI: { en: 'Governance', fr: 'Gouvernance', ar: 'الحوكمة' },

  // ---------- Login ----------
  loginTitle: { en: 'Welcome to journi', fr: 'Bienvenue sur journi', ar: 'مرحبًا بك في journi' },
  loginSubtitle: { en: 'Sign in to track the human side of your change portfolio.', fr: 'Connectez-vous pour suivre le côté humain de votre portefeuille de changement.', ar: 'سجّل الدخول لمتابعة الجانب الإنساني لمحفظة التغيير لديك.' },
  chooseDemoUser: { en: 'Choose a demo persona to sign in as', fr: 'Choisissez un profil de démonstration', ar: 'اختر ملفًا تجريبيًا لتسجيل الدخول' },
  signIn: { en: 'Sign in', fr: 'Se connecter', ar: 'تسجيل الدخول' },
  demoNotice: { en: 'Demo environment — no password required. Data is stored locally in your browser.', fr: 'Environnement de démonstration — aucun mot de passe requis. Les données sont stockées localement dans votre navigateur.', ar: 'بيئة تجريبية — لا حاجة لكلمة مرور. تُخزَّن البيانات محليًا في متصفحك.' },

  // ---------- Roles ----------
  role_super_admin: { en: 'Super Admin', fr: 'Super administrateur', ar: 'المسؤول الأعلى' },
  role_group_admin: { en: 'Group Admin', fr: 'Administrateur de groupe', ar: 'مسؤول المجموعة' },
  role_org_admin: { en: 'Organization Admin', fr: 'Administrateur d’organisation', ar: 'مسؤول المؤسسة' },
  role_sponsor: { en: 'Project Sponsor', fr: 'Sponsor du projet', ar: 'راعي المشروع' },
  role_change_manager: { en: 'Change Manager / Lead', fr: 'Change Manager / Responsable', ar: 'مدير التغيير' },
  role_people_manager: { en: 'People Manager / Coach', fr: 'Manager d’équipe / Coach', ar: 'مدير الأفراد / موجه' },
  role_practitioner: { en: 'Practitioner / Contributor', fr: 'Praticien / Contributeur', ar: 'ممارس / مساهم' },
  role_employee: { en: 'Employee / End User', fr: 'Employé / Utilisateur final', ar: 'موظف / مستخدم نهائي' },
  role_executive: { en: 'Executive Viewer', fr: 'Observateur exécutif', ar: 'مشاهد تنفيذي' },

  // ---------- Frameworks ----------
  adkar: { en: 'ADKAR', fr: 'ADKAR', ar: 'ADKAR' },
  awareness: { en: 'Awareness', fr: 'Sensibilisation', ar: 'الوعي' },
  desire: { en: 'Desire', fr: 'Désir', ar: 'الرغبة' },
  knowledge: { en: 'Knowledge', fr: 'Connaissance', ar: 'المعرفة' },
  ability: { en: 'Ability', fr: 'Capacité', ar: 'القدرة' },
  reinforcement: { en: 'Reinforcement', fr: 'Renforcement', ar: 'التعزيز' },

  bridges: { en: 'Bridges Transition', fr: 'Transition de Bridges', ar: 'انتقال بريدجز' },
  bridges_ending: { en: 'Ending', fr: 'Fin', ar: 'الانتهاء' },
  bridges_neutral: { en: 'Neutral Zone', fr: 'Zone neutre', ar: 'المنطقة المحايدة' },
  bridges_beginning: { en: 'New Beginning', fr: 'Nouveau départ', ar: 'بداية جديدة' },

  kubler: { en: 'Kübler-Ross Curve', fr: 'Courbe de Kübler-Ross', ar: 'منحنى كوبلر-روس' },
  sentiment_denial: { en: 'Denial', fr: 'Déni', ar: 'الإنكار' },
  sentiment_resistance: { en: 'Resistance / Anger', fr: 'Résistance / Colère', ar: 'المقاومة / الغضب' },
  sentiment_exploration: { en: 'Exploration', fr: 'Exploration', ar: 'الاستكشاف' },
  sentiment_commitment: { en: 'Commitment', fr: 'Engagement', ar: 'الالتزام' },

  lewin: { en: 'Lewin Macro-State', fr: 'État macro de Lewin', ar: 'حالة لوين الكلية' },
  lewin_unfreeze: { en: 'Unfreeze', fr: 'Décristallisation', ar: 'إذابة الجمود' },
  lewin_change: { en: 'Change', fr: 'Changement', ar: 'التغيير' },
  lewin_refreeze: { en: 'Refreeze', fr: 'Recristallisation', ar: 'إعادة التجميد' },

  kotter: { en: 'Kotter’s 8 Steps', fr: 'Les 8 étapes de Kotter', ar: 'خطوات كوتر الثماني' },

  // ---------- AI tiers ----------
  tier_assistive: { en: 'Assistive', fr: 'Assistif', ar: 'مساعد' },
  tier_augmented: { en: 'Augmented', fr: 'Augmenté', ar: 'معزز' },
  tier_autonomous: { en: 'Autonomous (out of scope)', fr: 'Autonome (hors périmètre)', ar: 'مستقل (خارج النطاق)' },

  // ---------- Module 4 ----------
  m4_title: { en: 'Initiative & Portfolio Registry', fr: 'Registre des initiatives et du portefeuille', ar: 'سجل المبادرات والمحفظة' },
  m4_desc: { en: 'System of record for every change initiative — business driver, scope, target population, and Lewin macro-state.', fr: 'Registre de toutes les initiatives de changement — moteur métier, périmètre, population cible et état macro de Lewin.', ar: 'سجل شامل لكل مبادرات التغيير — الدافع، النطاق، الفئة المستهدفة، وحالة لوين الكلية.' },
  changeType: { en: 'Change Type', fr: 'Type de changement', ar: 'نوع التغيير' },
  businessDriver: { en: 'Business Driver', fr: 'Moteur métier', ar: 'الدافع التجاري' },
  targetPopulation: { en: 'Target Population', fr: 'Population cible', ar: 'الفئة المستهدفة' },
  successCriteria: { en: 'Success Criteria', fr: 'Critères de succès', ar: 'معايير النجاح' },
  linkedMainProject: { en: 'Linked Main Project', fr: 'Projet principal lié', ar: 'المشروع الرئيسي المرتبط' },
  standalone: { en: 'Standalone (no Main Project)', fr: 'Autonome (sans projet principal)', ar: 'مستقل (بدون مشروع رئيسي)' },
  budgetBand: { en: 'Budget Band', fr: 'Fourchette budgétaire', ar: 'نطاق الميزانية' },
  duration: { en: 'Duration', fr: 'Durée', ar: 'المدة' },
  executiveSponsor: { en: 'Executive Sponsor', fr: 'Sponsor exécutif', ar: 'الراعي التنفيذي' },

  // ---------- Module 5 ----------
  m5_title: { en: 'Stakeholder & Impact Mapping', fr: 'Cartographie des parties prenantes et de l’impact', ar: 'خريطة أصحاب المصلحة والتأثير' },
  m5_desc: { en: 'Who is affected, how heavily, and in what dimension. Impact scores drive tracking depth.', fr: 'Qui est impacté, à quel degré et selon quelle dimension. Les scores d’impact déterminent le niveau de suivi.', ar: 'من المتأثر، وبأي درجة، وفي أي بُعد. تحدد درجات التأثير مستوى المتابعة.' },
  stakeholderGroup: { en: 'Stakeholder Group', fr: 'Groupe de parties prenantes', ar: 'مجموعة أصحاب المصلحة' },
  headcount: { en: 'Headcount', fr: 'Effectif', ar: 'عدد الأفراد' },
  impactProcess: { en: 'Process', fr: 'Processus', ar: 'العملية' },
  impactTech: { en: 'Technology', fr: 'Technologie', ar: 'التقنية' },
  impactRole: { en: 'Role', fr: 'Rôle', ar: 'الدور' },
  impactLocation: { en: 'Location', fr: 'Localisation', ar: 'الموقع' },
  impactIdentity: { en: 'Identity', fr: 'Identité', ar: 'الهوية' },
  influence: { en: 'Influence', fr: 'Influence', ar: 'التأثير' },
  highImpactLowInfluence: { en: 'High-impact / Low-influence', fr: 'Impact élevé / Influence faible', ar: 'تأثر عالٍ / نفوذ منخفض' },
  atRiskFlag: { en: 'At risk of being under-supported', fr: 'Risque de manque de soutien', ar: 'معرّض لخطر نقص الدعم' },

  // ---------- Module 6 ----------
  m6_title: { en: 'ADKAR Engine — Individual Readiness Core', fr: 'Moteur ADKAR — Cœur de préparation individuelle', ar: 'محرك ADKAR — جاهزية الأفراد' },
  m6_desc: { en: 'Score cohorts across the five ADKAR blocks with barrier-point diagnosis.', fr: 'Évaluez les cohortes sur les cinq blocs ADKAR avec diagnostic des points de blocage.', ar: 'قيّم المجموعات عبر عناصر ADKAR الخمسة مع تشخيص نقاط العائق.' },
  buildingBlock: { en: 'Building Block', fr: 'Bloc', ar: 'العنصر' },
  score: { en: 'Score', fr: 'Score', ar: 'الدرجة' },
  barrierReason: { en: 'Barrier Reason', fr: 'Motif du blocage', ar: 'سبب العائق' },
  cohort: { en: 'Cohort', fr: 'Cohorte', ar: 'المجموعة' },
  history: { en: 'History', fr: 'Historique', ar: 'السجل الزمني' },
  escalated: { en: 'Escalated — stalled beyond threshold', fr: 'Escaladé — bloqué au-delà du seuil', ar: 'تمت التصعيد — متوقف لفترة تتجاوز الحد' },
  addAssessment: { en: 'Add Assessment', fr: 'Ajouter une évaluation', ar: 'إضافة تقييم' },
  coachingNote: { en: 'Coaching Note', fr: 'Note de coaching', ar: 'ملاحظة توجيهية' },
  addCoachingNote: { en: 'Add coaching note', fr: 'Ajouter une note de coaching', ar: 'إضافة ملاحظة توجيهية' },

  // ---------- Module 7 ----------
  m7_title: { en: 'Emotional & Transition Layer', fr: 'Couche émotionnelle et de transition', ar: 'طبقة الانتقال العاطفي' },
  m7_desc: { en: 'Bridges transition position and Kübler-Ross sentiment, cross-referenced with ADKAR.', fr: 'Position de transition de Bridges et sentiment de Kübler-Ross, croisés avec ADKAR.', ar: 'موقع انتقال بريدجز ومشاعر كوبلر-روس، مقارنة مع ADKAR.' },
  divergenceAlert: { en: 'Divergence Alert', fr: 'Alerte de divergence', ar: 'تنبيه تباين' },
  divergenceDesc: { en: 'Strong ADKAR score but still emotionally in Ending — classic hidden-resistance pattern.', fr: 'Bon score ADKAR mais encore émotionnellement en phase de Fin — signal classique de résistance cachée.', ar: 'درجة ADKAR جيدة لكن لا يزال عاطفيًا في مرحلة الانتهاء — نمط كلاسيكي للمقاومة الخفية.' },

  // ---------- Module 8 ----------
  m8_title: { en: 'Sponsor & Coalition Module', fr: 'Module Sponsor et coalition', ar: 'وحدة الراعي والتحالف' },
  m8_desc: { en: 'Sponsor roadmap, active-vs-passive sponsorship, and guiding coalition strength.', fr: 'Feuille de route du sponsor, sponsoring actif vs passif, et solidité de la coalition directrice.', ar: 'خارطة طريق الراعي، الرعاية الفعالة مقابل السلبية، وقوة التحالف الموجّه.' },
  coalitionMember: { en: 'Coalition Member', fr: 'Membre de la coalition', ar: 'عضو التحالف' },
  visibility: { en: 'Visibility', fr: 'Visibilité', ar: 'الظهور' },
  engagement: { en: 'Engagement', fr: 'Engagement', ar: 'الانخراط' },
  sponsorAction: { en: 'Sponsor Action', fr: 'Action du sponsor', ar: 'إجراء الراعي' },
  visibilityLow: { en: 'Weak', fr: 'Faible', ar: 'ضعيف' },
  visibilityModerate: { en: 'Moderate', fr: 'Modéré', ar: 'متوسط' },
  visibilityStrong: { en: 'Strong', fr: 'Fort', ar: 'قوي' },

  // ---------- Module 9 ----------
  m9_title: { en: 'Communication Planning & Execution', fr: 'Planification et exécution des communications', ar: 'تخطيط وتنفيذ الاتصالات' },
  m9_desc: { en: 'Message × audience × channel × timing matrix, with saturation detection.', fr: 'Matrice message × audience × canal × calendrier, avec détection de saturation.', ar: 'مصفوفة الرسالة × الجمهور × القناة × التوقيت، مع كشف التشبع.' },
  message: { en: 'Message', fr: 'Message', ar: 'الرسالة' },
  audience: { en: 'Audience', fr: 'Audience', ar: 'الجمهور' },
  channel: { en: 'Channel', fr: 'Canal', ar: 'القناة' },
  sender: { en: 'Sender', fr: 'Expéditeur', ar: 'المُرسِل' },
  timing: { en: 'Timing', fr: 'Calendrier', ar: 'التوقيت' },
  linkedAdkarBlock: { en: 'Linked ADKAR Block', fr: 'Bloc ADKAR lié', ar: 'عنصر ADKAR المرتبط' },
  saturationWarning: { en: 'Change saturation risk — overlapping population', fr: 'Risque de saturation — population qui se chevauche', ar: 'خطر تشبع التغيير — تداخل في الفئة المستهدفة' },

  // ---------- Module 10 ----------
  m10_title: { en: 'Training & Capability Building', fr: 'Formation et développement des compétences', ar: 'التدريب وبناء القدرات' },
  m10_desc: { en: 'Curriculum coverage, completion, and demonstrated capability — trained vs. capable.', fr: 'Couverture du curriculum, achèvement et capacité démontrée — formé vs. capable.', ar: 'تغطية المنهج، الإتمام، والقدرة الفعلية — مُدرَّب مقابل قادر.' },
  curriculum: { en: 'Curriculum / Track', fr: 'Curriculum / Parcours', ar: 'المنهج / المسار' },
  facilitator: { en: 'Facilitator', fr: 'Animateur', ar: 'الميسر' },
  format: { en: 'Format', fr: 'Format', ar: 'الصيغة' },
  completion: { en: 'Completion', fr: 'Achèvement', ar: 'نسبة الإنجاز' },
  certification: { en: 'Certified / Capable', fr: 'Certifié / Capable', ar: 'معتمد / قادر' },

  // ---------- Module 11 ----------
  m11_title: { en: 'Resistance Management', fr: 'Gestion de la résistance', ar: 'إدارة المقاومة' },
  m11_desc: { en: 'Log, classify and resolve resistance, linked to concrete mitigation actions.', fr: 'Enregistrez, classez et résolvez la résistance, avec des actions de mitigation concrètes.', ar: 'سجّل وصنّف وعالج المقاومة، مع إجراءات تخفيف ملموسة.' },
  resistanceType: { en: 'Type', fr: 'Type', ar: 'النوع' },
  resistance_role: { en: 'Role-based', fr: 'Liée au rôle', ar: 'مرتبطة بالدور' },
  resistance_skill: { en: 'Skill-based', fr: 'Liée aux compétences', ar: 'مرتبطة بالمهارة' },
  resistance_will: { en: 'Will-based', fr: 'Liée à la volonté', ar: 'مرتبطة بالإرادة' },
  resistance_systemic: { en: 'Systemic', fr: 'Systémique', ar: 'منهجية' },
  source: { en: 'Source', fr: 'Source', ar: 'المصدر' },
  rootCause: { en: 'Root Cause', fr: 'Cause racine', ar: 'السبب الجذري' },
  severity: { en: 'Severity', fr: 'Gravité', ar: 'الخطورة' },
  mitigationAction: { en: 'Mitigation Action', fr: 'Action de mitigation', ar: 'إجراء التخفيف' },
  dueDate: { en: 'Due Date', fr: 'Date d’échéance', ar: 'تاريخ الاستحقاق' },
  anonymous: { en: 'Anonymous', fr: 'Anonyme', ar: 'مجهول' },
  submitConcern: { en: 'Submit a concern', fr: 'Signaler une préoccupation', ar: 'إرسال ملاحظة' },

  // ---------- Module 12 ----------
  m12_title: { en: 'Manager-as-Coach Enablement', fr: 'Activation du manager-coach', ar: 'تمكين المدير كموجه' },
  m12_desc: { en: 'Team-scoped ADKAR heatmap with suggested coaching actions per barrier.', fr: 'Carte thermique ADKAR de l’équipe avec actions de coaching suggérées par blocage.', ar: 'خريطة حرارية لفريقك مع إجراءات توجيهية مقترحة لكل عائق.' },
  managerReadiness: { en: 'Manager Readiness Self-Assessment', fr: 'Auto-évaluation de préparation du manager', ar: 'تقييم ذاتي لجاهزية المدير' },
  coachingScript: { en: 'Suggested Coaching Script', fr: 'Script de coaching suggéré', ar: 'نص توجيه مقترح' },

  // ---------- Module 13 ----------
  m13_title: { en: 'Reinforcement & Sustainment', fr: 'Renforcement et pérennisation', ar: 'التعزيز والاستدامة' },
  m13_desc: { en: 'Post-go-live adoption audits, regression detection, and sustainment sign-off.', fr: 'Audits d’adoption post-déploiement, détection de régression et validation de pérennisation.', ar: 'تدقيقات التبني بعد الإطلاق، كشف التراجع، والتوقيع على الاستدامة.' },
  checkpoint: { en: 'Checkpoint', fr: 'Point de contrôle', ar: 'نقطة التحقق' },
  adoptionRate: { en: 'Adoption Rate', fr: 'Taux d’adoption', ar: 'معدل التبني' },
  regressionRisk: { en: 'Regression Risk', fr: 'Risque de régression', ar: 'خطر التراجع' },
  quickWin: { en: 'Quick Win / Milestone', fr: 'Gain rapide / Jalon', ar: 'إنجاز سريع / معلم' },
  sustainmentSignoff: { en: 'Sustainment Sign-off', fr: 'Validation de pérennisation', ar: 'توقيع الاستدامة' },
  lessonsLearned: { en: 'Lessons Learned', fr: 'Leçons apprises', ar: 'الدروس المستفادة' },

  // ---------- Module 14 ----------
  m14_title: { en: 'Change Risk Register', fr: 'Registre des risques de changement', ar: 'سجل مخاطر التغيير' },
  m14_desc: { en: 'Adoption, sponsorship, capacity and saturation risk — distinct from generic project risk.', fr: 'Risques d’adoption, de sponsoring, de capacité et de saturation — distincts du risque projet générique.', ar: 'مخاطر التبني، الرعاية، القدرة والتشبع — مختلفة عن مخاطر المشروع العامة.' },
  riskCategory: { en: 'Category', fr: 'Catégorie', ar: 'الفئة' },
  risk_adoption: { en: 'Adoption', fr: 'Adoption', ar: 'التبني' },
  risk_sponsorship: { en: 'Sponsorship', fr: 'Sponsoring', ar: 'الرعاية' },
  risk_capacity: { en: 'Capacity', fr: 'Capacité', ar: 'القدرة' },
  risk_saturation: { en: 'Saturation', fr: 'Saturation', ar: 'التشبع' },
  likelihood: { en: 'Likelihood', fr: 'Probabilité', ar: 'الاحتمالية' },
  impact: { en: 'Impact', fr: 'Impact', ar: 'الأثر' },
  riskScore: { en: 'Risk Score', fr: 'Score de risque', ar: 'درجة الخطر' },

  // ---------- Module 15 ----------
  m15_title: { en: 'Metrics & Analytics Dashboard', fr: 'Tableau de bord des indicateurs et analyses', ar: 'لوحة المقاييس والتحليلات' },
  m15_desc: { en: 'Composite Readiness Index, adoption curves, and correlation analysis.', fr: 'Indice composite de préparation, courbes d’adoption et analyse de corrélation.', ar: 'مؤشر الجاهزية المركب، منحنيات التبني، وتحليل الارتباط.' },
  readinessIndex: { en: 'Composite Readiness Index', fr: 'Indice composite de préparation', ar: 'مؤشر الجاهزية المركب' },
  adoptionCurve: { en: 'Adoption Curve', fr: 'Courbe d’adoption', ar: 'منحنى التبني' },
  heatmapByDept: { en: 'ADKAR Heatmap', fr: 'Carte thermique ADKAR', ar: 'خريطة ADKAR الحرارية' },
  execNarrative: { en: 'Executive Readiness Narrative', fr: 'Narratif de préparation exécutif', ar: 'سرد الجاهزية التنفيذي' },

  // ---------- Module 16 ----------
  m16_title: { en: 'Journey Map / Visual Core', fr: 'Carte du parcours / Cœur visuel', ar: 'خريطة الرحلة / النواة البصرية' },
  m16_desc: { en: 'A literal, visual timeline combining ADKAR stage, Bridges phase and sentiment.', fr: 'Une chronologie visuelle combinant l’étape ADKAR, la phase de Bridges et le sentiment.', ar: 'جدول زمني بصري يجمع مرحلة ADKAR وطور بريدجز والمشاعر.' },
  zoomLevel: { en: 'Zoom Level', fr: 'Niveau de zoom', ar: 'مستوى التكبير' },
  shareSnapshot: { en: 'Share Snapshot', fr: 'Partager l’instantané', ar: 'مشاركة لقطة' },

  // ---------- Module 17 ----------
  m17_title: { en: 'AI Use Case Library & Governance', fr: 'Bibliothèque et gouvernance des cas d’usage IA', ar: 'مكتبة وحوكمة حالات استخدام الذكاء الاصطناعي' },
  m17_desc: { en: 'A governed catalog of Assistive and Augmented AI use cases. No use case acts autonomously.', fr: 'Un catalogue gouverné de cas d’usage IA assistifs et augmentés. Aucun cas n’agit de façon autonome.', ar: 'كتالوج محكوم لحالات استخدام الذكاء الاصطناعي المساعد والمعزز. لا تعمل أي حالة بشكل مستقل.' },
  activateForOrg: { en: 'Active for this Organization', fr: 'Actif pour cette organisation', ar: 'مفعّل لهذه المؤسسة' },
  activateForProject: { en: 'Project-level override', fr: 'Dérogation au niveau du projet', ar: 'استثناء على مستوى المشروع' },
  humanCheckpoint: { en: 'Human Checkpoint', fr: 'Point de contrôle humain', ar: 'نقطة التحقق البشرية' },
  triggerInput: { en: 'Trigger / Input', fr: 'Déclencheur / Entrée', ar: 'المُحفِّز / المُدخل' },
  output: { en: 'Output', fr: 'Sortie', ar: 'المُخرج' },
  usageLog: { en: 'AI Usage & Override Log', fr: 'Journal d’utilisation et de dérogation IA', ar: 'سجل استخدام وتجاوز الذكاء الاصطناعي' },
  outcome_accepted: { en: 'Accepted as-is', fr: 'Accepté tel quel', ar: 'مقبول كما هو' },
  outcome_edited: { en: 'Edited', fr: 'Modifié', ar: 'مُعدَّل' },
  outcome_rejected: { en: 'Rejected', fr: 'Rejeté', ar: 'مرفوض' },

  // ---------- Dashboard ----------
  activeInitiatives: { en: 'Active Initiatives', fr: 'Initiatives actives', ar: 'المبادرات النشطة' },
  avgReadiness: { en: 'Avg. Readiness Index', fr: 'Indice de préparation moyen', ar: 'متوسط مؤشر الجاهزية' },
  openRisks: { en: 'Open Risks', fr: 'Risques ouverts', ar: 'المخاطر المفتوحة' },
  peopleInScope: { en: 'People in Scope', fr: 'Personnes concernées', ar: 'الأشخاص المعنيون' },
  portfolioByPhase: { en: 'Portfolio by Lewin Phase', fr: 'Portefeuille par phase de Lewin', ar: 'المحفظة حسب مرحلة لوين' },

  // Sectors / archetypes
  sector_manufacturing: { en: 'Manufacturing', fr: 'Industrie manufacturière', ar: 'الصناعة التحويلية' },
  sector_logistics: { en: 'Logistics & Transportation', fr: 'Logistique et transport', ar: 'الخدمات اللوجستية والنقل' },
  sector_health: { en: 'Health', fr: 'Santé', ar: 'الصحة' },
  archetype_erp: { en: 'ERP Implementation', fr: 'Mise en œuvre ERP', ar: 'تنفيذ نظام تخطيط الموارد' },
  archetype_automation: { en: 'Process Automation', fr: 'Automatisation des processus', ar: 'أتمتة العمليات' },
  archetype_qms: { en: 'QMS Implementation', fr: 'Mise en œuvre SMQ', ar: 'تنفيذ نظام إدارة الجودة' },
}

export default dict
