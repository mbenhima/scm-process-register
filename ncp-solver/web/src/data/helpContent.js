// Static, translated content for the in-app Help / user guide (nav.help).
// Kept separate from translations.js because each topic is a long-form
// article rather than a short UI label.

export const HELP_TOPICS = {
  en: [
    {
      id: 'getting-started',
      title: 'Getting Started',
      body: [
        'NCP Solver — DynamicMS Suite is a multi-tenant platform: every screen you see is scoped to the Organization your account belongs to. Sign in with the email and demo password shown on the login screen.',
        'Once signed in, the left sidebar groups every module: the core NCP process (Dashboard, NCP Sheets, My Actions, Capitalization, Standards, AI Use Cases), Identity & RBAC (Hierarchy, OBS, Users, Permission Matrix), Governance, Risk & Compliance (Business Rules, Controls, Risks & Opportunities, RACSI Matrix), and Governance settings (Governance, License & Plan). What you can see and edit depends entirely on the permissions granted to your role.',
        'Use the language switcher in the top-right header to change between English, French and Arabic at any time — the whole interface, including layout direction, adapts immediately.',
      ],
    },
    {
      id: 'ncp-process',
      title: 'The NCP Solver Process (S1–S7)',
      body: [
        'Every non-conformity or problem raised in the system moves through seven standard stages, tracked on each NCP Sheet:',
        'S1 — Detection & Alert: the problem is logged with its basic facts and an initial alert is raised.',
        'S2 — Problem Understanding: the team structures the problem using the 5W2H method (What, Who, Where, When, How, How much) before deciding on any action.',
        'S3 — Immediate / Containment Actions: short-term action to contain the non-conformity and protect the customer or process from further exposure.',
        'S4 — Root Cause Analysis: the team identifies and validates the true root cause(s), typically with 5-Why or Ishikawa analysis.',
        'S5 — Corrective Action Plan: a permanent fix is defined, resourced and implemented against the validated root cause.',
        'S6 — Effectiveness Evaluation: after a monitoring period, an evaluator verifies the corrective action actually worked and records the verdict.',
        'S7 — Capitalization (REX): lessons learned are published to the Capitalization Library, with an assessment of whether the fix should be standardized or generalized elsewhere.',
        'The RACSI Matrix module lets you see, for every one of these seven steps, exactly who is Accountable, Responsible, Consulted, Supporting and Informed.',
      ],
    },
    {
      id: 'hierarchy-obs',
      title: 'Hierarchy & Organizational Breakdown Structure (OBS)',
      body: [
        'The Hierarchy module models your tenant structure: an optional Group (a holding company) contains one or more Organizations, and each Organization can run one or more Projects.',
        'OBS (Organizational Breakdown Structure) is the operational org chart inside one Organization: Site → Department → Service → Team. It is not decorative — OBS nodes are actively linked across the platform: NCP Sheets, Business Rules, Controls, Risks & Opportunities and RACSI activities can all be tagged with the OBS unit that owns them, and every user has a "home" OBS node through their role assignment.',
        'On the OBS screen, each node shows counts of everything linked to it (people, NCP Sheets, Business Rules, Controls, Risks & Opportunities, RACSI activities) so you can see at a glance which parts of the organization carry the most activity or accountability.',
      ],
    },
    {
      id: 'identity-rbac',
      title: 'Identity & RBAC',
      body: [
        'Users & Scope lists every account in your Organization, the role(s) assigned to them, and — where relevant — the OBS node or Project that scopes their access.',
        'The Permission Matrix shows every role against every permission in the system (module.action codes, e.g. fiche.create, control.edit). Administrators can toggle any cell to grant or revoke a permission live.',
        'License & Plan shows your subscription tier (Starter / Professional / Enterprise), deployment model (SaaS or On-Premise), seat usage and billing cycle.',
      ],
    },
    {
      id: 'grc',
      title: 'Governance, Risk & Compliance (GRC)',
      body: [
        'Business Rules capture the "if/then" logic that governs the NCP process — validation, workflow, approval, naming, threshold or escalation rules — each with a severity (blocking, warning, info).',
        'Controls follow the COSO Internal Control – Integrated Framework: every control is tagged to one of the five COSO components (Control Environment, Risk Assessment, Control Activities, Information & Communication, Monitoring Activities), with a type (preventive/detective/corrective), a testing frequency, an owner and an effectiveness rating.',
        'Risks & Opportunities are scored on a 5×5 likelihood × impact matrix, colour-banded from red (severe) to dark green (negligible), and can be linked to one or more Controls that mitigate them. Both inherent and residual scores are tracked.',
        'All three modules can be tagged with the OBS unit that owns them, so you can trace governance accountability back to a specific site, department, service or team.',
      ],
    },
    {
      id: 'racsi',
      title: 'RACSI Accountability Matrix',
      body: [
        'RACSI extends the classic RACI model with a fifth role, Support: Responsible (does the work), Accountable (owns the outcome — exactly one per activity), Consulted (two-way input before the decision), Support (helps the Responsible party), and Informed (kept up to date, one-way).',
        'Every RACSI activity is either one of the seven NCP process steps (S1–S7) or a governance activity linked directly to a specific Business Rule, Control or Risk/Opportunity record — so accountability is never abstract, it always points at something real in the system.',
        'Assignees come from OBS: you can assign either a Role (org-wide accountability, e.g. "Quality Manager") or a specific Named Person (e.g. "Karim Benali"). The system enforces exactly one Accountable per activity — attempting to add a second is rejected — while Responsible, Consulted, Support and Informed can each carry multiple assignees, mixing roles and names freely.',
      ],
    },
    {
      id: 'ai-use-cases',
      title: 'AI Use Case Library',
      body: [
        'The AI Use Case Library catalogs applied-AI ideas and projects (predictive analytics, NLP, computer vision, RAG, optimization, anomaly detection) by business function and maturity stage (1 idea → 5 in production).',
        'Every use case has a version history. Version 1 is always the default. Editing a use case labels every section explicitly — Inputs, Prompt, Expected Output, Constraints & Guardrails, and Model/Technique Notes — and saving creates a new version with an optional change note rather than overwriting the previous one.',
        'You can revert to any earlier version at any time. Reverting duplicates that version\'s content into a brand-new version — the original history is never rewritten or deleted, so the full audit trail is always preserved.',
      ],
    },
    {
      id: 'capitalization-ai',
      title: 'Capitalization Library & AI Agents',
      body: [
        'The Capitalization Library is a searchable knowledge base of closed, published REX (lessons-learned) entries, powered by a lightweight retrieval engine (RAG) that ranks results by relevance to your search terms.',
        'Nine AI agents assist across the process — one for every process step, plus two cross-cutting ones: Classification (S1), Problem Structuring (S2), Containment Advisor (S3), Root Cause Mining (S4), Action Recommendation (S5), Evaluation Assistant (S6), REX Generation (S7), Monitoring & Alert (always on), and an Orchestrator that coordinates them. Every suggestion an agent makes is logged with a confidence score for full traceability — AI assists, it never silently overrides a human decision.',
      ],
    },
    {
      id: 'alerts-reports',
      title: 'Alerts & Reports',
      body: [
        'Alerts notify you when something in the process needs attention — overdue actions, pending evaluations, high-priority sheets, KPI threshold breaches, and more. The bell icon in the sidebar shows your unread count.',
        'Reports and Dashboards give KPI-level visibility: open/in-progress/closed sheet counts, action completion rates, stage cycle times, and sector- or department-level breakdowns, exportable for management review.',
      ],
    },
    {
      id: 'bpmn',
      title: 'BPMN Process Diagrams',
      body: [
        'The BPMN module (sidebar, Governance/Risk/Compliance group) stores and renders real BPMN 2.0 process diagrams using a genuine, in-browser BPMN modeler — not a screenshot or static image. It is seeded with a diagram of the NCP Solver process itself, S1 through S7, including the loop back to S5 when an S6 effectiveness evaluation comes back Not Effective.',
        'Access follows RBAC like every other module: anyone with bpmn.view can open a diagram and pan/zoom it read-only; only users holding bpmn.edit see the full editing palette (drag on tasks, gateways, and flows) and the Save Diagram button. Creating, editing, and deleting diagrams are full CRUD operations, each gated by its own permission (bpmn.create / bpmn.edit / bpmn.delete), exactly like Business Rules, Controls, or Risks & Opportunities.',
        'Use it to model the NCP Solver workflow as shipped, or to document any other process your organization wants a shared, versioned, visual reference for.',
      ],
    },
    {
      id: 'ai-assistant-llm',
      title: 'AI Assistant & AI Use Case Library',
      body: [
        'The AI Assistant (sidebar, top section) answers two kinds of questions in a chat-style interface, with no AI use case activation needed. "Query My Data" answers questions about your own organization\'s data — counts of open NCP sheets, overdue actions, high-severity risks, and more — computed live from the database and strictly limited by your role\'s permissions (RBAC-enforced): the same question asked by two different roles can return different results, or a polite refusal, never leaked data.',
        '"Ask About the Application" answers "Can it…?" and "How do I…?" questions about NCP Solver itself, drawn from a built-in application help knowledge base searched with the same lightweight retrieval engine (RAG) used by the Capitalization Library.',
        'The AI Use Cases Library (sidebar) is the governed catalog and control plane for every AI capability in NCP Solver — 14 use cases, each in one of two tiers: Assistive (suggests; a human decides) or Augmented (drafts a substantial part of the task; a human must review and approve). Autonomous AI is out of scope by design. An administrator can activate or deactivate each use case per Organization, and a CI Pilot can override that state for a single Project. Every AI-generated suggestion is labeled "AI-generated — review before use," discloses the methodology references (Standards) it was grounded in, and lets you Accept, mark Edited, or Reject it — logged to an append-only AI Usage Log.',
        'The Library also hosts the optional Real LLM Provider Connection: pick a provider (Anthropic, OpenAI, Azure OpenAI, Mistral, Ollama, or a custom OpenAI-compatible endpoint are actually callable in this build), enter a model and API key. This connection is stored only in your browser — never on the server, never in an export — and is used at most once per request; every use case falls back to its built-in deterministic generator automatically if no connection is set or a call fails, so nothing ever depends on it being configured.',
      ],
    },
    {
      id: 'faq',
      title: 'FAQ',
      body: [
        'Why can\'t I see a menu item? Access is permission-based. If a module is missing from your sidebar, your role does not currently hold the corresponding "view" permission — ask an Administrator to check the Permission Matrix.',
        'Why can I view but not edit something? Many roles are read-only or partially scoped by design (for example, an Evaluator can only record effectiveness verdicts, not edit the sheet itself).',
        'How do I change my language? Use the selector in the top-right header at any time — your preference is remembered on your account.',
        'Who do I contact for support? Your Organization Administrator manages user accounts and permissions; for platform-level questions, contact POWERACT Consulting.',
      ],
    },
  ],

  fr: [
    {
      id: 'getting-started',
      title: 'Prise en Main',
      body: [
        "NCP Solver — DynamicMS Suite est une plateforme multi-tenant : chaque écran est cantonné à l'Organisation à laquelle votre compte appartient. Connectez-vous avec l'email et le mot de passe de démonstration indiqués sur l'écran de connexion.",
        "Une fois connecté, le menu latéral regroupe chaque module : le processus MRP central (Tableau de Bord, Fiches MRP, Mes Actions, Capitalisation, Standards, Cas d'Usage IA), Identité & RBAC (Hiérarchie, OBS, Utilisateurs, Matrice des Permissions), Gouvernance, Risques & Conformité (Règles Métier, Contrôles, Risques & Opportunités, Matrice RACSI), et les paramètres de Gouvernance (Gouvernance, Licence & Plan). Ce que vous pouvez voir et modifier dépend entièrement des permissions accordées à votre rôle.",
        "Utilisez le sélecteur de langue en haut à droite pour basculer entre anglais, français et arabe à tout moment — toute l'interface, y compris le sens de lecture, s'adapte immédiatement.",
      ],
    },
    {
      id: 'ncp-process',
      title: 'Le Processus NCP Solver (S1–S7)',
      body: [
        'Chaque non-conformité ou problème signalé dans le système traverse sept étapes standard, suivies sur chaque Fiche MRP :',
        "S1 — Détection & Alerte : le problème est enregistré avec ses faits de base et une alerte initiale est déclenchée.",
        "S2 — Compréhension du Problème : l'équipe structure le problème avec la méthode 5W2H (Quoi, Qui, Où, Quand, Comment, Combien) avant toute décision d'action.",
        "S3 — Actions Immédiates / de Confinement : action à court terme pour contenir la non-conformité et protéger le client ou le processus.",
        "S4 — Analyse des Causes Racines : l'équipe identifie et valide la ou les véritables causes racines, généralement avec la méthode des 5 Pourquoi ou le diagramme d'Ishikawa.",
        "S5 — Plan d'Action Corrective : une solution pérenne est définie, dotée de ressources et mise en œuvre contre la cause racine validée.",
        "S6 — Évaluation de l'Efficacité : après une période de surveillance, un évaluateur vérifie que l'action corrective a réellement fonctionné et enregistre le verdict.",
        "S7 — Capitalisation (REX) : les enseignements sont publiés dans la Bibliothèque de Capitalisation, avec une évaluation de l'opportunité de standardiser ou généraliser la solution ailleurs.",
        "Le module Matrice RACSI permet de voir, pour chacune de ces sept étapes, qui est exactement Responsable, Approbateur, Consulté, en Soutien et Informé.",
      ],
    },
    {
      id: 'hierarchy-obs',
      title: "Hiérarchie & Organigramme d'Entreprise (OBS)",
      body: [
        "Le module Hiérarchie modélise la structure de votre tenant : un Groupe optionnel (une société holding) contient une ou plusieurs Organisations, et chaque Organisation peut piloter un ou plusieurs Projets.",
        "L'OBS (Organigramme d'Entreprise) est l'organigramme opérationnel au sein d'une Organisation : Site → Département → Service → Équipe. Il n'est pas décoratif — les nœuds OBS sont réellement liés à travers toute la plateforme : les Fiches MRP, Règles Métier, Contrôles, Risques & Opportunités et activités RACSI peuvent tous être rattachés à l'unité OBS qui en est propriétaire, et chaque utilisateur possède un nœud OBS « de rattachement » via son affectation de rôle.",
        "Sur l'écran OBS, chaque nœud affiche le nombre d'éléments qui lui sont liés (personnes, Fiches MRP, Règles Métier, Contrôles, Risques & Opportunités, activités RACSI), permettant de repérer en un coup d'œil les zones de l'organisation les plus actives.",
      ],
    },
    {
      id: 'identity-rbac',
      title: 'Identité & RBAC',
      body: [
        "« Utilisateurs & Périmètre » liste chaque compte de votre Organisation, le ou les rôles qui lui sont affectés et, le cas échéant, le nœud OBS ou le Projet qui délimite son accès.",
        "La Matrice des Permissions croise chaque rôle avec chaque permission du système (codes module.action, par ex. fiche.create, control.edit). Les administrateurs peuvent activer ou désactiver n'importe quelle case en direct.",
        "« Licence & Plan » affiche votre niveau d'abonnement (Starter / Professional / Enterprise), le modèle de déploiement (SaaS ou sur site), l'utilisation des sièges et le cycle de facturation.",
      ],
    },
    {
      id: 'grc',
      title: 'Gouvernance, Risques & Conformité (GRC)',
      body: [
        "Les Règles Métier capturent la logique « si/alors » qui régit le processus MRP — règles de validation, de workflow, d'approbation, de nommage, de seuil ou d'escalade — chacune avec une sévérité (bloquante, avertissement, information).",
        "Les Contrôles suivent le référentiel COSO (Internal Control – Integrated Framework) : chaque contrôle est rattaché à l'une des cinq composantes COSO (Environnement de Contrôle, Évaluation des Risques, Activités de Contrôle, Information & Communication, Activités de Pilotage), avec un type (préventif/détectif/correctif), une fréquence de test, un propriétaire et une notation d'efficacité.",
        "Les Risques & Opportunités sont notés sur une matrice probabilité × impact 5×5, colorée du rouge (sévère) au vert foncé (négligeable), et peuvent être liés à un ou plusieurs Contrôles qui les atténuent. Les scores inhérent et résiduel sont tous deux suivis.",
        "Les trois modules peuvent être rattachés à l'unité OBS qui en est propriétaire, permettant de faire remonter la responsabilité de gouvernance jusqu'à un site, département, service ou équipe précis.",
      ],
    },
    {
      id: 'racsi',
      title: 'Matrice de Responsabilité RACSI',
      body: [
        "RACSI étend le modèle RACI classique avec un cinquième rôle, Soutien : Réalise (exécute le travail), Approuve (porte le résultat — un seul par activité), Consulté (avis à double sens avant décision), Soutien (aide le réalisateur), et Informé (tenu au courant, à sens unique).",
        "Chaque activité RACSI correspond soit à l'une des sept étapes du processus MRP (S1–S7), soit à une activité de gouvernance directement liée à une Règle Métier, un Contrôle ou un Risque/Opportunité précis — la responsabilité n'est donc jamais abstraite, elle pointe toujours vers un élément réel du système.",
        "Les attributaires proviennent de l'OBS : vous pouvez affecter soit un Rôle (responsabilité valable dans toute l'organisation, ex. « Responsable Qualité ») soit une Personne Nommée précise (ex. « Karim Benali »). Le système impose un seul Approbateur par activité — toute tentative d'en ajouter un second est rejetée — tandis que Réalise, Consulté, Soutien et Informé peuvent chacun compter plusieurs attributaires, mêlant librement rôles et noms.",
      ],
    },
    {
      id: 'ai-use-cases',
      title: "Bibliothèque de Cas d'Usage IA",
      body: [
        "La Bibliothèque de Cas d'Usage IA recense les idées et projets d'IA appliquée (analyse prédictive, NLP, vision par ordinateur, RAG, optimisation, détection d'anomalies) par fonction métier et par stade de maturité (1 idée → 5 en production).",
        "Chaque cas d'usage possède un historique de versions. La version 1 est toujours la version par défaut. Modifier un cas d'usage étiquette explicitement chaque section — Entrées, Prompt, Résultat Attendu, Contraintes & Garde-fous, et Notes Modèle/Technique — et l'enregistrement crée une nouvelle version avec une note de changement optionnelle, sans jamais écraser la précédente.",
        "Vous pouvez revenir à n'importe quelle version antérieure à tout moment. Le retour en arrière duplique le contenu de cette version dans une toute nouvelle version — l'historique original n'est jamais réécrit ni supprimé, garantissant une traçabilité complète.",
      ],
    },
    {
      id: 'capitalization-ai',
      title: 'Bibliothèque de Capitalisation & Agents IA',
      body: [
        "La Bibliothèque de Capitalisation est une base de connaissances consultable des REX (retours d'expérience) clôturés et publiés, propulsée par un moteur de recherche léger (RAG) qui classe les résultats par pertinence par rapport à votre recherche.",
        "Neuf agents IA assistent le processus — un pour chaque étape, plus deux transversaux : Classification (S1), Structuration du Problème (S2), Conseiller en Confinement (S3), Extraction des Causes Racines (S4), Recommandation d'Actions (S5), Assistant d'Évaluation (S6), Génération de REX (S7), Surveillance & Alertes (permanent), et un Orchestrateur qui les coordonne. Chaque suggestion d'un agent est journalisée avec un score de confiance pour une traçabilité complète — l'IA assiste, elle ne remplace jamais silencieusement une décision humaine.",
      ],
    },
    {
      id: 'alerts-reports',
      title: 'Alertes & Rapports',
      body: [
        "Les Alertes vous notifient dès qu'un élément du processus requiert votre attention — actions en retard, évaluations en attente, fiches à haute priorité, dépassements de seuils KPI, etc. L'icône de cloche dans le menu latéral affiche votre nombre de notifications non lues.",
        "Les Rapports et Tableaux de Bord offrent une visibilité au niveau KPI : nombre de fiches ouvertes/en cours/clôturées, taux de complétion des actions, délais de cycle par étape, et répartitions par secteur ou département, exportables pour la revue de direction.",
      ],
    },
    {
      id: 'bpmn',
      title: 'Diagrammes de Processus BPMN',
      body: [
        "Le module BPMN (menu latéral, groupe Gouvernance/Risques/Conformité) stocke et affiche de véritables diagrammes de processus BPMN 2.0 grâce à un modeleur BPMN authentique intégré au navigateur — et non une capture d'écran ou une image statique. Il est initialisé avec un diagramme du processus NCP Solver lui-même, de S1 à S7, incluant la boucle de retour vers S5 lorsqu'une évaluation S6 de l'efficacité revient « Non Efficace ».",
        "L'accès suit le RBAC comme tout autre module : toute personne disposant de bpmn.view peut ouvrir un diagramme et le parcourir en lecture seule (zoom/déplacement) ; seuls les utilisateurs disposant de bpmn.edit voient la palette d'édition complète (glisser des tâches, passerelles et flux) et le bouton Enregistrer le Diagramme. La création, la modification et la suppression de diagrammes sont des opérations CRUD complètes, chacune protégée par sa propre permission (bpmn.create / bpmn.edit / bpmn.delete), exactement comme les Règles Métier, les Contrôles ou les Risques & Opportunités.",
        "Utilisez-le pour modéliser le workflow NCP Solver tel que livré, ou pour documenter tout autre processus pour lequel votre organisation souhaite une référence visuelle partagée et versionnée.",
      ],
    },
    {
      id: 'ai-assistant-llm',
      title: "Assistant IA & Bibliothèque de Cas d'Usage IA",
      body: [
        "L'Assistant IA (menu latéral, section supérieure) répond à deux types de questions dans une interface de type discussion, sans nécessiter l'activation d'un cas d'usage IA. « Interroger mes données » répond aux questions sur les données de votre propre organisation — nombre de fiches NCP ouvertes, actions en retard, risques à sévérité élevée, etc. — calculées en direct à partir de la base de données et strictement limitées par les permissions de votre rôle (contrôle RBAC) : la même question posée par deux rôles différents peut renvoyer des résultats différents, ou un refus poli, jamais de données divulguées.",
        "« Question sur l'application » répond aux questions du type « Est-ce que… ? » et « Comment… ? » sur NCP Solver lui-même, à partir d'une base de connaissances d'aide intégrée interrogée avec le même moteur de recherche léger (RAG) que la Bibliothèque de Capitalisation.",
        "La Bibliothèque de Cas d'Usage IA (menu latéral) est le catalogue gouverné et le plan de contrôle de toutes les capacités d'IA de NCP Solver — 14 cas d'usage, chacun dans l'un de deux niveaux : Assisté (suggère ; un humain décide) ou Augmenté (rédige une part substantielle de la tâche ; un humain doit relire et approuver). L'IA autonome est délibérément hors périmètre. Un administrateur peut activer ou désactiver chaque cas d'usage par Organisation, et un Pilote AC peut déroger à cet état pour un Projet donné. Chaque suggestion générée par IA est étiquetée « Généré par IA — à vérifier avant utilisation », divulgue les références méthodologiques (Référentiels) sur lesquelles elle s'appuie, et permet d'Accepter, de marquer comme Modifié, ou de Rejeter — journalisé dans un Journal d'Utilisation IA en ajout seul.",
        "La Bibliothèque héberge aussi la Connexion optionnelle à un Vrai Fournisseur LLM : choisissez un fournisseur (Anthropic, OpenAI, Azure OpenAI, Mistral, Ollama, ou un point de terminaison compatible OpenAI personnalisé sont réellement appelables dans cette version), saisissez un modèle et une clé API. Cette connexion est stockée uniquement dans votre navigateur — jamais sur le serveur, jamais dans un export — et n'est utilisée qu'une seule fois par requête au maximum ; chaque cas d'usage revient automatiquement à son générateur déterministe intégré si aucune connexion n'est configurée ou si un appel échoue, de sorte que rien ne dépend jamais de sa configuration.",
      ],
    },
    {
      id: 'faq',
      title: 'FAQ',
      body: [
        "Pourquoi je ne vois pas un élément de menu ? L'accès est basé sur les permissions. Si un module est absent de votre menu, votre rôle ne possède pas actuellement la permission « view » correspondante — demandez à un administrateur de vérifier la Matrice des Permissions.",
        "Pourquoi je peux voir mais pas modifier un élément ? De nombreux rôles sont volontairement en lecture seule ou à périmètre restreint (par exemple, un Évaluateur ne peut enregistrer que le verdict d'efficacité, pas modifier la fiche elle-même).",
        "Comment changer de langue ? Utilisez le sélecteur en haut à droite à tout moment — votre préférence est mémorisée sur votre compte.",
        "Qui contacter pour du support ? L'administrateur de votre Organisation gère les comptes et permissions ; pour les questions relatives à la plateforme, contactez POWERACT Consulting.",
      ],
    },
  ],

  ar: [
    {
      id: 'getting-started',
      title: 'بدء الاستخدام',
      body: [
        'يُعد NCP Solver — DynamicMS Suite منصة متعددة المستأجرين: كل شاشة تعمل ضمن نطاق المؤسسة التي ينتمي إليها حسابك. سجّل الدخول باستخدام البريد الإلكتروني وكلمة مرور العرض التوضيحي الظاهرة في شاشة تسجيل الدخول.',
        'بعد تسجيل الدخول، يجمّع القائمة الجانبية جميع الوحدات: عملية حل المشكلات الأساسية (لوحة التحكم، بطاقات حل المشكلات، مهامي، مكتبة الرسملة، المعايير، مكتبة حالات استخدام الذكاء الاصطناعي)، الهوية وإدارة الصلاحيات (الهيكل التنظيمي، هيكل تقسيم المنظمة OBS، المستخدمون، مصفوفة الصلاحيات)، الحوكمة والمخاطر والامتثال (قواعد العمل، الضوابط، المخاطر والفرص، مصفوفة RACSI)، وإعدادات الحوكمة (الحوكمة، الترخيص والخطة). ما يمكنك رؤيته وتعديله يعتمد كليًا على الصلاحيات الممنوحة لدورك.',
        'استخدم مبدّل اللغة أعلى يمين الشاشة للتبديل بين الإنجليزية والفرنسية والعربية في أي وقت — تتكيف الواجهة بأكملها، بما في ذلك اتجاه العرض، فورًا.',
      ],
    },
    {
      id: 'ncp-process',
      title: 'عملية NCP Solver (S1–S7)',
      body: [
        'يمر كل عدم مطابقة أو مشكلة يتم تسجيلها في النظام بسبع مراحل معيارية، يتم تتبعها على كل بطاقة حل مشكلة:',
        'S1 — الاكتشاف والتنبيه: يتم تسجيل المشكلة بحقائقها الأساسية ويُطلق تنبيه أولي.',
        'S2 — فهم المشكلة: يُنظّم الفريق المشكلة باستخدام منهجية 5W2H (ماذا، من، أين، متى، كيف، كم) قبل اتخاذ أي إجراء.',
        'S3 — الإجراءات الفورية / الاحتوائية: إجراء قصير الأمد لاحتواء عدم المطابقة وحماية العميل أو العملية من مزيد من التأثر.',
        'S4 — تحليل السبب الجذري: يحدد الفريق ويتحقق من السبب أو الأسباب الجذرية الحقيقية، عادةً باستخدام تحليل الأسئلة الخمسة "لماذا" أو مخطط إيشيكاوا.',
        'S5 — خطة الإجراء التصحيحي: يتم تحديد حل دائم وتوفير الموارد له وتنفيذه لمعالجة السبب الجذري الذي تم التحقق منه.',
        'S6 — تقييم الفعالية: بعد فترة مراقبة، يتحقق المُقيِّم من أن الإجراء التصحيحي قد نجح فعليًا ويسجل الحكم النهائي.',
        'S7 — الرسملة (REX): يتم نشر الدروس المستفادة في مكتبة الرسملة، مع تقييم لمدى إمكانية تعميم الحل أو تطبيقه في مواضع أخرى.',
        'تتيح لك وحدة مصفوفة RACSI رؤية، لكل خطوة من هذه الخطوات السبع، من هو بالضبط المعتمِد والمنفذ والمستشار والداعم والمُبلَّغ.',
      ],
    },
    {
      id: 'hierarchy-obs',
      title: 'الهيكل التنظيمي وهيكل تقسيم المنظمة (OBS)',
      body: [
        'تُصمِّم وحدة الهيكل التنظيمي بنية مستأجرك: مجموعة اختيارية (شركة قابضة) تضم مؤسسة واحدة أو أكثر، ويمكن لكل مؤسسة إدارة مشروع واحد أو أكثر.',
        'يمثل هيكل تقسيم المنظمة (OBS) الهيكل التنظيمي التشغيلي داخل مؤسسة واحدة: الموقع ← القسم ← الخدمة ← الفريق. وهو ليس عنصرًا زخرفيًا — فعُقد OBS مرتبطة فعليًا عبر المنصة بأكملها: يمكن ربط بطاقات حل المشكلات وقواعد العمل والضوابط والمخاطر والفرص وأنشطة RACSI جميعها بوحدة OBS المالكة لها، ولكل مستخدم عقدة OBS "أساسية" من خلال تعيين دوره.',
        'في شاشة OBS، تُظهر كل عقدة عدد العناصر المرتبطة بها (الأشخاص، بطاقات حل المشكلات، قواعد العمل، الضوابط، المخاطر والفرص، أنشطة RACSI) بحيث يمكنك معرفة أي أجزاء من المنظمة تحمل أكبر قدر من النشاط أو المسؤولية بنظرة واحدة.',
      ],
    },
    {
      id: 'identity-rbac',
      title: 'الهوية وإدارة الصلاحيات (RBAC)',
      body: [
        'تُدرج شاشة "المستخدمون والنطاق" كل حساب في مؤسستك، والدور أو الأدوار المعينة له، وعند الاقتضاء، عقدة OBS أو المشروع الذي يحدد نطاق وصوله.',
        'تعرض مصفوفة الصلاحيات كل دور مقابل كل صلاحية في النظام (رموز من نوع module.action، مثل fiche.create وcontrol.edit). يمكن للمسؤولين تفعيل أو إلغاء أي خلية مباشرة.',
        'تعرض شاشة "الترخيص والخطة" مستوى اشتراكك (مبتدئ / احترافي / مؤسسي)، ونموذج النشر (سحابي أو محلي)، واستخدام المقاعد ودورة الفوترة.',
      ],
    },
    {
      id: 'grc',
      title: 'الحوكمة والمخاطر والامتثال (GRC)',
      body: [
        'تلتقط قواعد العمل منطق "إذا/فإن" الذي يحكم عملية حل المشكلات — قواعد التحقق أو سير العمل أو الموافقة أو التسمية أو العتبة أو التصعيد — لكل منها درجة خطورة (حاجزة، تحذيرية، معلوماتية).',
        'تتبع الضوابط إطار العمل COSO لضبط الرقابة الداخلية: كل ضابط مرتبط بأحد المكونات الخمسة لإطار COSO (بيئة الرقابة، تقييم المخاطر، أنشطة الرقابة، المعلومات والاتصال، أنشطة المراقبة)، مع نوع (وقائي/كاشف/تصحيحي)، وتكرار اختبار، ومالك، وتقييم فعالية.',
        'تُقيَّم المخاطر والفرص على مصفوفة احتمالية × تأثير بحجم 5×5، مُلوَّنة من الأحمر (شديد) إلى الأخضر الداكن (ضئيل)، ويمكن ربطها بضابط واحد أو أكثر يخفف منها. يُتابَع كل من الدرجة المتأصلة والدرجة المتبقية.',
        'يمكن ربط الوحدات الثلاث بوحدة OBS المالكة لها، مما يتيح تتبع مسؤولية الحوكمة وصولًا إلى موقع أو قسم أو خدمة أو فريق محدد.',
      ],
    },
    {
      id: 'racsi',
      title: 'مصفوفة المسؤوليات RACSI',
      body: [
        'يوسّع نموذج RACSI نموذج RACI الكلاسيكي بدور خامس هو الدعم: المنفذ (ينجز العمل)، المعتمِد (يتحمل مسؤولية النتيجة — واحد فقط لكل نشاط)، المستشار (رأي ثنائي الاتجاه قبل القرار)، الداعم (يساعد المنفذ)، والمُبلَّغ (يُبقى على اطلاع، باتجاه واحد).',
        'كل نشاط RACSI هو إما إحدى خطوات عملية حل المشكلات السبع (S1–S7) أو نشاط حوكمة مرتبط مباشرة بقاعدة عمل أو ضابط أو خطر/فرصة محدد — لذا فإن المسؤولية ليست مجردة أبدًا، بل تشير دائمًا إلى عنصر حقيقي في النظام.',
        'يأتي المُعيَّنون من OBS: يمكنك تعيين إما دور (مسؤولية على مستوى المنظمة، مثل "مدير الجودة") أو شخص محدد بالاسم (مثل "كريم بنعلي"). يفرض النظام معتمِدًا واحدًا فقط لكل نشاط — تُرفض أي محاولة لإضافة معتمِد ثانٍ — بينما يمكن أن يضم كل من المنفذ والمستشار والداعم والمُبلَّغ عدة معيّنين، بمزيج حر من الأدوار والأسماء.',
      ],
    },
    {
      id: 'ai-use-cases',
      title: 'مكتبة حالات استخدام الذكاء الاصطناعي',
      body: [
        'تُصنّف مكتبة حالات استخدام الذكاء الاصطناعي أفكار ومشاريع الذكاء الاصطناعي التطبيقي (التحليلات التنبؤية، معالجة اللغة الطبيعية، الرؤية الحاسوبية، RAG، التحسين، اكتشاف الشذوذ) حسب الوظيفة التجارية ومرحلة النضج (1 فكرة ← 5 قيد الإنتاج).',
        'يمتلك كل حالة استخدام سجل إصدارات. الإصدار 1 هو دائمًا الإصدار الافتراضي. يؤدي تعديل حالة استخدام إلى تسمية كل قسم بوضوح — المدخلات، الموجّه (Prompt)، الناتج المتوقع، القيود والضوابط الاحترازية، وملاحظات النموذج/التقنية — ويؤدي الحفظ إلى إنشاء إصدار جديد مع ملاحظة تغيير اختيارية بدلاً من الكتابة فوق الإصدار السابق.',
        'يمكنك الرجوع إلى أي إصدار سابق في أي وقت. يؤدي الرجوع إلى نسخ محتوى ذلك الإصدار إلى إصدار جديد تمامًا — لا تتم إعادة كتابة السجل الأصلي أو حذفه أبدًا، مما يضمن مسار تدقيق كاملاً دائمًا.',
      ],
    },
    {
      id: 'capitalization-ai',
      title: 'مكتبة الرسملة ووكلاء الذكاء الاصطناعي',
      body: [
        'مكتبة الرسملة هي قاعدة معرفة قابلة للبحث لسجلات الدروس المستفادة (REX) المغلقة والمنشورة، مدعومة بمحرك استرجاع خفيف (RAG) يرتب النتائج حسب صلتها بمصطلحات البحث الخاصة بك.',
        'يساعد تسعة وكلاء ذكاء اصطناعي عبر العملية — واحد لكل خطوة، بالإضافة إلى وكيلين شاملين: التصنيف (S1)، هيكلة المشكلة (S2)، مستشار الاحتواء (S3)، استخراج السبب الجذري (S4)، توصية الإجراءات (S5)، مساعد التقييم (S6)، توليد REX (S7)، المراقبة والتنبيه (دائم التشغيل)، ومنسّق يقوم بتنسيقها جميعًا. يُسجَّل كل اقتراح يقدمه وكيل مع درجة ثقة لضمان تتبع كامل — يساعد الذكاء الاصطناعي، ولا يتجاوز أبدًا قرارًا بشريًا بصمت.',
      ],
    },
    {
      id: 'alerts-reports',
      title: 'التنبيهات والتقارير',
      body: [
        'تُخطرك التنبيهات عندما يحتاج عنصر ما في العملية إلى الانتباه — إجراءات متأخرة، تقييمات معلقة، بطاقات عالية الأولوية، تجاوزات في عتبات مؤشرات الأداء، وغير ذلك. يعرض رمز الجرس في القائمة الجانبية عدد الإشعارات غير المقروءة.',
        'توفر التقارير ولوحات التحكم رؤية على مستوى مؤشرات الأداء: أعداد البطاقات المفتوحة/قيد التنفيذ/المغلقة، معدلات إنجاز الإجراءات، أزمنة دورة كل مرحلة، وتحليلات حسب القطاع أو القسم، قابلة للتصدير لمراجعة الإدارة.',
      ],
    },
    {
      id: 'bpmn',
      title: 'مخططات عملية BPMN',
      body: [
        'تخزّن وحدة BPMN (القائمة الجانبية، مجموعة الحوكمة/المخاطر/الامتثال) وتعرض مخططات عملية حقيقية بمعيار BPMN 2.0 باستخدام محرر BPMN فعلي مدمج في المتصفح — وليس لقطة شاشة أو صورة ثابتة. تم تهيئتها بمخطط لعملية NCP Solver نفسها، من S1 إلى S7، بما في ذلك حلقة العودة إلى S5 عندما يكون تقييم فعالية S6 "غير فعّال".',
        'يتبع الوصول نظام RBAC مثل أي وحدة أخرى: يمكن لأي شخص لديه صلاحية bpmn.view فتح مخطط وتصفحه للقراءة فقط (تكبير/تنقل)؛ فقط المستخدمون الذين لديهم صلاحية bpmn.edit يرون لوحة التحرير الكاملة (سحب المهام والبوابات والتدفقات) وزر حفظ المخطط. يُعد الإنشاء والتعديل والحذف عمليات CRUD كاملة، كل منها محمي بصلاحيته الخاصة (bpmn.create / bpmn.edit / bpmn.delete)، تمامًا مثل قواعد العمل والضوابط والمخاطر والفرص.',
        'استخدمه لتصميم سير عمل NCP Solver كما تم تسليمه، أو لتوثيق أي عملية أخرى تريد مؤسستك مرجعًا مرئيًا مشتركًا ومُصدَّرًا له.',
      ],
    },
    {
      id: 'ai-assistant-llm',
      title: 'المساعد الذكي ومكتبة حالات استخدام الذكاء الاصطناعي',
      body: [
        'يجيب المساعد الذكي (القائمة الجانبية، القسم العلوي) على نوعين من الأسئلة عبر واجهة دردشة، دون الحاجة لتفعيل أي حالة استخدام ذكاء اصطناعي. يجيب "استعلام عن بياناتي" على أسئلة حول بيانات مؤسستك — عدد بطاقات NCP المفتوحة، الإجراءات المتأخرة، المخاطر ذات الشدة العالية، وغيرها — محسوبة مباشرة من قاعدة البيانات ومحدودة بصرامة حسب صلاحيات دورك (تحكم قائم على RBAC): قد يعطي نفس السؤال المطروح من دورين مختلفين نتائج مختلفة، أو رفضًا مهذبًا، ولا يُسرَّب أي بيانات أبدًا.',
        'يجيب "سؤال عن التطبيق" على أسئلة مثل "هل يمكن…؟" و"كيف…؟" حول NCP Solver نفسه، بالاستناد إلى قاعدة معرفة مساعدة مدمجة يتم البحث فيها بنفس محرك البحث الخفيف (RAG) المستخدم في مكتبة الرسملة.',
        'مكتبة حالات استخدام الذكاء الاصطناعي (القائمة الجانبية) هي الكتالوج المحكوم ولوحة التحكم لكل قدرة ذكاء اصطناعي في NCP Solver — 14 حالة استخدام، كل منها ضمن أحد مستويين: مساعد (يقترح؛ يقرر الإنسان) أو معزّز (ينجز جزءًا كبيرًا من المهمة؛ يجب على الإنسان المراجعة والموافقة). الذكاء الاصطناعي المستقل مستبعد عمدًا من النطاق. يمكن للمسؤول تفعيل أو تعطيل كل حالة استخدام لكل مؤسسة، ويمكن لقائد التحسين المستمر تجاوز تلك الحالة لمشروع واحد. تُوسم كل اقتراح من الذكاء الاصطناعي بعبارة "تم إنشاؤه بواسطة الذكاء الاصطناعي — راجعه قبل الاستخدام"، وتُكشف فيه المراجع المنهجية (المعايير) التي استند إليها، وتتيح لك القبول أو التمييز كمُعدَّل أو الرفض — ويُسجَّل ذلك في سجل استخدام ذكاء اصطناعي بنمط الإضافة فقط.',
        'تستضيف المكتبة أيضًا الاتصال الاختياري بمزوّد نموذج لغة حقيقي: اختر مزوّدًا (Anthropic وOpenAI وAzure OpenAI وMistral وOllama أو نقطة نهاية مخصصة متوافقة مع OpenAI قابلة فعليًا للاستدعاء في هذا الإصدار)، وأدخل نموذجًا ومفتاح API. يُخزَّن هذا الاتصال فقط في متصفحك — لا يُرسل أو يُخزَّن أبدًا على الخادم، ولا يُدرج في أي تصدير — ويُستخدم مرة واحدة على الأكثر لكل طلب؛ وتعود كل حالة استخدام تلقائيًا إلى مولدها الحتمي المدمج إذا لم يُضبط أي اتصال أو فشل الاستدعاء، بحيث لا يعتمد أي شيء أبدًا على تكوينه.',
      ],
    },
    {
      id: 'faq',
      title: 'الأسئلة الشائعة',
      body: [
        'لماذا لا أرى عنصرًا في القائمة؟ الوصول قائم على الصلاحيات. إذا كانت وحدة ما غائبة عن قائمتك الجانبية، فإن دورك لا يملك حاليًا صلاحية "العرض" المقابلة — اطلب من المسؤول التحقق من مصفوفة الصلاحيات.',
        'لماذا يمكنني العرض ولكن ليس التعديل؟ العديد من الأدوار مصممة عمدًا لتكون للقراءة فقط أو محدودة النطاق (على سبيل المثال، لا يمكن للمُقيِّم سوى تسجيل حكم الفعالية، وليس تعديل البطاقة نفسها).',
        'كيف أغيّر لغتي؟ استخدم المحدد أعلى يمين الشاشة في أي وقت — يتم حفظ تفضيلك في حسابك.',
        'من أتواصل معه للحصول على الدعم؟ يدير مسؤول مؤسستك حسابات المستخدمين والصلاحيات؛ أما للأسئلة المتعلقة بالمنصة، فتواصل مع POWERACT Consulting.',
      ],
    },
  ],
};
