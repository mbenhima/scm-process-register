import { useMemo, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { get, post, put, del } from '../lib/api.js';
import { PageHead, Card, Guard, DataTable, StatusPill, Btn, Icon, useAction, Modal, Field, Kpi, KV, JustifyDialog, Seg, Progress } from '../components/ui.jsx';
import { RecordsView } from '../components/Records.jsx';

export function Users() {
  const { t, L, fmtDate } = useI18n(); const d = useData('/users'); const roles = useData('/roles'); const act = useAction(); const [edit, setEdit] = useState(null);
  const rn = id => L(roles.data?.find(r => r.id === id)?.name) || id;
  const save = async () => { const b = { ...edit }; if (edit.id) await act(() => put('/users/' + edit.id, b)); else await act(() => post('/users', b)); setEdit(null); d.reload(); };
  return (<><PageHead eyebrow={t('navGroup.admin')} title={t('nav.users')} subtitle={t('users.subtitle')}><Btn kind="primary" icon="UserPlus" onClick={() => setEdit({ name: '', email: '', password: '', roles: ['R-12'], title: '' })}>{t('users.new')}</Btn></PageHead>
    <Guard state={d}>{rows => <DataTable csvName="users" rows={rows} onRow={u => setEdit({ ...u, password: '' })} columns={[{ key: 'name', label: t('col.name') }, { key: 'email', label: t('login.email') }, { key: 'title', label: t('users.title') }, { key: 'roles', label: t('users.roles'), text: u => u.roles.map(rn).join(', ') }, { key: 'active', label: t('col.status'), render: u => <StatusPill value={u.active ? 'Active' : 'Retired'} /> }, { key: 'last_login', label: t('users.lastLogin'), text: u => fmtDate(u.last_login) }]} />}</Guard>
    {edit && <Modal title={edit.id ? edit.name : t('users.new')} onClose={() => setEdit(null)} footer={<><Btn onClick={() => setEdit(null)}>{t('common.cancel')}</Btn><Btn kind="primary" onClick={save}>{t('common.save')}</Btn></>}><div className="form-grid">
      <Field label={t('col.name')} id="un"><input id="un" className="input" value={edit.name} onChange={e => setEdit(x => ({ ...x, name: e.target.value }))} /></Field>
      <Field label={t('login.email')} id="ue"><input id="ue" className="input" disabled={!!edit.id} value={edit.email} onChange={e => setEdit(x => ({ ...x, email: e.target.value }))} /></Field>
      <Field label={t('users.title')} id="ut"><input id="ut" className="input" value={edit.title || ''} onChange={e => setEdit(x => ({ ...x, title: e.target.value }))} /></Field>
      <Field label={t('login.password')} id="up" hint={edit.id ? t('users.pwKeep') : ''}><input id="up" type="password" className="input" value={edit.password} onChange={e => setEdit(x => ({ ...x, password: e.target.value }))} /></Field>
      {edit.id && <label className="check"><input type="checkbox" checked={!!edit.active} onChange={e => setEdit(x => ({ ...x, active: e.target.checked }))} />{t('users.active')}</label>}
      <div className="field" style={{ gridColumn: '1 / -1' }}><span className="label">{t('users.roles')}</span><div className="grid g-3">{(roles.data || []).map(r => <label key={r.id} className="check"><input type="checkbox" checked={edit.roles.includes(r.id)} onChange={e => setEdit(x => ({ ...x, roles: e.target.checked ? [...x.roles, r.id] : x.roles.filter(y => y !== r.id) }))} />{L(r.name)}</label>)}</div></div></div></Modal>}</>);
}

export function Permissions() {
  const { t, L } = useI18n(); const d = useData('/permissions/matrix'); const act = useAction(); const [mod, setMod] = useState('platform'); const [role, setRole] = useState(null);
  return (<><PageHead eyebrow={t('navGroup.admin')} title={t('nav.permissions')} subtitle={t('perm.subtitle')}>{role && <Btn icon="RotateCcw" onClick={async () => { await act(() => post('/permissions/matrix/reset', { role_id: role })); d.reload(); }}>{t('perm.reset')}</Btn>}</PageHead>
    <Guard state={d}>{x => { const g = new Map(x.grants.map(r => [r.role_id + '|' + r.code, r])); const mods = [...new Set(x.permissions.map(p => p.module))];
      const perms = x.permissions.filter(p => (mod === 'platform' ? !/^M\d\d$/.test(p.module) : p.module === mod)); const roles = role ? x.roles.filter(r => r.id === role) : x.roles;
      return (<><div className="row" style={{ marginBottom: 'var(--sp-3)' }}><select className="input" style={{ maxWidth: 280 }} value={mod} onChange={e => setMod(e.target.value)} aria-label={t('perm.module')}><option value="platform">{t('perm.platform')}</option>{mods.filter(m => /^M\d\d$/.test(m)).map(m => <option key={m} value={m}>{m}</option>)}</select>
        <select className="input" style={{ maxWidth: 320 }} value={role || ''} onChange={e => setRole(e.target.value || null)} aria-label={t('perm.role')}><option value="">{t('perm.allRoles')}</option>{x.roles.map(r => <option key={r.id} value={r.id}>{r.id} {L(r.name)}</option>)}</select></div>
        <div className="table-wrap" style={{ maxHeight: '68vh' }}><table className="tbl"><thead><tr><th className="sticky-col">{t('perm.permission')}</th>{roles.map(r => <th key={r.id} title={L(r.name)} style={{ fontSize: 11 }}>{r.id}</th>)}</tr></thead>
          <tbody>{perms.map(p => <tr key={p.code}><td className="sticky-col"><code className="small">{p.code}</code></td>{roles.map(r => { const c = g.get(r.id + '|' + p.code); return <td key={r.id} style={{ textAlign: 'center' }}><input type="checkbox" aria-label={`${r.id} ${p.code}`} checked={!!c?.granted} onChange={async e => { await act(() => put('/permissions/matrix', { role_id: r.id, code: p.code, granted: e.target.checked }), null); d.reload(); }} />{c?.customized ? <span title={t('perm.customized')}>•</span> : null}</td>; })}</tr>)}</tbody></table></div>
        <p className="caption">{t('perm.caption')}</p></>); }}</Guard></>);
}

export function Configuration() {
  const { t, L, fmtDate } = useI18n(); const { reload, can } = useSession(); const d = useData('/config'); const lic = useData('/licence'); const act = useAction(); const [disc, setDisc] = useState(null); const [pack, setPack] = useState(null); const fileRef = useRef(null);
  const canManage = can('config.manage');
  const upload = async f => { const text = await f.text(); let licence; try { licence = JSON.parse(text); if (Array.isArray(licence)) licence = licence[0]; } catch { return; } await act(() => post('/licence/upload', { licence })); lic.reload(); };
  return (<><PageHead eyebrow={t('navGroup.admin')} title={t('nav.configuration')} subtitle={t('config.subtitle')} />
    <Guard state={d}>{x => <><div className="grid g-4">
      <Kpi icon="Package" value={x.pack?.id} label={L(x.pack?.name)} note={t('config.kind.' + x.pack?.kind)} />
      <Kpi icon="Blocks" emph={false} value={x.modules.length} label={t('config.modules')} />
      <Kpi icon="Sparkles" emph={false} small value={t('config.ai.' + x.aiTier)} label={t('config.aiTier')} />
      <Kpi icon="KeyRound" emph={false} value={lic.data ? t('licence.' + lic.data.status) : '—'} label={t('config.licence')} note={lic.data ? t('licence.days', { n: lic.data.daysLeft }) : ''} /></div>
      <div className="grid split" style={{ marginTop: 'var(--sp-4)' }}><Card title={t('config.quotas')}><DataTable search={false} rows={Object.keys(x.usage).map(k => ({ id: k, k, u: x.usage[k], q: x.quotas[k] }))} columns={[{ key: 'k', label: t('col.dimension'), text: r => t('quota.' + r.k) }, { key: 'u', label: t('col.used'), num: true }, { key: 'q', label: t('col.limit'), num: true, text: r => r.q == null ? '∞' : r.q },
        { key: 'bar', label: '', noSort: true, render: r => r.q ? <div className="row" style={{ flexWrap: 'nowrap' }}><Progress value={(r.u * 100) / r.q} />{r.u >= r.q && <span className="pill s1 xs">{t('config.atLimit')}</span>}</div> : null }]} /></Card>
        <Card title={t('config.licenceTitle')} actions={canManage && <><input ref={fileRef} type="file" accept=".lic,.json" hidden onChange={e => e.target.files[0] && upload(e.target.files[0])} /><Btn size="sm" icon="Upload" onClick={() => fileRef.current.click()}>{t('config.uploadLicence')}</Btn></>}>
          {lic.data && <KV items={[[t('config.mode'), lic.data.mode.toUpperCase()], [t('col.status'), <StatusPill value={lic.data.status === 'active' ? 'Active' : lic.data.status === 'warning' ? 'Expiring' : 'Expired'} />], [t('config.plan'), lic.data.licence?.plan], [t('config.maxUsers'), lic.data.licence?.maxUsers], [t('config.expiry'), fmtDate(lic.data.licence?.expiryDate)], [t('config.addons'), lic.data.activeAddOns.join(', ') || '—'], [t('config.canCreateUser'), lic.data.canCreateUser ? t('common.yes') : t('common.no')]]} />}
          <p className="caption">{t('config.licenceNote')}</p></Card></div>
      <h2 className="section-title">{t('config.packs')}</h2><DataTable rows={x.catalog.packs} columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: t('col.name'), text: p => L(p.name) }, { key: 'kind', label: t('col.type'), text: p => t('config.kind.' + p.kind) }, { key: 'price', label: t('config.price'), num: true, text: p => `$${p.price}` }, { key: 'includedUsers', label: t('config.included'), num: true }, { key: 'aiTier', label: t('config.aiTier'), text: p => t('config.ai.' + p.aiTier) },
        { key: 'sel', label: '', noSort: true, render: p => p.id === x.pack?.id ? <span className="pill s4">{t('config.current')}</span> : canManage && <Btn size="sm" onClick={() => setPack(p)}>{t('config.switch')}</Btn> }]} />
      <h2 className="section-title">{t('config.addOns')}</h2><div className="grid g-3">{x.catalog.addOns.map(a => { const on = x.config.addons.includes(a.id) || x.pack?.includedAddons?.includes(a.id); return <Card key={a.id} title={`${a.id} · ${L(a.name)}`} actions={<span className="pill">${a.price}</span>}><p className="small">{L(a.goals)}</p>
        <label className="check"><input type="checkbox" disabled={!canManage} checked={on} onChange={async e => { await act(() => put('/config/addon', { id: a.id, active: e.target.checked })); d.reload(); reload(); }} />{on ? t('config.active') : t('config.inactive')}</label></Card>; })}</div>
      <h2 className="section-title">{t('config.compliance')}</h2><p className="notice grey small"><Icon name="Info" />{t('disclosure.nonCertification')}</p>
      <div className="grid g-3" style={{ marginTop: 'var(--sp-3)' }}>{x.catalog.compliance.map(c => { const on = x.config.compliance.includes(c.id); return <Card key={c.id} title={c.name}><p className="small muted">{t('config.controlsSeeded', { n: c.controls.length })}</p>
        <label className="check"><input type="checkbox" disabled={!canManage} checked={on} onChange={async e => { if (e.target.checked) setDisc(c); else { await act(() => put('/config/compliance', { id: c.id, active: false })); d.reload(); } }} />{on ? t('config.active') : t('config.inactive')}</label></Card>; })}</div>
      {disc && <Modal title={disc.name} onClose={() => setDisc(null)} footer={<><Btn onClick={() => setDisc(null)}>{t('common.cancel')}</Btn><Btn kind="primary" onClick={async () => { const c = disc; setDisc(null); await act(() => put('/config/compliance', { id: c.id, active: true, disclosureAccepted: true })); d.reload(); reload(); }}>{t('config.understood')}</Btn></>}><div className="notice"><Icon name="TriangleAlert" /><p>{t('disclosure.nonCertification')}</p></div></Modal>}
      {pack && <JustifyDialog title={t('config.switchTo', { p: L(pack.name) })} onCancel={() => setPack(null)} onConfirm={async n => { const p = pack; setPack(null); const r = await act(() => put('/config/pack', { pack_id: p.id, _justification: n })); d.reload(); reload(); }} extra={<p className="small">{t('config.proration')}</p>} />}
    </>}</Guard></>);
}

export function Pricing() {
  const { t, L } = useI18n(); const d = useData('/config'); const [q, setQ] = useState({ pack: 'PK-01', users: 150 }); const quote = useData(`/pricing/quote?pack=${q.pack}&users=${q.users}`, [q.pack, q.users]);
  return (<><PageHead eyebrow={t('navGroup.admin')} title={t('nav.pricing')} subtitle={t('pricing.subtitle')} />
    <Guard state={d}>{x => <><div className="grid split"><Card title={t('pricing.calculator')}><div className="form-grid"><Field label={t('config.packs')} id="qp"><select id="qp" className="input" value={q.pack} onChange={e => setQ(v => ({ ...v, pack: e.target.value }))}>{x.catalog.packs.map(p => <option key={p.id} value={p.id}>{p.id} · {L(p.name)}</option>)}</select></Field>
        <Field label={t('pricing.users')} id="qu"><input id="qu" className="input" type="number" min="1" value={q.users} onChange={e => setQ(v => ({ ...v, users: Number(e.target.value) }))} /></Field></div>
        {quote.data && <div className="card tint" style={{ marginTop: 'var(--sp-4)' }}><div className="kpi-value">${quote.data.total}</div><div className="kpi-label">{t('pricing.perMonth')} · {t('pricing.base', { b: quote.data.base })} · {t('pricing.overage', { o: quote.data.overage })}</div><p className="xs" style={{ marginTop: 8 }}>{L(quote.data.explanation)}</p></div>}</Card>
        <Card title={t('pricing.rules')}>{x.catalog.rules.map(r => <p key={r.id} className="small"><span className="strong">{L(r.rule)}</span> — {L(r.description)}</p>)}</Card></div>
      <h2 className="section-title">{t('pricing.bundles')}</h2><DataTable search={false} rows={x.catalog.bundles} columns={[{ key: 'name', label: t('col.name'), text: b => L(b.name) }, { key: 'packsText', label: t('config.packs') }, { key: 'discount', label: t('pricing.discount'), num: true, text: b => b.discount + '%' }, { key: 'list', label: t('pricing.list'), num: true, text: b => '$' + b.list }, { key: 'price', label: t('pricing.bundlePrice'), num: true, text: b => '$' + b.price }]} />
      <h2 className="section-title">{t('pricing.packs')}</h2><RecordsView entity="Pack" canCreate /></>}</Guard></>);
}

export function Integrations() {
  const { t, L, fmtDate } = useI18n(); const d = useData('/config'); const log = useData('/integrations/log'); const act = useAction(); const recs = useData('/records/ExternalIntegration');
  return (<><PageHead eyebrow={t('navGroup.admin')} title={t('nav.integrations')} subtitle={t('int.subtitle')} />
    <Guard state={recs}>{x => <DataTable search={false} rows={x.items} columns={[{ key: 'label', label: t('col.name'), text: r => L(r.label) }, { key: 'integration_code', label: 'ID' }, { key: 'enabled', label: t('col.status'), render: r => <StatusPill value={r.enabled ? 'Active' : 'Retired'} /> }, { key: 'last_health_status', label: t('int.health'), render: r => <StatusPill value={r.last_health === 'success' || r.last_health_status === 'Success' ? 'Green' : 'Red'} /> },
      { key: 'cred', label: t('int.credential'), text: r => r.credential_ref ? t('int.stored') : t('int.missing') }, { key: 'act', label: '', noSort: true, render: r => <Btn size="sm" icon="Activity" onClick={async () => { await act(() => post(`/integrations/${r.id}/health`), 'int.checked'); recs.reload(); log.reload(); }}>{t('int.check')}</Btn> }]} />}</Guard>
    <h2 className="section-title">{t('int.catalog')}</h2><Guard state={d}>{x => <div className="grid g-3">{x.catalog.integrations.map(i => <Card key={i.id} title={`${i.id} · ${L(i.name)}`}><p className="xs muted">{L(i.family)}</p><p className="small">{L(i.goals)}</p><p className="xs"><span className="strong">{t('int.examples')}:</span> {i.examples}</p><p className="xs muted">{i.packs.join(' · ')}</p></Card>)}</div>}</Guard>
    <h2 className="section-title">{t('int.registry')}</h2><RecordsView entity="ExternalIntegration" />
    <h2 className="section-title">{t('int.webhooks')}</h2><RecordsView entity="Webhook" />
    <h2 className="section-title">{t('int.log')}</h2><Guard state={log}>{rows => <DataTable search={false} rows={rows} columns={[{ key: 'created_at', label: t('col.date'), text: r => fmtDate(r.created_at) }, { key: 'direction', label: t('int.direction') }, { key: 'record', label: t('int.record') }, { key: 'result', label: t('int.result') }]} />}</Guard></>);
}

export function Onboarding() {
  const { t, L } = useI18n(); const act = useAction(); const [csv, setCsv] = useState('name*,email*,position\nAmina Tazi,amina@example.ma,Operator\nHassan Idrissi,,Supervisor\nLina Ouazzani,lina@example.ma,Technician'); const [res, setRes] = useState(null); const [entity, setEntity] = useState('Employee');
  return (<><PageHead eyebrow={t('navGroup.admin')} title={t('nav.onboarding')} subtitle={t('onb.subtitle')} />
    <RecordsView entity="OnboardingPlan" />
    <div className="grid split" style={{ marginTop: 'var(--sp-4)' }}><Card title={t('onb.import')}><Field label={t('onb.entity')} id="oe"><select id="oe" className="input" value={entity} onChange={e => setEntity(e.target.value)}>{['Employee', 'Stakeholder', 'TrainingDemand', 'Competency'].map(x => <option key={x} value={x}>{t('entity.' + x)}</option>)}</select></Field>
      <Field label={t('onb.csv')} id="oc" hint={t('onb.csvHint')}><textarea id="oc" className="input" rows={8} value={csv} onChange={e => setCsv(e.target.value)} style={{ fontFamily: 'monospace' }} /></Field>
      <div className="row" style={{ marginTop: 'var(--sp-3)' }}><Btn onClick={async () => setRes(await act(() => post('/onboarding/import', { entity, csv }), null))}>{t('onb.validate')}</Btn><Btn kind="primary" disabled={!res || !res.accepted} onClick={async () => setRes(await act(() => post('/onboarding/import', { entity, csv, commit: true }), 'onb.committed'))}>{t('onb.commit')}</Btn></div></Card>
      <Card title={t('onb.result')}>{res ? <><p className="strong">{t('onb.accepted', { n: res.accepted })}</p>{res.rejected.map((r, i) => <p key={i} className="small"><span className="pill s1">{t('onb.line', { n: r.line })}</span> {r.reason}</p>)}{res.committed && <p className="pill s4">{t('onb.committed')}</p>}</> : <p className="muted">{t('onb.none')}</p>}</Card></div></>);
}

export function Audit() {
  const { t, fmtDate } = useI18n(); const [ent, setEnt] = useState(''); const d = useData('/audit' + (ent ? '?entity=' + ent : ''), [ent]);
  return (<><PageHead eyebrow={t('navGroup.admin')} title={t('nav.audit')} subtitle={t('audit.subtitle')}><input className="input" style={{ width: 220 }} placeholder={t('audit.entity')} value={ent} onChange={e => setEnt(e.target.value)} aria-label={t('audit.entity')} /></PageHead>
    <Guard state={d}>{rows => <DataTable csvName="audit_log" rows={rows} columns={[{ key: 'created_at', label: t('col.date'), text: r => new Date(r.created_at).toLocaleString(), sortValue: r => r.created_at }, { key: 'user_name', label: t('col.user') }, { key: 'entity', label: t('audit.entityCol') }, { key: 'action', label: t('audit.action') },
      { key: 'after', label: t('audit.after'), text: r => r.after_val ? JSON.stringify(r.after_val).slice(0, 120) : '—' }, { key: 'justification', label: t('col.justification'), text: r => r.justification || '—' }]} />}</Guard><p className="caption">{t('audit.readonly')}</p></>);
}

export function Backups() {
  const { t, fmtDate, fmtNum } = useI18n(); const d = useData('/backups'); const act = useAction(); const h = useData('/health');
  return (<><PageHead eyebrow={t('navGroup.admin')} title={t('nav.backups')} subtitle={t('backups.subtitle')}><Btn kind="primary" icon="DatabaseBackup" onClick={async () => { await act(() => post('/backups'), 'backups.done'); d.reload(); }}>{t('backups.now')}</Btn></PageHead>
    {h.data && <div className="notice grey" style={{ marginBottom: 'var(--sp-4)' }}><Icon name="HeartPulse" />{t('backups.health', { status: h.data.status, mode: h.data.mode })}</div>}
    <Guard state={d}>{x => <><p className="small">{t('backups.retention', { n: x.retentionDays })}</p><DataTable search={false} rows={x.items} columns={[{ key: 'file', label: t('backups.file') }, { key: 'kind', label: t('col.type') }, { key: 'size', label: t('backups.size'), num: true, text: b => fmtNum(Math.round(b.size / 1024)) + ' KB' }, { key: 'created_at', label: t('col.date'), text: b => fmtDate(b.created_at) }, { key: 'expires_at', label: t('backups.expires'), text: b => fmtDate(b.expires_at) }]} /></>}</Guard>
    <Card title={t('backups.restore')} className=""><ol className="small"><li>{t('backups.r1')}</li><li>{t('backups.r2')}</li><li>{t('backups.r3')}</li></ol></Card></>);
}

export function Traceability() {
  const { t, L } = useI18n(); const d = useData('/traceability'); const [f, setF] = useState('all');
  return (<><PageHead eyebrow={t('navGroup.admin')} title={t('nav.traceability')} subtitle={t('trace.subtitle')}><Seg value={f} onChange={setF} options={['all', 'Met', 'Partial', 'Deployment responsibility'].map(x => ({ id: x, label: x === 'all' ? t('common.all') : t('status.' + x) }))} label={t('col.status')} /></PageHead>
    <Guard state={d}>{rows => { const c = s => rows.filter(r => r.status === s).length; return <><div className="grid g-3" style={{ marginBottom: 'var(--sp-4)' }}><Kpi icon="CheckCheck" value={c('Met')} label={t('status.Met')} note={t('trace.of', { n: rows.length })} /><Kpi icon="CircleDashed" emph={false} value={c('Partial')} label={t('status.Partial')} /><Kpi icon="Server" emph={false} value={c('Deployment responsibility')} label={t('status.Deployment responsibility')} /></div>
      <DataTable csvName="traceability" rows={rows.filter(r => f === 'all' || r.status === f)} columns={[{ key: 'id', label: 'ID' }, { key: 'section', label: t('trace.section') }, { key: 'text', label: t('trace.requirement'), text: r => L(r.text) }, { key: 'status', label: t('col.status'), render: r => <StatusPill value={r.status} />, text: r => r.status }, { key: 'evidence', label: t('trace.evidence'), text: r => L(r.evidence) }]} /></>; }}</Guard></>);
}
