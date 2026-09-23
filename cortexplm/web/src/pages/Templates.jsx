import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { PageHeader } from '../components/ui.jsx';
import CrudPage from '../components/CrudPage.jsx';

export default function Templates() {
  const { t } = useI18n();
  const { can } = useAuth();
  return (
    <div className="page">
      <PageHeader eyebrow={t('Intelligence · Template library')} title={t('Templates')} subtitle={t('Starting points for new projects: default scores and recommended optional macro processes (Rule R4). A template is copied when used; editing it never changes existing projects.')} />
      <CrudPage endpoint="/templates" csvName="templates" entityLabel="template" newLabel="Add template" versioned canManage={can('template.manage')}
        defaults={{ kind: 'Project', payload: '{\n  "offer_type": "Product",\n  "scores": { "strategic": 3, "investment": 3, "novelty": 2, "regulatory": 2, "market": 3, "reach": 3, "integration": 2 },\n  "optional_mps": []\n}' }}
        toForm={(x) => ({ ...x, payload: typeof x.payload === 'string' ? x.payload : JSON.stringify(x.payload, null, 2) })}
        columns={[{ key: 'name', label: t('Name'), render: (x) => <span className="strong">{x.name}</span> }, { key: 'description', label: t('Description'), render: (x) => <span className="small">{x.description}</span> },
          { key: 'optional', label: t('Optional macro processes'), csv: (x) => (x.payload?.optional_mps || []).join(' '), render: (x) => (x.payload?.optional_mps || []).join(', ') || '—' },
          { key: 'updated_at', label: t('Updated'), render: (x) => String(x.updated_at).slice(0, 10) }]}
        fields={[{ key: 'name', label: 'Name', required: true }, { key: 'kind', label: 'Kind', type: 'select', options: ['Project'] }, { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'payload', label: 'Default values (JSON)', type: 'textarea', rows: 10, required: true, hint: 'Keys: offer_type, scores (7 criteria 1-5), optional_mps, description.' }]} />
    </div>
  );
}
