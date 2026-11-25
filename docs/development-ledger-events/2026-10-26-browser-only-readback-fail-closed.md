# Development ledger — manual-readback-deployment-decoupling-20261025-browser-only-regression

- Date: 2026-10-26
- PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4959
- Scope: CI production-readback governance only.
- Root cause: browser-only pricing was bound to deployment; route truth hardcoded to success.
- Regression: tests/brain-production-release-readback-scope.test.mjs.
- Initial Required failure: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40290681460 — missing canonical closure trio.
- Actual terminal checks, protected merge, and production readback: PENDING; do not assert LIVE_VERIFIED for this patch.
