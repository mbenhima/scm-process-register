// Adds the catalog names (trilingual) to clinic-flow.json: macro processes of each process, the user-facing task
// (name, description, RACSI) and each step (name, type, role, macro process and macro-process task).
// Usage (from server/): node --no-warnings ../tools/docs/enrich-clinic-flow.mjs
import fs from 'node:fs';
const cat = await import(new URL('../../server/src/catalog.js', import.meta.url));
const F = new URL('./clinic-flow.json', import.meta.url);
const d = JSON.parse(fs.readFileSync(F, 'utf8'));
const mpOf = id => { const m = cat.get('mp', id); return m ? { id, name: m.name } : { id, name: { en: id, fr: id } }; };
for (const r of d.runs) {
  r.mps = (r.e2e.mps || []).map(mpOf);
  for (const t of r.tasks) {
    const u = cat.get('uft', t.uft) || {};
    t.name = u.name; t.description = u.description; t.goal = u.goal; t.racsi = u.racsiT || u.racsi || null; t.bpmn = u.bpmn || u.element || null;
    t.steps = t.steps.map(s => { const st = cat.get('step', s.id) || {}; const tk = st.task ? cat.get('task', st.task) : null;
      return { id: s.id, done: s.done, name: st.name || { en: s.id, fr: s.id }, type: st.type, role: st.role, mp: st.mp, mpName: st.mp ? mpOf(st.mp).name : null, task: st.task, taskName: tk?.name || null }; });
  }
}
fs.writeFileSync(F, JSON.stringify(d));
const steps = d.runs.flatMap(r => r.tasks.flatMap(t => t.steps));
console.log('runs', d.runs.length, 'tasks', d.runs.reduce((a, r) => a + r.tasks.length, 0), 'steps', steps.length, 'distinct', new Set(steps.map(s => s.id)).size,
  'mps', new Set(d.runs.flatMap(r => r.mps.map(m => m.id))).size, 'mpTasks', new Set(steps.map(s => s.task)).size, 'missing names', steps.filter(s => s.name.en === s.id).length);
// KPI names and units, the published documents (clinic-flow-docs.json, from /projects/:id/documents) and the people.
const d2 = JSON.parse(fs.readFileSync(F, 'utf8'));
d2.workspace.kpis = d2.workspace.kpis.map(k => { const c = cat.get('kpi', k.kpi_id) || {}; return { ...k, name: c.name, type: c.type, unit: c.unit || null, mp: c.mp || null }; });
const DF = new URL('./clinic-flow-docs.json', import.meta.url);
if (fs.existsSync(DF)) d2.documents = JSON.parse(fs.readFileSync(DF, 'utf8')).filter(x => x.status === 'Published').map(x => ({ type: x.doc_type, lang: x.lang, title: x.title, e2e: x.e2e_id || null, author: x.author, approver: x.approver }));
d2.people = [...new Set(d2.runs.flatMap(r => r.tasks.flatMap(t => [t.owner, t.evaluator])).filter(Boolean))];
fs.writeFileSync(F, JSON.stringify(d2));
console.log('kpis', d2.workspace.kpis.length, 'documents', d2.documents?.length, 'people', d2.people.length);
