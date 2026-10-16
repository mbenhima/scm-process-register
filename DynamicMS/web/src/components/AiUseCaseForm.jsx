// The dedicated form of an AI Use Case (FR-DA-AI-01, -13): the primary step chosen from the
// process design, further links with the fields they read and propose, every text in each
// configured language, and a justification required to save a change.
import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { Modal, Field, Loading, tx } from './ui.jsx';

const LANGS = [['en', 'English'], ['fr', 'Français'], ['ar', 'العربية']];
const TASK_TYPES = ['Text Generation', 'Summarization', 'Classification', 'Recommendation', 'Prediction'];
const LINK_TYPES = [['step', 'Step'], ['task', 'Task'], ['mp', 'Macro process'], ['e2e', 'End-to-end process'], ['module', 'Place in the application']];

function MultiText({ label, value, onChange, required, area, hint, error }) {
  const { t } = useApp();
  const v = value && typeof value === 'object' ? value : {};
  return (
    <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="small strong">{label}{required && <span className="req" aria-hidden="true"> *</span>}</legend>
      {hint && <div className="xsmall muted">{hint}</div>}
      <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {LANGS.map(([l, name]) => (
          <label key={l} className="field">
            <span className="xsmall muted">{name}</span>
            {area ? <textarea className="textarea" dir={l === 'ar' ? 'rtl' : 'ltr'} lang={l} value={v[l] || ''} aria-label={`${label} — ${name}`} onChange={e => onChange({ ...v, [l]: e.target.value })} />
              : <input className="input" dir={l === 'ar' ? 'rtl' : 'ltr'} lang={l} value={v[l] || ''} aria-label={`${label} — ${name}`} onChange={e => onChange({ ...v, [l]: e.target.value })} />}
          </label>
        ))}
      </div>
      {error && <div className="xsmall" role="alert" style={{ color: 'var(--aiv-critical-ink)' }}>{error}</div>}
      {!error && required && !Object.values(v).some(x => String(x || '').trim()) && <div className="xsmall muted">{t('Required in at least one language.')}</div>}
    </fieldset>
  );
}

export default function AiUseCaseForm({ orgId, usecase, onClose, onSaved }) {
  const { t, lang, toast } = useApp();
  const lk = useData(`/orgs/${orgId}/ai/linkables?raw=1`);
  const edit = !!usecase;
  const [f, setF] = useState(() => ({
    name: usecase?.name || {}, checkpoint: usecase?.checkpoint || {}, trigger: usecase?.trigger_ || {}, expectedOutput: usecase?.expected_output || {}, prompt: usecase?.prompt || {},
    taskType: usecase?.task_type?.en || 'Text Generation', tier: usecase?.tier || 'Assistive', riskLevel: usecase?.risk_level || 'Medium', scope: usecase?.scope || 'Tenant', module: usecase?.module || '',
    primaryStep: usecase?.linked_step || '', links: (usecase?.links || []).filter(l => !l.primary).map(l => ({ type: l.type, id: l.targetId, inputs: l.inputs, outputs: l.outputs })), justification: '',
  }));
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [mp, setMp] = useState(() => usecase?.linked_mp || '');
  const d = lk.data;
  const stepsOf = useMemo(() => (d ? d.steps.filter(s => s.mp === mp) : []), [d, mp]);
  if (!d) return <Modal wide title={edit ? t('Edit the AI use case') : t('New AI use case')} onClose={onClose}><Loading /></Modal>;
  const set = (k, v) => { setF(x => ({ ...x, [k]: v })); setErrs(x => ({ ...x, [k]: undefined })); };
  const optionsOf = (type) => (type === 'step' ? d.steps.map(s => [s.id, tx(s.name, lang)]) : type === 'task' ? d.tasks.map(x => [x.id, tx(x.name, lang)]) : type === 'mp' ? d.mps.map(m => [m.id, `${m.code} ${tx(m.name, lang)}`]) : type === 'e2e' ? d.e2e.map(e => [e.id, tx(e.name, lang)]) : d.modules.map(m => [m.id, tx(m.name, lang)]));
  const primary = d.steps.find(s => s.id === f.primaryStep);
  const save = async () => {
    if (edit && !f.justification.trim()) { setErrs({ justification: t('Give the reason for this change.') }); return; }
    setBusy(true);
    try {
      const body = { ...f, primaryStep: f.primaryStep || null, links: f.links.filter(l => l.id) };
      const r = edit ? await api(`/ai/usecases/${usecase.id}`, { method: 'PUT', body }) : await api(`/orgs/${orgId}/ai/usecases`, { method: 'POST', body });
      toast(edit ? t('AI use case saved with a new version.') : t('AI use case created as a deactivated Draft; review it before activation.'));
      onSaved?.(r.id || usecase.id);
    } catch (e) {
      if (e.details?.fields) setErrs(Object.fromEntries(e.details.fields.map(k => [k, e.message])));
      toast(e.message, 'error');
    } finally { setBusy(false); }
  };
  return (
    <Modal wide title={edit ? `${t('Edit the AI use case')} — ${usecase.code}` : t('New AI use case')} onClose={onClose}
      footer={<><button type="button" className="btn" onClick={onClose}>{t('Cancel')}</button><button type="button" className="btn btn-primary" disabled={busy} onClick={save}>{edit ? t('Save') : t('Create')}</button></>}>
      <div className="stack">
        <MultiText label={t('Name')} required value={f.name} onChange={v => set('name', v)} error={errs.name} />
        <div className="form-grid">
          <Field label={t('Tier')}>{(id) => <select id={id} className="select" value={f.tier} onChange={e => set('tier', e.target.value)}><option value="Assistive">{t('Assistive AI')}</option><option value="Augmented">{t('Augmented AI')}</option></select>}</Field>
          <Field label={t('Model task type')} required error={errs.taskType}>{(id) => <select id={id} className="select" value={f.taskType} onChange={e => set('taskType', e.target.value)}>{TASK_TYPES.map(x => <option key={x} value={x}>{t(x)}</option>)}</select>}</Field>
          <Field label={t('Risk')}>{(id) => <select id={id} className="select" value={f.riskLevel} onChange={e => set('riskLevel', e.target.value)}>{['Low', 'Medium', 'High'].map(x => <option key={x} value={x}>{t(x)}</option>)}</select>}</Field>
          <Field label={t('Scope')}>{(id) => <select id={id} className="select" value={f.scope} onChange={e => set('scope', e.target.value)}><option value="Tenant">{t('This organization')}</option><option value="Global">{t('Global')}</option></select>}</Field>
        </div>
        <fieldset className="card flat tight" style={{ margin: 0 }}>
          <legend className="small strong">{t('Primary step')}</legend>
          <div className="form-grid">
            <Field label={t('Macro process')}>{(id) => <select id={id} className="select" value={mp} onChange={e => { setMp(e.target.value); set('primaryStep', ''); }}><option value="">{t('Choose')}</option>{d.mps.map(m => <option key={m.id} value={m.id}>{m.code} — {tx(m.name, lang)}</option>)}</select>}</Field>
            <Field label={t('Step')} error={errs.primaryStep}>{(id) => <select id={id} className="select" value={f.primaryStep} disabled={!mp} onChange={e => set('primaryStep', e.target.value)}><option value="">{t('Choose')}</option>{stepsOf.map(s => <option key={s.id} value={s.id}>{s.id} — {tx(s.name, lang)}</option>)}</select>}</Field>
          </div>
          {primary && <p className="xsmall muted">{t('Fields read and proposed')}: {primary.fields.map(x => tx(x.label, lang)).join(' · ') || '—'}</p>}
        </fieldset>
        <fieldset className="card flat tight" style={{ margin: 0 }}>
          <legend className="small strong">{t('Further links')}</legend>
          <p className="xsmall muted">{t('The use case serves every step reached through its links.')}</p>
          {f.links.map((l, i) => (
            <div key={i} className="row" style={{ gap: 8, alignItems: 'end', flexWrap: 'wrap' }}>
              <label className="field" style={{ minWidth: 160 }}><span className="xsmall muted">{t('Linked to')}</span><select className="select" value={l.type} onChange={e => set('links', f.links.map((x, j) => (j === i ? { type: e.target.value, id: '' } : x)))}>{LINK_TYPES.map(([v, lab]) => <option key={v} value={v}>{t(lab)}</option>)}</select></label>
              <label className="field" style={{ flex: 1, minWidth: 220 }}><span className="xsmall muted">{t('Element')}</span>
                <input className="input" list={`lk-${l.type}`} value={l.id} onChange={e => set('links', f.links.map((x, j) => (j === i ? { ...x, id: e.target.value.split(' — ')[0] } : x)))} placeholder={t('Type a code or a name')} /></label>
              <button type="button" className="btn btn-sm btn-ghost" aria-label={t('Remove the link')} onClick={() => set('links', f.links.filter((_, j) => j !== i))}><Trash2 size={16} /></button>
            </div>
          ))}
          {LINK_TYPES.map(([type]) => <datalist key={type} id={`lk-${type}`}>{optionsOf(type).map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</datalist>)}
          <button type="button" className="btn btn-sm" onClick={() => set('links', [...f.links, { type: 'mp', id: '' }])}><Plus size={16} />{t('Add a link')}</button>
        </fieldset>
        <MultiText label={t('Human checkpoint')} required area value={f.checkpoint} onChange={v => set('checkpoint', v)} error={errs.checkpoint} hint={t('Who accepts, edits or rejects the suggestion, and when.')} />
        <MultiText label={t('Trigger')} value={f.trigger} onChange={v => set('trigger', v)} hint={t('Left empty, it is derived from the primary step and stored.')} />
        <MultiText label={t('Expected output')} area value={f.expectedOutput} onChange={v => set('expectedOutput', v)} hint={t('Left empty, it is derived from the form of the primary step and stored.')} />
        <Field label={t('Owning module')} hint={t('Left empty, the module of the primary step.')}>{(id) => <input id={id} className="input" value={f.module} onChange={e => set('module', e.target.value)} />}</Field>
        {edit && <Field label={t('Reason for the change')} required error={errs.justification}>{(id) => <input id={id} className="input" value={f.justification} onChange={e => set('justification', e.target.value)} />}</Field>}
      </div>
    </Modal>
  );
}
