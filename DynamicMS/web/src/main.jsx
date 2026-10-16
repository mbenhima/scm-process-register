import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
// AI Value typography: Montserrat (headings, KPI numbers), Open Sans (body and UI), JetBrains Mono (codes).
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/600.css';
import '@fontsource/open-sans/700.css';
import '@fontsource/open-sans/400-italic.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/noto-sans-arabic/400.css';
import '@fontsource/noto-sans-arabic/600.css';
import '@fontsource/noto-sans-arabic/700.css';
import '@fontsource/noto-naskh-arabic/700.css';
import './styles/app.css';
import { AppProvider } from './lib/state.jsx';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// A data router, so that the Leave Guard can intercept every navigation (FR-DA-MRE-32); the
// screens keep their own <Routes> below the catch-all route.
const router = createBrowserRouter([{
  path: '*',
  element: (
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  ),
}], { future: { v7_relativeSplatPath: true } });

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
  </React.StrictMode>,
);
