# Development ledger — terminalizer obligation boundary

- Fingerprint: `terminalizer-obligation-boundary-v1`
- Trigger: terminal closure run `35537568958` failed on `SUPERSEDES_OBLIGATION_MISMATCH:2504` after production readback had already proven merge `395a3185090feee558f633e7d1b0ed334e19db43` live.
- Change: stop migration supersession traversal at a cross-obligation boundary; keep all same-obligation safety checks fail-closed.
- Expected outcome: website-only recovery #2510 can terminalize without inheriting unrelated historical migration lineage.

- Recovery: learning evaluation now references `tests/brain-terminal-obligation-boundary.test.mjs` so semantic closure and skill projection are machine-verifiable.
