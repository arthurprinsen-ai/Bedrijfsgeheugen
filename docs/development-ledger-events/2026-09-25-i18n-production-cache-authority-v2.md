# Development ledger — i18n production cache authority v2

- Date: 2026-09-25
- Failure class: deterministic build input stored in mutable cache location / production provider dependency.
- Transport proof: GitHub OIDC bridge and Netlify linked build trigger were successful.
- Provider symptom: linked Netlify site build returned non-zero exit code 2.
- Production before recovery: commit `f45ad02f8f719958c00b7ff8e39e3ca2104353b1`.
- Canonical translation artifact: `config/bg-static-i18n-en.json`.
- Blob: `63d4e10854c4ddbfa1300fbb5186d8392ec7abfd`.
- Build policy: cache-only, fail-closed, no live provider dependency.
- Regression: `tests/brain-static-i18n-versioned-cache-v1.test.mjs`.
- Terminal state: pending protected merge + exact production deploy/readback.
