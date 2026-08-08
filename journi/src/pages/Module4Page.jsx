import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { useScopedOrg, useMainProjects } from '../utils/useScoped.js'
import { visibleProjects, canWrite, justificationRequired } from '../utils/rbac.js'
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

function ChangeLogTable({ project }) {
  const entries = [...(project.changeLog || [])].reverse()
  if (entries.length === 0) {
    return <p className="text-sm text-ink/40 italic">No justified changes logged yet.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-brand-50/70 text-brand-800 text-xs uppercase tracking-wide">
          <tr>
            <th className="text-start px-3 py-2">Date</th>
            <th className="text-start px-3 py-2">Module</th>
            <th className="text-start px-3 py-2">Field</th>
            <th className="text-start px-3 py-2">Change</th>
            <th className="text-start px-3 py-2">Justification</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-t border-brand-50 align-top">
              <td className="px-3 py-2 text-ink/60 whitespace-nowrap">{e.date}</td>
              <td className="px-3 py-2 text-ink/60 whitespace-nowrap">{e.module}</td>
              <td className="px-3 py-2 text-brand-950 font-medium capitalize whitespace-nowrap">{e.field}</td>
              <td className="px-3 py-2 text-ink/70 whitespace-nowrap">
                {e.oldValue} → <span className="font-semibold text-brand-800">{e.newValue}</span>
              </td>
              <td className="px-3 py-2 text-ink/70">{e.justification || <span className="italic text-ink/30">none given</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ProjectDetail({ project }) {
  const { t } = useI18n()
  const { data, updateProjectMeta, logJustifiedChange, currentUser } = useAppState()
  const canEdit = canWrite(currentUser?.role)
  const org = data.organizations.find((o) => o.id === project.orgId)
  const required = justificationRequired(org)
  const mainProjects = useMainProjects(project.mainProjectIds)
  const [pendingLewin, setPendingLewin] = useState(project.lewinPhase)
  const [lewinJustification, setLewinJustification] = useState('')
  const lewinDirty = pendingLewin !== project.lewinPhase

  function saveLewin() {
    if (!lewinDirty) return
    logJustifiedChange(project.id, {
      module: 'M4 · Initiative Registry',
      field: 'Lewin macro-state',
      oldValue: t(`lewin_${project.lewinPhase}`),
      newValue: t(`lewin_${pendingLewin}`),
      justification: lewinJustification,
      applyPatch: (p) => ({ ...p, lewinPhase: pendingLewin }),
    })
    setLewinJustification('')
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-brand-950">{project.name}</h3>
          <Badge tone="sand">{mainProjects.length > 0 ? t('linkedMainProject') : t('standalone')}</Badge>
        </div>
        {mainProjects.length > 0 && (
          <div className="space-y-2">
            {mainProjects.map((mp) => (
              <div key={mp.id} className="rounded-lg bg-brand-50/60 p-3 text-sm text-brand-900">
                <div className="font-medium">{mp.name}</div>
                <div className="text-xs text-ink/50 mt-1">
                  {mp.durationMonths}mo · {mp.budgetBand} · {mp.executiveSponsor}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t('changeType')}>
            <select
              className="input"
              value={project.changeType}
              disabled={!canEdit}
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
              value={pendingLewin}
              disabled={!canEdit}
              onChange={(e) => setPendingLewin(e.target.value)}
            >
              {LEWIN.map((l) => (
                <option key={l} value={l}>
                  {t(`lewin_${l}`)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {canEdit && lewinDirty && (
          <div className="rounded-lg border border-sand-300 bg-amber-50/60 p-3 space-y-2">
            <label className="label">Justify this change</label>
            <textarea
              className="input text-sm"
              rows={2}
              placeholder="Why is the Lewin macro-state moving now? Cite the specific evidence."
              value={lewinJustification}
              onChange={(e) => setLewinJustification(e.target.value)}
            />
            <button className="btn-primary text-xs" onClick={saveLewin} disabled={required && !lewinJustification.trim()}>
              Save with justification
            </button>
            <p className="text-[11px] text-ink/40">{required ? t('justificationRequiredHint') : t('justificationOptionalOrgHint')}</p>
          </div>
        )}
        <Field label={t('businessDriver')}>
          <textarea
            className="input"
            rows={2}
            value={project.businessDriver}
            readOnly={!canEdit}
            onChange={(e) => updateProjectMeta(project.id, { businessDriver: e.target.value })}
          />
        </Field>
        <Field label={t('targetPopulation')}>
          <input
            className="input"
            value={project.targetPopulation}
            readOnly={!canEdit}
            onChange={(e) => updateProjectMeta(project.id, { targetPopulation: e.target.value })}
          />
        </Field>
        <Field label={t('successCriteria')}>
          <textarea
            className="input"
            rows={2}
            value={project.successCriteria}
            readOnly={!canEdit}
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
      <div className="lg:col-span-3 card p-5 space-y-3">
        <h3 className="font-semibold text-brand-950">Justification & Change Log</h3>
        <p className="text-xs text-ink/50">
          Every scored or state-changing update to this project's Lewin, ADKAR, Bridges and Kübler-Ross readings, with the evidence recorded behind it.
        </p>
        <ChangeLogTable project={project} />
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
