# Commercial publisher channel starvation regression — 2026-10-08
- Obligation-ID: personal-priority-starvation-commercial-channel-v1
- Recovery authority: existing `powerhouse-content-orchestrator` and `powerhouse-content-loop`; absolutely no secondary producer, publisher or scheduler.
- Production evidence: Oct 8 personal BLOCKED `PERSONAL_SOURCE_UNVERIFIED`, priority=100; company decided priority=99. Orchestrator `limit(1)` repeatedly reselects personal if blocked is auto-redecided.
- Intervention: retain a truthful BLOCKED first-person claim only until its source is genuinely verified; next existing channel becomes eligible without forging content or relaxing provider/uniqueness gates.
- Regression: `tests/brain-content-blocked-channel-fairness-v1.test.mjs` covers blocked priority, source refresh, published no-side-effect, auth independence.
- Closure: exact HEAD Required + CodeQL + provider preview, protected merge, production Edge deployment and new natural loop/readback. Source-only PR never counts as live.
