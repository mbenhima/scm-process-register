import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { post, put, del } from '../lib/api.js';
import { PageHead, Card, Guard, DataTable, StatusPill, Btn, Icon, useAction, Kpi, Field, JustifyDialog, Legend, Select } from '../components/ui.jsx';
import { RecordsView } from '../components/Records.jsx';
import { LineChart, BarChart, Radar, StackBar, STATUS_COLORS } from '../components/charts.jsx';

export function Rules() {
  const { t, L } = useI18n();
  return (<><PageHead eyebrow={t('navGroup.governance')} title={t('nav.rules')} subtitle={t('rules.subtitle')} />
    <RecordsView entity="BusinessRule" columns={[{ key: 'code', label: 'ID' }, { key: 'process_tag', label: 'Step' }, { key: 'condition', label: t('field.condition'), text: r => L(r.condition) }, { key: 'action_id', label: t('field.action') }, { key: 'rule_type', label: t('col.type') }, { key: 'severity', label: t('col.severity'), text: r => t('severity.' + r.severity) }, { key: 'owner', label: t('col.owner') }]} /></>);
}
const COSO = ['Control Environment', 'Risk Assessment', 'Control Activities', 'Information & Communication', 'Monitoring Activities'];
export function Controls() {
  const { t, L } = useI18n(); const d = useData('/records/Control?limit=2000');
  return (<><PageHead eyebrow={t('navGroup.governance')} title={t('nav.controls')} subtitle={t('controls.subtitle')} />
    <Guard state={d}>{x => <><div className="grid g-4" style={{ marginBottom: 'var(--aiv-space-4)' }}>{COSO.slice(0, 4).map(c => <Kpi key={c} small icon="ShieldCheck" emph={false} value={x.items.filter(i => i.coso === c).length} label={t('coso.' + c)} />)}</div>
      <Card title={t('controls.coverage')}><BarChart data={COSO.map(c => ({ label: t('coso.short.' + c), value: x.items.filter(i => i.coso === c).length, eff: x.items.filter(i => i.coso === c && i.effectiveness === 'Effective').length }))} series={[{ key: 'value', label: t('controls.total') }, { key: 'eff', label: t('controls.effective') }]} caption={t('controls.caption')} /></Card>
      <p className="notice grey small" style={{ margin: 'var(--aiv-space-4) 0' }}><Icon name="Info" />{t('disclosure.nonCertification')}</p></>}</Guard>
    <RecordsView entity="Control" columns={[{ key: 'code', label: 'ID' }, { key: 'name', label: t('col.name'), text: r => L(r.name) }, { key: 'coso', label: 'COSO', text: r => t('coso.' + r.coso) }, { key: 'control_type', label: t('col.type') }, { key: 'frequency', label: t('field.frequency') }, { key: 'standard', label: t('field.standard'), text: r => r.standard || '—' }, { key: 'effectiveness', label: t('field.effectiveness'), render: r => <StatusPill value={r.effectiveness} />, text: r => r.effectiveness }]} /></>);
}
export function Risks() {
  const { t, L } = useI18n(); const d = useData('/governance/heatmap'); const color = s => (s >= 15 ? 'var(--aiv-status-1)' : s >= 10 ? 'var(--aiv-status-2)' : s >= 5 ? 'var(--aiv-status-3)' : 'var(--aiv-status-4)');
  return (<><PageHead eyebrow={t('navGroup.governance')} title={t('nav.risks')} subtitle={t('risks.subtitle')} />
    <Guard state={d}>{x => <div className="grid split-r" style={{ marginBottom: 'var(--aiv-space-4)' }}><Card title={t('risks.heatmap')}><div className="heat" role="table" aria-label={t('risks.heatmap')}>
      {x.grid.map((row, i) => [<div key={'a' + i} className="axis">{5 - i}</div>, ...row.map((cell, j) => <div key={i + '-' + j} style={{ background: color((5 - i) * (j + 1)) }} title={cell.map(c => c.code).join(', ')}>{cell.length || ''}</div>)])}
      <div className="axis" />{[1, 2, 3, 4, 5].map(i => <div key={i} className="axis">{i}</div>)}</div>
      <p className="xs muted" style={{ marginTop: 8 }}>{t('risks.axes')}</p><p className="caption">{t('risks.caption')}</p></Card>
      <Card title={t('risks.top')}>{x.risks.sort((a, b) => b.score - a.score).slice(0, 8).map(r => <div key={r.id} className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap', marginBottom: 8 }}><span className="small"><span className="strong">{r.code}</span> {L(r.title)}</span><span className="pill" style={{ background: color(r.score) }}>{r.score}</span></div>)}</Card></div>}</Guard>
    <RecordsView entity="RiskOpportunity" columns={[{ key: 'code', label: 'ID' }, { key: 'title', label: t('col.name'), text: r => L(r.title) }, { key: 'kind', label: t('col.type') }, { key: 'category', label: t('col.category'), text: r => L(r.category) }, { key: 'likelihood', label: 'L', num: true }, { key: 'impact', label: 'I', num: true }, { key: 'score', label: t('col.score'), num: true }, { key: 'status', label: t('col.status'), render: r => <StatusPill value={r.status} /> }]} /></>);
}
export function Kpis() {
  const { t, L, fmtNum } = useI18n(); const { project } = useSession(); const d = useData('/kpis' + (project ? `?project=${project}` : '')); const [sel, setSel] = useState('KPI-061');
  return (<><PageHead eyebrow={t('navGroup.governance')} title={t('nav.kpis')} subtitle={t('kpis.subtitle')} />
    <Guard state={d}>{x => { const latest = Object.fromEntries(x.latest.map(l => [l.kpi_id, l])); const def = x.definitions.find(k => k.code === sel); const tr = x.trend.filter(r => r.kpi_id === sel);
      const tot = x.latest.reduce((a, l) => ({ g: a.g + l.green, a: a.a + l.amber, r: a.r + l.red }), { g: 0, a: 0, r: 0 });
      const byMp = {}; for (const k of x.definitions) { const l = latest[k.code]; if (!l || !l.target) continue; const mp = k.macro_process; (byMp[mp] ||= []).push(Math.min(1.2, l.value / l.target)); }
      const radarAxes = Object.keys(byMp).filter(m => ['MP-01', 'MP-03', 'MP-04', 'MP-46', 'MP-47', 'MP-49', 'MP-53', 'MP-54'].includes(m));
      return (<><div className="grid split"><Card title={def ? `${sel} · ${L(def.name)}` : sel}><LineChart labels={tr.map(r => r.period.slice(2))} lines={[{ label: t('kpis.actual'), values: tr.map(r => Math.round(r.value * 10) / 10) }, { label: t('col.target'), values: tr.map(() => latest[sel]?.target ?? 0), dashed: true }]} caption={t('kpis.trendCaption', { formula: L(def?.formula) })} /></Card>
        <Card title={t('kpis.health')}><StackBar parts={[{ label: t('status.Green'), value: tot.g, color: STATUS_COLORS.Green }, { label: t('status.Amber'), value: tot.a, color: STATUS_COLORS.Amber }, { label: t('status.Red'), value: tot.r, color: STATUS_COLORS.Red }]} caption={t('kpis.healthCaption')} />
          {radarAxes.length > 2 && <Radar max={1.2} axes={radarAxes} series={[{ label: t('kpis.actualVsTarget'), values: radarAxes.map(m => byMp[m].reduce((s, v) => s + v, 0) / byMp[m].length) }, { label: t('col.target'), values: radarAxes.map(() => 1) }]} caption={t('kpis.radarCaption')} />}</Card></div>
        <div style={{ marginTop: 'var(--aiv-space-4)' }}><DataTable csvName="kpis" rows={x.definitions} onRow={r => setSel(r.code)} columns={[{ key: 'code', label: 'ID' }, { key: 'name', label: t('col.kpi'), text: r => L(r.name) }, { key: 'kpi_type', label: t('col.type') }, { key: 'macro_process', label: 'MP' },
          { key: 'value', label: t('col.value'), num: true, text: r => latest[r.code] ? fmtNum(Math.round(latest[r.code].value * 10) / 10) : '—', sortValue: r => latest[r.code]?.value ?? -1 }, { key: 'target', label: t('col.target'), text: r => L(r.target) },
          { key: 'rag', label: 'RAG', render: r => { const l = latest[r.code]; if (!l) return '—'; const s = l.red >= l.green && l.red >= l.amber ? 'Red' : l.amber >= l.green ? 'Amber' : 'Green'; return <StatusPill value={s} />; } }]} /></div>
        <h2 className="section-title">{t('kpis.custom')}</h2><RecordsView entity="CustomKpi" /></>); }}</Guard></>);
}
export function AlertSettings() {
  const { t, L } = useI18n(); const { can, me, reload } = useSession(); const cat = useData('/alert-catalog'); const st = useData('/governance/alert-settings'); const act = useAction(); const [j, setJ] = useState(null);
  const enabled = Object.fromEntries((st.data || []).map(s => [s.type, !!s.enabled]));
  return (<><PageHead eyebrow={t('navGroup.governance')} title={t('nav.alertSettings')} subtitle={t('alertset.subtitle')} />
    <Card title={t('alertset.justification')}><label className="check"><input type="checkbox" disabled={!can('hierarchy.manage')} checked={!!me.config?.config?.justification_required} onChange={e => setJ(e.target.checked)} />{t('alertset.justificationText')}</label></Card>
    <div style={{ marginTop: 'var(--aiv-space-4)' }}><Guard state={cat}>{rows => <DataTable csvName="alert_catalog" rows={rows} columns={[{ key: 'on', label: t('alertset.enabled'), noSort: true, render: a => <input type="checkbox" aria-label={a.id} disabled={!can('governance.manage')} checked={enabled[a.id] !== false} onChange={async e => { await act(() => put('/governance/alert-settings', { type: a.id, enabled: e.target.checked })); st.reload(); }} /> },
      { key: 'id', label: t('alertset.code') }, { key: 'name', label: t('col.name'), text: a => L(a.name) }, { key: 'rule', label: t('field.rule') }, { key: 'condition', label: t('field.condition'), text: a => L(a.condition) }, { key: 'severity', label: t('col.severity'), text: a => t('severity.' + a.severity) }, { key: 'step', label: 'Step' }, { key: 'escalation', label: t('col.escalation'), text: a => L(a.escalation) }]} />}</Guard></div>
    {j != null && <JustifyDialog onCancel={() => setJ(null)} onConfirm={async n => { const v = j; setJ(null); await act(() => put('/governance/justification', { required: v, _justification: n })); reload(); }} />}</>);
}
export function Racsi() {
  const { t, L } = useI18n(); const { can } = useSession(); const d = useData('/racsi'); const dir = useData('/directory'); const act = useAction(); const [add, setAdd] = useState(null);
  return (<><PageHead eyebrow={t('navGroup.governance')} title="RACSI" subtitle={t('racsi.subtitle')} />
    <Legend items={['R', 'A', 'C', 'S', 'I'].map(k => ({ label: `${k} — ${t('racsi.' + k)}`, color: 'var(--aiv-bg-alt)' }))} />
    <div style={{ marginTop: 'var(--aiv-space-3)' }}><Guard state={d}>{rows => <DataTable csvName="racsi" rows={rows} columns={[{ key: 'ref_id', label: t('col.activity') }, { key: 'name', label: t('col.name'), text: r => L(r.name) }, { key: 'process_tag', label: 'Step' },
      ...['R', 'A', 'C', 'S', 'I'].map(k => ({ key: k, label: k, text: r => r.assignments.filter(a => a.letter === k).map(a => a.assignee).join(', '), render: r => <span className="small">{r.assignments.filter(a => a.letter === k).map(a => <span key={a.id} className="row" style={{ flexWrap: 'nowrap', gap: 4 }}>{a.assignee}{can('governance.manage') && <button className="btn ghost sm icon" aria-label={t('common.delete')} onClick={async () => { await act(() => del(`/racsi/${r.id}/assignments/${a.id}`), 'common.deleted'); d.reload(); }}><Icon name="X" size={12} /></button>}</span>)}</span> })),
      { key: 'add', label: '', noSort: true, render: r => can('governance.manage') && <Btn size="sm" icon="Plus" aria-label={t('racsi.add')} onClick={() => setAdd({ id: r.id, letter: 'C', assignee: '' })} /> }]} />}</Guard></div>
    {add && <div className="overlay"><div className="dialog"><div className="dialog-body stack"><h3>{t('racsi.add')}</h3>
      <Field label={t('col.role')} id="rl"><Select id="rl" className="input" value={add.letter} onChange={e => setAdd(a => ({ ...a, letter: e.target.value }))}>{['R', 'A', 'C', 'S', 'I'].map(k => <option key={k} value={k}>{k} — {t('racsi.' + k)}</option>)}</Select></Field>
      <Field label={t('col.assignee')} id="as"><input id="as" list="dirl" className="input" value={add.assignee} onChange={e => setAdd(a => ({ ...a, assignee: e.target.value }))} /><datalist id="dirl">{(dir.data || []).map(u => <option key={u.id} value={u.title} />)}</datalist></Field>
      <p className="xs muted">{t('racsi.oneA')}</p></div><div className="dialog-foot"><Btn onClick={() => setAdd(null)}>{t('common.cancel')}</Btn><Btn kind="primary" disabled={!add.assignee} onClick={async () => { await act(() => post(`/racsi/${add.id}/assignments`, add)); setAdd(null); d.reload(); }}>{t('common.save')}</Btn></div></div></div>}</>);
}
export function Rex() {
  const { t, L } = useI18n(); const d = useData('/governance/rex-register'); const [sp] = useSearchParams();
  return (<><PageHead eyebrow={t('navGroup.governance')} title={t('nav.rex')} subtitle={t('rex.subtitle')} />
    <Guard state={d}>{x => <div className="grid g-2" style={{ marginBottom: 'var(--aiv-space-4)' }}><Card title={t('rex.byCategory')}><BarChart max={5} data={x.byCategory.map(c => ({ label: L(c.category), value: c.avg, n: c.n }))} caption={t('rex.catCaption')} /></Card>
      <Card title={t('rex.trend')}><LineChart labels={x.trend.map(r => r.month.slice(2))} lines={[{ label: t('rex.avgRating'), values: x.trend.map(r => r.avg) }]} caption={t('rex.trendCaption')} /></Card></div>}</Guard>
    <RecordsView entity="RexEntry" defaults={sp.get('new') ? undefined : undefined} columns={[{ key: 'title', label: t('col.name'), text: r => L(r.title) }, { key: 'category', label: t('col.category'), text: r => L(r.category) }, { key: 'root_cause', label: t('field.root_cause'), text: r => L(r.root_cause) }, { key: 'recommendation', label: t('field.recommendation'), text: r => L(r.recommendation) }, { key: 'rating', label: t('field.rating'), num: true }]} /></>);
}
