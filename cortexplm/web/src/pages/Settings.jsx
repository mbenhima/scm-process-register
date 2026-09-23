// Personal settings: profile, language, navigation bar, password and the optional live AI model connection.
import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { put } from '../lib/api.js';
import { PageHeader, Card, CardHead, Field, Input, Select, Segmented, Button, Check, ErrorNote, useToast, Badge } from '../components/ui.jsx';
import { LLM_KEY, readLlm } from '../components/AiSuggest.jsx';

export default function Settings() {
  const { t, languages, lang } = useI18n();
  const { me, saveLanguage, savePrefs } = useAuth();
  const toast = useToast();
  const prefs = me.user.prefs || {};
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwErr, setPwErr] = useState(null);
  const [llm, setLlm] = useState(() => readLlm() || { provider: 'anthropic', model: 'claude-opus-5', apiKey: '', endpoint: '' });
  const changePw = async () => {
    setPwErr(null);
    if (pw.next !== pw.confirm) { setPwErr(new Error(t('The two new passwords are different.'))); return; }
    try { await put('/auth/password', { current: pw.current, next: pw.next }); toast.ok(t('Password changed.')); setPw({ current: '', next: '', confirm: '' }); } catch (e) { setPwErr(e); }
  };
  const saveLlm = (v) => {
    try { if (v) localStorage.setItem(LLM_KEY, JSON.stringify(v)); else localStorage.removeItem(LLM_KEY); } catch { /* storage unavailable */ }
    toast.ok(v ? t('AI connection saved in this browser.') : t('AI connection removed. Built-in suggestions are used.'));
    if (!v) setLlm({ provider: 'anthropic', model: 'claude-opus-5', apiKey: '', endpoint: '' });
  };
  return (
    <div className="page">
      <PageHeader eyebrow={t('My account')} title={t('Settings')} subtitle={t('These settings apply to your account only.')} />
      <div className="grid two">
        <div className="stack">
          <Card>
            <CardHead title={t('Profile')} />
            <dl className="kv">
              <dt>{t('Name')}</dt><dd>{me.user.name}</dd><dt>{t('E-mail')}</dt><dd>{me.user.email}</dd>
              <dt>{t('Job title')}</dt><dd>{me.user.title || '—'}</dd><dt>{t('Organization')}</dt><dd>{me.organization?.name}</dd>
              <dt>{t('Roles')}</dt><dd><div className="row" style={{ gap: 4 }}>{me.roles.map((r) => <Badge key={r.id || r}>{r.name ? `${r.id} ${t(r.name)}` : r}</Badge>)}</div></dd>
            </dl>
          </Card>
          <Card>
            <CardHead title={t('Language')} subtitle={t('Your choice overrides the organization default. Arabic switches the layout to right-to-left.')} />
            <Field label={t('Interface language')}><Select value={lang} onChange={(e) => saveLanguage(e.target.value)} options={languages.map((l) => ({ value: l.code, label: l.name }))} /></Field>
          </Card>
          <Card>
            <CardHead title={t('Navigation bar')} subtitle={t('Place the menu on any side of the screen. Unpinned, it slides away and opens when you point at its edge.')} />
            <div className="stack">
              <Segmented label={t('Position')} value={prefs.navPos || 'left'} onChange={(v) => savePrefs({ navPos: v })} options={[{ value: 'left', label: t('Left') }, { value: 'right', label: t('Right') }, { value: 'top', label: t('Top') }, { value: 'bottom', label: t('Bottom') }]} />
              <Check label={t('Keep the menu pinned open')} checked={prefs.navPinned !== false} onChange={(e) => savePrefs({ navPinned: e.target.checked })} />
            </div>
          </Card>
        </div>
        <div className="stack">
          <Card>
            <CardHead title={t('Change password')} subtitle={t('At least 8 characters.')} />
            <div className="form-grid">
              <Field label={t('Current password')} full><Input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
              <Field label={t('New password')}><Input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
              <Field label={t('Confirm new password')}><Input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
            </div>
            <div style={{ marginTop: 12 }}><ErrorNote error={pwErr} /></div>
            <Button variant="primary" disabled={!pw.current || pw.next.length < 8} onClick={changePw}>{t('Change password')}</Button>
          </Card>
          <Card>
            <CardHead title={t('Live AI model (optional)')} subtitle={t('Without a key, the application uses its built-in, rule-based suggestions. With a key, suggestions come from the model you name. The key stays in this browser.')} />
            <div className="form-grid">
              <Field label={t('Provider')}><Select value={llm.provider} onChange={(e) => setLlm({ ...llm, provider: e.target.value })} options={[{ value: 'anthropic', label: 'Anthropic Claude' }]} /></Field>
              <Field label={t('Model')}><Input value={llm.model} onChange={(e) => setLlm({ ...llm, model: e.target.value })} /></Field>
              <Field label={t('API key')} full><Input type="password" autoComplete="off" value={llm.apiKey} onChange={(e) => setLlm({ ...llm, apiKey: e.target.value })} /></Field>
              <Field label={t('Custom endpoint')} full hint={t('Leave empty for the provider default.')}><Input value={llm.endpoint} onChange={(e) => setLlm({ ...llm, endpoint: e.target.value })} placeholder="https://" /></Field>
            </div>
            <div className="row" style={{ gap: 8, marginTop: 12 }}>
              <Button variant="primary" disabled={!llm.apiKey} onClick={() => saveLlm(llm)}>{t('Save connection')}</Button>
              <Button onClick={() => saveLlm(null)}>{t('Remove connection')}</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
