// Builds the User Guide (Word) from guide-data.json (produced by extract.mjs from a seeded instance).
// Run: node build-user.cjs <outDir>; then python3 topdf.py for the PDF.
const path = require('path'); const fs = require('fs');
const B = require('./brand.cjs'); const { D, C, P, H1, H2, H3, bullet, callout, table, shot, cover, tocPage, document, spacer, run } = B;
const out = process.argv[2] || path.join(__dirname, '../../deliverables');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'guide-data.json'), 'utf8'));
const S = f => path.join(__dirname, 'shots/en', f + '.png');
const en = x => (x && typeof x === 'object' ? x.en ?? '' : x ?? '');
let list = 0; const steps = items => { const ref = 'steps' + (list++ % 40 || ''); return items.map(t => B.numbered(t, ref)); };
const version = JSON.parse(fs.readFileSync(path.join(__dirname, '../../server/package.json'), 'utf8')).version;
const today = new Date().toISOString().slice(0, 10);
const ROLE_LOCAL = Object.fromEntries([...fs.readFileSync(path.join(__dirname, '../../server/seed/tenants.js'), 'utf8').match(/ROLE_LOCAL = \{([^}]+)\}/)[1].matchAll(/'(R-\d+)': '(\w+)'/g)].map(m => [m[1], m[2]]));

const body = [];
body.push(...cover({ eyebrow: 'User Guide', title: 'CortexSkills', subtitle: 'What to do and what to type, task by task, for large companies and SMEs', meta: [`Version ${version} · ${today}`, 'Prepared by POWERACT Consulting'], appLogo: path.join(__dirname, '../../web/public/cortexskills-logo.png') }));
body.push(...tocPage());

// ---------------------------------------------------------------- 1. About this guide
body.push(H1('1. About this guide'),
  P('CortexSkills guides a training engineering engagement from its scope to the evaluation of its results: 33 end-to-end processes, grouped into seven phases, each made of user tasks and steps. This guide tells you where to click and, for every task, exactly what to type. The examples come from the demonstration data, so you can follow them on screen.'),
  P('Parts 6 to 9 each follow one type of organization from start to finish:'),
  table(['Part', 'Audience', 'Example organization used', 'Sign in as'], data.audiences.map((a, i) => [`${6 + i}`, en(a.title), `${en(a.org.name)} — ${en(a.org.sectorName)}, ${a.org.segment === 'SME' ? 'SME' : 'large company'}`, a.org.login]), [700, 3000, 3600, 2446]),
  spacer(),
  P('Every organization has two full runs: a Digital skills run and an AI skills run. Both follow the same tasks; the task tables show what to type in the Digital run and, where the text differs, what to type in the AI run.'),
  H2('How to read a task table'),
  table(['Column', 'Meaning'], [
    ['Task', 'The task code (UFT-xx-yy), its name, and the role that does it (R = Responsible).'],
    ['Steps', 'The steps you tick inside the task, with their codes. They come from the process design.'],
    ['What to type', 'The text to enter in the task’s result box. The same text is shown in the application in the “What to type” panel.'],
  ], [2200, 7546]),
  spacer(),
  callout('Password for every demonstration account', ['CortexSkills#2026 — except the platform administrator: admin@cortexskills.app / Admin#2026.']),
);

// ---------------------------------------------------------------- 2. Getting around
body.push(H1('2. Getting around the application'),
  P('After you sign in, the screen has three parts: the menu on the side, the header at the top and the work area in the middle.'),
  ...shot(S('dashboard'), 'Figure 1 — Dashboard of a large company (Head of L&D)'),
  H2('2.1 The header'),
  table(['Element', 'What it does'], [
    ['Organization selector', 'Chooses the organization you work in. Only the platform administrator sees every organization; Group members can read sister organizations.'],
    ['Project selector', 'Limits every screen to one project (run), or shows all projects.'],
    ['EN · FR · AR', 'Changes the language at once. Arabic turns the whole application right-to-left. Your choice is remembered.'],
    ['Bell', 'Opens your alerts. The number shows unread alerts.'],
    ['Speech bubble', 'Opens the AI Assistant from any screen.'],
    ['Person icon', 'Your settings and sign-out.'],
  ], [2600, 7146]),
  H2('2.2 The menu'),
  P('The menu is grouped by what you do: Home, Portfolio, Process design, Governance & risk, AI & knowledge, Reports, Administration and Settings. You only see what your role allows.'),
  bullet('Click the star next to a screen to add it to Favorites, at the top of the menu.'),
  bullet('Click the pin to keep the menu open, or unpin it: it then slides in when you point at the edge.'),
  bullet('In Settings you can dock the menu on the left, right, top or bottom.'),
  H2('2.3 Roles and accounts'),
  P('Each organization has one demonstration account per role. The e-mail address is the name in the second column followed by @ and the organization’s domain (for example hrd@atlasmotorskenitra.ma). SMEs have a smaller set of roles.'),
  table(['Role', 'E-mail name', 'Role', 'E-mail name'], (() => { const r = data.roles.filter(x => ROLE_LOCAL[x.id]); const half = Math.ceil(r.length / 2); return Array.from({ length: half }, (_, i) => [en(r[i].name), ROLE_LOCAL[r[i].id], r[i + half] ? en(r[i + half].name) : '', r[i + half] ? ROLE_LOCAL[r[i + half].id] : '']); })(), [3100, 1773, 3100, 1773]),
);

// ---------------------------------------------------------------- 3. Tenancy and projects
const dm = data.decisionMatrix;
const LEVEL_TEXT = ['Routine, well known, little at stake', 'Some new elements, limited stakes', 'Noticeable change, several functions involved', 'Major change, significant stakes or constraints', 'Transformational, strong constraints, high risk'];
body.push(H1('3. Start from the tenancy: Group, Organization, Project'),
  P('Everything in CortexSkills belongs to an organization, and optionally to a Group of organizations. Always start here: choose or create the Group (Yes or No), then the Organization, then the project.'),
  ...shot(S('tenancy'), 'Figure 2 — Portfolio › Groups and organizations: the tenancy tree and table'),
  H2('3.1 Create a Group and an Organization (administrator)'),
  ...steps(['Sign in as admin@cortexskills.app and open Portfolio › Groups and organizations.', 'Group: click New group, type the name (for example “Atlas Industrial Holding”) and save. If the organization is independent, skip this step: its Group is “No”.', 'Click New organization. Type the name, choose the sector, the segment (Large or SME), the number of employees, the country, the default language and the e-mail domain (for example atlasmotorskenitra.ma).', 'Choose the Group, or No group. Tick “Create a starting team” to receive one account per role under that domain.', 'Save. The organization receives its structure (OBS), governance catalog, AI use cases, checklists and templates.']),
  H2('3.2 Create a project'),
  P('Open Portfolio › New project. There are three ways to create it, on the same screen:'),
  table(['Mode', 'When to use it', 'What you do'], [
    ['From the catalog', 'The usual case', 'Pick a published template that matches your sector, mode and track. Its phases, gates, checklists and roles are copied into the project.'],
    ['Manual', 'A very specific engagement', 'Type the project, choose sector, mode and track, and build the phases by attaching gates and checklists.'],
    ['With AI', 'You have a short description', 'Type two or three sentences (for example “Digital skills plan for the maintenance team, two sites, quality audit next year”). The AI proposes the fields, scores, mode, track, template, phases, gates and checklists; accept, change or reject each item, then save.'],
  ], [2000, 2400, 5346]),
  spacer(),
  ...shot(S('newproject'), 'Figure 3 — Portfolio › New project: the three creation modes and the complexity score'),
  H2('3.3 The complexity score (decision matrix)'),
  P('In every mode you rate the project from 1 to 5 on seven weighted criteria. The score (0–100) recommends the mode: 70 and above → Full mode; below 70 → SME mode, with the SME track that matches the score. You can change the track only with a written justification, which is recorded.'),
  table(['Criterion', 'Weight', ...dm.levels.map(en)], dm.criteria.map(c => [en(c.name), c.weight + '%', ...LEVEL_TEXT]), [1700, 800, 1449, 1449, 1449, 1449, 1450], { size: 16 }),
  spacer(),
  table(['Score', 'Recommended mode and track'], [['70 – 100', 'Full mode: all phases and gates G1 to G5'], ['50 – 69', 'SME mode, track T3 (extended)'], ['30 – 49', 'SME mode, track T2 (standard)'], ['0 – 29', 'SME mode, track T1 (essential)']], [2000, 7746]),
);

// ---------------------------------------------------------------- 4. Working a task
body.push(H1('4. Working on a task'),
  P('A project is made of end-to-end processes (E2E), each with user tasks. You find your tasks in Home › My tasks, or through the project: Portfolio › Projects › your project › the process › the task.'),
  ...shot(S('ws'), 'Figure 4 — A project workspace: phases, processes, progress and gates'),
  H2('4.1 Complete a task'),
  ...steps(['Open the task. A panel opens on the side with four tabs: Work, RACSI, Files and History.', 'Read the “What to type” box: it shows the expected answer for this task. Parts 6 to 9 of this guide list it for every task.', 'If the task is Not started, click Start.', 'Tick each step as you do it.', 'Type your result in “Your result”. You can use the AI help (below).', 'Attach evidence in the Files tab if needed (documents, spreadsheets, images, drawings, archives…).', 'Click Complete. A task cannot be completed before the previous task of the same process, or while the gate of the previous phase has open mandatory items.', 'A window proposes to record a lesson learned (REX): click Fill now, or Skip.']),
  ...shot(S('task'), 'Figure 5 — The task panel with “What to type”, steps, result, owner and evaluator'),
  H2('4.2 AI help'),
  P('When an AI use case is linked to the task, an “AI help” box appears. Click the use case: the suggestion is labelled as AI-generated with its confidence and sources. Click Accept to copy it into your result, Edit then accept to change it first, or Reject. Every choice is logged. The owner and the evaluator of a task are always two different people.'),
  H2('4.3 Gates and checklists'),
  P('Each phase ends with a gate. Its checklist items must be ticked (with evidence when required) before the next phase can start. The gate owner then records a decision: Go, No-Go, Hold or Recycle.'),
  table(['Gate', 'Purpose'], data.gates.map(g => [en(g.name), en(g.purpose)]), [3400, 6346]),
  H2('4.4 Reopen a task'),
  P('A completed task can be reopened with a written justification, until the gate of its phase has been submitted. The reopening is recorded in the audit log.'),
);

// ---------------------------------------------------------------- 5. Following progress
body.push(H1('5. Following progress'),
  table(['Screen', 'Where', 'What you see'], [
    ['Dashboard', 'Home › Dashboard', 'Completion, overdue tasks, alerts, response rate, progress by phase, KPI health.'],
    ['My tasks', 'Home › My tasks', 'Your open tasks, with due dates, sorted by urgency.'],
    ['Alerts', 'Home › Alerts (bell)', 'Overdue steps, red KPIs, licence and quota warnings. Mark as read or dismiss.'],
    ['Portfolio view', 'Portfolio › Portfolio view', 'One row per project, one column per phase, with the status of each cell.'],
    ['WBS and Gantt', 'Project › WBS and Gantt', 'Phases, processes and tasks on one timeline. Print or save as PDF.'],
    ['Reports', 'Reports', 'Standard reports, exported to PDF, Excel or Word.'],
    ['AI Assistant', 'Speech bubble / Home › AI Assistant', 'Ask questions such as “How many tasks are overdue?” or “How do I export a report?”.'],
    ['Benchmark', 'Reports › Benchmark', 'Compare projects inside your organization, or organizations of your Group (aggregates only).'],
  ], [1900, 2700, 5146]),
  ...shot(S('gantt'), 'Figure 6 — WBS and Gantt of a full run'),
  ...shot(S('reports'), 'Figure 7 — Reports: choose a report, a project and a format'),
  ...shot(S('assistant'), 'Figure 8 — The AI Assistant answers from your own data, within your permissions'),
);

// ---------------------------------------------------------------- 6–9. Audience parts
const same = (a, b) => (a || '').trim() === (b || '').trim();
data.audiences.forEach((a, ai) => {
  const n = 6 + ai; const dig = a.runs.Digital, ai_ = a.runs.AI;
  const aiIndex = {}; ai_.phases.forEach(ph => ph.e2es.forEach(e => e.tasks.forEach(t => { aiIndex[e.id + '|' + t.uft] = en(t.guidance); })));
  const totalTasks = dig.phases.reduce((s, p) => s + p.e2es.reduce((q, e) => q + e.tasks.length, 0), 0);
  body.push(H1(`${n}. ${en(a.title)}`),
    P(`This part follows ${en(a.org.name)}, a ${a.org.segment === 'SME' ? 'SME' : 'large company'} in the ${en(a.org.sectorName)} sector (${a.org.employees} employees, ${a.org.city}${a.org.group ? ', member of ' + en(a.org.group) : ', independent'}). Sign in as ${a.org.login}. The same steps apply to any organization of this type: replace the names, figures and themes with your own.`),
    table(['Item', 'Digital skills run', 'AI skills run'], [
      ['Project', en(dig.name), en(ai_.name)],
      ['Mode and track', `${dig.mode}${dig.track ? ' · ' + dig.track : ''}`, `${ai_.mode}${ai_.track ? ' · ' + ai_.track : ''}`],
      ['Processes and tasks', `${dig.phases.reduce((s, p) => s + p.e2es.length, 0)} processes · ${totalTasks} tasks`, `${ai_.phases.reduce((s, p) => s + p.e2es.length, 0)} processes · ${ai_.phases.reduce((s, p) => s + p.e2es.reduce((q, e) => q + e.tasks.length, 0), 0)} tasks`],
    ], [2600, 3573, 3573]),
    spacer(),
    table(['Phase', 'Gate', 'End-to-end processes'], dig.phases.map(ph => [en(ph.name), ph.gate || '—', ph.e2es.map(e => e.id).join(', ')]), [3200, 900, 5646]),
  );
  if (a.key === 'sme') body.push(...shot(S('sme_ws'), `Figure — Workspace of the SME Digital run (${en(a.org.name)})`));
  dig.phases.forEach(ph => {
    body.push(H2(`${n}.${ph.no + 1} ${en(ph.name)}${ph.gate ? ' — gate ' + ph.gate : ''}`));
    ph.e2es.forEach(e => {
      body.push(H3(`${e.id} · ${en(e.name)}`),
        P([{ text: 'Goal: ', bold: true, color: C.dark }, en(e.goal) + '. ', { text: 'Starts when: ', bold: true, color: C.dark }, en(e.trigger) + ' ', { text: 'Ends when: ', bold: true, color: C.dark }, en(e.terminal)], { size: 21, after: 80 }),
        table(['Task', 'Steps', 'What to type'], e.tasks.map(t => {
          const g = en(t.guidance), gAi = aiIndex[e.id + '|' + t.uft];
          const what = [new D.Paragraph({ spacing: { after: 30 }, children: [run(g, { size: 18 })] })];
          if (gAi && !same(g, gAi)) what.push(new D.Paragraph({ spacing: { after: 20 }, children: [run('AI run: ', { size: 18, bold: true, color: C.dark }), run(gAi, { size: 18 })] }));
          return [
            [new D.Paragraph({ spacing: { after: 20 }, children: [run(t.uft, { size: 18, bold: true, color: C.dark })] }), new D.Paragraph({ spacing: { after: 20 }, children: [run(en(t.name), { size: 18 })] }), new D.Paragraph({ children: [run('R: ' + (t.racsi?.R || '—'), { size: 16, color: C.medium })] })],
            t.steps.map(s => new D.Paragraph({ spacing: { after: 20 }, children: [run(s.id + ' ', { size: 16, bold: true, color: C.dark }), run(en(s.name), { size: 16 })] })),
            what,
          ];
        }), [2300, 2700, 4746], { cantSplit: true }),
      );
    });
  });
});

// ---------------------------------------------------------------- 10. Administration
body.push(H1('10. Administration'),
  table(['Task', 'Where', 'What to type or choose'], [
    ['Add a user', 'Administration › Users › New user', 'Name, e-mail in the organization’s domain, one or more roles, language. The licence limits the number of active users.'],
    ['Change what a role can do', 'Administration › Permissions', 'Tick or untick a permission for a role. The change applies at once.'],
    ['Choose the solution pack and add-ons', 'Administration › Configuration', 'Pick the pack; switch add-ons on or off. Quotas are shown with their current use.'],
    ['Activate a compliance standard', 'Administration › Configuration › Compliance', 'Read and acknowledge the notice (activation is not a certification), then activate. Controls are created once.'],
    ['Upload a licence', 'Administration › Configuration › Licence', 'Choose the .lic file. The signature and expiry date are checked.'],
    ['Back up now', 'Administration › Backups', 'Click Back up now. Backups are kept 14 days.'],
    ['Read the audit log', 'Administration › Audit log', 'Filter by record, user or date. The log cannot be edited.'],
    ['Check requirement coverage', 'Administration › Traceability', 'Each requirement of the standard with its status and evidence.'],
  ], [2600, 3000, 4146]),
  ...shot(S('config'), 'Figure — Administration › Configuration: pack, add-ons, quotas and licence'),
);
// Appendix: status colours
body.push(H1('Appendix — Status colours'),
  P('Statuses use the same colours everywhere, from red (worst) to green (best):'),
  table(['Colour', 'Meaning in tasks', 'Meaning in KPIs'], [['Red', 'Blocked / overdue', 'Off target'], ['Amber', 'In progress', 'Watch'], ['Yellow', 'Waiting at a gate', '—'], ['Green', 'Completed', 'On target'], ['Dark green', 'Approved / signed off', 'Above target']], [2000, 3873, 3873],
    { fills: [[C.s1], [C.s2], [C.s3], [C.s4], [C.s5]] }),
);

fs.mkdirSync(out, { recursive: true });
const doc = document({ title: 'CortexSkills User Guide', credit: 'CortexSkills · User Guide', sections: [body] });
D.Packer.toBuffer(doc).then(buf => { const f = path.join(out, 'CortexSkills_User_Guide.docx'); fs.writeFileSync(f, buf); console.log('written', f, Math.round(buf.length / 1024) + ' KB'); });
