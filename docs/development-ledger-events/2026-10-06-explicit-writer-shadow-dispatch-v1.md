# Development ledger — explicit writer Shadow dispatch v1

- Date: 2026-10-06
- Failure class: redundant global writer Shadow PR fan-out.
- Root cause: a global pull_request trigger created skipped runs for non-writer PRs while only part of the writer fleet used explicit dispatch.
- Fix: all seven writers explicitly dispatch immutable Shadow verification; Candidate Shadow is workflow_dispatch-only.
- Safety: exact PR/base/head/ref validation remains fail-closed before checkout and central writer gates remain unchanged.
- Regression: tests/repo-writer-shadow.test.mjs.
