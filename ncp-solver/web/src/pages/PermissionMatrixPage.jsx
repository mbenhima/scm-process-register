import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, EmptyState } from '../components/ui.jsx';

export default function PermissionMatrixPage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const [data, setData] = useState(null);
  const [dirty, setDirty] = useState({});

  function load() { api.get('/roles/permissions/matrix').then(setData).catch(() => {}); }
  useEffect(load, []);

  if (!data) return <EmptyState message={t('common.loading')} />;

  const modules = [...new Set(data.permissions.map((p) => p.module))];

  function isChecked(roleId, code) {
    if (dirty[roleId]?.has(code) !== undefined) return dirty[roleId].has(code);
    return data.matrix[roleId]?.includes(code);
  }
  function toggle(roleId, code) {
    setDirty((d) => {
      const current = new Set(d[roleId] || data.matrix[roleId] || []);
      current.has(code) ? current.delete(code) : current.add(code);
      return { ...d, [roleId]: current };
    });
  }
  async function saveRole(roleId) {
    const codes = Array.from(dirty[roleId] || data.matrix[roleId] || []);
    await api.put(`/roles/${roleId}/permissions`, { codes });
    setDirty((d) => { const c = { ...d }; delete c[roleId]; return c; });
    load();
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="eyebrow">{t('nav.permissionMatrix')}</div>
        <h1 className="font-title font-bold text-2xl text-grey-dark">{t('permissions.title')}</h1>
        <p className="text-sm text-grey-ink italic">{t('permissions.subtitle')}</p>
      </div>

      {modules.map((mod) => (
        <Card key={mod} title={mod}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-start py-1 pe-3 text-xs text-grey-medium uppercase">Permission</th>
                  {data.roles.map((r) => <th key={r.id} className="px-2 py-1 text-xs text-grey-medium whitespace-nowrap">{r.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.permissions.filter((p) => p.module === mod).map((p) => (
                  <tr key={p.id} className="border-t border-grey-line">
                    <td className="py-1.5 pe-3 text-grey-ink">{p.code}</td>
                    {data.roles.map((r) => (
                      <td key={r.id} className="text-center px-2">
                        <input
                          type="checkbox"
                          disabled={!hasPermission('role.managePermissions') || r.is_system_role && r.code === 'admin'}
                          checked={isChecked(r.id, p.code)}
                          onChange={() => toggle(r.id, p.code)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      {hasPermission('role.managePermissions') && Object.keys(dirty).length > 0 && (
        <div className="fixed bottom-4 end-4 flex gap-2">
          {Object.keys(dirty).map((roleId) => {
            const role = data.roles.find((r) => r.id === roleId);
            return (
              <button key={roleId} onClick={() => saveRole(roleId)} className="btn-primary">
                {t('common.save')} — {role?.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
