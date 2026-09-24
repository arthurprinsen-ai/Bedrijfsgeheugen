# 2026-09-24 — Pricing terminal live proof recovery v2

- Obligation: `pricing-terminal-live-proof-20260924-v1`
- Predecessor: PR #2795 / merge `929146c1aaada8f07235b5712f771e51c3b58f9d`
- Recovery branch: `recovery/pricing-terminal-live-proof-20260924-v2`
- Admission control-plane fix already landed in predecessor: enlarged GitHub API command buffer.
- Remaining gate root cause: `/inloggen` was noindex but still classified as public SEO/sitemap scope.
- Fix: exclude `inloggen.html` from public SEO inventory.
- Production action: retrigger exact Production Source Snapshot through the existing workflow.
- Terminal success remains: protected merge → exact Netlify production SHA → pricing lifecycle/plan/billing clicks → NL→EN `/en/prijzen` proof → learning status closure.

- Diagnose refinement: excluding `inloggen.html` alone caused 430 valid global login links to fail technical SEO. Added explicit `PUBLIC_UTILITY_ROUTES` and taught the technical SEO validator to accept only those known utility destinations while keeping them out of sitemap/indexable scope.
