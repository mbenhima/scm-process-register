"""Shared Word styling for the deliverables (brand guide: Times New Roman, orange
headings, orange table headers, A4 with 0.75 in margins, TOC, page X of Y)."""
import os
from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor, Cm, Emu

ORANGE = 'F8931D'
DEEP = 'E07B00'
TINT = 'FDEEDA'
DARK = '3A3A3C'
INK = '58595B'
MEDIUM = '808184'
LIGHT = 'F2F2F3'
LINE = 'E3E3E4'
ST = ['F4C7C3', 'FBE0B5', 'FFF3B0', 'D9EAD3', 'B6D7A8']
FONT = 'Times New Roman'
HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, '..', '..', 'deliverables', 'assets', 'poweract-logo.png')


def rgb(h):
    return RGBColor.from_string(h)


def _border(el, tag, sz=6, color=LINE, val='single'):
    b = OxmlElement(tag)
    b.set(qn('w:val'), val)
    b.set(qn('w:sz'), str(sz))
    b.set(qn('w:space'), '4')
    b.set(qn('w:color'), color)
    return b


def new_document(title, header_text):
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Emu(7560310), Emu(10692130)  # A4
    for side in ('left_margin', 'right_margin', 'top_margin', 'bottom_margin'):
        setattr(sec, side, Emu(685800))  # 0.75 in
    st = doc.styles
    normal = st['Normal']
    normal.font.name = FONT
    normal.font.size = Pt(12)
    normal.font.color.rgb = rgb(INK)
    normal.element.rPr.rFonts.set(qn('w:eastAsia'), FONT)
    normal.element.rPr.rFonts.set(qn('w:cs'), FONT)
    pf = normal.paragraph_format
    pf.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    pf.line_spacing = 1.15
    pf.space_after = Pt(6)
    for name, size, color, before, after in (('Heading 1', 17, DEEP, 18, 8), ('Heading 2', 13.5, DARK, 14, 6), ('Heading 3', 12, DEEP, 10, 4)):
        s = st[name]
        s.font.name = FONT
        s.font.size = Pt(size)
        s.font.bold = True
        s.font.italic = False
        s.font.color.rgb = rgb(color)
        rpr = s.element.get_or_add_rPr()
        rf = rpr.find(qn('w:rFonts'))
        if rf is None:
            rf = OxmlElement('w:rFonts'); rpr.append(rf)
        for a in ('w:ascii', 'w:hAnsi', 'w:cs', 'w:eastAsia'):
            rf.set(qn(a), FONT)
        for a in ('w:asciiTheme', 'w:hAnsiTheme', 'w:eastAsiaTheme', 'w:cstheme'):
            if rf.get(qn(a)) is not None:
                del rf.attrib[qn(a)]
        s.paragraph_format.space_before = Pt(before)
        s.paragraph_format.space_after = Pt(after)
        s.paragraph_format.keep_with_next = True
        s.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        if name == 'Heading 1':
            ppr = s.element.get_or_add_pPr()
            pbdr = OxmlElement('w:pBdr')
            pbdr.append(_border(None, 'w:bottom', 8, DEEP))
            ppr.append(pbdr)
    doc.core_properties.title = title
    doc.core_properties.author = 'POWERACT Consulting'
    # Header and footer
    hp = sec.header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r = hp.add_run(header_text)
    r.font.size = Pt(9); r.font.color.rgb = rgb(MEDIUM)
    fp = sec.footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = fp.add_run('POWERACT Consulting  ·  Page ')
    r.font.size = Pt(9); r.font.color.rgb = rgb(MEDIUM)
    _field(fp, 'PAGE')
    r = fp.add_run(' of ')
    r.font.size = Pt(9); r.font.color.rgb = rgb(MEDIUM)
    _field(fp, 'NUMPAGES')
    sec.different_first_page_header_footer = True
    return doc


def _field(p, code):
    r = p.add_run()
    r.font.size = Pt(9); r.font.color.rgb = rgb(MEDIUM)
    b = OxmlElement('w:fldChar'); b.set(qn('w:fldCharType'), 'begin'); r._r.append(b)
    r2 = p.add_run(); r2.font.size = Pt(9)
    t = OxmlElement('w:instrText'); t.set(qn('xml:space'), 'preserve'); t.text = f' {code} '; r2._r.append(t)
    r3 = p.add_run(); r3.font.size = Pt(9)
    s = OxmlElement('w:fldChar'); s.set(qn('w:fldCharType'), 'separate'); r3._r.append(s)
    r4 = p.add_run('1'); r4.font.size = Pt(9); r4.font.color.rgb = rgb(MEDIUM)
    r5 = p.add_run()
    e = OxmlElement('w:fldChar'); e.set(qn('w:fldCharType'), 'end'); r5._r.append(e)


def cover(doc, eyebrow, title, subtitle, meta):
    for _ in range(3):
        doc.add_paragraph()
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if os.path.exists(LOGO):
        p.add_run().add_picture(LOGO, width=Cm(6))
    else:
        r = p.add_run('POWERACT'); r.bold = True; r.font.size = Pt(30); r.font.color.rgb = rgb(DARK)
        p2 = doc.add_paragraph(); p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p2.add_run('C O N S U L T I N G'); r.font.size = Pt(11); r.bold = True; r.font.color.rgb = rgb(DEEP)
    for _ in range(4):
        doc.add_paragraph()
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(eyebrow.upper()); r.bold = True; r.font.size = Pt(11); r.font.color.rgb = rgb(DEEP)
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(title); r.bold = True; r.font.size = Pt(28); r.font.color.rgb = rgb(DARK)
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(subtitle); r.font.size = Pt(14); r.font.color.rgb = rgb(INK)
    for _ in range(6):
        doc.add_paragraph()
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(meta); r.font.size = Pt(10); r.font.color.rgb = rgb(MEDIUM)
    page_break(doc)


def toc(doc, label='Table of Contents'):
    h = doc.add_paragraph(); r = h.add_run(label); r.bold = True; r.font.size = Pt(17); r.font.color.rgb = rgb(DEEP)
    p = doc.add_paragraph()
    r = p.add_run()
    b = OxmlElement('w:fldChar'); b.set(qn('w:fldCharType'), 'begin'); b.set(qn('w:dirty'), 'true'); r._r.append(b)
    r2 = p.add_run()
    t = OxmlElement('w:instrText'); t.set(qn('xml:space'), 'preserve'); t.text = ' TOC \\o "1-3" \\h \\z \\u '; r2._r.append(t)
    r3 = p.add_run()
    s = OxmlElement('w:fldChar'); s.set(qn('w:fldCharType'), 'separate'); r3._r.append(s)
    p.add_run('Right-click and choose Update Field to refresh the table of contents.')
    r5 = p.add_run()
    e = OxmlElement('w:fldChar'); e.set(qn('w:fldCharType'), 'end'); r5._r.append(e)
    page_break(doc)


def page_break(doc):
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


def para(doc, text, bold_lead=None, size=None, color=None, italic=False, align=None, after=None):
    p = doc.add_paragraph()
    if bold_lead:
        r = p.add_run(bold_lead); r.bold = True; r.font.color.rgb = rgb(DARK)
        if size: r.font.size = Pt(size)
    r = p.add_run(text)
    if size: r.font.size = Pt(size)
    if color: r.font.color.rgb = rgb(color)
    r.italic = italic
    if align == 'left': p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    if after is not None: p.paragraph_format.space_after = Pt(after)
    return p


def bullets(doc, items, size=None):
    for it in items:
        p = doc.add_paragraph(style='List Bullet')
        if isinstance(it, tuple):
            r = p.add_run(it[0]); r.bold = True; r.font.color.rgb = rgb(DARK)
            r2 = p.add_run(it[1])
            if size: r.font.size = Pt(size); r2.font.size = Pt(size)
        else:
            r = p.add_run(it)
            if size: r.font.size = Pt(size)
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_after = Pt(2)


def numbered(doc, items):
    for it in items:
        p = doc.add_paragraph(style='List Number')
        p.add_run(it)
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_after = Pt(2)


def _cell_fill(cell, hexcolor):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd'); shd.set(qn('w:val'), 'clear'); shd.set(qn('w:color'), 'auto'); shd.set(qn('w:fill'), hexcolor)
    tcPr.append(shd)


def _cell_margins(table, top=50, bottom=50, left=80, right=80):
    tblPr = table._tbl.tblPr
    mar = OxmlElement('w:tblCellMar')
    for k, v in (('top', top), ('left', left), ('bottom', bottom), ('right', right)):
        e = OxmlElement(f'w:{k}'); e.set(qn('w:w'), str(v)); e.set(qn('w:type'), 'dxa'); mar.append(e)
    tblPr.append(mar)


def table(doc, headers, rows, widths_cm, size=9.5, status_col=None, status_fn=None, bold_first=False):
    """Orange header with bold white text, alternating white / grey-light rows,
    thin grey-line borders; column widths sum to the usable width (18 cm)."""
    t = doc.add_table(rows=1, cols=len(headers))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    tblPr = t._tbl.tblPr
    borders = OxmlElement('w:tblBorders')
    for side in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        borders.append(_border(None, f'w:{side}', 4, LINE))
    tblPr.append(borders)
    lay = OxmlElement('w:tblLayout'); lay.set(qn('w:type'), 'fixed'); tblPr.append(lay)
    tw = tblPr.find(qn('w:tblW'))
    if tw is None:
        tw = OxmlElement('w:tblW'); tblPr.append(tw)
    tw.set(qn('w:w'), str(int(sum(widths_cm) * 567))); tw.set(qn('w:type'), 'dxa')
    for gc, wcm in zip(t._tbl.tblGrid.findall(qn('w:gridCol')), widths_cm):
        gc.set(qn('w:w'), str(int(wcm * 567)))
    _cell_margins(t)
    hdr = t.rows[0]
    trPr = hdr._tr.get_or_add_trPr()
    th = OxmlElement('w:tblHeader'); th.set(qn('w:val'), 'true'); trPr.append(th)
    for i, h in enumerate(headers):
        c = hdr.cells[i]
        c.width = Cm(widths_cm[i])
        _cell_fill(c, ORANGE)
        p = c.paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(h); r.bold = True; r.font.size = Pt(size); r.font.color.rgb = rgb('FFFFFF')
    for ri, row in enumerate(rows):
        cells = t.add_row().cells
        for i, v in enumerate(row):
            c = cells[i]
            c.width = Cm(widths_cm[i])
            fill = 'FFFFFF' if ri % 2 == 0 else LIGHT
            if status_col is not None and i == status_col and status_fn:
                s = status_fn(row)
                if s is not None:
                    fill = ST[s]
            _cell_fill(c, fill)
            lines = v if isinstance(v, list) else [v]
            c.paragraphs[0].text = ''
            for li, line in enumerate(lines):
                p = c.paragraphs[0] if li == 0 else c.add_paragraph()
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                p.paragraph_format.space_after = Pt(1)
                p.paragraph_format.line_spacing = 1.0
                if isinstance(line, tuple):
                    r = p.add_run(line[0]); r.bold = True; r.font.size = Pt(size); r.font.color.rgb = rgb(DARK)
                    r2 = p.add_run(line[1]); r2.font.size = Pt(size); r2.font.color.rgb = rgb(DARK)
                else:
                    r = p.add_run(str(line) if line is not None else ''); r.font.size = Pt(size); r.font.color.rgb = rgb(DARK)
                    if bold_first and i == 0:
                        r.bold = True
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return t


def caption(doc, text):
    p = doc.add_paragraph()
    r = p.add_run(text); r.italic = True; r.font.size = Pt(10); r.font.color.rgb = rgb(INK)
    p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT


def callout(doc, text, title=None, fill=TINT):
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = t.rows[0].cells[0]
    c.width = Cm(18)
    _cell_fill(c, fill)
    _cell_margins(t, 120, 120, 160, 160)
    p = c.paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    if title:
        r = p.add_run(title + '  '); r.bold = True; r.font.color.rgb = rgb(DARK); r.font.size = Pt(11)
    r = p.add_run(text); r.font.size = Pt(11); r.font.color.rgb = rgb(DARK)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def image(doc, path, width_cm=17, cap=None):
    if not os.path.exists(path):
        return
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(path, width=Cm(width_cm))
    if cap:
        caption(doc, cap)
