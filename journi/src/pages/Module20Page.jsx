import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { useScopedProject } from '../utils/useScoped.js'
import { canWrite } from '../utils/rbac.js'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import journeys from '../data/journeys.js'
import journeyTouchpoints from '../data/journeyTouchpoints.js'
import journeyDashboards from '../data/journeyDashboards.js'
import projectContextOverlay from '../data/projectContextOverlay.js'
import charterActions from '../data/charterActions.js'

const TYPE_TONE = { 'Persona Journey': 'brand', 'Exception Journey': 'red', 'Sector-Specific Journey': 'amber', 'System Journey': 'gray' }
const SUBPHASE_TONE = { Plan: 'gray', Do: 'brand', Check: 'amber', Act: 'green' }

function JourneysTab() {
  const { t } = useI18n()
  const byId = Object.fromEntries(journeys.map((j) => [j.id, j]))
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {journeys.map((j) => (
        <div key={j.id} className="card p-4 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="font-mono text-xs text-brand-700">{j.id}</span>
              <h3 className="font-semibold text-brand-950">{j.name}</h3>
            </div>
            <Badge tone={TYPE_TONE[j.type]}>{j.type}</Badge>
          </div>
          {j.predecessorId && (
            <p className="text-xs text-ink/50">
              {t('m20_specializes')}: {j.predecessorId} — {byId[j.predecessorId]?.name}
            </p>
          )}
          <p className="text-sm text-ink/70">{j.description}</p>
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink/60">
            <p><strong className="text-ink/80">{t('m20_trigger')}:</strong> {j.trigger}</p>
            <p><strong className="text-ink/80">{t('m20_audience')}:</strong> {j.audience}</p>
            <p><strong className="text-ink/80">{t('m20_duration')}:</strong> {j.duration}</p>
            <p><strong className="text-ink/80">{t('m20_owner')}:</strong> {j.ownerRole}</p>
          </div>
          <div className="flex gap-1 flex-wrap pt-1">
            {j.linkedModules.map((m) => (
              <Badge key={m} tone="gray">{m}</Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function TouchpointsTab({ project, canEdit }) {
  const { t } = useI18n()
  const { logTouchpoint, deleteTouchpointLog } = useAppState()
  const [filterJourney, setFilterJourney] = useState('all')
  const journeysWithTouchpoints = [...new Set(journeyTouchpoints.map((tp) => tp.journeyId))]
  const rows = journeyTouchpoints
    .filter((tp) => filterJourney === 'all' || tp.journeyId === filterJourney)
    .sort((a, b) => (a.journeyId === b.journeyId ? a.sequence - b.sequence : a.journeyId.localeCompare(b.journeyId)))
  const log = project?.touchpointLog || []

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-xs text-ink/50">{t('m20_filter_journey')}</label>
        <select className="input py-1 text-xs w-auto" value={filterJourney} onChange={(e) => setFilterJourney(e.target.value)}>
          <option value="all">{t('m20_all_journeys')}</option>
          {journeysWithTouchpoints.map((jid) => {
            const j = journeys.find((x) => x.id === jid)
            return <option key={jid} value={jid}>{jid} — {j?.name}</option>
          })}
        </select>
      </div>
      {!project && <p className="text-xs text-ink/40 italic">{t('m20_select_project_log')}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/70 text-brand-800 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-start px-4 py-2.5">ID</th>
              <th className="text-start px-4 py-2.5">{t('m20_touchpoint')}</th>
              <th className="text-start px-4 py-2.5">PDCA</th>
              <th className="text-start px-4 py-2.5">{t('m20_day')}</th>
              <th className="text-start px-4 py-2.5">{t('m19_owner')}</th>
              <th className="text-start px-4 py-2.5">{t('m20_success_criteria')}</th>
              {project && <th className="text-start px-4 py-2.5">{t('m19_compliance')}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((tp) => {
              const instances = log.filter((l) => l.touchpointId === tp.id)
              return (
                <tr key={tp.id} className="border-t border-brand-50 align-top">
                  <td className="px-4 py-2.5 font-mono text-xs text-brand-700 whitespace-nowrap">{tp.id}</td>
                  <td className="px-4 py-2.5 text-ink/70 max-w-xs">{tp.name}</td>
                  <td className="px-4 py-2.5"><Badge tone={SUBPHASE_TONE[tp.pdcaSubphase]}>{tp.pdcaSubphase}</Badge></td>
                  <td className="px-4 py-2.5 text-xs text-ink/50 whitespace-nowrap">D+{tp.daysFromTrigger}</td>
                  <td className="px-4 py-2.5 text-xs text-ink/50 whitespace-nowrap">{tp.ownerRole}</td>
                  <td className="px-4 py-2.5 text-xs text-ink/50 max-w-xs">{tp.successCriteria}</td>
                  {project && (
                    <td className="px-4 py-2.5">
                      <div className="space-y-1">
                        {instances.slice(0, 2).map((l) => (
                          <div key={l.id} className="flex items-center gap-1.5 text-xs">
                            <Badge tone="green">{l.date}</Badge>
                            {canEdit && (
                              <button className="text-ink/30 hover:text-red-600" onClick={() => deleteTouchpointLog(project.id, l.id)}>✕</button>
                            )}
                          </div>
                        ))}
                        {instances.length === 0 && <span className="text-xs text-ink/30 italic">{t('m19_not_logged')}</span>}
                        {canEdit && (
                          <button className="btn-secondary text-[11px] py-0.5 px-2" onClick={() => logTouchpoint(project.id, tp.id, '')}>
                            {t('m19_log_completion')}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DashboardsTab({ project }) {
  const { t } = useI18n()
  const jrn01Touchpoints = journeyTouchpoints.filter((tp) => tp.journeyId === 'JRN-01')
  const jrn01Log = (project?.touchpointLog || []).filter((l) => jrn01Touchpoints.some((tp) => tp.id === l.touchpointId))
  const jrn01Rate = jrn01Touchpoints.length ? Math.round((new Set(jrn01Log.map((l) => l.touchpointId)).size / jrn01Touchpoints.length) * 100) : 0

  const charterLog = project?.charterActionLog || []
  const charterRate = charterActions.length
    ? Math.round((new Set(charterLog.map((l) => l.charterActionId)).size / charterActions.length) * 100)
    : 0

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink/50">{t('m20_dashboard_desc')}</p>
      <div className="grid md:grid-cols-2 gap-3">
        {journeyDashboards.map((d) => (
          <div key={d.id} className="card p-4 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-mono text-xs text-brand-700">{d.id}</span>
                <h3 className="font-semibold text-brand-950">{d.name}</h3>
              </div>
              <Badge tone="gray">{d.refreshFrequency}</Badge>
            </div>
            {d.live === 'JRN-01' && project && (
              <div className="rounded-lg bg-brand-50/60 p-2.5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-brand-800 font-medium">{t('m20_live_metric')}: {t('m20_touchpoint_completion')} ({project.name})</span>
                  <span className="text-brand-800 font-semibold">{jrn01Rate}%</span>
                </div>
                <ProgressBar value={jrn01Rate} />
              </div>
            )}
            {d.live === 'charterActions' && project && (
              <div className="rounded-lg bg-brand-50/60 p-2.5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-brand-800 font-medium">{t('m20_live_metric')}: {t('m20_charter_completion')} ({project.name})</span>
                  <span className="text-brand-800 font-semibold">{charterRate}%</span>
                </div>
                <ProgressBar value={charterRate} />
              </div>
            )}
            {d.live && !project && <p className="text-xs text-ink/40 italic">{t('m20_select_project_log')}</p>}
            <p className="text-sm text-ink/70">{d.description}</p>
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink/50">
              <p><strong className="text-ink/70">{t('m20_kpis')}:</strong> {d.journeyKpis}</p>
              <p><strong className="text-ink/70">{t('m20_audience')}:</strong> {d.audience}</p>
              <p><strong className="text-ink/70">{t('m20_visualisation')}:</strong> {d.visualisationTypes}</p>
              <p><strong className="text-ink/70">{t('m20_linked_report')}:</strong> {d.linkedReport}</p>
            </div>
            {!d.live && (
              <p className="text-xs text-ink/40 italic">{t('m20_reference_only')}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ContextOverlayTab() {
  const { t } = useI18n()
  const grouped = {}
  for (const row of projectContextOverlay) {
    grouped[row.projectId] = grouped[row.projectId] || []
    grouped[row.projectId].push(row)
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-ink/50">{t('m20_overlay_desc')}</p>
      <div className="space-y-3">
        {Object.entries(grouped).map(([projectId, rows]) => (
          <div key={projectId} className="card p-4">
            <h3 className="font-mono text-sm text-brand-800 mb-2">{projectId}</h3>
            <div className="space-y-2">
              {rows.map((r, i) => (
                <div key={i} className="text-xs border-t border-brand-50 pt-2 first:border-t-0 first:pt-0">
                  <p><strong className="text-ink/80">{r.attribute}:</strong> <span className="text-ink/60">{r.value}</span></p>
                  <p className="text-ink/40 italic">{r.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Module20Page() {
  const { t } = useI18n()
  const { data, currentUser } = useAppState()
  const project = useScopedProject()
  const canEdit = canWrite(currentUser?.role, data.rolePermissions)
  const [tab, setTab] = useState('journeys')

  return (
    <div>
      <PageHeader title={t('m20_title')} description={t('m20_desc')} />
      <div className="flex gap-2 mb-4 flex-wrap">
        <button className={`tab ${tab === 'journeys' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('journeys')}>
          {t('m20_tab_journeys')}
        </button>
        <button className={`tab ${tab === 'touchpoints' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('touchpoints')}>
          {t('m20_tab_touchpoints')}
        </button>
        <button className={`tab ${tab === 'dashboards' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('dashboards')}>
          {t('m20_tab_dashboards')}
        </button>
        <button className={`tab ${tab === 'overlay' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('overlay')}>
          {t('m20_tab_overlay')}
        </button>
      </div>
      {tab === 'journeys' && <JourneysTab />}
      {tab === 'touchpoints' && <TouchpointsTab project={project} canEdit={canEdit} />}
      {tab === 'dashboards' && <DashboardsTab project={project} />}
      {tab === 'overlay' && <ContextOverlayTab />}
    </div>
  )
}
