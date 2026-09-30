// Seeds a fresh database: reference catalog, permission matrix, libraries, the
// demonstration tenancy (2 groups + 1 independent organization, 60 organizations)
// and 120 "full run" projects (QMS and QHSE for every organization).
// Usage: npm run seed   (drops and recreates data/dynamicms.db)
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { openDb, migrate, closeDb, tx, run, all, get, uid, J } from '../db.js';
import { buildCatalog } from '../catalog/build.js';
import { saveBundle, load } from '../catalog/store.js';
import { FORM_KINDS } from '../catalog/forms.js';
import { ROLES, PERMISSIONS, defaultGrant } from '../permissions.js';
import { entitledMps, COMPLIANCE_STANDARDS } from '../packs.js';
import { HELP, FAQ } from '../content/help.js';
import { KB } from '../content/kb.js';
import { PROFILES, COUNTRY_NAMES, PEOPLE } from './profiles.js';
import { SME_TRACKS, COMPLEXITY_CRITERIA, VERTICAL_DRIVERS, GATES, CHECKLISTS, VERTICAL_CHECKLISTS, TEMPLATE_DEFS } from './libraries.js';
import { generateProject, TODAY, TRACK_GATES } from './project.js';
import { S, fill } from './text.js';
import { rng, addDays } from './rng.js';

const t0 = Date.now();
const log = (...a) => console.log(`[seed ${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);

export const USER_SLUGS = [
  ['ims', 'ims_manager'], ['quality', 'quality_manager'], ['hse', 'hse_manager'], ['risk', 'risk_manager'],
  ['compliance', 'compliance_officer'], ['audit', 'audit_manager'], ['hr', 'hr_manager'], ['documents', 'document_controller'],
  ['it', 'it_manager'], ['operations', 'operations_manager'], ['performance', 'performance_manager'], ['esg', 'esg_manager'],
  ['transformation', 'transformation_manager'], ['process', 'process_excellence_manager'], ['admin', 'tenant_admin'],
  ['ceo', 'top_management'], ['employee', 'employee'], ['aigov', 'ai_governance_officer'], ['auditor', 'auditor'],
];
const LANG_OF = { MA: 'fr', FR: 'fr', BE: 'fr', TN: 'fr', CA: 'en', DE: 'en', EG: 'ar', SA: 'ar', AE: 'ar', QA: 'ar' };
const ts = (d) => `${d}T09:00:00.000Z`;

function resetDb() {
  for (const f of [config.dbFile, `${config.dbFile}-wal`, `${config.dbFile}-shm`]) if (fs.existsSync(f)) fs.rmSync(f);
  openDb();
  migrate();
}

function seedCatalog() {
  const cat = buildCatalog();
  delete cat.T; delete cat.dict;
  tx(() => {
    for (const [k, v] of Object.entries(cat)) saveBundle(k, v);
    saveBundle('forms', FORM_KINDS);
    saveBundle('help', HELP);
    saveBundle('faq', FAQ);
    saveBundle('kb', KB);
    run("INSERT INTO meta(key,value) VALUES('catalog_version','1.0')");
  });
  return load();
}

function seedPermissions() {
  tx(() => {
    for (const role of ROLES) for (const [perm] of PERMISSIONS) run('INSERT INTO role_permissions(role,perm,granted,customized) VALUES(?,?,?,0)', role.code, perm, defaultGrant(role.code, perm) ? 1 : 0);
  });
}

function seedLibraries(cat) {
  const libs = { gates: {}, checklists: {}, templates: {} };
  tx(() => {
    for (const t of SME_TRACKS) run('INSERT INTO sme_tracks(id,code,name,description,mp_count,e2e_count,gates,items_per_gate,duration_weeks,min_score,max_score,status,owner,version) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,1)',
      uid(), t.code, J(t.name), J(t.description), t.mp, t.e2e, t.gates, t.items, t.weeks, t.min, t.max, 'Active', 'platform_admin');
    for (const c of COMPLEXITY_CRITERIA) run('INSERT INTO complexity_criteria(id,code,name,weight,vertical,version,levels) VALUES(?,?,?,?,?,1,?)', uid(), c.code, J(c.name), c.weight, null, J(c.levels));
    for (const [v, d] of Object.entries(VERTICAL_DRIVERS)) run('INSERT INTO complexity_criteria(id,code,name,weight,vertical,version,levels) VALUES(?,?,?,?,?,1,?)', uid(), `CX-${v}`, J(d.name), d.weight, v, J(null));
    const created = ts('2025-09-01');
    for (const [e2e, name, exit] of GATES) {
      const id = uid();
      libs.gates[e2e] = id;
      run('INSERT INTO gate_defs(id,org_id,code,name,purpose,entry_criteria,exit_criteria,approvers,applicability,enforce,version,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,1,1,?,?)',
        id, null, `GATE-${e2e}`, J(name), J(cat.e2eById[e2e].goals), J(fill(S('All steps of {0} completed', 'Toutes les étapes de {0} terminées', 'اكتمال جميع خطوات {0}'), cat.e2eById[e2e].name)), J(exit),
        J(['top_management', 'ims_manager']), J({ modes: ['FULL', 'SME'], tracks: Object.entries(TRACK_GATES).filter(([, l]) => l.includes(e2e)).map(([k]) => k) }), 'Published', created);
      const cid = uid();
      const cname = fill(S('Gate checklist — {0}', 'Liste de contrôle du jalon — {0}', 'قائمة تحقق البوابة — {0}'), cat.e2eById[e2e].name);
      libs.checklists[`CL-${e2e}`] = { id: cid, name: cname };
      run('INSERT INTO checklist_templates(id,org_id,code,name,scope,vertical,mode,track,items,version,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,1,?,?)', cid, null, `CL-${e2e}`, J(cname), 'universal', null, null, null, J(CHECKLISTS[e2e]), 'Published', created);
      run('INSERT INTO gate_checklists(gate_id,checklist_id,seq,mandatory,track) VALUES(?,?,1,1,?)', id, cid, null);
    }
    for (const [v, items] of Object.entries(VERTICAL_CHECKLISTS)) {
      const cid = uid();
      const segName = v === 'SME' ? S('SME', 'PME', 'المؤسسات الصغيرة والمتوسطة') : cat.segById[v].name;
      const cname = fill(S('Vertical checklist — {0}', 'Liste de contrôle sectorielle — {0}', 'قائمة التحقق القطاعية — {0}'), segName);
      libs.checklists[`CL-V-${v}`] = { id: cid, name: cname };
      run('INSERT INTO checklist_templates(id,org_id,code,name,scope,vertical,mode,track,items,version,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,1,?,?)', cid, null, `CL-V-${v}`, J(cname), 'vertical', v, v === 'SME' ? 'SME' : null, null, J(items), 'Published', created);
    }
    const addTpl = (code, scope, vertical, mode, ms, name, description) => {
      const id = uid();
      const e2es = cat.e2e.map(e => e.id);
      run(`INSERT INTO project_templates(id,org_id,code,name,description,scope,vertical,mode,track,ms_type,status,version,fields,phases,roles,milestones,use_count,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,1,?,?,?,?,0,?)`,
        id, null, code, J(name), J(description), scope, vertical, mode, null, ms, 'Published',
        J({ standards: ms === 'QHSE' ? ['ISO 9001', 'ISO 14001', 'ISO 45001'] : ['ISO 9001'] }), J(e2es.map(e => ({ e2e: e, gate: `GATE-${e}` }))),
        J(['ims_manager', 'quality_manager', ms === 'QHSE' ? 'hse_manager' : 'risk_manager', 'top_management']), J(e2es.filter((_, i) => i % 3 === 2).map(e => `GATE-${e}`)), created);
      libs.templates[`${mode}-${ms}-${vertical || 'UNI'}`] = id;
    };
    for (const t of TEMPLATE_DEFS) addTpl(t.code, 'universal', null, t.mode, t.ms, t.name, t.name);
    for (const seg of cat.segments.filter(s => s.id !== 'SME')) {
      for (const mode of ['FULL', 'SME']) for (const ms of ['QMS', 'QHSE']) {
        const nm = fill(S('{0} — {1} {2}', '{0} — {1} {2}', '{0} — {1} {2}'), seg.name, ms, mode === 'FULL' ? S('full lifecycle', 'cycle de vie complet', 'دورة الحياة الكاملة') : S('SME quick start', 'démarrage rapide PME', 'بدء سريع للمؤسسات الصغيرة'));
        addTpl(`TPL-${seg.id}-${mode}-${ms}`, 'vertical', seg.id, mode, ms, nm, fill(S('Standards: {0}', 'Normes : {0}', 'المعايير: {0}'), seg.mustStandards.join(', ')));
      }
    }
  });
  return libs;
}

function orgPlan(cat) {
  const verticals = cat.segments.filter(s => s.id !== 'SME');
  const L = (en, fr, ar) => ({ en, fr, ar });
  const groups = [
    { key: 'G1', name: L('Horizon Industrial Group', 'Groupe Industriel Horizon', 'مجموعة هورايزن الصناعية'), description: L('Group of large companies, one per industry vertical, plus a universal holding.', 'Groupe de grandes entreprises, une par secteur, plus une holding universelle.', 'مجموعة من الشركات الكبرى، شركة لكل قطاع، إضافة إلى شركة قابضة عامة.') },
    { key: 'G2', name: L('Nova SME Alliance', 'Alliance PME Nova', 'تحالف نوفا للمؤسسات الصغيرة والمتوسطة'), description: L('Alliance of small and medium enterprises, one per industry vertical.', 'Alliance de petites et moyennes entreprises, une par secteur.', 'تحالف من المؤسسات الصغيرة والمتوسطة، مؤسسة لكل قطاع.') },
  ];
  const orgs = [];
  for (const v of verticals) {
    const p = PROFILES[v.id];
    orgs.push({ group: 'G1', code: `HZ-${v.id}`, sector: v.id, size: 'Large', name: L(`Horizon ${p.short.en}`, `Horizon ${p.short.fr}`, `هورايزن ${p.short.ar}`), domain: `horizon-${v.id.toLowerCase()}.example`, profile: p, seg: v });
  }
  orgs.push({ group: 'G1', code: 'HZ-UNI', sector: 'UNI', size: 'Large', name: L('Horizon Universal Holdings', 'Horizon Holding Universelle', 'هورايزن القابضة العامة'), domain: 'horizon-universal.example', profile: PROFILES.UNI, seg: null, scenarioBase: 'UNI-LARGE' });
  for (const v of verticals) {
    const p = PROFILES[v.id];
    orgs.push({ group: 'G2', code: `NV-${v.id}`, sector: v.id, size: 'SME', name: L(`Nova ${p.short.en}`, `Nova ${p.short.fr}`, `نوفا ${p.short.ar}`), domain: `nova-${v.id.toLowerCase()}.example`, profile: p, seg: v, scenarioBase: v.id === 'AEC' ? 'SME-AEC' : null });
  }
  orgs.push({ group: null, code: 'AT-UNI', sector: 'UNI', size: 'SME', name: L('Atlas Universal SME', 'Atlas PME Universelle', 'أطلس للخدمات (مؤسسة صغيرة ومتوسطة)'), domain: 'atlas-sme.example', profile: PROFILES.SME, seg: cat.segById.SME, scenarioBase: 'SME-UNI' });
  return { groups, orgs };
}

function seedOrg(cat, o, idx, groupIds, libs, hash) {
  const r = rng(`org:${o.code}`);
  const large = o.size === 'Large';
  const id = uid();
  const country = o.profile.country;
  const lang = LANG_OF[country] || 'en';
  const employees = large ? r.int(1200, 9500) : r.int(18, 240);
  const segPack = o.seg && o.seg.id !== 'SME' ? o.seg.industryPack : null;
  const pack = large ? 'DMS-ENT' : 'DMS-SME';
  const industry = segPack ? [segPack] : [];
  const caps = large ? ['DMS-AI', 'DMS-CERT', 'DMS-ESG'] : ['DMS-CERT', 'DMS-AI'];
  const addons = large ? ['ADD-01', 'ADD-04', 'ADD-06', 'ADD-07'] : ['ADD-04'];
  const compliance = large ? ['ISO9001', 'ISO27001', 'GDPR', ...(['HLS', 'HCA'].includes(o.sector) ? ['HIPAA'] : [])] : ['ISO9001'];
  const created = ts(large ? '2025-09-10' : '2025-10-20');
  run(`INSERT INTO organizations(id,group_id,name,short_code,sector,size,sme_class,employees,country,city,default_lang,email_domain,benchmark_sharing,deployment_mode,pack,industry_packs,capability_packs,addons,compliance_standards,support_tier,seats,currency,created_at,logo_text)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  id, o.group ? groupIds[o.group] : null, J(o.name), o.code, o.sector, o.size, large ? null : employees < 50 ? 'Small' : 'Medium', employees, country, J(o.profile.city),
  lang, o.domain, ['HZ-SHB', 'NV-DST'].includes(o.code) ? 0 : 1, large ? (['HZ-AER', 'HZ-ENG'].includes(o.code) ? 'DEP-5' : 'DEP-3') : 'DEP-1', pack, J(industry), J(caps), J(addons), J(compliance),
  large ? 'Premium' : 'Standard', large ? 500 : 25, 'USD', created, o.code.slice(3));
  const org = get('SELECT * FROM organizations WHERE id=?', id);

  // Users: one named person per role (email = role@domain)
  const users = {};
  USER_SLUGS.forEach(([slug, role], j) => {
    const uidv = uid();
    const name = PEOPLE[(j + idx * 7) % PEOPLE.length];
    run('INSERT INTO users(id,org_id,email,name,password_hash,roles,lang,is_platform_admin,status,created_at,last_login) VALUES(?,?,?,?,?,?,?,0,?,?,?)',
      uidv, id, `${slug}@${o.domain}`, name, hash, J([role]), lang, 'Active', created, slug === 'quality' || slug === 'ims' ? ts(addDays(TODAY, -1)) : null);
    users[role] = { id: uidv, name, email: `${slug}@${o.domain}` };
  });

  // Organizational breakdown structure
  const rootId = uid();
  run('INSERT INTO obs_nodes(id,org_id,project_id,parent_id,name,type,created_at) VALUES(?,?,?,?,?,?,?)', rootId, id, null, null, J(o.name), 'Organization', created);
  const hq = uid();
  run('INSERT INTO obs_nodes(id,org_id,project_id,parent_id,name,type,created_at) VALUES(?,?,?,?,?,?,?)', hq, id, null, rootId, J(S('Headquarters', 'Siège', 'المقر الرئيسي')), 'Site', created);
  const site = uid();
  run('INSERT INTO obs_nodes(id,org_id,project_id,parent_id,name,type,created_at) VALUES(?,?,?,?,?,?,?)', site, id, null, rootId, J(fill(S('{0} site', 'Site de {0}', 'موقع {0}'), o.profile.city)), 'Site', created);
  const depts = [S('Quality', 'Qualité', 'الجودة'), S('HSE', 'HSE', 'الصحة والسلامة والبيئة'), S('Operations', 'Opérations', 'العمليات'), S('Human Resources', 'Ressources humaines', 'الموارد البشرية'), S('Information Technology', 'Informatique', 'تقنية المعلومات'), S('Finance', 'Finance', 'المالية')];
  const deptRoles = [['quality_manager', 'document_controller', 'audit_manager', 'process_excellence_manager'], ['hse_manager', 'esg_manager'], ['operations_manager', 'employee', 'performance_manager', 'transformation_manager'], ['hr_manager'], ['it_manager', 'ai_governance_officer', 'tenant_admin'], ['risk_manager', 'compliance_officer']];
  depts.forEach((d, j) => {
    const nid = uid();
    run('INSERT INTO obs_nodes(id,org_id,project_id,parent_id,name,type,created_at) VALUES(?,?,?,?,?,?,?)', nid, id, null, j === 2 ? site : hq, J(d), 'Department', created);
    for (const role of deptRoles[j]) run('INSERT INTO obs_members(id,org_id,node_id,user_id,role_in_node) VALUES(?,?,?,?,?)', uid(), id, nid, users[role].id, role);
  });
  for (const role of ['top_management', 'ims_manager', 'auditor']) run('INSERT INTO obs_members(id,org_id,node_id,user_id,role_in_node) VALUES(?,?,?,?,?)', uid(), id, rootId, users[role].id, role);

  // Organization-level governance: business rules, controls (+ compliance scaffolds), AI use cases, alerts
  const sevOf = Object.fromEntries(cat.alerts.map(a => [a.rule, a.severity]));
  for (const b of cat.rules) run('INSERT INTO business_rules(id,org_id,code,step_ref,mp_id,condition,action_code,action,rule_type,severity,owner_role,obs_node,active,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,1,?)',
    uid(), id, b.id, b.step, b.mp, J(b.condition), b.actionId, J(b.action), b.type, sevOf[b.id] || 'Medium', cat.mpById[b.mp]?.ownerRoleCode || 'ims_manager', rootId, created);
  for (const c of cat.controls) run('INSERT INTO controls(id,org_id,code,name,description,type,coso,frequency,owner_role,effectiveness,standard,step_refs,mp_id,obs_node,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    uid(), id, c.id, J(c.name), J(c.description), c.type, c.coso, r.pick(['Monthly', 'Quarterly', 'Per event']), cat.mpById[c.steps[0]?.split('.')[0]]?.ownerRoleCode || 'ims_manager',
    r.pick(['Effective', 'Effective', 'Effective', 'Needs improvement']), 'ISO 9001', J(c.steps), c.steps[0]?.split('.')[0] || null, rootId, created);
  for (const sId of compliance) {
    const cs = COMPLIANCE_STANDARDS.find(x => x.id === sId);
    cs.controls.forEach((c, j) => run('INSERT INTO controls(id,org_id,code,name,description,type,coso,frequency,owner_role,effectiveness,standard,step_refs,mp_id,obs_node,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      uid(), id, `${sId}-C${j + 1}`, J(c), J(c), 'Preventive', 'Control Activities', 'Quarterly', 'compliance_officer', 'Not tested', sId, J([]), null, rootId, created));
  }
  const aiUsecases = [];
  for (const a of cat.aiUseCases) {
    const aid = uid();
    run('INSERT INTO ai_usecases(id,org_id,code,name,tier,module,trigger_,expected_output,checkpoint,prompt,task_type,risk_level,linked_step,linked_mp,custom,active,approval,version,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,1,?,1,?)',
      aid, id, a.id, J(a.name), a.tier, cat.mpById[a.mp]?.module || null, J(cat.stepById[a.step]?.name || null), J(a.name), J(a.checkpoint), J(a.prompt || null), J(a.taskType), a.risk, a.step, a.mp, a.approval, created);
    aiUsecases.push({ id: aid, mp: a.mp, code: a.id });
  }
  if (large) {
    const aid = uid();
    run('INSERT INTO ai_usecases(id,org_id,code,name,tier,module,trigger_,expected_output,checkpoint,prompt,task_type,risk_level,linked_step,linked_mp,custom,active,approval,version,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,1,?,1,?)',
      aid, id, 'AIUC-C01', J(fill(S('Suggest containment for {0} defects', 'Suggérer un confinement pour les défauts de {0}', 'اقتراح احتواء لعيوب {0}'), o.profile.product)), 'Assistive', null,
      J(S('Nonconformity reported', 'Non-conformité déclarée', 'الإبلاغ عن عدم مطابقة')), J(S('Ranked containment options with rationale', 'Options de confinement classées et justifiées', 'خيارات احتواء مرتبة مع المبررات')),
      J(S('Quality Manager accepts, edits or rejects each option', 'Le responsable qualité accepte, modifie ou rejette chaque option', 'يقبل مدير الجودة كل خيار أو يعدّله أو يرفضه')),
      J(fill(S('You assist the quality team of {0}. Propose three containment actions for the defect below, citing past REX where relevant.', 'Vous assistez l\'équipe qualité de {0}. Proposez trois actions de confinement pour le défaut ci-dessous, en citant le REX pertinent.', 'أنت تساعد فريق الجودة في {0}. اقترح ثلاثة إجراءات احتواء للعيب أدناه مع الاستشهاد بالدروس المستفادة ذات الصلة.'), o.name)),
      J(S('Recommendation', 'Recommandation', 'توصية')), 'Medium', 'MP-019.1', 'MP-019', 'Approved', created);
    aiUsecases.push({ id: aid, mp: 'MP-019', code: 'AIUC-C01' });
  }
  for (const t of ['STEP_OVERDUE', 'KPI_OFF_TARGET', 'NC_CRITICAL', 'ACTION_OVERDUE', 'DOC_REVIEW_DUE', 'GATE_PENDING', ...cat.alerts.map(a => a.id)]) run('INSERT INTO alert_settings(org_id,type,enabled) VALUES(?,?,1)', id, t);
  const enabled = large ? ['INT-02', 'INT-04', 'INT-08', 'INT-09'] : ['INT-01', 'INT-03'];
  for (const i of cat.integrations) {
    const iid = uid();
    const on = enabled.includes(i.id);
    run('INSERT INTO integrations(id,org_id,code,enabled,config,credential_ref,health,checked_at,mapping) VALUES(?,?,?,?,?,?,?,?,?)', iid, id, i.id, on ? 1 : 0,
      J(on ? { endpoint: `https://${i.id.toLowerCase()}.${o.domain}/api`, direction: 'inbound' } : {}), on ? `vault://${o.code}/${i.id}` : null, on ? 'OK' : null, on ? ts(addDays(TODAY, -1)) : null,
      J(on ? { employee: 'users', supplier: 'registers.suppliers', incident: 'ncs' } : {}));
    if (on) for (let k = 0; k < 3; k++) run('INSERT INTO integration_log(id,org_id,integration_id,direction,record,result,at) VALUES(?,?,?,?,?,?,?)', uid(), id, iid, 'inbound', `REC-${r.int(1000, 9999)}`, 'OK', ts(addDays(TODAY, -k - 1)));
  }
  if (o.seg && o.seg.id !== 'SME') run('INSERT INTO vertical_activations(id,org_id,vertical,version,validation,activation_order,status,activated_at) VALUES(?,?,?,?,?,?,?,?)', uid(), id, o.sector, 1, 'Validated', 1, 'Active', created);
  if (!large) {
    const steps = (cat.stepsByMp['MP-143'] || []).map((s, j) => ({ step: s.id, name: s.name, done: true, day: 2 + j * 2 }));
    run('INSERT INTO onboarding_plans(id,org_id,steps,target_days,started_at,status,metrics) VALUES(?,?,?,?,?,?,?)', uid(), id, J(steps), 30, created, 'Completed', J({ daysToFirstValue: r.int(12, 26), usersActivated: 19 }));
  }
  run('INSERT INTO settings(org_id,key,value) VALUES(?,?,?)', id, 'fiscal_year_start', '01');
  run('INSERT INTO settings(org_id,key,value) VALUES(?,?,?)', id, 'week_start', lang === 'ar' ? 'sunday' : 'monday');

  // Two full runs per organization
  const entitled = entitledMps(org);
  const results = [];
  for (const ms of ['QMS', 'QHSE']) {
    const scenario = o.scenarioBase && !(o.scenarioBase === 'SME-AEC' && ms === 'QHSE') ? `${o.scenarioBase}-${ms}` : null;
    results.push(generateProject({ cat, org, orgName: o.name, msType: ms, users, profile: o.profile, seg: o.seg, entitled, libs, scenario, obsRoot: rootId, aiUsecases }));
  }
  return results;
}

async function main() {
  log('resetting database', config.dbFile);
  resetDb();
  const cat = seedCatalog();
  log('catalog saved:', cat.macroProcesses.length, 'macro processes,', cat.steps.length, 'steps,', cat.e2e.length, 'E2E');
  seedPermissions();
  const libs = seedLibraries(cat);
  const hash = bcrypt.hashSync(config.demoPassword, 10);
  run('INSERT INTO users(id,org_id,email,name,password_hash,roles,lang,is_platform_admin,status,created_at) VALUES(?,?,?,?,?,?,?,1,?,?)',
    uid(), null, config.adminEmail, 'Platform Administrator', bcrypt.hashSync(config.adminPassword, 10), J(['platform_admin']), 'en', 'Active', ts('2025-09-01'));
  const { groups, orgs } = orgPlan(cat);
  const groupIds = {};
  for (const g of groups) { const id = uid(); groupIds[g.key] = id; run('INSERT INTO groups_(id,name,description,created_at) VALUES(?,?,?,?)', id, J(g.name), J(g.description), ts('2025-09-01')); }
  let nProj = 0; let nSteps = 0;
  orgs.forEach((o, idx) => {
    const res = tx(() => seedOrg(cat, o, idx, groupIds, libs, hash));
    nProj += res.length; nSteps += res.reduce((a, b) => a + b.steps, 0);
    log(`${o.code.padEnd(8)} ${o.size.padEnd(5)} ` + res.map(x => `${x.mps} MPs/${x.steps} steps (${Math.round(100 * x.done / x.steps)}%)${x.track ? ' ' + x.track : ''}`).join(' | '));
  });
  run("INSERT INTO meta(key,value) VALUES('seeded_at',?)", new Date().toISOString());
  run("INSERT INTO meta(key,value) VALUES('seed_today',?)", TODAY);
  const count = (t) => get(`SELECT COUNT(*) n FROM ${t}`).n;
  log(`done: ${orgs.length} organizations, ${nProj} projects, ${nSteps} steps; users ${count('users')}, KPIs ${count('kpis')}, NCs ${count('ncs')}, actions ${count('actions')}, documents ${count('documents')}, alerts ${count('alerts')}`);
  getDbCheckpoint();
  closeDb();
}
function getDbCheckpoint() { try { run('PRAGMA wal_checkpoint(TRUNCATE)'); } catch { /* ignore */ } }

main().catch(e => { console.error(e); process.exit(1); });
