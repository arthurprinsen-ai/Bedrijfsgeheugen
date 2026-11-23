# 2026-11-02 – original telemetry outage backend fixture drift

- **Incident** `powerhouse|brain|telemetry-503-vs-stale-202-test|20261102-v1` linked to #4439, original backend job #125183392982, exact original full BRAIN #41416918147 5377 / 5347 pass / 28 fail.
- **Root** old `status: 202` assertion, inconsistent with source `bg-interactie` `degradedResponse` HTTP 503, `opgeslagen:0`, `bevestigd:0`, `degraded:true`, breaker/timeout.
- **Safety** prevent false success on a failed PostgREST event write; preserve 503, no-store, independent error reason, header, timeout and breaker; never patch producer to tell a lie or count unpersisted website actions.
- **Change** original test only plus existing continuity agent skill, AGENTS, canonical Brain learning JSON with historical+shadow+canary and human change/ledger.
- **Acceptance** new independent original targeted test, protected Required+CodeQL, original full BRAIN and terminal, provider verification and later recurrence observation. No source Edge/SQL/permission/customer data change or fake GREEN.
