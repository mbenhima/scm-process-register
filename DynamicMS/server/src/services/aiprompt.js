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

// ---------------------------------------------------------------- Prompt specification
// Every AI use case carries its prompt as separate, versioned fields (SRS FR-DA-AIP-03),
// fully populated for the step it is linked to.
const L = (en, fr, ar) => ({ en, fr, ar });
export const SPEC_FIELDS = ['role', 'context', 'task', 'inputs', 'knowledge', 'constraints', 'examples', 'format', 'tone', 'quality', 'checkpoint', 'params'];
export const SPEC_REQUIRED = ['role', 'context', 'task', 'constraints', 'format', 'checkpoint'];
export const SPEC_LABELS = {
  role: L('Role (persona)', 'Rôle (persona)', 'الدور (الشخصية)'), context: L('Context', 'Contexte', 'السياق'), task: L('Task (instruction)', 'Tâche (instruction)', 'المهمة (التعليمات)'),
  inputs: L('Inputs (variables)', 'Entrées (variables)', 'المدخلات (المتغيرات)'), knowledge: L('Knowledge sources', 'Sources de connaissances', 'مصادر المعرفة'), constraints: L('Constraints', 'Contraintes', 'القيود'),
  examples: L('Examples', 'Exemples', 'الأمثلة'), format: L('Output format', 'Format de sortie', 'صيغة المخرج'), tone: L('Tone and language', 'Ton et langue', 'الأسلوب واللغة'),
  quality: L('Quality criteria', 'Critères de qualité', 'معايير الجودة'), checkpoint: L('Human checkpoint', 'Point de contrôle humain', 'نقطة التحقق البشري'), params: L('Model parameters', 'Paramètres du modèle', 'معاملات النموذج'),
};
const each = (f) => { const o = {}; for (const l of ['en', 'fr', 'ar']) o[l] = f(l); return o; };
export function defaultSpec(u) {
  const c = catalog();
  const step = c.stepById[u.linked_step];
  const mp = c.mpById[step?.mp || u.linked_mp];
  const e2e = mp ? c.e2eById[mp.e2e] : null;
  const def = step ? FORM_KINDS[step.formKind] : null;
  const role = step?.roleName || mp?.ownerRoleName || L('process owner', 'pilote du processus', 'مالك العملية');
  const name = (v, l) => loc(v, l) || '';
  const fieldList = (l) => (def ? def.fields.map(f => (f.columns ? `${loc(f.label, l)} [${f.columns.map(x => loc(x.label, l)).join(', ')}]` : loc(f.label, l))).join('; ') : '');
  const tmpl = P(u.prompt) || c.aiUseCases.find(a => a.id === u.code)?.prompt;
  return {
    role: each(l => ({ en: `You are an expert assistant to the ${name(role, l)}, experienced in ${name(mp?.clauses ? { en: mp.clauses, fr: mp.clauses, ar: mp.clauses } : L('ISO management systems', 'systèmes de management ISO', 'أنظمة الإدارة ISO'), l)} and in the process "${name(mp?.name, l)}".`, fr: `Vous êtes un assistant expert du ${name(role, l)}, expérimenté en ${mp?.clauses || 'systèmes de management ISO'} et dans le processus « ${name(mp?.name, l)} ».`, ar: `أنت مساعد خبير لـ ${name(role, l)}، متمرس في ${mp?.clauses || 'أنظمة الإدارة ISO'} وفي عملية "${name(mp?.name, l)}".` }[l])),
    context: each(l => [
      step ? { en: 'Step', fr: 'Étape', ar: 'الخطوة' }[l] + `: ${step.id} — ${name(step.name, l)}` : '',
      mp ? { en: 'Macro process', fr: 'Macro-processus', ar: 'العملية الكلية' }[l] + `: ${mp.code} ${name(mp.name, l)} — ${name(mp.goal, l)}` : '',
      e2e ? { en: 'Phase', fr: 'Phase', ar: 'المرحلة' }[l] + `: ${name(e2e.name, l)}` : '',
      mp ? { en: 'Inputs of the process', fr: 'Entrées du processus', ar: 'مدخلات العملية' }[l] + `: ${mp.sipoc.I.map(x => name(x, l)).join(', ')}` : '',
      mp ? { en: 'Outputs expected', fr: 'Sorties attendues', ar: 'المخرجات المتوقعة' }[l] + `: ${mp.sipoc.O.map(x => name(x, l)).join(', ')}` : '',
      mp?.clauses ? { en: 'Requirements covered', fr: 'Exigences couvertes', ar: 'المتطلبات المشمولة' }[l] + `: ${mp.clauses}` : '',
    ].filter(Boolean).join('\n')),
    task: each(l => name(tmpl, l) || { en: `Propose the content of the step "${name(step?.name, l)}" for the organization, ready for review.`, fr: `Proposer le contenu de l'étape « ${name(step?.name, l)} » pour l'organisme, prêt à être revu.`, ar: `اقترح محتوى الخطوة "${name(step?.name, l)}" للمؤسسة جاهزًا للمراجعة.` }[l]),
    inputs: each(l => [`{org} — ${{ en: 'organization profile (name, sector, size)', fr: 'profil de l\'organisme (nom, secteur, taille)', ar: 'تعريف المؤسسة (الاسم، القطاع، الحجم)' }[l]}`, `{standards} — ${{ en: 'standards in scope of the project', fr: 'normes du périmètre du projet', ar: 'المعايير المشمولة في المشروع' }[l]}`, `{step_fields} — ${{ en: 'values already typed in the step', fr: 'valeurs déjà saisies dans l\'étape', ar: 'القيم المدخلة في الخطوة' }[l]}${def ? ` (${fieldList(l)})` : ''}`, `{previous_outputs} — ${{ en: 'results of the previous steps of the process', fr: 'résultats des étapes précédentes du processus', ar: 'نتائج الخطوات السابقة للعملية' }[l]}`, `{user_request} — ${{ en: 'what the user asks (optional)', fr: 'demande de l\'utilisateur (facultatif)', ar: 'طلب المستخدم (اختياري)' }[l]}`].join('\n')),
    knowledge: each(l => ({ en: `Standards knowledge base (${mp?.clauses || 'ISO clauses'}); the project registers (context, parties, risks, KPIs, objectives); lessons learned (REX) of the organization.`, fr: `Base de connaissances des normes (${mp?.clauses || 'articles ISO'}) ; registres du projet (contexte, parties, risques, KPI, objectifs) ; retours d'expérience (REX) de l'organisme.`, ar: `قاعدة معرفة المعايير (${mp?.clauses || 'بنود ISO'})؛ سجلات المشروع (السياق والأطراف والمخاطر والمؤشرات والأهداف)؛ الدروس المستفادة للمؤسسة.` }[l])),
    constraints: each(l => ({ en: '- Use only facts from the inputs and the retrieved references; state no figure, name or score that is not in them.\n- Mark any assumption as "to confirm".\n- Stay within the vocabulary of the application and of the standard.\n- No personal data beyond names already in the record.\n- Keep each item under 60 words.', fr: '- N\'utiliser que les faits des entrées et des références retrouvées ; aucun chiffre, nom ou note qui n\'y figure pas.\n- Signaler toute hypothèse comme « à confirmer ».\n- Rester dans le vocabulaire de l\'application et de la norme.\n- Aucune donnée personnelle au-delà des noms déjà présents.\n- Moins de 60 mots par élément.', ar: '- استخدم فقط الوقائع الواردة في المدخلات والمراجع المسترجعة؛ لا أرقام أو أسماء أو درجات غير موجودة فيها.\n- علّم أي افتراض بعبارة "للتأكيد".\n- التزم بمفردات التطبيق والمعيار.\n- لا بيانات شخصية سوى الأسماء الموجودة في السجل.\n- أقل من 60 كلمة لكل بند.' }[l])),
    examples: each(l => ({ en: `Input: step "${name(step?.name, l)}", organization of 25 people providing technical services, ISO 9001.\nOutput: 3 to 6 items, each with its category, a one-line description, its relevance (High/Medium/Low) and its source (register, interview, date).`, fr: `Entrée : étape « ${name(step?.name, l)} », organisme de 25 personnes fournissant des services techniques, ISO 9001.\nSortie : 3 à 6 éléments, chacun avec sa catégorie, une description d'une ligne, sa pertinence (Élevée/Moyenne/Faible) et sa source (registre, entretien, date).`, ar: `المدخل: الخطوة "${name(step?.name, l)}"، مؤسسة من 25 شخصًا تقدم خدمات فنية، ISO 9001.\nالمخرج: من 3 إلى 6 بنود لكل منها فئتها ووصف في سطر وأهميتها (عالية/متوسطة/منخفضة) ومصدرها (سجل، مقابلة، تاريخ).` }[l])),
    format: each(l => (def ? `${{ en: 'Fill the fields of the step form', fr: 'Remplir les champs du formulaire de l\'étape', ar: 'املأ حقول نموذج الخطوة' }[l]}: ${fieldList(l)}. ${{ en: 'Answer as JSON with one key per field; table fields as arrays of rows.', fr: 'Répondre en JSON avec une clé par champ ; les champs tableau comme listes de lignes.', ar: 'أجب بصيغة JSON بمفتاح لكل حقل؛ وحقول الجداول كمصفوفات من الصفوف.' }[l]}` : { en: 'A numbered list of items.', fr: 'Une liste numérotée d\'éléments.', ar: 'قائمة مرقمة من البنود.' }[l])),
    tone: each(l => ({ en: 'Professional, concise, active voice; written in the user\'s display language.', fr: 'Professionnel, concis, voix active ; rédigé dans la langue d\'affichage de l\'utilisateur.', ar: 'مهني وموجز وبصيغة المبني للمعلوم؛ بلغة عرض المستخدم.' }[l])),
    quality: each(l => ({ en: 'Every item is traceable to a source; covers the requirement of the step; actionable by the owner; no duplicate; nothing invented.', fr: 'Chaque élément est traçable jusqu\'à une source ; couvre l\'exigence de l\'étape ; exploitable par le responsable ; sans doublon ; rien d\'inventé.', ar: 'كل بند قابل للتتبع إلى مصدر؛ ويغطي متطلب الخطوة؛ وقابل للتنفيذ من المسؤول؛ دون تكرار أو اختلاق.' }[l])),
    checkpoint: P(u.checkpoint) || each(l => ({ en: `${name(role, l)} accepts, edits or rejects each suggestion before completing the step.`, fr: `Le ${name(role, l)} accepte, modifie ou rejette chaque suggestion avant de terminer l'étape.`, ar: `يقبل ${name(role, l)} كل اقتراح أو يعدّله أو يرفضه قبل إكمال الخطوة.` }[l])),
    params: { model: u.model || 'organization default', temperature: 0.2, maxTokens: 800 },
  };
}
export const specOf = (u) => P(u.prompt_spec) || defaultSpec(u);
export function specCompleteness(spec, lang = 'en') {
  const missing = SPEC_REQUIRED.filter(k => !String(loc(spec[k], lang) || '').trim());
  return { missing, complete: !missing.length, filled: SPEC_FIELDS.filter(k => k === 'params' ? !!spec.params : String(loc(spec[k], lang) || '').trim()).length, total: SPEC_FIELDS.length };
}

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
  // The prompt is assembled from the separate fields of the specification, in a fixed order.
  const spec = specOf(usecase);
  const sec = (k) => { const v = loc(spec[k], 'en' === lang ? 'en' : lang); return v ? `## ${loc(SPEC_LABELS[k], 'en')}\n${v}` : ''; };
  const system = [sec('role'), sec('task'), sec('constraints'), sec('format'), sec('tone'), sec('quality'), sec('examples'), `Write in ${LANG_NAME[lang] || 'English'}.`].filter(Boolean).join('\n\n') || `${tmpl}\nWrite in ${LANG_NAME[lang] || 'English'}.`;
  const ctx = loc(spec.context, lang);
  return { system, user: [ctx ? `## Context\n${ctx}` : '', `## Inputs\n${lines.join('\n')}`].filter(Boolean).join('\n\n'), spec: { fields: SPEC_FIELDS.filter(k => k !== 'params' && loc(spec[k], lang)).length, params: spec.params } };
}
