import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Loading, ErrorBox, tx, Modal, Field } from '../components/ui.jsx';
import { NoProject } from './Home.jsx';

const DAY = 86400000;
const d2n = (d) => new Date(`${d}T00:00:00Z`).getTime();

export default function Planning() {
  const { t, lang, projectId, fmtDate, toast, can, readOnly } = useApp();
  const { data, loading, error, reload } = useData(projectId ? `/projects/${projectId}/wbs` : null);
  const [edit, setEdit] = useState(null);
  const rows = useMemo(() => {
    if (!data) return [];
    const out = [];
    const byParent = {};
    for (const n of data.nodes) (byParent[n.parent_id || 'root'] ||= []).push(n);
    const walk = (pid, depth) => { for (const n of (byParent[pid] || []).sort((a, b) => a.seq - b.seq)) { out.push({ kind: 'node', depth, ...n }); for (const aid of n.action_ids || []) { const a = data.actions.find(x => x.id === aid); if (a) out.push({ kind: 'action', depth: depth + 1, id: a.id, name: a.title, start_date: a.start_date, end_date: a.due_date, pct: a.pct, status: a.status }); } walk(n.id, depth + 1); } };
    walk('root', 0);
    return out;
  }, [data]);
  if (!projectId) return <NoProject />;
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const today = data.today;
  const starts = rows.map(r => d2n(r.start_date)); const ends = rows.map(r => d2n(r.end_date));
  const min = Math.min(...starts, d2n(today)) - 7 * DAY; const max = Math.max(...ends, d2n(today)) + 14 * DAY;
  const LW = 300; const W = 1100; const RH = 30; const H = 40 + rows.length * RH;
  const rtl = lang === 'ar';
  const x = (d) => { const v = LW + ((d2n(d) - min) / (max - min)) * (W - LW - 10); return rtl ? W - v : v; };
  const months = []; { const s = new Date(min); s.setUTCDate(1); for (let m = new Date(s); m.getTime() < max; m.setUTCMonth(m.getUTCMonth() + 1)) months.push(m.toISOString().slice(0, 10)); }
  const colour = (r) => (r.pct >= 100 || r.status === 'Closed' ? 'var(--st-5)' : r.end_date < today ? 'var(--st-1)' : r.pct > 0 || r.status === 'InProgress' ? 'var(--pa-orange)' : 'var(--pa-grey-line)');
  const idx = Object.fromEntries(rows.map((r, i) => [r.id, i]));
  const manage = can('records.manage') && !readOnly;
  const save = async () => {
    try { if (edit.id) await api(`/wbs/${edit.id}`, { method: 'PUT', body: edit.form }); else await api(`/projects/${projectId}/wbs`, { method: 'POST', body: edit.form }); toast(t('Saved.')); setEdit(null); reload(); } catch (e) { toast(e.message, 'error'); }
  };
  return (
    <>
      <PageHead eyebrow={t('Records')} title={t('Planning and Gantt')} subtitle={t('Work breakdown structure of the run: one node per phase with its actions, planned dates, progress and dependencies.')} actions={manage && <button className="btn btn-primary" onClick={() => setEdit({ form: { name: '', startDate: today, endDate: today } })}><Plus size={16} />{t('Add node')}</button>} />
      <div className="gantt">
        <svg width={W} height={H} role="img" aria-label={t('Gantt chart')}>
          {months.map(m => <g key={m}><line x1={x(m)} x2={x(m)} y1={24} y2={H} stroke="var(--pa-grey-line)" /><text x={x(m) + (rtl ? -4 : 4)} y={16} textAnchor={rtl ? 'end' : 'start'} style={{ fill: 'var(--pa-grey-medium)' }}>{m.slice(0, 7)}</text></g>)}
          <line x1={x(today)} x2={x(today)} y1={20} y2={H} stroke="var(--pa-grey-dark)" strokeDasharray="4 3" /><text x={x(today)} y={H - 4} textAnchor="middle" style={{ fill: 'var(--pa-grey-dark)', fontWeight: 700 }}>{t('Today')}</text>
          {rows.map((r, i) => {
            const y = 30 + i * RH;
            const x1 = x(r.start_date); const x2 = x(r.end_date); const bx = Math.min(x1, x2); const bw = Math.max(4, Math.abs(x2 - x1));
            return (
              <g key={`${r.kind}${r.id}`} style={{ cursor: manage && r.kind === 'node' ? 'pointer' : 'default' }} onClick={() => manage && r.kind === 'node' && setEdit({ id: r.id, form: { name: tx(r.name, lang), startDate: r.start_date, endDate: r.end_date, pct: r.pct } })}>
                {i % 2 === 1 && <rect x={0} y={y - 4} width={W} height={RH} fill="var(--pa-grey-light)" />}
                <text x={rtl ? W - 8 - r.depth * 14 : 8 + r.depth * 14} y={y + 14} textAnchor={rtl ? 'end' : 'start'} style={{ fontWeight: r.kind === 'node' ? 700 : 400 }}>{(tx(r.name, lang) || '').slice(0, 42)}</text>
                <rect x={bx} y={y + 3} width={bw} height={r.kind === 'node' ? 16 : 12} rx="3" fill={colour(r)} stroke={r.kind === 'node' ? 'var(--pa-grey-ink)' : 'none'} strokeWidth="0.5"><title>{`${tx(r.name, lang)} · ${fmtDate(r.start_date)} → ${fmtDate(r.end_date)} · ${r.pct}%`}</title></rect>
                {r.kind === 'node' && (r.predecessors || []).map(p => idx[p] !== undefined && <path key={p} d={`M${x(rows[idx[p]].end_date)},${30 + idx[p] * RH + 12} C${x(rows[idx[p]].end_date) + (rtl ? -12 : 12)},${30 + idx[p] * RH + 12} ${bx + (rtl ? bw + 12 : -12)},${y + 11} ${rtl ? bx + bw : bx},${y + 11}`} fill="none" stroke="var(--pa-grey-medium)" strokeWidth="1" markerEnd="url(#arr)" />)}
              </g>
            );
          })}
          <defs><marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--pa-grey-medium)" /></marker></defs>
        </svg>
      </div>
      <div className="legend"><span><i style={{ background: 'var(--st-5)' }} />{t('Completed')}</span><span><i style={{ background: 'var(--pa-orange)' }} />{t('In progress')}</span><span><i style={{ background: 'var(--pa-grey-line)' }} />{t('Planned')}</span><span><i style={{ background: 'var(--st-1)' }} />{t('Overdue')}</span></div>
      <p className="caption">{t('Phases and their actions on a shared timeline; arrows show finish-to-start dependencies between phases.')}</p>
      {edit && (
        <Modal title={edit.id ? t('Edit node') : t('Add node')} onClose={() => setEdit(null)} footer={<><button className="btn" onClick={() => setEdit(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!edit.form.name} onClick={save}>{t('Save')}</button></>}>
          <div className="stack">
            <Field label={t('Name')} required>{(id) => <input id={id} className="input" value={edit.form.name} onChange={e => setEdit({ ...edit, form: { ...edit.form, name: e.target.value } })} />}</Field>
            <div className="form-grid">
              <Field label={t('Start')}>{(id) => <input id={id} className="input" type="date" value={edit.form.startDate} onChange={e => setEdit({ ...edit, form: { ...edit.form, startDate: e.target.value } })} />}</Field>
              <Field label={t('End')}>{(id) => <input id={id} className="input" type="date" value={edit.form.endDate} onChange={e => setEdit({ ...edit, form: { ...edit.form, endDate: e.target.value } })} />}</Field>
              {edit.id && <Field label={t('Progress (%)')}>{(id) => <input id={id} className="input" type="number" min="0" max="100" value={edit.form.pct} onChange={e => setEdit({ ...edit, form: { ...edit.form, pct: +e.target.value } })} />}</Field>}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
