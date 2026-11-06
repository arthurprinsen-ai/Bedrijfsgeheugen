# Planned-action recall: real evidence, no false green (6 November 2026)

## Ownership and baseline

Issue [#5510](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5510). PR #5506 implemented 41 triggers and PR #5511 narrowed seven noisy trigger pairs. Those changes are independently live, but they **do not** establish recall or prevention effectiveness. Source audit of the original BRAIN records found no time-windowed, separately labelled real-agent plan/guard/outcome corpus. The canonical baseline is `NOT_MEASURED` in `brain_records` record `planned-action-recall:issue5510:20261106:baseline-v1`.

## Existing-authority-only evidence contract

The pure module `brain/observability/planned-action-recall.mjs` accepts **actual free-text planned actions** only to construct an HMAC-SHA256 digest, using a server-side key of at least 32 characters; no free text, token, key, email, or prompt is persisted. It creates an append-only `Evidence/evidence` BRAIN record with the real originating agent, execution identity, source GitHub ref, timestamp and the unchanged canonical guard's matched and blocked rule IDs. The observer never declares execution or verification. Persist through `createSupabaseRecordAdapter(...).appendRecord` and the existing `brain_append_record` RPC, or the original authenticated BRAIN authority—**never** an alternative store, webhook, scheduler, browser public endpoint, or service-role secret in chat.

A second append-only `Verification/verification` record with contract `PLANNED_ACTION_INDEPENDENT_REVIEW_V1` must be created by a different authenticated reviewer, linked by `decisionRecordId`, with `independent=true`, `verified=true`, independently justified `expectedRuleIds`, and a review `evidenceRef`. Merely copying the guard's matched IDs, acknowledging rules, or passing a unit test is **not** an independent label. The original authority's role/access controls must enforce that this attestation cannot be forged by the originating agent. **The evaluator refuses self-declared verified/independent flags on their own**: a caller-side, independently authenticated `verifyIndependentReview(review,decision)` callback must additionally return exactly `true` after provider/identity readback. If absent, an exception occurs, or attestation fails, the item is excluded and measured rates remain null.

## Evaluation gate

`evaluateCanonicalBrainRecall(existingAdapter,{tenantId,from,to})` reads the original `brain_records`. It excludes unmatched, conflicting, unverifiable, wrong-tenant and single-agent self-reviewed records. An authenticated independent reviewer-verification callback is mandatory for any record to count. Default floors: >=30 independently reviewed actions from >=2 originating agents, >=10 confirmed positive and >=10 confirmed safe negative actions.

- **Recall** = true-positive rule matches / all independently expected rule matches.
- **Precision** = true-positive rule matches / all observed rule matches in the independently labeled holdout.
- **False-block rate** = otherwise-safe independently reviewed actions wrongly blocked / all reviewed safe actions.
- Empty denominators return `null`. Under-sampled outcomes return `INSUFFICIENT_EVIDENCE` with null public percentages. Empty or absent genuinely labelled records return `NOT_MEASURED`.
- The module never concludes that actual incidents were prevented. That separately requires outcome-linked, independently verified prevented-failure evidence.

## Critical remaining work

This change supplies the canonical schema, adapter entry point, statistics and regressions. It **does not** silently activate plan capture in all agents, provision an authenticated recorder, claim any new production observations, or self-label records. The existing agent runtime owner must wire its original preflight invocation to `buildPlannedActionEvidence` + `appendPlannedActionEvidence` with a server-side HMAC key and its already-authorized BRAIN adapter, without bypassing the guard. Independent reviewers must create verified review records after inspecting source and risk. Until real corpus and readback are present, keep issue #5510 OPEN and status `NOT_MEASURED`. The unrelated Monday weekly-jobs audit remains unchanged.

## Release contract

Protected Required + CodeQL + original BRAIN + protected merge + exact main/source readback + canonical terminal evidence. No second guard, release bypass, invented incident, standalone database, parallel cron or optimistic GREEN.
