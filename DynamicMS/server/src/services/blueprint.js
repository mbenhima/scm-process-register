// Project template blueprints: what a project created from a template contains — its end-to-end
// processes, macro processes, tasks and steps, business rules, controls, risks and
// opportunities, alerts, KPIs and reporting. A blueprint stores only what differs from the
// reference catalog (included / excluded, renamed, re-assigned, custom items) plus the full
// lists of rules, controls, risks, alerts, KPIs and reports, so every part is editable (CRUD).
import { all, get, J, P } from '../db.js';
import { catalog } from '../catalog/store.js';
import { activatedMps } from '../seed/project.js';
import { QMS_KPIS, HSE_KPIS } from '../seed/records.js';

export const E2E_ORDER = ['E2E-01', 'E2E-02', 'E2E-03', 'E2E-04', 'E2E-05', 'E2E-06', 'E2E-07', 'E2E-08', 'E2E-09', 'E2E-10', 'E2E-11', 'E2E-12'];
export const LISTS = ['rules', 'controls', 'risks', 'alerts', 'kpis', 'reports'];
const S = (en, fr, ar) => ({ en, fr, ar });

export function emptyBlueprint() {
  return { e2e: {}, mp: {}, step: {}, custom: { e2e: [], mp: [], step: [] }, lists: null };
}
export function blueprintOf(tpl) {
  const b = P(tpl?.content) || {};
  const out = emptyBlueprint();
  for (const k of ['e2e', 'mp', 'step']) out[k] = b[k] || {};
  out.custom = { e2e: b.custom?.e2e || [], mp: b.custom?.mp || [], step: b.custom?.step || [] };
  out.lists = b.lists || null;
  return out;
}

// Macro processes a template activates by default: its management system and mode, for its
// vertical (or the universal set), regardless of the packs of a given organization.
export function defaultMps(tpl) {
  const cat = catalog();
  const all1 = new Set(cat.macroProcesses.map(m => m.id));
  return activatedMps(cat, { sector: tpl.vertical || 'UNI', size: tpl.mode === 'SME' ? 'SME' : 'Large' }, tpl.ms_type || 'QMS', all1);
}

// Default lists, built from the catalog for the activated macro processes.
export function defaultLists(tpl) {
  const cat = catalog();
  const mps = new Set(defaultMps(tpl).map(m => m.id));
  const qhse = tpl.ms_type === 'QHSE';
  const rules = cat.rules.filter(r => mps.has(r.mp)).map(r => ({ id: r.id, mp: r.mp, step: r.step || '', condition: r.condition, action: r.action, type: r.type || 'Validation', severity: 'Medium', owner: cat.mpById[r.mp]?.ownerRoleCode || 'ims_manager' }));
  const controls = cat.controls.map(c => ({ id: c.id, name: c.name, description: c.description || null, type: c.type, frequency: 'Quarterly', owner: 'ims_manager', mp: c.steps?.[0] ? c.steps[0].split('.')[0] : '' }));
  const risks = cat.risks.map(r => ({ id: r.id, kind: 'Risk', title: r.name, category: r.category, likelihood: Math.max(1, Math.min(5, Math.round(Math.sqrt(r.inherent || 9)))), impact: Math.max(1, Math.min(5, Math.round((r.inherent || 9) / Math.max(1, Math.round(Math.sqrt(r.inherent || 9)))))), owner: 'risk_manager', treatment: S('Reduce', 'Réduire', 'تقليل'), mp: '' }));
  const alerts = [
    { id: 'STEP_OVERDUE', name: S('Step overdue', 'Étape en retard', 'خطوة متأخرة'), severity: 'Medium', enabled: true, escalation: 'ims_manager' },
    { id: 'KPI_OFF_TARGET', name: S('KPI off target', 'KPI hors cible', 'مؤشر خارج الهدف'), severity: 'High', enabled: true, escalation: 'performance_manager' },
    { id: 'NC_CRITICAL', name: S('Critical nonconformity', 'Non-conformité critique', 'عدم مطابقة حرجة'), severity: 'Critical', enabled: true, escalation: 'quality_manager' },
    { id: 'ACTION_OVERDUE', name: S('Action overdue', 'Action en retard', 'إجراء متأخر'), severity: 'Medium', enabled: true, escalation: 'ims_manager' },
    { id: 'DOC_REVIEW_DUE', name: S('Document review due', 'Revue de document à faire', 'مراجعة وثيقة مستحقة'), severity: 'Low', enabled: true, escalation: 'document_controller' },
    { id: 'GATE_PENDING', name: S('Gate decision pending', 'Décision de jalon en attente', 'قرار بوابة معلق'), severity: 'Medium', enabled: true, escalation: 'top_management' },
    ...cat.alerts.filter(a => !a.step || mps.has(a.step.split('.')[0])).map(a => ({ id: a.id, name: a.condition, severity: a.severity || 'Medium', enabled: true, escalation: 'ims_manager' })),
  ];
  const kpis = [...cat.kpis.filter(k => mps.has(k.mp)).map(k => ({ id: k.id, name: k.name, formula: k.formula, target: k.target, unit: /%/.test(k.target) ? '%' : '', frequency: 'Monthly', owner: cat.mpById[k.mp]?.ownerRoleCode || 'performance_manager', mp: k.mp })),
    ...[...QMS_KPIS, ...(qhse ? HSE_KPIS : [])].map(k => ({ id: k.code, name: k.name, formula: k.formula, target: k.target, unit: k.unit ?? (/%/.test(k.target) ? '%' : ''), frequency: 'Monthly', owner: k.owner || 'performance_manager', mp: k.mp || '' }))];
  const reports = cat.reports.map(r => ({ id: r.id, name: r.name, audience: (r.audience || []).map(a => a.en).join(', '), frequency: r.cadence, format: 'PDF', owner: 'ims_manager' }));
  return { rules, controls, risks, alerts, kpis, reports };
}

export function listsOf(tpl) {
  const b = blueprintOf(tpl);
  const d = b.lists ? null : defaultLists(tpl);
  return Object.fromEntries(LISTS.map(k => [k, b.lists?.[k] ?? d[k]]));
}

/** The structure of a template: phases → macro processes → steps, with the blueprint applied
 *  (include, gate, owner, role, names) and its custom items. Localized by the caller. */
export function structureOf(tpl) {
  const cat = catalog();
  const b = blueprintOf(tpl);
  const gates = new Set((P(tpl.phases) || []).filter(x => x.gate).map(x => x.e2e));
  const mps = defaultMps(tpl);
  const on = new Set(mps.map(m => m.id));
  const order = orderOf(b);
  return order.map(eid => {
    const e = cat.e2eById[eid] || b.custom.e2e.find(x => x.id === eid);
    const ep = b.e2e[eid] || {};
    const catMps = (cat.e2eById[eid]?.mpIds || []).filter(id => cat.mpById[id] && !cat.mpById[id].custom && (on.has(id) || b.mp[id]?.include === true));
    const custMps = b.custom.mp.filter(m => m.e2e === eid);
    const mpRows = [...catMps.map(id => cat.mpById[id]), ...custMps].map(m => {
      const mp = b.mp[m.id] || {};
      const custom = !cat.mpById[m.id] || !!cat.mpById[m.id].custom || !!m.custom;
      const steps = [...(custom ? [] : (cat.stepsByMp[m.id] || [])), ...b.custom.step.filter(s => s.mp === m.id)].map(s => {
        const sp = b.step[s.id] || {};
        return { id: s.id, mp: m.id, name: sp.name || s.name, role: sp.role || s.roleCode || m.ownerRoleCode || 'ims_manager', include: sp.include !== false, custom: !cat.stepById[s.id] || !!cat.stepById[s.id].custom, type: s.type || 'User Task', brief: sp.brief || s.brief || null };
      });
      return { id: m.id, code: m.code, e2e: eid, name: mp.name || m.name, owner: mp.owner || m.ownerRoleCode || 'ims_manager', include: mp.include !== undefined ? mp.include : (custom || on.has(m.id)), custom, tier: m.tier ?? null, goal: mp.goal || m.goal || null, steps };
    });
    return { id: eid, name: ep.name || e?.name, goals: ep.goals || e?.goals || null, include: ep.include !== false, gate: ep.gate !== undefined ? ep.gate : gates.has(eid), custom: !cat.e2eById[eid] || !!cat.e2eById[eid].custom, mps: mpRows };
  });
}

export function orderOf(b) {
  const order = [...E2E_ORDER];
  for (const c of b.custom.e2e) {
    const i = c.after ? order.indexOf(c.after) : -1;
    order.splice(i >= 0 ? i + 1 : order.length, 0, c.id);
  }
  return order;
}

// Custom elements of every template, added to the catalog lookups (not to its lists) so a
// project created from a template resolves its custom phases, macro processes and steps.
export function overlayCustoms(c) {
  let rows = [];
  try { rows = all('SELECT id, code, content FROM project_templates WHERE content IS NOT NULL'); } catch { return; }
  for (const r of rows) {
    const b = P(r.content) || {};
    for (const e of b.custom?.e2e || []) c.e2eById[e.id] = { type: 'Custom', typeName: S('Custom', 'Personnalisé', 'مخصص'), trigger: null, terminal: null, description: null, ...e, mpIds: (b.custom?.mp || []).filter(m => m.e2e === e.id).map(m => m.id), custom: true };
    for (const m of b.custom?.mp || []) {
      c.mpById[m.id] = { tier: 0, scope: 'Q', activation: {}, sipoc: { S: [], I: [], P: [], O: [], C: [] }, clauses: '', standards: [], trigger: null, terminal: null, function: null, ...m, custom: true };
      c.mpByCode[m.code] = c.mpById[m.id];
      if (c.e2eById[m.e2e] && !c.e2eById[m.e2e].custom) c.e2eById[m.e2e] = { ...c.e2eById[m.e2e], mpIds: [...new Set([...c.e2eById[m.e2e].mpIds, m.id])] };
      const task = { id: `${m.id}.T1`, mp: m.id, seq: 1, name: m.name };
      c.tasksByMp[m.id] = [task];
    }
    for (const s of b.custom?.step || []) {
      const step = { type: 'User Task', typeName: S('User Task', 'Tâche utilisateur', 'مهمة المستخدم'), formKind: 'execute', task: c.tasksByMp[s.mp]?.[0]?.id || null, ...s, roleCode: s.role || s.roleCode, custom: true };
      c.stepById[s.id] = step;
      // Only custom macro processes list their steps here; a custom step added to a reference
      // macro process exists in the projects of its template only (through step_exec).
      if (c.mpById[s.mp]?.custom) { const list = (c.stepsByMp[s.mp] ||= []); if (!list.some(x => x.id === s.id)) list.push(step); }
    }
  }
}

export const tplRow = (id) => get('SELECT * FROM project_templates WHERE id=?', id);
export const J2 = J;
