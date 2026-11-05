# Postmerge BRAIN — source history is not a frozen snapshot (5 Nov 2026)

## Verified observed failure
The protected PR #5458 is merged and its Netlify website source is published, but the **distinct** postmerge BRAIN terminal run #42059796291 failed because the original BRAIN run #42059928039 backend lane (#127358913479) had two historical failures:
1. Test `tests/brain-ci-control-plane-convergence-v1.test.mjs` expected no `fetch-depth: 0` in `.github/workflows/required-test.yml`, although the REQUIRED preflight explicitly needs complete immutable Git migration history to safely compare exact base/head. The website lane, not Required, is responsible for bounded `fetch-depth: 2` and `TARGETED_BASE_FETCH`. Preserve full Required evidence; do **not** change the workflow back merely to satisfy the old test.
2. Test `tests/brain-data-spine-original-ten-minute-stage-proof-20261105.test.mjs` expected the source lock to end with migration `20261105132000`. The original protected canonical lock now has **808 entries** and ends with legitimately appended provider-applied migration `20261105134200` (`original_data_spine_decision_receipt_same_tick_v1`). The original migration remains present at index 806, successor at 807.

## Correction (source tests only)
- Verify `Required`'s intentional full Git history with the existing explicit migration-history contract, and independently assert the unchanged **bounded** website checkout and targeted base fetch.
- Verify the original migration row is still intact, the next valid provider-applied receipt is present and ordered after it, the lock has at least 808 entries and all versions are strictly monotone. Do not write or alter any migration, protect source lock, grant privileges or add a scheduler.
- Preserve the original ONE BRAIN observation and the old failure in history: this change cannot rewrite the historical failed run or magically clear unrelated BRAIN incidents.

## Definition of done
Exact-head PR Required/CodeQL and all impacted tests; protected merge; new exact-main BRAIN source/run evidence (not only PR tests); independent production outcome reconciliation; then close this incident alone, not entire SEO-to-sales outcome. All commercial outcomes (real clicks, legitimate form receipts, booked customers, paid orders) remain unproven until provider receipts exist.
