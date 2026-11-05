# Postmerge BRAIN: valid append-only data-spine lock was mistaken for drift

Provider-backed original history `supabase/migration-history.lock.json` has 808 strictly ordered entries. Historical original same-tick stage receipt migration `20261105132000` remains present. A legitimate protected and provider-applied next migration `20261105134200` records the decision receipt at the same cadence.

Historical BRAIN backend failure: original postmerge run `42059928039`, job `127358913479`, test `tests/brain-data-spine-original-ten-minute-stage-proof-20261105.test.mjs` asserted that the old original was still the **last** record. That assumption is not an immutable safety invariant. The source remains safe; the source expectation was stale.

Correction in original source test: verify exact old and new receipt rows, successor after original, >=808 entries and strict monotonic version ordering. No migration, website, RLS, SQL, cron or production function is modified; no false-green. The *other* original postmerge Git-history regression was resolved independently and more strongly in protected PR #5468, so previous overlapping PR #5470 was **closed unmerged**. This candidate only addresses remaining historical append-only test.

Release guard: exact-head Required/BRAIN + CodeQL, protected merge, independent new protected-main BRAIN run and closing provider evidence. Historical failed BRAIN and terminal runs must remain failed in history. Source correction is not proof of real organic click, verified lead or paid order.
