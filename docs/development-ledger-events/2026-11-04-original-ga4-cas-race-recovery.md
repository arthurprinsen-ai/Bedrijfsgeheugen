# Development ledger — 2026-11-04 original GA4 CAS bounded correction

- **Owner:** original `bg-analytics-sync-composio` and ONE BRAIN Data Spine.
- **Evidence:** 2026-11-04 12:05:05Z Supabase native `ga4_failover_observed`, exact `STATE_VERSION_CONFLICT` in `brain_transition_obligation`.
- **Defect:** concurrent legitimate source/Brain writer increments `version` before original collector transitions the same canonical record.
- **Change:** three-attempt exact-ID CAS reread/merge with terminal protection; original RPC only. No fake provider metrics.
- **Prevention:** test real function logic on conflict, preserved evidence, permission failure, and terminal state. No second writer or fallback cron.
- **Release status:** protected candidate only until CI + merge + exact native Edge parity + next original GA4 run. Consent-limited data remains unverified, not green.
