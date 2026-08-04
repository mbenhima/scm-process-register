import React from 'react'
import { useI18n } from '../i18n/index.jsx'

export default function EmptyState({ text }) {
  const { t } = useI18n()
  return <div className="text-sm text-ink/40 italic py-6 text-center border border-dashed border-brand-100 rounded-lg">{text || t('noData')}</div>
}
