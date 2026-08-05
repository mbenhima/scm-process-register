import React, { useMemo, useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { useScopedOrg, useOrgProjects } from '../utils/useScoped.js'
import RequireProject from '../components/RequireProject.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import AiSuggestionBox from '../components/AiSuggestionBox.jsx'

const EVENT_COLOR = {
  milestone: '#275650',
  communication: '#b8925a',
  training: '#3f827b',
  assessment: '#a67a4a',
}

const W = 900
const H = 220
const PAD = 50

function curveY(fracX) {
  // Ending (high anxiety, low on chart) -> Neutral Zone (trough) -> New Beginning (rising, settled)
  const y = H / 2 - Math.sin(fracX * Math.PI) * 70 * -1 + Math.sin(fracX * Math.PI * 1.0) * 0
  // simpler explicit curve: dip then rise
  return H - PAD - (Math.sin((fracX - 0.15) * Math.PI * 0.9) * 60 + 60)
}

function JourneyChart({ project, zoom, orgProjects }) {
  const { t } = useI18n()
  const projectsToShow = zoom === 'project' ? [project] : orgProjects

  const allEvents = projectsToShow.flatMap((p) => p.journeyEvents.map((e) => ({ ...e, projectName: p.name })))
  const min = Math.min(0, ...allEvents.map((e) => e.offsetDays))
  const max = Math.max(1, ...allEvents.map((e) => e.offsetDays))
  const span = max - min || 1

  function xFor(offset) {
    return PAD + ((offset - min) / span) * (W - PAD * 2)
  }

  const pathD = useMemo(() => {
    const points = []
    for (let i = 0; i <= 40; i++) {
      const frac = i / 40
      const x = PAD + frac * (W - PAD * 2)
      const y = curveY(frac)
      points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    }
    return points.join(' ')
  }, [])

  const todayX = xFor(0)

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H + 40}`} className="w-full min-w-[700px]" role="img" aria-label="journey timeline">
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#dcebe9" strokeWidth="1" />
        <text x={PAD} y={H - PAD + 18} fontSize="10" fill="#5f9d97">
          {t('bridges_ending')}
        </text>
        <text x={W / 2 - 30} y={H - PAD + 18} fontSize="10" fill="#5f9d97">
          {t('bridges_neutral')}
        </text>
        <text x={W - PAD - 60} y={H - PAD + 18} fontSize="10" fill="#5f9d97">
          {t('bridges_beginning')}
        </text>

        <path d={pathD} fill="none" stroke="#3f827b" strokeWidth="3" strokeLinecap="round" opacity="0.6" />

        {todayX >= PAD && todayX <= W - PAD && (
          <line x1={todayX} y1={20} x2={todayX} y2={H - PAD} stroke="#a67a4a" strokeWidth="1.5" strokeDasharray="4 3" />
        )}
        {todayX >= PAD && todayX <= W - PAD && (
          <text x={todayX + 4} y={16} fontSize="10" fill="#a67a4a" fontWeight="600">
            Today
          </text>
        )}

        {allEvents.map((e, i) => {
          const x = xFor(e.offsetDays)
          const frac = (e.offsetDays - min) / span
          const y = curveY(frac)
          return (
            <g key={e.id + i}>
              <circle cx={x} cy={y} r={6} fill={EVENT_COLOR[e.type] || '#275650'} stroke="white" strokeWidth="1.5" />
              <text
                x={x}
                y={y - 12}
                fontSize="9"
                textAnchor="middle"
                fill="#16221f"
                opacity="0.75"
              >
                {e.label.length > 26 ? e.label.slice(0, 24) + '…' : e.label}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="flex flex-wrap gap-3 mt-2 px-2">
        {Object.entries(EVENT_COLOR).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-ink/50">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
            {type}
          </div>
        ))}
      </div>
    </div>
  )
}

function Content({ project }) {
  const { t } = useI18n()
  const { addSubItem } = useAppState()
  const org = useScopedOrg()
  const orgProjects = useOrgProjects(org?.id)
  const [zoom, setZoom] = useState('project')
  const [shared, setShared] = useState(false)
  const [newEvent, setNewEvent] = useState({ label: '', offsetDays: 0, type: 'milestone' })

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <h3 className="font-semibold text-brand-950">{project.name}</h3>
          <div className="flex items-center gap-2">
            <select className="input py-1" value={zoom} onChange={(e) => setZoom(e.target.value)}>
              <option value="project">{t('cmProject')}</option>
              <option value="org">{t('organization')}</option>
            </select>
            <button className="btn-secondary text-xs" onClick={() => setShared(true)}>
              {t('shareSnapshot')}
            </button>
          </div>
        </div>
        <JourneyChart project={project} zoom={zoom} orgProjects={orgProjects} />
        {shared && (
          <div className="mt-3 text-xs rounded-lg bg-brand-50 text-brand-700 p-2">
            Snapshot ready — presentation-ready journey view captured for Steering Committee update (demo only).
          </div>
        )}
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-brand-950 mb-2 text-sm">Journey Map Annotation Assistant</h3>
        <AiSuggestionBox
          useCaseId="uc-journey-annotation"
          orgId={project.orgId}
          projectId={project.id}
          ucName="Journey Map Annotation Assistant"
          tier="assistive"
          buildSuggestion={() => `"Sentiment shift observed" — suggested label for the most recent assessment point on this timeline.`}
          onAccept={(text) => addSubItem(project.id, 'journeyEvents', { offsetDays: 0, label: text, type: 'assessment' })}
        />
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-brand-950 mb-2 text-sm">Timeline events</h3>
        <div className="space-y-1">
          {[...project.journeyEvents]
            .sort((a, b) => a.offsetDays - b.offsetDays)
            .map((e) => (
              <div key={e.id} className="flex items-center gap-2 text-sm py-1 border-b border-brand-50 last:border-0">
                <Badge tone="sand">{e.offsetDays >= 0 ? `+${e.offsetDays}d` : `${e.offsetDays}d`}</Badge>
                <span className="flex-1 text-ink/80">{e.label}</span>
                <span className="text-xs text-ink/40 capitalize">{e.type}</span>
              </div>
            ))}
        </div>
        <div className="grid sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-brand-50">
          <input
            className="input sm:col-span-2"
            placeholder="Event label, e.g. Go-live, Plant 1"
            value={newEvent.label}
            onChange={(e) => setNewEvent({ ...newEvent, label: e.target.value })}
          />
          <input
            type="number"
            className="input"
            placeholder="Day offset (+/-)"
            value={newEvent.offsetDays}
            onChange={(e) => setNewEvent({ ...newEvent, offsetDays: e.target.value })}
          />
          <select className="input" value={newEvent.type} onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}>
            <option value="milestone">milestone</option>
            <option value="communication">communication</option>
            <option value="training">training</option>
            <option value="assessment">assessment</option>
          </select>
        </div>
        <button
          className="btn-primary text-xs mt-2"
          onClick={() => {
            if (!newEvent.label.trim()) return
            addSubItem(project.id, 'journeyEvents', { label: newEvent.label, offsetDays: Number(newEvent.offsetDays) || 0, type: newEvent.type })
            setNewEvent({ label: '', offsetDays: 0, type: 'milestone' })
          }}
        >
          {t('add')}
        </button>
      </div>
    </div>
  )
}

export default function Module16Page() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader title={t('m16_title')} description={t('m16_desc')} />
      <RequireProject>{(project) => <Content project={project} />}</RequireProject>
    </div>
  )
}
