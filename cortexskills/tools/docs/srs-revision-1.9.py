"""Revision 1.9 of the Standard Application SRS: applies every change to the 1.8 Word file, keeping its styles."""
import copy, re, sys, zipfile, shutil
import docx
from docx.oxml.ns import qn
from docx.text.paragraph import Paragraph
from docx.table import Table

SRC, OUT = sys.argv[1], sys.argv[2]
d = docx.Document(SRC); body = d.element.body

def paras(): return [p for p in (Paragraph(e, d) for e in body.iterchildren() if e.tag == qn('w:p')) if not (p.style is not None and p.style.name.upper().startswith('TOC'))]  # never a table-of-contents line
def find(prefix, start=None):
    for p in paras():
        if p.text.startswith(prefix): return p
    raise SystemExit('not found: ' + prefix)
def tables(): return [Table(e, d) for e in body.iterchildren() if e.tag == qn('w:tbl')]
def table_with(head0, contains=None):
    for t in tables():
        if t.rows[0].cells[0].text.strip() == head0 and (contains is None or any(contains in c.text for r in t.rows for c in r.cells)): return t
    raise SystemExit('table not found: ' + head0)

def set_runs(p, texts):
    """Writes texts into the first runs of p (keeping their formatting) and removes the other runs."""
    runs = p.runs
    if not runs: p.add_run(''); runs = p.runs
    for i, t in enumerate(texts): runs[min(i, len(runs) - 1)].text = t if i < len(runs) else runs[-1].text + t
    for r in runs[len(texts):]: r._r.getparent().remove(r._r)
def clone_after(ref, texts):
    el = copy.deepcopy(ref._p); ref._p.addnext(el); p = Paragraph(el, d)
    set_runs(p, texts); return p
def req(p, rid, text): set_runs(p, [rid + ': ', text])
def add_reqs(after_prefix, items):
    ref = find(after_prefix); last = ref
    for rid, text in items: last = clone_after(last if last is not ref else ref, [rid + ': ', text])
    return last
def set_cell(cell, text):
    ps = cell.paragraphs; p = ps[0]
    if p.runs: set_runs(p, [text])
    else: p.add_run(text)
    for extra in ps[1:]: extra._p.getparent().remove(extra._p)
def add_rows(t, rows, template=-1):
    ref = t.rows[template]._tr
    for vals in rows:
        tr = copy.deepcopy(ref); t._tbl.append(tr); from docx.table import _Row
        row = _Row(tr, t)
        for c, v in zip(row.cells, vals): set_cell(c, v)
def replace_text(p, old, new):
    for r in p.runs:
        if old in r.text: r.text = r.text.replace(old, new); return True
    full = p.text
    if old in full: set_runs(p, [full.replace(old, new)]); return True
    raise SystemExit('text not found: ' + old)

# ------------------------------------------------------------------ cover, document control, header
replace_text(find('Application-agnostic edition'), 'Version 1.8', 'Version 1.9')
dc = table_with('Item', 'Supersedes')
for r in dc.rows:
    k = r.cells[0].text.strip()
    if k == 'Version': set_cell(r.cells[1], '1.9 — October 2026 (application-agnostic edition)')
    if k == 'Supersedes': set_cell(r.cells[1], 'Revision 1.8 and every earlier revision, including the (New) SRS revision 1.7. Their requirement IDs remain valid; Appendix I.1 maps the (New) SRS section numbers and Appendix N lists the changes of revision 1.9.')

# ------------------------------------------------------------------ 1.1, 1.2, 1.6, 4 intro
p = find('Revision 1.8, this edition, makes'); replace_text(p, 'Revision 1.8, this edition, makes', 'Revision 1.8 makes')
clone_after(p, ['Revision 1.9, this edition, comes from the acceptance of a reference implementation and keeps the standard application agnostic. It makes the AI Use Case Library fully governed and visible — a dedicated form and page for each use case, links to several process elements, the coverage of the process design, one governed path for every AI generation and a stated model precedence — and brings multi-record entry to large volumes and to real working conditions: validation only after a change, an issues list, undo and redo, browser drafts, edit conflicts, an offline queue, virtual rows, batched operations, a five-stage file import, export, a guard when leaving with unsaved rows and a phone layout. It also states rules learned in the same acceptance: language-independent references, a reopened step that reads as open everywhere, Office files that open without repair, data migrated in place on upgrade, and automated tests of multi-record entry.'])
p = find('Revision 1.8 adds to this scope:')
clone_after(p, ['Revision 1.9 adds to this scope: the AI Use Case page, form, links and coverage view, and the single governed path of every AI generation with its model precedence; for multi-record entry, error finding, the save-state and draft model, browser drafts and edit conflicts, the offline queue, virtual rows and optional pages, batched bulk operations, file import and export, the unsaved-changes guard, readability without horizontal scrolling and the phone layout; step forms chosen by the meaning of the step; language-independent references; valid Office files; in-place data migration on upgrade.'])
p = find('Revision 1.8 is editorial for applicability')
clone_after(p, ['Revision 1.9 adds FR-DA-AI-21 to 26, FR-DA-MRE-24 to 35, FR-DA-SFM-08 and 09, FR-DA-I18N-10, FR-DA-DOC-12, NFR-DA-PERF-14, NFR-DA-SEC-22, NFR-DA-REL-11, NFR-DA-UX-21, NFR-DA-I18N-07, NFR-DA-MAINT-11 and NFR-DA-PORT-05; amends FR-DA-AI-01, 07 and 13, FR-DA-AIP-07, FR-DA-MRE-05, 08, 11, 14, 18 and 22, NFR-DA-REL-10 and NFR-DA-MAINT-04, and Table 4.49-1; adds 9 terms in Section 1.4, 3 entities and 2 amended entities in Section 6, one paragraph in Sections 3.4 and 7.1, 2 interface families in Section 7.2, rows in Appendices A and K, and Appendix N, the change log of revision 1.9. Nothing was removed or renumbered.'])
p = find('Requirements added in revision 1.8 — FR-DA-I18N-09')
clone_after(p, ['Requirements added or amended in revision 1.9 are listed in Appendix N.'])

# ------------------------------------------------------------------ 1.4 terms
terms = table_with('Term')
add_rows(terms, [
    ['AI Use Case Link', 'The link of an AI Use Case to a process element it serves: its primary step, or a further step, task, macro process or end-to-end process. A use case serves every step reached through its links.'],
    ['Coverage of the Process Design', 'The list of every task of the process design with the AI Use Cases that support it, showing the tasks that have none.'],
    ['Model Precedence', 'The fixed order in which the model of an AI generation is chosen: the model of the AI Use Case, the Organization-level live model, the user’s personal connection, then the built-in engine.'],
    ['Draft Backup', 'The copy, kept in the user’s browser, of the rows of a Multi-Entry not yet saved, with the time it was taken and the server stamp each row was based on.'],
    ['Row Stamp', 'The server version marker of a saved row (for example its last update time), sent back with a change so that a change based on an older version is detected.'],
    ['Edit Conflict', 'A change based on an older version of a row than the one stored, or a restored draft row whose server record changed or disappeared since the draft was taken.'],
    ['Batch Operation', 'A bulk paste, import, update or delete sent in successive batches of rows, with its progress, cancellation and resumption.'],
    ['Import Session', 'The five stages of a file import — template, upload, column mapping, error repair, summary — from the chosen file to the committed rows.'],
    ['Leave Guard', 'The question asked when the user leaves a page that holds rows not saved: save and leave, discard and leave, or stay.'],
])

# ------------------------------------------------------------------ 3.4 AI governance architecture
_ps = paras(); _h = [i for i, x in enumerate(_ps) if x.text.startswith('3.4 AI Governance Architecture')][0]
p = next(x for x in _ps[_h + 1:] if x.text.strip() and x.runs)
clone_after(p, ['Revision 1.9: every AI generation, in every module, goes through the AI Use Case linked to the place where it is shown, so its activation, tier, Prompt Specification, logging and engine transparency always apply; a place served by no active use case offers no AI. The model of a generation is resolved in one documented order — the use case’s model, the Organization-level model, the user’s personal connection, the built-in engine — and the answer names the engine that produced it.'])

# ------------------------------------------------------------------ 4.4 AI Use Case Library
req(find('FR-DA-AI-01:'), 'FR-DA-AI-01', 'The system shall support full Create, Read, Update, Delete, Duplicate and version-revert on an AI Use Case catalog, each entry storing an id, name, tier (Assistive/Augmented), owning module, trigger, expected output, a human-checkpoint description, its links to process elements (FR-DA-AI-13) and versioned prompt-template content, gated by a dedicated AI-use-case-management capability. The owning module, trigger and expected output shall be derived from the primary linked step when the author leaves them empty, and stored with the entry, never computed only for display. Entries shall be created and edited in a dedicated form — the primary step chosen from the process design, every text written in each configured language, a justification required to save a change — never in a generic record editor.')
req(find('FR-DA-AI-07:'), 'FR-DA-AI-07', 'The system shall write an append-only AI Usage Log entry for every AI suggestion’s outcome (Proposed, Accepted, Edited, or Rejected), capturing the use case, Organization, Project, the record it applied to, the acting user, the specification version, the engine and model, and a timestamp; when a suggestion holds several items (for example several rows), each item accepted, edited or rejected — one by one or all at once — shall be logged, an item changed before its acceptance being logged as Edited; the log shall expose no edit or delete route.')
req(find('FR-DA-AI-13:'), 'FR-DA-AI-13', 'The system shall let an AI Use Case be linked to one primary step and to further steps, tasks, macro processes or end-to-end processes (AI Use Case Link), the use case serving every step reached through its links; and shall show the Coverage of the Process Design — every task with the AI Use Cases that support it, filterable by tier and by covered or not covered — with, for a task that has none, the suggestion of FR-DA-AIP-11.')
add_reqs('FR-DA-AI-20:', [
    ('FR-DA-AI-21', 'The system shall open each AI Use Case, from its row in the library, on one page showing its whole structure: identification (id, name, tier, module, primary step and task, trigger, expected output, human checkpoint, model task type, risk, approval, scope, origin), its links with the input fields it reads and the output fields it proposes, its activation for the Organization and the current Project, the twelve fields of its Prompt Specification with their completeness, the assembled prompt with a test run, the versions of the use case and of its specification with revert, and its usage log with the counts of each outcome.'),
    ('FR-DA-AI-22', 'The system shall show, above the AI Use Case Library, the number of use cases by tier, the number active in the Organization or the current Project, the number of custom use cases against the Solution Pack quota, the average completeness of the Prompt Specifications and the number of tasks of the process design supported by AI; it shall filter the library by tier, by active or inactive state and by standard or custom origin, and disable the creation of a custom use case, stating the quota, when the quota is reached.'),
    ('FR-DA-AI-23', 'The system shall produce every AI suggestion, in every module — step proposals, questionnaires, training, documents, project drafts and any other — through an AI Use Case linked to the place where it is shown: the effective activation of that use case shall be checked on the server before each generation (FR-DA-AI-05) and the generation logged under FR-DA-AI-07 and FR-DA-AIP-10. A place served by no active AI Use Case shall offer no AI action; a user entitled to manage prompts shall be offered there to suggest one (FR-DA-AIP-11).'),
    ('FR-DA-AI-24', 'The system shall resolve the model of every AI generation in a fixed and documented order — the model chosen for the AI Use Case (FR-DA-AI-17), else the Organization-level live model (FR-DA-AI-16), else the user’s personal connection (FR-DA-AI-08), else the built-in engine (FR-DA-AI-09) — and apply that order to every AI feature without exception. The settings screens shall state the difference between the Organization model (shared, administered, key stored encrypted on the server) and the personal connection (one user, key kept in the browser only).'),
    ('FR-DA-AI-25', 'The system shall create a custom, duplicated or AI-suggested AI Use Case deactivated, with the approval status Draft and a fully populated Prompt Specification, and activate it only after a person reviews it (FR-DA-AIP-06, -11); a duplicate shall record the use case it is based on and copy its Prompt Specification as its own Version 1; a seeded entry may be duplicated and deactivated, never deleted (FR-DA-AI-14).'),
    ('FR-DA-AI-26', 'The system shall present an AI proposal of several items with each item editable in place and the actions Accept, Reject, Accept all and Reject all, together with the label “AI-generated — to be reviewed by a person”, the tier, the AI Use Case, the engine and, when the live model was not used, the reason (FR-DA-AIP-12), the references retrieved (FR-DA-AI-11), the human checkpoint and a link to the exact prompt (FR-DA-AI-18).'),
])

# ------------------------------------------------------------------ 4.14, 4.40, 4.42, 4.43
add_reqs('FR-DA-I18N-09:', [('FR-DA-I18N-10', 'The system shall store a reference to a shared element (a function, a role, a unit, a controlled-list value) by its language-independent identity, or with its names in every configured language, never as the label of the user’s current language, so that a record reads the same and matches the same element in every language; saving a record shall keep the stored translations of every multilingual value the user did not change.')])
p = find('FR-DA-AIP-07:'); req(p, 'FR-DA-AIP-07', p.text.split(': ', 1)[1].rstrip('.') + '; every seeded specification shall be complete (100 %), its Examples holding at least one input and output pair built from the form of the linked step.')
add_reqs('FR-DA-SFM-07:', [
    ('FR-DA-SFM-08', 'The system shall choose the Step Form Kind from the meaning of the step, not only from its object: in particular, a step that maps functions to decision levels shall be a Function × Level Matrix — one row per function of the Organization, one tick column per decision level, an action adding every function not yet listed and an AI proposal derived from the OBS — never a generic list of items with a category and a description.'),
    ('FR-DA-SFM-09', 'The system shall, when a step is reopened (FR-DA-AUD-05), clear every completion mark of that step — its step record and the step list of its task — so that the step reads as open everywhere, and record the reopening with its justification.'),
])
last = find('FR-DA-DFP-08:')
clone_after(last, ['FR-DA-DOC-12: ', 'The system shall produce Word, Excel and PowerPoint files that open in their reference applications without a repair prompt: each package shall pass Office Open XML schema validation, every shape and drawing object of a slide shall have a unique identifier, every chart axis referenced by a series shall be declared, and the package shall hold no directory entries; a release shall check every generated file type automatically.'])

# ------------------------------------------------------------------ 4.49 Multi-Record Data Entry: amendments
p = find('FR-DA-MRE-05:'); req(p, 'FR-DA-MRE-05', 'The system shall offer, in a column pinned at the end of each row and revealed on hover and on keyboard focus, the Duplicate row, Insert row below and Delete row actions as 24-pixel line icons, with any other action in an overflow menu. A duplicated row shall copy every value and receive focus on its first editable cell; a deleted row shall be restorable for at least 5 seconds — 10 seconds for a deletion of several rows — from an Undo notification and with Ctrl/Cmd + Z. The deletion of several selected rows shall be confirmed in an accessible dialog stating the number of rows and the Undo period, never stating that the deletion cannot be undone.')
p = find('FR-DA-MRE-08:'); req(p, 'FR-DA-MRE-08', 'The system shall validate a cell when the user leaves it after changing it — a value typed and then cleared counts as a change — never on every keystroke, never when the user only crosses an untouched cell, never on a new empty row or a new row opened in the Row Editor, and never only on submission; re-validate it on change after a first error; show the error under the cell in 12-pixel Open Sans SemiBold with a 1-pixel border in the Critical status color on its start edge; never reset the value typed; and reflect the error in the row status.')
p = find('FR-DA-MRE-11:'); req(p, 'FR-DA-MRE-11', p.text.split(': ', 1)[1].rstrip('.') + '. While a sort is applied, rows not yet saved shall stay at the end, in the order they were added, so that a row never moves while it is typed.')
p = find('FR-DA-MRE-14:'); req(p, 'FR-DA-MRE-14', 'The system shall not use, for multi-record entry, a dialog opened and closed for each row, repeated form cards for tabular data, a wizard for typing rows, or horizontal scrolling without a sticky first column. A file import (FR-DA-MRE-30) is not the typing of rows and may be organized in stages.')
p = find('FR-DA-MRE-18:'); req(p, 'FR-DA-MRE-18', p.text.split(': ', 1)[1].replace('a “Return to page” button always visible at the end of the workspace header', 'one return button always visible at the end of the workspace header, named after the place it returns to (for example “Back to <task name>”, its accessible name including “Return to page”), the identifier and status of that place being shown in the header'))
p = find('FR-DA-MRE-22:'); req(p, 'FR-DA-MRE-22', p.text.split(': ', 1)[1].rstrip('.') + '. The server shall check every row of a paste or an import with the same rules as a typed row, including the required values of a new row; an overwrite is checked on the cells it changes.')

# ------------------------------------------------------------------ 4.49: new requirements, in three groups after FR-DA-MRE-23
lead = find('Paste of complete records from external files.')
anchor = find('FR-DA-MRE-23:')
def intro_after(ref, head, rest):
    el = copy.deepcopy(lead._p); ref._p.addnext(el); p = Paragraph(el, d)
    set_runs(p, [head, rest] if len(lead.runs) >= 2 else [head + rest]); return p
g1 = intro_after(anchor, 'Finding errors and never losing work. ', 'Errors are found and fixed wherever they are, and work typed is never lost — not by a refresh, a crash, a lost connection, another user’s change or leaving the page.')
REQ = find('FR-DA-MRE-23:')
def mre_after(ref, items):
    last = ref
    for rid, text in items:
        el = copy.deepcopy(REQ._p); last._p.addnext(el); last = Paragraph(el, d); set_runs(last, [rid + ': ', text])
    return last
last = mre_after(g1, [
    ('FR-DA-MRE-24', 'The system shall make every error findable: an Issues list in the toolbar giving the number of errors and, for each one, its row, its field and its message, each opening its cell (or the Row Editor for a hidden field); a “Rows with errors” filter; an error marker in the status column of every invalid row, so that an error scrolled out of view stays visible; and a Retry action per failed row and “Retry all failed”.'),
    ('FR-DA-MRE-25', 'The system shall show the save state of the Multi-Entry at all times in its footer — “All changes saved”, the number of unsaved rows or the number of rows with errors — offer a Save all action only while changes are pending, and offer Discard, confirmed in an accessible dialog, which returns changed rows to their saved values and removes new unsaved rows; no confirmation or alert of the browser itself (alert, confirm) shall be used.'),
    ('FR-DA-MRE-26', 'The system shall keep a Draft Backup of the pending rows of every Multi-Entry in the user’s browser, versioned and timestamped, written on every change and removed once nothing is pending; on return to the Multi-Entry it shall restore the draft with the notice “Draft restored from <date and time>” and a Discard the draft action. Every saved row shall carry its Row Stamp; a save based on an older stamp shall be refused as an Edit Conflict naming the user who changed the row, with the choice to reload the row or overwrite it with the user’s version, and a restored draft row whose record changed or was deleted since shall be listed with, for each one, the choice to keep the user’s version or take the server version.'),
    ('FR-DA-MRE-27', 'The system shall queue, not fail, a save that cannot reach the server: the row shall show “Waiting for the connection”, a banner shall state that the changes will be saved when the connection returns, the save shall be retried with exponential backoff (for example 1, 2, 4 seconds up to 30 seconds) and at once when the device reports the connection again; a save refused by the server (validation, rights, lock, conflict) shall not be retried by itself.'),
])
g2 = intro_after(last, 'Large volumes, import and export. ', 'A Multi-Entry stays fast with thousands of rows, accepts a file as well as a paste, and gives its rows back as a file.')
last = mre_after(g2, [
    ('FR-DA-MRE-28', 'The system shall render, in a Multi-Entry of more than a few dozen rows, only the visible rows and a small buffer (virtual rows), inside a scroll area of fixed height, with uniform row heights while long text is not wrapped and a “Wrap long text” choice; continuous scrolling shall be the default for entry, and pages (“Page X of Y”, FR-DA-MRE-13) shall remain available as a view choice for browsing; the ARIA row and column indexes shall stay consistent with the rows rendered.'),
    ('FR-DA-MRE-29', 'The system shall run a bulk paste, import, update or delete as a Batch Operation: batches of 200 to 500 rows (configurable), each saved before the next, a failed batch not stopping the others, a progress indicator announced to assistive technologies with a Cancel action between batches, and a Resume action continuing from the first batch not done; a bulk change made on screen (for example a field set on every selected row) shall be sent about two seconds after the last change.'),
    ('FR-DA-MRE-30', 'The system shall import rows from a file in an Import Session of five stages shown in a stepper: (1) template — the formats accepted (spreadsheet workbook, delimited text, paste), the limits, and a downloadable template with the column titles, required ones marked, and an example row; (2) upload — drag and drop, file picker or pasted text, with the type, size, row count and text encoding checked and the first ten rows previewed; (3) column mapping — titles recognized, columns matched by position otherwise, every match changeable with sample values shown, and the next stage refused while a required field has no column; (4) error repair — the rows needing attention listed first with their count, each cell corrected in place and checked again at once, duplicates within the file and against the existing rows flagged, guided corrections for the common errors (fill an empty required column, replace a value not in a list, leave the duplicates out) and any row left out on request; (5) summary — the rows ready, with a warning, with errors and left out, the choice to leave rows with errors out or import them as rows to correct, an optional value given to every imported row, the commit as a Batch Operation (FR-DA-MRE-29) and its result with an Undo action for at least 60 seconds. Cancel shall be offered at every stage, confirmed once data was loaded, and moving between stages shall keep everything entered.'),
    ('FR-DA-MRE-31', 'The system shall export the current view of a Multi-Entry — its filters, sort and visible columns — or only the selected rows, as delimited text (UTF-8 with byte-order mark) and as a spreadsheet workbook, with the grid’s column titles and display values, the file named after the Multi-Entry’s parent and the date (<parent>-<yyyy-mm-dd>), and spreadsheet formulas neutralized (NFR-DA-SEC-21).'),
])
g3 = intro_after(last, 'Readable on every screen and safe to leave. ', 'A Multi-Entry reads without horizontal scrolling on a common screen and on a phone, and nothing is lost when the user leaves the page.')
mre_after(g3, [
    ('FR-DA-MRE-32', 'The system shall ask, when the user leaves a page that holds rows not saved — a link, the browser Back action, closing or switching a panel, closing the browser tab — with three choices: Save and leave, Discard and leave, or Stay on the page, stating the number of rows and of rows with errors and keeping the user on the page when rows could not be saved; returning from the Full-Screen Entry Workspace to the page shall never ask, nothing being lost there (FR-DA-MRE-18).'),
    ('FR-DA-MRE-33', 'The system shall keep a Multi-Entry readable without horizontal scrolling: when it has more than six columns, optional long-text columns shall be shown in the Row Editor rather than the table until the user shows them (the column chooser stating it); the footer shall show the totals of the number columns, the number of rows shown and selected; the Row Editor shall offer Save and new; and an empty Multi-Entry shall offer Add the first row, Import, Paste and, where an AI Use Case serves it, Propose with AI.'),
    ('FR-DA-MRE-34', 'The system shall show, below a phone breakpoint (768 pixels wide by default), no grid but a read-only list of the rows with their status and first fields, an “Edit one by one” action opening the Row Editor with previous, next and Save and new, Add row and Import; errors shall be shown on each listed row.'),
    ('FR-DA-MRE-35', 'The system shall undo and redo, with Ctrl/Cmd + Z and Ctrl/Cmd + Shift + Z and with toolbar actions, every change of a Multi-Entry as one step each — a cell edit, an added, inserted or duplicated row, a deletion, a value set on the selected rows, a fill down and a paste or an import — the server following the rows (a row brought back by Undo is restored or created again; a paste or an import is undone as its audited operation).'),
])

# ------------------------------------------------------------------ Table 4.49-1
kb = table_with('Key', 'Ctrl/Cmd + Shift + F')
for r in kb.rows:
    if r.cells[0].text.startswith('Ctrl/Cmd + Z'): set_cell(r.cells[0], 'Ctrl/Cmd + Z'); set_cell(r.cells[1], 'Undo the last change — a cell edit, a paste, a duplication, a deletion, a value set on several rows, a fill down (FR-DA-MRE-05, 21, 35); inside a cell being typed, the field’s own undo applies first')
add_rows(kb, [
    ['Ctrl/Cmd + Shift + Z, or Ctrl + Y', 'Redo the change undone last (FR-DA-MRE-35)'],
    ['Ctrl/Cmd + ’ (apostrophe), or Ctrl/Cmd + Shift + D', 'Fill down: copy into the cell the value of the cell above'],
    ['Left / Right arrows at the start or end of the text', 'Move to the previous or next cell'],
    ['Page Up / Page Down', 'Move up or down ten rows in the same column'],
    ['Ctrl/Cmd + Home / Ctrl/Cmd + End', 'Move to the first or last row in the same column'],
    ['Ctrl/Cmd + A', 'Select every row shown, after the text of the cell when it holds text'],
    ['Shift + click on a row selection box', 'Select the range of rows from the last selected row (FR-DA-MRE-12)'],
])

# ------------------------------------------------------------------ Section 5
add_reqs('NFR-DA-PERF-13:', [('NFR-DA-PERF-14', 'A Multi-Entry of 10,000 rows shall open within 2 seconds and scroll and accept typing without visible delay (a keystroke shown within 50 milliseconds), and an import of 1,000 rows shall be committed within 10 seconds, at the 95th percentile.')])
add_reqs('NFR-DA-SEC-21:', [('NFR-DA-SEC-22', 'An imported file shall be treated as untrusted input: its type checked by extension and by content, its size and row count bounded by configurable limits, its text read as UTF-8 or, when it is not valid UTF-8, in a stated fallback encoding that the user can change; a spreadsheet workbook shall be read on the server keeping only cell text (the last value of a formula); the rights, quotas and checks of a paste (FR-DA-MRE-22) shall apply to every imported row.')])
p = find('NFR-DA-REL-10:'); req(p, 'NFR-DA-REL-10', 'Inline data entry shall never lose a row: every row typed shall be saved, or kept with its pending status, across navigation, validation failure, panel change, re-render, refresh, crash of the browser and loss of connection (FR-DA-MRE-09), by the Draft Backup (FR-DA-MRE-26), the offline queue (FR-DA-MRE-27) and the Leave Guard (FR-DA-MRE-32).')
add_reqs('NFR-DA-REL-10:', [('NFR-DA-REL-11', 'A save shall never overwrite a newer version of a record without the user’s explicit choice: every save of a row shall be checked against its Row Stamp (FR-DA-MRE-26).')])
add_reqs('NFR-DA-UX-20:', [('NFR-DA-UX-21', 'Every Multi-Entry shall follow the W3C ARIA grid pattern: grid, row, column header and grid cell roles, row and column indexes kept consistent with virtual rows and pages, the sort state of each column announced, a live region announcing the rows added, deleted, saved and failed, batch progress and a restored draft; errors shown with an icon and text, never by color alone; focus moved to a sensible cell after an addition or a deletion; focus trapped only in dialogs; and animations removed when the user prefers reduced motion.')])
add_reqs('NFR-DA-I18N-06:', [('NFR-DA-I18N-07', 'Files exported or downloaded shall keep non-Latin text intact: delimited text in UTF-8 with a byte-order mark, and a file name with non-Latin characters sent in its encoded form (RFC 6266, filename*=UTF-8\'\'…) with a Latin fallback, so that a download never fails because of the language of its name.')])
p = find('NFR-DA-MAINT-04:'); req(p, 'NFR-DA-MAINT-04', p.text.split(': ', 1)[1].rstrip('.') + '; and no module shall produce an AI suggestion, even from the built-in engine, outside an AI Use Case (FR-DA-AI-23).')
add_reqs('NFR-DA-MAINT-10:', [('NFR-DA-MAINT-11', 'An upgrade shall migrate the data of an existing installation in place at its first start — changed entity definitions, completed catalogs, new fields with their derived values — each migration idempotent, versioned, recorded with what it changed, and run once; an upgrade shall never require the data to be reseeded, and its release notes shall state that the server is restarted after the files are replaced.')])
add_reqs('NFR-DA-PORT-04:', [('NFR-DA-PORT-05', 'The continuous-integration build shall run automated tests of the multi-record entry logic (validation, undo and redo, batching with failure, cancellation and resumption, draft restore and conflicts, column mapping and error repair, export, retries) and an end-to-end import from file upload to commit and undo; test suites that share one database shall run one after another, so that no test fails for a lock.')])

# ------------------------------------------------------------------ 6 data model
dm = table_with('Entity', 'PasteOperation')
for r in dm.rows:
    k = r.cells[0].text.strip()
    if k == 'AIUseCaseLink': set_cell(r.cells[1], 'The link of an AI Use Case to a process element it serves — its primary step, or a further step, task, macro process or end-to-end process — with the input fields it reads and the output fields it proposes.')
    if k.startswith('AIUseCase /'): set_cell(r.cells[1], 'Governed AI Use Case metadata (including the stored owning module, trigger and expected output, the use case it is based on and its origin: standard, manual, duplicate or AI-suggested), its versioned content, and its per-Project tri-state activation override.')
add_rows(dm, [
    ['ImportSession', 'One file import into a Multi-Entry: the source (file name, type, size, encoding, sheet), the column-to-field mapping, the rows with their repair state and the PasteOperations that committed them.'],
    ['BatchOperation', 'A bulk paste, import, update or delete sent in batches: target, batch size, batches done and failed with their errors, cancelled or finished, and the batch to resume from.'],
    ['DraftBackup', 'Kept in the user’s browser, not on the server: the pending rows of one Multi-Entry for one user, with its version, the time it was taken and the Row Stamp each row was based on.'],
])

# ------------------------------------------------------------------ 7.1 and 7.2
p = find('Revision 1.8 adds to every Multi-Entry an Expand action')
clone_after(p, ['Revision 1.9 adds an AI Use Case page and form, a coverage view of the process design and, on the steps, the tier, AI Use Case, engine and sources of every AI proposal; in every Multi-Entry, an Issues list, a “Rows with errors” filter, Undo and Redo, Import and Export in the toolbar, a footer with totals and the save state, banners for a restored draft and for an offline queue, a batch progress bar, dialogs for edit conflicts, deletion and leaving with unsaved rows, a five-stage import with a stepper and, on phones, a list with one-by-one editing.'])
p = find('AI Use Cases: catalog CRUD'); set_runs(p, ['AI Use Cases: catalog CRUD with duplicate, links and linkable process elements, library figures, coverage of the process design, activation, per-Project override, version history and revert, append-only usage log; step proposals through the AI Use Case linked to the step (FR-DA-AI-21 to 26).'])
p = find('Bulk entry: validate a batch of pasted rows')
clone_after(p, ['Bulk import and export: read a spreadsheet workbook (sheets and cell text), export the given view as a workbook, delete a batch of rows with a result per row, read the import limits and batch size; a row update carries its Row Stamp and answers a conflict when the row changed (FR-DA-MRE-26 to 31, NFR-DA-SEC-22).'])

# ------------------------------------------------------------------ Appendix A, K
ca = table_with('Area', 'Fourth-round and realigned families')
add_rows(ca, [
    ['AI Use Case Library and governed generation', 'FR-DA-AI-01, 07, 13, 21 – 26; FR-DA-AIP-07; NFR-DA-MAINT-04', 'Use case created, edited, duplicated and deleted in its form and shown on its page; coverage view; every AI action traced to an active use case in the usage log; model precedence tested with and without each model.', 'New or amended in revision 1.9: to be assessed for every application.'],
    ['Multi-Entry at scale and without loss', 'FR-DA-MRE-05, 08, 11, 14, 18, 22, 24 – 35; NFR-DA-PERF-14; NFR-DA-REL-10, 11; NFR-DA-UX-21; NFR-DA-SEC-22', 'Automated tests of NFR-DA-PORT-05; a 10,000-row table timed; a draft restored after a refresh; an edit conflict and an offline queue reproduced; an import of a file with errors repaired and undone; the leave guard and the phone list checked.', 'New or amended in revision 1.9: to be assessed for every application.'],
    ['Data rules learned in acceptance', 'FR-DA-SFM-08, 09; FR-DA-I18N-10; FR-DA-DOC-12; NFR-DA-I18N-07; NFR-DA-MAINT-11', 'A matrix step typed in each language; a reopened step read as open; every generated Office file validated; a download with a non-Latin name; an upgrade over an existing database without reseeding.', 'New in revision 1.9.'],
])
kc = table_with('Area', 'Paste of records')
add_rows(kc, [
    ['AI use cases', 'Each use case opens on its page from the library; created and edited in its form with its step and links; coverage view lists tasks without AI; quota shown.', 'FR-DA-AI-01, 13, 21, 22, 25'],
    ['Governed AI', 'No AI action where no active use case serves the place; every proposal shows tier, use case, engine, reason, sources and prompt; each outcome logged.', 'FR-DA-AI-07, 23, 24, 26'],
    ['Multi-Entry errors', 'No error on a new empty row; errors after a change; Issues list and “Rows with errors” filter; retry per row and for all.', 'FR-DA-MRE-08, 24'],
    ['Multi-Entry saving', 'Save state always shown; Save only when pending; draft restored after a refresh; conflict offered on a stale save; offline queue retried.', 'FR-DA-MRE-25 – 27, NFR-DA-REL-10, 11'],
    ['Large tables', '10,000 rows scroll and type without delay; batches with progress, Cancel and Resume.', 'FR-DA-MRE-28, 29, NFR-DA-PERF-14'],
    ['Import and export', 'Five-stage import with template, checks, mapping, repair and Undo; CSV and workbook export of the view or selection.', 'FR-DA-MRE-30, 31, NFR-DA-SEC-22'],
    ['Leaving and phones', 'Leave guard with three choices; no question when returning from full screen; phone list with one-by-one editing; no horizontal scrolling with many columns.', 'FR-DA-MRE-32 – 34'],
    ['Undo and keys', 'Ctrl/Cmd + Z and Shift + Z on every change; fill down; Page Up/Down; Ctrl/Cmd + A; new rows stay in place while sorted.', 'Table 4.49-1, FR-DA-MRE-11, 35'],
    ['Office files and upgrade', 'Generated Word, Excel and PowerPoint files open without repair; an upgrade migrates the data in place.', 'FR-DA-DOC-12, NFR-DA-MAINT-11'],
])

# ------------------------------------------------------------------ Appendix N (copy of Appendix M's structure)
hM = find('Appendix M — Revision 1.8 Change Log'); introM = find('Revision 1.8 keeps every earlier requirement ID.')
_e = introM._p.getnext()
while _e is not None and _e.tag != qn('w:tbl'): _e = _e.getnext()
tM = Table(_e, d)  # the table of Appendix M itself
last_el = tM._tbl
hN = copy.deepcopy(hM._p); last_el.addnext(hN); hN = Paragraph(hN, d); set_runs(hN, ['Appendix N — Revision 1.9 Change Log'])
iN = copy.deepcopy(introM._p); hN._p.addnext(iN); iN = Paragraph(iN, d)
set_runs(iN, ['Revision 1.9 keeps every earlier requirement ID; nothing was removed or renumbered. It comes from the acceptance of a reference implementation and stays application agnostic. Amended requirements keep their ID and are restated in full in their section; the amendments only add obligations or narrow an exception.'])
tN = copy.deepcopy(tM._tbl); iN._p.addnext(tN); tN = Table(tN, d)
for tr in list(tN._tbl.findall(qn('w:tr')))[2:]: tN._tbl.remove(tr)
rowsN = [
    ['Cover, header, document control', 'Version', 'Version 1.9 (October 2026); supersedes revision 1.8.'],
    ['1.1, 1.2, 1.6, 4', '1 paragraph each', 'Revision 1.9 purpose, scope and overview; pointer to this appendix.'],
    ['1.4 Definitions', '9 terms (new)', 'AI Use Case Link, Coverage of the Process Design, Model Precedence, Draft Backup, Row Stamp, Edit Conflict, Batch Operation, Import Session, Leave Guard.'],
    ['3.4 AI Governance Architecture', '1 paragraph (new)', 'One governed path for every AI generation; model precedence.'],
    ['4.4 AI Use Case Library', 'FR-DA-AI-01, 07, 13 (amended)', 'Stored derived fields and dedicated form; Proposed outcome and per-item logging with specification version, engine and model; several links and the coverage view.'],
    ['4.4 AI Use Case Library', 'FR-DA-AI-21 – 26 (new)', 'Use case page; library figures and filters; every generation through a linked, active use case; model precedence; draft by default for new, duplicated and suggested use cases; review of multi-item proposals.'],
    ['4.14 Localization', 'FR-DA-I18N-10 (new)', 'Language-independent references; translations kept on save.'],
    ['4.40 Prompt Specification', 'FR-DA-AIP-07 (amended)', 'Seeded specifications 100 % complete, Examples built from the step form.'],
    ['4.42 Typed Step Forms', 'FR-DA-SFM-08, 09 (new)', 'Form kind from the meaning of the step (Function × Level Matrix); reopening clears every completion mark.'],
    ['4.43 Documents', 'FR-DA-DOC-12 (new)', 'Office files open without repair; validated automatically.'],
    ['4.49 Multi-Record Data Entry', 'FR-DA-MRE-05, 08, 11, 14, 18, 22 (amended)', 'Undo period stated, Insert row below; validation only after a change; unsaved rows not moved by a sort; file import exempted from the no-wizard rule; return button named after its destination; server checks equal to the grid’s.'],
    ['4.49 Multi-Record Data Entry', 'FR-DA-MRE-24 – 35 (new)', 'Issues list and error filter; save state and Discard; Draft Backup and Edit Conflicts; offline queue; virtual rows and optional pages; Batch Operations; five-stage import; export; Leave Guard; readability without horizontal scrolling; phone list; undo and redo of every change.'],
    ['4.49, Table 4.49-1', '7 rows (new); 1 row (amended)', 'Redo; fill down; left and right arrows; Page Up and Down; first and last row; select all; range selection; Ctrl/Cmd + Z for every change.'],
    ['5.1, 5.2, 5.3', 'NFR-DA-PERF-14, NFR-DA-SEC-22, NFR-DA-REL-11 (new); NFR-DA-REL-10 (amended)', 'Performance with 10,000 rows and 1,000 imported rows; import as untrusted input; no overwrite of a newer version; no row lost after a crash.'],
    ['5.5, 5.6', 'NFR-DA-UX-21, NFR-DA-I18N-07 (new)', 'ARIA grid pattern for every Multi-Entry; non-Latin text and file names kept intact.'],
    ['5.7, 5.8', 'NFR-DA-PORT-05, NFR-DA-MAINT-11 (new); NFR-DA-MAINT-04 (amended)', 'Automated tests of multi-record entry run one suite at a time; in-place data migration on upgrade; no AI suggestion outside an AI Use Case.'],
    ['6 Common Data Model', '3 entities (new); 2 (amended)', 'ImportSession, BatchOperation, DraftBackup; AIUseCase and AIUseCaseLink extended.'],
    ['7.1, 7.2', '1 paragraph; 2 interface families', 'Screens of revision 1.9; AI use case and bulk import and export interfaces.'],
    ['Appendices A, K', '3 and 9 rows (new)', 'Conformance areas and release checks of revision 1.9.'],
    ['Appendix N (new)', 'Change log', 'This change log.'],
]
add_rows(tN, rowsN)
tN._tbl.remove(tN._tbl.findall(qn('w:tr'))[1])

# The last line of the table of contents also closes the TOC field: keep only the field end, so the refreshed TOC has no stale line.
for e in body.iterchildren():
    if e.tag != qn('w:p'): continue
    p = Paragraph(e, d)
    if p.style is not None and p.style.name.upper().startswith('TOC') and e.find('.//' + qn('w:fldChar')) is not None and any(fc.get(qn('w:fldCharType')) == 'end' for fc in e.iter(qn('w:fldChar'))) and p.text.strip():
        for ch in list(e):
            if ch.tag == qn('w:pPr'): continue
            if ch.tag == qn('w:r') and ch.find(qn('w:fldChar')) is not None and ch.find(qn('w:fldChar')).get(qn('w:fldCharType')) == 'end': continue
            e.remove(ch)
d.save(OUT)
# header: version
z = zipfile.ZipFile(OUT); tmp = OUT + '.tmp'; zo = zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED)
for it in z.infolist():
    data = z.read(it.filename)
    if re.match(r'word/header\d*\.xml', it.filename): data = data.replace('Version 1.8'.encode(), 'Version 1.9'.encode())
    zo.writestr(it, data)
zo.close(); z.close(); shutil.move(tmp, OUT)
print('written', OUT)
