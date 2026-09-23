// External Integration Registry (FR-DA-CFG-10..14): register connectors from the catalog, store credentials
// encrypted, check health, map fields, run a sync and read the exchange log.
import { useState } from 'react';
import { Plug, Activity, RefreshCw, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../../lib/auth.jsx';
import { useI18n } from '../../lib/i18n.jsx';
import { post, put, del } from '../../lib/api.js';
import { PageHeader, Card, CardHead, DataTable, useFetch, Skeleton, ErrorNote, StatusBadge, Button, Modal, Field, Input, Select, Check, Tabs, useToast, fmtDate, Badge, Empty } from '../../components/ui.jsx';

function Register({ catalog, packs, onClose, onDone }) {
  const { t } = useI18n();
  const [f, setF] = useState({ catalog_id: '', name: '', endpoint: '', credentials: '' });
  const [err, setErr] = useState(null);
  const [created, setCreated] = useState(null);
  const [busy, setBusy] = useState(false);
  const available = catalog.filter((c) => c.packs.some((p) => packs.includes(p)));
  const save = async () => {
    setBusy(true); setErr(null);
    try { setCreated(await post('/integrations', f)); onDone(); } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  if (created) {
    return (
      <Modal title={t('Connector registered')} onClose={onClose} footer={<Button variant="primary" onClick={onClose}>{t('Done')}</Button>}>
        <p>{t('Copy the inbound signing secret now. It is shown only once.')}</p>
        <dl className="kv"><dt>{t('Inbound URL')}</dt><dd><code>{created.inboundUrl}</code></dd><dt>{t('Signing secret')}</dt><dd><code>{created.inboundSecret}</code></dd></dl>
        <p className="small muted">{t('The external system signs each request body with HMAC-SHA256 and sends it in the x-cortexplm-signature header.')}</p>
      </Modal>
    );
  }
  return (
    <Modal wide title={t('Register a connector')} subtitle={t('Only connectors included in your subscription are listed.')} onClose={onClose}
      footer={<><Button onClick={onClose}>{t('Cancel')}</Button><Button variant="primary" busy={busy} disabled={!f.catalog_id} onClick={save}>{t('Register')}</Button></>}>
      <div className="form-grid">
        <Field label={t('Connector')} required full><Select value={f.catalog_id} onChange={(e) => { const c = available.find((x) => x.id === e.target.value); setF({ ...f, catalog_id: e.target.value, name: c?.name || '' }); }} placeholder={t('Choose a connector')} options={available.map((c) => ({ value: c.id, label: `${c.id} · ${c.name} (${t(c.category)})` }))} /></Field>
        <Field label={t('Display name')}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label={t('Endpoint URL')} hint={t('Used for the health check and outbound sync.')}><Input value={f.endpoint} onChange={(e) => setF({ ...f, endpoint: e.target.value })} placeholder="https://" /></Field>
        <Field label={t('API key or token')} full hint={t('Stored encrypted. It is never shown again.')}><Input type="password" autoComplete="off" value={f.credentials} onChange={(e) => setF({ ...f, credentials: e.target.value })} /></Field>
      </div>
      <div style={{ marginTop: 12 }}><ErrorNote error={err} /></div>
    </Modal>
  );
}

function Detail({ item, canManage, onClose, onChanged }) {
  const { t } = useI18n();
  const toast = useToast();
  const [tab, setTab] = useState('settings');
  const [f, setF] = useState({ name: item.name, endpoint: item.endpoint || '', credentials: '', enabled: !!item.enabled });
  const [m, setM] = useState({ external_field: '', internal_entity: 'project', internal_field: '' });
  const log = useFetch(tab === 'log' ? `/integrations/${item.id}/log` : null);
  const [err, setErr] = useState(null);
  const act = async (fn, msg) => { setErr(null); try { const r = await fn(); if (msg) toast.ok(typeof msg === 'function' ? msg(r) : msg); onChanged(); log.reload(); } catch (e) { setErr(e); } };
  return (
    <Modal wide title={item.name} subtitle={`${item.catalog_id} · ${t(item.catalog?.category || '')}`} onClose={onClose}
      footer={<>
        {canManage && <Button variant="danger" icon={Trash2} onClick={() => act(async () => { await del(`/integrations/${item.id}`); onClose(); }, t('Deleted.'))}>{t('Delete')}</Button>}
        <div className="grow" />
        {canManage && <Button icon={Activity} onClick={() => act(() => post(`/integrations/${item.id}/test`), (r) => t('Health check: {s}', { s: t(r.status) }))}>{t('Test connection')}</Button>}
        {canManage && <Button icon={RefreshCw} onClick={() => act(() => post(`/integrations/${item.id}/sync`, {}), (r) => t('Sync result: {r}', { r: r.result }))}>{t('Sync now')}</Button>}
        <Button onClick={onClose}>{t('Close')}</Button>
      </>}>
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'settings', label: t('Settings') }, { value: 'mappings', label: t('Field mappings') }, { value: 'log', label: t('Exchange log') }]} />
      {tab === 'settings' && (
        <div className="stack">
          <dl className="kv"><dt>{t('Health')}</dt><dd><StatusBadge value={item.health_status || 'Not tested'} /> <span className="xs muted">{fmtDate(item.health_checked_at)}</span></dd>
            <dt>{t('Credentials')}</dt><dd>{item.hasCredentials ? t('Stored (encrypted)') : t('None')}</dd><dt>{t('Inbound URL')}</dt><dd><code>/api/integrations/{item.id}/inbound</code></dd></dl>
          <div className="form-grid">
            <Field label={t('Display name')}><Input value={f.name} disabled={!canManage} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label={t('Endpoint URL')}><Input value={f.endpoint} disabled={!canManage} onChange={(e) => setF({ ...f, endpoint: e.target.value })} /></Field>
            <Field label={t('Replace API key or token')} hint={t('Leave empty to keep the stored value.')}><Input type="password" autoComplete="off" disabled={!canManage} value={f.credentials} onChange={(e) => setF({ ...f, credentials: e.target.value })} /></Field>
            <Field label={t('State')}><Check label={t('Enabled')} checked={f.enabled} disabled={!canManage} onChange={(e) => setF({ ...f, enabled: e.target.checked })} /></Field>
          </div>
          {canManage && <div><Button variant="primary" onClick={() => act(() => put(`/integrations/${item.id}`, { ...f, credentials: f.credentials || undefined }), t('Saved.'))}>{t('Save settings')}</Button></div>}
        </div>
      )}
      {tab === 'mappings' && (
        <div className="stack">
          <DataTable filterable={false} rows={item.mappings} columns={[
            { key: 'external_field', label: t('External field') }, { key: 'internal_entity', label: t('Entity') }, { key: 'internal_field', label: t('Internal field') },
            { key: 'x', label: '', sortable: false, render: (r) => canManage && <Button size="sm" variant="ghost" icon={Trash2} onClick={() => act(() => del(`/integrations/${item.id}/mappings/${r.id}`), t('Deleted.'))}>{t('Remove')}</Button> },
          ]} empty={t('No field mapping yet.')} />
          {canManage && (
            <div className="form-grid">
              <Field label={t('External field')}><Input value={m.external_field} onChange={(e) => setM({ ...m, external_field: e.target.value })} placeholder="partNumber" /></Field>
              <Field label={t('Entity')}><Select value={m.internal_entity} onChange={(e) => setM({ ...m, internal_entity: e.target.value })} options={['project', 'task', 'gate_review', 'risk', 'kpi', 'rex_entry'].map((v) => ({ value: v, label: v }))} /></Field>
              <Field label={t('Internal field')}><Input value={m.internal_field} onChange={(e) => setM({ ...m, internal_field: e.target.value })} placeholder="code" /></Field>
              <Field label=" "><Button icon={Plus} disabled={!m.external_field || !m.internal_field} onClick={() => act(async () => { await post(`/integrations/${item.id}/mappings`, m); setM({ ...m, external_field: '', internal_field: '' }); }, t('Mapping added.'))}>{t('Add mapping')}</Button></Field>
            </div>
          )}
        </div>
      )}
      {tab === 'log' && (log.data ? <DataTable filterable={false} rows={log.data} columns={[
        { key: 'created_at', label: t('Date'), render: (r) => r.created_at.slice(0, 16).replace('T', ' ') }, { key: 'direction', label: t('Direction') }, { key: 'record', label: t('Record') },
        { key: 'result', label: t('Result'), render: (r) => <StatusBadge value={r.result === 'success' ? 'Healthy' : r.result}>{r.result}</StatusBadge> },
      ]} empty={t('No exchange yet.')} /> : <Skeleton />)}
      <div style={{ marginTop: 12 }}><ErrorNote error={err} /></div>
    </Modal>
  );
}

export default function Integrations() {
  const { t } = useI18n();
  const { me, can, feature } = useAuth();
  const list = useFetch('/integrations');
  const { data: cat } = useFetch('/catalog');
  const [reg, setReg] = useState(false);
  const [open, setOpen] = useState(null);
  const canManage = can('integration.manage');
  const packs = me.config?.packs || [];
  if (list.error) return <div className="page"><PageHeader eyebrow={t('Administration')} title={t('Integrations')} /><ErrorNote error={list.error} /></div>;
  if (!list.data || !cat) return <div className="page"><Skeleton h={400} /></div>;
  const current = open && list.data.find((x) => x.id === open);
  return (
    <div className="page">
      <PageHeader eyebrow={t('Administration · External Integration Registry')} title={t('Integrations')}
        subtitle={t('{n} connectors registered. Credentials are encrypted at rest; inbound events are verified by signature.', { n: list.data.length })}
        actions={canManage && feature('integrations') && <Button variant="primary" icon={Plus} onClick={() => setReg(true)}>{t('Register a connector')}</Button>} />
      {!feature('integrations') && <div className="callout neutral" style={{ marginBottom: 16 }}><Plug size={18} aria-hidden /><div>{t('The integration registry is not included in this subscription.')}</div></div>}
      <Card>
        {list.data.length === 0 ? <Empty text={t('No connector registered yet.')} /> : (
          <DataTable csvName="integrations" rows={list.data} onRowClick={(r) => setOpen(r.id)} columns={[
            { key: 'name', label: t('Connector'), render: (r) => <><div className="strong">{r.name}</div><div className="xs muted">{r.catalog_id} · {t(r.catalog?.category || '')}</div></> },
            { key: 'endpoint', label: t('Endpoint'), render: (r) => <span className="xs">{r.endpoint || '—'}</span> },
            { key: 'enabled', label: t('State'), render: (r) => <StatusBadge value={r.enabled ? 'On' : 'Off'} /> },
            { key: 'health_status', label: t('Health'), render: (r) => <StatusBadge value={r.health_status || 'Not tested'} /> },
            { key: 'mappings', label: t('Mappings'), num: true, sortValue: (r) => r.mappings.length, csv: (r) => r.mappings.length, render: (r) => r.mappings.length },
            { key: 'health_checked_at', label: t('Last check'), render: (r) => fmtDate(r.health_checked_at) },
          ]} />
        )}
      </Card>
      <Card style={{ marginTop: 24 }}>
        <CardHead title={t('Connectors in the catalog')} subtitle={t('Each connector comes with one or more packs. Connectors outside your subscription are marked.')} />
        <DataTable csvName="integration_catalog" rows={cat.integrations} columns={[
          { key: 'id', label: t('ID') }, { key: 'name', label: t('Connector'), render: (c) => <span className="strong">{c.name}</span> }, { key: 'category', label: t('Category'), render: (c) => t(c.category) },
          { key: 'packs', label: t('Included in'), csv: (c) => c.packs.join(' '), render: (c) => <div className="row" style={{ gap: 4 }}>{c.packs.map((p) => <Badge key={p} tone={packs.includes(p) ? 's5' : 'outline'}>{p}</Badge>)}</div> },
        ]} />
      </Card>
      {reg && <Register catalog={cat.integrations} packs={packs} onClose={() => setReg(false)} onDone={list.reload} />}
      {current && <Detail key={current.id} item={current} canManage={canManage} onClose={() => setOpen(null)} onChanged={list.reload} />}
    </div>
  );
}
