import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Loading, ErrorBox, Status, Tabs, Table, tx, Modal, Field } from '../components/ui.jsx';
import { NoProject } from './Home.jsx';


export default function Registers() {
  const { t, L, lang, projectId, fmtDate, toast, can, readOnly } = useApp();
  const { data: regs } = useData(projectId ? `/projects/${projectId}/registers` : null);
  const { data: defs } = useData('/register-defs');
  const [open, setOpen] = useState(null);
  const [params] = useSearchParams();
  const [reg, setReg] = useState(params.get('reg') || 'context');
  const { data, loading, error, reload } = useData(projectId ? `/projects/${projectId}/registers/${reg}` : null, [reg]);
  const [nw, setNw] = useState(null);
  if (!projectId) return <NoProject />;
  // Columns and labels come from the register definitions of the server (all languages).
  const def = (defs || []).find(d => d.key === reg);
  const fields = def ? def.fields : [...new Set((data || []).flatMap(r => Object.keys(r.data || {})))].map(k => ({ key: k, label: k }));
  const keys = fields.slice(0, 5).map(x => x.key);
  const labelOf = (k) => fields.find(x => x.key === k)?.label || k;
  const fmt = (v, k) => (v === null || v === undefined ? '—' : typeof v === 'boolean' ? (v ? t('Yes') : t('No')) : Array.isArray(v) ? v.map(x => tx(x, lang)).join(', ') : typeof v === 'object' ? tx(v, lang) : /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? fmtDate(v) : k === 'role' || k === 'owner' || k === 'sender' || k === 'responsible' ? L(v) : String(v));
  const create = async () => { try { await api(`/projects/${projectId}/registers/${reg}`, { method: 'POST', body: nw }); toast(t('Entry added.')); setNw(null); reload(); } catch (e) { toast(e.message, 'error'); } };
  const canAdd = !readOnly && (can('records.manage') || (reg === 'ideas' && can('records.create')));
  return (
    <>
      <PageHead eyebrow={t('Records')} title={t('Registers')} subtitle={t('The registers each phase of the run fills in: context, parties, objectives, obligations, suppliers, ideas and more.')} actions={canAdd && <button className="btn btn-primary" onClick={() => setNw({ title: '', data: {} })}><Plus size={16} />{reg === 'ideas' ? t('Submit an idea') : t('Add entry')}</button>} />
      <Tabs label={t('Registers')} value={reg} onChange={setReg} tabs={(regs || []).filter(r => r.count > 0 || r.key === 'ideas').map(r => ({ id: r.key, label: tx((defs || []).find(d => d.key === r.key)?.name, lang) || r.key, count: r.count }))} />
      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data ? <Loading /> : (
        <Table rows={data} onRowClick={(r) => setOpen(r)} columns={[
          { key: 'code', label: t('Code'), width: 90 },
          { key: 'title', label: t('Title'), render: r => <span className="strong">{tx(r.title, lang)}</span>, sortValue: r => tx(r.title, lang) },
          ...keys.map(k => ({ key: k, label: tx(labelOf(k), lang), render: r => fmt(r.data?.[k], k), sortValue: r => fmt(r.data?.[k], k) })),
          { key: 'status', label: t('Status'), render: r => <Status value={r.status} /> },
        ]} />
      )}
      {open && (
        <Modal title={`${open.code} — ${tx(open.title, lang)}`} onClose={() => setOpen(null)} footer={<button className="btn" onClick={() => setOpen(null)}>{t('Close')}</button>}>
          <dl className="kv">{fields.filter(x => open.data?.[x.key] !== undefined && open.data?.[x.key] !== null && open.data?.[x.key] !== '').map(x => <div key={x.key}><dt>{tx(x.label, lang)}</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{Array.isArray(open.data[x.key]) && typeof open.data[x.key][0] === 'object' && !('en' in open.data[x.key][0]) ? open.data[x.key].map(o => Object.values(o).map(v => (typeof v === 'object' ? tx(v, lang) : v)).join(' — ')).join('\n') : typeof open.data[x.key] === 'object' && !Array.isArray(open.data[x.key]) && !('en' in open.data[x.key]) ? Object.entries(open.data[x.key]).map(([k2, v]) => `${k2}: ${tx(v, lang)}`).join('\n') : fmt(open.data[x.key], x.key)}</dd></div>)}<div><dt>{t('Status')}</dt><dd><Status value={open.status} /></dd></div></dl>
        </Modal>
      )}
      {nw && (
        <Modal title={tx(def?.name, lang) || reg} onClose={() => setNw(null)} footer={<><button className="btn" onClick={() => setNw(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!nw.title} onClick={create}>{t('Save')}</button></>}>
          <div className="stack">
            <Field label={t('Title')} required>{(id) => <input id={id} className="input" value={nw.title} onChange={e => setNw({ ...nw, title: e.target.value })} />}</Field>
            {keys.slice(0, 3).map(k => <Field key={k} label={tx(labelOf(k), lang)}>{(id) => <input id={id} className="input" value={nw.data[k] || ''} onChange={e => setNw({ ...nw, data: { ...nw.data, [k]: e.target.value } })} />}</Field>)}
          </div>
        </Modal>
      )}
    </>
  );
}
