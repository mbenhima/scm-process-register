import { useSearchParams } from 'react-router-dom';
import { useApp, useData } from '../lib/state.jsx';
import { PageHead, Tabs, tx } from '../components/ui.jsx';
import MultiEntry from '../components/multientry/MultiEntry.jsx';
import { NoProject } from './Home.jsx';


export default function Registers() {
  const { t, lang, projectId, project } = useApp();
  const { data: regs } = useData(projectId ? `/projects/${projectId}/registers` : null);
  const { data: defs } = useData('/register-defs');
  const [params, setParams] = useSearchParams();
  const reg = params.get('reg') || 'context';
  if (!projectId) return <NoProject />;
  // Each register is a Multi-Entry: rows typed, pasted or imported in place (SRS 4.49).
  const def = (defs || []).find(d => d.key === reg);
  return (
    <>
      <PageHead eyebrow={t('Records')} title={t('Registers')} subtitle={t('The registers each phase of the run fills in: context, parties, objectives, obligations, suppliers, ideas and more.')} />
      <Tabs label={t('Registers')} value={reg} onChange={(v) => setParams({ reg: v }, { replace: true })} tabs={(regs || []).map(r => ({ id: r.key, label: tx((defs || []).find(d => d.key === r.key)?.name, lang) || r.key, count: r.count }))} />
      <MultiEntry key={`${projectId}:${reg}`} source={`reg:${projectId}:${reg}`} title={tx(def?.name, lang)} context={project?.code} countLabel={(n) => t('{n} entries.', { n })} backLabel={`${project?.code || ''} ${tx(def?.name, lang) || ''}`} newRow={() => ({ status: reg === 'ideas' ? 'Proposed' : 'Active' })} />
    </>
  );
}
