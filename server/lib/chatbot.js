// "Ask journi" chatbot — the unified counterpart to Query Data (tenant
// records) and Query Features (module catalog): one assistant that can
// answer "how many risks are open on Atlas ERP", "where do I configure
// SSO", and "what's a good cadence for sponsor check-ins" in the same
// conversation, by combining all three retrieval sources this backend
// already builds separately, plus the new per-process knowledge base
// (D-Config item 7) neither of the other two routes reaches.
import { answerQueryData } from './queryData.js'
import { featureCorpusDocs } from './corpus/features.js'
import { buildIndex, search } from './retrieval.js'
import macroProcessCatalog from '../../journi/src/data/macroProcesses.js'
import processKnowledgeBase from '../../journi/src/data/processKnowledgeBase.js'

function buildKnowledgeCorpus() {
  const mpById = Object.fromEntries(macroProcessCatalog.map((mp) => [mp.id, mp]))
  return processKnowledgeBase.map((k) => ({
    id: k.id,
    mpId: k.mpId,
    text: `${k.title.en} (${mpById[k.mpId]?.name?.en || k.mpId}). ${k.body.en}`,
    label: k.title.en,
  }))
}

/**
 * Top-level entry point for POST /api/chatbot. Reuses answerQueryData for
 * the tenant-records aggregate/retrieval logic (still the only place a
 * number is computed rather than guessed by the LLM), and layers on two
 * more retrieval passes — the module-feature catalog and the seeded
 * process knowledge base — so a question that isn't about the tenant's own
 * records ("how do I run stakeholder assessment") still gets a grounded
 * answer instead of "no matching data found".
 */
export function answerChatbot(question, user, data) {
  const recordAnswer = answerQueryData(question, user, data)

  const featureDocs = featureCorpusDocs().filter((d) => !d.roles || d.roles.includes(user?.role))
  const featureHits = search(buildIndex(featureDocs), question, 3)

  const knowledgeHits = search(buildIndex(buildKnowledgeCorpus()), question, 3)

  return { recordAnswer, featureHits, knowledgeHits }
}
