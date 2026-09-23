import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Plus, Download, Trash2 } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { get, post, put, del, download } from '../lib/api.js';
import { PageHeader, Card, CardHead, DataTable, useFetch, Skeleton, Button, Modal, Field, Input, Select, Check, useToast, ErrorNote, SearchBox, fmtDate } from '../components/ui.jsx';
import Gantt from '../components/Gantt.jsx';

function NodeEditor({ wbs, node, nodes, onClose, onSaved }) {
  const { t } = useI18n();
  const toast = useToast();
  const [f, setF] = useState(node?.id ? { name: node.name, planned_start: node.start || '', planned_end: node.end || '', pct: node.pct ?? '', predecessors: node.predecessors || [], parent_id: node.parent_id || '' } : { name: '', planned_start: '', planned_end: '', pct: '', predecessors: [], parent_id: '', task_id: null });
  const [q, setQ] = useState('');
  const [found, setFound] = useState([]);
  const search = async (v) => { setQ(v); if (v.length > 1) setFound(await get(`/task-search?q=${encodeURIComponent(v)}`).catch(() => [])); };
  const save = async () => {
    try {
      const body = { ...f, parent_id: f.parent_id || null, pct: f.pct === '' ? null : Number(f.pct) };
      if (node?.id) await put(`/wbs/${wbs.id}/nodes/${node.id}`, body); else await post(`/wbs/${wbs.id}/nodes`, body);
      toast.ok(t('Saved.')); onSaved(); onClose();
    } catch (e) { toast.err(e); }
  };
  return (
    <Modal wide title={node?.id ? t('Edit WBS item') : t('Add WBS item')} onClose={onClose} footer={<>
      {node?.id && <Button variant="danger" icon={Trash2} onClick={async () => { await del(`/wbs/${wbs.id}/nodes/${node.id}`); onSaved(); onClose(); }}>{t('Delete')}</Button>}
      <div className="grow" /><Button onClick={onClose}>{t('Cancel')}</Button><Button variant="primary" onClick={save} disabled={!f.name && !f.task_id}>{t('Save')}</Button></>}>
      <div className="form-grid">
        {!node?.id && (
          <Field label={t('Link a task (optional)')} full hint={t('Search any task by name or project code. Leave empty to add a summary node.')}>
            <div className="stack tight"><SearchBox value={q} onChange={search} placeholder={t('Search tasks')} />
              {found.slice(0, 8).map((x) => <button key={x.id} type="button" className={`btn btn-sm ${f.task_id === x.id ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start' }} onClick={() => setF({ ...f, task_id: x.id, name: `${x.code} ${x.name}` })}>{x.code} · {t(x.name)} · {t(x.status)}</button>)}</div>
          </Field>
        )}
        <Field label={t('Name')} full><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label={t('Parent node')}><Select value={f.parent_id} onChange={(e) => setF({ ...f, parent_id: e.target.value })} placeholder={t('Top level')} options={nodes.filter((n) => !n.task_id && n.id !== node?.id).map((n) => ({ value: n.id, label: n.name }))} /></Field>
        <Field label={t('Percent complete')}><Input type="number" min="0" max="100" value={f.pct} onChange={(e) => setF({ ...f, pct: e.target.value })} /></Field>
        <Field label={t('Planned start')} hint={t('Leave empty on a summary node to roll up its children.')}><Input type="date" value={f.planned_start} onChange={(e) => setF({ ...f, planned_start: e.target.value })} /></Field>
        <Field label={t('Planned end')}><Input type="date" value={f.planned_end} onChange={(e) => setF({ ...f, planned_end: e.target.value })} /></Field>
        <Field label={t('Predecessors')} full>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
            {nodes.filter((n) => n.id !== node?.id).map((n) => <Check key={n.id} label={n.name} checked={f.predecessors.includes(n.id)} onChange={(e) => setF({ ...f, predecessors: e.target.checked ? [...f.predecessors, n.id] : f.predecessors.filter((p) => p !== n.id) })} />)}
          </div>
        </Field>
      </div>
    </Modal>
  );
}

export default function Wbs() {
  const { id } = useParams();
  const { t } = useI18n();
  const { can } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const list = useFetch(id ? null : '/wbs');
  const one = useFetch(id ? `/wbs/${id}` : null);
  const projects = useFetch(id ? null : '/projects');
  const [create, setCreate] = useState(null);
  const [edit, setEdit] = useState(null);
  if (id) {
    if (one.error) return <div className="page"><ErrorNote error={one.error} /></div>;
    if (!one.data) return <div className="page"><Skeleton h={500} /></div>;
    const w = one.data;
    return (
      <div className="page">
        <PageHeader eyebrow={<Link to="/wbs">{t('WBS & Gantt')}</Link>} title={w.name} subtitle={w.description}
          actions={<>{can('wbs.manage') && <Button icon={Plus} onClick={() => setEdit({})}>{t('Add item')}</Button>}<Button icon={Download} onClick={() => download(`/wbs/${w.id}/export/pdf`)}>{t('Export PDF')}</Button>
            {can('wbs.manage') && <Button variant="danger" icon={Trash2} onClick={async () => { if (window.confirm(t('Delete this WBS? Tasks themselves are not deleted.'))) { await del(`/wbs/${w.id}`); nav('/wbs'); } }}>{t('Delete')}</Button>}</>} />
        <Card style={{ marginBottom: 24 }}><Gantt nodes={w.nodes} onSelect={can('wbs.manage') ? setEdit : undefined} /></Card>
        <Card><CardHead title={t('Items')} />
          <DataTable csvName={`wbs_${w.id}`} rows={w.nodes} pageSize={100} onRowClick={can('wbs.manage') ? setEdit : undefined} columns={[
            { key: 'name', label: t('Item'), render: (n) => <span style={{ paddingInlineStart: n.depth * 16, fontWeight: n.summary ? 700 : 400 }}>{n.name}</span> },
            { key: 'start', label: t('Start'), render: (n) => fmtDate(n.start) }, { key: 'end', label: t('End'), render: (n) => fmtDate(n.end) }, { key: 'pct', label: '%', num: true },
            { key: 'state', label: t('State'), render: (n) => t(n.state) }, { key: 'predecessors', label: t('Predecessors'), csv: (n) => n.predecessors.length, render: (n) => n.predecessors.length || '—' },
          ]} />
        </Card>
        {edit && <NodeEditor wbs={w} node={edit.id ? edit : null} nodes={w.nodes} onClose={() => setEdit(null)} onSaved={one.reload} />}
      </div>
    );
  }
  return (
    <div className="page">
      <PageHeader eyebrow={t('Planning')} title={t('WBS & Gantt')} subtitle={t('Group any tasks, from any project, into a work breakdown and schedule it.')}
        actions={can('wbs.manage') && <Button variant="primary" icon={Plus} onClick={() => setCreate({ name: '', project_id: '', fromProject: true })}>{t('New WBS')}</Button>} />
      {!list.data ? <Skeleton /> : <Card><DataTable csvName="wbs" rows={list.data} onRowClick={(w) => nav(`/wbs/${w.id}`)} columns={[
        { key: 'name', label: t('Name'), render: (w) => <span className="strong">{w.name}</span> }, { key: 'project_code', label: t('Project') }, { key: 'nodes', label: t('Items'), num: true }, { key: 'created_at', label: t('Created'), render: (w) => fmtDate(w.created_at) },
      ]} /></Card>}
      {create && (
        <Modal title={t('New WBS')} onClose={() => setCreate(null)} footer={<><Button onClick={() => setCreate(null)}>{t('Cancel')}</Button><Button variant="primary" disabled={!create.name.trim()} onClick={async () => { try { const r = await post('/wbs', { ...create, project_id: Number(create.project_id) || null }); nav(`/wbs/${r.id}`); } catch (e) { toast.err(e); } }}>{t('Create')}</Button></>}>
          <div className="form-grid">
            <Field label={t('Name')} required full><Input value={create.name} onChange={(e) => setCreate({ ...create, name: e.target.value })} /></Field>
            <Field label={t('Project (optional)')} full><Select value={create.project_id} onChange={(e) => setCreate({ ...create, project_id: e.target.value })} placeholder={t('None')} options={(projects.data || []).map((p) => ({ value: p.id, label: `${p.code} ${p.name}` }))} /></Field>
            {create.project_id && <Check label={t('Fill it with all tasks of this project, grouped by E2E run')} checked={create.fromProject} onChange={(e) => setCreate({ ...create, fromProject: e.target.checked })} />}
          </div>
        </Modal>
      )}
    </div>
  );
}
