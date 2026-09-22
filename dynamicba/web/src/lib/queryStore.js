// src/lib/queryStore.js
// A minimal shared invalidation bus so every component reading the same API path stays
// in sync after any component mutates it — e.g. the top-bar Client dropdown (Layout.jsx)
// and the Clients list page both read `/organizations/{orgId}/clients`; without this,
// only the component that performed the write would ever see the new record, since each
// useApiCollection() call was otherwise an independent fetch-once instance. This is the
// local equivalent of what Firestore's onSnapshot gave for free before the app moved to
// a plain REST API.
const listeners = new Map() // path -> Set<() => void>

export function subscribe(path, callback) {
  if (!listeners.has(path)) listeners.set(path, new Set())
  listeners.get(path).add(callback)
  return () => {
    listeners.get(path)?.delete(callback)
  }
}

// Notifies exact-path subscribers, plus any subscriber whose path is a prefix of this
// one (so writing a child record, e.g. .../projects/{id}, can also refresh a list at
// .../projects if ever needed) and any whose path this one is a prefix of.
export function invalidate(path) {
  for (const [key, callbacks] of listeners.entries()) {
    if (key === path || key.startsWith(path) || path.startsWith(key)) {
      callbacks.forEach((cb) => cb())
    }
  }
}
