# 2026-10-03 — Wet DBA static i18n cache recovery

- Obligation: static-i18n-wet-dba-cache-20261003-v1
- Root cause: the newly merged blog introduced public Dutch strings without the deterministic English cache patch.
- Production impact: Netlify deploy 6ac0af4a58aa221a74cc8098 failed closed during localized-route generation.
- Recovery: append the exact missing English cache entries through the existing static-i18n patch mechanism.
- Acceptance: Required test including exact Netlify parity must pass before merge; then production is redeployed and publicly read back.
