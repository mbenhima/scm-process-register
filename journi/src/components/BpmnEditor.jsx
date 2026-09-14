import React, { useEffect, useRef } from 'react'
import BpmnModeler from 'bpmn-js/lib/Modeler'
import BpmnViewer from 'bpmn-js/lib/Viewer'
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'

// D-Config item 8: a genuine BPMN 2.0 editor — bpmn-js (the open-source
// engine behind Camunda Modeler) reads/writes schema-valid BPMN 2.0 XML and
// renders the standard OMG notation (events, tasks, gateways, pools). Its
// own UI already keeps the Palette (left, floating over the canvas) and
// Context Pad structurally separate from the diagram Canvas — this
// component just wires that engine into journi's data model rather than
// re-implementing any of it. Read-only callers (canGovern === false) get
// bpmn-js's Viewer instead of its Modeler, so the diagram still renders
// with full BPMN notation but with no palette/editing surface at all.
export default function BpmnEditor({ xml, onChange, readOnly, height = 560 }) {
  const containerRef = useRef(null)
  const engineRef = useRef(null)
  const lastImportedXml = useRef(null)

  useEffect(() => {
    const Engine = readOnly ? BpmnViewer : BpmnModeler
    const engine = new Engine({ container: containerRef.current })
    engineRef.current = engine

    if (!readOnly) {
      engine.on('commandStack.changed', async () => {
        try {
          const { xml: savedXml } = await engine.saveXML({ format: true })
          lastImportedXml.current = savedXml
          onChange?.(savedXml)
        } catch {
          // ignore transient save errors while the diagram is mid-edit
        }
      })
    }

    return () => engine.destroy()
    // Engine is recreated only when the read/write mode itself changes —
    // xml updates are handled by the importXML effect below instead, so a
    // parent-driven xml change doesn't tear down and lose editor state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly])

  useEffect(() => {
    if (!engineRef.current || !xml || xml === lastImportedXml.current) return
    lastImportedXml.current = xml
    engineRef.current
      .importXML(xml)
      .then(() => {
        const canvas = engineRef.current.get('canvas')
        canvas.zoom('fit-viewport')
      })
      .catch((err) => console.error('BPMN import failed:', err))
  }, [xml])

  return <div ref={containerRef} style={{ height }} className="bpmn-editor-container rounded-xl border border-brand-100 bg-white relative overflow-hidden" />
}
