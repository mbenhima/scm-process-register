// AI Use Case catalog helpers (SRS 4.4 FR-DA-AI-01, -12, -13; 4.40 FR-DA-AIP-01, -07, -11).
// A use case is linked to one primary step and, optionally, to more steps, tasks, macro processes or end-to-end
// processes (AIUseCaseLink). Its owning module, trigger and expected output are derived from the primary step when
// they were not written, and stored on the record, so every entry of the catalog is complete.
import { all, one, run } from '../db.js';
import { J, S, pick, now, uuid } from '../lib/util.js';
import * as D from './design.js';
import { describeStep } from './stepforms.js';

const L3 = (en, fr, ar) => ({ en, fr, ar });
export const LINK_TYPES = ['step', 'task', 'mp', 'e2e'];

/** Every process element a use case can be linked to, as compact pickers "ID — name". */
export function targets(orgId) {
  const compact = x => ({ id: x.id, name: x.name });
  return {
    step: D.list(orgId, 'step', { includeRetired: false }).map(s => ({ ...compact(s), mp: s.mp })),
    task: D.list(orgId, 'uft', { includeRetired: false }).map(u => ({ ...compact(u), e2e: u.e2e, steps: u.steps || [] })),
    mp: D.list(orgId, 'mp', { includeRetired: false }).map(m => ({ ...compact(m), module: m.module || null })),
    e2e: D.list(orgId, 'e2e', { includeRetired: false }).map(compact),
  };
}

/** The links of a use case, the primary step first, without duplicates or unknown types. */
export function linksOf(uc) {
  const out = []; const seen = new Set();
  const add = (type, id) => { if (!LINK_TYPES.includes(type) || !id) return; const k = type + ':' + id; if (seen.has(k)) return; seen.add(k); out.push({ type, id: String(id) }); };
  if (uc.step) add('step', uc.step);
  for (const l of Array.isArray(uc.links) ? uc.links : []) add(l?.type, l?.id);
  return out;
}

/** The steps a use case serves: linked steps, and the steps of linked tasks, macro processes and end-to-end processes. */
export function stepsOf(orgId, uc, cache = {}) {
  const ufts = cache.ufts ||= D.list(orgId, 'uft'); const steps = cache.steps ||= D.list(orgId, 'step');
  const out = new Set();
  for (const l of linksOf(uc)) {
    if (l.type === 'step') out.add(l.id);
    else if (l.type === 'task') for (const s of ufts.find(u => u.id === l.id)?.steps || []) out.add(s);
    else if (l.type === 'mp') for (const s of steps) if (s.mp === l.id) out.add(s.id);
    else if (l.type === 'e2e') for (const u of ufts) if (u.e2e === l.id) for (const s of u.steps || []) out.add(s);
  }
  return [...out];
}

/** Owning module, trigger and expected output, derived from the primary step (FR-DA-AI-01, FR-DA-AIP-07). */
export function derive(orgId, uc) {
  const step = uc.step ? D.get(orgId, 'step', uc.step) : null; if (!step) return {};
  const mp = D.get(orgId, 'mp', step.mp); const uft = D.list(orgId, 'uft').find(u => (u.steps || []).includes(step.id));
  const form = describeStep(step, { mpName: mp?.name, inputs: uft?.input });
  const sn = l => pick(step.name, l); const ob = l => pick(form.object, l); const flds = l => form.fields.map(f => pick(f.label, l)).join(', ');
  const rows = form.pattern !== 'form' && form.pattern !== 'sectioned';
  return {
    module: mp?.module || null,
    trigger: L3(`On the step ${step.id} “${sn('en')}”, when the user runs “Propose with AI”.`, `À l’étape ${step.id} « ${sn('fr')} », quand l’utilisateur lance « Proposer avec l’IA ».`, `في الخطوة ${step.id} «${sn('ar')}»، عندما يطلق المستخدم «اقتراح بالذكاء الاصطناعي».`),
    expected_output: L3(`Draft ${rows ? 'rows' : 'values'} of “${ob('en')}”: ${flds('en')}.`, `${rows ? 'Lignes' : 'Valeurs'} proposées de « ${ob('fr')} » : ${flds('fr')}.`, `${rows ? 'صفوف' : 'قيم'} مقترحة لـ«${ob('ar')}»: ${flds('ar')}.`),
  };
}

/** One input and output pair matching the step's form (FR-DA-AIP-03 Examples, FR-DA-AIP-07). */
export function exampleFor(orgId, uc) {
  const step = uc.step ? D.get(orgId, 'step', uc.step) : null; if (!step) return null;
  const form = describeStep(step, {}); if (!form.fields.length) return null;
  const sample = (f, l) => {
    if (f.type === 'select' && f.options?.length) return pick(f.options[0].label, l) || String(f.options[0].value);
    if (f.type === 'boolean') return { en: 'yes', fr: 'oui', ar: 'نعم' }[l];
    if (f.type === 'number') return String(f.min ?? 3);
    if (f.type === 'date') return '2026-11-15';
    if (f.type === 'person') return { en: 'Head of L&D', fr: 'Responsable formation', ar: 'مسؤول التكوين' }[l];
    if (f.type === 'function') return { en: 'Operations', fr: 'Opérations', ar: 'العمليات' }[l];
    return `${pick(form.object, l)} 1`;
  };
  const row = l => form.fields.slice(0, 6).map(f => `${pick(f.label, l)}${l === 'fr' ? ' : ' : ': '}${sample(f, l)}`).join(l === 'ar' ? '؛ ' : ' ; '.slice(l === 'fr' ? 0 : 1));
  return L3(`Input: project records naming “${pick(form.object, 'en')} 1”. Output: ${row('en')}.`, `Entrée : enregistrements du projet citant « ${pick(form.object, 'fr')} 1 ». Sortie : ${row('fr')}.`, `المدخل: سجلات المشروع التي تذكر «${pick(form.object, 'ar')} 1». المخرج: ${row('ar')}.`);
}

/**
 * Completes the catalog of an Organization in place (startup migration and provisioning): stored module, trigger,
 * expected output and links for every use case, and Examples in every Prompt Specification that has none. Each
 * change is versioned, so the history shows what was completed and when (FR-DA-AI-03, NFR-DA-COMP-03).
 */
export function completeCatalog(orgId) {
  let n = 0;
  for (const r of all(`SELECT id, data FROM records WHERE entity='AIUseCase' AND org_id=?`, orgId)) {
    const d = J(r.data, {}); const add = {}; const der = derive(orgId, d);
    for (const k of ['module', 'trigger', 'expected_output']) if ((d[k] == null || d[k] === '') && der[k]) add[k] = der[k];
    if (!Array.isArray(d.links)) add.links = linksOf(d).filter(l => !(l.type === 'step' && l.id === d.step));
    if (!d.code && (d.id || r.ref)) add.code = d.id || r.ref;
    if (Object.keys(add).length) { run(`UPDATE records SET data=? WHERE id=?`, S({ ...d, ...add }), r.id); n++; }
    const sp = one(`SELECT fields, field_versions, version FROM prompt_specs WHERE org_id=? AND use_case_id=?`, orgId, r.id);
    if (sp) {
      const f = J(sp.fields, {}); if (Object.values(f.examples || {}).some(v => String(v).trim())) continue;
      const ex = exampleFor(orgId, d); if (!ex) continue;
      const fv = J(sp.field_versions, {}); fv.examples = (fv.examples || 1) + 1; f.examples = ex;
      run(`UPDATE prompt_specs SET fields=?, field_versions=?, updated_at=? WHERE org_id=? AND use_case_id=?`, S(f), S(fv), now(), orgId, r.id);
      const key = `${orgId}|${r.id}|examples`; const v = (one(`SELECT MAX(version) v FROM entity_versions WHERE entity='PromptField' AND record_id=?`, key)?.v || 0) + 1;
      run(`UPDATE entity_versions SET is_current=0 WHERE entity='PromptField' AND record_id=?`, key);
      run(`INSERT INTO entity_versions(id,entity,record_id,org_id,version,data,user_id,justification,is_current,created_at) VALUES(?,?,?,?,?,?,?,?,1,?)`, uuid(), 'PromptField', key, orgId, v, S({ value: ex, note: 'Example matching the step form' }), null, 'Example matching the step form', now());
    }
  }
  return n;
}

/**
 * Coverage of the process design (FR-DA-AI-13): every task with its steps and the use cases that support them,
 * so tasks without AI support can be found and a use case suggested for them (FR-DA-AIP-11).
 */
export function coverage(orgId, useCases, effective) {
  const cache = {}; const byStep = new Map();
  for (const u of useCases) for (const s of stepsOf(orgId, u, cache)) { if (!byStep.has(s)) byStep.set(s, []); byStep.get(s).push(u); }
  const steps = new Map(cache.steps.map(s => [s.id, s]));
  const e2e = new Map(D.list(orgId, 'e2e').map(e => [e.id, e]));
  return cache.ufts.map(u => {
    const st = (u.steps || []).map(id => ({ id, name: steps.get(id)?.name || null, useCases: (byStep.get(id) || []).map(x => ({ id: x.id, code: x.code, name: x.name, tier: x.tier, active: effective(x.id) })) }));
    const ucs = [...new Map(st.flatMap(s => s.useCases).map(x => [x.id, x])).values()];
    return { id: u.id, name: u.name, e2e: u.e2e, e2eName: e2e.get(u.e2e)?.name || null, mp: u.mp || null, steps: st, useCases: ucs, covered: ucs.length > 0, tiers: [...new Set(ucs.map(x => x.tier))] };
  });
}
