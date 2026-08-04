import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import RequireProject from '../components/RequireProject.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import AiSuggestionBox from '../components/AiSuggestionBox.jsx'
import { ADKAR_BLOCKS } from '../data/constants.js'
import { scoreColor, isBlockStalled } from '../utils/compute.js'

const BARRIER_HINTS = {
  awareness: ['fear of the unknown', 'insufficient communication reach', 'competing priorities crowding out the message'],
  desire: ['fear of role redundancy', 'skepticism after a prior failed change', 'no personal WIIFM identified'],
  knowledge: ['training not yet launched', 'curriculum mismatched to role', 'no time allotted for learning'],
  ability: ['no practice environment', 'insufficient coaching support', 'conflicting old-process habits'],
  reinforcement: ['too early — pre go-live', 'no visible recognition of adoption', 'old process still technically available'],
}

function BlockCard({ project, block }) {
  const { t } = useI18n()
  const { updateAdkar } = useAppState()
  const val = project.adkar[block]
  const stalled = isBlockStalled(val)

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-brand-950">{t(block)}</h4>
        {stalled && <Badge tone="amber">{t('escalated')}</Badge>}
      </div>
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => updateAdkar(project.id, block, { score: n })}
            className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-colors ${
              n === val.score ? scoreColor(val.score) + ' ring-2 ring-brand-400' : 'bg-brand-50/60 text-ink/30 hover:bg-brand-50'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <label className="label">{t('barrierReason')}</label>
      <textarea
        className="input text-sm"
        rows={2}
        value={val.note}
        onChange={(e) => updateAdkar(project.id, block, { note: e.target.value })}
      />
      <div className="mt-2 text-[11px] text-ink/40">
        {t('history')}: {val.history.map((h) => `${h.date}: ${h.score}`).join(' → ')}
      </div>
    </div>
  )
}

function Content({ project }) {
  const { t } = useI18n()
  const { addSubItem, updateProjectMeta } = useAppState()
  const [coachForm, setCoachForm] = useState({ managerName: '', cohort: '', barrierBlock: 'desire', note: '' })
  const stalledBlockList = ADKAR_BLOCKS.filter((b) => isBlockStalled(project.adkar[b]))

  function submitCoachNote() {
    if (!coachForm.note.trim()) return
    addSubItem(project.id, 'coachingNotes', { ...coachForm, date: new Date().toISOString().slice(0, 10) })
    setCoachForm({ managerName: '', cohort: '', barrierBlock: 'desire', note: '' })
  }

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ADKAR_BLOCKS.map((b) => (
          <BlockCard key={b} project={project} block={b} />
        ))}
      </div>

      {stalledBlockList.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>{t('escalated')}:</strong> {stalledBlockList.map((b) => t(b)).join(', ')} — automatically flagged to the Change
          Manager for review.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-semibold text-brand-950 mb-2 text-sm">ADKAR Barrier Diagnosis Assistant</h3>
          <AiSuggestionBox
            useCaseId="uc-adkar-barrier"
            orgId={project.orgId}
            projectId={project.id}
            ucName="ADKAR Barrier Diagnosis Assistant"
            tier="assistive"
            buildSuggestion={() => {
              const block = stalledBlockList[0] || 'desire'
              const hints = BARRIER_HINTS[block]
              const hint = hints[Math.floor(Math.random() * hints.length)]
              return `${t(block)} — ${hint}`
            }}
            onAccept={(text) => {
              const block = stalledBlockList[0] || 'desire'
              updateAdkar(project.id, block, { note: text })
            }}
          />
        </div>

        <div className="card p-4">
          <h3 className="font-semibold text-brand-950 mb-2 text-sm">Cohort Readiness Summarizer</h3>
          <AiSuggestionBox
            useCaseId="uc-cohort-summarizer"
            orgId={project.orgId}
            projectId={project.id}
            ucName="Cohort Readiness Summarizer"
            tier="augmented"
            buildSuggestion={() => {
              const avg = (ADKAR_BLOCKS.reduce((a, b) => a + project.adkar[b].score, 0) / 5).toFixed(1)
              return `${project.name}: composite ADKAR average ${avg}/5. Strongest block is Awareness; primary barrier is ${
                stalledBlockList[0] ? t(stalledBlockList[0]) : 'none currently stalled'
              }. Recommend Sponsor visibility focused on the target population before the next milestone review.`
            }}
            onAccept={(text) => updateProjectMeta(project.id, { readinessNarrative: text })}
          />
          {project.readinessNarrative && (
            <div className="mt-3 rounded-lg bg-brand-50/60 p-3 text-sm text-brand-900">{project.readinessNarrative}</div>
          )}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-brand-950 mb-3">{t('coachingNote')}</h3>
        <div className="space-y-2 mb-4">
          {project.coachingNotes.map((n) => (
            <div key={n.id} className="rounded-lg border border-brand-100 p-3 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-brand-950">
                  {n.managerName} → {n.cohort}
                </span>
                <Badge tone="sand">{t(n.barrierBlock)}</Badge>
              </div>
              <p className="text-ink/70">{n.note}</p>
              <p className="text-[11px] text-ink/40 mt-1">{n.date}</p>
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-2 mb-2">
          <input
            className="input"
            placeholder={t('owner')}
            value={coachForm.managerName}
            onChange={(e) => setCoachForm({ ...coachForm, managerName: e.target.value })}
          />
          <input
            className="input"
            placeholder={t('cohort')}
            value={coachForm.cohort}
            onChange={(e) => setCoachForm({ ...coachForm, cohort: e.target.value })}
          />
          <select
            className="input"
            value={coachForm.barrierBlock}
            onChange={(e) => setCoachForm({ ...coachForm, barrierBlock: e.target.value })}
          >
            {ADKAR_BLOCKS.map((b) => (
              <option key={b} value={b}>
                {t(b)}
              </option>
            ))}
          </select>
        </div>
        <textarea
          className="input mb-2"
          rows={2}
          placeholder={t('addCoachingNote')}
          value={coachForm.note}
          onChange={(e) => setCoachForm({ ...coachForm, note: e.target.value })}
        />
        <button className="btn-primary" onClick={submitCoachNote}>
          {t('add')}
        </button>
      </div>
    </div>
  )
}

export default function Module6Page() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader title={t('m6_title')} description={t('m6_desc')} />
      <RequireProject>{(project) => <Content project={project} />}</RequireProject>
    </div>
  )
}
