// Conformance check of the application against the Standard Application SRS (FR-DA-*, NFR-DA-*): every requirement is
// traced to the code that implements it (the requirement identifiers cited in the source, ranges such as
// "FR-DA-MRE-01 – 23" or "AIP-01..16" expanded), to the reviewed evidence of tools/qa/srs-evidence.json, and to the
// automated checks of tools/qa/checks-results.json (tests, crawler, Office validity, translations, performance).
// Usage (from the repository root): node tools/qa/srs-check.mjs [requirements.json] [out.json]
import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const [reqFile = 'tools/qa/srs-1.9-requirements.json', outFile = 'tools/qa/srs-check-results.json'] = process.argv.slice(2);
const reqs = JSON.parse(fs.readFileSync(path.join(root, reqFile), 'utf8'));
const ids = new Set(reqs.map(r => r.id));
const families = new Map(); for (const id of ids) { const m = id.match(/^((?:FR|NFR)-DA-[A-Z0-9]+)-\d+/); if (m) { const short = m[1].split('-').pop(); if (!families.has(short)) families.set(short, new Set()); families.get(short).add(m[1]); } }
const DIRS = ['server/src', 'server/seed', 'server/test', 'server/i18n/src', 'web/src', 'web/test', 'web/tools', 'tools/qa', 'deploy'];
const FILES = ['README.md', 'web/BULK_ENTRY.md'];
const walk = d => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? (e.name === 'node_modules' || e.name === 'dist' ? [] : walk(path.join(d, e.name))) : /\.(m?js|jsx|cjs|json|md|css|ya?ml)$/.test(e.name) && !/srs-(check-results|1\.\d+-requirements)\.json$/.test(e.name) ? [path.join(d, e.name)] : []) : [];
const files = [...DIRS.flatMap(d => walk(path.join(root, d))), ...FILES.map(f => path.join(root, f)).filter(fs.existsSync)];
const cites = new Map(); const add = (id, file) => { if (!ids.has(id)) return; if (!cites.has(id)) cites.set(id, new Set()); cites.get(id).add(path.relative(root, file)); };
const pad = n => String(n).padStart(2, '0');
for (const file of files) {
  const s = fs.readFileSync(file, 'utf8');
  // Full identifiers, with ranges ("-01 – 23", "-01..23", "-01 to 23") and short follow-ups (", -06").
  const re = /\b((?:FR|NFR)-DA-[A-Z0-9]+|(?<![A-Z-])[A-Z]{2,5})-(\d{2})((?:\s*(?:–|—|-|\.\.|to)\s*\d{2})?)((?:\s*,\s*-\d{2}(?:\s*(?:–|\.\.)\s*\d{2})?)*)/g;
  let m;
  while ((m = re.exec(s))) {
    let fams = m[1].startsWith('FR-') || m[1].startsWith('NFR-') ? [m[1]] : [...(families.get(m[1]) || [])];
    if (!fams.length) continue;
    const nums = []; const a = Number(m[2]); const rng = m[3].match(/(\d{2})\s*$/); const b = rng ? Number(rng[1]) : a;
    for (let k = a; k <= Math.min(b, a + 60); k++) nums.push(k);
    for (const part of m[4].matchAll(/-(\d{2})(?:\s*(?:–|\.\.)\s*(\d{2}))?/g)) { const x = Number(part[1]), y = part[2] ? Number(part[2]) : x; for (let k = x; k <= y; k++) nums.push(k); }
    for (const fam of fams) for (const n of nums) add(`${fam}-${pad(n)}`, file);
  }
}
const evidence = fs.existsSync(path.join(root, 'tools/qa/srs-evidence.json')) ? JSON.parse(fs.readFileSync(path.join(root, 'tools/qa/srs-evidence.json'), 'utf8')) : {};
const checks = fs.existsSync(path.join(root, 'tools/qa/checks-results.json')) ? JSON.parse(fs.readFileSync(path.join(root, 'tools/qa/checks-results.json'), 'utf8')) : { checks: [] };
const byReq = new Map(); for (const c of checks.checks || []) for (const id of c.requirements || []) { if (!byReq.has(id)) byReq.set(id, []); byReq.get(id).push(c); }
const rows = reqs.map(r => {
  const code = [...(cites.get(r.id) || [])].sort(); const ev = evidence[r.id]; const cs = byReq.get(r.id) || [];
  const failed = cs.filter(c => !c.ok);
  const status = ev?.status || (failed.length ? 'Partial' : code.length || cs.length ? 'Met' : 'Not verified');
  return { id: r.id, section: r.section, text: r.text, status, code: code.slice(0, 6), codeCount: code.length, checks: cs.map(c => ({ id: c.id, ok: c.ok })), note: ev?.note || (failed.length ? failed.map(c => c.detail || c.id).join('; ') : '') };
});
const summary = rows.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] || 0) + 1 }), {});
fs.writeFileSync(path.join(root, outFile), JSON.stringify({ srs: path.basename(reqFile), at: new Date().toISOString(), total: rows.length, summary, checks: checks.checks || [], rows }, null, 1));
console.log(rows.length, 'requirements', summary);
for (const r of rows.filter(x => x.status !== 'Met')) console.log(r.status.padEnd(13), r.id, '—', r.note || r.text.slice(0, 90));
