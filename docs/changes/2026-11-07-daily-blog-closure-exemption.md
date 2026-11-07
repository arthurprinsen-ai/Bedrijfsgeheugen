# Daily blog English cache patch is a runtime closure path — 2026-11-07

## Problem
PR #5517 (daily blog 2026-11-07) failed `hygiene / admission` with `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE: activity_ledger,brain_learning,human_documentation`, so the required check `test` stayed red.

## Cause
The daily blog workflow stages `config/bg-static-i18n-en.d/powerhouse-blog-<date>.json` next to the article, index, feed and sitemap. The policy only exempted `blog/` and `sitemap.xml`, so the patch counted as a material change that needed Brain learning, ledger and documentation files. The workflow deliberately keeps those out of public PRs.

## Change
- `config/powerhouse-integration-bundle-v1.json`: `runtimeClosurePathPrefixes` gains `config/bg-static-i18n-en.d/powerhouse-blog-`.
- `tests/brain-daily-blog-closure-exemption-20261107.test.mjs`: reads the `git add` paths and the patch path from the workflow and requires every one to be covered; the exemption does not cover other config files, other i18n patches or other obligations.
- Required-test step for that test; one lesson and one active rule; closure bundle.

## Not changed
Admission logic, the compiler, the workflow and every other gate. No test weakened.

## Known limit
Not proven on a real daily run yet; that happens when the next scheduled blog candidate passes admission without hand-added files.

## Independent gates
Protected Required, CodeQL, original BRAIN lane and the next daily blog run.

## Follow-up the same day: planned-action trigger
The first merge (#5518) turned the BRAIN backend lane on main red: the wave3 test requires a planned-action trigger for every active rule with a PROVEN lesson, and the new rule had none. `config/planned-action-triggers.json` now has a trigger for `DAILY_BLOG_WORKFLOW_PATHS_MUST_BE_RUNTIME_CLOSURE_PATHS`, and the closure test checks that it fires and that everyday blog wording does not. The full planned-action test set was run locally before this change; the pull request lane alone had not caught it.
