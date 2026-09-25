# Targeted-route regression helper import

Date: 2026-09-25

A concurrent addition to `tests/targeted-website-route-regression.test.mjs` referenced the exported helper `isHardAssetFailure` without importing it. Required run `36173570951` therefore failed in `website / baseline` with `ReferenceError: isHardAssetFailure is not defined`.

The repair is deliberately minimal: import the existing helper. The production/browser implementation is unchanged.

This supersedes the post-merge closure defect discovered after PR #3098 and remains part of obligation `governance-production-trigger-ownership-v1`.


## Canonical replay repair
The first merged learning referenced the general targeted-route regression directly from `historical_replay`. Skill Projection requires an accepted Brain-prefixed replay path. The same invariant is now replayed by `tests/brain-targeted-route-regression-helper-import-v1.test.mjs`, and the machine learning points to that canonical test.
