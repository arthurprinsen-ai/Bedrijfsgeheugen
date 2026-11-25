# Development ledger — generated blog slug truncation

- Date: 2026-10-23
- Canonical parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439
- Obligation: `content|daily-blog|export-slug-boundary|20261023-v1`
- Failure: run 39883989350 job 120187759613, `INVALID_SLUG`; existing generated article slug 70 chars ending with `-`, no external post ID.
- Root cause: Supabase Edge `slugify` caps *after* separator cleanup and leaves a trailing separator at the cut boundary.
- Fix: trim trailing hyphens after the cap without broadening allowed URL syntax; preserve canonical blog exporter, immutable publication evidence and identity.
- Tests: `tests/brain-powerhouse-blog-export-slug-boundary-20261023.test.mjs` tests actual source expression, bounded paths, hostile/empty inputs, content-id/canonical consistency and original fail-closed validator.
- Gates: same protected Required/CodeQL, Supabase Edge production source attestation, same daily publisher and final public blog route readback; no direct database status write or duplicate publish.
