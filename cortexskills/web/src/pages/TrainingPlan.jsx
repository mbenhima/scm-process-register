// Training plan: Program → Training (level, training ID, name, objectives, duration, prerequisites), a detailed
// agenda half-day by half-day (lectures, quizzes, workshops) and the value proposition per persona (behaviour,
// pain points, hopes → fit). Golden rules: one quiz and one workshop per half-day, checked live and before approval.
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { get, post, put, del, download } from '../lib/api.js';
import { PageHead, Card, Guard, DataTable, StatusPill, Btn, Icon, Kpi, useAction, Modal, JustifyDialog, Field, Tabs, Empty, Select } from '../components/ui.jsx';

const LEVELS = ['Foundation', 'Intermediate', 'Advanced', 'Expert'];
const TYPES = ['Lecture', 'Quiz', 'Workshop'];
const TYPE_ICON = { Lecture: 'Presentation', Quiz: 'ListChecks', Workshop: 'Hammer' };
const mlSet = (obj, lang, v) => (obj && typeof obj === 'object' && !(obj.en === obj.fr && obj.fr === obj.ar) ? { ...obj, [lang]: v } : { en: v, fr: v, ar: v });
const halfLabel = (i, t) => t('tp.halfDayLabel', { d: Math.floor(i / 2) + 1, p: t(i % 2 ? 'tp.afternoon' : 'tp.morning') });
const halfLabelMl = i => { const d = Math.floor(i / 2) + 1, pm = i % 2; return { en: `Day ${d} — ${pm ? 'afternoon' : 'morning'}`, fr: `Jour ${d} — ${pm ? 'après-midi' : 'matin'}`, ar: `اليوم ${d} — ${pm ? 'بعد الزوال' : 'الصباح'}` }; };

/** Live golden-rule check, the same rules as the server (services/training.js). */
export function rulesOf(c) {
  const issues = []; const ag = c.agenda || []; const d = Number(c.duration_days);
  if (!(d > 0) || Math.round(d * 2) !== d * 2) issues.push({ code: 'durationHalfDays' }); else if (ag.length !== d * 2) issues.push({ code: 'halfDayCount', expected: d * 2, found: ag.length });
  ag.forEach((h, i) => { const n = ty => (h.items || []).filter(x => x.type === ty).length;
    if (n('Quiz') !== 1) issues.push({ code: n('Quiz') ? 'manyQuiz' : 'noQuiz', halfDay: i + 1, n: n('Quiz') });
    if (n('Workshop') !== 1) issues.push({ code: n('Workshop') ? 'manyWorkshop' : 'noWorkshop', halfDay: i + 1, n: n('Workshop') });
    if (n('Lecture') < 1) issues.push({ code: 'noLecture', halfDay: i + 1 }); });
  if (!(c.objectives || []).length) issues.push({ code: 'noObjective' });
  if (!(c.personas || []).filter(p => p.persona_id).length) issues.push({ code: 'noPersona' });
  return { ok: !issues.length, issues };
}

export function TrainingPlan() {
  const { t, L, fmtNum } = useI18n(); const { project, projects, setProject, can } = useSession(); const act = useAction(); const [sp] = useSearchParams();
  useEffect(() => { const p = sp.get('project'); if (p && p !== project) setProject(p); }, [sp]); // eslint-disable-line
  const d = useData(project ? `/projects/${project}/training-plan` : null); const [open, setOpen] = useState(null); const [personas, setPersonas] = useState(false); const [submit, setSubmit] = useState(null); const [newPrg, setNewPrg] = useState(false);
  if (!project) return (<><PageHead eyebrow={t('tp.eyebrow')} title={t('nav.trainingPlan')} subtitle={t('tp.subtitle')} />
    <div className="notice grey"><Icon name="Info" /><div>{t('q.pickProject')} <Select className="input" style={{ maxWidth: 420, marginTop: 8 }} value="" onChange={e => setProject(e.target.value)}><option value="">—</option>{projects.map(p => <option key={p.id} value={p.id}>{L(p.name)}</option>)}</Select></div></div></>);
  return (<Guard state={d}>{x => { const edit = can('m49.edit'); const s = x.summary; return (<>
    <PageHead eyebrow={`${t('tp.eyebrow')} · ${L(x.project.name)}`} title={t('tp.title', { year: x.project.plan_year })} subtitle={t('tp.subtitle')}>
      {x.plan && <StatusPill value={x.plan.status} />}
      <Btn icon="UsersRound" onClick={() => setPersonas(true)}>{t('tp.personas')}</Btn>
      {can('reports.export') && ['docx', 'pdf', 'xlsx'].map(f => <Btn key={f} icon="Download" onClick={() => download(`/projects/${project}/training-plan/export?format=${f}`, `training_plan.${f}`)}>{f.toUpperCase()}</Btn>)}
      {edit && x.plan && !['Approved', 'Locked'].includes(x.plan.status) && <Btn kind="primary" icon="Send" onClick={() => setSubmit(x.plan.status === 'In Review' ? 'Approved' : 'In Review')}>{x.plan.status === 'In Review' ? t('tp.approve') : t('tp.submit')}</Btn>}</PageHead>
    <div className="grid g-4">
      <Kpi icon="Layers" value={fmtNum(s.programs)} label={t('tp.programs')} emph={false} />
      <Kpi icon="GraduationCap" value={fmtNum(s.trainings)} label={t('tp.trainings')} note={t('tp.compliantN', { n: s.compliant, m: s.trainings })} />
      <Kpi icon="CalendarRange" value={fmtNum(s.halfDays)} label={t('tp.halfDaysTotal')} emph={false} />
      <Kpi icon="Users" value={fmtNum(s.trainingDays)} label={t('tp.trainingDays')} note={t('tp.trainingDaysHint')} emph={false} />
    </div>
    <div className="notice" style={{ margin: 'var(--aiv-space-4) 0' }}><Icon name="Scale" /><div><span className="strong">{t('tp.goldenTitle')}</span> {t('tp.goldenText')}</div></div>
    {x.programs.map(p => { const rows = x.courses.filter(c => c.program_id === p.id); return (<Card key={p.id} title={`${p.code} — ${L(p.name)}`} actions={edit && <Btn size="sm" icon="Plus" onClick={async () => { const c = await act(() => post(`/projects/${project}/trainings`, { program_id: p.id, name: { en: t('tp.newTraining'), fr: t('tp.newTraining'), ar: t('tp.newTraining') }, duration_days: 1 })); d.reload(); setOpen(c.id); }}>{t('tp.addTraining')}</Btn>}>
      {(p.axis || p.description) && <p className="small muted">{[L(p.axis), L(p.description)].filter(Boolean).join(' · ')}</p>}
      <DataTable rows={rows} search={false} onRow={r => setOpen(r.id)} csvName={p.code} columns={[
        { key: 'training_code', label: t('tp.trainingId') }, { key: 'name', label: t('tp.trainingName'), text: r => L(r.name) }, { key: 'level', label: t('tp.level'), text: r => t('level.' + r.level) },
        { key: 'duration_days', label: t('tp.duration'), num: true, value: r => t('tp.days', { n: r.duration_days }) }, { key: 'groups', label: t('tp.groups'), num: true },
        { key: 'prerequisites', label: t('tp.prerequisites'), text: r => L(r.prerequisites) || '—' },
        { key: 'rules', label: t('tp.rules'), render: r => (r.rules.ok ? <span className="pill s4 xs"><Icon name="Check" size={12} />{t('tp.rulesOk')}</span> : <span className="pill s1 xs" title={r.rules.issues.map(i => t('rule.' + i.code, i)).join('\n')}>{t('tp.rulesKo', { n: r.rules.issues.length })}</span>), text: r => (r.rules.ok ? 'OK' : r.rules.issues.length) },
        { key: 'status', label: t('col.status'), render: r => <StatusPill value={r.status} /> }]} empty={t('tp.noTrainings')} />
    </Card>); })}
    {edit && <Btn icon="FolderPlus" style={{ marginTop: 'var(--aiv-space-4)' }} onClick={() => setNewPrg(true)}>{t('tp.addProgram')}</Btn>}
    {!x.programs.length && <Empty icon="GraduationCap" title={t('tp.empty')} text={t('tp.emptyText')} />}
    {open && <TrainingEditor id={open} plan={x} edit={edit} onClose={() => setOpen(null)} onSaved={() => d.reload()} />}
    {personas && <Personas edit={edit} onClose={() => { setPersonas(false); d.reload(); }} />}
    {newPrg && <NewProgram project={project} onClose={() => setNewPrg(false)} onDone={() => { setNewPrg(false); d.reload(); }} />}
    {submit && <JustifyDialog title={submit === 'Approved' ? t('tp.approve') : t('tp.submit')} onCancel={() => setSubmit(null)} onConfirm={async n => { await act(() => post(`/projects/${project}/training-plan/submit`, { status: submit, _justification: n })); setSubmit(null); d.reload(); }} />}
  </>); }}</Guard>);
}

function NewProgram({ project, onClose, onDone }) {
  const { t } = useI18n(); const act = useAction(); const [name, setName] = useState(''); const [axis, setAxis] = useState('');
  return (<Modal title={t('tp.addProgram')} onClose={onClose} footer={<><Btn onClick={onClose}>{t('common.cancel')}</Btn><Btn kind="primary" disabled={!name.trim()} onClick={async () => { await act(() => post(`/projects/${project}/programs`, { name, axis })); onDone(); }}>{t('common.create')}</Btn></>}>
    <Field label={t('tp.programName')} id="pn"><input id="pn" className="input" value={name} onChange={e => setName(e.target.value)} /></Field>
    <Field label={t('tp.axis')} id="pa"><input id="pa" className="input" value={axis} onChange={e => setAxis(e.target.value)} /></Field></Modal>);
}

function TrainingEditor({ id, plan, edit, onClose, onSaved }) {
  const { t, L, lang } = useI18n(); const act = useAction(); const { can } = useSession();
  const objKeys = useRef([]); const objKey = i => { while (objKeys.current.length <= i) objKeys.current.push('o' + Math.random().toString(36).slice(2, 9)); return objKeys.current[i]; }; // stable keys (C2)
  const [c, setC] = useState(null); const [tab, setTab] = useState('agenda'); const [draft, setDraft] = useState(null); const [dirty, setDirty] = useState(false); const [approve, setApprove] = useState(false);
  useEffect(() => { get('/trainings/' + id).then(setC); }, [id]);
  if (!c) return null;
  const set = patch => { setC(x => ({ ...x, ...patch })); setDirty(true); };
  const rules = rulesOf(c);
  const setAgenda = ag => set({ agenda: ag.map((h, i) => ({ ...h, half_day: i + 1, label: halfLabelMl(i) })) });
  const item = (hi, ii, patch) => setAgenda(c.agenda.map((h, i) => (i !== hi ? h : { ...h, items: h.items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) })));
  const save = async (extra = {}) => { const { rules: _r, id: _i, entity, org_id, project_id, ref, version, created_at, updated_at, created_by, updated_by, ...body } = { ...c, ...extra }; const r = await act(() => put('/trainings/' + id, body)); setC(r); setDirty(false); onSaved(); return r; };
  const durationChange = v => { const n = Math.max(0.5, Math.round(Number(v) * 2) / 2); const need = n * 2; const ag = [...(c.agenda || [])];
    while (ag.length < need) ag.push({ items: [{ type: 'Lecture', title: { en: '', fr: '', ar: '' }, minutes: 90 }, { type: 'Quiz', title: { en: '', fr: '', ar: '' }, minutes: 20 }, { type: 'Workshop', title: { en: '', fr: '', ar: '' }, minutes: 90 }] });
    set({ duration_days: n }); setAgenda(ag.slice(0, need)); };
  const personas = plan.personas;
  const pf = pid => (c.personas || []).find(p => p.persona_id === pid);
  const setPf = (pid, patch) => set({ personas: pf(pid) ? c.personas.map(p => (p.persona_id === pid ? { ...p, ...patch } : p)) : [...(c.personas || []), { persona_id: pid, ...patch }] });
  return (<Modal wide title={`${c.training_code} — ${L(c.name)}`} onClose={() => { if (!dirty || window.confirm(t('common.discard'))) onClose(); }} footer={<>
    <span className={`pill ${rules.ok ? 's4' : 's1'}`}>{rules.ok ? t('tp.rulesOk') : t('tp.rulesKo', { n: rules.issues.length })}</span>
    {edit && can('ai.run') && <Btn icon="Sparkles" onClick={async () => setDraft(await act(() => post(`/trainings/${id}/ai-draft`, { duration_days: c.duration_days }), null))}>{t('tp.aiDraft')}</Btn>}
    {edit && c.status !== 'Approved' && <Btn disabled={!rules.ok || dirty} title={!rules.ok ? t('tp.fixRules') : dirty ? t('tp.saveFirst') : ''} onClick={() => setApprove(true)}>{t('tp.approveTraining')}</Btn>}
    {edit && <Btn kind="primary" disabled={!dirty} onClick={() => save()}>{t('common.save')}</Btn>}</>}>
    <div className="grid g-3">
      <Field label={t('tp.program')} id="tp1"><Select id="tp1" className="input" disabled={!edit} value={c.program_id} onChange={e => set({ program_id: e.target.value })}>{plan.programs.map(p => <option key={p.id} value={p.id}>{p.code} — {L(p.name)}</option>)}</Select></Field>
      <Field label={t('tp.trainingId')} id="tp2"><input id="tp2" className="input" disabled={!edit} value={c.training_code} onChange={e => set({ training_code: e.target.value })} /></Field>
      <Field label={t('tp.trainingName')} id="tp3"><input id="tp3" className="input" disabled={!edit} value={L(c.name)} onChange={e => set({ name: mlSet(c.name, lang, e.target.value) })} /></Field>
      <Field label={t('tp.level')} id="tp4" hint={t('tp.levelHint')}><input id="tp4" className="input" list="levels" disabled={!edit} value={LEVELS.includes(c.level) ? t('level.' + c.level) : c.level} onChange={e => { const v = e.target.value; const k = LEVELS.find(l => t('level.' + l) === v); set({ level: k || v }); }} /><datalist id="levels">{LEVELS.map(l => <option key={l} value={t('level.' + l)} />)}</datalist></Field>
      <Field label={t('tp.durationDays')} id="tp5" hint={t('tp.durationHint')}><input id="tp5" className="input" type="number" min="0.5" step="0.5" disabled={!edit} value={c.duration_days} onChange={e => durationChange(e.target.value)} /></Field>
      <Field label={t('tp.groups')} id="tp6"><input id="tp6" className="input" type="number" min="1" disabled={!edit} value={c.groups ?? 1} onChange={e => set({ groups: Number(e.target.value) })} /></Field>
    </div>
    <Field label={t('tp.prerequisites')} id="tp7"><input id="tp7" className="input" disabled={!edit} value={L(c.prerequisites)} onChange={e => set({ prerequisites: mlSet(c.prerequisites, lang, e.target.value) })} /></Field>
    <Field label={t('tp.objectives')}><div className="stack">{(c.objectives || []).map((o, i) => <div key={objKey(i)} className="row" style={{ flexWrap: 'nowrap' }}><input className="input" disabled={!edit} value={L(o)} onChange={e => set({ objectives: c.objectives.map((x, j) => (j === i ? mlSet(x, lang, e.target.value) : x)) })} aria-label={t('tp.objective') + ' ' + (i + 1)} />{edit && <Btn size="sm" kind="ghost" icon="Trash2" aria-label={t('common.delete')} onClick={() => { objKeys.current.splice(i, 1); set({ objectives: c.objectives.filter((_, j) => j !== i) }); }} />}</div>)}
      {edit && <div><Btn size="sm" icon="Plus" onClick={() => set({ objectives: [...(c.objectives || []), { en: '', fr: '', ar: '' }] })}>{t('tp.addObjective')}</Btn></div>}</div></Field>
    {!rules.ok && <div className="notice" style={{ margin: 'var(--aiv-space-3) 0' }}><Icon name="TriangleAlert" /><ul style={{ margin: 0, paddingInlineStart: 18 }}>{rules.issues.map((i, k) => <li key={k} className="small">{t('rule.' + i.code, i)}</li>)}</ul></div>}
    <Tabs value={tab} onChange={setTab} tabs={[{ id: 'agenda', label: t('tp.agenda'), count: (c.agenda || []).length }, { id: 'personas', label: t('tp.valuePropositionTab'), count: (c.personas || []).length }]} />
    {tab === 'agenda' && <div className="stack">{(c.agenda || []).map((h, hi) => { const n = ty => h.items.filter(x => x.type === ty).length; const ok = n('Quiz') === 1 && n('Workshop') === 1 && n('Lecture') >= 1; const mins = h.items.reduce((s, x) => s + (Number(x.minutes) || 0), 0);
      return (<section key={hi} className={`card halfday ${ok ? '' : 'bad'}`}><div className="card-head"><h4>{halfLabel(hi, t)}</h4><div className="row xs"><span className={`pill xs ${n('Quiz') === 1 ? 's4' : 's1'}`}>{t('item.Quiz')} {n('Quiz')}/1</span><span className={`pill xs ${n('Workshop') === 1 ? 's4' : 's1'}`}>{t('item.Workshop')} {n('Workshop')}/1</span><span className="muted">{mins} min</span></div></div>
        <div className="table-wrap"><table className="tbl"><tbody>{h.items.map((it, ii) => <tr key={ii}>
          <td style={{ width: 150 }}><Select className="input" disabled={!edit} value={it.type} onChange={e => item(hi, ii, { type: e.target.value })} aria-label={t('tp.itemType')}>{TYPES.map(ty => <option key={ty} value={ty}>{t('item.' + ty)}</option>)}</Select></td>
          <td><input className="input" disabled={!edit} value={L(it.title)} onChange={e => item(hi, ii, { title: mlSet(it.title, lang, e.target.value) })} aria-label={t('tp.itemTitle')} placeholder={t('tp.itemTitle')} /></td>
          <td style={{ width: 100 }}><input className="input" type="number" min="0" disabled={!edit} value={it.minutes || ''} onChange={e => item(hi, ii, { minutes: Number(e.target.value) })} aria-label={t('tp.minutes')} /></td>
          {edit && <td style={{ width: 90 }}><div className="row" style={{ flexWrap: 'nowrap' }}><Btn size="sm" kind="ghost" icon="ArrowUp" aria-label={t('common.up')} disabled={!ii} onClick={() => setAgenda(c.agenda.map((x, i) => (i !== hi ? x : { ...x, items: x.items.map((y, j) => (j === ii - 1 ? x.items[ii] : j === ii ? x.items[ii - 1] : y)) })))} /><Btn size="sm" kind="ghost" icon="Trash2" aria-label={t('common.delete')} onClick={() => setAgenda(c.agenda.map((x, i) => (i !== hi ? x : { ...x, items: x.items.filter((_, j) => j !== ii) })))} /></div></td>}</tr>)}</tbody></table></div>
        {edit && <div className="row">{TYPES.map(ty => <Btn key={ty} size="sm" kind="ghost" icon={TYPE_ICON[ty]} onClick={() => setAgenda(c.agenda.map((x, i) => (i !== hi ? x : { ...x, items: [...x.items, { type: ty, title: { en: '', fr: '', ar: '' }, minutes: ty === 'Quiz' ? 20 : 60 }] })))}>{t('tp.add', { type: t('item.' + ty) })}</Btn>)}</div>}
      </section>); })}</div>}
    {tab === 'personas' && <div className="stack"><p className="small muted">{t('tp.personaHint')}</p>{personas.map(p => { const v = pf(p.id); return (<section key={p.id} className="card"><label className="row"><input type="checkbox" disabled={!edit} checked={!!v} onChange={e => set({ personas: e.target.checked ? [...(c.personas || []), { persona_id: p.id, behaviour: p.behaviour, pain_points: p.pain_points, hopes: p.hopes, fit: { en: '', fr: '', ar: '' } }] : c.personas.filter(x => x.persona_id !== p.id) })} /><span className="strong">{L(p.name)}</span><span className="xs muted">{t('pop.' + p.population)}</span></label>
      {v && <div className="grid g-2" style={{ marginTop: 'var(--aiv-space-3)' }}>{['behaviour', 'pain_points', 'hopes', 'fit'].map(k => <Field key={k} label={t('tp.' + { behaviour: 'behaviour', pain_points: 'painPoints', hopes: 'hopes', fit: 'fit' }[k])} id={p.id + k}><textarea id={p.id + k} className="input" rows={3} disabled={!edit} value={L(v[k])} onChange={e => setPf(p.id, { [k]: mlSet(v[k], lang, e.target.value) })} /></Field>)}</div>}</section>); })}</div>}
    {draft && <Modal wide title={t('tp.aiDraftTitle')} onClose={() => { post(`/trainings/${id}/ai-outcome`, { outcome: 'Rejected' }); setDraft(null); }} footer={<><Btn onClick={() => { post(`/trainings/${id}/ai-outcome`, { outcome: 'Rejected' }); setDraft(null); }}>{t('ai.reject')}</Btn><Btn kind="primary" onClick={() => { set({ agenda: draft.agenda, objectives: draft.objectives, personas: draft.personas }); post(`/trainings/${id}/ai-outcome`, { outcome: 'Accepted' }); setDraft(null); }}>{t('tp.acceptDraft')}</Btn></>}>
      <p className="small"><span className="pill tint xs"><Icon name="Sparkles" size={12} />{draft.useCase} · {t('tp.engine', { e: draft.engine })}</span> {L(draft.checkpoint)}</p>
      <p className="small strong">{t('tp.objectives')}</p><ul>{draft.objectives.map((o, i) => <li key={i} className="small">{L(o)}</li>)}</ul>
      {draft.agenda.map((h, i) => <div key={i} className="small"><span className="strong">{L(h.label)}</span>: {h.items.map(x => `${t('item.' + x.type)} — ${L(x.title)} (${x.minutes} min)`).join(' · ')}</div>)}
      <p className="xs muted">{t('tp.draftRules', { ok: draft.rules.ok ? t('tp.rulesOk') : t('tp.rulesKo', { n: draft.rules.issues.length }) })}</p></Modal>}
    {approve && <JustifyDialog title={t('tp.approveTraining')} onCancel={() => setApprove(false)} onConfirm={async n => { setApprove(false); await save({ status: 'Approved', _justification: n }); }} />}
  </Modal>);
}

function Personas({ edit, onClose }) {
  const { t, L, lang } = useI18n(); const act = useAction(); const d = useData('/personas'); const [sel, setSel] = useState(null);
  const save = async () => { const { id, entity, org_id, project_id, ref, version, created_at, updated_at, created_by, updated_by, ...body } = sel; await act(() => (id ? put('/personas/' + id, body) : post('/personas', body))); setSel(null); d.reload(); };
  return (<Modal wide title={t('tp.personas')} onClose={onClose}>
    <p className="small muted">{t('tp.personasHint')}</p>
    <Guard state={d}>{rows => <DataTable rows={rows} search={false} onRow={r => setSel(r)} columns={[{ key: 'code', label: t('q.code') }, { key: 'name', label: t('col.name'), text: r => L(r.name) }, { key: 'population', label: t('q.population'), text: r => t('pop.' + r.population) }, { key: 'pain_points', label: t('tp.painPoints'), text: r => L(r.pain_points) }]} />}</Guard>
    {edit && <Btn icon="Plus" onClick={() => setSel({ code: '', name: { en: '', fr: '', ar: '' }, population: 'Custom', behaviour: { en: '', fr: '', ar: '' }, pain_points: { en: '', fr: '', ar: '' }, hopes: { en: '', fr: '', ar: '' } })}>{t('tp.addPersona')}</Btn>}
    {sel && <Modal title={L(sel.name) || t('tp.addPersona')} onClose={() => setSel(null)} footer={edit && <><Btn onClick={() => setSel(null)}>{t('common.cancel')}</Btn><Btn kind="primary" onClick={save}>{t('common.save')}</Btn></>}>
      <div className="grid g-2"><Field label={t('col.name')} id="pz1"><input id="pz1" className="input" disabled={!edit} value={L(sel.name)} onChange={e => setSel({ ...sel, name: mlSet(sel.name, lang, e.target.value) })} /></Field>
        <Field label={t('q.population')} id="pz2"><Select id="pz2" className="input" disabled={!edit} value={sel.population} onChange={e => setSel({ ...sel, population: e.target.value })}>{['DG', 'Management', 'Member', 'Custom'].map(p => <option key={p} value={p}>{t('pop.' + p)}</option>)}</Select></Field></div>
      {['behaviour', 'pain_points', 'hopes'].map(k => <Field key={k} label={t('tp.' + { behaviour: 'behaviour', pain_points: 'painPoints', hopes: 'hopes' }[k])} id={'pz' + k}><textarea id={'pz' + k} className="input" rows={3} disabled={!edit} value={L(sel[k])} onChange={e => setSel({ ...sel, [k]: mlSet(sel[k], lang, e.target.value) })} /></Field>)}
    </Modal>}
  </Modal>);
}
