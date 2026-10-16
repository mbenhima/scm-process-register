"""Builds the application-screens deck (PowerPoint 16:9, POWERACT chart) in English or French:
large screenshots that cover every end-to-end process of the universal run HZ-UNI-QMS — the phase
screen, the screen of every macro process of the phase and one step with its recorded rows — then
the evidence screens. Screenshots: deliverables/build/case/<lang>/ (case shots and mpall-*.png).
Usage: python3 build_screens_deck.py en|fr"""
import json
import os
import sys

from PIL import Image
from pptx.util import Inches

import build_deck
from build_deck import Deck, C, BUILD, ROOT
import build_flow_guide as G
from build_case_deck import CaseDeck

LANG = sys.argv[1] if len(sys.argv) > 1 else 'en'
SHOTS = os.path.join(BUILD, 'case', LANG)
FLOW = os.path.join(BUILD, f'flow-{LANG}')
JPG = os.path.join(BUILD, 'case', f'jpg-{LANG}')


def X(en, fr):
    return fr if LANG == 'fr' else en


def cut(v, n):
    s = '' if v is None else str(v).replace('\n', ' ')
    return s if len(s) <= n else s[:n - 1].rstrip() + '…'


def jpg(path):
    """A 1800-pixel JPEG copy keeps the deck small without visible loss."""
    os.makedirs(JPG, exist_ok=True)
    out = os.path.join(JPG, os.path.basename(path).rsplit('.', 1)[0] + '.jpg')
    if not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(path):
        im = Image.open(path).convert('RGB')
        if im.width > 1800:
            im = im.resize((1800, round(im.height * 1800 / im.width)), Image.LANCZOS)
        im.save(out, 'JPEG', quality=84, optimize=True)
    return out


class ScreensDeck(CaseDeck):
    def screen(self, eyebrow, title, path, head=None, lines=None, cap=None):
        s = self.slide()
        self.eyebrow(s, eyebrow, y=0.4)
        self.title(s, title, y=0.7, size=22)
        if not os.path.exists(path):
            print('  missing', path)
        else:
            self.picture(s, jpg(path), 0.78, 1.45, 9.0, 5.37)
        if lines:
            self.card(s, 10.15, 1.45, 2.5, 5.37, fill='white')
            self.text(s, 10.32, 1.6, 2.2, 0.35, (head or '').upper(), 9, True, 'deep', spacing=100)
            self.text(s, 10.32, 1.95, 2.2, 4.8, lines, 10, False, 'dark')
        if cap:
            self.caption(s, cap, y=6.86 - 0.05, w=9.1)
        self.footer(s)
        return s


def main():
    G.LANG = LANG
    data = json.load(open(os.path.join(BUILD, 'HZ-UNI-QMS.json' if LANG == 'en' else 'HZ-UNI-QMS.fr.json'), encoding='utf8'))
    picks = {p['e2e']: p for p in json.load(open(os.path.join(BUILD, 'case', 'picks.json')))['picks']}
    t = build_deck.TXT[LANG]
    t['date'] = X('POWERACT Consulting · October 2026', 'POWERACT Consulting · octobre 2026')
    t['deck'] = X('DynamicMS — The Application Screens of a Full Run', 'DynamicMS — Les écrans de l’application sur un déroulement complet')
    t['sub'] = X('All twelve end-to-end processes and their 111 macro processes, captured on the universal case HZ-UNI-QMS — prepared for healthcare organizations',
                 'Les douze processus de bout en bout et leurs 111 macro-processus, capturés sur le cas universel HZ-UNI-QMS — préparé pour les établissements de santé')
    d = ScreensDeck(LANG)
    d.cover()
    phases = data['phases']
    feeds = G.feeds()

    # index
    s = d.slide(); d.section = X('Contents', 'Sommaire')
    d.eyebrow(s, 'DynamicMS'); d.title(s, X('Contents: one section per end-to-end process', 'Sommaire : une section par processus de bout en bout'), size=26)
    for i, ph in enumerate(phases):
        col, row = i % 2, i // 2
        x, y = 0.7 + col * 6.05, 1.9 + row * 0.78
        d.card(s, x, y, 5.85, 0.66)
        d.text(s, x + 0.2, y + 0.14, 1.0, 0.4, ph['id'], 13, True, 'deep', font='Cambria')
        d.text(s, x + 1.25, y + 0.14, 4.5, 0.4, f"{ph['name']} · {len(ph['mps'])} MP", 13, False, 'dark')
    d.footer(s)

    d.section = X('Overview', 'Vue d’ensemble')
    d.screen(X('Overview', 'Vue d’ensemble'), X('Project home', 'Accueil du projet'), os.path.join(SHOTS, 'home.png'),
             X('On this screen', 'Sur cet écran'), [X('• Progress by phase', '• Avancement par phase'), X('• KPI trend against target', '• Tendance des KPI face à la cible'), X('• Monthly completed steps', '• Étapes terminées par mois'), X('• Risk heatmap', '• Carte de chaleur des risques')])
    d.screen(X('Overview', 'Vue d’ensemble'), X('Lifecycle: the twelve phases', 'Cycle de vie : les douze phases'), os.path.join(SHOTS, 'lifecycle.png'),
             X('On this screen', 'Sur cet écran'), [X('• One card per end-to-end process', '• Une carte par processus de bout en bout'), X('• Progress and gate status', '• Avancement et état du jalon'), X('• Open a card to run its macro processes', '• Ouvrir une carte pour dérouler ses macro-processus')])

    for i, ph in enumerate(phases):
        e = ph['id']; sec = f"{e} — {ph['name']}"
        d.divider(sec, f"{ph['goals']}. {len(ph['mps'])} " + X('macro processes', 'macro-processus') + ' · ' +
                  str(sum(len(t_['steps']) for m in ph['mps'] for t_ in m['tasks'])) + ' ' + X('steps', 'étapes'))
        d.section = sec
        gate = ph.get('gate') or {}
        d.screen(f"{e} · {X('Phase', 'Phase')} {i + 1:02d}", X(f"{ph['name']}: macro processes and gate", f"{ph['name']} : macro-processus et jalon"),
                 os.path.join(SHOTS, f'phase-{e}.png'), X('Phase', 'Phase'),
                 [X('Delivers: ', 'Produit : ') + cut(feeds[e][0], 120), '', X('Feeds: ', 'Alimente : ') + cut(feeds[e][1], 110), '',
                  X('Gate: ', 'Jalon : ') + cut(gate.get('name', '—'), 60) + (f" — {ph['decision']}" if ph.get('decision') else X(' — active', ' — en cours'))],
                 X(f'Lifecycle › {e}', f'Cycle de vie › {e}'))
        for m in ph['mps']:
            n_steps = sum(len(t_['steps']) for t_ in m['tasks'])
            lines = [f"{X('Owner', 'Pilote')}: {m['owner']}", f"{len(m['tasks'])} {X('tasks', 'tâches')} · {n_steps} {X('steps', 'étapes')}", '']
            lines += [f"{t_['id'].split('.')[-1]}  {cut(t_['name'], 52)}" for t_ in m['tasks'][:6]]
            d.screen(f"{e} · {m['id']} ({m['code']})", cut(m['name'], 80), os.path.join(SHOTS, f"mpall-{m['id']}.png"),
                     X('Macro process', 'Macro-processus'), lines, cut(m['goal'], 150))
        pk = picks[e]
        st = next(x for m in ph['mps'] for t_ in m['tasks'] for x in t_['steps'] if x['id'] == pk['step'])
        tab = next(f for f in st['type_'] if f.get('columns'))
        d.screen(f"{e} · {X('Step', 'Étape')} {st['id']}", cut(st['name'], 80), os.path.join(SHOTS, f'step-{e}.png'),
                 X('Recorded rows', 'Lignes saisies'), [cut(tab['field'], 60), ''] + [f"• {cut(r[0], 40)}" for r in (tab.get('rows') or [])[:8]],
                 f"{st['role']} · {st['form']}")

    d.divider(X('Evidence and reporting', 'Preuves et reporting'), X('Records, measurement, documents, reports and governed AI.', 'Enregistrements, mesure, documents, rapports et IA gouvernée.'))
    d.section = X('Evidence', 'Preuves')
    for name, title, base in (('nc', X('Nonconformity: from detection to lessons learned', 'Non-conformité : de la détection au retour d’expérience'), SHOTS),
                              ('audit', X('Audit with findings and conclusion', 'Audit avec constats et conclusion'), SHOTS),
                              ('kpis', X('KPIs against their targets', 'KPI face à leurs cibles'), SHOTS),
                              ('risks', X('Risks and opportunities', 'Risques et opportunités'), SHOTS),
                              ('racsi', X('RACSI matrix', 'Matrice RACSI'), SHOTS),
                              ('documents', X('Controlled documents generated from the data', 'Documents maîtrisés générés à partir des données'), SHOTS),
                              ('reports', X('Reports in PDF, Word, Excel, PowerPoint and CSV', 'Rapports en PDF, Word, Excel, PowerPoint et CSV'), SHOTS),
                              ('ai-proposal', X('AI proposal reviewed item by item', 'Proposition de l’IA revue élément par élément'), FLOW),
                              ('ai-usecase', X('AI use case: specification, activation, usage log', 'Cas d’usage IA : spécification, activation, journal'), FLOW)):
        d.screen(X('Evidence', 'Preuves'), title, os.path.join(base, f'{name}.png'))

    out = os.path.join(ROOT, 'deliverables', f'DynamicMS_Application_Screens_{LANG.upper()}.pptx')
    d.prs.save(out)
    print('saved', out, d.n, 'slides', round(os.path.getsize(out) / 1e6, 1), 'MB')


if __name__ == '__main__':
    main()
