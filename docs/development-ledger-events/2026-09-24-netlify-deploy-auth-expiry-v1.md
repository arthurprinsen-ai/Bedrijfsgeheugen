# 2026-09-24 — Netlify deploy auth expiry

Evidence:
- workflow run: `35974869594`
- job: `107552867268`
- step: `Deploy exact source through authorized Netlify transport`
- result: `401 Unauthorized`

Action:
- add canonical Brain learning `netlify-deploy-auth-expiry-20260924-v1`;
- add regression coverage;
- shorten pre-fallback Git-linked wait so invalid auth is surfaced sooner;
- preserve fail-closed live-proof rules.
