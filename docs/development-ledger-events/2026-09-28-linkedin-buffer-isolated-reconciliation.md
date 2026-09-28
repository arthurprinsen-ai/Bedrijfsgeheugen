# 2026-09-28 — LinkedIn reconciliation / Buffer isolation

- **Fingerprint:** `linkedin-reconciliation-buffer-isolation-v1`
- **Signal:** existing LinkedIn provider URNs remained unresolved while the Buffer rate-limit circuit was open.
- **Root cause:** `reconcileExistingProviderTruth` was invoked only inside the Buffer-healthy branch.
- **Fix:** run reconciliation independently; use a nullable Buffer token and defer only Buffer-owned audit work.
- **Safety:** no replacement post is issued; existing LinkedIn URNs remain authoritative and `republish_forbidden` stays in force.
- **Regression:** `tests/brain-linkedin-composio-authority.test.mjs`.
