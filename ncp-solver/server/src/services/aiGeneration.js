// Real LLM Provider Connection support for the AI Use Case Library.
//
// Security contract (FR-M6-08 / NFR-19): the connection (provider, apiKey,
// model, baseUrl) is held ONLY in the browser's own localStorage. The browser
// forwards it, at most, once per generation request, in the request body of
// that single call. This module uses it exactly once to place the outbound
// call to the provider and then lets it go out of scope — it is never written
// to the database, never included in any audit/usage log entry, and never
// logged to the console/server log. Callers must not persist the `connection`
// object anywhere; treat it as a one-shot, request-scoped credential.
//
// If no connection is supplied, the provider is unsupported in this demo
// proxy, the call errors, or it times out, callers fall back to their own
// deterministic generator automatically (FR-M6-09) — a real LLM call is
// always optional, never required for a use case to function.

import { RagIndex } from './rag.js';
import db from '../db/index.js';

// Predefined list of the most common LLM providers (moved here from the old,
// now-removed server-persisted LLM Configuration screen). "supported" marks
// providers this demo proxy actually knows how to call; the others are listed
// for completeness but always fall back to the deterministic generator.
export const LLM_PROVIDERS = [
  { code: 'anthropic', name: 'Anthropic (Claude)', exampleModels: ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5'], needsEndpoint: false, supported: true },
  { code: 'openai', name: 'OpenAI (GPT)', exampleModels: ['gpt-5', 'gpt-5-mini', 'o4'], needsEndpoint: false, supported: true },
  { code: 'azure_openai', name: 'Azure OpenAI Service', exampleModels: ['gpt-5 (deployment name)'], needsEndpoint: true, supported: true },
  { code: 'mistral', name: 'Mistral AI', exampleModels: ['mistral-large-latest', 'mistral-small-latest'], needsEndpoint: false, supported: true },
  { code: 'ollama', name: 'Ollama (self-hosted / local)', exampleModels: ['llama3.3', 'qwen2.5', 'mistral'], needsEndpoint: true, supported: true },
  { code: 'custom', name: 'Custom / OpenAI-compatible endpoint', exampleModels: [], needsEndpoint: true, supported: true },
  { code: 'google', name: 'Google (Gemini)', exampleModels: ['gemini-2.5-pro', 'gemini-2.5-flash'], needsEndpoint: false, supported: false },
  { code: 'aws_bedrock', name: 'AWS Bedrock', exampleModels: ['anthropic.claude-sonnet-5', 'amazon.titan-text-premier'], needsEndpoint: true, supported: false },
  { code: 'cohere', name: 'Cohere', exampleModels: ['command-r-plus'], needsEndpoint: false, supported: false },
  { code: 'meta_llama', name: 'Meta Llama (via a hosting provider)', exampleModels: ['llama-4-maverick', 'llama-4-scout'], needsEndpoint: true, supported: false },
];

const CALL_TIMEOUT_MS = 12000;

/**
 * Retrieves the most relevant methodology reference definitions (the
 * organization's own Standards Knowledge Base) for a prompt + record context,
 * via the same TF-IDF RagIndex used elsewhere. Disclosed to the user
 * alongside every generated output, whether the deterministic or the real-LLM
 * path produced it (FR-M6-11) — grounding is a transparency guarantee, not a
 * real-LLM-only feature.
 */
export function retrieveGrounding(organizationId, queryText, topK = 3) {
  const standards = db.prepare('SELECT code, title, description FROM standards WHERE organization_id = ? AND is_active = 1').all(organizationId);
  if (!standards.length) return [];
  const index = new RagIndex();
  standards.forEach((s, i) => index.addDocument({ id: String(i), text: `${s.code} ${s.title} ${s.description || ''}`, meta: s }));
  return index.search(queryText, { topK, minScore: 0.03 }).map((r) => ({
    code: r.meta.code, title: r.meta.title,
    excerpt: (r.meta.description || '').slice(0, 220),
    score: Number(r.score.toFixed(3)),
  }));
}

function groundingBlock(grounding) {
  if (!grounding.length) return 'No specific methodology reference matched this case; rely only on the record context below.';
  return grounding.map((g) => `- ${g.code} — ${g.title}: ${g.excerpt}`).join('\n');
}

async function fetchWithTimeout(url, opts) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callAnthropic(connection, systemPrompt, userPrompt) {
  const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': connection.apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: connection.model || 'claude-sonnet-5', max_tokens: 600,
      system: systemPrompt, messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic_http_${res.status}`);
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('anthropic_empty_response');
  return text;
}

async function callOpenAiCompatible(connection, systemPrompt, userPrompt, defaultUrl) {
  const url = connection.baseUrl || defaultUrl;
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${connection.apiKey}` },
    body: JSON.stringify({
      model: connection.model || 'gpt-5-mini',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      max_tokens: 600,
    }),
  });
  if (!res.ok) throw new Error(`openai_compatible_http_${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('openai_compatible_empty_response');
  return text;
}

async function callOllama(connection, systemPrompt, userPrompt) {
  const url = `${(connection.baseUrl || 'http://localhost:11434').replace(/\/$/, '')}/api/generate`;
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: connection.model || 'llama3.3', prompt: `${systemPrompt}\n\n${userPrompt}`, stream: false }),
  });
  if (!res.ok) throw new Error(`ollama_http_${res.status}`);
  const data = await res.json();
  if (!data?.response) throw new Error('ollama_empty_response');
  return data.response;
}

/**
 * Places exactly one outbound call to the connection's provider. Throws on
 * any failure — unsupported provider, missing key, network error, timeout,
 * non-2xx response, empty completion — so callers can catch and fall back to
 * their deterministic generator (FR-M6-09). Never persists `connection`.
 */
export async function callRealLlm(connection, systemPrompt, userPrompt) {
  if (!connection || !connection.provider || !connection.apiKey) throw new Error('no_connection_configured');
  const meta = LLM_PROVIDERS.find((p) => p.code === connection.provider);
  if (!meta || !meta.supported) throw new Error(`provider_unsupported_in_demo_proxy:${connection.provider}`);

  switch (connection.provider) {
    case 'anthropic': return await callAnthropic(connection, systemPrompt, userPrompt);
    case 'openai': return await callOpenAiCompatible(connection, systemPrompt, userPrompt, 'https://api.openai.com/v1/chat/completions');
    case 'mistral': return await callOpenAiCompatible(connection, systemPrompt, userPrompt, 'https://api.mistral.ai/v1/chat/completions');
    case 'azure_openai':
    case 'custom':
      if (!connection.baseUrl) throw new Error('base_url_required');
      return await callOpenAiCompatible(connection, systemPrompt, userPrompt, connection.baseUrl);
    case 'ollama': return await callOllama(connection, systemPrompt, userPrompt);
    default: throw new Error(`provider_unsupported_in_demo_proxy:${connection.provider}`);
  }
}

/**
 * The shared generation envelope every process-step agent uses: retrieve
 * grounding (always, for disclosure), then optionally try a real LLM call for
 * a supplementary narrative, never blocking or replacing the deterministic
 * result the caller already computed. Returns { grounding, llmNarrative,
 * generatedBy } to merge into the agent's response object.
 */
export async function augmentWithLlm({ organizationId, queryText, agentName, recordContext, connection }) {
  const grounding = retrieveGrounding(organizationId, queryText, 3);
  if (!connection) return { grounding, llmNarrative: null, generatedBy: 'deterministic' };

  const systemPrompt = [
    `You are the ${agentName} inside NCP Solver, a non-conformity management application.`,
    'Stay strictly within NCP Solver\'s own vocabulary: process stages are named S1 through S7 (never "E1-E7"),',
    'the action roles are Action Responsible (AR) and Action Evaluator (AE), and root causes use the 6M categories',
    '(Man, Machine, Method, Material, Measurement, Milieu).',
    'State no number, score, or name that is not present in the record context or the methodology references below.',
    'If the context does not support a specific claim, say so explicitly rather than inventing one.',
    'Respond with a short, plain-language narrative (2-4 sentences) a human reviewer can quickly read and judge — not JSON, not a form.',
  ].join(' ');
  const userPrompt = [
    `Record context:\n${JSON.stringify(recordContext || {}, null, 2)}`,
    `Methodology references retrieved for this case:\n${groundingBlock(grounding)}`,
    'Write your short narrative now.',
  ].join('\n\n');

  try {
    const text = await callRealLlm(connection, systemPrompt, userPrompt);
    return { grounding, llmNarrative: text.trim(), generatedBy: 'llm' };
  } catch {
    // FR-M6-09: any failure silently falls back — the caller's deterministic
    // result stands on its own; grounding is still disclosed.
    return { grounding, llmNarrative: null, generatedBy: 'deterministic' };
  }
}
