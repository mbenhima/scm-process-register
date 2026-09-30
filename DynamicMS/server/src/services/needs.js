// Needs and expectations of interested parties: the library (needs typed before in the
// organization plus a reference list, not linked to any party) and the AI suggestion (the
// organization's language model when configured, the built-in engine otherwise).
import { all, P } from '../db.js';
import { complete, llmConfig } from './llm.js';

const L = (en, fr, ar) => ({ en, fr, ar });
// Reference library by kind of party (ISO 9001 / 14001 / 45001 §4.2 practice).
export const NEEDS_LIBRARY = [
  { kind: 'customer', need: L('Products and services that meet the agreed specification', 'Produits et services conformes à la spécification convenue', 'منتجات وخدمات مطابقة للمواصفات المتفق عليها') },
  { kind: 'customer', need: L('Delivery on the agreed date', 'Livraison à la date convenue', 'التسليم في الموعد المتفق عليه') },
  { kind: 'customer', need: L('Fast and fair handling of complaints', 'Traitement rapide et équitable des réclamations', 'معالجة سريعة وعادلة للشكاوى') },
  { kind: 'customer', need: L('Certified management system (ISO 9001) in tenders', 'Système de management certifié (ISO 9001) dans les appels d\'offres', 'نظام إدارة معتمد (ISO 9001) في المناقصات') },
  { kind: 'customer', need: L('Protection of their data and confidential information', 'Protection de leurs données et informations confidentielles', 'حماية بياناتهم ومعلوماتهم السرية') },
  { kind: 'staff', need: L('Safe and healthy working conditions', 'Conditions de travail sûres et saines', 'ظروف عمل آمنة وصحية') },
  { kind: 'staff', need: L('Training and clear work instructions', 'Formation et instructions de travail claires', 'تدريب وتعليمات عمل واضحة') },
  { kind: 'staff', need: L('Fair pay, recognition and career development', 'Rémunération juste, reconnaissance et évolution', 'أجر عادل وتقدير وتطور مهني') },
  { kind: 'staff', need: L('Consultation and participation in decisions that affect them', 'Consultation et participation aux décisions qui les concernent', 'الاستشارة والمشاركة في القرارات التي تخصهم') },
  { kind: 'owner', need: L('Profitable and sustainable growth', 'Croissance rentable et durable', 'نمو مربح ومستدام') },
  { kind: 'owner', need: L('Compliance and protection of the reputation', 'Conformité et protection de la réputation', 'الامتثال وحماية السمعة') },
  { kind: 'supplier', need: L('Clear specifications and forecast of needs', 'Spécifications claires et prévision des besoins', 'مواصفات واضحة وتوقع الاحتياجات') },
  { kind: 'supplier', need: L('Payment on time and a long-term relationship', 'Paiement à l\'échéance et relation durable', 'السداد في الموعد وعلاقة طويلة الأمد') },
  { kind: 'authority', need: L('Compliance with laws, permits and licences', 'Respect des lois, permis et autorisations', 'الامتثال للقوانين والتصاريح والتراخيص') },
  { kind: 'authority', need: L('Timely reporting and declarations', 'Déclarations et rapports dans les délais', 'التقارير والتصاريح في آجالها') },
  { kind: 'certification', need: L('Conforming management system and access to records and people', 'Système de management conforme et accès aux enregistrements et aux personnes', 'نظام إدارة مطابق وإتاحة الوصول إلى السجلات والأشخاص') },
  { kind: 'community', need: L('Limited nuisance (noise, traffic, waste) and local employment', 'Nuisances limitées (bruit, trafic, déchets) et emploi local', 'الحد من الإزعاج (الضجيج والمرور والنفايات) والتشغيل المحلي') },
  { kind: 'bank', need: L('Reliable financial reporting and risk control', 'Reporting financier fiable et maîtrise des risques', 'تقارير مالية موثوقة وضبط المخاطر') },
];
const KIND_OF = [
  [/customer|client|عميل|عملاء/i, 'customer'], [/employee|staff|salari|worker|personnel|موظف|عامل/i, 'staff'], [/owner|sharehold|dirigeant|actionnaire|مالك|مساهم/i, 'owner'],
  [/supplier|subcontract|fournisseur|sous-traitant|مورد/i, 'supplier'], [/authorit|regulat|inspection|municipal|autorit|سلطات|جهة تنظيمية/i, 'authority'],
  [/certification/i, 'certification'], [/communit|neighbo|riverain|collectivit|مجتمع|جيران/i, 'community'], [/bank|insur|banque|assur|بنك|تأمين/i, 'bank'],
];
const en = (t) => (t && typeof t === 'object' ? t.en ?? Object.values(t)[0] : String(t ?? ''));
export const kindOfParty = (name) => (KIND_OF.find(([rx]) => rx.test(en(name)) || (name && typeof name === 'object' && Object.values(name).some(x => rx.test(String(x))))) || [])[1] || null;

// Library: needs typed before in the organization (any project) + the reference list.
export function needsLibrary(orgId) {
  const seen = new Set(); const out = [];
  const add = (need, from) => { const k = en(need).trim().toLowerCase(); if (!k || seen.has(k)) return; seen.add(k); out.push({ need, from }); };
  for (const e of all("SELECT fields FROM step_exec WHERE org_id=? AND form_kind='needs'", orgId)) for (const r of P(e.fields)?.needs || []) add(r.need, 'organization');
  for (const x of NEEDS_LIBRARY) add(x.need, 'reference');
  return out;
}

// AI suggestion: one need per line "party | need | how addressed" from the language model,
// or the built-in engine (reference needs matched to each party).
export async function suggestNeeds(orgId, { parties, context, lang }) {
  const cfg = llmConfig(orgId);
  let llmError = null;
  if (cfg.enabled && cfg.provider !== 'builtin') {
    try {
      const names = parties.map(p => en(p.name ?? p));
      const r = await complete(orgId, {
        system: 'You are an ISO 9001 / 14001 / 45001 lead implementer. You list the needs and expectations of interested parties (clause 4.2) for a real organization. Answer with lines only, one need per line, in the format: party | need or expectation | how the organization addresses it. No numbering, no header.',
        user: `Organization and scope: ${context}\nInterested parties: ${names.join('; ')}\nGive 2 or 3 relevant needs per party, specific to this organization. Write in ${lang === 'fr' ? 'French' : lang === 'ar' ? 'Arabic' : 'English'}. Use the party names exactly as given.`,
      });
      if (r?.text) {
        const rows = r.text.split(/\r?\n/).map(l => l.split('|').map(x => x.trim())).filter(x => x.length >= 2 && x[1]).map(([party, need, response]) => {
          const p = parties.find(x => en(x.name ?? x).toLowerCase() === party.toLowerCase()) || parties.find(x => party.toLowerCase().includes(en(x.name ?? x).toLowerCase().slice(0, 8)));
          return { need: { [lang]: need }, parties: p ? [{ id: null, name: p.name ?? p }] : [], response: response ? { [lang]: response } : null, origin: 'AI', priority: 'Medium' };
        });
        if (rows.length) return { rows, engine: `${r.provider} · ${r.model}` };
        llmError = 'The language model answer could not be read.';
      }
    } catch (e) { llmError = e.message; }
  }
  const rows = [];
  for (const p of parties) {
    const k = kindOfParty(p.name ?? p);
    for (const x of NEEDS_LIBRARY.filter(n => n.kind === k).slice(0, 3)) rows.push({ need: x.need, parties: [{ id: null, name: p.name ?? p }], origin: 'AI', priority: k === 'customer' || k === 'authority' ? 'High' : 'Medium' });
  }
  return { rows, engine: 'rules+retrieval', llmError };
}
