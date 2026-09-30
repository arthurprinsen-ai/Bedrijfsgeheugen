# Public locale click ownership — 2026-09-30

Fingerprint: `i18n-window-capture-navigation-v1`.

The live English route and static href were already correct, but the mobile navigation has its own document-level capture handler while the i18n click handler ran later in bubbling phase. That made event ownership non-deterministic.

Recovery:
- move language-option click ownership to `window` capture phase;
- stop competing menu handlers for that click;
- navigate explicitly to the same-route localized URL;
- keep semantic hrefs for SEO/no-JS;
- rotate the runtime asset identity to `cms-i18n-20260930-2`.
