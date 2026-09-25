# 2026-09-25 — Static i18n cache completeness recovery

- Obligation: `static-i18n-cache-complete-20260925-v1`
- Root cause: production composition exposed 1,926 Dutch strings absent from the immutable English cache.
- Failed provider deploy: `6ab68cc1620347dff3081d39`.
- Recovery evidence: GitHub run `36153434965` generated the missing cache and passed offline completeness validation.
- Production invariant retained: `STATIC_I18N_NETWORK=0`, `STATIC_I18N_REQUIRE_CACHE=1`.
- Prevention: validate cache against the exact post-composition public route surface before production promotion.
- Terminal closure requires protected merge, exact-main Netlify deployment identity and NL/EN functional readback.
