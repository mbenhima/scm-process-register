import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Modeler from 'bpmn-js/lib/Modeler';
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { put, post } from '../lib/api.js';
import { PageHead, Card, Guard, Btn, Icon, useAction, Legend } from '../components/ui.jsx';

export function BpmnPage() {
  const { t, L } = useI18n(); const { can } = useSession(); const [sp] = useSearchParams(); const d = useData('/records/BpmnDiagram?limit=100'); const [sel, setSel] = useState(null);
  const want = sp.get('e2e');
  useEffect(() => { if (d.data && !sel) setSel(d.data.items.find(x => x.e2e_id === want) || d.data.items[0] || null); }, [d.data]); // eslint-disable-line
  return (<><PageHead eyebrow={t('navGroup.process')} title={t('nav.bpmn')} subtitle={t('bpmn.subtitle')} />
    <div className="notice grey" style={{ marginBottom: 'var(--aiv-space-4)' }}><Icon name="Info" />{t('bpmn.documentOnly')}</div>
    <Guard state={d}>{x => <div className="grid bpmn-layout"><Card title={t('bpmn.diagrams')}>{x.items.map(it => <button key={it.id} className="nav-item" aria-current={sel?.id === it.id ? 'page' : undefined} style={{ width: '100%', border: 0, background: 'none', textAlign: 'start' }} onClick={() => setSel(it)}><Icon name="Shapes" /><span>{it.e2e_id} · {L(it.title)}</span></button>)}
      {can('bpmn.edit') && <GenerateButton onDone={d.reload} />}</Card>
      {sel ? <Editor key={sel.id} rec={sel} canEdit={can('bpmn.edit')} onSaved={d.reload} /> : <Card><p className="muted">{t('bpmn.none')}</p></Card>}</div>}</Guard></>);
}
function GenerateButton({ onDone }) {
  const { t } = useI18n(); const act = useAction(); const [id, setId] = useState('E2E-01');
  return (<div className="row" style={{ marginTop: 'var(--aiv-space-3)', flexWrap: 'nowrap' }}><input className="input" value={id} onChange={e => setId(e.target.value.toUpperCase())} aria-label="E2E" style={{ width: 120 }} />
    <Btn size="sm" icon="Plus" onClick={async () => { await act(() => post('/records/BpmnDiagram', { title: id, e2e_id: id, xml: '' }), 'common.saved'); onDone(); }}>{t('bpmn.new')}</Btn></div>);
}

function Editor({ rec, canEdit, onSaved }) {
  const { t, L } = useI18n(); const act = useAction(); const host = useRef(null); const palette = useRef(null); const inst = useRef(null); const fileRef = useRef(null);
  const [full, setFull] = useState(false); const [zoom, setZoom] = useState(1); const [dirty, setDirty] = useState(false); const [paletteOpen, setPaletteOpen] = useState(true);
  useEffect(() => {
    const M = canEdit ? Modeler : NavigatedViewer; const bpmn = new M({ container: host.current, textRenderer: { defaultStyle: { fontFamily: "'Source Sans 3', 'Noto Naskh Arabic', sans-serif", fontSize: 12 }, externalStyle: { fontFamily: "'Source Sans 3', 'Noto Naskh Arabic', sans-serif", fontSize: 12 } } }); inst.current = bpmn;
    const xml = rec.xml || emptyXml(rec.e2e_id || 'P1');
    bpmn.importXML(xml).then(() => { bpmn.get('canvas').zoom('fit-viewport'); setZoom(bpmn.get('canvas').zoom());
      if (canEdit) { const p = host.current.querySelector('.djs-palette'); if (p && palette.current) palette.current.appendChild(p); bpmn.on('commandStack.changed', () => setDirty(true)); }
    }).catch(() => {});
    return () => bpmn.destroy();
  }, [rec.id, canEdit]); // eslint-disable-line
  useEffect(() => { const k = e => e.key === 'Escape' && setFull(false); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, []);
  useEffect(() => { setTimeout(() => inst.current?.get('canvas').resized(), 50); }, [full, paletteOpen]);
  const setZ = z => { setZoom(z); inst.current.get('canvas').zoom(z); };
  const save = async () => { const { xml } = await inst.current.saveXML({ format: true }); await act(() => put(`/records/BpmnDiagram/${rec.id}`, { xml })); setDirty(false); onSaved(); };
  const exportXml = async () => { const { xml } = await inst.current.saveXML({ format: true }); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([xml], { type: 'application/xml' })); a.download = `${rec.e2e_id || 'diagram'}.bpmn`; a.click(); };
  const importXml = async f => { const text = await f.text(); await inst.current.importXML(text); inst.current.get('canvas').zoom('fit-viewport'); setDirty(true); };
  return (<section className={`card ${full ? 'bpmn-full' : ''}`} style={{ padding: full ? 'var(--aiv-space-3)' : undefined }} aria-label={L(rec.title)}>
    <div className="card-head"><h3>{rec.e2e_id} · {L(rec.title)}</h3><div className="actions">
      <Btn size="sm" icon="ZoomOut" aria-label={t('bpmn.zoomOut')} onClick={() => setZ(Math.max(0.2, zoom - 0.1))} /><input type="range" min="0.2" max="2" step="0.05" value={zoom} onChange={e => setZ(Number(e.target.value))} aria-label={t('bpmn.zoom')} style={{ width: 100 }} />
      <Btn size="sm" icon="ZoomIn" aria-label={t('bpmn.zoomIn')} onClick={() => setZ(Math.min(2, zoom + 0.1))} /><Btn size="sm" icon="Maximize2" onClick={() => inst.current.get('canvas').zoom('fit-viewport')}>{t('bpmn.fit')}</Btn>
      {canEdit && <Btn size="sm" icon="PanelLeft" aria-pressed={paletteOpen} onClick={() => setPaletteOpen(o => !o)}>{t('bpmn.palette')}</Btn>}
      <Btn size="sm" icon={full ? 'Minimize' : 'Expand'} onClick={() => setFull(f => !f)}>{full ? t('bpmn.exitFull') : t('bpmn.full')}</Btn>
      <Btn size="sm" icon="Download" onClick={exportXml}>{t('bpmn.export')}</Btn>
      {canEdit && <><input ref={fileRef} type="file" accept=".bpmn,.xml" hidden onChange={e => e.target.files[0] && importXml(e.target.files[0])} /><Btn size="sm" icon="Upload" onClick={() => fileRef.current.click()}>{t('bpmn.import')}</Btn><Btn size="sm" kind="primary" disabled={!dirty} onClick={save}>{t('common.save')}</Btn></>}</div></div>
    <div className="bpmn-host" style={{ gridTemplateColumns: canEdit && paletteOpen ? '200px minmax(0,1fr)' : 'minmax(0,1fr)', height: full ? 'calc(100vh - 110px)' : 560 }}>
      {canEdit && <div className="bpmn-palette" ref={palette} style={{ display: paletteOpen ? 'block' : 'none' }}><div className="label" style={{ marginBottom: 8 }}>{t('bpmn.shapes')}</div><p className="xs muted">{t('bpmn.paletteHint')}</p></div>}
      <div className="bpmn-canvas" ref={host} /></div>
    {!canEdit && <Legend items={[{ label: t('bpmn.start'), color: 'var(--aiv-status-4)' }, { label: t('bpmn.task'), color: 'var(--aiv-white)' }, { label: t('bpmn.gateway'), color: 'var(--aiv-status-3)' }, { label: t('bpmn.end'), color: 'var(--aiv-status-1)' }]} />}
  </section>);
}
const emptyXml = id => `<?xml version="1.0" encoding="UTF-8"?><bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="D1" targetNamespace="https://cortexskills.app/bpmn"><bpmn:process id="P_${id.replace(/-/g, '_')}" isExecutable="false"><bpmn:startEvent id="start"/></bpmn:process><bpmndi:BPMNDiagram id="DI1"><bpmndi:BPMNPlane id="PL1" bpmnElement="P_${id.replace(/-/g, '_')}"><bpmndi:BPMNShape id="start_di" bpmnElement="start"><dc:Bounds x="100" y="100" width="36" height="36"/></bpmndi:BPMNShape></bpmndi:BPMNPlane></bpmndi:BPMNDiagram></bpmn:definitions>`;
