// Query Application Features' real logic: retrieval over journi's own
// feature/module catalog, filtered first to only the modules a given role
// can actually open — so a search never points someone at a screen their
// own RBAC would immediately block them from.
import { featureCorpusDocs } from './corpus/features.js'
import { buildIndex, search } from './retrieval.js'

export function answerQueryFeatures(question, user) {
  const role = user?.role
  const docs = featureCorpusDocs().filter((d) => !d.roles || d.roles.includes(role))
  const index = buildIndex(docs)
  const hits = search(index, question, 5)
  return {
    sources: hits.map((h) => ({ path: h.path, name: h.name, number: h.number, score: h.score, text: h.text })),
  }
}
