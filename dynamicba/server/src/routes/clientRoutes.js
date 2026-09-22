import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { find, findById, insert, update, remove } from '../db.js'
import { authenticate, requireOwnOrg, requireCapability } from '../middleware.js'

const router = Router({ mergeParams: true })
router.use('/organizations/:orgId/clients', authenticate, requireOwnOrg)

router.get('/organizations/:orgId/clients', (req, res) => {
  res.json(find('clients', (c) => c.orgId === req.params.orgId))
})

router.post('/organizations/:orgId/clients', requireCapability('hierarchy.manage'), (req, res) => {
  const record = insert('clients', {
    id: uuid(), orgId: req.params.orgId, name: req.body.name, industry: req.body.industry || '',
    deleted: false, createdAt: new Date().toISOString(),
  })
  res.status(201).json(record)
})

router.patch('/organizations/:orgId/clients/:clientId', requireCapability('hierarchy.manage'), (req, res) => {
  const client = findById('clients', req.params.clientId)
  if (!client || client.orgId !== req.params.orgId) return res.status(404).json({ error: 'Client not found' })
  res.json(update('clients', req.params.clientId, req.body))
})

router.delete('/organizations/:orgId/clients/:clientId', requireCapability('hierarchy.manage'), (req, res) => {
  const client = findById('clients', req.params.clientId)
  if (!client || client.orgId !== req.params.orgId) return res.status(404).json({ error: 'Client not found' })
  remove('clients', req.params.clientId)
  res.status(204).end()
})

export default router
