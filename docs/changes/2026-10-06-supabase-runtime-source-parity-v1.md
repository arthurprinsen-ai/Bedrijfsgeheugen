# Supabase runtime source parity and preview proof v1

## Problem

The database-pressure recovery reached production through more than one execution path. Migration state was already ahead of Git main, while the Supabase Git deployment stopped before every Edge Function could be redeployed. That produced mixed live/source versions: some production functions contained newer emergency hardening than Git, while other fixes existed only in the merged repository.

A second control-plane defect was exposed during the preview rebuild. Supabase Preview Applicability selected the provider check by a timestamp expression that preferred `completed_at`. An older completed check could therefore outrank a newer provider run that was still in progress.

## Structural repair

- Keep production hotfixes that are newer than the merged repository instead of overwriting them.
- Reconcile `powerhouse-content-loop` so it contains bounded artifact generation, typed direct-SQL lease handling, JSONB normalization, `publish_only`, and a separate `cockpit_autopilot` delivery lane.
- Preserve the newer production `powerhouse-social-publisher` LinkedIn identity parsing, retriable connection-state handling, and evidence normalization as canonical source.
- Keep `powerhouse-content-orchestrator` at the merged bounded direct-Postgres implementation; production v40 is exact source parity with merge SHA `47e36a513757c230ca6305a06a3724338fea047d`.
- Change preview proof selection to the newest provider check-run id, not completion time.
- Require the same successful provider check id to be observed twice before the applicability gate terminalizes green.

## Safety

No migration file or migration-history row is changed by this parity closure. No publication-provider truth gate is bypassed. The fix strengthens fail-closed preview proof and removes runtime/source drift.
