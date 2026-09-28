// Commercial gating — the single place where Solution Pack features and quotas are
// defined (NFR-DA-MAINT-03). Pack contents come from the Packs catalog and D26.
// Entitlement is enforced server-side, independently of RBAC.
import { catalog } from './catalog/store.js';

const L = (en, fr, ar) => ({ en, fr, ar });

export const FEATURES = {
  core: L('Core IMS workspace', 'Espace SMI de base', 'مساحة نظام الإدارة الأساسية'),
  governance: L('Governance (rules, controls, risks, RACSI)', 'Gouvernance (règles, contrôles, risques, RACSI)', 'الحوكمة (القواعد والضوابط والمخاطر وRACSI)'),
  bpmn_edit: L('Full BPMN editing', 'Édition BPMN complète', 'تحرير BPMN الكامل'),
  ai_assistive: L('Assistive AI', 'IA d\'assistance', 'الذكاء الاصطناعي المساعد'),
  ai_augmented: L('Augmented AI', 'IA augmentée', 'الذكاء الاصطناعي المعزز'),
  assistant: L('AI Assistant', 'Assistant IA', 'المساعد الذكي'),
  benchmark: L('Internal benchmarking', 'Benchmarking interne', 'المقارنة المرجعية الداخلية'),
  benchmark_group: L('Group benchmarking', 'Benchmarking de groupe', 'المقارنة المرجعية للمجموعة'),
  wbs: L('WBS and Gantt planning', 'OT et planning Gantt', 'هيكل تجزئة العمل ومخطط جانت'),
  integrations: L('External integrations', 'Intégrations externes', 'التكاملات الخارجية'),
  verticals: L('Vertical management', 'Gestion des secteurs', 'إدارة القطاعات'),
  certification: L('Certification & audit accelerator', 'Accélérateur de certification et d\'audit', 'مسرّع الاعتماد والتدقيق'),
  esg: L('ESG & sustainability', 'ESG et développement durable', 'الاستدامة والحوكمة البيئية والاجتماعية'),
  multi_site: L('Multi-site operations', 'Opérations multi-sites', 'العمليات متعددة المواقع'),
  mobile: L('Mobile field operations', 'Opérations terrain mobiles', 'العمليات الميدانية عبر الجوال'),
  voice: L('Voice-to-text reporting', 'Signalement vocal', 'الإبلاغ الصوتي'),
  ar_audit: L('Augmented reality audits', 'Audits en réalité augmentée', 'التدقيقات بالواقع المعزز'),
  esign: L('Digital signatures', 'Signatures numériques', 'التوقيعات الرقمية'),
  blockchain: L('Blockchain audit trail', 'Piste d\'audit blockchain', 'سجل تدقيق بسلسلة الكتل'),
  supplier_portal: L('Supplier collaboration portal', 'Portail fournisseurs', 'بوابة الموردين'),
  customer_portal: L('Customer feedback portal', 'Portail clients', 'بوابة العملاء'),
  lowcode: L('Low-code process builder', 'Concepteur low-code', 'منشئ العمليات منخفض الشيفرة'),
  marketplace: L('Marketplace access', 'Accès à la place de marché', 'الوصول إلى السوق'),
  twin: L('Digital twin simulation', 'Simulation par jumeau numérique', 'المحاكاة بالتوأم الرقمي'),
  voc: L('Voice of customer analytics', 'Analyse de la voix du client', 'تحليلات صوت العميل'),
  iot: L('IoT sensor integration', 'Intégration des capteurs IoT', 'تكامل أجهزة استشعار إنترنت الأشياء'),
};

// Base packs: feature list, AI tier and quota ceilings (FR-DA-CFG-02).
export const BASE_PACKS = {
  'DMS-SME': { features: ['core', 'governance', 'ai_assistive', 'assistant', 'benchmark', 'wbs'], aiTier: 'Assistive', quotas: { users: 25, projects: 10, obsNodes: 80, customAi: 2 } },
  'DMS-PRO': { features: ['core', 'governance', 'bpmn_edit', 'ai_assistive', 'assistant', 'benchmark', 'benchmark_group', 'wbs', 'integrations', 'verticals', 'multi_site'], aiTier: 'Assistive', quotas: { users: 100, projects: 60, obsNodes: 600, customAi: 10 } },
  'DMS-ENT': { features: ['core', 'governance', 'bpmn_edit', 'ai_assistive', 'ai_augmented', 'assistant', 'benchmark', 'benchmark_group', 'wbs', 'integrations', 'verticals', 'multi_site'], aiTier: 'Assistive+Augmented', quotas: { users: 500, projects: 500, obsNodes: 5000, customAi: 50 } },
};
export const CAPABILITY_FEATURES = { 'DMS-AI': ['ai_augmented', 'assistant'], 'DMS-CERT': ['certification'], 'DMS-ESG': ['esg'] };
export const ADDON_FEATURES = {
  'ADD-01': ['mobile'], 'ADD-02': ['voice'], 'ADD-03': ['ar_audit'], 'ADD-04': ['esign'], 'ADD-05': ['blockchain'],
  'ADD-06': ['supplier_portal'], 'ADD-07': ['customer_portal'], 'ADD-08': ['lowcode'], 'ADD-09': ['marketplace'],
  'ADD-10': ['twin'], 'ADD-11': ['voc'], 'ADD-12': ['iot'],
};

// Compliance & Security Standards — independent toggles, never a certification (FR-DA-CFG-04/09).
export const COMPLIANCE_STANDARDS = [
  { id: 'GDPR', name: L('GDPR', 'RGPD', 'اللائحة العامة لحماية البيانات'), price: 149, controls: [
    L('Records of processing activities maintained', 'Registre des traitements tenu à jour', 'مسك سجل أنشطة المعالجة'),
    L('Data subject requests answered within 30 days', 'Demandes des personnes traitées sous 30 jours', 'الرد على طلبات أصحاب البيانات خلال 30 يومًا'),
    L('Personal data breach notified within 72 hours', 'Violation notifiée sous 72 heures', 'الإبلاغ عن خرق البيانات خلال 72 ساعة')] },
  { id: 'ISO27001', name: L('ISO/IEC 27001', 'ISO/IEC 27001', 'ISO/IEC 27001'), price: 199, controls: [
    L('Information security policy approved', 'Politique de sécurité de l\'information approuvée', 'اعتماد سياسة أمن المعلومات'),
    L('Access rights reviewed quarterly', 'Droits d\'accès revus chaque trimestre', 'مراجعة صلاحيات الوصول ربع سنويًا'),
    L('Backups tested at least once per release', 'Sauvegardes testées à chaque version', 'اختبار النسخ الاحتياطية مرة لكل إصدار')] },
  { id: 'SOC2', name: L('SOC 2', 'SOC 2', 'SOC 2'), price: 199, controls: [
    L('Change management approvals recorded', 'Approbations de changement enregistrées', 'تسجيل موافقات إدارة التغيير'),
    L('Logical access monitored', 'Accès logiques surveillés', 'مراقبة الوصول المنطقي')] },
  { id: 'ISO9001', name: L('ISO 9001 scaffold', 'Socle ISO 9001', 'هيكل ISO 9001'), price: 99, controls: [
    L('Quality objectives reviewed at management review', 'Objectifs qualité revus en revue de direction', 'مراجعة أهداف الجودة في مراجعة الإدارة')] },
  { id: 'HIPAA', name: L('HIPAA', 'HIPAA', 'HIPAA'), price: 149, controls: [
    L('PHI access logged', 'Accès aux données de santé journalisés', 'تسجيل الوصول إلى المعلومات الصحية المحمية')] },
];

export const NON_CERT_DISCLOSURE = L(
  'Activating a Compliance & Security Standard seeds a starting scaffold of controls. It is not a certification, an external audit or a legal attestation of compliance.',
  'L\'activation d\'une norme de conformité et de sécurité crée un socle de contrôles de départ. Elle ne constitue ni une certification, ni un audit externe, ni une attestation juridique de conformité.',
  'يؤدي تفعيل معيار الامتثال والأمن إلى إنشاء هيكل ابتدائي من الضوابط، ولا يشكّل شهادة اعتماد ولا تدقيقًا خارجيًا ولا إقرارًا قانونيًا بالامتثال.');

export function orgConfig(org) {
  const parse = (v) => (Array.isArray(v) ? v : v ? JSON.parse(v) : []);
  const base = BASE_PACKS[org.pack] || BASE_PACKS['DMS-SME'];
  const industry = parse(org.industry_packs);
  const caps = parse(org.capability_packs);
  const addons = parse(org.addons);
  const standards = parse(org.compliance_standards);
  const features = new Set(base.features);
  for (const c of caps) (CAPABILITY_FEATURES[c] || []).forEach(f => features.add(f));
  for (const a of addons) (ADDON_FEATURES[a] || []).forEach(f => features.add(f));
  return {
    pack: org.pack, industryPacks: industry, capabilityPacks: caps, addons, complianceStandards: standards,
    features: [...features], aiTier: features.has('ai_augmented') ? 'Assistive+Augmented' : 'Assistive',
    quotas: base.quotas, deploymentMode: org.deployment_mode,
  };
}

export function hasFeature(org, feature) {
  return orgConfig(org).features.includes(feature);
}

// Macro processes licensed to an organization (D26 module contents).
export function entitledMps(org) {
  const cfg = orgConfig(org);
  const ids = new Set();
  const mods = catalog().modules;
  for (const id of [cfg.pack, ...cfg.industryPacks, ...cfg.capabilityPacks]) {
    const m = mods.find(x => x.id === id);
    if (m) m.mps.forEach(x => ids.add(x));
  }
  // SME + vertical bundle (FR-DA-PKG-01): the vertical's Tier 6 processes come with the bundle.
  if (org.size === 'SME' && org.sector && org.sector !== 'SME' && org.sector !== 'UNI') {
    for (const mp of catalog().macroProcesses) if (mp.tier === 6 && ['✓', 'S'].includes(mp.activation[org.sector])) ids.add(mp.id);
  }
  return ids;
}

// Pricing (Packs catalog Part 5/6): deployment multiplier, bundle discount, annual commitment.
export function computePrice(org, { annual = false } = {}) {
  const cat = catalog();
  const cfg = orgConfig(org);
  const mode = cfg.deploymentMode || 'DEP-1';
  const lines = [];
  const add = (id) => { const row = cat.priceMatrix[id] || cat.priceMatrix[Object.keys(cat.priceMatrix).find(k => k.startsWith(id + ' '))]; if (row) lines.push({ id, monthly: row[mode] }); };
  add(cfg.pack); cfg.industryPacks.forEach(add); cfg.capabilityPacks.forEach(add); cfg.addons.forEach(add);
  for (const s of cfg.complianceStandards) { const cs = COMPLIANCE_STANDARDS.find(x => x.id === s); if (cs) lines.push({ id: s, monthly: cs.price }); }
  const subtotal = lines.reduce((a, b) => a + (b.monthly || 0), 0);
  const nInd = cfg.industryPacks.length; const nCap = cfg.capabilityPacks.length;
  let bundle = 0;
  if (nInd >= 2 && nCap >= 2) bundle = 20; else if (nInd >= 1 && nCap >= 2) bundle = 15; else if (nInd >= 1 && nCap >= 1) bundle = 10; else if (nInd >= 1) bundle = 5;
  const afterBundle = subtotal * (1 - bundle / 100);
  const annualDisc = annual ? 15 : 0;
  const total = Math.round(afterBundle * (1 - annualDisc / 100));
  return { deploymentMode: mode, lines, subtotal, bundleDiscountPct: bundle, annualDiscountPct: annualDisc, totalMonthly: total };
}
