# Terminal release marker + mobile i18n fix — 25 September 2026

Production reached the exact Netlify commit, but terminal readback initially failed for two independent reasons.

1. `release.json` carried the exact commit while final HTML retained an older `bg-release-commit` meta marker. The final release-evidence step stamps all built HTML with the same exact commit ref.
2. The mobile language injector supported only `aside.v18-mobile-drawer`. Pricing can use the compact `#bgkopMob/.bgkop-mob` drawer, so the mobile pricing verifier could not find a visible language select.

## Revision 2 — build-script syntax recovery

The first compact-drawer repair accidentally embedded a second `function injectMobileLanguage(...)` body inside a single-quoted replacement string in `tools/site-shell/apply-i18n.mjs`. Both the Git-linked deploy `6ab69bce0feb69f4c4e7499e` and the canonical exact-source deploy `6ab69c0ba6e5f541bdceaee8` therefore failed during the Netlify build with exit code 2.

The repair uses a replacement callback:

`html.replace(cta, match => MOBILE_LANGUAGE + match)`

and adds an executable regression that:
- runs `node --check tools/site-shell/apply-i18n.mjs`;
- executes the transformer against a temporary compact `#bgkopMob` fixture;
- proves one mobile language control is injected before the CTA;
- proves the i18n asset is injected exactly once.

Fail-closed English behavior remains unchanged. Production must still prove exact commit identity, successful provider build, pricing interactions and NL→EN→NL roundtrip.
