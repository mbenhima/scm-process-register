"""Measures the task tables of a rendered case-study deck (PDF) and caps the rows of the first slide of every
process whose table runs into the footer; writes clinic-flow-fit-<lang>.json for build-clinic-flow-deck.cjs.
Usage: python3 fit-clinic-flow-deck.py <deck.pdf> <deck.outline.json> <lang>"""
import sys, json, os, re, pymupdf
pdf, outline, lang = sys.argv[1:4]
F = os.path.join(os.path.dirname(os.path.abspath(__file__)), f'clinic-flow-fit-{lang}.json')
fit = json.load(open(F)) if os.path.exists(F) else {}
d = pymupdf.open(pdf); o = json.load(open(outline)); changed = 0
for i, p in enumerate(d):
    title = o[i]['title']
    # Continuation slide with the process page under a short table: the measured bottom of the table.
    if title.endswith(' (2)') and not any(o[j]['title'] == title for j in range(i)):
        pics = [x['bbox'] for x in p.get_image_info() if x['bbox'][2] / 72 < 9.2 and x['bbox'][1] / 72 > 1.6 and x['width'] > 800]
        if pics:
            top = min(r[1] for r in pics) / 72
            tb = [b[3] / 72 for b in p.get_text('blocks') if b[2] / 72 < 9.2 and 1.4 < b[1] / 72 < 6.9 and b[4].strip() and not b[4].strip().startswith(('The page of', 'La page de'))]
            want = round(max(tb) + 0.1, 2)
            if abs(fit.get(title, 0) - want) > 0.05: fit[title] = want; changed += 1 if top - max(tb) < 0.2 else 0
    if not re.match(r'^(E2E|HCPR)-[\w-]+$', title): continue
    rows = [b for b in p.get_text('blocks') if b[2] / 72 < 9.2 and b[4].strip() and re.match(r'UFT-', b[4].strip())]
    bottom = max(b[3] / 72 for b in p.get_text('blocks') if b[2] / 72 < 9.2 and b[1] / 72 < 6.95 and b[4].strip())
    if bottom > 6.78 and rows:
        fit[title] = len(rows) - 1; changed += 1; print('cap', title, len(rows) - 1, round(bottom, 2))
json.dump(fit, open(F, 'w'), indent=1); print('changed', changed)
