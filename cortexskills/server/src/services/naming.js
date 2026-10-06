// Process element naming (FR-DA-NAM-01, -02): an explicit name that starts with an action verb followed by its object,
// unique within its parent, in every supported language. The check returns warnings the user may accept or correct.

const EN_VERBS = new Set(('accept acknowledge activate adapt add adjust agree aggregate align allocate analyze analyse appoint approve archive arrange assess assign attach audit author ' +
  'award balance benchmark book brief build calculate calibrate capture categorize certify change check choose classify clean close cluster coach collect communicate compare compile ' +
  'complete compute conduct configure confirm connect consolidate consult consume contact control convert coordinate copy correct create debrief decide declare define delete deliver ' +
  'deploy describe design detect determine develop diagnose disable display distribute document draft edit elaborate enable endorse enforce enrich enroll ensure enter escalate establish ' +
  'estimate evaluate examine execute export extract feed fill finalize fix flag follow forecast formalize generate give hold identify implement import improve index inform initiate ' +
  'inspect install integrate interview invite isolate issue launch link list load lock log maintain manage map match measure merge migrate model moderate monitor name negotiate ' +
  'notify obtain onboard open order organize pair peer perform pilot plan post predict prepare present prioritize process produce prompt propose provide provision publish purchase push ' +
  'qualify query rank rate reassess receive recommend reconcile record redynamize refresh register reject release remind remove renew report request require reschedule reserve reset ' +
  'resolve restore retire return review revise route run sample save schedule score screen seed select send sequence set share shortlist sign simulate size sort split staff start ' +
  'store structure submit suggest summarize supply support survey suspend synchronize tag tailor test track train transfer translate trigger tune unlock update upload validate verify ' +
  'visualize weigh write').split(/\s+/));
const GENERIC = { en: ['manage', 'handle', 'process', 'do', 'deal with', 'stuff', 'misc', 'miscellaneous', 'various', 'other', 'etc', 'thing', 'things', 'general', 'tbd', 'todo'],
  fr: ['gérer', 'traiter', 'faire', 'divers', 'autres', 'etc', 'chose', 'choses', 'général', 'à définir'], ar: ['إدارة', 'معالجة', 'متنوع', 'أخرى', 'إلخ', 'أشياء'] };
// Acronyms that are names in their own right (standards, systems, roles) are not abbreviations to expand.
const ACRONYMS = new Set(('ISO IEC IATF IFS BRC GMP BPF HACCP SOP KPI KPIS AI IA HR RH LMS HRIS SIRH ERP CRM RACSI SME PME TPE BPMN GDPR RGPD OKR ROI SLA CEO CHRO DRH DG L&D IT QA QHSE HSE EHS ' +
  'PMO TER PDF CSV API SSO MFA CMMS GMAO MES PLM CAD BIM NDT CND OHSAS AS9100 EN9100 TS FSSC GLP BPL CE UE EU USD MAD EUR TVA VAT PO RFP RFQ OEM MRO HVAC ATEX SIL LOTO SMED TPM 5S ' +
  'PDCA DMAIC SIPOC COSO RGAA WCAG UX UI RTL SMS VR AR XR CPF OFPPT ANAPEC CNSS AMO FIFO LIFO WMS TMS ABC FMEA AMDEC APQP PPAP SPC MSA 8D A3 CAPA NC IPC SMT ESD ICH GCP GDP PV CRO ' +
  'CDC SOW EPI PPE BTP AEC TIC ICT IOT IIOT OT BI ML LLM NLP OCR RPA SAP SCORM XAPI LRS MOOC SPOC LCMS CPD FAQ REX DR PK AD M').split(/\s+/));
const LOWER_ABBR = new Set(['mgmt', 'mgt', 'info', 'dept', 'approx', 'req', 'reqs', 'doc', 'docs', 'admin', 'config', 'spec', 'specs', 'qty', 'nb', 'no.', 'vs', 'w/', 'resp', 'mgr', 'org', 'eval', 'dev', 'prod', 'env', 'trng', 'tng']);

const norm = s => String(s || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');
const firstWord = s => String(s || '').trim().split(/[\s,;:]+/)[0] || '';

/** Verb check per language: English base-form verb list, French infinitive, Arabic verbal noun (masdar) heuristic. */
export function startsWithVerb(name, lang) {
  const w = firstWord(name); if (!w) return false;
  if (lang === 'en') return EN_VERBS.has(w.toLowerCase());
  if (lang === 'fr') return /(er|ir|re|oir|ire)$/i.test(w.normalize('NFD').replace(/[̀-ͯ]/g, '')) && w.length > 2;
  if (lang === 'ar') return /^[؀-ۿ]/.test(w) && w.length >= 3;
  return true;
}

/**
 * Checks the names of an element. `name` is {en, fr, ar}; `siblings` are the other names under the same parent.
 * Returns a list of warnings { code, lang, detail } — each one can be accepted or corrected (FR-DA-NAM-02).
 */
export function checkNames(name, { siblings = [], verb = true, langs = ['en', 'fr', 'ar'] } = {}) {
  const out = [];
  for (const l of langs) {
    const v = String(name?.[l] ?? '').trim();
    if (!v) { out.push({ code: 'missing', lang: l }); continue; }
    if (verb && !startsWithVerb(v, l)) out.push({ code: 'verb', lang: l, detail: firstWord(v) });
    const lower = ' ' + norm(v) + ' ';
    const g = (GENERIC[l] || []).find(x => lower.includes(' ' + norm(x) + ' ')); if (g) out.push({ code: 'generic', lang: l, detail: g });
    const tokens = v.split(/[\s,;:()/]+/).filter(Boolean);
    const abbr = tokens.find(t => (/^[A-Z][A-Z0-9&]{1,5}s?$/.test(t) && !ACRONYMS.has(t.replace(/s$/, '')) && !ACRONYMS.has(t)) || LOWER_ABBR.has(t.toLowerCase()) || /^[a-z]{2,5}\.$/.test(t));
    if (abbr) out.push({ code: 'abbreviation', lang: l, detail: abbr });
    if (v.split(/\s+/).length < 2) out.push({ code: 'short', lang: l });
    if (siblings.some(s => norm(s?.[l]) === norm(v))) out.push({ code: 'duplicate', lang: l, detail: v });
  }
  return out;
}

/** The object of a step name: the name without its leading verb (and French article), used to qualify field titles (FR-DA-DEU-01). */
export function objectOf(name, lang) {
  let v = String(name || '').trim(); if (!v) return '';
  const parts = v.split(/\s+/); parts.shift(); v = parts.join(' ');
  if (lang === 'fr') v = v.replace(/^(les |le |la |l['’]|des |du |de la |de l['’]|d['’]|un |une |à |aux |au )/i, '');
  if (lang === 'en') v = v.replace(/^(the |a |an |and |to )/i, '');
  return v.charAt(0).toUpperCase() + v.slice(1);
}
