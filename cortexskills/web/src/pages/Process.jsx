import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { post, put, get } from '../lib/api.js';
import { PageHead, Card, Guard, DataTable, StatusPill, Btn, Icon, Tabs, KV, AiBadge, useAction, JustifyDialog, Seg, Legend, Progress, Field, Select } from '../components/ui.jsx';
import { RecordsView, displayValue } from '../components/Records.jsx';

const FAMILIES = ['Core Training Engineering', 'Innovation & Differentiation', 'Consulting & Diagnostic Excellence', 'Strategic & Organizational Excellence', 'Scope & Questionnaire Excellence', 'Platform Administration'];
export function MacroProcesses() {
  const { t, L } = useI18n(); const d = useData('/catalog/mp'); const nav = useNavigate(); const [fam, setFam] = useState('all');
  return (<><PageHead eyebrow={t('navGroup.process')} title={t('nav.macroProcesses')} subtitle={t('mp.subtitle')} />
    <Guard state={d}>{rows => <><div className="row" style={{ marginBottom: 'var(--aiv-space-3)' }}><Select className="input" style={{ maxWidth: 360 }} value={fam} onChange={e => setFam(e.target.value)} aria-label={t('mp.family')}><option value="all">{t('mp.allFamilies')} ({rows.length})</option>{FAMILIES.map(f => <option key={f} value={f}>{L(rows.find(r => r.familyKey === f)?.family) || f} ({rows.filter(r => r.familyKey === f).length})</option>)}</Select></div>
      <DataTable csvName="macro_processes" rows={rows.filter(r => fam === 'all' || r.familyKey === fam)} onRow={r => nav('/process/mp/' + r.id)} columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: t('col.name'), render: r => <span className="strong">{L(r.name)}</span>, text: r => L(r.name) },
        { key: 'category', label: t('col.category'), text: r => L(r.category) }, { key: 'owner', label: t('col.owner'), text: r => L(r.owner) }, { key: 'module', label: t('col.module') }, { key: 'coveredBy', label: t('col.coveredBy'), text: r => (r.coveredBy || []).join(', ') }]} /></>}</Guard></>);
}

export function MacroProcess() {
  const { id } = useParams(); const { t, L } = useI18n(); const d = useData('/process/mp/' + id); const [tab, setTab] = useState('sipoc');
  return (<Guard state={d}>{x => { const m = x.mp; return (<>
    <PageHead eyebrow={`${m.id} · ${L(m.family)}`} title={L(m.name)} subtitle={L(m.objective)}>{x.module && <Link className="btn" to={'/modules/' + x.module.id}><Icon name="Blocks" />{x.module.id} {L(x.module.name)}</Link>}</PageHead>
    <div className="grid g-3"><Card><KV items={[[t('run.trigger'), L(m.trigger)], [t('run.terminal'), L(m.terminal)], [t('col.owner'), L(m.owner)]]} /></Card>
      <Card title={t('mp.e2e')}>{x.e2e.map(e => <p key={e.id} className="small"><Link to={'/process/e2e/' + e.id}>{e.id}</Link> {L(e.name)}</p>)}</Card>
      <Card title={t('mp.counts')}><KV items={[[t('mp.tasks'), x.tasks.length], [t('mp.steps'), x.steps.length], [t('nav.kpis'), x.kpis.length], [t('nav.rules'), x.rules.length], [t('nav.controls'), x.controls.length], [t('nav.alerts'), x.alerts.length], [t('nav.aiUseCases'), x.aiUseCases.length]]} /></Card></div>
    <Tabs value={tab} onChange={setTab} tabs={[{ id: 'sipoc', label: 'SIPOC' }, { id: 'steps', label: t('mp.tasksSteps'), count: x.steps.length }, { id: 'gov', label: t('mp.governance') }, { id: 'ai', label: t('nav.aiUseCases'), count: x.aiUseCases.length }, { id: 'data', label: t('mp.data'), count: x.classes.length }]} />
    {tab === 'sipoc' && (m.sipoc ? <div className="grid g-3">{['goals', 'suppliers', 'inputs', 'process', 'outputs', 'customers'].map(k => <Card key={k} title={t('sipoc.' + k)}><p className="small" style={{ whiteSpace: 'pre-line' }}>{L(m.sipoc[k]).replaceAll(' / ', '\n')}</p></Card>)}</div> : <Card><p className="small">{t('mp.sipocFromSteps')}</p><KV items={[[t('sipoc.inputs'), [...new Set(x.steps.map(s => L(s.role)))].join(', ')], [t('sipoc.process'), x.tasks.map(tk => L(tk.name)).join(' → ')]]} /></Card>)}
    {tab === 'steps' && x.tasks.map(tk => <Card key={tk.id} title={`${tk.id} · ${L(tk.name)}`}><DataTable search={false} rows={x.steps.filter(s => s.task === tk.id)} columns={[{ key: 'id', label: 'Step' }, { key: 'name', label: t('col.name'), text: s => L(s.name) }, { key: 'type', label: t('col.type'), render: s => s.type === 'AI-Assisted Task' ? <AiBadge tier="Assistive" /> : t('stepType.' + s.type) }, { key: 'description', label: t('field.description'), text: s => L(s.description) }, { key: 'role', label: t('col.role'), text: s => L(s.role) }]} /></Card>)}
    {tab === 'gov' && <div className="stack">
      <Card title={t('nav.kpis')}><DataTable search={false} rows={x.kpis} columns={[{ key: 'code', label: 'ID' }, { key: 'name', label: t('col.name'), text: r => L(r.name) }, { key: 'formula', label: t('field.formula'), text: r => L(r.formula) }, { key: 'target', label: t('col.target'), text: r => L(r.target) }]} /></Card>
      <Card title={t('nav.rules')}><DataTable search={false} rows={x.rules} columns={[{ key: 'code', label: 'ID' }, { key: 'process_tag', label: 'Step' }, { key: 'condition', label: t('field.condition'), text: r => L(r.condition) }, { key: 'action_id', label: t('field.action') }, { key: 'rule_type', label: t('col.type') }]} /></Card>
      <Card title={t('nav.controls')}><DataTable search={false} rows={x.controls} columns={[{ key: 'code', label: 'ID' }, { key: 'name', label: t('col.name'), text: r => L(r.name) }, { key: 'coso', label: 'COSO', text: r => t('coso.' + r.coso) }, { key: 'control_type', label: t('col.type') }, { key: 'effectiveness', label: t('field.effectiveness'), render: r => <StatusPill value={r.effectiveness} /> }]} /></Card>
      <Card title={t('nav.alerts')}><DataTable search={false} rows={x.alerts} columns={[{ key: 'id', label: 'ID' }, { key: 'rule', label: t('field.rule') }, { key: 'severity', label: t('col.severity'), text: r => t('severity.' + r.severity) }, { key: 'step', label: 'Step' }, { key: 'escalation', label: t('col.escalation'), text: r => L(r.escalation) }]} /></Card>
      <Card title={t('nav.reports')}>{x.reports.map(r => <p key={r.id} className="small">{r.id} · {L(r.name)}</p>)}</Card></div>}
    {tab === 'ai' && <DataTable search={false} rows={x.aiUseCases} columns={[{ key: 'code', label: 'ID' }, { key: 'name', label: t('col.name'), text: r => L(r.name) }, { key: 'tier', label: t('col.tier'), render: r => <AiBadge tier={r.tier} /> }, { key: 'step', label: 'Step' }, { key: 'checkpoint', label: t('ai.checkpoint'), text: r => L(r.checkpoint) }]} />}
    {tab === 'data' && <div className="grid g-3">{x.classes.map(c => <Link key={c.id} to={'/records/' + c.name} className="card" style={{ textDecoration: 'none' }}><span className="xs muted">{c.id}</span><h3 style={{ fontSize: 'var(--aiv-fs-16)' }}>{L(c.label)}</h3><p className="small">{L(c.description)}</p></Link>)}</div>}
  </>); }}</Guard>);
}

export function E2EList() {
  const { t, L } = useI18n(); const d = useData('/catalog/e2e'); const nav = useNavigate(); const [scope, setScope] = useState('core');
  return (<><PageHead eyebrow={t('navGroup.process')} title={t('nav.e2eProcesses')} subtitle={t('e2e.subtitle')}><Seg value={scope} onChange={setScope} options={[{ id: 'core', label: t('e2e.core') }, { id: 'vertical', label: t('e2e.vertical') }, { id: 'sme', label: t('e2e.sme') }]} label={t('e2e.scope')} /></PageHead>
    <Guard state={d}>{rows => <DataTable csvName="e2e" rows={rows.filter(r => r.scope === scope)} onRow={r => nav('/process/e2e/' + r.id)} columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: t('col.name'), render: r => <span className="strong">{L(r.name)}</span>, text: r => L(r.name) },
      { key: 'type', label: t('col.type'), text: r => L(r.type) }, { key: 'goal', label: t('e2e.goal'), text: r => L(r.goal) }, { key: 'mps', label: t('run.mps'), text: r => r.mps.join(', ') }, { key: 'n', label: t('e2e.steps'), num: true, text: r => r.ufts.length, sortValue: r => r.ufts.length }]} />}</Guard>
    <Composites /></>);
}
function Composites() { const { t, L } = useI18n(); const d = useData('/catalog/composite');
  return <Card title={t('e2e.composites')} className=""><Guard state={d}>{rows => <DataTable search={false} rows={rows} columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: t('col.name'), text: r => L(r.name) }, { key: 'orchestrates', label: t('e2e.orchestrates') }, { key: 'mps', label: t('run.mps') }, { key: 'steps', label: t('e2e.steps') }]} />}</Guard></Card>; }

export function E2EDetail() {
  const { id } = useParams(); const { t, L } = useI18n(); const d = useData('/process/e2e/' + id); const [tab, setTab] = useState('tasks');
  return (<Guard state={d}>{x => { const e = x.e2e; return (<>
    <PageHead eyebrow={`${e.id} · ${L(e.type)}`} title={L(e.name)} subtitle={L(e.description)}><Link className="btn" to={'/process/bpmn?e2e=' + e.id}><Icon name="Shapes" />{t('nav.bpmn')}</Link></PageHead>
    <div className="grid split"><Card><KV items={[[t('run.trigger'), L(e.trigger)], [t('run.terminal'), L(e.terminal)], [t('run.feeds'), (e.feedsInto || '—')], [t('run.consumes'), e.consumes || '—'], [t('run.supported'), e.supportedBy || '—'], [t('run.mps'), e.mps.map(m => <Link key={m} to={'/process/mp/' + m} style={{ marginInlineEnd: 8 }}>{m}</Link>)], [t('run.modules'), L(e.modules)]]} /></Card>
      <Card title={t('e2e.chain')}><p className="small">{t('e2e.fedBy')}: {x.chainIn.map(c => <Link key={c.id} to={'/process/e2e/' + c.id} style={{ marginInlineEnd: 8 }}>{c.id}</Link>)}</p><p className="small">{t('e2e.feeds')}: {x.chainOut.map(c => <Link key={c} to={'/process/e2e/' + c} style={{ marginInlineEnd: 8 }}>{c}</Link>)}</p></Card></div>
    <Tabs value={tab} onChange={setTab} tabs={[{ id: 'tasks', label: t('e2e.userTasks'), count: x.ufts.length }, { id: 'racsi', label: 'RACSI' }, { id: 'bpmn', label: t('e2e.bpmnFlow') }, { id: 'guide', label: t('run.whatToType') }]} />
    {tab === 'tasks' && <DataTable search={false} rows={x.ufts} columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: t('col.name'), render: u => <span><span className="strong">{L(u.name)}</span> {u.ai.length > 0 && <AiBadge tier={u.ai[0].tier} />}</span> }, { key: 'description', label: t('field.description'), text: u => L(u.description) }, { key: 'steps', label: t('run.steps'), text: u => u.steps.join(', ') }]} />}
    {tab === 'racsi' && <DataTable search={false} rows={x.ufts} columns={[{ key: 'id', label: 'ID' }, ...['R', 'A', 'C', 'S', 'I'].map(k => ({ key: k, label: t('racsi.' + k), text: u => L(u.racsiT?.[k]) || u.racsi[k] }))]} />}
    {tab === 'bpmn' && <DataTable search={false} rows={x.ufts} columns={[{ key: 'id', label: t('e2e.uft'), text: u => `${u.id} ${L(u.name)}` }, { key: 'input', label: t('e2e.inputSupplier'), text: u => `${L(u.input)} / ${L(u.supplier)}` }, { key: 'seq', label: t('e2e.seqTask'), text: u => u.seqTask }, { key: 'stepId', label: t('e2e.step') }, { key: 'output', label: t('e2e.outputBeneficiary'), text: u => `${L(u.output)} / ${L(u.beneficiary)}` }, { key: 'mp', label: 'MP' }, { key: 'bpmn', label: t('e2e.bpmnElement') }]} />}
    {tab === 'guide' && <div className="stack">{x.ufts.map(u => <Card key={u.id} title={`${u.id} · ${L(u.name)}`}><div className="guidance">{u.guidance ? L(u.guidance) : L(u.description)}</div></Card>)}</div>}
  </>); }}</Guard>);
}

const LAYERS = [['scope', 'var(--aiv-azure)'], ['strategic', 'var(--aiv-azure-tint)'], ['consulting', 'var(--aiv-bg-alt)'], ['core', 'var(--aiv-white)'], ['parallel', 'var(--aiv-white)'], ['enabler', 'var(--aiv-bg-alt)']];
export function Chain() {
  const { t, L } = useI18n(); const d = useData('/process/chain'); const nav = useNavigate();
  return (<><PageHead eyebrow={t('navGroup.process')} title={t('nav.chain')} subtitle={t('chain.subtitle')} />
    <Guard state={d}>{x => { const nodes = x.nodes.filter(n => LAYERS.some(l => l[0] === n.layer)); const W = 1280, colW = W / LAYERS.length, boxW = colW - 24, boxH = 34;
      const pos = {}; LAYERS.forEach(([ly], i) => nodes.filter(n => n.layer === ly).forEach((n, k) => { pos[n.id] = { x: i * colW + 12, y: 40 + k * (boxH + 12) }; }));
      const H = Math.max(...Object.values(pos).map(p => p.y)) + 60;
      return (<Card><div style={{ overflowX: 'auto' }}><svg className="chart" viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 960 }} role="img" aria-label={t('chain.subtitle')}>
        <defs><marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--aiv-muted-2)" /></marker></defs>
        {LAYERS.map(([ly], i) => <text key={ly} x={i * colW + 12} y={20} style={{ fontWeight: 700, fill: 'var(--aiv-navy)' }}>{t('chain.layer.' + ly)}</text>)}
        {x.edges.filter(e => pos[e.from] && pos[e.to]).map((e, i) => { const a = pos[e.from], b = pos[e.to]; const x1 = a.x + boxW, y1 = a.y + boxH / 2, x2 = b.x, y2 = b.y + boxH / 2; const back = x2 <= a.x;
          return <path key={i} d={back ? `M${a.x},${y1} C${a.x - 40},${y1} ${b.x + boxW + 40},${y2} ${b.x + boxW},${y2}` : `M${x1},${y1} C${x1 + 30},${y1} ${x2 - 30},${y2} ${x2},${y2}`} fill="none" stroke="var(--aiv-line)" strokeWidth="1.2" strokeDasharray={e.kind === 'dashed' ? '5 4' : ''} markerEnd="url(#arr)" />; })}
        {nodes.map(n => { const p = pos[n.id]; const fill = LAYERS.find(l => l[0] === n.layer)[1]; return <g key={n.id} className="chain-node" tabIndex={0} role="link" aria-label={`${n.id} ${L(n.name)}`} onClick={() => nav('/process/e2e/' + n.id)} onKeyDown={e => e.key === 'Enter' && nav('/process/e2e/' + n.id)}>
          <rect x={p.x} y={p.y} width={boxW} height={boxH} rx="8" fill={fill} stroke="var(--aiv-line)" /><text x={p.x + 8} y={p.y + 14} style={{ fontWeight: 700, fill: 'var(--aiv-navy)' }}>{n.id}</text><text x={p.x + 8} y={p.y + 28} style={{ fontSize: 10, fill: 'var(--aiv-navy)' }}>{L(n.name).slice(0, 30)}</text><title>{L(n.name)}</title></g>; })}
      </svg></div><Legend items={LAYERS.slice(0, 4).map(([ly, c]) => ({ label: t('chain.layer.' + ly), color: c }))} /><p className="caption">{t('chain.caption')}</p></Card>); }}</Guard></>);
}

export function Coverage() {
  const { t, L } = useI18n(); const d = useData('/process/coverage');
  return (<><PageHead eyebrow={t('navGroup.process')} title={t('nav.coverage')} subtitle={t('coverage.subtitle')} />
    <Guard state={d}>{x => <><div className="grid g-3"><div className="card kpi"><div><div className="kpi-value">{x.fullyCovered}/{x.businessMps}</div><div className="kpi-label">{t('coverage.mps')}</div></div></div>
      <div className="card kpi"><div><div className="kpi-value">{x.stepsCovered}/{x.steps}</div><div className="kpi-label">{t('coverage.steps')}</div><div className="kpi-note">{t('coverage.admin')}</div></div></div>
      <div className="card kpi"><div><div className="kpi-value">{Math.round((x.fullyCovered * 100) / x.businessMps)}%</div><div className="kpi-label">{t('coverage.rate')}</div></div></div></div>
      <div style={{ marginTop: 'var(--aiv-space-4)' }}><DataTable csvName="coverage" rows={x.rows} columns={[{ key: 'id', label: 'MP' }, { key: 'name', label: t('col.name'), text: r => L(r.name) }, { key: 'e2e', label: t('col.coveredBy'), text: r => r.e2e.join(', ') }, { key: 'steps', label: t('coverage.stepsCol'), text: r => `${r.stepsCovered}/${r.steps}` }, { key: 'status', label: t('col.status'), render: r => <span className={`pill ${r.status === 'Full' ? 's5' : r.status === 'Admin' ? 'tint' : 's2'}`}>{t('coverage.' + r.status)}</span>, text: r => r.status }]} /></div></>}</Guard></>);
}

export function InfoModel() {
  const { t, L } = useI18n(); const cls = useData('/catalog/class'); const attrs = useData('/catalog/attribute'); const [sel, setSel] = useState(null);
  return (<><PageHead eyebrow={t('navGroup.process')} title={t('nav.infoModel')} subtitle={t('model.subtitle')} />
    <Guard state={cls}>{rows => <div className="grid split"><DataTable csvName="classes" rows={rows} onRow={setSel} columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: t('col.name'), text: r => L(r.label) }, { key: 'parent', label: t('model.parent') }, { key: 'mps', label: t('run.mps'), text: r => r.mps.join(', ') }]} />
      <Card title={sel ? `${sel.id} · ${L(sel.label)}` : t('model.pick')}>{sel && <><p className="small">{L(sel.description)}</p><DataTable search={false} rows={(attrs.data || []).filter(a => a.classId === sel.id)} columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: t('col.name') }, { key: 'type', label: t('col.type') }, { key: 'required', label: t('model.required') }, { key: 'rule', label: t('model.rule') }]} /><Link className="btn" to={'/records/' + sel.name} style={{ marginTop: 'var(--aiv-space-3)' }}>{t('model.openRecords')}</Link></>}</Card></div>}</Guard></>);
}

export function Verticals() {
  const { t, L } = useI18n(); const { can } = useSession(); const d = useData('/records/Vertical?limit=100'); const act = useAction(); const activ = useData('/verticals/activation'); const [tr, setTr] = useState(null); const [sel, setSel] = useState(null);
  const NEXT = { Draft: ['Review'], Review: ['Approved', 'Draft'], Approved: ['Active', 'Draft'], Active: ['Deprecated'], Deprecated: ['Retired', 'Active'], Retired: [] };
  return (<><PageHead eyebrow={t('navGroup.process')} title={t('nav.verticals')} subtitle={t('vert.subtitle')} />
    <Guard state={d}>{x => <div className="grid split"><DataTable csvName="verticals" rows={x.items} onRow={setSel} columns={[{ key: 'prefix', label: t('vert.prefix') }, { key: 'name', label: t('col.name'), text: r => L(r.name) }, { key: 'parent', label: t('vert.parent'), text: r => L(r.parent_name) },
      { key: 'standards', label: t('vert.standards'), text: r => r.standards.join(', ') }, { key: 'lifecycle', label: t('vert.lifecycle'), render: r => <StatusPill value={r.lifecycle} />, text: r => r.lifecycle }, { key: 'act', label: t('vert.activated'), text: r => (activ.data || []).some(a => a.vertical_id === r.prefix) ? t('common.yes') : '—' }, { key: 'version', label: 'v', num: true }]} />
      <Card title={sel ? L(sel.name) : t('vert.pick')}>{sel && <div className="stack"><p className="small">{L(sel.value_proposition)}</p><KV items={[[t('vert.mps'), sel.macro_processes.join(', ')], [t('vert.e2e'), sel.e2e_processes.map(e => <Link key={e} to={'/process/e2e/' + e} style={{ marginInlineEnd: 8 }}>{e}</Link>)], [t('vert.standards'), sel.standards.join(', ')], [t('vert.drivers'), (sel.drivers || []).map(x => L(x.name)).join(', ')], [t('vert.retention'), sel.retention_years + ' ' + t('common.years')], [t('col.owner'), sel.owner]]} />
        {can('verticals.manage') && <div className="row">{NEXT[sel.lifecycle].map(n => <Btn key={n} size="sm" onClick={() => setTr(n)}>{t('vert.to', { s: t('status.' + n) })}</Btn>)}
          <Btn size="sm" kind="primary" onClick={async () => { await act(() => post(`/verticals/${sel.id}/activate`), 'vert.activatedOk'); activ.reload(); }}>{t('vert.activate')}</Btn>
          <Btn size="sm" onClick={() => setTr('deactivate')}>{t('vert.deactivate')}</Btn></div>}</div>}</Card>
      {tr && <JustifyDialog title={tr === 'deactivate' ? t('vert.deactivate') : t('vert.to', { s: t('status.' + tr) })} onCancel={() => setTr(null)} onConfirm={async n => { const target = tr; setTr(null);
        if (target === 'deactivate') await act(() => post(`/verticals/${sel.id}/deactivate`, { _justification: n })); else await act(() => post(`/verticals/${sel.id}/transition`, { to: target, _justification: n })); d.reload(); activ.reload(); setSel(null); }} />}</div>}</Guard></>);
}

export function Sme() {
  const { t, L } = useI18n(); const { can } = useSession(); const tracks = useData('/records/SmeTrack'); const crit = useData('/records/ComplexityCriterion?limit=200'); const mps = useData('/catalog/smeMp'); const act = useAction(); const [w, setW] = useState({}); const [j, setJ] = useState(false);
  const uni = (crit.data?.items || []).filter(c => !c.vertical_id); const total = uni.reduce((s, c) => s + Number(w[c.code] ?? c.weight), 0);
  return (<><PageHead eyebrow={t('navGroup.process')} title={t('nav.sme')} subtitle={t('sme.subtitle')} />
    <Guard state={tracks}>{x => <div className="grid g-3">{x.items.map(tk => <Card key={tk.id} title={`${tk.code} · ${L(tk.name)}`}><p className="small">{L(tk.description)}</p><KV items={[[t('sme.segment'), tk.segment], [t('sme.gates'), tk.gates], [t('sme.items'), tk.items_per_gate], [t('sme.duration'), tk.duration_days + ' ' + t('common.days')], [t('sme.score'), `${tk.score_min}–${tk.score_max}`]]} /></Card>)}</div>}</Guard>
    <div className="grid split" style={{ marginTop: 'var(--aiv-space-4)' }}><Card title={t('sme.criteria')} actions={<span className={`pill ${Math.round(total) === 100 ? 's4' : 's1'}`}>{t('sme.total', { n: total })}</span>}>
      {uni.map(c => <div key={c.id} className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap', marginBottom: 8 }}><span className="small">{L(c.name)}</span><input className="input" style={{ width: 90 }} type="number" min="0" max="100" disabled={!can('sme.manage')} value={w[c.code] ?? c.weight} onChange={e => setW(v => ({ ...v, [c.code]: Number(e.target.value) }))} aria-label={L(c.name)} /></div>)}
      {can('sme.manage') && <Btn kind="primary" disabled={Math.round(total) !== 100 || !Object.keys(w).length} onClick={() => setJ(true)}>{t('common.save')}</Btn>}
      <p className="caption">{t('sme.weightsNote')}</p></Card>
      <Card title={t('sme.processes')}>{(mps.data || []).map(m => <p key={m.id} className="small"><Link to={'/process/mp/' + m.id}>{m.id}</Link> {L(m.name)}<br /><span className="muted">{L(m.objective)}</span></p>)}
        {['SME-E2E-01', 'SME-E2E-02', 'SME-E2E-03'].map(e => <p key={e} className="small"><Link to={'/process/e2e/' + e}>{e}</Link></p>)}</Card></div>
    {j && <JustifyDialog onCancel={() => setJ(false)} onConfirm={async n => { setJ(false); await act(() => put('/sme/criteria/weights', { weights: w, _justification: n })); setW({}); crit.reload(); }} />}</>);
}

export function Templates() {
  const { t, L } = useI18n();
  return (<><PageHead eyebrow={t('navGroup.process')} title={t('nav.templates')} subtitle={t('tpl.subtitle')} />
    <RecordsView entity="ProjectTemplate" columns={[{ key: 'name', label: t('col.name'), text: r => L(r.name) }, { key: 'scope', label: t('col.scope'), text: r => t('scope.' + r.scope) + (r.vertical_id ? ' · ' + r.vertical_id : '') }, { key: 'mode', label: t('col.mode'), text: r => t('mode.' + r.mode) + (r.track ? ' · ' + r.track : '') },
      { key: 'focus', label: t('col.focus'), text: r => t('focus.' + r.focus) }, { key: 'phases', label: t('col.phases'), text: r => (r.phases || []).map(p => `${p.no}:${p.e2e.length}`).join(' ') }, { key: 'status', label: t('col.status'), render: r => <StatusPill value={r.status} />, text: r => r.status }, { key: 'use_count', label: t('col.uses'), num: true }, { key: 'version', label: 'v', num: true }]} /></>);
}
export function Gates() {
  const { t, L } = useI18n();
  return (<><PageHead eyebrow={t('navGroup.process')} title={t('nav.gates')} subtitle={t('gates.subtitle')} />
    <RecordsView entity="GateDefinition" columns={[{ key: 'name', label: t('col.name'), text: r => L(r.name) }, { key: 'purpose', label: t('gates.purpose'), text: r => L(r.purpose) }, { key: 'approvers', label: t('gates.approvers'), text: r => (r.approvers || []).join(', ') },
      { key: 'checklists', label: t('nav.checklists'), text: r => (r.checklists || []).map(c => c.code || c.id).join(', ') }, { key: 'tracks', label: t('col.track'), text: r => (r.tracks || []).join(', ') }, { key: 'status', label: t('col.status'), render: r => <StatusPill value={r.status} /> }]} /></>);
}
export function Checklists() {
  const { t, L } = useI18n(); const gates = useData('/records/GateDefinition'); const [f, setF] = useState('all');
  const linked = new Set((gates.data?.items || []).flatMap(g => (g.checklists || []).map(c => c.id)));
  const filter = f === 'all' ? null : f;
  return (<><PageHead eyebrow={t('navGroup.process')} title={t('nav.checklists')} subtitle={t('chk.subtitle')}><Seg value={f} onChange={setF} options={[{ id: 'all', label: t('chk.all') }, { id: 'gate', label: t('chk.gate') }, { id: 'none', label: t('chk.none') }]} label={t('chk.filter')} /></PageHead>
    <RecordsView key={f} entity="ChecklistTemplate" columns={[{ key: 'name', label: t('col.name'), text: r => L(r.name) }, { key: 'scope', label: t('col.scope'), text: r => t('scope.' + r.scope) + (r.vertical_id ? ' · ' + r.vertical_id : '') }, { key: 'items', label: t('chk.items'), text: r => (r.items || []).length, sortValue: r => (r.items || []).length },
      { key: 'gates', label: t('chk.gates'), render: r => linked.has(r.id) ? (gates.data?.items || []).filter(g => (g.checklists || []).some(c => c.id === r.id)).map(g => L(g.name)).join(', ') : <span className="muted">{t('chk.notRelated')}</span>, text: r => linked.has(r.id) ? 'gate' : 'none' },
      { key: 'status', label: t('col.status'), render: r => <StatusPill value={r.status} /> }]} rowFilter={f === 'all' ? undefined : r => (f === 'gate') === linked.has(r.id)} />
    {filter && <p className="caption">{t('chk.filterNote')}</p>}</>);
}
