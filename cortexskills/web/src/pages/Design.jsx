// Process Design management (FR-DA-PDM-01..12, FR-DA-NAM-01..05, FR-DA-VER-07..09). The reference process design is
// read-only; an Organization edits its own copy element by element (copy-on-write), sees the naming warnings
// before saving, keeps every version with compare and restore, and freezes the design into releases that a second
// person publishes. Projects run on a published release.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { get, post, put, del, api, download } from '../lib/api.js';
import { PageHead, Card, Guard, DataTable, StatusPill, Btn, Icon, useAction, Modal, JustifyDialog, Field, Tabs, Seg, Search, Empty, KV, Brief } from '../components/ui.jsx';

const LANGS = ['en', 'fr', 'ar'];
const CHILD = { mp: 'task', task: 'step', e2e: 'uft' };
const ML_FIELDS = ['name', 'description', 'objective', 'goal', 'trigger', 'terminal', 'input', 'output', 'supplier', 'beneficiary', 'role', 'brief', 'details'];

export function ProcessDesign() {
  const { t } = useI18n(); const { can } = useSession(); const [sp, setSp] = useSearchParams(); const act = useAction();
  const tab = sp.get('tab') || 'elements'; const sel = sp.get('kind') && sp.get('id') ? { kind: sp.get('kind'), id: sp.get('id') } : null;
  const tree = useData('/design/tree'); const fileRef = useRef(null);
  const select = (kind, id) => setSp(s => { const n = new URLSearchParams(s); n.set('kind', kind); n.set('id', id); n.set('tab', 'elements'); return n; });
  const importFile = async file => { const text = await file.text(); let body; try { body = JSON.parse(text); } catch { body = null; }
    const r = await act(() => post('/design/import', body || {})); if (r) { tree.reload(); act(async () => r, 'pdm.imported'); } };
  return (<>
    <PageHead eyebrow={t('nav.process')} title={t('nav.processDesign')} subtitle={t('pdm.subtitle')}>
      <Btn icon="FileJson" onClick={() => download('/design/export', 'process-design.json')}>{t('pdm.exportJson')}</Btn>
      <Btn icon="Sheet" onClick={() => download('/design/export?format=xlsx', 'process-design.xlsx')}>{t('pdm.exportXlsx')}</Btn>
      {can('design.manage') && <><input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={e => e.target.files[0] && importFile(e.target.files[0])} /><Btn icon="Upload" onClick={() => fileRef.current.click()}>{t('pdm.import')}</Btn></>}
    </PageHead>
    <Tabs value={tab} onChange={v => setSp(s => { const n = new URLSearchParams(s); n.set('tab', v); return n; })} tabs={[{ id: 'elements', label: t('pdm.elements') }, { id: 'releases', label: t('pdm.releases') }, { id: 'changes', label: t('pdm.refChanges') }]} />
    <div style={{ marginTop: 'var(--aiv-space-4)' }}>
      {tab === 'elements' && <div className="split-pane"><Card title={t('pdm.tree')}><Guard state={tree}>{x => <DesignTree data={x} selected={sel} onSelect={select} />}</Guard></Card>
        {sel ? <ElementPanel key={sel.kind + sel.id} kind={sel.kind} id={sel.id} onChanged={tree.reload} onSelect={select} /> : <Card><Empty icon="MousePointerClick" title={t('pdm.pick')} text={t('pdm.pickText')} /></Card>}</div>}
      {tab === 'releases' && <Releases />}
      {tab === 'changes' && <ReferenceChanges onOpen={select} />}
    </div></>);
}

function DesignTree({ data, selected, onSelect }) {
  const { t, L } = useI18n(); const [view, setView] = useState('phase'); const [q, setQ] = useState(''); const [open, setOpen] = useState(() => new Set());
  const roots = view === 'phase' ? data.phases : data.mps;
  const match = n => !q || `${n.id} ${L(n.name)}`.toLowerCase().includes(q.toLowerCase()) || (n.children || []).some(match);
  const toggle = k => setOpen(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  return (<div className="stack">
    <Seg value={view} onChange={setView} label={t('pdm.view')} options={[{ id: 'phase', label: t('pdm.byPhase') }, { id: 'mp', label: t('pdm.byMp') }]} />
    <Search value={q} onChange={setQ} placeholder={t('pdm.filter')} />
    <ul className="tree" role="tree" aria-label={t('pdm.tree')}>{roots.filter(match).map(n => <DesignNode key={n.kind + n.id} n={n} ctx={{ t, L, q, open, toggle, match, selected, onSelect }} />)}</ul></div>);
}

/** Tree node at module scope: identity is stable across renders, so focus stays on the row (C1). */
function DesignNode({ n, ctx }) {
  const { t, L, q, open, toggle, match, selected, onSelect } = ctx; const k = n.kind + n.id; const kids = (n.children || []).filter(match); const isOpen = open.has(k) || (q && kids.length > 0); const cur = selected && selected.kind === n.kind && selected.id === n.id;
    return <li><div className="row" style={{ gap: 0 }}>{kids.length ? <button type="button" className="tree-toggle" aria-label={isOpen ? t('common.collapse') : t('common.expand')} aria-expanded={isOpen} onClick={() => toggle(k)}><Icon name={isOpen ? 'ChevronDown' : 'ChevronRight'} size={14} /></button> : <span className="tree-toggle" />}
      <button type="button" className={`tree-row ${n.status === 'Retired' ? 'excluded' : ''}`} aria-current={cur || undefined} onClick={() => onSelect(n.kind, n.id)}>
        <span className="mono xs">{n.no != null ? t('ws.phase', { n: n.no }) : n.id}</span><span style={{ flex: 1, minWidth: 0 }}>{L(n.name)}</span>
        {n.custom && <span className="pill xs tint">{t('pdm.custom')}</span>}{n.modified && <span className="pill xs">{t('pdm.modified')}</span>}</button></div>
      {isOpen && kids.length > 0 && <ul>{kids.map(c => <DesignNode key={c.kind + c.id} n={c} ctx={ctx} />)}</ul>}</li>;
}

function ElementPanel({ kind, id, onChanged, onSelect }) {
  const { t, L } = useI18n(); const { can } = useSession(); const act = useAction(); const d = useData(`/design/${kind}/${id}`, [kind, id]);
  const [tab, setTab] = useState('details'); const [confirm, setConfirm] = useState(null); const [child, setChild] = useState(false);
  const ro = !can('design.manage');
  const run = async (fn, msg) => { const r = await act(fn, msg); d.reload(); onChanged(); return r; };
  return (<Guard state={d}>{x => <Card>
    <div className="card-head"><div style={{ minWidth: 0 }}><div className="eyebrow">{t('pdm.kind.' + kind)} · {id}{x.parent ? ` · ${x.parent.id}` : ''}</div><h3>{L(x.element.name)}</h3>
      <div className="row" style={{ marginTop: 'var(--aiv-space-1)' }}><StatusPill value={x.status} />{x.custom && <span className="pill xs tint">{t('pdm.custom')}</span>}{x.modified && <span className="pill xs">{t('pdm.modified')}</span>}<span className="xs muted">{t('pdm.version', { v: x.version })}</span></div></div>
      {!ro && <div className="row">
        {CHILD[kind] && <Btn size="sm" icon="Plus" onClick={() => setChild(true)}>{t('pdm.addChild', { k: t('pdm.kind.' + CHILD[kind]) })}</Btn>}
        <Btn size="sm" icon="Copy" onClick={() => run(async () => { const r = await post(`/design/${kind}/${id}/duplicate`); onSelect(kind, r.id); return r; }, 'pdm.duplicated')}>{t('common.duplicate')}</Btn>
        {x.status === 'Retired' ? <Btn size="sm" icon="RotateCcw" onClick={() => setConfirm('reactivate')}>{t('pdm.reactivate')}</Btn> : <Btn size="sm" icon="Archive" onClick={() => setConfirm('retire')}>{t('pdm.retire')}</Btn>}
        {x.custom && <Btn size="sm" kind="ghost" icon="Trash2" onClick={() => setConfirm('delete')}>{t('common.delete')}</Btn>}</div>}</div>
    <Tabs value={tab} onChange={setTab} tabs={[{ id: 'details', label: t('pdm.details') }, ...(x.form ? [{ id: 'form', label: t('pdm.form') }] : []), { id: 'usage', label: t('pdm.usage') }, { id: 'versions', label: t('pdm.versions') }, ...(kind === 'step' ? [{ id: 'context', label: t('pdm.context') }] : [])]} />
    <div style={{ marginTop: 'var(--aiv-space-4)' }}>
      {tab === 'details' && <ElementForm kind={kind} id={id} x={x} readOnly={ro || x.status === 'Retired'} onSaved={() => { d.reload(); onChanged(); }} />}
      {tab === 'form' && x.form && <StepFormPreview form={x.form} />}
      {tab === 'usage' && <Usage kind={kind} id={id} />}
      {tab === 'versions' && <Versions kind={kind} id={id} readOnly={ro} onRestored={() => { d.reload(); onChanged(); }} />}
      {tab === 'context' && <StepContext id={id} />}
    </div>
    {child && <NewElement kind={CHILD[kind]} parentKind={kind} parentId={id} onClose={() => setChild(false)} onCreated={r => { setChild(false); onChanged(); onSelect(CHILD[kind], r.id); }} />}
    {confirm && <JustifyDialog title={t('pdm.' + (confirm === 'delete' ? 'deleteTitle' : confirm))} onCancel={() => setConfirm(null)} onConfirm={async n => { const c = confirm; setConfirm(null);
      if (c === 'delete') { await act(() => api(`/design/${kind}/${id}`, { method: 'DELETE', body: { _justification: n } }), 'common.deleted'); onChanged(); onSelect(x.parent?.kind || 'mp', x.parent?.id || 'MP-01'); }
      else await run(() => post(`/design/${kind}/${id}/${c}`, { _justification: n }), 'common.saved'); }} />}
  </Card>}</Guard>);
}

/** Element form: one field per language; names are checked against the naming rules while the user works (NAM). */
function ElementForm({ kind, id, x, readOnly, onSaved }) {
  const { t, L } = useI18n(); const act = useAction(); const el = x.element;
  const fields = ML_FIELDS.filter(k => el[k] && typeof el[k] === 'object');
  const [v, setV] = useState(() => Object.fromEntries(fields.map(k => [k, { ...el[k] }]))); const [note, setNote] = useState('');
  const [warn, setWarn] = useState(x.warnings || []); const [pending, setPending] = useState(null);
  const dirty = fields.some(k => LANGS.some(l => (v[k]?.[l] || '') !== (el[k]?.[l] || '')));
  const check = async () => { const r = await post('/design/check-names', { kind, id, name: v.name, parent: x.parent?.id }).catch(() => null); if (r) setWarn(r.warnings); };
  const save = async (acceptWarnings = false) => {
    try { await put(`/design/${kind}/${id}`, { data: v, note, acceptWarnings }); setPending(null); setNote(''); act(async () => true, 'common.saved'); onSaved(); }
    catch (e) { if (e.code === 'err.namingWarnings') { setWarn(e.params.warnings); setPending(true); } else act(() => Promise.reject(e)); }
  };
  return (<div className="stack">
    {warn.length > 0 && <div className="notice"><Icon name="TriangleAlert" /><div><div className="strong small">{t('pdm.namingTitle')}</div><ul className="warn-list">{warn.map((w, i) => <li key={i}>{w.lang?.toUpperCase()} · {t('naming.' + w.code)}{w.detail ? ` (“${w.detail}”)` : ''}</li>)}</ul></div></div>}
    {fields.map(k => <fieldset key={k} className="card flat" disabled={readOnly}><legend className="label">{t('pdm.f.' + k)}</legend>
      <div className="form-grid">{LANGS.map(l => { const fid = `pdm-${k}-${l}`; const long = String(el[k]?.en || '').length > 90;
        return <Field key={l} id={fid} label={`${t('pdm.f.' + k)} — ${l.toUpperCase()}`} className={long ? 'full' : ''}>
          {long ? <textarea id={fid} className="input" rows={3} dir={l === 'ar' ? 'rtl' : 'ltr'} value={v[k]?.[l] || ''} onChange={e => setV(s => ({ ...s, [k]: { ...s[k], [l]: e.target.value } }))} />
            : <input id={fid} className="input" dir={l === 'ar' ? 'rtl' : 'ltr'} value={v[k]?.[l] || ''} onChange={e => setV(s => ({ ...s, [k]: { ...s[k], [l]: e.target.value } }))} onBlur={k === 'name' ? check : undefined} />}</Field>; })}</div></fieldset>)}
    {!fields.length && <KV items={Object.entries(el).filter(([, val]) => typeof val !== 'object').slice(0, 12).map(([key, val]) => [key, String(val)])} />}
    {!readOnly && <div className="row"><Field id="pdm-note" label={t('pdm.note')} hint={t('pdm.noteHint')} className="grow"><input id="pdm-note" className="input" value={note} onChange={e => setNote(e.target.value)} /></Field></div>}
    {!readOnly && <div className="row"><span className="spacer" />{pending && <Btn onClick={() => save(true)}>{t('pdm.keepAnyway')}</Btn>}<Btn kind="primary" icon="Save" disabled={!dirty} onClick={() => save(false)}>{t('common.save')}</Btn></div>}
  </div>);
}

function StepFormPreview({ form }) {
  const { t, L } = useI18n();
  return (<div className="stack"><KV items={[[t('pdm.formKind'), L(form.kindLabel)], [t('pdm.object'), L(form.object)], [t('pdm.pattern'), t('pdm.pattern.' + form.pattern)], [t('pdm.register'), form.register ? L(form.register.name) : '—']]} />
    <Brief brief={L(form.brief)} details={L(form.details)} />
    <div className="table-wrap"><table className="tbl"><thead><tr><th>{t('pdm.field')}</th><th>{t('pdm.fieldType')}</th><th>{t('pdm.required')}</th><th>{t('pdm.help')}</th></tr></thead>
      <tbody>{form.fields.map(f => <tr key={f.key}><td className="strong">{L(f.label)}</td><td>{t('pdm.type.' + f.type)}</td><td>{f.required ? '✓' : ''}</td><td className="small">{L(f.help)}</td></tr>)}</tbody></table></div></div>);
}

function Usage({ kind, id }) {
  const { t, L } = useI18n(); const d = useData(`/design/${kind}/${id}/usage`, [kind, id]);
  return (<Guard state={d}>{x => <div className="stack"><KV items={[[t('pdm.children'), String(x.children?.length ?? 0)], [t('pdm.releasesUsing'), (x.releases || []).map(r => r.code || r).join(', ') || '—'], [t('pdm.templatesUsing'), String(x.templates?.length ?? 0)], [t('pdm.running'), String(x.running ?? 0)], [t('pdm.projectsUsing'), String(x.projects ?? 0)]]} />
    <div className={`notice ${x.canDelete ? 'grey' : ''}`}><Icon name={x.canDelete ? 'Info' : 'ShieldAlert'} /><div className="small">{x.canDelete ? t('pdm.canDelete') : t('pdm.mustRetire')}</div></div>
    {x.children?.length > 0 && <ul className="plain">{x.children.map(c => <li key={c.id} className="small"><span className="mono">{c.id}</span> {L(c.name)}</li>)}</ul>}</div>}</Guard>);
}

function Versions({ kind, id, readOnly, onRestored }) {
  const { t, fmtDate } = useI18n(); const act = useAction(); const d = useData(`/design/${kind}/${id}/versions`, [kind, id]);
  const [pick, setPick] = useState([]); const [cmp, setCmp] = useState(null); const [restore, setRestore] = useState(null);
  const compare = async () => { const [a, b] = [...pick].sort((x, y) => x - y); setCmp(await get(`/design/${kind}/${id}/compare?a=${a}&b=${b}`)); };
  return (<Guard state={d}>{rows => <div className="stack">
    <DataTable id="pdm-versions" search={false} rows={rows} rowKey={r => String(r.version)} columns={[
      { key: 'pick', label: '', render: r => <input type="checkbox" aria-label={t('pdm.selectVersion', { v: r.version })} checked={pick.includes(r.version)} onChange={e => setPick(p => (e.target.checked ? [...p, r.version].slice(-2) : p.filter(v => v !== r.version)))} /> },
      { key: 'version', label: t('ter.version'), num: true, render: r => <span className="mono">v{r.version}{r.current ? ' ★' : ''}</span>, text: r => String(r.version) },
      { key: 'date', label: t('col.date'), value: r => (r.version === 0 ? t('pdm.reference') : fmtDate(r.date)), sortValue: r => r.date || '' }, { key: 'author', label: t('ter.author'), text: r => r.author || '—' },
      { key: 'note', label: t('pdm.note'), text: r => r.note || r.justification || '—' }, { key: 'status', label: t('col.status'), render: r => <StatusPill value={r.status || 'Active'} /> },
      { key: 'act', label: '', render: r => !readOnly && !r.current && <Btn size="sm" icon="RotateCcw" onClick={() => setRestore(r.version)}>{t('pdm.restore')}</Btn> }]} />
    <div className="row"><Btn icon="GitCompare" disabled={pick.length !== 2} onClick={compare}>{t('pdm.compare')}</Btn><span className="xs muted">{t('pdm.compareHint')}</span></div>
    {cmp && <div className="table-wrap"><table className="tbl"><caption className="sr-only">{t('pdm.compare')}</caption><thead><tr><th>{t('pdm.field')}</th><th>v{cmp.a}</th><th>v{cmp.b}</th></tr></thead>
      <tbody>{cmp.fields.filter(f => f.changed).map(f => <tr key={f.field} className="diff-row changed"><td className="mono xs">{f.field}</td><td className="small">{String(f.a ?? '—')}</td><td className="small">{String(f.b ?? '—')}</td></tr>)}
        {cmp.childrenChanged && <tr className="diff-row changed"><td className="mono xs">children</td><td className="small">{cmp.childrenA.join(', ')}</td><td className="small">{cmp.childrenB.join(', ')}</td></tr>}
        {!cmp.changed && !cmp.childrenChanged && <tr><td colSpan={3} className="small muted">{t('pdm.noDiff')}</td></tr>}</tbody></table></div>}
    {restore != null && <JustifyDialog title={t('pdm.restoreTitle', { v: restore })} onCancel={() => setRestore(null)} onConfirm={async n => { const v = restore; setRestore(null); await act(() => post(`/design/${kind}/${id}/restore`, { version: v, _justification: n }), 'pdm.restored'); d.reload(); onRestored(); }} />}
  </div>}</Guard>);
}

function StepContext({ id }) {
  const { t, L } = useI18n(); const d = useData(`/design/step/${id}/context`, [id]);
  return (<Guard state={d}>{x => <div className="stack"><KV items={[[t('pdm.kind.mp'), x.mp ? `${x.mp.id} (${L(x.mp.name)})` : '—'], [t('pdm.kind.e2e'), x.e2e.map(e => `${e.id} (${L(e.name)})`).join(', ') || '—'],
    [t('run.input'), x.inputs.map(L).join(' · ') || '—'], [t('run.output'), x.outputs.map(L).join(' · ') || '—'], [t('pdm.standards'), x.standards.map(s => `${s.standard} §${s.clause}`).join(' · ') || '—']]} />
    <div className="grid g-2"><div><div className="label">{t('nav.rules')}</div><ul className="plain">{x.rules.map(r => <li key={r.id} className="small"><span className="mono">{r.id}</span> {L(r.condition)}</li>)}{!x.rules.length && <li className="small muted">—</li>}</ul></div>
      <div><div className="label">{t('nav.controls')}</div><ul className="plain">{x.controls.map(c => <li key={c.id} className="small"><span className="mono">{c.id}</span> {L(c.name)}</li>)}{!x.controls.length && <li className="small muted">—</li>}</ul></div></div></div>}</Guard>);
}

function NewElement({ kind, parentKind, parentId, onClose, onCreated }) {
  const { t } = useI18n(); const act = useAction(); const [name, setName] = useState({ en: '', fr: '', ar: '' }); const [warn, setWarn] = useState([]); const [pending, setPending] = useState(false);
  const check = async () => { const r = await post('/design/check-names', { kind, name, parent: parentId }).catch(() => null); if (r) setWarn(r.warnings); };
  const create = async accept => { try { const r = await post(`/design/${kind}`, { parent_kind: parentKind, parent_id: parentId, data: { name }, acceptWarnings: accept }); act(async () => r, 'pdm.created'); onCreated(r); }
    catch (e) { if (e.code === 'err.namingWarnings') { setWarn(e.params.warnings); setPending(true); } else act(() => Promise.reject(e)); } };
  return (<Modal title={t('pdm.newTitle', { k: t('pdm.kind.' + kind) })} onClose={onClose} footer={<><Btn onClick={onClose}>{t('common.cancel')}</Btn>{pending && <Btn onClick={() => create(true)}>{t('pdm.keepAnyway')}</Btn>}<Btn kind="primary" disabled={!name.en.trim() && !name.fr.trim()} onClick={() => create(false)}>{t('common.create')}</Btn></>}>
    <p className="small">{t('pdm.newHint')}</p>
    {LANGS.map(l => <Field key={l} id={`new-${l}`} label={`${t('pdm.f.name')} — ${l.toUpperCase()}`} required={l === 'en'}><input id={`new-${l}`} className="input" dir={l === 'ar' ? 'rtl' : 'ltr'} value={name[l]} onChange={e => setName(s => ({ ...s, [l]: e.target.value }))} onBlur={check} /></Field>)}
    {warn.length > 0 && <div className="notice"><Icon name="TriangleAlert" /><ul className="warn-list">{warn.map((w, i) => <li key={i}>{w.lang?.toUpperCase()} · {t('naming.' + w.code)}{w.detail ? ` (“${w.detail}”)` : ''}</li>)}</ul></div>}
  </Modal>);
}

function Releases() {
  const { t, fmtDate } = useI18n(); const { can } = useSession(); const act = useAction(); const d = useData('/design/releases');
  const [creating, setCreating] = useState(false); const [name, setName] = useState(''); const [note, setNote] = useState(''); const [tr, setTr] = useState(null); const [cmp, setCmp] = useState(null);
  const ACTIONS = { Draft: ['refresh', 'submit'], 'In review': ['publish', 'reject'], Published: ['retire'] };
  return (<Card title={t('pdm.releases')} actions={can('design.release') && <Btn kind="primary" icon="PackagePlus" onClick={() => setCreating(true)}>{t('pdm.newRelease')}</Btn>}>
    <p className="small muted">{t('pdm.releasesHint')}</p>
    <Guard state={d}>{rows => <DataTable id="pdm-releases" rows={rows} columns={[{ key: 'code', label: t('col.code'), render: r => <span className="mono">{r.code}</span>, text: r => r.code }, { key: 'name', label: t('col.name') },
      { key: 'status', label: t('col.status'), render: r => <StatusPill value={r.status} /> }, { key: 'count', label: t('pdm.elementsCount'), num: true }, { key: 'author', label: t('ter.author') }, { key: 'approver', label: t('ter.approver'), text: r => r.approver || '—' },
      { key: 'published_at', label: t('pdm.publishedAt'), value: r => (r.published_at ? fmtDate(r.published_at) : '—'), sortValue: r => r.published_at || '' },
      { key: 'act', label: '', render: r => <div className="row">{can('design.release') && (ACTIONS[r.status] || []).map(a => <Btn key={a} size="sm" kind={a === 'publish' ? 'primary' : ''} onClick={() => setTr({ r, a })}>{t('pdm.rel.' + a)}</Btn>)}
        <Btn size="sm" kind="ghost" icon="GitCompare" aria-label={t('pdm.compareCurrent')} data-tip={t('pdm.compareCurrent')} onClick={async () => setCmp({ r, rows: await get(`/design/releases/${r.id}/compare?with=current`) })} /></div> }]} empty={t('pdm.noRelease')} />}</Guard>
    {creating && <Modal title={t('pdm.newRelease')} onClose={() => setCreating(false)} footer={<><Btn onClick={() => setCreating(false)}>{t('common.cancel')}</Btn><Btn kind="primary" disabled={!name.trim()} onClick={async () => { await act(() => post('/design/releases', { name, note }), 'pdm.releaseCreated'); setCreating(false); setName(''); setNote(''); d.reload(); }}>{t('common.create')}</Btn></>}>
      <Field id="rel-name" label={t('col.name')} required hint={t('pdm.releaseNameHint')}><input id="rel-name" className="input" value={name} onChange={e => setName(e.target.value)} /></Field>
      <Field id="rel-note" label={t('pdm.note')}><textarea id="rel-note" className="input" rows={3} value={note} onChange={e => setNote(e.target.value)} /></Field></Modal>}
    {tr && <JustifyDialog required={['reject', 'retire'].includes(tr.a)} title={`${t('pdm.rel.' + tr.a)} — ${tr.r.code}`} onCancel={() => setTr(null)} onConfirm={async n => { const x = tr; setTr(null); await act(() => post(`/design/releases/${x.r.id}/${x.a}`, { _justification: n }), 'common.saved'); d.reload(); }} />}
    {cmp && <Modal wide title={`${cmp.r.code} ↔ ${t('pdm.current')}`} onClose={() => setCmp(null)}>{cmp.rows.length ? <DataTable id="pdm-relcmp" rows={cmp.rows} rowKey={r => r.kind + r.id} columns={[{ key: 'change', label: t('pdm.change'), render: r => <StatusPill value={r.change} /> }, { key: 'kind', label: t('pdm.kindCol'), text: r => t('pdm.kind.' + r.kind) }, { key: 'id', label: 'ID' }, { key: 'a', label: cmp.r.code, num: true, value: r => 'v' + r.a }, { key: 'b', label: t('pdm.current'), num: true, value: r => 'v' + r.b }]} /> : <Empty icon="Check" title={t('pdm.noDiff')} />}</Modal>}
  </Card>);
}

function ReferenceChanges({ onOpen }) {
  const { t } = useI18n(); const d = useData('/design/reference-changes');
  return (<Card title={t('pdm.refChanges')}><p className="small muted">{t('pdm.refChangesHint')}</p>
    <Guard state={d}>{rows => <DataTable id="pdm-refch" rows={rows} rowKey={r => r.kind + r.element_id} onRow={r => onOpen(r.kind, r.element_id)} columns={[{ key: 'kind', label: t('pdm.kindCol'), text: r => t('pdm.kind.' + r.kind) }, { key: 'element_id', label: 'ID' }, { key: 'source_version', label: t('pdm.copiedFrom'), num: true, value: r => 'v' + (r.source_version || 0) }, { key: 'refVersion', label: t('pdm.referenceNow'), num: true, value: r => 'v' + r.refVersion }]} empty={t('pdm.noRefChanges')} />}</Guard></Card>);
}
void useEffect; void useMemo; void del;
