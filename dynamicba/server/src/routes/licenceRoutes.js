import { Router } from 'express'
import { findById, update } from '../db.js'
import { authenticate, requireOwnOrg, requireCapability } from '../middleware.js'
import { PLAN_MODULES, PLAN_MAX_USERS } from '../constants.js'

const router = Router({ mergeParams: true })

router.get('/licences/:orgId', authenticate, requireOwnOrg, (req, res) => {
  res.json(findById('licences', req.params.orgId))
})

// Demo-build simplification: an Organization Admin changes their own plan directly.
// See the Installation Guide's "Licensing in Production" appendix for how to gate this
// behind a real payment webhook instead.
router.put('/licences/:orgId', authenticate, requireOwnOrg, requireCapability('config.manage'), (req, res) => {
  const plan = req.body.plan
  if (!PLAN_MODULES[plan]) return res.status(400).json({ error: 'Unknown plan' })
  res.json(update('licences', req.params.orgId, { plan, maxUsers: PLAN_MAX_USERS[plan], features: PLAN_MODULES[plan] }))
})

export default router
