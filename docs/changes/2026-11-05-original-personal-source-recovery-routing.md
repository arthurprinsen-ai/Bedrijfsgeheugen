# 2026-11-05 — Correct autonomous recovery for unverified personal LinkedIn source

Canonical parent: [ONE BRAIN original content incident #5232](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232).

## Real production observation
At 2026-11-05 06:37 UTC the canonical `content_publication_obligations` row for `linkedin_personal` was `BLOCKED` with `PERSONAL_SOURCE_UNVERIFIED`, no external provider ID and no independent provider proof. The original scheduled content-loop was active and the daily overall state was DEGRADED. Its recovery metadata incorrectly requested `EXACT_PROVIDER_PUBLICATION_PROOF_MISSING` and a provider-side reconciliation, rather than repair of the genuine **pre-create personal source truth** failure.

An earlier day with `PUBLISHED` plus an immutable provider ID is deliberately different: that row must be reconciled read-only without a second create. Never conflate these two cases.

## Exact original-owner correction
- Existing pure `daily-publication-recovery.mjs`: classify `PERSONAL_SOURCE_UNVERIFIED` as `PERSONAL_SOURCE_PROOF_REQUIRED`, with original source-agent handoff `VERIFY_ORIGINAL_FOUNDER_SOURCE_THEN_REGENERATE` before any provider call. Preserve higher-precedence global duplicate and active provider-billing conditions where applicable.
- Existing preventive classifier routes the same failure to `SOURCE_EDITORIAL_REVISION_REQUIRED` before the deadline, not a generic provider-readback repair.
- Existing ONE BRAIN incident planner asserts `require_new_verified_source_before_regeneration=true` for this failure, while independent factual verification remains essential. A source cannot be invented by an agent. Do not auto-approve founder personal facts.
- No cron, sender, queue, tenant authority, OAuth grant, external side effect, permission or quality threshold is added or bypassed.
- Original `tests/brain-daily-publication-no-silent-gap-20261031.test.mjs` now tests the actual previous error, source-handoff, early warning, immutable ACK-only reconciliation and BRAIN prevention recording.

## Release and evidence boundary
This commit is **candidate source**, not a claim of live publication or resolution. Required, CodeQL and full original BRAIN must be green on the exact PR head; use the existing protected merge and Supabase Edge owner, independently verify deployed function version and the original next natural scheduler result. Show evidence of `PERSONAL_SOURCE_PROOF_REQUIRED` on an unsent unverified-source event, or real verified personal-source recovery. Do **not** mark today's LinkedIn post as published until external provider ID and independently authorized exact-author/content readback exist.

No false GREEN, provider impersonation, alternative LinkedIn author, duplicate social send, Make/Buffer fallback, parallel scheduler or bypass.
