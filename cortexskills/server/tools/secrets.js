#!/usr/bin/env node
// Prints new random secrets for server/.env (production). Run once per installation and keep the values safe:
// changing JWT_SECRET signs everyone out; changing CHANNEL_SECRET_KEY makes stored channel credentials unreadable;
// changing LICENSE_HMAC_SECRET invalidates the SaaS licences (re-issue them with "npm run admin -- licence").
import crypto from 'node:crypto';
const r = () => crypto.randomBytes(48).toString('base64url');
console.log(`JWT_SECRET=${r()}\nCHANNEL_SECRET_KEY=${r()}\nLICENSE_HMAC_SECRET=${r()}`);
