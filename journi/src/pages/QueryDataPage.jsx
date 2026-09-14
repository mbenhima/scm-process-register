import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { queryData } from '../utils/api.js'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import EmptyState from '../components/EmptyState.jsx'

const EXAMPLES = [
  'How many active projects are there?',
  'How many open resistance log entries are there?',
  'What alerts are currently firing?',
  'What is the average ADKAR score across my projects?',
]

export default function QueryDataPage() {
  const { t } = useI18n()
  const { currentUser, data, llmConfig } = useAppState()
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])

  async function ask(q) {
    const question = (q ?? '').trim()
    if (!question || loading) return
    setLoading(true)
    setResult(null)
    const user = { role: currentUser?.role, scopeType: currentUser?.scopeType, scopeId: currentUser?.scopeId }
    const llm = llmConfig?.connected ? { provider: llmConfig.provider, apiKey: llmConfig.apiKey, model: llmConfig.model, baseUrl: llmConfig.baseUrl } : undefined
    const res = await queryData(question, user, data, llm)
    setResult(res)
    setHistory((h) => [{ question, res }, ...h].slice(0, 10))
    setLoading(false)
  }

  return (
    <div>
      <PageHeader
        title={t('navQueryData')}
        description={t('queryDataDesc')}
        badge={<Badge tone="brand">{t('rbacScoped')}</Badge>}
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
            placeholder={t('queryDataPlaceholder')}
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

      {result && !loading && <ResultCard result={result} />}

      {history.length > 1 && (
        <div className="mt-6">
          <div className="label mb-2">{t('previousQuestions')}</div>
          <div className="space-y-3">
            {history.slice(1).map((h, i) => (
              <div key={i} className="opacity-70">
                <p className="text-sm font-medium text-ink/70 mb-1">{h.question}</p>
                <ResultCard result={h.res} compact />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ResultCard({ result, compact }) {
  const { t } = useI18n()

  if (!result.reachable) {
    return (
      <div className="card p-4 border-dashed border-red-200 bg-red-50/40">
        <p className="text-sm text-red-700 font-medium">{t('backendUnreachable')}</p>
        <p className="text-xs text-ink/50 mt-1">{t('backendUnreachableHint')}</p>
      </div>
    )
  }

  return (
    <div className={`card ${compact ? 'p-3' : 'p-4'} space-y-3`}>
      <div className="flex items-center justify-between gap-2">
        <Badge tone={result.mode === 'aggregate' ? 'green' : result.mode === 'retrieval' ? 'brand' : 'gray'}>
          {result.mode === 'aggregate' ? t('modeAggregate') : result.mode === 'retrieval' ? t('modeRetrieval') : t('modeNone')}
        </Badge>
        {result.generationError && <span className="text-[10px] text-ink/40">{t('generationUnavailable')}</span>}
      </div>
      <p className={`text-ink ${compact ? 'text-sm' : ''}`}>{result.answer || t('noData')}</p>
      {!!result.sources?.length && (
        <div>
          <div className="label mb-1">{t('sources')}</div>
          <ul className="space-y-1">
            {result.sources.slice(0, compact ? 3 : 8).map((s, i) => (
              <li key={s.id || i} className="text-xs text-ink/60 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-300 shrink-0" />
                {s.label || s.id}
                {typeof s.score === 'number' && <span className="text-ink/30">({s.score})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.sources && result.sources.length === 0 && !result.fact && <EmptyState text={t('noData')} />}
    </div>
  )
}
