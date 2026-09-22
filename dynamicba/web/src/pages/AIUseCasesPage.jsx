import React from 'react'
import { AI_USE_CASES } from '../lib/catalogue'
import { useApp } from '../contexts/AppContext'
import { useApiCollection } from '../hooks/useApiCollection'
import { api } from '../lib/api'
import { invalidate } from '../lib/queryStore'

export default function AIUseCasesPage() {
  const { orgId, activeClientId, activeProjectId, can } = useApp()
  const activationsPath = orgId ? `/organizations/${orgId}/ai-use-case-activation` : null
  const { data: activations } = useApiCollection(activationsPath)
  const overridesPath = orgId && activeClientId && activeProjectId
    ? `/organizations/${orgId}/clients/${activeClientId}/projects/${activeProjectId}/ai-use-case-overrides`
    : null
  const { data: overrides } = useApiCollection(overridesPath)

  const activeMap = Object.fromEntries(activations.map((a) => [a.aiucId, a.active]))
  const overrideMap = Object.fromEntries(overrides.map((o) => [o.aiucId, o.state]))

  async function toggleOrgActivation(aiucId, current) {
    await api.put(`${activationsPath}/${aiucId}`, { active: !current })
    invalidate(activationsPath)
  }
  async function setOverride(aiucId, state) {
    await api.put(`${overridesPath}/${aiucId}`, { state })
    invalidate(overridesPath)
  }

  return (
    <div>
      <div className="eyebrow mb-1">Governance</div>
      <h1 className="h-page mb-1">AI Use Case Library</h1>
      <p className="text-sm text-grey-ink mb-6 italic">D15 — every use case is tiered Assistive or Augmented, never Autonomous, and requires a named human checkpoint. Where a use case calls an external AI provider (Admin → AI Provider), every output is tagged as a draft and reviewed by a human before it counts as final.</p>
      <div className="card overflow-hidden">
        <table className="table-pa">
          <thead>
            <tr>
              <th>Use Case</th><th>Step</th><th>Risk</th><th>Human Checkpoint</th><th>Org Active</th>
              {overridesPath && <th>Project Override</th>}
            </tr>
          </thead>
          <tbody>
            {AI_USE_CASES.map((u) => (
              <tr key={u.id}>
                <td className="font-mono text-xs">{u.id}<br /><span className="font-sans font-semibold text-grey-dark">{u.name}</span> {u.custom && <span className="badge badge-medium ml-1">Custom</span>}</td>
                <td className="font-mono text-xs">{u.step}</td>
                <td><span className={`badge ${u.risk === 'High' ? 'badge-critical' : u.risk === 'Medium' ? 'badge-medium' : 'badge-good'}`}>{u.risk}</span></td>
                <td className="text-xs">{u.checkpoint}</td>
                <td>
                  <button
                    disabled={!can('ai_usecases.manage')}
                    onClick={() => toggleOrgActivation(u.id, activeMap[u.id])}
                    className={`badge transition-opacity duration-150 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep disabled:opacity-40 disabled:cursor-not-allowed ${activeMap[u.id] === false ? 'badge-critical' : 'badge-good'}`}
                  >
                    {activeMap[u.id] === false ? 'Off' : 'On'}
                  </button>
                </td>
                {overridesPath && (
                  <td>
                    <select className="input !w-28 !py-1" value={overrideMap[u.id] || 'inherit'} onChange={(e) => setOverride(u.id, e.target.value)} disabled={!can('ai_usecases.manage')}>
                      <option value="inherit">Inherit</option>
                      <option value="on">On</option>
                      <option value="off">Off</option>
                    </select>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
