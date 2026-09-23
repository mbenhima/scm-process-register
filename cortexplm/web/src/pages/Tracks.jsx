import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, RotateCcw } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { put, post } from '../lib/api.js';
import { PageHeader, Card, CardHead, DataTable, useFetch, Skeleton, ErrorNote, Tabs, Badge, JustifyModal, useToast, Button, Field, Input, fmtDate } from '../components/ui.jsx';

const CLS = { Mandatory: 'm-full', Optional: 'm-cond', 'Not activated': 'm-no' };

export default function Tracks() {
  const { t } = useI18n();
  const { can } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('overview');
  const ref = useFetch('/reference/tracks');
  const cfg = useFetch('/track-config');
  const settings = useFetch('/settings');
  const [edit, setEdit] = useState(null);
  const [obs, setObs] = useState('');
  if (ref.error) return <div className="page"><ErrorNote error={ref.error} /></div>;
  if (!ref.data || !cfg.data) return <div className="page"><Skeleton h={500} /></div>;
  const R = ref.data; const M = cfg.data.matrix;
  const next = (s) => (s === 'Mandatory' ? 'Optional' : s === 'Optional' ? 'Not activated' : 'Mandatory');
  const save = async (justification) => {
    try { await put('/track-config', { ...edit, justification }); toast.ok(t('Track configuration saved as a new version.')); setEdit(null); cfg.reload(); } catch (e) { toast.err(e); }
  };
  return (
    <div className="page">
      <PageHeader eyebrow={t('MP-123 Innovation track configuration')} title={t('Track configuration')} subtitle={t('Three tracks scale rigor to complexity: which macro processes are mandatory, which E2E processes run, which gates apply and how deep checklists go.')}
        actions={!cfg.data.editable && <Badge><Lock size={12} aria-hidden /> {t('Read only: editing needs track management rights and the Innovation & Portfolio pack.')}</Badge>} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'overview', label: t('Tracks') }, { value: 'matrix', label: t('Activation matrix') }, { value: 'scoring', label: t('Scoring model') }, { value: 'rules', label: t('Rules R1 to R4') }, { value: 'versions', label: t('Versions') }]} />
      {tab === 'overview' && (
        <div className="stack">
          <div className="grid three">
            {R.tracks.map((tr) => (
              <Card key={tr.Track}>
                <div className="eyebrow">{t(tr.Complexity)}</div>
                <h3>{t(tr.Track)} {t('Track')}</h3>
                <dl className="kv" style={{ marginTop: 12 }}><dt>{t('Macro processes')}</dt><dd>{t(tr['Macro processes'])}</dd><dt>{t('E2E processes')}</dt><dd>{t(tr['E2E processes'])}</dd><dt>{t('Gates')}</dt><dd>{tr.Gates}</dd><dt>{t('Checklist items per gate')}</dt><dd>{tr['Checklist items per gate']}</dd></dl>
              </Card>
            ))}
          </div>
          <Card><CardHead title={t('E2E processes activated per track')} />
            <DataTable filterable={false} rows={R.summary} columns={[{ key: 'E2E', label: t('E2E'), render: (r) => <Link to={`/e2e/${r.E2E}`}>{r.E2E}</Link> }, { key: 'End-to-end process', label: t('End-to-end process'), render: (r) => t(r['End-to-end process']) }, ...['Full Track', 'Light Track', 'Fast Track'].map((k) => ({ key: k, label: t(k), render: (r) => t(r[k]) }))]} />
          </Card>
          <Card><CardHead title={t('Light Track observation period (Rule R1)')} subtitle={t('Days between the T3 Go-Live decision and the start of E2E-07 in the Light Track.')} />
            <div className="row"><Field label={t('Observation period (days)')}><Input type="number" min="0" max="730" value={obs || settings.data?.light_observation_days || ''} onChange={(e) => setObs(e.target.value)} disabled={!can('governance.manage')} /></Field>
              {can('governance.manage') && <Button variant="primary" disabled={!obs} onClick={async () => { try { await put('/settings', { light_observation_days: Number(obs) }); toast.ok(t('Saved.')); settings.reload(); } catch (e) { toast.err(e); } }}>{t('Save')}</Button>}</div>
          </Card>
        </div>
      )}
      {tab === 'matrix' && (
        <Card>
          <div className="legend"><span><i style={{ background: 'var(--st-4)' }} />{t('Mandatory')}</span><span><i style={{ background: 'var(--st-2)' }} />{t('Optional')}</span><span><i style={{ background: 'var(--st-1)' }} />{t('Not activated')}</span>{cfg.data.editable && <span>{t('Select a cell to change it. Each change creates a new version.')}</span>}</div>
          <div className="table-wrap" style={{ maxHeight: '70vh' }}>
            <table className="matrix sticky-first" style={{ width: '100%' }}>
              <thead><tr><th className="left">{t('Macro process')}</th>{['Full', 'Light', 'Fast'].map((k) => <th key={k}>{t(`${k} Track`)}</th>)}</tr></thead>
              <tbody>{Object.entries(M).sort((a, b) => Number(a[0].slice(3)) - Number(b[0].slice(3))).map(([mp, row]) => (
                <tr key={mp}><td className="left"><Link to={`/library/${mp}`}>{mp}</Link> {t(R.matrix.find((x) => x.MP === mp)?.['Macro process'])}</td>
                  {['Full', 'Light', 'Fast'].map((k) => (
                    <td key={k} className={CLS[row[k]] || 'm-cond'}>
                      {cfg.data.editable ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEdit({ mp, track: k, state: next(row[k]) })} title={t('Change to {s}', { s: t(next(row[k])) })}>{t(row[k])}{cfg.data.defaults[mp][k] !== row[k] ? ' *' : ''}</button> : t(row[k])}
                    </td>))}
                </tr>))}</tbody>
            </table>
          </div>
          <p className="chart-caption">{t('Activation status of each macro process per track. * marks a change from the reference configuration.')}</p>
        </Card>
      )}
      {tab === 'scoring' && (
        <div className="grid two-even">
          <Card><CardHead title={t('Complexity criteria')} /><DataTable filterable={false} rows={R.scoring} columns={Object.keys(R.scoring[0]).map((k) => ({ key: k, label: t(k), render: (r) => <span className="small">{t(r[k])}</span> }))} /></Card>
          <Card><CardHead title={t('Thresholds and override rules')} /><DataTable filterable={false} rows={R.thresholds} columns={Object.keys(R.thresholds[0]).map((k) => ({ key: k, label: t(k), render: (r) => t(r[k]) }))} /></Card>
        </div>
      )}
      {tab === 'rules' && <div className="grid two-even">{R.rules.map((r) => <Card key={r.id}><div className="eyebrow">{r.id}</div><h3>{t(r.title)}</h3><p className="small" style={{ marginTop: 8 }}>{t(r.text)}</p></Card>)}</div>}
      {tab === 'versions' && (
        <Card>
          <DataTable rows={cfg.data.versions} filterable={false} columns={[
            { key: 'version', label: t('Version'), num: true }, { key: 'created_at', label: t('Date'), render: (v) => fmtDate(v.created_at) }, { key: 'user_name', label: t('By') },
            { key: 'justification', label: t('Justification') }, { key: 'changes', label: t('Changes'), render: (v) => <span className="xs">{v.changes.slice(-3).join('; ') || '—'}</span> },
            { key: 'is_current', label: t('Current'), render: (v) => (v.is_current ? <Badge tone="s5">{t('Current')}</Badge> : cfg.data.editable ? <Button size="sm" icon={RotateCcw} onClick={async () => { try { await post(`/track-config/revert/${v.version}`); toast.ok(t('Reverted; a new current version was created.')); cfg.reload(); } catch (e) { toast.err(e); } }}>{t('Restore')}</Button> : '—') },
          ]} empty={t('No change yet: the reference configuration (Section 7.2) applies.')} />
        </Card>
      )}
      {edit && <JustifyModal title={t('{mp} in the {tr} Track: set to {s}', { mp: edit.mp, tr: t(edit.track), s: t(edit.state) })} onCancel={() => setEdit(null)} onConfirm={save} />}
    </div>
  );
}
