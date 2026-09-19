# CI path-scope efficiency v1

Fingerprint: `github|ci-path-scope|semantic-admission-v1`

## Problem

Auxiliary CI was starting for changes that could not affect the contract under test. LinkedIn Revenue Cockpit reacted to every Supabase migration even though its tests directly depend on the Powerhouse runtime plus LinkedIn/revenue migration contracts. Revenue Learning also contained duplicate path entries.

## Change

- LinkedIn Revenue Cockpit now watches `supabase/functions/powerhouse-runtime/**`, `*linkedin*.sql` and `*revenue*.sql` instead of every migration.
- Revenue Learning keeps repository-wide migration integrity coverage but removes duplicate path entries.
- Both auxiliary workflows use PR/ref-scoped single-flight concurrency without event-name splitting.
- Revenue Learning has a bounded 10-minute timeout.
- The existing Required-wired CI admission regression verifies these invariants.

## Safety

No required gate is removed. Broad migration coverage remains in Revenue Learning because it runs migration-history and reproducibility contracts. The LinkedIn workflow gains direct coverage for the runtime file its tests actually inspect.
