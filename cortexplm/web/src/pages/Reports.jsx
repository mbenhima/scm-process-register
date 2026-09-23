import { Link, useParams } from 'react-router-dom';
import { FileText, FileSpreadsheet, FileType } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { download } from '../lib/api.js';
import { PageHeader, Card, CardHead, DataTable, useFetch, Skeleton, ErrorNote, StatusBadge, Button, Badge, useToast, fmtNum } from '../components/ui.jsx';

function Exports({ id }) {
  const { t } = useI18n();
  const toast = useToast();
  const { can } = useAuth();
  if (!can('report.export')) return null;
  const go = (f) => download(`/reports/${id}/export/${f}`).catch((e) => toast.err(e));
  return <><Button icon={FileText} onClick={() => go('pdf')}>PDF</Button><Button icon={FileSpreadsheet} onClick={() => go('xlsx')}>Excel</Button><Button icon={FileType} onClick={() => go('docx')}>Word</Button></>;
}

export default function Reports() {
  const { id } = useParams();
  const { t } = useI18n();
  const list = useFetch(id ? null : '/reports');
  const rep = useFetch(id ? `/reports/${id}` : null);
  if (id) {
    if (rep.error) return <div className="page"><ErrorNote error={rep.error} /></div>;
    if (!rep.data) return <div className="page"><Skeleton h={500} /></div>;
    const r = rep.data;
    return (
      <div className="page">
        <PageHeader eyebrow={<><Link to="/reports">{t('Reports & cockpits')}</Link> · {r.id} · {t(r.audience)} · {t(r.cadence)}</>} title={t(r.name)} subtitle={t('{o}, generated {d}. Figures are computed from current records.', { o: r.organization, d: r.generatedAt.slice(0, 16).replace('T', ' ') })} actions={<Exports id={r.id} />} />
        {r.kpis.length > 0 && (
          <div className="grid kpis" style={{ marginBottom: 24 }}>
            {r.kpis.map((k) => (
              <Card key={k.id} className="kpi">
                <span className="value">{k.value != null ? fmtNum(k.value, 1) : '—'}<span className="small" style={{ marginInlineStart: 4 }}>{k.value != null ? (k.unit === '%' ? '%' : t(k.unit)) : ''}</span></span>
                <span className="label">{k.id} {t(k.name)}</span>
                <span className="meta row" style={{ gap: 8 }}>{t('Target')} {k.target} <StatusBadge value={k.status}>{t({ met: 'On target', near: 'Near target', missed: 'Off target', info: 'No numeric target', none: 'No data' }[k.status])}</StatusBadge></span>
                <span className="meta">{t(k.source)}</span>
              </Card>
            ))}
          </div>
        )}
        <div className="stack">{r.tables.map((tb) => (
          <Card key={tb.title}><CardHead title={t(tb.title)} />
            <DataTable csvName={`${r.id}_${tb.title}`} rows={tb.rows.map((row, i) => ({ id: i, ...Object.fromEntries(row.map((v, j) => [`c${j}`, v])) }))}
              columns={tb.columns.map((c, j) => ({ key: `c${j}`, label: t(c), render: (row) => (row[`c${j}`] == null || row[`c${j}`] === '' ? '—' : String(row[`c${j}`])) }))} empty={t('No records yet.')} />
          </Card>
        ))}</div>
      </div>
    );
  }
  if (!list.data) return <div className="page"><Skeleton /></div>;
  return (
    <div className="page">
      <PageHeader eyebrow={t('Reports · D08')} title={t('Reports & cockpits')} subtitle={t('24 role-specific reports. Open one to see it, then download it as PDF, Excel or Word.')} />
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {list.data.map((r) => (
          <Card key={r.id}>
            <div className="eyebrow">{r.id} · {t(r.cadence)}</div>
            <h3><Link to={`/reports/${r.id}`}>{t(r.name)}</Link></h3>
            <p className="small muted" style={{ marginTop: 8 }}>{t('For')}: {t(r.audience)}</p>
            <div className="row">{(r.fields.match(/KPI-\d+/g) || []).map((k) => <Badge key={k}>{k}</Badge>)}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
