// Generated documents (SRS 4.43 – 4.45): the Training Engineering Report of the project, generated from the data,
// checked, reviewed, published by a second person, downloadable in every version and format.
import { useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { get, post, del, download } from '../lib/api.js';
import { PageHead, Card, Guard, DataTable, StatusPill, Btn, Icon, useAction, Modal, JustifyDialog, Field, Select } from '../components/ui.jsx';

export function Documents() {
  const { t, L, lang, fmtDate } = useI18n(); const { project, projects, setProject, can } = useSession(); const act = useAction();
  const d = useData(project ? `/projects/${project}/documents` : null); const [view, setView] = useState(null); const [retire, setRetire] = useState(null); const [genLang, setGenLang] = useState(lang);
  if (!project) return (<><PageHead eyebrow={t('nav.reports')} title={t('nav.documents')} subtitle={t('doc.subtitle')} />
    <div className="notice grey"><Icon name="Info" /><div>{t('q.pickProject')} <Select className="input" style={{ maxWidth: 420, marginTop: 8 }} value="" onChange={e => setProject(e.target.value)}><option value="">—</option>{projects.map(p => <option key={p.id} value={p.id}>{L(p.name)}</option>)}</Select></div></div></>);
  const open = async r => setView(await get('/documents/' + r.id));
  return (<>
    <PageHead eyebrow={t('nav.reports')} title={t('nav.documents')} subtitle={t('doc.subtitle')}>
      {can('reports.export') && <><Select className="input" style={{ width: 'auto' }} value={genLang} onChange={e => setGenLang(e.target.value)} aria-label={t('q.language')}><option value="en">English</option><option value="fr">Français</option><option value="ar">العربية</option></Select>
        <Btn kind="primary" icon="FilePlus2" onClick={async () => { const r = await act(() => post(`/projects/${project}/documents`, { doc_type: 'TER', lang: genLang }), 'doc.generated'); d.reload(); setView(r); }}>{t('doc.generate')}</Btn></>}</PageHead>
    <Guard state={d}>{rows => <Card title={t('doc.ter')}><p className="small muted">{t('doc.terHint')}</p>
      <DataTable rows={rows} onRow={open} csvName="documents" columns={[{ key: 'version', label: t('ter.version'), num: true }, { key: 'status', label: t('col.status'), render: r => <span><StatusPill value={r.status} />{r.stale && <div className="xs muted">{t('doc.stale')}</div>}</span>, text: r => r.status },
        { key: 'lang', label: t('q.language'), text: r => (r.lang || '').toUpperCase() }, { key: 'author', label: t('ter.author') }, { key: 'approver', label: t('ter.approver'), text: r => r.approver || '—' },
        { key: 'data_as_of', label: t('ter.dataAsOf'), value: r => fmtDate(r.data_as_of), sortValue: r => r.data_as_of }, { key: 'findings', label: t('doc.findings'), num: true, value: r => r.findings.length }]} empty={t('doc.none')} /></Card>}</Guard>
    {view && <Modal wide title={`${view.title} · v${view.version}`} onClose={() => setView(null)} footer={<>
      {['docx', 'pdf', 'xlsx'].map(f => <Btn key={f} icon="Download" onClick={() => download(`/documents/${view.id}/download?format=${f}`, `TER.${f}`)}>{f.toUpperCase()}</Btn>)}
      {view.status === 'Draft' && can('reports.export') && <><Btn kind="ghost" icon="Trash2" onClick={async () => { if (window.confirm(t('common.confirmDelete'))) { await act(() => del('/documents/' + view.id)); setView(null); d.reload(); } }}>{t('common.delete')}</Btn>
        <Btn kind="primary" onClick={async () => { await act(() => post(`/documents/${view.id}/submit`, {})); setView(null); d.reload(); }}>{t('doc.submit')}</Btn></>}
      {view.status === 'In Review' && can('reports.export') && <Btn kind="primary" onClick={async () => { await act(() => post(`/documents/${view.id}/publish`, {})); setView(null); d.reload(); }}>{t('doc.publish')}</Btn>}
      {['Published', 'In Review'].includes(view.status) && can('reports.export') && <Btn onClick={() => setRetire(view)}>{t('doc.retire')}</Btn>}</>}>
      <div className="row" style={{ marginBottom: 'var(--aiv-space-3)' }}><StatusPill value={view.status} /><span className="small muted">{t('doc.meta', { a: view.author || '—', p: view.approver || '—', d: fmtDate(view.data_as_of) })}</span></div>
      {view.findings.length > 0 && <div className="notice" style={{ marginBottom: 'var(--aiv-space-3)' }}><Icon name="ListChecks" /><div><div className="strong">{t('doc.checks')}</div><ul style={{ margin: 0, paddingInlineStart: 18 }}>{view.findings.map((f, i) => <li key={i} className="small">{f.blocking ? '⛔ ' : ''}{t('docf.' + f.code, f)} — {f.location}</li>)}</ul></div></div>}
      <div className="doc-preview">{view.model.sections.map((s, i) => <section key={i}><h4>{s.heading}</h4>{s.text && <p className={`small ${/^(No data yet|Pas encore|لا توجد)/.test(s.text) ? 'notice-text' : ''}`} style={{ whiteSpace: 'pre-line' }}>{s.text}</p>}
        {s.table && <div className="table-wrap"><table className="tbl"><thead><tr>{s.table.columns.map((c, k) => <th key={k}>{c}</th>)}</tr></thead><tbody>{s.table.rows.slice(0, 40).map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j} style={{ whiteSpace: 'pre-line' }}>{String(c ?? '')}</td>)}</tr>)}</tbody></table></div>}</section>)}</div>
    </Modal>}
    {retire && <JustifyDialog title={t('doc.retire')} onCancel={() => setRetire(null)} onConfirm={async n => { await act(() => post(`/documents/${retire.id}/retire`, { _justification: n })); setRetire(null); setView(null); d.reload(); }} />}
  </>);
}
