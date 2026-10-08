// Screenshot pack of the whole application for one organization and one language.
// Usage: [ADMIN_EMAIL=...] node shoot-pack.mjs <base> <email> <password> <en|fr> <outDir>
// Administration screens (/admin/...) are taken with ADMIN_EMAIL (the organization administrator) when given.
// Writes NNN_<name>.png and manifest.json ([{ file, title, path }]); the title is the page heading as shown on screen.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || 'playwright');
const [base, email, password, lang, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 }); const page0 = page;
await page.goto(base + '/login');
await page.screenshot({ path: `${out}/000_login.png` });
await page.fill('input[type=email], input[name=email]', email); await page.fill('input[type=password]', password);
await page.click('button[type=submit]'); await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 20000 });
const token = await page.evaluate(() => Object.entries(localStorage).find(([k]) => /token/i.test(k))?.[1]);
const api = p => page.evaluate(async ([p, t]) => { const r = await fetch('/api' + p, { headers: { Authorization: 'Bearer ' + t } }); return r.ok ? r.json() : null; }, [p, token]);
await page.evaluate(async ([t, l]) => fetch('/api/me/language', { method: 'PUT', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ language: l }) }), [token, lang]);
{ const b = page.getByRole('button', { name: lang.toUpperCase(), exact: true }); if (await b.count()) { await b.first().click(); await page.waitForTimeout(600); } }

// Detail screens: the AI project, its runs, an open task, documents, a questionnaire, a module.
const projects = (await api('/projects')) || [];
const proj = projects.find(p => String(p.focus).toLowerCase() === 'ai') || projects[0];
const ws = proj ? await api('/projects/' + proj.id + '/workspace') : null;
const runs = (ws?.phases || []).flatMap(ph => ph.items || []);
const runA = runs.find(r => /E2E-04|E2E-05/.test(r.e2e_id || r.code || '')) || runs[3] || runs[0];
const inst = runA ? await api('/e2e-instances/' + runA.id) : null;
const task = (inst?.tasks || []).find(t => (t.steps || []).length) || (inst?.tasks || [])[0];
const docs = proj ? (await api('/projects/' + proj.id + '/documents')) || [] : [];
const doc = code => docs.find(d => d.doc_type === code && d.lang === lang) || docs.find(d => d.doc_type === code);
const qs = (await api('/questionnaires')) || []; const q = (Array.isArray(qs) ? qs : qs.items || [])[0];
const mods = (await api('/modules')) || []; const mod = (Array.isArray(mods) ? mods : mods.items || [])[0];

const list = [
  ['dashboard', '/'], ['my_tasks', '/my-tasks'], ['alerts', '/alerts'], ['assistant', '/assistant'],
  ['groups_organizations', '/tenancy'], ['projects', '/projects'], ['new_project', '/projects/new'],
  proj && ['project_workspace', '/projects/' + proj.id], proj && ['project_gantt', '/projects/' + proj.id + '/gantt'],
  runA && ['run', '/runs/' + runA.id], runA && task && ['run_task_steps', '/runs/' + runA.id + '?task=' + task.id],
  ['portfolio', '/portfolio'], ['modules', '/modules'], mod && ['module_workspace', '/modules/' + (mod.id || mod.code)],
  ['business_records', '/records'], ['questionnaires', '/questionnaires'], ['questionnaire_templates', '/questionnaires/templates'],
  q && ['questionnaire', '/questionnaires/' + q.id], ['training_plan', '/training-plan'],
  ['process_design', '/process/design'], ['macro_processes', '/process/mp'], ['e2e_processes', '/process/e2e'], ['e2e_chain', '/process/chain'],
  ['coverage', '/process/coverage'], ['bpmn', '/process/bpmn'], ['sectors', '/process/verticals'], ['sme_tracks', '/process/sme'],
  ['project_templates', '/process/templates'], ['gates', '/process/gates'], ['checklists', '/process/checklists'], ['information_model', '/process/model'],
  ['business_rules', '/gov/rules'], ['controls', '/gov/controls'], ['risks', '/gov/risks'], ['kpis', '/gov/kpis'], ['alert_settings', '/gov/alert-settings'],
  ['racsi', '/gov/racsi'], ['obs', '/gov/obs'], ['registers', '/registers'], ['audits', '/gov/audits'], ['lessons_learned', '/gov/rex'], ['gantt_portfolio', '/gov/gantt'],
  ['ai_use_cases', '/ai/use-cases'], ['ai_usage', '/ai/usage'], ['knowledge_base', '/ai/kb'], ['ai_model', '/ai/model'], ['ai_settings', '/ai/settings'],
  ['reports', '/reports'], ['documents', '/documents'],
  doc('DT-TER') && ['document_training_engineering_report', '/documents/' + doc('DT-TER').id],
  doc('DT-PLAN') && ['document_training_plan', '/documents/' + doc('DT-PLAN').id],
  ['document_templates', '/documents/templates'], ['document_layout', '/documents/layout'], ['master_list', '/documents/master-list'], ['benchmark', '/benchmark'],
  ['users', '/admin/users'], ['permission_matrix', '/admin/permissions'], ['configuration_licence', '/admin/config'], ['pricing', '/admin/pricing'],
  ['integrations', '/admin/integrations'], ['channels', '/admin/channels'], ['sme_onboarding', '/admin/onboarding'], ['audit_trail', '/admin/audit'],
  ['backups_health', '/admin/backups'], ['traceability', '/admin/traceability'], ['settings', '/settings'], ['help', '/help'],
].filter(Boolean);

let adminPage = null;
if (process.env.ADMIN_EMAIL) {
  adminPage = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
  await adminPage.goto(base + '/login'); await adminPage.fill('input[type=email]', process.env.ADMIN_EMAIL); await adminPage.fill('input[type=password]', password);
  await adminPage.click('button[type=submit]'); await adminPage.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 20000 });
  const b = adminPage.getByRole('button', { name: lang.toUpperCase(), exact: true }); if (await b.count()) { await b.first().click(); await adminPage.waitForTimeout(600); }
}
const manifest = [{ file: '000_login.png', title: lang === 'fr' ? 'Connexion' : 'Sign in', path: '/login' }];
let n = 0;
for (const [name, p] of list) {
  const page = adminPage && p.startsWith('/admin') ? adminPage : page0;
  try {
    await page.goto(base + p); await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {}); await page.waitForTimeout(900);
    if (!(await page.locator('main h1, h1').count())) continue; // screen not available to this role or pack
    const title = (await page.locator('main h1, h1').first().innerText()).trim().replace(/\s+/g, ' ');
    const file = `${String(++n).padStart(3, '0')}_${name}.png`;
    await page.screenshot({ path: `${out}/${file}` }); manifest.push({ file, title, path: p.replace(/[0-9a-f-]{36}/g, ':id') });
  } catch (e) { console.warn('skip', name, e.message); }
}
// Profile menu and the Change password dialog.
try {
  await page.goto(base + '/'); await page.waitForTimeout(800);
  await page.locator('button[aria-haspopup=menu]').last().click(); await page.mouse.move(700, 600); await page.waitForTimeout(600);
  let file = `${String(++n).padStart(3, '0')}_profile_menu.png`; await page.screenshot({ path: `${out}/${file}` }); manifest.push({ file, title: lang === 'fr' ? 'Menu du profil' : 'Profile menu', path: '/' });
  await page.getByRole('menuitem', { name: lang === 'fr' ? 'Changer le mot de passe' : 'Change password' }).click(); await page.waitForTimeout(600);
  file = `${String(++n).padStart(3, '0')}_change_password.png`; await page.screenshot({ path: `${out}/${file}` }); manifest.push({ file, title: lang === 'fr' ? 'Changer le mot de passe' : 'Change password', path: '/' });
} catch (e) { console.warn('skip profile', e.message); }
fs.writeFileSync(`${out}/manifest.json`, JSON.stringify(manifest, null, 1));
console.log(out, manifest.length, 'screens');
await browser.close();
