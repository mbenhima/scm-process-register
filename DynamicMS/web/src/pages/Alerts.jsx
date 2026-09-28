import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertOctagon, Gauge, FileText, CheckSquare, Flag, Scale, ListChecks } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Card, Loading, ErrorBox, Status, Tabs, Table, tx, IconBadge, Empty } from '../components/ui.jsx';
import { NoProject } from './Home.jsx';

const ICON = { step: ListChecks, nc: AlertOctagon, kpi: Gauge, document: FileText, action: CheckSquare, phase: Flag, rule: Scale, risk: AlertOctagon };
const LINK = { step: (id) => `/steps/${id}`, nc: (id) => `/ncs/${id}`, kpi: () => '/kpis', document: (id) => `/documents/${id}`, action: () => '/actions', phase: () => '/lifecycle', rule: () => '/rules', risk: () => '/risks' };

export default function Alerts() {
  const { t, L, lang, projectId, project, fmtDate, toast, can, setAlertCount } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('inbox');
  const [filter, setFilter] = useState('');
  const list = useData(projectId && tab === 'inbox' ? `/alerts?projectId=${projectId}&limit=200${filter}` : null, [filter]);
  const catalog = useData(tab === 'catalog' ? '/alerts/catalog' : null);
  const settings = useData(tab === 'settings' && project ? `/orgs/${project.org.id}/alert-settings` : null);
  const disp = useData(tab === 'dispatch' && project ? `/orgs/${project.org.id}/dispatches` : null);
  if (!projectId) return <NoProject />;
  const mark = async (a, body) => { try { await api(`/alerts/${a.id}`, { method: 'PUT', body }); list.reload(); if (body.read) setAlertCount(c => Math.max(0, c - 1)); } catch (e) { toast(e.message, 'error'); } };
  const readAll = async () => { await api('/alerts/read-all', { method: 'POST', body: { projectId } }); setAlertCount(0); list.reload(); };
  const open = (a) => { if (!a.read_at) mark(a, { read: true }); const f = LINK[a.entity_type]; if (f) navigate(f(a.entity_id)); };
  const toggleType = async (type, on) => { try { await api(`/orgs/${project.org.id}/alert-settings`, { method: 'PUT', body: { [type]: on } }); settings.reload(); } catch (e) { toast(e.message, 'error'); } };
  const tabs = [{ id: 'inbox', label: t('Notifications') }, { id: 'catalog', label: t('Alert catalog') }, { id: 'settings', label: t('Settings') }, ...(can('alerts.manage') ? [{ id: 'dispatch', label: t('Dispatch log') }] : [])];
  return (
    <>
      <PageHead eyebrow={t('Work')} title={t('Alerts')} subtitle={t('Alerts are raised once per record and period, then sent in-app and by e-mail to the roles on the escalation path.')} actions={tab === 'inbox' && <button className="btn" onClick={readAll}>{t('Mark all as read')}</button>} />
      <Tabs label={t('Alert views')} value={tab} onChange={setTab} tabs={tabs} />
      {tab === 'inbox' && (
        <>
          <div className="row" style={{ marginBottom: 16 }} role="group" aria-label={t('Filter')}>
            {[['', t('All')], ['&unread=1', t('Unread')], ['&mine=1', t('For my roles')], ['&severity=Critical', L('Critical')], ['&severity=High', L('High')]].map(([v, l]) => <button key={v} className="btn btn-sm" aria-pressed={filter === v} style={filter === v ? { background: 'var(--pa-orange-tint)', borderColor: 'var(--pa-orange)' } : undefined} onClick={() => setFilter(v)}>{l}</button>)}
          </div>
          {list.error && <ErrorBox error={list.error} />}
          {list.loading && !list.data ? <Loading /> : list.data && (list.data.items.length ? (
            <Card>
              <p className="small muted">{t('{n} alerts, {u} unread', { n: list.data.total, u: list.data.unread })}</p>
              <ul className="list">
                {list.data.items.map(a => {
                  const I = ICON[a.entity_type] || Bell;
                  return (
                    <li key={a.id} className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                      <IconBadge icon={I} accent={!a.read_at && ['Critical', 'High'].includes(a.severity)} size="sm" />
                      <button className="link-btn" style={{ textAlign: 'start', fontWeight: a.read_at ? 400 : 700, flex: 1, textDecoration: 'none' }} onClick={() => open(a)}>
                        {tx(a.title, lang)}<br /><span className="xsmall muted" style={{ fontWeight: 400 }}>{a.type} · {fmtDate(a.created_at)}{a.step_ref ? ` · ${a.step_ref}` : ''}</span>
                      </button>
                      <Status value={a.severity} />
                      {!a.read_at && <button className="btn btn-sm btn-ghost" onClick={() => mark(a, { read: true })}>{t('Mark read')}</button>}
                      <button className="btn btn-sm btn-ghost" onClick={() => mark(a, { dismissed: true })}>{t('Dismiss')}</button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ) : <Empty icon={Bell} title={t('No alert.')} />)}
        </>
      )}
      {tab === 'catalog' && (catalog.data ? <Table rows={catalog.data} columns={[{ key: 'id', label: t('Type'), width: 160 }, { key: 'name', label: t('Name'), render: a => tx(a.name, lang) }, { key: 'severity', label: t('Severity'), render: a => <Status value={a.severity} /> }, { key: 'source', label: t('Source'), render: a => (a.source === 'engine' ? t('Alert engine') : t('Process design')) }, { key: 'escalation', label: t('Escalation'), render: a => (a.escalation || []).map(x => tx(x, lang)).join(' → ') }]} /> : <Loading />)}
      {tab === 'settings' && (settings.data ? (
        <Card title={t('Alert types enabled for the organization')}>
          <div className="stack-8">{settings.data.map(s => <label key={s.type} className="checkbox"><input type="checkbox" checked={!!s.enabled} disabled={!can('alerts.manage')} onChange={e => toggleType(s.type, e.target.checked)} /><span>{s.type}</span></label>)}</div>
        </Card>
      ) : <Loading />)}
      {tab === 'dispatch' && (disp.data ? <Table rows={disp.data} columns={[{ key: 'at', label: t('Date'), render: d => fmtDate(d.at) }, { key: 'user_name', label: t('Recipient') }, { key: 'category', label: t('Type') }, { key: 'subject', label: t('Subject'), render: d => tx(d.subject, lang) }, { key: 'channel', label: t('Channel') }, { key: 'status', label: t('Status'), render: d => <Status value={d.status} /> }]} /> : <Loading />)}
    </>
  );
}
