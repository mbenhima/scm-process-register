// The page of one AI Use Case (FR-DA-AI-21): identification, links with their fields,
// activation for the organization and the current project, the twelve fields of the prompt
// specification with their completeness, the assembled prompt with a test run, versions with
// revert, and the usage log with the count of each outcome.
import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, Pencil, Copy, Trash2, Play, FileText, Sparkles, ShieldCheck } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Card, Loading, ErrorBox, Status, Table, Modal, Field, Progress, Kpi, tx } from '../components/ui.jsx';
import { VersionsButton } from '../components/Versions.jsx';
import PromptSpecModal from '../components/PromptSpec.jsx';
import AiUseCaseForm from '../components/AiUseCaseForm.jsx';
import { ConfirmDialog } from '../components/multientry/dialogs.jsx';

const LINK_LABEL = { step: 'Step', task: 'Task', mp: 'Macro process', e2e: 'End-to-end process', module: 'Place in the application' };

export default function AiUseCase() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t, L, lang, projectId, project, can, readOnly, toast, fmtDate } = useApp();
  const { data: u, error, reload } = useData(`/ai/usecases/${id}?raw=1${projectId ? `&projectId=${projectId}` : ''}`);
  const [form, setForm] = useState(false);
  const [spec, setSpec] = useState(false);
  const [prompt, setPrompt] = useState(null);
  const [test, setTest] = useState(null);
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(false);
  const [act, setAct] = useState(null);
  if (error) return <ErrorBox error={error} />;
  if (!u) return <Loading />;
  const manage = can('ai.manage') && !readOnly;
  const orgId = u.org_id;
  const step = u.step;
  const showPrompt = async () => { try { setPrompt(await api(`/ai/usecases/${u.id}/prompt?projectId=${projectId}`)); } catch (e) { toast(e.message, 'error'); } };
  const runTest = async () => { setBusy(true); try { setTest(await api(`/ai/usecases/${u.id}/test`, { method: 'POST', body: { projectId, input: '' } })); reload(); } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); } };
  const duplicate = async () => { try { const r = await api(`/ai/usecases/${u.id}/duplicate`, { method: 'POST', body: {} }); toast(t('Duplicate created as a deactivated Draft.')); nav(`/ai/${r.id}`); } catch (e) { toast(e.message, 'error'); } };
  const remove = async () => { try { await api(`/ai/usecases/${u.id}`, { method: 'DELETE' }); toast(t('Custom use case deleted; its usage log is kept.')); nav('/ai'); } catch (e) { toast(e.message, 'error'); } };
  const setActive = async (active, justification) => { try { await api(`/ai/usecases/${u.id}`, { method: 'PUT', body: { active, approval: u.custom && active ? 'Approved' : undefined, justification } }); toast(active ? t('Reviewed and activated.') : t('Deactivated: no new suggestion from this use case.')); setAct(null); reload(); } catch (e) { toast(e.message, 'error'); } };
  const setOverride = async (state) => { try { await api(`/projects/${projectId}/ai/overrides/${u.id}`, { method: 'PUT', body: { state } }); toast(t('Project setting saved.')); reload(); } catch (e) { toast(e.message, 'error'); } };
  const kv = (label, value) => <div><dt>{label}</dt><dd>{value || '—'}</dd></div>;
  return (
    <>
      <PageHead eyebrow={`${t('AI use case')} · ${u.code}`} title={tx(u.name, lang)} subtitle={`${u.tier === 'Augmented' ? t('Augmented AI') : t('Assistive AI')} · ${t(u.origin || (u.custom ? 'Custom' : 'Seeded'))} · ${t('Approval')}: ${L(u.approval || '—')}`}
        actions={<>
          <button type="button" className="btn btn-ghost" onClick={() => nav('/ai')}><ChevronLeft size={16} />{t('Library')}</button>
          {manage && <button type="button" className="btn" onClick={() => setForm(true)}><Pencil size={16} />{t('Edit')}</button>}
          {manage && <button type="button" className="btn" disabled={u.quota?.quotaReached} title={u.quota?.quotaReached ? t('Custom use case quota reached ({n}).', { n: u.quota.customQuota }) : undefined} onClick={duplicate}><Copy size={16} />{t('Duplicate')}</button>}
          {manage && !!u.custom && <button type="button" className="btn btn-danger" onClick={() => setDel(true)}><Trash2 size={16} />{t('Delete')}</button>}
        </>} />
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 16 }}>
        <Kpi value={u.counts.Proposed} label={t('Proposed')} />
        <Kpi value={u.counts.Accepted} label={t('Accepted')} />
        <Kpi value={u.counts.Edited} label={t('Edited')} />
        <Kpi value={u.counts.Rejected} label={t('Rejected')} />
        <Kpi value={`${u.completeness}%`} label={t('Specification complete')} accent={u.completeness === 100} />
      </div>
      <div className="grid-main">
        <div className="stack">
          <Card title={t('Identification')}>
            <dl className="kv small">
              {kv(t('Code'), u.code)}
              {kv(t('Tier'), u.tier === 'Augmented' ? t('Augmented AI') : t('Assistive AI'))}
              {kv(t('Owning module'), u.module)}
              {kv(t('Primary step'), step ? <Link to={`/design?node=${step.id}`}>{step.id} — {tx(step.name, lang)}</Link> : null)}
              {kv(t('Task'), step?.taskName ? `${step.task} — ${tx(step.taskName, lang)}` : null)}
              {kv(t('Macro process'), step ? `${step.mpCode} — ${tx(step.mpName, lang)}` : null)}
              {kv(t('Trigger'), tx(u.trigger_, lang))}
              {kv(t('Expected output'), tx(u.expected_output, lang))}
              {kv(t('Human checkpoint'), tx(u.checkpoint, lang))}
              {kv(t('Model task type'), tx(u.task_type, lang))}
              {kv(t('Risk'), <Status value={u.risk_level} />)}
              {kv(t('Approval'), L(u.approval || '—'))}
              {kv(t('Scope'), t(u.scope === 'Global' ? 'Global' : 'This organization'))}
              {kv(t('Origin'), `${t(u.origin || (u.custom ? 'Custom' : 'Seeded'))}${u.basedOn ? ` — ${t('based on')} ${u.basedOn.code}` : ''}`)}
              {kv(t('Model'), u.model || t('Organization default'))}
            </dl>
          </Card>
          <Card title={t('Links')}>
            <Table rows={u.links} paginate={false} empty={t('No link: the use case serves no place.')} columns={[
              { key: 'type', label: t('Linked to'), render: l => <>{t(LINK_LABEL[l.type])}{l.primary && <span className="tag" style={{ marginInlineStart: 6 }}>{t('Primary')}</span>}</> },
              { key: 'targetId', label: t('Element'), render: l => `${l.targetId} — ${tx(l.name, lang) || ''}` },
              { key: 'inputs', label: t('Fields read'), render: l => l.inputs.join(', ') || '—' },
              { key: 'outputs', label: t('Fields proposed'), render: l => l.outputs.join(', ') || '—' },
            ]} />
          </Card>
          <Card title={t('Prompt specification')} action={<span className="small">{t('Version {v}', { v: u.specVersion })}</span>}>
            <Progress value={u.completeness} label={t('{p}% complete', { p: u.completeness })} />
            <dl className="kv small" style={{ marginTop: 12 }}>
              {u.specFields.map(f => <div key={f.key}><dt>{tx(f.label, lang)}{f.required && ' *'}</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{f.key === 'params' ? JSON.stringify(u.spec.params || {}) : (tx(u.spec[f.key], lang) || <span className="muted">{t('Empty')}</span>)}</dd></div>)}
            </dl>
            <div className="row" style={{ marginTop: 12 }}>
              <button type="button" className="btn" onClick={() => setSpec(true)}><FileText size={16} />{manage ? t('Edit the specification') : t('Open the specification')}</button>
              {projectId && <button type="button" className="btn" onClick={showPrompt}><FileText size={16} />{t('View the assembled prompt')}</button>}
              {projectId && manage && <button type="button" className="btn btn-primary" disabled={busy} onClick={runTest}><Play size={16} />{busy ? t('Running…') : t('Test run')}</button>}
            </div>
            {test && (
              <div className="callout small" role="status" style={{ marginTop: 12, display: 'block' }}>
                <div className="strong"><Sparkles size={14} aria-hidden="true" /> {t('AI-generated — to be reviewed by a person')} · {String(test.engine).startsWith('llm:') ? test.engine.replace(/^llm:/, '') : t('Built-in engine (rules and retrieval)')}</div>
                {test.warning && <div className="muted">{test.warning}</div>}
                <ol>{(test.items || []).map((x, i) => <li key={i}>{x}</li>)}</ol>
              </div>
            )}
          </Card>
        </div>
        <div className="stack">
          <Card title={t('Activation')} action={<ShieldCheck size={18} aria-hidden="true" />}>
            <dl className="kv small">
              {kv(t('Organization'), <Status value={u.active ? 'Active' : 'Disabled'} />)}
              {projectId && kv(`${t('This project')} (${project?.code || ''})`, <><Status value={u.projectActive ? 'Active' : 'Disabled'} /> <span className="muted">({L(u.override || 'Inherit')})</span></>)}
            </dl>
            {!u.specComplete && <p className="small" role="note">{t('Complete the prompt specification before activation.')}</p>}
            {manage && (
              <div className="row" style={{ marginTop: 12 }}>
                <button type="button" className={`btn ${u.active ? '' : 'btn-primary'}`} disabled={!u.active && !u.specComplete} onClick={() => setAct({ active: !u.active, note: '' })}>{u.active ? t('Deactivate for the organization') : u.custom ? t('Approve and activate') : t('Activate')}</button>
                {projectId && <><label className="small strong" htmlFor="ov">{t('This project')}</label>
                  <select id="ov" className="select" style={{ width: 'auto' }} value={u.override || 'Inherit'} onChange={e => setOverride(e.target.value)}>{['Inherit', 'Active', 'Inactive'].map(s => <option key={s} value={s}>{L(s)}</option>)}</select></>}
              </div>
            )}
          </Card>
          <Card title={t('Versions')}>
            <p className="small">{t('{a} versions of the use case · {b} versions of its specification', { a: u.versions.usecase, b: u.versions.spec })}</p>
            <div className="row"><VersionsButton type="ai_usecase" id={u.id} onReverted={reload} /><VersionsButton type="prompt_spec" id={u.id} onReverted={reload} /></div>
          </Card>
          <Card title={t('Usage log')}>
            <p className="xsmall muted">{t('Append-only: every proposal and every item accepted, edited or rejected is a new entry.')}</p>
            <Table rows={u.log} maxRows={40} columns={[
              { key: 'created_at', label: t('Date'), render: l => fmtDate(l.created_at) },
              { key: 'outcome', label: t('Outcome'), render: l => <><Status value={l.outcome} />{l.item !== null && l.item !== undefined ? <span className="xsmall muted"> · {t('item {n}', { n: l.item + 1 })}</span> : null}</> },
              { key: 'user_name', label: t('User') },
              { key: 'record_type', label: t('Record') },
              { key: 'engine', label: t('Engine'), render: l => `${l.engine || '—'}${l.model ? ` · ${l.model}` : ''}` },
              { key: 'spec_version', label: t('Spec.'), render: l => (l.spec_version ? `v${l.spec_version}` : '—') },
            ]} />
          </Card>
        </div>
      </div>
      {form && <AiUseCaseForm orgId={orgId} usecase={u} onClose={() => setForm(false)} onSaved={() => { setForm(false); reload(); }} />}
      {spec && <PromptSpecModal usecase={u} onClose={() => setSpec(false)} onSaved={reload} />}
      {prompt && (
        <Modal wide title={t('Exact prompt sent')} onClose={() => setPrompt(null)}>
          <div className="small strong">{t('System')}</div><pre className="small" style={{ whiteSpace: 'pre-wrap' }}>{prompt.system}</pre>
          <div className="small strong">{t('User')}</div><pre className="small" style={{ whiteSpace: 'pre-wrap' }}>{prompt.user}</pre>
        </Modal>
      )}
      {act && (
        <Modal title={act.active ? t('Activate the AI use case') : t('Deactivate the AI use case')} onClose={() => setAct(null)}
          footer={<><button type="button" className="btn" onClick={() => setAct(null)}>{t('Cancel')}</button><button type="button" className="btn btn-primary" disabled={!act.note.trim()} onClick={() => setActive(act.active, act.note)}>{t('Confirm')}</button></>}>
          <p className="small">{act.active ? t('You confirm that a person reviewed this use case and its specification.') : t('No new suggestion will be produced from this use case; content already reviewed stays.')}</p>
          <Field label={t('Reason for the change')} required>{(fid) => <input id={fid} className="input" value={act.note} onChange={e => setAct({ ...act, note: e.target.value })} />}</Field>
        </Modal>
      )}
      {del && <ConfirmDialog title={t('Delete this custom use case?')} onClose={() => setDel(false)} actions={{ cancelLabel: t('Cancel'), list: [{ label: t('Delete'), kind: 'danger', run: remove }] }}><p className="small">{t('Its usage log is kept. This cannot be undone.')}</p></ConfirmDialog>}
    </>
  );
}
