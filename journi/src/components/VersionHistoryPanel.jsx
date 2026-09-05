import React from 'react'

/**
 * Renders an entity's version timeline (newest first) with an optional
 * "Revert to this version" action on every row except the current one.
 * Works for any entity shaped by utils/versioning.js (version + versionHistory).
 */
export default function VersionHistoryPanel({ entity, onRevert, canRevert }) {
  const history = entity.versionHistory || []
  const rows = [...history, { version: entity.version || 1, savedAt: null, note: 'Current version' }].sort((a, b) => b.version - a.version)

  return (
    <div className="space-y-1.5 rounded-lg bg-brand-50/40 p-3">
      <div className="text-xs font-semibold text-brand-950">Version history</div>
      {rows.map((r) => (
        <div key={r.version} className="flex items-center justify-between gap-2 text-xs border-t border-brand-100/70 pt-1.5 first:border-0 first:pt-0">
          <div>
            <span className="font-mono text-brand-700">v{r.version}</span>{' '}
            <span className="text-ink/60">{r.note}</span>
            {r.savedAt && <span className="text-ink/30"> · {new Date(r.savedAt).toLocaleString()}</span>}
          </div>
          {canRevert && r.version !== entity.version && (
            <button className="btn-ghost text-[11px] py-0.5 px-2 shrink-0" onClick={() => onRevert(r.version)}>
              Revert to this version
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
