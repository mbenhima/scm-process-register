// Screenshot album (Word): one captioned screen per page, from a folder written by tools/qa/shoot-pack.mjs.
// Run: node build-album.cjs <packDir> <en|fr> <orgName> <outFile.docx>; then topdf.py for the PDF.
const path = require('path'); const fs = require('fs');
const B = require('./brand.cjs'); const { D, P, H1, H2, shot, cover, tocPage, document, table, spacer, callout } = B;
const [dir, lang, orgName, outFile] = process.argv.slice(2);
const fr = lang === 'fr'; const t = (en, f) => (fr ? f : en);
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
const version = JSON.parse(fs.readFileSync(path.join(__dirname, '../../server/package.json'), 'utf8')).version;
const today = new Date().toISOString().slice(0, 10);
const GROUPS = [
  [t('Sign-in and home', 'Connexion et accueil'), p => p === '/login' || ['/', '/my-tasks', '/alerts', '/assistant'].includes(p)],
  [t('Portfolio and projects', 'Portefeuille et projets'), p => /^\/(tenancy|projects|runs|portfolio|modules|records|questionnaires|training-plan)/.test(p)],
  [t('Process design', 'Conception des processus'), p => p.startsWith('/process')],
  [t('Governance', 'Gouvernance'), p => p.startsWith('/gov') || p === '/registers'],
  [t('Artificial intelligence', 'Intelligence artificielle'), p => p.startsWith('/ai')],
  [t('Reports and documents', 'Rapports et documents'), p => p.startsWith('/reports') || p.startsWith('/documents') || p === '/benchmark'],
  [t('Administration', 'Administration'), p => p.startsWith('/admin')],
  [t('Settings, help and profile', 'Paramètres, aide et profil'), () => true],
];
const used = new Set(); const body = [];
body.push(...cover({ eyebrow: t('Application screenshots', 'Captures d’écran de l’application'), title: 'CortexSkills', subtitle: orgName, meta: [`Version ${version} · ${today}`, t(`${manifest.length} screens · demonstration data, fictional organization`, `${manifest.length} écrans · données de démonstration, organisation fictive`), t('Prepared by POWERACT Consulting', 'Préparé par POWERACT Consulting')], appLogo: path.join(__dirname, '../../web/public/cortexskills-logo.png') }));
body.push(...tocPage(t('Table of Contents', 'Table des matières')));
body.push(H1(t('1. About these screenshots', '1. À propos de ces captures')),
  P(t(`Every screen of CortexSkills as seen by the users of ${orgName}, in ${fr ? 'French' : 'English'}, at 1440 × 900 pixels. The project screens show the AI skills run of the organization; the Administration screens are taken with the organization administrator account, Backups & health with the platform administrator.`, `Chaque écran de CortexSkills tel que le voient les utilisateurs de ${orgName}, en français, en 1440 × 900 pixels. Les écrans de projet montrent le déroulé compétences IA de l’organisation ; les écrans d’administration sont pris avec le compte administrateur de l’organisation, Sauvegardes et santé avec l’administrateur de la plateforme.`)),
  table(['#', t('Screen', 'Écran'), t('Address', 'Adresse'), t('File', 'Fichier')], manifest.map((m, i) => [String(i + 1), m.title, m.path, m.file]), [500, 4200, 2600, 2446], { size: 16 }),
  spacer(), callout(t('Files', 'Fichiers'), [t('The PNG files are in the folder “screens” of this pack, in the order of this album.', 'Les fichiers PNG sont dans le dossier « screens » de ce pack, dans l’ordre de cet album.')]));
let ch = 2, fig = 0;
for (const [name, test] of GROUPS) {
  const items = manifest.filter(m => !used.has(m.file) && test(m.path)); if (!items.length) continue;
  body.push(H1(`${ch++}. ${name}`));
  for (const m of items) { used.add(m.file); body.push(H2(m.title), P([{ text: t('Address: ', 'Adresse : '), bold: true }, m.path], { size: 20 }), ...shot(path.join(dir, m.file), `${t('Figure', 'Figure')} ${++fig} — ${m.title}`, 640)); }
}
const doc = document({ title: t('CortexSkills — Application screenshots', 'CortexSkills — Captures d’écran'), credit: `CortexSkills · ${t('Screenshots', 'Captures d’écran')} · ${orgName}`, sections: [body], lang: fr ? 'fr-FR' : 'en-GB' });
D.Packer.toBuffer(doc).then(b => { fs.writeFileSync(outFile, b); console.log('written', outFile, manifest.length, 'screens'); });
