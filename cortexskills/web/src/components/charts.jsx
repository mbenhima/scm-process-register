// Charts (FR-DA-VIZ-01 – 08). Series colours come from tokens: primary or current series solid (--aiv-azure),
// comparison or prior period dashed Muted, growth solid Green, overlay solid Teal, gridlines in Line. Every chart
// resizes with its container (min 240 px high), shows a skeleton while loading and "No data for this period." when
// empty, puts its legend below with dot markers and an italic caption, offers copy / PNG (2×) / SVG / CSV / print
// within the export right, and a data-table view reachable by keyboard. No pie, no 3D, no gradient on data.
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { useSession } from '../lib/session.jsx';
import { downloadCsv } from '../lib/api.js';
import { Btn, Icon, Skeleton } from './ui.jsx';

const C = { primary: 'var(--aiv-azure)', deep: 'var(--aiv-azure-deep)', muted: 'var(--aiv-muted-2)', line: 'var(--aiv-line)', green: 'var(--aiv-green)', teal: 'var(--aiv-teal)', navy: 'var(--aiv-navy)', alt: 'var(--aiv-bg-alt)' };
export const SERIES = [C.primary, C.teal, C.green];
export const STATUS_COLORS = { Completed: 'var(--aiv-status-5)', 'In progress': 'var(--aiv-status-3)', Blocked: 'var(--aiv-status-1)', 'Not started': 'var(--aiv-line)', Green: 'var(--aiv-status-4)', Amber: 'var(--aiv-status-2)', Red: 'var(--aiv-status-1)' };
const niceMax = v => { if (!v) return 10; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };
const fmt = v => (Number.isInteger(v) ? String(v) : (Math.round(v * 10) / 10).toString());

/** Resolves token references to literal values so an exported SVG renders the same outside the application. */
function inlineSvg(svg) {
  const clone = svg.cloneNode(true); const src = svg.querySelectorAll('*'); const dst = clone.querySelectorAll('*');
  src.forEach((el, i) => { const cs = getComputedStyle(el); const d = dst[i];
    for (const a of ['fill', 'stroke']) { const v = el.getAttribute(a); if (v && v.includes('var(')) d.setAttribute(a, cs[a]); }
    if (el.tagName === 'text' || el.tagName === 'tspan') { d.setAttribute('fill', cs.fill); d.setAttribute('font-family', cs.fontFamily); d.setAttribute('font-size', cs.fontSize); d.setAttribute('font-weight', cs.fontWeight); }
    if (el.tagName === 'line' || el.tagName === 'polygon' || el.tagName === 'polyline') { if (!d.getAttribute('stroke')) d.setAttribute('stroke', cs.stroke); } });
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', '100%'); bg.setAttribute('height', '100%'); bg.setAttribute('fill', getComputedStyle(document.body).backgroundColor); clone.insertBefore(bg, clone.firstChild);
  return new XMLSerializer().serializeToString(clone);
}
function toPng(svg, scale = 2) {
  return new Promise((res, rej) => { const vb = svg.viewBox.baseVal; const w = (vb?.width || svg.clientWidth) * scale, h = (vb?.height || svg.clientHeight) * scale;
    const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h); c.toBlob(b => (b ? res(b) : rej(new Error('png'))), 'image/png'); };
    img.onerror = rej; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(inlineSvg(svg)); });
}
const save = (blob, name) => { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 2000); };

/**
 * Frame shared by every chart: export tools, data-table view, caption, loading and empty states.
 * `table` = { columns: [..], rows: [[..]] } is the underlying data, used for CSV and the data-table view.
 */
export function Figure({ caption, children, label, table, loading, empty, name = 'chart', legend }) {
  const { t } = useI18n(); const { can } = useSession(); const ref = useRef(null); const [view, setView] = useState(false); const tid = useId();
  const svg = () => ref.current?.querySelector('svg.chart');
  const canExport = can('reports.export') || can('reports.view');
  const tools = canExport && !loading && !empty && <div className="chart-tools" role="toolbar" aria-label={t('chart.tools')}>
    <Btn icon="Copy" kind="ghost" size="sm" aria-label={t('chart.copy')} onClick={async () => { const s = svg(); if (!s) return; try { const b = await toPng(s); await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': b })]); } catch { save(await toPng(s), name + '.png'); } }} />
    <Btn icon="ImageDown" kind="ghost" size="sm" aria-label={t('chart.png')} onClick={async () => { const s = svg(); if (s) save(await toPng(s, 2), name + '.png'); }} />
    <Btn icon="FileCode2" kind="ghost" size="sm" aria-label={t('chart.svg')} onClick={() => { const s = svg(); if (s) save(new Blob([inlineSvg(s)], { type: 'image/svg+xml' }), name + '.svg'); }} />
    {table && <Btn icon="FileSpreadsheet" kind="ghost" size="sm" aria-label={t('chart.csv')} onClick={() => downloadCsv(name, table.columns, table.rows)} />}
    <Btn icon="Printer" kind="ghost" size="sm" aria-label={t('chart.print')} onClick={() => { const s = svg(); if (!s) return; const w = window.open('', '_blank'); if (!w) return; w.document.write(`<title>${caption || name}</title><body style="margin:24px">${inlineSvg(s)}<p style="font:italic 12px sans-serif">${caption || ''}</p></body>`); w.document.close(); w.focus(); w.print(); }} />
    {table && <Btn icon="Table2" kind="ghost" size="sm" aria-label={view ? t('chart.showChart') : t('chart.showTable')} aria-expanded={view} aria-controls={tid} onClick={() => setView(v => !v)} />}</div>;
  return (<figure className="chart-wrap" style={{ margin: 0 }} ref={ref} aria-label={label || caption}>
    {tools}
    {loading ? <Skeleton kind="block" /> : empty ? <div className="chart-empty"><Icon name="ChartNoAxesColumn" size={32} /><span>{t('chart.noData')}</span></div>
      : view && table ? <div id={tid} className="table-wrap auto-h chart-table"><table className="tbl compact"><thead><tr>{table.columns.map(c => <th key={c} scope="col">{c}</th>)}</tr></thead><tbody>{table.rows.map((r, i) => <tr key={r[0] + '|' + i}>{r.map((v, j) => <td key={table.columns[j]} className={typeof v === 'number' ? 'num' : ''}>{v}</td>)}</tr>)}</tbody></table></div>
        : children}
    {!loading && !empty && !view && legend}
    {caption && <figcaption className="caption">{caption}</figcaption>}</figure>);
}
const LegendRow = ({ items }) => <div className="legend">{items.map(i => <span key={i.label}><i className={i.dashed ? 'dashed' : i.status ? 'status' : ''} style={i.dashed ? undefined : { background: i.color }} />{i.label}</span>)}</div>;

/** Splits an axis label into at most two lines of about n characters, with an ellipsis when it is longer. */
function wrap2(label, n) {
  const words = String(label).split(/\s+/); const lines = [''];
  for (const w of words) { const cur = lines[lines.length - 1]; if (!cur || (cur + ' ' + w).length <= n) lines[lines.length - 1] = cur ? cur + ' ' + w : w; else if (lines.length < 2) lines.push(w); else lines[1] += ' ' + w; }
  return lines.map(l => (l.length > n ? l.slice(0, n - 1) + '…' : l));
}

/** Column chart to compare categories; a second series (prior or target) is drawn dashed in Muted. */
export function BarChart({ data, series = [{ key: 'value', label: '' }], height = 240, caption, max, unit = '', loading, name, showValues = true }) {
  const { dir } = useI18n(); const rtl = dir === 'rtl';
  const W = 640, H = Math.max(240, height), pl = 44, pb = 46, pt = 20; const iw = W - pl - 8, ih = H - pb - pt;
  const m = max ?? niceMax(Math.max(1, ...data.flatMap(d => series.map(s => Number(d[s.key]) || 0))));
  const bw = iw / Math.max(1, data.length); const inner = Math.min(36, (bw * 0.7) / series.length);
  const X = i => (rtl ? W - 8 - (i + 1) * bw : pl + i * bw);
  const table = { columns: ['', ...series.map(s => s.label || 'value')], rows: data.map(d => [d.label, ...series.map(s => Number(d[s.key]) || 0)]) };
  const legend = series.length > 1 && <LegendRow items={series.map((s, k) => ({ label: s.label, color: k === 0 ? C.primary : s.color || C.muted, dashed: k > 0 && !s.color }))} />;
  return (<Figure caption={caption} table={table} loading={loading} empty={!loading && !data.length} name={name} legend={legend}><svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${caption || ''} ${data.map(d => `${d.label}: ${series.map(s => (d[s.key] ?? 0) + unit).join(' / ')}`).join('; ')}`}>
    {[0, 0.25, 0.5, 0.75, 1].map(f => { const y = pt + ih - f * ih; return <g key={f}><line className="grid-line" x1={pl} x2={W - 8} y1={y} y2={y} /><text x={rtl ? W - 4 : pl - 6} y={y + 4} textAnchor={rtl ? 'start' : 'end'}>{fmt(m * f)}{unit}</text></g>; })}
    {data.map((d, i) => <g key={d.label + '|' + i}>{series.map((s, k) => { const v = Number(d[s.key]) || 0; const h = (v / m) * ih; const x = X(i) + (bw - inner * series.length) / 2 + k * inner;
      return <g key={s.key}><rect x={x} y={pt + ih - h} width={inner - 3} height={h} rx="3" fill={k === 0 ? C.primary : s.color || C.alt} stroke={k === 0 || s.color ? 'none' : C.muted} strokeDasharray={k === 0 || s.color ? '' : '4 3'}><title>{`${d.label}: ${v}${unit}`}</title></rect>
        {showValues && data.length <= 16 && k === 0 && <text className="value" x={x + (inner - 3) / 2} y={pt + ih - h - 5} textAnchor="middle">{fmt(v)}</text>}</g>; })}
      <text x={X(i) + bw / 2} y={H - pb + 16} textAnchor="middle">{wrap2(d.label, Math.max(6, Math.floor(bw / 6.6))).map((ln, j) => <tspan key={j} x={X(i) + bw / 2} dy={j ? 13 : 0}>{ln}</tspan>)}<title>{d.label}</title></text></g>)}
  </svg></Figure>);
}

/** Horizontal bars, for long category names and distributions. */
export function HBarChart({ data, caption, max, unit = '', loading, name }) {
  const { dir } = useI18n(); const rtl = dir === 'rtl'; const W = 640, row = 28, pl = 200, H = Math.max(240, data.length * row + 24); const iw = W - pl - 48;
  const m = max ?? niceMax(Math.max(1, ...data.map(d => Number(d.value) || 0)));
  return (<Figure caption={caption} loading={loading} empty={!loading && !data.length} name={name} table={{ columns: ['', 'value'], rows: data.map(d => [d.label, d.value]) }}><svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={caption}>
    {data.map((d, i) => { const y = 12 + i * row; const w = ((Number(d.value) || 0) / m) * iw; const x0 = rtl ? W - pl : pl;
      return <g key={d.label + i}><text x={rtl ? W - 4 : pl - 8} y={y + 14} textAnchor={rtl ? 'start' : 'end'}>{wrap2(d.label, 30)[0]}<title>{d.label}</title></text>
        <rect x={rtl ? x0 - w : x0} y={y + 2} width={w} height={row - 10} rx="3" fill={d.color || C.primary} /><text className="value" x={rtl ? x0 - w - 6 : x0 + w + 6} y={y + 15} textAnchor={rtl ? 'end' : 'start'}>{fmt(Number(d.value) || 0)}{unit}</text></g>; })}
  </svg></Figure>);
}

/** Line chart for trends over time: current series solid primary, comparison dashed Muted, growth Green, overlay Teal. */
export function LineChart({ labels, lines, height = 240, caption, unit = '', loading, name }) {
  const { dir } = useI18n(); const rtl = dir === 'rtl';
  const W = 640, H = Math.max(240, height), pl = 48, pb = 32, pt = 16; const iw = W - pl - 16, ih = H - pb - pt;
  const m = niceMax(Math.max(1, ...lines.flatMap(l => l.values.map(v => Number(v) || 0))));
  const X = i => { const x = pl + (labels.length > 1 ? (i * iw) / (labels.length - 1) : iw / 2); return rtl ? W - x + pl - 16 : x; };
  const Y = v => pt + ih - ((Number(v) || 0) / m) * ih;
  const color = (ln, k) => ln.color || (k === 0 ? C.primary : ln.growth ? C.green : ln.overlay ? C.teal : C.muted);
  const dashed = (ln, k) => ln.dashed ?? (k > 0 && !ln.growth && !ln.overlay && !ln.color);
  const table = { columns: ['', ...lines.map(l => l.label)], rows: labels.map((l, i) => [l, ...lines.map(ln => ln.values[i])]) };
  return (<Figure caption={caption} table={table} loading={loading} empty={!loading && (!labels.length || lines.every(l => !l.values.length))} name={name}
    legend={<LegendRow items={lines.map((ln, k) => ({ label: ln.label, color: color(ln, k), dashed: dashed(ln, k) }))} />}><svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={caption}>
    {[0, 0.25, 0.5, 0.75, 1].map(f => <g key={f}><line className="grid-line" x1={pl} x2={W - 16} y1={pt + ih - f * ih} y2={pt + ih - f * ih} /><text x={rtl ? W - 4 : pl - 6} y={pt + ih - f * ih + 4} textAnchor={rtl ? 'start' : 'end'}>{fmt(m * f)}{unit}</text></g>)}
    {labels.map((l, i) => (labels.length <= 14 || i % Math.ceil(labels.length / 12) === 0) && <text key={l + i} x={X(i)} y={H - 10} textAnchor="middle">{l}</text>)}
    {lines.map((ln, k) => <g key={ln.label}><polyline fill="none" stroke={color(ln, k)} strokeWidth={k === 0 ? 2.5 : 2} strokeDasharray={dashed(ln, k) ? '6 4' : ''} strokeLinejoin="round" points={ln.values.map((v, i) => `${X(i)},${Y(v)}`).join(' ')} />
      {k === 0 && ln.values.map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r="3.5" fill={color(ln, k)}><title>{`${labels[i]}: ${v}${unit}`}</title></circle>)}</g>)}
  </svg></Figure>);
}

/** Radar for maturity on several axes: current solid primary with a light fill, target dashed Muted. */
export function Radar({ axes, series, caption, max = 5, size = 320, loading, name }) {
  const cx = size / 2, cy = size / 2, R = size / 2 - 48; const n = axes.length;
  const pt = (i, v) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; const r = (Math.min(v, max) / max) * R; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const table = { columns: ['', ...series.map(s => s.label)], rows: axes.map((a, i) => [a, ...series.map(s => s.values[i])]) };
  return (<Figure caption={caption} table={table} loading={loading} empty={!loading && n < 3} name={name} legend={<LegendRow items={series.map((s, k) => ({ label: s.label, color: s.color || (k === 0 ? C.primary : C.muted), dashed: k > 0 && !s.color }))} />}>
    <svg className="chart" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={caption} style={{ maxWidth: size + 120, margin: '0 auto' }}>
      {[0.25, 0.5, 0.75, 1].map(f => <polygon key={f} className="grid-line" fill="none" points={axes.map((_, i) => pt(i, max * f).join(',')).join(' ')} />)}
      {axes.map((a, i) => { const [x, y] = pt(i, max * 1.2); return <g key={a}><line className="grid-line" x1={cx} y1={cy} x2={pt(i, max)[0]} y2={pt(i, max)[1]} /><text x={x} y={y} textAnchor={Math.abs(x - cx) < 8 ? 'middle' : x < cx ? 'end' : 'start'}>{wrap2(a, 18)[0]}<title>{a}</title></text></g>; })}
      {series.map((s, k) => <polygon key={s.label} points={s.values.map((v, i) => pt(i, v).join(',')).join(' ')} fill={k === 0 ? C.primary : 'none'} fillOpacity={k === 0 ? 0.16 : 0} stroke={s.color || (k === 0 ? C.primary : C.muted)} strokeWidth={k === 0 ? 2.5 : 2} strokeDasharray={k === 0 || s.color ? '' : '6 4'} />)}
    </svg></Figure>);
}

/** Measures its container so that SVG text keeps its true size (no distortion when the chart stretches). */
function useWidth(initial = 640) {
  const ref = useRef(null); const [w, setW] = useState(initial);
  useLayoutEffect(() => { const el = ref.current; if (!el) return undefined; const ro = new ResizeObserver(([e]) => setW(Math.max(160, Math.round(e.contentRect.width)))); ro.observe(el); return () => ro.disconnect(); }, []);
  return [ref, w];
}
/** Composition: 100 % stacked bar; status parts use the status scale and always show their label and count. */
export function StackBar({ parts, caption, loading, name }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1; const [ref, W] = useWidth(); const { dir } = useI18n(); const rtl = dir === 'rtl';
  return (<Figure caption={caption} loading={loading} empty={!loading && !parts.some(p => p.value)} name={name} table={{ columns: ['', 'n', '%'], rows: parts.map(p => [p.label, p.value, Math.round((p.value * 100) / total)]) }}
    legend={<LegendRow items={parts.map(p => ({ label: `${p.label} · ${p.value}`, color: p.color, status: true }))} />}>
    <div ref={ref} style={{ width: '100%' }}><svg className="chart" viewBox={`0 0 ${W} 40`} width={W} height={40} role="img" aria-label={`${caption || ''} ${parts.map(p => `${p.label} ${p.value}`).join(', ')}`}>
      {(() => { let x = 0; return parts.filter(p => p.value).map(p => { const w = (p.value * W) / total; const x0 = rtl ? W - x - w : x; const el = <g key={p.label}><rect x={x0} y={8} width={Math.max(0, w - 2)} height={24} rx="4" fill={p.color}><title>{`${p.label}: ${p.value}`}</title></rect>{w > 44 && <text className="value" x={x0 + w / 2} y={24} textAnchor="middle">{Math.round((p.value * 100) / total)}%</text>}</g>; x += w; return el; }); })()}
    </svg></div></Figure>);
}

/** Part of a whole: donut with the total in the centre (never a pie, never 3D). */
export function Donut({ parts, caption, center, loading, name, size = 240 }) {
  const total = parts.reduce((s, p) => s + p.value, 0); const r = 80, w = 28, cx = size / 2, cy = size / 2; let a0 = -Math.PI / 2;
  const arc = v => { const a1 = a0 + (v / (total || 1)) * Math.PI * 2; const large = a1 - a0 > Math.PI ? 1 : 0; const p = [cx + r * Math.cos(a0), cy + r * Math.sin(a0), cx + r * Math.cos(a1 - 0.0001), cy + r * Math.sin(a1 - 0.0001)]; a0 = a1; return `M ${p[0]} ${p[1]} A ${r} ${r} 0 ${large} 1 ${p[2]} ${p[3]}`; };
  return (<Figure caption={caption} loading={loading} empty={!loading && !total} name={name} table={{ columns: ['', 'n'], rows: parts.map(p => [p.label, p.value]) }} legend={<LegendRow items={parts.map(p => ({ label: `${p.label} · ${p.value}`, color: p.color }))} />}>
    <svg className="chart" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${caption || ''} ${parts.map(p => `${p.label} ${p.value}`).join(', ')}`} style={{ maxWidth: size, margin: '0 auto' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.alt} strokeWidth={w} />
      {parts.filter(p => p.value).map(p => <path key={p.label} d={arc(p.value)} fill="none" stroke={p.color} strokeWidth={w}><title>{`${p.label}: ${p.value}`}</title></path>)}
      <text className="value" x={cx} y={cy + 6} textAnchor="middle" style={{ fontSize: 24 }}>{center ?? total}</text></svg></Figure>);
}

/** Maturity score at a glance: radial gauge from 0 to max. */
export function Gauge({ value, max = 5, label, caption, loading, name }) {
  const v = Math.max(0, Math.min(max, Number(value) || 0)); const W = 240, cx = 120, cy = 130, r = 96; const a = Math.PI * (1 - v / max);
  const end = [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  return (<Figure caption={caption} loading={loading} name={name} table={{ columns: ['', 'value', 'max'], rows: [[label || '', v, max]] }}><svg className="chart" viewBox={`0 0 ${W} 160`} role="img" aria-label={`${label || ''} ${v} / ${max}`} style={{ maxWidth: 280, margin: '0 auto' }}>
    <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={C.alt} strokeWidth="18" strokeLinecap="round" />
    {v > 0 && <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${end[0]} ${end[1]}`} fill="none" stroke={C.primary} strokeWidth="18" strokeLinecap="round" />}
    <text className="value" x={cx} y={cy - 8} textAnchor="middle" style={{ fontSize: 30 }}>{fmt(v)}</text><text x={cx} y={cy + 16} textAnchor="middle">/ {max}{label ? ' · ' + label : ''}</text></svg></Figure>);
}

/** Heatmap with the five status-scale colours in their fixed order; every cell shows its level (FR-DA-VIZ-06). */
export function Heatmap({ rows, cols, value, caption, levelOf, name }) {
  const lv = v => (levelOf ? levelOf(v) : Math.max(1, Math.min(5, Math.round(v))));
  return (<Figure caption={caption} name={name} table={{ columns: ['', ...cols.map(c => c.label)], rows: rows.map(r => [r.label, ...cols.map(c => value(r, c) ?? '')]) }}
    legend={<LegendRow items={[1, 2, 3, 4, 5].map(l => ({ label: String(l), color: `var(--aiv-status-${l})`, status: true }))} />}>
    <div className="heat" style={{ gridTemplateColumns: `minmax(120px, 200px) repeat(${cols.length}, minmax(48px, 1fr))` }} role="table" aria-label={caption}>
      <div className="axis" role="columnheader" />{cols.map(c => <div key={c.key} className="axis" role="columnheader">{c.label}</div>)}
      {rows.map(r => [<div key={r.key + 'h'} className="axis" role="rowheader" style={{ justifyItems: 'start' }}>{r.label}</div>, ...cols.map(c => { const v = value(r, c); return v == null ? <div key={r.key + c.key} role="cell" style={{ background: 'var(--aiv-bg-alt)' }}>—</div> : <div key={r.key + c.key} role="cell" style={{ background: `var(--aiv-status-${lv(v)})` }}>{fmt(v)}</div>; })])}
    </div></Figure>);
}
