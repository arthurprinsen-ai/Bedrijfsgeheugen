# Exporter service-auth matrix — 2026-10-29

- Canonical incident: `SEC-2026-10-29-TWINFIELD-EXPOSURE`; existing GitHub issue #5072.
- Scope: read-only authenticated negative/positive live testing within `.github/workflows/powerhouse-daily-blog.yml`.
- No additional scheduler, publisher, secret, credential output or public draft is introduced.
- Precondition: GitHub secret metadata exists; its actual validity is not established.
- Authorization cases: 401 anonymous, 403 no last-mile approval on 2026-10-28 and 2026-10-22, 200 approved 2026-10-25.
- Distinct security job skips all publisher actions. Only after protected CI, merge and actual runner confirmation may the matrix be considered verified.
- Private P0 investigation remains OPEN.
