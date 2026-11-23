# Correct original innovation engineering PR duplicate recognition — 15 November 2026

## Actual native production failure

After protected PR #5904 added nonterminal no-change review and was deployed on main, the existing bounded `original_code_recovery` was invoked as https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43753665119. All source/guard tests passed but the original selector returned `selected=false, reason=NO_NEW_SOURCE_BOUND_SAFE_CODE_CANDIDATE`. No code author ran and no original operation was updated. All 14 `INNOVATION_DELIVERY` remained OPEN; no false green.

The cause was the original code path `existingPrFor`: `gh pr list --state all --search <UUID>` then `pr.body.includes(UUID)`. Recovery PR https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5904 documented the same legitimate source candidate `7ae7a817-5900-41df-bf7c-d127e8336b13`; a **mention** was incorrectly counted as a built code candidate. This is a false duplicate and a starvation bug.

## Exact original writer proof

Retain the same original `Powerhouse Daily Self Evolution`, same original project ONE BRAIN, same source-bound candidate IDs and existing GitHub protected delivery. The only recognized duplicate now has all of:

- original writer branch `writer/innovation-<first 8 chars of UUID>-<numeric GitHub run>`;
- exact `Candidate-Type: implementation` and `Original-Candidate: <UUID>` PR body lines;
- exact `Original-Source-SHA256` and `Original-Source-Revision`;
- original operation marker and `Writer-Lease-Owner: agent:agent-integration-engineer`.

A repair PR, code comment, issue link, source revision mismatch, fake branch or unrelated PR is not a candidate duplicate. The prior native original `brain_operations.evidence.original_code_candidate_pr` still prevents duplicate writes after true successful provider readback; the native no-change review still prevents redundant spent model calls after exact original CAS/readback. The original operation remains `PLANNED` and original obligation `OPEN` until actual protected source implementation, verified consumer and measured effect.

## Regression and mid-development incident

The original `tests/brain-innovation-original-code-delivery-20261115.test.mjs` now replays positive valid writer PR and negative recovery, wrong source, false branch and plain body UUID cases. It asserts original source sha/revision are handed into the GitHub search function.

During editing, a preliminary local branch write used JavaScript `String.replace` replacement text containing `$'` and unintentionally truncated the new function; this was detected **before PR/CI**, replaced with a clean original-main source-based patch using callback replacement, and re-read from the actual new branch. No bad intermediate code was merged; this editing failure is retained here so future agents avoid bare `$'` substitution in patch templates. Protected Required/CodeQL/branch-review must still pass before merge.

P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
