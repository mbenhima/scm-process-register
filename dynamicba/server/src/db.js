// A tiny embedded JSON-file database — no native compiled dependency, no external
// database server to install, consistent with the platform's own "portable, zero
// native-toolchain install" goal. Fine for a single-instance deployment; swapping this
// module for a real relational database later does not require changing any route file,
// since every route only calls the functions exported here.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', 'data', 'db.json')

const EMPTY = {
  users: [],
  organizations: [],
  licences: [],
  orgConfig: [], // { orgId, permissionMatrix, complianceStandards }
  aiUseCaseActivation: [], // { orgId, aiucId, active }
  auditLog: [],
  clients: [],
  projects: [],
  artifacts: [], // { id, orgId, clientId, projectId, objectClassId, data: {...}, createdAt }
  alerts: [],
  aiUseCaseOverrides: [], // { orgId, projectId, aiucId, state }
}

function load() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    fs.writeFileSync(DB_PATH, JSON.stringify(EMPTY, null, 2))
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
}

let state = load()

function persist() {
  fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2))
}

export function reload() {
  state = load()
}

export function all(table) {
  return state[table]
}

export function findById(table, id) {
  return state[table].find((r) => r.id === id)
}

export function find(table, predicate) {
  return state[table].filter(predicate)
}

export function findOne(table, predicate) {
  return state[table].find(predicate)
}

export function insert(table, record) {
  state[table].push(record)
  persist()
  return record
}

export function update(table, id, patch) {
  const idx = state[table].findIndex((r) => r.id === id)
  if (idx === -1) return null
  state[table][idx] = { ...state[table][idx], ...patch }
  persist()
  return state[table][idx]
}

export function remove(table, id) {
  const before = state[table].length
  state[table] = state[table].filter((r) => r.id !== id)
  persist()
  return state[table].length < before
}

export function upsertKeyed(table, matchFn, record) {
  const idx = state[table].findIndex(matchFn)
  if (idx === -1) {
    state[table].push(record)
  } else {
    state[table][idx] = { ...state[table][idx], ...record }
  }
  persist()
  return record
}

export function save() {
  persist()
}
