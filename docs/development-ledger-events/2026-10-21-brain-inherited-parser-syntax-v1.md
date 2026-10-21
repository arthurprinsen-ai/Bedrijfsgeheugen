# 2026-10-21 — BRAIN inherited parser failures

- Fingerprint: `ci|brain-baseline|parser-errors|20261021`. Obligation: `ci-inherited-brain-parser-syntax-20261021`. Parent P0 #3742, related #4215.
- Base main: `d18ef16edac0e62058a51afee21cfe0b52a91e20`. Evidence BRAIN run `39554866582`, backend job `119072398429` with 355 failures inherited from unchanged main and no portal-only failed test identity.
- Root causes: Heartbeat test appended executable bare Markdown (`Unexpected number`); migration terminal test overescaped regex slash and stale ownership pattern (`Invalid regular expression flags`).
- Fix: keep Heartbeat executable test free from historical commentary, move original notes into change documentation, align only two migration workflow source checks with present canonical ownership and baseline path.
- Preserved: all existing tests and assertions unrelated to two source checks, production schema, ledger parity assertions, RLS, external sends, no duplicate schedulers, CodeQL, Required and exact-head BRAIN prerequisites.
- Test evidence: source-verified patch only until actual CI completes. `FULL_BRAIN=NOT_GREEN`; `PRODUCTION=UNCHANGED`; no customer acceptance claim. Next safe action: protected exact-HEAD tests and readback in this same obligation.
