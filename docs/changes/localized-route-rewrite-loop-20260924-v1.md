# Localized route rewrite loop — 24 September 2026

The production English route `/en/prijzen` returned an internal error after the interaction/i18n borging release.

Root cause: the explicit wildcard rewrite `/en/* -> /en/:splat.html` also matched the rewritten target `/en/prijzen.html`, recursively producing another target ending in `.html.html`. The same defect existed for `/nl/*`.

Fix: remove localized wildcard rewrites. The build already emits `en/prijzen.html` and `nl/prijzen.html`; Netlify pretty-URL resolution serves those clean routes directly. Only locale-root mappings remain explicit.

Prevention: never add a wildcard rewrite whose source also matches its own target. Production language-route proof must fetch and browser-navigate the clean localized route before terminal success.
