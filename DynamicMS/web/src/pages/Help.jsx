import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { PageHead, Card, Loading, tx, Search, IconBadge } from '../components/ui.jsx';

export default function Help() {
  const { t, lang } = useApp();
  const { data } = useData('/help');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null);
  if (!data) return <Loading />;
  const match = (s) => !q || tx(s, lang).toLowerCase().includes(q.toLowerCase());
  const arts = data.articles.filter(a => match(a.title) || match(a.body));
  const cur = sel ? data.articles.find(a => a.id === sel) : arts[0];
  return (
    <>
      <PageHead eyebrow={t('Organization')} title={t('Help')} subtitle={t('One article per module and the frequent questions. The AI Assistant answers from the same content.')} actions={<Link className="btn" to="/assistant">{t('Ask the assistant')}</Link>} />
      <div style={{ maxWidth: 420, marginBottom: 16 }}><Search value={q} onChange={setQ} placeholder={t('Search help')} /></div>
      <div className="grid-side">
        <Card title={t('Articles')}><ul className="list">{arts.map(a => <li key={a.id}><button className="list-btn" onClick={() => setSel(a.id)} style={cur?.id === a.id ? { background: 'var(--pa-orange-tint)' } : undefined}><span className="small strong">{tx(a.title, lang)}</span></button></li>)}</ul></Card>
        <div className="stack">
          {cur && <Card title={tx(cur.title, lang)} action={<IconBadge icon={LifeBuoy} size="sm" accent />}><p>{tx(cur.body, lang)}</p></Card>}
          <Card title={t('Frequent questions')}>
            {data.faq.filter(f => match(f.q) || match(f.a)).map((f, i) => <details key={i} style={{ borderBottom: '1px solid var(--pa-grey-line)', padding: '12px 0' }}><summary className="strong small" style={{ cursor: 'pointer' }}>{tx(f.q, lang)}</summary><p className="small" style={{ margin: '8px 0 0' }}>{tx(f.a, lang)}</p></details>)}
          </Card>
        </div>
      </div>
    </>
  );
}
