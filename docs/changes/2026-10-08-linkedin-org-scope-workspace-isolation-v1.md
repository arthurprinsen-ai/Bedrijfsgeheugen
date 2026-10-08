# LinkedIn company authorization: isolate Composio workspaces

On 8 October 2026, three ChatGPT/Composio LinkedIn organization-ACL probes returned HTTP 403 and required `r_organization_admin`, even though personal profile access worked. Nine ChatGPT-scoped LinkedIn connections reported ACTIVE. This does **not** invalidate the separate production Composio connection. The existing production Brain proof identified an independently bound organization-authorized account and the company's 8 October post was `LIVE_PROVEN`, with an exact LinkedIn provider URN.

## Failure modes

1. `ACTIVE` alone tests account identity, not company page privileges. Personal login cannot prove organization ACL read/write authority.
2. `create_link` previously preferred a saved auth-config ID without checking its declared scopes, potentially repeating the missing-scope OAuth grant indefinitely.
3. The final state write used `personalReady?'ACTIVE'` even when `companyReady=false`. This can mislead consumers of Brain current-state.
4. Chat connector accounts and production accounts must never be conflated, merged or silently substituted. One is an external observer of the other's production authority.

## Fix

- Reuse only LinkedIn auth configurations whose declared scopes satisfy `r_organization_admin` and `w_organization_social`, otherwise create a scope-requested config via the existing authorized production flow.
- Store an explicit `COMPANY_AUTH_REQUIRED` state for personal-only success, and the sanitized ACL probe outcome.
- Expose `connection_authority=production_composio_api_key` in current-state response, without leaking secrets.
- Preserve the current single-writer publisher and exact provider post readback. Do not start a parallel publisher, reconnect production gratuitously, or replay a proven post.

This repair **does not** grant LinkedIn permissions on the separate ChatGPT connection. Those permissions require an OAuth approval and a LinkedIn API product that supports the requested organization scopes.

## Evidence and terminal criteria

Production: `linkedin_company` and blog were recorded `LIVE_PROVEN` on 2026-10-08; `linkedin_personal` was blocked by `PERSONAL_SOURCE_UNVERIFIED` and Instagram by `MEDIA_ASSET_REQUIRED`. These are independent channel obligations.

Admission, Required tests, CodeQL, protected merge, deployed Edge function and canonical production readback must complete before declaring this code change live.
