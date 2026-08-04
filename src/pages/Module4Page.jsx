import React from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { useScopedOrg, useMainProject } from '../utils/useScoped.js'
import { visibleProjects } from '../utils/rbac.js'
import RequireProject from '../components/RequireProject.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import { readinessIndex } from '../utils/compute.js'

const LEWIN = ['unfreeze', 'change', 'refreeze']
const CHANGE_TYPES = ['technology', 'process', 'structural', 'cultural']

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

function ProjectDetail({ project }) {
  const { t } = useI18n()
  const { updateProjectMeta } = useAppState()
  const mainProject = useMainProject(project.mainProjectId)

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-brand-950">{project.name}</h3>
          <Badge tone="sand">{mainProject ? t('linkedMainProject') : t('standalone')}</Badge>
        </div>
        {mainProject && (
          <div className="rounded-lg bg-brand-50/60 p-3 text-sm text-brand-900">
            <div className="font-medium">{mainProject.name}</div>
            <div className="text-xs text-ink/50 mt-1">
              {mainProject.durationMonths}mo · {mainProject.budgetBand} · {mainProject.executiveSponsor}
            </div>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t('changeType')}>
            <select
              className="input"
              value={project.changeType}
              onChange={(e) => updateProjectMeta(project.id, { changeType: e.target.value })}
            >
              {CHANGE_TYPES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('lewin')}>
            <select
              className="input"
              value={project.lewinPhase}
              onChange={(e) => updateProjectMeta(project.id, { lewinPhase: e.target.value })}
            >
              {LEWIN.map((l) => (
                <option key={l} value={l}>
                  {t(`lewin_${l}`)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={t('businessDriver')}>
          <textarea
            className="input"
            rows={2}
            value={project.businessDriver}
            onChange={(e) => updateProjectMeta(project.id, { businessDriver: e.target.value })}
          />
        </Field>
        <Field label={t('targetPopulation')}>
          <input
            className="input"
            value={project.targetPopulation}
            onChange={(e) => updateProjectMeta(project.id, { targetPopulation: e.target.value })}
          />
        </Field>
        <Field label={t('successCriteria')}>
          <textarea
            className="input"
            rows={2}
            value={project.successCriteria}
            onChange={(e) => updateProjectMeta(project.id, { successCriteria: e.target.value })}
          />
        </Field>
      </div>
      <div className="card p-5 space-y-3">
        <h3 className="font-semibold text-brand-950">{t('readinessIndex')}</h3>
        <div className="text-4xl font-bold text-brand-700">{readinessIndex(project)}%</div>
        <div className="text-sm text-ink/60">{project.changeManager}</div>
        <div className="pt-2 border-t border-brand-50 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-ink/50">{t('bridges')}</span>
            <Badge>{t(`bridges_${project.bridgesPhase}`)}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/50">{t('lewin')}</span>
            <Badge tone="sand">{t(`lewin_${project.lewinPhase}`)}</Badge>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Module4Page() {
  const { t } = useI18n()
  const { data, currentUser } = useAppState()
  const org = useScopedOrg()
  const projects = org ? visibleProjects(currentUser, data, org.id) : []

  return (
    <div>
      <PageHeader title={t('m4_title')} description={t('m4_desc')} />
      <RequireProject>{(project) => <ProjectDetail project={project} />}</RequireProject>

      {org && (
        <div className="card mt-6 overflow-x-auto">
          <div className="px-4 py-3 border-b border-brand-50 font-semibold text-sm text-brand-950">
            {t('navPortfolio')} — {org.name}
          </div>
          <table className="w-full text-sm">
            <thead className="bg-brand-50/70 text-brand-800 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-start px-4 py-2">{t('name')}</th>
                <th className="text-start px-4 py-2">{t('changeType')}</th>
                <th className="text-start px-4 py-2">{t('lewin')}</th>
                <th className="text-start px-4 py-2">{t('readinessIndex')}</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-t border-brand-50">
                  <td className="px-4 py-2 font-medium text-brand-950">{p.name}</td>
                  <td className="px-4 py-2 text-ink/60 capitalize">{p.changeType}</td>
                  <td className="px-4 py-2">
                    <Badge tone="sand">{t(`lewin_${p.lewinPhase}`)}</Badge>
                  </td>
                  <td className="px-4 py-2 font-semibold text-brand-700">{readinessIndex(p)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
