// Audits and inspections (FR-DA-AFP-01..05) and registers (FR-DA-SFM, FR-DA-LNK). An audit plan has a frequency
// from a list or Custom, from which its next date is derived; findings are graded on a scale whose rules are shown;
// a nonconformity raises its corrective action in the action process; the audit report is generated from records.
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { post } from '../lib/api.js';
import { PageHead, Card, Guard, DataTable, StatusPill, Btn, Icon, useAction, KV, Empty, Search } from '../components/ui.jsx';
import { RecordsView } from '../components/Records.jsx';

const GRADE_LEVEL = { Major: 1, Minor: 2, Observation: 3, Improvement: 4, Strength: 5 };

export function Audits() {
  const { t, L, fmtDate } = useI18n(); const nav = useNavigate(); const scale = useData('/audits/scale');
  return (<><PageHead eyebrow={t('nav.governance')} title={t('nav.audits')} subtitle={t('afp.subtitle')}><Link className="btn" to="/documents?template=DT-AUDIT"><Icon name="FileText" />{t('afp.report')}</Link></PageHead>
    {scale.data && <Card tint title={t('afp.scale')}><div className="row" style={{ flexWrap: 'wrap', marginBottom: 'var(--aiv-space-2)' }}>{scale.data.grades.map(g => <StatusPill key={g.value} value={g.label} level={GRADE_LEVEL[g.value]} />)}</div><p className="small">{scale.data.rules}</p></Card>}
    <div className="mt"><RecordsView entity="AuditProgram" onOpen={r => nav('/gov/audits/' + r.id)} defaults={{ status: 'Planned', frequency: 'Annual' }} columns={[{ key: 'code', label: t('col.code') }, { key: 'name', label: t('col.name'), text: r => L(r.name) }, { key: 'standard', label: t('afp.standard'), text: r => r.standard || '—' },
      { key: 'frequency', label: t('afp.frequency'), text: r => (r.frequency === 'Custom' ? L(r.frequency_custom) : t('freq.' + r.frequency)) }, { key: 'planned_date', label: t('afp.planned'), value: r => (r.planned_date ? fmtDate(r.planned_date) : '—'), sortValue: r => r.planned_date || '' },
      { key: 'next_date', label: t('afp.next'), value: r => (r.next_date ? fmtDate(r.next_date) : '—'), sortValue: r => r.next_date || '' }, { key: 'status', label: t('col.status'), render: r => <StatusPill value={r.status} />, text: r => r.status }]} /></div></>);
}

export function AuditDetail() {
  const { id } = useParams(); const { t, L, fmtDate } = useI18n(); const { can } = useSession(); const act = useAction();
  const a = useData(`/records/AuditProgram/${id}`, [id]); const f = useData(`/records/AuditFinding?limit=500&audit_id=${id}`, [id]); const [k, setK] = useState(0);
  return (<Guard state={a}>{x => <>
    <PageHead eyebrow={`${t('nav.audits')} · ${x.code}`} title={L(x.name)} subtitle={L(x.scope)}><Link className="btn" to="/gov/audits"><Icon name="ArrowLeft" />{t('nav.audits')}</Link><Link className="btn primary" to="/documents?template=DT-AUDIT"><Icon name="FileText" />{t('afp.report')}</Link></PageHead>
    <div className="grid split"><Card title={t('afp.plan')}><KV items={[[t('afp.objectives'), L(x.objectives) || '—'], [t('afp.criteria'), L(x.criteria) || '—'], [t('afp.standard'), x.standard || '—'], [t('afp.processes'), (x.processes || []).join(', ') || '—'], [t('afp.lead'), x.lead_auditor || '—'],
      [t('afp.team'), (x.team || []).map(m => `${m.name}${m.qualification ? ' (' + m.qualification + ')' : ''}`).join(', ') || '—'], [t('afp.duration'), x.duration_days ? t('afp.days', { n: x.duration_days }) : '—']]} /></Card>
      <Card title={t('afp.schedule')}><KV items={[[t('afp.frequency'), x.frequency === 'Custom' ? L(x.frequency_custom) : t('freq.' + x.frequency)], [t('afp.justification'), L(x.frequency_justification) || '—'], [t('afp.planned'), x.planned_date ? fmtDate(x.planned_date) : '—'], [t('afp.performed'), x.performed_date ? fmtDate(x.performed_date) : '—'], [t('afp.next'), x.next_date ? fmtDate(x.next_date) : '—'], [t('col.status'), <StatusPill key="s" value={x.status} />]]} />
        <p className="xs muted">{t('afp.nextHint')}</p></Card></div>
    <h2 className="section-title">{t('afp.findings')}</h2>
    <Guard state={f}>{fx => fx.items.filter(y => (y.grade === 'Major' || y.grade === 'Minor') && !y.action_id).length > 0 && <div className="notice" style={{ marginBottom: 'var(--aiv-space-3)' }}><Icon name="TriangleAlert" /><div className="small">{t('afp.ncWithoutAction', { n: fx.items.filter(y => (y.grade === 'Major' || y.grade === 'Minor') && !y.action_id).length })}</div></div>}</Guard>
    <RecordsView key={k} entity="AuditFinding" filter={{ audit_id: id }} defaults={{ audit_id: id, status: 'Open', grade: 'Minor' }} columns={[{ key: 'code', label: t('col.code') }, { key: 'grade', label: t('afp.grade'), render: r => <StatusPill value={t('grade.' + r.grade)} level={GRADE_LEVEL[r.grade]} />, text: r => r.grade },
      { key: 'req', label: t('afp.requirement'), text: r => `${r.requirement || ''} ${r.clause ? '§' + r.clause : ''}` }, { key: 'statement', label: t('afp.statement'), text: r => L(r.statement) }, { key: 'due', label: t('col.due'), value: r => (r.due ? fmtDate(r.due) : '—'), sortValue: r => r.due || '' },
      { key: 'status', label: t('col.status'), render: r => <StatusPill value={r.status} /> },
      { key: 'act', label: t('afp.action'), render: r => r.action_id ? <span className="pill xs s4">{t('afp.actionRaised')}</span> : (r.grade === 'Major' || r.grade === 'Minor') && can('audits.manage') ? <Btn size="sm" icon="Wrench" onClick={async e => { e.stopPropagation(); await act(() => post(`/audit-findings/${r.id}/action`, {}), 'afp.actionCreated'); setK(v => v + 1); f.reload(); }}>{t('afp.raiseAction')}</Btn> : '—' }]} />
  </>}</Guard>);
}

export function Registers() {
  const { t, L, fmtDate } = useI18n(); const { project } = useSession(); const d = useData(`/registers${project ? '?project=' + project : ''}`, [project]); const [sel, setSel] = useState(null); const [q, setQ] = useState('');
  const e = useData(sel ? `/registers/${sel}${project ? '?project=' + project : ''}` : null, [sel, project]);
  return (<><PageHead eyebrow={t('nav.governance')} title={t('nav.registers')} subtitle={t('reg.subtitle')} />
    <Guard state={d}>{rows => !rows.length ? <Card><Empty icon="BookMarked" title={t('reg.none')} text={t('reg.noneText')} /></Card> : <div className="split-pane">
      <Card title={t('nav.registers')}><Search value={q} onChange={setQ} placeholder={t('common.search')} /><ul className="plain" style={{ marginTop: 'var(--aiv-space-3)' }}>{rows.filter(r => !q || L(r.name).toLowerCase().includes(q.toLowerCase())).map(r => <li key={r.key}><button type="button" className="tree-row" aria-current={sel === r.key || undefined} onClick={() => setSel(r.key)}><span style={{ flex: 1 }}>{L(r.name)}</span><span className="pill xs">{r.count}</span></button></li>)}</ul></Card>
      {sel ? <Card title={L(rows.find(r => r.key === sel)?.name)}><Guard state={e}>{items => { const keys = [...new Set(items.flatMap(i => Object.keys(i)))].filter(k => !['id', 'project_id', 'project', 'version', 'updated_at', 'source_task_id', 'source_step_id', 'links', '_origin'].includes(k)).slice(0, 6);
        return <DataTable id={'reg-' + sel} csvName={'register_' + sel} rows={items} columns={[...keys.map(k => ({ key: k, label: t('reg.f.' + k) === 'reg.f.' + k ? k : t('reg.f.' + k), text: r => (typeof r[k] === 'object' ? JSON.stringify(r[k]) : String(r[k] ?? '')) })), { key: 'project', label: t('nav.projects') }, { key: 'source_step_id', label: t('pdm.kind.step'), text: r => r.source_step_id || '—' }, { key: 'updated_at', label: t('col.date'), value: r => fmtDate(r.updated_at), sortValue: r => r.updated_at }, { key: 'links', label: t('reg.links'), num: true }]} />; }}</Guard></Card> : <Card><Empty icon="MousePointerClick" title={t('reg.pick')} /></Card>}
    </div>}</Guard></>);
}
