import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Download, Upload, Save, ZoomIn, ZoomOut, Scan, Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import { useAuth } from '../../lib/auth.jsx';
import { useI18n } from '../../lib/i18n.jsx';
import { put } from '../../lib/api.js';
import { PageHeader, Card, DataTable, useFetch, Skeleton, Button, IconButton, useToast, ErrorNote, Badge, fmtDate } from '../../components/ui.jsx';

// Shapes offered in the palette section. Built-in entries come from bpmn-js itself (same behaviour as its own
// palette); the extra ones create typed tasks, gateways and events that the default palette only offers by morphing.
const EXTRA = [
  ['Activities', 'bpmn-icon-user-task', 'User task', { type: 'bpmn:UserTask' }],
  ['Activities', 'bpmn-icon-service-task', 'Service task', { type: 'bpmn:ServiceTask' }],
  ['Activities', 'bpmn-icon-manual-task', 'Manual task', { type: 'bpmn:ManualTask' }],
  ['Activities', 'bpmn-icon-business-rule-task', 'Business rule task', { type: 'bpmn:BusinessRuleTask' }],
  ['Activities', 'bpmn-icon-call-activity', 'Call activity', { type: 'bpmn:CallActivity' }],
  ['Gateways', 'bpmn-icon-gateway-parallel', 'Parallel gateway', { type: 'bpmn:ParallelGateway' }],
  ['Gateways', 'bpmn-icon-gateway-or', 'Inclusive gateway', { type: 'bpmn:InclusiveGateway' }],
  ['Gateways', 'bpmn-icon-gateway-eventbased', 'Event-based gateway', { type: 'bpmn:EventBasedGateway' }],
  ['Events', 'bpmn-icon-start-event-timer', 'Timer start event', { type: 'bpmn:StartEvent', eventDefinitionType: 'bpmn:TimerEventDefinition' }],
  ['Events', 'bpmn-icon-start-event-message', 'Message start event', { type: 'bpmn:StartEvent', eventDefinitionType: 'bpmn:MessageEventDefinition' }],
  ['Events', 'bpmn-icon-intermediate-event-catch-timer', 'Timer event', { type: 'bpmn:IntermediateCatchEvent', eventDefinitionType: 'bpmn:TimerEventDefinition' }],
  ['Events', 'bpmn-icon-end-event-terminate', 'Terminate end event', { type: 'bpmn:EndEvent', eventDefinitionType: 'bpmn:TerminateEventDefinition' }],
  ['Artifacts', 'bpmn-icon-text-annotation', 'Text annotation', { type: 'bpmn:TextAnnotation' }],
];
const GROUP_OF = { tools: 'Tools', event: 'Events', gateway: 'Gateways', activity: 'Activities', 'data-object': 'Data', 'data-store': 'Data', collaboration: 'Participants & groups', artifact: 'Participants & groups' };
const ORDER = ['Tools', 'Events', 'Activities', 'Gateways', 'Data', 'Participants & groups', 'Artifacts'];
// Shapes shown (disabled) as a legend when the diagram is view-only.
const LEGEND = [['Events', 'bpmn-icon-start-event-none', 'Start event'], ['Events', 'bpmn-icon-end-event-none', 'End event'], ['Activities', 'bpmn-icon-task', 'Task'], ['Activities', 'bpmn-icon-user-task', 'User task'],
  ['Gateways', 'bpmn-icon-gateway-xor', 'Exclusive gateway'], ['Gateways', 'bpmn-icon-gateway-parallel', 'Parallel gateway'], ['Data', 'bpmn-icon-data-object', 'Data object'], ['Participants & groups', 'bpmn-icon-participant', 'Pool / participant']];

function ShapePalette({ modeler, canEdit, open, onToggle }) {
  const { t } = useI18n();
  const entries = useMemo(() => {
    if (!modeler || !canEdit) return LEGEND.map(([group, cls, title]) => ({ group, cls, title }));
    const palette = modeler.get('palette');
    const list = Object.entries(palette.getEntries()).filter(([, e]) => e.className && e.action).map(([id, e]) => ({ id, group: GROUP_OF[e.group] || 'Tools', cls: e.className, title: ((s) => s.charAt(0).toUpperCase() + s.slice(1))((e.title || id).replace(/^Create |^Activate /, '')), action: e.action }));
    const factory = modeler.get('elementFactory'); const create = modeler.get('create');
    for (const [group, cls, title, attrs] of EXTRA) {
      const start = (ev) => create.start(ev, factory.createShape({ ...attrs }));
      list.push({ id: cls, group, cls, title, action: { click: start, dragstart: start } });
    }
    return list;
  }, [modeler, canEdit]);
  const groups = ORDER.filter((g) => entries.some((e) => e.group === g));
  return (
    <aside className={`bpmn-palette ${open ? 'open' : 'shut'}`} aria-label={t('BPMN shapes palette')}>
      <div className="bpmn-palette-head">
        {open && <strong>{t('Shapes')}</strong>}
        <IconButton size="sm" icon={open ? PanelLeftClose : PanelLeftOpen} label={open ? t('Slide the palette away') : t('Show the palette')} onClick={onToggle} />
      </div>
      {open && (
        <div className="bpmn-palette-body">
          {!canEdit && <p className="xs muted">{t('Legend of the main shapes. Editing needs the BPMN edit permission and full BPMN editing in the subscription.')}</p>}
          {canEdit && <p className="xs muted">{t('Click a shape then click the canvas, or drag it onto the canvas.')}</p>}
          {groups.map((g) => (
            <div key={g} className="bpmn-palette-group">
              <div className="eyebrow">{t(g)}</div>
              {entries.filter((e) => e.group === g).map((e) => (
                <button key={e.id || e.cls} type="button" className="bpmn-shape" disabled={!canEdit} draggable={canEdit}
                  onClick={(ev) => e.action?.click?.(ev.nativeEvent)} onDragStart={(ev) => e.action?.dragstart?.(ev.nativeEvent)} title={t(e.title)}>
                  <span className={e.cls} aria-hidden /><span className="small">{t(e.title)}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

function Modeler({ diagram, onSaved }) {
  const { t } = useI18n();
  const toast = useToast();
  const host = useRef(null);
  const inst = useRef(null);
  const [ready, setReady] = useState(null);
  const [err, setErr] = useState(null);
  const [full, setFull] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    let alive = true;
    (async () => {
      const Mod = diagram.canEdit ? (await import('bpmn-js/lib/Modeler')).default : (await import('bpmn-js/lib/NavigatedViewer')).default;
      if (!alive) return;
      inst.current = new Mod({ container: host.current });
      try {
        await inst.current.importXML(diagram.xml);
        const canvas = inst.current.get('canvas');
        canvas.zoom('fit-viewport');
        setZoom(canvas.zoom());
        inst.current.get('eventBus').on('canvas.viewbox.changed', ({ viewbox }) => setZoom(viewbox.scale));
        setReady(inst.current);
      } catch (e) { setErr(e); }
    })();
    return () => { alive = false; inst.current?.destroy(); inst.current = null; setReady(null); };
  }, [diagram.id, diagram.canEdit]); // eslint-disable-line react-hooks/exhaustive-deps
  // Full screen: the workspace covers the window; Escape or the button returns to the page.
  useEffect(() => {
    const canvas = inst.current?.get('canvas');
    setTimeout(() => canvas?.resized(), 60);
    if (!full) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('.djs-direct-editing-parent[style*="block"]')) setFull(false); };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('no-scroll'); };
  }, [full]);
  useEffect(() => { setTimeout(() => inst.current?.get('canvas').resized(), 260); }, [paletteOpen]);
  const setScale = (v) => { const c = inst.current?.get('canvas'); if (c) c.zoom(Math.max(0.2, Math.min(4, v))); };
  const save = async () => { try { const { xml } = await inst.current.saveXML({ format: true }); await put(`/bpmn/${diagram.id}`, { xml }); toast.ok(t('Diagram saved.')); onSaved?.(); } catch (e) { toast.err(e); } };
  const exportXml = async () => {
    const { xml } = await inst.current.saveXML({ format: true });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([xml], { type: 'application/xml' })), download: `${diagram.title.replace(/[^\w-]+/g, '_')}.bpmn` });
    document.body.appendChild(a); a.click(); a.remove();
  };
  const importXml = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    try { await inst.current.importXML(await f.text()); inst.current.get('canvas').zoom('fit-viewport'); toast.ok(t('Diagram imported. Save to keep it.')); } catch (err2) { toast.err(new Error(t('The file is not a valid BPMN 2.0 diagram.'))); void err2; }
    e.target.value = '';
  };
  return (
    <div className={`bpmn-workspace ${full ? 'full' : ''}`} role={full ? 'dialog' : undefined} aria-modal={full || undefined} aria-label={full ? diagram.title : undefined}>
      <div className="bpmn-toolbar row between">
        <div className="row" style={{ gap: 8 }}>
          {full && <strong className="bpmn-title">{diagram.title}</strong>}
          <Button icon={Download} onClick={exportXml}>{t('Export .bpmn')}</Button>
          {diagram.canEdit && <label className="btn btn-secondary"><Upload aria-hidden />{t('Import .bpmn')}<input type="file" accept=".bpmn,.xml" className="sr-only" onChange={importXml} /></label>}
          {diagram.canEdit && <Button variant="primary" icon={Save} onClick={save}>{t('Save diagram')}</Button>}
          {!diagram.canEdit && <Badge>{t('View only: pan and zoom')}</Badge>}
        </div>
        <div className="row" style={{ gap: 6 }}>
          <IconButton icon={ZoomOut} label={t('Zoom out')} onClick={() => setScale(zoom - 0.1)} />
          <input type="range" className="zoom-slider" min="0.2" max="4" step="0.05" value={zoom} onChange={(e) => setScale(Number(e.target.value))} aria-label={t('Zoom')} />
          <IconButton icon={ZoomIn} label={t('Zoom in')} onClick={() => setScale(zoom + 0.1)} />
          <span className="xs num" style={{ minWidth: 40 }}>{Math.round(zoom * 100)}%</span>
          <IconButton icon={Scan} label={t('Fit to screen')} onClick={() => inst.current?.get('canvas').zoom('fit-viewport')} />
          <Button icon={full ? Minimize2 : Maximize2} onClick={() => setFull((x) => !x)}>{full ? t('Back to the page') : t('Full screen')}</Button>
        </div>
      </div>
      <ErrorNote error={err} />
      <div className="bpmn-body">
        <ShapePalette modeler={ready} canEdit={diagram.canEdit} open={paletteOpen} onToggle={() => setPaletteOpen((x) => !x)} />
        <div className={`bpmn-host ${diagram.canEdit ? '' : 'readonly'}`} ref={host} aria-label={t('BPMN canvas')} />
      </div>
      <p className="chart-caption">{diagram.canEdit ? t('Shapes palette on the left (slide it away with its button). Scroll or use the slider to zoom; drag the background to move around.') : t('Scroll to zoom, drag to pan.')}</p>
    </div>
  );
}

export default function Bpmn() {
  const { id } = useParams();
  const { t } = useI18n();
  const nav = useNavigate();
  const list = useFetch('/bpmn');
  const one = useFetch(id ? `/bpmn/${id}` : null);
  const { can } = useAuth();
  if (id) {
    if (one.error) return <div className="page"><ErrorNote error={one.error} /></div>;
    if (!one.data) return <div className="page"><Skeleton h={600} /></div>;
    return (
      <div className="page">
        <PageHeader eyebrow={<><Link to="/bpmn">{t('BPMN diagrams')}</Link>{one.data.e2e_id ? ` · ${one.data.e2e_id}` : ''}</>} title={one.data.title} subtitle={one.data.description} />
        <div className="callout neutral" style={{ marginBottom: 12 }}>{t('This diagram documents the process for your organization. Saving it does not change the tasks of running or future projects: project tasks come from the process reference of the E2E process.')}</div>
        <Card><Modeler diagram={one.data} onSaved={one.reload} /></Card>
      </div>
    );
  }
  return (
    <div className="page">
      <PageHeader eyebrow={t('Process design')} title={t('BPMN diagrams')} subtitle={t('Standard BPMN 2.0 models, one per E2E process. {e}', { e: can('bpmn.edit') ? t('You can edit and save them.') : t('You can view them.') })} />
      {!list.data ? <Skeleton /> : <Card><DataTable csvName="bpmn" rows={list.data} onRowClick={(d) => nav(`/bpmn/${d.id}`)} columns={[
        { key: 'title', label: t('Diagram'), render: (d) => <span className="strong">{d.title}</span> }, { key: 'description', label: t('Description'), render: (d) => <span className="small">{d.description}</span> },
        { key: 'updated_at', label: t('Updated'), render: (d) => fmtDate(d.updated_at) },
      ]} /></Card>}
    </div>
  );
}
