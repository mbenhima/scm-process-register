// Lightweight, dependency-free RAG-style semantic retrieval engine.
// Implements TF-IDF vectorization + cosine similarity over a document corpus.
// This stands in for a vector-DB + embedding-model pipeline in an offline
// environment, while preserving the same retrieval contract described in the
// NCP Solver Knowledge Base (KB-014): RBAC-scoped, ranked-by-similarity search
// over the tenant's own Capitalization Library.

const STOPWORDS = new Set([
  'the', 'a', 'an', 'of', 'to', 'in', 'on', 'for', 'and', 'or', 'is', 'was', 'were', 'are',
  'this', 'that', 'with', 'by', 'at', 'as', 'it', 'be', 'been', 'from', 'not', 'no',
  'le', 'la', 'les', 'de', 'des', 'du', 'un', 'une', 'et', 'en', 'sur', 'pour', 'dans', 'au', 'aux', 'ce', 'ces',
]);

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9؀-ۿ\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function termFreq(tokens) {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  return tf;
}

export class RagIndex {
  constructor(documents = []) {
    this.documents = [];
    this.df = new Map(); // document frequency per term
    for (const doc of documents) this.addDocument(doc);
  }

  addDocument({ id, text, meta = {} }) {
    const tokens = tokenize(text);
    const tf = termFreq(tokens);
    for (const term of tf.keys()) this.df.set(term, (this.df.get(term) || 0) + 1);
    this.documents.push({ id, tokens, tf, meta, length: tokens.length });
  }

  _idf(term) {
    const n = this.documents.length || 1;
    const df = this.df.get(term) || 0;
    return Math.log((n + 1) / (df + 1)) + 1;
  }

  _vector(tf) {
    const vec = new Map();
    for (const [term, freq] of tf.entries()) vec.set(term, freq * this._idf(term));
    return vec;
  }

  search(query, { topK = 5, minScore = 0.02 } = {}) {
    const qTokens = tokenize(query);
    if (!qTokens.length || !this.documents.length) return [];
    const qVec = this._vector(termFreq(qTokens));
    const qNorm = Math.sqrt([...qVec.values()].reduce((s, v) => s + v * v, 0)) || 1;

    const scored = this.documents.map((doc) => {
      const dVec = this._vector(doc.tf);
      let dot = 0;
      for (const [term, qw] of qVec.entries()) {
        const dw = dVec.get(term);
        if (dw) dot += qw * dw;
      }
      const dNorm = Math.sqrt([...dVec.values()].reduce((s, v) => s + v * v, 0)) || 1;
      const score = dot / (qNorm * dNorm);
      return { id: doc.id, meta: doc.meta, score };
    });

    return scored
      .filter((s) => s.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}
