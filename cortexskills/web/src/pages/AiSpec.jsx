// Prompt Specifications (FR-DA-AIP-01..16) and Organization AI settings (FR-DA-AI-16..20). Each AI Use Case has a
// twelve-field specification, versioned field by field, assembled in a fixed order with the project's data; a
// use case is activated only when the required fields are complete. The model key is stored sealed on the server
// and never shown again; the connection test reports exactly why a call failed.
import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { get, post, put } from '../lib/api.js';
import { PageHead, Card, Guard, DataTable, Btn, Icon, useAction, Field, Seg, Select, Progress, Modal, KV, AiBadge, StatusPill, Toggle, Tabs, Kpi, JustifyDialog } from '../components/ui.jsx';
import { useMeta, RecordEditor, Versions } from '../components/Records.jsx';

const LANGS = [{ id: 'en', label: 'EN' }, { id: 'fr', label: 'FR' }, { id: 'ar', label: 'ع' }];

/**
 * The AI Use Case on one screen (FR-DA-AI-01, AI-04, AI-07, AI-18, AIP-01 – 10): identification, link to the step and
 * task with its inputs and outputs, activation, the twelve-field Prompt Specification, the assembled prompt with a
 * test run, the versions of the use case and of its prompt, and its usage log.
 */
export function PromptSpec({ defaultTab = 'overview' }) {
  const { id } = useParams(); const { t, L, lang: uiLang, fmtDate } = useI18n(); const { can, project } = useSession(); const act = useAction();
  const [sp, setSp] = useSearchParams(); const tab = sp.get('tab') || defaultTab; const setTab = v => setSp(p => { const n = new URLSearchParams(p); n.set('tab', v); return n; }, { replace: true });
  const d = useData(`/ai/use-cases/${id}/spec`, [id]); const det = useData(`/ai/use-cases/${id}/detail`, [id, project]); const settings = useData('/ai/settings'); const fit = useData(`/ai/use-cases/${id}/fit`, [id]);
  const meta = useMeta(); const def = meta?.find(m => m.name === 'AIUseCase');
  const [lang, setLang] = useState(uiLang); const [hist, setHist] = useState(null); const [preview, setPreview] = useState(null); const [test, setTest] = useState(null); const [edit, setEdit] = useState(false); const [deact, setDeact] = useState(false);
  const ro = !can('prompts.manage');
  const loadPreview = async () => setPreview(await get(`/ai/use-cases/${id}/prompt${project ? '?project=' + project : ''}`));
  const runTest = async () => setTest(await act(() => post(`/ai/use-cases/${id}/test`, { project_id: project })));
  useEffect(() => { if (tab === 'prompt' && !preview) loadPreview().catch(() => {}); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps
  return (<Guard state={d}>{x => { const uc = { ...x.useCase, ...(det.data?.useCase || {}) }; const D_ = det.data; const derived = new Set(D_?.derived || []);
    const dv = k => (derived.has(k) ? <span>{L(uc[k])} <span className="xs muted">({t('aiuc.derived')})</span></span> : L(uc[k]) || '—');
    return (<>
    <PageHead eyebrow={`${t('navGroup.ai')} · ${t('nav.aiUseCases')}`} title={`${uc.code} — ${L(uc.name)}`} subtitle={t('aiuc.pageSubtitle')}>
      <Link className="btn" to="/ai/use-cases"><Icon name="ArrowLeft" />{t('nav.aiUseCases')}</Link>
      {can('ai.manage') && def && <Btn icon="Pencil" onClick={() => setEdit(true)}>{t('aiuc.editDetails')}</Btn>}
      {!ro && <Btn icon="FlaskConical" onClick={async () => { setTab('prompt'); await runTest(); }}>{t('aip.test')}</Btn>}</PageHead>
    <div className="grid g-4">
      <Card><div className="label">{t('aip.completeness')}</div><div className="row"><Progress value={x.completeness} lg label={t('aip.completeness')} /><span className="mono">{x.completeness}%</span></div>
        <p className="xs muted" style={{ marginTop: 'var(--aiv-space-2)' }}>{x.missing.length ? t('aip.missing', { f: x.missing.map(f => t('aip.f.' + f)).join(', ') }) : t('aip.complete')}</p></Card>
      <Card><div className="label">{t('aip.version')}</div><div className="kpi-value">v{x.version}</div><StatusPill value={x.status || 'Draft'} /></Card>
      <Card><div className="label">{t('aiuc.activation')}</div>{D_ ? <><StatusPill value={D_.activation.effective ? 'Active' : 'Deprecated'} /><p className="xs muted">{t('aiuc.orgActive')}: {D_.activation.orgActive ? t('common.yes') : t('common.no')}{D_.activation.projectState ? ` · ${t('aiuc.projectOverride')}: ${D_.activation.projectState}` : ''}</p></> : '…'}</Card>
      <Card><div className="label">{t('aip.fit')}</div>{fit.data ? (fit.data.ok ? <StatusPill value="Fits" level={5} /> : <><StatusPill value="Check" level={2} /><ul className="warn-list">{fit.data.issues.map(i => <li key={i}>{t('aip.fitIssue.' + i)}</li>)}</ul></>) : '…'}</Card>
    </div>
    <div style={{ marginTop: 'var(--aiv-space-4)' }}><Tabs value={tab} onChange={setTab} label={t('nav.aiUseCases')} tabs={[{ id: 'overview', label: t('aiuc.tab.overview') }, { id: 'spec', label: t('aiuc.tab.spec') }, { id: 'prompt', label: t('aiuc.tab.prompt') }, { id: 'versions', label: t('aiuc.tab.versions') }, { id: 'usage', label: t('aiuc.tab.usage'), count: D_?.usage?.length }]} /></div>
    {tab === 'overview' && <div className="grid split" style={{ marginTop: 'var(--aiv-space-4)', alignItems: 'start' }}>
      <Card title={t('aiuc.identification')}><KV items={[[t('field.code'), <span className="mono">{uc.code}</span>], [t('field.name'), L(uc.name)], [t('field.tier'), <AiBadge tier={uc.tier} />], [t('field.module'), dv('module')],
        [t('field.step'), D_?.step ? `${D_.step.id} — ${L(D_.step.name)}` : uc.step], [t('aiuc.task'), D_?.task ? `${D_.task.id} — ${L(D_.task.name)}` : '—'], [t('field.trigger'), dv('trigger')], [t('field.expected_output'), dv('expected_output')],
        [t('field.checkpoint'), L(uc.checkpoint) || '—'], [t('field.model_task_type'), uc.model_task_type || '—'], [t('field.risk'), uc.risk ? <StatusPill value={uc.risk} /> : '—'], [t('field.approval'), uc.approval || '—'], [t('field.scope'), uc.scope || '—'],
        [t('aiuc.origin'), uc.isCustom ? t('aiuc.customTag') : t('aiuc.seeded')]]} /></Card>
      <div className="stack">
        <Card title={t('aiuc.activation')}>
          <label className="check"><input type="checkbox" disabled={!can('ai.manage') || !D_} checked={!!D_?.activation.orgActive} onChange={async e => { if (e.target.checked) { await act(() => put(`/ai/use-cases/${uc.id}/activation`, { active: true })); det.reload(); } else setDeact(true); }} />{t('aiuc.orgActive')}</label>
          {project && D_ && <Field id="uc-ovr" label={t('aiuc.projectOverride')}><Select id="uc-ovr" disabled={!can('projects.manage')} value={D_.activation.projectState || 'Inherit'} onChange={async e => { await act(() => put(`/ai/use-cases/${uc.id}/override`, { project_id: project, state: e.target.value })); det.reload(); }} options={['Inherit', 'On', 'Off'].map(v => ({ value: v, label: t('aiuc.ovr.' + v) }))} /></Field>}
          <p className="xs muted">{t('aiuc.activationHint')}</p></Card>
        <Card title={t('aiuc.link')}><KV items={[[t('run.input'), L(D_?.inputs) || '—'], [t('aip.outputField'), fit.data?.outputField === 'rows' ? t('aip.rows') : fit.data?.outputField || '—']]} />
          {D_?.outputs?.length > 0 && <table className="tbl compact" style={{ marginTop: 'var(--aiv-space-2)' }}><thead><tr><th scope="col">{t('aiuc.outputFields')}</th><th scope="col">{t('pdm.fieldType')}</th><th scope="col">{t('pdm.required')}</th></tr></thead>
            <tbody>{D_.outputs.map(o => <tr key={o.key}><td>{L(o.label)}</td><td className="mono xs">{o.type}</td><td>{o.required ? t('common.yes') : '—'}</td></tr>)}</tbody></table>}</Card>
        <Card title={t('aiuc.promptGlance')} actions={<Btn size="sm" icon="FileCode2" onClick={() => setTab('spec')}>{ro ? t('aiuc.openSpec') : t('aiuc.editSpec')}</Btn>}>
          <ul className="plain stack" style={{ gap: 'var(--aiv-space-2)' }}>{x.order.map(f => { const v = (x.fields[f] || {})[uiLang] || (x.fields[f] || {}).en || ''; return <li key={f} className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
            <Icon name={v.trim() ? 'CircleCheck' : x.required.includes(f) ? 'CircleAlert' : 'Circle'} className={v.trim() ? 'saved-ico' : 'muted-ico'} size={16} />
            <span className="small"><span className="strong">{t('aip.f.' + f)}{x.required.includes(f) ? ' *' : ''}</span> — <span className="muted">{v.trim() ? (v.length > 150 ? v.slice(0, 149) + '…' : v) : t('aiuc.empty')}</span></span></li>; })}</ul></Card>
      </div></div>}
    {tab === 'spec' && <div className="grid split" style={{ marginTop: 'var(--aiv-space-4)' }}>
      <Card title={t('aip.fields')} actions={<><Seg value={lang} onChange={setLang} label={t('q.language')} options={LANGS} /><Btn size="sm" kind="ghost" icon="History" onClick={async () => setHist({ field: null, rows: await get(`/ai/use-cases/${id}/spec/history`) })}>{t('aip.history')}</Btn></>}>
        {x.order.map(f => <SpecField key={f + lang} ucId={id} field={f} lang={lang} value={x.fields[f] || {}} version={x.fieldVersions[f] || 1} required={x.required.includes(f)} readOnly={ro} onSaved={() => { d.reload(); det.reload(); }}
          onHistory={async () => setHist({ field: f, rows: await get(`/ai/use-cases/${id}/spec/history?field=${f}`) })} />)}
      </Card>
      <div className="stack">
        <Card title={t('aip.model')}><ModelChoice ucId={id} value={x.model} settings={settings.data} readOnly={ro} onSaved={d.reload} /></Card>
        <Card tint title={t('aip.checkpoint')}><p className="small">{L(uc.checkpoint)}</p><p className="xs muted">{t('aip.checkpointHint')}</p></Card>
        {fit.data?.outputs && <Card title={t('aip.writesTo')}><KV items={[[t('pdm.kind.step'), `${fit.data.step.id} (${L(fit.data.step.name)})`], [t('run.input'), L(fit.data.inputs) || '—'], [t('aip.outputField'), fit.data.outputField === 'rows' ? t('aip.rows') : fit.data.outputField]]} /></Card>}
      </div></div>}
    {tab === 'prompt' && <div className="stack" style={{ marginTop: 'var(--aiv-space-4)' }}>
      <Card title={t('aip.preview')} actions={<><Btn size="sm" icon="RefreshCw" onClick={loadPreview}>{t('aiuc.refresh')}</Btn>{!ro && <Btn size="sm" kind="primary" icon="FlaskConical" onClick={runTest}>{t('aip.test')}</Btn>}</>}>
        {!preview ? <p className="small muted">…</p> : <><div className="row" style={{ marginBottom: 'var(--aiv-space-3)' }}><span className="pill xs">{preview.engine}</span>{preview.model && <span className="pill xs">{preview.model}</span>}<span className="xs muted">{t('aiuc.assembledHint')}</span></div>
          {preview.missing?.length > 0 && <div className="notice"><Icon name="TriangleAlert" /><div className="small">{t('err.promptVariable', { variables: preview.missing.join(', ') })}</div></div>}
          <pre className="prompt-preview">{preview.prompt}</pre></>}</Card>
      {test && <Card title={t('aip.testResult')}><div className="row"><span className="pill xs">{test.engine}</span>{test.model && <span className="pill xs">{test.model}</span>}{test.reason && <span className="xs muted">{t('aip.reason.' + test.reason)}</span>}</div>
        <p className="small" style={{ whiteSpace: 'pre-line' }}>{test.text?.startsWith?.('ai.') ? t(test.text) : test.text}</p>{test.items?.length > 0 && <ul className="small">{test.items.map((i, k) => <li key={k}>{i.label}</li>)}</ul>}<p className="xs muted">{t('aip.dryRun')}</p></Card>}
    </div>}
    {tab === 'versions' && <div className="grid split" style={{ marginTop: 'var(--aiv-space-4)' }}>
      <Card title={t('aiuc.ucVersions')}><Versions entity="AIUseCase" id={uc.id} canWrite={can('ai.manage')} onReverted={() => { d.reload(); det.reload(); }} /></Card>
      <Card title={t('aip.history')}><SpecHistory id={id} ro={ro} onRestored={() => { d.reload(); det.reload(); }} /></Card></div>}
    {tab === 'usage' && <div className="stack" style={{ marginTop: 'var(--aiv-space-4)' }}>
      <div className="grid g-4">{['Accepted', 'Edited', 'Rejected'].map(o => <Kpi key={o} icon={o === 'Accepted' ? 'CircleCheck' : o === 'Edited' ? 'Pencil' : 'CircleX'} value={String((D_?.outcomes || []).find(r => r.outcome === o)?.n || 0)} label={t('status.' + o)} emph={o === 'Accepted'} />)}
        <Kpi icon="History" emph={false} value={String(D_?.usage?.length || 0)} label={t('aiuc.runs')} /></div>
      <DataTable id="aiuc-usage" rows={D_?.usage || []} rowKey={(r, i) => r.created_at + i} empty={t('aiuc.noUsage')} columns={[{ key: 'created_at', label: t('col.date'), text: r => fmtDate(r.created_at) }, { key: 'user_name', label: t('col.user'), text: r => r.user_name || '—' }, { key: 'outcome', label: t('col.status'), render: r => <StatusPill value={r.outcome} />, text: r => r.outcome }, { key: 'confidence', label: t('aiuc.confidence'), text: r => (r.confidence == null ? '—' : String(r.confidence)) }, { key: 'source', label: t('aiuc.engine'), text: r => r.source || '—' }, { key: 'record_ref', label: t('aiuc.record'), text: r => r.record_ref || '—' }]} /></div>}
    {edit && def && <RecordEditor def={def} record={{ ...x.useCase, ...(det.data?.useCase || {}), id: uc.id }} onClose={() => setEdit(false)} onSaved={() => { setEdit(false); d.reload(); det.reload(); }} />}
    {deact && <JustifyDialog title={t('aiuc.deactivate')} onCancel={() => setDeact(false)} onConfirm={async n => { setDeact(false); await act(() => put(`/ai/use-cases/${uc.id}/activation`, { active: false, _justification: n })); det.reload(); }} />}
    {hist && <Modal size="lg" title={hist.field ? `${t('aip.history')} — ${t('aip.f.' + hist.field)}` : t('aip.history')} onClose={() => setHist(null)}>
      <SpecHistoryTable id={id} rows={hist.rows} field={hist.field} ro={ro} onRestored={() => { setHist(null); d.reload(); }} /></Modal>}
  </>); }}</Guard>);
}
function SpecHistory({ id, ro, onRestored }) { const h = useData(`/ai/use-cases/${id}/spec/history`, [id]); return <Guard state={h}>{rows => <SpecHistoryTable id={id} rows={rows} field={null} ro={ro} onRestored={() => { h.reload(); onRestored(); }} />}</Guard>; }
function SpecHistoryTable({ id, rows, field, ro, onRestored }) {
  const { t } = useI18n(); const act = useAction();
  return <DataTable id="aip-hist" search={false} workspace={false} rows={rows} rowKey={r => String(r.version)} columns={[{ key: 'version', label: t('ter.version'), num: true, value: r => 'v' + r.version }, { key: 'date', label: t('col.date'), text: r => (r.date || '').slice(0, 16).replace('T', ' ') }, { key: 'author', label: t('col.user'), text: r => r.author || '—' }, { key: 'note', label: t('col.justification'), text: r => r.note || '—' },
    { key: 'r', label: '', noSort: true, render: r => !ro && <Btn size="sm" icon="RotateCcw" onClick={async () => { await act(() => post(`/ai/use-cases/${id}/spec/restore`, { version: r.version, field }), 'pdm.restored'); onRestored(); }}>{t('pdm.restore')}</Btn> }]} />;
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
