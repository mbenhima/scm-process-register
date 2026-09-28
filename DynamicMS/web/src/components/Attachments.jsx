import { useRef } from 'react';
import { Paperclip, Download } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api, download } from '../lib/api.js';

export default function Attachments({ entityType, entityId }) {
  const { t, fmtDate, toast, readOnly } = useApp();
  const { data, reload } = useData(`/admin/attachments?entityType=${entityType}&entityId=${entityId}`);
  const ref = useRef(null);
  const upload = async (files) => {
    const fd = new FormData();
    fd.append('entityType', entityType); fd.append('entityId', entityId);
    for (const f of files) fd.append('files', f);
    try { await api('/admin/attachments', { method: 'POST', body: fd }); toast(t('Files attached.')); reload(); } catch (e) { toast(e.message, 'error'); }
  };
  return (
    <div className="stack-8">
      <div className="row-between"><span className="strong small">{t('Attachments')}</span>{!readOnly && <><button className="btn btn-sm" onClick={() => ref.current?.click()}><Paperclip size={16} />{t('Attach files')}</button><input ref={ref} type="file" multiple hidden onChange={e => e.target.files.length && upload(e.target.files)} /></>}</div>
      {data?.length ? <ul className="list small">{data.map(a => <li key={a.id} className="row-between"><span>{a.filename} <span className="muted xsmall">· {Math.round(a.size / 1024)} KB · {a.author} · {fmtDate(a.at)}</span></span><button className="btn btn-sm btn-ghost" onClick={() => download(`/admin/attachments/${a.id}/download`, a.filename)} aria-label={t('Download')}><Download size={16} /></button></li>)}</ul> : <p className="xsmall muted">{t('No file attached. PDF, images, Office and CSV files up to 10 MB.')}</p>}
    </div>
  );
}
