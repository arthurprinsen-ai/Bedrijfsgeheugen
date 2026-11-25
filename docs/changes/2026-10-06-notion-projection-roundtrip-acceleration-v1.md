# Notion projection round-trip acceleration v1

The company-decision projection already used bounded worker concurrency, but every decision update still performed its own fingerprint lookup before PATCHing the page. Update-heavy syncs therefore paid approximately two Notion API calls per decision.

This change adds a bounded fingerprint prefetch. Existing pages are resolved in batches (default 25 fingerprints, at most 50), then worker upserts PATCH those known page ids directly. Missing fingerprints deliberately keep the old query-before-create path so create idempotency is not weakened.

Transient 429/503/529 responses now use one centralized bounded retry policy, honoring Retry-After where supplied. Netlify environment variables can tune sync concurrency, prefetch batch size/concurrency and retry attempts within hard caps.

Notion remains a projection only; it is still not part of merge, deploy or production-readback authority.
