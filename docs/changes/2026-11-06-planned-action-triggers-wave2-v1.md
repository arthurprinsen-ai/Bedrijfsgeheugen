# Planned-action triggers, second wave — 2026-11-06

## Problem
The planned-action guard (#5493, connected in #5496) only blocks a rule that has a trigger and a PROVEN lesson. 76 of 110 active rules had no trigger; 21 of those had no lesson either, among them `VERIFY_GITHUB_PR_HEAD_EXISTS_BEFORE_CREATE` and `SINGLE_CANONICAL_REMEDIATION_OWNER_PER_ROOT_CAUSE`, the rules that would have stopped the duplicate pull requests of 6 November.

## Change
- `config/planned-action-triggers.json`: 17 triggers appended (rules listed below). Phrase-level words instead of fragments such as `pr` or `ack`, which match inside ordinary words.
- `docs/brain/delivery-failure-lessons.json`: two PROVEN lessons appended for the two rules above. No existing lesson, rule or trigger edited.
- `tests/brain-planned-action-triggers-wave2-20261106.test.mjs` in the required PR check: each trigger must fire on its own planned action through the real guard and be unblocked by acknowledgement, 11 neutral actions must fire none of them.

## Triggers added
- `RECOVER_DUE_SOCIAL_ZERO_CANDIDATES_FROM_RELEASE_STATE`
- `REQUIRE_EXACT_DEPLOY_IDENTITY_BEFORE_PRODUCTION_GREEN`
- `RECONCILE_MAIN_TO_EXACT_PRODUCTION_SHA`
- `CLASSIFY_PRIVATE_AUTH_BEFORE_PUBLIC_SEO_SCANS`
- `RECONCILE_CLOSED_FORCE_PUSHED_PR_AGAINST_CURRENT_MAIN`
- `REQUIRE_PERSISTENT_EVIDENCE_BEFORE_GREEN`
- `REVERIFY_PR_IDENTITY_AFTER_READY_RECREATION`
- `CLASSIFY_AND_EXECUTE_CHANGED_TEST_PATHS`
- `NETLIFY_DEPLOY_AUTHORITY_MUST_BE_VISIBLE`
- `REFRESH_MAIN_IMMEDIATELY_BEFORE_PRODUCTION_PERSISTENCE`
- `REPREPARE_I18N_PATCH_FROM_FINAL_PUBLIC_TEXT_AFTER_ANY_TEXT_CHANGE`
- `REQUIRE_EXECUTION_PROOF_AFTER_HTTP_ACK`
- `REQUIRE_OUTCOME_EVIDENCE_BEFORE_GREEN`
- `TESTS_ASSERT_OUTCOMES_NOT_LITERAL_COPY`
- `TREAT_NETLIFY_NEUTRAL_AND_PREVIEW_RACE_AS_NON_BLOCKING_AFTER_PROOF`
- `VERIFY_GITHUB_PR_HEAD_EXISTS_BEFORE_CREATE`
- `SINGLE_CANONICAL_REMEDIATION_OWNER_PER_ROOT_CAUSE`

## Not changed
The other 38 rules with a lesson and the 19 rules without a lesson stay without a trigger. No trigger was added for a rule without a PROVEN lesson, because the guard skips those.

## Known limit
Recall is not measured: the examples are written by hand and commit titles are a weak stand-in for the free text of a planned action. A trigger blocks until the agent names the rule, so a too-broad trigger would also block unrelated agents; precision was checked on 300 commit titles and 11 neutral actions only.

## Independent gates
Protected Required, CodeQL, original BRAIN and terminal closure.
