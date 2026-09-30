// Renders the current version of every document of the given projects to PDF, DOCX and XLSX
// (as the template allows), e.g. to publish sample IMS documents.
// Usage: node tools/render-samples.mjs <outDir> <projectCode> [projectCode...] [--lang=en]
import fs from 'node:fs';
import { openDb, all, get, P, J } from '../src/db.js';
import { buildContent, documentModel } from '../src/services/docdata.js';
import { toPdf, toDocx, toXlsx } from '../src/services/render.js';
import { materialize } from '../src/services/diagram.js';
import { layoutOf, resolveTemplate } from '../src/routes/documents.js';
import { templateByCode } from '../src/content/templates.js';

openDb();
const args = process.argv.slice(2);
const lang = (args.find(a => a.startsWith('--lang=')) || '--lang=en').slice(7);
const [outDir, ...codes] = args.filter(a => !a.startsWith('--'));
if (!outDir || !codes.length) { console.error('Usage: node tools/render-samples.mjs <outDir> <projectCode> [...] [--lang=en]'); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });
for (const pc of codes) {
  const p = get('SELECT * FROM projects WHERE code=?', pc);
  if (!p) { console.error(`Unknown project ${pc}`); continue; }
  const dir = `${outDir}/${pc}`; fs.mkdirSync(dir, { recursive: true });
  for (const d of all('SELECT * FROM documents WHERE project_id=? ORDER BY code', p.id)) {
    const v = get(`SELECT * FROM document_versions WHERE document_id=? AND status='Published'`, d.id) || get('SELECT * FROM document_versions WHERE document_id=? ORDER BY created_at DESC LIMIT 1', d.id);
    let ver = v;
    const c = P(v.content);
    if (c && c.format === 'structured' && c.live && d.template_id) {
      const target = P(d.target) || {};
      ver = { ...v, content: J(buildContent(d.project_id, d.template_id, { template: resolveTemplate(d.org_id, d.template_id), docId: d.id, mpId: target.mp, e2e: target.e2e, target, ownerRole: d.owner_role, date: (v.approved_at || v.created_at).slice(0, 10) })) };
    }
    const m = documentModel(d, ver, lang, layoutOf(d.org_id));
    const fm = templateByCode[d.template_id]?.formats || ['DOCX', 'PDF'];
    const base = `${dir}/${d.code}_v${v.version}`;
    if (fm.includes('XLSX')) fs.writeFileSync(`${base}.xlsx`, Buffer.from(await toXlsx(m, lang)));
    await materialize(m);
    await new Promise((res) => { const ws = fs.createWriteStream(`${base}.pdf`); ws.on('finish', res); toPdf(m, lang, ws); });
    if (fm.includes('DOCX')) fs.writeFileSync(`${base}.docx`, await toDocx(m, lang));
  }
  console.log(pc, fs.readdirSync(dir).length, 'files');
}
