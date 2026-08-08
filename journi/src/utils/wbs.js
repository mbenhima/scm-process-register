export const WBS_TRACKS = ['pm', 'cm', 'framework']
export const WBS_STATUSES = ['planned', 'in_progress', 'done', 'at_risk']

export function addDays(dateISO, n) {
  const d = new Date(dateISO + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function daysBetween(aISO, bISO) {
  const a = new Date(aISO + 'T00:00:00')
  const b = new Date(bISO + 'T00:00:00')
  return Math.round((b - a) / 86400000)
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Schedule variance for a task: positive = actual finished/is running later
 * than baseline (slippage), negative = ahead of baseline, null = nothing to
 * compare yet (task hasn't started against its baseline window).
 */
export function taskGapDays(task) {
  if (task.actualEnd) return daysBetween(task.baselineEnd, task.actualEnd)
  if (task.actualStart) {
    const today = todayISO()
    return today > task.baselineEnd ? daysBetween(task.baselineEnd, today) : 0
  }
  return null
}

export function gapTone(gapDays) {
  if (gapDays === null || gapDays === undefined) return 'gray'
  if (gapDays <= 0) return 'green'
  if (gapDays <= 7) return 'amber'
  return 'red'
}

export function dateRangeForTasks(tasks) {
  const dates = tasks.flatMap((t) => [t.baselineStart, t.baselineEnd, t.actualStart, t.actualEnd].filter(Boolean))
  if (dates.length === 0) {
    const start = todayISO()
    return { start, end: addDays(start, 90) }
  }
  const sorted = [...dates].sort()
  return { start: addDays(sorted[0], -7), end: addDays(sorted[sorted.length - 1], 7) }
}

export function pctForDate(dateISO, range) {
  const total = daysBetween(range.start, range.end) || 1
  const pos = daysBetween(range.start, dateISO)
  return Math.min(100, Math.max(0, (pos / total) * 100))
}

export function monthTicks(range) {
  const ticks = []
  const cursor = new Date(range.start + 'T00:00:00')
  cursor.setDate(1)
  const end = new Date(range.end + 'T00:00:00')
  while (cursor <= end) {
    const iso = cursor.toISOString().slice(0, 10)
    ticks.push({ iso, label: cursor.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), pct: pctForDate(iso, range) })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return ticks
}

/**
 * A representative starter WBS spanning Project Management, Change Management
 * and the framework milestones, anchored to `startISO`. Used only to seed the
 * demo case-study projects with something to look at — brand-new CM Projects
 * created through the UI start with an empty WBS so a real rollout isn't
 * pre-populated with fictional dates.
 */
export function generateDefaultWbs(startISO) {
  const s = (n) => addDays(startISO, n)
  const raw = [
    // Project Management track
    { track: 'pm', phase: 'Phase 0', name: 'Stand up tenant hierarchy & governance', baselineStart: s(0), baselineEnd: s(10), actualStart: s(0), actualEnd: s(12) },
    { track: 'pm', phase: 'Phase 1', name: 'Complete initiative profile & business case', baselineStart: s(10), baselineEnd: s(24), actualStart: s(12), actualEnd: s(24) },
    { track: 'pm', phase: 'Phase 2', name: 'Confirm delivery scope & budget band', baselineStart: s(24), baselineEnd: s(38), actualStart: s(24), actualEnd: s(40) },
    { track: 'pm', phase: 'Phase 5', name: 'Expand the portfolio', baselineStart: s(270), baselineEnd: s(280), actualStart: null, actualEnd: null },
    { track: 'pm', phase: 'Phase 5', name: 'Confirm the Readiness Index at every level', baselineStart: s(280), baselineEnd: s(300), actualStart: null, actualEnd: null },
    { track: 'pm', phase: 'Phase 5', name: 'Benchmark against portfolio peers', baselineStart: s(300), baselineEnd: s(330), actualStart: null, actualEnd: null },
    { track: 'pm', phase: 'Phase 6', name: 'Provision users & verify RBAC', baselineStart: s(360), baselineEnd: s(367), actualStart: null, actualEnd: null },
    { track: 'pm', phase: 'Phase 7', name: 'Configure Permission Matrix & justification governance', baselineStart: s(385), baselineEnd: s(392), actualStart: null, actualEnd: null },

    // Change Management track
    { track: 'cm', phase: 'Phase 0', name: 'Register & link the Change Management Project', baselineStart: s(3), baselineEnd: s(6), actualStart: s(3), actualEnd: s(6) },
    { track: 'cm', phase: 'Phase 1', name: 'Map stakeholders & impact', baselineStart: s(14), baselineEnd: s(24), actualStart: s(16), actualEnd: s(27) },
    { track: 'cm', phase: 'Phase 1', name: 'Establish baseline sponsor visibility', baselineStart: s(20), baselineEnd: s(26), actualStart: s(22), actualEnd: s(30) },
    { track: 'cm', phase: 'Phase 2', name: 'Score initial Awareness (ADKAR)', baselineStart: s(38), baselineEnd: s(45), actualStart: s(41), actualEnd: s(49) },
    { track: 'cm', phase: 'Phase 2', name: 'Stand up the first training curriculum', baselineStart: s(45), baselineEnd: s(120), actualStart: s(49), actualEnd: null },
    { track: 'cm', phase: 'Phase 2', name: 'Plan the first target-population communication', baselineStart: s(120), baselineEnd: s(135), actualStart: null, actualEnd: null },
    { track: 'cm', phase: 'Phase 3', name: 'Score Desire & diagnose the stall', baselineStart: s(200), baselineEnd: s(210), actualStart: null, actualEnd: null },
    { track: 'cm', phase: 'Phase 3', name: 'Update Bridges & Kübler-Ross position', baselineStart: s(210), baselineEnd: s(220), actualStart: null, actualEnd: null },
    { track: 'cm', phase: 'Phase 4', name: 'Assess manager readiness', baselineStart: s(235), baselineEnd: s(242), actualStart: null, actualEnd: null },
    { track: 'cm', phase: 'Phase 4', name: 'Mark go-live on the journey map', baselineStart: s(250), baselineEnd: s(250), actualStart: null, actualEnd: null },

    // Framework milestones (zero-duration markers)
    { track: 'framework', phase: 'Lewin', name: 'Unfreeze → Change', baselineStart: s(200), baselineEnd: s(200), actualStart: null, actualEnd: null },
    { track: 'framework', phase: 'Prosci', name: 'Prepare → Manage', baselineStart: s(200), baselineEnd: s(200), actualStart: null, actualEnd: null },
    { track: 'framework', phase: 'Bridges', name: 'Ending → Neutral Zone', baselineStart: s(210), baselineEnd: s(210), actualStart: null, actualEnd: null },
    { track: 'framework', phase: 'ADKAR', name: 'Awareness staged to 3', baselineStart: s(45), baselineEnd: s(45), actualStart: s(49), actualEnd: s(49) },
  ]
  return raw.map((t) => ({
    ...t,
    status: t.actualEnd ? 'done' : t.actualStart ? 'in_progress' : 'planned',
    percentComplete: t.actualEnd ? 100 : t.actualStart ? 50 : 0,
  }))
}
