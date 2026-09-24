// Request a governed AI suggestion, show it labelled as AI-generated with its tier, source and references,
// and record the human decision (Accepted / Edited / Rejected) in the append-only usage log.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Check, Pencil, X } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { post } from '../lib/api.js';
import { Button, Field, Select, Textarea, useFetch, useToast, Badge } from './ui.jsx';

export const LLM_KEY = 'cortexplm.llm';
export const readLlm = () => { try { return JSON.parse(localStorage.getItem(LLM_KEY) || 'null'); } catch { return null; } };

export default function AiSuggest({ projectId, recordType, recordId, preferred = [], onUse, lockedId }) {
  const { can, feature } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const { data: cases } = useFetch(can('ai.view') && feature('ai') ? `/ai/use-cases${projectId ? `?project=${projectId}` : ''}` : null);
  const usable = useMemo(() => (cases || []).filter((c) => c.effective), [cases]);
  const [ucId, setUcId] = useState('');
  const [text, setText] = useState('');
  const [res, setRes] = useState(null);
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  if (!feature('ai')) return <div className="callout neutral"><Bot size={18} aria-hidden /><div>{t('AI suggestions are not included in this subscription.')}</div></div>;
  if (!can('ai.use')) return null;
  const chosen = lockedId || ucId || usable.find((u) => preferred.includes(u.code))?.id || usable[0]?.id || '';
  const run = async () => {
    setBusy(true); setRes(null); setEdit(null);
    try { setRes(await post('/ai/generate', { useCaseId: Number(chosen), projectId, recordType, recordId, text, llm: readLlm() || undefined })); } catch (e) { toast.err(e); } finally { setBusy(false); }
  };
  const decide = async (outcome) => {
    try {
      await post(`/ai/suggestions/${res.id}/outcome`, { outcome });
      toast.ok(t('Decision recorded: {o}', { o: t(outcome) }));
      if (outcome !== 'Rejected') onUse?.(outcome === 'Edited' ? edit : res.output);
      setRes(null); setEdit(null);
    } catch (e) { toast.err(e); }
  };
  return (
    <div className="stack">
      <div className="form-grid">
        {!lockedId && <Field label={t('AI use case')}>
          <Select value={chosen} onChange={(e) => setUcId(e.target.value)} options={usable.map((u) => ({ value: u.id, label: `${u.code} ${u.name} (${t(u.tier)})` }))} />
        </Field>}
        <Field label={t('Context (optional)')}><input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('Add details for the suggestion')} /></Field>
      </div>
      <div><Button icon={Bot} onClick={run} busy={busy} disabled={!chosen}>{t('Get suggestion')}</Button></div>
      {res && (
        <div className="ai-card">
          <div className="row between">
            <span className="ai-label"><Bot size={14} aria-hidden />{t('AI-generated. A person must review it.')}</span>
            <div className="row" style={{ gap: 8 }}><Badge>{t(res.useCase.tier)}</Badge><Badge>{t(res.source)}</Badge><Badge>{t('Confidence')} {Math.round(res.confidence * 100)}%</Badge></div>
          </div>
          {res.note && <div className="muted" style={{ marginTop: 8 }}>{t(res.note)}</div>}
          {edit == null ? <div className="ai-output">{res.output}</div> : <Textarea value={edit} onChange={(e) => setEdit(e.target.value)} rows={8} />}
          <div className="xs muted">{t('Human checkpoint')}: {res.useCase.checkpoint}</div>
          {res.refs?.length > 0 && <div className="xs" style={{ marginTop: 8 }}>{t('Grounded on')}: {res.refs.map((r, i) => <span key={i}>{i ? '; ' : ''}{r.link ? <Link to={r.link}>{r.ref} {r.title}</Link> : `${r.ref} ${r.title}`}</span>)}</div>}
          <div className="row" style={{ marginTop: 12 }}>
            <Button variant="primary" icon={Check} onClick={() => decide(edit == null ? 'Accepted' : 'Edited')}>{edit == null ? t('Accept') : t('Save modified version')}</Button>
            {edit == null && <Button icon={Pencil} onClick={() => setEdit(res.output)}>{t('Modify')}</Button>}
            <Button variant="danger" icon={X} onClick={() => decide('Rejected')}>{t('Reject')}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
