// Administration → Channels: the Organization's Email (SMTP) and WhatsApp (WhatsApp Business Cloud API) providers,
// a connection test in plain language, and the outbox of every message composed for questionnaires.
import { useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { useSession, useData } from '../lib/session.jsx';
import { post, put } from '../lib/api.js';
import { PageHead, Card, Guard, DataTable, StatusPill, Btn, Icon, useAction, Modal, Field, KV } from '../components/ui.jsx';

const FIELDS = {
  email: [['host', 'text'], ['port', 'number'], ['secure', 'bool'], ['user', 'text'], ['from', 'text'], ['replyTo', 'text']],
  whatsapp: [['phoneNumberId', 'text'], ['businessAccountId', 'text'], ['template', 'text'], ['templateLang', 'text'], ['verifyToken', 'text'], ['defaultCountryCode', 'text'], ['apiBase', 'text']],
};

export function ChannelSettings() {
  const { t } = useI18n(); const { can } = useSession(); const d = useData('/channels'); const msgs = useData('/messages?limit=300'); const [m, setM] = useState(null);
  return (<>
    <PageHead eyebrow={t('navGroup.admin')} title={t('nav.channels')} subtitle={t('ch.subtitle')} />
    <Guard state={d}>{rows => <div className="grid g-2">{rows.map(c => <ChannelCard key={c.channel} c={c} edit={can('integrations.manage')} onSaved={d.reload} />)}</div>}</Guard>
    <Card title={t('q.outbox')} className="mt"><p className="small muted">{t('ch.outboxHint')}</p>
      <Guard state={msgs}>{rows => <DataTable rows={rows} csvName="outbox" onRow={setM} columns={[{ key: 'created_at', label: t('col.date'), value: r => new Date(r.created_at).toLocaleString(), sortValue: r => r.created_at },
        { key: 'channel', label: t('q.channel'), text: r => t('channel.' + r.channel) }, { key: 'kind', label: t('q.event'), text: r => t('qev.' + r.kind) }, { key: 'recipient', label: t('q.recipient') },
        { key: 'subject', label: t('ch.subject') }, { key: 'status', label: t('col.status'), render: r => <StatusPill value={r.status} /> }, { key: 'attempts', label: t('ch.attempts'), num: true }]} />}</Guard></Card>
    {m && <Modal title={m.subject || t('channel.' + m.channel)} onClose={() => setM(null)}><KV items={[[t('q.channel'), t('channel.' + m.channel)], [t('q.recipient'), m.recipient], [t('col.status'), t('status.' + m.status)], [t('q.provider'), m.provider || '—'], m.error && [t('q.error'), m.error]]} /><pre className="message-body">{m.body}</pre></Modal>}
  </>);
}

function ChannelCard({ c, edit, onSaved }) {
  const { t } = useI18n(); const act = useAction();
  const [cfg, setCfg] = useState(c.config || {}); const [secret, setSecret] = useState(''); const [secret2, setSecret2] = useState(''); const [enabled, setEnabled] = useState(c.enabled); const [mode, setMode] = useState(c.mode); const [to, setTo] = useState(''); const [test, setTest] = useState(null);
  const save = async () => { await act(() => put('/channels/' + c.channel, { config: cfg, secret: secret || undefined, secret2: secret2 || undefined, enabled, mode })); setSecret(''); setSecret2(''); onSaved(); };
  const run = async () => { setTest(null); setTest(await act(() => post(`/channels/${c.channel}/test`, { to }), null)); };
  return (<Card title={<span className="row"><Icon name={c.channel === 'email' ? 'Mail' : 'MessageCircle'} />{t('channel.' + c.channel)}</span>} actions={<span className={`pill ${c.effective === 'sandbox' ? 's2' : 's4'}`}>{t('channelMode.' + c.effective)}</span>}>
    <p className="small muted">{t('ch.hint.' + c.channel)}</p>
    <div className="row"><label className="row small"><input type="checkbox" disabled={!edit} checked={enabled} onChange={e => setEnabled(e.target.checked)} />{t('ch.enabled')}</label>
      <select className="input" style={{ width: 'auto' }} disabled={!edit} value={mode} onChange={e => setMode(e.target.value)} aria-label={t('ch.mode')}><option value="sandbox">{t('channelMode.sandbox')}</option><option value="live">{t('channelMode.live')}</option></select></div>
    <div className="grid g-2" style={{ marginTop: 'var(--sp-3)' }}>{FIELDS[c.channel].map(([k, type]) => type === 'bool'
      ? <label key={k} className="row small"><input type="checkbox" disabled={!edit} checked={!!cfg[k]} onChange={e => setCfg({ ...cfg, [k]: e.target.checked })} />{t(`ch.${c.channel}.${k}`)}</label>
      : <Field key={k} label={t(`ch.${c.channel}.${k}`)} id={c.channel + k}><input id={c.channel + k} className="input" type={type === 'number' ? 'number' : 'text'} disabled={!edit} value={cfg[k] ?? ''} onChange={e => setCfg({ ...cfg, [k]: e.target.value })} /></Field>)}
      <Field label={t(`ch.${c.channel}.secret`)} id={c.channel + 's'} hint={c.secretSet ? t('ch.secretSet', { hint: c.secretHint }) : t('ch.secretNone')}><input id={c.channel + 's'} className="input" type="password" autoComplete="new-password" disabled={!edit} value={secret} onChange={e => setSecret(e.target.value)} /></Field>
      {c.channel === 'whatsapp' && <Field label={t('ch.whatsapp.appSecret')} id="was2" hint={c.secret2Set ? t('ch.secretSetPlain') : t('ch.secretNone')}><input id="was2" className="input" type="password" autoComplete="new-password" disabled={!edit} value={secret2} onChange={e => setSecret2(e.target.value)} /></Field>}</div>
    {c.webhookUrl && <p className="xs muted">{t('ch.webhook')}: <span className="mono">{window.location.origin}{c.webhookUrl}</span></p>}
    {c.platformDefault && <p className="xs muted">{t('ch.platformDefault')}</p>}
    {edit && <div className="row" style={{ marginTop: 'var(--sp-3)', justifyContent: 'space-between' }}><Btn kind="primary" onClick={save}>{t('common.save')}</Btn>
      <div className="row" style={{ flexWrap: 'nowrap' }}><input className="input" placeholder={c.channel === 'email' ? 'name@example.com' : '+212 6…'} value={to} onChange={e => setTo(e.target.value)} aria-label={t('ch.testTo')} /><Btn icon="Send" disabled={!to} onClick={run}>{t('ch.test')}</Btn></div></div>}
    {test && <div className={`notice ${test.status === 'failed' ? '' : 'grey'}`} style={{ marginTop: 'var(--sp-3)' }}><Icon name={test.status === 'failed' ? 'CircleAlert' : 'CircleCheck'} /><div>{t('ch.testResult.' + test.status, { error: test.error || '' })}</div></div>}
  </Card>);
}
