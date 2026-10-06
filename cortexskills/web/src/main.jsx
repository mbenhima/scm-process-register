import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// Fonts are served with the application, never from a third-party service (NFR-DA-VDS-05).
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/400-italic.css';
import '@fontsource/open-sans/600.css';
import '@fontsource/open-sans/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/noto-sans-arabic/400.css';
import '@fontsource/noto-sans-arabic/600.css';
import '@fontsource/noto-sans-arabic/700.css';
import '@fontsource/noto-kufi-arabic/700.css';
import '@fontsource/noto-kufi-arabic/800.css';
import './styles/app.css';
import { I18nProvider } from './lib/i18n.jsx';
import { SessionProvider } from './lib/session.jsx';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode><BrowserRouter><I18nProvider><SessionProvider><App /></SessionProvider></I18nProvider></BrowserRouter></React.StrictMode>,
);
