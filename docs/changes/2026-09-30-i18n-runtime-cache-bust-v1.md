# Public i18n runtime cache rotation — 2026-09-30

Fingerprint: `i18n-runtime-cache-bust-v1`.

The public locale-navigation runtime was repaired, but the generated HTML still referenced the old versioned `i18n.js` URL. That allowed browser/CDN caches to keep serving the pre-fix behavior even after exact-main production promotion.

Recovery:
- rotate the canonical i18n asset version;
- keep the explicit route navigation behavior;
- require production readback to prove both the new asset identity and the NL→EN→NL interaction.
