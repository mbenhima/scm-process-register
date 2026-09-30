// OBS roles (FR-DA-OBS): roles defined in units, linked to one or more functions, played by
// one or more people (holder, deputy, acting) with dates and allocation. Views by role, by
// function and by person; every change of a role is versioned.
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { api } from '../lib/api.js';
import { Loading, Tabs, Table, tx, Modal, Field, Status } from './ui.jsx';
import VersionsModal from './Versions.jsx';

export default function ObsRoles({ orgId, write }) {
  const { t, L, lang, toast, can, fmtDate } = useApp();
  const [view, setView] = useState('roles');
  const { data, reload } = useData(`/orgs/${orgId}/obs-roles`);
  const { data: fns } = useData(`/orgs/${orgId}/design?type=function`);
  const { data: obs } = useData(`/orgs/${orgId}/obs`);
  const { data: users } = useData(`/orgs/${orgId}/users`);
  const { data: rbac } = useData('/roles');
  const [ed, setEd] = useState(null);
  const [asg, setAsg] = useState(null);
  const [hist, setHist] = useState(null);
  if (!data) return <Loading />;
  const manage = write && can('obs.manage');
  const units = (obs?.nodes || obs || []).filter?.(n => !n.project_id) || [];
  const saveRole = async () => {
    try {
      const body = { name: ed.name, mission: ed.mission, responsibilities: ed.responsibilities, functions: ed.functions, unitId: ed.unitId || null, accessRoles: ed.accessRoles, note: ed.note };
      if (ed.id) await api(`/obs-roles/${ed.id}`, { method: 'PUT', body }); else await api(`/orgs/${orgId}/obs-roles`, { method: 'POST', body });
      toast(t('Role saved (new version).')); setEd(null); reload();
    } catch (e) { toast(e.message, 'error'); }
  };
  const retire = async (r) => { const j = window.prompt(t('Justification')); if (!j) return; try { await api(`/obs-roles/${r.id}`, { method: 'DELETE', body: { justification: j } }); toast(t('Role retired; its assignments ended today.')); reload(); } catch (e) { toast(e.message, 'error'); } };
  const assign = async () => { try { await api(`/obs-roles/${asg.roleId}/assignments`, { method: 'POST', body: asg }); toast(t('Person assigned to the role.')); setAsg(null); reload(); } catch (e) { toast(e.message, 'error'); } };
  const endAsg = async (a) => { try { const r = await api(`/role-assignments/${a.id}`, { method: 'PUT', body: { endDate: new Date().toISOString().slice(0, 10) } }); toast(r.openWork?.length ? t('Assignment ended. {n} open actions of this person need a new owner.', { n: r.openWork.length }) : t('Assignment ended.')); reload(); } catch (e) { toast(e.message, 'error'); } };
  const fnName = (id) => tx((fns?.items || []).find(f => f.id === id)?.data?.name, lang) || id;
  return (
    <div className="stack">
      <div className="row-between" style={{ flexWrap: 'wrap' }}>
        <Tabs label={t('Role views')} value={view} onChange={setView} tabs={[{ id: 'roles', label: t('By role'), count: data.roles.length }, { id: 'functions', label: t('By function') }, { id: 'people', label: t('By person'), count: data.people.length }]} />
        {manage && <button className="btn btn-primary" onClick={() => setEd({ name: '', mission: '', responsibilities: '', functions: [], unitId: '', accessRoles: ['contributor'], note: '' })}><Plus size={16} />{t('New role')}</button>}
      </div>
      <p className="small muted">{t('A role is linked to one or more functions and can be played by several people; a person can play several roles. Roles describe what people do; access rights stay with the access roles.')}{data.vacant.length ? ` ${t('{n} role(s) without a current holder.', { n: data.vacant.length })}` : ''}</p>
      {view === 'roles' && <Table rows={data.roles} columns={[
        { key: 'name', label: t('Role'), render: r => <span className="strong">{tx(r.name, lang)}</span>, sortValue: r => tx(r.name, lang) },
        { key: 'unit', label: t('Unit'), render: r => (r.unit ? tx(r.unit.name, lang) : '—') },
        { key: 'functions', label: t('Functions'), render: r => r.functions.map(f => tx(f.name, lang)).join(', ') },
        { key: 'holders', label: t('Played by'), render: r => (r.holders.length ? r.holders.map(h => `${h.name}${h.holderType !== 'Holder' ? ` (${L(h.holderType)}, ${h.allocation}%)` : ''}`).join('; ') : <span className="tag s1">{t('Vacant')}</span>) },
        { key: 'version', label: t('Version'), width: 80, render: r => `v${r.version}` },
        { key: 'act', label: '', sortable: false, render: r => <span className="row" style={{ gap: 4 }}>
          <button className="btn btn-sm btn-ghost" onClick={() => setHist(r.id)}>{t('History')}</button>
          {manage && <><button className="btn btn-sm btn-ghost" onClick={() => setEd({ id: r.id, name: tx(r.name, lang), mission: tx(r.mission, lang) || '', responsibilities: tx(r.responsibilities, lang) || '', functions: r.functions.map(f => f.id), unitId: r.unit?.id || '', accessRoles: r.accessRoles, holders: r.holders, note: '' })}>{t('Edit')}</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setAsg({ roleId: r.id, userId: '', holderType: 'Holder', allocation: 100, startDate: new Date().toISOString().slice(0, 10), endDate: '' })}>{t('Assign')}</button>
          <button className="btn btn-sm btn-ghost" onClick={() => retire(r)}>{t('Retire')}</button></>}
        </span> },
      ]} />}
      {view === 'functions' && <Table rows={data.functions} columns={[
        { key: 'id', label: t('Code'), width: 80 }, { key: 'name', label: t('Function'), render: f => <span className="strong">{tx(f.name, lang)}</span> },
        { key: 'roles', label: t('Roles'), render: f => f.roles.map(r => tx(r.name, lang)).join(', ') || '—' },
        { key: 'people', label: t('People'), render: f => [...new Set(f.roles.flatMap(r => r.holders))].join(', ') || '—' },
      ]} />}
      {view === 'people' && <Table rows={data.people} columns={[
        { key: 'name', label: t('Person'), render: p => <span className="strong">{p.name}</span> },
        { key: 'roles', label: t('Roles played'), render: p => p.roles.map(r => `${tx(r.name, lang)}${r.holderType !== 'Holder' ? ` (${L(r.holderType)})` : ''} — ${r.allocation}%`).join('; ') },
        { key: 'n', label: t('Number of roles'), render: p => p.roles.length, sortValue: p => p.roles.length },
      ]} />}
      {ed && (
        <Modal wide title={ed.id ? t('Edit role') : t('New role')} onClose={() => setEd(null)} footer={<><button className="btn" onClick={() => setEd(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!ed.name.trim() || !ed.functions.length} onClick={saveRole}>{t('Save')}</button></>}>
          <div className="stack">
            <div className="form-grid">
              <Field label={t('Role name')} required>{(id) => <input id={id} className="input" value={ed.name} onChange={e => setEd({ ...ed, name: e.target.value })} />}</Field>
              <Field label={t('Unit')}>{(id) => <select id={id} className="select" value={ed.unitId} onChange={e => setEd({ ...ed, unitId: e.target.value })}><option value="">—</option>{units.map(n => <option key={n.id} value={n.id}>{tx(n.name, lang)} ({L(n.type)})</option>)}</select>}</Field>
              <Field label={t('Access role proposed to holders')}>{(id) => <select id={id} className="select" value={ed.accessRoles[0] || ''} onChange={e => setEd({ ...ed, accessRoles: [e.target.value] })}>{['owner', 'contributor', 'viewer', 'reporter', 'readonly'].map(x => <option key={x} value={x}>{L(x)}</option>)}</select>}</Field>
            </div>
            <fieldset className="stack-8"><legend className="small strong">{t('Functions (at least one)')}</legend>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 6 }}>{(fns?.items || []).map(f => <label key={f.id} className="checkbox small"><input type="checkbox" checked={ed.functions.includes(f.id)} onChange={e => setEd({ ...ed, functions: e.target.checked ? [...ed.functions, f.id] : ed.functions.filter(x => x !== f.id) })} /><span>{f.id} {tx(f.data.name, lang)}</span></label>)}</div>
            </fieldset>
            <Field label={t('Mission')}>{(id) => <textarea id={id} className="textarea" value={ed.mission} onChange={e => setEd({ ...ed, mission: e.target.value })} />}</Field>
            <Field label={t('Responsibilities')}>{(id) => <textarea id={id} className="textarea" value={ed.responsibilities} onChange={e => setEd({ ...ed, responsibilities: e.target.value })} />}</Field>
            {ed.holders?.length > 0 && <div className="stack-8"><div className="small strong">{t('Played by')}</div>{ed.holders.map(h => <div key={h.id} className="row small">{h.name} — {L(h.holderType)} · {h.allocation}% · {t('since')} {fmtDate(h.start)}{manage && <button className="btn btn-sm btn-ghost" onClick={() => endAsg(h)}>{t('End assignment')}</button>}</div>)}</div>}
            {ed.id && <Field label={t('Change note')}>{(id) => <input id={id} className="input" value={ed.note} onChange={e => setEd({ ...ed, note: e.target.value })} />}</Field>}
          </div>
        </Modal>
      )}
      {asg && (
        <Modal title={t('Assign a person to the role')} onClose={() => setAsg(null)} footer={<><button className="btn" onClick={() => setAsg(null)}>{t('Cancel')}</button><button className="btn btn-primary" disabled={!asg.userId} onClick={assign}>{t('Assign')}</button></>}>
          <div className="stack">
            <Field label={t('Person')} required>{(id) => <select id={id} className="select" value={asg.userId} onChange={e => setAsg({ ...asg, userId: e.target.value })}><option value="">{t('Choose…')}</option>{(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>}</Field>
            <div className="form-grid">
              <Field label={t('As')}>{(id) => <select id={id} className="select" value={asg.holderType} onChange={e => setAsg({ ...asg, holderType: e.target.value })}>{['Holder', 'Deputy', 'Acting'].map(x => <option key={x} value={x}>{L(x)}</option>)}</select>}</Field>
              <Field label={t('Allocation (%)')}>{(id) => <input id={id} className="input" type="number" min="1" max="100" value={asg.allocation} onChange={e => setAsg({ ...asg, allocation: e.target.value })} />}</Field>
              <Field label={t('Start date')}>{(id) => <input id={id} className="input" type="date" value={asg.startDate} onChange={e => setAsg({ ...asg, startDate: e.target.value })} />}</Field>
              <Field label={t('End date')}>{(id) => <input id={id} className="input" type="date" value={asg.endDate} onChange={e => setAsg({ ...asg, endDate: e.target.value })} />}</Field>
            </div>
          </div>
        </Modal>
      )}
      {hist && <VersionsModal type="obs_role" id={hist} onClose={() => setHist(null)} onReverted={() => { setHist(null); reload(); }} />}
      {rbac && null}
    </div>
  );
}
