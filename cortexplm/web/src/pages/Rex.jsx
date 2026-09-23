import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { PageHeader, Card, CardHead, useFetch, Skeleton, Tabs } from '../components/ui.jsx';
import { HBars, LineChart } from '../components/charts.jsx';
import CrudPage from '../components/CrudPage.jsx';
import { REX_CATEGORIES } from '../components/RexForm.jsx';

export default function Rex() {
  const { t } = useI18n();
  const { can } = useAuth();
  const [tab, setTab] = useState('register');
  const reg = useFetch('/rex-register');
  return (
    <div className="page">
      <PageHeader eyebrow={t('Return on experience')} title={t('Lessons learned (REX)')} subtitle={t('Captured when projects close and tasks complete. Entries are versioned and ground future AI suggestions.')} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'register', label: t('Register view') }, { value: 'entries', label: t('Entries') }]} />
      {tab === 'register' && (!reg.data ? <Skeleton /> : (
        <div className="grid two">
          <Card><CardHead title={t('Entries by category')} /><HBars data={reg.data.byCategory.map((c) => ({ label: `${t(c.category)} (${t('avg')} ${c.avg})`, value: c.n }))} caption={t('Number of lessons per category with the average rating (1 to 5).')} /></Card>
          <Card><CardHead title={t('Recurring root causes')} />
            {reg.data.rootCauses.length ? <HBars data={reg.data.rootCauses.map((r) => ({ label: r.root_cause, value: r.n }))} caption={t('Root causes recorded more than once.')} /> : <p className="muted">{t('No recurring root cause.')}</p>}
          </Card>
          <Card><CardHead title={t('Average rating by month')} />{reg.data.trend.length > 1 ? <LineChart data={reg.data.trend.map((m) => ({ label: m.month, value: m.avg }))} format={(v) => v} caption={t('A falling line signals declining effectiveness.')} /> : <p className="muted">{t('Not enough history yet.')}</p>}</Card>
          <Card><CardHead title={t('Ratings')} /><HBars data={[1, 2, 3, 4, 5].map((r) => ({ label: `${r} / 5`, value: reg.data.byRating.find((x) => x.rating === r)?.n || 0, muted: r < 3 }))} caption={t('Distribution of effectiveness ratings.')} /></Card>
        </div>
      ))}
      {tab === 'entries' && (
        <CrudPage endpoint="/rex" csvName="rex" entityLabel="lesson learned" newLabel="Add lesson" versioned canManage={can('rex.manage')} defaults={{ category: 'Governance', rating: 4 }}
          columns={[{ key: 'created_at', label: t('Date'), render: (r) => String(r.created_at).slice(0, 10) }, { key: 'title', label: t('Title'), render: (r) => <span className="strong">{r.title}</span> },
            { key: 'project_code', label: t('Project'), render: (r) => (r.project_id ? <Link to={`/projects/${r.project_id}`} onClick={(e) => e.stopPropagation()}>{r.project_code}</Link> : '—') },
            { key: 'category', label: t('Category'), render: (r) => t(r.category) }, { key: 'root_cause', label: t('Root cause') }, { key: 'rating', label: t('Rating'), num: true }]}
          fields={[{ key: 'title', label: 'Title', required: true }, { key: 'went_well', label: 'What went well', type: 'textarea', required: true }, { key: 'went_wrong', label: 'What did not go well', type: 'textarea', required: true },
            { key: 'root_cause', label: 'Root cause', required: true }, { key: 'recommendation', label: 'Recommendation', type: 'textarea', required: true },
            { key: 'category', label: 'Category', type: 'select', options: REX_CATEGORIES, required: true }, { key: 'rating', label: 'Effectiveness rating (1-5)', type: 'number', min: 1, max: 5, required: true }, { key: 'process_tag', label: 'Process tag (macro process)' }]} />
      )}
    </div>
  );
}
