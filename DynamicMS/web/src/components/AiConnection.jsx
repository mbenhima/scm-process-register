// The two live-model connections and their order (FR-DA-AI-08, -15, -16, -24): the shared
// Organization model, administered, its key stored encrypted on the server; and the personal
// connection of one user, its key kept in this browser only.
import { useEffect, useState } from 'react';
import { KeyRound, Info } from 'lucide-react';
import { useApp } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { readPersonal, writePersonal } from '../lib/personalai.js';
import { Card, Field } from './ui.jsx';

export const TEST_LABEL = { works: 'Works', authentication: 'Authentication failure', model: 'Model not found', rate: 'Rate limited', unreachable: 'Unreachable', disabled: 'The provider is disabled; enable it first.', invalid: 'Choose a provider and a model and type the key (and the HTTPS endpoint for a custom model).' };

export function ModelPrecedence() {
  const { t } = useApp();
  return (
    <div className="callout small" role="note">
      <Info size={16} aria-hidden="true" />
      <div>
        <div className="strong">{t('Which model answers')}</div>
        <ol style={{ margin: '4px 0 0', paddingInlineStart: 18 }}>
          <li>{t('The model chosen for the AI use case, on the Organization connection.')}</li>
          <li>{t('Else the Organization model: shared by every user, set by an administrator, its key stored encrypted on the server.')}</li>
          <li>{t('Else your personal connection: for you only, its key kept in this browser and sent with each request, never stored on the server.')}</li>
          <li>{t('Else the built-in engine (rules and retrieval on your data), which is also the fallback on any error.')}</li>
        </ol>
      </div>
    </div>
  );
}

export function PersonalConnection() {
  const { t, toast } = useApp();
  const [providers, setProviders] = useState(null);
  const [f, setF] = useState(() => readPersonal() || { provider: 'anthropic', model: '', baseUrl: '', apiKey: '' });
  const [test, setTest] = useState(null);
  const saved = !!readPersonal();
  useEffect(() => { api('/ai/providers').then(r => setProviders(r.providers)).catch(() => setProviders([])); }, []);
  const prov = providers?.find(p => p.id === f.provider) || null;
  const save = () => { writePersonal({ ...f }); toast(t('Personal connection saved in this browser.')); setTest(null); };
  const clear = () => { writePersonal(null); setF({ provider: 'anthropic', model: '', baseUrl: '', apiKey: '' }); toast(t('Personal connection removed from this browser.')); };
  const run = async () => {
    const prev = readPersonal(); writePersonal({ ...f });
    try { const r = await api('/ai/personal/test', { method: 'POST', body: {} }); setTest({ ok: r.ok, message: t(TEST_LABEL[r.category] || r.message) }); } catch (e) { setTest({ ok: false, message: e.message }); } finally { writePersonal(prev); }
  };
  return (
    <Card title={t('Personal AI connection')}>
      <div className="stack">
        <p className="small muted">{t('Used only when the organization has no live model. The key stays in this browser: it is sent with each AI request and never stored, logged or returned by the server.')}</p>
        {providers && (
          <>
            <div className="form-grid">
              <Field label={t('Provider')}>{(id) => <select id={id} className="select" value={f.provider} onChange={e => { const p = providers.find(x => x.id === e.target.value); setF({ ...f, provider: e.target.value, model: p?.models[0]?.id || '' }); }}>{providers.filter(p => p.kind !== 'builtin').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}</Field>
              <Field label={t('Model')}>{(id) => (prov?.customModel || prov?.kind === 'azure' || !prov?.models.length) ? <input id={id} className="input" value={f.model} onChange={e => setF({ ...f, model: e.target.value })} placeholder={t('Model name')} /> : <select id={id} className="select" value={f.model} onChange={e => setF({ ...f, model: e.target.value })}><option value="">{t('Choose')}</option>{prov.models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>}</Field>
            </div>
            {prov?.needsBaseUrl && <Field label={t('Endpoint URL (HTTPS)')} required>{(id) => <input id={id} className="input" value={f.baseUrl} onChange={e => setF({ ...f, baseUrl: e.target.value })} placeholder="https://llm.example.org/v1" />}</Field>}
            <Field label={t('API key')} hint={t('Kept in this browser only.')}>{(id) => <div className="row" style={{ gap: 8 }}><KeyRound size={16} aria-hidden="true" /><input id={id} className="input" type="password" autoComplete="off" value={f.apiKey} onChange={e => setF({ ...f, apiKey: e.target.value })} /></div>}</Field>
            <div className="row">
              <button type="button" className="btn btn-primary" disabled={!f.apiKey || !f.model} onClick={save}>{t('Save in this browser')}</button>
              <button type="button" className="btn" disabled={!f.apiKey || !f.model} onClick={run}>{t('Test the connection')}</button>
              {saved && <button type="button" className="btn btn-ghost" onClick={clear}>{t('Remove')}</button>}
              {test && <span className={`tag ${test.ok ? 's5' : 's1'}`} role="status">{test.message}</span>}
            </div>
          </>
        )}
        <ModelPrecedence />
      </div>
    </Card>
  );
}
