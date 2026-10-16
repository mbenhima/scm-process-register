# Recompute the TOC page numbers of a docx from its rendered PDF; usage: tocfix.py <unpacked dir> <out.docx>
import sys, re, os, subprocess, pymupdf
d, out = sys.argv[1], sys.argv[2]
SK = '/root/.claude/skills/synced/6f9b19d0-8e41-4b5a-ae82-d9242f7010fd_9fadd5bf-976f-4aa6-8605-879e08043e59/docx/scripts'
P = re.compile(r'(<w:pStyle w:val="TOC\d"/></w:pPr>(?:(?!</w:p>).)*?<w:t(?: [^>]*)?>)([^<]*)(</w:t><w:tab/><w:t>)(\d+)(</w:t>)', re.S)
norm = lambda s: re.sub(r'\s+', ' ', s.replace('&amp;', '&')).strip()
for it in range(3):
    xml = open(f'{d}/word/document.xml', encoding='utf8').read()
    if os.path.exists(out): os.remove(out)
    subprocess.run(f'cd {d} && zip -qXr {os.path.abspath(out)} .', shell=True, check=True)
    subprocess.run(['python3', f'{SK}/office/soffice.py', '--headless', '--convert-to', 'pdf', '--outdir', os.path.dirname(os.path.abspath(out)), out], check=True, capture_output=True)
    pdf = pymupdf.open(out[:-5] + '.pdf')
    pages = [[norm(l) for l in p.get_text().split('\n')] for p in pdf]
    start = max(i for i, p in enumerate(pages) if any(re.search(r'\.{5,}\s*\d+$', l) for l in p)) + 1
    titles = [norm(m.group(2)) for m in P.finditer(xml)]
    # skip the TOC pages themselves: first page after the TOC containing the first title as a line
    found = {}; miss = []
    for ttl in titles:
        hit = None
        for i in range(start, len(pages)):
            if any(l == ttl or (l.startswith(ttl) and len(l) < len(ttl) + 4) for l in pages[i]) and not any(re.search(r'\s\d+$', l) and l.startswith(ttl) and len(l) > len(ttl) for l in pages[i]):
                hit = i + 1; break
        if hit: found[ttl] = str(hit)
        else: miss.append(ttl)
    new = P.sub(lambda m: m.group(1) + m.group(2) + m.group(3) + found.get(norm(m.group(2)), m.group(4)) + m.group(5), xml)
    print('pass', it, 'pages', pdf.page_count, 'missing', miss[:8])
    if new == xml: break
    open(f'{d}/word/document.xml', 'w', encoding='utf8').write(new)
