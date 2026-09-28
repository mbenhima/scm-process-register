import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { PageHead, Card, Loading, Tabs, Table, tx, Search, IconBadge } from '../components/ui.jsx';

export default function Knowledge() {
  const { t, lang, project, fmtDate } = useApp();
  const [tab, setTab] = useState('kb');
  const [q, setQ] = useState('');
  const kb = useData(tab === 'kb' ? '/kb' : null);
  const std = useData(tab === 'map' ? '/catalog/standards' : null);
  const rex = useData(tab === 'rex' && project ? `/orgs/${project.org.id}/rex?q=${encodeURIComponent(q)}` : null, [q]);
  const [sel, setSel] = useState(null);
  return (
    <>
      <PageHead eyebrow={t('Intelligence')} title={t('Knowledge base')} subtitle={t('Plain-language summaries of the standards used by the runs, the standards-to-process map and the lessons learned of your organization.')} />
      <Tabs label={t('Knowledge views')} value={tab} onChange={setTab} tabs={[{ id: 'kb', label: t('Standards') }, { id: 'map', label: t('Standards map') }, { id: 'rex', label: t('Lessons learned (REX)') }]} />
      {tab === 'kb' && (kb.data ? (
        <div className="grid-side">
          <Card title={t('Standards')}><ul className="list">{kb.data.map(k => <li key={k.id}><button className="list-btn" onClick={() => setSel(k)} style={sel?.id === k.id ? { background: 'var(--pa-orange-tint)' } : undefined}><IconBadge icon={BookMarked} size="sm" accent={sel?.id === k.id} /><span><span className="strong small">{k.standard}</span><br /><span className="xsmall muted">{tx(k.title, lang)}</span></span></button></li>)}</ul></Card>
          {(sel || kb.data[0]) && (() => { const k = sel || kb.data[0]; return (
            <Card title={tx(k.title, lang)}>
              <p>{tx(k.summary, lang)}</p>
              <h4 style={{ margin: '16px 0 8px' }}>{t('Key clauses')}</h4>
              <Table rows={k.clauses} rowKey="id" columns={[{ key: 'id', label: t('Clause'), width: 100 }, { key: 'title', label: t('Topic'), render: c => tx(c.title, lang) }]} />
              <p className="small" style={{ marginTop: 16 }}>{t('Applied in phases')}: {k.e2e.map(e => <Link key={e} to={`/process/e2e/${e}`} style={{ marginInlineEnd: 8 }}>{e}</Link>)}</p>
              <p className="caption">{t('Orientation summary written for DynamicMS; refer to the official standard for requirements.')}</p>
            </Card>
          ); })()}
        </div>
      ) : <Loading />)}
      {tab === 'map' && (std.data ? <Table rows={std.data.map(s => ({ ...s, id: s.code, n: s.mps.length }))} initialSort={{ key: 'n', dir: 'desc' }} columns={[{ key: 'code', label: t('Standard') }, { key: 'n', label: t('Macro processes') }, { key: 'segments', label: t('Verticals'), render: s => (Array.isArray(s.segments) ? s.segments.join(', ') : s.segments) }]} /> : <Loading />)}
      {tab === 'rex' && (
        <>
          <div style={{ maxWidth: 420, marginBottom: 16 }}><Search value={q} onChange={setQ} placeholder={t('Search lessons learned')} /></div>
          {rex.data ? <Table rows={rex.data} columns={[{ key: 'created_at', label: t('Date'), render: r => fmtDate(r.created_at) }, { key: 'category', label: t('Category') }, { key: 'root_cause', label: t('Root cause'), render: r => tx(r.root_cause, lang) }, { key: 'recommendation', label: t('Recommendation'), render: r => <span className="strong">{tx(r.recommendation, lang)}</span> }, { key: 'rating', label: t('Rating'), width: 70 }, { key: 'author', label: t('By') }]} /> : <Loading />}
        </>
      )}
    </>
  );
}
