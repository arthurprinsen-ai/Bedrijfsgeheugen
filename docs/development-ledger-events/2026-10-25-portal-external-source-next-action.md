# 2026-10-25 — Omgevingsradar source→action customer proof (candidate)

- Canonical parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
- Source PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4863
- Fingerprint: portal|omgevingsradar|generic-signal-without-specific-next-action|20261025-v1
- Obligation: portal:source-universe:tenant-safe-next-best-action:20261025-v1
- Scope: portal. No second queue, task registry, scheduler, crawler, provider, or permission widening.

## What was observed
The current authenticated Omgevingsradar renders catalogue/signal scores and separate action candidates but does not show a per-signal exact-source and tenant-specific next action. Production had 156 active source-catalogue entries and 197 signal projections; a daily projection refresh is not proof that every catalogue source was visited. 23,295 canonical connections were present, with 17,400 refreshed today via existing enrichment, not necessarily individual fresh internet crawls. Customer orders or impact from this change are not claimed.

## Change and prevention
A pure read-side projector joins recommendations only by exact signal_key; a generic recommendation cannot become a tenant-owned obligation. Only SCORED tenant company impact can be described as specific. Provenance, source recency, source-state and full HTTPS link are shown. An unknown monetary estimate stays null and expected value is not realized revenue. Canonical learning file includes executable historical replay tests. Root-cause, evaluation and tests: brain/learning/2026-10-25-portal-external-source-next-action.json and tests/brain-portal-external-signal-advice-v1.test.mjs.

## Independent verification still required
Required and CodeQL on the exact PR head; protected merge; Netlify production commit readback; authenticated portal readback for scored and unknown tenant contexts; daily source freshness observations, order conversions and outcomes. STATUS: CANDIDATE_UNVERIFIED. No live or green claim.

## Protected delivery supersession
- Prior candidate: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4859 (closed unmerged, branch behind main).
- Successor: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4863, immutable main baseline 387814c7db6dcaa76ba2193b7f81d4cf87d5d3d3.
- The eight original content blobs were preserved unchanged on latest main; only this append-only ledger records the protected handoff. GitHub can merge only after fresh exact-head Required and CodeQL checks.
