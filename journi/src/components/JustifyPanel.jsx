import React from 'react'
import { useAppState } from '../state/AppStateContext.jsx'

/**
 * Shared "stage -> justify -> save" control. A caller stages a pending value
 * locally, then renders this panel while that staged value differs from the
 * committed one; onSave should call logJustifiedChange (or an equivalent
 * mutator) with the given justification text.
 *
 * Whether a non-empty justification is actually required is a single
 * platform-wide setting (data.requireJustification, default true) so it can
 * be toggled by a Super/Group/Org Admin without touching every module.
 */
export default function JustifyPanel({ justification, onJustificationChange, onSave, onCancel, placeholder, saveLabel = 'Save with justification' }) {
  const { data } = useAppState()
  const required = data.requireJustification !== false
  const canSave = !required || justification.trim().length > 0

  return (
    <div className="rounded-lg border border-sand-300 bg-amber-50/60 p-3 space-y-2">
      <label className="label">Justify this change{required ? '' : ' (optional)'}</label>
      <textarea
        className="input text-sm"
        rows={2}
        placeholder={placeholder || 'Why is this changing? Cite the specific evidence.'}
        value={justification}
        onChange={(e) => onJustificationChange(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <button className="btn-primary text-xs" onClick={onSave} disabled={!canSave} title={!canSave ? 'A justification is required for this change' : ''}>
          {saveLabel}
        </button>
        {onCancel && (
          <button className="btn-ghost text-xs" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
