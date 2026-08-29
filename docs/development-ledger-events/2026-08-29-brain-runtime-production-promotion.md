# 2026-08-29 — PRODUCTION_PROMOTION — Bedrijfsgeheugen Brain runtime

- **Fingerprint:** `brain|end-to-end-governed-runtime|production`
- **Initial RED:** Business OS Intelligence run `33251803681` exposed four semantic gaps: post-change verification remained `Verifying`; unregistered AI use cases were not rejected; unauthorized human decision promotion was not denied; and successful self-heal AgentWork remained `Investigating` instead of reaching shared learning.
- **Intermediate RED:** run `33251930059` exposed an API-boundary gap: the read-only metadata status query incorrectly required all write-command runtime capabilities at gateway construction.
- **Root-cause fixes:** enforce active registered AI-use-case matching before provider invocation; authorize human approval separately; persist verified change state after verification; advance successful self-heal work to `LearningRecorded`; expose one explicit Brain command/query gateway; require command capabilities only when that command is invoked; return metadata-only status and reject arbitrary runtime methods.
- **Final candidate:** `95c0df0bcb7d9beca6fddd1341e99a26169ecd71`.
- **Synthetic merge verification:** `506e4b471fa034264fd09f9b6a904b5f729488f0`, merging candidate into production base `b7a271ca281d2cbc28ad8ba4312e26addad8a2aa`.
- **Candidate gates:** Business OS Intelligence `33251986785`, Shared Agent Memory `33251986754`, Business OS Foundation `33251986774`, and V18 Production Promotion `33251986761` all succeeded.
- **Acceptance evidence:** Brain acceptance 8/8; trust contracts 11/11; foundation contracts 22/22; protected portal parity green; explicit Brain API gateway contract green.
- **Promotion:** PR #163 merged guarded on exact head to production SHA `e3c3b0468e10922c53e30264d75cda724321722f`.
- **Production gate:** Configuratiewacht run `33252024344` succeeded on exact production SHA.
- **Production deploy:** Netlify `6a92cd3f4344450008e5be78`, context `production`, state `ready`, exact `commit_ref=e3c3b0468e10922c53e30264d75cda724321722f`.
- **Protected evidence:** 68 redirects, 16 headers, 3 functions, 1 edge function, 684 files secret-scanned, 0 findings. Public smoke at `https://www.bedrijfsgeheugen.nl` loaded successfully.
- **Last-known-good before promotion:** `b7a271ca281d2cbc28ad8ba4312e26addad8a2aa`. Rollback was not required.
- **Shared learning:** mirrored to Powerhouse Direct Knowledge Base as `PRODUCTION_PROMOTION — Bedrijfsgeheugen Brain Runtime`.
- **Reusable lesson:** an end-to-end green claim must include both semantic business-state acceptance and the explicit external API boundary. A contract file that exists but is not wired into CI is not evidence.
