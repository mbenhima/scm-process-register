"""Builds the two DynamicMS user guides (Word, with TOC), in English and in French, from the
seeded full runs, with the AI Value graphical chart:
  1. Universal — large and big companies: Scenario 1 QMS, Scenario 2 QHSE
  2. SME: Scenario 1 SME QMS, Scenario 2 SME QHSE, Scenario 3 SME QMS for AEC & Construction
Every step of every macro process is listed with what to type in each field.
Usage: python3 build_guides.py [1|2|all] [en|fr|all]"""
import json
import os
import sys
import brand
from brand import (new_document, cover, toc, page_break, para, bullets, numbered, table, callout, image)

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BUILD = os.path.join(ROOT, 'deliverables', 'build')
OUT = os.path.join(ROOT, 'deliverables')
URL = 'http://localhost:5173'
LANG = 'en'


def X(en, fr):
    """The text in the language of the guide being built."""
    return fr if LANG == 'fr' else en


def shots_dir():
    return os.path.join(BUILD, 'shots' if LANG == 'en' else 'shots-fr')


def deck_dir():
    return os.path.join(BUILD, 'deck-en' if LANG == 'en' else 'deck-fr')


def forms():
    return [
        (X('Standards and scope', 'Normes et périmètre'), X('Standards applied (tick boxes), Scope type (single standard or integrated), Organization units covered (OBS), Why these standards. Selected once per project, before the policy is drafted.', 'Normes appliquées (cases à cocher), type de périmètre (norme unique ou intégré), unités de l\'organisation couvertes (OBS), pourquoi ces normes. Choisies une seule fois par projet, avant la rédaction de la politique.')),
        (X('Periodicity', 'Périodicité'), X('Frequency (list), Next due date, Review chaired by (role), Organization units in scope (OBS picker), Review inputs and notes', 'Fréquence (liste), prochaine échéance, revue présidée par (rôle), unités concernées (sélecteur OBS), éléments d\'entrée et notes')),
        (X('Register items', 'Éléments du registre'), X('A table, one row per item. Column titles name the object of the step (for example External issue, Interested party); Category is a list with Custom; each row has its own source. Open a row in a large window to type long texts.', 'Un tableau, une ligne par élément. Les titres de colonnes nomment l\'objet de l\'étape (par exemple Enjeu externe, Partie intéressée) ; la catégorie est une liste avec Personnalisé ; chaque ligne a sa propre source. Ouvrez une ligne dans une grande fenêtre pour saisir des textes longs.')),
        (X('Needs and expectations', 'Besoins et attentes'), X('One row per need, linked to one or more interested parties; type of requirement (list with Custom), compliance obligation, how it is addressed, relevance, origin (Manual, Library, AI) and source. Optional decision matrix and conclusion.', 'Une ligne par besoin, rattachée à une ou plusieurs parties intéressées ; type d\'exigence (liste avec Personnalisé), obligation de conformité, réponse de l\'organisme, pertinence, origine (Manuel, Bibliothèque, IA) et source. Matrice de décision facultative et conclusion.')),
        (X('Assessment', 'Évaluation'), X('Decision matrix: one row per criterion with Weight (%), Score 1–5 and the facts that justify it; the weighted score is computed; Conclusion', 'Matrice de décision : une ligne par critère avec poids (%), note 1–5 et faits qui la justifient ; la note pondérée est calculée ; conclusion')),
        (X('Decision', 'Décision'), X('Decision criteria checked (table: criterion, met yes/partly/no, evidence), Decision (Go, No-Go, Hold), Approver (role), Comment and conditions', 'Critères de décision vérifiés (tableau : critère, satisfait oui/partiellement/non, preuve), décision (Go, No-Go, En attente), approbateur (rôle), commentaire et conditions')),
        (X('Document', 'Document'), X('Document template (list), Document reference, Version, Content summary, Generated document (link). Use Generate document to create it from the project data.', 'Modèle de document (liste), référence, version, résumé du contenu, document généré (lien). Utilisez Générer un document pour le créer à partir des données du projet.')),
        (X('Communication', 'Communication'), X('Communication records: one row per audience with Channel, Date, Key message and Communicated by (ISO 9001 §7.4)', 'Enregistrements de communication : une ligne par public avec canal, date, message clé et émetteur (ISO 9001 §7.4)')),
        (X('Training', 'Formation'), X('Session, Date, Units trained (OBS), Participants, Effectiveness evaluation method, Effectiveness (%)', 'Session, date, unités formées (OBS), participants, méthode d\'évaluation de l\'efficacité, efficacité (%)')),
        (X('Measurement', 'Mesure'), X('Indicators measured: one row per KPI chosen from the project list (or a new KPI), with Why this KPI for this step, Measured value and Target; Analysis', 'Indicateurs mesurés : une ligne par KPI choisi dans la liste du projet (ou un nouveau KPI), avec pourquoi ce KPI à cette étape, valeur mesurée et cible ; analyse')),
        (X('Review', 'Revue'), X('Review frequency, Review date, Next review, Chaired by, Participants (roles), Inputs reviewed (table), Decisions and actions (table: each decision becomes an action)', 'Fréquence, date de revue, prochaine revue, président, participants (rôles), éléments revus (tableau), décisions et actions (tableau : chaque décision devient une action)')),
        (X('Plan', 'Plan'), X('Planned activities: one row per activity with Owner (person), Start, Due date and Deliverable; each row becomes an action of the Action plan', 'Activités planifiées : une ligne par activité avec responsable (personne), début, échéance et livrable ; chaque ligne devient une action du plan d\'actions')),
        (X('SMART objectives', 'Objectifs SMART'), X('One row per objective: Specific objective, Measure (KPI), Baseline, Achievable target, Relevant to, Owner, Time-bound deadline, Resources; each row becomes an entry of the objectives register', 'Une ligne par objectif : objectif précis, mesure (KPI), valeur de départ, cible atteignable, lien avec la politique, responsable, échéance, ressources ; chaque ligne devient une entrée du registre des objectifs')),
        (X('Execution', 'Exécution'), X('What was done, Records that prove it (links), Completion (%)', 'Ce qui a été réalisé, enregistrements qui le prouvent (liens), avancement (%)')),
        (X('Assignment', 'Affectation'), X('Role, Person (from the OBS), Organization units covered, RACSI of the macro process in five columns (one Accountable)', 'Rôle, personne (issue de l\'OBS), unités couvertes, RACSI du macro-processus en cinq colonnes (un seul A)')),
        (X('Configuration', 'Configuration'), X('Settings table (setting, value, reason), Tested before use', 'Tableau des paramètres (paramètre, valeur, motif), testé avant usage')),
        (X('Change', 'Modification'), X('Change made, Reason, Documents or records updated (links)', 'Modification réalisée, motif, documents ou enregistrements mis à jour (liens)')),
        (X('Closure', 'Clôture'), X('Closure evidence, Records that prove effectiveness, Closure date', 'Preuve de clôture, enregistrements qui prouvent l\'efficacité, date de clôture')),
        (X('Escalation', 'Escalade'), X('Escalated to (role), Reason', 'Escaladé à (rôle), motif')),
        (X('AI-assisted draft', 'Brouillon assisté par l\'IA'), X('Context given to the assistant, Suggestion outcome (Accepted, Edited, Rejected), Final validated text', 'Contexte donné à l\'assistant, issue de la suggestion (Acceptée, Modifiée, Rejetée), texte final validé')),
        (X('Automated service task', 'Tâche de service automatisée'), X('System result confirmed, Records produced (links); filled by the DynamicMS Engine', 'Résultat système confirmé, enregistrements produits (liens) ; rempli par le moteur DynamicMS')),
    ]


def shot(doc, code, name, cap):
    image(doc, os.path.join(shots_dir(), code, f'{name}.png'), 17, cap)


def feature(doc, name, width, cap):
    image(doc, os.path.join(deck_dir(), f'{name}.png'), width, cap)


def getting_started(doc, example_email):
    doc.add_heading(X('Getting started', 'Prise en main'), level=1)
    doc.add_heading(X('Sign in', 'Se connecter'), level=2)
    numbered(doc, [
        X(f'Open {URL} in Chrome, Edge, Firefox or Safari.', f'Ouvrez {URL} dans Chrome, Edge, Firefox ou Safari.'),
        X(f'Type your e-mail (for example {example_email}) and the password Demo@2026, then select Sign in.', f'Saisissez votre e-mail (par exemple {example_email}) et le mot de passe Demo@2026, puis sélectionnez Se connecter.'),
        X('Choose the language with the EN / FR / ع selector at the top right. Arabic switches the whole layout to right-to-left.', 'Choisissez la langue avec le sélecteur EN / FR / ع en haut à droite. L\'arabe passe toute la mise en page de droite à gauche.'),
        X('Check the project shown in the header switcher. Every screen works on the selected project; change it at any time.', 'Vérifiez le projet affiché dans le sélecteur de l\'en-tête. Chaque écran travaille sur le projet choisi ; changez-le à tout moment.'),
    ])
    doc.add_heading(X('The navigation shell', 'L\'interface de navigation'), level=2)
    bullets(doc, [
        (X('Menu groups. ', 'Groupes du menu. '), X('Work, Governance, Records, Insight, Intelligence, Design and Organization. Select a group title to collapse or expand it.', 'Travail, Gouvernance, Enregistrements, Pilotage, Intelligence, Conception et Organisation. Sélectionnez le titre d\'un groupe pour le replier ou le déplier.')),
        (X('Search everywhere. ', 'Recherche partout. '), X('The search bar of the header ("Search everything… (Ctrl+K)") and the Search button of the menu open the global search from any screen.', 'La barre de recherche de l\'en-tête (« Tout rechercher… (Ctrl+K) ») et le bouton Rechercher du menu ouvrent la recherche globale depuis n\'importe quel écran.')),
        (X('Favorites. ', 'Favoris. '), X('Point at a menu item and select the star; favorites appear in the first group.', 'Pointez un élément du menu et sélectionnez l\'étoile ; les favoris apparaissent dans le premier groupe.')),
        (X('Dock and pin. ', 'Ancrage et épinglage. '), X('The buttons at the bottom of the menu dock it at the start, end, top or bottom, and pin or unpin it. Unpinned, the menu slides in from the edge handle.', 'Les boutons au bas du menu l\'ancrent au début, à la fin, en haut ou en bas, et l\'épinglent ou le désépinglent. Désépinglé, le menu glisse depuis la poignée du bord.')),
        (X('Mobile. ', 'Mobile. '), X('Below tablet width the menu becomes a drawer opened with the menu button; Escape closes it.', 'En dessous de la largeur d\'une tablette, le menu devient un tiroir ouvert par le bouton de menu ; Échap le ferme.')),
        (X('Alerts bell. ', 'Cloche des alertes. '), X('Shows the number of unread alerts of the project; select it to open the notification center.', 'Affiche le nombre d\'alertes non lues du projet ; sélectionnez-la pour ouvrir le centre de notifications.')),
        (X('Identifiers. ', 'Identifiants. '), X('Codes are always shown with their name, for example "E2E-01 (Context To Strategy)" or "UMS006 (Competence and Training Orchestration)".', 'Les codes sont toujours affichés avec leur nom, par exemple « E2E-01 (Du contexte à la stratégie) » ou « UMS006 (Orchestration des compétences et de la formation) ».')),
    ])
    doc.add_heading(X('How a lifecycle runs', 'Déroulement d\'un cycle de vie'), level=2)
    para(doc, X('Each project runs the end-to-end (E2E) processes of its management system in order, from E2E-01 Context To Strategy to E2E-12 Correction To Innovation. An E2E phase groups macro processes (MP); each macro process is made of tasks, and each task of workflow steps. Every step has one input form. When all steps of a phase are complete, its gate is decided (Go, Hold or No-Go) after the gate checklist is ticked.',
                'Chaque projet déroule dans l\'ordre les processus de bout en bout (E2E) de son système de management, de E2E-01 Du contexte à la stratégie à E2E-12 De la correction à l\'innovation. Une phase E2E regroupe des macro-processus (MP) ; chaque macro-processus est fait de tâches, et chaque tâche d\'étapes. Chaque étape a un formulaire de saisie. Quand toutes les étapes d\'une phase sont terminées, son jalon est décidé (Go, En attente ou No-Go) après le cochage de la liste du jalon.'))
    numbered(doc, [
        X('Open Lifecycle and select the phase card (E2E-01 first).', 'Ouvrez Cycle de vie et sélectionnez la carte de la phase (E2E-01 d\'abord).'),
        X('Select a macro process in the table to see its tasks and steps.', 'Sélectionnez un macro-processus dans le tableau pour voir ses tâches et étapes.'),
        X('Select a step. Read What to record, fill in the fields as shown in this guide, then select Complete step. Use Save draft to keep partial input.', 'Sélectionnez une étape. Lisez Ce qu\'il faut saisir, remplissez les champs comme indiqué dans ce guide, puis sélectionnez Terminer l\'étape. Utilisez Enregistrer le brouillon pour garder une saisie partielle.'),
        X('The application moves you to the next step. When a phase is complete, tick its gate checklist and record the gate decision (top management or the IMS Manager).', 'L\'application passe à l\'étape suivante. Quand une phase est terminée, cochez la liste de son jalon et enregistrez la décision (direction ou responsable SMI).'),
        X('To correct a completed step, select Reopen and type a justification; the previous value is kept as a version. A step cannot be reopened once its phase gate is passed.', 'Pour corriger une étape terminée, sélectionnez Rouvrir et saisissez une justification ; la valeur précédente est conservée comme version. Une étape ne peut plus être rouverte une fois le jalon de sa phase franchi.'),
    ])
    doc.add_heading(X('Input forms', 'Formulaires de saisie'), level=2)
    para(doc, X('Form kinds cover the 1,572 steps of the process design. Lists of items are record tables: add, edit or delete one row per item, each with its own source. Every choice is a list with a Custom… entry for your own value. The table lists the fields of each kind; required fields are marked with an asterisk on screen.',
                'Les types de formulaires couvrent les 1 572 étapes de la conception des processus. Les listes d\'éléments sont des tableaux d\'enregistrements : ajoutez, modifiez ou supprimez une ligne par élément, chacune avec sa source. Chaque choix est une liste avec une entrée Personnalisé… pour votre propre valeur. Le tableau donne les champs de chaque type ; les champs obligatoires sont marqués d\'un astérisque à l\'écran.'))
    table(doc, [X('Form', 'Formulaire'), X('Fields', 'Champs')], [[a, b] for a, b in forms()], [4.5, 13.5], size=9.5, bold_first=True)
    doc.add_heading(X('The step page', 'La page d\'une étape'), level=2)
    bullets(doc, [
        (X('Name and description. ', 'Nom et description. '), X('Every task and step name starts with a verb and names its object (for example "Fix quality policy review periodicity"). Under the name, a brief description; select Show the detailed description for the purpose, how to fill the form, the inputs, the expected result and the ISO clause.', 'Chaque nom de tâche et d\'étape commence par un verbe et nomme son objet (par exemple « Fixer la périodicité de revue de la politique qualité »). Sous le nom, une description courte ; sélectionnez Afficher la description détaillée pour la finalité, la façon de remplir le formulaire, les entrées, le résultat attendu et l\'article ISO.')),
        (X('Record tables. ', 'Tableaux d\'enregistrements. '), X('Select Add a row: the new row opens in a large window, with one large field per column, Previous row / Next row and Back to the table. The button next to each row reopens it in that window. People come from the organization structure (OBS); macro processes are chosen from the project list; KPIs are chosen from the project list or created with New KPI.', 'Sélectionnez Ajouter une ligne : la nouvelle ligne s\'ouvre dans une grande fenêtre, avec un grand champ par colonne, Ligne précédente / Ligne suivante et Retour au tableau. Le bouton à côté de chaque ligne la rouvre dans cette fenêtre. Les personnes viennent de la structure de l\'organisation (OBS) ; les macro-processus sont choisis dans la liste du projet ; les KPI sont choisis dans la liste du projet ou créés avec Nouveau KPI.')),
        (X('Records produced. ', 'Enregistrements produits. '), X('On completion, plans and review decisions become actions of the Action plan, SMART objectives become entries of the objectives register, issues and interested parties become entries of their registers, and the RACSI is written to the RACSI matrix. The step shows links to these records.', 'À la clôture, les plans et décisions de revue deviennent des actions du plan d\'actions, les objectifs SMART des entrées du registre des objectifs, les enjeux et parties intéressées des entrées de leurs registres, et le RACSI est inscrit dans la matrice RACSI. L\'étape affiche les liens vers ces enregistrements.')),
        (X('Documents of this step. ', 'Documents de cette étape. '), X('Select Generate document, choose a template (suggested for the macro process first): the document is created as a draft, filled with the data already recorded in the project, and follows the review and approval workflow. Download it in PDF or Word from the step.', 'Sélectionnez Générer un document, choisissez un modèle (ceux du macro-processus d\'abord) : le document est créé en brouillon, rempli avec les données déjà saisies dans le projet, et suit le circuit de revue et d\'approbation. Téléchargez-le en PDF ou Word depuis l\'étape.')),
        (X('Attachments. ', 'Pièces jointes. '), X('Attach files to the step; select New version on a file to replace it while keeping the history (version, author, date, note).', 'Joignez des fichiers à l\'étape ; sélectionnez Nouvelle version sur un fichier pour le remplacer en gardant l\'historique (version, auteur, date, note).')),
        (X('AI assistance. ', 'Assistance IA. '), X('Only the AI use case of this step is shown. Select View prompt to read exactly what is sent, then Suggest. The panel says which engine answered (the organization\'s language model or the built-in engine) and why. Accept, edit or reject: nothing is saved without you.', 'Seul le cas d\'usage IA de cette étape est affiché. Sélectionnez Voir le prompt pour lire exactement ce qui est envoyé, puis Suggérer. Le panneau indique quel moteur a répondu (le modèle de langage de l\'organisation ou le moteur intégré) et pourquoi. Acceptez, modifiez ou rejetez : rien n\'est enregistré sans vous.')),
    ])
    doc.add_heading(X('Needs and expectations of interested parties', 'Besoins et attentes des parties intéressées'), level=2)
    numbered(doc, [
        X('In the step "Determine needs and expectations of interested parties", each row is one need or expectation.', 'Dans l\'étape « Déterminer les besoins et attentes des parties intéressées », chaque ligne est un besoin ou une attente.'),
        X('Type a need, select Add from the library (needs already recorded in the organization and a reference list) or Suggest with AI (needs proposed for the parties identified in the previous step).', 'Sélectionnez Saisir un besoin, Ajouter depuis la bibliothèque (besoins déjà enregistrés dans l\'organisme et liste de référence) ou Proposer avec l\'IA (besoins proposés pour les parties identifiées à l\'étape précédente).'),
        X('Link each need to one or more interested parties, choose its type, say whether it is a compliance obligation and how it is addressed.', 'Rattachez chaque besoin à une ou plusieurs parties intéressées, choisissez son type, indiquez s\'il s\'agit d\'une obligation de conformité et comment il est traité.'),
        X('Complete the step: the needs appear in the context analysis document, party by party.', 'Terminez l\'étape : les besoins apparaissent dans le document d\'analyse du contexte, partie par partie.'),
    ])
    feature(doc, 'f-needs', 16, X('Figure — Needs and expectations, each linked to one or more interested parties.', 'Figure — Besoins et attentes, chacun rattaché à une ou plusieurs parties intéressées.'))
    doc.add_heading(X('Macro process page', 'La page d\'un macro-processus'), level=2)
    bullets(doc, [
        (X('Before you start. ', 'Avant de commencer. '), X('An optional checklist lists the inputs, previous macro processes, owner and RACSI, document templates and KPIs to have in place. Items checked by the system are ticked automatically; tick the others yourself.', 'Une liste facultative recense les entrées, macro-processus précédents, responsable et RACSI, modèles de documents et KPI à avoir en place. Les éléments vérifiés par le système sont cochés automatiquement ; cochez les autres vous-même.')),
        (X('RACSI. ', 'RACSI. '), X('The RACSI tab shows the RACSI of the macro process in five columns (R, A, C, S, I; exactly one A). It applies to all steps; select Set a step-level RACSI only for a step that differs.', 'L\'onglet RACSI montre le RACSI du macro-processus en cinq colonnes (R, A, C, S, I ; un seul A). Il s\'applique à toutes les étapes ; sélectionnez Définir un RACSI d\'étape seulement pour une étape différente.')),
        (X('BPMN diagram. ', 'Diagramme BPMN. '), X('Select Full screen to see the diagram on the whole screen; select Exit full screen or press Escape to come back.', 'Sélectionnez Plein écran pour voir le diagramme sur tout l\'écran ; sélectionnez Quitter le plein écran ou appuyez sur Échap pour revenir.')),
    ])
    doc.add_heading(X('Documents and templates', 'Documents et modèles'), level=2)
    numbered(doc, [
        X('Open Records › Documents. The Documents tab lists the documented information with its version, status, next review and download buttons (PDF, Word, Excel).', 'Ouvrez Enregistrements › Documents. L\'onglet Documents liste les informations documentées avec leur version, statut, prochaine revue et boutons de téléchargement (PDF, Word, Excel).'),
        X('The Required by the standards tab lists the documented information that ISO 9001, ISO 14001 and ISO 45001 require for the standards of the project ("maintain" = a document, "retain" = a record), and the document that answers each one. Select Create for a missing one.', 'L\'onglet Exigés par les normes liste les informations documentées exigées par ISO 9001, ISO 14001 et ISO 45001 pour les normes du projet (« tenir à jour » = un document, « conserver » = un enregistrement), et le document qui répond à chacune. Sélectionnez Créer pour celles qui manquent.'),
        X('To customize documents: Customize the templates (or Records › Document templates and layout) changes the sections, their order, text and data source of all documents of a type; Layout: logo and colours sets the logo, colours, header and footer of every Word, PDF and Excel file; on a draft document, Edit the structure changes that document only.', 'Pour personnaliser les documents : Personnaliser les modèles (ou Enregistrements › Modèles de documents et mise en page) modifie les sections, leur ordre, leur texte et leur source de données pour tous les documents d\'un type ; Mise en page : logo et couleurs fixe le logo, les couleurs, l\'en-tête et le pied de page de tous les fichiers Word, PDF et Excel ; sur un document en brouillon, Modifier la structure ne change que ce document.'),
        X('Documents follow market practice: the policy is a signed statement with the strategic axes and their objectives; procedures contain BPMN diagrams, the SIPOC of each step and the Go / No-Go decision of the phase; each audit has its own report with the detailed nonconformities; each major nonconformity has an 8D report; registers are laid out landscape.', 'Les documents suivent les pratiques du marché : la politique est une déclaration signée avec les axes stratégiques et leurs objectifs ; les procédures contiennent les diagrammes BPMN, le SIPOC de chaque étape et la décision Go / No-Go de la phase ; chaque audit a son rapport avec le détail des non-conformités ; chaque non-conformité majeure a un rapport 8D ; les registres sont en paysage.'),
        X('Open a document to see its structure section by section, edit its title and review frequency, create a new version (regenerated from the current project data or copied), edit the structure of a draft, submit, approve (by another person) and download it.', 'Ouvrez un document pour voir sa structure section par section, modifier son titre et sa fréquence de revue, créer une nouvelle version (régénérée à partir des données actuelles ou copiée), modifier la structure d\'un brouillon, le soumettre, l\'approuver (par une autre personne) et le télécharger.'),
    ])
    doc.add_heading(X('Administration', 'Administration'), level=2)
    bullets(doc, [
        (X('Groups and organizations. ', 'Groupes et organisations. '), X('The platform administrator (admin@dynamicms.example) opens Administration › Groups and organizations: New group, and New organization with the question Part of a group? (No — independent organization, or Yes — member of a group). The organization is created with its administrator and a default structure (head office and departments).', 'L\'administrateur de la plateforme (admin@dynamicms.example) ouvre Administration › Groupes et organisations : Nouveau groupe, et Nouvelle organisation avec la question Membre d\'un groupe ? (Non — organisation indépendante, ou Oui — membre d\'un groupe). L\'organisation est créée avec son administrateur et une structure par défaut (siège et départements).')),
        (X('AI models. ', 'Modèles d\'IA. '), X('Administration › AI models: choose a standard provider and model (Anthropic Claude, OpenAI, Azure OpenAI, Google Gemini, Mistral) or a custom model with an OpenAI-compatible endpoint, type the API key (stored encrypted), tick "Use this model for the AI use cases", save and select Test the connection. Settings a model does not accept (for example the temperature of recent models) are not sent. Without a provider, the built-in engine answers.', 'Administration › Modèles d\'IA : choisissez un fournisseur et un modèle standard (Anthropic Claude, OpenAI, Azure OpenAI, Google Gemini, Mistral) ou un modèle personnalisé avec une API compatible OpenAI, saisissez la clé d\'API (stockée chiffrée), cochez « Utiliser ce modèle pour les cas d\'usage de l\'IA », enregistrez et sélectionnez Tester la connexion. Les paramètres qu\'un modèle n\'accepte pas (par exemple la température des modèles récents) ne sont pas envoyés. Sans fournisseur, le moteur intégré répond.')),
    ])
    doc.add_heading(X('Search', 'Recherche'), level=2)
    bullets(doc, [
        (X('Where. ', 'Où. '), X('The search bar is in the header of every screen; the Search button is at the top of the menu, in every dock position. Ctrl+K (Cmd+K on a Mac) opens the search from any screen.', 'La barre de recherche est dans l\'en-tête de chaque écran ; le bouton Rechercher est en haut du menu, dans toutes les positions d\'ancrage. Ctrl+K (Cmd+K sur Mac) ouvre la recherche depuis n\'importe quel écran.')),
        (X('What is searched. ', 'Ce qui est recherché. '), X('Steps and macro processes of the project, nonconformities, actions, audits, documents, register entries, attachments, risks, KPIs, rules and controls, AI use cases, people, units and roles, the process design and the Help topics. Codes such as MP-001.2 or NC-… are matched exactly and listed first.', 'Étapes et macro-processus du projet, non-conformités, actions, audits, documents, entrées de registres, pièces jointes, risques, KPI, règles et contrôles, cas d\'usage IA, personnes, unités et rôles, conception des processus et rubriques d\'aide. Les codes comme MP-001.2 ou NC-… sont trouvés exactement et listés en premier.')),
        (X('Results. ', 'Résultats. '), X('Results are grouped by type and can be filtered by type; use the arrow keys and Enter, or select a result to open it. You only see what you are allowed to open.', 'Les résultats sont groupés par type et filtrables par type ; utilisez les flèches et Entrée, ou sélectionnez un résultat pour l\'ouvrir. Vous ne voyez que ce que vous avez le droit d\'ouvrir.')),
        (X('Menu filter. ', 'Filtre du menu. '), X('Type in the field under the Search button to filter the menu items; press Enter to search everywhere for the same words.', 'Tapez dans le champ sous le bouton Rechercher pour filtrer le menu ; Entrée lance la recherche des mêmes mots partout.')),
    ])
    feature(doc, 'f-search', 16, X('Figure — Global search: results grouped by type, with the words found highlighted.', 'Figure — Recherche globale : résultats groupés par type, mots trouvés surlignés.'))
    doc.add_heading(X('Process design editor and functions', 'Éditeur de conception des processus et fonctions'), level=2)
    numbered(doc, [
        X('Open Design › Process design editor (or Design › Functions for the functions) and choose the element type: functions, end-to-end processes (phases), macro processes, tasks, steps, gates or checklists. For tasks and steps, choose the macro process.', 'Ouvrez Conception › Éditeur de conception des processus (ou Conception › Fonctions pour les fonctions) et choisissez le type d\'élément : fonctions, processus de bout en bout (phases), macro-processus, tâches, étapes, jalons ou listes de contrôle. Pour les tâches et étapes, choisissez le macro-processus.'),
        X('Select an element to open it. The card shows how many project runs, child elements, documents and AI use cases use it.', 'Sélectionnez un élément pour l\'ouvrir. La carte indique combien de déroulements de projets, d\'éléments enfants, de documents et de cas d\'usage IA l\'utilisent.'),
        X('Change the fields and type a change note, then select Save as new version. Every change is a new version; nothing is overwritten.', 'Modifiez les champs et saisissez une note de modification, puis sélectionnez Enregistrer comme nouvelle version. Chaque modification est une nouvelle version ; rien n\'est écrasé.'),
        X('Select History to see every version with its author, date and note, compare two versions field by field, and restore any version (a restore creates a new version with the old content).', 'Sélectionnez Historique pour voir chaque version avec son auteur, sa date et sa note, comparer deux versions champ par champ et restaurer n\'importe quelle version (une restauration crée une nouvelle version avec l\'ancien contenu).'),
        X('Select New element to create your own function, phase, macro process, task, step, gate or checklist. Steps and tasks must be named with a verb and their object.', 'Sélectionnez Nouvel élément pour créer votre propre fonction, phase, macro-processus, tâche, étape, jalon ou liste. Les étapes et tâches se nomment par un verbe et leur objet.'),
        X('Select Retire or delete: an element of your own that no project uses is deleted (and can be restored from its history); a reference element, or one used by projects, is retired.', 'Sélectionnez Retirer ou supprimer : un élément propre qu\'aucun projet n\'utilise est supprimé (et restaurable depuis son historique) ; un élément de référence, ou utilisé par des projets, est retiré.'),
    ])
    callout(doc, X('Projects keep the version of the process design they started with. A change applies to the projects started after it; the steps of a new project then show the new names and descriptions.', 'Les projets gardent la version de la conception des processus avec laquelle ils ont démarré. Une modification s\'applique aux projets démarrés après elle ; les étapes d\'un nouveau projet affichent alors les nouveaux noms et descriptions.'), X('Versions and running projects.', 'Versions et projets en cours.'))
    feature(doc, 'f-design-edit', 16, X('Figure — Editing a step: fields, usage, change note and history.', 'Figure — Modification d\'une étape : champs, utilisation, note de modification et historique.'))
    doc.add_heading(X('Roles and functions', 'Rôles et fonctions'), level=2)
    bullets(doc, [
        (X('Model. ', 'Modèle. '), X('The organization structure (OBS) is made of units, roles and people. A role is defined in a unit and linked to one or more functions. A person can play several roles, as holder, deputy or acting, with an allocation and start and end dates.', 'La structure de l\'organisation (OBS) est faite d\'unités, de rôles et de personnes. Un rôle est défini dans une unité et rattaché à une ou plusieurs fonctions. Une personne peut tenir plusieurs rôles, comme titulaire, suppléant ou intérimaire, avec une quote-part et des dates de début et de fin.')),
        (X('Views. ', 'Vues. '), X('Organization › Roles and functions shows the roles (unit, functions, people), the functions (roles and people of each function) and the people (roles each person plays). Vacant roles are flagged.', 'Organisation › Rôles et fonctions montre les rôles (unité, fonctions, personnes), les fonctions (rôles et personnes de chaque fonction) et les personnes (rôles tenus par chacune). Les rôles vacants sont signalés.')),
        (X('Changes. ', 'Modifications. '), X('New role, Edit and Retire create versions of the role (History to compare and restore). Assign adds a person to a role; End assignment closes it and lists the open actions of the person that need a new owner.', 'Nouveau rôle, Modifier et Retirer créent des versions du rôle (Historique pour comparer et restaurer). Affecter ajoute une personne à un rôle ; Terminer l\'affectation la clôt et liste les actions ouvertes de la personne à réattribuer.')),
        (X('Access rights. ', 'Droits d\'accès. '), X('A role proposes an access role to its holders, but access is always decided by the permission matrix.', 'Un rôle propose un rôle d\'accès à ses titulaires, mais l\'accès est toujours décidé par la matrice des permissions.')),
    ])
    feature(doc, 'f-roles', 16, X('Figure — Roles and functions: roles with their functions and the people who play them.', 'Figure — Rôles et fonctions : les rôles avec leurs fonctions et les personnes qui les tiennent.'))
    doc.add_heading(X('Prompt specification of the AI use cases', 'Spécification du prompt des cas d\'usage IA'), level=2)
    para(doc, X('Every AI use case is linked to the step it assists and carries its prompt as twelve separate fields, populated for that step: Role (persona), Context, Task (instruction), Inputs (variables), Knowledge sources, Constraints, Examples, Output format, Tone and language, Quality criteria, Human checkpoint and Model parameters.', 'Chaque cas d\'usage IA est rattaché à l\'étape qu\'il assiste et porte son prompt en douze champs distincts, remplis pour cette étape : rôle (persona), contexte, tâche (instruction), entrées (variables), sources de connaissances, contraintes, exemples, format de sortie, ton et langue, critères de qualité, contrôle humain et paramètres du modèle.'))
    numbered(doc, [
        X('Open Intelligence › AI use cases, select a use case, then Prompt specification.', 'Ouvrez Intelligence › Cas d\'usage IA, sélectionnez un cas d\'usage, puis Spécification du prompt.'),
        X('Edit any field and save: each field changed gets its own version, and the whole prompt a new version.', 'Modifiez un champ et enregistrez : chaque champ modifié reçoit sa version, et le prompt complet une nouvelle version.'),
        X('Select History on a field to compare and restore one of its versions, or the history of the whole prompt to restore a complete version.', 'Sélectionnez Historique sur un champ pour comparer et restaurer une de ses versions, ou l\'historique du prompt complet pour restaurer une version entière.'),
        X('The completeness bar shows the required fields (role, context, task, constraints, output format, human checkpoint). A use case with an incomplete specification cannot be activated.', 'La barre de complétude montre les champs obligatoires (rôle, contexte, tâche, contraintes, format de sortie, contrôle humain). Un cas d\'usage dont la spécification est incomplète ne peut pas être activé.'),
        X('Select View the assembled prompt to see what is sent to the model, section by section.', 'Sélectionnez Voir le prompt assemblé pour lire ce qui est envoyé au modèle, section par section.'),
    ])
    feature(doc, 'f-prompt', 16, X('Figure — Prompt specification: one field per aspect, each with its history.', 'Figure — Spécification du prompt : un champ par aspect, chacun avec son historique.'))
    doc.add_heading(X('Audits: frequency and detailed findings', 'Audits : fréquence et constats détaillés'), level=2)
    bullets(doc, [
        (X('Frequency. ', 'Fréquence. '), X('When you plan an audit, choose its frequency in the list (monthly, quarterly, semi-annual, annual, every 2 years, every 3 years) or Custom and describe it (for example "once, 6 weeks before the certification audit").', 'Quand vous planifiez un audit, choisissez sa fréquence dans la liste (mensuelle, trimestrielle, semestrielle, annuelle, tous les 2 ans, tous les 3 ans) ou Personnalisée et décrivez-la (par exemple « une fois, 6 semaines avant l\'audit de certification »).')),
        (X('Findings. ', 'Constats. '), X('A finding is graded major nonconformity, minor nonconformity, observation or opportunity for improvement, with the clause, the requirement, the objective evidence and, for a nonconformity, the response due date and the corrective action.', 'Un constat est qualifié non-conformité majeure, non-conformité mineure, observation ou piste d\'amélioration, avec l\'article, l\'exigence, la preuve objective et, pour une non-conformité, la date de réponse et l\'action corrective.')),
        (X('Reports. ', 'Rapports. '), X('Each audit carried out has its own internal audit report with the detailed report of every nonconformity; each major or critical nonconformity has an 8D corrective action report.', 'Chaque audit réalisé a son rapport d\'audit interne avec le détail de chaque non-conformité ; chaque non-conformité majeure ou critique a un rapport d\'action corrective 8D.')),
    ])
    feature(doc, 'f-audit-detail', 16, X('Figure — An audit: scope, criteria, frequency and graded findings with their objective evidence.', 'Figure — Un audit : périmètre, critères, fréquence et constats qualifiés avec leurs preuves.'))
    doc.add_heading(X('Registers', 'Registres'), level=2)
    para(doc, X('Records › Registers holds the registers of the project, including context issues, interested parties, measuring equipment, training records, communication plan and log, changes, control plan, requirement reviews, releases, nonconforming outputs and 8D reports. Select an entry to see all its fields.', 'Enregistrements › Registres contient les registres du projet, dont les enjeux du contexte, les parties intéressées, les équipements de mesure, les enregistrements de formation, le plan et le journal de communication, les modifications, le plan de surveillance, les revues des exigences, les libérations, les éléments non conformes et les rapports 8D. Sélectionnez une entrée pour voir tous ses champs.'))
    feature(doc, 'f-register-entry', 14, X('Figure — A measuring equipment entry with all its fields.', 'Figure — Une entrée d\'équipement de mesure avec tous ses champs.'))


def users_table(doc, data):
    doc.add_heading(X('Accounts of the organization', 'Comptes de l\'organisation'), level=3)
    para(doc, X('All accounts use the password Demo@2026. Sign in with the account whose role owns the step you want to complete; the IMS Manager and process owners can complete any step.', 'Tous les comptes utilisent le mot de passe Demo@2026. Connectez-vous avec le compte dont le rôle porte l\'étape à réaliser ; le responsable SMI et les pilotes de processus peuvent réaliser toute étape.'))
    table(doc, [X('Role', 'Rôle'), X('Name', 'Nom'), X('E-mail to type', 'E-mail à saisir')], [[u['role'], u['name'], u['email']] for u in data['users']], [6, 4.5, 7.5], size=9.5)


def records_section(doc, data):
    r = data['records']
    doc.add_heading(X('Records created along the run', 'Enregistrements créés au fil du déroulement'), level=2)
    para(doc, X('Besides the workflow steps, the run creates records in the Records and Governance menus. The examples below are the ones seeded in the demonstration; type the same values to reproduce them.', 'Outre les étapes, le déroulement crée des enregistrements dans les menus Enregistrements et Gouvernance. Les exemples ci-dessous sont ceux de la démonstration ; saisissez les mêmes valeurs pour les reproduire.'))
    if r['ncs']:
        n = r['ncs'][0]
        doc.add_heading(X('Report a problem (nonconformity)', 'Signaler un problème (non-conformité)'), level=3)
        numbered(doc, [X('Open Records › Nonconformities and select Report a problem.', 'Ouvrez Enregistrements › Non-conformités et sélectionnez Signaler un problème.'),
                       X(f"Title: type “{n['title']}”.", f"Titre : saisissez « {n['title']} »."),
                       X(f"Description: type “{n['description']}”.", f"Description : saisissez « {n['description']} »."),
                       X(f"Source: choose {n['source']}. Criticality: choose {n['criticality']}.", f"Source : choisissez {n['source']}. Criticité : choisissez {n['criticality']}."),
                       X('Select Submit. A Critical problem raises an alert to the Quality Manager and top management.', 'Sélectionnez Soumettre. Un problème critique déclenche une alerte vers le responsable qualité et la direction.'),
                       X('Open the nonconformity, move it to Analysis, then type the root cause', 'Ouvrez la non-conformité, passez-la en Analyse, puis saisissez la cause racine') + (f" (“{n['rootCause']}”)" if n['rootCause'] and LANG == 'en' else f" (« {n['rootCause']} »)" if n['rootCause'] else '') + '.',
                       X('Select Add action: type the title, choose an owner and a different evaluator, and a due date.', 'Sélectionnez Ajouter une action : saisissez le titre, choisissez un responsable et un évaluateur différent, et une échéance.'),
                       X('When all actions are closed, move to Verification then Closed; type the lessons learned (what went well, what did not, recommendation).', 'Quand toutes les actions sont clôturées, passez en Vérification puis Clôturée ; saisissez le retour d\'expérience (ce qui a bien marché, ce qui n\'a pas marché, recommandation).')])
    if r['risks']:
        doc.add_heading(X('Record a risk', 'Enregistrer un risque'), level=3)
        k = r['risks'][0]
        numbered(doc, [X('Open Governance › Risks and opportunities and select Add.', 'Ouvrez Gouvernance › Risques et opportunités et sélectionnez Ajouter.'),
                       X(f"Title: “{k['title']}”; kind {k['kind']}; likelihood {k['l']}; impact {k['i']}.", f"Titre : « {k['title']} » ; nature {k['kind']} ; probabilité {k['l']} ; impact {k['i']}."),
                       X(f"Treatment: “{k['treatment'] or 'Reduce'}”, then select Save. The heatmap updates immediately.", f"Traitement : « {k['treatment'] or 'Réduire'} », puis sélectionnez Enregistrer. La carte de chaleur se met à jour aussitôt.")])
        table(doc, [X('Code', 'Code'), X('Kind', 'Nature'), X('Title', 'Titre'), 'P × I' if LANG == 'fr' else 'L × I'], [[x['code'], x['kind'], x['title'], f"{x['l']} × {x['i']} = {x['l'] * x['i']}"] for x in r['risks']], [2.2, 2.2, 11, 2.6], size=9.5)
    if r['kpis']:
        doc.add_heading(X('Record a KPI measurement', 'Enregistrer une mesure de KPI'), level=3)
        k = r['kpis'][0]
        numbered(doc, [X(f"Open Governance › KPIs and select {k['code']} — {k['name']}.", f"Ouvrez Gouvernance › KPI et sélectionnez {k['code']} — {k['name']}."),
                       X(f"In Record a measurement, type the period (for example 2026-09) and the value (for example {k['last']}); target {k['target']}.", f"Dans Enregistrer une mesure, saisissez la période (par exemple 2026-09) et la valeur (par exemple {k['last']}) ; cible {k['target']}."),
                       X('Select Record. A value off target raises a KPI alert to the Performance Manager and the IMS Manager.', 'Validez. Une valeur hors cible déclenche une alerte KPI vers le responsable performance et le responsable SMI.')])
    if r['audits']:
        doc.add_heading(X('Audit programme', 'Programme d\'audit'), level=3)
        table(doc, [X('Code', 'Code'), X('Audit', 'Audit'), X('Standard', 'Norme'), X('Planned', 'Prévu'), X('Status', 'Statut')], [[a['code'], a['title'], a['standard'], a['planned_date'], a['status']] for a in r['audits']], [3.6, 7, 3.4, 2.2, 1.8], size=9)
        para(doc, X('To add a finding: open the audit, select Add finding, choose the type (Major, Minor, Observation, Opportunity for improvement), type the clause and the finding; for Major and Minor choose the action owner and a different evaluator.', 'Pour ajouter un constat : ouvrez l\'audit, sélectionnez Ajouter un constat, choisissez le type (Majeure, Mineure, Observation, Piste d\'amélioration), saisissez l\'article et le constat ; pour une majeure ou une mineure, choisissez le responsable de l\'action et un évaluateur différent.'))
    if r['documents']:
        doc.add_heading(X('Documented information generated from the templates', 'Informations documentées générées à partir des modèles'), level=3)
        para(doc, X('Every document below is generated from an IMS template and filled with the data of this run (issues, interested parties, needs, objectives, RACSI, KPIs, risks, audits, nonconformities...). Open Records › Documents and select Download to get it in PDF, Word or Excel.', 'Chaque document ci-dessous est généré à partir d\'un modèle SMI et rempli avec les données de ce déroulement (enjeux, parties intéressées, besoins, objectifs, RACSI, KPI, risques, audits, non-conformités…). Ouvrez Enregistrements › Documents et sélectionnez Télécharger pour l\'obtenir en PDF, Word ou Excel.'))
        table(doc, [X('Code', 'Code'), X('Title', 'Titre'), X('Template', 'Modèle'), X('Version', 'Version'), X('Status', 'Statut')], [[d['code'], d['title'], d.get('template_id') or '—', d['current_version'], d['status']] for d in r['documents']], [4.6, 7.2, 2.6, 1.4, 2.2], size=8.5)
        para(doc, X('To revise a document: open it, select New version, choose Minor or Major, type the summary of change and choose whether to regenerate the content from the current project data; then Submit for review. Another user approves and publishes it; the author cannot approve their own version.', 'Pour réviser un document : ouvrez-le, sélectionnez Nouvelle version, choisissez Mineure ou Majeure, saisissez le résumé de la modification et choisissez de régénérer ou non le contenu à partir des données actuelles ; puis Soumettre à la revue. Un autre utilisateur l\'approuve et le publie ; l\'auteur ne peut pas approuver sa propre version.'))
    doc.add_heading(X('Export the management review report', 'Exporter le rapport de revue de direction'), level=3)
    numbered(doc, [X('Open Insight › Reports.', 'Ouvrez Pilotage › Rapports.'), X('Choose the format (PDF, Excel, Word or CSV) and the language.', 'Choisissez le format (PDF, Excel, Word ou CSV) et la langue.'), X('Select Download on Management review input. The report compiles objectives, KPIs, audit results, nonconformities and phase status.', 'Sélectionnez Télécharger sur Éléments d\'entrée de la revue de direction. Le rapport compile objectifs, KPI, résultats d\'audit, non-conformités et état des phases.')])


def scenario(doc, n, title, data, shots_code):
    p = data['project']; o = data['org']
    doc.add_heading(X(f'Scenario {n} — {title}', f'Scénario {n} — {title}'), level=1)
    para(doc, X(f"Organization: {o['name']} ({o['code']}), {o['size']} company, vertical {o['sector']}, {o['employees']} employees", f"Organisation : {o['name']} ({o['code']}), entreprise {o['size']}, secteur {o['sector']}, {o['employees']} salariés") + ((X(f", member of {o['group']}", f", membre de {o['group']}")) if o['group'] else X(', independent organization', ', organisation indépendante')) + '.')
    para(doc, X(f"Project: {p['code']} — {p['name']}. Management system {p['ms']}, mode {p['mode']}", f"Projet : {p['code']} — {p['name']}. Système de management {p['ms']}, mode {p['mode']}") + (X(f", track {p['track']}", f", parcours {p['track']}") if p['track'] else '') + X(f". Standards: {', '.join(p['standards'])}. Start {p['start']}, end {p['end']}.", f". Normes : {', '.join(p['standards'])}. Début {p['start']}, fin {p['end']}."))
    para(doc, X(f"Configuration: Solution Pack {o['pack']}", f"Configuration : Solution Pack {o['pack']}") + (X(f", industry pack {', '.join(o['industry'])}", f", pack sectoriel {', '.join(o['industry'])}") if o['industry'] else '') + X(f", capability packs {', '.join(o['caps']) or '—'}, add-ons {', '.join(o['addons']) or '—'}.", f", packs de capacités {', '.join(o['caps']) or '—'}, options {', '.join(o['addons']) or '—'}."))
    shot(doc, shots_code, 'home', X(f"Figure — Home dashboard of {p['code']}: progress by phase, KPI trend and next steps.", f"Figure — Tableau de bord de {p['code']} : avancement par phase, tendance des KPI et prochaines étapes."))
    doc.add_heading(X('Before you start', 'Avant de commencer'), level=2)
    users_table(doc, data)
    doc.add_heading(X('Create the project', 'Créer le projet'), level=3)
    crit = data.get('criteria') or []
    if p['creation'] == 'catalog':
        numbered(doc, [X('Sign in as the IMS Manager (or the Quality Manager) and open Organization › New project.', 'Connectez-vous comme responsable SMI (ou responsable qualité) et ouvrez Organisation › Nouveau projet.'), X('Select From the catalog.', 'Sélectionnez Depuis le catalogue.'),
                       X(f"Name: type “{p['name']}”. Management system: {p['ms']}. Start date: {p['start']}.", f"Nom : saisissez « {p['name']} ». Système de management : {p['ms']}. Date de début : {p['start']}."),
                       (X(f"Template: choose {data['template']['code']} — {data['template']['name']}.", f"Modèle : choisissez {data['template']['code']} — {data['template']['name']}.") if data.get('template') else X('Template: choose the template of your vertical.', 'Modèle : choisissez le modèle de votre secteur.')),
                       X('Complexity score: set each criterion level as listed below, then select Create project.', 'Score de complexité : réglez le niveau de chaque critère comme ci-dessous, puis sélectionnez Créer le projet.')])
    elif p['creation'] == 'ai':
        numbered(doc, [X('Sign in as the IMS Manager and open Organization › New project.', 'Connectez-vous comme responsable SMI et ouvrez Organisation › Nouveau projet.'), X('Select With AI.', 'Sélectionnez Avec l\'IA.'),
                       X(f"Short description: type “{p['ms']} certification for {o['name']} before the customer audit, with a small team.”", f"Description courte : saisissez « Certification {p['ms']} pour {o['name']} avant l'audit client, avec une petite équipe. »"), X('Select Draft the project, keep the suggested items ticked, select Apply accepted items.', 'Sélectionnez Rédiger le projet, laissez cochés les éléments proposés, sélectionnez Appliquer les éléments acceptés.'),
                       X(f"Name: type “{p['name']}”; check the track ({p['track']}) and the complexity levels below, then select Create project.", f"Nom : saisissez « {p['name']} » ; vérifiez le parcours ({p['track']}) et les niveaux de complexité ci-dessous, puis sélectionnez Créer le projet.")])
    else:
        numbered(doc, [X('Sign in as the IMS Manager and open Organization › New project.', 'Connectez-vous comme responsable SMI et ouvrez Organisation › Nouveau projet.'), X('Select Manual.', 'Sélectionnez Manuel.'), X(f"Name: type “{p['name']}”. Management system: {p['ms']}. Start date: {p['start']}.", f"Nom : saisissez « {p['name']} ». Système de management : {p['ms']}. Date de début : {p['start']}."),
                       X('Tick the phases that need a gate, shown as "E2E-01 (Context To Strategy)"… (for an SME, the track decides: Light E2E-01 and E2E-10; Standard adds E2E-04 and E2E-09; Advanced adds E2E-03 and E2E-08).', 'Cochez les phases qui ont un jalon, affichées « E2E-01 (Du contexte à la stratégie) »… (pour une PME, le parcours décide : Léger E2E-01 et E2E-10 ; Standard ajoute E2E-04 et E2E-09 ; Avancé ajoute E2E-03 et E2E-08).'), X(f"Set the complexity levels below and keep the recommended track ({p['track']}); select Create project.", f"Réglez les niveaux de complexité ci-dessous et gardez le parcours recommandé ({p['track']}) ; sélectionnez Créer le projet.")])
    if crit:
        table(doc, [X('Criterion', 'Critère'), X('Weight', 'Poids'), X('Level to choose', 'Niveau à choisir')], [[c['code'], str(c['weight']), str(c['level'])] for c in crit], [6, 4, 8], size=9.5)
        sc = data.get('score') or {}
        para(doc, X(f"Resulting complexity score: {sc.get('score', '')} / 100", f"Score de complexité obtenu : {sc.get('score', '')} / 100") + (X(f"; recommended track {sc['recommended_track']}, chosen {sc['chosen_track']}.", f" ; parcours recommandé {sc['recommended_track']}, choisi {sc['chosen_track']}.") if sc.get('recommended_track') else '.'))
    callout(doc, X('The demonstration database already contains this project with its full run. To practise, create a copy with another name, or open the seeded project and follow the steps that are still open.', 'La base de démonstration contient déjà ce projet avec son déroulement complet. Pour vous exercer, créez une copie sous un autre nom, ou ouvrez le projet de démonstration et suivez les étapes encore ouvertes.'), X('Note.', 'Remarque.'))
    shot(doc, shots_code, 'lifecycle', X('Figure — Lifecycle screen: phase cards with progress and gate status.', 'Figure — Écran Cycle de vie : cartes des phases avec avancement et état des jalons.'))
    total = sum(len(t['steps']) for ph in data['phases'] for m in ph['mps'] for t in m['tasks'])
    doc.add_heading(X('Run the lifecycle, phase by phase', 'Dérouler le cycle de vie, phase par phase'), level=2)
    para(doc, X(f"The run has {len(data['phases'])} phases, {sum(len(ph['mps']) for ph in data['phases'])} macro processes and {total} steps. For each step the tables give the step identifier, the responsible role, the form and what to type in each field. Values between quotes are typed as shown; choose list values as written.",
                f"Le déroulement compte {len(data['phases'])} phases, {sum(len(ph['mps']) for ph in data['phases'])} macro-processus et {total} étapes. Pour chaque étape, les tableaux donnent l'identifiant, le rôle responsable, le formulaire et ce qu'il faut saisir dans chaque champ. Les valeurs entre guillemets se saisissent telles quelles ; choisissez les valeurs de liste comme écrites."))
    first_step_shot = True
    for ph in data['phases']:
        doc.add_heading(f"{ph['id']} — {ph['name']}", level=2)
        para(doc, ph['goals'], X('Goals: ', 'Objectifs : '))
        para(doc, f"{ph['trigger']} → {ph['terminal']}", X('From trigger to terminal event: ', 'Du déclencheur à l\'événement final : '))
        for mp in ph['mps']:
            doc.add_heading(f"{mp['code']} ({mp['id']}) — {mp['name']}", level=3)
            para(doc, X(f"{mp['goal']} Owner: {mp['owner']}. Tier {mp['tier']}.", f"{mp['goal']} Pilote : {mp['owner']}. Niveau {mp['tier']}.") + ((X(f" Requirements answered: {mp['clauses']}.", f" Exigences couvertes : {mp['clauses']}.")) if mp.get('clauses') else ''), size=10.5)
            if mp.get('documents'):
                para(doc, '; '.join(f"{d['code']} ({d['title']})" for d in mp['documents'][:6]) + '.', X('Documents of this macro process: ', 'Documents de ce macro-processus : '), size=10)
            rows = []
            details = []
            for tk in mp['tasks']:
                for s in tk['steps']:
                    typed = []
                    for f in s['type_']:
                        if f.get('columns') is not None:
                            nrows = len(f.get('rows') or [])
                            if f['type'] == 'racsi':
                                r0 = (f.get('rows') or [[]])[0]
                                typed.append((f"{f['field']}: " if LANG == 'en' else f"{f['field']} : ", ' · '.join(f"{k}: {v}" for k, v in zip(f['columns'], r0) if v) or '—'))
                            else:
                                txt = X(f"{nrows} row{'s' if nrows != 1 else ''} — see the table below", f"{nrows} ligne{'s' if nrows != 1 else ''} — voir le tableau ci-dessous") if nrows else '—'
                                typed.append((f"{f['field']}: " if LANG == 'en' else f"{f['field']} : ", txt))
                                if nrows:
                                    details.append((s, f))
                        else:
                            typed.append((f"{f['field']}: " if LANG == 'en' else f"{f['field']} : ", f.get('value') or '—'))
                    if s.get('creates'):
                        typed.append((X('On completion: ', 'À la clôture : '), X(' and ', ' et ').join(X('rows become actions', 'les lignes deviennent des actions') if c == 'actions' else X('rows become objectives', 'les lignes deviennent des objectifs') for c in s['creates']) + '.'))
                    rows.append([s['id'], [s['name'], (X('Task: ', 'Tâche : '), tk['name']), s['brief']], [s['role'], s['form']], typed])
            table(doc, [X('Step', 'Étape'), X('Step, task and purpose', 'Étape, tâche et finalité'), X('Role · form', 'Rôle · formulaire'), X('What to type', 'Ce qu\'il faut saisir')], rows, [1.9, 5.0, 3.1, 8.0], size=8.5)
            for s, f in details:
                cols = f['columns']
                w = [0.7] + [max(1.6, (17.3 / len(cols)) * (1.5 if any(k in c for k in ('Description', 'Facts', 'message', 'Finding', 'Why', 'objective', 'Faits', 'Constat', 'Pourquoi', 'objectif', 'Besoin', 'Need')) else 0.85)) for c in cols]
                tot = sum(w); w = [x * 17 / tot for x in w]
                para(doc, f"{s['id']} — {s['name']} · {f['field']}", size=9.5)
                table(doc, ['#'] + cols, [[str(i + 1)] + [str(x) for x in r] for i, r in enumerate(f['rows'])], w, size=8)
            if first_step_shot:
                shot(doc, shots_code, 'step', X('Figure — A step form with a record table: qualified column titles, lists with Custom, one row per item with its own source.', 'Figure — Formulaire d\'une étape avec un tableau d\'enregistrements : titres de colonnes qualifiés, listes avec Personnalisé, une ligne par élément avec sa source.'))
                first_step_shot = False
        if ph['gate']:
            g = ph['gate']
            doc.add_heading(X(f"Gate — {g['name']}", f"Jalon — {g['name']}"), level=3)
            para(doc, g['exit'], X('Exit criteria: ', 'Critères de sortie : '))
            items = [f"{it['text']}{(X(' (mandatory', ' (obligatoire') + (X(', evidence required', ', preuve exigée') if it['evidence'] else '') + ')') if it['mandatory'] else ''}" for cl in g['checklists'] for it in cl['items']]
            numbered(doc, [X('Open Lifecycle and select the phase card; the gate panel is on the right.', 'Ouvrez Cycle de vie et sélectionnez la carte de la phase ; le panneau du jalon est à droite.')] + [X(f'Tick “{x}”.', f'Cochez « {x} ».') for x in items] + [X('Sign in as Top Management (ceo@…) or the IMS Manager and select Go. For Hold or No-Go, type a comment explaining why.', 'Connectez-vous comme direction (ceo@…) ou responsable SMI et sélectionnez Go. Pour En attente ou No-Go, saisissez un commentaire qui explique pourquoi.')])
        else:
            para(doc, X('This phase has no gate for the project track; it closes when its last step is completed.', 'Cette phase n\'a pas de jalon pour le parcours du projet ; elle se clôt quand sa dernière étape est terminée.'), italic=True)
    records_section(doc, data)
    shot(doc, shots_code, 'ncs', X('Figure — Nonconformity register of the project.', 'Figure — Registre des non-conformités du projet.'))
    shot(doc, shots_code, 'documents', X('Figure — Documents: documented information generated from the templates, with versions and downloads.', 'Figure — Documents : informations documentées générées à partir des modèles, avec versions et téléchargements.'))
    shot(doc, shots_code, 'reports', X('Figure — Reports: choose the format and language, then download.', 'Figure — Rapports : choisissez le format et la langue, puis téléchargez.'))


def build(file_no, title, subtitle, scenarios, fname, example_email):
    doc = new_document(title, X(f'DynamicMS — User Guide {file_no}', f'DynamicMS — Guide utilisateur {file_no}'))
    cover(doc, X(f'User Guide {file_no}', f'Guide utilisateur {file_no}'), title, subtitle, X('AI Value · DynamicMS 1.0 · October 2026', 'AI Value · DynamicMS 1.0 · octobre 2026'))
    toc(doc)
    doc.add_heading(X('About this guide', 'À propos de ce guide'), level=1)
    para(doc, X('This guide, written by AI Value, walks through complete runs of a management system in DynamicMS: every end-to-end phase, macro process, task and step, with the values to type in each form. The values come from the demonstration data seeded with the application, so the screens match the guide.',
                'Ce guide, rédigé par AI Value, parcourt des déroulements complets d\'un système de management dans DynamicMS : chaque phase de bout en bout, macro-processus, tâche et étape, avec les valeurs à saisir dans chaque formulaire. Les valeurs viennent des données de démonstration livrées avec l\'application ; les écrans correspondent donc au guide.'))
    bullets(doc, [(X('Audience. ', 'Public. '), X('IMS, quality and HSE managers, process owners, auditors and top management.', 'Responsables SMI, qualité et HSE, pilotes de processus, auditeurs et direction.')),
                  (X('Conventions. ', 'Conventions. '), X('Menu paths are written Menu › Screen. Values to type are shown after the field name; list values are chosen as written.', 'Les chemins de menu s\'écrivent Menu › Écran. Les valeurs à saisir suivent le nom du champ ; les valeurs de liste se choisissent comme écrites.')),
                  (X('Scenarios. ', 'Scénarios. '), '; '.join(X(f'Scenario {i + 1}: {s[0]}', f'Scénario {i + 1} : {s[0]}') for i, s in enumerate(scenarios)) + '.')])
    getting_started(doc, example_email)
    for i, (stitle, code) in enumerate(scenarios, 1):
        data = json.load(open(os.path.join(BUILD, f'{code}.json' if LANG == 'en' else f'{code}.fr.json'), encoding='utf8'))
        page_break(doc)
        scenario(doc, i, stitle, data, code)
    page_break(doc)
    doc.add_heading(X('Appendix — Frequent questions', 'Annexe — Questions fréquentes'), level=1)
    table(doc, [X('Question', 'Question'), X('Answer', 'Réponse')], [
        [X('I cannot complete a step.', 'Je ne peux pas terminer une étape.'), X('The step is assigned to another role, or its phase gate is passed. Sign in with the role shown on the step, or ask the IMS Manager.', 'L\'étape est affectée à un autre rôle, ou le jalon de sa phase est franchi. Connectez-vous avec le rôle indiqué sur l\'étape, ou demandez au responsable SMI.')],
        [X('The Go button is disabled.', 'Le bouton Go est désactivé.'), X('Some steps of the phase are still open. The gate panel shows how many.', 'Des étapes de la phase sont encore ouvertes. Le panneau du jalon indique combien.')],
        [X('Can the same person own and evaluate an action?', 'Une même personne peut-elle porter et évaluer une action ?'), X('No. The application refuses it on screen and on the server.', 'Non. L\'application le refuse à l\'écran et sur le serveur.')],
        [X('Where are my changes recorded?', 'Où mes modifications sont-elles tracées ?'), X('Every change is written to the audit trail (Administration › Audit trail) and versioned records keep their history.', 'Chaque modification est inscrite dans la piste d\'audit (Administration › Piste d\'audit) et les enregistrements versionnés gardent leur historique.')],
        [X('Does the AI send my data outside?', 'L\'IA envoie-t-elle mes données à l\'extérieur ?'), X('Only if your administrator enables an external language model in Administration › AI models. Otherwise answers are built from DynamicMS content and your records. View prompt shows what would be sent, and every answer says which engine produced it.', 'Seulement si votre administrateur active un modèle de langage externe dans Administration › Modèles d\'IA. Sinon les réponses sont construites à partir du contenu de DynamicMS et de vos enregistrements. Voir le prompt montre ce qui serait envoyé, et chaque réponse indique quel moteur l\'a produite.')],
        [X('Where are the records produced by a step?', 'Où sont les enregistrements produits par une étape ?'), X('The step shows them under Records produced by this step and Documents of this step: actions (Action plan), objectives and other entries (Registers), RACSI (RACSI matrix), KPI values (KPIs) and documents (Documents).', 'L\'étape les affiche sous Enregistrements produits par cette étape et Documents de cette étape : actions (plan d\'actions), objectifs et autres entrées (Registres), RACSI (matrice RACSI), valeurs de KPI (KPI) et documents (Documents).')],
    ], [6, 11], size=10, bold_first=True)
    path = os.path.join(OUT, fname)
    doc.save(path)
    print('saved', path)


GUIDES = {
    1: dict(title=('Universal — Large and Big Companies', 'Universel — Grandes entreprises'),
            subtitle=('Scenario 1 Universal QMS · Scenario 2 Universal QHSE', 'Scénario 1 SMQ universel · Scénario 2 QHSE universel'),
            scenarios=[(('Universal QMS (ISO 9001)', 'SMQ universel (ISO 9001)'), 'HZ-UNI-QMS'), (('Universal QHSE (ISO 9001, 14001, 45001)', 'QHSE universel (ISO 9001, 14001, 45001)'), 'HZ-UNI-QHSE')],
            fname='DynamicMS_User_Guide_1_Universal_Large_{L}.docx', email='quality@horizon-universal.example'),
    2: dict(title=('Small and Medium Enterprises', 'Petites et moyennes entreprises'),
            subtitle=('Scenario 1 SME QMS · Scenario 2 SME QHSE · Scenario 3 SME QMS for AEC & Construction', 'Scénario 1 SMQ PME · Scénario 2 QHSE PME · Scénario 3 SMQ PME Architecture, ingénierie et construction'),
            scenarios=[(('SME QMS, any sector (ISO 9001)', 'SMQ PME, tout secteur (ISO 9001)'), 'AT-UNI-QMS'), (('SME QHSE (ISO 9001, 14001, 45001)', 'QHSE PME (ISO 9001, 14001, 45001)'), 'AT-UNI-QHSE'), (('SME QMS for AEC & Construction (ISO 9001, ISO 19650, EN 1090)', 'SMQ PME Architecture, ingénierie et construction (ISO 9001, ISO 19650, EN 1090)'), 'NV-AEC-QMS')],
            fname='DynamicMS_User_Guide_2_SME_{L}.docx', email='ims@atlas-sme.example'),
}


if __name__ == '__main__':
    which = sys.argv[1] if len(sys.argv) > 1 else 'all'
    langs = sys.argv[2] if len(sys.argv) > 2 else 'all'
    for lang in (['en', 'fr'] if langs == 'all' else [langs]):
        LANG = lang
        brand.set_lang(lang)
        k = 0 if lang == 'en' else 1
        for no, g in GUIDES.items():
            if which in (str(no), 'all'):
                build(no, g['title'][k], g['subtitle'][k], [(t[k], code) for t, code in g['scenarios']], g['fname'].replace('{L}', lang.upper()), g['email'])
