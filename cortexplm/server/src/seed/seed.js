// npm run seed  -  rebuilds the database with six demo organizations (one per industry).
// The seed drives the real lifecycle engine (same code as the API) with simulated dates and actors, so
// every record obeys the business rules, controls and track rules.
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { openDb, closeDb, q, json } from '../db.js';
import { PERMISSIONS, ROLES, defaultGrants } from '../lib/perms.js';
import { DLV, PROC, E2E, E2E_IDS, D01, STEP, COMPLIANCE_STANDARDS, NON_CERT_DISCLOSURE, MP, GATE_OF_E2E } from '../lib/ref.js';
import * as L from '../lib/lifecycle.js';
import { snapshot } from '../lib/audit.js';
import { encrypt } from '../lib/security.js';
import { raiseAlert, computeAlerts } from '../lib/alerts.js';
import { SaasLicenceProvider } from '../licensing/index.js';
import { effectiveConfig } from '../lib/entitlements.js';
import { generate, recordOutcome } from '../lib/ai.js';
import { INDUSTRIES, PEOPLE, PLAN_ORDER, personName } from './industries.js';
import { outputFor } from './outputs.js';
import { bpmnFor } from './bpmn.js';
import { GLOBAL_KB, TENANT_KB, REX_LIBRARY } from './knowledge.js';

const TODAY = new Date(new Date().toISOString().slice(0, 10) + 'T09:00:00Z');
const DAY = 86400000;
const iso = (d) => new Date(d).toISOString();
const addDays = (d, n) => new Date(+new Date(d) + n * DAY);

// Deterministic pseudo-random generator so every seed produces the same data.
let seedState = 20260923;
const rnd = () => { seedState |= 0; seedState = (seedState + 0x6D2B79F5) | 0; let t = Math.imul(seedState ^ (seedState >>> 15), 1 | seedState); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const between = (a, b) => Math.round(a + rnd() * (b - a));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

function reset() {
  closeDb();
  for (const f of [config.dbPath, config.dbPath + '-wal', config.dbPath + '-shm']) if (fs.existsSync(f)) fs.rmSync(f);
  if (fs.existsSync(config.uploadDir)) fs.rmSync(config.uploadDir, { recursive: true });
  fs.mkdirSync(config.uploadDir, { recursive: true });
  openDb();
}

function seedPlatform() {
  for (const [code, module, description] of PERMISSIONS) q.insert('permissions', { code, module, description });
  for (const [id, name, baseline] of ROLES) {
    q.insert('roles', { id, name, baseline_class: baseline, description: `${name} (${baseline})` });
    for (const p of defaultGrants(id)) q.insert('role_permissions', { role_id: id, permission_code: p });
  }
  for (const k of GLOBAL_KB) q.insert('knowledge_docs', { org_id: null, kind: k.kind, ref: k.ref, title: k.title, body: k.body, lang: 'en', tags: k.tags });
}

const COSO_OF = (c) => {
  const t = `${c.Control_Name} ${c.Description}`.toLowerCase();
  if (/segregation|policy|training|role|privileg|access right|awareness|ownership/.test(t)) return 'Control Environment';
  if (/risk|fmea|assessment|impact analysis|scoring/.test(t)) return 'Risk Assessment';
  if (/notif|report|communicat|disclos|label|publish|inform/.test(t)) return 'Information & Communication';
  if (c.Type === 'Detective') return 'Monitoring Activities';
  return 'Control Activities';
};
const LI = { 25: [5, 5], 20: [4, 5], 16: [4, 4], 15: [3, 5], 12: [3, 4], 10: [2, 5], 9: [3, 3], 8: [2, 4], 6: [2, 3] };
const ownerOfStep = (step) => D01[String(step).split('.')[0].split(',')[0].trim()]?.Owner_Role || 'Process Owner / Track Administrator';

function seedGovernance(orgId, obs) {
  const gov = obs.Quality; const eng = obs.Engineering; const pmo = obs['Portfolio Office'];
  const live = new Set(['BR-001', 'BR-002', 'BR-004', 'BR-005', 'BR-006', 'BR-007', 'BR-008', 'BR-009', 'BR-010', 'BR-011', 'BR-030']);
  const actions = Object.fromEntries(DLV['D03a Actions Registry'].map((a) => [a.Action_ID, a.Action_Name]));
  const sevOf = Object.fromEntries(DLV['D07 Alerts'].map((a) => [a.Rule_Condition, a.Severity]));
  for (const b of DLV['D03 Business Rules']) {
    const mp = b.Triggering_Step_ID.split('.')[0];
    q.insert('business_rules', { org_id: orgId, code: b.Rule_ID, triggering_step: b.Triggering_Step_ID, condition: b.Condition, action_id: b.Action_ID, action: actions[b.Action_ID], rule_type: b.Rule_Type,
      severity: sevOf[b.Rule_ID] || (b.Rule_Type === 'Escalation' ? 'High' : b.Rule_Type === 'Validation' ? 'Medium' : 'Low'), owner: ownerOfStep(b.Triggering_Step_ID), process_tag: mp,
      obs_node_id: ['MP-121', 'MP-122', 'MP-123', 'MP-124', 'MP-01'].includes(mp) ? pmo : ['MP-08', 'MP-30'].includes(mp) ? gov : eng, evaluation: live.has(b.Rule_ID) ? 'Live (engine)' : 'Catalog', active: 1 });
  }
  // D30 licensing rules
  [['RULE-LIC-001', 'MP-18', 'Licence signature does not verify', 'Reject the licence and block activation'],
    ['RULE-LIC-002', 'MP-18', 'Licence expiry date has passed', 'Block sign-in for the organization; warn 30 days ahead'],
    ['RULE-LIC-003', 'MP-18', 'Active users would exceed maxUsers', 'Refuse the new user (HTTP 409)'],
    ['RULE-LIC-004', 'MP-19', 'Add-on already active, or compliance add-on activated', 'No duplicate scaffold; show the non-certification disclosure']].forEach(([code, mp, cond, act]) =>
    q.insert('business_rules', { org_id: orgId, code, triggering_step: mp, condition: cond, action: act, rule_type: 'Validation', severity: 'High', owner: 'Platform Administrator', process_tag: mp, evaluation: 'Live (engine)', active: 1 }));
  const eff = ['Effective', 'Effective', 'Effective', 'Partially effective', 'Effective', 'Not tested'];
  DLV['D04 Controls'].forEach((c, i) => {
    q.insert('controls', { org_id: orgId, code: c.Control_ID, name: c.Control_Name, control_type: c.Type, coso_component: COSO_OF(c), testing_frequency: c.Type === 'Preventive' ? 'Quarterly' : 'Monthly',
      owner: ownerOfStep(c.Linked_Step_IDs), effectiveness: i === 13 ? 'Not effective' : eff[i % eff.length], linked_steps: c.Linked_Step_IDs, description: c.Description, process_tag: c.Linked_Step_IDs.split('.')[0], obs_node_id: gov });
  });
  [['CTRL-003', 'Licence expiry prevention', 'Preventive', 'Information & Communication', 'Warn administrators 30 days before licence expiry and raise alert SYS-02.'],
    ['CTRL-016', 'Licence file integrity check (Ed25519)', 'Preventive', 'Control Activities', 'Verify the Ed25519 signature of every OnPrem licence file; SaaS records are HMAC-signed by the server.'],
    ['CTRL-017', 'Add-on activation integrity check', 'Preventive', 'Control Activities', 'Add-on activation is idempotent and compliance add-ons require acknowledgement of the non-certification disclosure.']]
    .forEach(([code, name, type, coso, d]) => q.insert('controls', { org_id: orgId, code, name, control_type: type, coso_component: coso, testing_frequency: 'Continuous', owner: 'Platform Administrator', effectiveness: 'Effective', description: d, process_tag: 'MP-18' }));
  for (const r of DLV['D05 Risks']) {
    const [l, im] = LI[Number(r.Inherent_Score)] || [3, 4];
    q.insert('risks', { org_id: orgId, code: r.Risk_ID, name: r.Risk_Name, kind: 'Risk', category: r.Category, likelihood: l, impact: im, residual_score: Number(r.Residual_Score), mitigating_controls: r.Mitigating_Control_IDs, kri_formula: r.KRI_Formula,
      owner: r.Category.includes('AI') ? 'Data & AI Specialist' : r.Category.includes('Security') || r.Category === 'Technology' ? 'Platform Administrator' : r.Category.includes('Regul') || r.Category.includes('Compliance') ? 'Regulatory & Compliance Officer' : 'Quality Manager',
      status: Number(r.Residual_Score) <= 5 ? 'Mitigated' : 'Open', process_tag: 'MP-12', obs_node_id: gov });
  }
  q.insert('risks', { org_id: orgId, code: 'RISK-004', name: 'Licence expiry', kind: 'Risk', category: 'Commercial', likelihood: 2, impact: 5, residual_score: 4, mitigating_controls: 'CTRL-003', kri_formula: 'Days until licence expiry', owner: 'Platform Administrator', status: 'Open', process_tag: 'MP-18' });
  [['OPP-01', 'Reuse of approved design modules across product lines', 'Engineering', 3, 4], ['OPP-02', 'Bundling services with products for recurring revenue', 'Commercial', 3, 5], ['OPP-03', 'Faster gate reviews with complete evidence packs', 'Governance', 4, 3]]
    .forEach(([code, name, cat, l, im]) => q.insert('risks', { org_id: orgId, code, name, kind: 'Opportunity', category: cat, likelihood: l, impact: im, owner: 'Portfolio Manager', status: 'Open', process_tag: 'MP-01' }));
  for (const [name, formula, target, unit, owner, tag] of [
    ['Licence compliance %', 'Active users within licensed seats ÷ active users × 100 (KPI-006, D30)', '100%', '%', 'Platform Administrator', 'MP-18'],
    ['API availability', 'Minutes the API answered health checks ÷ minutes in period × 100 (KPI-011, D30)', '≥ 99.9%', '%', 'Platform Administrator', 'MP-28'],
    ['Evidence completeness at first submission', 'Gates submitted with all mandatory evidence ÷ gates submitted × 100', '≥ 95%', '%', 'Quality Manager', 'MP-122'],
  ]) q.insert('custom_kpis', { org_id: orgId, name, formula, target, unit, current_value: unit === '%' ? between(93, 100) : null, owner, process_tag: tag });
  // RACSI from the 81 user-facing tasks (exactly one Accountable each)
  for (const e of E2E_IDS) for (const t of E2E[e].tasks) {
    const id = q.insert('racsi_activities', { org_id: orgId, name: `${t.id} ${t.name}`, process_tag: e, linked_type: 'UFT', linked_id: t.id, obs_node_id: pmo });
    for (const letter of ['R', 'A', 'C', 'S', 'I']) q.insert('racsi_assignments', { activity_id: id, letter, assignee_type: 'role', assignee: t[letter] });
  }
  for (const e of E2E_IDS) q.insert('bpmn_diagrams', { org_id: orgId, title: `${e} ${E2E[e].name}`, description: `Core process model: ${E2E[e].goal}`, xml: bpmnFor(e), e2e_id: e, obs_node_id: pmo });
}

function seedKpiValues(orgId, ind) {
  const skip = new Set(['KPI-01', 'KPI-02', 'KPI-03', 'KPI-04', 'KPI-05', 'KPI-16', 'KPI-18', 'KPI-20', 'KPI-21', 'KPI-32', 'KPI-33', 'KPI-37', 'KPI-38']);
  const special = { 'KPI-25': [3800, 6200], 'KPI-29': [1.4, 3.6] };
  for (const k of DLV['D06 KPIs']) {
    if (skip.has(k.KPI_ID)) continue;
    const m = String(k.Target).replace(/,/g, '').match(/(≤|≥)?\s*([\d.]+)/);
    let base = special[k.KPI_ID] ? (special[k.KPI_ID][0] + special[k.KPI_ID][1]) / 2 : m ? Number(m[2]) : 50;
    const lower = m?.[1] === '≤';
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(TODAY); d.setUTCMonth(d.getUTCMonth() - i);
      const drift = (11 - i) * 0.006 * (lower ? -1 : 1);
      let v = base * (1 + (rnd() - (lower ? 0.35 : 0.62)) * 0.12 + drift);
      if (m && !lower && base === 100) v = Math.min(100, v);
      q.insert('kpi_values', { org_id: orgId, kpi_id: k.KPI_ID, period: d.toISOString().slice(0, 7), value: Math.round(v * 10) / 10 });
    }
  }
  void ind;
}

function seedAiUseCases(orgId) {
  const ctx = { orgId, user: { id: null, name: 'System' } };
  for (const a of DLV['D15 AI Use Cases']) {
    const step = STEP[a.Linked_Step_ID];
    const mp = MP[step?.Parent_Macro_Process_ID];
    const id = q.insert('ai_use_cases', {
      org_id: orgId, code: a.AIUC_ID, name: a.Use_Case_Name, linked_step: a.Linked_Step_ID, model_task_type: a.Model_Task_Type,
      tier: a.Risk_Level === 'High' ? 'Augmented' : 'Assistive', risk_level: a.Risk_Level, human_checkpoint: a.Human_in_the_Loop_Checkpoint, activation_scope: a.Activation_Scope,
      is_custom: a.Is_Custom === 'True' ? 1 : 0, based_on: a.Based_On_AI_Use_Case_ID === '—' ? null : a.Based_On_AI_Use_Case_ID, approval_status: a.Approval_Status,
      module: mp ? `${mp.id} ${mp.name}` : '', trigger_text: step ? `When step ${step.Step_ID} "${step.Step_Name}" runs` : 'On request',
      expected_output: `${a.Model_Task_Type} result presented for human review`,
      prompt_template: `Assist with "${step?.Step_Name || a.Use_Case_Name}". Use only the record data and the retrieved references. Human checkpoint: ${a.Human_in_the_Loop_Checkpoint} (starter template; final template reference pending D19c).`,
      active: a.Approval_Status === 'Pending Approval' ? 0 : 1,
    });
    snapshot(ctx, 'ai_use_case', id, q.get('SELECT * FROM ai_use_cases WHERE id = ?', id), 'Version 1 (seeded catalog, D15).');
    if (['AIUC-12', 'AIUC-08'].includes(a.AIUC_ID)) {
      q.run('UPDATE ai_use_cases SET human_checkpoint = ? WHERE id = ?', `${a.Human_in_the_Loop_Checkpoint} Reviewer name and decision are recorded in the gate pack.`, id);
      snapshot(ctx, 'ai_use_case', id, q.get('SELECT * FROM ai_use_cases WHERE id = ?', id), 'Clarified the human checkpoint wording.');
    }
  }
}

// ------------------------------------------------------------------ lifecycle simulation
const SCORES = {
  Full: () => ({ strategic: between(4, 5), investment: between(4, 5), novelty: between(3, 5), regulatory: between(3, 5), market: between(3, 5), reach: between(4, 5), integration: between(3, 4) }),
  Light: () => ({ strategic: 3, investment: 3, novelty: between(2, 4), regulatory: between(2, 3), market: 3, reach: between(3, 4), integration: 2 }),
  Fast: () => ({ strategic: 2, investment: between(1, 2), novelty: 2, regulatory: between(1, 2), market: 2, reach: 2, integration: 1 }),
};
const START_DAYS = {
  'full-retired': 560, 'full-retiring': 470, 'full-relaunched-03': 520, 'full-relaunched-05': 540, 'full-relaunched-04': 500, 'full-relaunch-active': 425,
  'full-eol-active': 410, 'full-eol-recycle': 445, 'full-aftersales': 300, 'full-performance': 335, 'light-launched': 520, 'light-design': 135,
  'light-gate-pending': 118, 'fast-launched': 200, 'fast-dev': 125, 'fast-parked': 30, 'full-killed': 210, 'full-hold': 215, 'full-new': 12,
};

class Sim {
  constructor(org, ind, people) { this.org = org; this.ind = ind; this.people = people; }
  ctx(userId) {
    const u = q.get('SELECT id, name FROM users WHERE id = ?', userId);
    return { orgId: this.org.id, user: u, now: iso(this.cursor), notify: this.cursor > addDays(TODAY, -30) };
  }
  tick(a = 2, b = 6) { this.cursor = addDays(this.cursor, between(a, b)); if (this.cursor > TODAY) this.cursor = new Date(TODAY); }
  x() { const i = this.ind; return { p: this.project.name, seg: pick(i.segments), region: pick(i.regions), reg: i.regulation, risk: pick(i.risks), partner: pick(i.partners), channel: pick(i.channels), kpi: i.kpiWord, unit: i.unit, n1: between(2, 6), n2: between(8, 30), n3: between(55, 85) }; }
  dataFor(uft) {
    const i = this.ind; const inv = between(300, 4200);
    const bc = () => ({ investment: inv, annual_cash_flow: Math.round(inv * (0.28 + rnd() * 0.3)), years: 5, discount_rate: between(8, 12) });
    switch (uft) {
      case 'UFT-01-01': return { idea_source: pick(['Internal - strategy', 'Customer request', 'Market trend', 'Internal - employee', 'Partner', 'Regulation']), idea_statement: `${this.project.name}: ${this.project.description}` };
      case 'UFT-01-02': return { target_segment: pick(i.segments), market_size: between(5, 140), strategic_fit: this.plan === 'fast-parked' ? 42 : between(62, 93) };
      case 'UFT-01-03': case 'UFT-02-02': return bc();
      case 'UFT-01-04': return { top_risk: pick(i.risks), likelihood: between(2, 4), impact: between(3, 5), regulated: ['HLT', 'ENR', 'TRN'].includes(i.key) ? 'Yes' : pick(['Yes', 'No']) };
      case 'UFT-01-05': return { capabilities: `Product owner, solution architect, ${pick(i.partners)} delivery team, ${between(2, 6)} FTE in year 1` };
      case 'UFT-01-06': return { portfolio_fit: pick(['Core', 'Adjacent', 'Transformational']), roadmap_slot: `${this.cursor.getUTCFullYear() + 1}-Q${between(1, 4)}` };
      case 'UFT-02-05': return { gross_margin: between(24, 56) };
      case 'UFT-02-06': return { regulations: i.regulation };
      case 'UFT-02-07': return { feasibility: pick(['High', 'High', 'Medium']) };
      case 'UFT-04-05': return { acceptance_pass_rate: between(92, 100) };
      case 'UFT-05-02': return { planned_launch_date: addDays(this.cursor, between(18, 45)).toISOString().slice(0, 10) };
      case 'UFT-05-06': return { people_trained: between(12, 140) };
      case 'UFT-05-08': return { approvals_complete: 'Yes' };
      case 'UFT-06-01': return { issues_open: between(0, 12) };
      case 'UFT-06-04': case 'UFT-07-03': return { csat: Math.round((3.6 + rnd() * 1.1) * 10) / 10, nps: between(8, 56) };
      case 'UFT-06-05': return { mtbf_hours: between(1500, 9000) };
      case 'UFT-07-02': { const rev = between(800, 9000); return { revenue: rev, cogs: Math.round(rev * (0.45 + rnd() * 0.25)) }; }
      case 'UFT-07-04': return { recommendation: this.nextPath === 'B' ? 'Retire' : this.nextPath === 'A' ? 'Relaunch' : 'Continue' };
      case 'UFT-08-04': return { reentry: this.reentry || 'E2E-03' };
      case 'UFT-08-09': { const a = between(20, 300); return { customers_affected: a, customers_migrated: Math.round(a * (0.82 + rnd() * 0.18)) }; }
      case 'UFT-08-10': return { closure_cost: between(20, 200) };
      case 'UFT-09-08': return { leads: between(40, 900), conversion: between(3, 18) };
      default: return {};
    }
  }
  pid() { return this.project.id; }
  activeRuns() { return q.all("SELECT * FROM e2e_runs WHERE project_id = ? AND status = 'In progress' ORDER BY id", this.pid()); }
  mainRun() { return this.activeRuns().find((r) => r.e2e_id !== 'E2E-09'); }
  completeTask(t) {
    const owner = t.owner_id;
    if (json(t.data, {})?.r2Skippable && t.uft_id !== 'UFT-01-02' && rnd() < 0.5) { L.skipTask(this.ctx(owner), t.id, 'Fast Track: depends on a macro process not activated for this track (Rule R2).', true); this.tick(1, 2); return; }
    L.startTask(this.ctx(owner), t.id, true);
    L.completeTask(this.ctx(owner), t.id, { data: this.dataFor(t.uft_id), output: outputFor(t.uft_id, this.x()) }, true);
    if (t.evaluator_id && t.evaluator_id !== owner && rnd() < 0.8 && this.cursor < addDays(TODAY, -5)) {
      try { L.evaluateTask(this.ctx(t.evaluator_id), t.id, rnd() < 0.92 ? 'Effective' : 'Not effective', rnd() < 0.5 ? 'Output meets the task description.' : 'Reviewed against the RACSI description.'); } catch { /* ignore */ }
    }
    this.tick();
    this.parallelStep();
  }
  parallelStep() {
    const run = this.activeRuns().find((r) => r.e2e_id === 'E2E-09');
    if (!run || rnd() < 0.45) return;
    const t = q.get("SELECT * FROM run_tasks WHERE run_id = ? AND status = 'To do' ORDER BY seq LIMIT 1", run.id);
    if (t) { L.startTask(this.ctx(t.owner_id), t.id, true); L.completeTask(this.ctx(t.owner_id), t.id, { data: this.dataFor(t.uft_id), output: outputFor(t.uft_id, this.x()) }, true); }
  }
  workTasks(run, fraction = 1) {
    const tasks = q.all("SELECT * FROM run_tasks WHERE run_id = ? AND kind = 'work' AND status IN ('To do','In progress') ORDER BY seq", run.id);
    const n = Math.max(0, Math.round(tasks.length * fraction));
    for (const t of tasks.slice(0, n)) this.completeTask(q.get('SELECT * FROM run_tasks WHERE id = ?', t.id));
  }
  checklist(run) {
    const g = q.get('SELECT * FROM gate_reviews WHERE run_id = ?', run.id);
    const ct = q.get("SELECT * FROM run_tasks WHERE run_id = ? AND kind = 'checklist'", run.id);
    const qa = ct?.owner_id || this.project.owner_id;
    for (const it of q.all("SELECT * FROM checklist_items WHERE gate_review_id = ? AND status = 'Open'", g.id)) {
      if (it.mandatory && rnd() < 0.03) { L.updateChecklistItem(this.ctx(this.people.board2), it.id, { action: 'waive', reason: 'Evidence follows at the next gate; risk accepted by the board.' }, new Set(['gate.decide'])); continue; }
      if (!it.mandatory && rnd() < 0.15) continue;
      L.updateChecklistItem(this.ctx(qa), it.id, { action: 'complete', evidence: `Evidence pack ${this.project.code}/${g.gate}/${String(it.seq).padStart(2, '0')} - document stored in the project folder` }, new Set());
    }
    if (ct && ct.status !== 'Done') { L.startTask(this.ctx(qa), ct.id, true); L.completeTask(this.ctx(qa), ct.id, { output: outputFor(ct.uft_id, this.x()) }, true); }
    this.tick(1, 3);
    return g;
  }
  gate(decision = 'Go', extra = {}) {
    const run = this.mainRun();
    if (!run) throw new Error(`No active run for ${this.project.code}`);
    this.workTasks(run);
    const g = this.checklist(run);
    L.submitGate(this.ctx(this.project.owner_id), g.id);
    if (extra.submitOnly) return g;
    this.tick(2, 9);
    const board = rnd() < 0.5 ? this.people.board1 : this.people.board2;
    const rationale = { Go: `Evidence complete and ${pick(['business case confirmed', 'risks acceptable', 'readiness confirmed', 'criteria met'])}; proceed.`, Kill: 'Business case no longer holds after the opportunity study; resources released.', Hold: 'Paused pending the regulator’s guidance expected next quarter.', Recycle: 'Evidence gaps on the business case and customer journey; rework named tasks and return to this gate.' }[decision];
    const votes = decision === 'Go' && rnd() < 0.04 ? { for: 3, against: 1 } : { for: 4, against: 0 };
    return L.decideGate(this.ctx(board), g.id, { decision, rationale, votes, ...extra });
  }
  run08(fraction = 1) { const run = this.activeRuns().find((r) => r.e2e_id === 'E2E-08'); if (run) this.workTasks(run, fraction); }
  finishParallel(fraction = 1) { const run = this.activeRuns().find((r) => r.e2e_id === 'E2E-09'); if (run) { const tasks = q.all("SELECT * FROM run_tasks WHERE run_id = ? AND status = 'To do' ORDER BY seq", run.id); for (const t of tasks.slice(0, Math.round(tasks.length * fraction))) { L.startTask(this.ctx(t.owner_id), t.id, true); L.completeTask(this.ctx(t.owner_id), t.id, { data: this.dataFor(t.uft_id), output: outputFor(t.uft_id, this.x()) }, true); } } }
  toT3() { this.gate(); this.gate(); this.gate(); this.gate(); this.gate(); }

  play(plan) {
    const P = plan;
    const full = P.startsWith('full');
    if (P === 'full-new') { this.workTasks(this.mainRun(), 0.25); return; }
    if (P === 'fast-parked') { this.workTasks(this.mainRun(), 0.25); return; }
    if (P === 'full-killed') { this.gate(); this.gate('Kill'); return; }
    if (P === 'full-hold') { this.gate(); this.gate(); this.gate('Hold', { hold_until: addDays(TODAY, between(20, 70)).toISOString().slice(0, 10) }); return; }
    if (P === 'light-gate-pending') { this.gate(); this.gate('Go', { submitOnly: true }); return; }
    if (P === 'light-design') { this.gate(); this.gate('Recycle', { recycle_tasks: ['UFT-02-02', 'UFT-02-04'] }); this.gate(); this.workTasks(this.mainRun(), 0.4); return; }
    if (P === 'fast-launched') { this.gate(); this.gate(); this.gate(); return; }
    if (P === 'fast-dev') { this.gate(); this.gate(); this.workTasks(this.mainRun(), 0.5); return; }
    if (P === 'light-launched') {
      this.toT3();
      this.finishParallel(0.6);
      L.activateScheduledRuns({ now: iso(TODAY) });
      const r7 = this.activeRuns().find((r) => r.e2e_id === 'E2E-07');
      if (r7) { this.cursor = new Date(Math.max(+this.cursor, +new Date(q.get('SELECT scheduled_start s FROM e2e_runs WHERE id = ?', r7.id).s || this.cursor))); this.workTasks(r7, 0.5); }
      return;
    }
    if (!full) return;
    this.toT3();                                          // E2E-01 .. E2E-05, E2E-09 starts
    if (P === 'full-aftersales') { this.finishParallel(0.3); return; }
    this.gate();                                          // T4: E2E-06 -> E2E-07
    if (P === 'full-performance') { this.finishParallel(0.8); return; }
    this.finishParallel(1);
    const branchB = ['full-retired', 'full-retiring', 'full-eol-active', 'full-eol-recycle'].includes(P);
    this.nextPath = branchB ? 'B' : 'A';
    this.reentry = { 'full-relaunched-03': 'E2E-03', 'full-relaunched-05': 'E2E-05', 'full-relaunched-04': 'E2E-04' }[P] || pick(['E2E-03', 'E2E-04', 'E2E-05']);
    if (P === 'full-eol-recycle') this.gate('Recycle', { recycle_tasks: ['UFT-07-02', 'UFT-07-04'] });
    this.gate('Go', { next_path: this.nextPath });        // T5 -> E2E-08 branch
    if (P === 'full-retired') { this.run08(1); this.gate(); return; } // T6 Retired
    if (P === 'full-retiring') { this.run08(0.5); return; }
    if (P === 'full-eol-active' || P === 'full-eol-recycle') { this.run08(0.25); return; }
    if (P === 'full-relaunch-active') { this.run08(0.5); return; }
    if (P.startsWith('full-relaunched')) { this.run08(1); this.workTasks(this.mainRun(), 0.4); }
  }
}

function seedOrg(ind, idx, groupId) {
  const org = { id: q.insert('organizations', { uid: `ORG-${ind.key}-001`, group_id: ind.key === 'PUB' ? null : groupId, name: ind.name, industry: ind.industry, country: ind.country, default_language: 'en', profile: `${ind.industry} demo tenant` }) };
  q.insert('org_config', { org_id: org.id, subscription_id: ind.subscription, seats: ind.seats, deployment_option: ind.key === 'HLT' ? 'Dedicated / sovereign' : 'SaaS (shared)', support_tier: ind.key === 'PUB' ? 'Premium 24/7' : 'Standard', billing_cycle: 'Annual',
    issue_date: '2026-01-01T00:00:00.000Z', expiry_date: ind.key === 'TRN' ? addDays(TODAY, 22).toISOString() : '2027-12-31T23:59:59.000Z' });
  for (const a of ind.addons) q.insert('org_addons', { org_id: org.id, addon_id: a, activated_at: '2026-01-05T10:00:00.000Z' });
  q.insert('governance_settings', { org_id: org.id, key: 'justification_required', value: '1' });
  q.insert('governance_settings', { org_id: org.id, key: 'light_observation_days', value: '182' });
  // OBS tree
  const site = q.insert('obs_nodes', { org_id: org.id, name: `${ind.name} - Headquarters`, type: 'Site' });
  const obs = { Site: site };
  for (const d of ['Portfolio Office', 'Engineering', 'Operations', 'Quality', 'Finance', 'Marketing & Sales', 'Service', 'IT & Data']) obs[d] = q.insert('obs_nodes', { org_id: org.id, parent_id: site, name: d, type: 'Department' });
  q.insert('obs_nodes', { org_id: org.id, parent_id: obs.Engineering, name: 'Design & Development Team', type: 'Team' });
  q.insert('obs_nodes', { org_id: org.id, parent_id: obs.Quality, name: 'Regulatory Affairs Team', type: 'Team' });
  // Users
  const hash = bcrypt.hashSync('Demo#2026', 10);
  const people = {};
  const deptOf = { exec: 'Portfolio Office', board1: 'Portfolio Office', board2: 'Portfolio Office', pm1: 'Portfolio Office', pm2: 'Portfolio Office', portfolio: 'Portfolio Office', engineering: 'Engineering', operations: 'Operations', quality: 'Quality', compliance: 'Quality', legal: 'Portfolio Office', finance: 'Finance', procurement: 'Operations', marketing: 'Marketing & Sales', service: 'Service', technician: 'Service', sustainability: 'Operations', data: 'IT & Data', process: 'Portfolio Office', admin: 'IT & Data', training: 'Service', supplier: null, customer: null, auditor: 'Finance' };
  PEOPLE.forEach(([alias, title, roles], i) => {
    const lang = (ind.key === 'PUB' && alias === 'pm2') ? 'fr' : (ind.key === 'ENR' && alias === 'pm2') ? 'ar' : null;
    const id = q.insert('users', { org_id: org.id, name: personName(idx, i), email: `${alias}@${ind.domain}`, password_hash: hash, language: lang, title, obs_node_id: deptOf[alias] ? obs[deptOf[alias]] : null, created_at: '2025-12-15T08:00:00.000Z' });
    for (const r of roles) q.insert('user_roles', { user_id: id, role_id: r });
    people[alias] = id;
  });
  q.insert('notification_prefs', { user_id: people.pm1, category: 'gate', channel: 'email', enabled: 1 });
  q.insert('notification_prefs', { user_id: people.exec, category: 'alert', channel: 'email', enabled: 1 });
  seedGovernance(org.id, obs);
  seedKpiValues(org.id, ind);
  seedAiUseCases(org.id);
  // Compliance standards: idempotent scaffold, disclosure acknowledged by the administrator.
  for (const sid of ind.compliance) {
    const s = COMPLIANCE_STANDARDS.find((x) => x.id === sid);
    q.insert('org_compliance', { org_id: org.id, standard_id: sid, disclosure_ack_by: people.admin, activated_at: '2026-01-05T10:00:00.000Z' });
    s.controls.forEach(([name, coso, type, freq], k) => q.insert('controls', { org_id: org.id, code: `${sid}-${String(k + 1).padStart(2, '0')}`, name, control_type: type, coso_component: coso, testing_frequency: freq, owner: 'Regulatory & Compliance Officer', effectiveness: k % 3 === 2 ? 'Not tested' : 'Effective', standard_tag: sid, description: `Starting control seeded by the ${s.name} module. ${NON_CERT_DISCLOSURE.split('.')[1]}.` }));
  }
  // Templates (FR-DA-TPL, Rule R4 recommended optional sets)
  const tpl = [
    ['Regional variant (Rule R4)', 'Light Track starting point for a regional variant; adds MP-30, MP-39 and MP-22.', { offer_type: 'Product', scores: { strategic: 3, investment: 3, novelty: 2, regulatory: 3, market: 4, reach: 3, integration: 2 }, optional_mps: ['MP-30', 'MP-39', 'MP-22'], description: 'Regional variant of an existing offer.' }],
    ['Service upgrade', 'Light Track starting point for service upgrades; adds service catalog, incident and quality processes.', { offer_type: 'Service', scores: { strategic: 3, investment: 2, novelty: 3, regulatory: 2, market: 3, reach: 4, integration: 3 }, optional_mps: ['MP-18', 'MP-23', 'MP-25'], description: 'Upgrade of an existing service.' }],
    ['Minor change (Fast Track)', 'Fast Track starting point for cosmetic, packaging or documentation changes.', { offer_type: 'Product', scores: { strategic: 2, investment: 1, novelty: 1, regulatory: 2, market: 2, reach: 2, integration: 1 }, optional_mps: ['MP-20'], description: 'Minor change to an existing product.' }],
  ];
  for (const [name, description, payload] of tpl) {
    const id = q.insert('templates', { org_id: org.id, kind: 'Project', name, description, payload });
    snapshot({ orgId: org.id, user: { id: people.process, name: 'Process Owner' } }, 'template', id, q.get('SELECT * FROM templates WHERE id = ?', id), 'Version 1.');
  }
  for (const k of TENANT_KB[ind.key]) q.insert('knowledge_docs', { org_id: org.id, kind: 'Practice note', title: k[0], body: k[1], lang: 'en', tags: ind.industry });
  // Integrations
  ind.integrations.forEach(([cat, name], k) => {
    const id = q.insert('integrations', { org_id: org.id, catalog_id: cat, name, endpoint: `https://api.${ind.domain}/connector/${cat.toLowerCase()}`, enabled: 1, credentials_enc: encrypt(`demo-token-${cat}`), inbound_secret_enc: encrypt(`inbound-${ind.key}-${k}`), health_status: k === 2 ? 'Authentication failure' : 'Healthy', health_checked_at: addDays(TODAY, -1).toISOString() });
    [['external_id', 'project', 'code'], ['title', 'project', 'name'], ['status', 'project', 'status']].slice(0, 2 + (k % 2)).forEach(([e, en, f]) => q.insert('integration_mappings', { integration_id: id, external_field: e, internal_entity: en, internal_field: f }));
    for (let d = 30; d >= 1; d -= 1) {
      const fail = k === 2 ? d <= 3 : rnd() < 0.02;
      q.insert('integration_log', { org_id: org.id, integration_id: id, direction: rnd() < 0.7 ? 'outbound' : 'inbound', record: `${pick(['project', 'task', 'gate'])} sync batch ${d}`, result: fail ? 'failed: HTTP 401' : 'success', created_at: addDays(TODAY, -d).toISOString() });
    }
  });
  // Projects
  const sim = new Sim(org, ind, people);
  PLAN_ORDER.forEach((plan, i) => {
    const [name, description, offerType] = ind.projects[i];
    const track = plan.startsWith('full') ? 'Full' : plan.startsWith('light') ? 'Light' : 'Fast';
    sim.plan = plan; sim.nextPath = null; sim.reentry = null;
    sim.cursor = addDays(TODAY, -START_DAYS[plan] - between(0, 25));
    const owner = i % 2 ? people.pm2 : people.pm1;
    const scores = SCORES[track]();
    if (ind.key === 'HLT' && track === 'Full') scores.regulatory = 5;
    const p = L.createProject(sim.ctx(owner), {
      name, description, offer_type: offerType, scores, safety_critical: ind.key === 'HLT' && track === 'Full' && i % 3 === 0, track, override_reason: null,
      owner_id: owner, sponsor_id: people.exec, obs_node_id: sim.org && q.get("SELECT id FROM obs_nodes WHERE org_id = ? AND name = 'Portfolio Office'", org.id).id,
      region: pick(ind.regions), budget: null,
    });
    // Recompute the recommendation so the seeded track is always allowed; record an override when needed.
    if (p.recommended_track !== track) q.update('projects', p.id, { track_override_reason: 'Portfolio board aligned the track with the product family standard.' });
    sim.project = L.getProject(p.id);
    sim.tick(1, 3);
    try { sim.play(plan); } catch (e) { console.warn(`  ! ${ind.key} ${sim.project.code} (${plan}): ${e.message}`); }
    // Re-plan the remaining open tasks from today so that only a few are overdue.
    for (const run of q.all("SELECT id FROM e2e_runs WHERE project_id = ? AND status = 'In progress'", p.id)) {
      let c = addDays(TODAY, -between(0, 8));
      for (const t of q.all("SELECT id, kind FROM run_tasks WHERE run_id = ? AND status IN ('To do','In progress') ORDER BY seq", run.id)) {
        const dur = t.kind === 'work' ? between(5, 9) : 4;
        q.run('UPDATE run_tasks SET planned_start = ?, due_date = ? WHERE id = ?', c.toISOString().slice(0, 10), addDays(c, dur).toISOString().slice(0, 10), t.id);
        c = addDays(c, dur);
      }
    }
    // Lessons learned at closure (FR-DA-REX-01)
    const fin = L.getProject(p.id);
    if (['Killed', 'Retired', 'Launched'].includes(fin.status) || plan.startsWith('full-relaunched')) {
      const lib = pick(REX_LIBRARY);
      const id = q.insert('rex_entries', { org_id: org.id, project_id: p.id, title: `${fin.code} ${fin.name}: ${lib.title}`, went_well: lib.well, went_wrong: lib.wrong, root_cause: lib.cause, recommendation: lib.rec, category: lib.cat, rating: lib.rating, obs_node_id: fin.obs_node_id, process_tag: lib.mp, created_by: fin.owner_id, created_at: (fin.closed_at || iso(sim.cursor)) });
      snapshot({ orgId: org.id, user: { id: fin.owner_id, name: 'Product Manager' }, now: fin.closed_at || iso(sim.cursor) }, 'rex_entry', id, q.get('SELECT * FROM rex_entries WHERE id = ?', id), 'Captured at closure.');
    }
  });
  // More REX from completed tasks, for a visible register
  for (let k = 0; k < 6; k += 1) {
    const lib = REX_LIBRARY[(k * 3 + idx) % REX_LIBRARY.length];
    const t = q.get("SELECT id, project_id, completed_at FROM run_tasks WHERE org_id = ? AND status = 'Done' ORDER BY id LIMIT 1 OFFSET ?", org.id, 40 + k * 37);
    if (!t) continue;
    const id = q.insert('rex_entries', { org_id: org.id, project_id: t.project_id, task_id: t.id, title: lib.title, went_well: lib.well, went_wrong: lib.wrong, root_cause: lib.cause, recommendation: lib.rec, category: lib.cat, rating: lib.rating, process_tag: lib.mp, created_by: people.pm1, created_at: t.completed_at });
    snapshot({ orgId: org.id, user: { id: people.pm1, name: 'Product Manager' } }, 'rex_entry', id, q.get('SELECT * FROM rex_entries WHERE id = ?', id), 'Captured at task completion.');
  }
  // WBS from the after-sales project (FR-DA-WBS)
  const flagship = q.get('SELECT id, code, name FROM projects WHERE org_id = ? ORDER BY id LIMIT 1 OFFSET 10', org.id);
  const wid = q.insert('wbs', { org_id: org.id, name: `${flagship.code} ${flagship.name} - delivery plan`, description: 'Work breakdown of all E2E runs with task dependencies.', project_id: flagship.id, created_by: people.pm1 });
  let prev = null;
  q.all('SELECT id, e2e_id, run_no FROM e2e_runs WHERE project_id = ? ORDER BY id', flagship.id).forEach((run, s) => {
    const nid = q.insert('wbs_nodes', { wbs_id: wid, seq: s, name: `${run.e2e_id} ${E2E[run.e2e_id].name}${run.run_no > 1 ? ` (run ${run.run_no})` : ''}` });
    for (const t of q.all('SELECT id, seq FROM run_tasks WHERE run_id = ? ORDER BY seq', run.id)) { const tn = q.insert('wbs_nodes', { wbs_id: wid, parent_id: nid, seq: t.seq, name: 'task', task_id: t.id, predecessors: prev ? [prev] : [] }); prev = tn; }
  });
  // AI suggestions and outcomes (append-only usage log)
  if (effectiveConfig(org.id).features.ai) {
    const ucs = Object.fromEntries(q.all('SELECT id, code FROM ai_use_cases WHERE org_id = ?', org.id).map((u) => [u.code, u.id]));
    const projs = q.all('SELECT id, owner_id FROM projects WHERE org_id = ?', org.id);
    for (let k = 0; k < 18; k += 1) {
      const p = projs[k % projs.length]; const code = ['AIUC-12', 'AIUC-20', 'AIUC-01', 'AIUC-03', 'AIUC-06'][k % 5];
      const ctx = { orgId: org.id, user: q.get('SELECT id, name FROM users WHERE id = ?', p.owner_id), now: addDays(TODAY, -between(1, 120)).toISOString() };
      try {
        const s = generate(ctx, ucs[code], { projectId: p.id, recordType: 'project', recordId: p.id });
        const r = rnd();
        Promise.resolve(s).then((sug) => recordOutcome(ctx, sug.id, r < 0.62 ? 'Accepted' : r < 0.85 ? 'Edited' : 'Rejected'));
      } catch { /* use case gated */ }
    }
  }
  // Historical alerts from the shared catalog (same catalog as live computation)
  const EXTRA = { PUB: ['ALR-17', 'ALR-21', 'ALR-12'], CON: ['ALR-05', 'ALR-25', 'ALR-08'], HLT: ['ALR-23', 'ALR-10', 'ALR-06'], DAI: ['ALR-24', 'ALR-05', 'ALR-09'], TRN: ['ALR-13', 'ALR-12', 'ALR-14'], ENR: ['ALR-15', 'ALR-16', 'ALR-07'] }[ind.key];
  const MSG = { 'ALR-17': 'Privileged session on the permit database lasted 9 h 20 min.', 'ALR-21': 'Knowledge article "Parking permit eligibility" not reviewed for 12 months.', 'ALR-12': 'Service desk queue at 84% of the 8-hour SLA target.', 'ALR-05': 'Major NCR: honeycombing on wall panel batch WP-2291.', 'ALR-25': 'Should-cost of the bridge beam exceeds target cost by 13%.', 'ALR-08': 'Aggregate supplier scored 55 for the second consecutive quarter.', 'ALR-23': 'Serious adverse event reported in the remote monitoring pilot (24 h reporting clock started).', 'ALR-10': 'Technical file for the ECG patch is missing the usability report.', 'ALR-06': 'CAPA-118 on sterilization labels is 6 days overdue.', 'ALR-24': 'Summer yogurt demand forecast exceeds line capacity by 14%.', 'ALR-09': 'Carton supplier announced end-of-life for the 1 L format.', 'ALR-13': 'P1 ticket: contactless validators offline on line 4.', 'ALR-14': 'Door motor failure predicted within 14 days on bus 1187 (78%).', 'ALR-15': 'Pressure sensor outside design envelope for 22 minutes on segment P-14.', 'ALR-16': 'Field MTBF of the leak sensor is 18% below target.', 'ALR-07': 'FMEA line for flare compressor seal has RPN 240.' };
  EXTRA.forEach((type, k) => raiseAlert(org.id, type, { entityType: 'catalog', entityId: k + 1, message: MSG[type], now: addDays(TODAY, -between(1, 50)).toISOString(), notify: false }));
  computeAlerts(org.id, TODAY);
  new SaasLicenceProvider(org.id).resign();
  return { org, people };
}

async function main() {
  const t0 = Date.now();
  console.log('Seeding CortexPLM demo data...');
  reset();
  seedPlatform();
  const groupId = q.insert('groups_', { name: 'Cortex Demo Industries Group', description: 'Holding group for the industry demo organizations (Public Sector operates independently).' });
  const orgs = INDUSTRIES.map((ind, i) => { const r = seedOrg(ind, i, groupId); console.log(`  ${ind.industry.padEnd(32)} ${q.get('SELECT COUNT(*) n FROM projects WHERE org_id = ?', r.org.id).n} projects, ${q.get('SELECT COUNT(*) n FROM e2e_runs WHERE org_id = ?', r.org.id).n} E2E instances`); return r; });
  // Platform administrator (can switch between organizations)
  const pid = q.insert('users', { org_id: orgs[0].org.id, name: 'Platform Administrator', email: 'admin@cortexplm.example', password_hash: bcrypt.hashSync('Admin#2026', 10), is_platform_admin: 1, title: 'Platform Administrator' });
  q.insert('user_roles', { user_id: pid, role_id: 'R18' });
  await new Promise((r) => setTimeout(r, 50)); // let pending AI outcome writes finish
  q.insert('meta', { key: 'seeded_at', value: new Date().toISOString() });
  console.log('\nInstances of each E2E process per industry:');
  const rows = q.all('SELECT o.industry, r.e2e_id, COUNT(*) n FROM e2e_runs r JOIN organizations o ON o.id = r.org_id GROUP BY o.industry, r.e2e_id ORDER BY o.id, r.e2e_id');
  for (const ind of INDUSTRIES) console.log(`  ${ind.industry.padEnd(32)} ${E2E_IDS.map((e) => `${e.slice(4)}:${rows.find((x) => x.industry === ind.industry && x.e2e_id === e)?.n || 0}`).join('  ')}`);
  console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(1)} s. Sign in with admin@cortexplm.example / Admin#2026 (or any demo user with Demo#2026).`);
  void GATE_OF_E2E; void PROC;
}

main().catch((e) => { console.error(e); process.exit(1); });
