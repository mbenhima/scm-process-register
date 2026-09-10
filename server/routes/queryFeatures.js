import { Router } from 'express'
import { answerQueryFeatures } from '../lib/queryFeatures.js'
import { callLLM, LlmProxyError } from '../lib/llmProxy.js'

const router = Router()

// POST /api/query-features
// body: { question, user: {role}, llm?: {provider, apiKey, model, baseUrl} }
router.post('/', async (req, res) => {
  const { question, user, llm } = req.body || {}
  if (!question || typeof question !== 'string') return res.status(400).json({ error: 'BAD_REQUEST', message: 'question is required.' })
  if (!user || !user.role) return res.status(400).json({ error: 'BAD_REQUEST', message: 'user (with role) is required.' })

  const { sources } = answerQueryFeatures(question, user)

  if (sources.length === 0) {
    return res.json({ answer: 'No module in journi matches that — try describing what you\'re trying to do instead of a module name.', sources: [] })
  }

  const system =
    'You are Query Features inside journi. In 1-2 sentences, tell the user which module answers their question and why, from the retrieved candidates only — never mention a module not listed below.'
  const userPrompt = `QUESTION: ${question}\n\nCANDIDATES (best match first):\n${sources.map((s) => `- ${s.name}${s.number ? ` (Module ${s.number})` : ''}: ${s.text}`).join('\n')}`

  try {
    const answer = await callLLM(llm, system, userPrompt)
    res.json({ answer, sources })
  } catch (e) {
    const code = e instanceof LlmProxyError ? e.code : 'GENERATION_FAILED'
    const top = sources[0]
    res.status(200).json({
      answer: `Closest match: ${top.name}${top.number ? ` (Module ${top.number})` : ''}.`,
      sources,
      generationError: { code, message: e.message },
    })
  }
})

export default router
