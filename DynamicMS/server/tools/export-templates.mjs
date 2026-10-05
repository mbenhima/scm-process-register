// Exports the IMS document template library and the seeded documents for the template catalogue.
// Usage: node tools/export-templates.mjs <out.json> [en|fr]
import fs from 'node:fs';
import { openDb, all, get, P } from '../src/db.js';
import { DOC_TEMPLATES, TEMPLATE_CATEGORIES } from '../src/content/templates.js';
import { catalog } from '../src/catalog/store.js';

const [out, lang = 'en'] = process.argv.slice(2);
openDb();
const c = catalog();
const en = (v) => (v && typeof v === 'object' ? v[lang] ?? v.en ?? '' : v ?? '');
const projects = ['AT-UNI-QMS', 'AT-UNI-QHSE', 'NV-AEC-QMS', 'HZ-UNI-QMS', 'HZ-UNI-QHSE'].map(code => {
  const p = get('SELECT * FROM projects WHERE code=?', code);
  return { code, name: en(P(p.name)), standards: P(p.standards), documents: all('SELECT code, title, template_id, current_version, status FROM documents WHERE project_id=? ORDER BY code', p.id).map(d => ({ ...d, title: en(P(d.title)) })) };
});
fs.writeFileSync(out, JSON.stringify({
  categories: TEMPLATE_CATEGORIES.map(x => ({ id: x.id, name: en(x.name) })),
  templates: DOC_TEMPLATES.map(t => ({ code: t.code, name: en(t.name), category: t.category, docType: t.docType, formats: t.formats, toc: t.toc, ms: t.ms, mp: t.mp, mpName: c.mpById[t.mp] ? `${c.mpById[t.mp].code} ${en(c.mpById[t.mp].name)}` : '', review: t.review, owner: t.owner, mandatory: t.mandatory, clauses: t.clauses, description: en(t.description), perMp: !!t.perMp, perPhase: !!t.perPhase, alternativeTo: t.alternativeTo || null,
    sections: t.sections.map(s => ({ key: s.key, type: s.type, title: en(s.title), source: s.source || null, text: s.text ? en(s.text) || null : null })) })),
  projects,
  totals: { documents: get('SELECT COUNT(*) n FROM documents').n, versions: get('SELECT COUNT(*) n FROM document_versions').n, projects: get('SELECT COUNT(*) n FROM projects').n },
}, null, 1));
console.log('templates exported', out);
