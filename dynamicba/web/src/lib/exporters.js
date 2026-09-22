// src/lib/exporters.js
// Real, pure-JS document generation for the Export & Handoff step (MP-07.7) — Word
// (.docx), PDF, and Excel (.xlsx) files built entirely in the browser, no server
// round-trip, per Standard SRS NFR-DA-PORT-01. The Word and PDF exports share one
// content model (src/lib/reportContent.js) so they are always equally comprehensive;
// the Excel workbook mirrors the same depth across many sheets, per the same principle.
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { buildReportBlocks } from './reportContent'
import { renderBlocksToDocxFile, renderBlocksToPdfFile } from './reportRenderers'
import {
  MACRO_PROCESSES, STEPS, RASCI_BY_MACRO_PROCESS, BUSINESS_RULES, ACTIONS, CONTROLS,
  RISKS, KPIS, ALERTS_CATALOGUE, REPORTS_CATALOGUE, AI_USE_CASES, MODULES, PLAN_LABELS,
} from './catalogue'
import { OBJECT_CLASSES, ATTRIBUTES } from './schema'

function docMeta(project, bundle) {
  const sponsor = (bundle.stakeholders || []).find((s) => /sponsor/i.test(s.Role || '')) || (bundle.stakeholders || [])[0]
  return {
    title: 'DynamicBA — Automation Specification Package',
    subtitle: project.name,
    client: project.clientName || '—',
    project: project.name,
    preparedFor: sponsor?.Name || 'Client Sponsor',
    preparedBy: 'DynamicBA (AI-Generated, Consultant-Reviewed)',
    date: new Date().toISOString().slice(0, 10),
    status: bundle.signOff?.Status || 'Pending',
  }
}

// Word export always includes the full comprehensive Specification Package (Sections
// 1-7 plus reference appendices A-F) — this is what the generated package now looks
// like, per user feedback that the prior single-table export was far too thin.
export async function exportHandoffPackageDocx(project, bundle) {
  const blocks = buildReportBlocks(project, bundle)
  await renderBlocksToDocxFile(blocks, docMeta(project, bundle), `${project.name.replace(/\s+/g, '_')}_Specification_Package.docx`)
}

export function exportHandoffPackagePdf(project, bundle) {
  const blocks = buildReportBlocks(project, bundle)
  renderBlocksToPdfFile(blocks, docMeta(project, bundle), `${project.name.replace(/\s+/g, '_')}_Specification_Package.pdf`)
}

function sheet(wb, name, rows) {
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [{}]), name.slice(0, 31))
}

// The Excel workbook mirrors the Word/PDF package's depth: one sheet per live-data
// artifact type actually used on this engagement, plus the full platform reference
// catalogue (process model, governance catalogue, AI use case library, data dictionary,
// licensing model) as additional reference sheets — the same "full appendix" principle
// that makes the Word export comprehensive regardless of how much live data exists yet.
export function exportHandoffPackageXlsx(project, bundle) {
  const wb = XLSX.utils.book_new()

  // --- Live engagement data -------------------------------------------------
  sheet(wb, 'SOW', bundle.sow ? [bundle.sow] : [])
  sheet(wb, 'Stakeholders', bundle.stakeholders || [])
  sheet(wb, 'Context Model', bundle.contextModel ? [bundle.contextModel] : [])
  sheet(wb, 'System Landscape', bundle.systemLandscape || [])
  sheet(wb, 'As-Is Process Map', bundle.asIsMap ? [bundle.asIsMap] : [])
  sheet(wb, 'Pain Points', bundle.painPoints || [])
  sheet(wb, 'Baseline Metrics', bundle.baselineMetrics || [])
  sheet(wb, 'Automation Candidates', bundle.candidates || [])
  sheet(wb, 'Feasibility Assessments', bundle.feasibilityAssessments || [])
  sheet(wb, 'ROI Models', bundle.roiModels || [])
  sheet(wb, 'To-Be Process Map', bundle.toBeMap ? [bundle.toBeMap] : [])
  sheet(wb, 'Use Cases', bundle.useCases || [])
  sheet(wb, 'Integration Points', bundle.integrationPoints || [])
  sheet(wb, 'Exception Flows', bundle.exceptionFlows || [])
  sheet(wb, 'Control Specs', bundle.controlSpecs || [])
  sheet(wb, 'Risk-Opportunity Register', bundle.risks || [])
  sheet(wb, 'Business Rule Specs', bundle.ruleSpecs || [])
  sheet(wb, 'KPI Specs', bundle.kpiSpecs || [])
  sheet(wb, 'Alert Specs', bundle.alertSpecs || [])
  sheet(wb, 'Report Specs', bundle.reportSpecs || [])
  sheet(wb, 'Traceability Matrix', bundle.traceabilityLinks || [])
  sheet(wb, 'Project Governance Alerts', bundle.projectAlerts || [])
  sheet(wb, 'Client Sign-Off', bundle.signOff ? [bundle.signOff] : [])
  sheet(wb, 'Handoff Package', bundle.handoffPackage ? [bundle.handoffPackage] : [])
  sheet(wb, 'Development Backlog', bundle.backlogItems || [])

  // --- Full platform reference catalogue (always included) -----------------
  sheet(wb, 'Ref - Macro Processes', MACRO_PROCESSES.map((m) => ({ ID: m.id, Name: m.name, Objective: m.objective, Trigger: m.trigger, Terminal_State: m.terminalState, Owner_Role: m.ownerRole, Module: m.module })))
  sheet(wb, 'Ref - RASCI', Object.entries(RASCI_BY_MACRO_PROCESS).map(([mp, r]) => ({ Macro_Process: mp, ...r })))
  sheet(wb, 'Ref - Process Steps', STEPS.map((s) => ({ Step_ID: s.id, Macro_Process: s.mp, Task: s.task, Name: s.name, Type: s.type, Description: s.desc, Role: s.role })))
  sheet(wb, 'Ref - Business Rules', BUSINESS_RULES.map((r) => ({ ID: r.id, Step: r.step, Condition: r.condition, Action: r.action, Type: r.type })))
  sheet(wb, 'Ref - Actions', ACTIONS.map((a) => ({ ID: a.id, Name: a.name, Type: a.type, Target: a.target, Description: a.desc })))
  sheet(wb, 'Ref - Controls', CONTROLS.map((c) => ({ ID: c.id, Name: c.name, Type: c.type, Steps: c.steps.join(', '), Description: c.desc })))
  sheet(wb, 'Ref - Risks', RISKS.map((r) => ({ ID: r.id, Name: r.name, Category: r.category, Inherent: r.inherent, Residual: r.residual, KRI_Formula: r.kriFormula })))
  sheet(wb, 'Ref - KPIs', KPIS.map((k) => ({ ID: k.id, Name: k.name, Type: k.type, Formula: k.formula, Target: k.target, Macro_Process: k.mp })))
  sheet(wb, 'Ref - Alerts', ALERTS_CATALOGUE.map((a) => ({ ID: a.id, Rule: a.rule, Severity: a.severity, Escalation: a.escalation, Step: a.step })))
  sheet(wb, 'Ref - Reports', REPORTS_CATALOGUE.map((r) => ({ ID: r.id, Name: r.name, Audience: r.audience, Cadence: r.cadence, Fields: r.fields.join(', ') })))
  sheet(wb, 'Ref - AI Use Cases', AI_USE_CASES.map((u) => ({ ID: u.id, Name: u.name, Step: u.step, Task_Type: u.taskType, Risk: u.risk, Checkpoint: u.checkpoint, Scope: u.scope, Custom: u.custom })))
  sheet(wb, 'Ref - Modules & Tiers', MODULES.map((m) => ({ ID: m.id, Name: m.name, Tier: PLAN_LABELS[m.tier] || m.tier, Model: m.model, Macro_Processes: m.macroProcesses.join(', '), Rate_Limit: m.rateLimit })))
  sheet(wb, 'Ref - Object Classes', OBJECT_CLASSES.map((c) => ({ ID: c.id, Name: c.name, Label: c.label, Description: c.desc, Parent: c.parent || '', Macro_Processes: (c.mp || []).join(', ') })))
  sheet(wb, 'Ref - Data Dictionary', ATTRIBUTES.map((a) => ({ ID: a.id, Object_Class: a.oc, Attribute: a.name, Type: a.type, Required: a.required, Validation_Rule: a.rule })))

  XLSX.writeFile(wb, `${project.name.replace(/\s+/g, '_')}_Specification_Package.xlsx`)
}

export function exportHandoffPackageJson(project, bundle) {
  const blob = new Blob([JSON.stringify({ project, ...bundle }, null, 2)], { type: 'application/json' })
  saveAs(blob, `${project.name.replace(/\s+/g, '_')}_Handoff_Package.json`)
}
