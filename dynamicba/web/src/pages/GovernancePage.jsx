import React, { useState } from 'react'
import { BUSINESS_RULES, ACTIONS, CONTROLS, RISKS, KPIS, ALERTS_CATALOGUE } from '../lib/catalogue'

const TABS = ['Business Rules', 'Controls', 'Risks', 'KPIs', 'Alerts']

export default function GovernancePage() {
  const [tab, setTab] = useState(TABS[0])

  return (
    <div>
      <div className="eyebrow mb-1">Platform Reference</div>
      <h1 className="h-page mb-1">Governance</h1>
      <p className="text-sm text-grey-ink mb-6 italic">DynamicBA's own governance layer (D03-D07) — the reference catalogue below is platform-wide; instances raised on a specific engagement appear under that project's Alerts tab.</p>
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map((tb) => (
          <button key={tb} onClick={() => setTab(tb)} className={`tab-button ${tab === tb ? 'tab-button-active' : 'tab-button-inactive'}`}>{tb}</button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {tab === 'Business Rules' && (
          <table className="table-pa">
            <thead><tr><th>Rule</th><th>Step</th><th>Condition</th><th>Action</th><th>Type</th></tr></thead>
            <tbody>
              {BUSINESS_RULES.map((r) => {
                const action = ACTIONS.find((a) => a.id === r.action)
                return (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">{r.id}</td>
                    <td className="font-mono text-xs">{r.step}</td>
                    <td>{r.condition}</td>
                    <td>{action?.name}</td>
                    <td><span className="badge badge-medium">{r.type}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {tab === 'Controls' && (
          <table className="table-pa">
            <thead><tr><th>Control</th><th>Type</th><th>Step(s)</th><th>Description</th></tr></thead>
            <tbody>
              {CONTROLS.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono text-xs">{c.id}<br /><span className="font-sans font-semibold text-grey-dark">{c.name}</span></td>
                  <td><span className={`badge ${c.type === 'Preventive' ? 'badge-good' : 'badge-medium'}`}>{c.type}</span></td>
                  <td className="font-mono text-xs">{c.steps.join(', ')}</td>
                  <td>{c.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'Risks' && (
          <table className="table-pa">
            <thead><tr><th>Risk</th><th>Category</th><th>Inherent</th><th>Residual</th><th>KRI Formula</th></tr></thead>
            <tbody>
              {RISKS.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs">{r.id}<br /><span className="font-sans font-semibold text-grey-dark">{r.name}</span></td>
                  <td>{r.category}</td>
                  <td><span className="badge badge-critical">{r.inherent}</span></td>
                  <td><span className="badge badge-good">{r.residual}</span></td>
                  <td className="text-xs">{r.kriFormula}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'KPIs' && (
          <table className="table-pa">
            <thead><tr><th>KPI</th><th>Type</th><th>Formula</th><th>Target</th><th>Macro Process</th></tr></thead>
            <tbody>
              {KPIS.map((k) => (
                <tr key={k.id}>
                  <td className="font-mono text-xs">{k.id}<br /><span className="font-sans font-semibold text-grey-dark">{k.name}</span></td>
                  <td><span className="badge badge-medium">{k.type}</span></td>
                  <td className="text-xs">{k.formula}</td>
                  <td className="font-semibold text-grey-dark">{k.target}</td>
                  <td className="font-mono text-xs">{k.mp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'Alerts' && (
          <table className="table-pa">
            <thead><tr><th>Alert</th><th>Rule</th><th>Severity</th><th>Escalation Path</th><th>Step</th></tr></thead>
            <tbody>
              {ALERTS_CATALOGUE.map((a) => (
                <tr key={a.id}>
                  <td className="font-mono text-xs">{a.id}</td>
                  <td className="font-mono text-xs">{a.rule}</td>
                  <td><span className={`badge ${a.severity === 'Critical' ? 'badge-critical' : a.severity === 'High' ? 'badge-high' : a.severity === 'Medium' ? 'badge-medium' : 'badge-low'}`}>{a.severity}</span></td>
                  <td>{a.escalation}</td>
                  <td className="font-mono text-xs">{a.step}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
