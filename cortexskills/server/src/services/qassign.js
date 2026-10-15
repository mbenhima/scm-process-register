// Who answers what (release 1.15): a section, a sub-section or a single question of a questionnaire can be given to
// one or more respondents. Three ways to fill the assignment: tick the respondents element by element, paste a table
// (element, respondents), or take the automatic proposal built from each respondent's role and function.
import { all } from '../db.js';
import { J, pick, HttpError } from '../lib/util.js';
import * as Q from './questionnaires.js';

const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[«»“”"’']/g, ' ').replace(/\s+/g, ' ').trim();
const HR = /(^|[^a-z])(rh|drh|hr|hrd)([^a-z]|$)|ressources humaines|human resources|الموارد البشرية/;
// Fields a question can name (whole words, accents removed) and the job titles that belong to each field.
const FIELDS = [
  [/\b(triage|tri|urgences?|emergency|decision clinique|clinical decision)\b/, /urgen|emergenc|infirm|nurse|medic|cadre de sante|head nurse/],
  [/\b(imagerie|imaging|radiologie|radiology)\b/, /radio|imag|medic/],
  [/\b(dossier patient|dpi|ehr|electronic health record)\b/, /infirm|nurse|medic|qualit|quality|cadre/],
  [/\b(lits|beds?|planification ia|staff planning)\b/, /cadre|direct|qualit|quality|head/],
  [/\b(telemedecine|teleconsultation|telemedicine)\b/, /medic|direct/],
  [/\b(rendez vous|appointments?|facturation|billing)\b/, /accueil|admin|factur|billing|front desk/]];
/** Whether a respondent belongs to the field a label names: the job title decides, then the function; null = no field. */
function inField(label, role, fn) {
  const l = norm(label); const f = FIELDS.find(([a]) => a.test(l)); if (!f) return null;
  const r = norm(role); if (f[1].test(r)) return true;
  if (FIELDS.some(([, b]) => b.test(r))) return false;
  return f[1].test(norm(fn));
}

/** Respondents of the questionnaire with their role and function, as the assignment screens show them. */
export function respondentsOf(orgId, q) {
  const inv = Q.listInvitations(orgId, q.id);
  const st = new Map(all(`SELECT id, data FROM records WHERE entity='Stakeholder' AND org_id=? AND project_id=?`, orgId, q.project_id).map(x => [x.id, J(x.data, {})]));
  const fns = new Map(all(`SELECT id, name FROM obs_nodes WHERE org_id=?`, orgId).map(f => [f.id, J(f.name, f.name)]));
  return inv.map(i => { const s = st.get(i.stakeholder_id) || {};
    return { invitation_id: i.id, stakeholder_id: i.stakeholder_id, name: i.name, email: i.email, role: s.role || '', function: pick(fns.get(s.function_id), 'fr') || i.function_name || s.function_name || '', function_en: pick(fns.get(s.function_id), 'en') || '',
      decision_level: i.decision_level, population: i.population, form: i.template_code, status: i.status }; });
}

/** Everything the assignment screen needs: elements per form, respondents per form, the map and what each one receives. */
export function view(orgId, q) {
  const resp = respondentsOf(orgId, q); const inv = Q.listInvitations(orgId, q.id);
  return { assignments: q.assignments || {},
    forms: (q.forms || []).map(f => ({ code: f.code, name: f.name, population: f.population, elements: Q.elementsOf(f), respondents: resp.filter(r => r.form === f.code) })),
    summary: Q.assignmentSummary(q, inv) };
}

/** Rule-based proposal: HR sections to the HR function; a question or sub-section naming a field (triage, imaging,
 * records, planning...) to the respondents whose job title belongs to that field. Only strict subsets are proposed. */
export function propose(orgId, q) {
  const resp = respondentsOf(orgId, q); const out = {}; const reasons = [];
  for (const f of q.forms || []) {
    const people = resp.filter(r => r.form === f.code); if (people.length < 2) continue;
    const keep = (ref, ids, why) => { if (ids.length && ids.length < people.length) { out[ref] = ids; reasons.push({ ref, why, n: ids.length }); } };
    for (const s of f.sections || []) {
      if (s.type === 'note') continue;
      const title = norm(`${pick(s.title, 'fr')} ${pick(s.title, 'en')}`);
      if (s.condition === 'hr_function' || HR.test(title)) { keep(`${f.code}|${s.id}`, people.filter(p => HR.test(norm(`${p.role} ${p.function} ${p.function_en}`))).map(p => p.stakeholder_id), 'hr'); continue; }
    }
    for (const e of Q.elementsOf(f).filter(x => x.level !== 'section')) {
      if (out[`${f.code}|${e.section}`]) continue;
      const label = `${pick(e.label, 'fr')} ${pick(e.label, 'en')}`;
      if (inField(label, '', '') === null) continue;
      const ids = people.filter(p => inField(label, p.role, `${p.function} ${p.function_en}`)).map(p => p.stakeholder_id);
      keep(e.ref, ids, 'role');
    }
  }
  return { assignments: out, reasons };
}

/** Reads a pasted table: [level ;] element ; respondents. An element is a section title, a sub-section, a question
 * (or its reference); respondents are names, e-mails or job titles separated by commas. An element found in several
 * forms is given, in each form, to the named respondents who receive that form. */
export function parsePaste(orgId, q, text) {
  const resp = respondentsOf(orgId, q); const map = {}; const unmatched = []; let lines = 0;
  const LEVEL = { section: 'section', 'sous-section': 'subsection', 'sous section': 'subsection', subsection: 'subsection', 'sub-section': 'subsection', question: 'question', 'القسم': 'section', 'القسم الفرعي': 'subsection', 'السؤال': 'question' };
  const all_ = (q.forms || []).flatMap(f => Q.elementsOf(f).map(e => ({ ...e, form: f.code, key: norm(pick(e.label, 'fr')), keyEn: norm(pick(e.label, 'en')), keyAr: norm(pick(e.label, 'ar')) })));
  for (const raw of String(text || '').split(/\r?\n/)) {
    const cells = raw.split(raw.includes('\t') ? '\t' : ';').map(c => c.trim());
    if (cells.length < 2 || !cells.some(Boolean)) continue;
    let level = null; if (cells.length >= 3 && LEVEL[norm(cells[0])]) level = LEVEL[norm(cells.shift())];
    const [el, who] = [cells[0], cells.slice(1).join(',')];
    if (/^(element|élément|niveau|level|العنصر)$/i.test(norm(el))) continue; // header line
    lines++;
    const k = norm(el);
    let cands = all_.filter(e => (!level || e.level === level) && (e.ref === el || e.key === k || e.keyEn === k || e.keyAr === k));
    if (!cands.length && k.length >= 12) cands = all_.filter(e => (!level || e.level === level) && (e.key.startsWith(k) || e.keyEn.startsWith(k)));
    const names = who.split(/\s*[,|]\s*|\s+et\s+|\s+and\s+/).map(norm).filter(Boolean);
    const people = resp.filter(p => names.some(n => n === norm(p.name) || n === norm(p.email) || n === norm(p.role)));
    if (!cands.length || !people.length) { unmatched.push({ line: raw.trim(), reason: !cands.length ? 'element' : 'respondent' }); continue; }
    let used = 0;
    for (const e of cands) { const ids = people.filter(p => p.form === e.form).map(p => p.stakeholder_id); if (ids.length) { map[e.ref] = [...new Set([...(map[e.ref] || []), ...ids])]; used++; } }
    if (!used) unmatched.push({ line: raw.trim(), reason: 'form' });
  }
  return { assignments: map, lines, matched: Object.keys(map).length, unmatched };
}

/** Saves the map (replace, or merge into the current one); the respondents must be respondents of this questionnaire. */
export function save(orgId, q, map, { merge = false, userId = null } = {}) {
  if (q.status === 'Closed') throw new HttpError(409, 'err.questionnaireClosed');
  const ids = new Set(Q.listInvitations(orgId, q.id).map(i => i.stakeholder_id));
  const clean = Q.cleanAssignments(q, merge ? { ...(q.assignments || {}), ...map } : map, ids);
  q.assignments = clean; Q.saveQuestionnaire(q, userId);
  Q.event(orgId, q.id, null, 'assignments.saved', { detail: { elements: Object.keys(clean).length }, userId });
  return clean;
}
