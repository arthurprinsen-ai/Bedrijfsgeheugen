# Development ledger — 2026-10-30 original personal source event-family exhaustion repair

- Root cause: original `powerhouse-content-orchestrator` chose `eligiblePersonal[0]` when all eligible sources matched recently published event-type families; a stale family could be recycled despite previous duplicate blocks.
- Impact: 2026-10-30 two successive denied personal content candidates matched 2026-10-27/29 historical story families; canonical publisher prevented provider mutation. Already rejected IDs are preserved, no duplicate post.
- Fix: original selection only accepts non-stale + not rejected candidates, else fail closed with original content source supply; existing other channels continue.
- Existing skill changes: social recovery + self-improvement agents enforce dedupe error fingerprint, bounded source replacement, original publisher and provider proof.
- Portal: existing admin card explains duplicate- and exhausted-source status in Dutch, NEVER falsely `LIVE_PROVEN`.
- Regression: original actual source-family helper and no-first-stale-fallback assertion, original Portal V2 truth test.
- Safety: no OAuth scope changes, new scheduler, manual provider action, weakened dedupe, forced `personal_truth_verified`, or false agent maturity promotion.
- Validation pending protected CI, merge, exact Netlify SHA, explicit original Supabase Edge deployment/readback, next natural actor proof and independent provider outcome. Do not call source-only PR live.
