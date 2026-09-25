# 2026-09-25 — LinkedIn republish-forbidden claim preservation

- Fingerprint: `linkedin-republish-forbidden-preservation-v1`
- Risk found: a later orchestrator reconciliation could re-decide a blocked ambiguous daily claim because blocked state alone was not covered by `shouldPreserveExisting`.
- Production containment: the 2026-09-25 personal LinkedIn claim and obligation are explicitly marked `republish_forbidden=true` and `possible_provider_side_effect=true`.
- Code prevention: preserve any claim with republish-forbidden, possible provider side effect, or provider-create success plus exact delivery reference.
- Duplicate policy: uncertain provider truth is never equivalent to safe-to-retry.
- LinkedIn transport remains Composio-only; Buffer is never a replacement route.
