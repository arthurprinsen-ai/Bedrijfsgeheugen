# Trusted Advisor AI-answer proof-state regression — 12 November 2026

- **Fingerprint:** `portal|trusted-advisor-answer-verification-claim-gate|20261112-v1`
- **Owner:** original Portal V2 assurance / original ONE BRAIN evidence owner
- **Parent P0:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- **Observed fact:** normalized response `status:'verified'` was trusted without a concrete receipt, independent verification declaration or named source. A missing source was replaced by the product brand in the UI.
- **Cause:** unvalidated presentation state from an AI/server response was conflated with an independent evidence-backed claim.
- **Correction:** downgrade unproven or contradictory `verified`/source-grounded declarations; show missing proof to the customer.
- **Regression:** `portal-v2/tests/trusted-advisor-assurance.test.mjs` (negative, contradiction, positive, missing source).
- **Prevention:** preserve this rule in original policy/editorial skill, not a parallel trust engine.
- **Current proof:** source changes committed on isolated branch; protected CI, browser readback and live customer outcome unconfirmed at authoring.
- **Next original consumer acceptance:** exact tenant/source revision/obligation/idempotency/owner/consumer_processed_ack plus outcome receipt. Evidence due until independent readback.
- **Commercial observation (read-only, 2026-11-12 21:35 UTC):** canonical scorecard `handoff_health=DEGRADED`, 7 broken/unproven 7-day handoffs, 0 provider-linked replies/meetings and 0 realised revenue; not attributed to this UI fix.
