# Development ledger — expired content deadline prevention, 10 October 2026

- Parent P0 #4198; same canonical content lineage.
- Observed: 10 Oct publisher blocked CPNL on LinkedIn company as story-family duplicate. CPNL source deadline 6 Oct; source trust 0.99 was still ranked first.
- Non-destructive production migration applied to source-backed selector; expired dated signals no longer form new commercial candidates.
- Historical sources retained, existing channel owners unchanged, no duplicate posting bypass.
- Regression: tests/brain-expired-content-signal-p0-4198.test.mjs
- Brain: brain/learning/2026-10-10-expired-content-signal-p0-4198.json
- No assertion of post delivery or downstream revenue from successful DB migration.
