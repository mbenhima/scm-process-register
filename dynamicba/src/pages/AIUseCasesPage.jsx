import React from 'react'
import { AI_USE_CASES } from '../lib/catalogue'
import { useApp } from '../contexts/AppContext'
import { useCollection } from '../hooks/useCollection'
import { setDocAt } from '../lib/firestoreHelpers'

export default function AIUseCasesPage() {
  const { orgId, activeClientId, activeProjectId, can } = useApp()
  const { data: activations } = useCollection(orgId ? ['organizations', orgId, 'aiUseCaseActivation'] : null)
  const overridesPath = orgId && activeClientId && activeProjectId
    ? ['organizations', orgId, 'clients', activeClientId, 'projects', activeProjectId, 'aiUseCaseOverrides']
    : null
  const { data: overrides } = useCollection(overridesPath)

  const activeMap = Object.fromEntries(activations.map((a) => [a.id, a.active]))
  const overrideMap = Object.fromEntries(overrides.map((o) => [o.id, o.state]))

  async function toggleOrgActivation(id, current) {
    await setDocAt(['organizations', orgId, 'aiUseCaseActivation', id], { active: !current })
  }
  async function setOverride(id, state) {
    await setDocAt([...overridesPath, id], { state })
  }

  return (
    <div>
      <h1 className="text-xl font-serif font-bold text-grey-dark mb-1">AI Use Case Library</h1>
      <p className="text-xs text-grey-medium mb-4 italic">D15 — every use case is tiered Assistive or Augmented, never Autonomous, and requires a named human checkpoint. Generation runs on DynamicBA's deterministic rule engine (src/lib/ruleEngine.js) with no external LLM call by default.</p>
      <table className="w-full card text-sm">
        <thead>
          <tr className="text-left text-grey-medium border-b border-grey-line">
            <th className="p-2">Use Case</th><th className="p-2">Step</th><th className="p-2">Risk</th><th className="p-2">Human Checkpoint</th><th className="p-2">Org Active</th>
            {overridesPath && <th className="p-2">Project Override</th>}
          </tr>
        </thead>
        <tbody>
          {AI_USE_CASES.map((u) => (
            <tr key={u.id} className="border-b border-grey-line last:border-0">
              <td className="p-2 font-mono text-xs">{u.id}<br /><span className="font-sans font-semibold">{u.name}</span> {u.custom && <span className="badge badge-medium ml-1">Custom</span>}</td>
              <td className="p-2 font-mono text-xs">{u.step}</td>
              <td className="p-2"><span className={`badge ${u.risk === 'High' ? 'badge-critical' : u.risk === 'Medium' ? 'badge-medium' : 'badge-good'}`}>{u.risk}</span></td>
              <td className="p-2 text-xs">{u.checkpoint}</td>
              <td className="p-2">
                <button disabled={!can('ai_usecases.manage')} onClick={() => toggleOrgActivation(u.id, activeMap[u.id])} className={`badge ${activeMap[u.id] === false ? 'badge-critical' : 'badge-good'}`}>
                  {activeMap[u.id] === false ? 'Off' : 'On'}
                </button>
              </td>
              {overridesPath && (
                <td className="p-2">
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
  )
}
