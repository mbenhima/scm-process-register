"""Sets the page numbers of the SRS's manual table of contents from its PDF rendering.
usage: python3 srs_toc_pages.py <file.docx> <file.pdf>"""
import sys
import docx
import pymupdf
from docx.oxml.ns import qn

DOCX, PDF = sys.argv[1], sys.argv[2]
pages = [[l.strip() for l in p.get_text().split('\n')] for p in pymupdf.open(PDF)]
d = docx.Document(DOCX)
changed = missing = 0
for p in d.paragraphs:
    if p.style.name != 'Normal' or '\t' not in p.text:
        continue
    title, num = p.text.rsplit('\t', 1)
    if not num.strip().isdigit():
        continue
    found = next((i + 1 for i, lines in enumerate(pages) if i > 2 and title.strip() in lines), None)
    if found is None:  # a heading wrapped over two lines
        found = next((i + 1 for i, lines in enumerate(pages) if i > 2 and title.strip() in ' '.join(lines)), None)
    if found is None:
        missing += 1; print('not found:', title); continue
    if str(found) != num.strip():
        t = p._p.findall(qn('w:r'))[-1].findall(qn('w:t'))[-1]
        t.text = str(found); changed += 1
d.save(DOCX)
print(f'{changed} page numbers updated, {missing} not found')
