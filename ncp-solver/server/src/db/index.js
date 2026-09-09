import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'ncp-solver.sqlite3');
export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// better-sqlite3-compatible transaction helper: db.transaction(fn) returns a
// function that, when called, runs fn(...args) inside BEGIN/COMMIT, rolling
// back on error. Kept so callers written against better-sqlite3 need no changes.
// Reentrant: a transaction started while one is already open just runs inline
// (SQLite doesn't allow nested BEGIN; only the outermost call commits/rolls back).
let txDepth = 0;
db.transaction = (fn) => (...args) => {
  const isOutermost = txDepth === 0;
  if (isOutermost) db.exec('BEGIN');
  txDepth += 1;
  try {
    const result = fn(...args);
    txDepth -= 1;
    if (isOutermost) db.exec('COMMIT');
    return result;
  } catch (err) {
    txDepth -= 1;
    if (isOutermost) db.exec('ROLLBACK');
    throw err;
  }
};

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

export function isEmpty() {
  const row = db.prepare('SELECT COUNT(*) AS c FROM organizations').get();
  return row.c === 0;
}

export default db;
