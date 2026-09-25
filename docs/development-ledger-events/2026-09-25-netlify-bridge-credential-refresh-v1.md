# 2026-09-25 — Netlify bridge credential refresh v1

Observed:
- exact-main production snapshot run `36153925428` packaged SHA `45fa0e9de88934b8e990e894f07a59507f4bd404`;
- the Netlify exact-source upload failed with HTTP 401 Unauthorized;
- current product/i18n code was not implicated;
- the canonical bridge credential was refreshed before this retrigger.

Recovery:
- preserve the exact-source production path;
- retrigger one protected `main` push;
- require production SHA parity plus pricing/NL-EN browser proof before terminal closure.
