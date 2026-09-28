import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Card, Loading, ErrorBox, Status, Table, tx, Modal, Field, Search } from '../components/ui.jsx';
import Attachments from '../components/Attachments.jsx';
import { NoProject } from './Home.jsx';

const TYPES = ['Policy', 'Manual', 'Procedure', 'Sheet', 'Map', 'Plan', 'Register'];

export default function Documents() {
  const { t, L, lang, projectId, fmtDate, toast, can, readOnly } = useApp();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useData(projectId ? `/projects/${projectId}/documents` : null);
  const [q, setQ] = useState('');
  const [nw, setNw] = useState(null);
  if (!projectId) return <NoProject />;
  const create = async () => { try { const r = await api(`/projects/${projectId}/documents`, { method: 'POST', body: nw }); toast(t('Document created as draft {code}.', { code: r.code })); setNw(null); navigate(`/documents/${r.id}`); } catch (e) { toast(e.message, 'error'); } };
  const soon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const rows = (data || []).filter(d => !q || `${d.code} ${tx(d.title, lang)}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHead eyebrow={t('Records')} title={t('Documents')} subtitle={t('Master list of documented information. Each change creates a version that goes draft, review, published; the author never approves their own version.')} actions={can('records.manage') && !readOnly && <button className="btn btn-primary" onClick={() => setNw({ title: '', docType: 'Procedure', content: '', reviewFrequency: 'Annual' })}><Plus size={16} />{t('New document')}</button>} />
      <div style={{ marginBottom: 16, maxWidth: 420 }}><Search value={q} onChange={setQ} placeholder={t('Search documents')} /></div>
      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data ? <Loading /> : (
        <Table rows={rows} onRowClick={(d) => navigate(`/documents/${d.id}`)} columns={[
          { key: 'code', label: t('Code'), width: 200 }, { key: 'title', label: t('Title'), render: d => <span className="strong">{tx(d.title, lang)}</span>, sortValue: d => tx(d.title, lang) },
          { key: 'doc_type', label: t('Type'), render: d => L(d.doc_type) }, { key: 'scope_type', label: t('Scope') },
          { key: 'current_version', label: t('Version'), width: 80 }, { key: 'status', label: t('Status'), render: d => <Status value={d.status} /> },
          { key: 'next_review', label: t('Next review'), render: d => <span className={d.next_review && d.next_review < soon ? 'tag s2' : ''}>{fmtDate(d.next_review)}</span> },
        ]} />
      )}
      {nw && (
        <Modal title={t('New document')} onClose={() => setNw(null)} footer={<><button className="btn" onClick={() => setNw(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!nw.title} onClick={create}>{t('Create draft')}</button></>}>
          <div className="stack">
            <Field label={t('Title')} required>{(id) => <input id={id} className="input" value={nw.title} onChange={e => setNw({ ...nw, title: e.target.value })} />}</Field>
            <div className="form-grid">
              <Field label={t('Type')}>{(id) => <select id={id} className="select" value={nw.docType} onChange={e => setNw({ ...nw, docType: e.target.value })}>{TYPES.map(x => <option key={x} value={x}>{L(x)}</option>)}</select>}</Field>
              <Field label={t('Review frequency')}>{(id) => <select id={id} className="select" value={nw.reviewFrequency} onChange={e => setNw({ ...nw, reviewFrequency: e.target.value })}>{['Annual', 'Semi-annual'].map(x => <option key={x} value={x}>{L(x)}</option>)}</select>}</Field>
            </div>
            <Field label={t('Content')}>{(id) => <textarea id={id} className="textarea" style={{ minHeight: 160 }} value={nw.content} onChange={e => setNw({ ...nw, content: e.target.value })} />}</Field>
          </div>
        </Modal>
      )}
    </>
  );
}

export function DocumentDetail() {
  const { id } = useParams();
  const { t, L, lang, me, fmtDate, toast, can, readOnly } = useApp();
  const { data: d, loading, error, reload } = useData(`/documents/${id}`);
  const [sel, setSel] = useState(null);
  const [nv, setNv] = useState(null);
  if (loading && !d) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const v = d.versions.find(x => x.id === sel) || d.versions[0];
  const manage = can('records.manage') && !readOnly;
  const act = async (verb) => { try { await api(`/document-versions/${v.id}/${verb}`, { method: 'POST', body: {} }); toast(t('Done.')); reload(); } catch (e) { toast(e.message, 'error'); } };
  const create = async () => { try { await api(`/documents/${d.id}/versions`, { method: 'POST', body: nv }); toast(t('New draft version created.')); setNv(null); setSel(null); reload(); } catch (e) { toast(e.message, 'error'); } };
  return (
    <>
      <PageHead eyebrow={`${L(d.doc_type)} · ${d.code}`} title={tx(d.title, lang)} subtitle={`${t('Version')} ${d.current_version} · ${(d.standards || []).join(', ')} · ${t('Next review')} ${fmtDate(d.next_review)}`} actions={<><Link className="btn" to="/documents">{t('All documents')}</Link>{manage && <button className="btn btn-primary" onClick={() => setNv({ changeType: 'Minor', summary: '', content: tx(v?.content, lang) })}>{t('New version')}</button>}</>} />
      <div className="grid-side">
        <Card title={t('Versions')}>
          <ul className="list">{d.versions.map(x => <li key={x.id}><button className="list-btn" aria-current={x.id === v?.id} onClick={() => setSel(x.id)} style={x.id === v?.id ? { background: 'var(--pa-orange-tint)' } : undefined}><span className="stack-8" style={{ gap: 2 }}><span className="strong small">v{x.version} · {L(x.change_type)}</span><span className="xsmall muted">{x.author_name} · {fmtDate(x.created_at)}</span></span><span style={{ marginInlineStart: 'auto' }}><Status value={x.status} /></span></button></li>)}</ul>
        </Card>
        {v && (
          <div className="stack">
            <Card title={`v${v.version} — ${tx(v.summary, lang)}`} action={<Status value={v.status} />}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{tx(v.content, lang) || <span className="muted">{t('No content.')}</span>}</p>
              <p className="xsmall muted">{t('Author')}: {v.author_name || '—'} · {t('Approver')}: {v.approver_name || '—'}{v.approved_at ? ` · ${fmtDate(v.approved_at)}` : ''} · {(v.formats || []).join(', ')}</p>
              {manage && <div className="row">
                {v.status === 'Draft' && <button className="btn" onClick={() => act('submit')}>{t('Submit for review')}</button>}
                {v.status === 'In review' && <button className="btn btn-primary" disabled={v.author === me.user.id} title={v.author === me.user.id ? t('The author cannot approve their own version.') : undefined} onClick={() => act('approve')}>{t('Approve and publish')}</button>}
                {v.status === 'In review' && <button className="btn" onClick={() => act('reject')}>{t('Send back to draft')}</button>}
              </div>}
            </Card>
            <Card><Attachments entityType="document" entityId={d.id} /></Card>
          </div>
        )}
      </div>
      {nv && (
        <Modal wide title={t('New version')} onClose={() => setNv(null)} footer={<><button className="btn" onClick={() => setNv(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!nv.summary} onClick={create}>{t('Create draft')}</button></>}>
          <div className="stack">
            <div className="form-grid">
              <Field label={t('Change type')}>{(id) => <select id={id} className="select" value={nv.changeType} onChange={e => setNv({ ...nv, changeType: e.target.value })}><option value="Minor">{t('Minor (x.y+1)')}</option><option value="Major">{t('Major (x+1.0)')}</option></select>}</Field>
              <Field label={t('Summary of change')} required>{(id) => <input id={id} className="input" value={nv.summary} onChange={e => setNv({ ...nv, summary: e.target.value })} />}</Field>
            </div>
            <Field label={t('Content')}>{(id) => <textarea id={id} className="textarea" style={{ minHeight: 220 }} value={nv.content} onChange={e => setNv({ ...nv, content: e.target.value })} />}</Field>
          </div>
        </Modal>
      )}
    </>
  );
}
