// D-Config item 8: generates a schema-valid BPMN 2.0 XML starter diagram
// (OMG BPMN 2.0 MODEL + DI namespaces) for an E2E process chain — a Start
// Event, one Task per step, sequence flows chaining them, and an End Event,
// laid out left-to-right. This is only ever the *seed*: once loaded into
// the bpmn-js Modeler (BpmnEditor.jsx), a user can freely turn it into any
// valid BPMN 2.0 diagram (gateways, pools, intermediate events, etc.) — the
// generator's job is just to not hand back a blank canvas.
const EVENT_SIZE = 36
const TASK_W = 120
const TASK_H = 80
const GAP = 60
const Y_CENTER = 220

function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

/**
 * @param {{id: string, name: string, steps: {id: string, name: string}[]}} chain
 * @returns {string} BPMN 2.0 XML
 */
export function generateDefaultBpmnXml(chain) {
  const processId = `Process_${chain.id}`
  const startId = 'StartEvent_1'
  const endId = 'EndEvent_1'
  const taskIds = chain.steps.map((s, i) => `Task_${i + 1}_${s.id}`)
  const flowIds = []
  const nodeSequence = [startId, ...taskIds, endId]
  for (let i = 0; i < nodeSequence.length - 1; i++) flowIds.push(`Flow_${i + 1}`)

  // --- Process (MODEL) elements ---
  const startEventXml = `<bpmn:startEvent id="${startId}" name="Start">${
    flowIds[0] ? `<bpmn:outgoing>${flowIds[0]}</bpmn:outgoing>` : ''
  }</bpmn:startEvent>`

  const taskXmls = chain.steps.map((s, i) => {
    const incoming = flowIds[i]
    const outgoing = flowIds[i + 1]
    return `<bpmn:task id="${taskIds[i]}" name="${esc(s.name)}"><bpmn:incoming>${incoming}</bpmn:incoming><bpmn:outgoing>${outgoing}</bpmn:outgoing></bpmn:task>`
  })

  const endEventXml = `<bpmn:endEvent id="${endId}" name="End"><bpmn:incoming>${flowIds[flowIds.length - 1]}</bpmn:incoming></bpmn:endEvent>`

  const flowXmls = flowIds.map((fid, i) => `<bpmn:sequenceFlow id="${fid}" sourceRef="${nodeSequence[i]}" targetRef="${nodeSequence[i + 1]}" />`)

  // --- Diagram Interchange (DI): bounds for each shape, left-to-right ---
  let x = 160
  const bounds = {}
  bounds[startId] = { x, y: Y_CENTER - EVENT_SIZE / 2, w: EVENT_SIZE, h: EVENT_SIZE }
  x += EVENT_SIZE + GAP
  for (const tid of taskIds) {
    bounds[tid] = { x, y: Y_CENTER - TASK_H / 2, w: TASK_W, h: TASK_H }
    x += TASK_W + GAP
  }
  bounds[endId] = { x, y: Y_CENTER - EVENT_SIZE / 2, w: EVENT_SIZE, h: EVENT_SIZE }

  const shapeXmls = nodeSequence.map((nid) => {
    const b = bounds[nid]
    return `<bpmndi:BPMNShape id="${nid}_di" bpmnElement="${nid}"><dc:Bounds x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" /></bpmndi:BPMNShape>`
  })

  const edgeXmls = flowIds.map((fid, i) => {
    const from = bounds[nodeSequence[i]]
    const to = bounds[nodeSequence[i + 1]]
    const x1 = from.x + from.w
    const y1 = from.y + from.h / 2
    const x2 = to.x
    const y2 = to.y + to.h / 2
    return `<bpmndi:BPMNEdge id="${fid}_di" bpmnElement="${fid}"><di:waypoint x="${x1}" y="${y1}" /><di:waypoint x="${x2}" y="${y2}" /></bpmndi:BPMNEdge>`
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_${chain.id}" targetNamespace="http://journi.app/bpmn">
  <bpmn:process id="${processId}" name="${esc(chain.name)}" isExecutable="false">
    ${startEventXml}
    ${taskXmls.join('\n    ')}
    ${endEventXml}
    ${flowXmls.join('\n    ')}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_${chain.id}">
    <bpmndi:BPMNPlane id="BPMNPlane_${chain.id}" bpmnElement="${processId}">
      ${shapeXmls.join('\n      ')}
      ${edgeXmls.join('\n      ')}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`
}
