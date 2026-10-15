// "What to type" guidance for every user-facing task, in every language, filled with the project's own
// context (organization, sector, focus, themes). The same templates feed the User Guide.
import * as cat from '../catalog.js';
import { pick } from '../lib/util.js';
import { flowDef, PANEL_LABEL } from './flowdefs.js';

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
/**
 * Guidance of a task whose steps work on the project's records (diagnosis, plan, delivery, evaluation): what each step
 * is and how it is filled, written from the step forms themselves so that the guidance never contradicts them.
 */
const HOW = {
  record: (ai, tpl) => L(`a table: type or paste the rows${tpl ? ', or load them with “From the template”' : ''}${ai ? ', or ask “Propose rows with AI”' : ''}; check each row, then complete the step`, `un tableau : saisissez ou collez les lignes${tpl ? ', ou chargez-les avec « Depuis le modèle »' : ''}${ai ? ', ou demandez « Proposer des lignes avec l’IA »' : ''} ; vérifiez chaque ligne, puis terminez l’étape`, `جدول: أدخل الصفوف أو الصقها${tpl ? '، أو حمّلها من النموذج' : ''}${ai ? '، أو اطلب اقتراح الذكاء الاصطناعي' : ''}؛ تحقق ثم أنه الخطوة`),
  form: (ai, tpl) => L(`a form: type the values${tpl ? ', or pre-fill them “From the template”' : ''}${ai ? ' or with the AI proposal' : ''}, then complete the step`, `un formulaire : saisissez les valeurs${tpl ? ', ou pré-remplissez-les « Depuis le modèle »' : ''}${ai ? ' ou avec la proposition de l’IA' : ''}, puis terminez l’étape`, `استمارة: أدخل القيم ثم أنه الخطوة`),
  panel: label => L(`a live panel (${label.en}): use its buttons (send, remind, compute), check the result, then complete the step`, `un panneau de travail (${label.fr}) : utilisez ses boutons (envoyer, relancer, calculer), vérifiez le résultat, puis terminez l’étape`, `لوحة عمل (${label.ar}): استعمل أزرارها ثم أنه الخطوة`),
  doc: code => L(`a document to generate (${code}): click “Generate”, check the version, then complete the step`, `un document à générer (${code}) : cliquez « Générer », vérifiez la version, puis terminez l’étape`, `وثيقة (${code}): انقر «توليد» ثم أنه الخطوة`),
};
function flowGuidance(uftId) {
  const u = cat.get('uft', uftId); const steps = u?.steps || []; if (!steps.some(s => flowDef(uftId, s))) return null;
  const parts = steps.map(id => { const d = flowDef(uftId, id); const st = cat.get('step', id); const name = d?.name || st?.name || L(id, id, id);
    const how = !d ? L('done by the platform; check its result', 'réalisée par la plateforme ; vérifiez son résultat', 'تنجزها المنصة') : d.module === 'flow' ? HOW.panel(PANEL_LABEL[d.panel]) : d.module === 'document' ? HOW.doc(d.doc) : d.kind === 'record' ? HOW.record((d.fill || []).includes('ai'), (d.fill || []).includes('template')) : HOW.form((d.fill || []).includes('ai'), (d.fill || []).includes('template'));
    return { id, name, how }; });
  const out = {};
  for (const l of LANGS) out[l] = parts.map(p => (l === 'fr' ? `${p.id} « ${pick(p.name, l)} » : ${pick(p.how, l)}.` : `${p.id} “${pick(p.name, l)}”: ${pick(p.how, l)}.`)).join('\n') + '\n' + pick(L('The result of the task is drafted from the steps; edit it if needed before completing the task.', 'Le résultat de la tâche est rédigé à partir des étapes ; modifiez-le si besoin avant de terminer la tâche.', 'تحرر نتيجة المهمة انطلاقاً من الخطوات.'), l);
  return out;
}
export function guidanceFor(uftId, ctx) {
  const fg = flowGuidance(uftId); if (fg) return fg;
  const g = cat.get('guidance', uftId);
  const out = {};
  for (const l of LANGS) out[l] = fill(g ? pick(g.text, l) : pick(cat.get('uft', uftId)?.description, l), contextValues(ctx, l));
  return out;
}
