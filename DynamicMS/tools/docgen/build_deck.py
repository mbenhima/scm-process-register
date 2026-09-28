"""Builds the DynamicMS presentation (PowerPoint, 16:9) in English or French with
screenshots of every sector's full run and of the main screens.
Usage: python3 build_deck.py en|fr"""
import json
import os
import sqlite3
import sys

from lxml import etree
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from pptx.util import Inches, Pt, Emu

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB = os.path.join(ROOT, 'server', 'data', 'dynamicms.db')
BUILD = os.path.join(ROOT, 'deliverables', 'build')
ICONS = os.path.join(BUILD, 'icons')
LOGO = os.path.join(ROOT, 'deliverables', 'assets', 'poweract-logo.png')
C = dict(orange='F8931D', deep='E07B00', tint='FDEEDA', dark='3A3A3C', ink='58595B', medium='808184', light='F2F2F3', line='E3E3E4', bg='FDFDFC', white='FFFFFF')

TXT = {
    'en': {
        'deck': 'DynamicMS — Integrated Management System', 'sub': 'Full QMS and QHSE runs for every sector, large companies and SMEs',
        'date': 'POWERACT Consulting · September 2026', 'agenda': 'Agenda', 'agenda_items': ['What the application does', 'The lifecycle of a management system', 'The main screens', 'One full run per sector', 'Installation and next steps'],
        'eyebrow_intro': 'Overview', 'what': 'One application runs the whole lifecycle of a management system',
        'what_sub': 'From context analysis to continual improvement, every step is assigned, recorded and traced.',
        'cards': [('workflow', 'Lifecycle', '12 end-to-end phases, 162 macro processes and 1,572 workflow steps, each with its own input form.'), ('shield-alert', 'Governance', 'Business rules, COSO controls, risks, RACSI and KPIs linked to the steps they govern.'), ('clipboard-check', 'Evidence', 'Nonconformities, audits, documents and registers, with versions and an audit trail.')],
        'numbers_eyebrow': 'Demonstration data', 'numbers_title': 'The seeded database holds 120 complete runs',
        'numbers': [('60', 'organizations in 2 groups and 1 independent SME'), ('120', 'full-run projects: QMS and QHSE for each'), ('84,603', 'workflow steps with their recorded values'), ('1,141', 'users across 19 roles'), ('3', 'languages: English, French, Arabic (right-to-left)'), ('30', 'sectors: 29 verticals plus universal')],
        'numbers_cap': 'Counts after running npm run seed; every value is fictional demonstration data.',
        'div1': 'The lifecycle', 'div1_sub': 'Twelve end-to-end processes run in order; gates close the phases.',
        'flow_eyebrow': 'End-to-end processes', 'flow_title': 'A run moves through twelve phases', 'flow_sub': 'Each phase groups the macro processes activated for the organization; a gate with a checklist closes it.',
        'div2': 'The main screens', 'div2_sub': 'Screens captured on the Horizon Universal Holdings QMS run.',
        'div3': 'One full run per sector', 'div3_sub': 'For each vertical: the lifecycle of the large company and the figures of its SME counterpart.',
        'sector_eyebrow': 'Sector', 'large': 'Large company', 'smecol': 'SME', 'mps': 'Macro processes', 'steps': 'Steps', 'progress': 'Progress', 'track': 'SME track', 'standards': 'Must-have standards', 'pack': 'Industry pack', 'none': 'none',
        'sector_cap': 'Lifecycle screen of the QMS run: phase cards with completed steps and gate status.',
        'close_eyebrow': 'Next steps', 'close_title': 'Install, seed and run in three commands per folder', 'close_steps': ['server: npm install · npm run seed · npm run dev', 'web: npm install · npm run dev', 'Open http://localhost:5173 and sign in with a demonstration account (password Demo@2026)'],
        'close_note': 'The user guides list, for every step of the five scenarios, the values to type.', 'section': 'Section', 'page': '',
    },
    'fr': {
        'deck': 'DynamicMS — Système de management intégré', 'sub': 'Déploiements complets SMQ et QHSE pour chaque secteur, grandes entreprises et PME',
        'date': 'POWERACT Consulting · septembre 2026', 'agenda': 'Sommaire', 'agenda_items': ["Ce que fait l'application", "Le cycle de vie d'un système de management", 'Les principaux écrans', 'Un déploiement complet par secteur', 'Installation et prochaines étapes'],
        'eyebrow_intro': 'Présentation', 'what': "Une application pour tout le cycle de vie d'un système de management",
        'what_sub': "De l'analyse du contexte à l'amélioration continue, chaque étape est attribuée, enregistrée et tracée.",
        'cards': [('workflow', 'Cycle de vie', '12 phases de bout en bout, 162 macro-processus et 1 572 étapes de workflow, chacune avec son formulaire.'), ('shield-alert', 'Gouvernance', 'Règles métier, contrôles COSO, risques, RACSI et KPI liés aux étapes qu\'ils encadrent.'), ('clipboard-check', 'Preuves', 'Non-conformités, audits, documents et registres, avec versions et piste d\'audit.')],
        'numbers_eyebrow': 'Données de démonstration', 'numbers_title': 'La base initialisée contient 120 déploiements complets',
        'numbers': [('60', 'organisations dans 2 groupes et 1 PME indépendante'), ('120', 'projets complets : SMQ et QHSE pour chacune'), ('84 603', 'étapes de workflow avec leurs valeurs saisies'), ('1 141', 'utilisateurs répartis sur 19 rôles'), ('3', 'langues : anglais, français, arabe (de droite à gauche)'), ('30', 'secteurs : 29 secteurs plus universel')],
        'numbers_cap': 'Comptages après npm run seed ; toutes les valeurs sont des données de démonstration fictives.',
        'div1': 'Le cycle de vie', 'div1_sub': 'Douze processus de bout en bout exécutés dans l\'ordre ; des jalons clôturent les phases.',
        'flow_eyebrow': 'Processus de bout en bout', 'flow_title': 'Un déploiement traverse douze phases', 'flow_sub': "Chaque phase regroupe les macro-processus activés pour l'organisation ; un jalon avec sa liste de contrôle la clôture.",
        'div2': 'Les principaux écrans', 'div2_sub': 'Écrans capturés sur le déploiement SMQ de Horizon Holding Universelle.',
        'div3': 'Un déploiement complet par secteur', 'div3_sub': 'Pour chaque secteur : le cycle de vie de la grande entreprise et les chiffres de la PME correspondante.',
        'sector_eyebrow': 'Secteur', 'large': 'Grande entreprise', 'smecol': 'PME', 'mps': 'Macro-processus', 'steps': 'Étapes', 'progress': 'Avancement', 'track': 'Parcours PME', 'standards': 'Normes incontournables', 'pack': 'Pack sectoriel', 'none': 'aucun',
        'sector_cap': 'Écran Cycle de vie du déploiement SMQ : cartes de phase avec étapes terminées et statut des jalons.',
        'close_eyebrow': 'Prochaines étapes', 'close_title': 'Installer, initialiser et lancer en trois commandes par dossier', 'close_steps': ['server : npm install · npm run seed · npm run dev', 'web : npm install · npm run dev', 'Ouvrez http://localhost:5173 et connectez-vous avec un compte de démonstration (mot de passe Demo@2026)'],
        'close_note': 'Les guides utilisateur indiquent, pour chaque étape des cinq scénarios, les valeurs à saisir.', 'section': 'Section', 'page': '',
    },
}
FEATURES = {
    'en': [
        ('f-home', 'Home', 'Where the run stands, at a glance', ['Progress by end-to-end phase', 'KPI trend against its target', 'Next steps due for my roles']),
        ('f-lifecycle', 'Lifecycle', 'Twelve phases, run in order', ['A card per phase with completed steps', 'Gate status and decision on each card', 'Macro processes of the selected phase']),
        ('f-gate', 'Gates', 'A gate closes each phase', ['Exit criteria and checklist items', 'Go only when every step is complete', 'Hold and No-Go require a comment']),
        ('f-step', 'Workflow step', 'Every step has its own input form', ['17 form kinds cover the 1,572 steps', 'Save a draft or complete the step', 'Rules and controls shown in context']),
        ('f-step-done', 'Traceability', 'Completed steps keep their evidence', ['Who completed the step and when', 'Reopen needs a written justification', 'A passed gate locks the phase']),
        ('f-sipoc', 'Macro process', 'SIPOC of each macro process', ['Suppliers, inputs, process, outputs, customers', 'Tasks and steps in execution order', 'KPIs, rules and AI use cases of the process']),
        ('f-bpmn', 'BPMN 2.0', 'Diagrams generated from the process design', ['One lane per role, one task per step', 'Palette in its own panel beside the canvas', 'Export and import .bpmn files']),
        ('f-risks', 'Risks', 'Risks, hazards and aspects on one heatmap', ['Likelihood × impact on a 1–5 scale', 'QHSE runs add OH&S hazards and environmental aspects', 'Treatment and residual score per entry']),
        ('f-kpis', 'KPIs', 'KPIs measured every month against target', ['Catalog, sector and core KPIs', 'A value off target raises an alert', 'Custom KPIs with measurement rules']),
        ('f-racsi', 'RACSI', 'Exactly one Accountable per activity', ['Activities of each phase and macro process', 'Responsible, Consulted, Support, Informed', 'The rule is enforced by the database']),
        ('f-ncs', 'Nonconformities', 'From detection to lessons learned', ['Five stages, one at a time', 'Owner and evaluator are different people', 'Closure requires the lessons learned']),
        ('f-documents', 'Documents', 'Documented information under version control', ['Draft, review, published, superseded', 'The author never approves their version', 'Review dates raise alerts']),
        ('f-planning', 'Planning', 'Work breakdown structure and Gantt chart', ['One node per phase with its actions', 'Dependencies drawn between phases', 'Overdue items in red']),
        ('f-alerts', 'Alerts', 'Raised once, sent along the escalation path', ['Deduplicated per record and period', 'In-app and e-mail dispatch log', 'Alert types enabled per organization']),
        ('f-ai', 'AI use cases', 'AI suggestions with a human checkpoint', ['Assistive and augmented tiers', 'Accepted, edited or rejected, and logged', 'No external AI service is called']),
        ('f-portfolio', 'Portfolio', 'Every project of the group, stage by stage', ['One row per project, one column per phase', 'Other organizations are read-only', 'Export to CSV']),
        ('f-benchmark', 'Benchmarking', 'Organizations ranked on shared metrics', ['Same metric catalog for all views', 'Only organizations that share data', 'Hidden below three participants']),
        ('f-newproject', 'New project', 'Catalog, manual or with AI', ['Templates by vertical, mode and track', 'Complexity score recommends the track', 'Each AI item accepted or rejected']),
        ('f-reports', 'Reports', 'Reports in three languages and four formats', ['PDF, Excel, Word and CSV', 'Management review input per ISO 9001 9.3.2', 'Arabic reports laid out right to left']),
    ],
    'fr': [
        ('f-home', 'Accueil', "L'état du déploiement en un coup d'œil", ['Avancement par phase de bout en bout', 'Tendance du KPI au regard de sa cible', 'Prochaines étapes pour mes rôles']),
        ('f-lifecycle', 'Cycle de vie', "Douze phases exécutées dans l'ordre", ['Une carte par phase avec les étapes terminées', 'Statut et décision du jalon sur chaque carte', 'Macro-processus de la phase choisie']),
        ('f-gate', 'Jalons', 'Un jalon clôture chaque phase', ['Critères de sortie et liste de contrôle', 'Go seulement quand toutes les étapes sont terminées', 'En attente et No-Go exigent un commentaire']),
        ('f-step', 'Étape de workflow', 'Chaque étape a son formulaire de saisie', ['17 types de formulaires pour 1 572 étapes', 'Enregistrer un brouillon ou terminer', 'Règles et contrôles affichés en contexte']),
        ('f-step-done', 'Traçabilité', 'Les étapes terminées gardent leurs preuves', ["Qui a terminé l'étape et quand", 'La réouverture exige une justification écrite', 'Un jalon franchi verrouille la phase']),
        ('f-sipoc', 'Macro-processus', 'Le SIPOC de chaque macro-processus', ['Fournisseurs, entrées, processus, sorties, clients', "Tâches et étapes dans l'ordre d'exécution", "KPI, règles et cas d'usage IA du processus"]),
        ('f-bpmn', 'BPMN 2.0', 'Diagrammes générés à partir de la conception', ['Un couloir par rôle, une tâche par étape', 'Palette dans son propre panneau', 'Export et import de fichiers .bpmn']),
        ('f-risks', 'Risques', 'Risques, dangers et aspects sur une carte thermique', ['Probabilité × impact sur une échelle de 1 à 5', 'Le QHSE ajoute dangers SST et aspects environnementaux', 'Traitement et score résiduel par entrée']),
        ('f-kpis', 'KPI', 'KPI mesurés chaque mois au regard de la cible', ['KPI du catalogue, du secteur et de base', 'Une valeur hors cible déclenche une alerte', 'KPI personnalisés avec règles de mesure']),
        ('f-racsi', 'RACSI', 'Un seul approbateur par activité', ['Activités de chaque phase et macro-processus', 'Réalise, consulté, soutien, informé', 'Règle imposée par la base de données']),
        ('f-ncs', 'Non-conformités', "De la détection au retour d'expérience", ['Cinq étapes, une à la fois', 'Propriétaire et évaluateur distincts', "La clôture exige le retour d'expérience"]),
        ('f-documents', 'Documents', 'Informations documentées sous contrôle de version', ['Brouillon, revue, publié, remplacé', "L'auteur n'approuve jamais sa version", 'Les dates de revue déclenchent des alertes']),
        ('f-planning', 'Planification', 'Organigramme des tâches et diagramme de Gantt', ['Un nœud par phase avec ses actions', 'Dépendances tracées entre phases', 'Éléments en retard en rouge']),
        ('f-alerts', 'Alertes', "Déclenchées une fois, envoyées sur le chemin d'escalade", ['Dédoublonnées par enregistrement et période', "Journal d'envoi application et e-mail", "Types d'alertes activés par organisation"]),
        ('f-ai', "Cas d'usage IA", "Suggestions de l'IA avec point de contrôle humain", ['Niveaux assistance et augmenté', 'Acceptée, modifiée ou rejetée, et journalisée', "Aucun service d'IA externe n'est appelé"]),
        ('f-portfolio', 'Portefeuille', 'Tous les projets du groupe, étape par étape', ['Une ligne par projet, une colonne par phase', 'Autres organisations en lecture seule', 'Export CSV']),
        ('f-benchmark', 'Benchmarking', 'Organisations classées sur des indicateurs partagés', ['Même catalogue pour toutes les vues', 'Seules les organisations qui partagent', 'Masqué sous trois participants']),
        ('f-newproject', 'Nouveau projet', 'Catalogue, manuel ou avec l\'IA', ['Modèles par secteur, mode et parcours', 'Le score de complexité recommande le parcours', "Chaque élément de l'IA accepté ou rejeté"]),
        ('f-reports', 'Rapports', 'Rapports en trois langues et quatre formats', ['PDF, Excel, Word et CSV', 'Éléments de revue de direction (ISO 9001 § 9.3.2)', 'Rapports arabes de droite à gauche']),
    ],
}


def rgb(h):
    return RGBColor.from_string(h)


class Deck:
    def __init__(self, lang):
        self.lang = lang
        self.t = TXT[lang]
        self.prs = Presentation()
        self.prs.slide_width, self.prs.slide_height = Inches(13.333), Inches(7.5)
        self.n = 0
        self.section = ''

    def slide(self, dark=False):
        s = self.prs.slides.add_slide(self.prs.slide_layouts[6])
        s.background.fill.solid()
        s.background.fill.fore_color.rgb = rgb(C['dark'] if dark else C['bg'])
        self.n += 1
        return s

    def text(self, s, x, y, w, h, text, size=14, bold=False, color='ink', font='Calibri', align=PP_ALIGN.LEFT, italic=False, spacing=None, anchor=MSO_ANCHOR.TOP):
        tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.vertical_anchor = anchor
        tf.margin_left = tf.margin_right = Inches(0.02)
        tf.margin_top = tf.margin_bottom = Inches(0.02)
        lines = text if isinstance(text, list) else [text]
        for i, line in enumerate(lines):
            p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            p.alignment = align
            r = p.add_run()
            r.text = line
            r.font.size = Pt(size); r.font.bold = bold; r.font.italic = italic; r.font.name = font
            r.font.color.rgb = rgb(C.get(color, color))
            if spacing:
                r._r.get_or_add_rPr().set('spc', str(spacing))
        return tb

    def eyebrow(self, s, text, y=0.55, color='deep'):
        self.text(s, 0.7, y, 10, 0.35, text.upper(), 12, True, color, spacing=200)

    def title(self, s, text, y=0.9, size=30, color='dark', w=11.9):
        self.text(s, 0.7, y, w, 0.9, text, size, True, color, font='Cambria')

    def subtitle(self, s, text, y=1.72):
        self.text(s, 0.7, y, 11.5, 0.5, text, 15, False, 'ink')

    def footer(self, s, dark=False):
        col = 'medium' if not dark else 'line'
        if os.path.exists(LOGO) and not dark:
            s.shapes.add_picture(LOGO, Inches(0.7), Inches(7.02), height=Inches(0.28))
            self.text(s, 2.4, 7.05, 6, 0.3, self.section, 10, False, col)
        else:
            self.text(s, 0.7, 7.05, 8, 0.3, f"POWERACT Consulting{('  ·  ' + self.section) if self.section else ''}", 10, False, col)
        self.text(s, 11.6, 7.05, 1.0, 0.3, str(self.n), 10, False, col, align=PP_ALIGN.RIGHT)

    def card(self, s, x, y, w, h, fill='white', shadow=True):
        shp = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
        shp.adjustments[0] = 0.05
        shp.fill.solid(); shp.fill.fore_color.rgb = rgb(C[fill])
        shp.line.fill.background()
        sp = shp._element.spPr
        eff = sp.find(qn('a:effectLst'))
        if eff is not None:
            sp.remove(eff)
        if shadow:
            eff = etree.SubElement(sp, qn('a:effectLst'))
            sh = etree.SubElement(eff, qn('a:outerShdw'), blurRad='101600', dist='19050', dir='5400000', algn='t', rotWithShape='0')
            clr = etree.SubElement(sh, qn('a:srgbClr'), val=C['dark'])
            etree.SubElement(clr, qn('a:alpha'), val='14000')
        shp.text_frame.text = ''
        return shp

    def picture(self, s, path, x, y, w, h):
        if not os.path.exists(path):
            return
        self.card(s, x - 0.08, y - 0.08, w + 0.16, h + 0.16)
        from PIL import Image
        im = Image.open(path)
        iw, ih = im.size
        ratio = min(w / iw, h / ih)
        pw, ph = iw * ratio, ih * ratio
        s.shapes.add_picture(path, Inches(x + (w - pw) / 2), Inches(y + (h - ph) / 2), Inches(pw), Inches(ph))

    def badge(self, s, name, x, y, d=0.62, variant='orange'):
        p = os.path.join(ICONS, f'{name}-{variant}.png')
        if os.path.exists(p):
            s.shapes.add_picture(p, Inches(x), Inches(y), Inches(d), Inches(d))

    def caption(self, s, text, y=6.62, x=0.7, w=11.9):
        self.text(s, x, y, w, 0.35, text, 11, False, 'ink', italic=True)

    # ------------------------------------------------------------------ slides
    def cover(self):
        s = self.slide()
        for (x, y, d, a) in ((10.6, -1.2, 4.2, 'tint'), (11.9, 4.9, 2.4, 'tint')):
            c = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x), Inches(y), Inches(d), Inches(d))
            c.fill.solid(); c.fill.fore_color.rgb = rgb(C[a]); c.line.fill.background()
        if os.path.exists(LOGO):
            s.shapes.add_picture(LOGO, Inches(0.7), Inches(0.6), height=Inches(0.7))
        else:
            self.text(s, 0.7, 0.55, 5, 0.5, 'POWERACT', 26, True, 'dark', font='Cambria')
            self.text(s, 0.72, 1.05, 5, 0.3, 'C O N S U L T I N G', 11, True, 'deep')
        self.eyebrow(s, 'DynamicMS 1.0', y=2.6)
        self.text(s, 0.7, 3.0, 10, 1.6, self.t['deck'], 40, True, 'dark', font='Cambria')
        self.text(s, 0.7, 4.65, 9.5, 0.8, self.t['sub'], 18, False, 'ink')
        self.text(s, 0.7, 6.6, 8, 0.4, self.t['date'], 12, False, 'medium')

    def agenda(self):
        s = self.slide(); self.section = self.t['agenda']
        self.eyebrow(s, 'DynamicMS'); self.title(s, self.t['agenda'])
        for i, item in enumerate(self.t['agenda_items']):
            y = 2.1 + i * 0.85
            self.text(s, 0.9, y, 0.9, 0.7, f'{i + 1:02d}', 30, True, 'deep', font='Cambria')
            self.text(s, 2.0, y + 0.12, 9, 0.6, item, 20, False, 'dark')
        self.footer(s)

    def divider(self, title, sub):
        s = self.slide(dark=True); self.section = title
        c = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(9.8), Inches(1.4), Inches(4.8), Inches(4.8))
        c.fill.background(); c.line.color.rgb = rgb(C['orange']); c.line.width = Pt(6)
        self.text(s, 0.9, 2.6, 8.5, 1.2, title, 40, True, 'white', font='Cambria')
        self.text(s, 0.9, 3.9, 8, 1.0, sub, 18, False, 'line')
        self.footer(s, dark=True)

    def intro(self):
        s = self.slide(); self.section = self.t['eyebrow_intro']
        self.eyebrow(s, self.t['eyebrow_intro']); self.title(s, self.t['what']); self.subtitle(s, self.t['what_sub'])
        for i, (icon, head, body) in enumerate(self.t['cards']):
            x = 0.7 + i * 4.05
            self.card(s, x, 2.7, 3.8, 3.4)
            self.badge(s, icon, x + 0.35, 3.0, variant='orange' if i == 0 else 'grey')
            self.text(s, x + 0.35, 3.85, 3.2, 0.5, head, 20, True, 'dark', font='Cambria')
            self.text(s, x + 0.35, 4.45, 3.2, 1.6, body, 14, False, 'ink')
        self.footer(s)

    def numbers(self):
        s = self.slide(); self.section = self.t['numbers_eyebrow']
        self.eyebrow(s, self.t['numbers_eyebrow']); self.title(s, self.t['numbers_title'])
        for i, (v, lab) in enumerate(self.t['numbers']):
            col, row = i % 3, i // 3
            x, y = 0.7 + col * 4.05, 2.0 + row * 2.1
            self.card(s, x, y, 3.8, 1.8)
            self.text(s, x + 0.3, y + 0.2, 3.3, 0.8, v, 36, True, 'deep', font='Cambria')
            self.text(s, x + 0.3, y + 1.05, 3.3, 0.7, lab, 13, False, 'ink')
        self.caption(s, self.t['numbers_cap'], y=6.35)
        self.footer(s)

    def flow(self, e2e):
        s = self.slide(); self.section = self.t['div1']
        self.eyebrow(s, self.t['flow_eyebrow']); self.title(s, self.t['flow_title']); self.subtitle(s, self.t['flow_sub'])
        for i, (eid, name) in enumerate(e2e):
            col, row = i % 6, i // 6
            x, y = 0.7 + col * 2.03, 2.7 + row * 1.85
            self.card(s, x, y, 1.85, 1.55, fill='tint' if i in (0, 8, 9) else 'white')
            self.text(s, x + 0.15, y + 0.12, 1.6, 0.3, eid, 11, True, 'deep', spacing=100)
            self.text(s, x + 0.15, y + 0.45, 1.6, 1.0, name, 13, True, 'dark')
        self.caption(s, {'en': 'Tinted cards: phases with a gate in every SME track (E2E-01, E2E-09, E2E-10).', 'fr': 'Cartes teintées : phases avec jalon dans tous les parcours PME (E2E-01, E2E-09, E2E-10).'}[self.lang], y=6.55)
        self.footer(s)

    def feature(self, shot, eyebrow, title, bullets):
        s = self.slide(); self.section = self.t['div2']
        self.eyebrow(s, eyebrow); self.title(s, title, size=28)
        self.picture(s, os.path.join(BUILD, f'deck-{self.lang}', f'{shot}.png'), 0.78, 1.95, 8.35, 4.62)
        for i, b in enumerate(bullets):
            y = 2.05 + i * 1.45
            self.card(s, 9.55, y, 3.1, 1.25, fill='white')
            self.text(s, 9.75, y + 0.18, 2.75, 0.95, b, 14, False, 'dark', anchor=MSO_ANCHOR.MIDDLE)
        self.footer(s)

    def sector(self, d):
        s = self.slide(); self.section = self.t['div3']
        self.eyebrow(s, f"{self.t['sector_eyebrow']} · {d['id']}")
        self.title(s, d['name'], size=28)
        self.subtitle(s, d['org'])
        self.picture(s, os.path.join(BUILD, f'deck-{self.lang}', f"sector-{d['id']}.png"), 0.78, 2.35, 7.9, 4.2)
        x = 9.1
        self.card(s, x, 2.25, 3.55, 3.05)
        hdr = [self.t['large'], self.t['smecol']]
        self.text(s, x + 0.2, 2.35, 1.4, 0.35, '', 11)
        self.text(s, x + 1.78, 2.4, 0.8, 0.35, hdr[0], 10, True, 'dark')
        self.text(s, x + 2.58, 2.4, 0.95, 0.35, hdr[1], 10, True, 'dark')
        rows = [(self.t['mps'] + ' QMS', d['L']['QMS']['mps'], d['S']['QMS']['mps']), (self.t['mps'] + ' QHSE', d['L']['QHSE']['mps'], d['S']['QHSE']['mps']),
                (self.t['steps'] + ' QMS', d['L']['QMS']['steps'], d['S']['QMS']['steps']), (self.t['steps'] + ' QHSE', d['L']['QHSE']['steps'], d['S']['QHSE']['steps']),
                (self.t['progress'] + ' QMS', f"{d['L']['QMS']['progress']}%", f"{d['S']['QMS']['progress']}%"), (self.t['track'], '—', d['S']['QMS']['track'] or '—')]
        for i, (lab, a, b) in enumerate(rows):
            y = 2.8 + i * 0.4
            self.text(s, x + 0.2, y, 1.55, 0.35, lab, 10, False, 'ink')
            self.text(s, x + 1.78, y, 0.8, 0.35, str(a), 12, True, 'dark', font='Cambria')
            self.text(s, x + 2.58, y, 0.95, 0.35, str(b), 12, True, 'dark', font='Cambria')
        self.card(s, x, 5.45, 3.55, 1.1, fill='tint', shadow=False)
        self.text(s, x + 0.2, 5.52, 3.2, 0.3, self.t['standards'], 10, True, 'dark')
        self.text(s, x + 0.2, 5.8, 3.2, 0.75, ', '.join(d['standards'][:5]) + (f"  ·  {self.t['pack']}: {d['pack'] or self.t['none']}"), 10, False, 'dark')
        self.caption(s, self.t['sector_cap'], y=6.6, w=8)
        self.footer(s)

    def closing(self):
        s = self.slide(); self.section = self.t['close_eyebrow']
        self.eyebrow(s, self.t['close_eyebrow']); self.title(s, self.t['close_title'])
        for i, line in enumerate(self.t['close_steps']):
            y = 2.3 + i * 1.1
            self.card(s, 0.7, y, 11.9, 0.9)
            self.badge(s, ['server', 'globe', 'list-checks'][i], 0.95, y + 0.14, 0.62, 'orange' if i == 0 else 'grey')
            self.text(s, 1.85, y + 0.2, 10.5, 0.55, line, 16, False, 'dark', anchor=MSO_ANCHOR.MIDDLE)
        self.text(s, 0.7, 5.8, 11.9, 0.5, self.t['close_note'], 15, False, 'ink')
        self.footer(s)


def load_data(lang):
    con = sqlite3.connect(DB)
    cur = con.cursor()
    bundles = {k: json.loads(v) for k, v in cur.execute("SELECT id, data FROM catalog_items WHERE kind='bundle' AND id IN ('segments','e2e')")}
    loc = lambda v: v.get(lang) or v.get('en') if isinstance(v, dict) else v
    e2e = [(e['id'], loc(e['name'])) for e in bundles['e2e']]
    segs = {s['id']: s for s in bundles['segments']}

    def proj(code):
        row = cur.execute('SELECT id, progress_cache, track FROM projects WHERE code=?', (code,)).fetchone()
        if not row:
            return {'mps': 0, 'steps': 0, 'progress': 0, 'track': None}
        pid = row[0]
        return {'mps': cur.execute('SELECT COUNT(*) FROM project_mps WHERE project_id=?', (pid,)).fetchone()[0], 'steps': cur.execute('SELECT COUNT(*) FROM step_exec WHERE project_id=?', (pid,)).fetchone()[0],
                'progress': row[1], 'track': {'TRK-LIGHT': {'en': 'Light', 'fr': 'Léger'}, 'TRK-STANDARD': {'en': 'Standard', 'fr': 'Standard'}, 'TRK-ADVANCED': {'en': 'Advanced', 'fr': 'Avancé'}}.get(row[2], {}).get(lang)}
    sectors = []
    for o in cur.execute("SELECT short_code, name, sector FROM organizations WHERE size='Large' ORDER BY short_code='HZ-UNI', short_code").fetchall():
        code, name, sector = o
        sme = 'AT-UNI' if sector == 'UNI' else f'NV-{sector}'
        smename = json.loads(cur.execute('SELECT name FROM organizations WHERE short_code=?', (sme,)).fetchone()[0])
        seg = segs.get(sector)
        sectors.append({'id': sector, 'name': loc(seg['name']) if seg else {'en': 'Universal (all sectors)', 'fr': 'Universel (tous secteurs)'}[lang],
                        'org': f"{loc(json.loads(name))}  ·  {loc(smename)}", 'standards': (seg['mustStandards'] if seg else ['ISO 9001', 'ISO 14001', 'ISO 45001']), 'pack': seg.get('industryPack') if seg else None,
                        'L': {'QMS': proj(f'{code}-QMS'), 'QHSE': proj(f'{code}-QHSE')}, 'S': {'QMS': proj(f'{sme}-QMS'), 'QHSE': proj(f'{sme}-QHSE')}})
    return e2e, sectors


def main(lang):
    d = Deck(lang)
    e2e, sectors = load_data(lang)
    d.cover(); d.agenda(); d.intro(); d.numbers()
    d.divider(d.t['div1'], d.t['div1_sub']); d.flow(e2e)
    d.divider(d.t['div2'], d.t['div2_sub'])
    for shot, eb, title, bl in FEATURES[lang]:
        d.feature(shot, eb, title, bl)
    d.divider(d.t['div3'], d.t['div3_sub'])
    for s in sectors:
        d.sector(s)
    d.closing()
    out = os.path.join(ROOT, 'deliverables', f"DynamicMS_Presentation_{lang.upper()}.pptx")
    d.prs.save(out)
    print('saved', out, d.n, 'slides')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'en')
