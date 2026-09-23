// Hand-built SVG charts in the brand palette: primary series solid orange, comparison series dashed or
// muted grey, gridlines and axis text in grey-line / grey-medium, values labelled directly, hover tooltips,
// and an italic caption under every chart.
import { useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';

export function ChartFrame({ caption, legend, children }) {
  return (
    <figure className="chart" style={{ margin: 0 }}>
      {legend && <div className="legend">{legend.map((l) => <span key={l.label}><i style={{ background: l.color, border: l.dashed ? '1px dashed var(--pa-grey-ink)' : 0 }} />{l.label}</span>)}</div>}
      {children}
      <figcaption className="chart-caption">{caption}</figcaption>
    </figure>
  );
}

function Tip({ tip }) {
  if (!tip) return null;
  return (
    <g pointerEvents="none">
      <rect x={tip.x - 70} y={tip.y - 38} width={140} height={28} rx={6} fill="var(--pa-grey-dark)" />
      <text x={tip.x} y={tip.y - 20} textAnchor="middle" style={{ fill: 'var(--pa-white)', fontSize: 12, fontWeight: 600 }}>{tip.text}</text>
    </g>
  );
}

const niceMax = (v) => { if (v <= 0) return 1; const p = 10 ** Math.floor(Math.log10(v)); return Math.ceil(v / p) * p; };

// Vertical bars: one primary series (orange) with optional secondary series (light grey) for comparison.
export function BarChart({ data, caption, height = 220, secondaryLabel, primaryLabel, format = (v) => v }) {
  const { dir } = useI18n();
  const [tip, setTip] = useState(null);
  const W = 640; const H = height; const pad = { t: 24, r: 16, b: 40, l: 40 };
  const max = niceMax(Math.max(1, ...data.map((d) => Math.max(d.value || 0, d.secondary || 0))));
  const iw = W - pad.l - pad.r; const ih = H - pad.t - pad.b;
  const slot = iw / Math.max(1, data.length);
  const two = data.some((d) => d.secondary != null);
  const bw = Math.min(40, slot * (two ? 0.34 : 0.56));
  const y = (v) => pad.t + ih - (v / max) * ih;
  const order = dir === 'rtl' ? [...data].reverse() : data;
  const bar = (x, v, cls, label) => {
    const h = Math.max(0, (v / max) * ih); const r = Math.min(4, bw / 2, h);
    const top = y(v);
    const path = h > 0 ? `M${x},${pad.t + ih} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${pad.t + ih} Z` : '';
    return <path className={`bar ${cls}`} d={path} onMouseEnter={() => setTip({ x: x + bw / 2, y: top, text: label })} onMouseLeave={() => setTip(null)} />;
  };
  return (
    <ChartFrame caption={caption} legend={two ? [{ label: primaryLabel, color: 'var(--pa-orange)' }, { label: secondaryLabel, color: 'var(--pa-grey-line)' }] : null}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={caption}>
        {[0, 0.5, 1].map((f) => <g key={f}><line className="grid-line" x1={pad.l} x2={W - pad.r} y1={y(max * f)} y2={y(max * f)} /><text x={pad.l - 8} y={y(max * f) + 4} textAnchor="end">{format(Math.round(max * f))}</text></g>)}
        {order.map((d, i) => {
          const cx = pad.l + slot * i + slot / 2;
          const x1 = two ? cx - bw - 1 : cx - bw / 2;
          return (
            <g key={d.label}>
              {bar(x1, d.value || 0, '', `${d.label}: ${format(d.value ?? 0)}`)}
              {two && bar(cx + 1, d.secondary || 0, 'secondary', `${d.label}: ${format(d.secondary ?? 0)}`)}
              <text x={x1 + bw / 2} y={y(d.value || 0) - 6} textAnchor="middle" className="label-dark">{format(d.value ?? 0)}</text>
              <text x={cx} y={H - pad.b + 18} textAnchor="middle">{d.label}</text>
            </g>
          );
        })}
        <Tip tip={tip} />
      </svg>
    </ChartFrame>
  );
}

// Horizontal distribution bars (HTML, mirrors under RTL automatically).
export function HBars({ data, caption, format = (v) => v, max: forcedMax }) {
  const max = forcedMax || Math.max(1, ...data.map((d) => d.value || 0));
  return (
    <ChartFrame caption={caption}>
      <div role="list">
        {data.map((d) => (
          <div className="bar-row" key={d.label} role="listitem" title={`${d.label}: ${format(d.value)}`}>
            <span className="small strong" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</span>
            <span className="track"><i className={d.muted ? 'muted-fill' : ''} style={{ width: `${((d.value || 0) / max) * 100}%` }} /></span>
            <span className="small num strong" style={{ textAlign: 'end' }}>{format(d.value)}</span>
          </div>
        ))}
      </div>
    </ChartFrame>
  );
}

// Line chart: current series solid orange; optional target / comparison dashed grey. One axis only.
export function LineChart({ data, caption, height = 220, target, primaryLabel, targetLabel, format = (v) => v }) {
  const { dir } = useI18n();
  const [hover, setHover] = useState(null);
  const W = 640; const H = height; const pad = { t: 24, r: 24, b: 36, l: 44 };
  const vals = data.map((d) => d.value).filter((v) => v != null);
  const hi = Math.max(...vals, target ?? -Infinity); const lo = Math.min(...vals, target ?? Infinity);
  const span = hi - lo || 1; const top = hi + span * 0.15; const bot = Math.max(0, lo - span * 0.25);
  const iw = W - pad.l - pad.r; const ih = H - pad.t - pad.b;
  const xs = (i) => { const x = pad.l + (data.length < 2 ? iw / 2 : (i / (data.length - 1)) * iw); return dir === 'rtl' ? W - x : x; };
  const ys = (v) => pad.t + ih - ((v - bot) / (top - bot)) * ih;
  const path = data.map((d, i) => (d.value == null ? '' : `${i ? 'L' : 'M'}${xs(i)},${ys(d.value)}`)).join(' ');
  const last = data.length - 1;
  return (
    <ChartFrame caption={caption} legend={target != null ? [{ label: primaryLabel, color: 'var(--pa-orange)' }, { label: targetLabel, color: 'transparent', dashed: true }] : null}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={caption} onMouseLeave={() => setHover(null)}>
        {[0, 0.5, 1].map((f) => { const v = bot + (top - bot) * f; return <g key={f}><line className="grid-line" x1={pad.l} x2={W - pad.r} y1={ys(v)} y2={ys(v)} /><text x={dir === 'rtl' ? W - pad.l + 8 : pad.l - 8} y={ys(v) + 4} textAnchor={dir === 'rtl' ? 'start' : 'end'}>{format(Math.round(v * 10) / 10)}</text></g>; })}
        {target != null && <line className="line-secondary" x1={pad.l} x2={W - pad.r} y1={ys(target)} y2={ys(target)} />}
        <path className="line-primary" d={path} />
        {data.map((d, i) => d.value != null && (
          <g key={d.label}>
            <rect x={xs(i) - iw / data.length / 2} y={pad.t} width={iw / data.length} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} />
            {(i === last || hover === i) && <circle cx={xs(i)} cy={ys(d.value)} r={5} fill="var(--pa-orange)" stroke="var(--pa-white)" strokeWidth={2} />}
            {(i % Math.ceil(data.length / 6) === 0 || i === last) && <text x={xs(i)} y={H - 12} textAnchor="middle">{d.label}</text>}
          </g>
        ))}
        {data[last]?.value != null && <text x={xs(last)} y={ys(data[last].value) - 12} textAnchor="middle" className="label-dark">{format(data[last].value)}</text>}
        {hover != null && hover !== last && <line x1={xs(hover)} x2={xs(hover)} y1={pad.t} y2={pad.t + ih} stroke="var(--pa-grey-medium)" strokeDasharray="2 3" pointerEvents="none" />}
        {hover != null && <Tip tip={{ x: Math.min(W - 80, Math.max(80, xs(hover))), y: ys(data[hover].value), text: `${data[hover].label}: ${format(data[hover].value)}` }} />}
      </svg>
    </ChartFrame>
  );
}

// 5 x 5 likelihood x impact heat map using the status scale (red -> green reading from high to low score).
export function RiskHeatmap({ cells, caption, onCell, t }) {
  const count = (l, i) => cells.find((c) => c.likelihood === l && c.impact === i)?.n || 0;
  const tone = (s) => (s >= 20 ? 'var(--st-1)' : s >= 12 ? 'var(--st-2)' : s >= 6 ? 'var(--st-3)' : s >= 3 ? 'var(--st-4)' : 'var(--st-5)');
  return (
    <ChartFrame caption={caption}>
      <div className="heat" role="group" aria-label={caption}>
        {[5, 4, 3, 2, 1].map((l) => [
          <div key={`a${l}`} className="ax" aria-hidden="true">{l}</div>,
          ...[1, 2, 3, 4, 5].map((i) => {
            const n = count(l, i);
            return (
              <button type="button" key={`${l}-${i}`} className="cell" style={{ background: tone(l * i), border: 0, cursor: onCell ? 'pointer' : 'default' }}
                title={`${t('Likelihood')} ${l} × ${t('Impact')} ${i} = ${l * i}: ${n}`} onClick={() => onCell?.(l, i)} aria-label={`${t('Likelihood')} ${l}, ${t('Impact')} ${i}: ${n}`}>
                {n || ''}
              </button>
            );
          }),
        ])}
        <div />
        {[1, 2, 3, 4, 5].map((i) => <div key={`i${i}`} className="ax" aria-hidden="true">{i}</div>)}
      </div>
      <div className="row between xs muted" style={{ marginTop: 8 }}><span>{t('Rows: likelihood (5 = almost certain)')}</span><span>{t('Columns: impact (5 = severe)')}</span></div>
    </ChartFrame>
  );
}

// Radar for multi-dimension current vs reference comparisons (track scoring criteria).
export function Radar({ axes, values, reference, caption, max = 5, primaryLabel, referenceLabel }) {
  const S = 300; const c = S / 2; const R = 110;
  const pt = (i, v) => { const a = (Math.PI * 2 * i) / axes.length - Math.PI / 2; return [c + Math.cos(a) * (R * v) / max, c + Math.sin(a) * (R * v) / max]; };
  const poly = (vals) => vals.map((v, i) => pt(i, v).join(',')).join(' ');
  return (
    <ChartFrame caption={caption} legend={reference ? [{ label: primaryLabel, color: 'var(--pa-orange)' }, { label: referenceLabel, color: 'transparent', dashed: true }] : null}>
      <svg viewBox={`0 0 ${S} ${S}`} role="img" aria-label={caption} style={{ maxWidth: 360, margin: '0 auto' }}>
        {[1, 2, 3, 4, 5].map((r) => <polygon key={r} points={poly(axes.map(() => r))} fill="none" className="grid-line" />)}
        {axes.map((a, i) => { const [x, y] = pt(i, max + 0.9); return <text key={a} x={x} y={y} textAnchor="middle" style={{ fontSize: 10 }}>{a}</text>; })}
        {reference && <polygon points={poly(reference)} className="line-secondary" />}
        <polygon points={poly(values)} fill="var(--pa-orange-tint)" stroke="var(--pa-orange)" strokeWidth={2} />
        {values.map((v, i) => { const [x, y] = pt(i, v); return <circle key={i} cx={x} cy={y} r={4} fill="var(--pa-orange)" stroke="var(--pa-white)" strokeWidth={2}><title>{`${axes[i]}: ${v}`}</title></circle>; })}
      </svg>
    </ChartFrame>
  );
}
