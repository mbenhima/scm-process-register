// In-app Help (FR-DA-HLP-01..03): one article per module, searchable, in the user's language.
import { useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { PageHeader, Card, useFetch, Skeleton, ErrorNote, SearchBox, Empty, Badge } from '../components/ui.jsx';

export default function Help() {
  const { t, lang } = useI18n();
  const [qText, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const { data, error } = useFetch(`/help?lang=${lang}`);
  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  const s = qText.trim().toLowerCase();
  const list = (data || []).filter((a) => !s || a.title.toLowerCase().includes(s) || a.body.toLowerCase().includes(s) || a.module.toLowerCase().includes(s));
  return (
    <div className="page">
      <PageHeader eyebrow={t('Help')} title={t('Help center')} subtitle={t('One article per module. Search by word, or open an article to read it.')} />
      <div style={{ maxWidth: 560, marginBottom: 24 }}><SearchBox value={qText} onChange={setQ} placeholder={t('Search help, for example: gate, checklist, language')} /></div>
      {!data ? <Skeleton h={400} /> : list.length === 0 ? <Empty text={t('No article matches.')} /> : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {list.map((a) => (
            <Card key={a.id}>
              <Badge>{t(a.module)}</Badge>
              <h3 style={{ marginTop: 8 }}>
                <button type="button" className="link-button" aria-expanded={open === a.id} onClick={() => setOpen(open === a.id ? null : a.id)}>{a.title}</button>
              </h3>
              <p className="small" style={{ marginBottom: 0 }}>{open === a.id ? a.body : `${a.body.slice(0, 160)}${a.body.length > 160 ? '…' : ''}`}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
