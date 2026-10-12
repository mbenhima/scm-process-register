"""Post-processing of decks written by pptxgenjs, so PowerPoint opens them without "repair":
- every shape of a slide gets a unique id (pptxgenjs reuses the ids of earlier shapes for tables);
- 2D charts keep only the two axes they declare (pptxgenjs adds a series-axis id that it declares only in 3D charts);
- the package is rewritten without folder entries, [Content_Types].xml first.
Usage: python3 fix-pptx.py deck1.pptx [deck2.pptx ...]"""
import re, sys, zipfile, os

def fix_slide(xml):
    n = [1]
    def renum(m):
        n[0] += 1
        return f'<p:cNvPr id="{n[0]}"'
    return re.sub(r'<p:cNvPr id="\d+"', renum, xml)

def fix_chart(xml):
    declared = set(re.findall(r'<c:(?:catAx|valAx|dateAx|serAx)>\s*<c:axId val="(\d+)"', xml))
    def keep(m):
        return m.group(0) if m.group(1) in declared else ''
    return re.sub(r'<c:axId val="(\d+)"/>', keep, xml)

for path in sys.argv[1:]:
    src = zipfile.ZipFile(path)
    names = [n for n in src.namelist() if not n.endswith('/')]
    if any('spid=' in src.read(n).decode('utf8', 'ignore') for n in names if n.startswith('ppt/slides/slide')):
        sys.exit(f'{path}: slides reference shape ids (animations); not renumbered')
    names.sort(key=lambda n: (n != '[Content_Types].xml', n != '_rels/.rels', n))
    tmp = path + '.tmp'; fixed = {'slides': 0, 'charts': 0}
    with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as out:
        for n in names:
            data = src.read(n)
            if re.match(r'ppt/(slides|slideLayouts|slideMasters|notesSlides)/[^/]+\.xml$', n):
                new = fix_slide(data.decode('utf8')).encode('utf8'); fixed['slides'] += new != data; data = new
            elif re.match(r'ppt/charts/chart\d+\.xml$', n):
                new = fix_chart(data.decode('utf8')).encode('utf8'); fixed['charts'] += new != data; data = new
            out.writestr(zipfile.ZipInfo(n, date_time=(2026, 1, 1, 0, 0, 0)), data, compress_type=zipfile.ZIP_DEFLATED)
    src.close(); os.replace(tmp, path)
    print(path, 'parts changed:', fixed)
