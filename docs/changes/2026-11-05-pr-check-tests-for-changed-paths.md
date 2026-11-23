# Tests that read changed files run before merge — 2026-11-05

## Problem
PR #5447 changed an SEO page; the test that reads it ran only in the post-merge backend lane, so main went red until #5451.

## Change
- `scripts/ci/select-tests-for-changed-paths.mjs`: from the PR's exact base and head, selects existing tests whose text references a changed repo path (plus changed test files), runs them, and re-runs failures on the base commit in a temporary worktree.
- `required-test.yml`: new step "Run tests that read changed files before merge".
- Governance paths (AGENTS, skills, docs, learning, workflows, lock) select nothing; they have their own gates. More than 40 selected tests fails visibly instead of silently dropping.

## Behaviour proof
A simulated page regression is blocked. A replay on current main finds `tests/seo-estate-policy-v3.test.mjs` already red on its base (`classifyCanonical` returns a support entry where the test expects null for a commercial candidate); it is reported as `KNOWN_RED_ON_BASE`, not hidden and not blocking.

## Open
`seo-estate-policy-v3` needs an owner decision: stale test or regressed policy. It is not fixed here.

## Independent gates
Protected Required, CodeQL, original BRAIN, terminal closure. Proves no ranking or customer outcome.
