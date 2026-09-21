# Activity event — global i18n V18 mobile menu recovery

- **Fingerprint:** `global-i18n-v18-mobile-menu-mount-v1`
- **Obligation:** `global-nl-en-i18n-v1`
- **Date:** 2026-09-21
- **Actor:** Powerhouse website delivery recovery
- **Scope:** public website mobile navigation and NL/EN runtime
- **Observed failure:** production mobile menu opened successfully but contained no language selector.
- **Root cause:** i18n targeted the older shared-mobile selector while the active production V18 drawer uses `data-bg-mobile-view="root"`.
- **Recovery:** mount into the active V18 root, retain migration compatibility, remount idempotently when dynamic navigation appears, and keep the selector inside navigation rather than in the floating WhatsApp/content layer.
- **Evidence:** `assets/js/i18n.js`, `assets/js/v18-mobile-drilldown.js`, `assets/v18-mobile-drilldown.css`, `tests/site-shell-global-i18n.test.mjs`, PR #2537.
- **Prevention:** every global UI control must be verified against the canonical runtime DOM used in production, not only a legacy or generated shell.
- **Terminal state:** recovery code is merged; same-lineage writeback and exact production readback must close before terminal success.
