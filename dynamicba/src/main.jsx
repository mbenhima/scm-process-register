import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { firebaseInitError } from './firebase'
import './index.css'

function ConfigErrorScreen({ error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="card p-8 max-w-lg">
        <h1 className="font-serif font-bold text-xl text-orange-deep mb-2">Configuration error</h1>
        <p className="text-sm text-grey-ink mb-3">DynamicBA could not start because its Firebase configuration is missing or invalid.</p>
        <pre className="text-xs bg-grey-light rounded p-3 overflow-x-auto">{error.message}</pre>
        <p className="text-sm text-grey-ink mt-3">Check your <code>.env</code> file against <code>.env.example</code> and see the Installation Guide's Troubleshooting appendix.</p>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {firebaseInitError ? <ConfigErrorScreen error={firebaseInitError} /> : <App />}
  </React.StrictMode>
)
