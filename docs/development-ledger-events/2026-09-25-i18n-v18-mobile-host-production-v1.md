# 2026-09-25 — NL/EN runtime asset completeness

Observed:
- exact-main Netlify production deployment succeeded;
- pricing content proof succeeded;
- the production browser opened the active mobile navigation;
- browser diagnostics still showed `v18Selects=0`, `legacySelects=0`, `sharedSelects=0`, `allSelects=0`;
- direct production HTML inspection of `/prijzen` showed `assets/i18n.css` present but `assets/js/i18n.js` absent.

Primary root cause:
- `tools/site-shell/apply-i18n.mjs` used one shared `data-bg-i18n-asset` marker as an all-assets completeness guard;
- an existing CSS marker caused an early return, suppressing the missing runtime script and mobile-control injection.

Secondary runtime requirement:
- `assets/js/i18n.js::mountControl()` must treat `#v18MobileDrawer` as a first-class mobile host, while preserving generic and legacy hosts.

Permanent prevention:
- detect/inject CSS and JavaScript independently;
- always execute idempotent mobile-control injection after asset reconciliation;
- require the final served production HTML to contain both assets;
- require the visible active mobile selector and NL → EN → NL browser roundtrip;
- never infer frontend capability completeness from Netlify `state=ready` or exact `commit_ref` alone.

Machine-enforced evidence:
- `tests/brain-i18n-asset-independent-injection-v1.test.mjs`;
- `tests/brain-i18n-v18-mobile-host-v1.test.mjs`;
- `tools/site-shell/verify-pricing-i18n-production.mjs`.

Canonical fingerprint: `i18n-runtime-asset-independent-presence-v1`.
