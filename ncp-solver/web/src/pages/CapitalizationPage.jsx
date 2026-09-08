import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { Card, EmptyState } from '../components/ui.jsx';

export default function CapitalizationPage() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [library, setLibrary] = useState([]);

  useEffect(() => { api.get('/capitalization').then(setLibrary).catch(() => {}); }, []);

  async function search(e) {
    e.preventDefault();
    if (!query.trim()) { setResults(null); return; }
    const rows = await api.get(`/capitalization/search?q=${encodeURIComponent(query)}`);
    setResults(rows);
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="eyebrow">{t('nav.capitalization')}</div>
        <h1 className="font-title font-bold text-2xl text-grey-dark">{t('capitalization.title')}</h1>
        <p className="text-sm text-grey-ink italic">{t('capitalization.subtitle')}</p>
      </div>

      <form onSubmit={search} className="flex gap-2">
        <input className="input" placeholder={t('capitalization.searchPlaceholder')} value={query} onChange={(e) => setQuery(e.target.value)} />
        <button type="submit" className="btn-primary">{t('common.search')}</button>
      </form>

      {results && (
        <Card title={`${t('common.search')} — "${query}"`}>
          <div className="grid gap-3">
            {results.map((r) => (
              <div key={r.ficheId} className="border-s-4 border-orange ps-3 py-1">
                <Link to={`/fiches/${r.ficheId}`} className="font-semibold text-orange-deep">{r.ficheNumber} — {r.title}</Link>
                <div className="text-xs text-grey-medium">score {r.score}</div>
                {r.lessonsLearned && <p className="text-sm text-grey-ink mt-1">{r.lessonsLearned}</p>}
              </div>
            ))}
            {results.length === 0 && <EmptyState message={t('common.noResults')} />}
          </div>
        </Card>
      )}

      <Card title={t('nav.capitalization')}>
        <div className="grid gap-3">
          {library.map((r) => (
            <div key={r.id} className="border-b border-grey-line pb-3 last:border-0">
              <Link to={`/fiches/${r.id}`} className="font-semibold text-orange-deep">{r.fiche_number} — {r.title}</Link>
              <p className="text-sm text-grey-ink mt-1">{r.lessons_learned}</p>
              <div className="flex gap-2 mt-1">
                {!!r.needs_standardization && <span className="badge bg-overlayBlue/15 text-overlayBlue">Standardized</span>}
                {!!r.needs_generalization && <span className="badge bg-overlayGreen/15 text-overlayGreen">Generalized</span>}
              </div>
            </div>
          ))}
          {library.length === 0 && <EmptyState message={t('common.noResults')} />}
        </div>
      </Card>
    </div>
  );
}
