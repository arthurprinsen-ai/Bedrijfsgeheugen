# Incident delivery ledger — Netlify session diagnostic

Obligation-ID: netlify-session-validation-evidence-20261019

Canonical incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4447
Live OIDC and provider 400 evidence: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39219312774

Existing v165 Edge Function returned HTTP 422 from a rejected provider HTTP 400 session; `NETLIFY_COMPOSIO_SESSION_VALIDATION` emitted an ambiguous TOOL_ALLOWLIST_INVALID after the per-tool filter had already been removed. No fallback Netlify provider side effect or production identity proof was observed.

Change: failure diagnostics only, mapped to safe field enums and booleans. Retain user/account/toolkit-bound session, strict GitHub OIDC claims, exact Netlify site and fail-closed production checks. Existing daily health probe and existing Powerhouse Growth & Revenue OS owner remain in place; no extra scheduled task.

Closure blocked pending exact live source/readback plus authenticated provider-result check. No success claim before independent evidence.
