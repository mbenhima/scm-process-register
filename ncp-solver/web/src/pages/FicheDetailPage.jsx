import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Field, CriticalityBadge, StatusBadge, StageProgress, EmptyState } from '../components/ui.jsx';
import { AiGeneratedNotice, GroundingDisclosure, OutcomeButtons } from '../components/AiGovernance.jsx';
import { getLlmConnection } from '../lib/llmConnection.js';

// One tab per NCP Solver process stage (S1-S7, KB-003..KB-009).
const TABS = ['detail', 'understanding', 'immediate', 'rootcause', 'corrective', 'evaluation', 'rex'];

function EvidenceList({ actionId, canAdd, defaultType }) {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [fileName, setFileName] = useState('');
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    api.get(`/actions/${actionId}/evidence`).then(setItems).catch(() => {});
  }, [actionId]);
  useEffect(() => { load(); }, [load]);

  async function add(e) {
    e.preventDefault();
    if (!fileName.trim()) return;
    await api.post(`/actions/${actionId}/evidence`, { file_name: fileName, evidence_type: defaultType });
    setFileName('');
    setOpen(false);
    load();
  }

  return (
    <div className="mt-2 border-t border-grey-line pt-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-grey-medium mb-1">{t('action.evidence')}</div>
      {items.length > 0 && (
        <ul className="text-xs text-grey-ink space-y-0.5 mb-1">
          {items.map((ev) => (
            <li key={ev.id} className="flex items-center gap-2">
              📎 {ev.file_name}
              <span className="badge bg-grey-light text-grey-medium">{t(ev.evidence_type === 'evaluation_proof' ? 'action.evaluationProof' : 'action.executionProof')}</span>
            </li>
          ))}
        </ul>
      )}
      {canAdd && !open && (
        <button onClick={() => setOpen(true)} className="text-xs text-orange-deep font-semibold">+ {t('action.addEvidence')}</button>
      )}
      {canAdd && open && (
        <form onSubmit={add} className="flex gap-2 mt-1">
          <input className="input !py-1 text-xs" placeholder={t('action.evidenceFileName')} value={fileName} onChange={(e) => setFileName(e.target.value)} autoFocus />
          <button type="submit" className="btn-primary !py-1 !px-2 text-xs">{t('common.save')}</button>
        </form>
      )}
    </div>
  );
}

function ActionCard({ action, users, hasPermission, currentUserId, onChanged, allowExecute = true }) {
  const { t } = useI18n();
  const owner = users.find((u) => u.id === action.responsible_owner_id);
  const [evalOpen, setEvalOpen] = useState(false);
  const [evalForm, setEvalForm] = useState({
    review_result: action.evaluation?.review_result || 'pending',
    review_comments: action.evaluation?.review_comments || '',
    efficiency_criteria: action.evaluation?.efficiency_criteria || '',
  });
  const isOwner = action.responsible_owner_id === currentUserId;
  const canUpdateOwn = allowExecute && isOwner && hasPermission('action.updateOwn');
  const canEvaluate = allowExecute && hasPermission('action.evaluate') && action.responsible_owner_id !== currentUserId;

  async function markDone() {
    await api.put(`/actions/${action.id}/progress`, { status: 'done', actual_completion_date: new Date().toISOString().slice(0, 10) });
    onChanged();
  }
  async function saveEvaluation(e) {
    e.preventDefault();
    await api.put(`/actions/${action.id}/evaluation`, { ...evalForm, actual_review_date: new Date().toISOString().slice(0, 10) });
    setEvalOpen(false);
    onChanged();
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-grey-medium font-semibold">{action.action_number}</div>
          <div className="font-semibold text-grey-dark">{action.description}</div>
          <div className="text-xs text-grey-ink mt-1">
            {t('action.responsible')}: {owner ? `${owner.first_name} ${owner.last_name}` : '—'} · {t('action.plannedDate')}: {action.planned_completion_date || '—'}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge value={action.status} label={t(`action.status.${action.status}`)} />
          {action.evaluation?.review_result && action.evaluation.review_result !== 'pending' && (
            <StatusBadge value={action.evaluation.review_result} label={t(`action.reviewResult.${action.evaluation.review_result}`)} />
          )}
        </div>
      </div>
      {allowExecute && (
        <div className="flex gap-2 mt-3">
          {canUpdateOwn && action.status !== 'done' && (
            <button onClick={markDone} className="btn-secondary !py-1 !px-2 text-xs">{t('action.status.done')}</button>
          )}
          {canEvaluate && (
            <button onClick={() => setEvalOpen((o) => !o)} className="btn-secondary !py-1 !px-2 text-xs">{t('action.reviewResult')}</button>
          )}
        </div>
      )}
      {evalOpen && (
        <form onSubmit={saveEvaluation} className="mt-3 border-t border-grey-line pt-3 space-y-2">
          <select className="input" value={evalForm.review_result} onChange={(e) => setEvalForm((f) => ({ ...f, review_result: e.target.value }))}>
            <option value="effective">{t('action.reviewResult.effective')}</option>
            <option value="not_effective">{t('action.reviewResult.not_effective')}</option>
          </select>
          <input className="input" placeholder={t('action.reviewResult')} value={evalForm.review_comments} onChange={(e) => setEvalForm((f) => ({ ...f, review_comments: e.target.value }))} />
          <button type="submit" className="btn-primary !py-1 !px-3 text-xs">{t('common.save')}</button>
        </form>
      )}
      {allowExecute && (
        <EvidenceList
          actionId={action.id}
          canAdd={canUpdateOwn || canEvaluate}
          defaultType={canEvaluate && !canUpdateOwn ? 'evaluation_proof' : 'execution_proof'}
        />
      )}
    </div>
  );
}

function AiPanel({ label, onRun, render, ficheId, summarize }) {
  const { t } = useI18n();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const connection = getLlmConnection();
      setResult(await onRun(connection));
    } catch (err) {
      if (err.data?.error === 'ai_use_case_deactivated') setError(t('aiGov.deactivated'));
      else setError(err.message || t('assistant.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-3">
      <button disabled={loading} onClick={run} className="btn-secondary text-xs">
        🤖 {label}
      </button>
      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
      {result && (
        <div className="mt-3 text-sm bg-orange-tint/50 rounded-md p-3">
          <AiGeneratedNotice generatedBy={result.generatedBy} />
          {render(result)}
          {result.sourceFiches?.length > 0 && (
            <div className="mt-2 text-xs text-grey-medium">{t('fiche.aiSimilar')}: {result.sourceFiches.join(', ')}</div>
          )}
          <GroundingDisclosure grounding={result.grounding} llmNarrative={result.llmNarrative} />
          <OutcomeButtons
            useCaseId={result.useCaseId}
            outputSummary={summarize ? summarize(result) : label}
            generatedBy={result.generatedBy}
            ficheId={ficheId}
          />
        </div>
      )}
    </div>
  );
}

export default function FicheDetailPage() {
  const { id } = useParams();
  const { t } = useI18n();
  const { hasPermission, user } = useAuth();
  const navigate = useNavigate();
  const [fiche, setFiche] = useState(null);
  const [tab, setTab] = useState('detail');
  const [users, setUsers] = useState([]);

  const load = useCallback(() => {
    api.get(`/fiches/${id}`).then(setFiche).catch(() => {});
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/users/directory').then(setUsers).catch(() => {}); }, []);

  if (!fiche) return <EmptyState message={t('common.loading')} />;

  async function advanceStage() {
    await api.post(`/fiches/${id}/transition`, {});
    load();
  }
  async function closeFiche() {
    try {
      await api.post(`/fiches/${id}/close`, {});
      load();
    } catch (err) {
      alert(err.data?.error === 'rex_required_before_close' ? 'Please complete the S7 REX entry before closing.' : err.message);
    }
  }

  const immediateActions = fiche.actions.filter((a) => a.action_type === 'immediate');
  const correctiveActions = fiche.actions.filter((a) => a.action_type === 'corrective');
  const lastClassification = fiche.aiLogs?.find((l) => l.agent_name === 'Classification Agent');

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/fiches')} className="text-sm text-grey-ink hover:text-orange-deep">&larr; {t('common.back')}</button>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="eyebrow">{fiche.fiche_number}</div>
          <h1 className="font-title font-bold text-2xl text-grey-dark">{fiche.title}</h1>
          <div className="flex gap-2 mt-2">
            <CriticalityBadge value={fiche.criticality} label={t(`fiche.criticality.${fiche.criticality}`)} />
            <StatusBadge value={fiche.status} label={t(`fiche.status.${fiche.status}`)} />
          </div>
        </div>
        <div className="flex gap-2">
          {hasPermission('fiche.validate') && fiche.current_stage !== 'S7' && (
            <button onClick={advanceStage} className="btn-secondary">{t('fiche.advanceStage')}</button>
          )}
          {hasPermission('fiche.close') && fiche.status !== 'closed' && (
            <button onClick={closeFiche} className="btn-primary">{t('fiche.closeFiche')}</button>
          )}
        </div>
      </div>

      <div className="w-full max-w-md"><StageProgress stage={fiche.current_stage} /></div>

      <div className="flex gap-1 border-b border-grey-line overflow-x-auto">
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`px-3 py-2 text-sm font-semibold whitespace-nowrap border-b-2 ${tab === tb ? 'border-orange text-orange-deep' : 'border-transparent text-grey-ink hover:text-grey-dark'}`}
          >
            {t(`fiche.tab.${tb}`)}
          </button>
        ))}
      </div>

      {tab === 'detail' && (
        <Card>
          <p className="text-sm text-grey-ink mb-4">{fiche.description}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-grey-medium">{t('fiche.detectionDate')}:</span> {fiche.detection_date}</div>
            <div><span className="text-grey-medium">{t('fiche.frequency')}:</span> {t(`fiche.frequency.${fiche.frequency}`)}</div>
            <div><span className="text-grey-medium">{t('fiche.priority')}:</span> P{fiche.priority}</div>
            <div><span className="text-grey-medium">{t('fiche.team')}:</span> {fiche.team.map((m) => `${m.first_name} ${m.last_name}`).join(', ') || '—'}</div>
          </div>
          <div className="mt-5 border-t border-grey-line pt-4">
            <AiPanel
              label={t('fiche.aiClassification')}
              ficheId={id}
              onRun={(connection) => api.post(`/ai-agents/${id}/classification`, { connection }).then((r) => { load(); return r; })}
              summarize={(r) => `Suggested ${r.suggestedCriticality}/P${r.suggestedPriority}`}
              render={(r) => (
                <>
                  <div className="font-semibold text-orange-deep mb-1">
                    {t('fiche.criticality')}: {t(`fiche.criticality.${r.suggestedCriticality}`)} · {t('fiche.priority')}: P{r.suggestedPriority}
                  </div>
                  {r.similarPastFiches?.length > 0 && (
                    <ul className="list-disc ps-5 space-y-1 text-grey-ink">
                      {r.similarPastFiches.map((f, i) => <li key={i}>{f.ficheNumber} — {f.title}</li>)}
                    </ul>
                  )}
                </>
              )}
            />
            {lastClassification && (
              <div className="text-[11px] text-grey-medium">Last run: {new Date(lastClassification.created_at).toLocaleString()} · confidence {Math.round((lastClassification.confidence_score || 0) * 100)}%</div>
            )}
          </div>
        </Card>
      )}

      {tab === 'understanding' && (
        <div className="space-y-3">
          <AiPanel
            label={t('fiche.aiProblemStructuring')}
            ficheId={id}
            onRun={(connection) => api.post(`/ai-agents/${id}/problem-structuring`, { connection })}
            summarize={(r) => r.suggestions?.[0] || 'Problem structuring draft'}
            render={(r) => (
              <ul className="list-disc ps-5 space-y-1 text-grey-ink">
                {r.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            )}
          />
          <UnderstandingTab fiche={fiche} onSaved={load} />
        </div>
      )}

      {tab === 'immediate' && (
        <div className="space-y-3">
          <AiPanel
            label={t('fiche.aiContainment')}
            ficheId={id}
            onRun={(connection) => api.post(`/ai-agents/${id}/containment-advisor`, { connection })}
            summarize={(r) => r.suggestions?.[0] || 'Containment suggestion'}
            render={(r) => (
              <ul className="list-disc ps-5 space-y-1 text-grey-ink">
                {r.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            )}
          />
          <ActionsTab
            actions={immediateActions} actionType="immediate" ficheId={id} users={users}
            hasPermission={hasPermission} currentUserId={user.id} onChanged={load} allowCreate allowExecute
          />
        </div>
      )}

      {tab === 'rootcause' && (
        <div className="space-y-3">
          <AiPanel
            label={t('fiche.aiRootCause')}
            ficheId={id}
            onRun={(connection) => api.post(`/ai-agents/${id}/root-cause-mining`, { connection })}
            summarize={(r) => r.suggestedCauses?.[0] || 'Root cause suggestion'}
            render={(r) => (
              <ul className="list-disc ps-5 space-y-1 text-grey-ink">
                {r.suggestedCauses.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            )}
          />
          <RootCausesTab fiche={fiche} onSaved={load} hasPermission={hasPermission} />
        </div>
      )}

      {tab === 'corrective' && (
        <div className="space-y-3">
          <p className="text-xs text-grey-ink italic">{t('fiche.planOnly')}</p>
          <AiPanel
            label={t('fiche.aiActionRecommendation')}
            ficheId={id}
            onRun={(connection) => api.post(`/ai-agents/${id}/action-recommendation`, {
              root_cause_text: fiche.rootCauses.map((rc) => rc.description).join(' ') || fiche.description, connection,
            })}
            summarize={(r) => r.suggestions?.[0] || 'Corrective action suggestion'}
            render={(r) => (
              <ul className="list-disc ps-5 space-y-1 text-grey-ink">
                {r.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            )}
          />
          <ActionsTab
            actions={correctiveActions} actionType="corrective" ficheId={id} users={users}
            hasPermission={hasPermission} currentUserId={user.id} onChanged={load} rootCauses={fiche.rootCauses}
            allowCreate allowExecute={false}
          />
        </div>
      )}

      {tab === 'evaluation' && (
        <div className="space-y-3">
          <p className="text-xs text-grey-ink italic">{t('fiche.evaluationIntro')}</p>
          <AiPanel
            label={t('fiche.aiEvaluationAssistant')}
            ficheId={id}
            onRun={(connection) => api.post(`/ai-agents/${id}/evaluation-assistant`, { connection })}
            summarize={(r) => r.suggestions?.[0] || 'Evaluation context'}
            render={(r) => (
              <>
                <ul className="list-disc ps-5 space-y-1 text-grey-ink">
                  {r.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
                {r.historicalEffectivenessRate !== null && (
                  <div className="mt-2 text-xs text-grey-medium">{t('fiche.aiHistoricalRate')}: {r.historicalEffectivenessRate}% ({r.sampleSize} {t('fiche.aiEvaluated')})</div>
                )}
              </>
            )}
          />
          <ActionsTab
            actions={correctiveActions} actionType="corrective" ficheId={id} users={users}
            hasPermission={hasPermission} currentUserId={user.id} onChanged={load}
            allowCreate={false} allowExecute
          />
        </div>
      )}

      {tab === 'rex' && <RexTab fiche={fiche} onSaved={load} hasPermission={hasPermission} />}
    </div>
  );
}

function UnderstandingTab({ fiche, onSaved }) {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const [form, setForm] = useState(fiche.understanding || {
    what: '', who_detected: '', where_: '', when_: '', how_detected: '', why_problem: '', how_much: '', objectives: '',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    await api.put(`/fiches/${fiche.id}/understanding`, form);
    onSaved();
  }

  return (
    <Card title="5W2H / QQOQCCP">
      <form onSubmit={save} className="grid grid-cols-2 gap-x-4">
        <Field label="What?"><input className="input" value={form.what || ''} onChange={set('what')} disabled={!hasPermission('fiche.edit')} /></Field>
        <Field label="Where?"><input className="input" value={form.where_ || ''} onChange={set('where_')} disabled={!hasPermission('fiche.edit')} /></Field>
        <Field label="When?"><input className="input" value={form.when_ || ''} onChange={set('when_')} disabled={!hasPermission('fiche.edit')} /></Field>
        <Field label="Who detected?"><input className="input" value={form.who_detected || ''} onChange={set('who_detected')} disabled={!hasPermission('fiche.edit')} /></Field>
        <Field label="Why is it a problem?"><input className="input" value={form.why_problem || ''} onChange={set('why_problem')} disabled={!hasPermission('fiche.edit')} /></Field>
        <Field label="How detected?"><input className="input" value={form.how_detected || ''} onChange={set('how_detected')} disabled={!hasPermission('fiche.edit')} /></Field>
        <Field label="How much (gap)?"><input className="input" value={form.how_much || ''} onChange={set('how_much')} disabled={!hasPermission('fiche.edit')} /></Field>
        <Field label="Objectives"><input className="input" value={form.objectives || ''} onChange={set('objectives')} disabled={!hasPermission('fiche.edit')} /></Field>
        {hasPermission('fiche.edit') && <button type="submit" className="btn-primary col-span-2 mt-2 justify-self-end">{t('common.save')}</button>}
      </form>
    </Card>
  );
}

function ActionsTab({ actions, actionType, ficheId, users, hasPermission, currentUserId, onChanged, rootCauses = [], allowCreate = true, allowExecute = true }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ description: '', responsible_owner_id: '', planned_completion_date: '', root_cause_id: '' });
  const [showForm, setShowForm] = useState(false);
  const canCreate = allowCreate && hasPermission('action.create');

  async function create(e) {
    e.preventDefault();
    await api.post('/actions', { ...form, fiche_id: ficheId, action_type: actionType, root_cause_id: form.root_cause_id || null });
    setForm({ description: '', responsible_owner_id: '', planned_completion_date: '', root_cause_id: '' });
    setShowForm(false);
    onChanged();
  }

  return (
    <div className="space-y-3">
      {canCreate && (
        <div className="flex justify-end">
          <button onClick={() => setShowForm((s) => !s)} className="btn-secondary text-xs">+ {t('action.new')}</button>
        </div>
      )}
      {canCreate && showForm && (
        <Card>
          <form onSubmit={create} className="space-y-2">
            <Field label={t('common.description')}><textarea className="input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required /></Field>
            {actionType === 'corrective' && rootCauses.length > 0 && (
              <Field label={t('rootcause.description')}>
                <select className="input" value={form.root_cause_id} onChange={(e) => setForm((f) => ({ ...f, root_cause_id: e.target.value }))}>
                  <option value="">{t('common.optional')}</option>
                  {rootCauses.map((rc) => <option key={rc.id} value={rc.id}>{rc.description.slice(0, 60)}</option>)}
                </select>
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('action.responsible')}>
                <select className="input" value={form.responsible_owner_id} onChange={(e) => setForm((f) => ({ ...f, responsible_owner_id: e.target.value }))}>
                  <option value="">—</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                </select>
              </Field>
              <Field label={t('action.plannedDate')}>
                <input className="input" type="date" value={form.planned_completion_date} onChange={(e) => setForm((f) => ({ ...f, planned_completion_date: e.target.value }))} />
              </Field>
            </div>
            <button type="submit" className="btn-primary text-xs">{t('common.create')}</button>
          </form>
        </Card>
      )}
      <div className="grid gap-3">
        {actions.map((a) => (
          <ActionCard key={a.id} action={a} users={users} hasPermission={hasPermission} currentUserId={currentUserId} onChanged={onChanged} allowExecute={allowExecute} />
        ))}
        {actions.length === 0 && <EmptyState message={t('common.noResults')} />}
      </div>
    </div>
  );
}

function RootCausesTab({ fiche, onSaved, hasPermission }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ description: '', cause_category: 'method' });
  const [showForm, setShowForm] = useState(false);

  async function create(e) {
    e.preventDefault();
    await api.post(`/fiches/${fiche.id}/root-causes`, form);
    setForm({ description: '', cause_category: 'method' });
    setShowForm(false);
    onSaved();
  }

  return (
    <div className="space-y-3">
      {hasPermission('rootcause.create') && (
        <div className="flex justify-end">
          <button onClick={() => setShowForm((s) => !s)} className="btn-secondary text-xs">+ {t('rootcause.new')}</button>
        </div>
      )}
      {showForm && (
        <Card>
          <form onSubmit={create} className="space-y-2">
            <Field label={t('rootcause.description')}><textarea className="input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required /></Field>
            <Field label={t('rootcause.category')}>
              <select className="input" value={form.cause_category} onChange={(e) => setForm((f) => ({ ...f, cause_category: e.target.value }))}>
                {['man', 'machine', 'method', 'material', 'measurement', 'milieu'].map((c) => <option key={c} value={c}>{t(`rootcause.category.${c}`)}</option>)}
              </select>
            </Field>
            <button type="submit" className="btn-primary text-xs">{t('common.create')}</button>
          </form>
        </Card>
      )}
      <div className="grid gap-3">
        {fiche.rootCauses.map((rc) => (
          <div key={rc.id} className="card p-4">
            <div className="badge bg-grey-light text-grey-ink mb-2">{t(`rootcause.category.${rc.cause_category}`)}</div>
            <div className="text-sm text-grey-dark">{rc.description}</div>
          </div>
        ))}
        {fiche.rootCauses.length === 0 && <EmptyState message={t('common.noResults')} />}
      </div>
    </div>
  );
}

function RexTab({ fiche, onSaved, hasPermission }) {
  const { t } = useI18n();
  const [form, setForm] = useState(fiche.rex || {
    lessons_learned: '', root_cause_summary: '', solution_summary: '',
    needs_standardization: false, needs_generalization: false, tags: '',
  });
  const [generating, setGenerating] = useState(false);
  const [draftMeta, setDraftMeta] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setBool = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.checked }));

  async function generateDraft() {
    setGenerating(true);
    try {
      const connection = getLlmConnection();
      const draft = await api.post(`/fiches/${fiche.id}/rex/generate-draft`, { connection });
      const { useCaseId, generatedBy, grounding, llmNarrative, ...fields } = draft;
      setForm((f) => ({ ...f, ...fields }));
      setDraftMeta({ useCaseId, generatedBy, grounding, llmNarrative });
    } catch {
      setDraftMeta(null);
    } finally { setGenerating(false); }
  }

  async function save(e) {
    e.preventDefault();
    await api.put(`/fiches/${fiche.id}/rex`, form);
    onSaved();
  }

  return (
    <Card>
      {hasPermission('rex.create') && (
        <div className="mb-3">
          <button onClick={generateDraft} disabled={generating} className="btn-secondary text-xs">🤖 {t('rex.generateDraft')}</button>
          {draftMeta && (
            <div className="mt-2 bg-orange-tint/50 rounded-md p-3">
              <AiGeneratedNotice generatedBy={draftMeta.generatedBy} />
              <GroundingDisclosure grounding={draftMeta.grounding} llmNarrative={draftMeta.llmNarrative} />
              <OutcomeButtons useCaseId={draftMeta.useCaseId} outputSummary={form.lessons_learned} generatedBy={draftMeta.generatedBy} ficheId={fiche.id} />
            </div>
          )}
        </div>
      )}
      <form onSubmit={save} className="space-y-3">
        <Field label={t('rex.lessonsLearned')}><textarea className="input" rows={3} value={form.lessons_learned || ''} onChange={set('lessons_learned')} disabled={!hasPermission('rex.edit')} /></Field>
        <Field label={t('rex.rootCauseSummary')}><textarea className="input" rows={2} value={form.root_cause_summary || ''} onChange={set('root_cause_summary')} disabled={!hasPermission('rex.edit')} /></Field>
        <Field label={t('rex.solutionSummary')}><textarea className="input" rows={2} value={form.solution_summary || ''} onChange={set('solution_summary')} disabled={!hasPermission('rex.edit')} /></Field>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.needs_standardization} onChange={setBool('needs_standardization')} disabled={!hasPermission('rex.edit')} />{t('rex.needsStandardization')}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.needs_generalization} onChange={setBool('needs_generalization')} disabled={!hasPermission('rex.edit')} />{t('rex.needsGeneralization')}</label>
        </div>
        <Field label={t('rex.tags')}><input className="input" value={form.tags || ''} onChange={set('tags')} disabled={!hasPermission('rex.edit')} /></Field>
        {hasPermission('rex.edit') && <button type="submit" className="btn-primary">{t('common.save')}</button>}
      </form>
    </Card>
  );
}
