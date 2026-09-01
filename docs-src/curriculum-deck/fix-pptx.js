// Works around a pptxgenjs 4.0.1 bug: makeXmlContTypes() emits one
// <Override PartName="/ppt/slideMasters/slideMasterN.xml" .../> entry per
// slide, but the library only ever physically writes slideMaster1.xml.
// Real PowerPoint validates that every Content_Types Override part exists
// in the package and refuses to open the file cleanly otherwise (prompts
// to repair); LibreOffice and python-pptx are lenient and don't catch it.
// This strips any Override whose PartName has no matching file in the zip.
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function fixPptx(filePath) {
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);
  const ctPath = '[Content_Types].xml';
  const ct = await zip.file(ctPath).async('string');

  const overrideRe = /<Override PartName="([^"]+)"[^>]*\/>/g;
  let removed = [];
  const fixed = ct.replace(overrideRe, (match, partName) => {
    const zipPath = partName.replace(/^\//, '');
    if (zip.file(zipPath)) return match;
    removed.push(partName);
    return '';
  });

  if (removed.length) {
    zip.file(ctPath, fixed);
    const out = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync(filePath, out);
    console.log(`fix-pptx: removed ${removed.length} stale Content_Types override(s) from ${path.basename(filePath)}:`);
    removed.forEach((p) => console.log('  -', p));
  } else {
    console.log(`fix-pptx: ${path.basename(filePath)} had no stale Content_Types overrides.`);
  }
}

module.exports = { fixPptx };

if (require.main === module) {
  const target = process.argv[2];
  if (!target) {
    console.error('usage: node fix-pptx.js <file.pptx>');
    process.exit(1);
  }
  fixPptx(target).catch((e) => { console.error(e); process.exit(1); });
}
