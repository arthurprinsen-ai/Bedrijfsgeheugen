# 2026-09-25 — Mira continuous human video policy v2

- Fingerprint: `mira-continuous-human-video-policy-v2`
- Recovery PR: #2866; supersedes #2677.
- Security hardening: revoke direct EXECUTE on the SECURITY DEFINER trigger function.
- Quality hardening: publication capability requires temporal continuity evidence and rejects slideshow/still-animation output.
- Regression: `tests/brain-mira-continuous-human-video-policy-v2.test.mjs`.
