import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Card, Tabs } from '../components/ui.jsx';

const EXAMPLES = {
  help: ['How do I reopen a completed step?', 'How do I report a problem?', 'Can the same person own and evaluate an action?'],
  standards: ['What does ISO 45001 require for hazard identification?', 'What is a BIM execution plan?', 'Which clauses cover the management review?'],
  data: ['Which steps are overdue?', 'What are my tasks?', 'Which KPIs are off target?', 'Where is the project?', 'What are the top risks?'],
};

export default function Assistant() {
  const { t, projectId, project, me, lang } = useApp();
  // The assistant answers through its AI Use Case; none active → no AI action (FR-DA-AI-23).
  const orgId = project?.org?.id || me.org?.id;
  const serving = useData(orgId ? `/orgs/${orgId}/ai/serving?module=assistant${projectId ? `&projectId=${projectId}` : ''}` : null);
  const off = serving.data && !serving.data.items.length;
  const [mode, setMode] = useState('help');
  const [q, setQ] = useState('');
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [log]);
  const ask = async (question) => {
    const text = (question ?? q).trim();
    if (!text) return;
    setLog(l => [...l, { me: true, text }]); setQ(''); setBusy(true);
    try { const r = await api('/assistant/ask', { method: 'POST', body: { question: text, mode, projectId } }); setLog(l => [...l, { me: false, ...r }]); }
    catch (e) { setLog(l => [...l, { me: false, answer: e.message, error: true }]); } finally { setBusy(false); }
  };
  return (
    <>
      <PageHead eyebrow={t('Intelligence')} title={t('AI Assistant')} subtitle={t('Answers come from the DynamicMS help, the standards knowledge base and your project records, through the AI use case of the assistant; with a live model, the model writes the answer from the references shown.')} />
      <Tabs label={t('Assistant mode')} value={mode} onChange={setMode} tabs={[{ id: 'help', label: t('Using the application') }, { id: 'standards', label: t('Standards and processes') }, { id: 'data', label: t('My project data') }]} />
      <div className="grid-main">
        <Card>
          <div className="chat" aria-live="polite">
            {!log.length && <p className="small muted">{t('Ask a question or pick an example.')}</p>}
            {log.map((m, i) => m.me ? <div key={i} className="msg me">{m.text}</div> : (
              <div key={i} className="msg bot">
                {m.title && <div className="strong">{m.title}</div>}
                <div>{m.answer}</div>
                {m.table?.length > 0 && <ul style={{ margin: '8px 0 0', paddingInlineStart: 20 }}>{m.table.map((r, j) => <li key={j}>{r.link ? <Link to={r.link}>{r.code || r.step} — {r.name}</Link> : `${r.code || ''} ${r.name || ''}`}{r.due ? ` · ${r.due}` : ''}{r.value !== undefined ? ` · ${r.value} / ${r.target}` : ''}{r.score !== undefined ? ` · ${r.score}` : ''}</li>)}</ul>}
                {m.sources?.length > 0 && <div className="xsmall muted" style={{ marginTop: 8 }}>{t('Sources')}: {m.sources.slice(0, 4).map(s => s.title).join(' · ')}</div>}
                {m.confidence !== undefined && <div className="xsmall muted">{t('Confidence {c}%', { c: Math.round(m.confidence * 100) })}</div>}
                {m.usecase && <div className="xsmall muted">{t('AI-generated — to be reviewed by a person')} · {m.usecase.code} · {t('Engine')}: {String(m.engine || '').startsWith('llm:') ? m.engine.replace(/^llm:/, '') : t('Built-in engine (rules and retrieval)')}{m.warning && !String(m.engine || '').startsWith('llm:') ? '' : ''}</div>}
              </div>
            ))}
            <div ref={end} />
          </div>
          {off && <p className="callout warn small" role="status">{t('No active AI use case serves the assistant, so it offers no AI action.')}</p>}
          <form className="row" style={{ marginTop: 16, flexWrap: 'nowrap' }} onSubmit={e => { e.preventDefault(); ask(); }}>
            <label className="sr-only" htmlFor="ask">{t('Your question')}</label>
            <input id="ask" className="input" value={q} onChange={e => setQ(e.target.value)} placeholder={t('Type your question')} />
            <button className="btn btn-primary" type="submit" disabled={busy || !q.trim() || off}><Send size={16} />{t('Ask')}</button>
          </form>
        </Card>
        <Card title={t('Examples')}>
          <ul className="list">{EXAMPLES[mode].map(x => <li key={x}><button className="link-btn" onClick={() => ask(t(x))}>{t(x)}</button></li>)}</ul>
        </Card>
      </div>
    </>
  );
}
