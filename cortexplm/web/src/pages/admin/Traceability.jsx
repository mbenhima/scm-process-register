// Requirements traceability: every SRS requirement, the screen where it is used and the module that enforces it.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../lib/i18n.jsx';
import { PageHeader, Card, DataTable, useFetch, Skeleton, ErrorNote, Kpi, Select, StatusBadge } from '../../components/ui.jsx';
import { HBars } from '../../components/charts.jsx';
import { TRACE, groupOf } from './traceMap.js';
import STATUS from './traceStatus.json';

export default function Traceability() {
  const { t } = useI18n();
  const { data, error } = useFetch('/reference/srs');
  const [section, setSection] = useState('');
  const rows = useMemo(() => (data || []).map((r) => ({ ...r, group: groupOf(r.id), trace: TRACE[groupOf(r.id)], status: STATUS[r.id]?.[0] || 'Partial', evidence: STATUS[r.id]?.[1] || '' })), [data]);
  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  if (!data) return <div className="page"><Skeleton h={500} /></div>;
  const sections = [...new Set(rows.map((r) => r.section))];
  const traced = rows.filter((r) => ['Met', 'Fixed'].includes(r.status)).length;
  const partial = rows.filter((r) => r.status === 'Partial').length;
  const deployment = rows.filter((r) => r.status === 'Deployment').length;
  const fr = rows.filter((r) => r.id.startsWith('FR')).length;
  const byGroup = Object.entries(rows.reduce((m, r) => ({ ...m, [r.group]: (m[r.group] || 0) + 1 }), {})).map(([label, value]) => ({ label: label.replace('-DA-', ' '), value }));
  return (
    <div className="page">
      <PageHeader eyebrow={t('Administration · Requirements traceability')} title={t('Requirements traceability')} subtitle={t('Each requirement of the Dynamic Apps SRS with the screen where it is used and the module that enforces it.')} />
      <div className="grid kpis" style={{ marginBottom: 24 }}>
        <Kpi value={`${traced}/${rows.length}`} label={t('Requirements met')} meta={t('{p} partial · {d} depend on hosting', { p: partial, d: deployment })} />
        <Kpi value={fr} label={t('Functional requirements')} neutral />
        <Kpi value={rows.length - fr} label={t('Non-functional requirements')} neutral />
      </div>
      <Card style={{ marginBottom: 24 }}><HBars data={byGroup} caption={t('Number of requirements in each SRS group.')} /></Card>
      <Card>
        <DataTable csvName="srs_traceability" pageSize={40} rows={rows.filter((r) => !section || r.section === section)}
          toolbar={<div style={{ minWidth: 240 }}><Select aria-label={t('Section')} value={section} onChange={(e) => setSection(e.target.value)} placeholder={t('All sections')} options={sections.map((s) => ({ value: s, label: s }))} /></div>}
          columns={[
            { key: 'id', label: t('Requirement'), render: (r) => <span className="strong num">{r.id}</span> },
            { key: 'text', label: t('Statement'), render: (r) => <><div className="small">{r.text}</div><div className="xs muted">{r.section}</div></> },
            { key: 'screens', label: t('Where to see it'), csv: (r) => r.trace?.screens.map((s) => s[0]).join(' '), render: (r) => <div className="stack tight">{r.trace?.screens.map(([to, label]) => <Link key={to} to={to} className="small">{t(label)}</Link>)}</div> },
            { key: 'server', label: t('Enforced by'), csv: (r) => r.trace?.server, render: (r) => <span className="xs">{r.trace?.server}</span> },
            { key: 'evidence', label: t('Assessment'), csv: (r) => r.evidence, render: (r) => <span className="xs">{r.evidence}</span> },
            { key: 'status', label: t('Status'), csv: (r) => r.status, render: (r) => <StatusBadge value={{ Met: 'Done', Fixed: 'Done', Partial: 'Waived', Deployment: 'Scheduled' }[r.status]}>{t(r.status === 'Fixed' ? 'Met' : r.status)}</StatusBadge> },
          ]} />
      </Card>
    </div>
  );
}
