import { verifyToken } from './auth.js'
import { findById, findOne } from './db.js'
import { DEFAULT_PERMISSION_MATRIX } from './constants.js'

// Real server-side enforcement (Standard SRS NFR-DA-SEC-01/03): every route below the
// public /api/auth/* endpoints requires a valid bearer token, and every :orgId param is
// checked against the token's own orgId, never trusted from the client's URL alone.
export function authenticate(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing bearer token' })
  try {
    const payload = verifyToken(token)
    const user = findById('users', payload.uid)
    if (!user) return res.status(401).json({ error: 'User no longer exists' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requireOwnOrg(req, res, next) {
  if (req.params.orgId !== req.user.orgId) {
    return res.status(403).json({ error: 'Cannot access another Organization\'s data' })
  }
  next()
}

export function requireCapability(capability) {
  return (req, res, next) => {
    if (req.user.roles.includes('org_admin')) return next()
    const cfg = findOne('orgConfig', (c) => c.orgId === req.user.orgId)
    const matrix = cfg?.permissionMatrix || DEFAULT_PERMISSION_MATRIX
    const allowed = req.user.roles.some((r) => matrix?.[r]?.[capability])
    if (!allowed) return res.status(403).json({ error: `Missing required capability: ${capability}` })
    next()
  }
}
