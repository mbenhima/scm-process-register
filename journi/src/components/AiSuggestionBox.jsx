import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { providerLabel } from '../utils/llmProviders.js'
import { aiSuggest } from '../utils/api.js'
import Badge from './Badge.jsx'

/**
 * Governed AI suggestion widget (Module 6 pattern), reusable across modules.
 * Renders nothing but a disabled notice if the use case isn't activated for this scope.
 * Every suggestion is generated on demand, labeled, and requires an explicit
 * human decision (accept / edit&accept / reject) which is written to the AI usage log.
 *
 * Three-tier fallback, in order, so the box never breaks even if a layer is
 * unavailable:
 *   1. The backend's RAG pipeline (server/routes/aiSuggest.js) — retrieves
 *      journi's own methodology definitions before generating, so the
 *      output stays grounded in journi's actual ADKAR/Bridges/Kübler-Ross/
 *      Lewin vocabulary. Works even without a Module 6 connection if the
 *      server has its own ANTHROPIC_API_KEY configured.
 *   2. If the backend is unreachable (or has no LLM available either), and
 *      a provider is connected on Module 6: the direct browser-to-provider
 *      call this box always used before the backend existed.
 *   3. The catalog's own built-in canned example (`buildSuggestion()`).
 */
export default function AiSuggestionBox({ useCaseId, orgId, projectId, buildSuggestion, onAccept, tier, ucName, description, promptContext }) {
  const { t } = useI18n()
  const { data, llmConfig, generateWithLlm, logAiUsage } = useAppState()
  const [suggestion, setSuggestion] = useState(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [resolved, setResolved] = useState(null) // 'accepted' | 'edited' | 'rejected'
  const [loading, setLoading] = useState(false)
  const [genError, setGenError] = useState(null)
  const [source, setSource] = useState(null) // 'rag' | 'llm' | 'template'
  const [ragSources, setRagSources] = useState([])

  const catalogEntry = data.aiUseCaseCatalog.find((uc) => uc.id === useCaseId)
  const orgActive = data.aiOrgActivation[orgId]?.[useCaseId]
  const projectOverride = projectId ? data.aiProjectOverride[projectId]?.[useCaseId] : undefined
  const active = projectId ? (projectOverride ?? orgActive) : orgActive

  if (!active) {
    return (
      <div className="rounded-lg border border-dashed border-brand-100 bg-brand-50/40 px-3 py-2 text-xs text-ink/40">
        {ucName || useCaseId} — not activated for this scope. An Organization Admin can enable it in M6.
      </div>
    )
  }

  function settle(text, src, sources = []) {
    setSuggestion(text)
    setDraft(text)
    setResolved(null)
    setEditing(false)
    setSource(src)
    setRagSources(sources)
  }

  async function handleGenerate() {
    setGenError(null)
    setLoading(true)

    // Tier 1: the backend's RAG pipeline — grounds the output in journi's
    // own methodology definitions, and works even without a Module 6
    // connection if the server has its own fallback key configured.
    const llm = llmConfig.connected ? { provider: llmConfig.provider, apiKey: llmConfig.apiKey, model: llmConfig.model, baseUrl: llmConfig.baseUrl } : undefined
    const rag = await aiSuggest(useCaseId, promptContext || description, llm)
    if (rag.reachable && rag.text) {
      settle(rag.text, 'rag', rag.sources || [])
      setLoading(false)
      return
    }

    // Tier 2: the direct browser-to-provider call this box always used
    // before the backend existed — still real generation, just ungrounded.
    if (llmConfig.connected) {
      try {
        const prompt =
          promptContext ||
          catalogEntry?.promptTemplate ||
          `You are the "${ucName}" AI use case in a change-management platform. ${description || ''} Produce a realistic, concise example output (under 80 words), in plain prose, no preamble.`
        const s = await generateWithLlm(prompt)
        settle(s, 'llm')
        setLoading(false)
        return
      } catch (err) {
        setGenError(`${providerLabel(llmConfig.provider)} error — showing the built-in example instead. (${err.message})`)
      }
    } else if (!rag.reachable) {
      setGenError(null) // backend down + no Module 6 connection: the template fallback below is the expected path, not an error
    } else if (rag.generationError) {
      setGenError(`${rag.generationError.message} — showing the built-in example instead.`)
    }

    // Tier 3: the catalog's own built-in canned example.
    settle(buildSuggestion(), 'template')
    setLoading(false)
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
        <button className="btn-secondary text-xs" onClick={handleGenerate} disabled={loading}>
          {loading ? t('generating') : `${t('generate')} — ${ucName}`}
        </button>
      )}
      {genError && <p className="text-[11px] text-red-600">{genError}</p>}
      {suggestion && (
        <div className="space-y-2">
          {source && (
            <span className="text-[10px] text-ink/40">
              {source === 'rag'
                ? `Grounded (RAG) · ${providerLabel(llmConfig.provider) || 'server-configured provider'}`
                : source === 'llm'
                  ? `Generated by ${providerLabel(llmConfig.provider)}`
                  : 'Built-in example (no LLM connected)'}
            </span>
          )}
          {source === 'rag' && ragSources.length > 0 && (
            <details className="text-[10px] text-ink/50">
              <summary className="cursor-pointer select-none">Retrieved grounding ({ragSources.length})</summary>
              <ul className="mt-1 space-y-0.5 ps-3 list-disc">
                {ragSources.map((s) => (
                  <li key={s.id}>{s.text}</li>
                ))}
              </ul>
            </details>
          )}
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
              <button className="btn-ghost text-xs" onClick={handleGenerate} disabled={loading}>
                {loading ? 'Generating…' : t('generate')}
              </button>
            </div>
          )}
          {resolved && <Badge tone={resolved === 'rejected' ? 'red' : 'green'}>{t(`outcome_${resolved}`)}</Badge>}
        </div>
      )}
    </div>
  )
}
