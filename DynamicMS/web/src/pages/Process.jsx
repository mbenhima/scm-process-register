import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp, useData } from '../lib/state.jsx';
import { PageHead, Card, Loading, ErrorBox, Tabs, Table, tx, Search, Kpi } from '../components/ui.jsx';
import { Sipoc } from './MacroProcess.jsx';

const REF = [['rules', 'Business rules'], ['actions', 'Rule actions'], ['controls', 'Controls'], ['risks', 'Process risks'], ['kpis', 'Process KPIs'], ['alerts', 'Alerts'], ['reports', 'Reports'], ['docTemplates', 'Document templates'], ['policies', 'Policies'], ['classes', 'Object classes'], ['dataDictionary', 'Data dictionary'], ['valueLists', 'Value lists'], ['roleMenus', 'Role menus'], ['modules', 'Modules'], ['uf', 'Unified functional steps']];
const cell = (v, lang) => (v === null || v === undefined ? '' : Array.isArray(v) ? v.map(x => cell(x, lang)).join(', ') : typeof v === 'object' ? (v.en !== undefined || v.fr !== undefined ? tx(v, lang) : JSON.stringify(v)) : String(v));

export default function Process() {
  const { t, L, lang } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('e2e');
  const sum = useData('/catalog/summary');
  const e2e = useData(tab === 'e2e' ? '/catalog/e2e' : null);
  const [q, setQ] = useState(''); const [tier, setTier] = useState(''); const [vert, setVert] = useState('');
  const mps = useData(tab === 'mps' ? `/catalog/mps?${tier ? `tier=${tier}&` : ''}${vert ? `vertical=${vert}&` : ''}q=${encodeURIComponent(q)}` : null, [q, tier, vert]);
  const verts = useData(['verticals', 'mps', 'activation'].includes(tab) ? '/catalog/verticals' : null);
  const act = useData(tab === 'activation' ? '/catalog/activation' : null);
  const [ref, setRef] = useState('rules');
  const refData = useData(tab === 'reference' ? `/catalog/reference/${ref}` : null, [ref]);
  const com = useData(tab === 'commercial' ? '/catalog/commercial' : null);
  const refCols = useMemo(() => { const r = refData.data?.[0]; return r ? Object.keys(r).filter(k => !/Name$/.test(k) || !Object.keys(r).includes(k.replace(/Name$/, ''))).slice(0, 7) : []; }, [refData.data]);
  return (
    <>
      <PageHead eyebrow={t('Design')} title={t('Process design')} subtitle={t('The reference model every project runs: end-to-end processes, macro processes, tasks and steps, with their governance and vertical activation.')} />
      {sum.data && <div className="grid-kpi" style={{ marginBottom: 24 }}>{[['e2e', t('End-to-end processes')], ['macroProcesses', t('Macro processes')], ['tasks', t('Tasks')], ['steps', t('Steps')], ['verticals', t('Verticals')], ['requirements', t('SRS requirements')]].map(([k, l]) => <Kpi key={k} value={sum.data[k].toLocaleString()} label={l} />)}</div>}
      <Tabs label={t('Process design views')} value={tab} onChange={setTab} tabs={[{ id: 'e2e', label: t('E2E processes') }, { id: 'mps', label: t('Macro processes') }, { id: 'verticals', label: t('Verticals') }, { id: 'activation', label: t('Activation matrix') }, { id: 'reference', label: t('Reference lists') }, { id: 'commercial', label: t('Packs and pricing') }]} />
      {tab === 'e2e' && (e2e.data ? (
        <div className="grid-cards">{e2e.data.map(e => (
          <Link key={e.id} to={`/process/e2e/${e.id}`} className="phase-card" style={{ textDecoration: 'none' }}>
            <span className="phase-id">{e.id} · {tx(e.type, lang)}</span><span className="strong">{tx(e.name, lang)}</span>
            <span className="small">{tx(e.goals, lang)}</span>
            <span className="xsmall muted">{t('{m} macro processes · {s} steps', { m: e.mpCount, s: e.stepCount })} · {tx(e.ownerRole, lang)}</span>
          </Link>
        ))}</div>
      ) : <Loading />)}
      {tab === 'mps' && (
        <>
          <div className="row" style={{ marginBottom: 16 }}>
            <div style={{ flex: '1 1 260px' }}><Search value={q} onChange={setQ} placeholder={t('Search by code or name')} /></div>
            <select className="select" style={{ width: 'auto' }} aria-label={t('Tier')} value={tier} onChange={e => setTier(e.target.value)}><option value="">{t('All tiers')}</option>{sum.data?.tiers.map(x => <option key={x.tier} value={x.tier}>{t('Tier {n}', { n: x.tier })} — {tx(x.name, lang)} ({x.count})</option>)}</select>
            <select className="select" style={{ width: 'auto' }} aria-label={t('Vertical')} value={vert} onChange={e => setVert(e.target.value)}><option value="">{t('All verticals')}</option>{verts.data?.map(v => <option key={v.id} value={v.id}>{v.id} — {tx(v.name, lang)}</option>)}</select>
          </div>
          {mps.data ? <Table rows={mps.data} onRowClick={(m) => navigate(`/process/mp/${m.id}`)} columns={[{ key: 'id', label: 'ID', width: 90 }, { key: 'code', label: t('Code'), width: 90 }, { key: 'name', label: t('Macro process'), render: m => <span className="strong">{tx(m.name, lang)}</span>, sortValue: m => tx(m.name, lang) }, { key: 'tier', label: t('Tier'), width: 60 }, { key: 'e2e', label: 'E2E', width: 80 }, { key: 'scope', label: t('Scope'), width: 70 }, { key: 'ownerRole', label: t('Owner'), render: m => tx(m.ownerRole, lang) }, { key: 'stepCount', label: t('Steps'), width: 70 }]} /> : <Loading />}
        </>
      )}
      {tab === 'verticals' && (verts.data ? <Table rows={verts.data} columns={[{ key: 'id', label: 'ID', width: 70 }, { key: 'name', label: t('Vertical'), render: v => <span className="strong">{tx(v.name, lang)}</span> }, { key: 'mustStandards', label: t('Must-have standards'), render: v => (v.mustStandards || []).join(', ') }, { key: 'basePack', label: t('Base pack') }, { key: 'industryPack', label: t('Industry pack'), render: v => v.industryPack || '—' }, { key: 'active', label: t('Active MPs'), width: 90 }, { key: 'tiers', label: t('Tiers') }]} /> : <Loading />)}
      {tab === 'activation' && (act.data ? (
        <>
          <div className="table-wrap" style={{ maxHeight: '70vh', overflow: 'auto' }}>
            <table className="data" style={{ fontSize: 12 }}>
              <thead><tr><th scope="col" style={{ minWidth: 240, position: 'sticky', insetInlineStart: 0, zIndex: 3 }}>{t('Macro process')}</th>{act.data.segments.map(s => <th key={s.id} scope="col" title={tx(s.name, lang)} style={{ padding: '8px 4px', textAlign: 'center' }}>{s.id}</th>)}</tr></thead>
              <tbody>{act.data.rows.map(r => <tr key={r.id}><td style={{ position: 'sticky', insetInlineStart: 0 }}><Link to={`/process/mp/${r.id}`}>{r.code}</Link> <span className="muted">T{r.tier}</span> {tx(r.name, lang)}</td>{act.data.segments.map(s => { const v = r.activation[s.id]; return <td key={s.id} style={{ padding: 2, textAlign: 'center', background: v === '✓' ? 'var(--st-5)' : v === 'S' ? 'var(--st-3)' : undefined }} title={`${r.code} × ${s.id}`}>{v === '—' ? '' : v}</td>; })}</tr>)}</tbody>
            </table>
          </div>
          <p className="caption">{t('✓ activated for the vertical, S selective (activated on need), blank not applicable.')}</p>
        </>
      ) : <Loading />)}
      {tab === 'reference' && (
        <>
          <div className="row" style={{ marginBottom: 16 }}><label className="small strong" htmlFor="ref">{t('List')}</label><select id="ref" className="select" style={{ width: 'auto' }} value={ref} onChange={e => setRef(e.target.value)}>{REF.map(([k, l]) => <option key={k} value={k}>{t(l)}</option>)}</select>{refData.data && <span className="small muted">{t('{n} entries', { n: refData.data.length })}</span>}</div>
          {refData.error && <ErrorBox error={refData.error} />}
          {refData.data ? <Table rows={refData.data.map((r, i) => ({ _k: i, ...r }))} rowKey="_k" maxRows={300} columns={refCols.map(k => ({ key: k, label: k, render: r => cell(r[k], lang), sortValue: r => cell(r[k], lang) }))} /> : <Loading />}
        </>
      )}
      {tab === 'commercial' && (com.data ? (
        <div className="stack">
          <Card title={t('Solution packs')}><Table rows={com.data.packs} columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: t('Pack'), render: p => <span className="strong">{tx(p.name, lang)}</span> }, { key: 'type', label: t('Type'), render: p => tx(p.typeName, lang) }, { key: 'price', label: t('Price') }, { key: 'users', label: t('Users') }, { key: 'mps', label: t('Macro processes'), render: p => p.mps.length }]} /></Card>
          <Card title={t('Add-ons')}><Table rows={com.data.addons} columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: t('Add-on'), render: a => tx(a.name, lang) }, { key: 'category', label: t('Category'), render: a => tx(a.category, lang) }, { key: 'price', label: t('Price') }]} /></Card>
          <Card title={t('Deployment modes')}><Table rows={com.data.deploymentModes.map(d => ({ ...d, id: d.code }))} columns={[{ key: 'code', label: t('Code') }, { key: 'name', label: t('Mode'), render: d => tx(d.name, lang) }, { key: 'multiplier', label: t('Price multiplier') }, { key: 'isolation', label: t('Isolation'), render: d => tx(d.isolation, lang) }]} /></Card>
          <Card title={t('Integrations')}><Table rows={com.data.integrations} columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: t('Integration'), render: i => tx(i.name, lang) }, { key: 'category', label: t('Category'), render: i => tx(i.category, lang) }, { key: 'goals', label: t('Goals'), render: i => tx(i.goals, lang) }]} /></Card>
        </div>
      ) : <Loading />)}
    </>
  );
}

export function E2EDetail() {
  const { id } = useParams();
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const { data: e, loading, error } = useData(`/catalog/e2e/${id}`);
  const [tab, setTab] = useState('mps');
  if (loading && !e) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  return (
    <>
      <PageHead eyebrow={`${e.id} · ${tx(e.typeName, lang)}`} title={tx(e.name, lang)} subtitle={tx(e.goals, lang)} actions={<Link className="btn" to="/process">{t('Process design')}</Link>} />
      <div className="grid-main" style={{ marginBottom: 24 }}>
        <Card title={t('Narrative')}><p className="small" style={{ whiteSpace: 'pre-wrap' }}>{tx(e.narrative, lang) || tx(e.description, lang)}</p></Card>
        <Card title={t('Boundaries')}><p className="small"><span className="strong">{t('Trigger')}: </span>{tx(e.trigger, lang)}</p><p className="small"><span className="strong">{t('Terminal event')}: </span>{tx(e.terminal, lang)}</p><p className="small"><span className="strong">{t('Business value')}: </span>{tx(e.businessValue, lang)}</p></Card>
      </div>
      <Tabs label={t('E2E views')} value={tab} onChange={setTab} tabs={[{ id: 'mps', label: t('Macro processes'), count: e.mps.length }, { id: 'flow', label: t('Unified flow'), count: e.flow.length }, { id: 'racsi', label: 'RACSI', count: e.racsi.length }, { id: 'chains', label: t('Chains'), count: e.chains.length }]} />
      {tab === 'mps' && <Table rows={e.mps} onRowClick={(m) => navigate(`/process/mp/${m.id}`)} columns={[{ key: 'code', label: t('Code') }, { key: 'name', label: t('Macro process'), render: m => tx(m.name, lang) }, { key: 'tier', label: t('Tier') }, { key: 'ownerRole', label: t('Owner'), render: m => tx(m.ownerRole, lang) }, { key: 'stepCount', label: t('Steps') }]} />}
      {tab === 'flow' && <Table rows={e.flow.map((f, i) => ({ ...f, id: i }))} columns={[{ key: 'ufId', label: 'UF' }, { key: 'ufName', label: t('Unified step'), render: f => tx(f.ufName, lang) }, { key: 'inputs', label: t('Inputs'), render: f => cell(f.inputs, lang) }, { key: 'seqTaskName', label: t('Task'), render: f => tx(f.seqTaskName, lang) }, { key: 'outputs', label: t('Outputs'), render: f => cell(f.outputs, lang) }, { key: 'outputCustomers', label: t('Customers'), render: f => cell(f.outputCustomers, lang) }]} />}
      {tab === 'racsi' && <Table rows={e.racsi.map((r, i) => ({ ...r, id: i }))} columns={[{ key: 'activity', label: t('Activity'), render: r => tx(r.activity, lang) }, ...'RACSI'.split('').map(Lt => ({ key: Lt, label: Lt, render: r => cell(r[Lt], lang) }))]} />}
      {tab === 'chains' && <Table rows={e.chains.map((c, i) => ({ ...c, id: i }))} columns={[{ key: 'from', label: t('From') }, { key: 'typeName', label: t('Relation'), render: c => tx(c.typeName, lang) }, { key: 'to', label: t('To') }, { key: 'steps', label: t('Steps') }]} />}
    </>
  );
}

export function CatalogMp() {
  const { id } = useParams();
  const { t, L, lang } = useApp();
  const { data: m, loading, error } = useData(`/catalog/mps/${id}`);
  const [tab, setTab] = useState('tasks');
  if (loading && !m) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const act = Object.entries(m.activation || {}).filter(([, v]) => v === '✓' || v === 'S');
  return (
    <>
      <PageHead eyebrow={`${m.id} · ${m.e2e} · ${t('Tier {n}', { n: m.tier })}`} title={`${m.code} — ${tx(m.name, lang)}`} subtitle={tx(m.goal, lang)} actions={<Link className="btn" to={`/process/e2e/${m.e2e}`}>{m.e2e}</Link>} />
      <Tabs label={t('Macro process views')} value={tab} onChange={setTab} tabs={[{ id: 'tasks', label: t('Tasks and steps'), count: m.stepCount }, { id: 'sipoc', label: 'SIPOC' }, { id: 'gov', label: t('Governance') }, { id: 'act', label: t('Activation'), count: act.length }]} />
      {tab === 'tasks' && <div className="stack">{m.tasks.map(tk => <Card key={tk.id} title={`${tk.id} — ${tx(tk.name, lang)}`}><Table rows={tk.steps} columns={[{ key: 'id', label: 'ID', width: 100 }, { key: 'name', label: t('Step'), render: s => tx(s.name, lang) }, { key: 'typeName', label: t('Type'), render: s => tx(s.typeName, lang) }, { key: 'roleName', label: t('Role'), render: s => tx(s.roleName, lang) }, { key: 'formKind', label: t('Input form'), render: s => t(s.formKind) }]} /></Card>)}</div>}
      {tab === 'sipoc' && <Card><Sipoc sipoc={m.sipoc} lang={lang} t={t} /></Card>}
      {tab === 'gov' && <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <Card title={t('Business rules')}>{m.rules.length ? <ul className="list small">{m.rules.map(r => <li key={r.id}><span className="strong">{r.id}</span> · {L(r.type)} — {tx(r.condition, lang)}</li>)}</ul> : <p className="small muted">—</p>}</Card>
        <Card title={t('Controls')}>{m.controls.length ? <ul className="list small">{m.controls.map(c => <li key={c.id}><span className="strong">{c.id}</span> — {tx(c.name, lang)}</li>)}</ul> : <p className="small muted">—</p>}</Card>
        <Card title={t('KPIs')}>{m.kpis.length ? <ul className="list small">{m.kpis.map(k => <li key={k.id}><span className="strong">{k.id}</span> — {tx(k.name, lang)} ({k.target})</li>)}</ul> : <p className="small muted">—</p>}</Card>
        <Card title={t('Standards')}><p className="small">{m.standards.join(', ') || '—'}</p></Card>
      </div>}
      {tab === 'act' && <Card><div className="row">{act.map(([s, v]) => <span key={s} className={`tag ${v === '✓' ? 's5' : 's3'}`}>{s} {v}</span>)}</div></Card>}
    </>
  );
}
