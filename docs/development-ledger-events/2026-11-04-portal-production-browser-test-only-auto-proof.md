# Browser readback missing-trigger closure — 2026-11-04

- Owner: original Portal V2 UX/QA/CI and exclusive protected GitHub/Netlify delivery.
- Source: original browser #41832239828 on production Netlify had 14 PASS, 1 FAIL, 1 SKIP. Protected test fix #5412 merged `e92994d4d526cef37b000b80aeb6b26616fd2609` with Required + CodeQL PASS. Original browser run absent after test-only push because `.github/workflows/portal-v2-production-dom-readback.yml` watched only `portal-v2/**`.
- Canonical fingerprint `portal|browser-readback|test-only-main-not-triggered|20261104-v1`. No second scheduler, branch author or browser evidence proxy.
- Root: CI event path did not include its own original Playwright tests, while original workflow expected exact HEAD deployed commit and therefore could not transparently reverify test-only main against immutable published SHA.
- Remedy: original workflow accepts its own test files on push, verifies independently returned Netlify published SHA is protected ancestor and Git diff contains only strictly allowlisted non-runtime evidence files, then reruns full original production browser against exact immutable deploy; any intervening actual runtime source fails this fallback and continues to demand exact deploy.
- Prevention: root regression asserts both source fences have identical immutable scope, no runtime file allowlist, original full browser and built-in release fence.
- Status: CODE_CANDIDATE. No browser/user/customer success claim until original provider readback and protected release/terminal prove outcome.

- First exact-head Required for this candidate rejected an outdated historical test `tests/brain-p0-4215-scoped-production-visual-replay-v2.test.mjs` that asserted the previous workflow_dispatch-only override literal. Updated that **original** test to require both legitimate event types on protected main plus an independently checked `PORTAL_PUBLISHED_CI_ONLY_VERIFIED` branch; old manual PR/approved visual/immutable source checks are retained. Candidate needs fresh exact-head Required/CodeQL and actual original browser readback before closure.
