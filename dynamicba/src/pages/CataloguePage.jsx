import React, { useState } from 'react'
import { MACRO_PROCESSES, STEPS, RASCI_BY_MACRO_PROCESS } from '../lib/catalogue'

export default function CataloguePage() {
  const [expanded, setExpanded] = useState(null)

  return (
    <div>
      <h1 className="text-xl font-serif font-bold text-grey-dark mb-1">Process Catalogue</h1>
      <p className="text-xs text-grey-medium mb-4 italic">DynamicBA's 7 macro processes, decomposed into 63 steps (D01/D02) — internal architecture, hidden from the end-user wizard but shown here as the platform's own reference specification.</p>
      <div className="space-y-3">
        {MACRO_PROCESSES.map((mp) => {
          const rasci = RASCI_BY_MACRO_PROCESS[mp.id]
          const steps = STEPS.filter((s) => s.mp === mp.id)
          const isOpen = expanded === mp.id
          return (
            <div key={mp.id} className="card">
              <button className="w-full text-left p-4 flex items-start justify-between" onClick={() => setExpanded(isOpen ? null : mp.id)}>
                <div>
                  <div className="font-semibold text-grey-dark">{mp.id} — {mp.name}</div>
                  <div className="text-xs text-grey-medium mt-1">{mp.objective}</div>
                </div>
                <span className="text-orange-deep">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className="border-t border-grey-line p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-grey-medium">Trigger:</span> {mp.trigger}</div>
                    <div><span className="text-grey-medium">Terminal State:</span> {mp.terminalState}</div>
                    <div><span className="text-grey-medium">Owner Role:</span> {mp.ownerRole}</div>
                    <div><span className="text-grey-medium">Module:</span> {mp.module} ({mp.moduleId})</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-grey-medium mb-1">RASCI</div>
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      <div className="bg-grey-light rounded p-2"><div className="font-semibold">Responsible</div>{rasci.responsible}</div>
                      <div className="bg-grey-light rounded p-2"><div className="font-semibold">Accountable</div>{rasci.accountable}</div>
                      <div className="bg-grey-light rounded p-2"><div className="font-semibold">Support</div>{rasci.support}</div>
                      <div className="bg-grey-light rounded p-2"><div className="font-semibold">Consulted</div>{rasci.consulted}</div>
                      <div className="bg-grey-light rounded p-2"><div className="font-semibold">Informed</div>{rasci.informed}</div>
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-grey-medium border-b border-grey-line"><th className="p-1">Step</th><th className="p-1">Task</th><th className="p-1">Type</th><th className="p-1">Role</th></tr></thead>
                    <tbody>
                      {steps.map((s) => (
                        <tr key={s.id} className="border-b border-grey-line last:border-0">
                          <td className="p-1 font-mono text-xs">{s.id}<br /><span className="font-sans">{s.name}</span></td>
                          <td className="p-1 text-grey-ink">{s.task}</td>
                          <td className="p-1"><span className="badge badge-medium">{s.type}</span></td>
                          <td className="p-1 text-grey-ink">{s.role}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
