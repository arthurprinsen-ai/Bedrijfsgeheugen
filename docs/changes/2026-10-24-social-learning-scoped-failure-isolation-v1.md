# Preserve hourly social learning across isolated tenant failures

The existing Netlify hourly social-learning evaluator runs the two authorized scopes concurrently instead of waiting for `canonical` to complete before `bedrijfsgeheugen` starts. This removes sequential provider latency and allows an otherwise healthy brand evaluation to progress when the canonical tenant fails. Worker batches remain bounded to two due 24/48/72-hour windows per scope and use the existing scoped Supabase store.

`Promise.allSettled` captures each authorized scope outcome without leaking provider error text, and partial completion returns HTTP 503 with the failed scope, never a false-green 204. The existing `@hourly` schedule remains the retry authority; no additional scheduler, source or customer database is created. Missing or out-of-window provider metrics remain missing, not zeros, and no commercial outcome is inferred from source readback.

Regression in `tests/brain-social-learning-scoped-failure-isolation-v1.test.mjs` validates concurrent starts, sibling progress on failure, pre-side-effect scope validation, unchanged hourly cadence and fail-closed reporting. Real live results must be independently observed after protected merge and Netlify production deployment.
