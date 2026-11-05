# Changed-path tests in the PR check — development ledger

- 2026-11-05, owner: existing required-test PR check.
- Fingerprint: `ci|required-test|changed-path-test-selection|20261105-v1`.
- Source: main red after PR #5447; the page test ran only post-merge.
- Repair: select and run tests that reference changed files; known-red-on-base reported, new failures block.
- Open: `tests/seo-estate-policy-v3.test.mjs` red on base, owner decision needed.
- Status: CODE_CANDIDATE, not verified until Required, CodeQL, original BRAIN and terminal closure agree.
