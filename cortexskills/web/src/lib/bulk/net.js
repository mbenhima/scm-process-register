// Network failure handling of a Multi-Entry: a save that fails because the connection is lost is queued, not
// failed; it is retried with exponential backoff and when the browser reports the connection again. A save the
// server refuses (validation, rights, lock) is an error shown on the row and never retried by itself.

/** Delay before retry number `attempt` (0-based): 1 s, 2 s, 4 s … up to 30 s, with a little jitter. */
export function backoff(attempt, { base = 1000, max = 30000, jitter = 0.2, random = Math.random } = {}) {
  const d = Math.min(max, base * 2 ** Math.max(0, attempt));
  return Math.round(d * (1 - jitter / 2 + random() * jitter));
}
/** True when an error means the server was not reached (offline, DNS, reset), as opposed to a refusal. */
export function isNetworkError(e) {
  if (!e) return false;
  if (e.status && e.status >= 400 && e.status < 600 && e.status !== 502 && e.status !== 503 && e.status !== 504) return false;
  return e.name === 'TypeError' || e.offline === true || e.status === 0 || e.status === 502 || e.status === 503 || e.status === 504 || /network|failed to fetch|load failed|offline/i.test(String(e.message || ''));
}
/** Calls fn, retrying network failures with backoff; any other error is thrown at once. */
export async function withRetry(fn, { retries = 4, wait = ms => new Promise(r => setTimeout(r, ms)), onRetry, ...opts } = {}) {
  for (let attempt = 0; ; attempt++) {
    try { return await fn(); } catch (e) {
      if (!isNetworkError(e) || attempt >= retries) throw e;
      const ms = backoff(attempt, opts); onRetry?.({ attempt: attempt + 1, ms, error: e }); await wait(ms);
    }
  }
}
