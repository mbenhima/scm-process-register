import { useMemo, useState } from 'react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Loading, ErrorBox, tx, Modal, Search } from '../components/ui.jsx';
import { NoProject } from './Home.jsx';
import { useIdName } from '../lib/names.js';

const LETTERS = ['', 'R', 'A', 'C', 'S', 'I'];
const COLOR = { A: 'var(--aiv-azure)', R: 'var(--aiv-azure-tint)', C: 'var(--st-3)', S: 'var(--st-4)', I: 'var(--aiv-bg)' };

export default function Racsi() {
  const idName = useIdName();
  const { t, lang, projectId, toast, can, readOnly } = useApp();
  const { data, loading, error, reload } = useData(projectId ? `/projects/${projectId}/racsi` : null);
  const [q, setQ] = useState('');
  const [e2e, setE2e] = useState('');
  const [edit, setEdit] = useState(null);
  const rows = useMemo(() => (data?.activities || []).filter(a => (!e2e || a.e2e_id === e2e) && (!q || tx(a.name, lang).toLowerCase().includes(q.toLowerCase()))), [data, q, e2e, lang]);
  if (!projectId) return <NoProject />;
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const roles = data.roles;
  const manage = can('governance.manage') && !readOnly;
  const letterOf = (a, code) => a.assignments.filter(x => x.assignee === code).map(x => x.letter).join('');
  const save = async () => {
    const assignments = Object.entries(edit.map).flatMap(([code, letters]) => letters.split('').filter(Boolean).map(l => ({ letter: l, assignee: code })));
    try { await api(`/racsi/${edit.a.id}`, { method: 'PUT', body: { assignments } }); toast(t('RACSI updated.')); setEdit(null); reload(); } catch (e) { toast(e.message, 'error'); }
  };
  const e2es = [...new Set(data.activities.map(a => a.e2e_id).filter(Boolean))].sort();
  return (
    <>
      <PageHead eyebrow={t('Governance')} title={t('RACSI matrix')} subtitle={t('Who is Responsible, Accountable, Consulted, Support and Informed for each activity. Each activity has exactly one Accountable.')} />
      <div className="row" style={{ marginBottom: 16 }}>
        <div style={{ flex: '1 1 260px' }}><Search value={q} onChange={setQ} placeholder={t('Search activities')} /></div>
        <select className="select" style={{ width: 'auto' }} aria-label={t('Phase')} value={e2e} onChange={e => setE2e(e.target.value)}><option value="">{t('All phases')}</option>{e2es.map(x => <option key={x} value={x}>{x}</option>)}</select>
      </div>
      <div className="table-wrap" style={{ maxHeight: '70vh', overflow: 'auto' }}>
        <table className="data">
          <thead><tr><th scope="col" style={{ minWidth: 260, position: 'sticky', insetInlineStart: 0, zIndex: 2 }}>{t('Activity')}</th>{roles.map(r => <th key={r.code} scope="col" style={{ writingMode: 'vertical-rl', transform: lang === 'ar' ? 'none' : 'rotate(180deg)', height: 150, padding: '8px 4px', verticalAlign: 'bottom' }}>{tx(r.name, lang)}</th>)}</tr></thead>
          <tbody>
            {rows.map(a => (
              <tr key={a.id} className={manage ? 'clickable' : ''} tabIndex={manage ? 0 : undefined} onClick={manage ? () => setEdit({ a, map: Object.fromEntries(roles.map(r => [r.code, letterOf(a, r.code)])) }) : undefined} onKeyDown={manage ? (ev) => { if (ev.key === 'Enter') setEdit({ a, map: Object.fromEntries(roles.map(r => [r.code, letterOf(a, r.code)])) }); } : undefined}>
                <td style={{ position: 'sticky', insetInlineStart: 0 }}><span className="xsmall muted">{idName(a.e2e_id)}{a.mp_id ? ` · ${idName(a.mp_id)}` : ''}</span><br /><span className="strong">{tx(a.name, lang)}</span></td>
                {roles.map(r => { const l = letterOf(a, r.code); return <td key={r.code} style={{ padding: 4, textAlign: 'center' }}>{l && <span className="matrix-cell" style={{ background: COLOR[l[0]], color: 'var(--aiv-navy)' }}>{l}</span>}</td>; })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="caption">{t('A accountable (orange), R responsible, C consulted, S support, I informed. Select a row to edit it.')}</p>
      {edit && (
        <Modal wide title={tx(edit.a.name, lang)} onClose={() => setEdit(null)} footer={<><button className="btn" onClick={() => setEdit(null)}>{t('Cancel')}</button><button className="btn btn-primary" onClick={save}>{t('Save')}</button></>}>
          <p className="small">{t('Choose one letter per role. Exactly one role must be Accountable (A).')}</p>
          <div className="form-grid">
            {roles.map(r => (
              <label key={r.code} className="field"><span className="label">{tx(r.name, lang)}</span>
                <select className="select" value={edit.map[r.code]?.[0] || ''} onChange={e => setEdit({ ...edit, map: { ...edit.map, [r.code]: e.target.value } })}>{LETTERS.map(l => <option key={l} value={l}>{l || '—'}</option>)}</select>
              </label>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
