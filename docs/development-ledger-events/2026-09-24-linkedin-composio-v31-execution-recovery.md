# 2026-09-24 — LinkedIn Composio v3.1 execution recovery

Fingerprint: `linkedin|composio-v31|structured-arguments|post-create-readback-containment|v1`

## Event
LinkedIn publishing via Composio was migrated from the legacy text execution contract to the v3.1 structured execution contract.

## Root cause
The production publisher used `connected_account_id + version + text` and omitted the Composio `user_id`. In addition, a successful LinkedIn create followed by a readback permission error was previously handled as a generic failure, even though a provider-side post could already exist.

## Fix
The LinkedIn path now uses `connected_account_id`, canonical `user_id`, `version: latest` and structured `arguments`. Organization publishing uses the verified company author URN. A real post URN returned by CREATE is treated as an irreversible side effect: `republish_forbidden=true`. Readback failure after create transitions to `DISPATCHED` / `verification_pending`, not a retryable publication failure.

## Prevention
- No LinkedIn Buffer fallback.
- Never replace an exact daily claim after provider create success.
- Regression coverage locks the structured Composio execution shape.
- Provider truth and provider create success remain separate facts.
- Exact readback may upgrade DISPATCHED to PUBLISHED, but inability to read must never trigger a second post.

## Evidence
PR #2697; Supabase canonical LinkedIn setup state; company author `urn:li:organization:18234216`; OAuth scopes `r_organization_admin` and `w_organization_social` verified on 2026-09-24.
