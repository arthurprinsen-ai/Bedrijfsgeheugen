# 2026-09-25 — Netlify production build parity v1

Observed:
- GitHub website validation green;
- linked Netlify production build for current main failed with exit code 2;
- GitHub website composer omitted production build stages.

Permanent repair:
- add exact Netlify production build parity job to website lane;
- include pricing capture/restore, apply-i18n, localized routes, sitemap and release evidence;
- keep production readback and browser proof as terminal gates.
