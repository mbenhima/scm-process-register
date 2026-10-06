import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { get } from '../lib/api.js';
import { PageHead, Card, Guard, Btn, Icon, Seg, Field, useAction, Search } from '../components/ui.jsx';

export function Settings() {
  const { t, L, lang, languages } = useI18n(); const { me, savePrefs, changeLang, nav } = useSession(); const act = useAction(); const p = me.prefs;
  const cats = ['alerts', 'tasks', 'approvals', 'questionnaires', 'system']; const chans = ['inapp', 'email', 'sms', 'push', 'webhook'];
  const setCh = (c, ch, on) => { const cur = p.channels?.[c] || ['inapp']; const next = on ? [...new Set([...cur, ch])] : cur.filter(x => x !== ch || x === 'inapp'); act(() => savePrefs({ channels: { ...p.channels, [c]: next } })); };
  return (<><PageHead eyebrow={t('navGroup.settings')} title={t('nav.settings')} subtitle={t('settings.subtitle')} />
    <div className="grid g-2"><Card title={t('settings.language')}><Seg value={lang} onChange={changeLang} options={languages.map(l => ({ id: l.code, label: l.name }))} label={t('header.language')} /><p className="caption">{t('settings.languageNote')}</p></Card>
      <Card title={t('settings.menu')}><div className="stack"><Field label={t('settings.dock')} id="dk"><Seg value={p.dock} onChange={v => act(() => savePrefs({ dock: v }))} options={['left', 'right', 'top', 'bottom'].map(d => ({ id: d, label: t('settings.dock.' + d) }))} label={t('settings.dock')} /></Field>
        <label className="check"><input type="checkbox" checked={p.pinned} onChange={e => act(() => savePrefs({ pinned: e.target.checked }))} />{t('settings.pinned')}</label>
        <div><span className="label">{t('settings.favorites')}</span><div className="row" style={{ marginTop: 8 }}>{(p.favorites || []).map(f => { const it = nav.items.find(i => i.route === f); return it && <span key={f} className="pill tint">{t(it.label)} <button className="btn ghost sm icon" aria-label={t('common.delete')} onClick={() => act(() => savePrefs({ favorites: p.favorites.filter(x => x !== f) }))}><Icon name="X" size={12} /></button></span>; })}</div><p className="caption">{t('settings.favNote')}</p></div></div></Card>
      <Card title={t('settings.channels')} className=""><div className="table-wrap"><table className="tbl"><thead><tr><th className="sticky-col">{t('settings.category')}</th>{chans.map(c => <th key={c}>{t('channel.' + c)}</th>)}</tr></thead>
        <tbody>{cats.map(c => <tr key={c}><td className="sticky-col">{t('notifyCat.' + c)}</td>{chans.map(ch => <td key={ch} style={{ textAlign: 'center' }}><input type="checkbox" aria-label={`${c} ${ch}`} disabled={ch === 'inapp'} checked={ch === 'inapp' || (p.channels?.[c] || []).includes(ch)} onChange={e => setCh(c, ch, e.target.checked)} /></td>)}</tr>)}</tbody></table></div><p className="caption">{t('settings.channelsNote')}</p></Card>
      <Card title={t('nav.aiModel')}><p className="small">{t('settings.aiNote')}</p><Link className="btn" to="/ai/model"><Icon name="Cpu" />{t('nav.aiModel')}</Link></Card></div></>);
}

export function Help() {
  const { t, L } = useI18n(); const d = useData('/help'); const legends = useData('/catalog/legend'); const dm = useData('/catalog/decisionMatrix'); const [q, setQ] = useState(''); const [hits, setHits] = useState(null);
  const filtered = useMemo(() => (d.data || []).filter(h => !q || (L(h.title) + ' ' + L(h.body)).toLowerCase().includes(q.toLowerCase())), [d.data, q, L]);
  return (<><PageHead eyebrow={t('navGroup.settings')} title={t('nav.help')} subtitle={t('help.subtitle')} />
    <div style={{ maxWidth: 520, marginBottom: 'var(--aiv-space-4)' }}><Search value={q} onChange={v => { setQ(v); if (v.length > 2) get('/help/search?q=' + encodeURIComponent(v)).then(setHits); else setHits(null); }} placeholder={t('help.search')} /></div>
    {hits?.length > 0 && <Card title={t('help.best')}>{hits.slice(0, 4).map((h, i) => <p key={i} className="small">{h.route ? <Link to={h.route}>{h.title}</Link> : h.title}{h.answer && <><br /><span className="muted">{h.answer}</span></>}</p>)}</Card>}
    <Guard state={d}>{() => <div className="grid g-2" style={{ marginTop: 'var(--aiv-space-4)' }}>{filtered.map(h => <Card key={h.id} title={L(h.title)} actions={h.route && <Link to={h.route} className="btn sm">{t('help.open')}</Link>}><p className="small">{L(h.body)}</p></Card>)}</div>}</Guard>
    <h2 className="section-title">{t('help.legends')}</h2><div className="grid g-3">{(legends.data || []).map(l => <Card key={l.id} title={L(l.title)}>{l.items.map(i => <div key={i.code} className="row small" style={{ marginBottom: 6, flexWrap: 'nowrap' }}><span className="dot" style={{ background: i.color, border: '1px solid var(--aiv-line)', flexShrink: 0 }} />{L(i.label)}</div>)}</Card>)}</div>
    {dm.data?.[0] && <><h2 className="section-title">{t('help.decisionMatrix')}</h2><Card><div className="table-wrap"><table className="tbl"><thead><tr><th className="sticky-col">{t('col.criterion')}</th><th>{t('col.weight')}</th>{dm.data[0].levels.map((l, i) => <th key={i}>{L(l)}</th>)}</tr></thead>
      <tbody>{dm.data[0].criteria.map(c => <tr key={c.code}><td className="sticky-col">{L(c.name)}</td><td>{c.weight}%</td>{dm.data[0].levels.map((l, i) => <td key={i} className="xs">{t('help.dm.' + (i + 1))}</td>)}</tr>)}</tbody></table></div><p className="caption">{t('help.dmCaption')}</p></Card></>}</>);
}
