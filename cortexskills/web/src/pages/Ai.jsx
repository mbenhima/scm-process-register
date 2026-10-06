import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { get, post, put, session } from '../lib/api.js';
import { PageHead, Card, Guard, DataTable, StatusPill, Btn, Icon, useAction, AiBadge, Seg, Kpi, Field, JustifyDialog, Legend, Select } from '../components/ui.jsx';
import { RecordsView, useMeta, RecordEditor } from '../components/Records.jsx';
import { BarChart } from '../components/charts.jsx';

export function AiUseCases() {
  const { t, L } = useI18n(); const { can, project } = useSession(); const d = useData('/ai/use-cases'); const act = useAction(); const [tier, setTier] = useState('all'); const [edit, setEdit] = useState(null); const [deact, setDeact] = useState(null); const meta = useMeta();
  const def = meta?.find(m => m.name === 'AIUseCase');
  return (<><PageHead eyebrow={t('navGroup.ai')} title={t('nav.aiUseCases')} subtitle={t('aiuc.subtitle')}><Seg value={tier} onChange={setTier} options={[{ id: 'all', label: t('common.all') }, { id: 'Assistive', label: t('ai.tier.Assistive') }, { id: 'Augmented', label: t('ai.tier.Augmented') }]} label={t('col.tier')} />
    {can('ai.manage') && def && <Btn kind="primary" icon="Plus" onClick={() => setEdit({ _new: true, tier: 'Assistive', model_task_type: 'Text generation' })}>{t('aiuc.custom')}</Btn>}</PageHead>
    <div className="notice grey" style={{ marginBottom: 'var(--aiv-space-4)' }}><Icon name="ShieldCheck" />{t('aiuc.never')}</div>
    <Guard state={d}>{rows => <DataTable csvName="ai_use_cases" rows={rows.filter(r => tier === 'all' || r.tier === tier)} onRow={r => def && setEdit(r)} columns={[{ key: 'code', label: 'ID' }, { key: 'name', label: t('col.name'), render: r => <span><span className="strong">{L(r.name)}</span>{r.isCustom && <span className="pill xs" style={{ marginInlineStart: 6 }}>{t('aiuc.customTag')}</span>}</span>, text: r => L(r.name) },
      { key: 'tier', label: t('col.tier'), render: r => <AiBadge tier={r.tier} />, text: r => r.tier }, { key: 'step', label: 'Step' }, { key: 'model_task_type', label: t('aiuc.type') }, { key: 'risk', label: t('aiuc.risk') }, { key: 'usage', label: t('aiuc.usage'), num: true },
      { key: 'org', label: t('aiuc.orgActive'), noSort: true, render: r => <input type="checkbox" aria-label={t('aiuc.orgActive')} disabled={!can('ai.manage')} checked={r.orgActive} onClick={e => e.stopPropagation()} onChange={e => e.target.checked ? act(() => put(`/ai/use-cases/${r.id}/activation`, { active: true })).then(d.reload) : setDeact(r)} /> },
      ...(project ? [{ key: 'proj', label: t('aiuc.projectOverride'), noSort: true, render: r => <Select className="input" style={{ minWidth: 110 }} disabled={!can('projects.manage')} value={r.projectState || 'Inherit'} onClick={e => e.stopPropagation()} onChange={async e => { await act(() => put(`/ai/use-cases/${r.id}/override`, { project_id: project, state: e.target.value })); d.reload(); }}>{['Inherit', 'On', 'Off'].map(s => <option key={s} value={s}>{t('aiuc.state.' + s)}</option>)}</Select> }] : []),
      { key: 'eff', label: t('aiuc.effective'), render: r => <StatusPill value={r.effective ? 'Active' : 'Deprecated'} /> }, { key: 'spec', label: t('aip.spec'), noSort: true, render: r => <Link className="btn sm" to={`/ai/use-cases/${r.id}/spec`} onClick={e => e.stopPropagation()}><Icon name="FileCode2" />{t('aip.spec')}</Link> }]} />}</Guard>
    {edit && def && <RecordEditor def={def} record={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); d.reload(); }} />}
    {deact && <JustifyDialog title={t('aiuc.deactivate')} onCancel={() => setDeact(null)} onConfirm={async n => { const r = deact; setDeact(null); await act(() => put(`/ai/use-cases/${r.id}/activation`, { active: false, _justification: n })); d.reload(); }} />}</>);
}
export function AiUsage() {
  const { t, L, fmtDate } = useI18n(); const d = useData('/ai/usage');
  return (<><PageHead eyebrow={t('navGroup.ai')} title={t('nav.aiUsage')} subtitle={t('aiusage.subtitle')} />
    <Guard state={d}>{x => { const s = Object.fromEntries(x.summary.map(r => [r.outcome, r.n])); return (<>
      <div className="grid g-4">{['Accepted', 'Edited', 'Rejected', 'Answered'].map(k => <Kpi key={k} small icon={k === 'Accepted' ? 'Check' : k === 'Edited' ? 'PenLine' : k === 'Rejected' ? 'X' : 'MessageSquare'} emph={k === 'Accepted'} value={s[k] || 0} label={t('aiusage.' + k)} />)}</div>
      <div style={{ marginTop: 'var(--aiv-space-4)' }}><DataTable csvName="ai_usage_log" rows={x.items} columns={[{ key: 'created_at', label: t('col.date'), text: r => fmtDate(r.created_at), sortValue: r => r.created_at }, { key: 'use_case_id', label: t('col.useCase') }, { key: 'outcome', label: t('col.outcome'), render: r => <StatusPill value={r.outcome === 'Accepted' ? 'Approved' : r.outcome === 'Rejected' ? 'Rejected' : r.outcome === 'Refused' ? 'Refused' : 'In Review'} />, text: r => r.outcome },
        { key: 'source', label: t('aiusage.source') }, { key: 'confidence', label: t('ai.confidence'), num: true, text: r => r.confidence == null ? '—' : Math.round(r.confidence * 100) + '%' }, { key: 'user_name', label: t('col.user') }, { key: 'question', label: t('aiusage.question'), text: r => r.question || r.record_ref || '—' }]} /></div>
      <p className="caption">{t('aiusage.appendOnly')}</p></>); }}</Guard></>);
}
export function Kb() {
  const { t, L, lang, languages } = useI18n(); const [q, setQ] = useState(''); const [l, setL] = useState(lang); const [res, setRes] = useState(null);
  const search = async e => { e?.preventDefault(); setRes(await get(`/kb/search?q=${encodeURIComponent(q)}&lang=${l}`)); };
  return (<><PageHead eyebrow={t('navGroup.ai')} title={t('nav.kb')} subtitle={t('kb.subtitle')} />
    <Card><form onSubmit={search} className="row" style={{ flexWrap: 'nowrap' }}><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder={t('kb.placeholder')} aria-label={t('kb.placeholder')} /><Select className="input" style={{ width: 120 }} value={l} onChange={e => setL(e.target.value)} aria-label={t('header.language')}>{languages.map(x => <option key={x.code} value={x.code}>{x.name}</option>)}</Select><Btn kind="primary" type="submit" icon="Search">{t('common.search')}</Btn></form>
      {res && <ul className="small" style={{ marginTop: 'var(--aiv-space-3)' }}>{res.map((r, i) => <li key={i}><span className="pill xs">{r.source}</span> <span className="strong">{r.title}</span> <span className="muted">· {r.score}</span></li>)}{!res.length && <li className="muted">{t('common.noRows')}</li>}</ul>}
      <p className="caption">{t('kb.caption')}</p></Card>
    <h2 className="section-title">{t('kb.articles')}</h2><RecordsView entity="KbArticle" /></>);
}
export function AiModel() {
  const { t } = useI18n(); const models = useData('/ai/models'); const [cfg, setCfg] = useState(session.llm || { provider: 'anthropic', model: '', endpoint: '', apiKey: '' }); const [outcome, setOutcome] = useState(null); const { toast } = useSession();
  const prov = models.data?.find(p => p.id === cfg.provider);
  return (<><PageHead eyebrow={t('navGroup.ai')} title={t('nav.aiModel')} subtitle={t('aimodel.subtitle')} />
    <div className="grid split"><Card title={t('aimodel.card')}><div className="form-grid">
      <Field label={t('aimodel.provider')} id="pv"><Select id="pv" className="input" value={cfg.provider} onChange={e => setCfg(c => ({ ...c, provider: e.target.value, model: '' }))}>{(models.data || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
      <Field label={t('aimodel.model')} id="md"><input id="md" className="input" list="mdl" value={cfg.model} onChange={e => setCfg(c => ({ ...c, model: e.target.value }))} placeholder={t('aimodel.custom')} /><datalist id="mdl">{(prov?.models || []).map(m => <option key={m} value={m} />)}</datalist></Field>
      <Field label={t('aimodel.endpoint')} id="ep" hint={t('aimodel.endpointHint')}><input id="ep" className="input" value={cfg.endpoint} onChange={e => setCfg(c => ({ ...c, endpoint: e.target.value }))} placeholder={prov?.endpoint} /></Field>
      <Field label={t('aimodel.key')} id="ky" hint={t('aimodel.keyHint')}><input id="ky" className="input" type="password" autoComplete="off" value={cfg.apiKey} onChange={e => setCfg(c => ({ ...c, apiKey: e.target.value }))} /></Field></div>
      <div className="row" style={{ marginTop: 'var(--aiv-space-4)' }}><Btn kind="primary" onClick={() => { session.llm = cfg.apiKey ? cfg : null; toast(t('aimodel.saved')); }}>{t('common.save')}</Btn>
        <Btn onClick={async () => setOutcome((await post('/ai/test-connection', cfg)).outcome)}>{t('aimodel.test')}</Btn><Btn onClick={() => { session.llm = null; setCfg({ provider: 'anthropic', model: '', endpoint: '', apiKey: '' }); toast(t('aimodel.cleared')); }}>{t('aimodel.clear')}</Btn>
        {outcome && <span className={`pill ${outcome === 'works' ? 's4' : 's1'}`}>{t('aimodel.outcome.' + outcome)}</span>}</div></Card>
      <Card tint title={t('aimodel.privacy')}><p className="small">{t('aimodel.privacyText')}</p><p className="small">{t('aimodel.fallback')}</p></Card></div></>);
}
