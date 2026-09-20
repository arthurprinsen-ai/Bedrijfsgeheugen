# Social publisher dispatching-state contract — 20 september 2026

Fingerprint: `social-publisher-dispatching-state-contract-v1`.

## Incident

After Instagram passed the updated pre-publish review, `powerhouse-social-publisher` still returned HTTP 500 before any publication capability or Composio provider call was created.

## Root cause

The publisher correctly uses `dispatching` as an atomic single-writer claim between `content_ready` and external provider side effects. The database check constraint `powerhouse_channel_decisions_state_chk` did not include `dispatching`.

Postgres therefore rejected the claim with SQLSTATE `23514`.

## Fix

The canonical state constraint now includes `dispatching`. No provider or publication-authority gate is bypassed.

## Prevention

Runtime state-machine transitions and database constraints are now regression-bound. The test asserts that the publisher uses `dispatching`, that the migration allows it, and that the claim remains before Buffer/Composio side effects.

## Terminal proof

Protected merge → Supabase migration applied → constraint readback includes `dispatching` → publisher run passes claim/capability stage → Instagram provider readback proves final outcome.
