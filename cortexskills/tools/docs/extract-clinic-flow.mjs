// Private clinic group (Santéora) full run, every end-to-end process: for each process its macro processes, its
// user-facing tasks with owner, evaluator, dates, what was entered (output) and the steps done, from a running
// instance through the API. Usage: node extract-clinic-flow.mjs [baseUrl] [out.json]  → clinic-flow.json
import fs from 'node:fs';
const base = (process.argv[2] || 'http://localhost:4000') + '/api';
const tok = (await (await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'headld@santeora.ma', password: 'CortexSkills#2026' }) })).json()).token;
const g = async p => { const r = await fetch(base + p, { headers: { Authorization: 'Bearer ' + tok } }); if (!r.ok) throw new Error(p + ' ' + r.status); return r.json(); };
const me = await g('/me');
const p = (await g('/projects')).find(x => x.focus === 'AI');
const ws = await g('/projects/' + p.id + '/workspace');
const runs = [];
for (const ph of ws.phases) for (const it of ph.items) {
  const i = await g('/e2e-instances/' + it.id);
  runs.push({ phase: ph.no, phaseName: ph.name, gate: ph.gate || null, id: it.id, e2e: i.e2e, instance: i.instance, tasks: i.tasks.map(t => ({ id: t.id, uft: t.uft_id, title: t.title, status: t.status, owner: t.owner_name, evaluator: t.evaluator_name, started: t.started_at, completed: t.completed_at, output: t.output, steps: t.steps, ai: t.ai_used })) });
}
fs.writeFileSync(process.argv[3] || new URL('./clinic-flow.json', import.meta.url), JSON.stringify({ generatedAt: new Date().toISOString(), org: me.org, user: me.user, project: p, workspace: { counts: ws.counts, kpis: ws.kpis, phases: ws.phases.map(ph => ({ no: ph.no, name: ph.name, gate: ph.gate })) }, runs }));
console.log('runs', runs.length, 'tasks', runs.reduce((a, r) => a + r.tasks.length, 0));
