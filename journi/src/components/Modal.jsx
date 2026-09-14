import React from 'react'
import { useI18n } from '../i18n/index.jsx'

export default function Modal({ open, onClose, title, children, footer }) {
  const { t } = useI18n()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-100 sticky top-0 bg-white">
          <h2 className="font-semibold text-brand-950">{title}</h2>
          <button onClick={onClose} className="text-ink/40 hover:text-ink text-xl leading-none" aria-label={t('close')}>
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-brand-100 flex justify-end gap-2 sticky bottom-0 bg-white">{footer}</div>}
      </div>
    </div>
  )
}
