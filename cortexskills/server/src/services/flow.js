// Entry point of the steps that work on the project's records (E2E-02, E2E-01, E2E-05, E2E-07): the hooks of each step
// (template and AI proposals, what completing the step creates, its live panel and actions, what blocks it), the
// contacts filled in a row from the person chosen, and the AI use cases that serve these steps (one governed path
// per step, FR-DA-AI-12).
import { all, one } from '../db.js';
import { pick, uuid, J } from '../lib/util.js';
import { insertRecord } from './projects.js';
import * as C from './flowcore.js';
import { HOOKS as H02 } from './flow02.js';
import { HOOKS as H01 } from './flow01.js';
import { HOOKS as H05 } from './flow05.js';
import { HOOKS as H07 } from './flow07.js';
export { widgets } from './flow07.js';

const HOOKS = { ...H02, ...H01, ...H05, ...H07 };
export const hookOf = (uft, stepId) => (uft && HOOKS[`${uft}:${stepId}`]) || HOOKS[stepId] || null;
const ctxOf = (req, t, stepId) => ({ req, t, lang: req.lang || 'en', stepId, key: `${t.uft_id}:${stepId}` });

/** Rows (or field values of a single form) proposed by the template of the library. */
export function templateProposal(req, t, stepId) { const h = hookOf(t.uft_id, stepId); if (!h?.template) throw C.err('err.flowNoTemplate'); return h.template(ctxOf(req, t, stepId)); }
/** Rows (or field values) proposed by the built-in AI engine of the step, from the project's own records. */
export function aiProposal(req, t, stepId) { const h = hookOf(t.uft_id, stepId); return h?.ai ? h.ai(ctxOf(req, t, stepId)) : null; }
export function panel(req, t, stepId) { const h = hookOf(t.uft_id, stepId); return h?.panel ? h.panel(ctxOf(req, t, stepId)) : null; }
export async function action(req, t, stepId, key, body = {}) { const h = hookOf(t.uft_id, stepId); const fn = h?.actions?.[key]; if (!fn) throw C.err('err.flowNoAction'); return fn({ ...ctxOf(req, t, stepId), body }); }
export function blocker(req, t, stepId) { const h = hookOf(t.uft_id, stepId); return h?.blocker ? h.blocker(ctxOf(req, t, stepId)) : null; }
/** What completing the step creates or sends; panel steps first refresh their result (consolidation, gaps...). */
export async function complete(req, t, stepId, { rows, fields }) {
  const h = hookOf(t.uft_id, stepId); if (!h) return null; const ctx = { ...ctxOf(req, t, stepId), rows, fields };
  if (h.onComplete) h.onComplete(ctx);
  if (h.complete) h.complete(ctx);
  if (h.completeAsync) return h.completeAsync(ctx);
  return null;
}
/** E-mail and phone of the person chosen in a row, when they are known and the cells are empty. */
const CONTACT_KEYS = { item: ['email', 'phone'], manager: ['managerEmail', 'managerPhone'], expert: ['expertEmail', null] };
export function enrich(orgId, projectId, fields, data) {
  const keys = new Set(fields.map(f => f.key)); const out = { ...data };
  for (const [who, [ek, pk]] of Object.entries(CONTACT_KEYS)) {
    if (!keys.has(who) || !out[who] || (ek && !keys.has(ek))) continue; const c = C.contactOf(orgId, projectId, C.str(out[who]));
    if (ek && !String(out[ek] ?? '').trim() && c.email) out[ek] = c.email;
    if (pk && keys.has(pk) && !String(out[pk] ?? '').trim() && c.phone) out[pk] = c.phone;
    if (who === 'item' && keys.has('channel') && !out.channel && c.channel) out.channel = c.channel;
    if (who === 'item' && keys.has('position') && !out.position && c.role) out.position = c.role;
    if (who === 'item' && keys.has('site') && !out.site && c.site) out.site = c.site;
  }
  return out;
}

/* ------------------------------------------------------------------ AI use cases of these steps */
const L = C.L;
const UC = (code, step, name, type, checkpoint, risk = 'Medium') => ({ code, step, name, model_task_type: type, risk, checkpoint, tier: 'Assistive', scope: 'Organization', isCustom: false, approval: 'N/A (seeded catalog)', version: 1, links: [] });
const HoLD = L('The owner of the step accepts, edits or rejects each proposed row.', 'Le responsable de l’étape accepte, modifie ou rejette chaque ligne proposée.', 'يقبل مسؤول الخطوة كل صف مقترح أو يعدله أو يرفضه.');
export const FLOW_USE_CASES = [
  UC('AIUC-F01', 'MP-02.1', L('Competency framework from the needs', 'Référentiel de compétences à partir des besoins', 'مرجعية الكفاءات انطلاقاً من الحاجيات'), 'Extraction', HoLD),
  UC('AIUC-F02', 'MP-02.2', L('Target levels per position', 'Niveaux cibles par poste', 'المستويات المستهدفة لكل منصب'), 'Scoring', HoLD),
  UC('AIUC-F03', 'MP-02.3', L('Population to assess and their managers', 'Population à évaluer et ses managers', 'الفئة المراد تقييمها ومديروها'), 'Matching', HoLD),
  UC('AIUC-F04', 'MP-02.7', L('Rationale of the inventory validation', 'Justification de la validation de l’inventaire', 'تعليل المصادقة على الجرد'), 'Summarization', HoLD),
  UC('AIUC-F05', 'MP-03.2', L('Findings of the gap matrix', 'Constats de la matrice des écarts', 'ملاحظات مصفوفة الفجوات'), 'Summarization', HoLD),
  UC('AIUC-F06', 'MP-01.1', L('Strategic objectives from the gaps', 'Objectifs stratégiques à partir des écarts', 'الأهداف الاستراتيجية انطلاقاً من الفجوات'), 'Text generation', HoLD),
  UC('AIUC-F07', 'MP-01.2', L('Objectives linked to functions and sites', 'Objectifs reliés aux fonctions et aux sites', 'ربط الأهداف بالوظائف والمواقع'), 'Matching', HoLD),
  UC('AIUC-F08', 'MP-03.2', L('Review of the pre-framed needs', 'Revue des besoins pré-cadrés', 'مراجعة الحاجيات المؤطرة'), 'Summarization', HoLD),
  UC('AIUC-F09', 'MP-01.3', L('Budget envelope from the needs', 'Enveloppe budgétaire à partir des besoins', 'الغلاف المالي انطلاقاً من الحاجيات'), 'Forecasting', HoLD),
  UC('AIUC-F10', 'MP-18.1', L('Budget split by theme and site', 'Répartition du budget par thème et par site', 'توزيع الميزانية حسب المحور والموقع'), 'Forecasting', HoLD),
  UC('AIUC-F11', 'MP-18.2', L('Refund eligibility', 'Éligibilité aux remboursements', 'أهلية الاسترداد'), 'Classification', HoLD),
  UC('AIUC-F12', 'MP-19.1', L('Change impact scoring', 'Notation de l’impact du changement', 'تقييم أثر التغيير'), 'Scoring', HoLD),
  UC('AIUC-F13', 'MP-19.2', L('Adoption plan with the change relays', 'Plan d’adoption avec les relais du changement', 'خطة التبني مع ممثلي التغيير'), 'Text generation', HoLD),
  UC('AIUC-F14', 'MP-01.4', L('Steering milestones', 'Jalons du comité de pilotage', 'محطات لجنة القيادة'), 'Planning', HoLD),
  UC('AIUC-F15', 'MP-01.6', L('Rationale of the plan approval', 'Justification de l’approbation du plan', 'تعليل المصادقة على الخطة'), 'Summarization', HoLD),
  UC('AIUC-F16', 'MP-06.3', L('Expert reviewer per course', 'Expert relecteur par formation', 'الخبير المراجع لكل تكوين'), 'Matching', HoLD),
  UC('AIUC-F17', 'MP-06.4', L('Review decisions from the expert answers', 'Décisions de revue à partir des réponses des experts', 'قرارات المراجعة من أجوبة الخبراء'), 'Classification', HoLD),
  UC('AIUC-F18', 'MP-06.6', L('Catalogue announcement', 'Annonce du catalogue', 'إعلان الفهرس'), 'Text generation', HoLD),
  UC('AIUC-F19', 'MP-11.1', L('Rooms and equipment for the sessions', 'Salles et équipements des sessions', 'القاعات والتجهيزات'), 'Planning', HoLD),
  UC('AIUC-F20', 'MP-11.2', L('Trainers matched to the courses', 'Formateurs associés aux formations', 'مكونون حسب التكوينات'), 'Matching', HoLD),
  UC('AIUC-F21', 'MP-07.1', L('Session schedule without conflicts', 'Planning des sessions sans conflit', 'برمجة الدورات دون تعارض'), 'Planning', HoLD),
  UC('AIUC-F22', 'MP-07.3', L('Enrolment of the people with a gap', 'Inscription des personnes en écart', 'تسجيل الأشخاص في فجوة'), 'Matching', HoLD),
  UC('AIUC-F23', 'MP-25.1', L('Micro-learning capsule writing', 'Rédaction de capsules de micro-apprentissage', 'كتابة كبسولات التعلم المصغر'), 'Text generation', HoLD),
  UC('AIUC-F24', 'MP-30.1', L('Simulation scenario', 'Scénario de simulation', 'سيناريو المحاكاة'), 'Text generation', HoLD),
  UC('AIUC-F25', 'MP-30.2', L('Simulation scoring grid', 'Grille de notation de la simulation', 'شبكة تنقيط المحاكاة'), 'Text generation', HoLD),
  UC('AIUC-F26', 'MP-30.3', L('Simulation launch message', 'Message de lancement de la simulation', 'رسالة إطلاق المحاكاة'), 'Text generation', HoLD),
  UC('AIUC-F27', 'MP-30.5', L('Learner debriefing', 'Débriefing de l’apprenant', 'تغذية راجعة للمتعلم'), 'Summarization', HoLD),
  UC('AIUC-F28', 'MP-07.6', L('Rationale of the session closure', 'Justification de la clôture des sessions', 'تعليل إغلاق الدورات'), 'Summarization', HoLD),
  UC('AIUC-F29', 'MP-11.5', L('Attendance and invoice reconciliation', 'Rapprochement présences et factures', 'مطابقة الحضور والفواتير'), 'Extraction', HoLD),
  UC('AIUC-F30', 'MP-11.3', L('Invoices expected from the providers', 'Factures attendues des organismes', 'الفواتير المنتظرة'), 'Extraction', HoLD),
  UC('AIUC-F31', 'MP-11.4', L('Correction of a training record', 'Correction d’un dossier de formation', 'تصحيح ملف تكوين'), 'Summarization', HoLD),
  UC('AIUC-F32', 'MP-09.1', L('Evaluation instruments', 'Instruments d’évaluation', 'أدوات التقييم'), 'Planning', HoLD),
  UC('AIUC-F33', 'MP-09.7', L('Findings of the evaluation review', 'Constats de la revue d’évaluation', 'ملاحظات مراجعة التقييم'), 'Summarization', HoLD),
  UC('AIUC-F34', 'MP-20.5', L('Quality review actions', 'Actions de la revue qualité', 'إجراءات مراجعة الجودة'), 'Text generation', HoLD),
  UC('AIUC-F35', 'MP-10.6', L('Lessons shared with the stakeholders', 'Enseignements partagés avec les parties prenantes', 'الدروس المشتركة'), 'Text generation', HoLD),
  UC('AIUC-F36', 'MP-10.2', L('Dashboard widgets', 'Widgets du tableau de bord', 'عناصر لوحة القيادة'), 'Classification', HoLD),
];
/** Adds the use cases of these steps to an Organization that does not have them yet. */
export function ensureUseCases(orgId) {
  let n = 0;
  for (const u of FLOW_USE_CASES) {
    if (one(`SELECT id FROM records WHERE entity='AIUseCase' AND org_id=? AND (ref=? OR json_extract(data,'$.code')=?)`, orgId, u.code, u.code)) continue;
    insertRecord(uuid(), 'AIUseCase', orgId, null, u.code, { id: u.code, ...u }, null, true); n++;
  }
  return n;
}
export const ensureAllUseCases = () => all(`SELECT id FROM organizations`).reduce((s, o) => s + ensureUseCases(o.id), 0);
void pick; void J;
