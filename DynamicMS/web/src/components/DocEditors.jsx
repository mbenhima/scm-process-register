// Document template and document editors: the sections (structure) with their formatting and
// pictures, and the document-level formatting (fonts, sizes, margins, orientation, colours,
// cover, table of contents, numbering, header, footer and logo) with a live preview.
import { memo, useEffect, useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Upload, Image as ImageIcon, Type, Table2, PenLine, Copy } from 'lucide-react';
import { useApp } from '../lib/state.jsx';
import { api, blobUrl } from '../lib/api.js';
import { Field } from './ui.jsx';

export const FONTS = ['Open Sans', 'Montserrat', 'Arial', 'Calibri', 'Times New Roman', 'Georgia'];
export const SECTION_KINDS = ['text', 'data', 'image', 'signature'];

/** A protected picture (organization storage) shown through an object URL. */
export function AuthImage({ file, alt = '', style }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (!file) { setSrc(null); return undefined; }
    const [org, , name] = file.split('/');
    let url = null; let live = true;
    blobUrl(`/orgs/${org}/doc-images/${name}`).then(u => { url = u; if (live) setSrc(u); }).catch(() => setSrc(null));
    return () => { live = false; if (url) URL.revokeObjectURL(url); };
  }, [file]);
  return src ? <img src={src} alt={alt} style={style} /> : <span className="img-placeholder" aria-hidden="true"><ImageIcon size={28} /></span>;
}

export async function uploadPicture(orgId, file) {
  const fd = new FormData(); fd.append('file', file);
  return api(`/orgs/${orgId}/doc-images`, { method: 'POST', body: fd });
}

const ColorField = ({ label, value, onChange, disabled, clearable = true }) => (
  <Field label={label}>{(id) => (
    <div className="row" style={{ gap: 8 }}>
      <input id={id} type="color" className="swatch" disabled={disabled} value={value || '#123A5F'} onChange={e => onChange(e.target.value.toUpperCase())} />
      <input className="input" style={{ maxWidth: 120 }} aria-label={label} disabled={disabled} value={value || ''} placeholder="—" onChange={e => onChange(e.target.value)} />
      {clearable && value && !disabled && <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange('')}>×</button>}
    </div>
  )}</Field>
);

/** Document-level formatting with a preview. `value` is the format object; `onChange(next)`. */
export function FormatEditor({ value, onChange, disabled, orgId, layout }) {
  const { t, toast } = useApp();
  const f = value || {};
  const set = (k, v) => onChange({ ...f, [k]: v === '' ? undefined : v });
  const tri = (k, label) => (
    <Field label={label}>{(id) => <select id={id} className="select" disabled={disabled} value={f[k] === undefined ? '' : f[k] ? 'yes' : 'no'} onChange={e => set(k, e.target.value === '' ? undefined : e.target.value === 'yes')}><option value="">{t('Template default')}</option><option value="yes">{t('Yes')}</option><option value="no">{t('No')}</option></select>}</Field>
  );
  const upload = async (file) => { try { const r = await uploadPicture(orgId, file); onChange({ ...f, logo: 'template', logoFile: r.file }); toast(t('Logo uploaded.')); } catch (e) { toast(e.message, 'error'); } };
  const head = f.headingColor || layout?.titleColor || '#123A5F';
  const th = f.tableHeaderColor || layout?.primaryColor || '#123A5F';
  const acc = f.accentColor || layout?.accentColor || '#1876C6';
  return (
    <div className="grid-main format-editor">
      <div className="stack">
        <fieldset className="fieldset"><legend>{t('Text')}</legend>
          <div className="form-grid">
            <Field label={t('Body font')}>{(id) => <select id={id} className="select" disabled={disabled} value={f.bodyFont || 'Open Sans'} onChange={e => set('bodyFont', e.target.value)}>{FONTS.map(x => <option key={x}>{x}</option>)}</select>}</Field>
            <Field label={t('Heading font')}>{(id) => <select id={id} className="select" disabled={disabled} value={f.headingFont || 'Montserrat'} onChange={e => set('headingFont', e.target.value)}>{FONTS.map(x => <option key={x}>{x}</option>)}</select>}</Field>
            <Field label={t('Body size (pt)')}>{(id) => <input id={id} type="number" min={8} max={14} step={0.5} className="input" disabled={disabled} value={f.bodySize ?? ''} placeholder="10" onChange={e => set('bodySize', e.target.value === '' ? '' : Number(e.target.value))} />}</Field>
            <Field label={t('Heading size (pt)')}>{(id) => <input id={id} type="number" min={10} max={24} className="input" disabled={disabled} value={f.headingSize ?? ''} placeholder="14" onChange={e => set('headingSize', e.target.value === '' ? '' : Number(e.target.value))} />}</Field>
            <Field label={t('Text alignment')}>{(id) => <select id={id} className="select" disabled={disabled} value={f.align || 'left'} onChange={e => set('align', e.target.value)}><option value="left">{t('Left')}</option><option value="justify">{t('Justified')}</option><option value="center">{t('Centered')}</option><option value="right">{t('Right')}</option></select>}</Field>
          </div>
        </fieldset>
        <fieldset className="fieldset"><legend>{t('Page')}</legend>
          <div className="form-grid">
            <Field label={t('Orientation')}>{(id) => <select id={id} className="select" disabled={disabled} value={f.orientation || 'auto'} onChange={e => set('orientation', e.target.value)}><option value="auto">{t('Automatic (registers in landscape)')}</option><option value="portrait">{t('Portrait')}</option><option value="landscape">{t('Landscape')}</option></select>}</Field>
            <Field label={t('Margins (cm)')}>{(id) => <input id={id} type="number" min={1} max={3.5} step={0.1} className="input" disabled={disabled} value={f.marginCm ?? ''} placeholder="1.7" onChange={e => set('marginCm', e.target.value === '' ? '' : Number(e.target.value))} />}</Field>
            {tri('cover', t('Cover page'))}{tri('toc', t('Table of contents'))}{tri('numbered', t('Numbered sections'))}{tri('pageNumbers', t('Page numbers'))}
          </div>
        </fieldset>
        <fieldset className="fieldset"><legend>{t('Colours')}</legend>
          <div className="form-grid">
            <ColorField label={t('Heading colour')} value={f.headingColor} disabled={disabled} onChange={v => set('headingColor', v)} />
            <ColorField label={t('Table header colour')} value={f.tableHeaderColor} disabled={disabled} onChange={v => set('tableHeaderColor', v)} />
            <ColorField label={t('Accent colour')} value={f.accentColor} disabled={disabled} onChange={v => set('accentColor', v)} />
          </div>
          <p className="xsmall muted">{t('Empty fields use the organization layout (Documents › Layout).')}</p>
        </fieldset>
        <fieldset className="fieldset"><legend>{t('Logo, header and footer')}</legend>
          <div className="form-grid">
            <Field label={t('Logo')}>{(id) => <select id={id} className="select" disabled={disabled} value={f.logo || 'organization'} onChange={e => set('logo', e.target.value)}><option value="organization">{t('Organization logo')}</option><option value="template">{t('A logo for this template')}</option><option value="none">{t('No logo')}</option></select>}</Field>
            <Field label={t('Logo position on the cover')}>{(id) => <select id={id} className="select" disabled={disabled} value={f.logoPosition || 'left'} onChange={e => set('logoPosition', e.target.value)}><option value="left">{t('Left')}</option><option value="center">{t('Centered')}</option><option value="right">{t('Right')}</option></select>}</Field>
            {tri('headerLogo', t('Logo in the page header'))}
          </div>
          {f.logo === 'template' && (
            <div className="row">
              {f.logoFile && <AuthImage file={f.logoFile} alt={t('Template logo')} style={{ maxHeight: 48, maxWidth: 160 }} />}
              {!disabled && <label className="btn btn-sm"><Upload size={16} />{f.logoFile ? t('Replace the logo') : t('Upload a logo (PNG or JPEG)')}<input type="file" accept="image/png,image/jpeg" hidden onChange={e => e.target.files[0] && upload(e.target.files[0])} /></label>}
            </div>
          )}
          <div className="form-grid">
            <Field label={t('Header text')}>{(id) => <input id={id} className="input" disabled={disabled} value={typeof f.headerText === 'string' ? f.headerText : ''} placeholder={layout?.headerText || t('Organization layout')} onChange={e => set('headerText', e.target.value)} />}</Field>
            <Field label={t('Footer text')}>{(id) => <input id={id} className="input" disabled={disabled} value={typeof f.footerText === 'string' ? f.footerText : ''} placeholder={layout?.footerText || t('Organization layout')} onChange={e => set('footerText', e.target.value)} />}</Field>
          </div>
        </fieldset>
      </div>
      <div className="stack">
        <div className={`doc-preview ${f.orientation === 'landscape' ? 'landscape' : ''}`} style={{ padding: `${Math.round((f.marginCm || 1.7) * 9)}px`, fontFamily: f.bodyFont || 'Open Sans', fontSize: `${(f.bodySize || 10) * 1.1}px`, textAlign: f.align || 'left' }} aria-label={t('Preview')}>
          {f.logo !== 'none' && <div style={{ textAlign: f.logoPosition || 'left' }}>{f.logo === 'template' && f.logoFile ? <AuthImage file={f.logoFile} style={{ maxHeight: 28, maxWidth: 110 }} /> : <span className="strong" style={{ color: acc, fontFamily: f.headingFont || 'Montserrat' }}>{layout?.logoText || t('Logo')}</span>}</div>}
          <p style={{ color: acc, fontWeight: 700, fontSize: 10, letterSpacing: '.08em', margin: '18px 0 2px' }}>{t('ORGANIZATION · CODE')}</p>
          <div style={{ color: head, fontFamily: f.headingFont || 'Montserrat', fontWeight: 800, fontSize: `${(f.headingSize || 14) * 1.3}px`, lineHeight: 1.2 }}>{t('Quality policy')}</div>
          <div style={{ height: 3, background: th, margin: '10px 0' }} />
          <div style={{ color: head, fontFamily: f.headingFont || 'Montserrat', fontWeight: 800, fontSize: `${(f.headingSize || 14) * 1.05}px` }}>{f.numbered === false ? '' : '1. '}{t('Purpose and scope')}</div>
          <p style={{ color: '#2C3E50', margin: '4px 0 8px' }}>{t('This document defines the commitments of the organization and how they are met, reviewed and improved.')}</p>
          <table className="data" style={{ fontSize: 10 }}><thead><tr><th style={{ background: th }}>{t('Item')}</th><th style={{ background: th }}>{t('Status')}</th></tr></thead><tbody><tr><td>{t('Example row')}</td><td>{t('Published')}</td></tr></tbody></table>
          <p className="xsmall muted" style={{ marginTop: 10, textAlign: 'start' }}>{(typeof f.footerText === 'string' && f.footerText) || layout?.footerText || t('Organization · code · version')}{f.pageNumbers === false ? '' : ` · ${t('Page 1 / 2')}`}</p>
        </div>
        <p className="caption">{t('Preview of the formatting; Word, PDF and Excel files apply it when downloaded.')}</p>
      </div>
    </div>
  );
}

const SectionStyle = memo(function SectionStyle({ style, onChange, disabled }) {
  const { t } = useApp();
  const s = style || {};
  const set = (k, v) => onChange({ ...s, [k]: v === '' || v === false ? undefined : v });
  return (
    <details className="sec-style">
      <summary className="small">{t('Section formatting')}{Object.keys(s).filter(k => s[k] !== undefined).length ? ` · ${Object.keys(s).filter(k => s[k] !== undefined).length}` : ''}</summary>
      <div className="form-grid" style={{ marginTop: 8 }}>
        <Field label={t('Alignment')}>{(id) => <select id={id} className="select" disabled={disabled} value={s.align || ''} onChange={e => set('align', e.target.value)}><option value="">{t('Document default')}</option><option value="left">{t('Left')}</option><option value="justify">{t('Justified')}</option><option value="center">{t('Centered')}</option><option value="right">{t('Right')}</option></select>}</Field>
        <Field label={t('Text size (pt)')}>{(id) => <input id={id} type="number" min={8} max={18} className="input" disabled={disabled} value={s.size ?? ''} placeholder="—" onChange={e => set('size', e.target.value === '' ? '' : Number(e.target.value))} />}</Field>
        <ColorField label={t('Text colour')} value={s.color} disabled={disabled} onChange={v => set('color', v)} />
        <ColorField label={t('Background (callout)')} value={s.background} disabled={disabled} onChange={v => set('background', v)} />
      </div>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        {[['bold', t('Bold')], ['italic', t('Italic')], ['pageBreakBefore', t('Start on a new page')], ['hideTitle', t('Hide the section title')]].map(([k, l]) => <label key={k} className="checkbox"><input type="checkbox" disabled={disabled} checked={!!s[k]} onChange={e => set(k, e.target.checked)} /><span>{l}</span></label>)}
      </div>
    </details>
  );
});

/** Sections of a template or of a draft document: add, reorder, duplicate, delete, edit text,
 *  data source, picture (upload, caption, width, alignment) and formatting. */
export function SectionsEditor({ sections, onChange, disabled, sources, orgId, kinds = SECTION_KINDS, fixedTypes = false }) {
  const { t, lang, toast } = useApp();
  const txt = (v) => (typeof v === 'object' && v ? v[lang] ?? v.en ?? '' : v || '');
  const setTxt = (obj, v) => (typeof obj === 'object' && obj ? { ...obj, [lang]: v } : v);
  const setSec = (i, patch) => onChange(sections.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (i, d) => { const a = [...sections]; const [x] = a.splice(i, 1); a.splice(i + d, 0, x); onChange(a); };
  const add = (type) => onChange([...sections, { key: `s${Date.now().toString(36)}`, type, title: setTxt(typeof sections[0]?.title === 'object' ? {} : '', type === 'image' ? t('Picture') : t('New section')), text: setTxt(typeof sections[0]?.title === 'object' ? {} : '', ''), ...(type === 'image' ? { widthPct: 60, align: 'center' } : {}) }]);
  const upload = async (i, file) => { try { const r = await uploadPicture(orgId, file); setSec(i, { image: r.file }); toast(t('Picture uploaded.')); } catch (e) { toast(e.message, 'error'); } };
  const KIND = { text: [Type, t('Free text')], data: [Table2, t('Project data')], image: [ImageIcon, t('Picture or logo')], signature: [PenLine, t('Approval block')], step: [Table2, t('Step value')] };
  return (
    <div className="stack">
      {sections.map((s, i) => {
        const [I] = KIND[s.type] || KIND.text;
        return (
          <div key={s.key || i} className="doc-section stack-8">
            <div className="row-between">
              <span className="row small strong" style={{ gap: 8 }}><I size={16} aria-hidden="true" />{i + 1}. {txt(s.title) || t('Untitled section')}</span>
              {!disabled && <span className="row" style={{ gap: 4 }}>
                <button type="button" className="btn btn-sm btn-ghost btn-icon" disabled={i === 0} onClick={() => move(i, -1)} aria-label={t('Move up')}><ArrowUp size={16} /></button>
                <button type="button" className="btn btn-sm btn-ghost btn-icon" disabled={i === sections.length - 1} onClick={() => move(i, 1)} aria-label={t('Move down')}><ArrowDown size={16} /></button>
                <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={() => { const a = [...sections]; a.splice(i + 1, 0, { ...s, key: `s${Date.now().toString(36)}` }); onChange(a); }} aria-label={t('Duplicate section')}><Copy size={16} /></button>
                <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={() => onChange(sections.filter((_, j) => j !== i))} aria-label={t('Delete section')}><Trash2 size={16} /></button>
              </span>}
            </div>
            <div className="form-grid">
              <Field label={t('Title')}>{(id) => <input id={id} className="input" disabled={disabled} value={txt(s.title)} onChange={e => setSec(i, { title: setTxt(s.title, e.target.value) })} />}</Field>
              <Field label={t('Type')}>{(id) => <select id={id} className="select" disabled={disabled || fixedTypes} value={s.type} onChange={e => setSec(i, { type: e.target.value })}>{[...new Set([...kinds, s.type])].map(x => <option key={x} value={x}>{KIND[x]?.[1] || x}</option>)}</select>}</Field>
            </div>
            {s.type === 'data' && sources && <Field label={t('Data from the project')} hint={t('The table or text is filled from this project data when the document is generated.')}>{(id) => <select id={id} className="select" disabled={disabled} value={s.source || ''} onChange={e => setSec(i, { source: e.target.value })}>{sources.map(x => <option key={x} value={x}>{x}</option>)}</select>}</Field>}
            {s.type === 'image' && (
              <div className="pic-editor">
                <div className="pic-frame" style={{ textAlign: s.align || 'center' }}>{s.image ? <AuthImage file={s.image} alt={txt(s.caption)} style={{ width: `${s.widthPct || 60}%`, maxHeight: 220, objectFit: 'contain' }} /> : <span className="small muted">{t('No picture yet.')}</span>}</div>
                <div className="stack-8">
                  {!disabled && <label className="btn btn-sm"><Upload size={16} />{s.image ? t('Replace the picture') : t('Upload a picture (PNG or JPEG)')}<input type="file" accept="image/png,image/jpeg" hidden onChange={e => e.target.files[0] && upload(i, e.target.files[0])} /></label>}
                  <div className="form-grid">
                    <Field label={t('Width (% of the page)')}>{(id) => <input id={id} type="range" min={10} max={100} step={5} disabled={disabled} value={s.widthPct || 60} onChange={e => setSec(i, { widthPct: Number(e.target.value) })} />}</Field>
                    <Field label={t('Alignment')}>{(id) => <select id={id} className="select" disabled={disabled} value={s.align || 'center'} onChange={e => setSec(i, { align: e.target.value })}><option value="left">{t('Left')}</option><option value="center">{t('Centered')}</option><option value="right">{t('Right')}</option></select>}</Field>
                  </div>
                  <Field label={t('Caption')}>{(id) => <input id={id} className="input" disabled={disabled} value={txt(s.caption)} onChange={e => setSec(i, { caption: setTxt(s.caption, e.target.value) })} />}</Field>
                </div>
              </div>
            )}
            {['text', 'data', 'image'].includes(s.type) && <Field label={s.type === 'text' ? t('Text') : t('Introduction (optional)')} hint={t('Placeholders: {org} {product} {line} {city} {customer} {supplier} {standards} {date}')}>{(id) => <textarea id={id} className="textarea" disabled={disabled} value={txt(s.text)} onChange={e => setSec(i, { text: setTxt(s.text, e.target.value) })} />}</Field>}
            <SectionStyle style={s.style} disabled={disabled} onChange={(v) => setSec(i, { style: Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined)) })} />
          </div>
        );
      })}
      {!disabled && (
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {kinds.map(k => { const [I, l] = KIND[k]; return <button key={k} type="button" className="btn btn-sm" onClick={() => add(k)}><Plus size={14} /><I size={14} aria-hidden="true" />{l}</button>; })}
        </div>
      )}
    </div>
  );
}
