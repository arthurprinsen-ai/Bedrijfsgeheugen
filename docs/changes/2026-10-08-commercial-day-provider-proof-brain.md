# Commercial-day provider proof in the canonical Powerhouse Heartbeat

## Observed production defect (2026-10-08)
The existing 5-minute `powerhouse_commercial_heartbeat_v1` reports `actioned` and an output check reports `ZERO_OUTPUT_EXPLICITLY_JUSTIFIED` and `healthy=true` with `provider_proven_email=0` and `provider_proven_social=0`. That is a safe no-send, not a commercially executed action. On 2026-10-08, the current active action was a LinkedIn reply expired following provider execution failure. No provider-proven external action was observed at inspection.

## Minimal canonical change
- Keep the sole NETLIFY_SUPABASE_EDGE heartbeat and all existing channel executors.
- A commercial sales action counts only when `done`, executed on the correct Europe/Amsterdam day, and exact provider acknowledgement/readback **and** provider object identifiers are present. A separately owned blog/social publication counts only with canonical LIVE_PROVEN production/provider readback, a live proof timestamp and an appropriate public URL.
- A safe non-send still satisfies the safety side, but cannot satisfy the commercial-day delivery objective.
- Persist one idempotent `COMMERCIAL_EXECUTION` Brain obligation per calendar day, OPEN until actual provider proof, FULFILLED only when proved. Preserve same action lineage; do not create a queue, scheduler, email transport, or publisher.
- Heartbeat emits `observed` rather than `actioned` when commercial execution is unproven.
- Explicitly distinguish control-plane health from commercial output: `healthy`, `safe_no_send_decision`, `commercial_day_proven`, and `commercial_day_state`.

## Guardrails and limitation
No forced sends, mass DMs, duplicate posts, fabricated customers, or invented revenue. Neither opening a PR nor this migration alone proves production delivery. Provider-proof census includes canonical commercial sales-action provider objects (Gmail + LinkedIn/Instagram actions), plus publication obligations only after a live-proof timestamp and canonical public URL (and a provider object ID for social). GENERATED, APPROVED, PUBLISHED and scheduled posts do not qualify. This reuses the existing blog/publication owner's production readback; no second publisher is introduced. A safe no-send may remain a legitimate user-protection decision while the daily commercial target remains unmet.

## Closure
Protected merge, migration ledger readback, live heartbeat execution, matching Brain obligation state, exact action/provider ids, and a regression test must all be proven before LIVE_PROVEN.