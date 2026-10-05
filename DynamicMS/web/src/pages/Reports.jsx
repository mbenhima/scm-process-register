import { useState } from 'react';
import { FileBarChart, FileText, FileSpreadsheet, FileType, Download } from 'lucide-react';
import { useApp, useData } from '../lib/state.jsx';
import { download } from '../lib/api.js';
import { PageHead, Card, Loading, ErrorBox, IconBadge, Table, tx } from '../components/ui.jsx';
import { NoProject } from './Home.jsx';

const FMT = [['pdf', 'PDF', FileText], ['xlsx', 'Excel', FileSpreadsheet], ['docx', 'Word', FileType], ['csv', 'CSV', FileBarChart]];

export default function Reports() {
  const { t, lang, projectId, project, toast, can } = useApp();
  const { data, loading, error } = useData('/reports');
  const plan = useData(projectId ? `/projects/${projectId}/reporting-plan` : null);
  const [fmt, setFmt] = useState('pdf');
  const [rl, setRl] = useState(lang);
  const [busy, setBusy] = useState(null);
  if (!projectId) return <NoProject />;
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const get = async (r) => {
    setBusy(r.id);
    try { await download(`/projects/${projectId}/reports/${r.id}?format=${fmt}&lang=${rl}`, `${project.code}-${r.id}-${rl}.${fmt}`); toast(t('Report downloaded.')); } catch (e) { toast(e.message, 'error'); } finally { setBusy(null); }
  };
  return (
    <>
      <PageHead eyebrow={t('Insight')} title={t('Reports')} subtitle={t('Every report is computed from the live records of the project and exported in the language you choose.')} />
      <div className="grid-side">
        <Card title={t('Export options')}>
          <div className="stack">
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="strong small" style={{ marginBottom: 8 }}>{t('Format')}</legend>
              <div className="stack-8">{FMT.map(([id, label, I]) => <label key={id} className="checkbox"><input type="radio" name="fmt" checked={fmt === id} onChange={() => setFmt(id)} /><span className="row" style={{ gap: 8 }}><I size={16} aria-hidden="true" />{label}</span></label>)}</div>
            </fieldset>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="strong small" style={{ marginBottom: 8 }}>{t('Language')}</legend>
              <div className="stack-8">{[['en', 'English'], ['fr', 'Français'], ['ar', 'العربية']].map(([id, label]) => <label key={id} className="checkbox"><input type="radio" name="rl" checked={rl === id} onChange={() => setRl(id)} /><span>{label}</span></label>)}</div>
            </fieldset>
            {!can('reports.export') && <p className="small muted">{t('Your role can view reports but not export them.')}</p>}
          </div>
        </Card>
        <div className="stack">
          <div className="grid-cards">
            {data.project.map(r => (
              <div key={r.id} className="card tight stack-8">
                <div className="row"><IconBadge icon={FileBarChart} accent={r.id === 'review'} size="sm" /><span className="strong">{r.name}</span></div>
                <button className="btn btn-sm" disabled={!can('reports.export') || busy === r.id} onClick={() => get(r)}><Download size={16} />{busy === r.id ? t('Preparing…') : t('Download {f}', { f: fmt.toUpperCase() })}</button>
              </div>
            ))}
          </div>
          <Card title={t('Reporting plan of the project')} action={plan.data?.template && <span className="small muted">{t('From template {c} v{v}', { c: plan.data.template.code, v: plan.data.template.version })}</span>}>
            {plan.data ? <Table rows={plan.data.items} columns={[{ key: 'id', label: t('Code'), width: 90 }, { key: 'name', label: t('Report'), render: r => tx(r.name, lang) }, { key: 'audience', label: t('Audience'), render: r => tx(r.audience, lang) }, { key: 'frequency', label: t('Frequency'), render: r => tx(r.frequency, lang) }, { key: 'format', label: t('Format'), width: 90 }, { key: 'owner', label: t('Owner'), render: r => tx(r.ownerName, lang) }]} /> : <Loading />}
            <p className="caption">{t('The reports defined by the project template (Project templates › Reporting); the reference catalog applies to projects created without a template.')}</p>
          </Card>
        </div>
      </div>
    </>
  );
}
