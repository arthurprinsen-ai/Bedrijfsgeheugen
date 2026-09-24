# 2026-09-24 — Pricing build parse production recovery

- Fingerprint: `pricing-build-parse-production-redeploy-20260924-v1`
- Source fix: PR #2764
- Fixed main SHA: `e223851136669000f1f58b6b1dadfe9e2f2adcc1`
- Reproduced root cause: JavaScript SyntaxError in `tools/site-shell/pricing-build-integrity.mjs`
- Netlify symptom: production build exit code 2
- Recovery: syntax regression + skill writeback + canonical production snapshot refresh
- Terminal state: pending provider deploy, exact SHA and browser readback
