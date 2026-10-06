// Prompt Specifications (FR-DA-AIP-01..16) and Organization AI settings (FR-DA-AI-16..20). Each AI Use Case has a
// twelve-field specification, versioned field by field, assembled in a fixed order with the project's data; a
// use case is activated only when the required fields are complete. The model key is stored sealed on the server
// and never shown again; the connection test reports exactly why a call failed.
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { get, post, put } from '../lib/api.js';
import { PageHead, Card, Guard, DataTable, Btn, Icon, useAction, Field, Seg, Select, Progress, Modal, KV, AiBadge, StatusPill, Toggle } from '../components/ui.jsx';

const LANGS = [{ id: 'en', label: 'EN' }, { id: 'fr', label: 'FR' }, { id: 'ar', label: 'ع' }];

export function PromptSpec() {
  const { id } = useParams(); const { t, L, lang: uiLang } = useI18n(); const { can, project } = useSession(); const act = useAction();
  const d = useData(`/ai/use-cases/${id}/spec`, [id]); const settings = useData('/ai/settings'); const fit = useData(`/ai/use-cases/${id}/fit`, [id]);
  const [lang, setLang] = useState(uiLang); const [hist, setHist] = useState(null); const [preview, setPreview] = useState(null); const [test, setTest] = useState(null);
  const ro = !can('prompts.manage');
  return (<Guard state={d}>{x => { const uc = x.useCase; return (<>
    <PageHead eyebrow={`${t('navGroup.ai')} · ${uc.code} · ${uc.step}`} title={L(uc.name)} subtitle={t('aip.subtitle')}>
      <Link className="btn" to="/ai/use-cases"><Icon name="ArrowLeft" />{t('nav.aiUseCases')}</Link>
      <Btn icon="Eye" onClick={async () => setPreview(await get(`/ai/use-cases/${id}/prompt${project ? '?project=' + project : ''}`))}>{t('aip.preview')}</Btn>
      {!ro && <Btn icon="FlaskConical" onClick={async () => setTest(await act(() => post(`/ai/use-cases/${id}/test`, { project_id: project })))}>{t('aip.test')}</Btn>}
      <Btn icon="History" onClick={async () => setHist({ field: null, rows: await get(`/ai/use-cases/${id}/spec/history`) })}>{t('aip.history')}</Btn></PageHead>
    <div className="grid g-4">
      <Card><div className="label">{t('aip.completeness')}</div><div className="row"><Progress value={x.completeness} lg label={t('aip.completeness')} /><span className="mono">{x.completeness}%</span></div>
        <p className="xs muted" style={{ marginTop: 'var(--aiv-space-2)' }}>{x.missing.length ? t('aip.missing', { f: x.missing.map(f => t('aip.f.' + f)).join(', ') }) : t('aip.complete')}</p></Card>
      <Card><div className="label">{t('aip.version')}</div><div className="kpi-value">v{x.version}</div><StatusPill value={x.status || 'Draft'} /></Card>
      <Card><div className="label">{t('aip.tier')}</div><AiBadge tier={uc.tier} /><p className="xs muted">{t('aiuc.type')}: {uc.model_task_type} · {t('aip.risk')}: {uc.risk}</p></Card>
      <Card><div className="label">{t('aip.fit')}</div>{fit.data ? (fit.data.ok ? <StatusPill value="Fits" level={5} /> : <><StatusPill value="Check" level={2} /><ul className="warn-list">{fit.data.issues.map(i => <li key={i}>{t('aip.fitIssue.' + i)}</li>)}</ul></>) : '…'}</Card>
    </div>
    <div className="grid split" style={{ marginTop: 'var(--aiv-space-4)' }}>
      <Card title={t('aip.fields')} actions={<Seg value={lang} onChange={setLang} label={t('q.language')} options={LANGS} />}>
        {x.order.map(f => <SpecField key={f + lang} ucId={id} field={f} lang={lang} value={x.fields[f] || {}} version={x.fieldVersions[f] || 1} required={x.required.includes(f)} readOnly={ro} onSaved={d.reload}
          onHistory={async () => setHist({ field: f, rows: await get(`/ai/use-cases/${id}/spec/history?field=${f}`) })} />)}
      </Card>
      <div className="stack">
        <Card title={t('aip.model')}><ModelChoice ucId={id} value={x.model} settings={settings.data} readOnly={ro} onSaved={d.reload} /></Card>
        <Card tint title={t('aip.checkpoint')}><p className="small">{L(uc.checkpoint)}</p><p className="xs muted">{t('aip.checkpointHint')}</p></Card>
        {fit.data?.outputs && <Card title={t('aip.writesTo')}><KV items={[[t('pdm.kind.step'), `${fit.data.step.id} (${L(fit.data.step.name)})`], [t('run.input'), L(fit.data.inputs) || '—'], [t('aip.outputField'), fit.data.outputField === 'rows' ? t('aip.rows') : fit.data.outputField]]} /></Card>}
      </div></div>
    {preview && <Modal size="lg" title={t('aip.preview')} onClose={() => setPreview(null)}><div className="row" style={{ marginBottom: 'var(--aiv-space-3)' }}><span className="pill xs">{preview.engine}</span>{preview.model && <span className="pill xs">{preview.model}</span>}<span className="xs muted">v{preview.specVersion}</span></div>
      {preview.missing?.length > 0 && <div className="notice"><Icon name="TriangleAlert" /><div className="small">{t('err.promptVariable', { variables: preview.missing.join(', ') })}</div></div>}
      <pre className="prompt-preview">{preview.prompt}</pre></Modal>}
    {test && <Modal size="lg" title={t('aip.testResult')} onClose={() => setTest(null)}><div className="row"><span className="pill xs">{test.engine}</span>{test.model && <span className="pill xs">{test.model}</span>}{test.reason && <span className="xs muted">{t('aip.reason.' + test.reason)}</span>}</div>
      <p className="small" style={{ whiteSpace: 'pre-line' }}>{test.text?.startsWith?.('ai.') ? t(test.text) : test.text}</p>{test.items?.length > 0 && <ul className="small">{test.items.map((i, k) => <li key={k}>{i.label}</li>)}</ul>}<p className="xs muted">{t('aip.dryRun')}</p></Modal>}
    {hist && <Modal size="lg" title={hist.field ? `${t('aip.history')} — ${t('aip.f.' + hist.field)}` : t('aip.history')} onClose={() => setHist(null)}>
      <DataTable id="aip-hist" search={false} rows={hist.rows} rowKey={r => String(r.version)} columns={[{ key: 'version', label: t('ter.version'), num: true, value: r => 'v' + r.version }, { key: 'date', label: t('col.date'), text: r => (r.date || '').slice(0, 16).replace('T', ' ') }, { key: 'author', label: t('ter.author') }, { key: 'note', label: t('pdm.note'), text: r => r.note || '—' },
        { key: 'r', label: '', render: r => !ro && <Btn size="sm" icon="RotateCcw" onClick={async () => { await act(() => post(`/ai/use-cases/${id}/spec/restore`, { version: r.version, field: hist.field }), 'pdm.restored'); setHist(null); d.reload(); }}>{t('pdm.restore')}</Btn> }]} /></Modal>}
  </>); }}</Guard>);
}

function SpecField({ ucId, field, lang, value, version, required, readOnly, onSaved, onHistory }) {
  const { t } = useI18n(); const { toast } = useSession(); const [v, setV] = useState(value[lang] || ''); const [state, setState] = useState(''); const fid = `spec-${field}`;
  const save = async () => { if (v === (value[lang] || '')) return; setState('saving'); try { await put(`/ai/use-cases/${ucId}/spec/${field}`, { value: { [lang]: v } }); setState('saved'); onSaved(); } catch (e) { setState(''); toast(e.message, 'error'); } };
  return (<div className="spec-field"><Field id={fid} label={t('aip.f.' + field)} required={required} hint={t('aip.h.' + field)}>
    <textarea id={fid} className="input" rows={field === 'context' || field === 'examples' || field === 'constraints' ? 4 : 2} dir={lang === 'ar' ? 'rtl' : 'ltr'} readOnly={readOnly} value={v} onChange={e => setV(e.target.value)} onBlur={save} /></Field>
    <div className="row"><span className="xs muted">v{version}{state === 'saving' ? ' · ' + t('mre.st.saving') : state === 'saved' ? ' · ' + t('mre.st.saved') : ''}</span><span className="spacer" /><Btn size="sm" kind="ghost" icon="History" onClick={onHistory}>{t('aip.fieldHistory')}</Btn></div></div>);
}

function ModelChoice({ ucId, value, settings, readOnly, onSaved }) {
  const { t } = useI18n(); const act = useAction(); const [m, setM] = useState(value || '');
  const profiles = settings?.profiles || {}; const prof = profiles[m || settings?.model];
  return (<div className="stack"><Field id="uc-model" label={t('aip.modelForUc')} hint={t('aip.modelHint')}><Select id="uc-model" disabled={readOnly} value={m} onChange={async e => { setM(e.target.value); await act(() => put(`/ai/use-cases/${ucId}/model`, { model: e.target.value }), 'common.saved'); onSaved(); }}
    options={[{ value: '', label: t('aip.orgDefault', { m: settings?.model || '—' }) }, ...Object.keys(profiles).map(k => ({ value: k, label: k }))]} /></Field>
    {prof && <KV items={[[t('aip.params'), prof.params.join(', ')], [t('aip.reasoning'), prof.reasoning ? t('common.yes') : t('common.no')], [t('aip.maxOutput'), String(prof.maxOutput)]]} />}</div>);
}

export function AiSettings() {
  const { t, fmtDate } = useI18n(); const { can } = useSession(); const act = useAction(); const d = useData('/ai/settings'); const [f, setF] = useState(null); const [test, setTest] = useState(null); const [busy, setBusy] = useState(false);
  return (<><PageHead eyebrow={t('navGroup.ai')} title={t('nav.aiSettings')} subtitle={t('aiset.subtitle')} />
    <Guard state={d}>{x => { const v = f || { provider: x.provider || 'anthropic', endpoint: x.endpoint || '', model: x.model || '', temperature: x.temperature, max_tokens: x.max_tokens, enabled: !!x.enabled, apiKey: '' };
      const prov = x.providers.find(p => p.id === v.provider); const prof = x.profiles[v.model]; const set = patch => setF({ ...v, ...patch });
      const ro = !can('aisettings.manage');
      return (<div className="grid split"><Card title={t('aiset.card')}><div className="form-grid">
        <Field id="as-prov" label={t('aimodel.provider')}><Select id="as-prov" disabled={ro} value={v.provider} onChange={e => set({ provider: e.target.value, model: '' })} options={x.providers.map(p => ({ value: p.id, label: p.name }))} /></Field>
        <Field id="as-model" label={t('aimodel.model')} hint={t('aiset.modelHint')}><Select id="as-model" disabled={ro} value={v.model} onChange={e => set({ model: e.target.value })} options={[...(prov?.models || []).map(m => ({ value: m, label: m })), ...(v.model && !(prov?.models || []).includes(v.model) ? [{ value: v.model, label: v.model }] : [])]} placeholder={t('select.placeholder')} /></Field>
        {v.provider === 'custom' && <Field id="as-ep" label={t('aimodel.endpoint')} hint={t('aiset.httpsOnly')} className="full"><input id="as-ep" className="input" disabled={ro} value={v.endpoint} onChange={e => set({ endpoint: e.target.value })} placeholder="https://" /></Field>}
        <Field id="as-key" label={t('aimodel.key')} hint={x.keySet ? t('aiset.keyKept', { h: x.keyHint || '••••' }) : t('aiset.keyHint')} className="full"><input id="as-key" className="input" type="password" autoComplete="off" disabled={ro} value={v.apiKey} onChange={e => set({ apiKey: e.target.value })} placeholder={x.keySet ? '••••••••' : ''} /></Field>
        {(!prof || prof.params.includes('temperature')) && <Field id="as-temp" label={t('aiset.temperature')} hint={t('aiset.temperatureHint')}><input id="as-temp" className="input" inputMode="decimal" disabled={ro} value={v.temperature ?? ''} onChange={e => set({ temperature: e.target.value })} /></Field>}
        <Field id="as-max" label={t('aiset.maxTokens')} hint={t('aiset.maxTokensHint', { n: prof?.maxOutput || 32000 })}><input id="as-max" className="input" inputMode="numeric" disabled={ro} value={v.max_tokens ?? ''} onChange={e => set({ max_tokens: e.target.value })} /></Field>
        <div className="full"><Toggle id="as-on" checked={v.enabled} disabled={ro} onChange={c => set({ enabled: c })} label={t('aiset.enabled')} /></div></div>
        {prof && <p className="xs muted">{t('aiset.profile', { p: prof.params.join(', '), r: prof.reasoning ? t('common.yes') : t('common.no') })}</p>}
        {!ro && <div className="row" style={{ marginTop: 'var(--aiv-space-4)' }}><Btn kind="primary" disabled={!f} onClick={async () => { const b = { ...v }; if (!b.apiKey) delete b.apiKey; if (prof && !prof.params.includes('temperature')) delete b.temperature; await act(() => put('/ai/settings', b), 'aimodel.saved'); setF(null); d.reload(); }}>{t('common.save')}</Btn>
          <Btn loading={busy} onClick={async () => { setBusy(true); try { setTest(await post('/ai/settings/test', { model: v.model })); d.reload(); } finally { setBusy(false); } }}>{t('aimodel.test')}</Btn></div>}
        {(test || x.lastTest) && <div className={`notice ${(test || x.lastTest).outcome === 'answered' ? 'grey' : ''}`} style={{ marginTop: 'var(--aiv-space-3)' }}><Icon name={(test || x.lastTest).outcome === 'answered' ? 'CircleCheck' : 'CircleAlert'} />
          <div className="small"><span className="strong">{t('aiset.outcome.' + (test || x.lastTest).outcome)}</span>{(test || x.lastTest).detail ? ` — ${(test || x.lastTest).detail}` : ''}{!test && x.lastTest?.at ? <div className="xs muted">{fmtDate(x.lastTest.at)}</div> : null}</div></div>}
      </Card>
      <Card tint title={t('aimodel.privacy')}><p className="small">{t('aiset.privacy')}</p><p className="small">{t('aimodel.fallback')}</p></Card></div>); }}</Guard></>);
}
