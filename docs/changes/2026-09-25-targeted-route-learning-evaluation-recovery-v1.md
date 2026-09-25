# Brain evaluation contract recovery — targeted route helper import

Date: 2026-09-25

After PR #3104 merged, Powerhouse Skill Projection showed that the learning record used a non-canonical evaluation path: `tests/targeted-website-route-regression.test.mjs`. The canonicalization gate only accepts `tests/brain-*.test.mjs`.

The recovery adds a dedicated Brain evaluation test and rewires both historical replay and canary evidence to that test. The underlying browser/runtime fix is unchanged.
