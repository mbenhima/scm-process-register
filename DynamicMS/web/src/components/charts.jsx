// SVG charts in the brand palette: primary series solid orange, comparison series
// dashed grey, gridlines grey-line, axis text grey-medium, italic caption below.
import { useRef, useState } from 'react';
import { Table2, Copy, ImageDown, FileCode2, FileSpreadsheet, Printer, BarChart3 } from 'lucide-react';
import { useApp } from '../lib/state.jsx';
import { toCsv } from '../lib/multientry.js';
import { token } from '../lib/tokens.js';

const W = 640;

// Every chart: a toolbar to show its data as a table (keyboard reachable), copy it as an image,
// download it as PNG at twice its resolution, as SVG or its data as CSV, and print it — within
// the export rights of the role (FR-DA-VIZ-07, -08); an empty state when there is nothing to show (FR-DA-VIZ-04).
const resolveVars = (text) => { const cs = getComputedStyle(document.documentElement); return text.replace(/var\((--[\w-]+)\)/g, (m, v) => cs.getPropertyValue(v).trim() || m); };
function svgText(svg) {
  const c = svg.cloneNode(true);
  c.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const vb = svg.viewBox.baseVal; if (vb) { c.setAttribute('width', vb.width); c.setAttribute('height', vb.height); }
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = `text{font:12px "Open Sans",sans-serif;fill:${token('--aiv-muted')}}.grid-line{stroke:${token('--aiv-line')};stroke-width:1}`;
  c.insertBefore(style, c.firstChild);
  return resolveVars(new XMLSerializer().serializeToString(c));
}
function save(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
async function pngBlob(svg) {
  const vb = svg.viewBox.baseVal; const w = (vb?.width || svg.clientWidth) * 2; const h = (vb?.height || svg.clientHeight) * 2;
  const img = new Image(); img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText(svg))}`;
  await img.decode();
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'); g.fillStyle = token('--aiv-white'); g.fillRect(0, 0, w, h); g.drawImage(img, 0, 0, w, h);
  return new Promise(res => cv.toBlob(res, 'image/png'));
}
export function ChartFrame({ caption, name = 'chart', columns, rows, children, empty, vector = false }) {
  const { t, can, toast } = useApp();
  const [table, setTable] = useState(false);
  const box = useRef(null);
  const svg = () => box.current?.querySelector('svg.chart');
  const exp = can('reports.export');
  const csv = () => save(new Blob([toCsv(columns.map(c => c.label), rows.map(r => columns.map(c => r[c.key])))], { type: 'text/csv;charset=utf-8' }), `${name}.csv`);
  const copy = async () => { if (!svg()) return; try { const b = await pngBlob(svg()); await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]); toast(t('Chart copied as an image.')); } catch { toast(t('The browser did not allow copying; download the PNG instead.'), 'error'); } };
  const png = async () => { if (svg()) save(await pngBlob(svg()), `${name}.png`); };
  const svgDl = () => { if (svg()) save(new Blob([svgText(svg())], { type: 'image/svg+xml' }), `${name}.svg`); };
  const print = () => {
    const w = window.open('', '_blank', 'noopener=no'); if (!w) return;
    const s = svg();
    const head = columns.map(c => `<th>${c.label}</th>`).join('');
    const body = rows.map(r => `<tr>${columns.map(c => `<td>${String(r[c.key] ?? '')}</td>`).join('')}</tr>`).join('');
    w.document.write(`<!doctype html><meta charset="utf-8"><title>${caption || name}</title><style>body{font:14px "Open Sans",sans-serif;color:${token('--aiv-ink')};margin:2cm}svg{max-width:100%;height:auto}table{border-collapse:collapse;margin-top:16px}th{background:${token('--aiv-navy')};color:${token('--aiv-white')};text-align:start;padding:6px 10px}td{border-bottom:1px solid ${token('--aiv-line')};padding:6px 10px}figcaption{font-style:italic;color:${token('--aiv-muted')};margin-top:8px}</style><figure>${s ? svgText(s) : ''}<figcaption>${caption || ''}</figcaption></figure><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`);
    w.document.close(); w.focus(); w.print();
  };
  if (empty) return <div className="chart-empty" role="status"><BarChart3 size={48} aria-hidden="true" /><span>{t('No data for this period.')}</span></div>;
  return (
    <div ref={box} className="chart-frame">
      <div className="chart-tools" role="toolbar" aria-label={t('Chart tools')}>
        <button type="button" className="btn btn-sm btn-ghost" aria-pressed={table} onClick={() => setTable(v => !v)}><Table2 size={16} />{table ? t('Chart') : t('Data table')}</button>
        {exp && <>
          <button type="button" className="btn btn-sm btn-ghost btn-icon" aria-label={t('Copy the chart as an image')} title={t('Copy the chart as an image')} onClick={copy} hidden={table || !vector}><Copy size={16} /></button>
          <button type="button" className="btn btn-sm btn-ghost btn-icon" aria-label={t('Download PNG')} title={t('Download PNG')} onClick={png} hidden={table || !vector}><ImageDown size={16} /></button>
          <button type="button" className="btn btn-sm btn-ghost btn-icon" aria-label={t('Download SVG')} title={t('Download SVG')} onClick={svgDl} hidden={table || !vector}><FileCode2 size={16} /></button>
          <button type="button" className="btn btn-sm btn-ghost btn-icon" aria-label={t('Download the data (CSV)')} title={t('Download the data (CSV)')} onClick={csv}><FileSpreadsheet size={16} /></button>
          <button type="button" className="btn btn-sm btn-ghost btn-icon" aria-label={t('Print')} title={t('Print')} onClick={print}><Printer size={16} /></button>
        </>}
      </div>
      <div hidden={table}>{children}</div>
      {table && (
        <div className="table-wrap" tabIndex={0} role="region" aria-label={caption}>
          <table className="table"><caption className="sr-only">{caption}</caption><thead><tr>{columns.map(c => <th key={c.key} scope="col">{c.label}</th>)}</tr></thead>
            <tbody>{rows.map((r, i) => <tr key={i}>{columns.map(c => <td key={c.key}>{String(r[c.key] ?? '')}</td>)}</tr>)}</tbody></table>
        </div>
      )}
    </div>
  );
}

export function LineChart({ series, target, height = 240, caption, unit = '', compare, compareLabel, seriesLabel, targetLabel }) {
  const { fmtNum, lang, t } = useApp();
  const rtl = lang === 'ar';
  if (!series?.length) return <ChartFrame empty />;
  const cols = [{ key: 'period', label: t('Period') }, { key: 'value', label: seriesLabel || t('Value') }, ...(compare ? [{ key: 'compare', label: compareLabel || t('Comparison') }] : []), ...(target !== null && target !== undefined ? [{ key: 'target', label: targetLabel || t('Target') }] : [])];
  const data = series.map((p, i) => ({ period: p.period, value: p.value, compare: compare?.[i]?.value, target }));
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
    <ChartFrame vector caption={caption} name="trend" columns={cols} rows={data}>
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
    </ChartFrame>
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
  const { fmtNum, t } = useApp();
  if (!items?.length) return <ChartFrame empty />;
  const cols = [{ key: 'label', label: t('Item') }, { key: 'value', label: seriesLabel || t('Value') }, ...(compareKey ? [{ key: compareKey, label: compareLabel || t('Comparison') }] : [])];
  return (
    <ChartFrame caption={caption} name="bars" columns={cols} rows={items}>
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
    </ChartFrame>
  );
}

// 5x5 likelihood x impact heatmap on the red-to-green scale.
export function Heatmap({ cells, caption, likelihoodLabel, impactLabel }) {
  const { t } = useApp();
  const count = (l, i) => cells.find(c => c.l === l && c.i === i)?.n || 0;
  const rowsOut = [];
  for (const l of [5, 4, 3, 2, 1]) for (const i of [1, 2, 3, 4, 5]) rowsOut.push({ l, i, s: l * i, n: count(l, i) });
  const col = (s) => (s >= 16 ? 'var(--st-1)' : s >= 10 ? 'var(--st-2)' : s >= 5 ? 'var(--st-3)' : 'var(--st-4)');
  return (
    <ChartFrame caption={caption} name="heatmap" rows={rowsOut} columns={[{ key: 'l', label: likelihoodLabel }, { key: 'i', label: impactLabel }, { key: 's', label: t('Score') }, { key: 'n', label: t('Count') }]}>
    <figure style={{ margin: 0 }}>
      <div className="heat" role="img" aria-label={caption}>
        {[5, 4, 3, 2, 1].map(l => [<span key={`l${l}`} className="xsmall muted" style={{ alignSelf: 'center' }}>{l}</span>, ...[1, 2, 3, 4, 5].map(i => <span key={`${l}${i}`} className="cell" style={{ background: col(l * i) }} title={`${likelihoodLabel} ${l} × ${impactLabel} ${i} = ${l * i}`}><span className="heat-n">{count(l, i) || ''}</span><span className="heat-s" aria-hidden="true">{l * i}</span></span>)])}
        <span />{[1, 2, 3, 4, 5].map(i => <span key={`i${i}`} className="xsmall muted" style={{ textAlign: 'center' }}>{i}</span>)}
      </div>
      <div className="row-between xsmall muted" style={{ marginTop: 4 }}><span>↑ {likelihoodLabel}</span><span>{impactLabel} →</span></div>
      {caption && <figcaption className="caption">{caption}</figcaption>}
    </figure>
    </ChartFrame>
  );
}

// Monthly completions (column chart).
export function Columns({ items, height = 240, caption, label }) {
  const { lang, t } = useApp();
  if (!items?.length) return <ChartFrame empty />;
  const max = Math.max(...items.map(i => i.n), 1);
  const bw = (W - 20) / items.length;
  return (
    <ChartFrame vector caption={caption} name="columns" rows={items} columns={[{ key: 'm', label: t('Month') }, { key: 'n', label: label || t('Value') }]}>
    <figure style={{ margin: 0 }}>
      <svg className="chart" viewBox={`0 0 ${W} ${height}`} role="img" aria-label={caption}>
        <line className="grid-line" x1="0" x2={W} y1={height - 20} y2={height - 20} />
        {items.map((it, i) => { const hh = ((height - 36) * it.n) / max; const xx = lang === 'ar' ? W - 10 - (i + 1) * bw : 10 + i * bw; return <g key={it.m}><rect x={xx + 4} y={height - 20 - hh} width={bw - 8} height={hh} rx="3" fill="var(--aiv-azure)"><title>{`${it.m}: ${it.n} ${label || ''}`}</title></rect><text x={xx + bw / 2} y={height - 5} textAnchor="middle">{it.m.slice(5)}</text></g>; })}
      </svg>
      {caption && <figcaption className="caption">{caption}</figcaption>}
    </figure>
    </ChartFrame>
  );
}
