import React from 'react'

export default function Badge({ children, className = '', tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    sand: 'bg-sand-100 text-sand-800',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-emerald-50 text-emerald-700',
    gray: 'bg-gray-100 text-gray-600',
  }
  return <span className={`badge ${tones[tone] || tones.brand} ${className}`}>{children}</span>
}
