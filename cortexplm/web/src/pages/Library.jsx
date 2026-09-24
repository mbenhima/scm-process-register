import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n.jsx';
import { PageHeader, Card, CardHead, DataTable, useFetch, Skeleton, ErrorNote, Select, Badge } from '../components/ui.jsx';
import { HBars } from '../components/charts.jsx';
import { useProcessAi, AiBadges, AiLegend } from '../components/ProcessAi.jsx';

// Parts of the Process Design Reference (the letter shown in the Part column).
const PART_NOTE = { A: 'Macro processes of the physical product lifecycle', B: 'Macro processes of the service lifecycle', C: 'Governance, quality, compliance and support processes used by every lifecycle', D: 'Processes that differentiate the offer (sustainability, digital thread, analytics)', E: 'Processes needed only in some industries (life sciences, A&D, automotive, MedTech)', I: 'Processes that bundle products and services into one offer', J: 'Processes of pure service industries', K: 'Phase-gate, checklist, track and configuration processes of CortexPLM itself' };

export default function Library() {
  const { t } = useI18n();
  const nav = useNavigate();
  const { data, error } = useFetch('/reference/macro-processes');
  const [cat, setCat] = useState('');
  const ai = useProcessAi();
  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  if (!data) return <div className="page"><Skeleton h={500} /></div>;
  const cats = [...new Set(data.map((m) => m.category))];
  return (
    <div className="page">
      <PageHeader eyebrow={t('Process design reference')} title={t('Macro processes')} subtitle={t('69 reusable building blocks, each described as a SIPOC card with {s} tasks and steps.', { s: data.reduce((a, m) => a + m.stepCount, 0) })} />
      <div className="grid two">
        <Card>
          <DataTable csvName="macro_processes" rows={data.filter((m) => !cat || m.category === cat)} pageSize={70} onRowClick={(m) => nav(`/library/${m.id}`)}
            toolbar={<Select aria-label={t('Category')} value={cat} onChange={(e) => setCat(e.target.value)} placeholder={t('All categories')} options={cats.map((c) => ({ value: c, label: t(c) }))} style={{ width: 'auto' }} />}
            columns={[
              { key: 'id', label: t('ID'), sortValue: (m) => Number(m.id.slice(3)) },
              { key: 'name', label: t('Macro process'), render: (m) => <><div className="strong">{t(m.name)}</div><div className="xs muted">{t(m.goal)}</div></> },
              { key: 'category', label: t('Part'), render: (m) => <Badge>{m.part}</Badge>, csv: (m) => m.category },
              { key: 'owner', label: t('Owner role'), csv: (m) => m.d01?.Owner_Role, render: (m) => t(m.d01?.Owner_Role) },
              { key: 'stepCount', label: t('Steps'), num: true },
              { key: 'ai', label: t('AI'), sortable: false, csv: (m) => ai.forMp(m.id).map((u) => `${u.code} ${u.tier}`).join('; '), render: (m) => <AiBadges list={ai.forMp(m.id)} compact empty={<span className="muted xs">—</span>} /> },
              { key: 'usedIn', label: t('Used in'), render: (m) => <span className="xs">{t(m.usedIn)}</span> },
            ]} />
        </Card>
        <div className="stack">
        <Card>
          <CardHead title={t('Legend: Part')} subtitle={t('The Part letter is the section of the Process Design Reference the macro process comes from. Parts F to H are not used.')} />
          <div className="table-wrap"><table className="data compact">
            <thead><tr><th>{t('Part')}</th><th>{t('Category')}</th><th>{t('What it covers')}</th><th className="num">{t('Macro processes')}</th></tr></thead>
            <tbody>{[...new Map(data.map((m) => [m.part, m.category])).entries()].map(([part, c]) => (
              <tr key={part}><td><Badge>{part}</Badge></td><td className="strong">{t(c)}</td><td className="small">{t(PART_NOTE[part] || '')}</td><td className="num">{data.filter((m) => m.part === part).length}</td></tr>
            ))}</tbody>
          </table></div>
          <div style={{ marginTop: 12 }}><AiLegend /></div>
        </Card>
        <Card>
          <h3>{t('Macro processes by category')}</h3>
          <HBars data={cats.map((c) => ({ label: t(c), value: data.filter((m) => m.category === c).length }))} caption={t('Parts A to K of the Process Design Reference; parts F to H are not used.')} />
        </Card>
        </div>
      </div>
    </div>
  );
}
