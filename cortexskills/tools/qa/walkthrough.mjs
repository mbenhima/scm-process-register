// User Guide walkthrough replay (NFR-DA-MAINT-06): runs the guide's main steps against a freshly seeded
// instance through the API and fails loudly when a step no longer works. Usage: node walkthrough.mjs [baseUrl]
const base = process.argv[2] || 'http://localhost:4000';
const PASS = 'CortexSkills#2026';
let failures = 0;
const step = async (name, fn) => { try { const r = await fn(); console.log('  ✓', name, r ? '— ' + r : ''); } catch (e) { failures++; console.log('  ✗', name, '—', e.message); } };
const api = async (token, method, path, body, lang = 'en') => {
  const res = await fetch(base + '/api' + path, { method, headers: { 'Content-Type': 'application/json', 'Accept-Language': lang, ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const type = res.headers.get('content-type') || '';
  const data = type.includes('json') ? await res.json() : Buffer.from(await res.arrayBuffer());
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${type.includes('json') ? JSON.stringify(data).slice(0, 200) : ''}`);
  return { data, type, disposition: res.headers.get('content-disposition') };
};
const login = async (email, password = PASS) => (await api(null, 'POST', '/auth/login', { email, password })).data.token;

async function scenario(title, email, lang) {
  console.log(`\n${title} (${email}, ${lang})`);
  const tok = await login(email);
  await api(tok, 'PUT', '/me/language', { language: lang });
  const me = (await api(tok, 'GET', '/me')).data;
  const projects = (await api(tok, 'GET', '/projects')).data;
  await step('Organization has its full runs (Digital and AI)', () => { const f = new Set(projects.map(p => p.focus)); if (!f.has('Digital') || !f.has('AI')) throw new Error('missing focus ' + [...f]); return projects.length + ' projects'; });
  const p = projects.find(x => x.focus === 'AI') || projects[0];
  const ws = (await api(tok, 'GET', `/projects/${p.id}/workspace`)).data;
  await step('Workspace shows every phase with E2E runs', () => { const n = ws.phases.reduce((s, ph) => s + ph.items.length, 0); if (!n) throw new Error('no runs'); return `${ws.phases.length} phases, ${n} E2E runs`; });
  // Find the first task that can be completed now (previous task done, not completed itself).
  let target = null;
  for (const ph of ws.phases) for (const run of ph.items) {
    if (target) break;
    const inst = (await api(tok, 'GET', `/e2e-instances/${run.id}`)).data;
    const i = inst.tasks.findIndex((t, k) => t.status !== 'Completed' && t.status !== 'Blocked' && (k === 0 || inst.tasks[k - 1].status === 'Completed'));
    if (i >= 0) target = inst.tasks[i];
  }
  await step('Open a task and read "what to type"', async () => { const t = (await api(tok, 'GET', `/tasks/${target.id}`)).data; const g = t.guidance || t.task?.guidance; if (!g) throw new Error('no guidance'); return (typeof g === 'object' ? g[lang] || g.en : g).slice(0, 70) + '…'; });
  await step('Generate an AI suggestion (Assistive, deterministic engine)', async () => {
    const ucs = (await api(tok, 'GET', '/ai/use-cases')).data; const uc = (ucs.items || ucs).find(u => u.active !== false && u.effective !== false) || (ucs.items || ucs)[0];
    const g = (await api(tok, 'POST', '/ai/generate', { code: uc.code || uc.id, project_id: p.id })).data;
    await api(tok, 'POST', '/ai/usage', { outcome: 'Accepted', use_case: uc.code || uc.id, project_id: p.id, record_ref: target.id, confidence: g.confidence, source: g.source });
    return `${uc.code || uc.id}: ${String(g.text).slice(0, 60)}…`;
  });
  await step('Complete the task with its output', async () => {
    if (target.status === 'Not started') await api(tok, 'PATCH', `/tasks/${target.id}`, { status: 'In progress' });
    const r = (await api(tok, 'PATCH', `/tasks/${target.id}`, { status: 'Completed', output: 'Walkthrough output ' + new Date().toISOString().slice(0, 10) })).data;
    if (r.task.status !== 'Completed') throw new Error('status ' + r.task.status); return `project progress ${Math.round(r.projectProgress)}%, REX prompt ${r.rexPrompt}`;
  });
  await step('Ask the AI Assistant a data question', async () => { const a = (await api(tok, 'POST', '/assistant/ask', { question: lang === 'fr' ? 'combien de tâches en retard' : lang === 'ar' ? 'كم مهمة متأخرة' : 'how many overdue tasks' })).data; if (a.refused) throw new Error('refused ' + a.permission); return a.answer; });
  await step('Ask the AI Assistant a how-to question', async () => { const a = (await api(tok, 'POST', '/assistant/ask', { question: 'How do I export a report?' })).data; if (a.mode !== 'help') throw new Error('mode ' + a.mode); return (a.references || []).length + ' references'; });
  const reports = (await api(tok, 'GET', '/reports')).data; const rep = (reports.items || reports)[0];
  for (const fmt of ['pdf', 'xlsx', 'docx']) await step(`Export report ${rep.id} as ${fmt.toUpperCase()}`, async () => { const r = await api(tok, 'GET', `/reports/${rep.id}/export?format=${fmt}&project=${p.id}`); if (r.data.length < 1000) throw new Error('file too small'); return `${r.data.length} bytes, ${r.disposition}`; });
  await step('Draft a new project with AI', async () => { const d = (await api(tok, 'POST', '/projects/ai-draft', { description: 'Digital skills plan for the maintenance team, two sites, quality audit next year' })).data; const v = k => d.items.find(i => i.key === k); if (!v('phases')?.value?.length) throw new Error('no phases'); return `mode ${v('mode').value}, track ${v('track').value || '—'}, complexity ${v('complexity').score}, ${v('phases').value.length} phases, template ${v('template_id').value ? 'found' : 'none'}`; });
  await step('Dashboard loads', async () => { const d = (await api(tok, 'GET', '/dashboard')).data; return Object.keys(d).slice(0, 5).join(', '); });
  return me;
}

const accounts = [
  ['Large account — any sector', 'headld@atlasmotorskenitra.ma', 'fr'],
  ['SME — any sector', 'headld@tangerautoparts.ma', 'en'],
];
// Resolve AEC-construction and healthcare SME accounts through the platform administrator.
const admin = await login('admin@cortexskills.app', 'Admin#2026');
const orgs = (await api(admin, 'GET', '/organizations')).data;
for (const [label, sector] of [['SME — AEC construction', 'AEC'], ['SME — Healthcare', 'HCPR']]) {
  const o = orgs.find(x => x.sector === sector && x.segment === 'SME');
  if (o?.email_domain) accounts.push([label, 'headld@' + o.email_domain, label.includes('Health') ? 'ar' : 'fr']);
}
for (const [title, email, lang] of accounts) await scenario(title, email, lang).catch(e => { failures++; console.log('  ✗ scenario failed —', e.message); });
console.log(failures ? `\n${failures} step(s) failed` : '\nAll walkthrough steps passed');
process.exit(failures ? 1 : 0);
