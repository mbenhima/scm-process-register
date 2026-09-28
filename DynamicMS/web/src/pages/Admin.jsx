import { useEffect, useState } from 'react';
import { ShieldCheck, Database, Upload } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Card, Loading, ErrorBox, Status, Tabs, Table, tx, Field, IconBadge } from '../components/ui.jsx';

function Matrix() {
  const { t, lang, toast, can } = useApp();
  const { data, reload } = useData('/admin/permissions');
  const [mod, setMod] = useState('');
  if (!data) return <Loading />;
  const g = new Set(data.grants.filter(x => x.granted).map(x => `${x.role}:${x.perm}`));
  const custom = new Set(data.grants.filter(x => x.customized).map(x => `${x.role}:${x.perm}`));
  const toggle = async (role, perm) => { try { await api('/admin/permissions', { method: 'PUT', body: { role, perm, granted: !g.has(`${role}:${perm}`) } }); reload(); toast(t('Permission updated; it applies immediately.')); } catch (e) { toast(e.message, 'error'); } };
  const perms = data.permissions.filter(p => !mod || p.module === mod);
  const edit = can('permissions.manage');
  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}><select className="select" style={{ width: 'auto' }} aria-label={t('Module')} value={mod} onChange={e => setMod(e.target.value)}><option value="">{t('All modules')}</option>{[...new Set(data.permissions.map(p => p.module))].map(m => <option key={m} value={m}>{m}</option>)}</select><span className="small muted">{t('{p} permissions × {r} roles', { p: perms.length, r: data.roles.length })}</span></div>
      <div className="table-wrap" style={{ maxHeight: '68vh', overflow: 'auto' }}>
        <table className="data" style={{ fontSize: 12 }}>
          <thead><tr><th scope="col" style={{ minWidth: 260, position: 'sticky', insetInlineStart: 0, zIndex: 3 }}>{t('Permission')}</th>{data.roles.map(r => <th key={r.code} scope="col" style={{ writingMode: 'vertical-rl', transform: lang === 'ar' ? 'none' : 'rotate(180deg)', height: 160, padding: '8px 4px' }}>{tx(r.name, lang)}</th>)}</tr></thead>
          <tbody>{perms.map(p => <tr key={p.code}><td style={{ position: 'sticky', insetInlineStart: 0 }}><span className="strong">{tx(p.label, lang)}</span><br /><code className="xsmall muted">{p.code}</code></td>{data.roles.map(r => { const on = g.has(`${r.code}:${p.code}`); return <td key={r.code} style={{ textAlign: 'center', padding: 2 }}><input type="checkbox" aria-label={`${tx(r.name, lang)} — ${tx(p.label, lang)}`} checked={on} disabled={!edit || r.code === 'platform_admin'} onChange={() => toggle(r.code, p.code)} style={{ accentColor: 'var(--pa-orange-deep)', width: 16, height: 16, outline: custom.has(`${r.code}:${p.code}`) ? '2px solid var(--st-2)' : undefined }} /></td>; })}</tr>)}</tbody>
        </table>
      </div>
      <p className="caption">{t('Ticked cells grant the permission; changed defaults are outlined. Entitlement from the Solution Pack is checked separately.')}</p>
    </>
  );
}

function Config({ orgId }) {
  const { t, lang, toast, can } = useApp();
  const { data, reload } = useData(`/admin/orgs/${orgId}/config`);
  const [f, setF] = useState(null); const [ack, setAck] = useState(false); const [quote, setQuote] = useState(null);
  useEffect(() => { if (data) setF({ pack: data.config.pack, industryPacks: data.config.industryPacks, capabilityPacks: data.config.capabilityPacks, addons: data.config.addons, complianceStandards: data.config.complianceStandards, deploymentMode: data.config.deploymentMode }); }, [data]);
  useEffect(() => { if (f && can('config.manage')) api('/admin/pricing/quote', { method: 'POST', body: f }).then(setQuote).catch(() => {}); }, [f, can]);
  if (!data || !f) return <Loading />;
  const tog = (k, id) => setF({ ...f, [k]: f[k].includes(id) ? f[k].filter(x => x !== id) : [...f[k], id] });
  const added = f.complianceStandards.filter(s => !data.config.complianceStandards.includes(s));
  const save = async () => { try { await api(`/admin/orgs/${orgId}/config`, { method: 'PUT', body: { ...f, acknowledgeDisclosure: ack } }); toast(t('Configuration saved.')); setAck(false); reload(); } catch (e) { toast(e.message, 'error'); } };
  const edit = can('config.manage');
  return (
    <div className="grid-main">
      <div className="stack">
        <Card title={t('Solution pack')}><div className="stack-8">{data.basePacks.map(p => <label key={p.id} className="checkbox"><input type="radio" name="pack" disabled={!edit} checked={f.pack === p.id} onChange={() => setF({ ...f, pack: p.id })} /><span><span className="strong">{p.id}</span> — {tx(p.name, lang)} <span className="xsmall muted">· {t('{u} users, {p} projects, AI {a}', { u: p.quotas.users, p: p.quotas.projects, a: p.aiTier })}</span></span></label>)}</div></Card>
        <Card title={t('Capability and industry packs')}><div className="form-grid">{data.capabilityPacks.map(p => <label key={p.id} className="checkbox small"><input type="checkbox" disabled={!edit} checked={f.capabilityPacks.includes(p.id)} onChange={() => tog('capabilityPacks', p.id)} /><span>{p.id} — {tx(p.name, lang)}</span></label>)}{data.industryPacks.map(p => <label key={p.id} className="checkbox small"><input type="checkbox" disabled={!edit} checked={f.industryPacks.includes(p.id)} onChange={() => tog('industryPacks', p.id)} /><span>{p.id} — {tx(p.name, lang)}</span></label>)}</div></Card>
        <Card title={t('Add-ons')}><div className="form-grid">{data.addons.map(a => <label key={a.id} className="checkbox small"><input type="checkbox" disabled={!edit} checked={f.addons.includes(a.id)} onChange={() => tog('addons', a.id)} /><span>{a.id} — {tx(a.name, lang)}</span></label>)}</div></Card>
        <Card title={t('Compliance & security standards')}>
          <div className="form-grid">{data.complianceStandards.map(s => <label key={s.id} className="checkbox small"><input type="checkbox" disabled={!edit} checked={f.complianceStandards.includes(s.id)} onChange={() => tog('complianceStandards', s.id)} /><span>{tx(s.name, lang)} <span className="muted">· {t('{n} scaffold controls', { n: s.controls })}</span></span></label>)}</div>
          {added.length > 0 && <div className="callout" style={{ marginTop: 16 }}><div className="stack-8"><span>{tx(data.disclosure, lang)}</span><label className="checkbox"><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} /><span className="strong">{t('I understand this is not a certification.')}</span></label></div></div>}
        </Card>
      </div>
      <div className="stack">
        <Card title={t('Deployment')}><select className="select" aria-label={t('Deployment mode')} disabled={!edit} value={f.deploymentMode} onChange={e => setF({ ...f, deploymentMode: e.target.value })}>{data.deploymentModes.map(d => <option key={d.code} value={d.code}>{d.code} — {tx(d.name, lang)} (×{d.multiplier})</option>)}</select></Card>
        {quote && <Card title={t('Monthly price')} action={<span className="serif" style={{ fontSize: 30, fontWeight: 700, color: 'var(--pa-orange-deep)' }}>{quote.totalMonthly}</span>}><Table rows={quote.lines} rowKey="id" columns={[{ key: 'id', label: t('Item') }, { key: 'monthly', label: 'USD' }]} /><p className="small" style={{ marginTop: 8 }}>{t('Subtotal {s} · bundle discount {b}% · deployment {d}', { s: quote.subtotal, b: quote.bundleDiscountPct, d: quote.deploymentMode })}</p><p className="caption">{t('List prices of the packs catalog in USD per month; annual commitment saves 15%.')}</p></Card>}
        {edit && <button className="btn btn-primary" disabled={added.length > 0 && !ack} onClick={save}>{t('Save configuration')}</button>}
      </div>
    </div>
  );
}

function Integrations({ orgId }) {
  const { t, lang, toast, fmtDate, can } = useApp();
  const { data, reload } = useData(`/admin/orgs/${orgId}/integrations`);
  if (!data) return <Loading />;
  const upd = async (i, body) => { try { await api(`/admin/integrations/${i.id}`, { method: 'PUT', body }); reload(); } catch (e) { toast(e.message, 'error'); } };
  const test = async (i) => { try { const r = await api(`/admin/integrations/${i.id}/test`, { method: 'POST' }); toast(t('Connection test: {h}', { h: r.health })); reload(); } catch (e) { toast(e.message, 'error'); } };
  return <Table rows={data} columns={[{ key: 'code', label: 'ID', width: 80 }, { key: 'name', label: t('Integration'), render: i => <span className="strong">{tx(i.catalog?.name, lang)}</span> }, { key: 'cat', label: t('Category'), render: i => tx(i.catalog?.category, lang) }, { key: 'enabled', label: t('Enabled'), render: i => <input type="checkbox" aria-label={t('Enabled')} checked={!!i.enabled} disabled={!can('integrations.manage')} onChange={e => upd(i, { enabled: e.target.checked })} /> }, { key: 'health', label: t('Health'), render: i => <Status value={i.health} /> }, { key: 'checked_at', label: t('Checked'), render: i => fmtDate(i.checked_at) }, { key: 't', label: '', sortable: false, render: i => i.enabled ? <button className="btn btn-sm" onClick={() => test(i)}>{t('Test')}</button> : null }]} />;
}

function AuditTrail({ orgId }) {
  const { t, lang, fmtDate } = useApp();
  const [type, setType] = useState('');
  const { data } = useData(`/admin/audit-log?orgId=${orgId}&limit=200${type ? `&entityType=${type}` : ''}`, [type]);
  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}><select className="select" style={{ width: 'auto' }} aria-label={t('Record type')} value={type} onChange={e => setType(e.target.value)}><option value="">{t('All record types')}</option>{['step', 'gate', 'project', 'nc', 'action', 'document', 'risk', 'kpi', 'rule', 'control', 'racsi', 'configuration', 'permission', 'user', 'report', 'ai_suggestion'].map(x => <option key={x} value={x}>{x}</option>)}</select>{data && <span className="small muted">{t('{n} entries', { n: data.total })}</span>}</div>
      {data ? <Table rows={data.items} columns={[{ key: 'at', label: t('Date'), render: a => `${fmtDate(a.at)} ${a.at?.slice(11, 16)}` }, { key: 'user_name', label: t('User') }, { key: 'entity_type', label: t('Record') }, { key: 'action', label: t('Action') }, { key: 'justification', label: t('Justification'), render: a => tx(a.justification, lang) || '—' }, { key: 'after_', label: t('Change'), render: a => <code className="xsmall">{JSON.stringify(a.after_)?.slice(0, 90)}</code> }]} /> : <Loading />}
    </>
  );
}

function Import({ orgId }) {
  const { t, toast, project } = useApp();
  const [kind, setKind] = useState('suppliers'); const [csv, setCsv] = useState(''); const [res, setRes] = useState(null);
  const sample = { users: 'name,email,roles,lang\nLina Haddad,lina.haddad@example.org,quality_manager|employee,fr', suppliers: 'title,score,status\nPrecision Castings,86,Approved', risks: 'title,likelihood,impact,kind,category\nPower outage on line 2,3,4,Risk,Operations' };
  const run = async (commit) => { try { const r = await api(`/admin/orgs/${orgId}/import`, { method: 'POST', body: { kind, csv, commit, projectId: project?.id } }); setRes(r); if (r.committed) toast(t('{n} records imported.', { n: r.accepted })); } catch (e) { toast(e.message, 'error'); } };
  return (
    <div className="grid-main">
      <Card title={t('Import data')}>
        <div className="stack">
          <Field label={t('Data')}>{(id) => <select id={id} className="select" value={kind} onChange={e => { setKind(e.target.value); setRes(null); }}><option value="suppliers">{t('Suppliers (current project)')}</option><option value="risks">{t('Risks (current project)')}</option><option value="users">{t('Users')}</option></select>}</Field>
          <Field label={t('CSV content')} hint={t('First row: column names. Separator: comma or semicolon.')}>{(id) => <textarea id={id} className="textarea" style={{ minHeight: 180, fontFamily: 'monospace' }} value={csv} onChange={e => setCsv(e.target.value)} placeholder={sample[kind]} />}</Field>
          <div className="row"><button className="btn" onClick={() => setCsv(sample[kind])}>{t('Use the sample')}</button><button className="btn" disabled={!csv.trim()} onClick={() => run(false)}>{t('Validate')}</button><button className="btn btn-primary" disabled={!res || res.rejected.length > 0 || res.committed} onClick={() => run(true)}><Upload size={16} />{t('Import')}</button></div>
        </div>
      </Card>
      <Card title={t('Validation result')}>{res ? <><p className="small">{t('{a} of {n} records valid.', { a: res.accepted, n: res.total })}</p>{res.rejected.length > 0 && <Table rows={res.rejected.map(r => ({ ...r, id: r.line }))} columns={[{ key: 'line', label: t('Line'), width: 60 }, { key: 'errors', label: t('Errors'), render: r => r.errors.join('; ') }]} />}</> : <p className="small muted">{t('Validate the file to see accepted and rejected records before import.')}</p>}</Card>
    </div>
  );
}

function Operations() {
  const { t, fmtDate, toast, me } = useApp();
  const backups = useData(me.user.isPlatformAdmin ? '/admin/backups' : null);
  const lic = useData('/admin/licence');
  const health = useData('/health');
  const now = async () => { try { const b = await api('/admin/backups', { method: 'POST' }); toast(t('Backup {f} written, integrity {i}.', { f: b.file, i: b.integrity })); backups.reload(); } catch (e) { toast(e.message, 'error'); } };
  return (
    <div className="grid-main">
      <Card title={t('Backups')} action={me.user.isPlatformAdmin && <button className="btn btn-primary btn-sm" onClick={now}><Database size={16} />{t('Back up now')}</button>}>
        {me.user.isPlatformAdmin ? (backups.data ? <><p className="small">{t('Daily automatic backup; files older than {d} days are removed.', { d: backups.data.retentionDays })}</p><Table rows={backups.data.items.map(b => ({ ...b, id: b.file }))} columns={[{ key: 'file', label: t('File') }, { key: 'size', label: t('Size'), render: b => `${(b.size / 1048576).toFixed(1)} MB` }, { key: 'at', label: t('Date'), render: b => fmtDate(b.at) }]} /></> : <Loading />) : <p className="small muted">{t('Backups are managed by the platform administrator.')}</p>}
      </Card>
      <div className="stack">
        <Card title={t('Licence')} action={<IconBadge icon={ShieldCheck} accent={lic.data?.valid} size="sm" />}>{lic.data && <><p className="small"><Status value={lic.data.valid ? 'Valid' : 'Failed'} /> {lic.data.mode.toUpperCase()}</p><p className="small">{lic.data.message}</p></>}</Card>
        <Card title={t('Health')}>{health.data && <dl className="small stack-8" style={{ margin: 0 }}><div>{t('Status')}: <span className="strong">{health.data.status}</span></div><div>{t('Version')}: {health.data.version}</div><div>{t('Seeded')}: {fmtDate(health.data.seededAt)}</div></dl>}</Card>
      </div>
    </div>
  );
}

export default function Admin() {
  const { t, can, project, me } = useApp();
  const orgId = project?.org?.access === 'write' ? project.org.id : me.org?.id;
  const tabs = [
    ...(can('permissions.manage') || can('users.manage') ? [{ id: 'matrix', label: t('Permission matrix') }] : []),
    ...(can('config.manage') || can('tenancy.view') ? [{ id: 'config', label: t('Configuration') }] : []),
    ...(can('integrations.manage') ? [{ id: 'integrations', label: t('Integrations') }] : []),
    ...(can('audit.view') ? [{ id: 'audit', label: t('Audit trail') }] : []),
    ...(can('users.manage') ? [{ id: 'import', label: t('Data import') }] : []),
    { id: 'ops', label: t('Operations') },
  ];
  const [tab, setTab] = useState(tabs[0]?.id);
  if (!orgId && !me.user.isPlatformAdmin) return <ErrorBox error={{ status: 403, message: '' }} />;
  return (
    <>
      <PageHead eyebrow={t('Organization')} title={t('Administration')} subtitle={t('Roles and permissions, commercial configuration, integrations, audit trail, data import and platform operations.')} />
      <Tabs label={t('Administration')} value={tab} onChange={setTab} tabs={tabs} />
      {tab === 'matrix' && <Matrix />}
      {tab === 'config' && orgId && <Config orgId={orgId} />}
      {tab === 'integrations' && orgId && <Integrations orgId={orgId} />}
      {tab === 'audit' && orgId && <AuditTrail orgId={orgId} />}
      {tab === 'import' && orgId && <Import orgId={orgId} />}
      {tab === 'ops' && <Operations />}
    </>
  );
}
