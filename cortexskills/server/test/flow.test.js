// Integration test of the real flow of the skills diagnosis (E2E-02), the training plan (E2E-01), delivery (E2E-05)
// and evaluation (E2E-07): each step is filled from its template (and the AI proposal where it exists), the people
// answer their links on the public response page, and each step reads what the previous one created: competencies →
// targets → assessments → validated levels → gaps → objectives and needs → budget → courses → sessions → enrolments →
// invitations → attendance → satisfaction, test, observation → progression and indicators. Run after `npm run seed`.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { one, all } from '../src/db.js';
import { config } from '../src/config.js';
import { ensureUseCases } from '../src/services/flow.js';

let server, base, token, pid;
const call = async (method, path, body) => { const res = await fetch(base + '/api' + path, { method, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'Accept-Language': 'fr' }, body: body ? JSON.stringify(body) : undefined }); let data = null; try { data = await res.json(); } catch { /* */ } return { status: res.status, data }; };
const ok = async (method, path, body) => { const r = await call(method, path, body); assert.ok(r.status < 300, `${method} ${path} → ${r.status} ${JSON.stringify(r.data)?.slice(0, 400)}`); return r.data; };
const task = uft => one(`SELECT id FROM task_instances WHERE project_id=? AND uft_id=?`, pid, uft).id;
/** Accepts the rows of the template (or of the AI proposal) of a step, then completes it. */
async function fill(uft, step, mode = 'template', edit = r => r) {
  const t = task(uft); const p = mode === 'ai' ? await ok('POST', `/tasks/${t}/steps/${step}/suggest`, {}) : await ok('POST', `/tasks/${t}/steps/${step}/template`, {});
  if (p.fields) await ok('PUT', `/tasks/${t}/steps/${step}/fields`, { fields: edit(p.fields) });
  else { assert.ok(p.rows.length, `${step}: ${mode} proposes rows`); for (const r of p.rows.map(edit).filter(Boolean)) await ok('POST', `/tasks/${t}/steps/${step}/rows`, { data: r, origin: mode === 'ai' ? 'ai' : 'library' }); }
  return ok('POST', `/tasks/${t}/steps/${step}/complete`);
}
const complete = (uft, step) => ok('POST', `/tasks/${task(uft)}/steps/${step}/complete`);
const act = (uft, step, key) => ok('POST', `/tasks/${task(uft)}/steps/${step}/actions/${key}`, {});
/** Every open invitation of a campaign answered on the public page with `answer(form)`. */
async function answerAll(purpose, answer) {
  const q = one(`SELECT id FROM records WHERE entity='Questionnaire' AND project_id=? AND json_extract(data,'$.purpose')=?`, pid, purpose); assert.ok(q, `campaign ${purpose}`);
  let n = 0;
  for (const inv of all(`SELECT id FROM q_invitations WHERE questionnaire_id=? AND status<>'Responded'`, q.id)) {
    const url = (await ok('GET', `/invitations/${inv.id}/link`)).url; const tk = url.split('/respond/')[1];
    const pub = await fetch(`${base}/api/public/q/${tk}`).then(r => r.json());
    const res = await fetch(`${base}/api/public/q/${tk}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: answer(pub.form, n), consent: true, final: true }) });
    assert.equal(res.status, 200, `answer ${purpose}`); n++;
  }
  return n;
}

before(async () => {
  const app = await createApp({ background: false });
  server = app.listen(0); await new Promise(r => server.once('listening', r)); base = `http://127.0.0.1:${server.address().port}`;
  const u = one(`SELECT u.id, u.org_id FROM users u JOIN user_roles r ON r.user_id=u.id AND r.role_id='R-03' JOIN organizations o ON o.id=u.org_id WHERE o.sector='HCPR' AND o.segment='SME' LIMIT 1`);
  ensureUseCases(u.org_id); token = jwt.sign({ sub: u.id }, config.jwtSecret, { expiresIn: '1h' });
  const tpl = (await ok('GET', '/project-templates/for-creation')).find(x => x.own && /SIMPLE/.test(x.code || ''));
  pid = (await ok('POST', '/projects', { creation_mode: 'catalog', template_id: tpl.id, name: 'IT flow', focus: 'AI', complexity: {} })).id;
  // Phase 1 essentials: the stakeholders (MP-53.8).
  const t6 = task('UFT-32-06');
  for (const [item, role, fn, level, email, phone, cat] of [
    ['IT Directrice', 'Directrice générale', 'Direction générale', 'MS', 'it.dg@example.ma', '+212600000001', 'Sponsor'], ['IT Médecin', 'Directeur médical', 'Soins cliniques et infirmiers', 'MS', 'it.med@example.ma', '+212600000002', 'Expert'],
    ['IT Cadre', 'Cadre de santé', 'Soins cliniques et infirmiers', 'MO', 'it.cadre@example.ma', '+212600000003', 'Change relay'], ['IT Infirmière', 'Infirmière urgences', 'Soins cliniques et infirmiers', 'OP', 'it.inf@example.ma', '+212600000004', 'Respondent'],
    ['IT Radio', 'Technicien de radiologie', 'Soins cliniques et infirmiers', 'OP', 'it.radio@example.ma', '+212600000005', 'Respondent']])
    await ok('POST', `/tasks/${t6}/steps/MP-53.8/rows`, { data: { item, role, function: fn, level, email, phone, channel: 'Email', category: cat, site: 'Marrakech' } });
  await ok('POST', `/tasks/${t6}/steps/MP-53.8/complete`);
});
after(async () => { if (pid && !process.env.KEEP) await call('DELETE', `/projects/${pid}`); server?.close(); });

test('diagnosis: framework, targets, campaign answered, validated levels, gaps', async () => {
  const r1 = await fill('UFT-02-01', 'MP-02.1', 'template', r => (/Triage|imagerie|Éthique|Esprit/i.test(r.item) ? r : null));
  void r1; assert.ok(all(`SELECT id FROM records WHERE entity='Competency' AND project_id=?`, pid).length >= 3, 'competencies created');
  await fill('UFT-02-02', 'MP-02.2', 'ai');
  assert.ok(all(`SELECT id FROM records WHERE entity='PositionCompetencyTarget' AND project_id=?`, pid).length >= 4, 'targets created');
  const launch = await fill('UFT-02-03', 'MP-02.3', 'ai');
  assert.ok(launch.result.added >= 4, `assessment invitations: ${JSON.stringify(launch.result)}`);
  assert.ok(all(`SELECT id FROM messages WHERE project_id=? AND kind='invite'`, pid).length >= 4, 'messages sent');
  const n = await answerAll('assessment', (form, i) => { const lv = form.sections.find(s => s.id === 'levels'); return { levels: Object.fromEntries(lv.items.map((it, k) => [it.key, String(1 + ((i + k) % 3))])), evidence: { evidence: 'Exemple concret.' } }; });
  assert.ok(n >= 4);
  await complete('UFT-02-04', 'MP-02.4'); await complete('UFT-02-04', 'MP-02.5');
  assert.ok(all(`SELECT id FROM records WHERE entity='SkillAssessment' AND project_id=?`, pid).length >= 4, 'assessments consolidated');
  await fill('UFT-02-05', 'MP-02.6', 'ai'); await fill('UFT-02-06', 'MP-02.7', 'ai');
  await complete('UFT-02-07', 'MP-03.1');
  const gaps = all(`SELECT data FROM records WHERE entity='SkillGap' AND project_id=?`, pid).map(x => JSON.parse(x.data)); assert.ok(gaps.length >= 4 && gaps.some(g => g.gap_value > 0), 'gaps computed');
  await fill('UFT-02-07', 'MP-03.2', 'ai'); await fill('UFT-02-07', 'MP-28.3', 'template'); await complete('UFT-02-07', 'MP-28.1');
  const panel = await ok('GET', `/tasks/${task('UFT-02-07')}/steps/MP-03.1/panel`); assert.ok(panel.tables[0].rows.length >= 2, 'gap matrix shown');
});

test('plan: objectives, priorities, needs, budget, approval creates the courses, distribution sent', async () => {
  await fill('UFT-01-01', 'MP-01.1', 'ai'); await fill('UFT-01-02', 'MP-01.2', 'ai');
  await fill('UFT-01-03', 'MP-02.1', 'ai'); await fill('UFT-01-03', 'MP-02.2', 'template');
  await complete('UFT-01-04', 'MP-03.1'); await fill('UFT-01-04', 'MP-03.2', 'template');
  assert.ok(all(`SELECT id FROM records WHERE entity='TrainingNeed' AND project_id=? AND json_extract(data,'$.source')='Gap'`, pid).length >= 1, 'needs built');
  await fill('UFT-01-05', 'MP-01.3', 'ai');
  const over = await call('POST', `/tasks/${task('UFT-01-05')}/steps/MP-18.1/rows`, { data: { theme: 'Trop cher', budget: '999999999' } });
  assert.ok(over.status < 300); const c = await call('POST', `/tasks/${task('UFT-01-05')}/steps/MP-18.1/complete`); assert.equal(c.data.error, 'err.flowBudgetOver', 'budget above the envelope refused');
  await ok('DELETE', `/tasks/${task('UFT-01-05')}/steps/MP-18.1/rows/${over.data.id}`);
  await fill('UFT-01-05', 'MP-18.1', 'ai'); await fill('UFT-01-05', 'MP-18.2', 'ai');
  await fill('UFT-01-06', 'MP-19.1', 'ai'); await fill('UFT-01-06', 'MP-19.2', 'ai');
  await fill('UFT-01-07', 'MP-01.4', 'ai');
  await ok('POST', `/projects/${pid}/documents`, { doc_type: 'DT-E2E-01', lang: 'fr' }); await complete('UFT-01-07', 'MP-01.5'); await complete('UFT-01-07', 'MP-04.1');
  await fill('UFT-01-08', 'MP-01.6', 'ai');
  assert.ok(all(`SELECT id FROM records WHERE entity='TrainingCourse' AND project_id=?`, pid).length >= 1, 'courses created at approval');
  const d = await act('UFT-01-08', 'MP-01.7', 'diffuse'); assert.ok(d.sent >= 2, 'plan sent'); await complete('UFT-01-08', 'MP-01.7');
});

test('delivery: review answered, sessions without conflict, invitations confirmed, attendance, closure, invoices', async () => {
  await fill('UFT-05-01', 'MP-06.3', 'ai');
  await answerAll('review', () => ({ approve: { approve: { value: 'Yes', comment: 'Conforme.' } }, comments: { comments: 'RAS' } }));
  await fill('UFT-05-01', 'MP-06.4', 'template'); await fill('UFT-05-01', 'MP-06.6', 'ai');
  await fill('UFT-05-02', 'MP-11.1', 'ai'); await fill('UFT-05-02', 'MP-11.2', 'template');
  await fill('UFT-05-03', 'MP-07.1', 'ai'); await complete('UFT-05-03', 'MP-07.2');
  await fill('UFT-05-04', 'MP-07.3', 'ai');
  const sent = await act('UFT-05-04', 'MP-07.4', 'send'); assert.ok(sent.added >= 1, 'invitations sent'); await complete('UFT-05-04', 'MP-07.4'); await complete('UFT-05-04', 'MP-17.1');
  await answerAll('convocation', () => ({ confirm: { confirm: { value: 'Yes' } } }));
  await fill('UFT-05-05', 'MP-25.1', 'ai'); await fill('UFT-05-05', 'MP-25.2', 'template'); await act('UFT-05-05', 'MP-25.3', 'push'); await complete('UFT-05-05', 'MP-25.3');
  await fill('UFT-05-05', 'MP-25.4', 'template'); await complete('UFT-05-05', 'MP-25.5');
  await fill('UFT-05-06', 'MP-30.1', 'ai'); await fill('UFT-05-06', 'MP-30.2', 'template'); await fill('UFT-05-06', 'MP-30.3', 'template');
  await fill('UFT-05-06', 'MP-30.4', 'template', r => ({ ...r, score: '80', observation: 'Bonne décision.' })); await fill('UFT-05-06', 'MP-30.5', 'ai'); await complete('UFT-05-06', 'MP-30.6');
  await fill('UFT-05-07', 'MP-07.5', 'template');
  assert.ok(all(`SELECT id FROM records WHERE entity='Enrollment' AND project_id=? AND json_extract(data,'$.attendance_status')='Present'`, pid).length >= 1, 'attendance recorded');
  await fill('UFT-05-08', 'MP-07.6', 'ai');
  await fill('UFT-05-09', 'MP-11.5', 'template'); await ok('POST', `/projects/${pid}/documents`, { doc_type: 'DT-E2E-05', lang: 'fr' }); await complete('UFT-05-09', 'MP-11.6');
  const inv = (await ok('POST', `/tasks/${task('UFT-05-09')}/steps/MP-11.3/template`, {})).rows; for (const r of inv) await ok('POST', `/tasks/${task('UFT-05-09')}/steps/MP-11.3/rows`, { data: { ...r, item: 'FAC-1' } });
  if (inv.length) await complete('UFT-05-09', 'MP-11.3');
  await fill('UFT-05-09', 'MP-11.4', 'template');
});

test('evaluation: satisfaction, test scored, observation, progression and indicators', async () => {
  await fill('UFT-07-01', 'MP-09.1', 'template'); await fill('UFT-07-02', 'MP-09.2', 'ai');
  await act('UFT-07-03', 'MP-09.3', 'send'); await answerAll('l1', form => ({ rating: Object.fromEntries(form.sections.find(s => s.id === 'rating').items.map(i => [i.key, '4'])), open: { apply: 'Vérifier les données', improve: 'Plus de cas' } }));
  await complete('UFT-07-03', 'MP-09.3');
  await act('UFT-07-04', 'MP-09.4', 'send');
  const keyQ = one(`SELECT data FROM records WHERE entity='Questionnaire' AND project_id=? AND json_extract(data,'$.purpose')='l2'`, pid); const keys = JSON.parse(keyQ.data).answer_keys;
  await answerAll('l2', form => ({ quiz: Object.fromEntries(Object.entries(keys[form.code]).map(([k, v]) => [k, v.answer])) }));
  const pub = (await ok('GET', `/tasks/${task('UFT-07-04')}/steps/MP-09.4/panel`)).tables[0].rows; assert.ok(pub.every(r => r.pct === 100), 'test scored from the answer key');
  await complete('UFT-07-04', 'MP-09.4');
  await act('UFT-07-05', 'MP-09.5', 'send'); await answerAll('l3', form => ({ levels: Object.fromEntries(form.sections.find(s => s.id === 'levels').items.map(i => [i.key, '3'])), facts: { facts: 'Observé aux urgences.' } }));
  await complete('UFT-07-05', 'MP-09.5'); await complete('UFT-07-06', 'MP-09.6'); await complete('UFT-07-06', 'MP-10.3');
  const k = all(`SELECT kpi_id, value FROM kpi_values WHERE project_id=?`, pid).map(x => x.kpi_id);
  for (const id of ['KPI-012', 'KPI-013', 'FLOW-L2', 'FLOW-ATT']) assert.ok(k.includes(id), `indicator ${id}`);
  await fill('UFT-07-07', 'MP-09.7', 'ai'); await fill('UFT-07-07', 'MP-20.5', 'ai');
  await ok('POST', `/projects/${pid}/documents`, { doc_type: 'DT-E2E-07', lang: 'fr' }); await complete('UFT-07-08', 'MP-10.4');
  await fill('UFT-07-08', 'MP-10.6', 'template'); await fill('UFT-07-08', 'MP-10.2', 'ai');
  assert.ok((await ok('GET', `/projects/${pid}/widgets`)).length >= 1, 'dashboard widgets');
});
