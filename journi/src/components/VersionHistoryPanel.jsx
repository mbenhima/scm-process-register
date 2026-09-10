import React from 'react'
import { useI18n } from '../i18n/index.jsx'

/**
 * Renders an entity's version timeline (newest first) with an optional
 * "Revert to this version" action on every row except the current one.
 * Works for any entity shaped by utils/versioning.js (version + versionHistory).
 */
export default function VersionHistoryPanel({ entity, onRevert, canRevert }) {
  const { t } = useI18n()
  const history = entity.versionHistory || []
  const rows = [...history, { version: entity.version || 1, savedAt: null, note: t('versionCurrent') }].sort((a, b) => b.version - a.version)

  return (
    <div className="space-y-1.5 rounded-lg bg-brand-50/40 p-3">
      <div className="text-xs font-semibold text-brand-950">{t('versionHistory')}</div>
      {rows.map((r) => (
        <div key={r.version} className="flex items-center justify-between gap-2 text-xs border-t border-brand-100/70 pt-1.5 first:border-0 first:pt-0">
          <div>
            <span className="font-mono text-ink/60">v{r.version}</span>{' '}
            <span className="text-ink/60">{r.note}</span>
            {r.savedAt && <span className="text-ink/30"> · {new Date(r.savedAt).toLocaleString()}</span>}
          </div>
          {canRevert && r.version !== entity.version && (
            <button className="btn-ghost text-[11px] py-0.5 px-2 shrink-0" onClick={() => onRevert(r.version)}>
              {t('versionRevert')}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
