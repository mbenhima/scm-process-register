import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { useScopedProject } from '../utils/useScoped.js'
import { canWrite } from '../utils/rbac.js'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import charters from '../data/charters.js'
import charterActions from '../data/charterActions.js'
import mentoringStages from '../data/mentoringStages.js'

const STAGE_TONE = { 1: 'gray', 2: 'amber', 3: 'green' }
const PDCA_TONE = { Plan: 'gray', Do: 'brand', Check: 'amber', Act: 'green' }

function CharterCard({ charter, expanded, onToggle }) {
  const { t } = useI18n()
  return (
    <div className="card p-4 space-y-2">
      <button className="w-full flex items-start justify-between gap-3 text-start" onClick={onToggle}>
        <div>
          <span className="font-mono text-xs text-brand-700">{charter.id}</span>
          <h3 className="font-semibold text-brand-950">{charter.name}</h3>
          <p className="text-xs text-ink/50">{charter.category} · {t('m19_owner')}: {charter.ownerRole}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge tone={charter.status === 'Active' ? 'green' : 'gray'}>{charter.status}</Badge>
          <span className="text-ink/30 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>
      {expanded && (
        <div className="space-y-2 pt-1 text-sm">
          <p className="text-ink/70">{charter.description}</p>
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <p><strong className="text-ink/80">{t('m19_what')}:</strong> <span className="text-ink/60">{charter.what}</span></p>
            <p><strong className="text-ink/80">{t('m19_who')}:</strong> <span className="text-ink/60">{charter.who}</span></p>
            <p><strong className="text-ink/80">{t('m19_when')}:</strong> <span className="text-ink/60">{charter.when}</span></p>
            <p><strong className="text-ink/80">{t('m19_where')}:</strong> <span className="text-ink/60">{charter.where}</span></p>
            <p className="sm:col-span-2"><strong className="text-ink/80">{t('m19_why')}:</strong> <span className="text-ink/60">{charter.why}</span></p>
            <p className="sm:col-span-2"><strong className="text-ink/80">{t('m19_how')}:</strong> <span className="text-ink/60">{charter.how}</span></p>
          </div>
          <p className="text-xs text-ink/60">
            <strong className="text-ink/80">{t('m18_chain_racsi')}:</strong> R={charter.racsi.R} · A={charter.racsi.A} · C={charter.racsi.C} · S=
            {charter.racsi.S} · I={charter.racsi.I}
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-ink/40 pt-1">
            <span>{t('m19_version')}: {charter.version}</span>
            <span>·</span>
            <span>{t('m19_effective')}: {charter.effectiveDate}</span>
            <span>·</span>
            <span>{t('m19_review')}: {charter.reviewFrequency}</span>
            <span>·</span>
            <span>{t('m19_obs_level')}: {charter.governsObsLevel}</span>
            <span>·</span>
            <span>{t('m19_linked_macro')}: {charter.primaryLinkedMacroId}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function CharterTab() {
  const { t } = useI18n()
  const [expandedId, setExpandedId] = useState(null)
  return (
    <div className="space-y-3">
      <p className="text-xs text-ink/50">{t('m19_charter_desc')}</p>
      {charters.map((c) => (
        <CharterCard key={c.id} charter={c} expanded={expandedId === c.id} onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)} />
      ))}
    </div>
  )
}

function ActionMappingTab({ project, canEdit }) {
  const { t } = useI18n()
  const { logCharterAction, deleteCharterActionLog } = useAppState()
  const [filterCharter, setFilterCharter] = useState('all')
  const rows = charterActions.filter((a) => filterCharter === 'all' || a.charterId === filterCharter)
  const log = project?.charterActionLog || []

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-xs text-ink/50">{t('m19_filter_charter')}</label>
        <select className="input py-1 text-xs w-auto" value={filterCharter} onChange={(e) => setFilterCharter(e.target.value)}>
          <option value="all">{t('m19_all_charters')}</option>
          {charters.map((c) => (
            <option key={c.id} value={c.id}>{c.id} — {c.name}</option>
          ))}
        </select>
      </div>
      {!project && <p className="text-xs text-ink/40 italic">{t('m19_select_project_log')}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/70 text-brand-800 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-start px-4 py-2.5">ID</th>
              <th className="text-start px-4 py-2.5">{t('m19_action')}</th>
              <th className="text-start px-4 py-2.5">PDCA</th>
              <th className="text-start px-4 py-2.5">{t('m19_linked_task')}</th>
              <th className="text-start px-4 py-2.5">{t('m19_racsi_ra')}</th>
              <th className="text-start px-4 py-2.5">{t('m19_frequency')}</th>
              {project && <th className="text-start px-4 py-2.5">{t('m19_compliance')}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const instances = log.filter((l) => l.charterActionId === a.id)
              return (
                <tr key={a.id} className="border-t border-brand-50 align-top">
                  <td className="px-4 py-2.5 font-mono text-xs text-brand-700 whitespace-nowrap">{a.id}</td>
                  <td className="px-4 py-2.5 text-ink/70 max-w-md">{a.name}</td>
                  <td className="px-4 py-2.5"><Badge tone={PDCA_TONE[a.pdcaStage]}>{a.pdcaStage}</Badge></td>
                  <td className="px-4 py-2.5 text-xs text-ink/50 whitespace-nowrap">{a.macroId} / {a.taskId}</td>
                  <td className="px-4 py-2.5 text-xs text-ink/50 whitespace-nowrap">R={a.responsibleRole} · A={a.accountableRole}</td>
                  <td className="px-4 py-2.5 text-xs text-ink/50 whitespace-nowrap">{a.frequency}</td>
                  {project && (
                    <td className="px-4 py-2.5">
                      <div className="space-y-1">
                        {instances.slice(0, 3).map((l) => (
                          <div key={l.id} className="flex items-center gap-1.5 text-xs">
                            <Badge tone="green">{l.date}</Badge>
                            {l.note && <span className="text-ink/50 truncate max-w-[10rem]" title={l.note}>{l.note}</span>}
                            {canEdit && (
                              <button className="text-ink/30 hover:text-red-600" onClick={() => deleteCharterActionLog(project.id, l.id)}>
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        {instances.length > 3 && <p className="text-[10px] text-ink/40">+{instances.length - 3} {t('m19_more')}</p>}
                        {instances.length === 0 && <span className="text-xs text-ink/30 italic">{t('m19_not_logged')}</span>}
                        {canEdit && (
                          <button
                            className="btn-secondary text-[11px] py-0.5 px-2"
                            onClick={() => logCharterAction(project.id, a.id, '')}
                          >
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

function MentoringTab() {
  const { t } = useI18n()
  return (
    <div className="space-y-3">
      <p className="text-xs text-ink/50">{t('m19_mentoring_desc')}</p>
      <div className="grid md:grid-cols-3 gap-3">
        {mentoringStages.map((s) => (
          <div key={s.id} className="card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-brand-700">{s.id}</span>
              <Badge tone={STAGE_TONE[s.order]}>{t('m19_stage')} {s.order}</Badge>
            </div>
            <h3 className="font-semibold text-brand-950">{s.name}</h3>
            <p className="text-xs text-ink/60">{s.description}</p>
            <div className="space-y-1 text-xs">
              <p><strong className="text-ink/80">{t('m19_entry')}:</strong> <span className="text-ink/60">{s.entryCriteria}</span></p>
              <p><strong className="text-ink/80">{t('m19_exit')}:</strong> <span className="text-ink/60">{s.exitCriteria}</span></p>
              <p><strong className="text-ink/80">{t('m19_duration')}:</strong> <span className="text-ink/60">{s.typicalDuration}</span></p>
              <p><strong className="text-ink/80">{t('m19_setting')}:</strong> <span className="text-ink/60">{s.setting}</span></p>
              <p><strong className="text-ink/80">{t('m19_mentor_involvement')}:</strong> <span className="text-ink/60">{s.mentorInvolvement}</span></p>
              <p><strong className="text-ink/80">{t('m19_evidence')}:</strong> <span className="text-ink/60">{s.competencyEvidenceRequired}</span></p>
              <p className="text-amber-700"><strong>{t('m19_regression')}:</strong> {s.regressionPath}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Module19Page() {
  const { t } = useI18n()
  const { data, currentUser } = useAppState()
  const project = useScopedProject()
  const canEdit = canWrite(currentUser?.role, data.rolePermissions)
  const [tab, setTab] = useState('charters')

  return (
    <div>
      <PageHeader title={t('m19_title')} description={t('m19_desc')} />
      <div className="flex gap-2 mb-4 flex-wrap">
        <button className={`tab ${tab === 'charters' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('charters')}>
          {t('m19_tab_charters')}
        </button>
        <button className={`tab ${tab === 'actions' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('actions')}>
          {t('m19_tab_actions')}
        </button>
        <button className={`tab ${tab === 'mentoring' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('mentoring')}>
          {t('m19_tab_mentoring')}
        </button>
      </div>
      {tab === 'charters' && <CharterTab />}
      {tab === 'actions' && <ActionMappingTab project={project} canEdit={canEdit} />}
      {tab === 'mentoring' && <MentoringTab />}
    </div>
  )
}
