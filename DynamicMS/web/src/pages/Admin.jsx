import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Database, Upload, Plus, Building2, Users, Sparkles, KeyRound } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Card, Loading, ErrorBox, Status, Tabs, Table, tx, Field, IconBadge, Modal } from '../components/ui.jsx';

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
          <tbody>{perms.map(p => <tr key={p.code}><td style={{ position: 'sticky', insetInlineStart: 0 }}><span className="strong">{tx(p.label, lang)}</span><br /><code className="xsmall muted">{p.code}</code></td>{data.roles.map(r => { const on = g.has(`${r.code}:${p.code}`); return <td key={r.code} style={{ textAlign: 'center', padding: 2 }}><input type="checkbox" aria-label={`${tx(r.name, lang)} — ${tx(p.label, lang)}`} checked={on} disabled={!edit || r.code === 'platform_admin'} onChange={() => toggle(r.code, p.code)} style={{ accentColor: 'var(--aiv-azure)', width: 16, height: 16, outline: custom.has(`${r.code}:${p.code}`) ? '2px solid var(--st-2)' : undefined }} /></td>; })}</tr>)}</tbody>
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
  // The refetch after this form's own save keeps the choices made meanwhile.
  const keepDraft = useRef(false);
  useEffect(() => { if (!data) return; if (keepDraft.current) { keepDraft.current = false; return; } setF({ pack: data.config.pack, industryPacks: data.config.industryPacks, capabilityPacks: data.config.capabilityPacks, addons: data.config.addons, complianceStandards: data.config.complianceStandards, deploymentMode: data.config.deploymentMode }); }, [data]);
  useEffect(() => { if (f && can('config.manage')) api('/admin/pricing/quote', { method: 'POST', body: f }).then(setQuote).catch(() => {}); }, [f, can]);
  if (!data || !f) return <Loading />;
  const tog = (k, id) => setF({ ...f, [k]: f[k].includes(id) ? f[k].filter(x => x !== id) : [...f[k], id] });
  const added = f.complianceStandards.filter(s => !data.config.complianceStandards.includes(s));
  const save = async () => { try { await api(`/admin/orgs/${orgId}/config`, { method: 'PUT', body: { ...f, acknowledgeDisclosure: ack } }); toast(t('Configuration saved.')); setAck(false); keepDraft.current = true; reload(); } catch (e) { toast(e.message, 'error'); } };
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
        {quote && <Card title={t('Monthly price')} action={<span className="serif" style={{ fontSize: 30, fontWeight: 700, color: 'var(--aiv-azure)' }}>{quote.totalMonthly}</span>}><Table rows={quote.lines} rowKey="id" columns={[{ key: 'id', label: t('Item') }, { key: 'monthly', label: 'USD' }]} /><p className="small" style={{ marginTop: 8 }}>{t('Subtotal {s} · bundle discount {b}% · deployment {d}', { s: quote.subtotal, b: quote.bundleDiscountPct, d: quote.deploymentMode })}</p><p className="caption">{t('List prices of the packs catalog in USD per month; annual commitment saves 15%.')}</p></Card>}
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

// Groups and organizations (platform administrator): an organization can belong to a group
// (read-only views and benchmarking across the group) or stay independent.
function Tenancy() {
  const { t, lang, L, toast, me, reloadTree } = useApp();
  const groups = useData('/tenancy/groups');
  const tree = useData('/tenancy/tree');
  const verticals = useData('/catalog/verticals');
  const [g, setG] = useState(null); const [o, setO] = useState(null);
  const admin = me.user.isPlatformAdmin;
  const saveGroup = async () => { try { if (g.id) await api(`/tenancy/groups/${g.id}`, { method: 'PUT', body: g }); else await api('/tenancy/groups', { method: 'POST', body: g }); toast(t('Group saved.')); setG(null); groups.reload(); } catch (e) { toast(e.message, 'error'); } };
  const delGroup = async (x) => { if (!window.confirm(t('Delete group {n}?', { n: tx(x.name, lang) }))) return; try { await api(`/tenancy/groups/${x.id}`, { method: 'DELETE' }); groups.reload(); } catch (e) { toast(e.message, 'error'); } };
  const saveOrg = async () => {
    try {
      const body = { ...o, groupId: o.inGroup === 'yes' ? o.groupId : null };
      await api('/tenancy/orgs', { method: 'POST', body });
      toast(t('Organization {n} created with its administrator and default structure.', { n: o.name })); setO(null); tree.reload(); groups.reload(); reloadTree?.();
    } catch (e) { toast(e.message, 'error'); }
  };
  if (!admin) return <Card><p className="small">{t('Groups and organizations are created by the platform administrator (admin@dynamicms.example). Tenant administrators manage their own organization in Organization.')}</p></Card>;
  const allOrgs = [...(tree.data?.groups || []).flatMap(x => x.orgs.map(y => ({ ...y, group: tx(x.name, lang) }))), ...(tree.data?.independent || []).map(y => ({ ...y, group: '—' }))];
  return (
    <div className="stack">
      <Card title={t('Groups')} action={<button className="btn btn-primary btn-sm" onClick={() => setG({ name: '', description: '' })}><Plus size={16} />{t('New group')}</button>}>
        {groups.data ? <Table rows={groups.data} columns={[{ key: 'name', label: t('Group'), render: x => <span className="strong">{tx(x.name, lang)}</span> }, { key: 'description', label: t('Description'), render: x => tx(x.description, lang) }, { key: 'orgCount', label: t('Organizations'), width: 120 }, { key: 'act', label: '', sortable: false, render: x => <span className="row" style={{ gap: 4 }}><button className="btn btn-sm btn-ghost" onClick={() => setG({ id: x.id, name: tx(x.name, lang), description: tx(x.description, lang) })}>{t('Edit')}</button>{!x.orgCount && <button className="btn btn-sm btn-ghost" onClick={() => delGroup(x)}>{t('Delete')}</button>}</span> }]} /> : <Loading />}
      </Card>
      <Card title={t('Organizations')} action={<button className="btn btn-primary btn-sm" onClick={() => setO({ name: '', inGroup: 'no', groupId: groups.data?.[0]?.id || '', sector: 'UNI', size: 'SME', employees: 50, country: 'MA', city: '', lang: 'fr', emailDomain: '', adminName: '', adminEmail: '' })}><Plus size={16} />{t('New organization')}</button>}>
        {tree.data ? <Table rows={allOrgs} columns={[{ key: 'code', label: t('Code'), width: 100 }, { key: 'name', label: t('Organization'), render: x => <span className="strong">{tx(x.name, lang)}</span> }, { key: 'group', label: t('Group') }, { key: 'sector', label: t('Vertical') }, { key: 'size', label: t('Size'), render: x => L(x.size) }, { key: 'projects', label: t('Projects'), render: x => x.projects.length }]} maxRows={80} /> : <Loading />}
      </Card>
      {g && (
        <Modal title={g.id ? t('Edit group') : t('New group')} onClose={() => setG(null)} footer={<><button className="btn" onClick={() => setG(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!g.name} onClick={saveGroup}>{t('Save')}</button></>}>
          <div className="stack">
            <Field label={t('Name')} required>{(id) => <input id={id} className="input" value={g.name} onChange={e => setG({ ...g, name: e.target.value })} />}</Field>
            <Field label={t('Description')}>{(id) => <textarea id={id} className="textarea" value={g.description} onChange={e => setG({ ...g, description: e.target.value })} />}</Field>
          </div>
        </Modal>
      )}
      {o && (
        <Modal wide title={t('New organization')} onClose={() => setO(null)} footer={<><button className="btn" onClick={() => setO(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!o.name || !o.emailDomain || !o.adminEmail || (o.inGroup === 'yes' && !o.groupId)} onClick={saveOrg}>{t('Create organization')}</button></>}>
          <div className="stack">
            <Field label={t('Name')} required>{(id) => <input id={id} className="input" value={o.name} onChange={e => setO({ ...o, name: e.target.value })} />}</Field>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="strong small" style={{ marginBottom: 8 }}>{t('Part of a group?')}</legend>
              <div className="row"><label className="checkbox"><input type="radio" name="ing" checked={o.inGroup === 'no'} onChange={() => setO({ ...o, inGroup: 'no' })} /><span>{t('No — independent organization')}</span></label><label className="checkbox"><input type="radio" name="ing" checked={o.inGroup === 'yes'} onChange={() => setO({ ...o, inGroup: 'yes' })} /><span>{t('Yes — member of a group')}</span></label></div>
            </fieldset>
            {o.inGroup === 'yes' && <Field label={t('Group')} required>{(id) => <select id={id} className="select" value={o.groupId} onChange={e => setO({ ...o, groupId: e.target.value })}>{(groups.data || []).map(x => <option key={x.id} value={x.id}>{tx(x.name, lang)}</option>)}</select>}</Field>}
            <div className="form-grid">
              <Field label={t('Vertical')} required>{(id) => <select id={id} className="select" value={o.sector} onChange={e => setO({ ...o, sector: e.target.value })}><option value="UNI">{t('Universal (any sector)')}</option>{(verticals.data || []).filter(v => v.id !== 'SME').map(v => <option key={v.id} value={v.id}>{v.id} — {tx(v.name, lang)}</option>)}</select>}</Field>
              <Field label={t('Size')} required>{(id) => <select id={id} className="select" value={o.size} onChange={e => setO({ ...o, size: e.target.value })}><option value="SME">{L('SME')}</option><option value="Large">{t('Large company')}</option></select>}</Field>
              <Field label={t('Employees')}>{(id) => <input id={id} className="input num" type="number" value={o.employees} onChange={e => setO({ ...o, employees: e.target.value })} />}</Field>
              <Field label={t('Language')}>{(id) => <select id={id} className="select" value={o.lang} onChange={e => setO({ ...o, lang: e.target.value })}><option value="en">English</option><option value="fr">Français</option><option value="ar">العربية</option></select>}</Field>
              <Field label={t('Country (ISO code)')}>{(id) => <input id={id} className="input" value={o.country} onChange={e => setO({ ...o, country: e.target.value.toUpperCase().slice(0, 2) })} />}</Field>
              <Field label={t('City')}>{(id) => <input id={id} className="input" value={o.city} onChange={e => setO({ ...o, city: e.target.value })} />}</Field>
            </div>
            <Field label={t('E-mail domain')} required hint={t('Users of the organization sign in with name@domain.')}>{(id) => <input id={id} className="input" value={o.emailDomain} onChange={e => setO({ ...o, emailDomain: e.target.value.toLowerCase() })} placeholder="example.org" />}</Field>
            <div className="form-grid">
              <Field label={t('Administrator name')}>{(id) => <input id={id} className="input" value={o.adminName} onChange={e => setO({ ...o, adminName: e.target.value })} />}</Field>
              <Field label={t('Administrator e-mail')} required hint={t('Initial password: the demonstration password; to change at first sign-in.')}>{(id) => <input id={id} className="input" type="email" value={o.adminEmail} onChange={e => setO({ ...o, adminEmail: e.target.value })} />}</Field>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Large language models used by the AI use cases: standard providers and models, or a custom endpoint.
function Llm({ orgId }) {
  const { t, lang, toast } = useApp();
  const { data, reload } = useData(`/orgs/${orgId}/ai/llm`);
  const [f, setF] = useState(null); const [test, setTest] = useState(null);
  const ucs = useData(`/orgs/${orgId}/ai/usecases`);
  // The refetch after this form's own save keeps the text typed meanwhile; only the sent key is cleared.
  const keepDraft = useRef(false);
  useEffect(() => { if (!data) return; if (keepDraft.current) { keepDraft.current = false; return; } setF({ ...data.config, apiKey: '' }); }, [data]);
  if (!data || !f) return <Loading />;
  const prov = data.providers.find(p => p.id === f.provider) || data.providers[0];
  const edit = data.canEdit;
  const noTemp = prov.models.find(m => m.id === f.model)?.temperature === false || /^claude-(opus-5|sonnet-5|fable|mythos|opus-4-[78])|^(gpt-5|o\d)/i.test(f.model || '');
  const save = async () => { try { await api(`/orgs/${orgId}/ai/llm`, { method: 'PUT', body: f }); toast(t('AI model settings saved.')); const sent = f.apiKey; setF(cur => cur.apiKey === sent ? { ...cur, apiKey: '' } : cur); keepDraft.current = true; reload(); } catch (e) { toast(e.message, 'error'); } };
  const run = async () => { setTest(null); try { setTest(await api(`/orgs/${orgId}/ai/llm/test`, { method: 'POST' })); } catch (e) { setTest({ ok: false, message: e.message }); } };
  const setModel = async (uc, model) => { try { await api(`/ai/usecases/${uc.id}/model`, { method: 'PUT', body: { model } }); toast(t('Model of {c} updated.', { c: uc.code })); ucs.reload(); } catch (e) { toast(e.message, 'error'); } };
  return (
    <div className="grid-main">
      <div className="stack">
        <Card title={t('Language model for the AI use cases')} action={<IconBadge icon={Sparkles} accent={f.enabled} size="sm" />}>
          <div className="stack">
            <p className="small muted">{t('Choose a standard provider and model, or a custom model with an OpenAI-compatible API. Without a provider, the built-in engine (rules and retrieval on your data) answers. Every suggestion stays a suggestion until a person accepts it.')}</p>
            <div className="form-grid">
              <Field label={t('Provider')}>{(id) => <select id={id} className="select" disabled={!edit} value={f.provider} onChange={e => { const p = data.providers.find(x => x.id === e.target.value); setF({ ...f, provider: e.target.value, model: p.models[0]?.id || '', baseUrl: p.needsBaseUrl ? f.baseUrl : '' }); }}>{data.providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}</Field>
              <Field label={t('Model')}>{(id) => (prov.customModel || prov.kind === 'azure') ? <input id={id} className="input" disabled={!edit} value={f.model} onChange={e => setF({ ...f, model: e.target.value })} placeholder={prov.kind === 'azure' ? t('Deployment name') : t('Model name')} /> : <select id={id} className="select" disabled={!edit} value={f.model} onChange={e => setF({ ...f, model: e.target.value })}>{prov.models.map(m => <option key={m.id} value={m.id}>{m.name} ({m.id})</option>)}</select>}</Field>
            </div>
            {prov.needsBaseUrl && <Field label={t('Endpoint URL (HTTPS)')} required>{(id) => <input id={id} className="input" disabled={!edit} value={f.baseUrl} onChange={e => setF({ ...f, baseUrl: e.target.value })} placeholder={prov.kind === 'azure' ? 'https://my-resource.openai.azure.com' : 'https://llm.example.org/v1'} />}</Field>}
            {prov.kind !== 'builtin' && <Field label={t('API key')} hint={data.config.hasKey ? t('A key is stored ({h}); leave empty to keep it.', { h: data.config.keyHint }) : t('Stored encrypted; never shown again.')}>{(id) => <div className="row" style={{ gap: 8 }}><KeyRound size={16} aria-hidden="true" /><input id={id} className="input" type="password" autoComplete="off" disabled={!edit} value={f.apiKey} onChange={e => setF({ ...f, apiKey: e.target.value })} /></div>}</Field>}
            <div className="form-grid">
              <Field label={t('Temperature (0–1)')} hint={noTemp ? t('Not used: this model sets its own sampling.') : undefined}>{(id) => <input id={id} className="input num" type="number" step="0.1" min="0" max="1" disabled={!edit || noTemp} value={f.temperature} onChange={e => setF({ ...f, temperature: e.target.value })} />}</Field>
              <Field label={t('Maximum answer length (tokens)')}>{(id) => <input id={id} className="input num" type="number" min="100" max="4000" disabled={!edit} value={f.maxTokens} onChange={e => setF({ ...f, maxTokens: e.target.value })} />}</Field>
            </div>
            <label className="checkbox"><input type="checkbox" disabled={!edit || prov.kind === 'builtin'} checked={!!f.enabled && prov.kind !== 'builtin'} onChange={e => setF({ ...f, enabled: e.target.checked })} /><span>{t('Use this model for the AI use cases (the built-in engine stays the fallback)')}</span></label>
            <div className="row">{edit && <button className="btn btn-primary" onClick={save}>{t('Save')}</button>}<button className="btn" onClick={run}>{t('Test the connection')}</button>{test && <span className={`tag ${test.ok ? 's5' : 's1'}`}>{test.message}</span>}</div>
          </div>
        </Card>
      </div>
      <Card title={t('Model per AI use case')}>
        <p className="small muted">{t('By default every use case uses the organization model; a use case can use another model of the same provider.')}</p>
        {ucs.data ? <Table rows={ucs.data.items} maxRows={60} columns={[{ key: 'code', label: t('Code'), width: 110 }, { key: 'name', label: t('Use case'), render: u => tx(u.name, lang) }, { key: 'linked_step', label: t('Step'), render: u => (u.linked_step ? `${u.linked_step} (${tx(u.step_name, lang) || ''})` : '—') }, { key: 'model', label: t('Model'), sortable: false, render: u => <select className="select" aria-label={t('Model')} disabled={!edit || prov.kind === 'builtin'} value={u.model || ''} onChange={e => setModel(u, e.target.value || null)}><option value="">{t('Organization default')}</option>{prov.models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select> }]} /> : <Loading />}
      </Card>
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
    ...(me.user.isPlatformAdmin || can('tenancy.manage') ? [{ id: 'tenancy', label: t('Groups and organizations') }] : []),
    ...(can('ai.view') ? [{ id: 'llm', label: t('AI models') }] : []),
    { id: 'ops', label: t('Operations') },
  ];
  const wanted = new URLSearchParams(window.location.search).get('tab');
  const [tab, setTab] = useState(tabs.some(x => x.id === wanted) ? wanted : tabs[0]?.id);
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
      {tab === 'tenancy' && <Tenancy />}
      {tab === 'llm' && orgId && <Llm orgId={orgId} />}
    </>
  );
}
