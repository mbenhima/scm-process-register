// journi has no backend — every request an AI Use Case makes goes directly
// from the signed-in user's own browser to the provider's public API, using
// the API key entered on Module 17's Provider Connection panel. That key is
// stored only in this browser's localStorage (a separate key from the rest
// of app state, so it survives "Reset Demo Data" and is never bundled into
// the seeded demo data). This is a reasonable pattern for a personal/demo
// deployment; it is not a substitute for a real backend proxy in a
// multi-user production deployment, since every user with browser devtools
// access can read the stored key.

export const PROVIDERS = [
  { id: 'anthropic', label: 'Anthropic (Claude)', defaultModel: 'claude-sonnet-4-5', keyPlaceholder: 'sk-ant-...' },
  { id: 'openai', label: 'OpenAI (GPT)', defaultModel: 'gpt-4o-mini', keyPlaceholder: 'sk-...' },
  { id: 'google', label: 'Google (Gemini)', defaultModel: 'gemini-1.5-flash', keyPlaceholder: 'AIza...' },
  { id: 'custom', label: 'Custom / OpenAI-compatible endpoint', defaultModel: '', keyPlaceholder: '(if required)' },
]

export function providerLabel(providerId) {
  return PROVIDERS.find((p) => p.id === providerId)?.label || providerId
}

/**
 * Calls the configured LLM provider directly from the browser and returns
 * the generated text. Throws with a human-readable message on any failure
 * (missing config, network/CORS error, non-2xx response, unexpected shape)
 * so callers can surface it and fall back to the built-in canned generator.
 */
export async function callLLM(config, prompt) {
  if (!config?.apiKey && config?.provider !== 'custom') {
    throw new Error('No API key configured.')
  }
  const model = config.model || PROVIDERS.find((p) => p.id === config.provider)?.defaultModel
  if (!model) throw new Error('No model specified.')

  switch (config.provider) {
    case 'anthropic':
      return callAnthropic(config, model, prompt)
    case 'openai':
      return callOpenAI(config, model, prompt)
    case 'google':
      return callGoogle(config, model, prompt)
    case 'custom':
      return callCustom(config, model, prompt)
    default:
      throw new Error(`Unknown provider: ${config.provider}`)
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

async function callAnthropic(config, model, prompt) {
  let res
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        // Required for a direct browser (non-Node) call — without this header
        // Anthropic's API rejects the request rather than allow it cross-origin.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model, max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
    })
  } catch {
    throw new Error('Network/CORS error reaching Anthropic — the API key and model are unverified.')
  }
  if (!res.ok) throw new Error(`Anthropic API error (${res.status}): ${await parseErrorBody(res)}`)
  const data = await res.json()
  const text = data?.content?.[0]?.text
  if (!text) throw new Error('Anthropic returned an unexpected response shape.')
  return text.trim()
}

async function callOpenAI(config, model, prompt) {
  let res
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model, max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
    })
  } catch {
    throw new Error('Network/CORS error reaching OpenAI — some OpenAI accounts/models block direct browser calls.')
  }
  if (!res.ok) throw new Error(`OpenAI API error (${res.status}): ${await parseErrorBody(res)}`)
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('OpenAI returned an unexpected response shape.')
  return text.trim()
}

async function callGoogle(config, model, prompt) {
  let res
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    )
  } catch {
    throw new Error('Network/CORS error reaching Google Gemini.')
  }
  if (!res.ok) throw new Error(`Gemini API error (${res.status}): ${await parseErrorBody(res)}`)
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned an unexpected response shape.')
  return text.trim()
}

async function callCustom(config, model, prompt) {
  if (!config.baseUrl) throw new Error('No base URL configured for the custom endpoint.')
  let res
  try {
    res = await fetch(config.baseUrl.replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({ model, max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
    })
  } catch {
    throw new Error('Network/CORS error reaching the custom endpoint.')
  }
  if (!res.ok) throw new Error(`Custom endpoint error (${res.status}): ${await parseErrorBody(res)}`)
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('Custom endpoint returned an unexpected response shape.')
  return text.trim()
}
