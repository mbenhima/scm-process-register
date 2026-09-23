import { useState } from 'react';
import { useAuth } from '../../lib/auth.jsx';
import { useI18n } from '../../lib/i18n.jsx';
import { PageHeader, Card, CardHead, useFetch, StatusBadge, Segmented } from '../../components/ui.jsx';
import { RiskHeatmap } from '../../components/charts.jsx';
import CrudPage from '../../components/CrudPage.jsx';
import { useObsOptions } from './common.js';

export default function Risks() {
  const { t } = useI18n();
  const { can } = useAuth();
  const [kind, setKind] = useState('Risk');
  const [cell, setCell] = useState(null);
  const obs = useFetch('/obs');
  const heat = useFetch(`/risk-heatmap?kind=${kind}`);
  return (
    <div className="page">
      <PageHeader eyebrow={t('Governance · D05')} title={t('Risks & opportunities')} subtitle={t('Likelihood and impact from 1 to 5; the score (1 to 25) is calculated automatically.')}
        actions={<Segmented label={t('Type')} value={kind} onChange={(v) => { setKind(v); setCell(null); }} options={[{ value: 'Risk', label: t('Risks') }, { value: 'Opportunity', label: t('Opportunities') }]} />} />
      <div className="grid two" style={{ marginBottom: 24 }}>
        <div>
          <CrudPage endpoint="/risks" csvName="risks" entityLabel={kind === 'Risk' ? 'risk' : 'opportunity'} newLabel={kind === 'Risk' ? 'Add risk' : 'Add opportunity'} canManage={can('governance.manage')}
            filter={(r) => r.kind === kind && (!cell || (r.likelihood === cell[0] && r.impact === cell[1]))} defaults={{ kind, likelihood: 3, impact: 3, status: 'Open' }}
            toolbar={cell && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCell(null)}>{t('Clear cell filter')} ({cell[0]}×{cell[1]})</button>}
            columns={[
              { key: 'code', label: t('ID') }, { key: 'name', label: t('Name'), render: (r) => <><div className="strong">{t(r.name)}</div><div className="xs muted">{t(r.category)}</div></> },
              { key: 'score', label: t('Score'), num: true, render: (r) => <StatusBadge value={r.score >= 20 ? 'Critical' : r.score >= 12 ? 'High' : r.score >= 6 ? 'Medium' : 'Low'}>{r.score}</StatusBadge> },
              { key: 'residual_score', label: t('Residual'), num: true }, { key: 'mitigating_controls', label: t('Controls'), render: (r) => <span className="xs">{r.mitigating_controls || '—'}</span> },
              { key: 'owner', label: t('Owner'), render: (r) => t(r.owner) }, { key: 'status', label: t('Status'), render: (r) => <StatusBadge value={r.status} /> },
            ]}
            fields={[
              { key: 'code', label: 'ID' }, { key: 'name', label: 'Name', required: true }, { key: 'kind', label: 'Type', type: 'select', options: ['Risk', 'Opportunity'], required: true },
              { key: 'category', label: 'Category' }, { key: 'likelihood', label: 'Likelihood (1-5)', type: 'number', min: 1, max: 5, required: true }, { key: 'impact', label: 'Impact (1-5)', type: 'number', min: 1, max: 5, required: true },
              { key: 'residual_score', label: 'Residual score', type: 'number', min: 1, max: 25 }, { key: 'mitigating_controls', label: 'Mitigating controls' },
              { key: 'kri_formula', label: 'Key risk indicator', type: 'textarea' }, { key: 'owner', label: 'Owner', required: true },
              { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Mitigated', 'Closed'] }, { key: 'process_tag', label: 'Process tag (macro process)' },
              { key: 'obs_node_id', label: 'OBS node', type: 'select', options: useObsOptions(obs.data) },
            ]} />
        </div>
        <Card>
          <CardHead title={t('Heat map')} subtitle={t('Open items only. Select a cell to filter the list.')} />
          {heat.data && <RiskHeatmap cells={heat.data.cells} t={t} onCell={(l, i) => setCell([l, i])} caption={t('Count of open items by likelihood (rows) and impact (columns); red is the highest score.')} />}
        </Card>
      </div>
    </div>
  );
}
