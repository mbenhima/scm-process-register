// Persistence layer for journi's backend. Two possible SQLite drivers, tried
// in this order, so the app runs on whatever Node.js version the user
// already has instead of requiring a specific one:
//
//  1. node:sqlite, built into Node.js 22.5+ — zero npm dependency, zero
//     native compilation, so it's the preferred path whenever it's present
//     (including on Node versions newer than any native module's prebuilt
//     binaries yet cover, which is exactly what a very recently installed
//     Node.js will be).
//  2. better-sqlite3, an optionalDependency (see package.json — "optional"
//     specifically so a failed native build there never fails `npm install`
//     as a whole) — ships prebuilt binaries for common recent Node ABI
//     versions on Windows/macOS/Linux, covering Node 18 up to whatever
//     Node 22.4-and-earlier version a user might still have.
//
// If neither is available (an old Node version with no matching
// better-sqlite3 prebuild), readState/writeState throw a clear error at
// first use rather than the process crashing unintelligibly at import time.
//
// The whole app's state is one JSON blob (the same shape the frontend used to
// keep in localStorage) rather than a normalized relational schema. journi's
// state shape spans users, organizations, CM projects, AI use cases, phase
// templates, and a dozen other nested structures that all evolve together as
// the app ships new features (see migrateOrSeed() in the frontend) — modeling
// that relationally here would mean re-deriving and keeping in sync a second
// copy of that whole schema, in SQL, and risks silently dropping a field the
// relational mapping didn't anticipate. Storing it as one row keeps the
// backend a thin, reliable persistence layer and the frontend's existing
// state logic as the single source of truth for what the data actually looks
// like.
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)

function loadDriver() {
  try {
    const { DatabaseSync } = require('node:sqlite')
    return { Database: DatabaseSync, name: 'node:sqlite', supportsPragma: false }
  } catch {
    // node:sqlite not available on this Node version — fall through.
  }
  try {
    const Database = require('better-sqlite3')
    return { Database, name: 'better-sqlite3', supportsPragma: true }
  } catch {
    return null
  }
}

const driver = loadDriver()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.JOURNI_DATA_DIR || path.join(__dirname, 'data')
const DB_PATH = path.join(DATA_DIR, 'journi.db')

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

if (!driver) {
  throw new Error(
    'No SQLite driver available. Your Node.js version does not have the built-in node:sqlite module ' +
      '(needs Node 22.5+), and the better-sqlite3 fallback did not install successfully — check the ' +
      'install.bat output above for the reason. Easiest fix: install the latest Node.js LTS from ' +
      'https://nodejs.org/ and run install.bat again.',
  )
}

console.log(`Using SQLite driver: ${driver.name}`)
const db = new driver.Database(DB_PATH)
if (driver.supportsPragma) db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS app_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT,
    current_user_id TEXT,
    scope TEXT,
    updated_at TEXT NOT NULL
  )
`)

const selectStmt = db.prepare('SELECT data, current_user_id, scope FROM app_state WHERE id = 1')
const upsertStmt = db.prepare(`
  INSERT INTO app_state (id, data, current_user_id, scope, updated_at)
  VALUES (1, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    data = excluded.data,
    current_user_id = excluded.current_user_id,
    scope = excluded.scope,
    updated_at = excluded.updated_at
`)

export function readState() {
  const row = selectStmt.get()
  if (!row) return null
  return {
    data: row.data ? JSON.parse(row.data) : null,
    currentUserId: row.current_user_id || null,
    scope: row.scope ? JSON.parse(row.scope) : { orgId: null, cmProjectId: null },
  }
}

export function writeState({ data, currentUserId, scope }) {
  upsertStmt.run(
    JSON.stringify(data ?? null),
    currentUserId ?? null,
    JSON.stringify(scope ?? { orgId: null, cmProjectId: null }),
    new Date().toISOString(),
  )
}

export function dbFilePath() {
  return DB_PATH
}
