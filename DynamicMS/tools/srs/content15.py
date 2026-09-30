# Revision 1.5 content for the Dynamic Apps Standard SRS
# Every item is application agnostic: stated for any Dynamic App.

PURPOSE = ("Revision 1.5 adds capabilities first built and verified in DynamicMS, an integrated management system "
  "Dynamic App, together with product direction received with its user feedback, restated so that any Dynamic App can "
  "reuse them: a global search reached from the navigation menu; full Create, Read, Update and Delete, with version "
  "history and the restore of any version, on every element of the process design (functions, end-to-end processes, "
  "phases, macro processes, tasks, steps, gates, checklists, forms and templates); an OBS made of units, roles and "
  "people, in which a role is linked to one or more functions and a person plays one or more roles; AI Use Cases "
  "mapped to the exact task or step they support, each with a prompt specification whose aspects (role, context, "
  "task, constraints, examples, format and others) are separate, versioned fields fully populated for that task or "
  "step; explicit naming and descriptions of process elements; typed step forms and a readiness checklist before a "
  "process starts; documented-information templates filled from the application's own data; versioned attachments; "
  "and an Organization-level language-model configuration. Appendix G lists every change.")

SCOPE = ("Revision 1.5 adds to this scope: global search; process design management with version history and restore; "
  "the OBS role model (functions, roles and people); AI Use Case mapping and prompt specification; process element "
  "naming and descriptions; typed step forms and process readiness; documented-information templates and generated "
  "documents; versioned attachments.")

REFERENCE = ("DynamicMS — Reference implementation of an integrated management system Dynamic App (QMS and QHSE), build "
  "of September 2026, with the SME QMS Scenario 1 feedback on its User Guide 2, September 2026.")

OVERVIEW = ("Revision 1.5 adds Sections 3.15 to 3.18 and 4.37 to 4.43, new requirements in Sections 4.4, 4.6, 4.16, "
  "4.19, 4.24, 5.1, 5.2, 5.3, 5.5 and 5.8, 12 terms in Section 1.4, 16 entities in Section 6, and Appendix G, the change "
  "log of revision 1.5. Nothing was removed or renumbered. NFR-DA-SEC-07 still governs a personal live-model "
  "connection; NFR-DA-SEC-17 adds the rules for an Organization-level connection stored encrypted on the server "
  "(FR-DA-AI-16).")

TERMS = [
  ("Function", "A business function of the Organization — for example Quality, Health & Safety, Finance, Human Resources, "
   "Operations — to which roles, processes and governance items are linked. Functions are a versioned catalog per Organization."),
  ("OBS Role", "A position defined in an OBS unit (for example Quality Manager of the head office), linked to one or more "
   "functions and played by one or more people. An OBS Role describes what a person does in the organization; it is "
   "distinct from an access role of RBAC."),
  ("Role Assignment", "The fact that a person plays an OBS Role, with a start date, an optional end date, an allocation "
   "percentage and a holder type (holder, deputy or acting). A person may hold several Role Assignments at once."),
  ("Process Design", "The set of typed elements that define how the application's work is done: functions, end-to-end "
   "processes and their phases, macro processes, tasks, steps, gates, checklists, step forms, templates and the AI Use "
   "Cases linked to them."),
  ("Process Element", "Any one item of the Process Design, held as data, with a stable identifier and a version history."),
  ("Design Release", "A named, immutable snapshot of the Process Design, or of one function or process within it, that "
   "can be published, compared with another release and restored."),
  ("Current Version", "The version of a versioned entity that the application uses for new work. Every earlier version "
   "stays viewable and can be restored, which creates a new Current Version with its content."),
  ("Prompt Specification", "The structured prompt of an AI Use Case: Role (persona), Context, Task (instruction), Inputs, "
   "Knowledge sources, Constraints, Examples, Output format, Tone and language, Quality criteria, Human checkpoint and "
   "Model parameters, each held in its own field and versioned."),
  ("Step Form Kind", "The type of input form a step uses — for example record table, assessment matrix, decision, "
   "objectives, plan, monitoring, review, assignment, document — which decides its fields, its checks and the records "
   "its completion creates."),
  ("Readiness Checklist", "An optional list, shown before a process starts, of what should be in place: inputs, "
   "predecessor processes, owner and RACSI, templates, KPIs. Items the system can verify are checked automatically; the "
   "list never blocks the start."),
  ("Documented Information Template", "A versioned template for a controlled document or record (policy, procedure, "
   "register, report), made of typed sections — text, table, approval block — each filled from a named data source of "
   "the application."),
  ("Global Search", "One search entry, in the navigation menu, that finds every record, process element, governance item, "
   "document and Help topic the user may open."),
]

PRINCIPLES = [
  "One process design, versioned. Every element of the process design is data with a full history: it can be created, "
  "changed, compared and restored to any earlier version, and a running record keeps the version it started with.",
  "Accountability through roles, not names. Work is assigned to OBS roles, linked to functions and resolved to the "
  "people who play them, so a change of person never breaks an assignment.",
  "Explicit prompts. Every AI Use Case carries its full prompt as separate, reviewable, versioned fields, populated for "
  "the exact task or step it serves.",
]

FUNCTIONS = [
  "Find any record, process element, document or Help topic the user may open from one search in the navigation menu.",
  "Manage the process design — functions, processes, phases, tasks, steps, gates, checklists, forms and templates — with "
  "full history, comparison and restore of any version.",
  "Model the organization as units, roles and people, with roles linked to functions and people playing one or more roles.",
  "Generate controlled documents and records from versioned templates filled with the application's own data, downloadable "
  "in Word, PDF and Excel.",
]

ARCH = [
  ("3.15 Process Design & Versioning Architecture", [
    "The process design is a hierarchy of typed Process Elements held as data: functions, end-to-end processes and their "
    "phases, macro processes, tasks and steps, the gates and checklists attached to phases, the form of each step, the "
    "templates (project, checklist, document, questionnaire) and the AI Use Cases linked to tasks and steps. Every "
    "element is registered with the generic Version Management service (Section 3.8): an edit creates a new version, no "
    "version is ever rewritten, and restoring any earlier version duplicates it forward as the new Current Version.",
    "Elements can be grouped into a Design Release, a named, immutable snapshot of the whole design or of one function or "
    "process, which is published, compared and restored as one unit. A running record is bound to the element versions "
    "that were current when it started, or when its phase opened; a later version applies to new records, and to running "
    "ones only when an authorized user migrates them with a justification. Completed work is never altered by a change of "
    "design."]),
  ("3.16 OBS Role Model Architecture", [
    "The OBS has three layers: units (sites, departments, services, teams, project teams), roles defined within units, and "
    "people. A role is linked to one or more functions and carries its responsibilities; a person plays one or more roles "
    "through dated Role Assignments. Ownership, RACSI letters, approvers, gate approvers and notification targets are "
    "assigned to roles and resolved, at the time of use, to the people who currently play them, so a change of holder "
    "moves open work without re-assigning it item by item.",
    "OBS Roles describe what people do in the organization. They are distinct from the access roles of RBAC (Section 3.2): "
    "a role may propose default access roles to its holders, but access is always decided by the Permission Matrix."]),
  ("3.17 AI Prompt Specification Architecture", [
    "Every AI Use Case is linked to the exact tasks or steps it supports and carries a Prompt Specification made of "
    "separate fields. At run time the platform assembles the prompt from these fields in a fixed order, resolves its "
    "input variables from the task or step and the record, adds the retrieved references (Section 3.5), and sends it to "
    "the configured live model or to the built-in engine. The specification is versioned as a whole and field by field, "
    "under Section 3.8, and the version used is written to the AI Usage Log with every suggestion."]),
  ("3.18 Global Search Architecture", [
    "One search service indexes, per tenant, the principal records, the process design, governance items, registers, "
    "documents, attachments metadata and Help topics, in every supported language. It applies the same RBAC and Solution "
    "Pack rules as the screens, through the same code (Section 3.5), so a result, a count or a snippet never reveals "
    "something the user could not open. The navigation menu carries its entry point in every dock position."]),
]

# requirements appended to existing sections: (anchor = last existing ID of the section, [(id, text)])
APPEND = [
  ("FR-DA-AI-15", [
    ("FR-DA-AI-16", "The system shall let an Organization Administrator configure an Organization-level live model — "
     "provider (standard providers or a custom endpoint compatible with a common API), model, temperature and maximum "
     "answer length — as an alternative to the personal connection of FR-DA-AI-08; its key shall be stored encrypted "
     "under NFR-DA-SEC-17, shown masked, and never returned in full."),
    ("FR-DA-AI-17", "The system shall let an authorized user choose, per AI Use Case, a model of the configured provider "
     "other than the Organization default."),
    ("FR-DA-AI-18", "The system shall let a user view, before and after a run, the exact prompt the AI Use Case sends — "
     "assembled from its Prompt Specification and resolved for the current task or step — together with the engine that "
     "answered (live model or built-in engine) and any fallback warning."),
  ]),
  ("FR-DA-GOV-08", [
    ("FR-DA-GOV-09", "The system shall let a RACSI assignment target an OBS Role as well as a named person, and shall "
     "resolve a role assignment to the people currently playing that role (Section 3.16) wherever the RACSI is used."),
    ("FR-DA-GOV-10", "The system shall provide a RACSI editor on every macro process, with one row per task or step and one "
     "column per RACSI letter, enforcing exactly one Accountable per row (FR-DA-GOV-07) and defaulting the owner of each "
     "step to its Responsible role."),
  ]),
  ("FR-DA-VER-06", [
    ("FR-DA-VER-07", "The system shall list, on every versioned entity, all its versions with number, label, author, date, "
     "change note and justification, and shall let an authorized user open any version read-only and restore it "
     "(FR-DA-VER-04) in one action."),
    ("FR-DA-VER-08", "The system shall version a composite entity — for example a macro process with its tasks and steps, "
     "or a gate with its associated checklists — so that restoring one of its versions restores its children, their order "
     "and their links as they were in that version."),
    ("FR-DA-VER-09", "The system shall support named baselines (Design Releases, Section 3.15) grouping chosen versions of "
     "several entities, which can be compared with each other and restored as one unit."),
  ]),
  ("FR-DA-NAV-11", [
    ("FR-DA-NAV-12", "The system shall show a Search button at the start of the primary menu, in every dock position, "
     "pinned or sliding; unpinned, the button stays visible on the edge handle. It shall open the global search "
     "(Section 4.37) and also be reachable by a keyboard shortcut."),
    ("FR-DA-NAV-13", "The system shall let the user filter the menu itself by typing in the search field of the menu, "
     "showing the matching items, favorites first, with their module group."),
  ]),
  ("FR-DA-ATT-04", [
    ("FR-DA-ATT-05", "The system shall version attachments: a user may upload a new version of an attachment with a note; "
     "the versions form one chain with number, author and date, the latest is shown by default, and every earlier "
     "version stays downloadable."),
    ("FR-DA-ATT-06", "The system shall let attachments be added to steps, documents and registers as well as to actions "
     "and checklist items, under FR-DA-ATT-01 to 05."),
  ]),
  ("NFR-DA-PERF-08", [
    ("NFR-DA-PERF-09", "The global search shall show its first suggestions within 300 milliseconds of typing and full "
     "results within 1 second at the 95th percentile, for a tenant's full data volume."),
    ("NFR-DA-PERF-10", "Restoring a version of a process element with up to 1,000 descendants shall complete within 5 "
     "seconds; generating a document of up to 50 pages from a template shall complete within 10 seconds."),
  ]),
  ("NFR-DA-SEC-16", [
    ("NFR-DA-SEC-17", "An Organization-level live-model key (FR-DA-AI-16) and any integration secret stored on the server "
     "shall be encrypted at rest with authenticated encryption (for example AES-256-GCM) under a key held outside the "
     "database; it shall never be returned in full, logged, cached beyond its request, exported or included in a backup "
     "restore to another tenant. NFR-DA-SEC-07 continues to govern a personal connection."),
    ("NFR-DA-SEC-18", "A search result, count, suggestion or snippet shall never reveal a record, a title or a value that "
     "the user could not open on its own screen."),
  ]),
  ("NFR-DA-REL-06", [
    ("NFR-DA-REL-07", "Every version of a versioned entity shall be stored complete and checksummed, so that viewing or "
     "restoring it reproduces its exact content; a failed restore shall leave the Current Version unchanged."),
  ]),
  ("NFR-DA-UX-10", [
    ("NFR-DA-UX-11", "Search shall be fully keyboard-operable (shortcut, arrow keys, Enter, Escape), group its results by "
     "type, highlight the matched words, and mirror under right-to-left languages."),
    ("NFR-DA-UX-12", "Every step shall show a one-line brief with an expandable detailed description, and every form field "
     "shall show how to fill it, in the user's display language."),
  ]),
  ("NFR-DA-MAINT-08", [
    ("NFR-DA-MAINT-09", "The process design, functions, OBS roles, Prompt Specifications, step form kinds and "
     "documented-information templates shall be configuration data, changed without code changes or downtime."),
  ]),
]

SECTIONS = [
  ("4.37 Global Search", "A user finds anything they may open from one place, whatever the screen they are on.", [
    ("FR-DA-SRCH-01", "The system shall provide a global search, opened from the Search button of the primary menu "
     "(FR-DA-NAV-12) or its keyboard shortcut, from every authenticated screen."),
    ("FR-DA-SRCH-02", "The system shall search, in the current Organization and within the scope of the user's rights: "
     "principal records, projects, process elements (functions, processes, phases, tasks, steps, gates, checklists, "
     "templates), governance items (rules, controls, risks, KPIs, RACSI), actions, registers, documents, attachment names, "
     "AI Use Cases, people and OBS units and roles, and Help topics."),
    ("FR-DA-SRCH-03", "The system shall match codes and identifiers exactly (for example a step code) and text by words, "
     "ignoring case and accents, in every supported language, and shall rank exact code matches first."),
    ("FR-DA-SRCH-04", "The system shall show results grouped by type, each with its code, title, location (project, process "
     "or register) and status, and open the chosen result on its own screen."),
    ("FR-DA-SRCH-05", "The system shall let the user filter results by type, project, process, status and date, and keep "
     "the user's recent searches as a personal preference."),
    ("FR-DA-SRCH-06", "The system shall apply to every result the RBAC, Solution Pack and tenant rules of the screen it "
     "opens (NFR-DA-SEC-18)."),
    ("FR-DA-SRCH-07", "The system shall update the search index when a record is created, changed or deleted, so a change "
     "is findable within one minute."),
  ]),
  ("4.38 Process Design Management", "The process design is managed as data, with full history, by the people "
   "entitled to change it.", [
    ("FR-DA-PDM-01", "The system shall support full Create, Read, Update, Delete and Duplicate on every Process Element: "
     "functions, end-to-end processes, phases, macro processes, tasks, steps, gates, checklists and their items, step "
     "forms and their fields, templates (project, checklist, document, questionnaire) and AI Use Cases, gated by a "
     "process-design management capability."),
    ("FR-DA-PDM-02", "The system shall version every Process Element under the generic Version Management service "
     "(Section 3.8): an edit creates a new version with its author, date, change note and justification (Section 3.7), "
     "and no version is rewritten or deleted."),
    ("FR-DA-PDM-03", "The system shall let an authorized user open any version of a Process Element read-only, compare "
     "any two versions field by field (FR-DA-VER-06), and restore any version as the new Current Version."),
    ("FR-DA-PDM-04", "The system shall version composite elements with their children (FR-DA-VER-08): restoring a version "
     "of a macro process restores its tasks and steps, their order, forms, links to gates, checklists, RACSI and AI Use "
     "Cases as they were."),
    ("FR-DA-PDM-05", "The system shall manage Design Releases through Draft, In review, Published and Retired; changes made "
     "in a draft release shall not affect running work until the release is published with the approval of an "
     "authorized user, and a published release shall be restorable."),
    ("FR-DA-PDM-06", "The system shall bind every running record to the element versions current when it started, or when "
     "its phase opened. A new version applies to new records; an authorized user may migrate running records to it after "
     "an impact preview, with a justification, and completed steps shall never change."),
    ("FR-DA-PDM-07", "The system shall show, before an element is changed, retired or deleted, what uses it: child elements, "
     "templates, releases and running records. An element used by a published release or a running record shall be "
     "retired rather than deleted; a retired or deleted element shall be restorable from its history."),
    ("FR-DA-PDM-08", "The system shall let an authorized user reorder elements, move a task or step to another parent and "
     "link or unlink elements, with the referential checks of FR-DA-TEN-05; identifiers shall be stable and never reused."),
    ("FR-DA-PDM-09", "The system shall let the platform share a reference process design read-only with all Organizations, "
     "and let an Organization customize it by copy; the copy shall keep the source and version it came from and be offered "
     "the changes of a newer source version, element by element."),
    ("FR-DA-PDM-10", "The system shall export a process design, or part of it, to a portable file (JSON and spreadsheet, "
     "with BPMN 2.0 for the diagrams) and import it back as new versions, never overwriting history."),
    ("FR-DA-PDM-11", "The system shall write every Create, Update, Delete, restore, migration and publication of a "
     "Process Element to the audit trail (Section 4.11)."),
  ]),
  ("4.39 OBS: Functions, Roles and People", "The OBS is made of units, roles and people. A role is linked to one or more "
   "functions, and a person can play one or more roles.", [
    ("FR-DA-OBS-01", "The system shall keep a catalog of functions per Organization, with full Create, Read, Update and "
     "Delete, versioned, each with a code, a name, a description and an optional parent function, and seed a default set "
     "on provisioning (FR-DA-TEN-14)."),
    ("FR-DA-OBS-02", "The system shall support full Create, Read, Update and Delete on OBS Roles, each defined in an OBS "
     "unit, with a name, a mission, responsibilities, required competences, an optional reporting role, and the default "
     "access roles it proposes to its holders."),
    ("FR-DA-OBS-03", "The system shall let an OBS Role be linked to one or more functions, and a function to several roles; "
     "a role shall be linked to at least one function."),
    ("FR-DA-OBS-04", "The system shall let a person play one or more OBS Roles, in the same or different units, through "
     "Role Assignments with a start date, an optional end date, an allocation percentage and a holder type (holder, "
     "deputy, acting), and shall let a role be played by several people."),
    ("FR-DA-OBS-05", "The system shall show the OBS by unit (units, roles and their holders), by function (the roles and "
     "people linked to each function) and by person (the roles a person plays), and as an organization chart."),
    ("FR-DA-OBS-06", "The system shall let step owners, RACSI letters, approvers, gate approvers, reviewers and notification "
     "targets be assigned to OBS Roles, and resolve them to the people currently playing the role; a role with no current "
     "holder shall raise an alert (Section 4.9)."),
    ("FR-DA-OBS-07", "The system shall, when a Role Assignment ends, move the open work assigned through that role to its "
     "remaining or next holder, and list the work assigned to the person by name for re-assignment."),
    ("FR-DA-OBS-08", "The system shall offer, wherever a person or a unit is chosen, pickers drawn from the OBS — people "
     "with their roles, roles with their holders, units with their type — rather than free text."),
    ("FR-DA-OBS-09", "The system shall keep OBS Roles distinct from RBAC access roles (Section 3.2); holding an OBS Role "
     "shall grant no permission by itself."),
    ("FR-DA-OBS-10", "The system shall version units, roles, role-function links and Role Assignments under Section 3.8, "
     "so the OBS as it was on any past date can be shown, and enforce the quotas of FR-DA-TEN-07."),
  ]),
  ("4.40 AI Use Case Mapping & Prompt Specification", "Every AI Use Case is attached to the right task or step and "
   "carries a complete, structured and versioned prompt.", [
    ("FR-DA-AIP-01", "The system shall link every AI Use Case to the tasks or steps it supports, the link naming the input "
     "fields it reads and the output fields it proposes, and shall show the use case only on those tasks and steps "
     "(FR-DA-AI-12, FR-DA-AI-13)."),
    ("FR-DA-AIP-02", "The system shall check each link for fit — the use case's expected output matches the output or a "
     "field of the step, and its inputs exist at that point of the process — and flag a link that fails the check for "
     "review."),
    ("FR-DA-AIP-03", "The system shall hold, for every AI Use Case, a Prompt Specification made of separate fields: Role "
     "(persona); Context (the process, task or step, the standards and clauses applicable, the Organization profile); "
     "Task (the instruction); Inputs (named variables bound to record and step data); Knowledge sources (the corpora and "
     "references to retrieve from); Constraints (what the answer must and must not do, including the grounding rule of "
     "FR-DA-AI-11); Examples (one or more input and output pairs); Output format (structure, fields, length and a schema "
     "where the output fills a form); Tone and language; Quality criteria (how a good answer is judged); Human checkpoint "
     "(who reviews and what they check); and Model parameters (model, temperature, maximum length)."),
    ("FR-DA-AIP-04", "The system shall let an authorized user edit each field of a Prompt Specification on its own, and "
     "shall version each change under Section 3.8 with its author, date and note."),
    ("FR-DA-AIP-05", "The system shall let the user see the history of the whole specification and of each field, compare "
     "any two versions, and restore any version of one field or of the whole specification as the new Current Version."),
    ("FR-DA-AIP-06", "The system shall require, before an AI Use Case can be activated, that Role, Context, Task, "
     "Constraints, Output format and Human checkpoint are filled, and shall show the completeness of every specification."),
    ("FR-DA-AIP-07", "The system shall populate every seeded or AI-suggested use case fully for the task or step it is "
     "linked to: the Context shall name that task or step, its inputs, outputs and applicable clauses; the Inputs shall "
     "bind to its actual fields; the Examples and the Output format shall match its form."),
    ("FR-DA-AIP-08", "The system shall assemble the prompt from the fields in a fixed, documented order, resolve every "
     "variable, and refuse to run when a required variable has no value, naming it."),
    ("FR-DA-AIP-09", "The system shall let an authorized user test a Prompt Specification on a chosen record before "
     "publishing a new version, without writing the result to the record."),
    ("FR-DA-AIP-10", "The system shall record in the AI Usage Log (FR-DA-AI-07) the use case, the specification version, the "
     "engine and model used, and the outcome of every run."),
    ("FR-DA-AIP-11", "The system shall let an AI Use Case be suggested for a task or step that has none — by rule or with "
     "AI — as a draft with a fully populated Prompt Specification, activated only after a person reviews it."),
  ]),
  ("4.41 Process Element Naming & Descriptions", "Names say what is done; descriptions say how.", [
    ("FR-DA-NAM-01", "The system shall require an explicit name for every task and step, beginning with an action verb "
     "followed by its object (for example “Identify the interested parties”), unique within its parent, in every "
     "supported language."),
    ("FR-DA-NAM-02", "The system shall check names on save — missing verb, generic wording, abbreviation, duplicate — and "
     "show each finding as a warning that the user may accept or correct."),
    ("FR-DA-NAM-03", "The system shall give every step a brief (one line, shown by default) and a detailed description "
     "(purpose, inputs, how to fill each field, expected result), expandable and collapsible, in every supported language."),
    ("FR-DA-NAM-04", "The system shall show on every step its process, inputs and outputs, the standards and clauses of the "
     "record that it covers, and the rules and controls that apply to it."),
  ]),
  ("4.42 Typed Step Forms & Process Readiness", "Each step collects the information it needs in a form suited to it, and "
   "its completion feeds the registers that follow.", [
    ("FR-DA-SFM-01", "The system shall give every step a Step Form Kind from a catalog — at least record table, assessment "
     "matrix, decision, objectives, plan, communication, training, monitoring, review, assignment, configuration, document "
     "and free record — each with its own fields, checks and completion effects."),
    ("FR-DA-SFM-02", "The system shall capture lists as tables of rows, one row per item, with add, edit and delete, each "
     "row carrying its source (a named record, study, interview or date) rather than free text."),
    ("FR-DA-SFM-03", "The system shall provide a decision or assessment matrix with criteria, weights, scores on a stated "
     "scale and the facts justifying each score, computing the weighted score and showing the scale next to it "
     "(FR-DA-HLP-04)."),
    ("FR-DA-SFM-04", "The system shall, when a step is completed, create or update the records it implies — rows of a plan "
     "become actions, objectives become entries of the objectives register, KPI rows become KPI values with their "
     "alerts — and link each created record back to its row."),
    ("FR-DA-SFM-05", "The system shall let a KPI be chosen from the KPI catalog, or created in place, with the reason it is "
     "monitored, and let people and units be chosen from the OBS (FR-DA-OBS-08)."),
    ("FR-DA-SFM-06", "The system shall validate the mandatory fields of a form before completion, naming each missing field, "
     "and lock the step once the gate of its phase is passed (FR-DA-AUD-05 governs reopening)."),
    ("FR-DA-SFM-07", "The system shall show, before a macro process starts, an optional Readiness Checklist: required inputs, "
     "completed predecessor processes, owner and RACSI assigned, templates available and KPIs defined. Items the system can "
     "verify shall be checked automatically; the checklist shall inform and never block."),
  ]),
  ("4.43 Documented Information Templates & Generated Documents", "Controlled documents and records are produced from the "
   "application's own data, not retyped.", [
    ("FR-DA-DOC-01", "The system shall keep a library of documented-information templates with full Create, Read, Update, "
     "Delete and Duplicate, versioned, each with a code, a category, the formats it produces (Word, PDF, Excel), and "
     "ordered sections typed as text, table or approval block."),
    ("FR-DA-DOC-02", "The system shall let each section be bound to a named data source of the application (for example "
     "context issues, interested parties, objectives, KPIs, risks, RACSI, audits, nonconformities, actions), with free text "
     "that may use variables such as the Organization name."),
    ("FR-DA-DOC-03", "The system shall list, per standard in scope, the documented information it requires — to maintain (a "
     "document) or to retain (a record) — with the template and the document that answer each requirement, and create a "
     "missing one in one action."),
    ("FR-DA-DOC-04", "The system shall generate a document from a template and the current data of a project, as a draft "
     "version, and let it be regenerated from newer data or edited section by section."),
    ("FR-DA-DOC-05", "The system shall manage document versions through Draft, In review and Published, with approval by a "
     "person other than the author (two-person rule) and a change note; one version is published at a time and earlier "
     "versions stay downloadable."),
    ("FR-DA-DOC-06", "The system shall download every document version in each of its formats, with a cover page, a table "
     "of contents where relevant, headers, footers and page numbers."),
    ("FR-DA-DOC-07", "The system shall let an Organization set its document layout — logo, colors, fonts, header and footer "
     "— applied to every generated document."),
    ("FR-DA-DOC-08", "The system shall let an Organization copy a library template to adapt it; its copy replaces the "
     "library template within the tenant and keeps the version it came from."),
    ("FR-DA-DOC-09", "The system shall let a document be retired, with a justification, rather than deleted once published; "
     "a draft may be deleted."),
    ("FR-DA-DOC-10", "The system shall link generated documents to the step, process and project they come from, and show "
     "them on that step."),
    ("FR-DA-DOC-11", "The system shall seed the template library and, in the demonstration data (FR-DA-OPS-09), documents "
     "generated for every seeded project, ready to download."),
  ]),
]

ENTITIES = [
  ("Function", "A business function of an Organization; versioned; linked to OBS Roles and process elements."),
  ("OrgRole", "An OBS Role defined in an OBS unit, with mission, responsibilities and proposed default access roles."),
  ("RoleFunction", "The link between an OBS Role and a Function (many to many)."),
  ("RoleAssignment", "A person playing an OBS Role: start and end dates, allocation, holder type."),
  ("ProcessElement / ProcessElementVersion", "Any element of the process design and its immutable versions."),
  ("DesignRelease", "A named snapshot of chosen element versions, with its lifecycle status."),
  ("RecordDesignBinding", "The element versions a running record, or one of its phases, is bound to."),
  ("PromptSpecification / PromptFieldVersion", "The structured prompt of an AI Use Case and the versions of each field."),
  ("AIUseCaseLink", "The link of an AI Use Case to a task or step, with the input and output fields it uses."),
  ("StepForm / StepFormField", "The form kind of a step and its fields, checks and completion effects."),
  ("ReadinessItem", "An item of the readiness checklist of a macro process, with its automatic check."),
  ("DocumentTemplate / TemplateSection", "A documented-information template and its typed, data-bound sections."),
  ("Document / DocumentVersion", "A controlled document of a project and its versions, with status, approval and content."),
  ("DocumentLayout", "The logo, colors, fonts, header and footer of an Organization's documents."),
  ("AttachmentVersion", "A version of an attachment in its chain, with number, author, date and note."),
  ("SearchIndexEntry", "A tenant-scoped, rights-aware index entry of a searchable item."),
]

UI_PARA = ("Revision 1.5 adds a Search button at the start of the primary menu with a global search screen; a process design "
  "workspace with version history, comparison and restore on every element; OBS views by unit, by function and by "
  "person with an organization chart; a Prompt Specification editor with one field per aspect; typed step forms with "
  "record tables and decision matrices; a readiness checklist on every macro process; and a Documents screen with "
  "required documents, templates and layout.")

CONFORMANCE = [
  ("Global search (FR-DA-SRCH, NFR-DA-PERF-09)", "Search button in the menu; rights-aware search over every item type.",
   "Search button at the top of the menu and Ctrl+K; steps, macro processes, records, register entries, documents, AI Use "
   "Cases, people and Help, grouped by type with filters, within the user's rights; menu filter: Met."),
  ("Process design management (FR-DA-PDM)", "Full CRUD with version history and restore of any version on every process element.",
   "Process design editor with create, read, update, retire or delete and restore on functions, phases, macro processes, "
   "tasks, steps, gates and checklists (templates in the document library); every save is a version with compare and "
   "restore; usage shown before a change; running projects keep the version they started with. Named Design Releases and "
   "import or export of the design are not yet available: Partial (core met)."),
  ("OBS role model (FR-DA-OBS)", "Units, roles linked to functions, people playing several roles.",
   "OBS roles defined in units and linked to one or more functions; people assigned as holder, deputy or acting with "
   "allocation and dates; views by role, by function and by person; vacant roles flagged; hand-over of open work when an "
   "assignment ends; roles versioned and separate from access roles: Met."),
  ("AI prompt specification (FR-DA-AIP)", "Separate, versioned prompt fields fully populated per task or step.",
   "Each AI Use Case linked to one step; Prompt Specification with one field per aspect (role, context, task, inputs, "
   "knowledge, constraints, examples, format, tone, quality criteria, human checkpoint, model parameters), each with its "
   "own versions and restore, plus whole-specification versions; completeness required for activation; all use cases "
   "populated from their step; assembled prompt visible: Met."),
  ("Naming, step forms, readiness, documents (FR-DA-NAM, SFM, DOC)", "Explicit names and descriptions; typed forms; "
   "readiness checklist; documented-information templates.", "Implemented in DynamicMS (September 2026 build), with "
   "procedures carrying SIPOC per step, Go / No-Go decisions and BPMN diagrams: Met."),
]

CHANGELOG = [
  ("Cover, 1.1, 1.2, 1.5, 1.6", "Version 1.5", "Version raised to 1.5; purpose, scope and overview describe the revision; "
   "the DynamicMS reference build added to the references."),
  ("1.4 Definitions", "12 terms added", "Function, OBS Role, Role Assignment, Process Design, Process Element, Design Release, "
   "Current Version, Prompt Specification, Step Form Kind, Readiness Checklist, Documented Information Template, Global Search."),
  ("2.2, 2.3", "3 principles, 4 functions", "Versioned process design; accountability through roles; explicit prompts. "
   "Global search; process design management; OBS role model; generated documents."),
  ("3.15 – 3.18 (new)", "Architecture", "Process design and versioning; OBS role model; AI prompt specification; global search."),
  ("4.4 AI Use Case Library", "FR-DA-AI-16 – 18 (new)", "Organization-level live model stored encrypted; model per use case; "
   "view of the assembled prompt and of the engine used."),
  ("4.6 Governance", "FR-DA-GOV-09 – 10 (new)", "RACSI assigned to OBS Roles; RACSI editor per macro process."),
  ("4.16 Version Management", "FR-DA-VER-07 – 09 (new)", "List and restore of any version; composite versions; named baselines."),
  ("4.19 Navigation Shell", "FR-DA-NAV-12 – 13 (new)", "Search button in the menu, in every dock position; menu filter."),
  ("4.24 Attachments", "FR-DA-ATT-05 – 06 (new)", "Attachment version chains; attachments on steps, documents and registers."),
  ("4.37 (new) Global Search", "FR-DA-SRCH-01 – 07 (new)", "Scope, matching, results, filters, rights, index freshness."),
  ("4.38 (new) Process Design Management", "FR-DA-PDM-01 – 11 (new)", "CRUD and versions on every process element; compare "
   "and restore; composite versions; Design Releases; binding of running records; impact check; sharing and customization; "
   "import and export; audit."),
  ("4.39 (new) OBS: Functions, Roles and People", "FR-DA-OBS-01 – 10 (new)", "Functions; roles linked to one or more "
   "functions; people playing one or more roles; views; assignment and resolution through roles; hand-over; pickers; "
   "separation from RBAC; history."),
  ("4.40 (new) AI Use Case Mapping & Prompt Specification", "FR-DA-AIP-01 – 11 (new)", "Mapping to tasks and steps with fit "
   "check; separate prompt fields; field and whole versions with restore; completeness; full population per step; "
   "assembly; test; logging; suggestion of new use cases."),
  ("4.41 (new) Naming & Descriptions", "FR-DA-NAM-01 – 04 (new)", "Verb-object names; naming checks; brief and detailed "
   "descriptions; step context."),
  ("4.42 (new) Typed Step Forms & Readiness", "FR-DA-SFM-01 – 07 (new)", "Form kinds; record tables with sources; decision "
   "matrix; completion effects; KPI and OBS pickers; validation and lock; readiness checklist."),
  ("4.43 (new) Documented Information", "FR-DA-DOC-01 – 11 (new)", "Template library; data-bound sections; documents "
   "required by the standards; generation; versions and approval; downloads; layout; tenant copies; retirement; links; seed."),
  ("5.1, 5.2, 5.3, 5.5, 5.8", "NFR-DA-PERF-09 – 10, SEC-17 – 18, REL-07, UX-11 – 12, MAINT-09 (new)", "Search and restore "
   "times; encrypted Organization key; rights-safe search; complete versions; keyboard search; step descriptions; "
   "configuration data."),
  ("6 Data Model", "16 entities", "Function, OrgRole, RoleFunction, RoleAssignment, ProcessElement(Version), DesignRelease, "
   "RecordDesignBinding, PromptSpecification, PromptFieldVersion, AIUseCaseLink, StepForm(Field), ReadinessItem, "
   "DocumentTemplate, TemplateSection, Document(Version), DocumentLayout, AttachmentVersion, SearchIndexEntry."),
  ("7.1 User Interface", "1 paragraph", "Screens added by revision 1.5."),
  ("Appendix A", "5 rows", "Conformance of the 1.5 additions in the DynamicMS reference build."),
  ("Appendix G (new)", "Change log", "This change log."),
]
