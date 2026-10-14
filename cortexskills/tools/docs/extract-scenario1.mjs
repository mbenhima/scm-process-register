// Extracts scenario 1 (Groupe Hospitalier Maghreb, AI run) for the French paste guide: every phase, process,
// task and step with the exact French column titles of the step table and rows ready to paste (dates JJ/MM/AAAA,
// Oui/Non, list labels in French, KPI as "code (nom)"). Seeded rows are used when the step was done in the run;
// otherwise rows come from the seed generator, from the organization's own context.
// Usage (from tools/docs): node --no-warnings extract-scenario1.mjs
import fs from 'node:fs';
const S = '../../server/';
process.chdir(new URL(S, import.meta.url).pathname);
const { all, one, migrate } = await import(S + 'src/db.js'); migrate();
const cat = await import(S + 'src/catalog.js');
const St = await import(S + 'src/services/steps.js');
const O = await import(S + 'src/services/obs.js');
const { orgCurrencies } = await import(S + 'src/services/money.js');
const { rowFor } = await import(S + 'seed/release110.js');
const { rng, pick } = await import(S + 'src/lib/util.js');
const J = (s, d) => { try { return JSON.parse(s); } catch { return d; } };
const fr = v => (v && typeof v === 'object' && !Array.isArray(v) ? pick(v, 'fr') : v);

const o = one(`SELECT * FROM organizations WHERE email_domain='maghrebhospitalsgr.ma'`);
const p = one(`SELECT * FROM projects WHERE org_id=? AND focus='AI'`, o.id);
const users = all(`SELECT u.id, u.name, u.email, u.title, (SELECT group_concat(r.name,'|') FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id) roles FROM users u WHERE u.org_id=? AND u.active=1`, o.id);
const head = users.find(u => /Head of L&D/.test(u.roles || ''));
const req = { orgId: o.id, lang: 'fr', user: { id: head.id } };
const sector = cat.get('verticalSeed', o.sector);
const pk = O.pickers(o.id);
const ctx = { themes: [...(sector.themes?.ai || []), ...(sector.themes?.digital || []).slice(0, 1)],
  positions: all(`SELECT data FROM records WHERE entity='Position' AND org_id=? LIMIT 6`, o.id).map(x => J(x.data, {}).title).filter(Boolean),
  users: users.map(u => u.name), trainers: ['Atlas Formation Conseil', 'Maghreb Learning Partners', users[0]?.name], kpis: cat.list('kpi').slice(0, 20).map(k => k.id),
  roles: pk.roles.map(x => x.name), functions: pk.functions.map(x => x.name), approver: users.find(u => /HR Director/.test(u.roles || ''))?.name || users[1].name,
  start: new Date(p.start_date).getTime(), object: null };
if (!ctx.positions.length) ctx.positions = [{ en: 'Supervisor', fr: 'Encadrant', ar: 'مؤطر' }];
const r = rng('guide-fr:' + p.id);
const currency = orgCurrencies(o.id).default;
const kpiLabel = id => { const k = cat.get('kpi', id); return k ? `${id} (${k.name.fr})` : String(id); };
const ddmmyyyy = v => { const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : String(v); };
const num = v => { const n = Number(v); if (Number.isNaN(n)) return String(v); const [a, b] = String(n).split('.'); return a.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (b ? ',' + b : ''); };
function cell(f, raw) {
  const v = fr(raw);
  if (f.key === 'currency') return v || currency;
  if (f.type === 'boolean') return v === true || v === 'true' || v === 1 ? 'Oui' : 'Non';
  if (v == null || v === '') return '';
  if (f.type === 'date') return ddmmyyyy(v);
  if (f.type === 'number') return num(v);
  if (f.type === 'kpi') return /^KPI-\d+$/.test(String(v)) ? kpiLabel(v) : String(v);
  if (f.options) { const op = f.options.find(x => String(x.value) === String(v)); if (op) return fr(op.label) || String(op.value); }
  return String(v);
}

const phases = []; let base = 0; let nSteps = 0;
for (const ph of cat.list('phase')) {
  const insts = all(`SELECT * FROM e2e_instances WHERE project_id=? AND phase=? ORDER BY sort`, p.id, ph.no); if (!insts.length) continue;
  const e2es = [];
  for (const ei of insts) {
    const e = cat.get('e2e', ei.e2e_id); const tasks = [];
    for (const t of all(`SELECT * FROM task_instances WHERE e2e_instance_id=? ORDER BY sort`, ei.id)) {
      const u = cat.get('uft', t.uft_id); base++; const steps = [];
      for (const s of St.taskSteps(req, t.id).steps) {
        nSteps++; const d = s.form; ctx.object = d.object;
        const single = d.pattern === 'form' || d.pattern === 'sectioned';
        const fields = d.fields.map(f => ({ key: f.key, label: fr(f.label), type: f.type, required: !!f.required, options: f.options || null }));
        let rows = [];
        if (d.kind !== 'system') {
          if (single) rows = [s.record && Object.keys(s.record.fields || {}).length ? s.record.fields : rowFor(d.kind, base % 5, ctx, r, base)];
          else {
            rows = s.rows.slice(0, d.kind === 'levels' ? 8 : 3);
            if (!rows.length) rows = Array.from({ length: d.kind === 'levels' ? Math.min(ctx.functions.length, 7) : d.kind === 'matrix' || d.kind === 'objectives' ? 3 : 2 }, (_, i) => rowFor(d.kind, i, ctx, r, base));
          }
        }
        steps.push({ id: s.id, name: fr(s.name), role: fr(s.role), type: s.type, kind: d.kind, kindLabel: fr(d.kindLabel), pattern: d.pattern, object: fr(d.object),
          register: d.register ? fr(d.register.name) : null, help: Object.fromEntries(d.fields.map(f => [fr(f.label), fr(f.help) || ''])),
          columns: fields.map(f => ({ key: f.key, label: f.label, required: f.required, type: f.type })), rows: rows.map(row => fields.map(f => cell(f, row[f.key]))) });
      }
      tasks.push({ uft: u.id, name: fr(u.name), owner: fr(u.racsiT?.R) || u.racsi?.R, accountable: fr(u.racsiT?.A) || u.racsi?.A, input: fr(u.input), output: fr(u.output), guidance: fr(J(t.guidance, null)), steps });
    }
    e2es.push({ id: e.id, name: fr(e.name), goal: fr(e.goal), trigger: fr(e.trigger), terminal: fr(e.terminal), tasks });
  }
  phases.push({ no: ph.no, name: fr(ph.name), gate: ph.gate ? { id: ph.gate, name: fr(cat.get('gateSeed', ph.gate)?.name) } : null, e2es });
}
const out = { generatedAt: new Date().toISOString(), org: { name: fr(J(o.name, {})), sector: fr(sector.name), segment: o.segment, employees: o.employees, city: o.city },
  project: { name: fr(J(p.name, {})), focus: p.focus, mode: p.mode, complexity: p.complexity }, login: head.email, headName: head.name, currency,
  people: users.map(u => ({ name: u.name, title: u.title, email: u.email })), functions: ctx.functions.map(fr), roles: ctx.roles.map(fr), themes: ctx.themes.map(fr), phases,
  counts: { phases: phases.length, e2e: phases.reduce((s, x) => s + x.e2es.length, 0), tasks: base, steps: nSteps } };
fs.writeFileSync(new URL('../tools/docs/scenario1-fr.json', 'file://' + process.cwd() + '/').pathname, JSON.stringify(out, null, 1));
console.log(out.counts);
