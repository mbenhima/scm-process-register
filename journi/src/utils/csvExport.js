// D08 (partial closure): client-side CSV export for key reports — journi has no
// backend to generate server-side Excel/PDF exports, so this is the proportionate
// equivalent: a Blob-based CSV download built and triggered entirely in the browser.
function escapeCsvValue(value) {
  const s = value === null || value === undefined ? '' : String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** columns: [{ label, value }] where value is a field key or a (row) => cell function. */
export function toCsv(rows, columns) {
  const header = columns.map((c) => escapeCsvValue(c.label)).join(',')
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsvValue(typeof c.value === 'function' ? c.value(row) : row[c.value])).join(','),
  )
  return [header, ...lines].join('\n')
}

export function downloadCsv(filename, csvString) {
  const blob = new Blob(['﻿' + csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportToCsv(filename, rows, columns) {
  downloadCsv(filename, toCsv(rows, columns))
}
