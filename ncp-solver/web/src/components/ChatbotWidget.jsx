import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Floating chatbot widget available from every screen (item 2), wrapping the
// existing AI Assistant logic (Query My Data / Ask About the Application).
// Gated the same way the AI Assistant page itself is: assistant.view RBAC,
// and — server-side, via 403 pack_feature_not_included — the Organization's
// Pack/Add-on entitlement (Resolve/Govern need the AI Assistant Add-On;
// standard in Assure). This is a UI convenience, not a separate feature.
export default function ChatbotWidget() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('data');
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [notIncluded, setNotIncluded] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  if (!hasPermission('assistant.view')) return null;

  async function ask(q) {
    const text = (q ?? question).trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setQuestion('');
    setLoading(true);
    try {
      const answerText = mode === 'data'
        ? (await api.post('/assistant/query-data', { question: text })).answer
        : ((await api.post('/assistant/query-app', { question: text })).answers?.[0]?.answer || t('assistant.noMatch'));
      setMessages((m) => [...m, { role: 'assistant', text: answerText }]);
    } catch (err) {
      if (err.data?.error === 'pack_feature_not_included') {
        setNotIncluded(true);
      } else {
        setMessages((m) => [...m, { role: 'assistant', text: err.message || t('assistant.error') }]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t('chatbot.open')}
        className="fixed bottom-5 end-5 z-40 w-14 h-14 rounded-full bg-orange text-white shadow-lg flex items-center justify-center text-2xl hover:bg-orange-deep transition-colors"
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="fixed bottom-24 end-5 z-40 w-[360px] max-w-[92vw] h-[480px] max-h-[75vh] bg-white rounded-card shadow-xl border border-grey-line flex flex-col overflow-hidden">
          <div className="bg-orange text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="font-title font-bold text-sm">{t('chatbot.title')}</div>
            <button onClick={() => setOpen(false)} className="text-white/90 hover:text-white text-lg leading-none">✕</button>
          </div>

          {notIncluded ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div>
                <div className="text-sm text-grey-dark font-semibold mb-1">{t('chatbot.notIncludedTitle')}</div>
                <p className="text-xs text-grey-ink">{t('chatbot.notIncludedBody')}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex border-b border-grey-line shrink-0">
                <button
                  onClick={() => setMode('data')}
                  className={`flex-1 py-2 text-xs font-semibold ${mode === 'data' ? 'text-orange-deep border-b-2 border-orange' : 'text-grey-medium'}`}
                >
                  {t('assistant.modeData')}
                </button>
                <button
                  onClick={() => setMode('app')}
                  className={`flex-1 py-2 text-xs font-semibold ${mode === 'app' ? 'text-orange-deep border-b-2 border-orange' : 'text-grey-medium'}`}
                >
                  {t('assistant.modeApp')}
                </button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 && <p className="text-xs text-grey-medium">{t('chatbot.intro')}</p>}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-card px-3 py-2 text-xs ${m.role === 'user' ? 'bg-orange text-white' : 'bg-grey-light text-grey-dark'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {loading && <div className="text-xs text-grey-medium italic">{t('assistant.thinking')}</div>}
              </div>

              <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="flex gap-2 p-2 border-t border-grey-line shrink-0">
                <input
                  className="input flex-1 text-xs"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={mode === 'data' ? t('assistant.dataPlaceholder') : t('assistant.appPlaceholder')}
                />
                <button type="submit" className="btn-primary text-xs px-3">{t('assistant.ask')}</button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
