// Release 1.10 seed: documented-information library, OBS roles and assignments, typed step records with
// trilingual rows and their register entries for every run, a published process-design release, an audit
// programme with graded findings, an organization blueprint, prompt specifications and generated documents.
import { run, one, all } from '../src/db.js';
import { S, J, detUuid as U, now, pick, addDays, rng } from '../src/lib/util.js';
import * as cat from '../src/catalog.js';
import { insertRecord } from '../src/services/projects.js';
import { seedLibrary } from '../src/services/docengine.js';
import * as E from '../src/services/docengine.js';
import { describeStep, registerOf } from '../src/services/stepforms.js';
import * as D from '../src/services/design.js';
import * as P from '../src/services/prompts.js';
import * as B from '../src/services/blueprints.js';
import { recordVersion } from '../src/audit.js';

const L = (en, fr, ar) => ({ en, fr, ar });
const DAY = 86400000;
const iso = t => new Date(t).toISOString();

/** Platform template library (org_id NULL): one template per E2E deliverable plus the TER, plan, audit and master list. */
export function seedDocLibrary() {
  let n = 0;
  for (const t of seedLibrary()) { insertRecord(U('doctpl:' + t.code), 'DocumentTemplate', null, null, t.code, t); n++; }
  // Controlled lists shared by every organization (FR-DA-DEU-02).
  const lists = [['category', L('Category', 'Catégorie', 'الفئة'), [L('Primary', 'Principal', 'رئيسي'), L('Secondary', 'Secondaire', 'ثانوي'), L('Supporting', 'Support', 'داعم')]],
    ['channel', L('Channel', 'Canal', 'القناة'), ['E-mail', 'WhatsApp', 'Application', 'Meeting', 'Intranet', 'Letter'].map(x => L(x, x === 'Meeting' ? 'Réunion' : x === 'Letter' ? 'Courrier' : x, x))],
    ['modality', L('Modality', 'Modalité', 'النمط'), [L('On site', 'Présentiel', 'حضوري'), L('Remote', 'À distance', 'عن بعد'), L('Blended', 'Mixte', 'مدمج')]]];
  for (const [field, name, values] of lists) insertRecord(U('choice:' + field), 'ChoiceList', null, null, field, { field, name, values });
  return n;
}

/* ------------------------------------------------------------------------------------ content pools */
const SOURCES = [L('HRIS export', 'Export du SIRH', 'تصدير نظام معلومات الموارد البشرية'), L('Interview with the function head', 'Entretien avec le responsable de fonction', 'مقابلة مع رئيس الوظيفة'), L('Questionnaire results', 'Résultats du questionnaire', 'نتائج الاستبيان'), L('Annual performance review', 'Entretiens annuels d’évaluation', 'المقابلات السنوية للتقييم'), L('Audit report', 'Rapport d’audit', 'تقرير التدقيق')];
const FACTS = [L('Raised by three managers in the interviews; linked to the yearly objective.', 'Cité par trois managers en entretien ; lié à l’objectif annuel.', 'أثاره ثلاثة مسؤولين في المقابلات؛ مرتبط بالهدف السنوي.'),
  L('Gap confirmed by the assessment: 40 % of staff below level 2.', 'Écart confirmé par l’évaluation : 40 % du personnel sous le niveau 2.', 'فجوة أكدها التقييم: 40٪ من العاملين دون المستوى 2.'),
  L('Required by the standard and the latest audit.', 'Exigé par la norme et le dernier audit.', 'يفرضه المعيار وآخر تدقيق.')];
const MSGS = [L('Why the program matters, who is concerned and how to enrol.', 'Pourquoi le programme compte, qui est concerné et comment s’inscrire.', 'لماذا يهم البرنامج ومن المعني وكيفية التسجيل.'),
  L('Session dates, venue and what to prepare.', 'Dates des sessions, lieu et ce qu’il faut préparer.', 'تواريخ الدورات والمكان وما يجب تحضيره.'),
  L('Results of the evaluation and next steps.', 'Résultats de l’évaluation et prochaines étapes.', 'نتائج التقييم والخطوات القادمة.')];
const SETTINGS = [[L('Reminder cadence', 'Fréquence des relances', 'تواتر التذكير'), L('Every 5 days, three reminders', 'Tous les 5 jours, trois relances', 'كل 5 أيام، ثلاثة تذكيرات'), L('Communication plan', 'Plan de communication', 'خطة التواصل')],
  [L('Completeness threshold', 'Seuil de complétude', 'عتبة الاكتمال'), L('70 %', '70 %', '70٪'), L('Data quality rule', 'Règle de qualité des données', 'قاعدة جودة البيانات')],
  [L('Approval route', 'Circuit d’approbation', 'مسار الاعتماد'), L('Head of L&D, then HR Director', 'Responsable formation, puis DRH', 'مسؤول التكوين ثم مدير الموارد البشرية'), L('Delegation of authority', 'Délégation de pouvoirs', 'تفويض الصلاحيات')]];
const OBJ = [L('Raise {t} proficiency of {p} teams to level 3', 'Porter la maîtrise de {t} des équipes {p} au niveau 3', 'رفع إتقان {t} لدى فرق {p} إلى المستوى 3'),
  L('Certify {p} staff on {t}', 'Certifier le personnel {p} sur {t}', 'اعتماد عاملي {p} في {t}'),
  L('Cut onboarding time on {t} by 30 %', 'Réduire de 30 % le temps de prise en main de {t}', 'تقليص مدة التمكن من {t} بنسبة 30٪')];
const fillL = (tpl, vals) => Object.fromEntries(['en', 'fr', 'ar'].map(l => [l, tpl[l].replace(/\{(\w)\}/g, (m, k) => pick(vals[k], l) || '')]));
const DEC = [L('Approved after review of the evidence and budget.', 'Approuvé après revue des preuves et du budget.', 'تمت الموافقة بعد مراجعة الأدلة والميزانية.'), L('Conditions met; risks accepted by the sponsor.', 'Conditions remplies ; risques acceptés par le sponsor.', 'الشروط مستوفاة؛ قبل الراعي المخاطر.')];
const FINDINGS = [L('Records complete and traceable; two minor corrections on dates.', 'Enregistrements complets et traçables ; deux corrections mineures de dates.', 'سجلات كاملة وقابلة للتتبع؛ تصحيحان طفيفان في التواريخ.'), L('Evidence matches the plan; owners confirmed.', 'Les preuves correspondent au plan ; responsables confirmés.', 'الأدلة مطابقة للخطة؛ تم تأكيد المسؤولين.')];

/** Values of one row for a step form, drawn from the organization's own context (themes, positions, people). */
function rowFor(kind, i, ctx, r, base) {
  const th = ctx.themes[i % ctx.themes.length]; const pos = ctx.positions[i % ctx.positions.length]; const user = ctx.users[(i + base) % ctx.users.length];
  const d = k => iso(ctx.start + (base * 2 + i * 7 + k) * DAY).slice(0, 10);
  switch (kind) {
    case 'record': return { item: i % 3 === 2 ? pos : th, category: ['Primary', 'Secondary', 'Supporting'][i % 3], description: FACTS[(i + base) % FACTS.length], owner: user, source: SOURCES[(i + base) % SOURCES.length] };
    case 'matrix': return { item: th, criterion: ['Business impact', 'Urgency', 'Feasibility', 'Cost', 'Risk'][(i + base) % 5], weight: String([40, 30, 20, 10][i % 4]), score: String(2 + Math.floor(r() * 4)), facts: FACTS[i % FACTS.length] };
    case 'objectives': return { item: fillL(OBJ[i % OBJ.length], { t: th, p: pos }), indicator: ctx.kpis[(i + base) % ctx.kpis.length], baseline: `${30 + Math.round(r() * 20)} %`, target: `${70 + Math.round(r() * 20)} %`, deadline: d(180), owner: user };
    case 'plan': return { item: fillL(L('Deliver the module: {t}', 'Déployer le module : {t}', 'تنفيذ الوحدة: {t}'), { t: th }), owner: user, start: d(10), end: d(40), budget: String(20000 + Math.round(r() * 60) * 1000), deliverable: L('Attendance sheets, evaluations and certificates', 'Feuilles de présence, évaluations et attestations', 'أوراق الحضور والتقييمات والشهادات') };
    case 'communication': return { item: fillL(L('Announce the program: {t}', 'Annoncer le programme : {t}', 'الإعلان عن البرنامج: {t}'), { t: th }), audience: fillL(L('{p} teams and their managers', 'Équipes {p} et leurs managers', 'فرق {p} ومسؤولوها'), { p: pos }), channel: ['E-mail', 'WhatsApp', 'Meeting', 'Intranet'][i % 4], message: MSGS[i % MSGS.length], date: d(5) };
    case 'training': return { session: fillL(L('{t} — half-day workshop', '{t} — atelier d’une demi-journée', '{t} — ورشة نصف يوم'), { t: th }), date: d(20), trainer: ctx.trainers[i % ctx.trainers.length], participants: String(10 + Math.round(r() * 10)), hours: i % 2 ? '7' : '3.5', modality: ['On site', 'Remote', 'Blended'][i % 3] };
    case 'monitoring': { const v = 55 + Math.round(r() * 40); const tg = 80; return { indicator: ctx.kpis[(i + base) % ctx.kpis.length], period: `2026-Q${1 + ((i + base) % 3)}`, value: String(v), target: String(tg), status: v >= tg ? 'Green' : v >= tg - 15 ? 'Amber' : 'Red', reason: v >= tg ? L('On track', 'Dans la cible', 'ضمن الهدف') : L('Sessions postponed by the peak season', 'Sessions reportées par la haute saison', 'تأجيل الدورات بسبب ذروة النشاط') }; }
    case 'assignment': return { role: ctx.roles[(i + base) % ctx.roles.length], item: th, person: user, allocation: String([100, 50, 30][i % 3]), start: d(0), holderType: ['Holder', 'Deputy', 'Holder'][i % 3] };
    case 'configuration': { const s = SETTINGS[(i + base) % SETTINGS.length]; return { setting: s[0], value: s[1], reference: s[2] }; }
    case 'decision': return { decision: i % 5 === 4 ? 'Approved with conditions' : 'Approved', subject: ctx.object, rationale: DEC[i % DEC.length], conditions: i % 5 === 4 ? L('Review the budget after the first quarter.', 'Revoir le budget après le premier trimestre.', 'مراجعة الميزانية بعد الفصل الأول.') : '', date: d(3), decidedBy: ctx.approver };
    case 'review': return { scope: ctx.object, findings: FINDINGS[i % FINDINGS.length], conclusion: i % 4 === 3 ? 'Minor corrections' : 'Conforming', followUp: L('Check the corrections at the next steering meeting.', 'Vérifier les corrections au prochain comité de pilotage.', 'التحقق من التصحيحات في اجتماع القيادة القادم.'), date: d(4) };
    default: return {};
  }
}

/* ------------------------------------------------------------------------------------- per organization */
export function seedOrg110(o) {
  const r = rng('r110:' + o.id); const t0 = Date.now(); const head = o.users.find(u => u.role === 'R-03') || o.users[0]; const hrd = o.users.find(u => u.role === 'R-02') || o.users[1];
  const req = (u = head) => ({ orgId: o.id, user: { id: u.id, name: u.name, is_platform: 0 }, lang: o.lang || 'en', ip: '127.0.0.1', headers: {}, query: {}, body: {}, projectId: null });
  // ---- OBS roles: one per standard role held in the organization, linked to a function, with its holder.
  const fns = all(`SELECT id, name FROM obs_nodes WHERE org_id=? AND type='Function'`, o.id).map(x => ({ id: x.id, name: J(x.name, {}) }));
  const roles = []; const tm = now();
  for (const [i, u] of o.users.entries()) {
    const role = one(`SELECT name FROM roles WHERE id=?`, u.role); const name = J(role.name, {}); const rid = U(`obsrole:${o.id}:${u.role}`); const fn = fns[i % fns.length];
    const mission = L(`Owns the ${name.en} activities of the training engineering cycle.`, `Porte les activités « ${name.fr} » du cycle d’ingénierie de formation.`, `يتولى أنشطة «${name.ar}» في دورة هندسة التكوين.`);
    run(`INSERT INTO obs_roles(id,org_id,node_id,code,name,mission,functions,reports_to,status,version,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,?,'Active',1,?,?)`, rid, o.id, fn.id, 'OR-' + u.role.slice(2), S(name), S(mission), S([fn.id]), u.role === 'R-02' ? null : U(`obsrole:${o.id}:R-02`), u.id, tm);
    run(`INSERT INTO obs_assignments(id,org_id,role_id,user_id,start_date,end_date,allocation,holder_type,version,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,?,1,?,?)`, U(`obsas:${rid}`), o.id, rid, u.id, iso(t0 - 300 * DAY).slice(0, 10), null, u.role === 'R-03' ? 100 : 80, 'Holder', head.id, tm);
    roles.push({ id: rid, name });
  }
  { const rid = U(`obsrole:${o.id}:DPO`); run(`INSERT INTO obs_roles(id,org_id,node_id,code,name,mission,functions,status,version,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,'Active',1,?,?)`, rid, o.id, fns[0].id, 'OR-DPO', S(L('Data protection officer', 'Délégué à la protection des données', 'مسؤول حماية المعطيات')), S(L('Ensures personal data of learners and respondents is protected.', 'Veille à la protection des données personnelles des apprenants et répondants.', 'يضمن حماية المعطيات الشخصية للمتعلمين والمجيبين.')), S([fns[0].id]), head.id, tm); }
  if (o.users.length > 4) run(`INSERT INTO obs_assignments(id,org_id,role_id,user_id,start_date,allocation,holder_type,version,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,1,?,?)`, U(`obsas:dep:${o.id}`), o.id, U(`obsrole:${o.id}:R-03`), o.users[3].id, iso(t0 - 90 * DAY).slice(0, 10), 20, 'Deputy', head.id, tm);
  // Role-based RACSI for the first macro processes (exactly one Accountable each).
  for (const mp of ['MP-01', 'MP-14']) for (const s of cat.list('step').filter(x => x.mp === mp)) {
    const aid = U(`racsistep:${o.id}:${s.id}`); run(`INSERT OR IGNORE INTO racsi_activities(id,org_id,project_id,ref_type,ref_id,name,process_tag,created_at) VALUES(?,?,?,?,?,?,?,?)`, aid, o.id, null, 'step', s.id, S(s.name), s.id, tm);
    const pairs = [['R', `role:${U(`obsrole:${o.id}:R-04`)}`], ['A', `role:${U(`obsrole:${o.id}:R-03`)}`], ['C', `role:${U(`obsrole:${o.id}:R-02`)}`], ['I', `role:${U(`obsrole:${o.id}:R-18`)}`]];
    for (const [l, a] of pairs) if (one(`SELECT id FROM obs_roles WHERE id=?`, a.slice(5))) run(`INSERT OR IGNORE INTO racsi_assignments(id,activity_id,letter,assignee,user_id) VALUES(?,?,?,?,?)`, U(`rsa:${aid}:${l}`), aid, l, a, null);
  }
  // ---- Process design: one organization change and a published release (submitted by one person, published by another).
  try {
    D.save(req(), 'step', 'MP-01.1', { name: L('Record the corporate strategic objectives', 'Enregistrer les objectifs stratégiques de l’entreprise', 'تسجيل الأهداف الاستراتيجية للمؤسسة') }, { note: 'Clearer object', acceptWarnings: true });
    const rel = D.createRelease(req(), { name: '2026 baseline', note: 'Design used by the 2026 runs' });
    D.transitionRelease(req(), rel.id, 'submit'); D.transitionRelease(req(hrd), rel.id, 'publish', 'Reviewed with the process owners');
    run(`UPDATE projects SET design_release_id=? WHERE org_id=?`, rel.id, o.id);
  } catch (e) { console.warn('  design seed', o.id, e.message); }
  // ---- Prompt specifications for every AI Use Case of the organization (seeded from each step).
  for (const uc of all(`SELECT id FROM records WHERE entity='AIUseCase' AND org_id=?`, o.id)) { try { P.getSpec(o.id, uc.id); } catch { /* use case without a step */ } }
  // ---- Runs: step records, rows, registers, audits, documents.
  for (const p of all(`SELECT * FROM projects WHERE org_id=? ORDER BY focus`, o.id)) seedRun(o, p, { roles, head, hrd, r, req });
  // ---- One organization template with a customized blueprint (Large organizations).
  if (o.seg === 'LARGE') {
    try {
      const lib = one(`SELECT id FROM records WHERE id=?`, U(o.universal ? 'tpl:universal:Full:AI' : `tpl:${o.v.id}:Full:AI`));
      if (lib) {
        const pr = { ...req(), user: { ...req().user, is_platform: 0 } };
        const dup = B.duplicate(pr, lib.id); const tpl = B.tree(o.id, dup.id, 'en');
        const e2e = tpl.tree.find(ph => ph.children.length)?.children[0];
        if (e2e?.children[1]) B.setElement(pr, dup.id, e2e.children[1].ref, { name: L('Validate the plan with the executive committee', 'Valider le plan avec le comité de direction', 'المصادقة على الخطة مع لجنة الإدارة') });
        if (e2e?.children[2]) B.setElement(pr, dup.id, e2e.children[2].ref, { included: false });
        B.addCustom(pr, dup.id, { kind: 'step', parent: e2e.children[0].ref, name: L('Record the board minutes', 'Enregistrer le procès-verbal du conseil', 'تسجيل محضر المجلس') });
        B.saveRow(pr, dup.id, 'reporting', { name: L('Monthly steering pack', 'Dossier de pilotage mensuel', 'ملف القيادة الشهري'), audience: L('Executive committee', 'Comité de direction', 'لجنة الإدارة'), frequency: 'Monthly', format: 'PDF', owner: 'Head of L&D' });
        B.setStatus(pr, dup.id, 'Published');
      }
    } catch (e) { console.warn('  blueprint seed', o.id, e.message); }
  }
}

function seedRun(o, p, { roles, head, hrd, r, req }) {
  const lang = o.lang || 'en'; const tm = now();
  const ctx = { themes: [...(o.v.themes?.[p.focus === 'AI' ? 'ai' : 'digital'] || []), ...(o.v.themes?.[p.focus === 'AI' ? 'digital' : 'ai'] || []).slice(0, 1)],
    positions: all(`SELECT data FROM records WHERE entity='Position' AND org_id=? LIMIT 6`, o.id).map(x => J(x.data, {}).title).filter(Boolean),
    users: o.users.map(u => u.name), trainers: ['Atlas Formation Conseil', 'Maghreb Learning Partners', o.users[0]?.name], kpis: cat.list('kpi').slice(0, 20).map(k => k.id),
    roles: roles.map(x => x.name), approver: hrd.name, start: new Date(p.start_date).getTime(), object: null };
  if (!ctx.positions.length) ctx.positions = [L('Supervisor', 'Encadrant', 'مؤطر')];
  const tasks = all(`SELECT * FROM task_instances WHERE project_id=? AND status!='Not started' ORDER BY e2e_id, sort`, p.id);
  let base = 0;
  for (const t of tasks) {
    const u = cat.get('uft', t.uft_id); const done = new Map(J(t.steps, []).map(s => [s.id, s.done]));
    const stepsDone = []; base++;
    for (const sid of u.steps || []) {
      const st = cat.get('step', sid); if (!st) continue;
      const isDone = t.status === 'Completed' || done.get(sid); const isNext = !isDone && t.status === 'In progress' && !stepsDone.includes('next');
      if (!isDone && !isNext) continue; if (isNext) stepsDone.push('next');
      const d = describeStep(st, { mpName: cat.get('mp', st.mp)?.name }); ctx.object = d.object;
      const recId = U(`sr:${t.id}:${sid}`); const at = t.completed_at || t.started_at || tm;
      const kind = d.kind; const single = d.pattern === 'form' || d.pattern === 'sectioned';
      const fields = single ? rowFor(kind, base % 5, ctx, r, base) : {};
      run(`INSERT OR IGNORE INTO step_records(id,org_id,project_id,task_instance_id,step_id,kind,fields,status,completed_by,completed_at,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
        recId, o.id, p.id, t.id, sid, kind, S(fields), isDone ? 'Completed' : 'Open', isDone ? t.owner_id : null, isDone ? at : null, t.owner_id, at);
      if (kind === 'system') continue;
      const items = single ? [{ id: recId, data: fields }] : Array.from({ length: isDone ? (kind === 'matrix' || kind === 'objectives' ? 3 : 2) : 1 }, (_, i) => {
        const id = U(`row:${recId}:${i}`); const data = rowFor(kind, i, ctx, r, base);
        run(`INSERT OR IGNORE INTO step_rows(id,step_record_id,org_id,project_id,step_id,sort,data,origin,created_by,created_at,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`, id, recId, o.id, p.id, sid, i, S(data), i === 2 && kind === 'matrix' ? 'ai' : 'manual', t.owner_id, at, t.owner_id, at);
        return { id, data }; });
      if (!isDone || !d.register) continue;
      for (const it of items) {
        const nm = pick(it.data.item ?? it.data.subject ?? it.data.session ?? it.data.indicator ?? it.data.setting ?? it.data.scope ?? it.data.role, 'en');
        const key = String(nm || it.id).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80);
        run(`INSERT OR IGNORE INTO register_entries(id,org_id,project_id,register,register_name,item_key,data,source_row_id,source_task_id,source_step_id,version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,1,?,?)`,
          U(`reg:${p.id}:${d.register.key}:${key}`), o.id, p.id, d.register.key, S(d.register.name), key, S(it.data), it.id, t.id, sid, at, at);
      }
    }
  }
  // A record link between the first objective and the first training session (FR-DA-LNK).
  const a = one(`SELECT id FROM register_entries WHERE project_id=? AND register='objectives' LIMIT 1`, p.id); const b = one(`SELECT id FROM register_entries WHERE project_id=? AND register IN ('communications','assignments','decisions') LIMIT 1`, p.id);
  if (a && b) run(`INSERT OR IGNORE INTO record_links(id,org_id,from_type,from_id,to_type,to_id,label,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?)`, U(`lnk:${p.id}`), o.id, 'register', a.id, 'register', b.id, 'achieved by', head.id, tm);

  // ---- Audit programme with graded findings (FR-DA-AFP).
  const std = o.v.standards?.[0] || 'ISO 9001'; const ap = U(`audit:${p.id}`); const planned = new Date(Math.min(Date.parse(addDays(p.start_date, 60)), Date.now() - 7 * DAY)).toISOString().slice(0, 10); const performed = planned;
  const team = [{ name: o.users.find(u => u.role === 'R-29')?.name || head.name, qualification: L('Lead auditor ISO 19011', 'Auditeur principal ISO 19011', 'مدقق رئيسي ISO 19011').en }, { name: o.users.find(u => u.role === 'R-21')?.name || hrd.name, qualification: 'Internal auditor' }];
  const nextOf = d => { if (!d) return null; const x = new Date(d); x.setDate(x.getDate() + 365); return x.toISOString().slice(0, 10); };
  insertRecord(ap, 'AuditProgram', o.id, p.id, `AUD-${p.focus === 'AI' ? 'AI' : 'DG'}-2026`, { code: `AUD-${p.focus === 'AI' ? 'AI' : 'DG'}-2026`, name: L(`Internal audit of the training process — ${p.focus}`, `Audit interne du processus formation — ${p.focus === 'AI' ? 'IA' : 'Digital'}`, `تدقيق داخلي لمسار التكوين — ${p.focus === 'AI' ? 'الذكاء الاصطناعي' : 'الرقمي'}`),
    kind: 'Internal audit', standard: std, objectives: L('Verify that training needs, plans and evaluations meet the standard and the organization’s rules.', 'Vérifier que besoins, plans et évaluations de formation respectent la norme et les règles de l’organisation.', 'التحقق من مطابقة الحاجيات والخطط وتقييمات التكوين للمعيار ولقواعد المؤسسة.'),
    criteria: L(`${std} clauses 7.1.6, 7.2 and 9.1; internal L&D procedure`, `${std} clauses 7.1.6, 7.2 et 9.1 ; procédure formation interne`, `${std} البنود 7.1.6 و7.2 و9.1؛ مسطرة التكوين الداخلية`), scope: L('Training engineering cycle of the 2026 run, all sites.', 'Cycle d’ingénierie de formation du déroulé 2026, tous sites.', 'دورة هندسة التكوين لمسار 2026، جميع المواقع.'),
    processes: ['E2E-01', 'E2E-03', 'E2E-05', 'E2E-07'], duration_days: 2, lead_auditor: team[0].name, team, frequency: 'Annual', frequency_justification: L('Annual: medium risk and two minor findings last year.', 'Annuelle : risque moyen et deux constats mineurs l’an dernier.', 'سنوي: مخاطر متوسطة وملاحظتان صغيرتان العام الماضي.'),
    planned_date: planned, performed_date: performed, next_date: nextOf(performed || planned), status: performed ? 'Reported' : 'Planned',
    summary: L('The process is in place and mostly effective; evidence of competence is the main weakness.', 'Le processus est en place et globalement efficace ; la preuve des compétences est la principale faiblesse.', 'المسار قائم وفعال إجمالًا؛ إثبات الكفاءة هو أبرز نقطة ضعف.'),
    strengths: L('Clear needs analysis; strong management involvement; complete attendance records.', 'Analyse des besoins claire ; forte implication du management ; feuilles de présence complètes.', 'تحليل واضح للحاجيات؛ انخراط قوي للإدارة؛ أوراق حضور كاملة.'),
    conclusion: L('Conforming with one minor nonconformity to correct within 60 days.', 'Conforme avec une non-conformité mineure à corriger sous 60 jours.', 'مطابق مع عدم مطابقة صغرى يجب تصحيحها خلال 60 يومًا.'), follow_up: L('Verification of the corrective action at the next steering committee.', 'Vérification de l’action corrective au prochain comité de pilotage.', 'التحقق من الإجراء التصحيحي في لجنة القيادة القادمة.') }, head.id, true);
  if (performed) {
    const F = [['Minor', '7.2', L('Two trainers have no evidence of competence on file.', 'Deux formateurs n’ont pas de preuve de compétence au dossier.', 'لا يوجد في ملف مكونين اثنين ما يثبت الكفاءة.'), L('Trainer files of the AI workshops.', 'Dossiers formateurs des ateliers IA.', 'ملفات مكوني ورشات الذكاء الاصطناعي.'), L('No check of trainer qualification at contract time.', 'Pas de vérification de la qualification à la contractualisation.', 'غياب التحقق من التأهيل عند التعاقد.'), L('Collect the certificates of both trainers.', 'Recueillir les attestations des deux formateurs.', 'جمع شهادات المكونين.'), L('Add the qualification check to the vendor contract procedure.', 'Ajouter la vérification de qualification à la procédure de contractualisation.', 'إضافة التحقق من التأهيل إلى مسطرة التعاقد.')],
      ['Observation', '9.1', L('Level 3 evaluations are planned but not yet scheduled.', 'Les évaluations de niveau 3 sont prévues mais pas encore planifiées.', 'تقييمات المستوى 3 مخططة لكنها غير مبرمجة بعد.'), L('Evaluation plan 2026.', 'Plan d’évaluation 2026.', 'خطة التقييم 2026.')],
      ['Improvement', '7.1.6', L('Capture lessons learned at the end of each session.', 'Capitaliser les retours d’expérience à la fin de chaque session.', 'رسملة الدروس المستفادة في نهاية كل دورة.'), L('REX register.', 'Registre REX.', 'سجل الدروس المستفادة.')],
      ['Strength', '7.2', L('Needs analysis fully traced from strategic objectives.', 'Analyse des besoins entièrement tracée depuis les objectifs stratégiques.', 'تحليل الحاجيات متتبع بالكامل من الأهداف الاستراتيجية.'), L('Needs register and objectives.', 'Registre des besoins et objectifs.', 'سجل الحاجيات والأهداف.')]];
    F.forEach(([grade, clause, statement, evidence, root, correction, corrective], i) => insertRecord(U(`fnd:${ap}:${i}`), 'AuditFinding', o.id, p.id, `F-${i + 1}`, { audit_id: ap, code: `F-${i + 1}`, grade, requirement: std, clause, statement, evidence, process: 'E2E-05', auditee: hrd.name,
      root_cause: root || null, correction: correction || null, corrective_action: corrective || null, action_owner: grade === 'Minor' ? head.name : null, due: grade === 'Minor' ? addDays(performed, 60).slice(0, 10) : null, status: grade === 'Minor' ? 'Action planned' : 'Closed' }, head.id, true));
  }
  // ---- Generated documents: the report, the plan, the audit report, the master list and the deliverables of completed processes.
  const doneE2e = new Set(all(`SELECT e2e_id FROM e2e_instances WHERE project_id=? AND status='Completed'`, p.id).map(x => x.e2e_id));
  const codes = o.universal ? E.templates(o.id).map(x => x.code) : ['DT-TER', 'DT-PLAN', ...(performed ? ['DT-AUDIT'] : []), ...[...doneE2e].slice(0, 3).map(e => 'DT-' + e).filter(c => E.template(o.id, c)), 'DT-MASTER'];
  const langs = o.universal ? ['en', 'fr', 'ar'] : [lang];
  for (const code of codes) for (const l of langs) {
    if (code === 'DT-MASTER' && codes.indexOf(code) !== codes.length - 1) continue;
    try { genDoc(o, p, code, l, { head, hrd, req, publish: code !== 'DT-PLAN' || o.universal }); } catch (e) { console.warn('  doc', code, e.message); }
  }
}

/** Generates a document like the API does (draft → in review → published by a second person). */
function genDoc(o, p, code, lang, { head, hrd, req, publish }) {
  const tpl = E.template(o.id, code); if (!tpl) return;
  const r0 = { ...req(head), lang }; const ctx = { req: r0, orgId: o.id, projectId: p.id, lang, rel: p.design_release_id };
  const model = E.generate(ctx, { tpl, meta: { version: 1, status: 'Draft', author: head.name } });
  const id = U(`doc:${p.id}:${code}:${lang}`); const tm = now();
  const blocking = model.findings.some(f => f.blocking); const pub = publish && !blocking;
  run(`INSERT OR IGNORE INTO documents(id,org_id,project_id,doc_type,version,minor,status,lang,title,data_as_of,model,sources,findings,author_id,approver_id,owner_id,change_note,template_id,template_version,overrides,formatting,e2e_id,review_frequency,next_review,retention,classification,created_at,updated_at,published_at) VALUES(?,?,?,?,1,0,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    id, o.id, p.id, tpl.code, pub ? 'Published' : 'Draft', lang, model.title, model.dataAsOf, S({ ...model, defs: tpl.sections }), S(model.sources), S(model.findings), head.id, pub ? hrd.id : null, head.id, 'Generated from the run data', tpl.id, tpl.version, '{}', '{}', (tpl.e2e || [])[0] || null,
    'Annual', addDays(tm, 365).slice(0, 10), '5 years', lang === 'fr' ? 'Confidentiel — usage interne' : lang === 'ar' ? 'سري — للاستعمال الداخلي' : 'Confidential — internal use', tm, tm, pub ? tm : null);
}
void recordVersion; void registerOf;
