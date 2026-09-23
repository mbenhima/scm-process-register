import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { PageHeader, Card, DataTable, useFetch, Skeleton, ErrorNote, Tabs } from '../components/ui.jsx';

const CLS = { '●': 'm-full', '○': 'm-prop', E: 'm-enab', '◆': 'm-cond' };
const COLS = ['E01', 'E02', 'E03', 'E04', 'E05', 'E06', 'E07', 'E08', 'E09'];

export default function Coverage() {
  const { t } = useI18n();
  const [tab, setTab] = useState('matrix');
  const { data, error } = useFetch('/reference/coverage');
  const f = useFetch('/reference/findings');
  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  if (!data) return <div className="page"><Skeleton h={500} /></div>;
  return (
    <div className="page">
      <PageHeader eyebrow={t('Process design reference · Part 6')} title={t('Coverage matrix')} subtitle={t(data.conclusion)} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'matrix', label: t('69 × 9 matrix') }, { value: 'gaps', label: t('16 resolved gaps') }, { value: 'findings', label: t('Design review findings') }, { value: 'glossary', label: t('Glossary') }]} />
      {tab === 'matrix' && (
        <Card>
          <div className="legend">
            <span><i style={{ background: 'var(--st-4)' }} />{t('Mapped')} (●)</span><span><i style={{ background: 'var(--st-3)' }} />{t('Proposed assignment')} (○)</span>
            <span><i style={{ background: 'var(--pa-grey-line)' }} />{t('Platform enabler')} (E)</span><span><i style={{ background: 'var(--st-2)' }} />{t('Conditional by industry')} (◆)</span>
          </div>
          <div className="table-wrap" style={{ maxHeight: '70vh' }}>
            <table className="matrix sticky-first" style={{ width: '100%' }}>
              <thead><tr><th className="left">{t('Macro process')}</th>{COLS.map((c) => <th key={c}>{c.replace('E', 'E2E-')}</th>)}</tr></thead>
              <tbody>{data.matrix.map((r) => (
                <tr key={r.MP}><td className="left"><Link to={`/library/${r.MP}`}>{r.MP}</Link> {t(r['Macro process'])}</td>
                  {COLS.map((c) => <td key={c} className={CLS[r[c]] || ''} title={r[c] ? `${r.MP} · ${c}` : undefined}>{r[c] || ''}</td>)}</tr>
              ))}</tbody>
            </table>
          </div>
          <p className="chart-caption">{t('Every macro process appears in at least one E2E process; phase-gate processes MP-121 to MP-124 apply to all nine.')}</p>
        </Card>
      )}
      {tab === 'gaps' && <Card><DataTable csvName="coverage_resolutions" rows={data.byCategory} columns={[{ key: 'Macro process', label: t('Macro process'), render: (r) => t(r['Macro process']) }, { key: 'Proposed treatment', label: t('Proposed treatment'), render: (r) => t(r['Proposed treatment']) }, { key: 'Rationale', label: t('Rationale'), render: (r) => t(r.Rationale) }]} /></Card>}
      {tab === 'findings' && f.data && <Card><DataTable csvName="design_findings" rows={f.data.findings} columns={[{ key: 'ID', label: t('ID') }, { key: 'Finding', label: t('Finding'), render: (r) => t(r.Finding) }, { key: 'Evidence', label: t('Evidence'), render: (r) => <span className="xs">{t(r.Evidence)}</span> }, { key: 'Resolution', label: t('Resolution'), render: (r) => <span className="xs">{t(r.Resolution)}</span> }]} /></Card>}
      {tab === 'glossary' && f.data && <Card><DataTable csvName="glossary" rows={f.data.glossary} pageSize={60} columns={[{ key: 'Term', label: t('Term') }, { key: 'Definition', label: t('Definition'), render: (r) => t(r.Definition) }]} /></Card>}
    </div>
  );
}
