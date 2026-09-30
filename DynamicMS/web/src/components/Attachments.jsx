import { useRef, useState } from 'react';
import { Paperclip, Download, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api, download } from '../lib/api.js';

// Files attached to a record, with their version history: uploading a new version keeps
// the previous ones (same chain), each with author, date and an optional note.
export default function Attachments({ entityType, entityId }) {
  const { t, fmtDate, toast, readOnly } = useApp();
  const { data, reload } = useData(`/admin/attachments?entityType=${entityType}&entityId=${entityId}`);
  const ref = useRef(null);
  const verRef = useRef(null);
  const [replaces, setReplaces] = useState(null);
  const [open, setOpen] = useState({});
  const [note, setNote] = useState('');
  const upload = async (files, rep) => {
    const fd = new FormData();
    fd.append('entityType', entityType); fd.append('entityId', entityId);
    if (rep) fd.append('replaces', rep);
    if (note.trim()) fd.append('note', note.trim());
    for (const f of files) fd.append('files', f);
    try { await api('/admin/attachments', { method: 'POST', body: fd }); toast(rep ? t('New version attached; the previous one is kept in the history.') : t('Files attached.')); setNote(''); reload(); } catch (e) { toast(e.message, 'error'); }
  };
  const groups = {};
  for (const a of data || []) (groups[a.group_id] ||= []).push(a);
  const chains = Object.values(groups).map(list => list.sort((a, b) => b.version - a.version));
  return (
    <div className="stack-8">
      <div className="row-between"><span className="strong small">{t('Attachments')}</span>{!readOnly && <><button className="btn btn-sm" onClick={() => ref.current?.click()}><Paperclip size={16} />{t('Attach files')}</button><input ref={ref} type="file" multiple hidden onChange={e => { if (e.target.files.length) upload(e.target.files, null); e.target.value = ''; }} /></>}</div>
      {!readOnly && <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder={t('Note for the next upload (optional)')} aria-label={t('Note for the next upload (optional)')} />}
      <input ref={verRef} type="file" hidden onChange={e => { if (e.target.files.length) upload([e.target.files[0]], replaces); e.target.value = ''; }} />
      {chains.length ? (
        <ul className="list small">{chains.map(list => {
          const a = list[0];
          const key = a.group_id;
          return (
            <li key={key}>
              <div className="row-between">
                <span>{a.filename} <span className="tag outline">v{a.version}</span> <span className="muted xsmall">· {Math.round(a.size / 1024)} KB · {a.author} · {fmtDate(a.at)}</span>{a.note && <div className="xsmall">“{a.note}”</div>}</span>
                <span className="row" style={{ gap: 4 }}>
                  {list.length > 1 && <button className="btn btn-sm btn-ghost" aria-expanded={!!open[key]} onClick={() => setOpen(o => ({ ...o, [key]: !o[key] }))}>{open[key] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}{t('History ({n})', { n: list.length })}</button>}
                  {!readOnly && <button className="btn btn-sm btn-ghost" onClick={() => { setReplaces(a.id); verRef.current?.click(); }}><Upload size={16} />{t('New version')}</button>}
                  <button className="btn btn-sm btn-ghost" onClick={() => download(`/admin/attachments/${a.id}/download`, a.filename)} aria-label={t('Download')}><Download size={16} /></button>
                </span>
              </div>
              {open[key] && <ul className="list xsmall" style={{ marginInlineStart: 16 }}>{list.slice(1).map(v => <li key={v.id} className="row-between"><span>v{v.version} · {v.filename} · {v.author} · {fmtDate(v.at)}{v.note ? ` · “${v.note}”` : ''}</span><button className="btn btn-sm btn-ghost" onClick={() => download(`/admin/attachments/${v.id}/download`, v.filename)} aria-label={t('Download')}><Download size={14} /></button></li>)}</ul>}
            </li>
          );
        })}</ul>
      ) : <p className="xsmall muted">{t('No file attached. PDF, images, Office and CSV files up to 10 MB.')}</p>}
    </div>
  );
}
