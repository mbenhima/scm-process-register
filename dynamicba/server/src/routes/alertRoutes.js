import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { find, findById, insert, update } from '../db.js'
import { authenticate, requireOwnOrg, requireCapability } from '../middleware.js'

const router = Router({ mergeParams: true })
const base = '/organizations/:orgId/clients/:clientId/projects/:projectId/alerts'
router.use(base, authenticate, requireOwnOrg)

router.get(base, (req, res) => {
  res.json(find('alerts', (a) => a.orgId === req.params.orgId && a.projectId === req.params.projectId))
})

router.post(base, requireCapability('project.write'), (req, res) => {
  const { orgId, clientId, projectId } = req.params
  const record = insert('alerts', { id: uuid(), orgId, clientId, projectId, read: false, raisedAt: new Date().toISOString(), ...req.body })
  res.status(201).json(record)
})

router.patch(`${base}/:alertId`, requireCapability('project.write'), (req, res) => {
  const alert = findById('alerts', req.params.alertId)
  if (!alert || alert.orgId !== req.params.orgId) return res.status(404).json({ error: 'Alert not found' })
  res.json(update('alerts', req.params.alertId, req.body))
})

export default router
