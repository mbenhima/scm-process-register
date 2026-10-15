// Screenshots of the private-clinic case for the French guide and the visual check of the new step forms: the new
// project screen, each step of the scope and questionnaire campaign, the respondent's page, the documents tab and
// the integrations page. Usage: node shoot-clinic.mjs <baseUrl> <caseJson> <outDir>
import { createRequire } from 'node:module'; import fs from 'node:fs';
const require = createRequire(import.meta.url); const { chromium } = require(process.env.PW || 'playwright');
const [base = 'http://localhost:4000', caseFile, out] = process.argv.slice(2);
const c = JSON.parse(fs.readFileSync(caseFile, 'utf8')); fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 }, locale: 'fr-FR' });
const errors = []; p.on('pageerror', e => errors.push(e.message)); p.on('response', r => { if (r.url().includes('/api/') && r.status() >= 400 && !r.url().includes('/public/')) errors.push(`${r.status()} ${r.url().replace(base, '')}`); });
await p.goto(base + '/login'); await p.fill('input[type=email]', 'headld@cliniquealamal.ma'); await p.fill('input[type=password]', 'CortexSkills#2026'); await p.click('button[type=submit]');
await p.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 20000 });
const token = await p.evaluate(() => Object.entries(localStorage).find(([k]) => /token/i.test(k))?.[1]);
const api = path => p.evaluate(async ([path, t]) => (await fetch('/api' + path, { headers: { Authorization: 'Bearer ' + t } })).json(), [path, token]);
await p.evaluate(async t => fetch('/api/me/language', { method: 'PUT', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ language: 'fr' }) }), token);
const shot = async (name, opts = {}) => { await p.waitForTimeout(opts.wait ?? 700); await p.screenshot({ path: `${out}/${name}.png`, fullPage: !!opts.full }); };
// 1. New project: fields in the order Name, Focus, Description, Template; the template library.
await p.goto(base + '/projects/new'); await p.waitForLoadState('networkidle'); await shot('01_new_project');
await p.locator('#ptpl').click(); await shot('02_template_list'); await p.keyboard.press('Escape');
// 2. Tasks of the case, each step opened.
const pid = c.project.id;
const inst = await api(`/projects/${pid}/workspace`);
const runs = inst.phases.flatMap(ph => ph.items);
const taskOf = async uft => { for (const r of runs) { const i = await api(`/e2e-instances/${r.id}`); const t = i.tasks.find(x => x.uft_id === uft); if (t) return { run: r.id, task: t.id }; } return null; };
const SHOTS = [['UFT-32-01', '10_scope_group_org'], ['UFT-32-02', '11_sector'], ['UFT-32-03', '12_levels'], ['UFT-32-04', '13_matrix'], ['UFT-32-05', '14_orientation'], ['UFT-32-06', '15_stakeholders'], ['UFT-32-08', '16_publish_doc'],
  ['UFT-02-01', '40_competencies'], ['UFT-02-02', '41_targets'], ['UFT-02-03', '42_population'], ['UFT-02-04', '43_assessments'], ['UFT-02-05', '44_proposed'], ['UFT-02-06', '45_validate'], ['UFT-02-07', '46_gaps'],
  ['UFT-01-01', '50_objectives'], ['UFT-01-02', '50b_objfn'], ['UFT-01-03', '51_priorities'], ['UFT-01-04', '52_needs'], ['UFT-01-05', '53_budget'], ['UFT-01-06', '53b_change'], ['UFT-01-07', '53c_file'], ['UFT-01-08', '54_approve'],
  ['UFT-05-01', '60_review'], ['UFT-05-02', '60b_logistics'], ['UFT-05-03', '61_sessions'], ['UFT-05-04', '62_convocations'], ['UFT-05-05', '63_capsules'], ['UFT-05-06', '64_simulation'], ['UFT-05-07', '65_attendance'], ['UFT-05-08', '65b_close'], ['UFT-05-09', '66_invoices'],
  ['UFT-07-01', '70a_instruments'], ['UFT-07-02', '70_questionbank'], ['UFT-07-03', '71_l1'], ['UFT-07-04', '72_l2'], ['UFT-07-05', '73_l3'], ['UFT-07-06', '74_kpis'], ['UFT-07-07', '74b_review'], ['UFT-07-08', '75_report'],
  ['UFT-33-01', '20_templates'], ['UFT-33-02', '21_questions'], ['UFT-33-03', '22_validate'], ['UFT-33-04', '23_racsi'], ['UFT-33-05', '24_channels'], ['UFT-33-06', '25_distribution'], ['UFT-33-07', '26_reminders'], ['UFT-33-08', '27_responses'], ['UFT-33-10', '28_dataset'], ['UFT-33-11', '29_report']];
for (const [uft, name] of SHOTS) {
  const at = await taskOf(uft); if (!at) continue;
  await p.goto(`${base}/runs/${at.run}?task=${at.task}`); await p.waitForLoadState('networkidle'); await p.waitForTimeout(800);
  const heads = p.locator('.drawer .step-head'); const n = await heads.count();
  for (let i = 0; i < n; i++) { const h = heads.nth(i); if ((await h.getAttribute('aria-expanded')) !== 'true') { await h.click(); await p.waitForTimeout(500); } }
  await p.waitForLoadState('networkidle'); await p.waitForTimeout(900);
  await p.locator('.drawer').screenshot({ path: `${out}/${name}.png` }).catch(() => {});
  // The drawer body scrolls: one more picture further down for the long panels.
  await p.locator('.drawer .drawer-body').evaluate(el => { el.scrollTop = el.scrollHeight / 2; }).catch(() => {});
  await p.waitForTimeout(400); await p.locator('.drawer').screenshot({ path: `${out}/${name}_b.png` }).catch(() => {});
  if (uft === 'UFT-32-01') { await p.locator('.drawer [role=tab]', { hasText: 'Documents' }).click().catch(() => {}); await p.waitForTimeout(900); await p.locator('.drawer').screenshot({ path: `${out}/17_documents_tab.png` }).catch(() => {}); }
}
// 3. The respondent's page (the respondent who has not answered yet).
const last = c.tasks.find(t => t.uft === 'UFT-33-06')?.steps[0]?.invitations?.find(i => !c.answered.some(a => a.name === i.name));
if (last) { const ctx2 = await b.newContext({ viewport: { width: 1280, height: 1000 }, locale: 'fr-FR' }); const q = await ctx2.newPage(); q.on('pageerror', e => errors.push('respond: ' + e.message));
  await q.goto(last.url.replace(/^https?:\/\/[^/]+/, base)); await q.waitForLoadState('networkidle'); await q.waitForTimeout(1200);
  await q.screenshot({ path: `${out}/30_respond_top.png` }); await q.mouse.wheel(0, 2200); await q.waitForTimeout(500); await q.screenshot({ path: `${out}/31_respond_middle.png` }); await ctx2.close(); }
// 4. Questionnaire page, integrations.
await p.goto(`${base}/questionnaires/${c.questionnaire.id}?tab=design`); await p.waitForLoadState('networkidle'); await shot('32_questionnaire_design');
await p.goto(`${base}/questionnaires/${c.questionnaire.id}?tab=log`); await p.waitForLoadState('networkidle'); await shot('33_questionnaire_log');
// 5. Campaigns of the real flow: the forms as the people see them; a capsule link still open; the project's widgets.
for (const [purpose, name] of [['assessment', '80_form_assessment'], ['convocation', '81_form_convocation'], ['l2', '82_form_test'], ['l3', '83_form_l3']]) {
  const qid = c.flow?.campaigns?.[purpose];
  if (!qid) continue; await p.goto(`${base}/questionnaires/${qid}?tab=design`); await p.waitForLoadState('networkidle'); await shot(name);
}
const capQ = c.flow?.openCapsule; if (capQ) { const ctx3 = await b.newContext({ viewport: { width: 1100, height: 1000 }, locale: 'fr-FR' }); const q3 = await ctx3.newPage(); await q3.goto(capQ.replace(/^https?:\/\/[^/]+/, base)); await q3.waitForLoadState('networkidle'); await q3.waitForTimeout(1000); await q3.screenshot({ path: `${out}/84_capsule_respond.png` }); await ctx3.close(); }
await p.goto(`${base}/projects/${pid}`); await p.waitForLoadState('networkidle'); await p.waitForTimeout(900); await shot('85_project_widgets', { full: true });
// 6. The three ways to fill a step, on an open step of a temporary project (deleted afterwards).
{ const tpl = (await api('/project-templates/for-creation')).find(x => x.own && /SIMPLE/.test(x.code || ''));
  const tmp = await p.evaluate(async ([tpl, t]) => (await fetch('/api/projects', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ creation_mode: 'catalog', template_id: tpl, name: 'Démo — trois façons de remplir', focus: 'AI', complexity: {} }) })).json(), [tpl.id, token]);
  const ws = await api(`/projects/${tmp.id}/workspace`); const run = ws.phases.flatMap(ph => ph.items).find(x => x.e2e_id === 'E2E-02'); const inst = await api(`/e2e-instances/${run.id}`); const tk = inst.tasks.find(x => x.uft_id === 'UFT-02-01');
  await p.goto(`${base}/runs/${run.id}?task=${tk.id}`); await p.waitForLoadState('networkidle'); await p.waitForTimeout(900);
  { const h = p.locator('.drawer .step-head').first(); if ((await h.getAttribute('aria-expanded')) !== 'true') await h.click(); } await p.waitForTimeout(800);
  await p.locator('.drawer').screenshot({ path: `${out}/90_empty_step.png` }).catch(() => {});
  await p.locator('.drawer button', { hasText: 'Depuis le modèle' }).first().click(); await p.waitForTimeout(1200);
  await p.locator('.drawer .ai-proposal').screenshot({ path: `${out}/91_template_proposal.png` }).catch(() => {});
  await p.locator('.drawer .ai-proposal button', { hasText: /Rejeter tout|Tout rejeter/ }).first().click().catch(() => {}); await p.waitForTimeout(500);
  await p.locator('.drawer button', { hasText: 'Proposer des lignes avec l’IA' }).first().click().catch(() => {}); await p.waitForTimeout(1500);
  await p.locator('.drawer .ai-proposal').screenshot({ path: `${out}/92_ai_proposal.png` }).catch(() => {});
  await p.evaluate(async ([id, t]) => fetch('/api/projects/' + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + t } }), [tmp.id, token]); }
await p.goto(`${base}/admin/channels`); await p.waitForLoadState('networkidle'); await shot('34_channels');
await p.goto(`${base}/admin/integrations`); await p.waitForLoadState('networkidle'); await shot('35_integrations');
console.log(JSON.stringify({ shots: fs.readdirSync(out).length, errors: [...new Set(errors)].slice(0, 30) }, null, 1));
await b.close();
