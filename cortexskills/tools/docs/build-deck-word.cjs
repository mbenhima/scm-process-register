// Word version of a presentation: one slide per landscape page (image rendered from the deck's PDF), with a heading
// per slide for the table of contents. Run: node build-deck-word.cjs <deck.pdf> <deck.outline.json> <slidesDir> <out.docx>
// (slidesDir holds slide-001.png … rendered from the PDF beforehand).
const path = require('path'); const fs = require('fs');
const B = require('./brand.cjs'); const { D, P, H1, H2, cover, tocPage, document, image, spacer, callout } = B;
const [pdf, outlineFile, dir, outFile] = process.argv.slice(2);
const O = JSON.parse(fs.readFileSync(outlineFile, 'utf8')); const fr = O.lang === 'fr'; const t = (en, f) => (fr ? f : en);
const version = JSON.parse(fs.readFileSync(path.join(__dirname, '../../server/package.json'), 'utf8')).version;
const today = new Date().toISOString().slice(0, 10);
const files = fs.readdirSync(dir).filter(f => /^slide-\d+\.png$/.test(f)).sort();
const byNo = Object.fromEntries(O.slides.map(s => [s.no, s]));
const body = [...cover({ eyebrow: t('Presentation', 'Présentation'), title: O.title, subtitle: O.org, meta: [`Version ${version} · ${today}`, t(`${files.length} slides · demonstration data, fictional organization`, `${files.length} diapositives · données de démonstration, organisation fictive`), t('Prepared by AI Value', 'Préparé par AI Value')], appLogo: path.join(__dirname, '../../web/public/cortexskills-logo.png') }),
  ...tocPage(t('Table of Contents', 'Table des matières'))];
const { Paragraph, AlignmentType, PageBreak } = D;
files.forEach((f, i) => {
  const no = i + 1; const meta = byNo[no] || { title: no === 1 ? t('Title', 'Titre') : t('Closing', 'Clôture') };
  const head = meta.divider ? H1(meta.title) : new Paragraph({ heading: D.HeadingLevel.HEADING_2, keepNext: true, pageBreakBefore: no > 1 && !meta.divider, spacing: { before: 0, after: 120 }, children: [B.run(`${no}. ${meta.title}`, { font: 'Montserrat', size: 26, bold: true, color: B.C.navy })] });
  body.push(head, new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [image(path.join(dir, f), 900, { alt: `${t('Slide', 'Diapositive')} ${no} — ${meta.title}` })] }));
});
const doc = document({ title: O.title, credit: `CortexSkills · ${O.org}`, sections: [body], lang: fr ? 'fr-FR' : 'en-GB', landscape: true });
D.Packer.toBuffer(doc).then(b => { fs.writeFileSync(outFile, b); console.log('written', outFile, files.length, 'slides'); });
