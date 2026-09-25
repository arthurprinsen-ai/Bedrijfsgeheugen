# Pricing billing state parity — 2026-09-25

Production exact-main deployment succeeded through provider, identity and pricing-content gates, but Playwright failed on `yearly billing aria-selected did not become true`.

Root cause: the delegated pricing rescue runtime wrote `aria-pressed` for billing controls but did not write the canonical `aria-selected` state used by the pricing tab contract.

Repair: synchronize both ARIA attributes from the same active billing state and retain the existing price/period/checkout updates. Production closure still requires pricing interaction plus NL→EN→NL browser proof.
