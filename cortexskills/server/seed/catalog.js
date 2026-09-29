// Loads the reference catalog (process design, governance deliverables D01–D26, packs, verticals, SME)
// into the `catalog` table, every text in English, French and Arabic.
import { run } from '../src/db.js';
import { S } from '../src/lib/util.js';
import { readJson, tr, T, fillT } from './lib.js';

const cat = readJson('data', 'catalog.json');
const fw = readJson('content', 'framework.json');
const vx = readJson('content', 'verticals.json');
const guidance = { ...readJson('content', 'guidance_1.json'), ...readJson('content', 'guidance_2.json'), ...readJson('content', 'guidance_3.json') };
const help = readJson('content', 'help.json');
const split = s => String(s || '').split(/;\s*/).map(x => x.trim()).filter(Boolean);
const ids = s => String(s || '').match(/(E2E-\d\d|MP-\d\d|PK-\d\d|AD-\d\d|M\d\d)/g) || [];

export function buildCatalog() {
  const K = {}; const add = (kind, item) => (K[kind] ||= []).push(item);
  const stepType = { 'User Task': 'User Task', 'Service Task': 'Service Task', 'AI-Assisted Task': 'AI-Assisted Task' };

  // ---- Macro processes, tasks, steps (D01, D02, process design §4)
  for (const m of cat.macroProcesses) add('mp', { id: m.id, name: tr(m.name), objective: tr(m.objective), trigger: tr(m.trigger), terminal: tr(m.terminal), owner: tr(m.owner),
    module: m.module, category: tr(m.category), family: tr(m.family), familyKey: m.family, coveredBy: m.coveredBy,
    sipoc: m.sipoc ? Object.fromEntries(Object.entries(m.sipoc).map(([k, v]) => [k, tr(v)])) : null });
  for (const t of cat.tasks) add('task', { id: t.id, mp: t.mp, name: tr(t.name) });
  for (const s of cat.steps) add('step', { id: s.id, mp: s.mp, task: s.task, name: tr(s.name), description: tr(s.description), role: tr(s.role), type: stepType[s.type] || s.type });

  // ---- Layers of the chain diagram (process design §5.1)
  const layer = id => { const n = Number(id.slice(4)); return n >= 32 ? 'scope' : n >= 24 ? 'strategic' : [19, 20, 21].includes(n) ? 'consulting' : [15, 16, 17, 18].includes(n) ? 'enabler' : [9, 10, 11, 12, 14].includes(n) ? 'parallel' : 'core'; };
  const stepById = new Map(cat.steps.map(s => [s.id, s]));
  for (const e of cat.e2e) {
    add('e2e', { id: e.id, name: tr(e.name), type: tr(e.type), typeKey: e.type, goal: tr(e.goal), mps: e.mps, stepsCount: e.stepsCount, relType: tr(e.relType), relatedTo: tr(e.relatedTo),
      trigger: tr(e.trigger), terminal: tr(e.terminal), feedsInto: e.feedsInto, supportedBy: e.supportedBy, consumes: e.consumes, modules: tr(e.modules), moduleIds: ids(e.modules).filter(x => /^M\d/.test(x)),
      description: tr(e.description), ufts: e.ufts.map(u => u.id), layer: layer(e.id), family: layer(e.id), scope: 'core' });
    for (const u of e.ufts) add('uft', { id: u.id, e2e: e.id, order: u.order, name: tr(u.name), description: tr(u.description), goal: tr(u.goal), steps: u.steps,
      racsi: u.racsi, racsiT: Object.fromEntries(Object.entries(u.racsi).map(([k, v]) => [k, tr(v)])), input: tr(u.input), output: tr(u.output), supplier: tr(u.supplier), beneficiary: tr(u.beneficiary),
      stepId: u.stepId, seqTask: u.seqTask, mp: u.mp, bpmn: u.bpmn, ai: u.steps.some(s => stepById.get(s)?.type === 'AI-Assisted Task') });
  }
  for (const c of cat.composites) add('composite', { id: c.id, name: tr(c.name), orchestrates: c.orchestrates, mps: c.mps, steps: c.steps });
  cat.glossary.forEach((g, i) => add('glossary', { id: 'GL-' + String(i + 1).padStart(2, '0'), fr: g.fr, en: g.en }));

  // ---- Governance catalog D03–D15b
  const sev = { Validation: 'High', Routing: 'Medium', Calculation: 'Low', Escalation: 'High', Notification: 'Medium' };
  for (const r of cat.rules) add('rule', { id: r.Rule_ID, step: r.Triggering_Step_ID, condition: tr(r.Condition), action: r.Action_ID, type: r.Rule_Type, severity: sev[r.Rule_Type] || 'Medium', owner: stepById.get(r.Triggering_Step_ID)?.role || 'Quality Manager' });
  for (const a of cat.actions) add('action', { id: a.Action_ID, name: tr(a.Action_Name), type: a.Action_Type, target: a.Target_Object_Class, description: tr(a.Description) });
  const eff = ['Effective', 'Effective', 'Partially effective', 'Effective', 'Not tested'];
  cat.controls.forEach((c, i) => add('control', { id: c.Control_ID, name: tr(c.Control_Name), type: c.Type, steps: c['Linked_Step_ID(s)'], description: tr(c.Description), coso: c.COSO, effectiveness: eff[i % eff.length], frequency: ['Continuous', 'Monthly', 'Quarterly'][i % 3], owner: 'Quality Manager' }));
  for (const r of cat.risks) {
    const inh = Number(r.Inherent_Score) || 12, res = Number(r.Residual_Score) || 4;
    const L = Math.max(1, Math.min(5, Math.ceil(Math.sqrt(res)))), I = Math.max(1, Math.min(5, Math.round(res / L) || 1));
    add('risk', { id: r.Risk_ID, name: tr(r.Risk_Name), category: tr(r.Category), inherent: inh, residual: res, likelihood: L, impact: I, controls: r['Mitigating_Control_ID(s)'], kri: tr(r.KRI_Formula), owner: 'Quality Manager' });
  }
  for (const k of cat.kpis) add('kpi', { id: k.KPI_ID, name: tr(k.KPI_Name), type: k.Type, formula: tr(k.Formula), target: tr(k.Target), targetValue: parseTarget(k.Target), direction: /≤|<|lower/.test(k.Target) ? 'down' : 'up', mp: k.Linked_Macro_Process_ID });
  for (const a of cat.alerts) add('alertType', { id: a.Alert_ID, rule: a.Rule_Condition, severity: a.Severity, escalation: tr(a.Escalation_Path), step: a.Linked_Step_ID, name: tr(stepById.get(a.Linked_Step_ID)?.name) });
  for (const a of [['ALR-LIC-EXP', 'MP-51.4', 'High', 'Licence expiry within 30 days'], ['ALR-QUOTA', 'MP-51.6', 'Medium', 'Quota reached'], ['ALR-KPI', 'MP-10.3', 'Medium', 'KPI off target (Red)']])
    add('alertType', { id: a[0], rule: a[0] === 'ALR-LIC-EXP' ? 'RULE-074' : a[0] === 'ALR-QUOTA' ? 'RULE-069' : '-', severity: a[2], escalation: tr('Platform Administrator → Head of L&D'), step: a[1], name: tr(a[3]) });
  for (const r of cat.reports) add('report', { id: r.Report_ID, name: tr(r.Report_Name), audience: tr(r.Audience_Role), cadence: tr(r.Refresh_Cadence), fields: r.Key_Fields_Shown });
  for (const c of cat.classes) add('class', { id: c.Object_Class_ID, name: c.Class_Name, label: tr(human(c.Class_Name)), description: tr(c.Description), parent: c.Parent_Class, mps: split(c['Related_Macro_Process_ID(s)']) });
  for (const a of cat.attributes) add('attribute', { id: a.Attribute_ID, classId: a.Object_Class_ID, name: a.Attribute_Name, type: a.Data_Type, required: a.Required, rule: a.Validation_Rule });
  for (const u of cat.aiUseCases) add('aiUseCase', { id: u.AIUC_ID, name: tr(u.Use_Case_Name), step: u.Linked_Step_ID, model_task_type: u.Model_Task_Type, risk: u.Risk_Level, checkpoint: tr(u.Human_in_the_Loop_Checkpoint),
    scope: u.Activation_Scope, isCustom: u.Is_Custom === 'True', approval: u.Approval_Status, tier: u.Risk_Level === 'High' ? 'Augmented' : 'Assistive', version: 1 });
  for (const m of cat.roleMenus) add('roleMenu', { id: m.Role_ID + ':' + m.Menu_Item_ID, roleId: m.Role_ID, roleName: tr(m.Role_Name), order: Number(m.Menu_Order), section: tr(m.Menu_Section), itemId: m.Menu_Item_ID, item: tr(m.Menu_Item),
    type: m.Item_Type, screen: tr(m.Screen_Description), access: m.Access_Level, can: tr(m.What_The_Role_Can_Do), mps: m.Linked_Macro_Process_IDs, steps: m.Linked_Step_IDs, report: m.Linked_Report_ID, module: m.Required_Module_ID, visibility: m.Visibility_Condition });
  const roles = []; for (const m of cat.roleMenus) if (!roles.find(r => r.id === m.Role_ID)) roles.push({ id: m.Role_ID, name: tr(m.Role_Name) });
  roles.forEach(r => add('role', r));
  for (const m of cat.modules) add('module', { id: m.Module_ID, name: tr(m.Module_Name), tier: tr(m.Tier), licensing: tr(m.Licensing_Model), rateLimit: m.Rate_Limit,
    mps: split(m['Included_Macro_Process_ID(s)']), core: /Platform Core/.test(m.Tier), packs: ids(m.Tier).filter(x => x.startsWith('PK')), addons: ids(m.Tier).filter(x => x.startsWith('AD')) });

  // ---- Commercial catalog (packs, integrations, add-ons, bundles) and Solution Pack variants
  for (const p of cat.packs) add('packCatalog', { id: p.id, name: tr(p.name), segment: tr(p.segment), segmentDetail: tr(p.segmentDetail), priceDetail: tr(p.priceDetail), price: p.price, includedUsers: p.includedUsers,
    overage: p.overage, unit: p.unit, behavior: tr(p.behavior), pain: tr(p.pain), hope: tr(p.hope), modules: p.modules, mps: p.mpList });
  const q = (projects, obs, aiCustom) => ({ projects, obs, aiCustom, questionnaires: 100 });
  for (const p of cat.packs) add('solutionPack', { id: p.id, kind: 'pack', name: tr(p.name), packs: [p.id], price: p.price, includedUsers: p.includedUsers, overage: p.overage, unit: p.unit,
    aiTier: ['PK-03', 'PK-07', 'PK-08'].includes(p.id) ? 'Assistive+Augmented' : 'Assistive', quotas: q(p.id === 'PK-07' ? 50 : 25, 200, 5), priceRule: tr(p.priceDetail) });
  const bundlePacks = [['PK-01', 'PK-02'], ['PK-01', 'PK-02', 'PK-03'], ['PK-01', 'PK-02', 'PK-03', 'PK-04', 'PK-05'], ['PK-01', 'PK-02', 'PK-03', 'PK-04', 'PK-05', 'PK-06', 'PK-08'], ['PK-01', 'PK-02', 'PK-03', 'PK-04', 'PK-05', 'PK-06', 'PK-07', 'PK-08']];
  cat.bundles.forEach((b, i) => { add('bundle', { id: 'BND-0' + (i + 1), name: tr(b.name), packsText: b.packsText, discount: b.discount, list: b.list, price: b.price, packs: bundlePacks[i] });
    add('solutionPack', { id: 'BND-0' + (i + 1), kind: 'bundle', name: tr(b.name), packs: bundlePacks[i], price: b.price, listPrice: b.list, discount: b.discount, includedUsers: 500, overage: 0.45, unit: 'user',
      aiTier: i >= 1 ? 'Assistive+Augmented' : 'Assistive', quotas: q(i === 4 ? 200 : 100, 1000, 20), allModules: i === 4, priceRule: tr(`${b.discount}% off the sum of base prices (${b.list} USD)`) }); });
  for (const p of fw.smePacks) add('solutionPack', { id: p.id, kind: 'sme', name: T(p.name), packs: p.packs, price: p.price, includedUsers: p.includedUsers, overage: p.overage, unit: 'user', segment: p.segment,
    aiTier: p.id === 'SME-ESS' ? 'Assistive' : 'Assistive+Augmented', quotas: q(p.id === 'SME-ESS' ? 5 : 20, 60, p.id === 'SME-CMP' ? 10 : 3), allModules: !!p.allModules, includedAddons: p.addons || [],
    priceRule: tr(`Minimum ${p.includedUsers} users; ${p.overage} USD per extra user per month`) });
  for (const i of cat.integrations) add('integration', { id: i.id, name: tr(i.name), family: tr(i.family), goals: tr(i.goals), examples: i.examples, packs: i.packs, behavior: tr(i.behavior), pain: tr(i.pain), hope: tr(i.hope) });
  for (const a of cat.addOns) add('addOn', { id: a.id, name: tr(a.name), price: a.price, goals: tr(a.goals), packs: a.packs, behavior: tr(a.behavior), pain: tr(a.pain), hope: tr(a.hope) });
  cat.packagingRules.forEach((r, i) => add('packagingRule', { id: 'PR-0' + (i + 1), rule: tr(r.rule), description: tr(r.description) }));
  for (const c of fw.compliance) add('complianceStandard', { id: c.id, name: c.name, controls: c.controls.map(([code, name, type, coso]) => ({ code, name: tr(name), description: tr(name), type, coso })) });

  // ---- Framework: functions, focus labels, themes, phases, gates, checklists, SME, verticals
  for (const f of fw.functions) add('function', { id: f.id, name: T(f.name) });
  for (const [k, v] of Object.entries(fw.focusLabels)) add('focusLabel', { id: k, label: T(v) });
  for (const [k, v] of Object.entries(fw.themePool)) add('themePool', { id: k, items: v.map(T) });
  for (const p of fw.phases) add('phase', { id: 'PH-' + p.no, no: p.no, name: T(p.name), e2e: p.e2e, gate: p.gate });
  for (const g of fw.gates) add('gateSeed', { id: g.id, name: T(g.name), purpose: T(g.purpose), entry: T(g.entry), exit: T(g.exit), approvers: g.approvers, checklists: g.checklists });
  for (const c of fw.checklists) add('checklistSeedUniversal', { id: c.id, name: T(c.name), items: c.items.map(([t, mandatory, evidence]) => ({ text: T(t), mandatory, evidence })) });
  for (const t of fw.smeTracks) add('smeTrackSeed', { id: t.code, ...t, name: T(t.name), description: T(t.description) });

  const smeUft = (eid, idx) => `UFT-SME${eid.slice(-1)}-${String(idx + 1).padStart(2, '0')}`;
  for (const m of fw.smeMps) {
    add('smeMp', { id: m.id, name: T(m.name), objective: T(m.objective), owner: tr(m.owner), family: tr('SME track'), familyKey: 'SME' });
    let n = 0; m.tasks.forEach((t, ti) => { add('task', { id: `${m.id}.T${ti + 1}`, mp: m.id, name: T(t[0]) });
      for (const s of t.slice(1)) { n++; add('step', { id: `${m.id}.${n}`, mp: m.id, task: `${m.id}.T${ti + 1}`, name: T(s[0]), description: T(s[0]), role: tr(s[2]), type: s[1] }); } });
  }
  for (const e of fw.smeE2E) {
    const u = e.ufts.map((x, i) => ({ id: smeUft(e.id, i), e2e: e.id, order: i + 1, name: T(x[0]), description: T(x[1]), goal: T(x[0]), steps: x[2], racsi: { R: x[3], A: x[4], C: 'Consultant PM', S: 'L&D Analyst', I: 'Employees' },
      input: tr('Owner-manager input'), output: T(x[1]), supplier: tr(x[3]), beneficiary: tr('Owner-manager'), stepId: `S${e.id}-${i + 1}`, mp: x[2][0].split('.').slice(0, 1).join(), bpmn: i === 0 ? 'Start Event' : i === e.ufts.length - 1 ? 'End Event' : 'Task', ai: x[2].includes('SME-MP-01.4') }));
    u.forEach(x => { x.racsiT = Object.fromEntries(Object.entries(x.racsi).map(([k, v]) => [k, tr(v)])); add('uft', x); guidance[x.id] ||= null; });
    add('smeE2E', { id: e.id, phase: e.phase });
    add('e2e', { id: e.id, name: T(e.name), type: tr('SME track'), typeKey: 'SME', goal: T(e.goal), trigger: T(e.trigger), terminal: T(e.terminal), mps: e.mps, ufts: u.map(x => x.id), stepsCount: u.length,
      description: T(e.goal), feedsInto: '', supportedBy: 'E2E-15', consumes: '', modules: tr('M53 Scope of Work Studio; M18 Finance Console; M25 Microlearning Hub'), moduleIds: ['M53', 'M18', 'M25'], layer: 'sme', family: 'sme', scope: 'sme', relType: tr('Root'), relatedTo: tr('—') });
  }

  const parents = vx.parents; const checklists = [];
  for (const v of vx.verticals) {
    const vals = { sector: T(v.name), standard: v.standards[0], core: T(v.core), risk: T(v.risk) };
    const mps = fw.verticalMps.map(m => {
      const id = `${v.id}-${m.suffix}`; let n = 0;
      const out = { id, name: fillT(T(m.name), vals), objective: fillT(T(m.objective), vals), owner: tr(m.owner), family: tr('Vertical'), familyKey: 'Vertical', vertical: v.id, standards: v.standards };
      m.tasks.forEach((t, ti) => { add('task', { id: `${id}.T${ti + 1}`, mp: id, name: fillT(T(t[0]), vals) });
        for (const s of t.slice(1)) { n++; add('step', { id: `${id}.${n}`, mp: id, task: `${id}.T${ti + 1}`, name: fillT(T(s[0]), vals), description: fillT(T(s[0]), vals), role: tr(s[2]), type: s[1] }); } });
      return out;
    });
    const e2e = fw.verticalE2E.map((e, k) => {
      const id = `${v.id}-${e.suffix}`;
      const u = e.ufts.map((x, i) => ({ id: `UFT-${v.id}-E${k + 1}-${String(i + 1).padStart(2, '0')}`, e2e: id, order: i + 1, name: fillT(T(x[0]), vals), description: fillT(T(x[1]), vals), goal: fillT(T(x[0]), vals), steps: x[2],
        racsi: { R: x[3], A: x[4], C: 'Function Heads', S: 'Analyst', I: 'CHRO' }, input: tr('Sector obligations'), output: fillT(T(x[1]), vals), supplier: tr(x[3]), beneficiary: tr('CHRO'), stepId: `S${id}-${i + 1}`, mp: x[2][0].split('.')[0],
        bpmn: i === 0 ? 'Start Event' : i === e.ufts.length - 1 ? 'End Event' : 'Task', ai: k === 1 && i === 2, guidanceKey: `VE${k + 1}-${String(i + 1).padStart(2, '0')}` }));
      u.forEach(x => { x.racsiT = Object.fromEntries(Object.entries(x.racsi).map(([kk, vv]) => [kk, tr(vv)])); add('uft', x); guidance[x.id] = guidance[x.guidanceKey]; });
      add('e2e', { id, name: fillT(T(e.name), vals), type: tr('Vertical'), typeKey: 'Vertical', goal: fillT(T(e.goal), vals), trigger: fillT(T(e.trigger), vals), terminal: fillT(T(e.terminal), vals), mps: [...e.mps, mps[k].id], ufts: u.map(x => x.id), stepsCount: u.length,
        description: fillT(T(e.goal), vals), feedsInto: k === 1 ? 'E2E-03' : 'E2E-09', supportedBy: 'E2E-18', consumes: '', modules: tr('M14 Compliance Center; M02 Skills Hub; M05 Design Studio'), moduleIds: ['M14', 'M02', 'M05'], layer: 'vertical', family: 'vertical', scope: 'vertical', vertical: v.id, relType: tr('Root'), relatedTo: tr('—') });
      return { id, phase: e.phase };
    });
    const cl = fw.verticalChecklist;
    const chk = { id: `CL-${v.id}`, vertical: v.id, data: { name: fillT(T(cl.name), vals), scope: 'Vertical', vertical_id: v.id, status: 'Published', items: cl.items.map(([t, m, ev]) => ({ text: fillT(T(t), vals), mandatory: m, evidence: ev })) } };
    checklists.push(chk); add('checklistSeed', chk);
    add('verticalSeed', { id: v.id, prefix: v.id, name: T(v.name), parent: v.parent, parentName: T(parents[v.parent]), group: v.group, standards: v.standards, coreFunction: { id: 'FN-CORE', name: T(v.core) },
      themes: { digital: v.digital.map(T), ai: v.ai.map(T) }, large: { name: T(v.large[0]), city: v.large[1], employees: v.large[2] }, sme: { name: T(v.sme[0]), city: v.sme[1], employees: v.sme[2] },
      driver: T(v.driver), risk: T(v.risk), mps, e2e });
    for (const m of mps) add('verticalMp', m);
  }
  K.groupSeed = []; for (const [k, g] of Object.entries(vx.groups)) K.groupSeed.push({ id: k, name: T(g.name), description: T(g.description) });
  K.smeNetwork = [{ id: 'SME', verticals: vx.smeNetwork }];

  // ---- Guidance ("what to type"), help, FAQ, legends, decision matrix
  for (const [id, g] of Object.entries(guidance)) if (g) add('guidance', { id, text: T(g) });
  for (const h of help.help) add('help', { id: h.id, route: h.route, title: T(h.title), body: T(h.body), module: h.module });
  for (const f of help.faq) add('faq', { id: f.id, route: f.route, q: T(f.q), a: T(f.a), keywords: f.keywords || '' });
  for (const l of help.legends) add('legend', { id: l.id, title: T(l.title), items: l.items.map(i => ({ code: i.code, color: i.color, label: T(i.label) })) });
  add('decisionMatrix', { id: 'complexity', levels: fw.levels.map(T), criteria: fw.criteria.map(c => ({ code: c.code, name: T(c.name), weight: c.weight })) });
  return { K, fw, vx };
}
function parseTarget(t) { const m = String(t).match(/-?[\d.]+/); return m ? Number(m[0]) : null; }
function human(s) { return s.replace(/([a-z])([A-Z])/g, '$1 $2').replace('A I', 'AI').replace('Ai ', 'AI '); }

export function insertCatalog(K) {
  for (const [kind, items] of Object.entries(K)) items.forEach((it, i) => run(`INSERT OR REPLACE INTO catalog(kind,id,sort,data) VALUES(?,?,?,?)`, kind, it.id, i, S(it)));
}
