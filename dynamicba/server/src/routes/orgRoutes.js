import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { findById, findOne, find, update, insert } from '../db.js'
import { authenticate, requireOwnOrg, requireCapability } from '../middleware.js'
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
router.get('/organizations/:orgId/users', (req, res) => {
  const users = find('users', (u) => u.orgId === req.params.orgId).map((u) => ({ id: u.id, name: u.name, email: u.email, roles: u.roles }))
  res.json(users)
})

router.patch('/organizations/:orgId/users/:userId', requireCapability('users.manage'), (req, res) => {
  const target = findById('users', req.params.userId)
  if (!target || target.orgId !== req.params.orgId) return res.status(404).json({ error: 'User not found' })
  const updated = update('users', req.params.userId, { roles: req.body.roles })
  res.json({ id: updated.id, name: updated.name, email: updated.email, roles: updated.roles })
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
