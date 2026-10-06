# Development ledger — explicit operational writer verification v1

- Date: 2026-10-06
- Failure class: global skipped Operational Verification runs plus long candidate polling.
- Root cause: pull_request was used as a broad transport trigger for a verify-branch-only utility.
- Fix: workflow_dispatch-only, exact writer/base/ref/SHA identity, zero-overlap drift guard, one writer dispatch and immediate completion.
- Removed: global PR allocation, 72×5-second candidate polling and duplicate Shadow dispatch.
- Regression: tests/repository-writer-slow-canary-sla.test.mjs.
- Safety: writer workflows still create bounded candidate PRs and own immutable Shadow dispatch; BG169 authority is unchanged.
