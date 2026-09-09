# Real RAG in journi's backend

`index.js` and `db.js` are the original backend: a thin Express + SQLite
persistence layer for the app-state blob the frontend used to keep only in
`localStorage`. The three routes below are new — added to that same server,
not a second one — for one reason: real retrieval-augmented generation
behind **Query Data**, **Query Features**, and the **AI Use Case Library**.

- **Query Data** (`/api/query-data`) — ask a plain-language question about
  this tenant's own data (project counts, ADKAR trends, open resistance
  entries...), answered from a RBAC-scoped, server-enforced view of the
  data, never guessed by the model.
- **Query Features** (`/api/query-features`) — ask what journi can do, get
  pointed at the right module, filtered to what your role can actually
  open.
- **AI Use Case Library RAG** (`/api/ai-suggest`) — every one of Module 6's
  14 Assistive/Augmented use cases now retrieves journi's own methodology
  definitions (the exact ADKAR/Bridges/Kübler-Ross/Lewin vocabulary this
  project's SRS and frameworks guide use) before generating, instead of
  leaning on the model's own generic idea of those terms.

## No second database

These three routes hold no persistence of their own — `db.js`'s SQLite file
is still the only place journi's data lives server-side. Query Data's
frontend page sends the current, already-in-memory tenant state (the exact
same blob `PUT /api/state` already persists) along with each question; this
server's added job is retrieval + RBAC enforcement + calling the LLM, not a
second copy of the data.

## Retrieval, honestly

`lib/retrieval.js` is a real TF-IDF + cosine-similarity search over a
bag-of-words vector space — not a neural embeddings model, not a vector
database, and it needs no network call or API key to run. That's a
deliberate choice, not a shortcut: it means retrieval is exactly
reproducible, works fully offline, and can be verified without ever
touching a provider's API. Swapping in a real embeddings provider (Voyage
AI, OpenAI, etc.) later is a contained change to `retrieval.js` alone —
every route already treats the index as an opaque `{ search(query, k) }`
capability.

`lib/queryData.js`'s aggregations (project counts, open resistance entries,
ADKAR averages, firing alerts...) are computed directly from the data in
code — the LLM's only job is to phrase that already-computed fact into a
sentence, never to compute or restate a number on its own. Retrieval only
takes over for questions no aggregation recognizes, and even then the
model is instructed to answer from the retrieved records alone.

## RBAC enforcement, server-side

`lib/queryData.js` imports journi's own real RBAC functions —
`visibleOrganizations` / `visibleProjects` from `journi/src/utils/rbac.js`,
and `ROLES_WITH_INDIVIDUAL_VISIBILITY` from `journi/src/data/constants.js`
— directly. There is no second, hand-maintained copy of the visibility
rule: whatever a project-scoped Change Manager can see in the app is
exactly what this endpoint computes over, and if the app's own RBAC logic
changes, this endpoint changes with it automatically.

`lib/queryFeatures.js` filters journi's module catalog (`lib/corpus/
features.js`) against the same role-gated modules `<RequireRole>` enforces
in `journi/src/App.jsx`, so a search never points someone at a screen their
own role would immediately be blocked from opening.

## LLM calls

`lib/llmProxy.js` calls Anthropic, OpenAI, Google, or a custom
OpenAI-compatible endpoint — the same four providers as the frontend's own
`journi/src/utils/llmProviders.js` (Module 6's "Provider Connection"
panel). A request either:

1. carries `llm: { provider, apiKey, model }` forwarded from whatever the
   signed-in user already connected on Module 6 (the frontend does this
   automatically), or
2. falls back to `ANTHROPIC_API_KEY` in `server/.env` (copy
   `.env.example`), if set.

The key is used once, for that one request, and is never written to disk,
logged, or cached. This is also the fix `llmProviders.js`'s own comment
already called out as missing: *"not a substitute for a real backend proxy
in a multi-user production deployment, since every user with browser
devtools access can read the stored key."* Devtools can no longer read the
key mid-flight to a third-party origin — it goes to this server first.

If no key is available at all (neither `.env` nor a Module 6 connection),
every route still returns its retrieval result (the computed fact / the
matched module / the retrieved methodology snippets) with a
`generationError`, rather than fail outright.

## Routes

| Route | Body | Returns |
|---|---|---|
| `POST /api/query-data` | `{ question, user: {role, scopeType, scopeId}, data, llm? }` | `{ answer, mode, fact, sources }` |
| `POST /api/query-features` | `{ question, user: {role}, llm? }` | `{ answer, sources }` |
| `POST /api/ai-suggest` | `{ useCaseId, recordContext?, llm? }` | `{ text, tier, humanCheckpoint, sources, generationError? }` |
| `GET /api/health` | — | `{ ok, serverFallbackKeyConfigured }` |
