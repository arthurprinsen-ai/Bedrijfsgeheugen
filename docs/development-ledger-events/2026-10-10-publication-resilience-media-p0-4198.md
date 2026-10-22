# Development ledger — publication resilience
Date: 2026-10-10
Obligation-ID: p0-4198-publication-resilience-media-20261010
Parent P0: #4198

Problem: hourly supervisor's one-generation limit strands other daily channels; repeated ensure-media calls erase in-progress OpenArt manifest; media preflight downgrades in-flight state; personal LinkedIn post kept stale failure string after verified provider creation.
Repair: bounded sequential generation under existing lease; SQL idempotent media manifest preservation; media verifier status preservation; stale-error clear after successful personal LinkedIn provider write.
Safety invariant: ONE BRAIN, ONE canonical writer, no duplicate provider mutation, no fabricated media identity, no fallback Buffer/Make, real readback before LIVE_PROVEN.
Test: tests/brain-publication-resilience-media-and-delivery-p0-4198.test.mjs
Deploy proof still required: protected GitHub checks, SQL and Edge production source parity, unchanged exact video asset manifest after ensure, real provider IDs.
