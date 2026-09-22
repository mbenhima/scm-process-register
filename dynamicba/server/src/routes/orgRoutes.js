import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { findById, findOne, find, update, insert, remove } from '../db.js'
import { authenticate, requireOwnOrg, requireCapability } from '../middleware.js'
import { hashPassword } from '../auth.js'
import { DEFAULT_PERMISSION_MATRIX } from '../constants.js'

const router = Router({ mergeParams: true })
router.use('/organizations/:orgId', authenticate, requireOwnOrg)

router.get('/organizations/:orgId', (req, res) => {
  res.json(findById('organizations', req.params.orgId))
})

router.patch('/organizations/:orgId', requireCapability('config.manage'), (req, res) => {
  res.json(update('organizations', req.params.orgId, req.body))
})

// ---- Users ------------------------------------------------------------------
function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, roles: u.roles }
}

router.get('/organizations/:orgId/users', (req, res) => {
  res.json(find('users', (u) => u.orgId === req.params.orgId).map(publicUser))
})

// Admin-direct user creation (no self-registration flow needed in this local build,
// which has no email delivery) — subject to the same licence seat quota as the
// self-service "join an existing Organization" path (NFR-DA-SEC-08).
router.post('/organizations/:orgId/users', requireCapability('users.manage'), (req, res) => {
  const { orgId } = req.params
  const { name, email, password, roles } = req.body
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing required fields' })
  if (findOne('users', (u) => u.email === email)) return res.status(409).json({ error: 'An account with that email already exists' })

  const org = findById('organizations', orgId)
  const licence = findOne('licences', (l) => l.orgId === orgId)
  if (org.memberCount >= (licence?.maxUsers || 0)) {
    return res.status(409).json({ error: `This Organization has reached its licence limit (${org.memberCount} of ${licence?.maxUsers} seats used). Upgrade the plan first.` })
  }

  const user = insert('users', {
    id: uuid(), email, passwordHash: hashPassword(password), name, orgId,
    roles: Array.isArray(roles) && roles.length ? roles : ['business_analyst'],
    language: 'en', createdAt: new Date().toISOString(),
  })
  update('organizations', orgId, { memberCount: org.memberCount + 1 })
  res.status(201).json(publicUser(user))
})

router.patch('/organizations/:orgId/users/:userId', requireCapability('users.manage'), (req, res) => {
  const target = findById('users', req.params.userId)
  if (!target || target.orgId !== req.params.orgId) return res.status(404).json({ error: 'User not found' })
  const updated = update('users', req.params.userId, { roles: req.body.roles })
  res.json(publicUser(updated))
})

router.delete('/organizations/:orgId/users/:userId', requireCapability('users.manage'), (req, res) => {
  const { orgId, userId } = req.params
  const target = findById('users', userId)
  if (!target || target.orgId !== orgId) return res.status(404).json({ error: 'User not found' })
  if (target.id === req.user.id) return res.status(400).json({ error: 'You cannot remove your own account while signed in as it.' })
  const remainingAdmins = find('users', (u) => u.orgId === orgId && u.id !== userId && u.roles.includes('org_admin'))
  if (target.roles.includes('org_admin') && remainingAdmins.length === 0) {
    return res.status(400).json({ error: 'Cannot remove the last Organization Admin.' })
  }
  remove('users', userId)
  const org = findById('organizations', orgId)
  update('organizations', orgId, { memberCount: Math.max(0, org.memberCount - 1) })
  res.status(204).end()
})

// ---- Config: permission matrix + compliance standards -----------------------
router.get('/organizations/:orgId/config', (req, res) => {
  const cfg = findOne('orgConfig', (c) => c.orgId === req.params.orgId)
  res.json(cfg || { orgId: req.params.orgId, permissionMatrix: DEFAULT_PERMISSION_MATRIX, complianceStandards: {} })
})

router.put('/organizations/:orgId/config/permission-matrix', requireCapability('permissions.manage'), (req, res) => {
  const cfg = findOne('orgConfig', (c) => c.orgId === req.params.orgId)
  const merged = { ...(cfg?.permissionMatrix || {}), ...req.body }
  update('orgConfig', cfg.id, { permissionMatrix: merged })
  res.json(merged)
})

router.put('/organizations/:orgId/config/compliance-standards', requireCapability('config.manage'), (req, res) => {
  const cfg = findOne('orgConfig', (c) => c.orgId === req.params.orgId)
  const merged = { ...(cfg?.complianceStandards || {}), ...req.body }
  update('orgConfig', cfg.id, { complianceStandards: merged })
  res.json(merged)
})

// ---- AI Use Case activation (org level) --------------------------------------
router.get('/organizations/:orgId/ai-use-case-activation', (req, res) => {
  res.json(find('aiUseCaseActivation', (a) => a.orgId === req.params.orgId))
})

router.put('/organizations/:orgId/ai-use-case-activation/:aiucId', requireCapability('ai_usecases.manage'), (req, res) => {
  const existing = findOne('aiUseCaseActivation', (a) => a.orgId === req.params.orgId && a.aiucId === req.params.aiucId)
  if (existing) {
    res.json(update('aiUseCaseActivation', existing.id, { active: req.body.active }))
  } else {
    res.json(insert('aiUseCaseActivation', { id: uuid(), orgId: req.params.orgId, aiucId: req.params.aiucId, active: req.body.active }))
  }
})

// ---- Audit log ----------------------------------------------------------------
router.get('/organizations/:orgId/audit-log', requireCapability('audit.view'), (req, res) => {
  res.json(find('auditLog', (a) => a.orgId === req.params.orgId))
})

router.post('/organizations/:orgId/audit-log', (req, res) => {
  res.status(201).json(insert('auditLog', { id: uuid(), orgId: req.params.orgId, actor: req.user.id, at: new Date().toISOString(), ...req.body }))
})

export default router
