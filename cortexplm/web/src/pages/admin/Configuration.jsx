import { useState } from 'react';
import { Lock, Check as CheckIcon } from 'lucide-react';
import { useAuth } from '../../lib/auth.jsx';
import { useI18n } from '../../lib/i18n.jsx';
import { put, post } from '../../lib/api.js';
import LlmConnection from '../../components/LlmConnection.jsx';
import { PageHeader, Card, CardHead, useFetch, Skeleton, Button, Modal, Field, Input, Select, Check, useToast, Badge, Progress, StatusBadge, JustifyModal, fmtDate, DataTable } from '../../components/ui.jsx';


// Database backups (NFR-DA-REL-04), platform administrators only.
function Backups() {
  const { t } = useI18n();
  const toast = useToast();
  const { data, reload } = useFetch('/backups');
  if (!data) return null;
  return (
    <Card style={{ marginTop: 24 }}>
      <CardHead title={t('Backups')} subtitle={data.daily ? t('One automatic backup a day, kept {n} days. Restore: stop the server and copy a backup over data/cortexplm.db.', { n: data.retentionDays }) : t('Automatic daily backups are off (BACKUP_DAILY=off).')}
        actions={<Button onClick={async () => { try { const b = await post('/backups'); toast.ok(t('Backup written: {f}', { f: b.file })); reload(); } catch (e) { toast.err(e); } }}>{t('Back up now')}</Button>} />
      <DataTable filterable={false} rows={data.backups.map((b) => ({ ...b, id: b.file }))} columns={[
        { key: 'file', label: t('File') }, { key: 'created', label: t('Date'), render: (b) => b.created.slice(0, 16).replace('T', ' ') },
        { key: 'size', label: t('Size'), num: true, render: (b) => `${(b.size / 1048576).toFixed(1)} MB` },
      ]} empty={t('No backup yet.')} />
    </Card>
  );
}

export default function Configuration() {
  const { t } = useI18n();
  const { me, can, refresh } = useAuth();
  const toast = useToast();
  const cfg = useFetch('/config');
  const cat = useFetch('/catalog');
  const settings = useFetch('/settings');
  const [edit, setEdit] = useState(null);
  const [std, setStd] = useState(null);
  const [ack, setAck] = useState(false);
  const [justify, setJustify] = useState(false);
  if (!cfg.data || !cat.data) return <div className="page"><Skeleton h={500} /></div>;
  const c = cfg.data; const manage = can('config.manage');
  const after = () => { cfg.reload(); refresh(); };
  const subs = [...cat.data.packs.map((p) => ({ value: p.id, label: `${p.id} ${p.name} ($${p.price})` })), ...cat.data.bundles.map((b) => ({ value: b.id, label: `${b.id} ${b.name} ($${b.price})` }))];
  return (
    <div className="page">
      <PageHeader eyebrow={t('Administration · Configuration management')} title={t('Configuration & AI model')} subtitle={t('{s} gives access to {n} macro processes, tier {tier}, AI {ai}.', { s: `${c.subscriptionId} ${c.subscriptionName}`, n: c.macroProcesses.length, tier: t(c.tierName), ai: t(c.aiTier) })}
        actions={manage && c.deploymentMode !== 'onprem' && <Button variant="primary" onClick={() => setEdit({ subscription_id: c.subscriptionId, seats: c.seats, expiry_date: (c.expiryDate || '').slice(0, 10), support_tier: c.supportTier, deployment_option: c.deploymentOption, billing_cycle: c.billingCycle })}>{t('Change subscription')}</Button>} />
      <div className="grid two" style={{ marginBottom: 24 }}>
        <Card>
          <CardHead title={t('Features')} subtitle={t('Enforced by the server on every request, in addition to role permissions.')} />
          <ul className="list-plain">{Object.entries(cat.data.features).map(([k, f]) => (
            <li key={k} className="row between"><span className="row" style={{ gap: 8 }}>{c.features[k] ? <CheckIcon size={16} aria-hidden /> : <Lock size={16} aria-hidden />}{t(f.label)}</span>
              {c.features[k] ? <StatusBadge value="On">{t('Included')}</StatusBadge> : <Badge>{t('Needs {m}', { m: f.mps.join(' / ') })}</Badge>}</li>))}</ul>
        </Card>
        <div className="stack">
          <Card>
            <CardHead title={t('Quotas')} subtitle={t('Usage computed live from current data.')} />
            {Object.entries(c.quotas).map(([k, max]) => (
              <div key={k} className="bar-row"><span className="small strong">{t({ projects: 'Projects', obsNodes: 'OBS nodes', customAiUseCases: 'Custom AI use cases' }[k])}</span><Progress value={(c.usage[k] / max) * 100} label={k} /><span className={`small num ${c.quotaFlags[k] ? 'strong' : ''}`}>{c.usage[k]}/{max}</span></div>
            ))}
            <div className="bar-row"><span className="small strong">{t('Seats')}</span><Progress value={(c.usage.seats / c.seats) * 100} label={t('Seats')} /><span className="small num">{c.usage.seats}/{c.seats}</span></div>
            {Object.values(c.quotaFlags).some(Boolean) && <div className="callout warn">{t('A quota is reached. New items of that type are refused until the subscription is upgraded.')}</div>}
          </Card>
          <Card><dl className="kv">
            <dt>{t('Packs included')}</dt><dd>{c.packs.join(', ')}</dd><dt>{t('Deployment')}</dt><dd>{t(c.deploymentOption)}</dd><dt>{t('Support tier')}</dt><dd>{t(c.supportTier)}</dd>
            <dt>{t('Billing')}</dt><dd>{t(c.billingCycle)}</dd><dt>{t('Expiry date')}</dt><dd>{fmtDate(c.expiryDate)}</dd><dt>{t('Licensing mode')}</dt><dd>{c.deploymentMode === 'onprem' ? t('OnPrem (signed licence file)') : t('SaaS')}</dd>
          </dl></Card>
        </div>
      </div>
      <div className="grid two-even" style={{ marginBottom: 24 }}>
        <Card>
          <CardHead title={t('Add-ons')} subtitle={t('Independent priced toggles; only add-ons compatible with the subscription can be activated.')} />
          <ul className="list-plain">{cat.data.addons.map((a) => {
            const on = c.addons.includes(a.id); const ok = a.packs.includes('ALL') || c.packs.includes('PACK-11') || a.packs.some((p) => c.packs.includes(p));
            return (<li key={a.id} className="row between"><span><strong className="strong">{a.id}</strong> {t(a.name)}<div className="xs muted">{t(a.category)} · {a.packs.includes('ALL') ? t('All packs') : a.packs.join(', ')}</div></span>
              <Check label={on ? t('Active') : ok ? t('Off') : t('Not compatible')} checked={on} disabled={!manage || (!ok && !on)} onChange={async (e) => { try { await put(`/config/addons/${a.id}`, { active: e.target.checked }); toast.ok(t('Add-on updated.')); after(); } catch (err) { toast.err(err); } }} /></li>);
          })}</ul>
        </Card>
        <div className="stack">
          <Card>
            <CardHead title={t('Compliance & security standards')} subtitle={t('Independent of the pack. Activation adds starting controls once.')} />
            <div className="callout neutral" style={{ marginBottom: 12 }}>{t(c.disclosure)}</div>
            <ul className="list-plain">{cat.data.compliance.map((s) => {
              const on = c.compliance.includes(s.id);
              return (<li key={s.id} className="row between"><span><strong className="strong">{s.name}</strong><div className="xs muted">{t(s.description)} · {t('{n} starting controls', { n: s.controlCount })}</div></span>
                {on ? <Button size="sm" disabled={!manage} onClick={async () => { try { await put(`/config/compliance/${s.id}`, { active: false }); toast.ok(t('Deactivated. Tagged controls are kept.')); after(); } catch (e) { toast.err(e); } }}>{t('Deactivate')}</Button>
                  : <Button size="sm" variant="primary" disabled={!manage} onClick={() => { setAck(false); setStd(s); }}>{t('Activate')}</Button>}</li>);
            })}</ul>
          </Card>
          <Card>
            <CardHead title={t('Governance settings')} />
            {settings.data && <div className="stack">
              <Check label={t('Require a justification note before saving governed changes')} checked={settings.data.justification_required} disabled={!can('governance.manage', 'hierarchy.manage')}
                onChange={async (e) => { try { await put('/settings', { justification_required: e.target.checked }); settings.reload(); toast.ok(t('Saved.')); } catch (err) { toast.err(err); } }} />
              <Field label={t('Organization default language')}><Select value={settings.data.default_language} disabled={!can('governance.manage', 'hierarchy.manage')} onChange={async (e) => { try { await put('/settings', { default_language: e.target.value }); settings.reload(); toast.ok(t('Saved.')); } catch (err) { toast.err(err); } }} options={[{ value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }, { value: 'ar', label: 'العربية' }]} /></Field>
            </div>}
          </Card>
        </div>
      </div>
      <Card><CardHead title={t('Macro processes available with this subscription')} /><div className="row" style={{ gap: 4 }}>{c.macroProcesses.map((m) => <Badge key={m}>{m}</Badge>)}</div></Card>
      {edit && !justify && (
        <Modal title={t('Change subscription')} onClose={() => setEdit(null)} footer={<><Button onClick={() => setEdit(null)}>{t('Cancel')}</Button><Button variant="primary" onClick={() => setJustify(true)}>{t('Continue')}</Button></>}>
          <div className="form-grid">
            <Field label={t('Pack or bundle')} full><Select value={edit.subscription_id} onChange={(e) => setEdit({ ...edit, subscription_id: e.target.value })} options={subs} /></Field>
            <Field label={t('Seats (licensed users)')}><Input type="number" min="1" value={edit.seats} onChange={(e) => setEdit({ ...edit, seats: e.target.value })} /></Field>
            <Field label={t('Expiry date')}><Input type="date" value={edit.expiry_date} onChange={(e) => setEdit({ ...edit, expiry_date: e.target.value })} /></Field>
            <Field label={t('Support tier')}><Select value={edit.support_tier} onChange={(e) => setEdit({ ...edit, support_tier: e.target.value })} options={['Standard', 'Premium 24/7'].map((v) => ({ value: v, label: t(v) }))} /></Field>
            <Field label={t('Deployment')}><Select value={edit.deployment_option} onChange={(e) => setEdit({ ...edit, deployment_option: e.target.value })} options={['SaaS (shared)', 'Dedicated / sovereign'].map((v) => ({ value: v, label: t(v) }))} /></Field>
            <Field label={t('Billing')}><Select value={edit.billing_cycle} onChange={(e) => setEdit({ ...edit, billing_cycle: e.target.value })} options={['Monthly', 'Annual'].map((v) => ({ value: v, label: t(v) }))} /></Field>
          </div>
        </Modal>
      )}
      {justify && <JustifyModal required onCancel={() => setJustify(false)} onConfirm={async (j) => { try { await put('/config', { ...edit, seats: Number(edit.seats), justification: j }); toast.ok(t('Subscription updated.')); setEdit(null); setJustify(false); after(); } catch (e) { toast.err(e); setJustify(false); } }} />}
      {std && (
        <Modal title={t('Activate {s}', { s: std.name })} onClose={() => setStd(null)} footer={<><Button onClick={() => setStd(null)}>{t('Cancel')}</Button><Button variant="primary" disabled={!ack} onClick={async () => { try { const r = await put(`/config/compliance/${std.id}`, { active: true, disclosureAcknowledged: true }); toast.ok(r.alreadyActive ? t('Already active; nothing duplicated.') : t('{n} starting controls added.', { n: r.seeded })); setStd(null); after(); } catch (e) { toast.err(e); } }}>{t('Activate')}</Button></>}>
          <div className="callout warn" style={{ marginBottom: 16 }}>{t(c.disclosure)}</div>
          <Check label={t('I understand that this is not a certification, an external audit or a legal attestation.')} checked={ack} onChange={(e) => setAck(e.target.checked)} />
        </Modal>
      )}
      <div id="ai-model" style={{ marginTop: 24 }}><LlmConnection /></div>
      {me.user.isPlatformAdmin && <Backups />}
    </div>
  );
}
