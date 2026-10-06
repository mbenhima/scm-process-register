// Project Template Blueprint editor (FR-DA-PTB-01..10): overview, processes and steps (include/exclude, rename,
// owner), custom elements, and the rules, controls, risks, alerts, KPIs and Reporting Plan of the template, each
// with its origin. Every change raises the template version; projects keep the version they were created from.
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { get, post, put, del, download } from '../lib/api.js';
import { PageHead, Card, Guard, DataTable, StatusPill, Btn, Icon, useAction, Modal, Field, Tabs, KV, Select, Kpi, Empty, Search } from '../components/ui.jsx';

const PARTS = ['rules', 'controls', 'risks', 'alerts', 'kpis', 'reporting'];

export function Blueprint() {
  const { id } = useParams(); const { t, L } = useI18n(); const { can } = useSession(); const act = useAction(); const nav = useNavigate();
  const d = useData(`/project-templates/${id}/blueprint`, [id]); const [tab, setTab] = useState('overview'); const [cmp, setCmp] = useState(null);
  const vs = useData(`/project-templates/${id}/versions`, [id]);
  const ro = !can('blueprints.manage');
  return (<Guard state={d}>{x => { const editable = !ro && (x.own || false) && x.status !== 'Retired';
    return (<>
      <PageHead eyebrow={`${t('nav.templates')} · ${x.code} · v${x.version}`} title={L(x.name)} subtitle={t('ptb.subtitle')}>
        <Link className="btn" to="/process/templates"><Icon name="ArrowLeft" />{t('nav.templates')}</Link>
        {['docx', 'pdf', 'xlsx'].map(f => <Btn key={f} icon="Download" onClick={() => download(`/project-templates/${id}/export?format=${f}`, `${x.code}-blueprint.${f}`)}>{f.toUpperCase()}</Btn>)}
        {!ro && <Btn icon="Copy" onClick={async () => { const r = await act(() => post(`/project-templates/${id}/duplicate`), 'ptb.duplicated'); if (r) nav('/process/templates/' + r.id); }}>{x.own ? t('common.duplicate') : t('ptb.customize')}</Btn>}
        {editable && x.status !== 'Published' && <Btn kind="primary" icon="BadgeCheck" onClick={async () => { await act(() => post(`/project-templates/${id}/status`, { status: 'Published' }), 'ptb.published'); d.reload(); vs.reload(); }}>{t('ptb.publish')}</Btn>}
        {editable && x.status === 'Published' && <Btn icon="Archive" onClick={async () => { await act(() => post(`/project-templates/${id}/status`, { status: 'Retired' }), 'common.saved'); d.reload(); }}>{t('pdm.retire')}</Btn>}
      </PageHead>
      {!x.own && <div className="notice grey" style={{ marginBottom: 'var(--aiv-space-4)' }}><Icon name="Lock" /><div className="small">{t('ptb.libraryReadOnly')}</div></div>}
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'overview', label: t('ptb.overview') }, { id: 'tree', label: t('ptb.processes') }, ...PARTS.map(p => ({ id: p, label: t('ptb.part.' + p), count: x.parts[p].length })), { id: 'versions', label: t('pdm.versions') }]} />
      <div style={{ marginTop: 'var(--aiv-space-4)' }}>
        {tab === 'overview' && <><div className="grid g-4"><Kpi icon="Layers" value={x.counts.phases} label={t('ptb.phases')} /><Kpi icon="Workflow" value={x.counts.e2e} label={t('ptb.e2e')} emph={false} /><Kpi icon="ListChecks" value={x.counts.tasks} label={t('ptb.tasks')} emph={false} /><Kpi icon="Footprints" value={x.counts.steps} label={t('ptb.steps')} emph={false} /></div>
          <Card title={t('ptb.overview')} className="mt"><KV items={[[t('col.code'), x.code], [t('col.status'), <StatusPill key="s" value={x.status} />], [t('col.mode'), t('mode.' + x.mode)], [t('col.focus'), t('focus.' + x.focus)], [t('col.vertical'), x.vertical_id || t('scope.Universal')], ...PARTS.map(p => [t('ptb.part.' + p), String(x.parts[p].length)])]} /></Card></>}
        {tab === 'tree' && <BlueprintTree x={x} id={id} editable={editable} onChanged={d.reload} />}
        {PARTS.includes(tab) && <PartTable part={tab} id={id} rows={x.parts[tab]} options={x.options} editable={editable} onChanged={d.reload} />}
        {tab === 'versions' && <Card><Guard state={vs}>{rows => <><DataTable id="ptb-versions" search={false} rows={rows} rowKey={r => String(r.version)} columns={[{ key: 'version', label: t('ter.version'), num: true, value: r => 'v' + r.version }, { key: 'created_at', label: t('col.date'), text: r => (r.created_at || '').slice(0, 16).replace('T', ' ') }, { key: 'author', label: t('ter.author'), text: r => r.author || '—' }, { key: 'justification', label: t('pdm.note'), text: r => r.justification || '—' },
          { key: 'c', label: '', render: r => r.version !== x.version && <Btn size="sm" icon="GitCompare" onClick={async () => setCmp(await get(`/project-templates/${id}/compare?a=${r.version}&b=${x.version}`))}>{t('pdm.compareCurrent')}</Btn> }]} />
          {cmp && <Modal size="lg" title={`v${cmp.a} ↔ v${cmp.b}`} onClose={() => setCmp(null)}>{cmp.changes.length ? <DataTable id="ptb-cmp" search={false} rows={cmp.changes.map((c, i) => ({ ...c, i }))} rowKey={r => String(r.i)} columns={[{ key: 'part', label: t('ptb.part'), text: r => t('ptb.part.' + r.part) }, { key: 'key', label: 'ID' }, { key: 'change', label: t('pdm.change'), render: r => <StatusPill value={r.change || 'changed'} /> }]} /> : <Empty icon="Check" title={t('pdm.noDiff')} />}</Modal>}</>}</Guard></Card>}
      </div></>); }}</Guard>);
}

function BlueprintTree({ x, id, editable, onChanged }) {
  const { t } = useI18n(); const act = useAction(); const [open, setOpen] = useState(() => new Set(['phase:1'])); const [q, setQ] = useState(''); const [edit, setEdit] = useState(null); const [custom, setCustom] = useState(null);
  const toggle = k => setOpen(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const include = async (n, v) => { await act(() => put(`/project-templates/${id}/blueprint/elements`, { ref: n.ref, included: v })); onChanged(); };
  const match = n => !q || `${n.code || ''} ${n.name}`.toLowerCase().includes(q.toLowerCase()) || (n.children || []).some(match);

  return (<Card title={t('ptb.processes')} actions={editable && <Btn size="sm" icon="Plus" onClick={() => setCustom({ parent: null, kind: 'phase', name: { en: '', fr: '', ar: '' } })}>{t('ptb.customPhase')}</Btn>}>
    <p className="small muted">{t('ptb.treeHint')}</p><Search value={q} onChange={setQ} placeholder={t('pdm.filter')} />
    <ul className="tree" style={{ marginTop: 'var(--aiv-space-3)' }}>{x.tree.filter(match).map(n => <BlueprintNode key={n.ref} n={n} ctx={{ t, open, q, toggle, match, editable, include, setEdit, setCustom, act, id, onChanged }} />)}</ul>
    {edit && <Modal title={edit.current} onClose={() => setEdit(null)} footer={<><Btn onClick={() => setEdit(null)}>{t('common.cancel')}</Btn><Btn kind="primary" onClick={async () => { const b = { ref: edit.ref, owner: edit.owner }; if (edit.name.en || edit.name.fr) b.name = edit.name; await act(() => put(`/project-templates/${id}/blueprint/elements`, b), 'common.saved'); setEdit(null); onChanged(); }}>{t('common.save')}</Btn></>}>
      {['en', 'fr', 'ar'].map(l => <Field key={l} id={`bp-n-${l}`} label={`${t('ptb.nameInTemplate')} — ${l.toUpperCase()}`} hint={l === 'en' ? t('ptb.nameHint') : null}><input id={`bp-n-${l}`} className="input" dir={l === 'ar' ? 'rtl' : 'ltr'} value={edit.name[l]} onChange={e => setEdit(s => ({ ...s, name: { ...s.name, [l]: e.target.value } }))} /></Field>)}
      <Field id="bp-owner" label={t('ptb.owner')}><input id="bp-owner" className="input" value={edit.owner} onChange={e => setEdit(s => ({ ...s, owner: e.target.value }))} /></Field></Modal>}
    {custom && <Modal title={t('ptb.addCustom')} onClose={() => setCustom(null)} footer={<><Btn onClick={() => setCustom(null)}>{t('common.cancel')}</Btn><Btn kind="primary" disabled={!custom.name.en && !custom.name.fr} onClick={async () => { await act(() => post(`/project-templates/${id}/blueprint/custom`, custom), 'ptb.customAdded'); setCustom(null); onChanged(); }}>{t('common.create')}</Btn></>}>
      <p className="small muted">{t('ptb.customHint')}</p>
      <Field id="ce-kind" label={t('ptb.kind')}><Select id="ce-kind" value={custom.kind} onChange={e => setCustom(s => ({ ...s, kind: e.target.value }))} options={(custom.parent ? ['mp', 'step'] : ['phase']).map(k => ({ value: k, label: t('pdm.kind.' + k) }))} /></Field>
      {['en', 'fr', 'ar'].map(l => <Field key={l} id={`ce-n-${l}`} label={`${t('col.name')} — ${l.toUpperCase()}`} required={l === 'en'}><input id={`ce-n-${l}`} className="input" dir={l === 'ar' ? 'rtl' : 'ltr'} value={custom.name[l]} onChange={e => setCustom(s => ({ ...s, name: { ...s.name, [l]: e.target.value } }))} /></Field>)}
      <Field id="ce-owner" label={t('ptb.owner')} optional><input id="ce-owner" className="input" value={custom.owner || ''} onChange={e => setCustom(s => ({ ...s, owner: e.target.value }))} /></Field></Modal>}
  </Card>);
}

/** Tree node at module scope (C1): ticking a box re-renders the tree without remounting it. */
function BlueprintNode({ n, ctx }) {
  const { t, open, q, toggle, match, editable, include, setEdit, setCustom, act, id, onChanged } = ctx; const kids = (n.children || []).filter(match); const isOpen = open.has(n.ref) || (q && kids.length);
    return <li><div className="row" style={{ gap: 0 }}>{kids.length ? <button type="button" className="tree-toggle" aria-expanded={!!isOpen} aria-label={isOpen ? t('common.collapse') : t('common.expand')} onClick={() => toggle(n.ref)}><Icon name={isOpen ? 'ChevronDown' : 'ChevronRight'} size={14} /></button> : <span className="tree-toggle" />}
      {editable && !n.custom ? <input type="checkbox" aria-label={t('ptb.include', { n: n.name })} checked={n.included} onChange={e => include(n, e.target.checked)} /> : <Icon name={n.custom ? 'Sparkle' : 'Check'} size={14} />}
      <span className={`tree-row ${n.included ? '' : 'excluded'}`} style={{ cursor: 'default' }}><span className="mono xs">{n.code || n.id || ''}</span><span style={{ flex: 1 }}>{n.name}</span>{n.renamed && <span className="pill xs">{t('ptb.renamed')}</span>}{n.custom && <span className="pill xs tint">{t('ptb.custom')}</span>}{n.owner && <span className="xs muted">{n.owner}</span>}</span>
      {editable && <><Btn size="sm" kind="ghost" icon="Pencil" aria-label={t('common.edit')} onClick={() => setEdit({ ref: n.ref, name: { en: '', fr: '', ar: '' }, owner: n.owner || '', current: n.name })} />
        {['phase', 'e2e', 'task'].includes(n.kind) && !n.custom && <Btn size="sm" kind="ghost" icon="Plus" aria-label={t('ptb.addCustom')} data-tip={t('ptb.addCustom')} onClick={() => setCustom({ parent: n.ref, kind: n.kind === 'task' ? 'step' : n.kind === 'e2e' ? 'mp' : 'mp', name: { en: '', fr: '', ar: '' } })} />}
        {n.custom && <Btn size="sm" kind="ghost" icon="Trash2" aria-label={t('common.delete')} onClick={async () => { await act(() => del(`/project-templates/${id}/blueprint/custom/${n.id}`), 'common.deleted'); onChanged(); }} />}</>}</div>
      {isOpen && kids.length > 0 && <ul>{kids.map(c => <BlueprintNode key={c.ref} n={c} ctx={ctx} />)}</ul>}</li>;
}

const COLS = {
  rules: (t, L) => [{ key: 'code', label: t('col.code') }, { key: 'condition', label: t('ptb.condition'), text: r => L(r.condition) }, { key: 'severity', label: t('ptb.severity') }, { key: 'step', label: t('pdm.kind.step'), text: r => r.step || '—' }],
  controls: (t, L) => [{ key: 'code', label: t('col.code') }, { key: 'name', label: t('col.name'), text: r => L(r.name) }, { key: 'type', label: t('ptb.type') }, { key: 'frequency', label: t('ptb.frequency'), text: r => L(r.frequency) || '—' }],
  risks: (t, L) => [{ key: 'code', label: t('col.code') }, { key: 'name', label: t('col.name'), text: r => L(r.name) }, { key: 'category', label: t('ptb.category'), text: r => L(r.category) }, { key: 'li', label: 'L × I', num: true, value: r => `${r.likelihood || '—'} × ${r.impact || '—'}` }],
  alerts: (t, L) => [{ key: 'code', label: t('col.code') }, { key: 'name', label: t('col.name'), text: r => L(r.name) }, { key: 'severity', label: t('ptb.severity') }, { key: 'enabled', label: t('ptb.enabled'), text: r => (r.enabled === false ? '—' : '✓') }],
  kpis: (t, L) => [{ key: 'code', label: t('col.code') }, { key: 'name', label: t('col.name'), text: r => L(r.name) }, { key: 'target', label: t('ptb.target'), text: r => String(r.target ?? '—') }],
  reporting: (t, L) => [{ key: 'name', label: t('ptb.report'), text: r => L(r.name) }, { key: 'audience', label: t('ptb.audience'), text: r => L(r.audience) }, { key: 'frequency', label: t('ptb.frequency'), text: r => t('freq.' + r.frequency) }, { key: 'format', label: t('ptb.format') }, { key: 'owner', label: t('ptb.owner') }],
};

function PartTable({ part, id, rows, options, editable, onChanged }) {
  const { t, L } = useI18n(); const act = useAction(); const [lib, setLib] = useState(null); const [edit, setEdit] = useState(null);
  const origin = r => <span className={`pill xs ${r.origin === 'ai' ? 'tint' : ''}`}>{t('ptb.origin.' + (r.origin || 'manual'))}</span>;
  const save = async row => { await act(() => post(`/project-templates/${id}/blueprint/${part}`, row), 'common.saved'); onChanged(); };
  const blank = part === 'reporting' ? { name: { en: '', fr: '', ar: '' }, audience: { en: '', fr: '', ar: '' }, frequency: 'Monthly', format: 'PDF', owner: '' } : { code: '', name: { en: '', fr: '', ar: '' } };
  return (<Card title={t('ptb.part.' + part)} actions={editable && <div className="row"><Btn size="sm" icon="Library" onClick={async () => setLib(await get(`/project-templates/${id}/blueprint/library/${part}`))}>{t('ptb.fromLibrary')}</Btn><Btn size="sm" icon="Plus" onClick={() => setEdit({ ...blank })}>{t('ptb.manual')}</Btn></div>}>
    <DataTable id={'ptb-' + part} rows={rows} rowKey={r => r.key} onRow={editable ? r => setEdit({ ...r }) : undefined} columns={[...COLS[part](t, L), { key: 'origin', label: t('ptb.originCol'), render: origin, text: r => r.origin },
      ...(editable ? [{ key: 'x', label: '', render: r => <Btn size="sm" kind="ghost" icon="Trash2" aria-label={t('common.delete')} onClick={async e => { e.stopPropagation(); await act(() => del(`/project-templates/${id}/blueprint/${part}/${encodeURIComponent(r.key)}`), 'common.deleted'); onChanged(); }} /> }] : [])]} empty={t('ptb.emptyPart')} />
    {lib && <Modal size="lg" title={t('ptb.fromLibrary')} onClose={() => setLib(null)}><DataTable id={'ptb-lib-' + part} rows={lib.filter(l => !rows.some(r => r.key === l.key))} rowKey={r => r.key} columns={[...COLS[part](t, L), { key: 'add', label: '', render: r => <Btn size="sm" icon="Plus" onClick={async () => { await save({ ...r, origin: 'library' }); setLib(ls => ls.filter(x => x.key !== r.key)); }}>{t('ptb.add')}</Btn> }]} /></Modal>}
    {edit && <Modal title={edit.key ? (edit.code || L(edit.name)) : t('ptb.manual')} onClose={() => setEdit(null)} footer={<><Btn onClick={() => setEdit(null)}>{t('common.cancel')}</Btn><Btn kind="primary" onClick={async () => { await save({ ...edit, origin: edit.origin || 'manual' }); setEdit(null); }}>{t('common.save')}</Btn></>}>
      <div className="form-grid">{part !== 'reporting' && <Field id="pt-code" label={t('col.code')}><input id="pt-code" className="input" value={edit.code || ''} onChange={e => setEdit(s => ({ ...s, code: e.target.value }))} /></Field>}
        {['en', 'fr', 'ar'].map(l => <Field key={l} id={`pt-n-${l}`} label={`${part === 'rules' ? t('ptb.condition') : part === 'reporting' ? t('ptb.report') : t('col.name')} — ${l.toUpperCase()}`} className="full"><input id={`pt-n-${l}`} className="input" dir={l === 'ar' ? 'rtl' : 'ltr'} value={(part === 'rules' ? edit.condition : edit.name)?.[l] || ''} onChange={e => setEdit(s => ({ ...s, [part === 'rules' ? 'condition' : 'name']: { ...(part === 'rules' ? s.condition : s.name), [l]: e.target.value } }))} /></Field>)}
        {part === 'reporting' && <><Field id="pt-aud" label={t('ptb.audience')} className="full"><input id="pt-aud" className="input" value={L(edit.audience) || ''} onChange={e => setEdit(s => ({ ...s, audience: { en: e.target.value, fr: e.target.value, ar: e.target.value } }))} /></Field>
          <Field id="pt-freq" label={t('ptb.frequency')}><Select id="pt-freq" value={edit.frequency} onChange={e => setEdit(s => ({ ...s, frequency: e.target.value }))} options={options.frequencies.map(f => ({ value: f, label: t('freq.' + f) }))} /></Field>
          <Field id="pt-fmt" label={t('ptb.format')}><Select id="pt-fmt" value={edit.format} onChange={e => setEdit(s => ({ ...s, format: e.target.value }))} options={options.formats.map(f => ({ value: f, label: f }))} /></Field>
          <Field id="pt-own" label={t('ptb.owner')}><input id="pt-own" className="input" value={edit.owner || ''} onChange={e => setEdit(s => ({ ...s, owner: e.target.value }))} /></Field></>}
        {part === 'kpis' && <Field id="pt-tgt" label={t('ptb.target')}><input id="pt-tgt" className="input" value={edit.target ?? ''} onChange={e => setEdit(s => ({ ...s, target: e.target.value }))} /></Field>}
        {(part === 'rules' || part === 'alerts') && <Field id="pt-sev" label={t('ptb.severity')}><Select id="pt-sev" value={edit.severity || 'Medium'} onChange={e => setEdit(s => ({ ...s, severity: e.target.value }))} options={['Low', 'Medium', 'High', 'Critical'].map(v => ({ value: v, label: t('sev.' + v) }))} /></Field>}
        {part === 'risks' && <><Field id="pt-l" label={t('ptb.likelihood')}><Select id="pt-l" value={String(edit.likelihood || 3)} onChange={e => setEdit(s => ({ ...s, likelihood: Number(e.target.value) }))} options={[1, 2, 3, 4, 5].map(v => ({ value: String(v), label: String(v) }))} /></Field><Field id="pt-i" label={t('ptb.impact')}><Select id="pt-i" value={String(edit.impact || 3)} onChange={e => setEdit(s => ({ ...s, impact: Number(e.target.value) }))} options={[1, 2, 3, 4, 5].map(v => ({ value: String(v), label: String(v) }))} /></Field></>}
      </div></Modal>}
  </Card>);
}
