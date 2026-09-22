// src/lib/aiApi.js
// Client for DynamicBA's real AI generation endpoint (server/src/routes/aiRoutes.js),
// which calls the Anthropic API server-side so the API key never reaches the browser.
import { api } from './api'

export function getAiConfig(orgId) {
  return api.get(`/organizations/${orgId}/ai/config`)
}

export function saveAiConfig(orgId, { apiKey, model }) {
  return api.put(`/organizations/${orgId}/ai/config`, { apiKey, model })
}

export function clearAiConfig(orgId) {
  return api.del(`/organizations/${orgId}/ai/config`)
}

export function generateSpecsDraft(orgId, payload) {
  return api.post(`/organizations/${orgId}/ai/generate-specs`, payload)
}

export const AI_MODEL_OPTIONS = [
  { value: 'claude-sonnet-5', label: 'Claude Sonnet 5 (recommended — balanced quality & speed)' },
  { value: 'claude-opus-5', label: 'Claude Opus 5 (highest quality, slower)' },
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (fastest, lighter drafts)' },
]
