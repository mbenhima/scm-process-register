import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Field, EmptyState } from '../components/ui.jsx';
import { TierBadge } from '../components/AiGovernance.jsx';

export default function AiUseCaseDetailPage() {
  const { id } = useParams();
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [viewingVersion, setViewingVersion] = useState(null);

  const load = useCallback(() => {
    api.get(`/ai-use-cases/${id}`).then(setData).catch(() => {});
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (!data) return <EmptyState message={t('common.loading')} />;
  const canEdit = hasPermission('aiUseCase.edit');

  async function saveMetadata(fields) {
    await api.put(`/ai-use-cases/${id}`, fields);
    load();
  }
  async function saveNewVersion(content) {
    await api.post(`/ai-use-cases/${id}/versions`, content);
    load();
  }
  async function revert(versionId, versionNumber) {
    if (!confirm(t('aiUseCase.confirmRevert'))) return;
    await api.post(`/ai-use-cases/${id}/versions/${versionId}/revert`, {});
    setViewingVersion(null);
    load();
  }
  async function viewVersion(versionId) {
    const v = await api.get(`/ai-use-cases/${id}/versions/${versionId}`);
    setViewingVersion(v);
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/ai-use-cases')} className="text-sm text-grey-ink hover:text-orange-deep">
        &larr; {t('aiUseCase.backToLibrary')}
      </button>

      <div className="flex items-center gap-2 flex-wrap">
        <div>
          <div className="eyebrow">{t('aiUseCase.title')}</div>
          <h1 className="font-title font-bold text-2xl text-grey-dark">{data.title}</h1>
        </div>
        <TierBadge tier={data.tier} />
      </div>

      <MetadataCard data={data} canEdit={canEdit} onSave={saveMetadata} t={t} />

      <ActivationCard useCase={data} onChanged={load} t={t} hasPermission={hasPermission} />

      <VersionEditorCard version={data.currentVersion} canEdit={canEdit} onSave={saveNewVersion} t={t} />

      <Card title={t('aiUseCase.versionHistory')}>
        <div className="divide-y divide-grey-line">
          {data.versions.map((v) => (
            <div key={v.id} className="py-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-grey-dark">
                  {t('aiUseCase.version')} {v.version_number}
                  {v.version_number === 1 && <span className="badge bg-grey-light text-grey-ink ms-2">{t('aiUseCase.default')}</span>}
                  {v.is_current ? <span className="badge bg-orange-tint text-orange-deep ms-2">{t('aiUseCase.currentVersion')}</span> : null}
                </div>
                <div className="text-xs text-grey-medium">
                  {v.change_note} · {v.first_name ? `${v.first_name} ${v.last_name}` : ''} · {new Date(v.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2 whitespace-nowrap">
                <button onClick={() => viewVersion(v.id)} className="btn-secondary !py-1 !px-2 text-xs">{t('aiUseCase.viewVersion')}</button>
                {canEdit && !v.is_current && (
                  <button onClick={() => revert(v.id, v.version_number)} className="btn-secondary !py-1 !px-2 text-xs">{t('aiUseCase.revert')}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {viewingVersion && (
        <Card title={`${t('aiUseCase.version')} ${viewingVersion.version_number}`} action={<button onClick={() => setViewingVersion(null)} className="text-grey-medium hover:text-grey-dark text-xl leading-none">×</button>}>
          <ReadOnlySections version={viewingVersion} t={t} />
        </Card>
      )}

      {hasPermission('aiUseCase.viewUsageLog') && <UsageLogCard useCaseId={id} t={t} />}
    </div>
  );
}

function ReadOnlySections({ version, t }) {
  return (
    <div className="space-y-3 text-sm">
      <div><div className="label">{t('aiUseCase.inputs')}</div><p className="text-grey-ink whitespace-pre-wrap">{version.inputs || '—'}</p></div>
      <div><div className="label">{t('aiUseCase.prompt')}</div><p className="text-grey-ink whitespace-pre-wrap">{version.prompt || '—'}</p></div>
      <div><div className="label">{t('aiUseCase.expectedOutput')}</div><p className="text-grey-ink whitespace-pre-wrap">{version.expected_output || '—'}</p></div>
      <div><div className="label">{t('aiUseCase.constraints')}</div><p className="text-grey-ink whitespace-pre-wrap">{version.constraints_guardrails || '—'}</p></div>
      <div><div className="label">{t('aiUseCase.modelNotes')}</div><p className="text-grey-ink whitespace-pre-wrap">{version.model_technique_notes || '—'}</p></div>
    </div>
  );
}

function MetadataCard({ data, canEdit, onSave, t }) {
  const [form, setForm] = useState({
    title: data.title, description: data.description, business_function: data.business_function,
    ai_technique: data.ai_technique, maturity_stage: data.maturity_stage, status: data.status,
    tier: data.tier || 'assistive', module_key: data.module_key || '', trigger_desc: data.trigger_desc || '',
    output_desc: data.output_desc || '', human_checkpoint: data.human_checkpoint || '',
    expected_impact: data.expected_impact || '', estimated_roi: data.estimated_roi || '', tags: data.tags || '',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Card title={t('aiUseCase.metadata')}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <Field label={t('common.name')}><input className="input" value={form.title} onChange={set('title')} disabled={!canEdit} /></Field>
        <Field label={t('common.description')}><textarea className="input" value={form.description} onChange={set('description')} disabled={!canEdit} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('aiUseCase.tier')}>
            <select className="input" value={form.tier} onChange={set('tier')} disabled={!canEdit}>
              <option value="assistive">{t('aiUseCase.tier.assistive')}</option>
              <option value="augmented">{t('aiUseCase.tier.augmented')}</option>
            </select>
          </Field>
          <Field label={t('aiUseCase.moduleKey')}><input className="input" value={form.module_key} onChange={set('module_key')} disabled={!canEdit} /></Field>
        </div>
        <Field label={t('aiUseCase.trigger')}><textarea className="input" rows={2} value={form.trigger_desc} onChange={set('trigger_desc')} disabled={!canEdit} /></Field>
        <Field label={t('aiUseCase.output')}><textarea className="input" rows={2} value={form.output_desc} onChange={set('output_desc')} disabled={!canEdit} /></Field>
        <Field label={t('aiUseCase.humanCheckpoint')}><textarea className="input" rows={2} value={form.human_checkpoint} onChange={set('human_checkpoint')} disabled={!canEdit} /></Field>
        <div className="grid grid-cols-4 gap-3">
          <Field label={t('aiUseCase.businessFunction')}>
            <select className="input" value={form.business_function} onChange={set('business_function')} disabled={!canEdit}>
              {['quality', 'maintenance', 'supply_chain', 'hr', 'finance', 'operations', 'customer_service'].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label={t('aiUseCase.aiTechnique')}>
            <select className="input" value={form.ai_technique} onChange={set('ai_technique')} disabled={!canEdit}>
              {['predictive_analytics', 'nlp', 'computer_vision', 'rag', 'optimization', 'anomaly_detection'].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label={t('aiUseCase.maturity')}>
            <select className="input" value={form.maturity_stage} onChange={set('maturity_stage')} disabled={!canEdit}>
              {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label={t('common.status')}>
            <select className="input" value={form.status} onChange={set('status')} disabled={!canEdit}>
              {['idea', 'pilot', 'production', 'retired'].map((v) => <option key={v} value={v}>{t(`aiUseCase.status.${v}`)}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('aiUseCase.expectedImpact')}><textarea className="input" value={form.expected_impact} onChange={set('expected_impact')} disabled={!canEdit} /></Field>
          <Field label={t('aiUseCase.roi')}><input className="input" value={form.estimated_roi} onChange={set('estimated_roi')} disabled={!canEdit} /></Field>
        </div>
        {canEdit && <button type="submit" className="btn-secondary text-xs">{t('common.save')}</button>}
      </form>
    </Card>
  );
}

// canActivateAiForOrg (org-level) + canRequestProjectAiOverride (per-Project tri-state).
// Deliberately separate from MetadataCard: activation is a distinct capability from
// editing the catalog's content (FR-M6-01 vs FR-M6-03/04).
function ActivationCard({ useCase, onChanged, t, hasPermission }) {
  const [projects, setProjects] = useState([]);
  const canActivate = hasPermission('aiUseCase.activate');
  const canOverride = hasPermission('aiUseCase.projectOverride');

  useEffect(() => {
    if (canOverride) api.get('/hierarchy/projects').then(setProjects).catch(() => {});
  }, [canOverride]);

  async function toggleOrgActivation() {
    await api.put(`/ai-use-cases/${useCase.id}/activation`, { is_active: useCase.is_active ? 0 : 1 });
    onChanged();
  }
  async function setOverride(projectId, override) {
    await api.put(`/ai-use-cases/${useCase.id}/project-override/${projectId}`, { override });
    onChanged();
  }

  if (!canActivate && !canOverride) return null;

  return (
    <Card title={t('aiUseCase.activation')}>
      {canActivate && (
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={toggleOrgActivation}
            className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${useCase.is_active ? 'bg-orange' : 'bg-grey-line'}`}
          >
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${useCase.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
          <span className="text-sm text-grey-dark">{useCase.is_active ? t('aiUseCase.active') : t('aiUseCase.inactive')} {t('aiUseCase.forOrg')}</span>
        </div>
      )}
      {canOverride && (
        <div>
          <div className="label mb-2">{t('aiUseCase.projectOverrides')}</div>
          {projects.length === 0 && <p className="text-xs text-grey-medium">{t('common.noResults')}</p>}
          <div className="space-y-2">
            {projects.map((p) => {
              const existing = useCase.projectOverrides?.find((o) => o.project_id === p.id);
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-grey-ink">{p.name}</span>
                  <select
                    className="input !w-40 !py-1 text-xs"
                    value={existing?.override || 'inherit'}
                    onChange={(e) => setOverride(p.id, e.target.value)}
                  >
                    <option value="inherit">{t('aiUseCase.override.inherit')}</option>
                    <option value="on">{t('aiUseCase.override.on')}</option>
                    <option value="off">{t('aiUseCase.override.off')}</option>
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

function UsageLogCard({ useCaseId, t }) {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get(`/ai-usage-log?useCaseId=${useCaseId}`).then(setRows).catch(() => {}); }, [useCaseId]);
  const OUTCOME_STYLES = { accepted: 'bg-status-green text-green-900', edited: 'bg-status-amber text-amber-900', rejected: 'bg-status-red text-red-800' };
  return (
    <Card title={t('aiUseCase.usageLog')} subtitle={t('aiUseCase.usageLogSubtitle')}>
      {rows.length === 0 && <p className="text-xs text-grey-medium">{t('common.noResults')}</p>}
      <div className="divide-y divide-grey-line">
        {rows.map((r) => (
          <div key={r.id} className="py-2 flex items-center justify-between gap-3 text-sm">
            <div>
              <div className="text-grey-dark">{r.output_summary}</div>
              <div className="text-xs text-grey-medium">
                {r.first_name ? `${r.first_name} ${r.last_name}` : t('common.noResults')} · {new Date(r.created_at).toLocaleString()} · {r.generated_by}
              </div>
            </div>
            <span className={`badge ${OUTCOME_STYLES[r.outcome] || 'bg-grey-light text-grey-ink'}`}>{t(`aiGov.outcome.${r.outcome}`)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function VersionEditorCard({ version, canEdit, onSave, t }) {
  const [form, setForm] = useState({
    inputs: version?.inputs || '', prompt: version?.prompt || '', expected_output: version?.expected_output || '',
    constraints_guardrails: version?.constraints_guardrails || '', model_technique_notes: version?.model_technique_notes || '',
    change_note: '',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Card
      title={`${t('aiUseCase.currentVersion')} — ${t('aiUseCase.version')} ${version?.version_number ?? ''}`}
      action={version?.version_number === 1 ? <span className="badge bg-orange-tint text-orange-deep">{t('aiUseCase.default')}</span> : null}
    >
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); setForm((f) => ({ ...f, change_note: '' })); }}>
        <Field label={t('aiUseCase.inputs')}><textarea className="input" rows={2} value={form.inputs} onChange={set('inputs')} disabled={!canEdit} /></Field>
        <Field label={t('aiUseCase.prompt')}><textarea className="input" rows={3} value={form.prompt} onChange={set('prompt')} disabled={!canEdit} /></Field>
        <Field label={t('aiUseCase.expectedOutput')}><textarea className="input" rows={2} value={form.expected_output} onChange={set('expected_output')} disabled={!canEdit} /></Field>
        <Field label={t('aiUseCase.constraints')}><textarea className="input" rows={2} value={form.constraints_guardrails} onChange={set('constraints_guardrails')} disabled={!canEdit} /></Field>
        <Field label={t('aiUseCase.modelNotes')}><textarea className="input" rows={2} value={form.model_technique_notes} onChange={set('model_technique_notes')} disabled={!canEdit} /></Field>
        {canEdit && (
          <>
            <Field label={t('aiUseCase.changeNote')}><input className="input" value={form.change_note} onChange={set('change_note')} placeholder={t('common.optional')} /></Field>
            <button type="submit" className="btn-primary">{t('aiUseCase.saveAsNewVersion')}</button>
          </>
        )}
      </form>
    </Card>
  );
}
