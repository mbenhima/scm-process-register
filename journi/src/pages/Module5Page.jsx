import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import RequireProject from '../components/RequireProject.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import AiSuggestionBox from '../components/AiSuggestionBox.jsx'
import { ADKAR_BLOCKS } from '../data/constants.js'
import { scoreColor, isBlockStalled } from '../utils/compute.js'
import { canWrite } from '../utils/rbac.js'

const BARRIER_HINTS = {
  awareness: ['fear of the unknown', 'insufficient communication reach', 'competing priorities crowding out the message'],
  desire: ['fear of role redundancy', 'skepticism after a prior failed change', 'no personal WIIFM identified'],
  knowledge: ['training not yet launched', 'curriculum mismatched to role', 'no time allotted for learning'],
  ability: ['no practice environment', 'insufficient coaching support', 'conflicting old-process habits'],
  reinforcement: ['too early — pre go-live', 'no visible recognition of adoption', 'old process still technically available'],
}

function BlockCard({ project, block, canEdit }) {
  const { t } = useI18n()
  const { data, updateAdkar } = useAppState()
  const required = data.requireJustification !== false
  const val = project.adkar[block]
  const stalled = isBlockStalled(val)
  const [pendingScore, setPendingScore] = useState(val.score)
  const [note, setNote] = useState(val.note)
  const dirty = pendingScore !== val.score || note !== val.note

  function save() {
    if (!dirty) return
    updateAdkar(project.id, block, { score: pendingScore, note })
  }

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
            disabled={!canEdit}
            onClick={() => setPendingScore(n)}
            className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-colors ${
              n === pendingScore ? scoreColor(pendingScore) + ' ring-2 ring-brand-400' : 'bg-brand-50/60 text-ink/30 hover:bg-brand-50'
            } ${!canEdit ? 'cursor-default' : ''}`}
          >
            {n}
          </button>
        ))}
      </div>
      <label className="label">
        {t('barrierReason')} — justify this score{required ? '' : ' (optional)'}
      </label>
      {canEdit ? (
        <textarea className="input text-sm" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      ) : (
        <p className="text-sm text-ink/70">{val.note}</p>
      )}
      {canEdit && dirty && (
        <button
          className="btn-primary text-xs mt-2"
          onClick={save}
          disabled={pendingScore !== val.score && required && !note.trim()}
          title={pendingScore !== val.score && required && !note.trim() ? 'A score change needs a justification note' : ''}
        >
          Save with justification
        </button>
      )}
      <div className="mt-2 text-[11px] text-ink/40">
        {t('history')}:
        {val.history.map((h) => (
          <div key={h.id}>
            {h.date}: {h.score}
            {h.justification ? ` — "${h.justification}"` : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

function buildDesireDiagnosis(project, topResistance) {
  const desire = project.adkar.desire
  let out = `Desire is scored ${desire.score}/5 — ${desire.note}.`
  if (topResistance) {
    out += ` Resistance Log shows a ${topResistance.type}-based entry from ${topResistance.source} (severity ${topResistance.severity}/5): "${topResistance.rootCause}."`
  }
  if (project.sentimentSnapshot) {
    out += ` Sentiment snapshot: "${project.sentimentSnapshot}"`
  }
  out += ' This pattern reads as attitudinal — fear and prior history, not a skills or awareness gap — so a direct manager conversation is likely to move the needle faster than more communication or training content.'
  return out
}

function buildDesireCoachingScript(project, topResistance) {
  const manager = project.sponsor?.members?.[1]?.name || project.sponsor?.name || 'the People Manager'
  const namedConcern = topResistance ? topResistance.rootCause : 'concerns about job security tied to this change'
  return (
    `Coaching script for ${manager}\n\n` +
    `1. Open by naming what you're both already seeing: "${namedConcern}." Don't minimize it or rush past it.\n` +
    `2. Ask an open question: "What would need to be true for this to feel safe for your team?"\n` +
    `3. Share only what's actually confirmed — don't over-promise on headcount or scope.\n` +
    `4. Agree on one concrete next step together (e.g. a small-group listening session) and a date to follow up.`
  )
}

function DesireDiagnosisCoach({ project }) {
  const { data, llmConfig, generateWithLlm, logAiUsage } = useAppState()
  const [diagnosis, setDiagnosis] = useState(null)
  const [diagnosisAccepted, setDiagnosisAccepted] = useState(false)
  const [diagnosisSource, setDiagnosisSource] = useState(null)
  const [diagnosisError, setDiagnosisError] = useState(null)
  const [diagnosisLoading, setDiagnosisLoading] = useState(false)
  const [script, setScript] = useState(null)
  const [scriptResolved, setScriptResolved] = useState(null)
  const [scriptSource, setScriptSource] = useState(null)
  const [scriptError, setScriptError] = useState(null)
  const [scriptLoading, setScriptLoading] = useState(false)

  function isActive(ucId) {
    const orgActive = data.aiOrgActivation[project.orgId]?.[ucId]
    const override = data.aiProjectOverride[project.id]?.[ucId]
    return override ?? orgActive
  }
  const diagnosisUcActive = isActive('uc-adkar-barrier')
  const scriptUcActive = isActive('uc-coaching-script')
  const topResistance = (project.resistanceLog || []).find((r) => r.type === 'will') || project.resistanceLog?.[0]

  async function generateDiagnosis() {
    setDiagnosisAccepted(false)
    setScript(null)
    setScriptResolved(null)
    setDiagnosisError(null)
    if (llmConfig.connected) {
      setDiagnosisLoading(true)
      try {
        const prompt =
          `You diagnose why the ADKAR "Desire" score is stalled for a change management project, citing only the evidence given. ` +
          `Desire is scored ${project.adkar.desire.score}/5 — reason on file: "${project.adkar.desire.note}". ` +
          (topResistance ? `Resistance Log entry (${topResistance.type}, severity ${topResistance.severity}/5, from ${topResistance.source}): "${topResistance.rootCause}". ` : '') +
          (project.sentimentSnapshot ? `Sentiment snapshot: "${project.sentimentSnapshot}". ` : '') +
          `In under 80 words, explain whether this looks attitudinal/political versus a skills or awareness gap, and what that implies for the next intervention. Plain prose, no preamble.`
        const text = await generateWithLlm(prompt)
        setDiagnosis(text)
        setDiagnosisSource('llm')
      } catch (err) {
        setDiagnosisError(`LLM error — showing the built-in example instead. (${err.message})`)
        setDiagnosis(buildDesireDiagnosis(project, topResistance))
        setDiagnosisSource('template')
      }
      setDiagnosisLoading(false)
    } else {
      setDiagnosis(buildDesireDiagnosis(project, topResistance))
      setDiagnosisSource('template')
    }
  }
  function acceptDiagnosis() {
    logAiUsage({ useCaseId: 'uc-adkar-barrier', orgId: project.orgId, cmProjectId: project.id, outputSummary: diagnosis, outcome: 'accepted', user: 'You (current session)' })
    setDiagnosisAccepted(true)
  }
  async function generateScript() {
    setScriptResolved(null)
    setScriptError(null)
    if (llmConfig.connected) {
      setScriptLoading(true)
      try {
        const namedConcern = topResistance ? topResistance.rootCause : 'concerns about job security tied to this change'
        const prompt =
          `Write a short 1:1 coaching script (4 numbered steps, plain prose, under 120 words) for a People Manager to use with a team ` +
          `showing low Desire in a change program. The specific named concern to address directly is: "${namedConcern}". ` +
          `The manager should acknowledge it without minimizing it, ask an open question, avoid over-promising, and end by agreeing one concrete next step and a follow-up date. No preamble, just the script.`
        const text = await generateWithLlm(prompt)
        setScript(text)
        setScriptSource('llm')
      } catch (err) {
        setScriptError(`LLM error — showing the built-in example instead. (${err.message})`)
        setScript(buildDesireCoachingScript(project, topResistance))
        setScriptSource('template')
      }
      setScriptLoading(false)
    } else {
      setScript(buildDesireCoachingScript(project, topResistance))
      setScriptSource('template')
    }
  }
  function resolveScript(outcome) {
    logAiUsage({ useCaseId: 'uc-coaching-script', orgId: project.orgId, cmProjectId: project.id, outputSummary: script, outcome, user: 'You (current session)' })
    setScriptResolved(outcome)
  }

  return (
    <div className="card p-4 space-y-3 border-brand-200">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-brand-950 text-sm">AI Diagnosis & Coaching — Desire</h3>
        <Badge tone="sand">Assistive</Badge>
      </div>
      <p className="text-xs text-ink/60">
        AI assists and augments. Here, it diagnoses a low Desire score in seconds, pointing to the resistance and sentiment data
        behind it. One click drafts a coaching script for the manager to review and send — never auto-sent, always human-approved.
      </p>

      {!diagnosisUcActive ? (
        <div className="rounded-lg border border-dashed border-brand-100 bg-brand-50/40 px-3 py-2 text-xs text-ink/40">
          ADKAR Barrier Diagnosis Assistant — not activated for this scope. An Organization Admin can enable it in M16.
        </div>
      ) : (
        <>
          {!diagnosis && (
            <button className="btn-secondary text-xs" onClick={generateDiagnosis} disabled={diagnosisLoading}>
              {diagnosisLoading ? 'Diagnosing…' : 'Diagnose Desire'}
            </button>
          )}
          {diagnosisError && <p className="text-[11px] text-red-600">{diagnosisError}</p>}
          {diagnosis && (
            <div className="rounded-lg border border-sand-200 bg-sand-50/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge tone="sand">AI-generated — review required</Badge>
                {diagnosisSource && (
                  <span className="text-[10px] text-ink/40">{diagnosisSource === 'llm' ? 'Generated by connected LLM' : 'Built-in example'}</span>
                )}
              </div>
              <p className="text-sm text-ink/80">{diagnosis}</p>
              {!diagnosisAccepted ? (
                <div className="flex items-center gap-2">
                  <button className="btn-primary text-xs" onClick={acceptDiagnosis}>
                    Confirm diagnosis
                  </button>
                  <button className="btn-ghost text-xs" onClick={generateDiagnosis} disabled={diagnosisLoading}>
                    {diagnosisLoading ? 'Regenerating…' : 'Regenerate'}
                  </button>
                </div>
              ) : (
                <Badge tone="green">Confirmed</Badge>
              )}
            </div>
          )}
        </>
      )}

      {diagnosisAccepted && !scriptUcActive && (
        <div className="rounded-lg border border-dashed border-brand-100 bg-brand-50/40 px-3 py-2 text-xs text-ink/40">
          Manager Coaching Script Generator — not activated for this scope. An Organization Admin can enable it in M16.
        </div>
      )}
      {diagnosisAccepted && scriptUcActive && (
        <div className="pt-2 border-t border-brand-50 space-y-2">
          {!script && (
            <button className="btn-secondary text-xs" onClick={generateScript} disabled={scriptLoading}>
              {scriptLoading ? 'Drafting…' : 'Draft coaching script'}
            </button>
          )}
          {scriptError && <p className="text-[11px] text-red-600">{scriptError}</p>}
          {script && (
            <div className="rounded-lg border border-sand-200 bg-sand-50/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge tone="sand">AI-generated — review required</Badge>
                {scriptSource && (
                  <span className="text-[10px] text-ink/40">{scriptSource === 'llm' ? 'Generated by connected LLM' : 'Built-in example'}</span>
                )}
              </div>
              <p className="text-sm text-ink/80 whitespace-pre-line">{script}</p>
              {!scriptResolved ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <button className="btn-primary text-xs" onClick={() => resolveScript('accepted')}>
                    Save for manager review
                  </button>
                  <button className="btn-danger text-xs" onClick={() => resolveScript('rejected')}>
                    Discard
                  </button>
                  <button className="btn-ghost text-xs" onClick={generateScript} disabled={scriptLoading}>
                    {scriptLoading ? 'Regenerating…' : 'Regenerate'}
                  </button>
                </div>
              ) : (
                <Badge tone={scriptResolved === 'rejected' ? 'red' : 'green'}>
                  {scriptResolved === 'rejected' ? 'Discarded' : 'Saved for manager review'}
                </Badge>
              )}
              <p className="text-[11px] text-ink/40 italic">
                Never sent automatically — always reviewed, personalized, and sent by the People Manager.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Content({ project }) {
  const { t } = useI18n()
  const { data, addSubItem, updateProjectMeta, updateAdkar, currentUser } = useAppState()
  const canEdit = canWrite(currentUser?.role, data.rolePermissions)
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
          <BlockCard key={b} project={project} block={b} canEdit={canEdit} />
        ))}
      </div>

      {stalledBlockList.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>{t('escalated')}:</strong> {stalledBlockList.map((b) => t(b)).join(', ')} — automatically flagged to the Change
          Manager for review.
        </div>
      )}

      <DesireDiagnosisCoach project={project} />

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
        {canEdit && (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}

export default function Module5Page() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader title={t('m5_title')} description={t('m5_desc')} />
      <RequireProject>{(project) => <Content project={project} />}</RequireProject>
    </div>
  )
}
