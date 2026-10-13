// Row Editor (FR-DA-DEU-03, -06) and the shared choice fields of the bulk-entry grid. The Row Editor edits the
// grid's own draft of the row — one large field per column, previous and next row, Save and new, back to the
// table — so closing it never loses input; on a phone it is the "edit one by one" form of the mobile list.
import { useState } from 'react';
import { useI18n } from '../../lib/i18n.jsx';
import { Btn, Select, Drawer, Field } from '../ui.jsx';
import { CUSTOM, optionList } from './GridParts.jsx';

export function RowEditor({ row, index, total, columns, readOnly, title, typedValues, h, onPrev, onNext, onNew, onClose, t }) {
  const errs = row.errors || {}; const yes = v => v === true || v === 'true';
  return (<Drawer size="lg" title={title || t('mre.rowN', { n: index + 1, total })} subtitle={t('mre.rowN', { n: index + 1, total }) + (row.status === 'dirty' ? ' · ' + t('mre.st.dirty') : row.status === 'saved' ? ' · ' + t('mre.st.saved') : row.status === 'error' ? ' · ' + t('mre.st.error') : '')} onClose={onClose}
    footer={<><Btn icon="ArrowLeft" onClick={onClose}>{t('mre.backToTable')}</Btn><span className="spacer" /><Btn icon="ChevronLeft" disabled={index === 0} onClick={onPrev}>{t('mre.prevRow')}</Btn><Btn icon="ChevronRight" disabled={index >= total - 1} onClick={onNext}>{t('mre.nextRow')}</Btn>{!readOnly && <Btn kind="primary" icon="Plus" onClick={onNew}>{t('mre.saveAndNew')}</Btn>}</>}>
    {errs._row && <p className="field-error" role="alert">{errs._row}</p>}
    <div className="stack">{columns.map(c => { const v = row.data[c.key]; const fid = `re-${row._key}-${c.key}`; const s = v == null ? '' : typeof v === 'object' ? v.en ?? '' : String(v);
      return <Field key={c.key} id={fid} label={c.label} required={c.required} error={errs[c.key]} hint={c.help}>
        {readOnly || c.readOnly ? <div className="ro-value">{c.type === 'boolean' ? (yes(v) ? t('common.yes') : t('common.no')) : c.type === 'select' ? ((c.options || []).find(o => String(o.value ?? o) === s)?.label ?? (s || '—')) : (s || '—')}</div>
          : c.type === 'boolean' ? <label className="check"><input id={fid} type="checkbox" checked={yes(v)} onChange={e => h.change(row._key, c, e.target.checked)} />{yes(v) ? t('common.yes') : t('common.no')}</label>
          : c.type === 'select' ? <ChoiceField id={fid} col={c} value={s} typed={typedValues[c.key]} onChange={x => h.change(row._key, c, x)} onCommit={() => h.blurCell(row._key, c)} t={t} invalid={!!errs[c.key]} />
          : c.type === 'textarea' || c.wide ? <textarea id={fid} className="input" rows={6} value={s} onFocus={() => h.focusStart(row._key, c, v)} onChange={e => h.change(row._key, c, e.target.value)} onBlur={() => h.blurCell(row._key, c)} />
          : <input id={fid} className="input" type={c.type === 'date' ? 'date' : 'text'} inputMode={c.type === 'number' ? 'decimal' : undefined} value={s} onFocus={() => h.focusStart(row._key, c, v)} onChange={e => h.change(row._key, c, e.target.value)} onBlur={() => h.blurCell(row._key, c)} />}
      </Field>; })}</div>
  </Drawer>);
}

/** Controlled List with a Custom value that opens a free text field; values typed before are offered again (FR-DA-DEU-02). */
export function ChoiceField({ id, col, value, typed, onChange, onCommit, t, invalid }) {
  const known = v => (col.options || []).some(o => String(o.value ?? o) === String(v)) || (typed || []).includes(v);
  const [custom, setCustom] = useState(() => col.custom && value != null && value !== '' && !known(value));
  if (custom) return <div className="row"><input id={id} className="input" value={value ?? ''} aria-invalid={invalid || undefined} placeholder={t('mre.customPlaceholder')} onChange={e => onChange(e.target.value)} onBlur={onCommit} style={{ flex: 1 }} /><Btn size="sm" kind="ghost" icon="List" aria-label={t('mre.backToList')} data-tip={t('mre.backToList')} onClick={() => { setCustom(false); onChange(''); }} /></div>;
  return <Select id={id} value={value ?? ''} options={optionList(col, typed, t)} invalid={invalid} placeholder={col.placeholder || t('select.placeholder')} onChange={e => { if (e.target.value === CUSTOM) { setCustom(true); onChange(''); requestAnimationFrame(() => document.getElementById(id)?.focus()); } else { onChange(e.target.value); onCommit?.(); } }} />;
}

/** The value set on every selected row (FR-DA-MRE-12). */
export function BulkValue({ col, value, onChange }) {
  const { t } = useI18n(); if (!col) return null;
  if (col.type === 'boolean') return <Select size="sm" aria-label={col.label} value={String(value)} onChange={e => onChange(e.target.value === 'true')} options={[{ value: 'true', label: t('common.yes') }, { value: 'false', label: t('common.no') }]} placeholder={t('mre.value')} />;
  if (col.type === 'select') return <Select size="sm" aria-label={col.label} value={value} onChange={e => onChange(e.target.value)} options={(col.options || []).map(o => (typeof o === 'object' ? o : { value: o, label: o }))} placeholder={t('mre.value')} />;
  return <input className="input sm" aria-label={col.label} type={col.type === 'date' ? 'date' : 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={t('mre.value')} style={{ width: 200 }} />;
}
