import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import Badge from './Badge.jsx'

/**
 * Governed AI suggestion widget (Module 17 pattern), reusable across modules.
 * Renders nothing but a disabled notice if the use case isn't activated for this scope.
 * Every suggestion is generated on demand, labeled, and requires an explicit
 * human decision (accept / edit&accept / reject) which is written to the AI usage log.
 */
export default function AiSuggestionBox({ useCaseId, orgId, projectId, buildSuggestion, onAccept, tier, ucName }) {
  const { t } = useI18n()
  const { data, logAiUsage } = useAppState()
  const [suggestion, setSuggestion] = useState(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [resolved, setResolved] = useState(null) // 'accepted' | 'edited' | 'rejected'

  const orgActive = data.aiOrgActivation[orgId]?.[useCaseId]
  const projectOverride = projectId ? data.aiProjectOverride[projectId]?.[useCaseId] : undefined
  const active = projectId ? (projectOverride ?? orgActive) : orgActive

  if (!active) {
    return (
      <div className="rounded-lg border border-dashed border-brand-100 bg-brand-50/40 px-3 py-2 text-xs text-ink/40">
        {ucName || useCaseId} — not activated for this scope. An Organization Admin can enable it in M17.
      </div>
    )
  }

  function handleGenerate() {
    const s = buildSuggestion()
    setSuggestion(s)
    setDraft(s)
    setResolved(null)
    setEditing(false)
  }

  function record(outcome, finalValue) {
    logAiUsage({ useCaseId, orgId, cmProjectId: projectId, outputSummary: finalValue, outcome, user: 'You (current session)' })
    setResolved(outcome)
    if (outcome !== 'rejected') onAccept?.(finalValue)
  }

  return (
    <div className="rounded-lg border border-sand-200 bg-sand-50/60 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <Badge tone="sand">{t('aiGenerated')}</Badge>
        <span className="text-[10px] uppercase tracking-wide text-sand-700 font-semibold">
          {tier === 'augmented' ? t('tier_augmented') : t('tier_assistive')}
        </span>
      </div>
      {!suggestion && (
        <button className="btn-secondary text-xs" onClick={handleGenerate}>
          {t('generate')} — {ucName}
        </button>
      )}
      {suggestion && (
        <div className="space-y-2">
          {editing ? (
            <textarea className="input text-sm" rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} />
          ) : (
            <p className="text-sm text-ink/80 italic">"{draft}"</p>
          )}
          {!resolved && (
            <div className="flex items-center gap-2 flex-wrap">
              {!editing ? (
                <>
                  <button className="btn-primary text-xs" onClick={() => record('accepted', draft)}>
                    {t('accept')}
                  </button>
                  <button className="btn-secondary text-xs" onClick={() => setEditing(true)}>
                    {t('edit')}
                  </button>
                  <button className="btn-danger text-xs" onClick={() => record('rejected', draft)}>
                    {t('reject')}
                  </button>
                </>
              ) : (
                <button className="btn-primary text-xs" onClick={() => record('edited', draft)}>
                  {t('save')}
                </button>
              )}
              <button className="btn-ghost text-xs" onClick={handleGenerate}>
                {t('generate')}
              </button>
            </div>
          )}
          {resolved && <Badge tone={resolved === 'rejected' ? 'red' : 'green'}>{t(`outcome_${resolved}`)}</Badge>}
        </div>
      )}
    </div>
  )
}
