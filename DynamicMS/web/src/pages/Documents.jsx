import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Download, FilePlus2, RefreshCw, Trash2, Pencil, ArrowUp, ArrowDown, Copy, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api, download } from '../lib/api.js';
import { PageHead, Card, Loading, ErrorBox, Status, Table, tx, Modal, Field, Search, Tabs, IconBadge } from '../components/ui.jsx';
import Attachments from '../components/Attachments.jsx';
import { NoProject } from './Home.jsx';

const TYPES = ['Policy', 'Scope', 'Manual', 'Procedure', 'Instruction', 'Sheet', 'Map', 'Plan', 'Register', 'Report', 'Matrix'];
const FREQS = ['Annual', 'Semi-annual', 'Quarterly', 'Monthly', 'Per event'];
const FMT = { PDF: 'pdf', DOCX: 'docx', XLSX: 'xlsx' };

export function DownloadButtons({ doc, formats, versionId, small = true }) {
  const { t, toast } = useApp();
  const list = formats?.length ? formats : ['PDF', 'DOCX'];
  const go = async (f) => { try { await download(`/documents/${doc.id}/download?format=${FMT[f]}${versionId ? `&version=${versionId}` : ''}`, `${doc.code}.${FMT[f]}`); } catch (e) { toast(e.message, 'error'); } };
  return <span className="row" style={{ gap: 4 }}>{list.filter(f => FMT[f]).map(f => <button key={f} type="button" className={`btn ${small ? 'btn-sm' : ''}`} onClick={(e) => { e.stopPropagation(); go(f); }} aria-label={t('Download {f}', { f })}><Download size={14} />{f}</button>)}</span>;
}

function NewDocument({ projectId, orgId, onClose }) {
  const { t, lang, toast } = useApp();
  const navigate = useNavigate();
  const { data: lib } = useData(`/orgs/${orgId}/doc-templates?projectId=${projectId}`);
  const [f, setF] = useState({ mode: 'template', templateCode: '', title: '', docType: 'Procedure', reviewFrequency: 'Annual', content: '' });
  const create = async () => {
    try {
      const body = f.mode === 'template' ? { templateCode: f.templateCode, title: f.title || undefined } : { title: f.title, docType: f.docType, reviewFrequency: f.reviewFrequency, content: f.content };
      const r = await api(`/projects/${projectId}/documents`, { method: 'POST', body });
      toast(t('Document created as draft {code}.', { code: r.code })); onClose(); navigate(`/documents/${r.id}`);
    } catch (e) { toast(e.message, 'error'); }
  };
  const applicable = (lib?.items || []).filter(x => x.applicable);
  return (
    <Modal wide title={t('New document')} onClose={onClose} footer={<><button className="btn" onClick={onClose}>{t('Cancel')}</button><button className="btn btn-primary" disabled={f.mode === 'template' ? !f.templateCode : !f.title} onClick={create}><FilePlus2 size={16} />{t('Create draft')}</button></>}>
      <div className="stack">
        <div className="row"><label className="checkbox"><input type="radio" name="mode" checked={f.mode === 'template'} onChange={() => setF({ ...f, mode: 'template' })} /><span>{t('From a template, filled with the project data')}</span></label><label className="checkbox"><input type="radio" name="mode" checked={f.mode === 'blank'} onChange={() => setF({ ...f, mode: 'blank' })} /><span>{t('Blank document')}</span></label></div>
        {f.mode === 'template' ? (
          <>
            <Field label={t('Template')} required>{(id) => <select id={id} className="select" value={f.templateCode} onChange={e => setF({ ...f, templateCode: e.target.value })}><option value="">{t('Choose a template…')}</option>{(lib?.categories || []).map(c => <optgroup key={c.id} label={tx(c.name, lang)}>{applicable.filter(x => x.category === c.id).map(x => <option key={x.code} value={x.code}>{x.code} — {tx(x.name, lang)}{x.mandatoryFor.length ? ` (${t('required')})` : ''}</option>)}</optgroup>)}</select>}</Field>
            {f.templateCode && <p className="small muted">{tx(applicable.find(x => x.code === f.templateCode)?.description, lang)}</p>}
            <Field label={t('Title (optional)')} hint={t('By default, the template name.')}>{(id) => <input id={id} className="input" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />}</Field>
          </>
        ) : (
          <>
            <Field label={t('Title')} required>{(id) => <input id={id} className="input" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />}</Field>
            <div className="form-grid">
              <Field label={t('Type')}>{(id) => <select id={id} className="select" value={f.docType} onChange={e => setF({ ...f, docType: e.target.value })}>{TYPES.map(x => <option key={x} value={x}>{x}</option>)}</select>}</Field>
              <Field label={t('Review frequency')}>{(id) => <select id={id} className="select" value={f.reviewFrequency} onChange={e => setF({ ...f, reviewFrequency: e.target.value })}>{FREQS.map(x => <option key={x} value={x}>{x}</option>)}</select>}</Field>
            </div>
            <Field label={t('Content')}>{(id) => <textarea id={id} className="textarea" style={{ minHeight: 160 }} value={f.content} onChange={e => setF({ ...f, content: e.target.value })} />}</Field>
          </>
        )}
      </div>
    </Modal>
  );
}

function DocList({ projectId, orgId }) {
  const { t, L, lang, fmtDate, can, readOnly } = useApp();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useData(`/projects/${projectId}/documents`);
  const [q, setQ] = useState(''); const [nw, setNw] = useState(false); const [type, setType] = useState('');
  const soon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const rows = (data || []).filter(d => (!q || `${d.code} ${tx(d.title, lang)}`.toLowerCase().includes(q.toLowerCase())) && (!type || d.doc_type === type));
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  return (
    <>
      <div className="row-between" style={{ marginBottom: 16 }}>
        <div className="row" style={{ flex: 1 }}><div style={{ maxWidth: 380, flex: 1 }}><Search value={q} onChange={setQ} placeholder={t('Search documents')} /></div><select className="select" style={{ width: 'auto' }} aria-label={t('Type')} value={type} onChange={e => setType(e.target.value)}><option value="">{t('All types')}</option>{[...new Set((data || []).map(d => d.doc_type))].map(x => <option key={x} value={x}>{L(x)}</option>)}</select></div>
        {can('records.manage') && !readOnly && <button className="btn btn-primary" onClick={() => setNw(true)}><Plus size={16} />{t('New document')}</button>}
      </div>
      {loading && !data ? <Loading /> : (
        <Table rows={rows} onRowClick={(d) => navigate(`/documents/${d.id}`)} columns={[
          { key: 'code', label: t('Code'), width: 200 }, { key: 'title', label: t('Title'), render: d => <span className="strong">{tx(d.title, lang)}</span>, sortValue: d => tx(d.title, lang) },
          { key: 'doc_type', label: t('Type'), render: d => L(d.doc_type) }, { key: 'template_id', label: t('Template'), render: d => d.template_id || '—' },
          { key: 'current_version', label: t('Version'), width: 80 }, { key: 'status', label: t('Status'), render: d => <Status value={d.status} /> },
          { key: 'next_review', label: t('Next review'), render: d => <span className={d.next_review && d.next_review < soon ? 'tag s2' : ''}>{fmtDate(d.next_review)}</span> },
          { key: 'dl', label: t('Download'), sortable: false, render: d => <DownloadButtons doc={d} formats={d.formats} /> },
        ]} />
      )}
      {nw && <NewDocument projectId={projectId} orgId={orgId} onClose={() => { setNw(false); reload(); }} />}
    </>
  );
}

function Mandatory({ projectId }) {
  const { t, lang, toast, can, readOnly } = useApp();
  const navigate = useNavigate();
  const { data, reload } = useData(`/projects/${projectId}/documents/mandatory`);
  if (!data) return <Loading />;
  const create = async (code) => { try { const r = await api(`/projects/${projectId}/documents`, { method: 'POST', body: { templateCode: code } }); toast(t('Document created as draft {code}.', { code: r.code })); navigate(`/documents/${r.id}`); } catch (e) { toast(e.message, 'error'); } };
  return (
    <>
      <div className="callout neutral" style={{ marginBottom: 16 }}>{data.missing ? <AlertTriangle size={18} aria-hidden="true" /> : <CheckCircle2 size={18} aria-hidden="true" />}<span>{t('Documented information required by {s}: {n} items, {m} missing. "Maintain" = a document kept up to date; "retain" = a record kept as evidence.', { s: data.standards.join(', '), n: data.items.length, m: data.missing })}</span></div>
      <Table rows={data.items.map(x => ({ ...x, id: x.code }))} columns={[
        { key: 'name', label: t('Documented information'), render: x => <span className="strong">{tx(x.name, lang)}</span>, sortValue: x => tx(x.name, lang) },
        { key: 'req', label: t('Required by'), sortable: false, render: x => x.requirements.map(r => `${r.standard} §${r.clause} (${r.kind === 'maintain' ? t('maintain') : t('retain')})`).join(' · ') },
        { key: 'doc', label: t('Document'), sortable: false, render: x => (x.document ? <Link to={`/documents/${x.document.id}`}>{x.document.code} · v{x.document.current_version}</Link> : <span className="tag s1">{t('Missing')}</span>) },
        { key: 'status', label: t('Status'), sortable: false, render: x => (x.document ? <Status value={x.document.status} /> : '—') },
        { key: 'act', label: '', sortable: false, render: x => (!x.document && can('records.manage') && !readOnly ? <button className="btn btn-sm btn-primary" onClick={() => create(x.code)}><FilePlus2 size={14} />{t('Create')}</button> : null) },
      ]} />
      <p className="caption">{t('Requirements of ISO 9001:2015, ISO 14001:2015 and ISO 45001:2018 for the standards selected in the project.')}</p>
    </>
  );
}

const SECTION_TYPES = ['text', 'data', 'signature'];
function TemplateEditor({ orgId, code, onClose }) {
  const { t, lang, toast } = useApp();
  const { data: tpl, reload } = useData(`/orgs/${orgId}/doc-templates/${code}?raw=1`);
  const { data: lib } = useData(`/orgs/${orgId}/doc-templates`);
  const [ed, setEd] = useState(null);
  useEffect(() => { if (tpl) setEd({ ...tpl, sections: tpl.sections.map(s => ({ ...s })) }); }, [tpl]);
  if (!tpl || !ed) return <Modal title={t('Template')} onClose={onClose}><Loading /></Modal>;
  const editable = tpl.custom && tpl.canEdit;
  const { data: srcList } = useData('/doc-sources');
  const sources = srcList || [];
  const setSec = (i, k, v) => setEd({ ...ed, sections: ed.sections.map((s, j) => (j === i ? { ...s, [k]: v } : s)) });
  const move = (i, d) => { const a = [...ed.sections]; const [x] = a.splice(i, 1); a.splice(i + d, 0, x); setEd({ ...ed, sections: a }); };
  const save = async () => {
    try {
      await api(`/doc-templates/${tpl.id}`, { method: 'PUT', body: { name: ed.name, description: ed.description, toc: ed.toc, formats: ed.formats, review: ed.review, sections: ed.sections } });
      toast(t('Template saved as version {v}.', { v: tpl.version + 1 })); reload(); onClose(true);
    } catch (e) { toast(e.message, 'error'); }
  };
  const copy = async () => { try { await api(`/orgs/${orgId}/doc-templates`, { method: 'POST', body: { baseCode: tpl.code } }); toast(t('Editable copy created for your organization.')); onClose(true); } catch (e) { toast(e.message, 'error'); } };
  const txt = (v) => (typeof v === 'object' && v ? v[lang] ?? v.en ?? '' : v || '');
  const setTxt = (obj, v) => ({ ...(typeof obj === 'object' && obj ? obj : {}), [lang]: v });
  return (
    <Modal wide title={`${tpl.code} — ${txt(tpl.name)}`} onClose={() => onClose(false)} footer={<>{!tpl.custom && tpl.canEdit && <button className="btn" onClick={copy}><Copy size={16} />{t('Copy to edit')}</button>}<button className="btn" onClick={() => onClose(false)}>{t('Close')}</button>{editable && <button className="btn btn-primary" onClick={save}>{t('Save template')}</button>}</>}>
      <div className="stack">
        {!tpl.custom && <p className="small muted">{t('Library template (read-only). Copy it to adapt the sections, texts or layout for your organization; the copy replaces it in your library.')}</p>}
        <div className="form-grid">
          <Field label={t('Name')}>{(id) => <input id={id} className="input" disabled={!editable} value={txt(ed.name)} onChange={e => setEd({ ...ed, name: setTxt(ed.name, e.target.value) })} />}</Field>
          <Field label={t('Review frequency')}>{(id) => <select id={id} className="select" disabled={!editable} value={ed.review} onChange={e => setEd({ ...ed, review: e.target.value })}>{FREQS.map(x => <option key={x} value={x}>{x}</option>)}</select>}</Field>
        </div>
        <Field label={t('Description')}>{(id) => <textarea id={id} className="textarea" disabled={!editable} value={txt(ed.description)} onChange={e => setEd({ ...ed, description: setTxt(ed.description, e.target.value) })} />}</Field>
        <div className="row">
          <label className="checkbox"><input type="checkbox" disabled={!editable} checked={!!ed.toc} onChange={e => setEd({ ...ed, toc: e.target.checked })} /><span>{t('Table of contents (Word and PDF)')}</span></label>
          {['DOCX', 'PDF', 'XLSX'].map(f => <label key={f} className="checkbox"><input type="checkbox" disabled={!editable} checked={ed.formats.includes(f)} onChange={e => setEd({ ...ed, formats: e.target.checked ? [...ed.formats, f] : ed.formats.filter(x => x !== f) })} /><span>{f}</span></label>)}
        </div>
        <h4 className="serif" style={{ margin: 0 }}>{t('Structure: sections ({n})', { n: ed.sections.length })}</h4>
        {ed.sections.map((s, i) => (
          <div key={i} className="doc-section stack-8">
            <div className="row-between"><span className="strong small">{i + 1}. {txt(s.title) || t('Untitled section')}</span>
              {editable && <span className="row" style={{ gap: 4 }}><button className="btn btn-sm btn-ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label={t('Move up')}><ArrowUp size={16} /></button><button className="btn btn-sm btn-ghost" disabled={i === ed.sections.length - 1} onClick={() => move(i, 1)} aria-label={t('Move down')}><ArrowDown size={16} /></button><button className="btn btn-sm btn-ghost" onClick={() => setEd({ ...ed, sections: ed.sections.filter((_, j) => j !== i) })} aria-label={t('Delete section')}><Trash2 size={16} /></button></span>}
            </div>
            <div className="form-grid">
              <Field label={t('Title')}>{(id) => <input id={id} className="input" disabled={!editable} value={txt(s.title)} onChange={e => setSec(i, 'title', setTxt(s.title, e.target.value))} />}</Field>
              <Field label={t('Type')}>{(id) => <select id={id} className="select" disabled={!editable} value={s.type} onChange={e => setSec(i, 'type', e.target.value)}>{SECTION_TYPES.map(x => <option key={x} value={x}>{{ text: t('Free text'), data: t('Project data'), signature: t('Approval block') }[x]}</option>)}</select>}</Field>
            </div>
            {s.type === 'data' && <Field label={t('Data from the project')} hint={t('The table or text is filled from this project data when the document is generated.')}>{(id) => <select id={id} className="select" disabled={!editable} value={s.source || ''} onChange={e => setSec(i, 'source', e.target.value)}>{sources.map(x => <option key={x} value={x}>{x}</option>)}</select>}</Field>}
            {(s.type === 'text' || s.type === 'data') && <Field label={s.type === 'text' ? t('Text') : t('Introduction (optional)')} hint={t('Placeholders: {org} {product} {line} {city} {customer} {supplier} {standards} {date}')}>{(id) => <textarea id={id} className="textarea" disabled={!editable} value={txt(s.text)} onChange={e => setSec(i, 'text', setTxt(s.text, e.target.value))} />}</Field>}
          </div>
        ))}
        {editable && <button className="btn btn-sm" onClick={() => setEd({ ...ed, sections: [...ed.sections, { key: `s${Date.now().toString(36)}`, type: 'text', title: { [lang]: t('New section') }, text: { [lang]: '' } }] })}><Plus size={14} />{t('Add a section')}</button>}
        {lib && <p className="caption">{t('{n} templates in the library.', { n: lib.items.length })}</p>}
      </div>
    </Modal>
  );
}

function Templates({ orgId, projectId }) {
  const { t, lang, toast } = useApp();
  const { data, reload } = useData(`/orgs/${orgId}/doc-templates?projectId=${projectId}`);
  const [open, setOpen] = useState(null); const [nw, setNw] = useState(null); const [cat, setCat] = useState('');
  if (!data) return <Loading />;
  const create = async () => { try { const r = await api(`/orgs/${orgId}/doc-templates`, { method: 'POST', body: { code: nw.code, name: nw.name, docType: nw.docType, category: nw.category, toc: true, formats: ['DOCX', 'PDF'] } }); toast(t('Template {code} created.', { code: r.code })); setNw(null); reload(); setOpen(r.code); } catch (e) { toast(e.message, 'error'); } };
  const retire = async (x) => { if (!window.confirm(t('Retire template {code}?', { code: x.code }))) return; try { await api(`/doc-templates/${x.id}`, { method: 'DELETE' }); toast(t('Template retired.')); reload(); } catch (e) { toast(e.message, 'error'); } };
  const rows = data.items.filter(x => !cat || x.category === cat);
  return (
    <>
      <div className="row-between" style={{ marginBottom: 16 }}>
        <select className="select" style={{ width: 'auto' }} aria-label={t('Category')} value={cat} onChange={e => setCat(e.target.value)}><option value="">{t('All categories')}</option>{data.categories.map(c => <option key={c.id} value={c.id}>{tx(c.name, lang)}</option>)}</select>
        {data.canManage && <button className="btn btn-primary" onClick={() => setNw({ code: 'TPL-', name: '', docType: 'Procedure', category: 'process' })}><Plus size={16} />{t('New template')}</button>}
      </div>
      <Table rows={rows.map(x => ({ ...x, id: x.code }))} onRowClick={(x) => setOpen(x.code)} columns={[
        { key: 'code', label: t('Code'), width: 140 }, { key: 'name', label: t('Template'), render: x => <span className="strong">{tx(x.name, lang)}</span>, sortValue: x => tx(x.name, lang) },
        { key: 'category', label: t('Category'), render: x => tx(data.categories.find(c => c.id === x.category)?.name, lang) },
        { key: 'mandatory', label: t('Required by'), sortable: false, render: x => x.mandatoryFor.map(m => `${m.standard} §${m.clause}`).join(', ') || '—' },
        { key: 'formats', label: t('Formats'), sortable: false, render: x => x.formats.join(', ') }, { key: 'sectionCount', label: t('Sections'), width: 90 },
        { key: 'custom', label: t('Origin'), render: x => (x.custom ? <span className="tag s4">{t('Organization')}</span> : <span className="tag outline">{t('Library')}</span>) },
        { key: 'act', label: '', sortable: false, render: x => (x.custom && data.canManage ? <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); retire(x); }} aria-label={t('Retire')}><Trash2 size={16} /></button> : null) },
      ]} />
      <p className="caption">{t('Suggested IMS templates for ISO 9001, ISO 14001 and ISO 45001; each section is filled from the project data. Click a template to see its structure.')}</p>
      {open && <TemplateEditor orgId={orgId} code={open} onClose={(changed) => { setOpen(null); if (changed) reload(); }} />}
      {nw && (
        <Modal title={t('New template')} onClose={() => setNw(null)} footer={<><button className="btn" onClick={() => setNw(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!nw.name || !/^[A-Z0-9-]{3,30}$/.test(nw.code)} onClick={create}>{t('Create')}</button></>}>
          <div className="stack">
            <div className="form-grid">
              <Field label={t('Code')} required hint={t('Capital letters, digits and dashes.')}>{(id) => <input id={id} className="input" value={nw.code} onChange={e => setNw({ ...nw, code: e.target.value.toUpperCase() })} />}</Field>
              <Field label={t('Type')}>{(id) => <select id={id} className="select" value={nw.docType} onChange={e => setNw({ ...nw, docType: e.target.value })}>{TYPES.map(x => <option key={x} value={x}>{x}</option>)}</select>}</Field>
            </div>
            <Field label={t('Name')} required>{(id) => <input id={id} className="input" value={nw.name} onChange={e => setNw({ ...nw, name: e.target.value })} />}</Field>
            <Field label={t('Category')}>{(id) => <select id={id} className="select" value={nw.category} onChange={e => setNw({ ...nw, category: e.target.value })}>{data.categories.map(c => <option key={c.id} value={c.id}>{tx(c.name, lang)}</option>)}</select>}</Field>
          </div>
        </Modal>
      )}
    </>
  );
}

function Layout({ orgId }) {
  const { t, toast } = useApp();
  const { data, reload } = useData(`/orgs/${orgId}/doc-layout`);
  const [f, setF] = useState(null);
  useEffect(() => { if (data) setF(data); }, [data]);
  if (!f) return <Loading />;
  const save = async () => { try { await api(`/orgs/${orgId}/doc-layout`, { method: 'PUT', body: f }); toast(t('Layout saved; it applies to every document you download.')); reload(); } catch (e) { toast(e.message, 'error'); } };
  const upload = async (file) => { const fd = new FormData(); fd.append('file', file); try { await api(`/orgs/${orgId}/doc-layout/logo`, { method: 'POST', body: fd }); toast(t('Logo uploaded.')); reload(); } catch (e) { toast(e.message, 'error'); } };
  const color = (k, label) => <Field label={label}>{(id) => <div className="row" style={{ gap: 8 }}><input id={id} type="color" className="swatch" disabled={!f.canEdit} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value.toUpperCase() })} /><input className="input" style={{ maxWidth: 120 }} aria-label={label} disabled={!f.canEdit} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} /></div>}</Field>;
  return (
    <div className="grid-main">
      <Card title={t('Document layout')}>
        <div className="stack">
          <p className="small muted">{t('Like a Word template: logo, colors, header and footer applied to every generated document (DOCX, PDF and XLSX).')}</p>
          <div className="form-grid">{color('primaryColor', t('Table header color'))}{color('accentColor', t('Accent color (labels, logo text)'))}{color('titleColor', t('Title color'))}</div>
          <Field label={t('Logo text')} hint={t('Used when no logo image is uploaded.')}>{(id) => <input id={id} className="input" disabled={!f.canEdit} value={f.logoText} onChange={e => setF({ ...f, logoText: e.target.value })} />}</Field>
          <Field label={t('Header text')}>{(id) => <input id={id} className="input" disabled={!f.canEdit} value={f.headerText} onChange={e => setF({ ...f, headerText: e.target.value })} placeholder={t('e.g. Controlled copy — do not print')} />}</Field>
          <Field label={t('Footer text')}>{(id) => <input id={id} className="input" disabled={!f.canEdit} value={f.footerText} onChange={e => setF({ ...f, footerText: e.target.value })} placeholder={t('By default: organization, code and version')} />}</Field>
          <div className="row">
            {f.canEdit && <label className="btn"><Upload size={16} />{t('Upload a logo (PNG or JPEG)')}<input type="file" accept="image/png,image/jpeg" hidden onChange={e => e.target.files[0] && upload(e.target.files[0])} /></label>}
            {f.hasLogo && <span className="small">{t('Logo: {n}', { n: f.logoName || 'logo' })} {f.canEdit && <button className="btn btn-sm btn-ghost" onClick={async () => { await api(`/orgs/${orgId}/doc-layout`, { method: 'PUT', body: { ...f, removeLogo: true } }); reload(); }}>{t('Remove')}</button>}</span>}
            {f.canEdit && <button className="btn btn-primary" onClick={save}>{t('Save layout')}</button>}
          </div>
        </div>
      </Card>
      <Card title={t('Preview')}>
        <div style={{ border: '1px solid var(--aiv-line)', borderRadius: 8, padding: 16, background: 'var(--aiv-white)' }}>
          <div className="serif strong" style={{ color: f.accentColor, fontSize: 18 }}>{f.logoText}</div>
          <p className="xsmall" style={{ color: f.accentColor, fontWeight: 700, letterSpacing: '.08em', margin: '24px 0 4px' }}>{t('ORGANIZATION · CODE')}</p>
          <div className="serif" style={{ color: f.titleColor, fontSize: 22, fontWeight: 700 }}>{t('Quality policy')}</div>
          <div style={{ height: 3, background: f.primaryColor, margin: '12px 0' }} />
          <table className="data" style={{ fontSize: 12 }}><thead><tr><th style={{ background: f.primaryColor }}>{t('Item')}</th><th style={{ background: f.primaryColor }}>{t('Status')}</th></tr></thead><tbody><tr><td>{t('Example row')}</td><td>{t('Published')}</td></tr></tbody></table>
          <p className="xsmall muted" style={{ marginTop: 12 }}>{f.footerText || t('Organization · code · version · page 1 / 2')}</p>
        </div>
      </Card>
    </div>
  );
}

export default function Documents() {
  const { t, projectId, project } = useApp();
  const [params, setParams] = useSearchParams();
  const tab = ['docs', 'mandatory', 'templates', 'layout'].includes(params.get('tab')) ? params.get('tab') : 'docs';
  const setTab = (v) => setParams(v === 'docs' ? {} : { tab: v }, { replace: true });
  if (!projectId) return <NoProject />;
  const orgId = project?.org?.id;
  return (
    <>
      <PageHead eyebrow={t('Records')} title={t('Documents')} subtitle={t('Documented information of the project: generated from templates with the project data, versioned (draft, review, published) and downloadable in Word, PDF and Excel. The author never approves their own version.')}
        actions={<><button className="btn" onClick={() => setTab('templates')}>{t('Customize the templates')}</button><button className="btn" onClick={() => setTab('layout')}>{t('Layout: logo and colours')}</button></>} />
      {tab === 'docs' && <div className="callout neutral small" style={{ marginBottom: 16 }}><span>{t('To customize documents: Templates changes the sections, their order, their text and data source (copy a standard template, then edit it); Layout sets the logo, colours, header and footer of every Word, PDF and Excel file; on a draft document, Edit the structure changes that document only.')}</span></div>}
      <Tabs label={t('Documents')} value={tab} onChange={setTab} tabs={[{ id: 'docs', label: t('Documents') }, { id: 'mandatory', label: t('Required by the standards') }, { id: 'templates', label: t('Templates') }, { id: 'layout', label: t('Layout') }]} />
      {tab === 'docs' && <DocList projectId={projectId} orgId={orgId} />}
      {tab === 'mandatory' && <Mandatory projectId={projectId} />}
      {tab === 'templates' && orgId && <Templates orgId={orgId} projectId={projectId} />}
      {tab === 'layout' && orgId && <Layout orgId={orgId} />}
    </>
  );
}

function Block({ block, lang, t }) {
  if (!block) return null;
  if (block.kind === 'sub') return <h5 style={{ margin: '8px 0 0', color: 'var(--aiv-azure)' }}>{tx(block.text, lang)}</h5>;
  if (block.kind === 'text') return <p className="small" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{tx(block.text, lang)}</p>;
  if (block.kind === 'bullets') return <>{block.intro && <p className="small strong" style={{ margin: 0 }}>{tx(block.intro, lang)}</p>}<ul className="small" style={{ margin: 0, paddingInlineStart: 20 }}>{block.items.map((x, i) => <li key={i}>{tx(x, lang)}</li>)}</ul></>;
  const cell = (v) => (Array.isArray(v) ? v.map(x => tx(x, lang)).join(', ') : tx(v, lang));
  if (block.kind === 'kv') return <dl className="kv">{block.rows.map(([k, v], i) => <div key={i}><dt>{tx(k, lang)}</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{cell(v)}</dd></div>)}</dl>;
  if (block.kind === 'table') return <><Table maxRows={12} rows={block.rows.map((r, i) => ({ ...r, __i: i }))} rowKey="__i" columns={block.columns.map(c => ({ key: c.key, label: tx(c.label, lang), sortable: false, render: r => <span style={{ whiteSpace: 'pre-wrap' }}>{cell(r[c.key])}</span> }))} />{block.caption && <p className="caption">{tx(block.caption, lang)}</p>}</>;
  // Diagrams are SVG generated by the server from the process design (no user HTML).
  if (block.kind === 'diagram') return <figure style={{ margin: 0 }}><div className="doc-diagram" dangerouslySetInnerHTML={{ __html: block.svg }} />{block.caption && <figcaption className="caption">{tx(block.caption, lang)}</figcaption>}</figure>;
  return null;
}

export function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, L, lang, me, fmtDate, toast, can, readOnly } = useApp();
  const { data: d, loading, error, reload } = useData(`/documents/${id}`);
  const [sel, setSel] = useState(null);
  const [nv, setNv] = useState(null);
  const [meta, setMeta] = useState(null);
  const [secEd, setSecEd] = useState(null);
  const v = d ? (d.versions.find(x => x.id === sel) || d.versions[0]) : null;
  const { data: st, reload: reloadSt } = useData(v ? `/document-versions/${v.id}/structure` : null, [v?.id]);
  if (loading && !d) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const manage = can('records.manage') && !readOnly;
  const act = async (verb) => { try { await api(`/document-versions/${v.id}/${verb}`, { method: 'POST', body: {} }); toast(t('Done.')); reload(); } catch (e) { toast(e.message, 'error'); } };
  const create = async () => { try { await api(`/documents/${d.id}/versions`, { method: 'POST', body: nv }); toast(nv.regenerate ? t('New draft generated from the current project data.') : t('New draft version created.')); setNv(null); setSel(null); reload(); } catch (e) { toast(e.message, 'error'); } };
  const saveMeta = async () => { try { await api(`/documents/${d.id}`, { method: 'PUT', body: meta }); toast(t('Document updated.')); setMeta(null); reload(); } catch (e) { toast(e.message, 'error'); } };
  const del = async () => {
    const published = d.versions.some(x => ['Published', 'Superseded'].includes(x.status));
    const j = published ? window.prompt(t('A published document is retired, not deleted. Justification:')) : (window.confirm(t('Delete this draft document?')) ? 'ok' : null);
    if (!j) return;
    try { const r = await api(`/documents/${d.id}${published ? `?justification=${encodeURIComponent(j)}` : ''}`, { method: 'DELETE' }); toast(r.retired ? t('Document retired.') : t('Document deleted.')); if (r.deleted) navigate('/documents'); else reload(); } catch (e) { toast(e.message, 'error'); }
  };
  const saveSections = async () => { try { await api(`/document-versions/${v.id}/sections`, { method: 'PUT', body: { sections: secEd } }); toast(t('Structure saved in the draft.')); setSecEd(null); reloadSt(); } catch (e) { toast(e.message, 'error'); } };
  const txt = (x) => tx(x, lang);
  return (
    <>
      <PageHead eyebrow={`${L(d.doc_type)} · ${d.code}${d.template ? ` · ${d.template.code}` : ''}`} title={tx(d.title, lang)} subtitle={`${t('Version')} ${d.current_version} · ${(d.standards || []).join(', ')} · ${t('Next review')} ${fmtDate(d.next_review)}`}
        actions={<><Link className="btn" to="/documents">{t('All documents')}</Link>{manage && <button className="btn" onClick={() => setMeta({ title: txt(d.title), ownerRole: d.owner_role, reviewFrequency: d.review_frequency })}><Pencil size={16} />{t('Edit')}</button>}{manage && <button className="btn" onClick={del}><Trash2 size={16} />{t('Delete')}</button>}{manage && <button className="btn btn-primary" onClick={() => setNv({ changeType: 'Minor', summary: '', regenerate: !!d.template_id })}>{t('New version')}</button>}</>}>
        <div className="row small" style={{ marginTop: 12 }}><Status value={d.status} />{d.sourceStep && <Link to={`/steps/${d.sourceStep.id}`} className="tag outline">{t('From step {s}', { s: d.sourceStep.stepId })}</Link>}{v && <DownloadButtons doc={d} formats={d.template?.formats} versionId={v.id} small={false} />}</div>
      </PageHead>
      <div className="grid-side">
        <Card title={t('Versions')}>
          <ul className="list">{d.versions.map(x => <li key={x.id}><button className="list-btn" aria-current={x.id === v?.id} onClick={() => setSel(x.id)} style={x.id === v?.id ? { background: 'var(--aiv-azure-tint)' } : undefined}><span className="stack-8" style={{ gap: 2 }}><span className="strong small">v{x.version} · {L(x.change_type)}</span><span className="xsmall muted">{x.author_name} · {fmtDate(x.created_at)}</span></span><span style={{ marginInlineStart: 'auto' }}><Status value={x.status} /></span></button></li>)}</ul>
        </Card>
        {v && (
          <div className="stack">
            <Card title={`v${v.version} — ${tx(v.summary, lang)}`} action={<Status value={v.status} />}>
              <p className="xsmall muted">{t('Author')}: {v.author_name || '—'} · {t('Approver')}: {v.approver_name || '—'}{v.approved_at ? ` · ${fmtDate(v.approved_at)}` : ''}{d.template ? ` · ${t('Template')} ${d.template.code} (${d.template.toc ? t('with table of contents') : t('no table of contents')})` : ''}</p>
              {manage && <div className="row">
                {v.status === 'Draft' && <button className="btn" onClick={() => act('submit')}>{t('Submit for review')}</button>}
                {v.status === 'In review' && <button className="btn btn-primary" disabled={v.author === me.user.id} title={v.author === me.user.id ? t('The author cannot approve their own version.') : undefined} onClick={() => act('approve')}>{t('Approve and publish')}</button>}
                {v.status === 'In review' && <button className="btn" onClick={() => act('reject')}>{t('Send back to draft')}</button>}
                {v.status === 'Draft' && st?.structured && <button className="btn" onClick={() => setSecEd(st.sections.map(s => ({ key: s.key, title: txt(s.title), text: txt(s.text), type: s.type })))}><Pencil size={16} />{t('Edit the structure')}</button>}
              </div>}
            </Card>
            <Card title={t('Structure and content')}>
              {!st ? <Loading /> : st.structured ? (
                <div className="stack">{st.sections.map((s, i) => (
                  <div key={s.key} className="doc-section">
                    <h4>{i + 1}. {txt(s.title)}</h4>
                    {s.source && <p className="xsmall muted" style={{ marginTop: -4 }}>{t('Data')}: {s.source}</p>}
                    {s.text && <p className="small" style={{ whiteSpace: 'pre-wrap' }}>{txt(s.text)}</p>}
                    {(s.blocks || []).map((b, j) => <Block key={j} block={b} lang={lang} t={t} />)}
                  </div>
                ))}</div>
              ) : <p style={{ whiteSpace: 'pre-wrap' }}>{txt(st.text) || <span className="muted">{t('No content.')}</span>}</p>}
            </Card>
            <Card><Attachments entityType="document" entityId={d.id} /></Card>
          </div>
        )}
      </div>
      {nv && (
        <Modal wide title={t('New version')} onClose={() => setNv(null)} footer={<><button className="btn" onClick={() => setNv(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!nv.summary} onClick={create}>{t('Create draft')}</button></>}>
          <div className="stack">
            <div className="form-grid">
              <Field label={t('Change type')}>{(fid) => <select id={fid} className="select" value={nv.changeType} onChange={e => setNv({ ...nv, changeType: e.target.value })}><option value="Minor">{t('Minor (x.y+1)')}</option><option value="Major">{t('Major (x+1.0)')}</option></select>}</Field>
              <Field label={t('Summary of change')} required>{(fid) => <input id={fid} className="input" value={nv.summary} onChange={e => setNv({ ...nv, summary: e.target.value })} />}</Field>
            </div>
            {d.template_id && <label className="checkbox"><input type="checkbox" checked={nv.regenerate} onChange={e => setNv({ ...nv, regenerate: e.target.checked })} /><span><RefreshCw size={14} /> {t('Regenerate the content from the current project data (otherwise the current content is copied)')}</span></label>}
          </div>
        </Modal>
      )}
      {meta && (
        <Modal title={t('Edit the document')} onClose={() => setMeta(null)} footer={<><button className="btn" onClick={() => setMeta(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!meta.title} onClick={saveMeta}>{t('Save')}</button></>}>
          <div className="stack">
            <Field label={t('Title')} required>{(fid) => <input id={fid} className="input" value={meta.title} onChange={e => setMeta({ ...meta, title: e.target.value })} />}</Field>
            <Field label={t('Review frequency')}>{(fid) => <select id={fid} className="select" value={meta.reviewFrequency} onChange={e => setMeta({ ...meta, reviewFrequency: e.target.value })}>{FREQS.map(x => <option key={x} value={x}>{x}</option>)}</select>}</Field>
          </div>
        </Modal>
      )}
      {secEd && (
        <Modal wide title={t('Edit the structure')} onClose={() => setSecEd(null)} footer={<><button className="btn" onClick={() => setSecEd(null)}>{t('Cancel')}</button><button className="btn btn-primary" onClick={saveSections}>{t('Save')}</button></>}>
          <div className="stack">
            <p className="small muted">{t('Add, rename, reorder or delete sections of this draft. Data tables keep their content; free-text sections can be edited.')}</p>
            {secEd.map((s, i) => (
              <div key={s.key || i} className="doc-section stack-8">
                <div className="row-between"><span className="strong small">{i + 1}.</span><span className="row" style={{ gap: 4 }}><button className="btn btn-sm btn-ghost" disabled={i === 0} aria-label={t('Move up')} onClick={() => { const a = [...secEd]; const [x] = a.splice(i, 1); a.splice(i - 1, 0, x); setSecEd(a); }}><ArrowUp size={16} /></button><button className="btn btn-sm btn-ghost" disabled={i === secEd.length - 1} aria-label={t('Move down')} onClick={() => { const a = [...secEd]; const [x] = a.splice(i, 1); a.splice(i + 1, 0, x); setSecEd(a); }}><ArrowDown size={16} /></button><button className="btn btn-sm btn-ghost" aria-label={t('Delete section')} onClick={() => setSecEd(secEd.filter((_, j) => j !== i))}><Trash2 size={16} /></button></span></div>
                <Field label={t('Title')}>{(fid) => <input id={fid} className="input" value={s.title} onChange={e => setSecEd(secEd.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />}</Field>
                {s.type !== 'data' && s.type !== 'signature' && <Field label={t('Text')}>{(fid) => <textarea id={fid} className="textarea" value={s.text || ''} onChange={e => setSecEd(secEd.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />}</Field>}
              </div>
            ))}
            <button className="btn btn-sm" onClick={() => setSecEd([...secEd, { key: undefined, title: t('New section'), text: '', type: 'text' }])}><Plus size={14} />{t('Add a section')}</button>
          </div>
        </Modal>
      )}
    </>
  );
}
