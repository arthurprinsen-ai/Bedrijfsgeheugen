# 2026-09-25 — i18n active mobile host production recovery

Observed:
- exact-main production deploy succeeded;
- pricing content and exact production identity were proven;
- final Playwright readback failed because no visible mobile language select existed in the active drawer.

Root cause:
- the runtime mounted the language control into one discovered mobile root only;
- pages can contain a hidden shared mobile root plus the active `#bgkopMob` drawer.

Repair:
- mount idempotently into every distinct mobile navigation host;
- verify the actually visible mobile control;
- prove NL→EN→NL on `/`, `/prijzen` and `/systemen-koppelen`.
