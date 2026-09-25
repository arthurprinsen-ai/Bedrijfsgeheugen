# 2026-09-25 — terminal Required descendant recovery

- Fingerprint: `github|terminal-required-descendant-recovery|website-baseline|v1`
- Trigger: merged PRs #2880 and #2883 remained nonterminal because historical Required runs carried a stale sequential-loop baseline assertion.
- Root cause: verifier implementation changed to bounded concurrency while one regression expected the old implementation detail.
- Recovery: website-only descendant regression proof on current main, while preserving exact-head BRAIN/CodeQL and production readback requirements.
- Prevention: historical failure is retained as history; only current contained production plus explicit regression evidence can terminalize.
- Dashboard contract: `delivery|terminal-user-handoff|dashboard-writeback|v1`.
