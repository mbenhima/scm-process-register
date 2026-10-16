// AI Use Case catalog (FR-DA-AI-01, -13, -25; FR-DA-AIP-01, -07, -11): the stored entry with
// its derived fields, its links to the process design and the coverage of that design.
import { all, get, run, uid, now, J, P } from '../db.js';
import { catalog, loc } from '../catalog/store.js';
import { formFor } from '../catalog/stepforms.js';
import { PLACES } from '../catalog/aiplaces.js';
import { defaultSpec, specCompleteness, specOf } from './aiprompt.js';
import { snapshot, versions } from './audit.js';
import { orgConfig } from '../packs.js';

const L = (en, fr, ar) => ({ en, fr, ar });
export const LINK_TYPES = ['step', 'task', 'mp', 'e2e', 'module'];

/** Fields of the step form an AI Use Case reads and proposes (FR-DA-AIP-01). */
export function stepFields(stepId) {
  const step = catalog().stepById[stepId];
  const def = step ? formFor(step) : null;
  return def ? def.fields.map(f => ({ key: f.key, label: f.label, type: f.type })) : [];
}

/**
 * Module, trigger and expected output derived from the primary step when the author leaves
 * them empty; they are stored with the entry (FR-DA-AI-01).
 */
export function deriveFields(stepId, given = {}) {
  const c = catalog();
  const step = c.stepById[stepId];
  const mp = step ? c.mpById[step.mp] : null;
  const has = (v) => v && (typeof v === 'string' ? v.trim() : Object.values(v).some(x => String(x || '').trim()));
  const out = { module: given.module || mp?.module || null, trigger: has(given.trigger) ? given.trigger : null, expectedOutput: has(given.expectedOutput) ? given.expectedOutput : null };
  if (step && !out.trigger) out.trigger = { en: `The ${loc(step.roleName, 'en')} opens the step "${loc(step.name, 'en')}" (${step.id}) and asks for a proposal`, fr: `Le ${loc(step.roleName, 'fr')} ouvre l'étape « ${loc(step.name, 'fr')} » (${step.id}) et demande une proposition`, ar: `يفتح ${loc(step.roleName, 'ar')} الخطوة "${loc(step.name, 'ar')}" (${step.id}) ويطلب اقتراحًا` };
  if (step && !out.expectedOutput) {
    const def = formFor(step);
    const f = (l) => (def ? def.fields.map(x => loc(x.label, l)).join(', ') : loc(step.name, l));
    out.expectedOutput = { en: `Proposed content for the fields: ${f('en')}`, fr: `Contenu proposé pour les champs : ${f('fr')}`, ar: `محتوى مقترح للحقول: ${f('ar')}` };
  }
  return out;
}

/** Writes the links of a use case; exactly one primary link (the primary step when there is one). */
export function setLinks(orgId, ucId, links) {
  const c = catalog();
  const valid = (links || []).filter(l => LINK_TYPES.includes(l.type) && l.id && (
    (l.type === 'step' && c.stepById[l.id]) || (l.type === 'task' && c.tasks.some(t => t.id === l.id)) || (l.type === 'mp' && c.mpById[l.id]) || (l.type === 'e2e' && c.e2eById[l.id]) || (l.type === 'module' && PLACES[l.id])));
  const seen = new Set(); const list = [];
  for (const l of valid) { const k = `${l.type}:${l.id}`; if (!seen.has(k)) { seen.add(k); list.push(l); } }
  if (list.length && !list.some(l => l.primary)) list[0].primary = true;
  let primarySet = false;
  run('DELETE FROM ai_usecase_links WHERE usecase_id=?', ucId);
  for (const l of list) {
    const primary = !!l.primary && !primarySet; if (primary) primarySet = true;
    const fields = l.type === 'step' ? stepFields(l.id).map(f => f.key) : [];
    run('INSERT INTO ai_usecase_links(id,org_id,usecase_id,target_type,target_id,primary_,inputs,outputs,created_at) VALUES(?,?,?,?,?,?,?,?,?)', uid(), orgId, ucId, l.type, l.id, primary ? 1 : 0,
      J(Array.isArray(l.inputs) ? l.inputs : fields), J(Array.isArray(l.outputs) ? l.outputs : fields), now());
  }
  return list;
}

export function linksOf(ucId) {
  const c = catalog();
  return all('SELECT * FROM ai_usecase_links WHERE usecase_id=? ORDER BY primary_ DESC, target_type, target_id', ucId).map(l => ({
    id: l.id, type: l.target_type, targetId: l.target_id, primary: !!l.primary_, inputs: P(l.inputs) || [], outputs: P(l.outputs) || [],
    name: l.target_type === 'step' ? c.stepById[l.target_id]?.name : l.target_type === 'task' ? c.tasks.find(t => t.id === l.target_id)?.name : l.target_type === 'mp' ? c.mpById[l.target_id]?.name : l.target_type === 'e2e' ? c.e2eById[l.target_id]?.name : PLACES[l.target_id] || null,
  }));
}

/** Steps reached through the links of the use cases of an organization: stepId → [usecaseId]. */
export function servedSteps(orgId) {
  const c = catalog();
  const map = new Map();
  const add = (stepId, uc) => { if (!map.has(stepId)) map.set(stepId, new Set()); map.get(stepId).add(uc); };
  for (const l of all('SELECT usecase_id, target_type, target_id FROM ai_usecase_links WHERE org_id=?', orgId)) {
    if (l.target_type === 'step') add(l.target_id, l.usecase_id);
    else if (l.target_type === 'task') for (const s of c.steps.filter(s => s.task === l.target_id)) add(s.id, l.usecase_id);
    else if (l.target_type === 'mp') for (const s of c.stepsByMp[l.target_id] || []) add(s.id, l.usecase_id);
    else if (l.target_type === 'e2e') for (const m of c.macroProcesses.filter(m => m.e2e === l.target_id)) for (const s of c.stepsByMp[m.id] || []) add(s.id, l.usecase_id);
  }
  return map;
}

/** Inserts one entry of the seeded library, with its derived fields, links and complete specification. */
export function insertSeeded(orgId, a, created = now()) {
  const c = catalog();
  const id = uid();
  const d = a.place === 'module' ? { module: a.module, trigger: a.trigger, expectedOutput: a.output } : deriveFields(a.step, { trigger: a.trigger, expectedOutput: a.output, module: a.module });
  run('INSERT INTO ai_usecases(id,org_id,code,name,tier,module,trigger_,expected_output,checkpoint,prompt,task_type,risk_level,linked_step,linked_mp,custom,active,approval,version,created_at,scope,origin,spec_version) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,1,?,1,?,?,?,1)',
    id, orgId, a.id, J(a.name), a.tier, d.module || null, J(d.trigger || null), J(d.expectedOutput || null), J(a.checkpoint), J(a.prompt || null), J(a.taskType), a.risk, a.step || null, a.mp || null, a.approval, created, a.scope || 'Tenant', 'Seeded');
  setLinks(orgId, id, a.place === 'module' ? [{ type: 'module', id: a.module, primary: true }] : [{ type: 'step', id: a.step, primary: true, inputs: a.inputs, outputs: a.outputs }]);
  const u = get('SELECT * FROM ai_usecases WHERE id=?', id);
  run('UPDATE ai_usecases SET prompt_spec=? WHERE id=?', J(defaultSpec(u)), id);
  return id;
}

/** Seeds the library of an organization (new organization, demo seed, upgrade of an older database). */
export function seedLibrary(orgId, created = now()) {
  const have = new Set(all('SELECT code FROM ai_usecases WHERE org_id=?', orgId).map(x => x.code));
  const out = [];
  for (const a of catalog().aiUseCases) if (!have.has(a.id)) out.push({ id: insertSeeded(orgId, a, created), code: a.id, mp: a.mp });
  return out;
}

/** Effective state of a use case for a project: the project override, else the organization state. */
export function effectiveActive(u, projectId) {
  const ov = projectId ? get('SELECT state FROM ai_project_overrides WHERE usecase_id=? AND project_id=?', u.id, projectId)?.state : null;
  return ov === 'Active' || (ov !== 'Inactive' && !!u.active);
}

export function entitled(orgId, tier) {
  const o = get('SELECT * FROM organizations WHERE id=?', orgId);
  return tier !== 'Augmented' || String(orgConfig(o).aiTier || '').includes('Augmented');
}

/**
 * The active use cases serving a place (FR-DA-AI-23): a step (reached through step, task,
 * macro process or end-to-end links) or a module place. Primary links first.
 */
export function servingUseCases(orgId, projectId, target) {
  const c = catalog();
  let conds = [];
  if (target.step) {
    const s = c.stepById[target.step]; const m = s ? c.mpById[s.mp] : null;
    conds = [['step', target.step], s?.task && ['task', s.task], s && ['mp', s.mp], m && ['e2e', m.e2e]].filter(Boolean);
  } else if (target.module) conds = [['module', target.module]];
  if (!conds.length) return [];
  const rank = { step: 0, task: 1, mp: 2, e2e: 3, module: 0 };
  const found = new Map();
  for (const [type, id] of conds) {
    for (const l of all('SELECT l.primary_, u.* FROM ai_usecase_links l JOIN ai_usecases u ON u.id=l.usecase_id WHERE l.org_id=? AND l.target_type=? AND l.target_id=?', orgId, type, id)) {
      const score = rank[type] * 2 + (l.primary_ ? 0 : 1);
      if (!found.has(l.id) || found.get(l.id).score > score) found.set(l.id, { u: l, score });
    }
  }
  return [...found.values()].sort((a, b) => a.score - b.score || String(a.u.code).localeCompare(String(b.u.code))).map(x => x.u)
    .filter(u => effectiveActive(u, projectId) && entitled(orgId, u.tier));
}

export const specVersion = (ucId) => Math.max(1, versions('prompt_spec', ucId).length);

/** Library figures (FR-DA-AI-22). */
export function libraryFigures(orgId, projectId, items) {
  const o = get('SELECT * FROM organizations WHERE id=?', orgId);
  const cfg = orgConfig(o);
  const c = catalog();
  const served = servedSteps(orgId);
  const activeIds = new Set(items.filter(u => u.active).map(u => u.id));
  const tasksAi = new Set();
  for (const [stepId, ucs] of served) if ([...ucs].some(id => activeIds.has(id))) { const t = c.stepById[stepId]?.task; if (t) tasksAi.add(t); }
  const comp = items.map(u => specCompleteness(specOf(u), 'en'));
  const custom = items.filter(u => u.custom).length;
  return {
    byTier: { Assistive: items.filter(u => u.tier === 'Assistive').length, Augmented: items.filter(u => u.tier === 'Augmented').length },
    activeOrg: items.filter(u => u.active).length,
    activeProject: projectId ? items.filter(u => effectiveActive(u, projectId)).length : null,
    custom, customQuota: cfg.quotas.customAi, quotaReached: custom >= cfg.quotas.customAi,
    completeness: items.length ? Math.round(100 * comp.reduce((s, x) => s + x.filled / x.total, 0) / items.length) : 0,
    tasksSupported: tasksAi.size, tasksTotal: c.tasks.length,
  };
}

/** Coverage of the process design (FR-DA-AI-13): every task with the use cases that support it. */
export function coverage(orgId, projectId) {
  const c = catalog();
  const served = servedSteps(orgId);
  const ucs = Object.fromEntries(all('SELECT id, code, name, tier, active, custom FROM ai_usecases WHERE org_id=?', orgId).map(u => [u.id, u]));
  const byTask = new Map();
  for (const s of c.steps) {
    if (!s.task) continue;
    if (!byTask.has(s.task)) byTask.set(s.task, new Map());
    for (const id of served.get(s.id) || []) if (ucs[id]) byTask.get(s.task).set(id, ucs[id]);
  }
  return c.tasks.map(t => {
    const mp = c.mpById[t.mp];
    const list = [...(byTask.get(t.id)?.values() || [])].map(u => ({ id: u.id, code: u.code, name: P(u.name), tier: u.tier, active: projectId ? effectiveActive(u, projectId) : !!u.active }));
    const steps = (c.stepsByMp[t.mp] || []).filter(s => s.task === t.id);
    return { id: t.id, name: t.name, mp: t.mp, mpCode: mp?.code, mpName: mp?.name, e2e: mp?.e2e, steps: steps.map(s => ({ id: s.id, name: s.name, type: s.type })), usecases: list, covered: list.some(u => u.active) };
  });
}

/**
 * A use case suggested by rule for a task or step that has none (FR-DA-AIP-11, FR-DA-AI-25):
 * a deactivated Draft with a fully populated specification, for a person to review.
 */
export function suggestFor(req, orgId, { taskId, stepId }) {
  const c = catalog();
  const step = c.stepById[stepId] || (c.stepsByMp[c.tasks.find(t => t.id === taskId)?.mp] || []).filter(s => s.task === taskId).sort((a, b) => (a.type === 'AI-Assisted Task' ? -1 : 0) - (b.type === 'AI-Assisted Task' ? -1 : 0))[0];
  if (!step) return null;
  const n = get('SELECT COUNT(*) n FROM ai_usecases WHERE org_id=? AND custom=1', orgId).n;
  const id = uid();
  const name = { en: `Propose the content of "${loc(step.name, 'en')}"`, fr: `Proposer le contenu de « ${loc(step.name, 'fr')} »`, ar: `اقتراح محتوى "${loc(step.name, 'ar')}"` };
  const checkpoint = { en: `The ${loc(step.roleName, 'en')} accepts, edits or rejects each proposal before completing the step.`, fr: `Le ${loc(step.roleName, 'fr')} accepte, modifie ou rejette chaque proposition avant de terminer l'étape.`, ar: `يقبل ${loc(step.roleName, 'ar')} كل اقتراح أو يعدّله أو يرفضه قبل إكمال الخطوة.` };
  const d = deriveFields(step.id);
  run('INSERT INTO ai_usecases(id,org_id,code,name,tier,module,trigger_,expected_output,checkpoint,prompt,task_type,risk_level,linked_step,linked_mp,custom,active,approval,version,created_at,scope,origin,spec_version) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,0,?,1,?,?,?,1)',
    id, orgId, nextCustomCode(orgId, n), J(name), 'Assistive', d.module, J(d.trigger), J(d.expectedOutput), J(checkpoint), null, J(L('Text Generation', 'Génération de texte', 'توليد النصوص')), 'Low', step.id, step.mp, 'Draft', now(), 'Tenant', 'Suggested');
  setLinks(orgId, id, [{ type: 'step', id: step.id, primary: true }, ...(taskId ? [{ type: 'task', id: taskId }] : [])]);
  const u = get('SELECT * FROM ai_usecases WHERE id=?', id);
  const spec = defaultSpec(u);
  run('UPDATE ai_usecases SET prompt_spec=? WHERE id=?', J(spec), id);
  snapshot(req, orgId, 'prompt_spec', id, spec, L('Version 1 — suggested for the step', 'Version 1 — suggérée pour l\'étape', 'الإصدار 1 — مقترحة للخطوة'));
  return id;
}

export function nextCustomCode(orgId, n = null) {
  const codes = new Set(all('SELECT code FROM ai_usecases WHERE org_id=?', orgId).map(x => x.code));
  let k = (n ?? get('SELECT COUNT(*) n FROM ai_usecases WHERE org_id=? AND custom=1', orgId).n) + 1;
  while (codes.has(`AIUC-C${String(k).padStart(2, '0')}`)) k += 1;
  return `AIUC-C${String(k).padStart(2, '0')}`;
}
