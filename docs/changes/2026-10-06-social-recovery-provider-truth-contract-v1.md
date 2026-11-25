# Social recovery provider-truth terminal contract

Date: 2026-10-06

Observed:
- recovery could report provider truth healthy when a published obligation had an external id but `provider_truth_verified=false`;
- LinkedIn company later reached provider-proven LIVE_PROVEN, but earlier auth/reconcile error fields could remain merged into the successful evidence object.

Repair:
- every required publish decision now needs a matching canonical social obligation with explicit `provider_truth_verified=true` and a durable external id before recovery can be GREEN;
- LIVE_PROVEN is included in the checked obligation states;
- the runner returns the explicit provider-truth count used for workflow evidence;
- successful LinkedIn company proof removes stale error/auth-preflight fields before decision and obligation writeback.

Safety:
- no provider call is added;
- no external id is fabricated;
- no republish path is introduced;
- production promotion remains protected-main-only.
