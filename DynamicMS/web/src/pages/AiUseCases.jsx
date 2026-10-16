// AI Use Case Library (FR-DA-AI-22): figures above the library, filters by tier, state and
// origin, creation disabled at the Solution Pack quota; the Coverage of the Process Design
// (FR-DA-AI-13) with a suggestion for a task without AI (FR-DA-AIP-11); the usage log.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, Wand2 } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Loading, ErrorBox, Status, Tabs, Table, Kpi, tx } from '../components/ui.jsx';
import AiUseCaseForm from '../components/AiUseCaseForm.jsx';
import { NoProject } from './Home.jsx';

export default function AiUseCases() {
  const { t, L, lang, project, projectId, fmtDate, toast, can, readOnly } = useApp();
  const nav = useNavigate();
  const [tab, setTab] = useState('library');
  const [flt, setFlt] = useState({ tier: '', state: '', origin: '' });
  const [cov, setCov] = useState({ tier: '', covered: '' });
  const [nw, setNw] = useState(false);
  const orgId = project?.org?.id;
  const qs = new URLSearchParams(Object.entries({ projectId: projectId || '', ...flt }).filter(([, v]) => v)).toString();
  const lib = useData(orgId ? `/orgs/${orgId}/ai/usecases?${qs}` : null);
  const cq = new URLSearchParams(Object.entries({ projectId: projectId || '', ...cov }).filter(([, v]) => v)).toString();
  const coverage = useData(tab === 'coverage' && orgId ? `/orgs/${orgId}/ai/coverage?${cq}` : null);
  const logs = useData(tab === 'log' && projectId ? `/projects/${projectId}/ai/log` : null);
  if (!project) return <NoProject />;
  const manage = can('ai.manage') && !readOnly;
  const fig = lib.data?.figures;
  const suggest = async (task) => { try { const r = await api(`/orgs/${orgId}/ai/usecases/suggest`, { method: 'POST', body: { taskId: task.id } }); toast(t('Use case suggested as a deactivated Draft with a complete specification; review it before activation.')); nav(`/ai/${r.id}`); } catch (e) { toast(e.message, 'error'); } };
  const select = (label, value, onChange, options) => <label className="field" style={{ minWidth: 150 }}><span className="xsmall muted">{label}</span><select className="select" value={value} onChange={e => onChange(e.target.value)}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>;
  return (
    <>
      <PageHead eyebrow={t('Intelligence')} title={t('AI use cases')} subtitle={lib.data ? t('Tier available: {tier}. Every suggestion names a human checkpoint and is logged with its confidence and outcome.', { tier: lib.data.tier }) : ''}
        actions={manage && <button type="button" className="btn btn-primary" disabled={!fig || fig.quotaReached} title={fig?.quotaReached ? t('Custom use case quota reached ({n}).', { n: fig.customQuota }) : undefined} onClick={() => setNw(true)}><Plus size={16} />{t('Custom use case')}</button>} />
      {fig && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 16 }} aria-label={t('Library figures')}>
          <Kpi value={fig.byTier.Assistive} label={t('Assistive AI')} icon={Sparkles} />
          <Kpi value={fig.byTier.Augmented} label={t('Augmented AI')} icon={Sparkles} accent />
          <Kpi value={fig.activeProject ?? fig.activeOrg} label={projectId ? t('Active in this project') : t('Active in the organization')} foot={projectId ? t('{n} in the organization', { n: fig.activeOrg }) : undefined} />
          <Kpi value={`${fig.custom} / ${fig.customQuota}`} label={t('Custom use cases (quota)')} foot={fig.quotaReached ? t('Quota reached') : undefined} />
          <Kpi value={`${fig.completeness}%`} label={t('Average specification completeness')} />
          <Kpi value={`${fig.tasksSupported} / ${fig.tasksTotal}`} label={t('Tasks supported by AI')} />
        </div>
      )}
      {fig?.quotaReached && manage && <p className="callout warn small" role="status">{t('The Solution Pack allows {n} custom AI use cases; creation and duplication are disabled until one is deleted.', { n: fig.customQuota })}</p>}
      <Tabs label={t('AI views')} value={tab} onChange={setTab} tabs={[{ id: 'library', label: t('Library') }, { id: 'coverage', label: t('Coverage of the process design') }, { id: 'log', label: t('Usage log') }]} />
      {tab === 'library' && (
        <>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            {select(t('Tier'), flt.tier, v => setFlt({ ...flt, tier: v }), [['', t('All')], ['Assistive', t('Assistive AI')], ['Augmented', t('Augmented AI')]])}
            {select(t('State'), flt.state, v => setFlt({ ...flt, state: v }), [['', t('All')], ['active', t('Active')], ['inactive', t('Inactive')]])}
            {select(t('Origin'), flt.origin, v => setFlt({ ...flt, origin: v }), [['', t('All')], ['standard', t('Standard')], ['custom', t('Custom')]])}
          </div>
          {lib.error ? <ErrorBox error={lib.error} /> : !lib.data ? <Loading /> : (
            <Table rows={lib.data.items} onRowClick={u => nav(`/ai/${u.id}`)} columns={[
              { key: 'code', label: t('Code'), width: 100 }, { key: 'name', label: t('Use case'), render: u => <span className="strong">{tx(u.name, lang)}</span>, sortValue: u => tx(u.name, lang) },
              { key: 'tier', label: t('Tier'), render: u => <span className={`tag ${u.entitled ? '' : 's1'}`}>{u.tier === 'Augmented' ? t('Augmented AI') : t('Assistive AI')}{u.entitled ? '' : ` · ${t('not licensed')}`}</span> },
              { key: 'linked_step', label: t('Primary step'), render: u => (u.linked_step ? `${u.linked_step} (${tx(u.step_name, lang) || ''})` : u.module || '—') },
              { key: 'completeness', label: t('Specification'), render: u => `${u.completeness}%` },
              { key: 'usage', label: t('Uses'), render: u => u.usage?.n || 0, sortValue: u => u.usage?.n || 0 },
              { key: 'acc', label: t('Accepted'), render: u => { const d = (u.usage?.acc || 0) + (u.usage?.ed || 0) + (u.usage?.rej || 0); return d ? `${Math.round(100 * ((u.usage.acc || 0) + (u.usage.ed || 0)) / d)}%` : '—'; } },
              { key: 'approval', label: t('Approval'), render: u => L(u.approval || '—') },
              { key: 'active', label: t('Organization'), render: u => <Status value={u.active ? 'Active' : 'Disabled'} /> },
              ...(projectId ? [{ key: 'projectActive', label: t('This project'), render: u => <Status value={u.projectActive ? 'Active' : 'Disabled'} /> }] : []),
            ]} />
          )}
        </>
      )}
      {tab === 'coverage' && (
        <>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            {select(t('Tier'), cov.tier, v => setCov({ ...cov, tier: v }), [['', t('All')], ['Assistive', t('Assistive AI')], ['Augmented', t('Augmented AI')]])}
            {select(t('Coverage'), cov.covered, v => setCov({ ...cov, covered: v }), [['', t('All tasks')], ['1', t('Covered')], ['0', t('Not covered')]])}
            {coverage.data && <span className="small" role="status">{t('{c} of {n} tasks covered by an active AI use case.', { c: coverage.data.covered, n: coverage.data.total })}</span>}
          </div>
          {coverage.error ? <ErrorBox error={coverage.error} /> : !coverage.data ? <Loading /> : (
            <Table rows={coverage.data.items} columns={[
              { key: 'id', label: t('Task'), width: 110 }, { key: 'name', label: t('Name'), render: x => tx(x.name, lang), sortValue: x => tx(x.name, lang) },
              { key: 'mp', label: t('Macro process'), render: x => `${x.mpCode || x.mp} — ${tx(x.mpName, lang) || ''}` },
              { key: 'usecases', label: t('AI use cases'), sortable: false, render: x => (x.usecases.length ? x.usecases.map(u => <button key={u.id} type="button" className="tag" style={{ marginInlineEnd: 4 }} onClick={() => nav(`/ai/${u.id}`)}>{u.code}{u.active ? '' : ` · ${t('inactive')}`}</button>) : <span className="muted small">{t('None')}</span>) },
              { key: 'covered', label: t('Covered'), render: x => <Status value={x.covered ? 'Active' : 'Not covered'} /> },
              ...(manage ? [{ key: 'act', label: '', sortable: false, render: x => (!x.covered && !fig?.quotaReached ? <button type="button" className="btn btn-sm" onClick={(e) => { e.stopPropagation(); suggest(x); }}><Wand2 size={14} />{t('Suggest a use case')}</button> : null) }] : []),
            ]} />
          )}
        </>
      )}
      {tab === 'log' && (logs.data ? <Table rows={logs.data} columns={[
        { key: 'created_at', label: t('Date'), render: l => fmtDate(l.created_at) },
        { key: 'usecase_code', label: t('Use case'), render: l => `${l.usecase_code || '—'} ${tx(l.usecase_name, lang) || ''}` },
        { key: 'user_name', label: t('User') }, { key: 'record_type', label: t('Record') },
        { key: 'engine', label: t('Engine'), render: l => `${l.engine || '—'}${l.model ? ` · ${l.model}` : ''}` },
        { key: 'spec_version', label: t('Spec.'), render: l => (l.spec_version ? `v${l.spec_version}` : '—') },
        { key: 'confidence', label: t('Confidence'), render: l => (l.parent_id ? '' : `${Math.round((l.confidence || 0) * 100)}%`) },
        { key: 'outcome', label: t('Outcome'), render: l => <><Status value={l.outcome} />{l.item !== null && l.item !== undefined ? <span className="xsmall muted"> · {t('item {n}', { n: l.item + 1 })}</span> : null}</> },
      ]} /> : <Loading />)}
      {nw && <AiUseCaseForm orgId={orgId} onClose={() => setNw(false)} onSaved={(id) => { setNw(false); nav(`/ai/${id}`); }} />}
    </>
  );
}
