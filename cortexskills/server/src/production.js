// Production mode (NODE_ENV=production): the server refuses to start while a setting would make it unsafe — a
// development secret, a missing public HTTPS address, an open CORS policy, demonstration data, or (OnPrem) a missing
// vendor public key — and lists every problem with the line to add to the .env file.
import fs from 'node:fs';
import path from 'node:path';
import { config, ROOT } from './config.js';

export const isProduction = () => String(process.env.NODE_ENV || '').toLowerCase() === 'production';
const weak = v => !v || v.length < 32 || /change-me|local-secret|local-development|example/i.test(v);

export function productionProblems(dataMode) {
  const p = [];
  if (weak(process.env.JWT_SECRET)) p.push('JWT_SECRET is missing, shorter than 32 characters or a development value. Generate one with "npm run secrets".');
  if (weak(process.env.CHANNEL_SECRET_KEY)) p.push('CHANNEL_SECRET_KEY is missing, shorter than 32 characters or a development value. Generate one with "npm run secrets".');
  if (config.deploymentMode === 'saas' && weak(process.env.LICENSE_HMAC_SECRET)) p.push('LICENSE_HMAC_SECRET is missing, shorter than 32 characters or a development value (SaaS licences are signed with it).');
  if (process.env.JWT_SECRET && process.env.JWT_SECRET === process.env.CHANNEL_SECRET_KEY) p.push('JWT_SECRET and CHANNEL_SECRET_KEY must be different.');
  if (!/^https:\/\//i.test(config.publicUrl)) p.push('PUBLIC_URL must be the public HTTPS address of the application, for example PUBLIC_URL=https://skills.example.com');
  if (config.corsOrigin === '*') p.push('CORS_ORIGIN must list the address(es) allowed to call the API, for example CORS_ORIGIN=https://skills.example.com');
  if (!['saas', 'onprem'].includes(config.deploymentMode)) p.push('DEPLOYMENT_MODE must be saas or onprem.');
  if (config.deploymentMode === 'onprem' && !fs.existsSync(path.join(ROOT, 'tools', 'keys', 'vendor-public.pem'))) p.push('OnPrem mode needs the vendor public key at server/tools/keys/vendor-public.pem (delivered by the vendor with the licence).');
  if (config.deploymentMode === 'onprem' && fs.existsSync(path.join(ROOT, 'tools', 'keys', 'vendor-private.pem'))) p.push('The vendor PRIVATE key must never be on a customer server: remove server/tools/keys/vendor-private.pem.');
  if (dataMode === 'demo') p.push('The database holds the demonstration data (shared demo passwords). Initialize an empty production database with "npm run init".');
  return p;
}
