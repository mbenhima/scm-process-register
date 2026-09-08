import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { signToken, authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email_and_password_required' });
  const user = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE AND is_active = 1').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }
  db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(user.id);
  const token = signToken(user);
  res.json({ token });
});

router.get('/me', authenticate, (req, res) => {
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.user.organizationId);
  res.json({
    id: req.user.id,
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    languagePreference: req.user.languagePreference,
    organization: org,
    roles: req.user.roles,
    permissions: Array.from(req.user.permissions),
  });
});

router.put('/me/language', authenticate, (req, res) => {
  const { language } = req.body || {};
  if (!['en', 'fr', 'ar'].includes(language)) return res.status(400).json({ error: 'invalid_language' });
  db.prepare("UPDATE users SET language_preference = ?, updated_at = datetime('now') WHERE id = ?").run(language, req.user.id);
  res.json({ ok: true });
});

export default router;
