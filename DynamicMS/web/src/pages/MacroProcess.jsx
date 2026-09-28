import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Circle, Clock } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { PageHead, Card, Loading, ErrorBox, Status, Progress, Tabs, Table, tx } from '../components/ui.jsx';
import Bpmn from '../components/Bpmn.jsx';
import { NoProject } from './Home.jsx';

export function Sipoc({ sipoc, lang, t }) {
  const cols = [['S', t('Suppliers')], ['I', t('Inputs')], ['P', t('Process steps')], ['O', t('Outputs')], ['C', t('Customers')]];
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
      {cols.map(([k, label]) => (
        <div key={k} className="card flat tight" style={k === 'P' ? { gridColumn: 'span 2' } : undefined}>
          <div className="row" style={{ marginBottom: 8 }}><span className="badge-icon sm accent serif" style={{ fontWeight: 700 }}>{k}</span><span className="strong small">{label}</span></div>
          <ol className="small" style={{ margin: 0, paddingInlineStart: 20 }}>{(sipoc?.[k] || []).map((x, i) => <li key={i}>{tx(x, lang)}</li>)}</ol>
        </div>
      ))}
    </div>
  );
}

export default function MacroProcess() {
  const { mpId } = useParams();
  const { t, L, lang, projectId, project, fmtDate } = useApp();
  const [tab, setTab] = useState('steps');
  const { data, loading, error, reload } = useData(projectId ? `/projects/${projectId}/mps/${mpId}` : null);
  if (!projectId) return <NoProject />;
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const m = data.mp;
  const today = new Date().toISOString().slice(0, 10);
  const nSteps = data.tasks.reduce((a, tk) => a + tk.steps.length, 0);
  return (
    <>
      <PageHead eyebrow={`${m.e2e} · ${tx(m.e2eName, lang)}`} title={`${m.code} — ${tx(m.name, lang)}`} subtitle={tx(m.goal, lang)}
        actions={<Link className="btn" to={`/lifecycle/${m.e2e}`}>{t('Back to phase')}</Link>}>
        <div className="row small" style={{ marginTop: 12 }}>
          <Status value={data.status} /><span className="muted">{t('Tier {n}', { n: m.tier })} · {tx(m.ownerRoleName, lang)} · {t('{n} steps', { n: nSteps })}</span>
          {m.standards?.slice(0, 4).map(s => <span key={s} className="tag outline">{s}</span>)}
        </div>
        <div style={{ maxWidth: 360, marginTop: 12 }}><Progress value={data.progress} label={t('Progress')} /></div>
      </PageHead>
      <Tabs label={t('Macro process views')} value={tab} onChange={setTab} tabs={[{ id: 'steps', label: t('Tasks and steps') }, { id: 'sipoc', label: 'SIPOC' }, { id: 'diagram', label: t('BPMN diagram') }, { id: 'racsi', label: 'RACSI' }, { id: 'gov', label: t('Governance') }]} />
      {tab === 'steps' && (
        <div className="grid-main">
          <div className="stack">
            {data.tasks.map(tk => (
              <Card key={tk.id} title={`${t('Task')} ${tk.seq} — ${tx(tk.name, lang)}`}>
                <ol className="steps-list">
                  {tk.steps.map(s => {
                    const st = s.exec?.status || 'Todo';
                    const overdue = st !== 'Done' && s.exec?.due_date < today;
                    return (
                      <li key={s.id}>
                        <Link className="step-row" to={s.exec ? `/steps/${s.exec.id}` : '#'}>
                          <span className={`step-state ${st}`} aria-label={L(st)}>{st === 'Done' ? <Check /> : st === 'InProgress' ? <Clock /> : <Circle style={{ opacity: 0 }} />}</span>
                          <span style={{ minWidth: 0 }}><span className="strong small">{s.seq}. {tx(s.name, lang)}</span><br /><span className="xsmall muted">{s.id} · {tx(s.role, lang)} · {tx(s.type, lang)}{s.exec?.value ? ` — ${tx(s.exec.value, lang)}` : ''}</span></span>
                          <span className="xsmall" style={{ textAlign: 'end' }}>{overdue ? <Status value="Overdue" /> : <Status value={st} />}<br /><span className="muted">{st === 'Done' ? fmtDate(s.exec?.completed_at) : fmtDate(s.exec?.due_date)}</span></span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </Card>
            ))}
          </div>
          <div className="stack">
            <Card title={t('Objective')}><p className="small">{tx(m.objective, lang)}</p><p className="small"><span className="strong">{t('Trigger')}: </span>{tx(m.trigger, lang)}</p><p className="small" style={{ margin: 0 }}><span className="strong">{t('Terminal event')}: </span>{tx(m.terminal, lang)}</p></Card>
            <Card title={t('KPIs of this process')}>{data.kpis.length ? <ul className="list small">{data.kpis.map(k => <li key={k.id}><Link to="/kpis">{k.code}</Link> — {tx(k.name, lang)} <span className="muted ltr">({k.target_text})</span></li>)}</ul> : <p className="small muted">{t('No KPI linked.')}</p>}</Card>
          </div>
        </div>
      )}
      {tab === 'sipoc' && <Card><Sipoc sipoc={m.sipoc} lang={lang} t={t} /><p className="caption">{t('SIPOC of the macro process as defined in the process design (D01).')}</p></Card>}
      {tab === 'diagram' && <Card><Bpmn projectId={projectId} mpId={m.id} code={m.code} /></Card>}
      {tab === 'racsi' && (
        <Card>
          <Table rows={data.racsi.map((a, i) => ({ id: i, ...a }))} columns={[{ key: 'name', label: t('Activity'), render: a => tx(a.name, lang) }, ...['R', 'A', 'C', 'S', 'I'].map(Lt => ({ key: Lt, label: Lt, sortable: false, render: a => a.assignments.filter(x => x.letter === Lt).map(x => tx(x.roleName, lang)).join(', ') }))]} />
          <p className="caption">{t('R responsible, A accountable (exactly one), C consulted, S support, I informed.')}</p>
        </Card>
      )}
      {tab === 'gov' && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <Card title={t('Business rules')}>{data.rules.length ? <ul className="list small">{data.rules.map(r => <li key={r.id}><span className="strong">{r.id}</span> · {L(r.type)}<br />{tx(r.condition, lang)} → <span className="muted">{tx(r.action, lang)}</span></li>)}</ul> : <p className="small muted">{t('No rule on this process.')}</p>}</Card>
          <Card title={t('Controls')}>{data.controls.length ? <ul className="list small">{data.controls.map(c => <li key={c.id}><span className="strong">{c.id}</span> · {L(c.coso)}<br />{tx(c.name, lang)}</li>)}</ul> : <p className="small muted">{t('No control on this process.')}</p>}</Card>
          <Card title={t('AI use cases')}>{data.aiUseCases.length ? <ul className="list small">{data.aiUseCases.map(a => <li key={a.id}><span className="strong">{a.id}</span> · {L(a.tier)}<br />{tx(a.name, lang)}<br /><span className="muted">{tx(a.checkpoint, lang)}</span></li>)}</ul> : <p className="small muted">{t('No AI use case on this process.')}</p>}</Card>
        </div>
      )}
    </>
  );
}
