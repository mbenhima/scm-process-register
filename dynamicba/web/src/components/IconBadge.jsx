import React from 'react'

// A solid-color circle with a centered white Lucide icon at ~52% of the circle's
// diameter, per the POWERACT Consulting brand guide (icon badges section). Orange
// is for emphasis; ink (grey) is the neutral default.
export default function IconBadge({ icon: Icon, tone = 'orange', size = 32, className = '' }) {
  const toneClass = tone === 'ink' ? 'icon-badge-ink' : 'icon-badge-orange'
  const iconSize = Math.round(size * 0.52)
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full shrink-0 ${toneClass} ${className}`}
      style={{ width: size, height: size }}
    >
      <Icon size={iconSize} strokeWidth={2} aria-hidden="true" />
    </span>
  )
}
