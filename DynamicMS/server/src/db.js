// Persistence layer: Node's built-in SQLite (no native build toolchain needed).
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { SCHEMA, ADDITIVE_COLUMNS } from './schema.js';
import { config } from './config.js';

let db = null;

export function openDb(file = config.dbFile) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA synchronous = NORMAL;');
  return db;
}

export function getDb() {
  if (!db) openDb();
  return db;
}

export function closeDb() {
  if (db) { db.close(); db = null; }
}

// Additive migrations only: create missing tables/columns, never drop data (FR-DA-OPS-04).
export function migrate() {
  const d = getDb();
  d.exec(SCHEMA);
  for (const [table, cols] of Object.entries(ADDITIVE_COLUMNS)) {
    const have = new Set(d.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name));
    for (const [name, decl] of Object.entries(cols)) {
      if (!have.has(name)) d.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${decl}`);
    }
  }
}

const stmtCache = new Map();
function prep(sql) {
  let s = stmtCache.get(sql);
  if (!s) { s = getDb().prepare(sql); stmtCache.set(sql, s); }
  return s;
}
export function resetStatementCache() { stmtCache.clear(); }

const norm = (params) => params.map(p => (p === undefined ? null : typeof p === 'boolean' ? (p ? 1 : 0) : p));
export const all = (sql, ...params) => prep(sql).all(...norm(params));
export const get = (sql, ...params) => prep(sql).get(...norm(params));
export const run = (sql, ...params) => prep(sql).run(...norm(params));

export function tx(fn) {
  const d = getDb();
  d.exec('BEGIN');
  try {
    const r = fn();
    d.exec('COMMIT');
    return r;
  } catch (e) {
    d.exec('ROLLBACK');
    throw e;
  }
}

export const uid = () => crypto.randomUUID();
export const now = () => new Date().toISOString();

// JSON helpers for TEXT columns
export const J = (v) => (v === undefined || v === null ? null : JSON.stringify(v));
export function P(v, fallback = null) {
  if (v === null || v === undefined || v === '') return fallback;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return fallback ?? v; }
}

export function isInitialized() {
  try {
    const r = get("SELECT value FROM meta WHERE key='seeded_at'");
    return !!r;
  } catch { return false; }
}
