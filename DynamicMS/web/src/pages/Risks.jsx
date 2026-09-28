import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Card, Loading, ErrorBox, Status, Tabs, Table, tx, Modal, Field } from '../components/ui.jsx';
import { Heatmap } from '../components/charts.jsx';
import { NoProject } from './Home.jsx';

const scoreClass = (s) => (s >= 16 ? 'st1' : s >= 10 ? 'st2' : s >= 5 ? 'st3' : 'st4');

export default function Risks() {
  const { t, L, lang, projectId, toast, can, readOnly } = useApp();
  const [kind, setKind] = useState('');
  const { data, loading, error, reload } = useData(projectId ? `/projects/${projectId}/risks` : null);
  const { data: roles } = useData('/roles');
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({});
  const rows = useMemo(() => (data || []).filter(r => !kind || r.kind === kind), [data, kind]);
  if (!projectId) return <NoProject />;
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const heat = []; for (const r of data.filter(x => x.kind !== 'Opportunity')) { const c = heat.find(h => h.l === r.likelihood && h.i === r.impact); if (c) c.n++; else heat.push({ l: r.likelihood, i: r.impact, n: 1 }); }
  const kinds = ['Risk', 'Opportunity', 'Hazard', 'Aspect'].filter(k => data.some(r => r.kind === k));
  const manage = can('governance.manage') && !readOnly;
  const openNew = () => { setForm({ kind: kind || 'Risk', likelihood: 3, impact: 3, ownerRole: 'risk_manager' }); setEdit('new'); };
  const openEdit = (r) => { setForm({ title: tx(r.title, lang), kind: r.kind, likelihood: r.likelihood, impact: r.impact, ownerRole: r.owner_role, status: r.status, treatment: tx(r.treatment, lang), residual: r.residual ?? '' }); setEdit(r); };
  const save = async () => {
    try {
      if (edit === 'new') await api(`/projects/${projectId}/risks`, { method: 'POST', body: form });
      else await api(`/risks/${edit.id}`, { method: 'PUT', body: { ...form, residual: form.residual === '' ? undefined : +form.residual } });
      toast(t('Saved.')); setEdit(null); reload();
    } catch (e) { toast(e.message, 'error'); }
  };
  return (
    <>
      <PageHead eyebrow={t('Governance')} title={t('Risks and opportunities')} subtitle={t('Risk register of the project, scored likelihood × impact on a 1–5 scale. QHSE runs also hold OH&S hazards and environmental aspects.')} actions={manage && <button className="btn btn-primary" onClick={openNew}><Plus size={16} />{t('Add')}</button>} />
      <div className="grid-main">
        <div>
          <Tabs label={t('Kind')} value={kind} onChange={setKind} tabs={[{ id: '', label: t('All'), count: data.length }, ...kinds.map(k => ({ id: k, label: L(k), count: data.filter(r => r.kind === k).length }))]} />
          <Table rows={rows} onRowClick={manage ? openEdit : undefined} initialSort={{ key: 'score', dir: 'desc' }} columns={[
            { key: 'code', label: t('Code'), width: 90 },
            { key: 'kind', label: t('Kind'), render: r => L(r.kind) },
            { key: 'title', label: t('Title'), render: r => <span className="strong">{tx(r.title, lang)}</span>, sortValue: r => tx(r.title, lang) },
            { key: 'category', label: t('Category'), render: r => L(r.category) },
            { key: 'score', label: t('Score'), cellClass: r => (r.kind === 'Opportunity' ? 'st4' : scoreClass(r.score)), render: r => <span className="num strong">{r.likelihood}×{r.impact}={r.score}</span> },
            { key: 'residual', label: t('Residual'), render: r => r.residual ?? '—' },
            { key: 'owner_role', label: t('Owner'), render: r => tx(roles?.find(x => x.code === r.owner_role)?.name, lang) || r.owner_role },
            { key: 'status', label: t('Status'), render: r => <Status value={r.status} /> },
          ]} />
        </div>
        <Card title={t('Heatmap')}><Heatmap cells={heat} likelihoodLabel={t('Likelihood')} impactLabel={t('Impact')} caption={t('Count of open risks, hazards and aspects per cell; red cells need treatment first.')} /></Card>
      </div>
      {edit && (
        <Modal title={edit === 'new' ? t('New entry') : `${edit.code} — ${t('Edit')}`} onClose={() => setEdit(null)} footer={<><button className="btn" onClick={() => setEdit(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!form.title} onClick={save}>{t('Save')}</button></>}>
          <div className="stack">
            <Field label={t('Title')} required>{(id) => <input id={id} className="input" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} />}</Field>
            <div className="form-grid">
              {edit === 'new' && <Field label={t('Kind')}>{(id) => <select id={id} className="select" value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })}>{['Risk', 'Opportunity', 'Hazard', 'Aspect'].map(k => <option key={k} value={k}>{L(k)}</option>)}</select>}</Field>}
              <Field label={t('Likelihood (1–5)')}>{(id) => <input id={id} className="input" type="number" min="1" max="5" value={form.likelihood} onChange={e => setForm({ ...form, likelihood: +e.target.value })} />}</Field>
              <Field label={t('Impact (1–5)')}>{(id) => <input id={id} className="input" type="number" min="1" max="5" value={form.impact} onChange={e => setForm({ ...form, impact: +e.target.value })} />}</Field>
              {edit !== 'new' && <Field label={t('Residual score')}>{(id) => <input id={id} className="input" type="number" value={form.residual} onChange={e => setForm({ ...form, residual: e.target.value })} />}</Field>}
              <Field label={t('Owner')}>{(id) => <select id={id} className="select" value={form.ownerRole} onChange={e => setForm({ ...form, ownerRole: e.target.value })}>{(roles || []).map(r => <option key={r.code} value={r.code}>{tx(r.name, lang)}</option>)}</select>}</Field>
              {edit !== 'new' && <Field label={t('Status')}>{(id) => <select id={id} className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{['Open', 'Treated', 'Monitoring', 'Closed'].map(k => <option key={k} value={k}>{L(k)}</option>)}</select>}</Field>}
            </div>
            <Field label={t('Treatment')}>{(id) => <textarea id={id} className="textarea" value={form.treatment || ''} onChange={e => setForm({ ...form, treatment: e.target.value })} />}</Field>
          </div>
        </Modal>
      )}
    </>
  );
}
