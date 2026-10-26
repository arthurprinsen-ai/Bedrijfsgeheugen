# System Map single-writer merge integrity — implementation record

## Incident and cause
PR #4934 adds a guard against missing or non-deterministic System Map regeneration. Required admission surfaced missing structured PR metadata and an unclassified test path; after both fixes, required closure identified absent learning, activity ledger and human documentation. These are compliance and integration failures, not evidence of a completed release.

## Resolution design
Reuse the existing integration owner and `scripts/brain/portal-explanation-inventory.mjs` as an inventory-regeneration candidate; validate its suitability before connecting the guard. Require clean generation from the exact integrated tree, deterministic output, same-SHA Required/BRAIN/CodeQL and protected merge. Do not create competing writes or bypass rulesets.

## Evidence and limits
Required: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40223051109 (failed on closure); CodeQL: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40223051122 (succeeded on prior head). Neither verifies a release for any successor SHA. Production readback remains outstanding.


## Local cause-directed recovery — 26 October 2026

This is a local, uncommitted recovery candidate for the existing obligation, not production evidence. The old PR head is `0fdda5a23e2b7b0fe0925dc2c6061bb440410ec4`; integrated observed main was `76afbb94f6526ed0ccccebd35ab27ccbba604f2c`. Subsequent main movement must be reconciled before publishing.

The three-way merge preserves both AGENTS sections and all main changes. The Required workflow merges cleanly. Generated System Map inventories and hash are regenerated from the combined tree; no conflict markers remain. Automation's four stale terminal-closure oracles now exercise canonical non-runtime classification and retired-migration adoption checks; the WIP assertion recognizes the existing cap of one. No workflow/security policy is weakened.

Backend source-only repair changes 98 literal references in 84 test modules from missing executable migration files to the existing immutable repository-only archive. SQL bytes and original assertions are unchanged. The tenant-identity/RLS suite now passes. No executable migration is restored, moved, or applied.

Observed local validation: Automation **325/325 pass**; full Backend **4212 pass / 280 fail / 4492 total**; integration/freshness/tenant checks **11/11 pass**. The old hosted Backend run had 4265 tests; its 378 failures are not directly comparable to this newer integrated tree. Remaining failures include stale workflow/source oracles, missing canonical migration references, stale migration-history evidence, and expired model-catalog source verification. They remain release-blocking.

Read-only production provider observation found PostgreSQL 17.6, 755 applied migration identities, and existing `writer_control.acquire/verify/release` functions. No lease has yet been acquired by this candidate; no external code-write, protected merge, deploy, or independent release readback has occurred. Original GitHub run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40319645570

## Backend continuation after PR #4942

The integrated release still has271 full-BRAIN Backend failures. This candidate corrects three demonstrated causes: duplicate Janitor branch writers and map-write races; swallowed public language navigation; and a stale migration snapshot with missing already-applied source mirrors. Existing workflows and provider evidence remain authoritative. Backend failures remain visible; this is not a release waiver. All mandatory checks must run on the resulting published SHA before protected release and independent readback.

## GitHub Actions phase2 — source-backed contract recovery

Parent40144e48: CodeQL, PostgreSQL17, preflight, Netlify build, Supabase source contract and provider preview pass. Full BRAIN40337302217 remains failed in Backend. No passing Required subset is treated as full BRAIN proof. Correct test oracles for actual build phases, stronger contact-review/typed-JSONB guards, provider identity and atomic claim boundaries. Keep the retired duplicate sender read-only. Add complete redacted failure metadata and bounded machine-readable annotations to the existing failed-lane producer, because the log connector rejects the oversized raw log. Full artifacts remain intact; annotation truncation is explicit, never a success or release waiver. All mandatory checks must rerun on the new SHA; no production claim.
