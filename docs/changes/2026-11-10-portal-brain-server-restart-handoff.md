# P0 #4215 — Original Portal V2: recover BusinessInput handoffs after browser restart

Source authority: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215

## Confirmed root cause
The existing Portal V2 already persists the customer's state via `/api/portal-state` and the underlying Brain authority already idempotently writes BusinessInputs, CurrentState and organism-impact. But the list of **which semantic bindings and causal impacts still lack downstream Brain ACK** exists only in `portal-v2/domain-state.js` Map/Array. When a downstream section write failed after the source state was saved, browser restart erased that manifest. The next login could not know what to resume.

## Original-authority fix, not a second system
- Immediately before the original `domain.flush()` server write, save `portal.__brainHandoffJournalV1` in the **same** authenticated customer state. Each entry records the exact pending section binding/generation and every causal impact, but NO duplicate raw customer answers; those answers already live in that state.
- On original authenticated `createPortalDomainState.init()`, read back the persisted journal, validate every binding against the original semantic routing table and every impact's source path, and replay the current principal's pending obligations using **the same** `flush()`. This is the existing init hook, not another scheduler. The same original Brain idempotency/revision contract is retained.
- A partial Brain ACK persists an updated manifest containing only the unacknowledged sections and impacts. Cleanup failure remains pending for retry. Edits made during an in-flight source or Brain call are never automatically saved by journal housekeeping.
- Include server-issued tenant membership as well as identity in the principal key; preserve other authorized members' unacknowledged work without submitting under another user's token.
- Strip `portal.__brainHandoffJournalV1` from the `PortalDomainStateSnapshot` canonical source answers; do not turn delivery state into business facts/AI training input.

## Bounded proof
Original regression tests cover restart after failed POST, partial section ACK, >50 causal changes, two users, same user across tenant memberships, corrupted journal, and exclusion from AI source answers. Protected CI + exact production deployment and original 2-tenant authenticated browser test must be independently verified before calling it live.

Limit: A browser that closes **before any authenticated successful server state save** has no server-accepted input to replay; this PR does not create an offline device vault. It also does not prove fully autonomous downstream Heartbeat/agent execution or outcome-to-learning. Original P0 #4215 remains OPEN until provider receipts and complete loop evidence exist.
