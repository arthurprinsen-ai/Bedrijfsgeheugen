# Pricing browser proof authority — 24 September 2026

## Decision

For pricing toggles and public NL/EN switching, the production Playwright verifier is the authoritative functional oracle.

## Why

Two consecutive production snapshot runs proved the exact Netlify SHA but failed an intermediate raw-HTML marker gate before the stronger browser proof could execute. The live pricing page visibly contained the expected controls, so the intermediate gate produced false negatives and prevented measurement of the behavior users actually reported.

## Permanent rule

- Exact production identity remains mandatory.
- Interaction defects are proven by exercising the interaction in a production browser and asserting the resulting visible state.
- Raw HTML greps may support diagnostics but may not block the authoritative interaction proof.
- Pricing proof must click lifecycle, plan-group and billing controls and verify their changed state.
- Public English proof must use the UI control and verify the resulting English page, language metadata and absence of known Dutch/failure states.

Canonical verifier: `tools/site-shell/verify-pricing-i18n-production.mjs`.
Canonical learning: `pricing-toggle-i18n-runtime-20260924-v1`.
