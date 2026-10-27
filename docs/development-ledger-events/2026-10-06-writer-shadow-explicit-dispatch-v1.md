# Development ledger — writer Shadow explicit dispatch v1

- Date: 2026-10-06
- Obligation: writer-shadow-explicit-dispatch-20261006-v1
- Waste removed: one globally-triggered skipped Repository Writer Candidate Shadow run from ordinary PRs.
- Safety: all seven writer producers retain explicit immutable shadow verification.
- Architecture: one shared helper resolves exactly one open candidate PR, reads base/head/ref from GitHub, validates writer/* identity, then dispatches the read-only Shadow workflow.
- Regression: tests/repo-writer-shadow.test.mjs prevents reintroduction of a global pull_request trigger or an undispatched writer.
