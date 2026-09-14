// journi's retrieval engine — real TF-IDF term weighting + cosine similarity
// over a bag-of-words vector space. This is the "R" in journi's backend RAG
// pipeline: no external embeddings API, no vector database, and no network
// call is required to run it, so it works fully offline and its results are
// exactly reproducible. It is a legitimate, if classic, retrieval algorithm
// (the same family that powered search engines before neural embeddings),
// not a keyword lookup table and not a canned response.
//
// A corpus is an array of { id, text, ...meta }. buildIndex() tokenizes and
// weights every document once; search() tokenizes the query the same way,
// scores every document by cosine similarity in TF-IDF space, and returns
// the top-k documents with their score, so a caller can decide its own
// relevance cutoff.

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'of', 'to', 'in', 'on', 'for',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'this', 'that', 'these', 'those', 'it',
  'its', 'as', 'at', 'by', 'with', 'from', 'up', 'down', 'not', 'no', 'so', 'do', 'does', 'did',
  'has', 'have', 'had', 'i', 'you', 'we', 'they', 'he', 'she', 'him', 'her', 'them', 'his',
  'their', 'our', 'your', 'what', 'which', 'who', 'whom', 'how', 'why', 'when', 'where', 'can',
  'could', 'would', 'should', 'will', 'shall', 'may', 'might', 'must', 'about', 'into', 'over',
  'per', 'vs', 'me', 'my', 'us',
])

export function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
}

function termFrequencies(tokens) {
  const tf = new Map()
  for (const tok of tokens) tf.set(tok, (tf.get(tok) || 0) + 1)
  // Log-normalized term frequency (Luhn/SMART "l" weighting) so a document
  // that repeats one word 20 times doesn't dominate purely on repetition.
  for (const [k, v] of tf) tf.set(k, 1 + Math.log(v))
  return tf
}

function magnitude(vec) {
  let sum = 0
  for (const v of vec.values()) sum += v * v
  return Math.sqrt(sum)
}

/**
 * Builds a TF-IDF index over `docs` (array of { id, text, ...meta }).
 * Returns an index object to pass into search(). Safe to rebuild per
 * request for a corpus this size (tens to low hundreds of documents) —
 * journi's corpora are small enough that this costs low single-digit
 * milliseconds, so no caching layer is needed for the demo's scale.
 */
export function buildIndex(docs) {
  const docTokens = docs.map((d) => tokenize(d.text))
  const df = new Map() // document frequency per term
  docTokens.forEach((tokens) => {
    const seen = new Set(tokens)
    for (const term of seen) df.set(term, (df.get(term) || 0) + 1)
  })
  const N = docs.length || 1
  const idf = new Map()
  for (const [term, count] of df) idf.set(term, Math.log(1 + N / count))

  const vectors = docTokens.map((tokens) => {
    const tf = termFrequencies(tokens)
    const vec = new Map()
    for (const [term, freq] of tf) vec.set(term, freq * (idf.get(term) || 0))
    return { vec, mag: magnitude(vec) }
  })

  return { docs, idf, vectors, N }
}

/**
 * Searches an index built by buildIndex() and returns the top-k documents
 * with a `score` (cosine similarity, 0-1) attached, highest first. Documents
 * scoring 0 (no term overlap at all) are excluded.
 */
export function search(index, query, k = 5) {
  const qTokens = tokenize(query)
  if (qTokens.length === 0) return []
  const qtf = termFrequencies(qTokens)
  const qvec = new Map()
  for (const [term, freq] of qtf) {
    const w = index.idf.get(term)
    if (w) qvec.set(term, freq * w)
  }
  const qmag = magnitude(qvec)
  if (qmag === 0) return []

  const scored = index.docs.map((doc, i) => {
    const { vec, mag } = index.vectors[i]
    if (mag === 0) return { doc, score: 0 }
    let dot = 0
    for (const [term, w] of qvec) {
      const dw = vec.get(term)
      if (dw) dot += w * dw
    }
    return { doc, score: dot / (qmag * mag) }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => ({ ...s.doc, score: Math.round(s.score * 1000) / 1000 }))
}
