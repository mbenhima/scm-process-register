import { Router } from 'express'
import { buildGroundedPrompt } from '../lib/aiSuggest.js'
import { callLLM, LlmProxyError } from '../lib/llmProxy.js'

const router = Router()

// POST /api/ai-suggest
// body: { useCaseId, recordContext?, llm?: {provider, apiKey, model, baseUrl} }
router.post('/', async (req, res) => {
  const { useCaseId, recordContext, llm } = req.body || {}
  if (!useCaseId) return res.status(400).json({ error: 'BAD_REQUEST', message: 'useCaseId is required.' })

  const grounded = buildGroundedPrompt(useCaseId, recordContext)
  if (!grounded) return res.status(404).json({ error: 'NOT_FOUND', message: `Unknown useCaseId: ${useCaseId}` })

  try {
    const text = await callLLM(llm, grounded.system, grounded.user)
    res.json({
      text,
      tier: grounded.useCase.tier,
      humanCheckpoint: grounded.useCase.humanCheckpoint,
      sources: grounded.sources,
    })
  } catch (e) {
    // Same graceful-degradation contract as /api/query-data and
    // /api/query-features: a caller always gets the real retrieval result
    // back, even with generation unavailable, so the frontend has one
    // uniform fallback path (drop to the direct-LLM call, then the
    // built-in template) instead of a special case for this route alone.
    const code = e instanceof LlmProxyError ? e.code : 'GENERATION_FAILED'
    res.status(200).json({
      text: null,
      tier: grounded.useCase.tier,
      humanCheckpoint: grounded.useCase.humanCheckpoint,
      sources: grounded.sources,
      generationError: { code, message: e.message },
    })
  }
})

export default router
