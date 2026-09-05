import React from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useScopedProject } from '../utils/useScoped.js'

export default function RequireProject({ children }) {
  const { t } = useI18n()
  const project = useScopedProject()
  if (!project) {
    return (
      <div className="card p-8 text-center text-ink/50">
        {t('selectProject')} — {t('scope')} ({t('organization')} → {t('project')})
      </div>
    )
  }
  return children(project)
}
