// Builds the Installation Guide (Word). Run: node build-install.cjs <outDir>; then python3 topdf.py for the PDF.
const path = require('path'); const fs = require('fs');
const B = require('./brand.cjs'); const { D, P, H1, H2, H3, bullet, code, callout, table, shot, cover, tocPage, document, spacer } = B;
const out = process.argv[2] || path.join(__dirname, '../../deliverables');
const S = f => path.join(__dirname, 'shots/en', f + '.png');
let list = 0; const steps = items => { const ref = 'steps' + (list++ || ''); return items.map(t => B.numbered(t, ref)); };
const version = JSON.parse(fs.readFileSync(path.join(__dirname, '../../server/package.json'), 'utf8')).version;
const today = new Date().toISOString().slice(0, 10);

const body = [
  ...cover({ eyebrow: 'Installation Guide', title: 'CortexSkills', subtitle: 'Install, start and run the training engineering platform on your computer', meta: [`Version ${version} · ${today}`, 'Prepared by POWERACT Consulting'], appLogo: path.join(__dirname, '../../web/public/cortexskills-logo.png') }),
  ...tocPage(),

  H1('1. What you need to know first'),
  P('CortexSkills runs on your own computer as two small programs that work together: the server (it keeps the data) and the web application (the screens you use in your browser). You start each one in its own window with three short commands. No database, no internet account and no technical tool other than Node.js is needed.'),
  table(['Item', 'What it is'], [
    ['Node.js 22.13 or newer', 'The free engine that runs CortexSkills. You install it once.'],
    ['server folder', 'Keeps the data (a file named cortexskills.db in server/data), the backups and the attached files.'],
    ['web folder', 'The screens. You open them at http://localhost:5173 in Chrome, Edge, Firefox or Safari.'],
    ['Demonstration data', '58 organizations in 29 sectors, each with two full runs (Digital skills and AI skills), in English, French and Arabic.'],
  ], [2600, 7146]),
  spacer(),
  callout('Time needed', ['About 15 minutes the first time: 5 minutes to install Node.js, 5 minutes for the two installs, 1 minute for the demonstration data.']),

  H1('2. Install Node.js (once)'),
  H2('2.1 Windows and macOS'),
  ...steps(['Open https://nodejs.org in your browser.', 'Click the button marked LTS (the recommended version, 22 or newer) and download the installer.', 'Run the installer and accept the default options until it finishes.', 'Restart your computer if the installer asks you to.']),
  H2('2.2 Linux'),
  P('Install Node.js 22 LTS with your distribution’s package manager or from nodejs.org. Then continue with section 2.3.'),
  H2('2.3 Check the installation'),
  P('Open a terminal window. On Windows: press the Windows key, type PowerShell, press Enter. On macOS: press Cmd + Space, type Terminal, press Enter. Then type:'),
  code('node -v'),
  P('The answer must start with v22.13 or higher (for example v22.14.0). If it shows an older number, install the LTS version again.'),

  H1('3. Unzip the application'),
  ...steps(['Copy the file CortexSkills-app.zip to a folder of your choice, for example Documents.', 'Right-click the file and choose Extract All (Windows) or double-click it (macOS).', 'Open the new CortexSkills folder. You see two folders: server and web, and a README file.']),
  callout('Tip', ['Keep the folder path short and without special characters, for example C:\\CortexSkills or Documents/CortexSkills.'], B.C.light),

  H1('4. Start the server'),
  P('The server must run the whole time you use CortexSkills. Keep its window open.'),
  ...steps(['Open a terminal window (see 2.3).', ['Go to the server folder. Type ', { text: 'cd ', bold: true }, 'followed by a space, drag the server folder onto the window, and press Enter.'], 'Type the three commands below, one at a time, pressing Enter after each and waiting for it to finish.']),
  code('npm install'), code('npm run seed'), code('npm run dev'),
  table(['Command', 'What it does', 'How long'], [
    ['npm install', 'Downloads the components the server needs. You do this only once.', '1–3 minutes'],
    ['npm run seed', 'Creates the demonstration data. It erases any existing data, so run it only the first time or when you want a fresh start.', 'About 1 minute'],
    ['npm run dev', 'Starts the server. You do this every time you want to use CortexSkills.', 'A few seconds'],
  ], [2000, 5746, 2000]),
  spacer(),
  P('When the server is ready, the window shows:'),
  code('CortexSkills API is running on http://localhost:4000  (mode: saas)'),
  code('Now start the web application: open the "web" folder and run "npm run dev".'),

  H1('5. Start the web application'),
  ...steps(['Open a second terminal window. Leave the server window open.', 'Go to the web folder in the same way (cd, then drag the web folder, then Enter).', 'Type the two commands below, one at a time.']),
  code('npm install'), code('npm run dev'),
  P('The window shows a line with Local: http://localhost:5173. Open that address in your browser.'),
  ...shot(S('login'), 'Figure 1 — The sign-in screen at http://localhost:5173'),

  H1('6. Sign in'),
  P('All demonstration accounts use the same password, except the platform administrator.'),
  table(['Who', 'E-mail', 'Password'], [
    ['Platform administrator (all organizations)', 'admin@cortexskills.app', 'Admin#2026'],
    ['Head of L&D, Large company — Automotive', 'headld@atlasmotorskenitra.ma', 'CortexSkills#2026'],
    ['Head of L&D, SME — Automotive', 'headld@tangerautoparts.ma', 'CortexSkills#2026'],
    ['Head of L&D, SME — AEC construction', 'headld@soussbtpsolutions.ma', 'CortexSkills#2026'],
    ['Head of L&D, SME — Healthcare', 'headld@cliniquealamal.ma', 'CortexSkills#2026'],
  ], [3800, 3746, 2200]),
  spacer(),
  P('Every organization has one account per role. The address is the role name followed by @ and the organization’s domain, for example hrd@atlasmotorskenitra.ma (HR Director), analyst@… (L&D Analyst), trainer@…, manager@…, finance@…, compliance@…, auditor@… (read-only). The full list is in Administration › Users when you are signed in as an administrator.'),
  ...shot(S('dashboard'), 'Figure 2 — The dashboard after sign-in'),
  P('Choose your language at the top of the screen (EN, FR, AR). Arabic switches the whole application to right-to-left.'),

  H1('7. Everyday use'),
  table(['I want to…', 'Do this'], [
    ['Stop CortexSkills', 'In each of the two windows, press Ctrl + C. Your data is kept.'],
    ['Start again tomorrow', 'Server window: cd to the server folder, then npm run dev. Web window: cd to the web folder, then npm run dev. Do not run npm run seed again.'],
    ['Go back to the original demonstration data', 'Stop the server, run npm run seed in the server folder, then npm run dev. All your changes are erased.'],
    ['Make a backup now', 'In the server folder: npm run backup. Or sign in as administrator and open Administration › Backups.'],
    ['Use it from another computer on the same network', 'Use the address http://<this computer’s name or IP>:5173 in that computer’s browser.'],
  ], [3000, 6746]),

  H1('8. Backups, licence and AI model'),
  H2('8.1 Backups'),
  P('The server takes a backup automatically once a day and keeps backups for 14 days. Backups are stored in server/data/backups. To restore one: stop the server, copy the backup file over server/data/cortexskills.db, and start the server again. A backup from an earlier version starts without any extra step.'),
  H2('8.2 Licence'),
  P('In the default SaaS mode, each organization has a signed licence record created by the demonstration data. For an on-premises installation, set DEPLOYMENT_MODE=onprem in a file named .env in the server folder; the licence is then read from server/data/license.lic. A new licence file is produced with:'),
  code('npm run sign-licence'),
  P('The administrator can upload a licence file in Administration › Licence. The application warns 30 days before expiry and becomes read-only when the licence has expired.'),
  H2('8.3 AI features'),
  P('All AI features work without internet and without any key: a built-in engine produces the suggestions from the organization’s own records. A user may optionally connect a live language model in Settings › AI model. The key stays in that user’s browser and is sent only with that user’s own requests.'),

  H1('9. Production mode (optional)'),
  P('To run everything from one address, build the screens once and start the server in production mode:'),
  code('cd web'), code('npm run build'), code('cd ../server'), code('npm start'),
  P('Open http://localhost:4000. The server now also serves the screens. Before a real deployment, set a private JWT_SECRET and LICENSE_HMAC_SECRET in server/.env.'),
  table(['Setting (server/.env)', 'Default', 'Purpose'], [
    ['PORT', '4000', 'Port of the server'], ['DEPLOYMENT_MODE', 'saas', 'saas or onprem (licence provider)'], ['DATA_DIR', 'server/data', 'Where the data, backups and attachments are kept'],
    ['JWT_SECRET', 'development value', 'Signs the sign-in tokens — change it in production'], ['BACKUP_RETENTION_DAYS', '14', 'How long backups are kept'], ['CORS_ORIGIN', '*', 'Allowed web addresses'],
  ], [3000, 2400, 4346]),

  H1('10. If something goes wrong'),
  table(['Message or symptom', 'What to do'], [
    ['“CortexSkills needs Node.js 22.13 or newer”', 'Install the LTS version from nodejs.org (section 2), close the window, open a new one and try again.'],
    ['“Port 4000 is already in use”', 'CortexSkills is probably already running in another window. Close it, or start on another port (set PORT=4001 on Windows, export PORT=4001 on macOS/Linux).'],
    ['“The database is empty”', 'Run npm run seed in the server folder, then npm run dev.'],
    ['“npm is not recognized” / “command not found”', 'Node.js is not installed or the window was opened before the installation. Install Node.js, then open a new window.'],
    ['The browser shows “This site can’t be reached”', 'Check that both windows are still open and show no error. The address is http://localhost:5173.'],
    ['Sign-in says “Email or password is incorrect”', 'Check the password (it is case-sensitive). If you changed the data, run npm run seed to restore the demonstration accounts.'],
    ['“Too many attempts”', 'Wait 15 minutes; sign-in is limited to protect accounts.'],
  ], [3600, 6146]),
];

fs.mkdirSync(out, { recursive: true });
const doc = document({ title: 'CortexSkills Installation Guide', credit: 'CortexSkills · Installation Guide', sections: [body] });
D.Packer.toBuffer(doc).then(buf => { const f = path.join(out, 'CortexSkills_Installation_Guide.docx'); fs.writeFileSync(f, buf); console.log('written', f); });
