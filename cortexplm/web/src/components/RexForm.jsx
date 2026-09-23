import { useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { post } from '../lib/api.js';
import { Modal, Field, Input, Textarea, Select, Button, useToast, ErrorNote } from './ui.jsx';

export const REX_CATEGORIES = ['Governance', 'Market', 'Technical', 'Supplier', 'Regulatory', 'People'];

// Return on Experience capture, offered at task completion and project closure (never blocking).
export default function RexForm({ projectId, taskId, processTag, defaultTitle = '', onClose, onSaved }) {
  const { t } = useI18n();
  const toast = useToast();
  const [f, setF] = useState({ title: defaultTitle, went_well: '', went_wrong: '', root_cause: '', recommendation: '', category: 'Governance', rating: '4' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const save = async () => {
    setBusy(true); setError(null);
    try { await post('/rex', { ...f, rating: Number(f.rating), project_id: projectId, task_id: taskId, process_tag: processTag }); toast.ok(t('Lesson learned saved.')); onSaved?.(); onClose(); }
    catch (e) { setError(e); } finally { setBusy(false); }
  };
  const ok = ['title', 'went_well', 'went_wrong', 'root_cause', 'recommendation'].every((k) => f[k].trim());
  return (
    <Modal title={t('Record a lesson learned (REX)')} subtitle={t('Optional. It helps future projects and grounds AI suggestions.')} onClose={onClose}
      footer={<><Button onClick={onClose}>{t('Skip')}</Button><Button variant="primary" busy={busy} disabled={!ok} onClick={save}>{t('Save lesson')}</Button></>}>
      <div className="form-grid">
        <Field label={t('Title')} required full><Input value={f.title} onChange={set('title')} /></Field>
        <Field label={t('What went well')} required full><Textarea value={f.went_well} onChange={set('went_well')} rows={2} /></Field>
        <Field label={t('What did not go well')} required full><Textarea value={f.went_wrong} onChange={set('went_wrong')} rows={2} /></Field>
        <Field label={t('Root cause')} required full><Input value={f.root_cause} onChange={set('root_cause')} /></Field>
        <Field label={t('Recommendation')} required full><Textarea value={f.recommendation} onChange={set('recommendation')} rows={2} /></Field>
        <Field label={t('Category')}><Select value={f.category} onChange={set('category')} options={REX_CATEGORIES.map((c) => ({ value: c, label: t(c) }))} /></Field>
        <Field label={t('Effectiveness rating (1-5)')}><Select value={f.rating} onChange={set('rating')} options={['1', '2', '3', '4', '5']} /></Field>
      </div>
      <ErrorNote error={error} />
    </Modal>
  );
}
