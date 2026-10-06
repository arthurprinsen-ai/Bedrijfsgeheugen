# Actions scheduler hardening — 2026-10-06

Required no longer serializes the whole workflow behind one PR-scoped concurrency group. The cheap admission/classification path can start immediately; stale heads yield before expensive assurance, while Netlify, Supabase and delivery lanes retain cancellable per-lane concurrency.

PR Janitor now also cleans orphaned pull-request Action runs. A run is cancellable only when its head SHA/ref belongs to no open PR. Closed-PR events clean immediately; a six-hour age threshold and bounded page scan provide scheduled fallback.

No release, security, exact-head or provider assurance is removed.
