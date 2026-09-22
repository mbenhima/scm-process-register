// src/lib/seedDemoData.js
// Seeds the "10 example records" requested for this build: 10 realistic client
// engagements (Projects) spread across 5 demo Clients in the industries MP-02.3's
// accelerator packs name (finance, healthcare, manufacturing, retail, telecom), at
// different points in the 4-step wizard so every screen has something real to show.
// Runs client-side as the signed-in org_admin, through the exact same Firestore paths
// and rule-engine functions the UI itself uses — seeded data is produced the same way a
// real user's data would be, not hand-faked JSON.
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import {
  evaluateSowIntake, evaluateStakeholders, computeContextCompleteness, evaluateContextModel,
  computeFeasibilityScore, computeRoiModel, evaluateCandidate, businessDaysBetween,
} from './ruleEngine'
import { alertForRule } from './catalogue'

async function addArtifact(orgId, clientId, projectId, objectClassId, fields) {
  const ref = collection(db, 'organizations', orgId, 'clients', clientId, 'projects', projectId, 'artifacts', objectClassId, 'records')
  return addDoc(ref, { ...fields, createdAt: serverTimestamp() })
}

async function raiseAlert(orgId, clientId, projectId, ruleId, detail, stepId) {
  const alertDef = alertForRule(ruleId)
  if (!alertDef) return
  const ref = collection(db, 'organizations', orgId, 'clients', clientId, 'projects', projectId, 'alerts')
  return addDoc(ref, { alertId: alertDef.id, severity: alertDef.severity, escalation: alertDef.escalation, ruleId, detail, stepId: stepId || alertDef.step, read: false, raisedAt: new Date().toISOString() })
}

const CLIENT_BLUEPRINTS = [
  { key: 'meridian', name: 'Meridian Retail Group', industry: 'Retail' },
  { key: 'northgate', name: 'Northgate Health Systems', industry: 'Healthcare' },
  { key: 'atlas', name: 'Atlas Manufacturing Corp', industry: 'Manufacturing' },
  { key: 'ferrovia', name: 'Ferrovia Financial Services', industry: 'Finance' },
  { key: 'signalworks', name: 'SignalWorks Telecom', industry: 'Telecom' },
]

const PROJECT_BLUEPRINTS = [
  {
    client: 'meridian', name: 'Order-to-Cash Automation Engagement', stage: 4,
    sow: { objectives: 'Reduce order-to-cash cycle time and manual invoice touchpoints across all regional distribution centers.', scope: 'Order capture, invoicing, and accounts receivable for the North American retail division.', deliverables: 'Current-state report, automation business case, to-be design, full specification package, development backlog.', timeline: 'Kickoff Q1, specification handoff within 10 weeks.', constraints: 'Must integrate with the existing SAP ERP without a version upgrade; budget capped at $180,000.' },
    stakeholders: [['Dana Whitfield', 'Client Sponsor', 'High'], ['Priya Nandakumar', 'Process Owner', 'High'], ['Alex Ferreira', 'IT Lead', 'Medium']],
    context: { systemsCount: 6, processesCount: 5 },
    candidates: [
      { name: 'Automated 3-way invoice matching', technical: 85, dataQuality: 80, processStability: 75, strategicFit: 80, annualBenefitUsd: 120000, oneTimeCostUsd: 60000 },
      { name: 'Customer credit hold auto-release', technical: 70, dataQuality: 65, processStability: 60, strategicFit: 55, annualBenefitUsd: 40000, oneTimeCostUsd: 35000 },
    ],
    signOffDaysAgo: 10,
  },
  {
    client: 'meridian', name: 'Returns & Reverse Logistics Assessment', stage: 2,
    sow: { objectives: 'Cut return-processing turnaround time.', scope: 'In-store and online returns.', deliverables: 'Current-state report and opportunity assessment.', timeline: '', constraints: '' },
    stakeholders: [['Dana Whitfield', 'Client Sponsor', 'High']],
    context: { systemsCount: 2, processesCount: 2 },
    candidates: [],
  },
  {
    client: 'northgate', name: 'Patient Intake Digitization', stage: 4,
    sow: { objectives: 'Digitize and streamline patient intake to reduce front-desk wait times and data-entry errors across three hospital campuses.', scope: 'Patient registration, insurance verification, and consent capture at all outpatient facilities.', deliverables: 'Full specification package covering intake workflow automation with HIPAA-aligned controls.', timeline: 'Discovery in month 1, specs delivered by end of month 3.', constraints: 'Must remain compliant with HIPAA; no PHI may leave the client\'s own data center.' },
    stakeholders: [['Dr. Elaine Cho', 'Client Sponsor', 'High'], ['Marcus Ibe', 'Process Owner', 'High'], ['Renata Diaz', 'IT Lead', 'Medium'], ['Tomas Reyes', 'SME', 'Low']],
    context: { systemsCount: 4, processesCount: 3 },
    candidates: [
      { name: 'Insurance eligibility auto-verification', technical: 90, dataQuality: 85, processStability: 80, strategicFit: 85, annualBenefitUsd: 150000, oneTimeCostUsd: 70000 },
    ],
    exceptionFlow: { isAiAssisted: true, handlesSensitiveData: true },
    signOffDaysAgo: 3,
  },
  {
    client: 'northgate', name: 'Clinical Supply Chain Discovery', stage: 1,
    sow: { objectives: 'Understand current medical-supply reordering.', scope: '', deliverables: '', timeline: '', constraints: '' },
    stakeholders: [],
    candidates: [],
  },
  {
    client: 'atlas', name: 'Shop-Floor Quality Inspection Automation', stage: 3,
    sow: { objectives: 'Reduce defect escape rate by automating quality inspection data capture and disposition routing on the primary assembly line.', scope: 'Final inspection and disposition for the flagship product line at the primary plant.', deliverables: 'To-be process design, governance artifacts, and full specification package for the QA station.', timeline: 'Twelve-week engagement starting after line-shutdown week.', constraints: 'No changes to the certified inspection equipment firmware; must preserve existing audit trail format.' },
    stakeholders: [['Helena Brandt', 'Client Sponsor', 'High'], ['Oliver Kwan', 'Process Owner', 'Medium']],
    context: { systemsCount: 5, processesCount: 4 },
    candidates: [
      { name: 'Automated defect classification', technical: 65, dataQuality: 55, processStability: 70, strategicFit: 60, annualBenefitUsd: 90000, oneTimeCostUsd: 85000 },
    ],
    control: { type: 'Preventive', linkedToFinancialAction: false },
  },
  {
    client: 'atlas', name: 'Supplier Onboarding Streamlining', stage: 2,
    sow: { objectives: 'Speed up new-supplier onboarding and reduce compliance follow-up cycles across procurement.', scope: 'Supplier qualification, contract intake, and compliance document collection.', deliverables: 'Current-state report and prioritized opportunity list.', timeline: 'Six-week discovery sprint.', constraints: 'Onboarding must stay compliant with the client\'s existing vendor-risk policy.' },
    stakeholders: [['Helena Brandt', 'Client Sponsor', 'High'], ['Grace Oduya', 'Process Owner', 'Medium']],
    context: { systemsCount: 3, processesCount: 3 },
    candidates: [
      { name: 'Automated compliance document checklist', technical: 60, dataQuality: 60, processStability: 65, strategicFit: 50, annualBenefitUsd: 35000, oneTimeCostUsd: 40000 },
    ],
  },
  {
    client: 'ferrovia', name: 'KYC Onboarding Acceleration', stage: 4,
    sow: { objectives: 'Reduce Know-Your-Customer onboarding time for retail banking customers while preserving full regulatory audit trail.', scope: 'Retail account opening KYC checks across all branch and digital channels.', deliverables: 'Full specification package including business rule decision tables and audit controls.', timeline: 'Eight-week engagement culminating in signed-off specs.', constraints: 'Must satisfy the regulator\'s data-residency requirement; human sign-off mandatory on any flagged case.' },
    stakeholders: [['Isabelle Laurent', 'Client Sponsor', 'High'], ['Naveen Kapoor', 'Process Owner', 'High'], ['Sofia Marchetti', 'IT Lead', 'Medium']],
    context: { systemsCount: 7, processesCount: 6 },
    candidates: [
      { name: 'Automated document authenticity check', technical: 88, dataQuality: 82, processStability: 78, strategicFit: 90, annualBenefitUsd: 200000, oneTimeCostUsd: 95000 },
      { name: 'Sanctions-list screening bot', technical: 92, dataQuality: 88, processStability: 85, strategicFit: 88, annualBenefitUsd: 160000, oneTimeCostUsd: 80000 },
    ],
    exceptionFlow: { isAiAssisted: true, handlesSensitiveData: true },
    control: { type: 'Preventive', linkedToFinancialAction: true },
    signOffDaysAgo: 1,
  },
  {
    client: 'ferrovia', name: 'Vague-Scope Fraud Ops Assessment', stage: 1, vague: true,
    sow: { objectives: 'Look at fraud stuff.', scope: '', deliverables: 'TBD', timeline: '', constraints: '' },
    stakeholders: [],
    candidates: [],
  },
  {
    client: 'signalworks', name: 'Network Fault Triage Automation', stage: 3,
    sow: { objectives: 'Automate first-line triage of network fault tickets to cut mean-time-to-resolution for the field operations team.', scope: 'Tier-1 fault triage and dispatch across the regional access network.', deliverables: 'To-be design and governance artifacts for the automated triage workflow.', timeline: 'Ten-week engagement with a two-week pilot extension.', constraints: 'Must interoperate with the existing OSS ticketing platform without a data-model change.' },
    stakeholders: [['Karim El-Sayed', 'Client Sponsor', 'High'], ['Line Bergström', 'Process Owner', 'Medium']],
    context: { systemsCount: 4, processesCount: 3 },
    candidates: [
      { name: 'Automated fault classification & routing', technical: 80, dataQuality: 75, processStability: 70, strategicFit: 75, annualBenefitUsd: 110000, oneTimeCostUsd: 65000 },
    ],
  },
  {
    client: 'signalworks', name: 'Customer Churn Early-Warning Discovery', stage: 2,
    sow: { objectives: 'Identify early indicators of customer churn to enable proactive retention outreach across the postpaid mobile segment.', scope: 'Customer usage, billing, and support-ticket data for postpaid mobile subscribers.', deliverables: 'Current-state report and automation opportunity assessment.', timeline: 'Six-week discovery phase.', constraints: 'Customer data use must remain within the client\'s existing consent framework.' },
    stakeholders: [['Karim El-Sayed', 'Client Sponsor', 'High']],
    context: { systemsCount: 3, processesCount: 2 },
    candidates: [
      { name: 'Churn risk scoring model', technical: 55, dataQuality: 50, processStability: 60, strategicFit: 65, annualBenefitUsd: 70000, oneTimeCostUsd: 75000 },
    ],
  },
]

export async function seedDemoData(orgId, onProgress) {
  const clientIds = {}
  for (const cb of CLIENT_BLUEPRINTS) {
    const ref = await addDoc(collection(db, 'organizations', orgId, 'clients'), { name: cb.name, industry: cb.industry, deleted: false, createdAt: serverTimestamp() })
    clientIds[cb.key] = ref.id
    onProgress?.(`Created client ${cb.name}`)
  }

  let count = 0
  for (const pb of PROJECT_BLUEPRINTS) {
    const clientId = clientIds[pb.client]
    const status = pb.stage === 4 ? 'completed' : pb.stage >= 2 ? 'in_progress' : 'not_started'
    const projRef = await addDoc(collection(db, 'organizations', orgId, 'clients', clientId, 'projects'), {
      name: pb.name, clientId, status, currentStep: pb.stage, deleted: false, createdAt: serverTimestamp(),
    })
    const projectId = projRef.id

    // MP-01
    const stakeholderRecords = []
    for (const [Name, Role, Influence_Level] of pb.stakeholders) {
      stakeholderRecords.push({ Name, Role, Influence_Level })
      await addArtifact(orgId, clientId, projectId, 'OC-05', { Stakeholder_ID: `STK-${Math.random().toString(36).slice(2, 9)}`, Name, Role, Influence_Level })
    }
    const { completeness, findings } = evaluateSowIntake({ ...pb.sow, stakeholdersText: stakeholderRecords.map((s) => s.Name + s.Role).join(' ') })
    await addArtifact(orgId, clientId, projectId, 'OC-01', {
      SOW_ID: `SOW-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(count + 1).padStart(3, '0')}`,
      Status: completeness >= 70 ? 'Quality-Checked' : 'Ingested', Completeness_Score: completeness, Signed_Date: new Date().toISOString().slice(0, 10), ...pb.sow,
    })
    for (const f of [...findings, ...evaluateStakeholders(stakeholderRecords)]) await raiseAlert(orgId, clientId, projectId, f.ruleId, f.detail, 'MP-01.5')

    if (pb.stage >= 2) {
      const ctxCompleteness = computeContextCompleteness({ stakeholders: stakeholderRecords, ...pb.context })
      await addArtifact(orgId, clientId, projectId, 'OC-08', { Context_Model_ID: `CTX-${projectId.slice(0, 6)}`, Completeness_Score: ctxCompleteness, Approved_Date: new Date().toISOString().slice(0, 10) })
      for (const f of evaluateContextModel({ completeness: ctxCompleteness })) await raiseAlert(orgId, clientId, projectId, f.ruleId, f.detail, 'MP-02.6')

      for (const cand of pb.candidates) {
        const feasibilityScore = computeFeasibilityScore(cand)
        const roi = computeRoiModel(cand)
        const candId = `CAND-${Math.random().toString(36).slice(2, 9)}`
        await addArtifact(orgId, clientId, projectId, 'OC-15', { Automation_Candidate_ID: candId, Name: cand.name, Feasibility_Score: feasibilityScore })
        await addArtifact(orgId, clientId, projectId, 'OC-17', { ROI_Model_ID: `ROI-${candId}`, Payback_Months: roi.paybackMonths, NPV: roi.npv })
        await addArtifact(orgId, clientId, projectId, 'OC-16', { Feasibility_Assessment_ID: `FA-${candId}`, Data_Availability_Rating: 'Medium' })
        for (const f of evaluateCandidate({ feasibilityScore, paybackMonths: roi.paybackMonths })) await raiseAlert(orgId, clientId, projectId, f.ruleId, f.detail, 'MP-04.5')
      }
    }

    if (pb.stage >= 3) {
      await addArtifact(orgId, clientId, projectId, 'OC-18', { To_Be_Process_Map_ID: `TBM-${projectId.slice(0, 6)}`, Version: '1.0', Status: 'Approved' })
      await addArtifact(orgId, clientId, projectId, 'OC-19', { Use_Case_ID: `UC-${projectId.slice(0, 6)}`, Name: `${pb.name} — primary flow`, Status: 'Approved' })
      if (pb.exceptionFlow) {
        await addArtifact(orgId, clientId, projectId, 'OC-20', { Exception_Flow_ID: `EF-${projectId.slice(0, 6)}`, Human_Checkpoint_Required: pb.exceptionFlow.isAiAssisted && pb.exceptionFlow.handlesSensitiveData })
      }
      if (pb.control) {
        await addArtifact(orgId, clientId, projectId, 'OC-23', { Control_Spec_ID: `CS-${projectId.slice(0, 6)}`, Type: pb.control.type })
      }
      await addArtifact(orgId, clientId, projectId, 'OC-22', { Business_Rule_Spec_ID: `BRS-${projectId.slice(0, 6)}`, Status: 'Specified' })
      await raiseAlert(orgId, clientId, projectId, 'BR-11', "Formula_ID not yet present in Document 2's Formula Registry — flagged pending, not fabricated.", 'MP-06.2')
      await addArtifact(orgId, clientId, projectId, 'OC-25', { KPI_Spec_ID: `KPIS-${projectId.slice(0, 6)}`, Target_Value: '>= 80%' })
      await addArtifact(orgId, clientId, projectId, 'OC-28', { Traceability_Link_ID: `TL-${projectId.slice(0, 6)}`, Coverage_Percent: 100, Source_Paragraph_Ref: 'SOW §2.1' })
    }

    if (pb.stage >= 4) {
      await addArtifact(orgId, clientId, projectId, 'OC-29', { Spec_Package_ID: `SPKG-${projectId.slice(0, 6)}`, Section_Count: 6 })
      const deliveredDate = new Date(Date.now() - (pb.signOffDaysAgo + 2) * 24 * 3600 * 1000)
      await setDoc(doc(db, 'organizations', orgId, 'clients', clientId, 'projects', projectId), { packageDeliveredDate: deliveredDate.toISOString(), signOffSponsor: pb.stakeholders[0]?.[0] }, { merge: true })
      const signedDate = new Date(Date.now() - pb.signOffDaysAgo * 24 * 3600 * 1000)
      await addArtifact(orgId, clientId, projectId, 'OC-32', { Client_SignOff_ID: `SIGN-${projectId.slice(0, 6)}`, Status: 'Signed', Signed_Date: signedDate.toISOString().slice(0, 10) })
      const days = businessDaysBetween(deliveredDate, signedDate)
      if (days > 5) await raiseAlert(orgId, clientId, projectId, 'BR-13', `${days} business days elapsed since package delivery (SLA: 5).`, 'MP-07.5')
      await addArtifact(orgId, clientId, projectId, 'OC-30', { Handoff_Package_ID: `HP-${projectId.slice(0, 6)}`, Delivered_Date: deliveredDate.toISOString().slice(0, 10), Format: 'Word' })
      await addArtifact(orgId, clientId, projectId, 'OC-31', { Development_Backlog_Item_ID: `BL-${projectId.slice(0, 6)}-01`, Priority: 'High' })
      await setDoc(doc(db, 'organizations', orgId, 'clients', clientId, 'projects', projectId), { hoursSaved: 55 + Math.round(Math.random() * 20) }, { merge: true })
    }

    count++
    onProgress?.(`Seeded project ${count}/10: ${pb.name}`)
  }
}
