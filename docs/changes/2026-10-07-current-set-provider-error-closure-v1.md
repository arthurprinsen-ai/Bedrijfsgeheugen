# Current-set provider error closure v1

Production exposed a final commercial-heartbeat continuation gap after the transport/auth/database recovery was otherwise healthy.

A LinkedIn action had passed the exact quality gate and reached the canonical provider executor. The provider call failed, leaving the action in `status=error` while its daily-action-set evidence remained active. The current-set selector no longer selected that action, but output assurance still counted it as an active same-day action without a fresh terminal send/non-send decision.

The structural correction is fail-closed:

- provider execution errors in the current daily set are expired;
- they receive an explicit `OBSERVE` commercial closure;
- `send_forbidden=true` is recorded;
- the provider error is retained as evidence;
- only a fresh, deduped, quality-ready canonical action may re-enter execution;
- this closure runs after canonical social dispatch and before output assurance.

Production readback proved the resulting canonical heartbeat at 2026-10-07T10:12:06Z as VERIFIED under `NETLIFY_SUPABASE_EDGE`, with 100% terminal coverage and healthy `ZERO_OUTPUT_EXPLICITLY_JUSTIFIED` output assurance.

This change introduces no scheduler owner and does not weaken provider or quality gates.
