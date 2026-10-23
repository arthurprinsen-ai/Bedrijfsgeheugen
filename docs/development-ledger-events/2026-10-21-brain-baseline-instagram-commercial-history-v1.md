# Development ledger — ci-inherited-instagram-commercial-history-source-20261021

- Date: 2026-10-21
- Fingerprint: `ci|brain-baseline|instagram-commercial-historical-sql-source|20261021-v1`
- Baseline: Unified BRAIN #39660607012, backend job 119432847782, 329 inherited failures after prior source repairs.
- Root cause: archived immutable SQL is referenced through outdated executable migration paths by two unaffected test files.
- Repair: 3 Instagram SQL read paths and 1 human commercial SQL read path redirected to exact repository-only immutable source; original regex and runtime assertions unchanged.
- Evidence: archived blobs d66c4119fe0e75a4622f35fd7d420f31bd7dadf8 and 18876bf5a51efe00d948f6652899477535b910a4; original source check markers reviewed; no runtime/prod mutation.
- Next proof: exact-head Node + Required + CodeQL + non-waivable complete Unified BRAIN backend. Release and real tenant A/B remain fail closed.
- Prevention: original historical SQL source tests always target immutable repository-only bytes, not executable migration history.
