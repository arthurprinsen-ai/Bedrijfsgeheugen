# Terminal release marker + mobile i18n fix — 25 September 2026

Production reached the exact Netlify commit, but terminal readback still failed for two independent reasons.

1. `release.json` carried the exact commit while final HTML retained an older `bg-release-commit` meta marker. The final release-evidence step now stamps all built HTML with the same exact commit ref.
2. The mobile language injector supported only `aside.v18-mobile-drawer`. Pricing can use the compact `#bgkopMob/.bgkop-mob` drawer, so the mobile pricing verifier could not find a visible language select. The injector now supports both canonical public mobile drawer variants.

Fail-closed English behavior remains unchanged. Production must still prove exact commit identity, pricing interactions and NL→EN→NL roundtrip.
