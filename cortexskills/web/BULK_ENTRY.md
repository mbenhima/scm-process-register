# Bulk entry of multi-record data (Multi-Entry)

Every table where several records of the same kind are typed — the record tables of the task steps, the
matrices, the registers — uses one grid: `web/src/components/bulk/`. It follows the Standard Application SRS
(Section 4.49, FR-DA-MRE-01 to 23; NFR-DA-REL-10; NFR-DA-FOC-01 to 13) and the usual practice of enterprise grids
(SAP Fiori, Oracle Redwood, GitHub, the W3C ARIA grid pattern).

## Architecture note

| Topic | Choice and reason |
|---|---|
| Stack | The application's own stack: React 18 and Vite, plain JavaScript modules, CSS with the design tokens (`styles/tokens.css`). No commercial grid (AG Grid, Handsontable) and no new dependency: the grid is small, so it can follow the SRS keyboard map and focus rules exactly. |
| Files | `BulkGrid.jsx` (toolbar, view, keyboard, paste, export, footer), `GridParts.jsx` (rows, cells, headers, virtual rows), `useBulkRows.js` (row state, saving, drafts, undo, retries, batches), `RowEditor.jsx`, `GridDialogs.jsx`, `ImportWizard.jsx`, `MobileList.jsx`. Pure logic in `web/src/lib/bulk/` (validation, history, drafts, batches, network, import, export), tested on its own. |
| Data flow | Rows come from the page (for a step: `GET /tasks/:id/steps`). The grid keeps its own draft of each row (`_key`, `id`, `data`, `base` = server stamp, `status`, `errors`); the draft wins over server data while a row is being edited (NFR-DA-FOC-10). Saving goes through the page's REST calls; bulk operations go through `POST /bulk-entry/apply`, `/bulk-entry/delete`, `/bulk-entry/parse` and `/bulk-entry/export`. |
| Save strategy | A row is checked when the user leaves a cell (never while typing) and saved about 500 ms after the user leaves the row; its status shows in the first column (changed, saving, saved, error, waiting for the connection). Bulk changes (set a field on the selection) are sent 2 s after the last change, in batches. The typed value is never reset: a refused save keeps the value with the error. A deleted row disappears at once and is deleted on the server after 10 s, so Undo can cancel it; a failed delete puts the row back with its error. A **Save all** button appears only when something is pending. |
| Concurrency | Each saved row carries its server stamp; a save based on an older stamp is refused (`409 err.rowConflict`) and the row offers **Overwrite with my version**. A browser draft restored after the server changed lists the conflicts, row by row (keep mine or take the server version). |
| Drafts | Pending rows are written to the browser (`localStorage`, key per table, task, step and user, versioned and timestamped) on every change. On return they are restored with the notice “Draft restored from <time>” and a **Discard the draft** action. |
| Offline | A save that cannot reach the server is queued, not failed: the row shows “Waiting for the connection”, a banner says the changes will be saved, and the save is retried with exponential backoff (1 s, 2 s, 4 s … 30 s) and at once when the browser is back online. |
| Paging | **Continuous scrolling with virtual rows** by default: bulk entry is a continuous flow, and rendering only the visible rows (plus a buffer) keeps typing fast with thousands of rows; rows have a uniform height while long text is not wrapped. **Pages** (“Page X of Y”, 25 to 250 rows) can be switched on in the View menu for browsing, as required by FR-DA-MRE-13; turning text wrapping on also turns virtual rows off. |
| Batching | Paste, import, bulk delete and bulk update are sent in batches of 250 rows (`IMPORT_BATCH`, 50 – 500); each batch is saved before the next; a failed batch does not stop the others; a progress bar shows the batches with **Cancel**, and **Resume** continues from the first batch not done. |
| Accessibility | `role="grid"` with `aria-rowcount`, `aria-colcount`, `aria-rowindex` and `aria-colindex` kept consistent with virtual rows; column headers with `aria-sort`; a live region announces added, deleted, saved and failed rows, batch progress and restored drafts; errors are shown with an icon and text, never by colour alone; focus is kept in the active cell and moved to a sensible cell after adding or deleting; focus is trapped only in dialogs; `prefers-reduced-motion` turns animations off. |
| Phones | Below 768 px no grid is shown: the rows are listed, **Edit one by one** opens the Row Editor (previous, next, Save and new), and Import stays available. |
| Theme | The application follows its graphical charter (light backgrounds only); the grid uses the design tokens, so a dark theme can be added in `tokens.css` without changing the grid. |

## Toolbar and footer

Add row · Duplicate (the selected rows, or the previous row) · Delete (the selected rows, with a confirmation and
Undo) · Search · Filter (field, operator, value, as chips) · Rows with errors · Issues (list of every error, each one
opens its cell) · Import · Export (CSV or Excel, the current view or the selected rows, named
`<parent>-<yyyy-mm-dd>`) · Paste · Copy · Undo · Redo · View (columns, wrap long text, pages, density, reset) ·
Full screen. Column headers sort in three steps and can be dragged to reorder or resized from their edge.
The footer shows the totals of the number columns, the row count, the selection, the save status
(“All changes saved”, “N unsaved”, “N rows with errors”), Retry all failed, Discard and Save all.

## Keyboard shortcuts

The SRS keyboard map (Table 4.49-1) comes first; where a shortcut is taken by the SRS, the spreadsheet habit is
offered on another key.

| Key | Action |
|---|---|
| Tab / Shift+Tab | Next / previous cell |
| Enter | Commit the cell and move down; in the last row, add a new row |
| Escape | Cancel the edit of the cell; with nothing to cancel, leave the full screen |
| Arrow keys | Move between cells (left and right at the start or end of the text) |
| Page Up / Page Down | Up / down 10 rows |
| Ctrl/Cmd+Home / End | First / last row; Home / End on a tick box: first / last column |
| Ctrl/Cmd+Enter | Commit and save the current row |
| Ctrl/Cmd+S | Save every pending row |
| Ctrl/Cmd+D | Duplicate the current row (SRS) |
| Ctrl/Cmd+' or Ctrl/Cmd+Shift+D | Fill down: copy the value of the cell above |
| Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z (or Ctrl+Y) | Undo / redo the last change, paste, duplication or deletion (inside a cell being typed, the browser's own undo applies first) |
| Ctrl/Cmd+A | Select every row shown (after the text of the cell, if any) |
| Ctrl/Cmd+C / Ctrl/Cmd+V | Copy the selected rows with their titles / paste rows from Excel, Word or a web page |
| Shift+click on a row tick box | Select a range of rows |
| Ctrl/Cmd+Shift+F | Open the table full screen |

## Leaving with unsaved rows

Returning from the full screen to the page never asks anything: it is the same table, nothing is lost (FR-DA-MRE-18).
Leaving the page itself — a menu link, the browser Back button, closing or switching the task panel, closing the
tab — asks when rows are not saved: **Save and leave**, **Discard and leave** or **Stay on the page**. Rows that
cannot be saved (errors) keep the user on the page with the count. The full-screen header names the place the user
returns to (“Back to <task>”) with its identifier and status.

## Import workflow

1. **Template** — the formats (.xlsx, .csv/.tsv/.txt, paste), the limits, an Excel or CSV template with the column
   titles (required ones marked *) and an example row.
2. **File** — drag and drop, file picker or paste; type, size (`IMPORT_MAX_BYTES`, 5 MB) and row count
   (`IMPORT_MAX_ROWS`, 10,000) are checked; text is read as UTF-8, or Windows-1252 when it is not valid UTF-8 (said
   on screen; the encoding can be chosen); Excel files are read on the server (first sheet or the chosen one, cell
   text only); the first 10 rows are previewed.
3. **Columns** — titles are recognized (with or without *), otherwise columns are matched by position; each source
   column shows sample values and can be matched to another field or ignored; Next stays disabled while a
   required field has no column.
4. **Corrections** — only the rows needing attention are listed by default (“N rows need attention”, Show all);
   each cell is fixed in place and checked again at once; duplicates within the file and against the table are
   flagged; **Fix all at once** fills an empty required column, replaces a value that is not in a list, or leaves out
   the duplicates; a row can be left out.
5. **Summary** — rows ready, with a warning, with errors, left out; rows with errors are left out or imported as rows
   to correct in the table; one value can be given to every imported row (a category, to find them again); **Import**
   saves in batches; the result offers **Undo** for 60 seconds.

Cancel is available at every stage, with a confirmation once something was loaded; moving back and forth between
stages keeps everything.

## Tests

- `web`: `npm test` — validation, undo and redo, batching (isolation, cancel, resume), drafts and conflicts, import
  mapping and repair, export, retries.
- `server`: `npm test` — the security suite and an end-to-end import: Excel upload and parsing, mapping, preview,
  commit as one audited operation, export, stale overwrite refused, batched delete and Undo.
