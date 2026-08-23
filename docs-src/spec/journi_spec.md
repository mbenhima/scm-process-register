**journi**

*the human side of change, mapped as a journey*

**Human Change Management Application**

Functional & Module Specification

Prepared for POWERACT Consulting

Chief Innovation Officer --- Mounire

August 2026

**Table of Contents**

**1. Executive Summary**

journi is a dedicated human change management application designed to
sit alongside --- but operate independently of --- an organization\'s
project delivery tools. Where a PMO tool tracks tasks and dates, journi
tracks people: their awareness, desire, knowledge, ability and
reinforcement (ADKAR), their emotional transition through the change
(Bridges, Kübler-Ross), and the organizational conditions around them
(Kotter\'s coalition and communication practices, Lewin\'s
Unfreeze-Change-Refreeze macro-state).

Rather than forcing a single methodology, journi treats established
change frameworks as diagnostic lenses layered onto one shared data
model. Individual and cohort readiness is tracked through ADKAR;
emotional trajectory through Bridges and Kübler-Ross; organizational
sponsorship and communication through Kotter; and the overall project
state through Lewin. This gives change practitioners the flexibility to
work in the language they already know, while giving executives one
consistent readiness signal across every initiative in the portfolio.

This document describes the platform architecture (organizational
hierarchy, project linkage model, access control and localization), the
eighteen functional modules that make up the application --- including a
governed AI Use Case Library restricted to Assistive and Augmented AI, a
runtime-configurable Permission Matrix and justification-governance
layer (Section 3.4--3.5), a Work Breakdown Structure & Gantt module
that gives Project Management, Change Management and the framework
milestones a single baseline-vs-actual timeline together with type-specific
Phase Templates and Phase Gate / Joint Decision Records (Module 18), and a
Macro Process, SIPOC, RACSI & End-to-End Process Registry (Module 19)
that makes the process backbone underneath every other module browsable
and, for its RACSI grid, runtime-editable --- and a seed dataset of
fourteen illustrative cases spanning three sectors --- Manufacturing,
Logistics & Transportation, and Health --- and eight transformation
types --- ERP Implementation, Business Process Reengineering, Business
Process Automation, Integrated Management System (QMS), Cultural /
Values Transformation, Operating Model Redesign, Compliance-Driven
Change, and Training & Skills Development --- each mapped to its own
End-to-End Process lifecycle and Phase Template (Section 4, Module 19).

**2. Application Architecture**

**2.1 Organizational Hierarchy**

journi organizes all data under a three-level hierarchy:

-   Group (optional) --- a holding company or multi-entity corporate
    group. A Group can contain several Organizations and provides a
    cross-organization portfolio view. Not every deployment needs a
    Group; a single company can operate directly at Organization level.

-   Organization --- a company or an autonomous business unit. This is
    the primary tenant boundary for RBAC and reporting. An Organization
    can exist standalone (no Group above it) or nested under a Group.

-   Projects --- the working level, where journi distinguishes two
    project types described in section 2.2.

journi is multi-tenant by construction: many independent Organizations,
optionally grouped into holding structures, run on one installation
with hard data-isolation boundaries between them. A role scoped to one
Organization can never read or write another Organization\'s data ---
including a sibling Organization in the same Group --- unless that
role\'s own scope is explicitly Group-level or platform-level. AI Use
Case activation (Module 17), language configuration (Section 3.1.1),
and every roll-up view (Module 15) all respect this same boundary.

**2.2 Main Projects vs. Change Management Projects**

**Main Project:** The underlying business initiative --- e.g. an ERP
Implementation, a Process Automation program, a QMS Implementation, a
restructuring, or an M&A integration. It carries scope, budget, timeline
and a delivery sponsor, but no people-readiness data of its own.

**Change Management Project:** The people-side initiative that manages
adoption of a change. It carries ADKAR, sentiment, communications,
training, resistance and sustainment data --- everything described in
Modules 4 through 16.

The relationship between the two is deliberately flexible:

-   A Change Management Project may be linked to one or more Main
    Projects simultaneously. Each link is independent --- the CM
    Project inherits organization, stakeholder base, and milestone
    dates from its linked Main Project(s) by default, with the ability
    to override any inherited field where the people-track timeline
    diverges from the delivery timeline. Multi-linking covers the
    common case of a single Change Management effort carrying the
    human side of several concurrent delivery projects touching the
    same population (e.g. an ERP rollout and a parallel automation
    initiative on the same plant floor).

-   A Change Management Project may also be created fully standalone,
    with no Main Project link at all --- appropriate for pure
    culture-change, leadership-transition, or restructuring initiatives
    that have no single underlying system or delivery project behind
    them.

-   One Main Project can have several linked Change Management Projects,
    which supports phased or multi-site rollouts run as separate
    regional or functional CM tracks (e.g. a single ERP Main Project
    with one linked CM project per plant or hub).

**2.3 Summary Diagram (descriptive)**

Group (optional) → Organization → Projects, where Projects split into
Main Projects and Change Management Projects, and every Change
Management Project carries an optional set of foreign-key links to
zero, one, or more Main Projects. All portfolio, risk and readiness
roll-ups in Modules 15--16 respect this same hierarchy, so a Group
Admin sees every Organization beneath them, an Organization Admin sees
every Project beneath their Organization, and a Change Manager sees
only the Project(s) explicitly assigned to them.

**2.4 Data Persistence & Availability**

This specification is intentionally independent of any particular
persistence implementation, but any production deployment of journi ---
regardless of which backend technology realizes it --- is expected to
satisfy the following data-availability requirements:

-   Server-side persistence: all Group, Organization, Project, user and
    Change Management data must be durably stored server-side, not
    solely in client-side/browser storage, so it survives across
    devices, browsers and sessions for the same authenticated user

-   Multi-device / multi-session access: a user\'s data and permissions
    must be consistently available regardless of which device or
    browser they sign in from

-   Backup & retention: regular backups with a defined retention
    policy, consistent with the organization\'s compliance policy
    referenced in Section 3.3

-   Availability target: a documented uptime target for production
    deployments (e.g. 99.9%), with planned-maintenance windows
    communicated to Organization Admins in advance

-   Data export & portability: an Organization Admin or Super Admin
    must be able to export an Organization\'s data, or request its
    deletion, on demand --- supporting data-portability and
    right-to-erasure obligations

-   Environment separation: distinct development, staging and
    production environments, with environment-specific configuration
    (connection strings, credentials, API keys) kept isolated from
    source code

The current reference build described throughout the rest of this
document satisfies every functional requirement above --- hierarchy,
RBAC, the eighteen modules, AI governance, localization --- against a
client-side-only data layer (browser localStorage), with no backend
server. That implementation choice is documented in the companion
Setup & Administration Guide, and does not yet satisfy the
server-side persistence requirements in this section; it is a reference
implementation of journi\'s functional behavior, not yet a
production-ready deployment against the requirements above.

**3. Multilingual Access & Administration**

**3.1 Localization**

journi is built Arabic-, French- and English-first rather than
translated as an afterthought, reflecting deployment across Moroccan and
francophone-African enterprise contexts alongside international teams.

-   Per-user language preference, switchable at any time without losing
    session state

-   Full right-to-left (RTL) layout support for Arabic --- navigation,
    tables, charts and journey maps mirror correctly, not just text
    direction

-   All seeded frameworks (ADKAR, Kotter, Bridges, Kübler-Ross labels,
    survey libraries) are pre-translated and maintained in all three
    languages

-   Multilingual survey and pulse distribution: each respondent answers
    in their preferred language while results are normalized centrally
    for aggregate reporting

-   Graceful fallback to the organization\'s default language when a
    specific translation is missing, with a translation-gap report for
    admins

-   Locale-aware date, number and currency formatting per organization

**3.1.1 Language Precedence (Tenant Default vs. Personal Override)**

Every Organization carries its own configured Default Language, set on
Module 1 by a Super Admin, Group Admin or Organization Admin. A user\'s
effective display language is resolved, on every sign-in and on every
switch of the scoped Organization, in a fixed order: (1) the signed-in
user\'s own explicit language preference, if one is set; (2) failing
that, the newly-scoped Organization\'s configured Default Language;
(3) failing that, English as the platform fallback. A manual,
in-session language switch remains available at any time and applies
immediately, but it is a session-local override only --- it does not
overwrite the user\'s stored preference or the Organization\'s
configured default, and is re-resolved from the precedence order above
on the next sign-in or Organization switch. This prevents a one-off
personal language choice in one tenant from silently leaking into a
different Organization or a different user\'s session.

**3.2 Roles & Access Scope (RBAC)**

journi applies role-based access control scoped to the Group /
Organization / Project hierarchy defined in Section 2. The same role
name can therefore carry different visibility depending on the scope it
is assigned to --- a Change Manager assigned to one Project sees only
that Project\'s data, never the whole portfolio.

  --------------------------------------------------------------------------
  **Role**           **Typical       **Typical Permissions**
                     Scope**         
  ------------------ --------------- ---------------------------------------
  Super Admin        Platform-wide   Create/manage Groups & Organizations,
                                     global security policy, framework
                                     library, manage the global AI Use Case
                                     catalog

  Group Admin        Group           Manage Organizations & Admins within
                                     the group, cross-organization
                                     reporting, activate/deactivate AI use
                                     cases at Group default level

  Organization Admin Organization    Create user accounts, assign roles,
                                     manage Projects, approve
                                     self-registrations, activate/deactivate
                                     AI use cases for the Organization

  Project Sponsor    Project         View dashboards, approve plans, sign
                                     off milestones --- read-focused,
                                     minimal data entry

  Change Manager /   Project         Full read/write on assigned project(s):
  Lead                               ADKAR, communications, resistance,
                                     training, sustainment; may request
                                     project-level AI use case activation if
                                     permitted by the Organization Admin

  People Manager /   Team subset     View direct reports\' ADKAR heatmap,
  Coach                              log coaching notes, restricted to own
                                     reporting line

  Practitioner /     Project (module Data-entry rights on specific modules,
  Contributor        scope)          e.g. trainer, communications specialist

  Employee / End     Self, Project   Complete surveys/pulses, view personal
  User                               journey map, submit feedback or flag
                                     resistance

  Executive Viewer   Group /         Read-only aggregated dashboards; no
                     Organization    individual-level drill-down
  --------------------------------------------------------------------------

**3.2.1 Full CRUD, Scoped by Role**

Every record type in journi --- Groups, Organizations, Main Projects,
Change Management Projects, Users, and every sub-record within a Change
Management Project (stakeholder groups, risks, communications, training
curricula, resistance-log entries, journey-map events, coaching notes,
sponsor actions, sustainment checkpoints, WBS/Gantt tasks, and more) ---
supports full Create, Read, Update and Delete, gated by the same role ×
scope model above by default. Section 3.4 describes the Permission
Matrix, a Super-Admin-editable override of that default mapping, applied
platform-wide. Roles with read/write access (Super Admin, Group Admin,
Organization Admin, Change Manager, Practitioner, People Manager) can
create, edit and delete within their scope; read-focused roles (Project
Sponsor, Executive Viewer) never see a mutation control, rendered or
enabled, outside their scope; Employees may additionally submit --- but
not manage or delete --- resistance-log entries about their own
experience. Deleting a Group, Organization, Main Project or Change
Management Project cascades correctly: deleting an Organization removes
its Main Projects, Change Management Projects, any AI activation/override
state, and any user account scoped directly inside it; deleting a Main
Project un-links, rather than deletes, any Change Management Project(s)
that referenced it, since that link is optional and now many-to-many by
design (Section 2.2).

**3.3 Account Creation & Security Best Practices**

-   Two account-creation paths: (a) Admin-provisioned --- an
    Organization or Group Admin creates a username and temporary
    password, assigns role and scope, and the system forces a password
    reset on first login; (b) Self-service sign-up --- employees
    register with a corporate, domain-verified email address and land in
    a pending \"Employee\" role scoped to the project(s) matching their
    organization/department, activated only after Admin approval

-   Enforced password policy (minimum length, complexity, optional
    rotation) and account lock-out after repeated failed attempts

-   Optional multi-factor authentication (MFA) and enterprise SSO (SAML
    / OIDC) for larger deployments

-   Principle of least privilege: permissions are the product of role ×
    scope (Group / Organization / Project), never a single global role

-   Full audit trail of logins, role changes, and data exports, retained
    per the organization\'s compliance policy

-   Data-visibility rules by default: People Managers see only their
    reporting line; Change Managers see only their assigned project(s);
    individual ADKAR scores and sentiment are restricted to Change
    Managers and direct Managers, while Sponsors and Executives see
    aggregated, de-identified views only

**3.4 Permission Matrix (Runtime-Configurable RBAC Override)**

The role × scope model in Section 3.2 ships as sensible defaults, not a
hardcoded ceiling. Module 2\'s Permission Matrix tab exposes five
platform capabilities --- Manage Hierarchy, Manage Users, Edit CM
Project Data, Activate AI Use Cases (Org), and Override AI Use Cases
(Project) --- as a grid against all nine roles, editable in place by a
Super Admin. Every other check throughout the application (page access,
write buttons, delete controls) reads from this same matrix at runtime,
so a deployment can, for example, grant a Practitioner hierarchy-editing
rights or restrict a People Manager\'s write access without a code
change. Changes take effect immediately, platform-wide, for every
Organization; the matrix seeds from the seven roles\' documented default
permissions on first load so behavior is unchanged until a Super Admin
deliberately edits it.

**3.5 Justification Governance**

Every score or state change to a Change Management Project --- an ADKAR
block, the Lewin macro-state, a Bridges/Kübler-Ross position, sponsor
visibility, manager readiness, training certification, resistance
status, or a risk status --- follows the same stage-then-justify
pattern: the practitioner stages the new value, writes a justification
note describing the evidence behind the move, then saves, at which point
the new value and its justification are appended together, in the same
atomic update, to that project\'s Change Log audit trail (visible on
Module 4). A platform-wide \"Require Justification\" toggle, set on
Module 2\'s Governance Settings tab (editable by Super Admin, Group
Admin or Organization Admin, or any role the Permission Matrix grants
Manage Hierarchy) and mandatory by default, determines whether the
justification note is a hard requirement before the Save control
enables, or merely offered and recorded when given. Justification text
is expected to cite evidence already observed --- a conversation held, a
floor visit made, a session completed --- never a plan for future
evidence; journi does not enforce this discipline programmatically, by
design --- it is a record of practitioner judgment, and the tool\'s role
is to make that judgment easy to capture and impossible to lose, not to
police its content.

**4. Core Modules**

*Eighteen modules in total: three foundation/platform modules covering
hierarchy, access and localization (detailed in Sections 2--3 above),
thirteen change-management core modules, one AI Use Case Library &
Governance module, one cross-cutting Work Breakdown Structure & Gantt
module (Module 18), and one Macro Process, SIPOC, RACSI & End-to-End
Process Registry module (Module 19). Each core module lists its purpose,
key features, the change management framework(s) it operationalizes, and
its primary users.*

**Module 1 --- Organization, Group & Project Hierarchy**

This module is the structural backbone of journi. It mirrors how real
enterprises are organized so that readiness data, risks and reporting
roll up cleanly from a single employee to an entire corporate group. The
hierarchy has three levels --- Group (optional), Organization, and
Projects --- and within Projects, journi distinguishes between the
underlying business initiative (a Main Project, e.g. an ERP
implementation) and the people-side initiative that manages its adoption
(a Change Management Project).

-   Group level is optional: a standalone company can operate directly
    at Organization level with no Group above it

-   Organization profile captures sector, size, site locations,
    languages spoken, an importable org chart used later for
    stakeholder mapping, and a configured Default Language governing
    the precedence rule in Section 3.1.1

-   Main Project registry: project type --- one of eight transformation
    types (ERP Implementation, Business Process Reengineering, Business
    Process Automation, Integrated Management System/QMS, Cultural /
    Values Transformation, Operating Model Redesign, Compliance-Driven
    Change, Training & Skills Development), plus Restructuring and M&A
    --- scope, budget band, timeline, delivery vendor, executive
    sponsor. Each of the eight transformation types carries a Default
    End-to-End Process and a matching Phase Template, browsable in
    Module 19 and selectable from Module 18

-   Change Management Project registry: every CM project can link to
    exactly one Main Project, or be created as a fully independent,
    freestanding OCM initiative (e.g. a culture change or restructuring
    program with no single underlying system project)

-   One Main Project can have one or several linked Change Management
    Projects --- useful for phased or multi-site rollouts run as
    separate regional CM tracks

-   Linked CM projects inherit organization data, stakeholder base, and
    milestone dates from the Main Project by default, with field-level
    override where the people-track timeline diverges

-   Full Create/Read/Update/Delete on every record in this module ---
    Groups, Organizations, Main Projects and Change Management Projects
    --- gated by role per Section 3.2.1, with cascading delete of
    dependent records

-   Portfolio roll-up views at Group, Organization, and cross-project
    level, plus project cloning/templating to accelerate set-up of
    similar initiatives

**Primary Users:** Super Admin, Group Admin, Organization Admin, PMO

**Module 2 --- Identity, Access & RBAC**

Access is controlled through role-based access control (RBAC) scoped to
the Group / Organization / Project hierarchy, so that a single role name
(e.g. \"Change Manager\") carries different visibility depending on
which project it is assigned to. Two account-creation paths coexist by
design: administrator-provisioned accounts for controlled onboarding,
and self-service sign-up for employees who need lightweight access to
complete surveys or view their own journey.

The module is organized into four tabs: **Users** (the account list and
create/edit/delete controls described above), **Permission Matrix** (the
runtime-configurable role × capability grid described in Section 3.4),
**Governance Settings** (the platform-wide \"Require Justification\"
toggle described in Section 3.5), and **License & Plan** (the platform
license record described below). See Section 3.2 for the full role
table and Section 3.3 for account-creation and security practices.

**Key Features**

-   User list with role, scope, and language, plus create/edit/delete
    controls gated by the Permission Matrix\'s Manage Users capability

-   Permission Matrix tab: a nine-role × five-capability grid, editable
    in place by a Super Admin, that overrides the platform\'s default
    role × scope behavior without a code change

-   Governance Settings tab: the platform-wide justification-requirement
    toggle (mandatory by default) that every score/state-change save
    flow across Modules 4, 6, 7, 8, 10, 11, 12 and 14 reads from

-   License & Plan tab: a lightweight, client-side platform-license
    record --- SaaS mode by default, or OnPrem mode once a Super Admin
    uploads a signed \`.lic\` file (a JSON document carrying version,
    companyId, companyName, hardwareId, expiryDate, maxUsers, plan,
    features and issueDate). Shows current plan, seat usage against the
    license\'s max-user ceiling, expiry countdown, and active feature
    flags. This is a proportionate, browser-local reflection of the
    licensing model described in the platform\'s D30 Licensing
    Implementation Schema, not the full multi-platform Ed25519/Firebase
    licensing SDK that schema specifies for a server-backed deployment

**Primary Users:** Super Admin, Group/Organization Admin, all downstream
roles

**Module 4 --- Initiative & Portfolio Registry**

The system of record for every change initiative in the organization.
Each Change Management Project is registered with its scope, sponsor,
business case, target population and a macro-level Lewin state (Unfreeze
/ Change / Refreeze), giving leadership a single portfolio view of
everything currently in motion.

**Key Features**

-   Structured intake form capturing business driver, scope, target
    population, budget, and success criteria

-   Automatic Lewin-phase tag (Unfreeze / Change / Refreeze) at the
    initiative level, updated as the project progresses

-   Portfolio dashboard across all active, planned and closed
    initiatives at Organization and Group level

-   Change-type classification (technology, process, structural,
    cultural) driving which templates and survey libraries are
    pre-loaded

-   Milestone and phase-gate tracking synchronized with any linked Main
    Project(s), where one or more exist

-   Change Log: a running audit trail of every justified score/state
    change recorded anywhere in the project (Section 3.5), showing old
    value, new value, module, date and justification for each entry

**Frameworks Integrated:** Lewin (Unfreeze--Change--Refreeze) as the
organizing macro-state; Prosci 3-Phase Process (Prepare, Manage,
Reinforce) as the default project lifecycle

**Primary Users:** PMO, Change Manager, Sponsor

**Module 5 --- Stakeholder & Impact Mapping**

Identifies who is affected by a change, how heavily, and in what
dimension --- process, tools, role, reporting line, or professional
identity. Impact scores determine which individuals or groups receive
deep ADKAR tracking versus lighter-touch communication only, keeping the
effort proportional to the risk.

**Key Features**

-   Import org charts and team rosters from Module 1 or via CSV/HRIS
    upload

-   Multi-dimensional impact scoring (process, technology, role,
    location, identity) per stakeholder group

-   Stakeholder segmentation into personas/cohorts for survey targeting
    and communications

-   Heat-map view of impact intensity by department, site or role,
    refreshed as scope changes

-   Automatic flag of high-impact, low-influence groups --- the
    population most at risk of being under-supported

**Frameworks Integrated:** Prosci Impact & Stakeholder Analysis; informs
which cohorts get full ADKAR tracking

**Primary Users:** Change Manager, People Managers, PMO

**Module 6 --- ADKAR Engine (Individual Readiness Core)**

The heart of person-level tracking. Every affected individual or persona
is scored across the five ADKAR building blocks --- Awareness, Desire,
Knowledge, Ability, Reinforcement --- with barrier-point diagnosis that
goes beyond a bare score to identify which building block is blocking
progress and why.

**Key Features**

-   Individual and cohort ADKAR scoring (1--5 scale) per building block,
    sourced from surveys, manager assessments, or self-report pulses

-   Barrier diagnosis: for any stalled block, a structured reason code
    (e.g. \"Desire --- fear of role redundancy\") rather than a bare
    number

-   Historical trend line per person/cohort showing movement through the
    five blocks over time

-   Automatic escalation rule: any group stalled at the same block for
    longer than a configurable threshold is flagged to the Change
    Manager

-   Manager check-in and 1:1 coaching-note capture, timestamped and
    linked to the relevant ADKAR block

-   Aggregation up to persona, department, site, Organization and Group
    level for portfolio reporting

**Frameworks Integrated:** ADKAR (Prosci) --- the primary
individual-level model powering this module

**Primary Users:** Change Manager, People Manager/Coach, Employee
(self-report)

**Module 7 --- Emotional & Transition Layer**

Where ADKAR tells you what capability or motivation is missing, this
layer tells you what someone is actually feeling. It overlays each
person\'s or cohort\'s position on Bridges\' Ending → Neutral Zone → New
Beginning transition path with a Kübler-Ross-derived sentiment read
(denial, resistance/anger, exploration, commitment). This is what makes
journi feel like a journey rather than a spreadsheet.

**Key Features**

-   Bridges Transition position tracked per person/cohort, distinct from
    --- but cross-referenced with --- the ADKAR score

-   Sentiment classification (denial, resistance, exploration,
    commitment) derived from pulse surveys and free-text sentiment
    analysis

-   Visual path/timeline per individual, persona or cohort combining
    transition stage and sentiment --- the literal \"journey\" view

-   Divergence alerts: e.g. a cohort scoring well on Knowledge/Ability
    (ADKAR) but still emotionally in \"Ending\" (Bridges) --- a classic
    hidden-resistance pattern

-   Anonymized aggregate sentiment view for Sponsors/Executives that
    never exposes individual free-text responses

**Frameworks Integrated:** William Bridges\' Transition Model;
Kübler-Ross Change Curve (adapted for organizational, not grief,
context)

**Primary Users:** Change Manager, People Manager/Coach

**Module 8 --- Sponsor & Coalition Module**

Tracks sponsor roadmap, visible and active sponsorship behaviors, and
the strength of the guiding coalition around an initiative --- the
single factor Prosci research identifies as the top predictor of change
success, and the substance of Kotter\'s Step 2.

**Key Features**

-   Sponsor roadmap: the specific, observable sponsorship actions
    expected at each project phase

-   Active-vs-passive sponsorship scoring, captured through manager and
    employee perception surveys

-   Guiding-coalition roster with influence and engagement rating per
    member

-   Sponsor-visibility tracker (town halls attended, communications
    sent, escalations resolved)

-   Alerts when sponsorship visibility drops below the threshold
    associated with stalled Desire scores in Module 6

**Frameworks Integrated:** Prosci Sponsor Model (active/visible
sponsorship); Kotter Step 2 --- Build a Guiding Coalition

**Primary Users:** Change Manager, Sponsor, PMO

**Module 9 --- Communication Planning & Execution**

Plans and tracks the message--audience--channel--timing matrix that
drives Awareness and Desire, and operationalizes Kotter\'s Step 4
(Communicate the Vision).

**Key Features**

-   Communication matrix builder: message, audience/persona, channel,
    sender, timing, linked project milestone

-   Calendar view across all active initiatives to detect message
    overload on the same population (change saturation)

-   Channel-performance tracking (open/response rates where the channel
    supports it)

-   Multilingual message variants generated per Module 3 language
    settings

-   Direct linkage of each communication to the ADKAR block it is
    intended to move (usually Awareness or Desire)

**Frameworks Integrated:** Kotter Step 4 --- Communicate the Vision;
feeds ADKAR Awareness/Desire

**Primary Users:** Change Manager, Communications Practitioner, Sponsor

**Module 10 --- Training & Capability Building**

Maps directly to ADKAR\'s Knowledge and Ability blocks, tracking
curriculum coverage, completion and demonstrated capability rather than
attendance alone. This is a natural hand-off point into a structured
training pipeline such as POWERACT\'s DPSK-style curriculum tracks.

**Key Features**

-   Training-needs assessment derived automatically from Module 6
    Knowledge/Ability gaps

-   Curriculum and session tracker (module, track/level, facilitator,
    format, completion status)

-   Competency/certification tracking distinct from attendance ---
    \"trained\" versus \"capable\"

-   Hand-off object to external training/LMS pipelines with gap data
    pre-populated

-   Post-training Ability re-assessment loop that feeds back into the
    ADKAR Engine

**Frameworks Integrated:** ADKAR Knowledge & Ability blocks; Kotter Step
5 --- Enable Action by Removing Barriers

**Primary Users:** Change Manager, Trainer/Practitioner, People Manager

**Module 11 --- Resistance Management**

Structured logging and resolution of resistance, classified by type ---
role-based, skill-based, will-based, or systemic --- with root cause and
mitigation action tracked to closure, linking the emotional read from
Module 7 to concrete manager interventions.

**Key Features**

-   Resistance log with type classification, source, root cause and
    severity

-   Mitigation action tracker with owner and due date, closed-loop back
    to the originating record

-   Pattern detection across cohorts to surface systemic (versus
    individual) resistance

-   Escalation path to Sponsor/Coalition module when resistance is
    coming from influential stakeholders

-   Employee-submitted resistance/concern flag (anonymous option)
    feeding directly into this log

**Frameworks Integrated:** Kübler-Ross resistance/anger stage; Kotter
Step 5

**Primary Users:** Change Manager, People Manager, Employee (submission
only)

**Module 12 --- Manager-as-Coach Enablement**

Operationalizes the research finding that the direct manager is the
single most influential factor in individual adoption. Gives People
Managers a simplified view of their team\'s ADKAR heatmap with suggested
coaching actions per barrier, without exposing organization-wide change
data they don\'t need.

**Key Features**

-   Team-scoped ADKAR heatmap, restricted to the manager\'s own direct
    reports

-   Suggested coaching scripts/talking points per identified barrier,
    pulled from a curated library

-   1:1 coaching-note log, timestamped and linked back to Module 6
    barrier records

-   Manager readiness self-assessment (a manager must be ready to lead
    the change before their team can be)

-   Lightweight mobile-friendly interface designed for time-constrained
    frontline supervisors

**Frameworks Integrated:** Prosci Manager/Coach research; ADKAR at the
team level

**Primary Users:** People Manager/Coach

**Module 13 --- Reinforcement & Sustainment**

The most commonly neglected stage of change work. Tracks post-go-live
adoption, celebrates wins (Kotter Steps 6--7), audits for regression to
old behavior, and formally closes the loop into the \"new normal\" ---
Lewin\'s Refreeze.

**Key Features**

-   Post-go-live adoption audit cadence (30/60/90-day checkpoints,
    configurable)

-   Regression detection: flags when usage/behavior metrics drift back
    toward pre-change patterns

-   Quick-win and milestone celebration tracker, visible to the whole
    affected population

-   Formal sustainment sign-off and hand-off to Business-as-Usual
    ownership (Refreeze)

-   Lessons-learned repository feeding the next initiative\'s Module 4
    intake

**Frameworks Integrated:** Lewin Refreeze; Kotter Steps 6 (Generate
Short-Term Wins) and 8 (Anchor New Approaches)

**Primary Users:** Change Manager, People Manager, Sponsor

**Module 14 --- Change Risk Register**

A risk register purpose-built for the people side of change, distinct
from generic project risk: adoption risk, sponsor-attrition risk, and
change-saturation risk from concurrent initiatives hitting the same
population.

**Key Features**

-   Risk log scoped to adoption, sponsorship, capacity and saturation
    risk categories

-   Automatic cross-reference to Module 1\'s portfolio: flags when a
    population is targeted by multiple concurrent initiatives

-   Likelihood/impact scoring and mitigation ownership, reviewed on a
    configurable cadence

-   Escalation trigger to Sponsors when a risk crosses a defined
    severity threshold

-   Rolled-up risk view at Organization and Group level for portfolio
    governance

**Frameworks Integrated:** Extends standard project-risk practice with
change-saturation and adoption-risk categories

**Primary Users:** Change Manager, PMO, Sponsor

**Module 15 --- Metrics & Analytics Dashboard**

The analytical brain of journi: readiness indices, adoption curves,
ADKAR heatmaps by group, and correlation between sentiment and adoption
speed, with an optional AI Copilot layer that turns patterns into
recommended actions.

**Key Features**

-   A level selector rolls the entire dashboard up at Change Management
    Project, Organization, or Group level. Which levels are available
    depends on both the signed-in role and whether the scoped
    Organization actually belongs to a Group: every role sees its own
    Project level; Organization level requires an Organization-scope-
    or-broader role; Group level additionally requires the scoped
    Organization to belong to a Group --- an ungrouped Organization
    never shows a Group tab, for any role

-   Composite Readiness Index blending ADKAR, sentiment and
    training-completion data

-   Adoption-curve visualization against the Bridges/Lewin phase
    timeline

-   Cross-tabulated ADKAR heatmaps by department, site, persona and
    Group

-   Correlation analysis between sentiment trend and adoption speed to
    surface early-warning signals

-   **Change Management Benchmarking:** a dedicated tab compares each
    project\'s Composite Readiness Index against a reference band for
    its current Lewin phase and against the peer average of every other
    project in scope at the active level, surfacing a Behind / In Line
    / Ahead standing per project --- available at the same Project /
    Organization / Group levels as the rest of the dashboard

-   AI Copilot suggestions in natural language, e.g. \"Group X is stuck
    at Desire --- 60% cite fear of role redundancy; recommend targeted
    1:1s with these 12 managers\"

-   Exportable executive reporting pack, generated per audience
    (Sponsor, Executive, PMO)

**Frameworks Integrated:** Synthesizes all frameworks in the platform
into a single readiness signal, benchmarked against phase-appropriate
reference bands

**Primary Users:** Change Manager, Sponsor, Executive Viewer, PMO

**Module 16 --- Journey Map / Visual Core**

The signature interface of journi: a literal, visual timeline per
person, persona or cohort combining ADKAR stage, Bridges phase and
sentiment in one view --- deliberately distinct from the tabular
dashboards typical of legacy OCM tools, and the visual identity from
which the product takes its name.

**Key Features**

-   Interactive path visualization per individual/persona/cohort,
    spanning Ending → Neutral Zone → New Beginning

-   Overlaid markers for ADKAR block transitions and key
    communications/training events along the path

-   Color-coded sentiment trail (denial → resistance → exploration →
    commitment)

-   Zoom from individual employee up to cohort, department, Organization
    and Group journey views

-   Shareable, presentation-ready journey snapshots for Steering
    Committee updates

**Frameworks Integrated:** Visual synthesis of ADKAR, Bridges and
Kübler-Ross on a single timeline

**Primary Users:** All roles, at the scope permitted by RBAC

**Module 17 --- AI Use Case Library & Governance**

A governed catalog of pre-built AI use cases that plug into the modules
above. Every use case in the library is restricted to one of two tiers
--- Assistive or Augmented --- deliberately excluding Autonomous AI: no
AI use case in journi is permitted to take an irreversible action
(sending a communication, changing a record of truth, altering access
rights) on its own. A human always remains the decision-maker. Admins
control, per Organization, which use cases are switched on.

**AI Tiers Used in journi**

**Assistive AI:** The AI observes, analyzes, or suggests; a human
performs the actual task and makes the decision. Example: flagging a
barrier pattern for a Change Manager to review. The AI never edits the
record itself.

**Augmented AI:** The AI performs a substantial part of the task ---
drafting, classifying, summarizing at scale --- but a human must review,
edit and approve the output before it is finalized, distributed, or
acted upon. Example: drafting an executive readiness narrative that the
Change Manager edits and approves before it reaches the Sponsor.

Autonomous AI --- where the system would act without a human checkpoint
--- is intentionally out of scope for this library. If a future release
introduces autonomous capability, it will be governed as a separate,
explicitly-gated tier rather than folded into this one.

**Library Structure**

-   Each catalog entry carries: name, description, AI tier
    (Assistive/Augmented), the module it plugs into, its trigger/input
    data, its output, and the required human-in-the-loop checkpoint

-   Every AI-generated output is visually labeled \"AI-generated ---
    review required\" wherever it appears in the interface, so users
    always know when they are looking at a suggestion versus a
    human-entered fact

-   AI use cases operate strictly within the RBAC and data-visibility
    boundaries of the module they plug into --- an AI use case never
    grants a user visibility they would not otherwise have

**Activation & Governance**

-   Super Admin controls which use cases exist in the global catalog and
    can retire or update them

-   Group Admin or Organization Admin activates or deactivates each use
    case independently, per Organization --- a use case can be live for
    one client Organization and switched off for another

-   Change Managers may request a project-level override (activating a
    use case for one Project only) where the Organization Admin has
    allowed delegated control

-   Deactivating a use case immediately stops new AI-generated
    suggestions in that scope; previously generated and human-approved
    content is never retroactively removed

-   Every AI suggestion is logged with its outcome --- accepted as-is,
    edited, or rejected --- building an AI usage and override audit
    trail that Organization Admins and Super Admins can review for
    quality and governance reporting

-   This governance model applies uniformly to the AI Copilot referenced
    in Module 15\'s Analytics Dashboard, which is itself powered by
    entries in this library rather than a separate mechanism

**Seeded AI Use Case Catalog**

The following fourteen use cases are seeded into the library at launch,
spanning eight of the seventeen other modules. All are Assistive or
Augmented; none acts autonomously.

  -------------------------------------------------------------------------------------------------
  **AI Use Case**     **Tier**    **Primary Module** **What It Does**             **Human
                                                                                  Checkpoint**
  ------------------- ----------- ------------------ ---------------------------- -----------------
  Stakeholder Impact  Assistive   M5 Stakeholder &   Drafts suggested impact      Change Manager
  Drafting Assistant              Impact Mapping     scores and cohort            confirms or edits
                                                     segmentation from the org    every score
                                                     chart and change scope.      before it is
                                                                                  saved

  ADKAR Barrier       Assistive   M6 ADKAR Engine    Suggests a likely barrier    Change Manager
  Diagnosis Assistant                                reason code from open-text   confirms or
                                                     survey responses (e.g.       re-codes before
                                                     \"Desire --- fear of role    it enters the
                                                     redundancy\").               record

  Cohort Readiness    Augmented   M6 ADKAR Engine    Auto-drafts a written        Change Manager
  Summarizer                                         readiness narrative per      reviews and edits
                                                     cohort from raw ADKAR        before
                                                     scores, for Sponsor          distribution
                                                     reporting.                   

  Sentiment & Emotion Augmented   M7 Emotional &     Classifies free-text pulse   Any individual
  Classifier                      Transition Layer   comments into Kübler-Ross    classification
                                                     sentiment categories at      can be overridden
                                                     scale.                       by the Change
                                                                                  Manager

  Divergence Pattern  Assistive   M7 Emotional &     Flags cohorts where ADKAR    Flag surfaced for
  Detector                        Transition Layer   scores and emotional/Bridges Change Manager
                                                     position diverge (a          review only ---
                                                     hidden-resistance signal).   no automatic
                                                                                  action

  Sponsor Action      Assistive   M8 Sponsor &       Suggests the next best       Sponsor or Change
  Recommender                     Coalition          sponsorship action based on  Manager chooses
                                                     the sponsorship-visibility   whether to act on
                                                     score.                       the suggestion

  Communication Draft Augmented   M9 Communications  Drafts message copy per      Communications
  Generator                                          persona, channel and         Practitioner
                                                     language from the            edits and
                                                     communication matrix.        approves before
                                                                                  send --- no
                                                                                  auto-send

  Change Saturation   Assistive   M9 Communications  Flags scheduling conflicts   Change
  Advisor                         / M14 Risk         across concurrent            Manager/PMO
                                  Register           communications hitting the   decides whether
                                                     same population and suggests to reschedule
                                                     reschedule windows.          

  Training            Assistive   M10 Training &     Recommends curriculum        Trainer confirms
  Gap-to-Curriculum               Capability         modules/tracks from          curriculum
  Mapper                                             identified Knowledge/Ability assignment
                                                     gaps.                        

  Manager Coaching    Assistive   M12                Generates a tailored         People Manager
  Script Generator                Manager-as-Coach   coaching talking-point       chooses to use,
                                                     script per flagged team      adapt, or discard
                                                     barrier.                     the script

  Resistance          Assistive   M11 Resistance     Suggests a resistance type   Change Manager
  Root-Cause                      Management         (role/skill/will/systemic)   confirms
  Classifier                                         from the logged description  classification
                                                     text.                        before closure
                                                                                  tracking begins

  Regression Risk     Augmented   M13 Reinforcement  Analyzes post-go-live usage  Change Manager
  Predictor                       & Sustainment      trend data and produces an   reviews the flag
                                                     early regression-risk score  and decides on
                                                     with a narrative             intervention
                                                     explanation.                 

  Executive Readiness Augmented   M15 Metrics &      Auto-drafts the              Change
  Narrative Generator             Analytics          executive-summary narrative  Manager/Sponsor
                                                     of the reporting pack from   approves before
                                                     the Readiness Index and      the pack is
                                                     underlying data.             distributed

  Journey Map         Assistive   M16 Journey Map    Suggests annotation labels   Any suggested
  Annotation                                         for key transition events on annotation can be
  Assistant                                          an individual\'s or          edited or
                                                     cohort\'s visual timeline.   dismissed before
                                                                                  it is published
                                                                                  to the map
  -------------------------------------------------------------------------------------------------

**Real LLM Provider Connection**

By default, every AI use case above runs against a deterministic
built-in generator, so the library is fully demonstrable with no
external dependency. Module 17 also offers an optional Provider
Connection panel that routes the same use cases through a real LLM: pick
a provider (Anthropic, OpenAI, Google, or a custom OpenAI-compatible
endpoint), supply an API key, and choose a model from a curated
per-provider shortlist defaulting to the fastest/cheapest option strong
enough for the library\'s short, structured outputs (a diagnosis, a
coaching script, a draft message --- never long-form generation). Since
journi has no backend, the request goes directly from the signed-in
user\'s browser to the provider\'s public API; the key is stored only in
that browser\'s local storage, kept separate from the rest of the
application\'s data so it survives a demo-data reset and is never bundled
into seed data. If the call fails for any reason (missing key, network
or CORS error, unexpected response), the use case falls back to the
built-in generator automatically, so a misconfigured or absent
connection never blocks a workflow. This pattern is adequate for a
personal or demo deployment; a production, multi-user deployment should
proxy these calls through a real backend rather than storing provider
keys client-side.

**Frameworks Integrated:** Cuts across all frameworks in the platform by
accelerating the analysis and drafting work within each; tier discipline
(Assistive/Augmented/Autonomous) follows the AI-tier vocabulary used in
POWERACT\'s own AI training curriculum

**Primary Users:** Super Admin, Group/Organization Admin (activation and
provider connection); Change Manager, Trainer, Communications
Practitioner, People Manager (consumption, all modules)

**Module 18 --- Work Breakdown Structure & Gantt**

A single Work Breakdown Structure spanning three tracks --- Project
Management, Change Management, and the Lewin/Prosci/Bridges/ADKAR
framework milestones --- so a Change Manager, PMO and Sponsor share one
timeline instead of three disconnected ones. Every task carries a
baseline (the planned start/finish, set once during planning) and an
actual (the observed start/finish, updated as work happens), and the
module surfaces the resulting schedule gap --- ahead/on-time, a minor
slip, or a significant slip --- task by task and as a portfolio-level
average, so schedule risk is visible before it becomes a missed go-live.

**Key Features**

-   Editable WBS task table, one row per task, grouped into the
    Project Management, Change Management, and Framework tracks, with
    full Create/Read/Update/Delete gated by the same role × scope model
    (Section 3.2) and Permission Matrix (Section 3.4) as every other
    module

-   Each task carries a track, a phase label, a name, a baseline
    start/finish, an optional actual start/finish, a status (planned /
    in progress / done / at risk), and a computed schedule-gap value in
    days

-   Framework-track tasks may be zero-duration milestones (baseline
    start equals baseline finish) --- e.g. \"Awareness staged to 3\" or
    \"Unfreeze → Change\" --- rendered as a marker rather than a bar,
    for the discrete state transitions that Lewin, Prosci, Bridges and
    ADKAR represent rather than continuous work

-   A Gantt chart renders every task on a shared, auto-scaled calendar
    (month-level by default, computed from the full span of baseline and
    actual dates across all tasks) with the baseline shown as an
    outlined bar and the actual shown as a solid bar in the same row, a
    today marker, and a per-task gap badge color-coded green
    (on-time/ahead), amber (minor slip) or red (significant slip)

-   Portfolio-level summary: total task count, tasks on-track or ahead,
    tasks at risk, and the average schedule gap across every task with
    an actual date recorded

-   New Change Management Projects start with an empty WBS, so a real
    rollout is never pre-populated with fictional planning data; the
    illustrative seed cases (Section 6) each carry a representative WBS
    for demonstration

-   **Load Phase Template:** seeds the Project Management track with one
    skeleton task per phase of a Phase Template (Section 4, Module 19),
    spaced evenly from a chosen start date. The template picker defaults
    to the Recommended End-to-End Process\'s template for the project\'s
    linked Main Project type --- e.g. a Business Process Reengineering
    Main Project defaults to TPL-BPR-7 --- but any of the eight
    templates can be selected. This is a starting skeleton to break down
    into real tasks, not a finished plan

-   **Phase Checklist:** PM-track and CM-track checklist items per
    phase, distinct from WBS tasks, each with a done/not-done state; the
    completion percentage per phase feeds the CM input of a Phase Gate
    decision below

-   **Phase Gates (Joint Decision Record):** implements the PM ↔ CM
    Governance Bridge (E2E-06) --- triggered by a Main Project schedule
    slip or a phase-gate checkpoint. The Project Manager and the Change
    Manager record their inputs independently (a Go / Go with
    Conditions / No-Go recommendation each, with notes), the Change
    Manager\'s input carrying an auto-populated Composite Readiness
    Index snapshot (Module 15\'s formula), a Phase Checklist completion
    percentage, and any open flags (auto-suggested from the Divergence
    Pattern Detector and stalled ADKAR blocks). The two independent
    inputs are preserved alongside the fused Joint Decision, which
    carries exactly one Accountable role --- the Project Manager

**Frameworks Integrated:** Cross-cutting --- gives Lewin, Prosci, Bridges
and ADKAR a shared timeline alongside the Project Management delivery
track, rather than tracking each in isolation; Phase Gates implement the
PM ↔ CM Governance Bridge cross-cutting loop (Module 19)

**Primary Users:** PMO, Change Manager, Sponsor

**Module 19 --- Macro Process, SIPOC, RACSI & End-to-End Registry**

The process backbone every other module is built on, made browsable in
one place. Ten Macro Processes (MP-01 through MP-10) are the atomic
units of journi\'s process model; every module owns one or more of them
(Module 5 owns MP-01, Module 8 owns MP-02 and MP-06, and so on). Sixteen
End-to-End Process chains are registered against that backbone: four
core lifecycle chains spanning the whole engagement (Readiness &
Mobilization, Capability Build, Resistance-to-Commitment, Sustainment &
Closure), four cross-cutting loop chains that make an existing
cross-module dependency explicit as its own registered chain (Signal
Aggregation Loop, PM ↔ CM Governance Bridge, Champion Early-Warning
Loop, Governance Escalation Loop), and eight transformation-type
lifecycles --- one per project type introduced in Module 1, each with
its own rolled-up SIPOC and linked Phase Template.

**Key Features**

-   **Macro Process Catalog tab:** all ten Macro Processes, each with
    its ID, name, description, and the journi module(s) that implement
    it

-   **E2E Process Registry tab:** all sixteen registered End-to-End
    Process chains, grouped by kind (core lifecycle / cross-cutting loop
    / transformation-type lifecycle), each rendered as its ordered
    Macro Process chain with trigger and terminal-state text where
    defined; transformation-type entries additionally show their
    rolled-up SIPOC (suppliers and customers) and linked Phase Template

-   **RACSI Grid tab:** a ten-Macro-Process × six-role editable grid
    (Sponsor, Change Manager, People Manager, Practitioner, Employee,
    Executive), each cell one of Responsible / Accountable / Consulted /
    Sign-off / Informed --- editable in place by a Super/Group/Org Admin,
    read-only for every other role, mirroring how the Permission Matrix
    (Module 2) is seeded with a sensible default and left runtime-editable
    rather than hardcoded

-   Read access to the catalog and registry is unrestricted (every role
    can browse it); only the RACSI grid\'s edit capability is
    role-gated, matching Module 2\'s Manage Hierarchy capability

**Frameworks Integrated:** Cross-cutting --- this module is the
canonical source for the Macro Process and End-to-End Process vocabulary
used throughout Sections 4--6 of this document; it also hosts the RACSI
governance layer referenced by the Phase Gate feature in Module 18

**Primary Users:** All roles (read); Super Admin, Group/Organization
Admin (RACSI grid edits)

**5. Framework-to-Module Mapping Matrix**

journi does not force a single change methodology. Instead, each
established framework is mapped onto the module(s) where it is
operationally expressed, so practitioners trained in any one methodology
find their vocabulary represented in the tool.

  -------------------------------------------------------------------------------
  **Framework**                  **Primary Level**  **Modules Where Applied**
  ------------------------------ ------------------ -----------------------------
  ADKAR (Prosci)                 Individual /       M6 ADKAR Engine; M10
                                 Cohort             Training; M12 Manager Coach;
                                                    M15 Analytics

  Kotter\'s 8 Steps              Organizational     M8 Sponsor & Coalition; M9
                                                    Communications; M10 Training;
                                                    M13 Sustainment

  Lewin                          Organizational     M4 Initiative Registry; M13
  (Unfreeze--Change--Refreeze)   (macro-state)      Reinforcement & Sustainment

  Bridges Transition Model       Individual /       M7 Emotional & Transition
                                 Emotional          Layer; M16 Journey Map

  Kübler-Ross Change Curve       Individual /       M7 Emotional & Transition
                                 Emotional          Layer; M11 Resistance
                                                    Management

  Prosci Sponsor & Manager       Organizational /   M8 Sponsor & Coalition; M12
  Research                       Team               Manager-as-Coach

  AI Tiers --- Assistive &       Cross-cutting      M17 AI Use Case Library;
  Augmented                                         expressed inside M5, M6, M7,
                                                    M8, M9, M10, M11, M12, M13,
                                                    M15, M16
  -------------------------------------------------------------------------------

Module 18 (WBS & Gantt) is deliberately cross-cutting rather than tied to
one row above: it is the one place every framework in this table shares
a single baseline-vs-actual calendar with the Project Management
delivery track, alongside the Lewin macro-state owned by M4, the
Bridges/Kübler-Ross position owned by M7, and the ADKAR scores owned by
M6.

**6. Seed Dataset --- Fourteen Illustrative Cases**

To pre-populate journi for demonstration, training and testing, the
platform is seeded with fourteen cases. Nine follow the original
three-sectors-by-three-types pattern: three sectors --- Manufacturing,
Logistics & Transportation, and Health --- each carrying three project
types --- ERP Implementation, Business Process Automation, and
Integrated Management System (QMS). Five more were added to give each of
CR1\'s remaining transformation types a real, working example: a
Cultural / Values Transformation case in Manufacturing (reusing an
existing standalone culture-change Change Management Project, now linked
to a Main Project of that type), a Business Process Reengineering and an
Operating Model Redesign case in Logistics & Transportation, a
Compliance-Driven Change case in Health, and a Training & Skills
Development case at a second Manufacturing site. Section 6.4 documents
these five. Every case pairs a Main Project with a linked Change
Management Project, illustrating the linkage model described in Section
2.2. Each Change Management Project also ships with an example set of AI
use cases pre-activated from the Module 17 library, illustrating how an
Organization Admin would tailor the catalog to a given project type ---
these can be individually deactivated at any time without affecting the
underlying data. All organizations, individuals and figures below are
fictional composites created for seeding purposes.

**6.1 Sector: Manufacturing**

**Seeded Organization:** Atlas Industrial Group --- Casablanca Plant
Cluster

Multi-site industrial manufacturer, \~3,100 employees across 3 plants
and a shared services center. Existing journi Group: \"Atlas Industrial
Group\"; Organization: \"Atlas Industrial Group --- Casablanca Plant
Cluster\".

**6.1.1 ERP Implementation --- \"S/4HANA Unification Program\"**

  -----------------------------------------------------------------------
  **Main Project**    
  ------------------- ---------------------------------------------------
  Name                S/4HANA Unification Program

  Type                ERP Implementation

  Scope               Consolidate three legacy plant-level ERPs onto a
                      single SAP S/4HANA instance covering finance,
                      procurement, production planning and inventory.

  Duration            16 months

  Budget Band         €4.2M band

  Executive Sponsor   COO, Atlas Industrial Group
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Linked Change     
  Management          
  Project**           
  ------------------- ---------------------------------------------------
  Name                Atlas ERP People Readiness Program

  Linkage             Linked to Main Project

  Change Manager      Change Manager, Atlas ERP Program

  Target Population   \~1,200 plant and back-office staff (finance,
                      procurement, planning, warehouse supervisors)

  Bridges Transition  Ending phase, entering Neutral Zone for
  Phase               early-adopter finance team

  Sentiment Snapshot  Mixed Denial/Resistance among shop-floor
  (Kübler-Ross)       supervisors; Exploration among finance leadership

  Sponsor Coalition   Guiding coalition formed (COO, 3 plant directors,
  Status              Finance VP); visibility rated Moderate ---
                      plant-floor presence still limited

  AI Use Cases        ADKAR Barrier Diagnosis Assistant, Communication
  Activated (example) Draft Generator, Change Saturation Advisor
  -----------------------------------------------------------------------

**ADKAR Baseline Snapshot**

  ------------------------------------------------------------------------
  **Building       **Score**   **Note**
  Block**                      
  ---------------- ----------- -------------------------------------------
  Awareness        3 / 5       Town halls held; shop-floor supervisors
                               still under-informed

  Desire           2 / 5       Job-security concerns after prior
                               automation announcement

  Knowledge        2 / 5       Training curriculum not yet launched

  Ability          2 / 5       No hands-on practice environment available
                               yet

  Reinforcement    1 / 5       Go-live still 9 months out; too early to
                               reinforce
  ------------------------------------------------------------------------

**Key Risks**

-   Change saturation --- concurrent Process Automation initiative
    targets an overlapping population

-   Union sensitivities around headcount perception in consolidated
    back-office roles

-   Multi-site rollout sequencing risk across 3 plants with different
    legacy-system maturity

**6.1.2 Process Automation --- \"Order-to-Cash RPA & Workflow
Automation\"**

  -----------------------------------------------------------------------
  **Main Project**    
  ------------------- ---------------------------------------------------
  Name                Order-to-Cash RPA & Workflow Automation

  Type                Process Automation

  Scope               Deploy RPA bots and a workflow engine to automate
                      order intake, invoicing and three-way-match
                      reconciliation in Finance & Ops.

  Duration            8 months

  Budget Band         €950K band

  Executive Sponsor   CFO, Atlas Industrial Group
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Linked Change     
  Management          
  Project**           
  ------------------- ---------------------------------------------------
  Name                Atlas Automation Adoption Track

  Linkage             Linked to Main Project

  Change Manager      Change Manager, Atlas Automation Track

  Target Population   \~180 finance and operations staff whose tasks are
                      directly automated

  Bridges Transition  Ending phase --- strongest identity-loss signal of
  Phase               the three Atlas cases

  Sentiment Snapshot  Denial/Anger concentrated in transaction-processing
  (Kübler-Ross)       roles most exposed to automation

  Sponsor Coalition   CFO actively sponsoring; coalition includes Finance
  Status              Ops Director; visibility rated Strong

  AI Use Cases        Sentiment & Emotion Classifier, Manager Coaching
  Activated (example) Script Generator, Resistance Root-Cause Classifier
  -----------------------------------------------------------------------

**ADKAR Baseline Snapshot**

  ------------------------------------------------------------------------
  **Building       **Score**   **Note**
  Block**                      
  ---------------- ----------- -------------------------------------------
  Awareness        4 / 5       Clear communication of scope and timeline

  Desire           2 / 5       Strong fear of role redundancy --- top
                               barrier

  Knowledge        3 / 5       Reskilling curriculum defined, in progress

  Ability          2 / 5       Practice environment not yet live

  Reinforcement    1 / 5       Not yet applicable --- pre go-live
  ------------------------------------------------------------------------

**Key Risks**

-   Resistance driven by perceived job loss rather than skill or
    awareness gaps

-   Reskilling plan must be visible and credible before Desire will move

-   Overlap with ERP program population risks message fatigue

**6.1.3 QMS Implementation --- \"ISO 9001:2015 QMS Digitalization\"**

  -----------------------------------------------------------------------
  **Main Project**    
  ------------------- ---------------------------------------------------
  Name                ISO 9001:2015 QMS Digitalization

  Type                QMS Implementation

  Scope               Digitize the quality management system: electronic
                      non-conformance reporting, CAPA workflow, and
                      digital audit trail replacing paper forms.

  Duration            10 months

  Budget Band         €620K band

  Executive Sponsor   VP Quality, Atlas Industrial Group
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Linked Change     
  Management          
  Project**           
  ------------------- ---------------------------------------------------
  Name                Atlas Quality Culture Program

  Linkage             Linked to Main Project

  Change Manager      Change Manager, Atlas Quality Program

  Target Population   \~400 quality and production staff across all 3
                      plants

  Bridges Transition  Neutral Zone --- pilot plant furthest along; other
  Phase               2 plants still in Ending

  Sentiment Snapshot  Exploration in pilot plant; Denial/Resistance in
  (Kübler-Ross)       the two plants not yet started

  Sponsor Coalition   VP Quality sponsoring directly; plant quality
  Status              managers form coalition; visibility rated Strong in
                      pilot plant only

  AI Use Cases        Training Gap-to-Curriculum Mapper, Regression Risk
  Activated (example) Predictor, Cohort Readiness Summarizer
  -----------------------------------------------------------------------

**ADKAR Baseline Snapshot**

  ------------------------------------------------------------------------
  **Building       **Score**   **Note**
  Block**                      
  ---------------- ----------- -------------------------------------------
  Awareness        4 / 5       Strong campaign tied to upcoming
                               recertification audit

  Desire           3 / 5       Generally positive --- seen as reducing
                               paperwork burden

  Knowledge        3 / 5       Pilot-plant training underway

  Ability          3 / 5       Pilot plant showing early proficiency

  Reinforcement    2 / 5       Habit-reversion risk to paper forms during
                               transition
  ------------------------------------------------------------------------

**Key Risks**

-   Habitual reversion to paper-based non-conformance reporting under
    audit time pressure

-   Fixed recertification audit date leaves little schedule slack

-   Inconsistent digital literacy across the 3 plants slows uniform
    rollout

**6.2 Sector: Logistics and Transportation**

**Seeded Organization:** Maghreb Logistics Hub

Regional freight, warehousing and last-mile logistics operator, \~4,500
employees across 5 hubs. Existing journi Organization: \"Maghreb
Logistics Hub\" (standalone, no Group).

**6.2.1 ERP Implementation --- \"Oracle Fusion Freight ERP Rollout\"**

  -----------------------------------------------------------------------
  **Main Project**    
  ------------------- ---------------------------------------------------
  Name                Oracle Fusion Freight ERP Rollout

  Type                ERP Implementation

  Scope               Replace legacy freight billing and
                      dispatch-planning systems with a unified Oracle
                      Fusion ERP across 5 hubs.

  Duration            14 months

  Budget Band         €3.1M band

  Executive Sponsor   COO, Maghreb Logistics Hub
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Linked Change     
  Management          
  Project**           
  ------------------- ---------------------------------------------------
  Name                Maghreb ERP Transition Program

  Linkage             Linked to Main Project

  Change Manager      Change Manager, Maghreb ERP Program

  Target Population   \~650 dispatch, warehouse and finance staff across
                      5 hubs

  Bridges Transition  Ending phase across all 5 hubs; earliest hub
  Phase               entering Neutral Zone

  Sentiment Snapshot  Exploration at lead hub; Denial at 2 remote hubs
  (Kübler-Ross)       with limited communication reach

  Sponsor Coalition   COO sponsoring; hub managers form coalition but
  Status              visibility uneven across sites --- rated Moderate

  AI Use Cases        ADKAR Barrier Diagnosis Assistant, Communication
  Activated (example) Draft Generator, Change Saturation Advisor
  -----------------------------------------------------------------------

**ADKAR Baseline Snapshot**

  ------------------------------------------------------------------------
  **Building       **Score**   **Note**
  Block**                      
  ---------------- ----------- -------------------------------------------
  Awareness        3 / 5       Communicated at 3 of 5 hubs; 2 remote hubs
                               lagging

  Desire           3 / 5       Neutral-to-positive --- seen as overdue
                               system replacement

  Knowledge        2 / 5       Training not yet scheduled at 2 hubs

  Ability          2 / 5       No sandbox environment available yet

  Reinforcement    1 / 5       Pre go-live
  ------------------------------------------------------------------------

**Key Risks**

-   24/7 operations make it difficult to pause staff for classroom
    training

-   Multilingual, mixed digital-literacy driver and dispatch workforce

-   Geographic dispersion across 5 hubs slows consistent message
    delivery

**6.2.2 Process Automation --- \"Warehouse & Dispatch Automation\"**

  -----------------------------------------------------------------------
  **Main Project**    
  ------------------- ---------------------------------------------------
  Name                Warehouse & Dispatch Automation

  Type                Process Automation

  Scope               Deploy an automated dispatch-optimization engine
                      and robotics-assisted picking in the two largest
                      warehouse hubs.

  Duration            9 months

  Budget Band         €1.4M band

  Executive Sponsor   VP Operations, Maghreb Logistics Hub
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Linked Change     
  Management          
  Project**           
  ------------------- ---------------------------------------------------
  Name                Maghreb Frontline Adoption Program

  Linkage             Linked to Main Project

  Change Manager      Change Manager, Maghreb Frontline Program

  Target Population   \~900 warehouse and driver-dispatch staff, largely
                      frontline with lower digital literacy

  Bridges Transition  Ending phase --- high identity-loss risk among
  Phase               veteran dispatchers

  Sentiment Snapshot  Denial/Anger dominant; high anxiety around
  (Kübler-Ross)       device-based workflows

  Sponsor Coalition   VP Operations sponsoring; shift supervisors form
  Status              coalition; visibility rated Weak on night shifts

  AI Use Cases        Sentiment & Emotion Classifier, Manager Coaching
  Activated (example) Script Generator, Resistance Root-Cause Classifier
  -----------------------------------------------------------------------

**ADKAR Baseline Snapshot**

  ------------------------------------------------------------------------
  **Building       **Score**   **Note**
  Block**                      
  ---------------- ----------- -------------------------------------------
  Awareness        3 / 5       Toolbox talks held at shift level

  Desire           2 / 5       Concern automation reduces available
                               shifts/overtime

  Knowledge        1 / 5       Digital-literacy gap is the primary
                               barrier, not content

  Ability          1 / 5       No hands-on device practice yet

  Reinforcement    1 / 5       Pre go-live
  ------------------------------------------------------------------------

**Key Risks**

-   Digital-divide risk: literacy gap, not motivation, is the core
    Knowledge/Ability barrier

-   High frontline turnover threatens training ROI and continuity

-   Shift-based operations complicate synchronized training delivery

**6.2.3 QMS Implementation --- \"ISO 9001 & Transport Safety QMS\"**

  -----------------------------------------------------------------------
  **Main Project**    
  ------------------- ---------------------------------------------------
  Name                ISO 9001 & Transport Safety QMS

  Type                QMS Implementation

  Scope               Implement an integrated quality and safety
                      management system covering fleet operations,
                      incident reporting and driver safety compliance.

  Duration            11 months

  Budget Band         €780K band

  Executive Sponsor   VP Safety & Compliance, Maghreb Logistics Hub
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Linked Change     
  Management          
  Project**           
  ------------------- ---------------------------------------------------
  Name                Maghreb Safety & Quality Culture Initiative

  Linkage             Linked to Main Project

  Change Manager      Change Manager, Maghreb Safety Initiative

  Target Population   \~1,100 drivers and operations supervisors across
                      all hubs

  Bridges Transition  Neutral Zone for hub-based supervisors; Ending
  Phase               phase for road-based drivers

  Sentiment Snapshot  Exploration among supervisors; Denial/Resistance
  (Kübler-Ross)       among long-haul drivers wary of monitoring
                      perception

  Sponsor Coalition   VP Safety sponsoring; regional safety officers form
  Status              coalition; visibility rated Strong at hubs, Weak on
                      the road

  AI Use Cases        Training Gap-to-Curriculum Mapper, Regression Risk
  Activated (example) Predictor, Cohort Readiness Summarizer
  -----------------------------------------------------------------------

**ADKAR Baseline Snapshot**

  ------------------------------------------------------------------------
  **Building       **Score**   **Note**
  Block**                      
  ---------------- ----------- -------------------------------------------
  Awareness        4 / 5       Strong push tied to insurer and regulatory
                               requirements

  Desire           3 / 5       Generally supportive --- safety framed as
                               driver benefit, not compliance burden

  Knowledge        2 / 5       Mobile-app incident reporting training just
                               beginning

  Ability          2 / 5       Limited connectivity in some regions slows
                               practice

  Reinforcement    1 / 5       Pre go-live
  ------------------------------------------------------------------------

**Key Risks**

-   Geographically dispersed, largely mobile workforce is hard to reach
    consistently

-   Safety-critical behavior change requires sustained reinforcement,
    not one-time training

-   Driver perception risk: safety reporting misread as surveillance

**6.3 Sector: Health**

**Seeded Organization:** Meridia Health Network

Multi-hospital health network, 3 facilities, \~5,200 clinical and
administrative staff. Existing journi Organization: \"Meridia Health
Network\" (standalone, no Group).

**6.3.1 ERP Implementation --- \"Unified Hospital ERP & HIS
Integration\"**

  -----------------------------------------------------------------------
  **Main Project**    
  ------------------- ---------------------------------------------------
  Name                Unified Hospital ERP & HIS Integration

  Type                ERP Implementation

  Scope               Implement an integrated ERP (finance, HR, supply
                      chain) tightly linked to the existing Hospital
                      Information System across all 3 facilities.

  Duration            18 months

  Budget Band         €5.6M band

  Executive Sponsor   CFO, Meridia Health Network
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Linked Change     
  Management          
  Project**           
  ------------------- ---------------------------------------------------
  Name                Meridia Health ERP Adoption Program

  Linkage             Linked to Main Project

  Change Manager      Change Manager, Meridia ERP Program

  Target Population   \~2,000 clinical and administrative staff across 3
                      hospitals

  Bridges Transition  Ending phase for clinical staff; Neutral Zone for
  Phase               finance/admin early adopters

  Sentiment Snapshot  Resistance among clinicians; Exploration among
  (Kübler-Ross)       administrative finance staff

  Sponsor Coalition   CFO sponsoring; Chief Medical Officer not yet an
  Status              active coalition member --- flagged risk

  AI Use Cases        ADKAR Barrier Diagnosis Assistant, Communication
  Activated (example) Draft Generator, Change Saturation Advisor
  -----------------------------------------------------------------------

**ADKAR Baseline Snapshot**

  ------------------------------------------------------------------------
  **Building       **Score**   **Note**
  Block**                      
  ---------------- ----------- -------------------------------------------
  Awareness        3 / 5       Administrative staff well informed;
                               clinical staff less engaged

  Desire           2 / 5       Clinicians resist added administrative
                               burden on top of patient care

  Knowledge        2 / 5       Clinical-facing training not yet designed

  Ability          1 / 5       No clinical sandbox environment yet

  Reinforcement    1 / 5       Pre go-live
  ------------------------------------------------------------------------

**Key Risks**

-   Patient-safety-critical cutover windows severely constrain go-live
    timing

-   Clinician resistance to any perceived increase in non-clinical
    administrative load

-   Integration risk between new ERP and the live Hospital Information
    System

**6.3.2 Process Automation --- \"Patient Intake & Claims Automation\"**

  -----------------------------------------------------------------------
  **Main Project**    
  ------------------- ---------------------------------------------------
  Name                Patient Intake & Claims Automation

  Type                Process Automation

  Scope               Automate patient registration, insurance-claims
                      processing and prior-authorization workflows across
                      front-desk and billing functions.

  Duration            7 months

  Budget Band         €680K band

  Executive Sponsor   VP Revenue Cycle, Meridia Health Network
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Linked Change     
  Management          
  Project**           
  ------------------- ---------------------------------------------------
  Name                Meridia Care Access Automation Program

  Linkage             Linked to Main Project

  Change Manager      Change Manager, Meridia Care Access Program

  Target Population   \~350 front-desk and billing staff

  Bridges Transition  Neutral Zone at pilot facility; Ending phase at the
  Phase               other two

  Sentiment Snapshot  Exploration at pilot site; cautious Denial
  (Kübler-Ross)       elsewhere pending pilot results

  Sponsor Coalition   VP Revenue Cycle sponsoring; facility billing
  Status              managers form coalition; visibility rated Strong at
                      pilot site

  AI Use Cases        Sentiment & Emotion Classifier, Manager Coaching
  Activated (example) Script Generator, Resistance Root-Cause Classifier
  -----------------------------------------------------------------------

**ADKAR Baseline Snapshot**

  ------------------------------------------------------------------------
  **Building       **Score**   **Note**
  Block**                      
  ---------------- ----------- -------------------------------------------
  Awareness        4 / 5       Well communicated --- direct impact on
                               daily workflow

  Desire           3 / 5       Positive --- reduces repetitive manual data
                               entry

  Knowledge        3 / 5       Training curriculum in pilot at one
                               facility

  Ability          2 / 5       Awaiting payer-side system readiness to
                               practice end-to-end

  Reinforcement    1 / 5       Pre go-live
  ------------------------------------------------------------------------

**Key Risks**

-   Dependency on external payer-side systems outside Meridia\'s direct
    control

-   Patient-experience continuity must be protected during the
    transition window

-   Front-desk staffing is lean, leaving little slack for training time

**6.3.3 QMS Implementation --- \"JCI Accreditation & QMS Rollout\"**

  -----------------------------------------------------------------------
  **Main Project**    
  ------------------- ---------------------------------------------------
  Name                JCI Accreditation & QMS Rollout

  Type                QMS Implementation

  Scope               Implement a quality management system aligned to
                      JCI/ISO 13485 standards, including electronic
                      incident and near-miss reporting across all
                      clinical departments.

  Duration            13 months

  Budget Band         €1.1M band

  Executive Sponsor   Chief Medical Officer, Meridia Health Network
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Linked Change     
  Management          
  Project**           
  ------------------- ---------------------------------------------------
  Name                Meridia Clinical Quality Culture Program

  Linkage             Linked to Main Project

  Change Manager      Change Manager, Meridia Quality Program

  Target Population   \~1,500 clinical staff across all departments and 3
                      facilities

  Bridges Transition  Neutral Zone at lead facility; Ending phase at the
  Phase               other two

  Sentiment Snapshot  Resistance rooted in blame-culture fear, not tool
  (Kübler-Ross)       complexity

  Sponsor Coalition   CMO sponsoring directly --- strongest coalition of
  Status              the 9 seed cases; visibility rated Strong

  AI Use Cases        Training Gap-to-Curriculum Mapper, Regression Risk
  Activated (example) Predictor, Cohort Readiness Summarizer
  -----------------------------------------------------------------------

**ADKAR Baseline Snapshot**

  ------------------------------------------------------------------------
  **Building       **Score**   **Note**
  Block**                      
  ---------------- ----------- -------------------------------------------
  Awareness        4 / 5       Strong push tied to accreditation deadline

  Desire           2 / 5       Cultural resistance to reporting
                               near-misses --- fear of blame

  Knowledge        3 / 5       Department-level training underway

  Ability          2 / 5       Electronic reporting tool live in 1 of 3
                               facilities

  Reinforcement    1 / 5       Pre go-live at 2 of 3 facilities
  ------------------------------------------------------------------------

**Key Risks**

-   Clinical culture resistance to reporting near-misses --- the
    dominant barrier, not technology

-   Fixed accreditation deadline leaves limited schedule flexibility

-   Just-culture framing must be established before reporting rates will
    genuinely improve

**6.4 CR1 Transformation-Type Expansion Cases**

Five cases added to give each of the remaining five CR1 transformation types --- Cultural / Values Transformation, Business Process Reengineering, Operating Model Redesign, Compliance-Driven Change, and Training & Skills Development --- a real, working example alongside the nine original cases in Sections 6.1--6.3. Each follows the same Main Project + linked Change Management Project structure.

**6.4.1 Cultural / Values Transformation --- \"Safety-First Leadership Culture Program\" (Manufacturing)**

**Seeded Organization:** Atlas Industrial Group --- Casablanca Plant Cluster (see Section 6.1). This case reuses the culture-change Change Management Project already seeded there, now linked to a Main Project of the matching type.

  -----------------------------------------------------------------------
  **Main Project**    
  ------------------- ---------------------------------------------------
  Name                Safety-First Leadership Culture Program

  Type                Cultural / Values Transformation

  Scope               Shift the organization from compliance-driven to
                      leadership-driven safety behavior across all three
                      plants, led by CEO-level sponsorship rather than a
                      single underlying system rollout.

  Duration            12 months

  Budget Band         €310K band

  Executive Sponsor   CEO, Atlas Industrial Group
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Linked Change     
  Management          
  Project**           
  ------------------- ---------------------------------------------------
  Name                Atlas Safety-First Leadership Culture Program

  Linkage             Linked to Main Project

  Change Manager      Change Manager, Atlas Safety Culture Program

  Target Population   \~3,100 employees across all 3 plants and the
                      Shared Services Center (entire Atlas workforce)

  Bridges Transition  Neutral Zone across all 3 plants --- supervisors
  Phase               actively practicing new coaching behaviors, not yet
                      fully habitual

  Sentiment Snapshot  Exploration dominant among frontline supervisors
  (Kübler-Ross)       after visible plant-director safety walks; residual
                      skepticism among veteran shop-floor staff

  Sponsor Coalition   CEO personally sponsors --- the only Atlas
  Status              initiative with CEO-level (not COO/CFO/VP)
                      sponsorship; visibility rated Strong across all 3
                      plants

  AI Use Cases        Sponsor Coalition Recommender, Coaching
  Activated (example) Conversation Script Generator
  -----------------------------------------------------------------------

**ADKAR Baseline Snapshot**

  ------------------------------------------------------------------------
  **Building       **Score**   **Note**
  Block**                                                                 
  ---------------- ----------- -------------------------------------------
  Awareness        5 / 5       CEO pledge and plant-entrance signage make
                               this the most visible initiative at Atlas

  Desire           3 / 5       Frontline supervisors bought in after
                               visible leadership walks; veteran staff
                               cite fatigue from prior campaigns

  Knowledge        3 / 5       Safety-leadership coaching curriculum
                               rolled out to first cohort of supervisors

  Ability          3 / 5       Early cohort practicing coaching
                               conversations; not yet consistent across
                               all shifts

  Reinforcement    2 / 5       Recognition program not yet launched ---
                               coaching behavior not yet self-sustaining
  ------------------------------------------------------------------------

**Key Risks**

-   Veteran shop-floor staff skepticism from prior safety campaigns that
    faded after 6 months

-   Program depends heavily on CEO visibility --- risk if
    travel/priorities reduce CEO safety-walk cadence

-   Frontline supervisors already stretched across 3 plants; coaching time
    competes with production pressure

**6.4.2 Business Process Reengineering --- \"Order Fulfillment Clean-Slate Redesign\" (Logistics)**

**Seeded Organization:** Maghreb Logistics Hub (see Section 6.2).

  -----------------------------------------------------------------------
  **Main Project**    
  ------------------- ---------------------------------------------------
  Name                Order Fulfillment Clean-Slate Redesign

  Type                Business Process Reengineering

  Scope               Redesign the order-to-delivery process from a clean
                      slate --- collapsing a 9-handoff, cross-hub
                      fulfillment chain into a single accountable flow
                      --- rather than automating the existing process as-
                      is.

  Duration            10 months

  Budget Band         €1.1M band

  Executive Sponsor   COO, Maghreb Logistics Hub
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Linked Change     
  Management          
  Project**           
  ------------------- ---------------------------------------------------
  Name                Order Fulfillment Redesign Adoption Program

  Linkage             Linked to Main Project

  Change Manager      Change Manager, Order Fulfillment Redesign

  Target Population   \~340 dispatch, warehouse and customer-service
                      staff across 3 hubs whose roles are restructured
                      under the new single-accountable-owner flow

  Bridges Transition  Ending phase --- the redesign eliminates several
  Phase               existing roles as distinct positions, folding them
                      into a new \"fulfillment owner\" role

  Sentiment Snapshot  Denial/Resistance among staff whose current role is
  (Kübler-Ross)       folded into the new structure; Exploration among
                      hub supervisors who see fewer handoffs as a win

  Sponsor Coalition   COO personally chartered the redesign; hub
  Status              supervisors form the coalition but customer-service
                      team not yet represented

  AI Use Cases        None yet activated
  Activated (example) 
  -----------------------------------------------------------------------

**ADKAR Baseline Snapshot**

  ------------------------------------------------------------------------
  **Building       **Score**   **Note**
  Block**                                                                 
  ---------------- ----------- -------------------------------------------
  Awareness        3 / 5       Redesign announced; detailed role-mapping
                               not yet communicated individually

  Desire           2 / 5       Uncertainty about which staff land in the
                               new role versus which positions are
                               eliminated

  Knowledge        1 / 5       New process flow designed but not yet
                               trained

  Ability          1 / 5       Pilot hub not yet selected

  Reinforcement    1 / 5       Pre-pilot
  ------------------------------------------------------------------------

**Key Risks**

-   Clean-slate redesign eliminates several current job titles, creating
    higher anxiety than a like-for-like automation would

-   Customer-service team not yet engaged in the redesign despite being a
    downstream consumer of the new flow

**6.4.3 Operating Model Redesign --- \"Regional Hub Governance Redesign\" (Logistics)**

**Seeded Organization:** Maghreb Logistics Hub (see Section 6.2).

  -----------------------------------------------------------------------
  **Main Project**    
  ------------------- ---------------------------------------------------
  Name                Regional Hub Governance Redesign

  Type                Operating Model Redesign

  Scope               Redesign decision rights and reporting lines across
                      the 5 regional hubs, moving from hub-by-hub
                      autonomy to a standing regional operating committee
                      with clear escalation paths.

  Duration            9 months

  Budget Band         €540K band

  Executive Sponsor   CEO, Maghreb Logistics Hub
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Linked Change     
  Management          
  Project**           
  ------------------- ---------------------------------------------------
  Name                Regional Hub Governance Adoption Program

  Linkage             Linked to Main Project

  Change Manager      Change Manager, Regional Hub Governance

  Target Population   \~60 hub managers and regional functional leads
                      whose decision rights move to the new operating
                      committee

  Bridges Transition  Ending phase --- hub managers are losing a degree
  Phase               of local decision authority, the clearest identity-
                      loss signal in this program

  Sentiment Snapshot  Resistance concentrated among longest-tenured hub
  (Kübler-Ross)       managers; newer hub managers more open to the
                      shared cadence

  Sponsor Coalition   CEO personally chairs the new committee\'s first
  Status              three sessions to establish its authority;
                      visibility rated Strong

  AI Use Cases        None yet activated
  Activated (example) 
  -----------------------------------------------------------------------

**ADKAR Baseline Snapshot**

  ------------------------------------------------------------------------
  **Building       **Score**   **Note**
  Block**                                                                 
  ---------------- ----------- -------------------------------------------
  Awareness        4 / 5       CEO-led launch made the change highly
                               visible across all 5 hubs

  Desire           2 / 5       Longest-tenured hub managers see this as a
                               loss of autonomy held for years

  Knowledge        2 / 5       New escalation and decision-rights matrix
                               published but not yet exercised in a real
                               conflict

  Ability          1 / 5       Committee has not yet handled a live cross-
                               hub pricing conflict

  Reinforcement    1 / 5       Too early --- cadence not yet self-
                               sustaining
  ------------------------------------------------------------------------

**Key Risks**

-   New committee\'s authority depends on continued CEO visibility in its
    early sessions

-   Longest-tenured hub managers may route decisions around the committee
    rather than through it

**6.4.4 Compliance-Driven Change --- \"Cross-Border Patient Data Protection Compliance\" (Health)**

**Seeded Organization:** Meridia Health Network (see Section 6.3).

  -----------------------------------------------------------------------
  **Main Project**    
  ------------------- ---------------------------------------------------
  Name                Cross-Border Patient Data Protection Compliance

  Type                Compliance-Driven Change

  Scope               Bring patient-data handling into compliance with a
                      new cross-border health-data protection regulation
                      ahead of its enforcement date, including consent
                      workflows, data-residency controls and breach-
                      notification procedures.

  Duration            8 months

  Budget Band         €420K band

  Executive Sponsor   Chief Compliance Officer, Meridia Health Network
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Linked Change     
  Management          
  Project**           
  ------------------- ---------------------------------------------------
  Name                Data Protection Compliance Adoption Program

  Linkage             Linked to Main Project

  Change Manager      Change Manager, Data Protection Compliance Program

  Target Population   \~450 clinical and billing staff across all 3
                      facilities who handle patient data subject to the
                      new regulation

  Bridges Transition  Ending phase --- the prior, informal consent
  Phase               process is being formally retired ahead of the
                      enforcement date

  Sentiment Snapshot  Awareness high due to a fixed regulatory deadline;
  (Kübler-Ross)       Desire mixed --- some staff see it as \"more
                      paperwork\" rather than patient protection

  Sponsor Coalition   CCO sponsoring directly given the fixed regulatory
  Status              deadline; General Counsel co-chairs the steering
                      group; visibility rated Strong

  AI Use Cases        None yet activated
  Activated (example) 
  -----------------------------------------------------------------------

**ADKAR Baseline Snapshot**

  ------------------------------------------------------------------------
  **Building       **Score**   **Note**
  Block**                                                                 
  ---------------- ----------- -------------------------------------------
  Awareness        4 / 5       Fixed regulatory deadline made this highly
                               visible; department heads briefed directly
                               by CCO

  Desire           2 / 5       Some staff frame this as added
                               administrative burden rather than a
                               patient-protection improvement

  Knowledge        2 / 5       Regulation requirements mapped to workflow
                               changes; facility-level training not yet
                               started

  Ability          1 / 5       New consent workflow not yet piloted at any
                               facility

  Reinforcement    1 / 5       Pre-pilot
  ------------------------------------------------------------------------

**Key Risks**

-   Fixed regulatory enforcement date leaves no schedule slack if facility
    rollout slips

-   Staff may treat the new consent workflow as a check-box exercise
    rather than substantively changing behavior

**6.4.5 Training & Skills Development --- \"Frontline Digital Skills Certification Program\" (Manufacturing)**

**Seeded Organization:** Atlas Industrial Group --- Tangier Free Zone Plant, a second Organization under the Atlas Group (see Section 2.1), added to give Group-level roll-up a real second tenant alongside the Casablanca cluster.

  -----------------------------------------------------------------------
  **Main Project**    
  ------------------- ---------------------------------------------------
  Name                Frontline Digital Skills Certification Program

  Type                Training & Skills Development

  Scope               Close a digital-literacy gap on the plant floor
                      ahead of the ERP extension: certify all frontline
                      operators on core digital-device and data-entry
                      skills before any system-specific training begins.

  Duration            5 months

  Budget Band         €180K band

  Executive Sponsor   Plant Director, Tangier Free Zone
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Linked Change     
  Management          
  Project**           
  ------------------- ---------------------------------------------------
  Name                Tangier Frontline Digital Skills Program

  Linkage             Linked to Main Project

  Change Manager      Change Manager, Tangier Digital Skills Program

  Target Population   \~420 frontline plant operators at the Tangier Free
                      Zone site

  Bridges Transition  Ending phase --- operators moving from paper-only
  Phase               workflows to device-based ones for the first time

  Sentiment Snapshot  Denial among longer-tenured operators who have
  (Kübler-Ross)       never used a work device; Exploration among
                      younger, device-comfortable operators

  Sponsor Coalition   Plant Director sponsoring; shift supervisors form
  Status              the coalition but not yet visible on the floor
                      daily; visibility rated Moderate

  AI Use Cases        None yet activated
  Activated (example) 
  -----------------------------------------------------------------------

**ADKAR Baseline Snapshot**

  ------------------------------------------------------------------------
  **Building       **Score**   **Note**
  Block**                                                                 
  ---------------- ----------- -------------------------------------------
  Awareness        3 / 5       Floor walk introduced the program;
                               individual certification schedule not yet
                               communicated

  Desire           2 / 5       Longer-tenured operators worry that \"not
                               being good with devices\" will be held
                               against them

  Knowledge        1 / 5       Curriculum designed; first cohort not yet
                               started

  Ability          1 / 5       No practice devices on the floor yet

  Reinforcement    1 / 5       Pre-cohort
  ------------------------------------------------------------------------

**Key Risks**

-   Certification must complete before ERP-specific training can start,
    creating a hard sequencing dependency

-   Longer-tenured operators may perceive the certification as a proxy
    performance review rather than a skills investment

**7. Closing Notes**

The module set and hierarchy described here are designed to scale from a
single standalone Change Management Project run by one consultant, up to
a multi-organization Group portfolio managed by a central Center of
Excellence --- without changing the underlying data model. The next
steps typically involve confirming the RBAC role list against the
client\'s actual org design, finalizing the survey/pulse question bank
per module, and validating the seed cases above with real organization
data before go-live.
