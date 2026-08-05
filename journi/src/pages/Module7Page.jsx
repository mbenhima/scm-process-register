import React from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import RequireProject from '../components/RequireProject.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import AiSuggestionBox from '../components/AiSuggestionBox.jsx'
import { BRIDGES_PHASES, SENTIMENT_STAGES } from '../data/constants.js'
import { inferSentimentStage, hasDivergence } from '../utils/compute.js'

const SENTIMENT_COLOR = { denial: 'bg-red-500', resistance: 'bg-orange-500', exploration: 'bg-amber-400', commitment: 'bg-emerald-500' }
const BRIDGES_COLOR = { ending: 'bg-red-100 text-red-700', neutral: 'bg-amber-100 text-amber-700', beginning: 'bg-emerald-100 text-emerald-700' }

function Content({ project }) {
  const { t } = useI18n()
  const { updateProjectMeta } = useAppState()
  const sentiment = project.sentimentStage || inferSentimentStage(project)
  const divergence = hasDivergence(project)

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-brand-950 mb-3">{t('bridges')}</h3>
          <div className="flex gap-2 mb-3">
            {BRIDGES_PHASES.map((phase, idx) => (
              <button
                key={phase}
                onClick={() => updateProjectMeta(project.id, { bridgesPhase: phase })}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
                  project.bridgesPhase === phase ? BRIDGES_COLOR[phase] + ' ring-2 ring-brand-300' : 'bg-brand-50 text-ink/40'
                }`}
              >
                {idx + 1}. {t(`bridges_${phase}`)}
              </button>
            ))}
          </div>
          <label className="label">Notes — what you're observing at this stage</label>
          <textarea
            className="input text-sm"
            rows={2}
            placeholder="e.g. Finance team entering Neutral Zone; shop floor still in Ending"
            value={project.bridgesNote}
            onChange={(e) => updateProjectMeta(project.id, { bridgesNote: e.target.value })}
          />
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-brand-950 mb-3">{t('kubler')}</h3>
          <div className="flex gap-2 mb-3">
            {SENTIMENT_STAGES.map((s) => (
              <button
                key={s}
                onClick={() => updateProjectMeta(project.id, { sentimentStage: s })}
                className={`flex-1 rounded-lg py-2 text-[11px] font-semibold text-white transition-opacity ${SENTIMENT_COLOR[s]} ${
                  sentiment === s ? 'opacity-100 ring-2 ring-offset-1 ring-brand-400' : 'opacity-40 hover:opacity-70'
                }`}
              >
                {t(`sentiment_${s}`)}
              </button>
            ))}
          </div>
          <label className="label">Notes — sentiment snapshot</label>
          <textarea
            className="input text-sm"
            rows={2}
            placeholder="e.g. Mixed Denial/Resistance among shop-floor supervisors"
            value={project.sentimentSnapshot}
            onChange={(e) => updateProjectMeta(project.id, { sentimentSnapshot: e.target.value })}
          />
        </div>
      </div>

      {divergence && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Badge tone="red">{t('divergenceAlert')}</Badge>
          </div>
          <p className="text-sm text-red-800">{t('divergenceDesc')}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-semibold text-brand-950 mb-2 text-sm">Sentiment & Emotion Classifier</h3>
          <AiSuggestionBox
            useCaseId="uc-sentiment-classifier"
            orgId={project.orgId}
            projectId={project.id}
            ucName="Sentiment & Emotion Classifier"
            tier="augmented"
            buildSuggestion={() =>
              `Latest pulse comments classified: 58% ${t('sentiment_resistance')}, 24% ${t('sentiment_denial')}, 18% ${t('sentiment_exploration')} — dominant theme: uncertainty about role continuity.`
            }
          />
        </div>
        <div className="card p-4">
          <h3 className="font-semibold text-brand-950 mb-2 text-sm">Divergence Pattern Detector</h3>
          <AiSuggestionBox
            useCaseId="uc-divergence-detector"
            orgId={project.orgId}
            projectId={project.id}
            ucName="Divergence Pattern Detector"
            tier="assistive"
            buildSuggestion={() =>
              divergence
                ? `Divergence detected: Knowledge (${project.adkar.knowledge.score}/5) and Ability (${project.adkar.ability.score}/5) are strong, but the cohort remains in Bridges "Ending". This is a classic hidden-resistance pattern — recommend a listening session before more content-based communication.`
                : `No divergence pattern detected for this cohort at this time — ADKAR and Bridges/sentiment position are broadly aligned.`
            }
          />
        </div>
      </div>
    </div>
  )
}

export default function Module7Page() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader title={t('m7_title')} description={t('m7_desc')} />
      <RequireProject>{(project) => <Content project={project} />}</RequireProject>
    </div>
  )
}
