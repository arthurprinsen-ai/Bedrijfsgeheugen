# I18N exact-main production recovery — 2026-09-25

Fingerprint: `website-i18n-production-main-drift-20260925-v1`

## Incident
Production served an older main snapshot while protected main already contained the canonical NL/EN recovery chain and deterministic static-English cache authority.

Observed production before recovery:
- Netlify deploy: `6ab66b7bb3dd8b0008d0c2a1`
- production commit_ref: `f45ad02f8f719958c00b7ff8e39e3ca2104353b1`
- live homepage, pricing and systems pages exposed the public-language-switch failure state.

Canonical main at recovery start:
- `e6b9369587ed0b7f31a68a50f2cfd360b8800a18`

Relevant canonical i18n lineage already on main includes:
- #2918 — fail-closed English localization + NL/EN canonical roundtrip
- #2944 — deterministic versioned English cache
- #2965 — immutable config-cache production authority
- #2977 — canonical patch authority for production builds
- #2995 — production static i18n cache completeness
- #3001 — exact Netlify production build parity

## Root cause class
Deployment/source drift: production was not serving the current protected-main source after the latest i18n and build-authority fixes.

## Permanent prevention
1. Public NL/EN release closure requires production `commit_ref === protected main SHA`.
2. Homepage, pricing and systems/koppelingen are mandatory language-switch readback routes.
3. A ready Netlify deploy is insufficient without exact-main parity and functional state-change proof.
4. Production build environment changes that affect static i18n require a new exact-main production build before closure.
5. Learning fingerprint is idempotent; do not create parallel recovery truth.

## Closure contract
protected checks → merge → exact-main production build → browser readback on:
- /
- /prijzen
- /systemen-koppelen
- corresponding /en routes / language switch behavior

Do not mark LIVE until all are proven.
