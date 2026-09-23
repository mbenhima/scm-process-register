import { useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { PageHeader, Card, CardHead, DataTable, useFetch, Skeleton } from '../components/ui.jsx';

export default function DataModel() {
  const { t } = useI18n();
  const { data } = useFetch('/reference/data-model');
  const [sel, setSel] = useState(null);
  if (!data) return <div className="page"><Skeleton h={500} /></div>;
  const cls = sel || data.classes[0];
  return (
    <div className="page">
      <PageHeader eyebrow={t('Reports · D09 and D10')} title={t('Data model')} subtitle={t('{c} object classes and {a} attributes with data types and validation rules.', { c: data.classes.length, a: data.attributes.length })} />
      <div className="grid two">
        <Card><DataTable csvName="object_classes" rows={data.classes} pageSize={60} onRowClick={setSel} columns={[
          { key: 'Object_Class_ID', label: t('ID') }, { key: 'Class_Name', label: t('Class'), render: (c) => <><div className="strong">{t(c.Class_Name)}</div><div className="xs muted">{t(c.Description)}</div></> },
          { key: 'Parent_Class', label: t('Parent') }, { key: 'Related_Macro_Process_IDs', label: t('Macro processes'), render: (c) => <span className="xs">{c.Related_Macro_Process_IDs}</span> },
        ]} /></Card>
        <Card><CardHead title={`${cls.Object_Class_ID} ${t(cls.Class_Name)}`} subtitle={t(cls.Description)} />
          <DataTable csvName={`attributes_${cls.Object_Class_ID}`} filterable={false} rows={data.attributes.filter((a) => a.Object_Class_ID === cls.Object_Class_ID)} columns={[
            { key: 'Attribute_ID', label: t('ID') }, { key: 'Attribute_Name', label: t('Attribute') }, { key: 'Data_Type', label: t('Type') }, { key: 'Required', label: t('Required') },
            { key: 'Validation_Rule', label: t('Validation rule'), render: (a) => <span className="xs">{t(a.Validation_Rule)}</span> },
          ]} /></Card>
      </div>
    </div>
  );
}
