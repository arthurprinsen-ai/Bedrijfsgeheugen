# 2026-09-25 — LinkedIn Composio chain provider isolation

- Fingerprint: linkedin-composio-chain-provider-isolation-v1
- Symptom: LinkedIn personal/company decisions existed but no artifacts were generated.
- Production evidence: repeated artifact-ai:AI_PROVIDER_REQUEST_FAILED health events through the morning.
- Root cause A: content AI errors hid HTTP status/model, preventing autonomous diagnosis.
- Root cause B: legacy Buffer sync remained an uncontained supervisor call even though LinkedIn publication authority is Composio.
- Fix: safe provider diagnostics + timeout; Buffer sync made non-blocking; LinkedIn remains Composio-only and fail-closed.
- Duplicate prevention: unchanged single-writer capability/claim barrier and exact post-URN readback.
- Company scope: missing LinkedIn organization-admin permission is surfaced as a hard boundary; never substituted with Buffer.
- Production status: pending protected merge, Edge Function deployment, current-day artifact recovery, and provider readback.

- Post-deploy diagnostic narrowed the generation failure to Anthropic HTTP 400. Added bounded, sanitized provider type/message logging so the request-shape error can be repaired without exposing prompts, source data or secrets.
