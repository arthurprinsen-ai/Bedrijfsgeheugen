# Revenue learning settle unverified rows

- Obligation: revenue-learning-settle-unverified-20261028
- Change: in `revenue-learning-evaluate`, a due evidence row without a verified source is marked evaluated right after its VERIFIED_SOURCE_REQUIRED obligation is recorded. Cohort and metric gaps are not settled. The run summary gains `settledUnverified`. No new scheduler, writer, migration or deploy path.
- Evidence: `tests/brain-revenue-learning-unverified-settle-20261028.test.mjs`; Netlify logs show `evaluated: 0`, `attempted: 8`, `unprocessedDue: 103` on every hourly run from 2026-10-27 18:00 to 2026-10-28 05:00 UTC.
- Status: candidate only; effective only together with PR 5019; protected merge, Netlify deploy and log readback pending.
