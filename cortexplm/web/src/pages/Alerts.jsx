import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCheck, RefreshCw, EyeOff, Check } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { post, put } from '../lib/api.js';
import { PageHeader, Card, DataTable, useFetch, Skeleton, StatusBadge, Button, Tabs, Check as CheckBox, useToast, IconButton, fmtDate } from '../components/ui.jsx';

export default function Alerts() {
  const { can } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const [tab, setTab] = useState('inbox');
  const [showResolved, setShowResolved] = useState(false);
  const inbox = useFetch(`/alerts?resolved=${showResolved ? 1 : 0}`);
  const settings = useFetch(tab === 'settings' ? '/alert-settings' : null);
  const act = async (fn, msg) => { try { await fn(); if (msg) toast.ok(msg); inbox.reload(); } catch (e) { toast.err(e); } };
  const unread = (inbox.data || []).filter((a) => !a.read_at).length;
  return (
    <div className="page">
      <PageHeader eyebrow={t('Notification center')} title={t('Alerts')} subtitle={inbox.data ? t('{n} unread of {m} open alerts.', { n: unread, m: inbox.data.length }) : ''}
        actions={<>
          <Button icon={CheckCheck} onClick={() => act(() => post('/alerts/read-all'), t('All alerts marked as read.'))}>{t('Mark all as read')}</Button>
          {can('alert.manage') && <Button icon={RefreshCw} onClick={() => act(async () => { const r = await post('/alerts/run'); toast.ok(t('{n} new alerts raised.', { n: r.raised })); })}>{t('Run checks now')}</Button>}
        </>} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'inbox', label: t('Inbox') }, { value: 'settings', label: t('Alert types') }]} />
      {tab === 'inbox' && (!inbox.data ? <Skeleton /> : (
        <Card>
          <DataTable csvName="alerts" rows={inbox.data}
            toolbar={<CheckBox label={t('Show resolved alerts')} checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />}
            columns={[
              { key: 'severity', label: t('Severity'), render: (a) => <StatusBadge value={a.severity} /> },
              { key: 'type', label: t('Alert'), csv: (a) => `${a.type} ${a.name}`, render: (a) => <><div className={a.read_at ? '' : 'strong'}>{t(a.name)}</div><div className="xs muted">{a.type} · {a.process}</div></> },
              { key: 'message', label: t('What happened'), render: (a) => <>{a.message}{a.project_id ? <> · <Link to={`/projects/${a.project_id}`}>{t('Open project')}</Link></> : null}</> },
              { key: 'escalation', label: t('Escalation path'), render: (a) => <span className="xs">{a.escalation}</span> },
              { key: 'created_at', label: t('Raised'), render: (a) => <>{fmtDate(a.created_at)}{a.resolved_at && <div className="xs muted">{t('Resolved')} {fmtDate(a.resolved_at)}</div>}</> },
              { key: 'actions', label: '', sortable: false, noCsv: true, render: (a) => (
                <div className="row" style={{ gap: 4 }} onClick={(e) => e.stopPropagation()}>
                  {!a.read_at && <IconButton icon={Check} size="sm" label={t('Mark as read')} onClick={() => act(() => post(`/alerts/${a.id}/read`))} />}
                  <IconButton icon={EyeOff} size="sm" label={t('Dismiss')} onClick={() => act(() => post(`/alerts/${a.id}/dismiss`), t('Alert dismissed.'))} />
                </div>) },
            ]} />
        </Card>
      ))}
      {tab === 'settings' && (!settings.data ? <Skeleton /> : (
        <Card>
          <p className="muted">{t('Each alert type is defined once in the shared catalog and used by both live checks and demo data.')}</p>
          <DataTable csvName="alert_types" rows={settings.data} columns={[
            { key: 'type', label: t('Code') }, { key: 'name', label: t('Alert'), render: (a) => t(a.name) }, { key: 'rule', label: t('Rule') },
            { key: 'severity', label: t('Severity'), render: (a) => <StatusBadge value={a.severity} /> }, { key: 'process', label: t('Process') },
            { key: 'enabled', label: t('Enabled'), csv: (a) => (a.enabled ? 'Yes' : 'No'), render: (a) => (
              <CheckBox label={a.enabled ? t('On') : t('Off')} checked={a.enabled} disabled={!can('alert.manage')}
                onChange={async (e) => { try { await put(`/alert-settings/${a.type}`, { enabled: e.target.checked }); settings.reload(); } catch (err) { toast.err(err); } }} />) },
          ]} />
        </Card>
      ))}
    </div>
  );
}
