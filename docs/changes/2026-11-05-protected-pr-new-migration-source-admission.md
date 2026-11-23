# 2026-11-05 — protected migration admission: production baseline versus PR delta

## Reproduceerbare productieblokkade
PR #5450 (head a62677d2) Required run 42039247615 preflight failed before hosted Supabase Preview. Exactly 807 migrations were independently provider-applied and matched the 807 immutable Git lock entries, but the PR correctly introduced a new unapplied migration `20261105134200_original_data_spine_decision_receipt_same_tick_v1.sql`: 808 executable SQL files versus 807 provider-backed entries. Five historical tests equated the two populations, making any proper new migration PR structurally impossible.

## Existing owner, no new executor
Keep `supabase/migration-history.lock.json` as **already applied** provider history, and never predeclare candidate SQL as applied. `tools/ci/protected-supabase-pr-migration-tests.mjs` now separates exact historical baseline from a source-only PR addition by immutable Git base/head diff. Historical migrations cannot be modified/deleted, pending versions must be greater and unique, SQL cannot be empty or comment-only, and the provider lock cannot be forged. Original strict migration-lock tests still run against the exact historical population in an ephemeral CI-only workspace; proposal SQL is restored and independently validated. The output clearly says `PROPOSED_SOURCE_ONLY_PREVIEW_REQUIRED`, not success in production.

**The actual replay authority remains the existing hosted Supabase Preview** and the protected Required/CodeQL/production verification pipeline. A skipped, missing or failed provider preview never becomes success by this admission. No direct schema mutation, duplicate cron, alternative release route or assertion of paid revenue was introduced.

## Acceptance after merge
1. Protected Required CI and CodeQL succeed on the exact new revision.
2. Re-run #5450 against current main through its existing owner and prove source admission passes; obtain independent provider Supabase Preview success (not merely source contract).
3. After protected merge and authorised provider application, read `supabase_migrations.schema_migrations` again, update lock from real provider history, prove exact source/remote parity and natural Cron/Heartbeat runtime readback.
4. #3742 remains open until a clean-room schema replay from repository history is independently proven. This source-level repair is not itself clean-room parity or terminal green.

Fingerprint: `supabase|ci|protected-new-migration-candidate-vs-provider-baseline|20261105-v1`; owner: existing GitHub Required + original Supabase integration; source run: 42039247615, failing job: 127285726106.

## Canonieke toelating en metadata
De bestaande GitHub-hygiënecontrole verwacht een exact `Base-SHA` in de PR-machinegegevens. De eerste controle van PR #5453 (Required run 42043448283) weigerde de PR terecht met `PR_MACHINE_METADATA_INVALID:BASE_SHA_INVALID,BASE_SHA_MISSING`. Dit is in dezelfde PR-beschrijving gecorrigeerd; geen controle is uitgeschakeld. De nieuwe commit vraagt een nieuwe exacte-head CI-controle aan.
