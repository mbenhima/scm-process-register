// Builds the normalized, trilingual reference catalog from the extracted source
// documents (seed/catalog/catalog.en.json) and their translations (seed/catalog/i18n.json).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../config.js';
import { formKindOf } from './forms.js';
import { explicitStepName, explicitTaskName, stepDescriptions } from './naming.js';
import { MP_REORDER, MP_OBJECTS, MP_CLAUSES } from './objects.js';

const DIR = path.join(ROOT, 'seed', 'catalog');

export function loadSources() {
  const en = JSON.parse(fs.readFileSync(path.join(DIR, 'catalog.en.json'), 'utf8'));
  const dict = JSON.parse(fs.readFileSync(path.join(DIR, 'i18n.json'), 'utf8'));
  return { en, dict };
}

export function makeT(dict) {
  const T = (s) => {
    if (s === null || s === undefined) return null;
    s = String(s).trim();
    const d = dict[s];
    return { en: s, fr: d ? d.fr : s, ar: d ? d.ar : s };
  };
  const Tl = (arr) => (arr || []).map(T);
  const Troles = (s) => (s || '').split(/;|,|->/).map(x => x.trim()).filter(Boolean).map(T);
  return { T, Tl, Troles };
}

// i18n template helper: fills {0},{1}.. in each language with already-localized args.
export function tpl(t, ...args) {
  const out = {};
  for (const l of ['en', 'fr', 'ar']) {
    out[l] = t[l].replace(/\{(\d)\}/g, (_, i) => {
      const a = args[+i];
      if (a && typeof a === 'object' && a.en !== undefined) return a[l];
      if (Array.isArray(a)) return a.map(x => (x && x[l]) || x).join(l === 'ar' ? '، ' : ', ');
      return a ?? '';
    });
  }
  return out;
}

// --- Macro process code expansion: "UMS016–UMS047, GRC001–GRC010, DMS082–DMS101"
export function expandCodes(text, codes) {
  const out = new Set();
  if (!text) return [];
  const order = codes; // ordered list of codes by MP number
  const byPrefix = (p) => order.filter(c => c.startsWith(p));
  for (const part of text.split(/[,;/\n]/)) {
    const p = part.trim();
    const m = p.match(/([A-Z]{3})(\d{3})\s*[–-]\s*([A-Z]{3})?(\d{3})/);
    if (m) {
      const pre = m[1];
      const a = +m[2]; const b = +m[4];
      const pre2 = m[3] || pre;
      for (const c of order) {
        const cp = c.slice(0, 3); const n = +c.slice(3);
        if (pre === pre2 && cp === pre && n >= a && n <= b) out.add(c);
      }
      if (pre !== pre2) { // cross-prefix range: include by list order
        const i1 = order.indexOf(pre + m[2]); const i2 = order.indexOf(pre2 + m[4]);
        if (i1 >= 0 && i2 >= 0) order.slice(i1, i2 + 1).forEach(c => out.add(c));
      }
      continue;
    }
    for (const mm of p.matchAll(/\b([A-Z]{3}\d{3})\b/g)) if (order.includes(mm[1])) out.add(mm[1]);
  }
  return [...out];
}

// QMS vs QHSE scope of a macro process: H = health & safety, E = environment, S = social responsibility.
const SCOPE = {
  H: ['DMS052', 'DMS053', 'DMS054', 'DMS055', 'DMS056', 'DMS057', 'DMS059', 'DMS064', 'DMS070'],
  E: ['DMS006', 'DMS007', 'DMS045', 'DMS060', 'DMS065', 'DMS071', 'DMS078', 'DMS079', 'DMS080', 'DMS081'],
  S: ['DMS066', 'DMS067', 'DMS068'],
};
export function scopeOf(code) {
  for (const [k, list] of Object.entries(SCOPE)) if (list.includes(code)) return k;
  return 'Q';
}

export const ROLE_CODES = {
  'IMS Manager': 'ims_manager', 'Quality Manager': 'quality_manager', 'HSE Manager': 'hse_manager',
  'Risk Manager': 'risk_manager', 'Compliance Officer': 'compliance_officer', 'Internal Audit Manager': 'audit_manager',
  'HR Manager': 'hr_manager', 'Document Controller': 'document_controller', 'IT Manager': 'it_manager',
  'Operations Manager': 'operations_manager', 'Performance Manager': 'performance_manager', 'ESG Manager': 'esg_manager',
  'Transformation Manager': 'transformation_manager', 'Process Excellence Manager': 'process_excellence_manager',
  'Tenant Administrator': 'tenant_admin', 'Top Management': 'top_management', 'Employee': 'employee',
  'AI Governance Officer': 'ai_governance_officer',
};

// COSO component classification for the D04 controls (FR-DA-GOV-02)
const COSO = {
  'CTL-01': 'Control Activities', 'CTL-02': 'Control Activities', 'CTL-03': 'Information & Communication',
  'CTL-04': 'Monitoring Activities', 'CTL-05': 'Control Activities', 'CTL-06': 'Control Activities',
  'CTL-07': 'Control Environment', 'CTL-08': 'Information & Communication', 'CTL-09': 'Control Activities',
  'CTL-10': 'Control Activities', 'CTL-11': 'Control Activities', 'CTL-12': 'Monitoring Activities',
  'CTL-13': 'Control Activities', 'CTL-14': 'Monitoring Activities', 'CTL-15': 'Control Environment',
  'CTL-16': 'Control Activities', 'CTL-17': 'Monitoring Activities', 'CTL-18': 'Control Activities',
  'CTL-19': 'Control Activities', 'CTL-20': 'Control Activities', 'CTL-21': 'Control Activities',
  'CTL-22': 'Monitoring Activities', 'CTL-23': 'Control Environment', 'CTL-24': 'Risk Assessment',
  'CTL-25': 'Monitoring Activities', 'CTL-26': 'Control Environment', 'CTL-27': 'Control Activities',
  'CTL-28': 'Monitoring Activities',
};

export function buildCatalog() {
  const { en, dict } = loadSources();
  const { T, Tl, Troles } = makeT(dict);
  const X = (fr, ar, e) => ({ en: e, fr, ar });

  const mpsRaw = en.macroProcesses;
  const codes = mpsRaw.map(m => m.code);
  const codeToMp = Object.fromEntries(mpsRaw.map(m => [m.code, m.id]));
  const mpByCode = (c) => codeToMp[c];
  const segIds = en.segments.map(s => s.id);

  // ---- UF steps
  const uf = en.ufSteps.map(u => ({
    id: u.id, name: T(u.name), e2e: u.e2e.split('/').map(x => x.trim()),
    mpCodes: expandCodes(u.mpCodes, codes),
  }));
  const ufByCode = {};
  for (const u of uf) for (const c of u.mpCodes) (ufByCode[c] ||= []).push(u.id);

  // ---- Segments
  const segPack = Object.fromEntries(en.segmentPacks.map(s => [s.segment, s]));
  const cpack = Object.fromEntries(en.compliancePacks.map(p => [p.segment, p]));
  const segments = en.segments.map(s => ({
    id: s.id, num: s.num, name: T(s.name), mustStandards: s.mustStandards, tiers: s.tiers,
    compliancePack: s.pack, compliancePackName: T(cpack[s.id]?.name),
    basePack: segPack[s.id]?.base, industryPack: segPack[s.id]?.industry === '—' ? null : segPack[s.id]?.industry,
    recommendedAddons: segPack[s.id]?.addons || [],
    kpis: s.kpis.map(k => ({ code: k.code, name: T(k.name), target: k.target, frequency: T(k.frequency) })),
    risks: Tl(s.risks), audits: Tl(s.audits),
  }));

  // ---- Standards map
  const standards = en.standardsMap.map(s => ({
    code: s.standard, segments: s.segments,
    mps: expandCodes(s.mpText, codes).map(mpByCode),
  }));
  const stdByMp = {};
  for (const s of standards) for (const m of s.mps) (stdByMp[m] ||= []).push(s.code);

  // ---- Steps (D02) and tasks
  const steps = []; const tasks = [];
  const byMp = {};
  for (const s of en.steps) (byMp[s.Parent_Macro_Process_ID] ||= []).push(s);
  const mpRaw = Object.fromEntries(mpsRaw.map(m => [m.id, m]));
  const TPL_SEQ = X('Tâche séquentielle {0} sur {1} du SIPOC (P) de {2} : {3}.', 'المهمة المتسلسلة {0} من {1} في SIPOC (P) للعملية {2}: {3}.', 'Sequential task {0} of {1} in the {2} P.SIPOC: {3}.');
  const TPL_IN = X(' Entrées : {0}.', ' المدخلات: {0}.', ' Inputs: {0}.');
  const TPL_OUT = X(' Sorties : {0} ; clients : {1}.', ' المخرجات: {0}؛ العملاء: {1}.', ' Outputs: {0}; customers: {1}.');
  for (const [mpId, list] of Object.entries(byMp)) {
    const m = mpRaw[mpId];
    const taskNames = [];
    list.forEach((s, i) => {
      if (!taskNames.includes(s.Task_Name)) taskNames.push(s.Task_Name);
      const tIdx = taskNames.indexOf(s.Task_Name) + 1;
      const seq = i + 1;
      let desc;
      const mm = s.Description.match(/^Sequential task (\d+) of (\d+) in the (\w+) P\.SIPOC: (.*?)\.(?: Inputs: .*| Outputs: .*)?$/);
      if (mm) {
        desc = tpl(TPL_SEQ, mm[1], mm[2], mm[3], T(s.Step_Name));
        if (/Inputs:/.test(s.Description)) {
          const d2 = tpl(TPL_IN, Tl(m.sipoc.I));
          for (const l of ['en', 'fr', 'ar']) desc[l] += d2[l];
        }
        if (/Outputs:/.test(s.Description)) {
          const d3 = tpl(TPL_OUT, Tl(m.sipoc.O), Tl(m.sipoc.C));
          for (const l of ['en', 'fr', 'ar']) desc[l] += d3[l];
        }
      } else desc = T(s.Description);
      steps.push({
        id: s.Step_ID, mp: mpId, task: `${mpId}.T${tIdx}`, seq, name: explicitStepName(T(s.Step_Name), mpId), sourceName: T(s.Step_Name),
        type: s.Step_Type, typeName: T(s.Step_Type), role: s.Responsible_Role, roleName: T(s.Responsible_Role),
        roleCode: ROLE_CODES[s.Responsible_Role] || null, sourceDescription: desc,
        formKind: formKindOf(s.Step_Name, s.Step_Type), isNewRequirement: !mm,
      });
    });
    taskNames.forEach((tn, i) => tasks.push({ id: `${mpId}.T${i + 1}`, mp: mpId, seq: i + 1, name: explicitTaskName(T(tn), mpId), sourceName: T(tn) }));
  }
  // Order fixes (e.g. MP-002: standards selected before any policy drafting)
  for (const [mpId, order] of Object.entries(MP_REORDER)) {
    const own = steps.filter(x => x.mp === mpId);
    const start = steps.indexOf(own[0]);
    const re = order.map(([id, task, kind], i) => { const st = own.find(x => x.id === id); st.seq = i + 1; st.task = `${mpId}.${task}`; if (kind) st.formKind = kind; return st; });
    steps.splice(start, own.length, ...re);
    const used = new Set(re.map(x => x.task));
    for (let i = tasks.length - 1; i >= 0; i--) if (tasks[i].mp === mpId && !used.has(tasks[i].id)) tasks.splice(i, 1);
  }

  // ---- Macro processes
  const TPL_TRIG = X('Réception ou mise à jour de : {0} (fournisseurs : {1}).', 'استلام أو تحديث: {0} (من: {1}).', 'Receipt or update of {0} from {1}.');
  const TPL_TERM = X('{0} remis à : {1}.', 'تسليم {0} إلى: {1}.', '{0} delivered to {1}.');
  const tierNum = (t) => +(t.match(/Tier (\d)/) || [0, 0])[1];
  const actByCode = en.activation;
  const macroProcesses = mpsRaw.map(m => ({
    id: m.id, code: m.code, name: T(m.name), goal: T(m.goal), objective: T(m.objective),
    tier: tierNum(m.tier), tierName: T(m.tier), e2e: m.e2e, function: m.function,
    ownerRole: m.ownerRole, ownerRoleName: T(m.ownerRole), ownerRoleCode: ROLE_CODES[m.ownerRole],
    module: m.module, scope: scopeOf(m.code), sme: m.code >= 'DMS082' && m.code <= 'DMS101' && m.code.startsWith('DMS'),
    trigger: tpl(TPL_TRIG, Tl(m.sipoc.I.slice(0, 2)), Tl(m.sipoc.S.slice(0, 2))),
    terminal: tpl(TPL_TERM, Tl(m.sipoc.O.slice(0, 3)), Tl(m.sipoc.C.slice(0, 3))),
    sipoc: { S: Tl(m.sipoc.S), I: Tl(m.sipoc.I), P: Tl(m.sipoc.P), O: Tl(m.sipoc.O), C: Tl(m.sipoc.C) },
    uf: ufByCode[m.code] || [], standards: stdByMp[m.id] || [],
    activation: actByCode[m.code] || {},
    stepCount: (byMp[m.id] || []).length,
    object: MP_OBJECTS[m.id] ? { en: MP_OBJECTS[m.id][0], fr: MP_OBJECTS[m.id][1], ar: MP_OBJECTS[m.id][2] } : null, clauses: MP_CLAUSES[m.id] || null,
  }));
  const mpIndex = Object.fromEntries(macroProcesses.map(m => [m.id, m]));
  for (const st of steps) {
    const d = stepDescriptions(st, mpIndex[st.mp], mpIndex[st.mp].stepCount, st.formKind);
    st.brief = d.brief; st.description = d.detail;
  }

  // ---- E2E
  const e2eWb = Object.fromEntries(en.e2eWorkbook.map(e => [e.E2E_ID, e]));
  const expandMpIds = (s) => {
    const out = [];
    for (const part of s.split(';')) {
      const p = part.trim();
      const r = p.match(/MP-(\d{3}) to MP-(\d{3})/);
      if (r) { for (let i = +r[1]; i <= +r[2]; i++) out.push('MP-' + String(i).padStart(3, '0')); }
      else if (/^MP-\d{3}$/.test(p)) out.push(p);
    }
    return out;
  };
  const e2e = en.e2e.map(e => ({
    id: e.id, type: e.type, typeName: T(e.type), name: T(e.name), goals: T(e.goals), trigger: T(e.trigger),
    terminal: T(e.terminal), description: T(e.description), narrative: T(e.narrative), businessValue: T(e.businessValue),
    modules: Tl((e.modules || '').split(',').map(x => x.trim()).filter(Boolean)), relations: e.relations,
    ufCount: e.ufCount, ownerRole: e2eWb[e.id]?.Owner_Role, ownerRoleName: T(e2eWb[e.id]?.Owner_Role),
    functions: (e2eWb[e.id]?.Function_IDs || '').split(';').map(x => x.trim()).filter(Boolean),
    mpIds: expandMpIds(e2eWb[e.id]?.Macro_Process_IDs || ''),
    ufTasks: e.ufTasks,
    racsi: (e.racsi || []).map(r => ({ activity: T(r.activity), R: Troles(r.R), A: Troles(r.A), C: Troles(r.C), S: Troles(r.S), I: Troles(r.I) })),
    flow: (e.flow || []).map(f => ({
      ufId: f.ufId, ufName: T(f.ufName), goals: T(f.goals), inputSuppliers: Troles(f.inputSuppliers), inputs: Troles(f.inputs),
      seqTaskIds: f.seqTaskIds, seqTaskName: T(f.seqTaskName), stepId: f.stepId, stepName: T(f.stepName),
      outputs: Troles(f.outputs), outputCustomers: Troles(f.outputCustomers), mpNote: f.mpNote, bpmn: f.bpmn,
    })),
  }));
  const composites = [
    { id: 'E2E-C01', name: X('De l\'idée à la valeur', 'من الفكرة إلى القيمة', 'Idea To Value'), members: ['E2E-12', 'E2E-01', 'E2E-07'] },
    { id: 'E2E-C02', name: X('Du risque à la résilience (étendu)', 'من المخاطر إلى المرونة (موسّع)', 'Risk To Resilience Extended'), members: ['E2E-03', 'E2E-11', 'E2E-12'] },
    { id: 'E2E-C03', name: X('Des données à l\'intelligence', 'من البيانات إلى الذكاء', 'Data To Intelligence'), members: ['E2E-07', 'E2E-11'] },
  ];
  const chains = en.chains.map(c => ({ from: c.from, type: c.type, typeName: T(c.type), to: c.to, steps: c.steps }));
  const relationTypes = en.relationTypes.map(r => ({ type: r.type, name: T(r.type), definition: T(r.definition) }));

  const functions = en.functions.map(f => ({
    id: f.Function_ID, name: T(f.Function_Name), description: T(f.Description), head: f.Function_Head_Role,
    headName: T(f.Function_Head_Role), mpCount: f.Macro_Process_Count, e2e: f.Related_E2E_IDs.split(';').map(x => x.trim()),
  }));
  const processLevels = en.processLevels.map(l => ({ id: l.Level_Def_ID, level: l.Level_Number, defaultName: T(l.Default_Name), name: T(l.Tenant_Level_Name), source: l.Naming_Source, canBeTask: l.Can_Be_Lowest_Level_Task, rule: T(l.Rule) }));

  // ---- Governance catalogs
  const actionsById = Object.fromEntries(en.actions.map(a => [a.Action_ID, a]));
  const rules = en.businessRules.map(r => ({
    id: r.Rule_ID, step: r.Triggering_Step_ID, mp: r.Triggering_Step_ID.split('.')[0], condition: T(r.Condition),
    actionId: r.Action_ID, action: T(actionsById[r.Action_ID]?.Action_Name), actionDescription: T(actionsById[r.Action_ID]?.Description),
    type: r.Rule_Type, typeName: T(r.Rule_Type),
  }));
  const actions = en.actions.map(a => ({ id: a.Action_ID, name: T(a.Action_Name), type: a.Action_Type, typeName: T(a.Action_Type), target: a.Target_Object_Class, description: T(a.Description) }));
  const controls = en.controls.map(c => ({ id: c.Control_ID, name: T(c.Control_Name), type: c.Type, typeName: T(c.Type), steps: c.Linked_Step_IDs.split(';').map(x => x.trim()), description: T(c.Description), coso: COSO[c.Control_ID] }));
  const risks = en.risks.map(r => ({ id: r.Risk_ID, name: T(r.Risk_Name), category: r.Category, categoryName: T(r.Category), inherent: +r.Inherent_Score, residual: +r.Residual_Score, controls: r.Mitigating_Control_IDs.split(';').map(x => x.trim()), kri: T(r.KRI_Formula), formulaId: r.Formula_ID }));
  const kpis = en.kpis.map(k => ({ id: k.KPI_ID, name: T(k.KPI_Name), type: k.Type, typeName: T(k.Type), formula: T(k.Formula), formulaId: k.Formula_ID, target: k.Target, targetName: T(k.Target), mp: k.Linked_Macro_Process_ID }));
  const rulesById = Object.fromEntries(rules.map(r => [r.id, r]));
  const alerts = en.alerts.map(a => ({ id: a.Alert_ID, rule: a.Rule_Condition, condition: rulesById[a.Rule_Condition]?.condition, severity: a.Severity, severityName: T(a.Severity), escalation: Troles(a.Escalation_Path), step: a.Linked_Step_ID }));
  const reports = en.reports.map(r => ({ id: r.Report_ID, name: T(r.Report_Name), audience: Troles(r.Audience_Role), cadence: T(r.Refresh_Cadence), fields: r.Key_Fields_Shown.split(';').map(x => x.trim()) }));
  const docTemplates = en.docTemplates.map(t => ({
    id: t.Template_ID, type: T(t.Document_Type), source: t.Source_Deliverable_ID, objectClass: t.Source_Object_Class_ID, report: t.Linked_Report_ID,
    formats: Tl(t.Output_Formats.split(';').map(x => x.trim())), defaultFormat: t.Default_Format,
    customizable: Tl(t.Customizable_Elements.split(';').map(x => x.trim())), sections: Tl(t.Mandatory_Sections.split(';').map(x => x.trim())),
    versioning: T(t.Versioning_Scheme), lifecycle: Tl(t.Lifecycle_States.split('>').map(x => x.trim())), approval: t.Approval_Required, watermark: T(t.Watermark_Rule),
  }));
  const policies = en.policies.map(p => ({ id: p.Policy_ID, title: T(p.Title), standards: p.Standard_Reference_IDs, scopeType: T(p.Scope_Type), scope: T(p.Policy_Scope), commitments: T(p.Commitments), owner: T(p.Owner), approver: T(p.Approver), channels: Tl(p.Communication_Channels.split(';').map(x => x.trim())), reviewFrequency: p.Review_Frequency, version: p.Current_Version, status: T(p.Lifecycle_Status), effective: p.Effective_Date, nextReview: p.Next_Review_Date, template: p.Template_ID }));
  const docVersions = en.docVersions.map(v => ({ id: v.Version_Record_ID, object: v.Governed_Object_ID, template: v.Template_ID, version: v.Version_No, changeType: T(v.Change_Type), summary: T(v.Change_Summary), status: T(v.Lifecycle_Status), author: T(v.Author_Role), approver: T(v.Approver_Role), approvedAt: v.Approval_Date, formats: v.Generated_Formats, supersedes: v.Supersedes_Version_Record_ID }));
  const classes = en.classes.map(c => ({ id: c.Object_Class_ID, name: c.Class_Name, description: T(c.Description), parent: c.Parent_Class, mps: c.Related_Macro_Process_IDs }));
  const dataDictionary = en.dataDictionary.map(d => ({ id: d.Attribute_ID, classId: d.Object_Class_ID, name: d.Attribute_Name, type: d.Data_Type, required: d.Required, rule: d.Validation_Rule }));
  const valueLists = en.valueLists.map(v => ({ id: v.Value_ID, list: v.List_ID, listName: T(v.List_Name), label: T(v.Value_Label), custom: v.Is_Custom === 'Yes', active: v.Is_Active === 'Yes', order: v.Sort_Order }));
  const aiUseCases = en.aiUseCases.map(a => ({
    id: a.AIUC_ID, name: T(a.Use_Case_Name), step: a.Linked_Step_ID, mp: a.Linked_Step_ID.split('.')[0], taskType: T(a.Model_Task_Type),
    risk: a.Risk_Level, riskName: T(a.Risk_Level), checkpoint: T(a.Human_in_the_Loop_Checkpoint), scope: a.Activation_Scope,
    custom: a.Is_Custom === 'True', basedOn: a.Based_On_AI_Use_Case_ID, approval: a.Approval_Status,
    tier: ['Prediction', 'Classification', 'Recommendation'].includes(a.Model_Task_Type) ? 'Augmented' : 'Assistive',
  }));
  // Every AI-assisted step gets its own use case, and every use case a prompt template
  // written from its step (the step's goal, inputs, outputs, standards and role).
  const ucSteps = new Set(aiUseCases.map(a => a.step));
  let sn = 0;
  for (const st of steps.filter(x => x.type === 'AI-Assisted Task' && !ucSteps.has(x.id))) {
    sn += 1;
    aiUseCases.push({ id: `AIUC-S${String(sn).padStart(2, '0')}`, name: tpl(X('Assistance IA : {0}', 'مساعدة الذكاء الاصطناعي: {0}', 'AI assistance: {0}'), st.name), step: st.id, mp: st.mp,
      taskType: T('Text Generation'), risk: 'Low', riskName: T('Low'), checkpoint: tpl(X('Le rôle {0} accepte, modifie ou rejette la suggestion avant de terminer l\'étape.', 'يقبل {0} الاقتراح أو يعدّله أو يرفضه قبل إكمال الخطوة.', '{0} accepts, edits or rejects the suggestion before completing the step.'), st.roleName),
      scope: 'Tenant', custom: false, approval: 'Approved', tier: 'Assistive', generated: true });
  }
  const PROMPT = X(
    'Vous assistez le rôle {0} sur l\'étape « {1} » ({2}) du macro-processus {3}, phase {4}. Objet de l\'étape : {5} Utilisez les entrées : {6}. Produisez : {7}. Références : {8}. Répondez par des propositions numérotées, précises et propres à l\'organisme, que l\'utilisateur peut accepter, modifier ou rejeter. N\'inventez aucune donnée absente du contexte.',
    'أنت تساعد {0} في الخطوة "{1}" ({2}) من العملية الكلية {3}، المرحلة {4}. غاية الخطوة: {5} استخدم المدخلات: {6}. أنتج: {7}. المراجع: {8}. أجب بمقترحات مرقمة ومحددة وخاصة بالمؤسسة يمكن للمستخدم قبولها أو تعديلها أو رفضها. لا تختلق بيانات غير موجودة في السياق.',
    'You assist the {0} on the step "{1}" ({2}) of the macro process {3}, phase {4}. Purpose of the step: {5} Use these inputs: {6}. Produce: {7}. References: {8}. Answer with numbered, specific proposals for this organization that the user can accept, edit or reject. Do not invent data that is not in the context.');
  for (const a of aiUseCases) {
    const st = steps.find(x => x.id === a.step);
    const m = mpsRaw.find(x => x.id === a.mp);
    if (!st || !m) continue;
    const mpName = T(m.name);
    a.stepName = st.name;
    a.prompt = tpl(PROMPT, st.roleName, st.name, st.id, { en: `${m.code} ${mpName.en}`, fr: `${m.code} ${mpName.fr}`, ar: `${m.code} ${mpName.ar}` }, m.e2e, T(m.goal), Tl(m.sipoc.I.slice(0, 4)), a.name, MP_CLAUSES[m.id] || 'ISO 9001');
  }
  const roleMenus = en.roleMenus.map(r => ({
    role: r.Role_ID, roleName: T(r.Role_Name), roleCode: ROLE_CODES[r.Role_Name], order: r.Menu_Order, section: T(r.Menu_Section),
    itemId: r.Menu_Item_ID, item: T(r.Menu_Item), type: r.Item_Type, access: r.Access_Level, accessName: T(r.Access_Level),
    canDo: T(r.What_The_Role_Can_Do), mps: r.Linked_Macro_Process_IDs, steps: r.Linked_Step_IDs, report: r.Linked_Report_ID,
    module: r.Required_Module_ID, visibility: T(r.Visibility_Condition),
  }));
  const expandMp = (s) => {
    const out = [];
    for (const part of (s || '').split(';')) {
      const r = part.trim().match(/MP-(\d{3})(?: to MP-(\d{3}))?/);
      if (!r) continue;
      const a = +r[1]; const b = r[2] ? +r[2] : a;
      for (let i = a; i <= b; i++) out.push('MP-' + String(i).padStart(3, '0'));
    }
    return out;
  };
  const modules = en.modules.map(m => ({ id: m.Module_ID, name: T(m.Module_Name), tier: m.Tier, tierName: T(m.Tier), licensing: T(m.Licensing_Model), mps: expandMp(m.Included_Macro_Process_IDs), rateLimit: T(m.Rate_Limit) }));
  const packs = en.packs.map(p => ({ id: p.id, name: T(p.name), type: p.type, typeName: T(p.type), target: p.target, price: p.price, valueProposition: T(p.valueProposition), modules: Tl((p.modules || '').split(',').map(x => x.trim()).filter(Boolean)), mpText: p.mpText, deployment: p.deployment, users: p.users, storage: T(p.storage), addOnTo: p.addOnTo, mps: modules.find(m => m.id === p.id)?.mps || [] }));
  const addons = en.addons.map(a => ({ id: a.id, name: T(a.name), category: T(a.category), packsText: a.packsText, price: a.price, goals: T(a.goals), valueProposition: T(a.valueProposition) }));
  const integrations = en.integrations.map(i => ({ id: i.id, name: T(i.name), category: T(i.category), goals: T(i.goals), examples: T(i.examples), valueProposition: T(i.valueProposition), packs: i.packs }));
  const deploymentModes = en.deploymentModes.map(d => ({ code: d.code, name: T(d.name), description: T(d.description), typical: T(d.typical), multiplier: d.multiplier, isolation: T(d.isolation), residency: T(d.residency) }));
  const clusters = en.clusters.map(c => ({ name: T(c.name), behavior: T(c.behavior), pain: T(c.pain), hopes: T(c.hopes), fit: c.fit }));

  // ---- Sample tenant (D00d, D01a-h, D02a-b, D09a)
  const sample = {
    elements: en.sampleElements.map(e => ({ id: e.Element_ID, name: T(e.Element_Name), level: e.Level_Number, levelName: T(e.Level_Name), parent: e.Parent_Element_ID, function: e.Function_ID, type: T(e.Element_Type), lowest: e.Is_Lowest_Level_Task === 'Yes', owner: T(e.Owner_Role), status: e.Status, version: e.Version })),
    sheets: en.mpSheets.map(s => ({ id: s.Sheet_ID, element: s.Macro_Process_Element_ID, function: s.Function_ID, name: T(s.Name), inputs: T(s.Inputs), outputs: T(s.Outputs), R: Troles(s.RACSI_Responsible), A: Troles(s.RACSI_Accountable), C: Troles(s.RACSI_Consulted), S: Troles(s.RACSI_Support), I: Troles(s.RACSI_Informed), goals: T(s.Goals), apps: s.Related_Application_IDs, distribution: T(s.Distribution_List), human: T(s.Human_Resources), technical: T(s.Technical_IT_Infrastructure_Resources), risks: s.Related_Risk_Opportunity_IDs, docs: s.Related_Document_Record_IDs, version: s.Current_Version, status: s.Lifecycle_Status, type: s.Sheet_Type })),
    interactions: en.sheetInteractions.map(s => ({ id: s.Interaction_ID, sheet: s.Sheet_ID, element: s.Interacting_Element_ID, name: T(s.Interacting_Element_Name), type: T(s.Interaction_Type), info: T(s.Exchanged_Information) })),
    sheetTasks: en.sheetTasks.map(s => ({ sheet: s.Sheet_ID, element: s.Task_Element_ID, name: T(s.Task_Name), goals: T(s.Goals), brief: T(s.Brief_Description), detail: T(s.Detailed_Description) })),
    sheetKpis: en.sheetKpis.map(s => ({ id: s.Sheet_KPI_ID, sheet: s.Sheet_ID, code: s.KPI_Code, name: T(s.KPI_Name), formula: T(s.Formula), unit: T(s.Unit), measure: s.Measurement_Frequency, analysis: s.Analysis_Evaluation_Frequency, R: Troles(s.RACSI_Responsible), A: Troles(s.RACSI_Accountable), C: Troles(s.RACSI_Consulted), S: Troles(s.RACSI_Support), I: Troles(s.RACSI_Informed) })),
    sections: en.sheetSections.map(s => ({ id: s.Section_ID, sheet: s.Sheet_ID, title: T(s.Section_Title), order: s.Section_Order, type: T(s.Content_Type), content: T(s.Content), reusable: s.Is_Reusable_Template })),
    composites: en.compositeSheets.map(s => ({ id: s.Composite_ID, name: T(s.Composite_Name), basis: T(s.Grouping_Basis), members: s.Member_Sheet_IDs, rule: T(s.Aggregation_Rule), version: s.Current_Version, status: s.Lifecycle_Status })),
    monitoring: en.sheetMonitoring.map(s => ({ id: s.Monitoring_Method_ID, sheet: s.Sheet_ID, mode: s.Mode, frequency: s.Frequency })),
    sipoc: en.sipocRegister.map(s => ({ id: s.SIPOC_ID, element: s.Process_Element_ID, name: T(s.Process_Element_Name), level: T(s.Element_Level), state: s.SIPOC_State, asIsRequired: s.As_Is_Required, trigger: T(s.Trigger), suppliers: T(s.Input_Suppliers), inputs: T(s.Inputs), details: T(s.Fine_Grained_Details), R: Troles(s.RACSI_Responsible), A: Troles(s.RACSI_Accountable), C: Troles(s.RACSI_Consulted), S: Troles(s.RACSI_Support), I: Troles(s.RACSI_Informed), docs: s.Related_Internal_Document_IDs, outputs: T(s.Outputs), customers: T(s.Customers_Beneficiaries), endEvents: T(s.End_Events), goNoGo: T(s.Go_No_Go_Criteria), version: s.Current_Version, status: s.Lifecycle_Status })),
    procedures: en.procedures.map(p => ({ id: p.Procedure_ID, task: p.Task_Element_ID, title: T(p.Title), goals: T(p.Goals), scope: T(p.Scope_of_Work), definitions: T(p.Definitions), refs: p.Reference_Document_IDs, external: T(p.Main_External_Interactions), owner: T(p.Owner), documents: T(p.Main_Documents_and_Information), bpmn: p.BPMN_Diagram_ID, endEvents: T(p.End_Events), goNoGo: T(p.Go_No_Go_Decisions), kpis: p.KPI_IDs, reporting: T(p.Reporting), alerts: T(p.Alerts), version: p.Current_Version, status: p.Lifecycle_Status })),
    procedureSteps: en.procedureSteps.map(p => ({ id: p.Proc_Step_ID, procedure: p.Procedure_ID, seq: p.Sequence_No, flow: p.Flow_Type, flowName: T(p.Flow_Type), name: T(p.Step_Name), who: T(p.Who), docs: T(p.Associated_Documents_Applications), outputs: T(p.Outputs), customers: T(p.Customers_Beneficiaries), bpmn: p.BPMN_Element, next: p.Next_Step, goNoGo: T(p.Go_No_Go_Criteria) })),
    registry: en.referenceRegistry.map(r => ({ id: r.Item_ID, type: T(r.Item_Type), name: T(r.Name), code: r.Code, owner: T(r.Owner_Role), rating: r.Version_or_Rating, status: T(r.Status) })),
    levels: processLevels,
  };

  const requirements = en.requirements.map(r => ({ id: r.id, section: r.section, text: r.text }));

  return {
    segments, e2e, composites, chains, relationTypes, functions, processLevels, macroProcesses, tasks, steps, uf, standards,
    compliancePacks: en.compliancePacks.map(p => ({ id: p.id, name: T(p.name), segment: p.segment, standards: p.standards })),
    rules, actions, controls, risks, kpis, alerts, reports, docTemplates, policies, docVersions, classes, dataDictionary,
    valueLists, aiUseCases, roleMenus, modules, packs, addons, integrations, deploymentModes, clusters,
    priceMatrix: en.priceMatrix, bundles: en.bundles, bundleDiscounts: en.bundleDiscounts.map(b => ({ type: T(b.type), discount: b.discount })),
    agreements: en.agreements.map(a => ({ ...a, tierName: T(a.tier), commitmentName: T(a.commitment) })),
    sample, requirements, licensingLinks: en.licensingLinks, dms048Sample: en.dms048Sample, e2e01Expanded: en.e2e01Expanded,
    tier6Racsi: en.tier6Racsi, segIds, T, dict,
  };
}
