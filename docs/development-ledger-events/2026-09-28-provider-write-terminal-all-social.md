# 2026-09-28 — FALSE_FAILURE — Provider side-effect terminality across social

- **Fingerprint:** `provider-write-terminal-all-social-v1`
- **Affected channels:** LinkedIn personal, LinkedIn company, Instagram company.
- **Observed:** existing provider IDs were present, yet later auth/readback/media checks could return obligations to BLOCKED.
- **Risk:** unnecessary OAuth recovery, duplicate/replacement publication, false daily failure reporting.
- **Fix:** provider-created or provider-truth-verified external IDs are terminal publication evidence.
- **Non-retroactive rule:** later auth/readback/media-policy failures apply only to verification/future writes, never to the existing published object.
- **Anti-duplicate rule:** exact-ID reconciliation only; `republish_forbidden=true`.
- **Regression:** `tests/brain-linkedin-composio-authority.test.mjs`.
