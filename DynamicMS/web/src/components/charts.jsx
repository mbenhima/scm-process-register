// SVG charts in the brand palette: primary series solid orange, comparison series
// dashed grey, gridlines grey-line, axis text grey-medium, italic caption below.
import { useApp } from '../lib/state.jsx';

const W = 640;

export function LineChart({ series, target, height = 220, caption, unit = '', compare, compareLabel, seriesLabel, targetLabel }) {
  const { fmtNum, lang } = useApp();
  const rtl = lang === 'ar';
  if (!series?.length) return null;
  const vals = [...series.map(p => p.value), ...(compare || []).map(p => p.value), ...(target !== null && target !== undefined ? [target] : [])];
  let min = Math.min(...vals); let max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.12; min -= pad; max += pad;
  const L = 44; const R = 12; const T = 12; const B = 28;
  const x = (i) => { const v = L + (i / Math.max(1, series.length - 1)) * (W - L - R); return rtl ? W - v : v; };
  const y = (v) => T + (1 - (v - min) / (max - min)) * (height - T - B);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => min + f * (max - min));
  const path = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  return (
    <figure style={{ margin: 0 }}>
      <svg className="chart" viewBox={`0 0 ${W} ${height}`} role="img" aria-label={caption}>
        {ticks.map((tv, i) => <g key={i}><line className="grid-line" x1={rtl ? R : L} x2={rtl ? W - L : W - R} y1={y(tv)} y2={y(tv)} /><text x={rtl ? W - L + 6 : L - 6} y={y(tv) + 4} textAnchor={rtl ? 'start' : 'end'}>{fmtNum(tv, Math.abs(max - min) < 10 ? 1 : 0)}</text></g>)}
        {series.map((p, i) => (i % Math.ceil(series.length / 8) === 0 || i === series.length - 1) && <text key={p.period} x={x(i)} y={height - 8} textAnchor="middle">{p.period.slice(2).replace('-', '/')}</text>)}
        {target !== null && target !== undefined && <line x1={rtl ? R : L} x2={rtl ? W - L : W - R} y1={y(target)} y2={y(target)} stroke="var(--aiv-ink)" strokeDasharray="6 5" strokeWidth="1.5" />}
        {compare && <path d={path(compare)} fill="none" stroke="var(--aiv-muted)" strokeWidth="2" strokeDasharray="5 4" />}
        <path d={`${path(series)} L${x(series.length - 1)},${height - B} L${x(0)},${height - B} Z`} fill="var(--aiv-azure-tint)" opacity="0.7" />
        <path d={path(series)} fill="none" stroke="var(--aiv-azure)" strokeWidth="2.5" strokeLinejoin="round" />
        {series.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.value)} r="3" fill="var(--aiv-white)" stroke="var(--aiv-azure)" strokeWidth="2"><title>{`${p.period}: ${fmtNum(p.value)}${unit}`}</title></circle>)}
      </svg>
      <div className="legend">{seriesLabel && <span><i style={{ background: 'var(--aiv-azure)' }} />{seriesLabel}</span>}{target !== null && target !== undefined && targetLabel && <span><i style={{ background: 'transparent', borderTop: '2px dashed var(--aiv-ink)', height: 0, borderRadius: 0 }} />{targetLabel}</span>}{compare && compareLabel && <span><i style={{ background: 'var(--aiv-muted)' }} />{compareLabel}</span>}</div>
      {caption && <figcaption className="caption">{caption}</figcaption>}
    </figure>
  );
}

export function Sparkline({ values, width = 120, height = 32, good = true }) {
  if (!values?.length) return null;
  const min = Math.min(...values); const max = Math.max(...values) || 1;
  const pts = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * (width - 4) + 2},${height - 2 - ((v - min) / (max - min || 1)) * (height - 4)}`).join(' ');
  return <svg width={width} height={height} aria-hidden="true"><polyline points={pts} fill="none" stroke={good ? 'var(--aiv-azure)' : 'var(--aiv-muted)'} strokeWidth="2" strokeLinejoin="round" /></svg>;
}

// Horizontal bars (progress per phase, benchmark values).
export function BarList({ items, max = 100, caption, unit = '%', compareKey, compareLabel, seriesLabel }) {
  const { fmtNum } = useApp();
  return (
    <figure style={{ margin: 0 }}>
      <div className="stack-8" role="img" aria-label={caption}>
        {items.map(it => (
          <div key={it.key} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 3fr) 56px', gap: 'var(--sp-12)', alignItems: 'center' }}>
            <span className="small strong" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={it.label}>{it.label}</span>
            <span style={{ position: 'relative', height: 14, background: 'var(--aiv-bg)', borderRadius: 6 }}>
              <span style={{ position: 'absolute', insetInlineStart: 0, top: 0, bottom: 0, width: `${Math.min(100, (100 * (it.value || 0)) / max)}%`, background: it.muted ? 'var(--aiv-muted)' : 'var(--aiv-azure)', borderRadius: 6 }} />
              {compareKey && it[compareKey] !== undefined && it[compareKey] !== null && <span style={{ position: 'absolute', top: -3, bottom: -3, insetInlineStart: `${Math.min(100, (100 * it[compareKey]) / max)}%`, borderInlineStart: '2px dashed var(--aiv-navy)' }} title={compareLabel} />}
            </span>
            <span className="small num strong" style={{ textAlign: 'end' }}>{it.value === null || it.value === undefined ? '—' : `${fmtNum(it.value)}${unit}`}</span>
          </div>
        ))}
      </div>
      {(seriesLabel || compareLabel) && <div className="legend">{seriesLabel && <span><i style={{ background: 'var(--aiv-azure)' }} />{seriesLabel}</span>}{compareLabel && <span><i style={{ background: 'transparent', borderInlineStart: '2px dashed var(--aiv-navy)', borderRadius: 0, width: 2 }} />{compareLabel}</span>}</div>}
      {caption && <figcaption className="caption">{caption}</figcaption>}
    </figure>
  );
}

// 5x5 likelihood x impact heatmap on the red-to-green scale.
export function Heatmap({ cells, caption, likelihoodLabel, impactLabel }) {
  const count = (l, i) => cells.find(c => c.l === l && c.i === i)?.n || 0;
  const col = (s) => (s >= 16 ? 'var(--st-1)' : s >= 10 ? 'var(--st-2)' : s >= 5 ? 'var(--st-3)' : 'var(--st-4)');
  return (
    <figure style={{ margin: 0 }}>
      <div className="heat" role="img" aria-label={caption}>
        {[5, 4, 3, 2, 1].map(l => [<span key={`l${l}`} className="xsmall muted" style={{ alignSelf: 'center' }}>{l}</span>, ...[1, 2, 3, 4, 5].map(i => <span key={`${l}${i}`} className="cell" style={{ background: col(l * i) }} title={`${likelihoodLabel} ${l} × ${impactLabel} ${i}`}>{count(l, i) || ''}</span>)])}
        <span />{[1, 2, 3, 4, 5].map(i => <span key={`i${i}`} className="xsmall muted" style={{ textAlign: 'center' }}>{i}</span>)}
      </div>
      <div className="row-between xsmall muted" style={{ marginTop: 4 }}><span>↑ {likelihoodLabel}</span><span>{impactLabel} →</span></div>
      {caption && <figcaption className="caption">{caption}</figcaption>}
    </figure>
  );
}

// Monthly completions (column chart).
export function Columns({ items, height = 160, caption, label }) {
  const { lang } = useApp();
  if (!items?.length) return null;
  const max = Math.max(...items.map(i => i.n), 1);
  const bw = (W - 20) / items.length;
  return (
    <figure style={{ margin: 0 }}>
      <svg className="chart" viewBox={`0 0 ${W} ${height}`} role="img" aria-label={caption}>
        <line className="grid-line" x1="0" x2={W} y1={height - 20} y2={height - 20} />
        {items.map((it, i) => { const hh = ((height - 36) * it.n) / max; const xx = lang === 'ar' ? W - 10 - (i + 1) * bw : 10 + i * bw; return <g key={it.m}><rect x={xx + 4} y={height - 20 - hh} width={bw - 8} height={hh} rx="3" fill="var(--aiv-azure)"><title>{`${it.m}: ${it.n} ${label || ''}`}</title></rect><text x={xx + bw / 2} y={height - 5} textAnchor="middle">{it.m.slice(5)}</text></g>; })}
      </svg>
      {caption && <figcaption className="caption">{caption}</figcaption>}
    </figure>
  );
}
