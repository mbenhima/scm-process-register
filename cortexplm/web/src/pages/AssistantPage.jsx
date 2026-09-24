import { useI18n } from '../lib/i18n.jsx';
import { PageHeader, Card } from '../components/ui.jsx';
import { ChatPanel } from '../components/Assistant.jsx';

export default function AssistantPage() {
  const { t } = useI18n();
  return (
    <div className="page">
      <PageHeader eyebrow={t('AI & knowledge')} title={t('AI Assistant')} subtitle={t('Answers questions about your organization within your permissions, and explains how to use the application. It runs offline on the built-in engine.')} />
      <div className="grid two">
        <Card className="flush" style={{ display: 'flex', flexDirection: 'column', height: 600 }}><ChatPanel /></Card>
        <Card className="quiet">
          <h3>{t('What it can answer')}</h3>
          <ul className="list-plain small">
            {['Active projects by track', 'Gates waiting for a decision', 'Your open tasks', 'Overdue tasks', 'Top open risks', 'Any built-in KPI, for example "time to market"', 'Unread alerts', 'Projects by current E2E process', 'How-to questions about any screen'].map((x) => <li key={x}>{t(x)}</li>)}
          </ul>
          <p className="muted">{t('Each data question needs a specific permission. When your roles do not include it, the assistant says so instead of answering.')}</p>
        </Card>
      </div>
    </div>
  );
}
