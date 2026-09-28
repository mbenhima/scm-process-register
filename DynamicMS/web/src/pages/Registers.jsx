import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Loading, ErrorBox, Status, Tabs, Table, tx, Modal, Field } from '../components/ui.jsx';
import { NoProject } from './Home.jsx';

const NAMES = { context: 'Context issues', parties: 'Interested parties', objectives: 'Objectives', obligations: 'Compliance obligations', certificates: 'Certificates', suppliers: 'Suppliers', ideas: 'Improvement ideas', competence: 'Competence', calibration: 'Calibration', reviews: 'Management reviews', incidents: 'Incidents' };
const FIELD_LABELS = { type: 'Type', category: 'Category', impact: 'Impact', needs: 'Needs and expectations', influence: 'Influence', interest: 'Interest', kpi: 'KPI', target: 'Target', current: 'Current value', deadline: 'Deadline', owner: 'Owner', evaluation: 'Evaluation', lastEvaluated: 'Last evaluated', body: 'Certification body', issued: 'Issued', expiry: 'Expiry', number: 'Number', score: 'Score', critical: 'Critical', lastEvaluation: 'Last evaluation', roi: 'ROI (%)', effort: 'Effort', submittedBy: 'Submitted by', role: 'Role', holder: 'Holder', level: 'Level', required: 'Required level', trainedOn: 'Trained on', serial: 'Serial number', lastCalibration: 'Last calibration', nextCalibration: 'Next calibration', location: 'Location', date: 'Date', attendees: 'Attendees', outputs: 'Outputs', lostDays: 'Lost days', investigated: 'Investigated' };

export default function Registers() {
  const { t, L, lang, projectId, fmtDate, toast, can, readOnly } = useApp();
  const { data: regs } = useData(projectId ? `/projects/${projectId}/registers` : null);
  const [reg, setReg] = useState('context');
  const { data, loading, error, reload } = useData(projectId ? `/projects/${projectId}/registers/${reg}` : null, [reg]);
  const [nw, setNw] = useState(null);
  if (!projectId) return <NoProject />;
  const keys = [...new Set((data || []).flatMap(r => Object.keys(r.data || {})))].slice(0, 5);
  const fmt = (v, k) => (v === null || v === undefined ? '—' : typeof v === 'boolean' ? (v ? t('Yes') : t('No')) : Array.isArray(v) ? v.map(x => tx(x, lang)).join(', ') : typeof v === 'object' ? tx(v, lang) : /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? fmtDate(v) : k === 'role' || k === 'owner' ? L(v) : String(v));
  const create = async () => { try { await api(`/projects/${projectId}/registers/${reg}`, { method: 'POST', body: nw }); toast(t('Entry added.')); setNw(null); reload(); } catch (e) { toast(e.message, 'error'); } };
  const canAdd = !readOnly && (can('records.manage') || (reg === 'ideas' && can('records.create')));
  return (
    <>
      <PageHead eyebrow={t('Records')} title={t('Registers')} subtitle={t('The registers each phase of the run fills in: context, parties, objectives, obligations, suppliers, ideas and more.')} actions={canAdd && <button className="btn btn-primary" onClick={() => setNw({ title: '', data: {} })}><Plus size={16} />{reg === 'ideas' ? t('Submit an idea') : t('Add entry')}</button>} />
      <Tabs label={t('Registers')} value={reg} onChange={setReg} tabs={(regs || Object.keys(NAMES).map(key => ({ key }))).filter(r => r.count === undefined || r.count > 0 || r.key === 'ideas').map(r => ({ id: r.key, label: t(NAMES[r.key]), count: r.count }))} />
      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data ? <Loading /> : (
        <Table rows={data} columns={[
          { key: 'code', label: t('Code'), width: 90 },
          { key: 'title', label: t('Title'), render: r => <span className="strong">{tx(r.title, lang)}</span>, sortValue: r => tx(r.title, lang) },
          ...keys.map(k => ({ key: k, label: t(FIELD_LABELS[k] || k), render: r => fmt(r.data?.[k], k), sortValue: r => fmt(r.data?.[k], k) })),
          { key: 'status', label: t('Status'), render: r => <Status value={r.status} /> },
        ]} />
      )}
      {nw && (
        <Modal title={t(NAMES[reg])} onClose={() => setNw(null)} footer={<><button className="btn" onClick={() => setNw(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!nw.title} onClick={create}>{t('Save')}</button></>}>
          <div className="stack">
            <Field label={t('Title')} required>{(id) => <input id={id} className="input" value={nw.title} onChange={e => setNw({ ...nw, title: e.target.value })} />}</Field>
            {keys.slice(0, 3).map(k => <Field key={k} label={t(FIELD_LABELS[k] || k)}>{(id) => <input id={id} className="input" value={nw.data[k] || ''} onChange={e => setNw({ ...nw, data: { ...nw.data, [k]: e.target.value } })} />}</Field>)}
          </div>
        </Modal>
      )}
    </>
  );
}
