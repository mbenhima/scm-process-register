import React from 'react'
import { useI18n } from '../i18n/index.jsx'

const LABELS = {
  project: 'cmProject',
  organization: 'organization',
  group: 'group',
}

/**
 * Tenant-aware roll-up level switcher for Module 20 and the Portfolio
 * Dashboard. `levels` is the list of levels available to the current user's
 * role for the current Organization (see rbac.availableRollupLevels) plus
 * 'project' whenever a Project is in scope — the caller decides that part
 * since it depends on scope.cmProjectId, not role.
 */
export default function LevelSelector({ levels, value, onChange }) {
  const { t } = useI18n()
  if (levels.length <= 1) return null
  return (
    <div className="flex items-center gap-1 bg-brand-50 rounded-lg p-1">
      {levels.map((lvl) => (
        <button
          key={lvl}
          onClick={() => onChange(lvl)}
          className={`tab ${value === lvl ? 'tab-active' : 'tab-inactive'}`}
        >
          {t(LABELS[lvl])}
        </button>
      ))}
    </div>
  )
}
