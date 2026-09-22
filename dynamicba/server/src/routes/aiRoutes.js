import { Router } from 'express'
import { findOne, update, insert } from '../db.js'
import { authenticate, requireOwnOrg, requireCapability } from '../middleware.js'

const router = Router({ mergeParams: true })
router.use('/organizations/:orgId/ai', authenticate, requireOwnOrg)

const DEFAULT_MODEL = 'claude-sonnet-5'
const ANTHROPIC_VERSION = '2023-06-01'

function getOrgConfig(orgId) {
  return findOne('orgConfig', (c) => c.orgId === orgId)
}

// Falls back to a server-wide ANTHROPIC_API_KEY env var (set in server/.env) for
// technical users who'd rather not store the key in the app's own data file; the
// Admin > AI Provider tab (per-organization, stored in orgConfig) takes precedence.
function resolveAiConfig(orgId) {
  const cfg = getOrgConfig(orgId)
  const apiKey = cfg?.aiConfig?.apiKey || process.env.ANTHROPIC_API_KEY || ''
  const model = cfg?.aiConfig?.model || process.env.ANTHROPIC_MODEL || DEFAULT_MODEL
  const source = cfg?.aiConfig?.apiKey ? 'organization' : process.env.ANTHROPIC_API_KEY ? 'server' : null
  return { apiKey, model, source }
}

router.get('/organizations/:orgId/ai/config', (req, res) => {
  const { apiKey, model, source } = resolveAiConfig(req.params.orgId)
  res.json({ configured: !!apiKey, model, source })
})

router.put('/organizations/:orgId/ai/config', requireCapability('config.manage'), (req, res) => {
  const { orgId } = req.params
  const { apiKey, model } = req.body
  let cfg = getOrgConfig(orgId)
  const aiConfig = { ...(cfg?.aiConfig || {}) }
  if (apiKey !== undefined) aiConfig.apiKey = apiKey
  if (model !== undefined) aiConfig.model = model
  if (cfg) update('orgConfig', cfg.id, { aiConfig })
  else insert('orgConfig', { orgId, permissionMatrix: {}, complianceStandards: {}, aiConfig })
  const resolved = resolveAiConfig(orgId)
  res.json({ configured: !!resolved.apiKey, model: resolved.model, source: resolved.source })
})

router.delete('/organizations/:orgId/ai/config', requireCapability('config.manage'), (req, res) => {
  const cfg = getOrgConfig(req.params.orgId)
  if (cfg) update('orgConfig', cfg.id, { aiConfig: { ...(cfg.aiConfig || {}), apiKey: '' } })
  res.status(204).end()
})

const SYSTEM_PROMPT = `You are DynamicBA's AI Specification Assistant, embedded inside a management-consulting scope-to-specs platform. Given a client's Statement of Work, stakeholder list, and industry, you draft a first-pass automation opportunity assessment and future-state specification set for a human business analyst to review, correct, and approve. You are never the final authority — everything you produce is a draft.

Respond with ONLY a single JSON object (no markdown fences, no commentary) matching exactly this shape:
{
  "automationCandidates": [ { "name": string, "technical": 0-100, "dataQuality": 0-100, "processStability": 0-100, "strategicFit": 0-100, "annualBenefitUsd": number, "oneTimeCostUsd": number, "dataAvailability": "Low"|"Medium"|"High", "rationale": string } ],
  "painPoints": [ { "description": string, "severity": "Low"|"Medium"|"High"|"Critical" } ],
  "systemLandscape": [ { "system": string } ],
  "useCases": [ { "name": string, "description": string } ],
  "businessRules": [ { "name": string, "condition": string, "action": string } ],
  "controls": [ { "name": string, "type": "Preventive"|"Detective", "linkedToFinancialAction": boolean, "description": string } ],
  "kpis": [ { "name": string, "targetValue": string, "description": string } ],
  "risks": [ { "category": string, "description": string } ]
}

Produce 3-6 items per array, grounded specifically in the SOW text given (not generic filler), and written the way an experienced business analyst in the stated industry would write them.`

async function callAnthropic({ apiKey, model, userContent }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    }),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message = data?.error?.message || `Anthropic API returned HTTP ${res.status}`
    const err = new Error(message)
    err.status = res.status
    throw err
  }
  const text = (data?.content || []).map((b) => b.text || '').join('\n')
  return text
}

function parseJsonLoose(text) {
  try { return JSON.parse(text) } catch { /* fall through */ }
  const match = text.match(/\{[\s\S]*\}/)
  if (match) {
    try { return JSON.parse(match[0]) } catch { /* fall through */ }
  }
  throw new Error('The AI response was not valid JSON.')
}

router.post('/organizations/:orgId/ai/generate-specs', requireCapability('project.write'), async (req, res) => {
  const { apiKey, model } = resolveAiConfig(req.params.orgId)
  if (!apiKey) {
    return res.status(400).json({ error: 'No AI provider is configured yet. Ask an Organization Admin to add an Anthropic API key under Admin → AI Provider.' })
  }
  const { sow, stakeholders, industry, clientName, projectName } = req.body
  const userContent = [
    `Client: ${clientName || 'Unknown'} (industry: ${industry || 'Unknown'})`,
    `Engagement: ${projectName || 'Unknown'}`,
    `Objectives: ${sow?.objectives || '—'}`,
    `Scope: ${sow?.scope || '—'}`,
    `Deliverables: ${sow?.deliverables || '—'}`,
    `Timeline: ${sow?.timeline || '—'}`,
    `Constraints: ${sow?.constraints || '—'}`,
    `Stakeholders: ${(stakeholders || []).map((s) => `${s.Name} (${s.Role})`).join(', ') || '—'}`,
  ].join('\n')

  try {
    const text = await callAnthropic({ apiKey, model, userContent })
    const draft = parseJsonLoose(text)
    res.json(draft)
  } catch (err) {
    res.status(err.status && err.status < 500 ? 422 : 502).json({ error: `AI generation failed: ${err.message}` })
  }
})

export default router
