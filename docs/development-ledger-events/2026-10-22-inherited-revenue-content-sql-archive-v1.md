# 2026-10-22 — inherited BRAIN revenue/content SQL archive pointer recovery

- Parent obligation: #3742; related #4215; blocked portal PR #4573.
- Fingerprint: `ci|inherited-baseline|revenue-content-immutable-archive-sources|20261022-v1`.
- Exact main epoch before candidate: `64104acf8402d65dcfd7359a152eaf6f305b9ffe`.
- Reproducible failure baseline: full BRAIN run #39671036043, 3,511 total, 3,190 pass, 321 fail.
- Root cause: two existing source tests reference absent executable SQL migration file paths, while authentic historical SQL exists in immutable repository-only archives.
- Recovery: two read-path substitutions, original assertions retained, plus a fail-closed two-case archive/scheduler/ACL regression test.
- Changed production source, SQL migration history, auth, RLS and scheduler: **none**.
- Current state: draft candidate; no new exact-head CI, CodeQL, full BRAIN or production acceptance has been claimed.
- Continue in the existing #3742 recovery lineage. Reuse per-test failure fingerprints to avoid duplicate writer collisions or repeated diagnosis after interrupted chats.
- Closure gates: full exact-head BRAIN 0 failures, Required/CodeQL terminal-success, protected merge and required independent Supabase history and actual customer acceptance readbacks.
