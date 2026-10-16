# WordprocessingML snippets in the exact style of the POWERACT documents (copied from their XML).
from xml.sax.saxutils import escape as _e

F = '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/>'
B4 = lambda c: ''.join(f'<w:{s} w:val="single" w:sz="4" w:color="{c}" w:space="0"/>' for s in ('top', 'left', 'bottom', 'right'))


def t(s):
    return f'<w:t xml:space="preserve">{_e(s)}</w:t>'


def run(s, bold=False, italic=False, color='58595B', sz=None):
    b = '<w:b/>' if bold else '<w:b w:val="0"/>'
    i = '<w:i/>' if italic else '<w:i w:val="0"/>'
    z = '<w:sz w:val="%s"/>' % sz if sz else ''
    return f'<w:r><w:rPr>{F}{b}{i}<w:color w:val="{color}"/>{z}</w:rPr>{t(s)}</w:r>'


def runs(parts, **kw):
    """parts: str or list of (text, bold) pairs."""
    if isinstance(parts, str):
        return run(parts, **kw)
    out = ''
    for txt, b in parts:
        out += run(txt, bold=b, **{**kw, 'color': '3A3A3C' if b else kw.get('color', '58595B')})
    return out


def label(s):
    return (f'<w:p><w:pPr><w:keepNext/><w:spacing w:before="80" w:after="40" w:line="240" w:lineRule="auto"/></w:pPr>'
            f'<w:r><w:rPr>{F}<w:b/><w:color w:val="E07B00"/><w:spacing w:val="24"/><w:sz w:val="18"/></w:rPr>{t(s)}</w:r></w:p>')


def h(level, s):
    return f'<w:p><w:pPr><w:pStyle w:val="Heading{level}"/></w:pPr><w:r>{t(s)}</w:r></w:p>'


def para(parts):
    return f'<w:p><w:pPr><w:spacing w:after="120"/><w:jc w:val="both"/></w:pPr>{runs(parts)}</w:p>'


def sub(s):
    return (f'<w:p><w:pPr><w:keepNext/><w:spacing w:before="160" w:after="60"/></w:pPr>'
            f'<w:r><w:rPr>{F}<w:b/><w:i w:val="0"/><w:color w:val="3A3A3C"/><w:sz w:val="23"/></w:rPr>{t(s)}</w:r></w:p>')


def bullet(parts):
    return f'<w:p><w:pPr><w:pStyle w:val="ListBullet"/><w:spacing w:after="80"/><w:jc w:val="both"/></w:pPr>{runs(parts)}</w:p>'


def caption(s):
    return (f'<w:p><w:pPr><w:spacing w:before="0" w:after="80" w:line="240" w:lineRule="auto"/></w:pPr></w:p>'
            f'<w:p><w:pPr><w:spacing w:before="0" w:after="160"/><w:jc w:val="left"/></w:pPr>{run(s, italic=True, sz=19)}</w:p>')


def pagebreak():
    return '<w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:br w:type="page"/></w:r></w:p>'


def spacer():
    return '<w:p><w:pPr><w:spacing w:after="80"/></w:pPr></w:p>'


def _cell(w, fill, txt, bold, color):
    ps = txt if isinstance(txt, list) else [txt]
    body = ''.join(f'<w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r/>{run(p, bold=bold, color=color, sz=19)}</w:p>' for p in ps)
    return f'<w:tc><w:tcPr><w:tcW w:type="dxa" w:w="{w}"/><w:tcBorders>{B4("E3E3E4")}</w:tcBorders><w:shd w:val="clear" w:color="auto" w:fill="{fill}"/></w:tcPr>{body}</w:tc>'


def table(headers, rows, widths, first_bold=True):
    assert sum(widths) == 9746, sum(widths)
    x = ('<w:tbl><w:tblPr><w:tblW w:w="9746" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="50" w:type="dxa"/>'
         '<w:left w:w="90" w:type="dxa"/><w:bottom w:w="50" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar>'
         '<w:tblLook w:firstColumn="1" w:firstRow="1" w:lastColumn="0" w:lastRow="0" w:noHBand="0" w:noVBand="1" w:val="04A0"/></w:tblPr><w:tblGrid>'
         + ''.join(f'<w:gridCol w:w="{w}"/>' for w in widths) + '</w:tblGrid>')
    if headers:
        x += '<w:tr><w:trPr><w:cantSplit/><w:tblHeader/></w:trPr>' + ''.join(_cell(w, 'F8931D', hd, True, 'FFFFFF') for w, hd in zip(widths, headers)) + '</w:tr>'
    for i, r in enumerate(rows):
        fill = 'FFFFFF' if i % 2 == 0 else 'F2F2F3'
        x += '<w:tr><w:trPr><w:cantSplit/></w:trPr>' + ''.join(
            _cell(w, fill, c, first_bold and j == 0, '3A3A3C' if first_bold and j == 0 else '58595B') for j, (w, c) in enumerate(zip(widths, r))) + '</w:tr>'
    return x + '</w:tbl>'


def callout(title, body):
    return ('<w:tbl><w:tblPr><w:tblW w:w="9746" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="120" w:type="dxa"/><w:left w:w="200" w:type="dxa"/>'
            '<w:bottom w:w="120" w:type="dxa"/><w:right w:w="200" w:type="dxa"/></w:tblCellMar><w:tblLook w:firstColumn="1" w:firstRow="1" w:lastColumn="0" w:lastRow="0" w:noHBand="0" w:noVBand="1" w:val="04A0"/></w:tblPr>'
            '<w:tblGrid><w:gridCol w:w="9746"/></w:tblGrid><w:tr><w:trPr><w:cantSplit/></w:trPr><w:tc><w:tcPr><w:tcW w:type="dxa" w:w="9746"/><w:tcBorders>'
            '<w:top w:val="single" w:sz="4" w:color="FDEEDA" w:space="0"/><w:left w:val="single" w:sz="24" w:color="F8931D" w:space="0"/><w:bottom w:val="single" w:sz="4" w:color="FDEEDA" w:space="0"/>'
            '<w:right w:val="single" w:sz="4" w:color="FDEEDA" w:space="0"/></w:tcBorders><w:shd w:val="clear" w:color="auto" w:fill="FDEEDA"/></w:tcPr>'
            f'<w:p><w:pPr><w:spacing w:after="60" w:line="264" w:lineRule="auto"/></w:pPr>{run(title, bold=True, color="E07B00", sz=22)}</w:p>'
            f'<w:p><w:pPr><w:spacing w:after="0" w:line="276" w:lineRule="auto"/><w:jc w:val="both"/></w:pPr>{run(body, color="3A3A3C", sz=22)}</w:p>'
            '</w:tc></w:tr></w:tbl>' + spacer())


def toc(level, s, page='0'):
    return f'<w:p><w:pPr><w:pStyle w:val="TOC{level}"/></w:pPr><w:r>{t(s)}<w:tab/><w:t>{page}</w:t></w:r></w:p>'


class Doc:
    def __init__(self, path):
        self.path = path
        self.x = open(path, encoding='utf8').read()

    def sub1(self, old, new, count=1):
        n = self.x.count(old)
        assert n == count, f'{n} occurrences of {old[:80]!r}'
        self.x = self.x.replace(old, new)

    def insert_before(self, anchor, xml, which='p'):
        """Insert xml before the paragraph (or table, which='tbl') that contains anchor (unique)."""
        assert self.x.count(anchor) == 1, f'anchor {anchor[:60]!r} x{self.x.count(anchor)}'
        i = self.x.find(anchor)
        s = self.x.rfind(f'<w:{which}>', 0, i)
        self.x = self.x[:s] + xml + self.x[s:]

    def insert_after(self, anchor, xml, which='p'):
        assert self.x.count(anchor) == 1, f'anchor {anchor[:60]!r} x{self.x.count(anchor)}'
        i = self.x.find(anchor)
        e = self.x.find(f'</w:{which}>', i) + len(f'</w:{which}>')
        self.x = self.x[:e] + xml + self.x[e:]

    def add_row(self, anchor_cell_text, cells):
        """Append a row after the row containing anchor, copying its formatting and flipping the band colour."""
        i = self.x.find(anchor_cell_text)
        assert i > 0 and self.x.count(anchor_cell_text) == 1, anchor_cell_text
        s = self.x.rfind('<w:tr>', 0, i); e = self.x.find('</w:tr>', i) + 7
        row = self.x[s:e]
        import re
        fill = re.search(r'w:fill="(FFFFFF|F2F2F3)"', row).group(1)
        new = row.replace(f'w:fill="{fill}"', 'w:fill="{}"'.format('F2F2F3' if fill == 'FFFFFF' else 'FFFFFF'))
        texts = re.findall(r'<w:t(?: [^>]*)?>[^<]*</w:t>', new)
        # one text run per cell expected
        tcs = re.findall(r'<w:tc>.*?</w:tc>', new, flags=re.S)
        assert len(tcs) == len(cells), (len(tcs), len(cells))
        out = new
        for tc, c in zip(tcs, cells):
            ts = re.findall(r'<w:t(?: [^>]*)?>[^<]*</w:t>', tc)
            nt = tc.replace(ts[0], t(c), 1)
            for extra in ts[1:]:
                nt = nt.replace(extra, '<w:t></w:t>', 1)
            out = out.replace(tc, nt, 1)
        self.x = self.x[:e] + out + self.x[e:]

    def add_toc(self, entries, before=None):
        """Insert TOC entries before the TOC entry titled `before`, or at the end of the TOC (the field end stays last)."""
        if before:
            i = self.x.find('>' + _e(before) + '</w:t><w:tab/>'); assert i > 0, before
            s = self.x.rfind('<w:p>', 0, i)
            self.x = self.x[:s] + ''.join(toc(*e) for e in entries) + self.x[s:]
            return
        end = '<w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>'
        i = self.x.find(end)
        s = self.x.rfind('<w:p>', 0, i)
        last = self.x[s:i + len(end)]
        bare = last.replace('<w:r><w:fldChar w:fldCharType="end"/></w:r>', '')
        new = ''.join(toc(*e) for e in entries)
        new = new[:-len('</w:p>')] + '<w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>'
        self.x = self.x[:s] + bare + new + self.x[i + len(end):]

    def set_toc_pages(self, pages):
        import re
        def fix(m):
            title = re.sub(r'<[^>]+>', '', m.group(2))
            return m.group(1) + m.group(2) + '<w:tab/><w:t>' + pages.get(title, m.group(4)) + '</w:t>'
        self.x = re.sub(r'(<w:pStyle w:val="TOC\d"/></w:pPr><w:r>)(<w:t(?: [^>]*)?>[^<]*</w:t>)(<w:tab/><w:t>)(\d+)</w:t>',
                        lambda m: m.group(1) + m.group(2) + m.group(3) + pages.get(re.sub(r'<[^>]+>', '', m.group(2)), m.group(4)) + '</w:t>', self.x)

    def save(self):
        open(self.path, 'w', encoding='utf8').write(self.x)
