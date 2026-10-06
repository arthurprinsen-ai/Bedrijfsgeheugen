# 2026-10-06 — Resumable Supabase migration repair readback

- Obligation: #3742
- Predecessor: #3817
- Transport evidence: session pooler is intermittently reachable from trusted GitHub runners
- Safety decision: retry observations, not mutation
- Allowed pre-state: exact four local-only baselines OR zero drift
- Mutation: single supported `supabase migration repair --status applied --db-url` only when exact four drift is present
- Closure unchanged: zero post-drift -> lock update -> exact-HEAD #3766 gates -> protected merge -> production readback
