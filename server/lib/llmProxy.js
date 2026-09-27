// Server-side counterpart to src/utils/llmProviders.js. Journi's frontend
// has always called an LLM provider directly from the browser using a key
// the user enters on Module 6 (see the comment at the top of that file) —
// a reasonable pattern for a single-user demo, but one that file's own
// comment already flags as "not a substitute for a real backend proxy in a
// multi-user production deployment, since every user with browser devtools
// access can read the stored key." This module is that proxy: the same key
// the user already entered in Module 6 is forwarded once, per request, in
// the POST body over HTTPS to this backend, used exactly once to make the
// provider call, and never written to disk or logged — the key still never
// leaves the request/response round trip, it just no longer leaves the
// browser directly to a third party the browser has no control over.
//
// Falls back to a server-configured ANTHROPIC_API_KEY (server/.env) when the
// request carries no provider config at all, so Query Data / Query Features
// can work out of the box for whoever runs the server, without requiring
// every visitor to hold their own key.

const DEFAULT_MODELS = {
  anthropic: 'claude-sonnet-4-5',
  openai: 'gpt-4o-mini',
  google: 'gemini-1.5-flash',
}

export function hasServerFallbackKey() {
  return !!process.env.ANTHROPIC_API_KEY
}

/**
 * @param {{provider?: string, apiKey?: string, model?: string, baseUrl?: string}} config
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @returns {Promise<string>} generated text
 */
export async function callLLM(config, systemPrompt, userPrompt) {
  const provider = config?.provider || (hasServerFallbackKey() ? 'anthropic' : null)
  if (!provider) {
    throw new LlmProxyError('NO_PROVIDER', 'No LLM provider configured. Connect one on Module 6, or set ANTHROPIC_API_KEY in server/.env.')
  }
  const apiKey = config?.apiKey || (provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY : null)
  if (!apiKey && provider !== 'custom') {
    throw new LlmProxyError('NO_KEY', `No API key for ${provider}. Connect one on Module 6.`)
  }
  const model = config?.model || DEFAULT_MODELS[provider]
  if (!model) throw new LlmProxyError('NO_MODEL', 'No model specified.')

  switch (provider) {
    case 'anthropic':
      return callAnthropic(apiKey, model, systemPrompt, userPrompt)
    case 'openai':
      return callOpenAI(apiKey, model, systemPrompt, userPrompt)
    case 'google':
      return callGoogle(apiKey, model, systemPrompt, userPrompt)
    case 'custom':
      return callCustom(config, model, systemPrompt, userPrompt)
    default:
      throw new LlmProxyError('UNKNOWN_PROVIDER', `Unknown provider: ${provider}`)
  }
}

export class LlmProxyError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

async function parseErrorBody(res) {
  try {
    const body = await res.json()
    return body?.error?.message || body?.message || JSON.stringify(body).slice(0, 200)
  } catch {
    return res.statusText
  }
}

async function callAnthropic(apiKey, model, systemPrompt, userPrompt) {
  let res
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        system: systemPrompt || undefined,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })
  } catch (e) {
    throw new LlmProxyError('NETWORK', `Network error reaching Anthropic: ${e.message}`)
  }
  if (!res.ok) throw new LlmProxyError('PROVIDER_ERROR', `Anthropic API error (${res.status}): ${await parseErrorBody(res)}`)
  const data = await res.json()
  const text = data?.content?.[0]?.text
  if (!text) throw new LlmProxyError('BAD_SHAPE', 'Anthropic returned an unexpected response shape.')
  return text.trim()
}

async function callOpenAI(apiKey, model, systemPrompt, userPrompt) {
  let res
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: userPrompt },
        ],
      }),
    })
  } catch (e) {
    throw new LlmProxyError('NETWORK', `Network error reaching OpenAI: ${e.message}`)
  }
  if (!res.ok) throw new LlmProxyError('PROVIDER_ERROR', `OpenAI API error (${res.status}): ${await parseErrorBody(res)}`)
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new LlmProxyError('BAD_SHAPE', 'OpenAI returned an unexpected response shape.')
  return text.trim()
}

async function callGoogle(apiKey, model, systemPrompt, userPrompt) {
  let res
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
          contents: [{ parts: [{ text: userPrompt }] }],
        }),
      },
    )
  } catch (e) {
    throw new LlmProxyError('NETWORK', `Network error reaching Google Gemini: ${e.message}`)
  }
  if (!res.ok) throw new LlmProxyError('PROVIDER_ERROR', `Gemini API error (${res.status}): ${await parseErrorBody(res)}`)
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new LlmProxyError('BAD_SHAPE', 'Gemini returned an unexpected response shape.')
  return text.trim()
}

async function callCustom(config, model, systemPrompt, userPrompt) {
  if (!config?.baseUrl) throw new LlmProxyError('NO_BASE_URL', 'No base URL configured for the custom endpoint.')
  let res
  try {
    res = await fetch(config.baseUrl.replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: userPrompt },
        ],
      }),
    })
  } catch (e) {
    throw new LlmProxyError('NETWORK', `Network error reaching the custom endpoint: ${e.message}`)
  }
  if (!res.ok) throw new LlmProxyError('PROVIDER_ERROR', `Custom endpoint error (${res.status}): ${await parseErrorBody(res)}`)
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new LlmProxyError('BAD_SHAPE', 'Custom endpoint returned an unexpected response shape.')
  return text.trim()
}
