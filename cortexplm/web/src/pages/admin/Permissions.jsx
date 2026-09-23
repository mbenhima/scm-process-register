import { useState } from 'react';
import { useAuth } from '../../lib/auth.jsx';
import { useI18n } from '../../lib/i18n.jsx';
import { put } from '../../lib/api.js';
import { PageHeader, Card, useFetch, Skeleton, useToast, Select } from '../../components/ui.jsx';

export default function Permissions() {
  const { t } = useI18n();
  const { can, refresh } = useAuth();
  const toast = useToast();
  const { data, setData } = useFetch('/permission-matrix');
  const [mod, setMod] = useState('');
  if (!data) return <div className="page"><Skeleton h={500} /></div>;
  const editable = can('permission.manage');
  const granted = new Set(data.grants);
  const toggle = async (role, code, on) => {
    try {
      await put('/permission-matrix', { role_id: role, permission_code: code, granted: on });
      setData((d) => ({ ...d, grants: on ? [...d.grants, `${role}|${code}`] : d.grants.filter((g) => g !== `${role}|${code}`) }));
      refresh();
    } catch (e) { toast.err(e); }
  };
  const perms = data.permissions.filter((p) => !mod || p.module === mod);
  return (
    <div className="page">
      <PageHeader eyebrow={t('Administration')} title={t('Permission matrix')} subtitle={t('{p} permissions × {r} roles. A change takes effect immediately for every user, without a restart.', { p: data.permissions.length, r: data.roles.length })}
        actions={<Select aria-label={t('Module')} value={mod} onChange={(e) => setMod(e.target.value)} placeholder={t('All modules')} options={[...new Set(data.permissions.map((p) => p.module))].map((m) => ({ value: m, label: t(m) }))} style={{ width: 'auto' }} />} />
      <Card className="flush">
        <div className="table-wrap" style={{ maxHeight: '75vh', border: 0 }}>
          <table className="matrix sticky-first">
            <thead><tr><th className="left">{t('Permission')}</th>{data.roles.map((r) => <th key={r.id} title={t(r.name)}>{r.id}</th>)}</tr></thead>
            <tbody>{perms.map((p) => (
              <tr key={p.code}>
                <td className="left"><div className="strong">{p.code}</div><div className="xs muted">{t(p.description)}</div></td>
                {data.roles.map((r) => (
                  <td key={r.id}><input type="checkbox" aria-label={`${r.name}: ${p.code}`} checked={granted.has(`${r.id}|${p.code}`)} disabled={!editable} onChange={(e) => toggle(r.id, p.code, e.target.checked)} style={{ accentColor: 'var(--pa-orange-deep)', width: 16, height: 16 }} /></td>
                ))}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8, marginTop: 16 }}>
        {data.roles.map((r) => <div key={r.id} className="xs"><strong className="strong">{r.id}</strong> {t(r.name)} · <span className="muted">{t(r.baseline_class)}</span></div>)}
      </div>
    </div>
  );
}
