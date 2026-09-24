# 2026-09-24 — Pricing terminal live proof

- Fingerprint: `pricing-terminal-live-proof-closure-20260924-v1`
- Canonical incident: `pricing-interaction-section-build-preservation-20260924-v1`
- Delivery PR: #2795
- Candidate branch: `ops/pricing-terminal-live-proof-20260924`
- Required terminal sequence: required test → protected merge → Netlify terminal ready → exact production SHA/context/deploy-id → pricing/i18n browser interaction proof.
- Required interactions: lifecycle stage, plan-group tab, monthly/yearly billing, NL→EN and `/en/prijzen` visible English state.
- Closure rule: do not record `LIVE_BEWEZEN` until the exact production/browser evidence exists.
