import sys, re, docx, pymupdf as fitz
from docx.oxml.ns import qn
src, pdf, out = sys.argv[1:4]
d = docx.Document(src)
P = d.paragraphs
heads = [p.text.strip() for p in P if p.style.name in ('Heading 1', 'Heading 2') and p.text.strip() != 'Table of Contents']
doc = fitz.open(pdf)
pages = [pg.get_text() for pg in doc]
norm = lambda s: re.sub(r'\s+', ' ', s).strip()
# locate each heading in order, skipping the TOC pages
start = 0
for i, t in enumerate(pages):
    if '1. Introduction' in t and 'Table of Contents' not in t:
        start = i; break
where, cur = {}, start
for h in heads:
    for i in range(cur, len(pages)):
        if norm(h)[:60] in norm(pages[i]):
            where[h] = i + 1; cur = i; break
changed = missing = 0
for p in P:
    if p.style.name == 'Normal' and '\t' in p.text:
        title = p.text.split('\t')[0].strip()
        if title not in where:
            k=[h for h in where if h.split(' ')[0]==title.split(' ')[0] and re.match(r'^\d+\.\d+ ',h)]
            if k: title_key=k[0]
            else: title_key=title
        else: title_key=title
        if title_key in where:
            title=title_key
            ts = list(p._p.iter(qn('w:t')))
            num = ts[-1]
            if re.fullmatch(r'\d+', (num.text or '').strip()):
                if num.text.strip() != str(where[title]): changed += 1
                num.text = str(where[title])
        elif re.match(r'^(\d|Appendix)', title):
            missing += 1; print('not found', title)
d.save(out)
print('toc updated', changed, 'missing', missing)
