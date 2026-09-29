import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/source-serif-4/400.css';
import '@fontsource/source-serif-4/700.css';
import '@fontsource/source-sans-3/400.css';
import '@fontsource/source-sans-3/400-italic.css';
import '@fontsource/source-sans-3/600.css';
import '@fontsource/source-sans-3/700.css';
import '@fontsource/noto-naskh-arabic/400.css';
import '@fontsource/noto-naskh-arabic/700.css';
import './styles/app.css';
import { I18nProvider } from './lib/i18n.jsx';
import { SessionProvider } from './lib/session.jsx';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode><BrowserRouter><I18nProvider><SessionProvider><App /></SessionProvider></I18nProvider></BrowserRouter></React.StrictMode>,
);
