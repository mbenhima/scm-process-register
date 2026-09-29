import { Router } from 'express';
import { ah } from '../lib/http.js';
import { login } from '../auth.js';
import { isSeeded, one } from '../db.js';
import { config } from '../config.js';
import { getDictionary, getLanguages } from '../i18n.js';

const r = Router();
r.post('/auth/login', ah(req => login(req)));
// Liveness only: no tenant data (FR-DA-OPS-06).
r.get('/health', (req, res) => res.json({ status: 'ok', initialized: isSeeded(), mode: config.deploymentMode, version: one(`SELECT value FROM meta WHERE key='version'`)?.value || '1.0.0' }));
r.get('/i18n', (req, res) => res.json({ languages: getLanguages(), dictionary: getDictionary() }));
export default r;
