// Batched bulk operations (paste, import, bulk delete, bulk update): items are sent in chunks of 200 – 500 so a
// large operation never times out a session or holds a lock; each chunk is saved before the next one; a failed
// chunk does not stop the others; the operation can be cancelled between chunks and resumed from where it stopped.

export const DEFAULT_BATCH = 250;
export const chunk = (items, size = DEFAULT_BATCH) => { const out = []; for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size)); return out; };

/**
 * runBatches(items, worker, { size, signal, onProgress, from }) — worker(batch, index) returns a promise.
 * Resolves with { results, failed: [{ index, error, items }], done, total, cancelled, next } where `next` is the
 * first batch index not done (to resume with { from: next }); `failed` keeps each failed batch to retry it.
 */
export async function runBatches(items, worker, { size = DEFAULT_BATCH, signal, onProgress, from = 0, only } = {}) {
  const batches = chunk(items, size); const results = []; const failed = []; let done = 0; let next = from;
  const total = batches.length;
  onProgress?.({ done: 0, total, items: 0, of: items.length, failed: 0 });
  for (let i = from; i < total; i++) {
    if (only && !only.includes(i)) continue;
    if (signal?.aborted) return { results, failed, done, total, cancelled: true, next: i };
    try { results[i] = await worker(batches[i], i); done++; }
    catch (error) { failed.push({ index: i, error, items: batches[i] }); }
    next = i + 1;
    onProgress?.({ done: done + (from || 0), total, items: Math.min(items.length, (i + 1) * size), of: items.length, failed: failed.length });
  }
  return { results, failed, done, total, cancelled: false, next };
}
