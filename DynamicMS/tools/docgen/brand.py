"""Shared Word styling for the deliverables — AI Value graphical chart v1.0: Open Sans 11 pt
body (Ink), Montserrat headings (Navy), Navy table headers with alternating white / #F5F8FB
rows and 1 px #E1E8F0 borders, A4 with 2 cm margins, AI Value logo, TOC, page X of Y.
Every fixed text is available in English and French (set_lang)."""
import os
from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor, Cm, Emu

# AI Value core palette (hex without #)
NAVY = '123A5F'
NAVY_DARK = '0D2A47'
AZURE = '1876C6'
GREEN = '28C87C'
TEAL = '17A2B8'
BG = 'F5F8FB'
INK = '2C3E50'
MUTED = '5A6B7B'
LINE = 'E1E8F0'
AZURE_TINT = 'E8F1FB'
GREEN_TINT = 'E7F9F0'
ST = ['F4C7C3', 'FBE0B5', 'FFF3B0', 'D9EAD3', 'B6D7A8']
# Names used by the builders
ORANGE = NAVY        # table header fill
DEEP = AZURE         # accent (eyebrows, large display text only)
TINT = AZURE_TINT    # callouts
DARK = NAVY          # titles, strong text
MEDIUM = MUTED
LIGHT = BG
FONT = 'Open Sans'
HEAD = 'Montserrat'
USABLE_CM = 17.0     # A4 width 21 cm - 2 x 2 cm margins
HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', '..', 'deliverables', 'assets')
LOGO = os.path.join(ASSETS, 'aivalue-logo.png')
ICON = os.path.join(ASSETS, 'aivalue-icon.png')
APP_LOGO = os.path.join(ASSETS, 'dynamicms-logo.png')
COMPANY = 'AI Value'
DESCRIPTOR = 'Digital & AI Transformation'
TAGLINE = 'MEASURABLE · GOVERNED · SUSTAINABLE'
LANG = 'en'
WORDS = {
    'en': {'toc': 'Table of Contents', 'toc_hint': 'Right-click and choose Update Field to refresh the table of contents.', 'page': 'Page ', 'of': ' of '},
    'fr': {'toc': 'Table des matières', 'toc_hint': 'Clic droit puis Mettre à jour les champs pour actualiser la table des matières.', 'page': 'Page ', 'of': ' sur '},
}


def set_lang(lang):
    global LANG
    LANG = lang if lang in WORDS else 'en'


def W(k):
    return WORDS[LANG][k]


def _fonts(rpr, name):
    rf = rpr.find(qn('w:rFonts'))
    if rf is None:
        rf = OxmlElement('w:rFonts'); rpr.append(rf)
    for a in ('w:ascii', 'w:hAnsi', 'w:cs', 'w:eastAsia'):
        rf.set(qn(a), name)
    for a in ('w:asciiTheme', 'w:hAnsiTheme', 'w:eastAsiaTheme', 'w:cstheme'):
        if rf.get(qn(a)) is not None:
            del rf.attrib[qn(a)]


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
        setattr(sec, side, Cm(2))
    st = doc.styles
    normal = st['Normal']
    normal.font.name = FONT
    normal.font.size = Pt(11)
    normal.font.color.rgb = rgb(INK)
    _fonts(normal.element.get_or_add_rPr(), FONT)
    pf = normal.paragraph_format
    pf.alignment = WD_ALIGN_PARAGRAPH.LEFT
    pf.line_spacing = 1.15
    pf.space_after = Pt(6)
    for lst in ('List Bullet', 'List Number'):
        _fonts(st[lst].element.get_or_add_rPr(), FONT)
    # H1 Montserrat 20 pt Navy bold; H2 Montserrat SemiBold 16 pt Navy; H3 Montserrat 12.5 pt Navy bold
    for name, size, font, bold, before, after in (('Heading 1', 20, HEAD, True, 18, 8), ('Heading 2', 16, HEAD + ' SemiBold', False, 14, 6), ('Heading 3', 12.5, HEAD, True, 10, 4)):
        s = st[name]
        s.font.name = font
        s.font.size = Pt(size)
        s.font.bold = bold
        s.font.italic = False
        s.font.color.rgb = rgb(NAVY)
        _fonts(s.element.get_or_add_rPr(), font)
        s.paragraph_format.space_before = Pt(before)
        s.paragraph_format.space_after = Pt(after)
        s.paragraph_format.keep_with_next = True
        s.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        if name == 'Heading 1':
            ppr = s.element.get_or_add_pPr()
            pbdr = OxmlElement('w:pBdr')
            pbdr.append(_border(None, 'w:bottom', 6, LINE))
            ppr.append(pbdr)
    doc.core_properties.title = title
    doc.core_properties.author = COMPANY
    # Header: AI Value icon (above the 8 mm minimum) at the start, document name at the end
    hp = sec.header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.LEFT
    tabs = hp.paragraph_format.tab_stops
    from docx.enum.text import WD_TAB_ALIGNMENT
    tabs.add_tab_stop(Cm(USABLE_CM), WD_TAB_ALIGNMENT.RIGHT)
    if os.path.exists(ICON):
        hp.add_run().add_picture(ICON, height=Cm(0.9))
    r = hp.add_run('\t' + header_text)
    r.font.size = Pt(9); r.font.color.rgb = rgb(MEDIUM)
    fp = sec.footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = fp.add_run(f'{COMPANY} — {DESCRIPTOR}  ·  ' + W('page'))
    r.font.size = Pt(9); r.font.color.rgb = rgb(MEDIUM)
    _field(fp, 'PAGE')
    r = fp.add_run(W('of'))
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


def cover(doc, eyebrow, title, subtitle, meta, app_logo=True):
    """Cover: AI Value logo (full lockup, 6 cm), product logo, eyebrow (Azure, uppercase,
    tracked), title (Montserrat, Navy), subtitle (Ink), meta (Muted), tagline (Green)."""
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    if os.path.exists(LOGO):
        p.add_run().add_picture(LOGO, width=Cm(6))
    for _ in range(2):
        doc.add_paragraph()
    if app_logo and os.path.exists(APP_LOGO):
        p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.add_run().add_picture(APP_LOGO, width=Cm(3.6))
    doc.add_paragraph()
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = p.add_run(eyebrow.upper()); r.bold = True; r.font.size = Pt(10); r.font.color.rgb = rgb(AZURE)
    _spacing(r, 40)
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = p.add_run(title); r.bold = True; r.font.size = Pt(30); r.font.color.rgb = rgb(NAVY); r.font.name = HEAD; _fonts(r._r.get_or_add_rPr(), HEAD)
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = p.add_run(subtitle); r.font.size = Pt(13); r.font.color.rgb = rgb(INK)
    for _ in range(5):
        doc.add_paragraph()
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = p.add_run(meta); r.font.size = Pt(10); r.font.color.rgb = rgb(MEDIUM)
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = p.add_run(TAGLINE); r.bold = True; r.font.size = Pt(9.5); r.font.color.rgb = rgb(GREEN)
    _spacing(r, 60)
    page_break(doc)


def _spacing(run, twentieths):
    rpr = run._r.get_or_add_rPr()
    sp = OxmlElement('w:spacing'); sp.set(qn('w:val'), str(twentieths)); rpr.append(sp)


def toc(doc, label=None):
    h = doc.add_paragraph(); r = h.add_run(label or W('toc')); r.bold = True; r.font.size = Pt(20); r.font.color.rgb = rgb(NAVY); r.font.name = HEAD; _fonts(r._r.get_or_add_rPr(), HEAD)
    p = doc.add_paragraph()
    r = p.add_run()
    b = OxmlElement('w:fldChar'); b.set(qn('w:fldCharType'), 'begin'); b.set(qn('w:dirty'), 'true'); r._r.append(b)
    r2 = p.add_run()
    t = OxmlElement('w:instrText'); t.set(qn('xml:space'), 'preserve'); t.text = ' TOC \\o "1-3" \\h \\z \\u '; r2._r.append(t)
    r3 = p.add_run()
    s = OxmlElement('w:fldChar'); s.set(qn('w:fldCharType'), 'separate'); r3._r.append(s)
    p.add_run(W('toc_hint'))
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


def _new_num(doc, style):
    # A fresh w:num on the style's abstract list, with its level 0 restarted at 1
    numbering = doc.part.numbering_part.numbering_definitions._numbering
    pPr = doc.styles[style].element.pPr
    num_id = int(pPr.numPr.numId.val)
    abstract = None
    for n in numbering.findall(qn('w:num')):
        if int(n.get(qn('w:numId'))) == num_id:
            abstract = n.find(qn('w:abstractNumId')).get(qn('w:val'))
    new_id = max(int(n.get(qn('w:numId'))) for n in numbering.findall(qn('w:num'))) + 1
    num = OxmlElement('w:num'); num.set(qn('w:numId'), str(new_id))
    a = OxmlElement('w:abstractNumId'); a.set(qn('w:val'), abstract); num.append(a)
    ov = OxmlElement('w:lvlOverride'); ov.set(qn('w:ilvl'), '0')
    st = OxmlElement('w:startOverride'); st.set(qn('w:val'), '1'); ov.append(st); num.append(ov)
    numbering.append(num)
    return new_id


def numbered(doc, items):
    num_id = _new_num(doc, 'List Number')
    for it in items:
        p = doc.add_paragraph(style='List Number')
        numPr = p._p.get_or_add_pPr().get_or_add_numPr()
        numPr.get_or_add_ilvl().val = 0
        numPr.get_or_add_numId().val = num_id
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
    """Navy header with bold white text, alternating white / #F5F8FB rows, thin #E1E8F0
    borders; column widths are scaled to the usable width (17 cm)."""
    tot = sum(widths_cm)
    if tot > USABLE_CM:
        widths_cm = [w * USABLE_CM / tot for w in widths_cm]
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
    r = p.add_run(text); r.italic = True; r.font.size = Pt(9.5); r.font.color.rgb = rgb(MUTED)
    p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT


def callout(doc, text, title=None, fill=TINT):
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = t.rows[0].cells[0]
    c.width = Cm(USABLE_CM)
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
    width_cm = min(width_cm, USABLE_CM)
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(path, width=Cm(width_cm))
    if cap:
        caption(doc, cap)
