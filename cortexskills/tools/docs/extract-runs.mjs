// Extracts five complete runs (every phase, process, task and step, with what to type after each step) from
// the seeded database, for the User Guides. Values are the seeded rows when the step was done in the run and,
// for steps not yet reached, values produced by the same generator from the organization's own context.
// Usage (from tools/docs): node --no-warnings extract-runs.mjs
import fs from 'node:fs';
const S = '../../server/';
process.chdir(new URL(S, import.meta.url).pathname);
const { all, one, migrate } = await import(S + 'src/db.js'); migrate();
const cat = await import(S + 'src/catalog.js');
const { describeStep } = await import(S + 'src/services/stepforms.js');
const { rowFor } = await import(S + 'seed/release110.js');
const { rng, pick } = await import(S + 'src/lib/util.js');
const J = (s, d) => { try { return JSON.parse(s); } catch { return d; } };

const RUNS = [
  { key: 'health', domain: 'maghrebhospitalsgr.ma', focus: 'AI' },
  { key: 'auto', domain: 'atlasmotorskenitra.ma', focus: 'Digital' },
  { key: 'aec', domain: 'soussbtpsolutions.ma', focus: 'Digital' },
  { key: 'agri', domain: 'cooperativelaitier.ma', focus: 'AI' },
  { key: 'universal', domain: 'horizonservices.ma', focus: 'AI' },
];
const out = { generatedAt: new Date().toISOString(), runs: [] };
for (const R of RUNS) {
  const o = one(`SELECT * FROM organizations WHERE email_domain=?`, R.domain); const p = one(`SELECT * FROM projects WHERE org_id=? AND focus=?`, o.id, R.focus);
  const users = all(`SELECT u.id, u.name, u.email, (SELECT group_concat(r.name,'|') FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id) roles FROM users u WHERE u.org_id=?`, o.id);
  const sector = o.sector === 'UNI' ? (await import(S + 'src/services/guidance.js')).UNIVERSAL : cat.get('verticalSeed', o.sector);
  const ctx = { themes: [...(sector.themes?.[R.focus === 'AI' ? 'ai' : 'digital'] || []), ...(sector.themes?.[R.focus === 'AI' ? 'digital' : 'ai'] || []).slice(0, 1)],
    positions: all(`SELECT data FROM records WHERE entity='Position' AND org_id=? LIMIT 6`, o.id).map(x => J(x.data, {}).title).filter(Boolean),
    users: users.map(u => u.name), trainers: ['Atlas Formation Conseil', 'Maghreb Learning Partners', users[0]?.name], kpis: cat.list('kpi').slice(0, 20).map(k => k.id),
    roles: all(`SELECT name FROM obs_roles WHERE org_id=? LIMIT 10`, o.id).map(x => J(x.name, {})), approver: users.find(u => /HR Director/.test(u.roles || ''))?.name || users[1].name, start: new Date(p.start_date).getTime(), object: null };
  const r = rng('guide:' + p.id);
  const kpiName = id => { const k = cat.get('kpi', id); return k ? { en: `${id} (${k.name.en})`, fr: `${id} (${k.name.fr})`, ar: `${id} (${k.name.ar})` } : id; };
  const phases = []; let base = 0;
  const gates = Object.fromEntries(all(`SELECT data FROM records WHERE entity='PhaseChecklist' AND project_id=?`, p.id).map(x => J(x.data, {})).filter(g => g.gate_name).map(g => [g.phase, g]));
  for (const ph of cat.list('phase')) {
    const insts = all(`SELECT * FROM e2e_instances WHERE project_id=? AND phase=? ORDER BY sort`, p.id, ph.no); if (!insts.length) continue;
    const e2es = [];
    for (const ei of insts) {
      const e = cat.get('e2e', ei.e2e_id); const tasks = [];
      for (const t of all(`SELECT * FROM task_instances WHERE e2e_instance_id=? ORDER BY sort`, ei.id)) {
        const u = cat.get('uft', t.uft_id); base++; const steps = [];
        for (const sid of u.steps || []) {
          const st = cat.get('step', sid); if (!st) continue;
          const d = describeStep(st, { mpName: cat.get('mp', st.mp)?.name }); ctx.object = d.object;
          const rec = one(`SELECT * FROM step_records WHERE task_instance_id=? AND step_id=?`, t.id, sid);
          const single = d.pattern === 'form' || d.pattern === 'sectioned';
          let rows = [];
          if (d.kind !== 'system') {
            if (single) rows = [rec && Object.keys(J(rec.fields, {})).length ? J(rec.fields, {}) : rowFor(d.kind, base % 5, ctx, r, base)];
            else { rows = rec ? all(`SELECT data FROM step_rows WHERE step_record_id=? ORDER BY sort`, rec.id).map(x => J(x.data, {})) : []; if (!rows.length) rows = [0, 1].map(i => rowFor(d.kind, i, ctx, r, base)); }
          }
          const fields = d.fields.map(f => ({ key: f.key, label: f.label, type: f.type, required: !!f.required, options: f.options || null }));
          const val = (f, v) => { if (v == null || v === '') return null; if (f.options) { const op = f.options.find(x => String(x.value) === String(v)); if (op) return op.label; } if (f.type === 'kpi') return kpiName(v); return v; };
          steps.push({ id: sid, name: st.name, role: st.role, type: st.type, kind: d.kind, kindLabel: d.kindLabel, object: d.object, pattern: d.pattern, register: d.register?.name || null,
            rows: rows.map(row => fields.map(f => ({ label: f.label, value: val(f, row[f.key]), required: f.required })).filter(x => x.value != null)) });
        }
        tasks.push({ uft: u.id, name: u.name, owner: u.racsi?.R, ownerT: u.racsiT?.R || null, accountable: u.racsi?.A, input: u.input, output: u.output, guidance: J(t.guidance, null), steps });
      }
      e2es.push({ id: e.id, name: e.name, goal: e.goal, trigger: e.trigger, terminal: e.terminal, tasks });
    }
    phases.push({ no: ph.no, name: ph.name, gate: ph.gate ? { id: ph.gate, name: cat.get('gateSeed', ph.gate)?.name, items: (gates[ph.no]?.items || []).slice(0, 6).map(i => i.text) } : null, e2es });
  }
  const head = users.find(u => /Head of L&D/.test(u.roles || ''));
  out.runs.push({ key: R.key, org: { name: J(o.name, {}), sector: o.sector, sectorName: sector.name, segment: o.segment, employees: o.employees, city: o.city, domain: o.email_domain, lang: o.default_language },
    project: { name: J(p.name, {}), focus: p.focus, mode: p.mode, track: p.track, complexity: p.complexity }, login: head?.email, themes: ctx.themes, standards: sector.standards, phases,
    counts: { e2e: phases.reduce((s, x) => s + x.e2es.length, 0), tasks: phases.reduce((s, x) => s + x.e2es.reduce((q, e) => q + e.tasks.length, 0), 0), steps: phases.reduce((s, x) => s + x.e2es.reduce((q, e) => q + e.tasks.reduce((z, t) => z + t.steps.length, 0), 0), 0) } });
  console.log(R.key, o.email_domain, out.runs.at(-1).counts);
}
fs.writeFileSync(new URL('./runs-data.json', import.meta.url).pathname.replace('/server/', '/tools/docs/'), JSON.stringify(out));
