// Where AI sits in the process design. An AI use case is linked to a step (e.g. MP-01.2), a macro process
// (MP-01), a user-facing task (UFT-01-01) or an E2E process (E2E-01). The badges show the active use cases
// (Assistive AI or Augmented AI) and run them; the person then accepts, modifies or rejects the suggestion.
import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { useFetch, Modal } from './ui.jsx';
import AiSuggest from './AiSuggest.jsx';

const mpOf = (link = '') => (link.match(/^MP-\d+/) || [])[0];
const mpsIn = (text = '') => [...new Set(text.match(/MP-\d+/g) || [])];

export function useProcessAi() {
  const { can, feature } = useAuth();
  const { data } = useFetch(can('ai.view') && feature('ai') ? '/ai/use-cases' : null);
  return useMemo(() => {
    const all = data || [];
    const active = all.filter((u) => u.effective);
    const linkOf = (u) => String(u.linked_step || '').trim();
    return {
      ready: !!data, all, active,
      forStep: (stepId) => active.filter((u) => linkOf(u) === stepId),
      forMp: (mpId) => active.filter((u) => mpOf(linkOf(u)) === mpId),
      forTask: (task) => active.filter((u) => linkOf(u) === task.id || mpsIn(task.macroProcesses).includes(mpOf(linkOf(u)))),
      forE2E: (e2e) => active.filter((u) => linkOf(u) === e2e.id || e2e.tasks.some((x) => linkOf(u) === x.id || mpsIn(x.macroProcesses).includes(mpOf(linkOf(u))))),
    };
  }, [data]);
}

// One badge per use case: special sparkle icon, tier in words. Click to run it.
export function AiBadge({ uc, compact, context = {} }) {
  const { t } = useI18n();
  const { can } = useAuth();
  const [open, setOpen] = useState(false);
  const aug = uc.tier === 'Augmented';
  const label = `${uc.code} ${t(uc.name)} · ${t(aug ? 'Augmented AI' : 'Assistive AI')}`;
  return (
    <>
      <button type="button" className={`ai-badge ${aug ? 'aug' : ''}`} title={can('ai.use') ? t('{u}. Run it and accept, modify or reject the suggestion.', { u: label }) : label} aria-label={label}
        onClick={() => can('ai.use') && setOpen(true)} disabled={!can('ai.use')}>
        <Sparkles size={12} aria-hidden />{compact ? uc.code : <>{uc.code} · {t(aug ? 'Augmented AI' : 'Assistive AI')}</>}
      </button>
      {open && (
        <Modal wide title={`${uc.code} ${t(uc.name)}`} subtitle={`${t(aug ? 'Augmented AI' : 'Assistive AI')} · ${t('Human checkpoint')}: ${t(uc.human_checkpoint)}`} onClose={() => setOpen(false)}>
          <AiSuggest lockedId={uc.id} recordType={context.recordType || 'process'} recordId={context.recordId ?? null} projectId={context.projectId} onUse={context.onUse && ((txt) => { context.onUse(txt); setOpen(false); })} />
        </Modal>
      )}
    </>
  );
}

export function AiBadges({ list, compact, empty = null, context }) {
  if (!list.length) return empty;
  return <span className="ai-badges">{list.map((u) => <AiBadge key={u.id} uc={u} compact={compact} context={context} />)}</span>;
}

export function AiLegend() {
  const { t } = useI18n();
  return (
    <div className="legend" aria-label={t('AI legend')}>
      <span><span className="ai-badge static"><Sparkles size={12} aria-hidden />{t('Assistive AI')}</span> {t('suggests; a person decides and does the work')}</span>
      <span><span className="ai-badge aug static"><Sparkles size={12} aria-hidden />{t('Augmented AI')}</span> {t('drafts the result; a person reviews and approves it')}</span>
      <span className="muted">{t('Only active use cases are shown. Select a badge to run it, then Accept, Modify or Reject.')}</span>
    </div>
  );
}
