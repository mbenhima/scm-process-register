import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import RequireProject from '../components/RequireProject.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import AiSuggestionBox from '../components/AiSuggestionBox.jsx'

const RISK_TONE = { low: 'green', moderate: 'amber', high: 'red' }

function Content({ project }) {
  const { t } = useI18n()
  const { updateCheckpoint, addQuickWin, addLesson, toggleSignoff } = useAppState()
  const [win, setWin] = useState('')
  const [lesson, setLesson] = useState('')

  function markComplete(chk) {
    const adoptionRate = Math.round(50 + Math.random() * 40)
    const regressionRisk = adoptionRate > 80 ? 'low' : adoptionRate > 60 ? 'moderate' : 'high'
    updateCheckpoint(project.id, chk.id, { adoptionRate, regressionRisk, status: 'complete' })
  }

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-3 gap-4">
        {project.sustainment.checkpoints.map((c) => (
          <div key={c.id} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-brand-950">{c.label}</h4>
              <Badge tone={c.status === 'complete' ? 'green' : 'gray'}>{c.status.replace('_', ' ')}</Badge>
            </div>
            {c.status === 'complete' ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <ProgressBar value={c.adoptionRate} />
                  <span className="text-xs w-10 text-ink/50">{c.adoptionRate}%</span>
                </div>
                <Badge tone={RISK_TONE[c.regressionRisk]}>{t('regressionRisk')}: {c.regressionRisk}</Badge>
              </>
            ) : (
              <button className="btn-secondary text-xs" onClick={() => markComplete(c)}>
                Record checkpoint
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-semibold text-brand-950 mb-3">{t('quickWin')}</h3>
          <div className="space-y-2 mb-3">
            {project.sustainment.quickWins.map((w) => (
              <div key={w.id} className="rounded-lg bg-brand-50/60 p-2 text-sm">
                🎉 {w.title} <span className="text-xs text-ink/40">— {w.date}</span>
              </div>
            ))}
            {project.sustainment.quickWins.length === 0 && <p className="text-sm text-ink/40 italic">{t('noData')}</p>}
          </div>
          <div className="flex gap-2">
            <input className="input" placeholder={t('quickWin')} value={win} onChange={(e) => setWin(e.target.value)} />
            <button
              className="btn-primary shrink-0"
              onClick={() => {
                if (!win.trim()) return
                addQuickWin(project.id, { title: win, date: new Date().toISOString().slice(0, 10) })
                setWin('')
              }}
            >
              {t('add')}
            </button>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-semibold text-brand-950 mb-3">{t('lessonsLearned')}</h3>
          <div className="space-y-2 mb-3">
            {project.sustainment.lessonsLearned.map((l) => (
              <div key={l.id} className="rounded-lg border border-brand-100 p-2 text-sm text-ink/70">
                {l.text}
              </div>
            ))}
            {project.sustainment.lessonsLearned.length === 0 && <p className="text-sm text-ink/40 italic">{t('noData')}</p>}
          </div>
          <div className="flex gap-2">
            <input className="input" placeholder={t('lessonsLearned')} value={lesson} onChange={(e) => setLesson(e.target.value)} />
            <button
              className="btn-primary shrink-0"
              onClick={() => {
                if (!lesson.trim()) return
                addLesson(project.id, lesson)
                setLesson('')
              }}
            >
              {t('add')}
            </button>
          </div>
        </div>
      </div>

      <div className="card p-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-brand-950">{t('sustainmentSignoff')}</h3>
          <p className="text-xs text-ink/50">Formal hand-off to Business-as-Usual ownership — Lewin's Refreeze.</p>
        </div>
        <button className={project.sustainment.signoff ? 'btn-primary' : 'btn-secondary'} onClick={() => toggleSignoff(project.id)}>
          {project.sustainment.signoff ? '✓ Signed off' : 'Sign off'}
        </button>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-brand-950 mb-2 text-sm">Regression Risk Predictor</h3>
        <AiSuggestionBox
          useCaseId="uc-regression-predictor"
          orgId={project.orgId}
          projectId={project.id}
          ucName="Regression Risk Predictor"
          tier="augmented"
          buildSuggestion={() => {
            const latest = [...project.sustainment.checkpoints].reverse().find((c) => c.status === 'complete')
            return latest
              ? `Early regression-risk score: ${latest.regressionRisk.toUpperCase()}. Adoption trend at ${latest.label} checkpoint is ${latest.adoptionRate}%. Recommend a reinforcement nudge (manager check-in + visible metric) if the next checkpoint doesn't show improvement.`
              : `Not enough post-go-live data yet to produce a regression-risk score.`
          }}
        />
      </div>
    </div>
  )
}

export default function Module13Page() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader title={t('m13_title')} description={t('m13_desc')} />
      <RequireProject>{(project) => <Content project={project} />}</RequireProject>
    </div>
  )
}
