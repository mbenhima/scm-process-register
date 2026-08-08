import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import RequireProject from '../components/RequireProject.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import AiSuggestionBox from '../components/AiSuggestionBox.jsx'
import { VISIBILITY_LEVELS } from '../data/constants.js'
import { visibilityColor } from '../utils/compute.js'
import { canWrite, justificationRequired } from '../utils/rbac.js'

function Content({ project }) {
  const { t } = useI18n()
  const { data, logJustifiedChange, toggleSponsorAction, addSponsorAction, currentUser } = useAppState()
  const canEdit = canWrite(currentUser?.role)
  const org = data.organizations.find((o) => o.id === project.orgId)
  const required = justificationRequired(org)
  const [newAction, setNewAction] = useState('')
  const [pendingVisibility, setPendingVisibility] = useState(project.sponsor.visibility)
  const [visibilityNote, setVisibilityNote] = useState('')
  const visibilityDirty = pendingVisibility !== project.sponsor.visibility

  function saveVisibility() {
    if (!visibilityDirty) return
    logJustifiedChange(project.id, {
      module: 'M8 · Sponsor & Coalition',
      field: 'Sponsor visibility',
      oldValue: t(`visibility${project.sponsor.visibility[0].toUpperCase()}${project.sponsor.visibility.slice(1)}`),
      newValue: t(`visibility${pendingVisibility[0].toUpperCase()}${pendingVisibility.slice(1)}`),
      justification: visibilityNote,
      applyPatch: (p) => ({ ...p, sponsor: { ...p.sponsor, visibility: pendingVisibility } }),
    })
    setVisibilityNote('')
  }

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-5 md:col-span-1">
          <h3 className="font-semibold text-brand-950 mb-1">{project.sponsor.name}</h3>
          <p className="text-xs text-ink/50 mb-3">{project.sponsor.visibilityNote}</p>
          <label className="label">{t('visibility')}</label>
          <div className="flex gap-2">
            {VISIBILITY_LEVELS.map((v) => (
              <button
                key={v}
                disabled={!canEdit}
                onClick={() => setPendingVisibility(v)}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
                  pendingVisibility === v ? visibilityColor(v) + ' ring-2 ring-brand-300' : 'bg-brand-50 text-ink/40'
                } ${!canEdit ? 'cursor-default' : ''}`}
              >
                {t(`visibility${v[0].toUpperCase()}${v.slice(1)}`)}
              </button>
            ))}
          </div>
          {canEdit && visibilityDirty && (
            <div className="mt-2 rounded-lg border border-sand-300 bg-amber-50/60 p-3 space-y-2">
              <label className="label">Justify this change</label>
              <textarea
                className="input text-sm"
                rows={2}
                placeholder="What evidence supports this visibility reading? Cite what you've observed."
                value={visibilityNote}
                onChange={(e) => setVisibilityNote(e.target.value)}
              />
              <button className="btn-primary text-xs" onClick={saveVisibility} disabled={required && !visibilityNote.trim()}>
                Save with justification
              </button>
              <p className="text-[11px] text-ink/40">{required ? t('justificationRequiredHint') : t('justificationOptionalOrgHint')}</p>
            </div>
          )}
          {project.sponsor.visibility === 'weak' && (
            <div className="mt-3 text-xs rounded-lg bg-red-50 text-red-700 p-2">
              Alert: sponsorship visibility below threshold — cross-reference with stalled Desire scores in M6.
            </div>
          )}
        </div>

        <div className="card p-5 md:col-span-2">
          <h3 className="font-semibold text-brand-950 mb-3">{t('coalitionMember')}</h3>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-ink/40">
              <tr>
                <th className="text-start py-1.5">{t('name')}</th>
                <th className="text-start py-1.5">{t('role')}</th>
                <th className="text-start py-1.5">{t('influence')}</th>
                <th className="text-start py-1.5">{t('engagement')}</th>
              </tr>
            </thead>
            <tbody>
              {project.sponsor.members.map((m) => (
                <tr key={m.id} className="border-t border-brand-50">
                  <td className="py-1.5 font-medium text-brand-950">{m.name}</td>
                  <td className="py-1.5 text-ink/60">{m.role}</td>
                  <td className="py-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`w-2 h-4 rounded-sm ${i < m.influence ? 'bg-brand-600' : 'bg-brand-100'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="py-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`w-2 h-4 rounded-sm ${i < m.engagement ? 'bg-sand-500' : 'bg-brand-100'}`} />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-brand-950 mb-3">{t('sponsorAction')} — Roadmap</h3>
        <div className="space-y-2 mb-3">
          {project.sponsor.actions.map((a) => (
            <label key={a.id} className={`flex items-center gap-3 rounded-lg border border-brand-100 px-3 py-2 ${canEdit ? 'cursor-pointer' : ''}`}>
              <input
                type="checkbox"
                checked={a.done}
                disabled={!canEdit}
                onChange={() => toggleSponsorAction(project.id, a.id)}
                className="accent-brand-600"
              />
              <span className={`flex-1 text-sm ${a.done ? 'line-through text-ink/40' : 'text-ink/80'}`}>{a.action}</span>
              <Badge tone="sand">{a.phase}</Badge>
            </label>
          ))}
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <input className="input" placeholder={t('sponsorAction')} value={newAction} onChange={(e) => setNewAction(e.target.value)} />
            <button
              className="btn-primary shrink-0"
              onClick={() => {
                if (!newAction.trim()) return
                addSponsorAction(project.id, { action: newAction, phase: 'Manage' })
                setNewAction('')
              }}
            >
              {t('add')}
            </button>
          </div>
        )}
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-brand-950 mb-2 text-sm">Sponsor Action Recommender</h3>
        <AiSuggestionBox
          useCaseId="uc-sponsor-recommender"
          orgId={project.orgId}
          projectId={project.id}
          ucName="Sponsor Action Recommender"
          tier="assistive"
          buildSuggestion={() =>
            project.sponsor.visibility === 'weak'
              ? `Sponsorship visibility is weak. Recommend a scheduled floor/site visit by ${project.sponsor.name} within 2 weeks, paired with a short recorded message for the population not reachable in person.`
              : `Sponsorship visibility is solid. Recommend ${project.sponsor.name} personally recognize an early-adopter team in the next town hall to reinforce momentum.`
          }
          onAccept={(text) => addSponsorAction(project.id, { action: text, phase: 'Manage' })}
        />
      </div>
    </div>
  )
}

export default function Module8Page() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader title={t('m8_title')} description={t('m8_desc')} />
      <RequireProject>{(project) => <Content project={project} />}</RequireProject>
    </div>
  )
}
