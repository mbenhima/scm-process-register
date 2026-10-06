// "What to type" guidance for every user-facing task, in every language, filled with the project's own
// context (organization, sector, focus, themes). The same templates feed the User Guide.
import * as cat from '../catalog.js';
import { pick } from '../lib/util.js';

const LANGS = ['en', 'fr', 'ar'];
const L = (en, fr, ar) => ({ en, fr, ar });
/** Sector-agnostic profile of the universal scenario organization (sector code UNI): no vertical-specific content. */
export const UNIVERSAL = { id: 'UNI', prefix: 'UNI', name: L('Multi-sector services', 'Services multisectoriels', 'خدمات متعددة القطاعات'), standards: ['ISO 9001', 'ISO 10015', 'ISO 21001'],
  coreFunction: { id: 'FN-CORE', name: L('Operations and service delivery', 'Opérations et prestation de services', 'العمليات وتقديم الخدمات') },
  themes: { digital: [L('Digital workplace and collaboration tools', 'Poste de travail numérique et outils collaboratifs', 'مكان العمل الرقمي وأدوات التعاون'), L('Data literacy and dashboards', 'Culture des données et tableaux de bord', 'الثقافة الرقمية للبيانات ولوحات القيادة'), L('Process digitalization and e-signature', 'Digitalisation des processus et signature électronique', 'رقمنة المسارات والتوقيع الإلكتروني')],
    ai: [L('Generative AI for everyday work', 'IA générative pour le travail quotidien', 'الذكاء الاصطناعي التوليدي للعمل اليومي'), L('AI-assisted customer service', 'Service client assisté par l’IA', 'خدمة العملاء بمساعدة الذكاء الاصطناعي'), L('Responsible AI and data protection', 'IA responsable et protection des données', 'الذكاء الاصطناعي المسؤول وحماية البيانات')] },
  large: { name: L('Horizon Services Group', 'Groupe Horizon Services', 'مجموعة هورايزون للخدمات'), city: 'Casablanca', employees: 1800 },
  driver: L('Workforce adoption of new digital and AI tools', 'Adoption des nouveaux outils numériques et IA par les équipes', 'تبني الفرق للأدوات الرقمية والذكاء الاصطناعي الجديدة'),
  risk: L('Investments in tools not matched by the skills to use them', 'Investissements dans des outils sans les compétences pour les utiliser', 'استثمارات في أدوات دون الكفاءات اللازمة لاستعمالها'), mps: [], e2e: [] };
export const sectorOf = id => (id === 'UNI' ? UNIVERSAL : cat.get('verticalSeed', id));
export function contextValues(ctx, lang) {
  const v = sectorOf(ctx.sector) || cat.list('verticalSeed')[0];
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
