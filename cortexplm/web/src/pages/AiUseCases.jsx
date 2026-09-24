import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import VersionCompare from '../components/VersionCompare.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { post, put, del } from '../lib/api.js';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { PageHeader, Card, CardHead, DataTable, useFetch, Skeleton, ErrorNote, StatusBadge, Tabs, Modal, Button, Check, useToast, Badge, fmtDate, Kpi } from '../components/ui.jsx';
import { FormFields } from '../components/CrudPage.jsx';
import { HBars } from '../components/charts.jsx';

const FIELDS = [
  { key: 'name', label: 'Name', required: true }, { key: 'tier', label: 'Tier', type: 'select', options: ['Assistive', 'Augmented'], required: true },
  { key: 'linked_step', label: 'Linked to: step (MP-01.2), macro process (MP-01), task (UFT-01-01) or E2E process (E2E-01)' }, { key: 'model_task_type', label: 'Model task type' }, { key: 'risk_level', label: 'Risk level', type: 'select', options: ['Low', 'Medium', 'High'] },
  { key: 'module', label: 'Owning module' }, { key: 'trigger_text', label: 'Trigger' }, { key: 'expected_output', label: 'Expected output' },
  { key: 'human_checkpoint', label: 'Human checkpoint', type: 'textarea', required: true }, { key: 'prompt_template', label: 'Prompt template', type: 'textarea', rows: 5 }, { key: 'based_on', label: 'Based on use case' },
];

function Detail({ uc, onClose, onChanged, canManage }) {
  const { t } = useI18n();
  const toast = useToast();
  const { data, reload } = useFetch(`/ai/use-cases/${uc.id}`);
  const [tab, setTab] = useState('details');
  const [f, setF] = useState(uc);
  const [note, setNote] = useState('');
  if (!data) return null;
  const act = async (fn, msg) => { try { await fn(); toast.ok(msg); reload(); onChanged(); } catch (e) { toast.err(e); } };
  return (
    <Modal wide title={`${uc.code} ${uc.name}`} subtitle={t('Every save creates a new version; history is never deleted.')} onClose={onClose}
      footer={canManage && tab === 'details' && <>{data.is_custom ? <Button variant="danger" icon={Trash2} onClick={async () => { if (!window.confirm(t('Delete this custom use case? Its usage log entries are kept.'))) return; try { await del(`/ai/use-cases/${uc.id}`); toast.ok(t('Deleted.')); onChanged(); onClose(); } catch (e) { toast.err(e); } }}>{t('Delete')}</Button> : null}<div className="grow" /><input className="input" style={{ maxWidth: 360 }} placeholder={t('Describe the change (required)')} value={note} onChange={(e) => setNote(e.target.value)} aria-label={t('Describe the change')} /><Button variant="primary" disabled={!note.trim()} onClick={() => act(() => put(`/ai/use-cases/${uc.id}`, { ...f, justification: note }), t('New version saved.'))}>{t('Save new version')}</Button></>}>
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'details', label: t('Details') }, { value: 'versions', label: t('Versions ({n})', { n: data.versions.length }) }]} />
      {tab === 'details' ? (
        <div className="stack">
          <div className="row">
            <Check label={t('Active for the organization')} checked={!!data.active} disabled={!canManage} onChange={(e) => act(() => put(`/ai/use-cases/${uc.id}/activation`, { active: e.target.checked }), t('Activation updated.'))} />
            <StatusBadge value={data.approval_status} />
            {canManage && data.is_custom && data.approval_status !== 'Approved' && <Button size="sm" onClick={() => act(() => put(`/ai/use-cases/${uc.id}/approval`, { status: 'Approved' }), t('Approved.'))}>{t('Approve')}</Button>}
          </div>
          <FormFields fields={FIELDS} value={f} onChange={setF} disabled={!canManage} />
        </div>
      ) : (
        <>
        <DataTable filterable={false} rows={data.versions} columns={[
          { key: 'version', label: t('Version'), num: true }, { key: 'created_at', label: t('Date'), render: (v) => fmtDate(v.created_at) }, { key: 'user_name', label: t('By') }, { key: 'justification', label: t('Change') },
          { key: 'r', label: '', sortable: false, render: (v) => (v.is_current ? <Badge tone="s5">{t('Current')}</Badge> : canManage && <Button size="sm" onClick={() => act(() => post(`/ai/use-cases/${uc.id}/revert/${v.version}`), t('Reverted as a new version.'))}>{t('Restore')}</Button>) },
        ]} />
        <div style={{ marginTop: 16 }}><VersionCompare versions={data.versions} /></div>
        </>
      )}
    </Modal>
  );
}

export default function AiUseCases() {
  const { t } = useI18n();
  const { can, me } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('library');
  const list = useFetch('/ai/use-cases');
  const log = useFetch(tab === 'log' ? '/ai/usage-log' : null);
  const [open, setOpen] = useState(null);
  const [create, setCreate] = useState(null);
  if (list.error) return <div className="page"><ErrorNote error={list.error} /></div>;
  if (!list.data) return <div className="page"><Skeleton h={400} /></div>;
  const manage = can('ai.manage');
  const cfg = me.config;
  const totals = list.data.reduce((a, u) => ({ n: a.n + (u.usage?.n || 0), acc: a.acc + (u.usage?.a || 0) }), { n: 0, acc: 0 });
  return (
    <div className="page">
      <PageHeader eyebrow={t('AI & knowledge · D15')} title={t('AI use cases')} subtitle={t('Governed AI capabilities. Each is Assistive or Augmented, never autonomous, and every suggestion is reviewed by a person.')}
        actions={manage && <Button variant="primary" icon={Plus} onClick={() => setCreate({ tier: 'Assistive', risk_level: 'Low' })}>{t('Add custom use case')}</Button>} />
      <div className="grid kpis" style={{ marginBottom: 24 }}>
        <Kpi value={list.data.filter((u) => u.active).length} label={t('Active use cases')} meta={t('of {n} in the library', { n: list.data.length })} />
        <Kpi value={totals.n ? `${Math.round((totals.acc / totals.n) * 100)}%` : '—'} label={t('Suggestions accepted (KPI-32)')} meta={t('{n} reviewed suggestions', { n: totals.n })} />
        <Kpi value={t(cfg.aiTier)} label={t('AI tier of the subscription')} neutral />
        <Kpi value={`${list.data.filter((u) => u.is_custom).length}/${cfg.quotas.customAiUseCases}`} label={t('Custom use cases (quota)')} neutral />
      </div>
      <p className="small muted" style={{ marginTop: -8 }}>{t('Active use cases also appear, with their Assistive AI or Augmented AI badge, on the E2E processes, macro processes, tasks and steps they are linked to. The live AI model is set in')} <Link to="/admin/configuration">{t('Configuration & AI model')}</Link> {t('or in')} <Link to="/settings">{t('Settings')}</Link>.</p>
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'library', label: t('Library') }, { value: 'log', label: t('Usage log') }]} />
      {tab === 'library' && (
        <div className="grid two">
          <Card>
            <DataTable csvName="ai_use_cases" rows={list.data} onRowClick={setOpen} columns={[
              { key: 'code', label: t('ID') }, { key: 'name', label: t('Use case'), render: (u) => <><div className="strong">{t(u.name)}</div><div className="xs muted">{u.linked_step} · {t(u.model_task_type)}</div></> },
              { key: 'tier', label: t('Tier'), render: (u) => <StatusBadge value={u.tier} /> }, { key: 'risk_level', label: t('Risk'), render: (u) => <StatusBadge value={u.risk_level} /> },
              { key: 'active', label: t('Active'), render: (u) => <StatusBadge value={u.active ? 'On' : 'Off'} /> }, { key: 'custom', label: t('Origin'), csv: (u) => (u.is_custom ? 'Custom' : 'Seeded'), render: (u) => (u.is_custom ? <Badge tone="accent">{t('Custom')}</Badge> : <Badge>{t('Seeded')}</Badge>) },
            ]} />
          </Card>
          <Card><CardHead title={t('Suggestions by use case')} />
            <HBars data={list.data.filter((u) => u.usage?.n).map((u) => ({ label: u.code, value: u.usage.n }))} caption={t('Number of reviewed suggestions per use case.')} />
          </Card>
        </div>
      )}
      {tab === 'log' && (log.data ? <Card><p className="muted">{t('Append-only: entries cannot be edited or deleted.')}</p><DataTable csvName="ai_usage_log" rows={log.data} columns={[
        { key: 'created_at', label: t('When'), render: (l) => l.created_at.slice(0, 16).replace('T', ' ') }, { key: 'use_case_code', label: t('Use case') }, { key: 'project_code', label: t('Project') },
        { key: 'user_name', label: t('User') }, { key: 'outcome', label: t('Outcome'), render: (l) => <StatusBadge value={l.outcome} /> }, { key: 'source', label: t('Source'), render: (l) => t(l.source) },
        { key: 'confidence', label: t('Confidence'), num: true, render: (l) => (l.confidence != null ? `${Math.round(l.confidence * 100)}%` : '—') },
      ]} /></Card> : <Skeleton />)}
      {open && <Detail uc={open} canManage={manage} onClose={() => setOpen(null)} onChanged={list.reload} />}
      {create && (
        <Modal wide title={t('New custom AI use case')} subtitle={t('Custom use cases start inactive and pending approval.')} onClose={() => setCreate(null)}
          footer={<><Button onClick={() => setCreate(null)}>{t('Cancel')}</Button><Button variant="primary" onClick={async () => { try { await post('/ai/use-cases', create); toast.ok(t('Custom use case created (version 1).')); setCreate(null); list.reload(); } catch (e) { toast.err(e); } }}>{t('Create')}</Button></>}>
          <FormFields fields={FIELDS} value={create} onChange={setCreate} />
        </Modal>
      )}
    </div>
  );
}
