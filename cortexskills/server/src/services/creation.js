// Complexity scoring (Section 4.30) and the AI-drafted project (FR-DA-PCM-04).
import { all, one } from '../db.js';
import { J, pick, HttpError } from '../lib/util.js';
import { tokenize } from './retrieval.js';
import * as cat from '../catalog.js';
import { processPlan } from './projects.js';

/** Weighted score 0-100 from criterion values 1-5. Weights must sum to 100 (FR-DA-SCO-02). */
export function scoreComplexity(values = {}, verticalId = null) {
  const crit = all(`SELECT data FROM records WHERE entity='ComplexityCriterion'`).map(r => J(r.data)).filter(c => !c.vertical_id);
  const vcrit = verticalId ? all(`SELECT data FROM records WHERE entity='ComplexityCriterion'`).map(r => J(r.data)).filter(c => c.vertical_id === verticalId) : [];
  const total = crit.reduce((s, c) => s + c.weight, 0);
  if (Math.round(total) !== 100) throw new HttpError(422, 'err.weightsSum', { total });
  let score = 0; const used = {};
  for (const c of crit) { const v = Number(values[c.code] ?? 3); used[c.code] = v; score += ((v - 1) / 4) * c.weight; }
  // Vertical drivers adjust the score within ±10 points, weighted by their own weights.
  if (vcrit.length) {
    const vw = vcrit.reduce((s, c) => s + c.weight, 0) || 1; let adj = 0;
    for (const c of vcrit) { const v = Number(values[c.code] ?? 3); used[c.code] = v; adj += ((v - 3) / 2) * (c.weight / vw) * 10; }
    score = Math.max(0, Math.min(100, score + adj));
  }
  score = Math.round(score * 10) / 10;
  const tracks = all(`SELECT data FROM records WHERE entity='SmeTrack'`).map(r => J(r.data)).sort((a, b) => a.score_min - b.score_min);
  const rec = tracks.find(t => score >= t.score_min && score <= t.score_max) || tracks[tracks.length - 1];
  return { score, values: used, recommendedTrack: rec?.code || null, recommendedMode: score >= 70 ? 'Full' : 'SME', criteria: crit.length + vcrit.length };
}

/** Draft a project from a short description with the built-in engine (Assistive AI): nothing is saved here. */
export function draftProject(req, description) {
  const lang = req.lang; const words = new Set(tokenize(description));
  const org = one(`SELECT * FROM organizations WHERE id=?`, req.orgId);
  const focus = [...words].some(w => ['ai', 'ia', 'intelligence', 'الذكاء', 'genai', 'machine', 'llm'].includes(w)) ? 'AI' : [...words].some(w => ['digital', 'numerique', 'numérique', 'الرقمي', 'rpa', 'erp', 'cloud'].includes(w)) ? 'Digital' : 'All';
  const vertical = cat.list('verticalSeed').find(v => tokenize(['en', 'fr', 'ar'].map(l => pick(v.name, l)).join(' ')).some(w => words.has(w)))?.id || org.sector;
  const values = {};
  for (const c of all(`SELECT data FROM records WHERE entity='ComplexityCriterion'`).map(r => J(r.data))) {
    let v = org.segment === 'SME' ? 2 : 4;
    if (c.code === 'regulatory' && [...words].some(w => /regul|compliance|conform|haccp|iso|audit|تنظيم/.test(w))) v = 5;
    if (c.code === 'novelty' && focus === 'AI') v = 5;
    if (c.code === 'scope' && [...words].some(w => /site|group|groupe|multi|فروع/.test(w))) v = 5;
    values[c.code] = v;
  }
  const score = scoreComplexity(values, vertical);
  const mode = org.segment === 'SME' ? 'SME' : 'Full';
  const templates = all(`SELECT id, data FROM records WHERE entity='ProjectTemplate' AND (org_id IS NULL OR org_id=?)`, req.orgId).map(r => ({ id: r.id, ...J(r.data) }))
    .filter(t => t.status === 'Published' && t.mode === mode);
  const closest = templates.sort((a, b) => (b.vertical_id === vertical) - (a.vertical_id === vertical) || (b.focus === focus) - (a.focus === focus))[0];
  const phases = processPlan({ mode, track: score.recommendedTrack, vertical });
  const gates = cat.list('gateSeed');
  return {
    source: 'built-in', tier: 'Assistive', label: 'ai.label',
    items: [
      { key: 'name', value: { en: `${pick(cat.get('focusLabel', focus)?.label, 'en')} skills plan ${new Date().getFullYear()}`, fr: `Plan de compétences ${pick(cat.get('focusLabel', focus)?.label, 'fr')} ${new Date().getFullYear()}`, ar: `خطة كفاءات ${pick(cat.get('focusLabel', focus)?.label, 'ar')} ${new Date().getFullYear()}` } },
      { key: 'focus', value: focus }, { key: 'vertical_id', value: vertical }, { key: 'mode', value: mode },
      { key: 'track', value: mode === 'SME' ? score.recommendedTrack : null }, { key: 'complexity', value: values, score: score.score },
      { key: 'template_id', value: closest?.id || null, label: closest ? closest.name : null },
      { key: 'phases', value: phases.map(p => ({ no: p.no, name: p.name, e2e: p.e2e, gate: p.gate })) },
      { key: 'gates', value: gates.filter(g => phases.some(p => p.gate === g.id)).map(g => ({ id: g.id, name: g.name })) },
    ],
  };
}
