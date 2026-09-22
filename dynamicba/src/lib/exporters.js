// src/lib/exporters.js
// Real, pure-JS document generation for the Export & Handoff step (MP-07.7) and for the
// Reports page — Word (.docx) and Excel (.xlsx) files built entirely in the browser, no
// server round-trip, per Standard SRS NFR-DA-PORT-01 ("no native build toolchain, no
// required external service"). This directly implements FR-DA-REP-02.
import { Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell, TextRun } from 'docx'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function cell(text) {
  return new TableCell({ children: [new Paragraph(String(text ?? ''))] })
}

export async function exportHandoffPackageDocx(project, bundle) {
  const { sow, candidates, useCases, ruleSpecs, kpiSpecs, backlogItems, signOff } = bundle
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: 'DynamicBA — Technical Handoff Package', heading: HeadingLevel.TITLE }),
        new Paragraph({ text: project.name, heading: HeadingLevel.HEADING_1 }),
        new Paragraph(`Client sign-off: ${signOff?.Status || 'Pending'} ${signOff?.Signed_Date ? `(${signOff.Signed_Date})` : ''}`),
        new Paragraph({ text: '1. Statement of Work Summary', heading: HeadingLevel.HEADING_2 }),
        new Paragraph(`Objectives: ${sow?.objectives || '—'}`),
        new Paragraph(`Scope: ${sow?.scope || '—'}`),
        new Paragraph(`Deliverables: ${sow?.deliverables || '—'}`),
        new Paragraph({ text: '2. Automation Candidates', heading: HeadingLevel.HEADING_2 }),
        new Table({
          rows: [
            new TableRow({ children: [cell('Candidate'), cell('Feasibility Score')] }),
            ...candidates.map((c) => new TableRow({ children: [cell(c.Name), cell(c.Feasibility_Score)] })),
          ],
        }),
        new Paragraph({ text: '3. Use Cases', heading: HeadingLevel.HEADING_2 }),
        ...useCases.map((u) => new Paragraph(`• ${u.Name} (${u.Status})`)),
        new Paragraph({ text: '4. Business Rule Specifications', heading: HeadingLevel.HEADING_2 }),
        ...ruleSpecs.map((r) => new Paragraph(`• ${r.Business_Rule_Spec_ID} — ${r.Status}`)),
        new Paragraph({ text: '5. KPI Specifications', heading: HeadingLevel.HEADING_2 }),
        ...kpiSpecs.map((k) => new Paragraph(`• ${k.KPI_Spec_ID} — Target: ${k.Target_Value}`)),
        new Paragraph({ text: '6. Development Backlog', heading: HeadingLevel.HEADING_2 }),
        new Table({
          rows: [
            new TableRow({ children: [cell('Backlog Item'), cell('Priority')] }),
            ...backlogItems.map((b) => new TableRow({ children: [cell(b.Development_Backlog_Item_ID), cell(b.Priority)] })),
          ],
        }),
      ],
    }],
  })
  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${project.name.replace(/\s+/g, '_')}_Handoff_Package.docx`)
}

export function exportHandoffPackageXlsx(project, bundle) {
  const wb = XLSX.utils.book_new()
  const { candidates, useCases, ruleSpecs, kpiSpecs, backlogItems } = bundle
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(candidates), 'Automation Candidates')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(useCases), 'Use Cases')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ruleSpecs), 'Business Rule Specs')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpiSpecs), 'KPI Specs')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(backlogItems), 'Development Backlog')
  XLSX.writeFile(wb, `${project.name.replace(/\s+/g, '_')}_Handoff_Package.xlsx`)
}

export function exportHandoffPackagePdf(project, bundle) {
  const { candidates, useCases, kpiSpecs, signOff } = bundle
  const pdf = new jsPDF()
  pdf.setFontSize(16)
  pdf.text('DynamicBA — Technical Handoff Package', 14, 18)
  pdf.setFontSize(11)
  pdf.text(project.name, 14, 26)
  pdf.text(`Client sign-off: ${signOff?.Status || 'Pending'} ${signOff?.Signed_Date || ''}`, 14, 33)
  autoTable(pdf, { startY: 40, head: [['Automation Candidate', 'Feasibility Score']], body: candidates.map((c) => [c.Name, String(c.Feasibility_Score)]) })
  autoTable(pdf, { startY: pdf.lastAutoTable.finalY + 8, head: [['Use Case', 'Status']], body: useCases.map((u) => [u.Name, u.Status]) })
  autoTable(pdf, { startY: pdf.lastAutoTable.finalY + 8, head: [['KPI Spec', 'Target']], body: kpiSpecs.map((k) => [k.KPI_Spec_ID, k.Target_Value]) })
  pdf.save(`${project.name.replace(/\s+/g, '_')}_Handoff_Package.pdf`)
}

export function exportHandoffPackageJson(project, bundle) {
  const blob = new Blob([JSON.stringify({ project, ...bundle }, null, 2)], { type: 'application/json' })
  saveAs(blob, `${project.name.replace(/\s+/g, '_')}_Handoff_Package.json`)
}
