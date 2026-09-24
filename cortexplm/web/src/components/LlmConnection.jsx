// Live AI model connection: provider and model drop-downs (with a custom choice), API key and endpoint.
// Stored in this browser only and sent with each AI request; never saved on the server (FR-DA-AI-08).
import { useState } from 'react';
import { PlugZap } from 'lucide-react';
import { useI18n } from '../lib/i18n.jsx';
import { useAuth } from '../lib/auth.jsx';
import { post } from '../lib/api.js';
import { Card, CardHead, Field, Input, Select, Button, useFetch, useToast, Badge } from './ui.jsx';
import { LLM_KEY, readLlm } from './AiSuggest.jsx';

const EMPTY = { provider: 'anthropic', model: 'claude-opus-5', apiKey: '', endpoint: '' };
const CUSTOM = '__custom__';

export default function LlmConnection() {
  const { t } = useI18n();
  const { can } = useAuth();
  const toast = useToast();
  const cat = useFetch('/ai/models');
  const [llm, setLlm] = useState(() => ({ ...EMPTY, ...(readLlm() || {}) }));
  const [saved, setSaved] = useState(() => !!readLlm());
  const [test, setTest] = useState(null);
  const [busy, setBusy] = useState(false);
  const models = cat.data?.models || [];
  const providers = cat.data?.providers || [];
  const known = models.some((m) => m.id === llm.model);
  const [customModel, setCustomModel] = useState(false);
  const isCustomModel = customModel || (models.length > 0 && !!llm.model && !known);
  const needsEndpoint = llm.provider === 'custom';
  const save = (v) => {
    try { if (v) localStorage.setItem(LLM_KEY, JSON.stringify(v)); else localStorage.removeItem(LLM_KEY); } catch { /* storage unavailable */ }
    setSaved(!!v); setTest(null);
    toast.ok(v ? t('AI connection saved in this browser.') : t('AI connection removed. Built-in suggestions are used.'));
    if (!v) { setLlm(EMPTY); setCustomModel(false); }
  };
  const runTest = async () => {
    setBusy(true); setTest(null);
    try { setTest(await post('/ai/test-connection', { llm })); } catch (e) { toast.err(e); } finally { setBusy(false); }
  };
  return (
    <Card>
      <CardHead title={t('Live AI model (optional)')} subtitle={t('Without a key, the application uses its built-in, rule-based suggestions. With a key, suggestions come from the model you choose. The key stays in this browser.')}
        actions={saved ? <Badge tone="s5">{t('Connected in this browser')}</Badge> : <Badge>{t('Built-in engine')}</Badge>} />
      <div className="form-grid">
        <Field label={t('AI provider (LLM)')}>
          <Select value={llm.provider} onChange={(e) => setLlm({ ...llm, provider: e.target.value })} options={providers.map((p) => ({ value: p.id, label: t(p.label) }))} />
        </Field>
        <Field label={t('Model')} hint={t('Choose a model, or "Custom model" to type any other model name.')}>
          <Select value={isCustomModel ? CUSTOM : llm.model} onChange={(e) => { if (e.target.value === CUSTOM) { setCustomModel(true); setLlm({ ...llm, model: '' }); } else { setCustomModel(false); setLlm({ ...llm, model: e.target.value }); } }}
            options={[...models.map((m) => ({ value: m.id, label: `${t(m.label)} · ${m.id}` })), { value: CUSTOM, label: t('Custom model…') }]} />
        </Field>
        {isCustomModel && <Field label={t('Custom model name')} required full><Input value={llm.model} placeholder="claude-…" onChange={(e) => setLlm({ ...llm, model: e.target.value.trim() })} /></Field>}
        <Field label={t('API key')} required full><Input type="password" autoComplete="off" value={llm.apiKey} onChange={(e) => setLlm({ ...llm, apiKey: e.target.value })} /></Field>
        <Field label={t('Endpoint')} required={needsEndpoint} full hint={needsEndpoint ? t('Base URL of a gateway that exposes the Anthropic Messages API.') : t('Leave empty for the provider default.')}>
          <Input value={llm.endpoint} onChange={(e) => setLlm({ ...llm, endpoint: e.target.value })} placeholder="https://" />
        </Field>
      </div>
      {test && <div className={`callout ${test.ok ? 'good' : 'bad'}`} style={{ marginTop: 12 }}>{test.ok ? t('Connection works with {m}.', { m: test.model }) : t(test.reason)}</div>}
      <div className="row" style={{ gap: 8, marginTop: 12 }}>
        <Button variant="primary" disabled={!llm.apiKey || !llm.model || (needsEndpoint && !llm.endpoint)} onClick={() => save(llm)}>{t('Save connection')}</Button>
        {can('ai.use') && <Button icon={PlugZap} busy={busy} disabled={!llm.apiKey || !llm.model} onClick={runTest}>{t('Test connection')}</Button>}
        <Button onClick={() => save(null)}>{t('Remove connection')}</Button>
      </div>
    </Card>
  );
}
