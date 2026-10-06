// Organization Breakdown Structure (FR-DA-OBS-01..10) and role-based RACSI (FR-DA-GOV-09, -10). Functions group
// roles; a role has a mission and is held by people (holder, deputy, acting) with dates and an allocation; the OBS
// is shown by unit, by function, by person and as a chart, on any date. Holding an OBS role grants no permission.
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { post, put, del, api } from '../lib/api.js';
import { PageHead, Card, Guard, DataTable, StatusPill, Btn, Icon, useAction, Modal, JustifyDialog, Field, Tabs, Select, Empty, Seg } from '../components/ui.jsx';

const LANGS = ['en', 'fr', 'ar'];
const today = () => new Date().toISOString().slice(0, 10);

export function Obs() {
  const { t } = useI18n(); const [sp, setSp] = useSearchParams(); const tab = sp.get('tab') || 'roles';
  return (<>
    <PageHead eyebrow={t('nav.governance')} title={t('nav.obs')} subtitle={t('obs.subtitle')} />
    <div className="notice grey" style={{ marginBottom: 'var(--aiv-space-4)' }}><Icon name="Info" /><div className="small">{t('obs.noPermission')}</div></div>
    <Tabs value={tab} onChange={v => setSp({ tab: v })} tabs={[{ id: 'roles', label: t('obs.roles') }, { id: 'functions', label: t('obs.functions') }, { id: 'views', label: t('obs.views') }, { id: 'chart', label: t('obs.chart') }, { id: 'racsi', label: t('obs.racsi') }]} />
    <div style={{ marginTop: 'var(--aiv-space-4)' }}>
      {tab === 'roles' && <Roles />}{tab === 'functions' && <Functions />}{tab === 'views' && <Views />}{tab === 'chart' && <Chart />}{tab === 'racsi' && <RacsiMatrix />}
    </div></>);
}

function MlInputs({ id, label, value, onChange, required, rows }) {
  return (<div className="form-grid">{LANGS.map(l => <Field key={l} id={`${id}-${l}`} label={`${label} — ${l.toUpperCase()}`} required={required && l === 'en'} className={rows ? 'full' : ''}>
    {rows ? <textarea id={`${id}-${l}`} className="input" rows={rows} dir={l === 'ar' ? 'rtl' : 'ltr'} value={value?.[l] || ''} onChange={e => onChange({ ...value, [l]: e.target.value })} />
      : <input id={`${id}-${l}`} className="input" dir={l === 'ar' ? 'rtl' : 'ltr'} value={value?.[l] || ''} onChange={e => onChange({ ...value, [l]: e.target.value })} />}</Field>)}</div>);
}

function Functions() {
  const { t, L } = useI18n(); const { can } = useSession(); const act = useAction(); const d = useData('/obs-functions'); const [edit, setEdit] = useState(null);
  return (<Card title={t('obs.functions')} actions={can('obs.manage') && <Btn kind="primary" icon="Plus" onClick={() => setEdit({ name: { en: '', fr: '', ar: '' } })}>{t('obs.newFunction')}</Btn>}>
    <Guard state={d}>{rows => <DataTable id="obs-functions" rows={rows} onRow={can('obs.manage') ? r => setEdit({ ...r, description: r.description || { en: '', fr: '', ar: '' } }) : undefined} columns={[
      { key: 'code', label: t('col.code'), text: r => r.code || '—' }, { key: 'name', label: t('col.name'), text: r => L(r.name) }, { key: 'roles', label: t('obs.roles'), text: r => r.roles.map(x => L(x.name)).join(', ') || '—' },
      { key: 'status', label: t('col.status'), render: r => <StatusPill value={r.status || 'Active'} /> }, { key: 'version', label: t('ter.version'), num: true }]} empty={t('obs.noFunction')} />}</Guard>
    {edit && <Modal title={edit.id ? L(edit.name) : t('obs.newFunction')} onClose={() => setEdit(null)} footer={<>{edit.id && <Btn kind="ghost" icon="Trash2" onClick={async () => { await act(() => del('/obs-functions/' + edit.id), 'common.deleted'); setEdit(null); d.reload(); }}>{t('common.delete')}</Btn>}<span className="spacer" />
      <Btn onClick={() => setEdit(null)}>{t('common.cancel')}</Btn><Btn kind="primary" onClick={async () => { const b = { name: edit.name, code: edit.code, description: edit.description }; await act(() => (edit.id ? put('/obs-functions/' + edit.id, b) : post('/obs-functions', b)), 'common.saved'); setEdit(null); d.reload(); }}>{t('common.save')}</Btn></>}>
      <Field id="fn-code" label={t('col.code')} optional><input id="fn-code" className="input" value={edit.code || ''} onChange={e => setEdit(s => ({ ...s, code: e.target.value }))} /></Field>
      <MlInputs id="fn-name" label={t('col.name')} required value={edit.name} onChange={v => setEdit(s => ({ ...s, name: v }))} />
      <MlInputs id="fn-desc" label={t('col.description')} rows={2} value={edit.description} onChange={v => setEdit(s => ({ ...s, description: v }))} /></Modal>}
  </Card>);
}

function Roles() {
  const { t, L, fmtDate } = useI18n(); const { can } = useSession(); const act = useAction(); const [date, setDate] = useState(today());
  const d = useData(`/obs-roles?date=${date}`, [date]); const fns = useData('/obs-functions'); const dir = useData('/directory'); const [edit, setEdit] = useState(null); const [assign, setAssign] = useState(null); const [endA, setEndA] = useState(null);
  const empty = { name: { en: '', fr: '', ar: '' }, mission: { en: '', fr: '', ar: '' }, functions: [], code: '' };
  const save = async () => { const b = { name: edit.name, code: edit.code, mission: edit.mission, responsibilities: edit.responsibilities, competences: edit.competences, functions: edit.functions, reports_to: edit.reports_to || null };
    await act(() => (edit.id ? put('/obs-roles/' + edit.id, b) : post('/obs-roles', b)), 'common.saved'); setEdit(null); d.reload(); };
  return (<Card title={t('obs.roles')} actions={<div className="row"><Field id="obs-date" label={t('obs.asOf')}><input id="obs-date" type="date" className="input" value={date} onChange={e => setDate(e.target.value || today())} /></Field>
    {can('obs.manage') && <Btn kind="primary" icon="Plus" onClick={() => setEdit(empty)}>{t('obs.newRole')}</Btn>}</div>}>
    <Guard state={d}>{rows => <DataTable id="obs-roles" rows={rows} columns={[
      { key: 'code', label: t('col.code'), text: r => r.code || '—' }, { key: 'name', label: t('obs.role'), text: r => L(r.name) },
      { key: 'functions', label: t('obs.functions'), text: r => r.functions.map(f => L((fns.data || []).find(x => x.id === f)?.name) || '').filter(Boolean).join(', ') },
      { key: 'holders', label: t('obs.holders'), render: r => r.holders.length ? <span className="small">{r.holders.map(h => `${h.name}${h.holder_type !== 'Holder' ? ' (' + t('obs.ht.' + h.holder_type) + ')' : ''} · ${h.allocation}%`).join(' · ')}</span> : <StatusPill value="Vacant" level={2} />, text: r => r.holders.map(h => h.name).join(', ') },
      { key: 'act', label: '', render: r => can('obs.manage') && <div className="row"><Btn size="sm" icon="UserPlus" onClick={() => setAssign({ role_id: r.id, role: r, user_id: '', holder_type: 'Holder', allocation: 100, start_date: today(), end_date: '' })}>{t('obs.assign')}</Btn>
        <Btn size="sm" kind="ghost" icon="Pencil" aria-label={t('common.edit')} onClick={() => setEdit({ ...empty, ...r, mission: r.mission || empty.mission })} /></div> }]} empty={t('obs.noRole')} />}</Guard>
    {edit && <Modal size="lg" title={edit.id ? L(edit.name) : t('obs.newRole')} onClose={() => setEdit(null)} footer={<>{edit.id && <Btn kind="ghost" icon="Trash2" onClick={async () => { await act(() => api('/obs-roles/' + edit.id, { method: 'DELETE', body: {} }), 'common.deleted'); setEdit(null); d.reload(); }}>{t('common.delete')}</Btn>}<span className="spacer" />
      <Btn onClick={() => setEdit(null)}>{t('common.cancel')}</Btn><Btn kind="primary" disabled={!edit.functions.length} onClick={save}>{t('common.save')}</Btn></>}>
      <div className="stack"><Field id="role-code" label={t('col.code')} optional><input id="role-code" className="input" value={edit.code || ''} onChange={e => setEdit(s => ({ ...s, code: e.target.value }))} /></Field>
        <MlInputs id="role-name" label={t('obs.role')} required value={edit.name} onChange={v => setEdit(s => ({ ...s, name: v }))} />
        <Field id="role-fns" label={t('obs.functions')} required hint={t('obs.functionsHint')}><div className="row" style={{ flexWrap: 'wrap' }}>{(fns.data || []).map(f => <label key={f.id} className="check"><input type="checkbox" checked={edit.functions.includes(f.id)} onChange={e => setEdit(s => ({ ...s, functions: e.target.checked ? [...s.functions, f.id] : s.functions.filter(x => x !== f.id) }))} /> {L(f.name)}</label>)}</div></Field>
        <Field id="role-rep" label={t('obs.reportsTo')} optional><Select id="role-rep" value={edit.reports_to || ''} onChange={e => setEdit(s => ({ ...s, reports_to: e.target.value }))} options={[{ value: '', label: '—' }, ...(d.data || []).filter(r => r.id !== edit.id).map(r => ({ value: r.id, label: `${r.code || r.id.slice(0, 6)} (${L(r.name)})` }))]} /></Field>
        <MlInputs id="role-mission" label={t('obs.mission')} rows={2} value={edit.mission} onChange={v => setEdit(s => ({ ...s, mission: v }))} /></div></Modal>}
    {assign && <Modal title={`${t('obs.assign')} — ${L(assign.role.name)}`} onClose={() => setAssign(null)} footer={<><Btn onClick={() => setAssign(null)}>{t('common.cancel')}</Btn><Btn kind="primary" disabled={!assign.user_id} onClick={async () => { const { role, ...b } = assign; await act(() => post('/obs-assignments', b), 'obs.assigned'); setAssign(null); d.reload(); }}>{t('obs.assign')}</Btn></>}>
      <div className="form-grid"><Field id="as-user" label={t('obs.person')} required className="full"><Select id="as-user" value={assign.user_id} onChange={e => setAssign(s => ({ ...s, user_id: e.target.value }))} options={(dir.data || []).map(p => ({ value: p.id, label: `${p.name} (${p.title || p.email})` }))} placeholder={t('select.placeholder')} /></Field>
        <Field id="as-type" label={t('obs.holderType')}><Select id="as-type" value={assign.holder_type} onChange={e => setAssign(s => ({ ...s, holder_type: e.target.value }))} options={['Holder', 'Deputy', 'Acting'].map(v => ({ value: v, label: t('obs.ht.' + v) }))} /></Field>
        <Field id="as-alloc" label={t('obs.allocation')} hint={t('obs.allocationHint')}><input id="as-alloc" className="input" inputMode="numeric" value={assign.allocation} onChange={e => setAssign(s => ({ ...s, allocation: e.target.value }))} /></Field>
        <Field id="as-start" label={t('obs.start')}><input id="as-start" type="date" className="input" value={assign.start_date} onChange={e => setAssign(s => ({ ...s, start_date: e.target.value }))} /></Field>
        <Field id="as-end" label={t('obs.end')} optional><input id="as-end" type="date" className="input" value={assign.end_date} onChange={e => setAssign(s => ({ ...s, end_date: e.target.value }))} /></Field></div>
      {assign.role.holders.length > 0 && <div className="stack" style={{ marginTop: 'var(--aiv-space-4)' }}><div className="label">{t('obs.currentHolders')}</div>{assign.role.holders.map(h => <div key={h.id} className="row" style={{ justifyContent: 'space-between' }}><span className="small">{h.name} · {t('obs.ht.' + h.holder_type)} · {h.allocation}% · {fmtDate(h.start_date)}</span><Btn size="sm" onClick={() => setEndA(h)}>{t('obs.endAssignment')}</Btn></div>)}</div>}</Modal>}
    {endA && <JustifyDialog title={t('obs.endAssignment')} onCancel={() => setEndA(null)} onConfirm={async n => { const a = endA; setEndA(null); await act(() => put('/obs-assignments/' + a.id, { role_id: a.role_id, user_id: a.user_id, holder_type: a.holder_type, allocation: a.allocation, start_date: a.start_date, end_date: today(), _justification: n }), 'obs.ended'); setAssign(null); d.reload(); }} />}
  </Card>);
}

function Views() {
  const { t, L } = useI18n(); const [date, setDate] = useState(today()); const [by, setBy] = useState('function'); const d = useData(`/obs-views?date=${date}`, [date]);
  return (<Card title={t('obs.views')} actions={<div className="row"><Seg value={by} onChange={setBy} label={t('obs.views')} options={[{ id: 'function', label: t('obs.byFunction') }, { id: 'unit', label: t('obs.byUnit') }, { id: 'person', label: t('obs.byPerson') }]} />
    <Field id="v-date" label={t('obs.asOf')}><input id="v-date" type="date" className="input" value={date} onChange={e => setDate(e.target.value || today())} /></Field></div>}>
    <Guard state={d}>{x => <div className="stack">
      {x.vacant.length > 0 && <div className="notice"><Icon name="UserX" /><div className="small">{t('obs.vacantRoles', { n: x.vacant.length })}: {x.vacant.map(v => L(v.name)).join(', ')}</div></div>}
      {by === 'function' && x.byFunction.map(f => <section key={f.function.id}><h4>{L(f.function.name)}</h4><ul className="plain">{f.roles.map(r => <li key={r.id} className="small"><span className="strong">{L(r.name)}</span> — {r.holders.map(h => h.name).join(', ') || t('obs.vacant')}</li>)}{!f.roles.length && <li className="small muted">{t('obs.noRoleHere')}</li>}</ul></section>)}
      {by === 'unit' && x.byUnit.filter(u => u.roles.length).map(u => <section key={u.unit.id}><h4>{L(u.unit.name)} <span className="xs muted">· {u.unit.type}</span></h4><ul className="plain">{u.roles.map(r => <li key={r.id} className="small"><span className="strong">{L(r.name)}</span> — {r.holders.join(', ') || t('obs.vacant')}</li>)}</ul></section>)}
      {by === 'person' && <DataTable id="obs-byperson" rows={x.byPerson} rowKey={r => r.person.id} columns={[{ key: 'p', label: t('obs.person'), text: r => r.person.name }, { key: 'title', label: t('col.title'), text: r => r.person.title || '' },
        { key: 'roles', label: t('obs.roles'), text: r => r.roles.map(y => `${L(y.name)} (${y.allocation}%)`).join(', ') }, { key: 'load', label: t('obs.allocation'), num: true, value: r => r.roles.reduce((s, y) => s + Number(y.allocation || 0), 0) + '%' }]} />}
      {(by === 'person' ? !x.byPerson.length : false) && <Empty icon="Users" title={t('obs.noAssignment')} />}
    </div>}</Guard></Card>);
}

function Chart() {
  const { t, L } = useI18n(); const d = useData('/obs-views');
  return (<Card title={t('obs.chart')}><Guard state={d}>{x => { const kids = id => x.chart.filter(r => (r.reports_to || null) === id);

    const roots = x.chart.filter(r => !r.reports_to || !x.chart.some(y => y.id === r.reports_to));
    return roots.length ? <ul className="tree org-tree">{roots.map(r => <OrgNode key={r.id} r={r} ctx={{ t, L, kids }} />)}</ul> : <Empty icon="Network" title={t('obs.noRole')} />; }}</Guard></Card>);
}

/** Organization chart node at module scope (C1). */
function OrgNode({ r, ctx }) {
  const { t, L, kids } = ctx;
  return <li><div className={`org-node ${r.vacant ? 'vacant' : ''}`}><span className="strong small">{L(r.name)}</span><span className="xs muted">{r.holders.join(', ') || t('obs.vacant')}</span></div>{kids(r.id).length > 0 && <ul>{kids(r.id).map(k => <OrgNode key={k.id} r={k} ctx={ctx} />)}</ul>}</li>;
}

/** RACSI per macro process: one row per step, five letters, exactly one Accountable per row (FR-DA-GOV-10). */
function RacsiMatrix() {
  const { t, L } = useI18n(); const { can } = useSession(); const act = useAction(); const mps = useData('/catalog/mp'); const roles = useData('/obs-roles'); const dir = useData('/directory');
  const [mp, setMp] = useState('MP-01'); const d = useData(`/racsi/mp/${mp}`, [mp]); const [edit, setEdit] = useState(null);
  const options = useMemo(() => [...(roles.data || []).map(r => ({ value: 'role:' + r.id, label: `${L(r.name)} (${t('obs.role')})`, group: t('obs.roles') })), ...(dir.data || []).map(p => ({ value: 'user:' + p.id, label: `${p.name} (${p.title || ''})`, group: t('obs.people') }))], [roles.data, dir.data, L, t]);
  const label = v => options.find(o => o.value === v)?.label || v;
  return (<Card title={t('obs.racsi')} actions={<Field id="racsi-mp" label={t('pdm.kind.mp')}><Select id="racsi-mp" value={mp} onChange={e => setMp(e.target.value)} options={(mps.data || []).map(m => ({ value: m.id, label: `${m.id} (${L(m.name)})` }))} /></Field>}>
    <p className="small muted">{t('obs.racsiHint')}</p>
    <Guard state={d}>{x => <><div className="row" style={{ marginBottom: 'var(--aiv-space-3)' }}>{x.complete ? <StatusPill value="Complete" level={5} /> : <StatusPill value="Incomplete" level={2} />}<span className="xs muted">{t('obs.racsiRule')}</span></div>
      <div className="table-wrap"><table className="tbl"><caption className="sr-only">{t('obs.racsi')} {mp}</caption><thead><tr><th>{t('pdm.kind.step')}</th>{['R', 'A', 'C', 'S', 'I'].map(l => <th key={l} className="racsi-cell" data-tip={t('racsi.' + l)}>{l}</th>)}<th /></tr></thead>
        <tbody>{x.rows.map(r => <tr key={r.step.id}><td><span className="mono xs">{r.step.id}</span> {L(r.step.name)}{!r.ok && <div className="field-error"><Icon name="CircleAlert" size={12} />{t('err.oneAccountable')}</div>}</td>
          {['R', 'A', 'C', 'S', 'I'].map(l => <td key={l} className="small">{r.cells[l].map(label).join(', ') || '—'}</td>)}
          <td>{can('governance.manage') && <Btn size="sm" kind="ghost" icon="Pencil" aria-label={t('common.edit')} onClick={() => setEdit({ step: r.step, cells: { ...r.cells } })} />}</td></tr>)}</tbody></table></div></>}</Guard>
    {edit && <Modal title={`${edit.step.id} — ${L(edit.step.name)}`} onClose={() => setEdit(null)} footer={<><Btn onClick={() => setEdit(null)}>{t('common.cancel')}</Btn><Btn kind="primary" disabled={edit.cells.A.filter(Boolean).length !== 1} onClick={async () => { await act(() => put(`/racsi/mp/${mp}/${edit.step.id}`, { cells: edit.cells }), 'common.saved'); setEdit(null); d.reload(); }}>{t('common.save')}</Btn></>}>
      <div className="stack">{['R', 'A', 'C', 'S', 'I'].map(l => <Field key={l} id={`rc-${l}`} label={`${l} — ${t('racsi.' + l)}`} required={l === 'A'} hint={l === 'A' ? t('obs.racsiRule') : null}>
        <div className="stack">{edit.cells[l].map((v, i) => <div key={i} className="row"><Select id={i === 0 ? `rc-${l}` : undefined} value={v} options={options} onChange={e => setEdit(s => { const c = [...s.cells[l]]; c[i] = e.target.value; return { ...s, cells: { ...s.cells, [l]: c } }; })} /><Btn size="sm" kind="ghost" icon="X" aria-label={t('common.remove')} onClick={() => setEdit(s => ({ ...s, cells: { ...s.cells, [l]: s.cells[l].filter((_, k) => k !== i) } }))} /></div>)}
          {(l !== 'A' || edit.cells.A.length === 0) && <Btn size="sm" icon="Plus" onClick={() => setEdit(s => ({ ...s, cells: { ...s.cells, [l]: [...s.cells[l], ''] } }))}>{t('obs.addAssignee')}</Btn>}</div></Field>)}</div></Modal>}
  </Card>);
}
