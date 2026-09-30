# Revision 1.6 content for the Dynamic Apps Standard SRS (applied on top of revision 1.5).
# Every item is application agnostic: stated for any Dynamic App.

PURPOSE = ("Revision 1.6 adds what the second and third rounds of DynamicMS user feedback established, restated for any "
  "Dynamic App: generated documents that are consistent with the application's data and with each other, detailed and "
  "fine grained by document type, with full Create, Read, Update and Delete at every level (document, version, section, "
  "data-bound row, template and layout); data entry that is usable for real work (qualified field titles, controlled "
  "lists with a Custom value, a large row editor, scrollable dialogs, identifiers shown with their names, a search bar "
  "on every screen); records linked many to many, entered manually, from a library or by the AI, and propagated to "
  "registers and documents; graded audit and inspection findings; and transparent AI behavior (which engine answered and "
  "why, parameters adapted to each model). Appendix H lists every change.")

SCOPE = ("Revision 1.6 adds to this scope: consistency and fine-grained content of generated documents; full CRUD on "
  "documents, their versions, sections and data-bound content; data entry usability; linked records, choice libraries "
  "and register propagation; audit and inspection programmes with graded findings; AI engine transparency and model "
  "capability profiles.")

REFERENCE = ("DynamicMS — Feedback rounds 2 and 3 on the September 2026 build (IMS document content, SRS 1.5 features, "
  "user experience and Scenario 1 of User Guide 2), September 2026.")

OVERVIEW = ("Revision 1.6 adds Sections 4.44 to 4.48, new requirements in Sections 4.4, 4.19, 4.40, 5.1, 5.2, 5.3, 5.5 "
  "and 5.8, 12 terms in Section 1.4, 12 entities in Section 6, rows in Appendix A and Appendix H, the change log of "
  "revision 1.6. Nothing was removed or renumbered; FR-DA-DOC-01 to 11 (Section 4.43) remain the base that Sections "
  "4.44 and 4.45 detail.")

TERMS = [
  ("Document Profile", "The minimum content a generated document of a given type must carry — identification block, "
   "purpose and scope, method or rating scales, data sections, analysis, actions, revision history, approval — and the "
   "checks applied before it is published."),
  ("Data Source Binding", "The link between a section of a template or document and a named data source of the "
   "application (a register, a list of records, the values of a step), with its filters and sort order."),
  ("Consistency Check", "An automatic verification, run on a generated document and across the documents of a project, "
   "that every value, identifier and reference agrees with the application's records and with the other documents."),
  ("Section Override", "Text or a value typed in a document section that replaces, for that document only, what the "
   "data source provides; it is marked as such and kept across regenerations."),
  ("Edit-through", "Changing a row of a data-bound table from within a document, the change being written to the source "
   "record (with its rights, checks and audit) rather than to the document."),
  ("Controlled List", "A list of proposed values for a field (for example categories, types, parties), managed as "
   "configuration data, always offering a Custom value typed by the user."),
  ("Choice Library", "The values of a Controlled List together with the values users have already typed in the "
   "Organization, offered again the next time the field is filled."),
  ("Entry Origin", "How a record was entered: typed by the user (Manual), taken from a library (Library) or suggested by "
   "the AI and accepted by a person (AI)."),
  ("Record Link", "A many-to-many link between two records (for example a need and the interested parties it concerns), "
   "each end chosen from the records already identified or typed as a new value."),
  ("Register Propagation", "The creation or update of register entries from the rows of a completed step, each row "
   "keeping the identifier of the entry it produced."),
  ("Row Editor", "A large window that edits one row of a record table field by field, with scrolling, previous and next "
   "row, and a return to the table."),
  ("Engine Transparency", "The display, with every AI answer, of the engine that produced it (live model or built-in "
   "engine) and, when the live model was not used, the reason."),
]

PRINCIPLES = [
  "One truth, many documents. A generated document never holds data of its own that contradicts the application: every "
  "value comes from a record, is traceable to it, and is the same in every screen and every document that shows it.",
  "Usable before complete. A field names what it expects, offers a list with a Custom value, gives room to type, and "
  "explains what is computed; the user never meets a generic \"Item\" or a box too small to read.",
]

FUNCTIONS = [
  "Generate detailed, consistent documents from the application's data, checked before publication and editable at every "
  "level — document, version, section and data-bound row — with full history.",
  "Capture records with qualified fields, controlled lists with Custom, large row editing and many-to-many links, entered "
  "manually, from a library or with the AI, and propagate them to registers and documents.",
]

APPEND = [
  ("FR-DA-AI-18", [
    ("FR-DA-AI-19", "The system shall keep a capability profile per model — the request parameters it accepts (for example "
     "sampling parameters), whether it reasons before answering, its maximum output — and send each request with only the "
     "parameters the model accepts, reserving enough output length for its reasoning."),
    ("FR-DA-AI-20", "The system shall offer a connection test for the configured model that reports, in plain language, "
     "whether the key was refused, a parameter was rejected, the model declined the request or the model answered, and "
     "record the result."),
  ]),
  ("FR-DA-NAV-13", [
    ("FR-DA-NAV-14", "The system shall show a search bar in the header of every authenticated screen, in addition to the "
     "Search button of the menu (FR-DA-NAV-12); typing in it opens the global search (Section 4.37) with the text typed."),
    ("FR-DA-NAV-15", "The system shall give each catalog that users manage — for example functions, process design, document "
     "templates and document layout — a direct menu entry, so that its Create, Read, Update and Delete are reachable in one "
     "step from the menu."),
  ]),
  ("FR-DA-AIP-11", [
    ("FR-DA-AIP-12", "The system shall show with every AI answer the engine that produced it (Engine Transparency) and, when "
     "the Organization's live model was not used, a visible message giving the reason — no model enabled, or the error the "
     "model returned — with a link to the model settings for users entitled to change them."),
    ("FR-DA-AIP-13", "The system shall make the built-in engine produce, when it answers, content of the type the use case "
     "expects (for example a draft text built from the records already captured), never an echo of the input."),
    ("FR-DA-AIP-14", "The system shall send as prompt inputs only the values the user typed or the records named in the "
     "specification, never the state of interface controls (for example the choice made in a list of outcomes)."),
    ("FR-DA-AIP-15", "The system shall insert an accepted or edited suggestion into the output field the use case names "
     "(for example the final validated text), never into an input field."),
    ("FR-DA-AIP-16", "The system shall let an AI suggestion fill several rows of a record table, each row linked to the "
     "records it concerns and marked with the Entry Origin AI, for the user to review, edit or delete before completion."),
  ]),
  ("NFR-DA-PERF-10", [
    ("NFR-DA-PERF-11", "Generating a document of up to 50 pages with diagrams (for example BPMN flows) shall complete within "
     "15 seconds, and the consistency checks of a project's documents within 30 seconds, at the 95th percentile."),
  ]),
  ("NFR-DA-SEC-18", [
    ("NFR-DA-SEC-19", "A generated document shall contain only data the requesting user may read; a document shared or "
     "downloaded shall carry its classification and shall not include hidden data (comments, hidden sheets, metadata) "
     "beyond what it shows."),
  ]),
  ("NFR-DA-REL-07", [
    ("NFR-DA-REL-08", "Generating a document twice from the same data and template version shall produce the same content; "
     "every published document version shall keep the data snapshot it was generated from, so it can be reproduced."),
  ]),
  ("NFR-DA-UX-12", [
    ("NFR-DA-UX-13", "Every dialog shall keep its title and actions in view and scroll its content with a visible scroll "
     "bar; read-only text shall be shown in full rather than inside a small scrolling box."),
    ("NFR-DA-UX-14", "Every identifier shown to a user shall be followed by the name of the item it identifies, in the "
     "form \"ID (name)\" — for example a phase, a process, a step, a function or a record — in lists, pickers and headers."),
    ("NFR-DA-UX-15", "A computed field shall be read-only, show how it is computed and why it exists, and never be typed."),
    ("NFR-DA-UX-16", "Text fields shall be sized for their content; a field meant for more than one sentence shall offer at "
     "least five lines, in the form or in the Row Editor."),
  ]),
  ("NFR-DA-MAINT-09", [
    ("NFR-DA-MAINT-10", "Controlled Lists, Document Profiles, step-specific field titles and data source bindings shall be "
     "configuration data, changed without code changes or downtime."),
  ]),
]

SECTIONS = [
  ("4.44 Generated Documents: Consistency & Fine-Grained Content", "A generated document is detailed, complete for its "
   "type and consistent with the application's data and with every other document.", [
    ("FR-DA-DGC-01", "The system shall draw every value of a generated document from the application's records through a "
     "Data Source Binding; the same item shall appear with the same identifier, name and values in every screen and every "
     "document that shows it."),
    ("FR-DA-DGC-02", "The system shall trace every data-bound table row and value of a document to its source record "
     "(identifier and version), list the data sources used at the end of the document, and show the date and time of the "
     "data (\"data as of\")."),
    ("FR-DA-DGC-03", "The system shall, when the register a section is bound to has no entry yet, use the records typed in "
     "the steps that feed it; when no data exists at all, it shall print a visible notice naming the step or register that "
     "provides the data, never an empty section or an empty table."),
    ("FR-DA-DGC-04", "The system shall define a Document Profile per document type, and each generated document shall carry "
     "at least: an identification block (reference, title, version, status, owner, approver, dates, classification, "
     "distribution), purpose and scope, references and definitions, method and rating scales where scores are used, the "
     "data sections of its type, analysis and conclusions, actions with owner and due date, a revision history and an "
     "approval block."),
    ("FR-DA-DGC-05", "The system shall produce data sections at the finest grain of the data: one row per item, each with "
     "its own category, description, relevance or score, owner, dates, status and source or evidence, rather than grouped "
     "or summarized text."),
    ("FR-DA-DGC-06", "The system shall, for a procedure or process description, include the process flow as a diagram "
     "(BPMN 2.0 with lanes per role, gateways and exception flows), the inputs and outputs of each activity (SIPOC per "
     "step), the decision points with their Go / No-Go criteria, evidence and decider, the records produced, the "
     "indicators and the risks and controls."),
    ("FR-DA-DGC-07", "The system shall run Consistency Checks before a document is sent for review and before it is "
     "published: referenced items exist and are current; totals, counts and scores agree with their rows; identifiers and "
     "names match the records; every mandatory section of the Document Profile is filled; dates are coherent (next review "
     "after last review); and the document agrees with the other published documents of the project that show the same "
     "items."),
    ("FR-DA-DGC-08", "The system shall list the findings of the Consistency Checks with their location in the document and "
     "a link to the record to correct; findings marked blocking shall prevent publication, the others shall be accepted "
     "with a justification (Section 3.7)."),
    ("FR-DA-DGC-09", "The system shall show, for every published document, whether its source data changed since it was "
     "generated, list the changed items, and propose a new version; a data change that affects a published document shall "
     "raise an alert to its owner (Section 4.9)."),
    ("FR-DA-DGC-10", "The system shall keep the documents of a project mutually consistent: a change of a shared item (for "
     "example a party, a risk, an objective, a process owner) shall list every document that shows it and let the owner "
     "regenerate them together."),
    ("FR-DA-DGC-11", "The system shall lay out each format for reading: a cover page and a table of contents where "
     "relevant; landscape pages for wide tables; table headers repeated on each page; no heading or table header left "
     "alone at the bottom of a page; diagrams rendered as images in Word and PDF; one sheet per table after a cover sheet "
     "in Excel; status values shown with the semantic color scale."),
    ("FR-DA-DGC-12", "The system shall generate a document in any supported language, with the data in that language, and "
     "keep the language of each version."),
    ("FR-DA-DGC-13", "The system shall keep a master list of the project's documented information up to date "
     "automatically: reference, title, version, status, owner, approval date, review frequency, next review, retention for "
     "records, and the requirement each document answers."),
  ]),
  ("4.45 Generated Documents: Full CRUD at Every Level", "Every level of a generated document can be created, read, "
   "changed and removed by the people entitled to, with full history.", [
    ("FR-DA-DCR-01", "The system shall support Create, Read, Update, Duplicate and Delete on documents: create from a "
     "template or blank, read on screen and in every format, update the metadata (title, owner, approver, review "
     "frequency, classification, distribution), duplicate to another project, and delete a document never published; a "
     "published document shall be retired with a justification, not deleted (FR-DA-DOC-09)."),
    ("FR-DA-DCR-02", "The system shall support Create, Read, Compare, Restore and Delete on document versions: create a "
     "minor or major version by regeneration from newer data or by copy of the current content; read and download any "
     "version; compare any two versions section by section and row by row; restore any version as a new draft; delete a "
     "draft version only."),
    ("FR-DA-DCR-03", "The system shall support, on a draft version, Create, Read, Update, Reorder and Delete on sections: "
     "add a section (text, data-bound table, diagram, key-value block, approval block), rename it, move it, delete it, "
     "edit its text, and change its Data Source Binding, filters and columns."),
    ("FR-DA-DCR-04", "The system shall let an authorized user edit a row of a data-bound table from the document through "
     "Edit-through — add, change or delete the source record under its own rights, checks and audit — and regenerate the "
     "section, so the document and the application stay the same."),
    ("FR-DA-DCR-05", "The system shall let an authorized user set a Section Override for text or a value that belongs to "
     "the document only; the override shall be marked, kept when the document is regenerated, listed in the Consistency "
     "Checks and removable to return to the source data."),
    ("FR-DA-DCR-06", "The system shall keep, when a document is regenerated, the manual text and overrides of its sections, "
     "and show the user what the regeneration changed before the new version is saved."),
    ("FR-DA-DCR-07", "The system shall apply the same CRUD to templates (FR-DA-DOC-01): sections, their order, text, data "
     "sources and Document Profile; a template change shall apply to documents generated after it and be offered to "
     "existing drafts."),
    ("FR-DA-DCR-08", "The system shall support Create, Read, Update and Delete on the document layout of an Organization "
     "(FR-DA-DOC-07) and on its per-type variants, with a preview, versioned under Section 3.8."),
    ("FR-DA-DCR-09", "The system shall gate every document, version, section, row and layout action by its own permission, "
     "enforce the two-person rule for approval (FR-DA-DOC-05) and write every action to the audit trail (Section 4.11)."),
    ("FR-DA-DCR-10", "The system shall show where to customize documents from the documents screen and from every document: "
     "templates (all documents of a type), layout (all documents of the Organization) and structure (this document only)."),
  ]),
  ("4.46 Data Entry Usability", "Every form names what it expects, proposes values and gives room to type.", [
    ("FR-DA-DEU-01", "The system shall qualify every field and column title with the object it holds in its context (for "
     "example \"External issue\", \"Interested party\", \"Macro process 1\"), never a generic title such as \"Item\"; a "
     "reusable form shall take its titles from the step or record type that uses it."),
    ("FR-DA-DEU-02", "The system shall present every choice as a Controlled List with a Custom value that opens a free "
     "text field, and shall offer again, in the same list, the values already typed in the same table."),
    ("FR-DA-DEU-03", "The system shall let the user open any row of a record table in a Row Editor — one large field per "
     "column, scrolling, previous and next row, and a return to the table — in edit mode and in read-only mode; a new row "
     "shall open in the Row Editor."),
    ("FR-DA-DEU-04", "The system shall let reference items (processes, phases, functions, people, units, records) be "
     "chosen from pickers of the current project or Organization, shown as \"ID (name)\", with a Custom value where an "
     "item outside the application is allowed."),
    ("FR-DA-DEU-05", "The system shall explain every computed or scored field under the field — what it measures, how it is "
     "computed and where it is used — and every free-text field that feeds a document."),
    ("FR-DA-DEU-06", "The system shall keep the user's unsaved input when a dialog or Row Editor is closed with Back, and "
     "ask for confirmation only when the input would be lost."),
  ]),
  ("4.47 Linked Records, Choice Libraries & Register Propagation", "Records are captured once, linked to each other and "
   "reused everywhere.", [
    ("FR-DA-LNK-01", "The system shall support Record Links many to many between records (for example a need or "
     "expectation and the interested parties it concerns, a risk and the processes it affects), each end chosen from the "
     "records already identified in earlier steps or registers, or typed as a Custom value."),
    ("FR-DA-LNK-02", "The system shall let multi-valued records be entered in three ways — typed (Manual), taken from a "
     "Choice Library (Library) or suggested by the AI (AI) — and record the Entry Origin of each."),
    ("FR-DA-LNK-03", "The system shall build each Choice Library from the values entered before in the Organization, in any "
     "project, together with a reference list managed as configuration data; library values are not linked to any record "
     "until the user links them."),
    ("FR-DA-LNK-04", "The system shall apply Register Propagation when a step is completed: each row of an "
     "identification step creates or updates the matching register entry, matched by its identifier or its name, and keeps "
     "the identifier of that entry; linked records update the entries they concern."),
    ("FR-DA-LNK-05", "The system shall keep steps, registers, pickers and documents consistent: an item typed in a step is "
     "offered in the pickers of later steps, shown in its register, and printed in the documents bound to that register "
     "(FR-DA-DGC-03)."),
  ]),
  ("4.48 Audits, Inspections & Graded Findings", "Where a Dynamic App plans audits or inspections, it plans them at a "
   "stated frequency and grades each finding.", [
    ("FR-DA-AFP-01", "The system shall let the frequency of an audit or inspection be chosen from a list (for example "
     "monthly, quarterly, semi-annual, annual, every two years, every three years) or set as Custom with its description, "
     "and derive the next planned date from it."),
    ("FR-DA-AFP-02", "The system shall record, for each planned audit, its objectives, criteria, scope, processes, "
     "duration, lead and team with their qualification, and justify its frequency from the risks and the results of "
     "earlier audits."),
    ("FR-DA-AFP-03", "The system shall grade every finding on a configurable scale — at least major nonconformity, minor "
     "nonconformity, observation and opportunity for improvement — with the grading rules shown to the user."),
    ("FR-DA-AFP-04", "The system shall hold a detailed record for each nonconformity: requirement and clause, statement, "
     "objective evidence, process and auditee, root cause, correction, corrective action with owner and due date, "
     "verification of effectiveness and status, linked to the corrective action process of the application."),
    ("FR-DA-AFP-05", "The system shall produce the audit report from these records: summary, strengths, findings by grade "
     "and by requirement, one detailed sheet per nonconformity, conclusion and follow-up (Section 4.44)."),
  ]),
]

ENTITIES = [
  ("DocumentProfile", "The minimum content and checks of a document type."),
  ("DocumentSection", "A section of a document version: kind, order, text, Data Source Binding, filters and columns."),
  ("DataSourceBinding", "The link of a section to a named data source, with filters and sort order."),
  ("SectionOverride", "Text or a value typed in a document section that replaces the source data for that document."),
  ("DocumentSourceTrace", "The source record (identifier and version) of each data-bound value of a document version."),
  ("ConsistencyFinding", "A finding of a Consistency Check: location, rule, severity, status, justification."),
  ("ChoiceList / ChoiceValue", "A Controlled List and its values, reference or typed by users, with language labels."),
  ("RecordLink", "A many-to-many link between two records, with its type."),
  ("EntryOrigin", "The origin of a record entered in a table: Manual, Library or AI (attribute of the record)."),
  ("ModelProfile", "The parameters a language model accepts, its reasoning behavior and its output limits."),
  ("AuditPlan", "A planned audit or inspection with frequency (list or custom), objectives, criteria, scope and team."),
  ("Finding", "A graded audit or inspection finding and, for a nonconformity, its detailed record."),
]

UI_PARA = ("Revision 1.6 adds a search bar in the header of every screen; direct menu entries for managed catalogs "
  "(functions, document templates and layout); a Row Editor on every record table; Controlled Lists with a Custom value; "
  "\"ID (name)\" labels; scrollable dialogs with fixed title and actions; a Consistency Check panel, a version comparison "
  "and section editing on documents; and an engine notice on every AI answer.")

CONFORMANCE = [
  ("Document consistency and content (FR-DA-DGC)", "Detailed, fine-grained documents drawn from the data and checked "
   "before publication.",
   "Documents drawn from the project data with identification block, method, one row per item with source, analysis, "
   "revision history and approval; procedures with BPMN, SIPOC per step and Go / No-Go; step data used when a register is "
   "empty; landscape, anti-orphan and Excel sheets per table. Consistency Checks before publication, change detection on "
   "published documents and per-value source trace are not yet available: Partial."),
  ("Document full CRUD (FR-DA-DCR)", "CRUD on documents, versions, sections, data-bound rows, templates and layout.",
   "Create, read, update, delete (draft) and retire documents; versions draft, review, published, superseded, each "
   "downloadable; section add, rename, reorder, delete and text edit on drafts; template and layout CRUD. Version "
   "comparison, Edit-through, Section Overrides kept across regeneration are not yet available: Partial."),
  ("Data entry usability (FR-DA-DEU, NFR-DA-UX-13 – 16)", "Qualified titles, lists with Custom, Row Editor, ID (name).",
   "Qualified column titles per step, Controlled Lists with Custom, Row Editor with previous / next and back, macro "
   "process pickers shown as code (name), explained computed fields, scrollable dialogs. The confirmation before losing "
   "unsaved input (FR-DA-DEU-06) is not yet available: Met except DEU-06."),
  ("Linked records and propagation (FR-DA-LNK)", "Many-to-many links, Manual / Library / AI entry, register propagation.",
   "Needs linked to several interested parties; library of needs typed in the Organization plus a reference list; AI "
   "suggestions linked to parties; context and interested-party registers filled on completion: Met (demonstrated on the "
   "context analysis steps)."),
  ("Audits and graded findings (FR-DA-AFP)", "Frequency list with Custom; graded, detailed findings.",
   "Frequency list with Custom; objectives, criteria, duration, processes; findings graded major, minor, observation, "
   "opportunity with a detailed record and report: Met."),
  ("AI transparency and model profiles (FR-DA-AIP-12 – 16, FR-DA-AI-19 – 20)", "Engine and reason shown; parameters "
   "adapted to each model.",
   "Engine and fallback reason shown with a link to the settings; built-in policy draft; only typed inputs sent; "
   "suggestion inserted in the output field; sampling parameters omitted for models that reject them; connection test "
   "reporting a refused key, a declined request or the model's own error message. Capability profiles are built in for "
   "the listed models rather than configurable: Met (profiles Partial)."),
]

CHANGELOG = [
  ("Cover, 1.1, 1.2, 1.5, 1.6", "Version 1.6", "Version raised to 1.6; purpose, scope and overview describe the revision; "
   "the feedback rounds 2 and 3 added to the references."),
  ("1.4 Definitions", "12 terms added", "Document Profile, Data Source Binding, Consistency Check, Section Override, "
   "Edit-through, Controlled List, Choice Library, Entry Origin, Record Link, Register Propagation, Row Editor, Engine "
   "Transparency."),
  ("2.2, 2.3", "2 principles, 2 functions", "One truth, many documents; usable before complete. Consistent documents with "
   "full CRUD; usable record capture with links and propagation."),
  ("4.4 AI Use Case Library", "FR-DA-AI-19 – 20 (new)", "Model capability profiles; plain-language connection test."),
  ("4.19 Navigation Shell", "FR-DA-NAV-14 – 15 (new)", "Search bar in the header of every screen; menu entries for managed "
   "catalogs."),
  ("4.40 AI Prompt Specification", "FR-DA-AIP-12 – 16 (new)", "Engine Transparency; useful built-in answers; clean inputs; "
   "insertion in the output field; multi-row suggestions with Entry Origin."),
  ("4.44 (new) Document Consistency & Content", "FR-DA-DGC-01 – 13 (new)", "Single source; trace and data date; fallback "
   "and notices; Document Profiles; finest grain; procedures with BPMN, SIPOC and Go / No-Go; Consistency Checks and "
   "findings; change detection; cross-document consistency; layout; languages; master list."),
  ("4.45 (new) Document Full CRUD", "FR-DA-DCR-01 – 10 (new)", "Documents; versions with compare and restore; sections; "
   "Edit-through; Section Overrides; regeneration keeping manual text; templates; layout; permissions and audit; entry "
   "points for customization."),
  ("4.46 (new) Data Entry Usability", "FR-DA-DEU-01 – 06 (new)", "Qualified titles; Controlled Lists with Custom; Row "
   "Editor; ID (name) pickers; explained fields; unsaved input kept."),
  ("4.47 (new) Linked Records & Propagation", "FR-DA-LNK-01 – 05 (new)", "Many-to-many links; Manual, Library and AI entry; "
   "Choice Libraries; Register Propagation; consistency of steps, registers, pickers and documents."),
  ("4.48 (new) Audits & Graded Findings", "FR-DA-AFP-01 – 05 (new)", "Frequency list with Custom; audit plan; grading; "
   "detailed nonconformity record; audit report."),
  ("5.1, 5.2, 5.3, 5.5, 5.8", "NFR-DA-PERF-11, SEC-19, REL-08, UX-13 – 16, MAINT-10 (new)", "Document and check times; "
   "rights-safe documents; reproducible generation; scrollable dialogs; ID (name); computed fields; field sizes; "
   "configuration data."),
  ("6 Data Model", "12 entities", "DocumentProfile, DocumentSection, DataSourceBinding, SectionOverride, "
   "DocumentSourceTrace, ConsistencyFinding, ChoiceList / ChoiceValue, RecordLink, EntryOrigin, ModelProfile, AuditPlan, "
   "Finding."),
  ("7.1 User Interface", "1 paragraph", "Screens added by revision 1.6."),
  ("Appendix A", "6 rows", "Conformance of the 1.6 additions in the DynamicMS reference build."),
  ("Appendix H (new)", "Change log", "This change log."),
]
