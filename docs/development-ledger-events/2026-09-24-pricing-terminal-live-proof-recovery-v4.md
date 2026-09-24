# 2026-09-24 — Pricing terminal live proof recovery v4

- Obligation: `pricing-terminal-live-proof-20260924-v1`
- Supersedes PR #2810 after post-merge diagnosis.
- Post-merge defect: `ReferenceError: UTILITY_ROUTES is not defined`.
- Root cause: substring guard matched `PUBLIC_UTILITY_ROUTES` and skipped the required local declaration.
- Fix: define `const UTILITY_ROUTES` explicitly and assert that exact declaration in regression.
- Terminal success: protected merge → exact production SHA → pricing/i18n browser proof.
