# -*- coding: utf-8 -*-
import warnings
import docx
from docx.shared import RGBColor, Pt, Inches, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

warnings.filterwarnings('ignore', category=UserWarning)

H1_COLOR = RGBColor(0x1F, 0x4B, 0x45)
H2_COLOR = RGBColor(0x27, 0x56, 0x50)
H3_COLOR = RGBColor(0x3F, 0x82, 0x7B)
HEADER_FILL = '1F4B45'

d = docx.Document('mg-pandoc.docx')

# ---- Narrower margins: more usable width for wide reference tables ----
for section in d.sections:
    if section.page_width is None:
        section.page_width = Inches(8.5)
    if section.page_height is None:
        section.page_height = Inches(11)
    section.left_margin = Inches(0.6)
    section.right_margin = Inches(0.6)
    section.top_margin = Inches(0.7)
    section.bottom_margin = Inches(0.7)
USABLE_WIDTH = d.sections[0].page_width - d.sections[0].left_margin - d.sections[0].right_margin

# ---- Explicit column widths for the 6-column alert-reference tables ----
ALERT_TABLE_WIDTHS = [0.09, 0.15, 0.08, 0.38, 0.15, 0.15]  # ID, Name, Severity, Trigger condition, Escalation, SLA
ALERT_NONLIVE_WIDTHS = [0.09, 0.28, 0.63]  # ID, Name, Why it never fires here


def set_col_widths(table, ratios):
    total = USABLE_WIDTH
    widths = [Emu(int(total * r)) for r in ratios]
    table.autofit = False
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl = table._tbl
    tblGrid = tbl.find(qn('w:tblGrid'))
    if tblGrid is not None:
        for gridCol, w in zip(tblGrid.findall(qn('w:gridCol')), widths):
            gridCol.set(qn('w:w'), str(w))
    for row in table.rows:
        for cell, w in zip(row.cells, widths):
            cell.width = w
            tcPr = cell._tc.get_or_add_tcPr()
            tcW = tcPr.find(qn('w:tcW'))
            if tcW is None:
                tcW = OxmlElement('w:tcW')
                tcPr.append(tcW)
            tcW.set(qn('w:type'), 'dxa')
            tcW.set(qn('w:w'), str(int(w / 635)))  # EMU -> twentieths of a point (dxa)


WEEKLY_TABLE_WIDTHS = [0.09, 0.24, 0.24, 0.31, 0.12]  # Week, PM Track, CM Track, journi Entry, Exception


def is_weekly_track_table(t):
    return len(t.columns) == 5 and 'PM) Track' in t.rows[0].cells[1].text

for t in d.tables:
    if len(t.columns) == 6 and t.rows[0].cells[0].text.strip() == 'ID':
        set_col_widths(t, ALERT_TABLE_WIDTHS)
    elif len(t.columns) == 3 and t.rows[0].cells[0].text.strip() == 'ID':
        set_col_widths(t, ALERT_NONLIVE_WIDTHS)
    elif is_weekly_track_table(t):
        set_col_widths(t, WEEKLY_TABLE_WIDTHS)

# ---- Prevent a table row's content from splitting across a page break ----
# Skip the large PM/CM weekly-track tables: their cells are prose-length, and
# forcing cantSplit there produces near-one-row-per-page with heavy blank space.
for t in d.tables:
    if is_weekly_track_table(t):
        continue
    for row in t.rows:
        trPr = row._tr.get_or_add_trPr()
        cant_split = OxmlElement('w:cantSplit')
        trPr.append(cant_split)

# ---- Title block (paragraphs 0-4) ----
titles = d.paragraphs[0:5]
sizes = [30, 15, 11.5, 11.5, 11]
bolds = [True, False, False, False, False]
italics = [False, False, True, True, False]
for p, size, bold, italic in zip(titles, sizes, bolds, italics):
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for r in p.runs:
        r.font.size = Pt(size)
        r.bold = bold
        r.italic = italic
        r.font.color.rgb = H1_COLOR if size == 30 else RGBColor(0x33, 0x33, 0x33)
d.paragraphs[0].space_before = Pt(100)
d.paragraphs[4].space_after = Pt(20)

# ---- Heading colors and sizes (bumped up to stay ahead of the larger body text) ----
H4_COLOR = RGBColor(0x5A, 0x8F, 0x89)
HEADING_SPECS = {
    'Heading 1': (H1_COLOR, Pt(21)),
    'Heading 2': (H2_COLOR, Pt(17)),
    'Heading 3': (H3_COLOR, Pt(14.5)),
    'Heading 4': (H4_COLOR, Pt(13)),
}
for p in d.paragraphs:
    spec = HEADING_SPECS.get(p.style.name)
    if spec:
        color, size = spec
        for r in p.runs:
            r.bold = True
            r.font.color.rgb = color
            r.font.size = size
        if p.style.name == 'Heading 3':
            p.space_before = Pt(14)

# ---- Table header-row shading ----
def shade_cell(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:fill'), fill)
    tcPr.append(shd)

for t in d.tables:
    if len(t.rows) == 0:
        continue
    header = t.rows[0]
    for cell in header.cells:
        shade_cell(cell, HEADER_FILL)
        for p in cell.paragraphs:
            for r in p.runs:
                r.bold = True
                r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

# ---- Base body font size increase (readability) ----
BODY_SIZE = Pt(12.5)
TABLE_SIZE = Pt(11)
HEADING_STYLE_NAMES = {'Heading 1', 'Heading 2', 'Heading 3', 'Title'}

for style_name in ('Normal', 'Body Text', 'Compact', 'First Paragraph', 'List Paragraph', 'Block Text'):
    if style_name in [s.name for s in d.styles]:
        d.styles[style_name].font.size = BODY_SIZE

for i, p in enumerate(d.paragraphs):
    if i < 5:
        continue  # title block already sized explicitly
    if p.style.name in HEADING_STYLE_NAMES:
        continue  # headings sized explicitly below
    for r in p.runs:
        if r.font.size is None:
            r.font.size = BODY_SIZE

for t in d.tables:
    for row in t.rows:
        for cell in row.cells:
            for p in cell.paragraphs:
                for r in p.runs:
                    r.font.size = TABLE_SIZE

# ---- Header / footer with page numbers ----
section = d.sections[0]
header = section.header
hp = header.paragraphs[0]
hp.text = 'journi — The Complete User Guide'
hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
for r in hp.runs:
    r.font.size = Pt(8)
    r.font.color.rgb = RGBColor(0x99, 0x99, 0x99)

footer = section.footer
fp = footer.paragraphs[0]
fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = fp.add_run('Page ')
run.font.size = Pt(8)
run.font.color.rgb = RGBColor(0x99, 0x99, 0x99)
fld_begin = OxmlElement('w:fldChar')
fld_begin.set(qn('w:fldCharType'), 'begin')
instr = OxmlElement('w:instrText')
instr.set(qn('xml:space'), 'preserve')
instr.text = 'PAGE'
fld_sep = OxmlElement('w:fldChar')
fld_sep.set(qn('w:fldCharType'), 'separate')
fld_end = OxmlElement('w:fldChar')
fld_end.set(qn('w:fldCharType'), 'end')
r2 = fp.add_run()
r2.font.size = Pt(8)
r2._r.append(fld_begin)
r2._r.append(instr)
r2._r.append(fld_sep)
r2._r.append(fld_end)

d.save('mg-styled.docx')
print('wrote mg-styled.docx')
