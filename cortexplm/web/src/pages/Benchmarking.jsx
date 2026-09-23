// Internal benchmarking: project segments within the organization, and organizations within the same group.
// External benchmarking is out of scope; peer organizations are shown as aggregates only.
import { useState } from 'react';
import { Building2, Info } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { put } from '../lib/api.js';
import { PageHeader, Card, CardHead, DataTable, useFetch, Skeleton, ErrorNote, Tabs, Segmented, Select, Field, Badge, Empty, Check, useToast, Kpi } from '../components/ui.jsx';
import { HBars } from '../components/charts.jsx';

const fmtVal = (v, unit) => (v == null ? '—' : `${Number(v).toLocaleString('en-US', { maximumFractionDigits: 1 })}${unit && unit !== '' ? (unit === 'days' || unit === 'kUSD' ? ` ${unit}` : unit) : ''}`);

function Scorecard({ data, highlightSelf }) {
  const { t } = useI18n();
  const segs = data.rows;
  const n = segs.filter((s) => s.comparable).length;
  const rows = data.metrics.map((m) => ({ id: m.key, m }));
  const cols = [
    { key: 'metric', label: t('Indicator'), sortable: false, csv: (r) => t(r.m.label), render: (r) => <><div className="strong">{t(r.m.label)}</div>{r.m.help && <div className="xs muted">{t(r.m.help)}</div>}</> },
    ...segs.map((s, i) => ({
      key: `s${i}`, label: s.self && highlightSelf ? `${s.segment} (${t('you')})` : t(s.segment), num: true, sortable: false,
      csv: (r) => s.metrics[r.m.key] ?? '',
      render: (r) => {
        if (!s.shared && s.shared !== undefined) return <span className="xs muted">{t('Not shared')}</span>;
        const v = s.metrics[r.m.key]; const rank = s.ranks?.[r.m.key];
        const st = data.stats[r.m.key] || {};
        const tone = !r.m.better || !rank || n < 2 || st.min === st.max ? null : rank === 1 ? 's5' : rank === n ? 's1' : null;
        return <span className={s.self && highlightSelf ? 'strong' : ''}>{tone ? <Badge tone={tone}>{fmtVal(v, r.m.unit)}</Badge> : fmtVal(v, r.m.unit)}</span>;
      },
    })),
    { key: 'median', label: t('Median'), num: true, sortable: false, csv: (r) => data.stats[r.m.key]?.median ?? '', render: (r) => <span className="muted">{fmtVal(data.stats[r.m.key]?.median, r.m.unit)}</span> },
  ];
  return <DataTable filterable={false} pageSize={20} rows={rows} columns={cols} csvName={`benchmark_${data.scope}`} />;
}

function MetricChart({ data, metric, setMetric, captionScope }) {
  const { t } = useI18n();
  const m = data.metrics.find((x) => x.key === metric) || data.metrics[1];
  const rows = data.rows.filter((r) => r.shared !== false && r.metrics[m.key] != null);
  const med = data.stats[m.key]?.median;
  return (
    <Card>
      <CardHead title={t(m.label)} subtitle={t(m.help || '')} actions={<div style={{ minWidth: 240 }}><Select aria-label={t('Indicator')} value={m.key} onChange={(e) => setMetric(e.target.value)} options={data.metrics.filter((x) => x.key !== 'projects').map((x) => ({ value: x.key, label: t(x.label) }))} /></div>} />
      {rows.length ? (
        <HBars data={rows.map((r) => ({ label: `${t(r.segment)}${r.self ? ` (${t('you')})` : ''}`, value: r.metrics[m.key] }))} format={(v) => fmtVal(v, m.unit)}
          caption={`${t(captionScope)} ${m.better ? t(m.better === 'high' ? 'Higher is better.' : 'Lower is better.') : ''} ${med != null ? t('Median {v}.', { v: fmtVal(med, m.unit) }) : ''}`} />
      ) : <Empty text={t('No data for this indicator yet.')} />}
    </Card>
  );
}

function Filters({ track, setTrack, offer, setOffer, showOffer = true }) {
  const { t } = useI18n();
  return (
    <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 180 }}><Field label={t('Track')}><Select value={track} onChange={(e) => setTrack(e.target.value)} placeholder={t('All tracks')} options={['Full', 'Light', 'Fast'].map((v) => ({ value: v, label: t(`${v} Track`) }))} /></Field></div>
      {showOffer && <div style={{ minWidth: 180 }}><Field label={t('Project type')}><Select value={offer} onChange={(e) => setOffer(e.target.value)} placeholder={t('All project types')} options={['Product', 'Service', 'Product-Service'].map((v) => ({ value: v, label: t(v) }))} /></Field></div>}
    </div>
  );
}

function Internal() {
  const { t } = useI18n();
  const [dimension, setDimension] = useState('offer_type');
  const [track, setTrack] = useState('');
  const [offer, setOffer] = useState('');
  const [metric, setMetric] = useState('go_rate');
  const qs = new URLSearchParams({ dimension, ...(track ? { track } : {}), ...(offer ? { offer_type: offer } : {}) });
  const { data, error } = useFetch(`/benchmark/organization?${qs}`);
  return (
    <div className="stack">
      <Card>
        <div className="row between" style={{ gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Field label={t('Compare by')}><Segmented label={t('Compare by')} value={dimension} onChange={setDimension} options={[{ value: 'offer_type', label: t('Project type') }, { value: 'track', label: t('Track') }, { value: 'department', label: t('Owning department') }]} /></Field>
          <Filters track={track} setTrack={setTrack} offer={offer} setOffer={setOffer} showOffer={dimension !== 'offer_type'} />
        </div>
      </Card>
      {error ? <ErrorNote error={error} /> : !data ? <Skeleton h={300} /> : (
        <>
          <div className="grid kpis">
            <Kpi value={data.total.projects} label={t('Projects compared')} neutral />
            <Kpi value={fmtVal(data.total.go_rate, '%')} label={t('First-time Go rate, whole organization')} />
            <Kpi value={fmtVal(data.total.time_to_market_days, 'days')} label={t('Time to market, whole organization')} neutral />
            <Kpi value={fmtVal(data.total.checklist_compliance, '%')} label={t('Checklist compliance, whole organization')} neutral />
          </div>
          <MetricChart data={data} metric={metric} setMetric={setMetric} captionScope="Each bar is a segment of your organization." />
          <Card>
            <CardHead title={t('Scorecard by {d}', { d: t(data.dimensionLabel).toLowerCase() })} subtitle={t('Green marks the best segment and red the weakest, among segments with at least {n} projects.', { n: data.minProjects })} />
            {data.rows.some((r) => !r.comparable) && <p className="xs muted">{t('Segments with fewer than {n} projects are shown but not ranked: {s}.', { n: data.minProjects, s: data.rows.filter((r) => !r.comparable).map((r) => t(r.segment)).join(', ') })}</p>}
            <Scorecard data={data} />
          </Card>
        </>
      )}
    </div>
  );
}

function Group() {
  const { t } = useI18n();
  const { can } = useAuth();
  const toast = useToast();
  const [track, setTrack] = useState('');
  const [offer, setOffer] = useState('');
  const [metric, setMetric] = useState('go_rate');
  const qs = new URLSearchParams({ ...(track ? { track } : {}), ...(offer ? { offer_type: offer } : {}) });
  const { data, error, reload } = useFetch(`/benchmark/group?${qs}`);
  if (error) return <ErrorNote error={error} />;
  if (!data) return <Skeleton h={300} />;
  if (!data.inGroup) return <Card><Empty text={t('Your organization does not belong to a group, so there is no group comparison. Benchmarking between organizations is limited to organizations of the same group; external benchmarking is out of scope.')} /></Card>;
  const toggle = async (on) => { try { await put('/benchmark/sharing', { sharing: on }); toast.ok(t('Saved.')); reload(); } catch (e) { toast.err(e); } };
  return (
    <div className="stack">
      <Card>
        <div className="row between" style={{ gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="row" style={{ gap: 12 }}><Building2 size={20} aria-hidden /><div><div className="strong">{data.group}</div><div className="xs muted">{t('{n} organizations in the group', { n: data.rows.length })}</div></div></div>
          <Filters track={track} setTrack={setTrack} offer={offer} setOffer={setOffer} />
        </div>
        <div className="callout neutral" style={{ marginTop: 16 }}><Info size={18} aria-hidden /><div>{t('Only aggregated indicators are exchanged between organizations of the group. No project, person or document of another organization is visible.')}</div></div>
        {can('benchmark.manage') && <div style={{ marginTop: 12 }}><Check label={t('Share our aggregated indicators with the organizations of our group')} checked={data.sharing} onChange={(e) => toggle(e.target.checked)} /></div>}
      </Card>
      <MetricChart data={data} metric={metric} setMetric={setMetric} captionScope="Each bar is an organization of your group." />
      <Card>
        <CardHead title={t('Scorecard by organization')} subtitle={t('Green marks the best organization and red the weakest. Organizations that do not share their indicators are shown as not shared.')} />
        <Scorecard data={data} highlightSelf />
      </Card>
    </div>
  );
}

export default function Benchmarking() {
  const { t } = useI18n();
  const { can } = useAuth();
  const [tab, setTab] = useState('org');
  return (
    <div className="page">
      <PageHeader eyebrow={t('Reports · Internal benchmarking')} title={t('Benchmarking')}
        subtitle={t('Compare project types, tracks and departments within your organization, and your organization with the other organizations of its group. External benchmarking is out of scope.')} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'org', label: t('Within the organization') }, ...(can('benchmark.group') ? [{ value: 'group', label: t('Across the group') }] : [])]} />
      {tab === 'org' ? <Internal /> : <Group />}
    </div>
  );
}
