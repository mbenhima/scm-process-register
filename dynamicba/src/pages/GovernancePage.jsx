import React, { useState } from 'react'
import { BUSINESS_RULES, ACTIONS, CONTROLS, RISKS, KPIS, ALERTS_CATALOGUE } from '../lib/catalogue'

const TABS = ['Business Rules', 'Controls', 'Risks', 'KPIs', 'Alerts']

export default function GovernancePage() {
  const [tab, setTab] = useState(TABS[0])

  return (
    <div>
      <h1 className="text-xl font-serif font-bold text-grey-dark mb-1">Governance</h1>
      <p className="text-xs text-grey-medium mb-4 italic">DynamicBA's own governance layer (D03-D07) — the reference catalogue below is platform-wide; instances raised on a specific engagement appear under that project's Alerts tab.</p>
      <div className="flex gap-2 mb-4">
        {TABS.map((tb) => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${tab === tb ? 'bg-orange text-white' : 'bg-grey-light text-grey-ink'}`}>{tb}</button>
        ))}
      </div>

      {tab === 'Business Rules' && (
        <table className="w-full card text-sm">
          <thead><tr className="text-left text-grey-medium border-b border-grey-line"><th className="p-2">Rule</th><th className="p-2">Step</th><th className="p-2">Condition</th><th className="p-2">Action</th><th className="p-2">Type</th></tr></thead>
          <tbody>
            {BUSINESS_RULES.map((r) => {
              const action = ACTIONS.find((a) => a.id === r.action)
              return (
                <tr key={r.id} className="border-b border-grey-line last:border-0">
                  <td className="p-2 font-mono text-xs">{r.id}</td>
                  <td className="p-2 font-mono text-xs">{r.step}</td>
                  <td className="p-2">{r.condition}</td>
                  <td className="p-2">{action?.name}</td>
                  <td className="p-2"><span className="badge badge-medium">{r.type}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {tab === 'Controls' && (
        <table className="w-full card text-sm">
          <thead><tr className="text-left text-grey-medium border-b border-grey-line"><th className="p-2">Control</th><th className="p-2">Type</th><th className="p-2">Step(s)</th><th className="p-2">Description</th></tr></thead>
          <tbody>
            {CONTROLS.map((c) => (
              <tr key={c.id} className="border-b border-grey-line last:border-0">
                <td className="p-2 font-mono text-xs">{c.id}<br /><span className="font-sans font-semibold">{c.name}</span></td>
                <td className="p-2"><span className={`badge ${c.type === 'Preventive' ? 'badge-good' : 'badge-medium'}`}>{c.type}</span></td>
                <td className="p-2 font-mono text-xs">{c.steps.join(', ')}</td>
                <td className="p-2">{c.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'Risks' && (
        <table className="w-full card text-sm">
          <thead><tr className="text-left text-grey-medium border-b border-grey-line"><th className="p-2">Risk</th><th className="p-2">Category</th><th className="p-2">Inherent</th><th className="p-2">Residual</th><th className="p-2">KRI Formula</th></tr></thead>
          <tbody>
            {RISKS.map((r) => (
              <tr key={r.id} className="border-b border-grey-line last:border-0">
                <td className="p-2 font-mono text-xs">{r.id}<br /><span className="font-sans font-semibold">{r.name}</span></td>
                <td className="p-2">{r.category}</td>
                <td className="p-2"><span className="badge badge-critical">{r.inherent}</span></td>
                <td className="p-2"><span className="badge badge-good">{r.residual}</span></td>
                <td className="p-2 text-xs">{r.kriFormula}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'KPIs' && (
        <table className="w-full card text-sm">
          <thead><tr className="text-left text-grey-medium border-b border-grey-line"><th className="p-2">KPI</th><th className="p-2">Type</th><th className="p-2">Formula</th><th className="p-2">Target</th><th className="p-2">Macro Process</th></tr></thead>
          <tbody>
            {KPIS.map((k) => (
              <tr key={k.id} className="border-b border-grey-line last:border-0">
                <td className="p-2 font-mono text-xs">{k.id}<br /><span className="font-sans font-semibold">{k.name}</span></td>
                <td className="p-2"><span className="badge badge-medium">{k.type}</span></td>
                <td className="p-2 text-xs">{k.formula}</td>
                <td className="p-2 font-semibold text-orange-deep">{k.target}</td>
                <td className="p-2 font-mono text-xs">{k.mp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'Alerts' && (
        <table className="w-full card text-sm">
          <thead><tr className="text-left text-grey-medium border-b border-grey-line"><th className="p-2">Alert</th><th className="p-2">Rule</th><th className="p-2">Severity</th><th className="p-2">Escalation Path</th><th className="p-2">Step</th></tr></thead>
          <tbody>
            {ALERTS_CATALOGUE.map((a) => (
              <tr key={a.id} className="border-b border-grey-line last:border-0">
                <td className="p-2 font-mono text-xs">{a.id}</td>
                <td className="p-2 font-mono text-xs">{a.rule}</td>
                <td className="p-2"><span className={`badge ${a.severity === 'Critical' ? 'badge-critical' : a.severity === 'High' ? 'badge-high' : a.severity === 'Medium' ? 'badge-medium' : 'badge-low'}`}>{a.severity}</span></td>
                <td className="p-2">{a.escalation}</td>
                <td className="p-2 font-mono text-xs">{a.step}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
