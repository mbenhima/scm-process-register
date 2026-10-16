// Review of an AI proposal of several items (FR-DA-AI-26): each item editable in place, Accept
// or Reject one by one or all at once, with the label "AI-generated — to be reviewed by a person",
// the tier, the AI Use Case, the engine and, when the live model was not used, the reason, the
// references retrieved, the human checkpoint and the exact prompt. Every item's outcome is
// logged — an item changed before its acceptance as Edited (FR-DA-AI-07).
import { useState } from 'react';
import { Sparkles, Check, X, FileText } from 'lucide-react';
import { api } from '../lib/api.js';
import { tx, Modal } from './ui.jsx';
import { CellEditor, labelText } from './multientry/cells.jsx';

export default function AiProposal({ note, columns, ctx, onAccept, onClose }) {
  const { t, lang } = ctx;
  const [items, setItems] = useState(() => (note.rows || []).map(v => ({ values: v, original: v, state: 'pending' })));
  const [prompt, setPrompt] = useState(false);
  const shown = columns.filter(c => !c.readOnly && !c.computed && (note.rows || []).some(r => r[c.key] !== undefined && r[c.key] !== ''));
  const log = (i, outcome) => { if (note.logId) api('/ai/feedback', { method: 'POST', body: { logId: note.logId, item: i, outcome } }).catch(() => {}); };
  const decide = (idx, accept) => {
    const list = idx === 'all' ? items.map((x, i) => [x, i]).filter(([x]) => x.state === 'pending') : [[items[idx], idx]];
    const accepted = [];
    for (const [x, i] of list) {
      const edited = JSON.stringify(x.values) !== JSON.stringify(x.original);
      log(i, accept ? (edited ? 'Edited' : 'Accepted') : 'Rejected');
      if (accept) accepted.push(x.values);
    }
    if (accepted.length) onAccept(accepted);
    setItems(its => its.map((x, i) => (list.some(([, j]) => j === i) ? { ...x, state: accept ? 'accepted' : 'rejected' } : x)));
  };
  const pending = items.filter(x => x.state === 'pending').length;
  const engine = String(note.engine || '');
  const builtin = !engine || engine.startsWith('rules');
  if (note.error && !items.length) return <div className="callout warn small" role="status"><span>{t('Language model: {e}', { e: note.error })}</span><button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>{t('Close')}</button></div>;
  return (
    <section className="ai-proposal card flat" aria-label={t('AI proposal')}>
      <div className="row-between" style={{ flexWrap: 'wrap', gap: 8 }}>
        <span className="row" style={{ gap: 8 }}><Sparkles size={18} aria-hidden="true" /><span className="strong">{t('AI-generated — to be reviewed by a person')}</span>
          {note.usecase && <span className="tag">{note.usecase.tier === 'Augmented' ? t('Augmented AI') : t('Assistive AI')}</span>}</span>
        <span className="row" style={{ gap: 6 }}>
          <button type="button" className="btn btn-sm btn-success" disabled={!pending} onClick={() => decide('all', true)}><Check size={14} />{t('Accept all')}</button>
          <button type="button" className="btn btn-sm" disabled={!pending} onClick={() => decide('all', false)}><X size={14} />{t('Reject all')}</button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>{t('Close')}</button>
        </span>
      </div>
      <dl className="kv small" style={{ margin: '8px 0' }}>
        {note.usecase && <div><dt>{t('AI use case')}</dt><dd>{note.usecase.code} — {tx(note.usecase.name, lang)}</dd></div>}
        <div><dt>{t('Engine')}</dt><dd>{builtin ? t('Built-in engine (rules and retrieval)') : engine.replace(/^llm:/, '')}</dd></div>
        {(note.warning || (builtin && note.error)) && <div><dt>{t('Why the live model was not used')}</dt><dd>{note.warning || note.error}</dd></div>}
        {note.usecase?.checkpoint && <div><dt>{t('Human checkpoint')}</dt><dd>{tx(note.usecase.checkpoint, lang)}</dd></div>}
        {note.sources?.length > 0 && <div><dt>{t('References retrieved')}</dt><dd>{note.sources.map(s => s.title || s.id).join(' · ')}</dd></div>}
      </dl>
      {note.prompt && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setPrompt(true)}><FileText size={14} />{t('View the exact prompt')}</button>}
      <p className="small muted" role="status">{t('{n} items proposed; {p} to review.', { n: items.length, p: pending })}</p>
      <ol className="ai-items">
        {items.map((x, i) => (
          <li key={i} className={`ai-item ${x.state}`}>
            <div className="form-grid">
              {shown.map(c => (
                <label key={c.key} className="field" style={{ gridColumn: c.type === 'textarea' ? '1 / -1' : undefined }}>
                  <span className="xsmall muted">{labelText(c.label, t, lang)}</span>
                  {x.state === 'pending' ? <CellEditor col={c} big value={x.values[c.key]} row={x.values} ctx={ctx} aria={`${labelText(c.label, t, lang)} — ${t('item {n}', { n: i + 1 })}`} onChange={(v) => setItems(its => its.map((y, j) => (j === i ? { ...y, values: { ...y.values, [c.key]: v } } : y)))} />
                    : <span className="small">{typeof x.values[c.key] === 'object' ? tx(x.values[c.key], lang) : String(x.values[c.key] ?? '')}</span>}
                </label>
              ))}
            </div>
            {x.state === 'pending' ? (
              <div className="row" style={{ gap: 6 }}>
                <button type="button" className="btn btn-sm btn-success" onClick={() => decide(i, true)}><Check size={14} />{t('Accept')}</button>
                <button type="button" className="btn btn-sm" onClick={() => decide(i, false)}><X size={14} />{t('Reject')}</button>
              </div>
            ) : <span className={`tag ${x.state === 'accepted' ? 's5' : 's2'}`}>{x.state === 'accepted' ? t('Accepted') : t('Rejected')}</span>}
          </li>
        ))}
      </ol>
      {prompt && note.prompt && (
        <Modal wide title={t('Exact prompt sent')} onClose={() => setPrompt(false)}>
          <div className="small strong">{t('System')}</div><pre className="small" style={{ whiteSpace: 'pre-wrap' }}>{note.prompt.system}</pre>
          <div className="small strong">{t('User')}</div><pre className="small" style={{ whiteSpace: 'pre-wrap' }}>{note.prompt.user}</pre>
        </Modal>
      )}
    </section>
  );
}
