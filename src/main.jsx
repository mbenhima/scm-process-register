import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { AppStateProvider } from './state/AppStateContext.jsx'
import { I18nProvider } from './i18n/index.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <I18nProvider>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </I18nProvider>
    </HashRouter>
  </React.StrictMode>,
)
