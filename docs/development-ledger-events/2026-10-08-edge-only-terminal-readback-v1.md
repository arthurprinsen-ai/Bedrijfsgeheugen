# Development ledger: Edge-only terminal production proof

- Date: 2026-10-08
- Obligation-ID: linkedin-cross-workspace-auth-proof-20261008-v1
- Incident: Obligation Terminal Closure GitHub run #37760879023, failing at website release readback
- Root cause: Edge-only change incorrectly required unrelated website deployment
- Corrective action: require prior successful Supabase provider readback and protected main ancestry for Edge-only automation changes; preserve website check for mixed and website changes
- Current status: PENDING_PROTECTED_DELIVERY; no terminal proof asserted before CI, merge and production reconciliation
