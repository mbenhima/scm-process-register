import React from 'react'
import { useI18n } from '../i18n/index.jsx'
import { exportToCsv } from '../utils/csvExport.js'

export default function ExportCsvButton({ filename, rows, columns, label }) {
  const { t } = useI18n()
  const disabled = !rows || rows.length === 0
  return (
    <button
      className="btn-secondary text-xs"
      disabled={disabled}
      onClick={() => exportToCsv(filename, rows, columns)}
      title={disabled ? t('noData') : undefined}
    >
      ⬇ {label || t('exportCsv')}
    </button>
  )
}
