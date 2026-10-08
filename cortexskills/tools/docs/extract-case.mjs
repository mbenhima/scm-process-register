// Healthcare full case (public regional hospital, AI skills run, 100 % complete) for the case presentation.
// Reads a running demonstration instance through the API. Usage: node extract-case.mjs [baseUrl] [email]  → case-data.json
import fs from 'node:fs';
const base = (process.argv[2] || 'http://localhost:4000') + '/api';
const email = process.argv[3] || 'headld@chr-sante.ma';
const tok = (await (await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'CortexSkills#2026' }) })).json()).token;
const g = async p => { const r = await fetch(base + p, { headers: { Authorization: 'Bearer ' + tok } }); if (!r.ok) throw new Error(p + ' ' + r.status); return r.json(); };
const me = await g('/me');
const projects = await g('/projects'); const p = projects.find(x => x.focus === 'AI');
const ws = await g('/projects/' + p.id + '/workspace');
const ENT = ['ScopeOfWork', 'ScopeCriterion', 'Stakeholder', 'StrategicObjective', 'Questionnaire', 'QuestionnaireResponse', 'DiagnosticAssessment', 'MaturityAssessment', 'PerformanceAssessment',
  'FunctionalSwot', 'ImprovementAxis', 'SkillAssessment', 'SkillGap', 'TrainingNeed', 'TrainingDemand', 'TrainingTheme', 'TrainingEngineeringReport', 'Roadmap', 'RoadmapInitiative', 'TrainingPlan',
  'TrainingProgram', 'BudgetLine', 'LearningPath', 'LearningModule', 'Session', 'Enrollment', 'Evaluation', 'Certification', 'RexEntry', 'Action', 'Employee', 'WbsNode'];
const records = {};
for (const e of ENT) { try { const r = await g(`/records/${e}?project=${p.id}&limit=1000`); records[e] = r.items || r; } catch { records[e] = []; } }
const docs = await g('/projects/' + p.id + '/documents');
const full = {};
for (const lang of ['en', 'fr']) {
  full[lang] = {};
  const mine = docs.filter(d => d.lang === lang && d.status === 'Published');
  for (const d of mine) { if (full[lang][d.doc_type]) continue; const x = await g('/documents/' + d.id); full[lang][d.doc_type] = { title: x.title, e2e: x.e2e_id, version: x.versionLabel, author: x.author, approver: x.approver, published: x.published_at, sections: x.model?.sections || [], sources: x.sources || [] }; }
}
const out = { generatedAt: new Date().toISOString(), org: me.org, user: me.user, project: p, workspace: ws, records, documents: full };
fs.writeFileSync(new URL('./case-data.json', import.meta.url), JSON.stringify(out));
console.log('case-data.json', Object.keys(full.en).length, 'documents EN,', Object.keys(full.fr).length, 'FR;', Object.entries(records).map(([k, v]) => `${k}:${v.length}`).join(' '));
