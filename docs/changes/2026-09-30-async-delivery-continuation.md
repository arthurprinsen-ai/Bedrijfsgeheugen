# Async delivery continuation — 2026-09-30

Concurrent Powerhouse agents must not block one another by waiting synchronously for GitHub Actions, Netlify, Supabase, CodeQL or provider jobs.

The canonical behavior is now checkpoint + continue: persist obligation, exact candidate head, current main epoch, open gates and next safe action; continue independent work; deduplicate required runs; supersede stale reversible production waits with newer authoritative main; bound polling; resume automatically after interruption.

Implementation in this lineage:
- Production Source Snapshot uses cancel-in-progress for the single main production flight and has a 20-minute job timeout.
- Required test jobs are bounded to 20 minutes.
- AGENTS.md, the canonical continuity policy, continuity skill, Brain learning and System Map all carry the same invariant.

This prevents a queued or running workflow from becoming a conversational stop condition. Pending is internal state, not a user handoff.

Additional optimization: `Required test` now derives `netlify_build_required` from actual Netlify-hosted runtime/build paths. Control-plane-only changes no longer execute the full deterministic site build merely because they require the shared governance suite.
