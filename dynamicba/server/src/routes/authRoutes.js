import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { insert, findOne, update } from '../db.js'
import { hashPassword, comparePassword, signToken } from '../auth.js'
import { authenticate } from '../middleware.js'
import { DEFAULT_PERMISSION_MATRIX, PLAN_MODULES, PLAN_MAX_USERS, AI_USE_CASE_IDS } from '../constants.js'

const router = Router()

function publicUser(u) {
  return { id: u.id, uid: u.id, email: u.email, name: u.name, orgId: u.orgId, roles: u.roles, language: u.language }
}

router.post('/register/create-organization', (req, res) => {
  const { email, password, name, orgName, sector, country, plan } = req.body
  if (!email || !password || !name || !orgName) return res.status(400).json({ error: 'Missing required fields' })
  if (findOne('users', (u) => u.email === email)) return res.status(409).json({ error: 'An account with that email already exists' })

  const orgId = `org_${uuid().slice(0, 12)}`
  const chosenPlan = plan && PLAN_MODULES[plan] ? plan : 'starter'
  const userId = uuid()

  insert('organizations', {
    id: orgId, name: orgName, sector: sector || '', country: country || '', defaultLanguage: 'en',
    memberCount: 1, createdBy: userId, createdAt: new Date().toISOString(),
  })
  insert('licences', {
    id: orgId, orgId, plan: chosenPlan, maxUsers: PLAN_MAX_USERS[chosenPlan], features: PLAN_MODULES[chosenPlan],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    issueDate: new Date().toISOString(), companyName: orgName, version: 1,
  })
  insert('orgConfig', { id: orgId, orgId, permissionMatrix: DEFAULT_PERMISSION_MATRIX, complianceStandards: { GDPR: false, ISO27001: false, SOC2: false } })
  for (const aiucId of AI_USE_CASE_IDS) insert('aiUseCaseActivation', { id: uuid(), orgId, aiucId, active: true })
  const user = insert('users', {
    id: userId, email, passwordHash: hashPassword(password), name, orgId, roles: ['org_admin'],
    language: 'en', createdAt: new Date().toISOString(),
  })

  res.status(201).json({ token: signToken(user), user: publicUser(user) })
})

router.post('/register/join-organization', (req, res) => {
  const { email, password, name, orgId, role } = req.body
  if (!email || !password || !name || !orgId) return res.status(400).json({ error: 'Missing required fields' })
  if (findOne('users', (u) => u.email === email)) return res.status(409).json({ error: 'An account with that email already exists' })

  const org = findOne('organizations', (o) => o.id === orgId)
  if (!org) return res.status(404).json({ error: 'No Organization found with that ID. Ask your admin for the exact Organization ID.' })
  const licence = findOne('licences', (l) => l.orgId === orgId)
  const maxUsers = licence?.maxUsers || 0
  if (org.memberCount >= maxUsers) {
    return res.status(409).json({ error: `This Organization has reached its licence limit (${org.memberCount} of ${maxUsers} seats used). Ask an admin to upgrade the plan.` })
  }

  const user = insert('users', {
    id: uuid(), email, passwordHash: hashPassword(password), name, orgId,
    roles: [role || 'business_analyst'], language: 'en', createdAt: new Date().toISOString(),
  })
  update('organizations', orgId, { memberCount: org.memberCount + 1 })

  res.status(201).json({ token: signToken(user), user: publicUser(user) })
})

router.post('/login', (req, res) => {
  const { email, password } = req.body
  const user = findOne('users', (u) => u.email === email)
  if (!user || !comparePassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  res.json({ token: signToken(user), user: publicUser(user) })
})

router.get('/me', authenticate, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

export default router
