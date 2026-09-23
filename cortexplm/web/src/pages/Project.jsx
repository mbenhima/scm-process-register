import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Play, Megaphone, Pencil, Lightbulb, Check, Circle, CircleDot, MinusCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { post, put, del } from '../lib/api.js';
import {
  PageHeader, Card, CardHead, Tabs, useFetch, Skeleton, ErrorNote, StatusBadge, Button, Kpi, DataTable, Modal, Field, Input, Textarea, Select,
  useToast, JustifyModal, Badge, fmtDate, fmtNum, Progress,
} from '../components/ui.jsx';
import { Radar } from '../components/charts.jsx';
import AiSuggest from '../components/AiSuggest.jsx';
import RexForm from '../components/RexForm.jsx';

const TRACK_E2E = {
  Full: ['E2E-01', 'E2E-02', 'E2E-03', 'E2E-04', 'E2E-05', 'E2E-06', 'E2E-07', 'E2E-08', 'E2E-09'],
  Light: ['E2E-01', 'E2E-02', 'E2E-03', 'E2E-04', 'E2E-05', 'E2E-07', 'E2E-08', 'E2E-09'],
  Fast: ['E2E-01', 'E2E-02', 'E2E-05'],
};

export function TaskState({ status }) {
  if (status === 'Done') return <span className="state-dot done" title={status}><Check aria-hidden /></span>;
  if (status === 'In progress') return <span className="state-dot progress" title={status}><CircleDot aria-hidden /></span>;
  if (status === 'Skipped' || status === 'Cancelled') return <span className="state-dot skipped" title={status}><MinusCircle aria-hidden /></span>;
  return <span className="state-dot" title={status}><Circle aria-hidden style={{ opacity: 0 }} /></span>;
}

function RunCard({ run, project, onChanged }) {
  const { t } = useI18n();
  const { can } = useAuth();
  const toast = useToast();
  const g = run.gate;
  const workOpen = run.tasks.filter((x) => x.kind !== 'gate' && !['Done', 'Skipped'].includes(x.status)).length;
  const submit = async () => { try { await post(`/gates/${g.id}/submit`); toast.ok(t('Gate {g} submitted to the Gate Review Board.', { g: g.gate })); onChanged(); } catch (e) { toast.err(e); } };
  const done = run.tasks.filter((x) => ['Done', 'Skipped'].includes(x.status)).length;
  return (
    <Card className="flush">
      <div style={{ padding: 20 }} className="row between">
        <div>
          <div className="eyebrow">{run.e2e_id}{run.run_no > 1 ? ` · ${t('run {n}', { n: run.run_no })}` : ''}{run.branch ? ` · ${t(run.branch === 'A' ? 'Branch A (relaunch)' : 'Branch B (retirement)')}` : ''}</div>
          <h3>{t(run.name)}</h3>
          <div className="xs muted">{t(run.trigger_note || '')} {run.scheduled_start && run.status === 'Scheduled' ? `· ${t('Starts on {d}', { d: fmtDate(run.scheduled_start) })}` : ''}</div>
        </div>
        <div className="row"><StatusBadge value={run.status} /><div style={{ width: 120 }}><Progress value={(done / run.tasks.length) * 100} label={t('Tasks done')} /></div><span className="xs num">{done}/{run.tasks.length}</span></div>
      </div>
      <div>
        {run.tasks.map((x) => (
          <Link key={x.id} to={`/tasks/${x.id}`} className="task-row">
            <TaskState status={x.status} />
            <div>
              <div className="title">{x.uft_id} · {t(x.name)} {x.light_form ? <Badge>{t('Light form (R1)')}</Badge> : null} {x.data?.r2Skippable && x.status === 'To do' ? <Badge>{t('Skippable (R2)')}</Badge> : null}</div>
              <div className="xs muted">{t('Owner')}: {x.owner_name || '—'} · {t('Evaluator')}: {x.evaluator_name || '—'} · {t('Due')} {fmtDate(x.due_date)}{x.evaluation ? ` · ${t(x.evaluation.verdict)}` : ''}</div>
            </div>
            <StatusBadge value={x.status} />
          </Link>
        ))}
      </div>
      {g && (
        <div className="row between" style={{ padding: 20, borderTop: '1px solid var(--pa-grey-line)', background: 'var(--pa-grey-light)' }}>
          <div className="row"><strong className="strong">{t('Gate {g}', { g: g.gate })}</strong><StatusBadge value={g.status} />{g.decision && <StatusBadge value={g.decision} />}{g.cycle > 1 && <Badge>{t('Cycle {n}', { n: g.cycle })}</Badge>}</div>
          <div className="row">
            {g.status === 'Open' && can('gate.submit') && project.status === 'Active' && <Button variant="primary" onClick={submit} disabled={workOpen > 0} title={workOpen ? t('Complete the open tasks first') : undefined}>{t('Submit gate for decision')}</Button>}
            <Link to={`/gates/${g.id}`}>{t('Open gate review')}</Link>
          </div>
        </div>
      )}
    </Card>
  );
}

function EditProject({ p, onClose, onSaved }) {
  const { t } = useI18n();
  const toast = useToast();
  const people = useFetch('/directory');
  const [f, setF] = useState({ name: p.name, description: p.description || '', planned_launch_date: p.planned_launch_date || '', region: p.region || '', owner_id: p.owner_id || '', sponsor_id: p.sponsor_id || '' });
  const [justify, setJustify] = useState(false);
  const save = async (justification) => { try { await put(`/projects/${p.id}`, { ...f, justification }); toast.ok(t('Project updated.')); onSaved(); onClose(); } catch (e) { toast.err(e); } };
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  if (justify) return <JustifyModal onCancel={() => setJustify(false)} onConfirm={save} />;
  return (
    <Modal title={t('Edit project')} onClose={onClose} footer={<><Button onClick={onClose}>{t('Cancel')}</Button><Button variant="primary" onClick={() => setJustify(true)}>{t('Continue')}</Button></>}>
      <div className="form-grid">
        <Field label={t('Project name')} full><Input value={f.name} onChange={set('name')} /></Field>
        <Field label={t('Description')} full><Textarea value={f.description} onChange={set('description')} /></Field>
        <Field label={t('Planned launch date')}><Input type="date" value={f.planned_launch_date} onChange={set('planned_launch_date')} /></Field>
        <Field label={t('Region')}><Input value={f.region} onChange={set('region')} /></Field>
        <Field label={t('Product Manager (owner)')}><Select value={f.owner_id} onChange={set('owner_id')} options={(people.data || []).filter((x) => x.roles.includes('R03')).map((x) => ({ value: x.id, label: x.name }))} /></Field>
        <Field label={t('Executive Sponsor')}><Select value={f.sponsor_id} onChange={set('sponsor_id')} placeholder={t('Choose')} options={(people.data || []).filter((x) => x.roles.includes('R01')).map((x) => ({ value: x.id, label: x.name }))} /></Field>
      </div>
    </Modal>
  );
}

function Tailoring({ p }) {
  const { t } = useI18n();
  const toast = useToast();
  const { can } = useAuth();
  const { data, reload } = useFetch(`/projects/${p.id}/mps`);
  const [pending, setPending] = useState(null);
  const [filter, setFilter] = useState('');
  const change = async (mp, state, justification) => { try { await put(`/projects/${p.id}/mps/${mp}`, { state, justification }); toast.ok(t('Tailoring updated.')); reload(); } catch (e) { toast.err(e); } };
  if (!data) return <Skeleton />;
  const counts = data.reduce((a, m) => ({ ...a, [m.state]: (a[m.state] || 0) + 1 }), {});
  return (
    <Card>
      <p className="muted">{t('Mandatory {m} · Selected {s} · Optional {o} · Not activated {n} · Deselected {d}. Deselecting a mandatory process or activating a not-activated one needs a justification and executive approval (BR-011).',
        { m: counts.Mandatory || 0, s: counts.Selected || 0, o: counts.Optional || 0, n: counts['Not activated'] || 0, d: counts.Deselected || 0 })}</p>
      <DataTable csvName={`${p.code}_tailoring`} rows={data.filter((m) => !filter || m.state === filter)} pageSize={80}
        toolbar={<Select aria-label={t('State')} value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t('All states')} options={['Mandatory', 'Selected', 'Optional', 'Not activated', 'Deselected'].map((s) => ({ value: s, label: t(s) }))} style={{ width: 'auto' }} />}
        columns={[
          { key: 'mp_id', label: t('Macro process'), render: (m) => <Link to={`/library/${m.mp_id}`}>{m.mp_id} {t(m.name)}</Link>, csv: (m) => `${m.mp_id} ${m.name}` },
          { key: 'category', label: t('Category'), render: (m) => t(m.category) },
          { key: 'trackDefault', label: t('Track default'), render: (m) => t(m.trackDefault) },
          { key: 'state', label: t('State'), render: (m) => <StatusBadge value={m.state} /> },
          { key: 'justification', label: t('Justification'), render: (m) => <span className="xs">{m.justification || '—'}{m.approver ? ` · ${t('approved by')} ${m.approver}` : ''}</span> },
          { key: 'act', label: '', sortable: false, noCsv: true, render: (m) => can('project.edit') && p.status === 'Active' && (
            m.state === 'Optional' || m.state === 'Deselected' ? <Button size="sm" onClick={() => (m.state === 'Deselected' ? setPending({ mp: m.mp_id, state: 'Mandatory' }) : change(m.mp_id, 'Selected'))}>{t(m.state === 'Deselected' ? 'Restore' : 'Select')}</Button>
              : m.state === 'Selected' ? <Button size="sm" onClick={() => change(m.mp_id, 'Optional')}>{t('Remove')}</Button>
                : m.state === 'Mandatory' ? <Button size="sm" variant="danger" onClick={() => setPending({ mp: m.mp_id, state: 'Deselected' })}>{t('Deselect')}</Button>
                  : <Button size="sm" onClick={() => setPending({ mp: m.mp_id, state: 'Selected' })}>{t('Request activation')}</Button>) },
        ]} />
      {pending && <JustifyModal title={t('Justify the tailoring change for {mp}', { mp: pending.mp })} onCancel={() => setPending(null)} onConfirm={async (j) => { await change(pending.mp, pending.state, j); setPending(null); }} />}
    </Card>
  );
}

function AiOverrides({ p }) {
  const { t } = useI18n();
  const toast = useToast();
  const { data, reload } = useFetch(`/ai/use-cases?project=${p.id}`);
  if (!data) return null;
  return (
    <DataTable csvName={`${p.code}_ai_overrides`} rows={data} pageSize={30} columns={[
      { key: 'code', label: t('Code') }, { key: 'name', label: t('Use case'), render: (u) => t(u.name) }, { key: 'tier', label: t('Tier'), render: (u) => <StatusBadge value={u.tier} /> },
      { key: 'active', label: t('Organization'), render: (u) => <StatusBadge value={u.active ? 'On' : 'Off'} /> },
      { key: 'override', label: t('This project'), render: (u) => (
        <Select aria-label={t('Override')} value={u.override} onChange={async (e) => { try { await put(`/ai/use-cases/${u.id}/override/${p.id}`, { state: e.target.value }); reload(); } catch (err) { toast.err(err); } }}
          options={['Inherit', 'On', 'Off'].map((s) => ({ value: s, label: t(s) }))} style={{ width: 'auto' }} />) },
      { key: 'effective', label: t('Effective'), render: (u) => <StatusBadge value={u.effective ? 'On' : 'Off'} /> },
    ]} />
  );
}

export default function Project() {
  const { id } = useParams();
  const { t } = useI18n();
  const { can, feature } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [tab, setTab] = useState('lifecycle');
  const [edit, setEdit] = useState(false);
  const [rex, setRex] = useState(false);
  const { data: p, error, reload } = useFetch(`/projects/${id}`);
  const audit = useFetch(tab === 'history' ? `/audit?entity_type=project&entity_id=${id}` : null);
  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  if (!p) return <div className="page"><Skeleton h={500} /></div>;
  const runsOf = (e) => p.runs.filter((r) => r.e2e_id === e);
  const act = async (fn, msg) => { try { await fn(); toast.ok(msg); reload(); } catch (e) { toast.err(e); } };
  const hasCampaign = p.runs.some((r) => r.e2e_id === 'E2E-09' && r.status === 'In progress');
  const closed = ['Killed', 'Retired', 'Launched'].includes(p.status);
  const active = p.runs.filter((r) => ['In progress', 'Scheduled'].includes(r.status));
  const history = p.runs.filter((r) => !['In progress', 'Scheduled'].includes(r.status)).reverse();
  return (
    <div className="page">
      <PageHeader eyebrow={`${p.code} · ${t(`${p.track} Track`)} · ${t(p.offer_type)}`} title={p.name} subtitle={p.description}
        actions={<>
          <StatusBadge value={p.status} />
          {p.status === 'On Hold' && can('project.edit') && <Button icon={Play} onClick={() => act(() => post(`/projects/${p.id}/resume`), t('Project resumed.'))}>{t('Resume project')}</Button>}
          {p.status === 'Active' && p.track !== 'Fast' && !hasCampaign && can('project.edit') && <Button icon={Megaphone} onClick={() => act(() => post(`/projects/${p.id}/campaign`), t('E2E-09 campaign stream started.'))}>{t('Start market campaign (E2E-09)')}</Button>}
          {can('project.edit') && <Button icon={Pencil} onClick={() => setEdit(true)}>{t('Edit')}</Button>}
          {can('rex.manage') && <Button icon={Lightbulb} onClick={() => setRex(true)}>{t('Add lesson learned')}</Button>}
          {can('project.delete') && <Button variant="danger" icon={Trash2} onClick={() => { if (window.confirm(t('Delete this project and all its runs? This cannot be undone.'))) act(async () => { await del(`/projects/${p.id}`); nav('/projects'); }, t('Project deleted.')); }}>{t('Delete')}</Button>}
        </>} />
      {p.status === 'On Hold' && <div className="callout warn" style={{ marginBottom: 16 }}>{t('On hold until {d}. Resume the project to re-open the gate for review.', { d: fmtDate(p.hold_until) })}</div>}
      {closed && <div className="callout neutral" style={{ marginBottom: 16 }}>{t('This project is {s} since {d}.', { s: t(p.status), d: fmtDate(p.closed_at) })} {p.status === 'Launched' && p.track === 'Fast' ? t('Fast Track ends at T3; performance and retirement follow the parent product lifecycle (Rule R3).') : ''}</div>}
      <div className="chain" style={{ marginBottom: 24 }} aria-label={t('Lifecycle')}>
        {TRACK_E2E.Full.map((e) => {
          const runs = runsOf(e); const inTrack = TRACK_E2E[p.track].includes(e);
          const cls = !inTrack ? 'off' : runs.some((r) => ['In progress', 'Scheduled'].includes(r.status)) ? 'current' : runs.some((r) => r.status === 'Completed') ? 'done' : '';
          return (
            <Link key={e} to={`/e2e/${e}`} className={`step ${cls}`}>
              <strong>{e}</strong>
              <span>{runs.length ? t('{n} run(s)', { n: runs.length }) : inTrack ? t('Not started') : t('Not in track')}</span>
            </Link>
          );
        })}
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[
        { value: 'lifecycle', label: t('Lifecycle & tasks') }, { value: 'case', label: t('Business case & risks') }, { value: 'tailoring', label: t('Tailoring') },
        ...(feature('ai') ? [{ value: 'ai', label: t('AI assistance') }] : []), { value: 'rex', label: t('Lessons learned') }, ...(can('audit.view') ? [{ value: 'history', label: t('History') }] : []),
      ]} />
      {tab === 'lifecycle' && (
        <div className="stack">
          {active.map((r) => <RunCard key={r.id} run={r} project={p} onChanged={reload} />)}
          {history.length > 0 && <h3 style={{ marginTop: 16 }}>{t('Completed and closed runs')}</h3>}
          {history.map((r) => <RunCard key={r.id} run={r} project={p} onChanged={reload} />)}
        </div>
      )}
      {tab === 'case' && (
        <div className="grid two">
          <div className="stack">
            <div className="grid kpis">
              <Kpi value={fmtNum(p.npv)} label={t('NPV (kUSD)')} meta="ACT-02" />
              <Kpi value={p.roi != null ? `${p.roi}%` : '—'} label={t('ROI')} />
              <Kpi value={p.payback_years ?? '—'} label={t('Payback (years)')} neutral />
              <Kpi value={p.strategic_fit ?? '—'} label={t('Strategic-fit score')} meta="BR-001" neutral />
            </div>
            <Card>
              <CardHead title={t('Project risks')} />
              <DataTable filterable={false} rows={p.risks} columns={[
                { key: 'code', label: t('Code') }, { key: 'name', label: t('Risk') }, { key: 'likelihood', label: t('Likelihood'), num: true }, { key: 'impact', label: t('Impact'), num: true },
                { key: 'score', label: t('Score'), num: true, render: (r) => r.likelihood * r.impact }, { key: 'status', label: t('Status'), render: (r) => <StatusBadge value={r.status} /> },
              ]} empty={t('No project risk recorded yet. It is created by "Assess Risks & Compliance".')} />
            </Card>
          </div>
          <Card>
            <CardHead title={t('Complexity profile')} subtitle={t('Total {n} of 35 · recommended {r}', { n: p.score_total, r: t(`${p.recommended_track} Track`) })} />
            <Radar axes={Object.keys(p.scores).map((k) => t(k))} values={Object.values(p.scores)} reference={Object.keys(p.scores).map(() => 3)} primaryLabel={t('This project')} referenceLabel={t('Medium (3)')} caption={t('Complexity scores recorded at creation (UFS-28).')} />
            {p.track_override_reason && <div className="callout neutral" style={{ marginTop: 12 }}>{t('Track override')}: {p.track_override_reason}</div>}
            <dl className="kv" style={{ marginTop: 16 }}>
              <dt>{t('Owner')}</dt><dd>{p.owner_name}</dd><dt>{t('Executive Sponsor')}</dt><dd>{p.sponsor_name || '—'}</dd><dt>{t('Department')}</dt><dd>{p.obs_name || '—'}</dd>
              <dt>{t('Region')}</dt><dd>{p.region || '—'}</dd><dt>{t('Planned launch date')}</dt><dd>{fmtDate(p.planned_launch_date)}</dd><dt>{t('Actual launch date')}</dt><dd>{fmtDate(p.actual_launch_date)}</dd>
            </dl>
          </Card>
        </div>
      )}
      {tab === 'tailoring' && <Tailoring p={p} />}
      {tab === 'ai' && (
        <div className="grid two">
          <Card><CardHead title={t('Ask for an AI suggestion')} subtitle={t('Suggestions are advisory. You decide what to keep.')} /><AiSuggest projectId={p.id} recordType="project" recordId={p.id} preferred={['AIUC-12', 'AIUC-20']} /></Card>
          <Card><CardHead title={t('AI use cases for this project')} subtitle={t('Inherit follows the organization setting; On or Off overrides it for this project only.')} /><AiOverrides p={p} /></Card>
        </div>
      )}
      {tab === 'rex' && (
        <Card>
          <DataTable csvName={`${p.code}_rex`} rows={p.rex} filterable={false} columns={[
            { key: 'created_at', label: t('Date'), render: (r) => fmtDate(r.created_at) }, { key: 'title', label: t('Title') }, { key: 'category', label: t('Category'), render: (r) => t(r.category) },
            { key: 'root_cause', label: t('Root cause') }, { key: 'recommendation', label: t('Recommendation') }, { key: 'rating', label: t('Rating'), num: true },
          ]} empty={t('No lessons learned yet.')} />
        </Card>
      )}
      {tab === 'history' && (audit.data ? <Card><DataTable csvName={`${p.code}_history`} rows={audit.data} columns={[
        { key: 'created_at', label: t('When'), render: (a) => a.created_at.slice(0, 16).replace('T', ' ') }, { key: 'user_name', label: t('Who') }, { key: 'action', label: t('Action') },
        { key: 'field', label: t('Field') }, { key: 'before_value', label: t('Before') }, { key: 'after_value', label: t('After') }, { key: 'justification', label: t('Justification') },
      ]} /></Card> : <Skeleton />)}
      {edit && <EditProject p={p} onClose={() => setEdit(false)} onSaved={reload} />}
      {rex && <RexForm projectId={p.id} defaultTitle={`${p.code} ${p.name}`} onClose={() => setRex(false)} onSaved={reload} />}
    </div>
  );
}
