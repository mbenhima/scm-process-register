import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me'

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10)
}

export function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash)
}

export function signToken(user) {
  return jwt.sign({ uid: user.id, orgId: user.orgId }, SECRET, { expiresIn: '30d' })
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET)
}
