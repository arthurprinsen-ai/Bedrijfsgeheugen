# 2026-10-25 — Canonical Mira temporal rejection truth, no video resends

Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439

## Independently proven failure
Protected #4883 allowed an alternate approved-source OpenArt candidate to enter the existing genuine verifier. Original authorized router request #12609 returned HTTP 422 with `MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED`, temporal confidence **0.89**, threshold **0.90**. All three face-image checks advanced; temporal continuity booleans were true but confidence was insufficient. Exact video SHA `0c330895341e571167bd048781ba8edeec91488ca1012b4af0d0d7f68a2dbf78`. No Instagram publication or provider ID.

The canonical job still showed the ORIGINAL video first-frame confidence 0.920 failure rather than alternate history `a6sdR46HDe58uRlardNl`. This is a real missing failure-evidence write, not permission to override either threshold.

## Narrow correction
Re-use current `recordMediaProofRejection` CAS writer and ONE `brain_observe_failure` ledger for true measured temporal quality rejects, with unique provider history and independent score. Do not persist pseudo-failure on HTTP 5xx/timeouts/missing confidence. Preserve immutable source winner, original visual master, existing media job, existing scheduler, single publisher. A genuinely different permitted candidate can be evaluated, but the failed alternate history cannot replay just to obtain a favorable stochastic model score.

Existing video remains **rejected**. No new paid OpenArt generation is made. All thresholds and provider IDs must remain factual. Tests include positive persisted 0.890, negative transport/missing proof, banned exact history replay, and original publisher invariants.
