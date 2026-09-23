import { useState } from 'react';
import { useAuth } from '../../lib/auth.jsx';
import { useI18n } from '../../lib/i18n.jsx';
import { post } from '../../lib/api.js';
import { PageHeader, Card, CardHead, DataTable, useFetch, Skeleton, StatusBadge, Tabs, Modal, Field, Input, Button, useToast, Badge, fmtNum } from '../../components/ui.jsx';
import { LineChart } from '../../components/charts.jsx';
import CrudPage from '../../components/CrudPage.jsx';

const LABEL = { met: 'On target', near: 'Near target', missed: 'Off target', info: 'No numeric target', none: 'No data' };

export default function Kpis() {
  const { t } = useI18n();
  const { can } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('builtin');
  const { data, reload } = useFetch('/kpis');
  const [sel, setSel] = useState(null);
  const [m, setM] = useState(null);
  const target = (k) => { const x = String(k.target).replace(/,/g, '').match(/[\d.]+/); return x && !/plan|year|product/.test(k.target) ? Number(x[0]) : null; };
  return (
    <div className="page">
      <PageHeader eyebrow={t('Governance · D06')} title={t('KPIs')} subtitle={data ? t('{m} of {n} built-in KPIs are on target. Values marked "Computed live" come from current records.', { m: data.filter((k) => k.status === 'met').length, n: data.length }) : ''} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'builtin', label: t('Built-in KPIs') }, { value: 'custom', label: t('Custom KPIs') }]} />
      {tab === 'builtin' && (!data ? <Skeleton /> : (
        <div className="grid two">
          <Card>
            <DataTable csvName="kpis" rows={data} pageSize={40} onRowClick={setSel} columns={[
              { key: 'id', label: t('KPI') }, { key: 'name', label: t('Name'), render: (k) => <><div className="strong">{t(k.name)}</div><div className="xs muted">{t(k.formula)}</div></> },
              { key: 'value', label: t('Value'), num: true, render: (k) => (k.value != null ? `${fmtNum(k.value, 1)} ${k.unit === '%' ? '%' : t(k.unit)}` : '—') },
              { key: 'target', label: t('Target') }, { key: 'status', label: t('Status'), render: (k) => <StatusBadge value={k.status}>{t(LABEL[k.status])}</StatusBadge> },
              { key: 'source', label: t('Source'), render: (k) => <Badge tone={k.source === 'Computed live' ? 'accent' : 'outline'}>{t(k.source)}</Badge> },
            ]} />
          </Card>
          <Card>
            {sel ? (
              <>
                <CardHead title={`${sel.id} ${t(sel.name)}`} subtitle={`${t('Target')}: ${sel.target} · ${sel.process}`} actions={can('kpi.manage') && <Button size="sm" onClick={() => setM({ period: new Date().toISOString().slice(0, 7), value: '' })}>{t('Record measurement')}</Button>} />
                {sel.series.length > 1 ? <LineChart data={sel.series.map((s) => ({ label: s.period, value: s.value }))} target={target(sel)} primaryLabel={t('Measured')} targetLabel={t('Target')} caption={t('Monthly recorded values against the target (dashed).')} />
                  : <p className="muted">{t('This KPI is computed live from current records: {v}.', { v: sel.value ?? t('no data yet') })}</p>}
                <p className="small" style={{ marginTop: 12 }}><strong className="strong">{t('Formula')}:</strong> {t(sel.formula)}</p>
              </>
            ) : <p className="muted">{t('Select a KPI to see its trend.')}</p>}
          </Card>
        </div>
      ))}
      {tab === 'custom' && (
        <CrudPage endpoint="/custom-kpis" csvName="custom_kpis" entityLabel="custom KPI" newLabel="Add custom KPI" canManage={can('kpi.manage')}
          columns={[{ key: 'name', label: t('Name') }, { key: 'formula', label: t('Formula'), render: (k) => <span className="small">{k.formula}</span> }, { key: 'target', label: t('Target') },
            { key: 'current_value', label: t('Current value'), num: true, render: (k) => (k.current_value != null ? `${k.current_value} ${k.unit || ''}` : '—') }, { key: 'owner', label: t('Owner') }, { key: 'process_tag', label: t('Process') }]}
          fields={[{ key: 'name', label: 'Name', required: true }, { key: 'formula', label: 'Formula (plain language)', type: 'textarea', required: true }, { key: 'target', label: 'Target', required: true },
            { key: 'unit', label: 'Unit' }, { key: 'current_value', label: 'Current value', type: 'number' }, { key: 'owner', label: 'Owner', required: true }, { key: 'process_tag', label: 'Process tag (macro process)' }]} />
      )}
      {m && (
        <Modal title={t('Record measurement for {k}', { k: sel.id })} onClose={() => setM(null)} footer={<><Button onClick={() => setM(null)}>{t('Cancel')}</Button><Button variant="primary" disabled={m.value === ''} onClick={async () => { try { await post(`/kpis/${sel.id}/measurements`, m); toast.ok(t('Measurement saved.')); setM(null); setSel(null); reload(); } catch (e) { toast.err(e); } }}>{t('Save')}</Button></>}>
          <div className="form-grid"><Field label={t('Period (YYYY-MM)')}><Input value={m.period} onChange={(e) => setM({ ...m, period: e.target.value })} /></Field><Field label={t('Value')}><Input type="number" value={m.value} onChange={(e) => setM({ ...m, value: e.target.value })} /></Field></div>
        </Modal>
      )}
    </div>
  );
}
