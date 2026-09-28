#!/usr/bin/env python3
"""Merge tools/i18n/{fr,ar}/*.txt (numbered to match strings.en.txt) into
server/seed/catalog/i18n.json  ->  { "<English>": {"fr": "...", "ar": "..."} }.
Strings produced by known templates (e.g. "Run all tasks of X ...") are
translated by rule. Prints any string left untranslated."""
import glob, json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
I = os.path.join(ROOT, 'tools', 'i18n')

en = {}
for line in open(os.path.join(I, 'strings.en.txt'), encoding='utf-8'):
    n, t = line.rstrip('\n').split('\t', 1)
    en[int(n)] = t

def load(lang):
    out = {}
    for f in sorted(glob.glob(os.path.join(I, lang, '*.txt'))):
        for line in open(f, encoding='utf-8'):
            line = line.rstrip('\n')
            if not line.strip():
                continue
            n, t = line.split('\t', 1)
            out[int(n)] = t.strip()
    return out

fr, ar = load('fr'), load('ar')

TEMPLATES = [
    (re.compile(r'^Run all tasks of (\w+) and download its outputs\.$'),
     'Exécuter toutes les tâches de {0} et télécharger ses sorties.', 'تنفيذ جميع مهام {0} وتنزيل مخرجاتها.'),
    (re.compile(r'^Review and act on (\w+) outputs\.$'),
     'Examiner les sorties de {0} et agir.', 'مراجعة مخرجات {0} واتخاذ الإجراء.'),
    (re.compile(r'^View (\w+) outputs\.$'),
     'Consulter les sorties de {0}.', 'عرض مخرجات {0}.'),
    (re.compile(r'^([\w-]+) active for the tenant$'),
     '{0} actif pour le locataire', '{0} مفعّل للمستأجر'),
]

result, missing = {}, []
for n, t in en.items():
    f, a = fr.get(n), ar.get(n)
    if f is None or a is None:
        for rx, tf, ta in TEMPLATES:
            m = rx.match(t)
            if m:
                f = f or tf.format(*m.groups())
                a = a or ta.format(*m.groups())
                break
    if f is None or a is None:
        missing.append((n, t, f is None, a is None))
        continue
    result[t] = {'fr': f, 'ar': a}

with open(os.path.join(ROOT, 'server', 'seed', 'catalog', 'i18n.json'), 'w', encoding='utf-8') as fh:
    json.dump(result, fh, ensure_ascii=False, indent=0)
print('translated', len(result), 'of', len(en), '; missing', len(missing))
for m in missing[:60]:
    print('  MISSING', m)
sys.exit(1 if missing else 0)
