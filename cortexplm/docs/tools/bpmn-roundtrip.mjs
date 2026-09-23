// BPMN 2.0 round trip (NFR-DA-COMPAT-02): parse, export and re-parse every stored diagram with bpmn-moddle.
// Run from the repository after npm install in web and npm run seed in server: node docs/tools/bpmn-roundtrip.mjs
import { createRequire } from 'module';
const require = createRequire('/home/user/scm-process-register/cortexplm/web/package.json');
const { BpmnModdle } = await import(require.resolve('bpmn-moddle'));
const { DatabaseSync } = await import('node:sqlite');
const d = new DatabaseSync('/home/user/scm-process-register/cortexplm/server/data/cortexplm.db');
const rows = d.prepare('SELECT id, title, xml FROM bpmn_diagrams').all();
const moddle = new BpmnModdle();
let ok = 0; const bad = [];
for (const r of rows) {
  try {
    const a = await moddle.fromXML(r.xml);
    if (a.warnings.length) throw new Error(a.warnings[0].message);
    const { xml } = await moddle.toXML(a.rootElement, { format: true });
    const b = await moddle.fromXML(xml);
    const count = (x) => x.rootElement.rootElements.flatMap((e) => e.flowElements || []).length;
    if (b.warnings.length || count(a) !== count(b) || count(a) === 0) throw new Error(`elements ${count(a)} vs ${count(b)}`);
    ok++;
  } catch (e) { bad.push(`${r.id} ${r.title}: ${e.message}`); }
}
console.log(JSON.stringify({ diagrams: rows.length, roundTripOk: ok, failures: bad.slice(0, 5) }));
