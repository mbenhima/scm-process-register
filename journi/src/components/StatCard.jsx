import React from 'react'

export default function StatCard({ label, value, sub, tone = 'brand', icon }) {
  const tones = {
    brand: 'text-brand-700',
    red: 'text-red-600',
    amber: 'text-amber-600',
    sand: 'text-sand-700',
  }
  return (
    <div className="card p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</span>
        {icon}
      </div>
      <span className={`text-2xl font-bold ${tones[tone] || tones.brand}`}>{value}</span>
      {sub && <span className="text-xs text-ink/50">{sub}</span>}
    </div>
  )
}
