"""Produce revision 1.2 of the Dynamic Apps Standard SRS from revision 1.1 (built by update_srs.py).

Adds the platform capabilities proven in the second CortexPLM round that apply to any Dynamic App: the tenancy
tree and provisioning of new organizations, the portfolio overview matrix, the stage checklist library,
attachments, AI placement in the process design and model selection, the BPMN workspace, legends and the
decision matrix. Formats are cloned from the document itself; the manual TOC page numbers are set afterwards
by srs_toc_pages.py.

usage: python3 update_srs_v12.py <srs_v1.1.docx> <srs_v1.2.docx>
"""
import copy
import sys

import docx
from docx.oxml.ns import qn

SRC, OUT = sys.argv[1], sys.argv[2]
d = docx.Document(SRC)
W = qn('w:t')


def para(start, style=None):
    for p in d.paragraphs:
        if p.text.startswith(start) and (style is None or p.style.name.startswith(style)):
            return p
    raise KeyError(start)


def set_runs(p, texts):
    runs = p._p.findall(qn('w:r'))
    for i, r in enumerate(runs):
        if i < len(texts):
            ts = r.findall(W)
            for t in ts[1:]:
                r.remove(t)
            ts[0].text = texts[i]
            ts[0].set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
        else:
            p._p.remove(r)
    return p


class Cursor:
    def __init__(self, anchor):
        self.el = anchor._p if hasattr(anchor, '_p') else anchor

    def add(self, template, texts):
        el = copy.deepcopy(template._p)
        self.el.addnext(el)
        self.el = el
        return set_runs(docx.text.paragraph.Paragraph(el, template._parent), texts)

    def req(self, rid, text): return self.add(T_REQ, [f'{rid}: ', text])
    def body(self, text): return self.add(T_BODY, [text])
    def bullet(self, text): return self.add(T_BUL, [text])
    def h2(self, text): return self.add(T_H2, [text])
    def h1(self, text): return self.add(T_H1, [text])


def last_req(prefix):
    return [p for p in d.paragraphs if p.text.startswith(prefix)][-1]


def add_rows(table, rows):
    for cells in rows:
        tr = copy.deepcopy(table.rows[-2]._tr)
        table.rows[-1]._tr.addnext(tr)
        for tc, text in zip(tr.findall(qn('w:tc')), cells):
            ps = tc.findall(qn('w:p'))
            for extra in ps[1:]:
                tc.remove(extra)
            set_runs(docx.text.paragraph.Paragraph(ps[0], None), [text])


T_REQ = para('FR-DA-TEN-01')
T_BUL = para('Explainable AI only')
T_BODY = para('Every Dynamic App is built on')
T_H2 = para('3.10 Return on Experience', 'Heading')
T_H1 = para('Appendix B', 'Heading')
T_TOC2 = para('4.21 Platform Operations', 'Normal')
T_TOC1 = para('Appendix B — Revision 1.1 Change Log', 'Normal')

# ---------------------------------------------------------------- cover, purpose, overview
set_runs(para('Version 1.1'), ['Version 1.2  ·  September 2026  ·  Confidential'])
Cursor(para('Revision 1.1 extends the standard')).body(
    'Revision 1.2 adds a second set of capabilities proven in CortexPLM that any Dynamic App can reuse: the tenancy '
    'tree (Group Yes/No > Organization > principal records) and the provisioning of new organizations, the portfolio '
    'overview matrix, a stage checklist library, multi-format attachments, AI shown and run where it applies in the '
    'process design, the choice of the live AI model, a full-screen BPMN workspace, on-screen legends and a decision '
    'matrix for scored fields. Appendix C lists these changes.')
Cursor(para('Revision 1.1 adds Sections 3.11')).body(
    'Revision 1.2 adds Sections 4.22 to 4.24, new requirements in Sections 4.1, 4.4, 4.7, 4.12, 4.19, 4.21 and 5.5, '
    'and Appendix C, the change log of revision 1.2. As in 1.1, nothing was removed or renumbered.')

# ---------------------------------------------------------------- 1.4 definitions
add_rows(d.tables[0], [
    ('Tenancy Tree', 'The view Group (Yes/No) > Organization > principal records, limited to what the viewer may see; an Organization with no Group appears as Independent.'),
    ('Provisioning', 'Everything a new Organization receives on creation: OBS skeleton, standard governance catalog, AI Use Case Library, checklist and record templates, and optionally a starting team.'),
    ('Portfolio Overview', 'A matrix of principal records (rows) against process stages (columns) whose cells show the status of each stage, for a chosen scope.'),
    ('Stage Checklist Template', 'A reusable list of checklist items for one stage (gate) and one variant (track); when linked, it is copied into the stage checklist when the stage opens.'),
])

# ---------------------------------------------------------------- 4.1 tenancy
c = Cursor(last_req('FR-DA-TEN-'))
c.req('FR-DA-TEN-12', 'The system shall present a tenancy tree, Group (Yes/No) > Organization > principal records, and the same content as a table (Group Yes/No, Group, Organization, sector, records), limited to the Organizations the viewer may see.')
c.req('FR-DA-TEN-13', 'The system shall let an authorized user choose the Organization a new principal record belongs to before creating it, showing whether that Organization belongs to a Group; a platform administrator may choose any Organization, other users only their own.')
c.req('FR-DA-TEN-14', 'The system shall provision every new Organization on creation with the OBS skeleton, the standard governance catalog, the AI Use Case Library (FR-DA-AI-02), the checklist and record templates, and, when requested, a starting team of one account per standard role under the Organization\'s e-mail domain with an initial password; a domain already used by another Organization shall be refused.')
c.req('FR-DA-TEN-15', 'The system shall let a dedicated permission grant read-only visibility of the principal records of the other Organizations of the viewer\'s own Group; records of Organizations outside the Group shall never be visible, and records of another Organization shall never be editable from the viewer\'s Organization.')
c.req('FR-DA-TEN-16', 'The system shall let an OBS node list the people placed in it, each with a standard role and the role played in that node (for example "Engineering lead" in a project team), and shall let an administrator add and remove them.')

# ---------------------------------------------------------------- 4.4 AI
c = Cursor(last_req('FR-DA-AI-'))
c.req('FR-DA-AI-12', 'The system shall show every active AI Use Case, labelled with its tier (Assistive AI or Augmented AI) by a distinct icon and wording, on the processes, macro processes, tasks and steps it is linked to, and shall let an authorized user run it there and accept, modify or reject the suggestion (FR-DA-AI-07).')
c.req('FR-DA-AI-13', 'The system shall let an AI Use Case be linked to a step, a process, a task or an end-to-end process, and shall list the tasks of the process design with the AI Use Cases that support them, filterable by tier.')
c.req('FR-DA-AI-14', 'The system shall let an authorized user delete a custom AI Use Case, keeping its usage-log entries; seeded catalog entries shall be deactivated instead of deleted.')
c.req('FR-DA-AI-15', 'The system shall offer, wherever the live model is configured (personal settings and administration), a provider list and a model list with a "custom model" choice and an optional custom endpoint, and a connection test that reports only the outcome category (works, authentication failure, model not found, rate limited, unreachable).')

# ---------------------------------------------------------------- 4.7 BPMN
c = Cursor(last_req('FR-DA-BPMN-'))
c.req('FR-DA-BPMN-06', 'The system shall offer a shapes palette section grouped by category (tools, events, activities, gateways, data, participants, artifacts), usable by click or drag, and shown as a legend of the main shapes when the diagram is view-only.')
c.req('FR-DA-BPMN-07', 'The system shall let the user open a diagram in a full-screen workspace with the palette, zoom controls (slider, zoom in and out, fit), a palette that slides away, and a single action or the Escape key to return to the page.')
c.req('FR-DA-BPMN-08', 'The system shall state on the diagram screen whether editing a diagram changes the execution of records; where diagrams only document the process, saving one shall not alter running or future records.')

# ---------------------------------------------------------------- 4.12 Help
c = Cursor(last_req('FR-DA-HLP-'))
c.req('FR-DA-HLP-04', 'The system shall provide, next to every scored or classified input (for example complexity scores), a decision matrix describing each level, and shall show a legend for every code or colour vocabulary displayed in a list or matrix (for example the Part letter of a process or the status colours of a matrix).')

# ---------------------------------------------------------------- 4.19 navigation
Cursor(last_req('FR-DA-NAV-')).req('FR-DA-NAV-11', 'The system shall organize the menu by what users do, in a documented order (home and own work, portfolio of records, process design, governance and risk, AI and knowledge, reports, administration, personal settings), so the same capability is always found in the same place across Dynamic Apps.')

# ---------------------------------------------------------------- 4.21 operations
Cursor(last_req('FR-DA-OPS-')).req('FR-DA-OPS-09', 'The system shall seed demonstration data in every module, so that no screen of the delivered application is empty: record teams with roles, templates, attachments in several formats, custom AI Use Cases and project overrides, alert settings and alerts already read, and integration and webhook registrations.')

# ---------------------------------------------------------------- 4.22 – 4.24 new sections
c = Cursor(last_req('FR-DA-OPS-'))
c.h2('4.22 Portfolio Overview')
c.body('The portfolio overview answers "where does each record stand in each process?" for any scope the user may see.')
c.req('FR-DA-PFO-01', 'The system shall let the user choose a scope: a Group, one or more Organizations, or a set of principal records, each list containing only what the user may see (FR-DA-TEN-15).')
c.req('FR-DA-PFO-02', 'The system shall show one row per principal record and one column per process stage, with at each intersection the status of that stage for that record, drawn from one status vocabulary (for example Completed, In progress, At gate, On hold, Stopped, Not started, Not in the record\'s variant).')
c.req('FR-DA-PFO-03', 'The system shall show a legend of the cell statuses, a per-stage total, the number of times a stage ran when more than once, and a hover text naming record, stage and status.')
c.req('FR-DA-PFO-04', 'The system shall export the matrix to CSV (FR-DA-REP-04) and shall show records of another Organization read-only.')
c.h2('4.23 Stage Checklist Library')
c.body('Checklists that close a stage are built from a library of templates, per stage and per variant (track), instead of being fixed in code.')
c.req('FR-DA-CHK-01', 'The system shall keep a library of checklist templates, each for one stage and one variant, with ordered items marked mandatory and evidence-required, versioned under the generic Version Management service (Section 3.8).')
c.req('FR-DA-CHK-02', 'The system shall let a template be linked to its stage; linked templates shall be copied into the stage checklist when the stage opens, and a built-in reference checklist shall apply when no template is linked.')
c.req('FR-DA-CHK-03', 'The system shall let an authorized user add items to an open stage checklist from any template or by typing them, never adding the same item twice, and save a stage checklist as a new template.')
c.req('FR-DA-CHK-04', 'The system shall show, for every stage and variant, how many templates exist and how many are linked, and shall seed sector templates for new Organizations of that sector.')
c.req('FR-DA-CHK-05', 'The system shall freeze the checklist, its items and their evidence once the stage has been submitted for decision.')
c.h2('4.24 Attachments')
c.body('Actions and checklist items carry the documents that support them.')
c.req('FR-DA-ATT-01', 'The system shall let a user attach several files at once to an action or a checklist item, by file picker or drag-and-drop.')
c.req('FR-DA-ATT-02', 'The system shall accept a published list of formats — documents, spreadsheets, presentations, images, drawings and CAD, data and models, archives, audio and video, e-mails — with a size and count limit per upload, and shall refuse any other type with a message naming the refused file.')
c.req('FR-DA-ATT-03', 'The system shall show for every attachment its type, size, author and date, with download for every viewer and removal for its author or a manager, audited, and never once the stage is submitted.')
c.req('FR-DA-ATT-04', 'The system shall store attachments outside every web-served directory, scoped to the tenant, and include them in the backup instructions (NFR-DA-SEC-13, FR-DA-OPS-01).')

# ---------------------------------------------------------------- 5.5 / 5.8 NFR
Cursor(last_req('NFR-DA-UX-')).req('NFR-DA-UX-08', 'Wide matrices and tables shall scroll inside their own container, keeping the first column visible, so the page never scrolls horizontally on a 390-pixel viewport.')
Cursor(last_req('NFR-DA-MAINT-')).req('NFR-DA-MAINT-07', 'Every User Guide walkthrough shall start from the tenancy — create or choose the Group (Yes/No), create the Organization, then the principal record(s) — and the guide shall include the decision matrix of FR-DA-HLP-04.')

# ---------------------------------------------------------------- 6 data model
add_rows(d.tables[2], [
    ('ObsMember', 'A person placed in an OBS node, with the standard role and the role played there.'),
    ('ChecklistTemplate', 'A versioned list of checklist items for one stage and variant, linked or not to its stage.'),
    ('Attachment', 'A file attached to an action or a checklist item: name, type, size, author, date, tenant-scoped storage reference.'),
])

# ---------------------------------------------------------------- 7.1 / 7.2
Cursor(para('Every screen sits inside the common navigation shell')).body(
    'Revision 1.2 adds a tenancy screen (Group Yes/No > Organization > records), a portfolio overview, a checklist '
    'template library in the process design, an attachments panel on every action, AI badges on the process design, '
    'and a live AI model card in personal settings and in administration.')
c = Cursor(para('Operations: health (unauthenticated'))
c.bullet('Tenancy and portfolio: tenancy tree, scope lists (groups, organizations, records the user may see), records across the scope, portfolio matrix.')
c.bullet('Checklist templates: library CRUD with version history; add to a stage checklist from a template or by hand; save a stage checklist as a template.')
c.bullet('Attachments: accepted types, multi-file upload, download, delete.')
c.bullet('AI model: model and provider catalog; connection test.')

# ---------------------------------------------------------------- Appendix A rows
A = d.tables[3]
add_rows(A, [
    ('Tenancy, provisioning and group visibility (FR-DA-TEN-12 – 16)', 'Tenancy tree and table; organization chosen before a record; provisioning with starting team; read-only group visibility; OBS members with roles.',
     'New in revision 1.2. Implemented and verified in CortexPLM (automated tests: group scope, independent scope, platform scope, provisioning with 24 accounts and duplicate-domain refusal).'),
    ('Portfolio overview, checklist library, attachments (Sections 4.22 – 4.24)', 'Scope matrix with legend; stage checklist templates linked or added on demand; multi-format attachments.',
     'New in revision 1.2. Implemented and verified in CortexPLM, including the User Guide walkthroughs replayed against a fresh installation.'),
    ('AI placement and model selection (FR-DA-AI-12 – 15), BPMN workspace (FR-DA-BPMN-06 – 08)', 'Tier badges runnable in place; custom use case delete; model list with custom choice and connection test; palette section and full screen.',
     'New in revision 1.2. Implemented in CortexPLM. The connection test was verified for the authentication-failure outcome; a live call needs the user\'s own key.'),
])

# ---------------------------------------------------------------- Appendix C
closing = para('Nothing was removed. Product-specific material')
c = Cursor(closing)
c.h1('Appendix C — Revision 1.2 Change Log')
c.body('Revision 1.2 is additive, like 1.1: every earlier requirement keeps its ID and wording, and new requirements take the next free number in their section.')
tbl = copy.deepcopy(d.tables[4]._tbl)
c.el.addnext(tbl)
C = docx.table.Table(tbl, closing._parent)
for tr in C.rows[3:]:
    tbl.remove(tr._tr)
CHANGES = [
    ('Cover, 1.1, 1.6', 'Version 1.2', 'Version raised to 1.2; purpose and overview describe the revision.'),
    ('1.4 Definitions', '4 terms added', 'Tenancy Tree, Provisioning, Portfolio Overview, Stage Checklist Template.'),
    ('4.1 Tenant & Hierarchy', 'FR-DA-TEN-12 – 16', 'Tenancy tree and table; organization chosen before creating a record; provisioning of new organizations with an optional starting team; read-only visibility within the group; OBS members with roles.'),
    ('4.4 AI Use Case Library', 'FR-DA-AI-12 – 15', 'Tier badges shown and runnable on the process design; links to step, process, task or E2E process; delete for custom use cases; model list with custom choice, custom endpoint and connection test.'),
    ('4.7 BPMN', 'FR-DA-BPMN-06 – 08', 'Shapes palette section (legend when view-only); full-screen workspace with zoom and return; statement of whether diagrams drive execution.'),
    ('4.12 Help', 'FR-DA-HLP-04', 'Decision matrix next to scored inputs; legend for every code or colour vocabulary.'),
    ('4.19 Navigation', 'FR-DA-NAV-11', 'Menu organized by what users do, in a documented order.'),
    ('4.21 Operations', 'FR-DA-OPS-09', 'Demonstration seed covers every module.'),
    ('4.22 Portfolio Overview', 'FR-DA-PFO-01 – 04 (new)', 'Scope, record × stage matrix, legend and totals, CSV export, read-only foreign records.'),
    ('4.23 Stage Checklist Library', 'FR-DA-CHK-01 – 05 (new)', 'Versioned templates per stage and variant; linked templates copied at stage opening; add from template or by hand without duplicates; sector templates; frozen after submission.'),
    ('4.24 Attachments', 'FR-DA-ATT-01 – 04 (new)', 'Multi-file upload; published accepted formats with limits; metadata, download, audited removal; storage and backup.'),
    ('5.5 Usability', 'NFR-DA-UX-08', 'Wide matrices scroll in their own container; no page-level horizontal scroll on phones.'),
    ('5.8 Maintainability', 'NFR-DA-MAINT-07', 'User Guide walkthroughs start from the tenancy and include the decision matrix.'),
    ('6 Data Model', '3 entities', 'ObsMember, ChecklistTemplate, Attachment.'),
    ('7.1, 7.2 Interfaces', 'Clarified', 'New screens and endpoint families for tenancy and portfolio, checklist templates, attachments and the AI model.'),
    ('Appendix A', '3 rows', 'Conformance of the 1.2 additions in CortexPLM.'),
]
for r, cells in zip(C.rows[1:3], CHANGES[:2]):
    for cell, text in zip(r.cells, cells):
        set_runs(cell.paragraphs[0], [text])
add_rows(C, CHANGES[2:])
c.el = tbl
c.body('Product-specific material of this CortexPLM round — its sectors, its phase-gate vocabulary and its demonstration content — stays in the CortexPLM documentation.')

# ---------------------------------------------------------------- manual TOC entries
c = Cursor(para('4.21 Platform Operations', 'Normal'))
for t in ('4.22 Portfolio Overview', '4.23 Stage Checklist Library', '4.24 Attachments'):
    c.add(T_TOC2, [t, '0'])
Cursor(T_TOC1).add(T_TOC1, ['Appendix C — Revision 1.2 Change Log', '0'])

d.save(OUT)
print('saved', OUT)
