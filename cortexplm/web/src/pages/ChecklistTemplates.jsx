// Checklist template library: templates per gate and per track. A template linked to its gate is copied into
// the gate checklist when the gate opens; the others are added from the gate screen when a project needs them.
import { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Link2 } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { get, post, put, del } from '../lib/api.js';
import { PageHeader, Card, CardHead, DataTable, useFetch, Skeleton, ErrorNote, Button, IconButton, Modal, Field, Input, Textarea, Select, Check, Tabs, Badge, StatusBadge, JustifyModal, useToast, fmtDate } from '../components/ui.jsx';
import VersionCompare from '../components/VersionCompare.jsx';

const TRACK_GATES = { Full: ['T-1', 'T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6'], Light: ['T-1', 'T0', 'T1', 'T2', 'T3', 'T5'], Fast: ['T-1', 'T0', 'T3'] };
const GATES = TRACK_GATES.Full;

export function ItemsEditor({ items, onChange, disabled }) {
  const { t } = useI18n();
  const set = (i, patch) => onChange(items.map((it, k) => (k === i ? { ...it, ...patch } : it)));
  const move = (i, d) => { const x = [...items]; const [it] = x.splice(i, 1); x.splice(i + d, 0, it); onChange(x); };
  return (
    <div className="stack">
      <div className="table-wrap"><table className="data compact">
        <thead><tr><th>#</th><th>{t('Checklist item')}</th><th>{t('Mandatory')}</th><th>{t('Evidence required')}</th><th /></tr></thead>
        <tbody>{items.map((it, i) => (
          <tr key={i}>
            <td className="num">{i + 1}</td>
            <td style={{ minWidth: 280 }}><Input aria-label={t('Checklist item {n}', { n: i + 1 })} value={it.text} disabled={disabled} onChange={(e) => set(i, { text: e.target.value })} /></td>
            <td><input type="checkbox" aria-label={t('Mandatory')} checked={!!it.mandatory} disabled={disabled} onChange={(e) => set(i, { mandatory: e.target.checked ? 1 : 0, evidence_required: e.target.checked ? 1 : it.evidence_required })} /></td>
            <td><input type="checkbox" aria-label={t('Evidence required')} checked={!!it.evidence_required} disabled={disabled} onChange={(e) => set(i, { evidence_required: e.target.checked ? 1 : 0 })} /></td>
            <td className="row" style={{ gap: 2, justifyContent: 'flex-end' }}>
              {!disabled && <><IconButton size="sm" icon={ArrowUp} label={t('Move up')} disabled={i === 0} onClick={() => move(i, -1)} /><IconButton size="sm" icon={ArrowDown} label={t('Move down')} disabled={i === items.length - 1} onClick={() => move(i, 1)} /><IconButton size="sm" icon={Trash2} label={t('Remove')} onClick={() => onChange(items.filter((_, k) => k !== i))} /></>}
            </td>
          </tr>
        ))}</tbody>
      </table></div>
      {!disabled && <div><Button size="sm" icon={Plus} onClick={() => onChange([...items, { text: '', mandatory: 0, evidence_required: 0 }])}>{t('Add item')}</Button></div>}
    </div>
  );
}

export default function ChecklistTemplates() {
  const { t } = useI18n();
  const { can } = useAuth();
  const toast = useToast();
  const list = useFetch('/checklist-templates');
  const gates = useFetch('/reference/gates');
  const settings = useFetch('/settings');
  const [cell, setCell] = useState(null);
  const [edit, setEdit] = useState(null);
  const [tab, setTab] = useState('form');
  const [err, setErr] = useState(null);
  const [justify, setJustify] = useState(null);
  const manage = can('checklist.template.manage');
  if (list.error) return <div className="page"><ErrorNote error={list.error} /></div>;
  if (!list.data) return <div className="page"><Skeleton h={500} /></div>;
  const required = settings.data?.justification_required !== false;
  const question = (g) => gates.data?.gates.find((x) => x.id === g)?.question;
  const rows = list.data.filter((x) => !cell || (x.track === cell.track && x.gate === cell.gate));
  const open = async (row) => { setErr(null); setTab('form'); setEdit(await get(`/checklist-templates/${row.id}`).catch(() => row)); };
  const close = () => { setEdit(null); setErr(null); };
  const save = async (justification) => {
    try {
      const body = { name: edit.name, track: edit.track, gate: edit.gate, description: edit.description, auto_apply: edit.auto_apply ? 1 : 0, items: edit.items.filter((i) => i.text.trim()), justification };
      if (edit.id) await put(`/checklist-templates/${edit.id}`, body); else await post('/checklist-templates', body);
      toast.ok(t('Saved.')); setJustify(null); close(); list.reload();
    } catch (e) { setJustify(null); setErr(e); }
  };
  const remove = async (justification) => {
    try { await del(`/checklist-templates/${edit.id}`, { justification }); toast.ok(t('Deleted.')); setJustify(null); close(); list.reload(); } catch (e) { setJustify(null); setErr(e); }
  };
  return (
    <div className="page">
      <PageHeader eyebrow={t('Process design · MP-122')} title={t('Checklist templates')}
        subtitle={t('A library of gate checklists per gate and per track. A template linked to its gate is copied into the checklist when the gate opens; any template can also be added from the gate screen.')}
        actions={manage && <Button variant="primary" icon={Plus} onClick={() => { setTab('form'); setEdit({ name: '', track: cell?.track || 'Full', gate: cell?.gate || 'T-1', description: '', auto_apply: 0, items: [{ text: '', mandatory: 1, evidence_required: 1 }] }); }}>{t('New template')}</Button>} />
      <Card style={{ marginBottom: 16 }}>
        <CardHead title={t('Templates by gate and track')} subtitle={t('Click a cell to list its templates. The link icon marks templates copied automatically when the gate opens.')} />
        <div className="table-wrap"><table className="data compact">
          <thead><tr><th>{t('Gate')}</th><th>{t('Decision question')}</th>{Object.keys(TRACK_GATES).map((tr) => <th key={tr}>{t(`${tr} Track`)}</th>)}</tr></thead>
          <tbody>{GATES.map((g) => (
            <tr key={g}>
              <td className="strong">{g}</td><td className="small">{t(question(g) || '')}</td>
              {Object.keys(TRACK_GATES).map((tr) => {
                if (!TRACK_GATES[tr].includes(g)) return <td key={tr} className="muted">{t('Not in track')}</td>;
                const here = list.data.filter((x) => x.track === tr && x.gate === g);
                const active = cell?.track === tr && cell?.gate === g;
                return (
                  <td key={tr} style={active ? { background: 'var(--pa-orange-tint)' } : undefined}>
                    <button type="button" className="link-button small" aria-pressed={active} onClick={() => setCell(active ? null : { track: tr, gate: g })}>
                      {t('{n} templates', { n: here.length })}
                    </button>
                    <div className="xs muted">{here.filter((x) => x.auto_apply).length ? <><Link2 size={11} aria-hidden /> {t('{n} linked', { n: here.filter((x) => x.auto_apply).length })}</> : t('None linked (reference checklist used)')}</div>
                  </td>
                );
              })}
            </tr>
          ))}</tbody>
        </table></div>
      </Card>
      <Card>
        <DataTable csvName="checklist_templates" rows={rows} onRowClick={open}
          toolbar={cell && <Badge tone="accent">{t('{g} · {tr} Track', { g: cell.gate, tr: t(cell.track) })} <button type="button" className="link-button" onClick={() => setCell(null)}>{t('Show all')}</button></Badge>}
          columns={[
            { key: 'name', label: t('Template'), render: (x) => <><div className="strong">{x.name}</div><div className="xs muted">{x.description}</div></> },
            { key: 'track', label: t('Track'), render: (x) => t(`${x.track} Track`) },
            { key: 'gate', label: t('Gate'), render: (x) => `${x.gate}${x.e2e ? ` (${x.e2e})` : ''}` },
            { key: 'auto_apply', label: t('Linked to the gate'), csv: (x) => (x.auto_apply ? 'Yes' : 'No'), render: (x) => <StatusBadge value={x.auto_apply ? 'Yes' : 'No'} /> },
            { key: 'items', label: t('Items'), num: true, sortValue: (x) => x.items.length, csv: (x) => x.items.length, render: (x) => `${x.items.length} (${t('{n} mandatory', { n: x.items.filter((i) => i.mandatory).length })})` },
            { key: 'updated_at', label: t('Updated'), render: (x) => fmtDate(x.updated_at) },
          ]} />
      </Card>
      {edit && !justify && (
        <Modal wide title={edit.id ? t('Edit checklist template') : t('New checklist template')} onClose={close}
          footer={<>
            {edit.id && manage && <Button variant="danger" icon={Trash2} onClick={() => (required ? setJustify('delete') : remove(''))}>{t('Delete')}</Button>}
            <div className="grow" /><Button onClick={close}>{t('Cancel')}</Button>
            {manage && <Button variant="primary" disabled={!edit.name.trim() || !edit.items.some((i) => i.text.trim())} onClick={() => (edit.id && required ? setJustify('save') : save(''))}>{t('Save')}</Button>}
          </>}>
          {edit.id && <Tabs value={tab} onChange={setTab} tabs={[{ value: 'form', label: t('Details') }, { value: 'versions', label: t('Version history ({n})', { n: edit.versions?.length || 0 }) }]} />}
          {tab === 'form' ? (
            <div className="stack">
              <div className="form-grid">
                <Field label={t('Name')} required full><Input value={edit.name} disabled={!manage} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
                <Field label={t('Track')}><Select value={edit.track} disabled={!manage} onChange={(e) => setEdit({ ...edit, track: e.target.value, gate: TRACK_GATES[e.target.value].includes(edit.gate) ? edit.gate : TRACK_GATES[e.target.value][0] })} options={Object.keys(TRACK_GATES).map((tr) => ({ value: tr, label: t(`${tr} Track`) }))} /></Field>
                <Field label={t('Gate')} hint={t(question(edit.gate) || '')}><Select value={edit.gate} disabled={!manage} onChange={(e) => setEdit({ ...edit, gate: e.target.value })} options={TRACK_GATES[edit.track].map((g) => ({ value: g, label: g }))} /></Field>
                <Field label={t('Description')} full><Textarea rows={2} value={edit.description || ''} disabled={!manage} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
                <Field full><Check label={t('Link to the gate: copy these items into the checklist every time this gate opens on this track')} checked={!!edit.auto_apply} disabled={!manage} onChange={(e) => setEdit({ ...edit, auto_apply: e.target.checked ? 1 : 0 })} /></Field>
              </div>
              <ItemsEditor items={edit.items} disabled={!manage} onChange={(items) => setEdit({ ...edit, items })} />
              <ErrorNote error={err} />
            </div>
          ) : (
            <VersionCompare versions={(edit.versions || []).map((v) => ({ ...v, data: typeof v.data === 'string' ? JSON.parse(v.data) : v.data }))} />
          )}
        </Modal>
      )}
      {justify && <JustifyModal required={required} onCancel={() => setJustify(null)} onConfirm={justify === 'delete' ? remove : save} />}
    </div>
  );
}
