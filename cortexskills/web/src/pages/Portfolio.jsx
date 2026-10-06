import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { post, downloadCsv } from '../lib/api.js';
import { PageHead, Card, Guard, DataTable, StatusPill, Progress, Btn, Icon, Tabs, Field, Kpi, useAction, Seg, Legend, AiBadge, IconBadge, Empty, Select } from '../components/ui.jsx';
import { RecordsView, useMeta } from '../components/Records.jsx';

export function Tenancy() {
  const { t, L } = useI18n(); const d = useData('/tenancy/tree'); const [view, setView] = useState('tree'); const { switchOrg } = useSession();
  return (<><PageHead eyebrow={t('navGroup.portfolio')} title={t('nav.tenancy')} subtitle={t('tenancy.subtitle')}><Seg value={view} onChange={setView} options={[{ id: 'tree', label: t('tenancy.tree') }, { id: 'table', label: t('tenancy.table') }]} label={t('tenancy.view')} /></PageHead>
    <Guard state={d}>{x => view === 'tree' ? <div className="grid g-2">{x.tree.map((g, i) => <Card key={g.id || 'ind' + i} title={g.kind === 'group' ? L(g.name) : t('tenancy.independent')} actions={<span className={`pill ${g.kind === 'group' ? 'tint' : ''}`}>{g.kind === 'group' ? t('tenancy.groupYes') : t('tenancy.groupNo')}</span>}>
      <div className="tree"><ul style={{ borderInlineStart: 0, paddingInlineStart: 0 }}>{g.organizations.map(o => <li key={o.id}><div className="row"><Icon name="Building2" /><span className="strong">{L(o.name)}</span><span className="pill">{t('segment.' + o.segment)}</span><span className="muted xs">{o.sector}</span>
        <Btn size="sm" kind="ghost" onClick={() => switchOrg(o.id)}>{t('tenancy.open')}</Btn></div>
        <ul>{o.projects.map(p => <li key={p.id} className="small"><Icon name="FolderKanban" size={14} /> {L(p.name)} <span className="muted">· {Math.round(p.progress)}%</span></li>)}</ul></li>)}</ul></div></Card>)}</div>
      : <DataTable csvName="tenancy" rows={x.table} columns={[{ key: 'groupYes', label: t('tenancy.groupYesNo'), text: r => r.groupYes ? t('common.yes') : t('common.no') }, { key: 'group', label: t('col.group'), text: r => r.group ? L(r.group) : t('tenancy.independent') },
        { key: 'org', label: t('col.organization'), text: r => L(r.org.name) }, { key: 'sector', label: t('col.sector') }, { key: 'segment', label: t('col.segment'), text: r => t('segment.' + r.segment) }, { key: 'records', label: t('col.projects'), num: true }, { key: 'ro', label: t('col.access'), text: r => r.readOnly ? t('header.readOnly') : t('tenancy.edit') }]} />}</Guard></>);
}

export function Projects() {
  const { t, L } = useI18n(); const nav = useNavigate(); const d = useData('/projects'); const { can } = useSession();
  return (<><PageHead eyebrow={t('navGroup.portfolio')} title={t('nav.projects')} subtitle={t('projects.subtitle')}>{can('projects.create') && <Link className="btn primary" to="/projects/new"><Icon name="Plus" />{t('nav.newProject')}</Link>}</PageHead>
    <Guard state={d}>{rows => <DataTable csvName="projects" rows={rows} onRow={p => nav('/projects/' + p.id)} columns={[
      { key: 'name', label: t('col.project'), render: p => <span className="strong">{L(p.name)}</span>, text: p => L(p.name) }, { key: 'focus', label: t('col.focus'), text: p => t('focus.' + p.focus) },
      { key: 'mode', label: t('col.mode'), text: p => t('mode.' + p.mode) + (p.track ? ' · ' + p.track : '') }, { key: 'complexity', label: t('col.complexity'), num: true },
      { key: 'e2e_count', label: t('col.e2e'), num: true }, { key: 'tasks', label: t('col.tasks'), num: true, text: p => `${p.task_done}/${p.task_count}`, sortValue: p => p.task_count },
      { key: 'progress', label: t('col.progress'), sortValue: p => p.progress, render: p => <div className="row" style={{ flexWrap: 'nowrap' }}><Progress value={p.progress} /><span className="mono small">{Math.round(p.progress)}%</span></div>, text: p => Math.round(p.progress) + '%' },
      { key: 'status', label: t('col.status'), render: p => <StatusPill value={p.status} />, text: p => p.status }]} />}</Guard></>);
}

export function NewProject() {
  const { t, L } = useI18n(); const { me, reload } = useSession(); const nav = useNavigate(); const act = useAction();
  const [mode, setMode] = useState('catalog'); const tpls = useData('/records/ProjectTemplate?limit=500'); const verticals = useData('/catalog/verticalSeed'); const tracks = useData('/catalog/smeTrackSeed'); const dm = useData('/catalog/decisionMatrix');
  const [f, setF] = useState({ name: '', description: '', focus: 'Digital', vertical_id: me.org?.sector || '', mode: me.org?.segment === 'SME' ? 'SME' : 'Full', track: '', template_id: '', track_justification: '' });
  const [cx, setCx] = useState({}); const [score, setScore] = useState(null); const [aiText, setAiText] = useState(''); const [draft, setDraft] = useState(null); const [keep, setKeep] = useState({});
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const calc = async vals => { setCx(vals); setScore(await post('/projects/score', { values: vals, vertical: f.vertical_id })); };
  const published = (tpls.data?.items || []).filter(x => x.status === 'Published' && (!x.vertical_id || x.vertical_id === me.org?.sector) && x.mode === f.mode);
  const runAi = async () => { const r = await act(() => post('/projects/ai-draft', { description: aiText }), null); setDraft(r); setKeep(Object.fromEntries(r.items.map(i => [i.key, true]))); };
  const create = async () => {
    let body = { ...f, creation_mode: mode, complexity: cx };
    if (mode === 'ai' && draft) { for (const it of draft.items) if (keep[it.key] && ['focus', 'vertical_id', 'mode', 'track', 'template_id'].includes(it.key) && it.value) body[it.key] = it.value;
      if (keep.name) body.name = L(draft.items.find(i => i.key === 'name').value); if (keep.complexity) body.complexity = draft.items.find(i => i.key === 'complexity').value;
      body.ai_accepted = Object.keys(keep).filter(k => keep[k]);
      await post('/ai/usage', { use_case: 'AIUC-PCM', outcome: Object.values(keep).every(Boolean) ? 'Accepted' : 'Edited', source: 'built-in' }).catch(() => {}); }
    if (mode === 'catalog' && !body.template_id) return;
    const p = await act(() => post('/projects', body), 'projects.created'); await reload(); nav('/projects/' + p.id);
  };
  const crit = dm.data?.[0];
  return (<><PageHead eyebrow={t('navGroup.portfolio')} title={t('nav.newProject')} subtitle={t('newp.subtitle', { org: L(me.org?.name) })} />
    <div className="notice grey" style={{ marginBottom: 'var(--aiv-space-4)' }}><Icon name="Building2" /><span>{t('newp.org', { org: L(me.org?.name) })} · {me.group ? t('tenancy.groupYes') + ' — ' + L(me.group.name) : t('tenancy.independent')}</span></div>
    <Tabs value={mode} onChange={setMode} tabs={[{ id: 'catalog', label: t('newp.fromCatalog') }, { id: 'manual', label: t('newp.manual') }, { id: 'ai', label: t('newp.withAi') }]} />
    <div className="grid split"><div className="stack">
      {mode === 'catalog' && <Card title={t('newp.pickTemplate')}><DataTable rows={published} onRow={r => set('template_id', r.id)} columns={[
        { key: 'sel', label: '', noSort: true, render: r => <input type="radio" name="tpl" checked={f.template_id === r.id} onChange={() => set('template_id', r.id)} aria-label={L(r.name)} /> },
        { key: 'name', label: t('col.name'), text: r => L(r.name) }, { key: 'scope', label: t('col.scope'), text: r => t('scope.' + r.scope) + (r.vertical_id ? ' · ' + r.vertical_id : '') }, { key: 'focus', label: t('col.focus'), text: r => t('focus.' + r.focus) },
        { key: 'phases', label: t('col.phases'), text: r => (r.phases || []).length }, { key: 'use_count', label: t('col.uses'), num: true }]} /></Card>}
      {mode === 'ai' && <Card title={t('newp.aiTitle')} actions={<AiBadge tier="Assistive" />}><Field label={t('newp.aiDescribe')} id="aid"><textarea id="aid" className="input" value={aiText} onChange={e => setAiText(e.target.value)} placeholder={t('newp.aiPlaceholder')} /></Field>
        <div className="row" style={{ marginTop: 'var(--aiv-space-3)' }}><Btn kind="primary" icon="Sparkles" disabled={!aiText.trim()} onClick={runAi}>{t('newp.aiDraft')}</Btn></div>
        {draft && <div className="stack" style={{ marginTop: 'var(--aiv-space-4)' }}><div className="notice"><Icon name="Sparkles" />{t('ai.label')}</div>{draft.items.map(it => <label key={it.key} className="check" style={{ alignItems: 'flex-start' }}><input type="checkbox" checked={!!keep[it.key]} onChange={e => setKeep(k => ({ ...k, [it.key]: e.target.checked }))} />
          <span><span className="strong">{t('field.' + it.key)}</span>: <span className="small">{it.key === 'phases' ? it.value.map(p => `${L(p.name)} (${p.e2e.length})`).join(' · ') : it.key === 'gates' ? it.value.map(g => L(g.name)).join(' · ') : it.key === 'complexity' ? `${it.score}/100` : it.key === 'template_id' ? L(it.label) || '—' : typeof it.value === 'object' ? L(it.value) : String(it.value ?? '—')}</span></span></label>)}</div>}</Card>}
      <Card title={t('newp.details')}><div className="form-grid">
        <Field label={t('field.name')} id="pn"><input id="pn" className="input" value={f.name} onChange={e => set('name', e.target.value)} placeholder={t('newp.namePh')} /></Field>
        <Field label={t('col.focus')} id="pf"><Select id="pf" className="input" value={f.focus} onChange={e => set('focus', e.target.value)}>{['All', 'Digital', 'AI', 'Custom'].map(x => <option key={x} value={x}>{t('focus.' + x)}</option>)}</Select></Field>
        {mode === 'manual' && <><Field label={t('col.vertical')} id="pv"><Select id="pv" className="input" value={f.vertical_id} onChange={e => set('vertical_id', e.target.value)}><option value="">{t('newp.noVertical')}</option>{(verticals.data || []).map(v => <option key={v.id} value={v.id}>{L(v.name)}</option>)}</Select></Field>
          <Field label={t('col.mode')} id="pm"><Select id="pm" className="input" value={f.mode} onChange={e => set('mode', e.target.value)}><option value="Full">{t('mode.Full')}</option><option value="SME">{t('mode.SME')}</option></Select></Field></>}
        {f.mode === 'SME' && <Field label={t('col.track')} id="pt" hint={score ? t('newp.recommended', { track: score.recommendedTrack }) : ''}><Select id="pt" className="input" value={f.track} onChange={e => set('track', e.target.value)}><option value="">{t('newp.useRecommended')}</option>{(tracks.data || []).map(x => <option key={x.id} value={x.id}>{x.id} — {L(x.name)}</option>)}</Select></Field>}
        {f.mode === 'SME' && f.track && score && f.track !== score.recommendedTrack && <Field label={t('newp.overrideJust')} id="pj"><textarea id="pj" className="input" value={f.track_justification} onChange={e => set('track_justification', e.target.value)} /></Field>}
        <div className="field" style={{ gridColumn: '1 / -1' }}><label htmlFor="pd">{t('field.description')}</label><textarea id="pd" className="input" value={f.description} onChange={e => set('description', e.target.value)} /></div></div>
        <div className="row" style={{ marginTop: 'var(--aiv-space-4)' }}><Btn kind="primary" icon="FolderPlus" disabled={(mode === 'catalog' && !f.template_id) || (mode === 'ai' && !draft) || (mode !== 'ai' && !f.name)} onClick={create}>{t('newp.create')}</Btn></div></Card>
    </div>
    <Card title={t('newp.complexity')}>{crit && <div className="stack">{crit.criteria.map(c => <Field key={c.code} label={`${L(c.name)} · ${c.weight}%`} id={'cx' + c.code}><Select id={'cx' + c.code} className="input" value={cx[c.code] ?? 3} onChange={e => calc({ ...cx, [c.code]: Number(e.target.value) })}>{crit.levels.map((l, i) => <option key={i} value={i + 1}>{L(l)}</option>)}</Select></Field>)}
      {score && <div className="card tint"><div className="kpi-value">{score.score}</div><div className="kpi-label">{t('newp.score')} · {t('newp.recommended', { track: score.recommendedTrack })} · {t('mode.' + score.recommendedMode)}</div></div>}
      <details><summary className="small strong">{t('newp.decisionMatrix')}</summary><table className="tbl" style={{ marginTop: 8 }}><thead><tr><th>{t('col.score')}</th><th>{t('col.track')}</th></tr></thead><tbody>{(tracks.data || []).map(x => <tr key={x.id}><td>{x.min}–{x.max}</td><td>{x.id} — {L(x.name)}: {L(x.description)}</td></tr>)}</tbody></table></details></div>}</Card></div></>);
}

export function Portfolio() {
  const { t, L } = useI18n(); const nav = useNavigate(); const [scope, setScope] = useState('org'); const d = useData('/portfolio?scope=' + scope); const legend = useData('/catalog/legend');
  const colors = Object.fromEntries((legend.data?.find(l => l.id === 'portfolio')?.items || []).map(i => [i.code, i]));
  return (<><PageHead eyebrow={t('navGroup.portfolio')} title={t('nav.portfolio')} subtitle={t('portfolio.subtitle')}><Seg value={scope} onChange={setScope} options={[{ id: 'org', label: t('portfolio.org') }, { id: 'group', label: t('portfolio.group') }, { id: 'all', label: t('portfolio.all') }]} label={t('portfolio.scope')} />
    {d.data && <Btn icon="Download" onClick={() => downloadCsv('portfolio', [t('col.project'), ...d.data.columns.map(c => c.id)], d.data.rows.map(r => [L(r.name), ...r.cells.map(c => t('pf.' + c))]))}>CSV</Btn>}</PageHead>
    <Legend items={Object.values(colors).map(i => ({ label: L(i.label), color: i.color }))} />
    <Guard state={d}>{x => <div className="table-wrap" style={{ marginTop: 'var(--aiv-space-3)', maxHeight: '70vh' }}><table className="tbl matrix"><thead><tr><th className="sticky-col">{t('col.project')}</th>{x.columns.map(c => <th key={c.id} title={L(c.name)} style={{ padding: '8px 4px', fontSize: 11, writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 110 }}>{c.id.replace('E2E-', '')}</th>)}</tr></thead>
      <tbody>{x.rows.map(r => <tr key={r.id}><td className="sticky-col" style={{ minWidth: 260 }}><Link to={'/projects/' + r.id} onClick={e => r.readOnly && e.preventDefault()}>{L(r.name)}</Link>{r.readOnly && <span className="pill xs" style={{ marginInlineStart: 6 }}>{t('header.readOnly')}</span>}<div className="xs muted">{L(r.org_name)} · {Math.round(r.progress)}%</div></td>
        {r.cells.map((c, i) => <td key={i} className="cell" title={`${L(r.name)} · ${x.columns[i].id} ${L(x.columns[i].name)} · ${t('pf.' + c)}`}><span style={{ background: colors[c]?.color, border: c === 'na' ? '1px dashed var(--aiv-line)' : 0 }} /></td>)}</tr>)}
        <tr><td className="sticky-col strong">{t('portfolio.totals')}</td>{x.totals.map((tt, i) => <td key={i} className="xs mono" title={Object.entries(tt).map(([k, v]) => `${t('pf.' + k)} ${v}`).join(', ')}>{tt.completed || 0}</td>)}</tr></tbody></table></div>}</Guard>
    <p className="caption">{t('portfolio.caption')}</p></>);
}

export function Modules() {
  const { t, L } = useI18n(); const d = useData('/modules'); const nav = useNavigate();
  return (<><PageHead eyebrow={t('navGroup.portfolio')} title={t('nav.modules')} subtitle={t('modules.subtitle')} />
    <Guard state={d}>{mods => <div className="grid g-3">{mods.map(m => <Link key={m.id} to={'/modules/' + m.id} className="card" style={{ textDecoration: 'none', opacity: m.entitled ? 1 : 0.7 }}>
      <div className="kpi"><IconBadge name={m.entitled ? 'Blocks' : 'Lock'} emph={m.entitled} /><div><div className="xs muted">{m.id}</div><h3 style={{ fontSize: 'var(--aiv-fs-16)' }}>{L(m.name)}</h3><div className="xs muted">{m.mps.join(' · ')}</div>{!m.entitled && <span className="pill s2 xs">{t('modules.notEntitled')}</span>}</div></div></Link>)}</div>}</Guard></>);
}
export function ModuleWorkspace() {
  const { id } = useParams(); const { t, L, fmtDate } = useI18n(); const d = useData('/modules/' + id); const nav = useNavigate();
  return (<Guard state={d}>{x => <>
    <PageHead eyebrow={`${x.module.id} · ${L(x.module.tier)}`} title={L(x.module.name)} subtitle={L(x.module.licensing)} />
    {!x.entitled && <div className="notice" style={{ marginBottom: 'var(--aiv-space-4)' }}><Icon name="Lock" />{t('modules.lockedText')}</div>}
    <div className="grid split"><Card title={t('modules.openTasks', { n: x.tasks.length })}><DataTable rows={x.tasks} onRow={r => nav(`/projects/${r.project_id}`)} columns={[{ key: 'uft_id', label: t('col.task') }, { key: 'project', label: t('col.project'), text: r => L(r.project_name) }, { key: 'status', label: t('col.status'), render: r => <StatusPill value={r.status} />, text: r => r.status }, { key: 'owner_name', label: t('col.owner') }, { key: 'due_date', label: t('col.due'), text: r => fmtDate(r.due_date) }]} /></Card>
      <div className="stack"><Card title={t('nav.macroProcesses')}>{x.mps.map(m => <p key={m.id}><Link to={'/process/mp/' + m.id}>{m.id} {L(m.name)}</Link><br /><span className="small muted">{L(m.objective)}</span></p>)}</Card>
        <Card title={t('modules.records')}>{x.classes.map(c => <div key={c.id} className="row" style={{ justifyContent: 'space-between' }}><Link to={'/records/' + c.name}>{L(c.label)}</Link><span className="pill">{x.counts[c.name]}</span></div>)}</Card>
        <Card title={t('modules.menus')}>{[...new Map(x.menus.map(m => [m.itemId, m])).values()].map(m => <p key={m.itemId} className="small"><span className="strong">{L(m.item)}</span> — {L(m.screen)}<br /><span className="xs muted">{m.visibility}</span></p>)}</Card></div></div>
  </>}</Guard>);
}

export function Records() {
  const { entity } = useParams(); const { t, L } = useI18n(); const meta = useMeta(); const nav = useNavigate(); const { project } = useSession(); const [q, setQ] = useState('');
  const list = useMemo(() => (meta || []).filter(m => m.canRead && (!q || (t('entity.' + m.name) + m.name).toLowerCase().includes(q.toLowerCase()))), [meta, q, t]);
  const cur = meta?.find(m => m.name === entity);
  return (<><PageHead eyebrow={t('navGroup.portfolio')} title={cur ? t('entity.' + cur.name) : t('nav.records')} subtitle={cur ? (L(cur.description) || cur.classId) : t('records.subtitle')}>
    {cur && <Btn icon="ArrowLeft" onClick={() => nav('/records')}>{t('nav.records')}</Btn>}</PageHead>
    {!cur ? <><div style={{ maxWidth: 420, marginBottom: 'var(--aiv-space-4)' }}><input className="input" type="search" placeholder={t('common.search')} value={q} onChange={e => setQ(e.target.value)} aria-label={t('common.search')} /></div>
      <div className="grid g-4">{list.map(m => <Link key={m.name} to={'/records/' + m.name} className="card" style={{ textDecoration: 'none', padding: 'var(--aiv-space-4)' }}><div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><span className="strong">{t('entity.' + m.name)}</span><span className="pill">{m.count}</span></div><div className="xs muted">{m.classId || m.module}{!m.entitled && ' · ' + t('modules.notEntitled')}</div></Link>)}</div></>
      : <RecordsView entity={cur.name} project={project || undefined} />}</>);
}
