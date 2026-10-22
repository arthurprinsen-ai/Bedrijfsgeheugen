# BRAIN historical security SQL source regression — 22 October 2026

Obligation: `ci-inherited-security-sql-archive-20261022`. Parent P0 #3742. Portal release dependent PR #4573, tenant acceptance #4215.

## Evidence
Full Unified BRAIN backend run #39671036043 job #119469063095 on candidate 1dfb5766: 3511 tests, 3190 pass, 321 fail. Six original assertions in historical security/autonomy/forecast contract tests fail ENOENT because they read migrations that were correctly moved into immutable `supabase/migration-history/repository-only/`.

## Contained fix
Redirect exactly one SQL source-read path per affected original test, preserving every pre-existing assertion. Add a regression that computes the original Git blob SHA-1 from archived file bytes and rejects executable duplicate filenames. Source file identities were checked via GitHub repository readback before modification. Project prevention to the existing `powerhouse-green-assurance` skill and Brain learning.

No database/provider/production code, scheduler, migration, RLS, ACL, secrets or release gates changed. No other writer branch touched.

## Acceptance
This is a candidate, **not six newly proven passing tests**. Run actual Node tests and full exact-head Unified BRAIN, Required CI, CodeQL, and protected merge before changing any production. Separately prove supported Supabase clean-room history parity (#3742) and authenticated two-customer portal input/output (#4215). All failures remain fail-closed, no test disablement or misleading green claims.
