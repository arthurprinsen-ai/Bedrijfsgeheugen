# Autonomous outreach Supabase release scope recovery

- Obligation-ID: autonomous-outreach-supabase-scope-20261008-v1
- Observed failed authority: Supabase Edge Production Authority run 37807285689, step Resolve exact function set, function `powerhouse-autonomous-outreach` not declared in config.
- Repair: only canonical Supabase function declaration, no auth or business logic changes.
- Regression: `tests/brain-autonomous-outreach-supabase-scope.test.mjs` checks function scope and scheduler-token check before outbound sending.
- Evidence: Brain learning record + this ledger + human change note; exact protected CI, merge and provider readback required.
