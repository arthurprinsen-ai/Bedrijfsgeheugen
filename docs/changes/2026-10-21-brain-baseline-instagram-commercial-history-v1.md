# BRAIN historical SQL source contract repair — Instagram winner & human commercial

- Fingerprint: `ci|brain-baseline|instagram-commercial-historical-sql-source|20261021-v1`
- Obligation-ID: `ci-inherited-instagram-commercial-history-source-20261021`
- Parent-P0: #3742; related #4215; blocked Portal #4573
- Base main: `9130957e1f444dddc2cd512eab74b575125f7428`
- Source: [Unified BRAIN verification-only run](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39660607012), backend job 119432847782; 3500 total / 3171 pass / 329 fail.

## Cause and bounded change

Two original source-contract suites read original SQL using `supabase/migrations/` names after supported migration-history cleanup archived those immutable SQL bytes at `supabase/migration-history/repository-only/`. This causes exactly five inherited ENOENT failed tests: three Instagram winner lineage cases and two human commercial orchestration cases.

The test-only patch changes three identical Instagram file path literals and one human commercial file path literal. Every original test body and assertion remains byte-identical. No executable migration is restored, no SQL runs, and no provider, scheduler, runtime, security, RLS, authorization, portal or customer state changes.

## Source evidence

- Instagram SQL: `supabase/migration-history/repository-only/20260920110000_instagram_daily_winner_lineage_v1.sql` at Git blob `d66c4119fe0e75a4622f35fd7d420f31bd7dadf8`; 13 original positive regex checks and the original `carousel.*daily_winner` negative guard checked against authentic archived source.
- Commercial SQL: `supabase/migration-history/repository-only/20261005135000_powerhouse_human_commercial_orchestrator_v1.sql` at Git blob `18876bf5a51efe00d948f6652899477535b910a4`; 21 original source markers checked, plus `p.action_id=any(p_action_ids)` preceding `limit greatest` within the SQL function body.

These checks are **source evidence**, not a new Node or GitHub Actions test run.

## Protected delivery and prevention

Keep PR Draft until focused Node tests, exact-head Required, CodeQL and full Unified BRAIN backend all succeed; the remaining baseline still blocks protected merge and production. The two real authenticated tenant acceptances under #4215 are separate. Never replace missing executable migrations with duplicate historical SQL, empty placeholders, skipped checks or manufactured evidence.

The common historical-SQL source routing prevention rule is projected through the existing Green Assurance skill target and machine-readable BRAIN learning evaluation in historical replay, shadow and canary modes. No branch or files owned by #4582, #4587, #4591, #4593, #4595 or #4597 are touched.
