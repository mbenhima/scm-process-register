// Full-page error state (graphical chart §20.3): a screen that fails to render shows an icon,
// a headline and the actions to recover, never a blank page.
import { Component } from 'react';

const TEXT = {
  en: ['This screen could not be displayed.', 'Your data is safe. Reload the page, or go back to the home page.', 'Reload the page', 'Home page'],
  fr: ['Cet écran n’a pas pu s’afficher.', 'Vos données sont en sécurité. Rechargez la page ou revenez à l’accueil.', 'Recharger la page', 'Accueil'],
  ar: ['تعذر عرض هذه الشاشة.', 'بياناتك آمنة. أعد تحميل الصفحة أو عد إلى الصفحة الرئيسية.', 'إعادة تحميل الصفحة', 'الصفحة الرئيسية'],
};

export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('Screen error', error, info?.componentStack); } // eslint-disable-line no-console
  componentDidUpdate(prev) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (!this.state.error) return this.props.children;
    const lang = document.documentElement.lang || 'en';
    const [h, p, reload, home] = TEXT[lang] || TEXT.en;
    return (
      <div className="empty" role="alert" style={{ minHeight: '50vh' }}>
        <span className="badge-icon lg" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg></span>
        <h4>{h}</h4>
        <p className="small">{p}</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>{reload}</button>
          <a className="btn" href="/">{home}</a>
        </div>
        <p className="xsmall muted">{String(this.state.error?.message || '').slice(0, 200)}</p>
      </div>
    );
  }
}
