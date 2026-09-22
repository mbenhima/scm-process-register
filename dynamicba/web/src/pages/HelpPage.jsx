import React, { useState } from 'react'
import { Search } from 'lucide-react'
import { FAQ_CORPUS } from '../lib/faq'

export default function HelpPage() {
  const [query, setQuery] = useState('')
  const filtered = FAQ_CORPUS.filter((f) => (f.q + f.a + f.topic).toLowerCase().includes(query.toLowerCase()))
  const topics = [...new Set(filtered.map((f) => f.topic))]

  return (
    <div>
      <div className="eyebrow mb-1">Support</div>
      <h1 className="h-page mb-4">Help</h1>
      <div className="relative max-w-md mb-6">
        <Search size={16} strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-grey-medium" aria-hidden="true" />
        <input className="input !pl-8" placeholder="Search help articles…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="space-y-6">
        {topics.map((topic) => (
          <div key={topic}>
            <h2 className="h-card mb-2">{topic}</h2>
            <div className="space-y-2">
              {filtered.filter((f) => f.topic === topic).map((f, i) => (
                <div key={i} className="card p-3">
                  <div className="font-medium text-grey-dark text-sm">{f.q}</div>
                  <div className="text-sm text-grey-ink mt-1">{f.a}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-grey-medium">No help articles match your search.</p>}
      </div>
    </div>
  )
}
