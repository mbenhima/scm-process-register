import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { Card, Field } from './ui.jsx';
import { getLlmConnection, saveLlmConnection, clearLlmConnection } from '../lib/llmConnection.js';

// The optional Real LLM Provider Connection, hosted inside the AI Use Case
// Library (FR-M6-08): provider, apiKey, model, baseUrl. Stored ONLY in this
// browser's own localStorage - never sent anywhere except once per generation
// request, and never included in any server-side data export. Every AI Use
// Case works fully without this configured; it only adds an optional real-LLM
// narrative on top of the deterministic result, with automatic fallback.
export default function LlmConnectionPanel() {
  const { t } = useI18n();
  const [providers, setProviders] = useState([]);
  const [form, setForm] = useState({ provider: 'anthropic', apiKey: '', model: '', baseUrl: '' });
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => { api.get('/ai-use-cases/providers').then(setProviders).catch(() => {}); }, []);
  useEffect(() => {
    const existing = getLlmConnection();
    if (existing) { setForm((f) => ({ ...f, ...existing, apiKey: existing.apiKey || '' })); setOpen(false); }
  }, []);

  const providerMeta = providers.find((p) => p.code === form.provider);
  const configured = !!getLlmConnection();

  function save(e) {
    e.preventDefault();
    saveLlmConnection(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }
  function clear() {
    clearLlmConnection();
    setForm({ provider: 'anthropic', apiKey: '', model: '', baseUrl: '' });
  }

  return (
    <Card
      title={t('aiUseCase.llmConnectionTitle')}
      action={
        <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs text-grey-medium underline">
          {open ? t('common.close') : (configured ? t('aiUseCase.llmConnectionConfigured') : t('aiUseCase.llmConnectionSetUp'))}
        </button>
      }
    >
      <p className="text-xs text-grey-ink italic mb-3">{t('aiUseCase.llmConnectionIntro')}</p>
      {open && (
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('llm.provider')}>
              <select className="input" value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}>
                {providers.map((p) => (
                  <option key={p.code} value={p.code}>{p.name}{!p.supported ? ` (${t('aiUseCase.llmNotWired')})` : ''}</option>
                ))}
              </select>
            </Field>
            <Field label={t('llm.model')}>
              <input
                className="input" value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                placeholder={providerMeta?.exampleModels?.[0] || ''} list="llm-model-suggestions"
              />
              <datalist id="llm-model-suggestions">
                {providerMeta?.exampleModels?.map((m) => <option key={m} value={m} />)}
              </datalist>
            </Field>
          </div>
          {providerMeta?.needsEndpoint && (
            <Field label={t('llm.endpointUrl')}>
              <input className="input" value={form.baseUrl} onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))} placeholder="https://…" />
            </Field>
          )}
          <Field label={t('llm.apiKey')}>
            <input className="input" type="password" value={form.apiKey} onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))} placeholder={t('llm.apiKeyPlaceholder')} />
          </Field>
          <p className="text-[11px] text-grey-medium italic">{t('aiUseCase.llmConnectionDisclaimer')}</p>
          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary text-xs">{t('common.save')}</button>
            {configured && <button type="button" onClick={clear} className="text-xs text-red-600 font-semibold">{t('llm.clearApiKey')}</button>}
            {saved && <span className="text-xs text-green-700 font-semibold">{t('common.saved')}</span>}
          </div>
        </form>
      )}
    </Card>
  );
}
