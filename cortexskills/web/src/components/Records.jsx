import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { get, post, put, del } from '../lib/api.js';
import { Btn, DataTable, StatusPill, Modal, JustifyDialog, Tabs, useAction, Guard, Icon, AccessNotice, Select } from './ui.jsx';

let metaPromise = null;
export function useMeta() {
  const [meta, setMeta] = useState(null); const { me } = useSession();
  useEffect(() => { if (!metaPromise) metaPromise = get('/meta/entities'); metaPromise.then(setMeta).catch(() => { metaPromise = null; }); }, [me?.org?.id]);
  return meta;
}
export const resetMeta = () => { metaPromise = null; };
const GOVERNED = /(^|_)(status|score|rating|level|rank|priority|effectiveness|decision|approval_status|lifecycle|rag|verdict)($|_)/;
const LABEL_KEYS = ['name', 'title', 'label', 'statement', 'legal_name', 'code', 'condition'];

export function displayValue(v, L, t) {
  if (v == null || v === '') return '—';
  if (typeof v === 'boolean') return v ? t('common.yes') : t('common.no');
  if (Array.isArray(v)) return v.map(x => (x && typeof x === 'object' ? L(x.name || x.label || x.text || x.step || x) || JSON.stringify(x) : x)).join(', ');
  if (typeof v === 'object') return v.en !== undefined ? L(v) : JSON.stringify(v);
  if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);
  return String(v);
}
export const recordLabel = (r, L) => { for (const k of LABEL_KEYS) if (r[k] != null && r[k] !== '') return typeof r[k] === 'object' ? L(r[k]) : String(r[k]); return r.id?.slice(0, 8); };

/** List of an entity with create / edit / delete, versions and justification governance. */
export function RecordsView({ entity, project, columns, canCreate = true, filter, onOpen, extraActions, defaults, rowFilter }) {
  const { t, L } = useI18n(); const { me, toast } = useSession(); const meta = useMeta(); const def = meta?.find(m => m.name === entity);
  const qs = new URLSearchParams({ limit: '1000', ...(project ? { project } : {}), ...(filter || {}) }).toString();
  const d = useData(`/records/${entity}?${qs}`, [entity]); const [open, setOpen] = useState(null);
  if (meta && !def) return <AccessNotice error={{ message: t('err.unknownEntity', { entity }) }} />;
  const cols = columns || autoColumns(def, L, t);
  // Paste of complete records (FR-DA-MRE-19 – 22): one record per copied row, saved as one audited, undoable operation.
  const pasteCols = useMemo(() => (def ? def.fields.filter(f => !['json'].includes(f.type) && !f.computed).map(f => ({ key: f.name, label: t('field.' + f.name), required: !!f.required,
    type: f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'boolean' ? 'boolean' : f.type === 'enum' || f.currency ? 'select' : 'text',
    options: f.currency ? (me?.config?.config?.currencies || []).map(c => ({ value: c, label: c })) : f.type === 'enum' ? (f.options || []).map(o => ({ value: o, label: t('status.' + o) === 'status.' + o ? o : t('status.' + o) })) : undefined, aliases: [f.name.replace(/_/g, ' ')] })) : []), [def, t, me]);
  const [rejected, setRejected] = useState(null);
  const applyPaste = async ({ rows, format, mapping }) => {
    const res = await post('/bulk-entry/apply', { target: { kind: 'entity', entity, project: project || undefined }, format, mapping, rows: rows.map(r => ({ data: { ...(defaults || {}), ...r.data } })) });
    d.reload(); const n = res.created.length; const bad = res.rejected.length;
    toast(bad ? t('paste.appliedBad', { n, bad }) : t('paste.applied', { n }), bad ? 'warning' : 'ok', { duration: 10000, action: { label: t('common.undo'), onClick: async () => { try { await post(`/bulk-entry/${res.id}/undo`, {}); toast(t('paste.undone'), 'info'); d.reload(); } catch (e) { toast(e.message, 'error'); } } } });
    if (bad) setRejected(res.rejected.map(x => ({ ...x, data: rows[x.index]?.data || {} })));
  };
  const pasteCfg = def && !onOpen ? { columns: pasteCols, readOnly: !def.canWrite || me?.foreignReadOnly ? t('paste.readOnly') : null, apply: applyPaste } : null;
  return (<Guard state={!columns && !meta ? { loading: true } : d}>{data => <>
    <div className="row" style={{ justifyContent: 'flex-end', marginBottom: 'var(--aiv-space-3)' }}>{extraActions}
      {canCreate && def?.canWrite && <Btn kind="primary" icon="Plus" onClick={() => setOpen({ _new: true, ...(defaults || {}) })}>{t('common.new')}</Btn>}</div>
    <DataTable csvName={entity} title={def ? t('entity.' + entity) === 'entity.' + entity ? entity : t('entity.' + entity) : entity} rows={rowFilter ? data.items.filter(rowFilter) : data.items} columns={cols} onRow={r => (onOpen ? onOpen(r) : setOpen(r))} paste={pasteCfg} />
    {rejected && <Modal wide title={t('paste.rejectedTitle', { n: rejected.length })} onClose={() => setRejected(null)} footer={<Btn kind="primary" onClick={() => setRejected(null)}>{t('common.close')}</Btn>}>
      <p className="small">{t('paste.rejectedText')}</p>
      <div className="table-wrap auto-h"><table className="tbl compact"><thead><tr><th scope="col">{t('paste.row')}</th><th scope="col">{t('paste.values')}</th><th scope="col">{t('paste.errors')}</th></tr></thead>
        <tbody>{rejected.map(x => <tr key={x.index}><td className="mono xs">{x.index + 1}</td><td className="wrap-cell small">{Object.entries(x.data).filter(([, v]) => v !== '' && v != null).map(([k, v]) => `${t('field.' + k)}: ${v}`).join(' · ')}</td>
          <td className="wrap-cell">{Object.entries(x.errors).map(([k, e]) => <div key={k} className="field-error">{k === '_row' ? '' : t('field.' + k) + ' — '}{e}</div>)}</td></tr>)}</tbody></table></div></Modal>}
    {open && def && <RecordEditor def={def} record={open} project={project} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); d.reload(); }} />}
  </>}</Guard>);
}
export function autoColumns(def, L, t) {
  if (!def) return [];
  const f = def.fields.filter(x => !['json', 'longtext'].includes(x.type)).slice(0, 5);
  const first = { key: '_label', label: t('col.name'), text: r => recordLabel(r, L) };
  return [first, ...f.filter(x => !LABEL_KEYS.includes(x.name)).slice(0, 5).map(x => ({ key: x.name, label: t('field.' + x.name), render: r => (GOVERNED.test(x.name) && typeof r[x.name] === 'string' ? <StatusPill value={r[x.name]} /> : displayValue(r[x.name], L, t)), text: r => displayValue(r[x.name], L, t) }))];
}

export function RecordEditor({ def, record, project, onClose, onSaved }) {
  const { t, L, lang } = useI18n(); const { me } = useSession(); const act = useAction();
  const isNew = !!record._new; const [tab, setTab] = useState('fields');
  const init = useMemo(() => Object.fromEntries(def.fields.map(f => [f.name, record[f.name] ?? (f.type === 'boolean' ? false : '')])), [def, record]);
  const [form, setForm] = useState(init); const [justify, setJustify] = useState(false);
  const readOnly = !def.canWrite || me.foreignReadOnly || (!record.org_id && !isNew && def.global && !me.user.is_platform);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const payload = () => Object.fromEntries(def.fields.map(f => {
    let v = form[f.name];
    if (f.type === 'json' && typeof v === 'string') { try { v = v.trim() ? JSON.parse(v) : null; } catch { /* keep text */ } }
    if (f.ml && v && typeof v === 'object') v = v[lang] ?? v.en;
    return [f.name, v === '' ? null : v];
  }));
  const governedChanged = !isNew && def.fields.some(f => GOVERNED.test(f.name) && JSON.stringify(form[f.name]) !== JSON.stringify(init[f.name]));
  const save = async just => {
    const body = { ...payload(), _justification: just, ...(project ? { _project: project } : {}) };
    await act(() => (isNew ? post(`/records/${def.name}`, body) : put(`/records/${def.name}/${record.id}`, body)));
    onSaved();
  };
  const submit = () => (governedChanged && me.config?.config?.justification_required ? setJustify(true) : save(undefined));
  const remove = async () => { if (!window.confirm(t('common.confirmDelete'))) return; await act(() => del(`/records/${def.name}/${record.id}`), 'common.deleted'); onSaved(); };
  const dup = async () => { await act(() => post(`/records/${def.name}/${record.id}/duplicate`), 'common.duplicated'); onSaved(); };
  return (<Modal wide title={`${t('entity.' + def.name)} · ${isNew ? t('common.new') : recordLabel(record, L)}`} onClose={onClose}
    footer={tab === 'fields' && <>{!isNew && !readOnly && <><Btn kind="danger" icon="Trash2" onClick={remove}>{t('common.delete')}</Btn><Btn icon="Copy" onClick={dup}>{t('common.duplicate')}</Btn></>}<span style={{ flex: 1 }} /><Btn onClick={onClose}>{t('common.cancel')}</Btn>{!readOnly && <Btn kind="primary" onClick={submit}>{t('common.save')}</Btn>}</>}>
    {!isNew && <Tabs value={tab} onChange={setTab} tabs={[{ id: 'fields', label: t('records.fields') }, { id: 'versions', label: t('records.versions') }]} />}
    {tab === 'fields' ? <div className="form-grid">{def.fields.map(f => <FieldInput key={f.name} f={f} value={form[f.name]} onChange={v => set(f.name, v)} readOnly={readOnly} />)}
      {readOnly && <p className="muted small" style={{ gridColumn: '1 / -1' }}><Icon name="Lock" size={14} /> {t('records.readOnly')}</p>}</div>
      : <Versions entity={def.name} id={record.id} canWrite={!readOnly} onReverted={onSaved} />}
    {justify && <JustifyDialog onCancel={() => setJustify(false)} onConfirm={n => { setJustify(false); save(n); }} extra={<p className="small">{t('justify.governed')}</p>} />}
  </Modal>);
}

function FieldInput({ f, value, onChange, readOnly }) {
  const { t, L } = useI18n(); const { me } = useSession(); const id = 'f-' + f.name; const label = t('field.' + f.name) + (f.required ? ' *' : '');
  const refs = useData(f.type === 'ref' && f.ref && !['User', 'ObsNode', 'Organization', 'Project'].includes(f.ref) ? `/records/${f.ref}?limit=300` : null);
  const dir = useData(f.type === 'ref' && f.ref === 'User' ? '/directory' : null);
  const obs = useData(f.type === 'ref' && f.ref === 'ObsNode' ? '/obs' : null);
  let input;
  const common = { id, className: 'input', disabled: readOnly };
  const wide = ['json', 'longtext'].includes(f.type) || (f.type === 'text' && f.ml);
  // Amounts carry their currency: one of the currencies the Organization enables, its default when empty (FR-DA-I18N-09).
  if (f.currency) { const cur = me?.config?.config; return <div className="field"><label htmlFor={id}>{label}</label><Select {...common} value={value || cur?.currency || ''} onChange={e => onChange(e.target.value)} options={(cur?.currencies || []).map(c => ({ value: c, label: c }))} /><span className="hint">{t('cur.fieldHint', { c: cur?.currency || '' })}</span></div>; }
  switch (f.type) {
    case 'enum': input = <Select {...common} value={value ?? ''} onChange={e => onChange(e.target.value)}><option value="">—</option>{f.options.map(o => <option key={o} value={o}>{t('status.' + o)}</option>)}</Select>; break;
    case 'boolean': input = <label className="check"><input id={id} type="checkbox" disabled={readOnly} checked={!!value} onChange={e => onChange(e.target.checked)} />{value ? t('common.yes') : t('common.no')}</label>; break;
    case 'number': input = <input {...common} type="number" step="any" value={value ?? ''} onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))} />; break;
    case 'date': input = <input {...common} type="date" value={value ? String(value).slice(0, 10) : ''} onChange={e => onChange(e.target.value)} />; break;
    case 'datetime': input = <input {...common} type="datetime-local" value={value ? String(value).slice(0, 16) : ''} onChange={e => onChange(e.target.value ? new Date(e.target.value).toISOString() : '')} />; break;
    case 'ref': {
      const opts = f.ref === 'User' ? (dir.data || []).map(u => [u.id, u.name]) : f.ref === 'ObsNode' ? (obs.data || []).map(n => [n.id, L(n.name)]) : (refs.data?.items || []).map(r => [r.id, recordLabel(r, L)]);
      input = <Select {...common} value={value ?? ''} onChange={e => onChange(e.target.value)}><option value="">—</option>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}{value && !opts.find(o => o[0] === value) && <option value={value}>{String(value).slice(0, 8)}…</option>}</Select>; break; }
    case 'json': input = <textarea {...common} value={typeof value === 'string' ? value : JSON.stringify(value ?? null, null, 1)} onChange={e => onChange(e.target.value)} style={{ fontFamily: 'monospace', fontSize: 12 }} />; break;
    case 'longtext': input = <textarea {...common} value={L(value) || ''} onChange={e => onChange(e.target.value)} />; break;
    default: input = <input {...common} value={f.ml ? L(value) || '' : typeof value === 'object' && value ? L(value) : value ?? ''} onChange={e => onChange(e.target.value)} />;
  }
  return <div className="field" style={wide ? { gridColumn: '1 / -1' } : undefined}><label htmlFor={id}>{label}</label>{input}{f.rule && <span className="hint">{f.rule}</span>}</div>;
}

function Versions({ entity, id, canWrite, onReverted }) {
  const { t, L, fmtDate } = useI18n(); const d = useData(`/records/${entity}/${id}/versions`); const act = useAction();
  const [a, setA] = useState(null); const [b, setB] = useState(null); const [cmp, setCmp] = useState(null);
  const compareNow = async () => setCmp(await get(`/records/${entity}/${id}/compare?a=${a}&b=${b}`));
  return (<Guard state={d}>{vs => <div className="stack">
    <DataTable search={false} rows={vs} columns={[{ key: 'version', label: 'v', num: true }, { key: 'created_at', label: t('col.date'), text: v => fmtDate(v.created_at) }, { key: 'user_name', label: t('col.user'), text: v => v.user_name || '—' },
      { key: 'justification', label: t('col.justification'), text: v => v.justification || '—' }, { key: 'cur', label: '', noSort: true, render: v => v.is_current ? <span className="pill s4">{t('records.current')}</span> : canWrite && <Btn size="sm" onClick={async () => { await act(() => post(`/records/${entity}/${id}/revert`, { version: v.version, _justification: t('records.revertNote', { v: v.version }) }), 'records.reverted'); onReverted(); }}>{t('records.revert')}</Btn> }]} />
    {vs.length > 1 && <div className="row"><Select className="input" style={{ width: 120 }} value={a || ''} onChange={e => setA(e.target.value)} aria-label="A"><option value="">A</option>{vs.map(v => <option key={v.version} value={v.version}>v{v.version}</option>)}</Select>
      <Select className="input" style={{ width: 120 }} value={b || ''} onChange={e => setB(e.target.value)} aria-label="B"><option value="">B</option>{vs.map(v => <option key={v.version} value={v.version}>v{v.version}</option>)}</Select><Btn disabled={!a || !b} onClick={compareNow}>{t('records.compare')}</Btn></div>}
    {cmp && <DataTable search={false} rows={cmp} columns={[{ key: 'field', label: t('col.field'), render: r => <span className={r.changed ? 'strong' : ''}>{r.changed && <Icon name="Dot" />} {t('field.' + r.field)}</span> }, { key: 'a', label: `v${a}`, text: r => displayValue(r.a, L, t) }, { key: 'b', label: `v${b}`, render: r => <span style={r.changed ? { background: 'var(--aiv-azure-tint)', padding: '0 4px', borderRadius: 4 } : undefined}>{displayValue(r.b, L, t)}</span> }]} />}
  </div>}</Guard>);
}
