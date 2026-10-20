# Netlify Composio session validation activity

Obligation: netlify-composio-session-400-20261019
Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4447

At 2026-10-19 07:42 UTC, after Edge Function v163 pagination release, GitHub OIDC authorized a health-only request. The function found a valid active Netlify account in a 2-page (54-record) scan. Composio session creation returned HTTP 400; the bridge mapped it to 422. No provider build or production deploy occurred.

Changed session creation to preserve user/toolkit/account scoping while not imposing a redundant tool slug filter at session initialization, which may be incompatible with current MCP router validation. The sole subsequent execution remains hardcoded. Added fail-closed sanitized error categorization and regression.

Status: candidate awaiting protected CI, squash merge, Supabase version readback, OIDC health and provider release verification. No claim of fixed Netlify fallback yet.
