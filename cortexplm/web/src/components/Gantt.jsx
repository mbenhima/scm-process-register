// Gantt chart for a WBS: bars by state (planned, in progress, completed, overdue), summary bars in grey-dark,
// dependency lines between predecessor and successor, and a today marker. Mirrors fully under RTL.
import { useI18n } from '../lib/i18n.jsx';
import { ChartFrame } from './charts.jsx';

const FILL = { Completed: 'var(--st-5)', 'In progress': 'var(--pa-orange)', Overdue: 'var(--st-1)', Planned: 'var(--pa-grey-line)' };

export default function Gantt({ nodes, onSelect }) {
  const { t, dir } = useI18n();
  const dated = nodes.filter((n) => n.start && n.end);
  if (!dated.length) return <p className="muted">{t('No scheduled items yet.')}</p>;
  const min = new Date(Math.min(...dated.map((n) => +new Date(n.start))));
  const max = new Date(Math.max(...dated.map((n) => +new Date(n.end)), Date.now()));
  const days = Math.max(14, (max - min) / 86400000 + 7);
  const LABEL = 300; const DAYW = Math.max(3, Math.min(14, 900 / days)); const ROW = 28;
  const W = LABEL + days * DAYW + 16; const H = 36 + nodes.length * ROW;
  const rtl = dir === 'rtl';
  const X = (v) => (rtl ? W - v : v); // mirror a logical x position
  const tx = (d) => LABEL + ((new Date(d) - min) / 86400000) * DAYW; // logical x of a date
  const bar = (x1, x2) => (rtl ? [X(x2), x2 - x1] : [x1, x2 - x1]);
  const pos = Object.fromEntries(nodes.map((n, i) => [n.id, { y: 36 + i * ROW, n }]));
  const months = [];
  for (let m = new Date(min.getFullYear(), min.getMonth(), 1); m <= max; m.setMonth(m.getMonth() + 1)) if (m >= min) months.push(new Date(m));
  const anchor = rtl ? 'end' : 'start';
  return (
    <ChartFrame caption={t('Bars show planned dates; grey = planned, orange = in progress, green = completed, red = overdue, dark = summary rolled up from its children. Lines link predecessors to successors.')}
      legend={[{ label: t('Planned'), color: FILL.Planned }, { label: t('In progress'), color: FILL['In progress'] }, { label: t('Completed'), color: FILL.Completed }, { label: t('Overdue'), color: FILL.Overdue }, { label: t('Summary'), color: 'var(--pa-grey-dark)' }]}>
      <div className="gantt">
        <svg width={W} height={H} role="img" aria-label={t('Gantt chart')}>
          <defs><marker id="arrow" viewBox="0 0 6 6" refX="6" refY="3" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L6,3 L0,6 Z" fill="var(--pa-grey-ink)" /></marker></defs>
          {nodes.map((n, i) => i % 2 === 1 && <rect key={`z${n.id}`} x={0} y={36 + i * ROW} width={W} height={ROW} fill="var(--pa-grey-light)" />)}
          {months.map((m) => <g key={+m}><line x1={X(tx(m))} x2={X(tx(m))} y1={20} y2={H} stroke="var(--pa-grey-line)" /><text x={X(tx(m) + 4)} y={16} textAnchor={anchor} style={{ fill: 'var(--pa-grey-ink)' }}>{m.toISOString().slice(0, 7)}</text></g>)}
          <line x1={X(tx(new Date()))} x2={X(tx(new Date()))} y1={20} y2={H} stroke="var(--pa-grey-dark)" strokeDasharray="3 3" />
          <text x={X(tx(new Date()) + 4)} y={30} textAnchor={anchor} style={{ fontSize: 11, fill: 'var(--pa-grey-dark)' }}>{t('Today')}</text>
          {nodes.map((n, i) => {
            const y = 36 + i * ROW;
            const has = n.start && n.end;
            const x1 = has ? tx(n.start) : 0; const x2 = has ? Math.max(tx(n.end), x1 + 4) : 0;
            const [bx, bw] = bar(x1, x2);
            const label = n.name.length > 40 - n.depth * 2 ? `${n.name.slice(0, 38 - n.depth * 2)}…` : n.name;
            return (
              <g key={n.id} onClick={() => onSelect?.(n)} style={{ cursor: onSelect ? 'pointer' : 'default' }}>
                <text x={X(8 + n.depth * 14)} y={y + 18} textAnchor={anchor} style={{ fontWeight: n.summary ? 700 : 400 }}>{label}</text>
                {has && <rect x={bx} y={y + (n.summary ? 10 : 6)} width={bw} height={n.summary ? 8 : ROW - 12} rx={4} fill={n.summary ? 'var(--pa-grey-dark)' : FILL[n.state]}><title>{`${n.name}: ${n.start} → ${n.end} · ${n.pct}% · ${t(n.state)}`}</title></rect>}
                {has && !n.summary && n.pct > 0 && n.pct < 100 && (() => { const [px, pw] = bar(x1, x1 + ((x2 - x1) * n.pct) / 100); return <rect x={px} y={y + ROW - 8} width={pw} height={2} fill="var(--pa-grey-dark)" />; })()}
              </g>
            );
          })}
          {nodes.flatMap((n) => (n.predecessors || []).map((pid) => {
            const a = pos[pid]; const b = pos[n.id];
            if (!a?.n.end || !b?.n.start) return null;
            const ax = tx(a.n.end); const bx = tx(b.n.start); const ay = a.y + ROW / 2; const by = b.y + ROW / 2;
            return <path key={`${pid}-${n.id}`} d={`M${X(ax)},${ay} H${X(ax + 6)} V${by} H${X(bx)}`} fill="none" stroke="var(--pa-grey-ink)" strokeWidth={1} markerEnd="url(#arrow)" />;
          }))}
        </svg>
      </div>
    </ChartFrame>
  );
}
