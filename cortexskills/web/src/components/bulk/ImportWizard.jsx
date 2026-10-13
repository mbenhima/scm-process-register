// Import of rows from a file or a paste, in five stages shown in a stepper: 1 Template (formats, downloadable
// template with an example row), 2 Upload (drag and drop, file picker or paste; type, size and encoding checked;
// preview of the first 10 rows), 3 Column mapping (detected titles, changeable, sample values, required columns
// checked), 4 Error repair (rows needing attention first, fixed in place and checked again, duplicates in the file
// and against the table, guided "fix all"), 5 Summary (counts, optional value for every row, commit in batches,
// result with Undo for 60 seconds). Cancel is offered at every stage; moving between stages keeps everything typed.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../lib/i18n.jsx';
import { api } from '../../lib/api.js';
import { Modal, Btn, Icon, Select, Field, Spinner } from '../ui.jsx';
import { checkFile, decode, rowsFromText, templateRows, initialMapping, unmappedRequired, samples, buildRepair, revalidate, needsAttention, summarize, suggestFixes, applyFix, DEFAULT_MAX_BYTES } from '../../lib/bulk/importer.js';
import { toCSV, exportName } from '../../lib/bulk/exporter.js';

const STAGES = ['template', 'upload', 'mapping', 'repair', 'summary'];
const PAGE = 100;

export function ImportWizard({ columns, existing, parentName, limits, onClose, onCommit }) {
  const { t, lang } = useI18n();
  const [stage, setStage] = useState(0); const [src, setSrc] = useState(null); const [raw, setRaw] = useState([]); const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  const [pasteText, setPasteText] = useState(''); const [encoding, setEncoding] = useState('auto'); const fileRef = useRef(null); const bytes = useRef(null);
  const [header, setHeader] = useState(false); const [mapping, setMapping] = useState([]);
  const [items, setItems] = useState(null); const [showAll, setShowAll] = useState(false); const [more, setMore] = useState(1); const [fixVal, setFixVal] = useState({});
  const [withErrors, setWithErrors] = useState('skip'); const [tag, setTag] = useState({ key: '', value: '' });
  const [result, setResult] = useState(null); const [left, setLeft] = useState(0); const [askCancel, setAskCancel] = useState(false);
  const maxBytes = limits?.importMaxBytes || DEFAULT_MAX_BYTES; const maxRows = limits?.importMaxRows || 10000;
  const byKey = useMemo(() => Object.fromEntries(columns.map(c => [c.key, c])), [columns]);
  const existingData = useMemo(() => (existing || []).filter(r => r.id).map(r => r.data), [existing]);

  // ---- stage 2: reading the source
  const load = rows => { if (rows.length > maxRows + 1) { setErr(t('imp.tooManyRows', { n: rows.length, max: maxRows })); return; } setRaw(rows); const m = initialMapping(rows, columns); setHeader(m.header); setMapping(m.mapping); setItems(null); setErr(rows.length ? null : t('imp.noRows')); };
  const readText = (u8, enc, meta) => { const d = decode(u8, enc); setSrc({ ...meta, encoding: d.encoding, fallback: d.fallback }); load(rowsFromText(d.text)); };
  const pick = async file => {
    setErr(null); const c = checkFile(file, { maxBytes }); if (!c.ok) { setErr(t('imp.err.' + c.code, { max: Math.round(maxBytes / 1048576) + ' MB' })); return; }
    const meta = { kind: 'file', name: file.name, ext: c.ext, size: file.size };
    if (c.ext === 'xlsx') { setBusy(true); try { const fd = new FormData(); fd.append('file', file); const out = await api('/bulk-entry/parse', { method: 'POST', body: fd }); bytes.current = file; setSrc({ ...meta, sheets: out.sheets, sheet: out.sheet, truncated: out.truncated }); load(out.rows); } catch (e) { setErr(e.message); } finally { setBusy(false); } return; }
    const u8 = new Uint8Array(await file.arrayBuffer()); bytes.current = u8; readText(u8, encoding, meta);
  };
  const reSheet = async sheet => { if (!(bytes.current instanceof File)) return; setBusy(true); try { const fd = new FormData(); fd.append('file', bytes.current); fd.append('sheet', sheet); const out = await api('/bulk-entry/parse', { method: 'POST', body: fd }); setSrc(s => ({ ...s, sheet: out.sheet })); load(out.rows); } catch (e) { setErr(e.message); } finally { setBusy(false); } };
  const reEncode = enc => { setEncoding(enc); if (bytes.current instanceof Uint8Array && src?.kind === 'file') readText(bytes.current, enc, src); };
  const fromPaste = () => { setSrc({ kind: 'paste', name: t('imp.pasted') }); load(rowsFromText(pasteText)); };

  // ---- stage 3 → 4: the repair state is built once, then edited in place
  const missing = unmappedRequired(mapping, columns);
  const toRepair = () => { setItems(buildRepair({ rows: raw, header, mapping, columns, lang, existing: existingData, t })); setShowAll(false); setMore(1); setStage(3); };
  const edit = (i, key, value) => setItems(list => revalidate(list.map(x => (x.i === i ? { ...x, data: { ...x.data, [key]: value } } : x)), columns, existingData, t));
  const toggleSkip = i => setItems(list => list.map(x => (x.i === i ? { ...x, skip: !x.skip } : x)));
  const fixes = items ? suggestFixes(items, columns) : [];
  const doFix = f => setItems(list => revalidate(applyFix(list, f, fixVal[f.kind + f.key + (f.from || '')]), columns, existingData, t));
  const attention = items ? items.filter(needsAttention) : []; const listed = items ? (showAll ? items : attention) : [];
  const mappedCols = mapping.filter(Boolean).map(k => byKey[k]).filter(Boolean);
  const sum = items ? summarize(items) : null;

  // ---- stage 5: commit in batches; Undo stays possible for 60 seconds
  const commit = async () => {
    setBusy(true); setErr(null);
    try {
      const list = items.filter(x => !x.skip && (withErrors === 'keep' || !Object.keys(x.errors).length)).map(x => ({ ...x.data, ...(tag.key && tag.value !== '' ? { [tag.key]: tag.value } : {}) }));
      const r = await onCommit(list, { format: src?.ext || 'text', mapping }); setResult({ ...r, n: list.length }); setLeft(60);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  useEffect(() => { if (!left) return undefined; const h = setTimeout(() => setLeft(x => x - 1), 1000); return () => clearTimeout(h); }, [left]);

  const tpl = templateRows(columns, t);
  const downloadTemplate = async fmt => {
    const name = exportName(`${parentName}-template`, fmt);
    const blob = fmt === 'csv' ? new Blob([toCSV(tpl.columns.map((c, i) => ({ ...c, label: tpl.header[i], type: 'text' })), [Object.fromEntries(tpl.columns.map((c, i) => [c.key, tpl.example[i]]))], t)], { type: 'text/csv;charset=utf-8' })
      : await (await api('/bulk-entry/export', { method: 'POST', body: { name, sheet: 'Template', header: tpl.header, rows: [tpl.example] }, raw: true })).blob();
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  const entered = raw.length > 0 || pasteText.trim() !== '';
  const cancel = () => { if (result || !entered) onClose(); else setAskCancel(true); };
  const next = () => { if (stage === 2) toRepair(); else setStage(s => s + 1); };
  const canNext = stage === 0 || (stage === 1 && raw.length > (header ? 1 : 0) && !err) || (stage === 2 && !missing.length && mapping.some(Boolean)) || stage === 3;

  return (<Modal wide size="xl" title={t('imp.title')} onClose={cancel}
    footer={result ? <><span className="xs muted">{left > 0 ? t('imp.undoLeft', { s: left }) : ''}</span><span className="spacer" />{left > 0 && result.undo && <Btn icon="Undo2" onClick={async () => { await result.undo(); setLeft(0); setResult(r => ({ ...r, undone: true })); }}>{t('common.undo')}</Btn>}<Btn kind="primary" onClick={onClose}>{t('common.close')}</Btn></>
      : <><Btn onClick={cancel}>{t('imp.cancel')}</Btn><span className="spacer" />{stage > 0 && <Btn icon="ChevronLeft" disabled={busy} onClick={() => setStage(s => s - 1)}>{t('imp.back')}</Btn>}
        {stage < 4 ? <Btn kind="primary" icon="ChevronRight" disabled={!canNext || busy} onClick={next}>{t('imp.next')}</Btn> : <Btn kind="primary" icon="Upload" loading={busy} disabled={!sum || sum.ok + sum.warning + (withErrors === 'keep' ? sum.error : 0) === 0} onClick={commit}>{t('imp.commit', { n: sum ? sum.ok + sum.warning + (withErrors === 'keep' ? sum.error : 0) : 0 })}</Btn>}</>}>
    <ol className="stepper" aria-label={t('imp.stages')}>{STAGES.map((s, i) => <li key={s} className={i === stage ? 'on' : i < stage ? 'done' : ''} aria-current={i === stage ? 'step' : undefined}><span className="num">{i < stage ? <Icon name="Check" size={12} /> : i + 1}</span>{t('imp.s.' + s)}</li>)}</ol>
    {err && <p className="field-error" role="alert"><Icon name="CircleAlert" size={12} />{err}</p>}

    {stage === 0 && <div className="stack">
      <p className="small">{t('imp.intro')}</p>
      <ul className="small"><li>{t('imp.fmtXlsx')}</li><li>{t('imp.fmtCsv')}</li><li>{t('imp.fmtPaste')}</li></ul>
      <p className="xs muted">{t('imp.limits', { mb: Math.round(maxBytes / 1048576), rows: maxRows.toLocaleString(lang) })}</p>
      <div className="row"><Btn icon="FileDown" onClick={() => downloadTemplate('xlsx')}>{t('imp.tplXlsx')}</Btn><Btn icon="FileDown" onClick={() => downloadTemplate('csv')}>{t('imp.tplCsv')}</Btn></div>
      <div className="table-wrap auto-h"><table className="tbl compact"><caption className="sr-only">{t('imp.example')}</caption><thead><tr>{tpl.header.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody><tr>{tpl.example.map((v, i) => <td key={i}>{v}</td>)}</tr></tbody></table></div>
      <p className="xs muted">{t('imp.requiredMark')}</p></div>}

    {stage === 1 && <div className="stack">
      <div className={`dropzone ${busy ? 'busy' : ''}`} role="button" tabIndex={0} aria-label={t('imp.drop')} onClick={() => fileRef.current?.click()} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click(); } }}
        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('over'); }} onDragLeave={e => e.currentTarget.classList.remove('over')} onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('over'); const f = e.dataTransfer.files?.[0]; if (f) pick(f); }}>
        {busy ? <Spinner /> : <Icon name="FileUp" size={28} />}<span className="strong small">{t('imp.drop')}</span><span className="xs muted">{t('imp.dropHint')}</span>
        <input ref={fileRef} type="file" hidden accept=".xlsx,.csv,.tsv,.txt" onChange={e => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ''; }} /></div>
      <Field id="imp-paste" label={t('imp.orPaste')} hint={t('imp.pasteHint')}><textarea id="imp-paste" className="input mono" rows={4} value={pasteText} onChange={e => setPasteText(e.target.value)} /></Field>
      <div className="row"><Btn size="sm" icon="ClipboardPaste" disabled={!pasteText.trim()} onClick={fromPaste}>{t('imp.usePaste')}</Btn>
        {src?.kind === 'file' && src.ext !== 'xlsx' && <Field id="imp-enc" label={t('imp.encoding')}><Select id="imp-enc" size="sm" value={encoding} onChange={e => reEncode(e.target.value)} options={[{ value: 'auto', label: t('imp.encAuto') }, { value: 'utf-8', label: 'UTF-8' }, { value: 'windows-1252', label: 'Windows-1252' }, { value: 'iso-8859-1', label: 'ISO-8859-1' }]} /></Field>}
        {src?.sheets?.length > 1 && <Field id="imp-sheet" label={t('imp.sheet')}><Select id="imp-sheet" size="sm" value={src.sheet} onChange={e => reSheet(e.target.value)} options={src.sheets.map(s => ({ value: s, label: s }))} /></Field>}</div>
      {src && raw.length > 0 && <><p className="small" role="status"><Icon name="FileCheck2" size={14} /> {t('imp.loaded', { name: src.name, n: raw.length })}{src.fallback ? ' · ' + t('imp.fallback') : src.encoding ? ` · ${src.encoding.toUpperCase()}` : ''}{src.truncated ? ' · ' + t('imp.truncated', { max: maxRows }) : ''}</p>
        <div className="table-wrap auto-h import-preview"><table className="tbl compact"><caption className="sr-only">{t('imp.preview10')}</caption><tbody>{raw.slice(0, 10).map((r, i) => <tr key={i}><td className="mono xs">{i + 1}</td>{r.map((v, j) => <td key={j}>{v}</td>)}</tr>)}</tbody></table></div>
        <p className="xs muted">{t('imp.preview10')}</p></>}</div>}

    {stage === 2 && <div className="stack">
      <label className="check small"><input type="checkbox" checked={header} onChange={e => { setHeader(e.target.checked); setMapping(initialMapping(e.target.checked ? raw : [raw[0].map(() => ''), ...raw], columns).mapping); }} />{t('paste.header')}</label>
      <div className="map-list">{samples(raw, header).map((sv, i) => <div key={i} className="map-item">
        <div><div className="xs muted">{t('paste.source')}</div><div className="strong small">{(header ? raw[0][i] : '') || t('paste.colN', { n: i + 1 })}</div><div className="xs muted ellipsis">{sv.join(' · ') || '—'}</div></div>
        <Icon name="ArrowRight" size={16} className="muted-ico" />
        <Select size="sm" aria-label={`${t('paste.target')} — ${(header ? raw[0][i] : '') || t('paste.colN', { n: i + 1 })}`} value={mapping[i] || ''} onChange={e => setMapping(m => { const n = [...m]; n[i] = e.target.value || null; return n; })}
          options={[{ value: '', label: t('paste.ignore') }, ...columns.filter(c => c.key === mapping[i] || !mapping.includes(c.key)).map(c => ({ value: c.key, label: (c.required ? '* ' : '') + c.label }))]} /></div>)}</div>
      {missing.length > 0 ? <p className="field-error" role="alert"><Icon name="CircleAlert" size={12} />{t('imp.missingRequired', { list: missing.map(c => c.label).join(', ') })}</p> : <p className="xs muted"><Icon name="CircleCheck" size={12} className="saved-ico" /> {t('imp.allRequired')}</p>}</div>}

    {stage === 3 && items && <div className="stack">
      <div className="row"><span className={`pill ${attention.length ? 's2' : 's4'}`}>{attention.length ? t('imp.attention', { n: attention.length }) : t('imp.noAttention')}</span><span className="spacer" /><label className="check small"><input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} />{t('imp.showAll', { n: items.length })}</label></div>
      {fixes.length > 0 && <div className="card flat stack fix-all"><div className="eyebrow">{t('imp.fixAll')}</div>{fixes.map(f => { const c = byKey[f.key]; const k = f.kind + f.key + (f.from || ''); return <div key={k} className="row fix-row">
        <span className="small">{f.kind === 'fill' ? t('imp.fixFill', { n: f.n, c: c?.label }) : f.kind === 'replace' ? t('imp.fixReplace', { n: f.n, c: c?.label, v: f.from }) : t('imp.fixSkip', { n: f.n })}</span>
        {f.kind === 'skipDuplicates' ? <span /> : (c?.type === 'select' ? <Select size="sm" aria-label={c.label} value={fixVal[k] || ''} onChange={e => setFixVal(s => ({ ...s, [k]: e.target.value }))} options={(c.options || []).map(o => ({ value: String(o.value ?? o), label: o.label ?? String(o) }))} /> : <input className="input sm" aria-label={c?.label} type={c?.type === 'date' ? 'date' : 'text'} value={fixVal[k] || ''} onChange={e => setFixVal(s => ({ ...s, [k]: e.target.value }))} />)}
        <Btn size="sm" disabled={f.kind !== 'skipDuplicates' && !fixVal[k]} onClick={() => doFix(f)}>{t('imp.apply')}</Btn></div>; })}</div>}
      <div className="table-wrap auto-h import-repair"><table className="tbl compact"><caption className="sr-only">{t('imp.s.repair')}</caption>
        <thead><tr><th scope="col">#</th><th scope="col">{t('imp.state')}</th>{mappedCols.map(c => <th key={c.key} scope="col">{c.label}</th>)}<th scope="col">{t('imp.skip')}</th></tr></thead>
        <tbody>{listed.slice(0, PAGE * more).map(x => <tr key={x.i} className={x.skip ? 'skipped' : Object.keys(x.errors).length ? 'row-invalid' : ''}>
          <td className="mono xs">{x.i + 1}</td>
          <td>{x.skip ? <span className="pill xs">{t('imp.skipped')}</span> : Object.keys(x.errors).length ? <span className="pill xs s1">{t('imp.error')}</span> : x.duplicate ? <span className="pill xs s2">{t(x.duplicate.kind === 'existing' ? 'imp.dupExisting' : 'imp.dupFile', { n: (x.duplicate.of ?? 0) + 1 })}</span> : <span className="pill xs s4">{t('imp.ok')}</span>}</td>
          {mappedCols.map(c => { const v = x.data[c.key]; const e = x.errors[c.key]; return <td key={c.key} className={e ? 'cell-invalid' : ''}>
            {c.type === 'select' ? <Select size="sm" aria-label={`${c.label} — ${x.i + 1}`} value={String(v ?? '')} invalid={!!e} onChange={ev => edit(x.i, c.key, ev.target.value)} options={(c.options || []).map(o => ({ value: String(o.value ?? o), label: o.label ?? String(o) })).concat(v && !(c.options || []).some(o => String(o.value ?? o) === String(v)) ? [{ value: String(v), label: String(v) }] : [])} />
              : c.type === 'boolean' ? <input type="checkbox" aria-label={`${c.label} — ${x.i + 1}`} checked={v === true || v === 'true'} onChange={ev => edit(x.i, c.key, ev.target.checked)} />
              : <input className="input sm" aria-label={`${c.label} — ${x.i + 1}`} aria-invalid={e ? true : undefined} type={c.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(String(v ?? '')) ? 'date' : 'text'} value={String(v ?? '')} onChange={ev => edit(x.i, c.key, ev.target.value)} />}
            {e && <span className="field-error"><Icon name="CircleAlert" size={12} />{e}</span>}</td>; })}
          <td><input type="checkbox" aria-label={t('imp.skipRow', { n: x.i + 1 })} checked={x.skip} onChange={() => toggleSkip(x.i)} /></td></tr>)}</tbody></table></div>
      {listed.length > PAGE * more && <Btn size="sm" kind="ghost" onClick={() => setMore(m => m + 1)}>{t('imp.showMore', { n: listed.length - PAGE * more })}</Btn>}
      {!listed.length && <p className="small"><Icon name="CircleCheck" size={14} className="saved-ico" /> {t('imp.allGood')}</p>}</div>}

    {stage === 4 && sum && !result && <div className="stack">
      <div className="grid g-4 imp-sum"><div className="card flat"><div className="kpi-value">{sum.ok}</div><div className="xs">{t('imp.sumOk')}</div></div><div className="card flat"><div className="kpi-value">{sum.warning}</div><div className="xs">{t('imp.sumWarning')}</div></div><div className="card flat"><div className="kpi-value">{sum.error}</div><div className="xs">{t('imp.sumError')}</div></div><div className="card flat"><div className="kpi-value">{sum.skipped}</div><div className="xs">{t('imp.sumSkipped')}</div></div></div>
      {sum.error > 0 && <fieldset className="stack"><legend className="small strong">{t('imp.withErrors', { n: sum.error })}</legend>
        <label className="check small"><input type="radio" name="imp-err" checked={withErrors === 'skip'} onChange={() => setWithErrors('skip')} />{t('imp.errSkip')}</label>
        <label className="check small"><input type="radio" name="imp-err" checked={withErrors === 'keep'} onChange={() => setWithErrors('keep')} />{t('imp.errKeep')}</label></fieldset>}
      <fieldset className="row"><legend className="small strong">{t('imp.tag')}</legend>
        <Select size="sm" aria-label={t('imp.tagField')} value={tag.key} onChange={e => setTag({ key: e.target.value, value: '' })} options={[{ value: '', label: t('imp.noTag') }, ...columns.filter(c => c.type === 'select' || c.carry).map(c => ({ value: c.key, label: c.label }))]} />
        {tag.key && (byKey[tag.key]?.type === 'select' ? <Select size="sm" aria-label={t('mre.value')} value={tag.value} onChange={e => setTag(s => ({ ...s, value: e.target.value }))} options={(byKey[tag.key].options || []).map(o => ({ value: String(o.value ?? o), label: o.label ?? String(o) }))} /> : <input className="input sm" aria-label={t('mre.value')} value={tag.value} onChange={e => setTag(s => ({ ...s, value: e.target.value }))} />)}
        <span className="xs muted">{t('imp.tagHint')}</span></fieldset>
      <p className="xs muted">{t('imp.batchNote', { n: limits?.batch || 250 })}</p>
      {busy && <p className="small" role="status"><Spinner /> {t('imp.importing')}</p>}</div>}
    {result && <div className="stack" role="status"><p className="strong">{result.undone ? t('imp.undone') : t('imp.done', { ok: result.ok, bad: result.bad })}</p>{!result.undone && result.bad > 0 && <p className="small">{t('imp.doneBad', { n: result.bad })}</p>}</div>}

    {askCancel && <Modal title={t('imp.cancelTitle')} onClose={() => setAskCancel(false)} footer={<><Btn onClick={() => setAskCancel(false)}>{t('imp.keepGoing')}</Btn><Btn kind="danger" onClick={onClose}>{t('imp.cancelYes')}</Btn></>}><p className="small">{t('imp.cancelText')}</p></Modal>}
  </Modal>);
}
