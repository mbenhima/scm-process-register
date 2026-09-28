import { useState } from 'react';
import { useApp } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Card, Field, tx } from '../components/ui.jsx';
import { useNavItems } from '../components/Shell.jsx';

export default function Settings() {
  const { t, lang, setLang, me, prefs, savePrefs, toast } = useApp();
  const items = useNavItems();
  const [pw, setPw] = useState({ current: '', next: '' });
  const change = async () => { try { await api('/auth/password', { method: 'PUT', body: pw }); toast(t('Password changed.')); setPw({ current: '', next: '' }); } catch (e) { toast(e.message, 'error'); } };
  const favs = prefs.favorites || [];
  return (
    <>
      <PageHead eyebrow={t('Organization')} title={t('Settings')} subtitle={t('Your preferences are stored on the server and follow you on every device.')} />
      <div className="grid-main">
        <div className="stack">
          <Card title={t('Profile')}>
            <p className="small"><span className="strong">{me.user.name}</span> · {me.user.email}</p>
            <p className="small">{t('Roles')}: {(me.user.roleNames || []).map(r => tx(r, lang)).join(', ')}</p>
            <Field label={t('Language')}>{(id) => <select id={id} className="select" style={{ maxWidth: 240 }} value={lang} onChange={e => setLang(e.target.value)}><option value="en">English</option><option value="fr">Français</option><option value="ar">العربية</option></select>}</Field>
          </Card>
          <Card title={t('Menu')}>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="strong small" style={{ marginBottom: 8 }}>{t('Dock position')}</legend>
              <div className="row">{[['start', t('Start (left in English, right in Arabic)')], ['end', t('End')], ['top', t('Top')], ['bottom', t('Bottom')]].map(([v, l]) => <label key={v} className="checkbox small"><input type="radio" name="dock" checked={(prefs.dock || 'start') === v} onChange={() => savePrefs({ dock: v })} /><span>{l}</span></label>)}</div>
            </fieldset>
            <label className="checkbox small" style={{ marginTop: 16 }}><input type="checkbox" checked={prefs.pinned !== false} onChange={e => savePrefs({ pinned: e.target.checked })} /><span>{t('Keep the menu pinned open')}</span></label>
            <h4 style={{ margin: '16px 0 8px' }}>{t('Favorites')}</h4>
            <div className="form-grid">{items.map(n => <label key={n.id} className="checkbox small"><input type="checkbox" checked={favs.includes(n.id)} onChange={e => savePrefs({ favorites: e.target.checked ? [...favs, n.id] : favs.filter(x => x !== n.id) })} /><span>{t(n.label)}</span></label>)}</div>
            <div className="row" style={{ marginTop: 16 }}><button className="btn" onClick={() => savePrefs({ dock: 'start', pinned: true, collapsed: [], favorites: ['home', 'lifecycle', 'alerts'] })}>{t('Reset menu preferences')}</button></div>
          </Card>
        </div>
        <Card title={t('Change password')}>
          <div className="stack">
            <Field label={t('Current password')}>{(id) => <input id={id} className="input" type="password" autoComplete="current-password" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} />}</Field>
            <Field label={t('New password')} hint={t('At least 8 characters with a capital letter and a digit.')}>{(id) => <input id={id} className="input" type="password" autoComplete="new-password" value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} />}</Field>
            <div className="row"><button className="btn btn-primary" disabled={!pw.current || pw.next.length < 8} onClick={change}>{t('Change password')}</button></div>
          </div>
        </Card>
      </div>
    </>
  );
}
