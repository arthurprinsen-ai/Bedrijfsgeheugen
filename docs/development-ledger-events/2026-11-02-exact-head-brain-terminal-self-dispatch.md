# Development ledger — exact-head BRAIN self-dispatch — 2026-11-02

- Incident: `powerhouse|terminal|exact-head-unified-brain-run-missing|20261029-v1`; ONE BRAIN observed twice, historical protected terminal #41350194932 failure despite Required/CodeQL SUCCESS.
- Root: original terminal gate expected a read-only BRAIN workflow_dispatch from main for exact PR candidate, while no original component guaranteed its creation after merge.
- Owner: existing original GitHub Obligation Terminal Closure, no parallel agent or scheduler.
- Source: `.github/workflows/obligation-terminal-closure.yml`.
- Safety: merged same-repo PR, main base, exact SHA, original head, original merge containment, duplicate run check, workflow_dispatch only verification_only; **no** BRAIN status override, no repeated dispatch on failed run.
- Tests: `tests/brain-terminal-canonical-verify-only-dispatch-20261102.test.mjs`; original terminal trigger parity and BG169 guards must remain intact.
- Original Brain: `brain/learning/2026-11-02-exact-head-brain-terminal-self-dispatch-v1.json`.
- Human doc: `docs/changes/2026-11-02-exact-head-brain-terminal-self-dispatch.md`.
- Status: source recovery candidate pending protected checks and provider proof; no independent commercial outcome or forced green.

- Portal companion: original owner-only Netlify read model uses a specific ONE BRAIN failure read, dashboard card displays proof debt and original failure link. Files `netlify/functions/powerhouse-cro-other-data.mjs` and `portal-v2/modules/andere-data.js`; regression in same exact-head test.
