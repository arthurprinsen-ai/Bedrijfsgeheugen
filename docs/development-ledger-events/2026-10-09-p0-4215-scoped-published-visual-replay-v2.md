# P0 #4215 development evidence — manual visual replay with actual published-SHA ancestry

- Existing workflow: Portal V2 Production DOM Readback (no second scheduler).
- Failure: verification-only main SHA can be newer than the currently published portal runtime; direct exact-main waiting would never finish despite valid provider production release.
- Mandatory invariants: explicit main-only dispatch, approved protected-merged PR source, published SHA ancestor and CI-only intervening diff, provider current+immutable exact SHA, unchanged Playwright DOM/mobile/pixel threshold and attached verified output.
- PR #4246 approved PR/preview-alias proof is preserved; its regression now validates **selected published SHA** ancestry, not blindly `GITHUB_SHA`.
- Required test: `tests/brain-p0-4215-scoped-production-visual-replay-v2.test.mjs`; historical/shadow/canary.
- No claim of real customer sessions or end-to-end tenant-specific compliance from synthetic tests or visual source readback.
