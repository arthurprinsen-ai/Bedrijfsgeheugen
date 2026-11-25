# Daily growth source intermittent-provider recovery — 2026-10-24

- Observed code gap: one read-only provider HTTP failure caused daily source collector to exit, despite existing scheduler and independent fail-closed proof gate.
- Reuse: existing daily Content growth learning workflow, same trusted Supabase Management API query and canonical source tables.
- Safe recovery: only idempotent read-only POST with fixed, bounded attempts and explicit auth/shape/error classification.
- No new publisher retry, no duplicate scheduler, no parallel incident database, no invented performance or bypass.
- Required proof: local regression, exact GitHub Required+CodeQL, protected main merge, then genuine next daily provider artifact and metrics readback.
