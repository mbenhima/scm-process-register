"""Builds the user guide of the customer runtime (Word with TOC, then PDF), in French:
Guide_Utilisateur_Runtime_Customer_DynamicMS_FR.docx.
It reuses the full real run of build_flow_guide.py (12 end-to-end processes, every macro process,
task and step) and adapts it to the customer runtime:
- every step shows how it is done: Manuel, Modèle (+ Manuel), IA (+ Manuel) or Auto;
- a chapter shows the three ways to create a project (catalog template, manual, AI) and how they
  combine, with screenshots of the customer runtime;
- no commercial content (packs, add-ons, prices) and no demonstration account or password: users
  sign in with the initial password given by their administrator, then choose their own.
Screens: deliverables/build/flow-fr and deliverables/build/runtime-fr.
Usage: python3 build_customer_user_guide.py"""
import collections
import os

from docx.shared import Pt, Cm

import brand
import build_flow_guide as G
from brand import new_document, cover, toc, page_break, para, bullets, numbered, table, callout, image, NAVY, AZURE, MUTED, GREEN, TEAL

RT = os.path.join(G.BUILD, 'runtime-fr')
NAME = 'Guide_Utilisateur_Runtime_Customer_DynamicMS_FR'
INITIAL = "le mot de passe initial communiqué par votre administrateur ; à la première connexion, choisissez votre propre mot de passe (12 caractères au moins, avec majuscule, minuscule et chiffre)"

# ---------------------------------------------------------------- wording of the customer runtime
_X = G.X
FIXES = [
    ('saisissez Demo@2026', 'saisissez ' + INITIAL),
    ('Demo@2026', 'mot de passe initial communiqué par votre administrateur'),
    ('de la base de démonstration', 'des données initialisées de votre plateforme'),
    ('dans la base de démonstration', 'dans les données initialisées'),
    ('base de démonstration', 'données initialisées'),
]


def X(en, fr):
    s = _X(en, fr)
    for a, b in FIXES:
        s = s.replace(a, b)
    return s


G.X = X
G.URL = "l'adresse communiquée par votre administrateur (par exemple https://dynamicms.client.local)"

# The about table: no Configuration row (packs and add-ons are commercial), sign-in without a password.
_table = G.table


def table_(doc, headers, rows, *a, **k):
    out = []
    for r in rows:
        if r and r[0] == 'Configuration':
            continue
        if r and r[0] == 'Connexion':
            r = ['Connexion', "Adresse communiquée par votre administrateur — e-mail de votre compte et " + INITIAL]
        out.append(r)
    return _table(doc, headers, out, *a, **k)


G.table = table_

# ---------------------------------------------------------------- how each step is done
METHOD = {
    'manual': ('Manuel', MUTED),
    'template': ('Modèle + Manuel', AZURE),
    'ai': ('IA + Manuel', TEAL),
    'auto': ('Auto', GREEN),
}


def method(s):
    if s.get('type') == 'AI-Assisted Task' or s.get('kind') == 'ai':
        return 'ai'
    if s.get('type') == 'Service Task' or s.get('kind') == 'service':
        return 'auto'
    if s.get('kind') == 'document':
        return 'template'
    return 'manual'


_CUR = {'s': None}
_badge = G.badge


def badge(p, k, size=7.5):
    _badge(p, k, size)
    s = _CUR['s']
    if s is not None:
        label, color = METHOD[method(s)]
        G._r(p, f'[{label}]  ', 7, True, color=color)
        _CUR['s'] = None


G.badge = badge
_step_block = G.step_block


def step_block(doc, s, task_label=None):
    _CUR['s'] = s
    return _step_block(doc, s, task_label)


G.step_block = step_block

# Smaller screenshots in the run keep the guide within 120 pages.
_shot = G.shot
G.shot = lambda doc, name, cap, width=16.5: _shot(doc, name, cap, min(width, 12.5))


# ---------------------------------------------------------------- new chapter
def modes_chapter(doc, data):
    steps = [s for ph in data['phases'] for m in ph['mps'] for t in m['tasks'] for s in t['steps']]
    n = collections.Counter(method(s) for s in steps)
    doc.add_heading('Manuel, modèle, IA : les façons de travailler', level=1)
    para(doc, "DynamicMS combine trois façons de travailler, à chaque niveau : le projet, le document et l'étape. "
              "Un modèle apporte une structure éprouvée ; la saisie manuelle l'adapte à votre organisme ; l'IA propose, une personne décide. "
              "Les trois se combinent librement : un projet créé avec l'IA s'appuie sur un modèle du catalogue, puis ses étapes sont réalisées à la main, à partir de modèles ou avec l'aide de l'IA.", size=10)
    table(doc, ['Niveau', 'Manuel', 'À partir d\'un modèle', 'Avec l\'IA'], [
        ['Projet', 'Organisation › Nouveau projet › Manuel : système, parcours et jalons choisis phase par phase.', 'Nouveau projet › Depuis le catalogue : phases, jalons, listes de contrôle et rôles copiés d\'un modèle publié.', 'Nouveau projet › Avec l\'IA : une courte description ; chaque élément proposé est accepté ou rejeté.'],
        ['Document', 'Documents › Nouveau document › Document vierge.', 'Documents › Nouveau document › À partir d\'un modèle, rempli avec les données du projet.', 'Les étapes « IA + Manuel » proposent un brouillon ; la personne le revoit avant publication.'],
        ['Étape', 'Saisie des champs et des tableaux, ou copier-coller depuis ce guide.', 'Étape de type Document : le document est généré depuis son modèle, puis complété.', 'Étape assistée par IA : Assistance IA › Suggérer, puis accepter, modifier ou rejeter.'],
    ], [2.2, 4.9, 5.0, 4.9], size=8.5, bold_first=True)

    doc.add_heading('Créer un projet', level=2)
    para(doc, "Ouvrez Organisation › Nouveau projet. Trois cartes proposent les modes de création ; la carte « Avec l'IA » n'apparaît que si un cas d'usage IA actif sert la création de projet.", size=10)
    image(doc, os.path.join(RT, 'np-modes.png'), 11, 'Figure — Nouveau projet : depuis le catalogue, manuel ou avec l\'IA.')
    doc.add_heading('Depuis le catalogue (modèle)', level=3)
    numbered(doc, [
        'Sélectionnez Depuis le catalogue.',
        'Nom : saisissez le nom du projet. Système de management : SMQ — ISO 9001 ou QHSE. Date de début : la date de lancement.',
        'Modèle : choisissez un modèle publié, par exemple TPL-UNI-FULL-QMS. « Voir et personnaliser le modèle » ouvre ses processus, étapes, règles, contrôles, risques, alertes, KPI et rapports ; ★ marque les modèles de votre organisme.',
        'Score de complexité : réglez chaque critère de 1 à 5 ; le mode recommandé (Cycle complet ou PME) s\'affiche. Sélectionnez Créer le projet.',
    ])
    image(doc, os.path.join(RT, 'np-catalog.png'), 11, 'Figure — Création depuis le catalogue : le modèle TPL-UNI-FULL-QMS est choisi.')
    doc.add_heading('Manuel', level=3)
    numbered(doc, [
        'Sélectionnez Manuel, puis saisissez le nom, le système de management et la date de début.',
        'Phases avec jalon : cochez les processus de bout en bout qui se terminent par un jalon de la bibliothèque (liste de contrôle puis décision Go, En attente ou No-Go).',
        'Réglez le score de complexité ; pour une PME, choisissez le parcours (Léger, Standard, Avancé) ou gardez celui qui est recommandé ; un autre choix demande une justification. Sélectionnez Créer le projet.',
    ])
    image(doc, os.path.join(RT, 'np-manual.png'), 11, 'Figure — Création manuelle : les phases avec jalon sont choisies une à une.')
    doc.add_heading('Avec l\'IA, puis modèle et saisie manuelle (combinaison)', level=3)
    numbered(doc, [
        'Sélectionnez Avec l\'IA. Description courte : décrivez le projet en une ou deux phrases (périmètre, normes, échéance, équipe).',
        'Sélectionnez Rédiger le projet. La proposition porte la mention « Généré par l\'IA — à revoir par une personne », le cas d\'usage, le moteur utilisé, la raison et la confiance.',
        'Cochez les éléments à garder (système de management, parcours, modèle le plus proche, niveaux de complexité) et décochez les autres, puis sélectionnez Appliquer les éléments acceptés : chaque acceptation ou rejet est journalisé.',
        'Complétez ou corrigez à la main les champs du formulaire, puis sélectionnez Créer le projet. Le projet suit le modèle retenu : c\'est la combinaison IA + modèle + manuel.',
    ])
    image(doc, os.path.join(RT, 'np-ai.png'), 11, 'Figure — Création avec l\'IA : chaque élément proposé est accepté ou rejeté avant d\'être appliqué.')
    callout(doc, "Sans modèle de langage configuré, le moteur intégré (règles et recherche) répond, sans aucune sortie de données. Un modèle externe n'est utilisé que si l'administrateur l'active (Administration › Modèles d'IA).", 'Bon à savoir — ')

    doc.add_heading('Créer un document', level=2)
    bullets(doc, [
        ('À partir d\'un modèle. ', 'Documents › Nouveau document › À partir d\'un modèle, rempli avec les données du projet : choisissez le modèle et, si besoin, un titre ; le brouillon reprend l\'organisme, le projet, les rôles, les KPI et les registres.'),
        ('Document vierge. ', 'Saisissez le titre, le type, la fréquence de revue et le contenu.'),
        ('Dans les deux cas. ', 'Le document suit son cycle (brouillon, revue, publié) ; l\'auteur n\'approuve jamais sa propre version ; il se télécharge en DOCX, PDF, XLSX ou PPTX.'),
    ], size=10)
    image(doc, os.path.join(RT, 'doc-new.png'), 10.5, 'Figure — Nouveau document : à partir d\'un modèle ou vierge.')

    doc.add_heading('Comment chaque étape est réalisée', level=2)
    para(doc, "Dans le déroulement complet, chaque étape porte, après son badge PDCA, un repère de méthode :", size=10)
    table(doc, ['Repère', 'Signification', 'Étapes du déroulement'], [
        ['[Manuel]', 'La personne saisit les champs et les tableaux (ou les colle depuis ce guide), puis termine l\'étape.', str(n['manual'])],
        ['[Modèle + Manuel]', 'Le document de l\'étape est généré depuis son modèle avec les données du projet, puis complété et soumis à revue.', str(n['template'])],
        ['[IA + Manuel]', 'Assistance IA › Suggérer : l\'IA propose, la personne accepte, modifie ou rejette chaque élément, puis termine l\'étape.', str(n['ai'])],
        ['[Auto]', 'Tâche de service : la plateforme l\'exécute (calcul, alerte, notification) ; la personne en vérifie le résultat.', str(n['auto'])],
    ], [3.4, 11.0, 2.6], size=9, bold_first=True)
    para(doc, f"Le projet du déroulement lui-même est créé à partir du modèle {data['template']['code']} : toutes ses étapes viennent donc d'un modèle, puis sont réalisées selon le repère ci-dessus. "
              "Dans les étapes à tableau, « Proposer avec l'IA » peut aussi préremplir des lignes (Origine de la saisie = AI) lorsqu'un cas d'usage actif sert l'étape.", size=10)


# ---------------------------------------------------------------- build
def build():
    G.LANG = 'fr'
    brand.set_lang('fr')
    import json
    data = json.load(open(os.path.join(G.BUILD, f'{G.CODE}.fr.json'), encoding='utf8'))
    reports = {'status': "Rapport d'avancement du projet", 'review': "Éléments d'entrée de la revue de direction", 'kpis': 'Rapport des KPI', 'ncs': 'Registre des non-conformités', 'risks': 'Registre des risques', 'audits': "Programme d'audit", 'documents': 'Liste maîtresse des documents', 'racsi': 'Matrice RACSI', 'steps': "Journal d'exécution"}
    doc = new_document('Guide utilisateur — Runtime client', 'DynamicMS — Guide utilisateur (runtime client)')
    sec = doc.sections[0]
    for side in ('left_margin', 'right_margin'):
        setattr(sec, side, Cm(1.2))
    sec.top_margin = Cm(1.4); sec.bottom_margin = Cm(1.2)
    sec.header_distance = Cm(0.5); sec.footer_distance = Cm(0.5)
    for para_ in sec.header.paragraphs:
        for run_ in para_.runs:
            for ext in run_._r.iter():
                if ext.tag.endswith('}extent'):
                    cx, cy = int(ext.get('cx')), int(ext.get('cy')); k = 0.6
                    ext.set('cx', str(int(cx * k))); ext.set('cy', str(int(cy * k)))
    for name, size, before, after in (('Heading 2', 14, 10, 4), ('Heading 3', 10.5, 6, 1)):
        st = doc.styles[name]; st.font.size = Pt(size)
        st.paragraph_format.space_before = Pt(before); st.paragraph_format.space_after = Pt(after)
    steps = sum(len(t['steps']) for ph in data['phases'] for m in ph['mps'] for t in m['tasks'])
    mps = sum(len(ph['mps']) for ph in data['phases'])
    cover(doc, 'Guide utilisateur', 'Runtime client — déroulement réel complet',
          f"12 processus de bout en bout, {mps} macro-processus, {steps} étapes · manuel, à partir de modèles, avec l'IA ou en combinaison",
          'AI Value · DynamicMS 2026.10 · octobre 2026')
    toc(doc)
    G._toc_levels(doc, '1-2')
    G.about(doc, data)
    page_break(doc)
    G.getting_started(doc, data)
    modes_chapter(doc, data)
    G.pdca_chapter(doc, data)
    page_break(doc)
    G.run_chapter(doc, data)
    G.review_chapter(doc, data, reports)
    page_break(doc)
    G.ai_chapter(doc, data)
    G.records_chapter(doc, data)
    G.faq(doc)
    path = os.path.join(G.OUT, NAME + '.docx')
    doc.save(path)
    print('saved', path)
    return path


if __name__ == '__main__':
    build()
