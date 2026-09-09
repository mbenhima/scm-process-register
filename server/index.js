// journi's backend: a small Express API for reading/saving app state to
// SQLite (see db.js), plus the static file server for the built frontend —
// one process, one port, which is what makes "double-click a shortcut, open
// a browser tab" work as the whole install experience.
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { readState, writeState, dbFilePath } from './db.js'
import queryDataRouter from './routes/queryData.js'
import queryFeaturesRouter from './routes/queryFeatures.js'
import aiSuggestRouter from './routes/aiSuggest.js'
import { hasServerFallbackKey } from './lib/llmProxy.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '.env')
if (fs.existsSync(envPath)) {
  try {
    process.loadEnvFile(envPath)
  } catch (err) {
    console.warn('Could not load server/.env:', err.message)
  }
}
const DIST_DIR = path.join(__dirname, '..', 'journi', 'dist')
const PORT = process.env.PORT || 4000

const app = express()
// The app-state blob can run to a few MB for a data-rich demo tenant (many
// projects, long change logs, AI usage history) — the default 100kb body
// limit would reject a save partway through a normal working session.
app.use(express.json({ limit: '25mb' }))

app.get('/api/health', (req, res) => {
  res.json({ ok: true, serverFallbackKeyConfigured: hasServerFallbackKey() })
})

app.get('/api/state', (req, res) => {
  try {
    res.json(readState() || { data: null, currentUserId: null, scope: { orgId: null, cmProjectId: null } })
  } catch (err) {
    console.error('GET /api/state failed:', err)
    res.status(500).json({ error: 'failed to read state' })
  }
})

app.put('/api/state', (req, res) => {
  try {
    writeState(req.body || {})
    res.json({ ok: true })
  } catch (err) {
    console.error('PUT /api/state failed:', err)
    res.status(500).json({ error: 'failed to save state' })
  }
})

// Real retrieval-augmented generation for Query Data, Query Features, and
// the AI Use Case Library — see RAG.md. These three routes hold no state of
// their own; Query Data reads the same app-state blob the two routes above
// persist, passed in on each request.
app.use('/api/query-data', queryDataRouter)
app.use('/api/query-features', queryFeaturesRouter)
app.use('/api/ai-suggest', aiSuggestRouter)

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  // Client-side routing (react-router) — any non-API path falls through to
  // index.html so a deep link or a browser refresh on e.g. /module6 still
  // loads the app rather than a 404.
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
} else {
  app.get('*', (req, res) => {
    res
      .status(500)
      .send('journi/dist not found — run "npm run build" inside the journi/ folder before starting the server.')
  })
}

app.listen(PORT, () => {
  console.log(`journi is running — open http://localhost:${PORT} in your browser`)
  console.log(`Data is stored in ${dbFilePath()}`)
  console.log(
    hasServerFallbackKey()
      ? 'ANTHROPIC_API_KEY found — Query Data/Features work without a Module 6 connection.'
      : 'No server-side API key configured — Query Data/Features use whatever provider is connected on Module 6 (see server/.env.example).',
  )
})
