import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import db from '../db/index.js';
import { requirePermission } from '../middleware/rbac.js';
import { writeAudit } from '../services/audit.js';

const router = Router();

// Predefined list of the most common LLM providers, shown as a dropdown in the
// LLM / AI Settings screen. "model" holds a couple of illustrative example
// model ids (free text field on save — providers add new models often, so
// this is guidance, not a hard-coded/enforced list).
export const LLM_PROVIDERS = [
  { code: 'anthropic', name: 'Anthropic (Claude)', exampleModels: ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5'], needsEndpoint: false },
  { code: 'openai', name: 'OpenAI (GPT)', exampleModels: ['gpt-5', 'gpt-5-mini', 'o4'], needsEndpoint: false },
  { code: 'google', name: 'Google (Gemini)', exampleModels: ['gemini-2.5-pro', 'gemini-2.5-flash'], needsEndpoint: false },
  { code: 'azure_openai', name: 'Azure OpenAI Service', exampleModels: ['gpt-5 (deployment name)'], needsEndpoint: true },
  { code: 'aws_bedrock', name: 'AWS Bedrock', exampleModels: ['anthropic.claude-sonnet-5', 'amazon.titan-text-premier'], needsEndpoint: true },
  { code: 'mistral', name: 'Mistral AI', exampleModels: ['mistral-large-latest', 'mistral-small-latest'], needsEndpoint: false },
  { code: 'cohere', name: 'Cohere', exampleModels: ['command-r-plus'], needsEndpoint: false },
  { code: 'meta_llama', name: 'Meta Llama (via a hosting provider)', exampleModels: ['llama-4-maverick', 'llama-4-scout'], needsEndpoint: true },
  { code: 'ollama', name: 'Ollama (self-hosted / local)', exampleModels: ['llama3.3', 'qwen2.5', 'mistral'], needsEndpoint: true },
  { code: 'custom', name: 'Custom / OpenAI-compatible endpoint', exampleModels: [], needsEndpoint: true },
];

function redact(row) {
  if (!row) return row;
  const { api_key, ...safe } = row;
  return { ...safe, has_api_key: !!api_key, api_key_last4: api_key ? api_key.slice(-4) : null };
}

router.get('/providers', requirePermission('llmConfig.view'), (req, res) => {
  res.json(LLM_PROVIDERS);
});

router.get('/', requirePermission('llmConfig.view'), (req, res) => {
  let row = db.prepare('SELECT * FROM llm_configurations WHERE organization_id = ?').get(req.user.organizationId);
  if (!row) {
    const id = randomUUID();
    db.prepare(`INSERT INTO llm_configurations (id, organization_id) VALUES (?, ?)`).run(id, req.user.organizationId);
    row = db.prepare('SELECT * FROM llm_configurations WHERE id = ?').get(id);
  }
  res.json(redact(row));
});

router.put('/', requirePermission('llmConfig.manage'), (req, res) => {
  let existing = db.prepare('SELECT * FROM llm_configurations WHERE organization_id = ?').get(req.user.organizationId);
  if (!existing) {
    const id = randomUUID();
    db.prepare(`INSERT INTO llm_configurations (id, organization_id) VALUES (?, ?)`).run(id, req.user.organizationId);
    existing = db.prepare('SELECT * FROM llm_configurations WHERE id = ?').get(id);
  }
  const { provider, model, api_key, endpoint_url, is_enabled, clear_api_key } = req.body || {};
  if (provider && !LLM_PROVIDERS.some((p) => p.code === provider)) {
    return res.status(400).json({ error: 'unknown_provider' });
  }
  db.prepare(`
    UPDATE llm_configurations SET
      provider = COALESCE(?, provider),
      model = COALESCE(?, model),
      api_key = CASE WHEN ? THEN NULL WHEN ? IS NOT NULL AND ? != '' THEN ? ELSE api_key END,
      endpoint_url = COALESCE(?, endpoint_url),
      is_enabled = COALESCE(?, is_enabled),
      updated_by = ?,
      updated_at = datetime('now')
    WHERE organization_id = ?
  `).run(
    provider || null, model ?? null,
    clear_api_key ? 1 : 0, api_key ?? null, api_key ?? null, api_key ?? null,
    endpoint_url ?? null,
    is_enabled === undefined ? null : (is_enabled ? 1 : 0),
    req.user.id, req.user.organizationId,
  );
  const row = db.prepare('SELECT * FROM llm_configurations WHERE organization_id = ?').get(req.user.organizationId);
  writeAudit(req, 'UPDATE', 'LlmConfiguration', row.id, redact(existing), redact(row));
  res.json(redact(row));
});

export default router;
