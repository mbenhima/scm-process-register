// Generates a BPMN 2.0 diagram (semantic model + diagram interchange) for a macro
// process from its steps: one lane per responsible role, user/service tasks in SIPOC
// order and an exclusive gateway after each decision step (FR-DA-BPMN-01).
import { catalog } from '../catalog/store.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function generateBpmn(mpId, lang = 'en') {
  const cat = catalog();
  const mp = cat.mpById[mpId];
  if (!mp) return null;
  const steps = cat.stepsByMp[mpId] || [];
  const T = (v) => (v && typeof v === 'object' ? v[lang] ?? v.en : v);
  const laneOf = (s) => (s.type === 'Service Task' || s.role === 'DynamicMS Engine' ? 'DynamicMS Engine' : s.role || mp.ownerRole);
  const laneKeys = [];
  for (const s of steps) { const k = laneOf(s); if (!laneKeys.includes(k)) laneKeys.push(k); }
  if (!laneKeys.length) laneKeys.push(mp.ownerRole);
  const laneName = (k) => T(steps.find(s => laneOf(s) === k)?.roleName) || k;

  // Flow nodes in order
  const nodes = [{ id: 'Start_1', kind: 'start', name: T(mp.trigger), lane: laneOf(steps[0] || {}) }];
  steps.forEach((s, i) => {
    nodes.push({ id: `Task_${i + 1}`, kind: s.type === 'Service Task' ? 'serviceTask' : 'userTask', name: T(s.name), lane: laneOf(s), stepId: s.id });
    if (s.formKind === 'decision' && i < steps.length - 1) nodes.push({ id: `Gateway_${i + 1}`, kind: 'gateway', name: T({ en: 'Go?', fr: 'Go ?', ar: 'المضي؟' }), lane: laneOf(s), back: `Task_${i + 1}` });
  });
  nodes.push({ id: 'End_1', kind: 'end', name: T(mp.terminal), lane: laneOf(steps[steps.length - 1] || {}) });

  const flows = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i]; const b = nodes[i + 1];
    flows.push({ id: `Flow_${i + 1}`, from: a.id, to: b.id, name: a.kind === 'gateway' ? T({ en: 'Go', fr: 'Go', ar: 'نعم' }) : '' });
    if (a.kind === 'gateway') flows.push({ id: `Flow_back_${i + 1}`, from: a.id, to: a.back, name: T({ en: 'No-Go', fr: 'No-Go', ar: 'لا' }), back: true });
  }

  // Layout
  const LH = 140; const X0 = 220; const DX = 160; const POOLX = 60; const POOLY = 40;
  const laneIdx = (k) => Math.max(0, laneKeys.indexOf(k));
  const width = X0 + nodes.length * DX + 40;
  const pos = {};
  nodes.forEach((n, i) => {
    const cy = POOLY + laneIdx(n.lane) * LH + LH / 2;
    const cx = X0 + i * DX;
    const [w, hgt] = n.kind === 'start' || n.kind === 'end' ? [36, 36] : n.kind === 'gateway' ? [50, 50] : [110, 80];
    pos[n.id] = { x: cx - w / 2, y: cy - hgt / 2, w, h: hgt, cx, cy };
  });

  const inc = (id) => flows.filter(f => f.to === id).map(f => `<bpmn:incoming>${f.id}</bpmn:incoming>`).join('');
  const out = (id) => flows.filter(f => f.from === id).map(f => `<bpmn:outgoing>${f.id}</bpmn:outgoing>`).join('');
  const el = (n) => {
    const tag = n.kind === 'start' ? 'startEvent' : n.kind === 'end' ? 'endEvent' : n.kind === 'gateway' ? 'exclusiveGateway' : n.kind;
    const doc = n.stepId ? `<bpmn:documentation>${esc(n.stepId)}</bpmn:documentation>` : '';
    return `<bpmn:${tag} id="${n.id}" name="${esc(n.name)}">${doc}${inc(n.id)}${out(n.id)}</bpmn:${tag}>`;
  };
  const lanes = laneKeys.map((k, i) => `<bpmn:lane id="Lane_${i + 1}" name="${esc(laneName(k))}">${nodes.filter(n => laneIdx(n.lane) === i).map(n => `<bpmn:flowNodeRef>${n.id}</bpmn:flowNodeRef>`).join('')}</bpmn:lane>`).join('');
  const seqs = flows.map(f => `<bpmn:sequenceFlow id="${f.id}" name="${esc(f.name)}" sourceRef="${f.from}" targetRef="${f.to}" />`).join('');

  const shapes = nodes.map(n => { const p = pos[n.id]; return `<bpmndi:BPMNShape id="${n.id}_di" bpmnElement="${n.id}"${n.kind === 'gateway' ? ' isMarkerVisible="true"' : ''}><dc:Bounds x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" />${n.kind !== 'userTask' && n.kind !== 'serviceTask' ? `<bpmndi:BPMNLabel><dc:Bounds x="${p.x - 30}" y="${p.y + p.h + 4}" width="${p.w + 60}" height="28" /></bpmndi:BPMNLabel>` : ''}</bpmndi:BPMNShape>`; }).join('');
  const edges = flows.map(f => {
    const a = pos[f.from]; const b = pos[f.to];
    let pts;
    if (f.back) { const yb = Math.max(a.y + a.h, b.y + b.h) + 18; pts = [[a.cx, a.y + a.h], [a.cx, yb], [b.cx, yb], [b.cx, b.y + b.h]]; }
    else if (Math.abs(a.cy - b.cy) < 1) pts = [[a.x + a.w, a.cy], [b.x, b.cy]];
    else { const xm = (a.x + a.w + b.x) / 2; pts = [[a.x + a.w, a.cy], [xm, a.cy], [xm, b.cy], [b.x, b.cy]]; }
    return `<bpmndi:BPMNEdge id="${f.id}_di" bpmnElement="${f.id}">${pts.map(([x, y]) => `<di:waypoint x="${Math.round(x)}" y="${Math.round(y)}" />`).join('')}</bpmndi:BPMNEdge>`;
  }).join('');
  const laneShapes = laneKeys.map((_, i) => `<bpmndi:BPMNShape id="Lane_${i + 1}_di" bpmnElement="Lane_${i + 1}" isHorizontal="true"><dc:Bounds x="${POOLX + 30}" y="${POOLY + i * LH}" width="${width - 30}" height="${LH}" /></bpmndi:BPMNShape>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Defs_${mp.id}" targetNamespace="https://dynamicms.example/bpmn" exporter="DynamicMS" exporterVersion="1.0">
<bpmn:collaboration id="Collab_${mp.code}"><bpmn:participant id="Pool_${mp.code}" name="${esc(`${mp.code} — ${T(mp.name)}`)}" processRef="Process_${mp.code}" /></bpmn:collaboration>
<bpmn:process id="Process_${mp.code}" name="${esc(T(mp.name))}" isExecutable="false"><bpmn:laneSet id="LaneSet_1">${lanes}</bpmn:laneSet>${nodes.map(el).join('')}${seqs}</bpmn:process>
<bpmndi:BPMNDiagram id="Diagram_1"><bpmndi:BPMNPlane id="Plane_1" bpmnElement="Collab_${mp.code}"><bpmndi:BPMNShape id="Pool_${mp.code}_di" bpmnElement="Pool_${mp.code}" isHorizontal="true"><dc:Bounds x="${POOLX}" y="${POOLY}" width="${width}" height="${laneKeys.length * LH}" /></bpmndi:BPMNShape>${laneShapes}${shapes}${edges}</bpmndi:BPMNPlane></bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}

export function isValidBpmn(xml) {
  return typeof xml === 'string' && xml.length < 2_000_000 && /<(bpmn2?:)?definitions[\s>]/.test(xml) && /<(bpmn2?:)?process[\s>]/.test(xml) && !/<!ENTITY/i.test(xml);
}
