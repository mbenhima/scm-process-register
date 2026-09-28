import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { PageHead, Loading, ErrorBox, Status, Tabs, Table, tx, Modal, Field, Search } from '../components/ui.jsx';
import { VersionsButton } from '../components/Versions.jsx';
import { NoProject } from './Home.jsx';

const RULE_TYPES = ['Validation', 'Notification', 'Escalation', 'Calculation'];
const COSO = ['Control Environment', 'Risk Assessment', 'Control Activities', 'Information & Communication', 'Monitoring Activities'];

export default function Rules() {
  const { t, L, lang, project, toast, can, readOnly } = useApp();
  const [tab, setTab] = useState('rules');
  const [q, setQ] = useState('');
  const orgId = project?.org?.id;
  const rules = useData(orgId && tab === 'rules' ? `/orgs/${orgId}/rules` : null);
  const controls = useData(orgId && tab === 'controls' ? `/orgs/${orgId}/controls` : null);
  const { data: roles } = useData('/roles');
  const [edit, setEdit] = useState(null);
  if (!project) return <NoProject />;
  const cur = tab === 'rules' ? rules : controls;
  const manage = can('governance.manage') && !readOnly;
  const filtered = (cur.data || []).filter(r => !q || JSON.stringify([r.code, tx(r.condition || r.name, lang), r.step_ref]).toLowerCase().includes(q.toLowerCase()));
  const save = async () => {
    const f = edit.form;
    try {
      if (tab === 'rules') { if (edit.row) await api(`/rules/${edit.row.id}`, { method: 'PUT', body: f }); else await api(`/orgs/${orgId}/rules`, { method: 'POST', body: f }); }
      else if (edit.row) await api(`/controls/${edit.row.id}`, { method: 'PUT', body: f }); else await api(`/orgs/${orgId}/controls`, { method: 'POST', body: f });
      toast(t('Saved.')); setEdit(null); cur.reload();
    } catch (e) { toast(e.message, 'error'); }
  };
  const roleSelect = (id, v, on) => <select id={id} className="select" value={v} onChange={e => on(e.target.value)}>{(roles || []).map(r => <option key={r.code} value={r.code}>{tx(r.name, lang)}</option>)}</select>;
  return (
    <>
      <PageHead eyebrow={t('Governance')} title={t('Rules and controls')} subtitle={t('Business rules act on workflow steps; controls are classified by COSO component and linked to the steps they secure.')}
        actions={manage && <button className="btn btn-primary" onClick={() => setEdit({ row: null, form: tab === 'rules' ? { ruleType: 'Validation', severity: 'Medium', ownerRole: 'ims_manager' } : { type: 'Preventive', coso: 'Control Activities', frequency: 'Quarterly', ownerRole: 'ims_manager' } })}><Plus size={16} />{tab === 'rules' ? t('New rule') : t('New control')}</button>} />
      <Tabs label={t('Governance lists')} value={tab} onChange={setTab} tabs={[{ id: 'rules', label: t('Business rules') }, { id: 'controls', label: t('Controls') }]} />
      <div style={{ marginBottom: 16, maxWidth: 420 }}><Search value={q} onChange={setQ} placeholder={t('Search')} /></div>
      {cur.error && <ErrorBox error={cur.error} />}
      {cur.loading && !cur.data ? <Loading /> : tab === 'rules' ? (
        <Table rows={filtered} onRowClick={manage ? (r) => setEdit({ row: r, form: { condition: tx(r.condition, lang), action: tx(r.action, lang), ruleType: r.rule_type, severity: r.severity, ownerRole: r.owner_role, active: !!r.active } }) : undefined} columns={[
          { key: 'code', label: t('Code'), width: 90 }, { key: 'step_ref', label: t('Step'), width: 110 },
          { key: 'condition', label: t('Condition'), render: r => tx(r.condition, lang), sortValue: r => tx(r.condition, lang) },
          { key: 'action', label: t('Action'), render: r => tx(r.action, lang) },
          { key: 'rule_type', label: t('Type'), render: r => L(r.rule_type) },
          { key: 'severity', label: t('Severity'), render: r => <Status value={r.severity} /> },
          { key: 'active', label: t('Active'), render: r => (r.active ? t('Yes') : t('No')) },
        ]} />
      ) : (
        <Table rows={filtered} onRowClick={manage ? (r) => setEdit({ row: r, form: { name: tx(r.name, lang), description: tx(r.description, lang), type: r.type, coso: r.coso, frequency: r.frequency, ownerRole: r.owner_role, effectiveness: r.effectiveness } }) : undefined} columns={[
          { key: 'code', label: t('Code'), width: 110 }, { key: 'name', label: t('Control'), render: r => <span className="strong">{tx(r.name, lang)}</span>, sortValue: r => tx(r.name, lang) },
          { key: 'coso', label: 'COSO', render: r => L(r.coso) }, { key: 'type', label: t('Type'), render: r => L(r.type) },
          { key: 'standard', label: t('Standard') }, { key: 'frequency', label: t('Frequency'), render: r => L(r.frequency) },
          { key: 'effectiveness', label: t('Effectiveness'), render: r => <Status value={r.effectiveness} /> },
        ]} />
      )}
      {edit && (
        <Modal title={edit.row ? `${edit.row.code}` : tab === 'rules' ? t('New rule') : t('New control')} onClose={() => setEdit(null)} footer={<>{edit.row && <VersionsButton type={tab === 'rules' ? 'rule' : 'control'} id={edit.row.id} onReverted={cur.reload} />}<button className="btn" onClick={() => setEdit(null)}>{t('Cancel')}</button><button className="btn btn-primary" onClick={save}>{t('Save')}</button></>}>
          {tab === 'rules' ? (
            <div className="stack">
              {!edit.row && <Field label={t('Triggering step (e.g. MP-018.3)')}>{(id) => <input id={id} className="input" value={edit.form.stepRef || ''} onChange={e => setEdit({ ...edit, form: { ...edit.form, stepRef: e.target.value } })} />}</Field>}
              <Field label={t('Condition')} required>{(id) => <textarea id={id} className="textarea" value={edit.form.condition || ''} onChange={e => setEdit({ ...edit, form: { ...edit.form, condition: e.target.value } })} />}</Field>
              <Field label={t('Action')} required>{(id) => <input id={id} className="input" value={edit.form.action || ''} onChange={e => setEdit({ ...edit, form: { ...edit.form, action: e.target.value } })} />}</Field>
              <div className="form-grid">
                <Field label={t('Type')}>{(id) => <select id={id} className="select" value={edit.form.ruleType} onChange={e => setEdit({ ...edit, form: { ...edit.form, ruleType: e.target.value } })}>{RULE_TYPES.map(x => <option key={x} value={x}>{L(x)}</option>)}</select>}</Field>
                <Field label={t('Severity')}>{(id) => <select id={id} className="select" value={edit.form.severity} onChange={e => setEdit({ ...edit, form: { ...edit.form, severity: e.target.value } })}>{['Low', 'Medium', 'High', 'Critical'].map(x => <option key={x} value={x}>{L(x)}</option>)}</select>}</Field>
                <Field label={t('Owner')}>{(id) => roleSelect(id, edit.form.ownerRole, v => setEdit({ ...edit, form: { ...edit.form, ownerRole: v } }))}</Field>
              </div>
              {edit.row && <label className="checkbox"><input type="checkbox" checked={edit.form.active} onChange={e => setEdit({ ...edit, form: { ...edit.form, active: e.target.checked } })} /><span>{t('Active')}</span></label>}
            </div>
          ) : (
            <div className="stack">
              <Field label={t('Name')} required>{(id) => <input id={id} className="input" value={edit.form.name || ''} onChange={e => setEdit({ ...edit, form: { ...edit.form, name: e.target.value } })} />}</Field>
              <Field label={t('Description')}>{(id) => <textarea id={id} className="textarea" value={edit.form.description || ''} onChange={e => setEdit({ ...edit, form: { ...edit.form, description: e.target.value } })} />}</Field>
              <div className="form-grid">
                <Field label="COSO">{(id) => <select id={id} className="select" value={edit.form.coso} onChange={e => setEdit({ ...edit, form: { ...edit.form, coso: e.target.value } })}>{COSO.map(x => <option key={x} value={x}>{L(x)}</option>)}</select>}</Field>
                <Field label={t('Type')}>{(id) => <select id={id} className="select" value={edit.form.type} onChange={e => setEdit({ ...edit, form: { ...edit.form, type: e.target.value } })}>{['Preventive', 'Detective', 'Corrective', 'Manual', 'Automated'].map(x => <option key={x} value={x}>{L(x)}</option>)}</select>}</Field>
                <Field label={t('Frequency')}>{(id) => <select id={id} className="select" value={edit.form.frequency} onChange={e => setEdit({ ...edit, form: { ...edit.form, frequency: e.target.value } })}>{['Per event', 'Weekly', 'Monthly', 'Quarterly', 'Annual'].map(x => <option key={x} value={x}>{L(x)}</option>)}</select>}</Field>
                <Field label={t('Effectiveness')}>{(id) => <select id={id} className="select" value={edit.form.effectiveness || 'Not tested'} onChange={e => setEdit({ ...edit, form: { ...edit.form, effectiveness: e.target.value } })}>{['Not tested', 'Effective', 'Needs improvement'].map(x => <option key={x} value={x}>{L(x)}</option>)}</select>}</Field>
                <Field label={t('Owner')}>{(id) => roleSelect(id, edit.form.ownerRole, v => setEdit({ ...edit, form: { ...edit.form, ownerRole: v } }))}</Field>
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
