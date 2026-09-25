# Development ledger — Supabase historical replay baseline recovery

- Clean preview reproduction: confirmed.
- Failure 1: missing historical P0 desired-state baseline before 20260920101200.
- Failure 2: missing Instagram daily-winner table before 20260920102500.
- Production semantics: preserved.
- Recovery strategy: exact idempotent baseline before first dependency; later canonical migrations remain authoritative.
- Verification target: hosted Supabase PR Preview must replay beyond both failure points from a clean recreated branch.

- Failure 3: missing production-only `powerhouse_instagram_media_reserve_v1` before canonical fallback function creation.
- Production readback: exact schema/constraints/RLS/grants captured and mirrored idempotently.
