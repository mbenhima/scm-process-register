// Renders the documents and reports of one project as a lifecycle sample pack, one folder per
// end-to-end process (E2E-01 … E2E-12) plus a Reports folder: every document in the formats its
// template allows (PDF, DOCX, XLSX), key documents also as PowerPoint, and the nine project
// reports in PDF, Word, Excel, PowerPoint and CSV. Writes index.json for the pack index.
// Usage: node tools/render-lifecycle-samples.mjs <outDir> <projectCode> [--lang=en]
import fs from 'node:fs';
import { openDb, all, get, P, J } from '../src/db.js';
import { catalog } from '../src/catalog/store.js';
import { buildContent, documentModel } from '../src/services/docdata.js';
import { toPdf, toDocx, toXlsx, toCsv } from '../src/services/render.js';
import { toPptx } from '../src/services/pptx.js';
import { materialize } from '../src/services/diagram.js';
import { layoutOf, resolveTemplate } from '../src/routes/documents.js';
import { templateByCode } from '../src/content/templates.js';
import { REPORTS, buildModel } from '../src/routes/reports.js';

openDb();
const args = process.argv.slice(2);
const lang = (args.find(a => a.startsWith('--lang=')) || '--lang=en').slice(7);
const [outDir, code] = args.filter(a => !a.startsWith('--'));
if (!outDir || !code) { console.error('Usage: node tools/render-lifecycle-samples.mjs <outDir> <projectCode> [--lang=en]'); process.exit(1); }
const p = get('SELECT * FROM projects WHERE code=?', code);
if (!p) { console.error(`Unknown project ${code}`); process.exit(1); }
const c = catalog();
const T = (v) => (v && typeof v === 'object' ? v[lang] ?? v.en : v) || '';
const safe = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}._ -]+/gu, '').replace(/\s+/g, '_').slice(0, 70);

// Where each document is produced or used in the lifecycle (by template).
const PHASE_OF = {
  'TPL-CTX': 'E2E-01', 'TPL-SCOPE': 'E2E-01', 'TPL-POL-Q': 'E2E-01', 'TPL-OBJ': 'E2E-01', 'TPL-PMAP': 'E2E-01', 'TPL-REG-IP': 'E2E-01', 'TPL-MAN': 'E2E-01', 'TPL-PSHEET': 'E2E-01',
  'TPL-RACSI': 'E2E-02', 'TPL-COMM': 'E2E-02',
  'TPL-REG-RISK': 'E2E-03',
  'TPL-LEGAL': 'E2E-04',
  'TPL-COMP': 'E2E-05', 'TPL-DOCLIST': 'E2E-05', 'TPL-WI': 'E2E-05', 'TPL-CAL': 'E2E-05',
  'TPL-CHANGE': 'E2E-06',
  'TPL-KPI': 'E2E-07',
  'TPL-REQ': 'E2E-08', 'TPL-CTRL': 'E2E-08', 'TPL-RELEASE': 'E2E-08', 'TPL-SUP': 'E2E-08',
  'TPL-NC': 'E2E-09', 'TPL-NCO': 'E2E-09', 'TPL-CAPA': 'E2E-09',
  'TPL-MR': 'E2E-10',
  'TPL-AUDPRG': 'E2E-11', 'TPL-AUDREP': 'E2E-11',
  'TPL-IMP': 'E2E-12',
};
// Documents also given as PowerPoint, to present them in a meeting.
const PPTX = new Set(['TPL-POL-Q', 'TPL-OBJ', 'TPL-PMAP', 'TPL-KPI', 'TPL-MR', 'TPL-IMP']);
const PPTX_CODES = new Set([`${code}-AUDREP-01`, `${code}-CAPA-002`, `${code}-PROC-10`]);
const REPORTS_DIR = { en: '13_Reports', fr: '13_Rapports' }[lang] || '13_Reports';

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const phaseDir = (e2e) => {
  const n = Number(e2e.slice(4));
  return `${String(n).padStart(2, '0')}_${e2e}_${safe(T(c.e2eById[e2e]?.name))}`;
};
const index = [];
const docs = all('SELECT * FROM documents WHERE project_id=? ORDER BY code', p.id);
for (const d of docs) {
  const target = P(d.target) || {};
  const e2e = target.e2e || PHASE_OF[d.template_id] || c.mpById[templateByCode[d.template_id]?.mp]?.e2e || 'E2E-01';
  const dir = `${outDir}/${phaseDir(e2e)}`; fs.mkdirSync(dir, { recursive: true });
  const v = get(`SELECT * FROM document_versions WHERE document_id=? AND status='Published'`, d.id) || get('SELECT * FROM document_versions WHERE document_id=? ORDER BY created_at DESC LIMIT 1', d.id);
  let ver = v;
  const cont = P(v.content);
  if (cont && cont.format === 'structured' && cont.live && d.template_id) {
    ver = { ...v, content: J(buildContent(d.project_id, d.template_id, { template: resolveTemplate(d.org_id, d.template_id), docId: d.id, mpId: target.mp, e2e: target.e2e, target, ownerRole: d.owner_role, date: (v.approved_at || v.created_at).slice(0, 10) })) };
  }
  const m = documentModel(d, ver, lang, layoutOf(d.org_id));
  const fm = templateByCode[d.template_id]?.formats || ['DOCX', 'PDF'];
  const base = `${dir}/${d.code}_v${v.version}`;
  const formats = [];
  if (fm.includes('XLSX')) { fs.writeFileSync(`${base}.xlsx`, Buffer.from(await toXlsx(m, lang))); formats.push('XLSX'); }
  await materialize(m);
  await new Promise((res) => { const ws = fs.createWriteStream(`${base}.pdf`); ws.on('finish', res); toPdf(m, lang, ws); }); formats.push('PDF');
  if (fm.includes('DOCX')) { fs.writeFileSync(`${base}.docx`, await toDocx(m, lang)); formats.push('DOCX'); }
  if (PPTX.has(d.template_id) || PPTX_CODES.has(d.code)) { fs.writeFileSync(`${base}.pptx`, await toPptx(m, lang)); formats.push('PPTX'); }
  index.push({ phase: e2e, phaseName: T(c.e2eById[e2e]?.name), folder: phaseDir(e2e), code: d.code, title: T(P(d.title)), type: d.doc_type, version: v.version, status: d.status, formats });
}
// The nine project reports in every export format.
const rdir = `${outDir}/${REPORTS_DIR}`; fs.mkdirSync(rdir, { recursive: true });
for (const id of REPORTS) {
  const m = buildModel(id, p, lang);
  const base = `${rdir}/${code}-${id}-${lang}`;
  await materialize(m);
  await new Promise((res) => { const ws = fs.createWriteStream(`${base}.pdf`); ws.on('finish', res); toPdf(m, lang, ws); });
  fs.writeFileSync(`${base}.docx`, await toDocx(m, lang));
  fs.writeFileSync(`${base}.xlsx`, Buffer.from(await toXlsx(m, lang)));
  fs.writeFileSync(`${base}.pptx`, await toPptx(m, lang));
  fs.writeFileSync(`${base}.csv`, toCsv(m));
  index.push({ phase: 'REPORTS', phaseName: REPORTS_DIR.slice(3), folder: REPORTS_DIR, code: `${code}-${id}`, title: m.title, type: 'Report', version: '', status: '', formats: ['PDF', 'DOCX', 'XLSX', 'PPTX', 'CSV'] });
}
fs.writeFileSync(`${outDir}/index.json`, JSON.stringify({ project: { code: p.code, name: T(P(p.name)) }, lang, items: index }, null, 1));
console.log(code, lang, index.length, 'items');
