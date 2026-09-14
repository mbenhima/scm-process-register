import React, { useState, useRef, useEffect } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { chatbotAsk } from '../utils/api.js'

// D-Config item 2: "Ask journi" — a floating, persistent chatbot available
// from every screen (mounted once in Layout.jsx), unlike Query Data/Query
// Features which only exist as dedicated pages. It calls the same backend
// (server/routes/chatbot.js) that merges tenant-record retrieval, the
// module-feature catalog, and the seeded per-process knowledge base — so it
// can answer both "how many risks are open" and "how do I run a stakeholder
// assessment" in one place. Assistive tier only: it explains and points,
// it never performs an action on the user's behalf (see AI Use Case
// Library's governance model, Module16Page.jsx).
export default function ChatbotWidget() {
  const { t } = useI18n()
  const { currentUser, data, llmConfig } = useAppState()
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([]) // { role: 'user'|'assistant', text, sources? }
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, open])

  if (!currentUser) return null

  async function ask(q) {
    const text = (q ?? '').trim()
    if (!text || loading) return
    setLoading(true)
    setQuestion('')
    const nextMessages = [...messages, { role: 'user', text }]
    setMessages(nextMessages)
    const user = { role: currentUser?.role, scopeType: currentUser?.scopeType, scopeId: currentUser?.scopeId }
    const llm = llmConfig?.connected ? { provider: llmConfig.provider, apiKey: llmConfig.apiKey, model: llmConfig.model, baseUrl: llmConfig.baseUrl } : undefined
    const history = nextMessages.slice(-7, -1).map((m) => ({ role: m.role, text: m.text }))
    const res = await chatbotAsk(text, history, user, data, llm)
    setMessages((m) => [
      ...m,
      res.reachable === false
        ? { role: 'assistant', text: t('backendUnreachable') }
        : { role: 'assistant', text: res.answer || t('noData'), sources: res.sources },
    ])
    setLoading(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed z-40 bottom-5 end-5 w-14 h-14 rounded-full bg-brand-600 text-white shadow-lg flex items-center justify-center hover:bg-brand-700 transition-colors"
        aria-label={t('chatbot_open')}
      >
        {open ? (
          <span className="text-2xl leading-none">×</span>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8-1.06 0-2.077-.16-3.02-.457L3 20l1.457-4.365C3.535 14.427 3 13.257 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed z-40 bottom-24 end-5 w-[calc(100vw-2.5rem)] max-w-sm h-[28rem] card p-0 flex flex-col shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-100 bg-brand-600 text-white flex items-center justify-between shrink-0">
            <div>
              <div className="font-semibold text-sm">{t('chatbot_title')}</div>
              <div className="text-[11px] text-white/70">{t('chatbot_subtitle')}</div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-surface">
            {messages.length === 0 && <p className="text-xs text-ink/40 italic">{t('chatbot_empty_hint')}</p>}
            {messages.map((m, i) => (
              <div key={i} className={`max-w-[85%] ${m.role === 'user' ? 'ms-auto' : ''}`}>
                <div className={`rounded-xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-white border border-brand-100 text-ink'}`}>
                  {m.text}
                </div>
                {m.sources?.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {m.sources.slice(0, 3).map((s, j) => (
                      <span key={j} className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-700">
                        {s.label || s.id}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <p className="text-xs text-ink/40 italic">{t('generating')}</p>}
          </div>

          <form
            className="border-t border-brand-100 p-2 flex items-center gap-2 shrink-0"
            onSubmit={(e) => {
              e.preventDefault()
              ask(question)
            }}
          >
            <input
              className="input py-1.5 text-sm"
              placeholder={t('chatbot_placeholder')}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button className="btn-primary py-1.5 px-3 text-sm shrink-0" type="submit" disabled={loading || !question.trim()}>
              {t('ask')}
            </button>
          </form>
        </div>
      )}
    </>
  )
}
