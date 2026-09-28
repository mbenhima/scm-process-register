import { useState } from 'react';
import { useApp, useData } from '../lib/state.jsx';
import { PageHead, Card, Loading, ErrorBox, Tabs, Table, tx } from '../components/ui.jsx';
import { BarList } from '../components/charts.jsx';

export default function Benchmark() {
  const { t, L, lang, me, can, project, fmtNum } = useApp();
  const [tab, setTab] = useState('internal');
  const [dim, setDim] = useState('ms_type');
  const [ms, setMs] = useState('');
  const orgId = project?.org?.id || me.org?.id;
  const internal = useData(tab === 'internal' && orgId ? `/benchmark/internal?orgId=${orgId}&dimension=${dim}` : null, [dim]);
  const group = useData(tab === 'group' ? `/benchmark/group${ms ? `?ms=${ms}` : ''}` : null, [ms]);
  const tabs = [{ id: 'internal', label: t('Within my organization') }, ...(can('benchmark.group') && me.org?.groupId ? [{ id: 'group', label: t('Across my group') }] : [])];
  const unit = (m) => (m.unit === 'd' ? ` ${t('d')}` : m.unit);
  return (
    <>
      <PageHead eyebrow={t('Insight')} title={t('Benchmarking')} subtitle={t('The same metric catalog serves both views; each metric states its unit and whether higher or lower is better.')} />
      <Tabs label={t('Benchmark scope')} value={tab} onChange={setTab} tabs={tabs} />
      {tab === 'internal' && (
        <>
          <div className="row" style={{ marginBottom: 16 }}><label className="small strong" htmlFor="bm-dim">{t('Compare by')}</label><select id="bm-dim" className="select" style={{ width: 'auto' }} value={dim} onChange={e => setDim(e.target.value)}><option value="ms_type">{t('Management system')}</option><option value="mode">{t('Mode')}</option><option value="track">{t('SME track')}</option></select></div>
          {internal.error && <ErrorBox error={internal.error} />}
          {internal.loading && !internal.data ? <Loading /> : internal.data && (
            <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
              {internal.data.metrics.map(m => (
                <Card key={m.id} title={tx(m.label, lang)}>
                  <p className="xsmall muted">{tx(m.explain, lang)} {m.good === 'up' ? t('Higher is better.') : t('Lower is better.')}</p>
                  <BarList unit={unit(m)} max={m.unit === '%' ? 100 : Math.max(1, ...m.segments.map(s => s.value || 0)) * 1.2} items={m.segments.map(s => ({ key: s.segment, label: `${L(s.segment)} (${s.count})`, value: s.value, avg: m.orgValue }))} compareKey="avg" seriesLabel={t('Segment value')} compareLabel={t('Organization average {v}', { v: fmtNum(m.orgValue) })} caption={t('{metric} per segment against the organization average.', { metric: tx(m.label, lang) })} />
                </Card>
              ))}
            </div>
          )}
        </>
      )}
      {tab === 'group' && (
        <>
          <div className="row" style={{ marginBottom: 16 }}><select className="select" style={{ width: 'auto' }} aria-label={t('Management system')} value={ms} onChange={e => setMs(e.target.value)}><option value="">{t('QMS and QHSE')}</option><option value="QMS">QMS</option><option value="QHSE">QHSE</option></select>
            {group.data && <span className="small muted">{t('{n} organizations share their data; {x} opted out.', { n: group.data.participating, x: group.data.excluded })}</span>}</div>
          {group.error && <ErrorBox error={group.error} />}
          {group.loading && !group.data ? <Loading /> : group.data && (group.data.suppressed ? <p className="callout neutral">{t('Fewer than {n} organizations share data; results are hidden to protect confidentiality.', { n: group.data.minSample })}</p> : (
            <div className="stack">
              {group.data.metrics.map(m => (
                <Card key={m.id} title={tx(m.label, lang)} action={<span className="small muted">{t('Group average')}: <span className="strong">{fmtNum(m.groupAverage)}{unit(m)}</span></span>}>
                  <Table rows={m.orgs} initialSort={{ key: 'rank', dir: 'asc' }} maxRows={10} columns={[
                    { key: 'rank', label: t('Rank'), width: 70 },
                    { key: 'name', label: t('Organization'), render: o => <span className={o.own ? 'strong' : ''}>{tx(o.name, lang)}{o.own ? ` (${t('you')})` : ''}</span>, sortValue: o => tx(o.name, lang) },
                    { key: 'sector', label: t('Vertical') },
                    { key: 'value', label: t('Value'), render: o => <span className="num">{fmtNum(o.value)}{unit(m)}</span> },
                  ]} />
                  <p className="caption">{t('Ranking per metric; equal values share the same rank. {good}', { good: m.good === 'up' ? t('Higher is better.') : t('Lower is better.') })}</p>
                </Card>
              ))}
            </div>
          ))}
        </>
      )}
    </>
  );
}
