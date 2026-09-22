import React, { useState } from 'react'
import { FAQ_CORPUS } from '../lib/faq'

export default function HelpPage() {
  const [query, setQuery] = useState('')
  const filtered = FAQ_CORPUS.filter((f) => (f.q + f.a + f.topic).toLowerCase().includes(query.toLowerCase()))
  const topics = [...new Set(filtered.map((f) => f.topic))]

  return (
    <div>
      <h1 className="text-xl font-serif font-bold text-grey-dark mb-4">Help</h1>
      <input className="input max-w-md mb-4" placeholder="Search help articles…" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="space-y-6">
        {topics.map((topic) => (
          <div key={topic}>
            <h2 className="font-semibold text-grey-dark mb-2">{topic}</h2>
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
