import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Loading, ErrorBox, Status, Tabs, Table, tx, Modal, Field, Card } from '../components/ui.jsx';
import { VersionsButton } from '../components/Versions.jsx';
import PromptSpecModal from '../components/PromptSpec.jsx';
import { NoProject } from './Home.jsx';

export default function AiUseCases() {
  const { t, L, lang, project, projectId, fmtDate, toast, can, readOnly } = useApp();
  const [tab, setTab] = useState('library');
  const orgId = project?.org?.id;
  const lib = useData(orgId ? `/orgs/${orgId}/ai/usecases` : null);
  const logs = useData(tab === 'log' && projectId ? `/projects/${projectId}/ai/log` : null);
  const ov = useData(projectId ? `/projects/${projectId}/ai/overrides` : null);
  const [sel, setSel] = useState(null);
  const [nw, setNw] = useState(null);
  const [spec, setSpec] = useState(null);
  if (!project) return <NoProject />;
  const manage = can('ai.manage') && !readOnly;
  const override = (id) => ov.data?.find(o => o.usecase_id === id)?.state || 'Inherit';
  const setActive = async (u, active) => { try { await api(`/ai/usecases/${u.id}`, { method: 'PUT', body: { active, approval: u.custom && active ? 'Approved' : undefined } }); lib.reload(); } catch (e) { toast(e.message, 'error'); } };
  const setOverride = async (u, state) => { try { await api(`/projects/${projectId}/ai/overrides/${u.id}`, { method: 'PUT', body: { state } }); ov.reload(); toast(t('Project setting saved.')); } catch (e) { toast(e.message, 'error'); } };
  const create = async () => { try { await api(`/orgs/${orgId}/ai/usecases`, { method: 'POST', body: nw }); toast(t('Custom use case created; approve it before activation.')); setNw(null); lib.reload(); } catch (e) { toast(e.message, 'error'); } };
  return (
    <>
      <PageHead eyebrow={t('Intelligence')} title={t('AI use cases')} subtitle={lib.data ? t('Tier available: {tier}. Every suggestion names a human checkpoint and is logged with its confidence and outcome.', { tier: lib.data.tier }) : ''} actions={manage && <button className="btn btn-primary" onClick={() => setNw({ name: '', taskType: 'Text Generation', tier: 'Assistive', checkpoint: '', prompt: '', riskLevel: 'Medium' })}><Plus size={16} />{t('Custom use case')}</button>} />
      <Tabs label={t('AI views')} value={tab} onChange={setTab} tabs={[{ id: 'library', label: t('Library') }, { id: 'log', label: t('Usage log') }]} />
      {tab === 'library' && (lib.error ? <ErrorBox error={lib.error} /> : lib.loading && !lib.data ? <Loading /> : (
        <Table rows={lib.data.items} onRowClick={setSel} columns={[
          { key: 'code', label: t('Code'), width: 100 }, { key: 'name', label: t('Use case'), render: u => <span className="strong">{tx(u.name, lang)}</span>, sortValue: u => tx(u.name, lang) },
          { key: 'tier', label: t('Tier'), render: u => <span className={`tag ${u.entitled ? '' : 's1'}`}>{L(u.tier)}{u.entitled ? '' : ` · ${t('not licensed')}`}</span> },
          { key: 'risk_level', label: t('Risk'), render: u => <Status value={u.risk_level} /> }, { key: 'linked_step', label: t('Linked step'), render: u => (u.linked_step ? `${u.linked_step} (${tx(u.step_name, lang) || ''})` : u.linked_mp ? `${u.linked_mp} (${tx(u.mp_name, lang) || ''})` : '—') },
          { key: 'usage', label: t('Uses'), render: u => u.usage?.n || 0, sortValue: u => u.usage?.n || 0 },
          { key: 'acc', label: t('Accepted'), render: u => (u.usage?.n ? `${Math.round(100 * ((u.usage.acc || 0) + (u.usage.ed || 0)) / u.usage.n)}%` : '—') },
          { key: 'active', label: t('Organization'), render: u => <Status value={u.active ? 'Active' : 'Disabled'} /> },
          { key: 'ov', label: t('This project'), render: u => L(override(u.id)) },
        ]} />
      ))}
      {tab === 'log' && (logs.data ? <Table rows={logs.data} columns={[{ key: 'created_at', label: t('Date'), render: l => fmtDate(l.created_at) }, { key: 'usecase_code', label: t('Use case'), render: l => `${l.usecase_code || '—'} ${tx(l.usecase_name, lang) || ''}` }, { key: 'user_name', label: t('User') }, { key: 'record_type', label: t('Record') }, { key: 'confidence', label: t('Confidence'), render: l => `${Math.round((l.confidence || 0) * 100)}%` }, { key: 'outcome', label: t('Outcome'), render: l => <Status value={l.outcome} /> }]} /> : <Loading />)}
      {sel && (
        <Modal wide title={`${sel.code} — ${tx(sel.name, lang)}`} onClose={() => setSel(null)} footer={<><button className="btn btn-primary" onClick={() => { setSpec(sel); setSel(null); }}>{t('Prompt specification')}</button><VersionsButton type="ai_usecase" id={sel.id} onReverted={lib.reload} /><button className="btn" onClick={() => setSel(null)}>{t('Close')}</button></>}>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <Card tight className="flat"><div className="xsmall muted">{t('Task type')}</div><div className="small strong">{tx(sel.task_type, lang)}</div></Card>
            <Card tight className="flat"><div className="xsmall muted">{t('Human checkpoint')}</div><div className="small strong">{tx(sel.checkpoint, lang)}</div></Card>
            <Card tight className="flat"><div className="xsmall muted">{t('Linked step')}</div><div className="small strong">{sel.linked_step ? `${sel.linked_step} (${tx(sel.step_name, lang) || ''})` : '—'}</div></Card>
            <Card tight className="flat"><div className="xsmall muted">{t('Approval')}</div><div className="small strong">{sel.approval}</div></Card>
          </div>
          {sel.prompt && <p className="small" style={{ marginTop: 16 }}><span className="strong">{t('Prompt')}: </span>{tx(sel.prompt, lang)}</p>}
          {manage && (
            <div className="row" style={{ marginTop: 16 }}>
              <button className="btn" onClick={() => { setActive(sel, !sel.active); setSel(null); }}>{sel.active ? t('Deactivate for the organization') : t('Approve and activate')}</button>
              <label className="small strong" htmlFor="ov">{t('This project')}</label>
              <select id="ov" className="select" style={{ width: 'auto' }} value={override(sel.id)} onChange={e => setOverride(sel, e.target.value)}>{['Inherit', 'Active', 'Inactive'].map(s => <option key={s} value={s}>{L(s)}</option>)}</select>
            </div>
          )}
        </Modal>
      )}
      {spec && <PromptSpecModal usecase={spec} onClose={() => setSpec(null)} onSaved={lib.reload} />}
      {nw && (
        <Modal title={t('Custom use case')} onClose={() => setNw(null)} footer={<><button className="btn" onClick={() => setNw(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!nw.name || !nw.checkpoint} onClick={create}>{t('Create')}</button></>}>
          <div className="stack">
            <Field label={t('Name')} required>{(id) => <input id={id} className="input" value={nw.name} onChange={e => setNw({ ...nw, name: e.target.value })} />}</Field>
            <div className="form-grid">
              <Field label={t('Task type')}>{(id) => <select id={id} className="select" value={nw.taskType} onChange={e => setNw({ ...nw, taskType: e.target.value })}>{['Text Generation', 'Summarization', 'Classification', 'Recommendation', 'Prediction'].map(x => <option key={x} value={x}>{t(x)}</option>)}</select>}</Field>
              <Field label={t('Tier')}>{(id) => <select id={id} className="select" value={nw.tier} onChange={e => setNw({ ...nw, tier: e.target.value })}><option value="Assistive">{L('Assistive')}</option><option value="Augmented">{L('Augmented')}</option></select>}</Field>
              <Field label={t('Risk')}>{(id) => <select id={id} className="select" value={nw.riskLevel} onChange={e => setNw({ ...nw, riskLevel: e.target.value })}>{['Low', 'Medium', 'High'].map(x => <option key={x} value={x}>{L(x)}</option>)}</select>}</Field>
              <Field label={t('Linked process (MP-xxx)')}>{(id) => <input id={id} className="input" value={nw.linkedMp || ''} onChange={e => setNw({ ...nw, linkedMp: e.target.value })} />}</Field>
              <Field label={t('Linked step (MP-xxx.n)')} hint={t('The prompt specification is then populated for this step.')}>{(id) => <input id={id} className="input" value={nw.linkedStep || ''} onChange={e => setNw({ ...nw, linkedStep: e.target.value })} />}</Field>
            </div>
            <Field label={t('Human checkpoint')} required hint={t('Who accepts, edits or rejects the suggestion, and when.')}>{(id) => <input id={id} className="input" value={nw.checkpoint} onChange={e => setNw({ ...nw, checkpoint: e.target.value })} />}</Field>
            <Field label={t('Prompt')}>{(id) => <textarea id={id} className="textarea" value={nw.prompt} onChange={e => setNw({ ...nw, prompt: e.target.value })} />}</Field>
          </div>
        </Modal>
      )}
    </>
  );
}
