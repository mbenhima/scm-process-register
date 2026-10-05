import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { download } from '../lib/api.js';
import { PageHead, Loading, ErrorBox, tx, usePaged, Pager } from '../components/ui.jsx';

const CELL = { Completed: 'var(--st-5)', 'In progress': 'var(--st-3)', 'At gate': 'var(--st-2)', 'On hold': 'var(--st-1)', 'Not started': 'var(--aiv-white)', 'Not applicable': 'var(--aiv-bg)' };

export default function Portfolio() {
  const { t, L, lang, tree, me, setProjectId, toast } = useApp();
  const navigate = useNavigate();
  const groups = tree?.groups || [];
  const [scope, setScope] = useState(me.org?.groupId ? `g:${me.org.groupId}` : 'own');
  const [ms, setMs] = useState('');
  const path = scope.startsWith('g:') ? `/portfolio?groupId=${scope.slice(2)}` : scope === 'own' ? '/portfolio' : `/portfolio?orgIds=${scope.slice(2)}`;
  const { data, loading, error } = useData(path);
  const rows = (data?.rows || []).filter(r => !ms || r.ms === ms);
  const { shown, pager, needed } = usePaged(rows, `${scope}|${ms}`);
  return (
    <>
      <PageHead eyebrow={t('Insight')} title={t('Portfolio')} subtitle={t('One row per project and one column per lifecycle stage. Projects of other organizations of your group are read-only.')}
        actions={<button className="btn" onClick={() => download(`${path}${path.includes('?') ? '&' : '?'}format=csv`, 'portfolio.csv').catch(e => toast(e.message, 'error'))}><Download size={16} />{t('Export CSV')}</button>} />
      <div className="row" style={{ marginBottom: 16 }}>
        <label className="sr-only" htmlFor="pf-scope">{t('Scope')}</label>
        <select id="pf-scope" className="select" style={{ width: 'auto', maxWidth: 360 }} value={scope} onChange={e => setScope(e.target.value)}>
          <option value="own">{t('My organization')}</option>
          {groups.map(g => <option key={g.id} value={`g:${g.id}`}>{t('Group')}: {tx(g.name, lang)}</option>)}
          {(tree?.independent || []).map(o => <option key={o.id} value={`o:${o.id}`}>{tx(o.name, lang)}</option>)}
        </select>
        <select className="select" style={{ width: 'auto' }} aria-label={t('Management system')} value={ms} onChange={e => setMs(e.target.value)}><option value="">{t('QMS and QHSE')}</option><option value="QMS">QMS</option><option value="QHSE">QHSE</option></select>
        <span className="small muted">{t('{n} projects', { n: rows.length })}</span>
      </div>
      {error && <ErrorBox error={error} />}
      {loading && !data ? <Loading /> : data && (
        <>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th scope="col" style={{ minWidth: 280 }}>{t('Project')}</th><th scope="col">%</th>{data.stages.map(s => <th key={s.id} scope="col" title={tx(s.name, lang)} style={{ textAlign: 'center' }}>{s.id.slice(4)}</th>)}</tr></thead>
              <tbody>
                {shown.map(r => (
                  <tr key={r.id} className="clickable" tabIndex={0} onClick={() => { setProjectId(r.id); navigate('/lifecycle'); }} onKeyDown={e => { if (e.key === 'Enter') { setProjectId(r.id); navigate('/lifecycle'); } }}>
                    <td><span className="strong">{r.code}</span>{r.access === 'read' && <span className="tag outline" style={{ marginInlineStart: 8 }}>{t('Read-only')}</span>}<br /><span className="xsmall muted">{tx(r.org, lang)}</span></td>
                    <td className="num">{r.progress}%</td>
                    {data.stages.map(s => { const c = r.cells[s.id]; return <td key={s.id} style={{ padding: 4 }}><span className="matrix-cell" style={{ background: CELL[c.status], border: c.status === 'Not started' ? '1px solid var(--aiv-line)' : 0 }} title={`${r.code} · ${s.id} ${tx(s.name, lang)} · ${L(c.status)}${c.runs > 1 ? ` · ×${c.runs}` : ''}`}>{c.runs > 1 ? `×${c.runs}` : ''}</span></td>; })}
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td className="strong">{t('Completed per stage')}</td><td />{data.stages.map(s => <td key={s.id} className="num small" style={{ textAlign: 'center' }}>{data.totals[s.id]?.Completed || 0}</td>)}</tr></tfoot>
            </table>
          </div>
          {needed && <Pager {...pager} />}
          <div className="legend">{data.legend.map(l => <span key={l}><i style={{ background: CELL[l], border: '1px solid var(--aiv-line)' }} />{L(l)}</span>)}</div>
          <p className="caption">{t('Status of every lifecycle stage per project; ×2 marks a stage that ran twice (recurring phases).')}</p>
        </>
      )}
    </>
  );
}
