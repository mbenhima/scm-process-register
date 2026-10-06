// Project templates: the catalog of templates (library and the organization's own) and the
// template editor. A template defines everything a new project contains — end-to-end
// processes, macro processes, tasks and steps, business rules, controls, risks and
// opportunities, alerts, KPIs and reporting — and every part is editable (full CRUD).
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Copy, Trash2, CheckCircle2, Undo2, Archive, FolderPlus, ChevronRight, ChevronDown, Workflow, Layers, ListChecks, Scale, ShieldCheck, ShieldAlert, Bell, Gauge, FileBarChart, Flag } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Card, Loading, ErrorBox, Status, Table, Tabs, Field, Modal, Kpi, tx, usePaged, Pager } from '../components/ui.jsx';
import InlineGrid from '../components/InlineGrid.jsx';

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

// ------------------------------------------------------------------ Catalog of templates
export default function ProjectTemplates() {
  const { t, L, lang, can, toast } = useApp();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useData('/project-templates');
  const [q, setQ] = useState('');
  const [ms, setMs] = useState('');
  const [origin, setOrigin] = useState('');
  const [creating, setCreating] = useState(false);
  const list = useMemo(() => (data || []).filter(x => (!ms || x.msType === ms) && (!origin || (origin === 'library' ? x.library : !x.library)) && (!q || `${x.code} ${tx(x.name, lang)}`.toLowerCase().includes(q.toLowerCase()))), [data, ms, origin, q, lang]);
  return (
    <>
      <PageHead eyebrow={t('Design')} title={t('Project templates')}
        subtitle={t('A template is the blueprint of a project: its end-to-end processes, macro processes, tasks and steps, business rules, controls, risks and opportunities, alerts, KPIs and reporting. Open a template to see and customize it.')}
        actions={can('templates.manage') && <button className="btn btn-primary" onClick={() => setCreating(true)}><Plus size={16} />{t('New template')}</button>} />
      <div className="row" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <input type="search" className="input" style={{ maxWidth: 320 }} placeholder={t('Search templates…')} aria-label={t('Search templates…')} value={q} onChange={e => setQ(e.target.value)} />
        <select className="select" style={{ width: 'auto' }} aria-label={t('Management system')} value={ms} onChange={e => setMs(e.target.value)}><option value="">{t('QMS and QHSE')}</option><option value="QMS">QMS</option><option value="QHSE">QHSE</option></select>
        <select className="select" style={{ width: 'auto' }} aria-label={t('Origin')} value={origin} onChange={e => setOrigin(e.target.value)}><option value="">{t('All origins')}</option><option value="library">{t('Library')}</option><option value="org">{t('My organization')}</option></select>
      </div>
      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data ? <Loading /> : (
        <Table rows={list} onRowClick={(x) => navigate(`/project-templates/${x.id}`)} columns={[
          { key: 'code', label: t('Code'), width: 200, render: x => <span className="mono small">{x.code}</span> },
          { key: 'name', label: t('Template'), render: x => <span className="strong">{tx(x.name, lang)}</span>, sortValue: x => tx(x.name, lang) },
          { key: 'msType', label: t('System'), width: 90 },
          { key: 'mode', label: t('Mode'), width: 90, render: x => L(x.mode) },
          { key: 'vertical', label: t('Vertical'), width: 100, render: x => x.vertical ? L(x.vertical) : t('Universal') },
          { key: 'library', label: t('Origin'), width: 130, render: x => <span className="tag outline">{x.library ? t('Library') : t('My organization')}</span> },
          { key: 'status', label: t('Status'), width: 120, render: x => <Status value={x.status} /> },
          { key: 'version', label: t('Version'), width: 80, render: x => `v${x.version}` },
          { key: 'useCount', label: t('Projects'), width: 90 },
        ]} />
      )}
      {creating && <NewTemplateModal templates={data || []} onClose={() => setCreating(false)} onCreated={(id) => { toast(t('Template created as a draft.')); navigate(`/project-templates/${id}`); }} />}
    </>
  );
}

function NewTemplateModal({ templates, onClose, onCreated }) {
  const { t, lang, toast } = useApp();
  const [f, setF] = useState({ name: '', msType: 'QMS', mode: 'FULL', copyOf: '' });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { const r = await api('/project-templates', { method: 'POST', body: f.copyOf ? { copyOf: f.copyOf, name: f.name || undefined } : f }); onCreated(r.id); } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  return (
    <Modal title={t('New template')} onClose={onClose} footer={<><button className="btn" onClick={onClose}>{t('Cancel')}</button><button className="btn btn-primary" disabled={busy || (!f.copyOf && !f.name.trim())} onClick={save}>{t('Create')}</button></>}>
      <div className="stack">
        <Field label={t('Start from')}>{(id) => <select id={id} className="select" value={f.copyOf} onChange={e => setF({ ...f, copyOf: e.target.value })}><option value="">{t('The reference catalog (blank template)')}</option>{templates.map(x => <option key={x.id} value={x.id}>{x.code} — {tx(x.name, lang)}</option>)}</select>}</Field>
        <Field label={t('Name')} required={!f.copyOf}>{(id) => <input id={id} className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />}</Field>
        {!f.copyOf && (
          <div className="form-grid">
            <Field label={t('Management system')}>{(id) => <select id={id} className="select" value={f.msType} onChange={e => setF({ ...f, msType: e.target.value })}><option value="QMS">{t('QMS — ISO 9001')}</option><option value="QHSE">{t('QHSE — ISO 9001, 14001, 45001')}</option></select>}</Field>
            <Field label={t('Mode')}>{(id) => <select id={id} className="select" value={f.mode} onChange={e => setF({ ...f, mode: e.target.value })}><option value="FULL">{t('Full lifecycle')}</option><option value="SME">{t('SME quick start')}</option></select>}</Field>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------------ Template editor
// A tab panel mounted on first visit and then only hidden, so its drafts survive tab switches.
function TabPanel({ id, tab, seen, children }) {
  if (!seen.current.tabs.has(id)) return null;
  return <div hidden={tab !== id}>{children}</div>;
}

export function ProjectTemplate() {
  const { id } = useParams();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') || 'overview';
  // Tabs already opened stay mounted (hidden): switching tab keeps unsaved input of the others.
  const seen = useRef({ id: null, tabs: new Set() });
  if (seen.current.id !== id) seen.current = { id, tabs: new Set() };
  seen.current.tabs.add(tab);
  const { t, L, lang, toast } = useApp();
  const navigate = useNavigate();
  const { data, loading, error, reload, setData } = useData(`/project-templates/${id}`);
  const [saving, setSaving] = useState(false);

  const put = useCallback(async (body) => {
    setSaving(true);
    try { await api(`/project-templates/${id}`, { method: 'PUT', body }); return true; } catch (e) { toast(e.message, 'error'); throw e; } finally { setSaving(false); }
  }, [id, toast]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const d = data;
  const ro = !d.canEdit;
  const status = async (s) => { try { await api(`/project-templates/${id}/status`, { method: 'POST', body: { status: s } }); toast(s === 'Published' ? t('Template published: it is offered when creating a project.') : t('Status changed.')); reload(); } catch (e) { toast(e.message, 'error'); } };
  const copy = async () => { try { const r = await api('/project-templates', { method: 'POST', body: { copyOf: id } }); toast(t('Copy created: you can now customize it.')); navigate(`/project-templates/${r.id}`); } catch (e) { toast(e.message, 'error'); } };
  const del = async () => {
    if (!window.confirm(t('Delete this template? A template used by projects is retired instead.'))) return;
    try { const r = await api(`/project-templates/${id}`, { method: 'DELETE' }); toast(r.status === 'Retired' ? t('Template retired: projects use it.') : t('Template deleted.')); navigate('/project-templates'); } catch (e) { toast(e.message, 'error'); }
  };
  const tabs = [
    { id: 'overview', label: t('Overview') },
    { id: 'processes', label: t('Processes and steps'), count: d.counts.steps },
    { id: 'rules', label: t('Business rules'), count: d.counts.rules },
    { id: 'controls', label: t('Controls'), count: d.counts.controls },
    { id: 'risks', label: t('Risks and opportunities'), count: d.counts.risks },
    { id: 'alerts', label: t('Alerts'), count: d.counts.alerts },
    { id: 'kpis', label: t('KPIs'), count: d.counts.kpis },
    { id: 'reports', label: t('Reporting'), count: d.counts.reports },
  ];
  const saveList = (k) => async (rows) => { await put({ lists: { [k]: rows } }); setData(x => ({ ...x, lists: { ...x.lists, [k]: rows.map(({ _key, ...r }) => r) }, counts: { ...x.counts, [k]: rows.length } })); };
  return (
    <>
      <PageHead eyebrow={`${t('Project template')} · ${d.code}`} title={tx(d.name, lang)}
        subtitle={`${d.msType} · ${L(d.mode)} · ${d.vertical ? L(d.vertical) : t('Universal')} · v${d.version} · ${d.library ? t('Library') : t('My organization')}`}
        actions={<>
          <Status value={d.status} />
          {saving && <span className="small muted">{t('Saving…')}</span>}
          {d.status === 'Published' && <button className="btn" onClick={() => navigate(`/projects/new?template=${id}`)}><FolderPlus size={16} />{t('Use this template')}</button>}
          {d.library && d.canCopy && !d.canEdit && <button className="btn btn-primary" onClick={copy}><Copy size={16} />{t('Copy to customize')}</button>}
          {d.canEdit && d.status !== 'Published' && <button className="btn btn-success" onClick={() => status('Published')}><CheckCircle2 size={16} />{t('Publish')}</button>}
          {d.canEdit && d.status === 'Published' && <button className="btn" onClick={() => status('Draft')}><Undo2 size={16} />{t('Back to draft')}</button>}
          {d.canEdit && d.status !== 'Retired' && <button className="btn btn-ghost" onClick={() => status('Retired')}><Archive size={16} />{t('Retire')}</button>}
          {d.canEdit && <button className="btn btn-ghost" onClick={del} aria-label={t('Delete')}><Trash2 size={16} />{t('Delete')}</button>}
        </>} />
      {ro && <div className="callout" style={{ marginBottom: 16 }}><span className="small">{d.library ? t('Library templates are read-only. Select Copy to customize to adapt this template for your organization; your copy is offered next to it when creating a project.') : t('You can view this template; editing requires the permission to manage templates.')}</span></div>}
      <Tabs tabs={tabs} value={tab} onChange={(v) => setSp(v === 'overview' ? {} : { tab: v }, { replace: true })} label={t('Template parts')} />
      <div key={id}>
      <TabPanel id="overview" tab={tab} seen={seen}><Overview d={d} ro={ro} put={put} reload={reload} /></TabPanel>
      <TabPanel id="processes" tab={tab} seen={seen}><Processes d={d} ro={ro} put={put} reload={reload} /></TabPanel>
      <TabPanel id="rules" tab={tab} seen={seen}><InlineGrid id={`tpl-rules`} readOnly={ro} rows={d.lists.rules} onSave={saveList('rules')} countLabel={n => t('{n} business rules', { n })} addLabel={t('Add a rule')} newRow={() => ({ type: 'Validation', severity: 'Medium', owner: 'ims_manager' })}
        columns={[
          { key: 'id', label: t('Code'), width: 110, required: true, placeholder: 'BR-…' },
          { key: 'mp', label: t('Macro process'), type: 'select', options: d.mpOptions.map(m => ({ value: m.id, label: `${m.code} ${m.name}` })), width: 220, carry: true },
          { key: 'condition', label: t('Condition'), type: 'textarea', required: true, width: 300 },
          { key: 'action', label: t('Action'), type: 'textarea', required: true, width: 240 },
          { key: 'type', label: t('Type'), type: 'select', required: true, options: ['Validation', 'Calculation', 'Routing', 'Notification', 'Constraint'].map(v => ({ value: v, label: L(v) })), width: 140 },
          { key: 'severity', label: t('Severity'), type: 'select', required: true, options: SEVERITIES.map(v => ({ value: v, label: L(v) })), width: 120 },
          { key: 'owner', label: t('Owner'), type: 'select', required: true, options: d.roles.map(r => ({ value: r.code, label: r.name })), width: 200 },
        ]} /></TabPanel>
      <TabPanel id="controls" tab={tab} seen={seen}><InlineGrid id="tpl-controls" readOnly={ro} rows={d.lists.controls} onSave={saveList('controls')} countLabel={n => t('{n} controls', { n })} addLabel={t('Add a control')} newRow={() => ({ type: 'Preventive', frequency: 'Quarterly', owner: 'ims_manager' })}
        columns={[
          { key: 'id', label: t('Code'), width: 110, required: true, placeholder: 'CTL-…' },
          { key: 'name', label: t('Control'), required: true, width: 280 },
          { key: 'description', label: t('Description'), type: 'textarea', width: 300 },
          { key: 'type', label: t('Type'), type: 'select', required: true, options: ['Preventive', 'Detective', 'Corrective', 'Directive'].map(v => ({ value: v, label: L(v) })), width: 140 },
          { key: 'frequency', label: t('Frequency'), type: 'select', required: true, options: ['Continuous', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semi-annual', 'Annual', 'Per event'].map(v => ({ value: v, label: L(v) })), width: 140 },
          { key: 'owner', label: t('Owner'), type: 'select', required: true, options: d.roles.map(r => ({ value: r.code, label: r.name })), width: 200 },
          { key: 'mp', label: t('Macro process'), type: 'select', options: d.mpOptions.map(m => ({ value: m.id, label: `${m.code} ${m.name}` })), width: 220, carry: true },
        ]} /></TabPanel>
      <TabPanel id="risks" tab={tab} seen={seen}><InlineGrid id="tpl-risks" readOnly={ro} rows={d.lists.risks} onSave={saveList('risks')} countLabel={n => t('{n} risks and opportunities', { n })} addLabel={t('Add a risk or opportunity')} newRow={() => ({ kind: 'Risk', likelihood: 3, impact: 3, owner: 'risk_manager' })}
        columns={[
          { key: 'id', label: t('Code'), width: 110, required: true, placeholder: 'RSK-…' },
          { key: 'kind', label: t('Kind'), type: 'select', required: true, options: ['Risk', 'Opportunity'].map(v => ({ value: v, label: L(v) })), width: 130, carry: true },
          { key: 'title', label: t('Title'), required: true, width: 300 },
          { key: 'category', label: t('Category'), width: 140, carry: true },
          { key: 'likelihood', label: t('Likelihood (1–5)'), type: 'number', min: 1, max: 5, required: true, width: 110, validate: v => (v < 1 || v > 5 ? t('From 1 to 5') : null) },
          { key: 'impact', label: t('Impact (1–5)'), type: 'number', min: 1, max: 5, required: true, width: 110, validate: v => (v < 1 || v > 5 ? t('From 1 to 5') : null) },
          { key: 'score', label: t('Score'), readOnly: true, width: 80, render: r => (+r.likelihood || 0) * (+r.impact || 0) },
          { key: 'treatment', label: t('Treatment'), width: 160 },
          { key: 'owner', label: t('Owner'), type: 'select', required: true, options: d.roles.map(r => ({ value: r.code, label: r.name })), width: 200 },
          { key: 'mp', label: t('Macro process'), type: 'select', options: d.mpOptions.map(m => ({ value: m.id, label: `${m.code} ${m.name}` })), width: 220 },
        ]} /></TabPanel>
      <TabPanel id="alerts" tab={tab} seen={seen}><InlineGrid id="tpl-alerts" readOnly={ro} rows={d.lists.alerts} onSave={saveList('alerts')} countLabel={n => t('{n} alerts', { n })} addLabel={t('Add an alert')} newRow={() => ({ severity: 'Medium', enabled: true, escalation: 'ims_manager' })}
        columns={[
          { key: 'id', label: t('Code'), width: 150, required: true, placeholder: 'ALR-…' },
          { key: 'name', label: t('Alert'), required: true, width: 340 },
          { key: 'severity', label: t('Severity'), type: 'select', required: true, options: SEVERITIES.map(v => ({ value: v, label: L(v) })), width: 120 },
          { key: 'escalation', label: t('Escalated to'), type: 'select', required: true, options: d.roles.map(r => ({ value: r.code, label: r.name })), width: 220 },
          { key: 'enabled', label: t('Active'), type: 'checkbox', width: 90 },
        ]} /></TabPanel>
      <TabPanel id="kpis" tab={tab} seen={seen}><InlineGrid id="tpl-kpis" readOnly={ro} rows={d.lists.kpis} onSave={saveList('kpis')} countLabel={n => t('{n} KPIs', { n })} addLabel={t('Add a KPI')} newRow={() => ({ frequency: 'Monthly', owner: 'performance_manager' })}
        columns={[
          { key: 'id', label: t('Code'), width: 110, required: true, placeholder: 'KPI-…' },
          { key: 'name', label: t('KPI'), required: true, width: 260 },
          { key: 'formula', label: t('Formula'), type: 'textarea', required: true, width: 280 },
          { key: 'target', label: t('Target'), required: true, width: 110, placeholder: '≥ 95%' },
          { key: 'unit', label: t('Unit'), width: 80 },
          { key: 'frequency', label: t('Frequency'), type: 'select', required: true, options: ['Weekly', 'Monthly', 'Quarterly', 'Semi-annual', 'Annual'].map(v => ({ value: v, label: L(v) })), width: 140 },
          { key: 'owner', label: t('Owner'), type: 'select', required: true, options: d.roles.map(r => ({ value: r.code, label: r.name })), width: 200 },
          { key: 'mp', label: t('Macro process'), type: 'select', options: d.mpOptions.map(m => ({ value: m.id, label: `${m.code} ${m.name}` })), width: 220, carry: true },
        ]} /></TabPanel>
      <TabPanel id="reports" tab={tab} seen={seen}><InlineGrid id="tpl-reports" readOnly={ro} rows={d.lists.reports} onSave={saveList('reports')} countLabel={n => t('{n} reports', { n })} addLabel={t('Add a report')} newRow={() => ({ format: 'PDF', owner: 'ims_manager' })}
        columns={[
          { key: 'id', label: t('Code'), width: 110, required: true, placeholder: 'RPT-…' },
          { key: 'name', label: t('Report'), required: true, width: 300 },
          { key: 'audience', label: t('Audience'), width: 220 },
          { key: 'frequency', label: t('Frequency'), required: true, width: 160 },
          { key: 'format', label: t('Format'), type: 'select', required: true, options: ['PDF', 'DOCX', 'XLSX', 'CSV', 'Dashboard'].map(v => ({ value: v, label: v })), width: 120 },
          { key: 'owner', label: t('Owner'), type: 'select', required: true, options: d.roles.map(r => ({ value: r.code, label: r.name })), width: 200 },
        ]} /></TabPanel>
      </div>
    </>
  );
}

function Overview({ d, ro, put, reload }) {
  const { t, lang } = useApp();
  const [f, setF] = useState({ name: tx(d.name, lang), description: tx(d.description, lang) || '', msType: d.msType, mode: d.mode });
  const dirty = f.name !== tx(d.name, lang) || f.description !== (tx(d.description, lang) || '') || f.msType !== d.msType || f.mode !== d.mode;
  const c = d.counts;
  const tiles = [[Workflow, c.e2e, t('End-to-end processes')], [Layers, c.mps, t('Macro processes')], [ListChecks, c.steps, t('Steps')], [Flag, c.gates, t('Gates')], [Scale, c.rules, t('Business rules')], [ShieldCheck, c.controls, t('Controls')], [ShieldAlert, c.risks, t('Risks and opportunities')], [Bell, c.alerts, t('Alerts')], [Gauge, c.kpis, t('KPIs')], [FileBarChart, c.reports, t('Reports')]];
  return (
    <div className="grid-main">
      <Card title={t('Template')}>
        <div className="stack">
          <Field label={t('Name')} required>{(id) => <input id={id} className="input" disabled={ro} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />}</Field>
          <Field label={t('Description')}>{(id) => <textarea id={id} className="textarea" disabled={ro} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />}</Field>
          <div className="form-grid">
            <Field label={t('Management system')}>{(id) => <select id={id} className="select" disabled={ro} value={f.msType} onChange={e => setF({ ...f, msType: e.target.value })}><option value="QMS">{t('QMS — ISO 9001')}</option><option value="QHSE">{t('QHSE — ISO 9001, 14001, 45001')}</option></select>}</Field>
            <Field label={t('Mode')}>{(id) => <select id={id} className="select" disabled={ro} value={f.mode} onChange={e => setF({ ...f, mode: e.target.value })}><option value="FULL">{t('Full lifecycle')}</option><option value="SME">{t('SME quick start')}</option></select>}</Field>
          </div>
          {!ro && <div className="row"><button className="btn btn-primary" disabled={!dirty || !f.name.trim()} onClick={async () => { await put(f); reload(); }}>{t('Save')}</button></div>}
        </div>
      </Card>
      <div className="stack">
        <div className="grid-kpi" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>{tiles.map(([I, v, l]) => <Kpi key={l} value={v} label={l} icon={I} />)}</div>
        <p className="caption">{t('What a project created from this template contains. Excluded items stay in the template and can be included again.')}</p>
      </div>
    </div>
  );
}

// Phases → macro processes → steps, each with include, name and owner / role; custom items
// can be added, renamed and deleted.
function Processes({ d, ro, put, reload }) {
  const { t, lang } = useApp();
  const [open, setOpen] = useState(() => d.structure.find(e => e.include)?.id || d.structure[0]?.id);
  const [openMp, setOpenMp] = useState(null);
  const [adding, setAdding] = useState(null); // { kind, parent }
  const [st, setSt] = useState(d.structure);
  const roleOpts = d.roles;
  const patch = useCallback(async (kind, id, fields) => {
    setSt(s => s.map(e => (kind === 'e2e' && e.id === id ? { ...e, ...fields } : { ...e, mps: e.mps.map(m => (kind === 'mp' && m.id === id ? { ...m, ...fields } : { ...m, steps: m.steps.map(x => (kind === 'step' && x.id === id ? { ...x, ...fields } : x)) })) })));
    await put({ [kind]: { [id]: fields } }).catch(() => reload());
  }, [put, reload]);
  const removeCustom = async (kind, id) => {
    if (!window.confirm(t('Delete this custom element and everything it contains?'))) return;
    await put({ custom: { [kind]: { remove: [id] } } }); reload();
  };
  const phase = st.find(e => e.id === open) || st[0];
  return (
    <div>
      <div className="stack">
        <Card title={t('End-to-end processes')} action={!ro && <button className="btn btn-sm" onClick={() => setAdding({ kind: 'e2e', parent: phase?.id })}><Plus size={16} />{t('Add a phase')}</button>}>
          <div className="tpl-phases" role="listbox" aria-label={t('End-to-end processes')}>
            {st.map(e => (
              <div key={e.id} className={`tpl-phase ${e.id === phase?.id ? 'on' : ''} ${e.include ? '' : 'off'}`}>
                <input type="checkbox" checked={e.include} disabled={ro} aria-label={t('Include {x}', { x: e.id })} onChange={ev => patch('e2e', e.id, { include: ev.target.checked })} />
                <button type="button" className="tpl-phase-btn" aria-selected={e.id === phase?.id} role="option" onClick={() => { setOpen(e.id); setOpenMp(null); }}>
                  <span className="mono xsmall muted">{e.custom ? t('Custom') : e.id}</span>
                  <span className="small strong">{tx(e.name, lang)}</span>
                  <span className="xsmall muted">{t('{n} of {m} macro processes', { n: e.mps.filter(m => m.include).length, m: e.mps.length })}</span>
                </button>
                <label className="xsmall tpl-gate" title={t('Gate at the end of the phase')}><input type="checkbox" checked={e.gate} disabled={ro} onChange={ev => patch('e2e', e.id, { gate: ev.target.checked })} /><Flag size={14} aria-hidden="true" />{t('Gate')}</label>
              </div>
            ))}
          </div>
        </Card>
        {phase && (
          <Card title={`${phase.custom ? '' : `${phase.id} — `}${tx(phase.name, lang)}`} action={!ro && <div className="row">
            <button className="btn btn-sm" onClick={() => setAdding({ kind: 'mp', parent: phase.id })}><Plus size={16} />{t('Add a macro process')}</button>
            {phase.custom && <button className="btn btn-sm btn-ghost" onClick={() => removeCustom('e2e', phase.id)}><Trash2 size={16} />{t('Delete the phase')}</button>}
          </div>}>
            {!ro && <NameEditor key={phase.id} value={tx(phase.name, lang)} label={t('Phase name')} onSave={(v) => patch('e2e', phase.id, { name: v })} />}
            <MpList phase={phase} ro={ro} roles={roleOpts} openMp={openMp} setOpenMp={setOpenMp} patch={patch} removeCustom={removeCustom} onAddStep={(mp) => setAdding({ kind: 'step', parent: mp })} />
          </Card>
        )}
      </div>
      {adding && <AddElement kind={adding.kind} parent={adding.parent} d={d} st={st} onClose={() => setAdding(null)} onDone={async (item) => { await put({ custom: { [adding.kind]: { add: [item] } } }); setAdding(null); reload(); }} />}
    </div>
  );
}

const NameEditor = memo(function NameEditor({ value, label, onSave }) {
  const [v, setV] = useState(value);
  return (
    <div className="row" style={{ marginBottom: 12 }}>
      <label className="sr-only" htmlFor="tpl-phase-name">{label}</label>
      <input id="tpl-phase-name" className="input" value={v} onChange={e => setV(e.target.value)} onBlur={() => { if (v.trim() && v !== value) onSave(v.trim()); }} />
    </div>
  );
});

function MpList({ phase, ro, roles, openMp, setOpenMp, patch, removeCustom, onAddStep }) {
  const { t, lang } = useApp();
  const { shown, pager, needed } = usePaged(phase.mps, phase.id);
  return (
    <div className="stack-8">
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th scope="col" style={{ width: 70 }}>{t('Include')}</th><th scope="col" style={{ width: 110 }}>{t('Code')}</th><th scope="col">{t('Macro process')}</th><th scope="col" style={{ width: 220 }}>{t('Owner')}</th><th scope="col" style={{ width: 100 }}>{t('Steps')}</th><th scope="col" style={{ width: 90 }}><span className="sr-only">{t('Actions')}</span></th></tr></thead>
          <tbody>
            {shown.map(m => (
              <MpRow key={m.id} m={m} ro={ro} roles={roles} open={openMp === m.id} toggle={() => setOpenMp(openMp === m.id ? null : m.id)} patch={patch} removeCustom={removeCustom} onAddStep={onAddStep} lang={lang} t={t} />
            ))}
          </tbody>
        </table>
      </div>
      {needed && <Pager {...pager} />}
    </div>
  );
}

const MpRow = memo(function MpRow({ m, ro, roles, open, toggle, patch, removeCustom, onAddStep, lang, t }) {
  const [name, setName] = useState(tx(m.name, lang));
  const inc = m.steps.filter(s => s.include).length;
  return (
    <>
      <tr className={m.include ? '' : 'row-off'}>
        <td><input type="checkbox" checked={m.include} disabled={ro} aria-label={t('Include {x}', { x: m.code })} onChange={e => patch('mp', m.id, { include: e.target.checked })} /></td>
        <td className="mono small">{m.code}{m.custom && <span className="tag outline" style={{ marginInlineStart: 6 }}>{t('Custom')}</span>}</td>
        <td>{ro ? <span className="strong">{name}</span> : <input className="grid-input strong" aria-label={t('Macro process name')} value={name} onChange={e => setName(e.target.value)} onBlur={() => { if (name.trim() && name !== tx(m.name, lang)) patch('mp', m.id, { name: name.trim() }); }} />}</td>
        <td><select className="grid-input" disabled={ro} aria-label={t('Owner')} value={m.owner} onChange={e => patch('mp', m.id, { owner: e.target.value })}>{roles.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}</select></td>
        <td><button type="button" className="btn btn-ghost btn-sm" aria-expanded={open} onClick={toggle}>{open ? <ChevronDown size={16} /> : <ChevronRight size={16} className="flip-rtl" />}{inc}/{m.steps.length}</button></td>
        <td>{m.custom && !ro && <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={t('Delete')} onClick={() => removeCustom('mp', m.id)}><Trash2 size={16} /></button>}</td>
      </tr>
      {open && (
        <tr className="tpl-steps-row"><td colSpan={6}>
          <div className="stack-8">
            <table className="data tpl-steps">
              <thead><tr><th scope="col" style={{ width: 70 }}>{t('Include')}</th><th scope="col" style={{ width: 120 }}>{t('Step')}</th><th scope="col">{t('Name')}</th><th scope="col" style={{ width: 220 }}>{t('Role')}</th><th scope="col" style={{ width: 60 }}><span className="sr-only">{t('Actions')}</span></th></tr></thead>
              <tbody>{m.steps.map(s => <StepRow key={s.id} s={s} ro={ro} roles={roles} patch={patch} removeCustom={removeCustom} lang={lang} t={t} />)}</tbody>
            </table>
            {!ro && <div><button className="btn btn-sm" onClick={() => onAddStep(m.id)}><Plus size={16} />{t('Add a step')}</button></div>}
          </div>
        </td></tr>
      )}
    </>
  );
});

const StepRow = memo(function StepRow({ s, ro, roles, patch, removeCustom, lang, t }) {
  const [name, setName] = useState(tx(s.name, lang));
  return (
    <tr className={s.include ? '' : 'row-off'}>
      <td><input type="checkbox" checked={s.include} disabled={ro} aria-label={t('Include {x}', { x: s.id })} onChange={e => patch('step', s.id, { include: e.target.checked })} /></td>
      <td className="mono xsmall">{s.custom ? t('Custom') : s.id}</td>
      <td>{ro ? name : <input className="grid-input" aria-label={t('Step name')} value={name} onChange={e => setName(e.target.value)} onBlur={() => { if (name.trim() && name !== tx(s.name, lang)) patch('step', s.id, { name: name.trim() }); }} />}</td>
      <td><select className="grid-input" disabled={ro} aria-label={t('Role')} value={s.role} onChange={e => patch('step', s.id, { role: e.target.value })}>{roles.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}</select></td>
      <td>{s.custom && !ro && <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={t('Delete')} onClick={() => removeCustom('step', s.id)}><Trash2 size={16} /></button>}</td>
    </tr>
  );
});

function AddElement({ kind, parent, d, st, onClose, onDone }) {
  const { t, lang } = useApp();
  const [f, setF] = useState({ name: '', after: parent || '', e2e: parent || '', mp: parent || '', owner: 'ims_manager', role: 'ims_manager', type: 'User Task', goal: '', brief: '' });
  const [busy, setBusy] = useState(false);
  const title = { e2e: t('Add a phase'), mp: t('Add a macro process'), step: t('Add a step') }[kind];
  const submit = async () => { setBusy(true); try { await onDone(kind === 'e2e' ? { name: f.name, after: f.after, goals: f.goal } : kind === 'mp' ? { name: f.name, e2e: f.e2e, owner: f.owner, goal: f.goal } : { name: f.name, mp: f.mp, role: f.role, type: f.type, brief: f.brief }); } finally { setBusy(false); } };
  return (
    <Modal title={title} onClose={onClose} footer={<><button className="btn" onClick={onClose}>{t('Cancel')}</button><button className="btn btn-primary" disabled={busy || !f.name.trim()} onClick={submit}>{t('Add')}</button></>}>
      <div className="stack">
        <Field label={t('Name')} required hint={kind === 'step' ? t('Start with a verb and name the object, e.g. "Validate supplier list".') : undefined}>{(id) => <input id={id} className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />}</Field>
        {kind === 'e2e' && <Field label={t('Place after')}>{(id) => <select id={id} className="select" value={f.after} onChange={e => setF({ ...f, after: e.target.value })}>{st.map(e => <option key={e.id} value={e.id}>{e.custom ? '' : `${e.id} — `}{tx(e.name, lang)}</option>)}</select>}</Field>}
        {kind === 'mp' && <Field label={t('End-to-end process')}>{(id) => <select id={id} className="select" value={f.e2e} onChange={e => setF({ ...f, e2e: e.target.value })}>{st.map(e => <option key={e.id} value={e.id}>{e.custom ? '' : `${e.id} — `}{tx(e.name, lang)}</option>)}</select>}</Field>}
        {kind === 'mp' && <Field label={t('Owner')}>{(id) => <select id={id} className="select" value={f.owner} onChange={e => setF({ ...f, owner: e.target.value })}>{d.roles.map(r => <option key={r.code} value={r.code}>{tx(r.name, lang)}</option>)}</select>}</Field>}
        {kind === 'step' && <div className="form-grid">
          <Field label={t('Role')}>{(id) => <select id={id} className="select" value={f.role} onChange={e => setF({ ...f, role: e.target.value })}>{d.roles.map(r => <option key={r.code} value={r.code}>{tx(r.name, lang)}</option>)}</select>}</Field>
          <Field label={t('Step type')}>{(id) => <select id={id} className="select" value={f.type} onChange={e => setF({ ...f, type: e.target.value })}>{d.stepTypes.map(x => <option key={x} value={x}>{x}</option>)}</select>}</Field>
        </div>}
        {kind !== 'step' ? <Field label={kind === 'e2e' ? t('Goals') : t('Purpose')}>{(id) => <textarea id={id} className="textarea" value={f.goal} onChange={e => setF({ ...f, goal: e.target.value })} />}</Field>
          : <Field label={t('What to record')}>{(id) => <textarea id={id} className="textarea" value={f.brief} onChange={e => setF({ ...f, brief: e.target.value })} />}</Field>}
      </div>
    </Modal>
  );
}
