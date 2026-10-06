// Attachment versions (FR-DA-ATT-05): a new version with a note; every earlier version stays downloadable.
import { useRef, useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { api, get, download } from '../lib/api.js';
import { Btn, Modal, Field, useAction, DataTable } from './ui.jsx';

export function AttachmentVersions({ att, readOnly, onChanged }) {
  const { t, fmtDate, fmtNum } = useI18n(); const act = useAction(); const [open, setOpen] = useState(false); const [list, setList] = useState(null); const [note, setNote] = useState(''); const [file, setFile] = useState(null); const ref = useRef(null);
  const show = async () => { setOpen(true); setList(await get(`/attachments/${att.id}/versions`)); };
  const upload = async () => { const fd = new FormData(); fd.append('file', file); fd.append('note', note); await act(() => api(`/attachments/${att.id}/versions`, { method: 'POST', body: fd }), 'att.versionAdded'); setOpen(false); setFile(null); setNote(''); onChanged?.(); };
  return (<>
    <Btn size="sm" kind="ghost" icon="History" aria-label={t('att.versions')} data-tip={t('att.versions')} onClick={show}>{att.version > 1 ? 'v' + att.version : null}</Btn>
    {open && <Modal title={`${att.filename} · ${t('att.versions')}`} onClose={() => setOpen(false)} footer={!readOnly && <><input ref={ref} type="file" hidden onChange={e => setFile(e.target.files[0] || null)} /><Btn icon="Upload" onClick={() => ref.current.click()}>{file ? file.name : t('att.chooseFile')}</Btn><Btn kind="primary" disabled={!file} onClick={upload}>{t('att.addVersion')}</Btn></>}>
      {!readOnly && <Field id="att-note" label={t('att.note')} hint={t('att.noteHint')}><input id="att-note" className="input" value={note} onChange={e => setNote(e.target.value)} maxLength={500} /></Field>}
      <DataTable id="att-versions" search={false} loading={!list} rows={list || []} columns={[{ key: 'version', label: t('ter.version'), num: true, render: r => <span className="mono">v{r.version}{r.latest ? ' ★' : ''}</span>, text: r => 'v' + r.version },
        { key: 'filename', label: t('att.file') }, { key: 'note', label: t('att.note'), text: r => r.note || '—' }, { key: 'author', label: t('ter.author') }, { key: 'created_at', label: t('col.date'), value: r => fmtDate(r.created_at), sortValue: r => r.created_at },
        { key: 'size', label: 'KB', num: true, value: r => fmtNum(Math.round(r.size / 1024)) }, { key: 'dl', label: '', render: r => <Btn size="sm" icon="Download" aria-label={t('common.download')} onClick={() => download(`/attachments/${r.id}/download`, r.filename)} /> }]} />
    </Modal>}</>);
}
