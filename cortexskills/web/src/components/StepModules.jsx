// Panels of the steps that work on real data (SRS 1.9, step forms chosen by the meaning of the step): the questionnaire
// steps of E2E-33 show and change the project questionnaire itself — its questions, respondents, messages sent by
// e-mail or WhatsApp, responses, dataset and report — and the publishing steps generate their document, with its
// versions and its Word, PDF and Excel downloads, in the step.
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { post, download } from '../lib/api.js';
import { Btn, Icon, Card, Guard, Kpi, StatusPill, DataTable, useAction, Empty } from './ui.jsx';
import { Design, Respondents, Assignments, Channels, Responses, Dataset, Log } from '../pages/Questionnaires.jsx';

/** Documents of the step (a template code), each version with its downloads, and the related standard report. */
export function DocPanel({ projectId, code, report, readOnly, onChanged }) {
  const { t, L, fmtDate, lang } = useI18n(); const act = useAction(); const { can } = useSession();
  const d = useData(projectId ? `/projects/${projectId}/documents` : null, [projectId, code]);
  const gen = async () => { await act(() => post(`/projects/${projectId}/documents`, { doc_type: code, lang }), 'docs.generated'); d.reload(); onChanged?.(); };
  return (<Card flat title={t('stepdoc.title', { code })} actions={!readOnly && can('documents.manage') && <Btn size="sm" kind="primary" icon="FilePlus2" onClick={gen}>{t('stepdoc.generate')}</Btn>}>
    <Guard state={d}>{rows => { const docs = rows.filter(x => x.doc_type === code); return docs.length ? <DataTable search={false} rows={docs} columns={[
      { key: 'title', label: t('col.name'), render: r => <Link to={`/documents/${r.id}`}>{L(r.title) || r.title}</Link>, text: r => r.title },
      { key: 'version', label: t('col.version'), text: r => r.versionLabel || `${r.version}.${r.minor || 0}` }, { key: 'status', label: t('col.status'), render: r => <StatusPill value={r.status} /> },
      { key: 'lang', label: t('q.language'), text: r => String(r.lang || '').toUpperCase() }, { key: 'created_at', label: t('col.date'), text: r => fmtDate(r.created_at) },
      { key: 'dl', label: t('common.download'), noSort: true, render: r => <span className="row" style={{ flexWrap: 'nowrap', gap: 4 }}>{['docx', 'pdf', 'xlsx'].map(f => <Btn key={f} size="sm" kind="ghost" onClick={() => download(`/documents/${r.id}/download?format=${f}`, `${code}.${f}`)}>{f.toUpperCase()}</Btn>)}</span> }]} />
      : <p className="small muted">{t('stepdoc.none')}</p>; }}</Guard>
    <p className="xs muted">{t('stepdoc.versions')}</p>
    {report && <div className="row small" style={{ gap: 6 }}><Icon name="ChartColumn" size={14} />{t('stepdoc.report', { code: report })}{['pdf', 'docx', 'xlsx'].map(f => <Btn key={f} size="sm" kind="ghost" onClick={() => download(`/reports/${report}/export?format=${f}&project=${projectId}`, `${report}.${f}`)}>{f.toUpperCase()}</Btn>)}</div>}
  </Card>);
}

/** The project questionnaire as one panel of a step: header with its state, then the part the step works on. */
export function QuestionnaireStep({ module, questionnaireId, projectId, form, readOnly, onChanged }) {
  const { t, L, fmtNum } = useI18n(); const act = useAction(); const { can } = useSession();
  const d = useData(questionnaireId ? `/questionnaires/${questionnaireId}` : null, [questionnaireId]);
  if (!questionnaireId) return <Empty icon="ClipboardList" title={t('qstep.none')} text={t('qstep.noneText')} />;
  return (<Guard state={d}>{q => { const st = q.stats.total; const edit = !readOnly && can('m54.edit') && q.status !== 'Closed'; const reload = () => { d.reload(); onChanged?.(); };
    const blocking = q.issues.filter(i => ['aiUnvalidated', 'noAccountable', 'manyAccountable', 'noRespondents', 'noDueDate', 'assignEmpty'].includes(i.code));
    const items = (q.forms || []).flatMap(f => (f.sections || []).flatMap(s => s.items || []));
    return (<div className="stack qstep">
      <div className="row qstep-head"><Icon name="ClipboardList" /><span className="strong small">{L(q.label)}</span><StatusPill value={q.status} />
        <span className="xs muted">{t('qstep.summary', { forms: q.forms.length, q: items.length, r: st.invited, a: st.responded })}</span><span className="spacer" />
        <Link className="btn sm" to={`/questionnaires/${q.id}`}><Icon name="ExternalLink" size={14} />{t('qstep.open')}</Link></div>
      {(module === 'qdesign' || module === 'qvalidate') && <>
        <p className="small">{t(module === 'qdesign' ? 'qstep.designHint' : 'qstep.validateHint')}</p>
        <Design q={q} edit={edit} reload={reload} /></>}
      {module === 'qdistribute' && <>
        <ChannelState q={q} />
        <Respondents q={q} edit={!readOnly && can('m54.edit') && q.status !== 'Closed'} reload={reload} />
        <Assignments q={q} edit={!readOnly && can('m54.edit') && q.status !== 'Closed'} reload={reload} />
        {edit && ['Draft', 'Validated', 'Pending Validation'].includes(q.status) && <div className="row">
          {blocking.length > 0 && <span className="small field-error"><Icon name="CircleAlert" size={14} />{blocking.map(i => t('qissue.' + i.code, { ...i, form: i.form || '', section: i.section || '' })).join(' · ')}</span>}<span className="spacer" />
          <Btn kind="primary" icon="Send" disabled={blocking.length > 0} onClick={async () => { await act(() => post(`/questionnaires/${q.id}/distribute`), 'q.distributed'); reload(); }}>{t('qstep.distributeNow', { n: st.invited })}</Btn></div>}</>}
      {module === 'qremind' && <>
        <div className="grid g-3"><Kpi icon="Users" value={fmtNum(st.invited)} label={t('q.respondents')} emph={false} /><Kpi icon="Inbox" value={`${st.responseRate}%`} label={t('q.responseRate')} /><Kpi icon="Hourglass" value={fmtNum(Math.max(0, st.invited - st.responded))} label={t('qstep.waiting')} emph={false} /></div>
        {edit && q.status === 'Distributed' && <div className="row"><span className="small muted">{t('qstep.remindHint')}</span><span className="spacer" /><Btn kind="primary" icon="BellRing" onClick={async () => { const r = await act(() => post(`/questionnaires/${q.id}/remind-now`, {}), null); window.alert(t('qstep.reminded', { n: r.sent, f: r.failed })); reload(); }}>{t('qstep.remindNow')}</Btn></div>}
        <Channels q={q} edit={edit} reload={reload} /><Log q={q} /></>}
      {(module === 'qresponses' || module === 'qcomplete') && <>
        <div className="grid g-4"><Kpi icon="Users" value={fmtNum(st.invited)} label={t('q.respondents')} emph={false} /><Kpi icon="Inbox" value={`${st.responseRate}%`} label={t('q.responseRate')} note={t('q.respondedN', { n: st.responded, i: st.included })} />
          <Kpi icon="MousePointerClick" value={`${st.engagementRate}%`} label={t('q.engagementRate')} emph={false} /><Kpi icon="Gauge" value={`${st.completeness ?? 0}%`} label={t('q.completeness')} note={t('q.threshold', { n: q.threshold ?? 70 })} emph={false} /></div>
        <p className="small muted">{t(module === 'qresponses' ? 'qstep.responsesHint' : 'qstep.completeHint')}</p>
        <Responses q={q} edit={!readOnly && can('m54.edit')} /></>}
      {(module === 'qdataset' || module === 'qfeed') && <><p className="small muted">{t(module === 'qdataset' ? 'qstep.datasetHint' : 'qstep.feedHint', { at: q.fed_at ? q.fed_at.slice(0, 10) : '—', n: q.fed_needs || 0 })}</p><Dataset q={q} edit={!readOnly && can('m54.edit')} /></>}
      {module === 'qreport' && <>
        <div className="grid g-4"><Kpi icon="Inbox" value={`${st.responseRate}%`} label={t('q.responseRate')} /><Kpi icon="MousePointerClick" value={`${st.engagementRate}%`} label={t('q.engagementRate')} emph={false} /><Kpi icon="Gauge" value={`${st.completeness ?? 0}%`} label={t('q.completeness')} emph={false} /><Kpi icon="Users" value={fmtNum(st.responded)} label={t('q.respondedN', { n: st.responded, i: st.included })} emph={false} /></div>
        <div className="row"><Btn icon="Download" onClick={() => download(`/questionnaires/${q.id}/report?format=xlsx`, 'questionnaire.xlsx')}>{t('q.report')}</Btn></div>
        <DocPanel projectId={projectId} code={form.doc} report={form.report} readOnly={readOnly} onChanged={onChanged} /></>}
    </div>); }}</Guard>);
}

/** Whether e-mail and WhatsApp can really send for the Organization, with the link to set them up. */
function ChannelState({ q }) {
  const { t } = useI18n(); const { can } = useSession();
  return (<div className="row small channel-state">{(q.channelSettings || []).map(c => <span key={c.channel} className={`pill ${c.effective === 'sandbox' ? 's2' : 's4'}`}><Icon name={c.channel === 'email' ? 'Mail' : 'MessageCircle'} size={12} />{t('channel.' + c.channel)} · {t('channelMode.' + c.effective)}</span>)}
    <span className="xs muted">{t('qstep.channelHint')}</span>{can('config.view') && <Link className="btn sm" to="/admin/channels"><Icon name="Settings" size={14} />{t('q.channelSettings')}</Link>}</div>);
}

/** Documents of the process of a task: one panel per document template of that end-to-end process (FR-DA-DOC-10). */
export function ProcessDocs({ projectId, e2eId, readOnly }) {
  const { t, L } = useI18n(); const tp = useData('/document-templates');
  return (<Guard state={tp}>{list => { const mine = list.filter(x => (x.e2e || []).includes(e2eId) && x.status !== 'Retired');
    return mine.length ? <div className="stack">{mine.map(x => <div key={x.id}><p className="small strong">{x.code} — {L(x.name)}</p><DocPanel projectId={projectId} code={x.code} readOnly={readOnly} /></div>)}</div>
      : <Empty icon="FileText" title={t('stepdoc.noTemplate')} text={t('stepdoc.noTemplateText')} />; }}</Guard>);
}

/**
 * Live panel of a step of the diagnosis, plan, delivery or evaluation: the figures, tables and actions computed by the
 * server from the project's records (campaign answers, gaps, needs, sessions, invitations, scores, indicators). Each
 * table can be downloaded as CSV; each action (send, remind, compute) reloads the panel.
 */
export function FlowPanel({ taskId, stepId, readOnly, onChanged }) {
  const { t } = useI18n(); const act = useAction(); const { can, toast } = useSession();
  const d = useData(`/tasks/${taskId}/steps/${stepId}/panel`, [taskId, stepId]);
  const run = async key => { try { const r = await act(() => post(`/tasks/${taskId}/steps/${stepId}/actions/${key}`, {}), null); const n = r?.sent ?? r?.added; toast(n != null ? t('flow.sent', { n }) : t('flow.done')); } catch { /* shown by useAction */ } d.reload(); onChanged?.(); };
  return (<Guard state={d}>{p => (!p || (!p.kpis?.length && !p.tables?.length && !p.notes?.length && !p.actions?.length)) ? null : <div className="stack flow-panel">
    {(p.notes || []).map((n, i) => <p key={i} className="small muted pre-line">{n}</p>)}
    {p.kpis?.length > 0 && <div className="grid g-3">{p.kpis.map((k, i) => <Kpi key={i} value={String(k.value)} label={k.label} />)}</div>}
    {(p.tables || []).map((tb, i) => <div key={i} className="stack">
      <div className="row"><span className="strong small">{tb.title}</span><span className="spacer" />{tb.csv && tb.rows.length > 0 && <Btn size="sm" kind="ghost" icon="Download" onClick={() => download(`/tasks/${taskId}/steps/${stepId}/panel.csv?table=${i}`, `${stepId}.csv`)}>{t('flow.download')}</Btn>}</div>
      <div className="table-wrap"><table className="tbl"><thead><tr>{tb.columns.map(c => <th key={c[0]}>{c[1]}</th>)}</tr></thead>
        <tbody>{tb.rows.map((r, j) => <tr key={j}>{tb.columns.map(c => <td key={c[0]} className="small pre-line">{String(r[c[0]] ?? '')}</td>)}</tr>)}{!tb.rows.length && <tr><td colSpan={tb.columns.length} className="small muted">—</td></tr>}</tbody></table></div></div>)}
    {(p.links || []).map((l, i) => <p key={i} className="small"><Icon name="ExternalLink" size={14} /> <Link to={l.to}>{l.label}</Link></p>)}
    {!readOnly && can('tasks.execute') && p.actions?.length > 0 && <div className="row">{p.actions.map(a => <Btn key={a.key} size="sm" kind={a.primary ? 'primary' : undefined} icon={a.icon} onClick={() => run(a.key)}>{a.label}</Btn>)}</div>}
  </div>}</Guard>);
}
