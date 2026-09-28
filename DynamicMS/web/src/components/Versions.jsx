// Shared version history + side-by-side comparison + revert (FR-DA-VER-03..06).
import { useState } from 'react';
import { History } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { Modal, Loading, Table, Field, tx } from './ui.jsx';

const show = (v, lang) => (v === null || v === undefined ? '—' : typeof v === 'object' ? (v.en || v.fr || v.ar ? tx(v, lang) : JSON.stringify(v)) : String(v));

export function VersionsButton({ type, id, onReverted }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  return <><button className="btn btn-sm" onClick={() => setOpen(true)}><History size={16} />{t('History')}</button>{open && <VersionsModal type={type} id={id} onClose={() => setOpen(false)} onReverted={onReverted} />}</>;
}

export default function VersionsModal({ type, id, onClose, onReverted }) {
  const { t, lang, fmtDate, toast, can } = useApp();
  const { data, loading, reload } = useData(`/admin/versions/${type}/${id}`);
  const [cmp, setCmp] = useState(null);
  const [pick, setPick] = useState([]);
  const [rev, setRev] = useState(null);
  const [just, setJust] = useState('');
  const compare = async () => { const [a, b] = pick.sort((x, y) => x - y); setCmp(await api(`/admin/versions/${type}/${id}/compare?a=${a}&b=${b}`)); };
  const revert = async () => { try { await api(`/admin/versions/${type}/${id}/revert`, { method: 'POST', body: { version: rev, justification: just } }); toast(t('Reverted into a new current version.')); setRev(null); setJust(''); reload(); onReverted?.(); } catch (e) { toast(e.message, 'error'); } };
  return (
    <Modal wide title={t('Version history')} onClose={onClose}>
      {loading && !data ? <Loading /> : (
        <div className="stack">
          <Table rows={(data || []).map(v => ({ ...v, id: v.version }))} columns={[
            { key: 'pick', label: '', sortable: false, width: 40, render: v => <input type="checkbox" aria-label={t('Select version {v}', { v: v.version })} checked={pick.includes(v.version)} onChange={e => setPick(p => (e.target.checked ? [...p, v.version].slice(-2) : p.filter(x => x !== v.version)))} /> },
            { key: 'version', label: t('Version'), render: v => <span className="strong">v{v.version}{v.is_current ? ` · ${t('current')}` : ''}</span> },
            { key: 'at', label: t('Date'), render: v => fmtDate(v.at) },
            { key: 'user_name', label: t('By') },
            { key: 'justification', label: t('Justification'), render: v => tx(v.justification, lang) || '—' },
            { key: 'act', label: '', sortable: false, render: v => (!v.is_current && (can('governance.manage') || can('records.manage')) ? <button className="btn btn-sm" onClick={() => setRev(v.version)}>{t('Revert')}</button> : null) },
          ]} empty={t('No version recorded yet.')} />
          <div className="row"><button className="btn btn-sm" disabled={pick.length !== 2} onClick={compare}>{t('Compare selected')}</button></div>
          {cmp && (
            <div className="table-wrap"><table className="data"><thead><tr><th>{t('Field')}</th><th>v{cmp.a}</th><th>v{cmp.b}</th></tr></thead>
              <tbody>{cmp.fields.map(f => <tr key={f.field}><td className="strong">{f.field}</td><td className={f.changed ? 'diff-changed' : ''}>{show(f.a, lang)}</td><td className={f.changed ? 'diff-changed' : ''}>{show(f.b, lang)}</td></tr>)}</tbody></table></div>
          )}
          {rev && (
            <div className="card flat stack-8">
              <Field label={t('Justification for reverting to v{v}', { v: rev })} required>{(fid) => <textarea id={fid} className="textarea" value={just} onChange={e => setJust(e.target.value)} />}</Field>
              <div className="row"><button className="btn" onClick={() => setRev(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!just.trim()} onClick={revert}>{t('Revert')}</button></div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
