// Questionnaire & Survey Management (SRS 4.36): campaigns built from the template library (Load), tailored by AI and
// validated by a person, or written manually; respondents ("who will respond") with their population and form;
// the channel plan of each respondent (Face-to-Face, Email, WhatsApp, Application, or a combination in sequence);
// reminders; responses with consent and completeness; consolidation feeding the needs analysis; the immutable log.
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { get, post, patch, put, del, download } from '../lib/api.js';
import { PageHead, Card, Guard, DataTable, StatusPill, Btn, Icon, Kpi, useAction, Modal, JustifyDialog, Field, Tabs, Seg, Empty, Progress, KV } from '../components/ui.jsx';
import { BarChart } from '../components/charts.jsx';
import { QForm, completeness } from '../components/QForm.jsx';

const CHANNELS = ['Face-to-Face', 'Email', 'WhatsApp', 'Application'];
const MODES = ['Face-to-Face', 'Email', 'WhatsApp', 'Application', 'Combination'];
const CH_ICON = { 'Face-to-Face': 'Users', Email: 'Mail', WhatsApp: 'MessageCircle', Application: 'MonitorSmartphone', Combination: 'Shuffle' };
export function ChannelChip({ ch }) { const { t } = useI18n(); return <span className="pill xs"><Icon name={CH_ICON[ch] || 'Circle'} size={12} />{t('qch.' + ch)}</span>; }
export function PlanSteps({ plan }) { const { t } = useI18n(); return <span className="plan-steps">{(plan || []).map((s, i) => <span key={i} className="plan-step" title={t('qplan.after', { n: s.after_days })}><Icon name={CH_ICON[s.channel]} size={12} />{t('qch.' + s.channel)}<span className="xs muted"> {t('qplan.dayShort', { n: s.after_days })}</span>{i < plan.length - 1 && <Icon name="ChevronRight" size={12} />}</span>)}</span>; }

// ------------------------------------------------------------------ list
export function Questionnaires() {
  const { t, L, fmtDate } = useI18n(); const { project, projects, setProject, can } = useSession(); const nav = useNavigate();
  const d = useData(project ? `/projects/${project}/questionnaires` : '/questionnaires'); const [create, setCreate] = useState(false);
  return (<>
    <PageHead eyebrow={t('q.eyebrow')} title={t('nav.questionnaires')} subtitle={t('q.subtitle')}>
      <Link className="btn" to="/questionnaires/templates"><Icon name="LibraryBig" />{t('q.templates')}</Link>
      {can('m54.edit') && project && <Btn kind="primary" icon="Plus" onClick={() => setCreate(true)}>{t('q.new')}</Btn>}</PageHead>
    {!project && <div className="notice grey" style={{ marginBottom: 'var(--sp-4)' }}><Icon name="Info" /><div>{t('q.pickProject')} <select className="input" style={{ maxWidth: 420, marginTop: 8 }} value="" onChange={e => setProject(e.target.value)}><option value="">—</option>{projects.map(p => <option key={p.id} value={p.id}>{L(p.name)}</option>)}</select></div></div>}
    <Guard state={d}>{rows => <Card><DataTable rows={rows} csvName="questionnaires" onRow={r => nav(`/questionnaires/${r.id}`)} columns={[
      { key: 'label', label: t('col.name'), text: r => L(r.label) }, { key: 'status', label: t('col.status'), render: r => <StatusPill value={r.status} /> },
      { key: 'forms', label: t('q.forms'), text: r => r.forms.map(f => t('pop.' + f.population)).join(' · ') }, { key: 'mode', label: t('q.channelMode'), render: r => <ChannelChip ch={r.channel_mode || 'Combination'} />, text: r => r.channel_mode },
      { key: 'invited', label: t('q.invited'), num: true, value: r => r.stats.invited }, { key: 'responded', label: t('q.responded'), num: true, value: r => r.stats.responded },
      { key: 'rate', label: t('q.responseRate'), num: true, value: r => r.stats.responseRate + '%' }, { key: 'compl', label: t('q.completeness'), num: true, value: r => (r.stats.completeness ?? '—') + '%' },
      { key: 'due', label: t('col.due'), value: r => fmtDate(r.due_date) }]} empty={t('q.none')} /></Card>}</Guard>
    {create && <NewQuestionnaire project={project} onClose={() => setCreate(false)} onDone={q => nav(`/questionnaires/${q.id}`)} />}
  </>);
}

function NewQuestionnaire({ project, onClose, onDone }) {
  const { t, L } = useI18n(); const act = useAction(); const tpl = useData('/questionnaire-templates');
  const [ids, setIds] = useState(null); const [label, setLabel] = useState(''); const [due, setDue] = useState(new Date(Date.now() + 21 * 864e5).toISOString().slice(0, 10)); const [mode, setMode] = useState('Combination'); const [ai, setAi] = useState(true); const [busy, setBusy] = useState(false);
  useEffect(() => { if (tpl.data && !ids) setIds(tpl.data.filter(x => x.library).map(x => x.id)); }, [tpl.data]); // eslint-disable-line
  const go = async () => { setBusy(true); try { const q = await act(() => post(`/projects/${project}/questionnaires`, { template_ids: ids, label: label || undefined, due_date: due, channel_mode: mode, ai })); onDone(q); } finally { setBusy(false); } };
  return (<Modal wide title={t('q.new')} onClose={onClose} footer={<><Btn onClick={onClose}>{t('common.cancel')}</Btn><Btn kind="primary" disabled={busy || !ids?.length} onClick={go}>{t('common.create')}</Btn></>}>
    <p className="small muted">{t('q.newHint')}</p>
    <Field label={t('q.loadFrom')}><div className="stack">{(tpl.data || []).map(x => <label key={x.id} className="row small"><input type="checkbox" checked={ids?.includes(x.id) || false} onChange={e => setIds(s => e.target.checked ? [...s, x.id] : s.filter(y => y !== x.id))} />
      <span><span className="strong">{L(x.name)}</span> · {t('pop.' + x.population)} · {t('q.sectionsN', { n: x.sections_count })}{x.library ? '' : ' · ' + t('q.orgTemplate')}</span></label>)}</div></Field>
    <div className="grid g-3"><Field label={t('col.name')} id="ql"><input id="ql" className="input" value={label} onChange={e => setLabel(e.target.value)} placeholder={t('q.labelPh')} /></Field>
      <Field label={t('col.due')} id="qd"><input id="qd" type="date" className="input" value={due} onChange={e => setDue(e.target.value)} /></Field>
      <Field label={t('q.channelMode')} id="qm" hint={t('q.modeHint')}><select id="qm" className="input" value={mode} onChange={e => setMode(e.target.value)}>{MODES.map(m => <option key={m} value={m}>{t('qch.' + m)}</option>)}</select></Field></div>
    <label className="row small"><input type="checkbox" checked={ai} onChange={e => setAi(e.target.checked)} /><Icon name="Sparkles" />{t('q.aiTailor')}</label>
  </Modal>);
}

// ------------------------------------------------------------------ detail
export function QuestionnaireDetail() {
  const { id } = useParams(); const { t, L, fmtDate, fmtNum } = useI18n(); const { can, setProject } = useSession(); const act = useAction();
  const d = useData(`/questionnaires/${id}`); const [sp, setSp] = useSearchParams(); const tab = sp.get('tab') || 'respondents';
  useEffect(() => { if (d.data?.project_id) setProject(d.data.project_id); }, [d.data?.project_id]); // eslint-disable-line
  return (<Guard state={d}>{q => { const st = q.stats.total; const edit = can('m54.edit') && q.status !== 'Closed';
    const blocking = q.issues.filter(i => ['aiUnvalidated', 'noAccountable', 'manyAccountable', 'noRespondents', 'noDueDate'].includes(i.code));
    return (<>
      <PageHead eyebrow={`${t('nav.questionnaires')} · ${L(q.project?.name)}`} title={L(q.label)} subtitle={`${(q.modes || [q.elaboration_mode]).map(m => t('qmode.' + m)).join(' + ')} · ${t('col.due')} ${fmtDate(q.due_date)} · ${t('q.threshold', { n: q.threshold ?? 70 })}`}>
        <StatusPill value={q.status} />
        {edit && ['Draft', 'Validated', 'Pending Validation'].includes(q.status) && <Btn kind="primary" icon="Send" disabled={blocking.length > 0} title={blocking.length ? t('q.blocked') : ''} onClick={async () => { await act(() => post(`/questionnaires/${id}/distribute`), 'q.distributed'); d.reload(); }}>{t('q.distribute')}</Btn>}
        {edit && q.status === 'Distributed' && <Btn icon="FastForward" onClick={async () => { const r = await act(() => post(`/questionnaires/${id}/advance`), null); d.reload(); window.alert(t('q.advanced', { s: r.steps, r: r.reminders })); }}>{t('q.advance')}</Btn>}
        {edit && q.status === 'Distributed' && <Btn icon="Lock" onClick={async () => { if (window.confirm(t('q.confirmClose'))) { await act(() => post(`/questionnaires/${id}/close`, {})); d.reload(); } }}>{t('q.close')}</Btn>}
        {can('reports.export') && <Btn icon="Download" onClick={() => download(`/questionnaires/${id}/report?format=xlsx`, 'questionnaire.xlsx')}>{t('q.report')}</Btn>}</PageHead>
      <div className="grid g-4">
        <Kpi icon="Users" value={fmtNum(st.invited)} label={t('q.respondents')} note={Object.entries(q.stats.byStatus || {}).map(([k, v]) => `${t('status.' + k)} ${v}`).slice(0, 3).join(' · ')} emph={false} />
        <Kpi icon="Inbox" value={`${st.responseRate}%`} label={t('q.responseRate')} note={t('q.respondedN', { n: st.responded, i: st.included })} />
        <Kpi icon="MousePointerClick" value={`${st.engagementRate}%`} label={t('q.engagementRate')} emph={false} />
        <Kpi icon="Gauge" value={`${st.completeness ?? 0}%`} label={t('q.completeness')} note={t('q.threshold', { n: q.threshold ?? 70 })} emph={false} />
      </div>
      {q.issues.length > 0 && q.status !== 'Closed' && <div className="notice" style={{ marginTop: 'var(--sp-4)' }}><Icon name="TriangleAlert" /><div><div className="strong">{t('q.issues')}</div>
        <ul style={{ margin: '4px 0 0', paddingInlineStart: 18 }}>{q.issues.map((i, k) => <li key={k} className="small">{t('qissue.' + i.code, { ...i, form: i.form || '', section: i.section || '' })}</li>)}</ul></div></div>}
      <div style={{ marginTop: 'var(--sp-5)' }}><Tabs value={tab} onChange={v => setSp({ tab: v })} tabs={[{ id: 'respondents', label: t('q.tabRespondents'), count: st.invited }, { id: 'design', label: t('q.tabDesign') }, { id: 'channels', label: t('q.tabChannels') },
        { id: 'responses', label: t('q.tabResponses'), count: st.responded }, { id: 'dataset', label: t('q.tabDataset') }, { id: 'log', label: t('q.tabLog') }]} /></div>
      {tab === 'respondents' && <Respondents q={q} edit={can('m54.edit') && q.status !== 'Closed'} reload={d.reload} />}
      {tab === 'design' && <Design q={q} edit={edit} reload={d.reload} />}
      {tab === 'channels' && <Channels q={q} edit={edit} reload={d.reload} />}
      {tab === 'responses' && <Responses q={q} edit={can('m54.edit')} />}
      {tab === 'dataset' && <Dataset q={q} edit={can('m54.edit')} />}
      {tab === 'log' && <Log q={q} />}
    </>); }}</Guard>);
}

// ------------------------------------------------------------------ respondents ("who will respond")
function Respondents({ q, edit, reload }) {
  const { t, L, fmtDate } = useI18n(); const act = useAction(); const nav = useNavigate();
  const d = useData(`/questionnaires/${q.id}/invitations`); const [add, setAdd] = useState(false); const [editing, setEditing] = useState(null); const [sel, setSel] = useState([]); const [pop, setPop] = useState('all');
  const refresh = () => { d.reload(); reload(); };
  const send = async (inv, channel) => { const r = await act(() => post(`/invitations/${inv.id}/send`, channel ? { channel } : {}), null); window.alert(t('q.sendResult', { channel: t('qch.' + r.channel), status: t('status.' + r.status) })); refresh(); };
  const copy = async inv => { const r = await act(() => get(`/invitations/${inv.id}/link`), null); try { await navigator.clipboard.writeText(r.url); window.alert(t('q.linkCopied')); } catch { window.prompt(t('q.link'), r.url); } };
  const bulk = async mode => { await act(() => patch('/invitations', { ids: sel, channel_mode: mode })); setSel([]); refresh(); };
  return (<Guard state={d}>{rows => { const shown = pop === 'all' ? rows : rows.filter(r => r.population === pop); return (<Card title={t('q.whoResponds')} actions={<>
      <Seg value={pop} onChange={setPop} label={t('q.population')} options={[{ id: 'all', label: t('common.all') }, ...['DG', 'Management', 'Member'].map(p => ({ id: p, label: t('pop.' + p) }))]} />
      {edit && sel.length > 0 && <select className="input" style={{ width: 'auto' }} value="" onChange={e => e.target.value && bulk(e.target.value)} aria-label={t('q.setMode')}><option value="">{t('q.setModeN', { n: sel.length })}</option>{MODES.map(m => <option key={m} value={m}>{t('qch.' + m)}</option>)}</select>}
      {edit && <Btn kind="primary" icon="UserPlus" onClick={() => setAdd(true)}>{t('q.addRespondents')}</Btn>}</>}>
    <p className="small muted">{t('q.whoHint')}</p>
    <DataTable rows={shown} csvName="respondents" columns={[
      ...(edit ? [{ key: 'sel', label: '', noSort: true, noCsv: true, render: r => <input type="checkbox" aria-label={r.name} checked={sel.includes(r.id)} onChange={e => setSel(s => e.target.checked ? [...s, r.id] : s.filter(x => x !== r.id))} /> }] : []),
      { key: 'name', label: t('col.name'), render: r => <span><span className="strong">{r.name}</span><br /><span className="xs muted">{r.function_name || ''}{r.decision_level ? ' · ' + r.decision_level : ''}</span></span>, text: r => r.name },
      { key: 'population', label: t('q.population'), render: r => <span>{t('pop.' + r.population)}<br /><span className="xs muted">{r.template_code}</span></span>, text: r => `${t('pop.' + r.population)} · ${L((q.forms.find(f => f.code === r.template_code) || {}).name) || r.template_code}` },
      { key: 'contact', label: t('q.contact'), render: r => <span className="xs">{r.email || '—'}<br />{r.phone ? '+' + r.phone : '—'}</span>, text: r => `${r.email || ''} ${r.phone || ''}` },
      { key: 'plan', label: t('q.channelPlan'), render: r => <span><ChannelChip ch={r.mode} /><br /><PlanSteps plan={r.channel_plan} /></span>, text: r => r.mode },
      { key: 'status', label: t('col.status'), render: r => <span><StatusPill value={r.status} />{r.interview_at && <div className="xs muted">{fmtDate(r.interview_at)}</div>}{r.opted_out ? <div className="xs muted">{t('q.optedOut')}</div> : null}</span>, text: r => r.status },
      { key: 'act', label: '', noSort: true, noCsv: true, render: r => <div className="row" style={{ flexWrap: 'nowrap' }}>
        {edit && <Btn size="sm" kind="ghost" icon="Pencil" aria-label={t('common.edit')} title={t('common.edit')} onClick={() => setEditing(r)} />}
        {edit && q.status === 'Distributed' && r.status !== 'Responded' && <Btn size="sm" kind="ghost" icon="Send" aria-label={t('q.sendNow')} title={t('q.sendNow')} onClick={() => send(r)} />}
        {edit && <Btn size="sm" kind="ghost" icon="Link" aria-label={t('q.copyLink')} title={t('q.copyLink')} onClick={() => copy(r)} />}
        {edit && ['Distributed', 'Validated'].includes(q.status) && <Btn size="sm" kind="ghost" icon="ClipboardPen" aria-label={t('q.capture')} title={t('q.capture')} onClick={() => nav(`/questionnaires/capture/${r.id}`)} />}
        <Btn size="sm" kind="ghost" icon="Printer" aria-label={t('q.pack')} title={t('q.pack')} onClick={() => download(`/invitations/${r.id}/pack?format=docx`, 'interview.docx')} /></div> }]} />
    {add && <AddRespondents q={q} onClose={() => setAdd(false)} onDone={() => { setAdd(false); refresh(); }} />}
    {editing && <EditInvitation q={q} inv={editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); refresh(); }} />}
  </Card>); }}</Guard>);
}

function AddRespondents({ q, onClose, onDone }) {
  const { t, L } = useI18n(); const act = useAction(); const c = useData(`/questionnaires/${q.id}/candidates`);
  const [sel, setSel] = useState([]); const [mode, setMode] = useState(q.channel_mode || 'Combination'); const [pop, setPop] = useState('all');
  return (<Modal wide title={t('q.addRespondents')} onClose={onClose} footer={<><Btn onClick={onClose}>{t('common.cancel')}</Btn><Btn kind="primary" disabled={!sel.length} onClick={async () => { await act(() => post(`/questionnaires/${q.id}/invitations`, { stakeholder_ids: sel, channel_mode: mode })); onDone(); }}>{t('q.addN', { n: sel.length })}</Btn></>}>
    <p className="small muted">{t('q.addHint')}</p>
    <div className="row" style={{ marginBottom: 'var(--sp-3)' }}><Seg value={pop} onChange={setPop} label={t('q.population')} options={[{ id: 'all', label: t('common.all') }, ...['DG', 'Management', 'Member'].map(p => ({ id: p, label: t('pop.' + p) }))]} />
      <Field label={t('q.channelMode')} id="am"><select id="am" className="input" value={mode} onChange={e => setMode(e.target.value)}>{MODES.map(m => <option key={m} value={m}>{t('qch.' + m)}</option>)}</select></Field></div>
    <Guard state={c}>{rows => { const free = rows.filter(r => !r.invited && (pop === 'all' || r.population === pop)); return (<>
      <label className="row small"><input type="checkbox" checked={free.length > 0 && free.every(r => sel.includes(r.id))} onChange={e => setSel(e.target.checked ? free.map(r => r.id) : [])} />{t('q.selectAll', { n: free.length })}</label>
      <DataTable rows={free} search pageSize={30} columns={[{ key: 'sel', label: '', noSort: true, render: r => <input type="checkbox" aria-label={L(r.name)} checked={sel.includes(r.id)} onChange={e => setSel(s => e.target.checked ? [...s, r.id] : s.filter(x => x !== r.id))} /> },
        { key: 'name', label: t('col.name'), text: r => L(r.name) }, { key: 'population', label: t('q.population'), text: r => t('pop.' + r.population) }, { key: 'function', label: t('col.function'), text: r => L(r.function) },
        { key: 'decision_level', label: t('q.level') }, { key: 'pref', label: t('q.preferred'), text: r => t('qch.' + r.preferred_channel) }, { key: 'consent_status', label: t('q.consent'), render: r => <StatusPill value={r.consent_status} /> }]} /></>); }}</Guard>
  </Modal>);
}

function EditInvitation({ q, inv, onClose, onDone }) {
  const { t, L } = useI18n(); const act = useAction(); const users = useData('/context/users');
  const [f, setF] = useState({ population: inv.population, template_code: inv.template_code, email: inv.email || '', phone: inv.phone ? '+' + inv.phone : '', lang: inv.lang || '', interview_at: inv.interview_at ? inv.interview_at.slice(0, 16) : '', interviewer_id: inv.interviewer_id || '' });
  const [plan, setPlan] = useState(inv.channel_plan || []);
  const step = (i, k, v) => setPlan(p => p.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  const save = async () => { await act(() => patch(`/invitations/${inv.id}`, { ...f, interview_at: f.interview_at ? new Date(f.interview_at).toISOString() : null, interviewer_id: f.interviewer_id || null, lang: f.lang || null, channel_plan: plan })); onDone(); };
  return (<Modal wide title={inv.name} onClose={onClose} footer={<><Btn onClick={onClose}>{t('common.cancel')}</Btn><Btn kind="primary" onClick={save}>{t('common.save')}</Btn></>}>
    <div className="grid g-3">
      <Field label={t('q.population')} id="ep"><select id="ep" className="input" value={f.population} onChange={e => setF({ ...f, population: e.target.value })}>{['DG', 'Management', 'Member'].map(p => <option key={p} value={p}>{t('pop.' + p)}</option>)}</select></Field>
      <Field label={t('q.form')} id="ef"><select id="ef" className="input" value={f.template_code || ''} disabled={inv.status === 'Responded'} onChange={e => setF({ ...f, template_code: e.target.value })}>{q.forms.map(x => <option key={x.code} value={x.code}>{L(x.name)}</option>)}</select></Field>
      <Field label={t('q.language')} id="el"><select id="el" className="input" value={f.lang} onChange={e => setF({ ...f, lang: e.target.value })}><option value="">{t('q.orgLanguage')}</option><option value="en">English</option><option value="fr">Français</option><option value="ar">العربية</option></select></Field>
      <Field label={t('q.email')} id="ee"><input id="ee" className="input" type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></Field>
      <Field label={t('q.mobile')} id="em" hint={t('q.mobileHint')}><input id="em" className="input" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></Field>
      <div />
      <Field label={t('q.interviewAt')} id="ei"><input id="ei" className="input" type="datetime-local" value={f.interview_at} onChange={e => setF({ ...f, interview_at: e.target.value })} /></Field>
      <Field label={t('q.interviewer')} id="eu"><select id="eu" className="input" value={f.interviewer_id} onChange={e => setF({ ...f, interviewer_id: e.target.value })}><option value="">—</option>{(users.data || []).map(u => <option key={u.id} value={u.id}>{u.name} — {u.title}</option>)}</select></Field>
    </div>
    <h4 style={{ marginTop: 'var(--sp-4)' }}>{t('q.channelPlan')}</h4>
    <p className="small muted">{t('q.planHint')}</p>
    <div className="row" style={{ marginBottom: 8 }}>{MODES.map(m => <Btn key={m} size="sm" onClick={() => setPlan(presetPlan(m, f.population, !!f.phone))}><Icon name={CH_ICON[m]} />{t('qch.' + m)}</Btn>)}</div>
    <div className="table-wrap"><table className="tbl"><thead><tr><th>#</th><th>{t('q.channel')}</th><th>{t('q.action')}</th><th>{t('q.afterDays')}</th><th /></tr></thead><tbody>
      {plan.map((s, i) => <tr key={i}><td>{i + 1}</td><td><select className="input" value={s.channel} onChange={e => step(i, 'channel', e.target.value)} aria-label={t('q.channel')}>{CHANNELS.map(c => <option key={c} value={c}>{t('qch.' + c)}</option>)}</select></td>
        <td>{s.channel === 'Face-to-Face' ? t('qact.interview') : <select className="input" value={s.action} onChange={e => step(i, 'action', e.target.value)} aria-label={t('q.action')}><option value="invite">{t('qact.invite')}</option><option value="remind">{t('qact.remind')}</option></select>}</td>
        <td><input className="input" type="number" min="0" style={{ width: 90 }} value={s.after_days} onChange={e => step(i, 'after_days', Number(e.target.value))} aria-label={t('q.afterDays')} /></td>
        <td><Btn size="sm" kind="ghost" icon="Trash2" aria-label={t('common.delete')} onClick={() => setPlan(p => p.filter((_, j) => j !== i))} /></td></tr>)}</tbody></table></div>
    <Btn size="sm" icon="Plus" onClick={() => setPlan(p => [...p, { channel: 'Email', action: p.length ? 'remind' : 'invite', after_days: (p.at(-1)?.after_days || 0) + 3 }])}>{t('q.addStep')}</Btn>
  </Modal>);
}
function presetPlan(mode, pop, hasPhone) {
  if (mode === 'Face-to-Face') return [{ channel: 'Face-to-Face', action: 'interview', after_days: 0 }];
  if (mode !== 'Combination') return [{ channel: mode, action: 'invite', after_days: 0 }, { channel: mode, action: 'remind', after_days: 3 }, { channel: mode, action: 'remind', after_days: 7 }];
  if (pop === 'DG') return [{ channel: 'Email', action: 'invite', after_days: 0 }, { channel: 'Face-to-Face', action: 'interview', after_days: 3 }];
  if (pop === 'Management') return [{ channel: 'Email', action: 'invite', after_days: 0 }, { channel: 'Email', action: 'remind', after_days: 4 }, { channel: 'Face-to-Face', action: 'interview', after_days: 8 }];
  return [{ channel: hasPhone ? 'WhatsApp' : 'Email', action: 'invite', after_days: 0 }, { channel: hasPhone ? 'WhatsApp' : 'Email', action: 'remind', after_days: 3 }, { channel: 'Email', action: 'remind', after_days: 6 }, { channel: 'Face-to-Face', action: 'interview', after_days: 10 }];
}

// ------------------------------------------------------------------ design: forms, sections, AI validation, RACSI per section, manual questions
function Design({ q, edit, reload }) {
  const { t, L, lang } = useI18n(); const act = useAction(); const { can } = useSession();
  const [code, setCode] = useState(q.forms[0]?.code); const [forms, setForms] = useState(q.forms); const [dirty, setDirty] = useState(false); const [preview, setPreview] = useState(false); const [just, setJust] = useState(false);
  useEffect(() => { setForms(q.forms); setDirty(false); }, [q]);
  const form = forms.find(f => f.code === code) || forms[0];
  const upd = (sid, fn) => { setForms(fs => fs.map(f => (f.code !== form.code ? f : { ...f, sections: f.sections.map(s => (s.id === sid ? fn(s) : s)) }))); setDirty(true); };
  const setText = (obj, v) => (obj && typeof obj === 'object' && !(obj.en === obj.fr && obj.fr === obj.ar) ? { ...obj, [lang]: v } : { en: v, fr: v, ar: v });
  const save = async note => { await act(() => patch(`/questionnaires/${q.id}`, { forms, _justification: note })); setDirty(false); reload(); };
  const pendingAi = forms.flatMap(f => f.sections.flatMap(s => [s, ...(s.items || [])].filter(x => x.origin === 'ai' && !x.validated_by).map(x => ({ f, s, x }))));
  const addSection = () => { const id = 'manual_' + Date.now().toString(36); setForms(fs => fs.map(f => (f.code !== form.code ? f : { ...f, sections: [...f.sections, { id, type: 'questions', title: { en: t('q.newSection'), fr: t('q.newSection'), ar: t('q.newSection') }, items: [], racsi: { R: 'L&D Analyst', A: 'Head of L&D', C: '', S: '', I: '' } }] }))); setDirty(true); };
  return (<div className="grid split-r">
    <Card title={t('q.forms')}>
      <div className="stack">{forms.map(f => <button key={f.code} type="button" className={`list-btn ${f.code === form?.code ? 'active' : ''}`} onClick={() => setCode(f.code)}><span className="strong">{L(f.name)}</span><span className="xs muted">{t('pop.' + f.population)} · {t('q.sectionsN', { n: f.sections.length })}</span></button>)}</div>
      {edit && can('ai.run') && <Btn icon="Sparkles" style={{ marginTop: 'var(--sp-4)' }} onClick={async () => { const r = await act(() => post(`/questionnaires/${q.id}/ai-tailor`), null); window.alert(t('q.aiAdded', { n: r.added })); reload(); }}>{t('q.aiTailorNow')}</Btn>}
      {pendingAi.length > 0 && <div className="notice" style={{ marginTop: 'var(--sp-4)' }}><Icon name="Sparkles" /><div><div className="strong">{t('q.aiPending', { n: pendingAi.length })}</div><p className="xs">{t('q.aiPendingHint')}</p>
        {edit && <Btn size="sm" kind="primary" onClick={async () => { await act(() => post(`/questionnaires/${q.id}/validate`, { all: true })); reload(); }}>{t('q.validateAll')}</Btn>}</div></div>}
      <div className="row" style={{ marginTop: 'var(--sp-4)' }}><Btn size="sm" icon="Eye" onClick={() => setPreview(true)}>{t('q.preview')}</Btn><Btn size="sm" icon="Printer" onClick={() => download(`/questionnaires/${q.id}/forms/${form.code}/pack?format=docx`, form.code + '.docx')}>{t('q.blankForm')}</Btn></div>
    </Card>
    <Card title={L(form?.name)} actions={edit && <><Btn size="sm" icon="Plus" onClick={addSection}>{t('q.addSection')}</Btn><Btn size="sm" kind="primary" disabled={!dirty} onClick={() => (q.status === 'Distributed' ? setJust(true) : save())}>{t('common.save')}</Btn></>}>
      <p className="small muted">{t('q.designHint')}</p>
      {form?.sections.map((s, k) => <div key={s.id} className="design-section">
        <div className="row" style={{ justifyContent: 'space-between' }}><div><span className="xs muted">{k + 1} · {t('qtype.' + s.type)} · {t('qorigin.' + (s.origin || 'template'))}</span><div className="strong">{L(s.title)}</div></div>
          {s.origin === 'ai' && (s.validated_by ? <span className="pill s4 xs">{t('q.validated')}</span> : <span className="pill s2 xs">{t('q.toValidate')}</span>)}</div>
        {s.type !== 'note' && <div className="racsi-row">{['R', 'A', 'C', 'S', 'I'].map(Lt => <label key={Lt} className="xs"><span className={`racsi-letter ${Lt === 'A' ? 'a' : ''}`}>{Lt}</span>
          <input className="input" disabled={!edit} value={s.racsi?.[Lt] || ''} onChange={e => upd(s.id, x => ({ ...x, racsi: { ...(x.racsi || {}), [Lt]: e.target.value } }))} aria-label={`RACSI ${Lt} — ${L(s.title)}`} /></label>)}</div>}
        {s.type === 'questions' && <ul className="steps-list">{s.items.map(it => <li key={it.key}><span style={{ flex: 1 }}>
          {edit && it.origin === 'manual' ? <input className="input" value={L(it.label)} onChange={e => upd(s.id, x => ({ ...x, items: x.items.map(y => (y.key === it.key ? { ...y, label: setText(y.label, e.target.value) } : y)) }))} aria-label={t('q.question')} /> : L(it.label)}</span>
          <span className="pill xs">{t('qorigin.' + (it.origin || 'template'))}</span>
          {it.origin === 'ai' && !it.validated_by && edit && <><Btn size="sm" icon="Check" aria-label={t('q.validate')} title={t('q.validate')} onClick={async () => { await act(() => post(`/questionnaires/${q.id}/validate`, { refs: [`${form.code}|${s.id}|${it.key}`] })); reload(); }} /><Btn size="sm" kind="ghost" icon="X" aria-label={t('q.reject')} title={t('q.reject')} onClick={async () => { await act(() => post(`/questionnaires/${q.id}/validate`, { reject: [`${form.code}|${s.id}|${it.key}`] })); reload(); }} /></>}
          {edit && it.origin === 'manual' && <Btn size="sm" kind="ghost" icon="Trash2" aria-label={t('common.delete')} onClick={() => upd(s.id, x => ({ ...x, items: x.items.filter(y => y.key !== it.key) }))} />}</li>)}</ul>}
        {s.type === 'questions' && edit && <Btn size="sm" kind="ghost" icon="Plus" onClick={() => upd(s.id, x => ({ ...x, items: [...x.items, { key: 'm' + Date.now().toString(36), label: { en: '', fr: '', ar: '' } }] }))}>{t('q.addQuestion')}</Btn>}
        {s.type !== 'questions' && s.type !== 'note' && <p className="xs muted">{t('q.elements', { n: (s.fields || s.items || s.rows || s.boxes || s.columns || []).length })}</p>}
      </div>)}
    </Card>
    {preview && <Modal wide title={L(form.name)} onClose={() => setPreview(false)}><QForm form={form} answers={{}} onChange={() => {}} /></Modal>}
    {just && <JustifyDialog title={t('q.changeDistributed')} onCancel={() => setJust(false)} onConfirm={n => { setJust(false); save(n); }} />}
  </div>);
}

// ------------------------------------------------------------------ channels: mode, reminders, provider status
function Channels({ q, edit, reload }) {
  const { t } = useI18n(); const act = useAction(); const { can } = useSession();
  const [mode, setMode] = useState(q.channel_mode || 'Combination'); const [rem, setRem] = useState(q.reminders || {}); const [th, setTh] = useState(q.threshold ?? 70);
  const save = async () => { await act(() => patch(`/questionnaires/${q.id}`, { channel_mode: mode, reminders: rem, threshold: th })); reload(); };
  return (<div className="grid split">
    <Card title={t('q.channelMode')} actions={edit && <Btn kind="primary" onClick={save}>{t('common.save')}</Btn>}>
      <p className="small muted">{t('q.modeExplain')}</p>
      <div className="grid g-3">{MODES.map(m => <label key={m} className={`choice-card ${mode === m ? 'active' : ''}`}><input type="radio" name="mode" disabled={!edit} checked={mode === m} onChange={() => setMode(m)} /><Icon name={CH_ICON[m]} /><span className="strong">{t('qch.' + m)}</span><span className="xs muted">{t('qmodeHint.' + m)}</span></label>)}</div>
      <h4 style={{ marginTop: 'var(--sp-5)' }}>{t('q.defaultPlans')}</h4>
      <div className="stack">{['DG', 'Management', 'Member'].map(p => <div key={p} className="row small"><span className="strong" style={{ minWidth: 160 }}>{t('pop.' + p)}</span><PlanSteps plan={presetPlan(mode, p, true)} /></div>)}</div>
      <p className="xs muted">{t('q.defaultPlansHint')}</p>
      <h4 style={{ marginTop: 'var(--sp-5)' }}>{t('q.reminders')}</h4>
      <div className="table-wrap"><table className="tbl"><thead><tr><th>{t('q.channel')}</th><th>{t('q.everyDays')}</th><th>{t('q.maxReminders')}</th></tr></thead><tbody>
        {['Email', 'WhatsApp', 'Application'].map(c => <tr key={c}><td><ChannelChip ch={c} /></td>
          <td><input className="input" type="number" min="0" disabled={!edit} style={{ width: 90 }} value={rem[c]?.every_days ?? 0} onChange={e => setRem({ ...rem, [c]: { ...(rem[c] || {}), every_days: Number(e.target.value) } })} aria-label={t('q.everyDays')} /></td>
          <td><input className="input" type="number" min="0" disabled={!edit} style={{ width: 90 }} value={rem[c]?.max ?? 0} onChange={e => setRem({ ...rem, [c]: { ...(rem[c] || {}), max: Number(e.target.value) } })} aria-label={t('q.maxReminders')} /></td></tr>)}</tbody></table></div>
      <p className="xs muted">{t('q.remindersHint')}</p>
      <Field label={t('q.thresholdLabel')} id="th" hint={t('q.thresholdHint')}><input id="th" className="input" type="number" min="0" max="100" disabled={!edit} style={{ width: 100 }} value={th} onChange={e => setTh(Number(e.target.value))} /></Field>
    </Card>
    <Card title={t('q.providers')}>
      {q.channelSettings.map(c => <div key={c.channel} className="row" style={{ justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--pa-grey-line)' }}><span className="row"><Icon name={c.channel === 'email' ? 'Mail' : 'MessageCircle'} />{t('channel.' + c.channel)}</span><span className={`pill ${c.effective === 'sandbox' ? 's2' : 's4'}`}>{t('channelMode.' + c.effective)}</span></div>)}
      <p className="small muted" style={{ marginTop: 'var(--sp-3)' }}>{t('q.sandboxHint')}</p>
      {can('config.view') && <Link className="btn" to="/admin/channels"><Icon name="Settings" />{t('q.channelSettings')}</Link>}
      <h4 style={{ marginTop: 'var(--sp-5)' }}>{t('q.respondVia')}</h4><p className="small">{t('q.respondViaText')}</p>
    </Card>
  </div>);
}

// ------------------------------------------------------------------ responses
function Responses({ q, edit }) {
  const { t, L, fmtDate } = useI18n(); const act = useAction(); const d = useData(`/questionnaires/${q.id}/responses`); const [view, setView] = useState(null); const [inc, setInc] = useState(null);
  return (<Guard state={d}>{rows => <Card title={t('q.tabResponses')}>
    <DataTable rows={rows} csvName="responses" onRow={async r => setView(await get(`/responses/${r.id}`))} columns={[
      { key: 'respondent', label: t('q.respondent') }, { key: 'population', label: t('q.population'), text: r => t('pop.' + r.population) }, { key: 'channel_used', label: t('q.channel'), render: r => <span><ChannelChip ch={r.channel_used} />{r.hybrid && <span className="xs muted"> · {t('qch.Combination')}</span>}</span>, text: r => r.channel_used },
      { key: 'submitted_at', label: t('q.submitted'), value: r => fmtDate(r.submitted_at), sortValue: r => r.submitted_at }, { key: 'completeness_pct', label: t('q.completeness'), num: true, render: r => <span className={r.completeness_pct < (q.threshold ?? 70) ? 'strong' : ''}>{r.completeness_pct}%</span>, value: r => r.completeness_pct },
      { key: 'consent', label: t('q.consent'), render: r => (r.consent_given ? <StatusPill value="Given" /> : '—') }, { key: 'included', label: t('q.included'), render: r => <span>{r.included === false ? <StatusPill value="Excluded" /> : <StatusPill value="Included" />}{r.flagged && <div className="xs muted">{t('q.belowThreshold')}</div>}</span>, text: r => (r.included === false ? 'Excluded' : 'Included') },
      ...(edit ? [{ key: 'act', label: '', noSort: true, noCsv: true, render: r => <Btn size="sm" kind="ghost" onClick={e => { e.stopPropagation(); setInc(r); }}>{r.included === false ? t('q.include') : t('q.exclude')}</Btn> }] : [])]} />
    {view && <Modal wide title={`${view.respondent} · ${L(view.form?.name)}`} onClose={() => setView(null)}><KV items={[[t('q.channel'), t('qch.' + view.channel_used)], [t('q.submitted'), fmtDate(view.submitted_at)], [t('q.completeness'), view.completeness_pct + '%'], [t('q.language'), view.language || '—']]} /><QForm form={view.form} answers={view.answers_json || {}} flags={view.flags || {}} readOnly onChange={() => {}} /></Modal>}
    {inc && <JustifyDialog title={inc.included === false ? t('q.include') : t('q.exclude')} onCancel={() => setInc(null)} onConfirm={async n => { await act(() => post(`/responses/${inc.id}/include`, { include: inc.included === false, _justification: n })); setInc(null); d.reload(); }} />}
  </Card>}</Guard>);
}

// ------------------------------------------------------------------ consolidation
function Dataset({ q, edit }) {
  const { t } = useI18n(); const act = useAction(); const d = useData(`/questionnaires/${q.id}/dataset`);
  return (<Guard state={d}>{ds => <>
    <div className="notice grey" style={{ marginBottom: 'var(--sp-4)' }}><Icon name="Database" /><div>{t('q.datasetIntro', { n: ds.responses })} {edit && <Btn size="sm" kind="primary" icon="ArrowRightLeft" onClick={async () => { const r = await act(() => post(`/questionnaires/${q.id}/feed`, {}), null); window.alert(t('q.fed', { n: r.created })); }}>{t('q.feed')}</Btn>}</div></div>
    <div className="grid g-2">
      <Card title={t('q.softSkills')}><BarChart data={ds.softSkills.slice(0, 12).map(x => ({ label: x.label, value: x.average }))} max={5} caption={t('q.softCaption')} /></Card>
      <Card title={t('q.competences')}><DataTable rows={ds.competences} search={false} pageSize={12} columns={[{ key: 'competence', label: t('pack.competence') }, { key: 'count', label: t('q.mentions'), num: true }, { key: 'populations', label: t('q.populations'), text: r => r.populations.map(p => t('pop.' + p)).join(', ') }]} /></Card>
      <Card title={t('q.performance')}><DataTable rows={ds.performance} search={false} columns={[{ key: 'function', label: t('col.function') }, { key: 'ms', label: 'MS', num: true }, { key: 'mo', label: 'MO', num: true }, { key: 'op', label: 'OP', num: true }, { key: 'n', label: 'n', num: true }]} /></Card>
      <Card title={t('q.leadership')}><DataTable rows={ds.leadership} search={false} columns={[{ key: 'label', label: t('q.level') }, { key: 'average', label: t('q.average'), num: true, value: r => r.average + (r.kind === 'pct' ? ' %' : ' /5') }, { key: 'n', label: 'n', num: true }]} /></Card>
      <Card title={t('q.transverse')}><DataTable rows={ds.transverse} search={false} pageSize={16} columns={[{ key: 'label', label: t('col.process') }, { key: 'documented', label: t('q.documented'), num: true, value: r => r.documented + '%' }, { key: 'owner', label: t('q.owner'), num: true, value: r => r.owner + '%' }, { key: 'score', label: t('q.score'), num: true }]} /></Card>
      <Card title={t('q.strategy')}>{Object.keys(ds.strategy).length ? <KV items={Object.values(ds.strategy).map(x => [x.label, [...new Set(x.values)].join(' · ')])} /> : <p className="muted small">{t('q.noStrategy')}</p>}</Card>
    </div></>}</Guard>);
}

// ------------------------------------------------------------------ immutable log and outbox
function Log({ q }) {
  const { t, fmtDate, fmtDateTime } = useI18n(); const ev = useData(`/questionnaires/${q.id}/events`); const msg = useData(`/messages?questionnaire=${q.id}`); const [m, setM] = useState(null);
  return (<div className="grid g-2">
    <Card title={t('q.events')}><p className="xs muted">{t('q.eventsHint')}</p><Guard state={ev}>{rows => <DataTable rows={rows} csvName="questionnaire_log" columns={[{ key: 'created_at', label: t('col.date'), value: r => fmtDateTime(r.created_at), sortValue: r => r.created_at },
      { key: 'kind', label: t('q.event'), text: r => t('qev.' + r.kind) }, { key: 'channel', label: t('q.channel'), text: r => (r.channel ? t('qch.' + r.channel) : '—') }, { key: 'recipient', label: t('q.recipient') }, { key: 'status', label: t('col.status'), text: r => (r.status ? t('status.' + r.status) : '—') }, { key: 'user_name', label: t('col.user') }]} />}</Guard></Card>
    <Card title={t('q.outbox')}><p className="xs muted">{t('q.outboxHint')}</p><Guard state={msg}>{rows => <DataTable rows={rows} csvName="messages" onRow={setM} columns={[{ key: 'created_at', label: t('col.date'), value: r => fmtDateTime(r.created_at), sortValue: r => r.created_at },
      { key: 'channel', label: t('q.channel'), text: r => t('channel.' + r.channel) }, { key: 'kind', label: t('q.event'), text: r => t('qev.' + r.kind) }, { key: 'recipient', label: t('q.recipient') }, { key: 'status', label: t('col.status'), render: r => <StatusPill value={r.status} /> }]} />}</Guard></Card>
    {m && <Modal title={m.subject || t('channel.' + m.channel)} onClose={() => setM(null)}><KV items={[[t('q.channel'), t('channel.' + m.channel)], [t('q.recipient'), m.recipient], [t('col.status'), t('status.' + m.status)], [t('q.provider'), m.provider || '—'], m.error && [t('q.error'), m.error]]} /><pre className="message-body">{m.body}</pre></Modal>}
  </div>);
}

// ------------------------------------------------------------------ template library (FR-DA-TPL-06..09)
export function QuestionnaireTemplates() {
  const { t, L } = useI18n(); const { can } = useSession(); const act = useAction(); const d = useData('/questionnaire-templates'); const [view, setView] = useState(null);
  const importFile = async e => { const f = e.target.files?.[0]; if (!f) return; try { const j = JSON.parse(await f.text()); await act(() => post('/questionnaire-templates/import', { template: j.template || j })); d.reload(); } catch { /* error shown by useAction */ } e.target.value = ''; };
  return (<>
    <PageHead eyebrow={t('nav.questionnaires')} title={t('q.templates')} subtitle={t('q.templatesSub')}>
      <Link className="btn" to="/questionnaires"><Icon name="ArrowLeft" />{t('nav.questionnaires')}</Link>
      {can('m54.manage') && <label className="btn"><Icon name="Upload" />{t('q.import')}<input type="file" accept="application/json" hidden onChange={importFile} /></label>}</PageHead>
    <Guard state={d}>{rows => <div className="grid g-3">{rows.map(x => <Card key={x.id} title={L(x.name)} actions={<span className="pill xs">{x.library ? t('q.library') : t('q.orgTemplate')}</span>}>
      <p className="small muted">{L(x.description)}</p>
      <KV items={[[t('q.code'), x.code], [t('q.population'), t('pop.' + x.population)], [t('q.sections'), x.sections_count], [t('q.language'), (x.language || '').toUpperCase()], [t('q.version'), x.version_no]]} />
      <div className="row" style={{ marginTop: 'var(--sp-3)' }}><Btn size="sm" icon="Eye" onClick={async () => setView(await get('/questionnaire-templates/' + x.id))}>{t('q.preview')}</Btn>
        {can('m54.manage') && <Btn size="sm" icon="Copy" onClick={async () => { await act(() => post('/questionnaire-templates', { copy_of: x.id })); d.reload(); }}>{t('q.copyAdapt')}</Btn>}
        <Btn size="sm" icon="Download" onClick={() => download(`/questionnaire-templates/${x.id}/export`, x.code + '.json')}>JSON</Btn>
        {can('m54.manage') && !x.library && <Btn size="sm" kind="ghost" icon="Trash2" aria-label={t('common.delete')} onClick={async () => { if (window.confirm(t('common.confirmDelete'))) { await act(() => del('/questionnaire-templates/' + x.id)); d.reload(); } }} />}</div>
    </Card>)}</div>}</Guard>
    {view && <Modal wide title={L(view.name)} onClose={() => setView(null)}><QForm form={view} answers={{}} onChange={() => {}} /></Modal>}
  </>);
}

// ------------------------------------------------------------------ face-to-face capture with offline queue (FR-DA-QLT-08)
const QKEY = 'cs.offline.captures';
const queue = { get() { try { return JSON.parse(localStorage.getItem(QKEY) || '[]'); } catch { return []; } }, set(v) { try { localStorage.setItem(QKEY, JSON.stringify(v)); } catch { /* storage unavailable */ } } };
export async function syncOffline() { const items = queue.get(); const left = [];
  for (const it of items) { try { await post(`/invitations/${it.inv}/capture`, it.body); } catch (e) { if (!e.status || e.status >= 500) left.push(it); } }
  queue.set(left); return { sent: items.length - left.length, left: left.length }; }

export function CaptureResponse() {
  const { id } = useParams(); const { t, L } = useI18n(); const act = useAction(); const nav = useNavigate(); const d = useData(`/invitations/${id}/form`);
  const [answers, setAnswers] = useState(null); const [flags, setFlags] = useState({}); const [consent, setConsent] = useState(false); const [channel, setChannel] = useState('Face-to-Face'); const [pending, setPending] = useState(queue.get().length); const [online, setOnline] = useState(navigator.onLine);
  const fns = useData('/context/functions');
  useEffect(() => { if (d.data && !answers) { setAnswers(d.data.answers || {}); setFlags(d.data.flags || {}); setConsent(!!d.data.invitation.consent?.given); } }, [d.data]); // eslint-disable-line
  useEffect(() => { const on = async () => { setOnline(true); const r = await syncOffline(); setPending(r.left); }; const off = () => setOnline(false); window.addEventListener('online', on); window.addEventListener('offline', off); return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); }; }, []);
  const submit = async final => {
    const body = { answers, flags, consent, final, channel_used: channel, captured_at: new Date().toISOString(), client_id: Math.random().toString(36).slice(2) + Date.now().toString(36) };
    if (!navigator.onLine) { queue.set([...queue.get(), { inv: id, body }]); setPending(queue.get().length); window.alert(t('q.savedOffline')); return; }
    try { await act(() => post(`/invitations/${id}/capture`, body), final ? 'q.captured' : 'common.saved'); if (final) nav(-1); }
    catch (e) { if (!e.status) { queue.set([...queue.get(), { inv: id, body }]); setPending(queue.get().length); } }
  };
  return (<Guard state={d}>{x => <>
    <PageHead eyebrow={`${t('q.capture')} · ${L(x.questionnaire.label)}`} title={x.invitation.name} subtitle={`${t('pop.' + x.invitation.population)} · ${L(x.form?.name)}`}>
      <span className={`pill ${online ? 's4' : 's2'}`}><Icon name={online ? 'Wifi' : 'WifiOff'} size={12} />{online ? t('q.online') : t('q.offline')}</span>
      {pending > 0 && <Btn icon="RefreshCw" onClick={async () => { const r = await syncOffline(); setPending(r.left); window.alert(t('q.synced', { n: r.sent })); }}>{t('q.syncN', { n: pending })}</Btn>}
      <Btn icon="Printer" onClick={() => download(`/invitations/${id}/pack?format=docx`, 'interview.docx')}>{t('q.pack')}</Btn></PageHead>
    <div className="card" style={{ marginBottom: 'var(--sp-4)' }}><div className="grid g-2">
      <label className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ marginTop: 4 }} /><span><span className="strong">{t('q.consentObtained')}</span><br /><span className="xs muted">{t('q.consentObtainedHint')}</span></span></label>
      <Field label={t('q.capturedVia')} id="cv"><select id="cv" className="input" value={channel} onChange={e => setChannel(e.target.value)}>{CHANNELS.map(c => <option key={c} value={c}>{t('qch.' + c)}</option>)}</select></Field></div></div>
    {answers && <QForm form={x.form} answers={answers} flags={flags} onChange={setAnswers} onFlags={setFlags} functions={(fns.data || []).map(f => L(f.name))} />}
    <div className="card sticky-actions"><div className="row" style={{ justifyContent: 'space-between' }}><div style={{ minWidth: 220 }}><div className="small">{t('respond.completeness', { pct: completeness(x.form?.sections, answers || {}, flags) })}</div><Progress value={completeness(x.form?.sections, answers || {}, flags)} label={t('q.completeness')} /></div>
      <div className="row"><Btn icon="Save" disabled={!consent} onClick={() => submit(false)}>{t('respond.saveDraft')}</Btn><Btn kind="primary" icon="Check" disabled={!consent} onClick={() => submit(true)}>{t('q.recordResponse')}</Btn></div></div>
      {!consent && <p className="xs muted">{t('respond.consentNeeded')}</p>}</div>
  </>}</Guard>);
}
