import React from 'react'

export default function PageHeader({ title, description, badge, actions }) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between mb-5">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold text-brand-950">{title}</h1>
          {badge}
        </div>
        {description && <p className="text-sm text-ink/60 mt-1 max-w-3xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
