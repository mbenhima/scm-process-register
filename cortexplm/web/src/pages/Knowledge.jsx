import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { PageHeader, Card, CardHead, useFetch, Skeleton, SearchBox, Tabs, Badge, Select } from '../components/ui.jsx';
import CrudPage from '../components/CrudPage.jsx';

export default function Knowledge() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const [kbLang, setKbLang] = useState(lang);
  const { can } = useAuth();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('search');
  const res = useFetch(q.trim().length > 2 ? `/search?q=${encodeURIComponent(q)}` : null);
  const doc = useFetch(id ? `/knowledge/${id}` : null);
  if (id) {
    if (!doc.data) return <div className="page"><Skeleton /></div>;
    return (
      <div className="page">
        <PageHeader eyebrow={<><Link to="/knowledge">{t('Knowledge base')}</Link> · {t(doc.data.kind)}{doc.data.ref ? ` · ${doc.data.ref}` : ''}</>} title={doc.data.title} actions={doc.data.readOnly && <Badge>{t('Reference content')}</Badge>} />
        <Card><p style={{ maxWidth: '72ch' }}>{doc.data.body}</p><p className="muted">{doc.data.tags}</p></Card>
      </div>
    );
  }
  return (
    <div className="page">
      <PageHeader eyebrow={t('Intelligence')} title={t('Knowledge base')} subtitle={t('One search covers the process reference, standards and guidance, your practice notes, lessons learned and projects.')} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'search', label: t('Search') }, { value: 'articles', label: t('Articles') }]} />
      {tab === 'search' && (
        <Card>
          <SearchBox value={q} onChange={setQ} placeholder={t('Search, for example "gate checklist evidence" or "supplier delay"')} />
          <div style={{ marginTop: 16 }}>
            {q.trim().length <= 2 ? <p className="muted">{t('Type at least three characters.')}</p> : !res.data ? <Skeleton h={120} /> : res.data.length === 0 ? <p className="muted">{t('No match.')}</p> : (
              <ul className="list-plain">{res.data.map((r, i) => (
                <li key={i}><div className="row between"><Link to={r.link} className="strong">{r.title}</Link><span className="row" style={{ gap: 8 }}><Badge>{t(r.kind)}</Badge><span className="xs muted">{t('score')} {r.score}</span></span></div><div className="xs muted">{r.snippet}</div></li>
              ))}</ul>
            )}
          </div>
          <p className="chart-caption">{t('Ranked by TF-IDF similarity. The search runs offline and only returns your organization’s records.')}</p>
        </Card>
      )}
      {tab === 'articles' && (
        <CrudPage endpoint="/knowledge" csvName="knowledge" entityLabel="article" newLabel="Add article" canManage={can('kb.manage')} defaults={{ kind: 'Practice note', lang }}
          filter={(r) => !kbLang || r.lang === kbLang}
          toolbar={<div style={{ minWidth: 170 }}><Select aria-label={t('Language')} value={kbLang} onChange={(e) => setKbLang(e.target.value)} placeholder={t('All languages')} options={[{ value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }, { value: 'ar', label: 'العربية' }]} /></div>}
          onRowOpen={(r) => { if (r.org_id == null) { nav(`/knowledge/${r.id}`); return true; } return false; }}
          columns={[{ key: 'title', label: t('Title'), render: (r) => <span className="strong">{r.title}</span> }, { key: 'kind', label: t('Type'), render: (r) => t(r.kind) }, { key: 'ref', label: t('Reference') },
            { key: 'scope', label: t('Scope'), csv: (r) => (r.org_id ? 'Organization' : 'Reference'), render: (r) => (r.org_id ? <Badge tone="accent">{t('Organization')}</Badge> : <Badge>{t('Reference (read only)')}</Badge>) }]}
          fields={[{ key: 'title', label: 'Title', required: true }, { key: 'kind', label: 'Type', type: 'select', options: ['Practice note', 'Guidance', 'Standard', 'FAQ'], required: true }, { key: 'ref', label: 'Reference' },
            { key: 'body', label: 'Text', type: 'textarea', rows: 8, required: true }, { key: 'tags', label: 'Tags' }, { key: 'lang', label: 'Language', type: 'select', options: ['en', 'fr', 'ar'] }]} />
      )}
      <Card className="quiet" style={{ marginTop: 24 }}><CardHead title={t('Grounding for AI')} /><p className="small" style={{ margin: 0 }}>{t('AI suggestions and the assistant retrieve from this same index, and show which references they used.')}</p></Card>
    </div>
  );
}
