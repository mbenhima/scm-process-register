import { useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { PageHeader, Card, DataTable, useFetch, Skeleton, Select, Badge } from '../components/ui.jsx';

export default function RoleMenus() {
  const { t } = useI18n();
  const { data } = useFetch('/reference/role-menus');
  const [role, setRole] = useState('R03');
  if (!data) return <div className="page"><Skeleton h={500} /></div>;
  const roles = [...new Map(data.map((r) => [r.Role_ID, r.Role_Name])).entries()];
  const rows = data.filter((r) => r.Role_ID === role);
  return (
    <div className="page">
      <PageHeader eyebrow={t('Reports · D15b')} title={t('Role menus')} subtitle={t('The reference menu of each of the 21 roles: sections, items, access level and the steps performed from each item.')} />
      <Card>
        <DataTable csvName={`role_menu_${role}`} rows={rows} pageSize={40}
          toolbar={<Select aria-label={t('Role')} value={role} onChange={(e) => setRole(e.target.value)} options={roles.map(([id, name]) => ({ value: id, label: `${id} ${t(name)}` }))} style={{ width: 'auto' }} />}
          columns={[
            { key: 'Menu_Order', label: '#' }, { key: 'Menu_Section', label: t('Section'), render: (r) => t(r.Menu_Section) },
            { key: 'Menu_Item', label: t('Menu item'), render: (r) => <><div className="strong">{t(r.Menu_Item)}</div><div className="xs muted">{t(r.Screen_Description)}</div></> },
            { key: 'Item_Type', label: t('Type'), render: (r) => t(r.Item_Type) }, { key: 'Access_Level', label: t('Access'), render: (r) => <Badge>{t(r.Access_Level)}</Badge> },
            { key: 'Required_Module_ID', label: t('Module') }, { key: 'Visibility_Condition', label: t('Visibility'), render: (r) => <span className="xs">{t(r.Visibility_Condition)}</span> },
          ]} />
      </Card>
    </div>
  );
}
