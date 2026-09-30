// Process design editor (FR-DA-PDM): full create, read, update and delete on functions,
// phases, macro processes, tasks, steps, gates and checklists, with version history,
// comparison and restore of any version. Changes apply to projects started after them.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Loading, ErrorBox, Status, Tabs, Table, tx, Modal, Field, Card } from '../components/ui.jsx';
import VersionsModal from '../components/Versions.jsx';
import { useIdName } from '../lib/names.js';

const TYPES = ['function', 'e2e', 'mp', 'task', 'step', 'gate', 'checklist'];
const TEXT = ['name', 'brief', 'description', 'goal', 'goals', 'trigger', 'terminal', 'purpose', 'entry_criteria', 'exit_criteria'];
const LONG = ['description', 'goal', 'goals', 'purpose', 'entry_criteria', 'exit_criteria', 'brief'];

export default function ProcessDesign() {
  const idName = useIdName();
  const { t, L, lang, project, me, toast, can, readOnly } = useApp();
  const [params, setParams] = useSearchParams();
  const [type, setType] = useState(params.get('type') || 'mp');
  const [q, setQ] = useState('');
  const [parent, setParent] = useState(type === 'step' || type === 'task' ? 'MP-001' : '');
  const orgId = project?.org?.id || me.org?.id;
  const list = useData(orgId ? `/orgs/${orgId}/design?type=${type}${parent ? `&parent=${parent}` : ''}&all=1` : null, [type, parent]);
  const mps = useData(orgId ? `/orgs/${orgId}/design?type=mp` : null);
  const fns = useData(orgId ? `/orgs/${orgId}/design?type=function` : null);
  const { data: roles } = useData('/roles');
  const { data: forms } = useData('/catalog/forms');
  const [sel, setSel] = useState(null);
  const [ed, setEd] = useState(null);
  const [hist, setHist] = useState(null);
  // The menu links to a given element type (e.g. Functions): follow the address.
  useEffect(() => { const q = params.get('type'); if (q && q !== type && TYPES.includes(q)) setType(q); }, [params]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setParams({ type }, { replace: true }); if (type === 'step' || type === 'task') setParent(p => p || 'MP-001'); else setParent(''); }, [type]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!orgId) return <Loading />;
  const manage = can('process.design') && !readOnly;
  const val = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? tx(v, lang) : Array.isArray(v) ? v.map(x => (typeof x === 'object' ? tx(x.text || x, lang) : L(x))).join(', ') : v ?? '');
  const openEl = async (x) => { try { const d = await api(`/orgs/${orgId}/design/${type}/${encodeURIComponent(x.id)}?raw=1`); setSel(d); setEd({ ...Object.fromEntries(d.fields.map(k => [k, TEXT.includes(k) ? tx(d.data[k], lang) || '' : d.data[k] ?? ''])), note: '' }); } catch (e) { toast(e.message, 'error'); } };
  const save = async () => {
    try {
      const body = { note: ed.note };
      for (const k of sel.fields) body[k] = k === 'seq' ? +ed[k] : ed[k];
      if (sel.new) { const r = await api(`/orgs/${orgId}/design/${type}`, { method: 'POST', body }); toast(t('Element {id} created (version 1).', { id: r.id })); }
      else { const r = await api(`/orgs/${orgId}/design/${type}/${encodeURIComponent(sel.id)}`, { method: 'PUT', body }); toast(t('Saved as version {v}.', { v: r.version })); }
      setSel(null); list.reload();
    } catch (e) { toast(e.message, 'error'); }
  };
  const retire = async () => { const j = window.prompt(t('Justification')); if (!j) return; try { const r = await api(`/orgs/${orgId}/design/${type}/${encodeURIComponent(sel.id)}`, { method: 'DELETE', body: { justification: j } }); toast(r.status === 'Deleted' ? t('Deleted; it can be restored from its history.') : t('Retired: it is used by projects or is a reference element.')); setSel(null); list.reload(); } catch (e) { toast(e.message, 'error'); } };
  const fieldInput = (k) => {
    const common = { value: ed[k] ?? '', onChange: (e) => setEd({ ...ed, [k]: e.target.value }), disabled: !manage };
    if (k === 'ownerRoleCode' || k === 'roleCode') return (id) => <select id={id} className="select" {...common}><option value="">—</option>{(roles || []).map(r => <option key={r.code} value={r.code}>{tx(r.name, lang)}</option>)}</select>;
    if (k === 'function') return (id) => <select id={id} className="select" {...common}><option value="">—</option>{(fns.data?.items || []).map(f => <option key={f.id} value={f.id}>{f.id} {tx(f.data.name, lang)}</option>)}</select>;
    if (k === 'mp') return (id) => <select id={id} className="select" {...common}>{(mps.data?.items || []).map(m => <option key={m.id} value={m.id}>{m.data.code || m.id} {tx(m.data.name, lang)}</option>)}</select>;
    if (k === 'formKind') return (id) => <select id={id} className="select" {...common}>{Object.keys(forms || {}).map(f => <option key={f} value={f}>{tx(forms[f].label, lang) || f}</option>)}</select>;
    if (k === 'items' || k === 'approvers') return (id) => <textarea id={id} className="textarea" disabled={!manage} value={Array.isArray(ed[k]) ? ed[k].map(x => (typeof x === 'object' ? tx(x.text, lang) : x)).join('\n') : ed[k]} onChange={e => setEd({ ...ed, [k]: e.target.value.split('\n').filter(Boolean).map(x => (k === 'items' ? { text: { [lang]: x }, mandatory: true, evidence: false } : x)) })} />;
    if (LONG.includes(k)) return (id) => <textarea id={id} className="textarea" {...common} />;
    return (id) => <input id={id} className="input" type={k === 'seq' ? 'number' : 'text'} {...common} />;
  };
  const LABEL = { name: 'Name', brief: 'Brief', description: 'Detailed description', goal: 'Goal', goals: 'Goals', trigger: 'Trigger', terminal: 'End', code: 'Code', function: 'Function', e2e: 'Phase (E2E)', ownerRoleCode: 'Owner role', mp: 'Macro process', task: 'Task', seq: 'Order', roleCode: 'Responsible role', formKind: 'Form kind', purpose: 'Purpose', entry_criteria: 'Entry criteria', exit_criteria: 'Exit criteria', approvers: 'Approvers (one per line)', items: 'Items (one per line)' };
  return (
    <>
      <PageHead eyebrow={t('Design')} title={t('Process design editor')} subtitle={t('Create, change, retire and restore every element of the process design. Every change is a new version; running projects keep the version they started with.')}
        actions={manage && <button className="btn btn-primary" onClick={() => { const fields = list.data?.fields || []; setSel({ new: true, id: '', fields, data: {} }); setEd({ ...Object.fromEntries(fields.map(k => [k, ''])), mp: parent || '', note: '' }); }}><Plus size={16} />{t('New element')}</button>} />
      <Tabs label={t('Element types')} value={type} onChange={(v) => { setType(v); setQ(''); }} tabs={TYPES.map(k => ({ id: k, label: list.data?.types ? tx(list.data.types[k], lang) : k }))} />
      <div className="row" style={{ margin: '12px 0', flexWrap: 'wrap' }}>
        {(type === 'step' || type === 'task') && <select className="select" style={{ width: 'auto', maxWidth: 420 }} aria-label={t('Macro process')} value={parent} onChange={e => setParent(e.target.value)}>{(mps.data?.items || []).map(m => <option key={m.id} value={m.id}>{m.data.code || m.id} — {tx(m.data.name, lang)}</option>)}</select>}
        <input className="input" style={{ maxWidth: 280 }} placeholder={t('Filter…')} aria-label={t('Filter')} value={q} onChange={e => setQ(e.target.value)} />
        {list.data && <span className="small muted">{t('{n} elements', { n: list.data.total })}</span>}
      </div>
      {list.error ? <ErrorBox error={list.error} /> : !list.data ? <Loading /> : (
        <Table rows={list.data.items.filter(x => !q || `${x.id} ${val(x.data.name)} ${x.data.code || ''}`.toLowerCase().includes(q.toLowerCase()))} onRowClick={openEl} columns={[
          { key: 'id', label: t('ID'), width: 120 },
          { key: 'name', label: t('Name'), render: x => <span className="strong">{val(x.data.name)}</span>, sortValue: x => val(x.data.name) },
          ...(type === 'step' ? [{ key: 'role', label: t('Responsible role'), render: x => L(x.data.roleCode) }, { key: 'form', label: t('Form kind'), render: x => (forms?.[x.data.formKind] ? tx(forms[x.data.formKind].label, lang) : x.data.formKind) }] : []),
          ...(type === 'mp' ? [{ key: 'fn', label: t('Function'), render: x => idName(x.data.function) }, { key: 'own', label: t('Owner role'), render: x => L(x.data.ownerRoleCode) }] : []),
          { key: 'version', label: t('Version'), width: 80, render: x => `v${x.version}` },
          { key: 'origin', label: t('Origin'), render: x => (x.custom ? t('Own element') : x.modified ? t('Modified reference') : t('Reference')) },
          { key: 'status', label: t('Status'), render: x => <Status value={x.status} /> },
        ]} />
      )}
      {sel && ed && (
        <Modal wide title={sel.new ? t('New element') : `${sel.id} — ${val(sel.data.name)}`} onClose={() => setSel(null)} footer={<>
          {!sel.new && <button className="btn" onClick={() => setHist(sel.versionKey)}>{t('History ({n})', { n: sel.versions || 1 })}</button>}
          {!sel.new && manage && sel.status !== 'Retired' && sel.status !== 'Deleted' && <button className="btn" onClick={retire}>{t('Retire or delete')}</button>}
          <button className="btn" onClick={() => setSel(null)}>{t('Cancel')}</button>
          {manage && <button className="btn btn-primary" disabled={!String(ed.name || '').trim()} onClick={save}>{sel.new ? t('Create') : t('Save as new version')}</button>}
        </>}>
          <div className="stack">
            {!sel.new && sel.usage && <Card tight className="flat"><div className="small">{t('Used by')}: {t('{r} runs in projects', { r: sel.usage.runs || 0 })} · {t('{c} child elements', { c: sel.usage.children || 0 })}{sel.usage.documents ? ` · ${t('{d} documents', { d: sel.usage.documents })}` : ''}{sel.usage.aiUseCases ? ` · ${t('{a} AI use cases', { a: sel.usage.aiUseCases })}` : ''}</div><div className="xsmall muted">{t('Running projects keep the version they started with; this change applies to projects started after it.')}</div></Card>}
            <div className="form-grid">{sel.fields.filter(k => !LONG.includes(k) && !['items', 'approvers'].includes(k)).map(k => <Field key={k} label={t(LABEL[k] || k)} required={k === 'name'}>{fieldInput(k)}</Field>)}</div>
            {sel.fields.filter(k => LONG.includes(k) || ['items', 'approvers'].includes(k)).map(k => <Field key={k} label={t(LABEL[k] || k)}>{fieldInput(k)}</Field>)}
            {manage && <Field label={t('Change note')} hint={t('Why this change; kept with the version.')}>{(id) => <input id={id} className="input" value={ed.note} onChange={e => setEd({ ...ed, note: e.target.value })} />}</Field>}
            {(type === 'step' || type === 'task') && <p className="xsmall muted">{t('Name a step or task with a verb and its object, e.g. "Identify the interested parties".')}</p>}
          </div>
        </Modal>
      )}
      {hist && <VersionsModal type={hist.type} id={hist.id} onClose={() => setHist(null)} onReverted={() => { setHist(null); setSel(null); list.reload(); }} />}
    </>
  );
}
