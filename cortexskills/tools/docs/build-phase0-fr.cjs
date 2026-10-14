// Builds the French note answering the questions on Phase 0 (enablers) of scenario 1.
// Run: node build-phase0-fr.cjs <outDir>; then python3 topdf.py <docx> for the table of contents and the PDF.
const path = require('path'); const fs = require('fs');
const B = require('./brand.cjs'); const { D, C, P, H1, H2, H3, bullet, callout, table, cover, tocPage, document, spacer } = B;
const out = process.argv[2] || path.join(__dirname, '../../deliverables');
const version = JSON.parse(fs.readFileSync(path.join(__dirname, '../../server/package.json'), 'utf8')).version;
const t = new Date().toISOString().slice(0, 10).split('-').reverse().join('/');
let list = 0; const steps = items => { const ref = 'steps' + (list++ % 199 || ''); return items.map(x => B.numbered(x, ref)); };
const b = s => ({ text: s, bold: true });
const W2 = [2600, 7046], W3 = [2200, 3700, 3746];

const body = [];
body.push(...cover({ eyebrow: 'Note explicative · Scénario 1', title: 'Phase 0 — Catalyseurs',
  subtitle: 'Réponses aux questions sur les processus transverses du scénario 1 (Groupe Hospitalier Maghreb, compétences IA)',
  meta: [`CortexSkills ${version} · ${t}`, 'Préparé par AI Value'], appLogo: path.join(__dirname, '../../web/public/cortexskills-logo.png') }));
body.push(...tocPage('Table des matières'));

// ---------------------------------------------------------------- 1
body.push(H1('1. Synthèse'),
  P('La Phase 0 n’est pas une phase qui se déroule avant la Phase 1. Ce sont trois processus « catalyseurs », transverses à toutes les phases : ils sont actifs du lancement à la clôture du projet et chaque tâche se déclenche quand son événement déclencheur survient.'),
  table(['Processus', 'Déclencheur défini dans le catalogue', 'Quand il s’exécute réellement'], [
    ['E2E-15 Données, IA et intégrations', 'Nouvelle intégration, source de données ou cas d’usage IA à gouverner.', 'Surtout au lancement (prérequis de la Phase 1), puis à chaque nouveau cas d’usage IA et à chaque revue périodique.'],
    ['E2E-17 Du changement à l’adoption', 'Plan approuvé ou nouvelle capacité de la plateforme nécessitant une adoption.', 'Essentiellement après le jalon G3 (plan approuvé), pendant les Phases 4 à 6. Une version courte peut accompagner le lancement de la mission.'],
    ['E2E-18 Qualité, risques et amélioration', 'Risque enregistré, revue qualité périodique due ou test de contrôle planifié.', 'Dès le lancement pour le registre des risques et les accès, puis à chaque risque et à chaque revue périodique.'],
  ], W3),
  spacer(),
  callout('Ce qui explique vos questions', [
    'Le jeu de démonstration démarre les trois catalyseurs le premier jour du projet (09/07/2026) : pour chacun, deux tâches sont terminées le 14/07 et la troisième est en cours.',
    'C’est cohérent pour E2E-15 et E2E-18. Ce ne l’est pas pour E2E-17 : son entrée est un « Plan approuvé », qui n’existe qu’après le jalon G3. Les textes de la démonstration (impact sur les encadrants de soins, plan de 8 semaines, campagne « Triage IA ») décrivent le déploiement de la formation, pas le lancement de la mission.',
    'Le guide utilisateur suit l’ordre des phases. La Phase 0 apparaît donc en premier, ce qui laisse croire qu’elle précède la Phase 1.',
  ], C.bg),
  P([b('Recommandation : '), 'traiter la Phase 0 comme un calendrier, et non comme une étape préalable. Le chapitre 9 donne, tâche par tâche, le moment où elle doit être réalisée. Le chapitre 10 liste les corrections proposées pour la démonstration, le guide et l’application.']),
);

// ---------------------------------------------------------------- 2
body.push(H1('2. « Test de santé : succès » — d’où vient l’information ?'),
  P([b('Réponse courte : '), 'c’est un résultat produit par l’application, et non une information donnée oralement ou saisie à la main. L’Architecte SI déclenche le test ; la plateforme l’exécute et enregistre le résultat.']),
  H2('2.1 Qui fait quoi'),
  table(['Élément', 'Détail'], [
    ['Tâche · étape', 'UFT-15-02 Mapper les champs et vérifier la santé · étape MP-16.3 « Vérifier la santé de l’intégration » (étape système, Service Task).'],
    ['Qui déclenche', 'L’Architecte SI (responsable de la tâche), avec la permission « integrations.manage ».'],
    ['Qui produit le résultat', 'La plateforme, de façon automatique.'],
    ['Moyen', 'Administration › Intégrations, bouton « Tester » sur la ligne de l’intégration « SIRH — Workday » (INT-HR-01). Le message « Test de santé enregistré. » confirme l’opération.'],
    ['Résultats possibles', 'success (succès) · authFailure (échec d’authentification) · disabled (intégration désactivée).'],
    ['Traces', 'La colonne « Santé » de la fiche passe au vert ou au rouge et la date du test est enregistrée ; une ligne « health » est ajoutée au « Journal des transactions » ; l’opération est inscrite au journal d’audit.'],
  ], W2),
  H2('2.2 Ce que vérifie le test aujourd’hui'),
  P('Dans la version actuelle, le test contrôle la configuration : l’intégration est-elle activée, et une référence d’identifiants (stockée chiffrée) est-elle enregistrée ? Il n’appelle pas encore le serveur Workday. Le détail technique du fournisseur n’est jamais affiché, conformément aux exigences de sécurité.'),
  callout('Dans la tâche', [
    'L’étape MP-16.3 étant une étape système, il n’y a rien à y saisir. La phrase « Test de santé : succès » du guide est le résultat à constater avant de terminer la tâche, pas un texte à taper.',
    'En production, il est recommandé que le test appelle réellement le point d’accès du SIRH (authentification et lecture d’une fiche témoin).',
  ]),
);

// ---------------------------------------------------------------- 3
body.push(H1('3. La synchronisation SIRH — comment se fait-elle ?'),
  P([b('Réponse courte : '), 'l’administrateur ne « configure puis informe » pas. La configuration est faite une fois (UFT-15-01 et UFT-15-02). La synchronisation est ensuite une étape système (MP-16.4), et seuls les rejets demandent une intervention humaine (MP-16.5).']),
  H2('3.1 Le déroulement prévu par le processus'),
  ...steps([
    [b('UFT-15-01 — Administrateur de la plateforme : '), 'enregistre l’intégration « SIRH — Workday » (code INT-HR-01) et sa référence d’identifiants, stockée chiffrée.'],
    [b('UFT-15-02 — Architecte SI : '), 'mappe les champs du SIRH vers ceux de CortexSkills (employee_id → matricule ; position → poste), puis lance le test de santé (chapitre 2).'],
    [b('UFT-15-03, MP-16.4 — Système : '), 'la synchronisation reçoit les fiches du SIRH. Chaque fiche reçue est tracée dans le « Journal des transactions » de l’intégration.'],
    [b('UFT-15-03, MP-16.5 — Architecte SI : '), 'revoit les rejets (dans l’exemple, 3 fiches sans poste), les fait corriger à la source dans le SIRH, puis relance la synchronisation. Il consigne la revue dans le formulaire de l’étape.'],
    [b('Passage de relais : '), 'à la clôture de la tâche, la tâche suivante (UFT-15-04, Délégué à la protection des données) apparaît dans la liste de travail de son responsable.'],
  ]),
  H2('3.2 Ce qui existe dans l’application aujourd’hui'),
  table(['Fonction', 'État dans la version actuelle'], [
    ['Registre des intégrations, identifiants chiffrés, test de santé, journal', 'Disponible (Administration › Intégrations).'],
    ['Réception des fiches', 'Un point d’entrée authentifié (webhook entrant), propre à l’organisation : le SIRH ou un middleware y pousse les fiches, et chacune est tracée dans le journal.'],
    ['Mise à jour automatique de l’annuaire (personnes, postes) à partir des fiches reçues', 'Non disponible : l’annuaire de démonstration est chargé par le jeu de données. Le chiffre « 1 204 fiches mises à jour, 3 rejetées » est un exemple de résultat attendu.'],
    ['Synchronisation planifiée (extraction programmée depuis Workday)', 'Non disponible.'],
    ['Notification « tâche prête » au responsable suivant', 'Non disponible : la tâche apparaît dans sa liste. Seules les tâches en retard déclenchent une alerte.'],
  ], W2),
  callout('À prévoir pour un usage réel', ['Un connecteur SIRH qui applique le mappage aux fiches reçues, met à jour l’annuaire et produit un compte rendu (mises à jour, créations, rejets avec motif) ; une planification de la synchronisation ; une notification au responsable de la tâche suivante.'], C.bg),
);

// ---------------------------------------------------------------- 4
body.push(H1('4. Tenir le registre des cas d’usage IA — les étapes techniques'),
  P([b('Réponse courte : '), 'oui. L’Administrateur de la plateforme ajoute le cas d’usage dans la bibliothèque « Cas d’usage IA ». L’étape MP-16.7 de la tâche UFT-15-05 consigne ensuite cette revue du registre. Elle ne crée pas le cas d’usage elle-même.']),
  H2('4.1 Ajouter le cas d’usage « Synthèse des rapports de poste »'),
  ...steps([
    'Se connecter avec un rôle qui a la permission « ai.manage » (Administrateur de la plateforme).',
    'Ouvrir IA et connaissances › Cas d’usage IA, onglet « Bibliothèque », puis cliquer sur « + Nouveau cas d’usage IA ».',
    'Renseigner le nom en français, en anglais et en arabe, ainsi que la description et le niveau « Assistif » (l’IA propose, une personne décide).',
    'Renseigner le point de contrôle humain (obligatoire) : qui revoit, accepte, modifie ou rejette la suggestion.',
    'Lier le cas d’usage aux étapes de processus où il est utilisé, ainsi qu’à sa spécification de prompt.',
    'Enregistrer. Le code est attribué automatiquement (AIUC-C01, AIUC-C02… pour les cas propres à l’organisation) et la version 1 est créée. Le quota de cas d’usage personnalisés du forfait est contrôlé.',
    'Vérifier la fiche, puis la tester avec « Tester sur ce projet » sur la page du cas d’usage.',
    'Revenir dans la tâche UFT-15-05, étape MP-16.7 : saisir la revue du registre (périmètre, constats, conclusion, date), puis terminer l’étape.',
    'Ensuite, UFT-15-06 active le cas d’usage pour l’organisation ou pour un projet. Un cas d’usage enregistré mais non activé ne fait aucune suggestion.',
  ]),
  callout('Remarque sur votre capture d’écran', ['Le sous-titre indique « 36 cas d’usage IA » alors que les indicateurs en comptent 37. Le sous-titre compte le catalogue standard, les indicateurs y ajoutent le cas propre à l’organisation (AIUC-C01). Le libellé du sous-titre doit être aligné sur le total.'], C.bg),
);

// ---------------------------------------------------------------- 5-8 (E2E-17)
body.push(H1('5. UFT-17-01 — Évaluer l’impact du changement : quel changement ?'),
  P([b('Réponse courte : '), 'votre remarque est juste. L’entrée de la tâche est un « Plan approuvé ». Le changement évalué est celui que la formation et les outils d’IA vont apporter aux équipes (par exemple le triage IA dans les services de soins). Cela suppose le diagnostic (Phase 2) et le plan approuvé au jalon G3 (Phase 3).']),
  table(['Lecture', 'Ce que l’on évalue', 'Quand'], [
    ['Cycle principal (prévu par le catalogue)', 'L’impact du plan de formation et des outils d’IA par population : encadrants de soins (élevé), opérateurs (moyen), fonctions support (faible). Il s’agit de l’exemple du guide.', 'Après G3, au début de la Phase 4.'],
    ['Cycle de lancement (facultatif)', 'L’impact de la mission elle-même : qui sera sollicité (questionnaires, entretiens), combien de temps, quelles craintes (évaluation individuelle, confidentialité).', 'Avant ou pendant la Phase 1.'],
  ], W3),
  spacer(),
  P('Dans la démonstration, cette tâche est terminée le 11/07/2026, avant même le diagnostic. Il s’agit d’une incohérence de planification du jeu de démonstration, et non du processus. La matrice d’évaluation reste la même dans les deux cycles : seul l’objet évalué change.'),
);
body.push(H1('6. UFT-17-02 — Construire le plan d’adoption : quel plan ?'),
  P('Le plan d’adoption est le plan de conduite du changement qui accompagne le plan de formation. Il est construit à partir de l’évaluation d’impact (UFT-17-01) et décrit comment faire adopter durablement les nouvelles pratiques.'),
  table(['Rubrique', 'Exemple du scénario'], [
    ['Parrainage', 'Message du sponsor (Direction générale ou Direction des soins) expliquant pourquoi l’IA est introduite.'],
    ['Relais', '6 relais (ambassadeurs) dans les services les plus concernés.'],
    ['Rythme', 'Points de 15 minutes chaque semaine pendant 8 semaines après le déploiement.'],
    ['Saisie dans l’application', 'Étape MP-19.2, tableau « Plan » : une ligne par action, avec son responsable, ses dates, son budget et son livrable. Ces lignes alimentent le plan d’actions.'],
  ], W2),
  spacer(),
  P([b('Avant la Phase 1, '), 'seul un plan court a du sens : annonce de la mission, rôle des relais pour obtenir les réponses aux questionnaires, garanties de confidentialité. Le plan complet ci-dessus se construit après G3.']),
);
body.push(H1('7. MP-19.3 — Lancer la campagne de communication : quelle campagne ?'),
  P('La campagne du guide (« Triage IA et aide à la décision clinique — pourquoi c’est important », par e-mail, intranet et écrans) est la campagne de déploiement de la formation. Elle suit le plan d’adoption, donc le plan approuvé.'),
  H2('7.1 Faut-il la clôturer avant la Phase 1 ?'),
  P('Non. Le jalon G1 ne vérifie que le périmètre et les preuves ; il ne dépend pas d’E2E-17. Le processus E2E-17 reste ouvert pendant tout le projet. Sa tâche de campagne est terminée quand la campagne a réellement été lancée, en général au début de la Phase 4.'),
  H2('7.2 Ce que l’on peut lancer avant la Phase 1'),
  table(['Campagne', 'Contenu', 'Lien avec la suite'], [
    ['Annonce de la mission', 'Pourquoi le diagnostic, qui est concerné, calendrier, confidentialité des réponses.', 'Prépare la collecte E2E-33 (questionnaires) de la Phase 1.'],
    ['Invitation aux questionnaires', 'Lien ou QR code, relances par e-mail ou WhatsApp.', 'Gérée dans le module Questionnaires (plan de canaux et relances), pas dans E2E-17.'],
  ], W3),
);
body.push(H1('8. MP-08.5 — Suivre les indicateurs d’engagement : par rapport à quoi ?'),
  P('L’engagement mesuré ici est celui des apprenants et des équipes vis-à-vis du dispositif déployé : connexions, participation aux sessions, progression, usage des outils d’IA. Sans formation ni outil déployé, il n’y a rien à mesurer. L’étape se place après la campagne et l’ouverture de l’espace communautaire, pendant les Phases 4 et 5.'),
  table(['Moment', 'Indicateurs pertinents', 'Exemple'], [
    ['Avant ou pendant la Phase 1', 'Engagement dans la mission : taux de réponse aux questionnaires, participation aux entretiens, taux d’ouverture des messages.', 'Taux de réponse : 72 % des encadrants à J+10.'],
    ['Phases 4 et 5', 'Engagement dans le dispositif : utilisateurs actifs, participation, progression des compétences, usage des suggestions IA.', 'Utilisateurs actifs hebdomadaires : 64 % de la population cible.'],
  ], W3),
  spacer(),
  P('Les valeurs du guide (par exemple KPI-013 « Taux de progression des compétences ») relèvent du second moment. Avant la Phase 1, utilisez les indicateurs de la première ligne ou laissez l’étape ouverte.'),
);

// ---------------------------------------------------------------- 9
const R = (task, when, why) => [task, when, why];
body.push(H1('9. Toutes les tâches de la Phase 0 : quand et pourquoi'),
  P('Légende : « Avant la Phase 1 » = prérequis de la collecte ; « Récurrent » = à refaire à intervalle régulier ou à chaque jalon ; « Après G3 » = suppose le plan approuvé.'),
  H2('9.1 E2E-15 — Données, IA et intégrations'),
  table(['Tâche', 'Quand', 'Pourquoi à ce moment'], [
    R('UFT-15-01 Enregistrer une intégration externe', 'Avant la Phase 1', 'L’annuaire du SIRH fournit les listes de répondants (E2E-33) et les postes nécessaires au diagnostic.'),
    R('UFT-15-02 Mapper les champs et vérifier la santé', 'Avant la Phase 1', 'Sans mappage matricule/poste, les réponses ne peuvent pas être rattachées aux postes et aux fonctions.'),
    R('UFT-15-03 Lancer la synchronisation SIRH', 'Avant la Phase 1, puis récurrent', 'Les personnes et les postes doivent être à jour avant l’envoi des questionnaires ; ensuite, à chaque mouvement de personnel.'),
    R('UFT-15-04 Définir une règle de conservation des données', 'Avant la Phase 1', 'Les questionnaires collectent des données personnelles : la durée de conservation doit être fixée avant la collecte (protection des données personnelles, loi 09-08 et CNDP au Maroc).'),
    R('UFT-15-05 Tenir le registre des cas d’usage IA', 'Avant la Phase 1, puis à chaque nouveau cas', 'Des étapes des Phases 1 et 2 utilisent des suggestions IA ; un cas d’usage doit être enregistré et gouverné avant d’être utilisé.'),
    R('UFT-15-06 Définir l’activation de l’IA par périmètre', 'Avant la Phase 1, puis à la demande', 'Fixe où l’IA est autorisée (organisation, projet pilote) avant que les utilisateurs ne la sollicitent.'),
    R('UFT-15-07 Revoir le journal d’usage de l’IA', 'Récurrent (mensuel ou à chaque jalon)', 'Il faut un historique d’usage à revoir : par exemple « 412 suggestions, 71 % acceptées » suppose des semaines d’utilisation.'),
  ], W3, { size: 17 }),
  H2('9.2 E2E-17 — Du changement à l’adoption'),
  table(['Tâche', 'Quand', 'Pourquoi à ce moment'], [
    R('UFT-17-01 Évaluer l’impact du changement', 'Après G3 (version courte possible au lancement)', 'Son entrée est le plan approuvé (chapitre 5).'),
    R('UFT-17-02 Construire le plan d’adoption', 'Après G3', 'Il découle de l’évaluation d’impact (chapitre 6).'),
    R('UFT-17-03 Lancer la campagne de communication', 'Début de la Phase 4', 'Elle annonce la formation et les outils déployés (chapitre 7).'),
    R('UFT-17-04 Ouvrir l’espace communautaire', 'Phase 4, avec les premières sessions', 'Les questions des apprenants naissent avec les formations ; les cohortes d’apprentissage se créent alors.'),
    R('UFT-17-05 Suivre l’usage et l’adoption', 'Phases 4 et 5, récurrent', 'Il faut des utilisateurs actifs à mesurer (chapitre 8).'),
    R('UFT-17-06 Identifier les groupes à faible adoption', 'Phase 5', 'Suppose plusieurs semaines d’indicateurs d’usage.'),
    R('UFT-17-07 Mener les actions de renforcement', 'Phases 5 et 6', 'Cible les groupes identifiés ; l’effet se mesure après quelques semaines (58 % après 4 semaines dans l’exemple).'),
  ], W3, { size: 17 }),
  H2('9.3 E2E-18 — Qualité, risques et amélioration'),
  table(['Tâche', 'Quand', 'Pourquoi à ce moment'], [
    R('UFT-18-01 Enregistrer un risque ou une opportunité', 'Dès le lancement, puis à chaque signal', 'Les risques de la mission (disponibilité des formateurs, taux de réponse) se gèrent dès le départ.'),
    R('UFT-18-02 Affecter une action de maîtrise', 'À chaque risque enregistré', 'Chaque risque significatif reçoit une action et un responsable.'),
    R('UFT-18-03 Exécuter l’action d’amélioration', 'Selon l’échéance de l’action', 'Exemple : contrat-cadre avec un second prestataire avant le T3.'),
    R('UFT-18-04 Évaluer l’efficacité de l’action', 'Après exécution', 'Par une personne différente du responsable de l’action (séparation des rôles).'),
    R('UFT-18-05 Revoir les accès et la sécurité', 'Avant la Phase 1 pour l’attribution des rôles, puis trimestriel', 'Chaque utilisateur doit avoir son rôle avant de travailler ; la revue des accès est ensuite périodique.'),
    R('UFT-18-06 Mener la revue qualité périodique', 'Récurrent (mensuel ou à chaque jalon)', 'Exige des KPI et des actions à revoir (« 3 KPI rouges, 2 actions ouvertes »).'),
    R('UFT-18-07 Mettre à jour l’efficacité des contrôles', 'Après chaque revue qualité', 'Note les contrôles à partir des constats de la revue.'),
  ], W3, { size: 17 }),
);

// ---------------------------------------------------------------- 10
body.push(H1('10. Corrections proposées'),
  table(['Où', 'Correction', 'Effet'], [
    ['Jeu de démonstration', 'Démarrer E2E-17 après le jalon G3 ; garder E2E-15 (tâches 15-01 à 15-06) et UFT-18-01 au lancement ; rendre 15-07, 18-05 et 18-06 récurrentes.', 'Un déroulé chronologiquement cohérent.'],
    ['Guide utilisateur du scénario 1', 'Ajouter à la Phase 0 la colonne « Quand » du chapitre 9, et des valeurs « cycle de lancement » pour E2E-17 (annonce de la mission, taux de réponse).', 'Le lecteur sait quoi faire avant la Phase 1 et quoi reporter.'],
    ['Application', 'Une condition de démarrage par processus catalyseur (par exemple « après G3 » pour E2E-17), affichée dans la tâche et respectée par le planning.', 'Une tâche ne peut plus être lancée avant que son entrée existe.'],
    ['Application', 'Connecteur SIRH : application du mappage, mise à jour de l’annuaire, compte rendu des rejets, planification ; test de santé avec un appel réel.', 'Les étapes système MP-16.3 et MP-16.4 deviennent réelles.'],
    ['Application', 'Notification au responsable de la tâche suivante quand une tâche est terminée ; alignement du sous-titre « Cas d’usage IA » sur le total.', 'Passage de relais visible ; chiffres cohérents.'],
  ], W3, { size: 17 }),
  spacer(),
  P('Ces corrections peuvent être réalisées sur demande. Elles touchent le jeu de démonstration, le guide du scénario 1 et, pour les trois dernières lignes, l’application.'),
);

const doc = document({ title: 'Phase 0 — Catalyseurs : réponses aux questions', credit: `CortexSkills ${version} · Scénario 1 · Phase 0`, sections: [body], lang: 'fr-FR' });
fs.mkdirSync(out, { recursive: true });
const file = path.join(out, 'CortexSkills_Scenario1_Phase0_Reponses_FR.docx');
D.Packer.toBuffer(doc).then(x => { fs.writeFileSync(file, x); console.log(file); });
