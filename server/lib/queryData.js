// Query Data's real logic: RBAC-scoped aggregation over the tenant's own
// data, computed here in code — never left to the LLM to eyeball a JSON
// blob and guess a number. The LLM's only job (see routes/queryData.js) is
// to phrase the fact this module already computed into a natural-language
// sentence, plus (when no aggregation matches) to answer from retrieved
// record snippets — grounded, cited, and still never asked to invent a
// number that isn't in front of it.
import { ROLES_WITH_INDIVIDUAL_VISIBILITY } from '../../journi/src/data/constants.js'
import { visibleOrganizations, visibleProjects } from '../../journi/src/utils/rbac.js'
import { evaluateAlerts } from '../../journi/src/utils/alertEngine.js'
import { buildIndex, search } from './retrieval.js'

/**
 * Rebuilds, server-side, exactly the set of Organizations and CM Projects
 * `user` is allowed to see — reusing journi's own real RBAC functions
 * rather than a second, hand-rolled copy of the visibility rule. This is
 * the enforcement point Query Data actually depends on: even if a caller
 * sent a full, unfiltered `data` payload, only this scoped subset is ever
 * read from it below.
 */
export function scopeData(user, data) {
  const orgs = visibleOrganizations(user, data)
  const orgIds = new Set(orgs.map((o) => o.id))
  const projects = data.cmProjects.filter((p) => orgIds.has(p.orgId) && visibleProjects(user, data, p.orgId).some((vp) => vp.id === p.id))
  const canSeeIndividual = ROLES_WITH_INDIVIDUAL_VISIBILITY.has(user?.role)
  return { orgs, projects, canSeeIndividual }
}

function pct(n, d) {
  return d ? Math.round((n / d) * 100) : 0
}

// --- Deterministic aggregations -------------------------------------------
// Each returns null if the question doesn't match its pattern, or a
// { fact, detail, sources } object if it does. `fact` is the ground-truth
// sentence the LLM is instructed to restate, not recompute.

function aggProjectCount({ q, projects }) {
  if (!/\b(how many|number of|count).*(project|program)/.test(q) && !/\bactive projects?\b/.test(q)) return null
  const byPhase = {}
  const byArchetype = {}
  for (const p of projects) {
    byPhase[p.lewinPhase] = (byPhase[p.lewinPhase] || 0) + 1
    byArchetype[p.changeType] = (byArchetype[p.changeType] || 0) + 1
  }
  return {
    fact: `There are ${projects.length} Change Management Project(s) visible to you.`,
    detail: `By Lewin phase: ${Object.entries(byPhase).map(([k, v]) => `${k}=${v}`).join(', ') || 'none'}. By change type: ${Object.entries(byArchetype).map(([k, v]) => `${k}=${v}`).join(', ') || 'none'}.`,
    sources: projects.map((p) => ({ id: p.id, label: `${p.name} (${p.lewinPhase})` })),
  }
}

function aggOrgCount({ q, orgs }) {
  if (!/\b(how many|number of|count).*(organization|org)\b/.test(q)) return null
  return {
    fact: `There are ${orgs.length} Organization(s) visible to you.`,
    detail: orgs.map((o) => `${o.name} (${o.sector})`).join('; '),
    sources: orgs.map((o) => ({ id: o.id, label: o.name })),
  }
}

function aggUserCount({ q, data, projects, orgs }) {
  if (!/\b(how many|number of|count).*(user|people|account)/.test(q)) return null
  const orgIds = new Set(orgs.map((o) => o.id))
  const projectIds = new Set(projects.map((p) => p.id))
  const visible = data.users.filter((u) => {
    if (u.scopeType === 'platform') return true
    if (u.scopeType === 'organization' || u.scopeType === 'group') return orgIds.has(u.scopeId) || u.scopeType === 'group'
    if (u.scopeType === 'project') return projectIds.has(u.scopeId)
    return false
  })
  const byRole = {}
  for (const u of visible) byRole[u.role] = (byRole[u.role] || 0) + 1
  return {
    fact: `There are ${visible.length} user account(s) visible to you.`,
    detail: Object.entries(byRole).map(([k, v]) => `${k}=${v}`).join(', '),
    sources: visible.slice(0, 15).map((u) => ({ id: u.id, label: `${u.name} — ${u.role}` })),
  }
}

function aggResistance({ q, projects }) {
  if (!/\bresistance\b/.test(q)) return null
  const rows = []
  let open = 0
  for (const p of projects) {
    const projOpen = (p.resistanceLog || []).filter((r) => r.status !== 'closed' && r.status !== 'resolved')
    open += projOpen.length
    if (projOpen.length) rows.push({ id: p.id, label: `${p.name}: ${projOpen.length} open` })
  }
  return {
    fact: `There are ${open} open Resistance Log entr${open === 1 ? 'y' : 'ies'} across ${projects.length} visible project(s).`,
    detail: rows.map((r) => r.label).join('; ') || 'No open entries.',
    sources: rows,
  }
}

function aggRisk({ q, projects }) {
  if (!/\brisks?\b/.test(q)) return null
  const byCategory = {}
  let open = 0
  const rows = []
  for (const p of projects) {
    for (const r of p.risks || []) {
      if (r.status === 'open' || r.status === 'in_progress') {
        open++
        byCategory[r.category] = (byCategory[r.category] || 0) + 1
        rows.push({ id: r.id, label: `${p.name}: ${r.category} — ${r.description}` })
      }
    }
  }
  return {
    fact: `There are ${open} open risk(s) across ${projects.length} visible project(s).`,
    detail: Object.entries(byCategory).map(([k, v]) => `${k}=${v}`).join(', ') || 'none',
    sources: rows.slice(0, 15),
  }
}

function aggAdkar({ q, projects, canSeeIndividual }) {
  if (!/\badkar\b|\bawareness\b|\bdesire\b|\bknowledge\b|\breinforcement\b/.test(q)) return null
  const blocks = ['awareness', 'desire', 'knowledge', 'ability', 'reinforcement']
  const rows = projects.map((p) => ({
    id: p.id,
    label: `${p.name}: ${blocks.map((b) => `${b}=${p.adkar?.[b]?.score ?? '—'}`).join(', ')}`,
  }))
  const avg = {}
  for (const b of blocks) {
    const scores = projects.map((p) => p.adkar?.[b]?.score).filter((n) => typeof n === 'number')
    avg[b] = scores.length ? Math.round((scores.reduce((a, c) => a + c, 0) / scores.length) * 10) / 10 : null
  }
  return {
    fact: `Average ADKAR scores across ${projects.length} visible project(s): ${blocks.map((b) => `${b}=${avg[b] ?? 'n/a'}`).join(', ')}.`,
    detail: canSeeIndividual ? rows.map((r) => r.label).join(' | ') : 'Per-project detail is restricted for your role — aggregate only.',
    sources: canSeeIndividual ? rows : [],
  }
}

function aggAlerts({ q, projects }) {
  if (!/\balerts?\b|\bfiring\b/.test(q)) return null
  const rows = []
  let total = 0
  for (const p of projects) {
    const otherOrgProjects = projects.filter((o) => o.orgId === p.orgId && o.id !== p.id)
    const fired = evaluateAlerts(p, { otherOrgProjects })
    total += fired.length
    for (const a of fired) rows.push({ id: `${p.id}-${a.id}`, label: `${p.name}: ${a.id} ${a.name} (${a.severity})` })
  }
  return {
    fact: `${total} alert(s) are currently firing across ${projects.length} visible project(s).`,
    detail: rows.map((r) => r.label).join('; ') || 'None firing.',
    sources: rows,
  }
}

const AGGREGATORS = [aggProjectCount, aggOrgCount, aggUserCount, aggResistance, aggRisk, aggAdkar, aggAlerts]

/**
 * Flattens the visible, RBAC-scoped dataset into short text records for
 * TF-IDF retrieval — the fallback path for a question no deterministic
 * aggregator recognizes (e.g. "what's driving the Atlas ERP program").
 */
function buildRecordCorpus({ projects, canSeeIndividual }) {
  const docs = []
  for (const p of projects) {
    docs.push({ id: p.id, text: `${p.name}. Business driver: ${p.businessDriver}. Target population: ${p.targetPopulation}. Lewin phase: ${p.lewinPhase}. Change type: ${p.changeType}.`, label: p.name })
    for (const r of p.risks || []) docs.push({ id: r.id, text: `${p.name} risk (${r.category}): ${r.description}. Owner: ${r.owner}. Status: ${r.status}.`, label: `${p.name} — risk` })
    for (const r of p.resistanceLog || []) docs.push({ id: r.id, text: `${p.name} resistance (${r.type}): ${r.rootCause}. Mitigation: ${r.mitigation}. Status: ${r.status}.`, label: `${p.name} — resistance` })
    if (canSeeIndividual) {
      for (const c of p.coachingNotes || []) docs.push({ id: c.id, text: `${p.name} coaching note: ${c.note || c.summary || ''}`, label: `${p.name} — coaching note` })
    }
  }
  return docs
}

/**
 * Top-level entry point. Returns { mode: 'aggregate'|'retrieval'|'none',
 * fact, detail, sources }. `fact`/`detail` become grounding context for the
 * LLM; `sources` is returned to the frontend unchanged for citation.
 */
export function answerQueryData(question, user, data) {
  const scoped = scopeData(user, data)
  const q = question.toLowerCase()
  for (const agg of AGGREGATORS) {
    const result = agg({ q, data, ...scoped })
    if (result) return { mode: 'aggregate', ...result }
  }
  const corpus = buildRecordCorpus(scoped)
  const index = buildIndex(corpus)
  const hits = search(index, question, 6)
  if (hits.length === 0) {
    return { mode: 'none', fact: 'No matching data found in your visible scope.', detail: '', sources: [] }
  }
  return {
    mode: 'retrieval',
    fact: null,
    detail: hits.map((h) => h.text).join('\n'),
    sources: hits.map((h) => ({ id: h.id, label: h.label, score: h.score })),
  }
}
