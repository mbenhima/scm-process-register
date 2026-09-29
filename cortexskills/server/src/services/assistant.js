// AI Assistant: data-query mode (fixed intents, each tied to one permission checked after matching and
// before querying — FR-DA-AST-02) and application-help mode (retrieval over the FAQ/help corpus — FR-DA-AST-04).
import { one, all } from '../db.js';
import { J, pick } from '../lib/util.js';
import { t } from '../i18n.js';
import { tokenize, retrieve } from './retrieval.js';
import { userPermissions } from '../rbac.js';
import { getLicenceProvider } from '../licensing/LicenceProvider.js';
import { logUsage } from './ai.js';

const INTENTS = [
  { id: 'projects', perm: 'projects.view', kw: 'how many projects runs engagements combien projets missions كم مشاريع مشروع', run: r => ({ n: one(`SELECT COUNT(*) n FROM projects WHERE org_id=?`, r.orgId).n, active: one(`SELECT COUNT(*) n FROM projects WHERE org_id=? AND status='Active'`, r.orgId).n }) },
  { id: 'overdue', perm: 'projects.view', kw: 'overdue late tasks retard en retard tâches متأخرة المهام تأخر', run: r => ({ n: one(`SELECT COUNT(*) n FROM task_instances WHERE org_id=? AND status!='Completed' AND due_date < ?`, r.orgId, new Date().toISOString()).n }) },
  { id: 'mytasks', perm: 'tasks.execute', kw: 'my tasks assigned to me mes tâches assignées مهامي المسندة', run: r => ({ n: one(`SELECT COUNT(*) n FROM task_instances WHERE org_id=? AND owner_id=? AND status!='Completed'`, r.orgId, r.user.id).n }) },
  { id: 'alerts', perm: 'alerts.view', kw: 'alerts unread notifications alertes non lues التنبيهات تنبيه', run: r => ({ n: one(`SELECT COUNT(*) n FROM alerts a WHERE a.org_id=? AND NOT EXISTS (SELECT 1 FROM alert_reads x WHERE x.alert_id=a.id AND x.user_id=?)`, r.orgId, r.user.id).n }) },
  { id: 'progress', perm: 'projects.view', kw: 'progress end-to-end e2e completion avancement progression processus التقدم نسبة الإنجاز', run: r => {
      const p = r.projectId ? one(`SELECT name, progress FROM projects WHERE id=? AND org_id=?`, r.projectId, r.orgId) : one(`SELECT name, progress FROM projects WHERE org_id=? ORDER BY updated_at DESC LIMIT 1`, r.orgId);
      return p ? { project: pick(p.name, r.lang), pct: Math.round(p.progress) } : { project: '—', pct: 0 }; } },
  { id: 'kpi', perm: 'reports.view', kw: 'kpi indicators off target red indicateurs cible rouge المؤشرات الهدف مؤشر', run: r => ({ n: one(`SELECT COUNT(*) n FROM kpi_values WHERE org_id=? AND status='Red' AND period=(SELECT MAX(period) FROM kpi_values WHERE org_id=?)`, r.orgId, r.orgId).n }) },
  { id: 'risks', perm: 'governance.view', kw: 'top risks risk heat map risques principaux المخاطر خطر', run: r => {
      const x = all(`SELECT data FROM records WHERE entity='RiskOpportunity' AND org_id=?`, r.orgId).map(d => J(d.data)).sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 3);
      return { list: x.map(k => `${pick(k.title || k.name, r.lang)} (${k.score})`).join(' · ') || '—' }; } },
  { id: 'responses', perm: 'm54.view', kw: 'questionnaire response rate responses survey taux de réponse questionnaire enquête معدل الاستجابة الاستبيان', run: r => {
      const reg = one(`SELECT COUNT(*) n FROM records WHERE entity='Stakeholder' AND org_id=?`, r.orgId).n;
      const resp = one(`SELECT COUNT(*) n FROM records WHERE entity='QuestionnaireResponse' AND org_id=?`, r.orgId).n;
      return { pct: reg ? Math.round(Math.min(100, resp * 100 / reg)) : 0, n: resp }; } },
  { id: 'budget', perm: 'm18.view', kw: 'budget spend cost dépenses coût الميزانية التكلفة', run: r => {
      const rows = all(`SELECT data FROM records WHERE entity='BudgetLine' AND org_id=?`, r.orgId).map(d => J(d.data));
      const planned = rows.reduce((s, x) => s + (x.planned_amount || 0), 0), actual = rows.reduce((s, x) => s + (x.actual_amount || 0), 0);
      return { planned: Math.round(planned).toLocaleString('en-US'), actual: Math.round(actual).toLocaleString('en-US'), pct: planned ? Math.round(actual * 100 / planned) : 0 }; } },
  { id: 'themes', perm: 'm49.view', kw: 'priority themes training plan top thèmes prioritaires plan de formation المحاور ذات الأولوية خطة التكوين', run: r => {
      const x = all(`SELECT data FROM records WHERE entity='TrainingTheme' AND org_id=?${r.projectId ? ' AND project_id=?' : ''} ORDER BY json_extract(data,'$.priority_rank') LIMIT 3`, r.orgId, ...(r.projectId ? [r.projectId] : [])).map(d => pick(J(d.data).name, r.lang));
      return { list: x.join(' · ') || '—' }; } },
  { id: 'stakeholders', perm: 'm53.view', kw: 'stakeholders respondents parties prenantes répondants أصحاب المصلحة المستجيبين', run: r => ({ n: one(`SELECT COUNT(*) n FROM records WHERE entity='Stakeholder' AND org_id=?`, r.orgId).n }) },
  { id: 'aiusage', perm: 'ai.view', kw: 'ai usage suggestions accepted rejected usage ia suggestions acceptées استخدام الذكاء الاصطناعي', run: r => {
      const x = all(`SELECT outcome, COUNT(*) n FROM ai_usage_log WHERE org_id=? GROUP BY outcome`, r.orgId); const g = k => x.find(y => y.outcome === k)?.n || 0;
      return { acc: g('Accepted'), ed: g('Edited'), rej: g('Rejected') }; } },
  { id: 'licence', perm: 'config.view', kw: 'licence license expiry seats licence expiration الترخيص انتهاء', run: r => { const c = getLicenceProvider(r.orgId).check(); return { status: c.status, days: c.daysLeft, max: c.licence?.maxUsers ?? 0 }; } },
  { id: 'users', perm: 'users.manage', kw: 'how many users accounts utilisateurs comptes المستخدمين الحسابات', run: r => ({ n: one(`SELECT COUNT(*) n FROM users WHERE org_id=?`, r.orgId).n }) },
];

function match(question) {
  const q = new Set(tokenize(question));
  let best = null;
  for (const it of INTENTS) {
    const kw = new Set(tokenize(it.kw)); let s = 0; for (const w of q) if (kw.has(w)) s++;
    if (s > (best?.s || 0)) best = { it, s };
  }
  return best && best.s >= 1 ? best.it : null;
}

export function ask(req, question, mode = 'auto') {
  const lang = req.lang;
  const isHelp = /^(can|how|comment|puis|est-ce|هل|كيف)/i.test(question.trim());
  const intent = mode === 'help' || (mode === 'auto' && isHelp) ? null : match(question);
  if (intent) {
    // Permission evaluated after matching and strictly before running the query.
    if (!userPermissions(req.user.id).has(intent.perm)) {
      logUsage({ orgId: req.orgId, projectId: req.projectId, useCaseId: 'AIUC-08', userId: req.user.id, outcome: 'Refused', question });
      return { mode: 'data', intent: intent.id, refused: true, answer: t('assistant.refused', lang, { permission: intent.perm }), permission: intent.perm };
    }
    const data = intent.run(req);
    logUsage({ orgId: req.orgId, projectId: req.projectId, useCaseId: 'AIUC-08', userId: req.user.id, outcome: 'Answered', question, confidence: 0.9 });
    return { mode: 'data', intent: intent.id, answer: t('assistant.intent.' + intent.id, lang, data), data };
  }
  const hits = retrieve(req.orgId, question, { lang, k: 4, sources: ['faq', 'help', 'process', 'kb', 'rex'] });
  logUsage({ orgId: req.orgId, projectId: req.projectId, useCaseId: 'AIUC-08', userId: req.user.id, outcome: 'Answered', question, confidence: hits[0]?.score ?? 0 });
  if (!hits.length) return { mode: 'help', answer: t('assistant.noMatch', lang), references: [] };
  return { mode: 'help', answer: hits[0].answer || hits[0].title, references: hits.map(h => ({ source: h.source, title: h.title, route: h.route, score: h.score })) };
}
export const intentCatalog = () => INTENTS.map(i => ({ id: i.id, permission: i.perm }));
