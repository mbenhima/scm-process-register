// Step-specific forms. The form kind gives the generic fields; some steps need their own
// column titles, choice lists and pickers so users type into qualified fields
// ("External issue" rather than "Item", a dropdown with Custom rather than free text,
// macro processes picked from the project). The step is matched on its English name, so the
// same rule applies to every macro process that has such a step.
import { FORM_KINDS } from './forms.js';

const L = (en, fr, ar) => ({ en, fr, ar });
const col = (key, type, label, extra = {}) => ({ key, type, label, ...extra });
const PRIORITY = ['High', 'Medium', 'Low'];
const relevance = col('priority', 'select', L('Relevance', 'Pertinence', 'الأهمية'), { options: PRIORITY });
const source = col('source', 'textarea', L('Source / evidence', 'Source / preuve', 'المصدر / الدليل'));

export const CHOICES = {
  external: [
    L('Political', 'Politique', 'سياسي'), L('Economic', 'Économique', 'اقتصادي'), L('Social', 'Social', 'اجتماعي'), L('Technological', 'Technologique', 'تقني'),
    L('Legal and regulatory', 'Légal et réglementaire', 'قانوني وتنظيمي'), L('Environmental', 'Environnemental', 'بيئي'), L('Market and customers', 'Marché et clients', 'السوق والعملاء'),
    L('Competition', 'Concurrence', 'المنافسة'), L('Supply', 'Approvisionnement', 'التوريد'), L('Climate change', 'Changement climatique', 'تغير المناخ'),
  ],
  internal: [
    L('Process', 'Processus', 'العملية'), L('Commercial', 'Commercial', 'تجاري'), L('Resources', 'Ressources', 'الموارد'), L('Competence', 'Compétences', 'الكفاءات'),
    L('Organizational knowledge', 'Connaissances organisationnelles', 'المعرفة التنظيمية'), L('Infrastructure', 'Infrastructure', 'البنية التحتية'), L('Information systems', 'Systèmes d\'information', 'نظم المعلومات'),
    L('Culture and values', 'Culture et valeurs', 'الثقافة والقيم'), L('Governance and structure', 'Gouvernance et structure', 'الحوكمة والهيكل'), L('Performance', 'Performance', 'الأداء'), L('Finance', 'Finances', 'المالية'),
  ],
  parties: [
    L('Customers', 'Clients', 'العملاء'), L('Employees and their representatives', 'Salariés et leurs représentants', 'الموظفون وممثلوهم'), L('Owner and shareholders', 'Dirigeant et actionnaires', 'المالك والمساهمون'),
    L('Suppliers and subcontractors', 'Fournisseurs et sous-traitants', 'الموردون والمقاولون من الباطن'), L('Authorities and regulators', 'Autorités et régulateurs', 'السلطات والجهات التنظيمية'),
    L('Certification body', 'Organisme de certification', 'جهة الاعتماد'), L('Banks and insurers', 'Banques et assureurs', 'البنوك وشركات التأمين'), L('Local community and neighbours', 'Collectivité locale et riverains', 'المجتمع المحلي والجيران'),
    L('Partners and distributors', 'Partenaires et distributeurs', 'الشركاء والموزعون'), L('Professional associations', 'Associations professionnelles', 'الجمعيات المهنية'), L('Competitors', 'Concurrents', 'المنافسون'),
  ],
  partyType: [L('Internal party', 'Partie interne', 'طرف داخلي'), L('External party', 'Partie externe', 'طرف خارجي')],
  interaction: [
    L('Output → input', 'Sortie → entrée', 'مخرج ← مدخل'), L('Information flow', 'Flux d\'information', 'تدفق المعلومات'), L('Resources provided', 'Ressources fournies', 'موارد مقدمة'),
    L('Control and feedback', 'Pilotage et retour', 'الضبط والتغذية الراجعة'), L('Support service', 'Service support', 'خدمة داعمة'), L('Shared record or tool', 'Enregistrement ou outil partagé', 'سجل أو أداة مشتركة'),
  ],
  needType: [
    L('Contractual requirement', 'Exigence contractuelle', 'متطلب تعاقدي'), L('Legal or regulatory requirement', 'Exigence légale ou réglementaire', 'متطلب قانوني أو تنظيمي'),
    L('Customer expectation', 'Attente client', 'توقع العميل'), L('Voluntary commitment', 'Engagement volontaire', 'التزام طوعي'), L('Internal expectation', 'Attente interne', 'توقع داخلي'),
  ],
  origin: ['Manual', 'Library', 'AI'],
};

// Rules: first match on the step name wins. `columns` replaces the columns of the first table.
const RULES = [
  { id: 'external', test: /\bexternal issues\b/i, label: L('External issues identified', 'Enjeux externes identifiés', 'القضايا الخارجية المحددة'), register: 'context', columns: [
    col('item', 'textarea', L('External issue', 'Enjeu externe', 'القضية الخارجية'), { required: true, wide: true }),
    col('category', 'combo', L('Category (PESTLE)', 'Catégorie (PESTEL)', 'الفئة (PESTLE)'), { options: CHOICES.external }),
    col('detail', 'textarea', L('Description and impact on the organization', 'Description et impact sur l\'organisme', 'الوصف والأثر على المؤسسة'), { wide: true }),
    relevance, source] },
  { id: 'internal', test: /\binternal issues\b/i, label: L('Internal issues identified', 'Enjeux internes identifiés', 'القضايا الداخلية المحددة'), register: 'context', columns: [
    col('item', 'textarea', L('Internal issue', 'Enjeu interne', 'القضية الداخلية'), { required: true, wide: true }),
    col('category', 'combo', L('Category', 'Catégorie', 'الفئة'), { options: CHOICES.internal }),
    col('detail', 'textarea', L('Description and impact on the organization', 'Description et impact sur l\'organisme', 'الوصف والأثر على المؤسسة'), { wide: true }),
    relevance, source] },
  { id: 'parties', test: /^identify (the )?(relevant )?interested parties|interested parties (register|identification)/i, label: L('Interested parties identified', 'Parties intéressées identifiées', 'الأطراف المعنية المحددة'), register: 'parties', columns: [
    col('item', 'combo', L('Interested party', 'Partie intéressée', 'الطرف المعني'), { required: true, options: CHOICES.parties }),
    col('category', 'combo', L('Internal / external', 'Interne / externe', 'داخلي / خارجي'), { options: CHOICES.partyType }),
    col('detail', 'textarea', L('Main needs and expectations (summary)', 'Principaux besoins et attentes (synthèse)', 'أهم الاحتياجات والتوقعات (ملخص)'), { wide: true }),
    col('influence', 'select', L('Influence (1–5)', 'Influence (1–5)', 'النفوذ (1–5)'), { options: ['1', '2', '3', '4', '5'] }),
    col('interest', 'select', L('Interest (1–5)', 'Intérêt (1–5)', 'الاهتمام (1–5)'), { options: ['1', '2', '3', '4', '5'] }),
    relevance, source] },
  { id: 'interactions', test: /interactions? (between|of|among) (the )?processes|process interactions/i, label: L('Interactions between macro processes', 'Interactions entre macro-processus', 'التفاعلات بين العمليات الكلية'), columns: [
    col('from', 'mp', L('Macro process 1 (provides)', 'Macro-processus 1 (fournit)', 'العملية الكلية 1 (تقدم)'), { required: true }),
    col('to', 'mp', L('Macro process 2 (receives)', 'Macro-processus 2 (reçoit)', 'العملية الكلية 2 (تستلم)'), { required: true }),
    col('category', 'combo', L('Interaction type', 'Type d\'interaction', 'نوع التفاعل'), { options: CHOICES.interaction }),
    col('detail', 'textarea', L('What flows between them', 'Ce qui transite entre eux', 'ما يتدفق بينهما'), { wide: true }),
    relevance, source] },
];

// Generic list steps: the column title names the object of the step ("Identify risks" ->
// "Risks") instead of "Item".
const VERBS = /^(identify|define|collect|list|select|capture|map|gather|determine|consult|aggregate|ingest|extract|detect|discover|record|register)\s+(or\s+\w+\s+)?/i;
function objectLabel(name) {
  const out = {};
  for (const l of ['en', 'fr', 'ar']) {
    const s = String(name?.[l] ?? name?.en ?? '');
    let o = l === 'en' ? s.replace(VERBS, '') : s.split(' ').slice(1).join(' ');
    o = o.replace(/^(the|les?|la|l'|des|du|de)\s+/i, '').trim();
    out[l] = o ? o.charAt(0).toUpperCase() + o.slice(1) : s;
  }
  return out;
}

export function stepRule(step) {
  const n = step?.sourceName?.en || step?.name?.en || '';
  const n2 = step?.name?.en || '';
  return RULES.find(r => r.test.test(n) || r.test.test(n2)) || null;
}

// The form definition of a step: its kind's fields, with the step-specific columns.
const withChoices = (def) => ({ ...def, fields: def.fields.map(f => (f.columns?.some(c => typeof c.options === 'string') ? { ...f, columns: f.columns.map(c => (typeof c.options === 'string' ? { ...c, options: CHOICES[c.options] || [] } : c)) } : f)) });
export function formFor(step, kind) {
  const base = withChoices(FORM_KINDS[kind || step?.formKind] || FORM_KINDS.execute);
  if (!step || (kind || step.formKind) !== 'list') return base;
  const rule = stepRule(step);
  const fields = base.fields.map((f, i) => {
    if (i !== 0 || f.type !== 'rows') return f;
    if (rule) return { ...f, label: rule.label, columns: rule.columns, register: rule.register || null, rule: rule.id };
    const obj = objectLabel(step.name);
    return { ...f, label: L(`${obj.en} identified`, `${obj.fr} — éléments identifiés`, `${obj.ar} — البنود المحددة`),
      columns: f.columns.map(c => (c.key === 'item' ? { ...c, label: obj, type: 'textarea', wide: true } : c.key === 'category' ? { ...c, type: 'combo', options: [] } : c.key === 'detail' || c.key === 'source' ? { ...c, type: 'textarea', wide: c.key === 'detail' } : c)) };
  });
  return { ...base, fields };
}
