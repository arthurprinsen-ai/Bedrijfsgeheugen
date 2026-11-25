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


## Work execution and terminal proof recovery — 26 October 2026

Fresh isolated checkout of published PR #4967 head `d2b4036101df83d9d318202a53bc9aeac6f2f574` works. Git/Node/Python execute; the earlier sandbox failure is not reproduced. Preserve the older dirty checkout. Complete hosted Backend artifact for parent `40144e48` reports 257 failures (run 40337302217), not a full green suite. Local exploration also reproduces expired catalog evidence; no timestamps, freshness thresholds or supplier claims are changed.

Recover the prepared terminal-authority correction in the same obligation: both existing workflows require full successful exact-candidate Unified BRAIN; Foundation/descendant substitution is removed. Independently compare provider ACTIVE state, version and runtime hash with PR-declared expectations. Reject executable SQL in history-only recovery, and carry migration readback into mixed Netlify/Supabase evidence. No new workflow, writer or scheduler.

Verification: new terminal authority regression first fails because the required verifier export is absent; after integration all 5 behavior tests pass without skips. Both workflow YAML files and all 16 shell blocks parse; System Map source check passes. Legacy tests must follow the stricter exact-candidate rule while retaining provider/security assertions. Full Backend, exact resulting-SHA remote gates, protected merge and production readback remain unproven. An interrupted exploratory in-process suite is not release evidence.

Additional verification: 31/31 related terminal/provider regressions and 325/325 Automation tests pass with zero skipped tests. Full Backend remains unresolved; none of these subsets replaces full BRAIN.


## Execution recovery and bounded transport retry — 26 October 2026

Local shell, Git checkout and dependency installation executed successfully. The full exact-parent Backend run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40339416392 reports 228 failures with complete non-truncated failure evidence (artifact 12658824886). These are not reported as resolved. Required run 40339416328 independently exposed a Netlify preview `net::ERR_CONNECTION_RESET` on `/ai-act`; the verifier only retried TimeoutError. Two new regression cases failed before the fix. The same navigation budget now also retries that exact connection-reset error, preserving immediate rejection of certificate/application failures and terminal rejection after exhaustion. Existing content, canonical identity, hard-asset and page-error gates remain unchanged. The AI ecosystem test checks current protected-main proposition text rather than retired copy. No catalog timestamp is refreshed without source proof. No protected merge, production deploy or full-green claim.

Focused local verification: 17/17 route/copy regressions and 6/6 relationship regressions pass. The relationship test now reads canonical migration `20260928104333` (Git blob `c290810df7eca707114409cec5fa31baf7254288`); SQL was neither changed nor executed. Its vendor assertion now checks the Dutch optional-vendor wording plus the explicit prohibition on vendor canonical authority. Independent review found no critical/important issue in the retry implementation. Full Backend success remains unproven; the parent run had 228 failures.


## Fenced integration of terminal proof and browser recovery — 26 October 2026

Preserve published parent `9f3c98a6eeeb8c06916033b65862031d5d0d0a12` and integrate local terminal repair `933556cb` in the same PR #4967. Actual existing database writer lease generation 7 binds holder `chatgpt-work/5f24025a7c01` to that exact parent and main epoch `a34505e1`. Combined targeted regressions: 54/54 and 8/8 passed, no skips. System Map regenerated twice with identical SHA256 `aaf0799915749ef66c1c64aba12848424c80926507dcb1277932753ce2f15109`. Terminal claims require successful full BRAIN on the exact candidate; PR declarations require independently fetched provider metadata; mixed Netlify/SQL evidence cannot discard migration proof. Blog cache and buffer-alias oracles retain strict cache, pagination and supersession assertions. These results are partial local evidence only: full Backend, remote exact-SHA Required/BRAIN/CodeQL, protected merge and independent production readback remain pending.

Independent review found and repaired an integration defect before publication: the canonical dispatcher executes from protected main while testing `inputs.head_sha`. The terminal gate now selects the exact candidate-bound main-dispatch title and separately proves the workflow source is an ancestor of protected main via GitHub compare merge-base. Wrong candidate, wrong event/branch, untrusted source, failed/skipped/pending runs fail closed. New executable shell regressions failed before this repair, then passed. Validation lease renewed through the existing functions as generation 8. After final 62/62 regressions, publication uses a newly acquired generation 9 bound to the unchanged remote parent; no second writer or scheduler.


## Canonical gate prerequisite oracle recovery — 26 October 2026

Exact candidate `7fe21a0b` reached existing Repository Writer Gate Dispatch run 40346876089. Its shared-memory gate failed because the regulatory writer test expected one allowed pattern while canonical policy already requires four additional closure-evidence patterns; V18 failed because its oracle expected a retired direct Netlify command rather than the canonical entry containing the unchanged pinned V18 phase. Reproduced both failures locally before correction. The corrected tests retain negative SQL/runtime/cross-domain checks and all historical V18 pin/hash/navigation assertions. No production policy changed. Full local shared-memory/writer contracts: 35/35; V18/Portal: 70/70; no skipped tests. Independent review found no critical/important issue. Existing writer lease generation 10 binds publication to parent `7fe21a0b64485d9b928a865629474d9dbe3b52e3`. Full BRAIN and protected production acceptance remain pending.
