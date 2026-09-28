// Exports requirement traceability and platform counts for the coverage checklist.
// Usage: node tools/export-trace.mjs <out.json>
import fs from 'node:fs';
import { openDb, all, get } from '../src/db.js';
import { catalog } from '../src/catalog/store.js';
import { TRACE, traceOf } from '../src/services/traceability.js';

const [out] = process.argv.slice(2);
openDb();
const c = catalog();
const n = (t, w = '') => get(`SELECT COUNT(*) n FROM ${t} ${w}`).n;
const projects = all(`SELECT p.code, p.ms_type, p.mode, p.track, p.progress_cache, o.sector, o.size, o.short_code,
  (SELECT COUNT(*) FROM project_mps m WHERE m.project_id=p.id) mps, (SELECT COUNT(*) FROM step_exec s WHERE s.project_id=p.id) steps,
  (SELECT COUNT(*) FROM phases ph WHERE ph.project_id=p.id) phases FROM projects p JOIN organizations o ON o.id=p.org_id ORDER BY o.size DESC, o.sector, p.ms_type`);
fs.writeFileSync(out, JSON.stringify({
  families: Object.fromEntries(Object.entries(TRACE).map(([k, v]) => [k, { ...v, module: v.module.en }])),
  requirements: c.requirements.map(r => ({ ...r, trace: traceOf(r.id) ? { screen: traceOf(r.id).screen, api: traceOf(r.id).api } : null })),
  catalog: { e2e: c.e2e.length, mps: c.macroProcesses.length, tasks: c.tasks.length, steps: c.steps.length, segments: c.segments.length, standards: c.standards.length, rules: c.rules.length, actions: c.actions.length, controls: c.controls.length,
    risks: c.risks.length, kpis: c.kpis.length, alerts: c.alerts.length, reports: c.reports.length, docTemplates: c.docTemplates.length, policies: c.policies.length, docVersions: c.docVersions.length, classes: c.classes.length,
    dataDictionary: c.dataDictionary.length, valueLists: c.valueLists.length, aiUseCases: c.aiUseCases.length, roleMenus: c.roleMenus.length, modules: c.modules.length, packs: c.packs.length, addons: c.addons.length,
    integrations: c.integrations.length, deploymentModes: c.deploymentModes.length, uf: c.uf.length, chains: c.chains.length, compliancePacks: c.compliancePacks.length, functions: c.functions.length,
    sampleElements: c.sample.elements.length, sampleSheets: c.sample.sheets.length, sipoc: c.sample.sipoc.length, procedures: c.sample.procedures.length, procedureSteps: c.sample.procedureSteps.length, registry: c.sample.registry.length,
    requirements: c.requirements.length, activationCells: c.macroProcesses.length * c.segments.length, racsiE2E: c.e2e.reduce((a, e) => a + e.racsi.length, 0), flowRows: c.e2e.reduce((a, e) => a + e.flow.length, 0),
    clusters: c.clusters.length, agreements: c.agreements.length, bundles: (c.bundles || []).length, licensingLinks: (c.licensingLinks || []).length, tier6Racsi: (c.tier6Racsi || []).length },
  db: { groups: n('groups_'), orgs: n('organizations'), projects: n('projects'), users: n('users'), steps: n('step_exec'), stepsDone: n('step_exec', "WHERE status='Done'"), phases: n('phases'), kpis: n('kpis'), kpiValues: n('kpi_values'),
    risks: n('risks'), ncs: n('ncs'), actions: n('actions'), audits: n('audits'), findings: n('findings'), documents: n('documents'), docVersions: n('document_versions'), registers: n('registers'), alerts: n('alerts'),
    racsi: n('racsi_activities'), rules: n('business_rules'), controls: n('controls'), aiLog: n('ai_usage_log'), auditLog: n('audit_log'), versions: n('entity_versions'), rex: n('rex'), wbs: n('wbs_nodes'), checklists: n('checklists') },
  projects,
}, null, 1));
console.log('trace exported', out);
