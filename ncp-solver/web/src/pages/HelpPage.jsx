import React, { useMemo, useState } from 'react';
import { useI18n } from '../context/I18nContext.jsx';
import { Card } from '../components/ui.jsx';
import { HELP_TOPICS } from '../data/helpContent.js';

const SEARCH_PLACEHOLDER = { en: 'Search the help guide…', fr: "Rechercher dans l'aide…", ar: 'ابحث في دليل المساعدة…' };
const NO_RESULTS = { en: 'No topics match your search.', fr: 'Aucun sujet ne correspond à votre recherche.', ar: 'لا توجد مواضيع مطابقة لبحثك.' };
const HELP_TITLE = { en: 'Help & User Guide', fr: "Aide & Guide de l'Utilisateur", ar: 'المساعدة ودليل المستخدم' };

export default function HelpPage() {
  const { t, lang } = useI18n();
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const topics = HELP_TOPICS[lang] || HELP_TOPICS.en;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter((topic) => topic.title.toLowerCase().includes(q) || topic.body.some((p) => p.toLowerCase().includes(q)));
  }, [topics, query]);

  return (
    <div className="space-y-4">
      <div>
        <div className="eyebrow">{t('nav.help')}</div>
        <h1 className="font-title font-bold text-2xl text-grey-dark">{HELP_TITLE[lang] || HELP_TITLE.en}</h1>
      </div>

      <input
        className="input max-w-md"
        placeholder={SEARCH_PLACEHOLDER[lang] || SEARCH_PLACEHOLDER.en}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="grid gap-3">
        {filtered.map((topic) => {
          const open = openId === topic.id || (query.trim().length > 0);
          return (
            <Card key={topic.id} className="!p-0">
              <button
                onClick={() => setOpenId(openId === topic.id ? null : topic.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-start"
              >
                <span className="font-title font-bold text-grey-dark">{topic.title}</span>
                <span className="text-grey-medium text-lg">{open ? '−' : '+'}</span>
              </button>
              {open && (
                <div className="px-5 pb-5 space-y-2">
                  {topic.body.map((para, i) => (
                    <p key={i} className="text-sm text-grey-ink leading-relaxed">{para}</p>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-grey-medium">{NO_RESULTS[lang] || NO_RESULTS.en}</div>
        )}
      </div>
    </div>
  );
}
