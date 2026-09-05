import React from 'react'
import { dateRangeForTasks, monthTicks, pctForDate, taskGapDays, gapTone, todayISO } from '../utils/wbs.js'

const TRACK_LABEL = { pm: 'Project Management', cm: 'Change Management', framework: 'Frameworks' }
const TRACK_COLOR = { pm: 'bg-sand-500', cm: 'bg-brand-600', framework: 'bg-violet-500' }
const TRACK_BORDER = { pm: 'border-sand-500', cm: 'border-brand-500', framework: 'border-violet-500' }
const TRACK_HEADER = { pm: 'bg-sand-600', cm: 'bg-brand-700', framework: 'bg-violet-600' }
const GAP_TONE_CLASS = { green: 'text-emerald-600', amber: 'text-amber-600', red: 'text-red-600', gray: 'text-ink/30' }
const GRID_COLS = 'grid-cols-[minmax(160px,220px)_1fr_56px]'

function gapLabel(gap) {
  if (gap === null || gap === undefined) return '—'
  if (gap === 0) return 'on time'
  return gap > 0 ? `+${gap}d` : `${gap}d`
}

function Diamond({ pct, filled, track, title }) {
  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 ${filled ? TRACK_COLOR[track] : `bg-white border-2 ${TRACK_BORDER[track]}`}`}
      style={{ left: `${pct}%` }}
      title={title}
    />
  )
}

function TaskRow({ task }) {
  const isMilestone = task.baselineStart === task.baselineEnd
  const gap = taskGapDays(task)
  return (
    <div className={`grid ${GRID_COLS} items-center border-t border-brand-50/80 hover:bg-brand-50/30`}>
      <div className="px-3 py-2 text-xs">
        <div className="font-medium text-brand-950 truncate" title={task.name}>
          {task.name}
        </div>
        <div className="text-[10px] text-ink/40">{task.phase}</div>
      </div>
      <div className="relative h-9">
        {isMilestone ? (
          <>
            <Diamond pct={task.baselinePct} filled={false} track={task.track} title={`Baseline: ${task.baselineStart}`} />
            {task.actualStart && <Diamond pct={task.actualPct} filled track={task.track} title={`Actual: ${task.actualStart}`} />}
          </>
        ) : (
          <>
            <div
              className={`absolute top-1.5 h-2 rounded border border-dashed bg-white ${TRACK_BORDER[task.track]}`}
              style={{ left: `${task.baselineStartPct}%`, width: `${Math.max(0.6, task.baselineWidthPct)}%` }}
              title={`Baseline: ${task.baselineStart} → ${task.baselineEnd}`}
            />
            {task.actualStart && (
              <div
                className={`absolute top-[17px] h-2.5 rounded ${TRACK_COLOR[task.track]}`}
                style={{ left: `${task.actualStartPct}%`, width: `${Math.max(0.6, task.actualWidthPct)}%` }}
                title={`Actual: ${task.actualStart} → ${task.actualEnd || 'in progress'}`}
              />
            )}
          </>
        )}
      </div>
      <div className={`text-[10px] font-semibold text-end pr-2 ${GAP_TONE_CLASS[gapTone(gap)]}`}>{gapLabel(gap)}</div>
    </div>
  )
}

export default function GanttChart({ tasks }) {
  if (!tasks || tasks.length === 0) return null
  const range = dateRangeForTasks(tasks)
  const ticks = monthTicks(range)
  const todayPct = pctForDate(todayISO(), range)

  const enriched = tasks.map((t) => ({
    ...t,
    baselineStartPct: pctForDate(t.baselineStart, range),
    baselineWidthPct: pctForDate(t.baselineEnd, range) - pctForDate(t.baselineStart, range),
    baselinePct: pctForDate(t.baselineStart, range),
    actualStartPct: t.actualStart ? pctForDate(t.actualStart, range) : null,
    actualWidthPct: t.actualStart ? pctForDate(t.actualEnd || todayISO(), range) - pctForDate(t.actualStart, range) : null,
    actualPct: t.actualStart ? pctForDate(t.actualStart, range) : null,
  }))

  const tracks = ['pm', 'cm', 'framework'].filter((tr) => enriched.some((t) => t.track === tr))

  return (
    <div className="card overflow-x-auto">
      <div className="min-w-[760px]">
        <div className={`grid ${GRID_COLS} border-b border-brand-100 bg-brand-50/50`}>
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-brand-800">Task</div>
          <div className="relative h-8">
            {ticks.map((tick) => (
              <div
                key={tick.iso}
                className="absolute top-0 h-full border-l border-brand-100 text-[10px] text-ink/40 pl-1 pt-1.5"
                style={{ left: `${tick.pct}%` }}
              >
                {tick.label}
              </div>
            ))}
            <div className="absolute top-0 h-full border-l-2 border-red-400" style={{ left: `${todayPct}%` }} title="Today" />
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-brand-800 text-end pr-2 py-2">Gap</div>
        </div>

        {tracks.map((tr) => (
          <div key={tr}>
            <div className={`grid ${GRID_COLS} ${TRACK_HEADER[tr]}`}>
              <div className="px-3 py-1.5 text-xs font-semibold text-white col-span-3">{TRACK_LABEL[tr]}</div>
            </div>
            {enriched
              .filter((t) => t.track === tr)
              .map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
          </div>
        ))}

        <div className="flex flex-wrap items-center gap-4 px-3 py-2.5 text-[11px] text-ink/50 border-t border-brand-100">
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-1.5 rounded border border-dashed border-brand-400 bg-white" /> Baseline
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-2 rounded bg-brand-600" /> Actual
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rotate-45 bg-brand-600" /> Framework milestone
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-0.5 h-3 bg-red-400" /> Today
          </span>
          <span className="flex items-center gap-2">
            <span className="text-emerald-600 font-semibold">on time</span>
            <span className="text-amber-600 font-semibold">≤7d slip</span>
            <span className="text-red-600 font-semibold">&gt;7d slip</span>
          </span>
        </div>
      </div>
    </div>
  )
}
