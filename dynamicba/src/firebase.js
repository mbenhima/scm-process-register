import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// A missing or malformed env var (a very plausible first-deploy mistake — see the
// Installation Guide's troubleshooting appendix) must not blank the whole page with an
// uncaught exception; main.jsx checks firebaseInitError and renders a clear message
// instead of mounting the app.
export let app = null
export let auth = null
export let db = null
export let firebaseInitError = null
try {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error('Firebase environment variables are missing. Check your .env file against .env.example.')
  }
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
} catch (err) {
  firebaseInitError = err
}
