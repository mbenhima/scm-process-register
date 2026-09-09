import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Field, EmptyState } from '../components/ui.jsx';

export default function LlmSettingsPage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('llmConfig.manage');
  const [providers, setProviders] = useState([]);
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saved, setSaved] = useState(false);

  function load() {
    api.get('/llm-config').then((c) => { setConfig(c); setForm({ provider: c.provider, model: c.model || '', endpoint_url: c.endpoint_url || '', is_enabled: !!c.is_enabled }); });
  }
  useEffect(load, []);
  useEffect(() => { api.get('/llm-config/providers').then(setProviders).catch(() => {}); }, []);

  if (!config || !form) return <EmptyState message={t('common.loading')} />;
  const providerMeta = providers.find((p) => p.code === form.provider);

  async function save(e) {
    e.preventDefault();
    const body = { provider: form.provider, model: form.model, endpoint_url: form.endpoint_url, is_enabled: form.is_enabled };
    if (apiKeyInput) body.api_key = apiKeyInput;
    const updated = await api.put('/llm-config', body);
    setConfig(updated);
    setApiKeyInput('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }
  async function clearApiKey() {
    if (!confirm(t('common.confirm'))) return;
    const updated = await api.put('/llm-config', { clear_api_key: true });
    setConfig(updated);
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="eyebrow">{t('nav.governanceGroup')}</div>
        <h1 className="font-title font-bold text-2xl text-grey-dark">{t('llm.title')}</h1>
        <p className="text-sm text-grey-ink mt-1 max-w-2xl">{t('llm.intro')}</p>
      </div>

      <Card>
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('llm.provider')}>
              <select className="input" value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} disabled={!canManage}>
                {providers.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
            </Field>
            <Field label={t('llm.model')}>
              <input
                className="input" value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} disabled={!canManage}
                placeholder={providerMeta?.exampleModels?.[0] || ''}
                list="llm-model-suggestions"
              />
              <datalist id="llm-model-suggestions">
                {providerMeta?.exampleModels?.map((m) => <option key={m} value={m} />)}
              </datalist>
            </Field>
          </div>

          {providerMeta?.needsEndpoint && (
            <Field label={t('llm.endpointUrl')}>
              <input className="input" value={form.endpoint_url} onChange={(e) => setForm((f) => ({ ...f, endpoint_url: e.target.value }))} disabled={!canManage} placeholder="https://…" />
            </Field>
          )}

          <Field label={t('llm.apiKey')}>
            <input
              className="input" type="password" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} disabled={!canManage}
              placeholder={config.has_api_key ? `${t('llm.apiKeyConfigured')} (•••• ${config.api_key_last4})` : t('llm.apiKeyPlaceholder')}
            />
            {canManage && config.has_api_key && (
              <button type="button" onClick={clearApiKey} className="text-xs text-red-600 font-semibold mt-1">{t('llm.clearApiKey')}</button>
            )}
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_enabled} onChange={(e) => setForm((f) => ({ ...f, is_enabled: e.target.checked }))} disabled={!canManage} />
            {t('llm.enabled')}
          </label>

          <p className="text-xs text-grey-medium italic">{t('llm.disclaimer')}</p>

          {canManage && (
            <div className="flex items-center gap-3">
              <button type="submit" className="btn-primary">{t('common.save')}</button>
              {saved && <span className="text-xs text-green-700 font-semibold">{t('common.saved')}</span>}
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
