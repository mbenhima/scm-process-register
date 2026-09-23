import { useState } from 'react';
import { useAuth } from '../../lib/auth.jsx';
import { useI18n } from '../../lib/i18n.jsx';
import { PageHeader, Card, DataTable, useFetch, StatusBadge, Tabs, Badge } from '../../components/ui.jsx';
import CrudPage from '../../components/CrudPage.jsx';
import { SEVERITY, useObsOptions } from './common.js';

export default function BusinessRules() {
  const { t } = useI18n();
  const { can } = useAuth();
  const [tab, setTab] = useState('rules');
  const obs = useFetch('/obs');
  const actions = useFetch('/actions-registry');
  return (
    <div className="page">
      <PageHeader eyebrow={t('Governance · D03')} title={t('Business rules')} subtitle={t('Condition → action rules. Rules marked "Live (engine)" are enforced by the application; the others are documented in the catalog.')} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'rules', label: t('Rules') }, { value: 'actions', label: t('Actions registry (D03a)') }]} />
      {tab === 'rules' ? (
        <CrudPage endpoint="/business-rules" csvName="business_rules" entityLabel="business rule" newLabel="Add rule" versioned canManage={can('governance.manage')}
          defaults={{ severity: 'Medium', rule_type: 'Validation', evaluation: 'Catalog', active: 1 }}
          columns={[
            { key: 'code', label: t('Rule') }, { key: 'triggering_step', label: t('Step') },
            { key: 'condition', label: t('Condition'), render: (r) => t(r.condition) }, { key: 'action', label: t('Action'), render: (r) => <>{r.action_id && <span className="xs muted">{r.action_id} </span>}{t(r.action)}</> },
            { key: 'rule_type', label: t('Type'), render: (r) => t(r.rule_type) }, { key: 'severity', label: t('Severity'), render: (r) => <StatusBadge value={r.severity} /> },
            { key: 'owner', label: t('Owner'), render: (r) => t(r.owner) }, { key: 'evaluation', label: t('Evaluation'), render: (r) => <Badge tone={r.evaluation === 'Catalog' ? 'outline' : 'accent'}>{t(r.evaluation)}</Badge> },
          ]}
          fields={[
            { key: 'code', label: 'Rule ID' }, { key: 'triggering_step', label: 'Triggering step (e.g. MP-01.3)' },
            { key: 'condition', label: 'Condition', type: 'textarea', required: true }, { key: 'action', label: 'Action', type: 'textarea' },
            { key: 'rule_type', label: 'Rule type', type: 'select', options: ['Routing', 'Calculation', 'Validation', 'Escalation'] },
            { key: 'severity', label: 'Severity', type: 'select', options: SEVERITY, required: true }, { key: 'owner', label: 'Owner', required: true },
            { key: 'process_tag', label: 'Process tag (macro process)' }, { key: 'obs_node_id', label: 'OBS node', type: 'select', options: useObsOptions(obs.data) },
          ]} />
      ) : (
        <Card>{actions.data && <DataTable csvName="actions_registry" rows={actions.data} columns={Object.keys(actions.data[0]).map((k) => ({ key: k, label: t(k.replace(/_/g, ' ')), render: (r) => t(r[k]) }))} />}</Card>
      )}
    </div>
  );
}
