import { useState } from 'react';
import { Copy } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Card, Loading, Status, Tabs, Table, tx, Modal } from '../components/ui.jsx';

export default function Libraries() {
  const { t, L, lang, toast, can } = useApp();
  const [tab, setTab] = useState('templates');
  const path = { tracks: '/admin/libraries/tracks', criteria: '/admin/libraries/criteria', gates: '/admin/libraries/gates', checklists: '/admin/libraries/checklists', templates: '/admin/libraries/templates' }[tab];
  const { data, loading, reload } = useData(path, [tab]);
  const [sel, setSel] = useState(null);
  const [weights, setWeights] = useState(null);
  const manage = can('templates.manage');
  const dup = async (r) => { try { await api(`/admin/libraries/${tab}`, { method: 'POST', body: { duplicateOf: r.id } }); toast(t('Duplicated as a draft.')); reload(); } catch (e) { toast(e.message, 'error'); } };
  const setStatus = async (r, status) => { try { await api(`/admin/libraries/${tab}/${r.id}`, { method: 'PUT', body: { status } }); toast(t('Saved.')); setSel(null); reload(); } catch (e) { toast(e.message, 'error'); } };
  const saveWeights = async () => { try { await api('/admin/libraries/criteria', { method: 'PUT', body: { weights } }); toast(t('Weights saved.')); setWeights(null); reload(); } catch (e) { toast(e.message, 'error'); } };
  const actions = (r) => manage && <span className="row" style={{ gap: 4 }}><button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); dup(r); }} aria-label={t('Duplicate')}><Copy size={14} /></button></span>;
  const sumW = weights ? Object.values(weights).reduce((a, b) => a + +b, 0) : 0;
  return (
    <>
      <PageHead eyebrow={t('Design')} title={t('Libraries')} subtitle={t('Reusable building blocks for new projects: SME tracks, complexity criteria, gates, checklists and project templates.')} />
      <Tabs label={t('Libraries')} value={tab} onChange={setTab} tabs={[{ id: 'templates', label: t('Project templates') }, { id: 'gates', label: t('Gates') }, { id: 'checklists', label: t('Checklists') }, { id: 'tracks', label: t('SME tracks') }, { id: 'criteria', label: t('Complexity criteria') }]} />
      {loading && !data ? <Loading /> : data && (
        <>
          {tab === 'templates' && <Table rows={data} onRowClick={setSel} columns={[{ key: 'code', label: t('Code') }, { key: 'name', label: t('Template'), render: r => <span className="strong">{tx(r.name, lang)}</span>, sortValue: r => tx(r.name, lang) }, { key: 'scope', label: t('Scope'), render: r => L(r.scope) }, { key: 'vertical', label: t('Vertical'), render: r => r.vertical || '—' }, { key: 'mode', label: t('Mode'), render: r => L(r.mode) }, { key: 'ms_type', label: t('System') }, { key: 'use_count', label: t('Uses') }, { key: 'version', label: 'v' }, { key: 'status', label: t('Status'), render: r => <Status value={r.status} /> }, { key: 'a', label: '', sortable: false, render: actions }]} />}
          {tab === 'gates' && <Table rows={data} onRowClick={setSel} columns={[{ key: 'code', label: t('Code') }, { key: 'name', label: t('Gate'), render: r => <span className="strong">{tx(r.name, lang)}</span> }, { key: 'exit_criteria', label: t('Exit criteria'), render: r => tx(r.exit_criteria, lang) }, { key: 'checklists', label: t('Checklists'), render: r => (r.checklists || []).map(c => c.code).join(', ') }, { key: 'status', label: t('Status'), render: r => <Status value={r.status} /> }, { key: 'a', label: '', sortable: false, render: actions }]} />}
          {tab === 'checklists' && <Table rows={data} onRowClick={setSel} columns={[{ key: 'code', label: t('Code') }, { key: 'name', label: t('Checklist'), render: r => <span className="strong">{tx(r.name, lang)}</span> }, { key: 'scope', label: t('Scope'), render: r => L(r.scope) }, { key: 'vertical', label: t('Vertical'), render: r => r.vertical || '—' }, { key: 'items', label: t('Items'), render: r => (r.items || []).length }, { key: 'status', label: t('Status'), render: r => <Status value={r.status} /> }, { key: 'a', label: '', sortable: false, render: actions }]} />}
          {tab === 'tracks' && <Table rows={data} columns={[{ key: 'code', label: t('Code') }, { key: 'name', label: t('Track'), render: r => <span className="strong">{tx(r.name, lang)}</span> }, { key: 'description', label: t('Description'), render: r => tx(r.description, lang) }, { key: 'range', label: t('Score range'), render: r => `${r.min_score}–${r.max_score}` }, { key: 'gates', label: t('Gates') }, { key: 'items_per_gate', label: t('Items per gate') }, { key: 'duration_weeks', label: t('Weeks') }]} />}
          {tab === 'criteria' && (
            <Card title={t('Weighted criteria')} action={manage && !weights && <button className="btn btn-sm" onClick={() => setWeights(Object.fromEntries(data.filter(c => !c.vertical).map(c => [c.code, c.weight])))}>{t('Edit weights')}</button>}>
              <Table rows={data} columns={[{ key: 'code', label: t('Code') }, { key: 'name', label: t('Criterion'), render: c => tx(c.name, lang) }, { key: 'vertical', label: t('Vertical'), render: c => c.vertical || t('All') }, { key: 'weight', label: t('Weight'), render: c => (weights && !c.vertical ? <input className="input" style={{ width: 80 }} type="number" aria-label={c.code} value={weights[c.code]} onChange={e => setWeights({ ...weights, [c.code]: e.target.value })} /> : c.weight) }, { key: 'levels', label: t('Levels 1 → 5'), render: c => (c.levels || []).map(l => tx(l, lang)).join(' · ') }]} />
              {weights && <div className="row" style={{ marginTop: 16 }}><span className={`tag ${sumW === 100 ? 's5' : 's1'}`}>{t('Total {n}/100', { n: sumW })}</span><button className="btn" onClick={() => setWeights(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={sumW !== 100} onClick={saveWeights}>{t('Save')}</button></div>}
              <p className="caption">{t('The complexity score is the weighted average of the levels, scaled to 100; vertical drivers add to the base criteria.')}</p>
            </Card>
          )}
        </>
      )}
      {sel && (
        <Modal wide title={tx(sel.name, lang)} onClose={() => setSel(null)} footer={<><button className="btn" onClick={() => setSel(null)}>{t('Close')}</button>{manage && sel.status !== 'Published' && <button className="btn btn-primary" onClick={() => setStatus(sel, 'Published')}>{t('Publish')}</button>}{manage && sel.status === 'Published' && <button className="btn" onClick={() => setStatus(sel, 'Retired')}>{t('Retire')}</button>}</>}>
          <p className="small muted">{sel.code} · v{sel.version} · <Status value={sel.status} /></p>
          {tab === 'templates' && <><p className="small">{tx(sel.description, lang)}</p><p className="small"><span className="strong">{t('Phases and gates')}: </span>{(sel.phases || []).map(p => p.e2e).join(' → ')}</p><p className="small"><span className="strong">{t('Roles')}: </span>{(sel.roles || []).map(r => L(r)).join(', ')}</p></>}
          {tab === 'gates' && <><p className="small"><span className="strong">{t('Purpose')}: </span>{tx(sel.purpose, lang)}</p><p className="small"><span className="strong">{t('Entry criteria')}: </span>{tx(sel.entry_criteria, lang)}</p><p className="small"><span className="strong">{t('Exit criteria')}: </span>{tx(sel.exit_criteria, lang)}</p></>}
          {tab === 'checklists' && <ol className="small">{(sel.items || []).map((it, i) => <li key={i}>{tx(it.text, lang)}{it.mandatory ? <span className="muted"> · {t('mandatory')}</span> : ''}{it.evidence ? <span className="muted"> · {t('evidence required')}</span> : ''}</li>)}</ol>}
        </Modal>
      )}
    </>
  );
}
