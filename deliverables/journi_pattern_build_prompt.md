# Build Prompt: [Application Name] — a journi-Pattern SaaS Platform

Use this prompt to brief an AI coding assistant (or a dev team) to build a new
application that follows the architecture, rigor, and deliverable pattern
established by **journi**, a Change Management SaaS demo platform. Sections
marked `[FILL IN]` are the configuration inputs for the new project — the rest
is the reusable pattern.

---

## 0. Configuration — Input Files

List every source document the build must be faithful to. The assistant
should treat these as ground truth — every screen, field, and rule in the
app and its user guide must trace back to one of these files, not be
invented or assumed.

| # | File | What it defines |
|---|---|---|
| 1 | `[FILL IN — e.g. functional-spec.md]` | Functional requirements: modules, features, CRUD rules, computed metrics |
| 2 | `[FILL IN — e.g. data-model.md / schema.sql]` | Entities, fields, relationships |
| 3 | `[FILL IN — e.g. process-catalog.md]` | Business processes / workflows the app orchestrates |
| 4 | `[FILL IN — e.g. rbac-matrix.xlsx]` | Roles and their permissions |
| 5 | `[FILL IN — e.g. brand-guide.md]` | Visual identity: colors, typography, tone |
| 6 | `[FILL IN — e.g. scenario-org.md]` | The demo/seed organization: name, people, locale, sample data |
| 7 | `[FILL IN — existing repo path, if extending rather than greenfield]` | Current codebase to build on |

**Rule:** if a requested feature isn't traceable to one of these files, stop
and ask rather than inventing plausible-sounding behavior. The single
biggest thing that made journi's own guide trustworthy was that every claim
in it was checked against real source code, not assumed from a spec.

---

## 1. Objective

Build **[Application Name]**, a [FILL IN — one-sentence description of the
domain, e.g. "a change-management platform for tracking organizational
transformation initiatives"], following journi's architectural pattern:
a role-based, multi-tenant React SPA with no backend (all state in
`localStorage`), organized as a fixed set of numbered **modules**, each a
first-class routed page with its own CRUD, RBAC gating, and i18n strings.

---

## 2. Reference Architecture (the journi pattern)

### 2.1 Tech stack
- React + Vite, React Router for routing
- Tailwind CSS for styling
- No backend — a single `AppStateContext` (React Context) holds all app
  data as one JSON object, persisted to `localStorage` under a versioned
  key (e.g. `app.state.v1`)
- `id.js` — a `uid(prefix)` helper generating collision-resistant IDs like
  `uc-1a2b3c-1-x7f2q`

### 2.2 Data & state pattern
- `src/data/*.js` — static seed/reference data (arrays of plain objects),
  each file's top comment names which requirement/spec section it
  implements
- `src/data/seed.js` — a `buildSeed()` function assembling all the above
  into the initial app-state object (the "factory reset" source of truth)
- `src/state/AppStateContext.jsx` — one big provider:
  - `loadInitialState()`: reads `localStorage`, and **back-fills** any
    field that didn't exist in an older persisted session (critical —
    every new feature needs a migration line here or existing demo
    sessions silently break)
  - CRUD actions as `useCallback`s following one consistent shape:
    ```js
    const addX = useCallback((item) => {
      setData((prev) => ({ ...prev, xs: [...prev.xs, { ...item, id: uid('x') }] }))
    }, [])
    const updateX = useCallback((id, patch) => {
      setData((prev) => ({ ...prev, xs: prev.xs.map((x) => x.id === id ? { ...x, ...patch } : x) }))
    }, [])
    const deleteX = useCallback((id) => {
      setData((prev) => ({ ...prev, xs: prev.xs.filter((x) => x.id !== id) }))
    }, [])
    ```
  - For project-scoped sub-collections (e.g. a log entry against a
    specific project), use an `updateProjectIn(list, projectId, fn)`
    helper rather than repeating the find-and-replace logic everywhere
  - Every new action must be added to **both** places the context value
    is built: the returned object and the `useMemo` dependency array

### 2.3 Module pattern
- One route per module: `/app/m<N>`, each backed by `Module<N>Page.jsx`
- Sidebar nav grouped into sections (e.g. "Platform", "Core Modules",
  "Governance"), each module a plain `NavLink`
- A module page's own top-level export handles: `PageHeader` (title +
  description), tabs if the module has more than one view, and delegates
  to sub-components for each CRUD list/form
- Shared components to build once, reuse everywhere: `PageHeader`,
  `Badge`, `Modal`, `StatCard`, `EmptyState`, `ProgressBar`

### 2.4 RBAC / Permission Matrix
- `src/data/constants.js`:
  - `CAPABILITIES` — array of `{ key, label, description }`, one entry
    per gated action; this array alone drives an admin-facing Permission
    Matrix screen (render a checkbox grid of role × capability from it —
    don't hand-build that UI per capability)
  - `DEFAULT_ROLE_PERMISSIONS` — object keyed by role, each a flags
    object matching the capability keys
- `src/utils/rbac.js` — one `canDoX(role, matrix)` function per gated
  action: `if (matrix) return !!matrix[role]?.capabilityKey; return
  [ROLE_A, ROLE_B].includes(role)` (the fallback is what the demo runs on
  before an admin ever touches the matrix)
- Distinguish **who can edit vs. who can delete** where the two
  legitimately differ (e.g. anyone with write access can create/edit a
  governance record, but only admins can delete one, and only once it's
  no longer Active) — don't default every action to the same gate

### 2.5 Versioned CRUD (for anything that's shared, platform-wide reference
content, not per-project data — e.g. a template library, a use-case
catalog)
- `src/utils/versioning.js`, two pure functions, reusable across every
  versioned entity type:
  ```js
  export function withVersionBump(entity, patch, note) {
    const { id, version, versionHistory, ...fields } = entity
    const prevVersion = version || 1
    const history = [...(versionHistory || []),
      { version: prevVersion, savedAt: new Date().toISOString(), note: note || 'Edited', snapshot: fields }]
    return { ...entity, ...patch, version: prevVersion + 1, versionHistory: history }
  }
  export function revertEntityToVersion(entity, targetVersion) {
    if (!entity || targetVersion === entity.version) return entity
    const target = (entity.versionHistory || []).find((h) => h.version === targetVersion)
    if (!target) return entity
    return withVersionBump(entity, target.snapshot, `Reverted to version ${targetVersion}`)
  }
  ```
- A revert is implemented as an edit whose patch is an old snapshot —
  version numbers always move forward, nothing is destructively
  rewritten, and "revert to the original" is just "revert to version 1"
- Pair with a generic `<VersionHistoryPanel entity={x} canRevert={...}
  onRevert={(v) => revertX(id, v)} />` component so every versioned
  module gets the same history UI for free

### 2.6 i18n
- One flat dictionary file (`src/i18n/translations.js`): every key maps
  to `{ en: '...', fr: '...', ar: '...' }` (adjust languages to the
  scenario's locale needs)
- A `useI18n()` hook exposing `t(key, fallback)`
- Every new label, button, and placeholder gets a key here — no bare
  strings in JSX for anything user-visible

### 2.7 The "field notes" pattern (worth replicating deliberately)
When a real workflow surfaces informal knowledge that doesn't fit any
structured module yet — a meeting happened, a decision was made outside
the app, a sign-off landed — don't leave it undocumented. Add one
lightweight, freeform, project-scoped log module (category, optional
link to another module, author, date, body) as the deliberate catch-all.
This is the single highest-leverage module to build early: it turns
every "not tracked in the app yet" gap into "tracked, just not
structured yet."

### 2.8 Scenario / seed organization
- Build the demo around **one** concrete, named fictional organization
  (industry, locale, real-sounding people with named roles) rather than
  generic Lorem Ipsum data — this is what makes a generated user guide
  readable as a story instead of a field reference
- `[FILL IN scenario-org details from Configuration file #6]`

---

## 3. Functional Requirements

`[FILL IN — the module list, one row per module, in the shape journi uses]`

| # | Module | Purpose | CRUD |
|---|---|---|---|
| M1 | [FILL IN] | [FILL IN] | [Full CRUD / Read-only / Toggle-only] |
| M2 | ... | | |

Include, if applicable to the domain (journi's equivalents in
parentheses):
- A **process registry** cross-referencing every module to the
  end-to-end workflows it participates in (journi's Module 18)
- **Live-computed alerts/metrics** with explicit trigger conditions
  stated in code comments, and an honest accounting of which
  alerts/metrics are fully computable client-side vs. which would need a
  real backend (journi's `alertEngine.js` + `alertDefinitions.js` split)
- A **governance/charter** module for behavioral standards with
  owner roles and a compliance log, if the domain has a governance
  dimension (journi's Module 19)
- A **WBS/Gantt or schedule** module with baseline-vs-actual tracking and
  a template library, if the domain is project/program-shaped (journi's
  Module 17)

---

## 4. Non-Functional Requirements

- **Fidelity discipline:** every module description, every field name,
  every RBAC rule stated anywhere in the user guide must be checked
  against the actual source code before being written down — never
  assumed from the spec alone. When the app and the spec disagree, the
  app is ground truth (or it's a bug to flag, not paper over).
- **RBAC actually enforced in the UI**, not just documented — gate
  buttons/forms with the real `canDoX()` checks, not decorative text.
- **Migration discipline:** every new persisted field ships with a
  back-fill in `loadInitialState()` so existing demo sessions don't
  break silently.
- **No dead/unused code left behind** — if an approach is abandoned
  mid-implementation, remove the abandoned branch rather than leaving a
  stub.

---

## 5. Deliverables

1. **The application** — a working build (`npm run build` producing
   `dist/`), plus a distributable zip of the full source + `dist/`
   (exclude `node_modules` and `.git`).
2. **A user-friendly Word document User Guide**, built from the running
   application (see Section 6) — the single most failure-prone
   deliverable in this whole pattern, because it's a real Word document
   with real fields, not just styled text. Requirements:
   - A genuine **cover page** (title, one-line description, version,
     confidentiality marking) on its own page, first in the document
   - A genuine **populated Table of Contents** — a real Word TOC field
     with actual page numbers next to every entry, on its own dedicated
     page(s) immediately after the cover, not a manually-typed bullet
     list of links
   - **Big, readable body and table fonts** (13pt body / 11.5pt table as
     a starting point — bump further if requested)
   - **Wide/dense reference tables in a landscape page section**, not
     shrunk to fit portrait
   - A **module-by-module tour** walking the scenario organization's
     real, growing data set through every module, stating for each:
     purpose, what it looks like in the scenario, create/update/delete
     rules, who can edit, and key fields
   - Traceability: nothing in the guide should describe a feature the
     app doesn't actually have

---

## 6. Word Document Generation Pipeline (the pattern that actually works)

This is the hard-won part — most of the obvious approaches to "generate a
polished Word doc from Markdown" silently fail on the two things users
notice first: a TOC with no page numbers, and content that doesn't
survive round-tripping. Use this exact pipeline.

**Toolchain:** write the guide as one Markdown file, then
`pandoc → python-docx (styling pass) → LibreOffice headless via a UNO
macro (field computation + final save)`.

1. **Author in Markdown**, one source file. Use `<a id="anchor"></a>`
   immediately followed by a blank line before any heading it labels
   (no blank line between an anchor and a heading/list causes pandoc to
   swallow the following block into a raw-HTML paragraph — verify with a
   regex sweep for `<a id="[^"]+"></a>\n(?!\n)` before every build,
   expect zero matches).

2. **Convert with a real TOC field:**
   ```
   pandoc guide.md -o pandoc.docx --toc --toc-depth=4
   ```
   This inserts a genuine native Word TOC field — but pandoc puts it
   at the very top of the document, *before* any title-block content you
   wrote. Don't rely on document order; fix this in the styling pass
   (next step).

3. **Style pass (Python, `python-docx`):** this script is where all
   layout work happens — do it here, not by hand-tweaking the docx.
   - **Reorder cover vs. TOC:** find pandoc's `<w:sdt>` TOC block (it's
     `body.find(qn('w:sdt'))`), remove it from position 0, and
     re-insert it — with a page-break paragraph before and after —
     right after your title-block paragraphs, so reading order becomes
     Cover → TOC → Part 0, not TOC → Cover.
   - **Column widths:** pandoc's table auto-fit is never right for a
     dense reference table. Detect tables by header-row signature (e.g.
     `len(t.columns) == 9 and t.rows[0].cells[0].text == 'ID'`) and set
     explicit `tcW`/`gridCol` widths as ratios of usable page width.
   - **Landscape section for wide tables:** don't shrink font to fit
     portrait — flip the section. Find the heading paragraphs
     bracketing the wide-table range, walk backward from each to the
     **nearest actual `<w:p>` paragraph** (pandoc's auto-generated
     heading bookmarks sit between headings and prior content as
     separate `bookmarkStart`/`bookmarkEnd` elements, not paragraphs —
     a fixed index offset will land you on the wrong node), and attach
     a cloned-and-modified `sectPr` (swap `pgSz` width/height, add
     `w:orient="landscape"`) to each boundary paragraph's `pPr`. Clone
     the *existing*, already-configured section's `sectPr` (which
     already carries the header/footer references) rather than building
     one from scratch, so headers/footers stay consistent.
   - **Font sizes:** set a base body size and table size explicitly
     (`Normal`/`Body Text`/etc. styles plus a per-run fallback for runs
     with no explicit size) — don't trust the docx defaults.
   - **`updateFields=True`** in `document.settings.element` so real
     Word recalculates fields on open without the user pressing F9.
   - Save as an intermediate `styled.docx`.

4. **Compute the TOC/PAGE fields for real, and bake the result into
   *both* deliverables** — this is the step almost everyone skips, and
   the resulting bug (an empty TOC field, or numberless entries) is the
   single most common failure mode of this whole pattern:
   - `pandoc`/`python-docx` never lay out pages, so the TOC field ships
     with zero cached content between its `begin`/`separate`/`end`
     markers, and the on-disk docProps page-count is a meaningless
     placeholder.
   - Start a headless LibreOffice listener:
     `soffice --headless --invisible --accept="socket,host=localhost,port=2002;urp;"`
   - Use `python3-uno` (the system LibreOffice Python bridge, not a
     `pip install`) to connect, load `styled.docx` hidden, then:
     ```python
     for i in range(doc.getDocumentIndexes().getCount()):
         doc.getDocumentIndexes().getByIndex(i).update()
     doc.getTextFields().refresh()
     doc.storeToURL(pdf_url, (make_prop("FilterName", "writer_pdf_Export"),))
     doc.storeToURL(docx_url, (make_prop("FilterName", "MS Word 2007 XML"),))  # do NOT skip this line
     ```
   - **Save the updated DOCX, not only the PDF export.** The field
     computation only exists in that in-memory document — if you only
     export a PDF from it, the shipped `.docx` still has the original
     empty TOC field, and anyone opening it in an app that doesn't
     auto-recalculate fields on load (which is common — most Word
     builds require an explicit "update field" trigger unless the
     document forces it) sees a blank Table of Contents. Ship the
     LibreOffice-resaved `.docx`, verified by grepping its
     `word/document.xml` for real page-number text (`<w:t>7</w:t>` next
     to a heading's hyperlink), not just for the field's instruction
     text.

5. **Verify before delivering, every time, from a clean rebuild** —
   don't trust cached intermediate files:
   - Full-text-scan the final PDF for any placeholder/gap language the
     guide is supposed to have eliminated
   - Render specific pages with `pdftoppm` and actually look at them —
     cover page alone on page 1, TOC starting fresh on its own page with
     real numbers, a sample landscape page, a sample body page
   - Check `python-docx` can still open the final file, `## ` leaks are
     zero (a sign an anchor/heading got swallowed), section count and
     orientations are as expected
   - **When re-delivering after a user reports a persistent-looking bug
     that you've already verified is fixed on disk**, suspect client-side
     caching by filename before re-checking your own pipeline — send a
     freshly-renamed copy to rule it out.

---

## 7. Acceptance Checklist

- [ ] Every module in Section 3 has a working route, CRUD (per its
      stated rule), and RBAC gate
- [ ] Every new persisted field has a `loadInitialState()` back-fill
- [ ] `npm run build` succeeds with no errors
- [ ] Core flows verified in an actual browser session (not just a
      build success), including at least one full add/edit/delete cycle
      per new module
- [ ] User Guide: cover page alone on page 1; TOC on its own page(s)
      immediately after, every entry with a real page number; wide
      tables in landscape; fonts readable; zero placeholder/gap language
      remaining anywhere in a full-text scan
- [ ] App zip and User Guide are content-synchronized — spot-check by
      diffing a few source files inside the zip against the guide's
      claims about them
