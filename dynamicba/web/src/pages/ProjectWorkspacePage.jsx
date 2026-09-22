import React, { useState } from 'react'
import { Check, Lock } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useProjectDoc } from '../hooks/useProjectDoc'
import { USER_FACING_STEPS } from '../lib/catalogue'
import Step1UploadSOW from '../components/wizard/Step1UploadSOW'
import Step2GenerateSpec from '../components/wizard/Step2GenerateSpec'
import Step3ReviewValidate from '../components/wizard/Step3ReviewValidate'
import Step4ExportHandoff from '../components/wizard/Step4ExportHandoff'
import ArtifactExplorer from '../components/ArtifactExplorer'
import AlertsPanel from '../components/AlertsPanel'

const STEP_COMPONENTS = [Step1UploadSOW, Step2GenerateSpec, Step3ReviewValidate, Step4ExportHandoff]
const TABS = [
  { key: 'wizard', label: 'Wizard' },
  { key: 'artifacts', label: 'Project Artifacts' },
  { key: 'alerts', label: 'Alerts' },
]

export default function ProjectWorkspacePage() {
  const { orgId, activeClientId, activeProjectId } = useApp()
  const { project, loading, patch } = useProjectDoc(orgId, activeClientId, activeProjectId)
  const [tab, setTab] = useState('wizard') // 'wizard' | 'artifacts' | 'alerts'

  if (!activeClientId || !activeProjectId) {
    return <p className="text-grey-medium">Select a client and project in the top bar to open its workspace.</p>
  }
  if (loading) return <p className="text-grey-medium">Loading…</p>
  if (!project) return <p className="text-grey-medium">Project not found.</p>

  const currentStep = project.currentStep || 1
  const StepComponent = STEP_COMPONENTS[currentStep - 1]

  function goToStep(n) {
    patch({ currentStep: n })
  }
  function advance() {
    const next = Math.min(4, currentStep + 1)
    patch({ currentStep: next, status: next === 4 ? project.status : 'in_progress' })
  }
  function complete() {
    patch({ status: 'completed' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="eyebrow mb-1">Project Workspace</div>
          <h1 className="h-page">{project.name}</h1>
        </div>
        <div className="flex gap-2">
          {TABS.map((tb) => (
            <button key={tb.key} className={`tab-button ${tab === tb.key ? 'tab-button-active' : 'tab-button-inactive'}`} onClick={() => setTab(tb.key)}>
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'wizard' && (
        <>
          <ol className="flex items-stretch gap-2 mb-6">
            {USER_FACING_STEPS.map((s, i) => {
              const n = i + 1
              const isCurrent = n === currentStep
              const isDone = n < currentStep
              const isLocked = n > currentStep
              return (
                <li key={s.key} className="flex-1">
                  <button
                    onClick={() => !isLocked && goToStep(n)}
                    disabled={isLocked}
                    className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg border transition-colors duration-150
                      focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep
                      ${isCurrent ? 'bg-orange border-orange' : isDone ? 'bg-orange-tint border-orange-tint hover:border-orange' : 'bg-grey-light border-grey-line cursor-not-allowed'}`}
                  >
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full shrink-0 text-xs font-bold
                      ${isCurrent ? 'bg-white text-orange-deep' : isDone ? 'bg-orange text-white' : 'bg-white text-grey-medium border border-grey-line'}`}
                    >
                      {isDone ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : isLocked ? <Lock size={11} strokeWidth={2.5} aria-hidden="true" /> : n}
                    </span>
                    <span className={`text-sm font-semibold leading-tight ${isCurrent ? 'text-white' : isDone ? 'text-orange-deep' : 'text-grey-medium'}`}>
                      {s.label}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
          <StepComponent project={project} patch={patch} onAdvance={advance} onComplete={complete} />
        </>
      )}

      {tab === 'artifacts' && <ArtifactExplorer orgId={orgId} clientId={activeClientId} projectId={activeProjectId} />}
      {tab === 'alerts' && <AlertsPanel orgId={orgId} clientId={activeClientId} projectId={activeProjectId} />}
    </div>
  )
}
