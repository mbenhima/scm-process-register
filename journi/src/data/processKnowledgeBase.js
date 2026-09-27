// D-Config item 7: seeded RAG knowledge base, one article per Macro Process
// (macroProcesses.js), giving Query Data, Query Features, and the "Ask
// journi" chatbot real practitioner guidance to retrieve for a step-scoped
// question ("how do we run stakeholder assessment", "what's a good
// escalation cadence"), instead of only ever indexing the tenant's own
// live records and the static module-feature catalog.
//
// Indexed server-side by server/lib/corpus/processKnowledge.js, which
// imports this file directly (same cross-boundary import pattern already
// used for macroProcesses.js / rbac.js). title/body are {en,fr,ar},
// resolved client-side via useI18n()'s tv().
const processKnowledgeBase = [
  {
    id: 'KB-MP-01',
    mpId: 'MP-01',
    title: { en: 'Running a Change Impact & Stakeholder Assessment', fr: 'Mener une évaluation de l’impact du changement et des parties prenantes', ar: 'إجراء تقييم لأثر التغيير وأصحاب المصلحة' },
    body: {
      en: 'Start by listing every group whose day-to-day work changes — not just the org chart, but shift patterns, sub-contracted teams, and satellite sites. Score each group on five impact dimensions: process, technology, role, location, and identity, using a 1-5 scale with a mandatory justification at 4 or above. Groups scoring 4-5 on two or more dimensions are your priority resistance-mitigation targets, not an afterthought for later phases. Re-run the assessment at every major scope change, not just once at kickoff — impact tends to widen, not narrow, as a program matures.',
      fr: 'Commencez par lister tous les groupes dont le travail quotidien change — pas seulement l’organigramme, mais aussi les équipes en horaires postés, sous-traitées ou sur des sites satellites. Notez chaque groupe sur cinq dimensions d’impact (processus, technologie, rôle, localisation, identité) sur une échelle de 1 à 5, avec justification obligatoire à partir de 4. Les groupes notés 4-5 sur deux dimensions ou plus sont vos cibles prioritaires d’atténuation de la résistance, pas un sujet à traiter plus tard. Relancez l’évaluation à chaque changement de périmètre majeur, pas seulement au lancement — l’impact a tendance à s’élargir, pas à se réduire, à mesure que le programme avance.',
      ar: 'ابدأ بإدراج كل مجموعة يتغيّر عملها اليومي — ليس فقط الهيكل التنظيمي، بل أيضًا أنماط الورديات والفرق المتعاقد معها والمواقع الفرعية. قيّم كل مجموعة على خمسة أبعاد للأثر: العملية، التقنية، الدور، الموقع، والهوية، على مقياس من 1 إلى 5 مع تبرير إلزامي عند 4 فما فوق. المجموعات التي تحصل على 4-5 في بعدين أو أكثر هي أهدافك ذات الأولوية لتخفيف المقاومة، وليست أمرًا يُؤجَّل. أعد إجراء التقييم عند كل تغيير كبير في النطاق، وليس فقط عند الانطلاق — فالأثر يميل إلى الاتساع لا التقلص مع تقدم البرنامج.',
    },
  },
  {
    id: 'KB-MP-02',
    mpId: 'MP-02',
    title: { en: 'Keeping a Sponsor Coalition Active, Not Just Appointed', fr: 'Maintenir une coalition de sponsors active, pas seulement nommée', ar: 'الحفاظ على ائتلاف رعاة نشط لا مجرد معيّن' },
    body: {
      en: 'A sponsor appointed at kickoff and never heard from again is the single most common root cause of stalled change programs. Track visible-support actions (a sponsor speaking at an all-hands, personally following up with a resistant manager) separately from administrative sign-offs — the two are not the same signal. Set a governance cadence (steering committee, 1:1 sponsor check-in) and alert when it lapses for more than three weeks. When escalation is needed, route it to the sponsor coalition first, not directly to HR or IT, so accountability for the decision stays with the people who own the outcome.',
      fr: 'Un sponsor nommé au lancement puis silencieux est la cause première la plus fréquente d’un programme de changement à l’arrêt. Suivez les actions de soutien visible (un sponsor s’exprimant en réunion plénière, relançant personnellement un manager résistant) séparément des validations administratives — ce ne sont pas le même signal. Fixez un rythme de gouvernance (comité de pilotage, point 1:1 avec le sponsor) et alertez en cas d’interruption de plus de trois semaines. En cas d’escalade nécessaire, orientez-la d’abord vers la coalition des sponsors, pas directement vers les RH ou l’IT, afin que la responsabilité de la décision reste chez ceux qui en portent le résultat.',
      ar: 'الراعي الذي يُعيَّن عند الانطلاق ثم يختفي هو السبب الجذري الأكثر شيوعًا لتوقف برامج التغيير. تابع إجراءات الدعم الظاهر (حديث الراعي في اجتماع عام، متابعته الشخصية مع مدير مقاوم) بشكل منفصل عن الموافقات الإدارية — فهما إشارتان مختلفتان. حدد وتيرة حوكمة (لجنة توجيهية، لقاء فردي مع الراعي) ونبّه عند انقطاعها لأكثر من ثلاثة أسابيع. عند الحاجة إلى التصعيد، وجّهه أولًا إلى ائتلاف الرعاة وليس مباشرة إلى الموارد البشرية أو تقنية المعلومات، حتى تبقى مسؤولية القرار لدى من يملك نتيجته.',
    },
  },
  {
    id: 'KB-MP-03',
    mpId: 'MP-03',
    title: { en: 'Pacing a Communications Cadence Without Causing Fatigue', fr: 'Rythmer les communications sans provoquer de lassitude', ar: 'ضبط وتيرة الاتصال دون إرهاق الجمهور' },
    body: {
      en: 'The goal of a communications plan is measurable Awareness lift, not message volume. Segment cadence by cohort — a frontline shift worker and an office-based manager should not receive the same channel or frequency. Track open/read rates and Awareness ADKAR movement together; a high send count with flat Awareness scores means the channel or message is wrong, not that you need to send more. When AI drafts a message at scale (Augmented tier), always route it through a named human reviewer before distribution — the review is not a formality, it is what keeps tone and local context correct.',
      fr: 'L’objectif d’un plan de communication est un gain mesurable de Sensibilisation, pas un volume de messages. Segmentez le rythme par cohorte — un opérateur posté et un manager de bureau ne doivent pas recevoir le même canal ni la même fréquence. Suivez ensemble les taux d’ouverture/lecture et la progression du score ADKAR Sensibilisation ; un volume élevé d’envois avec un score stable signifie que le canal ou le message est inadapté, pas qu’il faut envoyer davantage. Lorsqu’une IA rédige un message à grande échelle (palier Augmenté), faites-le toujours relire par une personne nommément désignée avant diffusion — cette relecture n’est pas une formalité, elle garantit la justesse du ton et du contexte local.',
      ar: 'هدف خطة الاتصال هو رفع قابل للقياس في الوعي، لا حجم الرسائل. قسّم الوتيرة حسب الفئة — فعامل ورديات ميداني ومدير مكتبي لا ينبغي أن يتلقيا نفس القناة أو التكرار. تابع معدلات الفتح/القراءة مع تحرك درجة الوعي في ADKAR معًا؛ فارتفاع عدد الإرسالات مع ثبات درجة الوعي يعني أن القناة أو الرسالة غير مناسبة، لا أن الحاجة أكبر للإرسال. عندما يصوغ الذكاء الاصطناعي رسالة على نطاق واسع (المستوى المعزز)، وجّهها دائمًا إلى مراجع بشري محدد قبل التوزيع — فالمراجعة ليست إجراءً شكليًا بل ما يضمن صحة النبرة والسياق المحلي.',
    },
  },
  {
    id: 'KB-MP-04',
    mpId: 'MP-04',
    title: { en: 'Classifying Resistance by Root Cause Before Reacting', fr: 'Classer la résistance par cause racine avant de réagir', ar: 'تصنيف المقاومة حسب السبب الجذري قبل التعامل معها' },
    body: {
      en: 'Not all resistance needs the same response. Role resistance ("this isn\'t my job anymore") responds to job-design clarification; skill resistance responds to training; will resistance needs sponsor visibility and incentive alignment; systemic resistance (a process or policy that structurally punishes the new behavior) needs a design fix, not more coaching. Logging a resistance entry without a type classification is the most common reason mitigation actions fail — you end up training people who were never lacking skill in the first place. Watch for clusters: three or more same-type entries in one department in a short window is a pattern, not three isolated incidents.',
      fr: 'Toutes les résistances n’appellent pas la même réponse. La résistance de rôle (« ce n’est plus mon travail ») se traite par une clarification de la fiche de poste ; la résistance de compétence par la formation ; la résistance de volonté nécessite de la visibilité sponsor et un alignement des incitations ; la résistance systémique (un processus ou une règle qui pénalise structurellement le nouveau comportement) nécessite une correction de conception, pas plus de coaching. Consigner une résistance sans la classer par type est la cause la plus fréquente d’échec des actions d’atténuation — on finit par former des personnes qui n’avaient jamais de déficit de compétence. Surveillez les grappes : trois entrées de même type ou plus dans un même service sur une courte période sont un motif, pas trois incidents isolés.',
      ar: 'ليست كل مقاومة تستدعي نفس الاستجابة. مقاومة الدور ("لم يعد هذا عملي") تُعالَج بتوضيح تصميم الوظيفة؛ مقاومة المهارة تُعالَج بالتدريب؛ مقاومة الإرادة تحتاج إلى ظهور الراعي ومواءمة الحوافز؛ أما المقاومة المنهجية (عملية أو سياسة تعاقب هيكليًا السلوك الجديد) فتحتاج إلى إصلاح في التصميم لا مزيدًا من التوجيه. تسجيل حالة مقاومة دون تصنيف نوعها هو السبب الأكثر شيوعًا لفشل إجراءات التخفيف — إذ ينتهي الأمر بتدريب أشخاص لم يكونوا يفتقرون للمهارة أصلًا. راقب التجمعات: ثلاث حالات من نفس النوع أو أكثر في قسم واحد خلال فترة قصيرة تُمثّل نمطًا لا ثلاث حوادث معزولة.',
    },
  },
  {
    id: 'KB-MP-05',
    mpId: 'MP-05',
    title: { en: 'Designing Training to Move Knowledge and Ability, Not Just Attendance', fr: 'Concevoir la formation pour faire progresser Connaissance et Capacité, pas seulement la présence', ar: 'تصميم التدريب لرفع المعرفة والقدرة لا لمجرد الحضور' },
    body: {
      en: 'Completion rate measures attendance; it does not measure whether the ADKAR Knowledge and Ability blocks actually moved. Pair every curriculum with a pre/post competency check, and treat a high completion rate with flat Ability scores as a design failure in the curriculum, not a success. Map curriculum to role before training starts — a role with no assigned curriculum will surface as a readiness gap at the worst possible time, right before go-live. Certification should gate go-live readiness, not just get logged for compliance records.',
      fr: 'Le taux d’achèvement mesure la présence, pas si les blocs ADKAR Connaissance et Capacité ont réellement progressé. Associez chaque programme à un contrôle de compétence avant/après, et considérez un taux d’achèvement élevé avec des scores de Capacité stables comme un échec de conception du programme, pas un succès. Associez le programme au rôle avant le début de la formation — un rôle sans programme assigné apparaîtra comme un écart de préparation au pire moment possible, juste avant le déploiement. La certification doit conditionner la préparation au déploiement, pas seulement être consignée à des fins de conformité.',
      ar: 'يقيس معدل الإنجاز الحضور فقط، لا ما إذا كانت عناصر المعرفة والقدرة في ADKAR قد تحركت فعلًا. اقرن كل منهج باختبار كفاءة قبل وبعد، واعتبر ارتفاع معدل الإنجاز مع ثبات درجات القدرة فشلاً في تصميم المنهج لا نجاحًا. اربط المنهج بالدور قبل بدء التدريب — فالدور بلا منهج مخصص سيظهر كفجوة جاهزية في أسوأ توقيت ممكن، قبيل الإطلاق مباشرة. ينبغي أن تكون الشهادة شرطًا لجاهزية الإطلاق، لا مجرد سجل لأغراض الامتثال.',
    },
  },
  {
    id: 'KB-MP-06',
    mpId: 'MP-06',
    title: { en: 'Sizing and Sustaining a Champion Network', fr: 'Dimensionner et pérenniser un réseau de champions', ar: 'تحديد حجم شبكة سفراء التغيير واستدامتها' },
    body: {
      en: 'A workable starting ratio is one champion per 25 employees, denser in business units with higher measured resistance. Champions are early-warning sensors, not communication distribution channels — measure them on signals surfaced and triaged, not on messages forwarded. Every signal needs a triage decision (accepted/rejected) within days, or champions stop reporting because they see no response. The strongest champions are a sustainment asset: identify who is still active at 90 days post go-live and consider formalizing that role rather than letting the network dissolve.',
      fr: 'Un ratio de départ réaliste est un champion pour 25 employés, plus dense dans les unités où la résistance mesurée est plus forte. Les champions sont des capteurs d’alerte précoce, pas des canaux de diffusion — mesurez-les sur les signaux remontés et triés, pas sur les messages relayés. Chaque signal nécessite une décision de tri (accepté/rejeté) sous quelques jours, sinon les champions cessent de remonter l’information faute de retour. Les champions les plus actifs sont un atout de pérennisation : identifiez qui est encore actif 90 jours après le déploiement et envisagez de formaliser ce rôle plutôt que de laisser le réseau se dissoudre.',
      ar: 'نسبة بداية عملية هي سفير واحد لكل 25 موظفًا، وأكثر كثافة في الوحدات ذات المقاومة الأعلى قياسًا. السفراء هم أجهزة إنذار مبكر لا قنوات توزيع اتصالات — قيّمهم بناءً على الإشارات التي يرفعونها ويتم فرزها، لا بعدد الرسائل المُعاد توجيهها. تحتاج كل إشارة إلى قرار فرز (قبول/رفض) خلال أيام، وإلا توقف السفراء عن الإبلاغ لعدم رؤية أي استجابة. أنشط السفراء أصل استدامة: حدد من لا يزال نشطًا بعد 90 يومًا من الإطلاق وفكّر في إضفاء الطابع الرسمي على هذا الدور بدلًا من ترك الشبكة تتلاشى.',
    },
  },
  {
    id: 'KB-MP-07',
    mpId: 'MP-07',
    title: { en: 'Reading the Composite Readiness Index Correctly', fr: 'Bien interpréter l’Indice composite de préparation', ar: 'قراءة مؤشر الجاهزية المركب بشكل صحيح' },
    body: {
      en: 'The CRI is only meaningful against its phase-appropriate benchmark band, never as an absolute number — a CRI of 65 can be "ahead" in an early Lewin Unfreeze phase and "behind" in late Refreeze. A CRI plateau despite continued sponsor and training investment is itself a signal: it usually means the measurement is missing a dimension (often emotional/transition data from Bridges tracking) rather than that readiness has genuinely stalled. Every score feeding the index should be stage-then-justify — never let a status change post without a recorded reason, or the audit trail that makes the index defensible to a board or regulator collapses.',
      fr: 'L’Indice composite de préparation (CRI) n’a de sens que rapporté à sa bande de référence propre à la phase, jamais comme valeur absolue — un CRI de 65 peut être « en avance » en début de phase de Décristallisation (Lewin) et « en retard » en fin de Recristallisation. Un plateau du CRI malgré un investissement continu en sponsoring et en formation est lui-même un signal : cela signifie généralement qu’il manque une dimension à la mesure (souvent les données émotionnelles/de transition issues du suivi Bridges) plutôt qu’un réel blocage de la préparation. Chaque score alimentant l’indice doit suivre le principe stage-then-justify — ne jamais laisser un changement de statut être enregistré sans motif consigné, sous peine d’effondrer la piste d’audit qui rend l’indice défendable devant un conseil ou un régulateur.',
      ar: 'مؤشر الجاهزية المركب لا معنى له إلا مقارنة بنطاقه المرجعي الخاص بالمرحلة، لا كقيمة مطلقة — فمؤشر بقيمة 65 قد يكون "متقدمًا" في مرحلة إذابة مبكرة (لوين) و"متأخرًا" في مرحلة إعادة تجميد متأخرة. ثبات المؤشر رغم استمرار الاستثمار في الرعاية والتدريب هو إشارة بحد ذاته: غالبًا ما يعني أن القياس يفتقد بُعدًا (غالبًا بيانات الانتقال العاطفي من تتبع بريدجز) وليس أن الجاهزية توقفت فعلًا. يجب أن يخضع كل تقييم يغذي المؤشر لمبدأ "التقييم ثم التبرير" — لا تسمح أبدًا بتغيير حالة دون سبب مسجل، وإلا انهار سجل التدقيق الذي يجعل المؤشر قابلاً للدفاع أمام مجلس إدارة أو جهة تنظيمية.',
    },
  },
  {
    id: 'KB-MP-08',
    mpId: 'MP-08',
    title: { en: 'Spotting Schedule-Adoption Divergence Early', fr: 'Détecter précocement la divergence planning-adoption', ar: 'الكشف المبكر عن انحراف الجدول عن التبني' },
    body: {
      en: 'The most dangerous risk pattern is a project that looks "green" on the WBS/Gantt (on schedule, on budget) while adoption signals quietly decline — the schedule tells you the deliverable shipped, not that people changed how they work. Cross-check phase percent-complete against ADKAR/sentiment trend at every steering checkpoint, not just at gates. Change saturation — several concurrent projects hitting the same business unit — compounds adoption risk in a way no single project\'s risk register will show; it needs an organization-level view. A high-severity risk left open for more than five days without a linked mitigation action is functionally an unmanaged risk, whatever its score says.',
      fr: 'Le motif de risque le plus dangereux est un projet qui paraît « vert » sur le WBS/Gantt (dans les délais, dans le budget) alors que les signaux d’adoption déclinent discrètement — le planning indique que le livrable est sorti, pas que les personnes ont changé leur façon de travailler. Croisez le pourcentage d’avancement de phase avec la tendance ADKAR/sentiment à chaque point de pilotage, pas seulement aux jalons. La saturation du changement — plusieurs projets concurrents touchant la même unité — amplifie le risque d’adoption d’une manière qu’aucun registre de risques d’un seul projet ne montrera ; elle nécessite une vue au niveau de l’organisation. Un risque de sévérité élevée laissé ouvert plus de cinq jours sans action d’atténuation associée est, dans les faits, un risque non géré, quel que soit son score.',
      ar: 'أخطر نمط للمخاطر هو مشروع يبدو "أخضر" في الجدول الزمني (في الموعد وضمن الميزانية) بينما تتراجع إشارات التبني بهدوء — فالجدول يخبرك أن المُخرج سُلِّم، لا أن الناس غيّروا طريقة عملهم. قارن نسبة إنجاز المرحلة مع اتجاه ADKAR/المزاج في كل نقطة توجيهية، لا فقط عند البوابات. تشبع التغيير — عدة مشاريع متزامنة تصيب نفس الوحدة — يضاعف مخاطر التبني بطريقة لن يظهرها سجل مخاطر أي مشروع منفرد؛ فهو يحتاج إلى رؤية على مستوى المؤسسة. المخاطرة عالية الخطورة التي تُترك مفتوحة لأكثر من خمسة أيام دون إجراء تخفيف مرتبط بها هي عمليًا مخاطرة غير مُدارة، مهما كانت درجتها.',
    },
  },
  {
    id: 'KB-MP-09',
    mpId: 'MP-09',
    title: { en: 'Running Hypercare Without Burning Out the Floor', fr: 'Assurer l’hypercare sans épuiser le terrain', ar: 'إدارة الرعاية المكثفة دون إرهاق الميدان' },
    body: {
      en: 'Hypercare is the highest-risk window for adoption to quietly fail, because the project team\'s attention shifts to close-out exactly when floor staff are least confident. Track ticket backlog and time-to-resolution daily, not weekly — a growing backlog three days after go-live is a leading indicator of a support-model gap, not a one-off spike. Manager-as-coach conversations should be spot-checked against a quality rubric, not just counted, since a high volume of low-quality coaching moments does not move Ability scores. Do not close hypercare while any coaching note remains open — that gap is exactly where users quietly revert to the old way of working.',
      fr: 'L’hypercare est la fenêtre à plus haut risque d’échec silencieux de l’adoption, car l’attention de l’équipe projet bascule vers la clôture précisément quand le personnel de terrain est le moins confiant. Suivez le backlog de tickets et le délai de résolution quotidiennement, pas hebdomadairement — un backlog en croissance trois jours après le déploiement est un indicateur avancé d’un défaut du modèle de support, pas un pic isolé. Les conversations de coaching managérial doivent être auditées par échantillonnage sur une grille de qualité, pas seulement comptées, car un volume élevé de moments de coaching de faible qualité ne fait pas progresser les scores de Capacité. Ne clôturez pas l’hypercare tant qu’une note de coaching reste ouverte — c’est exactement là que les utilisateurs reviennent discrètement à l’ancienne façon de travailler.',
      ar: 'الرعاية المكثفة هي النافذة الأعلى خطورة لفشل التبني بصمت، لأن انتباه فريق المشروع ينتقل إلى الإغلاق تمامًا حين يكون الموظفون الميدانيون أقل ثقة. تابع تراكم التذاكر ووقت الحل يوميًا لا أسبوعيًا — فتراكم متزايد بعد ثلاثة أيام من الإطلاق مؤشر مبكر على فجوة في نموذج الدعم، لا طفرة عابرة. ينبغي تدقيق محادثات "المدير كموجّه" عينيًا وفق معيار جودة، لا مجرد عدّها، لأن كثرة لحظات التوجيه المنخفضة الجودة لا ترفع درجات القدرة. لا تُغلق الرعاية المكثفة ما دامت أي ملاحظة توجيه مفتوحة — فتلك بالضبط هي النقطة التي يعود فيها المستخدمون بهدوء إلى طريقة العمل القديمة.',
    },
  },
  {
    id: 'KB-MP-10',
    mpId: 'MP-10',
    title: { en: 'Making Sustainment Outlast the Project Close-Out', fr: 'Faire durer la pérennisation au-delà de la clôture du projet', ar: 'جعل الاستدامة تتجاوز إغلاق المشروع' },
    body: {
      en: 'Adoption measured at go-live is a snapshot, not proof of sustainment — track retention at 30/60/90 days against the go-live baseline, and treat any drop below roughly 95% retained as a signal the reinforcement plan needs to restart, not just a footnote. A project cannot be considered properly closed without at least one documented lesson learned; skipping this step is the single biggest reason the same avoidable mistakes recur in the next initiative\'s Business Analysis. Quick wins captured during the project are a sustainment asset too — resurface them in leadership reporting well after go-live, not only during the program itself, since visible wins are what keep reinforcement funded once the project team disbands.',
      fr: 'L’adoption mesurée au déploiement est un instantané, pas une preuve de pérennisation — suivez la rétention à 30/60/90 jours par rapport au niveau de référence du déploiement, et considérez toute baisse en dessous d’environ 95 % de rétention comme un signal qu’il faut relancer le plan de renforcement, pas une simple note de bas de page. Un projet ne peut être considéré comme correctement clôturé sans au moins un enseignement documenté ; sauter cette étape est la première cause de répétition des mêmes erreurs évitables dans la Business Analysis de l’initiative suivante. Les victoires rapides captées pendant le projet sont aussi un atout de pérennisation — remontez-les dans le reporting de direction bien après le déploiement, pas seulement pendant le programme, car ce sont ces victoires visibles qui maintiennent le financement du renforcement une fois l’équipe projet dissoute.',
      ar: 'التبني المُقاس عند الإطلاق هو لقطة لحظية لا دليل على الاستدامة — تابع الاحتفاظ بالتبني عند 30/60/90 يومًا مقارنة بخط الأساس عند الإطلاق، واعتبر أي انخفاض دون نحو 95% إشارة على ضرورة إعادة إطلاق خطة التعزيز، لا مجرد ملاحظة هامشية. لا يمكن اعتبار المشروع مُغلقًا بشكل سليم دون توثيق درس مستفاد واحد على الأقل؛ وتخطي هذه الخطوة هو السبب الأكبر لتكرار نفس الأخطاء القابلة للتجنب في تحليل الأعمال للمبادرة التالية. المكاسب السريعة التي تُلتقط أثناء المشروع هي أصل استدامة أيضًا — أعد إبرازها في تقارير القيادة بعد الإطلاق بوقت طويل، لا أثناء البرنامج فقط، لأن هذه المكاسب الظاهرة هي ما يُبقي تمويل التعزيز قائمًا بعد تفكك فريق المشروع.',
    },
  },
]

export default processKnowledgeBase
