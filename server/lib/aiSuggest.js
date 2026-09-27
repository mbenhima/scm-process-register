// RAG upgrade for the AI Use Case Library (Module 6): before generating any
// of the 14 catalog entries' output, retrieve the methodology snippets most
// relevant to that use case's own prompt template — grounding the
// generation in journi's actual stage vocabulary (see corpus/methodology.js)
// instead of the model's own generic notion of "Desire" or "Neutral Zone" —
// plus whatever specific record context the calling page supplies (the
// actual ADKAR scores, the actual survey text, etc.).
import aiUseCaseCatalog from '../../journi/src/data/aiUseCases.js'
import { methodologyCorpusDocs } from './corpus/methodology.js'
import { buildIndex, search } from './retrieval.js'

const methodologyIndex = buildIndex(methodologyCorpusDocs())

export function findUseCase(useCaseId) {
  return aiUseCaseCatalog.find((uc) => uc.id === useCaseId) || null
}

/**
 * Retrieves the grounding context for one AI use case invocation.
 * @param {string} useCaseId
 * @param {string} [recordContext] free text describing the specific record
 *   being processed (e.g. the actual survey response, the actual ADKAR
 *   scores) — supplied by the calling module page, not invented here.
 */
export function retrieveGrounding(useCaseId, recordContext) {
  const uc = findUseCase(useCaseId)
  if (!uc) return { useCase: null, sources: [] }
  const query = [uc.description, uc.promptTemplate, recordContext].filter(Boolean).join(' ')
  const hits = search(methodologyIndex, query, 4)
  return { useCase: uc, sources: hits.map((h) => ({ id: h.id, text: h.text, score: h.score })) }
}

export function buildGroundedPrompt(useCaseId, recordContext) {
  const { useCase, sources } = retrieveGrounding(useCaseId, recordContext)
  if (!useCase) return null
  const system =
    `You are the "${useCase.name}" AI use case inside journi, a human change-management platform. ` +
    `Stay strictly inside journi's own stage vocabulary given in the reference definitions below — do not substitute a different framework's terms. ` +
    `This use case is ${useCase.tier === 'augmented' ? 'Augmented' : 'Assistive'}: your output is always a draft, never a final record — a human must accept, edit, or reject it. ` +
    `Do not state a specific number, score, or name that is not present in the record context below.\n\n` +
    `REFERENCE DEFINITIONS (retrieved, most relevant first):\n${sources.map((s) => `- ${s.text}`).join('\n')}`
  const user =
    `${useCase.promptTemplate}\n\n` +
    (recordContext ? `RECORD CONTEXT:\n${recordContext}` : 'RECORD CONTEXT: (none supplied — use the general case description only.)')
  return { system, user, useCase, sources }
}
