import React from 'react'

export default function ProgressBar({ value, max = 100, tone = 'brand' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const tones = {
    brand: 'bg-brand-500',
    sand: 'bg-sand-500',
    red: 'bg-red-500',
    amber: 'bg-amber-500',
  }
  return (
    <div className="w-full h-2 rounded-full bg-brand-50 overflow-hidden">
      <div className={`h-full ${tones[tone] || tones.brand} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}
