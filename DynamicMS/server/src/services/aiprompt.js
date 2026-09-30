// Prompt of an AI use case for a given step: the use case's prompt template completed with
// the live context of the step (organization, standards, the values already typed in this
// step and the outputs of the previous steps of the macro process).
import { get, all, P } from '../db.js';
import { catalog, loc } from '../catalog/store.js';
import { FORM_KINDS } from '../catalog/forms.js';

const LANG_NAME = { en: 'English', fr: 'French', ar: 'Arabic' };
const flat = (v, lang) => {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.map(x => flat(x, lang)).filter(Boolean).join('; ');
  if (typeof v === 'object') { if (v.name) return flat(v.name, lang); if (v.en || v.fr || v.ar) return loc(v, lang); return Object.entries(v).filter(([k]) => !k.startsWith('_')).map(([k, x]) => `${k}: ${flat(x, lang)}`).join(', '); }
  return String(v);
};

export function buildPrompt(usecase, { projectId, stepExecId, input, lang = 'en' }) {
  const c = catalog();
  const p = get('SELECT * FROM projects WHERE id=?', projectId);
  const org = get('SELECT name, sector, size, employees FROM organizations WHERE id=?', p.org_id);
  const exec = stepExecId ? get('SELECT * FROM step_exec WHERE id=? AND project_id=?', stepExecId, projectId) : null;
  const step = c.stepById[exec?.step_id || usecase.linked_step];
  const mp = c.mpById[step?.mp || usecase.linked_mp];
  const tmpl = loc(P(usecase.prompt), lang) || loc(c.aiUseCases.find(a => a.id === usecase.code)?.prompt, lang) || '';
  const lines = [];
  lines.push(`Organization: ${loc(P(org.name), lang)} (${org.size}, sector ${org.sector}${org.employees ? `, ${org.employees} employees` : ''}).`);
  lines.push(`Project: ${p.code}, ${p.ms_type}; standards: ${(P(p.standards) || []).join(', ')}.`);
  if (step) {
    lines.push(`Step: ${step.id} — ${loc(step.name, lang)} (${loc(step.roleName, lang)}).`);
    lines.push(`What the step requires: ${loc(step.description, lang).replace(/\n/g, ' ')}`);
    const def = FORM_KINDS[step.formKind];
    if (def) lines.push(`Form fields: ${def.fields.map(f => loc(f.label, lang)).join(', ')}.`);
  }
  if (exec) {
    const f = P(exec.fields) || {};
    const typed = Object.entries(f).filter(([k, v]) => !k.startsWith('_') && v !== null && v !== '' && k !== 'records').map(([k, v]) => `${k}: ${flat(v, lang)}`);
    if (typed.length) lines.push(`Already typed in this step: ${typed.join(' | ').slice(0, 1500)}`);
    const prev = all(`SELECT step_id, value FROM step_exec WHERE project_id=? AND mp_id=? AND status='Done' AND seq < ? ORDER BY seq DESC LIMIT 6`, projectId, exec.mp_id, exec.seq);
    if (prev.length) lines.push(`Results of the previous steps: ${prev.reverse().map(x => `${loc(c.stepById[x.step_id]?.name, lang)} = ${flat(P(x.value), lang)}`).join(' | ').slice(0, 1500)}`);
  }
  if (mp) lines.push(`Macro process outputs: ${mp.sipoc.O.map(x => loc(x, lang)).join(', ')}.`);
  if (input) lines.push(`User request: ${String(input).slice(0, 800)}`);
  const system = `${tmpl}\nWrite in ${LANG_NAME[lang] || 'English'}. Keep each item under 60 words.`;
  return { system, user: lines.join('\n') };
}
