import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { useScopedProject, useOrgProjects } from '../utils/useScoped.js'
import Badge from './Badge.jsx'
import { evaluateAlerts, SEVERITY_TONE } from '../utils/alertEngine.js'

export default function NotificationBell() {
  const { t } = useI18n()
  const { dismissAlert, undismissAlert } = useAppState()
  const project = useScopedProject()
  const orgProjects = useOrgProjects(project?.orgId)
  const otherOrgProjects = project ? orgProjects.filter((p) => p.id !== project.id) : []
  const [open, setOpen] = useState(false)

  const allFiring = project ? evaluateAlerts(project, { otherOrgProjects }) : []
  const dismissedIds = new Set(project?.dismissedAlerts || [])
  const active = allFiring.filter((a) => !dismissedIds.has(a.id))
  const dismissed = allFiring.filter((a) => dismissedIds.has(a.id))

  return (
    <div className="relative">
      <button className="btn-ghost relative px-2" onClick={() => setOpen((o) => !o)} aria-label={t('notif_title')}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2.5c-2.5 0-4.2 2-4.2 4.5v2.6c0 .5-.2 1-.5 1.4l-1 1.3c-.5.6-.1 1.5.6 1.5h10.2c.7 0 1.1-.9.6-1.5l-1-1.3c-.3-.4-.5-.9-.5-1.4V7c0-2.5-1.7-4.5-4.2-4.5Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M8.3 15.8a1.9 1.9 0 0 0 3.4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        {active.length > 0 && (
          <span className="absolute top-0.5 end-0.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-red-600 text-white text-[9px] leading-[15px] text-center">
            {active.length}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute end-0 mt-2 w-96 max-h-[28rem] overflow-y-auto card p-3 z-50 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-brand-950 text-sm">{t('notif_title')}</h4>
            </div>
            {!project && <p className="text-xs text-ink/40 italic">{t('notif_select_project')}</p>}
            {project && active.length === 0 && <p className="text-xs text-ink/40 italic">{t('notif_none')}</p>}
            <div className="space-y-2">
              {active.map((a) => (
                <div key={a.id} className="rounded-lg border border-brand-100 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-brand-700">{a.id}</span>
                      <Badge tone={SEVERITY_TONE[a.severity]}>{a.severity}</Badge>
                    </div>
                    <button className="text-ink/30 hover:text-red-600 text-xs shrink-0" onClick={() => dismissAlert(project.id, a.id)}>
                      {t('notif_dismiss')}
                    </button>
                  </div>
                  <p className="text-xs font-medium text-brand-950 mt-1">{a.name}</p>
                  <p className="text-xs text-ink/60">{a.message}</p>
                  <p className="text-[10px] text-ink/30 mt-1">{a.slaThreshold} · {a.recipientRoles}</p>
                </div>
              ))}
            </div>
            {dismissed.length > 0 && (
              <div className="mt-3 pt-2 border-t border-brand-50">
                <p className="text-[10px] uppercase text-ink/30 mb-1">
                  {t('notif_dismissed')} ({dismissed.length})
                </p>
                {dismissed.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-xs text-ink/40 py-0.5 gap-2">
                    <span className="truncate">{a.name}</span>
                    <button className="text-brand-600 hover:underline shrink-0" onClick={() => undismissAlert(project.id, a.id)}>
                      {t('notif_restore')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
