# Social learning hourly recovery — 24 October 2026

- Production evidence: 10 observed scheduled endpoint invocations in 2026-10-23/24 Netlify logs; 499 statuses after about 15 seconds, 0 recent formal evaluations.
- Root cause candidate: unbounded list_due_posts evaluation work and store default tenant canonical while active brand posts/snapshots reside in bedrijfsgeheugen.
- Fix: bound and rotate evaluations inside the original hourly function, use separately scoped owned-brand and canonical stores, no new scheduler.
- Safety: sample maturity, missing snapshots and consent gates unchanged; historic absence remains evidence debt. No synthetic outcomes or promoter green.
- Regression: tests/brain-social-learning-daily-tenant-coverage-v1.test.mjs and tests/social-learning-evaluate.test.mjs.
- Terminal: exact SHA protected CI, production Netlify release, first provider scheduler 204 plus fresh tenant evaluation records and readback.
