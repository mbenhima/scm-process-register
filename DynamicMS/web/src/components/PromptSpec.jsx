// Prompt specification of an AI use case (FR-DA-AIP): one field per aspect (role, context,
// task, inputs, knowledge, constraints, examples, format, tone, quality, checkpoint, model
// parameters), each with its own version history; the whole specification is versioned too.
import { useEffect, useState } from 'react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { Modal, Loading, Field, tx, Progress } from './ui.jsx';
import VersionsModal from './Versions.jsx';

export default function PromptSpecModal({ usecase, onClose, onSaved }) {
  const { t, lang, toast, can, readOnly, projectId } = useApp();
  const { data, reload } = useData(`/ai/usecases/${usecase.id}/spec?raw=1`);
  const [ed, setEd] = useState(null);
  const [note, setNote] = useState('');
  const [hist, setHist] = useState(null);
  const [preview, setPreview] = useState(null);
  useEffect(() => { if (data) setEd(Object.fromEntries(data.fields.map(f => [f.key, f.key === 'params' ? { ...(data.spec.params || {}) } : tx(data.spec[f.key], lang) || '']))); }, [data, lang]);
  if (!data || !ed) return <Modal wide title={t('Prompt specification')} onClose={onClose}><Loading /></Modal>;
  const manage = can('ai.manage') && !readOnly;
  const changed = data.fields.filter(f => (f.key === 'params' ? JSON.stringify(ed.params) !== JSON.stringify(data.spec.params || {}) : ed[f.key] !== (tx(data.spec[f.key], lang) || ''))).map(f => f.key);
  const missing = data.fields.filter(f => f.required && !String(ed[f.key] || '').trim()).map(f => f.key);
  const save = async () => {
    try { const r = await api(`/ai/usecases/${usecase.id}/spec`, { method: 'PUT', body: { fields: Object.fromEntries(changed.map(k => [k, ed[k]])), note } }); toast(r.completeness?.complete ? t('Saved: {n} field(s) with a new version.', { n: r.changed.length }) : t('Saved. The specification is incomplete, so the use case was deactivated.')); setNote(''); reload(); onSaved?.(); } catch (e) { toast(e.message, 'error'); }
  };
  const showPrompt = async () => { try { setPreview(await api(`/ai/usecases/${usecase.id}/prompt?projectId=${projectId}`)); } catch (e) { toast(e.message, 'error'); } };
  const pct = Math.round((100 * (data.fields.length - missing.length)) / data.fields.length);
  return (
    <Modal wide title={`${data.code} — ${tx(data.name, lang)}`} onClose={onClose} footer={<>
      <button className="btn" onClick={() => setHist({ type: 'prompt_spec', id: usecase.id })}>{t('History of the whole prompt ({n})', { n: data.versions })}</button>
      <button className="btn" onClick={showPrompt}>{t('View the assembled prompt')}</button>
      <button className="btn" onClick={onClose}>{t('Close')}</button>
      {manage && <button className="btn btn-primary" disabled={!changed.length} onClick={save}>{t('Save changes ({n})', { n: changed.length })}</button>}
    </>}>
      <div className="stack">
        <div className="small">{data.step ? <><span className="strong">{t('Linked step')}: </span>{data.step.id} — {tx(data.step.name, lang)}</> : t('No linked step')}</div>
        <div className="stack-8" style={{ gap: 4 }}>
          <div className="row-between small"><span className="strong">{t('Completeness')}</span><span>{missing.length ? t('Missing: {list}', { list: missing.map(k => tx(data.fields.find(f => f.key === k).label, lang)).join(', ') }) : t('Complete — the use case can be activated')}</span></div>
          <Progress value={pct} label={t('Completeness')} />
        </div>
        {data.fields.map(f => (
          <div key={f.key} className="card flat stack-8" style={{ padding: 12 }}>
            <div className="row-between"><label className="strong small" htmlFor={`ps-${f.key}`}>{tx(f.label, lang)}{f.required && <span className="req" aria-hidden="true">*</span>}</label>
              <button className="btn btn-ghost btn-sm" onClick={() => setHist({ type: 'prompt_field', id: `${usecase.id}:${f.key}` })}>{t('History ({n})', { n: f.versions || 1 })}</button></div>
            {f.key === 'params' ? (
              <div className="form-grid">
                <Field label={t('Model')}>{(id) => <input id={id} className="input" disabled={!manage} value={ed.params.model || ''} onChange={e => setEd({ ...ed, params: { ...ed.params, model: e.target.value } })} />}</Field>
                <Field label={t('Temperature (0–1)')}>{(id) => <input id={id} className="input" type="number" step="0.1" min="0" max="1" disabled={!manage} value={ed.params.temperature ?? 0.2} onChange={e => setEd({ ...ed, params: { ...ed.params, temperature: +e.target.value } })} />}</Field>
                <Field label={t('Maximum answer length (tokens)')}>{(id) => <input id={id} className="input" type="number" disabled={!manage} value={ed.params.maxTokens ?? 800} onChange={e => setEd({ ...ed, params: { ...ed.params, maxTokens: +e.target.value } })} />}</Field>
              </div>
            ) : <textarea id={`ps-${f.key}`} className="textarea" rows={f.key === 'context' || f.key === 'constraints' || f.key === 'inputs' ? 5 : 3} disabled={!manage} value={ed[f.key]} onChange={e => setEd({ ...ed, [f.key]: e.target.value })} />}
          </div>
        ))}
        {manage && <Field label={t('Change note')}>{(id) => <input id={id} className="input" value={note} onChange={e => setNote(e.target.value)} />}</Field>}
        {preview && <div className="card flat"><div className="small strong">{t('System')}</div><pre className="small" style={{ whiteSpace: 'pre-wrap' }}>{preview.system}</pre><div className="small strong">{t('User')}</div><pre className="small" style={{ whiteSpace: 'pre-wrap' }}>{preview.user}</pre></div>}
      </div>
      {hist && <VersionsModal type={hist.type} id={hist.id} onClose={() => setHist(null)} onReverted={() => { setHist(null); reload(); onSaved?.(); }} />}
    </Modal>
  );
}
