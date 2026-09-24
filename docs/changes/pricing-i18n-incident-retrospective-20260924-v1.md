# Pricing + i18n incident retrospective — 24 September 2026

## What went wrong

We made four distinct mistakes in the pricing/language incident:

1. We treated HTML marker presence as proof that pricing toggles worked. The page contained the correct attributes, but that did not prove a click changed visible state.
2. We declared the earlier release live before reproducing the user's actual browser symptom strongly enough. Green build/readback evidence was broader than the specific interaction contract.
3. We moved public language switching to runtime translation on the unprefixed page. That made a user-facing language switch depend on the runtime translation provider and allowed the UI to say English while Dutch copy could remain.
4. Our regression suite still contained stale v2/cache-version assertions after the runtime moved to v3, which created avoidable red CI and delayed terminal delivery.

## Root cause

The common root cause was **proof-contract mismatch**: we verified implementation artifacts and general route health, but not the exact user-observable behavior at the production boundary.

## Permanent prevention

- Interactive UI is never proven by marker presence alone. The proof must execute the interaction and assert the resulting visible state.
- Public language switching uses prebuilt localized routes. Runtime translation remains a fallback capability, not the primary public-site switching path.
- Localized public routes have explicit Netlify rewrites.
- Pricing production proof executes lifecycle, plan-group and billing clicks on a mobile viewport and verifies the resulting visible state.
- The same production proof selects English through the actual UI and verifies navigation to the English route, `html lang=en`, absence of the Dutch pricing H1 and absence of the runtime translation failure message.
- Runtime/cache version changes require co-changing exact-version regressions in the same candidate.
- No `LIVE_BEWEZEN` claim is allowed for an interaction defect without browser-level production evidence of that interaction.

Canonical learning fingerprint: `pricing-toggle-i18n-runtime-20260924-v1`.
