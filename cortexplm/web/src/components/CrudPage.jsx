import { useState } from 'react';
import { Plus, Trash2, RotateCcw } from 'lucide-react';
import { useI18n } from '../lib/i18n.jsx';
import { get, post, put, del } from '../lib/api.js';
import VersionCompare from './VersionCompare.jsx';
import { Card, DataTable, Modal, Field, Input, Textarea, Select, Button, useFetch, Skeleton, ErrorNote, useToast, JustifyModal, Tabs, Badge, fmtDate } from './ui.jsx';

export function FormFields({ fields, value, onChange, disabled }) {
  const { t } = useI18n();
  return (
    <div className="form-grid">
      {fields.map((f) => {
        const v = value[f.key] ?? '';
        const set = (e) => onChange({ ...value, [f.key]: f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value });
        return (
          <Field key={f.key} label={t(f.label)} required={f.required} hint={f.hint ? t(f.hint) : null} full={f.full || f.type === 'textarea'}>
            {f.type === 'select' ? <Select value={v} onChange={set} disabled={disabled} placeholder={f.required ? undefined : t('None')} options={f.options.map((o) => (typeof o === 'object' ? o : { value: o, label: t(o) }))} />
              : f.type === 'textarea' ? <Textarea value={v} onChange={set} disabled={disabled} rows={f.rows || 3} />
                : <Input type={f.type || 'text'} min={f.min} max={f.max} value={v} onChange={set} disabled={disabled} />}
          </Field>
        );
      })}
    </div>
  );
}

function Versions({ endpoint, id, onReverted }) {
  const { t } = useI18n();
  const toast = useToast();
  const { data } = useFetch(`${endpoint}/${id}`);
  if (!data) return <Skeleton h={120} />;
  return (
    <>
    <DataTable filterable={false} rows={data.versions || []} columns={[
      { key: 'version', label: t('Version'), num: true }, { key: 'created_at', label: t('Date'), render: (v) => fmtDate(v.created_at) }, { key: 'user_name', label: t('By') },
      { key: 'justification', label: t('Justification') },
      { key: 'is_current', label: '', sortable: false, render: (v) => (v.is_current ? <Badge tone="s5">{t('Current')}</Badge>
        : <Button size="sm" icon={RotateCcw} onClick={async () => { try { await post(`${endpoint}/${id}/revert/${v.version}`); toast.ok(t('Restored as a new current version.')); onReverted(); } catch (e) { toast.err(e); } }}>{t('Restore')}</Button>) },
    ]} empty={t('No versions yet.')} />
    <div style={{ marginTop: 16 }}><VersionCompare versions={data.versions} /></div>
    </>
  );
}

export default function CrudPage({ endpoint, rowsPath, columns, fields, canManage, csvName, versioned, defaults = {}, toolbar, filter = () => true, newLabel, entityLabel, onRowOpen, justify = true, toForm = (x) => x, fromForm = (x) => x }) {
  const { t } = useI18n();
  const toast = useToast();
  const list = useFetch(rowsPath || endpoint);
  const settings = useFetch('/settings');
  const [edit, setEdit] = useState(null);
  const [tab, setTab] = useState('form');
  const [err, setErr] = useState(null);
  const [needJustify, setNeedJustify] = useState(null);
  const required = settings.data?.justification_required !== false;
  const close = () => { setEdit(null); setErr(null); setTab('form'); };
  const doSave = async (justification) => {
    setErr(null);
    try {
      const body = fromForm(edit);
      if (edit.id) await put(`${endpoint}/${edit.id}`, { ...body, justification }); else await post(endpoint, { ...body, justification });
      toast.ok(t('Saved.')); setNeedJustify(null); close(); list.reload();
    } catch (e) { setNeedJustify(null); setErr(e); }
  };
  const doDelete = async (justification) => {
    try { await del(`${endpoint}/${edit.id}`, { justification }); toast.ok(t('Deleted.')); setNeedJustify(null); close(); list.reload(); } catch (e) { setNeedJustify(null); setErr(e); }
  };
  if (list.error) return <ErrorNote error={list.error} />;
  if (!list.data) return <Skeleton h={320} />;
  const open = async (row) => { if (onRowOpen && onRowOpen(row)) return null; const full = await get(`${endpoint}/${row.id}`).catch(() => row); setEdit(toForm(full)); return null; };
  return (
    <>
      <Card>
        <DataTable csvName={csvName} rows={list.data.filter(filter)} columns={columns} onRowClick={open}
          toolbar={<>{toolbar}{canManage && <Button variant="primary" icon={Plus} onClick={() => setEdit({ ...defaults })}>{t(newLabel || 'Add')}</Button>}</>} />
      </Card>
      {edit && !needJustify && (
        <Modal wide title={edit.id ? t('Edit {x}', { x: t(entityLabel) }) : t('New {x}', { x: t(entityLabel) })} onClose={close}
          footer={<>
            {edit.id && canManage && <Button variant="danger" icon={Trash2} onClick={() => (justify && required ? setNeedJustify('delete') : doDelete(''))}>{t('Delete')}</Button>}
            <div className="grow" />
            <Button onClick={close}>{t('Cancel')}</Button>
            {canManage && <Button variant="primary" onClick={() => (edit.id && justify && required ? setNeedJustify('save') : doSave(''))}>{t('Save')}</Button>}
          </>}>
          {edit.id && versioned && <Tabs value={tab} onChange={setTab} tabs={[{ value: 'form', label: t('Details') }, { value: 'versions', label: t('Version history') }]} />}
          {tab === 'form' ? <FormFields fields={fields} value={edit} onChange={setEdit} disabled={!canManage} /> : <Versions endpoint={endpoint} id={edit.id} onReverted={() => { close(); list.reload(); }} />}
          <div style={{ marginTop: 12 }}><ErrorNote error={err} /></div>
        </Modal>
      )}
      {needJustify && <JustifyModal required={required} onCancel={() => setNeedJustify(null)} onConfirm={needJustify === 'delete' ? doDelete : doSave} />}
    </>
  );
}
