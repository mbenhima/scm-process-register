# Process Design and End-to-End Processes: version 5.0 -> 6.0, aligned with CortexSkills 1.15.0.
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ox import *
from xml.sax.saxutils import escape as E

d = Doc(sys.argv[1])
T = lambda old, new, n=1: d.sub1(E(old), E(new), n)

# ---- cover and revision history
T('CORTEXSKILLS · PROCESS ARCHITECTURE · VERSION 5.0', 'CORTEXSKILLS · PROCESS ARCHITECTURE · VERSION 6.0')
T('Version 5.0  ·  28 September 2026', 'Version 6.0  ·  16 October 2026')
d.add_row('CR1 — Scope of Work &amp; Questionnaire Management: MP-53 and MP-54 (fifth family)', [
    '6.0', '16 October 2026',
    'Aligned with CortexSkills release 1.15.0. Questionnaire channels are now Face-to-Face, Email, WhatsApp, Application and '
    'Combination (replacing Hybrid and Custom); respondent populations (DG, Management, Member) with a default channel plan each; '
    'assignment of sections, sub-sections and questions to respondents added to UFT-33-04; new Section 9 on how the application runs '
    'the architecture (catalog baseline, phases and gates, SME tracks, step execution, questionnaire campaign, administration and '
    'licensing). Macro processes, end-to-end processes, tasks and RACSI are unchanged.'])

# ---- reader guide
d.add_row('Proof that every macro process is covered', [
    '9  Implementation in CortexSkills 1.15.0', 'How the application runs this architecture: catalog, phases and gates, SME tracks, steps, questionnaires, administration',
    'Configure or run a project in the application'])
d.add_row('The thematic lens of an engagement and its questionnaires', [
    'Population', 'The respondent group a questionnaire form is written for: DG (top management), Management or Member (staff). Each population has its own form and default channel plan.'])
d.add_row('The respondent group a questionnaire form is written for', [
    'Channel plan', 'The ordered contacts planned for one respondent — invitation, reminders and, if needed, a face-to-face interview — each on a channel (Face-to-Face, Email, WhatsApp, Application) after a set number of days.'])
d.add_row('The ordered contacts planned for one respondent', [
    'Assignment', 'The sections, sub-sections or questions given to named respondents. An assigned element is shown only to its respondents; an element left unassigned is shown to every respondent of the population.'])

# ---- executive summary
d.insert_after('Version 5.0 consolidates all previous versions', para(
    'Version 6.0 keeps this architecture unchanged and aligns the document with CortexSkills release 1.15.0: the questionnaire channels '
    'and populations used by the application, the assignment of questions to respondents, and a new Section 9 that describes how the '
    'application runs the architecture.'))

# ---- glossary
d.add_row('>Taux de réponse<', ['Affectation des questions', 'Question assignment'])
d.add_row('>Affectation des questions<', ['Plan de canaux', 'Channel plan'])
d.add_row('>Plan de canaux<', ['Direction Générale (DG) / Encadrement / Collaborateur', 'Top management (DG) / Management / Member — the respondent populations'])

# ---- MP-54 SIPOC, E2E-33 and final declaration
T('channel configuration (Face-to-Face, Email, Hybrid, Custom)', 'channel configuration (Face-to-Face, Email, WhatsApp, Application, Combination), respondent populations (DG, Management, Member)')
i = d.x.find('> Tailor to sector and focus</w:t>'); j = d.x.find('<w:t xml:space="preserve"> Allocate RACSI</w:t>', i); assert 0 < i < j < i + 1200
d.x = d.x[:j] + '<w:t xml:space="preserve"> Allocate RACSI and assign questions to respondents</w:t>' + d.x[j + len('<w:t xml:space="preserve"> Allocate RACSI</w:t>'):]
T('RACSI allocation per section, distribution log per channel', 'RACSI allocation per section, respondent assignment per section, sub-section or question, distribution log per channel')
T('RACSI roles are allocated to each section, with exactly one Accountable. The questionnaire is then distributed through the channels each stakeholder uses (Face-to-Face, Email, Hybrid or Custom), reminders follow a per-channel cadence',
  'RACSI roles are allocated to each section, with exactly one Accountable, and sections, sub-sections or single questions can be assigned to one or more respondents. The questionnaire is then distributed through the channel plan of each respondent (Face-to-Face, Email, WhatsApp, the Application, or a Combination played in sequence), reminders follow a per-channel cadence')
T('Assign R/A/C/S/I per section, with exactly one Accountable.', 'Assign R/A/C/S/I per section, with exactly one Accountable; assign sections, sub-sections or questions to one or more respondents.')
T('Choose Face-to-Face, Email, Hybrid or Custom per stakeholder segment.', 'Choose Face-to-Face, Email, WhatsApp, Application or a Combination per respondent population (DG, Management, Member).')
T('multi-channel distribution (Face-to-Face, Email, Hybrid, Custom)', 'assignment of questions to respondents, multi-channel distribution (Face-to-Face, Email, WhatsApp, Application, Combination)')

# ---- Section 9
S = []
S += [pagebreak(), label('SECTION 9'), h(1, '9.  Implementation in CortexSkills 1.15.0'),
      para('This section describes how CortexSkills release 1.15.0 runs the architecture defined above. The application loads the full '
           'repository — macro processes, tasks, steps, end-to-end processes and their user-facing tasks, RACSI and BPMN flows — and runs '
           'each project through it, in English, French and Arabic.')]
S += [h(2, '9.1  Repository Loaded in the Application'),
      table(['Element', 'In the application', 'Note'], [
          ['Macro processes', '54', '52 business macro processes (this document) + MP-51 Platform Configuration & Licensing and MP-52 Compliance & Security Standards (administration)'],
          ['Tasks / steps', '180 / 407', 'Every step carries its type (User Task, Service Task…), role and description'],
          ['End-to-end processes', '33 + 6 composites', 'With user-facing tasks, RACSI, inputs and outputs, as in Section 7'],
          ['Modules', '55', 'M00 Platform Shell to M54 Questionnaire Studio, including M51 and M52'],
          ['Business rules / actions', '89 / 75', 'Routing, validation and notification rules triggered by steps'],
          ['Controls / risks', '88 / 35', 'Controls mapped to COSO components; risks with inherent and residual scores'],
          ['KPIs / alerts / reports', '61 / 45 / 34', 'Including RPT-001 Training Engineering Report'],
          ['Object classes / attributes', '72 / 378', 'The data model behind the step forms'],
          ['AI use cases', '36', 'Each with its linked step, risk level and human-in-the-loop checkpoint'],
          ['Sectors (verticals)', '29', 'Sector-specific chains, checklists and question banks, plus the SME offer'],
          ['Glossary', '51 terms', 'French-English glossary of Section 3'],
      ], [2600, 1900, 5246]),
      caption('Table 9.1 — Repository content loaded by CortexSkills 1.15.0.')]
S += [h(2, '9.2  Phases and Gates'),
      para('A project follows six phases, each closed by a gate approved by its approvers against a checklist. Phase 0 groups the enablers, '
           'which run across all phases.'),
      table(['Phase', 'End-to-end processes', 'Closing gate'], [
          ['0  Enablers (all phases)', 'E2E-15, E2E-17, E2E-18', '—'],
          ['1  Scope & evidence', 'E2E-32, E2E-33, E2E-19, E2E-24', 'G1 — Scope & evidence approved'],
          ['2  Diagnosis', 'E2E-20, E2E-25, E2E-26, E2E-27, E2E-28, E2E-29, E2E-02, E2E-21', 'G2 — Diagnostic validated'],
          ['3  Training Engineering Report & plan', 'E2E-01, E2E-03, E2E-30, E2E-22, E2E-23, E2E-16', 'G3 — Report & roadmap approved'],
          ['4  Design & delivery', 'E2E-04, E2E-05, E2E-06, E2E-13, E2E-14', 'G4 — Delivery readiness'],
          ['5  Evaluation, compliance & impact', 'E2E-07, E2E-08, E2E-09', 'G5 — Evaluation & impact validated'],
          ['6  Talent, knowledge & continuous improvement', 'E2E-10, E2E-11, E2E-12, E2E-31', 'G6 — Closure & continuous improvement'],
      ], [3100, 3846, 2800]),
      caption('Table 9.2 — Phases, the end-to-end processes they run, and their gates.')]
S += [h(2, '9.3  SME Tracks'),
      para('Small and medium enterprises run a shorter path: fewer gates, fewer checklist items per gate and a target duration. The track is '
           'chosen from the size of the enterprise.'),
      table(['Track', 'Segment', 'Gates', 'Items per gate', 'Target duration'], [
          ['SME-T1 Essential', 'Micro (1–10 employees)', 'G1, G3, G6', '3', 'About 30 days'],
          ['SME-T2 Standard', 'Small (10–50 employees)', 'G1, G3, G5, G6', '4', 'About 60 days'],
          ['SME-T3 Advanced', 'Medium (50–250 employees)', 'G1 to G6', '5', 'About 90 days'],
      ], [2300, 2546, 1900, 1400, 1600]),
      caption('Table 9.3 — SME tracks.')]
S += [h(2, '9.4  How a Step Runs'),
      bullet([('Typed step forms. ', True), ('Each step opens a form chosen by its meaning (scope frame, sector, decision levels, stakeholders, competency framework, gaps, budget, sessions, evaluations…). The form works on the project’s own records, not on free text.', False)]),
      bullet([('Three ways to fill a step. ', True), ('Manual entry or paste of a table, a template from the library, or an AI proposal. Every AI proposal is reviewed and validated by a person before it is saved.', False)]),
      bullet([('Completion on evidence. ', True), ('A step that produces a result (a questionnaire, a dispatch, a consolidated dataset) is complete only when that result exists.', False)]),
      bullet([('Hand-over. ', True), ('When a step is completed, the owner of the next step is notified. Enabler processes start when their start condition is met.', False)]),
      bullet([('Multi-record entry. ', True), ('Tables can be pasted from a spreadsheet, previewed, applied and undone; a full-screen workspace is available for large tables.', False)]),
      bullet([('Real flow. ', True), ('E2E-01 (plan), E2E-02 (skills diagnosis), E2E-05 (delivery), E2E-07 (evaluation), E2E-32 (scope) and E2E-33 (questionnaires) run on real records end to end.', False)])]
S += [h(2, '9.5  Questionnaire Campaign (E2E-32 and E2E-33)'),
      table(['User-facing task', 'What the application does'], [
          ['UFT-32-06 Identify stakeholders', 'The stakeholders entered become the Stakeholder records the questionnaire is sent to, each with a population (DG, Management or Member), an e-mail address and a phone number.'],
          ['UFT-33-01 Select questionnaire template', 'Creates the project questionnaire from the chosen templates, one form per population.'],
          ['UFT-33-02 / 33-03 Elaborate, tailor and validate', 'Questions are loaded from a template, proposed by AI or written manually. Distribution is blocked while an AI question is not validated.'],
          ['UFT-33-04 Allocate RACSI and assign questions', 'RACSI per section, with exactly one Accountable. Sections, sub-sections or single questions can be assigned to one or more respondents in three ways: tick respondents element by element, paste a table (element, respondents), or accept an automatic proposal built from each respondent’s role and function.'],
          ['UFT-33-05 Select distribution channels', 'A channel plan per respondent: one channel (Face-to-Face, Email, WhatsApp, Application) or a Combination played in sequence. Defaults: DG — e-mail then interview; Management — e-mail, reminder, interview; Member — WhatsApp or e-mail, reminders, then interview.'],
          ['UFT-33-06 / 33-07 Distribute and remind', 'Each invitation and reminder is logged with its status. Failed messages are retried on the same channel. Without e-mail or WhatsApp settings, messages are composed and kept in the outbox (sandbox mode).'],
          ['UFT-33-08 Collect responses', 'Respondents answer on a personal response page, which shows only the elements assigned to them. Face-to-face answers can be captured later and synchronised.'],
          ['UFT-33-09 to 33-12 Validate, consolidate, release, report', 'Completeness and consent are checked, responses are consolidated and released to E2E-03, E2E-20 and E2E-27; response rates are reported by channel and population.'],
      ], [3100, 6646]),
      caption('Table 9.5 — How the application implements the scope and questionnaire tasks.'),
      callout('Checks before distribution', 'Distribution is refused while one of these is true: an AI question is not validated, a section has no Accountable or more than '
              'one, the questionnaire has no respondent or no due date, or a respondent named in the assignment receives no question. A missing e-mail '
              'address or phone number, and an assignment to a person who is no longer a respondent, are reported as warnings.')]
S += [h(2, '9.6  Administration: MP-51 and MP-52'),
      table(['Macro process', 'In the application'], [
          ['MP-51 Platform Configuration & Licensing (M51)', 'Organization settings, users and roles, channels, currencies and backups. In an on-premises installation the plan, the number of users and the add-ons come from a licence file signed by POWERACT and cannot be changed locally.'],
          ['MP-52 Compliance & Security Standards (M52)', 'Standards switched on one by one, independently of the pack: GDPR, ISO/IEC 27001, SOC 2, ISO/IEC 27701, ISO 9001 and Law 09-08 (CNDP, Morocco). Switching a standard on requires accepting its disclosure and adds its controls to the control register.'],
      ], [3100, 6646]),
      caption('Table 9.6 — The two administrative macro processes as implemented.')]
d.insert_before('— End of Document —', ''.join(S))
# the end marker stays last: move "This is the complete..." sentence? It stays in 8.5, before Section 9 — keep the closing line after Section 9.

d.add_toc([(1, '9. Implementation in CortexSkills 1.15.0'), (1, '9.1 Repository Loaded in the Application'), (1, '9.2 Phases and Gates'),
           (1, '9.3 SME Tracks'), (1, '9.4 How a Step Runs'), (1, '9.5 Questionnaire Campaign (E2E-32 and E2E-33)'), (1, '9.6 Administration: MP-51 and MP-52')])
i = d.x.find('<w:t>Confidential  ·  Page  of</w:t>')
if i > 0:
    a = d.x.rfind('<w:p>', 0, i); b = d.x.find('</w:p>', i) + 6; d.x = d.x[:a] + d.x[b:]
d.save()
print('ok')
