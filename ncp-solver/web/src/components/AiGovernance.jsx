import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';

// Shared building blocks for every AI-generated output in the app (the
// "AiSuggestionBox" pattern): a visible AI-generated/review label (FR-M6-06),
// disclosure of the methodology references it was grounded in (FR-M6-11),
// and Accept/Edit/Reject controls that log the outcome to the append-only
// AI Usage Log (FR-M6-07). Used by FicheDetailPage's per-stage panels and by
// anywhere else in the app an AI Use Case produces an output a human must
// review before relying on it.

export function TierBadge({ tier }) {
  const { t } = useI18n();
  const styles = tier === 'augmented' ? 'bg-overlayBlue/15 text-overlayBlue' : 'bg-grey-light text-grey-ink';
  return <span className={`badge ${styles}`}>{t(`aiUseCase.tier.${tier || 'assistive'}`)}</span>;
}

export function AiGeneratedNotice({ generatedBy }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-orange-deep mb-2">
      <span>🤖</span>
      <span>{t('aiGov.generatedLabel')}</span>
      {generatedBy && (
        <span className="badge bg-grey-light text-grey-medium !text-[10px] !py-0">
          {t(generatedBy === 'llm' ? 'aiGov.sourceLlm' : 'aiGov.sourceDeterministic')}
        </span>
      )}
    </div>
  );
}

export function GroundingDisclosure({ grounding, llmNarrative }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  if (!grounding && !llmNarrative) return null;
  return (
    <div className="mt-2 border-t border-grey-line pt-2">
      {llmNarrative && <p className="text-sm text-grey-ink italic mb-2">{llmNarrative}</p>}
      {grounding && (
        <button type="button" onClick={() => setOpen((o) => !o)} className="text-[11px] text-grey-medium underline">
          {open ? t('aiGov.hideGrounding') : `${t('aiGov.showGrounding')} (${grounding.length})`}
        </button>
      )}
      {open && (
        grounding.length ? (
          <ul className="mt-1 text-[11px] text-grey-medium list-disc ps-4 space-y-0.5">
            {grounding.map((g, i) => <li key={i}><strong>{g.code}</strong> — {g.title}</li>)}
          </ul>
        ) : (
          <p className="mt-1 text-[11px] text-grey-medium">{t('aiGov.noGrounding')}</p>
        )
      )}
    </div>
  );
}

export function OutcomeButtons({ useCaseId, outputSummary, generatedBy, ficheId, projectId, onLogged }) {
  const { t } = useI18n();
  const [logged, setLogged] = useState(null);

  async function log(outcome) {
    if (!useCaseId) return;
    try {
      await api.post('/ai-usage-log', {
        use_case_id: useCaseId, outcome, output_summary: String(outputSummary || '').slice(0, 500),
        generated_by: generatedBy, fiche_id: ficheId || null, project_id: projectId || null,
      });
    } catch { /* logging is best-effort; never block the user's workflow on it */ }
    setLogged(outcome);
    onLogged?.(outcome);
  }

  if (!useCaseId) return null;
  if (logged) return <div className="mt-2 text-[11px] text-grey-medium">{t(`aiGov.outcome.${logged}`)}</div>;
  return (
    <div className="mt-2 flex gap-2">
      <button type="button" onClick={() => log('accepted')} className="text-[11px] font-semibold text-green-700 hover:underline">{t('aiGov.accept')}</button>
      <button type="button" onClick={() => log('edited')} className="text-[11px] font-semibold text-orange-deep hover:underline">{t('aiGov.markEdited')}</button>
      <button type="button" onClick={() => log('rejected')} className="text-[11px] font-semibold text-grey-medium hover:underline">{t('aiGov.reject')}</button>
    </div>
  );
}
