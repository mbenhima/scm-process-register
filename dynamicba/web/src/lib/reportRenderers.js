// src/lib/reportRenderers.js
// Renders the neutral block list from reportContent.js into a branded Word document or
// a PDF, so both formats always carry the same content (the user-reported thinness of
// the previous export affected both formats identically — fixed once, here, for both).
import { Packer } from 'docx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { h1, h2, h3, pPara, bullet, caption, pageBreak, brandTable, buildBrandedDocument, COLOR, FONT } from './docBrand'

export async function renderBlocksToDocxFile(blocks, meta, filename) {
  const children = []
  for (const block of blocks) {
    if (block.type === 'h1') children.push(h1(block.text))
    else if (block.type === 'h2') children.push(h2(block.text))
    else if (block.type === 'h3') children.push(h3(block.text))
    else if (block.type === 'p') children.push(pPara(block.text))
    else if (block.type === 'caption') children.push(caption(block.text))
    else if (block.type === 'bullets') block.items.forEach((i) => children.push(bullet(i)))
    else if (block.type === 'table') children.push(brandTable(block.headers, block.rows, block.widths))
    else if (block.type === 'pagebreak') children.push(pageBreak())
  }
  const doc = buildBrandedDocument({ ...meta, children })
  const blob = await Packer.toBlob(doc)
  saveAs(blob, filename)
}

const PDF_MARGIN = 40
const PDF_WIDTH = 595 - PDF_MARGIN * 2 // A4 pt width minus margins

export function renderBlocksToPdfFile(blocks, meta, filename) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  let y = PDF_MARGIN

  function ensureSpace(needed) {
    if (y + needed > 800) { pdf.addPage(); y = PDF_MARGIN }
  }
  function writeCover() {
    pdf.setFont('times', 'bold'); pdf.setFontSize(22); pdf.setTextColor(58, 58, 60)
    pdf.text('POWERACT CONSULTING', 297, 220, { align: 'center' })
    pdf.setFontSize(28); pdf.setTextColor(224, 123, 0)
    pdf.text(meta.title, 297, 280, { align: 'center' })
    pdf.setFontSize(16); pdf.setTextColor(58, 58, 60)
    pdf.text(meta.subtitle, 297, 310, { align: 'center' })
    pdf.setFont('times', 'normal'); pdf.setFontSize(11); pdf.setTextColor(88, 89, 91)
    const rows = [`Client: ${meta.client}`, `Project: ${meta.project}`, `Prepared for: ${meta.preparedFor}`, `Prepared by: ${meta.preparedBy}`, `Date: ${meta.date}`, `Sign-Off Status: ${meta.status}`]
    rows.forEach((r, i) => pdf.text(r, 297, 380 + i * 20, { align: 'center' }))
    pdf.addPage()
    y = PDF_MARGIN
  }

  writeCover()

  for (const block of blocks) {
    if (block.type === 'pagebreak') { pdf.addPage(); y = PDF_MARGIN; continue }
    if (block.type === 'h1') {
      ensureSpace(40)
      pdf.setFont('times', 'bold'); pdf.setFontSize(16); pdf.setTextColor(224, 123, 0)
      pdf.text(block.text, PDF_MARGIN, y)
      pdf.setDrawColor(224, 123, 0); pdf.line(PDF_MARGIN, y + 4, 595 - PDF_MARGIN, y + 4)
      y += 26
    } else if (block.type === 'h2') {
      ensureSpace(30)
      pdf.setFont('times', 'bold'); pdf.setFontSize(13); pdf.setTextColor(58, 58, 60)
      pdf.text(block.text, PDF_MARGIN, y)
      y += 20
    } else if (block.type === 'h3') {
      ensureSpace(26)
      pdf.setFont('times', 'bold'); pdf.setFontSize(11); pdf.setTextColor(224, 123, 0)
      pdf.text(block.text, PDF_MARGIN, y)
      y += 18
    } else if (block.type === 'p' || block.type === 'caption') {
      pdf.setFont('times', block.type === 'caption' ? 'italic' : 'normal'); pdf.setFontSize(10); pdf.setTextColor(88, 89, 91)
      const lines = pdf.splitTextToSize(block.text, PDF_WIDTH)
      for (const line of lines) {
        ensureSpace(14)
        pdf.text(line, PDF_MARGIN, y)
        y += 13
      }
      y += 6
    } else if (block.type === 'bullets') {
      pdf.setFont('times', 'normal'); pdf.setFontSize(10); pdf.setTextColor(88, 89, 91)
      for (const item of block.items) {
        const lines = pdf.splitTextToSize(`• ${item}`, PDF_WIDTH - 10)
        for (const line of lines) {
          ensureSpace(14)
          pdf.text(line, PDF_MARGIN + 6, y)
          y += 13
        }
      }
      y += 6
    } else if (block.type === 'table') {
      autoTable(pdf, {
        startY: y,
        margin: { left: PDF_MARGIN, right: PDF_MARGIN },
        head: [block.headers],
        body: block.rows,
        styles: { font: 'times', fontSize: 8, textColor: [88, 89, 91], cellPadding: 3 },
        headStyles: { fillColor: [248, 147, 29], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [242, 242, 243] },
      })
      y = pdf.lastAutoTable.finalY + 14
    }
  }

  pdf.save(filename)
}
