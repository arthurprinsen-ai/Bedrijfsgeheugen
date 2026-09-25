# 2026-09-25 — Netlify OIDC proxy 401 recovery

Observed:
- Production Source Snapshot run 36153925428 verified exact source SHA 45fa0e9de88934b8e990e894f07a59507f4bd404.
- OIDC bridge acquisition succeeded.
- linked build trigger returned ok=false.
- exact-source Netlify upload failed with HTTP 401 Unauthorized.

Recovery:
- classify as deploy-transport authentication failure, not i18n/application failure;
- trigger a real website-source Git build through the linked repository path;
- retain exact production SHA and browser interaction proof as terminal requirements.

Prevention:
- bridge acquisition success is not upload-authorization proof;
- stale ready production may never satisfy terminal delivery.
