// Runs the private-clinic simple case for real through the API (no direct writes): a project created from the
// clinic's simple-path template, then every task and step of its six processes — scope of work, questionnaire
// campaign (templates, questions, AI questions validated, RACSI, channels, respondents, distribution, reminders,
// responses submitted from the respondents' own links, completeness, dataset, report), diagnostic, plan, delivery
// and evaluation — and the gates between phases. What was typed and what the application produced is written to
// clinic-case.json for the French user guide (build-clinic-guide-fr.cjs).
// Usage (server running on :4000, from tools/docs): node --no-warnings run-clinic-case.mjs [baseUrl]
import fs from 'node:fs';
const BASE = (process.argv[2] || 'http://localhost:4000') + '/api';
const S = '../../server/';
process.chdir(new URL(S, import.meta.url).pathname);
const { one, all } = await import(S + 'src/db.js');
const cat = await import(S + 'src/catalog.js');
const { answersFor } = await import(S + 'seed/questionnaire-answers.js');
const { rowFor } = await import(S + 'seed/release110.js');
const { rng, pick } = await import(S + 'src/lib/util.js');
const fr = v => (v && typeof v === 'object' && !Array.isArray(v) ? pick(v, 'fr') : v);
let token = null;
async function api(method, path, body) {
  const res = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const txt = await res.text(); let data; try { data = JSON.parse(txt); } catch { data = txt; }
  if (!res.ok) { const e = new Error(`${method} ${path} → ${res.status} ${typeof data === 'object' ? JSON.stringify(data) : data}`.slice(0, 600)); e.status = res.status; e.data = data; throw e; }
  return data;
}
const PASS = 'CortexSkills#2026';
const tokens = {};
// Sessions are signed like the sign-in does (the sign-in itself is rate limited to 10 attempts per 5 minutes).
const jwt = (await import(S + 'node_modules/jsonwebtoken/index.js')).default; const { config } = await import(S + 'src/config.js');
const login = async email => { if (tokens[email]) { token = tokens[email]; return; } const u = one(`SELECT id FROM users WHERE email=?`, email); token = jwt.sign({ sub: u.id }, config.jwtSecret, { expiresIn: config.jwtTtl }); tokens[email] = token; await api('PUT', '/me/language', { language: 'fr' }); };

// ------------------------------------------------------------------ the clinic and its people
const ORG = one(`SELECT * FROM organizations WHERE email_domain='cliniquealamal.ma'`);
const HEAD = 'headld@cliniquealamal.ma', ANALYST = 'analyst@cliniquealamal.ma', HRD = 'hrd@cliniquealamal.ma', ADMIN = 'admin@cliniquealamal.ma';
const users = all(`SELECT id, name, email, title FROM users WHERE org_id=?`, ORG.id);
const U = e => users.find(u => u.email === e);
const out = { generatedAt: new Date().toISOString(), org: { id: ORG.id, name: fr(JSON.parse(ORG.name)), city: ORG.city, employees: ORG.employees, domain: ORG.email_domain, sector: ORG.sector, segment: ORG.segment },
  users: users.map(u => ({ name: u.name, email: u.email, title: u.title })), tasks: [], gates: [], questionnaire: null };
// Respondents of the campaign (fictitious people of the clinic; the guide asks to replace the e-mails and phones).
const STAKEHOLDERS = [
  ['Dr Salma Benjelloun', 'dg.salma@cliniquealamal.ma', '+212 6 61 00 00 01', 'Directrice générale', 'Opérations', 'MS', 'Email', 'Sponsor', 'Sponsor de la mission ; valide les axes prioritaires.'],
  ['Hajar Tazi', 'hrd@cliniquealamal.ma', '+212 6 61 00 00 02', 'DRH / président du comité de pilotage', 'Ressources humaines', 'MS', 'Email', 'Decision maker', 'Préside le comité de pilotage.'],
  ['Dr Youssef Alaoui', 'directeur.medical@cliniquealamal.ma', '+212 6 61 00 00 03', 'Directeur médical', 'Soins cliniques et infirmiers', 'MS', 'Combination', 'Decision maker', 'Porte le projet de triage assisté par IA.'],
  ['Nadia Berrada', 'cadre.sante@cliniquealamal.ma', '+212 6 61 00 00 04', 'Cadre de santé', 'Soins cliniques et infirmiers', 'MO', 'Combination', 'Change relay', 'Encadre 24 infirmiers ; relais du changement.'],
  ['Omar El Fassi', 'urgences@cliniquealamal.ma', '+212 6 61 00 00 05', 'Responsable des urgences', 'Soins cliniques et infirmiers', 'MO', 'WhatsApp', 'Respondent', 'Service pilote du triage IA.'],
  ['Leila Chraibi', 'qualite@cliniquealamal.ma', '+212 6 61 00 00 06', 'Responsable qualité', 'Qualité et HSE', 'MO', 'Email', 'Expert', 'Référente accréditation et gestion des risques.'],
  ['Samira Ouazzani', 'infirmiere.urgences@cliniquealamal.ma', '+212 6 61 00 00 07', 'Infirmière', 'Soins cliniques et infirmiers', 'OP', 'WhatsApp', 'Respondent', 'Infirmière d’accueil et d’orientation aux urgences.'],
  ['Rachid Amrani', 'radiologie@cliniquealamal.ma', '+212 6 61 00 00 08', 'Technicien de radiologie', 'Soins cliniques et infirmiers', 'OP', 'WhatsApp', 'Respondent', 'Utilisateur de l’aide à la lecture d’images.'],
];

// ------------------------------------------------------------------ helpers on tasks and steps
const taskRec = id => one(`SELECT * FROM task_instances WHERE id=?`, id);
async function stepsOf(tid) { return api('GET', `/tasks/${tid}/steps`); }
function snapStep(s) { return { id: s.id, name: fr(s.name), role: fr(s.role), kind: s.form.kind, kindLabel: fr(s.form.kindLabel), pattern: s.form.pattern, module: s.form.module || null,
  fields: s.form.fields.map(f => ({ key: f.key, label: fr(f.label), type: f.type, required: !!f.required, options: (f.options || []).map(o => ({ value: String(o.value), label: fr(o.label) || String(o.value) })), help: fr(f.help) || '' })) }; }
const lbl = (f, v) => { if (v == null || v === '') return ''; if (f.type === 'boolean') return v === true || v === 'true' ? 'Oui' : 'Non';
  const one1 = x => f.options?.find(o => o.value === String(x))?.label || String(x);
  if (f.type === 'multi') return String(v).split(/\s*,\s*/).filter(Boolean).map(one1).join(', ');
  if (f.type === 'date') { const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : String(v); }
  if (f.type === 'number') return String(v).replace('.', ',');
  return f.options?.length ? one1(v) : String(fr(v)); };
async function runTask(e2e, t, { fill, actor = HEAD, notes = {} } = {}) {
  await login(actor);
  const rec = { uft: t.uft_id, name: null, owner: null, guidance: null, steps: [], output: null, actor };
  const u = cat.get('uft', t.uft_id); rec.name = fr(u.name); rec.owner = fr(u.racsiT?.R) || u.racsi?.R; rec.accountable = fr(u.racsiT?.A) || u.racsi?.A; rec.input = fr(u.input); rec.outputName = fr(u.output);
  if (taskRec(t.id).status === 'Not started') await api('PATCH', `/tasks/${t.id}`, { status: 'In progress' });
  const st = await stepsOf(t.id);
  for (const s of st.steps) {
    const snap = snapStep(s); const f = fill?.[s.id];
    if (s.done) { rec.steps.push({ ...snap, skipped: true }); continue; }
    if (typeof f === 'function') { const r = await f(s, t, st); Object.assign(snap, r || {}); }
    else if (s.form.pattern === 'form' || s.form.pattern === 'sectioned') {
      const vals = f || {}; if (Object.keys(vals).length) await api('PUT', `/tasks/${t.id}/steps/${s.id}/fields`, { fields: vals });
      snap.values = s.form.fields.map(x => ({ label: fr(x.label), value: lbl(snapStep(s).fields.find(y => y.key === x.key), vals[x.key] ?? x.default ?? '') || '' }));
    } else if (s.form.pattern === 'inline' || s.form.pattern === 'master-detail') {
      const rows = f || []; for (const r of rows) await api('POST', `/tasks/${t.id}/steps/${s.id}/rows`, { data: r });
      const sf = snapStep(s); snap.rows = rows.map(r => sf.fields.map(x => lbl(x, r[x.key])));
    }
    if (s.form.kind !== 'system' || true) { try { await api('POST', `/tasks/${t.id}/steps/${s.id}/complete`, {}); snap.completed = true; } catch (e) { snap.completed = false; snap.completeError = e.data?.error || e.message; } }
    if (notes[s.id]) snap.note = notes[s.id];
    rec.steps.push(snap);
  }
  const task = await api('GET', `/tasks/${t.id}`); rec.guidance = fr(task.task.guidance); rec.output = task.summary || rec.guidance || rec.outputName;
  await api('PATCH', `/tasks/${t.id}`, { output: rec.output, status: 'Completed' });
  out.tasks.push({ e2e, ...rec });
  return rec;
}
const tasksOf = (pid, e2e) => all(`SELECT t.* FROM task_instances t JOIN e2e_instances e ON e.id=t.e2e_instance_id WHERE t.project_id=? AND e.e2e_id=? ORDER BY t.sort`, pid, e2e);


// ------------------------------------------------------------------ generic values from the clinic's own context
const frDeep = v => (v && typeof v === 'object' && !Array.isArray(v) ? ('fr' in v || 'en' in v ? pick(v, 'fr') : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, frDeep(x)]))) : v);
function clinicCtx(pid) {
  const p = one(`SELECT * FROM projects WHERE id=?`, pid); const v = cat.get('verticalSeed', ORG.sector);
  return { themes: [...(v.themes?.ai || []), ...(v.themes?.digital || []).slice(0, 1)], positions: all(`SELECT data FROM records WHERE entity='Position' AND org_id=? LIMIT 6`, ORG.id).map(x => JSON.parse(x.data).title).filter(Boolean),
    users: users.map(u => u.name), trainers: ['Atlas Formation Conseil', 'Maghreb Learning Partners', U(HEAD).name], kpis: cat.list('kpi').slice(0, 20).map(k => k.id),
    roles: all(`SELECT name FROM obs_roles WHERE org_id=?`, ORG.id).map(x => JSON.parse(x.name)), functions: all(`SELECT name FROM obs_nodes WHERE org_id=? AND type='Function' ORDER BY name`, ORG.id).map(x => JSON.parse(x.name)),
    approver: U(HRD).name, start: Date.now(), object: null };
}
let base = 0;
function genericFill(st, ctx, r) {
  const fill = {}; base++;
  for (const s of st.steps) {
    ctx.object = s.form.object; const k = s.form.kind;
    if (k === 'system' || k === 'module') continue;
    const keys = new Set(s.form.fields.map(f => f.key));
    const keep = o => Object.fromEntries(Object.entries(frDeep(o)).filter(([kk, x]) => keys.has(kk) && x !== '' && x != null).map(([kk, x]) => [kk, typeof x === 'boolean' ? x : String(x)]));
    if (s.form.pattern === 'form' || s.form.pattern === 'sectioned') fill[s.id] = keep(rowFor(k, base % 5, ctx, r, base));
    else fill[s.id] = Array.from({ length: k === 'matrix' || k === 'objectives' ? 3 : 2 }, (_, i) => { const o = keep(rowFor(k, i, ctx, r, base)); if (keys.has('currency') && o.budget) o.currency = 'MAD'; return o; });
  }
  return fill;
}
async function passGate(pid, phase, note) {
  await login(HRD);
  const recs = all(`SELECT id, data FROM records WHERE entity='PhaseChecklist' AND project_id=? AND json_extract(data,'$.phase')=?`, pid, phase);
  for (const r of recs) {
    const d = JSON.parse(r.data); if (d.decision === 'Go') continue;
    const done = (d.items || []).map(i => pick(i.text, 'en'));
    await api('PATCH', `/phase-checklists/${r.id}`, { done });
    await api('PATCH', `/phase-checklists/${r.id}`, { decision: 'Go', _justification: note });
    out.gates.push({ phase, gate: fr(d.gate_name) || d.gate_id, items: (d.items || []).map(i => fr(i.text)), decision: 'Go', justification: note, by: U(HRD).name });
  }
}

async function runAll(pid) {
  const r = rng('clinic-case'); const ctx = clinicCtx(pid);
  const group = ORG.group_id ? fr(JSON.parse(one(`SELECT name FROM groups_ WHERE id=?`, ORG.group_id)?.name || '{}')) : '';
  const fnName = n => ctx.functions.map(fr).find(x => x === n) || n;
  // ---------------- E2E-32 — scope of work
  const T32 = tasksOf(pid, 'E2E-32'); const R = (i, extra) => ({ rationale: extra, ...{} });
  const dec = (extra) => ({ rationale: extra });
  await runTask('E2E-32', T32[0], { fill: { 'MP-53.1': { group: 'Yes', groupName: group, ...dec('La clinique fait partie du groupe ; la mission ne couvre que Clinique Al Amal.') }, 'MP-53.2': { group: 'Yes', organization: ORG.id, ...dec('Mission limitée à la clinique de Marrakech (95 salariés).') } } });
  await runTask('E2E-32', T32[1], { fill: { 'MP-53.3': { sector: 'HCPR', ...dec('Établissement de soins privé : référentiels JCI et ISO 7101.') } } });
  await runTask('E2E-32', T32[2], { fill: { 'MP-53.4': { levels: 'MS, MO, OP', ...dec('La direction, les cadres et les soignants répondent au diagnostic.') } } });
  await runTask('E2E-32', T32[3], { fill: { 'MP-53.5': [
    { function: fnName('Soins cliniques et infirmiers'), ms: true, mo: true, op: true, note: 'Urgences, hospitalisation, imagerie' },
    { function: fnName('Qualité et HSE'), ms: false, mo: true, op: true, note: 'Accréditation, gestion des risques' },
    { function: fnName('Ressources humaines'), ms: true, mo: true, op: false, note: 'Plan de formation, GPEC' },
    { function: fnName("Systèmes d'information"), ms: false, mo: true, op: true, note: 'DPI, outils IA' },
    { function: fnName('Opérations'), ms: true, mo: true, op: false, note: 'Direction générale, admissions' }] } });
  await runTask('E2E-32', T32[4], { fill: { 'MP-53.6': { orientation: 'AI', ...dec('Priorité de la direction : triage et imagerie assistés par l’IA.') }, 'MP-53.7': [
    { item: 'Préparation au triage assisté par IA aux urgences', orientation: 'AI', weight: '2', description: 'Capacité des équipes d’accueil à utiliser et contrôler la proposition de tri.', owner: U(HEAD).name, source: 'Function head' },
    { item: 'Maîtrise de la protection des données de santé', orientation: 'AI', weight: '1.5', description: 'Loi 09-08 et règles de la CNDP appliquées aux outils IA.', owner: U(HEAD).name, source: 'Interview' }] } });
  await runTask('E2E-32', T32[5], { actor: ANALYST, fill: { 'MP-53.8': STAKEHOLDERS.map(([item, email, phone, role, fn, level, channel, category, description]) => ({ item, email, phone, role, function: fnName(fn), level, site: 'Marrakech', channel, category, description, owner: U(HEAD).name, source: 'Org chart' })) } });
  await runTask('E2E-32', T32[6], { fill: { 'MP-53.9': { decision: 'Approved', rationale: 'Chaque fonction du périmètre a au moins un répondant ; complétude 100 %.' } } });
  await runTask('E2E-32', T32[7], { actor: HRD, fill: { 'MP-53.9': { decision: 'Approved', rationale: 'Périmètre aligné sur le projet médical 2027 de la clinique.' },
    'MP-53.10': async (s, t) => { const d = await api('POST', `/projects/${pid}/documents`, { doc_type: 'DT-E2E-32', lang: 'fr' }); return { document: { code: 'DT-E2E-32', title: d.title, version: d.versionLabel, status: d.status, id: d.id } }; } } });
  await runTask('E2E-32', T32[8], { actor: ANALYST });

  // ---------------- E2E-33 — questionnaire campaign, for real
  const T33 = tasksOf(pid, 'E2E-33');
  const tpls = all(`SELECT id, data FROM records WHERE entity='QuestionnaireTemplate' AND org_id IS NULL`).map(x => ({ id: x.id, ...JSON.parse(x.data) }));
  const order = ['QT-IFPAC-DG', 'QT-IFPAC-MGT', 'QT-IFPAC-MBR'].map(c => tpls.find(t => t.code === c)).filter(Boolean);
  await runTask('E2E-33', T33[0], { actor: ANALYST, fill: { 'MP-54.1': { decision: 'Approved', templates: order.map(x => x.id).join(', '), rationale: 'Un formulaire par population : direction générale (atelier), management (cadres) et collaborateurs (soignants).' } } });
  const q0 = one(`SELECT json_extract(fields,'$.questionnaire_id') q FROM step_records WHERE project_id=? AND step_id='MP-54.1'`, pid).q;
  const MANUAL_Q = 'Quels gestes du tri aux urgences aimeriez-vous voir assistés par l’IA, et lesquels doivent rester entièrement humains ?';
  await runTask('E2E-33', T33[1], { actor: ANALYST, fill: { 'MP-54.2': async () => {
    const tai = await api('POST', `/questionnaires/${q0}/ai-tailor`, {});
    const q = await api('GET', `/questionnaires/${q0}`);
    const forms = q.forms.map(f => (f.code !== 'QT-IFPAC-MBR' ? f : { ...f, sections: f.sections.map(s => (s.id !== 'ai_sector' ? s : { ...s, items: [...s.items, { key: 'm_triage', label: { en: MANUAL_Q, fr: MANUAL_Q, ar: MANUAL_Q } }] })) }));
    await api('PATCH', `/questionnaires/${q0}`, { forms });
    return { ai: { added: tai.added }, manual: MANUAL_Q }; } } });
  const REWORD = { from: null, to: null };
  await runTask('E2E-33', T33[2], { actor: ANALYST, fill: { 'MP-54.3': async () => {
    const q = await api('GET', `/questionnaires/${q0}`);
    // Reword one AI question in the clinic's vocabulary, then validate every AI question.
    const forms = q.forms.map(f => ({ ...f, sections: f.sections.map(s => (s.id !== 'ai_sector' ? s : { ...s, items: s.items.map((it, i) => { if (i === 0 && f.code === 'QT-IFPAC-MBR') { REWORD.from = fr(it.label); REWORD.to = 'Dans votre service, à quelle fréquence utilisez-vous un outil numérique pour orienter un patient à l’accueil des urgences ?'; return { ...it, label: { ...it.label, fr: REWORD.to } }; } return it; }) })) }));
    await api('PATCH', `/questionnaires/${q0}`, { forms });
    await api('POST', `/questionnaires/${q0}/validate`, { all: true });
    return { reworded: REWORD }; } } });
  await runTask('E2E-33', T33[3], { fill: { 'MP-54.4': [
    { role: 'Analyste formation', R: true, A: false, C: false, S: false, I: false, sections: '', note: 'Conçoit et suit le questionnaire' },
    { role: 'Responsable formation', R: false, A: true, C: false, S: false, I: false, sections: '', note: 'Un seul A par section' },
    { role: 'Consultant (chef de projet / associé)', R: false, A: false, C: true, S: false, I: false, sections: '', note: '' },
    { role: 'Manager / manager recruteur', R: false, A: false, C: false, S: true, I: false, sections: '', note: 'Relance ses équipes' },
    { role: 'DRH / président du comité de pilotage', R: false, A: false, C: false, S: false, I: true, sections: '', note: '' }] } });
  await runTask('E2E-33', T33[4], { actor: ANALYST, fill: { 'MP-54.5': [
    { level: 'MS', channels: 'Email, Face-to-Face', population: 'Management', every: '3', max: '2', note: 'Atelier en présentiel pour la direction' },
    { level: 'MO', channels: 'Email, WhatsApp', population: 'Management', every: '3', max: '2', note: '' },
    { level: 'OP', channels: 'WhatsApp, Email', population: 'Member', every: '2', max: '2', note: 'Soignants en horaires décalés' }] } });
  // Distribution: every stakeholder of MP-53.8 becomes a respondent; the messages leave on each channel.
  await runTask('E2E-33', T33[5], { actor: ANALYST, fill: { 'MP-54.6': async () => {
    await api('POST', `/questionnaires/${q0}/invitations`, {});
    const dist = await api('POST', `/questionnaires/${q0}/distribute`, {});
    const inv = await api('GET', `/questionnaires/${q0}/invitations`);
    const links = []; for (const i of inv) links.push({ id: i.id, name: i.name, email: i.email, phone: i.phone, population: i.population, form: i.template_code, plan: i.channel_plan, status: i.status, url: (await api('GET', `/invitations/${i.id}/link`)).url });
    const msgs = await api('GET', `/messages?questionnaire=${q0}`);
    return { invitations: links, messages: msgs.slice(0, 40).map(m => ({ channel: m.channel, to: m.recipient, subject: m.subject, status: m.status, text: m.body || m.text || '' })) }; } } });
  await runTask('E2E-33', T33[6], { actor: ANALYST, fill: { 'MP-54.7': async () => ({ reminders: await api('POST', `/questionnaires/${q0}/remind-now`, {}) }) } });
  // Responses: each respondent opens their own link and answers (the public page of the application).
  const answered = [];
  await runTask('E2E-33', T33[7], { actor: ANALYST, fill: { 'MP-54.8': async () => {
    const inv = await api('GET', `/questionnaires/${q0}/invitations`); const saved = token; token = null;
    for (const [k, i] of inv.entries()) {
      if (k === inv.length - 1) continue; // one respondent has not answered yet
      const tokenStr = (await (async () => { token = saved; const l = await api('GET', `/invitations/${i.id}/link`); token = null; return l.url.split('/respond/')[1]; })());
      const view = await api('GET', `/public/q/${tokenStr}`);
      const st = STAKEHOLDERS.find(x => x[0] === i.name) || STAKEHOLDERS[0];
      const ans = answersFor(view.form, { lang: 'fr', name: i.name, position: st[3], reportsTo: 'Dr Salma Benjelloun', theme: ctx.themes[k % ctx.themes.length], core: { fr: 'Soins cliniques et infirmiers', en: 'Clinical care' }, standard: 'ISO 7101', sector: { fr: 'Établissements de santé', en: 'Healthcare' }, org: { fr: out.org.name, en: out.org.name }, functions: ['Soins cliniques et infirmiers', 'Qualité et HSE'], functionName: st[4] }, r, { skip: 0 });
      if (view.form.sections.some(s => s.id === 'ai_sector')) ans.answers.ai_sector = { ...(ans.answers.ai_sector || {}), m_triage: k % 2 ? 'Le score de gravité proposé à l’accueil ; la décision d’orientation reste à l’infirmière.' : 'La pré-saisie des constantes et l’alerte sur les signes de gravité ; l’annonce au patient reste humaine.' };
      await api('POST', `/public/q/${tokenStr}`, { answers: ans.answers || ans, flags: ans.flags || {}, consent: true, final: true });
      answered.push({ name: i.name, form: i.template_code, sample: Object.entries(ans.answers || ans).slice(0, 3).map(([sid, a]) => ({ section: sid, value: JSON.stringify(a).slice(0, 220) })) });
    }
    token = saved; return { answered }; } } });
  await runTask('E2E-33', T33[8], { actor: ANALYST, fill: { 'MP-54.9': async () => ({ stats: (await api('GET', `/questionnaires/${q0}/stats`)) }) } });
  await runTask('E2E-33', T33[9], { actor: ANALYST, fill: { 'MP-54.10': async () => { const ds = await api('GET', `/questionnaires/${q0}/dataset`); return { dataset: { responses: ds.responses, competences: ds.competences.slice(0, 10), softSkills: ds.softSkills.slice(0, 8) } }; } } });
  await runTask('E2E-33', T33[10], { actor: ANALYST, fill: { 'MP-54.11': async () => ({ feed: await api('POST', `/questionnaires/${q0}/feed`, {}) }),
    'MP-54.12': async () => { const d = await api('POST', `/projects/${pid}/documents`, { doc_type: 'DT-E2E-33', lang: 'fr' }); return { document: { code: 'DT-E2E-33', title: d.title, version: d.versionLabel, status: d.status, id: d.id } }; } } });
  await runTask('E2E-33', T33[11], { actor: ANALYST });
  const qf = await api('GET', `/questionnaires/${q0}`);
  out.questionnaire = { id: q0, label: fr(qf.label), status: qf.status, stats: qf.stats.total, forms: qf.forms.map(f => ({ code: f.code, name: fr(f.name), population: f.population,
    sections: f.sections.map(s => ({ id: s.id, type: s.type, title: fr(s.title), origin: s.origin || 'template', instructions: fr(s.instructions) || '', racsi: s.racsi || null,
      items: (s.items || s.fields || s.rows || s.boxes || []).map(x => ({ label: fr(x.label || x.title) || x.key, origin: x.origin || null })), columns: (s.columns || []).map(c => fr(c.label)) })) })) };
  out.answered = answered;
  await passGate(pid, 1, 'Périmètre approuvé, 7 réponses sur 8 collectées et consolidées.');

  // ---------------- phases 2 to 5 — diagnostic, plan, delivery, evaluation
  for (const [ph, e2e, note] of [[2, 'E2E-02', 'Écarts de compétences validés par la direction médicale.'], [3, 'E2E-01', 'Plan de formation 2027 approuvé par le comité de pilotage.'], [4, 'E2E-05', 'Sessions réalisées, présences et évaluations à chaud enregistrées.'], [5, 'E2E-07', 'Efficacité évaluée à trois mois.']]) {
    for (const t of tasksOf(pid, e2e)) { await login(HEAD); const st = await stepsOf(t.id); await runTask(e2e, t, { fill: genericFill(st, ctx, r) }); }
    await passGate(pid, ph, note);
  }
}

// ------------------------------------------------------------------ 1. project from the simple-path template
if (process.env.CLINIC_STAGE !== 'import') {
  await login(HEAD);
  const tpls = await api('GET', '/project-templates/for-creation');
  const tpl = tpls.find(x => x.own && /SIMPLE/.test(x.code || ''));
  const name = 'Compétences IA 2027 — Clinique Al Amal';
  const old = one(`SELECT id FROM projects WHERE org_id=? AND json_extract(name,'$.fr')=?`, ORG.id, name);
  if (old) { await api('DELETE', `/projects/${old.id}`); console.log('previous case project deleted', old.id); }
  const p = await api('POST', '/projects', { creation_mode: 'catalog', template_id: tpl.id, name, focus: 'AI', description: 'Premier cycle complet de développement des compétences en IA de la clinique : triage aux urgences et aide à la lecture d’images.', complexity: {} });
  out.project = { id: p.id, name, template: { code: tpl.code, name: tpl.name }, focus: 'AI', mode: p.mode, track: p.track };
  out.phases = all(`SELECT phase, e2e_id FROM e2e_instances WHERE project_id=? ORDER BY phase, sort`, p.id).map(x => ({ phase: x.phase, e2e: x.e2e_id, name: fr(cat.get('e2e', x.e2e_id).name), tasks: tasksOf(p.id, x.e2e_id).length }));
  await runAll(p.id);
  fs.writeFileSync(new URL('./clinic-case.json', import.meta.url).pathname.replace('/server/', '/tools/docs/'), JSON.stringify(out, null, 1));
  console.log('project', p.id, 'tasks', out.tasks.length);
}
