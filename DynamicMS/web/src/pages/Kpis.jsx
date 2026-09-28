import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Card, Loading, ErrorBox, Status, Table, tx, Modal, Field } from '../components/ui.jsx';
import { LineChart, Sparkline } from '../components/charts.jsx';
import { NoProject } from './Home.jsx';

const FREQS = ['Weekly', 'Monthly', 'Quarterly', 'Semi-annual', 'Annual'];

export default function Kpis() {
  const { t, L, lang, projectId, toast, can, fmtNum, readOnly } = useApp();
  const { data, loading, error, reload } = useData(projectId ? `/projects/${projectId}/kpis` : null);
  const [sel, setSel] = useState(null);
  const [m, setM] = useState({ period: new Date().toISOString().slice(0, 7), value: '', comment: '' });
  const [nk, setNk] = useState(null);
  if (!projectId) return <NoProject />;
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const k = data.find(x => x.id === sel) || data[0];
  const manage = can('governance.manage') && !readOnly;
  const record = async () => {
    try { const r = await api(`/kpis/${k.id}/values`, { method: 'POST', body: m }); toast(r.onTarget ? t('Measurement recorded; target met.') : t('Measurement recorded; an off-target alert was raised.')); setM({ ...m, value: '', comment: '' }); reload(); } catch (e) { toast(e.message, 'error'); }
  };
  const create = async () => {
    try { await api(`/projects/${projectId}/kpis`, { method: 'POST', body: nk }); toast(t('KPI created.')); setNk(null); reload(); } catch (e) { toast(e.message, 'error'); }
  };
  const on = data.filter(x => x.onTarget === true).length;
  return (
    <>
      <PageHead eyebrow={t('Governance')} title={t('KPIs')} subtitle={t('{on} of {n} KPIs meet their target on the last measurement.', { on, n: data.length })} actions={manage && <button className="btn btn-primary" onClick={() => setNk({ name: '', formula: '', unit: '%', target: 90, direction: 'up', frequency: 'Monthly', analysisFrequency: 'Quarterly' })}><Plus size={16} />{t('Custom KPI')}</button>} />
      <div className="grid-main">
        <Table rows={data} onRowClick={(r) => setSel(r.id)} columns={[
          { key: 'code', label: t('Code'), width: 100 },
          { key: 'name', label: t('Name'), render: r => <span className="strong">{tx(r.name, lang)}</span>, sortValue: r => tx(r.name, lang) },
          { key: 'target_text', label: t('Target'), render: r => <span className="ltr">{r.target_text}</span> },
          { key: 'last', label: t('Last value'), render: r => <span className="num">{fmtNum(r.last)}</span> },
          { key: 'trend', label: t('Trend'), sortable: false, render: r => <Sparkline values={r.series.map(s => s.value)} good={r.onTarget !== false} /> },
          { key: 'onTarget', label: t('Status'), render: r => <Status value={r.onTarget === null ? null : r.onTarget ? 'On track' : 'At risk'} /> },
        ]} />
        {k && (
          <div className="stack">
            <Card title={`${k.code} — ${tx(k.name, lang)}`}>
              <LineChart series={k.series} target={k.target} unit={k.unit} seriesLabel={t('Measured value')} targetLabel={t('Target')} caption={t('Monthly values against the target ({t}).', { t: k.target_text })} />
              <dl className="small stack-8" style={{ marginTop: 16 }}>
                <div><dt className="muted xsmall">{t('Formula')}</dt><dd style={{ margin: 0 }}>{tx(k.formula, lang)}</dd></div>
                <div className="row"><span><span className="muted xsmall">{t('Measured')}</span> {L(k.frequency)}</span><span><span className="muted xsmall">{t('Analysed')}</span> {L(k.analysis_frequency)}</span><span><span className="muted xsmall">{t('Source')}</span> {k.source}</span></div>
              </dl>
            </Card>
            {manage || can('records.manage') ? (
              <Card title={t('Record a measurement')}>
                <div className="form-grid">
                  <Field label={t('Period')} required>{(id) => <input id={id} className="input" type="month" value={m.period} onChange={e => setM({ ...m, period: e.target.value })} />}</Field>
                  <Field label={t('Value')} required>{(id) => <input id={id} className="input num" type="number" step="any" value={m.value} onChange={e => setM({ ...m, value: e.target.value })} />}</Field>
                </div>
                <div style={{ marginTop: 12 }}><Field label={t('Comment')}>{(id) => <input id={id} className="input" value={m.comment} onChange={e => setM({ ...m, comment: e.target.value })} />}</Field></div>
                <div className="row" style={{ marginTop: 16 }}><button className="btn btn-primary" disabled={m.value === '' || readOnly} onClick={record}>{t('Record')}</button></div>
              </Card>
            ) : null}
          </div>
        )}
      </div>
      {nk && (
        <Modal title={t('Custom KPI')} onClose={() => setNk(null)} footer={<><button className="btn" onClick={() => setNk(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!nk.name || !nk.formula} onClick={create}>{t('Create')}</button></>}>
          <div className="stack">
            <Field label={t('Name')} required>{(id) => <input id={id} className="input" value={nk.name} onChange={e => setNk({ ...nk, name: e.target.value })} />}</Field>
            <Field label={t('Formula')} required>{(id) => <input id={id} className="input" value={nk.formula} onChange={e => setNk({ ...nk, formula: e.target.value })} />}</Field>
            <div className="form-grid">
              <Field label={t('Target')} required>{(id) => <input id={id} className="input" type="number" value={nk.target} onChange={e => setNk({ ...nk, target: e.target.value })} />}</Field>
              <Field label={t('Unit')}>{(id) => <input id={id} className="input" value={nk.unit} onChange={e => setNk({ ...nk, unit: e.target.value })} />}</Field>
              <Field label={t('Direction of good')}>{(id) => <select id={id} className="select" value={nk.direction} onChange={e => setNk({ ...nk, direction: e.target.value })}><option value="up">{t('Higher is better')}</option><option value="down">{t('Lower is better')}</option></select>}</Field>
              <Field label={t('Measurement frequency')}>{(id) => <select id={id} className="select" value={nk.frequency} onChange={e => setNk({ ...nk, frequency: e.target.value })}>{FREQS.map(f => <option key={f} value={f}>{L(f)}</option>)}</select>}</Field>
              <Field label={t('Analysis frequency')} hint={t('Not more frequent than the measurement (BR-011).')}>{(id) => <select id={id} className="select" value={nk.analysisFrequency} onChange={e => setNk({ ...nk, analysisFrequency: e.target.value })}>{FREQS.map(f => <option key={f} value={f}>{L(f)}</option>)}</select>}</Field>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
