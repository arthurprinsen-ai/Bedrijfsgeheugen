# 2026-10-05 — One commercial closed loop v2

- Type: IMPROVEMENT / COMMERCIAL_CLOSED_LOOP
- Fingerprint: `powerhouse|one-commercial-closed-loop|v2`
- Signal: commercial intelligence and execution capabilities existed, but terminal truth could still fragment across scheduler ownership, provider semantics and delivery evidence.
- Provider failure discovered: LinkedIn transport returned HTTP 200 while the semantic response was `CONCRETE_POST_CONTEXT_REQUIRED`; the action correctly remained non-terminal and provider acknowledgement stayed 0.
- Fix: canonicalized one lineage from event through identity, intent, NBA, pressure, research, persuasion/message quality, provider execution, outcome, attribution and learning.
- New execution guards: current source context, consent/capability, pressure/cooldown, dedupe, exact-message-hash quality, provider acknowledgement and terminal outcome/readback.
- Structural prevention: one canonical candidate/action materializer and one execution-owner; no second commercial scheduler-owner or parallel v2 authority.
- Latency rule: heavyweight intelligence remains bounded or independently scheduled and cannot block the heartbeat.
- Learning rule: no-response is observation only, never fabricated rejection.
- Delivery rule: exact-HEAD checks + Brain learning + development ledger + human documentation are required before merge; production status additionally requires post-merge readback.
- Canonical migration: `supabase/migrations/20261005161500_powerhouse_one_commercial_closed_loop_v2.sql`.
- PR: #3739.
- External execution truth at this stage: not claimed terminal.
