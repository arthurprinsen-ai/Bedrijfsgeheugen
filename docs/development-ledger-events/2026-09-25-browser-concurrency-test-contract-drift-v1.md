# 2026-09-25 — browser concurrency test-contract drift

- Fingerprint: `browser-concurrency-test-contract-drift-v1`
- Affected: website baseline on PRs #2880–#2885.
- Root cause: the runtime moved to bounded route-worker concurrency while a legacy regression still asserted sequential route iteration.
- Fix: align the release-risk oracle and make the Brain boundedness regression guard oracle parity.
- Prevention: shared-main regression is repaired once before affected candidates are rerun; no six-way workaround fan-out.
