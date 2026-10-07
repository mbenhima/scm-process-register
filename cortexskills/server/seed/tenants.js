// Tenancy and full runs: for every vertical, one Large organization (in a Group) and one SME, each with a
// Digital Skills run and an AI Skills run instantiating every end-to-end process, task and step.
import fs from 'node:fs';
import path from 'node:path';
import { all, one, run, tx as transaction } from '../src/db.js';
import { detUuid, S, rng, addDays, pick } from '../src/lib/util.js';
import * as cat from '../src/catalog.js';
import { hashPassword } from '../src/auth.js';
import { provisionOrg, processPlan, instantiateProject, insertRecord, refreshProgress } from '../src/services/projects.js';
import { ragOf } from '../src/services/ops.js';
import { computeAlerts } from '../src/services/alerts.js';
import { config } from '../src/config.js';
import { t as tx } from '../src/i18n.js';
import { T, tr, fillT } from './lib.js';
import { seedQuestionnaires, seedPersonas, seedTraining, seedDocuments } from './release11.js';
import { UNIVERSAL } from '../src/services/guidance.js';
import { seedOrg110 } from './release110.js';

const U = detUuid;
const NOW = new Date();
const iso = d => new Date(d).toISOString();
const daysAgo = n => iso(NOW.getTime() - n * 86400000);
export const DEMO_PASSWORD = 'CortexSkills#2026';
export const ROLE_LOCAL = { 'R-01': 'admin', 'R-02': 'hrd', 'R-03': 'headld', 'R-04': 'analyst', 'R-05': 'strategist', 'R-06': 'ldbp', 'R-07': 'planner', 'R-08': 'designer', 'R-09': 'content', 'R-10': 'trainadmin',
  'R-11': 'trainer', 'R-12': 'employee', 'R-13': 'manager', 'R-14': 'perf', 'R-15': 'strategy', 'R-16': 'hrbp', 'R-17': 'gpec', 'R-18': 'finance', 'R-19': 'purchasing', 'R-20': 'compliance', 'R-21': 'quality',
  'R-22': 'itarch', 'R-23': 'consultant', 'R-24': 'km', 'R-25': 'change', 'R-26': 'ee', 'R-27': 'site', 'R-28': 'sme', 'R-29': 'auditor' };
const SME_ROLES = ['R-01', 'R-02', 'R-03', 'R-04', 'R-11', 'R-12', 'R-13', 'R-18', 'R-20', 'R-23', 'R-29'];
const FIRST = ['Salma', 'Youssef', 'Imane', 'Karim', 'Nadia', 'Omar', 'Leila', 'Hicham', 'Sara', 'Mehdi', 'Rim', 'Anas', 'Hajar', 'Reda', 'Zineb', 'Amine', 'Kawtar', 'Hamza', 'Ghita', 'Ayoub', 'Meryem', 'Yassine', 'Soukaina', 'Adil', 'Hind', 'Tarik', 'Asmae', 'Rachid', 'Loubna'];
const LAST = ['Bennani', 'El Idrissi', 'Alaoui', 'Tazi', 'Berrada', 'Chraibi', 'Fassi', 'Amrani', 'Kettani', 'Benjelloun', 'Lahlou', 'Squalli', 'Ouazzani', 'Sefrioui', 'Naciri', 'Bouzidi', 'Hajji', 'Mansouri', 'Ziani', 'Rami'];
const person = (r, i) => `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[(i * 7 + Math.floor(r() * LAST.length)) % LAST.length]}`;
const slug = s => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '').slice(0, 18);
const LV = ['MS', 'MO', 'OP'];

export function seedPlatform() {
  const pwHash = hashPassword(DEMO_PASSWORD);
  run(`INSERT INTO users(id,org_id,email,name,password_hash,language,title,is_platform,created_at) VALUES(?,?,?,?,?,?,?,1,?)`, U('user:platform'), null, 'admin@cortexskills.app', 'Platform Administrator', hashPassword('Admin#2026'), 'en', 'Platform Administrator', daysAgo(200));
  return pwHash;
}

/** Organizations are committed one at a time: a single transaction for the whole seed grows to several hundred
 *  megabytes and fails on some Windows set-ups (antivirus or file locks on the journal). */
/** Complete examples: every task and every step of both runs done (three verticals, three default languages, one SME). */
const COMPLETE = new Set(['AUTO:LARGE', 'TELC:LARGE', 'LOGI:LARGE', 'FNB:SME']);
export const isComplete = o => !!(o.universal || o.showcase || o.complete);
export function seedTenants(pwHash) {
  const orgs = transaction(() => createTenants(pwHash));
  for (const o of orgs) transaction(() => seedOrg(o));
  return orgs;
}
function createTenants(pwHash) {
  const verticals = cat.list('verticalSeed'); const groups = cat.list('groupSeed');
  for (const g of groups) run(`INSERT INTO groups_(id,name,description,benchmark_sharing,created_at) VALUES(?,?,?,1,?)`, U('group:' + g.id), S(g.name), S(g.description), daysAgo(400));
  const smeNet = cat.list('smeNetwork')[0].verticals;
  const orgs = [];
  verticals.forEach((v, vi) => {
    for (const seg of ['LARGE', 'SME']) {
      const o = seg === 'LARGE' ? v.large : v.sme; const id = U(`org:${v.id}:${seg}`);
      const domain = slug(o.name.en) + '.ma';
      const groupId = seg === 'LARGE' ? U('group:' + v.group) : smeNet.includes(v.id) ? U('group:SME') : null;
      const lang = ['fr', 'en', 'ar'][vi % 3];
      run(`INSERT INTO organizations(id,group_id,name,sector,segment,employees,sme_segment,country,city,default_language,email_domain,benchmark_sharing,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,1,?)`,
        id, groupId, S(o.name), v.id, seg, o.employees, seg === 'SME' ? (o.employees <= 10 ? 'Micro' : o.employees <= 50 ? 'Small' : 'Medium') : null, 'Morocco', o.city, lang, domain, daysAgo(380 - vi));
      provisionOrg(id, { packId: seg === 'LARGE' ? 'BND-05' : 'SME-CMP', seats: seg === 'LARGE' ? 600 : 100, lang, compliance: seg === 'LARGE' ? ['GDPR', 'LAW0908', 'ISO9001'] : ['LAW0908'], addons: seg === 'LARGE' ? ['AD-08', 'AD-11'] : ['AD-11'] }, U);
      run(`INSERT OR IGNORE INTO vertical_activation(org_id,vertical_id,version,sort,validated,activated_at) VALUES(?,?,1,1,1,?)`, id, v.id, daysAgo(370));
      run(`UPDATE org_config SET sme_mode=? WHERE org_id=?`, seg === 'SME' ? 1 : 0, id);
      orgs.push({ id, v, vi, seg, domain, lang, name: o.name, complete: COMPLETE.has(`${v.id}:${seg}`) });
    }
  });
  // Universal, sector-agnostic scenario organization: every end-to-end process completed (sample documents).
  { const v = UNIVERSAL; const id = U('org:UNI:LARGE'); const o = v.large; const domain = 'horizonservices.ma';
    run(`INSERT INTO organizations(id,group_id,name,sector,segment,employees,sme_segment,country,city,default_language,email_domain,benchmark_sharing,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,1,?)`, id, null, S(o.name), 'UNI', 'LARGE', o.employees, null, 'Morocco', o.city, 'en', domain, daysAgo(390));
    provisionOrg(id, { packId: 'BND-05', seats: 600, lang: 'en', compliance: ['GDPR', 'LAW0908', 'ISO9001'], addons: ['AD-08', 'AD-11'] }, U);
    run(`UPDATE org_config SET sme_mode=0 WHERE org_id=?`, id);
    orgs.push({ id, v, vi: verticals.length, seg: 'LARGE', domain, lang: 'en', name: o.name, universal: true }); }
  // Healthcare showcase organizations (fictional names): a private clinic group and a generic public hospital,
  // each with its whole lifecycle completed, for the healthcare sample documents.
  for (const sc of [
    { key: 'HCPR-PRIV', name: { en: 'Santéora Private Clinics Group', fr: 'Groupe Santéora Cliniques Privées', ar: 'مجموعة مصحات سانتيورا الخاصة' }, city: 'Casablanca', employees: 2600, domain: 'santeora.ma', lang: 'fr' },
    { key: 'HCPR-PUB', name: { en: 'Regional Hospital Centre', fr: 'Centre Hospitalier Régional', ar: 'المركز الاستشفائي الجهوي' }, city: 'Région', employees: 3400, domain: 'chr-sante.ma', lang: 'fr' }]) {
    const v = cat.get('verticalSeed', 'HCPR'); const id = U('org:' + sc.key);
    run(`INSERT INTO organizations(id,group_id,name,sector,segment,employees,sme_segment,country,city,default_language,email_domain,benchmark_sharing,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,1,?)`, id, null, S(sc.name), 'HCPR', 'LARGE', sc.employees, null, 'Morocco', sc.city, sc.lang, sc.domain, daysAgo(395));
    provisionOrg(id, { packId: 'BND-05', seats: 600, lang: sc.lang, compliance: ['GDPR', 'LAW0908', 'ISO9001'], addons: ['AD-08', 'AD-11'] }, U);
    run(`INSERT OR IGNORE INTO vertical_activation(org_id,vertical_id,version,sort,validated,activated_at) VALUES(?,?,1,1,1,?)`, id, 'HCPR', daysAgo(370));
    run(`UPDATE org_config SET sme_mode=0 WHERE org_id=?`, id);
    orgs.push({ id, v, vi: verticals.length + 1, seg: 'LARGE', domain: sc.domain, lang: sc.lang, name: sc.name, showcase: true });
  }
  // Users: one account per standard role (Large) or the core SME roles, all with the demonstration password.
  for (const o of orgs) {
    const r = rng('users:' + o.id); o.users = [];
    for (const role of all(`SELECT * FROM roles ORDER BY sort`)) {
      if (o.seg === 'SME' && !SME_ROLES.includes(role.id)) continue;
      const uid = U(`user:${o.id}:${role.id}`); const nm = person(r, o.users.length); const title = pick(role.name, 'en');
      run(`INSERT INTO users(id,org_id,email,name,password_hash,language,title,created_at,last_login) VALUES(?,?,?,?,?,?,?,?,?)`, uid, o.id, `${ROLE_LOCAL[role.id]}@${o.domain}`, nm, pwHash, null, title, daysAgo(360), daysAgo(Math.floor(r() * 10)));
      run(`INSERT INTO user_roles(user_id,role_id) VALUES(?,?)`, uid, role.id);
      if (o.seg === 'SME' && role.id === 'R-03') { for (const extra of ['R-05', 'R-06', 'R-07', 'R-08', 'R-10', 'R-14', 'R-16', 'R-17', 'R-21', 'R-24', 'R-25']) run(`INSERT OR IGNORE INTO user_roles(user_id,role_id) VALUES(?,?)`, uid, extra); }
      if (o.seg === 'SME' && role.id === 'R-04') { for (const extra of ['R-09', 'R-15', 'R-19', 'R-22', 'R-26', 'R-27', 'R-28']) run(`INSERT OR IGNORE INTO user_roles(user_id,role_id) VALUES(?,?)`, uid, extra); }
      o.users.push({ id: uid, role: role.id, name: nm, roleNames: '' });
    }
    for (const u of o.users) u.roleNames = all(`SELECT r.name FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=?`, u.id).map(x => pick(x.name, 'en')).join('|');
    run(`INSERT OR IGNORE INTO user_prefs(user_id,data) VALUES(?,?)`, o.users.find(u => u.role === 'R-03').id, S({ dock: 'left', pinned: true, favorites: ['/', '/my-tasks', '/projects', '/reports'], collapsed: [], channels: { alerts: ['inapp', 'email'], tasks: ['inapp'], approvals: ['inapp', 'email'], questionnaires: ['inapp'], system: ['inapp'] } }));
  }
  return orgs;
}

function seedOrg(o) {
  const r = rng('org:' + o.id);
  const fns = all(`SELECT id, name FROM obs_nodes WHERE org_id=? AND type='Function'`, o.id).map(x => ({ id: x.id, name: JSON.parse(x.name) }));
  const vals = { sector: o.v.name, standard: o.v.standards[0], core: o.v.coreFunction.name, org: o.name };
  const rec = (entity, key, data, projectId = null, ver = false) => { const id = U(`${entity}:${o.id}:${key}`); insertRecord(id, entity, o.id, projectId, key, data, o.users[0].id, ver); return id; };
  // ---- Organization-level business objects
  const comps = [...o.v.themes.digital, ...o.v.themes.ai].map((t, i) => rec('Competency', 'c' + i, { name: t, label: t, family: i < 3 ? 'Digital' : 'AI', level_scale: '1-4' }));
  comps.push(rec('Competency', 'cstd', { name: tr(`${o.v.standards[0]} compliance`), label: tr(`${o.v.standards[0]} compliance`), family: 'Compliance', level_scale: '1-4' }));
  const positions = [['Operator', 'Opérateur', 'عامل'], ['Supervisor', 'Encadrant', 'مؤطر'], ['Manager', 'Manager', 'مسؤول'], ['Quality inspector', 'Contrôleur qualité', 'مراقب الجودة'], ['Data analyst', 'Analyste de données', 'محلل بيانات'], ['Maintenance technician', 'Technicien de maintenance', 'تقني صيانة']]
    .map((p, i) => { const t = fillT({ en: `${p[0]} — {core}`, fr: `${p[1]} — {core}`, ar: `${p[2]} — {core}` }, vals); return rec('Position', 'p' + i, { title: t, label: t, obs_node_id: fns[i % fns.length].id, status: ['Published', 'Validated', 'Published', 'Published', 'To develop', 'Validated'][i], version_no: 1 + (i % 3) }); });
  positions.forEach((p, i) => rec('PositionCompetencyTarget', 'pct' + i, { position_id: p, competency_id: comps[i % comps.length], target_level: 2 + (i % 3), label: tr('Target level') }));
  const emps = Array.from({ length: o.seg === 'SME' ? 10 : 16 }, (_, i) => rec('Employee', 'e' + i, { label: { en: person(r, i), fr: '', ar: '' }, hris_employee_number: `EMP-${String(1000 + i)}`, position_id: positions[i % positions.length], obs_node_id: fns[i % fns.length].id, hire_date: daysAgo(200 + i * 90).slice(0, 10) }));
  for (const e of emps) { const d = JSON.parse(one(`SELECT data FROM records WHERE id=?`, e).data); d.label.fr = d.label.ar = d.label.en; run(`UPDATE records SET data=? WHERE id=?`, S(d), e); }
  rec('CareerPath', 'cp1', { label: fillT({ en: 'Operator → Supervisor ({core})', fr: 'Opérateur → Encadrant ({core})', ar: 'عامل ← مؤطر ({core})' }, vals), position_sequence: [positions[0], positions[1], positions[2]] });
  rec('CareerPath', 'cp2', { label: tr('Technician → Data analyst'), position_sequence: [positions[5], positions[4]] });
  const vendors = [['Atlas Formation Conseil', 4.2], ['Maghreb Learning Partners', 3.8]].map((x, i) => rec('Vendor', 'v' + i, { legal_name: x[0], label: { en: x[0], fr: x[0], ar: x[0] }, accreditation_valid_until: daysAgo(-200 - i * 100).slice(0, 10), performance_score: x[1] }));
  rec('KnowledgeItem', 'k1', { label: fillT({ en: 'Troubleshooting guide — {core}', fr: 'Guide de dépannage — {core}', ar: 'دليل معالجة الأعطال — {core}' }, vals), origin: 'ExpertCapture', indexed_for_retrieval: true, author_user_id: o.users[0].id });
  rec('KnowledgeItem', 'k2', { label: tr('Peer tips: first week with the new tool'), origin: 'UGC', indexed_for_retrieval: true, author_user_id: o.users[0].id });
  for (const [k, code, name, cred] of [['i1', 'INT-HR-01', 'HRIS / HCM', 'vault://hris'], ['i2', 'INT-SUR-01', 'Survey platform', 'vault://survey'], ['i3', 'INT-SSO-01', 'SSO (Microsoft Entra ID)', null]])
    rec('ExternalIntegration', k, { label: { en: name, fr: name, ar: name }, integration_code: code, credential_ref: cred, enabled: true, last_health_status: cred ? 'Success' : 'Auth failure', field_map: { employee_id: 'matricule' } });
  rec('Webhook', 'w1', { name: 'Teams channel — L&D alerts', url: '', events: ['alerts'], enabled: false });
  rec('CustomKpi', 'ck1', { name: fillT({ en: 'Share of {core} supervisors certified', fr: 'Part des encadrants {core} certifiés', ar: 'نسبة مؤطري {core} المعتمدين' }, vals), formula: tr('Certified supervisors / supervisors x 100'), target: 90, unit: '%', owner: 'Head of L&D', process_tag: 'MP-14.3' });
  rec('CustomKpi', 'ck2', { name: tr('Average days from demand to session'), formula: tr('Mean days between demand validation and first session'), target: 45, unit: 'days', owner: 'L&D Planner', process_tag: 'MP-46.11' });
  for (const [k, e2e] of [['b1', 'E2E-03'], ['b2', 'E2E-32'], ['b3', 'E2E-33']]) rec('BpmnDiagram', k, { title: cat.get('e2e', e2e).name, description: cat.get('e2e', e2e).goal, e2e_id: e2e, obs_node: fns[3].id, xml: bpmnXml(cat.get('e2e', e2e), o.lang) }, null, true);
  for (const [k, title, body] of kbArticles(o, vals)) rec('KbArticle', k, { title, body, standard: o.v.standards[0], process_tag: 'MP-14' });
  for (const u of cat.list('aiUseCase').filter(x => x.isCustom)) rec('AIUseCase', u.id, { ...u, code: u.id, isCustom: true }, null, true);
  if (o.seg === 'SME') rec('OnboardingPlan', 'onb', { name: tr('SME onboarding — 30 days'), start: daysAgo(40).slice(0, 10), target_days: 30, status: 'Go-live done',
    steps: ['Provisioning', 'Track configuration', 'Data import', 'Validation', 'User training', 'Go-live'].map((s, i) => ({ step: tr(s), done: true, day: [1, 3, 8, 12, 20, 28][i] })),
    imports: [{ file: 'employees.csv', accepted: 10, rejected: 1, reason: 'missing position' }], metrics: { timeToValueDays: 26, dataQuality: 96, adoption: 82, satisfaction: 4.4 } });

  seedPersonas(o);
  // ---- Two full runs per organization
  for (const focus of ['Digital', 'AI']) seedProject(o, focus, { comps, positions, emps, vendors, fns, vals, r });
  // Organization-level RACSI matrix for every user-facing task of the runs (one Accountable each).
  const ufts = new Set(all(`SELECT DISTINCT uft_id FROM task_instances WHERE org_id=?`, o.id).map(x => x.uft_id));
  for (const uid of ufts) {
    const u = cat.get('uft', uid); const aid = U(`racsi:${o.id}:${uid}`);
    run(`INSERT INTO racsi_activities(id,org_id,project_id,ref_type,ref_id,name,process_tag,created_at) VALUES(?,?,?,?,?,?,?,?)`, aid, o.id, null, 'uft', uid, S(u.name), u.steps[0], daysAgo(300));
    for (const L of ['R', 'A', 'C', 'S', 'I']) run(`INSERT INTO racsi_assignments(id,activity_id,letter,assignee,user_id) VALUES(?,?,?,?,?)`, U(`ra:${aid}:${L}`), aid, L, u.racsi[L], o.users.find(x => x.roleNames.includes(u.racsi[L]))?.id ?? null);
  }
  computeAlerts(o.id);
  seedOrg110(o);
  const head = o.users.find(u => u.role === 'R-03');
  for (const a of all(`SELECT id FROM alerts WHERE org_id=? ORDER BY created_at LIMIT 12`, o.id)) run(`INSERT OR IGNORE INTO alert_reads(alert_id,user_id,read_at,dismissed) VALUES(?,?,?,0)`, a.id, head.id, daysAgo(2));
}

function levelFor(o, focus) {
  if (isComplete(o)) return 7; // complete examples have run their whole lifecycle
  const base = o.seg === 'LARGE' ? (focus === 'Digital' ? 4 : 3) : (focus === 'Digital' ? 3 : 2);
  return Math.min(6, base + (o.vi % 3 === 0 ? 1 : o.vi % 3 === 1 ? 0 : -1) + (o.v.id === 'AEC' || o.v.id === 'HCPR' ? 1 : 0));
}

function seedProject(o, focus, ctx) {
  const pid = U(`project:${o.id}:${focus}`); const r = rng('p:' + pid); const lvl = Math.max(1, levelFor(o, focus));
  const fl = cat.get('focusLabel', focus).label; const start = daysAgo((lvl - 1) * 28 + 12);
  const nm = fillT({ en: `${fl.en} Skills Full Run 2026 — {org}`, fr: `Déroulé complet compétences ${fl.fr} 2026 — {org}`, ar: `المسار الكامل لكفاءات ${fl.ar} 2026 — {org}` }, ctx.vals);
  const desc = fillT({ en: `Training engineering cycle focused on ${fl.en} skills for {sector}: scope, evidence, diagnosis, report, delivery, evaluation and continuous improvement.`,
    fr: `Cycle d'ingénierie de formation centré sur les compétences ${fl.fr} pour le secteur {sector} : périmètre, preuves, diagnostic, rapport, déploiement, évaluation et amélioration continue.`,
    ar: `دورة هندسة التكوين المتمحورة حول كفاءات ${fl.ar} لقطاع {sector}: النطاق والأدلة والتشخيص والتقرير والتنفيذ والتقييم والتحسين المستمر.` }, ctx.vals);
  const mode = o.seg === 'SME' ? 'SME' : 'Full';
  const track = mode === 'SME' ? (cat.get('verticalSeed', o.v.id).sme.employees <= 10 ? 'SME-T1' : cat.get('verticalSeed', o.v.id).sme.employees <= 50 ? 'SME-T2' : 'SME-T3') : null;
  const complexity = mode === 'SME' ? { 'SME-T1': 28, 'SME-T2': 47, 'SME-T3': 66 }[track] : 72 + (o.vi % 5) * 4;
  run(`INSERT INTO projects(id,org_id,name,description,focus,segment,mode,track,vertical_id,plan_year,status,template_id,creation_mode,complexity,progress,start_date,obs_function,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?,?,?)`,
    pid, o.id, S(nm), S(desc), focus, o.seg, mode, track, o.v.id, 2026, 'Active', U(o.universal ? `tpl:universal:${mode}:${focus}` : `tpl:${o.v.id}:${mode}:${focus}`), 'catalog', complexity, start, ctx.fns[0].id, o.users[0].id, start, start);
  const project = one(`SELECT * FROM projects WHERE id=?`, pid);
  const phases = processPlan({ mode, track, vertical: o.v.id });
  instantiateProject(project, { phases, users: o.users, seedRng: r, ids: U, level: lvl, startDate: start });
  // Gates of each phase with their checklists (Section 4.35).
  for (const ph of phases) {
    if (!ph.gate) continue; const g = cat.get('gateSeed', ph.gate);
    const items = g.checklists.flatMap(cid => cat.get('checklistSeedUniversal', cid).items).map((it, k) => ({ ...it, done: ph.no < lvl || (ph.no === lvl && k % 2 === 0) }));
    const decided = ph.no < lvl;
    insertRecord(U(`gate:${pid}:${ph.no}`), 'PhaseChecklist', o.id, pid, ph.gate, { phase: ph.no, gate_id: U('gatedef:' + ph.gate), gate_name: g.name, checklist_id: g.checklists[0], items, mandatory: true, enforce: true,
      state: decided ? 'Signed off' : 'Open', decision: decided ? 'Go' : null, decision_comment: decided ? tr('All mandatory items met; evidence attached.') : null, decided_by: decided ? o.users.find(u => u.role === 'R-02').id : null, decided_at: decided ? addDays(start, ph.no * 28) : null }, null, false);
  }
  const vcl = cat.get('checklistSeed', 'CL-' + o.v.id);
  if (vcl) insertRecord(U(`vchk:${pid}`), 'PhaseChecklist', o.id, pid, vcl.id, { phase: 5, gate_id: null, checklist_id: vcl.id, items: vcl.data.items.map((i, k) => ({ ...i, done: lvl > 5 || k === 0 })), mandatory: false, enforce: false, state: 'Open' }, null, false);
  if (mode === 'SME') { const c = cat.get('checklistSeedUniversal', 'CL-SME'); insertRecord(U(`smechk:${pid}`), 'PhaseChecklist', o.id, pid, 'CL-SME', { phase: 1, gate_id: null, checklist_id: 'CL-SME', items: c.items.map(i => ({ ...i, done: true })), mandatory: false, enforce: false, state: 'Signed off' }, null, false); }
  insertRecord(U(`cs:${pid}`), 'ComplexityScore', o.id, pid, null, { values: { impact: 4, novelty: focus === 'AI' ? 5 : 3, regulatory: 4, investment: mode === 'SME' ? 2 : 4, scope: mode === 'SME' ? 2 : 5, uncertainty: 3, ttm: 3 }, score: complexity, recommended_track: track, chosen_track: track }, null, false);
  refreshProgress(pid);
  seedBusinessObjects(o, project, focus, lvl, ctx);
  seedKpis(o, project, lvl);
  seedActivity(o, project, lvl);
  const doneE = e2e => one(`SELECT status FROM e2e_instances WHERE project_id=? AND e2e_id=?`, pid, e2e)?.status === 'Completed';
  seedTraining(o, project, focus, lvl, { done: doneE });
  seedDocuments(o, project, { done: doneE });
}

function seedBusinessObjects(o, p, focus, lvl, ctx) {
  const r = rng('bo:' + p.id); const pid = p.id; const users = o.users;
  const rec = (entity, key, data) => { const id = U(`${entity}:${pid}:${key}`); insertRecord(id, entity, o.id, pid, key, data, users[0].id, false); return id; };
  const themesML = focus === 'AI' ? o.v.themes.ai : o.v.themes.digital;
  const pool = cat.get('themePool', focus === 'AI' ? 'ai' : 'digital').items;
  const themes = [...themesML, ...pool.slice(0, 3)];
  const done = e2e => { const x = one(`SELECT status FROM e2e_instances WHERE project_id=? AND e2e_id=?`, pid, e2e); return x?.status === 'Completed'; };
  const started = e2e => { const x = one(`SELECT status FROM e2e_instances WHERE project_id=? AND e2e_id=?`, pid, e2e); return x && x.status !== 'Not started'; };
  const nStake = o.seg === 'SME' ? 12 : 40;
  rec('StrategicObjective', 'so1', { code: 'SO-1', statement: fillT({ en: `Adopt ${themesML[0].en} across {core} by end 2027`, fr: `Adopter ${themesML[0].fr} dans {core} d'ici fin 2027`, ar: `اعتماد ${themesML[0].ar} في {core} قبل نهاية 2027` }, ctx.vals), label: tr('SO-1'), horizon_date: '2027-12-31' });
  rec('StrategicObjective', 'so2', { code: 'SO-2', statement: fillT({ en: 'Zero major findings in {standard} audits', fr: 'Zéro écart majeur aux audits {standard}', ar: 'صفر ملاحظة كبرى في تدقيقات {standard}' }, ctx.vals), label: tr('SO-2'), horizon_date: '2026-12-31' });
  const sow = rec('ScopeOfWork', 'sow', { label: fillT({ en: `Scope of Work — ${p.focus} — {org}`, fr: `Périmètre — ${p.focus} — {org}`, ar: `نطاق العمل — ${p.focus} — {org}` }, ctx.vals), group_scope: false, organization_selected: [o.id], sector: o.v.id,
    decision_levels: LV, focus: p.focus, custom_criteria: [], approval_status: done('E2E-32') ? 'Approved' : started('E2E-32') ? 'Validated' : 'Draft', approved_by: done('E2E-32') ? users.find(u => u.role === 'R-02').id : null, approved_on: done('E2E-32') ? addDays(p.start_date, 20) : null, version_no: 1 });
  ctx.fns.forEach((f, i) => LV.forEach((l, j) => { if ((i + j) % 4 === 3) return; rec('ScopeCriterion', `crit${i}${j}`, { sow_id: sow, criterion_type: 'Function x Level', criterion_value: f.name, label: fillT({ en: `${f.name.en} × ${l}`, fr: `${f.name.fr} × ${l}`, ar: `${f.name.ar} × ${l}` }, {}), decision_level: l, function_id: f.id, is_custom: false, weight: 1 }); }));
  rec('ScopeCriterion', 'custom', { sow_id: sow, criterion_type: 'Custom', criterion_value: themesML[0].en, label: { en: `Readiness for ${themesML[0].en}`, fr: `Préparation à ${themesML[0].fr}`, ar: `الجاهزية لـ ${themesML[0].ar}` }, is_custom: true, weight: 2 });
  const roles = ['Function head', 'Manager', 'Supervisor', 'Operator', 'Technician', 'Analyst'];
  // Respondents: the General Manager, the management (MS / MO) and team members (OP); about two thirds have a mobile number.
  const stakes = Array.from({ length: nStake }, (_, i) => { const nm = person(r, i); const lvlS = i === 0 ? 'MS' : LV[i % 3]; const role = i === 0 ? 'General Manager' : roles[i % roles.length];
    const population = i === 0 ? 'DG' : lvlS === 'OP' ? 'Member' : 'Management';
    return rec('Stakeholder', 's' + i, { name: nm, label: { en: nm, fr: nm, ar: nm }, email: `${slug(nm)}${i}@${o.domain}`, phone: i % 4 === 3 ? null : `06${String(10000000 + Math.floor(r() * 89999999)).slice(0, 8)}`, role, role_t: tr(role), population, function_id: i === 0 ? ctx.fns[0].id : ctx.fns[i % ctx.fns.length].id, decision_level: lvlS,
      preferred_channel: population === 'DG' ? 'Face-to-Face' : population === 'Management' ? 'Combination' : (i % 3 === 2 ? 'Email' : 'WhatsApp'), consent_status: done('E2E-33') || i % 5 ? 'Given' : 'Unknown', last_contacted_on: daysAgo(10 + (i % 9)) }); });
  seedQuestionnaires(o, p, focus, lvl, ctx, { sow, stakes, done, started, themesML, users });
  const skAs = []; ctx.emps.slice(0, 12).forEach((e, i) => skAs.push(rec('SkillAssessment', 'sa' + i, { employee_id: e, competency_id: ctx.comps[i % 3 + (focus === 'AI' ? 3 : 0)], self_level: 1 + (i % 3), validated_level: 1 + (i % 3), campaign_close_date: addDays(p.start_date, 40).slice(0, 10), label: tr('Skills campaign 2026') })));
  const gaps = ctx.emps.slice(0, 8).map((e, i) => rec('SkillGap', 'g' + i, { employee_id: e, competency_id: ctx.comps[i % 3 + (focus === 'AI' ? 3 : 0)], competency: themes[i % 3], gap_value: 1 + (i % 3), is_critical: i % 3 === 2, label: themes[i % 3] }));
  const themeIds = themes.slice(0, 6).map((t, i) => rec('TrainingTheme', 't' + i, { name: t, label: t, priority_rank: i + 1, days_per_group: [3, 2, 2.5, 1.5, 1, 2][i], group_count: o.seg === 'SME' ? 1 + (i % 2) : [6, 4, 3, 3, 2, 2][i], impact_score: 5 - (i % 3), urgency: 4 - (i % 2), trainer: i % 2 ? 'Vendor A' : 'Internal', budget: (o.seg === 'SME' ? 8000 : 60000) * (6 - i) }));
  const src = ['Gap', 'Demand', 'Diagnostic', 'GPEC', 'SWOT'];
  for (let i = 0; i < 10; i++) rec('TrainingNeed', 'n' + i, { source: src[i % 5], theme_id: themeIds[i % 6], theme: themes[i % 6], title: themes[i % 6], label: themes[i % 6], impact_score: 3 + (i % 3), validation_status: done('E2E-03') || i < 6 ? 'Validated' : 'Draft' });
  for (let i = 0; i < 15; i++) rec('TrainingDemand', 'd' + i, { demand_type: i % 4 === 0 ? 'Collective' : 'Individual', requester_employee_id: ctx.emps[i % ctx.emps.length], competency_id: ctx.comps[i % ctx.comps.length], theme: themes[i % 6], label: themes[i % 6], priority: ['High', 'Medium', 'Low'][i % 3], status: done('E2E-27') ? ['Validated', 'Planned', 'Rejected', 'Validated'][i % 4] : 'Submitted' });
  const ter = rec('TrainingEngineeringReport', 'ter', { label: fillT({ en: 'Training Engineering Report — {org}', fr: "Rapport d'ingénierie de formation — {org}", ar: 'تقرير هندسة التكوين — {org}' }, ctx.vals), project_id: pid, status: done('E2E-03') ? 'Published' : started('E2E-03') ? 'In Review' : 'Draft', version_no: done('E2E-03') ? 2 : 1, ai_generated_sections: 4 });
  const rm = rec('Roadmap', 'rm', { label: tr('Training roadmap 2026-2027'), report_id: ter, approval_status: done('E2E-03') ? 'Approved' : 'Draft', approved_on: done('E2E-03') ? addDays(p.start_date, 80).slice(0, 10) : null });
  themeIds.slice(0, 4).forEach((t, i) => rec('RoadmapInitiative', 'ri' + i, { roadmap_id: rm, theme_id: t, label: themes[i], phase: 1 + (i % 3) }));
  const budget = themes.slice(0, 6).map((t, i) => { const a = (o.seg === 'SME' ? 8000 : 60000) * (6 - i); const spent = lvl > 4 ? 0.9 : lvl > 3 ? 0.55 : 0.2;
    return rec('BudgetLine', 'b' + i, { label: t, allocated_amount: a, planned_amount: a, committed_amount: Math.round(a * Math.min(1, spent + 0.2)), actual_amount: Math.round(a * spent * (0.9 + r() * 0.25)), refund_forecast: Math.round(a * 0.28) }); });
  rec('TrainingPlan', 'plan', { label: tr('Prioritized Training Plan 2026'), plan_year: 2026, status: done('E2E-30') ? 'Locked' : started('E2E-30') ? 'In Review' : 'Draft', total_budget: (o.seg === 'SME' ? 8000 : 60000) * 21, total_days: 12, realization_rate: lvl > 4 ? 78 : lvl > 3 ? 35 : 0 });
  const paths = themeIds.slice(0, 2).map((t, i) => rec('LearningPath', 'lp' + i, { label: themes[i], theme_id: t, total_days: [3, 2][i] }));
  const mods = [0, 1, 2, 3].map(i => rec('LearningModule', 'm' + i, { label: { en: `M${i + 1} ${themes[i % 2].en}`, fr: `M${i + 1} ${themes[i % 2].fr}`, ar: `M${i + 1} ${themes[i % 2].ar}` }, path_id: paths[i % 2], modality: ['E-learning', 'Classroom', 'Virtual', 'Classroom'][i], duration_hours: [2, 7, 3.5, 7][i], design_status: done('E2E-04') || i < 2 ? 'Approved' : 'Draft' }));
  [0, 1, 2, 3].forEach(i => rec('ContentAsset', 'ca' + i, { label: { en: `M${i + 1} material`, fr: `Support M${i + 1}`, ar: `وسيلة M${i + 1}` }, format: ['SCORM', 'Video', 'PDF', 'Capsule'][i], file_size_mb: [42, 180, 3.2, 12][i], review_date: daysAgo(-300 + i * 120).slice(0, 10), status: i === 3 && lvl < 4 ? 'Draft' : 'Published', language: ['en', 'fr', 'ar', 'fr'][i] }));
  const sess = [0, 1, 2, 3].map(i => rec('Session', 'se' + i, { label: { en: `S-0${i + 1} ${themes[i % 2].en}`, fr: `S-0${i + 1} ${themes[i % 2].fr}`, ar: `S-0${i + 1} ${themes[i % 2].ar}` }, module_id: mods[i], start_at: addDays(p.start_date, 100 + i * 7), capacity: 12, trainer_user_id: users.find(u => u.role === 'R-11')?.id }));
  const enr = ctx.emps.slice(0, 12).map((e, i) => rec('Enrollment', 'en' + i, { label: tr('Enrollment'), employee_id: e, session_id: sess[i % 4], attendance_status: lvl > 4 ? (i % 9 ? 'Present' : 'Absent') : null, completion_status: lvl > 4 ? (i % 9 ? 'Completed' : 'Not started') : 'Not started', completed_at: lvl > 4 ? addDays(p.start_date, 110) : null }));
  enr.slice(0, 6).forEach((e, i) => rec('Evaluation', 'ev' + i, { label: tr(`Kirkpatrick level ${1 + (i % 3)}`), enrollment_id: e, level: 1 + (i % 3), score_pct: 70 + Math.round(r() * 25) }));
  ctx.emps.slice(0, 6).forEach((e, i) => rec('Certification', 'ce' + i, { label: { en: `${o.v.standards[0]} awareness`, fr: `Sensibilisation ${o.v.standards[0]}`, ar: `التوعية بـ ${o.v.standards[0]}` }, employee_id: e, requirement_code: o.v.standards[0], valid_until: daysAgo(-400 + i * 90).slice(0, 10), status: ['Valid', 'Valid', 'Expiring', 'Valid', 'Expired', 'Valid'][i] }));
  rec('RegulatorySubmission', 'rs', { label: tr('OFPPT special training contracts file'), regulator: o.v.id === 'FNB' ? 'GIAC-Agro' : 'OFPPT', deadline: addDays(p.start_date, 120).slice(0, 10), status: done('E2E-23') ? 'Approved' : started('E2E-23') ? 'Submitted' : 'Draft' });
  ctx.fns.forEach((f, i) => LV.forEach((l, j) => { const sc = 58 + Math.round(r() * 40) - (focus === 'AI' ? 6 : 0); rec('PerformanceAssessment', `pa${i}${j}`, { label: { en: `${f.name.en} — ${l}`, fr: `${f.name.fr} — ${l}`, ar: `${f.name.ar} — ${l}` }, function_name: f.name, obs_node_id: f.id, level: l, score_pct: sc, rag: sc >= 90 ? 'Green' : sc >= 70 ? 'Amber' : 'Red', gap_comment: themes[(i + j) % 3] }); }));
  const swots = ctx.fns.slice(0, 2).map((f, i) => rec('FunctionalSwot', 'sw' + i, { label: f.name, function_name: f.name, obs_node_id: f.id, status: done('E2E-29') ? 'Validated' : 'Draft',
    strengths: tr('Experienced team; stable processes'), weaknesses: { en: `Low use of ${themes[0].en}`, fr: `Faible usage de ${themes[0].fr}`, ar: `ضعف استعمال ${themes[0].ar}` }, opportunities: themes[2], threats: { en: `Stricter ${o.v.standards[0]} audits`, fr: `Audits ${o.v.standards[0]} plus stricts`, ar: `تدقيقات ${o.v.standards[0]} أكثر صرامة` } }));
  [0, 1, 2, 3].forEach(i => rec('ImprovementAxis', 'ax' + i, { label: themes[i], swot_id: swots[i % 2], priority_rank: i + 1, implementation_pct: lvl > 5 ? 60 + i * 5 : lvl > 3 ? 20 + i * 5 : 0 }));
  rec('IntelligenceReport', 'ir', { label: fillT({ en: '{sector} competitive intelligence 2026', fr: 'Veille concurrentielle {sector} 2026', ar: 'اليقظة التنافسية لقطاع {sector} 2026' }, ctx.vals), scope_statement: fillT({ en: '{sector} market, Morocco and export, 3-year horizon', fr: 'Marché {sector}, Maroc et export, horizon 3 ans', ar: 'سوق {sector} بالمغرب والتصدير، أفق 3 سنوات' }, ctx.vals), published_on: done('E2E-24') ? addDays(p.start_date, 25).slice(0, 10) : null, last_updated_on: daysAgo(5).slice(0, 10) });
  rec('DiagnosticAssessment', 'da', { label: tr('Five-axis diagnostic'), axis_scores: { strategy: 3.4, organization: 2.8, processes: 2.6, people: 3.1, is: focus === 'AI' ? 2.0 : 2.2 }, findings_status: done('E2E-20') ? 'Validated' : 'Draft' });
  rec('MaturityAssessment', 'mcmm', { label: tr('CMM maturity'), model: 'CMM', overall_level: 2 + (o.seg === 'LARGE' ? 1 : 0), target_level: 3 + (o.seg === 'LARGE' ? 1 : 0) });
  rec('MaturityAssessment', 'mld', { label: tr('Leadership maturity'), model: 'Leadership', overall_level: 3, target_level: 4 });
  rec('ConsultingEngagement', 'eng', { label: fillT({ en: 'Training engineering engagement — {org}', fr: "Mission d'ingénierie de formation — {org}", ar: 'مهمة هندسة التكوين — {org}' }, ctx.vals), po_reference: `PO-CL-${100 + (ctx.fns.length * 7) % 900}`, kickoff_date: p.start_date.slice(0, 10), closure_date: lvl >= 6 ? addDays(p.start_date, 170).slice(0, 10) : null, client_acceptance: lvl >= 6 });
  rec('InternalOpportunity', 'op', { label: { en: `Team leader — ${o.v.coreFunction.name.en}`, fr: `Chef d'équipe — ${o.v.coreFunction.name.fr}`, ar: `رئيس فريق — ${o.v.coreFunction.name.ar}` }, position_id: ctx.positions[1], status: lvl >= 6 ? 'Filled' : 'Shortlisting', filled_internally: lvl >= 6 });
  ctx.emps.slice(0, 2).forEach((e, i) => rec('DevelopmentPlan', 'idp' + i, { label: tr('Individual development plan'), employee_id: e, progress_pct: lvl >= 6 ? 70 : 20 + i * 10 }));
  rec('CoachingEngagement', 'coach', { label: tr('One-to-One coaching'), coach_user_id: users.find(u => u.role === 'R-11')?.id, outcome_rating: 4 });
  rec('OnboardingRecord', 'onb', { label: tr('Onboarding — new technician'), employee_id: ctx.emps[ctx.emps.length - 1], start_date: addDays(p.start_date, 60).slice(0, 10), productive_date: lvl >= 6 ? addDays(p.start_date, 134).slice(0, 10) : null });
  ctx.emps.slice(0, 3).forEach((e, i) => rec('GamificationAward', 'aw' + i, { label: { en: `Badge ${themes[0].en}`, fr: `Badge ${themes[0].fr}`, ar: `شارة ${themes[0].ar}` }, employee_id: e, points: 40 + i * 20 }));
  const po = rec('PurchaseOrder', 'po', { label: { en: `PO — ${themes[0].en}`, fr: `BC — ${themes[0].fr}`, ar: `سند طلب — ${themes[0].ar}` }, vendor_id: ctx.vendors[0], budget_line_id: budget[0], amount: o.seg === 'SME' ? 24000 : 180000 });
  rec('Invoice', 'inv', { label: tr('Invoice INV-2026-118'), po_id: po, amount: o.seg === 'SME' ? 24000 : 180000, match_status: lvl > 4 ? 'Matched' : 'Unmatched' });
  const own = users.find(u => u.role === 'R-19') || users[1]; const ev = users.find(u => u.role === 'R-21') || users[2];
  const act = rec('Action', 'a1', { label: tr('Contract a second training vendor'), owner_user_id: own.id, evaluator_user_id: ev.id, due_date: addDays(p.start_date, 60).slice(0, 10), status: lvl > 3 ? 'Done' : 'In progress' });
  rec('Action', 'a2', { label: tr('Update 11 outdated position descriptions'), owner_user_id: (users.find(u => u.role === 'R-16') || users[1]).id, evaluator_user_id: users.find(u => u.role === 'R-02').id, due_date: addDays(p.start_date, 90).slice(0, 10), status: 'Open' });
  if (lvl > 3) rec('ActionEvaluation', 'ae1', { label: tr('Effectiveness check'), action_id: act, effectiveness: 'Effective' });
  const rexTitle = { en: `REX — ${themes[0].en}`, fr: `REX — ${themes[0].fr}`, ar: `العائد من التجربة — ${themes[0].ar}` };
  insertRecord(U(`RexEntry:${pid}`), 'RexEntry', o.id, pid, 'rex', { title: rexTitle, category: tr(['Stakeholder engagement', 'Planning', 'Vendor management'][ctx.fns.length % 3]),
    what_went_well: tr('The stakeholder register and multi-channel distribution lifted the response rate.'), what_did_not: tr('SWOT inputs arrived late from one function.'), root_cause: tr('No backup nominated for the function head.'),
    recommendation: tr('Name a backup for every function head at kickoff.'), rating: 3 + (lvl % 3), process_tag: 'MP-54' }, users[0].id, true);
  const phaseDates = [0, 1, 2].map(i => addDays(p.start_date, i * 28));
  ['Scope & evidence', 'Diagnosis', 'Report & plan'].forEach((n, i) => rec('WbsNode', 'w' + i, { name: tr(n), start: phaseDates[i].slice(0, 10), end: addDays(phaseDates[i], 27).slice(0, 10), percent: i + 1 < lvl ? 100 : i + 1 === lvl ? 50 : 0, predecessors: i ? [U(`WbsNode:${pid}:w${i - 1}`)] : [], sort: i }));
}

function seedKpis(o, p, lvl) {
  const r = rng('kpi:' + p.id);
  for (const k of cat.list('kpi')) {
    const target = k.targetValue ?? 80; const dir = k.direction;
    for (let m = 5; m >= 0; m--) {
      const d = new Date(NOW.getFullYear(), NOW.getMonth() - m, 1); const per = d.toISOString().slice(0, 7);
      const progressFactor = Math.min(1.08, 0.55 + (lvl / 7) * 0.45 + (5 - m) * 0.04 + (r() - 0.5) * 0.12);
      let v = dir === 'down' ? target * (1.9 - progressFactor) : target * progressFactor;
      if (target <= 1) v = Math.round(v * 100) / 100; else v = Math.round(v * 10) / 10;
      run(`INSERT INTO kpi_values(id,org_id,project_id,kpi_id,period,value,target,direction,status) VALUES(?,?,?,?,?,?,?,?,?)`, U(`kv:${p.id}:${k.id}:${per}`), o.id, p.id, k.id, per, v, target, dir, ragOf(v, target, dir));
    }
  }
}

function seedActivity(o, p, lvl) {
  const tasks = all(`SELECT t.id, t.uft_id, t.status, t.owner_id, t.completed_at, t.started_at, t.ai_used FROM task_instances t WHERE t.project_id=?`, p.id);
  const outcomes = ['Accepted', 'Accepted', 'Edited', 'Accepted', 'Rejected'];
  let i = 0;
  run(`INSERT INTO audit_log(id,org_id,user_id,entity,entity_id,action,before_val,after_val,justification,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`, U(`aud:${p.id}:create`), o.id, o.users[0].id, 'Project', p.id, 'create', null, S({ creation_mode: 'catalog', template_id: p.template_id, complexity: p.complexity, track: p.track }), null, p.created_at);
  for (const t of tasks) {
    if (t.status === 'Completed') {
      run(`INSERT INTO audit_log(id,org_id,user_id,entity,entity_id,action,before_val,after_val,justification,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`, U(`aud:${t.id}`), o.id, t.owner_id, 'Task', t.id, 'status', S({ status: 'In progress' }), S({ status: 'Completed' }), null, t.completed_at);
      if (t.ai_used) { const uc = cat.list('aiUseCase').find(u => cat.get('uft', t.uft_id).steps.includes(u.step));
        if (uc) run(`INSERT INTO ai_usage_log(id,org_id,project_id,use_case_id,record_ref,user_id,outcome,source,confidence,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`, U(`ai:${t.id}`), o.id, p.id, uc.id, t.id, t.owner_id, outcomes[i++ % 5], 'built-in', 0.7, t.completed_at); }
    }
  }
  // Attachments in several formats on the first completed tasks (metadata; small files written to the tenant folder).
  const dir = path.join(config.attachmentDir, o.id); fs.mkdirSync(dir, { recursive: true });
  const files = [['Scope_of_Work.pdf', 'application/pdf', 84211], ['Stakeholder_register.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 23140], ['Kickoff_minutes.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 31544],
    ['Org_chart.png', 'image/png', 120334], ['Responses_export.csv', 'text/csv', 5120], ['Process_E2E-03.bpmn', 'application/xml', 9800], ['Site_scan.step', 'application/step', 402112], ['Steering_committee.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 1802223]];
  tasks.filter(t => t.status === 'Completed').slice(0, files.length).forEach((t, k) => {
    const [name, mime, size] = files[k]; const aid = U(`att:${t.id}:${k}`);
    if (mime === 'text/csv') fs.writeFileSync(path.join(dir, aid), 'stakeholder,channel,consent\nS-01,Email,Given\nS-02,Face-to-Face,Given\n');
    run(`INSERT INTO attachments(id,org_id,owner_type,owner_id,filename,mime,size,path,author_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`, aid, o.id, 'task', t.id, name, mime, size, aid, t.owner_id, t.completed_at);
  });
  for (const [cat_, key] of [['approvals', 'notify.approvalPending'], ['tasks', 'notify.taskAssigned']]) {
    const did = U(`disp:${p.id}:${cat_}`); const u = o.users.find(x => x.role === 'R-03');
    run(`INSERT INTO dispatches(id,org_id,user_id,category,subject,body,lang,created_at) VALUES(?,?,?,?,?,?,?,?)`, did, o.id, u.id, cat_, tx(key, o.lang), tx(key, o.lang), o.lang, daysAgo(3));
    for (const ch of ['inapp', 'email']) run(`INSERT INTO delivery_status(id,dispatch_id,channel,status,attempts,updated_at) VALUES(?,?,?,?,1,?)`, U(`ds:${did}:${ch}`), did, ch, ch === 'inapp' ? 'delivered' : 'sent', daysAgo(3));
  }
}

function kbArticles(o, vals) {
  const s = o.v.standards;
  return [
    ['kb1', { en: `${s[0]} — training and competence requirements`, fr: `${s[0]} — exigences de formation et de compétence`, ar: `${s[0]} — متطلبات التكوين والكفاءة` }, fillT({ en: `What ${s[0]} expects: competence determined per role, training records kept, effectiveness evaluated. In {org}, map every {core} position to its ${s[0]} obligations and keep certificates valid.`, fr: `Ce qu'attend ${s[0]} : compétence définie par rôle, enregistrements de formation conservés, efficacité évaluée. Chez {org}, reliez chaque poste {core} à ses obligations ${s[0]} et gardez les certificats valides.`, ar: `ما يتطلبه ${s[0]}: تحديد الكفاءة لكل دور وحفظ سجلات التكوين وتقييم الفعالية. في {org}، اربط كل منصب في {core} بالتزاماته وفق ${s[0]} وحافظ على صلاحية الشهادات.` }, vals)],
    ['kb2', { en: `${s[1] || s[0]} — practitioner notes`, fr: `${s[1] || s[0]} — notes pratiques`, ar: `${s[1] || s[0]} — ملاحظات تطبيقية` }, fillT({ en: 'Keep evidence at step level: attendance sheets, results and the manager observation at day 30. Review evidence before each gate.', fr: "Conservez les preuves au niveau de l'étape : feuilles de présence, résultats et observation du manager à J+30. Revoyez les preuves avant chaque jalon.", ar: 'احفظ الأدلة على مستوى الخطوة: أوراق الحضور والنتائج وملاحظة المسؤول بعد 30 يوماً. راجع الأدلة قبل كل بوابة.' }, vals)],
    ['kb3', tr('GPEC — Forward Planning of Jobs and Skills'), T(['GPEC anticipates future needs through four elements: jobs, skills, gaps and actions. It links HR strategy to training engineering.', "La GPEC anticipe les besoins futurs à travers quatre éléments : emplois, compétences, écarts et actions. Elle relie la stratégie RH à l'ingénierie de formation.", 'يستبق التدبير التوقعي للوظائف والكفاءات الحاجيات المستقبلية عبر أربعة عناصر: الوظائف والكفاءات والفجوات والإجراءات، ويربط استراتيجية الموارد البشرية بهندسة التكوين.'])],
    ['kb4', tr('Law 09-08 — personal data in questionnaires'), T(['Collect consent before storing a response, state the purpose, and keep responses only for the retention period set in data governance.', "Recueillez le consentement avant de stocker une réponse, indiquez la finalité et ne conservez les réponses que pendant la durée fixée dans la gouvernance des données.", 'اجمع الموافقة قبل تخزين أي رد، وحدد الغاية، ولا تحتفظ بالردود إلا طيلة المدة المحددة في حكامة البيانات.'])],
  ];
}

/** BPMN 2.0 XML with diagram interchange for one end-to-end process (start event, tasks, end event). */
export function bpmnXml(e, lang = 'en') {
  const ufts = e.ufts.map(id => cat.get('uft', id)); const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  // Snake layout: PER tasks per row, alternating direction, so the diagram fits a normal screen.
  const W = 170, H = 80, GX = 60, GY = 70, PER = 4, X0 = 140, Y0 = 60;
  const shapes = [], flows = [], di = [];
  const pos = i => { const r = Math.floor(i / PER), c = i % PER, col = r % 2 ? PER - 1 - c : c; return { x: X0 + col * (W + GX), y: Y0 + r * (H + GY), r }; };
  const mid = p => ({ x: p.x + W / 2, y: p.y + H / 2 });
  shapes.push(`<bpmn:startEvent id="start" name="${esc(pick(e.trigger, lang)).slice(0, 60)}"><bpmn:outgoing>f0</bpmn:outgoing></bpmn:startEvent>`);
  di.push(`<bpmndi:BPMNShape id="start_di" bpmnElement="start"><dc:Bounds x="60" y="${Y0 + 22}" width="36" height="36"/></bpmndi:BPMNShape>`);
  let prev = 'start', prevPt = { x: 96, y: Y0 + 40 }, prevPos = null;
  ufts.forEach((u, i) => {
    const id = 'T' + (i + 1), p = pos(i);
    shapes.push(`<bpmn:userTask id="${id}" name="${esc(u.id + ' ' + pick(u.name, lang))}"><bpmn:incoming>f${i}</bpmn:incoming><bpmn:outgoing>f${i + 1}</bpmn:outgoing></bpmn:userTask>`);
    flows.push(`<bpmn:sequenceFlow id="f${i}" sourceRef="${prev}" targetRef="${id}"/>`);
    di.push(`<bpmndi:BPMNShape id="${id}_di" bpmnElement="${id}"><dc:Bounds x="${p.x}" y="${p.y}" width="${W}" height="${H}"/></bpmndi:BPMNShape>`);
    let wps;
    if (!prevPos) wps = [prevPt, { x: p.x, y: p.y + H / 2 }];
    else if (prevPos.r !== p.r) wps = [{ x: mid(prevPos).x, y: prevPos.y + H }, { x: mid(p).x, y: p.y }];
    else if (p.x > prevPos.x) wps = [{ x: prevPos.x + W, y: p.y + H / 2 }, { x: p.x, y: p.y + H / 2 }];
    else wps = [{ x: prevPos.x, y: p.y + H / 2 }, { x: p.x + W, y: p.y + H / 2 }];
    di.push(`<bpmndi:BPMNEdge id="f${i}_di" bpmnElement="f${i}">${wps.map(w => `<di:waypoint x="${w.x}" y="${w.y}"/>`).join('')}</bpmndi:BPMNEdge>`);
    prev = id; prevPos = p;
  });
  const n = ufts.length, last = prevPos || { x: 60, y: Y0, r: 0 };
  const endX = last.r % 2 ? last.x - GX - 36 + (GX / 2) : last.x + W + GX / 2, endY = last.y + H / 2 - 18;
  shapes.push(`<bpmn:endEvent id="end" name="${esc(pick(e.terminal, lang)).slice(0, 60)}"><bpmn:incoming>f${n}</bpmn:incoming></bpmn:endEvent>`);
  flows.push(`<bpmn:sequenceFlow id="f${n}" sourceRef="${prev}" targetRef="end"/>`);
  di.push(`<bpmndi:BPMNShape id="end_di" bpmnElement="end"><dc:Bounds x="${endX}" y="${endY}" width="36" height="36"/></bpmndi:BPMNShape>`);
  const ew = last.r % 2 ? [{ x: last.x, y: last.y + H / 2 }, { x: endX + 36, y: last.y + H / 2 }] : [{ x: last.x + W, y: last.y + H / 2 }, { x: endX, y: last.y + H / 2 }];
  di.push(`<bpmndi:BPMNEdge id="f${n}_di" bpmnElement="f${n}">${ew.map(w => `<di:waypoint x="${w.x}" y="${w.y}"/>`).join('')}</bpmndi:BPMNEdge>`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Defs_${e.id}" targetNamespace="https://cortexskills.app/bpmn">
<bpmn:process id="P_${e.id.replace(/-/g, '_')}" name="${esc(e.id + ' ' + pick(e.name, lang))}" isExecutable="false">${shapes.join('')}${flows.join('')}</bpmn:process>
<bpmndi:BPMNDiagram id="D_${e.id}"><bpmndi:BPMNPlane id="PL_${e.id}" bpmnElement="P_${e.id.replace(/-/g, '_')}">${di.join('')}</bpmndi:BPMNPlane></bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}
