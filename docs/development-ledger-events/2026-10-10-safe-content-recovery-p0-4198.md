# Development ledger: blocked-content recovery (10 October 2026)

- Owner: P0 #4198; reuse existing POWERHOUSE supervisor and orchestrator.
- Merged PR #4299 restored missing daily decision bootstrap (live Edge v33).
- PR #4301 and production SQL now exclude expired CPNL subsidy source; KVK DBA source selected.
- Remaining blocker: blocked decisions cannot be retried by supervisor when no pending `decided` rows exist.
- Candidate: bounded recovery for content blocked on duplicates or expired sources, ONLY where no provider ID, create acknowledgement or possible side effect exists. All uniqueness, consent, identity and provider gates remain mandatory.
- Proof obligations: protected CI, production Edge parity, independently verified live posts, blog and Instagram, measured commercial outcomes.
