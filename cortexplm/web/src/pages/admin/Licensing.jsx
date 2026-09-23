// Licensing (D30): licence status, seats used against the licensed maximum, expiry warning (CTRL-003),
// and upload of a signed .lic file in OnPrem mode.
import { useState } from 'react';
import { KeyRound, Upload } from 'lucide-react';
import { useAuth } from '../../lib/auth.jsx';
import { useI18n } from '../../lib/i18n.jsx';
import { post } from '../../lib/api.js';
import { PageHeader, Card, CardHead, Kpi, useFetch, Skeleton, ErrorNote, StatusBadge, Button, Badge, Progress, useToast, fmtDate } from '../../components/ui.jsx';

export default function Licensing() {
  const { t } = useI18n();
  const { can, refresh } = useAuth();
  const toast = useToast();
  const { data: l, error, reload } = useFetch('/licence');
  const [err, setErr] = useState(null);
  if (error) return <div className="page"><PageHeader eyebrow={t('Administration')} title={t('Licensing')} /><ErrorNote error={error} /></div>;
  if (!l) return <div className="page"><Skeleton h={400} /></div>;
  const pct = l.maxUsers ? (l.seatsUsed / l.maxUsers) * 100 : 0;
  const upload = async (file) => {
    setErr(null);
    try { await post('/licence/upload', { content: await file.text() }); toast.ok(t('Licence installed.')); reload(); refresh(); } catch (e) { setErr(e); }
  };
  const lic = l.licence || {};
  return (
    <div className="page">
      <PageHeader eyebrow={t('Administration · Licensing')} title={t('Licence and seats')}
        subtitle={l.mode === 'onprem' ? t('OnPrem mode: the licence comes from a signed file verified with the vendor public key.') : t('SaaS mode: the licence record is signed by the platform and follows the subscription.')}
        actions={<><StatusBadge value={l.status} /><Badge tone="dark">{l.mode === 'onprem' ? 'OnPrem' : 'SaaS'}</Badge></>} />
      {l.status === 'warning' && <div className="callout warn" style={{ marginBottom: 16 }}><KeyRound size={18} aria-hidden /><div>{t('The licence expires in {n} days. Renew it to avoid an interruption (CTRL-003).', { n: l.daysLeft })}</div></div>}
      {l.reason && l.status !== 'active' && l.status !== 'warning' && <div className="callout bad" style={{ marginBottom: 16 }}>{l.reason}</div>}
      <div className="grid kpis" style={{ marginBottom: 24 }}>
        <Kpi value={`${l.seatsUsed} / ${l.maxUsers ?? '—'}`} label={t('Licences used')} meta={l.canCreateUser ? t('Seats available') : t('No seat left: new users are blocked')} />
        <Kpi value={l.daysLeft ?? '—'} label={t('Days until expiry')} neutral />
        <Kpi value={l.plan || '—'} label={t('Plan')} neutral />
        <Kpi value={l.addOns?.length || 0} label={t('Active add-ons')} neutral />
      </div>
      <div className="grid two">
        <Card>
          <CardHead title={t('Seat usage')} subtitle={t('{u} of {m} licences used', { u: l.seatsUsed, m: l.maxUsers ?? '—' })} />
          <Progress value={pct} label={t('Seat usage')} />
          <p className="small muted" style={{ marginTop: 8 }}>{t('Deactivating a user frees a seat. Creating a user beyond the maximum is refused.')}</p>
          <dl className="kv" style={{ marginTop: 16 }}>
            <dt>{t('Company')}</dt><dd>{lic.companyName || lic.companyId || '—'}</dd>
            <dt>{t('Subscription')}</dt><dd>{lic.plan || '—'}</dd>
            <dt>{t('Valid from')}</dt><dd>{fmtDate(lic.issueDate)}</dd>
            <dt>{t('Expires')}</dt><dd>{fmtDate(lic.expiryDate)}</dd>
            <dt>{t('Signature')}</dt><dd>{l.signed ? <StatusBadge value="Healthy">{t('Valid signature')}</StatusBadge> : <StatusBadge value="failed">{t('Unsigned')}</StatusBadge>}</dd>
          </dl>
        </Card>
        <div className="stack">
          <Card>
            <CardHead title={t('Enabled features')} subtitle={t('Feature flags carried by the licence.')} />
            <div className="row" style={{ gap: 4 }}>{(l.features || []).length ? l.features.map((k) => <Badge key={k} tone="s5">{k}</Badge>) : <span className="muted">—</span>}</div>
            {l.addOns?.length > 0 && <><h4 style={{ marginTop: 16 }}>{t('Add-ons')}</h4><div className="row" style={{ gap: 4 }}>{l.addOns.map((a) => <Badge key={a}>{a}</Badge>)}</div></>}
          </Card>
          {l.mode === 'onprem' && can('license.manage') && (
            <Card className="tint">
              <CardHead title={t('Install a licence file')} subtitle={t('Choose the .lic file sent by the vendor. Its signature is checked before it is installed.')} />
              <label className="btn btn-secondary"><Upload size={16} aria-hidden />{t('Choose a .lic file')}<input type="file" accept=".lic,.json" hidden onChange={(e) => e.target.files[0] && upload(e.target.files[0])} /></label>
              <div style={{ marginTop: 12 }}><ErrorNote error={err} /></div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
