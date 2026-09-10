import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { queryFeatures } from '../utils/api.js'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'

const EXAMPLES = [
  'Where do I score someone stuck on desire?',
  'How do I set up a Phase Gate?',
  'Where can I see who is on the guiding coalition?',
  'How do I connect an AI provider?',
]

export default function QueryFeaturesPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { currentUser, llmConfig } = useAppState()
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  async function ask(q) {
    const question = (q ?? '').trim()
    if (!question || loading) return
    setLoading(true)
    setResult(null)
    const llm = llmConfig?.connected ? { provider: llmConfig.provider, apiKey: llmConfig.apiKey, model: llmConfig.model, baseUrl: llmConfig.baseUrl } : undefined
    const res = await queryFeatures(question, { role: currentUser?.role }, llm)
    setResult(res)
    setLoading(false)
  }

  return (
    <div>
      <PageHeader
        title={t('navQueryFeatures')}
        description={t('queryFeaturesDesc')}
        badge={<Badge tone="brand">{t('roleFiltered')}</Badge>}
      />

      <div className="card p-4 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            ask(question)
          }}
          className="flex items-center gap-2"
        >
          <input
            className="input"
            placeholder={t('queryFeaturesPlaceholder')}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button className="btn-primary shrink-0" type="submit" disabled={loading || !question.trim()}>
            {loading ? t('generating') : t('ask')}
          </button>
        </form>

        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              className="text-xs rounded-full border border-brand-100 bg-brand-50/60 text-brand-800 px-2.5 py-1 hover:bg-brand-100"
              onClick={() => {
                setQuestion(ex)
                ask(ex)
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-ink/50 mt-4">{t('generating')}</p>}

      {result && !loading && (
        <div className="mt-4">
          {!result.reachable ? (
            <div className="card p-4 border-dashed border-red-200 bg-red-50/40">
              <p className="text-sm text-red-700 font-medium">{t('backendUnreachable')}</p>
              <p className="text-xs text-ink/50 mt-1">{t('backendUnreachableHint')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="card p-4">
                <p className="text-ink">{result.answer}</p>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {(result.sources || []).map((s) => (
                  <button
                    key={s.path}
                    className="card p-3 text-start hover:border-brand-300 transition-colors"
                    onClick={() => navigate(s.path)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {s.number && <Badge tone="sand">M{s.number}</Badge>}
                      <span className="font-semibold text-brand-900 text-sm">{s.name}</span>
                    </div>
                    <p className="text-xs text-ink/60 line-clamp-2">{s.text}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
