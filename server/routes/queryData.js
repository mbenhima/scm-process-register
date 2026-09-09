import { Router } from 'express'
import { answerQueryData } from '../lib/queryData.js'
import { callLLM, LlmProxyError } from '../lib/llmProxy.js'

const router = Router()

// POST /api/query-data
// body: { question, user: {role, scopeType, scopeId}, data: <full app state>, llm?: {provider, apiKey, model, baseUrl} }
router.post('/', async (req, res) => {
  const { question, user, data, llm } = req.body || {}
  if (!question || typeof question !== 'string') return res.status(400).json({ error: 'BAD_REQUEST', message: 'question is required.' })
  if (!user || !user.role) return res.status(400).json({ error: 'BAD_REQUEST', message: 'user (with role) is required — Query Data is RBAC-scoped.' })
  if (!data || !Array.isArray(data.organizations) || !Array.isArray(data.cmProjects)) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'data (organizations, cmProjects, users) is required.' })
  }

  let result
  try {
    result = answerQueryData(question, user, data)
  } catch (e) {
    return res.status(500).json({ error: 'RETRIEVAL_FAILED', message: e.message })
  }

  const groundingText =
    result.mode === 'aggregate'
      ? `COMPUTED FACT (do not alter this number, only phrase it naturally): ${result.fact}\nDETAIL: ${result.detail}`
      : result.mode === 'retrieval'
        ? `RETRIEVED RECORDS (answer only from these; say so plainly if they don't answer the question):\n${result.detail}`
        : 'No matching data was found in the visible scope. Say so plainly — do not guess.'

  const system =
    'You are Query Data, a RBAC-scoped assistant inside journi. Answer the question in 1-3 sentences of plain business prose. ' +
    'Never state a number that is not given to you below. If the grounding does not answer the question, say so rather than guessing.'
  const userPrompt = `QUESTION: ${question}\n\n${groundingText}`

  try {
    const answer = await callLLM(llm, system, userPrompt)
    res.json({ answer, mode: result.mode, fact: result.fact, sources: result.sources })
  } catch (e) {
    // Generation unavailable (no key configured, network error, etc.) — the
    // computed fact / retrieved records themselves are still real and
    // useful, so return them rather than fail the whole request.
    const code = e instanceof LlmProxyError ? e.code : 'GENERATION_FAILED'
    res.status(200).json({
      answer: result.fact || (result.sources[0] ? `Closest match: ${result.sources[0].label || result.sources[0].id}` : null),
      mode: result.mode,
      fact: result.fact,
      sources: result.sources,
      generationError: { code, message: e.message },
    })
  }
})

export default router
