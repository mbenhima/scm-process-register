import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Download, Upload, Save } from 'lucide-react';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import { useAuth } from '../../lib/auth.jsx';
import { useI18n } from '../../lib/i18n.jsx';
import { put } from '../../lib/api.js';
import { PageHeader, Card, DataTable, useFetch, Skeleton, Button, useToast, ErrorNote, Badge, fmtDate } from '../../components/ui.jsx';

function Modeler({ diagram, onSaved }) {
  const { t } = useI18n();
  const toast = useToast();
  const host = useRef(null);
  const inst = useRef(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const Mod = diagram.canEdit ? (await import('bpmn-js/lib/Modeler')).default : (await import('bpmn-js/lib/NavigatedViewer')).default;
      if (!alive) return;
      inst.current = new Mod({ container: host.current });
      try { await inst.current.importXML(diagram.xml); inst.current.get('canvas').zoom('fit-viewport'); } catch (e) { setErr(e); }
    })();
    return () => { alive = false; inst.current?.destroy(); };
  }, [diagram.id, diagram.canEdit]); // eslint-disable-line react-hooks/exhaustive-deps
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
    <>
      <div className="row" style={{ marginBottom: 12 }}>
        <Button icon={Download} onClick={exportXml}>{t('Export .bpmn')}</Button>
        {diagram.canEdit && <label className="btn btn-secondary"><Upload aria-hidden />{t('Import .bpmn')}<input type="file" accept=".bpmn,.xml" className="sr-only" onChange={importXml} /></label>}
        {diagram.canEdit && <Button variant="primary" icon={Save} onClick={save}>{t('Save diagram')}</Button>}
        {!diagram.canEdit && <Badge>{t('View only: pan and zoom')}</Badge>}
      </div>
      <ErrorNote error={err} />
      <div className={`bpmn-host ${diagram.canEdit ? '' : 'readonly'}`} ref={host} aria-label={t('BPMN canvas')} />
      <p className="chart-caption">{diagram.canEdit ? t('Tool palette on the left; drag elements onto the canvas.') : t('Scroll to zoom, drag to pan.')}</p>
    </>
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
        <Card><Modeler diagram={one.data} onSaved={one.reload} /></Card>
      </div>
    );
  }
  return (
    <div className="page">
      <PageHeader eyebrow={t('Governance')} title={t('BPMN diagrams')} subtitle={t('Standard BPMN 2.0 models, one per E2E process. {e}', { e: can('bpmn.edit') ? t('You can edit and save them.') : t('You can view them.') })} />
      {!list.data ? <Skeleton /> : <Card><DataTable csvName="bpmn" rows={list.data} onRowClick={(d) => nav(`/bpmn/${d.id}`)} columns={[
        { key: 'title', label: t('Diagram'), render: (d) => <span className="strong">{d.title}</span> }, { key: 'description', label: t('Description'), render: (d) => <span className="small">{d.description}</span> },
        { key: 'updated_at', label: t('Updated'), render: (d) => fmtDate(d.updated_at) },
      ]} /></Card>}
    </div>
  );
}
