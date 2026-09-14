import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Surfaces the Business Rules, Controls, and Risks & Opportunities tagged to
// this NCP Sheet stage (S1-S7), directly on the stage's own tab. Silently
// renders nothing if the Organization's Pack does not include the GRC
// modules (Resolve) or none are tagged to this stage — this is a value-add
// surface, never a blocker for the stage's own workflow.
export default function StageGovernancePanel({ stage }) {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const [rules, setRules] = useState(null);
  const [controls, setControls] = useState(null);
  const [risks, setRisks] = useState(null);

  useEffect(() => {
    if (hasPermission('businessRule.view')) api.get(`/business-rules?ncp_stage=${stage}`).then(setRules).catch(() => setRules([]));
    if (hasPermission('control.view')) api.get(`/controls?ncp_stage=${stage}`).then(setControls).catch(() => setControls([]));
    if (hasPermission('riskOpportunity.view')) api.get(`/risks?ncp_stage=${stage}`).then(setRisks).catch(() => setRisks([]));
  }, [stage]);

  const groups = [
    { key: 'businessRule', rows: rules, label: t('stageGov.businessRules') },
    { key: 'control', rows: controls, label: t('stageGov.controls') },
    { key: 'riskOpportunity', rows: risks, label: t('stageGov.risks') },
  ].filter((g) => g.rows && g.rows.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="mt-4 p-3 rounded-lg bg-grey-light border border-grey-line">
      <div className="text-xs font-semibold text-grey-medium uppercase tracking-wide mb-2">{t('stageGov.title')} — {stage}</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {groups.map((g) => (
          <div key={g.key}>
            <div className="text-[11px] font-semibold text-orange-deep mb-1">{g.label}</div>
            <ul className="space-y-1">
              {g.rows.map((r) => (
                <li key={r.id} className="text-xs text-grey-ink">
                  <span className="font-semibold text-grey-dark">{r.code}</span> — {r.title}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
