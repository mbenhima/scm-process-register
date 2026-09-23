import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useAuth } from '../../lib/auth.jsx';
import { useI18n } from '../../lib/i18n.jsx';
import { post, del } from '../../lib/api.js';
import { PageHeader, Card, useFetch, Skeleton, Select, Button, Modal, Field, Input, useToast, SearchBox, Badge } from '../../components/ui.jsx';

const LETTERS = ['R', 'A', 'C', 'S', 'I'];

export default function Racsi() {
  const { t } = useI18n();
  const { can } = useAuth();
  const toast = useToast();
  const { data, reload } = useFetch('/racsi');
  const [proc, setProc] = useState('E2E-01');
  const [q, setQ] = useState('');
  const [add, setAdd] = useState(null);
  const [newAct, setNewAct] = useState(null);
  const procs = useMemo(() => [...new Set((data || []).map((a) => a.process_tag).filter(Boolean))], [data]);
  if (!data) return <div className="page"><Skeleton h={400} /></div>;
  const rows = data.filter((a) => (!proc || a.process_tag === proc) && (!q || a.name.toLowerCase().includes(q.toLowerCase())));
  const manage = can('racsi.manage');
  return (
    <div className="page">
      <PageHeader eyebrow={t('Governance')} title={t('RACSI matrix')} subtitle={t('Responsible, Accountable, Consulted, Supportive, Informed. Each activity has exactly one Accountable; the database refuses a second.')}
        actions={manage && <Button variant="primary" icon={Plus} onClick={() => setNewAct({ name: '', process_tag: proc })}>{t('Add activity')}</Button>} />
      <Card>
        <div className="table-tools"><div className="row"><Select aria-label={t('Process')} value={proc} onChange={(e) => setProc(e.target.value)} placeholder={t('All processes')} options={procs} style={{ width: 'auto' }} /><div style={{ minWidth: 240 }}><SearchBox value={q} onChange={setQ} /></div></div><span className="muted">{t('{n} rows', { n: rows.length })}</span></div>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>{t('Activity')}</th>{LETTERS.map((l) => <th key={l}>{l}</th>)}</tr></thead>
            <tbody>{rows.map((a) => (
              <tr key={a.id}>
                <td className="strong">{t(a.name)}<div className="xs muted">{a.linked_type} {a.linked_id}</div></td>
                {LETTERS.map((l) => (
                  <td key={l}>
                    <div className="stack tight">
                      {a.assignments.filter((x) => x.letter === l).map((x) => (
                        <span key={x.id} className="row" style={{ gap: 4 }}><Badge tone={l === 'A' ? 'accent' : 'outline'}>{t(x.assignee)}</Badge>
                          {manage && <button type="button" className="icon-btn sm" aria-label={t('Remove {x}', { x: x.assignee })} onClick={async () => { try { await del(`/racsi/${a.id}/assignments/${x.id}`); reload(); } catch (e) { toast.err(e); } }}><X aria-hidden /></button>}</span>
                      ))}
                      {manage && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAdd({ activity: a, letter: l, assignee: '' })} aria-label={t('Add {l}', { l })}><Plus aria-hidden /></button>}
                    </div>
                  </td>
                ))}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
      {add && (
        <Modal title={t('Assign {l} for {a}', { l: add.letter, a: add.activity.name })} onClose={() => setAdd(null)}
          footer={<><Button onClick={() => setAdd(null)}>{t('Cancel')}</Button><Button variant="primary" disabled={!add.assignee.trim()} onClick={async () => { try { await post(`/racsi/${add.activity.id}/assignments`, { letter: add.letter, assignee: add.assignee }); setAdd(null); reload(); } catch (e) { toast.err(e); } }}>{t('Save')}</Button></>}>
          <Field label={t('Person or role')} required><Input value={add.assignee} onChange={(e) => setAdd({ ...add, assignee: e.target.value })} /></Field>
        </Modal>
      )}
      {newAct && (
        <Modal title={t('Add activity')} onClose={() => setNewAct(null)}
          footer={<><Button onClick={() => setNewAct(null)}>{t('Cancel')}</Button><Button variant="primary" disabled={!newAct.name.trim()} onClick={async () => { try { await post('/racsi', newAct); setNewAct(null); reload(); } catch (e) { toast.err(e); } }}>{t('Save')}</Button></>}>
          <div className="form-grid"><Field label={t('Activity')} required full><Input value={newAct.name} onChange={(e) => setNewAct({ ...newAct, name: e.target.value })} /></Field>
            <Field label={t('Process tag')}><Input value={newAct.process_tag} onChange={(e) => setNewAct({ ...newAct, process_tag: e.target.value })} /></Field>
            <Field label={t('Linked record (e.g. BR-004, CTL-01, RSK-01)')}><Input value={newAct.linked_id || ''} onChange={(e) => setNewAct({ ...newAct, linked_id: e.target.value, linked_type: e.target.value.split('-')[0] })} /></Field></div>
        </Modal>
      )}
    </div>
  );
}
