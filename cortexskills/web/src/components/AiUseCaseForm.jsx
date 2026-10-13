// AI Use Case form (SRS 4.4 FR-DA-AI-01, -02, -13; 4.40 FR-DA-AIP-01). One dedicated form for creating and editing
// a catalog entry: identification, the process elements it serves (a primary step and further links to steps,
// tasks, macro processes or end-to-end processes), its behaviour (trigger, expected output, human checkpoint) and
// its governance (risk, approval, scope). Texts are written in English, French and Arabic; a value derived from the
// step is offered and can be taken as is. Saving an existing entry creates a new version with its justification.
import { useMemo, useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { useData } from '../lib/session.jsx';
import { post, put } from '../lib/api.js';
import { Modal, Btn, Field, Select, Seg, Icon, useAction } from './ui.jsx';

const LANGS = ['en', 'fr', 'ar'];
const TASK_TYPES = ['Classification', 'Extraction', 'Summarization', 'Text generation', 'Recommendation', 'Matching', 'Scoring / ranking', 'Forecasting', 'Clustering', 'Translation'];
const APPROVALS = ['Draft', 'In review', 'Approved', 'Retired', 'N/A (seeded catalog)'];
const ml = v => (v && typeof v === 'object' ? { en: v.en || '', fr: v.fr || '', ar: v.ar || '' } : { en: v || '', fr: '', ar: '' });
const filled = v => LANGS.some(l => String(v?.[l] || '').trim());

/** A text in the three languages: one field, with the language chosen above it; a missing translation is marked. */
function MlText({ id, label, value, onChange, required, rows = 2, hint, suggestion, error }) {
  const { t, lang: ui } = useI18n(); const [lang, setLang] = useState(ui);
  return <Field id={id} label={label} required={required} hint={hint} error={error} className="full">
    <div className="row ml-tabs" role="group" aria-label={t('aiuf.language')}>
      {LANGS.map(l => <button key={l} type="button" className={`chip ${lang === l ? 'on' : ''}`} aria-pressed={lang === l} onClick={() => setLang(l)}>{l.toUpperCase()}{!String(value?.[l] || '').trim() && <span className="ml-missing" aria-label={t('aiuf.missingLang')}>•</span>}</button>)}
      {suggestion && filled(suggestion) && <Btn size="sm" kind="ghost" icon="Wand2" onClick={() => onChange(ml(suggestion))}>{t('aiuf.useSuggested')}</Btn>}
    </div>
    <textarea id={id} className="input" rows={rows} dir={lang === 'ar' ? 'rtl' : 'ltr'} lang={lang} value={value?.[lang] || ''} placeholder={suggestion?.[lang] || ''} onChange={e => onChange({ ...value, [lang]: e.target.value })} />
  </Field>;
}

/**
 * `useCase` is the current entry (null for a new one), `onSaved(record)` is called after saving. Seeded entries keep
 * their code; custom ones get the next AIUC-Cnn code unless one is typed.
 */
export function AiUseCaseForm({ useCase, onClose, onSaved }) {
  const { t, L } = useI18n(); const act = useAction(); const tg = useData('/ai/targets');
  const isNew = !useCase?.id; const seeded = !!useCase?.id && !useCase.isCustom;
  const [v, setV] = useState(() => ({ code: useCase?.code || '', name: ml(useCase?.name), tier: useCase?.tier || 'Assistive', model_task_type: useCase?.model_task_type || 'Text generation', risk: useCase?.risk || 'Low',
    approval: useCase?.approval || 'Draft', scope: useCase?.scope || 'Organization', step: useCase?.step || '', links: (useCase?.links || []).map(l => ({ ...l })),
    trigger: ml(useCase?.trigger), expected_output: ml(useCase?.expected_output), checkpoint: ml(useCase?.checkpoint) }));
  const [note, setNote] = useState(''); const [errs, setErrs] = useState({}); const [busy, setBusy] = useState(false);
  const set = (k, x) => { setV(s => ({ ...s, [k]: x })); setErrs(e => { const n = { ...e }; delete n[k]; return n; }); };

  const T = tg.data; const nameOf = (type, id) => { const x = (T?.[type] || []).find(e => e.id === id); return x ? `${x.id} — ${L(x.name)}` : id; };
  const stepOpts = useMemo(() => { if (!T) return []; const mps = new Map(T.mp.map(m => [m.id, m])); return T.step.map(s => ({ value: s.id, label: `${s.id} — ${L(s.name)}`, group: mps.get(s.mp) ? `${s.mp} · ${L(mps.get(s.mp).name)}` : s.mp })); }, [T, L]);
  const optsOf = type => (T?.[type] || []).map(x => ({ value: x.id, label: `${x.id} — ${L(x.name)}` }));
  // Suggested texts from the chosen step (FR-DA-AIP-07): shown as placeholders and taken with one click.
  const step = T?.step.find(s => s.id === v.step); const mp = step && T?.mp.find(m => m.id === step.mp);
  const sugg = step ? {
    trigger: { en: `On the step ${step.id} “${step.name?.en || ''}”, when the user runs “Propose with AI”.`, fr: `À l’étape ${step.id} « ${step.name?.fr || ''} », quand l’utilisateur lance « Proposer avec l’IA ».`, ar: `في الخطوة ${step.id} «${step.name?.ar || ''}»، عندما يطلق المستخدم «اقتراح بالذكاء الاصطناعي».` },
    checkpoint: { en: `The person in charge of step ${step.id} validates each proposal before completion.`, fr: `Le responsable de l’étape ${step.id} valide chaque proposition avant la clôture.`, ar: `يصادق المسؤول عن الخطوة ${step.id} على كل اقتراح قبل الإتمام.` },
  } : {};

  const check = () => {
    const e = {};
    if (!filled(v.name)) e.name = t('mre.required', { field: t('field.name') });
    if (!v.step) e.step = t('mre.required', { field: t('aiuf.primaryStep') });
    if (!filled(v.checkpoint)) e.checkpoint = t('mre.required', { field: t('field.checkpoint') });
    if (v.links.some(l => !l.id)) e.links = t('aiuf.linkIncomplete');
    if (!isNew && !note.trim()) e.note = t('err.justificationRequired');
    setErrs(e); return !Object.keys(e).length;
  };
  const save = async () => {
    if (!check()) return; setBusy(true);
    try {
      const body = { ...v, links: v.links.filter(l => l.id), _justification: note || undefined }; if (seeded) delete body.code; if (!body.code) delete body.code;
      const rec = await act(() => (isNew ? post('/ai/use-cases', body) : put(`/ai/use-cases/${useCase.id}`, body)), isNew ? 'aiuf.created' : 'common.saved');
      onSaved?.(rec);
    } catch (e) { if (e.params?.field) setErrs(x => ({ ...x, [e.params.field]: e.message })); } finally { setBusy(false); }
  };

  return (<Modal wide title={isNew ? t('aiuf.newTitle') : t('aiuf.editTitle', { code: useCase.code })} onClose={onClose}
    footer={<><Btn onClick={onClose}>{t('common.cancel')}</Btn><Btn kind="primary" icon="Save" loading={busy} onClick={save}>{isNew ? t('aiuf.create') : t('common.save')}</Btn></>}>
    <div className="stack aiuf">
      <p className="small muted">{isNew ? t('aiuf.newIntro') : seeded ? t('aiuf.seededIntro') : t('aiuf.customIntro')}</p>
      <section className="aiuf-sec"><h3 className="eyebrow">{t('aiuc.identification')}</h3>
        <div className="form-grid">
          <Field id="uf-code" label={t('field.code')} hint={seeded ? t('aiuf.codeSeeded') : t('aiuf.codeHint')}><input id="uf-code" className="input mono" value={v.code} disabled={seeded} placeholder="AIUC-C01" onChange={e => set('code', e.target.value)} /></Field>
          <Field id="uf-tier" label={t('field.tier')} required hint={t('aiuf.tierHint')}><Seg label={t('field.tier')} value={v.tier} onChange={x => set('tier', x)} options={[{ id: 'Assistive', label: t('ai.tier.Assistive') }, { id: 'Augmented', label: t('ai.tier.Augmented') }]} /></Field>
          <MlText id="uf-name" label={t('field.name')} required rows={1} value={v.name} onChange={x => set('name', x)} error={errs.name} />
          <Field id="uf-type" label={t('field.model_task_type')}><Select id="uf-type" value={v.model_task_type} onChange={e => set('model_task_type', e.target.value)} options={TASK_TYPES.map(x => ({ value: x, label: t('aiuf.type.' + x) }))} /></Field>
          <Field id="uf-risk" label={t('field.risk')}><Seg label={t('field.risk')} value={v.risk} onChange={x => set('risk', x)} options={['Low', 'Medium', 'High'].map(x => ({ id: x, label: t('status.' + x) }))} /></Field>
        </div></section>
      <section className="aiuf-sec"><h3 className="eyebrow">{t('aiuc.link')}</h3>
        <div className="form-grid">
          <Field id="uf-step" label={t('aiuf.primaryStep')} required error={errs.step} hint={t('aiuf.primaryHint')} className="full"><Select id="uf-step" value={v.step} invalid={!!errs.step} filter onChange={e => set('step', e.target.value)} options={stepOpts} placeholder={tg.loading ? t('common.loading') : t('aiuf.chooseStep')} /></Field>
          <div className="full"><div className="label">{t('field.module')}</div><div className="ro-value">{mp?.module || useCase?.module || '—'} <span className="xs muted">({t('aiuc.derived')})</span></div></div>
          <div className="full stack" style={{ gap: 'var(--aiv-space-2)' }}><div className="label">{t('aiuf.moreLinks')}</div><p className="xs muted">{t('aiuf.moreLinksHint')}</p>
            {v.links.map((l, i) => <div key={i} className="row aiuf-link">
              <Select aria-label={t('aiuf.linkType')} value={l.type} style={{ width: 200 }} onChange={e => set('links', v.links.map((x, k) => (k === i ? { type: e.target.value, id: '' } : x)))} options={['step', 'task', 'mp', 'e2e'].map(x => ({ value: x, label: t('aiuf.lt.' + x) }))} />
              <Select aria-label={t('aiuf.linkTarget')} value={l.id} filter style={{ flex: 1, minWidth: 220 }} onChange={e => set('links', v.links.map((x, k) => (k === i ? { ...x, id: e.target.value } : x)))} options={optsOf(l.type === 'task' ? 'task' : l.type)} placeholder={t('aiuf.chooseTarget')} />
              <Btn kind="ghost" size="sm" icon="Trash2" aria-label={t('aiuf.removeLink', { x: l.id ? nameOf(l.type, l.id) : '' })} onClick={() => set('links', v.links.filter((_, k) => k !== i))} /></div>)}
            {errs.links && <span className="field-error"><Icon name="CircleAlert" size={12} />{errs.links}</span>}
            <div><Btn size="sm" icon="Link2" onClick={() => set('links', [...v.links, { type: 'task', id: '' }])}>{t('aiuf.addLink')}</Btn></div></div>
        </div></section>
      <section className="aiuf-sec"><h3 className="eyebrow">{t('aiuf.behaviour')}</h3>
        <div className="form-grid">
          <MlText id="uf-trigger" label={t('field.trigger')} value={v.trigger} onChange={x => set('trigger', x)} suggestion={sugg.trigger} hint={t('aiuf.triggerHint')} />
          <MlText id="uf-out" label={t('field.expected_output')} value={v.expected_output} onChange={x => set('expected_output', x)} hint={t('aiuf.outputHint')} />
          <MlText id="uf-check" label={t('field.checkpoint')} required rows={3} value={v.checkpoint} onChange={x => set('checkpoint', x)} suggestion={sugg.checkpoint} error={errs.checkpoint} hint={t('aiuf.checkpointHint')} />
        </div></section>
      <section className="aiuf-sec"><h3 className="eyebrow">{t('aiuf.governance')}</h3>
        <div className="form-grid">
          <Field id="uf-appr" label={t('field.approval')}><Select id="uf-appr" value={v.approval} onChange={e => set('approval', e.target.value)} options={APPROVALS.map(x => ({ value: x, label: t('aiuf.appr.' + x) }))} /></Field>
          <Field id="uf-scope" label={t('field.scope')}><Select id="uf-scope" value={v.scope} onChange={e => set('scope', e.target.value)} options={['Global', 'Organization'].map(x => ({ value: x, label: t('aiuf.scope.' + x) }))} /></Field>
          <p className="xs muted full">{isNew ? t('aiuf.startsInactive') : t('aiuf.promptElsewhere')}</p>
          {!isNew && <Field id="uf-note" label={t('justify.label')} required error={errs.note} hint={t('aiuf.versionHint')} className="full"><textarea id="uf-note" className="input" rows={2} value={note} onChange={e => { setNote(e.target.value); setErrs(x => { const n = { ...x }; delete n.note; return n; }); }} /></Field>}
        </div></section>
    </div>
  </Modal>);
}
