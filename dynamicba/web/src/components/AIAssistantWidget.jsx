import React, { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { useClients } from '../hooks/useClients'
import { useAllProjects } from '../hooks/useProjects'
import { PLAN_LABELS } from '../lib/catalogue'
import { FAQ_CORPUS } from '../lib/faq'

// FR-DA-AST-01/04: a data-query mode (permission-checked before running) plus an
// application-help mode, both grounded by simple keyword/TF-IDF-style retrieval with no
// external LLM call — reproducible and fully offline, per NFR-DA-DATA-01.
function scoreMatch(query, text) {
  const qWords = query.toLowerCase().split(/\W+/).filter(Boolean)
  const tWords = text.toLowerCase()
  let score = 0
  for (const w of qWords) if (w.length > 2 && tWords.includes(w)) score++
  return score
}

export default function AIAssistantWidget({ onClose }) {
  const { orgId, licence, can } = useApp()
  const { clients } = useClients(orgId)
  const { projects } = useAllProjects(orgId, clients)
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState([
    { role: 'assistant', text: 'Ask me a data question ("how many projects do we have?") or an application-help question ("how do I upload a SOW?").' },
  ])

  function answerDataQuery(q) {
    const lower = q.toLowerCase()
    if (lower.includes('how many client')) {
      if (!can('project.read')) return "You don't have permission to view client data."
      return `This Organization has ${clients.length} client(s).`
    }
    if (lower.includes('how many project')) {
      if (!can('project.read')) return "You don't have permission to view project data."
      return `There are ${projects.length} project(s) across all clients.`
    }
    if (lower.includes('plan') || lower.includes('licence') || lower.includes('license')) {
      return `Your Organization is on the ${PLAN_LABELS[licence?.plan] || 'unknown'} plan, with ${licence?.maxUsers ?? '—'} licensed seats.`
    }
    if (lower.includes('signed off') || lower.includes('sign-off') || lower.includes('sign off')) {
      const done = projects.filter((p) => p.status === 'completed').length
      return `${done} of ${projects.length} project(s) have reached Export & Handoff.`
    }
    return null
  }

  function handleAsk() {
    if (!query.trim()) return
    const dataAnswer = answerDataQuery(query)
    let answer
    if (dataAnswer) {
      answer = dataAnswer
    } else {
      const ranked = FAQ_CORPUS.map((f) => ({ f, score: scoreMatch(query, f.q + ' ' + f.a) })).sort((a, b) => b.score - a.score)
      answer = ranked[0]?.score > 0 ? ranked[0].f.a : "I couldn't find a confident answer — try rephrasing, or check the Help page."
    }
    setHistory((h) => [...h, { role: 'user', text: query }, { role: 'assistant', text: answer }])
    setQuery('')
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 card flex flex-col h-[28rem] z-50">
      <div className="flex items-center justify-between px-4 py-2 border-b border-grey-line bg-orange-tint rounded-t-xl">
        <span className="font-semibold text-orange-deep text-sm">AI Assistant</span>
        <button onClick={onClose} className="text-grey-ink text-sm">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
        {history.map((h, i) => (
          <div key={i} className={h.role === 'assistant' ? 'text-grey-ink' : 'text-grey-dark font-medium text-right'}>
            {h.text}
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-grey-line flex gap-2">
        <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAsk()} placeholder="Ask a question…" />
        <button className="btn-primary" onClick={handleAsk}>Ask</button>
      </div>
    </div>
  )
}
