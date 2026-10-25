# Repository Merge Capability Guard (agent skill)

Applies to all agents, deployment workflows, release automation, GitHub API mutations, and skills operating on this repository.

## Hard capability gate (before any ruleset or merge-queue mutation)

1. Read the current repository metadata via GitHub API; specifically owner.type, visibility, default_branch and plan/feature eligibility where available. Do not infer eligibility solely from an HTTP error.
2. If owner.type == User, mark native merge queue UNSUPPORTED. NEVER send a ruleset payload containing the `merge_queue` rule. Select protected-PR merging instead.
3. If owner.type == Organization, validate GitHub's CURRENT documented merge queue eligibility (public organization repositories, or qualifying Enterprise Cloud private repositories), plus relevant API support, before attempting to enable it. Do not change repo ownership automatically.
4. A 422 Invalid rule 'merge_queue' is a capability/configuration failure, NOT a failing CI test: stop retrying identical requests, record API status and redacted response, notify integration owner, and switch to supported protected-PR mode. No blanket green status.
5. Re-check this gate on owner, visibility or plan changes and whenever relevant GitHub documentation changes.

## Supported release protocol for user-owned repository

- Keep `main` protected: pull requests only, required status checks, strict up-to-date requirement where compatible, and no administrative bypass.
- Establish one integration owner per release and one serialized writer for shared generated artifacts (including System Map). Do not allow concurrent PRs to overwrite these artifacts independently.
- Synchronize the candidate branch with the latest `main`; resolve conflicts rather than force-pushing shared work.
- Regenerate System Map from the EXACT final integrated tree, check it into the candidate PR, and validate deterministic output. Reject incomplete or stale map writeback.
- Discover required check contexts from *actual* check runs and repository rules. Keep expected contexts/source app IDs identical. Run Required, BRAIN, CodeQL and other configured mandatory checks for the latest candidate head SHA; do not mark a pending/skipped/missing check as passed.
- Immediately before merging, reread current base SHA, PR head SHA, approvals, required check conclusions, and mergeability. If base changed, resynchronize and rerun validations. Only merge via GitHub's protected PR endpoint with all protections enforced.
- After merge, independently verify the merged SHA on `main`, the deployment provider's production deploy for that SHA, and production health/readback. CI success alone is NOT proof of production release.
- Publish an audit event for each phase: owner, repo, base SHA, head SHA, System Map SHA, check names/results, merge commit, deploy ID, production URL/readback, time, and reason on failure. Never log credentials.
- On an unsupported API operation, fail closed for the unsafe action while continuing safe read-only diagnosis, supported repairs, and reporting. Never disable controls or fabricate evidence to turn indicators green.

## Automated regression guard

In CI, add/maintain a test that rejects a `merge_queue` rule whenever repository owner.type is `User`; mocks a 422 capability response and asserts zero retries of the same payload; asserts fallback to protected PR; checks that the release cannot report green until mandatory checks, production deploy and independent readback all pass.

## Migration decision

A transfer to an organization is an explicit, separately approved infrastructure change after verifying permissions, Netlify/GitHub app installation, webhooks, environments, deployment keys, secrets, branch rules, URLs and rollback path. Do not treat repository transfer as a routine incident fix.

Source: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue
