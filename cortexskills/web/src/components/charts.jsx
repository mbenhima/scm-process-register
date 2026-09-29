// Lightweight SVG charts in the application palette: current/primary series solid orange, comparison series
// dashed or muted grey, overlays in muted blue and green. Every chart takes a caption shown in italics below it.
import { useI18n } from '../lib/i18n.jsx';

const C = { orange: 'var(--pa-orange)', deep: 'var(--pa-orange-deep)', ink: 'var(--pa-grey-ink)', line: 'var(--pa-grey-line)', medium: 'var(--pa-grey-medium)', blue: 'var(--pa-blue)', green: 'var(--pa-green)', light: 'var(--pa-grey-light)' };
export const SERIES = [C.orange, C.blue, C.green];
const niceMax = v => { if (!v) return 10; const p = Math.pow(10, Math.floor(Math.log10(v))); return Math.ceil(v / p) * p; };

export function Figure({ caption, children, label }) { return <figure style={{ margin: 0 }} aria-label={label || caption}>{children}{caption && <figcaption className="caption">{caption}</figcaption>}</figure>; }

/** Splits an axis label into at most two lines of about n characters, with an ellipsis when it is longer. */
function wrap2(label, n) {
  const words = String(label).split(/\s+/); const lines = ['']; 
  for (const w of words) { const cur = lines[lines.length - 1]; if (!cur || (cur + ' ' + w).length <= n) lines[lines.length - 1] = cur ? cur + ' ' + w : w; else if (lines.length < 2) lines.push(w); else { lines[1] += ' ' + w; } }
  return lines.map(l => (l.length > n ? l.slice(0, n - 1) + '…' : l));
}
/** Vertical bars; optional second series drawn as muted grey bars beside the first. */
export function BarChart({ data, series = [{ key: 'value', label: '' }], height = 220, caption, max, unit = '' }) {
  const { dir } = useI18n(); const rtl = dir === 'rtl';
  const W = 640, H = height, pl = 40, pb = 46, pt = 12; const iw = W - pl - 8, ih = H - pb - pt;
  const m = max ?? niceMax(Math.max(1, ...data.flatMap(d => series.map(s => Number(d[s.key]) || 0))));
  const bw = iw / Math.max(1, data.length); const inner = Math.min(36, (bw * 0.7) / series.length);
  const X = i => (rtl ? W - 8 - (i + 1) * bw : pl + i * bw);
  return (<Figure caption={caption}><svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={caption}>
    {[0, 0.25, 0.5, 0.75, 1].map(f => { const y = pt + ih - f * ih; return <g key={f}><line className="grid-line" x1={pl} x2={W - 8} y1={y} y2={y} /><text x={rtl ? W - 4 : pl - 6} y={y + 4} textAnchor={rtl ? 'start' : 'end'}>{Math.round(m * f)}{unit}</text></g>; })}
    {data.map((d, i) => <g key={i}>{series.map((s, k) => { const v = Number(d[s.key]) || 0; const h = (v / m) * ih; const x = X(i) + (bw - inner * series.length) / 2 + k * inner;
      return <rect key={s.key} x={x} y={pt + ih - h} width={inner - 2} height={h} rx="3" fill={k === 0 ? C.orange : C.line} stroke={k === 0 ? 'none' : C.medium} strokeDasharray={k === 0 ? '' : '3 2'}><title>{`${d.label}: ${v}${unit}`}</title></rect>; })}
      <text x={X(i) + bw / 2} y={H - pb + 14} textAnchor="middle">{wrap2(d.label, Math.max(6, Math.floor(bw / 6.2))).map((ln, j) => <tspan key={j} x={X(i) + bw / 2} dy={j ? 13 : 0}>{ln}</tspan>)}<title>{d.label}</title></text></g>)}
  </svg>{series.length > 1 && <div className="legend">{series.map((s, k) => <span key={s.key}><i style={{ background: k === 0 ? C.orange : C.line }} />{s.label}</span>)}</div>}</Figure>);
}

/** Line chart: current series solid orange, target or comparison dashed grey. */
export function LineChart({ labels, lines, height = 220, caption, unit = '' }) {
  const { dir } = useI18n(); const rtl = dir === 'rtl';
  const W = 640, H = height, pl = 44, pb = 32, pt = 12; const iw = W - pl - 12, ih = H - pb - pt;
  const m = niceMax(Math.max(1, ...lines.flatMap(l => l.values.map(v => Number(v) || 0))));
  const X = i => { const x = pl + (labels.length > 1 ? (i * iw) / (labels.length - 1) : iw / 2); return rtl ? W - x + pl - 12 : x; };
  const Y = v => pt + ih - ((Number(v) || 0) / m) * ih;
  return (<Figure caption={caption}><svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={caption}>
    {[0, 0.5, 1].map(f => <g key={f}><line className="grid-line" x1={pl} x2={W - 12} y1={pt + ih - f * ih} y2={pt + ih - f * ih} /><text x={rtl ? W - 4 : pl - 6} y={pt + ih - f * ih + 4} textAnchor={rtl ? 'start' : 'end'}>{Math.round(m * f)}{unit}</text></g>)}
    {labels.map((l, i) => <text key={i} x={X(i)} y={H - 10} textAnchor="middle">{l}</text>)}
    {lines.map((ln, k) => <g key={ln.label}><polyline fill="none" stroke={ln.color || (k === 0 ? C.orange : C.medium)} strokeWidth={k === 0 ? 2.5 : 1.5} strokeDasharray={ln.dashed || k > 0 ? '5 4' : ''} points={ln.values.map((v, i) => `${X(i)},${Y(v)}`).join(' ')} />
      {k === 0 && ln.values.map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r="3.5" fill={C.orange}><title>{`${labels[i]}: ${v}${unit}`}</title></circle>)}</g>)}
  </svg><div className="legend">{lines.map((ln, k) => <span key={ln.label}><i style={{ background: ln.color || (k === 0 ? C.orange : C.line) }} />{ln.label}</span>)}</div></Figure>);
}

/** Radar for multi-dimension current vs desired comparisons. */
export function Radar({ axes, series, caption, max = 5, size = 300 }) {
  const cx = size / 2, cy = size / 2, R = size / 2 - 40; const n = axes.length;
  const pt = (i, v) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; const r = (v / max) * R; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  return (<Figure caption={caption}><svg className="chart" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={caption} style={{ maxWidth: size + 80, margin: '0 auto' }}>
    {[0.25, 0.5, 0.75, 1].map(f => <polygon key={f} className="grid-line" fill="none" points={axes.map((_, i) => pt(i, max * f).join(',')).join(' ')} />)}
    {axes.map((a, i) => { const [x, y] = pt(i, max * 1.18); return <g key={a}><line className="grid-line" x1={cx} y1={cy} x2={pt(i, max)[0]} y2={pt(i, max)[1]} /><text x={x} y={y} textAnchor="middle">{a}</text></g>; })}
    {series.map((s, k) => <polygon key={s.label} points={s.values.map((v, i) => pt(i, v).join(',')).join(' ')} fill={k === 0 ? C.orange : 'none'} fillOpacity={k === 0 ? 0.18 : 0} stroke={s.color || (k === 0 ? C.orange : C.medium)} strokeWidth={k === 0 ? 2.5 : 1.5} strokeDasharray={k === 0 ? '' : '5 4'} />)}
  </svg><div className="legend">{series.map((s, k) => <span key={s.label}><i style={{ background: s.color || (k === 0 ? C.orange : C.line) }} />{s.label}</span>)}</div></Figure>);
}

/** Horizontal stacked bar of statuses using the semantic scale. */
export function StackBar({ parts, caption }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (<Figure caption={caption}><div style={{ display: 'flex', height: 16, borderRadius: 8, overflow: 'hidden', background: 'var(--pa-grey-light)' }} role="img" aria-label={caption}>
    {parts.filter(p => p.value).map(p => <span key={p.label} title={`${p.label}: ${p.value}`} style={{ width: (p.value * 100) / total + '%', background: p.color }} />)}</div>
    <div className="legend">{parts.map(p => <span key={p.label}><i style={{ background: p.color }} />{p.label} · {p.value}</span>)}</div></Figure>);
}
export const STATUS_COLORS = { Completed: 'var(--pa-status-5)', 'In progress': 'var(--pa-orange-tint)', Blocked: 'var(--pa-status-1)', 'Not started': 'var(--pa-grey-line)', Green: 'var(--pa-status-4)', Amber: 'var(--pa-status-2)', Red: 'var(--pa-status-1)' };
