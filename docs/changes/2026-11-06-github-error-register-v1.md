# GitHub error lessons moved into the delivery preflight — 2026-11-06

## Problem
Known GitHub, CI and credential errors lived in chat history and prose. The delivery preflight only applies rules that exist as PROVEN lessons in `docs/brain/delivery-failure-lessons.json` with an active rule in `config/delivery-prevention-rules.json`, so agents could repeat them.

## Change
- `docs/brain/delivery-failure-lessons.json`: 15 lessons added (stage, root cause, fix, rule).
- `config/delivery-prevention-rules.json`: 14 active rules added; one lesson reuses `CONSOLIDATE_PARALLEL_IDENTICAL_CANDIDATES`.
- `tests/brain-github-error-register-20261106.test.mjs`: runs in the required PR check; fails on a missing rule, a duplicate fingerprint, a lost lesson, or a credential-like string.
- `AGENTS.md` and two skills point to the lessons.

## Rules added
- `GITHUB_WORKFLOW_WRITE_NEEDS_CONTENTS_AND_WORKFLOWS_PERMISSION` — governance: writing a file under .github/workflows returned 403 although a Workflows permission was granted
- `NEVER_PASTE_OR_REPEAT_TOKENS_IN_CHAT` — governance: personal access tokens were pasted into chats and then used in shell commands on three occasions in August 2026
- `NEVER_SWALLOW_AUTH_ERRORS_AND_ALERT_BEFORE_TOKEN_EXPIRY` — pipeline: the weekblog trigger returned 401 for days while the scenario dashboard showed zero errors
- `READ_VIA_RAW_VERIFY_VIA_AUTHENTICATED_CONTENTS_API` — verification: unauthenticated GitHub API calls returned 403 after about 60 requests per hour and raw.githubusercontent.com served stale content after a commit
- `UPDATE_BRANCH_AND_WAIT_FOR_CHECK_BEFORE_MERGE_RETRY` — merge: merge returned 405 required status check is expected although the check on the branch was green
- `VERIFY_AUTO_MERGE_ENABLED_BEFORE_RELYING_ON_IT` — merge: enabling auto-merge through GraphQL returned FORBIDDEN
- `USE_GIT_DATA_API_OR_MULTI_FILE_COMMIT_ON_CONTENDED_REPO` — writeback: contents API writes failed repeatedly with 409 conflicts
- `USE_FLAT_BRANCH_NAMES_AFTER_CHECKING_EXISTING_REFS` — pr: creating a branch named koppelingen/api returned 422
- `CONSOLIDATE_PARALLEL_IDENTICAL_CANDIDATES` — pr: a branch and pull request #988 already existed a minute before the agent committed, producing a duplicate commit
- `QUERY_CHECK_RUNS_BY_FULL_HEAD_SHA` — verification: check-run lookups by branch name returned nothing or the wrong runs
- `RETRIGGER_REQUIRED_CHECK_AFTER_PR_BODY_CHANGE` — pipeline: the Required workflow stayed red after the pull request body was corrected
- `REGISTER_NEW_TESTS_AND_PATHS_IN_LANE_CONFIG` — pipeline: a new test file never ran in CI and a new file in an unlisted folder turned every delivery check red with unclassified delivery path
- `USE_EXACT_GIT_BRANCH_NAME_FOR_SUPABASE_PREVIEW` — integration: creating a Supabase preview branch failed with GitHub branch not found
- `NO_PR_OR_CHECK_CLAIMS_WITHOUT_AUTHENTICATED_READ` — handoff: a session with only anonymous read access reported on open pull requests and failing checks it could not see
- `INSTALL_CHROMIUM_ONLY_VIA_SHARED_CI_SCRIPT` — pipeline: checks went red with Hash Sum mismatch although no code had changed

## Not changed
No existing lesson or rule was edited or removed, no workflow other than one added step in `required-test.yml`, no secret, no runtime or schema change.

## Known limit
Rules marked `agent-contract` are applied by the preflight and read by agents but no check blocks the action itself. Enforced by their own guard: new tests and paths, Chromium install. A guard that matches a planned action against these rules is still to be designed.

## Independent gates
Protected Required, CodeQL, original BRAIN and terminal closure. Proves no runtime, revenue or customer outcome.
