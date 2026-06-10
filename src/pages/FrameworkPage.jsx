// src/pages/FrameworkPage.jsx
import React, { useState } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { FORMULA_REFERENCE } from '../lib/formulas'

export default function FrameworkPage() {
  const { t } = useLang()
  const [expanded, setExpanded] = useState(null)

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('frameworkTitle')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('frameworkSubtitle')}</p>
      </div>

      {/* Summary table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">{t('formulaId')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">{t('formulaName')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('expression')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {FORMULA_REFERENCE.map((f, idx) => (
                <React.Fragment key={f.id}>
                  <tr
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpanded(expanded === idx ? null : idx)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-brand-700 font-medium">{f.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{f.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 max-w-sm">
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{f.expression}</code>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-gray-400 text-xs">{expanded === idx ? '▲' : '▼'}</span>
                    </td>
                  </tr>
                  {expanded === idx && (
                    <tr className="bg-brand-50">
                      <td colSpan={4} className="px-4 py-4">
                        <div className="text-sm text-gray-700 leading-relaxed max-w-3xl">
                          {f.description}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full cards */}
      <h2 className="text-lg font-semibold text-gray-800 mt-8">Formula Detail Cards</h2>
      <div className="grid grid-cols-1 gap-4">
        {FORMULA_REFERENCE.map(f => (
          <div key={f.id} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="badge bg-brand-100 text-brand-800 font-mono text-xs">{f.id}</span>
                  <h3 className="font-semibold text-gray-900">{f.name}</h3>
                </div>
                <div className="mb-3">
                  <code className="text-xs bg-gray-900 text-green-300 px-3 py-2 rounded-lg block overflow-x-auto whitespace-pre-wrap">
                    {f.expression}
                  </code>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
