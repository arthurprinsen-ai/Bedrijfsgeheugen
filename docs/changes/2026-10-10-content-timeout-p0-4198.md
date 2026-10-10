# P0 #4198 — bounded slow Anthropic generation without false failed runs

A real 2026-10-10 production supervisor v34 tick timed out its existing `powerhouse-content-orchestrator` after 40s. The child persisted a fresh Wet DBA blog artifact after the timeout. Meanwhile the parent had marked the bootstrap failed, retained its lease, did not publish LinkedIn and failed the daily truth contract. The 40-second bound is too aggressive for the actual Anthropic content model.

Fix the *existing* supervisor only: set child timeout to 75s; at most one Anthropic generation per tick; skip a redundant second generation when bootstrap already attempted one. The hourly canonical cron, one lease, external side-effect guards, identity/dedupe/media and provider readback remain unchanged. Avoid four sequential 75s calls inside a single ~120s invocation; subsequent hourly passes may process more pending channels.

Protected merge, live Edge source parity, real company/personal posts and 10 Oct public blog readback are required to claim delivery. Outbound email/DM recipients need separate authority and prior-contact/cooldown checks.
