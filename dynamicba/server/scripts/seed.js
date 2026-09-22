// Seeds a demo Organization, an admin login, 5 demo Clients (Retail, Healthcare,
// Manufacturing, Finance, Telecom), and 10 example engagement Projects at different
// wizard stages. Run with: npm run seed (from the server/ folder).
//
// This writes directly to the local JSON database (server/data/db.json) using the same
// scoring formulas the running application uses, so seeded data looks exactly like data
// a real user would have entered — it does not fabricate pre-computed numbers.
import { v4 as uuid } from 'uuid'
import { insert, findOne, update } from '../src/db.js'
import { hashPassword } from '../src/auth.js'
import { DEFAULT_PERMISSION_MATRIX, PLAN_MODULES, AI_USE_CASE_IDS } from '../src/constants.js'

const ADMIN_EMAIL = 'admin@dynamicba.demo'
const ADMIN_PASSWORD = 'DemoAdmin123!'

function computeSowCompleteness(sow) {
  const weights = { objectives: 20, scope: 20, deliverables: 20, timeline: 15, constraints: 10, stakeholdersText: 15 }
  let score = 0
  for (const [field, weight] of Object.entries(weights)) {
    const v = sow[field]
    if (!v) continue
    score += weight * Math.min(1, String(v).trim().length / 60)
  }
  return Math.round(score)
}

function computeContextCompleteness({ stakeholders, systemsCount, processesCount }) {
  let score = 0
  score += Math.min(40, stakeholders.length * 10)
  score += Math.min(30, (systemsCount || 0) * 6)
  score += Math.min(30, (processesCount || 0) * 6)
  return Math.round(score)
}

function computeFeasibilityScore({ technical, dataQuality, processStability, strategicFit }) {
  return Math.round(technical * 0.3 + dataQuality * 0.25 + processStability * 0.2 + strategicFit * 0.25)
}

function computeRoiModel({ annualBenefitUsd, oneTimeCostUsd }) {
  const paybackMonths = oneTimeCostUsd > 0 ? (oneTimeCostUsd / Math.max(1, annualBenefitUsd)) * 12 : 0
  const npv = annualBenefitUsd * 3 - oneTimeCostUsd
  return { paybackMonths: Math.round(paybackMonths * 10) / 10, npv: Math.round(npv) }
}

function businessDaysBetween(from, to) {
  let count = 0
  const cur = new Date(from)
  const end = new Date(to)
  while (cur < end) {
    cur.setDate(cur.getDate() + 1)
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
  }
  return count
}

const ALERT_DEFS = {
  'BR-02': { id: 'ALRT-01', severity: 'High', escalation: 'Business Analyst -> Delivery Lead', step: 'MP-01.5' },
  'BR-03': { id: 'ALRT-02', severity: 'Critical', escalation: 'Business Analyst -> Client Sponsor', step: 'MP-02.4' },
  'BR-04': { id: 'ALRT-02b', severity: 'Medium', escalation: 'Business Analyst -> Delivery Lead', step: 'MP-02.6' },
  'BR-07': { id: 'ALRT-Promoted', severity: 'Low', escalation: 'Automation Consultant -> Steering Committee', step: 'MP-04.3' },
  'BR-08': { id: 'ALRT-04', severity: 'Low', escalation: 'Automation Consultant -> Steering Committee', step: 'MP-04.5' },
  'BR-11': { id: 'ALRT-06', severity: 'Medium', escalation: 'Solution Architect -> Document 2 Registry Owner', step: 'MP-06.2' },
  'BR-13': { id: 'ALRT-07', severity: 'High', escalation: 'Delivery Lead -> Project Sponsor', step: 'MP-07.5' },
}

function raiseAlert(orgId, clientId, projectId, ruleId, detail) {
  const def = ALERT_DEFS[ruleId]
  if (!def) return
  insert('alerts', { id: uuid(), orgId, clientId, projectId, alertId: def.id, severity: def.severity, escalation: def.escalation, ruleId, detail, stepId: def.step, read: false, raisedAt: new Date().toISOString() })
}

function addArtifact(orgId, clientId, projectId, objectClassId, fields) {
  return insert('artifacts', { id: uuid(), orgId, clientId, projectId, objectClassId, ...fields, createdAt: new Date().toISOString() })
}

const CLIENT_BLUEPRINTS = [
  { key: 'meridian', name: 'Meridian Retail Group', industry: 'Retail' },
  { key: 'northgate', name: 'Northgate Health Systems', industry: 'Healthcare' },
  { key: 'atlas', name: 'Atlas Manufacturing Corp', industry: 'Manufacturing' },
  { key: 'ferrovia', name: 'Ferrovia Financial Services', industry: 'Finance' },
  { key: 'signalworks', name: 'SignalWorks Telecom', industry: 'Telecom' },
]

const PROJECT_BLUEPRINTS = [
  { client: 'meridian', name: 'Order-to-Cash Automation Engagement', stage: 4,
    sow: { objectives: 'Reduce order-to-cash cycle time and manual invoice touchpoints across all regional distribution centers.', scope: 'Order capture, invoicing, and accounts receivable for the North American retail division.', deliverables: 'Current-state report, automation business case, to-be design, full specification package, development backlog.', timeline: 'Kickoff Q1, specification handoff within 10 weeks.', constraints: 'Must integrate with the existing SAP ERP without a version upgrade; budget capped at $180,000.' },
    stakeholders: [['Dana Whitfield', 'Client Sponsor', 'High'], ['Priya Nandakumar', 'Process Owner', 'High'], ['Alex Ferreira', 'IT Lead', 'Medium']],
    context: { systemsCount: 6, processesCount: 5 },
    candidates: [ { name: 'Automated 3-way invoice matching', technical: 85, dataQuality: 80, processStability: 75, strategicFit: 80, annualBenefitUsd: 120000, oneTimeCostUsd: 60000 }, { name: 'Customer credit hold auto-release', technical: 70, dataQuality: 65, processStability: 60, strategicFit: 55, annualBenefitUsd: 40000, oneTimeCostUsd: 35000 } ],
    signOffDaysAgo: 10 },
  { client: 'meridian', name: 'Returns & Reverse Logistics Assessment', stage: 2,
    sow: { objectives: 'Cut return-processing turnaround time.', scope: 'In-store and online returns.', deliverables: 'Current-state report and opportunity assessment.', timeline: '', constraints: '' },
    stakeholders: [['Dana Whitfield', 'Client Sponsor', 'High']], context: { systemsCount: 2, processesCount: 2 }, candidates: [] },
  { client: 'northgate', name: 'Patient Intake Digitization', stage: 4,
    sow: { objectives: 'Digitize and streamline patient intake to reduce front-desk wait times and data-entry errors across three hospital campuses.', scope: 'Patient registration, insurance verification, and consent capture at all outpatient facilities.', deliverables: 'Full specification package covering intake workflow automation with HIPAA-aligned controls.', timeline: 'Discovery in month 1, specs delivered by end of month 3.', constraints: "Must remain compliant with HIPAA; no PHI may leave the client's own data center." },
    stakeholders: [['Dr. Elaine Cho', 'Client Sponsor', 'High'], ['Marcus Ibe', 'Process Owner', 'High'], ['Renata Diaz', 'IT Lead', 'Medium'], ['Tomas Reyes', 'SME', 'Low']],
    context: { systemsCount: 4, processesCount: 3 },
    candidates: [ { name: 'Insurance eligibility auto-verification', technical: 90, dataQuality: 85, processStability: 80, strategicFit: 85, annualBenefitUsd: 150000, oneTimeCostUsd: 70000 } ],
    exceptionFlow: { isAiAssisted: true, handlesSensitiveData: true }, signOffDaysAgo: 3 },
  { client: 'northgate', name: 'Clinical Supply Chain Discovery', stage: 1,
    sow: { objectives: 'Understand current medical-supply reordering.', scope: '', deliverables: '', timeline: '', constraints: '' },
    stakeholders: [], candidates: [] },
  { client: 'atlas', name: 'Shop-Floor Quality Inspection Automation', stage: 3,
    sow: { objectives: 'Reduce defect escape rate by automating quality inspection data capture and disposition routing on the primary assembly line.', scope: 'Final inspection and disposition for the flagship product line at the primary plant.', deliverables: 'To-be process design, governance artifacts, and full specification package for the QA station.', timeline: 'Twelve-week engagement starting after line-shutdown week.', constraints: 'No changes to the certified inspection equipment firmware; must preserve existing audit trail format.' },
    stakeholders: [['Helena Brandt', 'Client Sponsor', 'High'], ['Oliver Kwan', 'Process Owner', 'Medium']],
    context: { systemsCount: 5, processesCount: 4 },
    candidates: [ { name: 'Automated defect classification', technical: 65, dataQuality: 55, processStability: 70, strategicFit: 60, annualBenefitUsd: 90000, oneTimeCostUsd: 85000 } ],
    control: { type: 'Preventive', linkedToFinancialAction: false } },
  { client: 'atlas', name: 'Supplier Onboarding Streamlining', stage: 2,
    sow: { objectives: 'Speed up new-supplier onboarding and reduce compliance follow-up cycles across procurement.', scope: 'Supplier qualification, contract intake, and compliance document collection.', deliverables: 'Current-state report and prioritized opportunity list.', timeline: 'Six-week discovery sprint.', constraints: "Onboarding must stay compliant with the client's existing vendor-risk policy." },
    stakeholders: [['Helena Brandt', 'Client Sponsor', 'High'], ['Grace Oduya', 'Process Owner', 'Medium']],
    context: { systemsCount: 3, processesCount: 3 },
    candidates: [ { name: 'Automated compliance document checklist', technical: 60, dataQuality: 60, processStability: 65, strategicFit: 50, annualBenefitUsd: 35000, oneTimeCostUsd: 40000 } ] },
  { client: 'ferrovia', name: 'KYC Onboarding Acceleration', stage: 4,
    sow: { objectives: 'Reduce Know-Your-Customer onboarding time for retail banking customers while preserving full regulatory audit trail.', scope: 'Retail account opening KYC checks across all branch and digital channels.', deliverables: 'Full specification package including business rule decision tables and audit controls.', timeline: 'Eight-week engagement culminating in signed-off specs.', constraints: "Must satisfy the regulator's data-residency requirement; human sign-off mandatory on any flagged case." },
    stakeholders: [['Isabelle Laurent', 'Client Sponsor', 'High'], ['Naveen Kapoor', 'Process Owner', 'High'], ['Sofia Marchetti', 'IT Lead', 'Medium']],
    context: { systemsCount: 7, processesCount: 6 },
    candidates: [ { name: 'Automated document authenticity check', technical: 88, dataQuality: 82, processStability: 78, strategicFit: 90, annualBenefitUsd: 200000, oneTimeCostUsd: 95000 }, { name: 'Sanctions-list screening bot', technical: 92, dataQuality: 88, processStability: 85, strategicFit: 88, annualBenefitUsd: 160000, oneTimeCostUsd: 80000 } ],
    exceptionFlow: { isAiAssisted: true, handlesSensitiveData: true }, control: { type: 'Preventive', linkedToFinancialAction: true }, signOffDaysAgo: 1 },
  { client: 'ferrovia', name: 'Vague-Scope Fraud Ops Assessment', stage: 1,
    sow: { objectives: 'Look at fraud stuff.', scope: '', deliverables: 'TBD', timeline: '', constraints: '' },
    stakeholders: [], candidates: [] },
  { client: 'signalworks', name: 'Network Fault Triage Automation', stage: 3,
    sow: { objectives: 'Automate first-line triage of network fault tickets to cut mean-time-to-resolution for the field operations team.', scope: 'Tier-1 fault triage and dispatch across the regional access network.', deliverables: 'To-be design and governance artifacts for the automated triage workflow.', timeline: 'Ten-week engagement with a two-week pilot extension.', constraints: 'Must interoperate with the existing OSS ticketing platform without a data-model change.' },
    stakeholders: [['Karim El-Sayed', 'Client Sponsor', 'High'], ['Line Bergström', 'Process Owner', 'Medium']],
    context: { systemsCount: 4, processesCount: 3 },
    candidates: [ { name: 'Automated fault classification & routing', technical: 80, dataQuality: 75, processStability: 70, strategicFit: 75, annualBenefitUsd: 110000, oneTimeCostUsd: 65000 } ] },
  { client: 'signalworks', name: 'Customer Churn Early-Warning Discovery', stage: 2,
    sow: { objectives: 'Identify early indicators of customer churn to enable proactive retention outreach across the postpaid mobile segment.', scope: 'Customer usage, billing, and support-ticket data for postpaid mobile subscribers.', deliverables: 'Current-state report and automation opportunity assessment.', timeline: 'Six-week discovery phase.', constraints: "Customer data use must remain within the client's existing consent framework." },
    stakeholders: [['Karim El-Sayed', 'Client Sponsor', 'High']], context: { systemsCount: 3, processesCount: 2 },
    candidates: [ { name: 'Churn risk scoring model', technical: 55, dataQuality: 50, processStability: 60, strategicFit: 65, annualBenefitUsd: 70000, oneTimeCostUsd: 75000 } ] },
]

function main() {
  if (findOne('users', (u) => u.email === ADMIN_EMAIL)) {
    console.log(`Demo data already seeded (admin login: ${ADMIN_EMAIL}). Delete server/data/db.json to reset and re-seed.`)
    return
  }

  const orgId = `org_demo_${uuid().slice(0, 8)}`
  const userId = uuid()
  insert('organizations', { id: orgId, name: 'Demo Consulting Practice', sector: 'Management Consulting', country: '', defaultLanguage: 'en', memberCount: 1, createdBy: userId, createdAt: new Date().toISOString() })
  insert('licences', { id: orgId, orgId, plan: 'enterprise', maxUsers: 100, features: PLAN_MODULES.enterprise, expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(), issueDate: new Date().toISOString(), companyName: 'Demo Consulting Practice', version: 1 })
  insert('orgConfig', { id: orgId, orgId, permissionMatrix: DEFAULT_PERMISSION_MATRIX, complianceStandards: { GDPR: false, ISO27001: false, SOC2: false } })
  for (const aiucId of AI_USE_CASE_IDS) insert('aiUseCaseActivation', { id: uuid(), orgId, aiucId, active: true })
  insert('users', { id: userId, email: ADMIN_EMAIL, passwordHash: hashPassword(ADMIN_PASSWORD), name: 'Demo Admin', orgId, roles: ['org_admin'], language: 'en', createdAt: new Date().toISOString() })
  console.log(`Created demo Organization ${orgId} and admin login ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)

  const clientIds = {}
  for (const cb of CLIENT_BLUEPRINTS) {
    const id = uuid()
    insert('clients', { id, orgId, name: cb.name, industry: cb.industry, deleted: false, createdAt: new Date().toISOString() })
    clientIds[cb.key] = id
  }

  let count = 0
  for (const pb of PROJECT_BLUEPRINTS) {
    const clientId = clientIds[pb.client]
    const status = pb.stage === 4 ? 'completed' : pb.stage >= 2 ? 'in_progress' : 'not_started'
    const projectId = uuid()
    insert('projects', { id: projectId, orgId, clientId, name: pb.name, status, currentStep: pb.stage, deleted: false, createdAt: new Date().toISOString() })

    const stakeholderRecords = []
    for (const [Name, Role, Influence_Level] of pb.stakeholders) {
      stakeholderRecords.push({ Name, Role, Influence_Level })
      addArtifact(orgId, clientId, projectId, 'OC-05', { Stakeholder_ID: `STK-${uuid().slice(0, 6)}`, Name, Role, Influence_Level })
    }
    const completeness = computeSowCompleteness({ ...pb.sow, stakeholdersText: stakeholderRecords.map((s) => s.Name + s.Role).join(' ') })
    addArtifact(orgId, clientId, projectId, 'OC-01', { SOW_ID: `SOW-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(count + 1).padStart(3, '0')}`, Status: completeness >= 70 ? 'Quality-Checked' : 'Ingested', Completeness_Score: completeness, Signed_Date: new Date().toISOString().slice(0, 10), ...pb.sow })
    if (completeness < 70) raiseAlert(orgId, clientId, projectId, 'BR-02', `Pre-flight completeness score is ${completeness} (threshold 70).`)
    const hasSponsor = stakeholderRecords.some((s) => /sponsor/i.test(s.Role))
    const hasOwner = stakeholderRecords.some((s) => /owner/i.test(s.Role))
    if (!hasSponsor || !hasOwner) raiseAlert(orgId, clientId, projectId, 'BR-03', 'No client sponsor or process owner has been identified yet.')

    if (pb.stage >= 2) {
      const ctxCompleteness = computeContextCompleteness({ stakeholders: stakeholderRecords, ...pb.context })
      addArtifact(orgId, clientId, projectId, 'OC-08', { Context_Model_ID: `CTX-${projectId.slice(0, 6)}`, Completeness_Score: ctxCompleteness, Approved_Date: new Date().toISOString().slice(0, 10) })
      if (ctxCompleteness < 70) raiseAlert(orgId, clientId, projectId, 'BR-04', `Context Model completeness score is ${ctxCompleteness} (threshold 70).`)

      for (const cand of pb.candidates) {
        const feasibilityScore = computeFeasibilityScore(cand)
        const roi = computeRoiModel(cand)
        const candId = `CAND-${uuid().slice(0, 6)}`
        addArtifact(orgId, clientId, projectId, 'OC-15', { Automation_Candidate_ID: candId, Name: cand.name, Feasibility_Score: feasibilityScore })
        addArtifact(orgId, clientId, projectId, 'OC-17', { ROI_Model_ID: `ROI-${candId}`, Payback_Months: roi.paybackMonths, NPV: roi.npv })
        addArtifact(orgId, clientId, projectId, 'OC-16', { Feasibility_Assessment_ID: `FA-${candId}`, Data_Availability_Rating: 'Medium' })
        if (feasibilityScore >= 80) raiseAlert(orgId, clientId, projectId, 'BR-07', `Feasibility score ${feasibilityScore} >= 80 — promoted to prioritization matrix.`)
        if (roi.paybackMonths > 18) raiseAlert(orgId, clientId, projectId, 'BR-08', `Projected payback ${roi.paybackMonths} months exceeds 18-month threshold — deprioritized.`)
      }
    }

    if (pb.stage >= 3) {
      addArtifact(orgId, clientId, projectId, 'OC-18', { To_Be_Process_Map_ID: `TBM-${projectId.slice(0, 6)}`, Version: '1.0', Status: 'Approved' })
      addArtifact(orgId, clientId, projectId, 'OC-19', { Use_Case_ID: `UC-${projectId.slice(0, 6)}`, Name: `${pb.name} — primary flow`, Status: 'Approved' })
      if (pb.exceptionFlow) addArtifact(orgId, clientId, projectId, 'OC-20', { Exception_Flow_ID: `EF-${projectId.slice(0, 6)}`, Human_Checkpoint_Required: pb.exceptionFlow.isAiAssisted && pb.exceptionFlow.handlesSensitiveData })
      if (pb.control) addArtifact(orgId, clientId, projectId, 'OC-23', { Control_Spec_ID: `CS-${projectId.slice(0, 6)}`, Type: pb.control.type })
      addArtifact(orgId, clientId, projectId, 'OC-22', { Business_Rule_Spec_ID: `BRS-${projectId.slice(0, 6)}`, Status: 'Specified' })
      raiseAlert(orgId, clientId, projectId, 'BR-11', "Formula_ID not yet present in Document 2's Formula Registry — flagged pending, not fabricated.")
      addArtifact(orgId, clientId, projectId, 'OC-25', { KPI_Spec_ID: `KPIS-${projectId.slice(0, 6)}`, Target_Value: '>= 80%' })
      addArtifact(orgId, clientId, projectId, 'OC-28', { Traceability_Link_ID: `TL-${projectId.slice(0, 6)}`, Coverage_Percent: 100, Source_Paragraph_Ref: 'SOW §2.1' })
    }

    if (pb.stage >= 4) {
      addArtifact(orgId, clientId, projectId, 'OC-29', { Spec_Package_ID: `SPKG-${projectId.slice(0, 6)}`, Section_Count: 6 })
      const deliveredDate = new Date(Date.now() - (pb.signOffDaysAgo + 2) * 24 * 3600 * 1000)
      const signedDate = new Date(Date.now() - pb.signOffDaysAgo * 24 * 3600 * 1000)
      const hoursSaved = 55 + Math.round(Math.random() * 20)
      update('projects', projectId, { packageDeliveredDate: deliveredDate.toISOString(), signOffSponsor: pb.stakeholders[0]?.[0], hoursSaved })
      addArtifact(orgId, clientId, projectId, 'OC-32', { Client_SignOff_ID: `SIGN-${projectId.slice(0, 6)}`, Status: 'Signed', Signed_Date: signedDate.toISOString().slice(0, 10) })
      const days = businessDaysBetween(deliveredDate, signedDate)
      if (days > 5) raiseAlert(orgId, clientId, projectId, 'BR-13', `${days} business days elapsed since package delivery (SLA: 5).`)
      addArtifact(orgId, clientId, projectId, 'OC-30', { Handoff_Package_ID: `HP-${projectId.slice(0, 6)}`, Delivered_Date: deliveredDate.toISOString().slice(0, 10), Format: 'Word' })
      addArtifact(orgId, clientId, projectId, 'OC-31', { Development_Backlog_Item_ID: `BL-${projectId.slice(0, 6)}-01`, Priority: 'High' })
    }
    count++
  }
  console.log(`Seeded ${CLIENT_BLUEPRINTS.length} clients and ${count} example projects.`)
}

main()
