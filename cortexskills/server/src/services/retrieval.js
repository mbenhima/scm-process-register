// One offline retrieval engine (TF-IDF + cosine similarity) shared by AI grounding, the AI Assistant help
// mode, Help search and the Knowledge Base (Section 3.5, FR-DA-KB-02). Tenant corpora are scoped by organization.
import { all } from '../db.js';
import { J, pick } from '../lib/util.js';
import * as cat from '../catalog.js';
import { config } from '../config.js';

const STOP = new Set('the a an of to and or in on for with by is are be as at from this that it its into how do i can what which who de la le les des du et en un une pour par sur dans est au aux à ce qui que comment je peux في من على إلى و أن عن ما هل كيف'.split(' '));
export function tokenize(text) {
  return String(text || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 1 && !STOP.has(w));
}
class Index {
  constructor(docs) {
    this.docs = docs; this.df = new Map(); this.vecs = [];
    const tfs = docs.map(d => { const tf = new Map(); for (const w of tokenize(d.text)) tf.set(w, (tf.get(w) || 0) + 1); return tf; });
    for (const tf of tfs) for (const w of tf.keys()) this.df.set(w, (this.df.get(w) || 0) + 1);
    const N = docs.length || 1;
    this.idf = w => Math.log(1 + N / (this.df.get(w) || 0.5));
    this.vecs = tfs.map(tf => { const v = new Map(); let n = 0; for (const [w, c] of tf) { const x = (1 + Math.log(c)) * this.idf(w); v.set(w, x); n += x * x; } return { v, n: Math.sqrt(n) || 1 }; });
  }
  search(query, k = 5, filter) {
    const q = new Map(); for (const w of tokenize(query)) q.set(w, (q.get(w) || 0) + 1);
    let qn = 0; const qv = new Map(); for (const [w, c] of q) { const x = (1 + Math.log(c)) * this.idf(w); qv.set(w, x); qn += x * x; } qn = Math.sqrt(qn) || 1;
    const out = [];
    this.docs.forEach((d, i) => {
      if (filter && !filter(d)) return;
      let s = 0; for (const [w, x] of qv) { const y = this.vecs[i].v.get(w); if (y) s += x * y; }
      if (s > 0) out.push({ ...d, score: +(s / (qn * this.vecs[i].n)).toFixed(4) });
    });
    return out.sort((a, b) => b.score - a.score).slice(0, k);
  }
}

let staticIndex = null;
/** Static corpus: help articles, FAQ, glossary and the process design, in every language. */
export function staticCorpus() {
  if (staticIndex) return staticIndex;
  const docs = [];
  for (const h of cat.list('help')) for (const l of ['en', 'fr', 'ar']) docs.push({ source: 'help', id: h.id, lang: l, title: pick(h.title, l), text: pick(h.title, l) + ' ' + pick(h.body, l), route: h.route });
  for (const q of cat.list('faq')) for (const l of ['en', 'fr', 'ar']) docs.push({ source: 'faq', id: q.id, lang: l, title: pick(q.q, l), text: pick(q.q, l) + ' ' + pick(q.a, l) + ' ' + (q.keywords || ''), answer: pick(q.a, l), route: q.route });
  for (const m of cat.list('mp')) for (const l of ['en', 'fr', 'ar']) docs.push({ source: 'process', id: m.id, lang: l, title: `${m.id} ${pick(m.name, l)}`, text: `${m.id} ${pick(m.name, l)} ${pick(m.objective, l)}`, route: `/process/mp/${m.id}` });
  for (const e of cat.list('e2e')) for (const l of ['en', 'fr', 'ar']) docs.push({ source: 'process', id: e.id, lang: l, title: `${e.id} ${pick(e.name, l)}`, text: `${e.id} ${pick(e.name, l)} ${pick(e.goal, l)} ${pick(e.description, l)}`, route: `/process/e2e/${e.id}` });
  for (const g of cat.list('glossary')) docs.push({ source: 'glossary', id: g.id, lang: 'fr', title: g.fr, text: g.fr + ' ' + g.en });
  staticIndex = new Index(docs);
  return staticIndex;
}

const tenantCache = new Map();
export function invalidateTenant(orgId) { tenantCache.delete(orgId); }
/** Tenant corpus: Knowledge Base articles, REX entries and completed task outputs of this organization only (FR-DA-KB-03). */
export function tenantCorpus(orgId) {
  const c = tenantCache.get(orgId);
  if (c && Date.now() - c.t < config.cacheTtlMs * 10) return c.index;
  const docs = [];
  for (const r of all(`SELECT id, entity, data FROM records WHERE org_id=? AND entity IN ('KbArticle','RexEntry')`, orgId)) {
    const d = J(r.data, {});
    for (const l of ['en', 'fr', 'ar']) {
      const title = pick(d.title || d.category || d.what_went_well, l);
      docs.push({ source: r.entity === 'KbArticle' ? 'kb' : 'rex', id: r.id, lang: l, title, text: Object.values(d).map(v => typeof v === 'object' ? pick(v, l) : String(v ?? '')).join(' ') });
    }
  }
  for (const r of all(`SELECT t.id, t.uft_id, t.output FROM task_instances t WHERE t.org_id=? AND t.status='Completed' LIMIT 3000`, orgId)) {
    const o = J(r.output, {}); for (const l of ['en', 'fr', 'ar']) docs.push({ source: 'record', id: r.id, lang: l, title: r.uft_id, text: r.uft_id + ' ' + pick(o, l) });
  }
  const index = new Index(docs); tenantCache.set(orgId, { t: Date.now(), index });
  return index;
}
export function retrieve(orgId, query, { lang, k = 5, sources } = {}) {
  const f = d => (!lang || d.lang === lang) && (!sources || sources.includes(d.source));
  return [...staticCorpus().search(query, k * 2, f), ...(orgId ? tenantCorpus(orgId).search(query, k * 2, f) : [])]
    .sort((a, b) => b.score - a.score).slice(0, k);
}
