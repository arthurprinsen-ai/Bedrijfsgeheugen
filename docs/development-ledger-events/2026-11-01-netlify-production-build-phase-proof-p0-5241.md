# 2026-11-01 — P0 Netlify exact-main production build evidence failure

Obligation: `netlify-build-parity-phase-proof-p0-5241-20261101`
Incident: #5241; commercial parent #4198.
Writer: original protected GitHub Required/Production Source Snapshot chain; no alternate delivery authority.
Original main base: `eedc3f8b380cd1e0c986cc0d0ea98854a48813e8`.

Verified failure: manually dispatched original release `41344419120` accepted exact protected main, uploaded immutable source, acquired OIDC Netlify authority, created deploy `6ae79adf878b85f1eb84e757`, which **failed build exit 2**. Provider build `6ae79add878b85f1eb84e755` had no exposed specific failing script line. Previous production remained at `3822f80f34ff75458cba98e66d2c47a7a345d840`. Original Required prebuilt tree artifact not found.

Source defect observed independently in production-classifier code: a blanket `tools/ci/` governance exclusion also omitted the *executable* canonical Netlify production build entry from Required runtime parity scope. Correction: explicit exception for `tools/ci/netlify-build-entry.mjs`, preserving unrelated governance exclusions and all full build environment safeguards. The canonical build engine now emits a phase-specific safe failure object and profile while continuing to **fail closed**.

Evidence test: `tests/brain-netlify-production-phase-proof-20261101.test.mjs`.
Release proof must include new Required netlify_build_parity job, protected main merge, Netlify provider `ready`, exact live SHA/deploy ID, and production functional smoke. A build error must never be marked a website live release. At creation this is a **CANDIDATE/NOT LIVE** fix and no commercial order is proven.

Prevention contract: This exact original build entry is a permanent Netlify-runtime-critical file, and every build failure in the original pipeline must preserve a specific failure phase with no secrets and a repeatable regression before any further deploy.
