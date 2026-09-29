// Extracts the User Guide content from a freshly seeded instance, so the guide always matches the app
// (NFR-DA-MAINT-06). Usage: node extract.mjs [baseUrl] [out.json]
import fs from 'node:fs';
const base = process.argv[2] || 'http://localhost:4000';
const outFile = process.argv[3] || new URL('./guide-data.json', import.meta.url).pathname;
const api = async (tok, path, init = {}) => { const r = await fetch(base + '/api' + path, { ...init, headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) } }); if (!r.ok) throw new Error(path + ' ' + r.status); return r.json(); };
const login = async (email, password = 'CortexSkills#2026') => (await api(null, '/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })).token;

const admin = await login('admin@cortexskills.app', 'Admin#2026');
const orgs = await api(admin, '/organizations');
const AUD = [
  { key: 'large', title: { en: 'Large and big companies (any sector)', fr: 'Grandes entreprises (tout secteur)' }, pick: o => o.segment === 'LARGE' && o.sector === 'AUTO' },
  { key: 'sme', title: { en: 'SMEs (any sector)', fr: 'PME (tout secteur)' }, pick: o => o.segment === 'SME' && o.sector === 'AUTO' },
  { key: 'aec', title: { en: 'SMEs in AEC (architecture, engineering, construction)', fr: 'PME du BTP (architecture, ingénierie, construction)' }, pick: o => o.segment === 'SME' && o.sector === 'AEC' },
  { key: 'health', title: { en: 'SMEs in healthcare', fr: 'PME de la santé' }, pick: o => o.segment === 'SME' && o.sector === 'HCPR' },
];
const tok0 = await login('headld@' + orgs.find(AUD[0].pick).email_domain);
const [ufts, steps, phases, verticals, roles, dm, legend, gates] = await Promise.all(['uft', 'step', 'phase', 'verticalSeed', 'role', 'decisionMatrix', 'legend', 'gateSeed'].map(k => api(tok0, '/catalog/' + k)));
const U = Object.fromEntries(ufts.map(u => [u.id, u])), S = Object.fromEntries(steps.map(s => [s.id, s])), V = Object.fromEntries(verticals.map(v => [v.id, v]));
const data = { generatedAt: new Date().toISOString(), phases, roles: roles.map(r => ({ id: r.id, name: r.name })), decisionMatrix: dm[0], legend, gates, audiences: [] };
for (const a of AUD) {
  const o = orgs.find(a.pick); const email = 'headld@' + o.email_domain; const tok = await login(email);
  const projects = await api(tok, '/projects'); const runs = {};
  for (const p of projects) {
    const ws = await api(tok, `/projects/${p.id}/workspace`); const ph = [];
    for (const phase of ws.phases) {
      const e2es = [];
      for (const it of phase.items) {
        const inst = await api(tok, '/e2e-instances/' + it.id);
        e2es.push({ id: inst.e2e.id, name: inst.e2e.name, goal: inst.e2e.goal, trigger: inst.e2e.trigger, terminal: inst.e2e.terminal, tasks: inst.tasks.map(t => ({ uft: t.uft_id, name: U[t.uft_id]?.name, racsi: U[t.uft_id]?.racsi, steps: (U[t.uft_id]?.steps || []).map(s => ({ id: s, name: S[s]?.name })), guidance: t.guidance, status: t.status, owner: t.owner_name })) });
      }
      ph.push({ no: phase.no, name: phase.name, gate: phase.gate, e2es });
    }
    runs[p.focus] = { name: p.name, mode: p.mode, track: p.track, complexity: p.complexity_score ?? ws.complexity?.score ?? null, phases: ph };
  }
  data.audiences.push({ key: a.key, title: a.title, org: { name: o.name, sector: o.sector, sectorName: V[o.sector]?.name, segment: o.segment, employees: o.employees, city: o.city, group: o.group_name, domain: o.email_domain, login: email, lang: o.default_language }, runs });
  console.log(a.key, o.email_domain, Object.keys(runs).join('/'), Object.values(runs).map(r => r.phases.reduce((s, x) => s + x.e2es.reduce((q, e) => q + e.tasks.length, 0), 0)).join('/'), 'tasks');
}
fs.writeFileSync(outFile, JSON.stringify(data));
console.log('written', outFile, Math.round(fs.statSync(outFile).size / 1024) + ' KB');
