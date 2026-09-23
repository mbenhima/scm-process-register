// Counts every source element as served by the running API, per organization.
const B = 'http://localhost:4000/api';
const login = async (email, password) => (await (await fetch(`${B}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) })).json()).token;
const tok = await login('admin@cortexplm.example', 'Admin#2026');
const get = async (p, org) => { const r = await fetch(B + p, { headers: { authorization: `Bearer ${tok}`, ...(org ? { 'x-org-id': String(org) } : {}) } }); if (!r.ok) return { error: r.status }; return r.json(); };
const out = {};
const len = (x) => (Array.isArray(x) ? x.length : x?.error ? `ERR ${x.error}` : '?');
const mps = await get('/reference/macro-processes', 1); out.macroProcesses = len(mps); out.d01 = mps.filter((m) => m.d01).length; out.sipoc = mps.filter((m) => m.suppliers && m.inputs && m.outputs && m.customers).length;
const e2e = await get('/reference/e2e', 1); out.e2e = len(e2e);
let uft = 0; for (const e of e2e) { const d = await get(`/reference/e2e/${e.id}`, 1); uft += d.tasks?.length || 0; } out.uft = uft;
out.ufs = len(await get('/reference/ufs', 1)); out.steps = len(await get('/reference/steps', 1));
const cov = await get('/reference/coverage', 1); out.coverageRows = len(cov.matrix);
const tr = await get('/reference/tracks', 1); out.trackMatrix = len(tr.matrix); out.trackRules = len(tr.rules); out.scoringCriteria = len(tr.criteria); out.thresholds = len(tr.thresholds);
const g = await get('/reference/gates', 1); out.gates = len(g.gates); out.outcomes = len(g.outcomes); out.gateRoles = len(g.roles);
const f = await get('/reference/findings', 1); out.findings = len(f.findings); out.glossary = len(f.glossary);
const dm = await get('/reference/data-model', 1); out.d09 = len(dm.classes); out.d10 = len(dm.attributes);
out.d15b = len(await get('/reference/role-menus', 1)); out.d03a = len(await get('/reference/actions', 1));
out.d07 = len(await get('/reference/alert-catalog', 1)); out.srs = len(await get('/reference/srs', 1));
const cat = await get('/catalog', 1); for (const k of ['packs', 'integrations', 'addons', 'bundles']) out[`catalog_${k}`] = len(cat[k]); out.volumeDiscounts = len(cat.volumeDiscounts); out.reviewNotes = cat.reviewNotes ? Object.keys(cat.reviewNotes).length : 0;
out.d08 = len(await get('/reports', 1));
const orgs = await get('/organizations');
out.orgs = [];
for (const o of orgs) {
  const row = { org: o.name, industry: o.industry };
  row.d03 = len(await get('/business-rules', o.id)); row.d04 = len(await get('/controls', o.id)); row.d05 = len(await get('/risks', o.id));
  const k = await get('/kpis', o.id); row.d06 = len(k.kpis || k); row.d15 = len(await get('/ai/use-cases', o.id)); row.racsi = len(await get('/racsi', o.id));
  row.bpmn = len(await get('/bpmn', o.id)); row.projects = len(await get('/projects', o.id)); row.users = len(await get('/users', o.id));
  const lic = await get('/licence', o.id); row.licence = `${lic.mode} ${lic.status} ${lic.seatsUsed}/${lic.maxUsers}`;
  out.orgs.push(row);
}
console.log(JSON.stringify(out, null, 1));
