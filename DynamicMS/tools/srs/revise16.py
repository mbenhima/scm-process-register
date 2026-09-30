import copy, sys
import docx
from docx.oxml.ns import qn
from docx.table import Table
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
import revise_helpers as H
from content16 import *

SRC, OUT = sys.argv[1], sys.argv[2]
d = docx.Document(SRC)
H.d = d
find, normal, bullet, h2, req, insert_after, clone_para = H.find, H.normal, H.bullet, H.h2, H.req, H.insert_after, H.clone_para
H.init()

# cover and introduction (anchored on the 1.5 paragraphs)
cov = find('Version 1.5', 'Normal'); H.set_runs(cov._p, [cov.text.replace('1.5', '1.6')])
insert_after(find('Revision 1.5 adds capabilities'), [normal(PURPOSE)])
insert_after(find('Revision 1.5 adds to this scope'), [normal(SCOPE)])
ref15 = find('DynamicMS — Reference implementation', 'List Paragraph')
insert_after(ref15, [clone_para(ref15, [REFERENCE])])
insert_after(find('Revision 1.5 adds Sections 3.15'), [normal(OVERVIEW)])
insert_after(find('Explicit prompts.', 'List Paragraph'), [bullet(t) for t in PRINCIPLES])
insert_after(find('Generate controlled documents and records from versioned templates', 'List Paragraph'), [bullet(t) for t in FUNCTIONS])

insert_after(find('Requirements added in revision 1.5 are generalized'),
             [normal('Requirements added in revision 1.6 come from the second and third rounds of DynamicMS user feedback; '
                     'they carry new IDs, never reuse an earlier one, and are listed in Appendix H.')])
for anchor_id, items in APPEND:
    insert_after(find(anchor_id + ':'), [req(i, t) for i, t in items])

els = []
for title, intro, items in SECTIONS:
    els.append(h2(title)); els.append(normal(intro)); els += [req(i, t) for i, t in items]
insert_after(find('FR-DA-DOC-11:'), els)

H.add_rows(next(H.table_with('Term')), TERMS)
H.add_rows(next(H.table_with('Entity')), ENTITIES)
H.add_rows(next(H.table_with('Area')), CONFORMANCE)
insert_after(find('Revision 1.5 adds a Search button'), [normal(UI_PARA)])

# Appendix H after the Appendix G table
gtab_src = [t for t in H.table_with('Section')][-1]
htab = H.strip_marks(copy.deepcopy(gtab_src._tbl))
for tr in htab.findall(qn('w:tr'))[1:]: htab.remove(tr)
h_h = clone_para(H.M_H1, ['Appendix H — Revision 1.6 Change Log'])
h_i = normal('Revision 1.6 keeps every earlier requirement ID and is purely additive. Its requirements are application '
             'agnostic: they come from the second and third rounds of DynamicMS user feedback, restated so that any '
             'Dynamic App can meet them. The generated-document requirements of Sections 4.44 and 4.45 detail those of '
             'Section 4.43.')
insert_after(gtab_src._tbl, [h_h, h_i, htab])
for vals in CHANGELOG:
    trs = htab.findall(qn('w:tr'))
    model = gtab_src._tbl.findall(qn('w:tr'))[1 + (len(trs) - 1) % 2]
    tr = H.strip_marks(copy.deepcopy(model))
    for tc, v in zip(tr.findall(qn('w:tc')), vals): H.set_cell(tc, v)
    trs[-1].addnext(tr)

insert_after(find('4.43 Documented Information Templates & Generated Documents\t', 'Normal'), [H.toc('4.43 Documented', s[0]) for s in SECTIONS])
insert_after(find('Appendix G — Revision 1.5 Change Log\t', 'Normal'), [H.toc('Appendix G', 'Appendix H — Revision 1.6 Change Log')])
d.save(OUT)
print('saved', OUT)
