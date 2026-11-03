# Development ledger — predictive public evidence priority

- Date: 2026-10-30
- Obligation: predictive-public-market-evidence-topn-crowdout-20261030
- Parent issue: #4198
- Pull request: #5169
- Writer: canonical-predictive-engine-source-owner-20261030
- Delivery lane: original Powerhouse predictive backend
- Change: restrict each public source type before applying strength limit; independent 24 public news / 16 search demand caps.
- Observed incident: pg_cron request to original `powerhouse-predictive-engine` on 2026-10-30 06:08 UTC returned HTTP 500 / `AI_PUBLIC_MARKET_EVIDENCE_REQUIRED` in `net._http_response` id 16389.
- Root-cause proof: original top 80 signals = 80 relationship rows; 7 public-news and 11 public-search rows within 21-day window; previous payload privacy allowlist intentionally excluded all relationship data.
- Regression: `tests/brain-predictive-public-market-priority-20261030.test.mjs`.
- BRAIN: `brain/learning/2026-10-30-predictive-public-market-evidence-priority-v1.json` and production failure registry fingerprint `predictive|public-market|unfiltered-top80-crowds-out-valid-source-types|20261030-v1`.
- Scope: no new scheduler, no extra provider, no altered contact pressure, no lower evidence standards, no secret/PII artifacts, no expensive Supabase preview.
- Required closure: protected Required/BRAIN/CodeQL/System Map on exact head, merge to main, Supabase exact code parity and real natural predictive-run readback.
- Current status: candidate only; not merged or LIVE_VERIFIED at writing; learning OBSERVED.
