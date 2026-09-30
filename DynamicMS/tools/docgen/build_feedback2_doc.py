"""Builds "DynamicMS — Response to the feedback, round 2": the SRS 1.5 features implemented in
the application (search, process design management, OBS roles, AI prompt specification) and
the eight requests on the IMS documents (policy, procedures, audit programme and report,
registers and records), with what changed and where to see it."""
import json
import os
from brand import (new_document, cover, toc, para, bullets, numbered, table, callout, image)

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BUILD = os.path.join(ROOT, 'deliverables', 'build')
OUT = os.path.join(ROOT, 'deliverables')
SHOT = os.path.join(BUILD, 'deck-en')
PAGE = os.path.join(BUILD, 'sample-pages')

SRS = [
    ('Search button in the left bar', 'Search button at the top of the menu (and Ctrl+K). One query searches steps, macro processes, records (nonconformities, actions, audits, risks, KPIs), register entries, documents, AI use cases, people and help, within the rights of the user. Results are grouped by type with counts and filters; codes (MP-001.2, NC-…) match exactly; arrow keys and Enter open a result; recent searches are kept. A filter box above the menu narrows the menu items.', 'Menu › Search; Ctrl+K', 'FR-DA-SRCH'),
    ('Full CRUD on functions, macro processes, tasks, steps, gates, checklists and templates', 'Design › Process design editor: one tab per element type (functions, phases, macro processes, tasks, steps, gates, checklists). Create, edit, retire or delete, restore. Each element shows where it is used (runs, child elements, documents, AI use cases). Templates keep their own library (copy, new, retire, versions) in Records › Documents › Templates.', 'Design › Process design editor', 'FR-DA-PDM'),
    ('Version management with the possibility to go to any version', 'Every save is a new version with its author, date and change note. History lists the versions, Compare shows the fields changed between two versions, Restore makes any earlier version the current one (as a new version, so nothing is lost). Running projects keep the version they started with; a change applies to projects started after it.', 'History button of any element', 'FR-DA-PDM, FR-DA-VER'),
    ('OBS: a role is linked to one or more functions; a person plays one or many roles', 'Organization › Roles: roles defined in a unit, linked to at least one function, with mission and responsibilities. People are assigned as holder, deputy or acting, with an allocation (%) and dates. Three views: by role (vacant roles flagged), by function (roles and people), by person (roles played and total allocation). Ending an assignment lists the open actions to hand over. Roles are versioned.', 'Organization › Roles', 'FR-DA-OBS'),
    ('AI use case mapped to the right task or step', 'Each AI use case is linked to one step (and so to its task and macro process); the link is checked when saved. The step shows only its own use case. Search and the process design editor show the use cases of an element.', 'Intelligence › AI use cases; any AI-assisted step', 'FR-DA-AIP'),
    ('Prompt aspects in separate fields: role, context, task, constraints, examples, format, other', 'Prompt specification with one field per aspect: role (persona), context, task (instruction), inputs, knowledge sources, constraints, examples, output format, tone, quality criteria, human checkpoint and model parameters (model, temperature, maximum length). A completeness bar shows the missing required fields; an incomplete use case cannot be activated.', 'AI use cases › Prompt specification', 'FR-DA-AIP'),
    ('Each prompt aspect versioned, with the possibility to go to any version', 'Each field has its own history (compare, restore); the whole specification has its history too. View the assembled prompt shows the system and user messages built from the fields and the project data.', 'Prompt specification › History', 'FR-DA-AIP, FR-DA-VER'),
    ('Every suggested AI use case fully populated for its step', 'All use cases are seeded with every field written from their step: the role of the performer, the macro process and step context, the step instruction, its inputs and records, the constraints of the standard clause, an example and the expected output format.', 'AI use cases (all)', 'FR-DA-AIP'),
]

ITEMS = [
    ('1', 'Policy: more consistent, with real content from the market (example: the French quality policy provided)',
     'The four policies (quality, integrated QHSE, environment, OHS) follow the structure of the example and of published policies: our vision and ambition; our strategic axes, each with its commitments and the objective that measures it; commitments of top management (ISO §5.2 commitments stated explicitly: requirements, continual improvement, and for ISO 14001 protection of the environment and compliance obligations, for ISO 45001 elimination of hazards and consultation of workers); everyone\'s role; communication and review of the policy; dated signature of the chief executive. One page, no table of contents, the organization\'s own name, activity and figures.',
     'Records › Documents › Quality policy (AT-UNI-QMS-POL-Q)'),
    ('2', 'Procedures: SIPOC for the steps, Go / No-Go decision, BPMN diagram',
     'The procedure and the macro process sheet now carry: the SIPOC of the process; the BPMN flow (vertical swimlanes by role, gateways, exception flows) drawn as an image in Word and PDF; the description of activities with, for each step, a SIPOC table (suppliers, inputs, activity, outputs, customers); a Go / No-Go decision with its criteria, the evidence required, who decides and what happens on No-Go.',
     'Procedure (TPL-PROC), macro process sheet (TPL-PSHEET)'),
    ('3', 'All documents reflect market best practices',
     'All 37 templates were revised against the practice of certification bodies and published models: a document identification block (reference, version, owner, approver, dates, classification), purpose and scope, method or rating scales, data tables with one row per item, analysis and conclusions, revision history and approval block. The IMS Document Templates guide lists, for each template, the practice it follows.',
     'IMS Document Templates; every template'),
    ('4', 'Audit programme: frequency with a dropdown list and custom',
     'Frequency of each audit: Monthly, Quarterly, Semi-annual, Annual, Every 2 years, Every 3 years or Custom with its own text (for example "once, six weeks before the certification audit"). Also added: criteria, objectives, duration and processes audited. The programme document shows the frequency per process, set from the risks and the results of previous audits, and the auditors with their qualification.',
     'Records › Audits › New audit or Edit; Internal audit programme'),
    ('5', 'Audit report: detailed nonconformity report with grading (minor, major, …) and other relevant information',
     'Findings graded Major nonconformity, Minor nonconformity, Observation or Opportunity for improvement, with the grading rules in the report. Each nonconformity has its own detailed sheet: requirement (standard and clause), statement of nonconformity, objective evidence, process and auditee, root cause, correction, corrective action with owner and due date, verification of effectiveness and status. The report adds an executive summary, strengths, summary of findings by grade and clause, conclusion and follow-up.',
     'Records › Audits › an audit › Findings; Internal audit report'),
    ('6', 'Monitoring and measuring equipment register: more consistent, fine grained and complete',
     'Per instrument: identifier, category, manufacturer, model, serial number, location, user, range, resolution, required accuracy, method (internal or accredited external), provider, certificate, interval, last and next calibration, last result, error found (% of the maximum permissible error), traceability to national standards, and the assessment of earlier results when found out of tolerance (ISO 9001 §7.1.5.2). The document adds the calibration status summary and the calibration records.',
     'Records › Registers › Measuring equipment; TPL-CAL'),
    ('7', 'Corrective action report: more consistent, fine grained and complete',
     '8D report: D0 identification; D1 team; D2 problem description (5W2H: what, where, when, who, how, how many, why it matters); D3 containment with its effectiveness; D4 root cause (5 Why and Ishikawa per category, occurrence and non-detection causes); D5–D6 corrective actions with owner, due date and validation evidence; D7 prevention of recurrence (documents, FMEA, similar products and sites); D8 closure, lessons learned and team recognition.',
     'Nonconformities › a nonconformity; TPL-CAPA'),
]

EIGHT = [
    ('Control of changes record', 'Change type, requester, reason, impacted processes and documents, likelihood and impact (risk level), resources, approval (who, when), implementation, verification, post-change review and integrity of the management system (ISO 9001 §6.3, §8.5.6).'),
    ('Communication plan and records', 'Plan: what, with whom, who, how, when, why (ISO §7.4), internal or external, language, record kept, feedback expected. Records: date, audience, channel, by, reach, evidence and feedback; communications recorded in the steps are listed too.'),
    ('Competence matrix and training records', 'Competence requirements per role; matrix with levels 1–4, required level, gap and criticality; how the competence was acquired and its evidence; training plan; training records with provider, trainer, hours, participants, evaluation, result, effectiveness method and certificate.'),
    ('Control plan', 'Identification of the product and process; per characteristic: product or process, class (critical, significant), specification, measurement technique, sample and frequency, control method, responsible, record and reaction plan; reaction plan rules; operational controls and business rules.'),
    ('Context and interested parties analysis', 'Method; external issues by PESTLE with impact; internal issues; SWOT synthesis; interested parties with needs and expectations, relevance and how they are addressed; influence and interest grid; process interactions; conclusions as risks and opportunities to address; monitoring and review.'),
    ('Master list of documented information', 'Documentation structure (levels 1–4); documents to maintain with reference, version, owner, approval and review dates; records to retain with retention period, storage, protection and disposal; documents of external origin; cross-reference to the documented information required by each standard.'),
    ('KPI dashboard and measurement results', 'Summary (on target, watch, off target); results and trends per indicator with baseline, target, last values and trend; analysis of indicators off target with cause and action; indicator definitions (formula, frequency, source, owner).'),
    ('Compliance obligations register', 'Per obligation: type (legal, regulatory, customer, voluntary), reference, authority, requirement, applicability, how complied, owner, evaluation interval, last and next evaluation, result, evidence and action; summary of the evaluation of compliance; actions for partial or non compliance.'),
    ('Management system manual', 'Presentation of the organization; scope and exclusions; context; processes and their interactions; leadership; roles and authorities; planning; support; operation; performance evaluation; improvement; each chapter answering the clauses of the standards with links to the documents that apply them.'),
    ('Management review minutes', 'Attendance; agenda; every input of ISO §9.3.2 with data (status of previous actions, changes, satisfaction, objectives, process performance, nonconformities, audits, suppliers, resources, risks, opportunities); outputs of §9.3.3 as decisions with owner and due date; conclusion on suitability, adequacy and effectiveness.'),
    ('All other documents of the sample', 'Scope, process map, RACSI, registers (risks and opportunities, interested parties, suppliers, nonconforming outputs, aspects, HIRA), objectives and action plan, work instruction, requirements review, release, emergency plan, incident report, nonconformity register and improvement plan were revised in the same way (identification block, method and scales, one row per item, analysis, approval).'),
]

FILES = [
    ('Server', 'services/diagram.js (BPMN and process map drawn in SVG, rendered to images for Word and PDF), services/docdata.js (content of every template), services/render.js (tables, diagrams, landscape pages, Excel sheets per table), content/templates.js, content/registers.js, routes/design.js (search, process design, OBS roles, prompt specification), routes/records.js (audit frequency, findings), services/obsroles.js, services/aiprompt.js, services/revert.js.'),
    ('Web client', 'SearchModal (search), pages/ProcessDesign (process design editor), components/ObsRoles (roles), components/PromptSpec (prompt specification), Versions (history, compare, restore), Audits (frequency, graded findings), Registers (entry details with all fields), Documents (diagrams, key–value blocks).'),
    ('Tests', '13 automated tests pass, including search, process design versions and restore, OBS roles and assignments, prompt specification and activation rule, audit frequency and findings.'),
]


def build():
    tpl = json.load(open(os.path.join(BUILD, 'templates.json'), encoding='utf8'))
    doc = new_document('Response to the feedback, round 2', 'DynamicMS — Feedback response, round 2')
    cover(doc, 'Feedback response · Round 2', 'Response to the Feedback — Round 2', 'Search, process design versions, OBS roles, AI prompt specification and IMS documents aligned with market practice', 'POWERACT Consulting · DynamicMS 1.0 · September 2026')
    toc(doc)

    doc.add_heading('Summary', level=1)
    para(doc, 'The second round of feedback asked for two groups of changes: the features added to the application standard (SRS 1.5) to be implemented in DynamicMS, and eight improvements to the IMS documents, starting from a French quality policy given as an example. POWERACT Consulting implemented both in the application, the demonstration data and the deliverables.')
    bullets(doc, [
        ('Application. ', 'Global search in the menu; process design editor with full create, read, update and delete and a version history with compare and restore on every element; OBS roles linked to functions and played by several people; AI use cases linked to one step, with a prompt specification of one versioned field per aspect.'),
        ('Documents. ', f"{len(tpl['templates'])} templates revised against market practice; policies modelled on the example; procedures with SIPOC per step, Go / No-Go decision and BPMN diagram; audit programme with frequency; audit report with graded, detailed nonconformities; registers and records made finer grained."),
        ('Data. ', f"{tpl['totals']['documents']:,} documents regenerated across {tpl['totals']['projects']} projects; the sample set (Scenario 1 QMS and Scenario 2 QHSE) is delivered in DynamicMS_Sample_IMS_Documents.zip."),
        ('Deliverables. ', 'This response; SRS 1.5 (Appendix A conformance updated); IMS Document Templates; User Guides 1 and 2; Installation Guide; Coverage Checklist; presentations in English and French; source code.'),
    ])

    doc.add_heading('SRS 1.5 features implemented in DynamicMS', level=1)
    para(doc, 'The requirements added to DynamicCortex Apps Standard SRS 1.5 are application agnostic. The table shows how DynamicMS meets each of them.')
    table(doc, ['Request', 'What changed', 'Where', 'SRS'], [[a, b, c, d] for a, b, c, d in SRS], [4.2, 8.8, 3.2, 1.8], size=8.5)
    image(doc, os.path.join(SHOT, 'f-search.png'), 16, 'Global search: results grouped by type, with filters, within the rights of the user.')
    image(doc, os.path.join(SHOT, 'f-design-edit.png'), 16, 'Process design editor: every element has its version, origin, usage and history.')
    image(doc, os.path.join(SHOT, 'f-roles.png'), 16, 'OBS roles: each role linked to its functions and played by one or more people.')
    image(doc, os.path.join(SHOT, 'f-prompt.png'), 16, 'Prompt specification: one field per aspect, each with its own history, and a completeness bar.')

    doc.add_heading('Requests 1 to 7 — documents and records', level=1)
    table(doc, ['#', 'Request', 'What changed', 'Where'], [list(x) for x in ITEMS], [0.8, 4.0, 9.8, 3.4], size=8.5)
    doc.add_heading('Policy modelled on the example', level=2)
    para(doc, 'The example provided (a French quality policy) opens with the ambition of the company, sets out a few strategic axes each carrying concrete commitments, names the role of every employee and ends with the signature of the chief executive. The DynamicMS policies now follow that pattern while keeping every commitment required by ISO 9001, ISO 14001 and ISO 45001 §5.2 explicit, and link each axis to a measurable objective.')
    image(doc, os.path.join(PAGE, 'POL-Q-p1.png'), 13, 'Quality policy generated for Atlas Universal SME (page 1).')
    doc.add_heading('Procedure with SIPOC, Go / No-Go and BPMN', level=2)
    image(doc, os.path.join(PAGE, 'PROC-p5.png'), 13, 'Procedure: BPMN flow drawn in vertical swimlanes by role.')
    image(doc, os.path.join(PAGE, 'PROC-p6.png'), 13, 'Procedure: description of activities with the SIPOC of each step.')
    doc.add_heading('Audit programme and audit report', level=2)
    image(doc, os.path.join(SHOT, 'f-audit-detail.png'), 16, 'Audit with its frequency and findings graded major, minor, observation or opportunity.')
    image(doc, os.path.join(PAGE, 'AUDREP-p4.png'), 13, 'Internal audit report: detailed sheet of a nonconformity.')
    doc.add_heading('Measuring equipment and corrective action', level=2)
    image(doc, os.path.join(SHOT, 'f-register-entry.png'), 16, 'Register entry with all its fields (measuring equipment).')
    image(doc, os.path.join(PAGE, 'CAL-p2.png'), 13, 'Monitoring and measuring equipment register.')
    image(doc, os.path.join(PAGE, 'CAPA-p3.png'), 13, 'Corrective action report (8D).')

    doc.add_heading('Request 8 — the other documents', level=1)
    para(doc, 'The same approach — more consistent, finer grained and more complete — was applied to the documents listed and to the rest of the sample set.')
    table(doc, ['Document', 'What it now contains'], [list(x) for x in EIGHT], [4.4, 13.6], size=9)
    image(doc, os.path.join(PAGE, 'MR-p3.png'), 13, 'Management review minutes: inputs of §9.3.2 with data.')
    image(doc, os.path.join(PAGE, 'CTX-p4.png'), 13, 'Context and interested parties analysis.')

    doc.add_heading('What changed in the code', level=1)
    table(doc, ['Part', 'Change'], [list(x) for x in FILES], [3.2, 14.8], size=9)

    doc.add_heading('How to check the changes', level=1)
    numbered(doc, [
        'Install and seed the application (Installation Guide). Sign in as ims@atlas-sme.example (password Demo@2026) and select project AT-UNI-QMS.',
        'Press Search in the menu (or Ctrl+K) and type "policy" or a code such as MP-002: results are grouped by type.',
        'Open Design › Process design editor, choose a step, change its detailed description and save: the version goes up. Open History, compare two versions and restore the first one.',
        'Open Organization › Roles: view the roles by function and by person; assign a person as deputy with 50 % allocation.',
        'Sign in as admin@atlas-sme.example (Admin@2026). Open Intelligence › AI use cases › Prompt specification: change the constraints, save, open the history of that field and restore the earlier text.',
        'Open Records › Audits: create an audit with a custom frequency; open an audit with findings to see the grading and the details of each nonconformity.',
        'Open Records › Documents and download the quality policy, a procedure, the audit report, the measuring equipment register and the corrective action report in Word, PDF or Excel.',
    ])
    callout(doc, 'Changes made in the process design editor apply to projects started after the change. Projects already running keep the version they started with, so their records stay consistent with the design they followed.', 'Note.')
    path = os.path.join(OUT, 'DynamicMS_Feedback_Response_Round_2.docx')
    doc.save(path)
    print('saved', path)


if __name__ == '__main__':
    build()
