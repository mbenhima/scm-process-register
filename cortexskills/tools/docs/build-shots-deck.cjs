// Screenshot presentation (PowerPoint): one slide per screen, from a folder written by tools/qa/shoot-pack.mjs,
// in the AI Value Graphical Chart v1.2 (§13.3). Run: node build-shots-deck.cjs <packDir> <en|fr> <orgName> <out.pptx>
const path = require('path'); const fs = require('fs');
const PptxGenJS = require('pptxgenjs');
const [dir, lang, orgName, outFile] = process.argv.slice(2);
const fr = lang === 'fr'; const t = (en, f) => (fr ? f : en);
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
const C = { navy: '123A5F', azure: '1876C6', green: '28C87C', teal: '17A2B8', ink: '2C3E50', muted: '5A6B7B', white: 'FFFFFF', bg: 'F5F8FB', line: 'E1E8F0', azureTint: 'E8F1FB' };
const TITLE = 'Montserrat', BODY = 'Open Sans'; const W = 13.333, H = 7.5, M = 0.6;
const BRAND = path.join(__dirname, 'brand');
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
const pres = new PptxGenJS(); pres.layout = 'LAYOUT_WIDE'; pres.author = 'AI Value'; pres.company = 'AI Value'; pres.lang = fr ? 'fr-FR' : 'en-GB';
pres.title = t(`CortexSkills — Application screenshots — ${orgName}`, `CortexSkills — Captures d’écran — ${orgName}`);
const txt = (s, tx, x, y, w, h, o = {}) => s.addText(tx, { x, y, w, h, fontFace: BODY, fontSize: 14, color: C.ink, margin: 0, isTextBox: true, valign: 'top', ...o });
const logo = (s, file, x, y, w) => { const f = path.join(BRAND, file); const b = fs.readFileSync(f); s.addImage({ path: f, x, y, w, h: w * b.readUInt32BE(20) / b.readUInt32BE(16), altText: 'AI Value' }); };
let pageNo = 0, section = '';
function footer(s) {
  s.addShape(pres.shapes.LINE, { x: M, y: H - 0.62, w: W - 2 * M, h: 0, line: { color: C.line, width: 0.75 } });
  logo(s, 'aivalue-lockup.png', M, H - 0.5, 1.6);
  txt(s, `${section} · ${orgName} · ${t('Demonstration data — fictional organization', 'Données de démonstration — organisation fictive')}`, 2.6, H - 0.46, 8.1, 0.3, { fontSize: 10, color: C.muted, align: 'center' });
  txt(s, String(pageNo), W - M - 1, H - 0.46, 1, 0.3, { fontSize: 10, color: C.muted, align: 'right' });
}
const navy = () => { const s = pres.addSlide(); pageNo++; s.background = { color: C.navy };
  s.addShape(pres.shapes.OVAL, { x: 9.2, y: -1.8, w: 6.6, h: 6.6, fill: { color: C.azure, transparency: 80 }, line: { color: C.azure, transparency: 100 } }); return s; };

// Title
{ const s = navy(); logo(s, 'aivalue-lockup-white.png', M, 0.55, 3.0);
  txt(s, t('APPLICATION SCREENSHOTS', 'CAPTURES D’ÉCRAN DE L’APPLICATION'), M, 2.3, 8, 0.4, { fontSize: 14, bold: true, color: C.green, charSpacing: 3 });
  txt(s, 'CortexSkills', M, 2.75, 8, 1.0, { fontFace: TITLE, fontSize: 44, bold: true, color: C.white });
  txt(s, orgName, M, 3.8, 8, 0.6, { fontSize: 22, color: C.white });
  txt(s, t(`${manifest.length} screens · ${fr ? 'French' : 'English'} · 1440 × 900`, `${manifest.length} écrans · français · 1440 × 900`), M, 4.5, 8, 0.4, { fontSize: 15, color: C.white });
  txt(s, 'MEASURABLE · GOVERNED · SUSTAINABLE', M, 6.65, 7, 0.35, { fontSize: 13, bold: true, color: C.green, charSpacing: 3 }); }
// Contents
const used = new Set(); const grouped = GROUPS.map(([name, test]) => { const items = manifest.filter(m => !used.has(m.file) && test(m.path)); items.forEach(m => used.add(m.file)); return [name, items]; }).filter(([, i]) => i.length);
{ section = t('Contents', 'Sommaire'); const s = pres.addSlide(); pageNo++; s.background = { color: C.white };
  txt(s, t('CONTENTS', 'SOMMAIRE'), M, 0.38, 11, 0.32, { fontSize: 14, bold: true, color: C.azure, charSpacing: 2 });
  txt(s, t('The screens of the application, by menu', 'Les écrans de l’application, par menu'), M, 0.72, W - 2 * M, 0.72, { fontFace: TITLE, fontSize: 26, bold: true, color: C.navy, valign: 'middle' });
  txt(s, t(`As seen by the users of ${orgName}. Administration screens are taken with the organization administrator; Backups & health with the platform administrator.`, `Tels que les voient les utilisateurs de ${orgName}. Les écrans d’administration sont pris avec l’administrateur de l’organisation ; Sauvegardes et santé avec l’administrateur de la plateforme.`), M, 1.44, W - 2 * M, 0.5, { fontSize: 13 });
  grouped.forEach(([name, items], i) => { const x = M + (i % 4) * 3.07, y = 2.2 + Math.floor(i / 4) * 2.2;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 2.9, h: 2.0, fill: { color: i === 0 ? C.azureTint : C.white }, line: { color: C.line, width: 0.75 }, rectRadius: 0.1 });
    txt(s, String(i + 1).padStart(2, '0'), x + 0.22, y + 0.18, 1, 0.5, { fontFace: TITLE, fontSize: 22, bold: true, color: C.navy });
    txt(s, name, x + 0.22, y + 0.75, 2.5, 0.65, { fontFace: TITLE, fontSize: 14, bold: true, color: C.navy, fit: 'shrink' });
    txt(s, t(`${items.length} screens`, `${items.length} écrans`), x + 0.22, y + 1.45, 2.5, 0.35, { fontSize: 12, color: C.muted }); });
  footer(s); }
let fig = 0;
grouped.forEach(([name, items], gi) => {
  section = name;
  { const s = navy(); txt(s, String(gi + 1).padStart(2, '0'), M, 2.1, 3, 1.1, { fontFace: TITLE, fontSize: 66, bold: true, color: C.green });
    txt(s, name, M, 3.3, 9, 0.9, { fontFace: TITLE, fontSize: 36, bold: true, color: C.white, fit: 'shrink' });
    txt(s, items.map(m => m.title).slice(0, 12).join(' · '), M, 4.3, 8.4, 1.6, { fontSize: 14, color: C.white, fit: 'shrink' });
    logo(s, 'aivalue-lockup-white.png', M, H - 0.85, 2.2); }
  for (const m of items) {
    const s = pres.addSlide(); pageNo++; s.background = { color: C.white }; fig++;
    txt(s, name.toUpperCase(), M, 0.38, 11, 0.32, { fontSize: 14, bold: true, color: C.azure, charSpacing: 2 });
    txt(s, m.title, M, 0.7, W - 2 * M - 3.2, 0.6, { fontFace: TITLE, fontSize: 24, bold: true, color: C.navy, fit: 'shrink', valign: 'middle' });
    txt(s, `${t('Address', 'Adresse')} : ${m.path}`.replace(' :', fr ? ' :' : ':'), W - M - 3.2, 0.85, 3.2, 0.35, { fontSize: 11, color: C.muted, align: 'right' });
    const f = path.join(dir, m.file); const b = fs.readFileSync(f); const r = b.readUInt32BE(20) / b.readUInt32BE(16);
    let h = 5.15, w = h / r; if (w > W - 2 * M) { w = W - 2 * M; h = w * r; } const x = (W - w) / 2, y = 1.45;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.05, y: y - 0.05, w: w + 0.1, h: h + 0.1, fill: { color: C.white }, line: { color: C.line, width: 0.75 }, rectRadius: 0.05 });
    s.addImage({ path: f, x, y, w, h, altText: m.title });
    footer(s);
  }
});
pres.writeFile({ fileName: outFile }).then(() => console.log('written', outFile, pageNo, 'slides'));
