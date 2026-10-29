# SEO daily blog candidate reservation recovery (public-safe technical event)

- 2026-10-29: Existing v100 production first-party canary returned HTTP 200, `ok=true`, `recommendations=0`; Twinfield and Exact Online queries route to their original money-page owners.
- Canonical private recommendation register: 52 `suggested` historical Twinfield alias rows corrected to `skipped` (29 Twinfield API, 23 Twinfield bookkeeping); each updated row includes evidence of canonical ownership and runtime result. A previously skipped row remains untouched.
- Root cause: the daily new-blog reservation query counted skipped rows as if they were active new content candidates. Change the existing query's allowed status set to suggested/accepted/done only.
- No blog publication, schedule, credentials, publisher, user data, migration history or branch protection changed. P0 #5072 and migration replay #3742 remain independently open.
- Release requirement: exact SHA Required, CodeQL and backend; protected merge; Supabase provider source parity; post-release HTTP canary; no fabricated SEO conversion improvement.
