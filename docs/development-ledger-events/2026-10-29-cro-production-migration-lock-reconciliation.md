# 29 oktober — Revenue Learning migrate-history lock source reconciliation

- **Owner:** canonical Powerhouse Supabase/source migration writer.
- **Fingerprint:** `supabase|revenue-learning|migration-history-lock-stale-after-production-20261029` (existing `public.brain_failure_registry`, OBSERVED).
- **Observed workflow failure:** GitHub `40919925385`, 91/92 passing, `supabase-migration-history-integrity.test.mjs` fails on five local-only versions. Bounded rerun also fails from identical stale source, so retrying cannot repair it.
- **Readback source:** real `supabase_migrations.schema_migrations` 2026-10-29 17:20 UTC; exact five [20261029122836,20261029125100,20261029125607,20261029174600,20261029174700] versions+names validated. Actual Postgres contains both new CRO views. Protected backend #5143 main `3ce83006...` and Netlify `6ae37fb...` were independently verified.
- **Repair action:** append exact source identities to `supabase/migration-history.lock.json` (774→779); no SQL replay, RLS change, API key, cron or synthetic lead.
- **Regression:** `tests/brain-cro-production-migration-lock-20261029.test.mjs`; existing source integrity test; exact-head Required/BRAIN/CodeQL and fresh `Revenue Learning` push-run on merged main are required.
- **Human documentation:** `docs/changes/2026-10-29-cro-production-migration-lock-reconciliation.md`.
- **Carry-forward:** protect live consented event→durable queue→Supabase ID→rollup, portal owner-only evidence and independent partner/billing readback. Neither a passing test nor 0 leads means success in paid conversions.
- **Outcome status:** CANDIDATE_NOT_MERGED; CI_RECOVERY_UNVERIFIED; REAL_ORDER_OUTCOME_UNVERIFIED until actual provider and main readback.


- Second independent provider readback: 784 production version+name identities == 784 tracked executable files; original main lock 774, original PR 779; five additional exact production versions now included for 784.
- Independent CRO preview branch 779, five newest production versions not present; original provider check reports SQLSTATE 23505 on an older version ALREADY in preview history. Mira preview reproduces same class on another already-present version. No SQL migration file contains history DML. Separate provider replay incident remains unresolved.
- New prevention: original same PR/source owner includes complete provider/lock/repository identity gate and independent Supabase provider replay proof; no blind rerun, no fake READY, no direct schema_migrations edit, no additional scheduler.
- **CI first-pass 40955712525:** Required hygiene did not fail because of migrations; correct protected Brain learning-canonicalization blocked `LEARNING_EVALUATION_TEST_PATH_INVALID:historical_replay:tests/supabase-migration-history-integrity.test.mjs`. Owner had placed a valid generic test in a field that permits ONLY `tests/brain-*.test.mjs` paths. Kept generic test in the supplemental `learning.tests` list, restored singular canonical Brain replay path and added source regression test for path conformance. Root cause, prevention and check id preserved.
- **Independent provider success before CI correction:** original Supabase Preview check returned SUCCESS and existing branch reached FUNCTIONS_DEPLOYED, no manual history mutation. The corrected source code still requires new exact-head Required/CodeQL and same-head provider proof.

- **Agent/SkillOps propagation in same exclusive PR:** append current migration triple-source preflight, PREVIEW_PROVIDER_HISTORY_REPLAY_CONFLICT classification, original writer/paid preview boundary, canonical tests/brain evaluation contract to ORIGINAL `.agents/skills/powerhouse-self-improvement-layer/SKILL.md`; original learning regression checks source skill. No new parallel agent, scheduler or migration writer.
