# 2026-09-24 — Pricing runtime-readiness production proof

- Fingerprint: `pricing-production-runtime-readiness-v1`
- Failed run: `36054911943`
- Failed job: `107819333389`
- Exact production SHA: `3628225d0ebb834f496678b3d4e3c4414d26e5ee`
- Failure: generic body visibility timeout.
- Independent evidence: cache-busted pricing URL returned HTTP 200 with complete pricing HTML.
- Fix: runtime `ready-v3` marker + target-control visibility become authoritative readiness.
- Regression: `tests/brain-pricing-mobile-lifecycle-actionability-v1.test.mjs`
- Terminal status: pending protected merge + exact production browser readback.

- Regression scope correction: initial test overreached by banning the legitimate post-English-navigation body visibility check.
- Correct invariant: body readiness is forbidden only before pricing runtime `ready-v3`; post-navigation body visibility remains valid.

## Production promotion

- Canonical authority: `Production Source Snapshot`.
- Status before provider proof: `PROMOTION_PENDING`.
- Terminal proof requires exact Netlify production SHA plus green pricing+i18n production browser verification.

