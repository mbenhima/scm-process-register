// BPMN 2.0 viewer/modeler (bpmn-js) restyled to the design tokens. The palette lives
// in its own panel beside the canvas (FR-DA-BPMN-03); export/import .bpmn files.
import { useEffect, useRef, useState } from 'react';
import { Download, Upload, Save, RotateCcw, ZoomIn, ZoomOut, Scan, Maximize2, Minimize2 } from 'lucide-react';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import { useApp } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { Loading, ErrorBox } from './ui.jsx';

const RENDER = { defaultFillColor: '#FFFFFF', defaultStrokeColor: '#58595B', defaultLabelColor: '#3A3A3C' };

export default function Bpmn({ projectId, mpId, code }) {
  const { t, toast, readOnly } = useApp();
  const canvasRef = useRef(null); const paletteRef = useRef(null); const inst = useRef(null); const fileRef = useRef(null);
  const [meta, setMeta] = useState(null); const [error, setError] = useState(null); const [dirty, setDirty] = useState(false);
  const shellRef = useRef(null); const [full, setFull] = useState(false);
  // Full screen: the diagram takes the whole screen; Esc or the button returns to the page.
  useEffect(() => {
    const refit = () => setTimeout(() => { const c = inst.current?.get('canvas'); if (c) { c.resized(); c.zoom('fit-viewport'); } }, 60);
    refit();
    if (!full) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setFull(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [full]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const m = await api(`/projects/${projectId}/bpmn/${mpId}`);
        if (cancelled) return;
        setMeta(m);
        const edit = m.canEdit && !readOnly;
        const Mod = edit ? (await import('bpmn-js/lib/Modeler')).default : (await import('bpmn-js/lib/NavigatedViewer')).default;
        if (cancelled) return;
        const viewer = new Mod({ container: canvasRef.current, bpmnRenderer: RENDER, textRenderer: { defaultStyle: { fontFamily: 'Source Sans 3, Calibri, sans-serif', fontSize: 12 } } });
        inst.current = viewer;
        await viewer.importXML(m.xml);
        const canvas = viewer.get('canvas');
        canvas.zoom('fit-viewport');
        const vb = canvas.viewbox();
        if (vb.scale < 0.6) canvas.viewbox({ x: vb.inner.x - 20, y: vb.inner.y - 20, width: vb.outer.width / 0.8, height: vb.outer.height / 0.8 });
        if (edit) {
          const pal = canvasRef.current.querySelector('.djs-palette');
          if (pal && paletteRef.current) paletteRef.current.appendChild(pal);
          viewer.on('commandStack.changed', () => setDirty(true));
        }
      } catch (e) { if (!cancelled) setError(e); }
    })();
    return () => { cancelled = true; inst.current?.destroy(); inst.current = null; };
  }, [projectId, mpId, readOnly]);

  const exportXml = async () => {
    const { xml } = await inst.current.saveXML({ format: true });
    const blob = new Blob([xml], { type: 'application/xml' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${code || mpId}.bpmn`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const importXml = async (file) => {
    try { await inst.current.importXML(await file.text()); inst.current.get('canvas').zoom('fit-viewport'); setDirty(true); toast(t('Diagram imported. Save to keep it.')); } catch (e) { toast(t('The file is not a valid BPMN 2.0 diagram.'), 'error'); }
  };
  const save = async () => {
    try { const { xml } = await inst.current.saveXML({ format: true }); const r = await api(`/projects/${projectId}/bpmn/${mpId}`, { method: 'PUT', body: { xml } }); setDirty(false); toast(t('Diagram saved as a new version.')); if (r.warnings?.length) toast(t('Naming: {n} task name(s) should start with a verb and name their object: {list}', { n: r.warnings.length, list: r.warnings.slice(0, 3).join('; ') }), 'error'); } catch (e) { toast(e.message, 'error'); }
  };
  const reset = async () => { try { await api(`/projects/${projectId}/bpmn/${mpId}`, { method: 'DELETE' }); toast(t('Diagram reset to the process design.')); window.location.reload(); } catch (e) { toast(e.message, 'error'); } };
  const zoom = (f) => { const c = inst.current?.get('canvas'); if (!c) return; if (f === 0) c.zoom('fit-viewport'); else c.zoom(c.zoom() * f); };

  if (error) return <ErrorBox error={error} />;
  const edit = meta?.canEdit && !readOnly;
  return (
    <div className={`stack ${full ? 'bpmn-full' : ''}`} ref={shellRef} role={full ? 'dialog' : undefined} aria-modal={full ? 'true' : undefined} aria-label={full ? t('BPMN diagram in full screen') : undefined}>
      <div className="row-between">
        <p className="small muted" style={{ margin: 0 }}>{meta ? (meta.saved ? t('Saved diagram, version {v}', { v: meta.version }) : t('Generated from the process design: one lane per role, one task per step, a gateway after each decision.')) : ''}{!edit && meta ? ` ${t('Read-only view: pan with the mouse, zoom with the buttons.')}` : ''}</p>
        <div className="row">
          <button className="btn btn-sm btn-icon" onClick={() => zoom(1.2)} aria-label={t('Zoom in')}><ZoomIn size={16} /></button>
          <button className="btn btn-sm btn-icon" onClick={() => zoom(0.8)} aria-label={t('Zoom out')}><ZoomOut size={16} /></button>
          <button className="btn btn-sm btn-icon" onClick={() => zoom(0)} aria-label={t('Fit to screen')} title={t('Fit to screen')}><Scan size={16} /></button>
          <button className="btn btn-sm" onClick={() => setFull(f => !f)} aria-pressed={full}>{full ? <Minimize2 size={16} /> : <Maximize2 size={16} />}{full ? t('Exit full screen') : t('Full screen')}</button>
          <button className="btn btn-sm" onClick={exportXml}><Download size={16} />{t('Export .bpmn')}</button>
          {edit && <><button className="btn btn-sm" onClick={() => fileRef.current?.click()}><Upload size={16} />{t('Import')}</button><input ref={fileRef} type="file" accept=".bpmn,.xml" hidden onChange={e => e.target.files[0] && importXml(e.target.files[0])} />
            {meta?.saved && <button className="btn btn-sm" onClick={reset}><RotateCcw size={16} />{t('Reset')}</button>}
            <button className="btn btn-sm btn-primary" disabled={!dirty} onClick={save}><Save size={16} />{t('Save')}</button></>}
        </div>
      </div>
      <div className={`bpmn-shell ${edit ? '' : 'view'}`}>
        {edit && <div className="bpmn-palette" ref={paletteRef} aria-label={t('Modeling palette')} />}
        <div className="bpmn-canvas" ref={canvasRef}>{!meta && <Loading />}</div>
      </div>
      <p className="caption">{t('BPMN 2.0 diagram of {code}; tasks carry the step identifiers of the process design.', { code })}</p>
    </div>
  );
}
