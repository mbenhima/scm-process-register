// Persistence layer for journi's backend. Uses node:sqlite (built into Node.js
// 22.5+, no npm dependency, no native compilation) rather than a package like
// better-sqlite3 — this is what lets the Windows installer be "install Node.js,
// then npm install", with no C++ build tools ever in the picture.
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
import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.JOURNI_DATA_DIR || path.join(__dirname, 'data')
const DB_PATH = path.join(DATA_DIR, 'journi.db')

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const db = new DatabaseSync(DB_PATH)

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
