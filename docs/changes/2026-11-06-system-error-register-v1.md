# System error lessons moved into the delivery preflight — 2026-11-06

## Problem
Known errors in Supabase, Netlify, Composio, Buffer, Windsor, GA4, Search Console, DataForSEO, Tavily and the heartbeat loops lived in Notion prose. The delivery preflight only applies rules that exist as PROVEN lessons in `docs/brain/delivery-failure-lessons.json` with an active rule in `config/delivery-prevention-rules.json`, so agents could repeat them.

## Change
- `docs/brain/delivery-failure-lessons.json`: 19 lessons added (stage, root cause, fix, rule).
- `config/delivery-prevention-rules.json`: 19 active rules added, all `agent-contract`; no existing rule edited.
- `tests/brain-system-error-register-20261106.test.mjs`: runs in the required PR check; fails on a missing rule, duplicate fingerprint, lost lesson or credential-like string.
- Follow-up of PR 5490 (GitHub lessons); same format, additive, no shared file edited except the two JSON lists and the workflow step.

## Rules added
- `MIGRATION_AND_LOCK_IN_SAME_CHANGE_WITH_PROVIDER_READBACK` — writeback: A Supabase migration applied outside Git made repository and provider diverge
- `NEVER_SET_APPROVED_AT_DIRECTLY_USE_PUBLICATION_STATE_FUNCTION` — governance: A blog stayed GENERATED without any error
- `DURABLE_REJECT_VIA_EVIDENCE_VETO` — pipeline: Withdrawing a blog did not hold
- `STATUS_LADDER_NEVER_CLAIM_ABOVE_EVIDENCE` — verification: A SQL stage was counted as an agent action
- `PROPOSE_BEFORE_IRREVERSIBLE_DATA_WRITE` — governance: Row cleanup in production data cannot be undone
- `CHECK_NETLIFY_FUNCTION_ENV_KEYS_BEFORE_ADDING_SECRETS` — pipeline: Control Plane saw no Supabase URL
- `DEPLOY_READY_IS_ONE_LINK_NOT_OUTCOME` — verification: A READY deploy was read as proof of the outcome
- `COMPOSIO_ACTIVE_STATUS_NOT_PROOF_READBACK_BEFORE_PUBLISH` — integration: A LinkedIn connection was ACTIVE but the backend could not publish
- `COMPOSIO_USE_SERVER_PROJECT_CONNECTED_ACCOUNT_ID` — integration: A Gmail call failed with no connection in the server project on 30 September
- `RECORD_ACCOUNT_ID_AND_USERNAME_WITH_EVERY_MEASUREMENT` — verification: The wrong Instagram account was measured
- `RESPECT_RETRY_AFTER_NO_FALLBACK_PUBLISHING_ROUTE` — pipeline: Buffer returned 429 with a retry-after of about three days on 29 October and again on 6 November
- `OK_WITH_FALLBACK_IS_NOT_A_FRESH_MEASUREMENT` — verification: Windsor sync said ok but the data was old
- `EMPTY_PROVIDER_REPORT_IS_NOT_SUCCESS` — verification: The GA4 sync reported ok but wrote zero measurements (six syncs on 31 October)
- `HEALTH_CHECK_MUST_MATCH_JOB_CADENCE` — verification: bg-gsc-sync and bg-zoekwoordkansen showed VEROUDERD after 74 hours
- `DATAFORSEO_ONLY_40101_40102_ARE_EMPTY` — verification: DataForSEO task 40101 or 40102 was read as an error
- `PROVIDER_ERROR_NEVER_WRITTEN_AS_EMPTY_RESULT` — pipeline: Twelve companies were wrongly rejected as having no own website
- `EVERY_LOOP_NEEDS_OWNER_AND_STARTER` — pipeline: Instagram published nothing since 3 October with MEDIA_ASSET_REQUIRED
- `CHECK_EXTERNAL_EFFECT_BEFORE_REPUBLISH` — outcome: The personal LinkedIn post of 6 November was not published
- `KEEP_ENTRY_PAGES_READABLE_AND_CORRECT_OLD_STATUS` — handoff: The START HIER page could not be read in one go

## Planned-action guard
- `scripts/brain/planned-action-guard.mjs` plus `config/planned-action-triggers.json`: an agent passes the action it is about to take (`--action "..."`); every matching active rule with a PROVEN lesson is shown with root cause and fix and the command exits 1 until the rule is named in `--ack`. Unknown acknowledgements are an error.
- `tests/brain-planned-action-guard-20261106.test.mjs` in the required check: every trigger points at an active rule with a PROVEN lesson, known failure plans are caught, unrelated actions pass, CLI exit codes.
- Why it is needed: `createPreflightDecision` in `tools/delivery-learning.mjs` only applies lessons whose stage is COMMIT, PR, MERGE or PIPELINE by default. Lessons with other stages (VERIFICATION, WRITEBACK, GOVERNANCE, INTEGRATION, HANDOFF, OUTCOME) are in the file but not surfaced by that default. The guard matches on the planned action instead of the stage.

## Known limits
- Acknowledging a rule is a declaration by the agent, not proof that the plan follows the fix. The guard forces the lesson into view; it does not verify behaviour.
- The guard is not yet called automatically by the preflight or the agent contract; wiring it into AGENTS.md waits for PR 5490 to avoid the delivery-control-plane conflict contract.
- Search Console and keyword-opportunity root causes are still unknown.
