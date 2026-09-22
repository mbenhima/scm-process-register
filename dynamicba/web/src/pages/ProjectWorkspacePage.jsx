import React, { useState } from 'react'
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

export default function ProjectWorkspacePage() {
  const { orgId, activeClientId, activeProjectId, licenceProvider } = useApp()
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-serif font-bold text-grey-dark">{project.name}</h1>
        <div className="flex gap-2 text-sm">
          <button className={`px-3 py-1 rounded-lg ${tab === 'wizard' ? 'bg-orange text-white' : 'bg-grey-light'}`} onClick={() => setTab('wizard')}>Wizard</button>
          <button className={`px-3 py-1 rounded-lg ${tab === 'artifacts' ? 'bg-orange text-white' : 'bg-grey-light'}`} onClick={() => setTab('artifacts')}>Project Artifacts</button>
          <button className={`px-3 py-1 rounded-lg ${tab === 'alerts' ? 'bg-orange text-white' : 'bg-grey-light'}`} onClick={() => setTab('alerts')}>Alerts</button>
        </div>
      </div>

      {tab === 'wizard' && (
        <>
          <ol className="flex gap-2 mb-6">
            {USER_FACING_STEPS.map((s, i) => {
              const n = i + 1
              const allowed = n === 1 || licenceProvider.hasModule('MOD-01') // step gating detail lives inside each step component too
              return (
                <li key={s.key} className="flex-1">
                  <button
                    onClick={() => n <= currentStep && goToStep(n)}
                    disabled={n > currentStep}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold border ${
                      n === currentStep ? 'bg-orange text-white border-orange' : n < currentStep ? 'bg-orange-tint text-orange-deep border-orange-tint' : 'bg-grey-light text-grey-medium border-grey-line cursor-not-allowed'
                    }`}
                  >
                    {n}. {s.label}
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
