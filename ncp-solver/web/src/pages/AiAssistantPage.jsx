import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';

function ChatPane({ mode, placeholder, examples, onAsk }) {
  const { t } = useI18n();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function ask(q) {
    const text = (q ?? question).trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setQuestion('');
    setLoading(true);
    try {
      const answerText = await onAsk(text);
      setMessages((m) => [...m, { role: 'assistant', text: answerText }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: err.data?.error === 'question_required' ? t('assistant.askSomething') : (err.message || t('assistant.error')) }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-[300px]">
        {messages.length === 0 && (
          <div className="text-sm text-grey-medium">
            <p className="mb-2">{t('assistant.tryAsking')}</p>
            <div className="flex flex-wrap gap-2">
              {examples.map((ex) => (
                <button key={ex} onClick={() => ask(ex)} className="badge bg-grey-light text-grey-ink hover:bg-orange-tint hover:text-orange-deep text-left">{ex}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-card px-3 py-2 text-sm ${m.role === 'user' ? 'bg-orange text-white' : 'bg-grey-light text-grey-dark'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-grey-medium italic">{t('assistant.thinking')}</div>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="flex gap-2">
        <input className="input flex-1" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={placeholder} />
        <button type="submit" className="btn-primary">{t('assistant.ask')}</button>
      </form>
    </div>
  );
}

export default function AiAssistantPage() {
  const { t } = useI18n();
  const [mode, setMode] = useState('data');

  async function askData(question) {
    const r = await api.post('/assistant/query-data', { question });
    return r.answer;
  }
  async function askApp(question) {
    const r = await api.post('/assistant/query-app', { question });
    if (!r.answers?.length) return t('assistant.noMatch');
    return r.answers[0].answer;
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="eyebrow">{t('nav.assistant')}</div>
        <h1 className="font-title font-bold text-2xl text-grey-dark">{t('assistant.title')}</h1>
        <p className="text-sm text-grey-ink mt-1 max-w-2xl">{t('assistant.subtitle')}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setMode('data')}
          className={`px-4 py-2 rounded-md text-sm font-semibold border ${mode === 'data' ? 'bg-orange text-white border-orange' : 'bg-white text-grey-ink border-grey-line'}`}
        >
          {t('assistant.modeData')}
        </button>
        <button
          onClick={() => setMode('app')}
          className={`px-4 py-2 rounded-md text-sm font-semibold border ${mode === 'app' ? 'bg-orange text-white border-orange' : 'bg-white text-grey-ink border-grey-line'}`}
        >
          {t('assistant.modeApp')}
        </button>
      </div>

      <div className="card p-5" style={{ minHeight: '440px' }}>
        {mode === 'data' ? (
          <>
            <p className="text-xs text-grey-medium italic mb-3">{t('assistant.dataHint')}</p>
            <ChatPane
              mode="data"
              placeholder={t('assistant.dataPlaceholder')}
              examples={[t('assistant.ex1'), t('assistant.ex2'), t('assistant.ex3'), t('assistant.ex4')]}
              onAsk={askData}
            />
          </>
        ) : (
          <>
            <p className="text-xs text-grey-medium italic mb-3">{t('assistant.appHint')}</p>
            <ChatPane
              mode="app"
              placeholder={t('assistant.appPlaceholder')}
              examples={[t('assistant.ex5'), t('assistant.ex6'), t('assistant.ex7'), t('assistant.ex8')]}
              onAsk={askApp}
            />
          </>
        )}
      </div>
    </div>
  );
}
