// Notifications (FR-DA-COMM-01..05): in-app inbox, per-category channel preferences, personal webhooks and the delivery log.
import { useState } from 'react';
import { CheckCheck, RefreshCw, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { post, put, del } from '../lib/api.js';
import { PageHeader, Card, CardHead, DataTable, useFetch, Skeleton, ErrorNote, StatusBadge, Button, Tabs, Check, Field, Input, useToast, Empty, Badge } from '../components/ui.jsx';

const CHANNEL_LABEL = { inapp: 'In-app', email: 'E-mail', webhook: 'Webhook', sms: 'SMS', push: 'Push' };
const CATEGORY_LABEL = { task: 'Task assignments and reminders', gate: 'Gate submissions and decisions', alert: 'Alerts and escalations', system: 'System and licence notices' };

function Inbox() {
  const { t } = useI18n();
  const { data, error, reload, setData } = useFetch('/notifications');
  if (error) return <ErrorNote error={error} />;
  if (!data) return <Skeleton h={300} />;
  const unread = data.filter((n) => !n.read_at);
  const markRead = async (n) => { await post(`/notifications/${n.id}/read`); setData((d) => d.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))); };
  return (
    <Card>
      <CardHead title={t('{n} unread', { n: unread.length })} actions={unread.length > 0 && <Button icon={CheckCheck} onClick={async () => { await Promise.all(unread.map((n) => post(`/notifications/${n.id}/read`))); reload(); }}>{t('Mark all as read')}</Button>} />
      {data.length === 0 ? <Empty text={t('No notification yet.')} /> : (
        <ul className="list-plain">
          {data.map((n) => (
            <li key={n.id} className={n.read_at ? '' : 'unread'}>
              <div className="row between" style={{ gap: 12 }}>
                <div>
                  <div className={n.read_at ? '' : 'strong'}>{n.subject}</div>
                  <div className="small muted pre">{n.body}</div>
                  <div className="xs muted">{t(CATEGORY_LABEL[n.category] || n.category)} · {String(n.created_at).slice(0, 16).replace('T', ' ')}</div>
                </div>
                {!n.read_at && <Button size="sm" variant="ghost" onClick={() => markRead(n)}>{t('Mark as read')}</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Preferences() {
  const { t } = useI18n();
  const toast = useToast();
  const { data, setData } = useFetch('/notification-prefs');
  const hooks = useFetch('/webhooks');
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState(null);
  const [err, setErr] = useState(null);
  if (!data) return <Skeleton h={300} />;
  const toggle = async (category, channel, enabled) => {
    setData((d) => ({ ...d, prefs: { ...d.prefs, [`${category}|${channel}`]: enabled } }));
    try { await put('/notification-prefs', { category, channel, enabled }); } catch (e) { toast.err(e); }
  };
  return (
    <div className="stack">
      <Card>
        <CardHead title={t('Channels by category')} subtitle={t('Choose where each kind of notification reaches you. In-app is on by default.')} />
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>{t('Category')}</th>{data.channels.map((c) => <th key={c} style={{ textAlign: "center" }}>{t(CHANNEL_LABEL[c])}</th>)}</tr></thead>
            <tbody>{data.categories.map((cat) => (
              <tr key={cat}><td>{t(CATEGORY_LABEL[cat] || cat)}</td>
                {data.channels.map((ch) => <td key={ch} style={{ textAlign: "center" }}><Check label={<span className="sr-only">{`${t(CATEGORY_LABEL[cat])} · ${t(CHANNEL_LABEL[ch])}`}</span>} checked={!!data.prefs[`${cat}|${ch}`]} onChange={(e) => toggle(cat, ch, e.target.checked)} /></td>)}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
      <Card>
        <CardHead title={t('My webhooks')} subtitle={t('Webhook notifications are posted to these addresses with an HMAC-SHA256 signature.')} />
        {hooks.data?.length ? (
          <ul className="list-plain">{hooks.data.map((h) => <li key={h.id} className="row between"><code className="small">{h.url}</code>{h.user_id && <Button size="sm" variant="ghost" icon={Trash2} onClick={async () => { await del(`/webhooks/${h.id}`); hooks.reload(); }}>{t('Remove')}</Button>}</li>)}</ul>
        ) : <p className="muted small">{t('No webhook yet.')}</p>}
        <div className="row" style={{ gap: 12, alignItems: 'flex-end', marginTop: 12 }}>
          <div style={{ flex: 1 }}><Field label={t('Webhook URL')}><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://hooks.example.com/cortexplm" /></Field></div>
          <Button icon={Plus} disabled={!url} onClick={async () => { setErr(null); try { const r = await post('/webhooks', { url }); setSecret(r.secret); setUrl(''); hooks.reload(); } catch (e) { setErr(e); } }}>{t('Add webhook')}</Button>
        </div>
        {secret && <div className="callout good" style={{ marginTop: 12 }}><div>{t('Signing secret (shown once):')} <code>{secret}</code></div></div>}
        <ErrorNote error={err} />
      </Card>
    </div>
  );
}

function Deliveries() {
  const { t } = useI18n();
  const { can } = useAuth();
  const toast = useToast();
  const [all, setAll] = useState(false);
  const { data, reload } = useFetch(`/deliveries${all ? '?all=1' : ''}`);
  return (
    <Card>
      <CardHead title={t('Delivery log')} subtitle={t('Each channel delivery with its status and attempts. Failed deliveries are retried automatically.')}
        actions={<>{can('alert.manage') && <Check label={t('Whole organization')} checked={all} onChange={(e) => setAll(e.target.checked)} />}
          <Button icon={RefreshCw} onClick={async () => { await post('/deliveries/retry'); toast.ok(t('Queue processed.')); reload(); }}>{t('Retry now')}</Button></>} />
      {!data ? <Skeleton /> : <DataTable csvName="deliveries" rows={data} columns={[
        { key: 'created_at', label: t('Date'), render: (d) => <span className="xs num">{String(d.created_at).slice(0, 16).replace('T', ' ')}</span> },
        { key: 'subject', label: t('Subject') }, { key: 'channel', label: t('Channel'), render: (d) => <Badge>{t(CHANNEL_LABEL[d.channel] || d.channel)}</Badge> },
        { key: 'status', label: t('Status'), render: (d) => <StatusBadge value={d.status} /> }, { key: 'attempts', label: t('Attempts'), num: true },
        { key: 'last_error', label: t('Last error'), render: (d) => <span className="xs">{d.last_error || '—'}</span> },
      ]} empty={t('No delivery yet.')} />}
    </Card>
  );
}

export default function Notifications() {
  const { t } = useI18n();
  const [tab, setTab] = useState('inbox');
  return (
    <div className="page">
      <PageHeader eyebrow={t('Communication')} title={t('Notifications')} subtitle={t('Your inbox, how you want to be notified, and what was delivered.')} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'inbox', label: t('Inbox') }, { value: 'prefs', label: t('Preferences') }, { value: 'deliveries', label: t('Delivery log') }]} />
      {tab === 'inbox' && <Inbox />}
      {tab === 'prefs' && <Preferences />}
      {tab === 'deliveries' && <Deliveries />}
      
    </div>
  );
}
