import { useState } from 'react';
import { useAuth } from '../../lib/auth.jsx';
import { useI18n } from '../../lib/i18n.jsx';
import { PageHeader, Card, CardHead, useFetch, StatusBadge, Select, Badge } from '../../components/ui.jsx';
import { BarChart } from '../../components/charts.jsx';
import CrudPage from '../../components/CrudPage.jsx';
import { COSO, useObsOptions } from './common.js';

export default function Controls() {
  const { t } = useI18n();
  const { can } = useAuth();
  const obs = useFetch('/obs');
  const cov = useFetch('/controls-coverage');
  const [std, setStd] = useState('');
  return (
    <div className="page">
      <PageHeader eyebrow={t('Governance · D04')} title={t('Controls (COSO)')} subtitle={t('Every control is classified under one of the five COSO Internal Control components.')} />
      {cov.data && (
        <Card style={{ marginBottom: 24 }}>
          <CardHead title={t('COSO coverage')} subtitle={t('Controls per component: all controls (orange) and controls rated Effective (grey).')} />
          <BarChart data={cov.data.map((c) => ({ label: t(c.component).split(' ')[0], value: c.total, secondary: c.effective || 0 }))} primaryLabel={t('All controls')} secondaryLabel={t('Effective')}
            caption={t('All five COSO components are covered; the gap between the bars shows controls not yet rated Effective.')} height={200} />
        </Card>
      )}
      <CrudPage endpoint="/controls" csvName="controls" entityLabel="control" newLabel="Add control" versioned canManage={can('governance.manage')} filter={(c) => !std || c.standard_tag === std}
        toolbar={<Select aria-label={t('Standard')} value={std} onChange={(e) => setStd(e.target.value)} placeholder={t('All controls')} options={['GDPR', 'ISO27001', 'SOC2', 'ISO27701', 'HIPAA', 'ISO9001'].map((s) => ({ value: s, label: s }))} style={{ width: 'auto' }} />}
        defaults={{ control_type: 'Preventive', coso_component: 'Control Activities', effectiveness: 'Not tested', testing_frequency: 'Quarterly' }}
        columns={[
          { key: 'code', label: t('Control') }, { key: 'name', label: t('Name'), render: (c) => <><div className="strong">{t(c.name)}</div><div className="xs muted">{t(c.description)}</div></> },
          { key: 'control_type', label: t('Type'), render: (c) => t(c.control_type) }, { key: 'coso_component', label: t('COSO component'), render: (c) => t(c.coso_component) },
          { key: 'testing_frequency', label: t('Testing'), render: (c) => t(c.testing_frequency) }, { key: 'owner', label: t('Owner'), render: (c) => t(c.owner) },
          { key: 'effectiveness', label: t('Effectiveness'), render: (c) => <StatusBadge value={c.effectiveness} /> },
          { key: 'standard_tag', label: t('Standard'), render: (c) => (c.standard_tag ? <Badge>{c.standard_tag}</Badge> : '—') },
        ]}
        fields={[
          { key: 'code', label: 'Control ID' }, { key: 'name', label: 'Name', required: true }, { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'control_type', label: 'Control type', type: 'select', options: ['Preventive', 'Detective'] }, { key: 'coso_component', label: 'COSO component', type: 'select', options: COSO, required: true },
          { key: 'testing_frequency', label: 'Testing frequency', type: 'select', options: ['Continuous', 'Monthly', 'Quarterly', 'Annual', 'Per change'] },
          { key: 'owner', label: 'Owner', required: true }, { key: 'effectiveness', label: 'Effectiveness', type: 'select', options: ['Effective', 'Partially effective', 'Not effective', 'Not tested'] },
          { key: 'linked_steps', label: 'Linked steps' }, { key: 'standard_tag', label: 'Compliance standard tag', type: 'select', options: ['GDPR', 'ISO27001', 'SOC2', 'ISO27701', 'HIPAA', 'ISO9001'] },
          { key: 'process_tag', label: 'Process tag (macro process)' }, { key: 'obs_node_id', label: 'OBS node', type: 'select', options: useObsOptions(obs.data) },
        ]} />
      <p className="muted" style={{ marginTop: 12 }}>{t('A standard tag records which framework a control supports. It is not a certification.')}</p>
    </div>
  );
}
