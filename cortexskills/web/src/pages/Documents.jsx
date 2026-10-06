// Documented information (FR-DA-DOC, DGC, DCR, DFP; SRS 4.43 – 4.47). Documents are generated from a template
// library with the project's current data, edited section by section in a draft (overrides stay through
// regeneration), checked, submitted, published by a second person, versioned, compared and downloaded in Word,
// PDF and Excel. The master list and the documented information each standard requires are kept up to date.
import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { get, post, put, patch, del, api, download } from '../lib/api.js';
import { PageHead, Card, Guard, DataTable, StatusPill, Btn, Icon, useAction, Modal, JustifyDialog, Field, Select, Tabs, KV, Empty, Toggle } from '../components/ui.jsx';

const FORMATS = ['docx', 'pdf', 'xlsx'];

function ProjectPicker() {
  const { t, L } = useI18n(); const { projects, setProject } = useSession();
  return (<div className="notice grey"><Icon name="Info" /><div>{t('q.pickProject')} <Select style={{ maxWidth: 420, marginTop: 8 }} value="" onChange={e => setProject(e.target.value)} options={projects.map(p => ({ value: p.id, label: L(p.name) }))} placeholder="—" /></div></div>);
}

export function Documents() {
  const { t, L, fmtDate } = useI18n(); const { project, can } = useSession(); const nav = useNavigate(); const [sp] = useSearchParams();
  const d = useData(project ? `/projects/${project}/documents` : null, [project]); const [create, setCreate] = useState(() => !!sp.get('template')); const [latestOnly, setLatestOnly] = useState(true);
  const rows = useMemo(() => { if (!d.data) return []; if (!latestOnly) return d.data; const seen = new Set(); return d.data.filter(x => { const k = x.doc_type + x.lang; if (seen.has(k)) return false; seen.add(k); return true; }); }, [d.data, latestOnly]);
  return (<>
    <PageHead eyebrow={t('nav.reports')} title={t('nav.documents')} subtitle={t('doc.subtitle2')}>
      <Link className="btn" to="/documents/templates"><Icon name="FileCog" />{t('nav.docTemplates')}</Link><Link className="btn" to="/documents/master-list"><Icon name="ListOrdered" />{t('nav.masterList')}</Link>
      {project && can('documents.manage') && <Btn kind="primary" icon="FilePlus2" onClick={() => setCreate(true)}>{t('doc.new')}</Btn>}</PageHead>
    {!project ? <ProjectPicker /> : <Card>
      <div className="row" style={{ marginBottom: 'var(--aiv-space-3)' }}><Toggle id="doc-latest" checked={latestOnly} onChange={setLatestOnly} label={t('doc.latestOnly')} /></div>
      <Guard state={d}>{() => <DataTable id="documents" rows={rows} onRow={r => nav('/documents/' + r.id)} csvName="documents" columns={[
        { key: 'doc_type', label: t('col.code'), render: r => <span className="mono xs">{r.doc_type}</span>, text: r => r.doc_type }, { key: 'title', label: t('ter.docTitle') },
        { key: 'versionLabel', label: t('ter.version'), num: true, sortValue: r => r.version * 100 + r.minor }, { key: 'status', label: t('col.status'), render: r => <StatusPill value={r.status} />, text: r => r.status },
        { key: 'lang', label: t('q.language'), text: r => (r.lang || '').toUpperCase() }, { key: 'owner', label: t('doc.owner') },
        { key: 'next_review', label: t('doc.nextReview'), value: r => (r.next_review ? fmtDate(r.next_review) : '—'), sortValue: r => r.next_review || '' },
        { key: 'findings', label: t('doc.findings'), num: true, value: r => r.findings.length }]} empty={t('doc.none')} />}</Guard></Card>}
    {create && <NewDocument project={project} onClose={() => setCreate(false)} onCreated={r => nav('/documents/' + r.id)} initial={sp.get('template')} />}
  </>);
}

function NewDocument({ project, onClose, onCreated, initial }) {
  const { t, L, lang: ui } = useI18n(); const act = useAction(); const tpls = useData('/document-templates');
  const [mode, setMode] = useState('template'); const [code, setCode] = useState(initial || 'DT-TER'); const [lang, setLang] = useState(ui); const [title, setTitle] = useState('');
  const go = async () => { const r = await act(() => post(`/projects/${project}/documents`, mode === 'blank' ? { blank: true, title, lang } : { template: code, lang }), 'doc.generated'); if (r) onCreated(r); };
  return (<Modal title={t('doc.new')} onClose={onClose} footer={<><Btn onClick={onClose}>{t('common.cancel')}</Btn><Btn kind="primary" icon="FilePlus2" disabled={mode === 'blank' && !title.trim()} onClick={go}>{t('doc.generate')}</Btn></>}>
    <div className="stack"><Tabs value={mode} onChange={setMode} tabs={[{ id: 'template', label: t('doc.fromTemplate') }, { id: 'blank', label: t('doc.blank') }]} />
      {mode === 'template' ? <Field id="nd-tpl" label={t('doc.template')} hint={t('doc.templateHint')}><Select id="nd-tpl" value={code} onChange={e => setCode(e.target.value)} options={(tpls.data || []).map(x => ({ value: x.code, label: `${x.code} (${L(x.name)})`, group: L(x.categoryLabel) + (x.org ? ' · ' + t('doc.orgCopy') : '') }))} /></Field>
        : <Field id="nd-title" label={t('ter.docTitle')} required><input id="nd-title" className="input" value={title} onChange={e => setTitle(e.target.value)} /></Field>}
      <Field id="nd-lang" label={t('q.language')}><Select id="nd-lang" value={lang} onChange={e => setLang(e.target.value)} options={[{ value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }, { value: 'ar', label: 'العربية' }]} /></Field></div></Modal>);
}

/* ----------------------------------------------------------------------------------- document editor */
export function DocumentEditor() {
  const { id } = useParams(); const { t, L, fmtDate } = useI18n(); const { can, me } = useSession(); const act = useAction(); const nav = useNavigate();
  const d = useData(`/documents/${id}`, [id]); const [tab, setTab] = useState('content'); const [dlg, setDlg] = useState(null); const [regen, setRegen] = useState(null); const [cmp, setCmp] = useState(null);
  const run = async (fn, msg, after) => { const r = await act(fn, msg); if (r) { if (after) after(r); else d.reload(); } return r; };
  return (<Guard state={d}>{x => { const draft = x.status === 'Draft'; const edit = draft && can('documents.manage'); const ref = `${x.doc_type}-${x.id.slice(0, 4).toUpperCase()}`;
    return (<>
      <PageHead eyebrow={`${x.doc_type} · v${x.versionLabel} · ${(x.lang || '').toUpperCase()}`} title={x.title} subtitle={t('doc.meta', { a: x.author || '—', p: x.approver || '—', d: fmtDate(x.data_as_of) })}>
        <Link className="btn" to="/documents"><Icon name="ArrowLeft" />{t('nav.documents')}</Link>
        {FORMATS.map(f => <Btn key={f} icon="Download" onClick={() => download(`/documents/${x.id}/download?format=${f}`, `${ref}-v${x.versionLabel}.${f}`)}>{f.toUpperCase()}</Btn>)}
      </PageHead>
      <div className="row" style={{ marginBottom: 'var(--aiv-space-4)', flexWrap: 'wrap' }}><StatusPill value={x.status} />
        {x.staleness?.stale && <span className="pill s2">{t('doc.staleSince', { n: x.staleness.changed?.length || 0 })}</span>}
        {x.template?.newer && <span className="pill tint">{t('doc.templateNewer', { v: x.template.version })}</span>}
        <span className="spacer" />
        {can('documents.manage') && <><Btn icon="RefreshCw" onClick={async () => setRegen(await post(`/documents/${x.id}/regenerate`, { preview: true }))}>{t('doc.regenerate')}</Btn>
          <Btn icon="CopyPlus" onClick={() => run(() => post(`/documents/${x.id}/copy-version`, { major: !draft }), 'doc.copied', r => nav('/documents/' + r.id))}>{t('doc.newVersion')}</Btn></>}
        {draft && can('documents.manage') && <><Btn kind="ghost" icon="Trash2" onClick={() => setDlg('delete')}>{t('common.delete')}</Btn><Btn kind="primary" icon="Send" onClick={() => run(() => post(`/documents/${x.id}/submit`, {}), 'doc.submitted')}>{t('doc.submit')}</Btn></>}
        {x.status === 'In Review' && can('documents.approve') && <><Btn onClick={() => setDlg('reject')}>{t('doc.reject')}</Btn><Btn kind="primary" icon="BadgeCheck" disabled={x.author_id === me?.id} data-tip={x.author_id === me?.id ? t('err.selfApprove') : undefined} onClick={() => run(() => post(`/documents/${x.id}/publish`, {}), 'doc.published')}>{t('doc.publish')}</Btn></>}
        {['Published', 'In Review'].includes(x.status) && can('documents.approve') && <Btn onClick={() => setDlg('retire')}>{t('doc.retire')}</Btn>}</div>
      {x.findings.length > 0 && <div className="notice" style={{ marginBottom: 'var(--aiv-space-4)' }}><Icon name="ListChecks" /><div><div className="strong small">{t('doc.checks')}</div><ul className="warn-list">{x.findings.map((f, i) => <li key={i}>{f.blocking ? <span className="strong">{t('doc.blocking')} · </span> : null}{t('docf.' + f.code, { ...f, step: f.step || '—' })} — {f.location}</li>)}</ul></div></div>}
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'content', label: t('doc.content') }, { id: 'sections', label: t('doc.sections') }, { id: 'meta', label: t('doc.metadata') }, { id: 'versions', label: t('doc.versions'), count: x.versions.length }, { id: 'sources', label: t('doc.sources') }]} />
      <div style={{ marginTop: 'var(--aiv-space-4)' }}>
        {tab === 'content' && <DocContent doc={x} editable={edit} onChanged={d.reload} />}
        {tab === 'sections' && <SectionsEditor doc={x} editable={edit} onChanged={d.reload} />}
        {tab === 'meta' && <DocMeta doc={x} editable={can('documents.manage')} onChanged={d.reload} />}
        {tab === 'versions' && <Card><DataTable id="doc-versions" search={false} rows={x.versions} onRow={r => r.id !== x.id && nav('/documents/' + r.id)} columns={[{ key: 'versionLabel', label: t('ter.version'), render: r => <span className="mono">v{r.versionLabel}{r.id === x.id ? ' ★' : ''}</span>, text: r => r.versionLabel },
          { key: 'status', label: t('col.status'), render: r => <StatusPill value={r.status} /> }, { key: 'author', label: t('ter.author') }, { key: 'created_at', label: t('col.date'), value: r => fmtDate(r.created_at), sortValue: r => r.created_at }, { key: 'change_note', label: t('doc.changeNote'), text: r => r.change_note || '—' },
          { key: 'c', label: '', render: r => r.id !== x.id && <div className="row"><Btn size="sm" icon="GitCompare" onClick={async e => { e.stopPropagation(); setCmp(await get(`/documents/${x.id}/compare?with=${r.id}`)); }}>{t('pdm.compare')}</Btn>{can('documents.manage') && <Btn size="sm" icon="RotateCcw" onClick={e => { e.stopPropagation(); run(() => post(`/documents/${x.id}/restore`, { from: r.id }), 'pdm.restored', n => nav('/documents/' + n.id)); }}>{t('pdm.restore')}</Btn>}</div> }]} /></Card>}
        {tab === 'sources' && <Card><p className="small muted">{t('doc.sourcesHint')}</p><DataTable id="doc-sources" search={false} rows={x.sources.map((s, i) => ({ ...s, key: i }))} rowKey={r => String(r.key)} columns={[{ key: 'name', label: t('doc.source') }, { key: 'records', label: t('doc.records'), num: true }, { key: 'step', label: t('pdm.kind.step'), text: r => r.step || '—' }]} /></Card>}
      </div>
      {regen && <Modal size="lg" title={t('doc.regenerate')} onClose={() => setRegen(null)} footer={<><Btn onClick={() => setRegen(null)}>{t('common.cancel')}</Btn>{x.template?.newer && <Btn onClick={() => { setRegen(null); run(() => post(`/documents/${x.id}/regenerate`, { applyTemplate: true, major: !draft }), 'doc.regenerated', r => nav('/documents/' + r.id)); }}>{t('doc.applyTemplate')}</Btn>}
        <Btn kind="primary" onClick={() => { setRegen(null); run(() => post(`/documents/${x.id}/regenerate`, { major: !draft }), 'doc.regenerated', r => nav('/documents/' + r.id)); }}>{draft ? t('doc.regenMinor') : t('doc.regenMajor')}</Btn></>}>
        <p className="small">{t('doc.regenHint')}</p>{regen.changes.length ? <ul className="warn-list">{regen.changes.slice(0, 40).map((c, i) => <li key={i}>{c.section}: {t('doc.change.' + c.change, { a: c.rowsAdded || 0, r: c.rowsRemoved || 0 })}</li>)}</ul> : <Empty icon="Check" title={t('doc.noChange')} />}</Modal>}
      {cmp && <Modal size="lg" title={`v${cmp.a} ↔ v${cmp.b}`} onClose={() => setCmp(null)}>{cmp.changes.length ? <ul className="warn-list">{cmp.changes.map((c, i) => <li key={i}>{c.section}: {t('doc.change.' + c.change, { a: c.rowsAdded || 0, r: c.rowsRemoved || 0 })}</li>)}</ul> : <Empty icon="Check" title={t('doc.noChange')} />}</Modal>}
      {dlg === 'delete' && <JustifyDialog required={false} title={t('doc.deleteDraft')} onCancel={() => setDlg(null)} onConfirm={async () => { setDlg(null); await act(() => del('/documents/' + x.id), 'common.deleted'); nav('/documents'); }} />}
      {(dlg === 'reject' || dlg === 'retire') && <JustifyDialog title={t('doc.' + dlg)} onCancel={() => setDlg(null)} onConfirm={async n => { const a = dlg; setDlg(null); await run(() => post(`/documents/${x.id}/${a}`, { _justification: n }), 'common.saved'); }} />}
    </>); }}</Guard>);
}

/** Rendered draft: each section shows its data; text and table cells can be overridden for this document only. */
function DocContent({ doc, editable, onChanged }) {
  const { t } = useI18n(); const act = useAction(); const [ed, setEd] = useState(null);
  const sections = doc.model?.sections || [];
  const saveOv = async (sid, body) => { await act(() => put(`/documents/${doc.id}/overrides/${sid}`, body), 'doc.overrideSaved'); setEd(null); onChanged(); };
  return (<div className="doc-page" dir={doc.lang === 'ar' ? 'rtl' : 'ltr'}>
    {sections.map((s, i) => { const ov = doc.overrides[s.id];
      return <section key={s.id + i} className={s.overridden ? 'overridden' : ''}>
        <h2>{editable && !s.builtin && <span className="sec-actions"><Btn size="sm" kind="ghost" icon="PenLine" aria-label={t('doc.overrideText')} data-tip={t('doc.overrideText')} onClick={() => setEd({ s, text: s.text || '', title: s.heading || '' })} />{ov && <Btn size="sm" kind="ghost" icon="Undo2" aria-label={t('doc.clearOverride')} data-tip={t('doc.clearOverride')} onClick={() => saveOv(s.id, { clear: true })} />}</span>}{s.heading}</h2>
        {s.text && <p className={`small ${s.notice ? 'notice-text' : ''}`} style={{ whiteSpace: 'pre-line' }}>{s.text}</p>}
        {s.kv && <KV items={s.kv} />}
        {s.diagram && <p className="xs muted"><Icon name="Workflow" size={14} /> {t('doc.diagramNote', { n: s.diagram.nodes?.length || 0 })}</p>}
        {s.subsections && s.subsections.map((ss, k) => <div key={k}><h4>{ss.heading}</h4>{ss.text && <p className="small">{ss.text}</p>}</div>)}
        {s.table && <div className="table-wrap"><table className="tbl"><thead><tr>{s.table.columns.map((c, k) => <th key={k}>{c}</th>)}</tr></thead><tbody>{s.table.rows.slice(0, 60).map((r, k) => <tr key={k}>{r.map((c, j) => {
          const key = `${s.table.trace?.[k]?.id || k}|${j}`; const overridden = s.table.overridden?.includes(key);
          return <td key={j} className={overridden ? 'strong' : ''} style={{ whiteSpace: 'pre-line' }} onDoubleClick={editable ? () => setEd({ s, cell: { key, value: String(c ?? '') } }) : undefined} title={editable ? t('doc.cellHint') : undefined}>{String(c ?? '')}</td>; })}</tr>)}</tbody></table>
          {s.table.rows.length > 60 && <p className="xs muted">{t('doc.moreRows', { n: s.table.rows.length - 60 })}</p>}</div>}
      </section>; })}
    {!sections.length && <Empty icon="FileX" title={t('doc.emptyDoc')} />}
    {ed && <Modal title={ed.cell ? t('doc.overrideCell') : t('doc.overrideText')} onClose={() => setEd(null)} footer={<><Btn onClick={() => setEd(null)}>{t('common.cancel')}</Btn><Btn kind="primary" onClick={() => saveOv(ed.s.id, ed.cell ? { cell: ed.cell } : { text: ed.text, title: ed.title })}>{t('common.save')}</Btn></>}>
      <p className="small muted">{t('doc.overrideHint')}</p>
      {ed.cell ? <Field id="ov-cell" label={t('doc.value')}><textarea id="ov-cell" className="input" rows={3} value={ed.cell.value} onChange={e => setEd(s => ({ ...s, cell: { ...s.cell, value: e.target.value } }))} /></Field>
        : <><Field id="ov-title" label={t('doc.sectionTitle')}><input id="ov-title" className="input" value={ed.title} onChange={e => setEd(s => ({ ...s, title: e.target.value }))} /></Field>
          <Field id="ov-text" label={t('doc.sectionText')}><textarea id="ov-text" className="input" rows={8} value={ed.text} onChange={e => setEd(s => ({ ...s, text: e.target.value }))} /></Field></>}</Modal>}
  </div>);
}

/** Sections of a draft: add, rename, move, hide, duplicate, delete, format, picture (FR-DA-DCR-03, FR-DA-DFP). */
function SectionsEditor({ doc, editable, onChanged }) {
  const { t, L } = useI18n(); const act = useAction(); const [defs, setDefs] = useState(() => (doc.model?.defs || []).map(s => ({ ...s }))); const [dirty, setDirty] = useState(false); const fileRef = useRef(null); const [pic, setPic] = useState(null);
  const lang = doc.lang || 'en'; const set = next => { setDefs(next); setDirty(true); };
  const move = (i, d) => { const n = [...defs]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); set(n); };
  const add = type => set([...defs, { id: 's' + Date.now().toString(36), type, title: { en: t('doc.newSection'), fr: t('doc.newSection'), ar: t('doc.newSection') }, text: { en: '', fr: '', ar: '' }, ...(type === 'picture' ? { picture: { assetId: '', caption: '', width: 60, align: 'center' } } : {}) }]);
  const upload = async file => { const fd = new FormData(); fd.append('file', file); const r = await act(() => api('/document-assets', { method: 'POST', body: fd })); if (r) { const n = [...defs]; n[pic] = { ...n[pic], picture: { ...n[pic].picture, assetId: r.id } }; set(n); } setPic(null); };
  const titleOf = s => (typeof s.title === 'object' ? s.title?.[lang] || L(s.title) : s.title) || s.source || s.type;
  return (<Card title={t('doc.sections')} actions={editable && <div className="row"><Btn size="sm" icon="Type" onClick={() => add('text')}>{t('doc.addText')}</Btn><Btn size="sm" icon="Image" onClick={() => add('picture')}>{t('doc.addPicture')}</Btn><Btn size="sm" icon="Stamp" onClick={() => add('approval')}>{t('doc.addApproval')}</Btn>
    <Btn size="sm" kind="primary" icon="Save" disabled={!dirty} onClick={async () => { await act(() => put(`/documents/${doc.id}/sections`, { sections: defs }), 'common.saved'); setDirty(false); onChanged(); }}>{t('common.save')}</Btn></div>}>
    {!editable && <p className="small muted">{t('doc.readOnlyDraft')}</p>}
    <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={e => e.target.files[0] && upload(e.target.files[0])} />
    <ol className="plain">{defs.map((s, i) => <li key={s.id} className="card flat"><div className="row" style={{ flexWrap: 'wrap' }}>
      <span className="mono xs">{i + 1}</span><span className="pill xs">{t('doc.type.' + s.type)}</span>
      {editable && s.type !== 'builtin' ? <input className="input" style={{ flex: 1, minWidth: 200 }} aria-label={t('doc.sectionTitle')} value={titleOf(s)} onChange={e => { const n = [...defs]; n[i] = { ...s, title: { ...(typeof s.title === 'object' ? s.title : {}), [lang]: e.target.value } }; set(n); }} /> : <span className="strong small" style={{ flex: 1 }}>{titleOf(s)}</span>}
      {s.source && <span className="xs muted mono">{s.source}</span>}
      {editable && <span className="row"><Btn size="sm" kind="ghost" icon="ArrowUp" aria-label={t('doc.moveUp')} disabled={i === 0} onClick={() => move(i, -1)} /><Btn size="sm" kind="ghost" icon="ArrowDown" aria-label={t('doc.moveDown')} disabled={i === defs.length - 1} onClick={() => move(i, 1)} />
        <Btn size="sm" kind="ghost" icon={s.hidden ? 'EyeOff' : 'Eye'} aria-label={s.hidden ? t('doc.show') : t('doc.hide')} data-tip={s.hidden ? t('doc.show') : t('doc.hide')} onClick={() => { const n = [...defs]; n[i] = { ...s, hidden: !s.hidden }; set(n); }} />
        <Btn size="sm" kind="ghost" icon="Copy" aria-label={t('common.duplicate')} onClick={() => { const n = [...defs]; n.splice(i + 1, 0, { ...s, id: s.id + '-c' + Date.now().toString(36).slice(-3) }); set(n); }} />
        <Btn size="sm" kind="ghost" icon="Trash2" aria-label={t('common.delete')} onClick={() => set(defs.filter((_, k) => k !== i))} /></span>}</div>
      {editable && s.type === 'text' && !s.source && <textarea className="input" rows={3} aria-label={t('doc.sectionText')} style={{ marginTop: 'var(--aiv-space-2)' }} value={(typeof s.text === 'object' ? s.text?.[lang] : s.text) || ''} onChange={e => { const n = [...defs]; n[i] = { ...s, text: { ...(typeof s.text === 'object' ? s.text : {}), [lang]: e.target.value } }; set(n); }} />}
      {s.type === 'picture' && <div className="row" style={{ marginTop: 'var(--aiv-space-2)' }}>{s.picture?.assetId ? <img src={`/api/document-assets/${s.picture.assetId}`} alt={s.picture.caption || ''} style={{ maxHeight: 80 }} /> : <span className="xs muted">{t('doc.noPicture')}</span>}
        {editable && <><Btn size="sm" icon="Upload" onClick={() => { setPic(i); fileRef.current.click(); }}>{t('doc.uploadPicture')}</Btn><input className="input" style={{ width: 220 }} aria-label={t('doc.caption')} placeholder={t('doc.caption')} value={s.picture?.caption || ''} onChange={e => { const n = [...defs]; n[i] = { ...s, picture: { ...s.picture, caption: e.target.value } }; set(n); }} />
          <Select size="sm" aria-label={t('doc.width')} value={String(s.picture?.width || 60)} onChange={e => { const n = [...defs]; n[i] = { ...s, picture: { ...s.picture, width: Number(e.target.value) } }; set(n); }} options={[25, 40, 60, 80, 100].map(w => ({ value: String(w), label: w + '%' }))} /></>}</div>}
    </li>)}</ol></Card>);
}

function DocMeta({ doc, editable, onChanged }) {
  const { t } = useI18n(); const act = useAction(); const dir = useData('/directory'); const [m, setM] = useState({ title: doc.title, owner_id: doc.owner_id || '', review_frequency: doc.review_frequency || 'Annual', next_review: doc.next_review || '', retention: doc.retention || '', classification: doc.classification || '' });
  return (<Card title={t('doc.metadata')}><div className="form-grid">
    <Field id="dm-title" label={t('ter.docTitle')} className="full"><input id="dm-title" className="input" disabled={!editable} value={m.title} onChange={e => setM(s => ({ ...s, title: e.target.value }))} /></Field>
    <Field id="dm-owner" label={t('doc.owner')}><Select id="dm-owner" disabled={!editable} value={m.owner_id} onChange={e => setM(s => ({ ...s, owner_id: e.target.value }))} options={(dir.data || []).map(p => ({ value: p.id, label: `${p.name} (${p.title || ''})` }))} /></Field>
    <Field id="dm-freq" label={t('doc.reviewFrequency')}><Select id="dm-freq" disabled={!editable} value={m.review_frequency} onChange={e => setM(s => ({ ...s, review_frequency: e.target.value }))} options={['Quarterly', 'Semi-annual', 'Annual', 'Every two years', 'Every three years'].map(v => ({ value: v, label: t('freq.' + v) }))} /></Field>
    <Field id="dm-next" label={t('doc.nextReview')}><input id="dm-next" type="date" className="input" disabled={!editable} value={m.next_review} onChange={e => setM(s => ({ ...s, next_review: e.target.value }))} /></Field>
    <Field id="dm-ret" label={t('doc.retention')} hint={t('doc.retentionHint')}><input id="dm-ret" className="input" disabled={!editable} value={m.retention} onChange={e => setM(s => ({ ...s, retention: e.target.value }))} /></Field>
    <Field id="dm-cls" label={t('ter.classification')} className="full"><input id="dm-cls" className="input" disabled={!editable} value={m.classification} onChange={e => setM(s => ({ ...s, classification: e.target.value }))} /></Field></div>
    {editable && <div className="row" style={{ marginTop: 'var(--aiv-space-4)' }}><span className="spacer" /><Btn kind="primary" onClick={async () => { await act(() => patch(`/documents/${doc.id}`, m), 'common.saved'); onChanged(); }}>{t('common.save')}</Btn></div>}</Card>);
}

/* -------------------------------------------------------------------------------------- template library */
export function DocTemplates() {
  const { t, L } = useI18n(); const { can } = useSession(); const act = useAction(); const d = useData('/document-templates'); const [open, setOpen] = useState(null);
  return (<>
    <PageHead eyebrow={t('nav.reports')} title={t('nav.docTemplates')} subtitle={t('dtpl.subtitle')}><Link className="btn" to="/documents"><Icon name="ArrowLeft" />{t('nav.documents')}</Link><Link className="btn" to="/documents/layout"><Icon name="PanelsTopLeft" />{t('nav.docLayout')}</Link></PageHead>
    <Guard state={d}>{rows => <DataTable id="doc-templates" rows={rows} onRow={r => setOpen(r.id)} csvName="document_templates" columns={[{ key: 'code', label: t('col.code'), render: r => <span className="mono xs">{r.code}</span>, text: r => r.code },
      { key: 'name', label: t('col.name'), text: r => L(r.name) }, { key: 'category', label: t('dtpl.category'), text: r => L(r.categoryLabel) }, { key: 'e2e', label: t('pdm.kind.e2e'), text: r => (r.e2e || []).join(', ') || '—' },
      { key: 'org', label: t('dtpl.origin'), render: r => r.org ? <span className="pill xs tint">{t('doc.orgCopy')}</span> : <span className="pill xs">{t('dtpl.library')}</span>, text: r => (r.org ? 'org' : 'library') },
      { key: 'sectionsCount', label: t('doc.sections'), num: true }, { key: 'version', label: t('ter.version'), num: true }]} />}</Guard>
    {open && <TemplateDetail id={open} canEdit={can('templates.manage')} onClose={() => setOpen(null)} onChanged={() => d.reload()} act={act} />}
  </>);
}

function TemplateDetail({ id, canEdit, onClose, onChanged, act }) {
  const { t, L } = useI18n(); const nav = useNavigate(); const d = useData(`/document-templates/${id}`, [id]);
  return (<Modal size="lg" title={t('dtpl.template')} onClose={onClose}><Guard state={d}>{x => <div className="stack">
    <KV items={[[t('col.code'), x.code], [t('col.name'), L(x.name)], [t('dtpl.origin'), x.org ? t('doc.orgCopy') : t('dtpl.library')], [t('ter.version'), String(x.version)], [t('dtpl.formats'), (x.formats || []).join(', ').toUpperCase()]]} />
    <div className="table-wrap"><table className="tbl"><thead><tr><th>#</th><th>{t('doc.sectionTitle')}</th><th>{t('dtpl.kind')}</th><th>{t('doc.source')}</th></tr></thead><tbody>{(x.sections || []).map((s, i) => <tr key={s.id}><td>{i + 1}</td><td>{L(s.title) || '—'}</td><td>{t('doc.type.' + s.type)}</td><td className="mono xs">{s.source || '—'}</td></tr>)}</tbody></table></div>
    {x.drafts?.length > 0 && <div className="notice"><Icon name="Info" /><div className="small">{t('dtpl.draftsOlder', { n: x.drafts.length })}</div></div>}
    <div className="row"><span className="spacer" />
      {canEdit && !x.org && <Btn icon="Copy" onClick={async () => { await act(() => post(`/document-templates/${x.id}/copy`), 'dtpl.copied'); onChanged(); d.reload(); }}>{t('dtpl.copyToOrg')}</Btn>}
      {canEdit && <Btn icon="CopyPlus" onClick={async () => { await act(() => post(`/document-templates/${x.id}/duplicate`), 'common.saved'); onChanged(); }}>{t('common.duplicate')}</Btn>}
      <Btn kind="primary" icon="FilePlus2" onClick={() => nav(`/documents?template=${x.code}`)}>{t('doc.generate')}</Btn></div></div>}</Guard></Modal>);
}

/* ------------------------------------------------------------------------------------- organization layout */
export function DocLayout() {
  const { t } = useI18n(); const { can } = useSession(); const act = useAction(); const d = useData('/document-layout'); const [f, setF] = useState(null); const fileRef = useRef(null);
  const preview = async v => { const res = await api('/document-preview', { method: 'POST', body: { formatting: v }, raw: true }); const url = URL.createObjectURL(await res.blob()); window.open(url, '_blank', 'noopener'); };
  return (<><PageHead eyebrow={t('nav.reports')} title={t('nav.docLayout')} subtitle={t('dlay.subtitle')} />
    <Guard state={d}>{x => { const v = f || { ...x.effective, header: x.header || '', footer: x.footer || '', logoAsset: x.logoAsset || null }; const A = x.allowed; const set = p => setF({ ...v, ...p }); const ro = !can('layout.manage');
      const sel = (key, opts, fmt = o => String(o)) => <Field id={'dl-' + key} label={t('dlay.' + key)}><Select id={'dl-' + key} disabled={ro} value={String(v[key])} onChange={e => set({ [key]: typeof v[key] === 'number' ? Number(e.target.value) : e.target.value })} options={opts.map(o => ({ value: String(o), label: fmt(o) }))} /></Field>;
      const color = key => <Field id={'dl-' + key} label={t('dlay.' + key)}><div className="row" style={{ flexWrap: 'wrap', gap: 'var(--aiv-space-1)' }}>{A.colors.map(c => <button key={c} type="button" className="swatch" aria-label={'#' + c} aria-pressed={v[key] === c} disabled={ro} onClick={() => set({ [key]: c })} style={{ background: '#' + c }} />)}</div></Field>;
      return (<div className="grid split"><Card title={t('dlay.card')}><div className="form-grid">
        {sel('bodyFont', A.fonts)}{sel('bodySize', A.sizes, o => o + ' pt')}{sel('headingFont', A.fonts)}{sel('h1Size', A.sizes, o => o + ' pt')}{sel('align', A.align, o => t('dlay.al.' + o))}{sel('orientation', A.orientation, o => t('dlay.or.' + o))}{sel('margins', A.margins, o => o + ' mm')}{sel('logo', A.logo, o => t('dlay.lg.' + o))}
        {color('headingColor')}{color('tableHeader')}
        <Field id="dl-header" label={t('dlay.header')} className="full"><input id="dl-header" className="input" disabled={ro} value={v.header} onChange={e => set({ header: e.target.value })} /></Field>
        <Field id="dl-footer" label={t('dlay.footer')} className="full"><input id="dl-footer" className="input" disabled={ro} value={v.footer} onChange={e => set({ footer: e.target.value })} /></Field>
        <div className="full row"><Toggle id="dl-toc" checked={v.toc} disabled={ro} onChange={c => set({ toc: c })} label={t('dlay.toc')} /><Toggle id="dl-cover" checked={v.cover} disabled={ro} onChange={c => set({ cover: c })} label={t('dlay.cover')} /><Toggle id="dl-num" checked={v.numbering} disabled={ro} onChange={c => set({ numbering: c })} label={t('dlay.numbering')} /><Toggle id="dl-pn" checked={v.pageNumbers} disabled={ro} onChange={c => set({ pageNumbers: c })} label={t('dlay.pageNumbers')} /></div>
        {v.logo === 'uploaded' && <div className="full row"><input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={async e => { const file = e.target.files[0]; if (!file) return; const fd = new FormData(); fd.append('file', file); const r = await act(() => api('/document-assets', { method: 'POST', body: fd })); if (r) set({ logoAsset: r.id }); }} />
          {v.logoAsset && <img src={`/api/document-assets/${v.logoAsset}`} alt={t('dlay.logo')} style={{ maxHeight: 48 }} />}{!ro && <Btn icon="Upload" onClick={() => fileRef.current.click()}>{t('dlay.uploadLogo')}</Btn>}<span className="xs muted">{t('err.imageType')}</span></div>}</div>
        <div className="row" style={{ marginTop: 'var(--aiv-space-4)' }}><Btn icon="Eye" onClick={() => preview(v)}>{t('dlay.preview')}</Btn><span className="spacer" />{!ro && <Btn kind="primary" disabled={!f} onClick={async () => { await act(() => put('/document-layout', v), 'common.saved'); setF(null); d.reload(); }}>{t('common.save')}</Btn>}</div></Card>
        <Card title={t('doc.versions')}><p className="small muted">{t('dlay.versionsHint')}</p><ul className="plain">{x.versions.map(r => <li key={r.version} className="small">v{r.version} · {(r.created_at || '').slice(0, 10)} · {r.author}</li>)}{!x.versions.length && <li className="small muted">{t('dlay.default')}</li>}</ul></Card></div>); }}</Guard></>);
}

/* -------------------------------------------------------------------------- master list and standards */
export function MasterList() {
  const { t } = useI18n(); const { project } = useSession(); const nav = useNavigate();
  const ml = useData(project ? `/projects/${project}/master-list` : null, [project]); const di = useData(project ? `/projects/${project}/documented-information` : null, [project]); const [tab, setTab] = useState('master');
  return (<><PageHead eyebrow={t('nav.reports')} title={t('nav.masterList')} subtitle={t('ml.subtitle')}><Link className="btn" to="/documents"><Icon name="ArrowLeft" />{t('nav.documents')}</Link></PageHead>
    {!project ? <ProjectPicker /> : <><Tabs value={tab} onChange={setTab} tabs={[{ id: 'master', label: t('nav.masterList') }, { id: 'standards', label: t('ml.standards') }]} />
      <div style={{ marginTop: 'var(--aiv-space-4)' }}>{tab === 'master' ? <Card><Guard state={ml}>{x => <DataTable id="master-list" csvName="master_list" rows={x.rows.map((r, i) => ({ id: x.ids[i], cells: r }))} onRow={r => nav('/documents/' + r.id)} columns={x.columns.map((c, i) => ({ key: 'c' + i, label: c, text: r => String(r.cells[i] ?? '') }))} empty={t('doc.none')} />}</Guard></Card>
        : <Guard state={di}>{stds => <div className="stack">{stds.map(s => <Card key={s.standard} title={s.standard}><DataTable id={'di-' + s.standard} search={false} rows={s.items.map((x, i) => ({ ...x, key: i }))} rowKey={r => String(r.key)} columns={[{ key: 'clause', label: t('ml.clause') }, { key: 'kind', label: t('ml.kind'), text: r => t('ml.kind.' + r.kind) }, { key: 'title', label: t('ml.requirement') }, { key: 'template', label: t('doc.template'), render: r => <span className="mono xs">{r.template}</span>, text: r => r.template },
          { key: 'doc', label: t('nav.documents'), render: r => r.document ? <Link to={'/documents/' + r.document.id}><StatusPill value={r.document.status} /> v{r.document.version}</Link> : <Link className="btn sm" to={`/documents?template=${r.template}`}>{t('doc.generate')}</Link>, text: r => r.document?.status || '' }]} /></Card>)}</div>}</Guard>}</div></>}</>);
}
