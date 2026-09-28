// AI engine without any external provider (NFR-DA-DATA-01): deterministic rules,
// statistics and TF-IDF retrieval over the platform's own content. Every suggestion
// is logged with a confidence and stays a suggestion until a human accepts it.
import { all, get } from '../db.js';
import { catalog, loc } from '../catalog/store.js';

const LANGS = ['en', 'fr', 'ar'];
const STOP = new Set('the a an and or of to in on for with is are be by as at from this that it how what which who when do does can i my our de la le les des du un une et ou en pour par sur est sont dans au aux avec que qui quoi comment quel quelle في من على إلى عن مع هو هي ما كيف هل التي الذي و أو'.split(' '));
export function tokens(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[ً-ٰٟ]/g, '').replace(/[̀-ͯ]/g, '')
    .split(/[^\p{L}\p{N}]+/u).filter(t => t.length > 1 && !STOP.has(t)).map(t => (t.length > 4 && /^[a-z]+$/.test(t) ? t.replace(/(ing|ed|es|s)$/, '') : t));
}

class Index {
  constructor(docs) {
    this.docs = docs; this.df = new Map(); this.vecs = [];
    for (const d of docs) { const tf = new Map(); for (const t of tokens(d.text)) tf.set(t, (tf.get(t) || 0) + 1); this.vecs.push(tf); for (const t of tf.keys()) this.df.set(t, (this.df.get(t) || 0) + 1); }
    this.N = docs.length;
  }
  search(q, k = 5) {
    const qt = tokens(q);
    if (!qt.length) return [];
    const scores = this.vecs.map((tf, i) => {
      let s = 0;
      for (const t of qt) { const f = tf.get(t); if (f) s += (1 + Math.log(f)) * Math.log(1 + this.N / (this.df.get(t) || 1)); }
      const title = tokens(this.docs[i].title);
      for (const t of qt) if (title.includes(t)) s += 1.5;
      return { i, s };
    }).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, k);
    const max = scores[0]?.s || 1;
    return scores.map(x => ({ ...this.docs[x.i], score: Math.round((x.s / max) * 100) / 100 }));
  }
}

const cache = {};
function contentIndex(lang, scope) {
  const key = `${scope}:${lang}`;
  if (cache[key]) return cache[key];
  const c = catalog();
  const T = (v) => loc(v, lang);
  const docs = [];
  if (scope === 'help') {
    for (const a of c.help) docs.push({ type: 'help', id: a.id, module: a.module, title: T(a.title), text: `${T(a.title)} ${T(a.body)}`, body: T(a.body) });
    c.faq.forEach((f, i) => docs.push({ type: 'faq', id: `FAQ-${i + 1}`, title: T(f.q), text: `${T(f.q)} ${T(f.a)}`, body: T(f.a) }));
  } else {
    for (const k of c.kb) docs.push({ type: 'kb', id: k.id, title: T(k.title), text: `${k.standard} ${T(k.title)} ${T(k.summary)} ${k.clauses.map(x => `${x.id} ${T(x.title)}`).join(' ')}`, body: T(k.summary), clauses: k.clauses.map(x => `${x.id} ${T(x.title)}`) });
    for (const e of c.e2e) docs.push({ type: 'e2e', id: e.id, title: `${e.id} — ${T(e.name)}`, text: `${T(e.name)} ${T(e.goals)} ${T(e.description)} ${T(e.narrative)}`, body: T(e.description) || T(e.goals) });
    for (const m of c.macroProcesses) docs.push({ type: 'mp', id: m.id, title: `${m.code} — ${T(m.name)}`, text: `${m.code} ${T(m.name)} ${T(m.goal)} ${T(m.objective)} ${m.standards.join(' ')}`, body: `${T(m.goal)} ${T(m.objective)}`.trim() });
  }
  cache[key] = new Index(docs);
  return cache[key];
}
export function invalidateAiCache() { for (const k of Object.keys(cache)) delete cache[k]; }

const MSG = {
  none: { en: 'I did not find an answer in the DynamicMS content. Rephrase with the name of a module, a standard or a process.', fr: 'Je n\'ai pas trouvé de réponse dans le contenu DynamicMS. Reformulez avec le nom d\'un module, d\'une norme ou d\'un processus.', ar: 'لم أجد إجابة في محتوى DynamicMS. أعد الصياغة باسم وحدة أو معيار أو عملية.' },
  seeAlso: { en: 'See also', fr: 'Voir aussi', ar: 'انظر أيضًا' },
  local: { en: 'Answer built from DynamicMS content and your data; no external AI service was called.', fr: 'Réponse construite à partir du contenu DynamicMS et de vos données ; aucun service d\'IA externe n\'a été appelé.', ar: 'تم بناء الإجابة من محتوى DynamicMS وبياناتك؛ لم يُستدعَ أي خدمة ذكاء اصطناعي خارجية.' },
};

// Data-query intents (FR-DA-AST-01), recognized in the three languages.
const INTENTS = [
  ['overdue', /overdue|late|retard|échu|متأخر/],
  ['ncs', /nonconform|non-conform|\bnc\b|incident|عدم المطابقة|عدم مطابقة/],
  ['kpi', /kpi|indicator|indicateur|target|cible|مؤشر/],
  ['progress', /progress|avancement|status|état|where|تقدم|حالة/],
  ['gate', /gate|jalon|بوابة/],
  ['risk', /risk|risque|hazard|danger|مخاطر|خطر/],
  ['mine', /my task|my step|mes tâches|mes étapes|مهامي|خطواتي/],
];

export function ask({ question, mode, lang, projectId, user }) {
  const q = String(question || '').slice(0, 500);
  if (mode === 'data' && projectId) return dataAnswer(q, lang, projectId, user);
  const idx = contentIndex(lang, mode === 'help' ? 'help' : 'standards');
  const hits = idx.search(q, 5);
  if (!hits.length) return { answer: MSG.none[lang], sources: [], confidence: 0, note: MSG.local[lang] };
  const top = hits[0];
  let answer = top.body;
  if (top.clauses) answer += `\n• ${top.clauses.slice(0, 6).join('\n• ')}`;
  return { answer, title: top.title, sources: hits.map(h => ({ type: h.type, id: h.id, title: h.title, module: h.module, score: h.score })), confidence: Math.min(0.95, 0.45 + 0.1 * tokens(q).filter(t => tokens(top.text).includes(t)).length), note: MSG.local[lang] };
}

function dataAnswer(q, lang, projectId, user) {
  const c = catalog();
  const T = (v) => loc(v, lang);
  const intent = (INTENTS.find(([, re]) => re.test(q.toLowerCase())) || ['progress'])[0];
  const L = (en, fr, ar) => ({ en, fr, ar }[lang]);
  const p = get('SELECT * FROM projects WHERE id=?', projectId);
  let answer; let table = null;
  if (intent === 'overdue' || intent === 'mine') {
    const where = intent === 'mine' ? `AND (assignee_user=? OR assignee_role IN (${user.roles.map(() => '?').join(',')}))` : `AND due_date < date('now')`;
    const args = intent === 'mine' ? [user.id, ...user.roles] : [];
    const list = all(`SELECT id, step_id, mp_id, due_date, assignee_role FROM step_exec WHERE project_id=? AND status<>'Done' ${where} ORDER BY due_date LIMIT 10`, projectId, ...args);
    const n = get(`SELECT COUNT(*) n FROM step_exec WHERE project_id=? AND status<>'Done' ${where}`, projectId, ...args).n;
    answer = intent === 'mine' ? L(`You have ${n} open steps. The next ones by due date:`, `Vous avez ${n} étapes ouvertes. Les prochaines par échéance :`, `لديك ${n} خطوة مفتوحة. الخطوات التالية حسب الموعد:`) : L(`${n} steps are overdue. The oldest ones:`, `${n} étapes sont en retard. Les plus anciennes :`, `${n} خطوة متأخرة. الأقدم منها:`);
    table = list.map(s => ({ id: s.id, step: s.step_id, name: T(c.stepById[s.step_id]?.name), due: s.due_date, link: `/steps/${s.id}` }));
  } else if (intent === 'ncs') {
    const list = all(`SELECT id, code, title, criticality, stage FROM ncs WHERE project_id=? AND status<>'Closed' ORDER BY CASE criticality WHEN 'Critical' THEN 0 WHEN 'Major' THEN 1 ELSE 2 END LIMIT 10`, projectId);
    answer = L(`${list.length} nonconformities are open.`, `${list.length} non-conformités sont ouvertes.`, `هناك ${list.length} حالات عدم مطابقة مفتوحة.`);
    table = list.map(n => ({ id: n.id, code: n.code, name: T(JSON.parse(n.title)), criticality: n.criticality, stage: n.stage, link: `/ncs/${n.id}` }));
  } else if (intent === 'kpi') {
    const ks = all('SELECT id, code, name, target, target_text, direction FROM kpis WHERE project_id=?', projectId);
    const off = [];
    for (const k of ks) {
      const v = get('SELECT value FROM kpi_values WHERE kpi_id=? ORDER BY period DESC LIMIT 1', k.id)?.value;
      if (v !== undefined && k.target !== null && (k.direction === 'down' ? v > k.target : v < k.target)) off.push({ id: k.id, code: k.code, name: T(JSON.parse(k.name)), value: v, target: k.target_text });
    }
    answer = L(`${off.length} of ${ks.length} KPIs are off target on the last measurement.`, `${off.length} KPI sur ${ks.length} sont hors cible à la dernière mesure.`, `${off.length} من أصل ${ks.length} مؤشرات خارج المستهدف في آخر قياس.`);
    table = off;
  } else if (intent === 'risk') {
    const list = all('SELECT id, code, title, score, kind, status FROM risks WHERE project_id=? ORDER BY score DESC LIMIT 8', projectId);
    answer = L('Highest-scored risks, hazards and aspects:', 'Risques, dangers et aspects les plus élevés :', 'أعلى المخاطر والأخطار والجوانب درجةً:');
    table = list.map(x => ({ id: x.id, code: x.code, name: T(JSON.parse(x.title)), score: x.score, kind: x.kind, status: x.status }));
  } else if (intent === 'gate') {
    const ph = get(`SELECT * FROM phases WHERE project_id=? AND status IN ('Active','AtGate') ORDER BY seq LIMIT 1`, projectId);
    const open = ph ? get(`SELECT COUNT(*) n FROM step_exec WHERE project_id=? AND e2e_id=? AND status<>'Done'`, projectId, ph.e2e_id).n : 0;
    answer = ph ? L(`The current phase is ${ph.e2e_id} — ${T(c.e2eById[ph.e2e_id].name)}. ${open} steps remain before its gate.`, `La phase en cours est ${ph.e2e_id} — ${T(c.e2eById[ph.e2e_id].name)}. Il reste ${open} étapes avant son jalon.`, `المرحلة الحالية هي ${ph.e2e_id} — ${T(c.e2eById[ph.e2e_id].name)}. تبقى ${open} خطوة قبل بوابتها.`)
      : L('All phases are closed.', 'Toutes les phases sont clôturées.', 'جميع المراحل مغلقة.');
  } else {
    const cnt = get(`SELECT COUNT(*) n, SUM(status='Done') d FROM step_exec WHERE project_id=?`, projectId);
    const ph = get(`SELECT e2e_id FROM phases WHERE project_id=? AND status IN ('Active','AtGate') ORDER BY seq LIMIT 1`, projectId);
    answer = L(`${p.code} is ${Math.round(100 * cnt.d / cnt.n)}% complete (${cnt.d} of ${cnt.n} steps). Current phase: ${ph ? ph.e2e_id + ' — ' + T(c.e2eById[ph.e2e_id].name) : '—'}.`,
      `${p.code} est réalisé à ${Math.round(100 * cnt.d / cnt.n)} % (${cnt.d} étapes sur ${cnt.n}). Phase en cours : ${ph ? ph.e2e_id + ' — ' + T(c.e2eById[ph.e2e_id].name) : '—'}.`,
      `نسبة إنجاز ${p.code} هي ${Math.round(100 * cnt.d / cnt.n)}% (${cnt.d} من ${cnt.n} خطوة). المرحلة الحالية: ${ph ? ph.e2e_id + ' — ' + T(c.e2eById[ph.e2e_id].name) : '—'}.`);
  }
  return { answer, intent, table, confidence: 0.9, sources: [{ type: 'data', id: projectId, title: p.code }], note: MSG.local[lang] };
}

// ---- AI use case suggestions (human-in-the-loop)
export function suggest({ usecase, project, lang, input }) {
  const c = catalog();
  const T = (v) => loc(v, lang);
  const task = loc(usecase.task_type ? JSON.parse(usecase.task_type) : {}, 'en') || 'Text Generation';
  const L = (en, fr, ar) => ({ en, fr, ar }[lang]);
  const mp = c.mpById[usecase.linked_mp];
  const text = String(input || '');
  if (/Recommend/i.test(task)) {
    const idx = new Index(all('SELECT id, recommendation, root_cause, category FROM rex WHERE org_id=? LIMIT 2000', project.org_id).map(x => ({ id: x.id, title: x.category, text: `${T(JSON.parse(x.root_cause || 'null')) || ''} ${T(JSON.parse(x.recommendation || 'null')) || ''}`, body: T(JSON.parse(x.recommendation || 'null')), cause: T(JSON.parse(x.root_cause || 'null')) })));
    const hits = idx.search(text || T(mp?.name), 3);
    const items = hits.length ? hits.map(h => `${h.body} (${L('cause', 'cause', 'السبب')}: ${h.cause})`) : [L('Contain affected items, verify the work instruction, retrain the team, then check effectiveness after 3 months.', 'Confiner les éléments concernés, vérifier l\'instruction de travail, reformer l\'équipe, puis vérifier l\'efficacité après 3 mois.', 'احتواء العناصر المتأثرة، والتحقق من تعليمات العمل، وإعادة تدريب الفريق، ثم التحقق من الفعالية بعد 3 أشهر.')];
    return { kind: 'Recommendation', items, confidence: hits.length ? Math.min(0.9, 0.55 + hits[0].score * 0.3) : 0.4, sources: hits.map(h => ({ type: 'rex', id: h.id, title: h.title })) };
  }
  if (/Classif/i.test(task)) {
    const cats = [['OH&S', /injur|safety|ppe|forklift|blessure|sécurité|epi|إصابة|سلامة/], ['Environment', /spill|waste|emission|déversement|déchet|rejet|انسكاب|نفايات|انبعاث/], ['Supplier', /supplier|batch|delivery|fournisseur|lot|livraison|مورد|دفعة|تسليم/], ['Documentation', /document|instruction|record|procédure|enregistrement|وثيقة|تعليمات|سجل/], ['Competence', /training|competence|formation|compétence|تدريب|كفاءة/], ['Product', /.*/]];
    const [cat] = cats.find(([, re]) => re.test(text.toLowerCase()));
    const crit = /critical|critique|injur|recall|حرج|إصابة/.test(text.toLowerCase()) ? 'Critical' : /customer|client|major|majeur|عميل/.test(text.toLowerCase()) ? 'Major' : 'Minor';
    return { kind: 'Classification', items: [`${L('Category', 'Catégorie', 'الفئة')}: ${cat}`, `${L('Criticality', 'Criticité', 'الحرجية')}: ${crit}`], values: { category: cat, criticality: crit }, confidence: cat === 'Product' ? 0.55 : 0.78, sources: [] };
  }
  if (/Predict/i.test(task)) {
    const ks = all('SELECT id, code, name, target, direction FROM kpis WHERE project_id=?', project.id);
    const items = []; const sources = [];
    for (const k of ks) {
      const vals = all('SELECT value FROM kpi_values WHERE kpi_id=? ORDER BY period DESC LIMIT 6', k.id).map(v => v.value).reverse();
      if (vals.length < 3 || k.target === null) continue;
      const n = vals.length; const xs = vals.map((_, i) => i); const mx = (n - 1) / 2; const my = vals.reduce((a, b) => a + b, 0) / n;
      const slope = xs.reduce((a, x, i) => a + (x - mx) * (vals[i] - my), 0) / xs.reduce((a, x) => a + (x - mx) ** 2, 0);
      const f = Math.round((vals[n - 1] + slope * 3) * 10) / 10;
      const miss = k.direction === 'down' ? f > k.target : f < k.target;
      if (miss) { items.push(`${k.code} ${T(JSON.parse(k.name))}: ${L('forecast in 3 months', 'prévision à 3 mois', 'التوقع بعد 3 أشهر')} ${f} / ${L('target', 'cible', 'المستهدف')} ${k.target}`); sources.push({ type: 'kpi', id: k.id, title: k.code }); }
    }
    if (!items.length) items.push(L('No KPI is forecast to miss its target in the next 3 months.', 'Aucun KPI ne devrait manquer sa cible dans les 3 prochains mois.', 'لا يُتوقع أن يخطئ أي مؤشر مستهدفه خلال الأشهر الثلاثة القادمة.'));
    return { kind: 'Prediction', items: items.slice(0, 6), confidence: 0.68, sources };
  }
  // Text generation / summarization: draft from the process design and project standards
  const std = JSON.parse(project.standards || '[]').join(', ');
  const outs = (mp?.sipoc?.O || []).slice(0, 3).map(T);
  const items = [
    L(`Purpose: ${T(mp?.goal) || T(mp?.name)}.`, `Objet : ${T(mp?.goal) || T(mp?.name)}.`, `الغرض: ${T(mp?.goal) || T(mp?.name)}.`),
    L(`Deliverables: ${outs.join('; ')}.`, `Livrables : ${outs.join(' ; ')}.`, `المخرجات: ${outs.join('؛ ')}.`),
    L(`Requirements in scope: ${std}.`, `Exigences du périmètre : ${std}.`, `المتطلبات ضمن النطاق: ${std}.`),
    L(`Accountable: ${T(mp?.ownerRoleName)}; review at least once a year.`, `Responsable : ${T(mp?.ownerRoleName)} ; revue au moins une fois par an.`, `المسؤول: ${T(mp?.ownerRoleName)}؛ المراجعة مرة واحدة سنويًا على الأقل.`),
  ];
  if (text) items.unshift(L(`Context: ${text}`, `Contexte : ${text}`, `السياق: ${text}`));
  return { kind: 'Text Generation', items, confidence: 0.7, sources: mp ? [{ type: 'mp', id: mp.id, title: `${mp.code} — ${T(mp.name)}` }] : [] };
}
export { LANGS };
