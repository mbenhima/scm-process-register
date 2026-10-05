import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LibraryBig, PencilRuler, Sparkles } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Card, Loading, Field, tx, IconBadge, Status } from '../components/ui.jsx';
import { useIdName } from '../lib/names.js';

const E2E = ['E2E-01', 'E2E-02', 'E2E-03', 'E2E-04', 'E2E-05', 'E2E-06', 'E2E-07', 'E2E-08', 'E2E-09', 'E2E-10', 'E2E-11', 'E2E-12'];

export default function NewProject() {
  const idName = useIdName();
  const { t, L, lang, me, project, toast, reloadTree, setProjectId } = useApp();
  const navigate = useNavigate();
  const orgId = project?.org?.access === 'write' ? project.org.id : me.org?.id;
  const org = useData(orgId ? `/orgs/${orgId}` : null);
  const { data: templates } = useData(orgId ? `/orgs/${orgId}/templates` : null);
  const { data: criteria } = useData('/admin/libraries/criteria');
  const [mode, setMode] = useState(null);
  const [f, setF] = useState({ name: '', msType: 'QMS', startDate: new Date().toISOString().slice(0, 10), templateId: '', track: '', gates: E2E.filter((_, i) => i % 3 === 0), justification: '' });
  const [levels, setLevels] = useState({});
  const [score, setScore] = useState(null);
  const [desc, setDesc] = useState('');
  const [draft, setDraft] = useState(null);
  const [accepted, setAccepted] = useState({});
  const [busy, setBusy] = useState(false);
  const isSme = org.data?.size === 'SME';
  useEffect(() => { if (criteria) setLevels(l => (Object.keys(l).length ? l : Object.fromEntries(criteria.filter(c => !c.vertical || c.vertical === org.data?.sector).map(c => [c.code, 3])))); }, [criteria, org.data]);
  useEffect(() => { if (!orgId || !Object.keys(levels).length) return; api(`/orgs/${orgId}/projects/score`, { method: 'POST', body: { levels } }).then(setScore).catch(() => {}); }, [levels, orgId]);
  if (!orgId || !org.data) return <Loading />;
  const askAi = async () => {
    setBusy(true);
    try { const d = await api(`/orgs/${orgId}/projects/draft`, { method: 'POST', body: { description: desc } }); setDraft(d); setAccepted({ msType: true, track: true, levels: true, template: true }); } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  const applyDraft = () => {
    const next = { ...f, name: f.name || desc.slice(0, 60) };
    if (accepted.msType) next.msType = draft.msType;
    if (accepted.track && draft.track) next.track = draft.track;
    if (accepted.template && draft.template) next.templateId = draft.template.id;
    setF(next);
    if (accepted.levels) setLevels(l => ({ ...l, ...draft.levels }));
    toast(t('Suggestion applied item by item; review the fields below.'));
  };
  const chosenTrack = isSme ? (f.track || score?.recommendedTrack) : null;
  const overriding = isSme && f.track && score && f.track !== score.recommendedTrack;
  const create = async () => {
    setBusy(true);
    try {
      const body = { ...f, creationMode: mode, levels, track: isSme ? chosenTrack : null, gates: mode === 'manual' ? f.gates : undefined, templateId: mode === 'catalog' ? f.templateId : undefined, aiAccepted: mode === 'ai' ? Object.keys(accepted).filter(k => accepted[k]) : undefined };
      const r = await api(`/orgs/${orgId}/projects`, { method: 'POST', body });
      toast(t('Project created.'));
      await reloadTree(); setProjectId(r.id); navigate('/lifecycle');
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  const tpls = (templates || []).filter(x => x.ms_type === f.msType || mode !== 'catalog');
  return (
    <>
      <PageHead eyebrow={tx(org.data.name, lang)} title={t('New project')} subtitle={t('Start from the template catalog, build it manually from the gate and checklist libraries, or let the assistant draft it from a short description.')} />
      <div className="grid-cards" style={{ marginBottom: 24 }}>
        {[['catalog', LibraryBig, t('From the catalog'), t('Copies the phases, gates, checklists and roles of a published template.')], ['manual', PencilRuler, t('Manual'), t('You choose the system, the track and the gates attached to each phase.')], ['ai', Sparkles, t('With AI'), t('Describe the project; accept, change or reject each suggested item.')]].map(([id, I, title, text]) => (
          <button key={id} className="phase-card" aria-pressed={mode === id} aria-current={mode === id} onClick={() => setMode(id)}>
            <IconBadge icon={I} accent={mode === id} /><span className="strong">{title}</span><span className="small">{text}</span>
          </button>
        ))}
      </div>
      {mode && (
        <div className="grid-main">
          <div className="stack">
            {mode === 'ai' && (
              <Card title={t('Describe the project')} className="tint">
                <Field label={t('Short description')} hint={t('Example: ISO 45001 safety certification for our two sites before the customer audit in March.')}>{(id) => <textarea id={id} className="textarea" value={desc} onChange={e => setDesc(e.target.value)} />}</Field>
                <div className="row" style={{ marginTop: 12 }}><button className="btn" disabled={!desc.trim() || busy} onClick={askAi}><Sparkles size={16} />{t('Draft the project')}</button></div>
                {draft && (
                  <div className="card tight stack-8" style={{ marginTop: 16 }}>
                    <p className="small strong">{tx(draft.rationale, lang)} · {t('Confidence {c}%', { c: Math.round(draft.confidence * 100) })}</p>
                    {[['msType', t('Management system'), draft.msType], ['track', t('Track'), draft.track ? L(draft.track) : '—'], ['template', t('Closest template'), draft.template ? tx(draft.template.name, lang) : '—'], ['levels', t('Complexity levels'), t('Score {s}/100', { s: draft.score })]].map(([k, l, v]) => (
                      <label key={k} className="checkbox small"><input type="checkbox" checked={!!accepted[k]} onChange={e => setAccepted({ ...accepted, [k]: e.target.checked })} /><span><span className="strong">{l}: </span>{v}</span></label>
                    ))}
                    <div className="row"><button className="btn btn-sm btn-primary" onClick={applyDraft}>{t('Apply accepted items')}</button></div>
                  </div>
                )}
              </Card>
            )}
            <Card title={t('Project')}>
              <div className="stack">
                <Field label={t('Name')} required>{(id) => <input id={id} className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />}</Field>
                <div className="form-grid">
                  <Field label={t('Management system')}>{(id) => <select id={id} className="select" value={f.msType} onChange={e => setF({ ...f, msType: e.target.value, templateId: '' })}><option value="QMS">{t('QMS — ISO 9001')}</option><option value="QHSE">{t('QHSE — ISO 9001, 14001, 45001')}</option></select>}</Field>
                  <Field label={t('Start date')}>{(id) => <input id={id} className="input" type="date" value={f.startDate} onChange={e => setF({ ...f, startDate: e.target.value })} />}</Field>
                  <Field label={t('Mode')}>{(id) => <input id={id} className="input" value={isSme ? L('SME') : L('FULL')} disabled />}</Field>
                </div>
                {mode === 'catalog' && (
                  <Field label={t('Template')} required>{(id) => <select id={id} className="select" value={f.templateId} onChange={e => setF({ ...f, templateId: e.target.value })}><option value="">{t('Choose…')}</option>{tpls.map(x => <option key={x.id} value={x.id}>{x.code} — {tx(x.name, lang)} (v{x.version})</option>)}</select>}</Field>
                )}
                {mode === 'manual' && (
                  <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="strong small" style={{ marginBottom: 8 }}>{t('Phases with a gate (from the Gate Library)')}</legend>
                    <div className="form-grid">{E2E.map(e => <label key={e} className="checkbox small"><input type="checkbox" checked={f.gates.includes(e)} onChange={ev => setF({ ...f, gates: ev.target.checked ? [...f.gates, e] : f.gates.filter(x => x !== e) })} /><span>{idName(e)}</span></label>)}</div>
                  </fieldset>
                )}
              </div>
            </Card>
          </div>
          <div className="stack">
            <Card title={t('Complexity score')} action={score && <span className="serif" style={{ fontSize: 30, fontWeight: 700, color: 'var(--aiv-azure)' }}>{score.score}</span>}>
              <div className="stack-8">
                {(criteria || []).filter(c => !c.vertical || c.vertical === org.data.sector).map(c => (
                  <Field key={c.code} label={`${tx(c.name, lang)} (${c.weight})`}>{(id) => <select id={id} className="select" value={levels[c.code] || 3} onChange={e => setLevels({ ...levels, [c.code]: +e.target.value })}>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}{c.levels?.[n - 1] ? ` — ${tx(c.levels[n - 1], lang)}` : ''}</option>)}</select>}</Field>
                ))}
              </div>
              {score && <p className="small" style={{ marginTop: 12 }}>{t('Recommended mode')}: <span className="strong">{L(score.recommendedMode)}</span>{isSme && <> · {t('recommended track')}: <span className="strong">{L(score.recommendedTrack)}</span></>}</p>}
              {isSme && (
                <>
                  <Field label={t('Track')}>{(id) => <select id={id} className="select" value={f.track || ''} onChange={e => setF({ ...f, track: e.target.value })}><option value="">{t('Recommended')} ({L(score?.recommendedTrack)})</option>{['TRK-LIGHT', 'TRK-STANDARD', 'TRK-ADVANCED'].map(x => <option key={x} value={x}>{L(x)}</option>)}</select>}</Field>
                  {overriding && <div style={{ marginTop: 12 }}><Field label={t('Justification for overriding the recommended track')} required>{(id) => <textarea id={id} className="textarea" value={f.justification} onChange={e => setF({ ...f, justification: e.target.value })} />}</Field></div>}
                </>
              )}
            </Card>
            <button className="btn btn-primary" disabled={busy || !f.name || (mode === 'catalog' && !f.templateId) || (overriding && !f.justification.trim())} onClick={create}>{busy ? t('Creating…') : t('Create project')}</button>
            <p className="small muted">{t('The project starts with every licensed macro process of the organization activated for its vertical, all steps to do, and the first phase active.')}</p>
          </div>
        </div>
      )}
    </>
  );
}
