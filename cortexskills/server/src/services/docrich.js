// Fine-grained sections of the end-to-end process deliverables (FR-DA-DGC-04): references and definitions, method and
// rating scales, one sheet per task, analysis and conclusions, and actions with owner and due date. Every value comes
// from the process design, the project's task instances, step records, indicator values and Action records, and every
// row is traced to its source (FR-DA-DGC-01).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../config.js';
import { all, one } from '../db.js';
import { J, pick } from '../lib/util.js';
import { t } from '../i18n.js';
import * as cat from '../catalog.js';
import * as D from './design.js';
import { STANDARD_REQUIREMENTS } from './doctemplates.js';
import { entityRegistry } from '../entities.js';

const L = (en, fr, ar) => ({ en, fr, ar });
const X = {
  references: L('References', 'Références', 'المراجع'), definitions: L('Definitions', 'Définitions', 'التعاريف'), term: L('Term', 'Terme', 'المصطلح'), definition: L('Definition', 'Définition', 'التعريف'),
  ref: L('Reference', 'Référence', 'المرجع'), title: L('Title', 'Intitulé', 'العنوان'), kind: L('Type', 'Type', 'النوع'), standard: L('Standard clause', 'Clause de norme', 'بند المعيار'),
  maintain: L('Document to maintain', 'Document à tenir à jour', 'وثيقة يجب تحيينها'), retain: L('Record to retain', 'Enregistrement à conserver', 'سجل يجب الاحتفاظ به'),
  upstream: L('Upstream process', 'Processus amont', 'عملية سابقة'), downstream: L('Downstream process', 'Processus aval', 'عملية لاحقة'), mp: L('Macro-process', 'Macro-processus', 'العملية الكبرى'),
  methodText: L('The process runs from its trigger to its end event in {n} tasks and {s} steps, grouped in {m} macro-processes. Each step records its results in the application; this document reads them and names the source of every row. Indicators are rated against their target with the RAG scale below, risks with the likelihood-by-impact scale, and responsibilities with the RACSI codes.',
    'Le processus va de son déclencheur à son événement de fin en {n} tâches et {s} étapes, regroupées en {m} macro-processus. Chaque étape enregistre ses résultats dans l’application ; ce document les lit et indique la source de chaque ligne. Les indicateurs sont notés par rapport à leur cible selon l’échelle RAG ci-dessous, les risques selon l’échelle probabilité × impact, et les responsabilités selon les codes RACSI.',
    'تمتد العملية من حدثها المطلق إلى حدث نهايتها عبر {n} مهام و{s} خطوات موزعة على {m} عمليات كبرى. تسجل كل خطوة نتائجها في التطبيق، وتقرأها هذه الوثيقة مع ذكر مصدر كل صف. تقيم المؤشرات مقارنة بهدفها وفق سلم RAG أدناه، والمخاطر وفق سلم الاحتمال × الأثر، والمسؤوليات وفق رموز RACSI.'),
  frame: L('Process frame', 'Cadre du processus', 'إطار العملية'), trigger: L('Trigger', 'Déclencheur', 'الحدث المطلق'), end: L('End event', 'Événement de fin', 'حدث النهاية'), goal: L('Objective', 'Objectif', 'الهدف'), ptype: L('Process type', 'Type de processus', 'نوع العملية'),
  objective: L('Objective', 'Objectif', 'الهدف'), owner: L('Owner', 'Propriétaire', 'المالك'), name: L('Name', 'Nom', 'الاسم'),
  rag: L('Indicator rating scale (RAG)', 'Échelle de notation des indicateurs (RAG)', 'سلم تقييم المؤشرات (RAG)'), rating: L('Rating', 'Note', 'التقييم'), rule: L('Rule', 'Règle', 'القاعدة'),
  green: L('Green', 'Vert', 'أخضر'), amber: L('Amber', 'Orange', 'برتقالي'), red: L('Red', 'Rouge', 'أحمر'),
  greenRule: L('At or above 90 % of target (or at or below target for a decreasing indicator)', 'Au moins 90 % de la cible (ou au plus la cible pour un indicateur décroissant)', '90% من الهدف أو أكثر (أو الهدف أو أقل لمؤشر تنازلي)'),
  amberRule: L('From 70 % to 89 % of target', 'De 70 % à 89 % de la cible', 'من 70% إلى 89% من الهدف'), redRule: L('Below 70 % of target', 'Moins de 70 % de la cible', 'أقل من 70% من الهدف'),
  riskScale: L('Risk rating scale', 'Échelle de cotation des risques', 'سلم تقييم المخاطر'), score: L('Score (likelihood × impact)', 'Score (probabilité × impact)', 'الدرجة (الاحتمال × الأثر)'), level: L('Level', 'Niveau', 'المستوى'), response: L('Expected response', 'Réponse attendue', 'الاستجابة المنتظرة'),
  low: L('Low', 'Faible', 'منخفض'), medium: L('Medium', 'Moyen', 'متوسط'), high: L('High', 'Élevé', 'مرتفع'), critical: L('Critical', 'Critique', 'حرج'),
  lowR: L('Accept and monitor at the annual review', 'Accepter et suivre à la revue annuelle', 'القبول والتتبع في المراجعة السنوية'), mediumR: L('Monitor quarterly; control owner named', 'Suivre chaque trimestre ; responsable du contrôle désigné', 'تتبع فصلي مع تعيين مسؤول الضابط'),
  highR: L('Treatment plan approved by the process owner', 'Plan de traitement approuvé par le propriétaire du processus', 'خطة معالجة يصادق عليها مالك العملية'), criticalR: L('Escalate to the steering committee; act before go-live', 'Remonter au comité de pilotage ; agir avant la mise en service', 'الرفع إلى لجنة القيادة والتصرف قبل الإطلاق'),
  racsiCodes: L('Responsibility codes (RACSI)', 'Codes de responsabilité (RACSI)', 'رموز المسؤولية (RACSI)'), code: L('Code', 'Code', 'الرمز'), meaning: L('Meaning', 'Signification', 'المعنى'),
  R: L('Responsible — performs the task', 'Réalise — exécute la tâche', 'المنفذ — ينجز المهمة'), A: L('Accountable — approves the result; one per task', 'Approuve — valide le résultat ; un seul par tâche', 'المساءل — يصادق على النتيجة؛ واحد لكل مهمة'),
  C: L('Consulted — gives input before the decision', 'Consulté — donne son avis avant la décision', 'المستشار — يبدي رأيه قبل القرار'), S: L('Support — provides resources or help', 'Soutien — apporte ressources ou aide', 'الداعم — يوفر الموارد أو المساعدة'), I: L('Informed — told of the result', 'Informé — reçoit le résultat', 'المُبلَّغ — يُخبر بالنتيجة'),
  task: L('Task', 'Tâche', 'المهمة'), description: L('Description', 'Description', 'الوصف'), steps: L('Steps', 'Étapes', 'الخطوات'), input: L('Input', 'Entrée', 'المدخل'), supplier: L('Supplier', 'Fournisseur', 'المورد'), output: L('Output', 'Sortie', 'المخرج'), customer: L('Customer', 'Client', 'المستفيد'),
  ai: L('AI assistance', 'Assistance IA', 'مساعدة الذكاء الاصطناعي'), yes: L('Yes', 'Oui', 'نعم'), no: L('No', 'Non', 'لا'), status: L('Status', 'Statut', 'الحالة'), assignee: L('Assigned to', 'Attribuée à', 'مسندة إلى'), due: L('Due date', 'Échéance', 'تاريخ الاستحقاق'),
  started: L('Started', 'Démarrée', 'بدأت'), completed: L('Completed', 'Terminée', 'أنجزت'), rows: L('Rows recorded', 'Lignes enregistrées', 'الصفوف المسجلة'), controlsOn: L('Controls applied', 'Contrôles appliqués', 'الضوابط المطبقة'),
  measure: L('Measure', 'Mesure', 'المقياس'), value: L('Value', 'Valeur', 'القيمة'), progress: L('Tasks completed', 'Tâches terminées', 'المهام المنجزة'), stepsData: L('Steps with recorded results', 'Étapes avec résultats enregistrés', 'الخطوات ذات النتائج المسجلة'),
  rowsTotal: L('Rows of data recorded', 'Lignes de données enregistrées', 'صفوف البيانات المسجلة'), kpiStatus: L('Indicators Green / Amber / Red / not measured', 'Indicateurs Vert / Orange / Rouge / non mesurés', 'المؤشرات أخضر / برتقالي / أحمر / غير مقيسة'),
  riskTop: L('Highest residual risk', 'Risque résiduel le plus élevé', 'أعلى خطر متبقٍ'), ctlEff: L('Controls rated effective', 'Contrôles jugés efficaces', 'الضوابط المقيمة فعالة'), actionsOpen: L('Open actions (overdue)', 'Actions ouvertes (en retard)', 'الإجراءات المفتوحة (المتأخرة)'),
  findings: L('Findings', 'Constats', 'الملاحظات'), conclusion: L('Conclusion', 'Conclusion', 'الخلاصة'), kpiDetail: L('Indicators below target', 'Indicateurs sous la cible', 'المؤشرات دون الهدف'), trend: L('Trend', 'Tendance', 'الاتجاه'), periods: L('Last periods', 'Dernières périodes', 'الفترات الأخيرة'),
  action: L('Action', 'Action', 'الإجراء'), origin: L('Origin', 'Origine', 'المصدر'), evaluator: L('Evaluator', 'Évaluateur', 'المقيم'),
  fromKpi: L('Indicator {id} is {status}', 'Indicateur {id} en {status}', 'المؤشر {id} في حالة {status}'), recover: L('Bring “{kpi}” from {value} back to its target {target}', 'Ramener « {kpi} » de {value} à sa cible {target}', 'إرجاع «{kpi}» من {value} إلى هدفه {target}'),
  finishTask: L('Complete task {id} “{name}”', 'Terminer la tâche {id} « {name} »', 'إنجاز المهمة {id} «{name}»'), fromTask: L('Task not completed', 'Tâche non terminée', 'مهمة غير منجزة'),
  strengthen: L('Strengthen control {id} “{name}” (rated {eff})', 'Renforcer le contrôle {id} « {name} » (jugé {eff})', 'تقوية الضابط {id} «{name}» (مقيم {eff})'), fromControl: L('Control assessment', 'Évaluation du contrôle', 'تقييم الضابط'),
  'Partially effective': L('partially effective', 'partiellement efficace', 'فعال جزئياً'), 'Not tested': L('not tested', 'non testé', 'غير مختبر'),
  recorded: L('Action record', 'Enregistrement d’action', 'سجل إجراء'), planned: L('Planned', 'Planifiée', 'مخططة'), noAction: L('No open action: every task is complete, every indicator is Green and every control is effective.', 'Aucune action ouverte : toutes les tâches sont terminées, tous les indicateurs sont au vert et tous les contrôles sont efficaces.', 'لا يوجد إجراء مفتوح: جميع المهام منجزة وجميع المؤشرات خضراء وجميع الضوابط فعالة.'),
};
const x = (k, lang, p = {}) => Object.entries(p).reduce((s, [a, b]) => s.split(`{${a}}`).join(b), X[k]?.[lang] || X[k]?.en || k);
const P = (v, lang) => (v && typeof v === 'object' && !Array.isArray(v) ? pick(v, lang) : v);
// Plain English catalog values (control owners) are translated with the seed translation memory.
let TM = null;
const tr = (s, lang) => { if (!s || lang === 'en') return s; if (!TM) { TM = { fr: {}, ar: {} }; const dir = path.join(ROOT, 'seed', 'i18n'); for (const f of fs.existsSync(dir) ? fs.readdirSync(dir) : []) { const m = f.match(/^tm\.(fr|ar)\..+\.json$/); if (m) Object.assign(TM[m[1]], JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))); } } return TM[lang]?.[s] || s; };
const fp = rows => crypto.createHash('sha1').update(rows.map(r => `${r._id}@${r._v || 0}`).join('|')).digest('hex').slice(0, 16);
const userName = id => (id ? one(`SELECT name FROM users WHERE id=?`, id)?.name : null) || null;
const ratingOf = s => ({ Green: 'green', Amber: 'amber', Red: 'red' }[s]);
const GLOSSARY = [
  ['E2E', L('End-to-end process: a chain of tasks from a trigger to a result for a customer.', 'Processus de bout en bout : chaîne de tâches allant d’un déclencheur à un résultat pour un client.', 'عملية شاملة: سلسلة مهام من حدث مطلق إلى نتيجة لفائدة مستفيد.')],
  ['MP', L('Macro-process: a group of related activities with one owner and one objective.', 'Macro-processus : groupe d’activités liées avec un propriétaire et un objectif.', 'عملية كبرى: مجموعة أنشطة مترابطة لها مالك واحد وهدف واحد.')],
  ['UFT', L('Unit functional task: one task of an end-to-end process, done by one responsible role.', 'Tâche fonctionnelle unitaire : une tâche d’un processus de bout en bout, réalisée par un rôle responsable.', 'مهمة وظيفية وحدوية: مهمة واحدة من عملية شاملة ينجزها دور مسؤول واحد.')],
  ['SIPOC', L('Supplier, Input, Process, Output, Customer: the view of what each task receives and delivers.', 'Fournisseur, Entrée, Processus, Sortie, Client : ce que chaque tâche reçoit et livre.', 'المورد، المدخل، العملية، المخرج، المستفيد: ما تتلقاه كل مهمة وما تسلمه.')],
  ['RACSI', L('Responsible, Accountable, Consulted, Support, Informed: who does, approves, advises, helps and is told.', 'Réalise, Approuve, Consulté, Soutien, Informé : qui fait, valide, conseille, aide et est informé.', 'المنفذ، المساءل، المستشار، الداعم، المُبلَّغ: من ينجز ويصادق ويستشار ويدعم ويُخبر.')],
  ['KPI', L('Key performance indicator, measured each period against a target.', 'Indicateur clé de performance, mesuré à chaque période par rapport à une cible.', 'مؤشر أداء رئيسي يقاس كل فترة مقارنة بهدف.')],
  ['RAG', L('Red, Amber, Green: the three-level rating of an indicator against its target.', 'Rouge, Orange, Vert : notation à trois niveaux d’un indicateur par rapport à sa cible.', 'أحمر، برتقالي، أخضر: تقييم ثلاثي المستويات لمؤشر مقارنة بهدفه.')],
  ['COSO', L('Internal-control framework used to classify each control (control environment, risk assessment, control activities, information and communication, monitoring).', 'Référentiel de contrôle interne utilisé pour classer chaque contrôle (environnement de contrôle, évaluation des risques, activités de contrôle, information et communication, pilotage).', 'إطار للرقابة الداخلية يستعمل لتصنيف كل ضابط (بيئة الرقابة، تقييم المخاطر، أنشطة الرقابة، المعلومات والتواصل، المتابعة).')],
  [L('Source', 'Source', 'المصدر'), L('Last column of a data table: the step and the record each row comes from.', 'Dernière colonne d’un tableau de données : l’étape et l’enregistrement dont provient chaque ligne.', 'آخر عمود في جدول البيانات: الخطوة والسجل الذي جاء منه كل صف.')],
];

/** Fine-grained sections for an E2E process; returns null when the kind is not one of them. */
export function richSource(kind, arg, ctx) {
  if (!['refs', 'method', 'tasks', 'analysis', 'actions'].includes(kind)) return null;
  const { orgId, projectId, lang, rel } = ctx;
  const e2e = arg && D.get(orgId, 'e2e', arg, { releaseId: rel }); if (!e2e) return { body: null, empty: true };
  const ufts = (e2e.ufts || []).map(id => D.get(orgId, 'uft', id, { releaseId: rel })).filter(Boolean);
  const stepIds = ufts.flatMap(u => u.steps || []);
  const role = (u, k) => P(u.racsiT?.[k], lang) || u.racsi?.[k] || '—';
  const tis = Object.fromEntries(all(`SELECT * FROM task_instances WHERE project_id=? AND uft_id IN (${ufts.map(() => '?').join(',') || "''"})`, projectId, ...ufts.map(u => u.id)).map(r => [r.uft_id, r]));
  const kpis = cat.list('kpi').filter(k => (e2e.mps || []).includes(k.mp));
  const vals = {}; for (const v of all(`SELECT kpi_id, period, value, target, status FROM kpi_values WHERE project_id=? ORDER BY period`, projectId)) (vals[v.kpi_id] ||= []).push(v);
  const controls = cat.list('control').filter(c => String(c.steps || '').split(/[;,]\s*/).some(s => stepIds.includes(s)));
  const cIds = new Set(controls.map(c => c.id)); const risks = cat.list('risk').filter(r => String(r.controls || '').split(/[;,]\s*/).some(c => cIds.has(c)));
  const code = 'DT-' + e2e.id;

  if (kind === 'refs') {
    const refs = [];
    for (const [std, items] of Object.entries(STANDARD_REQUIREMENTS)) for (const [clause, k, title, tcode] of items) if (tcode === code) refs.push([`${std} § ${clause}`, P(title, lang), x(k === 'maintain' ? 'maintain' : 'retain', lang)]);
    const link = (ids, k) => [].concat(ids || []).flatMap(v => String(P(v, lang) || '').match(/E2E-\d+/g) || []).forEach(id => { const o = cat.get('e2e', id); if (o && id !== e2e.id && !refs.some(r => r[0] === id)) refs.push([id, P(o.name, lang), x(k, lang)]); });
    link(e2e.relatedTo, 'upstream'); link(e2e.consumes, 'upstream'); link(e2e.feedsInto, 'downstream'); link(e2e.supportedBy, 'upstream');
    for (const m of e2e.mps || []) { const mp = cat.get('mp', m); if (mp) refs.push([m, P(mp.name, lang), x('mp', lang)]); }
    return { body: { subsections: [
      { heading: x('references', lang), table: { columns: [x('ref', lang), x('title', lang), x('kind', lang)], rows: refs, trace: refs.map(r => ({ type: 'design', id: r[0] })) } },
      { heading: x('definitions', lang), table: { columns: [x('term', lang), x('definition', lang)], rows: GLOSSARY.map(([k, v]) => [P(k, lang), P(v, lang)]) } }] }, fingerprint: fp(refs.map(r => ({ _id: r[0] }))) };
  }
  if (kind === 'method') {
    const mps = (e2e.mps || []).map(m => cat.get('mp', m)).filter(Boolean);
    return { body: { text: x('methodText', lang, { n: ufts.length, s: stepIds.length, m: mps.length }), subsections: [
      { heading: x('frame', lang), kv: [[x('goal', lang), P(e2e.goal, lang)], [x('trigger', lang), P(e2e.trigger, lang)], [x('end', lang), P(e2e.terminal, lang)], [x('ptype', lang), P(e2e.type, lang)]].filter(r => r[1]) },
      { heading: x('mp', lang), table: { columns: [x('ref', lang), x('name', lang), x('objective', lang), x('owner', lang)], rows: mps.map(m => [m.id, P(m.name, lang), P(m.objective, lang), tr(P(m.owner, lang), lang) || '—']), trace: mps.map(m => ({ type: 'design', id: m.id })) } },
      { heading: x('rag', lang), table: { columns: [x('rating', lang), x('rule', lang)], rows: [[x('green', lang), x('greenRule', lang)], [x('amber', lang), x('amberRule', lang)], [x('red', lang), x('redRule', lang)]] } },
      { heading: x('riskScale', lang), table: { columns: [x('score', lang), x('level', lang), x('response', lang)], rows: [['1 – 5', x('low', lang), x('lowR', lang)], ['6 – 11', x('medium', lang), x('mediumR', lang)], ['12 – 19', x('high', lang), x('highR', lang)], ['20 – 25', x('critical', lang), x('criticalR', lang)]] } },
      { heading: x('racsiCodes', lang), table: { columns: [x('code', lang), x('meaning', lang)], rows: ['R', 'A', 'C', 'S', 'I'].map(k => [k, x(k, lang)]) } }] }, fingerprint: fp(mps.map(m => ({ _id: m.id }))) };
  }
  if (kind === 'tasks') {
    const subs = ufts.map(u => {
      const ti = tis[u.id]; const steps = (u.steps || []).map(s => D.get(orgId, 'step', s, { releaseId: rel })).filter(Boolean);
      const nRows = ti ? one(`SELECT count(*) n FROM step_rows r JOIN step_records s ON s.id=r.step_record_id WHERE s.task_instance_id=?`, ti.id)?.n || 0 : 0;
      const ctl = controls.filter(c => String(c.steps || '').split(/[;,]\s*/).some(s => (u.steps || []).includes(s)));
      return { heading: `${u.id} — ${P(u.name, lang)}`, kv: [
        [x('description', lang), P(u.description, lang)], [x('mp', lang), u.mp ? `${u.mp} ${P(cat.get('mp', u.mp)?.name, lang) || ''}` : ''], [x('steps', lang), steps.map(s => `${s.id} ${P(s.name, lang)}`).join('\n')],
        [x('supplier', lang), P(u.supplier, lang)], [x('input', lang), P(u.input, lang)], [x('output', lang), P(u.output, lang)], [x('customer', lang), P(u.beneficiary, lang)],
        ['R / A', `${role(u, 'R')} / ${role(u, 'A')}`], ['C / S / I', `${role(u, 'C')} / ${role(u, 'S')} / ${role(u, 'I')}`], [x('ai', lang), x(u.ai ? 'yes' : 'no', lang)],
        [x('status', lang), ti ? t('status.' + ti.status, lang) : '—'], [x('assignee', lang), userName(ti?.owner_id) || role(u, 'R')], [x('due', lang), (ti?.due_date || '').slice(0, 10) || '—'],
        [x('started', lang), (ti?.started_at || '').slice(0, 10) || '—'], [x('completed', lang), (ti?.completed_at || '').slice(0, 10) || '—'], [x('rows', lang), String(nRows)],
        [x('controlsOn', lang), ctl.map(c => `${c.id} ${P(c.name, lang)}`).join('\n') || '—']].filter(r => r[1]) };
    });
    return { body: { subsections: subs }, fingerprint: fp(ufts.map(u => ({ _id: u.id, _v: tis[u.id]?.status }))), empty: !subs.length };
  }
  const latest = id => (vals[id] || []).at(-1);
  // Recorded actions belong to the processes that manage actions (the macro-processes of the Action entity).
  const actionMps = entityRegistry().Action?.mps || []; const ownsActions = (e2e.mps || []).some(m => actionMps.includes(m));
  const open = ownsActions ? all(`SELECT id, ref, data, version FROM records WHERE entity='Action' AND org_id=? AND project_id=?`, orgId, projectId).map(r => ({ _id: r.id, _v: r.version, _ref: r.ref ? 'ACT-' + String(r.ref).toUpperCase() : null, ...J(r.data, {}) })) : [];
  const today = new Date().toISOString().slice(0, 10);
  if (kind === 'analysis') {
    const done = ufts.filter(u => tis[u.id]?.status === 'Completed').length;
    const stepRows = all(`SELECT s.step_id, count(r.id) n FROM step_records s JOIN task_instances ti ON ti.id=s.task_instance_id LEFT JOIN step_rows r ON r.step_record_id=s.id WHERE ti.project_id=? GROUP BY s.step_id`, projectId);
    const withData = stepIds.filter(s => stepRows.some(r => r.step_id === s)).length; const nRows = stepRows.filter(r => stepIds.includes(r.step_id)).reduce((a, r) => a + r.n, 0);
    const cnt = { Green: 0, Amber: 0, Red: 0, none: 0 }; for (const k of kpis) cnt[latest(k.id)?.status || 'none'] = (cnt[latest(k.id)?.status || 'none'] || 0) + 1;
    const top = [...risks].sort((a, b) => b.residual - a.residual)[0]; const eff = controls.filter(c => c.effectiveness === 'Effective').length;
    const pending = open.filter(a => !['Done', 'Cancelled'].includes(a.status)); const late = pending.filter(a => a.due_date && a.due_date < today).length;
    const below = kpis.filter(k => ['Amber', 'Red'].includes(latest(k.id)?.status));
    const pct = ufts.length ? Math.round(done / ufts.length * 100) : 0;
    const concl = {
      en: `${done} of ${ufts.length} tasks are complete (${pct} %) and ${withData} of ${stepIds.length} steps hold recorded results. ${cnt.Green} indicators are Green, ${cnt.Amber} Amber and ${cnt.Red} Red${below.length ? `; the indicators below target are ${below.map(k => k.id).join(', ')}, and an action is listed for each in the next section` : ''}. ${controls.length ? `${eff} of ${controls.length} controls are rated effective.` : ''} ${pending.length ? `Open actions: ${pending.length}, of which ${late} overdue.` : 'No recorded action remains open.'}`,
      fr: `${done} tâches sur ${ufts.length} sont terminées (${pct} %) et ${withData} étapes sur ${stepIds.length} contiennent des résultats enregistrés. ${cnt.Green} indicateurs sont au vert, ${cnt.Amber} à l’orange et ${cnt.Red} au rouge${below.length ? ` ; les indicateurs sous la cible sont ${below.map(k => k.id).join(', ')}, et une action est prévue pour chacun dans la section suivante` : ''}. ${controls.length ? `${eff} contrôles sur ${controls.length} sont jugés efficaces.` : ''} ${pending.length ? `Actions ouvertes : ${pending.length}, dont ${late} en retard.` : 'Aucune action enregistrée ne reste ouverte.'}`,
      ar: `أنجزت ${done} مهام من أصل ${ufts.length} (${pct}%) وتتضمن ${withData} خطوات من أصل ${stepIds.length} نتائج مسجلة. ${cnt.Green} مؤشرات خضراء و${cnt.Amber} برتقالية و${cnt.Red} حمراء${below.length ? `؛ المؤشرات دون الهدف هي ${below.map(k => k.id).join('، ')} ولكل منها إجراء في القسم الموالي` : ''}. ${controls.length ? `${eff} ضوابط من أصل ${controls.length} مقيمة فعالة.` : ''} ${pending.length ? `تبقى ${pending.length} إجراءات مفتوحة منها ${late} متأخرة.` : 'لا يبقى أي إجراء مسجل مفتوحاً.'}` };
    const trendOf = id => { const v = (vals[id] || []).slice(-3); return v.length < 2 ? '—' : v.at(-1).value > v[0].value ? '↗' : v.at(-1).value < v[0].value ? '↘' : '→'; };
    return { body: { subsections: [
      { heading: x('findings', lang), table: { columns: [x('measure', lang), x('value', lang)], rows: [[x('progress', lang), `${done} / ${ufts.length} (${pct} %)`], [x('stepsData', lang), `${withData} / ${stepIds.length}`], [x('rowsTotal', lang), String(nRows)],
        [x('kpiStatus', lang), `${cnt.Green} / ${cnt.Amber} / ${cnt.Red} / ${cnt.none}`], [x('riskTop', lang), top ? `${top.id} ${P(top.name, lang)} — ${top.residual}` : '—'], [x('ctlEff', lang), controls.length ? `${eff} / ${controls.length}` : '—'], [x('actionsOpen', lang), `${pending.length} (${late})`]] } },
      ...(below.length ? [{ heading: x('kpiDetail', lang), table: { columns: ['ID', x('name', lang), x('value', lang), x('status', lang), x('periods', lang), x('trend', lang)],
        rows: below.map(k => { const v = latest(k.id); return [k.id, P(k.name, lang), `${v.value} / ${P(k.target, lang)}`, x(ratingOf(v.status), lang), (vals[k.id] || []).slice(-3).map(p => `${p.period}: ${p.value}`).join(' · '), trendOf(k.id)]; }), trace: below.map(k => ({ type: 'kpi', id: k.id })) } }] : []),
      { heading: x('conclusion', lang), text: concl[lang] || concl.en }] }, fingerprint: fp([...ufts.map(u => ({ _id: u.id, _v: tis[u.id]?.status })), ...kpis.map(k => ({ _id: k.id, _v: latest(k.id)?.period }))]) };
  }
  // actions
  const rows = []; const trace = [];
  const owners = Object.fromEntries(ufts.map(u => [u.mp, role(u, 'A')]));
  const plus = (d, n) => { const z = new Date(d || today); z.setDate(z.getDate() + n); return z.toISOString().slice(0, 10); };
  let n = 0; const id = () => `ACT-${e2e.id.slice(4)}-${String(++n).padStart(2, '0')}`;
  for (const a of open) { rows.push([a._ref || id(), P(a.label, lang) || '—', userName(a.owner_user_id) || '—', userName(a.evaluator_user_id) || '—', a.due_date || '—', t('status.' + a.status, lang) === 'status.' + a.status ? a.status : t('status.' + a.status, lang), x('recorded', lang)]); trace.push({ type: 'record', entity: 'Action', id: a._id, version: a._v }); }
  for (const k of kpis) { const v = latest(k.id); if (!v || !['Amber', 'Red'].includes(v.status)) continue; rows.push([id(), x('recover', lang, { kpi: P(k.name, lang), value: v.value, target: P(k.target, lang) }), owners[k.mp] || '—', tr(P(cat.get('mp', k.mp)?.owner, lang), lang) || '—', plus(null, v.status === 'Red' ? 30 : 60), x('planned', lang), x('fromKpi', lang, { id: k.id, status: x(ratingOf(v.status), lang) })]); trace.push({ type: 'kpi', id: k.id }); }
  for (const u of ufts) { const ti = tis[u.id]; if (!ti || ti.status === 'Completed') continue; rows.push([id(), x('finishTask', lang, { id: u.id, name: P(u.name, lang) }), userName(ti.owner_id) || role(u, 'R'), role(u, 'A'), (ti.due_date || '').slice(0, 10) || plus(null, 14), t('status.' + ti.status, lang), x('fromTask', lang)]); trace.push({ type: 'design', id: u.id }); }
  for (const c of controls) { if (!c.effectiveness || c.effectiveness === 'Effective') continue; rows.push([id(), x('strengthen', lang, { id: c.id, name: P(c.name, lang), eff: x(c.effectiveness, lang) }), tr(P(c.owner, lang), lang) || '—', role(ufts[0], 'A'), plus(null, 90), x('planned', lang), x('fromControl', lang)]); trace.push({ type: 'control', id: c.id }); }
  if (!rows.length) return { body: { text: x('noAction', lang) }, fingerprint: 'none' };
  return { body: { table: { columns: ['ID', x('action', lang), x('owner', lang), x('evaluator', lang), x('due', lang), x('status', lang), x('origin', lang)], rows, trace } }, fingerprint: fp(trace.map(t2 => ({ _id: t2.id, _v: t2.version }))) };
}
