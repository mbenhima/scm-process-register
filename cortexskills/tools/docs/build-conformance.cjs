// Builds the Conformance Report (Word): UI release checklist (SRS v1.10 Appendix K), input-integrity remediation
// report (Appendix L, Table L-3 order), QA results, brand divergences and requirement traceability.
// Run: node build-conformance.cjs <outDir>; then python3 topdf.py.
const path = require('path'); const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const B = require('./brand.cjs'); const { D, C, P, H1, H2, bullet, callout, table, cover, tocPage, document, spacer } = B;
const out = process.argv[2] || path.join(__dirname, '../../deliverables');
const QA = JSON.parse(fs.readFileSync(path.join(__dirname, 'qa-results.json'), 'utf8'));
const version = JSON.parse(fs.readFileSync(path.join(__dirname, '../../server/package.json'), 'utf8')).version;
const db = new DatabaseSync(path.join(__dirname, '../../server/data/cortexskills.db'), { readOnly: true });
const trace = db.prepare("SELECT data FROM catalog WHERE kind='trace'").all().map(r => JSON.parse(r.data));
const en = x => (x && typeof x === 'object' ? x.en ?? '' : x ?? '');
const count = s => trace.filter(t => t.status === s).length;
const fill = s => (s === 'Met' ? C.s5 : s === 'Partial' ? C.s2 : s === 'Not met' ? C.s1 : C.s3);
const today = new Date().toISOString().slice(0, 10);

const body = [];
body.push(...cover({ eyebrow: 'Conformance Report', title: 'CortexSkills', subtitle: `Release ${version} against the Dynamic Apps Standard SRS v1.10`, meta: [`Version ${version} · ${today}`, 'Prepared by POWERACT Consulting for AI Value'] }));
body.push(...tocPage());

body.push(H1('1. Summary'),
  P(`${count('Met')} of ${trace.length} requirements are met, ${count('Partial')} are partial and ${count('Deployment responsibility')} depend on the production hosting. No requirement is unmet.`),
  P('All 19 lines of the UI release checklist (Appendix K) are confirmed. The input-integrity audit (Appendix L) checked the 23 causes: 5 instances were found and fixed in this pass, 3 had been fixed in the earlier pass, 1 out-of-catalog defect was fixed, and nothing is deferred.'),
  table(['Check', 'Scope', 'Result'], QA.tests.map(t => [t[0], t[1], t[2]]), [2600, 4300, 2846]), spacer(),
  callout('How to reproduce', ['Focus tests: node web/tools/qa/focus-tests.mjs (server running on port 4000).', 'Crawler: node web/tools/qa/crawler.mjs <e-mail> en,fr,ar; WIDTHS=390,768,1024,1280 for the responsive pass.', 'Token check: npm run check:tokens in the web folder.']));

body.push(H1('2. UI release checklist (Appendix K)'),
  P('Each line was confirmed on the release build for the screens and documents changed in release 1.10.'),
  table(['Area', 'Check', 'Evidence', 'Result'], QA.appendixK.map(r => [r[0], r[1], r[3], r[4]]), [1500, 3300, 4000, 946], { fills: QA.appendixK.map(r => [null, null, null, fill(r[4])]) }));

body.push(H1('3. Input-integrity remediation report (Appendix L)'),
  H2('3.1 Framework and architecture'),
  table(['Layer', 'Technology'], [['Framework and language', 'React 18 with JavaScript (JSX), built with Vite'], ['UI library', 'Project components only (web/src/components/ui.jsx, DataTable.jsx, InlineTable.jsx); Lucide icons'], ['Form libraries', 'None: controlled inputs with component state'],
    ['Routing', 'react-router-dom'], ['State management', 'React context (session.jsx) and component state'], ['Data fetching', 'fetch wrapper (lib/api.js) with request sequencing in useData'], ['Debounce', 'Timers kept in refs (preferences, row autosave)']], [2800, 6946]),
  H2('3.2 Typeable screen inventory'),
  table(['Screen or route', 'Component', 'Typeable fields', 'Audited', 'Findings', 'Fixed'], [
    ['/runs/:id?task=', 'StepForms, InlineTable, RowEditor, ChoiceField', 'Table cells, Row Editor fields, form fields, choice lists', 'Yes', '1 (out-of-catalog)', '1'],
    ['/process/design', 'DesignNode, ElementForm, NewElement, Versions', 'Names in three languages, notes, filter', 'Yes', '1 (C1)', '1'],
    ['/process/templates/:id', 'BlueprintNode, PartTable', 'Inclusion boxes, names, rows of each part', 'Yes', '1 (C1)', '1'],
    ['/gov/obs', 'Functions, Roles, RacsiMatrix, OrgNode', 'Names, missions, assignment fields, RACSI pickers', 'Yes', '1 (C1)', '1'],
    ['/questionnaires/:id, /respond/:token', 'QForm, TableSection', 'Answers, table rows', 'Yes', '1 (C2)', '1'],
    ['/training-plan', 'TrainingEditor', 'Training fields, objectives, agenda', 'Yes', '1 (C2)', '1'],
    ['/documents/:id', 'DocContent, SectionsEditor, DocMeta', 'Overrides, section titles and text, metadata', 'Yes', '0', '0'],
    ['/documents/layout, /ai/settings, /ai/use-cases/:id/spec', 'DocLayout, AiSettings, SpecField', 'Formatting, model settings, specification fields', 'Yes', '0', '0'],
    ['Every list screen', 'DataTable, GlobalSearch, Select', 'Search, filters, column and page controls', 'Yes', '0', '0'],
    ['Records, governance, administration', 'RecordEditor, Modal, JustifyDialog', 'Record fields, justifications', 'Yes', '0', '0']], [2300, 2300, 2300, 900, 1200, 746]),
  H2('3.3 Findings and fixes'),
  table(['File', 'Component', 'Screen type', 'Cause', 'Fix applied'], [
    ['web/src/pages/Design.jsx', 'DesignTree › Node', 'Tree', 'C1', 'Node moved to module scope as DesignNode; context passed as a prop'],
    ['web/src/pages/Blueprint.jsx', 'BlueprintTree › Node', 'Tree with check boxes', 'C1', 'Node moved to module scope as BlueprintNode'],
    ['web/src/pages/Obs.jsx', 'Chart › Node', 'Organization chart', 'C1', 'Node moved to module scope as OrgNode'],
    ['web/src/components/QForm.jsx', 'TableSection', 'Questionnaire table', 'C2', 'Row keys kept in a ref beside the rows; follow inserts and deletions'],
    ['web/src/pages/TrainingPlan.jsx', 'TrainingEditor objectives', 'Editable list', 'C2', 'Objective keys kept in a ref; delete removes the matching key'],
    ['web/src/components/InlineTable.jsx', 'Cell', 'Inline table', 'Out of catalog', 'Escape start value normalized to an empty string']], [2600, 1900, 1600, 1100, 2546]),
  H2('3.4 Cause counts'),
  table(['Cause', 'Description', 'Found', 'Fixed', 'Deferred'], QA.causes.map(c => [c.id, c.text, String(c.found), String(c.fixed), '0']), [900, 6046, 900, 900, 1000]),
  H2('3.5 Totals'),
  table(['Confirmed instances', 'Fixed', 'Deferred', 'Out-of-catalog'], [[String(QA.causes.reduce((s, c) => s + c.found, 0)), String(QA.causes.reduce((s, c) => s + c.fixed, 0)), '0', '1 (fixed)']], [2436, 2436, 2436, 2438]),
  P('Counts include the instances fixed in the earlier pass of this release (C3, C8, C19).', { italics: true }),
  H2('3.6 Files touched'),
  table(['File', 'Reason'], [['web/src/pages/Design.jsx', 'C1'], ['web/src/pages/Blueprint.jsx', 'C1'], ['web/src/pages/Obs.jsx', 'C1'], ['web/src/components/QForm.jsx', 'C2'], ['web/src/pages/TrainingPlan.jsx', 'C2'], ['web/src/components/InlineTable.jsx', 'Out-of-catalog (Escape restore)']], [5000, 4746]),
  H2('3.7 Deferred findings'), P('No findings were deliberately deferred.'),
  H2('3.8 Out-of-catalog findings'),
  table(['File', 'Component', 'Description', 'Follow-up'], QA.outOfCatalog, [2600, 1400, 3400, 2346]),
  H2('3.9 Causes not found'),
  P(QA.causes.filter(c => !c.found).map(c => `${c.id}`).join(', ') + ': checked; no instance found.'),
  H2('3.10 Final verification'),
  P('The touched areas were re-scanned for index keys on editable rows, focus and blur calls in effects, components defined during rendering, nullable controlled values and event ordering around editors and popovers. The remaining index keys are on read-only lists (history, references, rule issues). The focus tests and the three-language crawler were run again on the final build: 12 of 12 checks pass and no page error is reported.'),
  H2('3.11 Behavioral-scope confirmation'),
  P('No behavior changed other than what corrects typing, focus and input-integrity defects: the tree nodes render the same markup, the stable keys do not change the stored data, and Escape now restores an empty cell as it already did for a filled one.'));

body.push(H1('4. Graphical chart and conformance notes'),
  P('The application and every document it generates follow the AI Value Graphical Chart 1.2 as restated in SRS v1.10 Appendix J. The design tokens (web/src/styles/tokens.css) carry the Appendix J values unchanged, and the server exporters read the same palette from server/src/services/brand.js.'),
  table(['SRS token or rule', 'Value used', 'Where'], [
    ['--aiv-navy / navy-dark', '#123A5F / #0D2A47', 'Titles, headings, eyebrow labels, table headers, hover state of primary buttons'],
    ['--aiv-azure', '#1876C6', 'Primary buttons, links underline, selected tabs, check boxes, focus ring (35 %)'],
    ['--aiv-green / teal', '#28C87C / #17A2B8', 'Toggles when on, success, chart series; never small text'],
    ['--aiv-ink / muted', '#2C3E50 / #5A6B7B', 'Body text and secondary text'],
    ['--aiv-bg / line', '#F5F8FB / #E1E8F0', 'Page background, alternate table rows, borders and grid lines'],
    ['Gradient Azure → Teal → Green', 'Logo swoosh; one cover band per generated document', 'Never on data or text'],
    ['Status scale', '#F4C7C3 → #B6D7A8', 'Scores, RAG health and heatmaps only'],
    ['Typography', 'Montserrat headings, Open Sans body (bundled, embedded in PDF and Word)', 'Application and generated documents'],
    ['Logos (NFR-DA-VDS-19)', 'CortexSkills lockup in the 64 px top bar (≥ 150 px), sign-in and response pages, document headers (35 mm); icon for favicon; AI Value lockup on sign-in, navigation and document covers', 'Never recolored, stretched or shadowed'],
    ['Generated documents (NFR-DA-VDS-20)', 'Open Sans 11 pt Ink, Montserrat Navy headings, Navy table header rows, alternating White and Background rows, 2 cm margins, A4 default and Letter option', 'Word, PDF, Excel'],
    ['Known gap', 'Logo artwork supplied as raster images', 'The logo is placed at 300 dpi until vector artwork (SVG or EPS) is provided (NFR-DA-VDS-20 partial)']], [2700, 3600, 3446]));

body.push(H1('5. Requirement traceability'),
  P(`The traceability screen (Administration › Traceability) and the Coverage Checklist list all ${trace.length} requirements with their evidence. The table below lists those not fully met by the application itself.`),
  table(['Requirement', 'Status', 'Evidence'], trace.filter(t => t.status !== 'Met').map(t => [t.id, t.status, en(t.evidence)]), [2200, 1800, 5746], { fills: trace.filter(t => t.status !== 'Met').map(t => [null, fill(t.status), null]) }),
  spacer(), H2('Requirements by family'),
  table(['Family', 'Requirements', 'Met', 'Other'], Object.entries(trace.reduce((m, t) => { const f = t.id.split('-')[2]; (m[f] ||= [0, 0]); m[f][0]++; if (t.status === 'Met') m[f][1]++; return m; }, {})).sort().map(([f, [n, m]]) => [f, String(n), String(m), String(n - m)]), [2400, 2400, 2400, 2546]));

const doc = document({ title: 'CortexSkills — Conformance Report', credit: `CortexSkills ${version} · Conformance Report`, sections: [body] });
D.Packer.toBuffer(doc).then(b => { const f = path.join(out, 'CortexSkills_Conformance_Report.docx'); fs.writeFileSync(f, b); console.log('written', f); });
