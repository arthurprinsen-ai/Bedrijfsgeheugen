# Development ledger — terminal Supabase provider readback v1

- Date: 2026-09-20
- Obligation: `terminal-supabase-provider-readback-v1`
- Failure: false-positive terminal production proof for a Supabase Edge Function change.
- Detection: direct Supabase provider readback after PR #2465 terminalization.
- Runtime repair: `powerhouse-social-publisher` deployed as active v26 and verified.
- Prevention: terminal closure fails closed unless every changed Supabase function has explicit active provider version/runtime hash evidence.
- Regression: `tests/brain-terminal-supabase-provider-readback.test.mjs`
