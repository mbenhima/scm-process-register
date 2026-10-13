import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { get, post, put, session } from '../lib/api.js';
import { PageHead, Card, Guard, DataTable, StatusPill, Btn, Icon, useAction, AiBadge, Seg, Kpi, Field, JustifyDialog, Legend, Select, Progress, Tabs } from '../components/ui.jsx';
import { RecordsView } from '../components/Records.jsx';
import { AiUseCaseForm } from '../components/AiUseCaseForm.jsx';
import { BarChart } from '../components/charts.jsx';

/**
 * AI Use Case Library (SRS 4.4, 4.40): the governed catalog with its figures (use cases, active ones, custom ones
 * against the Solution Pack quota, prompt completeness, task coverage); the library filtered by tier, state and
 * origin, each row opening the full use case; and the coverage of the process design — every task with the use
 * cases that support it, filterable by tier, with a draft use case suggested for a step that has none (AI-13, AIP-11).
 */
export function AiUseCases() {
  const { t, L } = useI18n(); const nav = useNavigate(); const { can, project } = useSession(); const act = useAction();
  const d = useData('/ai/use-cases', [project]); const sum = useData('/ai/summary', [project]);
  const [view, setView] = useState('library'); const [tier, setTier] = useState('all'); const [state, setState] = useState('all'); const [origin, setOrigin] = useState('all');
  const [creating, setCreating] = useState(false); const [deact, setDeact] = useState(null);
  const S_ = sum.data; const reload = () => { d.reload(); sum.reload(); };
  const keep = r => (tier === 'all' || r.tier === tier) && (state === 'all' || (state === 'active' ? r.effective : !r.effective)) && (origin === 'all' || (origin === 'custom' ? r.isCustom : !r.isCustom));
  const quotaFull = S_ && S_.quota != null && S_.custom >= S_.quota;
  return (<><PageHead eyebrow={t('navGroup.ai')} title={t('nav.aiUseCases')} subtitle={t('aiuc.subtitle')}>
    {can('ai.manage') && <Btn kind="primary" icon="Plus" disabled={quotaFull} data-tip={quotaFull ? t('aiuc.quotaFull', { n: S_.quota }) : undefined} onClick={() => setCreating(true)}>{t('aiuf.new')}</Btn>}</PageHead>
    <div className="grid g-4">
      <Kpi icon="Sparkles" value={S_ ? String(S_.total) : '—'} label={t('aiuc.k.total')} note={S_ ? t('aiuc.k.tiers', { a: S_.assistive, g: S_.augmented }) : ''} />
      <Kpi icon="Power" emph={false} value={S_ ? String(S_.active) : '—'} label={t('aiuc.k.active')} note={project ? t('aiuc.k.inProject') : t('aiuc.k.inOrg')} />
      <Kpi icon="FileCode2" emph={false} value={S_ ? `${S_.completeness}%` : '—'} label={t('aiuc.k.completeness')} note={S_ ? t('aiuc.k.custom', { n: S_.custom, q: S_.quota ?? '∞' }) : ''} />
      <Kpi icon="Workflow" emph={false} value={S_ ? `${S_.coveredTasks} / ${S_.tasks}` : '—'} label={t('aiuc.k.coverage')} note={t('aiuc.k.coverageNote')} />
    </div>
    <div className="notice grey" style={{ margin: 'var(--aiv-space-4) 0' }}><Icon name="ShieldCheck" />{t('aiuc.never')}</div>
    <Tabs value={view} onChange={setView} label={t('nav.aiUseCases')} tabs={[{ id: 'library', label: t('aiuc.v.library'), count: d.data?.length }, { id: 'coverage', label: t('aiuc.v.coverage') }]} />
    {view === 'library' && <>
      <div className="row filters-row" style={{ margin: 'var(--aiv-space-3) 0' }}>
        <Seg value={tier} onChange={setTier} label={t('col.tier')} options={[{ id: 'all', label: t('common.all') }, { id: 'Assistive', label: t('ai.tier.Assistive') }, { id: 'Augmented', label: t('ai.tier.Augmented') }]} />
        <Seg value={state} onChange={setState} label={t('aiuc.f.state')} options={[{ id: 'all', label: t('aiuc.f.anyState') }, { id: 'active', label: t('aiuc.f.active') }, { id: 'inactive', label: t('aiuc.f.inactive') }]} />
        <Seg value={origin} onChange={setOrigin} label={t('aiuc.origin')} options={[{ id: 'all', label: t('aiuc.f.anyOrigin') }, { id: 'seeded', label: t('aiuc.seeded') }, { id: 'custom', label: t('aiuc.f.custom') }]} />
      </div>
      <Guard state={d}>{rows => <DataTable csvName="ai_use_cases" id="ai-library" title={t('nav.aiUseCases')} rows={rows.filter(keep)} onRow={r => nav(`/ai/use-cases/${r.id}`)} columns={[
        { key: 'code', label: t('field.code'), render: r => <span className="mono">{r.code}</span>, text: r => r.code },
        { key: 'name', label: t('col.name'), render: r => <span><span className="strong">{L(r.name)}</span>{r.isCustom && <span className="pill xs" style={{ marginInlineStart: 6 }}>{t('aiuc.customTag')}</span>}</span>, text: r => L(r.name) },
        { key: 'tier', label: t('col.tier'), render: r => <AiBadge tier={r.tier} />, text: r => r.tier },
        { key: 'step', label: t('aiuc.linkedTo'), render: r => <span className="small" data-tip={r.module ? `${t('field.module')} ${r.module}` : undefined}><span className="mono">{r.step}</span>{r.allLinks?.length > 1 && <span className="pill xs" style={{ marginInlineStart: 6 }}>+{r.allLinks.length - 1}</span>}</span>, text: r => (r.allLinks || []).map(l => l.id).join(', ') },
        { key: 'model_task_type', label: t('aiuc.type'), text: r => (r.model_task_type ? t('aiuf.type.' + r.model_task_type) : '—') },
        { key: 'risk', label: t('aiuc.risk'), render: r => (r.risk ? <StatusPill value={r.risk} /> : '—'), text: r => r.risk || '' },
        { key: 'completeness', label: t('aiuc.promptCol'), sortValue: r => r.completeness || 0, text: r => `${r.completeness || 0}%`, render: r => <span className="row" style={{ flexWrap: 'nowrap' }}><Progress value={r.completeness || 0} label={t('aip.completeness')} /><span className="xs mono">{r.completeness || 0}%</span></span> },
        { key: 'org', label: t('aiuc.orgActive'), noSort: true, render: r => <input type="checkbox" aria-label={`${t('aiuc.orgActive')} — ${r.code}`} disabled={!can('ai.manage')} checked={r.orgActive} onClick={e => e.stopPropagation()} onChange={e => (e.target.checked ? act(() => put(`/ai/use-cases/${r.id}/activation`, { active: true })).then(reload).catch(() => {}) : setDeact(r))} />, text: r => (r.orgActive ? t('common.yes') : t('common.no')) },
        ...(project ? [{ key: 'proj', label: t('aiuc.projectOverride'), noSort: true, render: r => <Select style={{ minWidth: 130 }} aria-label={`${t('aiuc.projectOverride')} — ${r.code}`} disabled={!can('projects.manage')} value={r.projectState || 'Inherit'} onClick={e => e.stopPropagation()} onChange={async e => { await act(() => put(`/ai/use-cases/${r.id}/override`, { project_id: project, state: e.target.value })); reload(); }} options={['Inherit', 'On', 'Off'].map(x => ({ value: x, label: t('aiuc.ovr.' + x) }))} />, text: r => r.projectState }] : []),
        { key: 'eff', label: t('aiuc.effective'), render: r => <StatusPill value={r.effective ? 'Active' : 'Inactive'} level={r.effective ? 4 : 1} />, text: r => (r.effective ? 'Active' : 'Inactive') }]} />}</Guard></>}
    {view === 'coverage' && <Coverage onOpen={id => nav(`/ai/use-cases/${id}`)} onChanged={reload} />}
    {creating && <AiUseCaseForm onClose={() => setCreating(false)} onSaved={rec => { setCreating(false); reload(); if (rec?.id) nav(`/ai/use-cases/${rec.id}`); }} />}
    {deact && <JustifyDialog title={t('aiuc.deactivate')} onCancel={() => setDeact(null)} onConfirm={async n => { const r = deact; setDeact(null); await act(() => put(`/ai/use-cases/${r.id}/activation`, { active: false, _justification: n })); reload(); }} />}</>);
}

/** Tasks of the process design with the AI Use Cases that support them (FR-DA-AI-13), with a suggestion for an uncovered step (FR-DA-AIP-11). */
function Coverage({ onOpen, onChanged }) {
  const { t, L } = useI18n(); const { can } = useSession(); const act = useAction(); const [tier, setTier] = useState('all'); const [only, setOnly] = useState('all');
  const d = useData(`/ai/coverage?tier=${tier}`, [tier]);
  const suggest = async stepId => { const r = await act(() => post('/ai/use-cases/suggest', { step_id: stepId }), 'aiuc.suggested'); onChanged?.(); d.reload(); if (r?.useCase?.id) onOpen(r.useCase.id); };
  return (<><div className="row filters-row" style={{ margin: 'var(--aiv-space-3) 0' }}>
    <Seg value={tier} onChange={setTier} label={t('col.tier')} options={[{ id: 'all', label: t('common.all') }, { id: 'Assistive', label: t('ai.tier.Assistive') }, { id: 'Augmented', label: t('ai.tier.Augmented') }]} />
    <Seg value={only} onChange={setOnly} label={t('aiuc.cov.show')} options={[{ id: 'all', label: t('aiuc.cov.all') }, { id: 'covered', label: t('aiuc.cov.covered') }, { id: 'uncovered', label: t('aiuc.cov.uncovered') }]} /></div>
    <Guard state={d}>{rows => <DataTable csvName="ai_coverage" id="ai-coverage" title={t('aiuc.v.coverage')} rows={rows.filter(r => only === 'all' || (only === 'covered' ? r.covered : !r.covered))} columns={[
      { key: 'e2e', label: t('aiuc.cov.process'), render: r => <span className="small"><span className="mono">{r.e2e}</span> {L(r.e2eName)}</span>, text: r => `${r.e2e} ${L(r.e2eName)}` },
      { key: 'id', label: t('aiuc.task'), render: r => <span><span className="mono xs">{r.id}</span> <span className="strong small">{L(r.name)}</span></span>, text: r => `${r.id} ${L(r.name)}` },
      { key: 'steps', label: t('aiuc.cov.steps'), num: true, text: r => String(r.steps.length) },
      { key: 'ucs', label: t('nav.aiUseCases'), noSort: true, text: r => r.useCases.map(u => u.code).join(', '), render: r => (r.useCases.length ? <span className="row" style={{ gap: 4 }}>{r.useCases.map(u => <button key={u.id} type="button" className="chip" onClick={e => { e.stopPropagation(); onOpen(u.id); }} data-tip={L(u.name)}><span className="mono xs">{u.code}</span> <AiBadge tier={u.tier} />{!u.active && <span className="xs muted">· {t('aiuc.f.inactive')}</span>}</button>)}</span> : <span className="xs muted">{t('aiuc.cov.none')}</span>) },
      { key: 'act', label: '', noSort: true, render: r => { const s = r.steps.find(x => !x.useCases.length); return !r.covered && s && can('prompts.manage') ? <Btn size="sm" icon="Sparkles" onClick={e => { e.stopPropagation(); suggest(s.id); }}>{t('aiuc.cov.suggest', { s: s.id })}</Btn> : null; } }]} />}</Guard>
    <p className="caption">{t('aiuc.cov.caption')}</p></>);
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
