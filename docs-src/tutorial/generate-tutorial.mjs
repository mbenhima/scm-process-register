import fs from 'fs'
import path from 'path'
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  ImageRun, PageBreak, WidthType, AlignmentType, BorderStyle,
  ShadingType, VerticalAlign, Header, Footer, PageNumber, PageOrientation,
} from 'docx'
import { KPI_SECTIONS, BENCHMARK_SECTION, FRAMEWORK_OVERVIEWS, FRAMEWORK_DECISION_CRITERIA, PRE_ACTION_GUIDANCE } from './content.mjs'
import { TUTORIAL_PHASES, RACSI_ROLES } from './steps-tutorial.mjs'

const SHOTS = path.join(process.cwd(), 'shots')
const BRAND = '1F4B45' // deep teal, matches the app's brand-950-ish tone
const BRAND_LIGHT = 'EAF3F1'
const SAND = 'B8925A'
const CM_TEAL = '3F827B'
const FRAMEWORK_PURPLE = '7C5CBF'

function img(name, widthPx = 620, nativeWidthPx = 1440, nativeHeightPx = 900) {
  const file = path.join(SHOTS, name)
  const buf = fs.readFileSync(file)
  const scale = widthPx / nativeWidthPx
  return new ImageRun({ data: buf, transformation: { width: widthPx, height: Math.round(nativeHeightPx * scale) }, type: 'png' })
}

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 }, children: [new TextRun({ text, bold: true, color: BRAND })] })
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 }, children: [new TextRun({ text, bold: true, color: BRAND })] })
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 }, children: [new TextRun({ text, bold: true })] })
}
function p(text, opts = {}) {
  return new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text, ...opts })] })
}
function bullet(text, level = 0) {
  return new Paragraph({ bullet: { level }, spacing: { after: 80 }, children: [new TextRun({ text })] })
}
function wbsLine(text, level, opts = {}) {
  return new Paragraph({ bullet: { level }, spacing: { after: 60 }, children: [new TextRun({ text, ...opts })] })
}
function calloutBox(label, text, color = BRAND) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color },
      bottom: { style: BorderStyle.SINGLE, size: 4, color },
      left: { style: BorderStyle.SINGLE, size: 4, color },
      right: { style: BorderStyle.SINGLE, size: 4, color },
      insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: BRAND_LIGHT },
            margins: { top: 150, bottom: 150, left: 200, right: 200 },
            children: [
              new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: label, bold: true, color })] }),
              new Paragraph({ children: [new TextRun({ text })] }),
            ],
          }),
        ],
      }),
    ],
  })
}
function screenshotBlock(caption, filename, widthPx = 620) {
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, children: [img(filename, widthPx)] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: caption, italics: true, size: 18, color: '666666' })] }),
  ]
}
function stepTable(step, idx) {
  const rows = [
    new TableRow({ children: [
      new TableCell({ width: { size: 22, type: WidthType.PERCENTAGE }, shading: { fill: BRAND_LIGHT }, children: [p('Module / Screen', { bold: true, size: 20 })] }),
      new TableCell({ width: { size: 78, type: WidthType.PERCENTAGE }, children: [p(step.module, { size: 20 })] }),
    ]}),
    new TableRow({ children: [
      new TableCell({ shading: { fill: BRAND_LIGHT }, children: [p('User Input / Action', { bold: true, size: 20 })] }),
      new TableCell({ children: [p(step.userInput, { size: 20 })] }),
    ]}),
    new TableRow({ children: [
      new TableCell({ shading: { fill: BRAND_LIGHT }, children: [p('Expected Result', { bold: true, size: 20 })] }),
      new TableCell({ children: [p(step.expectedResult, { size: 20 })] }),
    ]}),
  ]
  const out = [h3(`Step ${idx + 1} — ${step.action}`)]
  if (step.before && step.before.length) {
    out.push(calloutBox('Before you do this', step.before.join(' '), SAND))
    out.push(new Paragraph({ spacing: { after: 120 }, children: [] }))
  }
  out.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }))
  if (step.screenshot) out.push(...screenshotBlock(`${step.module} — ${step.action}`, step.screenshot))
  return out
}

function frameworkBadgeTable(j) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [
        new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, shading: { fill: BRAND_LIGHT }, children: [p('Lewin', { bold: true, size: 20 })] }),
        new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, shading: { fill: BRAND_LIGHT }, children: [p('Prosci', { bold: true, size: 20 })] }),
        new TableCell({ width: { size: 34, type: WidthType.PERCENTAGE }, shading: { fill: BRAND_LIGHT }, children: [p('Bridges', { bold: true, size: 20 })] }),
      ]}),
      new TableRow({ children: [
        new TableCell({ children: [p(j.lewin, { size: 20 })] }),
        new TableCell({ children: [p(j.prosci, { size: 20 })] }),
        new TableCell({ children: [p(j.bridges, { size: 20 })] }),
      ]}),
    ],
  })
}

// SIPOC: five labeled rows, Suppliers/Inputs/Process/Outputs/Customers.
function sipocTable(sipoc) {
  const fields = [
    ['Suppliers', sipoc.suppliers],
    ['Inputs', sipoc.inputs],
    ['Process', Array.isArray(sipoc.process) ? sipoc.process.join(' → ') : sipoc.process],
    ['Outputs', sipoc.outputs],
    ['Customers', sipoc.customers],
  ]
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: fields.map(([label, value]) =>
      new TableRow({ children: [
        new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, shading: { fill: BRAND_LIGHT }, children: [p(label, { bold: true, size: 19 })] }),
        new TableCell({ width: { size: 82, type: WidthType.PERCENTAGE }, children: [p(value, { size: 19 })] }),
      ]}),
    ),
  })
}

// RACSI: roles down the rows, R/A/C/S/I across the columns, a dot marking
// which letter(s) apply — journi's own governance model deliberately
// transposed this way (Section 3.3 explains why) rather than the more
// common roles-as-columns layout.
const RACSI_LETTERS = ['R', 'A', 'C', 'S', 'I']
function racsiTable(racsi, color) {
  const header = new TableRow({
    children: [
      new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, shading: { fill: color }, children: [p('Role', { bold: true, size: 19, color: 'FFFFFF' })] }),
      ...RACSI_LETTERS.map((l) => new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE }, shading: { fill: color }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: l, bold: true, size: 19, color: 'FFFFFF' })] })] })),
    ],
  })
  const rows = RACSI_ROLES.map((role) => {
    const code = (racsi[role.key] || '').split('/').map((s) => s.trim()).filter(Boolean)
    return new TableRow({
      children: [
        new TableCell({ children: [p(role.label, { size: 19 })] }),
        ...RACSI_LETTERS.map((l) =>
          new TableCell({
            shading: code.includes(l) ? { fill: BRAND_LIGHT } : undefined,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: code.includes(l) ? '●' : '', bold: true, color: BRAND, size: 19 })] })],
          }),
        ),
      ],
    })
  })
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [header, ...rows] })
}

function taskBlock(task, color) {
  const out = [
    h3(`${task.id} — ${task.name}`),
    p('SIPOC', { bold: true, size: 21, color }),
    sipocTable(task.sipoc),
    new Paragraph({ spacing: { after: 120 }, children: [] }),
    p('RACSI', { bold: true, size: 21, color }),
    racsiTable(task.racsi, color),
    new Paragraph({ spacing: { after: 160 }, children: [] }),
  ]
  task.steps.forEach((step, idx) => out.push(...stepTable(step, idx)))
  return out
}

function frameworkUpdateBlock(fu) {
  return [
    h2('Framework Update & Justification'),
    frameworkBadgeTable(fu),
    new Paragraph({ spacing: { before: 120, after: 100 }, children: [] }),
    p(fu.justification),
  ]
}

function checklistBlock(checklist) {
  const isGo = /^GO\b/.test(checklist.decision) && !checklist.decision.includes('NO-GO')
  const isConditional = checklist.decision.includes('if')
  const color = isConditional ? SAND : isGo ? '2F6B64' : 'B5533C'
  return [
    h2('Change Management Phase Exit Checklist'),
    ...checklist.items.map((item) => bullet(`☐ ${item}`)),
    new Paragraph({ spacing: { before: 100, after: 100 }, children: [] }),
    calloutBox('Decision', checklist.decision, color),
  ]
}

function phaseSection(phase) {
  const out = [
    new Paragraph({ children: [new PageBreak()] }),
    h1(`${phase.id} — ${phase.name}`),
    h2('Goals'),
    ...phase.goals.map(bullet),
  ]
  if (phase.pmTasks.length) {
    out.push(h2('Project Management Tasks'))
    phase.pmTasks.forEach((t) => out.push(...taskBlock(t, SAND)))
  }
  if (phase.cmTasks.length) {
    out.push(h2('Change Management Tasks'))
    phase.cmTasks.forEach((t) => out.push(...taskBlock(t, CM_TEAL)))
  }
  out.push(...frameworkUpdateBlock(phase.frameworkUpdate))
  out.push(...checklistBlock(phase.exitChecklist))
  return out
}

function kpiSection(k) {
  return [
    h3(k.name),
    p(k.module, { italics: true, size: 20, color: '666666' }),
    p('Inputs', { bold: true }),
    ...k.inputs.map(bullet),
    p('Formula', { bold: true }),
    ...k.formula.map((f) => new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: f, font: 'Consolas', size: 20 })] })),
    p('Why this design', { bold: true }),
    p(k.why),
    p('Where to see it', { bold: true }),
    p(k.where),
    new Paragraph({ spacing: { after: 200 }, children: [] }),
  ]
}

const portraitSections = []
const landscapeSections = []
const backSections = []

// ---------------- COVER ----------------
portraitSections.push(
  new Paragraph({ spacing: { before: 2400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'journi', bold: true, size: 72, color: BRAND })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'Human Change Management Platform', size: 28, color: '666666' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 100 }, children: [new TextRun({ text: 'Step-by-Step Tutorial', bold: true, size: 40 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'Kenitra Precision Manufacturing — Enterprise Platform Renewal Program', size: 26, italics: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800 }, children: [new TextRun({ text: 'A worked example built live in the running application: an end-to-end BPMN process map, a 14-month WBS & Gantt timeline (Module 18), the full Change Management lifecycle across eight phases with Project Management and Change Management tasks (each with SIPOC and RACSI), Go/No-Go phase exit checklists, multi-level analytics & benchmarking, RBAC-gated CRUD, a runtime-configurable Permission Matrix, justification governance, AI Diagnosis & Coaching, and a real LLM provider connection.', size: 22, color: '444444' })] }),
  new Paragraph({ children: [new PageBreak()] }),
)

// ---------------- TOC ----------------
portraitSections.push(
  h1('Table of Contents'),
  p('TOCPLACEHOLDERXYZ'),
  new Paragraph({ children: [new PageBreak()] }),
)

// ---------------- INTRO ----------------
portraitSections.push(
  h1('1. Introduction & How to Use This Guide'),
  p('This tutorial builds a complete Change Management Project from a blank installation of journi, screen by screen, using real screenshots captured from the running application — nothing here is mocked or hand-drawn. Every "User Input" cell states exactly what was typed or selected; every "Expected Result" states exactly what the application shows in response, so you can reproduce each step and get the same result.'),
  p('The example company, "Kenitra Precision Manufacturing", and its Main Project, the "Enterprise Platform Renewal Program", are both fictional and deliberately generic — the Main Project is an ERP-type transformation but is never given a specific product or vendor name, because journi is vendor-agnostic and this distinction matters: the Change Management Project tracks the human side of the transition, independent of which underlying system is being deployed.'),
  p('Section 3 opens with a BPMN-style map of the end-to-end Change Management process (3.1) and a 14-month Work Breakdown Structure & Gantt timeline (3.2), spanning every phase in this tutorial. Every phase from Section 4 onward then follows a fixed structure — Goals, Project Management Tasks, Change Management Tasks (each with SIPOC and RACSI), a Framework Update & Justification, and a Change Management Phase Exit Checklist with a Go/No-Go decision — described in full in Section 3.3, with the full task index in Section 3.4.'),
  p('A recurring pattern worth noting up front: wherever this tutorial changes a score or a state — an ADKAR block, a Bridges/sentiment position, a sponsor-visibility level, a manager-readiness rating, a risk status — the step is written as Open the screen ● Stage the new value, with a note ● Save with justification: "<quote>". The quoted justification always cites something that has already happened — a conversation held, a visit made, a session completed — never something merely planned or anticipated. journi never validates this itself; the discipline is the point, and Appendix C collects the full reference.'),
)

// ---------------- PLATFORM CONCEPTS ----------------
portraitSections.push(
  new Paragraph({ children: [new PageBreak()] }),
  h1('2. Platform Concepts You Need First'),
  h2('2.1 Group → Organization → Project, and multi-tenancy'),
  p('journi organizes everything under an optional Group, one or more Organizations, and — under each Organization — any number of Main Projects and Change Management (CM) Projects. A CM Project may optionally link to one or more Main Projects, or remain standalone. Every record a user can see is filtered through this hierarchy according to their role\'s scope (Group / Organization / Project) — a Change Manager scoped to one Project never sees another Organization\'s data, an Organization Admin never sees a sibling Organization outside their own, and only a Group Admin or Super Admin sees across an entire Group.'),
  h2('2.2 Roles & RBAC'),
  p('Nine roles exist, each with a scope level (platform / group / organization / project) and a write-access flag. Super Admin, Group Admin, Org Admin, Change Manager, Practitioner and People Manager can create, edit and delete records within their scope. Sponsor, Executive and Employee are read-focused. Every one of these defaults is itself overridable at runtime through the Permission Matrix (Module 2), covered in Phase 7.'),
  h2('2.3 The three frameworks journi tracks'),
  ...FRAMEWORK_OVERVIEWS.flatMap((f) => [h3(f.name), p(f.summary)]),
  h2('2.4 Deciding which phase/state applies — the decision framework'),
  p('journi never auto-computes a Lewin, Prosci or Bridges label from a formula — these are judgment calls a Change Manager makes based on evidence, and the platform\'s job is to make the right evidence visible at the point of decision. The criteria below are what every phase\'s Framework Update & Justification in this tutorial actually applies:'),
  ...FRAMEWORK_DECISION_CRITERIA.map(bullet),
)

// ---------------- SECTION 3: BPMN + GANTT (landscape) ----------------
landscapeSections.push(
  h1('3. Change Management End-to-End Process & Program Timeline'),
  h2('3.1 End-to-end BPMN process map'),
  p('The diagram below is a BPMN-style process map of the entire Change Management lifecycle demonstrated in this tutorial. Swimlanes are the RACSI participant roles; the horizontal flow is time, moving through Phase 0 to Phase 7; each diamond is a Go/No-Go gateway corresponding to that phase\'s Change Management Phase Exit Checklist (Section 3.3, applied at the end of every phase from Section 4 onward). Every task box names the Project Management (sand) or Change Management (teal) task ID(s) active in that role\'s lane for that phase — the same task IDs used throughout the rest of this tutorial.'),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, children: [img('00-bpmn-e2e-process.png', 950, 2920, 804)] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'End-to-end Change Management process, Kenitra Precision Manufacturing — Phase 0 through Phase 7', italics: true, size: 18, color: '666666' })] }),
  new Paragraph({ children: [new PageBreak()] }),
  h2('3.2 Program timeline — WBS Gantt (14 months)'),
  p('The Gantt below plots the same eight phases against the full 14-month program calendar, month by month, with week-level sub-ticks shown for Month 1 (multi-tenant setup, where several tasks turn over inside a single month) and Month 9 (go-live). Beneath the phase band sit the three framework tracks (Lewin, Prosci, Bridges) shaded by state — steady (solid teal), transitioning (sand), or not applicable (grey, Phases 6-7, which are platform/administrative) — and the two ADKAR milestones this tutorial stages: Awareness → 3 in Month 2-3 (Phase 2) and Desire → 2 in Month 7 (Phase 3). The two task tracks at the bottom place every Project Management and Change Management task from Section 3.4\'s Work Breakdown Structure at the week it actually occurs in this tutorial\'s narrative — the same task bars underpin the SIPOC/RACSI task blocks in Section 4 onward, including the two new Module 18 tasks (PM1.2 baseline setup, PM5.4 schedule-gap review).'),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, children: [img('00b-gantt-wbs-timeline.png', 960, 1816, 1448)] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'Program timeline — Work Breakdown Structure Gantt, 14 months, Kenitra Precision Manufacturing Enterprise Platform Renewal Program', italics: true, size: 18, color: '666666' })] }),
)

// ---------------- SECTION 3.3: HOW PHASES ARE ORGANIZED (back to portrait) ----------------
backSections.push(
  new Paragraph({ children: [new PageBreak()] }),
  h2('3.3 How each phase in this tutorial is organized'),
  p('Every phase from Section 4 onward follows the same fixed structure, telling one continuous story — the Kenitra Precision Manufacturing rollout — rather than a list of disconnected screens:'),
  bullet('Phase ID, Name & Goals — what this phase is trying to accomplish, in plain language, before any screen is touched.'),
  bullet('Project Management Tasks — the delivery/portfolio-track work (scope, budget, schedule, governance, reporting, the WBS & Gantt baseline itself) a PMO or Program Manager owns. Not every phase has these.'),
  bullet('Change Management Tasks — the people-readiness work (ADKAR, sentiment, communications, training, resistance, sustainment) a Change Manager owns, each broken into its underlying UI steps with the same screenshot-by-screenshot detail as before. Not every phase has these either.'),
  bullet('Every task — Project Management or Change Management — carries its own SIPOC and RACSI at the task level. SIPOC (Suppliers, Inputs, Process, Outputs, Customers) states what feeds the task, what goes into it, what actually gets done, what comes out, and who consumes it.'),
  bullet('RACSI is shown as roles down the rows and R / A / C / S / I across the columns, with a mark in whichever column(s) apply to that role for that task — R = Responsible (does the hands-on work), A = Accountable (owns the outcome), C = Consulted (two-way input sought), S = Support (provides assistance or resources), I = Informed (kept in the loop, one-way). A role with no mark in any column is not involved in that particular task.'),
  bullet('Framework Update & Justification — states plainly what the tasks and steps just completed change in Lewin / Prosci / Bridges (if anything), and why.'),
  bullet('Change Management Phase Exit Checklist — Go / No-Go — a short list of verification criteria specific to that phase\'s change-management work, closing with an explicit GO or NO-GO decision and the reasoning behind it. This is the gateway diamond shown for that phase in the BPMN map above.'),
  p('RACSI participant roles used throughout (fixed set, for a consistent matrix across every task): Sponsor, Super Admin (platform/tenant administration), PMO / Program Manager (the delivery-track owner), Change Manager, People Manager, and Employee/End User.'),
)

// ---------------- SECTION 3.4: WORK BREAKDOWN STRUCTURE ----------------
backSections.push(
  new Paragraph({ children: [new PageBreak()] }),
  h2('3.4 Work Breakdown Structure (WBS) — task index'),
  p('The outline below is the task index behind the Gantt in Section 3.2, grouped the way a program office would file it — a Project Management track, a Change Management track, and the framework milestones that both tracks exist to produce. Every leaf here is one task block in Section 4 onward, carrying its own SIPOC and RACSI; the month/week reference is where that task\'s bar sits on the Gantt.'),

  h3('1.0 Project Management Track'),
  wbsLine('1.1  Phase 0 — Set Up Your Multi-Tenant Structure  (Month 1)', 0, { bold: true }),
  wbsLine('PM0.1 — Stand up the tenant hierarchy  (M1·W1–W2)', 1),
  wbsLine('PM0.2 — Register the Main Project  (M1·W3)', 1),
  wbsLine('1.2  Phase 1 — Initiate & Diagnose  (Month 1–2)', 0, { bold: true }),
  wbsLine('PM1.1 — Complete the initiative profile & business case  (M1·W4–M2·W1)', 1),
  wbsLine('PM1.2 — Build the WBS & Gantt baseline  (M2·W1–W2)', 1),
  wbsLine('1.3  Phase 5 — Sustain, Analyze & Benchmark  (Month 10–12)', 0, { bold: true }),
  wbsLine('PM5.1 — Expand the portfolio  (M10·W1)', 1),
  wbsLine('PM5.2 — Confirm the Readiness Index at every level  (M10·W2–M11·W1)', 1),
  wbsLine('PM5.3 — Benchmark against portfolio peers  (M11·W2–M12·W4)', 1),
  wbsLine('PM5.4 — Review the WBS schedule gap — baseline vs. actual  (M12·W4)', 1),
  wbsLine('1.4  Phase 6 — Governance, Multi-Tenancy, RBAC & Language  (Month 13)', 0, { bold: true }),
  wbsLine('PM6.1 — Govern AI use-case activation  (M13·W1)', 1),
  wbsLine('PM6.2 — Provision users & verify RBAC  (M13·W2)', 1),
  wbsLine('PM6.3 — Verify tenant-language precedence  (M13·W3)', 1),
  wbsLine('PM6.4 — Delete a project & verify cascading cleanup  (M13·W4)', 1),
  wbsLine('1.5  Phase 7 — Justification Governance, AI Diagnosis & LLM Connection  (Month 14)', 0, { bold: true }),
  wbsLine('PM7.1 — Configure the Permission Matrix & justification governance  (M14·W1)', 1),
  wbsLine('PM7.2 — Activate AI use cases for the Organization  (M14·W1–W2)', 1),
  wbsLine('PM7.3 — Connect a real LLM provider  (M14·W2)', 1),

  h3('2.0 Change Management Track'),
  wbsLine('2.1  Phase 0 — Set Up Your Multi-Tenant Structure  (Month 1)', 0, { bold: true }),
  wbsLine('CM0.1 — Register and link the Change Management Project  (M1·W4)', 1),
  wbsLine('2.2  Phase 1 — Initiate & Diagnose  (Month 2)', 0, { bold: true }),
  wbsLine('CM1.1 — Map stakeholders & impact  (M2·W1–W2)', 1),
  wbsLine('CM1.2 — Establish baseline sponsor visibility  (M2·W2–W3)', 1),
  wbsLine('2.3  Phase 2 — Plan & Prepare  (Month 2–7)', 0, { bold: true }),
  wbsLine('CM2.1 — Score initial Awareness (ADKAR)  (M2·W4–M3·W1)', 1),
  wbsLine('CM2.2 — Log the highest-severity adoption risk  (M3·W1)', 1),
  wbsLine('CM2.4 — Stand up the first training curriculum  (M3·W2–M6·W4)', 1),
  wbsLine('CM2.3 — Plan the first target-population communication  (M7·W1–W2)', 1),
  wbsLine('2.4  Phase 3 — Mobilize & Execute  (Month 7–8)', 0, { bold: true }),
  wbsLine('CM3.1 — Score Desire & diagnose the stall  (M7·W3–M8·W1)', 1),
  wbsLine('CM3.2 — Update Bridges & Kübler-Ross position  (M8·W1–W2)', 1),
  wbsLine('CM3.3 — Log & begin mitigating resistance  (M8·W2–W3)', 1),
  wbsLine('2.5  Phase 4 — Reinforce & Adopt  (Month 8–9)', 0, { bold: true }),
  wbsLine('CM4.1 — Assess manager readiness  (M8·W4)', 1),
  wbsLine('CM4.2 — Review sustainment checkpoints  (M9·W1)', 1),
  wbsLine('CM4.3 — Mark go-live on the journey map  (M9·W2 — program go-live)', 1),
  wbsLine('2.6  Phase 7 — Justification Governance, AI Diagnosis & LLM Connection  (Month 14)', 0, { bold: true }),
  wbsLine('CM7.1 — Complete the risk mitigation action plan  (M14·W2–W3)', 1),
  wbsLine('CM7.2 — Detect hidden-resistance divergence  (M14·W3)', 1),
  wbsLine('CM7.3 — Diagnose & coach the stalled Desire block  (M14·W3–W4)', 1),

  h3('3.0 Framework Milestones (cross-cutting)'),
  p('These are not separate tasks — they are the state Lewin, Prosci, Bridges and ADKAR are in as a direct consequence of the Project/Change Management tasks above landing on schedule. Section 4 onward states, phase by phase, exactly which task caused which framework movement and why (Framework Update & Justification).'),
  wbsLine('Lewin — Unfreeze (Phase 0–1, M1–M2)  →  Unfreeze → Change, transitioning (Phase 2, M2–M7)  →  Change (Phase 3, M7–M8)  →  Change → Refreeze, transitioning (Phase 4, M8–M9)  →  Refreeze (Phase 5, M10–M12)  →  n/a — platform/administrative (Phase 6–7, M13–M14)', 0),
  wbsLine('Prosci — Prepare (Phase 0–1, M1–M2)  →  Prepare → Manage, transitioning (Phase 2, M2–M7)  →  Manage (Phase 3, M7–M8)  →  Manage → Reinforce, transitioning (Phase 4, M8–M9)  →  Reinforce (Phase 5, M10–M12)  →  n/a (Phase 6–7, M13–M14)', 0),
  wbsLine('Bridges — Ending (Phase 0–2, M1–M7)  →  Neutral Zone (Phase 3, M7–M8)  →  Neutral Zone → New Beginning, transitioning (Phase 4, M8–M9)  →  New Beginning, once checkpoint adoption data confirms it (Phase 5, M10–M12)  →  n/a (Phase 6–7, M13–M14)', 0),
  wbsLine('ADKAR — Awareness staged to 3 at CM2.1 (M2·W4, Phase 2)  ·  Desire staged to 2 at CM3.1 (M7·W3, Phase 3)', 0),
  wbsLine('Program go-live — CM4.3 (M9·W2, Phase 4)', 0),
)

// ---------------- PHASES ----------------
TUTORIAL_PHASES.forEach((phase) => backSections.push(...phaseSection(phase)))

// ---------------- APPENDIX A: KPI ----------------
backSections.push(
  new Paragraph({ children: [new PageBreak()] }),
  h1('Appendix A — KPI & Index Formula Reference'),
  p('Every computed metric in journi is deterministic and auditable — no black-box scoring. This appendix lists each one with its exact inputs, formula, and the reasoning behind its design.'),
  ...KPI_SECTIONS.flatMap(kpiSection),
  h3(BENCHMARK_SECTION.name),
  p(BENCHMARK_SECTION.module, { italics: true, size: 20, color: '666666' }),
  p('Inputs', { bold: true }),
  ...BENCHMARK_SECTION.inputs.map(bullet),
  p('Formula', { bold: true }),
  ...BENCHMARK_SECTION.formula.map((f) => new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: f, font: 'Consolas', size: 20 })] })),
  p('Why this design', { bold: true }),
  p(BENCHMARK_SECTION.why),
  p('Roll-up levels', { bold: true }),
  p(BENCHMARK_SECTION.levels),
)

// ---------------- APPENDIX B: FRAMEWORKS ----------------
backSections.push(
  new Paragraph({ children: [new PageBreak()] }),
  h1('Appendix B — Framework Decision Reference'),
  h2('Decision criteria (repeated from Section 2.4 for quick reference)'),
  ...FRAMEWORK_DECISION_CRITERIA.map(bullet),
  h2('Phase-by-phase Framework Update & Justification used throughout this tutorial'),
  ...TUTORIAL_PHASES.flatMap((ph) => [
    h3(`${ph.id} — ${ph.name}`),
    frameworkBadgeTable(ph.frameworkUpdate),
    new Paragraph({ spacing: { before: 100, after: 100 }, children: [] }),
    p(ph.frameworkUpdate.justification),
    new Paragraph({ spacing: { after: 200 }, children: [] }),
  ]),
)

// ---------------- APPENDIX C: ACTIONS BEFORE CHANGING A SCORE OR STATE ----------------
backSections.push(
  new Paragraph({ children: [new PageBreak()] }),
  h1('Appendix C — Actions Before Changing a Score or State'),
  p('journi never validates that a state change is evidence-based — a Change Manager or any other write-access role can move a score or a phase selector at any time. That is deliberate: journi is a record of judgment, not an automated survey engine. That makes the discipline of what happens right before the click the single biggest determinant of whether the resulting data is trustworthy — and, specifically, whether the justification written down cites something that already happened rather than something merely hoped for. This appendix collects, in one place, what should happen first for every mutable score or state field in the platform.'),
  ...PRE_ACTION_GUIDANCE.flatMap((g) => [
    h3(g.field),
    p(g.module, { italics: true, size: 20, color: '666666' }),
    ...g.before.map(bullet),
    new Paragraph({ spacing: { after: 160 }, children: [] }),
  ]),
)

// ---------------- ASSEMBLE ----------------
function makeHeader() {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: 'journi — Step-by-Step Tutorial', size: 16, color: '999999' })],
      }),
    ],
  })
}
function makeFooter() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Page ', size: 16, color: '999999' }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '999999' }),
        ],
      }),
    ],
  })
}

const doc = new Document({
  sections: [
    {
      properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
      headers: { default: makeHeader() },
      footers: { default: makeFooter() },
      children: portraitSections,
    },
    {
      properties: {
        page: {
          size: { orientation: PageOrientation.LANDSCAPE, width: 12240, height: 15840 },
          margin: { top: 900, bottom: 900, left: 700, right: 700 },
        },
      },
      headers: { default: makeHeader() },
      footers: { default: makeFooter() },
      children: landscapeSections,
    },
    {
      properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
      headers: { default: makeHeader() },
      footers: { default: makeFooter() },
      children: backSections,
    },
  ],
})

const outPath = path.join(process.cwd(), 'journi-tutorial-guide-Kenitra-Precision.docx')
const buf = await Packer.toBuffer(doc)
fs.writeFileSync(outPath, buf)
console.log('Wrote', outPath, buf.length, 'bytes')
