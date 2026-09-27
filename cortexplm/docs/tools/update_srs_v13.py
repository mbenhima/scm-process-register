"""Produce revision 1.3 of the Dynamic Apps Standard SRS from revision 1.2 (built by update_srs_v12.py).

Integrates the application-agnostic Verticals and SME requirements (Verticals_and_SME_Req_SRS) generalized to
platform vocabulary, and adds the project template catalog (universal or per vertical, Full or SME mode), the
three project creation modes (from the catalog, manual, with AI) and the gate and checklist library attachable
to any project phase. Formats are cloned from the document itself; the manual TOC page numbers are set
afterwards by srs_toc_pages.py.

usage: python3 update_srs_v13.py <srs_v1.2.docx> <srs_v1.3.docx>
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
T_TOC2 = para('4.24 Attachments', 'Normal')
T_TOC1 = para('Appendix C — Revision 1.2 Change Log', 'Normal')

T_REF = para('CortexPLM — Reference implementation')
SRC_DOC = 'Application-Agnostic Requirements for Verticals and SME'

# ---------------------------------------------------------------- cover, purpose, references, overview
set_runs(para('Version 1.2'), ['Version 1.3  ·  September 2026  ·  Confidential'])
Cursor(para('Revision 1.2 adds a second set')).body(
    'Revision 1.3 integrates the application-agnostic requirements for the Vertical and SME layers — the vertical '
    'framework, vertical processes, data, compliance, integration and configuration, the SME mode with its tracks, '
    'complexity scoring, onboarding, packaging and pricing, and their combination — restated as Dynamic App '
    'requirements. It also adds, for any Dynamic App, a project template catalog (universal or per vertical, Full or '
    'SME mode) with full CRUD, three ways to create a project (from the catalog, manually, or with AI), and a gate and '
    'checklist library whose entries can be created and attached to any project phase. Appendix D lists the changes '
    'and Appendix E traces every source requirement family to its requirements here.')
Cursor(T_REF).add(T_REF, [f'{SRC_DOC} — Vertical and SME layers of any PLM or PSLM platform (29 verticals, SME framework, '
                          'Vertical × SME intersection, non-functional requirements, traceability and requirements governance), 2026.'])
Cursor(para('Revision 1.2 adds Sections 4.22')).body(
    'Revision 1.3 adds Section 3.14, Sections 4.25 to 4.35, new requirements in Sections 4.13, 4.23, 5.1 to 5.6, 5.8 '
    'and 5.10, and Appendices D (change log) and E (traceability to the Verticals and SME source). Nothing was removed '
    'or renumbered.')

# ---------------------------------------------------------------- 1.4 definitions
add_rows(d.tables[0], [
    ('Vertical', 'An industry sector (for example Automotive, Food & Beverage, Public Education) defined as a first-class, versioned configuration entity that activates its own macro processes, E2E processes, data extensions, compliance mappings, checklists and gate criteria.'),
    ('Vertical Instance', 'The content of one vertical — its prefix, macro and E2E processes, data model, compliance, integration, configuration and governance — delivered as configuration data, not as platform code.'),
    ('SME', 'A small or medium-sized enterprise, by default 1–250 employees (EU) or up to 500 (US SBA), thresholds configurable per region, segmented into Micro (1–10), Small (10–50) and Medium (50–250).'),
    ('Mode (Full / SME)', 'The rigor profile of a project: Full mode runs the complete process set; SME mode runs a right-sized SME track.'),
    ('SME Track', 'One of two to four configurable levels of process rigor for SME mode, each defining its macro and E2E processes, gates, checklist items per gate and typical duration.'),
    ('Complexity Score', 'A weighted score of configurable criteria (weights summing to 100 %), including vertical-specific drivers, that recommends the track of a project.'),
    ('Project Template Catalog', 'The governed, versioned library of project templates, each classified by scope (universal or one vertical) and mode (Full or SME, with its track).'),
    ('Creation Mode', 'The way a project is created: from the catalog, manually, or with AI (an AI-drafted project reviewed and accepted by a person).'),
    ('Phase', 'A stage of a project\'s process chain (for example an E2E process or a lifecycle stage) to which gates and checklists are attached.'),
    ('Gate Definition', 'A reusable decision point — name, criteria, approvers, decision options Go / No-Go / Hold / Recycle — kept in a library and attachable to any phase.'),
    ('Pack / Bundle', 'A priced commercial package: an SME pack, a vertical pack, or a bundle of both.'),
])

# ---------------------------------------------------------------- 2.3 product functions
Cursor(para('Protect and upgrade data in place')).bullet(
    'Activate verticals and an SME mode by configuration, score project complexity to choose the right track, and start '
    'projects from a governed template catalog, by hand, or with AI, with gates and checklists attached to any phase.')

# ---------------------------------------------------------------- 3.14 architecture
anchor = d.paragraphs[[i for i, p in enumerate(d.paragraphs) if p.text.startswith('4. Common Functional Requirements') and p.style.name.startswith('Heading')][0] - 1]
c = Cursor(anchor)
c.h2('3.14 Vertical & SME Layer Architecture')
c.body('Requirements are organized in five layers, each built on the one below: Layer 1 Platform (tenancy, security, '
       'operations), Layer 2 Core (the common requirements of this standard), Layer 3 Vertical (sector content), '
       'Layer 4 SME Track (right-sized rigor for small and medium enterprises) and Layer 5 Packaging & Pricing. A '
       'vertical and an SME track are configuration data interpreted by the platform: adding, versioning, activating, '
       'rolling back or retiring them never requires a change to platform code or downtime.')
c.body('Activation is additive and ordered. An Organization activates zero or more verticals; each activates its macro '
       'processes (three to five) and E2E processes (two to four). When an SME selects a vertical, the vertical '
       'processes are activated first and the SME track processes second. A project then takes a mode (Full or SME), a '
       'track recommended by its complexity score, and a template from the catalog; the template brings the phases, '
       'and the gate and checklist library supplies the gates and checklists attached to each phase.')

# ---------------------------------------------------------------- 4 intro
Cursor(para('Requirements added in revision 1.1 are generalized')).body(
    f'Requirements added in revision 1.3 in Sections 4.25 to 4.32 restate the {SRC_DOC} source in platform vocabulary; '
    'duplicates in the source (for example the vertical approval workflow and audit trail stated twice) are merged, and '
    'Appendix E gives the mapping. Sections 4.33 to 4.35 come from the Dynamic Apps product direction.')

# ---------------------------------------------------------------- 4.13 template libraries (link to the catalog)
Cursor(last_req('FR-DA-TPL-')).req('FR-DA-TPL-05', 'The system shall manage project templates through the Project Template Catalog of Section 4.33; the rules of FR-DA-TPL-01 to 04 apply to it.')

# ---------------------------------------------------------------- 4.23 checklist library (link to phases)
Cursor(last_req('FR-DA-CHK-')).req('FR-DA-CHK-06', 'The system shall let a checklist template be attached to any phase of a project or of a project template, not only to a fixed stage, under the rules of Section 4.35.')

# ---------------------------------------------------------------- 4.25 – 4.35 new sections
c = Cursor(last_req('FR-DA-ATT-'))
c.h2('4.25 Vertical Framework & Governance')
c.body('A vertical is a first-class, governed configuration entity. Its content is data, so any Dynamic App can serve new sectors without code changes.')
c.req('FR-DA-VRT-01', 'The system shall support the definition of verticals, each with a unique identifier, a short prefix, a name, a description, its target segments, its value proposition, and its associated macro and E2E processes.')
c.req('FR-DA-VRT-02', 'The system shall support a taxonomy of verticals with parent-child and sibling relationships.')
c.req('FR-DA-VRT-03', 'The system shall let administrators and partners define new verticals without modifying the platform, and new verticals shall work alongside existing ones.')
c.req('FR-DA-VRT-04', 'The system shall manage each vertical through the lifecycle Draft, Review, Approved, Active, Deprecated and Retired, with an approval workflow (configurable approvers, escalation and notifications) for definition, activation, modification, deprecation and retirement.')
c.req('FR-DA-VRT-05', 'The system shall version-control vertical definitions under the Version Management service (Section 3.8), so that every change can be tracked, reviewed, approved and rolled back, including the rollback of an activation or configuration change to a previous version.')
c.req('FR-DA-VRT-06', 'The system shall let each tenant activate its own set of verticals without affecting other tenants.')
c.req('FR-DA-VRT-07', 'The system shall refuse to deactivate a vertical, a macro process or an E2E process while active projects depend on it, shall require approval for a deactivation, and shall preserve all data of a deactivated vertical.')
c.req('FR-DA-VRT-08', 'The system shall keep an immutable, searchable and exportable audit trail of every vertical action — definition, activation, modification, deactivation and retirement — retained per policy (Section 4.11).')
c.req('FR-DA-VRT-09', 'The system shall record a designated owner for every vertical and shall support change management for it: change request, impact analysis, approval and tracked implementation.')
c.req('FR-DA-VRT-10', 'The system shall capture and report governance metrics per vertical: adoption, compliance and performance.')

c.h2('4.26 Vertical Processes')
c.body('Selecting a vertical activates its own processes, built on the common process model of the application.')
c.req('FR-DA-VPR-01', 'The system shall activate the macro processes of a vertical when the vertical is activated, with a configurable range of three to five per vertical.')
c.req('FR-DA-VPR-02', 'The system shall describe every vertical macro process with an identifier, name, description, goals, input suppliers, inputs, tasks, outputs, output customers, related E2E processes, related modules and applicable compliance requirements.')
c.req('FR-DA-VPR-03', 'The system shall map each vertical macro process to the regulatory and industry standards that apply to it; the mapping shall be configurable and audited.')
c.req('FR-DA-VPR-04', 'The system shall let administrators and partners add vertical macro processes without modifying the platform, versioned and reversible like verticals (FR-DA-VRT-05).')
c.req('FR-DA-VPR-05', 'The system shall support tasks within each macro process (owner, deadline, dependencies, status) and steps within each task (owner, inputs, outputs, status), and shall enforce the dependencies defined between macro processes, tasks and steps.')
c.req('FR-DA-VPR-06', 'The system shall activate the E2E processes of a vertical when the vertical is activated, with a configurable range of two to four per vertical.')
c.req('FR-DA-VPR-07', 'The system shall enforce the chain relationships between E2E processes — sequential, branching, parallel, loop-back and terminal — and shall support, per E2E process, triggers (business event, time-based, manual) and terminal states (success, failure, cancellation, loop-back).')
c.req('FR-DA-VPR-08', 'The system shall support user-facing tasks in each E2E process, each linked to the macro processes, tasks and steps it relies on.')
c.req('FR-DA-VPR-09', 'The system shall capture metrics for each vertical macro and E2E process — cycle time, completion rate, quality and compliance — and produce status, compliance and performance reports from them (Section 4.8).')

c.h2('4.27 Vertical Data, Compliance & Integration')
c.body('Each vertical may extend the data model, carry its own compliance obligations and connect to sector systems, always without breaking the common core.')
c.req('FR-DA-VDT-01', 'The system shall let a vertical extend the common data model with its own objects, attributes, relationships, validation rules and lifecycle states, without altering or breaking the common entities (Section 6).')
c.req('FR-DA-VDT-02', 'The system shall exchange vertical data in industry-standard formats, at least JSON, XML, CSV and PDF, and, where the vertical needs it, engineering formats such as STEP, IGES and JT.')
c.req('FR-DA-VDT-03', 'The system shall apply per-vertical retention policies and support archiving and retrieval of vertical data, in line with the regulatory retention of the sector.')
c.req('FR-DA-VCP-01', 'The system shall support vertical-specific regulations and standards as configurable, audited and reportable compliance requirements, subject to FR-DA-CFG-09.')
c.req('FR-DA-VCP-02', 'The system shall monitor compliance per vertical, alert stakeholders of non-compliance through the Notification Center (Section 4.9), and produce compliance reports, audit reports and certification records.')
c.req('FR-DA-VCP-03', 'The system shall support internal and external compliance audits — planning, execution, findings and corrective actions — and vertical compliance training with content, delivery, tracking and certification.')
c.req('FR-DA-VIN-01', 'The system shall connect vertical-specific external systems through standard interfaces (REST, SOAP, GraphQL, file-based, message-based), under the integration rules of FR-DA-CFG-10 to 14.')
c.req('FR-DA-VIN-02', 'The system shall secure, monitor (performance, errors, data quality) and test every vertical integration, and shall handle integration errors by retry, fallback and notification.')

c.h2('4.28 Vertical Configuration')
c.body('Vertical parameters are configured, validated and versioned before activation.')
c.req('FR-DA-VCF-01', 'The system shall let an administrator configure, per vertical: macro and E2E process activation, checklist templates, gate criteria and data model extensions.')
c.req('FR-DA-VCF-02', 'The system shall provide a pre-built configuration template per vertical for rapid deployment.')
c.req('FR-DA-VCF-03', 'The system shall validate a vertical configuration for completeness, consistency and compliance before activation, and shall refuse an activation that fails validation, naming each failed rule.')
c.req('FR-DA-VCF-04', 'The system shall version every vertical configuration change and audit who changed what, when and why.')

c.h2('4.29 SME Mode & Tracks')
c.body('The SME mode is a cross-sector enabler: an SME in any vertical can run it alongside that vertical.')
c.req('FR-DA-SME-01', 'The system shall define an SME by configurable employee thresholds per region (default 1–250 in the EU, up to 500 under the US SBA definition) and shall segment SMEs into Micro (1–10), Small (10–50) and Medium (50–250).')
c.req('FR-DA-SME-02', 'The system shall let an Organization activate the SME mode together with any vertical, and each tenant shall activate its own tracks and configuration without affecting other tenants.')
c.req('FR-DA-SME-03', 'The system shall support two to four configurable SME tracks, each defining its number of macro processes, E2E processes, gates, checklist items per gate, and typical duration.')
c.req('FR-DA-SME-04', 'The system shall activate three to five SME macro processes and two to six SME E2E processes when a track is selected, with the same taxonomy, task, step, chain and metric rules as vertical processes (FR-DA-VPR-02, 05, 07, 08 and 09) plus track applicability and cost metrics.')
c.req('FR-DA-SME-05', 'The system shall let administrators define new SME tracks, macro processes and configurations without modifying the platform.')
c.req('FR-DA-SME-06', 'The system shall assign a project in SME mode to the track recommended by its complexity score (Section 4.30); a manual override shall require a written justification and an approval, and shall be audited and reportable.')
c.req('FR-DA-SME-07', 'The system shall capture and report, per track, its usage, effectiveness and outcomes.')
c.req('FR-DA-SME-08', 'The system shall govern the SME framework like verticals: a designated owner, an approval workflow for track definition, activation, modification, deprecation and retirement, change management, an immutable audit trail and adoption, compliance and performance metrics.')

c.h2('4.30 Complexity Scoring')
c.body('A complexity score gives every project the right amount of rigor, consistently and traceably.')
c.req('FR-DA-SCO-01', 'The system shall compute a complexity score for every project from weighted criteria and shall use it to recommend the mode and track.')
c.req('FR-DA-SCO-02', 'The system shall let an administrator configure the criteria — at least strategic impact, technical novelty, regulatory burden, investment size, cross-functional scope, market uncertainty and time-to-market pressure — and their weights, which shall sum to 100 %; a set of weights that does not sum to 100 % shall be refused.')
c.req('FR-DA-SCO-03', 'The system shall let each vertical add its own complexity drivers (for example regulatory burden, industry standards, sector-specific risks) with their weights, versioned, so that the score and the recommended track reflect the vertical of the project.')
c.req('FR-DA-SCO-04', 'The system shall keep an audit trail of every score — criteria, weights, values, result and track assignment — and shall report the distribution of scores, track assignments and outcomes.')

c.h2('4.31 SME Onboarding & Experience')
c.body('SMEs need to go live quickly with little PLM experience.')
c.req('FR-DA-ONB-01', 'The system shall run an onboarding plan for an SME within a configurable period (default 30 days): tenant provisioning (FR-DA-TEN-14), track configuration, data import, validation, user training and go-live.')
c.req('FR-DA-ONB-02', 'The system shall import data from spreadsheets, CSV files, legacy systems and cloud storage, preserving data integrity and relationships, and shall validate the imported data for completeness, consistency and accuracy before go-live, listing every rejected record with its reason.')
c.req('FR-DA-ONB-03', 'The system shall provide self-service training and guided onboarding: interactive tutorials, guided workflows, sample data and contextual help (Section 4.12).')
c.req('FR-DA-ONB-04', 'The system shall offer SME users simplified navigation, a mobile-responsive or progressive web app experience, and self-service support through the knowledge base, the AI Assistant (Section 4.10) and a community space.')
c.req('FR-DA-ONB-05', 'The system shall measure onboarding: time-to-value, data quality, user adoption and satisfaction.')

c.h2('4.32 Packaging & Pricing')
c.body('SME packs, vertical packs and their bundles extend the Solution Pack model of Section 4.3.')
c.req('FR-DA-PKG-01', 'The system shall let an administrator define three to five SME packs, each with configurable contents, target segment and price, and bundles of a vertical pack with an SME pack, each recorded as a Solution Pack variant so that entitlement stays enforced by FR-DA-CFG-06.')
c.req('FR-DA-PKG-02', 'The system shall enforce configurable pricing rules — minimum price per user per month, minimum user count per pack, volume discounts and bundle discounts — and shall show how each price was obtained.')
c.req('FR-DA-PKG-03', 'The system shall support upgrading and downgrading between packs and bundles with prorated billing and without loss of data.')
c.req('FR-DA-PKG-04', 'The system shall report revenue, discounts, adoption, upgrades and downgrades per pack and bundle, exportable to PDF, XML and CSV.')

c.h2('4.33 Project Template Catalog')
c.body('Every Dynamic App offers a catalog of project templates. A template is a starting point copied at creation time (FR-DA-TPL-04).')
c.req('FR-DA-PTC-01', 'The system shall keep a Project Template Catalog in which every template is classified by scope — Universal (common to all sectors) or one Vertical — and by mode — Full, or SME with its track.')
c.req('FR-DA-PTC-02', 'The system shall support full Create, Read, Update, Delete and Duplicate on project templates, versioned under Section 3.8; a template shall carry its default fields, its phases, the gates and checklists attached to each phase (Section 4.35), its OBS roles and its milestones.')
c.req('FR-DA-PTC-03', 'The system shall present the catalog as a browsable list with search and filters on scope, vertical, mode, track and status, a preview of each template\'s phases, gates and checklists, and its use count.')
c.req('FR-DA-PTC-04', 'The system shall manage each template through Draft, Published and Retired; only published templates shall be offered at project creation, and retiring a template shall not change any project created from it.')
c.req('FR-DA-PTC-05', 'The system shall provide universal templates for Full and SME mode on every installation, seed vertical templates when a vertical is activated, and let an authorized user save an existing project as a new template.')
c.req('FR-DA-PTC-06', 'The system shall restrict catalog changes to a dedicated permission, audit every change, and let platform templates be shared read-only with all Organizations while Organization templates stay private to their tenant.')

c.h2('4.34 Project Creation Modes')
c.body('A project can be created in three ways; all three end in the same, fully editable project.')
c.req('FR-DA-PCM-01', 'The system shall offer three creation modes on one entry point: From the catalog, Manual, and With AI.')
c.req('FR-DA-PCM-02', 'From the catalog: the system shall propose the templates that match the Organization\'s verticals and the project\'s mode and track, and copy the chosen template\'s fields, phases, gates, checklists and roles into the new project.')
c.req('FR-DA-PCM-03', 'Manual: the system shall let the user enter the project and choose its vertical (or none), mode and track, and build its phases by attaching gates and checklists from the library or creating new ones.')
c.req('FR-DA-PCM-04', 'With AI: the system shall draft the project — fields, complexity scores, recommended mode and track, closest template, phases, gates and checklists — from a short description, as an Assistive AI suggestion that the user accepts, modifies or rejects item by item before anything is saved (FR-DA-AI-07); the draft shall work with the built-in engine and use the live model when configured.')
c.req('FR-DA-PCM-05', 'The system shall compute the complexity score (Section 4.30) in every creation mode, apply the quota checks of NFR-DA-SEC-08, and record in the audit trail the creation mode, the template and version used, and the AI suggestions accepted.')

c.h2('4.35 Gate & Checklist Library')
c.body('Gates and checklists are reusable library entries, created once and attached to any phase of any project or template.')
c.req('FR-DA-GTE-01', 'The system shall keep a library of gate definitions with full Create, Read, Update, Delete and Duplicate, versioned: name, purpose, entry and exit criteria, approvers (roles or people), decision options Go, No-Go, Hold and Recycle, and applicability by vertical, mode and track.')
c.req('FR-DA-GTE-02', 'The system shall let an authorized user attach one or more gates and one or more checklist templates to any phase of a project or a project template, reorder them, and detach them while the phase has not started.')
c.req('FR-DA-GTE-03', 'The system shall configure the gates of a project from its vertical and track: the number of gates depends on the track and the criteria on the vertical, and a gate may be marked optional for a track.')
c.req('FR-DA-GTE-04', 'The system shall block the progression of a phase while a mandatory checklist item attached to its gate is incomplete; enforcement shall be configurable per gate and a waiver shall require justification and approval.')
c.req('FR-DA-GTE-05', 'The system shall capture every gate decision with its approvers, criteria results and comments, and keep an immutable audit trail of gate and checklist actions — creation, modification, attachment, completion, review, decision and waiver.')
c.req('FR-DA-GTE-06', 'Changing a gate or checklist in the library shall not alter the copies already attached to started phases; the user shall be offered to update not-yet-started phases to the new version.')

# ---------------------------------------------------------------- 5 NFR
c = Cursor(last_req('NFR-DA-PERF-'))
c.req('NFR-DA-PERF-06', 'Activating a vertical, with its processes and configuration, shall complete within 5 minutes (configurable target).')
c.req('NFR-DA-PERF-07', 'A bulk data import shall load 10,000 records within 30 minutes, and an SME shall be able to complete onboarding within 30 days (configurable targets).')
c.req('NFR-DA-PERF-08', 'A production deployment offering the Vertical and SME layers shall be sized for configurable targets, by default 1,000 API calls per second sustained and 10,000 concurrent users, with reports generated within 60 seconds.')
c = Cursor(last_req('NFR-DA-SEC-'))
c.req('NFR-DA-SEC-14', 'The system shall support standard federated authentication (SAML 2.0, OAuth 2.0, OpenID Connect) and multi-factor authentication.')
c.req('NFR-DA-SEC-15', 'Role-based access control shall support scopes by vertical and by SME track in addition to the tenancy scopes.')
c.req('NFR-DA-SEC-16', 'Data shall be encrypted at rest (AES-256 or equivalent) and in transit (TLS 1.2 or later), with configurable data residency regions and optional customer-managed keys (bring your own key).')
c = Cursor(last_req('NFR-DA-REL-'))
c.req('NFR-DA-REL-06', 'A production deployment offering the Vertical and SME layers shall support disaster recovery with an RTO under 4 hours and an RPO under 1 hour, automatic failover and automated backups, tightening NFR-DA-REL-05 for that deployment.')
c = Cursor(last_req('NFR-DA-SCALE-'))
c.req('NFR-DA-SCALE-04', 'The system shall scale to configurable limits, by default 1,000 tenants per deployment including 10,000 SME tenants in shared mode, 100 million records, 500 macro processes, 200 E2E processes and 100 checklist items per gate.')
c.req('NFR-DA-SCALE-05', 'Adding a vertical, an SME track, a template, a gate or a checklist shall require no downtime.')
c = Cursor(last_req('NFR-DA-UX-'))
c.req('NFR-DA-UX-09', 'SME users shall complete onboarding within 1 day and need less than 4 hours of training, helped by guided workflows (configurable targets).')
c.req('NFR-DA-UX-10', 'User satisfaction shall be measured, with a configurable target (default NPS of 30 or more).')
c = Cursor(last_req('NFR-DA-I18N-'))
c.req('NFR-DA-I18N-02', 'The system shall support configurable languages (default English, French, Arabic, Spanish, German), currencies (default USD, EUR, MAD, ZAR) and regional date, time and number formats.')
c = Cursor(last_req('NFR-DA-MAINT-'))
c.req('NFR-DA-MAINT-08', 'Verticals, SME tracks, complexity criteria, packs, project templates, gates and checklists shall be configuration data loaded without code changes, and the platform shall be modular with zero-downtime upgrades, monitoring, alerting and comprehensive logging.')
c = Cursor(last_req('NFR-DA-COMP-'))
c.req('NFR-DA-COMP-05', 'The system shall let verticals map to sector standards — for example IATF 16949 (automotive), AS9100 (aerospace), EU MDR and ISO 13485 (medical devices), FDA 21 CFR Part 11 (pharmaceutical), HACCP (food safety) — as scaffolds subject to FR-DA-CFG-09; certification (ISO/IEC 27001, SOC 2, GDPR) is an attribute of a deployment, not of the software.')
c.req('NFR-DA-COMP-06', 'Every requirement of a Dynamic App shall be traceable to its business requirement, user story, test case, release and, where applicable, customer commitment, in line with ISO/IEC/IEEE 29148; requirement changes shall be classified Minor, Moderate, Major or Breaking with the matching approval and regression scope.')

# ---------------------------------------------------------------- 6 data model
add_rows(d.tables[2], [
    ('Vertical', 'A sector entity: prefix, name, taxonomy parent, lifecycle state, owner, version; links to its macro and E2E processes, data extensions, compliance mappings and configuration.'),
    ('VerticalActivation', 'The activation of a vertical by an Organization, with its version, validation result and activation order.'),
    ('SmeTrack', 'An SME rigor level: processes, gates, checklist items per gate, typical duration, lifecycle state.'),
    ('ComplexityCriterion', 'A scoring criterion and its weight, universal or specific to one vertical, versioned.'),
    ('ComplexityScore', 'The scored criteria of a project, the result, the recommended and chosen track, and any override justification and approval.'),
    ('ProjectTemplate', 'A catalog entry: scope (universal or vertical), mode and track, status, version, fields, phases with their attached gates and checklists, roles and milestones.'),
    ('GateDefinition', 'A library gate: criteria, approvers, decision options, applicability, version.'),
    ('PhaseAttachment', 'The attachment of a gate or a checklist template, at a given version, to a phase of a project or a template.'),
    ('Pack', 'An SME pack, vertical pack or bundle: contents, target segment, pricing rules.'),
    ('OnboardingPlan', 'The onboarding of an SME: steps, imports, validation results, dates, metrics.'),
])

# ---------------------------------------------------------------- 7.1 / 7.2
Cursor(para('Revision 1.2 adds a tenancy screen')).body(
    'Revision 1.3 adds screens for verticals and their activation, SME tracks and complexity criteria, packs, the project '
    'template catalog, a project creation entry with three tabs (From the catalog, Manual, With AI), and the gate and '
    'checklist library with attachment to phases.')
c = Cursor(para('AI model: model and provider catalog'))
c.bullet('Verticals: CRUD, lifecycle transitions and approvals, versions and rollback, activation with validation, deactivation with dependency check.')
c.bullet('SME and scoring: tracks CRUD, complexity criteria and weights, score computation, track override with approval.')
c.bullet('Project templates: catalog list with filters, CRUD, duplicate, publish and retire, version history, save a project as a template.')
c.bullet('Project creation: create from a template, manually, or from an AI draft (draft, then accept with the retained items).')
c.bullet('Gates and checklists: gate library CRUD and versions; attach, reorder and detach gates and checklists on a phase; decisions and waivers.')
c.bullet('Packs and onboarding: pack and bundle CRUD with pricing rules, upgrade and downgrade; onboarding plan, import and validation.')

# ---------------------------------------------------------------- Appendix A rows
add_rows(d.tables[3], [
    ('Verticals and SME layers (Sections 4.25 – 4.32)', 'Verticals as governed configuration entities; SME mode with tracks; weighted complexity scoring; onboarding; packs and bundles.',
     'New in revision 1.3. Target. CortexPLM covers part of it: an Organization carries a sector with seeded templates and checklists, and seven fixed criteria recommend a Full, Light or Fast track, with written justification for another choice. Configurable weights, vertical lifecycle and activation, SME tracks, onboarding and packs are not implemented.'),
    ('Project Template Catalog and creation modes (Sections 4.33 – 4.34)', 'Catalog classified universal or per vertical, Full or SME; CRUD and versions; creation from the catalog, manually or with AI.',
     'New in revision 1.3. Partly implemented in CortexPLM: project templates with CRUD and versions, creation from a template or manually, and AI suggestions on the project. Scope and mode classification, publication states and a full AI-drafted project are not implemented.'),
    ('Gate & Checklist Library (Section 4.35, FR-DA-CHK-06)', 'Gates as library entries with CRUD, attachable with checklists to any phase.',
     'New in revision 1.3. CortexPLM has the checklist template library per gate and track (FR-DA-CHK-01 – 05); its gates are fixed per track in code, so gate CRUD and attachment to any phase are a target.'),
])

# ---------------------------------------------------------------- Appendix D (change log)
closing = para('Product-specific material of this CortexPLM round')
c = Cursor(closing)
c.h1('Appendix D — Revision 1.3 Change Log')
c.body('Revision 1.3 is additive, like 1.1 and 1.2: every earlier requirement keeps its ID and wording, and new requirements take the next free number in their section or a new family.')
tbl = copy.deepcopy(d.tables[5]._tbl)
c.el.addnext(tbl)
D = docx.table.Table(tbl, closing._parent)
for tr in D.rows[3:]:
    tbl.remove(tr._tr)
CHANGES = [
    ('Cover, 1.1, 1.5, 1.6', 'Version 1.3', 'Version raised to 1.3; purpose and overview describe the revision; the Verticals and SME source added to the references.'),
    ('1.4 Definitions', '11 terms added', 'Vertical, Vertical Instance, SME, Mode (Full / SME), SME Track, Complexity Score, Project Template Catalog, Creation Mode, Phase, Gate Definition, Pack / Bundle.'),
    ('2.3 Product Functions', '1 function added', 'Verticals, SME mode, complexity scoring, template catalog, creation modes, gates and checklists on any phase.'),
    ('3.14 (new)', 'Architecture', 'Five requirement layers; verticals and tracks as configuration data; ordered, additive activation.'),
    ('4.13 Template Libraries', 'FR-DA-TPL-05', 'Project templates are managed through the catalog of Section 4.33.'),
    ('4.23 Stage Checklist Library', 'FR-DA-CHK-06', 'Checklist templates attachable to any phase of a project or template.'),
    ('4.25 Vertical Framework & Governance', 'FR-DA-VRT-01 – 10 (new)', 'Definition, taxonomy, extensibility, lifecycle and approval, versioning and rollback, tenant isolation, guarded deactivation, audit, ownership and change management, metrics.'),
    ('4.26 Vertical Processes', 'FR-DA-VPR-01 – 09 (new)', 'Macro processes (3–5) and E2E processes (2–4) per vertical; taxonomy, compliance mapping, tasks and steps, chains, triggers, terminal states, metrics and reports.'),
    ('4.27 Vertical Data, Compliance & Integration', 'FR-DA-VDT-01 – 03, VCP-01 – 03, VIN-01 – 02 (new)', 'Data model extension, exchange formats, retention and archiving; compliance requirements, monitoring, audits and training; connectors, security, monitoring and error handling.'),
    ('4.28 Vertical Configuration', 'FR-DA-VCF-01 – 04 (new)', 'Configurable parameters, pre-built templates, validation before activation, versioning and audit.'),
    ('4.29 SME Mode & Tracks', 'FR-DA-SME-01 – 08 (new)', 'SME definition and segments, cross-sector activation, 2–4 tracks, SME processes, extensibility, assignment and override, metrics, governance.'),
    ('4.30 Complexity Scoring', 'FR-DA-SCO-01 – 04 (new)', 'Weighted configurable criteria summing to 100 %, vertical drivers, audit and reporting.'),
    ('4.31 SME Onboarding & Experience', 'FR-DA-ONB-01 – 05 (new)', '30-day onboarding plan, import and validation, guided training, simplified mobile experience and self-service support, metrics.'),
    ('4.32 Packaging & Pricing', 'FR-DA-PKG-01 – 04 (new)', 'SME packs and vertical bundles as Solution Pack variants, pricing rules, upgrade and downgrade, reports.'),
    ('4.33 Project Template Catalog', 'FR-DA-PTC-01 – 06 (new)', 'Universal or vertical, Full or SME templates; CRUD, duplicate and versions; catalog browsing; Draft, Published, Retired; seeding and save-as-template; permissions.'),
    ('4.34 Project Creation Modes', 'FR-DA-PCM-01 – 05 (new)', 'From the catalog, Manual, With AI (reviewed item by item); scoring, quotas and audit in every mode.'),
    ('4.35 Gate & Checklist Library', 'FR-DA-GTE-01 – 06 (new)', 'Gate definitions with CRUD and versions; attachment of gates and checklists to any phase; vertical- and track-aware gates; enforcement and waivers; decisions and audit; library changes never alter started phases.'),
    ('5.1, 5.2, 5.3, 5.4', 'NFR-DA-PERF-06 – 08, SEC-14 – 16, REL-06, SCALE-04 – 05', 'Activation, import and production sizing targets; federated authentication and MFA, vertical and track scopes, encryption, residency and BYOK; disaster recovery; scale limits and zero-downtime additions.'),
    ('5.5, 5.6, 5.8, 5.10', 'NFR-DA-UX-09 – 10, I18N-02, MAINT-08, COMP-05 – 06', 'SME onboarding and training targets, satisfaction; languages, currencies and formats; configuration-driven layers; sector standards scaffolds; requirement traceability and change classes.'),
    ('6 Data Model', '10 entities', 'Vertical, VerticalActivation, SmeTrack, ComplexityCriterion, ComplexityScore, ProjectTemplate, GateDefinition, PhaseAttachment, Pack, OnboardingPlan.'),
    ('7.1, 7.2 Interfaces', 'Clarified', 'New screens and endpoint families for verticals, SME and scoring, templates, creation modes, gates and checklists, packs and onboarding.'),
    ('Appendix A', '3 rows', 'Conformance of the 1.3 additions in CortexPLM.'),
    ('Appendix E (new)', 'Traceability', 'Mapping of every source requirement family to the requirements of this standard.'),
]
for r, cells in zip(D.rows[1:3], CHANGES[:2]):
    for cell, text in zip(r.cells, cells):
        set_runs(cell.paragraphs[0], [text])
add_rows(D, CHANGES[2:])
c.el = tbl

# ---------------------------------------------------------------- Appendix E (traceability)
c.h1('Appendix E — Traceability to the Verticals and SME Requirements')
c.body(f'Each requirement family of the {SRC_DOC} source is covered as follows. The 29 vertical instances of the source '
       '(REQ-VERT-{SECTOR}-…: Automotive, Aerospace & Defense, Industrial Machinery, Healthcare & Life Sciences, Electronics '
       '& High-Tech, AEC & Construction, Food & Beverage, Social & Solidarity Economy, Pharmaceutical & Process, Retail, '
       'Footwear & Apparel, Consumer Packaged Goods, Energy & Utilities, Telecommunications, Process/Petrochemical, '
       'Shipbuilding, Consumer Products Extended, Process Industries, Infrastructure, Fabrication & Assembly, '
       'Process/Packaged Goods, Semiconductor & Electronics, Retail, Distribution, Logistics, Pharma, Manufacturing '
       '(Generic), Private Education, Public Education, Healthcare Providers) are content delivered as Vertical Instances '
       'under Sections 4.25 to 4.28; they stay in the vertical packs, not in this standard.')
tbl = copy.deepcopy(d.tables[5]._tbl)
c.el.addnext(tbl)
E = docx.table.Table(tbl, closing._parent)
for tr in E.rows[3:]:
    tbl.remove(tr._tr)
TRACE = [
    ('Source family', 'Requirements in this standard', 'Note'),
    ('REQ-VERT-FW-001 – 010', 'FR-DA-VRT-01 – 08', 'FW-005 and FW-008 merged into VRT-04 and VRT-05.'),
    ('REQ-VERT-GOV-001 – 005', 'FR-DA-VRT-04, 08, 09, 10', 'GOV-002 and GOV-004 duplicate FW-005 and FW-010.'),
    ('REQ-VERT-MP-001 – 010', 'FR-DA-VPR-01 – 05, 09', 'Tasks, steps and dependencies merged into VPR-05.'),
    ('REQ-VERT-E2E-001 – 007', 'FR-DA-VPR-06 – 09', 'Triggers and terminal states merged into VPR-07.'),
    ('REQ-VERT-DATA-001 – 005', 'FR-DA-VDT-01 – 03', 'Retention and archiving merged into VDT-03.'),
    ('REQ-VERT-COMP-001 – 005', 'FR-DA-VCP-01 – 03, NFR-DA-COMP-05', 'Kept subject to FR-DA-CFG-09.'),
    ('REQ-VERT-INT-001 – 005', 'FR-DA-VIN-01 – 02', 'Builds on FR-DA-CFG-10 – 14.'),
    ('REQ-VERT-CONF-001 – 005', 'FR-DA-VCF-01 – 04', 'Audit merged into VCF-04.'),
    ('REQ-SME-FW-001 – 005', 'FR-DA-SME-01, 02, 05', ''),
    ('REQ-SME-MP-001 – 005, REQ-SME-E2E-001 – 005', 'FR-DA-SME-04', 'Reuses the vertical process rules.'),
    ('REQ-SME-TRACK-001 – 005', 'FR-DA-SME-03, 06, 07, 08', ''),
    ('REQ-SME-SCORE-001 – 005', 'FR-DA-SCO-01, 02, 04', ''),
    ('REQ-SME-ONB-001 – 005', 'FR-DA-ONB-01 – 03, 05', ''),
    ('REQ-SME-PRICE-001 – 005', 'FR-DA-PKG-01 – 04', 'Packs are Solution Pack variants.'),
    ('REQ-SME-UX-001 – 005', 'FR-DA-ONB-03, 04, NFR-DA-UX-02, 03', 'WCAG 2.1 AA and mobile use already required in Section 5.5.'),
    ('REQ-SME-GOV-001 – 005', 'FR-DA-SME-08', ''),
    ('REQ-VS-ACT-001 – 003', 'FR-DA-SME-02, FR-DA-VRT-07, 08, Section 3.14', 'Vertical processes first, SME processes second.'),
    ('REQ-VS-SCORE-001 – 003', 'FR-DA-SCO-03', ''),
    ('REQ-VS-CHK-001 – 003', 'FR-DA-CHK-01 – 06, FR-DA-GTE-04, 05', 'Checklists right-sized per vertical and track.'),
    ('REQ-VS-GATE-001 – 003', 'FR-DA-GTE-01, 03, 05', ''),
    ('REQ-VS-PKG-001 – 003', 'FR-DA-PKG-01 – 04', ''),
    ('REQ-NFR-PERF, SCALE', 'NFR-DA-PERF-06 – 08, NFR-DA-SCALE-04 – 05', 'Production targets; existing reference targets unchanged.'),
    ('REQ-NFR-SEC, REL', 'NFR-DA-SEC-14 – 16, NFR-DA-REL-06', 'Audit and tenant isolation already covered (Section 4.11, NFR-DA-SEC-11).'),
    ('REQ-NFR-UX, LOC', 'NFR-DA-UX-09 – 10, NFR-DA-I18N-02', 'RTL already covered (NFR-DA-I18N-01).'),
    ('REQ-NFR-COMP, MNT; Part 7 governance', 'NFR-DA-COMP-05 – 06, NFR-DA-MAINT-08', ''),
]
for r, cells in zip(E.rows[0:3], TRACE[:3]):
    for cell, text in zip(r.cells, cells):
        set_runs(cell.paragraphs[0], [text])
add_rows(E, TRACE[3:])
c.el = tbl
c.body('Product-specific material — the content of each vertical instance, the phase-gate vocabulary of each application and its demonstration data — stays in the documentation of that application.')

# ---------------------------------------------------------------- manual TOC entries
Cursor(para('3.13 Platform Operations Architecture', 'Normal')).add(T_TOC2, ['3.14 Vertical & SME Layer Architecture', '0'])
c = Cursor(T_TOC2)
for t in ('4.25 Vertical Framework & Governance', '4.26 Vertical Processes', '4.27 Vertical Data, Compliance & Integration',
          '4.28 Vertical Configuration', '4.29 SME Mode & Tracks', '4.30 Complexity Scoring', '4.31 SME Onboarding & Experience',
          '4.32 Packaging & Pricing', '4.33 Project Template Catalog', '4.34 Project Creation Modes', '4.35 Gate & Checklist Library'):
    c.add(T_TOC2, [t, '0'])
c = Cursor(T_TOC1)
c.add(T_TOC1, ['Appendix D — Revision 1.3 Change Log', '0'])
c.add(T_TOC1, ['Appendix E — Traceability to the Verticals and SME Requirements', '0'])

d.save(OUT)
print('saved', OUT)
