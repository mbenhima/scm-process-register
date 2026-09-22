import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { find, findById, findOne, insert, update, remove } from '../db.js'
import { authenticate, requireOwnOrg, requireCapability } from '../middleware.js'

const router = Router({ mergeParams: true })
const base = '/organizations/:orgId/clients/:clientId/projects'
router.use(base, authenticate, requireOwnOrg)

router.get(base, (req, res) => {
  res.json(find('projects', (p) => p.orgId === req.params.orgId && p.clientId === req.params.clientId))
})

router.post(base, requireCapability('hierarchy.manage'), (req, res) => {
  const record = insert('projects', {
    id: uuid(), orgId: req.params.orgId, clientId: req.params.clientId, name: req.body.name,
    status: 'not_started', currentStep: 1, deleted: false, createdAt: new Date().toISOString(),
  })
  res.status(201).json(record)
})

router.get(`${base}/:projectId`, (req, res) => {
  const project = findById('projects', req.params.projectId)
  if (!project || project.orgId !== req.params.orgId) return res.status(404).json({ error: 'Project not found' })
  res.json(project)
})

router.patch(`${base}/:projectId`, requireCapability('project.write'), (req, res) => {
  const project = findById('projects', req.params.projectId)
  if (!project || project.orgId !== req.params.orgId) return res.status(404).json({ error: 'Project not found' })
  res.json(update('projects', req.params.projectId, req.body))
})

router.delete(`${base}/:projectId`, requireCapability('hierarchy.manage'), (req, res) => {
  const project = findById('projects', req.params.projectId)
  if (!project || project.orgId !== req.params.orgId) return res.status(404).json({ error: 'Project not found' })
  remove('projects', req.params.projectId)
  res.status(204).end()
})

// ---- Project-level AI Use Case overrides -------------------------------------
router.get(`${base}/:projectId/ai-use-case-overrides`, (req, res) => {
  res.json(find('aiUseCaseOverrides', (o) => o.projectId === req.params.projectId))
})

router.put(`${base}/:projectId/ai-use-case-overrides/:aiucId`, requireCapability('ai_usecases.manage'), (req, res) => {
  const existing = findOne('aiUseCaseOverrides', (o) => o.projectId === req.params.projectId && o.aiucId === req.params.aiucId)
  if (existing) return res.json(update('aiUseCaseOverrides', existing.id, { state: req.body.state }))
  res.json(insert('aiUseCaseOverrides', { id: uuid(), orgId: req.params.orgId, projectId: req.params.projectId, aiucId: req.params.aiucId, state: req.body.state }))
})

export default router
