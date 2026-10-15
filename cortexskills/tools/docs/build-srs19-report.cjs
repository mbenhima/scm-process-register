// Builds the SRS v1.9 conformity report (Word): method, summary by section, automated checks, the review items of
// "CortexSkills in General" with their fix, and the full requirement table. Reads tools/qa/srs-check-results.json
// (node tools/qa/srs-check.mjs). Run: node build-srs19-report.cjs <outDir>; then python3 topdf.py.
const path = require('path'); const fs = require('fs');
const B = require('./brand.cjs'); const { D, C, P, H1, H2, callout, table, cover, tocPage, document, spacer } = B;
const out = process.argv[2] || path.join(__dirname, '../../deliverables');
const R = JSON.parse(fs.readFileSync(path.join(__dirname, '../qa/srs-check-results.json'), 'utf8'));
const version = JSON.parse(fs.readFileSync(path.join(__dirname, '../../server/package.json'), 'utf8')).version;
const today = new Date().toISOString().slice(0, 10);
const fill = s => (s === 'Met' ? C.s5 : s === 'Partial' ? C.s2 : s === 'Not met' ? C.s1 : C.s3);
const n = s => R.rows.filter(r => r.status === s).length;

const REVIEW = [
  ['New project: template chosen from the whole library; order Name, Focus, Description, Template', 'The template list covers own, sector, universal and other templates, grouped; fields in the requested order; library table below.'],
  ['A list’s first click (e.g. “Conforme”) not taken into account', 'Fixed: the form keeps the current values in a reference, so the first choice is saved by the same click.'],
  ['Object label “Jour la note…”; raw “Conforming” in read-only view', 'Object names strip multi-word verbs; read-only views show the option label and dates as dd/mm/yyyy.'],
  ['A Next button after each user task', 'Previous / Next task buttons and “Task N of M” in the task panel; the next owner is notified.'],
  ['MP-53.2 Group yes/no + Organization; MP-53.3 sector; MP-53.4 levels; orientation', 'Typed forms with lists (organizations, sectors, MS/MO/OP multi-choice, All/Digital/AI) and a custom value on every list.'],
  ['“Votre résultat” pre-filled and editable', 'The task result is pre-filled from the step entries and stays editable; a button takes the entries again.'],
  ['“Test on this project” returns “{variables}”', 'Fixed the message parameter; optional variables no longer block the test; the latest project is used when none is given.'],
  ['MP-53.8 stakeholder columns with lists', 'Name, e-mail, phone, role, function, level, site, preferred channel (e-mail/WhatsApp/on-site/hybrid), category, description, owner, source; lists wherever possible. Rows become the questionnaire’s respondents.'],
  ['Document generation with formats and versions; where is RPT-033?', 'MP-53.10 and MP-54.12 generate DT-E2E-32 (RPT-033) and DT-E2E-33 (RPT-034) with versions and DOCX/PDF/XLSX; each task has a Documents tab.'],
  ['MP-54.1 template list; MP-54.2 where are the questions?', 'MP-54.1 chooses one or more templates and creates the questionnaire; MP-54.2 shows every section and question, editable, with AI tailoring and manual questions.'],
  ['Professional French (sector and orientation are two columns)', 'French labels reviewed; sector and orientation are separate fields.'],
  ['MP-54.4 Role + R/A/C/S/I as five columns', 'RACSI table: Role, R, A, C, S, I, sections, comment; exactly one A per section is enforced.'],
  ['MP-54.5 decision level + preferred channels (multi-select)', 'Level (MS/MO/OP/custom), channels (multi-select), population, reminder cadence; respondents’ channel plans follow it.'],
];

const sections = [...new Set(R.rows.map(r => r.section))];
const bySection = sections.map(s => { const rows = R.rows.filter(r => r.section === s); return [s, String(rows.length), String(rows.filter(r => r.status === 'Met').length), String(rows.filter(r => r.status !== 'Met').length)]; });
const body = [];
body.push(...cover({ eyebrow: 'Conformity report', title: 'CortexSkills', subtitle: `Release ${version} against the Standard Application SRS v1.9`, meta: [`Version ${version} · ${today}`, 'Prepared by AI Value'] }));
body.push(...tocPage());
body.push(H1('1. Summary'),
  P(`The SRS v1.9 holds ${R.total} requirements. ${n('Met')} are met, ${n('Partial')} partial, ${n('Not verified')} not verified by an automated check, and ${n('Not met')} not met.`),
  table(['Status', 'Requirements'], [['Met', String(n('Met'))], ['Partial', String(n('Partial'))], ['Not verified', String(n('Not verified'))], ['Not met', String(n('Not met'))]], [6000, 3638], { fills: [[null, C.s5], [null, C.s2], [null, C.s3], [null, C.s1]] }), spacer(),
  callout('Method', [
    'Every requirement of the SRS (extracted to tools/qa/srs-1.9-requirements.json) is traced to the code that implements it: the code cites the requirement number next to its implementation.',
    'Requirements without a citation carry reviewed evidence (tools/qa/srs-evidence.json).',
    'Measurable requirements (tests, languages, Office files, performance) are confirmed by tools/qa/run-checks.mjs; a failed check turns the requirement to Partial.',
    'Reproduce: node tools/qa/run-checks.mjs, then node tools/qa/srs-check.mjs (server running on port 4000).']));
body.push(H1('2. Automated checks'), P('Results of the last run of tools/qa/run-checks.mjs.'),
  table(['Check', 'Result', 'Detail'], (R.checks || []).map(c => [c.id, c.ok ? 'Pass' : 'Fail', c.detail.replace(/\/usr\/\S+ UserWarning:[\s\S]*?lost\."\)/g, '').replace(/\s+/g, ' ')]), [2000, 900, 6738], { size: 16, fills: (R.checks || []).map(c => [null, c.ok ? C.s5 : C.s1, null]) }));
body.push(H1('3. Review items fixed in this release'), P('Items of the review document “CortexSkills in General” and how release 1.13 answers them.'),
  table(['Review item', 'What was done'], REVIEW, [3800, 5838], { size: 17 }));
body.push(H1('4. Requirements not fully met'),
  table(['Requirement', 'Status', 'Note'], R.rows.filter(r => r.status !== 'Met').map(r => [r.id, r.status, r.note || r.text]), [2200, 1300, 6138], { size: 17, fills: R.rows.filter(r => r.status !== 'Met').map(r => [null, fill(r.status), null]) }));
body.push(H1('5. Conformity by section'), table(['Section', 'Requirements', 'Met', 'Other'], bySection, [5800, 1300, 1200, 1338], { size: 16 }));
body.push(H1('6. Requirement traceability'));
for (const s of sections) {
  const rows = R.rows.filter(r => r.section === s);
  body.push(H2(s), table(['Requirement', 'Status', 'Implemented in'], rows.map(r => [r.id, r.status, (r.code || []).slice(0, 3).join(', ') + ((r.code || []).length > 3 ? ` (+${r.code.length - 3})` : '') || (r.note || 'reviewed evidence')]), [2200, 1100, 6338], { size: 15, cantSplit: true, fills: rows.map(r => [null, fill(r.status), null]) }));
}
const doc = document({ title: 'CortexSkills — SRS v1.9 conformity', credit: `CortexSkills ${version} · SRS v1.9 conformity report`, sections: [body], lang: 'en-GB' });
fs.mkdirSync(out, { recursive: true });
const file = path.join(out, 'CortexSkills_SRS_v1_9_Conformity_Report.docx');
D.Packer.toBuffer(doc).then(x => { fs.writeFileSync(file, x); console.log(file, (x.length / 1024).toFixed(0) + ' KB'); });
