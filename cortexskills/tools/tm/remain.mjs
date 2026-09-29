import fs from 'node:fs';
const { tr, missing } = await import('/home/user/scm-process-register/cortexskills/server/seed/lib.js');
const all = JSON.parse(fs.readFileSync('/home/user/scm-process-register/cortexskills/server/data/missing-translations.json','utf8')).fr;
for (const s of all) tr(s);
const rem = [...missing.fr].filter(s => missing.ar.has(s) || true);
console.log('remaining fr', missing.fr.size, 'ar', missing.ar.size);
fs.writeFileSync(process.argv[2], JSON.stringify([...new Set([...missing.fr, ...missing.ar])]));
