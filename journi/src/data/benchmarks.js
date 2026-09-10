// Module 20 — Change Management Benchmarking reference data.
// These are illustrative reference bands seeded for demonstration purposes,
// not sourced from a real industry study. They exist so a Change Manager,
// Organization, or Group can see whether their Composite Readiness Index is
// tracking ahead of, in line with, or behind a typical initiative at the
// same Lewin phase.
const READINESS_BAND_BY_LEWIN_PHASE = {
  unfreeze: { low: 20, mid: 35, high: 50 },
  change: { low: 40, mid: 55, high: 70 },
  refreeze: { low: 60, mid: 75, high: 90 },
}

const ADOPTION_RATE_BAND_BY_CHECKPOINT = {
  '30-day': { low: 40, mid: 60, high: 75 },
  '60-day': { low: 55, mid: 72, high: 85 },
  '90-day': { low: 65, mid: 80, high: 92 },
}

export function readinessBenchmark(lewinPhase) {
  return READINESS_BAND_BY_LEWIN_PHASE[lewinPhase] || READINESS_BAND_BY_LEWIN_PHASE.unfreeze
}

export function adoptionBenchmark(checkpointLabel) {
  return ADOPTION_RATE_BAND_BY_CHECKPOINT[checkpointLabel] || null
}

export function benchmarkStanding(value, band) {
  if (value == null || !band) return 'unknown'
  if (value < band.low) return 'behind'
  if (value < band.high) return 'in_line'
  return 'ahead'
}

export default { readinessBenchmark, adoptionBenchmark, benchmarkStanding }
