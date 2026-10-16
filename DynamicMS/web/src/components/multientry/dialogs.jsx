// Dialogs and panels of a Multi-Entry: confirmation (never the browser's own), Paste Preview
// (FR-DA-MRE-20), five-stage Import Session (FR-DA-MRE-30), Row Editor with Save and new
// (FR-DA-MRE-33, -34), Edit Conflicts (FR-DA-MRE-26), Issues list (FR-DA-MRE-24), column chooser
// (FR-DA-MRE-11) and filters (FR-DA-MRE-13).
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Upload, Download, AlertCircle, ArrowUp, ArrowDown, Plus, X, Check } from 'lucide-react';
import { Modal, Field } from '../ui.jsx';
import { CellEditor, labelText, displayValue } from './cells.jsx';
import { proposeMapping, looksLikeHeader, convertValue, validateRow, missingRequired, findDuplicates, OPERATORS, norm } from '../../lib/multientry.js';
import { api, getToken } from '../../lib/api.js';

export function ConfirmDialog({ title, children, actions, onClose }) {
  return (
    <Modal title={title} onClose={onClose} footer={<>
      <button type="button" className="btn" onClick={onClose}>{actions.cancelLabel}</button>
      {actions.list.map(a => <button key={a.label} type="button" className={`btn ${a.kind === 'danger' ? 'btn-danger' : a.kind === 'primary' ? 'btn-primary' : ''}`} onClick={a.run}>{a.label}</button>)}
    </>}>
      <div className="stack-8">{children}</div>
    </Modal>
  );
}

// ---------------------------------------------------------------- Row Editor
export function RowEditor({ h, title, columns, rows, index, setIndex, onCell, onClose, onSaveAndNew, readOnly, ctx, renderCell, errors }) {
  const { t, lang } = ctx;
  const r = rows[index];
  if (!r) return null;
  return (
    <Modal wide title={`${title} — ${t('Row {n} of {m}', { n: index + 1, m: rows.length })}`} onClose={onClose} footer={<>
      <button type="button" className="btn" disabled={index === 0} onClick={() => setIndex(index - 1)}><ChevronLeft size={16} className="flip-rtl" />{t('Previous row')}</button>
      <button type="button" className="btn" disabled={index >= rows.length - 1} onClick={() => setIndex(index + 1)}>{t('Next row')}<ChevronRight size={16} className="flip-rtl" /></button>
      {!readOnly && <button type="button" className="btn" onClick={onSaveAndNew}><Plus size={16} />{t('Save and new')}</button>}
      <button type="button" className="btn btn-primary" onClick={onClose}>{t('Back to the table')}</button>
    </>}>
      <div className="form-grid">
        {columns.map(c => (
          <div key={c.key} data-row={r._key} data-col={c.key} onFocusCapture={h?.onCellFocus} onBlurCapture={h?.onCellBlur} style={{ gridColumn: c.type === 'textarea' || c.wide ? '1 / -1' : undefined }}>
            <Field label={labelText(c.label, t, lang)} required={c.required} error={errors[`${r._key}:${c.key}`]}>
              {(id) => (c.readOnly || readOnly ? <div className="input readonly" id={id}>{displayValue(c, r[c.key], r, ctx) || '—'}</div>
                : <CellEditor col={c} id={id} big value={r[c.key]} row={r} ctx={ctx} renderCell={renderCell} aria={labelText(c.label, t, lang)} onChange={(v) => onCell(r._key, c.key, v)} />)}
            </Field>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- Paste Preview
export function PastePreview({ block, columns, startKey, startIndex, rows, savedMapping, onApply, onCancel, ctx, maxRows }) {
  const { t, lang, locale } = ctx;
  const editable = columns.filter(c => !c.readOnly && !c.computed);
  const [hasHeader, setHasHeader] = useState(() => looksLikeHeader(block[0], editable, lang));
  const width = Math.max(...block.map(r => r.length));
  const [mapping, setMapping] = useState(() => proposeMapping({ header: hasHeader ? block[0] : null, width, columns: editable, startKey, saved: savedMapping, lang }));
  useEffect(() => { setMapping(proposeMapping({ header: hasHeader ? block[0] : null, width, columns: editable, startKey, saved: null, lang })); }, [hasHeader]); // eslint-disable-line react-hooks/exhaustive-deps
  const data = hasHeader ? block.slice(1) : block;
  const tooMany = data.length > maxRows;
  const preview = useMemo(() => data.slice(0, 200).map((cells, i) => {
    const target = rows[startIndex + i];
    const vals = {}; const errs = {};
    mapping.forEach((k, j) => { if (!k) return; const c = editable.find(x => x.key === k); const r = convertValue(cells[j], c, { locale, lang, t }); vals[k] = r.value; if (r.error) errs[k] = r.error; });
    const merged = { ...(target || {}), ...vals };
    const v = validateRow(merged, editable, t);
    for (const [k, m] of Object.entries(v)) if (mapping.includes(k)) errs[k] = errs[k] || m;
    const overwrite = target && mapping.some((k, j) => k && String(target[k] ?? '') !== '' && String(cells[j] ?? '') !== '' && String(target[k]) !== String(vals[k]));
    return { cells, vals, errs, overwrite, add: !target };
  }), [data, mapping, rows, startIndex]); // eslint-disable-line react-hooks/exhaustive-deps
  const added = data.filter((_, i) => !rows[startIndex + i]).length;
  const overwritten = preview.filter(p => p.overwrite).length;
  const invalid = preview.reduce((a, p) => a + Object.keys(p.errs).length, 0);
  const ignored = mapping.map((k, j) => (k ? null : (hasHeader ? block[0][j] : t('Column {n}', { n: j + 1 })))).filter(Boolean);
  return (
    <Modal full title={t('Paste preview')} onClose={onCancel} footer={<>
      <button type="button" className="btn" onClick={onCancel}>{t('Cancel')}</button>
      <button type="button" className="btn btn-primary" disabled={tooMany || !mapping.some(Boolean)} onClick={() => onApply({ mapping, hasHeader })}>{t('Apply')}</button>
    </>}>
      <div className="stack">
        <p className="small" role="status">{t('{a} rows will be added, {o} rows overwritten; {i} invalid cells are marked and kept for correction.', { a: added, o: overwritten, i: invalid })}{ignored.length ? ` ${t('Ignored columns: {list}.', { list: ignored.join(', ') })}` : ''}</p>
        {tooMany && <div className="callout bad small" role="alert"><span>{t('Up to {n} rows can be pasted at once; use Import for more.', { n: maxRows })}</span></div>}
        <label className="checkbox small"><input type="checkbox" checked={hasHeader} onChange={e => setHasHeader(e.target.checked)} /><span>{t('The first row holds the column titles')}</span></label>
        <div className="table-wrap" style={{ maxHeight: '55vh' }}>
          <table className="data grid-table">
            <thead>
              <tr>{mapping.map((k, j) => (
                <th key={j} scope="col" style={{ minWidth: 160 }}>
                  <select className="select select-sm" aria-label={t('Field for pasted column {n}', { n: j + 1 })} value={k || ''} onChange={e => setMapping(m => m.map((x, q) => (q === j ? (e.target.value || null) : x === e.target.value ? null : x)))}>
                    <option value="">{t('Ignore this column')}</option>
                    {editable.map(c => <option key={c.key} value={c.key}>{labelText(c.label, t, lang)}{c.required ? ' *' : ''}</option>)}
                  </select>
                  {hasHeader && <div className="xsmall" style={{ fontWeight: 400, marginTop: 4 }}>{block[0][j]}</div>}
                </th>
              ))}<th scope="col">{t('Row')}</th></tr>
            </thead>
            <tbody>
              {preview.map((p, i) => (
                <tr key={i}>
                  {p.cells.map((c, j) => { const k = mapping[j]; const e = k && p.errs[k]; return <td key={j} className={e ? 'cell-error' : ''} style={{ opacity: k ? 1 : 0.45 }}>{String(c)}{e && <span className="cell-msg"><AlertCircle size={12} aria-hidden="true" /> {e}</span>}</td>; })}
                  <td className="small">{p.add ? t('Added') : p.overwrite ? t('Overwritten') : t('Filled')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {missingRequired(mapping, editable).length > 0 && <p className="small muted">{t('Required fields without a column stay to be typed: {list}.', { list: missingRequired(mapping, editable).map(k => labelText(editable.find(c => c.key === k).label, t, lang)).join(', ') })}</p>}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- Import Session (5 stages)
const STAGES = ['Template', 'Upload', 'Column mapping', 'Error repair', 'Summary'];
export function ImportWizard({ source, columns, existing, limits, onCommit, onClose, ctx }) {
  const { t, lang, locale } = ctx;
  const editable = columns.filter(c => !c.readOnly && !c.computed);
  const [stage, setStage] = useState(0);
  const [asking, setAsking] = useState(false);
  const [file, setFile] = useState(null); // { sessionId, fileName, type, encoding, encodings, rows, rowCount, size }
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [hasHeader, setHasHeader] = useState(true);
  const [mapping, setMapping] = useState([]);
  const [work, setWork] = useState([]); // [{ values, errs, dup, skip }]
  const [onlyIssues, setOnlyIssues] = useState(true);
  const [withErrors, setWithErrors] = useState('leave');
  const [common, setCommon] = useState({ key: '', value: '' });
  const blob = useRef(null);
  const headers = file ? (hasHeader ? file.rows[0] : file.rows[0].map((_, j) => t('Column {n}', { n: j + 1 }))) : [];
  const dataRows = file ? (hasHeader ? file.rows.slice(1) : file.rows) : [];

  const upload = async (f, encoding) => {
    setBusy(true); setErr(null);
    try {
      const body = f instanceof Blob ? f : new Blob([f], { type: 'text/plain' });
      const name = f.name || 'pasted.txt';
      blob.current = f;
      const res = await fetch(`/api/entries/${encodeURIComponent(source)}/import${encoding ? `?encoding=${encoding}` : ''}`, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'X-File-Name': encodeURIComponent(name), Authorization: `Bearer ${getToken()}` }, body });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || res.statusText);
      setFile(data);
      const head = looksLikeHeader(data.rows[0], editable, lang);
      setHasHeader(head);
      setMapping(proposeMapping({ header: head ? data.rows[0] : null, width: Math.max(...data.rows.map(r => r.length)), columns: editable, startKey: editable[0]?.key, saved: null, lang }));
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const build = () => {
    const list = dataRows.map(cells => {
      const values = {}; const errs = {};
      mapping.forEach((k, j) => { if (!k) return; const c = editable.find(x => x.key === k); const r = convertValue(cells[j], c, { locale, lang, t }); values[k] = r.value; if (r.error) errs[k] = r.error; });
      Object.assign(errs, Object.fromEntries(Object.entries(validateRow(values, editable, t)).filter(([k]) => !errs[k])));
      return { values, errs, skip: false };
    });
    const keyCols = editable.filter(c => c.required).slice(0, 2).map(c => c.key);
    const dup = findDuplicates(list.map(x => x.values), keyCols.length ? keyCols : [editable[0]?.key], existing);
    list.forEach((x, i) => { x.dup = dup.has(i); });
    setWork(list);
  };
  const recheck = (i, k, v) => setWork(w => w.map((x, j) => { if (j !== i) return x; const values = { ...x.values, [k]: v }; const errs = validateRow(values, editable, t); return { ...x, values, errs }; }));
  const built = useRef(null);
  // Entering the repair stage builds the rows once per mapping: going back and forth keeps the corrections.
  const go = (n) => { const sig = JSON.stringify([mapping, hasHeader, file?.sessionId]); if (n === 3 && built.current !== sig) { build(); built.current = sig; } setStage(n); api(`/entries/import/${file?.sessionId}`, { method: 'PUT', body: { stage: STAGES[n].toLowerCase(), mapping } }).catch(() => {}); };
  const missing = missingRequired(mapping, editable);
  const needing = work.map((x, i) => [x, i]).filter(([x]) => !x.skip && (Object.keys(x.errs).length || x.dup));
  const ready = work.filter(x => !x.skip && !Object.keys(x.errs).length && !x.dup).length;
  const warn = work.filter(x => !x.skip && x.dup && !Object.keys(x.errs).length).length;
  const bad = work.filter(x => !x.skip && Object.keys(x.errs).length).length;
  const skipped = work.filter(x => x.skip).length;
  const commit = () => {
    const rows = work.filter(x => !x.skip && (withErrors === 'import' || !Object.keys(x.errs).length)).map(x => ({ ...x.values, ...(common.key ? { [common.key]: common.value } : {}) }));
    onCommit({ rows, sessionId: file.sessionId, mapping });
  };
  const close = () => { if (file) setAsking(true); else onClose(); };
  return (
    <Modal full title={t('Import rows')} onClose={close} footer={<>
      <button type="button" className="btn" onClick={close}>{t('Cancel')}</button>
      {stage > 0 && <button type="button" className="btn" onClick={() => setStage(stage - 1)}><ChevronLeft size={16} className="flip-rtl" />{t('Previous')}</button>}
      {stage < 4 && <button type="button" className="btn btn-primary" disabled={(stage === 1 && !file) || (stage === 2 && missing.length > 0)} onClick={() => go(stage + 1)}>{t('Next')}<ChevronRight size={16} className="flip-rtl" /></button>}
      {stage === 4 && <button type="button" className="btn btn-primary" disabled={!ready && !(withErrors === 'import' && bad)} onClick={commit}><Check size={16} />{t('Import {n} rows', { n: ready + warn + (withErrors === 'import' ? bad : 0) })}</button>}
    </>}>
      {asking && <ConfirmDialog title={t('Cancel the import?')} onClose={() => setAsking(false)} actions={{ cancelLabel: t('Continue the import'), list: [{ label: t('Cancel the import'), kind: 'danger', run: () => { setAsking(false); api(`/entries/import/${file?.sessionId}`, { method: 'PUT', body: { status: 'Cancelled' } }).catch(() => {}); onClose(); } }] }}><p>{t('The file and the corrections made are not kept.')}</p></ConfirmDialog>}
      <ol className="stepper" aria-label={t('Import stages')}>{STAGES.map((s, i) => <li key={s} aria-current={i === stage ? 'step' : undefined} className={i < stage ? 'done' : i === stage ? 'on' : ''}><span className="n">{i + 1}</span>{t(s)}</li>)}</ol>
      {err && <div className="callout bad small" role="alert"><span>{err}</span></div>}
      {stage === 0 && (
        <div className="stack">
          <p>{t('Accepted: a spreadsheet workbook (.xlsx), delimited text (.csv, .txt: comma, semicolon or tab) or text pasted below. Up to {n} rows and {m} MB.', { n: limits?.importMaxRows || 10000, m: Math.round((limits?.importMaxBytes || 10485760) / 1048576) })}</p>
          <p className="small muted">{t('The template holds the column titles (required ones marked with *) and an example row.')}</p>
          <div className="row">
            <a className="btn" href="#" onClick={async (e) => { e.preventDefault(); const { download } = await import('../../lib/api.js'); download(`/entries/${encodeURIComponent(source)}/template`, 'template.xlsx'); }}><Download size={16} />{t('Download the template (Excel)')}</a>
            <a className="btn" href="#" onClick={async (e) => { e.preventDefault(); const { download } = await import('../../lib/api.js'); download(`/entries/${encodeURIComponent(source)}/template?format=csv`, 'template.csv'); }}><Download size={16} />{t('Download the template (CSV)')}</a>
          </div>
          <table className="data small"><thead><tr><th scope="col">{t('Column')}</th><th scope="col">{t('Required')}</th><th scope="col">{t('Type')}</th></tr></thead>
            <tbody>{editable.map(c => <tr key={c.key}><td>{labelText(c.label, t, lang)}</td><td>{c.required ? t('Yes') : t('No')}</td><td>{t(c.type === 'select' ? 'List' : c.type === 'number' ? 'Number' : c.type === 'date' ? 'Date' : c.type === 'checkbox' ? 'Yes / No' : 'Text')}</td></tr>)}</tbody></table>
        </div>
      )}
      {stage === 1 && (
        <div className="stack">
          <label className="dropzone" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) upload(f); }}>
            <Upload aria-hidden="true" /><span>{t('Drop a file here or choose one')}</span>
            <input type="file" accept=".xlsx,.csv,.txt,.tsv,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
          <Field label={t('Or paste the rows here')}>{(id) => <textarea id={id} className="textarea" rows={4} value={text} onChange={e => setText(e.target.value)} />}</Field>
          <div><button type="button" className="btn btn-sm" disabled={!text.trim() || busy} onClick={() => upload(Object.assign(new Blob([text], { type: 'text/plain' }), { name: 'pasted.txt' }))}>{t('Use the pasted text')}</button></div>
          {busy && <p className="small muted" role="status">{t('Reading the file…')}</p>}
          {file && (
            <div className="stack-8">
              <p className="small" role="status">{t('{name}: {type}, {size} KB, {n} rows.', { name: file.fileName, type: file.type === 'xlsx' ? 'Excel' : t('Text'), size: Math.ceil(file.size / 1024), n: file.rowCount })}{file.encoding ? ` ${t('Encoding: {e}.', { e: file.encoding })}` : ''}</p>
              {file.encodings?.length > 0 && <label className="small">{t('Text encoding')} <select className="select select-sm" value={file.encoding} onChange={e => upload(blob.current, e.target.value)}>{file.encodings.map(x => <option key={x} value={x}>{x}</option>)}</select></label>}
              <div className="table-wrap" style={{ maxHeight: 260 }}><table className="data small"><tbody>{file.rows.slice(0, 11).map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{String(c)}</td>)}</tr>)}</tbody></table></div>
            </div>
          )}
        </div>
      )}
      {stage === 2 && file && (
        <div className="stack">
          <label className="checkbox small"><input type="checkbox" checked={hasHeader} onChange={e => { setHasHeader(e.target.checked); setMapping(proposeMapping({ header: e.target.checked ? file.rows[0] : null, width: file.rows[0].length, columns: editable, startKey: editable[0]?.key, saved: null, lang })); }} /><span>{t('The first row holds the column titles')}</span></label>
          <table className="data small"><thead><tr><th scope="col">{t('Column of the file')}</th><th scope="col">{t('Sample values')}</th><th scope="col">{t('Field')}</th></tr></thead>
            <tbody>{headers.map((h, j) => (
              <tr key={j}><td className="strong">{h}</td><td className="muted">{dataRows.slice(0, 3).map(r => r[j]).filter(Boolean).join(' · ')}</td>
                <td><select className="select select-sm" aria-label={t('Field for {c}', { c: h })} value={mapping[j] || ''} onChange={e => setMapping(m => m.map((x, q) => (q === j ? (e.target.value || null) : x === e.target.value ? null : x)))}><option value="">{t('Leave out')}</option>{editable.map(c => <option key={c.key} value={c.key}>{labelText(c.label, t, lang)}{c.required ? ' *' : ''}</option>)}</select></td></tr>
            ))}</tbody></table>
          {missing.length > 0 && <div className="callout warn small" role="alert"><span>{t('Choose a column for every required field: {list}.', { list: missing.map(k => labelText(editable.find(c => c.key === k).label, t, lang)).join(', ') })}</span></div>}
        </div>
      )}
      {stage === 3 && (
        <div className="stack">
          <p className="small" role="status">{t('{n} rows need attention.', { n: needing.length })}</p>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <label className="checkbox small"><input type="checkbox" checked={onlyIssues} onChange={e => setOnlyIssues(e.target.checked)} /><span>{t('Show only the rows that need attention')}</span></label>
            <button type="button" className="btn btn-sm" onClick={() => setWork(w => w.map(x => (x.dup ? { ...x, skip: true } : x)))}>{t('Leave the duplicates out')}</button>
            {editable.filter(c => c.required).map(c => <FillEmpty key={c.key} col={c} ctx={ctx} onFill={(v) => setWork(w => w.map(x => (x.values[c.key] === undefined || String(x.values[c.key]).trim() === '' ? { ...x, values: { ...x.values, [c.key]: v }, errs: validateRow({ ...x.values, [c.key]: v }, editable, t) } : x)))} />)}
            {editable.filter(c => c.type === 'select' && c.custom === false).map(c => <ReplaceValue key={c.key} col={c} work={work} ctx={ctx} onReplace={(from, to) => setWork(w => w.map(x => (String(x.values[c.key]) === from ? { ...x, values: { ...x.values, [c.key]: to }, errs: validateRow({ ...x.values, [c.key]: to }, editable, t) } : x)))} />)}
          </div>
          <div className="table-wrap" style={{ maxHeight: '50vh' }}>
            <table className="data grid-table"><thead><tr><th scope="col">#</th>{mapping.filter(Boolean).map(k => <th key={k} scope="col">{labelText(editable.find(c => c.key === k).label, t, lang)}</th>)}<th scope="col">{t('Status')}</th><th scope="col"><span className="sr-only">{t('Actions')}</span></th></tr></thead>
              <tbody>{work.map((x, i) => [x, i]).filter(([x]) => !onlyIssues || x.skip || Object.keys(x.errs).length || x.dup).slice(0, 300).map(([x, i]) => (
                <tr key={i} className={x.skip ? 'row-off' : ''}>
                  <td className="muted">{i + 1}</td>
                  {mapping.filter(Boolean).map(k => { const c = editable.find(y => y.key === k); const e = x.errs[k]; return <td key={k} className={e ? 'cell-error' : ''}><CellEditor col={c} value={x.values[k]} row={x.values} ctx={ctx} aria={labelText(c.label, t, lang)} onChange={(v) => recheck(i, k, v)} />{e && <span className="cell-msg"><AlertCircle size={12} aria-hidden="true" /> {e}</span>}</td>; })}
                  <td className="small">{x.skip ? t('Left out') : Object.keys(x.errs).length ? t('To correct') : x.dup ? t('Duplicate') : t('Ready')}</td>
                  <td><button type="button" className="btn btn-ghost btn-sm" onClick={() => setWork(w => w.map((y, j) => (j === i ? { ...y, skip: !y.skip } : y)))}>{x.skip ? t('Keep') : t('Leave out')}</button></td>
                </tr>
              ))}</tbody></table>
          </div>
        </div>
      )}
      {stage === 4 && (
        <div className="stack">
          <ul className="list small"><li>{t('Ready: {n}', { n: ready })}</li><li>{t('With a warning (duplicates kept): {n}', { n: warn })}</li><li>{t('With errors: {n}', { n: bad })}</li><li>{t('Left out: {n}', { n: skipped })}</li></ul>
          {bad > 0 && <fieldset className="fieldset"><legend>{t('Rows with errors')}</legend>
            <label className="checkbox small"><input type="radio" name="werr" checked={withErrors === 'leave'} onChange={() => setWithErrors('leave')} /><span>{t('Leave them out')}</span></label>
            <label className="checkbox small"><input type="radio" name="werr" checked={withErrors === 'import'} onChange={() => setWithErrors('import')} /><span>{t('Import them as rows to correct')}</span></label>
          </fieldset>}
          <fieldset className="fieldset"><legend>{t('Value given to every imported row (optional)')}</legend>
            <div className="row">
              <select className="select select-sm" aria-label={t('Field')} value={common.key} onChange={e => setCommon({ key: e.target.value, value: '' })}><option value="">{t('None')}</option>{editable.map(c => <option key={c.key} value={c.key}>{labelText(c.label, t, lang)}</option>)}</select>
              {common.key && <CellEditor col={editable.find(c => c.key === common.key)} big value={common.value} row={{}} ctx={ctx} aria={t('Value')} onChange={(v) => setCommon(x => ({ ...x, value: v }))} />}
            </div>
          </fieldset>
        </div>
      )}
    </Modal>
  );
}
function FillEmpty({ col, ctx, onFill }) {
  const { t, lang } = ctx;
  const [v, setV] = useState('');
  return <span className="row" style={{ gap: 4 }}><CellEditor col={col} big value={v} row={{}} ctx={ctx} aria={t('Fill the empty cells of {c}', { c: labelText(col.label, t, lang) })} onChange={setV} /><button type="button" className="btn btn-sm" disabled={String(v).trim() === ''} onClick={() => onFill(v)}>{t('Fill the empty {c}', { c: labelText(col.label, t, lang) })}</button></span>;
}
function ReplaceValue({ col, work, ctx, onReplace }) {
  const { t, lang } = ctx;
  const wrong = [...new Set(work.filter(x => x.errs[col.key]).map(x => String(x.values[col.key])))];
  const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  if (!wrong.length) return null;
  return <span className="row" style={{ gap: 4 }}><select className="select select-sm" aria-label={t('Value not in the list')} value={from} onChange={e => setFrom(e.target.value)}><option value="">{t('Replace…')}</option>{wrong.map(w => <option key={w} value={w}>{w}</option>)}</select>
    <CellEditor col={col} big value={to} row={{}} ctx={ctx} aria={t('With')} onChange={setTo} /><button type="button" className="btn btn-sm" disabled={!from || to === ''} onClick={() => onReplace(from, to)}>{t('Replace in {c}', { c: labelText(col.label, t, lang) })}</button></span>;
}

// ---------------------------------------------------------------- Edit Conflicts
export function ConflictsDialog({ conflicts, columns, ctx, onResolve, onClose }) {
  const { t, lang, fmtDate } = ctx;
  return (
    <Modal wide title={t('Edit conflicts')} onClose={onClose} footer={<button type="button" className="btn" onClick={onClose}>{t('Decide later')}</button>}>
      <div className="stack">
        <p className="small">{t('These rows were changed or deleted by someone else since you started. Choose, for each one, which version to keep.')}</p>
        {conflicts.map(c => (
          <div key={c.key} className="card flat stack-8" style={{ padding: 12 }}>
            <div className="small strong">{c.kind === 'deleted' ? t('Deleted on the server') : t('Changed by {who} on {at}', { who: c.by || t('another user'), at: c.at ? fmtDate(c.at) : '—' })}</div>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><div className="xsmall muted">{t('Your version')}</div><div className="small">{columns.slice(0, 4).map(col => displayValue(col, c.mine?.[col.key], c.mine, ctx)).filter(Boolean).join(' · ')}</div></div>
              <div><div className="xsmall muted">{t('Server version')}</div><div className="small">{c.server ? columns.slice(0, 4).map(col => displayValue(col, c.server?.[col.key], c.server, ctx)).filter(Boolean).join(' · ') : '—'}</div></div>
            </div>
            <div className="row">
              <button type="button" className="btn btn-sm btn-primary" onClick={() => onResolve(c, 'mine')}>{t('Keep my version')}</button>
              <button type="button" className="btn btn-sm" onClick={() => onResolve(c, 'server')}>{c.server ? t('Take the server version') : t('Drop my version')}</button>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- column chooser and filters
export function ColumnChooser({ columns, order, hidden, pinned, onChange, onClose, ctx }) {
  const { t, lang } = ctx;
  const ref = useRef(null);
  useEffect(() => { const f = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); }; const k = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }; document.addEventListener('mousedown', f); document.addEventListener('keydown', k, true); return () => { document.removeEventListener('mousedown', f); document.removeEventListener('keydown', k, true); }; }, [onClose]);
  const list = order.map(k => columns.find(c => c.key === k)).filter(Boolean);
  const move = (i, d) => { const n = [...order]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; onChange({ order: n }); };
  return (
    <div className="popover" ref={ref} role="dialog" aria-label={t('Columns')}>
      <p className="xsmall muted" style={{ margin: '0 0 8px' }}>{t('Long optional texts are shown in the Row Editor until you show their column.')}</p>
      <label className="checkbox small"><input type="checkbox" checked={!!pinned} onChange={e => onChange({ pinned: e.target.checked })} /><span>{t('Pin the first column')}</span></label>
      <ul className="col-list">
        {list.map((c, i) => (
          <li key={c.key}>
            <label className="checkbox small"><input type="checkbox" disabled={i === 0} checked={!hidden.includes(c.key)} onChange={e => onChange({ hidden: e.target.checked ? hidden.filter(x => x !== c.key) : [...hidden, c.key] })} /><span>{labelText(c.label, t, lang)}{c.optional ? ` (${t('optional')})` : ''}</span></label>
            <span className="row" style={{ gap: 2 }}><button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={t('Move {c} up', { c: labelText(c.label, t, lang) })} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={14} /></button><button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={t('Move {c} down', { c: labelText(c.label, t, lang) })} disabled={i === list.length - 1} onClick={() => move(i, 1)}><ArrowDown size={14} /></button></span>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange({ hidden: [], order: columns.map(c => c.key), widths: {} })}>{t('Reset the columns')}</button>
    </div>
  );
}

const OP_LABEL = { contains: 'contains', equals: 'equals', not: 'is not', empty: 'is empty', notEmpty: 'is not empty', gt: 'greater than', lt: 'less than' };
export function FilterBuilder({ columns, onAdd, onClose, ctx }) {
  const { t, lang } = ctx;
  const [f, setF] = useState({ key: columns[0]?.key, op: 'contains', value: '' });
  const ref = useRef(null);
  useEffect(() => { const k = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }; document.addEventListener('keydown', k, true); return () => document.removeEventListener('keydown', k, true); }, [onClose]);
  return (
    <div className="popover" ref={ref} role="dialog" aria-label={t('Add a filter')}>
      <div className="stack-8">
        <select className="select select-sm" aria-label={t('Field')} value={f.key} onChange={e => setF({ ...f, key: e.target.value })}>{columns.map(c => <option key={c.key} value={c.key}>{labelText(c.label, t, lang)}</option>)}</select>
        <select className="select select-sm" aria-label={t('Operator')} value={f.op} onChange={e => setF({ ...f, op: e.target.value })}>{OPERATORS.map(o => <option key={o} value={o}>{t(OP_LABEL[o])}</option>)}</select>
        {!['empty', 'notEmpty'].includes(f.op) && <input className="input" aria-label={t('Value')} value={f.value} onChange={e => setF({ ...f, value: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') onAdd(f); }} />}
        <div className="row"><button type="button" className="btn btn-sm btn-primary" onClick={() => onAdd(f)}><Plus size={14} />{t('Add the filter')}</button><button type="button" className="btn btn-sm" onClick={onClose}>{t('Cancel')}</button></div>
      </div>
    </div>
  );
}
export const filterText = (f, columns, ctx) => `${labelText(columns.find(c => c.key === f.key)?.label, ctx.t, ctx.lang)} ${ctx.t(OP_LABEL[f.op])}${['empty', 'notEmpty'].includes(f.op) ? '' : ` “${f.value}”`}`;

export function IssuesList({ issues, columns, onOpen, onClose, ctx }) {
  const { t, lang } = ctx;
  const ref = useRef(null);
  useEffect(() => { const f = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); }; const k = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }; document.addEventListener('mousedown', f); document.addEventListener('keydown', k, true); return () => { document.removeEventListener('mousedown', f); document.removeEventListener('keydown', k, true); }; }, [onClose]);
  return (
    <div className="popover wide" ref={ref} role="dialog" aria-label={t('Issues')}>
      {!issues.length ? <p className="small muted">{t('No error.')}</p> : (
        <ul className="list small">
          {issues.slice(0, 200).map(x => (
            <li key={`${x.key}:${x.col}`}><button type="button" className="list-btn" onClick={() => onOpen(x)}>
              <AlertCircle size={14} className="row-error" aria-hidden="true" />
              <span>{t('Row {n}', { n: x.index + 1 })} · {x.col === '_row' ? t('Row') : labelText(columns.find(c => c.key === x.col)?.label, t, lang)} — {x.message}</span>
            </button></li>
          ))}
        </ul>
      )}
    </div>
  );
}
export { X, norm };
