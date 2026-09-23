import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Send, X, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { post } from '../lib/api.js';
import { Button, Card, IconButton } from './ui.jsx';

export function ChatPanel({ compact = false }) {
  const { t, lang } = useI18n();
  const [msgs, setMsgs] = useState([{ who: 'bot', text: t('Ask about your data, for example "How many active projects?" or "Which gates are pending?", or ask how to use the application.') }]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs]);
  const ask = async (text) => {
    const question = (text ?? q).trim();
    if (!question) return;
    setQ(''); setBusy(true);
    setMsgs((m) => [...m, { who: 'me', text: question }]);
    try {
      const r = await post('/assistant', { question, lang });
      setMsgs((m) => [...m, { who: 'bot', ...r }]);
    } catch (e) { setMsgs((m) => [...m, { who: 'bot', text: e.message, refused: true }]); } finally { setBusy(false); }
  };
  const examples = ['How many active projects?', 'Which gates are pending a decision?', 'Show my tasks', 'What are the top risks?', 'How do I submit a gate?'];
  return (
    <>
      <div className="chat" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.who}`}>
            {m.who === 'bot' && m.mode && <div className="xs" style={{ marginBottom: 4, fontWeight: 700 }}>{m.mode === 'data' ? t('Data answer') : t('Help answer')}{m.label ? ` · ${t(m.label)}` : ''}</div>}
            {m.text}
            {m.rows?.length > 0 && (
              <ul style={{ margin: '8px 0 0', paddingInlineStart: 16 }}>
                {m.rows.slice(0, 6).map((r, k) => <li key={k} className="xs">{Object.values(r).filter((v) => v != null).join(' · ')}</li>)}
              </ul>
            )}
            {m.refs?.length > 0 && (
              <div className="xs" style={{ marginTop: 8 }}>{t('Sources')}: {m.refs.slice(0, 4).map((r, k) => <span key={k}>{k ? ', ' : ''}<Link to={r.link.startsWith('/help') ? '/help' : r.link}>{r.title}</Link></span>)}</div>
            )}
          </div>
        ))}
        <div ref={end} />
      </div>
      {!compact && <div className="row" style={{ padding: '0 16px 8px' }}>{examples.map((e) => <Button key={e} size="sm" onClick={() => ask(t(e))}>{t(e)}</Button>)}</div>}
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); ask(); }}>
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Type a question')} aria-label={t('Type a question')} />
        <Button type="submit" variant="primary" icon={Send} busy={busy}>{t('Ask')}</Button>
      </form>
    </>
  );
}

export default function Assistant() {
  const { can, feature } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  if (!can('assistant.use') || !feature('assistant')) return null;
  return (
    <>
      {open && (
        <Card className="assistant-panel" role="dialog" aria-label={t('AI Assistant')}>
          <div className="row between" style={{ padding: '12px 16px', borderBottom: '1px solid var(--pa-grey-line)' }}>
            <div className="row" style={{ gap: 8 }}><Sparkles size={18} aria-hidden /><strong className="strong">{t('AI Assistant')}</strong></div>
            <IconButton icon={X} size="sm" label={t('Close')} onClick={() => setOpen(false)} />
          </div>
          <ChatPanel compact />
        </Card>
      )}
      <button type="button" className="assistant-fab" aria-label={open ? t('Close AI Assistant') : t('Open AI Assistant')} aria-expanded={open} onClick={() => setOpen((o) => !o)}><MessageSquare aria-hidden /></button>
    </>
  );
}
