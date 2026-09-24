import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Gavel, Send } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { post, download } from '../lib/api.js';
import { PageHeader, Card, CardHead, useFetch, Skeleton, ErrorNote, StatusBadge, Button, Field, Input, Textarea, Kpi, Segmented, Check, DataTable, useToast, fmtDate, fmtNum, Badge, Modal } from '../components/ui.jsx';
import AiSuggest from '../components/AiSuggest.jsx';
import RexForm from '../components/RexForm.jsx';
import { ItemsEditor } from './ChecklistTemplates.jsx';
import { Select } from '../components/ui.jsx';

// Add items to an open gate checklist: from the template library (templates of this gate and track first) or typed here.
function AddToChecklist({ g, onAdded }) {
  const { t } = useI18n();
  const { can } = useAuth();
  const toast = useToast();
  const tpls = useFetch('/checklist-templates');
  const [mode, setMode] = useState('template');
  const [tid, setTid] = useState('');
  const [items, setItems] = useState([{ text: '', mandatory: 0, evidence_required: 0 }]);
  const [save, setSave] = useState(null);
  if (!tpls.data) return null;
  const track = g.project.track;
  const sorted = [...tpls.data].sort((a, b) => (b.gate === g.gate && b.track === track) - (a.gate === g.gate && a.track === track));
  const chosen = tpls.data.find((x) => String(x.id) === String(tid));
  const add = async () => {
    try {
      const r = mode === 'template' ? await post(`/gates/${g.id}/checklist/from-template`, { templateId: Number(tid) }) : await post(`/gates/${g.id}/checklist`, { items: items.filter((i) => i.text.trim()) });
      toast.ok(t('{n} items added{s}.', { n: r.added, s: r.skipped ? t(' ({n} already in the checklist)', { n: r.skipped }) : '' }));
      setTid(''); setItems([{ text: '', mandatory: 0, evidence_required: 0 }]); onAdded();
    } catch (e) { toast.err(e); }
  };
  return (
    <Card>
      <CardHead title={t('Add to this checklist')} subtitle={t('From the checklist template library, or item by item. Items already in the checklist are not added twice.')}
        actions={can('checklist.template.manage') && <Button size="sm" onClick={() => setSave({ name: `${g.project.code} ${g.gate} checklist`, auto_apply: false })}>{t('Save as template')}</Button>} />
      <div className="stack">
        <Segmented label={t('Add from')} value={mode} onChange={setMode} options={[{ value: 'template', label: t('From a template') }, { value: 'manual', label: t('Manually') }]} />
        {mode === 'template' ? (
          <>
            <Field label={t('Template')} hint={t('Templates of gate {g} on the {tr} Track are listed first.', { g: g.gate, tr: t(track) })}>
              <Select value={tid} onChange={(e) => setTid(e.target.value)} placeholder={t('Choose a template')} options={sorted.map((x) => ({ value: x.id, label: `${x.gate} · ${t(`${x.track} Track`)} · ${x.name} (${x.items.length})` }))} />
            </Field>
            {chosen && <ul className="list-plain small">{chosen.items.slice(0, 12).map((i, k) => <li key={k}>{i.text} {i.mandatory ? <Badge tone="dark">{t('Mandatory')}</Badge> : null}</li>)}{chosen.items.length > 12 && <li className="muted">{t('and {n} more', { n: chosen.items.length - 12 })}</li>}</ul>}
          </>
        ) : <ItemsEditor items={items} onChange={setItems} />}
        <div><Button variant="primary" disabled={mode === 'template' ? !tid : !items.some((i) => i.text.trim())} onClick={add}>{t('Add to checklist')}</Button></div>
      </div>
      {save && (
        <Modal title={t('Save this checklist as a template')} subtitle={t('The template keeps the items of this checklist for gate {g} on the {tr} Track.', { g: g.gate, tr: t(track) })} onClose={() => setSave(null)}
          footer={<><Button onClick={() => setSave(null)}>{t('Cancel')}</Button><Button variant="primary" disabled={!save.name.trim()} onClick={async () => { try { await post(`/gates/${g.id}/checklist/save-as-template`, save); toast.ok(t('Template saved in the library.')); setSave(null); tpls.reload(); } catch (e) { toast.err(e); } }}>{t('Save')}</Button></>}>
          <div className="form-grid">
            <Field label={t('Name')} required full><Input value={save.name} onChange={(e) => setSave({ ...save, name: e.target.value })} /></Field>
            <Field full><Check label={t('Link to the gate: copy these items into the checklist every time this gate opens on this track')} checked={save.auto_apply} onChange={(e) => setSave({ ...save, auto_apply: e.target.checked })} /></Field>
          </div>
        </Modal>
      )}
    </Card>
  );
}

export default function Gate() {
  const { id } = useParams();
  const { t } = useI18n();
  const { me, can, feature } = useAuth();
  const toast = useToast();
  const { data: g, error, reload } = useFetch(`/gates/${id}`);
  const [d, setD] = useState({ decision: 'Go', rationale: '', hold_until: '', recycle_tasks: [], next_path: '', votes_for: '', votes_against: '' });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [rex, setRex] = useState(false);
  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  if (!g) return <div className="page"><Skeleton h={500} /></div>;
  const isOwner = g.project.owner_id === me.user.id;
  const canDecide = g.status === 'Submitted' && can('gate.decide') && !isOwner;
  const mand = g.items.filter((i) => i.mandatory);
  const mandOk = mand.filter((i) => ['Complete', 'Waived'].includes(i.status)).length;
  const workTasks = g.tasks.filter((x) => x.kind === 'work');
  const decide = async () => {
    setBusy(true); setErr(null);
    try {
      const votes = d.votes_for !== '' || d.votes_against !== '' ? { for: Number(d.votes_for || 0), against: Number(d.votes_against || 0) } : undefined;
      const r = await post(`/gates/${g.id}/decide`, { decision: d.decision, rationale: d.rationale, hold_until: d.hold_until || undefined, recycle_tasks: d.recycle_tasks, next_path: d.next_path || undefined, votes });
      toast.ok(r.started?.length ? t('Decision recorded. Started: {e}.', { e: r.started.join(', ') }) : t('Decision recorded: {d}.', { d: t(d.decision) }));
      if (r.rexPrompt && can('rex.manage')) setRex(true);
      reload();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  const outcomeHelp = { Go: 'The project proceeds; the next E2E process starts.', Kill: 'The project stops; resources are released and lessons learned are recorded.', Hold: 'The project pauses; a re-review date is set.', Recycle: 'The project returns to named earlier tasks to close evidence gaps, then comes back to this gate.' };
  return (
    <div className="page">
      <PageHeader eyebrow={`${t('Gate {g}', { g: g.gate })} · ${g.run.e2e_id} ${t(g.run.name)}${g.cycle > 1 ? ` · ${t('Cycle {n}', { n: g.cycle })}` : ''}`}
        title={t(g.reference.question)} subtitle={<Link to={`/projects/${g.project.id}`}>{g.project.code} {g.project.name} · {t(`${g.project.track} Track`)}</Link>}
        actions={<><StatusBadge value={g.status} />{g.decision && <StatusBadge value={g.decision} />}
          {can('report.export') && <Button onClick={() => download('/reports/RPT-02/export/pdf')}>{t('Gate review pack (PDF)')}</Button>}</>} />
      <div className="grid kpis" style={{ marginBottom: 24 }}>
        <Kpi value={`${mandOk}/${mand.length}`} label={t('Mandatory items complete or waived')} />
        <Kpi value={fmtNum(g.kpis.npv)} label={t('NPV (kUSD)')} neutral />
        <Kpi value={g.kpis.roi != null ? `${g.kpis.roi}%` : '—'} label={t('ROI')} neutral />
        <Kpi value={`${workTasks.filter((x) => ['Done', 'Skipped'].includes(x.status)).length}/${workTasks.length}`} label={t('Work tasks closed')} neutral />
      </div>
      <div className="grid two">
        <div className="stack">
          <Card>
            <CardHead title={t('Minimum evidence for {g}', { g: g.gate })} subtitle={t(g.reference.evidence)} />
            <DataTable filterable={false} rows={g.items} pageSize={60} columns={[
              { key: 'seq', label: '#', num: true }, { key: 'text', label: t('Checklist item'), render: (i) => <>{t(i.text)} {i.mandatory ? <Badge tone="dark">{t('Mandatory')}</Badge> : null}</> },
              { key: 'evidence', label: t('Evidence'), render: (i) => <span className="xs">{i.evidence || i.waiver_reason || '—'}{i.files.length ? ` · ${i.files.length} ${t('file(s)')}` : ''}</span> },
              { key: 'source', label: t('Source'), render: (i) => <span className="xs muted">{t(i.source || '')}</span> },
              { key: 'status', label: t('Status'), render: (i) => <StatusBadge value={i.status} /> },
            ]} />
          </Card>
          {['Open', 'On hold'].includes(g.status) && can('checklist.edit') && <AddToChecklist g={g} onAdded={reload} />}
          <Card>
            <CardHead title={t('Task results')} />
            <ul className="list-plain">
              {g.tasks.map((x) => <li key={x.id}><div className="row between"><Link to={`/tasks/${x.id}`}>{x.uft_id} · {t(x.name)}</Link><StatusBadge value={x.status} /></div>{x.output && <div className="xs muted pre">{x.output}</div>}</li>)}
            </ul>
          </Card>
        </div>
        <div className="stack">
          {g.status === 'Submitted' && (
            <Card className="tint">
              <CardHead title={t('Record the gate decision')} subtitle={t('Performed by the Executive Sponsor, owned by the Gate Review Board. The project owner cannot decide (CTL-01).')} />
              {isOwner && <div className="callout bad" style={{ marginBottom: 12 }}>{t('You own this project, so you cannot record its gate decision (CTL-01).')}</div>}
              {!can('gate.decide') && <div className="callout neutral" style={{ marginBottom: 12 }}>{t('Only Gate Review Board members and Executive Sponsors can record decisions.')}</div>}
              {canDecide && (
                <div className="stack">
                  <Segmented label={t('Decision')} value={d.decision} onChange={(v) => setD({ ...d, decision: v })} options={['Go', 'Kill', 'Hold', 'Recycle'].map((v) => ({ value: v, label: t(v) }))} />
                  <p className="small" style={{ margin: 0 }}>{t(outcomeHelp[d.decision])}</p>
                  {d.decision === 'Go' && g.gate === 'T5' && (
                    <Field label={t('Next path (E2E-08)')} required>
                      <Segmented label={t('Next path')} value={d.next_path} onChange={(v) => setD({ ...d, next_path: v })} options={[{ value: 'A', label: t('Relaunch (Branch A)') }, ...(g.project.track === 'Full' ? [{ value: 'B', label: t('Retire (Branch B)') }] : [])]} />
                    </Field>
                  )}
                  {d.decision === 'Hold' && <Field label={t('Re-review date')} required><Input type="date" value={d.hold_until} onChange={(e) => setD({ ...d, hold_until: e.target.value })} /></Field>}
                  {d.decision === 'Recycle' && (
                    <Field label={t('Tasks to rework')} hint={t('Leave empty to rework all work tasks except the first.')}>
                      <div className="stack tight">{workTasks.map((x) => <Check key={x.uft_id} label={`${x.uft_id} ${t(x.name)}`} checked={d.recycle_tasks.includes(x.uft_id)} onChange={(e) => setD({ ...d, recycle_tasks: e.target.checked ? [...d.recycle_tasks, x.uft_id] : d.recycle_tasks.filter((u) => u !== x.uft_id) })} />)}</div>
                    </Field>
                  )}
                  <Field label={t('Rationale')} required hint={t('Recorded with the decision (MP-121 task 11).')}><Textarea value={d.rationale} onChange={(e) => setD({ ...d, rationale: e.target.value })} /></Field>
                  <div className="form-grid">
                    <Field label={t('Board votes for')}><Input type="number" min="0" value={d.votes_for} onChange={(e) => setD({ ...d, votes_for: e.target.value })} /></Field>
                    <Field label={t('Board votes against')} hint={t('A vote that is not unanimous is escalated (BR-008).')}><Input type="number" min="0" value={d.votes_against} onChange={(e) => setD({ ...d, votes_against: e.target.value })} /></Field>
                  </div>
                  <ErrorNote error={err} />
                  <Button variant="primary" icon={Gavel} busy={busy} disabled={!d.rationale.trim() || (d.decision === 'Hold' && !d.hold_until) || (d.decision === 'Go' && g.gate === 'T5' && !d.next_path)} onClick={decide}>{t('Record decision')}</Button>
                </div>
              )}
            </Card>
          )}
          {g.status === 'Open' && (
            <Card>
              <CardHead title={t('Gate not yet submitted')} subtitle={t('Complete the work tasks and the checklist, then submit the gate.')} />
              <ErrorNote error={err} />
              {can('gate.submit') && <Button variant="primary" icon={Send} onClick={async () => { setErr(null); try { await post(`/gates/${g.id}/submit`); toast.ok(t('Gate submitted.')); reload(); } catch (e) { setErr(e); } }}>{t('Submit gate for decision')}</Button>}
            </Card>
          )}
          {g.decision && (
            <Card>
              <CardHead title={t('Decision record')} />
              <dl className="kv">
                <dt>{t('Decision')}</dt><dd><StatusBadge value={g.decision} /></dd><dt>{t('Decided')}</dt><dd>{fmtDate(g.decided_at)}</dd>
                <dt>{t('Rationale')}</dt><dd>{g.rationale}</dd>{g.hold_until && <><dt>{t('Re-review date')}</dt><dd>{fmtDate(g.hold_until)}</dd></>}
                {g.next_path && <><dt>{t('Next path')}</dt><dd>{t(g.next_path === 'A' ? 'Relaunch (Branch A)' : 'Retire (Branch B)')}</dd></>}
                {g.votes && <><dt>{t('Votes')}</dt><dd>{t('{f} for, {a} against', { f: g.votes.for, a: g.votes.against })}</dd></>}
                {g.recycle_tasks?.length > 0 && <><dt>{t('Reworked tasks')}</dt><dd>{g.recycle_tasks.join(', ')}</dd></>}
              </dl>
            </Card>
          )}
          {feature('ai') && can('ai.use') && (
            <Card><CardHead title={t('Gate readiness (advisory)')} subtitle={t('AIUC-12. The board decides; the assessment only summarizes the evidence.')} /><AiSuggest projectId={g.project.id} recordType="gate_review" recordId={g.id} preferred={['AIUC-12']} /></Card>
          )}
        </div>
      </div>
      {rex && <RexForm projectId={g.project.id} defaultTitle={`${g.project.code}: ${g.decision === 'Kill' ? t('Kill at {g}', { g: g.gate }) : t('Closure at {g}', { g: g.gate })}`} processTag="MP-121" onClose={() => setRex(false)} />}
    </div>
  );
}
