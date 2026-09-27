import { Router } from 'express'
import { answerChatbot } from '../lib/chatbot.js'
import { callLLM, LlmProxyError } from '../lib/llmProxy.js'

const router = Router()

// POST /api/chatbot
// body: { question, history?: [{role,text}], user: {role, scopeType, scopeId}, data: <full app state>, llm?: {...} }
router.post('/', async (req, res) => {
  const { question, history, user, data, llm } = req.body || {}
  if (!question || typeof question !== 'string') return res.status(400).json({ error: 'BAD_REQUEST', message: 'question is required.' })
  if (!user || !user.role) return res.status(400).json({ error: 'BAD_REQUEST', message: 'user (with role) is required — the chatbot is RBAC-scoped.' })
  if (!data || !Array.isArray(data.organizations) || !Array.isArray(data.cmProjects)) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'data (organizations, cmProjects, users) is required.' })
  }

  let result
  try {
    result = answerChatbot(question, user, data)
  } catch (e) {
    return res.status(500).json({ error: 'RETRIEVAL_FAILED', message: e.message })
  }

  const { recordAnswer, featureHits, knowledgeHits } = result
  const sections = []
  if (recordAnswer.mode === 'aggregate') {
    sections.push(`COMPUTED FACT ABOUT THIS TENANT (do not alter this number, only phrase it naturally): ${recordAnswer.fact}\nDETAIL: ${recordAnswer.detail}`)
  } else if (recordAnswer.mode === 'retrieval' && recordAnswer.detail) {
    sections.push(`RETRIEVED TENANT RECORDS:\n${recordAnswer.detail}`)
  }
  if (featureHits.length) {
    sections.push(`RELEVANT JOURNI MODULES (where to do this in the app):\n${featureHits.map((h) => `${h.name} (${h.path}): ${h.text}`).join('\n')}`)
  }
  if (knowledgeHits.length) {
    sections.push(`PRACTITIONER GUIDANCE (seeded knowledge base):\n${knowledgeHits.map((h) => h.text).join('\n')}`)
  }
  const groundingText = sections.length ? sections.join('\n\n') : 'No matching tenant data, module, or guidance was found. Say so plainly — do not guess.'

  const historyText = Array.isArray(history) && history.length
    ? '\n\nRECENT CONVERSATION (for context only):\n' + history.slice(-6).map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n')
    : ''

  const system =
    'You are "Ask journi", a governed assistant embedded in the journi change-management platform. Answer in 2-4 sentences of plain business prose. ' +
    'Never state a tenant-specific number that is not given to you in COMPUTED FACT or RETRIEVED TENANT RECORDS below. ' +
    'When pointing the user to a module, name it and its path. If nothing in the grounding answers the question, say so rather than guessing. ' +
    'You are Assistive, not Autonomous: you may explain, summarize, and suggest, but never claim to have taken an action on the user\'s behalf.'
  const userPrompt = `QUESTION: ${question}${historyText}\n\n${groundingText}`

  const sources = [
    ...(recordAnswer.sources || []),
    ...featureHits.map((h) => ({ id: h.path, label: h.name })),
    ...knowledgeHits.map((h) => ({ id: h.id, label: h.label })),
  ]

  try {
    const answer = await callLLM(llm, system, userPrompt)
    res.json({ answer, sources })
  } catch (e) {
    const code = e instanceof LlmProxyError ? e.code : 'GENERATION_FAILED'
    const fallback = recordAnswer.fact || (sources[0] ? `Closest match: ${sources[0].label}` : 'I could not find anything relevant, and no AI provider is connected to phrase a fuller answer.')
    res.status(200).json({ answer: fallback, sources, generationError: { code, message: e.message } })
  }
})

export default router
