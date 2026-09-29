// "What to type" guidance for every user-facing task, in every language, filled with the project's own
// context (organization, sector, focus, themes). The same templates feed the User Guide.
import * as cat from '../catalog.js';
import { pick } from '../lib/util.js';

const LANGS = ['en', 'fr', 'ar'];
export function contextValues(ctx, lang) {
  const v = cat.get('verticalSeed', ctx.sector) || cat.list('verticalSeed')[0];
  const focus = ctx.focus === 'AI' ? 'ai' : 'digital';
  const themes = v?.themes?.[focus]?.length ? v.themes[focus] : cat.get('themePool', focus)?.items || [];
  const standard = v?.standards?.[0] || 'ISO 9001';
  return {
    org: pick(ctx.org, lang), sector: pick(v?.name, lang), core: pick(v?.coreFunction?.name, lang), standard,
    theme1: pick(themes[0], lang), theme2: pick(themes[1], lang), theme3: pick(themes[2], lang),
    focus: pick(cat.get('focusLabel', ctx.focus)?.label, lang) || ctx.focus, year: ctx.year || new Date().getFullYear(),
    size: ctx.segment === 'SME' ? pick(cat.get('focusLabel', 'SME')?.label, lang) : pick(cat.get('focusLabel', 'LARGE')?.label, lang),
  };
}
const fill = (tpl, vals) => String(tpl || '').replace(/\{(\w+)\}/g, (m, k) => (vals[k] ?? m));
export function guidanceFor(uftId, ctx) {
  const g = cat.get('guidance', uftId);
  const out = {};
  for (const l of LANGS) out[l] = fill(g ? pick(g.text, l) : pick(cat.get('uft', uftId)?.description, l), contextValues(ctx, l));
  return out;
}
