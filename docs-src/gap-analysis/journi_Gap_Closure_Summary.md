**journi**

*the human side of change, mapped as a journey*

**Gap Closure Summary**

Response to Gap Analysis v2 --- Build Record

Prepared for POWERACT Consulting

Chief Innovation Officer --- Mounire

August 2026

**Table of Contents**

- [1. Purpose & Scope](#1-purpose--scope)
- [2. Closure Summary Table](#2-closure-summary-table)
- [3. Finding A --- E2E-01--04 Compositions (Fixed)](#3-finding-a--e2e-01-04-compositions-fixed)
- [4. Finding B --- 7 vs. 8 Transformation Types (Decision Recorded)](#4-finding-b--7-vs-8-transformation-types-decision-recorded)
- [5. Gaps Closed, By Deliverable](#5-gaps-closed-by-deliverable)
- [6. What Remains an Architectural Boundary, By Design](#6-what-remains-an-architectural-boundary-by-design)
- [7. Verification](#7-verification)
- [8. Closing Note](#8-closing-note)

*Updated after initial delivery: (1) module numbering across the entire
application was corrected to run 1--20 with no gap — the platform
previously jumped from Module 2 straight to Module 4, since Module 3 had
been reserved for localization but never built as its own page; every
module from the old Module 4 onward shifted down by one, and every module
reference in this document, the Functional Specification, and the
application itself was updated to match. (2) ALT-011 (Communication
Overload) was closed as a ninth live-computed alert, narrowing Gap 4.9.
Both changes are reflected throughout the sections below.*

## 1. Purpose & Scope

Gap Analysis v2 (delivered as `journi_Gap_Analysis_v2.docx`) identified
four findings (A--D) and ten categories of gap (4.1--4.10) against ten
source documents describing a larger hypothetical D01--D32k deliverable
framework. This document records what was subsequently built into the
journi application to close those gaps, what was deliberately left as a
documented architectural boundary, and how each closure was verified.
It is a build record, not a new analysis --- read alongside Gap Analysis
v2 rather than in place of it.

Every closure below shipped as a working feature in the application
(not documentation alone), was verified with `npm run build` and a
Playwright functional pass, and is committed to the
`claude/journi-app-build-bkuhih` branch.

## 2. Closure Summary Table

| Gap Analysis v2 Ref. | Item | Disposition | Where |
|---|---|---|---|
| Finding A | E2E-01--04 superseded compositions | **Fixed** | Module 18, `e2eProcesses.js` |
| Finding B | 7 vs. 8 transformation types | **Decision recorded** --- kept 8 | Module 18 |
| Finding C | RACSI vs. RASCI naming | Not actioned --- cosmetic, source-document inconsistency | --- |
| Finding D | Solution Architecture deck's stale "15 requirements" count | Not actioned --- source-document currency issue, not a journi gap | --- |
| Gap 4.1 (E2E RACSI) | Per-chain RACSI on core E2E chains | **Closed** | Module 18 |
| Gap 4.2 (Cross-Type Matrix) | 8-type side-by-side comparison | **Closed** | Module 14 |
| Gap 4.3 (WBS refinements) | Accountability tag, P1--P7 phase filter | **Closed** | Module 17 |
| Gap 4.4 (Phase Gate/Checklist) | Selectable Accountable role, weighted checklist items | **Closed** | Module 17 |
| Gap 4.5 (REX log) | Lesson-to-Rule/Control/Charter closure field | **Closed** | Module 12 |
| Gap 4.6 (Charter Registry) | D31 charters, action mapping, mentoring model | **Closed** | Module 19 (new) |
| Gap 4.6 (Journeys/Analytics) | D27/D28/D29 journeys, touchpoints, dashboards | **Closed** | Module 20 (new) |
| Gap 4.6 (Context Overlay) | D24 project-context overlay | **Closed** (reference) | Module 20 |
| Gap 4.7 (Coding Workbench) | D32k codebook, tagging, frequency rollup | **Closed** | Module 10 |
| Gap 4.8 (NLP Theme-Mining Engine) | D32j backend NLP engine | **Architectural boundary** | Section 6 |
| Gap 4.9 (Alerts/D07) | Sixteen alert conditions, in-app delivery | **Partially closed** --- 9 of 16 live-computed | Notification Center (new) |
| Gap 4.10 (Reporting export/D08) | Server-side Excel/PDF export | **Partially closed** --- client-side CSV | M7, M8, M9, M13, M14 |

## 3. Finding A --- E2E-01--04 Compositions (Fixed)

D32h's "Corrected" macro-process compositions, names, triggers,
terminal-states and RACSI for the four core End-to-End chains ---
sourced verbatim from Framework Interaction Map v2.3 §11 --- superseded
what journi's `e2eProcesses.js` carried from the original Process
Catalogue and CR1 addendum. This was an unambiguous data correction, not
a judgment call, and has been applied outright:

- **E2E-01** renamed "Readiness & Mobilization (Awareness →
  Launch-Readiness)", composition corrected to MP-01→02→03→06→07
- **E2E-02** renamed "Capability & Divergence Management (Training →
  Verified Competence)", composition corrected to MP-05→08→07
- **E2E-03** renamed "Resistance-to-Commitment (Barrier Detection →
  Buy-In)", composition corrected to MP-04→06→07→09
- **E2E-04** renamed "Adoption-to-Sustainment (Go-Live → Refreeze)",
  composition corrected to MP-09→10→07

Each chain now also carries its D32h-specified RACSI, rendered in
Module 18's E2E Process Registry tab.

## 4. Finding B --- 7 vs. 8 Transformation Types (Decision Recorded)

Five sources (D21 Project Registry, D32b Phase Template Library, D32i
Cross-Type Matrix, the Transformation Types User Guide, and the
Solution Architecture deck) describe 7 transformation types with no
Training & Skills Development archetype; CR1 and the End-to-End Process
Catalogue describe 8, including it. This is a genuine cross-document
conflict, not a data-entry error, and Gap Analysis v2 flagged it for a
decision rather than resolving it unilaterally.

**Decision:** journi keeps all 8 types, per the explicit "implement CR1
fully" directive given earlier in this engagement. The
Training & Skills Development archetype (`TPL-TSD-7`, `E2E-TSD`) is
retained across Module 17's Phase Template picker, Module 18's E2E
Registry, and the seed dataset's fifth CR1 expansion case. Where a
newly-built feature transcribes a 7-type source table verbatim (Module 14's Cross-Type Comparison Matrix, sourced from D32i), the 8th
Training & Skills Development row is explicitly marked in the data file
as an extension beyond the source, not a transcribed source value ---
so the conflict stays visible in the app's own data rather than being
silently smoothed over in either direction.

## 5. Gaps Closed, By Deliverable

**Module 18 --- Macro Process, SIPOC, RACSI & End-to-End Registry.**
Per-chain RACSI added to the four core E2E chains (Finding A/Gap 4.1).

**Module 14 --- Metrics & Analytics Dashboard.** New Cross-Type
Comparison Matrix tab: all eight transformation types compared on
typical duration, terminal gate, external-party involvement, dominant
framework and reversibility, each linked to a seed-project example
(Gap 4.2). CSV export added to the readiness heatmap and benchmarking
tables (Gap 4.10).

**Module 17 --- Work Breakdown Structure & Gantt.** A task's delivery
track (Project/Change/Framework) and its accountability tag
(Project/Change/Joint) are now two distinct fields, matching D32a's WBS
task schema (Gap 4.3). A generic P1--P7 lifecycle-phase filter applies
across WBS tasks, Phase Checklist items and Phase Gates, mapped from
every type-specific Phase Template's own labels (Gap 4.3). Phase
Checklist items carry a configurable weight, and phase completion is
now a weighted average rather than an equal-weight item count (D32c,
Gap 4.4). The Phase Gate's Joint Decision Record Accountable role is now
selectable from the RACSI role-code list rather than hardcoded to the
Project Manager, matching D32e's "may differ from either input's
author" rule (Gap 4.4).

**Module 12 --- Reinforcement & Sustainment.** Each lesson-learned entry
now carries a linked Rule/Control/Charter field and an Applied/Pending
status, so a lesson only "closes the loop" once it names what now
encodes it, per D25's REX Institutionalization Log model (Gap 4.5).

**Module 19 --- Change Management Charter Registry (new module).** All
eight D31 charters (Sponsorship/Leadership through Pulse/Interview) with
their full What/Who/When/Where/Why/How and RACSI; the full 34-row
Charter Action Mapping (D31a) linked to macro processes, tasks and
lifecycle phases; the three-stage Mentoring Progression model (D31c:
Trainee → Observer → Autonomous) with entry/exit criteria and a
regression path that returns a mentee one stage rather than restarting;
and a per-project compliance log letting a Change Manager record
completion of a specific charter action against their project (Gap
4.6).

**Module 20 --- Stakeholder Journeys, Touchpoints & Analytics (new
module).** All eight D27 journeys (End User Adoption, Executive
Sponsor, Frontline Supervisor, Champion, Mentee, Divergence Case, QMS
Certification, AI Suggestion Lifecycle); the 24 D28 touchpoints across
the five most fully detailed journeys with auditable success criteria
and evidence, plus a per-project touchpoint-completion log; the five
D29 Journey Analytics dashboards, two of which (End User Journey
Completion, Sponsor & Charter Compliance) compute a live percentage
from the project's own logs rather than showing only a static
description; and the D24 Project Context Overlay, shown as the source
framework's own illustrative reference set (Gap 4.6).

**Module 10 --- Resistance Management.** New Coding Workbench tab: an
Organization-scoped, Change-Manager-editable codebook (D32k QCW-01);
tagging of coaching notes and resistance-log entries against that
codebook (QCW-02), with an optional cross-reference from a tagged note
to an existing Resistance Log barrier (QCW-04); and a code-frequency
rollup surfacing recurring themes across a project's tagged material
(QCW-03) (Gap 4.7).

**Notification Center (new, top-bar bell icon).** All sixteen D07 alert
definitions catalogued; nine --- Divergence Pattern, Regression Risk
Critical, Sponsor Coverage Gap, Resistance Escalation Threshold, Change
Saturation Threshold, Communication Overload, Phase Gate No-Go/Conditional,
Guiding Coalition Gap, and Sustainment Sign-Off Blocked --- fire live from
data journi already holds, with severity, SLA threshold and recipient-role
shown per alert, and per-project dismissal that persists across reloads
(Gap 4.9, see Section 6 for why the remaining seven do not fire).

**CSV Export (Modules 8, 9, 10, 14, 15).** Client-side CSV export
(UTF-8 byte-order mark, so accented French/Arabic content opens
correctly in Excel) on the Sponsor Coalition roster, Communications
log, Training & Certification table, Risk Register, and the Analytics
readiness heatmap and benchmarking tables (Gap 4.10).

## 6. What Remains an Architectural Boundary, By Design

journi has no backend; the items below require platform-level
infrastructure a production backend would provide, and cannot be
proportionately absorbed into a client-side-only reference build
without one. Each is documented at its relevant module rather than
silently omitted:

- **Server-side persistence, multi-device access, backups.** journi's
  data layer is browser localStorage. Documented in §2.4 of the
  Functional Specification since before this build wave; unchanged by
  it.
- **A BPMN/DMN workflow-execution engine.** Module 18 makes the process
  model (Macro Processes, End-to-End chains, business rules) browsable
  as data; it does not execute it as an orchestrated process.
- **A COSO-aligned control-testing framework.** Module 13's risk
  register and the platform-wide justification-log audit trail record
  the human judgment a control-testing program would draw on; they do
  not run a sampling/evidencing control-testing program.
- **Real outbound alert delivery** (D07's email, push notification and
  Teams channels). The Notification Center is the client-side
  equivalent --- computed live, shown in-app --- but nothing is
  actually sent from journi, since there is no backend to send from.
  Six of D07's sixteen alerts additionally depend on infrastructure
  this build doesn't have at all (a real request-tracking system for
  GDPR SLAs, auth lock-out state, import-pipeline integrity checks) and
  never fire, by the same logic. A seventh, Champion Coverage Below
  Target, is excluded for a different reason: journi has no structured
  champion-tracking data model to compute a genuine signal against, so
  it isn't a backend gap so much as a data model this build doesn't
  carry.
- **A purpose-built NLP embeddings backend** (D32j). Module 16's AI Use
  Case Library and Module 10's Coding Workbench run against a
  deterministic built-in generator or, if configured, a real third-party
  LLM provider called directly from the browser --- neither is a
  dedicated embeddings/theme-mining service operating at the scale D32j
  describes.
- **Real enterprise SSO (SAML/OIDC).** Named as an optional capability
  for larger deployments in §3.3 of the Functional Specification; not
  implemented in this reference build, which uses journi's own
  role/scope login.

None of these are silently dropped: each is named in the Functional
Specification (§2.4, §2.6) and, where a feature touches it directly,
in that feature's own section, so a reader always knows whether a given
capability is real or a documented placeholder.

## 7. Verification

Every change in this closure wave was verified the same way:

- `npm run build` --- a clean production build after every unit of work,
  with no new errors (the one pre-existing "chunk larger than 500kB"
  bundling warning is unrelated to correctness and predates this wave)
- A Playwright functional pass exercising the new UI directly ---
  navigating to the affected module, exercising its write actions
  (logging a charter action, tagging a note, dismissing an alert,
  exporting a CSV, filtering by phase), and confirming zero browser
  console errors
- A final full-application smoke test across all eighteen non-admin
  module routes as a Change Manager, and the two admin-only routes
  (Module 1, Module 2) plus the Portfolio Dashboard as a Super Admin,
  confirming zero console errors platform-wide before this zip was cut

## 8. Closing Note

Gap Analysis v2 identified ten categories of gap against a much larger
hypothetical server-backed platform than journi's actual client-side
application. This wave closed every gap that could be proportionately
built as a client-side feature --- nine of ten categories, in whole or
substantial part --- and left the remainder as a transparently
documented architectural boundary rather than an unstated omission. The
application zip accompanying this document (`journi_app.zip`) contains
every change described above, and the Functional Specification
(`journi_Functional_Spec.docx`/`.pdf`) has been regenerated to document
all of it as part of the platform's permanent record, not just this
summary.
