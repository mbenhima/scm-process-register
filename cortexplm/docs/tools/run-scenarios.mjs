// Replays the User Guide walkthroughs against a running server and writes what happened to a JSON log.
// Usage: node run-scenarios.mjs http://localhost:4000 out.json   (use a freshly seeded database)
import fs from 'node:fs';
import { SCENARIOS, outputFor, evidenceFor, RATIONALE, RECYCLE_RATIONALE, TEAM_PASSWORD } from './scenarios.mjs';

const BASE = `${process.argv[2] || 'http://localhost:4000'}/api`;
const OUT = process.argv[3] || 'scenario-log.json';
const PASS = { 'admin@cortexplm.example': 'Admin#2026' };
const passFor = (email) => PASS[email] || (SCENARIOS.some((s) => email.endsWith(`@${s.org}`)) ? TEAM_PASSWORD : 'Demo#2026');
const plusDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

async function session(email) {
  const r = await fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: passFor(email) }) });
  const { token, error } = await r.json(); if (!token) throw new Error(`login ${email}: ${error}`);
  const call = async (method, path, body) => {
    const res = await fetch(BASE + path, { method, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${method} ${path} (${email}): ${data.error || res.status}`);
    return data;
  };
  const me = await call('GET', '/auth/me');
  return { email, me, get: (p) => call('GET', p), post: (p, b) => call('POST', p, b || {}), put: (p, b) => call('PUT', p, b || {}) };
}

async function runScenario(s) {
  const log = { id: s.id, title: s.title, steps: [] };
  // Step 0: Group (Yes / No) > Organization (with its starting team) > then the project below.
  const admin = await session('admin@cortexplm.example');
  let groupId = null; log.tenancy = { group: s.tenancy.group ? { ...s.tenancy.group } : null, org: { ...s.tenancy.org, domain: s.org, password: TEAM_PASSWORD } };
  if (s.tenancy.group) {
    const found = (await admin.get('/groups')).find((g) => g.name === s.tenancy.group.name);
    groupId = found ? found.id : (await admin.post('/groups', { name: s.tenancy.group.name, description: s.tenancy.group.description })).id;
    log.tenancy.group.created = !found;
  }
  const org = await admin.post('/organizations', { ...s.tenancy.org, group_id: groupId, default_language: 'en', starter_team: true, domain: s.org, initial_password: TEAM_PASSWORD });
  log.tenancy.org.id = org.id; log.tenancy.org.users = org.users;
  const pm = await session(`${s.pm}@${s.org}`); const ex = await session(`${s.exec}@${s.org}`);
  log.pm = { email: pm.email, name: pm.me.user.name }; log.exec = { email: ex.email, name: ex.me.user.name };
  log.org = pm.me.organization.name; log.industry = pm.me.organization.industry;
  if (s.observationDays !== undefined) {
    const ad = await session(`${s.admin}@${s.org}`);
    await ad.put('/settings', { light_observation_days: s.observationDays });
    log.setup = { email: ad.email, name: ad.me.user.name, observationDays: s.observationDays };
  }
  let p;
  if (s.existing) {
    p = (await pm.get('/projects')).find((x) => x.code === s.existing);
  } else {
    const dir = await pm.get('/directory');
    const sponsor = dir.find((u) => u.id === ex.me.user.id);
    const rec = await pm.post('/reference/recommend-track', { scores: s.project.scores, safety_critical: !!s.project.safety_critical });
    p = await pm.post('/projects', { ...s.project, sponsor_id: sponsor.id, optional_mps: [] });
    log.created = { code: p.code, track: p.track, total: rec.total, recommended: rec.recommended, sponsor: sponsor.name };
  }
  log.code = p.code; log.name = p.name;
  const gateCount = {}; let skipped = false; let recycled = false; let evaluated = false;
  for (let guard = 0; guard < 400; guard += 1) {
    const full = await pm.get(`/projects/${p.id}`);
    if (full.status !== 'Active') { log.finalStatus = full.status; break; }
    const run = full.runs.find((r) => r.status === 'In progress' && r.tasks.some((t) => !['Done', 'Skipped'].includes(t.status) && t.kind !== 'gate'))
      || full.runs.find((r) => r.status === 'In progress' && r.gate && r.gate.status === 'Open');
    if (!run) { log.finalStatus = `${full.status} (${full.runs.filter((r) => ['In progress', 'Scheduled'].includes(r.status)).map((r) => `${r.e2e_id} ${r.status}`).join(', ') || 'no open run'})`; break; }
    const task = run.tasks.find((t) => !['Done', 'Skipped'].includes(t.status) && t.kind !== 'gate');
    if (task) {
      const d = await pm.get(`/tasks/${task.id}`);
      const step = { type: task.kind, e2e: run.e2e_id, e2eName: run.name, runNo: run.run_no, branch: run.branch, uft: task.uft_id, name: task.name, owner: task.owner_name, evaluator: task.evaluator_name, light: !!task.light_form };
      if (task.kind === 'work') {
        if (s.skipUft === task.uft_id && !skipped && task.data?.r2Skippable) {
          step.skipReason = 'The dependent macro process is not activated in the Fast Track.';
          await pm.post(`/tasks/${task.id}/skip`, { reason: step.skipReason }); skipped = true; step.skipped = true;
        } else {
          const vals = { ...(s.forms[task.uft_id] || {}) };
          for (const [k, v] of Object.entries(vals)) if (typeof v === 'string' && /^\+\d+$/.test(v)) vals[k] = plusDays(Number(v.slice(1)));
          step.fields = d.form.filter((f) => vals[f.key] !== undefined).map((f) => ({ label: f.label, value: vals[f.key], type: f.type }));
          step.output = outputFor(s, task, p.code);
          const r = await pm.post(`/tasks/${task.id}/complete`, { data: vals, output: step.output });
          step.effects = r.effects?.map((e) => e.message) || [];
          if (!evaluated && s.id === 1 && task.evaluator_id) {
            const evaluator = task.evaluator_id === ex.me.user.id ? ex : null;
            if (evaluator) { await evaluator.post(`/tasks/${task.id}/evaluate`, { verdict: 'Effective', notes: 'Clear and complete.' }); step.evaluation = { by: ex.me.user.name, verdict: 'Effective', notes: 'Clear and complete.' }; evaluated = true; }
          }
        }
      } else {
        step.gate = d.gate.gate;
        if (s.addTemplateAt?.gate === d.gate.gate && !step.addedTemplate) {
          const tpl = (await pm.get(`/checklist-templates?gate=${d.gate.gate}&track=${p.track}`)).find((x) => x.name === s.addTemplateAt.name);
          const r = await pm.post(`/gates/${d.gate.id}/checklist/from-template`, { templateId: tpl.id });
          step.addedTemplate = { name: tpl.name, added: r.added };
          Object.assign(d, await pm.get(`/tasks/${task.id}`));
        }
        step.items = d.checklist.map((c) => ({ seq: c.seq, text: c.text, mandatory: !!c.mandatory }));
        for (const c of d.checklist.filter((x) => x.mandatory && !['Complete', 'Waived'].includes(x.status))) await pm.put(`/checklist/${c.id}`, { action: 'complete', evidence: evidenceFor(p.code, d.gate.gate, c.seq) });
        await pm.post(`/tasks/${task.id}/complete`, {});
      }
      log.steps.push(step);
      continue;
    }
    // Gate: submit, then the executive decides.
    const g = run.gate;
    await pm.post(`/gates/${g.id}/submit`);
    const step = { type: 'decision', gate: g.gate, e2e: run.e2e_id, cycle: g.cycle };
    if (s.recycleAt === g.gate && !recycled) {
      const rework = run.tasks.find((t) => t.uft_id === 'UFT-02-02');
      const r = await ex.post(`/gates/${g.id}/decide`, { decision: 'Recycle', rationale: RECYCLE_RATIONALE, recycle_tasks: [rework.uft_id] });
      Object.assign(step, { decision: 'Recycle', rationale: RECYCLE_RATIONALE, recycle: [`${rework.uft_id} ${rework.name}`], result: r.recycled }); recycled = true;
    } else {
      const path = g.gate === 'T5' ? s.t5Path || 'A' : undefined;
      const rationale = g.gate === 'T5' ? RATIONALE.T5[path] : RATIONALE[g.gate];
      const r = await ex.post(`/gates/${g.id}/decide`, { decision: 'Go', rationale, next_path: path });
      Object.assign(step, { decision: 'Go', rationale, nextPath: path, started: r.started });
    }
    log.steps.push(step);
    if (step.decision === 'Go') gateCount[g.gate] = (gateCount[g.gate] || 0) + 1;
    const stopAt = s.stopAfter; const stopTimes = s.relaunchReentry && !s.existing ? 2 : 1;
    if ((stopAt && step.decision === 'Go' && g.gate === stopAt && gateCount[g.gate] >= 1)
      || (s.relaunchReentry && !s.existing && g.gate === 'T3' && gateCount.T3 >= stopTimes)) {
      const after = await pm.get(`/projects/${p.id}`);
      log.finalStatus = `${after.status} · open runs: ${after.runs.filter((r) => ['In progress', 'Scheduled'].includes(r.status)).map((r) => r.e2e_id).join(', ') || 'none'}`;
      break;
    }
  }
  const fin = await pm.get(`/projects/${p.id}`);
  log.final = { status: fin.status, npv: fin.npv, roi: fin.roi, payback: fin.payback_years, currentE2E: fin.current_e2e, currentGate: fin.current_gate, launched: fin.actual_launch_date };
  return log;
}

const logs = [];
for (const s of SCENARIOS) {
  const t0 = Date.now();
  try { const l = await runScenario(s); logs.push(l); console.log(`Run ${s.id} ${l.code}: ${l.steps.length} steps, ${l.final.status} (${((Date.now() - t0) / 1000).toFixed(1)} s)`); }
  catch (e) { console.error(`Run ${s.id} FAILED: ${e.message}`); logs.push({ id: s.id, error: e.message }); }
}
fs.writeFileSync(OUT, JSON.stringify(logs, null, 1));
