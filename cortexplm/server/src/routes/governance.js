import { Router } from 'express';
import { q } from '../db.js';
import { requirePerm, has } from '../lib/security.js';
import { requireFeatureFor } from '../lib/entitlements.js';
import { COSO, DLV } from '../lib/ref.js';
import { computeKpis } from '../lib/kpis.js';
import { ALERT_CATALOG, computeAlerts } from '../lib/alerts.js';
import { audit, diff, justificationRequired } from '../lib/audit.js';
import { h, crud, ctxOf, badRequest, notFound } from './util.js';

const r = Router();
const ord = "CAST(substr(code, instr(code,'-')+1) AS INTEGER), id";

crud(r, '/business-rules', { table: 'business_rules', entity: 'business_rule', view: 'governance.view', manage: 'governance.manage', feature: 'governance', versioned: true, order: ord,
  fields: ['code', 'triggering_step', 'condition', 'action_id', 'action', 'rule_type', 'severity', 'owner', 'obs_node_id', 'process_tag', 'active', 'evaluation'], required: ['condition', 'owner'] });

crud(r, '/controls', { table: 'controls', entity: 'control', view: 'governance.view', manage: 'governance.manage', feature: 'governance', versioned: true, order: ord,
  fields: ['code', 'name', 'control_type', 'coso_component', 'testing_frequency', 'owner', 'effectiveness', 'linked_steps', 'description', 'standard_tag', 'obs_node_id', 'process_tag'], required: ['name', 'coso_component', 'owner'],
  validate: (d) => { if (d.coso_component && !COSO.includes(d.coso_component)) throw badRequest(`COSO component must be one of: ${COSO.join(', ')}.`); },
  filter: (req, w, a) => { if (req.query.standard) { w.push('standard_tag = ?'); a.push(req.query.standard); } } });

r.get('/controls-coverage', requirePerm('governance.view'), h((req) => {
  requireFeatureFor(req.orgId, 'governance');
  return COSO.map((c) => ({ component: c, ...q.get("SELECT COUNT(*) total, SUM(effectiveness = 'Effective') effective, SUM(effectiveness = 'Partially effective') partial, SUM(effectiveness = 'Not effective') ineffective FROM controls WHERE org_id = ? AND coso_component = ?", req.orgId, c) }));
}));

crud(r, '/risks', { table: 'risks', entity: 'risk', view: 'governance.view', manage: 'governance.manage', feature: 'governance', order: 'likelihood * impact DESC, id',
  fields: ['code', 'name', 'kind', 'category', 'likelihood', 'impact', 'residual_score', 'mitigating_controls', 'kri_formula', 'owner', 'status', 'obs_node_id', 'process_tag', 'project_id'], required: ['name', 'likelihood', 'impact', 'owner'],
  validate: (d) => { for (const k of ['likelihood', 'impact']) if (!(Number(d[k]) >= 1 && Number(d[k]) <= 5)) throw badRequest(`${k} must be between 1 and 5.`); if (d.kind && !['Risk', 'Opportunity'].includes(d.kind)) throw badRequest('Type must be Risk or Opportunity.'); },
  map: (x) => ({ ...x, score: x.likelihood * x.impact }) });

r.get('/risk-heatmap', requirePerm('governance.view'), h((req) => {
  requireFeatureFor(req.orgId, 'governance');
  const cells = q.all("SELECT likelihood, impact, COUNT(*) n FROM risks WHERE org_id = ? AND status != 'Closed' AND kind = ? GROUP BY likelihood, impact", req.orgId, req.query.kind || 'Risk');
  return { cells };
}));

// KPIs: built-in (computed) + custom (always standard, FR-DA-GOV-05)
r.get('/kpis', requirePerm('kpi.view'), h((req) => computeKpis(req.orgId)));
r.post('/kpis/:id/measurements', requirePerm('kpi.manage'), h((req) => {
  const { period, value } = req.body;
  if (!/^\d{4}-\d{2}$/.test(period || '') || !Number.isFinite(Number(value))) throw badRequest('Give a period (YYYY-MM) and a numeric value.');
  q.run('DELETE FROM kpi_values WHERE org_id = ? AND kpi_id = ? AND period = ?', req.orgId, req.params.id, period);
  q.insert('kpi_values', { org_id: req.orgId, kpi_id: req.params.id, period, value: Number(value) });
  audit(ctxOf(req), 'kpi', req.params.id, 'measurement', { [period]: [null, value] });
  return { ok: true };
}));
crud(r, '/custom-kpis', { table: 'custom_kpis', entity: 'custom_kpi', view: 'kpi.view', manage: 'kpi.manage', fields: ['name', 'formula', 'target', 'unit', 'current_value', 'owner', 'process_tag'], required: ['name', 'formula', 'target', 'owner'] });

// RACSI (FR-DA-GOV-06/07): at most one Accountable, enforced by a partial unique index.
crud(r, '/racsi', { table: 'racsi_activities', entity: 'racsi_activity', view: 'racsi.view', manage: 'racsi.manage', fields: ['name', 'process_tag', 'linked_type', 'linked_id', 'obs_node_id'], required: ['name'],
  map: (a) => ({ ...a, assignments: q.all('SELECT id, letter, assignee_type, assignee FROM racsi_assignments WHERE activity_id = ? ORDER BY instr(\'RACSI\', letter)', a.id) }),
  order: 'process_tag, id' });
r.post('/racsi/:id/assignments', requirePerm('racsi.manage'), h((req) => {
  const a = q.get('SELECT id FROM racsi_activities WHERE id = ? AND org_id = ?', req.params.id, req.orgId);
  if (!a) throw notFound();
  const { letter, assignee, assignee_type = 'role' } = req.body;
  if (!['R', 'A', 'C', 'S', 'I'].includes(letter) || !String(assignee || '').trim()) throw badRequest('Choose a RACSI letter and an assignee.');
  const id = q.insert('racsi_assignments', { activity_id: a.id, letter, assignee, assignee_type });
  audit(ctxOf(req), 'racsi_activity', a.id, 'assign', { [letter]: [null, assignee] });
  return { id };
}));
r.delete('/racsi/:id/assignments/:aid', requirePerm('racsi.manage'), h((req) => {
  const a = q.get('SELECT id FROM racsi_activities WHERE id = ? AND org_id = ?', req.params.id, req.orgId);
  if (!a) throw notFound();
  const row = q.get('SELECT * FROM racsi_assignments WHERE id = ? AND activity_id = ?', req.params.aid, a.id);
  if (!row) throw notFound();
  q.run('DELETE FROM racsi_assignments WHERE id = ?', row.id);
  audit(ctxOf(req), 'racsi_activity', a.id, 'unassign', { [row.letter]: [row.assignee, null] });
  return { ok: true };
}));

// BPMN (FR-DA-BPMN-01..05): view with bpmn.view; saving needs bpmn.edit AND the bpmnEdit entitlement.
r.get('/bpmn', requirePerm('bpmn.view'), h((req) => q.all('SELECT id, title, description, e2e_id, obs_node_id, updated_at FROM bpmn_diagrams WHERE org_id = ? ORDER BY e2e_id, id', req.orgId)));
r.get('/bpmn/:id', requirePerm('bpmn.view'), h((req) => {
  const d = q.get('SELECT * FROM bpmn_diagrams WHERE id = ? AND org_id = ?', req.params.id, req.orgId);
  if (!d) throw notFound();
  let canEdit = has(req, 'bpmn.edit'); try { requireFeatureFor(req.orgId, 'bpmnEdit'); } catch { canEdit = false; }
  return { ...d, canEdit };
}));
const validXml = (x) => typeof x === 'string' && /<(bpmn2?:)?definitions[\s>]/.test(x) && x.length < 2_000_000;
r.post('/bpmn', requirePerm('bpmn.edit'), h((req) => {
  requireFeatureFor(req.orgId, 'bpmnEdit');
  if (!req.body.title || !validXml(req.body.xml)) throw badRequest('A title and a BPMN 2.0 XML document are required.');
  const id = q.insert('bpmn_diagrams', { org_id: req.orgId, title: req.body.title, description: req.body.description, xml: req.body.xml, e2e_id: req.body.e2e_id || null, obs_node_id: req.body.obs_node_id || null, updated_by: req.user.id });
  audit(ctxOf(req), 'bpmn', id, 'create', { title: [null, req.body.title] });
  return { id };
}));
r.put('/bpmn/:id', requirePerm('bpmn.edit'), h((req) => {
  requireFeatureFor(req.orgId, 'bpmnEdit');
  const d = q.get('SELECT * FROM bpmn_diagrams WHERE id = ? AND org_id = ?', req.params.id, req.orgId);
  if (!d) throw notFound();
  if (req.body.xml !== undefined && !validXml(req.body.xml)) throw badRequest('The file is not a BPMN 2.0 XML document.');
  const data = { title: req.body.title ?? d.title, description: req.body.description ?? d.description, xml: req.body.xml ?? d.xml, obs_node_id: req.body.obs_node_id ?? d.obs_node_id, updated_by: req.user.id, updated_at: new Date().toISOString() };
  q.update('bpmn_diagrams', d.id, data);
  audit(ctxOf(req), 'bpmn', d.id, 'update', diff(d, { title: data.title, description: data.description }), req.body.justification || null);
  return { ok: true };
}));
r.delete('/bpmn/:id', requirePerm('bpmn.edit'), h((req) => {
  const d = q.get('SELECT id FROM bpmn_diagrams WHERE id = ? AND org_id = ?', req.params.id, req.orgId);
  if (!d) throw notFound();
  q.run('DELETE FROM bpmn_diagrams WHERE id = ?', d.id); audit(ctxOf(req), 'bpmn', d.id, 'delete');
  return { ok: true };
}));

// Alerts (FR-DA-ALT-01..05)
r.get('/alerts', requirePerm('alert.view'), h((req) => {
  const names = Object.fromEntries(ALERT_CATALOG.map((a) => [a.type, a]));
  return q.all(`SELECT a.*, r.read_at, r.dismissed FROM alerts a LEFT JOIN alert_reads r ON r.alert_id = a.id AND r.user_id = ?
    WHERE a.org_id = ? AND COALESCE(r.dismissed, 0) = ? AND (a.resolved_at IS NULL OR ? = '1') ORDER BY a.created_at DESC, a.id DESC LIMIT 300`, req.user.id, req.orgId, req.query.dismissed === '1' ? 1 : 0, req.query.resolved || '0')
    .map((a) => ({ ...a, name: names[a.type]?.name, process: names[a.type]?.process, escalation: names[a.type]?.escalation }));
}));
r.get('/alerts/unread-count', requirePerm('alert.view'), h((req) => q.get('SELECT COUNT(*) n FROM alerts a LEFT JOIN alert_reads r ON r.alert_id = a.id AND r.user_id = ? WHERE a.org_id = ? AND r.alert_id IS NULL AND a.resolved_at IS NULL', req.user.id, req.orgId)));
const mark = (req, dismissed) => {
  const a = q.get('SELECT id FROM alerts WHERE id = ? AND org_id = ?', req.params.id, req.orgId);
  if (!a) throw notFound();
  q.run('INSERT INTO alert_reads (alert_id, user_id, read_at, dismissed) VALUES (?, ?, ?, ?) ON CONFLICT(alert_id, user_id) DO UPDATE SET read_at = excluded.read_at, dismissed = MAX(dismissed, excluded.dismissed)', a.id, req.user.id, new Date().toISOString(), dismissed);
  return { ok: true };
};
r.post('/alerts/:id/read', requirePerm('alert.view'), h((req) => mark(req, 0)));
r.post('/alerts/:id/dismiss', requirePerm('alert.view'), h((req) => mark(req, 1)));
r.post('/alerts/read-all', requirePerm('alert.view'), h((req) => {
  for (const a of q.all('SELECT a.id FROM alerts a LEFT JOIN alert_reads r ON r.alert_id = a.id AND r.user_id = ? WHERE a.org_id = ? AND r.alert_id IS NULL AND a.resolved_at IS NULL', req.user.id, req.orgId)) {
    q.run('INSERT INTO alert_reads (alert_id, user_id, read_at) VALUES (?, ?, ?)', a.id, req.user.id, new Date().toISOString());
  }
  return { ok: true };
}));
r.post('/alerts/run', requirePerm('alert.manage'), h((req) => ({ raised: computeAlerts(req.orgId) })));
r.get('/alert-settings', requirePerm('alert.view'), h((req) => ALERT_CATALOG.map((a) => ({ ...a, enabled: (q.get('SELECT enabled FROM alert_settings WHERE org_id = ? AND alert_type = ?', req.orgId, a.type)?.enabled ?? 1) === 1 }))));
r.put('/alert-settings/:type', requirePerm('alert.manage'), h((req) => {
  if (!ALERT_CATALOG.some((a) => a.type === req.params.type)) throw notFound();
  q.run('INSERT INTO alert_settings (org_id, alert_type, enabled) VALUES (?, ?, ?) ON CONFLICT(org_id, alert_type) DO UPDATE SET enabled = excluded.enabled', req.orgId, req.params.type, req.body.enabled ? 1 : 0);
  audit(ctxOf(req), 'alert_setting', req.params.type, 'toggle', { enabled: [null, !!req.body.enabled] });
  return { ok: true };
}));

// Governance settings (justification toggle, observation period, default language)
r.get('/settings', requirePerm('governance.view', 'config.view'), h((req) => ({
  justification_required: justificationRequired(req.orgId),
  light_observation_days: Number(q.get("SELECT value FROM governance_settings WHERE org_id = ? AND key = 'light_observation_days'", req.orgId)?.value || 182),
  default_language: q.get('SELECT default_language FROM organizations WHERE id = ?', req.orgId).default_language,
})));
r.put('/settings', requirePerm('governance.manage', 'hierarchy.manage'), h((req) => {
  const set = (k, v) => q.run('INSERT INTO governance_settings (org_id, key, value) VALUES (?, ?, ?) ON CONFLICT(org_id, key) DO UPDATE SET value = excluded.value', req.orgId, k, String(v));
  if (req.body.justification_required !== undefined) { set('justification_required', req.body.justification_required ? '1' : '0'); audit(ctxOf(req), 'settings', req.orgId, 'update', { justification_required: [null, !!req.body.justification_required] }); }
  if (req.body.light_observation_days !== undefined) { const d = Number(req.body.light_observation_days); if (!(d >= 0 && d <= 730)) throw badRequest('Observation period must be between 0 and 730 days.'); set('light_observation_days', d); audit(ctxOf(req), 'settings', req.orgId, 'update', { light_observation_days: [null, d] }); }
  if (req.body.default_language !== undefined) { q.run('UPDATE organizations SET default_language = ? WHERE id = ?', req.body.default_language, req.orgId); audit(ctxOf(req), 'organization', req.orgId, 'update', { default_language: [null, req.body.default_language] }); }
  return { ok: true };
}));

r.get('/actions-registry', requirePerm('governance.view'), (req, res) => res.json(DLV['D03a Actions Registry']));

export default r;
