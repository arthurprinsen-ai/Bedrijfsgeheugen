# 2026-10-15 — Composio content fallback JSON truncation recovery

- **Incident:** `linkedin_company` stuck in `decided`, with 16 failed generation attempts, latest `Unterminated string in JSON at position 677`.
- **Root cause:** Strict Composio/Groq JSON parser had no bounded retry for truncated model output. OpenAI primary already has a one-retry truncation path, but fallback did not.
- **Change:** Exactly one larger-budget retry for provider length truncation or incomplete JSON syntax; existing strict object validation, publication identity gates and recipient authorization remain unchanged.
- **Regression:** `tests/brain-content-artifact-incomplete-retry.test.mjs` asserts bounded fallback and fail-closed invariants.
- **Result:** Candidate change only until Required-CI, CodeQL, protected merge, Supabase production readback and actual provider confirmation complete.
- **Prevention:** Never report generated/delivered on JSON parse success alone, and never silently retry arbitrary malformed, schema-invalid or editorially rejected content.
