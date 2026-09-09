import { randomUUID } from 'node:crypto';
import db from '../db/index.js';
import { RagIndex } from './rag.js';

// Rule-based + RAG-grounded simulations of the NCP Solver AI agents (KB-010):
// one per process step (S1-S7) plus Monitoring & Alert and an Orchestrator.
// No external LLM is called: everything here is deterministic, explainable,
// and grounded in the tenant's own data - honoring the "AI Assists, Humans
// Decide" and "RBAC-aware retrieval" principles from KB-010/KB-014 without an
// outbound network dependency. Every suggestion is logged to ai_agent_logs
// with a confidence score for full traceability (AIAgentLog / KB-010).

function logAgent(req, ficheId, agentName, prompt, context, response, confidenceScore) {
  const id = randomUUID();
  db.prepare(`
    INSERT INTO ai_agent_logs (id, organization_id, fiche_id, agent_name, prompt, context_json, response, confidence_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.organizationId, ficheId || null, agentName, prompt || null,
    context ? JSON.stringify(context) : null, typeof response === 'string' ? response : JSON.stringify(response), confidenceScore);
  return id;
}

/** Builds a fresh Capitalization Library RAG index for one tenant (closed fiches + REX + root causes + actions). */
export function buildCapitalizationIndex(organizationId) {
  const fiches = db.prepare(`SELECT * FROM ncp_fiches WHERE organization_id = ? AND status = 'closed'`).all(organizationId);
  const index = new RagIndex();
  for (const f of fiches) {
    const rex = db.prepare('SELECT * FROM rex_entries WHERE fiche_id = ?').get(f.id);
    const rootCauses = db.prepare('SELECT * FROM root_causes WHERE fiche_id = ?').all(f.id);
    const actions = db.prepare('SELECT * FROM actions WHERE fiche_id = ?').all(f.id);
    const text = [
      f.title, f.description,
      rootCauses.map((rc) => rc.description).join(' '),
      actions.map((a) => a.description).join(' '),
      rex?.lessons_learned, rex?.root_cause_summary, rex?.solution_summary, rex?.tags,
    ].filter(Boolean).join('\n');
    index.addDocument({
      id: f.id,
      text,
      meta: {
        ficheId: f.id, ficheNumber: f.fiche_number, title: f.title,
        rootCauses: rootCauses.map((rc) => rc.description),
        correctiveActions: actions.filter((a) => a.action_type === 'corrective').map((a) => a.description),
        immediateActions: actions.filter((a) => a.action_type === 'immediate').map((a) => a.description),
        standardized: !!rex?.needs_standardization, generalized: !!rex?.needs_generalization,
        lessonsLearned: rex?.lessons_learned || null,
      },
    });
  }
  return index;
}

export function searchCapitalization(organizationId, query, topK = 5) {
  const index = buildCapitalizationIndex(organizationId);
  return index.search(query, { topK }).map((r) => ({ ...r.meta, score: Number(r.score.toFixed(3)) }));
}

const CRITICAL_KEYWORDS = ['safety', 'injury', 'hazard', 'accident', 'fire', 'collapse', 'contamination', 'toxic', 'leak', 'explosion', 'fatal', 'sécurité', 'danger', 'incendie'];
const MAJOR_KEYWORDS = ['non-compliant', 'non-conform', 'defect', 'delay', 'breach', 'failure', 'deviation', 'shortage'];

export function runClassificationAgent(req, fiche) {
  const text = `${fiche.title} ${fiche.description}`.toLowerCase();
  let suggestedCriticality = 'low';
  if (CRITICAL_KEYWORDS.some((k) => text.includes(k))) suggestedCriticality = 'high';
  else if (MAJOR_KEYWORDS.some((k) => text.includes(k))) suggestedCriticality = 'medium';

  const similar = searchCapitalization(req.user.organizationId, text, 3);
  const confidence = similar.length ? Math.min(0.95, 0.55 + similar[0].score) : 0.5;

  const response = {
    suggestedCriticality,
    suggestedPriority: suggestedCriticality === 'high' ? 1 : suggestedCriticality === 'medium' ? 2 : 3,
    similarPastFiches: similar,
  };
  logAgent(req, fiche.id, 'Classification Agent', text, null, response, confidence);
  return response;
}

export function runProblemStructuringAgent(req, fiche) {
  const index = buildCapitalizationIndex(req.user.organizationId);
  const results = index.search(`${fiche.title} ${fiche.description}`, { topK: 3 });
  const suggestions = [
    `What: ${fiche.description}`,
    `When: detected ${fiche.detection_date}`,
    'Where: confirm the OBS unit/department where this occurred.',
    'Who detected: confirm the reporting user or team.',
    "Why is it a problem: compare against the applicable standard or target objective.",
    'How much: quantify the gap (rate, cost, downtime) — see similar past sheets below for reference.',
  ];
  const response = { suggestions, sourceFiches: results.map((r) => r.meta.ficheNumber) };
  logAgent(req, fiche.id, 'Problem Structuring Agent', fiche.description, null, response, results[0]?.score || 0.4);
  return response;
}

export function runContainmentAdvisor(req, fiche) {
  const index = buildCapitalizationIndex(req.user.organizationId);
  const results = index.search(`${fiche.title} ${fiche.description}`, { topK: 5 });
  const suggestions = results.flatMap((r) => r.meta.immediateActions).slice(0, 5);
  const response = { suggestions, sourceFiches: results.map((r) => r.meta.ficheNumber) };
  logAgent(req, fiche.id, 'Containment Advisor Agent', fiche.description, null, response, results[0]?.score || 0.4);
  return response;
}

export function runRootCauseMining(req, fiche) {
  const index = buildCapitalizationIndex(req.user.organizationId);
  const results = index.search(`${fiche.title} ${fiche.description}`, { topK: 5 });
  const suggestions = results.flatMap((r) => r.meta.rootCauses).slice(0, 5);
  const categories = ['man', 'machine', 'method', 'material', 'measurement', 'milieu'];
  const response = { suggestedCauses: suggestions, suggestedCategories: categories, sourceFiches: results.map((r) => r.meta.ficheNumber) };
  logAgent(req, fiche.id, 'Root Cause Mining Agent', fiche.description, null, response, results[0]?.score || 0.4);
  return response;
}

export function runActionRecommendation(req, fiche, rootCauseText) {
  const index = buildCapitalizationIndex(req.user.organizationId);
  const results = index.search(rootCauseText, { topK: 5 });
  const suggestions = results.flatMap((r) => r.meta.correctiveActions).slice(0, 5);
  const response = { suggestions, sourceFiches: results.map((r) => r.meta.ficheNumber) };
  logAgent(req, fiche.id, 'Action Recommendation Agent', rootCauseText, null, response, results[0]?.score || 0.4);
  return response;
}

export function runRexGenerationAgent(req, fiche) {
  const rootCauses = db.prepare('SELECT * FROM root_causes WHERE fiche_id = ?').all(fiche.id);
  const actions = db.prepare('SELECT * FROM actions WHERE fiche_id = ?').all(fiche.id);
  const corrective = actions.filter((a) => a.action_type === 'corrective');
  const effective = corrective.filter((a) => {
    const ev = db.prepare('SELECT * FROM action_evaluations WHERE action_id = ?').get(a.id);
    return ev?.review_result === 'effective';
  });

  const lessonsLearned = [
    `Problem: ${fiche.title}. ${fiche.description}`,
    rootCauses.length ? `Root cause(s) identified: ${rootCauses.map((rc) => rc.description).join('; ')}.` : '',
    corrective.length ? `Corrective action(s) implemented: ${corrective.map((a) => a.description).join('; ')}.` : '',
    effective.length === corrective.length && corrective.length
      ? 'All corrective actions were verified effective.'
      : 'Some corrective actions still require effectiveness follow-up.',
  ].filter(Boolean).join(' ');

  const response = {
    lessons_learned: lessonsLearned,
    root_cause_summary: rootCauses.map((rc) => rc.description).join('; '),
    solution_summary: corrective.map((a) => a.description).join('; '),
    needs_standardization: effective.length > 0,
    needs_generalization: effective.length > 1,
  };
  logAgent(req, fiche.id, 'REX Generation Agent', fiche.description, { rootCauses, actions }, response, 0.8);
  return response;
}

export function runEvaluationAssistant(req, fiche) {
  const rootCauses = db.prepare('SELECT * FROM root_causes WHERE fiche_id = ?').all(fiche.id);
  const correctiveActions = db.prepare("SELECT * FROM actions WHERE fiche_id = ? AND action_type = 'corrective'").all(fiche.id);
  const orgId = req.user.organizationId;

  const evalStats = db.prepare(`
    SELECT ae.review_result, COUNT(*) c FROM action_evaluations ae
    JOIN actions a ON a.id = ae.action_id
    WHERE a.organization_id = ? AND a.action_type = 'corrective' AND ae.review_result IN ('effective', 'not_effective')
    GROUP BY ae.review_result
  `).all(orgId);
  const effective = evalStats.find((r) => r.review_result === 'effective')?.c || 0;
  const notEffective = evalStats.find((r) => r.review_result === 'not_effective')?.c || 0;
  const sampleSize = effective + notEffective;
  const historicalEffectivenessRate = sampleSize ? Math.round((effective / sampleSize) * 100) : null;

  const suggestions = correctiveActions.map((a) => {
    const rc = rootCauses.find((r) => r.id === a.root_cause_id);
    return `For "${a.description}": verify the specific root cause${rc ? ` ("${rc.description}")` : ''} no longer recurs over the monitoring period before recording "Effective".`;
  });
  if (historicalEffectivenessRate !== null) {
    suggestions.push(`Historical effectiveness rate for corrective actions in this organization: ${historicalEffectivenessRate}% (${effective}/${sampleSize} evaluated).`);
  }

  const response = { suggestions, historicalEffectivenessRate, sampleSize };
  logAgent(req, fiche.id, 'Evaluation Assistant Agent', fiche.description, { rootCauses, correctiveActions }, response, sampleSize > 0 ? 0.6 : 0.4);
  return response;
}

// --- Data Query Agent: "ask about your data", answered strictly within the ---
// --- asking user's own RBAC permissions. Deterministic intent-matching over ---
// --- the tenant's own live data; never a cross-tenant or unscoped query.    ---
const STAGE_KEYWORDS = {
  S1: ['s1', 'detection', 'alert stage'], S2: ['s2', 'understanding', '5w2h'],
  S3: ['s3', 'immediate', 'containment'], S4: ['s4', 'root cause'],
  S5: ['s5', 'corrective action plan'], S6: ['s6', 'evaluation', 'execution'],
  S7: ['s7', 'capitalization', 'rex'],
};

function matchStage(text) {
  for (const [stage, keywords] of Object.entries(STAGE_KEYWORDS)) {
    if (keywords.some((k) => text.includes(k))) return stage;
  }
  return null;
}

const DATA_INTENTS = [
  {
    id: 'open_sheets', permission: 'fiche.view',
    keywords: ['open sheet', 'open ncp', 'open fiche', 'sheets are open', 'how many sheet', 'non-conformities are open', 'open non-conform'],
    run(req) {
      const c = db.prepare("SELECT COUNT(*) c FROM ncp_fiches WHERE organization_id = ? AND status = 'open'").get(req.user.organizationId).c;
      return `There ${c === 1 ? 'is' : 'are'} ${c} open NCP Sheet${c === 1 ? '' : 's'} in your organization.`;
    },
  },
  {
    id: 'closed_sheets', permission: 'fiche.view',
    keywords: ['closed sheet', 'closed ncp', 'closed fiche', 'how many sheets have been closed'],
    run(req) {
      const c = db.prepare("SELECT COUNT(*) c FROM ncp_fiches WHERE organization_id = ? AND status = 'closed'").get(req.user.organizationId).c;
      return `${c} NCP Sheet${c === 1 ? ' has' : 's have'} been closed.`;
    },
  },
  {
    id: 'overdue_actions', permission: 'action.view',
    keywords: ['overdue action', 'late action', 'actions are late', 'behind schedule'],
    run(req) {
      const today = new Date().toISOString().slice(0, 10);
      const rows = db.prepare(`
        SELECT action_number, description FROM actions
        WHERE organization_id = ? AND status != 'done' AND status != 'cancelled' AND planned_completion_date < ?
        ORDER BY planned_completion_date LIMIT 8
      `).all(req.user.organizationId, today);
      if (!rows.length) return 'No overdue actions right now — everything is on schedule.';
      return `${rows.length} overdue action${rows.length === 1 ? '' : 's'}: ` + rows.map((r) => `${r.action_number} (${r.description})`).join('; ') + '.';
    },
  },
  {
    id: 'my_open_actions', permission: 'action.view',
    keywords: ['my action', 'my open action', 'assigned to me', 'actions do i have', 'actions am i responsible'],
    run(req) {
      const rows = db.prepare(`
        SELECT action_number, description FROM actions
        WHERE organization_id = ? AND responsible_owner_id = ? AND status != 'done' AND status != 'cancelled'
        ORDER BY planned_completion_date LIMIT 8
      `).all(req.user.organizationId, req.user.id);
      if (!rows.length) return 'You have no open actions assigned to you.';
      return `You have ${rows.length} open action${rows.length === 1 ? '' : 's'}: ` + rows.map((r) => `${r.action_number} (${r.description})`).join('; ') + '.';
    },
  },
  {
    id: 'unread_alerts', permission: 'alert.view',
    keywords: ['unread alert', 'how many alert', 'new alert', 'notifications do i have'],
    run(req) {
      const c = db.prepare(`
        SELECT COUNT(*) c FROM notification_alerts WHERE organization_id = ? AND target_user_id = ? AND status = 'sent'
      `).get(req.user.organizationId, req.user.id).c;
      return `You have ${c} unread alert${c === 1 ? '' : 's'}.`;
    },
  },
  {
    id: 'kpi', permission: 'report.view',
    keywords: ['kpi', 'closure rate', 'standardization rate', 'generalization rate', 'effectiveness rate'],
    run(req) {
      const orgId = req.user.organizationId;
      const fiches = db.prepare('SELECT * FROM ncp_fiches WHERE organization_id = ?').all(orgId);
      const closed = fiches.filter((f) => f.status === 'closed');
      const rate = fiches.length ? Math.round((closed.length / fiches.length) * 1000) / 10 : 0;
      return `Sheet closure rate (KPI10): ${rate}% (${closed.length} of ${fiches.length} Sheets closed). Open the Reports module for the full KPI set.`;
    },
  },
  {
    id: 'risks', permission: 'riskOpportunity.view',
    keywords: ['open risk', 'high risk', 'how many risk', 'risks do we have', 'risk register'],
    run(req) {
      const rows = db.prepare(`
        SELECT code, title, likelihood, impact FROM risks_opportunities
        WHERE organization_id = ? AND item_type = 'risk' AND status != 'closed' ORDER BY (likelihood * impact) DESC LIMIT 8
      `).all(req.user.organizationId);
      if (!rows.length) return 'No open risks in the register.';
      return `${rows.length} open risk${rows.length === 1 ? '' : 's'}, highest first: ` + rows.map((r) => `${r.code} — ${r.title} (score ${r.likelihood * r.impact})`).join('; ') + '.';
    },
  },
  {
    id: 'controls', permission: 'control.view',
    keywords: ['ineffective control', 'controls need testing', 'how many control', 'controls are effective'],
    run(req) {
      const rows = db.prepare(`
        SELECT code, title FROM controls WHERE organization_id = ? AND effectiveness IN ('ineffective', 'not_tested')
      `).all(req.user.organizationId);
      if (!rows.length) return 'Every control is currently rated Effective or Partially Effective.';
      return `${rows.length} control${rows.length === 1 ? '' : 's'} not confirmed effective: ` + rows.map((r) => `${r.code} — ${r.title}`).join('; ') + '.';
    },
  },
  {
    id: 'business_rules', permission: 'businessRule.view',
    keywords: ['business rule', 'how many rules'],
    run(req) {
      const c = db.prepare("SELECT COUNT(*) c FROM business_rules WHERE organization_id = ? AND is_active = 1").get(req.user.organizationId).c;
      return `${c} active Business Rule${c === 1 ? '' : 's'} are currently enforced.`;
    },
  },
  {
    id: 'ai_use_cases', permission: 'aiUseCase.view',
    keywords: ['ai use case', 'active use case', 'how many use case'],
    run(req) {
      const c = db.prepare("SELECT COUNT(*) c FROM ai_use_cases WHERE organization_id = ? AND is_active = 1").get(req.user.organizationId).c;
      return `${c} active AI Use Case${c === 1 ? '' : 's'} in the library.`;
    },
  },
  {
    id: 'racsi_accountable', permission: 'racsi.view',
    keywords: ['accountable for', 'who is responsible for', 'who owns', 'racsi for'],
    run(req, questionLower) {
      const stage = matchStage(questionLower);
      let activity;
      if (stage) {
        activity = db.prepare(`SELECT * FROM racsi_activities WHERE organization_id = ? AND ncp_stage = ?`).get(req.user.organizationId, stage);
      }
      if (!activity) return 'I could not match that to a specific process step. Try naming a stage, e.g. "who is accountable for S6 evaluation?"';
      const a = db.prepare(`
        SELECT ra.racsi_type, r.name AS role_name, u.first_name, u.last_name FROM racsi_assignments ra
        LEFT JOIN roles r ON r.id = ra.role_id LEFT JOIN users u ON u.id = ra.user_id
        WHERE ra.activity_id = ? AND ra.racsi_type = 'A'
      `).get(activity.id);
      if (!a) return `${activity.title} has no Accountable assigned yet.`;
      const who = a.role_name || `${a.first_name} ${a.last_name}`;
      return `${who} is Accountable for ${activity.title}.`;
    },
  },
];

export function runDataQueryAgent(req, question) {
  const q = String(question || '').toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const intent of DATA_INTENTS) {
    const score = intent.keywords.reduce((s, k) => s + (q.includes(k) ? 1 : 0), 0);
    if (score > bestScore) { best = intent; bestScore = score; }
  }
  let answer;
  let matchedIntent = best?.id || null;
  if (!best) {
    answer = 'I could not match that to a known data query. Try asking about: open sheets, overdue actions, my actions, unread alerts, KPI / closure rate, open risks, controls, business rules, AI use cases, or "who is accountable for <stage>".';
  } else if (!req.user.permissions.has(best.permission)) {
    answer = `I can't answer that — it requires the "${best.permission}" permission, which your role doesn't currently have. Ask an Administrator if you need access.`;
  } else {
    answer = best.run(req, q);
  }
  const response = { answer, matchedIntent };
  logAgent(req, null, 'Data Query Agent', question, { matchedIntent }, response, best ? 0.7 : 0.3);
  return response;
}

// --- Application Feature Query Agent: "ask about the app", grounded in a ---
// --- static FAQ corpus via the same TF-IDF RAG engine used elsewhere.    ---
export function runAppFeatureQueryAgent(req, question, faqEntries) {
  const index = new RagIndex();
  faqEntries.forEach((entry, i) => {
    index.addDocument({ id: String(i), text: `${entry.q} ${entry.a}`, meta: entry });
  });
  const results = index.search(question, { topK: 3 });
  const response = {
    answers: results.map((r) => ({ question: r.meta.q, answer: r.meta.a, score: Number(r.score.toFixed(3)) })),
  };
  logAgent(req, null, 'Application Assistant Agent', question, null, response, results[0]?.score || 0.3);
  return response;
}

/** Monitoring & Alert Agent: scans open work and (re)computes alerts A-J. Safe to call repeatedly (idempotent per day). */
export function runMonitoringAgent(organizationId) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const alerts = [];

  const insertAlert = (type, entityId, targetUserId, message) => {
    const already = db.prepare(`
      SELECT id FROM notification_alerts
      WHERE organization_id = ? AND alert_type = ? AND triggering_entity_id = ? AND date(created_at) = date('now')
    `).get(organizationId, type, entityId);
    if (already) return;
    const id = randomUUID();
    db.prepare(`
      INSERT INTO notification_alerts (id, organization_id, alert_type, triggering_entity_id, target_user_id, channel, message, status, sent_at)
      VALUES (?, ?, ?, ?, ?, 'in_app', ?, 'sent', datetime('now'))
    `).run(id, organizationId, type, entityId, targetUserId, message);
    alerts.push({ id, type, entityId, message });
  };

  // Alert B: immediate action overdue. Alert G: due tomorrow. Alert H: corrective due in 2 days.
  const actions = db.prepare(`SELECT * FROM actions WHERE organization_id = ? AND status != 'done' AND status != 'cancelled'`).all(organizationId);
  for (const a of actions) {
    if (!a.planned_completion_date) continue;
    const due = new Date(a.planned_completion_date);
    const diffDays = Math.floor((due - now) / 86400000);
    if (diffDays < 0) {
      insertAlert(a.action_type === 'immediate' ? 'B' : 'B', a.id, a.responsible_owner_id, `Action ${a.action_number} is overdue.`);
    } else if (diffDays === 1 && a.action_type === 'immediate') {
      insertAlert('G', a.id, a.responsible_owner_id, `Immediate action ${a.action_number} due tomorrow.`);
    } else if (diffDays === 2 && a.action_type === 'corrective') {
      insertAlert('H', a.id, a.responsible_owner_id, `Corrective action ${a.action_number} due in 2 days.`);
    }
  }

  // Alert C / I: evaluation pending or due soon.
  const evals = db.prepare(`
    SELECT ae.*, a.action_number, a.organization_id FROM action_evaluations ae
    JOIN actions a ON a.id = ae.action_id WHERE a.organization_id = ? AND ae.actual_review_date IS NULL
  `).all(organizationId);
  for (const e of evals) {
    if (!e.planned_review_date) continue;
    const due = new Date(e.planned_review_date);
    const diffDays = Math.floor((due - now) / 86400000);
    if (diffDays <= 2) insertAlert(diffDays === 2 ? 'I' : 'C', e.action_id, e.evaluator_owner_id, `Evaluation pending for action ${e.action_number}.`);
  }

  // Alert D: RCA not started 48h after detection with immediate actions done.
  const openFiches = db.prepare(`SELECT * FROM ncp_fiches WHERE organization_id = ? AND status != 'closed'`).all(organizationId);
  for (const f of openFiches) {
    const hoursSince = (now - new Date(f.detection_date)) / 3600000;
    const rootCauseCount = db.prepare('SELECT COUNT(*) c FROM root_causes WHERE fiche_id = ?').get(f.id).c;
    if (hoursSince >= 48 && rootCauseCount === 0) {
      insertAlert('D', f.id, f.detector_id, `Root cause analysis not started for ${f.fiche_number} (48h elapsed).`);
    }
    // Alert J: priority 1 fiche inactive 3+ days.
    const daysSinceUpdate = (now - new Date(f.updated_at)) / 86400000;
    if (f.priority === 1 && daysSinceUpdate >= 3) {
      insertAlert('J', f.id, f.detector_id, `Priority-1 fiche ${f.fiche_number} has had no update for 3+ days.`);
    }
  }

  return alerts;
}
