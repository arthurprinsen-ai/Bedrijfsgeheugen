# 2026-09-25 — i18n runtime asset completeness borging

## Incident
Production pricing proved exact deployment and pricing-content readiness, but mobile NL/EN browser proof failed because the visible language selector did not exist.

## Root cause
The public pricing HTML contained the i18n stylesheet marker while the i18n runtime script was absent. The build transformer used one shared marker as a completeness sentinel and returned early. That allowed partial i18n installation to masquerade as complete installation.

## Permanent Powerhouse rule
- CSS and JS asset presence are verified independently.
- Build transforms are idempotent per required asset.
- Mobile language controls must mount into the active production navigation host.
- Browser proof must use the visible mobile control and complete NL → EN → NL.
- Exact provider SHA and browser behavior outrank source markers or deploy-start state.

## Canonical fingerprint
`i18n-runtime-asset-independent-presence-v1`.
