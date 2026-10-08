// Generic entity engine. Business object classes come from the Information Class Model (D09) and their
// fields from the Data Dictionary (D10); platform governance entities are declared below. Every entity gets
// tenant-scoped CRUD, validation, version history, audit, and stage-then-justify on governed fields.
import { all, one, run } from './db.js';
import { uuid, now, S, J, HttpError, ml } from './lib/util.js';
import * as cat from './catalog.js';
import { audit, recordVersion } from './audit.js';
import { orgConfig } from './entitlements.js';

// Classes kept in dedicated tables with dedicated routes (not handled by the generic engine).
const DEDICATED = new Set(['Group', 'Organization', 'Project', 'ObsNode', 'User', 'Role', 'Permission', 'UserPreference', 'License', 'Configuration',
  'AddOnActivation', 'ComplianceStandardActivation', 'AuditLog', 'AIUsageLog', 'NotificationAlert', 'Backup', 'RacsiActivity']);

const f = (name, type, extra = {}) => ({ name, type, ...extra });
// Platform entities not in D09 (Dynamic Apps Standard SRS data model, Section 6).
const EXTRA = {
  CustomKpi: { module: 'M10', perm: 'governance', fields: [f('name', 'text', { required: true, ml: true }), f('formula', 'text', { ml: true }), f('target', 'number'), f('unit', 'string'), f('owner', 'string'), f('process_tag', 'string')] },
  BpmnDiagram: { module: 'M00', perm: 'bpmn', fields: [f('title', 'text', { required: true, ml: true }), f('description', 'text', { ml: true }), f('e2e_id', 'string'), f('obs_node', 'string'), f('xml', 'longtext')] },
  WbsNode: { module: 'M36', perm: 'projects', fields: [f('name', 'text', { required: true, ml: true }), f('parent_id', 'ref', { ref: 'WbsNode' }), f('start', 'date'), f('end', 'date'), f('percent', 'number'), f('predecessors', 'json'), f('task_refs', 'json'), f('sort', 'number')] },
  ProjectTemplate: { module: 'M00', perm: 'templates', versioned: true, fields: [f('code', 'string'), f('name', 'text', { required: true, ml: true }), f('description', 'text', { ml: true }), f('scope', 'enum', { options: ['Universal', 'Vertical'] }), f('vertical_id', 'string'), f('mode', 'enum', { options: ['Full', 'SME'] }), f('track', 'string'), f('focus', 'enum', { options: ['All', 'Digital', 'AI', 'Custom'] }), f('status', 'enum', { options: ['Draft', 'Published', 'Retired'] }), f('phases', 'json'), f('roles', 'json'), f('milestones', 'json'), f('use_count', 'number'), f('platform', 'boolean'), f('blueprint', 'json')] },
  GateDefinition: { module: 'M00', perm: 'templates', versioned: true, global: true, fields: [f('name', 'text', { required: true, ml: true }), f('purpose', 'text', { ml: true }), f('entry_criteria', 'text', { ml: true }), f('exit_criteria', 'text', { ml: true }), f('approvers', 'json'), f('decisions', 'json'), f('verticals', 'json'), f('modes', 'json'), f('tracks', 'json'), f('checklists', 'json'), f('enforce', 'boolean'), f('status', 'enum', { options: ['Draft', 'Published', 'Retired'] })] },
  ChecklistTemplate: { module: 'M00', perm: 'templates', versioned: true, global: true, fields: [f('name', 'text', { required: true, ml: true }), f('scope', 'enum', { options: ['Universal', 'Vertical'] }), f('vertical_id', 'string'), f('mode', 'string'), f('track', 'string'), f('items', 'json'), f('status', 'enum', { options: ['Draft', 'Published', 'Retired'] })] },
  PhaseChecklist: { module: 'M00', perm: 'projects', fields: [f('phase', 'number'), f('gate_id', 'string'), f('checklist_id', 'string'), f('version', 'number'), f('items', 'json'), f('state', 'enum', { options: ['Open', 'Submitted', 'Signed off'] }), f('decision', 'enum', { options: ['Go', 'No-Go', 'Hold', 'Recycle'] }), f('decision_comment', 'text'), f('waiver', 'text'), f('mandatory', 'boolean')] },
  Vertical: { module: 'M00', perm: 'verticals', versioned: true, global: true, fields: [f('prefix', 'string', { required: true }), f('name', 'text', { required: true, ml: true }), f('description', 'text', { ml: true }), f('parent', 'string'), f('segments', 'text', { ml: true }), f('value_proposition', 'text', { ml: true }), f('standards', 'json'), f('macro_processes', 'json'), f('e2e_processes', 'json'), f('lifecycle', 'enum', { options: ['Draft', 'Review', 'Approved', 'Active', 'Deprecated', 'Retired'] }), f('owner', 'string'), f('drivers', 'json'), f('retention_years', 'number'), f('data_extensions', 'json')] },
  SmeTrack: { module: 'M00', perm: 'sme', versioned: true, global: true, fields: [f('code', 'string', { required: true }), f('name', 'text', { required: true, ml: true }), f('description', 'text', { ml: true }), f('segment', 'string'), f('macro_processes', 'json'), f('e2e_processes', 'json'), f('gates', 'number'), f('items_per_gate', 'number'), f('duration_days', 'number'), f('score_min', 'number'), f('score_max', 'number'), f('lifecycle', 'string')] },
  ComplexityCriterion: { module: 'M00', perm: 'sme', versioned: true, global: true, fields: [f('code', 'string', { required: true }), f('name', 'text', { required: true, ml: true }), f('weight', 'number', { required: true }), f('vertical_id', 'string'), f('levels', 'json')] },
  ComplexityScore: { module: 'M00', perm: 'projects', fields: [f('values', 'json'), f('score', 'number'), f('recommended_track', 'string'), f('chosen_track', 'string'), f('override_justification', 'text'), f('override_approved_by', 'string')] },
  Pack: { module: 'M51', perm: 'config', global: true, fields: [f('code', 'string'), f('name', 'text', { ml: true }), f('kind', 'string'), f('price', 'number'), f('segment', 'string'), f('contents', 'json'), f('rules', 'json')] },
  OnboardingPlan: { module: 'M51', perm: 'onboarding', fields: [f('name', 'text', { ml: true }), f('start', 'date'), f('target_days', 'number'), f('steps', 'json'), f('imports', 'json'), f('metrics', 'json'), f('status', 'string')] },
  Webhook: { module: 'M16', perm: 'integrations', fields: [f('name', 'string', { required: true }), f('url', 'string'), f('events', 'json'), f('enabled', 'boolean')] },
  // Training plan structure (release 1.1): program → training with level, identifier, objectives, duration,
  // prerequisites, a half-day agenda of lectures, quizzes and workshops, and its value proposition per persona.
  Persona: { module: 'M49', perm: 'training', fields: [f('code', 'string', { required: true }), f('name', 'text', { required: true, ml: true }), f('population', 'enum', { options: ['DG', 'Management', 'Member', 'Custom'] }), f('description', 'text', { ml: true }),
    f('behaviour', 'longtext', { ml: true }), f('pain_points', 'longtext', { ml: true }), f('hopes', 'longtext', { ml: true })] },
  TrainingProgram: { module: 'M49', perm: 'training', fields: [f('code', 'string', { required: true }), f('name', 'text', { required: true, ml: true }), f('description', 'longtext', { ml: true }), f('axis', 'text', { ml: true }), f('year', 'number'), f('sort', 'number')] },
  TrainingCourse: { module: 'M49', perm: 'training', versioned: true, fields: [f('program_id', 'ref', { ref: 'TrainingProgram', required: true }), f('training_code', 'string', { required: true }), f('name', 'text', { required: true, ml: true }), f('level', 'string', { required: true }),
    f('objectives', 'json'), f('duration_days', 'number', { required: true }), f('prerequisites', 'longtext', { ml: true }), f('agenda', 'json'), f('personas', 'json'), f('theme_id', 'ref', { ref: 'TrainingTheme' }), f('groups', 'number'), f('modality', 'string'),
    f('status', 'enum', { options: ['Draft', 'In Review', 'Approved'] }), f('sort', 'number')] },
  KbArticle: { module: 'M12', perm: 'kb', fields: [f('title', 'text', { required: true, ml: true }), f('body', 'longtext', { ml: true }), f('standard', 'string'), f('process_tag', 'string'), f('language', 'string')] },
  // Release 1.10: documented information, audits, controlled choice lists and project blueprints.
  DocumentTemplate: { module: 'M24', perm: 'documents', versioned: true, global: true, fields: [f('code', 'string', { required: true }), f('name', 'text', { required: true, ml: true }), f('category', 'string'), f('description', 'text', { ml: true }), f('e2e_id', 'string'), f('standards', 'json'), f('sections', 'json'), f('formatting', 'json'), f('status', 'enum', { options: ['Draft', 'Published', 'Retired'] })] },
  DocumentLayout: { module: 'M24', perm: 'documents', versioned: true, fields: [f('header', 'text', { ml: true }), f('footer', 'text', { ml: true }), f('logo', 'string'), f('formatting', 'json'), f('variants', 'json')] },
  AuditProgram: { module: 'M18', perm: 'audits', versioned: true, fields: [f('code', 'string', { required: true }), f('name', 'text', { required: true, ml: true }), f('kind', 'enum', { options: ['Internal audit', 'External audit', 'Inspection', 'Certification audit'] }), f('standard', 'string'),
    f('objectives', 'longtext', { ml: true }), f('criteria', 'text', { ml: true }), f('scope', 'longtext', { ml: true }), f('processes', 'json'), f('duration_days', 'number'), f('lead_auditor', 'string'), f('team', 'json'), f('auditees', 'json'),
    f('frequency', 'enum', { options: ['Monthly', 'Quarterly', 'Semi-annual', 'Annual', 'Every two years', 'Every three years', 'Custom'] }), f('frequency_custom', 'text', { ml: true }), f('frequency_days', 'number'), f('frequency_justification', 'longtext', { ml: true }),
    f('planned_date', 'date'), f('performed_date', 'date'), f('next_date', 'date'), f('status', 'enum', { options: ['Planned', 'In progress', 'Reported', 'Closed'] }), f('summary', 'longtext', { ml: true }), f('strengths', 'longtext', { ml: true }), f('conclusion', 'longtext', { ml: true }), f('follow_up', 'longtext', { ml: true })] },
  AuditFinding: { module: 'M18', perm: 'audits', versioned: true, fields: [f('audit_id', 'ref', { ref: 'AuditProgram', required: true }), f('code', 'string'), f('grade', 'enum', { options: ['Major', 'Minor', 'Observation', 'Improvement', 'Strength'], required: true }), f('requirement', 'string'), f('clause', 'string'),
    f('statement', 'longtext', { ml: true, required: true }), f('evidence', 'longtext', { ml: true }), f('process', 'string'), f('auditee', 'string'), f('root_cause', 'longtext', { ml: true }), f('correction', 'longtext', { ml: true }), f('corrective_action', 'longtext', { ml: true }),
    f('action_owner', 'string'), f('due', 'date'), f('action_id', 'string'), f('effectiveness', 'longtext', { ml: true }), f('status', 'enum', { options: ['Open', 'Action planned', 'Verified', 'Closed'] })] },
  ChoiceList: { module: 'M00', perm: 'config', global: true, fields: [f('field', 'string', { required: true }), f('name', 'text', { ml: true }), f('values', 'json')] },
  ProjectBlueprint: { module: 'M00', perm: 'blueprints', versioned: true, fields: [f('code', 'string', { required: true }), f('name', 'text', { required: true, ml: true }), f('description', 'text', { ml: true }), f('source_project', 'string'), f('vertical_id', 'string'), f('mode', 'enum', { options: ['Full', 'SME'] }), f('track', 'string'), f('content', 'json'), f('options', 'json'), f('status', 'enum', { options: ['Draft', 'Published', 'Retired'] }), f('use_count', 'number')] },
  ProjectCustomElement: { module: 'M00', perm: 'projects', fields: [f('kind', 'enum', { options: ['phase', 'mp', 'step'] }), f('parent', 'string'), f('name', 'text', { required: true, ml: true }), f('description', 'text', { ml: true }), f('owner', 'string'), f('roles', 'json'), f('status', 'enum', { options: ['Not started', 'In progress', 'Completed'] }), f('blueprint_ref', 'string')] },
  ReportingPlanItem: { module: 'M10', perm: 'projects', fields: [f('name', 'text', { required: true, ml: true }), f('audience', 'text', { ml: true }), f('frequency', 'enum', { options: ['Weekly', 'Monthly', 'Quarterly', 'Semi-annual', 'Annual', 'On demand'] }), f('format', 'enum', { options: ['PDF', 'Excel', 'Word', 'Dashboard'] }), f('owner', 'string'), f('next_due', 'date'), f('origin', 'string'), f('blueprint_ref', 'string')] },
};
// Derived fields computed on save: the next planned date of an audit from its frequency (FR-DA-AFP-01).
export const AUDIT_FREQ_DAYS = { Monthly: 30, Quarterly: 91, 'Semi-annual': 182, Annual: 365, 'Every two years': 730, 'Every three years': 1095 };
function derive(entity, d) {
  if (entity === 'AuditProgram') {
    const days = d.frequency === 'Custom' ? Number(d.frequency_days || 0) : AUDIT_FREQ_DAYS[d.frequency];
    const base = d.performed_date || d.planned_date;
    if (days && base) { const x = new Date(base); x.setDate(x.getDate() + days); d.next_date = x.toISOString().slice(0, 10); }
  }
  return d;
}
const GOVERNED = /(^|_)(status|score|rating|level|rank|priority|effectiveness|decision|approval_status|lifecycle|rag|verdict)($|_)/;

function parseType(dt, rule) {
  const d = dt || '';
  if (d.startsWith('Enum')) { const m = d.match(/Enum\((.*)\)/); return { type: 'enum', options: m ? m[1].split(',').map(s => s.trim()) : [] }; }
  if (d.startsWith('UUID')) { const m = (rule || '').match(/FK to ([A-Za-z]+)/); return { type: 'ref', ref: m ? m[1] : null }; }
  if (d.startsWith('Array<UUID')) return { type: 'json' };
  if (d.startsWith('Array') || d === 'JSON') return { type: 'json' };
  if (d.startsWith('Integer') || d.startsWith('Decimal')) return { type: 'number' };
  if (d === 'Boolean') return { type: 'boolean' };
  if (d === 'Date') return { type: 'date' };
  if (d === 'DateTime') return { type: 'datetime' };
  if (d === 'Text') return { type: 'longtext', ml: true };
  const len = Number((d.match(/String\((\d+)\)/) || [])[1] || 0);
  return { type: 'text', ml: len >= 60, max: len || undefined };
}

let registry = null;
export function entityRegistry() {
  if (registry) return registry;
  registry = {};
  const classes = cat.list('class'); const attrs = cat.list('attribute'); const mps = cat.byId('mp');
  for (const c of classes) {
    if (DEDICATED.has(c.name)) continue;
    const firstMp = (c.mps || [])[0]; const module = firstMp && mps.get(firstMp)?.module || 'M00';
    const fields = attrs.filter(a => a.classId === c.id)
      .filter(a => a.name !== 'organization_id' && !(a.type.startsWith('UUID') && a.name === toSnake(c.name) + '_id') && !(a.name.endsWith('_id') && a.type === 'UUID' && a.rule.startsWith('Opaque')))
      .map(a => ({ name: a.name, ...parseType(a.type, a.rule), required: a.required === 'Y', rule: a.rule, attrId: a.id }));
    registry[c.name] = { name: c.name, classId: c.id, description: c.description, parent: c.parent, module, perm: 'module', mps: c.mps, fields,
      versioned: ['AIUseCase', 'RexEntry', 'QuestionnaireTemplate', 'ScopeOfWork', 'BusinessRule', 'Control', 'KpiDefinition'].includes(c.name) };
  }
  for (const [name, def] of Object.entries(EXTRA)) registry[name] = { name, classId: null, mps: [], versioned: false, ...def };
  // Governance entities are managed with governance rights rather than module rights.
  for (const g of ['BusinessRule', 'Control', 'RiskOpportunity', 'KpiDefinition', 'Action', 'ActionEvaluation', 'RexEntry']) if (registry[g]) registry[g].perm = g === 'RexEntry' ? 'rex' : 'governance';
  if (registry.AIUseCase) { registry.AIUseCase.perm = 'ai'; registry.AIUseCase.versioned = true; }
  if (registry.ExternalIntegration) registry.ExternalIntegration.perm = 'integrations';
  // Release 1.1: the template library is shared by the platform (org_id NULL) and extended by each Organization;
  // WhatsApp and Application join the response channels; Combination names a plan played over several channels.
  if (registry.QuestionnaireTemplate) registry.QuestionnaireTemplate.global = true;
  const addOptions = (entity, field, extra) => { const f = registry[entity]?.fields.find(x => x.name === field); if (f?.options) f.options = [...new Set([...f.options, ...extra])]; };
  addOptions('QuestionnaireResponse', 'channel_used', ['Application', 'WhatsApp']);
  // Release 1.10: anonymized questionnaires and retention (NFR-DA-QLT-02/03).
  if (registry.Questionnaire && !registry.Questionnaire.fields.some(x => x.name === 'anonymized')) registry.Questionnaire.fields.push(f('anonymized', 'boolean'));
  addOptions('Stakeholder', 'preferred_channel', ['Application', 'WhatsApp', 'Combination']);
  addOptions('Questionnaire', 'elaboration_mode', ['Load + AI', 'Load + Manual', 'Load + AI + Manual', 'AI + Manual']);
  return registry;
}
const toSnake = s => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

export function entityDef(name) {
  const d = entityRegistry()[name];
  if (!d) throw new HttpError(404, 'err.unknownEntity', { entity: name });
  return d;
}
/** Permission code required to read / write an entity. */
export function permFor(def, write) {
  switch (def.perm) {
    case 'governance': return write ? 'governance.manage' : 'governance.view';
    case 'ai': return write ? 'ai.manage' : 'ai.view';
    case 'templates': return write ? 'templates.manage' : 'catalog.view';
    case 'verticals': return write ? 'verticals.manage' : 'catalog.view';
    case 'sme': return write ? 'sme.manage' : 'catalog.view';
    case 'rex': return write ? 'rex.manage' : 'governance.view';
    case 'bpmn': return write ? 'bpmn.edit' : 'bpmn.view';
    case 'projects': return write ? 'tasks.execute' : 'projects.view';
    case 'config': return write ? 'config.manage' : 'config.view';
    case 'onboarding': return write ? 'onboarding.manage' : 'config.view';
    case 'integrations': return write ? 'integrations.manage' : 'config.view';
    case 'kb': return write ? 'kb.manage' : 'ai.view';
    case 'training': return write ? 'm49.edit' : 'm49.view';
    case 'documents': return write ? 'documents.manage' : 'reports.view';
    case 'audits': return write ? 'audits.manage' : 'audits.view';
    case 'blueprints': return write ? 'blueprints.manage' : 'catalog.view';
    default: return `${def.module.toLowerCase()}.${write ? 'edit' : 'view'}`;
  }
}

function coerce(field, v, lang, prev) {
  if (v === undefined) return prev;
  if (v === null || v === '') { if (field.required) throw new HttpError(422, 'err.required', { field: field.name }); return null; }
  switch (field.type) {
    case 'number': { const n = Number(v); if (Number.isNaN(n)) throw new HttpError(422, 'err.invalidNumber', { field: field.name }); return n; }
    case 'boolean': return v === true || v === 'true' || v === 1 || v === '1';
    case 'enum': if (field.options?.length && !field.options.includes(v)) throw new HttpError(422, 'err.invalidOption', { field: field.name, value: v }); return v;
    case 'json': return typeof v === 'string' ? (J(v) ?? v) : v;
    case 'text': case 'longtext':
      if (field.ml) {
        if (typeof v === 'object') return ml(v);
        const base = prev && typeof prev === 'object' ? { ...prev } : { en: '', fr: '', ar: '' };
        const wasSame = prev && typeof prev === 'object' && prev.en === prev.fr && prev.fr === prev.ar;
        if (!prev || wasSame) return { en: v, fr: v, ar: v };
        base[lang] = v; return base;
      }
      if (field.max && String(v).length > field.max) throw new HttpError(422, 'err.tooLong', { field: field.name, max: field.max });
      return typeof v === 'object' ? v : String(v);
    default: return v;
  }
}

export function validate(def, input, lang, prev = {}) {
  const out = { ...prev };
  for (const fld of def.fields) {
    const val = coerce(fld, input[fld.name], lang, prev[fld.name]);
    if (val === undefined || val === null) { if (fld.required && (prev[fld.name] == null)) throw new HttpError(422, 'err.required', { field: fld.name }); if (val === null) out[fld.name] = null; continue; }
    out[fld.name] = val;
  }
  // Keep extra, non-dictionary keys (e.g. i18n helper fields) supplied by seeded data.
  for (const [k, v] of Object.entries(input)) if (!(k in out) && !def.fields.find(x => x.name === k) && !k.startsWith('_')) out[k] = v;
  return out;
}

const rowOut = r => r && ({ id: r.id, entity: r.entity, org_id: r.org_id, project_id: r.project_id, ref: r.ref, version: r.version, created_at: r.created_at, updated_at: r.updated_at, created_by: r.created_by, updated_by: r.updated_by, ...J(r.data, {}) });

export function listRecords(req, entity, { projectId, filter = {}, limit = 500, offset = 0, q } = {}) {
  const def = entityDef(entity);
  const params = [entity]; let where = 'entity=?';
  if (def.global) { where += ' AND (org_id IS NULL OR org_id=?)'; params.push(req.orgId); }
  else { where += ' AND org_id=?'; params.push(req.orgId); }
  if (projectId) { where += ' AND project_id=?'; params.push(projectId); }
  for (const [k, v] of Object.entries(filter)) { if (!/^[a-z_0-9]+$/i.test(k)) continue; where += ` AND json_extract(data,'$.${k}')=?`; params.push(v); }
  if (q) { where += ' AND data LIKE ?'; params.push('%' + q + '%'); }
  const total = one(`SELECT COUNT(*) n FROM records WHERE ${where}`, ...params).n;
  const rows = all(`SELECT * FROM records WHERE ${where} ORDER BY created_at, id LIMIT ? OFFSET ?`, ...params, Number(limit), Number(offset));
  return { total, items: rows.map(rowOut) };
}
export function getRecord(req, entity, id) {
  const def = entityDef(entity);
  const r = one(`SELECT * FROM records WHERE id=? AND entity=?`, id, entity);
  if (!r || (r.org_id && r.org_id !== req.orgId) || (!r.org_id && !def.global)) throw new HttpError(404, 'err.notFound');
  return rowOut(r);
}

export function createRecord(req, entity, body, { projectId = null, ref = null, skipAudit = false } = {}) {
  const def = entityDef(entity);
  const data = derive(entity, validate(def, body || {}, req.lang));
  const id = uuid(); const t = now();
  const orgId = def.global && req.user?.is_platform && body?._global ? null : req.orgId;
  run(`INSERT INTO records(id,entity,org_id,project_id,ref,data,version,created_by,created_at,updated_by,updated_at) VALUES(?,?,?,?,?,?,1,?,?,?,?)`,
    id, entity, orgId, projectId, ref, S(data), req.user?.id ?? null, t, req.user?.id ?? null, t);
  recordVersion(entity, id, orgId, data, req.user?.id, body?._justification);
  if (!skipAudit) audit(req, entity, id, 'create', null, data, body?._justification);
  return getRecord(req, entity, id);
}

export function updateRecord(req, entity, id, body) {
  const def = entityDef(entity);
  const cur = getRecord(req, entity, id);
  if (!cur.org_id && !req.user.is_platform) throw new HttpError(403, 'err.platformOnly');
  const { id: _i, entity: _e, org_id, project_id, ref, version, created_at, updated_at, created_by, updated_by, ...prev } = cur;
  const next = derive(entity, validate(def, body || {}, req.lang, prev));
  const governedChange = Object.keys(next).some(k => GOVERNED.test(k) && JSON.stringify(next[k]) !== JSON.stringify(prev[k]));
  const cfg = orgConfig(req.orgId);
  if (governedChange && cfg?.justification_required && !String(body?._justification || '').trim()) throw new HttpError(422, 'err.justificationRequired');
  const t = now();
  run(`UPDATE records SET data=?, version=version+1, updated_by=?, updated_at=? WHERE id=?`, S(next), req.user.id, t, id);
  recordVersion(entity, id, cur.org_id, next, req.user.id, body?._justification);
  audit(req, entity, id, 'update', prev, next, body?._justification);
  return getRecord(req, entity, id);
}

export function deleteRecord(req, entity, id) {
  const cur = getRecord(req, entity, id);
  if (!cur.org_id && !req.user.is_platform) throw new HttpError(403, 'err.platformOnly');
  run(`DELETE FROM records WHERE id=?`, id);
  audit(req, entity, id, 'delete', cur, null, req.body?._justification);
  return { ok: true };
}

export function revertRecord(req, entity, id, version) {
  const r = one(`SELECT data FROM entity_versions WHERE entity=? AND record_id=? AND version=?`, entity, id, Number(version));
  if (!r) throw new HttpError(404, 'err.notFound');
  const data = J(r.data);
  getRecord(req, entity, id);
  run(`UPDATE records SET data=?, version=version+1, updated_by=?, updated_at=? WHERE id=?`, S(data), req.user.id, now(), id);
  recordVersion(entity, id, req.orgId, data, req.user.id, req.body?._justification || `Revert to version ${version}`);
  audit(req, entity, id, 'revert', { version }, data, req.body?._justification);
  return getRecord(req, entity, id);
}
