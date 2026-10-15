"""Builds the DynamicMS user guide "One full real run" (Word with TOC, then PDF), in English and
in French, with the AI Value graphical chart. One universal scenario (Horizon Universal Holdings,
QMS ISO 9001, project HZ-UNI-QMS) runs all 12 end-to-end processes, their macro processes, tasks
and steps. Rule of the guide: every step is followed at once by what to type in it (fields and
row tables), never by a table placed after a list of steps. The PDCA dynamic is shown at three
levels: the 12 phases, each step (P, D, C or A badge) and the process review, from the data
sources to the reports in PDF, Word, Excel and PowerPoint.
Data: deliverables/build/HZ-UNI-QMS.json and .fr.json (server/tools/guide-data.mjs).
Usage: python3 build_flow_guide.py [en|fr|all]"""
import json
import os
import sys

from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt, Cm
from PIL import Image, ImageDraw, ImageFont

import brand
from brand import (new_document, cover, toc, page_break, para, bullets, numbered, table, callout, image, rgb, NAVY, AZURE, INK, MUTED, GREEN, TEAL, BG, LINE)

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BUILD = os.path.join(ROOT, 'deliverables', 'build')
OUT = os.path.join(ROOT, 'deliverables')
CODE = 'HZ-UNI-QMS'
URL = 'http://localhost:4000'
LANG = 'en'
FONT_DIR = '/usr/share/fonts/truetype/open-sans'


def X(en, fr):
    return fr if LANG == 'fr' else en


def shots():
    return os.path.join(BUILD, 'flow-en' if LANG == 'en' else 'flow-fr')


def shot(doc, name, cap, width=16.5):
    image(doc, os.path.join(shots(), f'{name}.png'), width, cap)


# ---------------------------------------------------------------- PDCA
PDCA = {
    'E2E-01': 'P', 'E2E-02': 'P', 'E2E-03': 'P', 'E2E-04': 'P',
    'E2E-05': 'D', 'E2E-06': 'D', 'E2E-07': 'D', 'E2E-08': 'D',
    'E2E-09': 'C', 'E2E-10': 'C', 'E2E-11': 'C', 'E2E-12': 'A',
}
PDCA_COLOR = {'P': NAVY, 'D': AZURE, 'C': TEAL, 'A': GREEN}


def pdca_name(k):
    return {'P': X('Plan', 'Planifier'), 'D': X('Do', 'Réaliser'), 'C': X('Check', 'Vérifier'), 'A': X('Act', 'Agir')}[k]


# Step kinds (form families) and their place in the micro PDCA of a macro process.
KIND_PDCA = {
    'periodicity': 'P', 'standards': 'P', 'needs': 'P', 'objectives': 'P', 'plan': 'P', 'assign': 'P', 'configure': 'P', 'list': 'P',
    'execute': 'D', 'document': 'D', 'communicate': 'D', 'train': 'D', 'update': 'D', 'service': 'D', 'ai': 'D',
    'monitor': 'C', 'assess': 'C', 'review': 'C',
    'decision': 'A', 'close': 'A', 'escalate': 'A',
}


def feeds():
    """What each phase delivers and which phases it feeds (the PDCA chain of the run)."""
    return {
        'E2E-01': (X('Context, interested parties, scope, policy, SMART objectives, process map.', 'Contexte, parties intéressées, périmètre, politique, objectifs SMART, cartographie des processus.'), X('E2E-02 (commitment), E2E-03 (risks), E2E-10 (objective KPIs).', 'E2E-02 (engagement), E2E-03 (risques), E2E-10 (KPI des objectifs).')),
        'E2E-02': (X('Roles, RACSI, governance bodies, leadership commitments and communication.', 'Rôles, RACSI, instances de gouvernance, engagements de la direction et communication.'), X('Every phase (owners and approvers); E2E-10 (management review).', 'Toutes les phases (pilotes et approbateurs) ; E2E-10 (revue de direction).')),
        'E2E-03': (X('Risk and opportunity register, treatments, business continuity.', 'Registre des risques et opportunités, traitements, continuité d\'activité.'), X('E2E-05 to E2E-08 (controls in operations); E2E-11 (audit universe).', 'E2E-05 à E2E-08 (maîtrises en opération) ; E2E-11 (univers d\'audit).')),
        'E2E-04': (X('Compliance obligations register, evaluation of compliance, certification plan.', 'Registre des obligations de conformité, évaluation de la conformité, plan de certification.'), X('E2E-08 (requirements), E2E-11 (assurance), E2E-10 (review inputs).', 'E2E-08 (exigences), E2E-11 (assurance), E2E-10 (éléments d\'entrée de revue).')),
        'E2E-05': (X('Competent people, documented information, measuring resources ready for operation.', 'Personnes compétentes, informations documentées, ressources de mesure prêtes pour l\'opération.'), X('E2E-08 (delivery); E2E-09 (calibration and competence nonconformities).', 'E2E-08 (livraison) ; E2E-09 (non-conformités d\'étalonnage et de compétence).')),
        'E2E-06': (X('Facilities, IT services and information security in a controlled state.', 'Installations, services informatiques et sécurité de l\'information maîtrisés.'), X('E2E-07 (data platform); E2E-08 (operations); E2E-09 (incidents).', 'E2E-07 (plateforme de données) ; E2E-08 (opérations) ; E2E-09 (incidents).')),
        'E2E-07': (X('Governed data, formulas and knowledge; KPI data pipeline; data sources configured.', 'Données, formules et connaissances gouvernées ; chaîne de données des KPI ; sources de données configurées.'), X('E2E-10 (measurement and dashboards); E2E-11 (intelligence for assurance).', 'E2E-10 (mesure et tableaux de bord) ; E2E-11 (intelligence pour l\'assurance).')),
        'E2E-08': (X('Customer requirements reviewed, products and services delivered and released.', 'Exigences client revues, produits et services livrés et libérés.'), X('E2E-09 (nonconforming outputs); E2E-10 (customer satisfaction).', 'E2E-09 (éléments de sortie non conformes) ; E2E-10 (satisfaction client).')),
        'E2E-09': (X('Nonconformities contained, root causes analysed, corrective actions, lessons learned (REX).', 'Non-conformités maîtrisées, causes racines analysées, actions correctives, retours d\'expérience (REX).'), X('E2E-10 (NC KPIs); E2E-12 (improvement); E2E-05 (knowledge).', 'E2E-10 (KPI des NC) ; E2E-12 (amélioration) ; E2E-05 (connaissances).')),
        'E2E-10': (X('KPI results, process reviews, management review decisions and actions.', 'Résultats des KPI, revues de processus, décisions et actions de la revue de direction.'), X('E2E-11 (audit focus); E2E-12 (improvement); E2E-01 (next cycle).', 'E2E-11 (orientation des audits) ; E2E-12 (amélioration) ; E2E-01 (cycle suivant).')),
        'E2E-11': (X('Audit programme, audit reports, findings and assurance opinion.', 'Programme d\'audit, rapports d\'audit, constats et opinion d\'assurance.'), X('E2E-09 (findings as nonconformities); E2E-10 (review inputs).', 'E2E-09 (constats traités comme non-conformités) ; E2E-10 (éléments d\'entrée de revue).')),
        'E2E-12': (X('Improvement portfolio, innovations, return on investment, updated objectives.', 'Portefeuille d\'amélioration, innovations, retour sur investissement, objectifs mis à jour.'), X('E2E-01 of the next cycle (context, policy and objectives are reviewed again).', 'E2E-01 du cycle suivant (contexte, politique et objectifs sont revus à nouveau).')),
    }


def pdca_figure(path, phases):
    """A PDCA wheel: four quadrants with the phases of each stage and the loop back to Plan."""
    S = 1600
    im = Image.new('RGB', (S, S), 'white')
    d = ImageDraw.Draw(im)
    fb = ImageFont.truetype(os.path.join(FONT_DIR, 'OpenSans-Bold.ttf'), 46)
    fs = ImageFont.truetype(os.path.join(FONT_DIR, 'OpenSans-Bold.ttf'), 25)
    fn = ImageFont.truetype(os.path.join(FONT_DIR, 'OpenSans-Regular.ttf') if os.path.exists(os.path.join(FONT_DIR, 'OpenSans-Regular.ttf')) else os.path.join(FONT_DIR, 'OpenSans-Light.ttf'), 22)
    c = S // 2; R = 720; r0 = 150
    quad = [('P', 180, 270), ('D', 270, 360), ('C', 0, 90), ('A', 90, 180)]
    for k, a0, a1 in quad:
        col = '#' + PDCA_COLOR[k]
        d.pieslice([c - R, c - R, c + R, c + R], a0, a1, fill=col, outline='white', width=10)
    d.ellipse([c - r0, c - r0, c + r0, c + r0], fill='white')
    t = 'PDCA'
    w = d.textlength(t, font=fb); d.text((c - w / 2, c - 52), t, font=fb, fill='#' + NAVY)
    sub = X('12 phases', '12 phases'); w = d.textlength(sub, font=fn); d.text((c - w / 2, c + 6), sub, font=fn, fill='#' + MUTED)
    pos = {'P': (-1, -1), 'D': (1, -1), 'C': (1, 1), 'A': (-1, 1)}
    fid = ImageFont.truetype(os.path.join(FONT_DIR, 'OpenSans-Bold.ttf'), 24)
    fnm = ImageFont.truetype(os.path.join(FONT_DIR, 'OpenSans-Regular.ttf') if os.path.exists(os.path.join(FONT_DIR, 'OpenSans-Regular.ttf')) else os.path.join(FONT_DIR, 'OpenSans-Light.ttf'), 24)

    def wrap(txt, f, maxw):
        out, cur = [], ''
        for w in txt.split():
            cand = f'{cur} {w}'.strip()
            if d.textlength(cand, font=f) <= maxw or not cur:
                cur = cand
            else:
                out.append(cur); cur = w
        return out + ([cur] if cur else [])
    for k, (sx, sy) in pos.items():
        x0 = c + sx * 335; y0 = c + sy * 300
        lines = [(pdca_name(k).upper(), fb, 58)]
        for p in [p for p in phases if PDCA[p['id']] == k]:
            lines.append((p['id'], fid, 29))
            lines += [(x, fnm, 29) for x in wrap(p['name'], fnm, 310)]
            lines[-1] = (lines[-1][0], lines[-1][1], lines[-1][2] + 9)
        hgt = sum(h for _, _, h in lines)
        y = y0 - hgt / 2
        for txt, f, h in lines:
            w = d.textlength(txt, font=f)
            d.text((x0 - w / 2, y), txt, font=f, fill='white')
            y += h
    # loop arrow hint (Act -> Plan)
    lab = X('Act feeds the next Plan: management review and improvement restart E2E-01', 'Agir alimente le Planifier suivant : la revue de direction et l\'amélioration relancent E2E-01')
    w = d.textlength(lab, font=fs)
    im2 = Image.new('RGB', (S, S + 90), 'white'); im2.paste(im, (0, 0))
    d2 = ImageDraw.Draw(im2); d2.text(((S - w) / 2, S + 25), lab, font=fs, fill='#' + INK)
    im2.save(path)


# ---------------------------------------------------------------- compact step blocks
def _p(doc, size=8.5, before=0, after=1, indent=0.0, keep=False, align=WD_ALIGN_PARAGRAPH.LEFT):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_before = Pt(before); pf.space_after = Pt(after)
    # Exact line height (Open Sans has a tall default line): about 1.24 times the font size.
    pf.line_spacing = Pt(round(size * 1.24, 1)) if size <= 9 else 1.0
    if indent: pf.left_indent = Cm(indent)
    pf.keep_with_next = keep
    p.alignment = align
    return p


def _r(p, text, size=8.5, bold=False, italic=False, color=INK, font=None):
    r = p.add_run(text)
    r.font.size = Pt(size); r.bold = bold; r.italic = italic; r.font.color.rgb = rgb(color)
    if font:
        r.font.name = font
    return r


def badge(p, k, size=7.5):
    r = _r(p, f' {k} ', size, True, color='FFFFFF')
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    shd = OxmlElement('w:shd'); shd.set(qn('w:val'), 'clear'); shd.set(qn('w:color'), 'auto'); shd.set(qn('w:fill'), PDCA_COLOR[k])
    r._r.get_or_add_rPr().append(shd)
    _r(p, '  ', size)


def cut(v, n):
    s = '' if v is None else str(v)
    return s if len(s) <= n else s[:n - 1] + '…'


def row_lines(doc, f):
    """The rows of a record table, one line per row, values in the order of the columns."""
    cols = f['columns']; rows = f.get('rows') or []
    for i, r in enumerate(rows):
        q = _p(doc, 7.5, after=0, indent=0.8)
        _r(q, f"{i + 1}. ", 7.5, True, color=AZURE)
        vals = [cut(r[j] if j < len(r) else '', 95) or '—' for j in range(len(cols))]
        for j, v in enumerate(vals):
            if j:
                _r(q, '  ·  ', 7.5, True, color=AZURE)
            _r(q, v, 7.5, bold=(j == 0), color=NAVY if j == 0 else INK)


def step_block(doc, s, task_label=None):
    """The step line, then at once what to type: the simple fields continue the same line after
    "What to type ▸"; each record table follows on the next lines, one line per row."""
    k = KIND_PDCA.get(s['kind'], 'D')
    simple = [f for f in s['type_'] if f.get('columns') is None]
    tables = [f for f in s['type_'] if f.get('columns') is not None]
    p = _p(doc, 8, before=2, after=0, keep=bool(tables))
    p.paragraph_format.left_indent = Cm(0.45); p.paragraph_format.first_line_indent = Cm(-0.45)
    badge(p, k, 7)
    _r(p, s['id'] + '  ', 8, True, color=AZURE)
    _r(p, s['name'], 8, True, color=NAVY)
    _r(p, f"  ({s['role']} · {s['form']})  ", 7.5, color=MUTED)
    _r(p, X('What to type ▸ ', 'À saisir ▸ '), 7.5, True, color=TEAL)
    if not simple and not tables:
        _r(p, X('nothing to type: select Complete step.', 'rien à saisir : sélectionnez Terminer l\'étape.'), 7.5, italic=True)
    for i, f in enumerate(simple):
        if i:
            _r(p, '  ·  ', 7.5, color=MUTED)
        _r(p, f"{f['field']}: " if LANG == 'en' else f"{f['field']} : ", 7.5, True, color=NAVY)
        v = f.get('value')
        _r(p, '—' if v in (None, '') else cut(v, 240), 7.5)
    for ti, f in enumerate(tables):
        if ti == 0 and not simple:
            q = p
        else:
            q = _p(doc, 7.5, after=0, indent=0.45, keep=True)
        n = len(f.get('rows') or [])
        _r(q, f"{f['field']} — " + X(f"type {n} row{'s' if n != 1 else ''}", f"saisissez {n} ligne{'s' if n != 1 else ''}"), 7.5, True, color=NAVY)
        if f['type'] != 'racsi':
            _r(q, X(' (columns: ', ' (colonnes : ') + ' · '.join(f['columns']) + ')', 7.5, italic=True, color=MUTED)
        _r(q, ':' if LANG == 'en' else ' :', 7.5, True, color=NAVY)
        if f['type'] == 'racsi':
            r0 = (f.get('rows') or [[]])[0]
            q2 = _p(doc, 7.5, after=0, indent=0.8)
            _r(q2, ' · '.join(f"{c}: {v}" for c, v in zip(f['columns'], r0) if v), 7.5)
        else:
            row_lines(doc, f)
    if s.get('creates'):
        q = _p(doc, 7.5, after=0, indent=0.45)
        _r(q, X('On completion: ', 'À la clôture : '), 7.5, True, color=GREEN)
        _r(q, X(' and ', ' et ').join(X('each row becomes an action of the Action plan', 'chaque ligne devient une action du plan d\'actions') if c == 'actions' else X('each row becomes an objective of the register', 'chaque ligne devient un objectif du registre') for c in s['creates']) + '.', 7.5, italic=True)


# ---------------------------------------------------------------- chapters
def about(doc, data):
    p = data['project']; o = data['org']
    steps = sum(len(t['steps']) for ph in data['phases'] for m in ph['mps'] for t in m['tasks'])
    mps = sum(len(ph['mps']) for ph in data['phases'])
    tasks = sum(len(m['tasks']) for ph in data['phases'] for m in ph['mps'])
    doc.add_heading(X('About this guide', 'À propos de ce guide'), level=1)
    para(doc, X(f"This guide follows one complete, real run of DynamicMS from the first step to the last: the {len(data['phases'])} end-to-end processes, their {mps} macro processes, {tasks} tasks and {steps} steps. The run is the universal scenario of the demonstration database, so every screen, value and record matches the application. It applies to any sector or industry.",
                f"Ce guide suit un déroulement réel et complet de DynamicMS, de la première à la dernière étape : les {len(data['phases'])} processus de bout en bout, leurs {mps} macro-processus, {tasks} tâches et {steps} étapes. Le déroulement est le scénario universel de la base de démonstration : chaque écran, valeur et enregistrement correspond à l'application. Il s'applique à tout secteur d'activité."))
    table(doc, [X('Item', 'Élément'), X('Value in this run', 'Valeur de ce déroulement')], [
        [X('Organization', 'Organisation'), f"{o['name']} ({o['code']}) — {X('universal vertical, large company', 'secteur universel, grande entreprise')}, {o['employees']} {X('employees', 'salariés')}, {X('member of', 'membre de')} {o['group']}"],
        [X('Project', 'Projet'), f"{p['code']} — {p['name']}"],
        [X('Management system', 'Système de management'), f"{p['ms']} · {', '.join(p['standards'])} · {X('full lifecycle', 'cycle complet')} ({p['mode']})"],
        [X('Project template', 'Modèle de projet'), f"{data['template']['code']} — {data['template']['name']}"],
        [X('Period', 'Période'), f"{p['start']} → {p['end']}"],
        [X('Configuration', 'Configuration'), f"Solution Pack {o['pack']}; {X('capability packs', 'packs de capacités')} {', '.join(o['caps'])}; {X('add-ons', 'options')} {', '.join(o['addons'])}"],
        [X('Sign-in', 'Connexion'), f"{URL} — {X('password', 'mot de passe')} Demo@2026"],
    ], [4.2, 12.8], size=9, bold_first=True)
    doc.add_heading(X('How to read a step', 'Comment lire une étape'), level=2)
    bullets(doc, [
        (X('Step, then what to type. ', 'Étape, puis ce qu\'il faut saisir. '), X('Each step gives its badge, identifier, name, role and form, immediately followed by "What to type ▸" with the value of every field. The rows of its record tables follow at once, one line per row with the values in the order of the columns, before the next step.', 'Chaque étape donne son badge, son identifiant, son nom, son rôle et son formulaire, immédiatement suivis de « À saisir ▸ » avec la valeur de chaque champ. Les lignes de ses tableaux d\'enregistrements suivent aussitôt, une ligne par enregistrement avec les valeurs dans l\'ordre des colonnes, avant l\'étape suivante.')),
        (X('PDCA badge. ', 'Badge PDCA. '), X('P (Plan: identify, set, configure, assign), D (Do: execute, document, communicate, train), C (Check: monitor, assess, review), A (Act: decide, close, escalate). Inside each macro process the badges show its own small PDCA cycle.', 'P (Planifier : identifier, fixer, configurer, affecter), D (Réaliser : exécuter, documenter, communiquer, former), C (Vérifier : surveiller, évaluer, revoir), A (Agir : décider, clore, escalader). Dans chaque macro-processus, les badges montrent son propre petit cycle PDCA.')),
        (X('Values. ', 'Valeurs. '), X('Type the values as written; choose list values as written; dates are in the format YYYY-MM-DD. Long texts of record tables are shortened with … in this guide only.', 'Saisissez les valeurs telles qu\'écrites ; choisissez les valeurs de liste telles qu\'écrites ; les dates sont au format AAAA-MM-JJ. Les textes longs des tableaux sont abrégés par … dans ce guide uniquement.')),
        (X('Completing. ', 'Terminer. '), X('After typing, select Save draft to keep the draft or Complete step to finish it; the next step opens. A phase ends with its gate (checklist, then Go, Hold or No-Go).', 'Après la saisie, sélectionnez Enregistrer le brouillon pour le conserver ou Terminer l\'étape pour la finir ; l\'étape suivante s\'ouvre. Une phase se termine par son jalon (liste de contrôle, puis Go, En attente ou No-Go).')),
    ], size=10)
    p2 = _p(doc, 9, before=4, after=2)
    _r(p2, X('Example — ', 'Exemple — '), 9, True, color=NAVY)
    _r(p2, X('a step and what to type in it, as laid out in the full run:', 'une étape et ce qu\'il faut y saisir, telles que présentées dans le déroulement complet :'), 9)
    s0 = data['phases'][0]['mps'][0]['tasks'][0]['steps'][0]
    step_block(doc, s0)


def pdca_chapter(doc, data):
    doc.add_heading(X('The PDCA dynamic of the run', 'La dynamique PDCA du déroulement'), level=1)
    para(doc, X('DynamicMS runs the management system as a Plan-Do-Check-Act cycle at three levels. The 12 end-to-end phases form the large cycle; each macro process has its own small cycle (the P, D, C, A badges of its steps); the process review closes the loop by turning measured data into reports and decisions that start the next cycle.',
                'DynamicMS déroule le système de management comme un cycle Planifier-Réaliser-Vérifier-Agir à trois niveaux. Les 12 phases de bout en bout forment le grand cycle ; chaque macro-processus a son propre petit cycle (les badges P, D, C, A de ses étapes) ; la revue de processus ferme la boucle en transformant les données mesurées en rapports et en décisions qui lancent le cycle suivant.'))
    fig = os.path.join(BUILD, f'pdca-{LANG}.png')
    pdca_figure(fig, data['phases'])
    image(doc, fig, 12.5, X('Figure — The 12 end-to-end processes of the run on the PDCA cycle.', 'Figure — Les 12 processus de bout en bout du déroulement sur le cycle PDCA.'))
    fd = feeds()
    table(doc, ['PDCA', X('End-to-end process', 'Processus de bout en bout'), X('What it delivers', 'Ce qu\'il produit'), X('What it feeds', 'Ce qu\'il alimente')],
          [[pdca_name(PDCA[ph['id']]), f"{ph['id']} {ph['name']}", fd[ph['id']][0], fd[ph['id']][1]] for ph in data['phases']], [1.8, 3.6, 6.0, 5.6], size=8.5)
    doc.add_heading(X('The loops that keep the system alive', 'Les boucles qui font vivre le système'), level=2)
    bullets(doc, [
        (X('Measure and review (C → A). ', 'Mesurer et revoir (C → A). '), X('KPI values recorded in E2E-07 and E2E-10 feed the monthly process mini-reviews (MP-034.4) and the management review (MP-034.5); each decision becomes an action of the Action plan.', 'Les valeurs de KPI saisies en E2E-07 et E2E-10 alimentent les mini-revues mensuelles des processus (MP-034.4) et la revue de direction (MP-034.5) ; chaque décision devient une action du plan d\'actions.')),
        (X('Detect and learn (D → C → A). ', 'Détecter et apprendre (D → C → A). '), X('Nonconformities raised in operations or by audits (E2E-08, E2E-11) are contained, analysed and corrected in E2E-09; their lessons learned update documents and competences (E2E-05).', 'Les non-conformités relevées en opération ou par les audits (E2E-08, E2E-11) sont maîtrisées, analysées et corrigées en E2E-09 ; leurs retours d\'expérience mettent à jour les documents et les compétences (E2E-05).')),
        (X('Improve and restart (A → P). ', 'Améliorer et relancer (A → P). '), X('E2E-12 selects improvements and innovations; their results and the management review outputs are the inputs of the next E2E-01 (context, policy and objectives reviewed).', 'E2E-12 sélectionne les améliorations et les innovations ; leurs résultats et les sorties de la revue de direction sont les éléments d\'entrée du prochain E2E-01 (contexte, politique et objectifs revus).')),
        (X('Gates. ', 'Jalons. '), X('Each phase ends with a gate decided by Top Management after its checklist: Go moves to the next phase, Hold keeps the phase open, No-Go sends steps back for rework.', 'Chaque phase se termine par un jalon décidé par la direction après sa liste de contrôle : Go passe à la phase suivante, En attente garde la phase ouverte, No-Go renvoie des étapes en reprise.')),
    ], size=10)


def getting_started(doc, data):
    doc.add_heading(X('Getting started', 'Prise en main'), level=1)
    numbered(doc, [
        X(f'Open {URL} (or the address given by your administrator) in Chrome, Edge, Firefox or Safari.', f'Ouvrez {URL} (ou l\'adresse donnée par votre administrateur) dans Chrome, Edge, Firefox ou Safari.'),
        X('Email: type ims@horizon-universal.example. Password: type Demo@2026. Select Sign in.', 'E-mail : saisissez ims@horizon-universal.example. Mot de passe : saisissez Demo@2026. Sélectionnez Se connecter.'),
        X('Language: choose EN, FR or ع (Arabic, right to left) at the top right.', 'Langue : choisissez EN, FR ou ع (arabe, de droite à gauche) en haut à droite.'),
        X(f'Project: choose “{data["project"]["code"]} — {data["project"]["name"]}” in the header switcher. Every screen then works on this project.', f'Projet : choisissez « {data["project"]["code"]} — {data["project"]["name"]} » dans le sélecteur de l\'en-tête. Chaque écran travaille alors sur ce projet.'),
    ])
    shot(doc, 'home', X('Figure — Home of the project: progress by phase, KPI trend, next steps.', 'Figure — Accueil du projet : avancement par phase, tendance des KPI, prochaines étapes.'))
    doc.add_heading(X('Who does what in this run', 'Qui fait quoi dans ce déroulement'), level=2)
    table(doc, [X('Role', 'Rôle'), X('Person', 'Personne'), X('Sign-in e-mail', 'E-mail de connexion')], [[u['role'], u['name'], u['email']] for u in data['users']], [5.5, 4.5, 7], size=8.5)
    doc.add_heading(X('Create the project', 'Créer le projet'), level=2)
    p = data['project']
    numbered(doc, [
        X('Open Organization › New project and select From the catalog.', 'Ouvrez Organisation › Nouveau projet et sélectionnez Depuis le catalogue.'),
        X(f'Name: type “{p["name"]}”. Management system: QMS. Start date: {p["start"]}.', f'Nom : saisissez « {p["name"]} ». Système de management : QMS. Date de début : {p["start"]}.'),
        X(f'Template: choose {data["template"]["code"]} — {data["template"]["name"]}.', f'Modèle : choisissez {data["template"]["code"]} — {data["template"]["name"]}.'),
        X('Complexity: set the levels ' + ', '.join(f"{c['code']} = {c['level']}" for c in data['criteria']) + f" (score {data['score']['score']} / 100), then select Create project.", 'Complexité : réglez les niveaux ' + ', '.join(f"{c['code']} = {c['level']}" for c in data['criteria']) + f" (score {data['score']['score']} / 100), puis sélectionnez Créer le projet."),
    ])
    shot(doc, 'lifecycle', X('Figure — Lifecycle: the 12 end-to-end processes with their progress and gate status.', 'Figure — Cycle de vie : les 12 processus de bout en bout avec leur avancement et l\'état de leur jalon.'))


SHOTS_AFTER_MP = {
    'MP-001': ('step', ('Figure — Step MP-001.3: the record table of internal issues, one row per issue with its source.', 'Figure — Étape MP-001.3 : le tableau des enjeux internes, une ligne par enjeu avec sa source.')),
    'MP-003': ('smart', ('Figure — SMART objectives: each row becomes an objective of the register.', 'Figure — Objectifs SMART : chaque ligne devient un objectif du registre.')),
    'MP-034': ('review', ('Figure — Management review step: inputs reviewed, then decisions and actions.', 'Figure — Étape de revue de direction : éléments revus, puis décisions et actions.')),
}
SHOTS_AFTER_PHASE = {
    'E2E-01': ('mp', ('Figure — A macro process: tasks, steps, RACSI, documents and readiness.', 'Figure — Un macro-processus : tâches, étapes, RACSI, documents et préparation.')),
    'E2E-05': ('documents', ('Figure — Documents generated from the templates, with versions and downloads (PDF, DOCX, XLSX, PPTX).', 'Figure — Documents générés à partir des modèles, avec versions et téléchargements (PDF, DOCX, XLSX, PPTX).')),
    'E2E-09': ('nc', ('Figure — A nonconformity: containment, root cause, corrective actions, effectiveness.', 'Figure — Une non-conformité : confinement, cause racine, actions correctives, efficacité.')),
    'E2E-10': ('gate', ('Figure — Gate of E2E-10: checklist and decision.', 'Figure — Jalon de E2E-10 : liste de contrôle et décision.')),
}


def run_chapter(doc, data):
    doc.add_heading(X('The full run, phase by phase', 'Le déroulement complet, phase par phase'), level=1)
    para(doc, X('Open Lifecycle, select a phase card, then a macro process, then its first open step; or open My tasks. Follow the steps in order. Each step is followed by what to type in it.',
                'Ouvrez Cycle de vie, sélectionnez la carte d\'une phase, puis un macro-processus, puis sa première étape ouverte ; ou ouvrez Mes tâches. Suivez les étapes dans l\'ordre. Chaque étape est suivie de ce qu\'il faut y saisir.'))
    ceo = next((u for u in data['users'] if u['code'] == 'top_management'), None)
    fd = feeds()
    for ph in data['phases']:
        k = PDCA[ph['id']]
        doc.add_heading(f"{ph['id']} — {ph['name']}  ·  {pdca_name(k)}", level=2)
        q = _p(doc, 9.5, after=2)
        badge(q, k, 8.5)
        _r(q, X('Goals: ', 'Objectifs : '), 9.5, True, color=NAVY); _r(q, ph['goals'] + '. ', 9.5)
        _r(q, X('From trigger to terminal event: ', 'Du déclencheur à l\'événement final : '), 9.5, True, color=NAVY); _r(q, f"{ph['trigger']} → {ph['terminal']}.", 9.5)
        n_steps = sum(len(t['steps']) for m in ph['mps'] for t in m['tasks'])
        q = _p(doc, 9, after=4)
        _r(q, X(f"{len(ph['mps'])} macro processes, {n_steps} steps. Delivers: ", f"{len(ph['mps'])} macro-processus, {n_steps} étapes. Produit : "), 9, True, color=MUTED); _r(q, fd[ph['id']][0] + ' ', 9, color=MUTED)
        _r(q, X('Feeds: ', 'Alimente : '), 9, True, color=MUTED); _r(q, fd[ph['id']][1], 9, color=MUTED)
        for mp in ph['mps']:
            doc.add_heading(f"{mp['code']} ({mp['id']}) — {mp['name']}", level=3)
            q = _p(doc, 8.5, after=2)
            _r(q, mp['goal'] + ' ', 8.5, italic=True)
            _r(q, X(f"Owner: {mp['owner']}.", f"Pilote : {mp['owner']}."), 8.5, color=MUTED)
            if mp.get('clauses'):
                _r(q, X(f" Requirements: {mp['clauses']}.", f" Exigences : {mp['clauses']}."), 8.5, color=MUTED)
            for tk in mp['tasks']:
                q = _p(doc, 8, before=2, after=0, keep=True)
                _r(q, X('Task ', 'Tâche ') + f"{tk['id']} — {tk['name']}", 8, True, color=TEAL)
                for s in tk['steps']:
                    step_block(doc, s)
            if mp['id'] in SHOTS_AFTER_MP:
                n, cap = SHOTS_AFTER_MP[mp['id']]
                shot(doc, n, cap[0] if LANG == 'en' else cap[1], 11)
        if ph['gate']:
            g = ph['gate']
            doc.add_heading(X(f"Gate — {g['name']}", f"Jalon — {g['name']}"), level=3)
            q = _p(doc, 9, after=2)
            _r(q, X('Exit criteria: ', 'Critères de sortie : '), 9, True, color=NAVY); _r(q, g['exit'], 9)
            items = [it for cl in g['checklists'] for it in cl['items']]
            q = _p(doc, 9, after=1, indent=0.55)
            _r(q, X('What to do ▸ ', 'Ce qu\'il faut faire ▸ '), 9, True, color=TEAL)
            _r(q, X('Lifecycle › phase card › gate panel. Tick: ', 'Cycle de vie › carte de la phase › panneau du jalon. Cochez : '), 9)
            _r(q, '; '.join(f"“{it['text']}”" + (X(' (mandatory, evidence)', ' (obligatoire, preuve)') if it['mandatory'] else '') for it in items) + '.', 9)
            q = _p(doc, 9, after=4, indent=0.55)
            if ph.get('decision'):
                _r(q, X('Decision: ', 'Décision : '), 9, True, color=NAVY)
                _r(q, X(f"sign in as {ceo['name']} ({ceo['email']}), select {ph['decision']} and type the comment “Exit criteria met; evidence reviewed; proceed to the next phase.”", f"connectez-vous comme {ceo['name']} ({ceo['email']}), sélectionnez {ph['decision']} et saisissez le commentaire « Critères de sortie atteints ; preuves revues ; passage à la phase suivante. »"), 9)
            else:
                _r(q, X('Decision: ', 'Décision : '), 9, True, color=NAVY)
                _r(q, X('this phase is still active in the demonstration database; when its last step is complete, Top Management selects Go to close the cycle and open the next one.', 'cette phase est encore active dans la base de démonstration ; quand sa dernière étape est terminée, la direction sélectionne Go pour clore le cycle et ouvrir le suivant.'), 9)
        callout(doc, X(f"{fd[ph['id']][1]}", f"{fd[ph['id']][1]}"), X('PDCA link —', 'Lien PDCA —'))
        if ph['id'] in SHOTS_AFTER_PHASE:
            n, cap = SHOTS_AFTER_PHASE[ph['id']]
            shot(doc, n, cap[0] if LANG == 'en' else cap[1], 11)


SOURCE_GROUPS = [
    ('context_*, pestle, swot, needs_parties, parties_full, scope_*', ('Context, interested parties, scope (E2E-01)', 'Contexte, parties intéressées, périmètre (E2E-01)')),
    ('policy_vision, policy_axes, policy_commitments, policy_roles, policy_review, policy_signature', ('Policy sections; the argument chooses the system (:Q, :E, :OHS, :IMS)', 'Sections de politique ; l\'argument choisit le système (:Q, :E, :OHS, :IMS)')),
    ('objectives, objectives_full, objectives_summary', ('SMART objectives register', 'Registre des objectifs SMART')),
    ('risks, risks_full, risks_top, heatmap, opportunities', ('Risks and opportunities, heat map', 'Risques et opportunités, carte de chaleur')),
    ('obligations, obligations_full, clause_matrix, mandatory_matrix', ('Compliance obligations, clause coverage', 'Obligations de conformité, couverture des exigences')),
    ('competence, competence_matrix, training, training_plan', ('Competences and training', 'Compétences et formation')),
    ('documents, documents_full, records_retention, revisions', ('Documented information', 'Informations documentées')),
    ('kpis, kpi_definitions, kpi_values, kpi_results, kpi_analysis', ('KPI definitions, values, results and analysis', 'Définitions, valeurs, résultats et analyse des KPI')),
    ('ncs, ncs_full, capa_d0 … capa_d8, rex', ('Nonconformities, 8D corrective actions, lessons learned', 'Non-conformités, actions correctives 8D, retours d\'expérience')),
    ('audits, audit_findings, audit_conclusion, audit_universe', ('Audit programme, findings and conclusions', 'Programme d\'audit, constats et conclusions')),
    ('mr_header, mr_inputs, mr_outputs, mr_agenda, mr_conclusion', ('Management review pack', 'Dossier de revue de direction')),
    ('mp_*, phase_*, process_list, pmap_diagram, racsi', ('Process sheets: SIPOC, BPMN, RACSI, KPIs, risks, gate', 'Fiches processus : SIPOC, BPMN, RACSI, KPI, risques, jalon')),
    ('step_rows:<step>, step_matrix:<step>, step_review:<step>', ('The rows typed in one step (for example step_rows:MP-001.7)', 'Les lignes saisies dans une étape (par exemple step_rows:MP-001.7)')),
]


def review_chapter(doc, data, reports):
    doc.add_heading(X('Process review: from data sources to reports', 'Revue de processus : des sources de données aux rapports'), level=1)
    para(doc, X('This chapter follows the process review of the run from end to end: define and configure the data sources, capture the data, generate the documents, hold the reviews, then export the reports in PDF, Word, Excel, PowerPoint or CSV. It is the PDCA of reporting: Plan the sources and templates, Do the capture and generation, Check in the reviews, Act on the decisions.',
                'Ce chapitre suit la revue de processus du déroulement de bout en bout : définir et configurer les sources de données, saisir les données, générer les documents, tenir les revues, puis exporter les rapports en PDF, Word, Excel, PowerPoint ou CSV. C\'est le PDCA du reporting : Planifier les sources et les modèles, Réaliser la saisie et la génération, Vérifier en revue, Agir sur les décisions.'))

    def step(no, k, title, who, typed, after=None):
        p = _p(doc, 10, before=6, after=1, keep=True)
        badge(p, k, 8)
        _r(p, f"{no}  ", 10, True, color=AZURE); _r(p, title, 10, True, color=NAVY); _r(p, f"  ·  {who}", 8.5, color=MUTED)
        for t in typed:
            q = _p(doc, 9, after=1, indent=0.55)
            if isinstance(t, tuple):
                _r(q, t[0], 9, True, color=NAVY); _r(q, t[1], 9)
            else:
                _r(q, t, 9)
        if after:
            after()

    doc.add_heading(X('Plan — define and configure the data sources', 'Planifier — définir et configurer les sources de données'), level=2)
    step('R1', 'P', X('Connect the external systems', 'Connecter les systèmes externes'), X('Tenant Administrator — Hind Berrada (admin@horizon-universal.example)', 'Administrateur du locataire — Hind Berrada (admin@horizon-universal.example)'), [
        (X('Where: ', 'Où : '), X('Administration › Integrations.', 'Administration › Intégrations.')),
        (X('What to type ▸ ', 'Ce qu\'il faut saisir ▸ '), X('Enabled: tick INT-02 SAP ERP / S/4HANA (orders, deliveries, suppliers), INT-04 Personio HR (people, competences), INT-08 ManWinWin CMMS (equipment, calibration), INT-09 EcoOnline EHS (incidents). Leave the others unticked.', 'Activé : cochez INT-02 SAP ERP / S/4HANA (commandes, livraisons, fournisseurs), INT-04 Personio HR (personnes, compétences), INT-08 ManWinWin CMMS (équipements, étalonnage), INT-09 EcoOnline EHS (incidents). Laissez les autres décochés.')),
        (X('Check ▸ ', 'Vérifier ▸ '), X('select Test on each enabled line; Health must show OK with the date of the test.', 'sélectionnez Test sur chaque ligne activée ; la santé doit indiquer OK avec la date du test.')),
    ], lambda: shot(doc, 'integrations', X('Figure — Integrations: enabled data sources and their health.', 'Figure — Intégrations : sources de données activées et leur état de santé.'), 14))
    kp = data['records']['kpis']
    step('R2', 'P', X('Define the KPIs and their data', 'Définir les KPI et leurs données'), X('Performance Manager — Tariq Saleh', 'Responsable de la performance — Tariq Saleh'), [
        (X('Where: ', 'Où : '), X('KPIs (and the KPI steps of E2E-07 and E2E-10, for example MP-009.3 Set process KPIs targets).', 'KPI (et les étapes KPI de E2E-07 et E2E-10, par exemple MP-009.3 Fixer les cibles des KPI des processus).')),
        (X('What to type ▸ ', 'Ce qu\'il faut saisir ▸ '), X('for each KPI its target and frequency, as in the project: ', 'pour chaque KPI sa cible et sa fréquence, comme dans le projet : ') + '; '.join(f"{k['code']} {k['name']} — {X('target', 'cible')} {k['target']}" for k in kp) + '.'),
    ])
    step('R3', 'P', X('Configure the document templates and their data sources', 'Configurer les modèles de documents et leurs sources de données'), X('Document Controller — Sofia Bennani', 'Responsable documentaire — Sofia Bennani'), [
        (X('Where: ', 'Où : '), X('Documents › Templates › TPL-POL-Q Quality policy › Copy to edit (the copy replaces the library template for the organization).', 'Documents › Modèles › TPL-POL-Q Politique qualité › Copier pour modifier (la copie remplace le modèle de la bibliothèque pour l\'organisation).')),
        (X('What to type ▸ ', 'Ce qu\'il faut saisir ▸ '), X('Structure tab: for each section keep Type = Project data and choose its data source: 1. Our vision and ambition → policy_vision:Q; 2. Our strategic axes → policy_axes:Q; 3. Our commitments → policy_commitments:Q; 4. Roles → policy_roles:Q; 5. Review → policy_review; 6. Approval → policy_signature. Introduction (optional): type “This policy applies to all sites of {org}.”', 'Onglet Structure : pour chaque section gardez Type = Données du projet et choisissez sa source : 1. Notre vision et notre ambition → policy_vision:Q ; 2. Nos axes stratégiques → policy_axes:Q ; 3. Nos engagements → policy_commitments:Q ; 4. Rôles → policy_roles:Q ; 5. Revue → policy_review ; 6. Approbation → policy_signature. Introduction (facultatif) : saisissez « Cette politique s\'applique à tous les sites de {org}. »')),
        (X('Formatting tab ▸ ', 'Onglet Mise en forme ▸ '), X('Body font Open Sans 10, headings Montserrat 14, margins 1.7 cm, table of contents on, page numbers on. Select Save template.', 'Police du corps Open Sans 10, titres Montserrat 14, marges 1,7 cm, table des matières activée, numéros de page activés. Sélectionnez Enregistrer le modèle.')),
    ], lambda: shot(doc, 'tpl-editor', X('Figure — Template editor: each section takes its data from a project data source.', 'Figure — Éditeur de modèle : chaque section prend ses données d\'une source de données du projet.'), 14))
    table(doc, [X('Data sources (Data from the project)', 'Sources de données (Données du projet)'), X('Content', 'Contenu')], [[a, (b[0] if LANG == 'en' else b[1])] for a, b in SOURCE_GROUPS], [8.5, 8.5], size=8.5)
    step('R4', 'P', X('Set the document layout', 'Définir la mise en page des documents'), X('Document Controller — Sofia Bennani', 'Responsable documentaire — Sofia Bennani'), [
        (X('Where: ', 'Où : '), X('Documents › Layout.', 'Documents › Mise en page.')),
        (X('What to type ▸ ', 'Ce qu\'il faut saisir ▸ '), X('Table header color #123A5F; Accent color #1876C6; Title color #123A5F; Logo text “Horizon Universal Holdings”; Header text “Controlled copy — Horizon Universal Holdings”; Footer text empty (organization, code and version by default). Upload a logo (PNG or JPEG), then select Save layout.', 'Couleur des en-têtes de tableau #123A5F ; couleur d\'accent #1876C6 ; couleur des titres #123A5F ; texte du logo « Horizon Universal Holdings » ; texte d\'en-tête « Copie maîtrisée — Horizon Universal Holdings » ; texte de pied vide (organisation, code et version par défaut). Téléversez un logo (PNG ou JPEG), puis sélectionnez Enregistrer la mise en page.')),
    ])
    doc.add_heading(X('Do — capture the data and generate the documents', 'Réaliser — saisir les données et générer les documents'), level=2)
    step('R5', 'D', X('Record the KPI values', 'Saisir les valeurs des KPI'), X('Performance Manager — Tariq Saleh', 'Responsable de la performance — Tariq Saleh'), [
        (X('Where: ', 'Où : '), X('KPIs › select a KPI › Record a value (or the Measurement steps of the run).', 'KPI › sélectionnez un KPI › Saisir une valeur (ou les étapes de mesure du déroulement).')),
        (X('What to type ▸ ', 'Ce qu\'il faut saisir ▸ '), X('Period (month) and measured value, for example: ', 'Période (mois) et valeur mesurée, par exemple : ') + '; '.join(f"{k['code']} = {k['last']}" for k in kp) + '.'),
    ], lambda: shot(doc, 'kpis', X('Figure — KPIs with their last value, target and status.', 'Figure — KPI avec leur dernière valeur, leur cible et leur statut.'), 14))
    step('R6', 'D', X('Generate a document from a step', 'Générer un document depuis une étape'), X('Process owner of the step', 'Pilote du processus de l\'étape'), [
        (X('Where: ', 'Où : '), X('any Document step of the run (for example the policy step of UMS022), select Generate document.', 'toute étape Document du déroulement (par exemple l\'étape de politique de UMS022), sélectionnez Générer un document.')),
        (X('What to type ▸ ', 'Ce qu\'il faut saisir ▸ '), X('Template: TPL-POL-Q Quality policy; select Generate. The step fields Document reference, Version 0.1 and Template are filled; the document appears under Documents of this step.', 'Modèle : TPL-POL-Q Politique qualité ; sélectionnez Générer. Les champs Référence, Version 0.1 et Modèle de l\'étape sont remplis ; le document apparaît sous Documents de cette étape.')),
    ])
    step('R7', 'D', X('Review, approve and publish the version', 'Revoir, approuver et publier la version'), X('Document Controller, then Quality Manager', 'Responsable documentaire, puis responsable qualité'), [
        (X('Where: ', 'Où : '), X('Documents › open the document › Versions.', 'Documents › ouvrez le document › Versions.')),
        (X('What to type ▸ ', 'Ce qu\'il faut saisir ▸ '), X('Change note “First issue generated from the project data”; Submit for review; the approver selects Approve then Publish. The version becomes 1.0 Published and the next review date is set by the review frequency.', 'Note de modification « Première édition générée à partir des données du projet » ; Soumettre pour revue ; l\'approbateur sélectionne Approuver puis Publier. La version devient 1.0 Publiée et la date de prochaine revue suit la fréquence de revue.')),
    ])
    doc.add_heading(X('Check — hold the process and management reviews', 'Vérifier — tenir les revues de processus et de direction'), level=2)
    rv = {}
    for ph in data['phases']:
        for m in ph['mps']:
            for t in m['tasks']:
                for s in t['steps']:
                    if s['id'] in ('MP-034.4', 'MP-034.5'):
                        rv[s['id']] = s
    for sid, no in (('MP-034.4', 'R8'), ('MP-034.5', 'R9')):
        if sid in rv:
            s = rv[sid]
            p = _p(doc, 10, before=6, after=1, keep=True)
            _r(p, f"{no}  ", 10, True, color=AZURE)
            _r(p, X('Run step ', 'Réaliser l\'étape ') + f"{s['id']} — {s['name']}", 10, True, color=NAVY)
            step_block(doc, s)
    doc.add_heading(X('Act — export the reports and follow the decisions', 'Agir — exporter les rapports et suivre les décisions'), level=2)
    step('R10', 'A', X('Export the reports in the format you need', 'Exporter les rapports dans le format voulu'), X('IMS Manager — Omar Haddad', 'Responsable SMI — Omar Haddad'), [
        (X('Where: ', 'Où : '), X('Insight › Reports.', 'Pilotage › Rapports.')),
        (X('What to choose ▸ ', 'Ce qu\'il faut choisir ▸ '), X('Format: PDF (to sign and archive), Excel (one sheet per table, filters), Word (to edit), PowerPoint (16:9 slides for the review meeting: title, KPI cards, one slide per section, tables split over slides) or CSV (data). Language: English, Français or العربية. Then select Download on the report.', 'Format : PDF (pour signer et archiver), Excel (une feuille par tableau, filtres), Word (pour modifier), PowerPoint (diapositives 16:9 pour la réunion de revue : titre, cartes KPI, une diapositive par section, tableaux répartis sur plusieurs diapositives) ou CSV (données). Langue : English, Français ou العربية. Puis sélectionnez Télécharger sur le rapport.')),
    ], lambda: (shot(doc, 'reports', X('Figure — Reports: choose the format (PDF, Excel, Word, PowerPoint, CSV) and the language.', 'Figure — Rapports : choisissez le format (PDF, Excel, Word, PowerPoint, CSV) et la langue.'), 13),
                shot(doc, 'pptx-review', X('Figure — The Management review input report of the run exported to PowerPoint: title slide, KPI cards, quality objectives, KPI table.', 'Figure — Le rapport Éléments d\'entrée de la revue de direction du déroulement exporté en PowerPoint : diapositive de titre, cartes KPI, objectifs qualité, tableau des KPI.'), 13)))
    table(doc, [X('Report', 'Rapport'), X('Use in the review', 'Usage en revue'), X('Best format', 'Format conseillé')], [
        [reports['status'], X('Progress by phase and gate, overdue steps', 'Avancement par phase et jalon, étapes en retard'), 'PowerPoint, PDF'],
        [reports['review'], X('Inputs required by ISO 9001 §9.3.2', 'Éléments d\'entrée exigés par l\'ISO 9001 §9.3.2'), 'PowerPoint, Word'],
        [reports['kpis'], X('KPI results against targets', 'Résultats des KPI par rapport aux cibles'), 'Excel, PowerPoint'],
        [reports['ncs'], X('Nonconformities and corrective actions', 'Non-conformités et actions correctives'), 'Excel, PDF'],
        [reports['risks'], X('Risks and opportunities by score', 'Risques et opportunités par cotation'), 'Excel, PDF'],
        [reports['audits'], X('Audits planned and done', 'Audits planifiés et réalisés'), 'Word, PDF'],
        [reports['documents'], X('Documented information and review dates', 'Informations documentées et dates de revue'), 'Excel'],
        [reports['racsi'], X('Who is responsible and accountable', 'Qui est responsable et redevable'), 'Excel, PDF'],
        [reports['steps'], X('Values typed in each step (evidence)', 'Valeurs saisies à chaque étape (preuves)'), 'Excel, CSV'],
    ], [5.2, 8.0, 3.8], size=8.5)
    step('R11', 'A', X('Download a document in every format', 'Télécharger un document dans tous les formats'), X('Any reader', 'Tout lecteur'), [
        (X('Where: ', 'Où : '), X('Documents › Download column, or the document page.', 'Documents › colonne Télécharger, ou la page du document.')),
        (X('What to choose ▸ ', 'Ce qu\'il faut choisir ▸ '), X('PDF, DOCX or XLSX as the template allows, and PPTX for every document (to present a procedure, a policy or a review pack). A draft carries the mention UNCONTROLLED DRAFT.', 'PDF, DOCX ou XLSX selon le modèle, et PPTX pour tout document (pour présenter une procédure, une politique ou un dossier de revue). Un brouillon porte la mention PROJET NON MAÎTRISÉ.')),
    ])
    step('R12', 'A', X('Turn the decisions into actions and restart the cycle', 'Transformer les décisions en actions et relancer le cycle'), X('IMS Manager and action owners', 'Responsable SMI et porteurs d\'actions'), [
        (X('Where: ', 'Où : '), X('the Decisions and actions table of the review step creates the actions; follow them in Records › Action plan.', 'le tableau Décisions et actions de l\'étape de revue crée les actions ; suivez-les dans Enregistrements › Plan d\'actions.')),
        (X('What to type ▸ ', 'Ce qu\'il faut saisir ▸ '), X('for each action: progress (%), status, evidence; the evaluator (another person than the owner) records the effectiveness. Effective actions feed E2E-12; the review outputs and the improvement results open the next E2E-01.', 'pour chaque action : avancement (%), statut, preuve ; l\'évaluateur (une autre personne que le porteur) enregistre l\'efficacité. Les actions efficaces alimentent E2E-12 ; les sorties de revue et les résultats d\'amélioration ouvrent le prochain E2E-01.')),
    ])


def records_chapter(doc, data):
    doc.add_heading(X('Records created by the run', 'Enregistrements créés par le déroulement'), level=1)
    rec = data['records']
    para(doc, X('Besides the step values, the run creates records in the Records and Governance menus. The main ones are listed below with the values of the run.', 'En plus des valeurs des étapes, le déroulement crée des enregistrements dans les menus Enregistrements et Gouvernance. Les principaux sont listés ci-dessous avec les valeurs du déroulement.'))
    doc.add_heading(X('Nonconformities', 'Non-conformités'), level=2)
    table(doc, [X('Code', 'Code'), X('Title', 'Titre'), X('Source', 'Origine'), X('Criticality', 'Criticité'), X('Stage', 'Étape'), X('Root cause', 'Cause racine')], [[n['code'], n['title'], n['source'], n['criticality'], n['stage'], cut(n.get('rootCause'), 120)] for n in rec['ncs']], [3.2, 3.4, 1.8, 1.8, 1.8, 5.0], size=8.5)
    doc.add_heading(X('Risks and opportunities', 'Risques et opportunités'), level=2)
    table(doc, [X('Code', 'Code'), X('Kind', 'Nature'), X('Title', 'Titre'), 'L × I', X('Treatment', 'Traitement')], [[r['code'], r['kind'], r['title'], f"{r['l']} × {r['i']} = {r['l'] * r['i']}", r['treatment']] for r in rec['risks']], [2.2, 2.0, 7.6, 2.4, 2.8], size=8.5)
    doc.add_heading(X('Audits', 'Audits'), level=2)
    table(doc, [X('Code', 'Code'), X('Title', 'Titre'), X('Type', 'Type'), X('Standard', 'Norme'), X('Planned', 'Prévu'), X('Status', 'Statut')], [[a['code'], a['title'], a['type'], a['standard'], a['planned_date'], a['status']] for a in rec['audits']], [3.6, 5.4, 1.8, 1.8, 2.2, 2.2], size=8.5)
    doc.add_heading(X('Documents', 'Documents'), level=2)
    para(doc, X(f"{len(rec['documents'])} documents are generated from the templates during the run. A selection:", f"{len(rec['documents'])} documents sont générés à partir des modèles pendant le déroulement. Une sélection :"), size=10)
    table(doc, [X('Code', 'Code'), X('Title', 'Titre'), X('Type', 'Type'), X('Template', 'Modèle'), X('Version', 'Version'), X('Status', 'Statut')], [[d['code'], d['title'], d['doc_type'], d['template_id'], d['current_version'], d['status']] for d in rec['documents'][:10]], [3.8, 5.6, 1.8, 2.6, 1.4, 1.8], size=8)


def faq(doc):
    doc.add_heading(X('Appendix — Frequent questions', 'Annexe — Questions fréquentes'), level=1)
    table(doc, [X('Question', 'Question'), X('Answer', 'Réponse')], [
        [X('I cannot complete a step.', 'Je ne peux pas terminer une étape.'), X('The step belongs to another role, a required field is empty, or the phase gate is passed. Sign in with the role shown on the step.', 'L\'étape appartient à un autre rôle, un champ obligatoire est vide ou le jalon de la phase est franchi. Connectez-vous avec le rôle indiqué sur l\'étape.')],
        [X('The Go button is disabled.', 'Le bouton Go est désactivé.'), X('Steps of the phase are still open or a mandatory checklist item is not ticked.', 'Des étapes de la phase sont encore ouvertes ou un élément obligatoire de la liste n\'est pas coché.')],
        [X('My typing is kept when I save a draft?', 'Ma saisie est-elle conservée à l\'enregistrement du brouillon ?'), X('Yes. Saving a draft, generating a document or switching tabs keeps what you are typing.', 'Oui. Enregistrer un brouillon, générer un document ou changer d\'onglet conserve ce que vous saisissez.')],
        [X('Which format for the review meeting?', 'Quel format pour la réunion de revue ?'), X('PowerPoint: Reports › format PowerPoint, or PPTX on any document.', 'PowerPoint : Rapports › format PowerPoint, ou PPTX sur tout document.')],
        [X('Where is the history of a change?', 'Où est l\'historique d\'une modification ?'), X('Every change is in Administration › Audit trail; versioned records keep their history.', 'Chaque modification est dans Administration › Piste d\'audit ; les enregistrements versionnés gardent leur historique.')],
        [X('Does the AI send data outside?', 'L\'IA envoie-t-elle des données à l\'extérieur ?'), X('Only when the administrator enables an external model in Administration › AI models; otherwise the built-in engine answers.', 'Seulement si l\'administrateur active un modèle externe dans Administration › Modèles d\'IA ; sinon le moteur intégré répond.')],
    ], [6, 11], size=9.5, bold_first=True)


def _toc_levels(doc, levels):
    for el in doc.element.body.iter():
        if el.tag.endswith('}instrText') and el.text and 'TOC' in el.text:
            el.text = el.text.replace('"1-3"', f'"{levels}"')


def build(lang):
    global LANG
    LANG = lang
    brand.set_lang(lang)
    data = json.load(open(os.path.join(BUILD, f'{CODE}.json' if lang == 'en' else f'{CODE}.fr.json'), encoding='utf8'))
    reports = {
        'en': {'status': 'Project status report', 'review': 'Management review input', 'kpis': 'KPI report', 'ncs': 'Nonconformity register', 'risks': 'Risk register', 'audits': 'Audit programme', 'documents': 'Master document list', 'racsi': 'RACSI matrix', 'steps': 'Execution log'},
        'fr': {'status': "Rapport d'avancement du projet", 'review': "Éléments d'entrée de la revue de direction", 'kpis': 'Rapport des KPI', 'ncs': 'Registre des non-conformités', 'risks': 'Registre des risques', 'audits': "Programme d'audit", 'documents': 'Liste maîtresse des documents', 'racsi': 'Matrice RACSI', 'steps': "Journal d'exécution"},
    }[lang]
    title = X('User Guide — One Full Real Run', 'Guide utilisateur — Un déroulement réel complet')
    doc = new_document(title, X('DynamicMS — User Guide (full real run)', 'DynamicMS — Guide utilisateur (déroulement réel complet)'))
    sec = doc.sections[0]
    for side in ('left_margin', 'right_margin'):
        setattr(sec, side, Cm(1.5))
    sec.top_margin = Cm(1.5); sec.bottom_margin = Cm(1.4)
    sec.header_distance = Cm(0.6); sec.footer_distance = Cm(0.6)
    for name, size, before, after in (('Heading 2', 14, 10, 4), ('Heading 3', 10.5, 6, 1)):
        st = doc.styles[name]; st.font.size = Pt(size)
        st.paragraph_format.space_before = Pt(before); st.paragraph_format.space_after = Pt(after)
    steps = sum(len(t['steps']) for ph in data['phases'] for m in ph['mps'] for t in m['tasks'])
    cover(doc, X('User Guide', 'Guide utilisateur'), X('One Full Real Run of DynamicMS', 'Un déroulement réel complet de DynamicMS'),
          X(f"Universal QMS (ISO 9001) · {data['org']['name']} · 12 end-to-end processes, {sum(len(ph['mps']) for ph in data['phases'])} macro processes, {steps} steps · PDCA from data sources to reports",
            f"SMQ universel (ISO 9001) · {data['org']['name']} · 12 processus de bout en bout, {sum(len(ph['mps']) for ph in data['phases'])} macro-processus, {steps} étapes · PDCA des sources de données aux rapports"),
          X('AI Value · DynamicMS 1.0 · October 2026', 'AI Value · DynamicMS 1.0 · octobre 2026'))
    toc(doc)
    _toc_levels(doc, '1-2')
    about(doc, data)
    page_break(doc)
    pdca_chapter(doc, data)
    page_break(doc)
    getting_started(doc, data)
    page_break(doc)
    run_chapter(doc, data)
    page_break(doc)
    review_chapter(doc, data, reports)
    page_break(doc)
    records_chapter(doc, data)
    faq(doc)
    path = os.path.join(OUT, f'DynamicMS_User_Guide_Full_Run_{lang.upper()}.docx')
    doc.save(path)
    print('saved', path)
    return path


if __name__ == '__main__':
    which = sys.argv[1] if len(sys.argv) > 1 else 'all'
    for lg in (['en', 'fr'] if which == 'all' else [which]):
        build(lg)
