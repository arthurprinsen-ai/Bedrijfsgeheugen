# P0 #4198 — content-loop stage isolation

The canonical content-loop retains a single execution lease, existing scheduler-token authentication, publication deduplication, exact provider readbacks, and channel-specific media and OAuth gates.

## Failure

An unsuccessful outcome reconciliation before dispatch, an Instagram winner selection failure, or a second reconciliation failure after dispatch could end the entire content-loop. Blog and LinkedIn had no opportunity to proceed independently.

## Change

Reconciliation faults are captured as degraded observability rather than exceptions that prevent safe independent delivery. Instagram winner failures skip Instagram media generation but never block the blog/LinkedIn dispatch. A reconciliation failure cannot qualify the loop as GREEN, regardless of previous provider evidence.

The existing function is registered in supabase/config.toml to make main-to-production source parity mandatory. verify_jwt stays false **only** because the function body already verifies the canonical x-powerhouse-token header before lease acquisition or any delivery.

## Evidence required

Node regression tests cover channel isolation, deployment registration, lease/authentication and provider-proof invariants. On merge, protected Supabase deployment and byte-for-byte provider source parity must pass. Provider-created posts, emails and DMs are independent of this technical change and need actual delivery receipts to close P0 #4198.
