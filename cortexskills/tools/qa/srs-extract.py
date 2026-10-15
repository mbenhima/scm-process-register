# Extracts every requirement of the Standard Application SRS (Word) with its section: id, text, section number and title.
# Usage: python3 srs-extract.py <srs.docx> <out.json>
import sys, re, json, docx
doc = docx.Document(sys.argv[1]); out = []; section = ''
RID = re.compile(r'^((?:FR|NFR)-[A-Z]{2,4}(?:-[A-Z0-9]{2,6})?-\d{2}[a-z]?)\s*:\s*(.+)$', re.S)
def paras(d):
    for p in d.paragraphs: yield p
    for t in d.tables:
        for row in t.rows:
            for c in row.cells:
                for p in c.paragraphs: yield p
seen = set()
for p in doc.paragraphs:
    txt = p.text.strip(); st = (p.style.name or '').lower()
    if st.startswith('heading') and re.match(r'^\d+(\.\d+)*\s', txt): section = txt; continue
    m = RID.match(txt)
    if m and m.group(1) not in seen: seen.add(m.group(1)); out.append({'id': m.group(1), 'text': m.group(2).strip(), 'section': section})
for t in doc.tables:
    for row in t.rows:
        cells = [c.text.strip() for c in row.cells]
        if cells and re.match(r'^(FR|NFR)-[A-Z]', cells[0]) and cells[0] not in seen and len(cells) > 1:
            seen.add(cells[0]); out.append({'id': cells[0], 'text': cells[1], 'section': 'table'})
json.dump(out, open(sys.argv[2], 'w'), ensure_ascii=False, indent=0)
print(len(out), 'requirements')
