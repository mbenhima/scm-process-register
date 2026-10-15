// Integration test of the steps that work on real data (release 1.13): the stakeholders of MP-53.8 become the
// questionnaire's respondents, MP-54.1 creates the questionnaire from the chosen templates, MP-54.2 / -54.3 work on
// its questions, the RACSI of MP-54.4 needs one A per section, the channels of MP-54.5 shape each respondent's plan,
// the distribution sends one message per respondent and a respondent answers from the link; gates are attached to a
// new project. Run after `npm run seed`: npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { one, all } from '../src/db.js';
import { config } from '../src/config.js';

let server, base, token, pid;
const call = async (method, path, body) => {
  const res = await fetch(base + '/api' + path, { method, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  let data = null; try { data = await res.json(); } catch { /* empty */ } return { status: res.status, data };
};
const ok = async (method, path, body) => { const r = await call(method, path, body); assert.ok(r.status < 300, `${method} ${path} → ${r.status} ${JSON.stringify(r.data)}`); return r.data; };
const taskOf = uft => one(`SELECT t.id FROM task_instances t WHERE t.project_id=? AND t.uft_id=?`, pid, uft).id;

before(async () => {
  const app = await createApp({ background: false });
  server = app.listen(0); await new Promise(r => server.once('listening', r)); base = `http://127.0.0.1:${server.address().port}`;
  const u = one(`SELECT u.id, u.org_id FROM users u JOIN user_roles r ON r.user_id=u.id AND r.role_id='R-03' JOIN organizations o ON o.id=u.org_id WHERE o.sector='HCPR' AND o.segment='SME' LIMIT 1`);
  assert.ok(u, 'a healthcare SME organization with a head of L&D');
  token = jwt.sign({ sub: u.id }, config.jwtSecret, { expiresIn: '1h' });
  const tpl = (await ok('GET', '/project-templates/for-creation')).find(x => x.own && /SIMPLE/.test(x.code || ''));
  assert.ok(tpl, 'the simple-path template of the clinic');
  pid = (await ok('POST', '/projects', { creation_mode: 'catalog', template_id: tpl.id, name: 'IT qsteps', focus: 'AI', complexity: {} })).id;
});
after(async () => { if (pid) await call('DELETE', `/projects/${pid}`); server?.close(); });

test('new project: six processes and the gate checklists of its phases', async () => {
  const e2e = all(`SELECT e2e_id FROM e2e_instances WHERE project_id=?`, pid).map(x => x.e2e_id);
  assert.deepEqual(new Set(e2e), new Set(['E2E-32', 'E2E-33', 'E2E-02', 'E2E-01', 'E2E-05', 'E2E-07']));
  assert.ok(one(`SELECT COUNT(*) n FROM records WHERE entity='PhaseChecklist' AND project_id=?`, pid).n >= 1, 'gate checklists attached');
});

test('stakeholders → questionnaire → RACSI → channels → distribution → response', async () => {
  // MP-53.8: typed stakeholders mirror into Stakeholder records.
  const t6 = taskOf('UFT-32-06');
  for (const [item, email, phone, level, channel] of [['IT Directrice', 'it.dg@example.ma', '+212 6 00 00 00 01', 'MS', 'Email'], ['IT Infirmière', 'it.inf@example.ma', '+212 6 00 00 00 02', 'OP', 'WhatsApp']])
    await ok('POST', `/tasks/${t6}/steps/MP-53.8/rows`, { data: { item, email, phone, role: item === 'IT Directrice' ? 'Directrice générale' : 'Infirmière', function: 'Opérations', level, channel, site: 'Marrakech' } });
  const sh = all(`SELECT data FROM records WHERE entity='Stakeholder' AND project_id=?`, pid).map(x => JSON.parse(x.data));
  assert.equal(sh.length, 2); assert.equal(sh.find(s => s.name === 'IT Directrice').population, 'DG', 'feminine title recognized as general management');
  const bad = await call('POST', `/tasks/${t6}/steps/MP-53.8/rows`, { data: { item: 'X', email: 'not-an-email', role: 'R', function: 'Opérations', level: 'MS', channel: 'Email' } });
  assert.ok(bad.status < 300, 'server keeps the row; the grid flags the e-mail'); // the e-mail rule is a client check
  // MP-54.1: the questionnaire is created from the chosen templates at completion.
  const t1 = taskOf('UFT-33-01'); const tpls = all(`SELECT id FROM records WHERE entity='QuestionnaireTemplate' AND org_id IS NULL`).map(x => x.id);
  await ok('PUT', `/tasks/${t1}/steps/MP-54.1/fields`, { fields: { decision: 'Approved', templates: tpls.join(', ') } });
  const panel = await call('POST', `/tasks/${taskOf('UFT-33-02')}/steps/MP-54.2/complete`);
  assert.equal(panel.status, 422); assert.equal(panel.data.error, 'err.noQuestionnaire', 'no questionnaire before MP-54.1');
  await ok('POST', `/tasks/${t1}/steps/MP-54.1/complete`);
  const steps = await ok('GET', `/tasks/${taskOf('UFT-33-02')}/steps`); const qid = steps.questionnaire; assert.ok(qid, 'questionnaire linked to the campaign steps');
  const q = await ok('GET', `/questionnaires/${qid}`); assert.equal(q.forms.length, tpls.length);
  assert.ok(q.forms.flatMap(f => f.sections.flatMap(s => s.items || [])).length > 50, 'the questions of the templates are there');
  await ok('POST', `/tasks/${taskOf('UFT-33-02')}/steps/MP-54.2/complete`);
  // MP-54.3 is blocked while an AI question is not validated.
  await ok('POST', `/questionnaires/${qid}/ai-tailor`, {});
  const t3 = taskOf('UFT-33-03'); assert.equal((await call('POST', `/tasks/${t3}/steps/MP-54.3/complete`)).data.error, 'err.aiUnvalidated');
  await ok('POST', `/questionnaires/${qid}/validate`, { all: true }); await ok('POST', `/tasks/${t3}/steps/MP-54.3/complete`);
  // MP-54.4: two A on the same sections are refused, one A is accepted and written into the questionnaire.
  const t4 = taskOf('UFT-33-04');
  const a1 = await ok('POST', `/tasks/${t4}/steps/MP-54.4/rows`, { data: { role: 'Responsable formation', A: true } });
  const a2 = await ok('POST', `/tasks/${t4}/steps/MP-54.4/rows`, { data: { role: 'DRH', A: true } });
  assert.equal((await call('POST', `/tasks/${t4}/steps/MP-54.4/complete`)).data.error, 'err.racsiOneA');
  await ok('PUT', `/tasks/${t4}/steps/MP-54.4/rows/${a2.id}`, { data: { A: false, I: true } }); void a1;
  await ok('POST', `/tasks/${t4}/steps/MP-54.4/complete`);
  assert.ok((await ok('GET', `/questionnaires/${qid}`)).racsi_allocation.every(x => x.A === 'Responsable formation'));
  // MP-54.5: channels per level shape the plans of the respondents.
  const t5 = taskOf('UFT-33-05');
  await ok('POST', `/tasks/${t5}/steps/MP-54.5/rows`, { data: { level: 'MS', channels: 'Email, Face-to-Face', every: '3', max: '1' } });
  await ok('POST', `/tasks/${t5}/steps/MP-54.5/rows`, { data: { level: 'OP', channels: 'WhatsApp, Email', every: '2', max: '2' } });
  await ok('POST', `/tasks/${t5}/steps/MP-54.5/complete`);
  await ok('POST', `/questionnaires/${qid}/invitations`, {});
  const inv = await ok('GET', `/questionnaires/${qid}/invitations`);
  const dg = inv.find(i => i.name === 'IT Directrice'), op = inv.find(i => i.name === 'IT Infirmière');
  assert.deepEqual(dg.channel_plan.map(s => s.channel), ['Email', 'Email', 'Face-to-Face']); assert.equal(op.channel_plan[0].channel, 'WhatsApp');
  // Who answers what: a section, a sub-section or a question goes to chosen respondents only.
  const av = await ok('GET', `/questionnaires/${qid}/assignments`); const fm = av.forms.find(f => f.code === op.template_code);
  const sec = fm.elements.find(e => e.level === 'section' && fm.elements.some(x => x.parent === e.ref)); const q1 = fm.elements.find(e => e.parent === sec.ref && e.level === 'question');
  assert.equal((await call('PUT', `/questionnaires/${qid}/assignments`, { assignments: { [sec.ref]: ['not-a-respondent'] } })).data.error, 'err.assignUnknownRespondent');
  assert.equal((await call('PUT', `/questionnaires/${qid}/assignments`, { assignments: { 'X|y': [op.stakeholder_id] } })).data.error, 'err.assignUnknownElement');
  const dgForm = av.forms.find(f => f.code === dg.template_code); const other = dgForm.elements.find(e => e.level === 'section');
  const sv = await ok('PUT', `/questionnaires/${qid}/assignments`, { assignments: { [other.ref]: [dg.stakeholder_id], [q1.ref]: [op.stakeholder_id] } });
  assert.equal(Object.keys(sv.assignments).length, 2);
  const pasted = await ok('POST', `/questionnaires/${qid}/assignments/paste`, { text: `Question\t${q1.label.fr}\tInfirmière\nSection\tInconnue\tIT Infirmière` });
  assert.equal(pasted.matched >= 1, true); assert.equal(pasted.unmatched[0].reason, 'element');
  // MP-54.6: one message per respondent, then a response from the respondent's link.
  await ok('POST', `/questionnaires/${qid}/distribute`, {});
  const msgs = await ok('GET', `/messages?questionnaire=${qid}`); assert.equal(msgs.length, 2);
  assert.ok(msgs.every(m => /Bonjour|Hello/.test(m.body)));
  const url = (await ok('GET', `/invitations/${op.id}/link`)).url; const tk = url.split('/respond/')[1];
  const pub = await fetch(`${base}/api/public/q/${tk}`).then(r => r.json()); assert.ok(pub.form.sections.length > 3);
  assert.ok(pub.form.assigned && pub.form.sections.some(s => s.id === sec.section && (s.items || s.rows).some(x => x.key === q1.item)), 'the assigned question is in the respondent form');
  const ident = pub.form.sections.find(s => s.type === 'identity');
  const res = await fetch(`${base}/api/public/q/${tk}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: ident ? { [ident.id]: { full_name: 'IT Infirmière' } } : {}, consent: true, final: true }) });
  assert.equal(res.status, 200);
  assert.equal((await ok('GET', `/questionnaires/${qid}/stats`)).total.responded, 1);
  await ok('POST', `/tasks/${taskOf('UFT-33-08')}/steps/MP-54.8/complete`);
});
