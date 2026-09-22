import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { MACRO_PROCESSES, STEPS, RASCI_BY_MACRO_PROCESS } from '../lib/catalogue'

export default function CataloguePage() {
  const [expanded, setExpanded] = useState(null)

  return (
    <div>
      <div className="eyebrow mb-1">Platform Reference</div>
      <h1 className="h-page mb-1">Process Catalogue</h1>
      <p className="text-sm text-grey-ink mb-6 italic">DynamicBA's 7 macro processes, decomposed into 63 steps (D01/D02) — internal architecture, hidden from the end-user wizard but shown here as the platform's own reference specification.</p>
      <div className="space-y-3">
        {MACRO_PROCESSES.map((mp) => {
          const rasci = RASCI_BY_MACRO_PROCESS[mp.id]
          const steps = STEPS.filter((s) => s.mp === mp.id)
          const isOpen = expanded === mp.id
          return (
            <div key={mp.id} className="card">
              <button
                className="w-full text-left p-4 flex items-start justify-between gap-3 rounded-xl transition-colors duration-150 hover:bg-grey-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep"
                onClick={() => setExpanded(isOpen ? null : mp.id)}
                aria-expanded={isOpen}
              >
                <div>
                  <div className="h-card">{mp.id} — {mp.name}</div>
                  <div className="text-xs text-grey-medium mt-1">{mp.objective}</div>
                </div>
                {isOpen ? <ChevronDown size={18} strokeWidth={2} className="text-grey-medium shrink-0 mt-1" aria-hidden="true" /> : <ChevronRight size={18} strokeWidth={2} className="text-grey-medium shrink-0 mt-1" aria-hidden="true" />}
              </button>
              {isOpen && (
                <div className="border-t border-grey-line p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-grey-medium">Trigger:</span> <span className="text-grey-dark">{mp.trigger}</span></div>
                    <div><span className="text-grey-medium">Terminal State:</span> <span className="text-grey-dark">{mp.terminalState}</span></div>
                    <div><span className="text-grey-medium">Owner Role:</span> <span className="text-grey-dark">{mp.ownerRole}</span></div>
                    <div><span className="text-grey-medium">Module:</span> <span className="text-grey-dark">{mp.module} ({mp.moduleId})</span></div>
                  </div>
                  <div>
                    <div className="eyebrow mb-1 !text-[11px]">RASCI</div>
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      <div className="bg-grey-light rounded-lg p-2"><div className="font-semibold text-grey-dark">Responsible</div><span className="text-grey-ink">{rasci.responsible}</span></div>
                      <div className="bg-grey-light rounded-lg p-2"><div className="font-semibold text-grey-dark">Accountable</div><span className="text-grey-ink">{rasci.accountable}</span></div>
                      <div className="bg-grey-light rounded-lg p-2"><div className="font-semibold text-grey-dark">Support</div><span className="text-grey-ink">{rasci.support}</span></div>
                      <div className="bg-grey-light rounded-lg p-2"><div className="font-semibold text-grey-dark">Consulted</div><span className="text-grey-ink">{rasci.consulted}</span></div>
                      <div className="bg-grey-light rounded-lg p-2"><div className="font-semibold text-grey-dark">Informed</div><span className="text-grey-ink">{rasci.informed}</span></div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-grey-line">
                    <table className="table-pa">
                      <thead><tr><th>Step</th><th>Task</th><th>Type</th><th>Role</th></tr></thead>
                      <tbody>
                        {steps.map((s) => (
                          <tr key={s.id}>
                            <td className="font-mono text-xs">{s.id}<br /><span className="font-sans">{s.name}</span></td>
                            <td>{s.task}</td>
                            <td><span className="badge badge-medium">{s.type}</span></td>
                            <td>{s.role}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
