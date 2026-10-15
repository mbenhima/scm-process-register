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
async function api(method, path, body, tries = 0) {
  // The public response page is rate limited (120 calls a minute per address): wait and try again.
  if (tries) await new Promise(r => setTimeout(r, 62000));
  const res = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const txt = await res.text(); let data; try { data = JSON.parse(txt); } catch { data = txt; }
  if (res.status === 429 && path.startsWith('/public/') && tries < 3) return api(method, path, body, tries + 1);
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
  ['Mehdi Tahiri', 'infirmier.urgences2@cliniquealamal.ma', '+212 6 61 00 00 09', 'Infirmière', 'Soins cliniques et infirmiers', 'OP', 'WhatsApp', 'Respondent', 'Infirmier d’accueil aux urgences (équipe de nuit).'],
  ['Youssra Bennis', 'infirmiere.hospit@cliniquealamal.ma', '+212 6 61 00 00 10', 'Infirmière', 'Soins cliniques et infirmiers', 'OP', 'Email', 'Respondent', 'Infirmière en hospitalisation, renfort aux urgences.'],
  ['Imane Zerouali', 'radiologie2@cliniquealamal.ma', '+212 6 61 00 00 11', 'Technicien de radiologie', 'Soins cliniques et infirmiers', 'OP', 'WhatsApp', 'Respondent', 'Manipulatrice en radiologie.'],
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
  await passGate(pid, 1, `Périmètre approuvé, ${answered.length} réponses sur ${STAKEHOLDERS.length} collectées et consolidées.`);

  await runFlow(pid);
}

// ------------------------------------------------------------------ phases 2 to 5 — the real flow, step by step
// Every step is filled the way the guide shows it: manually (typed or pasted), from the template of the library, or
// from the AI proposal; the three proposals are recorded for the guide, one is applied (sometimes edited), the people
// answer their own links on the public page, and the step is completed.
const shape = (s, p) => { if (!p) return null; const sf = snapStep(s); if (p.fields) return { fields: sf.fields.filter(f => p.fields[f.key] != null && p.fields[f.key] !== '').map(f => ({ label: f.label, value: lbl(f, p.fields[f.key]) })) };
  return { rows: (p.rows || []).map(r => sf.fields.map(f => lbl(f, r[f.key]))), useCase: p.useCase?.code || null, engine: p.engine || null }; };
const trimPanel = p => p && ({ notes: p.notes || [], kpis: p.kpis || [], tables: (p.tables || []).map(t => ({ title: t.title, columns: t.columns.map(c => c[1]), rows: t.rows.slice(0, 14).map(r => t.columns.map(c => String(r[c[0]] ?? ''))) })) });
async function flowStep(t, s, o = {}) {
  const b = `/tasks/${t.id}/steps/${s.id}`; const snap = { ...snapStep(s), fill: s.form.fill || [], modes: {} };
  if (o.first) snap.answers = await o.first(); // answers received before the step is filled (expert reviews)
  const fill = s.form.fill || [];
  if (fill.includes('template')) try { snap.modes.template = await api('POST', `${b}/template`, {}); } catch (e) { snap.modes.templateError = e.data?.error || e.message; }
  if (fill.includes('ai')) try { snap.modes.ai = await api('POST', `${b}/suggest`, {}); } catch (e) { snap.modes.aiError = e.data?.error || e.message; }
  const mode = o.mode || (snap.modes.ai && !snap.modes.ai.fields && !(snap.modes.ai.rows || []).length ? 'template' : o.mode) || (s.form.pattern === 'module' ? null : 'template');
  let applied = null;
  if (o.rows) applied = { rows: o.rows };
  else if (mode && snap.modes[mode]) applied = snap.modes[mode];
  if (applied && o.edit) applied = applied.fields ? { fields: o.edit(applied.fields) } : { rows: applied.rows.map(o.edit).filter(Boolean) };
  if (applied && o.add) applied = { rows: [...applied.rows, ...o.add] };
  if (applied?.rows && o.renumber) applied = { rows: applied.rows.map((r, i) => ({ ...r, code: `${o.renumber}-${String(i + 1).padStart(2, '0')}` })) };
  if (applied?.fields) await api('PUT', `${b}/fields`, { fields: applied.fields });
  else if (applied?.rows) for (const r of applied.rows) await api('POST', `${b}/rows`, { data: r, origin: o.rows ? 'manual' : mode === 'ai' ? 'ai' : 'library' });
  snap.mode = o.rows ? 'manual' : applied ? mode : null; snap.edited = !!(o.edit || o.add); snap.note = o.note || null;
  const sf = snapStep(s);
  if (applied?.fields) snap.values = sf.fields.map(f => ({ label: f.label, value: lbl(f, applied.fields[f.key]) || '' }));
  if (applied?.rows) snap.rows = applied.rows.map(r => sf.fields.map(f => lbl(f, r[f.key])));
  snap.modes = { template: shape(s, snap.modes.template), ai: shape(s, snap.modes.ai), aiError: snap.modes.aiError || null, templateError: snap.modes.templateError || null };
  for (const a of o.before || []) { snap.actions = [...(snap.actions || []), { key: a, result: await api('POST', `${b}/actions/${a}`, {}) }]; }
  if (o.answer) snap.answers = await o.answer();
  for (const a of o.after || []) { snap.actions = [...(snap.actions || []), { key: a, result: await api('POST', `${b}/actions/${a}`, {}) }]; }
  try { const r = await api('POST', `${b}/complete`, {}); snap.completed = true; snap.result = r.result || null; } catch (e) { snap.completed = false; snap.completeError = e.data?.error || e.message; console.log('  ✗', s.id, snap.completeError); }
  try { snap.panel = trimPanel(await api('GET', `${b}/panel`)); } catch { /* no panel */ }
  if (s.form.module === 'document') { const d = await api('GET', `/projects/${t.project_id}/documents`); const x = d.filter(y => y.doc_type === s.form.doc)[0]; if (x) snap.document = { code: s.form.doc, title: x.title, version: x.versionLabel || x.version, status: x.status }; }
  return snap;
}
async function flowTask(e2e, t, plan, actor = HEAD) {
  await login(actor);
  const u = cat.get('uft', t.uft_id); const rec = { uft: t.uft_id, name: fr(u.name), owner: fr(u.racsiT?.R) || u.racsi?.R, accountable: fr(u.racsiT?.A) || u.racsi?.A, input: fr(u.input), outputName: fr(u.output), steps: [], actor };
  if (taskRec(t.id).status === 'Not started') await api('PATCH', `/tasks/${t.id}`, { status: 'In progress' });
  const st = await stepsOf(t.id); const order = plan._order || st.steps.map(s => s.id);
  for (const sid of order) { const s = st.steps.find(x => x.id === sid); if (!s) continue; if (s.done) { rec.steps.push({ ...snapStep(s), skipped: true }); continue; }
    if (s.form.module === 'document') await api('POST', `/projects/${t.project_id}/documents`, { doc_type: s.form.doc, lang: 'fr' });
    console.log(' ', t.uft_id, sid); rec.steps.push(await flowStep(t, s, plan[sid] || {})); }
  rec.steps.sort((a, b) => st.steps.findIndex(x => x.id === a.id) - st.steps.findIndex(x => x.id === b.id));
  const task = await api('GET', `/tasks/${t.id}`); rec.guidance = fr(task.task.guidance); rec.output = task.summary || rec.outputName;
  await api('PATCH', `/tasks/${t.id}`, { output: rec.output, status: 'Completed' });
  out.tasks.push({ e2e, ...rec }); return rec;
}
/** Every open link of a campaign answered on the public page: `answer(view, i)` returns the answers or null (not answered). */
async function answerCampaign(pid, purpose, answer) {
  const q = one(`SELECT id FROM records WHERE entity='Questionnaire' AND project_id=? AND json_extract(data,'$.purpose')=?`, pid, purpose); if (!q) return [];
  const saved = token; const done = [];
  for (const [i, inv] of all(`SELECT id, name, template_code FROM q_invitations WHERE questionnaire_id=? AND status<>'Responded' ORDER BY created_at`, q.id).entries()) {
    token = saved; const tk = (await api('GET', `/invitations/${inv.id}/link`)).url.split('/respond/')[1]; token = null;
    const view = await api('GET', `/public/q/${tk}`); const a = answer(view, i); if (!a) continue;
    await api('POST', `/public/q/${tk}`, { answers: a, consent: true, final: true }); done.push({ name: view.respondent.name, form: fr(view.form.name), answers: a });
  }
  token = saved; return done;
}
// Levels the clinic's staff give themselves (self) and their managers give them (mgr), by competency keyword.
const LV = { 'Samira Ouazzani': { triage: [2, 1], ethi: [2, 2], esprit: [2, 2] }, 'Mehdi Tahiri': { triage: [2, 2], ethi: [1, 2], esprit: [3, 2] }, 'Youssra Bennis': { triage: [1, 1], ethi: [2, 2], esprit: [2, 2] },
  'Rachid Amrani': { imag: [2, 1], ethi: [2, 2], esprit: [2, 1] }, 'Imane Zerouali': { imag: [1, 1], ethi: [2, 1], esprit: [2, 2] }, 'Omar El Fassi': { triage: [3, 2], ethi: [2, 2], esprit: [3, 3] },
  'Nadia Berrada': { triage: [2, 2], ethi: [3, 2], esprit: [3, 3] }, 'Leila Chraibi': { ethi: [3, 3], esprit: [3, 3], triage: [1, 1], imag: [1, 1] } };
const lvOf = (name, label, mgr) => { const k = Object.keys(LV[name] || {}).find(x => new RegExp(x, 'i').test(label.normalize('NFD').replace(/[̀-ͯ]/g, ''))); return k ? LV[name][k][mgr ? 1 : 0] : 2; };
async function runFlow(pid) {
  const T = e2e => tasksOf(pid, e2e);
  // ---------------- E2E-02 — skills diagnosis
  const D = T('E2E-02');
  await flowTask('E2E-02', D[0], { 'MP-02.1': { mode: 'template', renumber: 'C', edit: r => (/lits|effectifs/i.test(r.item) ? null : r), note: 'Le modèle propose les thèmes IA du secteur ; la ligne « Planification IA des lits et des effectifs » a été supprimée (hors périmètre de ce premier cycle) et les codes renumérotés C-01 à C-04.' } }, ANALYST);
  await flowTask('E2E-02', D[1], { 'MP-02.2': { mode: 'ai', note: 'L’IA relie chaque compétence aux postes concernés (triage pour les urgences et les soins, imagerie pour la radiologie) et propose la criticité.' } }, ANALYST);
  await flowTask('E2E-02', D[2], { 'MP-02.3': { mode: 'ai', note: 'L’IA reprend les parties prenantes des niveaux OP et MO dont le poste a des cibles, et désigne le manager de la même fonction.' } }, ANALYST);
  await flowTask('E2E-02', D[3], { 'MP-02.4': { answer: () => answerCampaign(pid, 'assessment', view => { const mgr = /^MGR-/.test(view.form.code || '') || /Évaluation de/.test(fr(view.form.name)); const subj = mgr ? fr(view.form.name).replace(/^Évaluation de /, '').replace(/ \(.*$/, '') : view.respondent.name;
    const lv = view.form.sections.find(x => x.id === 'levels'); return { levels: Object.fromEntries(lv.items.map(it => [it.key, String(lvOf(subj, fr(it.label), mgr))])), evidence: { evidence: mgr ? `Observé en service sur les dernières semaines (${subj}).` : 'Utilisation quotidienne du dossier patient ; premiers essais de l’outil.' } }; }) },
    'MP-02.5': { after: ['consolidate'] } });
  await flowTask('E2E-02', D[4], { 'MP-02.6': { mode: 'ai', note: 'Règle de l’IA : le niveau du manager compte double ; un écart de deux niveaux entre auto-évaluation et manager est signalé.' } }, ANALYST);
  await flowTask('E2E-02', D[5], { 'MP-02.7': { mode: 'ai' } });
  await flowTask('E2E-02', D[6], { 'MP-03.1': { after: ['gaps'] }, 'MP-03.2': { mode: 'ai' }, 'MP-28.3': { mode: 'ai' }, 'MP-28.1': {} }, ANALYST);
  await passGate(pid, 2, 'Écarts de compétences validés par la direction médicale.');
  // ---------------- E2E-01 — training plan
  const P = T('E2E-01');
  await flowTask('E2E-01', P[0], { 'MP-01.1': { mode: 'ai' } });
  await flowTask('E2E-01', P[1], { 'MP-01.2': { mode: 'ai' } }, ANALYST);
  await flowTask('E2E-01', P[2], { 'MP-02.1': { mode: 'ai' }, 'MP-02.2': { mode: 'template' } }, ANALYST);
  await flowTask('E2E-01', P[3], { 'MP-03.1': { after: ['needs'] }, 'MP-03.2': { mode: 'template' } }, ANALYST);
  await flowTask('E2E-01', P[4], { 'MP-01.3': { mode: 'ai' }, 'MP-18.1': { mode: 'ai' }, 'MP-18.2': { mode: 'ai' } });
  await flowTask('E2E-01', P[5], { 'MP-19.1': { mode: 'ai' }, 'MP-19.2': { mode: 'ai' } });
  await flowTask('E2E-01', P[6], { 'MP-01.4': { mode: 'template' }, 'MP-01.5': {}, 'MP-04.1': {}, _order: ['MP-01.4', 'MP-01.5', 'MP-04.1'] });
  await flowTask('E2E-01', P[7], { 'MP-01.6': { mode: 'ai' }, 'MP-01.7': { before: ['diffuse'] } }, HRD);
  await passGate(pid, 3, 'Plan de formation 2027 approuvé par le comité de pilotage.');
  // ---------------- E2E-05 — delivery
  const L = T('E2E-05');
  await flowTask('E2E-05', L[0], { 'MP-06.3': { mode: 'ai' },
    'MP-06.4': { mode: 'template', first: () => answerCampaign(pid, 'review', (v, i) => ({ approve: { approve: { value: 'Yes', comment: i ? 'Ajouter un cas sur un patient âgé polypathologique.' : 'Conforme aux protocoles du service.' } }, comments: { comments: i ? 'Prévoir 30 minutes de pratique sur poste.' : 'RAS' } })) },
    'MP-06.6': { mode: 'ai' } });
  const crs = all(`SELECT data FROM records WHERE entity='TrainingCourse' AND project_id=?`, pid).map(x => JSON.parse(x.data)); const codes = f => (crs.filter(f).map(c => c.training_code).join(', ') || crs.map(c => c.training_code).join(', '));
  await flowTask('E2E-05', L[1], { 'MP-11.1': { mode: 'ai' }, 'MP-11.2': { rows: [
    { item: 'Hicham Tazi', organisation: 'Interne', email: 'trainer@cliniquealamal.ma', phone: '+212 6 61 00 00 12', start: '2026-11-01', end: '2027-12-31', courses: codes(c => c.provider !== 'External'), dayRate: '0' },
    { item: 'Dr Karim Lahlou', organisation: 'Maghreb Learning Partners', email: 'k.lahlou@maghreb-lp.ma', phone: '+212 6 61 00 00 13', start: '2026-11-15', end: '2027-06-30', courses: codes(c => c.provider === 'External'), dayRate: '7000' }], note: 'Saisie manuelle : le formateur interne de la clinique et un formateur externe.' } });
  await flowTask('E2E-05', L[2], { 'MP-07.1': { mode: 'ai' }, 'MP-07.2': {} });
  await flowTask('E2E-05', L[3], { 'MP-07.3': { mode: 'ai' }, 'MP-07.4': { before: ['send'], answer: () => answerCampaign(pid, 'convocation', v => (v.respondent.name === 'Youssra Bennis' ? { confirm: { confirm: { value: 'No', comment: 'En congé ce jour-là.' } } } : { confirm: { confirm: { value: 'Yes' } } })) }, 'MP-17.1': { after: ['provision'] } });
  await flowTask('E2E-05', L[4], { 'MP-25.1': { mode: 'ai' }, 'MP-25.2': { mode: 'template' }, 'MP-25.3': { before: ['push'], answer: () => answerCampaign(pid, 'capsule', (v, i) => (i % 3 === 2 ? null : { useful: { useful: { value: i % 4 ? 'Yes' : 'No', comment: '' } } })) }, 'MP-25.4': { mode: 'template' }, 'MP-25.5': {} });
  await flowTask('E2E-05', L[5], { 'MP-30.1': { mode: 'ai' }, 'MP-30.2': { mode: 'template' }, 'MP-30.3': { mode: 'ai' },
    'MP-30.4': { mode: 'template', edit: r => (r.item === 'Youssra Bennis' ? null : { ...r, score: String({ 'Samira Ouazzani': 78, 'Mehdi Tahiri': 85, 'Youssra Bennis': 0, 'Rachid Amrani': 72, 'Imane Zerouali': 64, 'Omar El Fassi': 90, 'Nadia Berrada': 82 }[r.item] ?? 75), observation: r.item === 'Imane Zerouali' ? 'Signalement IA transmis sans vérifier la qualité de l’image.' : 'Données vérifiées, décision justifiée et tracée.' }), note: 'Le modèle liste les apprenants de chaque séance ; le formateur saisit le score et l’observation.' },
    'MP-30.5': { mode: 'ai' }, 'MP-30.6': { after: ['record'] } });
  await flowTask('E2E-05', L[6], { 'MP-07.5': { mode: 'template' } });
  await flowTask('E2E-05', L[7], { 'MP-07.6': { mode: 'ai' } }, HRD);
  await flowTask('E2E-05', L[8], { 'MP-11.3': { mode: 'template', edit: (() => { let n = 117; return r => ({ ...r, item: `MLP-2026-${++n}` }); })(), note: 'Le modèle calcule le montant attendu (heures × tarif journalier) et le nombre de présents ; le n° de facture est saisi depuis la facture reçue.' },
    'MP-11.5': { mode: 'ai' }, 'MP-11.4': { mode: 'ai' }, 'MP-11.6': {}, _order: ['MP-11.3', 'MP-11.5', 'MP-11.4', 'MP-11.6'] });
  await passGate(pid, 4, 'Sessions réalisées, présences et évaluations à chaud enregistrées.');
  // ---------------- E2E-07 — evaluation
  const E = T('E2E-07');
  await flowTask('E2E-07', E[0], { 'MP-09.1': { mode: 'template' } });
  await flowTask('E2E-07', E[1], { 'MP-09.2': { mode: 'ai' } });
  await flowTask('E2E-07', E[2], { 'MP-09.3': { before: ['send'], answer: () => answerCampaign(pid, 'l1', (v, i) => ({ rating: Object.fromEntries(v.form.sections.find(x => x.id === 'rating').items.map((it, k) => [it.key, String([[5, 4, 5, 5, 4], [4, 4, 3, 4, 4], [5, 5, 4, 5, 5], [3, 4, 3, 4, 3], [4, 5, 4, 4, 5]][i % 5][k % 5])])), open: { apply: ['Vérifier les constantes avant de lire la proposition de l’outil.', 'Tracer l’écart entre la proposition et ma décision.', 'Transmettre le signalement avec l’image au radiologue.'][i % 3], improve: i % 2 ? 'Plus de cas pratiques.' : 'Une demi-journée de plus.' } })) } }, ANALYST);
  const key = () => JSON.parse(one(`SELECT data FROM records WHERE entity='Questionnaire' AND project_id=? AND json_extract(data,'$.purpose')='l2'`, pid).data).answer_keys;
  await flowTask('E2E-07', E[3], { 'MP-09.4': { before: ['send'], answer: () => { const keys = key(); return answerCampaign(pid, 'l2', (v, i) => ({ quiz: Object.fromEntries(Object.entries(keys[v.form.code] || {}).map(([k, x], j) => [k, (i === 2 && j < 2) || (i === 4 && j === 0) ? (x.answer === 'A' ? 'C' : 'A') : x.answer])) })); } } });
  await flowTask('E2E-07', E[4], { 'MP-09.5': { before: ['send'], answer: () => answerCampaign(pid, 'l3', (v, i) => ({ levels: Object.fromEntries(v.form.sections.find(x => x.id === 'levels').items.map(it => [it.key, String(i === 3 ? 2 : 3)])), facts: { facts: i === 3 ? 'Utilise l’outil mais oublie encore de tracer sa décision.' : 'Vérifie les données, décide et trace la décision en autonomie.' } })) } });
  await flowTask('E2E-07', E[5], { 'MP-09.6': { after: ['compute'] }, 'MP-10.3': { after: ['compute'] } }, ANALYST);
  await flowTask('E2E-07', E[6], { 'MP-09.7': { mode: 'ai' }, 'MP-20.5': { mode: 'ai' } }, ANALYST);
  await flowTask('E2E-07', E[7], { 'MP-10.4': {}, 'MP-10.6': { mode: 'ai' }, 'MP-10.2': { mode: 'ai' } }, ANALYST);
  await passGate(pid, 5, 'Efficacité évaluée aux niveaux 1 à 3 ; actions d’amélioration engagées.');
  // What the case produced, for the guide.
  const R = (e, f) => all(`SELECT data FROM records WHERE entity=? AND project_id=?`, e, pid).map(x => f(JSON.parse(x.data)));
  out.flow = { kpis: all(`SELECT kpi_id, value, target, status FROM kpi_values WHERE project_id=?`, pid), messages: all(`SELECT kind, channel, recipient, subject, status, body FROM messages WHERE project_id=? ORDER BY created_at`, pid).map(m => ({ ...m, body: (m.body || '').slice(0, 700) })),
    courses: R('TrainingCourse', d => ({ code: d.training_code, name: d.name_text, hours: d.hours, provider: d.provider, review: d.review_status, status: d.status })), sessions: R('Session', d => ({ code: d.code, course: d.course_code, date: d.start_date, time: d.start_time, room: d.room, trainer: d.trainer })),
    gaps: R('SkillGap', d => ({ employee: d.employee, code: d.competency_code, gap: d.gap_value, critical: d.is_critical })),
    campaigns: Object.fromEntries(all(`SELECT id, json_extract(data,'$.purpose') p FROM records WHERE entity='Questionnaire' AND project_id=?`, pid).map(x => [x.p || 'needs', x.id])) };
  const openCap = one(`SELECT i.id FROM q_invitations i JOIN records q ON q.id=i.questionnaire_id WHERE q.project_id=? AND json_extract(q.data,'$.purpose')='capsule' AND i.status<>'Responded' LIMIT 1`, pid);
  if (openCap) { await login(HEAD); out.flow.openCapsule = (await api('GET', `/invitations/${openCap.id}/link`)).url; }
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
