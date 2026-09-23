// Audit trail (FR-DA-AUD-01..04): read-only, who changed what, when, from which value to which, and why.
import { useState } from 'react';
import { useI18n } from '../../lib/i18n.jsx';
import { PageHeader, Card, DataTable, useFetch, Skeleton, ErrorNote, SearchBox, Select, Badge } from '../../components/ui.jsx';

const clip = (v) => (v == null || v === '' ? '—' : String(v).length > 80 ? `${String(v).slice(0, 78)}…` : String(v));

export default function Audit() {
  const { t } = useI18n();
  const [qText, setQ] = useState('');
  const [type, setType] = useState('');
  const [applied, setApplied] = useState({ q: '', type: '' });
  const params = new URLSearchParams({ limit: '1000', ...(applied.q ? { q: applied.q } : {}), ...(applied.type ? { entity_type: applied.type } : {}) });
  const { data, error } = useFetch(`/audit?${params}`);
  const types = ['project', 'e2e_run', 'task', 'checklist_item', 'gate_review', 'user', 'organization', 'group', 'obs_node', 'configuration', 'settings', 'permission_matrix', 'integration', 'licence', 'ai_use_case', 'knowledge', 'template', 'rex_entry', 'business_rule', 'control', 'risk', 'kpi', 'custom_kpi', 'racsi_activity', 'bpmn', 'wbs', 'track_config', 'alert_setting', 'report'];
  return (
    <div className="page">
      <PageHeader eyebrow={t('Administration · Audit trail')} title={t('Audit trail')} subtitle={t('Every governed change with its author, time, previous value, new value and justification. The trail is read-only.')} />
      <Card>
        <form className="row" style={{ gap: 12, marginBottom: 16, flexWrap: 'wrap' }} onSubmit={(e) => { e.preventDefault(); setApplied({ q: qText, type }); }}>
          <div style={{ flex: '1 1 260px' }}><SearchBox value={qText} onChange={setQ} placeholder={t('Search user, action, field or justification')} /></div>
          <div style={{ flex: '0 1 240px' }}><Select aria-label={t('Record type')} value={type} onChange={(e) => { setType(e.target.value); setApplied({ q: qText, type: e.target.value }); }} placeholder={t('All record types')} options={types.map((v) => ({ value: v, label: v }))} /></div>
          <button type="submit" className="btn btn-secondary">{t('Search')}</button>
        </form>
        {error ? <ErrorNote error={error} /> : !data ? <Skeleton h={300} /> : (
          <DataTable csvName="audit_trail" rows={data} filterable={false} columns={[
            { key: 'created_at', label: t('Date'), render: (r) => <span className="xs num">{String(r.created_at).slice(0, 16).replace('T', ' ')}</span> },
            { key: 'user_name', label: t('User'), render: (r) => r.user_name || t('System') },
            { key: 'entity_type', label: t('Record'), csv: (r) => `${r.entity_type} ${r.entity_id}`, render: (r) => <><Badge>{r.entity_type}</Badge> <span className="xs muted">#{r.entity_id}</span></> },
            { key: 'action', label: t('Action') }, { key: 'field', label: t('Field'), render: (r) => r.field || '—' },
            { key: 'before_value', label: t('Before'), render: (r) => <span className="xs">{clip(r.before_value)}</span> },
            { key: 'after_value', label: t('After'), render: (r) => <span className="xs">{clip(r.after_value)}</span> },
            { key: 'justification', label: t('Justification'), render: (r) => <span className="xs">{clip(r.justification)}</span> },
          ]} empty={t('No audit entry matches.')} />
        )}
      </Card>
    </div>
  );
}
