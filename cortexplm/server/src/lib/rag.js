// One offline retrieval engine (TF-IDF + cosine similarity) shared by AI Use Case grounding, the AI
// Assistant help mode and Help search (FR-DA-KB-02). No network call, no API key, reproducible.
// Tenant corpora are indexed per organization; no cross-tenant document can be returned (FR-DA-KB-03).
import { q } from '../db.js';
import { PROC } from './ref.js';
import { HELP } from './help.js';

const STOP = new Set('a an and are as at be by for from has have in is it its of on or that the to was were will with this these those your you our we can not no de la le les des du et en un une pour par sur dans est au aux ce qui que se son sa ses'.split(' '));
export function tokens(text = '') {
  return String(text).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .split(/[^\p{L}\p{N}-]+/u).filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => (t.length > 4 ? t.replace(/(ings|ing|ies|es|s|ed)$/, '') : t));
}

class Index {
  constructor(docs) {
    this.docs = docs;
    const df = new Map();
    this.vecs = docs.map((d) => {
      const tf = new Map();
      for (const t of tokens(`${d.title} ${d.title} ${d.text}`)) tf.set(t, (tf.get(t) || 0) + 1);
      for (const t of tf.keys()) df.set(t, (df.get(t) || 0) + 1);
      return tf;
    });
    const N = docs.length;
    this.idf = new Map([...df].map(([t, n]) => [t, Math.log(1 + N / n)]));
    this.vecs = this.vecs.map((tf) => {
      const v = new Map([...tf].map(([t, c]) => [t, (1 + Math.log(c)) * this.idf.get(t)]));
      const norm = Math.sqrt([...v.values()].reduce((s, x) => s + x * x, 0)) || 1;
      return { v, norm };
    });
  }
  search(query, k = 5) {
    const qt = new Map();
    for (const t of tokens(query)) if (this.idf.has(t)) qt.set(t, (qt.get(t) || 0) + this.idf.get(t));
    const qn = Math.sqrt([...qt.values()].reduce((s, x) => s + x * x, 0)) || 1;
    if (!qt.size) return [];
    return this.vecs.map(({ v, norm }, i) => {
      let dot = 0; for (const [t, w] of qt) if (v.has(t)) dot += w * v.get(t);
      return { i, score: dot / (norm * qn) };
    }).filter((r) => r.score > 0.02).sort((a, b) => b.score - a.score).slice(0, k)
      .map((r) => ({ ...this.docs[r.i], score: Math.round(r.score * 1000) / 1000 }));
  }
}

let globalIndex = null;
const tenantIndexes = new Map();
const helpIndexes = new Map();

function referenceDocs() {
  const docs = [];
  for (const m of PROC.macroProcesses) {
    docs.push({ kind: 'Macro process', ref: m.id, title: `${m.id} ${m.name}`, text: `${m.goal} Inputs: ${m.inputs} Process: ${(m.process || []).join(' ')} Outputs: ${m.outputs}`, link: `/library/${m.id}` });
  }
  for (const [id, e] of Object.entries(PROC.e2eDetail)) {
    const base = PROC.e2e.find((x) => x.E2E === id);
    docs.push({ kind: 'E2E process', ref: id, title: `${id} ${base.Name}`, text: `${base.Goal} Trigger: ${e.trigger} Terminal state: ${e.terminal} Tasks: ${e.tasks.map((t) => `${t.name} ${t.description}`).join('. ')}`, link: `/e2e/${id}` });
  }
  for (const g of PROC.gates) docs.push({ kind: 'Gate', ref: g.Gate, title: `Gate ${g.Gate}`, text: `${g['Decision question']} Minimum evidence: ${g['Minimum evidence']}`, link: '/gates-reference' });
  for (const r of PROC.trackRules) docs.push({ kind: 'Track rule', ref: r.id, title: `${r.id} ${r.title}`, text: r.text, link: '/tracks' });
  for (const f of PROC.findings) docs.push({ kind: 'Design finding', ref: f.ID, title: `${f.ID} ${f.Finding}`, text: `${f.Evidence} ${f.Resolution}`, link: '/tracks' });
  for (const g of PROC.glossary) docs.push({ kind: 'Glossary', ref: g.Term, title: g.Term, text: g.Definition, link: '/library' });
  for (const k of q.all('SELECT id, kind, ref, title, body FROM knowledge_docs WHERE org_id IS NULL')) docs.push({ kind: k.kind, ref: k.ref || `KB-${k.id}`, title: k.title, text: k.body, link: `/knowledge/${k.id}` });
  return docs;
}

export function invalidate(orgId) { if (orgId == null) globalIndex = null; tenantIndexes.delete(orgId); }

function tenantDocs(orgId) {
  const docs = [];
  for (const k of q.all('SELECT id, kind, ref, title, body FROM knowledge_docs WHERE org_id = ?', orgId)) docs.push({ kind: k.kind, ref: k.ref || `KB-${k.id}`, title: k.title, text: k.body, link: `/knowledge/${k.id}` });
  for (const r of q.all('SELECT id, title, went_well, went_wrong, root_cause, recommendation, category FROM rex_entries WHERE org_id = ?', orgId)) {
    docs.push({ kind: 'REX', ref: `REX-${r.id}`, title: r.title || `REX ${r.id}`, text: `${r.category}. Went well: ${r.went_well} Did not go well: ${r.went_wrong} Root cause: ${r.root_cause} Recommendation: ${r.recommendation}`, link: `/rex/${r.id}`, recordId: r.id });
  }
  for (const p of q.all('SELECT id, code, name, description, status, track FROM projects WHERE org_id = ?', orgId)) {
    docs.push({ kind: 'Project', ref: p.code, title: `${p.code} ${p.name}`, text: `${p.description || ''} ${p.track} Track, ${p.status}`, link: `/projects/${p.id}`, recordId: p.id });
  }
  return docs;
}

// Search the reference corpus plus the requesting tenant's own records.
export function search(orgId, query, { k = 6, kinds } = {}) {
  globalIndex ||= new Index(referenceDocs());
  if (!tenantIndexes.has(orgId)) tenantIndexes.set(orgId, new Index(tenantDocs(orgId)));
  const res = [...globalIndex.search(query, k * 2), ...tenantIndexes.get(orgId).search(query, k * 2)]
    .filter((d) => !kinds || kinds.includes(d.kind)).sort((a, b) => b.score - a.score).slice(0, k);
  return res.map((d) => ({ ...d, snippet: d.text.slice(0, 260) }));
}

// Help / FAQ corpus in the user's language (FR-DA-AST-04, FR-DA-HLP-03).
export function searchHelp(query, lang = 'en', k = 4) {
  if (!helpIndexes.has(lang)) helpIndexes.set(lang, new Index(HELP.map((h) => ({ kind: 'Help', ref: h.id, title: h.title[lang] || h.title.en, text: h.body[lang] || h.body.en, link: `/help#${h.id}` }))));
  return helpIndexes.get(lang).search(query, k);
}

// Similar tenant records (used by AIUC-01 idea de-duplication).
export function similarProjects(orgId, text, excludeId, k = 5) {
  const idx = new Index(tenantDocs(orgId).filter((d) => d.kind === 'Project' && d.recordId !== excludeId));
  return idx.search(text, k);
}
