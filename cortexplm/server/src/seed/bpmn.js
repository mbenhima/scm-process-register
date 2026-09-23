// Generates a BPMN 2.0 diagram (process + DI layout) for each E2E process from its user-facing tasks.
import { E2E, GATE_OF_E2E } from '../lib/ref.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export function bpmnFor(e2eId) {
  const e = E2E[e2eId];
  const gate = GATE_OF_E2E[e2eId];
  const nodes = []; const flows = []; const shapes = []; const edges = [];
  const W = 120; const H = 70; const GAP = 45;
  const add = (id, type, name, x, y, w = W, h = H) => { nodes.push({ id, type, name }); shapes.push({ id, x, y, w, h }); return { id, x, y, w, h }; };
  const link = (a, b, name = '', pts) => {
    const id = `Flow_${flows.length + 1}`;
    flows.push({ id, a: a.id, b: b.id, name });
    edges.push({ id, pts: pts || [[a.x + a.w, a.y + a.h / 2], [b.x, b.y + b.h / 2]] });
  };
  const rowY = 180;
  let x = 60;
  const start = add('Start_1', 'startEvent', e.trigger.split('.')[0].slice(0, 60), x, rowY + 17, 36, 36);
  x += 36 + GAP;
  const work = e.tasks.filter((t) => !/^Approve T[-\d]+ Gate/.test(t.name));
  let prev = start;
  if (e2eId === 'E2E-08') {
    const split = add('Gateway_Branch', 'exclusiveGateway', 'T5 path', x, rowY + 10, 50, 50);
    link(prev, split); x += 50 + GAP;
    const a = work.filter((t) => /Branch A/.test(t.chainLink)); const b = work.filter((t) => !/Branch A/.test(t.chainLink));
    let pa = split; let pb = split; let xa = x; let xb = x;
    a.forEach((t, i) => { const n = add(`Task_${t.id.replace(/-/g, '_')}`, 'userTask', `${t.id} ${t.name}`, xa, rowY - 120, W, H); link(pa, n, i === 0 ? 'Relaunch (A)' : '', i === 0 ? [[split.x + 25, split.y], [split.x + 25, n.y + H / 2], [n.x, n.y + H / 2]] : undefined); pa = n; xa += W + GAP; });
    b.forEach((t, i) => { const n = add(`Task_${t.id.replace(/-/g, '_')}`, 'userTask', `${t.id} ${t.name}`, xb, rowY + 120, W, H); link(pb, n, i === 0 ? 'Retire (B)' : '', i === 0 ? [[split.x + 25, split.y + 50], [split.x + 25, n.y + H / 2], [n.x, n.y + H / 2]] : undefined); pb = n; xb += W + GAP; });
    const endA = add('End_Relaunch', 'endEvent', 'Re-enter E2E-03, 04 or 05', xa, rowY - 120 + 17, 36, 36); link(pa, endA);
    const gt = add('Task_Gate', 'userTask', `Approve ${gate} Gate`, xb, rowY + 120, W, H); link(pb, gt); xb += W + GAP;
    const gw = add('Gateway_Decision', 'exclusiveGateway', 'Go / Kill / Hold / Recycle', xb, rowY + 130, 50, 50); link(gt, gw);
    const end = add('End_Go', 'endEvent', 'Product retired', xb + 110, rowY + 137, 36, 36); link(gw, end, 'Go');
  } else {
    work.forEach((t) => { const n = add(`Task_${t.id.replace(/-/g, '_')}`, 'userTask', `${t.id} ${t.name}`, x, rowY, W, H); link(prev, n); prev = n; x += W + GAP; });
    if (gate) {
      const gt = add('Task_Gate', 'userTask', `Approve ${gate} Gate`, x, rowY, W, H); link(prev, gt); x += W + GAP;
      const gw = add('Gateway_Decision', 'exclusiveGateway', 'Go / Kill / Hold / Recycle', x, rowY + 10, 50, 50); link(gt, gw);
      const go = add('End_Go', 'endEvent', 'Go: next E2E starts', x + 110, rowY + 17, 36, 36); link(gw, go, 'Go');
      const kill = add('End_Kill', 'endEvent', 'Kill: lessons learned', x + 110, rowY + 110, 36, 36); link(gw, kill, 'Kill', [[x + 25, rowY + 60], [x + 25, rowY + 128], [x + 110, rowY + 128]]);
      const hold = add('End_Hold', 'endEvent', 'Hold: re-review date', x + 110, rowY - 80, 36, 36); link(gw, hold, 'Hold', [[x + 25, rowY + 10], [x + 25, rowY - 62], [x + 110, rowY - 62]]);
      const first = shapes.find((s) => s.id.startsWith('Task_UFT'));
      if (first && work.length > 1) {
        const second = shapes.filter((s) => s.id.startsWith('Task_UFT'))[1];
        link(gw, second, 'Recycle', [[x + 25, rowY + 60], [x + 25, rowY + 220], [second.x + W / 2, rowY + 220], [second.x + W / 2, rowY + H]]);
      }
    } else {
      const end = add('End_1', 'endEvent', 'Insights fed back to E2E-01 and E2E-07', x, rowY + 17, 36, 36); link(prev, end);
    }
  }
  const proc = nodes.map((n) => {
    const inc = flows.filter((f) => f.b === n.id).map((f) => `<bpmn:incoming>${f.id}</bpmn:incoming>`).join('');
    const out = flows.filter((f) => f.a === n.id).map((f) => `<bpmn:outgoing>${f.id}</bpmn:outgoing>`).join('');
    return `<bpmn:${n.type} id="${n.id}" name="${esc(n.name)}">${inc}${out}</bpmn:${n.type}>`;
  }).join('\n    ');
  const seq = flows.map((f) => `<bpmn:sequenceFlow id="${f.id}" sourceRef="${f.a}" targetRef="${f.b}"${f.name ? ` name="${esc(f.name)}"` : ''} />`).join('\n    ');
  const di = shapes.map((s) => `<bpmndi:BPMNShape id="${s.id}_di" bpmnElement="${s.id}"><dc:Bounds x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" /></bpmndi:BPMNShape>`).join('\n      ')
    + '\n      ' + edges.map((e2) => `<bpmndi:BPMNEdge id="${e2.id}_di" bpmnElement="${e2.id}">${e2.pts.map(([px, py]) => `<di:waypoint x="${Math.round(px)}" y="${Math.round(py)}" />`).join('')}</bpmndi:BPMNEdge>`).join('\n      ');
  const pid = `Process_${e2eId.replace('-', '_')}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_${pid}" targetNamespace="http://cortexplm.example/bpmn">
  <bpmn:process id="${pid}" name="${esc(`${e2eId} ${e.name}`)}" isExecutable="false">
    ${proc}
    ${seq}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="Diagram_${pid}">
    <bpmndi:BPMNPlane id="Plane_${pid}" bpmnElement="${pid}">
      ${di}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}
