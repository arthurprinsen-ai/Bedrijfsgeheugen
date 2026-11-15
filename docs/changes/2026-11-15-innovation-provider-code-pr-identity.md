# Original innovation protected-code PR identity — 15 November 2026

## Independently observed repeated starvation after release
The protected repair https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5904 merged into main `ddee52ca5d0064187000844b41620c6d53c07183` and Netlify published the same commit. The first original code recovery https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43753665119 completed green but `--prepare` returned `selected:false / NO_NEW_SOURCE_BOUND_SAFE_CODE_CANDIDATE`. Independently queried native original records: all 14 original innovation obligations OPEN, all 14 native intake operations PLANNED, **zero** original no-change reviews and **zero** original source-code PR receipts.

## Root cause
`existingPrFor` called GitHub `gh pr list --state all --search <candidate UUID>` then treated **any** body containing the UUID as a prior code delivery. The incident/recovery PR #5904 itself mentions original innovation candidate `7ae7a817-5900-41df-bf7c-d127e8336b13` in plain diagnostic prose. GitHub search therefore returned a match even though this PR did not implement that candidate, so the original owner was not invoked and the new nonterminal CAS receipt could never be written.

## Same-authority correction
Continue to query the real GitHub provider from the **existing** daily workflow. Match only original protected implementation PR bodies with exact, unique structured fields: `Candidate-Type: implementation`, `Original-Candidate`, `Original-Operation`, `Original-Source-Revision`, `Original-Source-SHA256`. Require PR base `main` and an OPEN or MERGED provider state. An incidental mention or CLOSED unmerged PR is not an implementation. The existing original ONE BRAIN CAS, code source guard, Required/CodeQL, Netlify readback and effects remain unchanged. This is neither a new publisher nor a new execution queue.

The regression `tests/brain-innovation-pr-identity-20261115.test.mjs` replays the actual incidental UUID case, a correctly source-bound implementation PR, stale revision, wrong source SHA, duplicate metadata, closed unmerged PR and CRLF formatting.

## Acceptance
Protected PR Required/CodeQL green; exact main merge and Netlify production readback; one scoped replay of the existing `original_code_recovery` must **select the original work** unless an independently verifiable source-bound implementation or same-source native nonterminal review already exists. Subsequent native readback must explicitly distinguish nonterminal no-change from protected implemented code. Nothing is marked delivered or financially realized on the basis of a PR narrative or green schedule.

Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
