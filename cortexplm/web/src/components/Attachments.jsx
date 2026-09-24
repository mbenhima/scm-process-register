// Attachments of a task or a checklist item: several files at once, by button or drag-and-drop, in the
// formats the server accepts (documents, spreadsheets, presentations, images, CAD, data, archives, media, e-mails).
import { useRef, useState } from 'react';
import { Paperclip, Download, Trash2, FileText, FileSpreadsheet, FileImage, FileArchive, FileCode, FileVideo, Mail, File, Presentation, Upload as UploadIcon } from 'lucide-react';
import { useI18n } from '../lib/i18n.jsx';
import { useAuth } from '../lib/auth.jsx';
import { api, del, download } from '../lib/api.js';
import { useFetch, useToast, IconButton, fmtDate } from './ui.jsx';

const ICON = { Documents: FileText, Spreadsheets: FileSpreadsheet, Presentations: Presentation, Images: FileImage, 'Drawings & CAD': FileCode, 'Data & models': FileCode, Archives: FileArchive, 'Audio & video': FileVideo, 'E-mails': Mail };
const kb = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round((n || 0) / 1024))} KB`);

export async function uploadFiles(entityType, entityId, files) {
  const form = new FormData();
  form.append('entity_type', entityType); form.append('entity_id', entityId);
  for (const f of files) form.append('files', f);
  return api('/evidence', { method: 'POST', form });
}

export function AttachButton({ entityType, entityId, onDone, label }) {
  const { t } = useI18n();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const files = [...(e.target.files || [])]; if (!files.length) return;
    setBusy(true);
    try { const r = await uploadFiles(entityType, entityId, files); toast.ok(t('{n} file(s) attached.', { n: r.files.length })); onDone?.(); } catch (err) { toast.err(err); } finally { setBusy(false); e.target.value = ''; }
  };
  return <label className="btn btn-secondary btn-sm" aria-busy={busy}><Paperclip aria-hidden />{label || t('Attach files')}<input type="file" multiple className="sr-only" onChange={pick} /></label>;
}

export default function Attachments({ entityType, entityId, files, onChange, canAdd }) {
  const { t } = useI18n();
  const { me, can } = useAuth();
  const toast = useToast();
  const types = useFetch('/attachment-types');
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  const groupOf = (ext) => Object.entries(types.data?.types || {}).find(([, list]) => list.includes(ext))?.[0];
  const send = async (list) => {
    if (!list.length) return;
    setBusy(true);
    try { const r = await uploadFiles(entityType, entityId, list); toast.ok(t('{n} file(s) attached.', { n: r.files.length })); onChange?.(); } catch (e) { toast.err(e); } finally { setBusy(false); }
  };
  const remove = async (f) => {
    if (!window.confirm(t('Remove {f}?', { f: f.filename }))) return;
    try { await del(`/evidence/${f.id}`); toast.ok(t('File removed.')); onChange?.(); } catch (e) { toast.err(e); }
  };
  const accept = Object.values(types.data?.types || {}).flat().map((x) => `.${x}`).join(',');
  return (
    <div className="stack">
      {canAdd && (
        <div className={`dropzone ${drag ? 'over' : ''}`} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); send([...e.dataTransfer.files]); }}>
          <UploadIcon aria-hidden />
          <div>
            <button type="button" className="link-button strong" disabled={busy} onClick={() => input.current?.click()}>{busy ? t('Uploading…') : t('Add files')}</button> {t('or drop them here')}
            <div className="xs muted">{t('Up to {n} files of {m} MB each: documents, spreadsheets, presentations, images, drawings and CAD, data, archives, audio and video, e-mails.', { n: types.data?.maxFiles || 10, m: types.data?.maxMb || 25 })}</div>
            <details className="xs muted"><summary>{t('Accepted file types')}</summary>{Object.entries(types.data?.types || {}).map(([g, list]) => <div key={g}>{t(g)}: {list.join(', ')}</div>)}</details>
          </div>
          <input ref={input} type="file" multiple accept={accept} className="sr-only" onChange={(e) => { send([...e.target.files]); e.target.value = ''; }} />
        </div>
      )}
      {files.length ? (
        <ul className="list-plain files">
          {files.map((f) => { const Icon = ICON[groupOf(f.ext)] || File; return (
            <li key={f.id} className="row between">
              <span className="row" style={{ gap: 8, minWidth: 0 }}><Icon size={18} aria-hidden /><span style={{ minWidth: 0 }}><span className="strong small file-name">{f.filename}</span><span className="xs muted" style={{ display: 'block' }}>{(f.ext || '').toUpperCase()} · {kb(f.size)} · {f.uploaded_by_name || '—'} · {fmtDate(f.uploaded_at)}</span></span></span>
              <span className="row" style={{ gap: 2 }}>
                <IconButton size="sm" icon={Download} label={t('Download {f}', { f: f.filename })} onClick={() => download(`/evidence/${f.id}`)} />
                {canAdd && (f.uploaded_by_name === me.user.name || can('project.edit')) && <IconButton size="sm" icon={Trash2} label={t('Remove {f}', { f: f.filename })} onClick={() => remove(f)} />}
              </span>
            </li>
          ); })}
        </ul>
      ) : <p className="muted small">{t('No attachment yet.')}</p>}
    </div>
  );
}
