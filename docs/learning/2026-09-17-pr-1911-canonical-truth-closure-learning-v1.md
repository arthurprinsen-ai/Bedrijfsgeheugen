# PR #1911 canonical truth closure — learning v1

Date: 2026-09-17  
Repository: `arthurprinsen-ai/Bedrijfsgeheugen`  
Canonical fingerprint: `powerhouse-canonical-truth-closure-v1`

## Outcome

PR #1911 reached `LIVE & BEWEZEN` on exact final head `94db12f646f95915c449663bb8e1862eee3ce75e`, merged as `37215eb18054ae6513b4e5dff71a2335ed01bbbe`.

Production evidence on Supabase project `adhjwmvyoixzjtmiroln` confirmed:

- migration `20260917123749 powerhouse_canonical_truth_closure_v1` present in production migration history;
- `public.powerhouse_material_claims_v1` available in production;
- fresh readback: 41 rows, 14 material rows, latest source update `2026-09-17T12:57:57.018655+00:00`;
- Edge Function `powerhouse-content-loop` active as production version 2;
- no manual production DDL, no protected-merge bypass, and no validator or security-gate weakening.

## Root causes and reusable learnings

### 1. `migration-version-collision-fix-new-file-only-v1`

A newly introduced forward-only Supabase migration reused an existing legacy 14-digit migration version. The preview contract correctly failed closed.

**Proven fix**

Keep the legacy migration and duplicate-version validator immutable. Assign a unique 14-digit version only to the new migration. The canonical final migration is:

`supabase/migrations/20260917123749_powerhouse_canonical_truth_closure_v1.sql`

**Prevention rule**

Never repair a migration collision by rewriting historical migration identity or weakening duplicate-version validation. Verify the final migration version again in production migration history.

### 2. `diagnostic-field-rename-does-not-sanitize-contract-v1`

Renaming an exposed diagnostic field does not sanitize an external or persisted contract. Raw exception text plus execution/step details remained sensitive even after a field-name change.

**Proven fix**

Keep raw diagnostics server-side only. The production `powerhouse-content-loop` implementation logs raw `message` plus internal `stepResults` server-side and persists/returns the stable generic code `CONTENT_LOOP_INTERNAL_ERROR`.

**Prevention rule**

External and persisted result contracts must exclude raw exception text, stack traces, step/execution diagnostics, provider internals and equivalent sensitive diagnostics. A field rename alone is never accepted as sanitization.

### 3. `supabase-project-ref-from-pr-preview-is-not-connector-production-ref-v1`

A Supabase PR-preview/bot project reference was not the canonical connected production project. Assuming both identities were equal would have produced invalid production readback.

**Proven fix**

Resolve the production project from the connected Supabase project inventory/canonical authority before readback or mutation. For this release the authoritative production project is `adhjwmvyoixzjtmiroln`.

**Prevention rule**

Never infer production project identity from PR-preview comments, bot metadata or a stale handoff reference.

### 4. `concurrent-branch-mutation-reread-head-before-patch-v1`

PR #1911 changed concurrently during recovery. Observed candidate heads included `54daaaf6ee6854e80ce5fb6a5eec40171b761ad9`, `11d8776660bd5e47351121d8beb4456f4e68c669` and final head `94db12f646f95915c449663bb8e1862eee3ce75e`.

**Proven fix**

When a head moves, stop using stale assumptions. Re-read the actual PR head and diff, preserve valid concurrent fixes, patch only remaining proven defects, then rerun every mandatory gate on the exact final candidate.

**Prevention rule**

No patch, merge or completion claim may rely on evidence from an earlier candidate SHA after branch mutation.

### 5. `canonical-learning-writeback-repeat-is-idempotent-v1`

A repeated request to borg, log and document an already `LIVE_BEWEZEN` learning must not create a second canonical truth, duplicate learning record or parallel documentation path.

**Proven fix**

Re-read the existing canonical learning and its human-readable documentation first. When both remain verified, reuse the same lineage and add only genuinely new evidence or a new reusable learning. For this repeated request the existing PR #1911 learning remained intact on protected `main`, so the same lineage was extended with this idempotency rule rather than duplicated.

**Prevention rule**

Repeated borg/log/document requests are idempotent: `EXISTING_CANONICAL_LINEAGE_FIRST`, `NO_DUPLICATE_LEARNING_RECORDS`, `NO_PARALLEL_DOCUMENTATION_FOR_SAME_FACT`, and `NEW_EVIDENCE_MAY_EXTEND_EXISTING_LINEAGE`.

## Release-contract lessons

- Mandatory red gates block merge even if a headline `Required test` is green.
- Root cause must come from exact failing evidence, not from workflow conclusion names.
- Test-harness or manifest failures must be distinguished from product failures.
- Production readback is part of completion, not an optional postscript.
- Canonical learning writeback is part of Definition of Done.
- Existing state and lineage must be extended; do not create parallel truth stores, queues, dashboards or memories.
- Repeated writeback requests are verification/extension events, not permission to create duplicate canonical truth.

## Canonical Powerhouse writeback

The existing canonical records were extended rather than duplicated:

- `learning:pr-1911-release-contract-fail-closed-v1` → `LEARNED`, `LIVE_BEWEZEN`;
- `learning:powerhouse-canonical-truth-closure-v1` → `LEARNED`, `LIVE_BEWEZEN`;
- four original reusable failure fingerprints were registered in `brain_failure_registry` with maturity `PROVEN`;
- `learning:canonical-learning-writeback-idempotency-v1` records the idempotent re-borging behavior;
- `canonical-learning-writeback-repeat-is-idempotent-v1` is registered as a proven prevention rule.

The authoritative machine-readable learning remains Supabase `brain_records` / `brain_failure_registry`; this document is the human-readable repository companion.
