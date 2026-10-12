// Paste of records into a Multi-Entry (SRS 1.8 FR-DA-MRE-19 – 22): the clipboard is read, a mapping is proposed;
// the rows are applied directly (with an Undo notice) when the columns match and nothing is overwritten, otherwise
// the Paste Preview shows the mapping (changeable), the ignored columns, the rows added and overwritten and the
// invalid cells, with Apply and Cancel. The confirmed mapping is proposed again for the same Multi-Entry.
import { useCallback, useMemo, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { useSession } from '../lib/session.jsx';
import { readClipboard, looksLikeHeader, proposeMapping, buildRows } from '../lib/paste.js';
import { Btn, Icon, Modal, Select } from './ui.jsx';

const PREVIEW_ROWS = 50;
const isEmpty = v => v == null || String(v).trim() === '';
/** Checks of a typed cell, for tables that do not pass their own. */
export function basicValidate(col, value, t) {
  if (col.required && isEmpty(value)) return t('mre.required', { field: col.label });
  if (isEmpty(value)) return null;
  if (col.type === 'number' && Number.isNaN(Number(value))) return t('mre.number');
  if (col.type === 'number' && col.min != null && Number(value) < col.min) return t('mre.min', { min: col.min });
  if (col.type === 'number' && col.max != null && Number(value) > col.max) return t('mre.max', { max: col.max });
  if (col.type === 'date' && Number.isNaN(Date.parse(value))) return t('mre.date');
  if (col.type === 'select' && !col.custom && col.options && !col.options.some(o => String(o.value ?? o) === String(value))) return t('mre.notInList');
  return null;
}

/**
 * usePaste — shared by every Multi-Entry. `columns`: {key, label, type, options, custom, readOnly, computed}.
 * `targets(n, at)` → number of existing rows the paste would overwrite from `at`; `apply({ rows, header, mapping,
 * format, at })` saves and returns a promise. `readOnly` is the reason a paste is refused, if any.
 */
export function usePaste({ id, columns, readOnly, targets, apply, validate }) {
  const { t, lang } = useI18n(); const { toast, me, prefs, queuePrefs } = useSession();
  const [state, setState] = useState(null); const [box, setBox] = useState(null);
  const max = me?.limits?.pasteMaxRows || 1000;
  const editable = useMemo(() => columns.filter(c => !c.readOnly && !c.computed), [columns]);
  const check = useCallback((c, v, data) => (validate ? validate(c, v, data) : basicValidate(c, v, t)), [validate, t]);

  const run = useCallback(async (s, mapping, header) => {
    const rows = buildRows({ rows: s.clip.rows, header, mapping, columns, lang });
    await apply({ rows, header, mapping, format: s.clip.format, at: s.at });
  }, [apply, columns, lang]);

  const begin = useCallback((clip, at) => {
    if (readOnly) { toast(t('paste.refused', { reason: readOnly }), 'warning'); return; }
    if (!clip?.rows?.length) { toast(t('paste.empty'), 'info'); return; }
    const header = looksLikeHeader(clip.rows[0], columns, clip.rows.slice(1));
    const n = clip.rows.length - (header ? 1 : 0);
    if (n <= 0) { toast(t('paste.empty'), 'info'); return; }
    if (n > max) { toast(t('paste.tooMany', { max: max.toLocaleString(lang), n: n.toLocaleString(lang) }), 'error'); return; }
    const saved = prefs?.tables?.[id]?.pasteMap;
    const { mapping, remembered } = proposeMapping({ rows: clip.rows, header, columns, startKey: at?.col, saved });
    const width = Math.max(...clip.rows.map(r => r.length));
    const start = Math.max(0, editable.findIndex(c => c.key === at?.col));
    const match = header ? clip.rows[0].every((h, i) => isEmpty(h) || mapping[i]) && mapping.some(Boolean) : width <= editable.length - start && mapping.every(Boolean);
    const over = targets ? targets(n, at) : 0;
    const s = { clip, at, header, mapping, remembered };
    if (match && !over && !remembered) run(s, mapping, header).catch(e => toast(e.message || t('err.server'), 'error'));
    else setState(s);
  }, [readOnly, toast, t, columns, max, lang, prefs, id, editable, targets, run]);

  /** onPaste of a cell or of the table; returns true when the clipboard held records (the event is then consumed). */
  const onPaste = useCallback((e, at) => {
    const clip = readClipboard(e.clipboardData); if (!clip) return false;
    e.preventDefault(); e.stopPropagation(); begin(clip, at); return true;
  }, [begin]);
  /** The Paste action: the clipboard is read when the browser allows it, else a paste area opens (Ctrl+V there). */
  const openPaste = useCallback(async at => {
    if (readOnly) { toast(t('paste.refused', { reason: readOnly }), 'warning'); return; }
    try {
      if (navigator.clipboard?.read) {
        const items = await navigator.clipboard.read(); const data = {};
        for (const it of items) for (const type of ['text/html', 'text/plain']) if (it.types.includes(type) && !data[type]) data[type] = await (await it.getType(type)).text();
        const clip = readClipboard({ getData: k => data[k] || '' }); if (clip) { begin(clip, at); return; }
      }
    } catch { /* permission refused or not supported: paste area */ }
    setBox({ at });
  }, [readOnly, toast, t, begin]);

  const ui = <>
    {box && <PasteBox onClose={() => setBox(null)} onPaste={e => { const clip = readClipboard(e.clipboardData); e.preventDefault(); setBox(null); if (clip) begin(clip, box.at); else toast(t('paste.empty'), 'info'); }} />}
    {state && <PastePreview state={state} columns={columns} editable={editable} lang={lang} check={check} targets={targets}
      onCancel={() => setState(null)}
      onApply={async (mapping, header) => { const s = state; setState(null); if (id) queuePrefs({ tables: { [id]: { ...(prefs?.tables?.[id] || {}), pasteMap: mapping } } }); try { await run(s, mapping, header); } catch (e) { toast(e.message || t('err.server'), 'error'); } }} />}
  </>;
  return { onPaste, openPaste, ui };
}

function PasteBox({ onClose, onPaste }) {
  const { t } = useI18n(); const ref = useRef(null);
  return <Modal title={t('paste.action')} onClose={onClose} footer={<Btn onClick={onClose}>{t('common.cancel')}</Btn>}>
    <div ref={el => { ref.current = el; el?.focus(); }} className="paste-box" tabIndex={0} role="textbox" aria-label={t('paste.boxLabel')} contentEditable suppressContentEditableWarning onPaste={onPaste} onKeyDown={e => { if (!(e.ctrlKey || e.metaKey) && e.key.length === 1) e.preventDefault(); }}>
      <Icon name="ClipboardPaste" size={24} /> {t('paste.box')}</div>
    <p className="xs muted">{t('paste.hint')}</p>
  </Modal>;
}

function PastePreview({ state, columns, editable, lang, check, targets, onCancel, onApply }) {
  const { t } = useI18n();
  const [header, setHeader] = useState(state.header); const [mapping, setMapping] = useState(state.mapping);
  const { clip } = state; const width = Math.max(...clip.rows.map(r => r.length));
  const byKey = Object.fromEntries(columns.map(c => [c.key, c]));
  const built = useMemo(() => buildRows({ rows: clip.rows, header, mapping, columns, lang }), [clip.rows, header, mapping, columns, lang]);
  const over = targets ? targets(built.length, state.at) : 0;
  const mapped = mapping.map((k, i) => ({ k, i })).filter(x => x.k && byKey[x.k]);
  const checked = useMemo(() => built.map(r => Object.fromEntries(mapped.map(({ k }) => [k, check(byKey[k], r.data[k], r.data)]).filter(([, e]) => e))), [built, mapped, check]); // eslint-disable-line react-hooks/exhaustive-deps
  const bad = checked.filter(e => Object.keys(e).length).length;
  const srcName = i => (header ? clip.rows[0][i] : '') || t('paste.colN', { n: i + 1 });
  const ignored = mapping.map((k, i) => (!k ? srcName(i) : null)).filter(Boolean);
  const skipped = columns.filter(c => c.readOnly || c.computed).map(c => c.label);
  const used = new Set(mapping.filter(Boolean));
  const fmtVal = (c, v) => (c.type === 'select' ? (c.options || []).find(o => String(o.value ?? o) === String(v))?.label ?? v : v);

  return <Modal wide title={t('paste.preview')} onClose={onCancel} footer={<><Btn onClick={onCancel}>{t('common.cancel')}</Btn><Btn kind="primary" icon="ClipboardCheck" disabled={!mapped.length || !built.length} onClick={() => onApply(mapping, header)}>{t('paste.apply')}</Btn></>}>
    <div className="stack">
      <p className="small" role="status">{t('paste.summary', { rows: built.length, format: t('paste.fmt.' + clip.format), add: Math.max(0, built.length - over), over, bad })}</p>
      {state.remembered && <p className="xs muted"><Icon name="History" size={12} /> {t('paste.remembered')}</p>}
      <label className="row small"><input type="checkbox" checked={header} onChange={e => setHeader(e.target.checked)} /> {t('paste.header')}</label>
      <div className="eyebrow">{t('paste.mapping')}</div>
      <div className="paste-map">{Array.from({ length: width }, (_, i) => <div key={i} className="paste-map-item">
        <span className="xs muted">{t('paste.source')}</span><span className="strong small ellipsis" title={srcName(i)}>{srcName(i)}</span>
        <span className="xs muted ellipsis">{(header ? clip.rows[1] : clip.rows[0])?.[i] || '—'}</span>
        <Select size="sm" aria-label={t('paste.target') + ' — ' + srcName(i)} value={mapping[i] || ''} onChange={e => setMapping(m => { const n = [...m]; n[i] = e.target.value || null; return n; })}
          options={[{ value: '', label: t('paste.ignore') }, ...editable.filter(c => c.key === mapping[i] || !used.has(c.key)).map(c => ({ value: c.key, label: c.label }))]} /></div>)}</div>
      <p className="xs muted">{ignored.length ? t('paste.ignored', { list: ignored.join(', ') }) : t('paste.noneIgnored')}{skipped.length ? ' ' + t('paste.skipped', { list: skipped.join(', ') }) : ''}</p>
      <div className="table-wrap paste-preview"><table className="tbl compact"><thead><tr><th scope="col">{t('paste.row')}</th><th scope="col">{t('paste.action2')}</th>{mapped.map(({ k }) => <th key={k} scope="col">{byKey[k].label}</th>)}</tr></thead>
        <tbody>{built.slice(0, PREVIEW_ROWS).map((r, ri) => { const errs = checked[ri]; const isOver = ri < over;
          return <tr key={ri} className={Object.keys(errs).length ? 'row-invalid' : ''}><td className="mono xs">{ri + 1}</td><td><span className={`pill xs ${isOver ? 's2' : 's4'}`}>{isOver ? t('paste.overwrite') : t('paste.add')}</span>{Object.keys(errs).length > 0 && <span className="pill xs s1">{t('paste.invalid')}</span>}</td>
            {mapped.map(({ k }) => <td key={k} className={`wrap-cell ${errs[k] ? 'cell-invalid' : ''}`} title={errs[k] || undefined}>{String(fmtVal(byKey[k], r.data[k]) ?? '')}{r.custom[k] && <span className="xs muted"> · {t('paste.custom')}</span>}{errs[k] && <div className="field-error"><Icon name="CircleAlert" size={12} /> {errs[k]}</div>}</td>)}</tr>; })}</tbody></table></div>
      {built.length > PREVIEW_ROWS && <p className="xs muted">{t('paste.more', { n: built.length - PREVIEW_ROWS })}</p>}
    </div>
  </Modal>;
}
