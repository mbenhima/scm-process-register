import { useMemo, useState } from 'react';
import { useApp, useData } from '../lib/state.jsx';
import { PageHead, Loading, Table, tx, Search } from '../components/ui.jsx';

export default function Traceability() {
  const { t, lang } = useApp();
  const { data } = useData('/admin/traceability');
  const [q, setQ] = useState('');
  const [fam, setFam] = useState('');
  const rows = useMemo(() => (data?.items || []).filter(r => (!fam || r.id.startsWith(fam + '-')) && (!q || `${r.id} ${r.text}`.toLowerCase().includes(q.toLowerCase()))), [data, q, fam]);
  if (!data) return <Loading />;
  return (
    <>
      <PageHead eyebrow={t('Design')} title={t('Requirement traceability')} subtitle={t('Each requirement of the Dynamic Apps Standard SRS v1.3 with the screen and API that implement it.')} />
      <div className="row" style={{ marginBottom: 16 }}>
        <div style={{ flex: '1 1 260px' }}><Search value={q} onChange={setQ} placeholder={t('Search requirements')} /></div>
        <select className="select" style={{ width: 'auto' }} aria-label={t('Family')} value={fam} onChange={e => setFam(e.target.value)}><option value="">{t('All families')}</option>{Object.keys(data.families).map(f => <option key={f} value={f}>{f} — {tx(data.families[f].module, lang)}</option>)}</select>
        <span className="small muted">{t('{n} requirements', { n: rows.length })}</span>
      </div>
      <Table rows={rows} maxRows={400} columns={[
        { key: 'id', label: 'ID', width: 130 }, { key: 'section', label: t('Section'), width: 80 },
        { key: 'text', label: t('Requirement'), render: r => <span className="small">{r.text}</span> },
        { key: 'screen', label: t('Screen'), render: r => r.trace?.screen || '—' },
        { key: 'api', label: 'API', render: r => <code className="xsmall">{r.trace?.api || '—'}</code> },
      ]} />
      <p className="caption">{t('Requirement texts are quoted in English, as in the source SRS.')}</p>
    </>
  );
}
