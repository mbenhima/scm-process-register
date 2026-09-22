import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { find, findById, insert, update, remove } from '../db.js'
import { authenticate, requireOwnOrg, requireCapability } from '../middleware.js'

const router = Router({ mergeParams: true })
const base = '/organizations/:orgId/clients/:clientId/projects/:projectId/artifacts/:objectClassId/records'
router.use(base, authenticate, requireOwnOrg)

// Generic, schema-agnostic CRUD for any of the 32 D09/D10 object classes, scoped to one
// project — the server-side counterpart of web/src/components/ArtifactExplorer.jsx.
router.get(base, requireCapability('project.read'), (req, res) => {
  const { orgId, projectId, objectClassId } = req.params
  res.json(find('artifacts', (a) => a.orgId === orgId && a.projectId === projectId && a.objectClassId === objectClassId))
})

router.post(base, requireCapability('project.write'), (req, res) => {
  const { orgId, clientId, projectId, objectClassId } = req.params
  const record = insert('artifacts', {
    id: uuid(), orgId, clientId, projectId, objectClassId, ...req.body, createdAt: new Date().toISOString(),
  })
  res.status(201).json(record)
})

router.patch(`${base}/:recordId`, requireCapability('project.write'), (req, res) => {
  const record = findById('artifacts', req.params.recordId)
  if (!record || record.orgId !== req.params.orgId) return res.status(404).json({ error: 'Record not found' })
  res.json(update('artifacts', req.params.recordId, req.body))
})

router.delete(`${base}/:recordId`, requireCapability('project.write'), (req, res) => {
  const record = findById('artifacts', req.params.recordId)
  if (!record || record.orgId !== req.params.orgId) return res.status(404).json({ error: 'Record not found' })
  remove('artifacts', req.params.recordId)
  res.status(204).end()
})

export default router
