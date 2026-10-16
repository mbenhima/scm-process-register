// Licence management of the editor edition (Administration > Licences): issue a licence for an
// on-premises customer, change it (a new signed version), download the licence file and the public
// key, revoke and delete. Platform administrator only.
import { useRef, useState } from 'react';
import { Plus, Download, Pencil, Ban, Trash2, KeyRound, FileKey2 } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api, getToken } from '../lib/api.js';
import { Card, Table, Modal, Field, Status, Loading, ErrorBox, Empty } from './ui.jsx';
import { confirmDialog } from './Dialogs.jsx';

const GROUPS = [['base', 'Base packs'], ['industry', 'Industry packs'], ['capability', 'Capability packs'], ['addons', 'Add-ons'], ['standards', 'Compliance & Security Standards']];
const inAYear = () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10); };

async function download(path, fallback) {
  const r = await fetch(`/api${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error?.message || r.statusText);
  const name = /filename\*=UTF-8''([^;]+)/.exec(r.headers.get('content-disposition') || '')?.[1];
  const a = document.createElement('a');
  a.href = URL.createObjectURL(await r.blob()); a.download = name ? decodeURIComponent(name) : fallback;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function LicenceForm({ items, initial, onClose, onSaved }) {
  const { t, toast } = useApp();
  const editing = !!initial;
  const [f, setF] = useState(initial ? { customer: initial.customer, contact: initial.contact || '', seats: initial.seats, expires: initial.expires, deploymentMode: initial.deploymentMode, packs: initial.packs, notes: initial.notes || '', reason: '' }
    : { customer: '', contact: '', seats: 100, expires: inAYear(), deploymentMode: 'DEP-5', packs: ['DMS-PRO'], notes: '' });
  const [busy, setBusy] = useState(false);
  const toggle = (id) => setF(x => ({ ...x, packs: x.packs.includes(id) ? x.packs.filter(p => p !== id) : [...x.packs, id] }));
  const save = async () => {
    setBusy(true);
    try {
      const body = { ...f, seats: Number(f.seats) };
      const r = editing ? await api(`/admin/licences/${initial.id}`, { method: 'PUT', body }) : await api('/admin/licences', { method: 'POST', body });
      toast(editing ? t('Licence {c} re-issued as version {v}.', { c: r.code, v: r.version }) : t('Licence {c} issued.', { c: r.code }));
      onSaved(r);
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  return (
    <Modal wide title={editing ? t('Change licence {c}', { c: initial.code }) : t('New licence')} onClose={onClose}
      footer={<><button type="button" className="btn" onClick={onClose}>{t('Cancel')}</button><button type="button" className="btn btn-primary" disabled={busy || !f.customer.trim() || !f.packs.length || (editing && !f.reason.trim())} onClick={save}>{editing ? t('Re-issue the licence') : t('Issue the licence')}</button></>}>
      <div className="form-grid">
        <Field label={t('Customer')} required>{(id) => <input id={id} className="input" value={f.customer} onChange={e => setF({ ...f, customer: e.target.value })} />}</Field>
        <Field label={t('Customer contact')}>{(id) => <input id={id} className="input" value={f.contact} onChange={e => setF({ ...f, contact: e.target.value })} />}</Field>
        <Field label={t('Seats (active accounts)')} required>{(id) => <input id={id} className="input" type="number" min="1" value={f.seats} onChange={e => setF({ ...f, seats: e.target.value })} />}</Field>
        <Field label={t('Expires on')} required>{(id) => <input id={id} className="input" type="date" value={f.expires} onChange={e => setF({ ...f, expires: e.target.value })} />}</Field>
        <Field label={t('Deployment mode')} required>{(id) => <select id={id} className="select" value={f.deploymentMode} onChange={e => setF({ ...f, deploymentMode: e.target.value })}>{items.deploymentModes.map(m => <option key={m} value={m}>{m}</option>)}</select>}</Field>
      </div>
      <fieldset style={{ border: 0, padding: 0, margin: '16px 0 0' }}>
        <legend className="strong small" style={{ marginBottom: 8 }}>{t('Licensed items')} *</legend>
        {GROUPS.map(([k, label]) => (
          <div key={k} style={{ marginBottom: 8 }}>
            <div className="xsmall muted strong" style={{ marginBottom: 4 }}>{t(label)}</div>
            <div className="row" style={{ flexWrap: 'wrap', gap: 12 }}>{items[k].map(id => <label key={id} className="checkbox small"><input type="checkbox" checked={f.packs.includes(id)} onChange={() => toggle(id)} /><span>{id}</span></label>)}</div>
          </div>
        ))}
      </fieldset>
      <Field label={t('Notes')}>{(id) => <textarea id={id} className="input" rows={2} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />}</Field>
      {editing && <Field label={t('Reason for the change')} required hint={t('The customer installs the new licence file; the previous version stays in the history.')}>{(id) => <input id={id} className="input" value={f.reason} onChange={e => setF({ ...f, reason: e.target.value })} />}</Field>}
    </Modal>
  );
}

export default function Licences() {
  const { t, fmtDate, toast } = useApp();
  const data = useData('/admin/licences');
  const [form, setForm] = useState(null);
  const busy = useRef(false);
  if (data.error) return <ErrorBox error={data.error} onRetry={data.reload} />;
  if (!data.data) return <Loading />;
  const { key, items, licences } = data.data;
  const act = async (fn) => { if (busy.current) return; busy.current = true; try { await fn(); } catch (e) { toast(e.message, 'error'); } finally { busy.current = false; } };
  const revoke = (l) => act(async () => {
    const reason = await confirmDialog({ title: t('Revoke licence {c}?', { c: l.code }), message: t('The licence can no longer be downloaded or changed. An installation that already holds it keeps working until its expiry date or until another licence is installed.'), confirmLabel: t('Revoke'), danger: true, input: { label: t('Reason') } });
    if (!reason) return;
    await api(`/admin/licences/${l.id}/revoke`, { method: 'POST', body: { reason } }); toast(t('Licence {c} revoked.', { c: l.code })); data.reload();
  });
  const remove = (l) => act(async () => {
    if (!(await confirmDialog({ title: t('Delete licence {c}?', { c: l.code }), message: t('The licence and its history are deleted; the audit trail keeps the deletion.'), confirmLabel: t('Delete'), danger: true }))) return;
    await api(`/admin/licences/${l.id}`, { method: 'DELETE' }); toast(t('Licence {c} deleted.', { c: l.code })); data.reload();
  });
  return (
    <div className="stack">
      <Card title={t('Signing key')} action={<button type="button" className="btn btn-sm" disabled={!key.fingerprint} onClick={() => act(() => download('/admin/licences/public-key', 'DynamicMS_Licence_PublicKey.pem'))}><KeyRound size={16} />{t('Download the public key')}</button>}>
        <p className="small"><Status value={key.fingerprint && key.matches !== false ? 'Valid' : 'Failed'} /> {t(key.message)}</p>
        {key.fingerprint && <p className="small muted">{t('Fingerprint')}: <span className="mono">{key.fingerprint}</span></p>}
        <p className="xsmall muted">{t('Key file')}: <span className="mono">{key.path}</span></p>
      </Card>
      <Card title={t('Customer licences')} action={<button type="button" className="btn btn-primary btn-sm" disabled={!key.fingerprint || key.matches === false} onClick={() => setForm({})}><Plus size={16} />{t('New licence')}</button>}>
        {licences.length === 0 ? <Empty icon={FileKey2} title={t('No licence issued yet.')}>{t('Issue the first licence of an on-premises customer.')}</Empty> : (
          <Table rows={licences} columns={[
            { key: 'code', label: t('Code'), render: l => <span className="mono strong">{l.code}</span> },
            { key: 'customer', label: t('Customer') },
            { key: 'seats', label: t('Seats'), num: true },
            { key: 'expires', label: t('Expires on'), render: l => fmtDate(l.expires) },
            { key: 'packs', label: t('Licensed items'), render: l => <span className="small">{l.packs.join(', ')}</span> },
            { key: 'deploymentMode', label: t('Mode') },
            { key: 'version', label: t('Version'), num: true },
            { key: 'status', label: t('Status'), render: l => <Status value={l.status} /> },
            { key: 'actions', label: t('Actions'), sortable: false, render: l => (
              <div className="row" style={{ gap: 4 }}>
                <button type="button" className="btn btn-sm btn-ghost btn-icon" title={t('Download the licence file')} aria-label={t('Download the licence file')} disabled={l.status === 'Revoked'} onClick={() => act(async () => { await download(`/admin/licences/${l.id}/file`, `${l.code}.lic`); data.reload(); })}><Download size={16} /></button>
                <button type="button" className="btn btn-sm btn-ghost btn-icon" title={t('Change the licence')} aria-label={t('Change the licence')} disabled={l.status === 'Revoked'} onClick={() => setForm(l)}><Pencil size={16} /></button>
                <button type="button" className="btn btn-sm btn-ghost btn-icon" title={t('Revoke')} aria-label={t('Revoke')} disabled={l.status === 'Revoked'} onClick={() => revoke(l)}><Ban size={16} /></button>
                <button type="button" className="btn btn-sm btn-ghost btn-icon" title={t('Delete')} aria-label={t('Delete')} onClick={() => remove(l)}><Trash2 size={16} /></button>
              </div>) },
          ]} />
        )}
      </Card>
      {form && <LicenceForm items={items} initial={form.id ? form : null} onClose={() => setForm(null)} onSaved={() => { setForm(null); data.reload(); }} />}
    </div>
  );
}
