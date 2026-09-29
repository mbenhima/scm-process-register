// Per-sector facts for the presentations: large and SME organization of each vertical, progress of both runs,
// and sample "what to type" texts. Usage: node extract-sectors.mjs [baseUrl]
import fs from 'node:fs';
const base = process.argv[2] || 'http://localhost:4000';
const api = async (tok, path, init = {}) => { const r = await fetch(base + '/api' + path, { ...init, headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) } }); if (!r.ok) throw new Error(path + ' ' + r.status); return r.json(); };
const login = async (email, password = 'CortexSkills#2026') => (await api(null, '/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })).token;
const admin = await login('admin@cortexskills.app', 'Admin#2026');
const orgs = await api(admin, '/organizations');
const verticals = await api(admin, '/catalog/verticalSeed');
const SAMPLE = ['UFT-33-01', 'UFT-20-04', 'UFT-03-04'];
const out = [];
for (const v of verticals) {
  const row = { code: v.id, name: v.name, vertical: v, orgs: {} };
  for (const seg of ['LARGE', 'SME']) {
    const o = orgs.find(x => x.sector === v.id && x.segment === seg); if (!o) continue;
    const tok = await login('headld@' + o.email_domain); const projects = await api(tok, '/projects');
    const runs = {};
    for (const p of projects) {
      const ws = await api(tok, `/projects/${p.id}/workspace`);
      const samples = {};
      for (const ph of ws.phases) for (const it of ph.items) {
        if (!['E2E-33', 'E2E-20', 'E2E-03', 'SME-E2E-01'].includes(it.e2e_id)) continue;
        const inst = await api(tok, '/e2e-instances/' + it.id);
        for (const t of inst.tasks) if (SAMPLE.includes(t.uft_id) || (!Object.keys(samples).length && t.status === 'Completed')) samples[t.uft_id] = { name: null, guidance: t.guidance };
      }
      runs[p.focus] = { name: p.name, progress: Math.round(ws.project.progress), done: ws.counts.done, total: ws.counts.n, overdue: ws.counts.overdue, mode: p.mode, track: p.track, samples };
    }
    row.orgs[seg] = { name: o.name, city: o.city, employees: o.employees, domain: o.email_domain, group: o.group_name, runs };
  }
  out.push(row); console.log(v.id, Object.keys(row.orgs).join('/'));
}
fs.writeFileSync(new URL('./sector-data.json', import.meta.url), JSON.stringify(out));
